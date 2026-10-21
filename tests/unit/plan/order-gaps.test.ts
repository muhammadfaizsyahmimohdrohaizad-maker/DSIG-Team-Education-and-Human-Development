import { describe, expect, it } from "vitest";
import { dailyLoad, orderGaps, questionsPerDay } from "@/lib/plan/order-gaps";

describe("orderGaps", () => {
  it("puts essential first, then the lowest rating", () => {
    const out = orderGaps([
      { skillId: "a", label: "a", essential: false, rating: 1 },
      { skillId: "b", label: "b", essential: true, rating: 4 },
      { skillId: "c", label: "c", essential: true, rating: 2 },
    ]);
    expect(out.map((g) => g.skillId)).toEqual(["c", "b", "a"]);
  });

  it("puts unrated skills last and keeps input order on ties", () => {
    const out = orderGaps([
      { skillId: "a", label: "a", essential: true },
      { skillId: "b", label: "b", essential: true, rating: 3 },
      { skillId: "c", label: "c", essential: true, rating: 3 },
    ]);
    expect(out.map((g) => g.skillId)).toEqual(["b", "c", "a"]);
  });
});

describe("daily load", () => {
  it("gives weaker skills more questions", () => {
    expect([1, 2, 3, 4, 5].map(questionsPerDay)).toEqual([3, 3, 2, 1, 1]);
  });
  it("adds up the plan", () => {
    expect(dailyLoad([2, 3, 4])).toEqual({ questions: 6, minutes: 6 });
  });
});
