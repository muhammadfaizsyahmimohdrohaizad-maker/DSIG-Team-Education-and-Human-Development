import { createEmptyCard, fsrs, generatorParameters, Rating, type Card } from "ts-fsrs";

export type RecallRating = "again" | "hard" | "good" | "easy";

const RATINGS = { again: Rating.Again, hard: Rating.Hard, good: Rating.Good, easy: Rating.Easy } as const;

// Fuzz is off so the same answer gives the same date, and short-term steps are off so every
// answer schedules at least a day ahead. The tests and the "Next review" line rely on that.
const scheduler = fsrs(generatorParameters({ enable_fuzz: false, enable_short_term: false }));

export function newCard(now: Date): Card {
  return createEmptyCard(now);
}

export function review(card: Card, rating: RecallRating, now: Date): { card: Card; due: Date } {
  const result = scheduler.next(card, now, RATINGS[rating]);
  return { card: result.card, due: result.card.due };
}
