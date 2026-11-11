import Link from "next/link";
import { NavLinks } from "./nav-links";

// Shared header for student and adviser pages (UI kit; mockup round 3 header).
// Below 640 px the nav moves to a bottom bar.
export type NavItem = { href: string; label: string };

export const STUDENT_NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/map", label: "Map" },
  { href: "/plan", label: "Plan" },
  { href: "/book", label: "Book" },
];

export const ADVISER_NAV: NavItem[] = [
  { href: "/adviser/requests", label: "Requests" },
  { href: "/adviser/students", label: "Students" },
  { href: "/adviser/cohort", label: "Cohort" },
  { href: "/adviser/availability", label: "Availability" },
];

export function AppHeader({ nav, home, account }: { nav: NavItem[]; home: string; account: { initials: string; name: string; href: string } }) {
  return (
    <header className="border-b border-hairline bg-white">
      <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-3 px-4 py-3 tablet:px-6">
        <Link href={home} className="inline-flex min-h-11 items-center font-display text-xl font-bold text-navy no-underline">CareerPrep</Link>
        <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-40 flex gap-1 border-t border-hairline bg-white p-1.5 tablet:static tablet:rounded-full tablet:border-0 tablet:bg-cream tablet:p-1">
          <NavLinks nav={nav} />
        </nav>
        <Link href={account.href} aria-label={`${account.name}: settings and privacy`} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-hairline py-1 pl-1 pr-2.5 font-semibold text-navy no-underline">
          <span aria-hidden className="inline-flex size-9 items-center justify-center rounded-full bg-navy text-sm font-bold text-white">{account.initials}</span>
          <span className="hidden tablet:inline">{account.name}</span>
        </Link>
      </div>
    </header>
  );
}
