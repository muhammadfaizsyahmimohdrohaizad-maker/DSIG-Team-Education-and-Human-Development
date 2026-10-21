import type { Metadata } from "next";
import { LiveRegionProvider } from "@/components/ui/live-region";
import { requireStaff } from "@/server/auth/account";
import { SiteFooter } from "../_components/site-footer";

export const metadata: Metadata = { title: { default: "CareerPrep for advisers", template: "%s · CareerPrep for advisers" } };

export default async function AdviserLayout({ children }: { children: React.ReactNode }) {
  const adviser = await requireStaff("adviser");
  return (
    <LiveRegionProvider>
      <header className="site-header">
        <div className="header-inner">
          <span className="brand">
            CareerPrep <small>for advisers</small>
          </span>
          <div className="header-actions">
            <span className="secondary muted">
              {adviser.name}
              {adviser.unit ? ` · ${adviser.unit}` : ""}
            </span>
          </div>
        </div>
      </header>
      <main id="main" tabIndex={-1}>
        {children}
      </main>
      <SiteFooter signedIn />
    </LiveRegionProvider>
  );
}
