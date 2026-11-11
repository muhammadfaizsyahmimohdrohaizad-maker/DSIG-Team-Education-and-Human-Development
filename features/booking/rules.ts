// Pure helpers for booking times and booking emails. Unit-tested in tests/unit/backend-booking.test.ts.
// Times are stored in UTC and shown in Malaysia time, UTC+08:00 all year (no daylight saving).

const MYT_OFFSET_MS = 8 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Start and end (exclusive) in UTC of a Malaysian calendar day, `offsetDays` after the day `now` falls on. */
export function malaysiaDay(now: Date, offsetDays = 0): { from: string; to: string } {
  const local = new Date(now.getTime() + MYT_OFFSET_MS);
  const midnightLocalAsUtc = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate());
  const from = midnightLocalAsUtc - MYT_OFFSET_MS + offsetDays * DAY_MS;
  return { from: new Date(from).toISOString(), to: new Date(from + DAY_MS).toISOString() };
}

/** The window getOpenSlots reads: from `from` (or now) for `days` Malaysian days. */
export function slotWindow(now: Date, days: number, from?: string): { from: string; to: string } {
  const start = from && new Date(from).getTime() > now.getTime() ? new Date(from) : now;
  return { from: start.toISOString(), to: malaysiaDay(start, days).from };
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "Thu, 12 Nov, 10:00 am" in Malaysia time. */
export function formatMyt(iso: string): string {
  const d = new Date(new Date(iso).getTime() + MYT_OFFSET_MS);
  const h = d.getUTCHours();
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  return `${WEEKDAYS[d.getUTCDay()]}, ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}, ${hour12}:${mm} ${h < 12 ? "am" : "pm"}`;
}

/** Malaysian calendar date (YYYY-MM-DD) of a UTC instant. */
export function malaysiaDate(iso: string): string {
  return new Date(new Date(iso).getTime() + MYT_OFFSET_MS).toISOString().slice(0, 10);
}

export type BookingEmailKind = "requested" | "moved" | "change_requested" | "cancelled" | "accepted" | "declined" | "feedback" | "reminder";

export type BookingEmailFacts = { kind: BookingEmailKind; start: string; minutes?: number; adviserName?: string; link: string };

const FOOTER = "You get this because you have a CareerPrep booking. You can change booking emails in Settings and privacy.";

/** Status, time and link only. Never the topic, the note, shared items or feedback text (System Design 5.3). */
export function bookingEmail(f: BookingEmailFacts): { subject: string; text: string } {
  const when = formatMyt(f.start);
  const length = f.minutes ? ` · ${f.minutes} minutes` : "";
  const who = f.adviserName ?? "Your adviser";
  const lines = (subject: string, body: string[]) => ({ subject, text: [...body, "", f.link, "", FOOTER].join("\n") });
  switch (f.kind) {
    case "requested":
      return lines(`New session request for ${when}`, ["A student asked for a session with you.", `${when}${length}`, "", "Accept or decline it on your Requests page:"]);
    case "moved":
      return lines(`A session request moved to ${when}`, ["A student moved their session request to a new time.", `${when}${length}`, "", "Accept or decline it on your Requests page:"]);
    case "change_requested":
      return lines(`A confirmed session moved to ${when}`, ["A student moved a session you had accepted to a new time. It needs your answer again.", `${when}${length}`, "", "Accept or decline the new time on your Requests page:"]);
    case "cancelled":
      return lines(`Session on ${when} cancelled`, ["A student cancelled their session. The time is open again for other students.", when, "", "Your requests:"]);
    case "accepted":
      return lines(`Your session on ${when} is confirmed`, [`${who} accepted your session.`, `${when}${length}`, "", "View booking:"]);
    case "declined":
      return lines("Your session request needs a new time", [`${who} can't make ${when}. Please pick another time.`, "", "Pick another time:"]);
    case "feedback":
      return lines("Your adviser sent feedback", [`${who} sent feedback on your session of ${when}.`, "", "Read it on your Book page:"]);
    case "reminder":
      return lines(`Reminder: your session is tomorrow at ${when.split(", ")[2]}`, [`This is a reminder of your session with ${who}.`, `Tomorrow, ${when}${length}`, "", "Can't make it? Move or cancel it from the booking page so the time goes to another student:"]);
  }
}
