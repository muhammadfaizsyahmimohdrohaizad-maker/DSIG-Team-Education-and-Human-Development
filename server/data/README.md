# server/data

Typed queries, one file per table group (D1 to D8 in the data dictionary). Both clients are typed with
`Database` from `lib/database.types.ts`. Regenerate it after every migration. Until the Supabase CLI works
here, use the local runner: `supabase/tests/local/run.sh --keep` prints a socket dir and port, then
`pnpm -s db:types <socket dir> <port> > lib/database.types.ts`.

| File | Tables (data dictionary) | Owner |
|---|---|---|
| `supabase.ts` | `db()`, `adminDb()`, `currentUser()` | db |
| `consents.ts` | D2 consents (latest choice) | db |
| `account.ts` | D1 profiles at sign-up, D2 consents, parent approvals, export, deletion, cron reads | backend |
| `bookings.ts` | D6 bookings through `open_slots`, `my_bookings`, `claim_slot`, `move_booking`, `cancel_booking` | backend |
| `adviser.ts` | D6 adviser side, D7 feedback, `open_request`, `adviser_requests`, `cohort_rows` | backend |
| `profiles.ts` | D1 profile, projects, dated profile sessions | fullstack |
| `learning.ts` | D4 skill and lesson progress, mastery checks (service role insert), review cards, saved study options | fullstack |
| `reference.ts` | D3 `ref` schema reads, explicit columns only | fullstack |
| `interview.ts` | D5 interview answers and AI feedback (service role, `record_interview_answer`, `add_ai_feedback`), `ai_calls` | ai |

## Which client

- `db()` for everything a user does. It carries the user's JWT, so RLS and the grants decide what comes back.
- `adminDb()` (service role, bypasses RLS) only for the jobs below, each scoped to one user id or one token hash
  that the server itself derived, never an id taken from the request:
  - sign-up: insert the profile and first consent rows; set `app_metadata.role` with the Auth admin API;
  - the parent decision: read and claim the `parent_approvals` row by token hash, insert the parent consent,
    unlock the account; saving a new approval request;
  - `last_login_at` on log-in; email lookup for status emails;
  - inserting a marked mastery check (students can read `mastery_checks` but not write it);
  - saving an interview answer with its checklist marks and storing AI feedback: `record_interview_answer(p_user, ...)`
    and `add_ai_feedback(p_user, ...)` are executable only by the service role, so a student cannot send their own
    marks; the SQL still checks the student, the question, the marks range, age and AI consent;
  - logging every AI provider call in `ai_calls` (`kind` `interview_feedback` or `notes_cards`, `ok` true or false).
    The daily budget counts these rows with the user's client (students can read their own log);
  - the reference import (`import_reference`), the data export, account deletion and the cron jobs
    (`complete_past_bookings`, `purge_audit_log`, reminders, 12-month inactivity deletion).

## Rules the database enforces

- Role: `app_metadata.role` in the JWT (`app_role()`); `profiles.role` must match it (sign-up writes both).
- A student cannot set `skill_progress.state = 'mastered'` without a passing `mastery_checks` row
  (trigger `guard_mastered`). Advisers never read `skill_progress` directly: `open_request` and
  `adviser_students` derive each state from checks and lessons (`student_skill_states`).
- `ref.check_questions.answer_key` is not readable through the API: select the columns you need,
  never `*` (`select *` fails with a permission error).
- `consented_at` and `lesson_progress.done_at` are set by the database clock for API writes.
- Advisers see student data only through RPCs that check the current staff undertaking:
  `adviser_requests` (who, when, topic, ticked item names), `open_request` (the ticked items; writes an audit
  row), `adviser_students` (target and progress only with the student's latest `adviser_visibility` yes; audited),
  `cohort_rows(p_programme)` (groups under 5 removed).
- Bookings change only through `claim_slot`, `move_booking`, `cancel_booking`, `respond_booking`,
  `send_feedback` (row locks, state rules of analysis 4.11). Students list times with `open_slots` and their
  bookings with `my_bookings`.

## Error mapping

| SQLSTATE / message | Result code |
|---|---|
| `42501` (`not_allowed`, `forbidden`, `undertaking_required`, `withdrawn`, `ai_not_allowed`, `account_locked`, permission denied, RLS violation) | `FORBIDDEN` |
| `P0002` (`not_found`) | `NOT_FOUND` |
| `P0001` `slot_taken`, `slot_closed`, `bad_status`, `too_late`, `not_completed`; `23505` | `CONFLICT` |
| `22023` (`answer_required`, `invalid_input`), `23514` (check constraint) | `VALIDATION` |

`review_cards.origin` is `lesson` (after a passed check, the default), `notes` (headings method) or `notes_ai`
(AI-made, shown labelled AI-generated; refused for under-18 accounts).

Return plain objects in the shapes in `lib/types.ts`; never pass raw Supabase errors to the browser.
