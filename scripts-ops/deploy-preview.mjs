#!/usr/bin/env node
// Build-check deploy of any branch to the Vercel project "careerprep", without npm.
// Full procedure: docs/DEPLOY.md, section "Build check without npm".
//
//   node scripts-ops/deploy-preview.mjs [git-ref] [--out payload.json] [--refs] [--inline path,path] [--inline-sha sha,sha]
//
// Reads the files committed at <git-ref> (default HEAD), drops paths matched by .vercelignore and writes
// the request body for Vercel's "create deployment" call (MCP tool create_deployment, or the REST API).
//
//   default       every file inlined as utf-8 (base64 for binary). Large: about 1 KB per source file.
//   --refs        every file sent as {file, sha} only. Vercel keeps files it has seen before by SHA-1,
//                 so after the first full upload a redeploy only needs the changed files inlined.
//                 If Vercel answers "missing_files", rerun with --inline-sha <the listed shas>.
//   --inline a,b  with --refs, inline these paths anyway (the files you just changed).
//
// With VERCEL_TOKEN set, the script also POSTs the body itself and prints the deployment URL.
// No environment variables or secrets are ever sent; the build must pass without them.
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const argv = process.argv.slice(2);
const flag = (name) => argv.includes(name);
const opt = (name) => {
  const i = argv.indexOf(name);
  return i >= 0 ? argv[i + 1] : undefined;
};
const valued = new Set(["--out", "--inline", "--inline-sha"]);
const ref = argv.find((a, i) => !a.startsWith("--") && !valued.has(argv[i - 1])) ?? "HEAD";
const out = opt("--out") ?? "deploy-payload.json";
const refsOnly = flag("--refs");
const forceInline = new Set((opt("--inline") ?? "").split(",").filter(Boolean));
const forceInlineSha = new Set((opt("--inline-sha") ?? "").split(",").filter(Boolean));
const TEAM_ID = process.env.VERCEL_TEAM_ID ?? "team_z4aMgBSXXiw7d6gcQsPa9MPP";

const git = (...a) => execFileSync("git", a, { encoding: "utf8", maxBuffer: 64 << 20 });

// .vercelignore: a path, or a folder ending in "/"; '#' starts a comment. Vercel applies the same file
// to Git deployments, so the build check sees exactly what a Git deploy would.
const ignoreText = existsSync(".vercelignore") ? readFileSync(".vercelignore", "utf8") : "";
const rules = ignoreText.split("\n").map((l) => l.trim()).filter((l) => l && !l.startsWith("#")).map((r) => r.replace(/^\//, ""));
const ignored = (p) => rules.some((r) => (r.endsWith("/") ? p.startsWith(r) : p === r || p.startsWith(`${r}/`)));

const paths = git("ls-tree", "-r", "--name-only", ref).split("\n").filter(Boolean).filter((p) => !ignored(p));
let inlinedBytes = 0;
const files = paths.map((file) => {
  const buf = execFileSync("git", ["show", `${ref}:${file}`], { maxBuffer: 64 << 20 });
  const sha = createHash("sha1").update(buf).digest("hex");
  if (refsOnly && !forceInline.has(file) && !forceInlineSha.has(sha)) return { file, sha, size: buf.length };
  inlinedBytes += buf.length;
  const text = buf.toString("utf8");
  return Buffer.from(text, "utf8").equals(buf)
    ? { file, data: text, encoding: "utf-8" }
    : { file, data: buf.toString("base64"), encoding: "base64" };
});

const branch = ref === "HEAD" ? git("rev-parse", "--abbrev-ref", "HEAD").trim() : ref;
const body = {
  name: "careerprep",
  project: "careerprep",
  // No "target": an omitted target is a preview deployment. Production only ever comes from Git main.
  files,
  projectSettings: {
    framework: "nextjs",
    installCommand: "pnpm install --no-frozen-lockfile", // vercel.json overrides this; kept for the first deploy
    nodeVersion: "22.x",
  },
  meta: { branch, commit: git("rev-parse", "--short", ref).trim() },
};

writeFileSync(out, JSON.stringify(body));
console.log(`${files.length} files from ${ref} (${branch}), ${inlinedBytes} bytes inlined -> ${out}`);

if (process.env.VERCEL_TOKEN) {
  const url = `https://api.vercel.com/v13/deployments?teamId=${TEAM_ID}&skipAutoDetectionConfirmation=1&forceNew=1`;
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.VERCEL_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) {
    const missing = json?.error?.missing;
    if (missing?.length) console.error(`Vercel lacks ${missing.length} files. Rerun with --inline-sha ${missing.join(",")}`);
    else console.error(json);
    process.exit(1);
  }
  console.log(`deployment ${json.id}: https://${json.url} (${json.readyState})`);
}
