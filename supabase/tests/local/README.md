# Local database tests (no Docker, no Supabase CLI)

```
supabase/tests/local/run.sh          # from the repo root
supabase/tests/local/run.sh --keep   # leave the cluster running to poke at it with psql
```

The script starts a throwaway Postgres 16 cluster in a temp directory on a free port, then for two databases:

- `rls`: Supabase stand-in, pgTAP shim, every file in `supabase/migrations/` in order, then every
  `supabase/tests/*.test.sql`.
- `demo`: the same migrations, then `supabase/seed_reference.sql` and `supabase/seed.sql`, then `seed_check.sql`
  (the seed matches the mockup boards).

It exits non-zero if a migration, the seed or any test fails, and deletes the cluster afterwards.

| File | What it is |
|---|---|
| `supabase_standin.sql` | What a Supabase project has before our migrations: roles `anon`, `authenticated`, `service_role`; `auth.users`, `auth.identities`; `auth.uid()`, `auth.jwt()`, `auth.role()` reading `request.jwt.claims`; Supabase's default grants on `public`; pgcrypto in `extensions`. |
| `pgtap_shim.sql` | `plan`, `ok`, `is`, `isnt`, `throws_ok`, `lives_ok`, `has_function`, `finish` for machines without pgTAP. `finish()` raises if anything failed. |
| `seed_check.sql` | Reads the demo seed through the app's RPCs as Pn. Nurul Huda and Aina Rahman. |
| `make_seed_reference.py` | Regenerates `supabase/seed_reference.sql` from `scripts/import-reference.ts --print`. |

Requirements: `initdb`, `pg_ctl`, `postgres` from `PGBIN` (default `/usr/lib/postgresql/16/bin`), `psql` on PATH,
`python3` (only to pick a free port). As root the server runs as the `postgres` OS user.

## Writing tests

Test files are plain pgTAP and also run under `supabase test db` (`pnpm db:test`). Act as a user the way
PostgREST does:

```sql
set local request.jwt.claims to '{"sub":"<uuid>","role":"authenticated","app_metadata":{"role":"student"}}';
set local role authenticated;
select is((select count(*)::int from public.profiles), 1, 'student sees one profile');
reset role;
```

Keep `select plan(N)` equal to the number of assertions; `finish()` fails the run when they differ.

## Postgres 17

Production runs Postgres 17 (`config.toml` `major_version = 17`). Only Postgres 16 is installable in the build
sandbox (the PGDG apt repository is blocked), so the migrations were reviewed for the known 17 changes instead:

- Maintenance commands (CREATE INDEX, REINDEX, REFRESH MATERIALIZED VIEW, ANALYZE) now run index and
  materialized-view expressions with `search_path = pg_catalog, pg_temp`. Our expression and partial indexes use
  only built-in functions and opclasses stored by OID (`gin_trgm_ops`), the generated column `total` uses only
  jsonb operators, and no CHECK constraint calls our own functions. Every SECURITY DEFINER function pins its
  search_path (tested in rls.test.sql).
- Removed in 17: `adminpack`, `db_user_namespace`, `old_snapshot_threshold`, the `pg_stat_bgwriter` checkpoint
  columns. None are used. Extensions used: `pgcrypto` and `pg_trgm`, both on Supabase's Postgres 17.
- No MERGE, no custom operators, no `SET SESSION AUTHORIZATION`, no reliance on `public` schema CREATE rights.

Run the suite on 17 when its binaries are available: `PGBIN=/usr/lib/postgresql/17/bin supabase/tests/local/run.sh`.
