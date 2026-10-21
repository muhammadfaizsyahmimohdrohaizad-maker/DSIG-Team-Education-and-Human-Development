-- CareerPrep: accounts and everything a user does. Reference data (modules, skills, occupations,
-- lessons) ships with the app in content/ and is read-only, so it is not stored here.
-- Paste this whole file into Supabase > SQL Editor and press Run. It is safe to run once on an empty project.

-- ---------------------------------------------------------------- tables

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'student' check (role in ('student', 'adviser', 'institution')),
  full_name text not null check (char_length(full_name) between 1 and 120),
  email text,
  semester int check (semester between 1 and 8),
  unit text,                                   -- staff only, e.g. "Career Services"
  target_code text,                            -- MASCO 2020 code the student chose
  adviser_id uuid references public.profiles (id) on delete set null,
  plan_built boolean not null default false,
  nda_accepted_at timestamptz,                 -- staff confidentiality undertaking
  created_at timestamptz not null default now()
);

-- Append-only: every consent decision is a new row, so the history is the record.
create table public.consents (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  processing boolean not null,
  ai_processing boolean not null,
  booking_emails boolean not null,
  adviser_visibility boolean not null,
  under_18 boolean not null default false,
  parental_consent boolean not null default false,
  notice_version text not null,
  created_at timestamptz not null default now()
);

create table public.student_modules (
  student_id uuid not null references public.profiles (id) on delete cascade,
  module_id text not null,
  primary key (student_id, module_id)
);

create table public.gap_ratings (
  student_id uuid not null references public.profiles (id) on delete cascade,
  skill_id text not null,
  rating int not null check (rating between 1 and 5),
  primary key (student_id, skill_id)
);

create table public.review_states (
  student_id uuid not null references public.profiles (id) on delete cascade,
  item_id text not null,
  card jsonb not null,
  due timestamptz not null,
  updated_at timestamptz not null default now(),
  primary key (student_id, item_id)
);

create table public.mastery (
  student_id uuid not null references public.profiles (id) on delete cascade,
  skill_id text not null,
  score int not null,
  total int not null,
  passed boolean not null,
  taken_at timestamptz not null default now(),
  primary key (student_id, skill_id)
);

create table public.weak_areas (
  student_id uuid not null references public.profiles (id) on delete cascade,
  item_id text not null,
  created_at timestamptz not null default now(),
  primary key (student_id, item_id)
);

create table public.interview_answers (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  question_id text not null,
  text text not null check (char_length(text) <= 5000),
  feedback jsonb,                              -- AI-written feedback once it is ready
  needs_adviser boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  adviser_id uuid references public.profiles (id) on delete set null,
  slot text not null check (slot ~ '^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$'),
  status text not null default 'requested'
    check (status in ('requested', 'accepted', 'declined', 'completed', 'cancelled')),
  note text check (char_length(note) <= 1000),
  cancel_reason text,
  cancelled_by text check (cancelled_by in ('student', 'adviser')),
  changed_since_viewed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles (id) on delete cascade,
  action text not null,
  detail jsonb,
  created_at timestamptz not null default now()
);

create index on public.bookings (adviser_id);
create index on public.bookings (student_id);
create index on public.interview_answers (student_id, created_at);
create index on public.profiles (adviser_id);

-- ---------------------------------------------------------------- helpers

create or replace function public.is_service() returns boolean
language sql stable as $$ select coalesce(auth.jwt() ->> 'role', '') = 'service_role' $$;

create or replace function public.my_role() returns text
language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.my_adviser_id() returns uuid
language sql stable security definer set search_path = public as $$
  select adviser_id from public.profiles where id = auth.uid()
$$;

create or replace function public.staff_ready() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role in ('adviser', 'institution') and nda_accepted_at is not null)
$$;

-- A new auth user gets a student profile. Only the server (service role) can make someone staff.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, email, semester)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), split_part(new.email, '@', 1)),
    new.email,
    nullif(new.raw_user_meta_data ->> 'semester', '')::int
  );
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Users may edit their own name, semester, target and plan flag. Role, adviser and the NDA
-- timestamp change only through the functions below or the service role.
create or replace function public.guard_profile() returns trigger
language plpgsql as $$
begin
  -- The service role and the security-definer functions below (which run as the owner) may.
  if public.is_service() or current_user not in ('authenticated', 'anon') then return new; end if;
  if new.role is distinct from old.role or new.adviser_id is distinct from old.adviser_id
     or new.nda_accepted_at is distinct from old.nda_accepted_at or new.email is distinct from old.email then
    raise exception 'Only the system can change role, adviser, email or NDA fields';
  end if;
  return new;
