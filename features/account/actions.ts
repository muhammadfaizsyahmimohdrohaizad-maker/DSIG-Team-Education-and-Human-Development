"use server";

// account: consent changes and account deletion (FR-CON-03, FR-ACC-02). The data export is /api/export.
import { err, invalid, ok, unexpected, type Result } from "@/lib/result";
import type { ConsentKind } from "@/lib/types";
import { consentUpdate, deleteAccountInput } from "@/lib/schemas";
import { appendOwnConsent, authSignOut, consentHistory, deleteAuthUser, ownProfile, type ConsentEntry } from "@/server/data/account";
import { currentUser } from "@/server/data/supabase";
import { NOTICE_VERSION } from "@/features/onboarding/rules";
import { confirmationMatches } from "./rules";

export type { ConsentEntry };

const LOG_IN = "Log in to change your account.";

export type AccountDeleted = { deleted: true; redirectTo: string };

/**
 * The student types their full name to confirm. Deleting the Auth user cascades to every row
 * (profiles and everything that references it); audit rows stay 12 months by design.
 */
export async function deleteMyAccount(input: unknown): Promise<Result<AccountDeleted>> {
  const parsed = deleteAccountInput.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const user = await currentUser();
  if (!user) return err("UNAUTHENTICATED", LOG_IN);
  const profile = await ownProfile(user.id);
  if (!profile) return err("NOT_FOUND", "We couldn't find your profile. Log out and log in again, then try once more.");
  if (!confirmationMatches(parsed.data.confirmation, profile.fullName)) {
    return err("VALIDATION", "Check the highlighted fields.", { confirmation: `Type your full name exactly as it appears: ${profile.fullName}` });
  }
  if (!(await deleteAuthUser(user.id))) return unexpected("deleteMyAccount", `user=${user.id}`);
  await authSignOut("local").catch(() => undefined); // the user no longer exists; this only clears the cookies
  return ok({ deleted: true, redirectTo: "/" });
}

export type ConsentChanged = { kind: ConsentKind; given: boolean; at: string };

/** Appends a new consent row; the newest row per kind is the current choice. */
export async function updateConsent(input: unknown): Promise<Result<ConsentChanged>> {
  const parsed = consentUpdate.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const user = await currentUser();
  if (!user) return err("UNAUTHENTICATED", LOG_IN);
  const row = await appendOwnConsent(user.id, parsed.data.kind, parsed.data.given, NOTICE_VERSION);
  if (!row.ok) return row;
  return ok({ kind: row.value.kind, given: row.value.given, at: row.value.at });
}

export type MyConsents = { current: Partial<Record<ConsentKind, boolean>>; history: ConsentEntry[] };

/** Current choice per kind plus the full history, newest first, for Settings and privacy. */
export async function listMyConsents(): Promise<Result<MyConsents>> {
  const user = await currentUser();
  if (!user) return err("UNAUTHENTICATED", LOG_IN);
  const history = await consentHistory(user.id);
  if (!history.ok) return history;
  const current: Partial<Record<ConsentKind, boolean>> = {};
  for (const h of history.value) current[h.kind] ??= h.given;
  return ok({ current, history: history.value });
}
