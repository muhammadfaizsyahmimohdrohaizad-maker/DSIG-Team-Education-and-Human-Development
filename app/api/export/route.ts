import { NextResponse } from "next/server";
import { currentUser } from "@/server/data/supabase";

// FR-ACC-01: a student downloads everything CareerPrep holds about them as JSON.
export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Log in first" }, { status: 401 });
  // To build: read each D1-D7 table under RLS for this user and stream it as an attachment.
  return NextResponse.json({ error: "Export is not built yet" }, { status: 501 });
}
