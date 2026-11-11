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
    <WorkspacePage title="Career map">
      <RouteLink href="/about-you">Edit your skills and interests</RouteLink>
      {!data?.matches.length && <p>Add your modules, skills or interests to see matching occupations.</p>}
      {data?.matches.map((job) => (
        <Panel key={job.code}>
          <span>
            MASCO {job.code} · {job.fit} match
          </span>
          <h2>{job.title}</h2>
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
