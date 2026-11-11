import type { Metadata } from "next";
import { PublicHeader } from "@/components/public-header";
import { Kicker, SoftPanel } from "@/components/ui";
import { recordParentDecision } from "@/features/onboarding/actions";
import { ParentDecisionForm } from "./parent-decision-form";
import { checkParentLink } from "@/features/onboarding/actions";

export const metadata: Metadata = { title: "Parent or guardian approval", robots: { index: false } };

const pageTitle = "m-0 text-[clamp(1.75rem,3vw,2.25rem)] leading-[1.15] tracking-[-0.02em]";

export default async function ParentConsentPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const result = await checkParentLink({token});

  if (!result.ok || result.value.state !== "open") {
    return (
      <>
        <PublicHeader variant="plain" />
        <main id="main" className="mx-auto flex w-full max-w-[1280px] flex-1 flex-col gap-4 px-4 pb-16 pt-5 tablet:px-6 tablet:pt-8">
          <Kicker>Parent or guardian consent</Kicker>
          <h1 className={pageTitle}>This link no longer works</h1>
          <p className="m-0 max-w-[46rem]">
            Links in our emails work once and for 7 days. If the student still wants to use CareerPrep, they can request a fresh approval link from their account, and we will send a new email.
            Nothing was shared while the account was waiting.
          </p>
        </main>
      </>
    );
  }

  const request = result.value;
  const name = request.studentName.split(" ")[0] || request.studentName;
  return (
    <>
      <PublicHeader variant="plain" />
      <main id="main" className="mx-auto flex w-full max-w-[1280px] flex-1 flex-col gap-6 px-4 pb-16 pt-5 tablet:px-6 tablet:pt-8">
        <div className="flex flex-col gap-1.5">
          <Kicker>Parent or guardian consent</Kicker>
          <h1 className={pageTitle}>{request.studentName} wants to use CareerPrep</h1>
          <p className="m-0 max-w-[46rem]">
            {name} signed up for CareerPrep and named you as parent or guardian. Because {name} is under 18, the account stays locked until you agree.
          </p>
        </div>

        <div className="flex flex-wrap items-start gap-6">
          <section aria-labelledby="decide-h" className="flex min-w-0 flex-[999_1_520px] flex-col gap-3.5 rounded-card border border-hairline p-5 tablet:p-6">
            <h2 id="decide-h" className="m-0 text-xl leading-tight">What you are agreeing to</h2>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(min(220px,100%),1fr))] gap-3">
              <SoftPanel pad="p-4" gap="gap-1.5" className="rounded-button">
                <h3 className="m-0 font-sans text-base">What we keep</h3>
                <ul className="m-0 pl-[18px] text-[15px]">
                  <li>{name}&apos;s name, email and programme</li>
                  <li>Skills, projects and modules {name} adds</li>
                  <li>Lesson notes, check scores and interview answers</li>
                </ul>
              </SoftPanel>
              <SoftPanel pad="p-4" gap="gap-1.5" className="rounded-button">
                <h3 className="m-0 font-sans text-base">What {name} chose</h3>
                <ul className="m-0 pl-[18px] text-[15px]">
                  <li>Let a GMI career adviser see progress before a session: <b>{request.adviserVisibility ? "yes" : "no"}</b></li>
                  <li>AI feedback: <b>off</b>, because {name} is under 18</li>
                </ul>
                <span className="text-sm text-muted">{name} can change the adviser choice at any time.</span>
              </SoftPanel>
            </div>
            <p className="m-0 text-[15px]">
              We delete {name}&apos;s data 12 months after the last log-in, or straight away if {name} or you ask. Read the <a href="/careerprep/privacy">Privacy Notice</a>.
            </p>
            <ParentDecisionForm token={token} studentFullName={request.studentName} studentFirstName={name} recordParentDecision={recordParentDecision} />
          </section>

          <SoftPanel as="aside" aria-labelledby="about-h" className="min-w-0 flex-[1_1_300px]">
            <h2 id="about-h" className="m-0 text-xl leading-tight">About CareerPrep</h2>
            <p className="m-0">
              CareerPrep matches a student&apos;s studies and skills to official Malaysian jobs and helps them practise for interviews. It is built by students at the German-Malaysian Institute.
            </p>
            <p className="m-0 text-sm text-muted">
              This link works once, until {new Date(request.expiresAt).toLocaleDateString("en-MY",{timeZone:"Asia/Kuala_Lumpur"})}. If you don&apos;t recognise {request.studentName}, close this page and the account will not open.
            </p>
          </SoftPanel>
        </div>
      </main>
    </>
  );
}
