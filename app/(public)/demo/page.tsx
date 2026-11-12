"use client";

import { useState } from "react";
import Link from "next/link";
import roles from "@/content/reference/occupations.json";
import skills from "@/content/reference/skills.json";
import git from "@/content/lessons/git.json";
import interview from "@/content/interview/2519-03.json";
import { Panel, WorkspacePage } from "@/components/workspace-page";

const stages = ["Career map", "Skill practice", "Interview", "Adviser booking"];
const button = "min-h-11 rounded-button bg-maroon px-5 font-semibold text-white";
const labels = new Map(skills.map(skill => [skill.key, skill.label_en]));
const starter = ["python", "sql", "statistics", "data-cleansing"];
const question = git.check[0]!;
const prompt = interview.questions[0]!;

export default function Demo() {
  const [step, setStep] = useState(0);
  const [known, setKnown] = useState(starter);
  const [choice, setChoice] = useState("");
  const [answer, setAnswer] = useState("");
  const [review, setReview] = useState(false);
  const [time, setTime] = useState("Tuesday at 10 am");
  const [booked, setBooked] = useState(false);
  const ranked = roles.map(role => ({role, covered:role.essential_skills.filter(s=>known.includes(s))}))
    .sort((a,b)=>b.covered.length/b.role.essential_skills.length-a.covered.length/a.role.essential_skills.length);
  const role = roles[0]!;
  const missingPoint = prompt.rubric.keyPoints.find(point=>!point.words.some(word=>answer.toLowerCase().includes(word.toLowerCase())));
  return <WorkspacePage title="CareerPrep demo">
    <p>Aina Rahman · Diploma in Software Engineering · Fictional student profile</p>
    <nav aria-label="Demo stages" className="flex flex-wrap gap-2">{stages.map((stage,i)=><button key={stage} aria-current={step===i?"step":undefined} onClick={()=>setStep(i)} className={step===i?button:"min-h-11 rounded-button border border-control px-4"}>{stage}</button>)}</nav>
    {step===0 && <><Panel><h2 className="text-xl">Which skills does Aina have?</h2><p>Change a skill to see which roles match.</p>
      <div className="flex flex-wrap gap-4">{[...starter,"git","machine-learning","javascript"].map(s=><label key={s}><input type="checkbox" checked={known.includes(s)} onChange={()=>setKnown(known.includes(s)?known.filter(k=>k!==s):[...known,s])}/> {labels.get(s)}</label>)}</div></Panel>
      <Panel><h2 className="text-xl">Occupation matches</h2>{ranked.slice(0,3).map(({role:r,covered})=><div key={r.code} className="w-full border-t border-hairline py-2"><strong>{r.title_en}</strong> · MASCO {r.code}<p>{covered.length} of {r.essential_skills.length} essential skills covered</p></div>)}</Panel>
      <Panel><h2 className="text-xl">Aina’s target · {role.title_en}</h2><p>Skills to build: {role.essential_skills.filter(s=>!known.includes(s)).map(s=>labels.get(s)).join(", ") || "All essential skills covered"}.</p><button className={button} onClick={()=>setStep(1)}>Practise Git for this role</button></Panel></>}
    {step===1 && <Panel><h2 className="text-xl">{git.lessons[0]!.title}</h2><ul className="pl-5">{git.lessons[0]!.key_points.map(p=><li key={p}>{p}</li>)}</ul><h3>Quick check</h3><p>{question.prompt}</p>{question.options.map(o=><label key={o.id}><input type="radio" name="demo-check" checked={choice===o.id} onChange={()=>setChoice(o.id)}/> {o.text}</label>)}{choice && <p role="status">{choice===question.answer?"Correct. "+question.explanation:"Try again. Think about which files enter the staging area."}</p>}<button className={button} onClick={()=>setStep(2)}>Try the interview</button></Panel>}
    {step===2 && <Panel><h2 className="text-xl">AI engineer mock interview</h2><label htmlFor="demo-answer">{prompt.text}</label><textarea id="demo-answer" className="w-full border border-control p-3" rows={4} value={answer} onChange={e=>{setAnswer(e.target.value);setReview(false)}}/><button disabled={!answer.trim()} className={button+" disabled:opacity-50"} onClick={()=>setReview(true)}>Review my answer</button>{review && <p role="status">{missingPoint?"Expand on this point: "+missingPoint.point:"You covered the key points. Give a concrete example using two tables."}</p>}<button onClick={()=>setStep(3)} className="min-h-11 underline">Talk to an adviser</button></Panel>}
    {step===3 && <Panel><h2 className="text-xl">Book a practice session</h2><p>Sample adviser · Pn. Nurul Huda. No email or real appointment is created.</p>{booked?<><p role="status">Demo request received for {time} (Malaysia time).</p><button className={button} onClick={()=>setBooked(false)}>Cancel demo request</button></>:<><label>Available time <select value={time} onChange={e=>setTime(e.target.value)}><option>Tuesday at 10 am</option><option>Thursday at 2 pm</option></select></label><button className={button} onClick={()=>setBooked(true)}>Request demo session</button></>}</Panel>}
    <Link href="/">Back to CareerPrep</Link></WorkspacePage>;
}
