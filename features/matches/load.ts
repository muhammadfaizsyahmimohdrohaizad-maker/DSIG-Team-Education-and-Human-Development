import "server-only";
// Everything the "Tell us about yourself" page needs on first render.
import type { EducationLevel, MatchView, Project, SpmGrade } from "@/lib/types";
import { getProfile } from "@/server/data/profiles";
import { getInterestAreas, getModules, getOccupations, getSkills } from "@/server/data/reference";
import { skillUri } from "@/content/reference/keys";
import spm from "@/content/reference/spm-subjects.json";
import { computeMatches } from "./rank";

/** Quick-add chips under the skill box (the mockup's suggestion list, as skill keys). */
const QUICK_ADD = ["python", "sql", "javascript", "java", "html-css", "machine-learning", "spreadsheets", "ui-design", "linux", "electronics"];

export type AboutYouData = {
  form: {
    educationLevel?: EducationLevel;
    spmGrades: SpmGrade[];
    moduleIds: string[];
    skills: string[];
    interests: string[];
    projects: Project[];
    jobInMind?: string;
  };
  target?: { code: string; title: string };
  options: {
    interests: string[];
    modules: { id: string; title: string; programme: string }[];
    spmSubjects: string[];
    grades: string[];
    occupations: { code: string; title: string }[];
    skills: { uri: string; label: string }[];
    quickAdd: { uri: string; label: string }[];
  };
  matches: MatchView[];
};

export async function loadAboutYou(userId: string): Promise<AboutYouData | null> {
  const profile = await getProfile(userId);
  if (!profile) return null;
  const [interests, modules, occupations, skills, matches] = await Promise.all([
    getInterestAreas(), getModules(), getOccupations(), getSkills(), computeMatches(profile),
  ]);
  const target = occupations.find((o) => o.code === profile.target);
  return {
    form: {
      educationLevel: profile.educationLevel,
      spmGrades: profile.spmGrades,
      moduleIds: profile.moduleIds,
      skills: profile.skills,
      interests: profile.interests,
      projects: profile.projects,
      jobInMind: profile.jobInMind,
    },
    target: target && { code: target.code, title: target.titleEn },
    options: {
      interests,
      modules: modules.map(({ id, title, programme }) => ({ id, title, programme })),
      spmSubjects: (spm as { subjects: { subject: string }[] }).subjects.map((s) => s.subject),
      grades: (spm as { grade_order: string[] }).grade_order,
      occupations: occupations.map((o) => ({ code: o.code, title: o.titleEn })).sort((a, b) => a.title.localeCompare(b.title)),
      skills: [...skills.values()].map((s) => ({ uri: s.uri, label: s.label })),
      quickAdd: QUICK_ADD.map(skillUri).filter((u) => skills.has(u)).map((u) => ({ uri: u, label: skills.get(u)!.label })),
    },
    matches,
  };
}
