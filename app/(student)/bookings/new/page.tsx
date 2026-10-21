import type { Metadata } from "next";
import { BookingForm } from "@/features/booking/booking-form";
import { DEMO_TODAY } from "@/lib/config";
import { addDays } from "@/lib/date";
import { getStore } from "@/server/data";

export const metadata: Metadata = { title: "Talk to a human" };

export default async function NewBookingPage() {
  const adviser = await getStore().getAdviser();
  return (
    <div className="stack-lg">
      <div className="page-head">
        <p className="stage-label">Adviser hand-off</p>
        <h1>Talk to a human</h1>
        <p>Book a short session with your career adviser. Pick a time that suits you; she will accept it or suggest another.</p>
      </div>
      <BookingForm
        adviserName={adviser.name}
        unit={adviser.unit}
        minDate={DEMO_TODAY}
        defaultDate={addDays(DEMO_TODAY, 1)}
        defaultTime="10:00"
      />
    </div>
  );
}
