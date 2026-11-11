"use server";

// booking: open times, requests, moves and cancellations (FR-BKG-01..03). Slot claims run in one
// database transaction (A7, claim_slot); status emails go out after the change has committed.
import { err, invalid, ok, type Result } from "@/lib/result";
import { bookingRef, bookingRequest, moveBookingInput, openSlotsQuery } from "@/lib/schemas";
import { cancelOwnBooking, claimSlot, moveBookingTo, myBookings, openSlots, type MyBooking, type OpenSlot } from "@/server/data/bookings";
import { currentUser } from "@/server/data/supabase";
import { notifyAfter, type Notice } from "./notify";
import { slotWindow } from "./rules";

export type { MyBooking, OpenSlot };

const LOG_IN = "Log in to book a session. You'll come back to this page.";

export async function getOpenSlots(input: unknown = {}): Promise<Result<OpenSlot[]>> {
  const parsed = openSlotsQuery.safeParse(input ?? {});
  if (!parsed.success) return invalid(parsed.error);
  if (!(await currentUser())) return err("UNAUTHENTICATED", LOG_IN);
  const w = slotWindow(new Date(), parsed.data.days, parsed.data.from);
  return openSlots(w.from, w.to, parsed.data.adviserId);
}

export async function listMyBookings(): Promise<Result<MyBooking[]>> {
  if (!(await currentUser())) return err("UNAUTHENTICATED", LOG_IN);
  return myBookings();
}

export type BookingRequested = { bookingId: string; start: string; minutes: number; replayed: boolean };

/** Idempotent on requestId: a retry of the same request returns the first booking and sends no second email. */
export async function requestBooking(input: unknown): Promise<Result<BookingRequested>> {
  const parsed = bookingRequest.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  if (!(await currentUser())) return err("UNAUTHENTICATED", LOG_IN);

  const claim = await claimSlot(parsed.data);
  if (!claim.ok) return claim;
  const c = claim.value;
  if (!c.replayed) notifyAfter({ to: c.adviserId, kind: "requested", bookingId: c.bookingId, start: c.start, minutes: c.minutes });
  return ok({ bookingId: c.bookingId, start: c.start, minutes: c.minutes, replayed: c.replayed });
}

export type BookingMoved = { bookingId: string; start: string; minutes: number; status: MyBooking["status"] };

/** Moves an active booking to another open time; the adviser of the new time accepts it again. */
export async function moveBooking(input: unknown): Promise<Result<BookingMoved>> {
  const parsed = moveBookingInput.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  if (!(await currentUser())) return err("UNAUTHENTICATED", LOG_IN);

  const moved = await moveBookingTo(parsed.data.bookingId, parsed.data.slotId);
  if (!moved.ok) return moved;
  const m = moved.value;
  if (m.changed) {
    const notices: Notice[] = [{ to: m.adviserId, kind: "moved", bookingId: m.bookingId, start: m.start, minutes: m.minutes }];
    if (m.oldAdviserId !== m.adviserId) notices.push({ to: m.oldAdviserId, kind: "cancelled", bookingId: m.bookingId, start: m.oldStart });
    notifyAfter(...notices);
  }
  return ok({ bookingId: m.bookingId, start: m.start, minutes: m.minutes, status: m.status });
}

export type BookingCancelled = { bookingId: string };

export async function cancelBooking(input: unknown): Promise<Result<BookingCancelled>> {
  const parsed = bookingRef.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  if (!(await currentUser())) return err("UNAUTHENTICATED", LOG_IN);

  const cancelled = await cancelOwnBooking(parsed.data.bookingId);
  if (!cancelled.ok) return cancelled;
  const c = cancelled.value;
  if (c.changed) notifyAfter({ to: c.adviserId, kind: "cancelled", bookingId: c.bookingId, start: c.start });
  return ok({ bookingId: c.bookingId });
}
