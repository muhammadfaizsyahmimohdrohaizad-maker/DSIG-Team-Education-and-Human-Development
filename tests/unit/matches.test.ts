import { describe, expect, it } from "vitest";
import { fitLabel, rank } from "@/server/engines/matches.ts";
import type { Occupation, Profile } from "@/lib/types.ts";

const occ = (code: string, title: string, skills: string[], interests: string[] = []): Occupation =>
  ({ code, titleEn: title, tasks: [], essentialSkills: skills, interestAreas: interests });

const profile: Profile = {
  userId: "u1", isUnder18: false, spmGrades: [], moduleIds: [], skills: [], interests: ["AI"],
  projects: [{ name: "Chatbot", description: "built with python and machine learning" }],
};
const labels = new Map([["py", "python"], ["ml", "machine learning"], ["sql", "SQL"], ["css", "CSS"]]);
const occupations = [
  occ("2512", "AI engineer", ["py", "ml", "sql", "git"], ["AI"]),
  occ("2513", "Web developer", ["css", "sql"]),
  occ("2611", "Lawyer", ["law"]),
];

describe("A1 match ranking", () => {
  it("labels fit from coverage, not rank", () => {
    expect(fitLabel(0.5)).toBe("Strong");
    expect(fitLabel(0.25)).toBe("Good");
    expect(fitLabel(0.2)).toBe("Some");
  });

  it("weights available components, explains missing skills and suppresses scores without skills", () => {
    const candidate = occupations[0]!;
    const withoutInterest = { ...profile, interests: [] };
    expect(rank(profile, new Set(), occupations, labels)).toEqual([]);
    const half = rank(withoutInterest, new Set(["py","sql"]), [candidate], labels)[0]!;
    expect(half.score).toBe(0.5);
    expect(half.missingEssential).toEqual(["machine learning","git"]);
    const weighted = rank(withoutInterest, new Set(["py","sql","git","extra"]), [{...candidate, optionalSkills:["extra","other"]}], labels)[0]!;
    expect(weighted.score * 100).toBeCloseTo(69.44, 2);
    expect(rank(profile, new Set(["py","sql"]), [candidate], labels)[0]?.score).toBeCloseTo(45/80);
  });

  it("counts zero overlap, deduplicates skills and breaks ties by code", () => {
    const tied = [occ("2","A",["py","py"]),occ("1","Z",["py"])];
    const result = rank(profile,new Set(["sql"]),tied,labels);
    expect(result.map(match=>match.code)).toEqual(["1","2"]);
    expect(result[1]?.missingEssential).toEqual(["python"]);
    expect(result[0]?.score).toBe(0);
  });
});
