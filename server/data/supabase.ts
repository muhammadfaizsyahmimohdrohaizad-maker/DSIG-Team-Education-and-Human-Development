import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../lib/database.types.ts";
import { env } from "../env.ts";

/** Per-request client that acts as the signed-in user, so row-level security applies to every query. */
export async function db() {
  const store = await cookies();
  const e = env();
  return createServerClient<Database>(e.NEXT_PUBLIC_SUPABASE_URL, e.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          for (const { name, value, options } of list) store.set(name, value, options);
        } catch {
          // Called from a Server Component: middleware refreshes the session instead.
        }
      },
    },
  });
}

/**
 * Service-role client. Bypasses RLS and every grant, so each use is scoped to one user id or one token hash,
 * and it is used ONLY for:
 * - sign-up: the profile and first consent rows, and setting app_metadata.role (the role source for RLS);
 * - the parent decision (/parent-consent/[token]): the approval row, the parent consent, the account lock;
 * - last_login_at on log-in, and looking up a user's email for status emails;
 * - marked mastery checks, interview answers with their marks, AI feedback and the ai_calls log (students
 *   cannot write any of these), and the reference import;
 * - the data export, account deletion and the cron jobs.
 * Never import it from a client component, and never pass it a value the user chose as an id.
 */
export function adminDb() {
  const e = env();
  if (!e.SUPABASE_SERVICE_ROLE_KEY) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  return createClient<Database>(e.NEXT_PUBLIC_SUPABASE_URL, e.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function currentUser() {
  const { data } = await (await db()).auth.getUser();
  return data.user ?? null;
}
