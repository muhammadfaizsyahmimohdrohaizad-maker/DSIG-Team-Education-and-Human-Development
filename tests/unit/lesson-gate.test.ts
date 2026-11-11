import { describe, expect, it } from "vitest";
import { checkGate } from "@/server/engines/lesson.ts";

const at = (iso: string) => new Date(iso);

describe("A3 check gate", () => {
  it("opens after all four lessons", () => {
    expect(checkGate({ claimed: false, lessonsDone: [1, 2, 3], lessonDoneAt: new Map() })).toEqual({ open: false, finishLesson: 4, reason: "lessons" });
    expect(checkGate({ claimed: false, lessonsDone: [1, 2, 3, 4], lessonDoneAt: new Map() })).toEqual({ open: true });
  });

  it("opens straight away for a claimed skill", () => {
    expect(checkGate({ claimed: true, lessonsDone: [], lessonDoneAt: new Map() })).toEqual({ open: true });
  });

  it("after a fail, waits for lesson N to be done again", () => {
    const failed = { score: 2, retakeAfterLesson: 3, takenAt: at("2026-11-10T10:00:00Z") };
    const before = new Map([[3, at("2026-11-09T10:00:00Z")]]);
    const after = new Map([[3, at("2026-11-10T12:00:00Z")]]);
    expect(checkGate({ claimed: false, lessonsDone: [1, 2, 3, 4], lessonDoneAt: before, latestCheck: failed })).toEqual({ open: false, finishLesson: 3, reason: "retake" });
    expect(checkGate({ claimed: false, lessonsDone: [1, 2, 3, 4], lessonDoneAt: after, latestCheck: failed })).toEqual({ open: true });
  });
});
