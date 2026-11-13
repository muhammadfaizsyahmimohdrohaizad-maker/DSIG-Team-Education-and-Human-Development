import type { Metadata } from "next";
import { PublicHeader } from "@/components/public-header";
import { Kicker, SoftPanel } from "@/components/ui";
import { checkParentLink, recordParentDecision } from "@/features/onboarding/actions";
import { ParentDecisionForm } from "./parent-decision-form";

export const metadata: Metadata = { title: "Parent or guardian approval", robots: { index: false } };

const pageTitle = "m-0 text-[clamp(1.75rem,3vw,2.25rem)] leading-[1.15] tracking-[-0.02em]";

export default async function ParentConsentPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const result = await checkParentLink({ token });
  const link = result.ok ? result.value : null;

  if (!link || link.state !== "open") {
    const heading = link?.state === "used" ? "This link has already been used" : link?.state === "expired" ? "This link no longer works" : "We couldn't find this request";
    return (
      <>
        <PublicHeader variant="plain" />
        <main id="main" className="mx-auto flex w-full max-w-[1280px] flex-1 flex-col gap-4 px-4 pb-16 pt-5 tablet:px-6 tablet:pt-8">
          <Kicker>Parent or guardian consent</Kicker>
          <h1 className={pageTitle}>{heading}</h1>
          <p className="m-0 max-w-[46rem]">
            Links in our emails work once and for 7 days. If the student still wants to use CareerPrep, they can sign up again and name you, and we will send a new email.
            Nothing was shared while the account was waiting.
          </p>
        </main>
      </>
    );
  }

  const fullName = link.studentName;
  const name = fullName.trim().split(/\s+/)[0] || fullName;
  const expiresOn = new Date(link.expiresAt).toLocaleDateString("en-MY", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kuala_Lumpur" });
  return (
    <>
      <PublicHeader variant="plain" />
      <main id="main" className="mx-auto flex w-full max-w-[1280px] flex-1 flex-col gap-6 px-4 pb-16 pt-5 tablet:px-6 tablet:pt-8">
        <div className="flex flex-col gap-1.5">
          <Kicker>Parent or guardian consent</Kicker>
          <h1 className={pageTitle}>{fullName} wants to use CareerPrep</h1>
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
                  <li>{name}&apos;s résumé details and mock interview answers</li>
                </ul>
              </SoftPanel>
              <SoftPanel pad="p-4" gap="gap-1.5" className="rounded-button">
                <h3 className="m-0 font-sans text-base">What {name} chose</h3>
                <ul className="m-0 pl-[18px] text-[15px]">
                  <li>Let a GMI career adviser see progress before a session: <b>{link.adviserVisibility ? "yes" : "no"}</b></li>
                  <li>AI feedback: <b>off</b>, because {name} is under 18</li>
                </ul>
                <span className="text-sm text-muted">{name} can change the adviser choice at any time.</span>
              </SoftPanel>
            </div>
            <p className="m-0 text-[15px]">
              We delete {name}&apos;s data 12 months after the last log-in, or straight away if {name} or you ask. Read the <a href="/careerprep/privacy">Privacy Notice</a>.
            </p>
            <ParentDecisionForm token={token} studentFullName={fullName} studentFirstName={name} recordParentDecision={recordParentDecision} />
          </section>

          <SoftPanel as="aside" aria-labelledby="about-h" className="min-w-0 flex-[1_1_300px]">
            <h2 id="about-h" className="m-0 text-xl leading-tight">About CareerPrep</h2>
            <p className="m-0">
              CareerPrep matches a student&apos;s studies and skills to official Malaysian jobs and helps them practise for interviews. It is built by students at the German-Malaysian Institute.
            </p>
            <p className="m-0 text-sm text-muted">
              This link works once, until {expiresOn}. If you don&apos;t recognise {fullName}, close this page and the account will not open.
            </p>
          </SoftPanel>
        </div>
      </main>
    </>
  );
}
