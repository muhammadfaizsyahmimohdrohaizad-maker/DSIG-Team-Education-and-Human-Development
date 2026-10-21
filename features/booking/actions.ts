"use server";

import { revalidatePath } from "next/cache";
import { getStore } from "@/server/data";
import { actOnBooking, requestSession } from "@/server/engines/handoff";

export type RequestResult =
  | { ok: true; slot: string }
  | { ok: false; error: string; field?: "date" | "time" };

export async function requestSessionAction(input: { date: string; time: string; note: string }): Promise<RequestResult> {
  const date = String(input.date ?? "");
  const time = String(input.time ?? "");
  const note = String(input.note ?? "").slice(0, 1000);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) && date) return { ok: false, error: "Choose a date like 22 Oct 2026.", field: "date" };
  if (!/^\d{2}:\d{2}$/.test(time) && time) return { ok: false, error: "Choose a time like 10:00.", field: "time" };
  const result = await requestSession({ date, time, note });
  if (!result.ok) return { ok: false, error: result.error, field: result.field as "date" | "time" | undefined };
  revalidatePath("/bookings");
  revalidatePath("/adviser");
  return { ok: true, slot: result.value.slot };
}

/** The student cancels their own request or accepted booking. No reason needed. */
export async function cancelRequest(formData: FormData) {
  const id = String(formData.get("bookingId") ?? "");
  await actOnBooking(id, "cancel", "student");
  revalidatePath("/bookings");
  revalidatePath("/adviser");
}

/** Clears the "Updated" markers once the student has opened the bookings page. */
export async function markBookingsViewed() {
  await getStore().markBookingsViewed();
  revalidatePath("/", "layout");
}
