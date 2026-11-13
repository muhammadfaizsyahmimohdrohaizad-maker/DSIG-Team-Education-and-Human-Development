import type { Metadata } from "next";
import { PublicHeader } from "@/components/public-header";
import { Card, Kicker } from "@/components/ui";
import { UndertakingForm } from "@/features/adviser/undertaking-form";

export const metadata: Metadata = { title: "Staff undertaking" };

const POINTS = [
  "I will open a student's data only to prepare for, or follow up on, a session they booked with me.",
  "I will see only what the student chose to share, and I will not ask for more than the session needs.",
  "I will not copy, download or pass student data to anyone outside the career services team.",
  "I will not use CareerPrep data for grading, discipline or any decision about a student's studies.",
  "If I see data by mistake, or think data has leaked, I will tell the data protection officer within 24 hours.",
  "I understand that CareerPrep logs each time I open a student's record.",
];

// Staff undertaking board. Shown before an adviser sees any student data, and again when the version changes.
export default function StaffUndertakingPage() {
  return (
    <>
      <PublicHeader variant="plain" />
      <main id="main" className="mx-auto flex w-full max-w-[860px] flex-1 flex-col gap-6 px-4 pb-16 pt-5 tablet:px-6 tablet:pt-8">
        <Card as="section" aria-labelledby="und-h" pad="p-5 tablet:p-8" gap="gap-4">
          <Kicker>Before you see student data</Kicker>
          <h1 id="und-h" className="m-0 text-[clamp(1.75rem,3vw,2.25rem)] leading-[1.15] tracking-[-0.02em]">Staff confidentiality undertaking</h1>
          <p className="m-0">You accept it once. If it changes, we ask you again.</p>
          <ol className="m-0 flex list-none flex-col p-0">
            {POINTS.map((t, i) => (
              <li key={t} className={`flex gap-3 py-3 ${i > 0 ? "border-t border-hairline" : ""}`}>
                <span aria-hidden="true" className="inline-flex size-7 shrink-0 items-center justify-center rounded-control bg-navy text-sm font-bold text-white">{i + 1}</span>
                <span>{t}</span>
              </li>
            ))}
          </ol>
          <UndertakingForm />
          <p className="m-0 text-sm text-muted">Questions about this undertaking go to the data protection officer, listed in the <a href="/careerprep/privacy">Privacy Notice</a>.</p>
        </Card>
      </main>
    </>
  );
}
