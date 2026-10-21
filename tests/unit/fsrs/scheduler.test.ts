import { describe, expect, it } from "vitest";
import { newCard, review } from "@/lib/fsrs/scheduler";

const now = new Date("2026-10-21T02:00:00Z");

describe("review", () => {
  it("schedules a good answer after an again answer", () => {
    const good = review(newCard(now), "good", now).due.getTime();
    const again = review(newCard(now), "again", now).due.getTime();
    expect(good).toBeGreaterThan(again);
  });

  it("is deterministic for the same answer", () => {
    const a = review(newCard(now), "good", now).due.getTime();
    const b = review(newCard(now), "good", now).due.getTime();
    expect(a).toBe(b);
  });

  it("never schedules in the past", () => {
    for (const r of ["again", "hard", "good", "easy"] as const) {
      expect(review(newCard(now), r, now).due.getTime()).toBeGreaterThanOrEqual(now.getTime());
    }
  });
});
