import { describe, expect, it } from "vitest";
import { gap, lessonsLeft, status } from "@/server/engines/skills.ts";
import { checklist, total, type Rubric } from "@/server/engines/feedback.ts";
import { aggregate } from "@/server/engines/cohort.ts";

describe("A2 skill status", () => {
  const shown = new Set(["sql"]);
  it("orders mastered > check needed > learning > have > missing", () => {
    expect(status("git", shown, { skill: "git", claimed: true, lessonsDone: [1], bestCheckScore: 4 })).toBe("mastered");
    expect(status("git", shown, { skill: "git", claimed: true, lessonsDone: [1] })).toBe("check_needed");
    expect(status("git", shown, { skill: "git", claimed: false, lessonsDone: [1] })).toBe("learning");
    expect(status("sql", shown)).toBe("have");
    expect(status("ml", shown)).toBe("missing");
  });
  it("counts lessons left only for missing and learning skills", () => {
    const progress = new Map([["git", { skill: "git", claimed: false, lessonsDone: [1, 2] }]]);
    const rows = gap(["sql", "git", "ml"], shown, progress);
    expect(lessonsLeft(rows, progress)).toBe(2 + 4);
  });
});

describe("A5 checklist", () => {
  const rubric: Rubric = {
    situation: ["project", "task"], action: ["i built", "i wrote"], result: ["result", "so that"],
    keyPoints: [{ point: "join", words: ["join"] }, { point: "index", words: ["index"] }, { point: "key", words: ["primary key"] }],
  };
  it("marks structure, accuracy and evidence", () => {
    const m = checklist("In my final project I built a report. I wrote a join on the primary key so that it ran in 200 ms.", rubric);
    expect(m).toEqual({ structure: 2, accuracy: 2, evidence: 1 });
    expect(total(m)).toBe(5);
  });
  it("gives zero for an empty-looking answer", () => {
    expect(total(checklist("I don't know", rubric))).toBe(0);
  });
});

describe("A6 cohort", () => {
  it("drops groups under 5", () => {
    expect(aggregate([{ group: "AI engineer", count: 7 }, { group: "Lawyer", count: 4 }])).toEqual([{ group: "AI engineer", count: 7 }]);
  });
});
