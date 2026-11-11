"use client";
// The bell and the name chip in the app header. Each is a disclosure button with a panel below it: one panel open
// at a time; Escape closes it and returns focus to its button; a click outside closes it.
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { BellIcon, ChevronDownIcon } from "./ui/icons";

export type HeaderAccount = {
  firstName: string;
  initials: string;
  links: Array<{ href: string; label: string }>;
};

export type HeaderNotification = { id: string; text: string; when: string; href: string; unread: boolean };

type Open = "none" | "notes" | "account";

export function HeaderMenus({ account, notifications }: { account: HeaderAccount; notifications: HeaderNotification[] }) {
  const [open, setOpen] = useState<Open>("none");
  const [readAll, setReadAll] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const bell = useRef<HTMLButtonElement>(null);
  const chip = useRef<HTMLButtonElement>(null);

  const notes = notifications.map((n) => ({ ...n, unread: n.unread && !readAll }));
  const unread = notes.filter((n) => n.unread).length;

  useEffect(() => {
    if (open === "none") return;
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      const button = open === "notes" ? bell.current : chip.current;
      setOpen("none");
      button?.focus();
    }
    function onPointer(e: PointerEvent) {
      if (root.current && e.target instanceof Node && !root.current.contains(e.target)) setOpen("none");
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

  return (
    <div ref={root} className="relative flex items-center gap-2">
      <button
        ref={bell}
        type="button"
        aria-label={unread > 0 ? `Notifications, ${unread} new` : "Notifications"}
        aria-expanded={open === "notes"}
        aria-controls="header-notifications"
        onClick={() => setOpen(open === "notes" ? "none" : "notes")}
        className="relative inline-flex size-11 cursor-pointer items-center justify-center rounded-field text-navy hover:bg-cream"
      >
        <BellIcon size={22} />
        {unread > 0 ? (
          <span aria-hidden="true" className="absolute right-0.5 top-1 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-maroon px-1 text-[11px] font-bold text-white">
            {unread}
          </span>
        ) : null}
      </button>

      <button
        ref={chip}
        type="button"
        aria-label={`${account.firstName}, account menu`}
        aria-expanded={open === "account"}
        aria-controls="header-account"
        onClick={() => setOpen(open === "account" ? "none" : "account")}
        className="inline-flex min-h-11 cursor-pointer items-center gap-2.5 rounded-full border border-hairline bg-white py-1 pl-1 pr-2.5 text-[15px] font-semibold text-navy hover:bg-cream"
      >
        <span aria-hidden="true" className="inline-flex size-9 items-center justify-center rounded-full bg-navy text-sm font-bold text-white">{account.initials}</span>
        <span className="hidden tablet:inline">{account.firstName}</span>
        <ChevronDownIcon size={16} />
      </button>

      {open === "notes" ? (
        <section
          id="header-notifications"
          aria-label="Notifications"
          className="absolute right-0 top-[52px] z-50 flex w-[min(360px,calc(100vw-32px))] flex-col rounded-button border border-hairline bg-white shadow-[0_8px_24px_rgba(27,54,93,0.08)]"
        >
          <div className="flex items-center justify-between gap-2 border-b border-hairline py-2 pl-4 pr-2">
            <p className="m-0 font-bold text-navy">Notifications</p>
            {unread > 0 ? (
              <button type="button" onClick={() => setReadAll(true)} className="min-h-11 cursor-pointer px-2.5 text-sm font-semibold text-maroon underline">
                Mark all as read
              </button>
            ) : null}
          </div>
          {notes.length === 0 ? (
            <p className="m-0 px-4 py-3 text-[15px] text-muted">Nothing new. Booking updates and due reviews will show here.</p>
          ) : (
            <ul className="m-0 flex list-none flex-col p-1">
              {notes.map((n) => (
                <li key={n.id}>
                  <Link href={n.href} onClick={() => setOpen("none")} className="flex min-h-11 gap-2.5 rounded-control px-3 py-2.5 text-ink no-underline hover:bg-cream hover:text-ink">
                    <span aria-hidden="true" className={`mt-2 size-2 shrink-0 rounded-full border border-maroon ${n.unread ? "bg-maroon" : "bg-white"}`} />
                    <span className="flex flex-col leading-snug">
                      <span className={`text-[15px] text-navy ${n.unread ? "font-semibold" : ""}`}>{n.text}</span>
                      <span className="text-[13px] text-muted">{n.when}{n.unread ? " · New" : ""}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      {open === "account" ? (
        <nav
          id="header-account"
          aria-label="Account"
          className="absolute right-0 top-[52px] z-50 flex w-[220px] flex-col rounded-button border border-hairline bg-white p-1.5 shadow-[0_8px_24px_rgba(27,54,93,0.12)]"
        >
          {account.links.map((l) => (
            <Link key={l.href + l.label} href={l.href} onClick={() => setOpen("none")} className="flex min-h-11 items-center rounded-control px-3 text-navy no-underline hover:bg-cream hover:text-navy">
              {l.label}
            </Link>
          ))}
          {/* The route handler that signs out is owned by backend (app/auth/sign-out/route.ts, POST). */}
          <form action="/auth/sign-out" method="post" className="mt-1 border-t border-hairline pt-1">
            <button type="submit" className="flex min-h-11 w-full cursor-pointer items-center rounded-control px-3 text-left font-semibold text-maroon hover:bg-cream">
              Log out
            </button>
          </form>
        </nav>
      ) : null}
    </div>
  );
}
