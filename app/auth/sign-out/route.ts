import { NextResponse, type NextRequest } from "next/server";
import { authSignOut } from "@/server/data/account";

// The header's Log out button posts here. Revokes the session (all devices), clears the cookies and
// goes to the homepage. POST only, from our own pages, so another site can't log people out.
export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin");
  if (origin && origin !== new URL(req.url).origin) return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  await authSignOut("global").catch(() => undefined);
  // 303 so the browser follows with GET.
  return NextResponse.redirect(new URL("/", req.url), 303);
}
