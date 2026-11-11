import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/auth-card";
import { PublicHeader } from "@/components/public-header";
import { redirect } from "next/navigation";
import { ActionForm } from "@/components/action-form";
import { setNewPassword, logIn, requestPasswordReset } from "@/features/auth/actions";
import { LogInForm } from "./log-in-form";

export const metadata: Metadata = { title: "Log in" };

/** Only same-site paths are allowed as the place to go after logging in. */
function safeNext(next: string | string[] | undefined): string {
  return typeof next === "string" &&
    next.startsWith("/") &&
    !/[\\\x00-\x1f]/.test(next) &&
    !next.startsWith("//")
    ? next
    : "/dashboard";
}

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; next?: string | string[] }>;
}) {
  const { next, mode } = await searchParams;
  if (mode === "new-password") {
    async function reset(form: FormData) {
      "use server";
      const result = await setNewPassword({ password: form.get("password") });
      if (!result.ok) return result.error.fields?.password || result.error.message;
      redirect(result.value.redirectTo);
    }
    return (
      <>
        <PublicHeader variant="back" />
        <main id="main" className="mx-auto max-w-lg p-6">
          <h1>Choose a new password</h1>
          <ActionForm submit={reset} label="Save new password">
            <label>
              New password{" "}
              <input required type="password" name="password" autoComplete="new-password" minLength={8} />
            </label>
          </ActionForm>
        </main>
      </>
    );
  }
  return (
    <>
      <PublicHeader variant="back" />
      <AuthCard
        current="/sign-in"
        title="Welcome back"
        intro="Log in to see your job matches and today's lesson."
        footer={
          <>
            New to CareerPrep?{" "}
            <Link href="/sign-up" className="inline-flex min-h-11 items-center px-1 font-semibold">
              Sign up
            </Link>
          </>
        }
      >
        <LogInForm logIn={logIn} requestPasswordReset={requestPasswordReset} next={safeNext(next)} />
      </AuthCard>
    </>
  );
}
