import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/auth-card";
import { PublicHeader } from "@/components/public-header";
import { signUp } from "@/features/auth/actions";
import { SignUpForm } from "./sign-up-form";

export const metadata: Metadata = { title: "Create your account" };

export default function SignUpPage() {
  return (
    <>
      <PublicHeader variant="back" />
      <AuthCard
        current="/sign-up"
        title="Create your account"
        intro="Sign up to find out which jobs your studies point to."
        footer={<>Already have an account? <Link href="/sign-in" className="inline-flex min-h-11 items-center px-1 font-semibold">Log in</Link></>}
      >
        <SignUpForm signUp={signUp} />
      </AuthCard>
    </>
  );
}
