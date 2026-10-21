export type GapInput = { skillId: string; label: string; essential: boolean; rating?: number };

/** Essential skills first, then the lowest self-rating. Unrated skills go last. Ties keep input order. */
export function orderGaps<T extends GapInput>(gaps: T[]): T[] {
  return gaps
    .map((gap, index) => ({ gap, index }))
    .sort((a, b) => {
      if (a.gap.essential !== b.gap.essential) return a.gap.essential ? -1 : 1;
      const ra = a.gap.rating ?? Infinity;
      const rb = b.gap.rating ?? Infinity;
      if (ra !== rb) return ra - rb;
      return a.index - b.index;
    })
    .map((x) => x.gap);
}

/** Recall questions to practise per day for a self-rating from 1 (not confident) to 5. */
export function questionsPerDay(rating: number): number {
  if (rating <= 2) return 3;
  if (rating === 3) return 2;
  return 1;
}

/** One question takes about a minute; the plan is meant to be small. */
export function dailyLoad(ratings: number[]): { questions: number; minutes: number } {
  const questions = ratings.reduce((sum, r) => sum + questionsPerDay(r), 0);
  return { questions, minutes: Math.max(1, questions) };
}
