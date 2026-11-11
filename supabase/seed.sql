-- Demo seed for local and preview environments (System Design 3.4: synthetic data only, no real students).
-- Matches the approved mockup boards: Aina Rahman's Dashboard, Skill gap, Lessons, Plan and Book pages, and
-- Pn. Nurul Huda's Requests, Students, Cohort and Availability pages. "Today" in the mockup is Wed 11 Nov 2026.
--
-- Every demo account signs in with password CareerPrep-demo-2026, e.g. aina.rahman@demo.careerprep.test,
-- nurul.huda@demo.careerprep.test (adviser), careers.office@demo.careerprep.test (institution).
--
-- Reference rows are placeholders tagged source_version 'demo-seed'. Codes with a letter suffix (2512-AI,
-- 2521-DA, 2522-NA) and the urn:careerprep:demo:skill:* URIs are NOT official MASCO or ESCO identifiers; the
-- reference import (content/reference) replaces them. Lesson files and check questions marked
-- [Placeholder] are still to be written in content/lessons.

-- ---------------------------------------------------------------------------------------------------------
-- Reference data (D3)
-- ---------------------------------------------------------------------------------------------------------
insert into ref.skills (uri, label_en, label_ms)
select 'urn:careerprep:demo:skill:' || slug, label, null from (values
  ('python', 'Programming in Python'), ('sql', 'Databases and SQL'), ('statistics', 'Statistics'),
  ('pandas', 'Cleaning data with pandas'), ('git', 'Version control with Git'), ('ml-basics', 'Machine learning basics'),
  ('eval-models', 'Evaluating models'), ('pytorch', 'Deep learning with PyTorch'), ('deploy-model', 'Deploying a model'),
  ('unit-testing', 'Unit testing'), ('rest-apis', 'REST APIs'), ('agile-teamwork', 'Agile teamwork'),
  ('oop-design', 'Object-oriented design'), ('data-structures', 'Data structures and algorithms'),
  ('html-css', 'HTML and CSS'), ('javascript', 'JavaScript'), ('responsive-design', 'Responsive web design'),
  ('web-accessibility', 'Web accessibility'), ('react', 'React'), ('spreadsheets', 'Spreadsheets'),
  ('data-visualisation', 'Data visualisation'), ('presenting-findings', 'Presenting findings'),
  ('networking', 'Computer networking'), ('linux', 'Linux administration'), ('network-security', 'Network security'),
  ('cloud', 'Cloud services'), ('troubleshooting', 'Troubleshooting'), ('scripting', 'Shell scripting')
) v(slug, label);

insert into ref.occupations (code, title_en, title_ms, tasks, interest_areas, source_version) values
  ('2512-AI', 'AI engineer', 'Jurutera AI',
   '{"write and maintain program code","maintain software","test and debug software","install and maintain software"}', '{ai,programming}', 'demo-seed'),
  ('2512-01', 'Software developer', 'Pembangun perisian',
   '{"research and analyse software requirements","design and develop software systems","modify existing software to correct errors"}', '{programming}', 'demo-seed'),
  ('2513-01', 'Web developer', 'Pembangun laman web',
   '{"design and develop websites","integrate code with back-end data","work with network specialists on web issues"}', '{programming,design}', 'demo-seed'),
  ('2521-DA', 'Data analyst', 'Penganalisis data',
   '{"collect and clean data","analyse data with statistics","present findings"}', '{data,business}', 'demo-seed'),
  ('2522-NA', 'Network administrator', 'Pentadbir rangkaian',
   '{"operate and maintain networks","help users with network problems","run backup and recovery"}', '{networks}', 'demo-seed');

insert into ref.occupation_skills (code, uri, essential)
select code, 'urn:careerprep:demo:skill:' || slug, true from (values
  ('2512-AI','python'),('2512-AI','sql'),('2512-AI','statistics'),('2512-AI','pandas'),('2512-AI','git'),
  ('2512-AI','ml-basics'),('2512-AI','eval-models'),('2512-AI','pytorch'),('2512-AI','deploy-model'),
  ('2512-01','python'),('2512-01','sql'),('2512-01','git'),('2512-01','unit-testing'),('2512-01','rest-apis'),
  ('2512-01','agile-teamwork'),('2512-01','oop-design'),('2512-01','data-structures'),('2512-01','html-css'),
  ('2513-01','html-css'),('2513-01','javascript'),('2513-01','sql'),('2513-01','git'),('2513-01','rest-apis'),
  ('2513-01','unit-testing'),('2513-01','agile-teamwork'),('2513-01','responsive-design'),('2513-01','web-accessibility'),('2513-01','react'),
  ('2521-DA','sql'),('2521-DA','statistics'),('2521-DA','pandas'),('2521-DA','python'),('2521-DA','spreadsheets'),
  ('2521-DA','data-visualisation'),('2521-DA','git'),('2521-DA','presenting-findings'),
  ('2522-NA','networking'),('2522-NA','linux'),('2522-NA','network-security'),('2522-NA','cloud'),
  ('2522-NA','troubleshooting'),('2522-NA','scripting'),('2522-NA','git'),('2522-NA','python')
) v(code, slug);

