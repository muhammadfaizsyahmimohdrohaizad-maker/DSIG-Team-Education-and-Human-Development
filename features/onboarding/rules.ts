// Pure helpers for consent and parent approval (FR-CON-01, FR-CON-02). Unit-tested in tests/unit/backend-onboarding.test.ts.
import { createHash, randomBytes } from "node:crypto";
import type { ConsentKind } from "../../lib/types.ts";

/** Version of the Terms and Privacy Notice the consent wording belongs to. Bump when the notice changes. */
export const NOTICE_VERSION = "2026-11";

export const PARENT_LINK_DAYS = 7;

export type ParentToken = { token: string; hash: string; expiresAt: string };

export function hashToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

/** 32 random bytes as base64url (43 characters). Only the SHA-256 hash is stored. */
export function newParentToken(now: Date = new Date()): ParentToken {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(now.getTime() + PARENT_LINK_DAYS * 24 * 60 * 60 * 1000).toISOString();
  return { token, hash: hashToken(token), expiresAt };
}

export type SignUpConsents = { termsPrivacy: boolean; storeUse: boolean; aiProcessing: boolean; adviserVisibility: boolean };

/** One consent row per choice on the sign-up form, in a fixed order. */
export function consentRows(c: SignUpConsents): { kind: ConsentKind; given: boolean }[] {
  return [
    { kind: "terms_privacy", given: c.termsPrivacy },
    { kind: "store_use", given: c.storeUse },
    { kind: "ai_processing", given: c.aiProcessing },
    { kind: "adviser_visibility", given: c.adviserVisibility },
  ];
}

export type ParentLinkState = "open" | "expired" | "used";

export function parentLinkState(row: { expires_at: string; decision: boolean | null }, now: Date = new Date()): ParentLinkState {
  if (row.decision !== null) return "used";
  return new Date(row.expires_at).getTime() <= now.getTime() ? "expired" : "open";
}

/** The parent email carries the link and its expiry only, no student data (System Design 5.3). */
export function parentApprovalEmail(siteUrl: string, token: string): { subject: string; text: string } {
  const link = `${siteUrl.replace(/\/+$/, "")}/parent-consent/${token}`;
  return {
    subject: "A student needs your OK to use CareerPrep",
    text: [
      "Hello,",
      "",
      "A student at the German-Malaysian Institute signed up for CareerPrep and named you as their parent or guardian.",
      "Because they are under 18, their account stays locked until you agree.",
      "",
      `Review and decide: ${link}`,
      "",
      `The link works for ${PARENT_LINK_DAYS} days and only once. If you don't recognise this, ignore the email and the account will not open.`,
    ].join("\n"),
  };
}

/** "y•••@example.com": enough for the student to recognise the address without echoing it in full. */
export function maskEmail(address: string): string {
  const at = address.lastIndexOf("@");
  if (at < 1) return "•••";
  return `${address[0]}•••${address.slice(at)}`;
}
