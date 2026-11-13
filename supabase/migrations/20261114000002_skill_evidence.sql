alter table public.skill_progress add column evidence_note text
  check (char_length(trim(evidence_note)) between 10 and 1000);
