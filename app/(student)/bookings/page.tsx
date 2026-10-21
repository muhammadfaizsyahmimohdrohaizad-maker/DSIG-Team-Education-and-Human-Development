import type { Metadata } from "next";
import Link from "next/link";
import { btn } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { BookingList } from "@/features/booking/booking-list";
import { MarkViewed } from "@/features/booking/mark-viewed";
import { getStore } from "@/server/data";

export const metadata: Metadata = { title: "My bookings" };

export default async function BookingsPage() {
  const store = getStore();
  const [all, adviser] = await Promise.all([store.listBookings(), store.getAdviser()]);
  const mine = all.filter((b) => b.studentId === "aina").sort((a, b) => (a.slot < b.slot ? -1 : 1));
  const upcoming = mine.filter((b) => b.status === "requested" || b.status === "accepted");
  const past = mine.filter((b) => !(b.status === "requested" || b.status === "accepted")).reverse();

  return (
    <div className="stack-lg">
      <div className="row-between">
        <div className="page-head">
          <h1>My bookings</h1>
          <p>Status changes show here first. You also get an email when your adviser accepts, declines or cancels.</p>
        </div>
        <Link href="/bookings/new" className={btn("primary")}>Request a session</Link>
      </div>

      {mine.length === 0 ? (
        <Card flush>
          <EmptyState title="No bookings yet" action={<Link href="/bookings/new" className={btn("primary")}>Request a session</Link>}>
            Ask an adviser to review your target role and gaps.
          </EmptyState>
        </Card>
      ) : (
        <>
          {upcoming.length > 0 ? (
            <section className="stack" aria-labelledby="up-title">
              <h2 id="up-title">Upcoming</h2>
              <BookingList bookings={upcoming} adviserName={adviser.name} />
            </section>
          ) : null}
          {past.length > 0 ? (
            <section className="stack" aria-labelledby="past-title">
              <h2 id="past-title">Past</h2>
              <BookingList bookings={past} adviserName={adviser.name} />
            </section>
          ) : null}
        </>
      )}
      <MarkViewed pending={mine.some((b) => b.changedSinceViewed)} />
    </div>
  );
}
