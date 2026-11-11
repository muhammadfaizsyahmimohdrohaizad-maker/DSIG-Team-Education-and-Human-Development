import { describe, expect, it } from "vitest";
import { confirmationMatches, cronAuthorized, exportFileName, monthsBefore } from "@/features/account/rules.ts";
import { invalid } from "@/lib/result.ts";

describe("delete confirmation (FR-ACC-02)", () => {
  it("matches the full name, ignoring case and extra spaces", () => {
    expect(confirmationMatches("Aina Rahman", "Aina Rahman")).toBe(true);
    expect(confirmationMatches("  aina   RAHMAN ", "Aina Rahman")).toBe(true);
  });
  it("rejects anything else, including an empty name", () => {
    expect(confirmationMatches("Aina", "Aina Rahman")).toBe(false);
    expect(confirmationMatches("delete", "Aina Rahman")).toBe(false);
    expect(confirmationMatches("", "")).toBe(false);
  });
});

describe("12-month retention (NFR-08)", () => {
  it("goes back twelve calendar months", () => {
    expect(monthsBefore(new Date("2026-11-11T19:00:00Z"), 12).toISOString()).toBe("2025-11-11T19:00:00.000Z");
  });
  it("clamps to the end of a shorter month", () => {
    expect(monthsBefore(new Date("2026-03-31T00:00:00Z"), 1).toISOString()).toBe("2026-02-28T00:00:00.000Z");
    expect(monthsBefore(new Date("2028-02-29T00:00:00Z"), 12).toISOString()).toBe("2027-02-28T00:00:00.000Z");
  });
});

describe("cron secret", () => {
  it("accepts only the exact bearer header", () => {
    const secret = "a-very-long-random-secret";
    expect(cronAuthorized(`Bearer ${secret}`, secret)).toBe(true);
    expect(cronAuthorized(`Bearer ${secret}x`, secret)).toBe(false);
    expect(cronAuthorized(secret, secret)).toBe(false);
    expect(cronAuthorized(null, secret)).toBe(false);
    expect(cronAuthorized("Bearer ", undefined)).toBe(false);
  });
});

describe("export", () => {
  it("names the file by the Malaysian date", () => {
    expect(exportFileName(new Date("2026-11-11T17:00:00Z"))).toBe("careerprep-my-data-2026-11-12.json");
  });
});

describe("validation results", () => {
  it("keep the first message per field", () => {
    const r = invalid({ issues: [
      { path: ["consents", "termsPrivacy"], message: "Tick this box to create an account" },
      { path: ["email"], message: "Enter an email" },
      { path: ["email"], message: "second" },
      { path: [], message: "whole form" },
    ] });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.fields).toEqual({ "consents.termsPrivacy": "Tick this box to create an account", email: "Enter an email", form: "whole form" });
  });
});
