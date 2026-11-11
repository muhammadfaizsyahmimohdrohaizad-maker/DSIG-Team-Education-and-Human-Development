import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink, ErrorState } from "@/components/ui";
import { getInterviewSetup } from "@/features/interview/actions";
import { MockInterview } from "@/features/interview/mock-interview";

export const metadata: Metadata = { title: "Mock interview" };

// Mock interview board (MockInterview.dc.html, Phone-MockInterview.dc.html).
export default async function InterviewPage() {
  const setup = await getInterviewSetup();
  return (
    <main id="main" className="mx-auto flex w-full max-w-[1280px] flex-1 flex-col gap-6 px-4 pb-16 pt-5 tablet:px-6 tablet:pt-8">
      <Link href="/plan" className="inline-flex min-h-11 items-center self-start font-semibold">Back to my plan</Link>
      {setup.ok ? (
        <MockInterview setup={setup.value} />
      ) : (
        <ErrorState
          title={setup.error.code === "CONFLICT" ? "Pick a target job first" : "The mock interview didn't load"}
          actions={setup.error.code === "CONFLICT" ? <ButtonLink href="/map">Go to my Map</ButtonLink> : <ButtonLink href="/plan/interview">Try again</ButtonLink>}
        >
          {setup.error.message}
        </ErrorState>
      )}
    </main>
  );
}
