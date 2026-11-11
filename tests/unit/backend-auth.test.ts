import { describe, expect, it } from "vitest";
import { authErrorFor, homeFor, sha256Hex, staffCodeMatches } from "@/features/auth/rules.ts";

describe("staff code check (FR-AUTH-02)", () => {
  const hashes = [sha256Hex("OTHER-CODE"), sha256Hex("GMI-ADV-2026")].join(",");

  it("accepts a listed code, ignoring case and spaces", () => {
    expect(staffCodeMatches("GMI-ADV-2026", hashes)).toBe(true);
    expect(staffCodeMatches("  gmi-adv-2026 ", hashes)).toBe(true);
  });

  it("rejects an unlisted, empty or partial code", () => {
    expect(staffCodeMatches("GMI-ADV-2025", hashes)).toBe(false);
    expect(staffCodeMatches("", hashes)).toBe(false);
    expect(staffCodeMatches("GMI-ADV", hashes)).toBe(false);
  });

  it("rejects everything when no hashes are configured, and skips malformed entries", () => {
    expect(staffCodeMatches("GMI-ADV-2026", "")).toBe(false);
    expect(staffCodeMatches("GMI-ADV-2026", `not-a-hash, ${sha256Hex("GMI-ADV-2026").toUpperCase()} `)).toBe(true);
  });

  it("hashes with SHA-256 hex", () => {
    expect(sha256Hex("abc")).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
  });
});

describe("landing page after log-in", () => {
  it("sends advisers to the undertaking until they accept it", () => {
    expect(homeFor("adviser", false)).toBe("/staff/undertaking");
    expect(homeFor("adviser", true)).toBe("/adviser/requests");
  });
  it("sends students and unknown roles to the dashboard, institution staff to /institution", () => {
    expect(homeFor("student", false)).toBe("/dashboard");
    expect(homeFor(undefined, false)).toBe("/dashboard");
    expect(homeFor("institution", false)).toBe("/institution");
  });
});

describe("auth error messages", () => {
  it("say how to fix the problem", () => {
    expect(authErrorFor("invalid_credentials")?.[1]).toMatch(/reset your password/);
    expect(authErrorFor("email_exists")?.[0]).toBe("CONFLICT");
    expect(authErrorFor("something_new")).toBeUndefined();
    expect(authErrorFor(undefined)).toBeUndefined();
  });
});
