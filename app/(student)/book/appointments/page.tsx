import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink, Card, EmptyState, ErrorState, StatusMessage, StatusTag, type TagKind } from "@/components/ui";
import { listMyBookings } from "@/features/booking/actions";
import { SHARE_LABELS, SHARE_ORDER, STATUS_LABEL, firstName, initials, whenLabel } from "@/features/booking/labels";
import { CancelBooking } from "@/features/booking/manage";
import type { BookingState } from "@/lib/types";

export const metadata: Metadata = { title: "My appointments" };

const mainClasses = "mx-auto flex w-full max-w-[1280px] flex-1 flex-col gap-6 px-4 pb-16 pt-5 tablet:px-6 tablet:pt-8";
const pageTitle = "m-0 text-[clamp(1.75rem,3vw,2.25rem)] leading-[1.15] tracking-[-0.02em]";
const ACTIVE = new Set<BookingState>(["requested", "accepted", "change_requested"]);
const TAG: Partial<Record<BookingState, TagKind>> = { requested: "requested", change_requested: "requested", accepted: "accepted", declined: "declined", cancelled: "declined" };

// My appointments board: upcoming bookings with what was shared, and past ones with the adviser's private
// feedback. Agreed next steps and appointment ratings are not built: the backend has no tables for them yet.
export default async function AppointmentsPage({ searchParams }: { searchParams: Promise<{ requested?: string }> }) {
  const { requested } = await searchParams;
  const mine = await listMyBookings();
  const now = new Date();

  return (
    <main id="main" className={mainClasses}>
      <div className="flex flex-col gap-1.5">
        <Link href="/book" className="inline-flex min-h-11 items-center self-start font-semibold">Find a free time</Link>
        <h1 className={pageTitle}>My appointments</h1>
        <p className="m-0 max-w-[48rem]">Upcoming appointments, what you&apos;ve shared, and private feedback from past ones.</p>
      </div>
      {requested ? <StatusMessage>Request sent. You&apos;ll get an email when the adviser answers.</StatusMessage> : null}

      {!mine.ok ? (
        <ErrorState title="Your appointments didn't load." actions={<ButtonLink href="/book/appointments">Try again</ButtonLink>}>{mine.error.message}</ErrorState>
      ) : (() => {
        const upcoming = mine.value.filter((b) => ACTIVE.has(b.status) && new Date(b.start) > now).sort((a, b) => a.start.localeCompare(b.start));
        const past = mine.value.filter((b) => !upcoming.includes(b)).sort((a, b) => b.start.localeCompare(a.start));
        return (
          <>
            <section aria-labelledby="up-h" className="flex flex-col gap-3">
              <h2 id="up-h" className="m-0 text-[22px]">Upcoming</h2>
              {upcoming.length === 0 ? (
                <EmptyState title="No upcoming appointments" actions={<ButtonLink href="/book" className="self-start">Book an adviser</ButtonLink>} />
              ) : (
                <ul className="m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(min(340px,100%),1fr))] gap-3 p-0">
                  {upcoming.map((b) => (
                    <Card as="li" key={b.id} gap="gap-3">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="flex flex-col">
                          <b className="text-navy">{whenLabel(b.start)}</b>
                          <span>{b.adviserName} · {b.topic}</span>
                        </div>
                        <StatusTag kind={TAG[b.status] ?? "requested"} label={STATUS_LABEL[b.status]} />
                      </div>
                      <div className="flex flex-col">
                        <b className="text-sm text-navy">You chose to share</b>
                        <span className="text-[15px]">{b.shared.length ? SHARE_ORDER.filter((k) => b.shared.includes(k)).map((k) => SHARE_LABELS[k]).join(", ") : "Nothing beyond your name, topic and note"}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <ButtonLink href={`/book/${b.id}`} variant="outline" size="compact">View details</ButtonLink>
                        <CancelBooking bookingId={b.id} when={whenLabel(b.start)} adviserName={b.adviserName} compact />
                      </div>
                    </Card>
                  ))}
                </ul>
              )}
            </section>

            <section aria-labelledby="past-h" className="flex flex-col gap-3">
              <h2 id="past-h" className="m-0 text-[22px]">Past appointments</h2>
              {past.length === 0 ? <p className="m-0 text-muted">None yet.</p> : (
                <ul className="m-0 flex list-none flex-col gap-3 p-0">
                  {past.map((b) => (
                    <Card as="li" key={b.id} gap="gap-3">
                      <div className="flex items-center gap-3">
                        <span aria-hidden="true" className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-navy text-sm font-bold text-white">{initials(b.adviserName)}</span>
                        <div className="flex min-w-0 flex-col">
                          <b className="text-navy">{b.adviserName}</b>
                          <span className="text-[15px]">{whenLabel(b.start)} · {b.topic} · {STATUS_LABEL[b.status]}</span>
                        </div>
                      </div>
                      {b.feedback ? (
                        <div className="flex flex-col gap-1 rounded-button bg-cream p-4">
                          <div className="flex flex-wrap items-baseline justify-between gap-2">
                            <b className="text-navy">Feedback</b>
                            <span className="text-sm text-muted">Private: only you and {firstName(b.adviserName)}</span>
                          </div>
                          <p className="m-0">{b.feedback.text}</p>
                        </div>
                      ) : b.status === "completed" ? <span className="text-[15px] text-muted">No feedback yet.</span> : null}
                      <Link href={`/book/${b.id}`} className="inline-flex min-h-11 items-center self-start font-semibold">View details</Link>
                    </Card>
                  ))}
                </ul>
              )}
            </section>
          </>
        );
      })()}
    </main>
  );
}
