// Status tags from the UI kit. Every tag has words and an icon; colour is never the only signal.
// The full list (System Design 4.3): You have it, Learning, Missing, Check needed, Requested, Accepted,
// Declined, AI-generated, Made without AI.
import type { ReactNode } from "react";
import { cn } from "./cn";
import { AlertIcon, CheckIcon, ClockIcon, DotsIcon, PlusIcon, ShieldIcon, SparkIcon, XIcon } from "./icons";

export type TagKind =
  | "have"
  | "learning"
  | "missing"
  | "check_needed"
  | "requested"
  | "accepted"
  | "declined"
  | "ai_generated"
  | "no_ai";

type TagStyle = { label: string; className: string; icon: ReactNode };

const ICON = 14;

export const TAGS: Record<TagKind, TagStyle> = {
  have: { label: "You have it", className: "bg-navy text-white", icon: <CheckIcon size={ICON} /> },
  learning: { label: "Learning", className: "bg-cream text-maroon", icon: <DotsIcon size={ICON} /> },
  missing: { label: "Missing", className: "bg-cream text-navy", icon: <PlusIcon size={ICON} /> },
  check_needed: { label: "Check needed", className: "border border-maroon bg-white text-maroon", icon: <AlertIcon size={ICON} /> },
  requested: { label: "Requested", className: "bg-cream text-maroon", icon: <ClockIcon size={ICON} /> },
  accepted: { label: "Accepted", className: "bg-navy text-white", icon: <CheckIcon size={ICON} /> },
  declined: { label: "Declined", className: "bg-hairline text-ink", icon: <XIcon size={ICON} /> },
  ai_generated: { label: "AI-generated", className: "border border-maroon bg-white text-maroon", icon: <SparkIcon size={ICON} /> },
  no_ai: { label: "Made without AI", className: "border border-navy bg-white text-navy", icon: <ShieldIcon size={ICON} /> },
};

export function StatusTag({ kind, label, className }: { kind: TagKind; /** Override the words, e.g. for Bahasa Melayu. */ label?: string; className?: string }) {
  const tag = TAGS[kind];
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-[3px] text-[13px] font-bold leading-snug", tag.className, className)}>
      {tag.icon}
      {label ?? tag.label}
    </span>
  );
}

/** A neutral pill for labels that are not statuses ("Coming later", "Checklist marking"). */
export function Pill({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center whitespace-nowrap rounded-full border border-navy px-2.5 py-[3px] text-[13px] font-bold leading-snug text-navy", className)}>
      {children}
    </span>
  );
}
