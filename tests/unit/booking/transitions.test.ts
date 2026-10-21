import { describe, expect, it } from "vitest";
import { actionsFor, applyAction } from "@/lib/booking/transitions";
import type { Booking } from "@/lib/types";

const base: Booking = { id: "b", studentId: "aina", slot: "2026-10-22T10:00", status: "requested", changedSinceViewed: false };

describe("applyAction", () => {
  it("lets the adviser accept a request and flags the change for the student", () => {
    const r = applyAction(base, "accept", "adviser");
    expect(r.ok && r.booking.status).toBe("accepted");
    expect(r.ok && r.booking.changedSinceViewed).toBe(true);
  });

  it("only completes an accepted booking", () => {
    expect(applyAction(base, "complete", "adviser").ok).toBe(false);
    const accepted = { ...base, status: "accepted" as const };
    expect(applyAction(accepted, "complete", "adviser").ok).toBe(true);
  });

  it("requires a reason when the adviser cancels, and stores it", () => {
    const accepted = { ...base, status: "accepted" as const };
    expect(applyAction(accepted, "cancel", "adviser", "  ").ok).toBe(false);
    const r = applyAction(accepted, "cancel", "adviser", "At a careers fair");
    expect(r.ok && r.booking).toMatchObject({ status: "cancelled", cancelledBy: "adviser", cancelReason: "At a careers fair" });
  });

  it("lets the student cancel without a reason but not accept", () => {
    expect(applyAction(base, "cancel", "student").ok).toBe(true);
    expect(applyAction(base, "accept", "student").ok).toBe(false);
  });

  it("ends in declined, completed and cancelled", () => {
    for (const status of ["declined", "completed", "cancelled"] as const) {
      expect(actionsFor(status, "adviser")).toEqual([]);
      expect(actionsFor(status, "student")).toEqual([]);
    }
  });
});

describe("actionsFor", () => {
  it("matches the buttons on the adviser dashboard", () => {
    expect(actionsFor("requested", "adviser")).toEqual(["accept", "decline"]);
    expect(actionsFor("requested", "student")).toEqual(["cancel"]);
    expect(actionsFor("accepted", "adviser")).toEqual(["complete", "cancel"]);
  });
});
