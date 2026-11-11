-- Demo seed for local and preview environments (System Design 3.4: synthetic data only, no real students).
-- Matches the approved mockup boards: Aina Rahman's Dashboard, Skill gap, Lessons, Plan and Book pages, and
-- Pn. Nurul Huda's Requests, Students, Cohort and Availability pages. "Today" in the mockup is Wed 11 Nov 2026.
--
-- Every demo account signs in with password CareerPrep-demo-2026, e.g. aina.rahman@demo.careerprep.test,
-- nurul.huda@demo.careerprep.test (adviser), careers.office@demo.careerprep.test (institution).
--
-- Reference data comes from seed_reference.sql (the full-stack content, loaded first). The two occupations
-- the mockup names differently use the reference titles: "Network specialist" (2523-01) for the board's
-- "Network administrator"; skill counts follow the reference sets (e.g. Software developer has 8 skills).

-- ---------------------------------------------------------------------------------------------------------
-- People (D1). Auth users the way the server creates them (role in app_metadata), then their profiles.
-- ---------------------------------------------------------------------------------------------------------
create temp table _people (
  id uuid primary key, email text, full_name text, role public.user_role, programme text, semester smallint,
  target text, skills text[], sharing boolean, staff_unit text, joined timestamptz
);

insert into _people values
  ('a0000000-0000-4000-8000-000000000001', 'nurul.huda', 'Pn. Nurul Huda', 'adviser', null, null, null, '{}', null, 'Career services', '2026-08-03 09:00+08'),
  ('a0000000-0000-4000-8000-000000000002', 'faizal.rahim', 'En. Faizal Rahim', 'adviser', null, null, null, '{}', null, 'Industry liaison', '2026-08-03 09:00+08'),
  ('a0000000-0000-4000-8000-000000000003', 'priya.nair', 'Ms. Priya Nair', 'adviser', null, null, null, '{}', null, 'Student counselling', '2026-08-03 09:00+08'),
  ('a0000000-0000-4000-8000-000000000009', 'careers.office', 'GMI Career Services Office', 'institution', null, null, null, '{}', null, null, '2026-08-03 09:00+08'),
  -- Students named on the adviser boards
  ('b0000000-0000-4000-8000-000000000001', 'aina.rahman', 'Aina Rahman', 'student', 'Software Engineering', 5, '2519-03', '{python,sql}', true, null, '2026-09-02 20:15+08'),
  ('b0000000-0000-4000-8000-000000000002', 'daniel.lim', 'Daniel Lim', 'student', 'Software Engineering', 4, '2513-01', '{html-css,javascript,sql,web-programming}', true, null, '2026-09-10 10:00+08'),
  ('b0000000-0000-4000-8000-000000000003', 'siti.aisyah', 'Siti Aisyah', 'student', 'Mechatronic Engineering', 5, null, '{}', false, null, '2026-09-12 10:00+08'),
  ('b0000000-0000-4000-8000-000000000004', 'hafiz.ahmad', 'Hafiz Ahmad', 'student', 'Software Engineering', 5, '2512-01', '{java,javascript,sql,git,software-design,requirements,software-testing}', true, null, '2026-09-08 10:00+08'),
  ('b0000000-0000-4000-8000-000000000005', 'kumaran.raj', 'Kumaran Raj', 'student', 'Software Engineering', 5, '2524-03', '{sql,python,spreadsheets}', true, null, '2026-09-15 10:00+08'),
  ('b0000000-0000-4000-8000-000000000006', 'tan.weiling', 'Tan Wei Ling', 'student', 'Software Engineering', 4, '2523-01', '{networking,linux}', true, null, '2026-09-16 10:00+08'),
  ('b0000000-0000-4000-8000-000000000007', 'nur.iman', 'Nur Iman', 'student', 'Software Engineering', 3, null, '{}', true, null, '2026-10-01 10:00+08'),
  ('b0000000-0000-4000-8000-000000000008', 'farah.zulkifli', 'Farah Zulkifli', 'student', 'Industrial Electronics', 4, null, '{}', false, null, '2026-09-20 10:00+08'),
  -- Other students in the cohort, so that some groups reach 5 (Cohort board) and Pn. Nurul Huda has 14 students
  ('b0000000-0000-4000-8000-000000000101', 'amirul.hakim', 'Amirul Hakim', 'student', 'Software Engineering', 5, '2512-01', '{java,sql,software-design,requirements}', true, null, '2026-09-03 10:00+08'),
  ('b0000000-0000-4000-8000-000000000102', 'lee.jiahui', 'Lee Jia Hui', 'student', 'Software Engineering', 5, '2512-01', '{java,javascript,sql}', true, null, '2026-09-03 10:00+08'),
  ('b0000000-0000-4000-8000-000000000103', 'muhammad.danish', 'Muhammad Danish', 'student', 'Software Engineering', 4, '2512-01', '{java}', true, null, '2026-09-04 10:00+08'),
  ('b0000000-0000-4000-8000-000000000104', 'priya.devi', 'Priya Devi', 'student', 'Software Engineering', 3, '2512-01', '{sql,javascript}', true, null, '2026-09-04 10:00+08'),
  ('b0000000-0000-4000-8000-000000000105', 'nurul.aqilah', 'Nurul Aqilah', 'student', 'Software Engineering', 4, '2513-01', '{html-css,javascript}', true, null, '2026-09-05 10:00+08'),
  ('b0000000-0000-4000-8000-000000000106', 'ong.kahwai', 'Ong Kah Wai', 'student', 'Software Engineering', 5, '2513-01', '{html-css,javascript,sql}', true, null, '2026-09-05 10:00+08'),
  ('b0000000-0000-4000-8000-000000000107', 'haziq.firdaus', 'Haziq Firdaus', 'student', 'Software Engineering', 3, '2513-01', '{html-css}', true, null, '2026-09-06 10:00+08'),
  ('b0000000-0000-4000-8000-000000000108', 'kavitha.rani', 'Kavitha Rani', 'student', 'Software Engineering', 4, '2513-01', '{html-css,javascript,ui-design}', true, null, '2026-09-06 10:00+08'),
  ('b0000000-0000-4000-8000-000000000109', 'syafiqah.nabila', 'Syafiqah Nabila', 'student', 'Software Engineering', 5, '2524-03', '{sql,spreadsheets}', true, null, '2026-09-07 10:00+08'),
  ('b0000000-0000-4000-8000-000000000110', 'chong.meiling', 'Chong Mei Ling', 'student', 'Software Engineering', 4, '2524-03', '{sql,python,statistics}', true, null, '2026-09-07 10:00+08'),
  ('b0000000-0000-4000-8000-000000000111', 'arif.zulkarnain', 'Arif Zulkarnain', 'student', 'Software Engineering', 5, '2524-03', '{spreadsheets}', true, null, '2026-09-08 10:00+08'),
  ('b0000000-0000-4000-8000-000000000112', 'vinod.kumar', 'Vinod Kumar', 'student', 'Software Engineering', 3, '2524-03', '{sql}', true, null, '2026-09-08 10:00+08'),
  ('b0000000-0000-4000-8000-000000000113', 'aiman.hafiz', 'Aiman Hafiz', 'student', 'Mechatronic Engineering', 4, null, '{}', false, null, '2026-09-09 10:00+08'),
  ('b0000000-0000-4000-8000-000000000114', 'goh.siewlan', 'Goh Siew Lan', 'student', 'Mechatronic Engineering', 5, null, '{}', true, null, '2026-09-09 10:00+08');

insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change)
select '00000000-0000-0000-0000-000000000000', p.id, 'authenticated', 'authenticated',
       p.email || '@demo.careerprep.test', extensions.crypt('CareerPrep-demo-2026', extensions.gen_salt('bf')), p.joined,
       jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email'), 'role', p.role),
       jsonb_build_object('full_name', p.full_name), p.joined, p.joined, '', '', '', ''
from _people p;

insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
select p.id::text, p.id, jsonb_build_object('sub', p.id::text, 'email', p.email || '@demo.careerprep.test', 'email_verified', true),
       'email', p.joined, p.joined, p.joined
from _people p;

insert into public.profiles (user_id, role, full_name, education_level, programme, semester, institution, staff_unit,
  skills, interests, target_occupation, last_login_at, created_at)
select p.id, p.role, p.full_name,
       case when p.role = 'student' then 'diploma'::public.edu_level end, p.programme, p.semester,
       'German-Malaysian Institute (GMI)', p.staff_unit,
       array(select 'careerprep:skill/' || s from unnest(p.skills) s), '{}', p.target,
       timestamptz '2026-11-10 21:00+08', p.joined
from _people p;

-- Consents (D2): every student agreed to the required two and to AI feedback; adviser visibility as on the boards.
insert into public.consents (user_id, kind, given, notice_version, given_by, consented_at)
select p.id, k.kind::public.consent_kind, case when k.kind = 'adviser_visibility' then p.sharing else true end, '1.0', 'self', p.joined
from _people p cross join (values ('terms_privacy'), ('store_use'), ('ai_processing'), ('adviser_visibility')) k(kind)
where p.role = 'student' and p.id <> 'b0000000-0000-4000-8000-000000000001';

