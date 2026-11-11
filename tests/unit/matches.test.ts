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

  it("ranks by score, drops zero scores and explains each match", () => {
    const m = rank(profile, new Set(["py", "sql"]), occupations, labels);
    expect(m.map((x) => x.code)).toEqual(["2512", "2513"]);
    expect(m[0]?.score).toBe(2 * 2 + 3 + 2); // two skills, one interest, two skills named in the project
    expect(m[0]?.coverage).toBe(0.5);
    expect(m[0]?.fit).toBe("Strong");
    expect(m[0]?.reasons.some((r) => r.kind === "interest")).toBe(true);
  });

  it("gives job in mind its weight", () => {
    const m = rank({ ...profile, interests: [], projects: [], jobInMind: "2611" }, new Set(), occupations, labels);
    expect(m.map((x) => x.code)).toEqual(["2611"]);
  });
});
