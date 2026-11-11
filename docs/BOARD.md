# Sprint board: UTP CodeFest final

Owner of this file: devops / PM. Each role updates its own rows when it merges. Status is one of
`todo`, `in progress`, `done`. "Done" means the action and its screen are merged to main and pass the local
checks (unit tests, SQL tests). "In progress" with "screen to build" means the server action is merged and the
page is still a placeholder.

Last update: Sprint 1 merge, 11 Nov 2026 (devops, db, backend, fullstack, frontend merged; ai not yet).
**Merged main has not had a Vercel build yet** (see OPS-1): until it does, treat every "done" as unverified on Vercel.

★ = on the demo critical path. If a ★ row slips, the demo breaks; everything else can be cut.

## Demo path (from the mockup canvas note)

Persona: Aina Rahman, Diploma in Software Engineering, semester 5, target job AI engineer, over 18.

| # | Step | Route | Mockup board | FRs | Owner |
|---|---|---|---|---|---|
| 1 | Homepage | `/` | Homepage (Main) | none | frontend |
| 2 | Sign up | `/sign-up` | Log in / Sign up | FR-AUTH-01, FR-CON-01 | backend (action), frontend (page) |
| 3 | First visit | `/dashboard` (empty state) | Dashboard, first visit | none | frontend |
| 4 | Tell us about yourself | `/about-you` | Tell us about yourself | FR-PRO-01, FR-PRO-02 | fullstack |
| 5 | Map | `/map` | Map | FR-MAT-01, FR-MAT-02, FR-MAT-03 | fullstack |
| 6 | Set target | `/map` (Set as target) | Map | FR-MAT-04 | fullstack |
| 7 | Skill gap | `/skill-gap` | Skill gap | FR-GAP-01 | fullstack |
| 8 | Lesson | `/plan/learn/[skill]/[lesson]` | Learning page | FR-LRN-01 | fullstack |
| 9 | Check | `/plan/check/[skill]` | Check result | FR-LRN-02 | fullstack |
| 10 | Result | `/plan/check/[skill]` (result) | Check result | FR-LRN-02, FR-LRN-03 | fullstack |
| 11 | Mock interview | `/plan/interview` | Mock interview | FR-INT-01, FR-INT-03, FR-INT-04 | ai |
| 12 | Book | `/book` | Book | FR-BKG-01, FR-BKG-02 | backend (action), frontend (page) |

Every step needs the student layout and header (frontend), middleware session refresh (backend),
the schema and RLS (db) and seeded reference data for the AI engineer path (db + fullstack).

## Critical path, in build order

1. ★ (todo, Faiz) Supabase project live with migrations pushed (db, Faiz) and env vars set in Vercel (Faiz; see `docs/DEPLOY.md`).
2. ★ (done) Reference data subset: MASCO occupations around AI engineer, their ESCO skills, interest areas (fullstack `content/reference`, db import + seed).
3. ★ (done) Sign-up with the four consents, role set server-side (backend + frontend).
4. ★ (done) About-you form saving a profile session (fullstack).
5. ★ (half: ranking on /about-you done, /map to build) Live match ranking on the map with reasons, then Set as target (fullstack).
6. ★ (action done, screen to build) Skill gap rows for the target (fullstack).
7. ★ (content and actions done, screens to build) Lessons and a 5-question check for at least one AI engineer gap skill (fullstack content + pages).
8. ★ (todo, ai) Mock interview with checklist marks; AI feedback optional and labelled (ai).
9. ★ (actions done, screen to build) Book: request a session, tick what to share (backend + frontend).
10. ★ (done) Demo seed: Aina's account and profile so the demo can also start mid-flow (db).
11. ★ (blocked on OPS-2) Green Vercel preview of merged main before the final (devops).

## Feature rows

### Accounts and consent

| ID | Feature | Owner | Status | Notes |
|---|---|---|---|---|
| ★ FR-AUTH-01 | Sign up as student or adviser (name, email, password) | backend + frontend | done | sign-up page + `signUp`; role set with the service role |
| FR-AUTH-02 | Staff code required for adviser accounts | backend | done | `staffCodeMatches` (SHA-256 of the trimmed, upper-cased code) |
| ★ FR-AUTH-03 | Log in, password reset by email | backend + frontend | done | log-in page with reset link; `POST /auth/sign-out` |
| ★ FR-CON-01 | Four consents at sign-up, recorded with date and notice version | backend + frontend + db | done | four boxes on sign-up; storeUse required for students only |
| FR-CON-02 | Under-18 lock until a parent approves by email | backend + frontend | done | parent email, `/parent-consent/[token]` page, `recordParentDecision` |
| FR-CON-03 | Change optional consents; append-only history | backend + frontend | in progress | `updateConsent`, `listMyConsents` built; settings screen to build |
| FR-CON-04 | Adviser accepts staff undertaking before seeing student data | backend + frontend + db | in progress | `acceptUndertaking` + RLS built; `/staff/undertaking` screen to build |

### Profile and matches

| ID | Feature | Owner | Status | Notes |
|---|---|---|---|---|
| ★ FR-PRO-01 | Education level, then SPM grades or programme and passed modules | fullstack | done | `/about-you` end to end |
| ★ FR-PRO-02 | Skills, projects, interests (interests required) | fullstack | done | `/about-you`; skill suggestions via `suggest_skills` (A8) |
| FR-PRO-03 | Each update kept as a dated session | fullstack | in progress | `saveSession` writes a dated `profile_sessions` row; no screen to revisit sessions yet |
| ★ FR-MAT-01 | Rank MASCO occupations by shown skills, no model | fullstack | done | engine A1 + live `rankMatches` on `/about-you` |
| ★ FR-MAT-02 | Fit label, reasons, MASCO tasks and ESCO skills per match | fullstack | in progress | reasons shown on `/about-you`; `/map` screen to build |
| ★ FR-MAT-03 | Career map with study routes and first jobs | fullstack | in progress | study options in ref data; `/map` screen to build |
| ★ FR-MAT-04 | Set one target job | fullstack | in progress | `setTarget` built; button on `/map` to build |

