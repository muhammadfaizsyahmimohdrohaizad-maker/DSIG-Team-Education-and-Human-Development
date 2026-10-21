"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { actOnBooking } from "@/server/engines/handoff";
import type { BookingAction } from "@/lib/booking/transitions";

const ACTIONS: BookingAction[] = ["accept", "decline", "complete", "cancel"];

export type ActResult = { ok: true } | { ok: false; error: string };

/** Adviser actions on a booking. Never touches student data. */
export async function adviserAct(bookingId: string, action: string, reason?: string): Promise<ActResult> {
  if (typeof bookingId !== "string" || !ACTIONS.includes(action as BookingAction)) {
    return { ok: false, error: "That action isn't available." };
  }
  const result = await actOnBooking(bookingId, action as BookingAction, "adviser", reason);
  if (!result.ok) return { ok: false, error: result.error };
  revalidatePath("/adviser");
  revalidatePath("/bookings");
  return { ok: true };
}

export async function signOut() {
  redirect("/bookings");
}
