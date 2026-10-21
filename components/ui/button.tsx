import type { ButtonHTMLAttributes } from "react";

export type ButtonVariant = "primary" | "secondary" | "danger";

/** Class names for a link that looks like a button: <Link className={btn("primary")}>. */
export function btn(variant: ButtonVariant = "primary", extra = "") {
  return `btn btn-${variant}${extra ? ` ${extra}` : ""}`;
}

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; busy?: boolean };

/** Labels start with a verb. A submit button is never disabled; `busy` only adds a spinner. */
export function Button({ variant = "primary", busy, className, children, type = "button", ...rest }: Props) {
  return (
    <button type={type} className={btn(variant, className)} aria-busy={busy || undefined} {...rest}>
      {children}
      {busy ? <span className="spinner" aria-hidden="true" /> : null}
    </button>
  );
}
