import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/auth-card";
import { PublicHeader } from "@/components/public-header";
import { logIn, requestPasswordReset } from "@/features/auth/actions";
import { LogInForm } from "./log-in-form";

export const metadata: Metadata = { title: "Log in" };

/** Only same-site paths are allowed as the place to go after logging in. */
function safeNext(next: string | string[] | undefined): string {
  return typeof next === "string" && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
}

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ next?: string | string[] }> }) {
  const { next } = await searchParams;
  return (
    <>
      <PublicHeader variant="back" />
      <AuthCard
        current="/sign-in"
        title="Welcome back"
        intro="Log in to see your job matches and your plan."
        footer={<>New to CareerPrep? <Link href="/sign-up" className="inline-flex min-h-11 items-center px-1 font-semibold">Sign up</Link></>}
      >
        <LogInForm logIn={logIn} requestPasswordReset={requestPasswordReset} next={safeNext(next)} />
      </AuthCard>
    </>
  );
}
