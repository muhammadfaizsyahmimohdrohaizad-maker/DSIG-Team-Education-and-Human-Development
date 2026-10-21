// The only file in lib/ that reads process.env. Tests pass values in directly.
function readNumber(raw: string | undefined, fallback: number): number {
  const n = raw === undefined || raw === "" ? NaN : Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

/** τ: a skill link counts toward a match only at or above this confidence. */
export const MATCH_CONFIDENCE_THRESHOLD = readNumber(process.env.MATCH_CONFIDENCE_THRESHOLD, 0.6);

/** Share of mastery questions that must be right: 0.8 means 4 of 5. */
export const MASTERY_PASS_MARK = readNumber(process.env.MASTERY_PASS_MARK, 0.8);

/** Version of the privacy notice and consent wording. Stored with every consent record. */
export const NOTICE_VERSION = "draft-2026-10-21";

/** Version of the staff confidentiality undertaking. Stored with every acceptance. */
export const UNDERTAKING_VERSION = "draft-2026-10-21";

/** Effective date printed on every legal page. */
export const LEGAL_EFFECTIVE_DATE = "21 October 2026";

/** Groups smaller than this are never shown on the institution view. */
export const MIN_GROUP = 5;
