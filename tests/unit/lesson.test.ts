import { describe, expect, it } from "vitest";
import { canRetake, lessonBehindMostMisses, markCheck, type CheckQuestion } from "@/server/engines/lesson.ts";

const qs: CheckQuestion[] = [1, 1, 2, 3, 4].map((lessonNo, i) => ({ id: `q${i}`, lessonNo, answerKey: "a" }));

describe("A3 mastery check", () => {
  it("passes at 4 of 5", () => {
    const r = markCheck(["a", "a", "a", "a", "x"], qs);
    expect(r).toMatchObject({ score: 4, passed: true, retakeAfterLesson: undefined });
  });

  it("on a fail, points to the lesson behind most missed questions", () => {
    const r = markCheck(["x", "x", "a", "x", "a"], qs);
    expect(r.passed).toBe(false);
    expect(r.retakeAfterLesson).toBe(1);
  });

  it("breaks ties with the lower lesson", () => {
    expect(lessonBehindMostMisses([qs[2]!, qs[3]!])).toBe(2);
  });

  it("opens a retake only after lesson N is done again", () => {
    const failed = new Date("2026-11-10T10:00:00Z");
    expect(canRetake(failed, 2, new Map([[2, new Date("2026-11-09T10:00:00Z")]]))).toBe(false);
    expect(canRetake(failed, 2, new Map([[2, new Date("2026-11-10T11:00:00Z")]]))).toBe(true);
    expect(canRetake(undefined, undefined, new Map())).toBe(true);
  });

  it("refuses a check that is not 5 questions", () => {
    expect(() => markCheck(["a"], qs.slice(0, 1))).toThrow();
  });
});
