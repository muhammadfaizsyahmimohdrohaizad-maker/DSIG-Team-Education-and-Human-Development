import "server-only";
// Shared wrapper for the fullstack server actions (matches, plan, learning, cv): signed-in check,
// Zod errors as field messages, and no raw error ever sent to the browser (System Design 2.5).
import type { z } from "zod";
import { err, type Result } from "@/lib/result";
import { currentUser } from "@/server/data/supabase";

export async function withUser<T>(what: string, fn: (userId: string) => Promise<Result<T>>): Promise<Result<T>> {
  try {
    const user = await currentUser();
    if (!user) return err("UNAUTHENTICATED", "Your session has ended. Log in again to carry on.");
    return await fn(user.id);
  } catch (e) {
    const r = err("UNEXPECTED", "Something went wrong. Try again.");
    if (!r.ok) console.error(`[${r.error.ref}] ${what}:`, e instanceof Error ? e.message : e);
    return r;
  }
}

export function invalid(error: z.ZodError): Result<never> {
  return err("VALIDATION", "Check the highlighted fields.", Object.fromEntries(error.issues.map((i) => [i.path.join("."), i.message])));
}
