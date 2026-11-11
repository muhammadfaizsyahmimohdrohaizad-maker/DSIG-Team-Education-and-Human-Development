-- Sprint 2: production data path and production bookkeeping.
--  1. import_reference also loads interview sets (ids md5('iq:' || key)::uuid; why and source inside rubric).
--  2. delete_declined_student: a parent's "decline" removes the under-18 student's data (owner decision).
--  3. email_outbox: status emails that failed, for the cron to retry.
--  4. rate_limits + hit_rate_limit: fixed-window counters for sign-up, log-in, reset, booking and AI actions.
--  5. profiles.reminder_emails: the "Reminder emails" switch (day-before reminder only).
--  6. touch_activity: last_login_at kept current on session refresh, written at most once per Malaysian day.

-- ---------------------------------------------------------------------------------------------------------
-- 1. Interview sets in the reference import
-- ---------------------------------------------------------------------------------------------------------
alter table ref.interview_questions add column source_version text;

create or replace function public.import_reference(p jsonb) returns jsonb
language plpgsql security definer set search_path = public, ref, pg_temp as $$
declare v text := p->>'source_version';
begin
  if v is null or v = '' then raise exception 'source_version is required'; end if;

  insert into ref.interest_areas (label_en, label_ms, source_version)
  select x.label_en, x.label_ms, v from jsonb_to_recordset(p->'interest_areas') as x(label_en text, label_ms text)
  on conflict (label_en) do update set label_ms = excluded.label_ms, source_version = v;

  insert into ref.skills (uri, label_en, label_ms, alt_labels, esco_label, esco_uri, esco_uri_status, source_version)
  select x.uri, x.label_en, x.label_ms, coalesce(x.alt_labels, '{}'), x.esco_label, x.esco_uri, x.esco_uri_status, v
  from jsonb_to_recordset(p->'skills')
    as x(uri text, label_en text, label_ms text, alt_labels text[], esco_label text, esco_uri text, esco_uri_status text)
  on conflict (uri) do update set label_en = excluded.label_en, label_ms = excluded.label_ms, alt_labels = excluded.alt_labels,
    esco_label = excluded.esco_label, esco_uri = excluded.esco_uri, esco_uri_status = excluded.esco_uri_status, source_version = v;

  insert into ref.occupations (code, title_en, title_ms, tasks, interest_areas, source_url, verified, source_version)
  select x.code, x.title_en, x.title_ms, x.tasks, coalesce(x.interest_areas, '{}'), x.source_url, x.verified, v
  from jsonb_to_recordset(p->'occupations')
    as x(code text, title_en text, title_ms text, tasks text[], interest_areas text[], source_url text, verified boolean)
  on conflict (code) do update set title_en = excluded.title_en, title_ms = excluded.title_ms, tasks = excluded.tasks,
    interest_areas = excluded.interest_areas, source_url = excluded.source_url, verified = excluded.verified, source_version = v;

  delete from ref.occupation_skills where true;
  insert into ref.occupation_skills (code, uri, essential)
  select x.code, x.uri, x.essential from jsonb_to_recordset(p->'occupation_skills') as x(code text, uri text, essential boolean);

  insert into ref.modules (id, title, programme, source_version)
  select x.id, x.title, x.programme, v from jsonb_to_recordset(p->'modules') as x(id text, title text, programme text)
  on conflict (id) do update set title = excluded.title, programme = excluded.programme, source_version = v;

  delete from ref.module_skills where true;
  insert into ref.module_skills (module_id, uri)
  select x.module_id, x.uri from jsonb_to_recordset(p->'module_skills') as x(module_id text, uri text);

  delete from ref.spm_subject_skills where true;
  insert into ref.spm_subject_skills (subject, uri, min_grade)
  select x.subject, x.uri, x.min_grade from jsonb_to_recordset(p->'spm_subject_skills') as x(subject text, uri text, min_grade text);

  insert into ref.study_options (id, code, level, kind, institution, programme, duration, award, source_url, verified, source_version)
  select x.id, x.code, x.level::edu_level, x.kind, x.institution, x.programme, x.duration, x.award, x.source_url, x.verified, v
  from jsonb_to_recordset(p->'study_options')
    as x(id uuid, code text, level text, kind text, institution text, programme text, duration text, award text, source_url text, verified boolean)
  on conflict (id) do update set code = excluded.code, level = excluded.level, kind = excluded.kind, institution = excluded.institution,
    programme = excluded.programme, duration = excluded.duration, award = excluded.award, source_url = excluded.source_url,
    verified = excluded.verified, source_version = v;

  insert into ref.lessons (id, skill_uri, lesson_no, title, content_path, source_version)
  select x.id, x.skill_uri, x.lesson_no, x.title, x.content_path, v
  from jsonb_to_recordset(p->'lessons') as x(id uuid, skill_uri text, lesson_no int, title text, content_path text)
  on conflict (id) do update set skill_uri = excluded.skill_uri, lesson_no = excluded.lesson_no, title = excluded.title,
    content_path = excluded.content_path, source_version = v;

  insert into ref.check_questions (id, lesson_id, position, prompt, options, answer_key, source_version)
  select x.id, x.lesson_id, x.position, x.prompt, x.options, x.answer_key, v
  from jsonb_to_recordset(p->'check_questions')
    as x(id uuid, lesson_id uuid, position int, prompt text, options jsonb, answer_key text)
  on conflict (id) do update set lesson_id = excluded.lesson_id, position = excluded.position, prompt = excluded.prompt,
    options = excluded.options, answer_key = excluded.answer_key, source_version = v;

  -- Interview sets (content/interview via content/interview/sets.ts importRow). Only when the payload has them,
  -- so an older payload leaves the questions alone. The id comes from the content key, so answers stay linked
  -- when a question's text or rubric changes.
  if p ? 'interview_questions' then
    -- A slot (code, round, position) whose key changed would collide with the unique index: free it first,
    -- unless students have answered it (then the foreign key stops the import, as for every other table).
    delete from ref.interview_questions q
     where q.id not in (select md5('iq:' || x.key)::uuid from jsonb_to_recordset(p->'interview_questions') as x(key text))
       and not exists (select 1 from public.interview_answers a where a.question_id = q.id);
    insert into ref.interview_questions (id, code, round, position, prompt, rubric, source_version)
    select md5('iq:' || x.key)::uuid, x.code, x.round::interview_round, x.position, x.prompt, x.rubric, v
    from jsonb_to_recordset(p->'interview_questions')
      as x(key text, code text, round text, position int, prompt text, rubric jsonb)
    on conflict (id) do update set code = excluded.code, round = excluded.round, position = excluded.position,
      prompt = excluded.prompt, rubric = excluded.rubric, source_version = v;
    delete from ref.interview_questions where source_version is distinct from v;
  end if;

  -- Remove what the new version dropped (children first).
  delete from ref.check_questions where source_version is distinct from v;
  delete from ref.lessons where source_version is distinct from v;
  delete from ref.study_options where source_version is distinct from v;
  delete from ref.modules where source_version is distinct from v;
  delete from ref.occupations where source_version is distinct from v;
  delete from ref.skills where source_version is distinct from v;
  delete from ref.interest_areas where source_version is distinct from v;

  return jsonb_build_object(
    'source_version', v,
    'interest_areas', (select count(*) from ref.interest_areas),
    'skills', (select count(*) from ref.skills),
    'occupations', (select count(*) from ref.occupations),
    'occupation_skills', (select count(*) from ref.occupation_skills),
    'modules', (select count(*) from ref.modules),
    'module_skills', (select count(*) from ref.module_skills),
    'spm_subject_skills', (select count(*) from ref.spm_subject_skills),
    'study_options', (select count(*) from ref.study_options),
    'lessons', (select count(*) from ref.lessons),
    'check_questions', (select count(*) from ref.check_questions),
    'interview_questions', (select count(*) from ref.interview_questions)
  );
