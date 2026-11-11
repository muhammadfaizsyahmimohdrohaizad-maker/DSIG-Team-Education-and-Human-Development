-- Interview marks and AI bookkeeping (migration 000007). Runs with `supabase test db` or supabase/tests/local/run.sh.
begin;
select plan(30);

insert into ref.occupations (code, title_en, tasks, source_version) values ('T-X', 'Job X', '{task}', 'test');
insert into ref.interview_questions (id, code, round, position, prompt, rubric) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'T-X', 'technical', 1, 'Tell us', '{}');
insert into auth.users (id, email) values
  ('11111111-0000-0000-0000-00000000000a', 'a@test.local'), ('11111111-0000-0000-0000-00000000000b', 'b@test.local'),
  ('11111111-0000-0000-0000-00000000000c', 'c@test.local'), ('11111111-0000-0000-0000-00000000000d', 'd@test.local'),
  ('22222222-0000-0000-0000-0000000000d1', 'd1@test.local');
insert into public.profiles (user_id, role, full_name, is_under_18, account_locked) values
  ('11111111-0000-0000-0000-00000000000a', 'student', 'Adult With AI', false, false),
  ('11111111-0000-0000-0000-00000000000b', 'student', 'Adult No AI', false, false),
  ('11111111-0000-0000-0000-00000000000c', 'student', 'Under Eighteen', true, false),
  ('11111111-0000-0000-0000-00000000000d', 'student', 'Locked', true, true),
  ('22222222-0000-0000-0000-0000000000d1', 'adviser', 'Adviser', false, false);
insert into public.consents (user_id, kind, given, notice_version) values
  ('11111111-0000-0000-0000-00000000000a', 'ai_processing', true, '1.0'),
  ('11111111-0000-0000-0000-00000000000b', 'ai_processing', false, '1.0'),
  ('11111111-0000-0000-0000-00000000000c', 'ai_processing', true, '1.0');

-- =========================================================================================================
-- 1. A student cannot write marks or AI feedback through the API
-- =========================================================================================================
set local request.jwt.claims to '{"sub":"11111111-0000-0000-0000-00000000000a","role":"authenticated","app_metadata":{"role":"student"}}';
set local role authenticated;
select throws_ok($$select public.record_interview_answer('11111111-0000-0000-0000-00000000000a', 'aaaaaaaa-0000-0000-0000-000000000001', 'Faked', false, '{"structure":2,"accuracy":2,"evidence":1}')$$,
  '42501', null, 'student cannot call record_interview_answer (full-marks forgery)');
select throws_ok($$select public.add_ai_feedback('11111111-0000-0000-0000-00000000000a', gen_random_uuid(), 'Fake AI text')$$,
  '42501', null, 'student cannot call add_ai_feedback');
select throws_ok($$insert into public.interview_answers (user_id, question_id, answer_text, marks) values ('11111111-0000-0000-0000-00000000000a', 'aaaaaaaa-0000-0000-0000-000000000001', 'x', '{"structure":2,"accuracy":2,"evidence":1}')$$,
  '42501', null, 'student cannot insert answers directly');
select throws_ok($$update public.interview_answers set marks = '{"structure":2,"accuracy":2,"evidence":1}'$$,
  '42501', null, 'student cannot update marks');
select ok(not exists (select 1 from pg_proc where proname in ('record_interview_answer','add_ai_feedback') and pronamespace = 'public'::regnamespace
                        and has_function_privilege('authenticated', oid, 'execute')),
  'no interview-writing function is executable by authenticated');
reset role;
set local request.jwt.claims to '{"role":"anon"}';
set local role anon;
select throws_ok($$select public.record_interview_answer('11111111-0000-0000-0000-00000000000a', 'aaaaaaaa-0000-0000-0000-000000000001', 'x', false, '{"structure":2,"accuracy":2,"evidence":1}')$$,
  '42501', null, 'anon cannot call record_interview_answer');
reset role;

-- =========================================================================================================
-- 2. The server (service role) writes marks, with the checks kept in SQL
-- =========================================================================================================
set local request.jwt.claims to '';
set local role service_role;
select lives_ok($$select public.record_interview_answer('11111111-0000-0000-0000-00000000000a', 'aaaaaaaa-0000-0000-0000-000000000001', 'I built a chatbot', false, '{"structure":2,"accuracy":1,"evidence":1}')$$,
  'server saves an answer with checklist marks');
select is((select total from public.interview_answers where user_id = '11111111-0000-0000-0000-00000000000a'), 4, 'total is computed from the marks');
select throws_ok($$select public.record_interview_answer('11111111-0000-0000-0000-00000000000a', 'aaaaaaaa-0000-0000-0000-000000000001', 'x', false, '{"structure":3,"accuracy":1,"evidence":1}')$$,
  '23514', null, 'marks outside the rubric are refused');
select throws_ok($$select public.record_interview_answer('11111111-0000-0000-0000-00000000000a', 'aaaaaaaa-0000-0000-0000-000000000001', 'x', false, '{"structure":2}')$$,
  '23514', null, 'incomplete marks are refused');
select throws_ok($$select public.record_interview_answer('11111111-0000-0000-0000-00000000000a', 'aaaaaaaa-0000-0000-0000-000000000001', '  ', false, '{"structure":0,"accuracy":0,"evidence":0}')$$,
  '22023', 'answer_required', 'an empty answer must be skipped instead');
select lives_ok($$select public.record_interview_answer('11111111-0000-0000-0000-00000000000a', 'aaaaaaaa-0000-0000-0000-000000000001', 'ignored', true, '{"structure":2,"accuracy":2,"evidence":1}')$$,
  'server records a skipped question');
