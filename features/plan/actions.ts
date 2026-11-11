"use server";

// plan: server actions. Each validates input with Zod, calls server/data and server/engines,
// and returns a Result. See System Design 2.2 for the logic each one needs.
import { notBuilt, type Result } from "@/lib/result";

export async function getSkillGap(): Promise<Result<never>> {
  return notBuilt("Skill gap");
}

export async function claimSkill(): Promise<Result<never>> {
  return notBuilt("I already know this");
}

export async function saveStudyOption(): Promise<Result<never>> {
  return notBuilt("Saving a study option");
}

export async function removeStudyOption(): Promise<Result<never>> {
  return notBuilt("Removing a study option");
}
