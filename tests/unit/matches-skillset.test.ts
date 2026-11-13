import { describe, expect, it } from "vitest";
import { gradeAtLeast, skillSet } from "@/server/engines/matches.ts";

describe("A1 skill set S", () => {
  it("counts SPM grades of C or better only", () => {
    expect(gradeAtLeast("A+", "C")).toBe(true);
    expect(gradeAtLeast("c", "C")).toBe(true);
    expect(gradeAtLeast("D", "C")).toBe(false);
    expect(gradeAtLeast("Z", "C")).toBe(false);
  });

  it("joins added skills, passed modules and SPM subjects", () => {
    const s = skillSet(
      { skills: ["py"], moduleIds: ["web"], spmGrades: [{ subject: "Mathematics", grade: "B" }, { subject: "Physics", grade: "E" }] },
      new Map([["web", ["html", "js"]]]),
      new Map([["Mathematics", [{ uri: "stats", minGrade: "C" }]], ["Physics", [{ uri: "elec", minGrade: "C" }]]]),
    );
    expect([...s].sort()).toEqual(["html", "js", "py", "stats"]);
  });
});

