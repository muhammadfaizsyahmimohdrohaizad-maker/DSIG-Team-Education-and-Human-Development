// SAMPLE DATA for the homepage's skill-gap preview (Main board). The figure is labelled as sample data on screen.
import type { SkillState } from "@/lib/types";

export type PreviewSkill = { name: string; state: Extract<SkillState, "have" | "learning" | "missing"> };

export const homeSkillGapSample: { targetJob: string; have: number; total: number; skills: PreviewSkill[]; source: string } = {
  targetJob: "AI engineer",
  have: 4,
  total: 9,
  skills: [
    { name: "Programming in Python", state: "have" },
    { name: "Databases and SQL", state: "have" },
    { name: "Machine learning basics", state: "learning" },
    { name: "Evaluating models", state: "missing" },
  ],
  source: "MASCO 2020 and ESCO",
};
