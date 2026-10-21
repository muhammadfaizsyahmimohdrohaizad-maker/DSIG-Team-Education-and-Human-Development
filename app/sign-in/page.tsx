import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PublicShell } from "../_components/public-shell";
import { SignInForm } from "@/features/auth/auth-forms";
import { currentAccount, homeFor } from "@/server/auth/account";
import { REAL } from "@/server/env";

export const metadata: Metadata = { title: "Sign in" };

type Props = { searchParams: Promise<{ next?: string }> };

export default async function SignInPage({ searchParams }: Props) {
  if (!REAL) redirect("/");
  const account = await currentAccount();
  if (account.kind !== "signed-out") redirect(homeFor(account));
  const { next } = await searchParams;
  return (
    <PublicShell>
      <div className="auth stack-lg">
        <div className="page-head">
          <h1>Sign in</h1>
          <p>See how your diploma modules connect to real jobs, then practise for them.</p>
        </div>
        <SignInForm next={next} />
      </div>
    </PublicShell>
  );
}
