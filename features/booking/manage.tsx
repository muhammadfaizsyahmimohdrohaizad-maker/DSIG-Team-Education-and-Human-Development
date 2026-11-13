"use client";
// Move and cancel controls for one booking (Appointment detail and My appointments boards).
// Cancel always asks first and names what happens; a move keeps the current time until the adviser accepts.
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { AlertMessage, Button, cn } from "@/components/ui";
import { cancelBooking, moveBooking, type OpenSlot } from "./actions";
import { dayLabel, firstName, timeLabel, whenLabel } from "./labels";

export function CancelBooking({ bookingId, when, adviserName, compact = false }: { bookingId: string; when: string; adviserName: string; compact?: boolean }) {
  const router = useRouter();
  const [asking, setAsking] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const confirm = () => start(async () => {
    const r = await cancelBooking({ bookingId });
    if (!r.ok) { setError(r.error.message); return; }
    setAsking(false);
    router.refresh();
  });
  if (!asking) return <Button variant="danger" size={compact ? "compact" : "default"} onClick={() => setAsking(true)}>Cancel booking</Button>;
  return (
    <div role="alert" className="flex flex-col gap-2 rounded-button border border-maroon bg-white p-4">
      <b className="text-navy">Cancel your session on {when}?</b>
      <span className="text-[15px]">{firstName(adviserName)} gets an email, and the time opens for other students.</span>
      {error ? <AlertMessage>{error}</AlertMessage> : null}
      <div className="flex flex-wrap gap-2">
        <Button variant="danger" loading={pending} loadingText="Cancelling" onClick={confirm}>Cancel the session</Button>
        <Button variant="outline" onClick={() => setAsking(false)}>Keep it</Button>
      </div>
    </div>
  );
}

export function MoveBooking({ bookingId, adviserName, slots }: { bookingId: string; adviserName: string; slots: OpenSlot[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pick, setPick] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const send = () => {
    if (pending) return;
    if (!pick) { setError("Pick a time first."); return; }
    start(async () => {
      const r = await moveBooking({ bookingId, slotId: pick });
      if (!r.ok) { setError(r.error.code === "CONFLICT" ? `That time was just taken. Pick another one.` : r.error.message); return; }
      setOpen(false);
      router.refresh();
    });
  };
  if (!open) return <Button variant="outline" onClick={() => setOpen(true)}>Move to another time</Button>;
  return (
    <section aria-labelledby="mv-h" className="flex w-full flex-col gap-3 rounded-card border border-hairline p-5">
      <h2 id="mv-h" className="m-0 text-xl">Pick a new time</h2>
      {slots.length === 0 ? (
        <p className="m-0">{firstName(adviserName)} has no other free times in the next two weeks.</p>
      ) : (
        <div role="group" aria-label={`Free times with ${adviserName}`} className="flex flex-wrap gap-2">
          {slots.map((s) => (
            <button
              key={s.id}
              type="button"
              aria-pressed={s.id === pick}
              aria-label={whenLabel(s.start)}
              onClick={() => { setPick(s.id); setError(null); }}
              className={cn("flex min-h-14 flex-col items-center justify-center rounded-button border px-3.5 py-1.5", s.id === pick ? "border-maroon bg-maroon text-white" : "border-navy bg-white text-navy hover:bg-cream")}
            >
              <b>{dayLabel(s.start)}</b>
              <span className="text-sm">{timeLabel(s.start)}</span>
            </button>
          ))}
        </div>
      )}
      {error ? <AlertMessage>{error}</AlertMessage> : null}
      <div className="flex flex-wrap gap-2">
        {slots.length ? <Button loading={pending} loadingText="Sending" onClick={send}>Ask to move to this time</Button> : null}
        <Button variant="outline" onClick={() => { setOpen(false); setError(null); }}>Keep the current time</Button>
      </div>
      <p className="m-0 text-sm text-muted">Your current time stays booked until {firstName(adviserName)} accepts the new one.</p>
    </section>
  );
}
