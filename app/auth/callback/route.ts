import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/server/data/supabase";

// Email links from Supabase Auth (confirm sign-up, reset password) land here.
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const next = req.nextUrl.searchParams.get("next") ?? "/dashboard";
  const safeNext = next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\") ? next : "/dashboard";
  if (!code) return NextResponse.redirect(new URL("/careerprep/sign-in?link=invalid", req.url));
  const { error } = await (await db()).auth.exchangeCodeForSession(code);
  // Expired or already-used links send the user to log in, where the page explains how to get a new one.
  if (error) return NextResponse.redirect(new URL("/careerprep/sign-in?link=expired", req.url));
  return NextResponse.redirect(new URL(`/careerprep${safeNext}`, req.url));
}