insert into public.staff_undertakings (adviser_id, version, accepted_at) values
  ('a0000000-0000-4000-8000-000000000001', '2026-11', '2026-11-02 09:00+08'),
  ('a0000000-0000-4000-8000-000000000002', '2026-11', '2026-11-02 10:30+08'),
  ('a0000000-0000-4000-8000-000000000003', '2026-11', '2026-11-03 08:45+08');

-- ---------------------------------------------------------------------------------------------------------
-- Aina Rahman: Diploma in Software Engineering, semester 5, target AI engineer
-- ---------------------------------------------------------------------------------------------------------
update public.profiles set
  spm_grades = '[{"subject":"Bahasa Melayu","grade":"A-"},{"subject":"English","grade":"A"},{"subject":"Mathematics","grade":"A"},
                 {"subject":"Additional Mathematics","grade":"B+"},{"subject":"Physics","grade":"B"},{"subject":"Chemistry","grade":"B"}]',
  module_ids = '{gmi-dse-basic-programming,gmi-dse-basic-software-testing,gmi-dse-modelling-requirements,gmi-dse-quality-assurance,gmi-dse-advanced-web-programming}',
  interests = '{Artificial intelligence,Programming}',
  job_in_mind = '2519-03'
where user_id = 'b0000000-0000-4000-8000-000000000001';

-- Settings board: all four choices made on 3 Nov 2026, 9:12 pm.
insert into public.consents (user_id, kind, given, notice_version, given_by, consented_at)
select 'b0000000-0000-4000-8000-000000000001', k::public.consent_kind, true, '1.0', 'self', '2026-11-03 21:12+08'
from unnest(array['terms_privacy','store_use','ai_processing','adviser_visibility']) k;

insert into public.projects (user_id, name, description) values
  ('b0000000-0000-4000-8000-000000000001', 'Class FAQ chatbot',
   'A chatbot that answers common questions from my class. Written in Python; it cleans its question data with pandas.');

insert into public.profile_sessions (user_id, snapshot, created_at) values
  ('b0000000-0000-4000-8000-000000000001', '{"name":"Session 1","focus":"No specific interest","matches":[{"code":"2512-01","fit":"Good"},{"code":"2513-01","fit":"Good"},{"code":"2523-01","fit":"Some"}]}', '2026-10-20 20:00+08'),
  ('b0000000-0000-4000-8000-000000000001', '{"name":"Session 2","focus":"Data and business","matches":[{"code":"2524-03","fit":"Strong"}]}', '2026-11-01 20:00+08'),
  ('b0000000-0000-4000-8000-000000000001', '{"name":"Session 3","focus":"AI and programming","matches":[{"code":"2519-03","fit":"Strong"},{"code":"2512-01","fit":"Good"},{"code":"2524-03","fit":"Some"}]}', '2026-11-08 20:00+08');

insert into public.saved_study_options (user_id, option_id, saved_at) values
  ('b0000000-0000-4000-8000-000000000001', (select id from ref.study_options where code = '2519-03' and institution like 'Universiti Malaya%'), '2026-11-08 20:10+08'),
  ('b0000000-0000-4000-8000-000000000001', (select id from ref.study_options where code = '2519-03' and institution like 'Multimedia University%'), '2026-11-08 20:11+08');

-- Skill gap board: 4 of 9 ready (Python, SQL, Statistics, cleaning data); Git lesson 2 in progress; machine learning lesson 1 done.
-- Checks are inserted here directly; in the app the server inserts them with the service role.
insert into public.mastery_checks (user_id, skill_uri, score, retake_after_lesson, taken_at) values
  ('b0000000-0000-4000-8000-000000000001', 'careerprep:skill/statistics', 4, null, '2026-10-30 19:00+08'),
  ('b0000000-0000-4000-8000-000000000001', 'careerprep:skill/sql', 5, null, '2026-11-03 20:00+08');
