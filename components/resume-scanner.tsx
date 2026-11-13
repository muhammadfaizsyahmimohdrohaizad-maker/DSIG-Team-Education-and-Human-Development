"use client";

import { analyseResume } from "@/features/resume/actions";
import { useState } from "react";
import { WorkspacePage, Panel } from "@/components/workspace-page";
import occupations from "@/content/reference/occupations.json";
import skills from "@/content/reference/skills.json";

const catalogue = new Map(skills.map(skill => [skill.key, skill]));

export default function ResumeScanner() {
  const [ai, setAi] = useState("");
  const [analysing, setAnalysing] = useState(false);
  const [consent, setConsent] = useState(false);
  const [aiError, setAiError] = useState("");
  const [code, setCode] = useState(occupations[0]!.code);
  const [text, setText] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [reading, setReading] = useState(false);
  const [error, setError] = useState("");
  const role = occupations.find(item => item.code === code)!;
  const lines = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  const results = (submitted ? role.essential_skills : []).map(key => {
    const skill = catalogue.get(key);
    const label = skill?.label_en ?? key;
    const terms = [label, ...(skill?.alt_labels ?? [])];
    const evidence = lines.find(line => terms.some(term => {
      const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      return new RegExp("(^|[^a-z0-9+#])" + escaped + "($|[^a-z0-9+#])", "i").test(line);
    }));
    return { key, label, evidence };
  });
  async function review() {
    setAnalysing(true);
    setAi("");
    setAiError("");
    try {
      const result = await analyseResume({text, code, consent});
      if (result.ok) setAi(result.value);
      else setAiError(result.error.message);
    } catch {
      setAiError("The request was interrupted. Your résumé is preserved. Try again.");
    } finally {setAnalysing(false);}
  }
  async function load(file: File) {
    setAi("");
    setAiError("");
    setSubmitted(false);
    setError("");
    setReading(true);
    try {
      if (file.size > 10 * 1024 * 1024) throw Error("Choose a file smaller than 10 MiB.");
      let extracted: string;
      if (file.name.toLowerCase().endsWith(".pdf")) {
        const bytes = new Uint8Array(await file.arrayBuffer());
        if (!new TextDecoder().decode(bytes.slice(0, 5)).startsWith("%PDF-")) throw Error("Choose a valid PDF.");
        const {extractText} = await import("unpdf");
        const result = await extractText(bytes, {mergePages:false});
        extracted = result.text.join("\n");
      } else if (file.name.toLowerCase().endsWith(".txt")) extracted = await file.text();
      else throw Error("Choose a PDF or plain-text file.");
      if (!extracted.trim()) throw Error("No readable text was found. Paste the résumé text below.");
      if (extracted.length > 60000) throw Error("Paste up to 60,000 characters for this scan.");
      setText(extracted);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not read the file. Paste your résumé below.");
    } finally {setReading(false);}
  }
  return <WorkspacePage title="Résumé scanner">
    <Panel><label>Compare with occupation <select disabled={analysing || reading} value={code} onChange={e=>{setCode(e.target.value);setSubmitted(false);setAi("");setAiError("");}}>{occupations.map(o=><option key={o.code} value={o.code}>{o.title_en}</option>)}</select></label>
      <label>Open a text-based PDF or TXT file <input disabled={reading || analysing} type="file" accept=".pdf,.txt" onChange={e=>{const file=e.target.files?.[0];if(file)void load(file);e.target.value="";}} /></label>
      <label className="w-full">Review or paste résumé text<textarea className="w-full rounded-button border border-control p-3" rows={9} maxLength={60000} disabled={reading || analysing} value={text} onChange={e=>{setText(e.target.value);setSubmitted(false);setError("");setAi("");setAiError("");}}/></label>
      <p>File text is read in your browser. An AI review sends the text to Hugging Face inference providers after you give permission.</p>{error && <p role="alert">{error}</p>}
      <button className="min-h-11 rounded-button bg-maroon px-5 font-semibold text-white disabled:opacity-50" disabled={reading || analysing || !text.trim()} onClick={()=>setSubmitted(true)}>{reading?"Reading file…":"Scan résumé"}</button>
      <label><input type="checkbox" checked={consent} disabled={analysing} onChange={e=>setConsent(e.target.checked)}/> Allow Hugging Face to process this résumé for feedback</label>
      <button className="min-h-11 rounded-button border border-control px-5 disabled:opacity-50" disabled={reading || analysing || !consent || text.trim().length < 50 || text.length > 12000} onClick={()=>void review()}>{analysing ? "Analysing with Hugging Face…" : "Get Hugging Face AI review"}</button>
      <p>Sign in for AI review. Maximum 12,000 characters.</p>
      {aiError && <p role="alert">{aiError}</p>}
    </Panel>{ai && <Panel><h2>Hugging Face AI feedback</h2><p className="whitespace-pre-wrap">{ai}</p></Panel>}{submitted && <Panel><h2>Résumé evidence for {role.title_en}</h2><p>{results.filter(r=>r.evidence).length} of {results.length} essential skills mentioned.</p>{results.map(r=><div key={r.key}><h3>{r.label}</h3>{r.evidence?<blockquote>{r.evidence}</blockquote>:<p>No matching wording found. If you have used this skill, add a concrete example.</p>}</div>)}</Panel>}
  </WorkspacePage>;
}
