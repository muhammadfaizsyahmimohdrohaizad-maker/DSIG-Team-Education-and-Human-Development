-- Sprint 2 production pieces (migration 000008). Runs with `supabase test db` or supabase/tests/local/run.sh.
begin;
select plan(46);

-- =========================================================================================================
-- 1. Interview sets in import_reference
-- =========================================================================================================
create temp table _p (p jsonb);
insert into _p values ($j${
  "source_version": "t1",
  "interest_areas": [], "occupation_skills": [], "modules": [], "module_skills": [], "spm_subject_skills": [],
  "study_options": [], "lessons": [], "check_questions": [],
  "skills": [{"uri": "s1", "label_en": "Skill one", "label_ms": null, "alt_labels": [], "esco_label": "x", "esco_uri": null, "esco_uri_status": "unverified"}],
  "occupations": [{"code": "T-X", "title_en": "Job X", "title_ms": null, "tasks": ["t"], "interest_areas": [], "source_url": "https://example.org", "verified": false}],
  "interview_questions": [
    {"key": "T-X:technical:1", "code": "T-X", "round": "technical", "position": 1, "prompt": "Explain joins",
     "rubric": {"keyPoints": [{"point": "join", "words": ["join"]}], "situation": [], "action": [], "result": [], "evidence": [], "why": "Employers ask", "source": "eMASCO"}},
    {"key": "T-X:behavioural:1", "code": "T-X", "round": "behavioural", "position": 1, "prompt": "Tell us",
     "rubric": {"keyPoints": [{"point": "team", "words": ["team"]}], "situation": [], "action": [], "result": [], "evidence": [], "why": "W", "source": "S"}}
  ]}$j$);
grant select on _p to service_role;

set local role service_role;
select is((select (public.import_reference(p) ->> 'interview_questions')::int from _p), 2, 'import loads interview questions');
reset role;
select is((select id from ref.interview_questions where code = 'T-X' and round = 'technical'), md5('iq:T-X:technical:1')::uuid,
  'the id is md5(''iq:'' || key)');
select is((select rubric ->> 'why' from ref.interview_questions where id = md5('iq:T-X:technical:1')::uuid), 'Employers ask',
  'why and source travel inside the rubric');
select is((select source_version from ref.interview_questions where id = md5('iq:T-X:technical:1')::uuid), 't1', 'rows carry the source version');

-- Idempotent: the same payload again changes nothing
select lives_ok($$select public.import_reference(p) from _p$$, 'the same import runs again');
select is((select count(*)::int from ref.interview_questions), 2, 'and leaves the same rows');

-- A student answers the technical question; a new version that edits its text keeps the link
insert into auth.users (id, email) values ('11111111-0000-0000-0000-00000000000a', 'a@test.local');
insert into public.profiles (user_id, role, full_name) values ('11111111-0000-0000-0000-00000000000a', 'student', 'Student A');
set local role service_role;
select lives_ok($$select public.record_interview_answer('11111111-0000-0000-0000-00000000000a', md5('iq:T-X:technical:1')::uuid, 'I joined tables', false, '{"structure":1,"accuracy":1,"evidence":0}')$$,
  'a student answer exists');
reset role;
update _p set p = jsonb_set(jsonb_set(p, '{source_version}', '"t2"'), '{interview_questions,0,prompt}', '"Explain SQL joins"');
select lives_ok($$select public.import_reference(p) from _p$$, 'a new version with an edited question imports');
select is((select q.prompt from public.interview_answers a join ref.interview_questions q on q.id = a.question_id), 'Explain SQL joins',
  'the answer still points at the (edited) question');