insert into public.skill_progress (user_id, skill_uri, state, claimed, evidence, updated_at) values
  ('b0000000-0000-4000-8000-000000000001', 'careerprep:skill/statistics', 'mastered', false, 'Passed the statistics check on 30 Oct.', '2026-10-30 19:00+08'),
  ('b0000000-0000-4000-8000-000000000001', 'careerprep:skill/sql', 'mastered', false, 'Passed the SQL check on 3 Nov.', '2026-11-03 20:00+08'),
  ('b0000000-0000-4000-8000-000000000001', 'careerprep:skill/data-cleansing', 'have', false, 'The Class FAQ chatbot project cleans its question data with pandas.', '2026-10-20 20:00+08'),
  ('b0000000-0000-4000-8000-000000000001', 'careerprep:skill/git', 'learning', false, null, '2026-11-05 21:00+08'),
  ('b0000000-0000-4000-8000-000000000001', 'careerprep:skill/machine-learning', 'learning', false, null, '2026-11-07 21:00+08');
insert into public.lesson_progress (user_id, lesson_id, notes, done_at) values
  ('b0000000-0000-4000-8000-000000000001', (select id from ref.lessons where skill_uri = 'careerprep:skill/git' and lesson_no = 1), 'commit = saved snapshot with a message', '2026-11-05 21:00+08'),
  ('b0000000-0000-4000-8000-000000000001', (select id from ref.lessons where skill_uri = 'careerprep:skill/git' and lesson_no = 2),
   E'branch = copy of code to work on safely\ngit branch name -> make it\ngit switch name -> go to it\nmerge from main when done\nconflict = same lines changed, need to pick', null),
  ('b0000000-0000-4000-8000-000000000001', (select id from ref.lessons where skill_uri = 'careerprep:skill/machine-learning' and lesson_no = 1), null, '2026-11-07 21:00+08');

-- Dashboard: 6 review cards due today
insert into public.review_cards (user_id, skill_uri, front, back, fsrs, card_due_at)
select 'b0000000-0000-4000-8000-000000000001', 'careerprep:skill/' || skill, front, back,
       '{"state":2,"stability":3.2,"difficulty":5.1,"reps":2,"lapses":0}', '2026-11-11 08:00+08'
from (values
  ('sql', 'What does a LEFT JOIN keep?', 'Every row from the left table, with matches from the right or NULL.'),
  ('sql', 'WHERE or HAVING: which filters groups?', 'HAVING filters groups after GROUP BY; WHERE filters rows before.'),
  ('sql', 'Why add an index?', 'To find rows by a column without reading the whole table.'),
  ('statistics', 'Mean or median for skewed data?', 'Median: one very large value does not pull it.'),
  ('statistics', 'What does a standard deviation tell you?', 'How far values usually sit from the mean.'),
  ('statistics', 'Correlation of 0.9 means causation?', 'No. It shows the two move together, not why.')
) v(skill, front, back);

-- Mock interview on 20 Oct (Skill gap: "Evaluating models came up in your 20 Oct mock interview")
insert into public.interview_answers (user_id, question_id, answer_text, skipped, marks, ai_used, ai_feedback, created_at) values
  ('b0000000-0000-4000-8000-000000000001', md5('iq:2519-03:technical:1')::uuid,
   'I would train the model on our FAQ data and check if the answers look right.', false,
   '{"structure":1,"accuracy":1,"evidence":0}', false, null, '2026-10-20 21:00+08');

-- Other mock interviews this month (Adviser board quotes Daniel and Hafiz; others feed the Cohort count)
insert into public.interview_answers (user_id, question_id, answer_text, skipped, marks, ai_used, ai_feedback, created_at) values
  ('b0000000-0000-4000-8000-000000000002', md5('iq:2513-01:behavioural:1')::uuid,
   'Our team built a site for a food stall. We planned the pages together and tested them on phones.', false,
   '{"structure":1,"accuracy":1,"evidence":1}', true,
   'Good examples, but say what you did yourself, not only what the team did.', '2026-11-06 20:00+08'),
  ('b0000000-0000-4000-8000-000000000004', md5('iq:2512-01:technical:1')::uuid,
   'I wrote unit tests for the booking module with pytest before changing the date logic.', false,
   '{"structure":2,"accuracy":1,"evidence":1}', true,
   'Clear on unit testing. Give a number when you talk about results.', '2026-11-02 20:00+08');
insert into public.interview_answers (user_id, question_id, answer_text, skipped, marks, created_at)
select p.id, md5('iq:' || p.target || ':technical:1')::uuid, 'Practice answer.', false,
       '{"structure":1,"accuracy":1,"evidence":0}', timestamptz '2026-11-04 20:00+08' + (row_number() over (order by p.id)) * interval '1 day'
