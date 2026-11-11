// Form fields from the UI kit: visible label above, optional hint, error below once the field has been left.
// The label, hint and error are wired to the control with aria-describedby and aria-invalid.
// Server-component friendly: blur tracking lives in useActionForm (use-action-form.ts), which passes `error` in.
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "./cn";

export const controlClasses =
  "w-full min-h-12 rounded-field border border-control bg-white px-[14px] font-sans text-base text-ink placeholder:text-muted aria-[invalid=true]:border-2 aria-[invalid=true]:border-maroon";

export function hintId(id: string) { return `${id}-hint`; }
export function errorId(id: string) { return `${id}-error`; }

/** aria-describedby value for a control: error first so it is read first, then the hint. */
export function describedBy(id: string, hint?: ReactNode, error?: string): string | undefined {
  const ids = [error ? errorId(id) : null, hint ? hintId(id) : null].filter(Boolean);
  return ids.length ? ids.join(" ") : undefined;
}

export type FieldProps = {
  id: string;
  label: ReactNode;
  hint?: ReactNode;
  error?: string;
  /** Something shown at the right of the label row, such as "Forgot password?". */
  labelAside?: ReactNode;
  className?: string;
  children: ReactNode;
};

export function Field({ id, label, hint, error, labelAside, className, children }: FieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="text-[15px] font-semibold text-navy">{label}</label>
        {labelAside}
      </div>
      {children}
      {error ? <FieldError id={errorId(id)}>{error}</FieldError> : null}
      {hint ? <span id={hintId(id)} className="text-sm text-muted">{hint}</span> : null}
    </div>
  );
}

export function FieldError({ id, children }: { id: string; children: ReactNode }) {
  return <span id={id} className="text-sm font-semibold text-maroon">{children}</span>;
}

type Common = { id: string; label: ReactNode; hint?: ReactNode; error?: string; labelAside?: ReactNode; fieldClassName?: string };

export type TextInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "disabled"> & Common;

export function TextInput({ id, label, hint, error, labelAside, fieldClassName, className, type = "text", ...rest }: TextInputProps) {
  return (
    <Field id={id} label={label} hint={hint} error={error} labelAside={labelAside} className={fieldClassName}>
      <input
        id={id}
        type={type}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        className={cn(controlClasses, className)}
        {...rest}
      />
    </Field>
  );
}

export type TextareaProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "id" | "disabled"> & Common;

export function Textarea({ id, label, hint, error, labelAside, fieldClassName, className, rows = 4, ...rest }: TextareaProps) {
  return (
    <Field id={id} label={label} hint={hint} error={error} labelAside={labelAside} className={fieldClassName}>
      <textarea
        id={id}
        rows={rows}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        className={cn(controlClasses, "py-2.5 leading-normal", className)}
        {...rest}
      />
    </Field>
  );
}

export type SelectOption = { value: string; label: string };
export type SelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, "id" | "disabled"> & Common & { options: SelectOption[] };

export function Select({ id, label, hint, error, labelAside, fieldClassName, className, options, ...rest }: SelectProps) {
  return (
    <Field id={id} label={label} hint={hint} error={error} labelAside={labelAside} className={fieldClassName}>
      <select
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        className={cn(controlClasses, className)}
        {...rest}
      >
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </Field>
  );
}
