import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/server/data/supabase";

// Email links from Supabase Auth (confirm sign-up, reset password) land here.
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const next = req.nextUrl.searchParams.get("next") ?? "/dashboard";
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
  if (code) await (await db()).auth.exchangeCodeForSession(code);
  return NextResponse.redirect(new URL(safeNext, req.url));
}
