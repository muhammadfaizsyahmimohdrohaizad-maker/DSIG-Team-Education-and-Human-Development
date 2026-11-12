import { demoRoutes } from "./lib/demo-routes";
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Refreshes the Supabase session on every request and keeps each role on its own pages.
const STUDENT = ["/dashboard", "/about-you", "/map", "/skill-gap", "/plan", "/book", "/settings"];
const ADVISER = ["/adviser"];
const STAFF_SETUP = ["/staff"];
const INSTITUTION = ["/institution"];

export async function middleware(req: NextRequest) {
  // Public presentation screens are rewritten to isolated fixture-only components.
  const route = req.nextUrl.pathname.split("/").filter(Boolean);
  if (demoRoutes.some(pattern => {
    const parts = pattern.split("/");
    return parts.length === route.length && parts.every((part, i) => part.startsWith(":") || part === route[i]);
  })) {
    const destination = req.nextUrl.clone();
    destination.pathname = "/showcase/" + route.join("/");
    return NextResponse.rewrite(destination);
  }
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

  // Role comes from the custom access-token hook (System Design 5.2); RLS enforces it again.
  const role = (data.user?.app_metadata as { role?: string } | undefined)?.role;
  const under = (list: string[]) => list.some((p) => path === p || path.startsWith(`${p}/`));
  if (role === "student" && (under(ADVISER) || under(STAFF_SETUP))) return NextResponse.redirect(new URL("/careerprep/dashboard", req.url));
  if (role === "adviser" && under(STUDENT)) return NextResponse.redirect(new URL("/careerprep/adviser/requests", req.url));
  if (role !== "institution" && under(INSTITUTION)) return NextResponse.redirect(new URL(role === "adviser" ? "/careerprep/adviser/requests" : "/careerprep/dashboard", req.url));
  if (role === "institution" && (under(STUDENT) || under(ADVISER) || under(STAFF_SETUP))) return NextResponse.redirect(new URL("/careerprep/institution", req.url));

  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|api/cron).*)"],
};


