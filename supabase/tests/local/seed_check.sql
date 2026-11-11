-- Checks that supabase/seed.sql produces what the mockup boards show, read through the same functions the
-- app uses. Run by run.sh against the "demo" database. Avoids checks that depend on today's date.
begin;
select plan(29);

select is((select count(*)::int from public.profiles where role = 'student'), 22, '22 demo students');
select is((select count(*)::int from ref.interview_questions), 48, 'reference: 48 interview questions from content/interview');
select ok(not exists (select 1 from ref.interview_questions where prompt like '[Placeholder]%' or not (rubric ? 'keyPoints') or rubric ->> 'why' is null),
  'no placeholder questions: every one has key points and a why');
select ok((select bool_and(id = md5('iq:' || code || ':' || round || ':' || position)::uuid) from ref.interview_questions), 'interview ids follow md5(''iq:'' || key)');
select is((select count(*)::int from public.interview_answers a left join ref.interview_questions q on q.id = a.question_id where q.id is null), 0,
  'every demo answer points at a real question');
select is((select count(*)::int from public.profiles where role = 'adviser'), 3, '3 demo advisers');
select ok((select bool_and(encrypted_password = extensions.crypt('CareerPrep-demo-2026', encrypted_password)) from auth.users),
  'every demo account uses the documented password');
select ok((select bool_and(raw_app_meta_data ->> 'role' = p.role::text) from auth.users u join public.profiles p on p.user_id = u.id),
  'app_metadata.role matches profiles.role');
select is((select programme || ', sem ' || semester || ', ' || target_occupation from public.profiles where full_name = 'Aina Rahman'),
  'Software Engineering, sem 5, 2519-03', 'Aina: Software Engineering, semester 5, target AI engineer');

-- Pn. Nurul Huda
set local request.jwt.claims to '{"sub":"a0000000-0000-4000-8000-000000000001","role":"authenticated","app_metadata":{"role":"adviser"}}';
set local role authenticated;
select is((select count(*)::int from public.bookings b join public.availability_slots s on s.id = b.slot_id
            where s.slot_start between '2026-11-09' and '2026-11-21'), 5, 'Availability board: 5 booked or requested times on 9-20 Nov');
select is((select count(*)::int from public.adviser_students()), 14, 'Students board: 14 students linked');
select is((select skills_ready || ' of ' || skills_total from public.adviser_students() where full_name = 'Aina Rahman'), '4 of 9', 'Aina: 4 of 9 job skills ready');
select is((select skills_ready || ' of ' || skills_total from public.adviser_students() where full_name = 'Daniel Lim'), '4 of 6', 'Daniel: 4 of 6');
select is((select skills_ready || ' of ' || skills_total from public.adviser_students() where full_name = 'Hafiz Ahmad'), '7 of 8', 'Hafiz: 7 of 8');
select is((select skills_ready || ' of ' || skills_total from public.adviser_students() where full_name = 'Kumaran Raj'), '3 of 7', 'Kumaran: 3 of 7');
select is((select sharing from public.adviser_students() where full_name = 'Siti Aisyah'), false, 'Siti: not shared');
select is((select last_session from public.adviser_students() where full_name = 'Nur Iman'), null::timestamptz, 'Nur Iman: no sessions yet');
select is((select r -> 'target' ->> 'title' from public.open_request(md5('booking:b0000000-0000-4000-8000-000000000001:' || extract(epoch from timestamptz '2026-11-19 14:00+08')::bigint)::uuid) r),
  'AI engineer', 'Aina''s 19 Nov request shares the target job');
select is((select jsonb_array_length(r -> 'plan') from public.open_request(md5('booking:b0000000-0000-4000-8000-000000000001:' || extract(epoch from timestamptz '2026-11-19 14:00+08')::bigint)::uuid) r),
  2, 'and her two saved degrees');
select is((select count(*)::int from jsonb_array_elements(
            (select r -> 'gaps' from public.open_request(md5('booking:b0000000-0000-4000-8000-000000000001:' || extract(epoch from timestamptz '2026-11-19 14:00+08')::bigint)::uuid) r)) g
           where g ->> 'state' not in ('have','mastered')), 5, 'and five gap skills still to learn');
select is((select students from public.cohort_rows('Software Engineering') where metric = 'target' and label = 'Software developer'), 5::bigint,
  'Cohort: Software developer shown (5)');
select ok(not exists (select 1 from public.cohort_rows('Software Engineering') where label = 'AI engineer'), 'Cohort: AI engineer (1 student) hidden');
select is((select count(*)::int from public.cohort_rows('Mechatronic Engineering')), 0, 'Cohort: Mechatronic Engineering too small to show');
reset role;

-- Aina
set local request.jwt.claims to '{"sub":"b0000000-0000-4000-8000-000000000001","role":"authenticated","app_metadata":{"role":"student"}}';
set local role authenticated;
select is((select count(*)::int from public.my_bookings()), 4, 'Book board: Aina has 4 bookings');
select is((select count(*)::int from public.my_bookings() where feedback_text is not null), 2, 'with feedback on 2 past sessions');
select is((select count(*)::int from public.review_cards where card_due_at <= '2026-11-11 23:59:59+08'), 6, 'Dashboard: 6 review cards due on 11 Nov');
select is((select count(*)::int from ref.check_questions q join ref.lessons l on l.id = q.lesson_id
            where l.skill_uri = 'careerprep:skill/git'), 5, 'Git has a 5-question check');
select throws_ok($$select answer_key from ref.check_questions$$, '42501', null, 'the answer keys stay hidden');
select ok((select count(*) from public.suggest_skills('pythn', 3)) >= 1, 'A8: a typo still finds Python');
reset role;

select * from finish();
rollback;
