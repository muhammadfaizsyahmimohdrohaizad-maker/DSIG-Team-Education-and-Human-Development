// Pure helpers for account deletion, export and the cron jobs. Unit-tested in tests/unit/backend-account.test.ts.
import { createHash, timingSafeEqual } from "node:crypto";

/** FR-ACC-02: the typed confirmation is the account's full name, ignoring case and extra spaces. */
export function confirmationMatches(typed: string, fullName: string): boolean {
  const norm = (s: string) => s.normalize("NFKC").trim().replace(/\s+/g, " ").toLocaleLowerCase("en");
  return norm(fullName).length > 0 && norm(typed) === norm(fullName);
}

/** The instant `months` calendar months before `now` (UTC), clamped to the month's last day. */
export function monthsBefore(now: Date, months: number): Date {
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth() - months;
  const target = new Date(Date.UTC(y, m, 1, now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds(), now.getUTCMilliseconds()));
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(now.getUTCDate(), lastDay));
  return target;
}

/** Vercel Cron sends "Authorization: Bearer $CRON_SECRET". Compared in constant time. */
export function cronAuthorized(header: string | null, secret: string | undefined): boolean {
  if (!secret || !header) return false;
  const digest = (s: string) => createHash("sha256").update(s).digest();
  return timingSafeEqual(digest(header), digest(`Bearer ${secret}`));
}

/** File name for the data download, dated in Malaysia time. */
export function exportFileName(now: Date): string {
  const myt = new Date(now.getTime() + 8 * 60 * 60 * 1000).toISOString().slice(0, 10);
  return `careerprep-my-data-${myt}.json`;
}
