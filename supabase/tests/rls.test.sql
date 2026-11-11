-- Row-level security and privileged functions (NFR-06, NFR-09, System Design 5.2).
-- Runs with pgTAP (`pnpm db:test`, i.e. supabase test db) or without it: supabase/tests/local/run.sh.
-- Each block switches to the API role with a fake JWT, the way PostgREST does for a real request.
begin;
select plan(112);

-- =========================================================================================================
-- Fixtures (as the migration owner)
-- =========================================================================================================
insert into ref.occupations (code, title_en, tasks, source_version) values
  ('T-X', 'Job X', '{task}', 'test'), ('T-Y', 'Job Y', '{task}', 'test');
insert into ref.skills (uri, label_en) values ('s1', 'Skill one'), ('s2', 'Skill two'), ('s3', 'Skill three');
insert into ref.occupation_skills (code, uri, essential) values ('T-X', 's1', true), ('T-X', 's2', true), ('T-Y', 's3', true);
insert into ref.lessons (id, skill_uri, lesson_no, content_path) values
  ('88888888-0000-0000-0000-000000000001', 's1', 1, 'l1.md'), ('88888888-0000-0000-0000-000000000002', 's1', 2, 'l2.md'),
  ('88888888-0000-0000-0000-000000000003', 's1', 3, 'l3.md'), ('88888888-0000-0000-0000-000000000004', 's1', 4, 'l4.md');
insert into ref.check_questions (id, lesson_id, prompt, options, answer_key) values
  ('99999999-0000-0000-0000-000000000001', '88888888-0000-0000-0000-000000000001', 'q1', '[{"id":"a"},{"id":"b"}]', 'a'),
  ('99999999-0000-0000-0000-000000000002', '88888888-0000-0000-0000-000000000001', 'q2', '[{"id":"a"},{"id":"b"}]', 'a'),
  ('99999999-0000-0000-0000-000000000003', '88888888-0000-0000-0000-000000000002', 'q3', '[{"id":"a"},{"id":"b"}]', 'a'),
  ('99999999-0000-0000-0000-000000000004', '88888888-0000-0000-0000-000000000003', 'q4', '[{"id":"a"},{"id":"b"}]', 'a'),
  ('99999999-0000-0000-0000-000000000005', '88888888-0000-0000-0000-000000000003', 'q5', '[{"id":"a"},{"id":"b"}]', 'a');
insert into ref.interview_questions (id, code, round, position, prompt, rubric) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'T-X', 'technical', 1, 'Tell us', '{}');
insert into ref.study_options (id, code, level, kind, institution, programme, source_url) values
  ('bbbbbbbb-0000-0000-0000-000000000001', 'T-X', 'degree', 'Public university', 'Uni', 'BSc X', 'https://example.org');

-- The server creates auth users with the Auth admin API and writes profiles with the service role.
insert into auth.users (id, email) values
  ('11111111-0000-0000-0000-00000000000a', 'a@test.local'), ('11111111-0000-0000-0000-00000000000b', 'b@test.local'),
  ('11111111-0000-0000-0000-00000000000c', 'c@test.local'), ('22222222-0000-0000-0000-0000000000d1', 'd1@test.local'),
  ('22222222-0000-0000-0000-0000000000d2', 'd2@test.local'), ('33333333-0000-0000-0000-00000000000e', 'e@test.local');
insert into auth.users (id, email)
select ('44444444-0000-0000-0000-0000000000' || lpad(i::text, 2, '0'))::uuid, 'c' || i || '@test.local' from generate_series(1, 10) i;
insert into public.profiles (user_id, role, full_name, is_under_18, account_locked) values
  ('11111111-0000-0000-0000-00000000000a', 'student', 'Student A', false, false),
  ('11111111-0000-0000-0000-00000000000b', 'student', 'Student B', false, false),
  ('11111111-0000-0000-0000-00000000000c', 'student', 'Student C', true, true),
  ('22222222-0000-0000-0000-0000000000d1', 'adviser', 'Adviser One', false, false),
  ('22222222-0000-0000-0000-0000000000d2', 'adviser', 'Adviser Two', false, false),
  ('33333333-0000-0000-0000-00000000000e', 'institution', 'Institution', false, false);
