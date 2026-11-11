import "server-only";
import type { ConsentKind } from "../../lib/types.ts";
import { db } from "./supabase.ts";

/** Latest choice for one consent kind. Consents are append-only, so the newest row wins. */
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

export async function recordConsent(userId: string, kind: ConsentKind, given: boolean, noticeVersion: string, givenBy: "self" | "parent" = "self") {
  return (await db()).from("consents").insert({ user_id: userId, kind, given, notice_version: noticeVersion, given_by: givenBy });
}