end $$;
revoke all on function public.import_reference(jsonb) from public, anon, authenticated;
grant execute on function public.import_reference(jsonb) to service_role;

-- ---------------------------------------------------------------------------------------------------------
-- 2. Parent declined: remove the student's data. The server then deletes the auth user with the Auth admin API.
--    Every table that points at a profile cascades (checked by the tests); parent_approvals goes with it.
--    Audit rows have no foreign key on purpose and stay for their 12 months (they hold ids only).
-- ---------------------------------------------------------------------------------------------------------
create function public.delete_declined_student(p_user uuid) returns boolean
language plpgsql security definer set search_path = '' as $$
begin
  -- Only an under-18 student whose parent said no, and who was never unlocked.
  if not exists (
    select 1 from public.profiles p join public.parent_approvals a on a.user_id = p.user_id
     where p.user_id = p_user and p.role = 'student' and p.is_under_18 and p.account_locked and a.decision = false
  ) then
    raise exception 'not_declined' using errcode = '42501';
  end if;
  delete from public.profiles where user_id = p_user;
  return true;
end $$;
revoke all on function public.delete_declined_student(uuid) from public, anon, authenticated;
grant execute on function public.delete_declined_student(uuid) to service_role;

-- ---------------------------------------------------------------------------------------------------------
-- 3. Email outbox (service role only). The payload holds what a status email may carry: status, time, link
--    (plus the booking id, length and adviser name the templates print). Never shared data or feedback text.
-- ---------------------------------------------------------------------------------------------------------
create table public.email_outbox (
  id bigint generated always as identity primary key,
  to_user uuid not null references public.profiles on delete cascade,
  kind text not null check (kind ~ '^[a-z_]{1,40}$'),
  payload jsonb not null default '{}' check (
    jsonb_typeof(payload) = 'object'
    and (payload - array['status','time','link','booking_id','minutes','adviser_name']) = '{}'::jsonb
  ),
  attempts int not null default 0 check (attempts >= 0),
  last_error text check (char_length(last_error) <= 300),
  next_attempt_at timestamptz not null default now(),
  sent_at timestamptz,
  created_at timestamptz not null default now()
);
create index email_outbox_due on public.email_outbox (next_attempt_at) where sent_at is null;
create index on public.email_outbox (to_user);
alter table public.email_outbox enable row level security;
revoke all on public.email_outbox from anon, authenticated;
grant all on public.email_outbox to service_role;

