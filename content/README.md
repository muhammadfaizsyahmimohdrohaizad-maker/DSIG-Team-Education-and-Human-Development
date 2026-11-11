# content

Source files for the read-only reference data (D3). `pnpm ref:import` (`scripts/import-reference.ts`) loads
them into the `ref` schema through `public.import_reference` in one transaction, with a new `source_version`;
rows the new version dropped are removed (System Design 3.4). Running it twice with the same files changes
nothing. `node --experimental-strip-types scripts/import-reference.ts --dry-run` checks the files without a
database. After changing these files, regenerate `supabase/seed_reference.sql` with
`supabase/tests/local/make_seed_reference.py` so the local seed matches.

| Folder | Holds | Status |
|---|---|---|
| `reference/` | MVP slice: MASCO 2020 occupations around the AI engineer path, ESCO skills (`keys.ts` holds the stable keys), GMI modules, SPM subjects, interest areas, study options, and `source.json` (versions and links) | Sprint 1. Never commit the raw ESCO download. |
| `lessons/` | Per skill: four lessons, a 5-question check (each question linked to its lesson) and review cards; `types.ts` is the file format | Five AI engineer gap skills: deep learning, git, machine learning, model deployment, model evaluation. |
| `interview/` | Mock interview questions per MASCO occupation, each citing the eMASCO task it came from | Carried over from the prototype. Each question still needs `round` (technical or behavioural), `position` (1 to 3) and a checklist `rubric` (System Design A5) before import (ai role). |

Check answers are imported into `ref.check_questions.answer_key`, which the API never exposes; the server
marks checks from these files.
