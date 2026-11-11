import Link from "next/link";

// One footer for every page, with the same three links (mockup round 3).
// On phones it leaves room for the bottom menu bar (see .site-footer in globals.css).
export function SiteFooter() {
  return (
    <footer className="site-footer border-t border-hairline bg-cream">
      <div className="mx-auto flex max-w-[1328px] flex-wrap items-center justify-between gap-x-2 px-4 py-3 tablet:py-4 text-sm text-ink tablet:px-6">
        <p className="m-0">CareerPrep · Built at the German-Malaysian Institute</p>
        <nav aria-label="Footer">
          <ul className="m-0 flex list-none flex-wrap items-center gap-x-1 p-0">
            <li><Link href="/settings" className="inline-flex min-h-11 items-center">Settings and privacy</Link><span aria-hidden="true"> ·</span></li>
            <li><Link href="/terms" className="inline-flex min-h-11 items-center">Terms &amp; Conditions</Link><span aria-hidden="true"> ·</span></li>
            <li><Link href="/privacy" className="inline-flex min-h-11 items-center">Privacy Notice</Link></li>
          </ul>
        </nav>
      </div>
    </footer>
  );
}