-- The cron claims due emails: attempts goes up and the next try moves out (5, 30 min, 2 h, 12 h) before it
-- sends, so two runs never send the same email. After 5 attempts an email is left for a person to look at.
-- Mark success with: update email_outbox set sent_at = now(), last_error = null where id = ...
create function public.claim_due_emails(p_limit int default 50)
returns setof public.email_outbox
language sql security definer set search_path = '' as $$
  with due as (
    select id from public.email_outbox
     where sent_at is null and attempts < 5 and next_attempt_at <= now()
     order by next_attempt_at
     limit least(greatest(coalesce(p_limit, 50), 1), 200)
     for update skip locked
  )
  update public.email_outbox o
     set attempts = o.attempts + 1,
         next_attempt_at = now() + (array[interval '5 minutes', interval '30 minutes', interval '2 hours', interval '12 hours', interval '1 day'])[least(o.attempts + 1, 5)]
    from due where o.id = due.id
  returning o.*
$$;
revoke all on function public.claim_due_emails(int) from public, anon, authenticated;
grant execute on function public.claim_due_emails(int) to service_role;

-- ---------------------------------------------------------------------------------------------------------
-- 4. Rate limits. hit_rate_limit counts one hit for p_key in the current fixed window and returns TRUE when the
--    caller may go ahead (this hit is within p_limit), FALSE when the limit is used up. One statement, so two
--    hits at once can never both take the last place. Keys should not hold raw emails or IPs: hash them first.
-- ---------------------------------------------------------------------------------------------------------
create table public.rate_limits (
  key text not null check (char_length(key) between 1 and 200),
  window_start timestamptz not null,
  expires_at timestamptz not null,
  hits int not null default 1,
  primary key (key, window_start)
);
create index on public.rate_limits (expires_at);
alter table public.rate_limits enable row level security;
revoke all on public.rate_limits from anon, authenticated;
grant all on public.rate_limits to service_role;

create function public.hit_rate_limit(p_key text, p_limit int, p_window interval) returns boolean
language plpgsql security definer set search_path = '' as $$
declare
  secs double precision := extract(epoch from p_window);
  w timestamptz;
  n int;
begin
  if p_limit is null or p_limit < 1 or secs is null or secs < 1 then
    raise exception 'invalid_input' using errcode = '22023';
  end if;
  w := to_timestamp(floor(extract(epoch from now()) / secs) * secs);
  insert into public.rate_limits as r (key, window_start, expires_at, hits)
  values (p_key, w, w + p_window, 1)
  on conflict (key, window_start) do update set hits = r.hits + 1
  returning hits into n;
  -- Prune finished windows now and then (about 1 call in 50), so the table stays small without a cron.
  if random() < 0.02 then
    delete from public.rate_limits where expires_at < now() - interval '1 hour';
  end if;
  return n <= p_limit;
end $$;
revoke all on function public.hit_rate_limit(text, int, interval) from public, anon, authenticated;
grant execute on function public.hit_rate_limit(text, int, interval) to service_role;

-- ---------------------------------------------------------------------------------------------------------
-- 5. "Reminder emails" (Settings): controls only the day-before reminder; status emails are always sent.
-- ---------------------------------------------------------------------------------------------------------
alter table public.profiles add column reminder_emails boolean not null default true;
grant update (reminder_emails) on public.profiles to authenticated;

-- ---------------------------------------------------------------------------------------------------------
-- 6. Activity. The middleware calls this on session refresh; it writes only when last_login_at is from an
--    earlier Malaysian day, so most calls change nothing. Returns true when it wrote.
-- ---------------------------------------------------------------------------------------------------------
create function public.touch_activity() returns boolean
language sql security definer set search_path = '' as $$
  with t as (
    update public.profiles set last_login_at = now()
     where user_id = auth.uid()
       and last_login_at < (date_trunc('day', now() at time zone 'Asia/Kuala_Lumpur') at time zone 'Asia/Kuala_Lumpur')
    returning 1
  )
  select exists (select 1 from t)
$$;
revoke all on function public.touch_activity() from public, anon;
grant execute on function public.touch_activity() to authenticated;
