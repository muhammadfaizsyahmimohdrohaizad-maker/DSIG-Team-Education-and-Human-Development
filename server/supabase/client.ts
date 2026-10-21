import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "../env";

/** A client that acts as the signed-in user, so row-level security applies to every query. */
export async function supabaseServer(): Promise<SupabaseClient> {
  const jar = await cookies();
  return createServerClient(env.NEXT_PUBLIC_SUPABASE_URL!, env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => jar.getAll(),
      setAll: (list) => {
        try {
          list.forEach(({ name, value, options }) => jar.set(name, value, options));
        } catch {
          // Called from a server component, where cookies are read-only. middleware.ts refreshes them.
        }
      },
    },
  });
}

/** The signed-in user for this request, looked up once per request. */
export const session = cache(async () => {
  const sb = await supabaseServer();
  const { data } = await sb.auth.getUser();
  return { sb, user: data.user };
});

/**
 * Bypasses row-level security. Server only, and only for the few things a user may not do
 * themselves: making a staff account and reading a student's email address for a status email.
 */
export function supabaseAdmin(): SupabaseClient {
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL!, env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
