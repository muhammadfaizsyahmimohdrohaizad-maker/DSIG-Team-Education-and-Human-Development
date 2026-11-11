// Loads content/reference and content/lessons into the ref schema (System Design 3.4).
//
//   node --conditions=react-server --experimental-strip-types --env-file=.env.local scripts/import-reference.ts
//   node --experimental-strip-types scripts/import-reference.ts --dry-run      # check the files, print counts, no database
//   node --experimental-strip-types scripts/import-reference.ts --print        # print the JSON payload (for psql tests)
//
// The whole import runs inside public.import_reference in one transaction: every row is upserted with the
// new source_version, rows the new version dropped are removed, and any failure rolls everything back.
// Running it twice with the same files changes nothing (ids are derived from content keys).
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { buildPayload, type RawReference } from "./reference-payload.ts";
import type { LessonFile } from "../content/lessons/types.ts";
import type { InterviewFile } from "../content/interview/sets.ts";

const root = join(import.meta.dirname, "..");
const read = <T>(rel: string): T => JSON.parse(readFileSync(join(root, rel), "utf8")) as T;

function loadRaw(): RawReference {
  const lessonDir = join(root, "content/lessons");
  return {
    source: read("content/reference/source.json"),
    interestAreas: read("content/reference/interest-areas.json"),
    skills: read("content/reference/skills.json"),
    occupations: read("content/reference/occupations.json"),
    spm: read("content/reference/spm-subjects.json"),
    modules: read("content/reference/gmi-modules.json"),
    studyOptions: read("content/reference/study-options.json"),
    lessons: readdirSync(lessonDir).filter((f) => f.endsWith(".json")).sort().map((f) => read<LessonFile>(`content/lessons/${f}`)),
    interviews: readdirSync(join(root, "content/interview")).filter((f) => f.endsWith(".json")).sort()
      .map((f) => read<InterviewFile>(`content/interview/${f}`)),
  };
}

async function main() {
  const args = new Set(process.argv.slice(2));
  const { payload, problems } = buildPayload(loadRaw());
  if (problems.length) {
    console.error(`Content has ${problems.length} problem(s); nothing was imported:\n- ${problems.join("\n- ")}`);
    process.exit(1);
  }
  if (args.has("--print")) {
    process.stdout.write(JSON.stringify(payload));
    return;
  }
  const counts = Object.fromEntries(Object.entries(payload).map(([k, v]) => [k, Array.isArray(v) ? v.length : v]));
  if (args.has("--dry-run")) {
    console.log("Content is valid. Rows to import:", counts);
    return;
  }

  // Imported here so --dry-run and --print work without Next.js or Supabase installed.
  const { adminDb } = await import("../server/data/supabase.ts");
  const { data, error } = await adminDb().rpc("import_reference", { p: payload });
  if (error) {
    console.error(`Import failed and was rolled back: ${error.message}`);
    process.exit(1);
  }
  console.log("Imported:", data);
}

main().catch((e: unknown) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
