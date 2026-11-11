"use server";

// auth: sign-up, log-in and password reset (log-out is POST /auth/sign-out) (FR-AUTH-01..03, System Design 5.1).
// Each action validates with Zod, calls server/data, and returns a Result.
import { err, invalid, ok, unexpected, type Result } from "@/lib/result";
import type { Role } from "@/lib/types";
import { newPasswordInput } from "@/lib/schemas";
import { logInInput, passwordResetInput, signUpForm } from "./schemas";
import {
  authSendPasswordReset, authSignIn, authSignOut, authSignUp, authUpdatePassword, deleteAuthUser,
  hasCurrentUndertaking, insertAccountRows, ownProfile, refreshSession, setAuthRole, touchLastLogin,
} from "@/server/data/account";
import { currentUser } from "@/server/data/supabase";
import { env } from "@/server/env";
import { startParentApproval } from "@/features/onboarding/parent";
import { NOTICE_VERSION, consentRows } from "@/features/onboarding/rules";
import { homeFor, staffCodeMatches } from "./rules";

export type SignUpResult = {
  userId: string;
  role: Role;
  /** confirm_email: we sent a confirmation link. parent_approval: under 18, waiting for the parent. signed_in: go to redirectTo. */
  nextStep: "confirm_email" | "parent_approval" | "signed_in";
  /** True when Supabase sent an email confirmation link (no session yet), whatever the next step. */
  confirmEmail: boolean;
  redirectTo: string;
};

export async function signUp(input: unknown): Promise<Result<SignUpResult>> {
  const parsed = signUpForm.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const v = parsed.data;

  if (v.role === "adviser" && !staffCodeMatches(v.staffCode ?? "", env().STAFF_CODE_HASHES)) {
    return err("VALIDATION", "Check the highlighted fields.", {
      staffCode: "That staff code doesn't match our list. Check it with GMI Career Services, or sign up as a student.",
    });
  }
  const isUnder18 = v.role === "student" && v.isUnder18;
  const next = v.role === "adviser" ? "/staff/undertaking" : "/dashboard";

  const created = await authSignUp(v.email, v.password, `${env().SITE_URL.replace(/\/+$/, "")}/auth/callback?next=${encodeURIComponent(next)}`);
  if (!created.ok) return created;
  const { userId, hasSession } = created.value;

  // Role and profile must both exist, or the account is removed so the email can be used again.
  const stored = (await setAuthRole(userId, v.role)) && (await insertAccountRows({
    userId, role: v.role, fullName: v.fullName, isUnder18, consents: consentRows(v.role, v.consents), noticeVersion: NOTICE_VERSION,
  }));
  if (!stored) {
    await deleteAuthUser(userId);
    if (hasSession) await authSignOut("local");
    return unexpected("signUp", `rows not stored for user=${userId}`);
  }
  if (hasSession) await refreshSession();

  if (isUnder18 && v.parentEmail) {
    const started = await startParentApproval(userId, v.parentEmail);
    if (!started) console.error(`[signUp] parent approval not stored user=${userId}`);
    return ok({ userId, role: v.role, nextStep: "parent_approval", confirmEmail: !hasSession, redirectTo: "/dashboard" });
  }
  return ok({ userId, role: v.role, nextStep: hasSession ? "signed_in" : "confirm_email", confirmEmail: !hasSession, redirectTo: next });
}

export type LogInResult = { role: Role; redirectTo: string; locked: boolean };

export async function logIn(input: unknown): Promise<Result<LogInResult>> {
  const parsed = logInInput.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);

  const signedIn = await authSignIn(parsed.data.email, parsed.data.password);
  if (!signedIn.ok) return signedIn;
  const { userId } = signedIn.value;

  const profile = await ownProfile(userId);
  if (!profile) {
    await authSignOut("local");
    return err("FORBIDDEN", "We couldn't find a CareerPrep profile for this account. Sign up again, or contact GMI Career Services.");
  }
  await touchLastLogin(userId);
  const role = signedIn.value.role ?? profile.role;
  const undertaking = role === "adviser" ? await hasCurrentUndertaking(userId) : false;
  return ok({ role, redirectTo: homeFor(role, undertaking), locked: profile.locked });
}

/** Always answers the same way, so it never tells anyone whether an email has an account. */
export async function requestPasswordReset(input: unknown): Promise<Result<{ sent: true }>> {
  const parsed = passwordResetInput.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const back = `${env().SITE_URL.replace(/\/+$/, "")}/auth/callback?next=${encodeURIComponent("/sign-in?mode=new-password")}`;
  const sent = await authSendPasswordReset(parsed.data.email, back);
  if (!sent.ok) return sent;
  return ok({ sent: true });
}

/** Second half of the reset: the email link signs the user in, then they choose a new password. */
export async function setNewPassword(input: unknown): Promise<Result<{ redirectTo: string }>> {
  const parsed = newPasswordInput.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const user = await currentUser();
  if (!user) return err("UNAUTHENTICATED", "This reset link has expired or was already used. Ask for a new one from the log-in page.");
  const updated = await authUpdatePassword(parsed.data.password);
  if (!updated.ok) return updated;
  const role = (user.app_metadata as { role?: Role } | undefined)?.role;
  const undertaking = role === "adviser" ? await hasCurrentUndertaking(user.id) : false;
  return ok({ redirectTo: homeFor(role, undertaking) });
}