insert into public.profiles (user_id, role, full_name)
select id, 'student', 'Cohort ' || right(id::text, 2) from auth.users where id::text like '44444444%';

update public.profiles set target_occupation = 'T-X', programme = 'Other', skills = '{}'
 where user_id = '11111111-0000-0000-0000-00000000000a';
update public.profiles set programme = 'Prog', target_occupation = case when right(user_id::text, 2)::int <= 5 then 'T-X' else 'T-Y' end
 where user_id::text like '44444444%';
insert into public.consents (user_id, kind, given, notice_version)
select user_id, 'adviser_visibility', user_id::text not like '%10', '1.0' from public.profiles where user_id::text like '44444444%';
insert into public.consents (user_id, kind, given, notice_version) values
  ('11111111-0000-0000-0000-00000000000a', 'adviser_visibility', true, '1.0'),
  ('11111111-0000-0000-0000-00000000000a', 'ai_processing', true, '1.0'),
  ('11111111-0000-0000-0000-00000000000b', 'terms_privacy', true, '1.0');
insert into public.skill_progress (user_id, skill_uri, state) values ('11111111-0000-0000-0000-00000000000b', 's1', 'learning');
insert into public.saved_study_options (user_id, option_id) values ('11111111-0000-0000-0000-00000000000a', 'bbbbbbbb-0000-0000-0000-000000000001');
insert into public.staff_undertakings (adviser_id, version) values ('22222222-0000-0000-0000-0000000000d1', '2026-11');

insert into public.availability_slots (id, adviser_id, slot_start, minutes) values
  ('55555555-0000-0000-0000-000000000001', '22222222-0000-0000-0000-0000000000d1', now() + interval '2 days', 30),
  ('55555555-0000-0000-0000-000000000002', '22222222-0000-0000-0000-0000000000d1', now() + interval '3 days', 30),
  ('55555555-0000-0000-0000-000000000003', '22222222-0000-0000-0000-0000000000d1', now() - interval '2 days', 30),
  ('55555555-0000-0000-0000-000000000004', '22222222-0000-0000-0000-0000000000d2', now() + interval '2 days', 30),
  ('55555555-0000-0000-0000-000000000005', '22222222-0000-0000-0000-0000000000d1', now() - interval '9 days', 30);
insert into public.bookings (id, student_id, slot_id, topic, status, shared_items, request_id) values
  ('66666666-0000-0000-0000-000000000001', '11111111-0000-0000-0000-00000000000a', '55555555-0000-0000-0000-000000000003',
   'Study plan', 'completed', '{gap_progress,study_plan}', '77777777-0000-0000-0000-000000000001'),
  ('66666666-0000-0000-0000-000000000002', '11111111-0000-0000-0000-00000000000b', '55555555-0000-0000-0000-000000000004',
   'Career matches', 'requested', '{target_matches}', '77777777-0000-0000-0000-000000000002'),
  ('66666666-0000-0000-0000-000000000003', '44444444-0000-0000-0000-000000000010', '55555555-0000-0000-0000-000000000005',
   'Career matches', 'completed', '{}', '77777777-0000-0000-0000-000000000003');

-- =========================================================================================================
-- Structure
-- =========================================================================================================
select ok((select bool_and(rowsecurity) from pg_tables where schemaname = 'public'), 'RLS is on for every public table');
select ok(not exists (select 1 from pg_policies where tablename in ('consents','audit_log') and cmd in ('UPDATE','DELETE','ALL')),
  'consents and audit_log have no update, delete or all policies');
select ok(not exists (select 1 from pg_policies where schemaname = 'public' and not ('authenticated' = any (roles))),
  'every policy is scoped to authenticated');
select ok(not exists (select 1 from pg_proc p where p.pronamespace = 'public'::regnamespace and p.prosecdef
                       and not exists (select 1 from unnest(p.proconfig) c where c like 'search_path=%')),
  'every SECURITY DEFINER function pins its search_path');

