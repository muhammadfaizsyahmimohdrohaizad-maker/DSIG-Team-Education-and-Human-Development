-- Row-level security, helper functions and privileged RPCs (System Design 5.2).
-- The role lives in auth.users.app_metadata.role, set only by the server at sign-up; users cannot edit it.

create or replace function app_role() returns text language sql stable as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '')
$$;

create or replace function is_unlocked() returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select not account_locked from profiles where user_id = auth.uid()), false)
$$;

create or replace function has_current_undertaking(uid uuid) returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from staff_undertakings u
    where u.adviser_id = uid and u.version = (select value from app_settings where key = 'undertaking_version')
  )
$$;

-- Turn RLS on everywhere
do $$ declare t text; begin
  foreach t in array array['profiles','profile_sessions','projects','consents','parent_approvals','staff_undertakings',
    'app_settings','saved_study_options','skill_progress','lesson_progress','mastery_checks','review_cards',
    'interview_answers','availability_slots','blocked_days','bookings','booking_status_history','adviser_feedback','audit_log']
  loop execute format('alter table %I enable row level security', t); end loop;
end $$;

-- Reference data: read-only for signed-in users
grant usage on schema ref to authenticated;
grant select on all tables in schema ref to authenticated;

-- A student's own rows (blocked while an under-18 account waits for its parent)
create policy own_profile_read on profiles for select using (user_id = (select auth.uid()));
create policy own_profile_update on profiles for update using (user_id = (select auth.uid()) and is_unlocked())
  with check (user_id = (select auth.uid()));
-- Column-level update rights: role, age and lock flags are set by the server only.
revoke update on profiles from authenticated;
grant update (full_name, education_level, spm_grades, module_ids, skills, interests, job_in_mind, target_occupation, locale)
  on profiles to authenticated;

do $$ declare t text; begin
  foreach t in array array['profile_sessions','projects','saved_study_options','skill_progress','lesson_progress','review_cards']
  loop
    execute format('create policy own_rows on %I for all using (user_id = (select auth.uid()) and is_unlocked()) with check (user_id = (select auth.uid()))', t);
  end loop;
end $$;

-- Scores are computed on the server: students read their checks and answers but never write them directly.
create policy own_checks_read on mastery_checks for select using (user_id = (select auth.uid()));
create policy own_answers_read on interview_answers for select using (user_id = (select auth.uid()));

-- Consents and undertakings: append-only
create policy own_consents_read on consents for select using (user_id = (select auth.uid()));
create policy own_consents_add on consents for insert with check (user_id = (select auth.uid()) and given_by = 'self');
create policy own_undertaking_read on staff_undertakings for select using (adviser_id = (select auth.uid()));
create policy settings_read on app_settings for select using (true);

-- Availability: students see open future slots; advisers manage their own
create policy slots_open_read on availability_slots for select using ((is_open and slot_start > now()) or adviser_id = (select auth.uid()));
create policy slots_own_write on availability_slots for all using (adviser_id = (select auth.uid()) and app_role() = 'adviser')
  with check (adviser_id = (select auth.uid()));
create policy blocked_own on blocked_days for all using (adviser_id = (select auth.uid())) with check (adviser_id = (select auth.uid()));

-- Bookings
create policy student_bookings on bookings for select using (student_id = (select auth.uid()));
create policy student_books on bookings for insert with check (student_id = (select auth.uid()) and status = 'requested' and is_unlocked());
create policy adviser_reads_booking on bookings for select using (
  exists (select 1 from availability_slots s where s.id = bookings.slot_id and s.adviser_id = (select auth.uid()))
  and has_current_undertaking((select auth.uid()))
);
create policy history_read on booking_status_history for select using (
  exists (select 1 from bookings b where b.id = booking_id and (b.student_id = (select auth.uid())
    or exists (select 1 from availability_slots s where s.id = b.slot_id and s.adviser_id = (select auth.uid()))))
);
create policy feedback_read on adviser_feedback for select using (
  exists (select 1 from bookings b where b.id = booking_id and (b.student_id = (select auth.uid())
    or exists (select 1 from availability_slots s where s.id = b.slot_id and s.adviser_id = (select auth.uid()))))
);

-- Audit log: institution reads it; nobody updates or deletes through the API
create policy audit_institution_read on audit_log for select using (app_role() = 'institution');

-- ---- Privileged functions ----

-- The only way an adviser sees student data: checks booking, undertaking and ticked items,
-- writes the audit row and returns only the ticked items, in one transaction (NFR-09).
create or replace function open_request(p_booking uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
declare b bookings; out jsonb := '{}'::jsonb; p profiles;
begin
  select bk.* into b from bookings bk join availability_slots s on s.id = bk.slot_id
   where bk.id = p_booking and s.adviser_id = auth.uid();
  if not found then raise exception 'not_found' using errcode = 'P0002'; end if;
  if not has_current_undertaking(auth.uid()) then raise exception 'undertaking_required' using errcode = '42501'; end if;

  insert into audit_log (accessor_id, subject_id, booking_id, action) values (auth.uid(), b.student_id, b.id, 'open_request');

  select * into p from profiles where user_id = b.student_id;
  out := jsonb_build_object('student', jsonb_build_object('name', p.full_name), 'shared', to_jsonb(b.shared_items));
  if 'target_matches' = any(b.shared_items) then out := out || jsonb_build_object('target', p.target_occupation); end if;
  if 'gap_progress' = any(b.shared_items) then
    out := out || jsonb_build_object('gaps', (select coalesce(jsonb_agg(jsonb_build_object('skill', skill_uri, 'state', state)), '[]') from skill_progress where user_id = b.student_id));
  end if;
  if 'study_plan' = any(b.shared_items) then
    out := out || jsonb_build_object('plan', (select coalesce(jsonb_agg(o.*), '[]') from saved_study_options s join ref.study_options o on o.id = s.option_id where s.user_id = b.student_id));
  end if;
  if 'interview_feedback' = any(b.shared_items) then
    out := out || jsonb_build_object('interview', (select to_jsonb(a.*) - 'user_id' from interview_answers a where a.user_id = b.student_id order by created_at desc limit 1));
  end if;
  return out;
end $$;

-- Cohort totals with groups under 5 removed inside the database (FR-ADV-04)
create or replace function cohort_rows() returns table (target text, students bigint)
language sql stable security definer set search_path = public as $$
  select p.target_occupation, count(*) from profiles p
  where app_role() in ('adviser','institution') and p.role = 'student' and p.target_occupation is not null
    and exists (select 1 from consents c where c.user_id = p.user_id and c.kind = 'adviser_visibility' and c.given
                and c.consented_at = (select max(c2.consented_at) from consents c2 where c2.user_id = p.user_id and c2.kind = 'adviser_visibility'))
  group by p.target_occupation having count(*) >= 5
$$;

create or replace function accept_staff_undertaking() returns void
language sql security definer set search_path = public as $$
  insert into staff_undertakings (adviser_id, version)
  select auth.uid(), (select value from app_settings where key = 'undertaking_version')
  where app_role() = 'adviser'
  on conflict do nothing
$$;

-- FR-ACC-02 account deletion and NFR-08 inactivity deletion use the Auth admin API from the server
-- (features/account, /api/cron/purge), because auth.users belongs to Supabase Auth. Every public table
-- cascades from profiles when the auth user goes; audit rows stay for 12 months.

revoke all on function open_request(uuid), cohort_rows(), accept_staff_undertaking() from public, anon;
grant execute on function open_request(uuid), cohort_rows(), accept_staff_undertaking() to authenticated;
