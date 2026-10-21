# Notes for coding agents

Read these before writing code:

- `docs/11-repo-structure.md` — where every file goes and which folders may import which.
- `docs/10-ui-ux-spec.md` — tokens, screens, copy and the checks the UI must pass.
- `docs/03-architecture.md` — components, data model, LLM adapter rules.

## Commands

```bash
pnpm install
pnpm dev            # http://localhost:3000
pnpm lint
pnpm typecheck
pnpm test           # Vitest, tests/unit
pnpm test:e2e       # Playwright + axe, tests/e2e
pnpm db:migrate     # supabase/migrations (real mode only)
pnpm db:seed        # loads content/ into Supabase (real mode only)
python pipeline/run.py
python pipeline/eval.py
```

## Rules

- Demo mode is the default: `DATA_MODE=fixtures`, `LLM_PROVIDER=recorded`. Every screen must work with no database and no network.
- Business logic goes in `lib/` (pure, unit-tested). Database, LLM and email calls go in `server/` only.
- Use the tokens in `app/globals.css`. Don't add colours, font weights or breakpoints.
- Hints never contain the answer. The mastery check never calls the LLM. Feedback never shows a grade.
- Never commit `.env.local`, real student data or the raw ESCO download.
