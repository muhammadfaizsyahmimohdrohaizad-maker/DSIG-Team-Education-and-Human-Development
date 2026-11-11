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
 */
export function rank(
  profile: Profile,
  shownSkills: ReadonlySet<string>,
  occupations: readonly Occupation[],
  skillLabels: ReadonlyMap<string, string>,
): Match[] {
  const projectText = profile.projects.map((p) => `${p.name} ${p.description ?? ""}`.toLowerCase()).join(" ");
  const interests = new Set(profile.interests);

  const scored = occupations.map((o): Match => {
    const reasons: Reason[] = [];
    const shown = o.essentialSkills.filter((s) => shownSkills.has(s));
    const sharedInterests = o.interestAreas.filter((i) => interests.has(i));
    const inProjects = o.essentialSkills.filter((s) => {
      const label = skillLabels.get(s)?.toLowerCase();
      return !!label && projectText.includes(label);
    });
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
