"use client";

import { useState } from "react";
import { analyseResume } from "@/features/resume/actions";
import type { ResumeReport } from "@/lib/resume-report";
import { ButtonLink, Card, HeroBand } from "@/components/ui";
import occupations from "@/content/reference/occupations.json";

export default function ResumeScanner() {
  const [code, setCode] = useState(occupations[0]!.code);
  const [text, setText] = useState("");
  const [description, setDescription] = useState("");
  const [resumeName, setResumeName] = useState("");
  const [descriptionName, setDescriptionName] = useState("");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [report, setReport] = useState<ResumeReport | null>(null);
  const role = occupations.find(item => item.code === code)!;
  const matched = report?.requirements.filter(item => item.evidence) ?? [];
  const missing = report?.requirements.filter(item => !item.evidence) ?? [];
  const coverage = report ? Math.round(100 * matched.length / report.requirements.length) : 0;
  function clearReport() { setReport(null); setError(""); }

  async function load(file: File, destination: "resume" | "description") {
    clearReport();
    setBusy("Reading file…");
    try {
      if (file.size > 10 * 1024 * 1024) throw Error("Choose a file smaller than 10 MiB.");
      let extracted: string;
      if (file.name.toLowerCase().endsWith(".pdf")) {
        const bytes = new Uint8Array(await file.arrayBuffer());
        if (!new TextDecoder().decode(bytes.slice(0, 5)).startsWith("%PDF-")) throw Error("Choose a valid PDF.");
        const { extractText } = await import("unpdf");
        extracted = (await extractText(bytes, {mergePages: false})).text.join(String.fromCharCode(10));
      } else if (file.name.toLowerCase().endsWith(".txt")) extracted = await file.text();
      else throw Error("Choose a text-based PDF or TXT file.");
      if (!extracted.trim()) throw Error("No readable text found. Paste the text or use a text-based PDF.");
      if (extracted.length > 12000) throw Error("This file exceeds 12,000 characters. Paste the relevant sections below.");
      if (destination === "resume") { setText(extracted); setResumeName(file.name); }
      else { setDescription(extracted); setDescriptionName(file.name); }
    } catch (e) { setError(e instanceof Error ? e.message : "Could not read this file. Paste its text below."); }
    finally { setBusy(""); }
  }

  async function scan() {
    clearReport();
    if (text.trim().length < 50) { setError("Add at least 50 characters of résumé text."); return; }
    if (!consent) { setError("Allow AI processing before starting the scan."); return; }
    setBusy("Comparing résumé evidence…");
    try {
      const result = await analyseResume({text, code, consent, jobDescription: description});
      if (result.ok) setReport(result.value);
      else setError(result.error.message);
    } catch { setError("The connection was interrupted. Your text is preserved. Try again."); }
    finally { setBusy(""); }
  }

  function download() {
    if (!report) return;
    const content = [role.title_en, "Requirement evidence coverage: " + coverage + "%", report.summary,
      ...report.requirements.map(item => item.requirement + String.fromCharCode(10) + (item.evidence || "No supporting quotation found.")),
      "Suggested improvements", ...report.suggestions, "Limitations", ...report.limitations].join(String.fromCharCode(10,10));
    const url = URL.createObjectURL(new Blob([content], {type: "text/plain;charset=utf-8"}));
    const anchor = document.createElement("a");
    anchor.href = url; anchor.download = "CareerPrep-resume-review.txt"; anchor.click();
    URL.revokeObjectURL(url);
  }

  const inputClass = "w-full rounded-button border border-control bg-white p-3";
  return <main id="main" className="mx-auto grid w-full max-w-[1280px] gap-6 px-4 pt-6 pb-24 tablet:px-8">
    <HeroBand gap="gap-3"><h1 className="text-3xl">Résumé scanner</h1><p>Compare your résumé with a job description and find evidence to strengthen your application.</p></HeroBand>
    <div className="grid items-start gap-5 tablet:grid-cols-2">
      <Card as="section"><h2 className="text-2xl">Your résumé</h2><p>Open a text-based PDF or TXT file, or paste your text.</p>
        <label>Résumé file<input className="block w-full py-2" disabled={!!busy} type="file" accept=".pdf,.txt" onChange={e=>{const f=e.target.files?.[0]; if(f) void load(f,"resume"); e.target.value="";}}/></label>
        {resumeName && <p className="text-sm text-muted">{resumeName}</p>}
        <label>Résumé text<textarea className={inputClass} rows={10} maxLength={12000} disabled={!!busy} value={text} onChange={e=>{setText(e.target.value);clearReport();}}/></label>
        <p className="text-sm text-muted">{text.length.toLocaleString()} / 12,000 characters</p>
      </Card>
      <Card as="section"><h2 className="text-2xl">What are you applying for?</h2>
        <label>Occupation<select className={inputClass} disabled={!!busy} value={code} onChange={e=>{setCode(e.target.value);clearReport();}}>{occupations.map(o=><option key={o.code} value={o.code}>{o.title_en}</option>)}</select></label>
        <label>Job description file (optional)<input className="block w-full py-2" disabled={!!busy} type="file" accept=".pdf,.txt" onChange={e=>{const f=e.target.files?.[0];if(f) void load(f,"description");e.target.value="";}}/></label>
        {descriptionName && <p className="text-sm text-muted">{descriptionName}</p>}
        <label>Job description (optional)<textarea className={inputClass} rows={7} maxLength={12000} disabled={!!busy} value={description} onChange={e=>{setDescription(e.target.value);clearReport();}}/></label>
        <p className="text-sm text-muted">Leave this empty to compare with the occupation’s essential skills.</p>
      </Card>
    </div>
    <Card as="section"><label><input type="checkbox" disabled={!!busy} checked={consent} onChange={e=>setConsent(e.target.checked)}/> Allow Google Gemini to process these texts for this review.</label>
      <p className="text-sm text-muted">Sign in to run AI analysis. Your uploaded files are read in your browser. The extracted texts are sent for analysis when you scan.</p>
      <div className="flex flex-wrap gap-3"><button className="min-h-12 rounded-button bg-maroon px-6 font-bold text-white disabled:opacity-50" disabled={!!busy} onClick={()=>void scan()}>{busy || "Scan résumé"}</button><ButtonLink href="/sign-in" variant="outline">Sign in</ButtonLink></div>
      {busy && <p role="status">{busy}</p>}{error && <p role="alert">{error}</p>}
    </Card>
    {report && <section aria-label="Résumé analysis" className="grid gap-5">
      <Card><h2 className="text-2xl">Your résumé review</h2><strong className="text-3xl">{coverage}% requirement evidence coverage</strong><p>{matched.length} of {report.requirements.length} assessed requirements have a supporting résumé quotation.</p><p>{report.summary}</p><button className="min-h-11 self-start font-semibold underline" onClick={download}>Download review</button></Card>
      <div className="grid items-start gap-5 tablet:grid-cols-2">
        <Card><h3 className="text-xl">Matched requirements</h3>{!matched.length && <p>No supporting quotations were found.</p>}{matched.map(item=><div key={item.requirement}><h4 className="font-bold">{item.requirement}</h4><blockquote className="mt-2 border-l border-control pl-3">{item.evidence}</blockquote></div>)}</Card>
        <Card><h3 className="text-xl">Gaps in your résumé</h3>{!missing.length && <p>Each assessed requirement has a supporting quotation.</p>}{missing.map(item=><p key={item.requirement}>{item.requirement}</p>)}<p className="text-sm text-muted">Add evidence where you have relevant experience.</p></Card>
      </div>
      <Card><h3 className="text-xl">Suggested improvements</h3><ul className="list-disc pl-5">{report.suggestions.map(item=><li key={item}>{item}</li>)}</ul>{report.limitations.length>0 && <><h3 className="text-xl">Limitations</h3>{report.limitations.map(item=><p key={item}>{item}</p>)}</>}</Card>
    </section>}
  </main>;
}
