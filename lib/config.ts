// The only file in lib/ that reads process.env. Tests pass values in directly.
function readNumber(raw: string | undefined, fallback: number): number {
  const n = raw === undefined || raw === "" ? NaN : Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

/** τ: a skill link counts toward a match only at or above this confidence. */
export const MATCH_CONFIDENCE_THRESHOLD = readNumber(process.env.MATCH_CONFIDENCE_THRESHOLD, 0.6);

/** Share of mastery questions that must be right: 0.8 means 4 of 5. */
export const MASTERY_PASS_MARK = readNumber(process.env.MASTERY_PASS_MARK, 0.8);

/** The demo build pretends it is this day, so dates in the video stay the same. */
export const DEMO_TODAY = "2026-10-21";
