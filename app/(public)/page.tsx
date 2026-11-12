import type { Metadata } from "next";
import { PublicHeader } from "@/components/public-header";
import { ButtonLink, CheckIcon, DotsIcon, HeroBand, Kicker, PlusIcon, SoftPanel, cn } from "@/components/ui";
import { homeSkillGapSample, type PreviewSkill } from "./home-sample-data";

export const metadata: Metadata = { title: { absolute: "CareerPrep: find the job your studies point to" } };

const sectionTitle = "m-0 text-[clamp(1.75rem,3.5vw,2.5rem)] leading-[1.15] tracking-[-0.02em]";

const steps = [
  { title: "Tell us about yourself", text: "Your interests, results or modules, skills and projects. About 5 minutes." },
  { title: "See your matches", text: "Official MASCO jobs that fit what you added, with the reasons shown on a career map." },
  { title: "Practise with your plan", text: "Short lessons for each missing skill, quick reviews, mock interviews and a CV." },
  { title: "Talk to a person", text: "Book a career adviser. They see only what you choose to share." },
];

const audiences = [
  { title: "For students", text: "See which official jobs fit you, what skills you're missing, and practise for that job before your next step." },
  { title: "For career advisers", text: "Start every conversation from what the student chose to share, not from zero." },
  { title: "For institutions", text: "See how each programme maps to national jobs and where a cohort falls short, with no names attached." },
];

const protections = [
  { title: "You choose what's shared", text: "Your adviser sees only what you tick for each booking." },
  { title: "AI only if you say yes", text: "Feedback uses Google Gemini only when you turn it on. Lessons and checks never need it. It stays off for students under 18." },
  { title: "No names in reports", text: "Your institution sees totals only, and never a group smaller than 5 students." },
  { title: "Delete it any time", text: "Download everything we hold, or delete your account in one step." },
];

const faqs: Array<{ q: string; a: React.ReactNode }> = [
  { q: "Is CareerPrep free?", a: "Yes, for students. Institutions that use it for their career services pay for it." },
  { q: "Who can see my data?", a: <>You, and your career adviser only for what you choose to share. Your institution sees totals with no names. Read the <a href="/careerprep/privacy">Privacy Notice</a> for the details.</> },
  { q: "Does it use AI?", a: "Matching uses official job and skill lists, not AI. AI writes feedback on your notes and interview answers only if you turn it on, and it is always labelled." },
  { q: "Is it only for GMI students?", a: "We are starting at GMI. It is built for anyone from SPM leavers to degree students." },
];

