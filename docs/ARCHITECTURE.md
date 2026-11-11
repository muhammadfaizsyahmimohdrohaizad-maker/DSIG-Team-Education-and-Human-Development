# Architecture

CareerPrep is a modular monolith: one Next.js 15 app on Vercel (functions in Singapore, `sin1`) with
Supabase (Postgres, Auth) in Singapore. Calls are synchronous HTTPS; there is no queue. Full detail,
diagrams and reasons are in the CareerPrep System Design document.

```
app/                        routes only: pages, layouts, route handlers
  (public)/                 /, /sign-in, /sign-up, /parent-consent/[token], /privacy, /terms
  (student)/                /dashboard, /about-you, /map, /skill-gap, /plan/*, /book/*, /settings
  adviser/                  /adviser/requests, /students, /cohort, /availability
  staff/undertaking/        adviser must accept before seeing any student data
  institution/              cohort totals and audit log
  api/export/               FR-ACC-01 JSON export
  api/cron/reminders/       daily booking reminder emails (Vercel Cron)
  api/cron/purge/           daily 12-month inactivity deletion (Vercel Cron)
  auth/callback/            Supabase email links
components/                 shared UI (header, nav, page shell)
features/<module>/          server actions (and later the module's UI) for one module
lib/                        types, Zod schemas, Result helpers: shared by client and server
server/
  engines/                  pure logic: matches (A1), skills (A2), lesson (A3), schedule (A4),
                            feedback (A5), cohort (A6). No I/O.
  data/                     Supabase clients and typed queries. db() = user's JWT, RLS applies.
  llm/adapter.ts            the only file that calls Gemini; stub for tests; off for under-18s
  email/send.ts             Resend, 3 tries (1 s, 2 s, 4 s), status-only content
  env.ts                    validated environment variables
supabase/migrations/        schema, RLS, privileged functions (open_request, cohort_rows, ...)
supabase/tests/             pgTAP checks for RLS
content/                    reference data sources for the ref schema
tests/unit/                 Vitest, engines
tests/e2e/                  Playwright + axe, 1440 and 390 px
```

## Request path

Browser → Vercel edge (TLS, firewall) → middleware (refresh session, role routing) → page or server
action → Zod → `server/engines` + `server/data` → Supabase (RLS) → `Result` back to the page.

## Where each requirement lives

| Area | Module | Engine | Tables |
|---|---|---|---|
| Sign-up, consent, parent approval | `features/auth`, `features/onboarding` | — | profiles, consents, parent_approvals |
| Tell us about yourself, matches | `features/matches` | `matches.ts` | profiles, projects, profile_sessions, ref.* |
| Skill gap, plan | `features/plan` | `skills.ts` | skill_progress, saved_study_options |
| Lessons, mastery check | `features/learning` | `lesson.ts` | lesson_progress, mastery_checks |
| Review cards | `features/review` | `schedule.ts` | review_cards |
| Mock interview | `features/interview` | `feedback.ts` + `llm/adapter.ts` | interview_answers |
| CV | `features/cv` | — | skill_progress, projects |
| Booking | `features/booking` | — | availability_slots, bookings, booking_status_history |
| Adviser | `features/adviser` | `cohort.ts` | staff_undertakings, adviser_feedback, audit_log (via `open_request`) |
| Account | `features/account`, `api/export`, `api/cron/purge` | — | all, via Auth admin API |
