// A5. Checklist marking for mock interview answers (FR-INT-03, FR-INT-04). Pure.
// The checklist runs first and its marks are final; AI feedback never changes them.
import type { Marks } from "../../lib/types.ts";

export type Rubric = {
  situation: string[];   // words that show the situation or task is named
  action: string[];
  result: string[];
  keyPoints: { point: string; words: string[] }[];
};

const NUMBER = /\b\d+(\.\d+)?\s*(%|percent|users|students|ms|seconds|hours|days|weeks)?\b/i;

export function checklist(answer: string, rubric: Rubric, studentProjects: readonly string[] = [], tools: readonly string[] = []): Marks {
  const text = answer.toLowerCase();
  const has = (words: readonly string[]) => words.some((w) => text.includes(w.toLowerCase()));

  const structure = ((has(rubric.situation) ? 1 : 0) + (has(rubric.action) && has(rubric.result) ? 1 : 0)) as Marks["structure"];

  const found = rubric.keyPoints.filter((k) => has(k.words)).length;
  const share = rubric.keyPoints.length ? found / rubric.keyPoints.length : 0;
  const accuracy = (share >= 2 / 3 ? 2 : share >= 1 / 3 ? 1 : 0) as Marks["accuracy"];

  const evidence = (NUMBER.test(answer) || has(studentProjects) || has(tools) ? 1 : 0) as Marks["evidence"];

  return { structure, accuracy, evidence };
}

export const total = (m: Marks) => m.structure + m.accuracy + m.evidence;
