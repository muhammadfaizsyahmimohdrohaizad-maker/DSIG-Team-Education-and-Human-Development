"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { btn } from "./button";

// The plan page is reached from Map and Practice, so it highlights Practice instead of having its own item.
const STAGES = [
  { label: "Map", href: "/map", match: ["/map", "/matches"] },
  { label: "Practice", href: "/practice", match: ["/practice", "/plan", "/interview"] },
  { label: "Feedback", href: "/feedback", match: ["/feedback"] },
];

/** The student header: brand, three stages, bookings, and the always-visible "Talk to a human". */
export function StageNav({ updates, feedbackHref }: { updates: number; feedbackHref: string }) {
  const pathname = usePathname() ?? "";
  const [open, setOpen] = useState(false);
  const is = (prefixes: string[]) => prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  return (
    <header className="site-header">
      <div className="header-inner">
        <Link href="/map" className="brand">
          CareerPrep
        </Link>
        <nav id="stage-nav" className="stage-nav" aria-label="Main" data-open={open}>
          {STAGES.map((s) => (
            <Link
              key={s.href}
              href={s.label === "Feedback" ? feedbackHref : s.href}
              aria-current={is(s.match) ? "page" : undefined}
              onClick={() => setOpen(false)}
            >
              {s.label}
            </Link>
          ))}
          <Link href="/bookings" aria-current={is(["/bookings"]) ? "page" : undefined} onClick={() => setOpen(false)}>
            Bookings
            {updates > 0 ? <span className="nav-update">, {updates} {updates === 1 ? "update" : "updates"}</span> : null}
          </Link>
        </nav>
        <div className="header-actions">
          <Link href="/bookings/new" className={btn("secondary")}>
            Talk to a human
          </Link>
          <button
            type="button"
            className="btn btn-secondary menu-btn"
            aria-expanded={open}
            aria-controls="stage-nav"
            onClick={() => setOpen((o) => !o)}
          >
            {open ? "Close menu" : "Menu"}
          </button>
        </div>
      </div>
    </header>
  );
}
