import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ButtonLink, Card, EmptyState, Kicker, Pill, SoftPanel, StatusTag, cn } from "@/components/ui";
import { SaveOptionButton } from "@/features/plan/buttons";
import { getSkillGap } from "@/features/plan/actions";
import type { EducationLevel, GapRowView } from "@/lib/types";
import { getProfile } from "@/server/data/profiles";
import { currentUser } from "@/server/data/supabase";

export const metadata: Metadata = { title: "My plan" };

const mainClasses = "mx-auto flex w-full max-w-[1280px] flex-1 flex-col gap-6 px-4 pb-16 pt-5 tablet:px-6 tablet:pt-8";
const pageTitle = "m-0 text-[clamp(1.75rem,3vw,2.25rem)] leading-[1.15] tracking-[-0.02em]";

const LEVEL: Record<EducationLevel, string> = {
  spm: "SPM",
  pre_university: "STPM, matriculation or foundation",
  diploma: "Diploma",
  degree: "Degree",
};

const GROUPS: Array<{ title: string; sub: string; states: GapRowView["state"][] }> = [
  { title: "Skills you have", sub: "Ready to show on your résumé", states: ["have", "mastered"] },
  { title: "In progress", sub: "Add the evidence when it's done", states: ["learning", "check_needed"] },
  { title: "Still to build", sub: "Pick a programme, project or certificate", states: ["missing"] },
];

// Plan board (pathway and study): where the student is now, the programmes that lead to the target job
// (saved ones are shared with an adviser when the student ticks "study plan" in a booking), and the skills
// grouped by how close they are.
export default async function PlanPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");
  const [profile, result] = await Promise.all([getProfile(user.id), getSkillGap()]);

  if (!result.ok) {
    const noTarget = result.error.code === "NOT_FOUND";
    return (
      <main id="main" className={mainClasses}>
        <h1 className={pageTitle}>My plan</h1>
        <EmptyState
          title={noTarget ? "Pick a target job first" : "Your plan didn't load"}
          actions={<ButtonLink href={noTarget ? "/map" : "/plan"} className="self-start">{noTarget ? "Open the career map" : "Try again"}</ButtonLink>}
        >
          <p className="m-0">{noTarget ? "Your plan is built around one job. Choose it on the career map." : result.error.message}</p>
        </EmptyState>
      </main>
    );
  }

  const gap = result.value;
  const saved = new Set(gap.savedOptionIds);
  const lane = [
    { kind: "You are here", title: profile?.educationLevel ? LEVEL[profile.educationLevel] : "Where you are now", tone: "navy" as const },
    { kind: "Study", title: gap.options.length ? `${gap.options.length} programme${gap.options.length === 1 ? "" : "s"} below` : "Programmes coming soon", tone: "cream" as const },
    { kind: "Target job", title: gap.target.title, tone: "maroon" as const },
  ];

  return (
    <main id="main" className={mainClasses}>
      <div className="flex flex-col gap-1.5">
        <Kicker>Plan</Kicker>
        <h1 className={pageTitle}>Your pathway to {gap.target.title}</h1>
        <p className="m-0 max-w-[48rem]">From the qualifications you have now to the job you chose. Save the programmes you&apos;re considering, and close your skill gaps along the way.</p>
      </div>

      <Card as="section" aria-labelledby="path-h" gap="gap-3">
        <h2 id="path-h" className="m-0 text-[22px]">Pathway</h2>
        <ol aria-label="Pathway" className="m-0 flex list-none flex-col gap-2 p-0 tablet:flex-row tablet:items-stretch">
          {lane.map((n, i) => (
            <li key={n.kind} className="flex flex-1 flex-col gap-2 tablet:flex-row tablet:items-center">
              {i > 0 ? <span aria-hidden="true" className="self-center text-xl text-muted tablet:px-1">→</span> : null}
              <div className={cn("flex flex-1 flex-col rounded-button px-4 py-3",
                n.tone === "navy" && "bg-navy text-white", n.tone === "cream" && "bg-cream text-navy", n.tone === "maroon" && "border-2 border-maroon bg-white text-navy")}>
                <span className={cn("text-xs font-bold uppercase tracking-[0.08em]", n.tone === "navy" ? "text-cream" : "text-maroon")}>{n.kind}</span>
                <b>{n.title}</b>
              </div>
            </li>
          ))}
        </ol>
        <p className="m-0 text-sm text-muted">Stages after your next one depend on results you don&apos;t have yet, so they stay conditional.</p>
      </Card>

      <div className="flex flex-wrap items-start gap-6">
        <section aria-labelledby="progs-h" className="flex min-w-0 flex-[999_1_560px] flex-col gap-4">
          <h2 id="progs-h" className="m-0 text-[22px]">Programmes for {gap.target.title}</h2>
          {gap.options.length === 0 ? (
            <EmptyState title="No programmes listed yet">
              <p className="m-0">We haven&apos;t added programmes for this job yet. An adviser can suggest where to study.</p>
            </EmptyState>
          ) : (
            <ul aria-label="Programmes" className="m-0 flex list-none flex-col gap-3 p-0">
              {gap.options.map((o) => (
                <Card as="li" key={o.id} gap="gap-3">
                  <div className="flex flex-col gap-0.5">
                    <b className="text-lg text-navy">{o.programme}</b>
                    <span>{o.institution}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Pill>{LEVEL[o.level]}</Pill>
                    {o.kind ? <Pill>{o.kind}</Pill> : null}
                    {o.duration ? <Pill>{o.duration}</Pill> : null}
                    {o.award ? <Pill>{o.award}</Pill> : null}
                    {!o.verified ? <StatusTag kind="check_needed" label="Needs verification" /> : null}
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-hairline pt-3">
                    <a href={o.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center">Official programme page</a>
                    <SaveOptionButton optionId={o.id} saved={saved.has(o.id)} programme={o.programme} />
                  </div>
                  <span className="text-sm text-muted">Meeting the minimum requirements does not guarantee an offer. Confirm entry requirements with the institution.</span>
                </Card>
              ))}
            </ul>
          )}
        </section>

        <aside aria-labelledby="extras-h" className="flex min-w-0 flex-[1_1_300px] flex-col gap-4">
          <h2 id="extras-h" className="m-0 text-[22px]">Skills for this job</h2>
          {GROUPS.map((g) => {
            const items = gap.rows.filter((r) => g.states.includes(r.state));
            return (
              <Card key={g.title} pad="p-5" gap="gap-2">
                <div className="flex flex-col">
                  <b className="text-navy">{g.title} ({items.length})</b>
                  <span className="text-sm text-muted">{g.sub}</span>
                </div>
                {items.length ? (
                  <ul className="m-0 flex flex-col gap-1 pl-5 text-[15px]">
                    {items.map((r) => <li key={r.skill}>{r.label}{r.state === "check_needed" ? " (needs evidence)" : ""}</li>)}
                  </ul>
                ) : <span className="text-[15px] text-muted">None</span>}
              </Card>
            );
          })}
          <ButtonLink href="/skill-gap" variant="outline">See my skill gap</ButtonLink>
          <SoftPanel gap="gap-1.5">
            <span className="text-sm font-semibold uppercase tracking-[0.08em] text-maroon">My plan</span>
            <b className="font-display text-[28px] leading-none text-navy">{saved.size} saved</b>
            <span className="text-[15px]">Your adviser can see these when you book and choose to share your study plan.</span>
            <ButtonLink href="/book" variant="outline" className="mt-2">Talk it through with an adviser</ButtonLink>
          </SoftPanel>
        </aside>
      </div>
    </main>
  );
}
