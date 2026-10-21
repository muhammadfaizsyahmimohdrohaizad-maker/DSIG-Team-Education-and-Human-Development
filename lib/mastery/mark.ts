import { MASTERY_PASS_MARK } from "../config";
import type { MasteryQuestion } from "../types";

export type MasteryRow = { n: number; question: string; mine: string; key: string; correct: boolean };
export type MasteryResult = { score: number; total: number; passed: boolean; rows: MasteryRow[] };

/**
 * Marks a mastery check against the answer key. No network, no LLM.
 * `picks[i]` is the option index chosen for question i, or undefined for no answer.
 */
export function markMastery(
  questions: MasteryQuestion[],
  picks: (number | undefined)[],
  passMark: number = MASTERY_PASS_MARK,
): MasteryResult {
  const rows = questions.map((q, i) => {
    const pick = picks[i];
    return {
      n: i + 1,
      question: q.text,
      mine: pick === undefined ? "No answer" : (q.options[pick] ?? "No answer"),
      key: q.options[q.key] ?? "",
      correct: pick === q.key,
    };
  });
  const score = rows.filter((r) => r.correct).length;
  const total = questions.length;
  // Ceil with a small epsilon so 0.8 x 5 is 4 and not 4.000000001.
  const needed = Math.ceil(total * passMark - 1e-9);
  return { score, total, passed: total > 0 && score >= needed, rows };
}