select is((select total from public.interview_answers where skipped), 0, 'a skipped question scores 0 whatever marks are passed');
select throws_ok($$select public.record_interview_answer('11111111-0000-0000-0000-00000000000d', 'aaaaaaaa-0000-0000-0000-000000000001', 'x', false, '{"structure":0,"accuracy":0,"evidence":0}')$$,
  '42501', 'account_locked', 'a locked account cannot save answers');
select throws_ok($$select public.record_interview_answer('22222222-0000-0000-0000-0000000000d1', 'aaaaaaaa-0000-0000-0000-000000000001', 'x', false, '{"structure":0,"accuracy":0,"evidence":0}')$$,
  '42501', 'forbidden', 'answers belong to students only');
select throws_ok($$select public.record_interview_answer('11111111-0000-0000-0000-00000000000a', gen_random_uuid(), 'x', false, '{"structure":0,"accuracy":0,"evidence":0}')$$,
  'P0002', 'not_found', 'an unknown question is refused');

select lives_ok($$select public.add_ai_feedback('11111111-0000-0000-0000-00000000000a',
                   (select id from public.interview_answers where user_id = '11111111-0000-0000-0000-00000000000a' and not skipped limit 1), 'Name the tool you used.')$$,
  'adult with AI consent gets AI feedback stored');
select is((select count(*)::int from public.interview_answers where ai_used and ai_feedback is not null), 1, 'ai_used is set with the text');
select throws_ok($$select public.add_ai_feedback('11111111-0000-0000-0000-00000000000b',
                   public.record_interview_answer('11111111-0000-0000-0000-00000000000b', 'aaaaaaaa-0000-0000-0000-000000000001', 'Mine', false, '{"structure":1,"accuracy":1,"evidence":0}'), 'AI text')$$,
  '42501', 'ai_not_allowed', 'AI feedback is refused without AI consent');
select throws_ok($$select public.add_ai_feedback('11111111-0000-0000-0000-00000000000c',
                   public.record_interview_answer('11111111-0000-0000-0000-00000000000c', 'aaaaaaaa-0000-0000-0000-000000000001', 'Mine', false, '{"structure":1,"accuracy":1,"evidence":0}'), 'AI text')$$,
  '42501', 'ai_not_allowed', 'AI feedback is refused for an under-18 account, whatever its consent');
select throws_ok($$select public.add_ai_feedback('11111111-0000-0000-0000-00000000000b',
                   (select id from public.interview_answers where user_id = '11111111-0000-0000-0000-00000000000a' limit 1), 'AI text')$$,
  '42501', 'ai_not_allowed', 'feedback cannot be attached to another student''s answer');
reset role;

-- =========================================================================================================
-- 3. review_cards.origin
-- =========================================================================================================
set local request.jwt.claims to '{"sub":"11111111-0000-0000-0000-00000000000a","role":"authenticated","app_metadata":{"role":"student"}}';
set local role authenticated;
select lives_ok($$insert into public.review_cards (user_id, front, back, fsrs, card_due_at, origin) values
                  ('11111111-0000-0000-0000-00000000000a', 'Q', 'A', '{}', now(), 'notes_ai')$$, 'an adult saves AI-made cards labelled notes_ai');
select is((select origin from public.review_cards where front = 'Q'), 'notes_ai', 'the AI label survives saving');
select lives_ok($$insert into public.review_cards (user_id, front, back, fsrs, card_due_at) values ('11111111-0000-0000-0000-00000000000a', 'Q2', 'A', '{}', now())$$,
  'origin defaults');
select is((select origin from public.review_cards where front = 'Q2'), 'lesson', 'origin defaults to lesson');
select throws_ok($$insert into public.review_cards (user_id, front, back, fsrs, card_due_at, origin) values ('11111111-0000-0000-0000-00000000000a', 'Q3', 'A', '{}', now(), 'chatgpt')$$,
  '23514', null, 'unknown origins are refused');
reset role;
set local request.jwt.claims to '{"sub":"11111111-0000-0000-0000-00000000000c","role":"authenticated","app_metadata":{"role":"student"}}';
set local role authenticated;
select throws_ok($$insert into public.review_cards (user_id, front, back, fsrs, card_due_at, origin) values ('11111111-0000-0000-0000-00000000000c', 'Q', 'A', '{}', now(), 'notes_ai')$$,
  '42501', 'ai_not_allowed', 'an under-18 account cannot hold AI-made cards');
reset role;

-- =========================================================================================================
-- 4. ai_calls: the server logs every call; the student can read their own count
-- =========================================================================================================
set local request.jwt.claims to '';
set local role service_role;
insert into public.ai_calls (user_id, kind, ok) values
  ('11111111-0000-0000-0000-00000000000a', 'interview_feedback', true),
  ('11111111-0000-0000-0000-00000000000a', 'interview_feedback', false),
  ('11111111-0000-0000-0000-00000000000a', 'notes_cards', true),
  ('11111111-0000-0000-0000-00000000000b', 'notes_cards', false);
reset role;
set local request.jwt.claims to '{"sub":"11111111-0000-0000-0000-00000000000a","role":"authenticated","app_metadata":{"role":"student"}}';
set local role authenticated;
select is((select count(*)::int from public.ai_calls where created_at >= now() - interval '1 day'), 3,
  'the budget counts every call today, failed ones included, and only the student''s own');
select throws_ok($$insert into public.ai_calls (user_id, kind, ok) values ('11111111-0000-0000-0000-00000000000a', 'interview_feedback', true)$$,
  '42501', null, 'a student cannot write the AI log');
select throws_ok($$delete from public.ai_calls$$, '42501', null, 'a student cannot delete from the AI log (to reset the budget)');
reset role;

select * from finish();
rollback;
