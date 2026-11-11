"use client";
// A status message that floats above the page after an action ("Saved. Students see your open times from now.").
// It never disappears on a timer (WCAG 2.2.1): the person closes it. Focus is not moved; it is announced politely.
import type { ReactNode } from "react";
import { cn } from "./cn";
import { CheckIcon, XIcon } from "./icons";

export function Toast({ open, onClose, children, className }: { open: boolean; onClose: () => void; children: ReactNode; className?: string }) {
  return (
    <div role="status" aria-live="polite" className={cn("fixed inset-x-4 bottom-24 z-50 flex justify-center tablet:bottom-6", !open && "pointer-events-none", className)}>
      {open ? (
        <div className="flex w-full max-w-md items-center gap-3 rounded-button bg-navy py-1 pl-4 pr-1 text-[15px] text-white shadow-[0_8px_24px_rgba(27,54,93,0.18)] on-navy">
          <CheckIcon size={18} />
          <span className="flex-1 py-2">{children}</span>
          <button type="button" onClick={onClose} aria-label="Close message" className="inline-flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-field text-white hover:bg-white/10">
            <XIcon size={18} />
          </button>
        </div>
      ) : null}
    </div>
  );
}
