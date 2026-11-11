"use server";

// learning: server actions. Each validates input with Zod, calls server/data and server/engines,
// and returns a Result. See System Design 2.2 for the logic each one needs.
import { notBuilt, err, type Result } from "@/lib/result";
import { checkAnswers } from "@/lib/schemas";

export async function completeLesson(): Promise<Result<never>> {
  return notBuilt("Marking a lesson done");
}

export async function getCheck(): Promise<Result<never>> {
  return notBuilt("Opening a mastery check");
}

export async function submitCheck(input: unknown): Promise<Result<never>> {
  const parsed = checkAnswers.safeParse(input);
  if (!parsed.success) return err("VALIDATION", "Check the highlighted fields.", Object.fromEntries(parsed.error.issues.map((i) => [i.path.join("."), i.message])));
  return notBuilt("Marking a mastery check");
}

export async function exportNotes(): Promise<Result<never>> {
  return notBuilt("Notes export");
}