-- =========================================================================================================
-- anon (no session)
-- =========================================================================================================
set local request.jwt.claims to '{"role":"anon"}';
set local role anon;
select throws_ok('select * from public.profiles', '42501', null, 'anon cannot read profiles');
select throws_ok('select * from public.availability_slots', '42501', null, 'anon cannot read slots');
select throws_ok($$select public.open_request('66666666-0000-0000-0000-000000000001')$$, '42501', null, 'anon cannot call open_request');
select throws_ok('select * from ref.occupations', '42501', null, 'anon cannot read reference data');
reset role;

-- =========================================================================================================
-- Student A: own rows only
-- =========================================================================================================
set local request.jwt.claims to '{"sub":"11111111-0000-0000-0000-00000000000a","role":"authenticated","app_metadata":{"role":"student"}}';
set local role authenticated;
select is((select count(*)::int from public.profiles), 1, 'student sees exactly one profile');
select is((select count(*)::int from public.profiles where user_id <> '11111111-0000-0000-0000-00000000000a'), 0, 'student cannot read another profile');
select is((select count(*)::int from public.skill_progress where user_id = '11111111-0000-0000-0000-00000000000b'), 0, 'student cannot read another student''s skill progress');
select is((select count(*)::int from public.consents where user_id <> '11111111-0000-0000-0000-00000000000a'), 0, 'student cannot read another student''s consents');
select is((select count(*)::int from public.bookings where student_id <> '11111111-0000-0000-0000-00000000000a'), 0, 'student cannot read another student''s bookings');
select is((select count(*)::int from public.availability_slots), 1, 'student reads only the slot they booked');
update public.profiles set full_name = 'Hacked' where user_id = '11111111-0000-0000-0000-00000000000b';
select throws_ok($$update public.profiles set role = 'adviser'$$, '42501', null, 'student cannot change role');
select throws_ok($$update public.profiles set is_under_18 = false$$, '42501', null, 'student cannot change is_under_18');
select throws_ok($$update public.profiles set account_locked = false$$, '42501', null, 'student cannot change account_locked');
select throws_ok($$update public.profiles set last_login_at = now() + interval '5 years'$$, '42501', null, 'student cannot set last_login_at');
select lives_ok($$update public.profiles set full_name = 'Student Aa', programme = 'Other', semester = 5$$, 'student can edit name and study details');
select throws_ok($$insert into public.mastery_checks (user_id, skill_uri, score) values ('11111111-0000-0000-0000-00000000000a', 's1', 5)$$,
  '42501', null, 'student cannot insert mastery_checks');
select throws_ok($$insert into public.interview_answers (user_id, question_id, answer_text, marks) values ('11111111-0000-0000-0000-00000000000a', 'aaaaaaaa-0000-0000-0000-000000000001', 'x', '{"structure":2,"accuracy":2,"evidence":1}')$$,
  '42501', null, 'student cannot insert interview_answers');
select throws_ok($$update public.mastery_checks set score = 5$$, '42501', null, 'student cannot update mastery_checks');
select throws_ok($$insert into public.skill_progress (user_id, skill_uri, state) values ('11111111-0000-0000-0000-00000000000a', 's2', 'mastered')$$,
  '42501', 'mastered_needs_passed_check', 'student cannot mark a skill mastered without a passed check');
select lives_ok($$insert into public.skill_progress (user_id, skill_uri, state, claimed) values ('11111111-0000-0000-0000-00000000000a', 's2', 'check_needed', true)$$,
  'student can claim a skill');
select throws_ok($$insert into public.skill_progress (user_id, skill_uri, state) values ('11111111-0000-0000-0000-00000000000b', 's2', 'learning')$$,
  '42501', null, 'student cannot write another student''s progress');
