import { describe, expect, it } from "vitest";
import { markMastery } from "@/lib/mastery/mark";

const qs = [0, 1, 2, 3, 0].map((key, i) => ({ id: `q${i}`, text: `Q${i}`, options: ["a", "b", "c", "d"], key }));

describe("markMastery", () => {
  it("passes at 4 of 5", () => {
    const r = markMastery(qs, [0, 1, 2, 3, 3], 0.8);
    expect(r.score).toBe(4);
    expect(r.passed).toBe(true);
  });

  it("fails at 3 of 5", () => {
    const r = markMastery(qs, [0, 1, 2, 0, 3], 0.8);
    expect(r.score).toBe(3);
    expect(r.passed).toBe(false);
  });

  it("treats a missing answer as wrong and says so", () => {
    const r = markMastery(qs, [0, 1, 2, 3], 0.8);
    expect(r.rows[4]).toMatchObject({ mine: "No answer", correct: false, key: "a" });
  });

  it("never passes an empty check", () => {
    expect(markMastery([], [], 0.8).passed).toBe(false);
  });
});
