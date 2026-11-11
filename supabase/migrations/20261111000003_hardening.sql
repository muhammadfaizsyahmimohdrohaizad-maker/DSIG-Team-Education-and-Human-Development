-- Hardening of the first two migrations after the sprint 1 DBA review (System Design 3 and 5.2).
-- Forward-only: every change here is an ALTER, a DROP of a policy we replace, or a new object.
--
-- What this fixes:
--  1. Grants. Supabase grants ALL on new public tables and functions to anon and authenticated. Policies had no
--     TO clause, so they also applied to anon. anon now has nothing in public; writes the API must not make
--     (scores, history, audit, consents edits) are revoked from authenticated as well as blocked by RLS.
--  2. Under-18 lock: own_rows checked is_unlocked() on read but not on INSERT (WITH CHECK), so a locked
--     account could still write rows.
--  3. Answer keys: ref.check_questions.answer_key was readable by every student.
--  4. Students could set skill_progress.state = 'mastered' without passing a check (A2, threat "tampering").
--  5. Students could insert availability slots and blocked days (WITH CHECK had no role test).
--  6. Adviser branches of booking history and feedback reads skipped the undertaking check.
--  7. Server-set times (consented_at, done_at) could be chosen by the client.
--  8. Profiles had no programme or semester (FR-PRO-01, adviser boards).
--     (Profiles and parent decisions are written by the server with the service role; see server/data/README.md.
--     The bookings.slot_id cascade and blocked_days.reason come with the booking functions in 000005.)
--  9. Helper functions had a mutable search_path.

-- ---------------------------------------------------------------------------------------------------------
-- 1. Columns and constraints
-- ---------------------------------------------------------------------------------------------------------
alter table public.profiles
  add column programme   text check (char_length(programme) between 2 and 120),
  add column semester    smallint check (semester between 1 and 12),
  add column institution text check (char_length(institution) between 2 and 120),
  add column staff_unit  text check (char_length(staff_unit) between 2 and 80);
comment on column public.profiles.programme is 'Programme name without the level, e.g. Software Engineering';
comment on column public.profiles.staff_unit is 'Advisers only, e.g. Career services. Set by the server.';

alter table public.bookings add constraint bookings_topic_length check (char_length(topic) between 1 and 120);

alter table public.interview_answers add constraint interview_marks_valid check (
  marks ?& array['structure','accuracy','evidence']
  and (marks->>'structure')::int between 0 and 2
  and (marks->>'accuracy')::int  between 0 and 2
  and (marks->>'evidence')::int  between 0 and 1
);

-- Two writes in one transaction share now(); clock time keeps "latest" well defined.
alter table public.consents       alter column consented_at set default clock_timestamp();
alter table public.mastery_checks alter column taken_at     set default clock_timestamp();

-- ---------------------------------------------------------------------------------------------------------
-- 2. Helper functions (fixed search_path; used by policies, so authenticated may execute them)
-- ---------------------------------------------------------------------------------------------------------
create or replace function public.app_role() returns text
language sql stable set search_path = '' as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '')
$$;

create or replace function public.is_unlocked() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce((select not p.account_locked from public.profiles p where p.user_id = auth.uid()), false)
$$;

