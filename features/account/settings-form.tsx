"use client";
// Settings and privacy board: consent switches (each change appends a row, so the history is the record),
// and account deletion, confirmed by typing the full name.
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { AlertMessage, Button, Card, StatusMessage, TextInput, cn } from "@/components/ui";
import type { ConsentKind } from "@/lib/types";
import { deleteMyAccount, updateConsent, type ConsentEntry } from "./actions";

const TOGGLES: Array<{ kind: "ai_processing" | "adviser_visibility"; title: string; detail: string; on: string; off: string }> = [
  { kind: "ai_processing", title: "AI help (Google Gemini)", detail: "Gives feedback on your mock interview answers. Only text is sent. Off means you get the rule-based checks only.", on: "Turned on AI feedback", off: "Turned off AI feedback" },
  { kind: "adviser_visibility", title: "Let my adviser see my progress", detail: "Your target job and skill progress, before each session.", on: "Let your adviser see your progress", off: "Stopped sharing progress with your adviser" },
];

const KIND_TEXT: Record<ConsentKind, [string, string]> = {
  terms_privacy: ["Agreed to the Terms and Privacy Notice", "Withdrew agreement to the Terms"],
  store_use: ["Agreed to store and use your data", "Withdrew agreement to store your data"],
  ai_processing: ["Turned on AI feedback", "Turned off AI feedback"],
  adviser_visibility: ["Let your adviser see your progress", "Stopped sharing progress with your adviser"],
  parent: ["A parent or guardian agreed", "A parent or guardian declined"],
};
const when = (iso: string) => new Date(iso).toLocaleString("en-MY", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kuala_Lumpur" });

export function ConsentSwitches({ current, history, isUnder18 }: { current: Partial<Record<ConsentKind, boolean>>; history: ConsentEntry[]; isUnder18: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const flip = (t: (typeof TOGGLES)[number], next: boolean) => {
    if (pending) return;
    setBusy(t.kind); setError(null); setMessage(null);
    start(async () => {
      const r = await updateConsent({ kind: t.kind, given: next });
      setBusy(null);
      if (!r.ok) { setError(r.error.message); return; }
      setMessage(next ? t.on : t.off);
      router.refresh();
    });
  };

  return (
    <Card as="section" aria-labelledby="choices-h" gap="gap-4">
      <h2 id="choices-h" className="m-0 text-[22px]">Your choices</h2>
      {message ? <StatusMessage>{message}.</StatusMessage> : null}
      {error ? <AlertMessage>{error}</AlertMessage> : null}
      <div className="flex flex-col gap-0.5 border-b border-hairline pb-4">
        <b className="text-navy">Store and use my data to match me to jobs and plan my learning</b>
        <span className="text-[15px]">Needed for CareerPrep to work. To withdraw it, delete your account below.</span>
      </div>
      {TOGGLES.map((t) => {
        const on = current[t.kind] ?? false;
        const locked = t.kind === "ai_processing" && isUnder18;
        return (
          <div key={t.kind} className="flex items-start justify-between gap-4 border-b border-hairline pb-4">
            <div className="flex min-w-0 flex-col gap-0.5">
              <label htmlFor={`sw-${t.kind}`} className="font-bold text-navy">{t.title}</label>
              <span className="text-[15px]">{locked ? "AI feedback stays off for accounts under 18." : t.detail}</span>
            </div>
            {locked ? <span className="whitespace-nowrap font-semibold text-muted">Off</span> : (
              <span className="flex shrink-0 items-center gap-2">
                <button
                  id={`sw-${t.kind}`}
                  type="button"
                  role="switch"
                  aria-checked={on}
                  aria-busy={busy === t.kind || undefined}
                  onClick={() => flip(t, !on)}
                  className={cn("relative h-8 w-14 rounded-full border-2 transition-colors", on ? "border-maroon bg-maroon" : "border-control bg-white")}
                >
                  <span aria-hidden="true" className={cn("absolute top-0.5 size-6 rounded-full transition-all", on ? "left-[26px] bg-white" : "left-0.5 bg-control")} />
                </button>
                <span aria-hidden="true" className={cn("w-7 text-sm font-semibold", on ? "text-maroon" : "text-muted")}>{on ? "On" : "Off"}</span>
              </span>
            )}
          </div>
        );
      })}
      <details>
        <summary className="flex min-h-11 cursor-pointer items-center font-semibold text-navy">Choice history</summary>
        {history.length ? (
          <ol className="m-0 flex list-none flex-col gap-1.5 p-0 text-[15px]">
            {history.map((h, i) => (
              <li key={`${h.kind}-${h.at}-${i}`} className="flex flex-wrap gap-x-3">
                <span className="text-muted">{when(h.at)}</span>
                <span>{KIND_TEXT[h.kind][h.given ? 0 : 1]}{h.givenBy === "parent" && h.kind !== "parent" ? " (by a parent)" : ""}</span>
              </li>
            ))}
          </ol>
        ) : <p className="m-0 text-muted">No changes yet.</p>}
      </details>
    </Card>
  );
}

export function DeleteAccount({ fullName }: { fullName: string }) {
  const [asking, setAsking] = useState(false);
  const [typed, setTyped] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [done, setDone] = useState(false);

  const confirm = () => {
    if (pending) return;
    setError(null);
    start(async () => {
      const r = await deleteMyAccount({ confirmation: typed });
      if (!r.ok) { setError(r.error.fields?.confirmation ?? r.error.message); return; }
      setDone(true);
      window.location.assign("/careerprep");
    });
  };

  if (done) return <StatusMessage>Your account has been deleted. Taking you to the homepage.</StatusMessage>;
  return (
    <Card as="section" aria-labelledby="del-h" gap="gap-3">
      <h2 id="del-h" className="m-0 text-[22px]">Delete your account</h2>
      <p className="m-0">This removes your profile, matches, plan, interview answers and bookings. It can&apos;t be undone.</p>
      {!asking ? (
        <Button variant="danger" className="self-start" onClick={() => setAsking(true)}>Delete my account and data</Button>
      ) : (
        <div role="alert" className="flex flex-col gap-3 rounded-button border border-maroon p-4">
          <b className="text-navy">Delete {fullName}&apos;s account and all of its data?</b>
          <TextInput id="confirm-name" label={`Type your full name to confirm: ${fullName}`} value={typed} onChange={(e) => setTyped(e.target.value)} error={error ?? undefined} autoComplete="off" />
          <div className="flex flex-wrap gap-2">
            <Button variant="danger" loading={pending} loadingText="Deleting" onClick={confirm}>Delete my account</Button>
            <Button variant="outline" onClick={() => { setAsking(false); setTyped(""); setError(null); }}>Keep my account</Button>
          </div>
        </div>
      )}
    </Card>
  );
}