-- Four lessons for each AI engineer gap skill (titles from the Lessons board). Ids are derived from names
-- so other seeds and tests can refer to them.
insert into ref.lessons (id, skill_uri, lesson_no, content_path)
select md5('lesson:' || slug || ':' || n)::uuid, 'urn:careerprep:demo:skill:' || slug, n,
       'content/lessons/' || slug || '/' || n || '-' || lower(regexp_replace(title, '[^A-Za-z0-9]+', '-', 'g')) || '.md'
from (values
  ('git', 1, 'Commits and history'), ('git', 2, 'Working with branches'), ('git', 3, 'Merging and conflicts'), ('git', 4, 'Pull requests'),
  ('ml-basics', 1, 'What a model learns'), ('ml-basics', 2, 'Training and test data'), ('ml-basics', 3, 'Your first classifier'), ('ml-basics', 4, 'Choosing features'),
  ('eval-models', 1, 'Accuracy and its limits'), ('eval-models', 2, 'Precision and recall'), ('eval-models', 3, 'Overfitting'), ('eval-models', 4, 'Cross-validation'),
  ('pytorch', 1, 'Tensors'), ('pytorch', 2, 'A small neural network'), ('pytorch', 3, 'Training loops'), ('pytorch', 4, 'Saving a model'),
  ('deploy-model', 1, 'From notebook to script'), ('deploy-model', 2, 'A simple prediction API'), ('deploy-model', 3, 'Running it in the cloud'), ('deploy-model', 4, 'Watching it after launch')
) v(slug, n, title);

-- Five check questions per skill. Git's first three come from the Learning board; the rest are placeholders.
-- options: [{id, text}], answer_key: the id of the right option (read only by submit_mastery_check).
insert into ref.check_questions (id, lesson_id, prompt, options, answer_key) values
  (md5('check:git:1')::uuid, md5('lesson:git:2')::uuid, 'Which command creates a new branch called "fix-header"?',
   '[{"id":"a","text":"git switch fix-header"},{"id":"b","text":"git branch fix-header"},{"id":"c","text":"git merge fix-header"}]', 'b'),
  (md5('check:git:2')::uuid, md5('lesson:git:3')::uuid, 'You are on main and want to bring in work from "fix-header". What do you run?',
   '[{"id":"a","text":"git merge fix-header"},{"id":"b","text":"git branch -d fix-header"},{"id":"c","text":"git commit fix-header"}]', 'a'),
  (md5('check:git:3')::uuid, md5('lesson:git:3')::uuid, 'When does a merge conflict happen?',
   '[{"id":"a","text":"When a branch has no commits"},{"id":"b","text":"When two branches change the same lines"},{"id":"c","text":"When you switch branches too often"}]', 'b');
insert into ref.check_questions (id, lesson_id, prompt, options, answer_key)
select md5('check:' || slug || ':' || q)::uuid, md5('lesson:' || slug || ':' || least(q, 4))::uuid,
       '[Placeholder] Check question ' || q || ' for ' || s.label_en,
       '[{"id":"a","text":"Option A"},{"id":"b","text":"Option B"},{"id":"c","text":"Option C"}]', 'a'
from (values ('ml-basics'), ('eval-models'), ('pytorch'), ('deploy-model')) v(slug)
cross join generate_series(1, 5) q
join ref.skills s on s.uri = 'urn:careerprep:demo:skill:' || slug;
insert into ref.check_questions (id, lesson_id, prompt, options, answer_key)
select md5('check:git:' || q)::uuid, md5('lesson:git:' || case q when 4 then 1 else 4 end)::uuid,
       '[Placeholder] Check question ' || q || ' for Version control with Git',
       '[{"id":"a","text":"Option A"},{"id":"b","text":"Option B"},{"id":"c","text":"Option C"}]', 'a'
from generate_series(4, 5) q;

