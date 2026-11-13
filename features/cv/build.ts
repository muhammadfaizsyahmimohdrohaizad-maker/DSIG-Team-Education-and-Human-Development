import "server-only";
import type { CvView } from "@/lib/types";
import { getProfile } from "@/server/data/profiles";
import { getModules, getOccupations, getSkills } from "@/server/data/reference";
import { getProgress } from "@/server/data/learning";
import { shownSkills } from "@/features/matches/rank";

const dateMyt = (d: Date) => d.toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kuala_Lumpur" });

/** Shared by the buildCv action and the print page, so both show exactly the same CV. */
export async function loadCv(userId: string): Promise<CvView | null> {
  const profile = await getProfile(userId);
  if (!profile) return null;
  const [progress, skills, modules, occupations, shown] = await Promise.all([getProgress(userId), getSkills(), getModules(), getOccupations(), shownSkills(profile)]);
  // A skill goes on the CV only with evidence: the student added it, a passed module or SPM result covers it,
  // or an earlier mastery check passed. Target-job skills come first.
  const target = occupations.find((o) => o.code === profile.target);
  const essential = new Set(target?.essentialSkills ?? []);
  const evidence = (uri: string): string => {
    const p = progress.get(uri);
    if (p?.masteredAt) return `Skill check passed ${dateMyt(p.masteredAt)}`;
    if (profile.skills.includes(uri)) return "You added this skill";
    const mod = modules.find((m) => profile.moduleIds.includes(m.id) && m.skills.includes(uri));
    return mod ? `From your module ${mod.title}` : "From your SPM results";
  };
  const uris = new Set<string>([...shown, ...[...progress.values()].filter((p) => p.masteredAt).map((p) => p.skill)]);
  const cvSkills = [...uris]
    .map((uri) => ({ uri, label: skills.get(uri)?.label ?? uri, evidence: evidence(uri), forTarget: essential.has(uri) }))
    .sort((a, b) => Number(b.forTarget) - Number(a.forTarget) || a.label.localeCompare(b.label));
  return {
    name: profile.fullName,
    educationLevel: profile.educationLevel,
    target: target?.titleEn,
    skills: cvSkills,
    modules: modules.filter((m) => profile.moduleIds.includes(m.id)).map((m) => m.title),
    projects: profile.projects,
  };
}
