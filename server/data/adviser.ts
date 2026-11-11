import "server-only";
import type { BookingState, EducationLevel, SharedItem, SkillState } from "../../lib/types.ts";
import { fromDb, ok, type KnownDbErrors, type Result } from "../../lib/result.ts";
import { db } from "./supabase.ts";

// D6 adviser side, D7 feedback, D8 audit (written inside open_request). Student data reaches an
// adviser only through open_request; everything else here is the adviser's own rows.

export const ADVISER_ERRORS: KnownDbErrors = {
  not_allowed: ["FORBIDDEN", "Only career advisers can do this. If you are one, log out and log in again."],
  undertaking_required: ["FORBIDDEN", "Accept the current staff undertaking first. It opens from your Requests page."],
  not_found: ["NOT_FOUND", "We couldn't find that request. It may have been cancelled; reload the page to see the current list."],
  bad_status: ["CONFLICT", "This request has already changed, for example the student moved or cancelled it. Reload the page to see where it stands."],
  too_late: ["CONFLICT", "This session time has passed, so the request can't be accepted or declined now."],
  not_completed: ["CONFLICT", "Feedback opens after an accepted session has ended."],
  "42501": ["FORBIDDEN", "You don't have access to this. Accept the current staff undertaking, then try again."],
  P0002: ["NOT_FOUND", "We couldn't find that request. Reload the page to see the current list."],
};

export type Undertaking = { version: string; acceptedAt: string };

export async function acceptUndertaking(userId: string): Promise<Result<Undertaking | null>> {
  const c = await db();
  const { error } = await c.rpc("accept_staff_undertaking");
  if (error) return fromDb(error, ADVISER_ERRORS, "acceptUndertaking");
  const { data: setting } = await c.from("app_settings").select("value").eq("key", "undertaking_version").maybeSingle();
  const version = (setting as { value: string } | null)?.value;
  if (!version) return ok(null);
  const { data } = await c.from("staff_undertakings").select("version, accepted_at").eq("adviser_id", userId).eq("version", version).maybeSingle();
  const row = data as { version: string; accepted_at: string } | null;
  return ok(row ? { version: row.version, acceptedAt: row.accepted_at } : null);
}

export type AdviserRequest = {
  id: string;
  status: BookingState;
  topic: string;
  note: string | null;
  sharedCount: number;
  studentName: string;
  educationLevel: EducationLevel | null;
  start: string;
  minutes: number;
  hasFeedback: boolean;
  createdAt: string;
};

export async function adviserRequests(): Promise<Result<AdviserRequest[]>> {
  const { data, error } = await (await db()).rpc("adviser_requests");
  if (error) return fromDb(error, ADVISER_ERRORS, "adviserRequests");
  return ok((data as {
    id: string; status: BookingState; topic: string; note: string | null; shared_count: number; student_name: string;
    education_level: EducationLevel | null; slot_start: string; minutes: number; has_feedback: boolean; created_at: string;
  }[]).map((r) => ({
    id: r.id, status: r.status, topic: r.topic, note: r.note, sharedCount: r.shared_count, studentName: r.student_name,
    educationLevel: r.education_level, start: r.slot_start, minutes: r.minutes, hasFeedback: r.has_feedback, createdAt: r.created_at,
  })));
}

/** What open_request returns: only the items the student ticked (shape fixed by the SQL function). */
export type SharedSummary = {
  student: { name: string };
  shared: SharedItem[];
  target?: string | null;
  gaps?: { skill: string; state: SkillState }[];
  plan?: Record<string, unknown>[];
  interview?: Record<string, unknown> | null;
};

export async function openRequest(bookingId: string): Promise<Result<SharedSummary>> {
  const { data, error } = await (await db()).rpc("open_request", { p_booking: bookingId });
  if (error) return fromDb(error, ADVISER_ERRORS, "openRequest");
  return ok(data as SharedSummary);
}

export type Decision = { bookingId: string; studentId: string; start: string; minutes: number; status: BookingState; changed: boolean };

export async function respondTo(bookingId: string, accept: boolean, note?: string): Promise<Result<Decision>> {
  const { data, error } = await (await db()).rpc("respond_booking", { p_booking: bookingId, p_accept: accept, p_note: note ?? null });
  if (error) return fromDb(error, ADVISER_ERRORS, "respond");
  const r = data as { booking_id: string; student_id: string; slot_start: string; minutes: number; status: BookingState; changed: boolean };
  return ok({ bookingId: r.booking_id, studentId: r.student_id, start: r.slot_start, minutes: r.minutes, status: r.status, changed: r.changed });
}

export async function saveFeedback(bookingId: string, text: string): Promise<Result<{ studentId: string; start: string; firstTime: boolean }>> {
  const { data, error } = await (await db()).rpc("send_feedback", { p_booking: bookingId, p_text: text });
  if (error) return fromDb(error, ADVISER_ERRORS, "sendFeedback");
  const r = data as { student_id: string; slot_start: string; first_time: boolean };
  return ok({ studentId: r.student_id, start: r.slot_start, firstTime: r.first_time });
}

