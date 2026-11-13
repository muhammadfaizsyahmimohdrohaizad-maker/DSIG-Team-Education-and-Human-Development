-- Signup provisions the first consent rows with the server-only client.
grant insert (user_id, kind, given, notice_version, given_by)
  on public.consents to service_role;

-- own_answers_read limits these progress summaries to the signed-in student's rows.
grant select (user_id, id, question_id, created_at, total, skipped, ai_feedback)
  on public.interview_answers to authenticated;
grant select (id, round, prompt) on ref.interview_questions to authenticated;