select throws_ok('select answer_key from ref.check_questions', '42501', null, 'student cannot read check answer keys');
select throws_ok('select * from ref.check_questions', '42501', null, 'select * on check questions is refused (it includes the key)');
select lives_ok('select id, lesson_id, position, prompt, options from ref.check_questions', 'student can read check questions without keys');
select lives_ok('select * from ref.modules, ref.module_skills, ref.spm_subject_skills, ref.interest_areas limit 1', 'student can read the new reference tables');
select is((select label from public.suggest_skills('skil one', 3) limit 1), 'Skill one', 'suggest_skills maps a typo to the nearest skill (A8)');
select throws_ok($$select public.import_reference('{"source_version":"x"}')$$, '42501', null, 'student cannot run the reference import');
select throws_ok($$insert into ref.skills (uri, label_en) values ('evil', 'Evil')$$, '42501', null, 'student cannot write reference data');
select throws_ok($$insert into public.bookings (student_id, slot_id, topic, request_id) values ('11111111-0000-0000-0000-00000000000a', '55555555-0000-0000-0000-000000000001', 'x', gen_random_uuid())$$,
  '42501', null, 'student cannot insert a booking directly');
select throws_ok($$insert into public.availability_slots (adviser_id, slot_start, minutes) values ('11111111-0000-0000-0000-00000000000a', now() + interval '1 day', 30)$$,
  '42501', null, 'student cannot create availability slots');
select throws_ok($$insert into public.audit_log (accessor_id, subject_id, action) values ('11111111-0000-0000-0000-00000000000a', '11111111-0000-0000-0000-00000000000b', 'x')$$,
  '42501', null, 'student cannot write the audit log');
select throws_ok($$select public.cohort_rows(null)$$, '42501', null, 'student cannot read cohort totals');
select throws_ok($$select * from public.student_skill_states('11111111-0000-0000-0000-00000000000b')$$, '42501', null, 'internal helper is not callable');

-- Consents: append-only, own, self, server time
select lives_ok($$insert into public.consents (user_id, kind, given, notice_version) values ('11111111-0000-0000-0000-00000000000a', 'store_use', true, '1.0')$$,
  'student can add a consent');
select throws_ok($$insert into public.consents (user_id, kind, given, notice_version) values ('11111111-0000-0000-0000-00000000000b', 'store_use', true, '1.0')$$,
  '42501', null, 'student cannot add a consent for someone else');
select throws_ok($$insert into public.consents (user_id, kind, given, notice_version, given_by) values ('11111111-0000-0000-0000-00000000000a', 'parent', true, '1.0', 'parent')$$,
  '42501', null, 'student cannot record a parent consent');
select throws_ok($$update public.consents set given = false$$, '42501', null, 'consents cannot be updated');
select throws_ok($$delete from public.consents$$, '42501', null, 'consents cannot be deleted');
select lives_ok($$insert into public.consents (user_id, kind, given, notice_version, consented_at) values ('11111111-0000-0000-0000-00000000000a', 'terms_privacy', true, '1.0', '2099-01-01')$$,
  'a client-chosen consented_at is accepted but ignored');
select ok((select max(consented_at) < now() + interval '1 minute' from public.consents where kind = 'terms_privacy'), 'consented_at is set by the server');
reset role;

-- =========================================================================================================
-- Under-18 account: locked until a parent approves
-- =========================================================================================================
set local request.jwt.claims to '{"sub":"11111111-0000-0000-0000-00000000000c","role":"authenticated","app_metadata":{"role":"student"}}';
set local role authenticated;
select throws_ok($$insert into public.skill_progress (user_id, skill_uri, state) values ('11111111-0000-0000-0000-00000000000c', 's1', 'learning')$$,
  '42501', null, 'a locked account cannot write learning rows');
select lives_ok($$insert into public.consents (user_id, kind, given, notice_version) values ('11111111-0000-0000-0000-00000000000c', 'ai_processing', true, '1.0')$$,
  'a locked account can still record its consents');
select throws_ok($$select public.claim_slot('55555555-0000-0000-0000-000000000002', 'x', null, '{}', gen_random_uuid())$$,
  '42501', 'not_allowed', 'a locked account cannot book');
