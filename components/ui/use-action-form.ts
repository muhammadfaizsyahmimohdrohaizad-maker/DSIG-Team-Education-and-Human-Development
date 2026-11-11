"use client";
// Form state for the UI kit's rules:
// - errors appear after a field is left (blur), or for every field once the person presses the submit button;
// - an error clears as soon as the value is fixed, without waiting for another blur;
// - buttons are never disabled: submitting with something missing shows what to fix and moves focus to it;
// - field errors from a server action's Result (error.fields) appear on the same fields;
// - repeat presses while an action runs are ignored, and `pending` drives the button's loading state.
import { useMemo, useState, useTransition, type FormEvent } from "react";
import type { Result } from "@/lib/result";

export type FormValues = Record<string, string | boolean>;
export type FieldErrors = Partial<Record<string, string>>;

/** Turns a Zod safeParse result into { "path.to.field": "first message" }. */
export function zodFieldErrors(result: { success: boolean; error?: { issues: ReadonlyArray<{ path: ReadonlyArray<PropertyKey>; message: string }> } }): FieldErrors {
  const out: FieldErrors = {};
  if (result.success || !result.error) return out;
  for (const issue of result.error.issues) {
    const key = issue.path.map(String).join(".");
    if (!(key in out)) out[key] = issue.message;
  }
  return out;
}

export function useActionForm<V extends FormValues>(opts: {
  initial: V;
  validate: (values: V) => FieldErrors;
  /** DOM id of the control for a field name, so focus can move to the first error. Defaults to the name. */
  idFor?: (name: string) => string;
}) {
  const { initial, validate, idFor = (n: string) => n } = opts;
  const [values, setValues] = useState<V>(initial);
  const [touched, setTouched] = useState<ReadonlySet<string>>(new Set());
  const [submitted, setSubmitted] = useState(false);
  const [serverErrors, setServerErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const clientErrors = useMemo(() => validate(values), [validate, values]);

  function error(name: string): string | undefined {
    const server = serverErrors[name];
    if (server) return server;
    return submitted || touched.has(name) ? clientErrors[name] : undefined;
  }

  function set<K extends keyof V & string>(name: K, value: V[K]) {
    setValues((v) => ({ ...v, [name]: value }));
    if (serverErrors[name]) setServerErrors(({ [name]: _gone, ...rest }) => rest);
    setFormError(null);
  }

  function blur(name: string) {
    if (!touched.has(name)) setTouched((t) => new Set(t).add(name));
  }

  function focusFirst(names: string[]) {
    for (const name of names) {
      const el = document.getElementById(idFor(name));
      if (el) { el.focus(); return; }
    }
  }

  /** Returns an onSubmit handler that validates, then runs the action and hands a successful Result to onOk. */
  function onSubmit<T>(run: (values: V) => Promise<Result<T>>, onOk: (value: T) => void) {
    return (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (pending) return;
      setSubmitted(true);
      const errs = validate(values);
      const names = Object.keys(errs).filter((k) => errs[k]);
      if (names.length > 0) {
        setFormError(names.length === 1 ? "Fix the field marked below, then try again." : `Fix the ${names.length} fields marked below, then try again.`);
        focusFirst(names);
        return;
      }
      setFormError(null);
      startTransition(async () => {
        const result = await run(values);
        if (result.ok) { onOk(result.value); return; }
        const fields = result.error.fields ?? {};
        setServerErrors(fields);
        setFormError(`${result.error.message} Reference: ${result.error.ref}.`);
        focusFirst(Object.keys(fields));
      });
    };
  }

  return { values, set, blur, error, formError, setFormError, pending, onSubmit };
}
