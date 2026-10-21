"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAnnounce } from "@/components/ui/live-region";
import { addWeakAreaToReviews } from "./actions";

export function WeakAreaButton({ answerId, label, initiallyAdded }: { answerId: string; label: string; initiallyAdded: boolean }) {
  const [added, setAdded] = useState(initiallyAdded);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const announce = useAnnounce();

  if (added) {
    return (
      <p role="status" className="row" style={{ minHeight: 44 }}>
        <span className="chip chip-ok">Added to your reviews</span>
        <span className="secondary muted">“{label}” comes up in today&apos;s practice.</span>
      </p>
    );
  }
  return (
    <div className="stack-sm">
      <div>
        <Button
          variant="secondary"
          busy={busy}
          onClick={async () => {
            setBusy(true);
            setFailed(false);
            try {
              const res = await addWeakAreaToReviews(answerId);
              if (res.ok) {
                setAdded(true);
                announce("Added to your reviews.");
              } else setFailed(true);
            } catch {
              setFailed(true);
            } finally {
              setBusy(false);
            }
          }}
        >
          Add weak area to my reviews
        </Button>
      </div>
      {failed ? (
        <p className="field-error" role="alert">
          We couldn&apos;t add it. Check your connection and try again.
        </p>
      ) : null}
    </div>
  );
}
