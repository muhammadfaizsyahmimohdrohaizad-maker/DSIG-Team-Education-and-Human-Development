"use server";

// plan: the skill gap for the target job (A2) and saved study options (FR-GAP, FR-PLAN).
import { err, ok, type Result } from "@/lib/result";
import { skillInput, studyOptionInput } from "@/lib/schemas";
import type { SkillGapView } from "@/lib/types";
import { getProfile } from "@/server/data/profiles";
import { getSkills, studyOptionExists } from "@/server/data/reference";
import { claimSkill as saveClaim, getProgress, removeOption, saveOption } from "@/server/data/learning";
import { PASS_MARK } from "@/server/engines/lesson";
import { invalid, withUser } from "@/features/matches/run";
import { buildSkillGap } from "./gap";

export async function getSkillGap(): Promise<Result<SkillGapView>> {
  return withUser("getSkillGap", async (userId) => {
    const profile = await getProfile(userId);
    if (!profile) return err("NOT_FOUND", "We could not find your profile. Log out and in again.");
    if (!profile.target) return err("NOT_FOUND", "Pick a target job on the Map first.");
    const view = await buildSkillGap({ ...profile, target: profile.target });
    if (!view) return err("NOT_FOUND", "Your target job is no longer in the list. Pick another on the Map.");
    return ok(view);
  });
}

/** "I already know this": the skill needs the 5-question check before it counts as mastered. */
export async function claimSkill(input: unknown): Promise<Result<{ skill: string; state: "check_needed" }>> {
  const parsed = skillInput.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const { skill } = parsed.data;
  return withUser("claimSkill", async (userId) => {
    if (!(await getSkills()).has(skill)) return err("VALIDATION", "That skill is not in the list.", { skill: "Pick a skill from the list" });
    const p = (await getProgress(userId)).get(skill);
    if ((p?.bestCheckScore ?? 0) >= PASS_MARK) return err("CONFLICT", "You have already mastered this skill.");
    await saveClaim(userId, skill);
    return ok({ skill, state: "check_needed" });
  });
}

export async function saveStudyOption(input: unknown): Promise<Result<{ optionId: string }>> {
  const parsed = studyOptionInput.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const { optionId } = parsed.data;
  return withUser("saveStudyOption", async (userId) => {
    if (!(await studyOptionExists(optionId))) return err("NOT_FOUND", "That study option is no longer listed.");
    await saveOption(userId, optionId);
    return ok({ optionId });
  });
}

export async function removeStudyOption(input: unknown): Promise<Result<{ optionId: string }>> {
  const parsed = studyOptionInput.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  return withUser("removeStudyOption", async (userId) => {
    await removeOption(userId, parsed.data.optionId);
    return ok({ optionId: parsed.data.optionId });
  });
}
