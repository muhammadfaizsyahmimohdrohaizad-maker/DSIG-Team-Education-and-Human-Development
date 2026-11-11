// Runs the ai-*.test.ts files without node_modules:
//   node --experimental-strip-types tests/unit/ai-run.ts
// Under `pnpm test` Vitest runs the same files directly.
import { register } from "node:module";
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

register(pathToFileURL(join(import.meta.dirname, "ai-hooks.mjs")).href);

const only = process.argv[2];
const files = readdirSync(import.meta.dirname).filter((f) => /^ai-.*\.test\.ts$/.test(f) && (!only || f.includes(only))).sort();
for (const f of files) {
  console.log(f);
  await import(pathToFileURL(join(import.meta.dirname, f)).href);
}
const { run } = await import("vitest" as string);
process.exit((await run()) ? 1 : 0);
