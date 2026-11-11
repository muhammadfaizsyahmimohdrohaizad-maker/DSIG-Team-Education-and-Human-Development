// Surfaces from the UI kit. Card: white, hairline border, 16px corners, 24px padding, for a unit of work.
// SoftPanel: cream, no border, for side panels, help and summaries. HeroBand: navy, one per screen, with the
// on-navy focus halo so focus rings stay visible on the dark ground. Server-component friendly.
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "./cn";

type SurfaceTag = "div" | "section" | "article" | "aside" | "li" | "nav";
type SurfaceProps = HTMLAttributes<HTMLElement> & { as?: SurfaceTag; children: ReactNode };

export function Card({ as: Tag = "div", className, children, ...rest }: SurfaceProps) {
  return <Tag className={cn("flex flex-col gap-3.5 rounded-card border border-hairline bg-white p-6", className)} {...rest}>{children}</Tag>;
}

export function SoftPanel({ as: Tag = "div", className, children, ...rest }: SurfaceProps) {
  return <Tag className={cn("flex flex-col gap-3.5 rounded-card bg-cream p-6", className)} {...rest}>{children}</Tag>;
}

export function HeroBand({ as: Tag = "section", large = false, className, children, ...rest }: SurfaceProps & { /** 24px corners for marketing heroes; 16px otherwise. */ large?: boolean }) {
  return (
    <Tag
      className={cn(
        "on-navy flex flex-col gap-2 bg-navy text-white [&_h1]:text-white [&_h2]:text-white [&_h3]:text-white [&_a]:text-white",
        large ? "rounded-hero px-5 py-6 tablet:p-12 desktop:p-14" : "rounded-card px-5 py-6 tablet:px-9 tablet:py-8",
        className,
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}

/** Small capitals line above a heading: Inter 600, 13px, 0.08em tracking. */
export function Kicker({ children, className, onNavy = false }: { children: ReactNode; className?: string; onNavy?: boolean }) {
  return <p className={cn("m-0 text-[13px] font-semibold uppercase tracking-[0.08em]", onNavy ? "text-cream" : "text-maroon", className)}>{children}</p>;
}
