"use client";
// The parent's decision (ParentConsent board, "The page the parent opens"). Agree needs both boxes ticked;
// Decline needs nothing. Checks the boxes with parentAgreeInput and calls recordParentDecision.
import { useState } from "react";
import { AlertMessage, Button, CheckboxRow, ChoiceGroup } from "@/components/ui";
import { zodFieldErrors, type FieldErrors } from "@/components/ui/use-action-form";
import type { Result } from "@/lib/result";
import { parentAgreeInput, type parentDecisionInput } from "@/lib/schemas";
import type { z } from "zod";

type DecisionInput = z.input<typeof parentDecisionInput> | z.input<typeof parentAgreeInput>;

export function ParentDecisionForm({
  token,
  studentFullName,
  studentFirstName,
  recordParentDecision,
}: {
  token: string;
  studentFullName: string;
  studentFirstName: string;
  recordParentDecision: (input: DecisionInput) => Promise<Result<unknown>>;
}) {
  const [isParent, setIsParent] = useState(false);
  const [agreesToUse, setAgreesToUse] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [alert, setAlert] = useState<string | null>(null);
  const [pending, setPending] = useState<"agree" | "decline" | null>(null);
  const [done, setDone] = useState<"agree" | "decline" | null>(null);

  async function send(input: DecisionInput) {
    if (pending) return;
    if (input.decision === "agree") {
      const errs = zodFieldErrors(parentAgreeInput.safeParse(input));
      setErrors(errs);
      if (Object.keys(errs).length > 0) {
        setAlert("Tick both boxes to agree, or choose Decline.");
        document.getElementById(errs.isParent ? "pc-is-parent" : "pc-agrees")?.focus();
        return;
      }
    }
    setAlert(null);
    setPending(input.decision);
    const result = await recordParentDecision(input);
    setPending(null);
    if (result.ok) setDone(input.decision);
    else setAlert(`${result.error.message} Reference: ${result.error.ref}.`);
  }

  if (done === "agree") {
    return (
      <div role="status" className="flex flex-col gap-2 rounded-button bg-cream p-[18px]">
        <b className="text-lg text-navy">Thank you. {studentFirstName}&apos;s account is open.</b>
        <span>We emailed you a copy of what you agreed to. To withdraw consent later, reply to that email or ask {studentFirstName} to delete the account in Settings and privacy.</span>
      </div>
    );
  }
  if (done === "decline") {
    return (
      <div role="status" className="flex flex-col gap-2 rounded-button bg-cream p-[18px]">
        <b className="text-lg text-navy">You declined. {studentFirstName}&apos;s account will not open.</b>
        <span>We deleted the details {studentFirstName} entered. A GMI career adviser can still help in person.</span>
      </div>
    );
  }

  return (
    <form noValidate onSubmit={(e) => { e.preventDefault(); void send({ token, decision: "agree", isParent: isParent as true, agreesToUse: agreesToUse as true }); }} className="m-0 flex flex-col gap-3.5">
      <ChoiceGroup legend="Before you agree">
        <CheckboxRow id="pc-is-parent" checked={isParent} onChange={(e) => { setIsParent(e.target.checked); setErrors(({ isParent: _x, ...rest }) => rest); }} error={errors.isParent}>
          I am {studentFullName}&apos;s parent or legal guardian.
        </CheckboxRow>
        <CheckboxRow id="pc-agrees" checked={agreesToUse} onChange={(e) => { setAgreesToUse(e.target.checked); setErrors(({ agreesToUse: _x, ...rest }) => rest); }} error={errors.agreesToUse}>
          I agree to CareerPrep keeping and using {studentFirstName}&apos;s data as described above.
        </CheckboxRow>
      </ChoiceGroup>
      {alert ? <AlertMessage>{alert}</AlertMessage> : null}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" loading={pending === "agree"} loadingText="Saving…">Agree and open {studentFirstName}&apos;s account</Button>
        <Button variant="outline" loading={pending === "decline"} loadingText="Saving…" onClick={() => void send({ token, decision: "decline" })}>Decline</Button>
      </div>
    </form>
  );
}