export default function HomePage() {
  return (
    <>
      <PublicHeader variant="account" />
      <main id="main" className="mx-auto flex w-full max-w-[1280px] flex-1 flex-col gap-12 px-4 pb-16 pt-5 tablet:gap-[72px] tablet:px-6 tablet:pt-8">
        <HeroBand large row gap="gap-10" aria-labelledby="hero-h">
          <div className="flex min-w-0 flex-[999_1_440px] flex-col gap-5">
            <Kicker onNavy size="text-sm">For SPM leavers to degree students</Kicker>
            <h1 id="hero-h" className="m-0 text-[clamp(2.25rem,5vw,3.75rem)] leading-[1.05] tracking-[-0.03em]">
              Find the job your studies point to, and get ready for it.
            </h1>
            <p className="m-0 max-w-xl text-[19px] leading-normal text-cream">
              CareerPrep matches what you know to Malaysia&apos;s official job list, shows the skills you&apos;re missing, and helps you practise until you&apos;re ready.
            </p>
            <div className="flex flex-wrap gap-3">
              <ButtonLink href="/sign-up" size="large">Get started</ButtonLink>
              <ButtonLink href="/demo" variant="on-navy" size="large">Try the demo</ButtonLink>
            </div>
            <p className="m-0 text-[15px] text-cream">Free for students · You choose what&apos;s shared</p>
          </div>
          <SkillGapPreview />
        </HeroBand>

        <p className="m-0 text-center text-[15px] text-muted">
          Built on official data: <b className="text-navy">MASCO 2020</b> (Ministry of Human Resources) · <b className="text-navy">ESCO</b> skills · <b className="text-navy">MQA register</b> of programmes
        </p>

        <section id="how" aria-labelledby="how-h" className="flex scroll-mt-6 flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <Kicker>How it works</Kicker>
            <h2 id="how-h" className={sectionTitle}>From what you know to a job you&apos;re ready for</h2>
          </div>
          <ol className="m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(min(230px,100%),1fr))] gap-4 p-0">
            {steps.map((s, i) => (
              <li key={s.title} className="flex flex-col gap-2 rounded-card border border-hairline p-5">
                <span aria-hidden="true" className="inline-flex size-8 items-center justify-center rounded-control bg-maroon font-bold text-white">{i + 1}</span>
                <h3 className="m-0 font-sans text-lg">{s.title}</h3>
                <p className="m-0">{s.text}</p>
              </li>
            ))}
          </ol>
        </section>

        <section id="about" aria-labelledby="about-h" className="flex flex-wrap gap-x-16 gap-y-6">
          <div className="flex-[1_1_260px]">
            <Kicker className="mb-2">Who we are</Kicker>
            <h2 id="about-h" className={sectionTitle}>About us</h2>
          </div>
          <div className="flex min-w-0 max-w-[46rem] flex-[999_1_520px] flex-col gap-4 text-lg">
            <p className="m-0">We are Software Engineering students at the German-Malaysian Institute (GMI), building CareerPrep for students like us.</p>
            <p className="m-0">
              Near the end of our diploma, we open a job board and see hundreds of titles, with no way to tell which ones our modules actually prepare us for.
              The information exists: Malaysia&apos;s official occupation list, MASCO 2020, the ESCO skills list, and our own course outlines. Nothing connects them. CareerPrep does.
            </p>
          </div>
        </section>

        <section id="goal" aria-labelledby="goal-h" className="flex flex-col gap-6">
          <div className="flex flex-wrap gap-x-16 gap-y-6">
            <div className="flex-[1_1_260px]">
              <Kicker className="mb-2">What we want</Kicker>
              <h2 id="goal-h" className={sectionTitle}>Our goal</h2>
            </div>
            <p className="m-0 min-w-0 max-w-[46rem] flex-[999_1_520px] text-lg">
              Give every student a clear answer to &quot;what job are my studies for, and am I ready?&quot;, with the evidence behind it and practice for the real interview.
            </p>
          </div>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(260px,100%),1fr))] gap-4">
            {audiences.map((a) => (
              <SoftPanel key={a.title} as="article" pad="p-7" gap="gap-2.5">
                <h3 className="m-0 text-xl">{a.title}</h3>
                <p className="m-0">{a.text}</p>
              </SoftPanel>
            ))}
          </div>
        </section>

        <HeroBand large gap="gap-5" pad="px-5 py-6 tablet:p-12" aria-labelledby="protect-h">
          <h2 id="protect-h" className={sectionTitle}>How we protect your data</h2>
          <ul className="m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(min(230px,100%),1fr))] gap-3 p-0">
            {protections.map((p) => (
              <li key={p.title} className="flex flex-col gap-1 rounded-card bg-white/10 p-[18px]">
                <b className="text-[17px]">{p.title}</b>
                <span className="text-cream">{p.text}</span>
              </li>
            ))}
          </ul>
          <a href="/careerprep/privacy" className="inline-flex min-h-11 items-center self-start font-semibold text-white hover:text-cream">Read the Privacy Notice</a>
        </HeroBand>

        <section aria-labelledby="faq-h" className="flex max-w-[860px] flex-col">
          <h2 id="faq-h" className={cn(sectionTitle, "mb-5")}>Questions</h2>
          {faqs.map((f) => (
            <details key={f.q} className="group border-t border-hairline py-1">
              <summary className="flex min-h-[52px] cursor-pointer items-center justify-between gap-4 text-[17px] font-bold text-navy">
                {f.q}
                <span aria-hidden="true" className="shrink-0 text-2xl font-normal leading-none group-open:rotate-45">+</span>
              </summary>
              <p className="m-0 mb-4 max-w-[46rem]">{f.a}</p>
            </details>
          ))}
        </section>

        <section aria-labelledby="cta-h" className="flex flex-wrap items-center justify-between gap-5 rounded-hero border border-hairline p-6 tablet:p-10">
          <h2 id="cta-h" className="m-0 text-[clamp(1.5rem,3vw,2rem)]">Ready to see where your studies lead?</h2>
          <ButtonLink href="/sign-up" size="large">Get started</ButtonLink>
        </section>
      </main>
    </>
  );
}

const previewMark: Record<PreviewSkill["state"], { box: string; label: string; text: string; icon: React.ReactNode }> = {
  have: { box: "bg-navy text-white", label: "You have it", text: "text-navy", icon: <CheckIcon size={15} /> },
  learning: { box: "bg-maroon text-white", label: "Learning", text: "text-maroon", icon: <DotsIcon size={15} /> },
  missing: { box: "bg-cream text-navy", label: "Missing", text: "text-navy", icon: <PlusIcon size={15} /> },
};

function SkillGapPreview() {
  const d = homeSkillGapSample;
  return (
    <figure className="m-0 flex min-w-0 max-w-[460px] flex-[1_1_340px] flex-col gap-2.5">
      <div className="flex flex-col gap-3 rounded-card bg-white p-5 text-ink">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-bold uppercase tracking-[0.08em] text-maroon">Target job · {d.targetJob}</span>
          <b className="font-display text-xl text-navy">Your skill gap</b>
        </div>
        <span className="text-sm text-muted">You have {d.have} of the {d.total} skills this job asks for.</span>
        <ul className="m-0 list-none overflow-hidden rounded-button border border-hairline p-0">
          {d.skills.map((s, i) => {
            const m = previewMark[s.state];
            return (
              <li key={s.name} className={cn("flex items-center gap-2.5 px-3 py-2.5", i > 0 && "border-t border-hairline")}>
                <span aria-hidden="true" className={cn("inline-flex size-[26px] shrink-0 items-center justify-center rounded-[7px]", m.box)}>{m.icon}</span>
                <b className="min-w-0 flex-1 text-[15px] text-navy">{s.name}</b>
                <span className={cn("whitespace-nowrap text-[13px] font-bold", m.text)}>{m.label}</span>
              </li>
            );
          })}
        </ul>
        <span className="text-[13px] text-muted">Source: {d.source}</span>
      </div>
      <figcaption className="text-sm text-cream">The skill gap screen, with sample data.</figcaption>
    </figure>
  );
}
