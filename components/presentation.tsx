"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Panel, WorkspacePage } from "@/components/workspace-page";
import occupations from "@/content/reference/occupations.json";
import skills from "@/content/reference/skills.json";

const pages: Record<string,string> = {
  dashboard:"Student dashboard","about-you":"About you",map:"Career map","skill-gap":"Your skill gap",
  plan:"Learning plan","plan/lessons":"Lessons","plan/progress":"Progress","plan/review":"Review cards",
  "plan/review/import":"Import a review card","plan/interview":"Mock interview","plan/cv":"CV builder","plan/cv/print":"Printable CV",
  book:"Book an adviser",settings:"Sharing settings","adviser/requests":"Session requests","adviser/students":"Students",
  "adviser/availability":"Adviser availability","adviser/cohort":"Cohort overview",institution:"Institution overview",
  "staff/undertaking":"Staff undertaking","sign-in":"Choose a demo workspace","sign-up":"Start a demo profile"
};
const initial = { name:"Aina Rahman", known:["python","sql","statistics"], target:"2519-03", done:false,
  booking:"Requested", slot:"Tuesday 10 am", available:"Thursday 2 pm", shared:true, card:"What does git add do?",
  answer:"", summary:"Software engineering diploma student with experience in Python and SQL.", consent:false };
