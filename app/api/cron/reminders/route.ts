import { NextResponse } from "next/server";

// Daily at 09:00 Malaysia time (vercel.json). Vercel sends "Authorization: Bearer $CRON_SECRET".
// Sends "due tomorrow" booking emails and retries emails that failed earlier (System Design 2.5).
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Not allowed" }, { status: 401 });
  }
  // To build: select accepted bookings with slot_start tomorrow (UTC+08:00), send one email each via server/email.
  return NextResponse.json({ sent: 0, built: false });
}
