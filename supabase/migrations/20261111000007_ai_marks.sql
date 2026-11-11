-- Security fix and AI bookkeeping (sprint 1 follow-up).
--
-- 1. Interview marks were forgeable: record_interview_answer took p_marks from the caller and any student could
--    call it through the API with full marks, which advisers then saw in open_request. add_ai_feedback had the
--    same shape of problem: a student could store any text as "AI-generated" feedback. Both now take the
--    student's id and are executable only by service_role, so only the server (server/data/interview.ts with
--    adminDb, after the checklist engine has marked the answer) can write them. The SQL still checks the student,
--    the question, the marks range and, for AI feedback, age and consent.
-- 2. review_cards.origin keeps the "AI-generated" label on cards made by AI from a student's notes.
-- 3. ai_calls logs every AI call, failed or not, so the daily budget counts attempts.

-- ---------------------------------------------------------------------------------------------------------
-- 1. Interview writes: service role only
-- ---------------------------------------------------------------------------------------------------------
drop function public.record_interview_answer(uuid, text, boolean, jsonb);
drop function public.add_ai_feedback(uuid, text);

-- The student behind a service-role write must exist, be a student and be unlocked. Internal.
create function public.require_student_id(p_user uuid) returns void
language plpgsql stable security definer set search_path = '' as $$
declare p public.profiles;
begin
  select * into p from public.profiles where user_id = p_user;
  if not found or p.role <> 'student' then raise exception 'forbidden' using errcode = '42501'; end if;
  if p.account_locked then raise exception 'account_locked' using errcode = '42501'; end if;
end $$;

create function public.record_interview_answer(p_user uuid, p_question uuid, p_answer text, p_skipped boolean, p_marks jsonb)
returns uuid
language plpgsql security definer set search_path = '' as $$
declare v_id uuid;
begin
  perform public.require_student_id(p_user);
  if not exists (select 1 from ref.interview_questions where id = p_question) then
    raise exception 'not_found' using errcode = 'P0002';
  end if;
  if p_skipped then
    insert into public.interview_answers (user_id, question_id, answer_text, skipped, marks)
    values (p_user, p_question, null, true, '{"structure":0,"accuracy":0,"evidence":0}')
    returning id into v_id;
  else
    if coalesce(btrim(p_answer), '') = '' then raise exception 'answer_required' using errcode = '22023'; end if;
    -- Marks are range-checked by the interview_marks_valid constraint (000003).
    insert into public.interview_answers (user_id, question_id, answer_text, skipped, marks)
    values (p_user, p_question, p_answer, false, p_marks)
    returning id into v_id;
  end if;
  return v_id;
end $$;

create function public.add_ai_feedback(p_user uuid, p_answer uuid, p_feedback text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform public.require_student_id(p_user);
  if (select is_under_18 from public.profiles where user_id = p_user) or not public.latest_consent(p_user, 'ai_processing') then
    raise exception 'ai_not_allowed' using errcode = '42501';
  end if;
  if coalesce(btrim(p_feedback), '') = '' or char_length(p_feedback) > 4000 then
    raise exception 'invalid_input' using errcode = '22023';
  end if;
  update public.interview_answers set ai_used = true, ai_feedback = p_feedback
   where id = p_answer and user_id = p_user and not skipped;
  if not found then raise exception 'not_found' using errcode = 'P0002'; end if;
end $$;

-- require_student() (000004) was only used by the old record_interview_answer and add_ai_feedback.
drop function public.require_student();

revoke all on function public.require_student_id(uuid) from public, anon, authenticated;
revoke all on function public.record_interview_answer(uuid, uuid, text, boolean, jsonb),
  public.add_ai_feedback(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.record_interview_answer(uuid, uuid, text, boolean, jsonb),
  public.add_ai_feedback(uuid, uuid, text) to service_role;

-- ---------------------------------------------------------------------------------------------------------
-- 2. Where a review card came from: lesson (after a passed check), notes (headings method), notes_ai (AI)
-- ---------------------------------------------------------------------------------------------------------
alter table public.review_cards
  add column origin text not null default 'lesson' check (origin in ('lesson', 'notes', 'notes_ai'));

-- AI is off for under-18 accounts (System Design 5.4), so they cannot hold AI-made cards.
create function public.guard_ai_card() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.origin = 'notes_ai' and (tg_op = 'INSERT' or old.origin is distinct from 'notes_ai')
     and coalesce((select is_under_18 from public.profiles where user_id = new.user_id), true) then
    raise exception 'ai_not_allowed' using errcode = '42501';
  end if;
  return new;
end $$;
create trigger review_cards_ai_guard before insert or update of origin on public.review_cards
  for each row execute function public.guard_ai_card();

-- ---------------------------------------------------------------------------------------------------------
-- 3. AI call log for the daily budget (one row per provider call, successful or not)
-- ---------------------------------------------------------------------------------------------------------
create table public.ai_calls (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles on delete cascade,
  kind text not null check (kind in ('interview_feedback', 'notes_cards')),
  ok boolean not null,
  created_at timestamptz not null default clock_timestamp()
);
create index on public.ai_calls (user_id, created_at desc);

alter table public.ai_calls enable row level security;
revoke all on public.ai_calls from anon;
revoke insert, update, delete, truncate, references, trigger on public.ai_calls from authenticated;
grant select on public.ai_calls to authenticated;
grant all on public.ai_calls to service_role;
create policy own_ai_calls_read on public.ai_calls for select to authenticated
  using (user_id = (select auth.uid()));
