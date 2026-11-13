import "server-only";
import type { BookingState, SharedItem } from "../../lib/types.ts";
import { fromDb, ok, type KnownDbErrors, type Result } from "../../lib/result.ts";
import { adminDb, db } from "./supabase.ts";

// D6 bookings and availability, student side. Every state change goes through a SECURITY DEFINER
// function (claim_slot, move_booking, cancel_booking) that locks the rows it changes (System Design A7).

export const BOOKING_ERRORS: KnownDbErrors = {
  not_allowed: ["FORBIDDEN", "Your account can't book sessions yet. If you're under 18, your parent or guardian needs to approve it first."],
  not_found: ["NOT_FOUND", "We couldn't find that booking or time. Reload the page to see the current times."],
  slot_taken: ["CONFLICT", "That time was just taken. Pick another."],
  slot_closed: ["CONFLICT", "That time is no longer open. Pick another."],
  bad_status: ["CONFLICT", "This booking has already changed. Reload the page to see where it stands."],
  too_late: ["CONFLICT", "This session has already started, so it can't be changed here. Talk to your adviser directly."],
  "23505": ["CONFLICT", "That time was just taken. Pick another."],
};

export type OpenSlot = { id: string; adviserId: string; adviserName: string; start: string; minutes: number };

export async function openSlots(from: string, to: string, adviserId?: string): Promise<Result<OpenSlot[]>> {
  const { data, error } = await (await db()).rpc("open_slots", { p_from: from, p_to: to, ...(adviserId ? { p_adviser: adviserId } : {}) });
  if (error) return fromDb(error, BOOKING_ERRORS, "openSlots");
  return ok((data as { id: string; adviser_id: string; adviser_name: string; slot_start: string; minutes: number }[])
    .map((r) => ({ id: r.id, adviserId: r.adviser_id, adviserName: r.adviser_name, start: r.slot_start, minutes: r.minutes })));
}

export type MyBooking = {
  id: string;
  status: BookingState;
  topic: string;
  note: string | null;
  shared: SharedItem[];
  adviserNote: string | null;
  slotId: string;
  start: string;
  minutes: number;
  adviserId: string;
  adviserName: string;
  feedback: { text: string; sentAt: string } | null;
  createdAt: string;
};

type MyBookingRow = {
  id: string; status: BookingState; topic: string; note: string | null; shared_items: SharedItem[]; adviser_note: string | null;
  slot_id: string; slot_start: string; minutes: number; adviser_id: string; adviser_name: string;
  feedback_text: string | null; feedback_sent_at: string | null; created_at: string;
};

export async function myBookings(): Promise<Result<MyBooking[]>> {
  const { data, error } = await (await db()).rpc("my_bookings");
  if (error) return fromDb(error, BOOKING_ERRORS, "myBookings");
  return ok((data as MyBookingRow[]).map((r) => ({
    id: r.id, status: r.status, topic: r.topic, note: r.note, shared: r.shared_items, adviserNote: r.adviser_note,
    slotId: r.slot_id, start: r.slot_start, minutes: r.minutes, adviserId: r.adviser_id, adviserName: r.adviser_name,
    feedback: r.feedback_text && r.feedback_sent_at ? { text: r.feedback_text, sentAt: r.feedback_sent_at } : null,
    createdAt: r.created_at,
  })));
}

export type Claim = { bookingId: string; adviserId: string; start: string; minutes: number; replayed: boolean };

export async function claimSlot(i: { slotId: string; topic: string; note?: string; shared: SharedItem[]; requestId: string }): Promise<Result<Claim>> {
  const { data, error } = await (await db()).rpc("claim_slot", {
    p_slot: i.slotId, p_topic: i.topic, p_note: i.note ?? "", p_shared: i.shared, p_request_id: i.requestId,
  });
  if (error) return fromDb(error, BOOKING_ERRORS, "claimSlot");
  const r = data as { booking_id: string; adviser_id: string; slot_start: string; minutes: number; replayed: boolean };
  return ok({ bookingId: r.booking_id, adviserId: r.adviser_id, start: r.slot_start, minutes: r.minutes, replayed: r.replayed });
}

export type Move = { bookingId: string; oldAdviserId: string; oldStart: string; adviserId: string; start: string; minutes: number; status: BookingState; changed: boolean };

export async function moveBookingTo(bookingId: string, slotId: string): Promise<Result<Move>> {
  const { data, error } = await (await db()).rpc("move_booking", { p_booking: bookingId, p_slot: slotId });
  if (error) return fromDb(error, BOOKING_ERRORS, "moveBooking");
  const r = data as { booking_id: string; old_adviser_id: string; old_start: string; adviser_id: string; slot_start: string; minutes: number; status: BookingState; changed: boolean };
  return ok({ bookingId: r.booking_id, oldAdviserId: r.old_adviser_id, oldStart: r.old_start, adviserId: r.adviser_id, start: r.slot_start, minutes: r.minutes, status: r.status, changed: r.changed });
}

export type Cancel = { bookingId: string; adviserId: string; start: string; changed: boolean };

export async function cancelOwnBooking(bookingId: string): Promise<Result<Cancel>> {
  const { data, error } = await (await db()).rpc("cancel_booking", { p_booking: bookingId });
  if (error) return fromDb(error, BOOKING_ERRORS, "cancelBooking");
  const r = data as { booking_id: string; adviser_id: string; slot_start: string; changed: boolean };
  return ok({ bookingId: r.booking_id, adviserId: r.adviser_id, start: r.slot_start, changed: r.changed });
}

// ---------- Cron only ----------

export type DueBooking = { bookingId: string; studentId: string; start: string; minutes: number; adviserName: string };

/** Accepted bookings starting in [from, to). Service role, read-only, used by the reminder cron. */
export async function acceptedBookingsBetween(from: string, to: string): Promise<Result<DueBooking[]>> {
  const admin = adminDb();
  const { data, error } = await admin
    .from("bookings")
    .select("id, student_id, availability_slots!inner(slot_start, minutes, adviser_id)")
    .eq("status", "accepted")
    .gte("availability_slots.slot_start", from)
    .lt("availability_slots.slot_start", to)
    .limit(1000);
  if (error) return fromDb(error, BOOKING_ERRORS, "acceptedBookingsBetween");
  const rows = data as { id: string; student_id: string; availability_slots: { slot_start: string; minutes: number; adviser_id: string } }[];
  const adviserIds = [...new Set(rows.map((r) => r.availability_slots.adviser_id))];
  const names = new Map<string, string>();
  if (adviserIds.length) {
    const { data: advisers, error: e2 } = await admin.from("profiles").select("user_id, full_name").in("user_id", adviserIds);
    if (e2) return fromDb(e2, BOOKING_ERRORS, "acceptedBookingsBetween");
    for (const a of advisers as { user_id: string; full_name: string }[]) names.set(a.user_id, a.full_name);
  }
  if (!rows.length) return ok([]);
  const preferences = await admin.from("profiles").select("user_id").in("user_id", [...new Set(rows.map(r => r.student_id))]).eq("reminder_emails", true);
  if (preferences.error) return fromDb(preferences.error, BOOKING_ERRORS, "reminderPreferences");
  const optedIn = new Set(preferences.data.map(r => r.user_id));
  return ok(rows.filter(r => optedIn.has(r.student_id)).map((r) => ({
    bookingId: r.id, studentId: r.student_id, start: r.availability_slots.slot_start, minutes: r.availability_slots.minutes,
    adviserName: names.get(r.availability_slots.adviser_id) ?? "your adviser",
  })));
}