create or replace function public.has_current_undertaking(uid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select uid = auth.uid() and exists (
    select 1 from public.staff_undertakings u
    where u.adviser_id = uid
      and u.version = (select s.value from public.app_settings s where s.key = 'undertaking_version')
  )
$$;

-- Slot ownership and booking lookups as SECURITY DEFINER, so policies on bookings and slots
-- can refer to each other without recursing through RLS.
create function public.my_slot(p_slot uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.availability_slots s where s.id = p_slot and s.adviser_id = auth.uid())
$$;

create function public.booked_by_me(p_slot uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.bookings b where b.slot_id = p_slot and b.student_id = auth.uid())
$$;

create function public.slot_has_bookings(p_slot uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.bookings b where b.slot_id = p_slot)
$$;

-- Latest choice for one consent kind. If two rows share the newest time, every one of them must say yes.
-- Internal: takes any user id, so it is not granted to API roles.
create function public.latest_consent(p_user uuid, p_kind public.consent_kind) returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce((
    select bool_and(c.given) from public.consents c
    where c.user_id = p_user and c.kind = p_kind
      and c.consented_at = (select max(c2.consented_at) from public.consents c2 where c2.user_id = p_user and c2.kind = p_kind)
  ), false)
$$;

-- A2 skill status for every essential skill of the student's target job. Internal, like latest_consent.
create function public.student_skill_states(p_user uuid)
returns table (skill_uri text, label text, state public.skill_state)
language sql stable security definer set search_path = '' as $$
  select os.uri, s.label_en,
    (case
      when exists (select 1 from public.mastery_checks m where m.user_id = p_user and m.skill_uri = os.uri and m.score >= 4) then 'mastered'
      when coalesce(sp.claimed, false) then 'check_needed'
      when sp.state = 'learning' or exists (
        select 1 from public.lesson_progress lp join ref.lessons l on l.id = lp.lesson_id
        where lp.user_id = p_user and l.skill_uri = os.uri and lp.done_at is not null) then 'learning'
      when os.uri = any (p.skills) or sp.state = 'have' then 'have'
      else 'missing'
    end)::public.skill_state
  from public.profiles p
  join ref.occupation_skills os on os.code = p.target_occupation and os.essential
  join ref.skills s on s.uri = os.uri
  left join public.skill_progress sp on sp.user_id = p_user and sp.skill_uri = os.uri
  where p.user_id = p_user
  order by s.label_en
$$;

-- ---------------------------------------------------------------------------------------------------------
-- 3. Integrity triggers
-- ---------------------------------------------------------------------------------------------------------
-- Times the data dictionary says the server sets. Requests through the API run as anon or authenticated.
create function public.server_time_consent() returns trigger language plpgsql set search_path = '' as $$
begin
  if current_user in ('anon', 'authenticated') then new.consented_at := clock_timestamp(); end if;
  return new;
end $$;
create trigger consents_server_time before insert on public.consents
  for each row execute function public.server_time_consent();

create function public.server_time_lesson_done() returns trigger language plpgsql set search_path = '' as $$
begin
  if current_user in ('anon', 'authenticated') and new.done_at is not null
     and (tg_op = 'INSERT' or old.done_at is distinct from new.done_at) then
    new.done_at := clock_timestamp();
  end if;
  return new;
end $$;
create trigger lesson_done_server_time before insert or update on public.lesson_progress
  for each row execute function public.server_time_lesson_done();

-- A skill reaches mastered only through a passed check (analysis 4.12).
create function public.guard_mastered() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.state = 'mastered' and (tg_op = 'INSERT' or old.state is distinct from 'mastered')
     and not exists (select 1 from public.mastery_checks m
                     where m.user_id = new.user_id and m.skill_uri = new.skill_uri and m.score >= 4) then
    raise exception 'mastered_needs_passed_check' using errcode = '42501';
  end if;
  return new;
end $$;
create trigger skill_progress_mastered_guard before insert or update on public.skill_progress
  for each row execute function public.guard_mastered();

-- ---------------------------------------------------------------------------------------------------------
-- 4. Table privileges
-- ---------------------------------------------------------------------------------------------------------
revoke all on all tables in schema public from anon;
revoke all on all sequences in schema public from anon;
alter default privileges in schema public revoke all on tables from anon;
alter default privileges in schema public revoke all on sequences from anon;
alter default privileges in schema public revoke execute on functions from anon, public;

-- TRUNCATE ignores RLS; nobody on the API needs it.
revoke truncate, references, trigger on all tables in schema public from authenticated;

-- Written only by the server or by the functions in the next migration.
revoke insert, update, delete on public.profiles, public.consents, public.parent_approvals,
  public.staff_undertakings, public.app_settings, public.mastery_checks, public.interview_answers,
  public.bookings, public.booking_status_history, public.adviser_feedback, public.audit_log
  from authenticated;
grant insert on public.consents to authenticated;

-- Profiles: name and study details only; role, age, lock and login time stay server-set.
revoke update on public.profiles from authenticated;
grant update (full_name, education_level, spm_grades, module_ids, skills, interests, job_in_mind,
              target_occupation, locale, programme, semester)
  on public.profiles to authenticated;

-- Parent approvals: the student may see the request, never the token hash.
revoke select on public.parent_approvals from authenticated;
grant select (user_id, parent_email, expires_at, decision, decided_at) on public.parent_approvals to authenticated;

-- Slots: advisers add, open/close and remove; moving a slot's time would move a student's booking.
revoke update on public.availability_slots from authenticated;
grant update (is_open) on public.availability_slots to authenticated;

-- Reference data: everything except the answer keys (the server marks checks from content/lessons).
grant usage on schema ref to service_role;
grant all on all tables in schema ref to service_role;
revoke select on ref.check_questions from authenticated;
grant select (id, lesson_id, prompt, options) on ref.check_questions to authenticated;

-- 5 s statement timeout on the API role (System Design 2.5).
alter role authenticated set statement_timeout = '5s';

-- ---------------------------------------------------------------------------------------------------------
-- 5. Policies: all scoped to authenticated; anon has none.
-- ---------------------------------------------------------------------------------------------------------
alter policy own_profile_read   on public.profiles to authenticated;
alter policy own_profile_update on public.profiles to authenticated;

do $$ declare t text; begin
  foreach t in array array['profile_sessions','projects','saved_study_options','skill_progress','lesson_progress','review_cards']
  loop
    execute format('alter policy own_rows on public.%I to authenticated
      using (user_id = (select auth.uid()) and public.is_unlocked())
      with check (user_id = (select auth.uid()) and public.is_unlocked())', t);
  end loop;
end $$;

alter policy own_checks_read      on public.mastery_checks     to authenticated;
alter policy own_answers_read     on public.interview_answers  to authenticated;
alter policy own_consents_read    on public.consents           to authenticated;
alter policy own_consents_add     on public.consents           to authenticated;
alter policy own_undertaking_read on public.staff_undertakings to authenticated;
alter policy settings_read        on public.app_settings       to authenticated;
alter policy audit_institution_read on public.audit_log        to authenticated;
alter policy student_bookings     on public.bookings           to authenticated;

create policy own_parent_approval_read on public.parent_approvals for select to authenticated
  using (user_id = (select auth.uid()));

-- Slots: students find open times through bookable_slots(); they read a slot directly only when they booked it.
drop policy slots_open_read on public.availability_slots;
drop policy slots_own_write on public.availability_slots;
create policy slots_read on public.availability_slots for select to authenticated
  using (adviser_id = (select auth.uid()) or public.booked_by_me(id));
create policy slots_add on public.availability_slots for insert to authenticated
  with check (adviser_id = (select auth.uid()) and public.app_role() = 'adviser');
create policy slots_open_close on public.availability_slots for update to authenticated
  using (adviser_id = (select auth.uid()) and public.app_role() = 'adviser')
  with check (adviser_id = (select auth.uid()));
create policy slots_remove_unbooked on public.availability_slots for delete to authenticated
  using (adviser_id = (select auth.uid()) and public.app_role() = 'adviser' and not public.slot_has_bookings(id));

drop policy blocked_own on public.blocked_days;
create policy blocked_own on public.blocked_days for all to authenticated
  using (adviser_id = (select auth.uid()) and public.app_role() = 'adviser')
  with check (adviser_id = (select auth.uid()) and public.app_role() = 'adviser');

-- Bookings are created and changed only through the functions in the next migration (A7 needs a row lock).
drop policy student_books on public.bookings;
drop policy adviser_reads_booking on public.bookings;
create policy adviser_reads_booking on public.bookings for select to authenticated
  using (public.my_slot(slot_id) and public.has_current_undertaking((select auth.uid())));

-- History and feedback follow the booking: visible exactly when the booking itself is visible.
drop policy history_read on public.booking_status_history;
create policy history_read on public.booking_status_history for select to authenticated
  using (exists (select 1 from public.bookings b where b.id = booking_id));
drop policy feedback_read on public.adviser_feedback;
create policy feedback_read on public.adviser_feedback for select to authenticated
  using (exists (select 1 from public.bookings b where b.id = booking_id));

-- Indexes for the new policy and function lookups
create index on public.bookings (slot_id);
create index on public.profiles (programme) where role = 'student';
create index on public.lesson_progress (lesson_id);
