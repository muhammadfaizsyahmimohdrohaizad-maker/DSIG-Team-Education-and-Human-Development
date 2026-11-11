-- Privileged functions (RPCs). Each checks who is calling, does its work in one transaction and returns
-- only what the caller may see. They replace direct table writes that RLS now blocks.
--
-- Error codes (the server maps them to Result codes, System Design 2.5):
--   42501 FORBIDDEN    forbidden, undertaking_required, withdrawn, ai_not_allowed, account_locked
--   P0002 NOT_FOUND    not_found
--   22023 VALIDATION   answer_required, invalid_input
-- Booking functions (migration 000005) use the backend's tokens: not_allowed, slot_taken, slot_closed, ...

-- ---------------------------------------------------------------------------------------------------------
-- Shared guards
-- ---------------------------------------------------------------------------------------------------------
create function public.require_student() returns uuid
language plpgsql stable security definer set search_path = '' as $$
declare me uuid := auth.uid(); p public.profiles;
begin
  select * into p from public.profiles where user_id = me;
  if me is null or not found or p.role <> 'student' then raise exception 'forbidden' using errcode = '42501'; end if;
  if p.account_locked then raise exception 'account_locked' using errcode = '42501'; end if;
  return me;
end $$;

create function public.require_adviser() returns uuid
language plpgsql stable security definer set search_path = '' as $$
declare me uuid := auth.uid();
begin
  if me is null or public.app_role() <> 'adviser' then raise exception 'forbidden' using errcode = '42501'; end if;
  if not public.has_current_undertaking(me) then raise exception 'undertaking_required' using errcode = '42501'; end if;
  return me;
end $$;

-- ---------------------------------------------------------------------------------------------------------
-- Account
-- ---------------------------------------------------------------------------------------------------------
create or replace function public.accept_staff_undertaking() returns void
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null or public.app_role() <> 'adviser' then raise exception 'forbidden' using errcode = '42501'; end if;
  insert into public.staff_undertakings (adviser_id, version)
  values (auth.uid(), (select value from public.app_settings where key = 'undertaking_version'))
  on conflict do nothing;
end $$;

-- Mastery checks (A3) are marked on the server from content/lessons and inserted with the service role,
-- scoped to the student (server/data/learning.ts). skill_progress cannot reach 'mastered' without a passing
-- row (guard_mastered, 000003), and advisers see states derived from checks (student_skill_states).

-- ---------------------------------------------------------------------------------------------------------
-- Interview (A5): checklist marks come from the server engine; AI feedback only for 18+ with consent
-- ---------------------------------------------------------------------------------------------------------
create function public.record_interview_answer(p_question uuid, p_answer text, p_skipped boolean, p_marks jsonb) returns uuid
language plpgsql security definer set search_path = '' as $$
declare me uuid := public.require_student(); v_id uuid;
begin
  if not exists (select 1 from ref.interview_questions where id = p_question) then
    raise exception 'not_found' using errcode = 'P0002';
  end if;
  if p_skipped then
    insert into public.interview_answers (user_id, question_id, answer_text, skipped, marks)
    values (me, p_question, null, true, '{"structure":0,"accuracy":0,"evidence":0}')
    returning id into v_id;
  else
    if coalesce(btrim(p_answer), '') = '' then raise exception 'answer_required' using errcode = '22023'; end if;
    insert into public.interview_answers (user_id, question_id, answer_text, skipped, marks)
    values (me, p_question, p_answer, false, p_marks)
    returning id into v_id;
  end if;
  return v_id;
end $$;

create function public.add_ai_feedback(p_answer uuid, p_feedback text) returns void
language plpgsql security definer set search_path = '' as $$
declare me uuid := public.require_student();
begin
  if (select is_under_18 from public.profiles where user_id = me) or not public.latest_consent(me, 'ai_processing') then
    raise exception 'ai_not_allowed' using errcode = '42501';
  end if;
  if coalesce(btrim(p_feedback), '') = '' or char_length(p_feedback) > 4000 then
    raise exception 'invalid_input' using errcode = '22023';
  end if;
  update public.interview_answers set ai_used = true, ai_feedback = p_feedback
   where id = p_answer and user_id = me and not skipped;
  if not found then raise exception 'not_found' using errcode = 'P0002'; end if;
end $$;

-- ---------------------------------------------------------------------------------------------------------
-- Advisers a student can book (Book: adviser picker shows name and unit). Booking itself: migration 000005.
-- ---------------------------------------------------------------------------------------------------------
create function public.list_advisers()
returns table (adviser_id uuid, full_name text, staff_unit text, institution text)
language sql stable security definer set search_path = '' as $$
  select p.user_id, p.full_name, p.staff_unit, p.institution
    from public.profiles p
   where p.role = 'adviser' and auth.uid() is not null
   order by p.full_name
$$;