select throws_ok($$select public.record_interview_answer('aaaaaaaa-0000-0000-0000-000000000001', 'x', false, '{"structure":0,"accuracy":0,"evidence":0}')$$,
  '42501', 'account_locked', 'a locked account cannot save interview answers');
reset role;
-- The parent approves through the emailed link; the server unlocks with the service role.
update public.profiles set account_locked = false where user_id = '11111111-0000-0000-0000-00000000000c';

-- =========================================================================================================
-- Booking (A7) as students
-- =========================================================================================================
set local request.jwt.claims to '{"sub":"11111111-0000-0000-0000-00000000000a","role":"authenticated","app_metadata":{"role":"student"}}';
set local role authenticated;
select throws_ok($$select public.claim_slot('55555555-0000-0000-0000-000000000001', 'Career matches', null, '{nonsense}', '77777777-0000-0000-0000-0000000000a1')$$,
  '23514', null, 'unknown shared items are refused');
select lives_ok($$select public.claim_slot('55555555-0000-0000-0000-000000000001', 'Career matches', 'Which matches suit me?', '{target_matches}', '77777777-0000-0000-0000-0000000000a1')$$,
  'student requests a session');
select is((public.claim_slot('55555555-0000-0000-0000-000000000001', 'Career matches', null, '{target_matches}', '77777777-0000-0000-0000-0000000000a1') ->> 'booking_id')::uuid,
  (select id from public.bookings where request_id = '77777777-0000-0000-0000-0000000000a1'), 'a retried request returns the same booking');
select ok(not exists (select 1 from public.open_slots(now(), now() + interval '7 days') where id = '55555555-0000-0000-0000-000000000001'),
  'the booked time is no longer offered');
select is((select count(*)::int from public.booking_status_history h join public.bookings b on b.id = h.booking_id where b.request_id = '77777777-0000-0000-0000-0000000000a1'),
  1, 'the request writes its first status row');
select throws_ok($$select public.respond_booking((select id from public.bookings where request_id = '77777777-0000-0000-0000-0000000000a1'), true, null)$$,
  '42501', 'not_allowed', 'a student cannot accept their own booking');
select throws_ok($$update public.bookings set status = 'accepted'$$, '42501', null, 'a student cannot update bookings directly');
reset role;
set local request.jwt.claims to '{"sub":"11111111-0000-0000-0000-00000000000b","role":"authenticated","app_metadata":{"role":"student"}}';
set local role authenticated;
select throws_ok($$select public.claim_slot('55555555-0000-0000-0000-000000000001', 'x', null, '{}', '77777777-0000-0000-0000-0000000000b1')$$,
  'P0001', 'slot_taken', 'a second student cannot take the same slot');
reset role;

-- =========================================================================================================
-- Adviser without a current undertaking gets nothing
-- =========================================================================================================
set local request.jwt.claims to '{"sub":"22222222-0000-0000-0000-0000000000d2","role":"authenticated","app_metadata":{"role":"adviser"}}';
set local role authenticated;
select is((select count(*)::int from public.bookings), 0, 'no undertaking: no bookings visible');
select is((select count(*)::int from public.booking_status_history), 0, 'no undertaking: no booking history visible');
select throws_ok($$select public.open_request('66666666-0000-0000-0000-000000000002')$$, '42501', 'undertaking_required', 'no undertaking: open_request refused');
select throws_ok($$select * from public.adviser_requests()$$, '42501', 'undertaking_required', 'no undertaking: request list refused');
select throws_ok($$select * from public.adviser_students()$$, '42501', 'undertaking_required', 'no undertaking: student list refused');
select throws_ok($$select * from public.cohort_rows(null)$$, '42501', 'undertaking_required', 'no undertaking: cohort refused');
select lives_ok($$select public.accept_staff_undertaking()$$, 'adviser accepts the undertaking');
select is((select count(*)::int from public.bookings), 1, 'after the undertaking: own slot bookings visible');
reset role;
select is((select count(*)::int from public.audit_log), 0, 'refused calls left no audit rows');

