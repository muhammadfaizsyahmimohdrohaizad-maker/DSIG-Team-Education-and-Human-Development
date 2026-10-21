import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cleanKey, normaliseSupabaseUrl } from "@/lib/supabase-url";

// Pages anyone can open without signing in.
const PUBLIC = ["/sign-in", "/sign-up", "/legal"];

/**
 * Keeps the Supabase session cookie fresh and sends signed-out visitors to the sign-in page.
 * Role and consent checks happen in the layouts, which can read the database.
 */
export async function middleware(request: NextRequest) {
  if ((process.env.DATA_MODE ?? "fixtures").trim().toLowerCase() !== "supabase") return NextResponse.next();

  const url = normaliseSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const anon = cleanKey(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  // Let the page show the setup error from server/env.ts instead of failing here.
  if (!url || !anon) return NextResponse.next();

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isPublic = PUBLIC.some((p) => path === p || path.startsWith(`${p}/`));
  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
    url.search = path === "/" ? "" : `?next=${encodeURIComponent(path)}`;
    return NextResponse.redirect(url);
  }
  return response;
}

export const config = {
  // Everything except static files and images.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|icon|apple-icon|.*\\.(?:png|jpg|svg|ico|webp)$).*)"],
};
