-- CareerPrep schema (System Design section 3.2). Data stores D1 to D8.
create extension if not exists pgcrypto;
create extension if not exists pg_trgm;
create schema if not exists ref;

create type user_role       as enum ('student','adviser','institution');
create type edu_level       as enum ('spm','pre_university','diploma','degree');
create type consent_kind    as enum ('terms_privacy','store_use','ai_processing','adviser_visibility','parent');
create type skill_state     as enum ('have','learning','missing','check_needed','mastered');
create type booking_state   as enum ('requested','accepted','declined','change_requested','cancelled','completed');
create type interview_round as enum ('technical','behavioural');

-- D3 Reference data (read-only to app roles)
create table ref.occupations (
  code text primary key, title_en text not null, title_ms text,
  tasks text[] not null, interest_areas text[] not null default '{}', source_version text not null
);
create table ref.skills (uri text primary key, label_en text not null, label_ms text, alt_labels text[] not null default '{}');
create table ref.occupation_skills (
  code text references ref.occupations on delete cascade, uri text references ref.skills on delete cascade,
  essential boolean not null, primary key (code, uri)
);
create table ref.lessons (
  id uuid primary key default gen_random_uuid(), skill_uri text not null references ref.skills,
  lesson_no int not null check (lesson_no between 1 and 4), content_path text not null, unique (skill_uri, lesson_no)
);
create table ref.check_questions (
  id uuid primary key default gen_random_uuid(), lesson_id uuid not null references ref.lessons on delete cascade,
  prompt text not null, options jsonb not null, answer_key text not null
);
create table ref.interview_questions (
  id uuid primary key default gen_random_uuid(), code text not null references ref.occupations,
  round interview_round not null, position int not null check (position between 1 and 3),
  prompt text not null, rubric jsonb not null, unique (code, round, position)
);
create table ref.study_options (
  id uuid primary key default gen_random_uuid(), code text references ref.occupations, level edu_level not null,
  kind text not null, institution text not null, programme text not null, duration text, award text, source_url text not null
);

-- D1 Accounts and profiles
create table profiles (
  user_id            uuid primary key references auth.users(id) on delete cascade,
  role               user_role not null,
  full_name          text not null check (char_length(full_name) between 2 and 100),
  is_under_18        boolean not null default false,
  account_locked     boolean not null default false,
  education_level    edu_level,
  spm_grades         jsonb not null default '[]',
  module_ids         text[] not null default '{}',
  skills             text[] not null default '{}',
  interests          text[] not null default '{}',
  job_in_mind        text references ref.occupations(code),
  target_occupation  text references ref.occupations(code),
  locale             text not null default 'en' check (locale in ('en','ms')),
  last_login_at      timestamptz not null default now(),
  created_at         timestamptz not null default now()
);
create table profile_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles on delete cascade,
  snapshot jsonb not null, created_at timestamptz not null default now()
);
create table projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  description text check (char_length(description) <= 1000),
  link text check (link ~ '^https://')
);

-- D2 Consents (append-only)
create table consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles on delete cascade,
  kind consent_kind not null, given boolean not null, notice_version text not null,
  given_by text not null default 'self' check (given_by in ('self','parent')),
  consented_at timestamptz not null default now()
);
create table parent_approvals (
  user_id uuid primary key references profiles on delete cascade,
  parent_email text not null, token_hash text not null unique, expires_at timestamptz not null,
  decision boolean, decided_at timestamptz
);
create table staff_undertakings (
  id uuid primary key default gen_random_uuid(),
  adviser_id uuid not null references profiles on delete cascade,
  version text not null, accepted_at timestamptz not null default now(), unique (adviser_id, version)
);
create table app_settings (key text primary key, value text not null);
insert into app_settings values ('undertaking_version', '2026-11');