from _people p
where p.id in ('b0000000-0000-4000-8000-000000000101', 'b0000000-0000-4000-8000-000000000103', 'b0000000-0000-4000-8000-000000000105',
               'b0000000-0000-4000-8000-000000000107', 'b0000000-0000-4000-8000-000000000109');

-- ---------------------------------------------------------------------------------------------------------
-- Advisers' time (D6). Booked and past sessions first, then the open grid on the Availability board.
-- ---------------------------------------------------------------------------------------------------------
-- Slot, booking and request ids are md5('slot|booking|request:' || student/adviser id || ':' || epoch seconds)::uuid.
create temp table _sessions (
  student uuid, adviser uuid, starts timestamptz, status public.booking_state, topic text, note text, shared text[],
  requested timestamptz, feedback text
);

insert into _sessions values
  -- Pn. Nurul Huda, upcoming (Requests, Book, Availability boards)
  ('b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', '2026-11-19 14:00+08', 'requested', 'Career matches',
   'Which of my matches can I aim for in industrial training, before I start a degree?', '{target_matches,gap_progress,study_plan}', '2026-11-10 21:30+08', null),
  ('b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', '2026-11-12 10:00+08', 'accepted', 'Study plan', null, '{study_plan}', '2026-11-09 20:00+08', null),
  ('b0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000001', '2026-11-13 10:00+08', 'requested', 'Interview practice', null, '{target_matches,interview_feedback}', '2026-11-10 18:00+08', null),
  ('b0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000001', '2026-11-13 15:30+08', 'accepted', 'Industrial training placement', null, '{}', '2026-11-08 12:00+08', null),
  ('b0000000-0000-4000-8000-000000000005', 'a0000000-0000-4000-8000-000000000001', '2026-11-12 15:30+08', 'accepted', 'Career matches', null, '{target_matches}', '2026-11-07 12:00+08', null),
  -- Pn. Nurul Huda, past sessions (Students board "Last session")
  ('b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', '2026-10-28 14:00+08', 'completed', 'Career matches', null, '{target_matches,gap_progress}', '2026-10-25 20:00+08',
   'Your matches are realistic. Aim for an AI-related industrial training placement, and finish the Git lessons first.'),
  ('b0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000001', '2026-10-29 10:00+08', 'completed', 'Career matches', null, '{target_matches}', '2026-10-26 12:00+08', null),
  ('b0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000001', '2026-10-22 11:30+08', 'completed', 'Industrial training placement', null, '{}', '2026-10-19 12:00+08', null),
  ('b0000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000001', '2026-11-03 11:30+08', 'completed', 'Interview practice', null, '{target_matches,interview_feedback}', '2026-10-30 12:00+08',
   'Strong technical answers. Next time, say how many users or tests your work covered.'),
  ('b0000000-0000-4000-8000-000000000005', 'a0000000-0000-4000-8000-000000000001', '2026-11-01 10:00+08', 'completed', 'Career matches', null, '{target_matches}', '2026-10-28 12:00+08', null),
  ('b0000000-0000-4000-8000-000000000006', 'a0000000-0000-4000-8000-000000000001', '2026-10-18 14:00+08', 'completed', 'Career matches', null, '{}', '2026-10-15 12:00+08', null),
  ('b0000000-0000-4000-8000-000000000007', 'a0000000-0000-4000-8000-000000000001', '2026-11-06 10:00+08', 'cancelled', 'Career matches', null, '{}', '2026-11-02 12:00+08', null),
  ('b0000000-0000-4000-8000-000000000008', 'a0000000-0000-4000-8000-000000000001', '2026-10-15 15:30+08', 'completed', 'Study plan', null, '{}', '2026-10-12 12:00+08', null),
  ('b0000000-0000-4000-8000-000000000101', 'a0000000-0000-4000-8000-000000000001', '2026-10-06 10:00+08', 'completed', 'Career matches', null, '{}', '2026-10-02 12:00+08', null),
  ('b0000000-0000-4000-8000-000000000102', 'a0000000-0000-4000-8000-000000000001', '2026-10-06 11:30+08', 'completed', 'Career matches', null, '{}', '2026-10-02 12:00+08', null),
  ('b0000000-0000-4000-8000-000000000105', 'a0000000-0000-4000-8000-000000000001', '2026-10-07 10:00+08', 'completed', 'Interview practice', null, '{}', '2026-10-03 12:00+08', null),
  ('b0000000-0000-4000-8000-000000000106', 'a0000000-0000-4000-8000-000000000001', '2026-10-07 14:00+08', 'completed', 'Study plan', null, '{}', '2026-10-03 12:00+08', null),
  ('b0000000-0000-4000-8000-000000000109', 'a0000000-0000-4000-8000-000000000001', '2026-10-08 10:00+08', 'completed', 'Career matches', null, '{}', '2026-10-04 12:00+08', null),
  ('b0000000-0000-4000-8000-000000000110', 'a0000000-0000-4000-8000-000000000001', '2026-10-09 11:30+08', 'completed', 'Career matches', null, '{}', '2026-10-05 12:00+08', null),
  -- En. Faizal Rahim (Book board, Aina's history)
  ('b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000002', '2026-10-14 11:30+08', 'completed', 'Interview practice', null, '{interview_feedback}', '2026-10-10 20:00+08',
   'You explained your chatbot clearly. Practise one answer about a time something went wrong.');

insert into public.availability_slots (id, adviser_id, slot_start, minutes, is_open)
select md5('slot:' || adviser || ':' || extract(epoch from starts)::bigint)::uuid, adviser, starts, 30, true from _sessions;

insert into public.bookings (id, student_id, slot_id, topic, note, status, shared_items, request_id, created_at)
select md5('booking:' || student || ':' || extract(epoch from starts)::bigint)::uuid, student, md5('slot:' || adviser || ':' || extract(epoch from starts)::bigint)::uuid,
       topic, note, status, shared, md5('request:' || student || ':' || extract(epoch from starts)::bigint)::uuid, requested
from _sessions;

insert into public.booking_status_history (booking_id, status, changed_by, changed_at)
select md5('booking:' || student || ':' || extract(epoch from starts)::bigint)::uuid, 'requested'::public.booking_state, student, requested from _sessions
union all
select md5('booking:' || student || ':' || extract(epoch from starts)::bigint)::uuid, 'accepted', adviser,
       case when starts = '2026-11-12 10:00+08' and student = 'b0000000-0000-4000-8000-000000000001'
            then timestamptz '2026-11-11 08:50+08' else requested + interval '1 day' end
  from _sessions where status in ('accepted', 'completed')
union all
select md5('booking:' || student || ':' || extract(epoch from starts)::bigint)::uuid, 'completed', adviser, starts + interval '30 minutes' from _sessions where status = 'completed'
union all
select md5('booking:' || student || ':' || extract(epoch from starts)::bigint)::uuid, 'cancelled', student, requested + interval '2 days' from _sessions where status = 'cancelled';

insert into public.adviser_feedback (booking_id, feedback_text, sent_at)
select md5('booking:' || student || ':' || extract(epoch from starts)::bigint)::uuid, feedback, starts + interval '3 hours' from _sessions where feedback is not null;

-- Pn. Nurul Huda's open grid, weeks of 9 and 16 Nov (Availability board), 30-minute slots
insert into public.availability_slots (adviser_id, slot_start, minutes, is_open)
select 'a0000000-0000-4000-8000-000000000001', ((w + d.offs) + d.at) at time zone 'Asia/Kuala_Lumpur', 30, true
from (values (date '2026-11-09'), (date '2026-11-16')) wk(w)
cross join lateral (values
  (0, time '10:00'), (0, time '11:30'), (1, time '14:00'), (1, time '15:30'), (2, time '10:00'),
  (3, time '09:00'), (3, time '11:30'), (3, time '14:00'), (3, time '16:30'), (4, time '09:00'), (4, time '11:30')
) d(offs, at)
on conflict (adviser_id, slot_start) do nothing;

insert into public.blocked_days (adviser_id, day, reason) values
  ('a0000000-0000-4000-8000-000000000001', '2026-11-18', 'Industry visit');

-- A few open times for the other advisers (Book board adviser picker)
insert into public.availability_slots (adviser_id, slot_start, minutes, is_open)
select a, (d + t) at time zone 'Asia/Kuala_Lumpur', 60, true
from (values ('a0000000-0000-4000-8000-000000000002'::uuid), ('a0000000-0000-4000-8000-000000000003'::uuid)) v(a)
cross join (values (date '2026-11-12'), (date '2026-11-17'), (date '2026-11-20')) dd(d)
cross join (values (time '10:00'), (time '14:00')) tt(t)
on conflict (adviser_id, slot_start) do nothing;

drop table _sessions, _people;
