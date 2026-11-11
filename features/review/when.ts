// "in 10 minutes", "tomorrow", "in 3 days": when a review card comes back, in Malaysia time. Pure.
const MYT_MS = 8 * 60 * 60_000;
const DAY_MS = 24 * 60 * 60_000;

const dayNumber = (d: Date) => Math.floor((d.getTime() + MYT_MS) / DAY_MS);

export function whenLabel(due: Date, now: Date): string {
  const minutes = Math.round((due.getTime() - now.getTime()) / 60_000);
  if (minutes <= 1) return "now";
  if (minutes < 60) return `in ${minutes} minutes`;
  const days = dayNumber(due) - dayNumber(now);
  if (days <= 0) {
    const hours = Math.round(minutes / 60);
    return hours <= 1 ? "in 1 hour" : `in ${hours} hours`;
  }
  if (days === 1) return "tomorrow";
  if (days < 60) return `in ${days} days`;
  const months = Math.round(days / 30);
  return `in ${months} months`;
}
