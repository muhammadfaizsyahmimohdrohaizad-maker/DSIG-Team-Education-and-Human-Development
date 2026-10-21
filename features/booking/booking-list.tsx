import { Card } from "@/components/ui/card";
import { StatusChip } from "@/components/ui/status-chip";
import { SubmitButton } from "@/components/ui/submit-button";
import { slotLabel } from "@/lib/date";
import type { Booking } from "@/lib/types";
import { cancelRequest } from "./actions";

export function BookingList({ bookings, adviserName }: { bookings: Booking[]; adviserName: string }) {
  return (
    <ul className="stack">
      {bookings.map((b) => {
        const canCancel = b.status === "requested" || b.status === "accepted";
        return (
          <li key={b.id}>
            <Card className="stack" aria-labelledby={`bk-${b.id}`}>
              <div className="row-between">
                <h3 id={`bk-${b.id}`}>{slotLabel(b.slot)}</h3>
                <div className="row">
                  <StatusChip status={b.status} />
                  {b.changedSinceViewed ? <span className="secondary" style={{ fontWeight: 500 }}>Updated</span> : null}
                </div>
              </div>
              <p className="secondary muted">
                With {adviserName}
                {b.status === "cancelled" ? (b.cancelledBy === "adviser" ? " · cancelled by your adviser" : " · cancelled by you") : ""}
              </p>
              {b.note ? <p className="prose">Your note: “{b.note}”</p> : null}
              {b.status === "cancelled" && b.cancelledBy === "adviser" && b.cancelReason ? (
                <p className="notice notice-warn">Your adviser cancelled this session. Reason: “{b.cancelReason}”</p>
              ) : null}
              {canCancel ? (
                <form action={cancelRequest}>
                  <input type="hidden" name="bookingId" value={b.id} />
                  <SubmitButton variant="secondary">Cancel request</SubmitButton>
                </form>
              ) : null}
            </Card>
          </li>
        );
      })}
    </ul>
  );
}
