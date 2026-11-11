-- Reference data additions for the import (scripts/import-reference.ts), A1 and A8. Written by the full-stack
-- engineer in sprint 1 (scripts/sql/ref-additions.sql), reviewed by the DBA:
--   * the answer-key revoke repeats 000003 and adds the new position column to the readable list;
--   * import_reference: search_path gains pg_temp; full-table deletes say "where true", because Supabase
--     runs PostgREST sessions with pg_safeupdate, which rejects DELETE without WHERE;
--   * suggest_skills: search_path gains pg_temp.

-- 1. Reference tables and columns -------------------------------------------------------------

-- Skill keys (careerprep:skill/<key>) stay the primary key; the ESCO URI sits beside it, so filling
-- or correcting an ESCO URI later never breaks skill_progress, lessons or review cards.
alter table ref.skills
  add column esco_label text,
  add column esco_uri text,
  add column esco_uri_status text not null default 'unverified' check (esco_uri_status in ('verified','unverified')),
  add column source_version text;
create index skills_alt_labels on ref.skills using gin (alt_labels);

alter table ref.occupations
  add column source_url text,
  add column verified boolean not null default false;

create table ref.interest_areas (
  label_en text primary key, label_ms text, source_version text not null
);
create table ref.modules (
  id text primary key, title text not null, programme text not null, source_version text not null
);
create table ref.module_skills (
  module_id text references ref.modules on delete cascade,
  uri text references ref.skills on delete cascade,
  primary key (module_id, uri)
);
create table ref.spm_subject_skills (
  subject text not null,
  uri text references ref.skills on delete cascade,
  min_grade text not null default 'C',
  primary key (subject, uri)
);

alter table ref.study_options
  add column verified boolean not null default false,
  add column source_version text;
alter table ref.lessons
  add column title text,
  add column source_version text;
alter table ref.check_questions
  add column position int check (position between 1 and 5),
  add column source_version text;

grant select on ref.interest_areas, ref.modules, ref.module_skills, ref.spm_subject_skills to authenticated;

-- 2. The answer key never reaches the browser ---------------------------------------------------
-- 20261111000002 granted SELECT on every ref table, which let any signed-in user read answer_key from the
-- API; 000003 closed that. Repeated here with the new position column. The server marks checks from the
-- bundled content files (content/lessons), never from this column.
revoke select on ref.check_questions from authenticated;
grant select (id, lesson_id, prompt, options, position) on ref.check_questions to authenticated;

-- 3. A8 free-text skill mapping (pg_trgm) --------------------------------------------------------
-- Matches typed text against preferred and alternative labels; returns suggestions at similarity
-- 0.4 or more for the student to confirm. Nothing is mapped without that confirmation.
create or replace function public.suggest_skills(p_text text, p_limit int default 3)
returns table (uri text, label text, score real)
language sql stable security invoker
set search_path = public, ref, extensions, pg_temp
as $$
  with q as (select lower(trim(p_text)) as t)
  select s.uri, s.label_en, m.score
  from ref.skills s, q
  cross join lateral (
    select greatest(
      similarity(lower(s.label_en), q.t),
      coalesce((select max(similarity(lower(a), q.t)) from unnest(s.alt_labels) a), 0)
    )::real as score
  ) m
  where char_length(q.t) between 2 and 80 and m.score >= 0.4
  order by m.score desc, s.label_en
  limit least(greatest(coalesce(p_limit, 3), 1), 5)
$$;
revoke all on function public.suggest_skills(text, int) from public, anon;
grant execute on function public.suggest_skills(text, int) to authenticated;

-- 4. Reference import in one transaction (System Design 3.4) ------------------------------------
-- Called only by scripts/import-reference.ts with the service-role key. Upserts every row with the
-- new source_version, then removes rows the new version no longer has. If a removed row is still
-- used by a student (a target job, skill progress, a saved option), the foreign key stops the whole
-- import and nothing changes.
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
    'check_questions', (select count(*) from ref.check_questions)
  );
end $$;
revoke all on function public.import_reference(jsonb) from public, anon, authenticated;
grant execute on function public.import_reference(jsonb) to service_role;