end $$;

create trigger guard_profile before update on public.profiles
  for each row execute function public.guard_profile();

-- Booking state machine (docs/09-system-modelling.md figure 9.13), enforced in the database too.
create or replace function public.guard_booking() returns trigger
language plpgsql as $$
declare actor text;
begin
  if public.is_service() or current_user not in ('authenticated', 'anon') then return new; end if;
  if auth.uid() = old.student_id then actor := 'student';
  elsif auth.uid() = old.adviser_id then actor := 'adviser';
  else raise exception 'Not your booking'; end if;

  if new.student_id <> old.student_id or new.adviser_id is distinct from old.adviser_id or new.created_at <> old.created_at then
    raise exception 'Those fields cannot change';
  end if;

  if actor = 'adviser' then
    if new.slot <> old.slot or new.note is distinct from old.note then
      raise exception 'Advisers can change only the status';
    end if;
    if not ((old.status = 'requested' and new.status in ('accepted', 'declined'))
         or (old.status = 'accepted' and new.status = 'completed')
         or (old.status = 'accepted' and new.status = 'cancelled' and coalesce(trim(new.cancel_reason), '') <> '')) then
      raise exception 'That change is not allowed';
    end if;
    new.cancelled_by := case when new.status = 'cancelled' then 'adviser' else null end;
    new.changed_since_viewed := true;
  else
    if new.status = old.status then
      -- Viewing clears the update marker; a waiting request can get a new slot or note.
      if (new.slot <> old.slot or new.note is distinct from old.note) and old.status <> 'requested' then
        raise exception 'Only a waiting request can be edited';
      end if;
      if new.cancel_reason is distinct from old.cancel_reason then raise exception 'Not allowed'; end if;
    elsif not (old.status in ('requested', 'accepted') and new.status = 'cancelled') then
      raise exception 'Students can only cancel';
    else
      new.cancelled_by := 'student';
      new.cancel_reason := null;
    end if;
    if new.changed_since_viewed and not old.changed_since_viewed then raise exception 'Not allowed'; end if;
  end if;
  new.updated_at := now();
  return new;
end $$;

create trigger guard_booking before update on public.bookings
  for each row execute function public.guard_booking();

-- ---------------------------------------------------------------- functions the app calls

-- Gives the student an adviser the first time they ask for one.
create or replace function public.ensure_adviser() returns uuid
language plpgsql security definer set search_path = public as $$
declare a uuid;
begin
  select adviser_id into a from profiles where id = auth.uid() and role = 'student';
  if a is null then
    select id into a from profiles where role = 'adviser' order by created_at limit 1;
    if a is not null then update profiles set adviser_id = a where id = auth.uid(); end if;
  end if;
  return a;
end $$;

