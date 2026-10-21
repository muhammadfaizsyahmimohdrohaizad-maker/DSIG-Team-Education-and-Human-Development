import Link from "next/link";
import { SiteFooter } from "./site-footer";

/** Header and footer for pages you can open without the app shell: sign-in, consent, legal. */
export function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="site-header">
        <div className="header-inner">
          <Link href="/" className="brand">
            CareerPrep
          </Link>
        </div>
      </header>
      <main id="main" tabIndex={-1}>
        {children}
      </main>
      <SiteFooter />
    </>
  );
}
