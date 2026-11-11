// Node module hooks so the ai-*.test.ts files run without node_modules (the npm registry is blocked here):
// "vitest" resolves to a tiny shim, "@/..." to the repo root, and "server-only" to an empty module.
// Under the real Vitest none of this is used.
import { pathToFileURL } from "node:url";
import { join } from "node:path";

const root = join(import.meta.dirname, "..", "..");

export async function resolve(specifier, context, next) {
  if (specifier === "vitest") return { url: pathToFileURL(join(root, "tests/unit/ai-vitest-shim.ts")).href, shortCircuit: true };
  if (specifier === "server-only") return { url: "data:text/javascript,export {}", shortCircuit: true };
  if (specifier.startsWith("@/")) return next(pathToFileURL(join(root, specifier.slice(2))).href, context);
  return next(specifier, context);
}
