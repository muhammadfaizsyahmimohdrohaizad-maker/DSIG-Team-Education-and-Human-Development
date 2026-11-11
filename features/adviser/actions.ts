"use server";

// adviser: server actions. Each validates input with Zod, calls server/data and server/engines,
// and returns a Result. See System Design 2.2 for the logic each one needs.
import { notBuilt, err, type Result } from "@/lib/result";
import { adviserFeedback } from "@/lib/schemas";

export async function acceptUndertaking(): Promise<Result<never>> {
  return notBuilt("Accepting the staff undertaking");
}

export async function listRequests(): Promise<Result<never>> {
  return notBuilt("Booking requests");
}

export async function openRequest(): Promise<Result<never>> {
  return notBuilt("Opening a request");
}

export async function respond(): Promise<Result<never>> {
  return notBuilt("Accepting or declining");
}

export async function sendFeedback(input: unknown): Promise<Result<never>> {
  const parsed = adviserFeedback.safeParse(input);
  if (!parsed.success) return err("VALIDATION", "Check the highlighted fields.", Object.fromEntries(parsed.error.issues.map((i) => [i.path.join("."), i.message])));
  return notBuilt("Sending feedback");
}

export async function setAvailability(): Promise<Result<never>> {
  return notBuilt("Saving availability");
}

export async function getCohort(): Promise<Result<never>> {
  return notBuilt("Cohort totals");
}
