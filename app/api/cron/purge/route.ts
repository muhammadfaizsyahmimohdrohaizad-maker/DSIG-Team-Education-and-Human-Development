import { NextResponse } from "next/server";

// NFR-08. Daily (vercel.json): deletes accounts with no log-in for 12 months through the Auth admin API,
// so every linked row cascades, and removes audit rows older than 12 months.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Not allowed" }, { status: 401 });
  }
  // To build: adminDb() -> select profiles.user_id where last_login_at < now() - 12 months;
  // auth.admin.deleteUser(id) for each; delete from audit_log where accessed_at < now() - 12 months.
  return NextResponse.json({ deleted: 0, built: false });
}
