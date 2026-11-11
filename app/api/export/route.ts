import { NextResponse } from "next/server";
import { exportRows } from "@/server/data/account";
import { currentUser } from "@/server/data/supabase";
import { exportFileName } from "@/features/account/rules";

// FR-ACC-01: the signed-in user downloads everything CareerPrep holds about them as JSON.
// Read with the user's own JWT, so RLS applies, and each query is also scoped to their id.
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Log in first, then download your data again." }, { status: 401 });

  const rows = await exportRows(user.id);
  if (!rows.ok) {
    return NextResponse.json({ error: `${rows.error.message} (reference ${rows.error.ref})` }, { status: 500 });
  }
  const now = new Date();
  const body = JSON.stringify({
    exportedAt: now.toISOString(),
    account: { id: user.id, email: user.email ?? null, createdAt: user.created_at, lastSignInAt: user.last_sign_in_at ?? null },
    ...rows.value,
  }, null, 2);
  return new NextResponse(body, {
    status: 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": `attachment; filename="${exportFileName(now)}"`,
      "cache-control": "no-store",
    },
  });
}
