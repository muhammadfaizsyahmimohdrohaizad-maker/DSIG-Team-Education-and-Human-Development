import type { Metadata } from "next";
import Link from "next/link";
import { SkillStrip } from "@/components/skill-strip";
import {
  ButtonLink, CalendarIcon, Card, ChartIcon, ChatIcon, ClockIcon, HeroBand, PeopleIcon, Pill, PlayIcon, SoftPanel, cn,
} from "@/components/ui";
import { getDashboardSample, type DashboardData } from "./sample-data";

export const metadata: Metadata = { title: "Dashboard" };

const mainClasses = "mx-auto flex w-full max-w-[1280px] flex-1 flex-col px-4 pb-16 pt-5 tablet:px-6";
const pageTitle = "m-0 text-[clamp(1.75rem,3vw,2.25rem)] leading-[1.15] tracking-[-0.02em]";
const cardTitle = "m-0 text-[22px]";

// ?view=first-visit previews the FirstRun board until the profile query can tell a first visit apart.
export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ view?: string | string[] }> }) {
  const { view } = await searchParams;
  const data = getDashboardSample(view === "first-visit");
  return data.kind === "first-visit" ? <FirstVisit firstName={data.firstName} /> : <Active data={data} />;
}

function IconTile({ children, light = false }: { children: React.ReactNode; light?: boolean }) {
  return (
    <span aria-hidden="true" className={cn("inline-flex size-[52px] items-center justify-center rounded-card", light ? "bg-white text-navy" : "bg-navy text-white")}>
      {children}
    </span>
  );
}

function Active({ data }: { data: Extract<DashboardData, { kind: "active" }> }) {
  const { progress } = data;
  const total = progress.mastered + progress.learning + progress.notStarted;
  return (
    <main id="main" className={cn(mainClasses, "gap-8 tablet:pt-10")}>
      <HeroBand row gap="gap-x-8 gap-y-4" aria-labelledby="hello" className="justify-between">
        <div className="flex min-w-0 flex-[999_1_420px] flex-col gap-1.5">
          <h1 id="hello" className={pageTitle}>Welcome back, {data.firstName}</h1>
          <p className="m-0 text-cream">
            Target job: <b className="text-white">{data.targetJob}</b>.{" "}
            {data.dueCards > 0 ? (
              <>
                {data.dueCards} {data.dueCards === 1 ? "card is" : "cards are"} due for review today.{" "}
                <Link href="/plan/review" className="font-semibold text-white hover:text-cream">Review them now</Link>
              </>
            ) : "No review cards are due today."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          {data.countdown ? (
            <span className="inline-flex items-center gap-2 rounded-full bg-cream px-3.5 py-2 text-sm font-semibold text-navy">
              <ClockIcon size={16} />
              {data.countdown}
            </span>
          ) : null}
          <ButtonLink href="/about-you" variant="on-navy" size="compact" className="text-sm">Update my details</ButtonLink>
        </div>
      </HeroBand>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(300px,100%),1fr))] gap-5">
        <Card as="section" aria-labelledby="continue-h" pad="p-5 tablet:p-7" gap="gap-4">
          <IconTile><PlayIcon /></IconTile>
          <div className="flex flex-col gap-1.5">
            <h2 id="continue-h" className={cardTitle}>Continue learning</h2>
            <p className="m-0">{data.continueLesson ? "Pick up where you stopped last time." : "Nothing to continue yet. Your lessons will show here."}</p>
          </div>
          {data.continueLesson ? (
            <>
              <div className="flex flex-col gap-2.5 rounded-button bg-cream px-4 py-3.5">
                <div className="flex justify-between gap-2 text-sm">
                  <b className="text-navy">Lesson · {data.continueLesson.skill}</b>
                  <span>{data.continueLesson.lastOpened}</span>
                </div>
                <div
                  role="progressbar"
                  aria-label={`${data.continueLesson.skill} lesson progress`}
                  aria-valuenow={data.continueLesson.percentDone}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  className="h-2 overflow-hidden rounded-full bg-hairline"
                >
                  <div className="h-full rounded-full bg-navy" style={{ width: `${data.continueLesson.percentDone}%` }} />
                </div>
                <span className="text-sm">Lesson {data.continueLesson.lesson} of {data.continueLesson.of} · {data.continueLesson.percentDone}% done</span>
              </div>
              <ButtonLink href={data.continueLesson.href} fullWidth className="mt-auto">Continue lesson</ButtonLink>
            </>
          ) : null}
        </Card>

        <Card as="section" aria-labelledby="today-h" pad="p-5 tablet:p-7" gap="gap-4">
          <IconTile><CalendarIcon size={24} /></IconTile>
          <div className="flex flex-col gap-1.5">
            <h2 id="today-h" className={cardTitle}>Today</h2>
            <p className="m-0">About {data.today.minutes} minutes, in this order.</p>
          </div>
          <ol className="m-0 flex list-none flex-col gap-2 p-0">
            {data.today.items.map((item) => (
              <li key={item.kind + item.detail}>
                <Link href={item.href} className="flex min-h-14 items-center gap-3 rounded-button bg-cream px-3 py-2.5 text-ink no-underline hover:bg-hairline hover:text-ink">
                  <span className="flex min-w-0 flex-1 flex-col leading-snug">
                    <b className="text-navy">{item.kind}</b>
                    <span className="text-sm">{item.detail}</span>
                  </span>
                  <span className="whitespace-nowrap text-sm text-muted">{item.minutes} min</span>
                </Link>
              </li>
            ))}
          </ol>
          <ButtonLink href="/plan" variant="outline" fullWidth className="mt-auto">Open my plan</ButtonLink>
        </Card>

        <SoftPanel as="section" aria-labelledby="progress-h" pad="p-5 tablet:p-7" gap="gap-4">
          <IconTile light><ChartIcon size={24} /></IconTile>
          <div className="flex flex-col gap-1.5">
            <h2 id="progress-h" className={cardTitle}>My progress</h2>
            <p className="m-0">How ready you are for your target job.</p>
          </div>
          <p className="m-0 flex items-baseline gap-2">
            <span className="font-display text-[40px] font-bold leading-none text-navy">{progress.mastered} / {total}</span>
            <span>job skills you have</span>
          </p>
          <SkillStrip mastered={progress.mastered} learning={progress.learning} notStarted={progress.notStarted} />
          <ButtonLink href="/plan/progress" variant="outline" fullWidth className="mt-auto">View full summary</ButtonLink>
        </SoftPanel>
      </div>

      <div className="flex flex-wrap gap-4">
        <Link href="/book" className="flex min-h-16 flex-[1_1_320px] items-center gap-3.5 rounded-full border border-hairline bg-white py-2.5 pl-3 pr-6 text-navy no-underline hover:bg-cream hover:text-navy">
          <span aria-hidden="true" className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-cream"><PeopleIcon size={22} /></span>
          <span className="flex flex-col leading-snug">
            <b>Talk to a career adviser</b>
            <span className="text-sm text-ink">Book a session with a person</span>
          </span>
        </Link>
        <div className="flex min-h-16 flex-[1_1_320px] items-center gap-3.5 rounded-full border border-dashed border-control bg-cream py-2.5 pl-3 pr-4 text-navy tablet:pr-6">
          <span aria-hidden="true" className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-white"><ChatIcon size={22} /></span>
          <span className="flex min-w-0 flex-1 flex-col leading-snug">
            <b>Ask CareerPrep</b>
            <span className="text-sm text-muted">Questions about your jobs and skills</span>
          </span>
          <Pill>Coming later</Pill>
        </div>
      </div>
    </main>
  );
}

