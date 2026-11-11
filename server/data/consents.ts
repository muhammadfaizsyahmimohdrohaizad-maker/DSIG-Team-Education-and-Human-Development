import "server-only";
import type { ConsentKind } from "../../lib/types.ts";
import { db } from "./supabase.ts";

/**
 * Latest choice for one consent kind, read as the signed-in user. Consents are append-only and consented_at
 * is set by the database clock, so the newest row wins. Use before every AI call (ai_processing).
 * Writes: own choices go through the user's client (RLS: own rows, given_by 'self'); parent consents are
 * written by the server with the service role (server/data/account.ts).
 */
export async function latestConsent(userId: string, kind: ConsentKind): Promise<boolean> {
  const { data } = await (await db())
    .from("consents")
    .select("given")
    .eq("user_id", userId)
    .eq("kind", kind)
    .order("consented_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data?.given ?? false;
}