-- ---------------------------------------------------------------------------------------------------------
-- Adviser views of students (FR-ADV-02, NFR-09)
-- ---------------------------------------------------------------------------------------------------------
-- The only way an adviser sees a student's shared data: checks the role, the undertaking, the booking and
-- its status, writes the audit row and returns only the ticked items, in one transaction (NFR-09).
create or replace function public.open_request(p_booking uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  me uuid := public.require_adviser();
  b public.bookings; s public.availability_slots; p public.profiles; result jsonb;
begin
  select bk.* into b from public.bookings bk
    join public.availability_slots sl on sl.id = bk.slot_id
   where bk.id = p_booking and sl.adviser_id = me;
  if not found then raise exception 'not_found' using errcode = 'P0002'; end if;
  if b.status in ('declined','cancelled') then raise exception 'withdrawn' using errcode = '42501'; end if;

  insert into public.audit_log (accessor_id, subject_id, booking_id, action)
  values (me, b.student_id, b.id, 'open_request');

  select * into s from public.availability_slots where id = b.slot_id;
  select * into p from public.profiles where user_id = b.student_id;

  result := jsonb_build_object(
    'booking', jsonb_build_object('id', b.id, 'status', b.status, 'slot_start', s.slot_start, 'minutes', s.minutes,
                                  'topic', b.topic, 'note', b.note),
    'student', jsonb_build_object('id', p.user_id, 'name', p.full_name, 'education_level', p.education_level,
                                  'programme', p.programme, 'semester', p.semester),
    'shared', to_jsonb(b.shared_items));

  if 'target_matches' = any (b.shared_items) then
    result := result || jsonb_build_object(
      'target', (select jsonb_build_object('code', o.code, 'title', o.title_en)
                   from ref.occupations o where o.code = p.target_occupation),
      'matches', (select ps.snapshot -> 'matches' from public.profile_sessions ps
                   where ps.user_id = p.user_id order by ps.created_at desc limit 1));
  end if;
  if 'gap_progress' = any (b.shared_items) then
    result := result || jsonb_build_object('gaps', (
      select coalesce(jsonb_agg(jsonb_build_object('skill', g.skill_uri, 'label', g.label, 'state', g.state)), '[]')
        from public.student_skill_states(p.user_id) g));
  end if;
  if 'study_plan' = any (b.shared_items) then
    result := result || jsonb_build_object('plan', (
      select coalesce(jsonb_agg(jsonb_build_object('institution', o.institution, 'programme', o.programme,
                                                   'level', o.level, 'kind', o.kind, 'duration', o.duration,
                                                   'award', o.award, 'source_url', o.source_url)
                                order by so.saved_at), '[]')
        from public.saved_study_options so join ref.study_options o on o.id = so.option_id
       where so.user_id = p.user_id));
  end if;
  if 'interview_feedback' = any (b.shared_items) then
    result := result || jsonb_build_object('interview', (
      select jsonb_build_object('round', q.round, 'prompt', q.prompt, 'total', a.total, 'skipped', a.skipped,
                                'ai_used', a.ai_used, 'ai_feedback', a.ai_feedback, 'created_at', a.created_at)
        from public.interview_answers a join ref.interview_questions q on q.id = a.question_id
       where a.user_id = p.user_id order by a.created_at desc limit 1));
  end if;
  return result;
end $$;

-- Students board: everyone who has booked this adviser. Target and progress only for students whose latest
-- adviser_visibility consent is yes; each of those reads is written to the audit log.
create function public.adviser_students()
returns table (student_id uuid, full_name text, education_level public.edu_level, programme text, semester smallint,
               sharing boolean, target_code text, target_title text, skills_ready int, skills_total int,
               last_session timestamptz, upcoming jsonb)
language plpgsql security definer set search_path = '' as $$
declare me uuid := public.require_adviser();
begin
  insert into public.audit_log (accessor_id, subject_id, booking_id, action)
  select me, l.sid, null, 'adviser_students'
    from (select distinct b.student_id as sid from public.bookings b
            join public.availability_slots s on s.id = b.slot_id where s.adviser_id = me) l
   where public.latest_consent(l.sid, 'adviser_visibility');

  return query
  select p.user_id, p.full_name, p.education_level, p.programme, p.semester, l.sharing,
         case when l.sharing then p.target_occupation end,
         case when l.sharing then o.title_en end,
         case when l.sharing and p.target_occupation is not null then
           (select count(*)::int from public.student_skill_states(p.user_id) g where g.state in ('have','mastered')) end,
         case when l.sharing and p.target_occupation is not null then
           (select count(*)::int from public.student_skill_states(p.user_id) g) end,
         (select max(s.slot_start) from public.bookings b join public.availability_slots s on s.id = b.slot_id
           where b.student_id = p.user_id and s.adviser_id = me and b.status = 'completed'),
         (select coalesce(jsonb_agg(jsonb_build_object('booking_id', b.id, 'slot_start', s.slot_start, 'status', b.status)
                                    order by s.slot_start), '[]')
            from public.bookings b join public.availability_slots s on s.id = b.slot_id
           where b.student_id = p.user_id and s.adviser_id = me and s.slot_start > now()
             and b.status in ('requested','accepted','change_requested'))
    from (select x.sid, public.latest_consent(x.sid, 'adviser_visibility') as sharing
            from (select distinct b.student_id as sid from public.bookings b
                    join public.availability_slots s on s.id = b.slot_id where s.adviser_id = me) x) l
    join public.profiles p on p.user_id = l.sid
    left join ref.occupations o on o.code = p.target_occupation
   order by p.full_name;
end $$;

-- ---------------------------------------------------------------------------------------------------------
-- A6 cohort totals (FR-ADV-04). Only students whose latest adviser_visibility consent is yes are counted.
-- If fewer than 5 of them are in the chosen programme, nothing is returned. Every row with a student count
-- under 5 is removed here, so suppressed counts never leave the database.
-- metric: total (all students in the programme), sharing, with_target, mock_sessions_month (sessions this
-- month in Malaysia time; shown only if 5 or more students practised), target (label = job), gap (label = skill,
-- students still missing it).
-- ---------------------------------------------------------------------------------------------------------
drop function public.cohort_rows();
create function public.cohort_rows(p_programme text default null)
returns table (metric text, label text, students bigint)
language plpgsql stable security definer set search_path = '' as $$
declare r text := public.app_role(); month_start timestamptz;
begin
  if r = 'adviser' then
    perform public.require_adviser();
  elsif r <> 'institution' then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  month_start := date_trunc('month', now() at time zone 'Asia/Kuala_Lumpur') at time zone 'Asia/Kuala_Lumpur';

  return query
  with pop as (
    select p.user_id, p.target_occupation from public.profiles p
     where p.role = 'student' and (p_programme is null or p.programme = p_programme)
  ), sharing as (
    select pop.* from pop where public.latest_consent(pop.user_id, 'adviser_visibility')
  ), gate as (
    select count(*) >= 5 as enough from sharing
  ), mocks as (
    select a.user_id, (a.created_at at time zone 'Asia/Kuala_Lumpur')::date as day, q.round
      from public.interview_answers a
      join sharing sh on sh.user_id = a.user_id
      join ref.interview_questions q on q.id = a.question_id
     where a.created_at >= month_start
     group by 1, 2, 3
  ), rows_out as (
    select 1 as ord, 'total'::text as m, null::text as l, (select count(*) from pop) as n
    union all select 2, 'sharing', null, (select count(*) from sharing)
    union all select 3, 'with_target', null, (select count(*) from sharing where target_occupation is not null)
    union all select 4, 'mock_sessions_month', null,
      case when (select count(distinct user_id) from mocks) >= 5 then (select count(*) from mocks) else 0 end
    union all
    select 5, 'target', o.title_en, count(*)
      from sharing sh join ref.occupations o on o.code = sh.target_occupation
     group by o.title_en
    union all
    select 6, 'gap', g.label, count(*)
      from sharing sh cross join lateral public.student_skill_states(sh.user_id) g
     where g.state in ('missing','learning','check_needed')
     group by g.label
  )
  select ro.m, ro.l, ro.n from rows_out ro, gate
   where gate.enough and ro.n >= 5
   order by ro.ord, ro.n desc, ro.l;
end $$;

-- ---------------------------------------------------------------------------------------------------------
-- Jobs for the cron routes (service role only)
-- ---------------------------------------------------------------------------------------------------------
create function public.complete_past_bookings() returns int
language plpgsql security definer set search_path = '' as $$
declare n int;
begin
  with done as (
    update public.bookings b set status = 'completed'
      from public.availability_slots s
     where s.id = b.slot_id and b.status = 'accepted' and s.slot_start + make_interval(mins => s.minutes) <= now()
    returning b.id
  ), hist as (
    insert into public.booking_status_history (booking_id, status, changed_by)
    select id, 'completed', null from done returning 1
  )
  select count(*) into n from hist;
  return n;
end $$;

-- Audit rows are kept 12 months (data dictionary D8).
create function public.purge_audit_log() returns int
language sql security definer set search_path = '' as $$
  with gone as (delete from public.audit_log where accessed_at < now() - interval '12 months' returning 1)
  select count(*)::int from gone
$$;

-- ---------------------------------------------------------------------------------------------------------
-- Execute rights: nothing by default, then exactly what each caller needs.
-- ---------------------------------------------------------------------------------------------------------
do $$ declare f regprocedure; begin
  for f in
    select p.oid::regprocedure from pg_proc p
     where p.pronamespace = 'public'::regnamespace
       and not exists (select 1 from pg_depend d where d.objid = p.oid and d.deptype = 'e')
  loop
    execute format('revoke all on function %s from public, anon, authenticated', f);
  end loop;
end $$;

-- Used inside RLS policies, so the API role needs them.
grant execute on function public.app_role(), public.is_unlocked(), public.has_current_undertaking(uuid),
  public.my_slot(uuid), public.booked_by_me(uuid), public.slot_has_bookings(uuid)
  to authenticated;

grant execute on function
  public.accept_staff_undertaking(),
  public.record_interview_answer(uuid, text, boolean, jsonb),
  public.add_ai_feedback(uuid, text),
  public.list_advisers(), public.open_request(uuid), public.adviser_students(), public.cohort_rows(text)
  to authenticated;

grant execute on function public.complete_past_bookings(), public.purge_audit_log() to service_role;
