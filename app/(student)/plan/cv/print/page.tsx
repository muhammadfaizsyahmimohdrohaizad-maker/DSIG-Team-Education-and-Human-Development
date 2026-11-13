import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@/server/data/supabase";
import { loadCv } from "@/features/cv/build";
import { PrintButton } from "@/features/cv/print-button";
import type { EducationLevel } from "@/lib/types";

export const metadata: Metadata = { title: "Print your CV" };

const LEVEL: Record<EducationLevel, string> = { spm: "SPM", pre_university: "Pre-university", diploma: "Diploma", degree: "Degree" };

// A4 print view of the CV (exportCvPdf points here). Only skills with evidence, passed modules and projects.
export default async function Page() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");
  const cv = await loadCv(user.id);
  if (!cv) redirect("/dashboard");

  return (
    <main id="main" className="mx-auto flex w-full max-w-[794px] flex-col gap-6 px-4 pb-24 pt-5 tablet:px-6 print:max-w-none print:p-0">
      <style>{"@media print { @page { size: A4; margin: 18mm; } header:not(.cv-head), nav, .no-print { display: none !important; } }"}</style>
      <div className="no-print flex flex-wrap items-center justify-between gap-3 rounded-card border border-hairline bg-cream p-4">
        <p className="m-0 text-ink">Choose <strong>Save as PDF</strong> in the print window to download this CV.</p>
        <div className="flex flex-wrap gap-2">
          <Link href="/plan/cv" className="inline-flex min-h-11 items-center rounded-button border border-control px-5 font-semibold text-navy no-underline">Back to your CV</Link>
          <PrintButton />
        </div>
      </div>

      <article className="flex flex-col gap-5 text-ink">
        <header className="cv-head border-b border-hairline pb-3">
          <h1 className="m-0 text-[28px] leading-tight">{cv.name}</h1>
          <p className="m-0 text-muted">
            {[cv.educationLevel && LEVEL[cv.educationLevel], cv.target && `Working towards: ${cv.target}`].filter(Boolean).join(" · ")}
          </p>
        </header>

        <section aria-labelledby="cv-skills">
          <h2 id="cv-skills" className="mb-2 text-xl">Skills</h2>
          {cv.skills.length ? (
            <ul className="m-0 flex list-disc flex-col gap-1 pl-5">
              {cv.skills.map((s) => <li key={s.uri}>{s.label}</li>)}
            </ul>
          ) : (
            <p className="m-0 text-muted">No skills yet. Add your skills, modules and projects in Tell us about yourself.</p>
          )}
        </section>

        {cv.modules.length > 0 && (
          <section aria-labelledby="cv-modules">
            <h2 id="cv-modules" className="mb-2 text-xl">Modules passed</h2>
            <ul className="m-0 flex list-disc flex-col gap-1 pl-5">{cv.modules.map((m) => <li key={m}>{m}</li>)}</ul>
          </section>
        )}

        {cv.projects.length > 0 && (
          <section aria-labelledby="cv-projects">
            <h2 id="cv-projects" className="mb-2 text-xl">Projects</h2>
            <ul className="m-0 flex flex-col gap-3 pl-0">
              {cv.projects.map((p) => (
                <li key={p.name} className="list-none">
                  <strong className="text-navy">{p.name}</strong>
                  {p.description && <span>. {p.description}</span>}
                  {p.link && <span className="block break-all text-muted">{p.link}</span>}
                </li>
              ))}
            </ul>
          </section>
        )}
      </article>
    </main>
  );
}