-- =========================================================================================================
-- Adviser D1 (current undertaking): open_request returns only ticked items and logs once
-- =========================================================================================================
set local request.jwt.claims to '{"sub":"22222222-0000-0000-0000-0000000000d1","role":"authenticated","app_metadata":{"role":"adviser"}}';
set local role authenticated;
select is((select count(*)::int from public.bookings), 3, 'adviser sees bookings on own slots only');
select is((select count(*)::int from public.profiles), 1, 'adviser cannot read student profiles directly');
select is((select student_name from public.adviser_requests() where topic = 'Career matches' and status = 'requested'), 'Student Aa',
  'request list names the student');
select is((select shared_items from public.adviser_requests() where topic = 'Career matches' and status = 'requested'), '{target_matches}'::text[],
  'request list shows which items were ticked');
select ok((select r ? 'target' and not (r ? 'gaps') and not (r ? 'plan') and not (r ? 'interview')
             from public.open_request((select id from public.bookings where request_id = '77777777-0000-0000-0000-0000000000a1')) r),
  'open_request returns only the ticked item (target)');
select ok((select r ? 'gaps' and r ? 'plan' and not (r ? 'target') and not (r ? 'interview')
             from public.open_request('66666666-0000-0000-0000-000000000001') r),
  'open_request returns only the ticked items (gaps, plan)');
select is((select jsonb_array_length(r -> 'gaps') from public.open_request('66666666-0000-0000-0000-000000000001') r), 2,
  'gap list covers the target job''s essential skills');
select throws_ok($$select public.open_request('66666666-0000-0000-0000-000000000002')$$, 'P0002', 'not_found',
  'adviser cannot open a booking on another adviser''s slot');
reset role;
select is((select count(*)::int from public.audit_log where accessor_id = '22222222-0000-0000-0000-0000000000d1' and action = 'open_request'), 3,
  'one audit row per open_request call');
select is((select count(*)::int from public.audit_log where booking_id = '66666666-0000-0000-0000-000000000002'), 0,
  'a refused open_request writes no audit row');

set local request.jwt.claims to '{"sub":"22222222-0000-0000-0000-0000000000d1","role":"authenticated","app_metadata":{"role":"adviser"}}';
set local role authenticated;
select lives_ok($$select public.respond_booking((select id from public.bookings where request_id = '77777777-0000-0000-0000-0000000000a1'), true, null)$$,
  'adviser accepts a request');
select lives_ok($$select public.send_feedback('66666666-0000-0000-0000-000000000001', 'Good session. Finish the Git lessons next.')$$,
  'adviser sends feedback on a completed session');
select throws_ok($$select public.send_feedback((select id from public.bookings where request_id = '77777777-0000-0000-0000-0000000000a1'), 'Too early')$$,
  'P0001', 'not_completed', 'feedback waits until the session has happened');
select throws_ok($$update public.availability_slots set slot_start = now() + interval '9 days' where id = '55555555-0000-0000-0000-000000000001'$$,
  '42501', null, 'adviser cannot move the time of a slot');
delete from public.availability_slots where id = '55555555-0000-0000-0000-000000000001';
select lives_ok($$update public.availability_slots set is_open = false where id = '55555555-0000-0000-0000-000000000002'$$,
  'adviser can close a slot');
select lives_ok($$update public.availability_slots set is_open = true where id = '55555555-0000-0000-0000-000000000002'$$,
  'adviser can open a slot');
reset role;
select ok(exists (select 1 from public.availability_slots where id = '55555555-0000-0000-0000-000000000001'), 'adviser cannot delete a booked slot');
select is((select full_name from public.profiles where user_id = '11111111-0000-0000-0000-00000000000b'), 'Student B', 'student cannot update another profile');

-- Student moves the accepted booking; adviser declines; the shared data is withdrawn
set local request.jwt.claims to '{"sub":"11111111-0000-0000-0000-00000000000a","role":"authenticated","app_metadata":{"role":"student"}}';
set local role authenticated;
select is(public.move_booking((select id from public.bookings where request_id = '77777777-0000-0000-0000-0000000000a1'), '55555555-0000-0000-0000-000000000002') ->> 'status',
  'change_requested', 'moving an accepted booking makes it change_requested');
