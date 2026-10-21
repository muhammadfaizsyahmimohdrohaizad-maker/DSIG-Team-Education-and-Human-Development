"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { startDemo } from "./actions";

export function ConsentForm() {
  const [checked, setChecked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const box = useRef<HTMLInputElement>(null);

  return (
    <form
      action={startDemo}
      className="stack"
      onSubmit={(e) => {
        if (!checked) {
          e.preventDefault();
          setError("Tick the box to continue.");
          box.current?.focus();
        }
      }}
    >
      <div className="field">
        <label className="check-row">
          <input
            ref={box}
            type="checkbox"
            checked={checked}
            aria-describedby={error ? "consent-note" : undefined}
            aria-invalid={error ? true : undefined}
            onChange={(e) => {
              setChecked(e.target.checked);
              setError(null);
            }}
          />
          I understand how my data is used
        </label>
        {error ? (
          <p id="consent-note" className="field-error" role="alert">
            {error}
          </p>
        ) : null}
      </div>
      <div>
        <Button type="submit">Start with the demo student</Button>
      </div>
    </form>
  );
}
