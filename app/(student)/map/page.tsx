import { ButtonLink, HeroBand, SoftPanel } from "@/components/ui";
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
    <WorkspacePage title="My career map">
      <div className="grid gap-4 tablet:grid-cols-[2fr_1fr]"><HeroBand gap="gap-4"><h2 className="text-2xl">{data?.matches.length ? "Explore your occupation matches" : "Build your first career map"}</h2><p>{data?.matches.length ? "Open a role to inspect its skills and choose a target." : "Add a skill, module or interest to find occupations connected to your studies."}</p><ButtonLink href="/about-you" variant="on-navy" className="self-start">Edit your skills and interests</ButtonLink></HeroBand><SoftPanel><h2 className="text-xl">Your profile</h2><p>{data?.form.skills.length ?? 0} skills · {data?.form.projects.length ?? 0} projects</p><p>Target · {data?.target?.title ?? "Choose a role from your matches"}</p></SoftPanel></div>
      <details><summary>How the match is calculated</summary><p>Your skills, modules, interests and projects help rank occupations. Skill coverage shows the percentage of essential skills your profile already covers.</p></details>

      <div className="grid gap-4 tablet:grid-cols-2">
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
      </div>
    </WorkspacePage>
  );
}


