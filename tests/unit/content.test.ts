import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { buildPayload, stableUuid, type RawReference } from "@/scripts/reference-payload.ts";
import type { LessonFile } from "@/content/lessons/types.ts";

const root = join(__dirname, "..", "..");
const read = <T>(rel: string): T => JSON.parse(readFileSync(join(root, rel), "utf8")) as T;
const raw: RawReference = {
  source: read("content/reference/source.json"),
  interestAreas: read("content/reference/interest-areas.json"),
  skills: read("content/reference/skills.json"),
  occupations: read("content/reference/occupations.json"),
  spm: read("content/reference/spm-subjects.json"),
  modules: read("content/reference/gmi-modules.json"),
  studyOptions: read("content/reference/study-options.json"),
  lessons: readdirSync(join(root, "content/lessons")).filter((f) => f.endsWith(".json")).map((f) => read<LessonFile>(`content/lessons/${f}`)),
};

describe("reference and lesson content", () => {
  it("has no problems", () => {
    expect(buildPayload(raw).problems).toEqual([]);
  });

  it("includes the four jobs the persona flow needs", () => {
    const titles = raw.occupations.map((o) => o.title_en);
    expect(titles).toEqual(expect.arrayContaining(["AI engineer", "Software developer", "Data analyst", "Web developer"]));
  });

  it("has lessons for every AI engineer gap skill on the Skill gap board", () => {
    const have = new Set(raw.lessons.map((l) => l.skill));
    for (const k of ["git", "machine-learning", "model-evaluation", "deep-learning", "model-deployment"]) expect(have.has(k)).toBe(true);
  });

  it("keeps ids stable between imports", () => {
    expect(stableUuid("lesson:git:1")).toBe(stableUuid("lesson:git:1"));
    expect(stableUuid("lesson:git:1")).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });
});