-- D4 Learning progress
create table saved_study_options (
  user_id uuid references profiles on delete cascade, option_id uuid references ref.study_options,
  saved_at timestamptz not null default now(), primary key (user_id, option_id)
);
create table skill_progress (
  user_id uuid references profiles on delete cascade, skill_uri text references ref.skills,
  state skill_state not null, claimed boolean not null default false, evidence text,
  updated_at timestamptz not null default now(), primary key (user_id, skill_uri)
);
create table lesson_progress (
  user_id uuid references profiles on delete cascade, lesson_id uuid references ref.lessons,
  notes text check (char_length(notes) <= 20000), done_at timestamptz, primary key (user_id, lesson_id)
);
create table mastery_checks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles on delete cascade, skill_uri text not null references ref.skills,
  score int not null check (score between 0 and 5),
  retake_after_lesson int check (retake_after_lesson between 1 and 4),
  taken_at timestamptz not null default now()
);
create table review_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles on delete cascade, skill_uri text references ref.skills,
  front text not null, back text not null, fsrs jsonb not null, card_due_at timestamptz not null
);

-- D5 Interview answers
create table interview_answers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles on delete cascade,
  question_id uuid not null references ref.interview_questions,
  answer_text text check (char_length(answer_text) <= 4000),
  skipped boolean not null default false,
  marks jsonb not null,
  total int generated always as ((marks->>'structure')::int + (marks->>'accuracy')::int + (marks->>'evidence')::int) stored,
  ai_used boolean not null default false, ai_feedback text,
  created_at timestamptz not null default now(),
  check (skipped or answer_text is not null),
  check (ai_used or ai_feedback is null)
);

-- D6 Bookings and availability
create table availability_slots (
  id uuid primary key default gen_random_uuid(),
  adviser_id uuid not null references profiles on delete cascade,
  slot_start timestamptz not null, minutes int not null check (minutes in (30, 60)),
  is_open boolean not null default true, unique (adviser_id, slot_start)
);
create table blocked_days (adviser_id uuid references profiles on delete cascade, day date, primary key (adviser_id, day));
create table bookings (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references profiles on delete cascade,
  slot_id uuid not null references availability_slots,
  topic text not null, note text check (char_length(note) <= 1000),
  status booking_state not null default 'requested',
  shared_items text[] not null default '{}'
    check (shared_items <@ array['target_matches','gap_progress','study_plan','interview_feedback']::text[]),
  request_id uuid not null unique,
  created_at timestamptz not null default now()
);
create table booking_status_history (
  id bigint generated always as identity primary key,
  booking_id uuid not null references bookings on delete cascade,
  status booking_state not null, changed_by uuid references profiles on delete set null,
  changed_at timestamptz not null default now()
);

-- D7 Adviser feedback
create table adviser_feedback (
  booking_id uuid primary key references bookings on delete cascade,
  feedback_text text not null check (char_length(feedback_text) between 1 and 2000),
  sent_at timestamptz not null default now()
);

-- D8 Audit log (append-only; no foreign keys so rows outlive a deleted account for 12 months)
create table audit_log (
  id bigint generated always as identity primary key,
  accessor_id uuid not null, subject_id uuid not null, booking_id uuid,
  action text not null, accessed_at timestamptz not null default now()
);

-- Indexes (System Design 3.3)
create index on ref.occupation_skills (uri);
create index skills_label_trgm on ref.skills using gin (label_en gin_trgm_ops);
create index on review_cards (user_id, card_due_at);
create index on mastery_checks (user_id, skill_uri, taken_at desc);
create index on interview_answers (user_id, created_at desc);
create index on availability_slots (adviser_id, slot_start) where is_open;
create index on bookings (student_id, created_at desc);
create unique index one_active_booking_per_slot on bookings (slot_id) where status in ('requested','accepted','change_requested');
create index on profiles (target_occupation);
create index on profiles (last_login_at);
create index on audit_log (subject_id, accessed_at desc);
create index on consents (user_id, kind, consented_at desc);
create index on projects (user_id);
create index on profile_sessions (user_id, created_at desc);
create index on staff_undertakings (adviser_id);
