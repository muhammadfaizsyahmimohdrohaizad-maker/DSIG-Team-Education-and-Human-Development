import type { Metadata } from "next";
import Link from "next/link";
import { PublicHeader } from "@/components/public-header";
import { SoftPanel } from "@/components/ui";

export const metadata: Metadata = { title: "Terms and conditions" };

// The Terms text isn't written yet. Until it is, this page says so instead of showing a placeholder.
// The footer link is hidden until then; the sign-up form still links here.
export default function TermsPage() {
  return (
    <>
      <PublicHeader variant="account" />
      <main id="main" className="mx-auto flex w-full max-w-[860px] flex-1 flex-col gap-5 px-4 pb-16 pt-5 tablet:px-6 tablet:pt-8">
        <h1 className="m-0 text-[clamp(1.75rem,3vw,2.25rem)] leading-[1.15] tracking-[-0.02em]">Terms and conditions</h1>
        <SoftPanel gap="gap-2">
          <p className="m-0 font-semibold text-navy">Our terms and conditions aren&apos;t published yet.</p>
          <p className="m-0">
            Read the <Link href="/privacy">Privacy Notice</Link> to see what CareerPrep keeps about you, who can see it, and how to download or delete it.
          </p>
        </SoftPanel>
      </main>
    </>
  );
}
