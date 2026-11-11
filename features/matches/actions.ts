"use server";

// matches: "Tell us about yourself" and job matches (FR-PRO, FR-MAT). A1 ranks on every change; Save
// stores the profile and a dated snapshot; setTarget picks the one job the plan is built around.
// Matching never calls AI.
import { err, ok, type Result } from "@/lib/result";
import { profileInput, setTargetInput, skillText } from "@/lib/schemas";
import type { MatchView, Profile, SkillSuggestion } from "@/lib/types";
import { getProfile, saveProfile, setTarget as saveTarget } from "@/server/data/profiles";
import { getModules, getOccupations, getSkills, suggestSkills as suggest } from "@/server/data/reference";
import { computeMatches } from "./rank";
import { invalid, withUser } from "./run";

type ProfileInput = ReturnType<typeof profileInput.parse>;

const toProfile = (userId: string, v: ProfileInput, isUnder18: boolean): Profile => ({
  userId,
  isUnder18,
  educationLevel: v.educationLevel,
  spmGrades: v.spmGrades,
  moduleIds: v.moduleIds,
  skills: v.skills,
  projects: v.projects,
  interests: v.interests,
  jobInMind: v.jobInMind || undefined,
});

/** Live ranking while the student fills in the form. Nothing is saved. */
export async function rankMatches(input: unknown): Promise<Result<MatchView[]>> {
  const parsed = profileInput.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  return withUser("rankMatches", async (userId) => ok(await computeMatches(toProfile(userId, parsed.data, false))));
}

/** Save: checks every reference against the reference data, stores the profile and a dated snapshot. */
export async function saveSession(input: unknown): Promise<Result<{ matches: MatchView[]; sessionId: string; savedAt: string }>> {
  const parsed = profileInput.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const v = parsed.data;
  return withUser("saveSession", async (userId) => {
    const current = await getProfile(userId);
    if (!current) return err("NOT_FOUND", "We could not find your profile. Log out and in again.");

    const [skills, modules, occupations] = await Promise.all([getSkills(), getModules(), getOccupations()]);
    const fields: Record<string, string> = {};
    if (v.skills.some((s) => !skills.has(s))) fields.skills = "Pick each skill from the suggestions";
    const moduleIds = new Set(modules.map((m) => m.id));
    if (v.moduleIds.some((m) => !moduleIds.has(m))) fields.moduleIds = "Pick each module from the list";
    if (v.jobInMind && !occupations.some((o) => o.code === v.jobInMind)) fields.jobInMind = "Pick a job from the list";
    if (Object.keys(fields).length) return err("VALIDATION", "Check the highlighted fields.", fields);

    const profile = toProfile(userId, v, current.isUnder18);
    const matches = await computeMatches(profile);
    const saved = await saveProfile(userId, {
      educationLevel: v.educationLevel, spmGrades: v.spmGrades, moduleIds: v.moduleIds, skills: v.skills,
      interests: v.interests, projects: v.projects, jobInMind: profile.jobInMind,
    }, matches.map((m) => m.code));
    return ok({ matches, ...saved });
  });
}

/** Picks the target job. The skill gap, lessons and CV follow it. */
export async function setTarget(input: unknown): Promise<Result<{ code: string; title: string }>> {
  const parsed = setTargetInput.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  return withUser("setTarget", async (userId) => {
    const occupation = (await getOccupations()).find((o) => o.code === parsed.data.code);
    if (!occupation) return err("VALIDATION", "Pick a job from the list.", { code: "Pick a job from the list" });
    await saveTarget(userId, occupation.code);
    return ok({ code: occupation.code, title: occupation.titleEn });
  });
}

/** A8: suggestions for a typed skill. The student picks one; nothing is added without that choice. */
export async function suggestSkills(input: unknown): Promise<Result<SkillSuggestion[]>> {
  const parsed = skillText.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  return withUser("suggestSkills", async () => ok(await suggest(parsed.data.text)));
}
