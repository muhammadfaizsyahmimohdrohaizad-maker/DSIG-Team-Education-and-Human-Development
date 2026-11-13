import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink, ErrorState } from "@/components/ui";
import { getOpenSlots, listMyBookings } from "@/features/booking/actions";
import { BookForm } from "@/features/booking/book-form";

export const metadata: Metadata = { title: "Book an adviser" };

const pageTitle = "m-0 text-[clamp(1.75rem,3vw,2.25rem)] leading-[1.15] tracking-[-0.02em]";
const UPCOMING = new Set(["requested", "accepted", "change_requested"]);

// Book board. Search by institution, expertise, ratings and credentials is not built: the backend has no
// adviser profiles yet, so the list shows every adviser with a free time in the next 14 days.
export default async function BookPage() {
  const [slots, mine] = await Promise.all([getOpenSlots({ days: 14 }), listMyBookings()]);
  const upcoming = mine.ok ? mine.value.filter((b) => UPCOMING.has(b.status) && new Date(b.start) > new Date()).length : 0;

  return (
    <main id="main" className="mx-auto flex w-full max-w-[1280px] flex-1 flex-col gap-6 px-4 pb-16 pt-5 tablet:px-6 tablet:pt-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex max-w-[48rem] flex-col gap-1.5">
          <h1 className={pageTitle}>Book an adviser</h1>
          <p className="m-0">Pick a free time with a GMI career adviser and say what you want to talk about. They only see what you choose to share.</p>
        </div>
        <Link href="/book/appointments" className="inline-flex min-h-11 items-center gap-2 rounded-full border border-hairline px-4 font-semibold text-navy no-underline hover:bg-cream hover:text-navy">
          My appointments{upcoming ? <span className="rounded-full bg-maroon px-2 text-sm text-white">{upcoming} upcoming</span> : null}
        </Link>
      </div>
      {slots.ok ? (
        <BookForm slots={slots.value} />
      ) : (
        <ErrorState title="Free times didn't load." actions={<ButtonLink href="/book">Try again</ButtonLink>}>{slots.error.message}</ErrorState>
      )}
    </main>
  );
}
