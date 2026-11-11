import { describe, expect, it } from "vitest";
import {
  consentRows, hashToken, maskEmail, newParentToken, parentApprovalEmail, parentLinkState, PARENT_LINK_DAYS,
} from "@/features/onboarding/rules.ts";

describe("parent approval token (FR-CON-02)", () => {
  const now = new Date("2026-11-11T02:00:00Z");

  it("is 43 url-safe characters, stored only as its SHA-256 hash, valid for 7 days", () => {
    const t = newParentToken(now);
    expect(t.token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(t.hash).toBe(hashToken(t.token));
    expect(t.hash).toMatch(/^[0-9a-f]{64}$/);
    expect(t.hash).not.toContain(t.token);
    expect(new Date(t.expiresAt).getTime() - now.getTime()).toBe(PARENT_LINK_DAYS * 86_400_000);
  });

  it("is different every time", () => {
    expect(newParentToken(now).token).not.toBe(newParentToken(now).token);
  });

  it("is open until it expires or is used", () => {
    expect(parentLinkState({ expires_at: "2026-11-18T02:00:00Z", decision: null }, now)).toBe("open");
    expect(parentLinkState({ expires_at: "2026-11-11T02:00:00Z", decision: null }, now)).toBe("expired");
    expect(parentLinkState({ expires_at: "2026-11-18T02:00:00Z", decision: false }, now)).toBe("used");
    expect(parentLinkState({ expires_at: "2026-11-01T02:00:00Z", decision: true }, now)).toBe("used");
  });
});

describe("parent email", () => {
  it("carries the link and expiry only", () => {
    const m = parentApprovalEmail("https://careerprep.example/", "TOKEN123");
    expect(m.text).toContain("https://careerprep.example/parent-consent/TOKEN123");
    expect(m.text).toContain("7 days");
    expect(m.subject).not.toMatch(/@/);
  });
  it("masks the address shown back to the student", () => {
    expect(maskEmail("yusof.family@example.com")).toBe("y•••@example.com");
    expect(maskEmail("nope")).toBe("•••");
  });
});

describe("sign-up consent rows (FR-CON-01)", () => {
  it("writes one row per choice for a student, optional ones as chosen", () => {
    expect(consentRows("student", { termsPrivacy: true, storeUse: true, aiProcessing: false, adviserVisibility: true })).toEqual([
      { kind: "terms_privacy", given: true },
      { kind: "store_use", given: true },
      { kind: "ai_processing", given: false },
      { kind: "adviser_visibility", given: true },
    ]);
  });
  it("writes only the Terms and Privacy row for an adviser, who never sees the other boxes", () => {
    expect(consentRows("adviser", { termsPrivacy: true, aiProcessing: false, adviserVisibility: false })).toEqual([
      { kind: "terms_privacy", given: true },
    ]);
  });
});
