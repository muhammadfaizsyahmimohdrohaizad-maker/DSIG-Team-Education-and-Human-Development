"use server";

// onboarding: server actions. Each validates input with Zod, calls server/data and server/engines,
// and returns a Result. See System Design 2.2 for the logic each one needs.
import { notBuilt, type Result } from "@/lib/result";

export async function requestParentApproval(): Promise<Result<never>> {
  return notBuilt("Parent approval email");
}

export async function recordParentDecision(): Promise<Result<never>> {
  return notBuilt("Parent decision");
}
