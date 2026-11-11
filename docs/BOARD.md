# Sprint board: UTP CodeFest final

Owner of this file: devops / PM. Each role updates its own rows when it merges. Status is one of
`todo`, `in progress`, `done`. "Done" means merged to main and passing a Vercel preview build.

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

1. ★ Supabase project live with migrations pushed (db, Faiz) and env vars set in Vercel (Faiz; see `docs/DEPLOY.md`).
2. ★ Reference data subset: MASCO occupations around AI engineer, their ESCO skills, interest areas (fullstack `content/reference`, db import + seed).
3. ★ Sign-up with the four consents, role set server-side (backend + frontend).
4. ★ About-you form saving a profile session (fullstack).
5. ★ Live match ranking on the map with reasons, then Set as target (fullstack).
6. ★ Skill gap rows for the target (fullstack).
7. ★ Lessons and a 5-question check for at least one AI engineer gap skill (fullstack content + pages).
8. ★ Mock interview with checklist marks; AI feedback optional and labelled (ai).
9. ★ Book: request a session, tick what to share (backend + frontend).
10. ★ Demo seed: Aina's account and profile so the demo can also start mid-flow (db).
11. ★ Green Vercel preview of merged main before the final (devops).

## Feature rows

### Accounts and consent

| ID | Feature | Owner | Status | Notes |
|---|---|---|---|---|
| ★ FR-AUTH-01 | Sign up as student or adviser (name, email, password) | backend + frontend | todo | `features/auth/actions.ts` is a `notBuilt` stub; schema `signUpInput` exists |
| FR-AUTH-02 | Staff code required for adviser accounts | backend | todo | `STAFF_CODE_HASHES` env |
| ★ FR-AUTH-03 | Log in, password reset by email | backend + frontend | todo | needed to re-enter the demo account; `/auth/callback` route exists |
| ★ FR-CON-01 | Four consents at sign-up, recorded with date and notice version | backend + frontend + db | in progress | `consents` table and `server/data/consents.ts` exist |
| FR-CON-02 | Under-18 lock until a parent approves by email | backend + frontend | todo | not on the demo path (Aina is over 18) |
| FR-CON-03 | Change optional consents; append-only history | backend + frontend | todo | settings page |
| FR-CON-04 | Adviser accepts staff undertaking before seeing student data | backend + frontend + db | in progress | RPC `accept_staff_undertaking`, RLS `has_current_undertaking` exist |

### Profile and matches

| ID | Feature | Owner | Status | Notes |
|---|---|---|---|---|
| ★ FR-PRO-01 | Education level, then SPM grades or programme and passed modules | fullstack | todo | |
| ★ FR-PRO-02 | Skills, projects, interests (interests required) | fullstack | todo | |
| FR-PRO-03 | Each update kept as a dated session | fullstack | todo | |
| ★ FR-MAT-01 | Rank MASCO occupations by shown skills, no model | fullstack | in progress | engine A1 `server/engines/matches.ts` + unit test |
| ★ FR-MAT-02 | Fit label, reasons, MASCO tasks and ESCO skills per match | fullstack | in progress | reasons come from engine A1 |
| ★ FR-MAT-03 | Career map with study routes and first jobs | fullstack | todo | |
| ★ FR-MAT-04 | Set one target job | fullstack | todo | `setTarget` stub |

### Skill gap, plan and learning

| ID | Feature | Owner | Status | Notes |
|---|---|---|---|---|
| ★ FR-GAP-01 | Target skills as have / learning / missing / check needed, with evidence | fullstack | in progress | engine A2 `server/engines/skills.ts` |
| FR-GAP-02 | Claim a skill; stays "check needed" until its check passes | fullstack | in progress | engine A2 handles the state |
| FR-PLAN-01 | Study options by level and type; save them | fullstack | todo | |
| ★ FR-LRN-01 | Four short lessons per missing skill | fullstack | todo | content for AI engineer gap skills first |
| ★ FR-LRN-02 | 5-question check, no AI, 4 of 5 passes | fullstack | in progress | engine A3 `server/engines/lesson.ts` + unit test |
| ★ FR-LRN-03 | Retake only after redoing the lesson behind most misses | fullstack | in progress | engine A3 `canRetake` |
| FR-LRN-04 | Spaced review cards, cards due today | ai | in progress | engine A4 `server/engines/schedule.ts` (ts-fsrs) |
| FR-LRN-05 | Notes file to review cards, AI only with consent | ai | todo | Could |
| FR-LRN-06 | Export lesson notes as PDF or Markdown | fullstack | todo | Could |

### Interview and CV

| ID | Feature | Owner | Status | Notes |
|---|---|---|---|---|
| ★ FR-INT-01 | 3-question mock interview, technical or behavioural | ai | todo | questions in `content/interview/` still need round, position and rubric |
| FR-INT-02 | Typed or dictated answers | ai | todo | dictation is Should |
| ★ FR-INT-03 | Marks on structure, accuracy, evidence; AI feedback labelled | ai | in progress | engine A5 checklist `server/engines/feedback.ts` |
| ★ FR-INT-04 | Checklist marking when AI is off or fails | ai | in progress | `LLM_PROVIDER=stub` path |
| FR-CV-01 | CV from mastered skills, modules, projects; PDF export | fullstack | todo | |

### Booking and advisers

| ID | Feature | Owner | Status | Notes |
|---|---|---|---|---|
| ★ FR-BKG-01 | Request a session by adviser, date, time, topic | backend + frontend | todo | `bookingRequest` schema exists; needs a seeded adviser with open slots |
| ★ FR-BKG-02 | Tick what to share, nothing by default | backend + frontend | todo | |
| FR-BKG-03 | View, move, cancel, add to calendar | backend + frontend | todo | |
| FR-BKG-04 | Emails on accept, decline, due tomorrow | backend | todo | `server/email/send.ts` exists; reminders cron stub |
| FR-ADV-01 | Open or close slots, block days | backend + frontend | todo | |
| FR-ADV-02 | Accept or decline; see only shared data | backend + frontend + db | in progress | RPC `open_request` writes the audit row |
| FR-ADV-03 | Post-session feedback on the student's Book page | backend + frontend | todo | |
| FR-ADV-04 | Cohort totals, groups under 5 hidden | backend + db | in progress | engine A6 + `cohort_rows()` |

### Account data

| ID | Feature | Owner | Status | Notes |
|---|---|---|---|---|
| FR-ACC-01 | Download all data as JSON | backend | todo | `/api/export` returns 501 |
| FR-ACC-02 | Delete account and linked records after named confirmation | backend | todo | |

### Platform and non-functional

| ID | Item | Owner | Status | Notes |
|---|---|---|---|---|
| ★ OPS-1 | Vercel project `careerprep` builds from a file upload | devops | in progress | `scripts-ops/deploy-preview.mjs`; see DEPLOY.md |
| ★ OPS-2 | GitHub connected to Vercel, env vars set | Faiz | todo | DEPLOY.md steps 1 to 3 |
| OPS-3 | `pnpm-lock.yaml` committed | first developer with registry access | todo | see "Lockfile" in DEPLOY.md |
| OPS-4 | CI green on GitHub Actions | devops | todo | runs once the repo is pushed |
| NFR-01..14 | Performance, RLS, security headers, accessibility, retention | all | in progress | test IDs TC-NFR-01..14 in the analysis doc |
