"use client";
// "Tell us about yourself" (mockup board NewSession). Matches update as the student types (A1, no AI);
// typed skills are mapped to listed skills only after the student picks a suggestion (A8).
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { EducationLevel, MatchView, Project } from "@/lib/types";
import type { AboutYouData } from "./load";
import { rankMatches, saveSession, setTarget, suggestSkills } from "./actions";
import { Chip, FieldError, Section, inputClass, primaryButton, secondaryButton } from "./ui";

const LEVELS: [EducationLevel, string][] = [
  ["spm", "Just finished SPM"],
  ["pre_university", "STPM, matriculation or foundation"],
  ["diploma", "Diploma"],
  ["degree", "Degree"],
];

type ProjectDraft = { name: string; description: string; link: string };
type ProjectErrors = Partial<Record<keyof ProjectDraft, string>>;

function checkProject(d: ProjectDraft): { project?: Project; errors: ProjectErrors } {
  const errors: ProjectErrors = {};
  const name = d.name.trim();
  if (!name) errors.name = "Enter the project's name";
  else if (name.length > 120) errors.name = "Use 120 characters or fewer";
  if (d.description.length > 1000) errors.description = "Use 1,000 characters or fewer";
  let link = d.link.trim();
  if (link && !/^https?:\/\//i.test(link)) link = `https://${link}`;
  if (link.startsWith("http://")) errors.link = "Use an https:// link";
  else if (link) {
    try { new URL(link); } catch { errors.link = "Enter a link like https://github.com/your-name/project"; }
  }
  if (Object.keys(errors).length) return { errors };
  return { errors, project: { name, description: d.description.trim() || undefined, link: link || undefined } };
}

export function AboutYouForm({ data }: { data: AboutYouData }) {
  const router = useRouter();
  const { options } = data;
  const skillLabel = new Map(options.skills.map((s) => [s.uri, s.label]));

  const [basis, setBasis] = useState<"interest" | "none">(data.form.interests.length || !data.form.educationLevel ? "interest" : "none");
  const [interests, setInterests] = useState(data.form.interests);
  const [interestDraft, setInterestDraft] = useState("");
  const [jobInMind, setJobInMind] = useState(data.form.jobInMind ?? "");
  const [level, setLevel] = useState<EducationLevel | undefined>(data.form.educationLevel);
  const [grades, setGrades] = useState<Record<string, string>>(Object.fromEntries(data.form.spmGrades.map((g) => [g.subject, g.grade])));
  const [moduleIds, setModuleIds] = useState(data.form.moduleIds);
  const [skills, setSkills] = useState(data.form.skills);
  const [skillDraft, setSkillDraft] = useState("");
  const [skillHelp, setSkillHelp] = useState<{ text: string; picks: { uri: string; label: string }[] } | null>(null);
  const [projects, setProjects] = useState<Project[]>(data.form.projects);
  const [draft, setDraft] = useState<ProjectDraft>({ name: "", description: "", link: "" });
  const [draftErrors, setDraftErrors] = useState<ProjectErrors>({});
  const [matches, setMatches] = useState<MatchView[]>(data.matches);
  const [rankError, setRankError] = useState("");
  const [target, setTargetState] = useState(data.target);
  const [status, setStatus] = useState("");
  const [saveError, setSaveError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const payload = {
    educationLevel: level,
    spmGrades: Object.entries(grades).filter(([, g]) => g).map(([subject, grade]) => ({ subject, grade })),
    moduleIds,
    skills,
    interests: basis === "interest" ? interests : [],
    projects,
    jobInMind: jobInMind || undefined,
  };
  const key = JSON.stringify(payload);

  // Live ranking: 300 ms after the last change; answers to older requests are ignored.
  const request = useRef(0);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    const n = ++request.current;
    const t = setTimeout(async () => {
      const r = await rankMatches(JSON.parse(key));
      if (n !== request.current) return;
      if (r.ok) { setMatches(r.value); setRankError(""); }
      else setRankError(`We could not update your matches. ${r.error.message}`);
    }, 300);
    return () => clearTimeout(t);
  }, [key]);

  const addInterest = () => {
    if (interestDraft && !interests.includes(interestDraft)) setInterests([...interests, interestDraft]);
    setInterestDraft("");
  };

  const addSkillUri = (uri: string) => {
    if (!skills.includes(uri)) setSkills([...skills, uri]);
    setSkillDraft("");
    setSkillHelp(null);
  };

  const addTypedSkill = async () => {
    const text = skillDraft.trim();
    if (text.length < 2) { setSkillHelp({ text: "Type at least 2 letters, for example Python.", picks: [] }); return; }
    const exact = options.skills.find((s) => s.label.toLowerCase() === text.toLowerCase());
    if (exact) { addSkillUri(exact.uri); return; }
    const r = await suggestSkills({ text });
    if (!r.ok) { setSkillHelp({ text: r.error.message, picks: [] }); return; }
    const picks = r.value.filter((s) => !skills.includes(s.uri));
    setSkillHelp(picks.length
      ? { text: `Pick the skill you mean by "${text}":`, picks }
      : { text: `We could not find a listed skill like "${text}". Try a shorter name, such as Python or Excel.`, picks: [] });
  };

  const addProject = () => {
    const { project, errors } = checkProject(draft);
    setDraftErrors(errors);
    if (!project) return;
    if (projects.length >= 10) { setDraftErrors({ name: "You can add up to 10 projects" }); return; }
    setProjects([...projects, project]);
    setDraft({ name: "", description: "", link: "" });
  };

  const pickTarget = async (m: MatchView) => {
    const r = await setTarget({ code: m.code });
    if (r.ok) { setTargetState(r.value); setStatus(`${r.value.title} is now your target job. Your skill gap and lessons follow it.`); }
    else setStatus(r.error.message);
  };

  const save = async () => {
    setSaving(true);
    setSaveError("");
    const r = await saveSession(payload);
    setSaving(false);
    if (r.ok) { router.push("/map"); return; }
    setFieldErrors(r.error.fields ?? {});
    setSaveError(r.error.code === "UNEXPECTED" ? `${r.error.message} (Reference ${r.error.ref})` : r.error.message);
  };

  const top = matches[0];
  const summaryLine = !top
    ? "Add a few details and your best-fitting jobs will appear here."
    : target?.code === top.code
      ? `Based on what you added, your closest job is ${top.title}, which is already your target job. Saving keeps your plan as it is.`
      : target
        ? `Based on what you added, your closest job is ${top.title}. Your target job is still ${target.title}. Set a new one above if you want to change your plan.`
        : `Based on what you added, your closest job is ${top.title}. Set a target job to build your plan around it.`;

  return (
    <div className="grid gap-6 desktop:grid-cols-[380px_minmax(0,1fr)] desktop:items-start">
      <form className="flex flex-col gap-4" onSubmit={(e) => e.preventDefault()} aria-label="Your details">
        <fieldset className="m-0 flex flex-col gap-3 rounded-card border-0 bg-cream p-5">
          <legend className="float-left mb-1 font-display font-bold text-navy">Match me based on</legend>
          {([["interest", "My interests, education and skills"], ["none", "No specific interest yet"]] as const).map(([v, label]) => (
            <label key={v} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-control bg-white px-4">
              <input type="radio" name="basis" value={v} checked={basis === v} onChange={() => setBasis(v)} className="size-5 accent-maroon" />
              {label}
            </label>
          ))}
        </fieldset>

        {basis === "interest" && (
          <Section step={1} title="Interests" id="sec-interests">
            <div className="flex flex-col gap-2">
              <label htmlFor="interest" className="font-semibold text-navy">Choose what you enjoy</label>
              <div className="flex gap-2">
                <select id="interest" className={inputClass} value={interestDraft} onChange={(e) => setInterestDraft(e.target.value)}>
                  <option value="">Select an interest</option>
                  {options.interests.filter((i) => !interests.includes(i)).map((i) => <option key={i} value={i}>{i}</option>)}
                </select>
                <button type="button" className={secondaryButton} onClick={addInterest}>Add</button>
              </div>
              {interests.length > 0 && (
                <ul className="m-0 flex list-none flex-wrap gap-2 p-0" aria-label="Your interests">
                  {interests.map((i) => <li key={i}><Chip label={i} onRemove={() => setInterests(interests.filter((x) => x !== i))} /></li>)}
                </ul>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="job-in-mind" className="font-semibold text-navy">A job you have in mind <span className="font-normal text-muted">(optional)</span></label>
              <select id="job-in-mind" className={inputClass} value={jobInMind} onChange={(e) => setJobInMind(e.target.value)} aria-describedby="job-in-mind-error">
                <option value="">No job in mind</option>
                {options.occupations.map((o) => <option key={o.code} value={o.code}>{o.title}</option>)}
              </select>
              <FieldError id="job-in-mind-error" message={fieldErrors.jobInMind} />
            </div>
          </Section>
        )}

        <Section step={basis === "interest" ? 2 : 1} title="Education" id="sec-education">
          <fieldset className="m-0 flex flex-col gap-2 border-0 p-0" aria-describedby="level-error">
            <legend className="mb-2 font-semibold text-navy">Where are you now?</legend>
            <div className="grid grid-cols-1 gap-2 tablet:grid-cols-2">
              {LEVELS.map(([v, label]) => (
                <label key={v} className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-control border-2 px-3 py-2 ${level === v ? "border-maroon" : "border-hairline"}`}>
                  <input type="radio" name="level" value={v} checked={level === v} onChange={() => setLevel(v)} className="size-5 shrink-0 accent-maroon" />
                  {label}
                </label>
              ))}
            </div>
            <FieldError id="level-error" message={fieldErrors.educationLevel} />
          </fieldset>

          <details className="rounded-control border border-hairline p-3" open={data.form.spmGrades.length > 0 || level === "spm"}>
            <summary className="min-h-11 cursor-pointer content-center font-semibold text-navy">SPM results <span className="font-normal text-muted">(optional)</span></summary>
            <p className="mt-2 text-sm text-muted">A grade of C or better counts towards a subject&apos;s skills.</p>
            <div className="flex flex-col">
              {options.spmSubjects.map((subject, i) => (
                <div key={subject} className={`flex items-center justify-between gap-3 py-2 ${i ? "border-t border-hairline" : ""}`}>
                  <label htmlFor={`grade-${i}`} className="text-ink">{subject}</label>
                  <select id={`grade-${i}`} className="min-h-11 w-28 rounded-control border border-control bg-white px-2" value={grades[subject] ?? ""}
                    onChange={(e) => setGrades({ ...grades, [subject]: e.target.value })}>
                    <option value="">Not taken</option>
                    {options.grades.map((g) => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
              ))}
            </div>
          </details>

          {(level === "diploma" || level === "degree") && options.modules.length > 0 && (
            <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
              <legend className="mb-2 font-semibold text-navy">Modules you&apos;ve passed <span className="font-normal text-muted">({options.modules[0]!.programme})</span></legend>
              <div className="flex flex-wrap gap-2">
                {options.modules.map((m) => {
                  const on = moduleIds.includes(m.id);
                  return (
                    <button key={m.id} type="button" aria-pressed={on}
                      onClick={() => setModuleIds(on ? moduleIds.filter((x) => x !== m.id) : [...moduleIds, m.id])}
                      className={`inline-flex min-h-11 items-center gap-1 rounded-full border px-4 text-left text-sm font-semibold ${on ? "border-navy bg-navy text-white" : "border-control bg-white text-navy"}`}>
                      <span aria-hidden>{on ? "✓" : "+"}</span> {m.title}
                    </button>
                  );
                })}
              </div>
              <FieldError id="modules-error" message={fieldErrors.moduleIds} />
            </fieldset>
          )}
        </Section>

        <Section step={basis === "interest" ? 3 : 2} title="Current skills" id="sec-skills">
          <div className="flex flex-col gap-2">
            <label htmlFor="skill" className="font-semibold text-navy">What can you already do?</label>
            <div className="flex gap-2">
              <input id="skill" className={inputClass} placeholder="e.g. Python" value={skillDraft} maxLength={80}
                aria-describedby="skill-help"
                onChange={(e) => setSkillDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void addTypedSkill(); } }} />
              <button type="button" className={secondaryButton} onClick={() => void addTypedSkill()}>Add</button>
            </div>
            <div id="skill-help" aria-live="polite">
              {skillHelp && (
                <div className="flex flex-col gap-2 rounded-control bg-cream p-3">
                  <p className="m-0 text-sm text-ink">{skillHelp.text}</p>
                  {skillHelp.picks.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {skillHelp.picks.map((p) => (
                        <button key={p.uri} type="button" className={secondaryButton} onClick={() => addSkillUri(p.uri)}>Add {p.label}</button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            <FieldError id="skills-error" message={fieldErrors.skills} />
            {skills.length > 0 && (
              <ul className="m-0 flex list-none flex-wrap gap-2 p-0" aria-label="Your skills">
                {skills.map((uri) => (
                  <li key={uri}><Chip tone="navy" label={skillLabel.get(uri) ?? uri} onRemove={() => setSkills(skills.filter((x) => x !== uri))} /></li>
                ))}
              </ul>
            )}
            {options.quickAdd.some((q) => !skills.includes(q.uri)) && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-muted">Quick add:</span>
                {options.quickAdd.filter((q) => !skills.includes(q.uri)).slice(0, 6).map((q) => (
                  <button key={q.uri} type="button" onClick={() => addSkillUri(q.uri)}
                    className="inline-flex min-h-11 items-center rounded-full border border-dashed border-control px-3 text-sm text-navy">
                    + {q.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </Section>

        <Section step={basis === "interest" ? 4 : 3} title="Side projects" optional id="sec-projects">
          {projects.length > 0 && (
            <ul className="m-0 flex list-none flex-col gap-2 p-0" aria-label="Your projects">
              {projects.map((p, i) => (
                <li key={`${p.name}-${i}`} className="flex items-start justify-between gap-2 rounded-control bg-cream p-3">
                  <div className="min-w-0">
                    <p className="m-0 font-semibold text-navy">{p.name}</p>
                    {p.description && <p className="m-0 text-sm text-ink">{p.description}</p>}
                    {p.link && <a href={p.link} className="break-all text-sm" target="_blank" rel="noreferrer">{p.link.replace(/^https:\/\//, "")}</a>}
                  </div>
                  <button type="button" aria-label={`Remove ${p.name}`} onClick={() => setProjects(projects.filter((_, j) => j !== i))}
                    className="inline-flex size-11 shrink-0 items-center justify-center rounded-full text-maroon"><span aria-hidden>×</span></button>
                </li>
              ))}
            </ul>
          )}
          <div className="flex flex-col gap-2">
            <label htmlFor="proj-name" className="font-semibold text-navy">Project name</label>
            <input id="proj-name" className={inputClass} placeholder="e.g. Attendance app for my club" value={draft.name} aria-describedby="proj-name-error"
              aria-invalid={!!draftErrors.name} onChange={(e) => { setDraft({ ...draft, name: e.target.value }); setDraftErrors({ ...draftErrors, name: undefined }); }} />
            <FieldError id="proj-name-error" message={draftErrors.name} />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="proj-desc" className="font-semibold text-navy">What it does and what you used</label>
            <textarea id="proj-desc" rows={3} className={`${inputClass} py-2`} placeholder="e.g. Flutter app with a Firebase database" value={draft.description}
              aria-describedby="proj-desc-error" onChange={(e) => { setDraft({ ...draft, description: e.target.value }); setDraftErrors({ ...draftErrors, description: undefined }); }} />
            <FieldError id="proj-desc-error" message={draftErrors.description} />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="proj-link" className="font-semibold text-navy">Project link</label>
            <input id="proj-link" className={inputClass} inputMode="url" placeholder="https://github.com/your-name/project" value={draft.link}
              aria-describedby="proj-link-hint proj-link-error" aria-invalid={!!draftErrors.link}
              onBlur={() => { if (draft.link.trim()) setDraftErrors({ ...draftErrors, link: checkProject({ ...draft, name: draft.name || "x" }).errors.link }); }}
              onChange={(e) => { setDraft({ ...draft, link: e.target.value }); setDraftErrors({ ...draftErrors, link: undefined }); }} />
            <p id="proj-link-hint" className="m-0 text-sm text-muted">GitHub, a live site, a video demo or a Google Drive folder</p>
            <FieldError id="proj-link-error" message={draftErrors.link} />
          </div>
          <button type="button" className={`${secondaryButton} self-start`} onClick={addProject}>+ Add project</button>
        </Section>
      </form>

      <div className="flex flex-col gap-4">
        <section aria-labelledby="matches-title" className="on-navy flex flex-col gap-3 rounded-card bg-navy p-6 text-white">
          <h2 id="matches-title" className="m-0 text-xl text-white">Jobs that match what you added</h2>
          <p className="m-0 text-sm">Fit counts how many of the job&apos;s listed skills you already show, using fixed rules with no AI. It updates as you add details.</p>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="m-0 inline-flex min-h-9 items-center rounded-full bg-cream px-3 text-sm font-semibold text-navy" aria-live="polite">
              {matches.length === 1 ? "1 match" : `${matches.length} matches`}
            </p>
            <button type="button" disabled={saving} onClick={save} className="font-semibold text-white underline">Save and see these jobs on the career map</button>
          </div>
        </section>

        {rankError && <p role="alert" className="m-0 rounded-control border border-maroon bg-white p-3 text-maroon">{rankError}</p>}
        <p aria-live="polite" className="m-0 empty:hidden rounded-control bg-cream p-3 text-ink">{status}</p>

        {matches.length === 0 ? (
          <div className="rounded-card border border-hairline p-6">
            <p className="m-0 font-semibold text-navy">No matches yet</p>
            <p className="m-0 text-ink">Add an interest, a skill you have or a module you passed, and matching jobs appear here.</p>
          </div>
        ) : (
          <ol className="m-0 flex list-none flex-col gap-3 p-0">
            {matches.map((m, i) => <MatchCard key={m.code} m={m} rank={i + 1} isTarget={target?.code === m.code} onTarget={() => void pickTarget(m)} />)}
          </ol>
        )}

        <section aria-labelledby="summary-title" className="flex flex-col gap-4 rounded-card bg-cream p-6">
          <h2 id="summary-title" className="m-0 text-xl">Summary</h2>
          <dl className="m-0 grid grid-cols-2 gap-2 desktop:grid-cols-4">
            {[
              ["Interests", basis === "interest" ? (interests.length ? `${interests.length} added` : "None yet") : "No specific interest"],
              ["Education", level ? LEVELS.find(([v]) => v === level)![1] : "Not chosen"],
              ["Skills", skills.length ? `${skills.length} added` : "None yet"],
              ["Projects", projects.length ? `${projects.length} added` : "None yet"],
            ].map(([k, v]) => (
              <div key={k} className="rounded-control bg-white p-3">
                <dt className="text-sm text-muted">{k}</dt>
                <dd className="m-0 font-semibold text-navy">{v}</dd>
              </div>
            ))}
          </dl>
          <p className="m-0 text-ink">{summaryLine}</p>
          {saveError && <p role="alert" className="m-0 font-semibold text-maroon">{saveError}</p>}
          <div className="flex flex-wrap items-center gap-4">
            <button type="button" className={primaryButton} onClick={() => void save()} disabled={saving} aria-busy={saving}>
              {saving ? "Saving…" : "Save and open career map"}
            </button>
            <Link href="/dashboard" className="inline-flex min-h-11 items-center font-semibold text-navy">Cancel</Link>
          </div>
        </section>
      </div>
    </div>
  );
}

function MatchCard({ m, rank, isTarget, onTarget }: { m: MatchView; rank: number; isTarget: boolean; onTarget: () => void }) {
  const why = m.reasons.map((r) => r.text.charAt(0).toLowerCase() + r.text.slice(1));
  const pct = Math.round(m.coverage * 100);
  return (
    <li className={`flex flex-col gap-3 rounded-card border bg-white p-5 ${rank === 1 ? "border-maroon" : "border-hairline"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span aria-hidden className={`inline-flex size-9 shrink-0 items-center justify-center rounded-control font-bold ${rank === 1 ? "bg-maroon text-white" : "bg-cream text-navy"}`}>{rank}</span>
          <div>
            <h3 className="m-0 text-lg"><span className="sr-only">{rank}. </span>{m.title}</h3>
            <p className="m-0 text-sm text-muted">MASCO {m.code}</p>
          </div>
        </div>
        <span className={`shrink-0 rounded-full px-3 py-1 text-sm font-semibold ${m.fit === "Strong" ? "bg-navy text-white" : "bg-cream text-navy"}`}>{m.fit} fit</span>
      </div>
      <div className="flex flex-col gap-1">
        <div className="h-2 overflow-hidden rounded-full bg-hairline" aria-hidden>
          <div className={`h-full rounded-full ${rank === 1 ? "bg-maroon" : "bg-navy"}`} style={{ width: `${Math.max(4, pct)}%` }} />
        </div>
        <p className="m-0 text-sm text-muted">You show {pct}% of this job&apos;s listed skills.</p>
      </div>
      {why.length > 0 && (
        <p className="m-0 text-ink"><strong className="text-navy">Why:</strong> {why.join("; ")}.</p>
      )}
      <div className="flex flex-wrap items-center gap-2">
        {isTarget ? (
          <>
            <span className="inline-flex min-h-11 items-center gap-1 px-1 font-semibold text-navy"><span aria-hidden>✓</span> Your target job</span>
            <Link href="/skill-gap" className={`${secondaryButton} no-underline`}>See skill gap</Link>
          </>
        ) : (
          <button type="button" className={secondaryButton} onClick={onTarget}>Set as my target job</button>
        )}
      </div>
    </li>
  );
}
