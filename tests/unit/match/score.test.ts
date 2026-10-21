import { describe, expect, it } from "vitest";
import { bestConfidence, scoreOccupation } from "@/lib/match/score";

const essential = ["a", "b", "c", "d", "e", "f", "g", "h", "i"];
const optional = ["o1", "o2"];

describe("scoreOccupation", () => {
  it("gives 70% for 6 of 9 essential and 2 of 2 optional", () => {
    const conf = { a: 0.9, b: 0.9, c: 0.9, d: 0.9, e: 0.9, f: 0.9, o1: 0.8, o2: 0.8 };
    const r = scoreOccupation({ essential, optional }, conf, 0.6);
    expect(r.pct).toBe(70); // (6 + 1) / (9 + 1)
    expect(r.gapEssential).toEqual(["g", "h", "i"]);
  });

  it("does not count a link below tau, but lists it as uncertain", () => {
    const r = scoreOccupation({ essential: ["a", "b"], optional: [] }, { a: 0.9, b: 0.52 }, 0.6);
    expect(r.coveredEssential).toEqual(["a"]);
    expect(r.uncertain).toEqual(["b"]);
    expect(r.pct).toBe(50);
  });

  it("counts a link exactly at tau", () => {
    const r = scoreOccupation({ essential: ["a"], optional: [] }, { a: 0.6 }, 0.6);
    expect(r.pct).toBe(100);
  });

  it("returns 0 for an occupation with no skills", () => {
    expect(scoreOccupation({ essential: [], optional: [] }, {}, 0.6).pct).toBe(0);
  });

  it("weights optional skills at half", () => {
    const r = scoreOccupation({ essential: ["a"], optional: ["o"] }, { o: 0.9 }, 0.6);
    expect(r.pct).toBe(33); // 0.5 / 1.5
  });
});

describe("bestConfidence", () => {
  const links = [
    { skillId: "s", moduleId: "m1", confidence: 0.5 },
    { skillId: "s", moduleId: "m2", confidence: 0.8 },
    { skillId: "t", moduleId: "m3", confidence: 0.9 },
  ];
  it("takes the best link from ticked modules only", () => {
    expect(bestConfidence(links, ["m1", "m2"])).toEqual({ s: 0.8 });
    expect(bestConfidence(links, ["m1"])).toEqual({ s: 0.5 });
    expect(bestConfidence(links, [])).toEqual({});
  });
});
