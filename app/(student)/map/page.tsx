import { redirect } from "next/navigation";
import { WorkspacePage, Panel, RouteLink } from "@/components/workspace-page";
import { ActionForm } from "@/components/action-form";
import { currentUser } from "@/server/data/supabase";
import { loadAboutYou } from "@/features/matches/load";
import { setTarget } from "@/features/matches/actions";

export default async function Page() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");
  const data = await loadAboutYou(user.id);
  async function choose(form: FormData) {
    "use server";
    const result = await setTarget({ code: form.get("code") });
    if (!result.ok) return result.error.message;
    redirect("/skill-gap");
  }
  return (
    <WorkspacePage title="Occupations your skills point to">
      <details><summary>How the match is calculated</summary><p>Your skills, modules, interests and projects help rank occupations. Skill coverage shows the percentage of essential skills your profile already covers.</p></details>
      <RouteLink href="/about-you">Edit your skills and interests</RouteLink>
      {!data?.matches.length && <p>Add your modules, skills or interests to see matching occupations.</p>}
      {data?.matches.map((job) => (
        <Panel key={job.code}>
          <span>
            MASCO {job.code} · {job.fit} match
          </span>
          <h2 className="text-xl">{job.title}</h2>
          <span>{Math.round(job.coverage * 100)}% essential skill coverage</span>
          <progress className="w-full accent-maroon" aria-label="Essential skill coverage" value={job.coverage} max={1}/>
          <RouteLink href={"/map/" + job.code}>View {job.code} details</RouteLink>
          <ul>
            {job.reasons.map((r, i) => (
              <li key={i}>{r.text}</li>
            ))}
          </ul>
          {job.tasks.length > 0 && (
            <details>
              <summary>Typical tasks</summary>
              <ul>
                {job.tasks.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </details>
          )}
          {data.target?.code === job.code ? (
            <RouteLink href="/skill-gap">View your target skill gap</RouteLink>
          ) : (
            <ActionForm submit={choose} label="Set as target">
              <input type="hidden" name="code" value={job.code} />
            </ActionForm>
          )}
        </Panel>
      ))}
    </WorkspacePage>
  );
}

