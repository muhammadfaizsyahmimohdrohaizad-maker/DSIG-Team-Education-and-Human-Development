import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PublicShell } from "../_components/public-shell";
import { SignUpForm } from "@/features/auth/auth-forms";
import { currentAccount, homeFor } from "@/server/auth/account";
import { REAL } from "@/server/env";

export const metadata: Metadata = { title: "Create an account" };

export default async function SignUpPage() {
  if (!REAL) redirect("/");
  const account = await currentAccount();
  if (account.kind !== "signed-out") redirect(homeFor(account));
  return (
    <PublicShell>
      <div className="auth stack-lg">
        <div className="page-head">
          <h1>Create an account</h1>
          <p>Free for students. It takes about a minute.</p>
        </div>
        <SignUpForm />
      </div>
    </PublicShell>
  );
}
