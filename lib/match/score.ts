import { MATCH_CONFIDENCE_THRESHOLD } from "../config";

export type MatchInput = { essential: string[]; optional: string[] };

export type MatchResult = {
  /** Whole percent, 0 to 100. */
  pct: number;
  coveredEssential: string[];
  coveredOptional: string[];
  gapEssential: string[];
  gapOptional: string[];
  /** Skills the student's modules point at, but below the threshold. Shown, not counted. */
  uncertain: string[];
  essentialTotal: number;
  optionalTotal: number;
};

/**
 * Match = (covered essential x 1 + covered optional x 0.5) / (all essential + 0.5 x all optional).
 * A skill counts only when its best link confidence is at least tau.
 * `confidenceBySkill` holds the best link confidence per skill, taken from ticked modules only.
 */
export function scoreOccupation(
  occupation: MatchInput,
  confidenceBySkill: Record<string, number>,
  tau: number = MATCH_CONFIDENCE_THRESHOLD,
): MatchResult {
  const counts = (id: string) => (confidenceBySkill[id] ?? 0) >= tau;
  const coveredEssential = occupation.essential.filter(counts);
  const coveredOptional = occupation.optional.filter(counts);
  const gapEssential = occupation.essential.filter((id) => !counts(id));
  const gapOptional = occupation.optional.filter((id) => !counts(id));
  const uncertain = [...occupation.essential, ...occupation.optional].filter((id) => {
    const c = confidenceBySkill[id];
    return c !== undefined && c > 0 && c < tau;
  });

  const denominator = occupation.essential.length + 0.5 * occupation.optional.length;
  const numerator = coveredEssential.length + 0.5 * coveredOptional.length;
  const pct = denominator === 0 ? 0 : Math.round((100 * numerator) / denominator);

  return {
    pct,
    coveredEssential,
    coveredOptional,
    gapEssential,
    gapOptional,
    uncertain,
    essentialTotal: occupation.essential.length,
    optionalTotal: occupation.optional.length,
  };
}

/** Best confidence per skill across the links from the modules the student ticked. */
export function bestConfidence(
  links: { skillId: string; moduleId: string; confidence: number }[],
  tickedModuleIds: string[],
): Record<string, number> {
  const ticked = new Set(tickedModuleIds);
  const best: Record<string, number> = {};
  for (const link of links) {
    if (!ticked.has(link.moduleId)) continue;
    best[link.skillId] = Math.max(best[link.skillId] ?? 0, link.confidence);
  }
  return best;
}