-- Dropping an answered question stops the whole import; dropping an unanswered one works
create temp table _orig as select p from _p;
update _p set p = jsonb_set(jsonb_set(p, '{source_version}', '"t3"'), '{interview_questions}', (p -> 'interview_questions') - 0);
select throws_ok($$select public.import_reference(p) from _p$$, '23503', null, 'removing an answered question stops the import');
select is((select source_version from ref.occupations where code = 'T-X'), 't2', 'and nothing changed');
update _p set p = jsonb_set(jsonb_set(p, '{source_version}', '"t4"'), '{interview_questions}',
  (select jsonb_agg(q) from _orig o, jsonb_array_elements(o.p -> 'interview_questions') q where q ->> 'round' = 'technical'));
select lives_ok($$select public.import_reference(p) from _p$$, 'removing an unanswered question imports');
select is((select count(*)::int from ref.interview_questions), 1, 'and that question is gone');
-- payload without the key leaves the interview questions alone
update _p set p = (p - 'interview_questions') || '{"source_version": "t5"}';
select lives_ok($$select public.import_reference(p) from _p$$, 'a payload without interview_questions imports');
select is((select count(*)::int from ref.interview_questions), 1, 'and keeps the interview questions');

set local request.jwt.claims to '{"sub":"11111111-0000-0000-0000-00000000000a","role":"authenticated","app_metadata":{"role":"student"}}';
set local role authenticated;
select throws_ok($$select public.import_reference('{"source_version":"x"}')$$, '42501', null, 'a student cannot run the import');
reset role;

-- =========================================================================================================
-- 2. Parent declined: the student's data goes; nothing blocks the cascade
-- =========================================================================================================
select ok(not exists (
  select 1 from pg_constraint c
   where c.contype = 'f' and c.confrelid in ('public.profiles'::regclass, 'auth.users'::regclass, 'public.bookings'::regclass,
                                             'public.availability_slots'::regclass)
     and c.confdeltype not in ('c', 'n')
), 'every foreign key to profiles, auth.users, bookings and slots cascades or sets null');

insert into auth.users (id, email) values
  ('11111111-0000-0000-0000-00000000000c', 'c@test.local'), ('11111111-0000-0000-0000-00000000000e', 'e@test.local'),
  ('22222222-0000-0000-0000-0000000000d1', 'd1@test.local');
insert into public.profiles (user_id, role, full_name, is_under_18, account_locked) values
  ('11111111-0000-0000-0000-00000000000c', 'student', 'Under Eighteen', true, true),
  ('11111111-0000-0000-0000-00000000000e', 'student', 'Approved Child', true, false),
  ('22222222-0000-0000-0000-0000000000d1', 'adviser', 'Adviser', false, false);
-- Rows in every table that can hold the student's data
insert into public.parent_approvals (user_id, parent_email, token_hash, expires_at, decision, decided_at) values
  ('11111111-0000-0000-0000-00000000000c', 'parent@test.local', repeat('a', 64), now() + interval '7 days', false, now()),
  ('11111111-0000-0000-0000-00000000000e', 'parent2@test.local', repeat('b', 64), now() + interval '7 days', true, now());
insert into public.consents (user_id, kind, given, notice_version, given_by) values
  ('11111111-0000-0000-0000-00000000000c', 'terms_privacy', true, '1.0', 'self'),
  ('11111111-0000-0000-0000-00000000000c', 'parent', false, '1.0', 'parent');
insert into public.profile_sessions (user_id, snapshot) values ('11111111-0000-0000-0000-00000000000c', '{}');
insert into public.projects (user_id, name) values ('11111111-0000-0000-0000-00000000000c', 'P');
insert into public.skill_progress (user_id, skill_uri, state) values ('11111111-0000-0000-0000-00000000000c', 's1', 'learning');
insert into public.mastery_checks (user_id, skill_uri, score) values ('11111111-0000-0000-0000-00000000000c', 's1', 2);
insert into public.review_cards (user_id, front, back, fsrs, card_due_at) values ('11111111-0000-0000-0000-00000000000c', 'f', 'b', '{}', now());
insert into public.interview_answers (user_id, question_id, answer_text, marks) values
  ('11111111-0000-0000-0000-00000000000c', md5('iq:T-X:technical:1')::uuid, 'x', '{"structure":0,"accuracy":0,"evidence":0}');
