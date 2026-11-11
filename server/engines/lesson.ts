// A3. Mastery check marking and retake rule (FR-LRN-02, FR-LRN-03). Pure. Never calls AI.

export const QUESTIONS = 5;
export const PASS_MARK = 4;

export type CheckQuestion = { id: string; lessonNo: number; answerKey: string };
export type CheckResult = {
  score: number;
  passed: boolean;
  missed: string[];          // question ids to go over
  retakeAfterLesson?: number; // set only on a fail
};

export function markCheck(answers: readonly string[], questions: readonly CheckQuestion[]): CheckResult {
  if (questions.length !== QUESTIONS || answers.length !== QUESTIONS) {
    throw new Error(`A mastery check has exactly ${QUESTIONS} questions`);
  }
  const missedQs = questions.filter((q, i) => normalise(answers[i] ?? "") !== normalise(q.answerKey));
  const score = QUESTIONS - missedQs.length;
  const passed = score >= PASS_MARK;
  return {
    score,
    passed,
    missed: missedQs.map((q) => q.id),
    retakeAfterLesson: passed ? undefined : lessonBehindMostMisses(missedQs),
  };
}

/** The lesson behind most missed questions; the lower number wins a tie. */
export function lessonBehindMostMisses(missed: readonly CheckQuestion[]): number {
  const counts = new Map<number, number>();
  for (const q of missed) counts.set(q.lessonNo, (counts.get(q.lessonNo) ?? 0) + 1);
  let best = 1, bestCount = -1;
  for (const [lesson, n] of [...counts].sort((a, b) => a[0] - b[0])) {
    if (n > bestCount) { best = lesson; bestCount = n; }
  }
  return best;
}

/** A retake opens only when lesson N was marked done after the failed check. */
export function canRetake(failedAt: Date | undefined, retakeAfterLesson: number | undefined, lessonDoneAt: ReadonlyMap<number, Date>): boolean {
  if (!failedAt || retakeAfterLesson === undefined) return true;
  const done = lessonDoneAt.get(retakeAfterLesson);
  return !!done && done.getTime() > failedAt.getTime();
}

function normalise(s: string): string {
  return s.trim().toLowerCase();
}

export type CheckGate = { open: true } | { open: false; finishLesson: number; reason: "retake" | "lessons" };

/**
 * When the 5-question check may be opened (FR-LRN-02, FR-LRN-03):
 * - after a failed check, only once the lesson behind most misses is marked done again;
 * - the first time, after all four lessons, or straight away for a skill the student claimed.
 */
export function checkGate(p: {
  claimed: boolean;
  lessonsDone: readonly number[];
  lessonDoneAt: ReadonlyMap<number, Date>;
  latestCheck?: { score: number; retakeAfterLesson?: number; takenAt: Date };
}): CheckGate {
  const c = p.latestCheck;
  if (c && c.score < PASS_MARK && c.retakeAfterLesson !== undefined && !canRetake(c.takenAt, c.retakeAfterLesson, p.lessonDoneAt)) {
    return { open: false, finishLesson: c.retakeAfterLesson, reason: "retake" };
  }
  if (!c && !p.claimed) {
    const missing = [1, 2, 3, 4].find((n) => !p.lessonsDone.includes(n));
    if (missing !== undefined) return { open: false, finishLesson: missing, reason: "lessons" };
  }
  return { open: true };
}
