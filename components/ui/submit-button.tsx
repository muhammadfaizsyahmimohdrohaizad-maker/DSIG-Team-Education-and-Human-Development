"use client";

import { useFormStatus } from "react-dom";
import { btn, type ButtonVariant } from "./button";

/** Submit button for server-action forms. It stays clickable; it shows a spinner after 100 ms. */
export function SubmitButton({
  children,
  variant = "primary",
  className,
}: {
  children: React.ReactNode;
  variant?: ButtonVariant;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={btn(variant, className)} aria-busy={pending || undefined}>
      {children}
      {pending ? <span className="spinner" aria-hidden="true" /> : null}
    </button>
  );
}
