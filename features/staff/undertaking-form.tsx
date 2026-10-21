"use client";

import { useActionState } from "react";
import { SubmitButton } from "@/components/ui/submit-button";
import { acceptUndertaking, type UndertakingState } from "./actions";

export function UndertakingForm() {
  const [state, action] = useActionState<UndertakingState, FormData>(acceptUndertaking, null);
  return (
    <form action={action} className="stack">
      <div className="stack-sm">
        <label className="check-row">
          <input type="checkbox" name="agree" aria-invalid={state?.error ? true : undefined} aria-describedby={state?.error ? "agree-error" : undefined} />
          I have read this undertaking and I agree to it
        </label>
        {state?.error ? (
          <p id="agree-error" className="field-error" role="alert">
            {state.error}
          </p>
        ) : null}
      </div>
      <div>
        <SubmitButton>Accept and open my dashboard</SubmitButton>
      </div>
    </form>
  );
}
