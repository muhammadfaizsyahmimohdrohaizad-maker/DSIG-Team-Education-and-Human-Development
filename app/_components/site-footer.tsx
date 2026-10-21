import Link from "next/link";
import { LEGAL_PAGES } from "@/content/legal/pages";
import { signOut } from "@/features/auth/actions";
import { REAL } from "@/server/env";
import { LangToggle } from "./lang-toggle";

/** Same footer everywhere: legal pages, language, and (for students) settings. */
export function SiteFooter({ student = false, signedIn = student }: { student?: boolean; signedIn?: boolean }) {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="row-between" style={{ alignItems: "flex-start" }}>
          <nav aria-label="Legal and help" className="footer-links">
            {student ? <Link href="/settings">Settings and my data</Link> : null}
            {signedIn && REAL ? (
              <form action={signOut}>
                <button type="submit" className="link-btn" style={{ color: "var(--ink-muted)", padding: 0 }}>
                  Sign out
                </button>
              </form>
            ) : null}
            {LEGAL_PAGES.map((p) => (
              <Link key={p.slug} href={`/legal/${p.slug}`}>
                {p.short}
              </Link>
            ))}
          </nav>
          <LangToggle />
        </div>
        <p>
          CareerPrep is built by GMI students. It gives guidance only, not career, legal or employment advice. No audio is ever
          stored.
        </p>
      </div>
    </footer>
  );
}
