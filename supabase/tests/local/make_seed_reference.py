#!/usr/bin/env python3
"""Writes supabase/seed_reference.sql from the payload printed by scripts/import-reference.ts --print.

    node --experimental-strip-types scripts/import-reference.ts --print > /tmp/ref.json
    python3 supabase/tests/local/make_seed_reference.py /tmp/ref.json > supabase/seed_reference.sql
"""
import json
import sys

payload = json.load(open(sys.argv[1]))
for k in ("source_version", "interview_questions"):
    if k not in payload:
        sys.exit(f"payload has no {k}: update scripts/reference-payload.ts first")
body = json.dumps(payload, ensure_ascii=False, separators=(",", ":"))
if "$ref$" in body:
    sys.exit("payload contains the $ref$ quote tag")
counts = ", ".join(f"{k} {len(v)}" for k, v in payload.items() if isinstance(v, list))
sys.stdout.write(f"""-- CareerPrep reference data: jobs, skills, lessons, mastery checks and interview sets (source_version
-- {payload['source_version']}). PRODUCTION DATA: this is how the reference is loaded from the Supabase SQL editor
-- (paste and run), and it is the first seed file locally (config.toml [db.seed]).
--
-- Idempotent: it calls public.import_reference, which upserts every row by its content key and then removes rows
-- the new version no longer has, all in one transaction. Running it twice changes nothing. If a removed row is
-- still used by a student (a target job, progress, a saved option, an interview answer), the import stops and
-- nothing changes.
--
-- Rows: {counts}.
--
-- GENERATED from content/ ; do not edit by hand. Regenerate after any content change:
--   node --experimental-strip-types scripts/import-reference.ts --print > /tmp/ref.json
--   python3 supabase/tests/local/make_seed_reference.py /tmp/ref.json > supabase/seed_reference.sql
-- (or run the import directly: node --conditions=react-server --experimental-strip-types --env-file=.env.local scripts/import-reference.ts)

select public.import_reference($ref${body}$ref$::jsonb);
""")