### Skill gap, plan and learning

| ID | Feature | Owner | Status | Notes |
|---|---|---|---|---|
| ★ FR-GAP-01 | Target skills as have / learning / missing / check needed, with evidence | fullstack | in progress | `getSkillGap` built; `/skill-gap` screen to build |
| FR-GAP-02 | Claim a skill; stays "check needed" until its check passes | fullstack | in progress | `claimSkill` built; screen to build |
| FR-PLAN-01 | Study options by level and type; save them | fullstack | in progress | `saveStudyOption`, `removeStudyOption` built; screen to build |
| ★ FR-LRN-01 | Four short lessons per missing skill | fullstack | in progress | 5 AI engineer skills × 4 lessons in `content/lessons`; `getLesson`, `completeLesson` built; lesson screen to build |
| ★ FR-LRN-02 | 5-question check, no AI, 4 of 5 passes | fullstack | in progress | `getCheck`, `submitCheck` (marked on the server, no AI) built; check screen to build |
| ★ FR-LRN-03 | Retake only after redoing the lesson behind most misses | fullstack | in progress | retake gate built (`lesson-gate` tests); result screen to build |
| FR-LRN-04 | Spaced review cards, cards due today | ai | in progress | review cards created on a pass (fullstack); `features/review` actions still `notBuilt` (ai) |
| FR-LRN-05 | Notes file to review cards, AI only with consent | ai | todo | Could |
| FR-LRN-06 | Export lesson notes as PDF or Markdown | fullstack | in progress | `exportNotes` returns Markdown; PDF and screen to build |

### Interview and CV

| ID | Feature | Owner | Status | Notes |
|---|---|---|---|---|
| ★ FR-INT-01 | 3-question mock interview, technical or behavioural | ai | todo | `features/interview` still `notBuilt`; ai branch not merged yet |
| FR-INT-02 | Typed or dictated answers | ai | todo | dictation is Should |
| ★ FR-INT-03 | Marks on structure, accuracy, evidence; AI feedback labelled | ai | in progress | engine A5 checklist `server/engines/feedback.ts` |
| ★ FR-INT-04 | Checklist marking when AI is off or fails | ai | in progress | `LLM_PROVIDER=stub` path |
| FR-CV-01 | CV from mastered skills, modules, projects; PDF export | fullstack | in progress | `buildCv` built; PDF export and `/plan/cv` screen to build |

### Booking and advisers

| ID | Feature | Owner | Status | Notes |
|---|---|---|---|---|
| ★ FR-BKG-01 | Request a session by adviser, date, time, topic | backend + frontend | in progress | `getOpenSlots`, `requestBooking` (idempotent `claim_slot`) built; `/book` screen to build; demo adviser seeded |
| ★ FR-BKG-02 | Tick what to share, nothing by default | backend + frontend | in progress | share ticks validated and stored; `/book` screen to build |
| FR-BKG-03 | View, move, cancel, add to calendar | backend + frontend | in progress | `moveBooking` (accepted → change_requested), `cancelBooking` built; `/book/[id]` screen to build |
| FR-BKG-04 | Emails on accept, decline, due tomorrow | backend | done | status emails after commit; reminders cron; no shared data in emails |
| FR-ADV-01 | Open or close slots, block days | backend + frontend | in progress | `setAvailability` built; availability screen to build |
| FR-ADV-02 | Accept or decline; see only shared data | backend + frontend + db | in progress | `listRequests`, `respond`, `openRequest` (audited) built; requests screen to build |
| FR-ADV-03 | Post-session feedback on the student's Book page | backend + frontend | in progress | `sendFeedback` built; screens to build |
| FR-ADV-04 | Cohort totals, groups under 5 hidden | backend + db | in progress | `getCohort` returns `{metric,label,students}` by programme; cohort screen to build |

### Account data

| ID | Feature | Owner | Status | Notes |
|---|---|---|---|---|
| FR-ACC-01 | Download all data as JSON | backend | done | `GET /api/export` (RLS-scoped JSON); download button goes on settings |
| FR-ACC-02 | Delete account and linked records after named confirmation | backend | in progress | `deleteMyAccount` with named confirmation built; settings screen to build |

### Platform and non-functional

| ID | Item | Owner | Status | Notes |
|---|---|---|---|---|
| ★ OPS-1 | Vercel preview build of merged main | devops | in progress | scaffold main built READY; merged main (~450 KB of source) not yet deployed: needs Git deploy or REST access, see DEPLOY.md |
| ★ OPS-2 | GitHub connected to Vercel, env vars set | Faiz | todo | DEPLOY.md steps 1 to 3; unblocks OPS-1 |
| OPS-3 | `pnpm-lock.yaml` committed | first developer with registry access | todo | see "Lockfile" in DEPLOY.md |
| OPS-4 | CI green on GitHub Actions | devops | todo | runs once the repo is pushed |
| ★ DATA-1 | Reference data and import (`pnpm ref:import`, migration 000006) | fullstack + db | done | MVP slice around AI engineer |
| ★ DATA-2 | Demo seed (Aina, Pn. Nurul Huda, 14 students, bookings) | db | done | `supabase/seed.sql`; `seed_check.sql` 25/25 |
| NFR-01..14 | Performance, RLS, security headers, accessibility, retention | all | in progress | test IDs TC-NFR-01..14 in the analysis doc |
