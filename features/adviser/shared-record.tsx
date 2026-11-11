"use client";
import { useState } from "react";
import { ActionForm } from "@/components/action-form";
import { openRequest, type SharedSummary } from "./actions";

export function SharedRecord({ id }: { id: string }) {
  const [summary, setSummary] = useState<SharedSummary>();
  async function open() {
    const r = await openRequest({ bookingId: id });
    if (!r.ok) return r.error.message;
    setSummary(r.value);
    return "";
  }
  if (!summary) return <ActionForm submit={open} label="Open shared record" />;
  return (
    <div>
      <h3>Shared for this session</h3>
      {!summary.shared.length && <p>No items shared.</p>}
      {summary.shared.includes("target_matches") && <p>Target: {summary.target?.title || "None selected"}</p>}
      {summary.gaps?.map((g) => (
        <p key={g.skill}>
          {g.label} · {g.state.replace("_", " ")}
        </p>
      ))}
      {summary.plan?.map((p) => (
        <p key={p.programme + p.institution}>
          {p.programme} · {p.institution}
        </p>
      ))}
      {summary.interview && (
        <p>
          {summary.interview.prompt} · Score {summary.interview.total ?? "unavailable"}
        </p>
      )}
    </div>
  );
}
