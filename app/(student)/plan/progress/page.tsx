import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ButtonLink, Card, EmptyState, SoftPanel, StatusTag, cn, type TagKind } from "@/components/ui";
import { SkillStrip } from "@/components/skill-strip";
import { getSkillGap } from "@/features/plan/actions";
import type { GapRowView } from "@/lib/types";
import { recentAnswers } from "@/server/data/interview";
import { currentUser } from "@/server/data/supabase";

export const metadata: Metadata = { title: "Progress summary" };

const mainClasses = "mx-auto flex w-full max-w-[1280px] flex-1 flex-col gap-6 px-4 pb-16 pt-5 tablet:px-6 tablet:pt-8";
const pageTitle = "m-0 text-[clamp(1.75rem,3vw,2.25rem)] leading-[1.15] tracking-[-0.02em]";
const dateMyt = (iso: string) => new Date(iso).toLocaleDateString("en-MY", { day: "numeric", month: "short", timeZone: "Asia/Kuala_Lumpur" });

const LOOK: Record<GapRowView["state"], { tag: TagKind; label: string }> = {
  have: { tag: "have", label: "Ready" },
  mastered: { tag: "have", label: "Ready" },
  learning: { tag: "learning", label: "In progress" },
  check_needed: { tag: "check_needed", label: "Needs evidence" },
  missing: { tag: "missing", label: "Gap" },
};

function Numbered({ n, id, title }: { n: number; id: string; title: string }) {
  return (
    <div className="flex items-center gap-3">
      <span aria-hidden="true" className="inline-flex size-8 shrink-0 items-center justify-center rounded-control bg-maroon font-bold text-white">{n}</span>
      <h2 id={id} className="m-0 text-[22px]">{title}</h2>
    </div>
  );
}

// Progress summary board: past mock interviews and the skills against the target job. Only data the app
// records is shown; there are no percentage levels, streaks or AI advice until the backend stores them.
export default async function ProgressPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");
  const [result, answers] = await Promise.all([getSkillGap(), recentAnswers(user.id)]);
  const gap = result.ok ? result.value : null;
  const ready = gap ? gap.rows.filter((r) => r.state === "have" || r.state === "mastered").length : 0;
  const inProgress = gap ? gap.rows.filter((r) => r.state === "learning" || r.state === "check_needed").length : 0;

  return (
    <main id="main" className={mainClasses}>
      <div className="flex flex-col gap-1.5">
        <h1 className={pageTitle}>Your progress summary</h1>
        <p className="m-0">
          {gap ? <>Target job: <b className="text-navy">{gap.target.title}</b>. Here is how your practice is going and what to work on next.</> : "Pick a target job to see how ready you are for it."}
        </p>
      </div>

      <div className="flex flex-wrap items-start gap-6">
        <Card as="section" aria-labelledby="mock-h" className="min-w-0 flex-[1_1_420px]" gap="gap-4">
          <Numbered n={1} id="mock-h" title="Past mock interviews" />
          {answers.length === 0 ? (
            <EmptyState title="No mock interviews yet" actions={<ButtonLink href="/plan/interview" className="self-start">Start a mock interview</ButtonLink>}>
              <p className="m-0">Your answers and their marks will show here.</p>
            </EmptyState>
          ) : (
            <ol className="m-0 flex list-none flex-col p-0">
              {answers.map((a, i) => (
                <li key={a.id} className={cn("flex flex-col gap-1 py-3", i > 0 && "border-t border-hairline")}>
                  <div className="flex items-center justify-between gap-3">
                    <b className="text-navy">{a.round === "behavioural" ? "Behavioural round" : a.round === "technical" ? "Technical round" : "Mock interview"}</b>
                    <span className="font-bold text-navy">{a.skipped ? "Skipped" : a.total !== null ? `${a.total} / 5` : "Not marked"}</span>
                  </div>
                  <span className="text-sm text-muted">{dateMyt(a.createdAt)}</span>
                  {a.prompt ? <p className="m-0 text-[15px]">{a.prompt}</p> : null}
                  {a.aiFeedback ? (
                    <div className="flex flex-col items-start gap-1 rounded-button bg-cream px-3 py-2">
                      <StatusTag kind="ai_generated" />
                      <p className="m-0 text-[15px]">“{a.aiFeedback}”</p>
                    </div>
                  ) : null}
                </li>
              ))}
            </ol>
          )}
          <ButtonLink href="/plan/interview" variant="outline" className="self-start">Practise again</ButtonLink>
        </Card>

        <Card as="section" aria-labelledby="gap-h" className="min-w-0 flex-[1_1_420px]" gap="gap-4">
          <Numbered n={2} id="gap-h" title="Your skills vs the target job" />
          {!gap ? (
            <EmptyState title="No target job yet" actions={<ButtonLink href="/map" className="self-start">Open the career map</ButtonLink>} />
          ) : (
            <>
              <SkillStrip mastered={ready} learning={inProgress} notStarted={gap.rows.length - ready - inProgress} />
              <ul className="m-0 flex list-none flex-col p-0">
                {gap.rows.map((r, i) => (
                  <li key={r.skill} className={cn("flex items-center justify-between gap-3 py-2.5", i > 0 && "border-t border-hairline")}>
                    <span className="min-w-0">{r.label}</span>
                    <StatusTag kind={LOOK[r.state].tag} label={LOOK[r.state].label} />
                  </li>
                ))}
              </ul>
              <p className="m-0">You have {ready} of the {gap.rows.length} skills this job needs.</p>
            </>
          )}
        </Card>
      </div>

      <SoftPanel as="section" aria-labelledby="next-h" gap="gap-3">
        <h2 id="next-h" className="m-0 text-xl">What to do next</h2>
        <div className="flex flex-wrap gap-2">
          <ButtonLink href="/skill-gap">Close a skill gap</ButtonLink>
          <ButtonLink href="/plan/interview" variant="outline">Mock interview</ButtonLink>
          <ButtonLink href="/book" variant="outline">Talk to a career adviser</ButtonLink>
        </div>
      </SoftPanel>
    </main>
  );
}
