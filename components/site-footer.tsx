import Link from "next/link";

// Footer from the design boards. "public" (homepage, sign-in, privacy, parent consent): who built it, with the
// Privacy Notice. "app" (signed-in pages): Settings and privacy first. Terms & Conditions comes back to both once
// its text is published (/terms is a notice until then). On phones the app footer leaves room for the bottom
// menu bar (see .site-footer in globals.css).
export function SiteFooter({ variant }: { variant: "public" | "app" }) {
  const links = variant === "app"
    ? [{ href: "/settings", label: "Settings and privacy" }, { href: "/privacy", label: "Privacy Notice" }]
    : [{ href: "/privacy", label: "Privacy Notice" }];
  return (
    <footer className="site-footer border-t border-hairline bg-cream">
      <div className="mx-auto flex max-w-[1328px] flex-wrap items-center justify-between gap-x-2 px-4 py-3 text-sm text-ink tablet:px-6 tablet:py-4">
        <p className="m-0">CareerPrep · Built {variant === "public" ? "by students " : ""}at the German-Malaysian Institute</p>
        <nav aria-label="Footer">
          <ul className="m-0 flex list-none flex-wrap items-center gap-x-1 p-0">
            {links.map((l, i) => (
              <li key={l.href}>
                <Link href={l.href} className="inline-flex min-h-11 items-center">{l.label}</Link>
                {i < links.length - 1 ? <span aria-hidden="true"> ·</span> : null}
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}