select is((select count(*)::int from public.adviser_feedback), 1, 'student sees feedback on own booking');
reset role;
set local request.jwt.claims to '{"sub":"11111111-0000-0000-0000-00000000000b","role":"authenticated","app_metadata":{"role":"student"}}';
set local role authenticated;
select is((select count(*)::int from public.adviser_feedback), 0, 'another student sees no feedback');
reset role;
set local request.jwt.claims to '{"sub":"22222222-0000-0000-0000-0000000000d1","role":"authenticated","app_metadata":{"role":"adviser"}}';
set local role authenticated;
select is(public.respond_booking((select id from public.bookings where request_id = '77777777-0000-0000-0000-0000000000a1'), false, 'Please pick next week') ->> 'status',
  'declined', 'adviser declines the new time');
select throws_ok($$select public.open_request((select id from public.bookings where request_id = '77777777-0000-0000-0000-0000000000a1'))$$,
  '42501', 'withdrawn', 'a declined booking no longer shows shared data');

-- Students board: progress only with adviser_visibility consent, and each read is audited
select is((select target_code from public.adviser_students() where student_id = '11111111-0000-0000-0000-00000000000a'), 'T-X',
  'student who allowed adviser visibility shows a target');
select is((select skills_total from public.adviser_students() where student_id = '11111111-0000-0000-0000-00000000000a'), 2,
  'and job skill progress');
select is((select sharing from public.adviser_students() where student_id = '44444444-0000-0000-0000-000000000010'), false,
  'student without adviser visibility is listed as not sharing');
select is((select target_code from public.adviser_students() where student_id = '44444444-0000-0000-0000-000000000010'), null::text,
  'and shows no target');
reset role;
select is((select count(*)::int from public.audit_log where action = 'adviser_students' and subject_id = '44444444-0000-0000-0000-000000000010'), 0,
  'no audit row for a student whose data was not shown');
set local request.jwt.claims to '{"sub":"11111111-0000-0000-0000-00000000000a","role":"authenticated","app_metadata":{"role":"student"}}';
set local role authenticated;
insert into public.consents (user_id, kind, given, notice_version) values ('11111111-0000-0000-0000-00000000000a', 'adviser_visibility', false, '1.0');
reset role;
set local request.jwt.claims to '{"sub":"22222222-0000-0000-0000-0000000000d1","role":"authenticated","app_metadata":{"role":"adviser"}}';
set local role authenticated;
select is((select target_code from public.adviser_students() where student_id = '11111111-0000-0000-0000-00000000000a'), null::text,
  'withdrawing adviser visibility hides the target at once');
reset role;

-- =========================================================================================================
-- Cohort totals (A6): groups under 5 never leave the database
-- =========================================================================================================
set local request.jwt.claims to '{"sub":"33333333-0000-0000-0000-00000000000e","role":"authenticated","app_metadata":{"role":"institution"}}';
set local role authenticated;
select is((select students from public.cohort_rows('Prog') where metric = 'target' and label = 'Job X'), 5::bigint, 'a job chosen by 5 sharing students is shown');
select ok(not exists (select 1 from public.cohort_rows('Prog') where metric = 'target' and label = 'Job Y'), 'a job chosen by 4 sharing students is hidden');
select is((select students from public.cohort_rows('Prog') where metric = 'sharing'), 9::bigint, 'the student without consent is not counted as sharing');
select is((select students from public.cohort_rows('Prog') where metric = 'total'), 10::bigint, 'total counts every student in the programme');
select is((select count(*)::int from public.cohort_rows('Prog') where metric = 'gap'), 2, 'gap skills held by 5 or more students are shown, others hidden');
select is((select count(*)::int from public.cohort_rows('Other')), 0, 'a programme with fewer than 5 sharing students returns nothing');
select ok(not exists (select 1 from public.cohort_rows(null) where students < 5), 'no row carries a count under 5');
reset role;