-- Staff accept the confidentiality undertaking once; the acceptance is logged.
create or replace function public.accept_staff_undertaking(version text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if public.my_role() not in ('adviser', 'institution') then raise exception 'Staff only'; end if;
  update profiles set nda_accepted_at = now() where id = auth.uid();
  insert into audit_log (actor_id, action, detail) values (auth.uid(), 'staff_undertaking_accepted', jsonb_build_object('version', version));
end $$;

-- What an adviser sees: their own students who allow it, read-only, with a feedback summary only.
create or replace function public.adviser_roster()
returns table (student_id uuid, full_name text, semester int, target_code text, modules text[], ratings jsonb, feedback_summary text, needs_adviser boolean)
language sql stable security definer set search_path = public as $$
  select p.id, p.full_name, p.semester, p.target_code,
    coalesce((select array_agg(m.module_id) from student_modules m where m.student_id = p.id), '{}'),
    coalesce((select jsonb_object_agg(g.skill_id, g.rating) from gap_ratings g where g.student_id = p.id), '{}'::jsonb),
    (select a.feedback ->> 'nextStep' from interview_answers a where a.student_id = p.id and a.feedback is not null order by a.created_at desc limit 1),
    exists (select 1 from interview_answers a where a.student_id = p.id and a.needs_adviser)
  from profiles p
  where p.adviser_id = auth.uid() and p.role = 'student' and public.staff_ready() and public.my_role() = 'adviser'
    and coalesce((select c.adviser_visibility from consents c where c.user_id = p.id order by c.created_at desc limit 1), false)
  order by p.full_name
$$;

-- What the institution sees: one anonymous row per consenting student. The app adds them up
-- and hides any group smaller than 5.
create or replace function public.cohort_rows()
returns table (target_code text, modules text[], ratings jsonb)
language sql stable security definer set search_path = public as $$
  select p.target_code,
    coalesce((select array_agg(m.module_id) from student_modules m where m.student_id = p.id), '{}'),
    coalesce((select jsonb_object_agg(g.skill_id, g.rating) from gap_ratings g where g.student_id = p.id), '{}'::jsonb)
  from profiles p
  where p.role = 'student' and public.staff_ready() and public.my_role() = 'institution'
    and coalesce((select c.processing from consents c where c.user_id = p.id order by c.created_at desc limit 1), false)
$$;

-- Delete my data: removing the auth user cascades to every row the user owns.
create or replace function public.delete_my_account() returns void
language plpgsql security definer set search_path = public, auth as $$
begin
  delete from auth.users where id = auth.uid();
end $$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
revoke all on function public.adviser_roster() from public, anon;
grant execute on function public.adviser_roster() to authenticated;
revoke all on function public.cohort_rows() from public, anon;
grant execute on function public.cohort_rows() to authenticated;
revoke all on function public.ensure_adviser() from public, anon;
grant execute on function public.ensure_adviser() to authenticated;
revoke all on function public.accept_staff_undertaking(text) from public, anon;
grant execute on function public.accept_staff_undertaking(text) to authenticated;

-- ---------------------------------------------------------------- row-level security

alter table public.profiles enable row level security;
alter table public.consents enable row level security;
alter table public.student_modules enable row level security;
alter table public.gap_ratings enable row level security;
alter table public.review_states enable row level security;
alter table public.mastery enable row level security;
alter table public.weak_areas enable row level security;
alter table public.interview_answers enable row level security;
alter table public.bookings enable row level security;
alter table public.audit_log enable row level security;

create policy "own profile" on public.profiles for select using (id = auth.uid());
create policy "my adviser's name" on public.profiles for select using (id = public.my_adviser_id());
create policy "students who booked me" on public.profiles for select
  using (public.staff_ready() and exists (select 1 from public.bookings b where b.student_id = profiles.id and b.adviser_id = auth.uid()));
create policy "edit own profile" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());

create policy "own consents" on public.consents for select using (user_id = auth.uid());
create policy "add own consent" on public.consents for insert with check (user_id = auth.uid());

create policy "own modules" on public.student_modules for all using (student_id = auth.uid()) with check (student_id = auth.uid());
create policy "own ratings" on public.gap_ratings for all using (student_id = auth.uid()) with check (student_id = auth.uid());
create policy "own reviews" on public.review_states for all using (student_id = auth.uid()) with check (student_id = auth.uid());
create policy "own mastery" on public.mastery for all using (student_id = auth.uid()) with check (student_id = auth.uid());
create policy "own weak areas" on public.weak_areas for all using (student_id = auth.uid()) with check (student_id = auth.uid());
create policy "own answers" on public.interview_answers for all using (student_id = auth.uid()) with check (student_id = auth.uid());

create policy "own bookings" on public.bookings for select using (student_id = auth.uid());
create policy "request a booking" on public.bookings for insert
  with check (student_id = auth.uid() and status = 'requested' and adviser_id = public.my_adviser_id());
create policy "change own booking" on public.bookings for update using (student_id = auth.uid());
create policy "adviser sees bookings" on public.bookings for select using (adviser_id = auth.uid() and public.staff_ready());
create policy "adviser updates status" on public.bookings for update using (adviser_id = auth.uid() and public.staff_ready());

create policy "own audit" on public.audit_log for select using (actor_id = auth.uid());
create policy "write own audit" on public.audit_log for insert with check (actor_id = auth.uid());
