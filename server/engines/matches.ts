// A1. Match ranking (FR-MAT-01, FR-MAT-02, NFR-02). Pure: no AI, no trained model, no I/O.
import type { Fit, Match, Occupation, Profile, Reason } from "../../lib/types.ts";

export const WEIGHTS = { skill: 2, interest: 3, project: 1, jobInMind: 2 } as const;
export const FIT_THRESHOLDS = { strong: 0.5, good: 0.25 } as const; // starting values, check in the pilot
export const TOP_N = 5;

export function fitLabel(coverage: number): Fit {
  if (coverage >= FIT_THRESHOLDS.strong) return "Strong";
  if (coverage >= FIT_THRESHOLDS.good) return "Good";
  return "Some";
}

/**
 * @param shownSkills the student's skill set S: added skills plus skills linked to passed modules
 *        and SPM subjects (resolved by the caller from reference data).
 * @param skillLabels ESCO URI -> label, used to find skills named in project descriptions and to write reasons.
 * @param projectTerms optional ESCO URI -> other names for the skill (alternative labels such as "Python" for
 *        "Programming in Python"). A skill counts as named in a project when its label or any of these terms
 *        appears as a whole word.
 */
export function rank(
  profile: Profile,
  shownSkills: ReadonlySet<string>,
  occupations: readonly Occupation[],
  skillLabels: ReadonlyMap<string, string>,
  projectTerms: ReadonlyMap<string, readonly string[]> = new Map(),
): Match[] {
  const projectText = profile.projects.map((p) => `${p.name} ${p.description ?? ""}`.toLowerCase()).join(" ");
  const named = (skill: string): boolean => {
    const terms = [skillLabels.get(skill), ...(projectTerms.get(skill) ?? [])];
    return terms.some((t) => !!t && namesTerm(projectText, t.toLowerCase()));
  };
  const interests = new Set(profile.interests);

  const scored = occupations.map((o): Match => {
    const reasons: Reason[] = [];
    const shown = o.essentialSkills.filter((s) => shownSkills.has(s));
    const sharedInterests = o.interestAreas.filter((i) => interests.has(i));
    const inProjects = o.essentialSkills.filter(named);
    const jobInMind = profile.jobInMind === o.code ? 1 : 0;

    for (const i of sharedInterests) reasons.push({ kind: "interest", text: `You're interested in ${i}`, source: `MASCO ${o.code}` });
    for (const s of shown) reasons.push({ kind: "skill", text: `You show ${skillLabels.get(s) ?? s}`, source: `ESCO ${s}` });
    for (const s of inProjects) reasons.push({ kind: "project", text: `Your project uses ${skillLabels.get(s) ?? s}`, source: `ESCO ${s}` });
    if (jobInMind) reasons.push({ kind: "job_in_mind", text: "This is the job you had in mind", source: `MASCO ${o.code}` });

    const score =
      WEIGHTS.skill * shown.length +
      WEIGHTS.interest * sharedInterests.length +
      WEIGHTS.project * inProjects.length +
      WEIGHTS.jobInMind * jobInMind;
    const coverage = o.essentialSkills.length ? shown.length / o.essentialSkills.length : 0;
    return { code: o.code, score, coverage, fit: fitLabel(coverage), reasons };
  });

  const titles = new Map(occupations.map((o) => [o.code, o.titleEn]));
  return scored
    .filter((m) => m.score > 0)
    .sort((a, b) => b.score - a.score || b.coverage - a.coverage || (titles.get(a.code) ?? "").localeCompare(titles.get(b.code) ?? ""))
    .slice(0, TOP_N);
}

/** True when term appears in text as a whole word ("java" does not match "javascript"; "c++" works). */
export function namesTerm(text: string, term: string): boolean {
  if (term.length < 2) return false;
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-z0-9+#])${escaped}($|[^a-z0-9+#])`).test(text);
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
