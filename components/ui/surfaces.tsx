// Surfaces from the UI kit. Card: white, hairline border, 16px corners, 24px padding, for a unit of work.
// SoftPanel: cream, no border, for side panels, help and summaries. HeroBand: navy, one per screen, with the
// on-navy focus halo so focus rings stay visible on the dark ground. Server-component friendly.
// There is no tailwind-merge: change padding, gap and direction with the props, and use `className` only for
// classes that don't clash (flex sizing, alignment, borders).
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "./cn";

type SurfaceTag = "div" | "section" | "article" | "aside" | "li" | "nav";
type SurfaceProps = HTMLAttributes<HTMLElement> & {
  as?: SurfaceTag;
  /** Padding classes. Default p-6 (24px). */
  pad?: string;
  /** Gap classes. Default gap-3.5. */
  gap?: string;
  children: ReactNode;
};

export function Card({ as: Tag = "div", pad = "p-6", gap = "gap-3.5", className, children, ...rest }: SurfaceProps) {
  return <Tag className={cn("flex flex-col rounded-card border border-hairline bg-white", pad, gap, className)} {...rest}>{children}</Tag>;
}

export function SoftPanel({ as: Tag = "div", pad = "p-6", gap = "gap-3.5", className, children, ...rest }: SurfaceProps) {
  return <Tag className={cn("flex flex-col rounded-card bg-cream", pad, gap, className)} {...rest}>{children}</Tag>;
}

export function HeroBand({
  as: Tag = "section",
  large = false,
  row = false,
  pad,
  gap = "gap-2",
  className,
  children,
  ...rest
}: SurfaceProps & { /** 24px corners for marketing heroes; 16px otherwise. */ large?: boolean; /** Lay children out in a wrapping row. */ row?: boolean }) {
  const padding = pad ?? (large ? "px-5 py-6 tablet:p-12 desktop:p-14" : "px-5 py-6 tablet:px-9 tablet:py-8");
  return (
    <Tag
      className={cn(
        "on-navy flex bg-navy text-white [&_h1]:text-white [&_h2]:text-white [&_h3]:text-white",
        row ? "flex-row flex-wrap items-center" : "flex-col",
        large ? "rounded-hero" : "rounded-card",
        padding,
        gap,
        className,
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}

/** Small capitals line above a heading: Inter 600, 13px, 0.08em tracking. */
export function Kicker({ children, className, onNavy = false, size = "text-[13px]" }: { children: ReactNode; className?: string; onNavy?: boolean; size?: string }) {
  return <p className={cn("m-0 font-semibold uppercase tracking-[0.08em]", size, onNavy ? "text-cream" : "text-maroon", className)}>{children}</p>;
}
