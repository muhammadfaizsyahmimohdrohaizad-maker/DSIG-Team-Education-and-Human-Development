"use client";
import Link from "next/link";
import { useState } from "react";
import occupations from "@/content/reference/occupations.json";
import skills from "@/content/reference/skills.json";

const labels = new Map(skills.map(skill => [skill.key, skill.label_en]));
const skillName = (key: string) => labels.get(key) ?? key;

export function CareerMap({ known }: { known: string[] }) {
  const [sort, setSort] = useState("coverage");
  const matches = occupations.map(role => {
    const covered = role.essential_skills.filter(skill => known.includes(skill));
    const missing = role.essential_skills.filter(skill => !known.includes(skill));
    const score = known.length && role.essential_skills.length
      ? Math.round(100 * covered.length / role.essential_skills.length) : null;
    return { role, covered, missing, score };
  }).sort((a, b) => (sort === "coverage" ? (b.score ?? 0) - (a.score ?? 0) : 0)
    || a.role.title_en.localeCompare(b.role.title_en));

  return <div className="grid w-full gap-5">
    <section className="rounded-card bg-navy p-6 text-white">
      <h2 className="text-2xl text-white">Where your skills fit</h2>
      <p>Compare the skills in your profile with the essential skills for each occupation.</p>
      <Link href="/about-you" className="inline-flex min-h-11 items-center font-semibold text-white underline">Edit profile skills ({known.length})</Link>
    </section>
    <label className="flex flex-wrap items-center gap-3">Sort occupations
      <select className="min-h-11 rounded-button border border-control px-3" value={sort} onChange={event => setSort(event.target.value)}>
        <option value="coverage">Highest skill coverage</option><option value="title">Alphabetical</option>
      </select>
    </label>
    {!known.length && <p role="status">Add a skill to see your coverage for each occupation.</p>}
    <div className="grid gap-4 tablet:grid-cols-2">{matches.map(({ role, covered, missing, score }) =>
      <article key={role.code} className="flex flex-col gap-3 rounded-card border border-hairline p-5">
        <span className="text-sm text-muted">MASCO {role.code}</span><h3 className="text-xl">{role.title_en}</h3>
        {score !== null && <><strong>{score}% essential skill coverage</strong>
          <progress aria-label={role.title_en + " skill coverage"} className="w-full accent-maroon" value={covered.length} max={role.essential_skills.length}/>
          <span>{covered.length} of {role.essential_skills.length} essential skills covered</span></>}
        <details><summary className="cursor-pointer py-2 font-semibold">See matching evidence</summary>
          <p>In your profile · {covered.map(skillName).join(", ") || "None listed"}</p>
          <p>Still to develop · {missing.map(skillName).join(", ") || "All covered"}</p>
        </details>
        <Link className="mt-auto inline-flex min-h-11 items-center font-semibold" href={"/map/"+role.code}>Explore {role.title_en} →</Link>
      </article>)}</div>
  </div>;
}
