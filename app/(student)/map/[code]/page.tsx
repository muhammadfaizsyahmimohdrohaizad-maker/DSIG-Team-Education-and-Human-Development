import { notFound, redirect } from "next/navigation";
import { WorkspacePage, Panel, RouteLink } from "@/components/workspace-page";
import { ActionForm } from "@/components/action-form";
import { currentUser } from "@/server/data/supabase";
import { getProfile } from "@/server/data/profiles";
import { getOccupations } from "@/server/data/reference";
import { buildSkillGap } from "@/features/plan/gap";
import { setTarget } from "@/features/matches/actions";

export default async function OccupationPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const user = await currentUser();
  if (!user) redirect("/sign-in");
  const [profile, occupations] = await Promise.all([getProfile(user.id), getOccupations()]);
  const job = occupations.find(row => row.code === code);
  if (!profile || !job) notFound();
  const gap = await buildSkillGap({ ...profile, target: code });
  if (!gap) notFound();
  const covered = gap.rows.filter(row => row.state === "have" || row.state === "mastered");
  const remaining = gap.rows.filter(row => !covered.includes(row));
  async function choose() {
    "use server";
    const result = await setTarget({ code });
    if (!result.ok) return result.error.message;
    redirect("/skill-gap");
  }
  return <WorkspacePage title={job.titleEn}>
    <RouteLink href="/map">Back to occupation matches</RouteLink>
    <Panel><strong>MASCO 2020 · {code}</strong><h2>{job.titleMs}</h2>
      <ul className="pl-5">{job.tasks.map(task => <li key={task}>{task}</li>)}</ul>
      {job.sourceUrl && <a href={job.sourceUrl}>Occupation source on eMASCO</a>}
    </Panel>
    <div className="grid gap-4 tablet:grid-cols-2">
      {[{title:"Skills you already cover",rows:covered},{title:"Skills to build",rows:remaining}].map(group =>
        <Panel key={group.title}><h2 className="text-xl">{group.title} ({group.rows.length})</h2>
          {group.rows.length === 0 && <p>No skills in this group.</p>}
          {group.rows.map(row => <div className="w-full border-t border-hairline py-2" key={row.skill}>
            <strong>{row.label}</strong><p>{row.evidence}</p></div>)}
        </Panel>)}
    </div>
    {profile.target === code ? <RouteLink href="/skill-gap">Open my skill gap</RouteLink> :
      <ActionForm submit={choose} label="Build my plan for this role"/>}
    <RouteLink href="/book">Talk to an adviser</RouteLink>
  </WorkspacePage>;
}
