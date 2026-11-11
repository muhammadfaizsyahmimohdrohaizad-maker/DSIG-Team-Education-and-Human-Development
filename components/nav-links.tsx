"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavItem } from "./app-header";

export function NavLinks({ nav }: { nav: NavItem[] }) {
  const path = usePathname();
  return (
    <>
      {nav.map((item) => {
        const active = path === item.href || path.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`inline-flex min-h-11 flex-1 items-center justify-center rounded-button px-1 text-[13px] font-semibold no-underline tablet:flex-none tablet:rounded-full tablet:px-[18px] tablet:text-[15px] ${active ? "bg-navy text-white hover:text-white" : "text-navy hover:text-navy hover:underline"}`}
          >
            {item.label}
          </Link>
        );
      })}
    </>
  );
}
