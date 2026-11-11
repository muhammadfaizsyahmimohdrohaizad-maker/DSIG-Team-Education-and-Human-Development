"use server";

// adviser: undertaking, requests, responses, feedback, availability and cohort (FR-CON-04, FR-ADV-01..04).
// Student data reaches an adviser only through the open_request RPC, which writes the audit row.
import { err, invalid, ok, type Result } from "@/lib/result";
import { adviserFeedback, availabilityInput, bookingRef, openSlotsQuery, respondInput } from "@/lib/schemas";
import { aggregate, type CohortRow } from "@/server/engines/cohort";
import { ownProfile } from "@/server/data/account";
import {
  acceptUndertaking as acceptUndertakingRow, adviserRequests, cohortRows, mySlots, openRequest as openRequestRpc,
  respondTo, saveAvailability, saveFeedback,
  type AdviserRequest, type AvailabilitySaved, type BlockedDay, type MySlot, type SharedSummary, type Undertaking,
} from "@/server/data/adviser";
import { currentUser } from "@/server/data/supabase";
import { notifyAfter } from "@/features/booking/notify";
import { slotWindow } from "@/features/booking/rules";

export type { AdviserRequest, AvailabilitySaved, BlockedDay, CohortRow, MySlot, SharedSummary, Undertaking };

const LOG_IN = "Log in with your staff account to continue.";

async function adviser() {
  const user = await currentUser();
  if (!user) return null;
  const role = (user.app_metadata as { role?: string } | undefined)?.role;
  return role === "adviser" ? user : undefined;
}

const NOT_ADVISER = "Only career advisers can do this. If you are one, log out and log in again.";

export async function acceptUndertaking(): Promise<Result<Undertaking | null>> {
  const user = await adviser();
  if (user === null) return err("UNAUTHENTICATED", LOG_IN);
  if (!user) return err("FORBIDDEN", NOT_ADVISER);
  return acceptUndertakingRow(user.id);
}

export async function listRequests(): Promise<Result<AdviserRequest[]>> {
  const user = await adviser();
  if (user === null) return err("UNAUTHENTICATED", LOG_IN);
  if (!user) return err("FORBIDDEN", NOT_ADVISER);
  return adviserRequests();
}

/** Each call writes one audit row (NFR-09). Call it when the adviser opens a request, not to prefetch. */
export async function openRequest(input: unknown): Promise<Result<SharedSummary>> {
  const parsed = bookingRef.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const user = await adviser();
  if (user === null) return err("UNAUTHENTICATED", LOG_IN);
  if (!user) return err("FORBIDDEN", NOT_ADVISER);
  return openRequestRpc(parsed.data.bookingId);
}

export type Responded = { bookingId: string; status: "accepted" | "declined" };

/** Accept, or decline with a note. A decline withdraws everything the student shared for this booking. */
export async function respond(input: unknown): Promise<Result<Responded>> {
  const parsed = respondInput.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const user = await adviser();
  if (user === null) return err("UNAUTHENTICATED", LOG_IN);
  if (!user) return err("FORBIDDEN", NOT_ADVISER);

  const done = await respondTo(parsed.data.bookingId, parsed.data.accept, parsed.data.note);
  if (!done.ok) return done;
  const d = done.value;
  if (d.changed) {
    const me = await ownProfile(user.id);
    notifyAfter({
      to: d.studentId, kind: parsed.data.accept ? "accepted" : "declined", bookingId: d.bookingId,
      start: d.start, minutes: d.minutes, adviserName: me?.fullName,
    });
  }
  return ok({ bookingId: d.bookingId, status: parsed.data.accept ? "accepted" : "declined" });
}

export type FeedbackSent = { bookingId: string };

/** Only for completed sessions (accepted and ended). Sending again replaces the text without a second email. */
export async function sendFeedback(input: unknown): Promise<Result<FeedbackSent>> {
  const parsed = adviserFeedback.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const user = await adviser();
  if (user === null) return err("UNAUTHENTICATED", LOG_IN);
  if (!user) return err("FORBIDDEN", NOT_ADVISER);

  const saved = await saveFeedback(parsed.data.bookingId, parsed.data.text);
  if (!saved.ok) return saved;
  if (saved.value.firstTime) {
    const me = await ownProfile(user.id);
    // The email names the session time only, never the feedback text.
    notifyAfter({ to: saved.value.studentId, kind: "feedback", bookingId: parsed.data.bookingId, start: saved.value.start, adviserName: me?.fullName });
  }
  return ok({ bookingId: parsed.data.bookingId });
}

export type Availability = { slots: MySlot[]; blockedDays: BlockedDay[] };

export async function getAvailability(input: unknown = {}): Promise<Result<Availability>> {
  const parsed = openSlotsQuery.safeParse(input ?? {});
  if (!parsed.success) return invalid(parsed.error);
  const user = await adviser();
  if (user === null) return err("UNAUTHENTICATED", LOG_IN);
  if (!user) return err("FORBIDDEN", NOT_ADVISER);
  const w = slotWindow(new Date(), parsed.data.days, parsed.data.from);
  return mySlots(user.id, w.from, w.to);
}

/** Opens or closes times and blocks or unblocks days. Booked and requested times stay as they are. */
export async function setAvailability(input: unknown): Promise<Result<AvailabilitySaved>> {
  const parsed = availabilityInput.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const user = await adviser();
  if (user === null) return err("UNAUTHENTICATED", LOG_IN);
  if (!user) return err("FORBIDDEN", NOT_ADVISER);
  return saveAvailability(user.id, parsed.data);
}

/** Students per target job, among those who allow adviser visibility. Groups under 5 never leave Postgres. */
export async function getCohort(): Promise<Result<CohortRow[]>> {
  const user = await currentUser();
  if (!user) return err("UNAUTHENTICATED", LOG_IN);
  const rows = await cohortRows();
  if (!rows.ok) return rows;
  return ok(aggregate(rows.value.map((r) => ({ group: r.target, count: r.students }))));
}
