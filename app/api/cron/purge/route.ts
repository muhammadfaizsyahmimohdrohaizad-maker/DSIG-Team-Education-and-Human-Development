import { NextResponse } from "next/server";
import { deleteAuditRowsBefore, deleteAuthUser, idleUserIds } from "@/server/data/account";
import { env } from "@/server/env";
import { cronAuthorized, monthsBefore } from "@/features/account/rules";

// NFR-08. Daily (vercel.json): deletes accounts with no log-in for 12 months through the Auth admin API,
// so every linked row cascades, and removes audit rows older than 12 months.
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const BATCH = 200; // per run; anything left goes the next day

export async function GET(req: Request) {
  if (!cronAuthorized(req.headers.get("authorization"), env().CRON_SECRET)) {
    return NextResponse.json({ error: "Not allowed" }, { status: 401 });
  }
  const cutoff = monthsBefore(new Date(), 12);

  const idle = await idleUserIds(cutoff, BATCH);
  if (!idle.ok) return NextResponse.json({ error: idle.error.message, ref: idle.error.ref }, { status: 500 });
  let deleted = 0;
  let failed = 0;
  for (const id of idle.value) {
    if (await deleteAuthUser(id)) deleted++;
    else failed++;
  }

  const audit = await deleteAuditRowsBefore(cutoff);
  if (!audit.ok) return NextResponse.json({ deleted, failed, error: audit.error.message, ref: audit.error.ref }, { status: 500 });
  return NextResponse.json({ cutoff: cutoff.toISOString(), deleted, failed, auditRowsDeleted: audit.value, more: idle.value.length === BATCH });
}
