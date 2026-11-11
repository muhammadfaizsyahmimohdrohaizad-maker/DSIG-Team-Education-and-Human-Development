import "server-only";
import { after } from "next/server";
import { authEmail } from "@/server/data/account";
import { sendEmail } from "@/server/email/send";
import { env } from "@/server/env";
import { bookingEmail, type BookingEmailKind } from "./rules";

// Booking status emails. Sent after the database change has committed and after the response has
// gone back, so a slow or failing email never blocks or undoes a booking (System Design 2.5).

export type Notice = { to: string; kind: BookingEmailKind; bookingId: string; start: string; minutes?: number; adviserName?: string };

/** Absolute link for a notice: students go to their booking, advisers to Requests. */
export function noticeLink(n: Pick<Notice, "kind" | "bookingId">): string {
  const site = env().SITE_URL.replace(/\/+$/, "");
  const forAdviser = n.kind === "requested" || n.kind === "moved" || n.kind === "cancelled";
  return forAdviser ? `${site}/adviser/requests` : `${site}/book/${n.bookingId}`;
}

/** Sends one status email now. Returns whether it went; failures are logged with the booking id only. */
export async function sendNotice(n: Notice): Promise<boolean> {
  const address = await authEmail(n.to);
  if (!address) return false;
  const mail = bookingEmail({ kind: n.kind, start: n.start, minutes: n.minutes, adviserName: n.adviserName, link: noticeLink(n) });
  const res = await sendEmail({ to: address, ...mail });
  if (!res.ok) console.error(`[booking email] kind=${n.kind} booking=${n.bookingId} ref=${res.error.ref}`);
  return res.ok;
}

/** Queues status emails to run once the action has returned. */
export function notifyAfter(...notices: Notice[]): void {
  if (!notices.length) return;
  after(async () => {
    for (const n of notices) {
      try {
        await sendNotice(n);
      } catch (e) {
        console.error(`[booking email] kind=${n.kind} booking=${n.bookingId}`, e instanceof Error ? e.message : "");
      }
    }
  });
}
