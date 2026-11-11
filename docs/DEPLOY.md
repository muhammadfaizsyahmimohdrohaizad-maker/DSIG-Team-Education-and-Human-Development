# Deploying CareerPrep

Who does what: Faiz (owner) does the steps that need account access. The team never handles secret
values; they go straight from the provider's dashboard into Vercel.

Current state: Vercel project `careerprep` in team **DSIG** (`dsig-dev`), created from a file upload.
It is not connected to GitHub yet and has **no environment variables**. Pages build and render; anything
that calls Supabase fails at request time until step 3 is done.

## 1. Connect GitHub to Vercel

1. Push `main` to `github.com/muhammadfaizsyahmimohdrohaizad-maker/DSIG-Team-Education-and-Human-Development`.
2. Vercel dashboard > team **DSIG** > project **careerprep** > Settings > Git > Connect Git Repository >
   GitHub. Install the Vercel GitHub app on that repository only when asked.
3. Settings > Git: Production Branch = `main`. Every other branch and pull request then gets a preview URL.
4. Settings > Build and Deployment: leave Framework = Next.js and Root Directory empty. Install and build
   commands come from `vercel.json` (see "Why vercel.json sets the install command" below), so leave the
   override toggles off. Node.js Version = 22.x (`engines` in `package.json` also says 22.x).
5. Settings > Functions: region Singapore (`sin1`) matches `vercel.json`. If the dashboard shows
   Washington (`iad1`), change it to Singapore here; the database is in Singapore too.

## 2. Create the Supabase project and run the migrations

1. supabase.com > New project, organisation DSIG, region **Southeast Asia (Singapore)**. Save the database
   password in a password manager, not in the repo.
2. On your own machine (needs the Supabase CLI: `pnpm install` brings it in, or `brew install supabase/tap/supabase`):

   ```bash
   supabase login                               # opens the browser
   supabase link --project-ref <project-ref>    # the ref is in the dashboard URL; asks for the DB password
   supabase db push                             # applies supabase/migrations in order
   supabase db push --dry-run                   # later: shows what a push would apply, changes nothing
   ```

   `db push` only runs migrations the remote has not seen. Never edit a migration that has been pushed;
   add a new file instead.
3. Reference data and the demo seed are loaded by the db role's import script once it lands
   (`docs/BOARD.md`, critical path step 2 and 10).

## 3. Environment variables (Vercel > Settings > Environment Variables)

Add each for **Production** and **Preview** (and Development if you use `vercel env pull`). Names only
here; values come from the dashboards named in the table. "Secret" means: tick **Sensitive** in Vercel,
never paste it in chat, a commit or a screenshot.

| Name | What it is for | Where the value comes from | Secret |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase API address; also added to the CSP `connect-src` at build time | Supabase > Project Settings > API > Project URL | no (public) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser and server client acting as the signed-in user; RLS applies | Supabase > API > `anon` `public` key | no (public, RLS protects data) |
| `SUPABASE_SERVICE_ROLE_KEY` | Bypasses RLS. Used only by sign-up (setting the role), data export, account deletion and cron | Supabase > API > `service_role` key | **yes** |
| `SITE_URL` | Public address used in emails and parent-consent links | `https://careerprep-dsig-dev.vercel.app` now; the custom domain later | no |
| `STAFF_CODE_HASHES` | Comma-separated SHA-256 hashes of valid adviser staff codes (FR-AUTH-02) | Make with `printf '%s' '<code>' \| sha256sum`; give advisers the code, store only the hash | treat as **yes** |
| `CRON_SECRET` | Vercel Cron sends it as `Authorization: Bearer ...` to `/api/cron/*`; 16+ characters | `openssl rand -hex 32` | **yes** |
| `LLM_PROVIDER` | `stub` (fixed text, no network) or `gemini` | your choice; `stub` until the key is in | no |
| `GEMINI_API_KEY` | Optional AI interview feedback, never for under-18 accounts | Google AI Studio > API keys | **yes** |
| `GEMINI_MODEL` | Model name, default `gemini-2.5-flash-lite` | leave the default | no |
| `RESEND_API_KEY` | Sends booking and consent emails; without it emails are only logged | resend.com > API Keys | **yes** |
| `EMAIL_FROM` | Sender, e.g. `CareerPrep <no-reply@your-domain>`; the domain must be verified in Resend | your choice | no |

`server/env.ts` validates these on first use. A missing required one shows the variable **name** (never
the value) in the function log. After adding or changing variables, redeploy (Deployments > ... > Redeploy):
`NEXT_PUBLIC_*` values are baked in at build time.

## 4. Supabase URL configuration (Authentication > URL Configuration)

- **Site URL**: the production address, `https://careerprep-dsig-dev.vercel.app` (later the custom domain).
- **Redirect URLs**, one per line:
  - `https://careerprep-dsig-dev.vercel.app/auth/callback`
  - `https://careerprep-*-dsig-dev.vercel.app/**` (preview deployments)
  - `http://localhost:3000/auth/callback` (local work)
- Authentication > Providers > Email: leave "Confirm email" on. Emails link to `/auth/callback`, which
  exchanges the code for a session and only redirects to paths inside the app.
- Authentication > Emails > SMTP: for the final, plug in Resend SMTP so sign-up mails are not rate-limited
  by Supabase's built-in sender.

## 5. Custom domain (later)

