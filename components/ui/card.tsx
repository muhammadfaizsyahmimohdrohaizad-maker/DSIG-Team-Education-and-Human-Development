import type { HTMLAttributes } from "react";

export function Card({ className = "", flush, ...rest }: HTMLAttributes<HTMLElement> & { flush?: boolean }) {
  return <section className={`card${flush ? " card-flush" : ""} ${className}`.trim()} {...rest} />;
}
