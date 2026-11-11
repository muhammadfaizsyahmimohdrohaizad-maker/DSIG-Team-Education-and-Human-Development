// A4. Review card scheduling (FR-LRN-04), wrapping ts-fsrs. Pure.
import { createEmptyCard, fsrs, Rating, type Card, type Grade } from "ts-fsrs";

const scheduler = fsrs();
export const MYT_OFFSET_MIN = 8 * 60;

export type ReviewRating = "again" | "hard" | "good" | "easy";
const RATING: Record<ReviewRating, Grade> = { again: Rating.Again, hard: Rating.Hard, good: Rating.Good, easy: Rating.Easy };

export const newCard = (now: Date): Card => createEmptyCard(now);

export function next(card: Card, rating: ReviewRating, now: Date): Card {
  return scheduler.next(card, now, RATING[rating]).card;
}

/** End of today in Malaysia time (UTC+08:00), as a UTC instant. */
export function endOfTodayMyt(now: Date): Date {
  const local = new Date(now.getTime() + MYT_OFFSET_MIN * 60_000);
  local.setUTCHours(23, 59, 59, 999);
  return new Date(local.getTime() - MYT_OFFSET_MIN * 60_000);
}

export function dueToday<T extends { due: Date }>(cards: readonly T[], now: Date): T[] {
  const end = endOfTodayMyt(now).getTime();
  return cards.filter((c) => c.due.getTime() <= end);
}