1. Vercel > careerprep > Settings > Domains > Add, e.g. `careerprep.dsig.my`. Vercel shows the DNS record
   (`CNAME` to `cname.vercel-dns.com` for a subdomain, or an `A` record for an apex domain). Add it at
   your DNS provider and wait for the green tick; Vercel issues the certificate.
2. Set it as the primary domain and let the `vercel.app` address redirect to it.
3. Update `SITE_URL` in Vercel, then redeploy.
4. Supabase: change the Site URL and add `https://<domain>/auth/callback` to the redirect URLs.
5. Resend: verify the domain and change `EMAIL_FROM` to an address on it.

## Build check without npm (team sandbox)

The sandbox cannot reach the npm registry or the Vercel REST API, so builds are checked by uploading
files through the Vercel MCP tools. `scripts-ops/deploy-preview.mjs` prepares the request body.

```bash
cd /home/claude/dsig-careerprep          # or any worktree; checks out nothing, reads committed files
git checkout <branch>                     # or pass the ref as an argument instead
node scripts-ops/deploy-preview.mjs main --out /tmp/payload.json                  # every file inlined
node scripts-ops/deploy-preview.mjs main --refs --inline package.json,app/x.tsx   # SHA refs + changed files
```

1. Pass the JSON as `requestBody` to MCP `create_deployment` with `teamId` `team_z4aMgBSXXiw7d6gcQsPa9MPP`,
   `skipAutoDetectionConfirmation: "1"`, `forceNew: "1"`. Leave out `target`: no target means preview.
2. `--refs` sends only SHA-1s. Vercel reuses files it has stored before; if it answers `missing_files`,
   rerun with `--inline-sha <the shas it lists>`. The first upload of a branch is a full upload.
3. Watch: `get_deployment` until `readyState` is `READY` or `ERROR`, then
   `list_deployment_events { idOrUrl, builds: 1, direction: "backward", limit: 60 }` for the tail of the log.
   For a type or lint error, Next prints the file and line just before `Failed to compile`.
4. With a `VERCEL_TOKEN` in the environment (a machine that can reach `api.vercel.com`), the script posts
   the deployment itself and prints the URL.

Size limit in practice: every inlined byte passes through the agent's own output. That works for a
scaffold-sized tree (about 70 KB) but not for merged main (about 450 KB after Sprint 1). For full builds
use a Git deployment (step 1) or run the script with `VERCEL_TOKEN` on a machine that can reach
`api.vercel.com`; keep the MCP route for small redeploys with `--refs`.

`.vercelignore` keeps docs, tests, migrations and these scripts out of the upload. Vercel applies the same
file to Git deployments, so a build check sees what a real deploy sees.

## Why vercel.json sets the install command

- With no `pnpm-lock.yaml`, Vercel falls back to an old pnpm. That pnpm fails on Node 22+ with
  `ERR_PNPM_META_FETCH_FAIL ... Value of "this" must be of type URLSearchParams` (`ERR_INVALID_THIS`),
  which is what the first deploy hit. `vercel.json` therefore runs pnpm 10.12.1 (the version in
  `packageManager`) through `npx`.
- `engines.node` was `>=22`, which made Vercel pick Node 26. It is now `22.x`.
- The build command prints `pnpm ls --depth 0` first, so every build log records the exact versions installed.
- pnpm 10 skips dependency install scripts unless listed; `pnpm.onlyBuiltDependencies` allows `esbuild`
  (Vitest) and `supabase` (downloads the CLI binary for `pnpm db:*`).

Once `pnpm-lock.yaml` is committed, `installCommand` can become `pnpm install --frozen-lockfile`.

## Lockfile

The sandbox cannot run `pnpm install`, and the Vercel MCP tools cannot read files out of a build, so
the lockfile could not be fetched. What we have instead:

- `package.json` pins every direct dependency to the exact version Vercel resolved on 11 Nov 2026
  (from the `pnpm ls --depth 0` output in the build log). Transitive dependencies can still move.
- **The first developer who runs `pnpm install` on a machine with registry access commits
  `pnpm-lock.yaml`** in its own commit (`chore: add pnpm lockfile`), then switches `--no-frozen-lockfile`
  to `--frozen-lockfile` in `vercel.json` and `.github/workflows/ci.yml`.

Resolved on Vercel (pnpm 10.12.1, Node 22): next 15.5.29, react and react-dom 19.3.1, @supabase/ssr 0.7.0,
@supabase/supabase-js 2.119.0, zod 4.6.7, ts-fsrs 5.4.2, server-only 0.0.1; dev: typescript 5.9.3,
eslint 9.39.5, eslint-config-next 15.5.29, @eslint/eslintrc 3.3.7, tailwindcss and @tailwindcss/postcss
4.3.5, postcss 8.5.32, vitest 3.2.7, @playwright/test 1.65.0, @axe-core/playwright 4.14.0,
@types/node 22.20.5, @types/react and @types/react-dom 19.3.0, supabase 2.122.1.

## CI (`.github/workflows/ci.yml`)

Runs on every push to `main` and every pull request once the repo is on GitHub:

- `check`: `pnpm/action-setup@v4` reads `packageManager` (pnpm 10.12.1), Node 22, then
  `pnpm install --no-frozen-lockfile`, lint, typecheck, unit tests. There is no `cache: pnpm` on
  `setup-node` on purpose: that option needs a lockfile and fails without one. Add it with the lockfile.
- `database`: Supabase CLI, local Postgres with the migrations, then the pgTAP RLS tests.
