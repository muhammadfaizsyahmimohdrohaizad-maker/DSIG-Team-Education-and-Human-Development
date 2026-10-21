# CareerPrep UI/UX specification and Codex hand-off

**Contents:** [1 Prompt for Codex](#1-prompt-for-codex) · [2 Scope and priority](#2-scope-and-priority) · [3 Design foundations](#3-design-foundations) · [4 App shell](#4-app-shell) · [5 Screens](#5-screens) · [6 Shared components](#6-shared-components) · [7 Copy](#7-copy) · [8 Fixture data](#8-fixture-data) · [9 Checks](#9-checks)

Product behaviour is defined in [01-prd.md](01-prd.md) §5 and [02-methodology.md](02-methodology.md). This document defines how it looks and behaves on screen. A clickable mockup of every screen below (desktop at 1280 px, four screens at 390 px) lives in the "CareerPrep UI mockup" canvas on claude.ai; it is private to the owner until shared, so export screenshots from it if Codex cannot open the link. If the two disagree, the PRD wins for behaviour and this document wins for presentation.

## 1. Prompt for Codex

Assumption: "astra medium" means the Astra model (`gpt-6-astra`) at medium reasoning effort. Nothing in this document depends on the model.

Paste this as the task:

> Build the CareerPrep student and adviser UI described in `docs/10-ui-ux-spec.md`, in the repo root, as a Next.js (App Router) + TypeScript + Tailwind app. Put every file where `docs/11-repo-structure.md` says and follow its import rules. Use the fixture data in §8 and no backend: run with `DATA_MODE=fixtures` and `LLM_PROVIDER=recorded`, so every screen works from `content/` and the LLM outputs are recorded responses. Build the P0 screens in §2 first and make the demo path in §2 work end to end before starting anything else. Draw the radar as plain SVG (no chart library) and use the native `<dialog>` element for overlays. Follow §3 tokens exactly; do not add colours, font weights or breakpoints. Meet every check in §9 and run them (Playwright at 375 px and 1280 px, plus an axe scan) before you report done. Do not add auth, a database, analytics, or documentation beyond a short `README` run section.

## 2. Scope and priority

The 3-minute demo video ([05-demo-script.md](05-demo-script.md)) is judged on what is visible, so the order below follows the video.

| Priority | Screens | Why |
|---|---|---|
| P0 | Programme and modules (picker), Skills map, Occupation matches, Occupation detail, Gap plan, Micro-lesson, Mastery check, Interview, Feedback, Booking request, Adviser dashboard, student booking status | Every shot in the demo script |
| P1 | Onboarding and consent, delete-my-data page | Required by the PRD and PDPA story, not on camera |
| P2 | Dark theme, Malay UI strings | Not needed for the round |

**Demo path (must work without a reload, in this order):** tick 4–6 modules → radar updates → open a skill (drawer shows quote + confidence) → occupation cards (one low-confidence flag) → open 2519-01 → set one skill's confidence to 2 of 5 → plan appears → lesson: show hint → answer → next review date → interview question → typed answer → feedback → "Talk to a human" → booking confirmation → switch to the adviser view → Accept the request → switch back, the booking shows "Accepted". Add a role switch in the footer of the demo build ("View as: Student / Adviser") so the recording needs no sign-in.

Out of scope: real authentication, uploads (show the manual module picker only), speech input (render the button disabled with the text "Dictation is not available in this demo"), email, push.

## 3. Design foundations

Style intent: calm, plain and readable. A student on a phone should reach any action in two taps. No gradients, no glass blur, no decorative icons, no illustrations, no pills around static text (checked in §9).

### 3.1 Tokens

Put these in `app/globals.css` and reference them from `tailwind.config`. Do not hard-code hex values in components. Contrast was computed for every text pair below.

```css
:root {
  /* surfaces: canvas is L0, surface is L1 (cards, tables, panels), overlay is L2 */
  --canvas: #F7F8FA;
  --surface: #FFFFFF;
  --overlay: #FFFFFF;
  --border: #D5DBE3;            /* hairlines and card edges */
  --border-strong: #8392A5;     /* input borders, 3.17:1 on surface */

  --ink: #1A202C;               /* 16.3:1 on surface, 15.4:1 on canvas */
  --ink-muted: #4A5568;         /* 7.5:1 on surface, 7.1:1 on canvas */

  --accent: #1F5A99;            /* links, primary buttons, focus: 7.05:1 on white */
  --accent-ink: #174673;
  --accent-tint: #E8F0F8;       /* 8.45:1 for --accent-ink on tint */

  --warn-ink: #7A4A00;  --warn-tint: #FFF4DC;     /* 6.85:1 */
  --ok-ink:   #1E5B3A;  --ok-tint:   #E4F4EA;     /* 7.05:1 */
  --danger-ink: #9B1C1C; --danger-tint: #FDECEC;  /* 7.14:1 */

  --shadow-soft: 0 1px 3px rgba(26, 32, 44, 0.06);   /* alpha < 0.08; overlays only */

  --space-1: 4px;  --space-2: 8px;  --space-3: 12px; --space-4: 16px;
  --space-6: 24px; --space-8: 32px; --space-12: 48px; --space-16: 64px;

  --text-meta: 0.75rem;       /* 12px: timestamps, source tags, helper text only */
  --text-secondary: 0.875rem; /* 14px */
  --text-body: 1rem;          /* 16px: default for rows, cells, form values */
  --text-h3: 1.125rem;  --text-h2: 1.375rem;  --text-h1: 1.75rem;
  --leading-body: 1.55;  --leading-head: 1.2;  --leading-meta: 1.4;
  --prose-max: 70ch;

  --vp-narrow: 375px;  --vp-medium: 768px;  --vp-wide: 1280px;
  --radius: 8px;
  --hit: 44px;
}
```

Rules that follow from the tokens:

- One accent hue. Accent covers primary buttons, links, active stage, focus. Everything else is neutral. Warn, ok and danger tints appear only on status chips and inline messages, and always with a text label and an icon.
- Type: Inter via `next/font`, weights 400 (body), 500 (labels, buttons), 600 (headings) and nothing else. Sentence case everywhere. Table cells, list rows and form values are 16 px or 14 px, never 12 px.
- Spacing: only the `--space-*` tokens. Section gaps 32 px, card padding 16 px (24 px from `medium`), gap between a label and its control 4 px.
- Breakpoints: three only, `narrow` 375, `medium` 768, `wide` 1280. Use `min-width` queries from the narrow baseline. Tables stack to cards below `medium` (this replaces the 640 px in the PRD).
- Surfaces: every card, table, list and the chart panel is L1: `--surface` with a 1 px `--border`. Only overlays (drawer, dialog) get `--shadow-soft`.
- Focus: `:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }` on every interactive element, never removed. The sticky header must not cover a focused element (WCAG 2.2 SC 2.4.11), so set `scroll-padding-top` to the header height.
- Hit targets: 44 × 44 px minimum for every button, link in a nav, radio option and checkbox row.
- Motion: only the radar polygon transition (300 ms) and the drawer slide (150 ms). Both are disabled under `prefers-reduced-motion: reduce`. No auto-advancing content, no timers, no confetti.

### 3.2 Layout

`html`, `body` and the header span the full width. Only `main` is centred, `max-width: var(--vp-wide)`, with 16 px side padding at `narrow` and 32 px from `medium`. Reading text (explanations, hints, feedback) is capped at `--prose-max`. Check that `scrollWidth <= clientWidth` at 375 and 1280.

## 4. App shell

**Student shell.** Header: logo text "CareerPrep", a four-item stage nav (Map, Plan, Practice, Feedback), a "Bookings" link with a text count when a booking has changed ("Bookings, 1 update"), and a "Talk to a human" button. The current stage link carries `aria-current="page"` and an accent underline and weight 600, so it does not rely on colour.

- `narrow`: the stage nav and Bookings collapse behind a "Menu" button (text label, not icon-only) that opens the same links in a full-width panel. "Talk to a human" stays visible in the header.
- First focusable element on every page: a "Skip to main content" link.
- Footer: a one-line privacy note, a "Delete my data" link, and the demo-only role switch.

**Adviser shell.** Header with "CareerPrep for advisers" and a "Sign out" button that returns to the student view in the demo build. There is no stage nav.

**Routes.**

| Route | Screen |
|---|---|
| `/onboarding` | Onboarding and consent |
| `/map` | Programme and modules, then Skills map (one route, two sections) |
| `/matches`, `/matches/[code]` | Occupation matches, Occupation detail |
| `/plan` | Gap plan |
| `/practice` | Today: due questions, coming up, interview entry (Practice tab "Lessons") |
| `/practice/[skillId]` | Micro-lesson |
| `/practice/[skillId]/check` | Mastery check |
| `/interview` | Interview |
| `/feedback/[answerId]` | Feedback |
| `/bookings`, `/bookings/new` | Booking status, Booking request |
| `/delete-my-data` | Delete my data (confirm, then delete) |
| `/adviser` | Adviser dashboard |

## 5. Screens

Each screen names its page pattern first, then its content, states and accessibility behaviour. Hint and mastery behaviour is fixed by the [AI guardrails](01-prd.md); do not add an "Show answer" control anywhere before the student has answered.

### 5.1 Programme and modules, then Skills map (`/map`) — Form, then Detail

Two sections on one page so the radar updates beside the picker.

- **Module picker (Form).** Programme shown as fixed text: "GMI Diploma in Software Engineering". Modules in one `<fieldset>` per semester with the semester as `<legend>`; each module is a 44 px checkbox row (label = module name). A visible "Enter modules manually" note replaces upload in the demo. Seed Aina with 6 modules ticked.
- **Skills map (Detail).** At `wide`, two columns: picker left, results right; at `narrow` they stack, picker first. Results panel (L1): heading "Your skills map", the Recharts radar with 6 axes, then directly below it a table with columns Skill group, Coverage (as "62%"), Skills found. The table is always visible; it is the text alternative. The chart is wrapped `role="img"` with `aria-label` summarising the top two axes, and `aria-describedby` pointing at the table.
- **Skill list.** Under the table, a list of extracted skills. Each row is a `<button>` "Skill name, confidence 82%" that opens the skill drawer.
- **Skill drawer (slide-over, native `<dialog>`).** Title = ESCO skill label. Content: "Quoted from the learning outcome" label, then a `<blockquote>` with the module name as `<cite>`, then "Confidence 82%" as text, and a low-confidence note when below τ. Close button "Close skill details" top right; Esc closes; focus returns to the row that opened it. Full height at `narrow`.
- **States.** Zero modules ticked: the results panel keeps its frame and shows "No modules selected" / "Tick the modules you have completed to see your skills." with no button (the picker is on the same screen). Loading is not needed with fixtures; build a skeleton with the same panel geometry anyway for the real data later.

### 5.2 Occupation matches (`/matches`) — List / Index

- Heading "Occupations your modules point to", one sentence of explanation, a link "How the match is calculated" to a short in-page `<details>` (formula in plain words).
- Ranked list of cards inside an L1 `<ol>`. Each card is an `<li>` with an `<h3>` "2519-01 · Penguji Sistem (System Tester)", then "Match 78%" as text, a thin bar with `aria-hidden="true"`, and up to two evidence quotes with a "Show all 5 quotes" `<button>` using `aria-expanded`. The whole card is not a link; the heading contains the link "View 2519-01 details".
- Low-confidence card (any covered skill under τ): a warn-tint row with a flag icon and the text "Check with adviser: some of these links are uncertain" and a "Talk to a human" button.
- Show three cards at first load and a "Show 6 more occupations" button.
- Mobile: single column, same card.

### 5.3 Occupation detail (`/matches/[code]`) — Detail

Breadcrumb "Matches / 2519-01". Header: code, Malay and English titles, match %. Two sections: "Skills you already cover" and "Skills to build" (each a list with ESCO label, essential or optional as text, and for covered skills the quote). Primary button "Build my plan for this role" goes to `/plan`. Secondary: "Talk to a human".

### 5.4 Gap plan (`/plan`) — Form

- Heading "Your gap skills for System Tester". Each gap skill is a `<fieldset>`: legend = ESCO label; helper "How confident are you with this today?"; five radio options 1–5 in a single row of 44 px segments, with visible end labels "1 Not confident" and "5 Very confident". Never a slider.
- Button "Build my plan" is always enabled. On click with a skill unrated: focus the first unrated fieldset and show "Choose a number from 1 to 5." under its legend.
- Result: an `<ol>` "Your 5-minute plan" with one row per skill: skill, today's task ("Recall 3 questions"), and a "Start lesson" link. The list sits in an L1 panel. When the plan changes, a visually hidden `role="status"` region announces "Plan updated: 3 skills, about 5 minutes a day."

### 5.5 Micro-lesson (`/practice/[skillId]`) — Form

One recall question per screen. Layout: stage label "Practice", skill name, "Question 2 of 5" as text, the question in 18 px, a labelled textarea "Your answer".

- Buttons: "Check answer" (primary) and "Show a hint" (secondary). The hint button text counts up: "Show a hint (1 of 3)", then "Show another hint (2 of 3)", then disappears after the third. Hints are named in the output: "Hint 1 · Nudge", "Hint 2 · Concept", "Hint 3 · Worked example".
- Hints render in an L1 region with `aria-live="polite"`. Nothing animates and there is no timer.
- After "Check answer": reveal the reference answer under "Model answer", then a radio group "How did that go?" with Again, Hard, Good, Easy, and a button "Save and continue". On save show the line "Next review: 23 Oct" (date from the fixture) in the status region.
- Empty answer on "Check answer": do not block. Treat it as "no answer", show the model answer, and preselect nothing.

### 5.6 Mastery check (`/practice/[skillId]/check`) — Form

Same layout as the lesson with these differences: heading "Mastery check: [skill]"; a visible note "Hints and AI are off for this check. You need 4 of 5."; no hint button; no model answer until the end. After question 5, the result panel states the score in text ("4 of 5 correct. You passed.") and lists each question with the student's answer and the key's answer. A fail reads "3 of 5 correct. Retake the check after your next lesson." with a link "Start next lesson". Marking is string/option matching against the key in the fixture; no network call.

### 5.7 Interview (`/interview`) — Form

Not a chat. One question card at a time: the question, the source tag in 12 px meta text "Source: eMASCO 2519, task 2", a labelled textarea "Your answer" with a character count in a `role="status"` region, and the buttons "Send answer" and "Dictate answer (Chrome only)". Dictation is disabled with the explanation in text beside it (see §2). Fixed demo text: pre-fill the textarea from the fixture when the URL has `?demo=1`.

### 5.8 Feedback (`/feedback/[answerId]`) — Detail

Heading "Feedback on your answer". Under it four `<h2>` sections in this order: Structure (STAR), Evidence, Technical accuracy, One next step. Structure is a four-row list: Situation, Task, Action, Result, each with an icon plus the word "Present" or "Missing". No score, no grade, no percentage anywhere on this screen. Buttons: "Add weak area to my reviews" (after click, the label becomes the status text "Added to your reviews") and "Talk to a human".

### 5.9 Booking request and status (`/bookings/new`, `/bookings`)

- **Request (Form).** Fields: "Preferred date" (`type=date`), "Preferred time" (`type=time`), "Note for the adviser" (textarea, optional, helper "Share what you want help with. Leave out health or personal details."). Button "Request session". Success: a heading "Request sent" plus text "Puan Rohana will accept or decline. You will see the status here." and a link "View my bookings".
- **Status (List / Index).** Each booking is a row in an L1 list: slot, note, and a status chip with icon + text from this set only: Requested, Accepted, Declined, Completed, Cancelled. A booking whose status changed since the last visit shows "Updated" in text beside the chip until opened. If the adviser cancelled, show "Reason: …" below. The student can "Cancel request" while the status is Requested or Accepted.
- Empty: "No bookings yet" / "Ask an adviser to review your target role and gaps." / button "Request a session".

### 5.10 Adviser dashboard (`/adviser`) — List / Index

- Heading "Students", one sentence "Each row shows a student's target role, gaps and booking. Student data is read-only." Visible search field labelled "Search students" at `medium` and up (aria-label only at `narrow`).
- At `medium`+: a semantic `<table>` in an L1 frame with hairline row dividers and a sticky header. Columns: Student, Target occupation, Gap skills, Latest feedback, Booking, Actions. Rows are 16 px text, keyboard reachable.
- Below `medium`: each row becomes a card with the same fields as a definition list.
- **Booking actions** (only for the student's booking, never for student data): for Requested, buttons "Accept" and "Decline"; for Accepted, "Mark complete" and "Cancel booking"; Accepted and past its slot also shows "Needs outcome" text in the Booking cell. "Cancel booking" opens a dialog with a required textarea "Reason for cancelling" and buttons "Cancel booking" and "Keep booking". After an action, update the chip in place and announce "Booking accepted for Aina" in a `role="status"` region. Focus returns to the row's next available action.
- **Empty:** "No students yet" / "Students appear here after they link their account." (first use). Filtered zero: "No students match your search" with a "Clear search" button.

### 5.11 Onboarding and consent (`/onboarding`) — Form (centred card, no stage nav)

Plain-language summary above the fold at 375 px: what data is used, that this demo uses a fictional student, that no audio is stored. An unchecked checkbox labelled "I understand how my data is used". Button "Start with the demo student" is always clickable; if unchecked it focuses the checkbox and shows "Tick the box to continue." beside it. Link: "Delete my data".

## 6. Shared components

Build these once and reuse them. Each handles the states listed.

| Component | Rules |
|---|---|
| `Button` | Variants primary, secondary, danger. Min 44 px high. Label starts with a verb. Loading: keep the label, add `aria-busy`, inline spinner after 100 ms. Never `disabled` on a form submit. |
| `Field` | Visible `<label>`, helper text, error text in the same slot (errors replace helper). Error appears on first blur, not while typing, and clears on focus. `aria-describedby` wires helper and error. |
| `RadioScale` | Fieldset + legend + 5 radios in a row, end labels visible, arrow-key roving as native radios do. |
| `Card` | L1 surface, 1 px border, 16 px padding. No shadow. |
| `StatusChip` | Icon + text, 4 px radius, border in the tint's ink colour. Used for booking status and the low-confidence flag. Never colour alone. |
| `Drawer` | Native `<dialog>`, trap focus, Esc closes, restore focus to trigger, full height at `narrow`. |
| `LiveRegion` | One `role="status"` per page, polite, visually hidden; components push strings into it. |
| `EmptyState` | Heading, one sentence, one verb-first button. Lives inside the surrounding panel so the frame and layout stay. No illustration. |
| `ErrorBanner` | Plain message, recovery action, and a "Copy error details" button for technical faults. |

Loading: no loader under 100 ms; inline spinner on the triggering button for 100 ms–1 s; a skeleton matching the panel geometry for anything longer. No full-page spinner.

## 7. Copy

Sentence case. Buttons start with a verb. Errors name the fix and never blame the student. No "OK", "Submit" or "Continue".

| Where | String |
|---|---|
| Unrated skill | Choose a number from 1 to 5. |
| Mastery pass | 4 of 5 correct. You passed. |
| Mastery fail | 3 of 5 correct. Retake the check after your next lesson. |
| Hint region label | Hint 1 · Nudge |
| Low confidence flag | Check with adviser: some of these links are uncertain |
| Network failure | We couldn't save your answer. Check your connection and try again. |
| Booking cancelled by adviser | Your adviser cancelled this session. Reason: … |
| Delete my data (confirm) | Delete all data for this account? This removes your modules, answers and bookings and cannot be undone. |
| Radar alt summary | Strongest areas: Software testing 70%, Programming 62%. |

## 8. Fixture data

Types go in `lib/types.ts`; the data goes in `content/` as JSON and is served by `server/data/fixtures.ts` ([11 §5](11-repo-structure.md#5-demo-mode-and-real-mode)). These are UI view models, not the database schema ([03-architecture.md](03-architecture.md) §data model). Values below are illustrative placeholders for the UI; the team replaces them with pipeline output later. Do not invent extra occupations or skills.

```ts
export type Persona = { id: string; name: string; semester: number; targetCode: string };
export type Module = { id: string; semester: number; name: string };
export type Skill = {
  id: string; escoLabel: string; group: string;
  confidence: number;          // 0-1, link confidence from the pipeline
  quote: string; moduleId: string;
};
export type Occupation = {
  code: string; titleMs: string; titleEn: string; matchPct: number;
  essential: string[]; optional: string[];     // skill ids
  role: "primary" | "secondary" | "entry-level";
};
export type Booking = {
  id: string; studentId: string; slot: string;
  status: "requested" | "accepted" | "declined" | "completed" | "cancelled";
  note?: string; cancelReason?: string; changedSinceViewed: boolean;
};

export const MATCH_CONFIDENCE_THRESHOLD = 0.6;   // τ
export const MASTERY_PASS_MARK = 0.8;            // 4 of 5
```

Seed:

- **Persona:** Aina, Semester 5, target `2519-01`. Adviser: Puan Rohana, five students (Aina, Hafiz, and three invented first names).
- **Modules for Aina (ticked):** Quality Assurance & Control, Android Programming, Advanced Web Programming, Basic of Programming, Basic of Software Testing, Software Modelling & Requirements Engineering.
- **Radar axes (6):** Software testing, Programming, Web development, Mobile development, Requirements and modelling, Databases.
- **Occupations:** the nine in [02-methodology.md](02-methodology.md) (2519-01 System Tester at 70% first, 2512-01 Software Developer at 64%, 2514-01 Computer Programmer at 58%, then the rest below 55%). Each percentage must follow from the formula: 2519-01 is 6 of 9 essential and 2 of 2 optional, so (6 + 1) / (9 + 1) = 70%. One Aina skill link at 0.52 ("report test findings") so the flag shows on the 2519-01 card.
- **Gap skills (3) for 2519-01:** the mockup uses execute integration testing, use test automation tools and report test findings. Treat these as placeholders until the team confirms the exact ESCO labels, and keep them in one file.
- **Lesson content:** 5 recall items per gap skill, each with a 3-step hint ladder and a model answer; 5 mastery questions per gap skill with an answer key. Write two real items for gap skill A so the live demo reads naturally and mark the rest `TODO: team content`.
- **Interview:** one question from eMASCO 2519 task 2 (English), one pre-written answer, one cached feedback object.
- **Bookings:** one `requested` booking from Aina to Puan Rohana.

## 9. Checks

Automate these in one Playwright spec plus `@axe-core/playwright`. They test what a student would hit.

1. At 375 and 1280 px, on every route: no horizontal page scroll; axe reports no serious or critical violations.
2. Keyboard only: complete the whole demo path (§2) with Tab, Shift+Tab, Enter, Space and arrow keys. Focus is visible at every step and never hidden under the header.
3. Each drawer and dialog: Esc closes, focus is trapped while open, focus returns to the opener.
4. The model answer does not appear in the DOM before "Check answer" is pressed, and the hint button reveals one hint per press, never more than three.
5. The mastery check page has no hint button, shows "4 of 5" as the pass rule, and marks without any network request (assert zero `fetch` calls).
6. The radar's data table is present and matches the chart values; match % and booking status appear as text.
7. Every `<input>`, `<textarea>` and `<select>` has a programmatically associated visible label (search field labelled on `medium`+).
8. A grep of `app`, `features`, `components` and `lib` finds none of: `backdrop-filter`, `gradient`, `outline: none` without a replacement, `disabled` on a submit button, font weights above 600, font sizes below 12 px, or a breakpoint other than 768 and 1280.
9. `prefers-reduced-motion: reduce` removes the radar and drawer transitions.