-- Interview sets: three questions per round. Behavioural questions for Software and Web developer come
-- from content/interview (eMASCO tasks); the rest are placeholders until content/interview has rounds.
insert into ref.interview_questions (id, code, round, position, prompt, rubric) values
  (md5('iq:2512-01:behavioural:1')::uuid, '2512-01', 'behavioural', 1, 'Tell us about a time you worked out what a piece of software needed to do before you built it. How did you find out the requirements?', '{"key_points":[],"placeholder":true}'),
  (md5('iq:2512-01:behavioural:2')::uuid, '2512-01', 'behavioural', 2, 'Walk us through how you designed a program or app you built. Why did you structure it that way?', '{"key_points":[],"placeholder":true}'),
  (md5('iq:2512-01:behavioural:3')::uuid, '2512-01', 'behavioural', 3, 'Describe a time you fixed a bug in code that already existed. How did you find the cause without breaking anything else?', '{"key_points":[],"placeholder":true}'),
  (md5('iq:2513-01:behavioural:1')::uuid, '2513-01', 'behavioural', 1, 'Walk us through a website you designed and built. How did you decide on the layout and the user''s path through it?', '{"key_points":[],"placeholder":true}'),
  (md5('iq:2513-01:behavioural:2')::uuid, '2513-01', 'behavioural', 2, 'Tell us how you connected a web page to data or a back end, for example a form that saves to a database.', '{"key_points":[],"placeholder":true}'),
  (md5('iq:2513-01:behavioural:3')::uuid, '2513-01', 'behavioural', 3, 'Describe a time a website problem turned out to be about hosting, the network or the server rather than your code. How did you work it out?', '{"key_points":[],"placeholder":true}');
insert into ref.interview_questions (id, code, round, position, prompt, rubric)
select md5('iq:' || o.code || ':' || r || ':' || n)::uuid, o.code, r::public.interview_round, n,
       '[Placeholder] ' || initcap(r) || ' question ' || n || ' for ' || o.title_en, '{"key_points":[],"placeholder":true}'
from ref.occupations o cross join (values ('technical'), ('behavioural')) v(r) cross join generate_series(1, 3) n
on conflict (code, round, position) do nothing;

