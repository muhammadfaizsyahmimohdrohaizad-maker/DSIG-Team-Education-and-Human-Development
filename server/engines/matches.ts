import "server-only";
import { getStore } from "../data";
import { bestConfidence, scoreOccupation, type MatchResult } from "@/lib/match/score";
import type { Occupation, Skill, SkillLink } from "@/lib/types";

/** Confidence per skill from the modules the student has ticked. */
async function confidence() {
  const store = getStore();
  const [links, ticked] = await Promise.all([store.getLinks(), store.getTicked()]);
  return { links, ticked, best: bestConfidence(links, ticked) };
}

export type Evidence = { quote: string; moduleName: string };
export type ScoredOccupation = Occupation & {
  match: MatchResult;
  /** Unique quotes from the covered skills, strongest link first. */
  evidence: Evidence[];
  /** Skills whose link is below the threshold: shown, not counted. */
  uncertain: { label: string; confidence: number }[];
};

export async function getMatches(): Promise<ScoredOccupation[]> {
  const store = getStore();
  const [occupations, { links, ticked, best }, { skills }, { modules }] = await Promise.all([
    store.listOccupations(),
    confidence(),
    store.getSkills(),
    store.listModules(),
  ]);
  const label = new Map(skills.map((s) => [s.id, s.escoLabel]));
  const moduleName = new Map(modules.map((m) => [m.id, m.name]));
  const live = links.filter((l) => ticked.includes(l.moduleId));

  return occupations
    .map((o) => {
      const match = scoreOccupation(o, best);
      const seen = new Set<string>();
      const evidence = [...match.coveredEssential, ...match.coveredOptional]
        .map((id) => live.filter((l) => l.skillId === id).sort((a, b) => b.confidence - a.confidence)[0])
        .filter(Boolean)
        .sort((a, b) => b.confidence - a.confidence)
        .filter((l) => (seen.has(l.quote) ? false : (seen.add(l.quote), true)))
        .map((l) => ({ quote: l.quote, moduleName: moduleName.get(l.moduleId) ?? "" }));
      const uncertain = match.uncertain.map((id) => ({ label: label.get(id) ?? id, confidence: best[id] }));
      return { ...o, match, evidence, uncertain };
    })
    .sort((a, b) => b.match.pct - a.match.pct);
}

export type SkillWithEvidence = Skill & { essential: boolean; link?: SkillLink & { moduleName: string } };

export async function getOccupationDetail(code: string) {
  const store = getStore();
  const [occupations, { links, ticked, best }, { skills }, { modules }] = await Promise.all([
    store.listOccupations(),
    confidence(),
    store.getSkills(),
    store.listModules(),
  ]);
  const occupation = occupations.find((o) => o.code === code);
  if (!occupation) return null;

  const match = scoreOccupation(occupation, best);
  const skillById = new Map(skills.map((s) => [s.id, s]));
  const moduleName = new Map(modules.map((m) => [m.id, m.name]));

  const describe = (id: string, essential: boolean): SkillWithEvidence => {
    const skill = skillById.get(id)!;
    const link = links
      .filter((l) => l.skillId === id && ticked.includes(l.moduleId))
      .sort((a, b) => b.confidence - a.confidence)[0];
    return { ...skill, essential, link: link && { ...link, moduleName: moduleName.get(link.moduleId) ?? "" } };
  };

  const covered = [...match.coveredEssential.map((id) => describe(id, true)), ...match.coveredOptional.map((id) => describe(id, false))];
  const gaps = [...match.gapEssential.map((id) => describe(id, true)), ...match.gapOptional.map((id) => describe(id, false))];
  return { occupation, match, covered, gaps };
}

/** Gap skills for the student's target role. Same list the plan, Today and the adviser row use. */
export async function getGapSkills() {
  const store = getStore();
  const student = await store.getStudent();
  if (!student.targetCode) return { targetCode: null, targetTitle: "", gaps: [] as SkillWithEvidence[] };
  const detail = await getOccupationDetail(student.targetCode);
  return {
    targetCode: student.targetCode,
    targetTitle: detail?.occupation.titleEn ?? "",
    gaps: detail?.gaps ?? [],
  };
}

export async function getSkillsMap() {
  const store = getStore();
  const [{ axes, modules }, { skills, groups }, { links, ticked }] = await Promise.all([
    store.listModules(),
    store.getSkills(),
    confidence(),
  ]);
  const skillById = new Map(skills.map((s) => [s.id, s]));
  const moduleName = new Map(modules.map((m) => [m.id, m.name]));
  const found = links
    .filter((l) => ticked.includes(l.moduleId))
    .map((l) => ({ ...l, label: skillById.get(l.skillId)!.escoLabel, group: groups[skillById.get(l.skillId)!.group], moduleName: moduleName.get(l.moduleId) ?? "" }));
  return { axes, modules, ticked, found };
}

/** Target and gap skills for any student, from their modules. Used by the adviser and institution views. */
export async function describeTarget(modules: string[], targetCode: string | null) {
  const store = getStore();
  const [occupations, links, { skills }] = await Promise.all([store.listOccupations(), store.getLinks(), store.getSkills()]);
  const occupation = occupations.find((o) => o.code === targetCode);
  if (!occupation) return { occupation: null, pct: null, gaps: [] as { id: string; label: string; uncertain: boolean }[] };
  const match = scoreOccupation(occupation, bestConfidence(links, modules));
  const label = new Map(skills.map((s) => [s.id, s.escoLabel]));
  const gaps = [...match.gapEssential, ...match.gapOptional].map((id) => ({
    id,
    label: label.get(id) ?? id,
    uncertain: match.uncertain.includes(id),
  }));
  return { occupation, pct: match.pct, gaps };
}
