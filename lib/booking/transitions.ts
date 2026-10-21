import type { Booking, BookingStatus } from "../types";

export type BookingAction = "accept" | "decline" | "complete" | "cancel";
export type Actor = "student" | "adviser";

type Rule = { to: BookingStatus; by: Actor[] };

// Mirrors docs/03-architecture.md figure 3.14. The student can only cancel;
// the adviser cancels an accepted booking, never a request (they decline it).
const RULES: Record<BookingStatus, Partial<Record<BookingAction, Rule>>> = {
  requested: {
    accept: { to: "accepted", by: ["adviser"] },
    decline: { to: "declined", by: ["adviser"] },
    cancel: { to: "cancelled", by: ["student"] },
  },
  accepted: {
    complete: { to: "completed", by: ["adviser"] },
    cancel: { to: "cancelled", by: ["student", "adviser"] },
  },
  declined: {},
  completed: {},
  cancelled: {},
};

export type TransitionResult = { ok: true; booking: Booking } | { ok: false; error: string };

export function actionsFor(status: BookingStatus, actor: Actor): BookingAction[] {
  const rules = RULES[status];
  return (Object.keys(rules) as BookingAction[]).filter((a) => rules[a]?.by.includes(actor));
}

export function applyAction(
  booking: Booking,
  action: BookingAction,
  actor: Actor,
  reason?: string,
): TransitionResult {
  const rule = RULES[booking.status][action];
  if (!rule || !rule.by.includes(actor)) {
    return { ok: false, error: `A ${booking.status} booking can't be changed that way.` };
  }
  const cleanReason = reason?.trim();
  if (action === "cancel" && actor === "adviser" && !cleanReason) {
    return { ok: false, error: "Add a reason. The student will see it." };
  }
  const cancelled =
    action === "cancel"
      ? { cancelledBy: actor, cancelReason: actor === "adviser" ? cleanReason : undefined }
      : {};
  return {
    ok: true,
    booking: { ...booking, ...cancelled, status: rule.to, changedSinceViewed: actor === "adviser" },
  };
}
