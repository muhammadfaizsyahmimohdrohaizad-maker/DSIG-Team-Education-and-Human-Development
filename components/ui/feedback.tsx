// Feedback from the UI kit: inline status messages, alerts, empty states, error states and loading placeholders.
// Each one says what happened in plain words and offers one clear next step. Server-component friendly.
import type { ReactNode } from "react";
import { cn } from "./cn";
import { CheckIcon } from "./icons";

/** Saved confirmations and other good news, announced politely. Navy band. */
export function StatusMessage({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div role="status" className={cn("flex items-center gap-3 rounded-button bg-navy px-4 py-3 text-[15px] text-white", className)}>
      <CheckIcon size={18} />
      <span>{children}</span>
    </div>
  );
}

/** Neutral information that should be announced (offline, AI unavailable). Cream band. */
export function InfoMessage({ children, className }: { children: ReactNode; className?: string }) {
  return <p role="status" className={cn("m-0 rounded-field bg-cream px-3.5 py-3", className)}>{children}</p>;
}

/** Something the person must fix, announced at once. Maroon outline, never blames the student. */
export function AlertMessage({ children, className, id }: { children: ReactNode; className?: string; id?: string }) {
  return <p role="alert" id={id} className={cn("m-0 rounded-field border border-maroon px-3.5 py-3 text-[15px] font-semibold text-maroon", className)}>{children}</p>;
}

/** An empty screen or section: what will appear here, and the one thing to do next. */
export function EmptyState({ title, children, actions, headingLevel = 3, className }: { title: string; children?: ReactNode; actions?: ReactNode; headingLevel?: 2 | 3; className?: string }) {
  const H = headingLevel === 2 ? "h2" : "h3";
  return (
    <div className={cn("flex flex-col gap-3 rounded-card border border-hairline bg-white p-5", className)}>
      <H className="m-0 text-[17px] leading-snug">{title}</H>
      {children ? <div className="flex flex-col gap-2">{children}</div> : null}
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

/** Something failed on our side. Plain words, no raw error codes; the reference goes in "Copy error details". */
export function ErrorState({ title, children, actions, className }: { title: string; children?: ReactNode; actions?: ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-3 rounded-card border border-hairline bg-white p-5", className)}>
      <p role="alert" className="m-0"><b className="text-navy">{title}</b>{children ? <> {children}</> : null}</p>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

/** One grey bar. Use several, shaped like the content they stand in for. */
export function Skeleton({ className }: { className?: string }) {
  return <span aria-hidden="true" className={cn("block h-3.5 rounded-md bg-hairline motion-safe:animate-pulse", className)} />;
}

/** A loading list shaped like rows with an icon and two lines. Show it only when loading takes over 1 second. */
export function SkeletonList({ label, rows = 3, className }: { label: string; rows?: number; className?: string }) {
  const widths = [["w-3/5", "w-[85%]"], ["w-1/2", "w-3/4"], ["w-[55%]", "w-4/5"]] as const;
  return (
    <div aria-busy="true" className={cn("flex flex-col gap-3 rounded-card border border-hairline bg-white p-5", className)}>
      <span role="status" className="font-semibold text-navy">{label}</span>
      <div aria-hidden="true" className="flex flex-col gap-2.5">
        {Array.from({ length: rows }, (_, i) => {
          const w = widths[i % widths.length] ?? widths[0];
          return (
            <div key={i} className="flex items-center gap-3 rounded-button border border-hairline p-3">
              <Skeleton className="size-10" />
              <span className="flex flex-1 flex-col gap-1.5">
                <Skeleton className={w[0]} />
                <Skeleton className={cn("h-3", w[1])} />
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
