"use server";

// interview: server actions. Each validates input with Zod, calls server/data and server/engines,
// and returns a Result. See System Design 2.2 for the logic each one needs.
import { notBuilt, err, type Result } from "@/lib/result";
import { interviewAnswer } from "@/lib/schemas";

export async function startInterview(): Promise<Result<never>> {
  return notBuilt("Starting a mock interview");
}

export async function submitAnswer(input: unknown): Promise<Result<never>> {
  const parsed = interviewAnswer.safeParse(input);
  if (!parsed.success) return err("VALIDATION", "Check the highlighted fields.", Object.fromEntries(parsed.error.issues.map((i) => [i.path.join("."), i.message])));
  return notBuilt("Marking an answer");
}

export async function retryAiFeedback(): Promise<Result<never>> {
  return notBuilt("AI feedback retry");
}
