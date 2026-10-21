"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { SubmitButton } from "@/components/ui/submit-button";
import type { Consent } from "@/lib/types";
import { saveConsent, type ConsentState } from "./actions";

type Box = { name: string; label: string; detail: React.ReactNode; required?: boolean };

const BOXES: Box[] = [
  {
    name: "processing",
    label: "Store and use my data to guide me",
    detail: "The modules I tick, my confidence ratings, my practice and interview answers, and my bookings. Required: the app can't work without it.",
    required: true,
  },
  {
    name: "ai",
    label: "Use an external AI provider for hints and feedback",
    detail: (
      <>
        My lesson questions and typed interview answers are sent to a language-model provider that may process them outside
        Malaysia. Without this, hints come from a fixed set and interview answers go to an adviser instead of getting AI feedback.{" "}
        <Link href="/legal/ai">How the AI is used</Link>
      </>
    ),
  },
  {
    name: "emails",
    label: "Email me when a booking changes",
    detail: "Each email carries only the status, the time and a link. Never my gaps, answers or feedback.",
  },
  {
    name: "adviser",
    label: "Let my career adviser see my progress",
    detail: "My target role, gap skills and a one-line summary of my latest interview feedback. Read-only. Without this, an adviser sees only bookings I send.",
  },
];

/** Separate, unticked boxes. Only the first is required. Used on first sign-in and in Settings. */
export function ConsentForm({ initial, from }: { initial?: Consent | null; from?: "settings" }) {
  const [state, action] = useActionState<ConsentState, FormData>(saveConsent, null);
  const [under18, setUnder18] = useState(initial?.under18 ?? false);
  const start: Record<string, boolean> = {
    processing: initial?.processing ?? false,
    ai: initial?.aiProcessing ?? false,
    emails: initial?.bookingEmails ?? false,
    adviser: initial?.adviserVisibility ?? false,
  };

  return (
    <form action={action} className="stack">
      {from ? <input type="hidden" name="from" value={from} /> : null}
      <fieldset className="stack">
        <legend>What may CareerPrep do with your data?</legend>
        {BOXES.map((b) => (
          <div key={b.name} className="stack-sm">
            <label className="check-row" style={{ alignItems: "flex-start" }}>
              <input
                type="checkbox"
                name={b.name}
                defaultChecked={start[b.name]}
                aria-describedby={`${b.name}-detail${state?.field === b.name ? ` ${b.name}-error` : ""}`}
                aria-invalid={state?.field === b.name ? true : undefined}
              />
              <span>
                <span style={{ fontWeight: 500 }}>{b.label}</span>
                {b.required ? <span className="muted"> (required)</span> : <span className="muted"> (optional)</span>}
                <span id={`${b.name}-detail`} className="field-hint" style={{ display: "block" }}>
                  {b.detail}
                </span>
              </span>
            </label>
            {state?.field === b.name ? (
              <p id={`${b.name}-error`} className="field-error" role="alert">
                {state.error}
              </p>
            ) : null}
          </div>
        ))}
      </fieldset>

      <fieldset className="stack-sm">
        <legend>Age</legend>
        <label className="check-row">
          <input type="checkbox" name="under18" checked={under18} onChange={(e) => setUnder18(e.target.checked)} />
          I am under 18
        </label>
        {under18 ? (
          <div className="stack-sm">
            <label className="check-row" style={{ alignItems: "flex-start" }}>
              <input
                type="checkbox"
                name="parental"
                defaultChecked={initial?.parentalConsent ?? false}
                aria-invalid={state?.field === "parental" ? true : undefined}
                aria-describedby={state?.field === "parental" ? "parental-error" : undefined}
              />
              <span>My parent or guardian has read the privacy notice and agrees to the choices above</span>
            </label>
            {state?.field === "parental" ? (
              <p id="parental-error" className="field-error" role="alert">
                {state.error}
              </p>
            ) : null}
          </div>
        ) : null}
      </fieldset>

      <p className="secondary muted prose">
        CareerPrep never stores audio. If you use dictation in Chrome, your browser sends the sound to its maker (Google) to turn
        it into text, under their terms; we only receive the text. You can change these choices or delete everything at any time
        in Settings. <Link href="/legal/privacy">Privacy notice</Link> · <Link href="/legal/processors">Who processes your data</Link>
      </p>
      <div>
        <SubmitButton>{from === "settings" ? "Save my choices" : "Agree and continue"}</SubmitButton>
      </div>
    </form>
  );
}