-- Study options from the Plan board
insert into ref.study_options (id, code, level, kind, institution, programme, duration, award, source_url) values
  (md5('so:t1')::uuid, '2512-AI', 'degree', 'Public university', 'Universiti Malaya (UM)', 'Bachelor of Computer Science (Artificial Intelligence)', '4 years', 'Bachelor degree', 'https://www.um.edu.my'),
  (md5('so:t2')::uuid, '2512-AI', 'degree', 'Private university', 'Multimedia University (MMU)', 'Bachelor of Computer Science (Hons) Artificial Intelligence', '3 years', 'Bachelor degree', 'https://www.mmu.edu.my'),
  (md5('so:t7')::uuid, '2512-AI', 'degree', 'Private university', 'Asia Pacific University (APU)', 'BSc (Hons) Computer Science, AI specialism', '3 years', 'Bachelor degree', 'https://www.apu.edu.my'),
  (md5('so:t3')::uuid, '2512-01', 'degree', 'Public university', 'Universiti Teknologi Malaysia (UTM)', 'Bachelor of Computer Science (Software Engineering)', '4 years', 'Bachelor degree', 'https://www.utm.my'),
  (md5('so:t4')::uuid, '2521-DA', 'degree', 'Public university', 'Universiti Teknologi Malaysia (UTM)', 'Bachelor of Computer Science (Data Engineering)', '4 years', 'Bachelor degree', 'https://www.utm.my'),
  (md5('so:s6')::uuid, '2512-01', 'spm', 'Diploma', 'German-Malaysian Institute (GMI)', 'Diploma in Software Engineering', '3 years', 'Diploma', 'https://www.gmi.edu.my');

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
  ('b0000000-0000-4000-8000-000000000001', 'aina.rahman', 'Aina Rahman', 'student', 'Software Engineering', 5, '2512-AI', '{python,sql}', true, null, '2026-09-02 20:15+08'),
  ('b0000000-0000-4000-8000-000000000002', 'daniel.lim', 'Daniel Lim', 'student', 'Software Engineering', 4, '2513-01', '{html-css,javascript,sql,git,responsive-design,react}', true, null, '2026-09-10 10:00+08'),
  ('b0000000-0000-4000-8000-000000000003', 'siti.aisyah', 'Siti Aisyah', 'student', 'Mechatronic Engineering', 5, null, '{}', false, null, '2026-09-12 10:00+08'),
  ('b0000000-0000-4000-8000-000000000004', 'hafiz.ahmad', 'Hafiz Ahmad', 'student', 'Software Engineering', 5, '2512-01', '{python,sql,git,oop-design,data-structures,html-css,agile-teamwork}', true, null, '2026-09-08 10:00+08'),
  ('b0000000-0000-4000-8000-000000000005', 'kumaran.raj', 'Kumaran Raj', 'student', 'Software Engineering', 5, '2521-DA', '{sql,python,spreadsheets}', true, null, '2026-09-15 10:00+08'),
  ('b0000000-0000-4000-8000-000000000006', 'tan.weiling', 'Tan Wei Ling', 'student', 'Software Engineering', 4, '2522-NA', '{networking,linux}', true, null, '2026-09-16 10:00+08'),
  ('b0000000-0000-4000-8000-000000000007', 'nur.iman', 'Nur Iman', 'student', 'Software Engineering', 3, null, '{}', true, null, '2026-10-01 10:00+08'),
  ('b0000000-0000-4000-8000-000000000008', 'farah.zulkifli', 'Farah Zulkifli', 'student', 'Industrial Electronics', 4, null, '{}', false, null, '2026-09-20 10:00+08'),
  -- Other students in the cohort, so that some groups reach 5 (Cohort board) and Pn. Nurul Huda has 14 students
  ('b0000000-0000-4000-8000-000000000101', 'amirul.hakim', 'Amirul Hakim', 'student', 'Software Engineering', 5, '2512-01', '{python,sql,oop-design,data-structures,html-css}', true, null, '2026-09-03 10:00+08'),
  ('b0000000-0000-4000-8000-000000000102', 'lee.jiahui', 'Lee Jia Hui', 'student', 'Software Engineering', 5, '2512-01', '{python,sql,oop-design,html-css}', true, null, '2026-09-03 10:00+08'),
  ('b0000000-0000-4000-8000-000000000103', 'muhammad.danish', 'Muhammad Danish', 'student', 'Software Engineering', 4, '2512-01', '{python,data-structures}', true, null, '2026-09-04 10:00+08'),
  ('b0000000-0000-4000-8000-000000000104', 'priya.devi', 'Priya Devi', 'student', 'Software Engineering', 3, '2512-01', '{sql,html-css}', true, null, '2026-09-04 10:00+08'),
  ('b0000000-0000-4000-8000-000000000105', 'nurul.aqilah', 'Nurul Aqilah', 'student', 'Software Engineering', 4, '2513-01', '{html-css,javascript,responsive-design}', true, null, '2026-09-05 10:00+08'),
  ('b0000000-0000-4000-8000-000000000106', 'ong.kahwai', 'Ong Kah Wai', 'student', 'Software Engineering', 5, '2513-01', '{html-css,javascript,sql}', true, null, '2026-09-05 10:00+08'),
  ('b0000000-0000-4000-8000-000000000107', 'haziq.firdaus', 'Haziq Firdaus', 'student', 'Software Engineering', 3, '2513-01', '{html-css}', true, null, '2026-09-06 10:00+08'),
  ('b0000000-0000-4000-8000-000000000108', 'kavitha.rani', 'Kavitha Rani', 'student', 'Software Engineering', 4, '2513-01', '{html-css,javascript,react}', true, null, '2026-09-06 10:00+08'),
  ('b0000000-0000-4000-8000-000000000109', 'syafiqah.nabila', 'Syafiqah Nabila', 'student', 'Software Engineering', 5, '2521-DA', '{sql,spreadsheets}', true, null, '2026-09-07 10:00+08'),
  ('b0000000-0000-4000-8000-000000000110', 'chong.meiling', 'Chong Mei Ling', 'student', 'Software Engineering', 4, '2521-DA', '{sql,python,statistics}', true, null, '2026-09-07 10:00+08'),
  ('b0000000-0000-4000-8000-000000000111', 'arif.zulkarnain', 'Arif Zulkarnain', 'student', 'Software Engineering', 5, '2521-DA', '{spreadsheets}', true, null, '2026-09-08 10:00+08'),
  ('b0000000-0000-4000-8000-000000000112', 'vinod.kumar', 'Vinod Kumar', 'student', 'Software Engineering', 3, '2521-DA', '{sql}', true, null, '2026-09-08 10:00+08'),
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
       array(select 'urn:careerprep:demo:skill:' || s from unnest(p.skills) s), '{}', p.target,
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
  module_ids = '{SE1013,SE1023,SE2033,SE2043,SE3053}',
  interests = '{ai,programming}',
  job_in_mind = '2512-AI'
where user_id = 'b0000000-0000-4000-8000-000000000001';

