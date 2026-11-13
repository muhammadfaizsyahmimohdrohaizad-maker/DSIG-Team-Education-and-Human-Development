-- Dashboard, Plan and CV read prior results under the own_checks_read RLS policy.
grant select (user_id, skill_uri, score, retake_after_lesson, taken_at)
  on public.mastery_checks to authenticated;
