import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink, Card, EmptyState, Kicker, SegmentedLinks, SoftPanel, StatusTag, cn, type TagKind } from "@/components/ui";
import { ClaimSkillButton } from "@/features/plan/buttons";
import { getSkillGap } from "@/features/plan/actions";
import type { GapRowView } from "@/lib/types";

export const metadata: Metadata = { title: "Skill gap" };

const mainClasses = "mx-auto flex w-full max-w-[1280px] flex-1 flex-col gap-6 px-4 pb-16 pt-5 tablet:px-6 tablet:pt-8";
const pageTitle = "m-0 text-[clamp(1.75rem,3vw,2.25rem)] leading-[1.15] tracking-[-0.02em]";

// Skill gap board: one row per skill the target job needs, with why we think the student has it or what is missing.
const LOOK: Record<GapRowView["state"], { tag: TagKind; label: string }> = {
  have: { tag: "have", label: "You have it" },
  mastered: { tag: "have", label: "You have it" },
  learning: { tag: "learning", label: "In progress" },
  check_needed: { tag: "check_needed", label: "Needs evidence" },
  missing: { tag: "missing", label: "Missing" },
};
const isHave = (r: GapRowView) => r.state === "have" || r.state === "mastered";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "have", label: "I have" },
  { key: "gap", label: "To build" },
] as const;
type Filter = (typeof FILTERS)[number]["key"];

