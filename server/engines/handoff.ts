import "server-only";
import { getStore } from "../data";
import { sendBookingStatusEmail } from "../email/booking-status";
import { applyAction, type Actor, type BookingAction } from "@/lib/booking/transitions";
import type { Booking } from "@/lib/types";

export type Outcome<T> = { ok: true; value: T } | { ok: false; error: string; field?: string };

export async function requestSession(input: { date: string; time: string; note: string }): Promise<Outcome<Booking>> {
  if (!input.date) return { ok: false, error: "Choose a date for the session.", field: "date" };
  if (!input.time) return { ok: false, error: "Choose a time for the session.", field: "time" };
  const booking = await getStore().createBooking({ slot: `${input.date}T${input.time}`, note: input.note });
  return { ok: true, value: booking };
}

/** Saves the new status first, then sends the email. A failed email never undoes the status. */
export async function actOnBooking(
  bookingId: string,
  action: BookingAction,
  actor: Actor,
  reason?: string,
): Promise<Outcome<Booking>> {
  const store = getStore();
  const booking = (await store.listBookings()).find((b) => b.id === bookingId);
  if (!booking) return { ok: false, error: "We couldn't find that booking. Refresh the page and try again." };

  const result = applyAction(booking, action, actor, reason);
  if (!result.ok) return { ok: false, error: result.error, field: "reason" };

  await store.saveBooking(result.booking);
  if (actor === "adviser") await sendBookingStatusEmail(result.booking, `${result.booking.studentId}@example.invalid`);
  return { ok: true, value: result.booking };
}
