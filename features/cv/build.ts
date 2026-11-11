import "server-only";
import type { CvView } from "@/lib/types";
import { getProfile } from "@/server/data/profiles";
import { getModules, getOccupations, getSkills } from "@/server/data/reference";
import { getProgress } from "@/server/data/learning";

const dateMyt = (d: Date) => d.toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kuala_Lumpur" });

/** Shared by the buildCv action and the print page, so both show exactly the same CV. */
export async function loadCv(userId: string): Promise<CvView | null> {
  const profile = await getProfile(userId);
  if (!profile) return null;
  const [progress, skills, modules, occupations] = await Promise.all([getProgress(userId), getSkills(), getModules(), getOccupations()]);
  const mastered = [...progress.values()]
    .filter((p) => p.masteredAt)
    .sort((a, b) => a.masteredAt!.getTime() - b.masteredAt!.getTime())
    .map((p) => ({ uri: p.skill, label: skills.get(p.skill)?.label ?? p.skill, masteredOn: dateMyt(p.masteredAt!) }));
  return {
    name: profile.fullName,
    educationLevel: profile.educationLevel,
    target: occupations.find((o) => o.code === profile.target)?.titleEn,
    skills: mastered,
    modules: modules.filter((m) => profile.moduleIds.includes(m.id)).map((m) => m.title),
    projects: profile.projects,
  };
}
