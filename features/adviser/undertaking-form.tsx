"use client";
// Staff undertaking board: the adviser ticks the box and accepts; the server records the version and time.
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { AlertMessage, Button, CheckboxRow } from "@/components/ui";
import { acceptUndertaking } from "./actions";

export function UndertakingForm() {
  const router = useRouter();
  const [agreed, setAgreed] = useState(false);
  const [tried, setTried] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const accept = () => {
    if (pending) return;
    setTried(true);
    if (!agreed) return;
    setError(null);
    start(async () => {
      const r = await acceptUndertaking();
      if (!r.ok) { setError(r.error.message); return; }
      router.push("/adviser/requests");
    });
  };
  return (
    <div className="flex flex-col gap-3">
      <CheckboxRow id="agree" checked={agreed} onChange={(e) => { setAgreed(e.target.checked); setTried(false); }} error={tried && !agreed ? "Tick the box to accept the undertaking." : undefined}>
        <b className="text-navy">I have read this undertaking and I agree to it.</b>
        <br /><span className="text-sm text-muted">We record the date, time and version you accepted.</span>
      </CheckboxRow>
      {error ? <AlertMessage>{error}</AlertMessage> : null}
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={accept} loading={pending} loadingText="Saving">Accept and open my dashboard</Button>
        <form action="/careerprep/auth/sign-out" method="post">
          <button type="submit" className="inline-flex min-h-11 items-center font-semibold text-maroon underline">Not now, log out</button>
        </form>
      </div>
    </div>
  );
}
