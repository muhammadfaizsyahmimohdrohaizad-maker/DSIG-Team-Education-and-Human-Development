import "server-only";
import { slotLabel } from "@/lib/date";
import type { Booking } from "@/lib/types";
import { sendEmail } from "./send";

const SUBJECT: Record<string, string> = {
  accepted: "Your session is accepted",
  declined: "Your session request was declined",
  cancelled: "Your session was cancelled",
};

/** Status, time and a link. Nothing else about the student or the booking goes in an email. */
export async function sendBookingStatusEmail(booking: Booking, to: string): Promise<void> {
  const subject = SUBJECT[booking.status];
  if (!subject) return;
  await sendEmail({
    to,
    subject,
    text: `Status: ${booking.status}\nTime: ${slotLabel(booking.slot)}\nSee details: https://careerprep.example/bookings`,
  });
}
