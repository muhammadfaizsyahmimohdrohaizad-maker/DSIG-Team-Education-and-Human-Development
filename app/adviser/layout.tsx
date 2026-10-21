import type { Metadata } from "next";
import { LiveRegionProvider } from "@/components/ui/live-region";
import { SubmitButton } from "@/components/ui/submit-button";
import { signOut } from "@/features/adviser/actions";
import { getStore } from "@/server/data";
import { DemoFooter } from "../_components/demo-footer";

export const metadata: Metadata = { title: { default: "CareerPrep for advisers", template: "%s · CareerPrep for advisers" } };

export default async function AdviserLayout({ children }: { children: React.ReactNode }) {
  const adviser = await getStore().getAdviser();
  return (
    <LiveRegionProvider>
      <header className="site-header">
        <div className="header-inner">
          <span className="brand">
            CareerPrep <small>for advisers</small>
          </span>
          <div className="header-actions">
            <span className="secondary muted">
              {adviser.name} · {adviser.unit}
            </span>
            <form action={signOut}>
              <SubmitButton variant="secondary">Sign out</SubmitButton>
            </form>
          </div>
        </div>
      </header>
      <main id="main" tabIndex={-1}>
        {children}
      </main>
      <DemoFooter role="adviser" />
    </LiveRegionProvider>
  );
}
