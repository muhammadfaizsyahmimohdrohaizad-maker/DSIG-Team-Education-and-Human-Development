import type { Metadata } from "next";
import { PublicHeader } from "@/components/public-header";
import { ButtonLink, SoftPanel } from "@/components/ui";

export const metadata: Metadata = { title: "Privacy Notice" };

// Privacy Notice (Privacy board). Version 1.0, a draft for legal review before any pilot.
type Section = { id: string; title: string; body: React.ReactNode };

const list = "m-0 flex flex-col gap-1.5 pl-5";

const sections: Section[] = [
  {
    id: "who-we-are",
    title: "Who we are",
    body: (
      <>
        <p className="m-0">
          CareerPrep is run by the CareerPrep team (&quot;we&quot;), a group of students at the German-Malaysian Institute (GMI), Jalan Ilmiah, Taman Universiti, 43000 Kajang, Selangor.
          We are a student project, not a registered company. If CareerPrep is piloted with an institution, the institution may also be responsible for your data; the pilot agreement will say who does what.
        </p>
        <p className="m-0 [overflow-wrap:anywhere]">
          Data protection officer (DPO): Muhammad Faiz Syahmi, team lead, <a href="mailto:muhammadfaizsyahmi.mohdrohaizad@student.gmi.edu.my">muhammadfaizsyahmi.mohdrohaizad@student.gmi.edu.my</a>.
        </p>
      </>
    ),
  },
  {
    id: "what-we-collect",
    title: "What we collect",
    body: (
      <ul className={list}>
        <li>Account details: your name, email address and semester.</li>
        <li>What you enter: the modules you tick, your target occupation, your skills and projects, your practice and mastery-check results, and the text of your interview answers.</li>
        <li>What we work out from it: skill matches, gap skills, review dates and AI-written feedback.</li>
        <li>Bookings: the time you pick, your optional note, and status changes.</li>
        <li>Your consent choices, with the date and the version of this notice.</li>
        <li>We never store audio. If you use dictation in Chrome, your browser sends the sound to its maker to turn it into text; we only receive the text.</li>
      </ul>
    ),
  },
  {
    id: "why-we-use-it",
    title: "Why we use it",
    body: (
      <ul className={list}>
        <li>To show which occupations your modules point to and which skills you are missing.</li>
        <li>To schedule your practice and mark your mastery checks.</li>
        <li>To write hints and interview feedback, only if you allow AI processing.</li>
        <li>To let your career adviser prepare for a session, only if you allow adviser visibility or send a booking.</li>
        <li>To email you about booking changes, only if you allow booking emails. Those emails carry the status, the time and a link, nothing else.</li>
        <li>To give your institution anonymous totals. Groups smaller than 5 students are never shown.</li>
      </ul>
    ),
  },
  {
    id: "where-it-goes",
    title: "Where it goes",
    body: (
      <p className="m-0">
        Our service providers process data for us under contract. Some of them are outside Malaysia. The list is on the page &quot;Who processes your data&quot;.
        We do not send student data to any AI service tier that trains on it, and we do not sell data.
      </p>
    ),
  },
  {
    id: "how-long-we-keep-it",
    title: "How long we keep it",
    body: (
      <p className="m-0">
        We keep your data while your account is open. If you do not sign in for 12 months, we delete your account. When you delete your account, we delete your data straight away,
        including your consent records. Any backups held by our database host are overwritten within 7 days.
      </p>
    ),
  },
  {
    id: "your-rights",
    title: "Your rights",
    body: (
      <ul className={list}>
        <li>Access: see everything we hold. Settings and privacy → Download my data gives you a full copy.</li>
        <li>Correction: change your name, modules, skills, projects and target job at any time in the app, or ask us.</li>
        <li>Deletion: Settings and privacy → Delete my account and data removes your account and every record linked to it.</li>
        <li>Portability: the export is a machine-readable JSON file you can take elsewhere.</li>
        <li>Withdrawing consent: change your choices in Settings at any time. Withdrawing does not affect what was done before.</li>
        <li>Complaints: contact our DPO first. You can also complain to the Personal Data Protection Commissioner of Malaysia.</li>
      </ul>
    ),
  },
  {
    id: "if-something-goes-wrong",
    title: "If something goes wrong",
    body: (
      <p className="m-0">
        If a personal data breach happens, we will notify the Personal Data Protection Commissioner within 72 hours of becoming aware of it, and notify affected people within 7 days
        after that where significant harm is likely.
      </p>
    ),
  },
  {
    id: "children",
    title: "Children",
    body: (
      <p className="m-0">
        If you are under 18, a parent or guardian must agree to your consent choices before you use CareerPrep. AI feedback stays off for students under 18, whatever the choices say.
      </p>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <>
      <PublicHeader variant="account" />
      <main id="main" className="mx-auto flex w-full max-w-[1280px] flex-1 flex-col gap-6 px-4 pb-16 pt-5 tablet:px-6 tablet:pt-8">
        <div className="flex flex-wrap items-start gap-8">
          <article className="flex min-w-0 max-w-[46rem] flex-[999_1_560px] flex-col gap-5">
            <div className="flex flex-col gap-2">
              <h1 className="m-0 text-[clamp(1.75rem,3vw,2.25rem)] leading-[1.15] tracking-[-0.02em]">Privacy Notice</h1>
              <p className="m-0 text-lg">What CareerPrep collects, why, how long it keeps it, and your rights under Malaysia&apos;s Personal Data Protection Act 2010 (as amended in 2024).</p>
              <p className="m-0 text-sm text-muted">Version 1.0 · In force from 21 October 2026 · Draft for legal review before any pilot</p>
            </div>
            {sections.map((s) => (
              <section key={s.id} id={s.id} aria-labelledby={`${s.id}-h`} className="flex scroll-mt-6 flex-col gap-2.5 border-t border-hairline pt-5">
                <h2 id={`${s.id}-h`} className="m-0 text-xl leading-tight">{s.title}</h2>
                {s.body}
              </section>
            ))}
          </article>
          <SoftPanel as="nav" aria-labelledby="toc-h" className="min-w-0 flex-[1_1_240px] desktop:sticky desktop:top-6">
            <h2 id="toc-h" className="m-0 text-[17px] leading-tight">On this page</h2>
            <ol className="m-0 flex flex-col gap-0.5 pl-5">
              {sections.map((s) => (
                <li key={s.id}><a href={`#${s.id}`} className="inline-flex min-h-11 items-center">{s.title}</a></li>
              ))}
            </ol>
            <ButtonLink href="/settings" variant="outline">Change my choices</ButtonLink>
          </SoftPanel>
        </div>
      </main>
    </>
  );
}
