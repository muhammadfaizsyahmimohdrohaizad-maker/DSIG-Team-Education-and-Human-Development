"use client";
// Book board: advisers with free times (from open_slots), and the "Your appointment" panel to send a request.
// The first student to claim a time gets it; a clash comes back as CONFLICT and the time is dropped from the list.
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { AlertMessage, Button, Card, CheckboxRow, EmptyState, Select, SoftPanel, Textarea, cn } from "@/components/ui";
import type { SharedItem } from "@/lib/types";
import { requestBooking, type OpenSlot } from "./actions";
import { SHARE_LABELS, SHARE_ORDER, TOPICS, dayKey, dayLabel, firstName, initials, timeLabel, whenLabel } from "./labels";

export function BookForm({ slots: initial }: { slots: OpenSlot[] }) {
  const router = useRouter();
  const [unavailable, setUnavailable] = useState<string[]>([]);
  const slots = useMemo(() => initial.filter(slot => !unavailable.includes(slot.id)), [initial, unavailable]);
  const [pending, start] = useTransition();
  const [selId, setSelId] = useState<string | null>(null);
  const [topic, setTopic] = useState<string>(TOPICS[1]);
  const [note, setNote] = useState("");
  const [shared, setShared] = useState<SharedItem[]>(["target_matches", "study_plan"]);
  const [error, setError] = useState<string | null>(null);
  const [requestId] = useState(() => crypto.randomUUID());

  const days = useMemo(() => [...new Set(slots.map((s) => dayKey(s.start)))].sort(), [slots]);
  const [day, setDay] = useState<string | null>(null);
  const activeDay = day && days.includes(day) ? day : days[0] ?? null;

  const advisers = useMemo(() => {
    const map = new Map<string, { id: string; name: string; slots: OpenSlot[] }>();
    for (const s of slots) {
      if (dayKey(s.start) !== activeDay) continue;
      const a = map.get(s.adviserId) ?? { id: s.adviserId, name: s.adviserName, slots: [] };
      a.slots.push(s);
      map.set(s.adviserId, a);
    }
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [slots, activeDay]);

  const sel = slots.find((s) => s.id === selId) ?? null;

  const send = () => {
    if (pending) return;
    if (!sel) { setError("Pick a free time on an adviser's card first."); return; }
    setError(null);
    start(async () => {
      const r = await requestBooking({ slotId: sel.id, topic, note: note.trim() || undefined, shared, requestId });
      if (r.ok) { router.push(`/book/appointments?requested=${r.value.bookingId}`); return; }
      if (r.error.code === "CONFLICT") {
        setUnavailable(ids => [...ids, sel.id]);
        setSelId(null);
        setError(`Someone else reserved ${whenLabel(sel.start)} with ${sel.adviserName} a moment ago. Nothing was booked and nothing was shared. Pick another time.`);
        return;
      }
      setError(r.error.message);
    });
  };

  return (
    <div className="flex flex-wrap items-start gap-6">
      <section aria-labelledby="res-h" className="flex min-w-0 flex-[999_1_560px] flex-col gap-4">
        <h2 id="res-h" className="m-0 text-[22px]">Free times</h2>
        {days.length === 0 ? (
          <EmptyState title="No free times in the next two weeks">
            <p className="m-0">Advisers add times every week. Check again soon.</p>
          </EmptyState>
        ) : (
          <>
            <div role="group" aria-label="Date" className="flex flex-wrap gap-2">
              {days.map((d) => (
                <button
                  key={d}
                  type="button"
                  aria-pressed={d === activeDay}
                  onClick={() => setDay(d)}
                  className={cn("min-h-11 rounded-full border px-4 font-semibold", d === activeDay ? "border-navy bg-navy text-white" : "border-hairline bg-white text-navy hover:bg-cream")}
                >
                  {dayLabel(`${d}T12:00:00+08:00`)}
                </button>
              ))}
            </div>
            <ul aria-label="Advisers" className="m-0 flex list-none flex-col gap-3 p-0">
              {advisers.map((a) => (
                <Card as="li" key={a.id} gap="gap-3">
                  <div className="flex items-center gap-3">
                    <span aria-hidden="true" className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-navy text-sm font-bold text-white">{initials(a.name)}</span>
                    <b className="text-lg text-navy">{a.name}</b>
                  </div>
                  <div role="group" aria-label={`Free times with ${a.name}`} className="flex flex-wrap gap-2">
                    {a.slots.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        aria-pressed={s.id === selId}
                        aria-label={`${whenLabel(s.start)} with ${a.name}, ${s.minutes} minutes`}
                        onClick={() => { setSelId(s.id); setError(null); }}
                        className={cn("min-h-11 rounded-button border px-3.5 font-semibold", s.id === selId ? "border-maroon bg-maroon text-white" : "border-navy bg-white text-navy hover:bg-cream")}
                      >
                        {timeLabel(s.start)}
                      </button>
                    ))}
                  </div>
                </Card>
              ))}
            </ul>
          </>
        )}
      </section>

      <SoftPanel as="aside" aria-labelledby="req-h" className="min-w-0 flex-[1_1_320px] desktop:sticky desktop:top-4" gap="gap-3">
        <h2 id="req-h" className="m-0 text-[22px]">Your appointment</h2>
        {error ? <AlertMessage>{error}</AlertMessage> : null}
        {!sel ? (
          <p className="m-0">Pick a free time on an adviser&apos;s card to start.</p>
        ) : (
          <>
            <div className="flex flex-col">
              <b className="text-navy">{sel.adviserName}</b>
              <span>{whenLabel(sel.start)} · {sel.minutes} minutes</span>
            </div>
            <Select id="topic" label="Topic" value={topic} onChange={(e) => setTopic(e.target.value)} options={TOPICS.map((t) => ({ value: t, label: t }))} />
            <Textarea id="note" label="Note for the adviser (optional)" rows={3} maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. I'm choosing between two degree programmes." />
            <fieldset className="m-0 flex flex-col border-0 p-0">
              <legend className="mb-1 text-[15px] font-semibold text-navy">Share with {firstName(sel.adviserName)}? (your choice)</legend>
              {SHARE_ORDER.map((k) => (
                <CheckboxRow key={k} id={`share-${k}`} checked={shared.includes(k)} onChange={(e) => setShared((cur) => (e.target.checked ? [...cur, k] : cur.filter((x) => x !== k)))}>
                  {SHARE_LABELS[k]}
                </CheckboxRow>
              ))}
              <span className="text-sm text-muted">
                {shared.length
                  ? `${firstName(sel.adviserName)} sees the ${shared.length} ticked item${shared.length === 1 ? "" : "s"} until the appointment ends.`
                  : `Nothing is shared. ${firstName(sel.adviserName)} only sees your name, topic and note.`}
              </span>
            </fieldset>
            <Button onClick={send} loading={pending} loadingText="Sending request" fullWidth>Send request</Button>
            <span className="text-sm text-muted">A time is yours once it&apos;s reserved. If two people pick the same time, the first gets it and the other is told straight away.</span>
          </>
        )}
      </SoftPanel>
    </div>
  );
}
