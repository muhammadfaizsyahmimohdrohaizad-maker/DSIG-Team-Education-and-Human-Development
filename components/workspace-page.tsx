import Link from "next/link";
import type { ReactNode } from "react";

export function WorkspacePage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main id="main" className="mx-auto flex w-full max-w-[960px] flex-col gap-5 px-4 pt-6 pb-24 tablet:px-6">
      <h1 className="m-0 text-3xl">{title}</h1>
      {children}
    </main>
  );
}

export function Panel({ children }: { children: ReactNode }) {
  return (
    <section className="flex flex-col items-start gap-3 rounded-card border border-hairline bg-white p-5">
      {children}
    </section>
  );
}

export function RouteLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link className="inline-flex min-h-11 items-center font-semibold" href={href}>
      {children}
    </Link>
  );
}
