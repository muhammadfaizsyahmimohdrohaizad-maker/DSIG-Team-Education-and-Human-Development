"use server";

// matches: server actions. Each validates input with Zod, calls server/data and server/engines,
// and returns a Result. See System Design 2.2 for the logic each one needs.
import { notBuilt, err, type Result } from "@/lib/result";
import { profileInput } from "@/lib/schemas";

export async function rankMatches(input: unknown): Promise<Result<never>> {
  const parsed = profileInput.safeParse(input);
  if (!parsed.success) return err("VALIDATION", "Check the highlighted fields.", Object.fromEntries(parsed.error.issues.map((i) => [i.path.join("."), i.message])));
  return notBuilt("Live match ranking");
}

export async function saveSession(input: unknown): Promise<Result<never>> {
  const parsed = profileInput.safeParse(input);
  if (!parsed.success) return err("VALIDATION", "Check the highlighted fields.", Object.fromEntries(parsed.error.issues.map((i) => [i.path.join("."), i.message])));
  return notBuilt("Saving your details");
}

export async function setTarget(): Promise<Result<never>> {
  return notBuilt("Setting a target job");
}
