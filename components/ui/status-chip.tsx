import type { BookingStatus } from "@/lib/types";
import { CheckIcon, ClockIcon, FlagIcon, XIcon, CircleIcon } from "./icons";

const BOOKING: Record<BookingStatus, { label: string; icon: React.ReactNode }> = {
  requested: { label: "Requested", icon: <ClockIcon /> },
  accepted: { label: "Accepted", icon: <CheckIcon /> },
  declined: { label: "Declined", icon: <XIcon /> },
  completed: { label: "Completed", icon: <CheckIcon /> },
  cancelled: { label: "Cancelled", icon: <XIcon /> },
};

/** Icon + text, never colour alone. */
export function StatusChip({ status }: { status: BookingStatus }) {
  const s = BOOKING[status];
  return (
    <span className={`chip chip-${status}`}>
      {s.icon}
      {s.label}
    </span>
  );
}

export function FlagChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="chip chip-warn">
      <FlagIcon />
      {children}
    </span>
  );
}

export function OkChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="chip chip-ok">
      <CheckIcon />
      {children}
    </span>
  );
}

export function NeutralChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="chip chip-completed">
      <CircleIcon />
      {children}
    </span>
  );
}
