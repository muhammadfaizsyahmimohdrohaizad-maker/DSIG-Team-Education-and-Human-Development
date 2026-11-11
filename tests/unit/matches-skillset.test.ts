import { describe, expect, it } from "vitest";
import { gradeAtLeast, namesTerm, rank, skillSet } from "@/server/engines/matches.ts";
import type { Occupation, Profile } from "@/lib/types.ts";

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

describe("A1 project matching", () => {
  it("matches whole words only", () => {
    expect(namesTerm("a javascript quiz app", "java")).toBe(false);
    expect(namesTerm("python chatbot", "python")).toBe(true);
    expect(namesTerm("robot arm in c++.", "c++")).toBe(true);
  });

  it("uses alternative labels for project matches", () => {
    const occ: Occupation[] = [{ code: "2519-03", titleEn: "AI engineer", tasks: [], essentialSkills: ["py"], interestAreas: [] }];
    const profile: Profile = { userId: "u", isUnder18: false, spmGrades: [], moduleIds: [], skills: [], interests: [],
      projects: [{ name: "Class FAQ chatbot", description: "Python chatbot that answers questions" }] };
    const labels = new Map([["py", "Programming in Python"]]);
    expect(rank(profile, new Set(), occ, labels)).toEqual([]);
    const m = rank(profile, new Set(), occ, labels, new Map([["py", ["Python"]]]));
    expect(m[0]?.score).toBe(1);
    expect(m[0]?.reasons[0]).toMatchObject({ kind: "project", text: "Your project uses Programming in Python" });
  });
});
