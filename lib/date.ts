// Plain date helpers. Slots are local times without a zone, e.g. "2026-10-22T10:00".
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function parts(iso: string) {
  const d = new Date(iso.length === 10 ? `${iso}T00:00:00Z` : `${iso.slice(0, 16)}:00Z`);
  return { d, day: DAYS[d.getUTCDay()], date: d.getUTCDate(), month: MONTHS[d.getUTCMonth()], year: d.getUTCFullYear() };
}

/** "Thu 22 Oct" */
export function shortDay(iso: string): string {
  const p = parts(iso);
  return `${p.day} ${p.date} ${p.month}`;
}

/** "22 Oct" */
export function dayMonth(iso: string): string {
  const p = parts(iso);
  return `${p.date} ${p.month}`;
}

/** "Thu 22 Oct 2026, 10:00" */
export function slotLabel(slot: string): string {
  const p = parts(slot);
  return `${p.day} ${p.date} ${p.month} ${p.year}, ${slot.slice(11, 16)}`;
}

/** "Thu 22 Oct, 10:00" */
export function slotShort(slot: string): string {
  return `${shortDay(slot)}, ${slot.slice(11, 16)}`;
}

/** "2026-10-21" for a Date, in UTC. */
export function isoDay(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function addDays(iso: string, n: number): string {
  const d = new Date(`${iso.slice(0, 10)}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return isoDay(d);
}

/** Today's date in Malaysia (UTC+8), as "2026-10-21". */
export function todayMY(now: Date = new Date()): string {
  return isoDay(new Date(now.getTime() + 8 * 3600_000));
}

/** The current local time in Malaysia as a slot string, "2026-10-21T14:05". */
export function nowSlotMY(now: Date = new Date()): string {
  return new Date(now.getTime() + 8 * 3600_000).toISOString().slice(0, 16);
}
