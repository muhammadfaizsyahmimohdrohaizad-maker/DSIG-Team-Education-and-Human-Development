# content

Source files for the read-only reference data (D3). An import script loads them into the `ref` schema
with a `source_version`, then switches over in one transaction (System Design 3.4).

| Folder | Holds | Status |
|---|---|---|
| `interview/` | Mock interview questions per MASCO occupation, each citing the eMASCO task it came from | Carried over from the prototype. Each question still needs `round` (technical or behavioural), `position` (1 to 3) and a checklist `rubric` (System Design A5) before import. |
| `lessons/` | Four lessons per skill plus five check questions, each linked to its lesson | To write, starting with the AI engineer gap skills. |
| `reference/` | MASCO 2020 occupations, ESCO skills, occupation-skill links, study options | To build from the official downloads. Never commit the raw ESCO download. |
