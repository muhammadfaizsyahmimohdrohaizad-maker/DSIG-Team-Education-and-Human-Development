"use client";
// Adviser availability board: a Monday-to-Friday grid for one week (Malaysia time). Select a time to open or
// close it; booked or requested times can't change here. Nothing is stored until "Save availability".
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { AlertMessage, Button, Card, Select, SoftPanel, StatusMessage, TextInput, cn } from "@/components/ui";
import { getAvailability, setAvailability, type Availability } from "./actions";

const DAY_MS = 864e5;
const START_HOUR = 9;
const END_HOUR = 17;

const addDays = (day: string, n: number) => new Date(Date.parse(`${day}T00:00:00Z`) + n * DAY_MS).toISOString().slice(0, 10);
const iso = (day: string, minutes: number) => `${day}T${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}:00+08:00`;
const key = (s: string) => new Date(s).toISOString();
const fmtDay = (day: string) => new Date(`${day}T12:00:00+08:00`).toLocaleDateString("en-MY", { weekday: "short", day: "numeric", month: "short", timeZone: "Asia/Kuala_Lumpur" });
const fmtTime = (m: number) => new Date(Date.UTC(2000, 0, 1, Math.floor(m / 60), m % 60)).toLocaleTimeString("en-MY", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "UTC" }).toLowerCase();

