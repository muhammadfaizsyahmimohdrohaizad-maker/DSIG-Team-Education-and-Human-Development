"use client";
// Password field with a Show/Hide toggle inside the box. Same label, hint and error wiring as TextInput.
import { useState, type InputHTMLAttributes, type ReactNode } from "react";
import { Field, controlClasses, describedBy } from "./field";
import { cn } from "./cn";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "type" | "disabled"> & {
  id: string;
  label: ReactNode;
  hint?: ReactNode;
  error?: string;
  labelAside?: ReactNode;
};

export function PasswordInput({ id, label, hint, error, labelAside, className, ...rest }: Props) {
  const [shown, setShown] = useState(false);
  return (
    <Field id={id} label={label} hint={hint} error={error} labelAside={labelAside}>
      <div className="relative">
        <input
          id={id}
          type={shown ? "text" : "password"}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(id, hint, error)}
          className={cn(controlClasses, "pr-[92px]", className)}
          {...rest}
        />
        <button
          type="button"
          onClick={() => setShown((s) => !s)}
          aria-label={shown ? "Hide password" : "Show password"}
          aria-pressed={shown}
          className="absolute right-1 top-1/2 min-h-11 min-w-[76px] -translate-y-1/2 cursor-pointer rounded-control px-3 text-sm font-semibold text-maroon hover:bg-cream"
        >
          {shown ? "Hide" : "Show"}
        </button>
      </div>
    </Field>
  );
}
