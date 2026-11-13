import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ButtonLink, Card, EmptyState, Kicker, SoftPanel, cn } from "@/components/ui";
import { computeMatches } from "@/features/matches/rank";
import { SaveOptionButton, SetTargetButton } from "@/features/plan/buttons";
import type { EducationLevel } from "@/lib/types";
import { getSavedOptionIds } from "@/server/data/learning";
import { getProfile, listSessions } from "@/server/data/profiles";
import { getSkills, getStudyOptions } from "@/server/data/reference";
import { currentUser } from "@/server/data/supabase";

export const metadata: Metadata = { title: "Career map" };

const mainClasses = "mx-auto flex w-full max-w-[1280px] flex-1 flex-col gap-6 px-4 pb-16 pt-5 tablet:px-6 tablet:pt-8 desktop:flex-row desktop:items-start";
const pageTitle = "m-0 text-[clamp(1.75rem,3vw,2.25rem)] leading-[1.15] tracking-[-0.02em]";

const LEVEL: Record<EducationLevel, string> = {
  spm: "SPM",
  pre_university: "STPM, matriculation or foundation",
  diploma: "Diploma",
  degree: "Degree",
};
const shortDate = (iso: string) => new Date(iso).toLocaleDateString("en-MY", { day: "numeric", month: "short", timeZone: "Asia/Kuala_Lumpur" });