insert into public.ai_calls (user_id, kind, ok) values ('11111111-0000-0000-0000-00000000000c', 'notes_cards', false);
insert into public.availability_slots (id, adviser_id, slot_start, minutes) values
  ('55555555-0000-0000-0000-000000000001', '22222222-0000-0000-0000-0000000000d1', now() + interval '2 days', 30);
insert into public.bookings (id, student_id, slot_id, topic, request_id) values
  ('66666666-0000-0000-0000-000000000001', '11111111-0000-0000-0000-00000000000c', '55555555-0000-0000-0000-000000000001', 'x', gen_random_uuid());
insert into public.booking_status_history (booking_id, status, changed_by) values
  ('66666666-0000-0000-0000-000000000001', 'requested', '11111111-0000-0000-0000-00000000000c');
insert into public.adviser_feedback (booking_id, feedback_text) values ('66666666-0000-0000-0000-000000000001', 'x');
insert into public.email_outbox (to_user, kind, payload) values ('11111111-0000-0000-0000-00000000000c', 'reminder', '{"status":"accepted"}');

set local request.jwt.claims to '{"sub":"11111111-0000-0000-0000-00000000000c","role":"authenticated","app_metadata":{"role":"student"}}';
set local role authenticated;
select throws_ok($$select public.delete_declined_student('11111111-0000-0000-0000-00000000000c')$$, '42501', null, 'a student cannot call it');
reset role;
set local role service_role;
select throws_ok($$select public.delete_declined_student('11111111-0000-0000-0000-00000000000e')$$, '42501', 'not_declined',
  'it refuses a student whose parent approved');
select throws_ok($$select public.delete_declined_student('22222222-0000-0000-0000-0000000000d1')$$, '42501', 'not_declined',
  'it refuses anyone who is not a declined under-18 student');
select is(public.delete_declined_student('11111111-0000-0000-0000-00000000000c'), true, 'the declined student is deleted');
reset role;
select is((
  select (select count(*) from public.profiles where user_id = u) + (select count(*) from public.parent_approvals where user_id = u)
       + (select count(*) from public.consents where user_id = u) + (select count(*) from public.profile_sessions where user_id = u)
       + (select count(*) from public.projects where user_id = u) + (select count(*) from public.skill_progress where user_id = u)
       + (select count(*) from public.mastery_checks where user_id = u) + (select count(*) from public.review_cards where user_id = u)
       + (select count(*) from public.interview_answers where user_id = u) + (select count(*) from public.ai_calls where user_id = u)
       + (select count(*) from public.bookings where student_id = u) + (select count(*) from public.email_outbox where to_user = u)
       + (select count(*) from public.booking_status_history where booking_id = '66666666-0000-0000-0000-000000000001')
       + (select count(*) from public.adviser_feedback where booking_id = '66666666-0000-0000-0000-000000000001')
  from (select '11111111-0000-0000-0000-00000000000c'::uuid u) x)::int, 0, 'no row of the student is left in any public table');
select ok(exists (select 1 from public.availability_slots where id = '55555555-0000-0000-0000-000000000001'), 'the adviser''s slot stays');
select lives_ok($$delete from auth.users where id = '11111111-0000-0000-0000-00000000000c'$$, 'the Auth user can then be deleted');

-- =========================================================================================================
-- 3. Email outbox
-- =========================================================================================================
set local request.jwt.claims to '{"sub":"11111111-0000-0000-0000-00000000000a","role":"authenticated","app_metadata":{"role":"student"}}';
set local role authenticated;
select throws_ok('select * from public.email_outbox', '42501', null, 'students cannot read the outbox');
select throws_ok($$select * from public.claim_due_emails(10)$$, '42501', null, 'students cannot claim emails');
reset role;
set local role service_role;
select lives_ok($$insert into public.email_outbox (to_user, kind, payload) values
  ('11111111-0000-0000-0000-00000000000a', 'accepted', '{"status":"accepted","time":"2026-11-12T02:00:00Z","link":"https://x/book/1"}')$$,
  'the server queues a failed status email');
