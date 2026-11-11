import Link from "next/link";
import { NavLinks } from "./nav-links";
import { HeaderMenus, type HeaderAccount, type HeaderNotification } from "./header-menus";

// Shared header for student and adviser pages (mockup round 3 header): wordmark, main menu, notifications bell
// and the name chip with the account menu. Below 640px the main menu moves to a fixed bottom bar.
// The EN/BM language switch from the mockup is left out until the app has Bahasa Melayu strings.
export type NavItem = { href: string; label: string };
export type { HeaderAccount, HeaderNotification };

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

export function AppHeader({ nav, home, account, notifications }: { nav: NavItem[]; home: string; account: HeaderAccount; notifications: HeaderNotification[] }) {
  return (
    <header className="relative border-b border-hairline bg-white">
      <div className="mx-auto flex max-w-[1280px] flex-nowrap items-center justify-between gap-3 px-4 py-3 tablet:flex-wrap tablet:px-6">
        <Link href={home} className="inline-flex min-h-11 items-center font-display text-xl font-bold tracking-[-0.02em] text-navy no-underline hover:text-navy">
          CareerPrep
        </Link>
        <nav
          aria-label="Main"
          data-bottom-nav
          className="fixed inset-x-0 bottom-0 z-40 flex gap-1 border-t border-hairline bg-white px-2 py-1.5 tablet:static tablet:rounded-full tablet:border-0 tablet:bg-cream tablet:p-1"
        >
          <NavLinks nav={nav} />
        </nav>
        <HeaderMenus account={account} notifications={notifications} />
      </div>
    </header>
  );
}
