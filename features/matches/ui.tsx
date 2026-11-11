// Minimal local building blocks for the "Tell us about yourself" page.
// SWAP: replace with components/ui (Card, Button, Chip, Field) once the UI kit branch is merged.
import type { ReactNode } from "react";

export function Section({ step, title, optional, children, id }: { step: number; title: string; optional?: boolean; children: ReactNode; id: string }) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-4 rounded-card border border-hairline bg-white p-5">
      <h2 id={id} className="m-0 flex items-center gap-3 text-lg">
        <span aria-hidden className="inline-flex size-7 shrink-0 items-center justify-center rounded-control bg-navy text-sm text-white">{step}</span>
        <span>{title}{optional && <span className="ml-1 text-sm font-normal text-muted">(optional)</span>}</span>
      </h2>
      {children}
    </section>
  );
}

export function Chip({ label, onRemove, tone = "cream" }: { label: string; onRemove: () => void; tone?: "cream" | "navy" }) {
  const look = tone === "navy" ? "bg-navy text-white" : "bg-cream text-navy";
  return (
    <span className={`inline-flex min-h-11 items-center gap-1 rounded-full pl-4 pr-1 text-sm font-semibold ${look}`}>
      {label}
      <button type="button" onClick={onRemove} aria-label={`Remove ${label}`}
        className={`inline-flex size-9 items-center justify-center rounded-full text-base ${tone === "navy" ? "text-white" : "text-maroon"}`}>
        <span aria-hidden>×</span>
      </button>
    </span>
  );
}

export const inputClass = "min-h-11 w-full rounded-control border border-control bg-white px-3 text-base text-ink";
export const secondaryButton = "inline-flex min-h-11 items-center justify-center rounded-button border border-navy bg-white px-4 font-semibold text-navy";
export const primaryButton = "inline-flex min-h-11 items-center justify-center rounded-button bg-maroon px-5 font-semibold text-white";

export function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return <p id={id} className="m-0 text-sm font-semibold text-maroon"><span aria-hidden>! </span>{message}</p>;
}
