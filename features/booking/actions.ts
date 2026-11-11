"use server";

// booking: server actions. Each validates input with Zod, calls server/data and server/engines,
// and returns a Result. See System Design 2.2 for the logic each one needs.
import { notBuilt, err, type Result } from "@/lib/result";
import { bookingRequest } from "@/lib/schemas";

export async function getOpenSlots(): Promise<Result<never>> {
  return notBuilt("Open times");
}

export async function requestBooking(input: unknown): Promise<Result<never>> {
  const parsed = bookingRequest.safeParse(input);
  if (!parsed.success) return err("VALIDATION", "Check the highlighted fields.", Object.fromEntries(parsed.error.issues.map((i) => [i.path.join("."), i.message])));
  return notBuilt("Requesting a session");
}

export async function moveBooking(): Promise<Result<never>> {
  return notBuilt("Moving a booking");
}

export async function cancelBooking(): Promise<Result<never>> {
  return notBuilt("Cancelling a booking");
}
