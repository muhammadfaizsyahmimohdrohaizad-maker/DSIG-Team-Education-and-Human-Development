import { describe, expect, it } from "vitest";
import { bookingEmail, formatMyt, malaysiaDate, malaysiaDay, slotWindow } from "@/features/booking/rules.ts";
import { fromDb } from "@/lib/result.ts";

describe("Malaysia time (UTC+08:00)", () => {
  it("finds tomorrow's window from late evening Malaysia time", () => {
    // 23:30 on 11 Nov in Malaysia is 15:30 UTC.
    expect(malaysiaDay(new Date("2026-11-11T15:30:00Z"), 1)).toEqual({ from: "2026-11-11T16:00:00.000Z", to: "2026-11-12T16:00:00.000Z" });
  });
  it("finds tomorrow's window from early morning Malaysia time (still the previous day in UTC)", () => {
    // 01:00 on 12 Nov in Malaysia is 17:00 UTC on 11 Nov; tomorrow is 13 Nov.
    expect(malaysiaDay(new Date("2026-11-11T17:00:00Z"), 1)).toEqual({ from: "2026-11-12T16:00:00.000Z", to: "2026-11-13T16:00:00.000Z" });
  });
  it("matches the reminder cron at 01:00 UTC", () => {
    expect(malaysiaDay(new Date("2026-11-11T01:00:00Z"), 1).from).toBe("2026-11-11T16:00:00.000Z");
  });
  it("formats times for emails", () => {
    expect(formatMyt("2026-11-12T02:00:00Z")).toBe("Thu, 12 Nov, 10:00 am");
    expect(formatMyt("2026-11-19T06:00:00Z")).toBe("Thu, 19 Nov, 2:00 pm");
    expect(formatMyt("2026-11-12T04:30:00Z")).toBe("Thu, 12 Nov, 12:30 pm");
    expect(formatMyt("2026-11-11T16:15:00Z")).toBe("Thu, 12 Nov, 12:15 am");
    expect(malaysiaDate("2026-11-11T16:15:00Z")).toBe("2026-11-12");
  });
  it("reads open times from now, never from the past", () => {
    const now = new Date("2026-11-11T02:00:00Z");
    expect(slotWindow(now, 14, "2026-01-01T00:00:00Z").from).toBe(now.toISOString());
    expect(slotWindow(now, 1)).toEqual({ from: now.toISOString(), to: "2026-11-11T16:00:00.000Z" });
    expect(slotWindow(now, 2, "2026-11-20T00:00:00+08:00")).toEqual({ from: "2026-11-19T16:00:00.000Z", to: "2026-11-21T16:00:00.000Z" });
  });
});

describe("booking emails (System Design 5.3)", () => {
  const base = { start: "2026-11-12T02:00:00Z", minutes: 30, adviserName: "Pn. Nurul Huda", link: "https://x.example/book/1" };

  it("carry status, time and link", () => {
    const m = bookingEmail({ ...base, kind: "accepted" });
    expect(m.subject).toBe("Your session on Thu, 12 Nov, 10:00 am is confirmed");
    expect(m.text).toContain("Pn. Nurul Huda accepted your session.");
    expect(m.text).toContain("https://x.example/book/1");
  });
  it("word the decline as a request for a new time", () => {
    expect(bookingEmail({ ...base, kind: "declined" }).subject).toBe("Your session request needs a new time");
  });
  it("name tomorrow's time in the reminder subject", () => {
    expect(bookingEmail({ ...base, kind: "reminder" }).subject).toBe("Reminder: your session is tomorrow at 10:00 am");
  });
  it("never take topic, note or shared data as input", () => {
    for (const kind of ["requested", "moved", "change_requested", "cancelled", "accepted", "declined", "feedback", "reminder"] as const) {
      const m = bookingEmail({ ...base, kind });
      expect(m.subject.length).toBeGreaterThan(0);
      expect(m.text).toContain(base.link);
    }
  });
});

describe("database errors become safe results", () => {
  const known = { slot_taken: ["CONFLICT", "That time was just taken. Pick another."], "23505": ["CONFLICT", "Taken."] } as const;

  it("maps an RPC token by message, then by SQLSTATE", () => {
    const a = fromDb({ code: "P0001", message: "slot_taken" }, known, "t");
    expect(a.ok ? null : a.error.code).toBe("CONFLICT");
    expect(a.ok ? null : a.error.message).toBe("That time was just taken. Pick another.");
    const b = fromDb({ code: "23505", message: "duplicate key value violates unique constraint" }, known, "t");
    expect(b.ok ? null : b.error.message).toBe("Taken.");
  });
  it("hides anything unknown behind UNEXPECTED with a reference", () => {
    const original = console.error;
    console.error = () => {};
    const c = fromDb({ code: "XX000", message: "relation secret_table does not exist" }, known, "t");
    console.error = original;
    expect(c.ok).toBe(false);
    if (!c.ok) {
      expect(c.error.code).toBe("UNEXPECTED");
      expect(c.error.message).not.toContain("secret_table");
      expect(c.error.ref).toMatch(/^[A-Z0-9]+$/);
    }
  });
});
