import type { Metadata } from "next";
import Link from "next/link";
import { ConsentForm } from "@/features/onboarding/consent-form";

export const metadata: Metadata = { title: "Before you start" };

export default function OnboardingPage() {
  return (
    <>
      <main id="main" tabIndex={-1}>
        <div className="centered stack-lg">
          <div className="page-head">
            <p className="brand" style={{ minHeight: 0 }}>CareerPrep</p>
            <h1>Before you start</h1>
            <p>
              CareerPrep shows how your diploma modules connect to real jobs, then helps you practise for them. Here is what
              it does with your data, in plain words.
            </p>
          </div>
          <ol className="points card">
            <li>We use the modules you tick and the answers you type. Nothing else.</li>
            <li>This demo uses a made-up student called Aina. You are not entering any of your own details.</li>
            <li>Voice is optional. We keep the text of what you say, never the audio.</li>
            <li>Your career adviser can see your target role, gap skills and a summary of your feedback. They cannot change any of it.</li>
            <li>You can delete everything at any time from the link at the bottom of every page.</li>
          </ol>
          <ConsentForm />
          <p className="secondary muted">
            Built by GMI students for the Education and Human Development track. Handled under Malaysia&apos;s Personal Data
            Protection Act 2010. <Link href="/delete-my-data">Delete my data</Link>
          </p>
        </div>
      </main>
    </>
  );
}
