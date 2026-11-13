import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink, Card, EmptyState, ErrorState, SoftPanel, StatusTag, type TagKind } from "@/components/ui";
import { getOpenSlots, listMyBookings } from "@/features/booking/actions";
import { SHARE_LABELS, SHARE_ORDER, STATUS_LABEL, firstName, whenLabel } from "@/features/booking/labels";
import { CancelBooking, MoveBooking } from "@/features/booking/manage";
import type { BookingState } from "@/lib/types";

export const metadata: Metadata = { title: "Appointment" };

const mainClasses = "mx-auto flex w-full max-w-[1280px] flex-1 flex-col gap-6 px-4 pb-16 pt-5 tablet:px-6 tablet:pt-8";
const pageTitle = "m-0 text-[clamp(1.75rem,3vw,2.25rem)] leading-[1.15] tracking-[-0.02em]";
const ACTIVE = new Set<BookingState>(["requested", "accepted", "change_requested"]);
const TAG: Partial<Record<BookingState, TagKind>> = { requested: "requested", change_requested: "requested", accepted: "accepted", declined: "declined", cancelled: "declined" };

// Appointment detail board. What is shared is fixed when the request is sent: changing it later needs a
// backend action that doesn't exist yet, so the list here is read-only.
export default async function BookingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const mine = await listMyBookings();
  if (!mine.ok) {
    return <main id="main" className={mainClasses}><ErrorState title="This appointment didn't load." actions={<ButtonLink href={`/book/${id}`}>Try again</ButtonLink>}>{mine.error.message}</ErrorState></main>;
  }
  const b = mine.value.find((x) => x.id === id);
  if (!b) {
    return (
      <main id="main" className={mainClasses}>
        <EmptyState title="We couldn't find this appointment" headingLevel={2} actions={<ButtonLink href="/book/appointments" className="self-start">See my appointments</ButtonLink>} />
      </main>
    );
  }

  const when = whenLabel(b.start);
  const active = ACTIVE.has(b.status) && new Date(b.start) > new Date();
  const free = active ? await getOpenSlots({ days: 14, adviserId: b.adviserId }) : null;
  const who = firstName(b.adviserName);

  return (
    <main id="main" className={mainClasses}>
      <div className="flex flex-col gap-2">
        <Link href="/book/appointments" className="inline-flex min-h-11 items-center self-start font-semibold">Back to my appointments</Link>
        <StatusTag kind={TAG[b.status] ?? "accepted"} label={STATUS_LABEL[b.status]} className="self-start" />
        <h1 className={pageTitle}>{when} with {b.adviserName}</h1>
      </div>

      <div className="flex flex-wrap items-start gap-6">
        <div className="flex min-w-0 flex-[999_1_560px] flex-col gap-4">
          <Card as="section" aria-labelledby="det-h" gap="gap-4">
            <h2 id="det-h" className="m-0 text-[22px]">Details</h2>
            <dl className="m-0 grid grid-cols-[repeat(auto-fit,minmax(min(200px,100%),1fr))] gap-3">
              <div><dt className="text-sm text-muted">Topic</dt><dd className="m-0 font-semibold text-navy">{b.topic}</dd></div>
              <div><dt className="text-sm text-muted">Length</dt><dd className="m-0 font-semibold text-navy">{b.minutes} minutes</dd></div>
              {b.note ? <div className="col-span-full"><dt className="text-sm text-muted">Your note</dt><dd className="m-0">{b.note}</dd></div> : null}
              {b.adviserNote ? <div className="col-span-full"><dt className="text-sm text-muted">Note from {who}</dt><dd className="m-0">{b.adviserNote}</dd></div> : null}
            </dl>
            <div className="flex flex-col gap-1">
              <b className="text-navy">What {who} can see</b>
              {b.shared.length ? (
                <ul className="m-0 flex flex-col gap-0.5 pl-5">{SHARE_ORDER.filter((k) => b.shared.includes(k)).map((k) => <li key={k}>{SHARE_LABELS[k]}</li>)}</ul>
              ) : <span>Nothing beyond your name, topic and note.</span>}
              <span className="text-sm text-muted">Shared items stay visible until the appointment ends, then close.</span>
            </div>
          </Card>

          {b.feedback ? (
            <Card as="section" aria-labelledby="fb-h" gap="gap-2">
              <h2 id="fb-h" className="m-0 text-[22px]">Feedback from {who}</h2>
              <p className="m-0">{b.feedback.text}</p>
              <span className="text-sm text-muted">Private: only you and {who}.</span>
            </Card>
          ) : null}

          {active ? (
            <div className="flex flex-wrap items-start gap-2">
              <MoveBooking bookingId={b.id} adviserName={b.adviserName} slots={free && free.ok ? free.value : []} />
              <CancelBooking bookingId={b.id} when={when} adviserName={b.adviserName} />
            </div>
          ) : b.status === "cancelled" ? (
            <SoftPanel gap="gap-2">
              <b className="text-navy">This session is cancelled.</b>
              <span>What you shared has been withdrawn.</span>
              <ButtonLink href="/book" className="self-start">Book another time</ButtonLink>
            </SoftPanel>
          ) : null}
        </div>

        <SoftPanel as="aside" aria-labelledby="rem-h" className="min-w-0 flex-[1_1_300px]" gap="gap-3">
          <h2 id="rem-h" className="m-0 text-xl">Reminder</h2>
          <p className="m-0 text-[15px]">We email you the day before. The email has the time and a link, nothing else.</p>
          <h2 className="m-0 text-xl">Before the session</h2>
          <ul className="m-0 flex flex-col gap-1 pl-5 text-[15px]">
            <li>Look over your saved study options.</li>
            <li>Write down two questions you want answered.</li>
          </ul>
        </SoftPanel>
      </div>
    </main>
  );
}
