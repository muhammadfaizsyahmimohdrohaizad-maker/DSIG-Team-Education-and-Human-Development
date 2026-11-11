// A5. Checklist marking for mock interview answers (FR-INT-03, FR-INT-04). Pure.
// The checklist runs first and its marks are final; AI feedback never changes them.
import type { Marks } from "../../lib/types.ts";

export type Rubric = {
  situation: string[];   // words that show the situation or task is named
  action: string[];
  result: string[];
  keyPoints: { point: string; words: string[] }[];
  /** Words that show an example from the student's own work ("my project", "internship"). Optional. */
  evidence?: string[];
};

const NUMBER = /\b\d+(\.\d+)?\s*(%|percent|users|students|ms|seconds|hours|days|weeks)?\b/i;

export function checklist(answer: string, rubric: Rubric, studentProjects: readonly string[] = [], tools: readonly string[] = []): Marks {
  const text = answer.toLowerCase();
  const has = (words: readonly string[]) => words.some((w) => w.trim() !== "" && text.includes(w.toLowerCase()));

  const structure = ((has(rubric.situation) ? 1 : 0) + (has(rubric.action) && has(rubric.result) ? 1 : 0)) as Marks["structure"];

  const found = rubric.keyPoints.filter((k) => has(k.words)).length;
  const share = rubric.keyPoints.length ? found / rubric.keyPoints.length : 0;
  const accuracy = (share >= 2 / 3 ? 2 : share >= 1 / 3 ? 1 : 0) as Marks["accuracy"];

  const evidence = (NUMBER.test(answer) || has(studentProjects) || has(tools) || has(rubric.evidence ?? []) ? 1 : 0) as Marks["evidence"];

  return { structure, accuracy, evidence };
}

export const total = (m: Marks) => m.structure + m.accuracy + m.evidence;

export const SKIPPED: Marks = { structure: 0, accuracy: 0, evidence: 0 };

export type Explained = {
  headline: string;
  criteria: { name: "Structure" | "Accuracy" | "Evidence"; mark: number; max: number; note: string }[];
  /** Key points the answer did not cover, in the rubric's words. Shown to the student and given to the AI. */
  missingPoints: string[];
  /** Structure parts not found: "the situation", "what you did", "the result". */
  missingParts: string[];
  tip: string;
};

/** Plain-language notes for the checklist marks (Mock interview feedback screen). No AI. */
export function explain(answer: string, rubric: Rubric, marks: Marks, skipped = false): Explained {
  const text = answer.toLowerCase();
  const has = (words: readonly string[]) => words.some((w) => w.trim() !== "" && text.includes(w.toLowerCase()));
  const missingPoints = skipped ? rubric.keyPoints.map((k) => k.point) : rubric.keyPoints.filter((k) => !has(k.words)).map((k) => k.point);
  const missingParts = skipped
    ? ["the situation", "what you did", "the result"]
    : [
        !has(rubric.situation) && "the situation",
        !has(rubric.action) && "what you did",
        !has(rubric.result) && "the result",
      ].filter((p): p is string => typeof p === "string");
  const t = total(marks);

  const headline = skipped ? "Skipped" : t >= 4 ? "Strong answer" : t >= 3 ? "Good, with one gap" : t >= 1 ? "A start. Build it out." : "Not there yet";

  const structureNote = marks.structure === 2
    ? "Clear situation, what you did and how it turned out."
    : `Missing ${listJoin(missingParts)}.`;
  const accuracyNote = marks.accuracy === 2 && missingPoints.length === 0
    ? "Covers the key points."
    : missingPoints.length
      ? `Not covered: ${listJoin(missingPoints)}.`
      : "Covers the key points.";
  const evidenceNote = marks.evidence ? "Uses an example from your own work." : "No example from your own work or a number to show it.";

  let tip: string;
  if (skipped) tip = "Have a go next time, even a short answer. You can practise this question again from the start screen.";
  else if (marks.structure < 2) tip = `Give a fuller answer: say ${listJoin(missingParts)}. Aim for four or five sentences.`;
  else if (missingPoints.length) tip = `Add ${missingPoints[0]}. That is what the interviewer is listening for.`;
  else if (!marks.evidence) tip = "Add one real example from your own project or class, with a number if you have one.";
  else tip = "Keep the example, and say what changed because of what you did.";

  return {
    headline,
    criteria: [
      { name: "Structure", mark: marks.structure, max: 2, note: skipped ? "Skipped." : structureNote },
      { name: "Accuracy", mark: marks.accuracy, max: 2, note: skipped ? "Skipped." : accuracyNote },
      { name: "Evidence", mark: marks.evidence, max: 1, note: skipped ? "Skipped." : evidenceNote },
    ],
    missingPoints,
    missingParts,
    tip,
  };
}

function listJoin(items: readonly string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}
