import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PublicShell } from "../../_components/public-shell";
import { LegalBody } from "../../_components/legal-body";
import { legalPage } from "@/content/legal/pages";
import { UndertakingForm } from "@/features/staff/undertaking-form";
import { currentAccount, homeFor } from "@/server/auth/account";

export const metadata: Metadata = { title: "Staff confidentiality undertaking" };

export default async function UndertakingPage() {
  const account = await currentAccount();
  if (account.kind !== "staff" || account.staff.undertakingAccepted) redirect(homeFor(account));
  const page = legalPage("staff-undertaking")!;
  return (
    <PublicShell>
      <div className="centered stack-lg">
        <div className="page-head">
          <p>
            <span className="draft-flag">Draft for legal review</span>
          </p>
          <h1>{page.title}</h1>
          <p>
            {account.staff.name}, you can see student data only after you accept this. Your acceptance is recorded with today&apos;s
            date.
          </p>
        </div>
        <LegalBody blocks={page.blocks} />
        <UndertakingForm />
      </div>
    </PublicShell>
  );
}