-- =========================================================================================================
-- Mastery (A3): the server inserts checks with the service role; a student cannot fake mastery
-- =========================================================================================================
set local request.jwt.claims to '';
-- A failed check, inserted the way server/data/learning.ts does (service role).
set local role service_role;
insert into public.mastery_checks (user_id, skill_uri, score, retake_after_lesson) values ('11111111-0000-0000-0000-00000000000a', 's1', 2, 3);
reset role;
set local request.jwt.claims to '{"sub":"11111111-0000-0000-0000-00000000000a","role":"authenticated","app_metadata":{"role":"student"}}';
set local role authenticated;
select throws_ok($$insert into public.skill_progress (user_id, skill_uri, state) values ('11111111-0000-0000-0000-00000000000a', 's1', 'mastered')
                   on conflict (user_id, skill_uri) do update set state = 'mastered'$$,
  '42501', 'mastered_needs_passed_check', 'a failed check does not let the student mark the skill mastered');
select lives_ok($$insert into public.lesson_progress (user_id, lesson_id, done_at) values ('11111111-0000-0000-0000-00000000000a', '88888888-0000-0000-0000-000000000003', now())$$,
  'student marks lesson 3 done');
select ok((select done_at > (select max(taken_at) from public.mastery_checks where skill_uri = 's1') from public.lesson_progress
            where lesson_id = '88888888-0000-0000-0000-000000000003'), 'done_at is server time, after the failed check');
reset role;
set local role service_role;
insert into public.mastery_checks (user_id, skill_uri, score) values ('11111111-0000-0000-0000-00000000000a', 's1', 4);
reset role;
set local request.jwt.claims to '{"sub":"11111111-0000-0000-0000-00000000000a","role":"authenticated","app_metadata":{"role":"student"}}';
set local role authenticated;
select lives_ok($$insert into public.skill_progress (user_id, skill_uri, state) values ('11111111-0000-0000-0000-00000000000a', 's1', 'mastered')
                  on conflict (user_id, skill_uri) do update set state = 'mastered'$$,
  'after a passing check the server can record mastered as the student');
select is((select state::text from public.skill_progress where skill_uri = 's1'), 'mastered', 'skill is mastered');
select throws_ok($$update public.skill_progress set state = 'mastered' where skill_uri = 's2'$$,
  '42501', 'mastered_needs_passed_check', 'updating a claimed skill to mastered without a check is refused');
reset role;
select is((select state::text from public.student_skill_states('11111111-0000-0000-0000-00000000000a') where skill_uri = 's2'), 'check_needed',
  'advisers see the derived state (claimed, not mastered)');

-- Interview: marks validated; AI feedback only with consent and 18+
select lives_ok($$select public.record_interview_answer('aaaaaaaa-0000-0000-0000-000000000001', 'I built a chatbot', false, '{"structure":2,"accuracy":1,"evidence":1}')$$,
  'student saves an answer with checklist marks');
select throws_ok($$select public.record_interview_answer('aaaaaaaa-0000-0000-0000-000000000001', 'x', false, '{"structure":3,"accuracy":1,"evidence":1}')$$,
  '23514', null, 'marks outside the rubric are refused');
select lives_ok($$select public.add_ai_feedback((select id from public.interview_answers limit 1), 'Name the tool you used.')$$,
  'adult with AI consent gets AI feedback stored');
reset role;
set local request.jwt.claims to '{"sub":"11111111-0000-0000-0000-00000000000c","role":"authenticated","app_metadata":{"role":"student"}}';
set local role authenticated;
select throws_ok($$select public.add_ai_feedback(public.record_interview_answer('aaaaaaaa-0000-0000-0000-000000000001', 'My answer', false, '{"structure":1,"accuracy":1,"evidence":0}'), 'AI text')$$,
  '42501', 'ai_not_allowed', 'AI feedback is refused for an under-18 account, whatever its consent');
reset role;

select * from finish();
rollback;
