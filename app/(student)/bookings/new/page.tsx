import type { Metadata } from "next";
import { BookingForm } from "@/features/booking/booking-form";
import { addDays, todayMY } from "@/lib/date";
import { getStore } from "@/server/data";

export const metadata: Metadata = { title: "Talk to a human" };

export default async function NewBookingPage() {
  const store = getStore();
  const [adviser, student, consent] = await Promise.all([store.getMyAdviser(), store.getStudent(), store.getConsent()]);
  const today = todayMY();
  return (
    <div className="stack-lg">
      <div className="page-head">
        <h1>Talk to a human</h1>
        <p>Book a short session with your career adviser. Pick a time that suits you; your adviser will accept it or suggest another.</p>
      </div>
      <BookingForm
        adviserName={adviser?.name ?? "A career adviser"}
        unit={adviser?.unit ?? "Career Services"}
        minDate={today}
        defaultDate={addDays(today, 1)}
        hasTarget={!!student.targetCode}
        sharesProgress={!!consent?.adviserVisibility}
        defaultTime="10:00"
      />
    </div>
  );
}
