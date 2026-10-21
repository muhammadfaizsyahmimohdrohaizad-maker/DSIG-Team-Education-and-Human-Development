import type { Metadata } from "next";
import { requireStaff } from "@/server/auth/account";
import { SiteFooter } from "../_components/site-footer";

export const metadata: Metadata = { title: { default: "CareerPrep for institutions", template: "%s · CareerPrep for institutions" } };

export default async function InstitutionLayout({ children }: { children: React.ReactNode }) {
  const staff = await requireStaff("institution");
  return (
    <>
      <header className="site-header">
        <div className="header-inner">
          <span className="brand">
            CareerPrep <small>for institutions</small>
          </span>
          <div className="header-actions">
            <span className="secondary muted">
              {staff.name}
              {staff.unit ? ` · ${staff.unit}` : ""}
            </span>
          </div>
        </div>
      </header>
      <main id="main" tabIndex={-1}>
        {children}
      </main>
      <SiteFooter signedIn />
    </>
  );
}