const label = (key:string) => skills.find(s=>s.key===key)?.label_en ?? key;
const link = (path:string,title?:string) => <Link key={path} className="inline-flex items-center min-h-11 rounded-button border border-control px-3" href={"/"+path}>{title ?? pages[path]}</Link>;
const btn="min-h-11 rounded-button bg-maroon text-white px-4";
export function Presentation({path}:{path:string}) {
  const [data,setData]=useState(initial);
  const [ready,setReady]=useState(false);
  const [flip,setFlip]=useState(false);
  const [feedback,setFeedback]=useState("");
  useEffect(()=>{try {setData({...initial,...JSON.parse(sessionStorage.getItem("careerprep-presentation") || "{}")});} catch {} setReady(true);},[]);
  useEffect(()=>{if(ready) sessionStorage.setItem("careerprep-presentation",JSON.stringify(data));},[data,ready]);
  useEffect(()=>{setFeedback("");setFlip(false);},[path]);
  function update(patch:Partial<typeof initial>) {setData(prior=>({...prior,...patch}));}
  const target=occupations.find(o=>o.code===data.target) ?? occupations[0]!;
  const selected=occupations.find(o=>path==="map/"+o.code) ?? target;
  const missing=target.essential_skills.filter(s=>!data.known.includes(s));
  const coverage=(o:typeof target)=>o.essential_skills.filter(s=>data.known.includes(s)).length;
  const title=pages[path] ?? (path==="demo"?"Demo workspaces":path.startsWith("map/")?selected.title_en:path.startsWith("book/")?"Session details":path.startsWith("plan/check/")?"Practice check":path.startsWith("plan/learn/")?"Practice lesson":"Parent consent");
  const nav=(paths:string[]) => <div className="flex flex-wrap gap-2">{paths.map(p=>link(p))}</div>;
  const roles=nav(["dashboard","adviser/requests","institution"]);
  const textField=(key:"name"|"card"|"answer"|"summary"|"available",caption:string)=><label className="grid gap-2">{caption}<textarea className="border border-control rounded-button p-2" value={data[key]} onChange={e=>update({[key]:e.target.value})}/></label>;
  return <WorkspacePage title={title}><p>Sample workspace · Changes last in this browser tab.</p>
    <Panel>
    {["sign-in","sign-up","demo"].includes(path) && roles}
    {path==="dashboard" && <><h2>Welcome, {data.name}</h2><p>Your target is {target.title_en}. You cover {coverage(target)} of {target.essential_skills.length} essential skills.</p>{nav(["about-you","map","skill-gap","plan","book","settings"])}</>}
    {path==="about-you" && <>{textField("name","Student name")}<p>Diploma in Software Engineering</p><h2>Skills you have used</h2>{skills.map(s=><label key={s.key}><input type="checkbox" checked={data.known.includes(s.key)} onChange={e=>update({known:e.target.checked?[...data.known,s.key]:data.known.filter(k=>k!==s.key)})}/> {s.label_en}</label>)}{link("map")}</>}
    {path==="map" && [...occupations].sort((a,b)=>coverage(b)/b.essential_skills.length-coverage(a)/a.essential_skills.length).map(o=>link("map/"+o.code,o.title_en+" · "+coverage(o)+"/"+o.essential_skills.length+" skills"))}
    {path.startsWith("map/") && <><p>MASCO {selected.code}</p>{selected.tasks.map(t=><p key={t.en}>{t.en}</p>)}<button className={btn} onClick={()=>update({target:selected.code})}>{data.target===selected.code?"Current target":"Choose this role"}</button>{link("skill-gap")}</>}
    {path==="skill-gap" && <><h2>{target.title_en}</h2>{target.essential_skills.map(s=><p key={s}>{label(s)} · {missing.includes(s)?"To develop":"Covered"}</p>)}{link("plan")}</>}
    {path==="plan" && nav(["plan/lessons","plan/progress","plan/review","plan/interview","plan/cv"])}
    {path==="plan/lessons" && link("plan/learn/git/1","Version control with Git · Commits and history")}
    {path.startsWith("plan/learn/") && <><h2>Commits and history</h2><p>Run git status to inspect your changes. Use git add README.md to stage that file, then git commit to save the staged snapshot.</p>{link("plan/check/git","Take the practice check")}</>}
    {path.startsWith("plan/check/") && <><p>Which command stages README.md?</p>{["git status","git add README.md","git log"].map((v,i)=><button key={v} className={btn} onClick={()=>{if(i===1)update({done:true});setFeedback(i===1?"Correct. Practice completed.":"Try again. Which command adds a file to the staging area?");}}>{v}</button>)}{link("plan/progress")}</>}
    {path==="plan/progress" && <><p>Python basics · Completed</p><p>SQL queries · Completed</p><p>Git practice · {data.done?"Completed":"In progress"}</p>{link("plan/lessons")}</>}
    {path==="plan/review" && <><h2>{data.card}</h2><button className={btn} onClick={()=>setFlip(!flip)}>{flip?"Hide answer":"Show answer"}</button>{flip && <p>{data.card==="What does git add do?"?"Stages changes for the next commit.":data.answer}</p>}{link("plan/review/import")}</>}
    {path==="plan/review/import" && <>{textField("card","Practice question")}{textField("answer","Answer")}{link("plan/review","Review this card")}</>}
    {path==="plan/interview" && <><h2>How would you check the quality of a dataset?</h2><textarea aria-label="Practice answer" rows={4} className="w-full border p-2" onChange={e=>setFeedback(e.target.value.trim()?"Compare your answer with the rubric: mention missing values, duplicates and a check against the source.":"")}/></>}
    {path==="plan/cv" && <>{textField("summary","Professional summary")}{link("plan/cv/print")}</>}
    {path==="plan/cv/print" && <><h2>{data.name}</h2><p>{data.summary}</p><p>Diploma in Software Engineering</p><p>{data.known.map(label).join(" · ")}</p><button className={btn} onClick={()=>window.print()}>Print CV</button></>}
    {path==="book" && <><p>Career adviser · Nurul Huda</p><label>Malaysia time <select value={data.slot} onChange={e=>update({slot:e.target.value})}>{[...new Set(["Tuesday 10 am",data.available,data.slot])].map(t=><option key={t}>{t}</option>)}</select></label><button className={btn} onClick={()=>{update({booking:"Requested"});setFeedback("Request recorded in the demo.");}}>Request session</button>{link("book/sample","View session details")}</>}
    {(path.startsWith("book/")||path==="adviser/requests") && <><h2>{data.name} · Career planning</h2><p>{data.slot} · {data.booking}</p><button className={btn} onClick={()=>update({booking:path.startsWith("book/")?"Cancelled":"Confirmed"})}>{path.startsWith("book/")?"Cancel request":"Confirm session"}</button></>}
    {path==="settings" && <label><input type="checkbox" checked={data.shared} onChange={e=>update({shared:e.target.checked})}/> Share progress with the sample adviser</label>}
    {path==="adviser/students" && <><h2>{data.name}</h2><p>{data.shared?target.title_en+" · "+coverage(target)+" essential skills covered":"Progress is private"}</p></>}
    {path==="adviser/availability" && textField("available","Available appointment time")}
    {(path==="institution"||path==="adviser/cohort") && <><h2>Software Engineering · November cohort</h2><p>24 students · 18 completed profiles · 12 active learning plans</p><h3>Common practice needs</h3><p>Version control · 9 students</p><p>Data cleansing · 7 students</p><p>Model evaluation · 5 students</p></>}
    {(path==="staff/undertaking"||path.startsWith("parent-consent/")) && <label><input type="checkbox" checked={data.consent} onChange={e=>update({consent:e.target.checked})}/> {path.startsWith("staff")?"Acknowledge the sample confidentiality undertaking":"Approve participation for the fictional student"}</label>}
    {feedback && <p role="status">{feedback}</p>}
    </Panel>
    <details open><summary>Workspaces</summary>{roles}</details>
    <details open={path.startsWith("adviser/") || path==="institution"}><summary>Adviser and institution pages</summary>{nav(["adviser/requests","adviser/students","adviser/availability","adviser/cohort","staff/undertaking","institution"])}</details>
    </WorkspacePage>;
}