select throws_ok($$insert into public.email_outbox (to_user, kind, payload) values ('11111111-0000-0000-0000-00000000000a', 'feedback', '{"feedback_text":"secret"}')$$,
  '23514', null, 'the payload cannot carry anything but status, time and link details');
select is((select count(*)::int from public.claim_due_emails(10)), 1, 'the cron claims the due email');
select is((select attempts from public.email_outbox where to_user = '11111111-0000-0000-0000-00000000000a'), 1, 'claiming counts an attempt');
select is((select count(*)::int from public.claim_due_emails(10)), 0, 'and pushes the next try out, so a second run does not resend it');
update public.email_outbox set sent_at = now(), last_error = null where to_user = '11111111-0000-0000-0000-00000000000a';
update public.email_outbox set next_attempt_at = now() - interval '1 minute' where to_user = '11111111-0000-0000-0000-00000000000a';
select is((select count(*)::int from public.claim_due_emails(10)), 0, 'a sent email is never claimed again');
reset role;

-- =========================================================================================================
-- 4. Rate limits
-- =========================================================================================================
set local role service_role;
select is(public.hit_rate_limit('login:abc', 3, interval '15 minutes'), true, 'hit 1 of 3 is allowed');
select is(public.hit_rate_limit('login:abc', 3, interval '15 minutes'), true, 'hit 2 of 3 is allowed');
select is(public.hit_rate_limit('login:abc', 3, interval '15 minutes'), true, 'hit 3 of 3 is allowed');
select is(public.hit_rate_limit('login:abc', 3, interval '15 minutes'), false, 'hit 4 is refused');
select is(public.hit_rate_limit('login:other', 3, interval '15 minutes'), true, 'other keys have their own count');
select throws_ok($$select public.hit_rate_limit('x', 0, interval '1 minute')$$, '22023', 'invalid_input', 'a limit below 1 is refused');
reset role;
set local request.jwt.claims to '{"sub":"11111111-0000-0000-0000-00000000000a","role":"authenticated","app_metadata":{"role":"student"}}';
set local role authenticated;
select throws_ok($$select public.hit_rate_limit('login:abc', 1000, interval '1 minute')$$, '42501', null, 'students cannot reset or probe limits');
select throws_ok('select * from public.rate_limits', '42501', null, 'students cannot read the counters');

-- =========================================================================================================
-- 5. Reminder emails switch, 6. touch_activity
-- =========================================================================================================
select is((select reminder_emails from public.profiles), true, 'reminder emails are on by default');
select lives_ok($$update public.profiles set reminder_emails = false where user_id = '11111111-0000-0000-0000-00000000000a'$$, 'a student can switch them off');
reset role;
update public.profiles set last_login_at = now() - interval '3 days' where user_id = '11111111-0000-0000-0000-00000000000a';
set local request.jwt.claims to '{"sub":"11111111-0000-0000-0000-00000000000a","role":"authenticated","app_metadata":{"role":"student"}}';
set local role authenticated;
select is(public.touch_activity(), true, 'touch_activity writes when the last activity was on an earlier day');
select is(public.touch_activity(), false, 'and at most once a day');
reset role;
select ok((select last_login_at > now() - interval '1 minute' from public.profiles where user_id = '11111111-0000-0000-0000-00000000000a'), 'last_login_at is now');
set local request.jwt.claims to '{"role":"anon"}';
set local role anon;
select throws_ok($$select public.touch_activity()$$, '42501', null, 'anon cannot call touch_activity');
reset role;

select * from finish();
rollback;
