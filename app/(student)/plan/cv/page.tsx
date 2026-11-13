import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ButtonLink, Card, Kicker, SoftPanel, StatusTag } from "@/components/ui";
import { loadCv } from "@/features/cv/build";
import type { EducationLevel } from "@/lib/types";
import { currentUser } from "@/server/data/supabase";

export const metadata: Metadata = { title: "Your résumé" };

const mainClasses = "mx-auto flex w-full max-w-[1280px] flex-1 flex-col gap-6 px-4 pb-16 pt-5 tablet:px-6 tablet:pt-8";
const pageTitle = "m-0 text-[clamp(1.75rem,3vw,2.25rem)] leading-[1.15] tracking-[-0.02em]";
const LEVEL: Record<EducationLevel, string> = { spm: "SPM", pre_university: "STPM, matriculation or foundation", diploma: "Diploma", degree: "Degree" };

function Tip({ children }: { children: React.ReactNode }) {
  return <p className="m-0 rounded-field bg-cream px-3.5 py-2.5 text-[15px]"><b className="text-navy">Tip:</b> {children}</p>;
}

// Résumé builder board ("Build" step). The résumé is built only from what the student confirmed in CareerPrep;
// they edit the source in "Tell us about yourself", then export a PDF from the print page.
// The "Review it against a job" step is not built: it needs a review service the backend doesn't have yet.
export default async function CvPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");
  const cv = await loadCv(user.id);
  if (!cv) redirect("/dashboard");

  return (
    <main id="main" className={mainClasses}>
      <div className="flex flex-col gap-1.5">
        <Link href="/plan" className="inline-flex min-h-11 items-center self-start font-semibold">Back to my plan</Link>
        <Kicker>Practice · Résumé</Kicker>
        <h1 className={pageTitle}>Your résumé</h1>
        <p className="m-0 max-w-[48rem]">Built from what you&apos;ve confirmed in CareerPrep. Check each part, then export a PDF.</p>
      </div>

      <div className="flex flex-wrap items-start gap-6">
        <div className="flex min-w-0 flex-[999_1_560px] flex-col gap-4">
          <Card as="section" aria-labelledby="ed-h" gap="gap-3">
            <h2 id="ed-h" className="m-0 text-[22px]">Education</h2>
            <Tip>newest first. Give the programme, institution and years.</Tip>
            <p className="m-0">{cv.educationLevel ? <b className="text-navy">{LEVEL[cv.educationLevel]}</b> : "Not added yet."}</p>
            {cv.modules.length ? (
              <div className="flex flex-col gap-1">
                <span className="text-sm text-muted">Modules passed</span>
                <ul className="m-0 flex flex-col gap-0.5 pl-5">{cv.modules.map((m) => <li key={m}>{m}</li>)}</ul>
              </div>
            ) : null}
            <Link href="/about-you" className="inline-flex min-h-11 items-center self-start font-semibold">Edit in Tell us about yourself</Link>
          </Card>

          <Card as="section" aria-labelledby="pr-h" gap="gap-3">
            <h2 id="pr-h" className="m-0 text-[22px]">Projects</h2>
            <Tip>start each line with what you did, then the tool and the result.</Tip>
            {cv.projects.length ? (
              <ul className="m-0 flex list-none flex-col gap-3 p-0">
                {cv.projects.map((p) => (
                  <li key={p.name} className="flex flex-col gap-0.5">
                    <b className="text-navy">{p.name}</b>
                    {p.description ? <span>{p.description}</span> : null}
                    {p.link ? <span className="break-all text-sm text-muted">{p.link}</span> : null}
                  </li>
                ))}
              </ul>
            ) : <p className="m-0 text-muted">No projects yet.</p>}
            <Link href="/about-you" className="inline-flex min-h-11 items-center self-start font-semibold">Add or edit projects</Link>
          </Card>

          <Card as="section" aria-labelledby="sk-h" gap="gap-3">
            <h2 id="sk-h" className="m-0 text-[22px]">Skills</h2>
            <Tip>the skills your target job asks for come first. Only skills with evidence go on.</Tip>
            {cv.skills.length ? (
              <ul className="m-0 flex list-none flex-col p-0">
                {cv.skills.map((s, i) => (
                  <li key={s.uri} className={`flex flex-wrap items-center justify-between gap-2 py-2.5 ${i > 0 ? "border-t border-hairline" : ""}`}>
                    <span className="flex flex-col">
                      <b className="text-navy">{s.label}</b>
                      <span className="text-sm text-muted">{s.evidence}</span>
                    </span>
                    {s.forTarget ? <StatusTag kind="have" label="Target job skill" /> : null}
                  </li>
                ))}
              </ul>
            ) : <p className="m-0 text-muted">No skills with evidence yet. Add your skills and modules in Tell us about yourself.</p>}
            <Link href="/skill-gap" className="inline-flex min-h-11 items-center self-start font-semibold">See the skills you&apos;re still building</Link>
          </Card>
        </div>

        <aside aria-labelledby="pv-h" className="flex min-w-0 flex-[1_1_340px] flex-col gap-4 desktop:sticky desktop:top-4">
          <h2 id="pv-h" className="m-0 text-[22px]">Preview</h2>
          <article className="flex flex-col gap-2 rounded-card border border-hairline bg-white p-5 text-[15px]">
            <p className="m-0 font-display text-xl font-bold text-navy">{cv.name}</p>
            {cv.target ? <p className="m-0 text-muted">Working towards: {cv.target}</p> : null}
            {cv.educationLevel ? <><p className="m-0 mt-2 text-xs font-bold uppercase tracking-[0.08em] text-maroon">Education</p><p className="m-0">{LEVEL[cv.educationLevel]}</p></> : null}
            {cv.projects.length ? <><p className="m-0 mt-2 text-xs font-bold uppercase tracking-[0.08em] text-maroon">Projects</p><p className="m-0">{cv.projects.map((p) => p.name).join(" · ")}</p></> : null}
            {cv.skills.length ? <><p className="m-0 mt-2 text-xs font-bold uppercase tracking-[0.08em] text-maroon">Skills</p><p className="m-0">{cv.skills.map((s) => s.label).join(" · ")}</p></> : null}
          </article>
          <SoftPanel gap="gap-2">
            <b className="text-navy">Before you export</b>
            <ul className="m-0 flex flex-col gap-1 pl-5 text-[15px]">
              <li>Every line is true, and in your own words.</li>
              <li>Your name and projects are spelt correctly.</li>
              <li>The skills your target job asks for come first.</li>
            </ul>
            <ButtonLink href="/plan/cv/print" className="mt-1">Export as PDF</ButtonLink>
          </SoftPanel>
          <p className="m-0 text-sm text-muted">No AI writes your résumé. It only uses what you added in CareerPrep.</p>
          <ButtonLink href="/book" variant="outline">Ask an adviser to check it</ButtonLink>
        </aside>
      </div>
    </main>
  );
}