export default async function SkillGapPage({ searchParams }: { searchParams: Promise<{ show?: string }> }) {
  const { show } = await searchParams;
  const filter: Filter = show === "have" || show === "gap" ? show : "all";
  const result = await getSkillGap();

  if (!result.ok) {
    return (
      <main id="main" className={mainClasses}>
        <h1 className={pageTitle}>Your skill gap</h1>
        <EmptyState
          title={result.error.code === "NOT_FOUND" ? "Pick a target job first" : "Your skill gap didn't load"}
          actions={<ButtonLink href={result.error.code === "NOT_FOUND" ? "/map" : "/skill-gap"} className="self-start">{result.error.code === "NOT_FOUND" ? "Open the career map" : "Try again"}</ButtonLink>}
        >
          <p className="m-0">{result.error.message}</p>
        </EmptyState>
      </main>
    );
  }

  const gap = result.value;
  const count = (states: GapRowView["state"][]) => gap.rows.filter((r) => states.includes(r.state)).length;
  const shown = gap.rows.filter((r) => (filter === "have" ? isHave(r) : filter === "gap" ? !isHave(r) : true));
  const todo = gap.rows.filter((r) => !isHave(r));
  const stats = [
    { label: "You have", value: count(["have", "mastered"]), of: gap.rows.length },
    { label: "In progress", value: count(["learning"]) },
    { label: "Still to build", value: count(["missing", "check_needed"]) },
    { label: "Programmes saved in your plan", value: gap.savedOptionIds.length },
  ];

  return (
    <main id="main" className={mainClasses}>
      <div className="flex flex-col gap-1.5">
        <Link href="/map" className="inline-flex min-h-11 items-center self-start font-semibold">Back to career map</Link>
        <Kicker>Target job · {gap.target.title}</Kicker>
        <h1 className={pageTitle}>Your skill gap: {gap.target.title}</h1>
        <p className="m-0 max-w-[48rem]">Each skill this job needs, with why we think you have it, or what&apos;s missing.</p>
      </div>

      <dl className="m-0 grid grid-cols-[repeat(auto-fit,minmax(min(200px,100%),1fr))] gap-3">
        {stats.map((s) => (
          <div key={s.label} className="flex flex-col gap-1 rounded-card border border-hairline p-4">
            <dt className="text-sm text-muted">{s.label}</dt>
            <dd className="m-0 font-display text-[28px] font-bold leading-none text-navy">
              {s.value}{s.of !== undefined ? <span className="ml-1 font-sans text-base font-normal text-muted">of {s.of}</span> : null}
            </dd>
          </div>
        ))}
      </dl>

      <div className="flex flex-wrap items-start gap-6">
        <Card as="section" aria-labelledby="skills-h" className="min-w-0 flex-[999_1_560px]" gap="gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="skills-h" className="m-0 text-[22px]">Skills this job needs</h2>
            <div className="w-full max-w-[320px]">
              <SegmentedLinks
                label="Show skills"
                current={filter === "all" ? "/skill-gap" : `/skill-gap?show=${filter}`}
                items={FILTERS.map((f) => ({ href: f.key === "all" ? "/skill-gap" : `/skill-gap?show=${f.key}`, label: f.label }))}
              />
            </div>
          </div>
          {shown.length === 0 ? (
            <p className="m-0">No skills in this group. <Link href="/skill-gap">Show all skills</Link></p>
          ) : (
            <ul className="m-0 list-none p-0">
              {shown.map((r, i) => {
                const look = LOOK[r.state];
                return (
                  <li key={r.skill} className={cn("flex flex-wrap items-start gap-x-4 gap-y-2 py-4", i > 0 && "border-t border-hairline")}>
                    <div className="flex min-w-0 flex-[999_1_320px] flex-col gap-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <b className="text-navy">{r.label}</b>
                        <StatusTag kind={look.tag} label={look.label} />
                      </div>
                      <span className="text-[15px]">{r.evidence}</span>
                    </div>
                    {!isHave(r) ? (
                      <div className="flex flex-[1_1_180px] flex-wrap items-center gap-2 tablet:justify-end">
                        <ButtonLink href="/plan" variant="outline" size="compact">{r.state === "learning" ? "Continue in my plan" : r.state === "check_needed" ? "Add evidence" : "See how to close it"}</ButtonLink>
                        {r.state === "missing" ? <ClaimSkillButton skill={r.skill} label={r.label} /> : null}
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <aside aria-labelledby="path-h" className="flex min-w-0 flex-[1_1_300px] flex-col gap-4">
          <SoftPanel as="section" gap="gap-3">
            <h2 id="path-h" className="m-0 text-xl">Order to close your gaps</h2>
            {todo.length === 0 ? (
              <p className="m-0">You have every skill this job asks for. Add the evidence to your résumé.</p>
            ) : (
              <>
                <p className="m-0 text-[15px]">Close each one with a project or certificate from your plan, then add the evidence to your résumé.</p>
                <ol className="m-0 flex list-none flex-col gap-2 p-0">
                  {todo.map((r, i) => (
                    <li key={r.skill} className="flex items-center gap-3">
                      <span aria-hidden="true" className={cn("inline-flex size-7 shrink-0 items-center justify-center rounded-control text-sm font-bold", r.state === "learning" ? "bg-maroon text-white" : "bg-white text-navy")}>{i + 1}</span>
                      <b className="min-w-0 flex-1 text-[15px] text-navy">{r.label}</b>
                      <span className="text-sm text-muted">{r.state === "learning" ? "In progress" : r.state === "check_needed" ? "Needs evidence" : "Not started"}</span>
                    </li>
                  ))}
                </ol>
              </>
            )}
            <ButtonLink href="/plan" fullWidth>Open my plan</ButtonLink>
            <ButtonLink href="/book" variant="outline" fullWidth>Talk it through with an adviser</ButtonLink>
          </SoftPanel>
          <Card as="section" gap="gap-2">
            <h2 className="m-0 text-xl">Where this comes from</h2>
            <p className="m-0 text-[15px]">The job comes from MASCO 2020, Malaysia&apos;s official occupation list. Skill names come from ESCO, the European skills list. Your side comes from the modules, skills and projects you added.</p>
            <p className="m-0 text-[15px]">No AI decides this list. It is the same for every student with the same target job.</p>
          </Card>
        </aside>
      </div>
    </main>
  );
}
