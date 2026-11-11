import "server-only";
// Signed-in check and safe errors for the interview and review actions (System Design 2.5).
import type { z } from "zod";
import { err, type Result } from "@/lib/result";
import { currentUser } from "@/server/data/supabase";
import { RpcRefused } from "@/server/data/interview";

export async function asStudent<T>(what: string, fn: (userId: string) => Promise<Result<T>>): Promise<Result<T>> {
  try {
    const user = await currentUser();
    if (!user) return err("UNAUTHENTICATED", "Your session has ended. Log in again to carry on.");
    return await fn(user.id);
  } catch (e) {
    if (e instanceof RpcRefused) {
      if (e.token === "account_locked") return err("FORBIDDEN", "Your account is waiting for a parent or guardian to approve it.");
      if (e.token === "not_found") return err("NOT_FOUND", "That question or answer no longer exists. Start the interview again.");
      if (e.token === "answer_required") return err("VALIDATION", "Write an answer or choose Skip.", { text: "Write an answer or choose Skip" });
      if (e.token === "forbidden") return err("FORBIDDEN", "Only student accounts can do this.");
      if (e.token === "ai_not_allowed") return err("FORBIDDEN", "AI is off for your account, so AI-made cards can't be saved. Use your headings and bold words instead.");
    }
    const r = err("UNEXPECTED", "Something went wrong. Try again.");
    if (!r.ok) console.error(`[${r.error.ref}] ${what}:`, e instanceof Error ? e.message : e);
    return r;
  }
}

export function invalid(error: z.ZodError): Result<never> {
  return err("VALIDATION", "Check the highlighted fields.", Object.fromEntries(error.issues.map((i) => [i.path.join("."), i.message])));
}
