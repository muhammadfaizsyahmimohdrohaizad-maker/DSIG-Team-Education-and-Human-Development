import { NextResponse } from "next/server";
import { acceptedBookingsBetween } from "@/server/data/bookings";
import { env } from "@/server/env";
import { cronAuthorized } from "@/features/account/rules";
import { sendNotice } from "@/features/booking/notify";
import { malaysiaDay } from "@/features/booking/rules";

// Daily at 09:00 Malaysia time (vercel.json, 01:00 UTC). Vercel sends "Authorization: Bearer $CRON_SECRET".
// One "due tomorrow" email per accepted booking that starts tomorrow in Malaysia time (UTC+08:00).
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: Request) {
  if (!cronAuthorized(req.headers.get("authorization"), env().CRON_SECRET)) {
    return NextResponse.json({ error: "Not allowed" }, { status: 401 });
  }
  const tomorrow = malaysiaDay(new Date(), 1);
  const due = await acceptedBookingsBetween(tomorrow.from, tomorrow.to);
  if (!due.ok) return NextResponse.json({ error: due.error.message, ref: due.error.ref }, { status: 500 });

  let sent = 0;
  let failed = 0;
  for (const b of due.value) {
    const okSent = await sendNotice({ to: b.studentId, kind: "reminder", bookingId: b.bookingId, start: b.start, minutes: b.minutes, adviserName: b.adviserName })
      .catch(() => false);
    if (okSent) sent++;
    else failed++;
  }
  return NextResponse.json({ window: tomorrow, due: due.value.length, sent, failed });
}