// ---------- Availability ----------

export type MySlot = { id: string; start: string; minutes: number; open: boolean; booked: boolean };
export type BlockedDay = { day: string; reason: string | null };

async function bookedAmong(slotIds: string[]): Promise<Result<Set<string>>> {
  if (!slotIds.length) return ok(new Set());
  const { data, error } = await (await db()).rpc("my_booked_slots", { p_slots: slotIds });
  if (error) return fromDb(error, ADVISER_ERRORS, "bookedAmong");
  // A setof uuid function comes back as a plain array of ids.
  return ok(new Set((data as string[]).map(String)));
}

export async function mySlots(userId: string, from: string, to: string): Promise<Result<{ slots: MySlot[]; blockedDays: BlockedDay[] }>> {
  const c = await db();
  const [slots, blocked] = await Promise.all([
    c.from("availability_slots").select("id, slot_start, minutes, is_open").eq("adviser_id", userId)
      .gte("slot_start", from).lt("slot_start", to).order("slot_start"),
    c.from("blocked_days").select("day, reason").eq("adviser_id", userId).gte("day", from.slice(0, 10)).order("day"),
  ]);
  const e = slots.error ?? blocked.error;
  if (e) return fromDb(e, ADVISER_ERRORS, "mySlots");
  const rows = slots.data as { id: string; slot_start: string; minutes: number; is_open: boolean }[];
  const booked = await bookedAmong(rows.map((r) => r.id));
  if (!booked.ok) return booked;
  return ok({
    slots: rows.map((r) => ({ id: r.id, start: r.slot_start, minutes: r.minutes, open: r.is_open, booked: booked.value.has(r.id) })),
    blockedDays: (blocked.data as { day: string; reason: string | null }[]).map((b) => ({ day: b.day, reason: b.reason })),
  });
}

export type AvailabilityChange = {
  slots: { start: string; minutes: 30 | 60; open: boolean }[];
  blockDays: { day: string; reason?: string }[];
  unblockDays: string[];
};

export type AvailabilitySaved = { saved: number; keptBooked: string[]; blocked: number; unblocked: number };

/**
 * Opens or closes the adviser's own times (RLS: slots_own_write). Times with an active booking
 * stay exactly as they are, so a request or an accepted session is never moved or closed from here.
 */
export async function saveAvailability(userId: string, change: AvailabilityChange): Promise<Result<AvailabilitySaved>> {
  const c = await db();
  const starts = change.slots.map((s) => new Date(s.start).toISOString());
  const existing = new Map<number, string>();
  if (starts.length) {
    const { data, error } = await c.from("availability_slots").select("id, slot_start").eq("adviser_id", userId).in("slot_start", starts);
    if (error) return fromDb(error, ADVISER_ERRORS, "saveAvailability");
    for (const r of data as { id: string; slot_start: string }[]) existing.set(new Date(r.slot_start).getTime(), r.id);
  }
  const booked = await bookedAmong([...existing.values()]);
  if (!booked.ok) return booked;

  const keptBooked: string[] = [];
  const rows: { adviser_id: string; slot_start: string; minutes: number; is_open: boolean }[] = [];
  for (const s of change.slots) {
    const at = new Date(s.start).getTime();
    const id = existing.get(at);
    if (id && booked.value.has(id)) { keptBooked.push(new Date(at).toISOString()); continue; }
    if (!id && !s.open) continue; // closing a time that was never opened: nothing to store
    rows.push({ adviser_id: userId, slot_start: new Date(at).toISOString(), minutes: s.minutes, is_open: s.open });
  }
  if (rows.length) {
    const { error } = await c.from("availability_slots").upsert(rows, { onConflict: "adviser_id,slot_start" });
    if (error) return fromDb(error, ADVISER_ERRORS, "saveAvailability");
  }
  if (change.blockDays.length) {
    const { error } = await c.from("blocked_days").upsert(
      change.blockDays.map((b) => ({ adviser_id: userId, day: b.day, reason: b.reason ?? null })),
      { onConflict: "adviser_id,day" },
    );
    if (error) return fromDb(error, ADVISER_ERRORS, "saveAvailability");
  }
  if (change.unblockDays.length) {
    const { error } = await c.from("blocked_days").delete().eq("adviser_id", userId).in("day", change.unblockDays);
    if (error) return fromDb(error, ADVISER_ERRORS, "saveAvailability");
  }
  return ok({ saved: rows.length, keptBooked, blocked: change.blockDays.length, unblocked: change.unblockDays.length });
}

// ---------- Cohort (A6) ----------

export async function cohortRows(): Promise<Result<{ target: string; students: number }[]>> {
  const { data, error } = await (await db()).rpc("cohort_rows");
  if (error) return fromDb(error, ADVISER_ERRORS, "cohortRows");
  return ok((data as { target: string; students: number | string }[]).map((r) => ({ target: r.target, students: Number(r.students) })));
}
