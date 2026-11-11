"use server";

// account: server actions. Each validates input with Zod, calls server/data and server/engines,
// and returns a Result. See System Design 2.2 for the logic each one needs.
import { notBuilt, type Result } from "@/lib/result";

export async function deleteMyAccount(): Promise<Result<never>> {
  return notBuilt("Account deletion");
}

export async function updateConsent(): Promise<Result<never>> {
  return notBuilt("Changing a consent");
}
