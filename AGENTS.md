# Notes for anyone (person or coding agent) writing code here

Read `docs/ARCHITECTURE.md` first. The full design is the CareerPrep System Design document.

## Rules

- `server/engines/` is pure: data in, result out. No database, network, AI, email or Next.js imports (ESLint enforces it).
- Only `server/` talks to Supabase, Gemini or Resend. Client components never import from `server/`.
- Every server action validates input with a schema from `lib/schemas.ts` and returns a `Result` from `lib/result.ts`.
- Matching, lessons and mastery checks never call AI. AI feedback is off for under-18 accounts (`aiAllowed`).
- Use the UI kit tokens in `app/globals.css`. No new colours, weights or breakpoints.
- Remove code when a feature is replaced. Don't leave old paths running beside new ones.
- Never commit `.env*` (except `.env.example`), keys, real student data or the raw ESCO download.
- `grep -rn "notBuilt(" features` lists the actions still to build.
