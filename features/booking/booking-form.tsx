"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { Button, btn } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ErrorBanner } from "@/components/ui/error-banner";
import { Field } from "@/components/ui/field";
import { useAnnounce } from "@/components/ui/live-region";
import { StatusChip } from "@/components/ui/status-chip";
import { slotLabel } from "@/lib/date";
import { requestSessionAction } from "./actions";

type Errors = { date?: string; time?: string };

export function BookingForm({
  adviserName,
  unit,
  minDate,
  defaultDate,
  defaultTime,
  hasTarget,
  sharesProgress,
}: {
  adviserName: string;
  unit: string;
  minDate: string;
  defaultDate: string;
  defaultTime: string;
  hasTarget: boolean;
  sharesProgress: boolean;
}) {
  const [date, setDate] = useState(defaultDate);
  const [time, setTime] = useState(defaultTime);
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const [sentSlot, setSentSlot] = useState<string | null>(null);
  const dateRef = useRef<HTMLInputElement>(null);
  const timeRef = useRef<HTMLInputElement>(null);
  const announce = useAnnounce();

  const check = (field: "date" | "time", value: string) =>
    value ? undefined : field === "date" ? "Choose a date for the session." : "Choose a time for the session.";

  async function submit() {
    const next: Errors = { date: check("date", date), time: check("time", time) };
    setErrors(next);
    if (next.date) return dateRef.current?.focus();
    if (next.time) return timeRef.current?.focus();
    setBusy(true);
    setFailed(false);
    try {
      const res = await requestSessionAction({ date, time, note });
      if (res.ok) {
        setSentSlot(res.slot);
        announce("Request sent.");
      } else {
        setErrors({ [res.field ?? "date"]: res.error });
      }
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }

  if (sentSlot) {
    return (
      <Card className="stack" aria-labelledby="sent-title">
        <h2 id="sent-title">Request sent</h2>
        <p className="prose">{adviserName} will accept or decline. You will see the status here.</p>
        <dl className="stack-sm">
          <div>
            <dt className="secondary muted">Requested time</dt>
            <dd>{slotLabel(sentSlot)}</dd>
          </div>
          <div>
            <dt className="secondary muted">Status</dt>
            <dd><StatusChip status="requested" /></dd>
          </div>
        </dl>
        <div>
          <Link href="/bookings" className={btn("primary")}>View my bookings</Link>
        </div>
      </Card>
    );
  }

  return (
    <div className="cols split">
      <Card className="stack" aria-labelledby="req-title">
        <div className="stack-sm">
          <h2 id="req-title">Request a session</h2>
          <p className="muted">With {adviserName}, {unit}</p>
        </div>
        {failed ? <ErrorBanner message="We couldn't send your request. Check your connection and try again." /> : null}
        <form
          className="stack"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
        >
          <Field id="pref-date" label="Preferred date" error={errors.date}>
            {(p) => (
              <input
                {...p}
                ref={dateRef}
                type="date"
                min={minDate}
                value={date}
                autoComplete="off"
                onChange={(e) => { setDate(e.target.value); setErrors((x) => ({ ...x, date: undefined })); }}
                onBlur={() => setErrors((x) => ({ ...x, date: check("date", date) }))}
                onFocus={() => setErrors((x) => ({ ...x, date: undefined }))}
              />
            )}
          </Field>
          <Field id="pref-time" label="Preferred time" error={errors.time}>
            {(p) => (
              <input
                {...p}
                ref={timeRef}
                type="time"
                value={time}
                autoComplete="off"
                onChange={(e) => { setTime(e.target.value); setErrors((x) => ({ ...x, time: undefined })); }}
                onBlur={() => setErrors((x) => ({ ...x, time: check("time", time) }))}
                onFocus={() => setErrors((x) => ({ ...x, time: undefined }))}
              />
            )}
          </Field>
          <Field id="adviser-note" label="Note for the adviser" optional helper="Share what you want help with. Leave out health or personal details.">
            {(p) => <textarea {...p} value={note} maxLength={1000} onChange={(e) => setNote(e.target.value)} />}
          </Field>
          <div className="row">
            <Button type="submit" busy={busy}>Request session</Button>
            <Link href="/practice" className={btn("secondary")}>Go back to practice</Link>
          </div>
        </form>
      </Card>

      <Card className="stack" aria-labelledby="see-title">
        <h2 id="see-title" style={{ fontSize: "var(--text-h3)" }}>What your adviser will see</h2>
        <ul className="stack-sm">
          <li>Your name and semester</li>
          <li>The time you picked and your note</li>
          {sharesProgress ? (
            <>
              <li>{hasTarget ? "Your target role" : "That you haven't chosen a target role yet"}</li>
              <li>Your gap skills and the 1 to 5 confidence you gave each one</li>
              <li>A one-line summary of your latest interview feedback</li>
            </>
          ) : null}
        </ul>
        <p className="secondary muted">
          {sharesProgress
            ? "Never your answers in full, your email address or your practice history."
            : "You keep your progress private, so nothing else is shared. You can change this in Settings."}
        </p>
        <p className="secondary muted">Your adviser can&apos;t change any of your data. They can only accept, decline, complete or cancel the booking, and must give a reason to cancel.</p>
      </Card>
    </div>
  );
}
