# CareerPrep

Helps Malaysian students find official jobs that match what they know (MASCO 2020 and ESCO, with reasons),
close the skill gap for one target job with lessons, mastery checks and review cards, practise the
interview, build a CV and book a career adviser. Built by the DSIG team at GMI for UTP CodeFest,
Track 2: Education and Human Development.

Status: architecture scaffold. Pure engines are built and tested; screens and server actions are
placeholders (`grep -rn "notBuilt(" features` lists what is left).

## Stack

Next.js 15 (App Router, React 19, TypeScript strict) · Tailwind CSS 4 · Supabase (Postgres with RLS, Auth),
Singapore · Vercel, functions in `sin1` · Gemini 2.5 Flash-Lite (optional, off for under-18s) · Resend ·
ts-fsrs · Zod · Vitest · Playwright with axe.

See `docs/ARCHITECTURE.md` for the folder map and `AGENTS.md` for the coding rules.

## Run it locally

```bash
pnpm install
cp .env.example .env.local      # fill in the values; never commit this file
pnpm db:start                   # local Supabase in Docker (needs the Supabase CLI and Docker)
pnpm db:reset                   # applies supabase/migrations
pnpm dev                        # http://localhost:3000
```

Checks: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm db:test`, `pnpm test:e2e`.

## Deploy (Vercel)

Vercel project `careerprep` in the DSIG team, functions in Singapore. `docs/DEPLOY.md` has the steps:
connecting GitHub, every environment variable, Supabase URLs and migrations, the custom domain, and the
build check the team uses without npm. The sprint board is `docs/BOARD.md`.

## Removed from the October prototype

The prototype's demo-only and replaced features were not carried over, so nothing old keeps running:
fixture data mode and the recorded LLM provider; OpenAI and Anthropic providers; the hint ladder;
confidence ratings; the star list and weak-area feedback page; the skills radar and coverage table;
the hand-off engine; the old charcoal colour tokens; the System Tester lessons and placeholder skill lists.
The mock interview questions sourced from eMASCO tasks were kept in `content/interview/`.
