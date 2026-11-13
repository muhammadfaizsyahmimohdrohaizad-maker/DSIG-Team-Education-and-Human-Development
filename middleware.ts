import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Refreshes the Supabase session on every request and keeps each role on its own pages.
const STUDENT = ["/dashboard", "/about-you", "/map", "/skill-gap", "/plan", "/book", "/settings"];
const ADVISER = ["/adviser"];
const STAFF_SETUP = ["/staff"];
const INSTITUTION = ["/institution"];

export async function middleware(req: NextRequest) {
  let res = NextResponse.next({ request: req });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return res;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: (list) => {
        for (const { name, value } of list) req.cookies.set(name, value);
        res = NextResponse.next({ request: req });
        for (const { name, value, options } of list) res.cookies.set(name, value, options);
      },
    },
  });

  const { data } = await supabase.auth.getUser();
  const path = req.nextUrl.pathname;
  const needsAuth = [...STUDENT, ...ADVISER, ...STAFF_SETUP, ...INSTITUTION].some((p) => path === p || path.startsWith(`${p}/`));

  if (needsAuth && !data.user) {
    const to = req.nextUrl.clone();
    to.pathname = "/sign-in";
    to.searchParams.set("next", path);
    return NextResponse.redirect(to);
  }

  if (!needsAuth || !data.user) return res;
  const { data: role, error } = await supabase.rpc("app_role");
  if (error || !role) return new NextResponse("Could not load your account role. Refresh to retry.", { status: 503 });
  function redirectWithSession(path: string) {
    const redirect = NextResponse.redirect(new URL(path, req.url));
    for (const cookie of res.cookies.getAll()) redirect.cookies.set(cookie);
    return redirect;
  }
  const under = (list: string[]) => list.some((p) => path === p || path.startsWith(`${p}/`));
  if (role === "student" && (under(ADVISER) || under(STAFF_SETUP))) return redirectWithSession("/careerprep/dashboard");
  if (role === "adviser" && under(STUDENT)) return redirectWithSession("/careerprep/adviser/requests");
  if (role !== "institution" && under(INSTITUTION)) return redirectWithSession(role === "adviser" ? "/careerprep/adviser/requests" : "/careerprep/dashboard");
  if (role === "institution" && (under(STUDENT) || under(ADVISER) || under(STAFF_SETUP))) return redirectWithSession("/careerprep/institution");

  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|api/cron).*)"],
};



