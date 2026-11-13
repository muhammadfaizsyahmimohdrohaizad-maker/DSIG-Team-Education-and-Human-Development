import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink, EmptyState, ErrorState, SegmentedLinks, cn } from "@/components/ui";
import { listStudents, type AdviserStudent } from "@/features/adviser/actions";
import { dayLabel, whenLabel } from "@/features/booking/labels";

export const metadata: Metadata = { title: "Students" };

const pageTitle = "m-0 text-[clamp(1.75rem,3vw,2.25rem)] leading-[1.15] tracking-[-0.02em]";
const FILTERS = [
  { key: "all", label: "Everyone" },
  { key: "sharing", label: "Sharing progress" },
  { key: "upcoming", label: "Booked" },
] as const;

// Adviser: students board. Progress columns show only for students whose latest adviser_visibility choice is yes.
export default async function StudentsPage({ searchParams }: { searchParams: Promise<{ q?: string; show?: string }> }) {
  const { q = "", show } = await searchParams;
  const filter = FILTERS.some((f) => f.key === show) ? show! : "all";
  const result = await listStudents();
  const href = (s: string) => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (s !== "all") p.set("show", s);
    const t = p.toString();
    return t ? `/adviser/students?${t}` : "/adviser/students";
  };

  if (!result.ok) {
    return <main id="main" className="mx-auto flex w-full max-w-[1280px] flex-1 flex-col gap-6 px-4 pb-16 pt-5 tablet:px-6 tablet:pt-8"><h1 className={pageTitle}>Students</h1><ErrorState title="Students didn't load." actions={<ButtonLink href="/adviser/students">Try again</ButtonLink>}>{result.error.message}</ErrorState></main>;
  }
  const all = result.value;
  const rows = all.filter((s: AdviserStudent) =>
    (!q || s.fullName.toLowerCase().includes(q.toLowerCase())) &&
    (filter === "sharing" ? s.sharing : filter === "upcoming" ? s.upcoming.length > 0 : true));

  return (
    <main id="main" className="mx-auto flex w-full max-w-[1280px] flex-1 flex-col gap-5 px-4 pb-16 pt-5 tablet:px-6 tablet:pt-8">
      <div className="flex flex-col gap-1.5">
        <h1 className={pageTitle}>Students</h1>
        <p className="m-0 max-w-[48rem]">{all.length} student{all.length === 1 ? " is" : "s are"} linked to you. Progress shows only for students who agreed to share it with their adviser.</p>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <form method="get" action="/careerprep/adviser/students" role="search" className="flex flex-[1_1_280px] flex-col gap-1.5">
          <label htmlFor="q" className="text-[15px] font-semibold text-navy">Search by name</label>
          <div className="flex gap-2">
            <input id="q" name="q" type="search" defaultValue={q} placeholder="e.g. Aina" className="min-h-11 w-full rounded-control border border-control bg-white px-3 text-base" />
            {filter !== "all" ? <input type="hidden" name="show" value={filter} /> : null}
            <button type="submit" className="min-h-11 rounded-button border border-navy px-4 font-semibold text-navy hover:bg-cream">Search</button>
          </div>
        </form>
        <div className="w-full max-w-[460px]">
          <SegmentedLinks label="Show" current={href(filter)} items={FILTERS.map((f) => ({ href: href(f.key), label: f.label }))} />
        </div>
      </div>
      <p role="status" className="m-0 text-[15px] text-muted">{rows.length} shown</p>

      {rows.length === 0 ? (
        <EmptyState title="No students match" actions={<ButtonLink href="/adviser/students" variant="outline" className="self-start">Clear search and filters</ButtonLink>}>
          <p className="m-0">Try a different name, or show everyone.</p>
        </EmptyState>
      ) : (
        <div className="overflow-x-auto rounded-card border border-hairline">
          <table className="w-full min-w-[720px] border-collapse text-left text-[15px]">
            <caption className="sr-only">Students linked to you</caption>
            <thead className="bg-cream text-sm text-navy">
              <tr>
                {["Student", "Target job", "Job skills ready", "Last session", "Next booking"].map((h) => <th key={h} scope="col" className="px-4 py-3 font-semibold">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => (
                <tr key={s.studentId} className="border-t border-hairline">
                  <th scope="row" className="px-4 py-3 font-normal">
                    <b className="text-navy">{s.fullName}</b>
                    <span className="block text-sm text-muted">{[s.programme, s.semester ? `semester ${s.semester}` : null].filter(Boolean).join(", ") || "Programme not given"}</span>
                  </th>
                  <td className="px-4 py-3">{s.sharing ? (s.targetTitle ?? "Not chosen") : <span className="text-muted">Not shared</span>}</td>
                  <td className="px-4 py-3">{s.sharing && s.skillsTotal ? `${s.skillsReady ?? 0} of ${s.skillsTotal}` : <span className="text-muted">—</span>}</td>
                  <td className="px-4 py-3">{s.lastSession ? dayLabel(s.lastSession) : <span className="text-muted">None yet</span>}</td>
                  <td className={cn("px-4 py-3", !s.upcoming.length && "text-muted")}>{s.upcoming[0] ? whenLabel(s.upcoming[0].start) : "None"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Link href="/adviser/requests" className="inline-flex min-h-11 items-center self-start font-semibold">Go to booking requests</Link>
    </main>
  );
}
