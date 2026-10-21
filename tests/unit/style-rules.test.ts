import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// The visual rules from docs/10-ui-ux-spec.md section 9, check 8. They protect readability and
// keyboard access, so a break shows up as a real problem for a student, not as a process failure.

const ROOT = process.cwd();
const DIRS = ["app", "features", "components", "lib"];

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return files(path);
    return /\.(tsx?|css)$/.test(name) ? [path] : [];
  });
}

const sources = DIRS.flatMap((d) => files(join(ROOT, d))).map((path) => ({
  path: path.slice(ROOT.length + 1),
  text: readFileSync(path, "utf8"),
}));

/** Every "file:line  text" where `pattern` matches and `keep` (if given) accepts the match. */
function hits(pattern: RegExp, keep: (m: RegExpMatchArray) => boolean = () => true): string[] {
  const out: string[] = [];
  for (const { path, text } of sources) {
    text.split("\n").forEach((line, i) => {
      for (const m of line.matchAll(new RegExp(pattern.source, pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`))) {
        if (keep(m)) out.push(`${path}:${i + 1}  ${line.trim().slice(0, 100)}`);
      }
    });
  }
  return out;
}

describe("visual rules", () => {
  it("has no blur and no gradients", () => {
    expect(hits(/backdrop-filter|gradient/i)).toEqual([]);
  });

  it("never removes the focus outline", () => {
    expect(hits(/outline:\s*(none|0)\b/)).toEqual([]);
  });

  it("never disables a submit button", () => {
    const out: string[] = [];
    for (const { path, text } of sources) {
      for (const m of text.matchAll(/<(?:button|Button|SubmitButton)\b[^>]*?\bdisabled\b[^>]*>/g)) {
        if (!/type="button"/.test(m[0])) out.push(`${path}  ${m[0].slice(0, 100)}`);
      }
    }
    expect(out).toEqual([]);
  });

  it("uses no font weight above 600", () => {
    expect(hits(/font-weight:\s*(?:[7-9]\d\d|bold|bolder)\b|fontWeight:\s*[7-9]\d\d\b|\bfont-(?:bold|extrabold|black)\b/)).toEqual([]);
  });

  it("uses no font size below 12px", () => {
    const small = (m: RegExpMatchArray) => {
      const n = Number(m[1]);
      return m[2] === "rem" ? n < 0.75 : n < 12;
    };
    expect(hits(/font-size:\s*(\d*\.?\d+)(px|rem)/, small)).toEqual([]);
    expect(hits(/fontSize:\s*(\d+)\b/, (m) => Number(m[1]) < 12)).toEqual([]);
  });

  it("has breakpoints at 768 and 1280 only", () => {
    const stray = (m: RegExpMatchArray) => ![768, 1280, 767.98, 1279.98].includes(Number(m[1]));
    expect(hits(/@media[^{]*?(?:min|max)-width:\s*(\d*\.?\d+)px/, stray)).toEqual([]);
  });
});
