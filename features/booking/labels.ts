// Words for booking screens (Book, Appointment detail, My appointments boards). No server code here,
// so client components can import it.
import type { BookingState, SharedItem } from "@/lib/types";

export const TOPICS = ["Career matches", "Study plan", "Résumé or interview", "Industrial training", "Counselling"] as const;

export const SHARE_LABELS: Record<SharedItem, string> = {
  target_matches: "My target job and matches",
  gap_progress: "My skill gap",
  study_plan: "My saved study plan",
  interview_feedback: "My mock interview results",
};
export const SHARE_ORDER: SharedItem[] = ["target_matches", "gap_progress", "study_plan", "interview_feedback"];

export const STATUS_LABEL: Record<BookingState, string> = {
  requested: "Requested",
  accepted: "Accepted",
  declined: "Declined",
  change_requested: "New time requested",
  cancelled: "Cancelled",
  completed: "Completed",
};

const TZ = "Asia/Kuala_Lumpur";
export const dayLabel = (iso: string) => new Date(iso).toLocaleDateString("en-MY", { weekday: "short", day: "numeric", month: "short", timeZone: TZ });
export const timeLabel = (iso: string) => new Date(iso).toLocaleTimeString("en-MY", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: TZ }).toLowerCase();
export const whenLabel = (iso: string) => `${dayLabel(iso)}, ${timeLabel(iso)}`;
export const dayKey = (iso: string) => new Date(iso).toLocaleDateString("en-CA", { timeZone: TZ });

export const firstName = (name: string) => name.replace(/^(pn|en|ms|mr|mrs|dr|cik|puan|encik)\.?\s+/i, "").split(/\s+/)[0] ?? name;
export const initials = (name: string) => {
  const w = name.replace(/^(pn|en|ms|mr|mrs|dr|cik|puan|encik)\.?\s+/i, "").split(/\s+/).filter(Boolean);
  return ((w[0]?.[0] ?? "") + (w.length > 1 ? (w[w.length - 1]?.[0] ?? "") : "")).toUpperCase();
};
