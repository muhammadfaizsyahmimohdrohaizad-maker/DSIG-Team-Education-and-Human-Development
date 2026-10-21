"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Field } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { signIn, signUp, type AuthState } from "./actions";

const errorFor = (state: AuthState, field: string) => (state?.field === field ? state.error : null);

export function SignInForm({ next }: { next?: string }) {
  const [state, action] = useActionState<AuthState, FormData>(signIn, null);
  return (
    <form action={action} className="stack" noValidate>
      {next ? <input type="hidden" name="next" value={next} /> : null}
      {state?.error && !state.field ? <p className="notice notice-danger" role="alert">{state.error}</p> : null}
      <Field id="email" label="Email" error={errorFor(state, "email")}>
        {(p) => <input {...p} name="email" type="text" inputMode="email" autoComplete="email" defaultValue={state?.values?.email} placeholder="name@student.gmi.edu.my" />}
      </Field>
      <Field id="password" label="Password" error={errorFor(state, "password")}>
        {(p) => <input {...p} name="password" type="password" autoComplete="current-password" />}
      </Field>
      <div>
        <SubmitButton>Sign in</SubmitButton>
      </div>
      <p className="secondary muted">
        New here? <Link href="/sign-up">Create an account</Link>
      </p>
    </form>
  );
}

export function SignUpForm() {
  const [state, action] = useActionState<AuthState, FormData>(signUp, null);
  const [kind, setKind] = useState(state?.values?.kind ?? "student");
  return (
    <form action={action} className="stack" noValidate>
      {state?.error && !state.field ? <p className="notice notice-danger" role="alert">{state.error}</p> : null}
      <fieldset className="stack-sm">
        <legend>I am</legend>
        <div className="choices">
          {[
            ["student", "A student", "GMI Diploma in Software Engineering"],
            ["adviser", "A career adviser", "Needs a staff code"],
            ["institution", "Institution staff", "Needs a staff code"],
          ].map(([value, label, hint]) => (
            <label key={value} className="choice">
              <input type="radio" name="kind" value={value} checked={kind === value} onChange={() => setKind(value)} />
              <span>
                {label}
                <small>{hint}</small>
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <Field id="name" label="Full name" error={errorFor(state, "name")}>
        {(p) => <input {...p} name="name" type="text" autoComplete="name" defaultValue={state?.values?.name} />}
      </Field>
      <Field id="email" label="Email" error={errorFor(state, "email")}>
        {(p) => <input {...p} name="email" type="text" inputMode="email" autoComplete="email" defaultValue={state?.values?.email} placeholder="name@student.gmi.edu.my" />}
      </Field>
      <Field id="password" label="Password" helper="At least 8 characters." error={errorFor(state, "password")}>
        {(p) => <input {...p} name="password" type="password" autoComplete="new-password" />}
      </Field>
      {kind === "student" ? (
        <Field id="semester" label="Semester" error={errorFor(state, "semester")}>
          {(p) => (
            <select {...p} name="semester" defaultValue={state?.values?.semester ?? ""}>
              <option value="" disabled>
                Choose your semester
              </option>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                <option key={n} value={n}>
                  Semester {n}
                </option>
              ))}
            </select>
          )}
        </Field>
      ) : (
        <>
          <Field id="unit" label="Unit" optional helper={kind === "adviser" ? "For example, Career Services." : "For example, Academic Affairs."}>
            {(p) => <input {...p} name="unit" type="text" defaultValue={state?.values?.unit} />}
          </Field>
          <Field id="code" label="Staff code" helper="Your CareerPrep administrator gives you this." error={errorFor(state, "code")}>
            {(p) => <input {...p} name="code" type="text" autoComplete="off" />}
          </Field>
        </>
      )}
      <p className="secondary muted prose">
        By creating an account you agree to the <Link href="/legal/terms">terms of use</Link>. You choose what we may do with your
        data on the next screen; see the <Link href="/legal/privacy">privacy notice</Link>.
      </p>
      <div>
        <SubmitButton>Create account</SubmitButton>
      </div>
      <p className="secondary muted">
        Already have an account? <Link href="/sign-in">Sign in</Link>
      </p>
    </form>
  );
}
