// Buttons from the UI kit (System Design 4.3).
// Primary: maroon fill, one per area. Outline: navy, the second choice. Danger: maroon outline for destructive
// actions (always confirm, naming what will be lost). Text: low-stakes links such as "See all".
// On-navy: outline for use inside a HeroBand.
// Buttons are never disabled: there is no `disabled` prop. Pressing one with something missing says what to fix.
// While `loading`, the button stays focusable, announces itself busy and shows `loadingText`; the caller ignores
// repeat presses (see useActionForm).
import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "./cn";
import { SpinnerIcon } from "./icons";

export type ButtonVariant = "primary" | "outline" | "danger" | "text" | "on-navy";
export type ButtonSize = "default" | "compact" | "large";

type StyleProps = { variant?: ButtonVariant; size?: ButtonSize; fullWidth?: boolean; className?: string };

export function buttonClasses({ variant = "primary", size = "default", fullWidth = false, className }: StyleProps = {}): string {
  const height = size === "large" ? "min-h-[52px] text-[17px]" : size === "compact" ? "min-h-11" : "min-h-12";
  const base = "inline-flex items-center justify-center gap-2 font-sans no-underline cursor-pointer text-center leading-tight";
  const byVariant: Record<ButtonVariant, string> = {
    primary: "rounded-button bg-maroon px-5 font-bold text-white hover:bg-maroon-dark hover:text-white",
    outline: "rounded-button border border-navy bg-white px-[18px] font-semibold text-navy hover:bg-cream hover:text-navy",
    danger: "rounded-button border border-maroon bg-white px-[18px] font-semibold text-maroon hover:bg-cream hover:text-maroon",
    text: "px-3 font-semibold text-navy underline underline-offset-2 hover:text-maroon",
    "on-navy": "rounded-field border border-cream/50 px-[14px] text-sm font-semibold text-white hover:bg-white/10 hover:text-white",
  };
  return cn(base, height, byVariant[variant], fullWidth && "w-full", className);
}

function Content({ loading, loadingText, children }: { loading?: boolean; loadingText?: string; children: ReactNode }) {
  if (!loading) return <>{children}</>;
  return (
    <>
      <SpinnerIcon />
      <span>{loadingText ?? children}</span>
    </>
  );
}

export type ButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "disabled"> &
  StyleProps & { loading?: boolean; loadingText?: string };

export function Button({ variant, size, fullWidth, className, loading = false, loadingText, type = "button", children, ...rest }: ButtonProps) {
  return (
    <button
      type={type}
      aria-busy={loading || undefined}
      data-loading={loading || undefined}
      className={buttonClasses({ variant, size, fullWidth, className })}
      {...rest}
    >
      <Content loading={loading} loadingText={loadingText}>{children}</Content>
    </button>
  );
}

export type ButtonLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & StyleProps & { href: string };

/** A link styled as a button, for actions that move to another page. */
export function ButtonLink({ variant, size, fullWidth, className, href, children, ...rest }: ButtonLinkProps) {
  return (
    <Link href={href} className={buttonClasses({ variant, size, fullWidth, className })} {...rest}>
      {children}
    </Link>
  );
}