export function AvailabilityGrid({ initial, initialWeek }: { initial: Availability; initialWeek: string }) {
  const [week, setWeek] = useState(initialWeek);
  const [data, setData] = useState<Availability>(initial);
  const [len, setLen] = useState<30 | 60>(30);
  const [changes, setChanges] = useState<Map<string, boolean>>(new Map());
  const [blockDate, setBlockDate] = useState("");
  const [blockWhy, setBlockWhy] = useState("");
  const [blockErr, setBlockErr] = useState<string | null>(null);
  const [toBlock, setToBlock] = useState<{ day: string; reason?: string }[]>([]);
  const [toUnblock, setToUnblock] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, startLoad] = useTransition();
  const [saving, startSave] = useTransition();

  const load = useCallback((w: string) => {
    startLoad(async () => {
      const r = await getAvailability({ from: iso(w, 0), days: 7 });
      if (!r.ok) { setError(r.error.message); return; }
      setData(r.value);
    });
  }, []);
  useEffect(() => { if (week !== initialWeek) load(week); }, [week, initialWeek, load]);

  const days = useMemo(() => [0, 1, 2, 3, 4].map((n) => addDays(week, n)), [week]);
  const times = useMemo(() => { const t: number[] = []; for (let m = START_HOUR * 60; m < END_HOUR * 60; m += len) t.push(m); return t; }, [len]);
  const byStart = useMemo(() => new Map(data.slots.map((s) => [key(s.start), s])), [data]);
  const blocked = new Set([...data.blockedDays.map((b) => b.day), ...toBlock.map((b) => b.day)].filter((d) => !toUnblock.includes(d)));
  const dirty = changes.size + toBlock.length + toUnblock.length > 0;

  const toggle = (start: string, now: boolean) => {
    setMessage(null);
    setChanges((c) => {
      const next = new Map(c);
      const saved = byStart.get(key(start))?.open ?? false;
      if (!now === saved) next.delete(key(start)); else next.set(key(start), !now);
      return next;
    });
  };

  const save = () => {
    if (saving || !dirty) { if (!dirty) setMessage("Nothing to save yet."); return; }
    setError(null);
    startSave(async () => {
      const r = await setAvailability({
        slots: [...changes].map(([start, open]) => ({ start, minutes: len, open })),
        blockDays: toBlock,
        unblockDays: toUnblock,
      });
      if (!r.ok) { setError(r.error.message); return; }
      const kept = r.value.keptBooked.length;
      setMessage(`Saved.${kept ? ` ${kept} booked time${kept === 1 ? " was" : "s were"} left as ${kept === 1 ? "it was" : "they were"}.` : ""}`);
      setChanges(new Map()); setToBlock([]); setToUnblock([]);
      load(week);
    });
  };

  const addBlock = () => {
    if (!blockDate) { setBlockErr("Pick a date to block."); return; }
    setBlockErr(null);
    setToUnblock((u) => u.filter((d) => d !== blockDate));
    if (!data.blockedDays.some((b) => b.day === blockDate)) setToBlock((b) => [...b.filter((x) => x.day !== blockDate), { day: blockDate, reason: blockWhy.trim() || undefined }]);
    setBlockDate(""); setBlockWhy("");
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" size="compact" aria-label="Previous week" onClick={() => { if (dirty && !confirm("You have unsaved changes on this week. Leave them?")) return; setChanges(new Map()); setWeek(addDays(week, -7)); }}>‹</Button>
        <b className="text-navy" aria-live="polite">Week of {fmtDay(week)}</b>
        <Button variant="outline" size="compact" aria-label="Next week" onClick={() => { if (dirty && !confirm("You have unsaved changes on this week. Leave them?")) return; setChanges(new Map()); setWeek(addDays(week, 7)); }}>›</Button>
        <ul className="m-0 ml-auto flex list-none flex-wrap gap-4 p-0 text-sm">
          <li className="flex items-center gap-1.5"><span aria-hidden="true" className="size-3.5 rounded-[3px] bg-navy" />Open</li>
          <li className="flex items-center gap-1.5"><span aria-hidden="true" className="size-3.5 rounded-[3px] border border-control bg-white" />Closed</li>
          <li className="flex items-center gap-1.5"><span aria-hidden="true" className="size-3.5 rounded-[3px] bg-maroon" />Booked or requested</li>
        </ul>
      </div>
      {message ? <StatusMessage>{message}</StatusMessage> : null}
      {error ? <AlertMessage>{error}</AlertMessage> : null}

      <Card pad="p-0" gap="gap-0" className="overflow-x-auto">
        <table aria-label="Open times" aria-busy={loading || undefined} className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr className="bg-cream text-navy">
              <th scope="col" className="w-24 px-3 py-2.5 text-left font-semibold">Time</th>
              {days.map((d) => <th key={d} scope="col" className="px-2 py-2.5 font-semibold">{fmtDay(d)}{blocked.has(d) ? <span className="block text-xs font-normal text-maroon">Blocked</span> : null}</th>)}
            </tr>
          </thead>
          <tbody>
            {times.map((m) => (
              <tr key={m} className="border-t border-hairline">
                <th scope="row" className="px-3 py-1.5 text-left font-normal text-muted">{fmtTime(m)}</th>
                {days.map((d) => {
                  const start = iso(d, m);
                  const slot = byStart.get(key(start));
                  if (slot?.booked) return <td key={d} className="px-1.5 py-1"><span className="flex min-h-11 items-center justify-center rounded-control bg-maroon text-xs font-semibold text-white">Booked</span></td>;
                  if (blocked.has(d)) return <td key={d} className="px-1.5 py-1"><span className="flex min-h-11 items-center justify-center rounded-control bg-hairline text-xs text-muted">—</span></td>;
                  const open = changes.get(key(start)) ?? slot?.open ?? false;
                  return (
                    <td key={d} className="px-1.5 py-1">
                      <button
                        type="button"
                        aria-pressed={open}
                        aria-label={`${fmtDay(d)} ${fmtTime(m)}: ${open ? "open" : "closed"}`}
                        onClick={() => toggle(start, open)}
                        className={cn("flex min-h-11 w-full items-center justify-center rounded-control border text-xs font-semibold", open ? "border-navy bg-navy text-white" : "border-control bg-white text-muted hover:bg-cream", changes.has(key(start)) && "ring-2 ring-maroon ring-offset-1")}
                      >
                        {open ? "Open" : "Closed"}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <div className="flex flex-wrap items-start gap-4">
        <SoftPanel as="section" aria-labelledby="len-h" className="flex-[1_1_260px]" gap="gap-2">
          <h2 id="len-h" className="m-0 text-xl">Session length</h2>
          <Select id="len" label="Each time slot is" value={String(len)} onChange={(e) => { setLen(e.target.value === "60" ? 60 : 30); setChanges(new Map()); }} options={[{ value: "30", label: "30 minutes" }, { value: "60", label: "60 minutes" }]} />
        </SoftPanel>
        <SoftPanel as="section" aria-labelledby="blk-h" className="flex-[2_1_380px]" gap="gap-3">
          <h2 id="blk-h" className="m-0 text-xl">Block a whole day</h2>
          <div className="flex flex-wrap items-end gap-3">
            <TextInput id="blk-date" type="date" label="Date" value={blockDate} onChange={(e) => setBlockDate(e.target.value)} error={blockErr ?? undefined} fieldClassName="flex-[1_1_160px]" />
            <TextInput id="blk-why" label="Reason (only you see this)" value={blockWhy} onChange={(e) => setBlockWhy(e.target.value)} placeholder="e.g. Industry visit" maxLength={200} fieldClassName="flex-[2_1_200px]" />
            <Button variant="outline" onClick={addBlock}>Block this day</Button>
          </div>
          {blocked.size ? (
            <ul className="m-0 flex list-none flex-col gap-1 p-0 text-[15px]">
              {[...blocked].sort().map((d) => {
                const why = toBlock.find((b) => b.day === d)?.reason ?? data.blockedDays.find((b) => b.day === d)?.reason;
                return (
                  <li key={d} className="flex items-center justify-between gap-2">
                    <span><b className="text-navy">{fmtDay(d)}</b>{why ? ` · ${why}` : ""}</span>
                    <Button variant="text" size="compact" onClick={() => { setToBlock((b) => b.filter((x) => x.day !== d)); if (data.blockedDays.some((b) => b.day === d)) setToUnblock((u) => [...u, d]); }}>Unblock</Button>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </SoftPanel>
      </div>
      <Button onClick={save} loading={saving} loadingText="Saving" className="self-start">Save availability</Button>
    </div>
  );
}

