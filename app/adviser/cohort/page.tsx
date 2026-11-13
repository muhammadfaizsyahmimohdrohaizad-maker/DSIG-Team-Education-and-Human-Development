import type { Metadata } from "next";
import { ButtonLink, Card, ErrorState, SoftPanel } from "@/components/ui";
import { getCohort, type CohortMetricRow } from "@/features/adviser/actions";

export const metadata: Metadata = { title: "Cohort overview" };

const pageTitle = "m-0 text-[clamp(1.75rem,3vw,2.25rem)] leading-[1.15] tracking-[-0.02em]";
const PROGRAMMES = ["Software Engineering", "Mechatronic Engineering", "Industrial Electronics"];

function Bars({ rows, max }: { rows: CohortMetricRow[]; max: number }) {
  return (
    <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
      {rows.map((r) => (
        <li key={r.label} className="grid grid-cols-[minmax(0,1fr)_minmax(80px,2fr)_auto] items-center gap-3 text-[15px]">
          <span className="min-w-0">{r.label}</span>
          <span aria-hidden="true" className="h-2.5 overflow-hidden rounded-full bg-hairline"><span className="block h-full rounded-full bg-navy" style={{ width: `${Math.round((r.students / Math.max(max, 1)) * 100)}%` }} /></span>
          <b className="text-navy">{r.students}</b>
        </li>
      ))}
    </ul>
  );
}

// Adviser: cohort board. cohort_rows never returns a group under 5 students, so small groups simply don't appear.
export default async function CohortPage({ searchParams }: { searchParams: Promise<{ programme?: string }> }) {
  const { programme } = await searchParams;
  const prog = typeof programme === "string" ? programme.trim() || undefined : undefined;
  const result = await getCohort(prog ? { programme: prog } : {});

  const header = (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="flex max-w-[48rem] flex-col gap-1.5">
        <h1 className={pageTitle}>Cohort overview</h1>
        <p className="m-0">Totals for students who agreed to share their progress. Names never appear here, and any group of fewer than 5 students is hidden.</p>
      </div>
      <form method="get" action="/careerprep/adviser/cohort" className="flex items-end gap-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="programme" className="text-[15px] font-semibold text-navy">Programme</label>
          <input id="programme" name="programme" defaultValue={prog ?? ""} className="min-h-11 rounded-control border border-control bg-white px-3" list="cohort-programmes" placeholder="All programmes" maxLength={120} /><datalist id="cohort-programmes">{PROGRAMMES.map(p => <option key={p} value={p} />)}</datalist>
        </div>
        <button type="submit" className="min-h-11 rounded-button border border-navy px-4 font-semibold text-navy hover:bg-cream">Show</button>
      </form>
    </div>
  );

  if (!result.ok) {
    return <main id="main" className="mx-auto flex w-full max-w-[1280px] flex-1 flex-col gap-6 px-4 pb-16 pt-5 tablet:px-6 tablet:pt-8">{header}<ErrorState title="Cohort totals didn't load." actions={<ButtonLink href="/adviser/cohort">Try again</ButtonLink>}>{result.error.message}</ErrorState></main>;
  }

  const rows = result.value;
  const one = (m: string) => rows.find((r) => r.metric === m)?.students;
  const total = one("total");
  const jobs = rows.filter((r) => r.metric === "target" && r.label).sort((a, b) => b.students - a.students);
  const gaps = rows.filter((r) => r.metric === "gap" && r.label).sort((a, b) => b.students - a.students).slice(0, 8);
  const tooFew = total === undefined;

  return (
    <main id="main" className="mx-auto flex w-full max-w-[1280px] flex-1 flex-col gap-6 px-4 pb-16 pt-5 tablet:px-6 tablet:pt-8">
      {header}
      {tooFew ? (
        <SoftPanel as="section" gap="gap-2">
          <h2 className="m-0 text-xl">Too few students to show</h2>
          <p className="m-0">Fewer than 5 students {prog ? "in this programme " : ""}share their progress, so totals could identify them.</p>
          {prog ? <ButtonLink href="/adviser/cohort" variant="outline" className="self-start">Show all programmes</ButtonLink> : null}
        </SoftPanel>
      ) : (
        <>
          <dl className="m-0 grid grid-cols-[repeat(auto-fit,minmax(min(220px,100%),1fr))] gap-3">
            {[
              ["Students sharing", one("sharing") ?? "Under 5", total],
              ["With a target job", one("with_target") ?? "Under 5", undefined],
              ["Mock interviews this month", one("mock_sessions_month") ?? "Under 5", undefined],
            ].map(([k, v, of]) => (
              <div key={k as string} className="flex flex-col gap-1 rounded-card border border-hairline p-4">
                <dt className="text-sm text-muted">{k}</dt>
                <dd className="m-0 font-display text-[28px] font-bold leading-none text-navy">{v}{of !== undefined ? <span className="ml-1 font-sans text-base font-normal text-muted">of {of}</span> : null}</dd>
              </div>
            ))}
          </dl>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(380px,100%),1fr))] gap-4">
            <Card as="section" aria-labelledby="jobs-h" gap="gap-3">
              <h2 id="jobs-h" className="m-0 text-[22px]">Target jobs</h2>
              {jobs.length ? <Bars rows={jobs} max={jobs[0]!.students} /> : <p className="m-0 text-muted">No job has 5 or more students yet.</p>}
              <span className="text-sm text-muted">Jobs chosen by fewer than 5 students are hidden.</span>
            </Card>
            <Card as="section" aria-labelledby="gaps-h" gap="gap-3">
              <h2 id="gaps-h" className="m-0 text-[22px]">Most common gap skills</h2>
              {gaps.length ? <Bars rows={gaps} max={gaps[0]!.students} /> : <p className="m-0 text-muted">No gap skill is shared by 5 or more students yet.</p>}
              <span className="text-sm text-muted">Number of students still missing each skill. A useful list for workshop topics.</span>
            </Card>
          </div>
        </>
      )}
    </main>
  );
}