// Map board: the student's saved sessions, the careers each one matched, and for the selected career the
// programmes to study and a way to make it the target job. Matching is the same fixed-rule engine as
// "Tell us about yourself", run on the session's saved answers.
export default async function MapPage({ searchParams }: { searchParams: Promise<{ session?: string; job?: string }> }) {
  const { session, job } = await searchParams;
  const user = await currentUser();
  if (!user) redirect("/sign-in");
  const [profile, sessions] = await Promise.all([getProfile(user.id), listSessions(user.id)]);

  if (!profile || sessions.length === 0) {
    return (
      <main id="main" className="mx-auto flex w-full max-w-[1280px] flex-1 flex-col gap-6 px-4 pb-16 pt-5 tablet:px-6 tablet:pt-8">
        <h1 className={pageTitle}>Career map</h1>
        <EmptyState title="No sessions yet" actions={<ButtonLink href="/about-you" className="self-start">Tell us about yourself</ButtonLink>}>
          <p className="m-0">Tell us what you know, and we&apos;ll show the official jobs that fit you here.</p>
        </EmptyState>
      </main>
    );
  }

  const current = sessions.find((s) => s.id === session) ?? sessions[0]!;
  const snap = current.snapshot;
  const [matches, skills] = await Promise.all([
    computeMatches({
      userId: user.id, isUnder18: profile.isUnder18, educationLevel: snap.educationLevel, spmGrades: snap.spmGrades ?? [],
      moduleIds: snap.moduleIds ?? [], skills: snap.skills ?? [], projects: snap.projects ?? [], interests: snap.interests ?? [], jobInMind: snap.jobInMind,
    }),
    getSkills(),
  ]);
  const careers = matches.slice(0, 5);
  const selected = careers.find((m) => m.code === job) ?? null;
  const [options, savedIds] = selected ? await Promise.all([getStudyOptions(selected.code), getSavedOptionIds(user.id)]) : [[], []];

  const sessionNo = (id: string) => sessions.length - sessions.findIndex((s) => s.id === id);
  const href = (q: { session?: string; job?: string }) => {
    const p = new URLSearchParams();
    if (q.session) p.set("session", q.session);
    if (q.job) p.set("job", q.job);
    const s = p.toString();
    return s ? `/map?${s}` : "/map";
  };
  const basedOn = [
    snap.interests?.length ? `Interests: ${snap.interests.join(", ")}` : "No specific interest",
    snap.skills?.length ? `Skills: ${snap.skills.map((u) => skills.get(u)?.label ?? u).join(", ")}` : null,
    snap.projects?.length ? `Projects: ${snap.projects.map((p) => p.name).join(", ")}` : null,
  ].filter(Boolean).join(" · ");

  return (
    <main id="main" className={mainClasses}>
      <aside aria-labelledby="sessions-h" className="order-2 flex min-w-0 flex-col gap-3 desktop:order-none desktop:w-[260px] desktop:shrink-0">
        <h2 id="sessions-h" className="m-0 text-xl">Your sessions</h2>
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {sessions.map((s) => {
            const on = s.id === current.id;
            return (
              <li key={s.id}>
                <Link
                  href={href({ session: s.id })}
                  aria-current={on ? "page" : undefined}
                  className={cn("flex min-h-11 flex-col rounded-button border px-3.5 py-2.5 no-underline", on ? "border-navy bg-navy text-white hover:text-white" : "border-hairline bg-white text-navy hover:bg-cream hover:text-navy")}
                >
                  <b>Session {sessionNo(s.id)} · {shortDate(s.createdAt)}</b>
                  <span className={cn("text-sm", on ? "text-cream" : "text-muted")}>{s.snapshot.matches?.length ?? 0} careers matched</span>
                </Link>
              </li>
            );
          })}
        </ul>
        <ButtonLink href="/about-you" variant="outline">Start a new session</ButtonLink>
      </aside>

      <section aria-labelledby="map-h" className="flex min-w-0 flex-1 flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <h1 id="map-h" className={pageTitle}>Career map</h1>
          <p className="m-0">
            Showing session {sessionNo(current.id)} ({shortDate(current.createdAt)}), your {current.id === sessions[0]!.id ? "most recent" : "earlier"} session. Select a career to see where to study.
          </p>
        </div>

        <Card gap="gap-4" className="items-center">
          <div className="flex flex-col items-center rounded-button bg-navy px-5 py-3 text-center text-white">
            <b>You</b>
            <span className="text-sm text-cream">{snap.educationLevel ? LEVEL[snap.educationLevel] : "Where you are now"}</span>
          </div>
          <span aria-hidden="true" className="h-5 w-px bg-control" />
          {careers.length === 0 ? (
            <p className="m-0 text-center">No careers matched this session. Add more skills, modules or interests.</p>
          ) : (
            <ul aria-label="Careers that fit you" className="m-0 flex w-full list-none flex-wrap justify-center gap-3 p-0">
              {careers.map((m) => {
                const on = selected?.code === m.code;
                return (
                  <li key={m.code} className="flex-[1_1_160px] tablet:max-w-[220px]">
                    <Link
                      href={href({ session: current.id === sessions[0]!.id ? undefined : current.id, job: m.code })}
                      aria-current={on ? "true" : undefined}
                      className={cn("flex min-h-14 flex-col items-center justify-center rounded-button border-2 px-3 py-2 text-center no-underline", on ? "border-maroon bg-maroon text-white hover:text-white" : "border-navy bg-white text-navy hover:bg-cream hover:text-navy")}
                    >
                      <b className="leading-snug">{m.title}</b>
                      <span className={cn("text-sm", on ? "text-cream" : "text-muted")}>{m.fit} fit{m.code === profile.target ? " · your target" : ""}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <SoftPanel pad="p-4" gap="gap-1">
          <b className="text-navy">What this map is based on</b>
          <span className="text-[15px]">{basedOn}</span>
          <span className="text-sm text-muted">Jobs from MASCO 2020 (Ministry of Human Resources). Skills from ESCO. Matching follows fixed rules, with no AI.</span>
        </SoftPanel>
      </section>

      {selected ? (
        <Card as="aside" aria-labelledby="detail-h" className="min-w-0 desktop:w-[380px] desktop:shrink-0" gap="gap-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-0.5">
              <Kicker>{selected.code === profile.target ? "Career · your target job" : "Career"}</Kicker>
              <h2 id="detail-h" className="m-0 text-[22px]">{selected.title}</h2>
            </div>
            <Link href={href({ session: current.id === sessions[0]!.id ? undefined : current.id })} aria-label="Close" className="inline-flex size-11 shrink-0 items-center justify-center rounded-field text-2xl text-navy no-underline hover:bg-cream">×</Link>
          </div>
          {selected.reasons.length ? (
            <ul className="m-0 flex flex-col gap-1 pl-5 text-[15px]">
              {selected.reasons.slice(0, 3).map((r) => <li key={r.text}>{r.text}</li>)}
            </ul>
          ) : null}
          <div className="flex flex-col gap-2">
            <h3 className="m-0 font-sans text-base">Where to study</h3>
            {options.length === 0 ? (
              <p className="m-0 text-[15px] text-muted">No programmes are listed for this job yet.</p>
            ) : (
              <ul className="m-0 flex list-none flex-col gap-2 p-0">
                {options.map((o) => (
                  <li key={o.id} className="flex flex-col gap-1.5 rounded-button bg-cream p-3">
                    <b className="text-navy">{o.institution}</b>
                    <span className="text-[15px]">{o.programme}</span>
                    <SaveOptionButton optionId={o.id} saved={savedIds.includes(o.id)} programme={o.programme} />
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {selected.code === profile.target
              ? <ButtonLink href="/skill-gap">See my skill gap</ButtonLink>
              : <SetTargetButton code={selected.code} title={selected.title} />}
            <ButtonLink href="/book" variant="outline">Ask an adviser</ButtonLink>
          </div>
          <span className="text-sm text-muted">Programmes from the MQA register and each institution&apos;s programme page. Entry requirements change, so confirm with the institution.</span>
        </Card>
      ) : (
        <SoftPanel as="aside" className="min-w-0 desktop:w-[300px] desktop:shrink-0" gap="gap-1">
          <b className="text-navy">Pick a career on the map</b>
          <span className="text-[15px]">You&apos;ll see where to study and can make it your target job.</span>
        </SoftPanel>
      )}
    </main>
  );
}
