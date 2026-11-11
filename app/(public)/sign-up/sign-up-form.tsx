"use client";
// Sign-up form (Login board, "Sign up"). Validates with signUpInput from lib/schemas, shows errors after blur,
// and calls the signUp server action from features/auth/actions.ts, whose field errors land on the same fields.
// Under 18: the parent's email is asked for, and the AI box is not shown (AI stays off for under-18 accounts).
import { useCallback, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import {
  AlertMessage, Button, CheckboxRow, ChoiceGroup, PasswordInput, RadioCard, StatusMessage, TextInput,
  useActionForm, zodFieldErrors, type FieldErrors,
} from "@/components/ui";
import type { Result } from "@/lib/result";
import { signUpInput } from "@/lib/schemas";

type SignUpInput = z.input<typeof signUpInput>;

type Values = {
  role: "student" | "adviser";
  fullName: string;
  email: string;
  password: string;
  staffCode: string;
  isUnder18: boolean;
  parentEmail: string;
  "consents.termsPrivacy": boolean;
  "consents.storeUse": boolean;
  "consents.aiProcessing": boolean;
  "consents.adviserVisibility": boolean;
};

const initial: Values = {
  role: "student",
  fullName: "",
  email: "",
  password: "",
  staffCode: "",
  isUnder18: false,
  parentEmail: "",
  "consents.termsPrivacy": false,
  "consents.storeUse": false,
  "consents.aiProcessing": false,
  "consents.adviserVisibility": false,
};

function toInput(v: Values): SignUpInput {
  const student = v.role === "student";
  const under18 = student && v.isUnder18;
  return {
    role: v.role,
    fullName: v.fullName,
    email: v.email,
    password: v.password,
    isUnder18: under18,
    parentEmail: under18 && v.parentEmail.trim() ? v.parentEmail : undefined,
    staffCode: student ? undefined : v.staffCode,
    consents: {
      termsPrivacy: v["consents.termsPrivacy"] as true,
      storeUse: v["consents.storeUse"] as true,
      aiProcessing: student && !under18 && v["consents.aiProcessing"],
      adviserVisibility: student && v["consents.adviserVisibility"],
    },
  };
}

const idFor = (name: string) => `su-${name.replace(".", "-")}`;

export function SignUpForm({ signUp }: { signUp: (input: SignUpInput) => Promise<Result<unknown>> }) {
  const router = useRouter();
  const validate = useCallback((v: Values): FieldErrors => {
    const errors = zodFieldErrors(signUpInput.safeParse(toInput(v)));
    // Advisers are not shown the "store and use my modules" box, so its error has nowhere to go (see report).
    if (v.role === "adviser") delete errors["consents.storeUse"];
    return errors;
  }, []);
  const form = useActionForm<Values>({ initial, validate, idFor });
  const [waitingFor, setWaitingFor] = useState<string | null>(null);

  const v = form.values;
  const student = v.role === "student";
  const under18 = student && v.isUnder18;

  if (waitingFor) {
    return (
      <div className="flex flex-col gap-3">
        <StatusMessage>We emailed {waitingFor}.</StatusMessage>
        <p className="m-0">Your account opens once your parent or guardian agrees. The link in the email works for 7 days. You can close this page.</p>
      </div>
    );
  }

  function box(name: "consents.termsPrivacy" | "consents.storeUse" | "consents.aiProcessing" | "consents.adviserVisibility") {
    return {
      id: idFor(name),
      checked: v[name],
      onChange: (e: ChangeEvent<HTMLInputElement>) => { form.set(name, e.target.checked); form.blur(name); },
      error: form.error(name),
    };
  }

  return (
    <form
      noValidate
      onSubmit={form.onSubmit(
        (values) => signUp(toInput(values)),
        () => {
          if (!student) router.push("/staff/undertaking");
          else if (under18) setWaitingFor(v.parentEmail.trim());
          else router.push("/dashboard");
        },
      )}
      className="m-0 flex flex-col gap-[18px]"
    >
      <fieldset className="m-0 flex min-w-0 flex-col gap-2 border-0 p-0">
        <legend className="mb-2 p-0 text-[15px] font-semibold text-navy">I am</legend>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-2">
          <RadioCard id="su-role-student" name="role" value="student" checked={student} onChange={() => form.set("role", "student")}>A student</RadioCard>
          <RadioCard id="su-role-adviser" name="role" value="adviser" checked={!student} onChange={() => form.set("role", "adviser")}>A career adviser</RadioCard>
        </div>
      </fieldset>

      <TextInput
        id={idFor("fullName")} label="Full name" autoComplete="name"
        value={v.fullName} onChange={(e) => form.set("fullName", e.target.value)} onBlur={() => form.blur("fullName")} error={form.error("fullName")}
      />
      <TextInput
        id={idFor("email")} label="Email" type="email" autoComplete="email" placeholder="name@student.gmi.edu.my"
        value={v.email} onChange={(e) => form.set("email", e.target.value)} onBlur={() => form.blur("email")} error={form.error("email")}
      />
      <PasswordInput
        id={idFor("password")} label="Password" autoComplete="new-password" hint="At least 8 characters"
        value={v.password} onChange={(e) => form.set("password", e.target.value)} onBlur={() => form.blur("password")} error={form.error("password")}
      />

      {!student ? (
        <TextInput
          id={idFor("staffCode")} label="Staff code" autoComplete="off"
          hint="Your career services office gives you this code. You will accept the staff confidentiality undertaking next."
          value={v.staffCode} onChange={(e) => form.set("staffCode", e.target.value)} onBlur={() => form.blur("staffCode")} error={form.error("staffCode")}
        />
      ) : null}

      {student ? (
        <>
          <CheckboxRow id={idFor("isUnder18")} checked={v.isUnder18} onChange={(e) => form.set("isUnder18", e.target.checked)}>
            I am under 18
          </CheckboxRow>
          {under18 ? (
            <TextInput
              id={idFor("parentEmail")} label="Parent or guardian's email" type="email" autoComplete="off" placeholder="name@example.com"
              hint="We email them to confirm. Your account opens once they agree."
              value={v.parentEmail} onChange={(e) => form.set("parentEmail", e.target.value)} onBlur={() => form.blur("parentEmail")} error={form.error("parentEmail")}
            />
          ) : null}
        </>
      ) : null}

      <ChoiceGroup
        legend="Your choices"
        panel
        hint={<>Optional boxes can be changed later in Settings and privacy. Read the <Link href="/terms">Terms &amp; Conditions</Link> and <Link href="/privacy">Privacy Notice</Link>.</>}
      >
        <CheckboxRow {...box("consents.termsPrivacy")} requirement="required">I agree to the Terms &amp; Conditions and the Privacy Notice.</CheckboxRow>
        {student ? (
          <>
            <CheckboxRow {...box("consents.storeUse")} requirement="required">
              Store and use my modules, skills and answers to match me to jobs and plan my learning. I can delete my data at any time.
            </CheckboxRow>
            {under18 ? null : (
              <CheckboxRow {...box("consents.aiProcessing")} requirement="optional">
                Send my notes and interview answers to an external AI provider (Google Gemini) for feedback. Without this, CareerPrep uses fixed hints only.
              </CheckboxRow>
            )}
            <CheckboxRow {...box("consents.adviserVisibility")} requirement="optional">Let my career adviser see my progress before a session.</CheckboxRow>
            {under18 ? <p className="m-0 text-sm text-muted">AI feedback stays off for students under 18. Lessons, checks and checklist marking work without it.</p> : null}
          </>
        ) : null}
      </ChoiceGroup>

      {form.formError ? <AlertMessage>{form.formError}</AlertMessage> : null}
      <Button type="submit" size="large" fullWidth loading={form.pending} loadingText="Creating your account…">Create account</Button>
    </form>
  );
}
