import "server-only";
// A1 with its reference data: builds the skill set S and ranks the occupations. No AI.
import type { MatchView, Profile } from "@/lib/types";
import { rank, skillSet } from "@/server/engines/matches";
import { getModules, getOccupations, getSkills, getSpmLinks } from "@/server/data/reference";

export async function shownSkills(profile: Pick<Profile, "skills" | "moduleIds" | "spmGrades">): Promise<Set<string>> {
  const [modules, spm] = await Promise.all([getModules(), getSpmLinks()]);
  return skillSet(profile, new Map(modules.map((m) => [m.id, m.skills])), spm);
}

export async function computeMatches(profile: Profile): Promise<MatchView[]> {
  const [occupations, skills, shown] = await Promise.all([getOccupations(), getSkills(), shownSkills(profile)]);
  const labels = new Map([...skills].map(([uri, s]) => [uri, s.label]));
  const terms = new Map([...skills].map(([uri, s]) => [uri, s.altLabels]));
  const byCode = new Map(occupations.map((o) => [o.code, o]));
  return rank(profile, shown, occupations, labels, terms).map((m) => {
    const o = byCode.get(m.code)!;
    return { ...m, title: o.titleEn, titleMs: o.titleMs, tasks: o.tasks, sourceUrl: o.sourceUrl };
  });
}