-- Settings board: all four choices made on 3 Nov 2026, 9:12 pm.
insert into public.consents (user_id, kind, given, notice_version, given_by, consented_at)
select 'b0000000-0000-4000-8000-000000000001', k::public.consent_kind, true, '1.0', 'self', '2026-11-03 21:12+08'
from unnest(array['terms_privacy','store_use','ai_processing','adviser_visibility']) k;

insert into public.projects (user_id, name, description) values
  ('b0000000-0000-4000-8000-000000000001', 'Class FAQ chatbot',
   'A chatbot that answers common questions from my class. Written in Python; it cleans its question data with pandas.');

insert into public.profile_sessions (user_id, snapshot, created_at) values
  ('b0000000-0000-4000-8000-000000000001', '{"name":"Session 1","focus":"No specific interest","matches":[{"code":"2512-01","fit":"Good"},{"code":"2513-01","fit":"Good"},{"code":"2522-NA","fit":"Some"}]}', '2026-10-20 20:00+08'),
  ('b0000000-0000-4000-8000-000000000001', '{"name":"Session 2","focus":"Data and business","matches":[{"code":"2521-DA","fit":"Strong"}]}', '2026-11-01 20:00+08'),
  ('b0000000-0000-4000-8000-000000000001', '{"name":"Session 3","focus":"AI and programming","matches":[{"code":"2512-AI","fit":"Strong"},{"code":"2512-01","fit":"Good"},{"code":"2521-DA","fit":"Some"}]}', '2026-11-08 20:00+08');

insert into public.saved_study_options (user_id, option_id, saved_at) values
  ('b0000000-0000-4000-8000-000000000001', md5('so:t1')::uuid, '2026-11-08 20:10+08'),
  ('b0000000-0000-4000-8000-000000000001', md5('so:t2')::uuid, '2026-11-08 20:11+08');

-- Skill gap board: 4 of 9 ready (Python, SQL, Statistics, pandas); Git lesson 2 in progress; ML basics lesson 1 done.
insert into public.mastery_checks (user_id, skill_uri, score, retake_after_lesson, taken_at) values
  ('b0000000-0000-4000-8000-000000000001', 'urn:careerprep:demo:skill:statistics', 4, null, '2026-10-30 19:00+08'),
  ('b0000000-0000-4000-8000-000000000001', 'urn:careerprep:demo:skill:sql', 5, null, '2026-11-03 20:00+08');
insert into public.skill_progress (user_id, skill_uri, state, claimed, evidence, updated_at) values
  ('b0000000-0000-4000-8000-000000000001', 'urn:careerprep:demo:skill:statistics', 'mastered', false, 'Passed the statistics check on 30 Oct.', '2026-10-30 19:00+08'),
  ('b0000000-0000-4000-8000-000000000001', 'urn:careerprep:demo:skill:sql', 'mastered', false, 'Passed the SQL check on 3 Nov.', '2026-11-03 20:00+08'),
  ('b0000000-0000-4000-8000-000000000001', 'urn:careerprep:demo:skill:pandas', 'have', false, 'The Class FAQ chatbot project cleans its question data with pandas.', '2026-10-20 20:00+08'),
  ('b0000000-0000-4000-8000-000000000001', 'urn:careerprep:demo:skill:git', 'learning', false, null, '2026-11-05 21:00+08'),
  ('b0000000-0000-4000-8000-000000000001', 'urn:careerprep:demo:skill:ml-basics', 'learning', false, null, '2026-11-07 21:00+08');
insert into public.lesson_progress (user_id, lesson_id, notes, done_at) values
  ('b0000000-0000-4000-8000-000000000001', md5('lesson:git:1')::uuid, 'commit = saved snapshot with a message', '2026-11-05 21:00+08'),
  ('b0000000-0000-4000-8000-000000000001', md5('lesson:git:2')::uuid,
   E'branch = copy of code to work on safely\ngit branch name -> make it\ngit switch name -> go to it\nmerge from main when done\nconflict = same lines changed, need to pick', null),
  ('b0000000-0000-4000-8000-000000000001', md5('lesson:ml-basics:1')::uuid, null, '2026-11-07 21:00+08');

-- Dashboard: 6 review cards due today
insert into public.review_cards (user_id, skill_uri, front, back, fsrs, card_due_at)
select 'b0000000-0000-4000-8000-000000000001', 'urn:careerprep:demo:skill:' || skill, front, back,
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
  ('b0000000-0000-4000-8000-000000000001', md5('iq:2512-AI:technical:1')::uuid,
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
