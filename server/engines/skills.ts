// A2. Skill status (FR-GAP-01, FR-GAP-02). Pure.
import type { GapRow, SkillProgress, SkillState } from "../../lib/types.ts";
import { PASS_MARK } from "./lesson.ts";

export function status(skill: string, shownSkills: ReadonlySet<string>, progress?: SkillProgress): SkillState {
  if (progress?.bestCheckScore !== undefined && progress.bestCheckScore >= PASS_MARK) return "mastered";
  if (progress?.claimed) return "check_needed";
  if (progress && progress.lessonsDone.length > 0) return "learning";
  if (shownSkills.has(skill)) return "have";
  return "missing";
}

export function gap(
  targetSkills: readonly string[],
  shownSkills: ReadonlySet<string>,
  progress: ReadonlyMap<string, SkillProgress>,
): GapRow[] {
  return targetSkills.map((skill) => ({ skill, state: status(skill, shownSkills, progress.get(skill)) }));
}

export function lessonsLeft(rows: readonly GapRow[], progress: ReadonlyMap<string, SkillProgress>, lessonsPerSkill = 4): number {
  return rows
    .filter((r) => r.state === "missing" || r.state === "learning")
    .reduce((n, r) => n + lessonsPerSkill - (progress.get(r.skill)?.lessonsDone.length ?? 0), 0);
}
