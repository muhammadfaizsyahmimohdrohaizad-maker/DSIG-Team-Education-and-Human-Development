import type { Metadata } from "next";
import { ButtonLink, ErrorState } from "@/components/ui";
import { getAvailability } from "@/features/adviser/actions";
import { AvailabilityGrid } from "@/features/adviser/availability-grid";

export const metadata: Metadata = { title: "Your availability" };

/** Monday of the next schedulable week in Malaysia time (UTC+8), as YYYY-MM-DD. Kept here so the server needs no client code. */
function thisMonday(): string {
  const myt = new Date(Date.now() + 8 * 3600e3);
  const dow = (myt.getUTCDay() + 6) % 7;
  const weekEnded = dow > 4 || (dow === 4 && (myt.getUTCHours() * 60 + myt.getUTCMinutes()) >= 16 * 60 + 30);
  return new Date(myt.getTime() + ((weekEnded ? 7 : 0) - dow) * 864e5).toISOString().slice(0, 10);
}

// Adviser: availability board.
export default async function AvailabilityPage() {
  const week = thisMonday();
  const result = await getAvailability({ from: `${week}T00:00:00+08:00`, days: 7 });
  return (
    <main id="main" className="mx-auto flex w-full max-w-[1280px] flex-1 flex-col gap-5 px-4 pb-16 pt-5 tablet:px-6 tablet:pt-8">
      <div className="flex max-w-[48rem] flex-col gap-1.5">
        <h1 className="m-0 text-[clamp(1.75rem,3vw,2.25rem)] leading-[1.15] tracking-[-0.02em]">Your availability</h1>
        <p className="m-0">Select a time to open or close it. Students can only request open times. Booked and requested times stay as they are.</p>
      </div>
      {result.ok
        ? <AvailabilityGrid initial={result.value} initialWeek={week} />
        : <ErrorState title="Your times didn't load." actions={<ButtonLink href="/adviser/availability">Try again</ButtonLink>}>{result.error.message}</ErrorState>}
    </main>
  );
}
