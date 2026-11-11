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

// No tailwind-merge here, so `className` must only add classes that don't clash with these (self-start, mt-auto).
// Height, padding and text size come from `size` and `variant` so callers never need to override them.
export function buttonClasses({ variant = "primary", size = "default", fullWidth = false, className }: StyleProps = {}): string {
  const base = "inline-flex items-center justify-center gap-2 font-sans no-underline cursor-pointer text-center leading-tight";
  const height: Record<ButtonSize, string> = { large: "min-h-[52px] text-[17px]", default: "min-h-12", compact: "min-h-11" };
  const pad: Record<ButtonVariant, Record<ButtonSize, string>> = {
    primary: { large: "px-6", default: "px-5", compact: "px-4" },
    outline: { large: "px-[22px]", default: "px-[18px]", compact: "px-3.5" },
    danger: { large: "px-[22px]", default: "px-[18px]", compact: "px-3.5" },
    text: { large: "px-3", default: "px-3", compact: "px-2" },
    "on-navy": { large: "px-[22px]", default: "px-[18px]", compact: "px-3.5" },
  };
  const look: Record<ButtonVariant, string> = {
    primary: "rounded-button bg-maroon font-bold text-white hover:bg-maroon-dark hover:text-white",
    outline: "rounded-button border border-navy bg-white font-semibold text-navy hover:bg-cream hover:text-navy",
    danger: "rounded-button border border-maroon bg-white font-semibold text-maroon hover:bg-cream hover:text-maroon",
    text: "font-semibold text-navy underline underline-offset-2 hover:text-maroon",
    "on-navy": "rounded-button border border-cream/50 font-semibold text-white hover:bg-white/10 hover:text-white",
  };
  return cn(base, height[size], pad[variant][size], look[variant], fullWidth && "w-full", className);
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
