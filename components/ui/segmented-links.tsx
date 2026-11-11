// Two or more sibling pages shown as a segmented control (Log in / Sign up). They are links with aria-current,
// not ARIA tabs, because each one is its own route. Server-component friendly.
import Link from "next/link";
import { cn } from "./cn";

export function SegmentedLinks({ label, items, current }: { label: string; items: Array<{ href: string; label: string }>; current: string }) {
  return (
    <nav aria-label={label} className="grid auto-cols-fr grid-flow-col gap-1 rounded-button bg-cream p-1">
      {items.map((item) => {
        const active = item.href === current;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn("inline-flex min-h-11 items-center justify-center rounded-control font-semibold no-underline", active ? "bg-navy text-white hover:text-white" : "text-navy hover:bg-white hover:text-navy")}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
