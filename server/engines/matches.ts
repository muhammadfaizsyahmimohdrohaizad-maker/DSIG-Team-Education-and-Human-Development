// A1. Match ranking (FR-MAT-01, FR-MAT-02, NFR-02). Pure: no AI, no trained model, no I/O.
import type { Fit, Match, Occupation, Profile, Reason } from "../../lib/types.ts";

export const WEIGHTS = { essential: 70, optional: 20, interest: 10 } as const;
export const FIT_THRESHOLDS = { strong: 0.5, good: 0.25 } as const; // starting values, check in the pilot
export const TOP_N = 5;

export function fitLabel(coverage: number): Fit {
  if (coverage >= FIT_THRESHOLDS.strong) return "Strong";
  if (coverage >= FIT_THRESHOLDS.good) return "Good";
  return "Some";
}

/** Only available evidence components participate in the denominator. */
export function rank(
  profile: Profile,
  shownSkills: ReadonlySet<string>,
  occupations: readonly Occupation[],
  skillLabels: ReadonlyMap<string, string>,
): Match[] {
  if (!shownSkills.size) return [];
  const interests = new Set(profile.interests);
  const matches: Match[] = [];
  for (const occupation of occupations) {
    const essential = [...new Set(occupation.essentialSkills)];
    const optional = [...new Set(occupation.optionalSkills)].filter(skill => !essential.includes(skill));
    if (!essential.length && !optional.length) continue;
    const areas = [...new Set(occupation.interestAreas)];
    const present = essential.filter(skill => shownSkills.has(skill));
    const extra = optional.filter(skill => shownSkills.has(skill));
    const shared = areas.filter(area => interests.has(area));
    const coverage = essential.length ? present.length / essential.length : 0;
    let weighted = coverage * WEIGHTS.essential;
    let weight = essential.length ? WEIGHTS.essential : 0;
    if (optional.length) {
      weighted += WEIGHTS.optional * extra.length / optional.length;
      weight += WEIGHTS.optional;
    }
    if (areas.length && interests.size) {
      weighted += WEIGHTS.interest * shared.length / areas.length;
      weight += WEIGHTS.interest;
    }
    const reasons: Reason[] = [...present, ...extra].map(skill => ({
      kind: "skill", text: "You show " + (skillLabels.get(skill) ?? skill), source: skill,
    }));
    for (const area of shared) reasons.push({kind: "interest", text: "You are interested in " + area, source: occupation.code});
    matches.push({ code: occupation.code, score: weighted / weight, coverage, fit: fitLabel(coverage), reasons,
      missingEssential: essential.filter(skill => !shownSkills.has(skill)).map(skill => skillLabels.get(skill) ?? skill) });
  }
  return matches.sort((a,b) => b.score - a.score || b.coverage - a.coverage || a.code.localeCompare(b.code)).slice(0, TOP_N);
}

// ---- A1 step 1: the student's skill set S ----

/** SPM grades from best to worst. */
export const SPM_GRADES = ["A+", "A", "A-", "B+", "B", "C+", "C", "D", "E", "G"] as const;

/** True when grade is minGrade or better. Unknown grades never count. */
export function gradeAtLeast(grade: string, minGrade: string): boolean {
  const g = SPM_GRADES.indexOf(grade.trim().toUpperCase() as (typeof SPM_GRADES)[number]);
  const m = SPM_GRADES.indexOf(minGrade as (typeof SPM_GRADES)[number]);
  return g >= 0 && m >= 0 && g <= m;
}

export type SpmLink = { uri: string; minGrade: string };

/**
 * S = skills the student added, plus skills linked to modules they passed, plus skills linked to
 * SPM subjects at the linked minimum grade (C) or better.
 */
export function skillSet(
  profile: Pick<Profile, "skills" | "moduleIds" | "spmGrades">,
  moduleSkills: ReadonlyMap<string, readonly string[]>,
  spmSkills: ReadonlyMap<string, readonly SpmLink[]>,
): Set<string> {
  const s = new Set(profile.skills);
  for (const m of profile.moduleIds) for (const uri of moduleSkills.get(m) ?? []) s.add(uri);
  for (const { subject, grade } of profile.spmGrades) {
    for (const link of spmSkills.get(subject) ?? []) if (gradeAtLeast(grade, link.minGrade)) s.add(link.uri);
  }
  return s;
}