function FirstVisit({ firstName }: { firstName: string }) {
  const steps = [
    { title: "Tell us what you know", text: "Skills, projects and your programme. About 5 minutes." },
    { title: "Pick a target job", text: "From the MASCO jobs that match, with the reasons shown." },
    { title: "Practise the gaps", text: "Short lessons and a check for each missing skill." },
  ];
  return (
    <main id="main" className={cn(mainClasses, "gap-6 tablet:pt-8")}>
      <HeroBand aria-labelledby="hello">
        <h1 id="hello" className={pageTitle}>Welcome, {firstName}</h1>
        <p className="m-0 max-w-[44rem] text-cream">
          Start with one short session. You&apos;ll see which official jobs fit what you already know, pick one, and get lessons for the skills it needs.
        </p>
      </HeroBand>

      <div className="flex flex-wrap items-stretch gap-5">
        <section aria-labelledby="start-h" className="flex min-w-0 flex-[999_1_560px] flex-col gap-4 rounded-card border-2 border-maroon p-5 tablet:p-7">
          <h2 id="start-h" className={cardTitle}>Tell us about yourself</h2>
          <ol className="m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3 p-0">
            {steps.map((s, i) => (
              <li key={s.title} className="flex items-start gap-3">
                <span aria-hidden="true" className={cn("inline-flex size-8 shrink-0 items-center justify-center rounded-control font-bold text-white", i === 0 ? "bg-maroon" : "bg-navy")}>{i + 1}</span>
                <span>
                  <b className="text-navy">{s.title}</b>
                  <br />
                  <span className="text-[15px]">{s.text}</span>
                </span>
              </li>
            ))}
          </ol>
          <ButtonLink href="/about-you" className="self-start">Add my details</ButtonLink>
        </section>

        <SoftPanel as="section" aria-labelledby="person-h" className="min-w-0 flex-[1_1_280px]">
          <h2 id="person-h" className="m-0 text-xl leading-tight">Talk to a person</h2>
          <p className="m-0">Not sure where to start? A GMI career adviser can go through it with you.</p>
          <ButtonLink href="/book" variant="outline" className="mt-auto">Book an adviser</ButtonLink>
        </SoftPanel>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(300px,100%),1fr))] gap-5">
        <Card as="section" aria-labelledby="cont-h">
          <h2 id="cont-h" className="m-0 text-xl leading-tight">Continue learning</h2>
          <p className="m-0 text-muted">Nothing to continue yet. Your lessons will show here.</p>
        </Card>
        <Card as="section" aria-labelledby="prog-h">
          <h2 id="prog-h" className="m-0 text-xl leading-tight">My progress</h2>
          <p className="m-0 text-muted">Pick a target job to see how ready you are for it.</p>
          <ButtonLink href="/map" variant="text" className="self-start">Look at the career map</ButtonLink>
        </Card>
      </div>
    </main>
  );
}
