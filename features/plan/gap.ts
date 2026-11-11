import "server-only";
// A2 with its data: one row per essential skill of the target job, with the reason for its state.
import type { GapRowView, SkillGapView } from "@/lib/types";
import type { ProfileDetails } from "@/server/data/profiles";
import { gap, lessonsLeft } from "@/server/engines/skills";
import { getLessons, getModules, getOccupations, getSkills, getSpmLinks, getStudyOptions } from "@/server/data/reference";
import { getProgress, getSavedOptionIds, type SkillProgressDetail } from "@/server/data/learning";
import { gradeAtLeast } from "@/server/engines/matches";
import { shownSkills } from "@/features/matches/rank";

const dateMyt = (d: Date) => d.toLocaleDateString("en-MY", { day: "numeric", month: "short", timeZone: "Asia/Kuala_Lumpur" });

export async function buildSkillGap(profile: ProfileDetails & { target: string }): Promise<SkillGapView | null> {
  const [occupations, skills, lessons, modules, spm, shown, progress, options, saved] = await Promise.all([
    getOccupations(), getSkills(), getLessons(), getModules(), getSpmLinks(), shownSkills(profile),
    getProgress(profile.userId), getStudyOptions(profile.target), getSavedOptionIds(profile.userId),
  ]);
  const target = occupations.find((o) => o.code === profile.target);
  if (!target) return null;

  const withLessons = new Set(lessons.map((l) => l.skillUri));
  const rows = gap(target.essentialSkills, shown, progress);

  const whyHave = (uri: string): string => {
    if (profile.skills.includes(uri)) return "You added this skill.";
    const mod = modules.find((m) => profile.moduleIds.includes(m.id) && m.skills.includes(uri));
    if (mod) return `From your module ${mod.title}.`;
    const subj = profile.spmGrades.find((g) => (spm.get(g.subject) ?? []).some((l) => l.uri === uri && gradeAtLeast(g.grade, l.minGrade)));
    if (subj) return `From your SPM ${subj.subject} (${subj.grade}).`;
    return "You show this skill.";
  };

  const evidence = (state: GapRowView["state"], uri: string, p?: SkillProgressDetail): string => {
    const done = p?.lessonsDone.length ?? 0;
    switch (state) {
      case "mastered": return `You passed the 5-question check on ${dateMyt(p!.masteredAt!)}.`;
      case "check_needed": return "You said you know this. Take the 5-question check to confirm it.";
      case "learning": {
        const c = p?.latestCheck;
        if (c && c.score < 4 && c.retakeAfterLesson) return `Your last check scored ${c.score} of 5. Redo lesson ${c.retakeAfterLesson}, then try again.`;
        return done >= 4 ? "All 4 lessons done. Take the 5-question check." : `${done} of 4 lessons done. The 5-question check comes after lesson 4.`;
      }
      case "have": return whyHave(uri);
      case "missing": return "Not in your modules, skills or projects yet.";
    }
  };

  const view: GapRowView[] = rows.map((r) => {
    const p = progress.get(r.skill);
    const done = p?.lessonsDone ?? [];
    const next = [1, 2, 3, 4].find((n) => !done.includes(n));
    return {
      ...r,
      label: skills.get(r.skill)?.label ?? r.skill,
      lessonsDone: done.length,
      nextLesson: withLessons.has(r.skill) ? next : undefined,
      evidence: evidence(r.state, r.skill, p),
      hasLessons: withLessons.has(r.skill),
    };
  });

  return {
    target: { code: target.code, title: target.titleEn },
    rows: view,
    lessonsLeft: lessonsLeft(rows, progress),
    options,
    savedOptionIds: saved,
  };
}
