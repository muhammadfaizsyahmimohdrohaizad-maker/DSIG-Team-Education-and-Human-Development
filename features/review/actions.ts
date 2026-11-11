"use server";

// review: server actions. Each validates input with Zod, calls server/data and server/engines,
// and returns a Result. See System Design 2.2 for the logic each one needs.
import { notBuilt, type Result } from "@/lib/result";

export async function getDueCards(): Promise<Result<never>> {
  return notBuilt("Cards due today");
}

export async function rateCard(): Promise<Result<never>> {
  return notBuilt("Rating a card");
}

export async function importNotes(): Promise<Result<never>> {
  return notBuilt("Turning notes into cards");
}
