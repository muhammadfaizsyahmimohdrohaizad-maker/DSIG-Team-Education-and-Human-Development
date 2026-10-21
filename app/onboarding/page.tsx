import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PublicShell } from "../_components/public-shell";
import { ConsentForm } from "@/features/onboarding/consent-form";
import { currentAccount, homeFor } from "@/server/auth/account";

export const metadata: Metadata = { title: "Before you start" };

export default async function OnboardingPage() {
  const account = await currentAccount();
  if (account.kind !== "student") redirect(homeFor(account));

  return (
    <PublicShell>
      <div className="centered stack-lg">
        <div className="page-head">
          <h1>Before you start</h1>
          <p>
            CareerPrep shows how your diploma modules connect to MASCO 2020 occupations, then helps you practise for them. Here
            is what it does with your data, in plain words. Nothing is ticked for you.
          </p>
        </div>
        <ConsentForm initial={account.consent} />
      </div>
    </PublicShell>
  );
}
