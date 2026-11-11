// Pure helpers for features/auth. No I/O, so they are unit-tested (tests/unit/backend-auth.test.ts).
import { createHash, timingSafeEqual } from "node:crypto";
import type { ErrorCode } from "../../lib/result.ts";
import type { Role } from "../../lib/types.ts";

export function sha256Hex(text: string): string {
  return createHash("sha256").update(text, "utf8").digest("hex");
}

/**
 * FR-AUTH-02. `hashesCsv` is STAFF_CODE_HASHES: comma-separated SHA-256 hex digests of the valid codes.
 * Codes are compared trimmed and upper-cased, in constant time per hash, and every hash is checked.
 */
export function staffCodeMatches(code: string, hashesCsv: string): boolean {
  const normalised = code.trim().toUpperCase();
  if (!normalised) return false;
  const digest = Buffer.from(sha256Hex(normalised), "hex");
  let match = false;
  for (const h of hashesCsv.split(",")) {
    const hex = h.trim().toLowerCase();
    if (!/^[0-9a-f]{64}$/.test(hex)) continue;
    if (timingSafeEqual(digest, Buffer.from(hex, "hex"))) match = true;
  }
  return match;
}

/** Where a signed-in user lands. */
export function homeFor(role: Role | undefined, hasUndertaking: boolean): string {
  if (role === "adviser") return hasUndertaking ? "/adviser/requests" : "/staff/undertaking";
  if (role === "institution") return "/institution";
  return "/dashboard";
}

/** Supabase Auth error codes → blameless messages that say how to fix it. */
const AUTH_ERRORS: Record<string, readonly [ErrorCode, string]> = {
  invalid_credentials: ["UNAUTHENTICATED", "That email and password don't match an account. Check both, or reset your password."],
  email_not_confirmed: ["FORBIDDEN", "Confirm your email first: open the link we sent you, then log in."],
  user_already_exists: ["CONFLICT", "There's already an account with this email. Log in, or reset your password."],
  email_exists: ["CONFLICT", "There's already an account with this email. Log in, or reset your password."],
  weak_password: ["VALIDATION", "Choose a longer password that isn't common or easy to guess."],
  over_request_rate_limit: ["CONFLICT", "Too many tries in a short time. Wait a few minutes, then try again."],
  over_email_send_rate_limit: ["CONFLICT", "We've sent several emails already. Wait a few minutes, then try again."],
  user_banned: ["FORBIDDEN", "This account is paused. Contact GMI Career Services to reopen it."],
  same_password: ["VALIDATION", "Choose a password you haven't used for this account before."],
};

export function authErrorFor(code: string | undefined): readonly [ErrorCode, string] | undefined {
  return code ? AUTH_ERRORS[code] : undefined;
}
