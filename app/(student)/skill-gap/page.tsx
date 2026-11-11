import { redirect } from "next/navigation";
import { WorkspacePage, Panel, RouteLink } from "@/components/workspace-page";
import { ActionForm } from "@/components/action-form";
import { getSkillGap, claimSkill } from "@/features/plan/actions";
import { skillKey } from "@/content/reference/keys";

export default async function Page() {
  const result = await getSkillGap();
  if (!result.ok)
    return (
      <WorkspacePage title="Skill gap">
        <p>{result.error.message}</p>
        <RouteLink href="/map">Open career map</RouteLink>
      </WorkspacePage>
    );
  const { target, rows } = result.value;
  async function claim(form: FormData) {
    "use server";
    const skill = String(form.get("skill"));
    const r = await claimSkill({ skill });
    if (!r.ok) return r.error.message;
    redirect("/plan/check/" + encodeURIComponent(skillKey(skill)!));
  }
  return (
    <WorkspacePage title={target.title + " skill gap"}>
      <p>
        MASCO {target.code} · {result.value.lessonsLeft} lessons remaining
      </p>
      {rows.map((row) => (
        <Panel key={row.skill}>
          <h2>{row.label}</h2>
          <strong>{row.state.replace("_", " ")}</strong>
          <p>{row.evidence}</p>
          {row.hasLessons && (
            <>
              <RouteLink href={"/plan/learn/" + skillKey(row.skill) + "/" + (row.nextLesson ?? 1)}>
                Open lesson {row.nextLesson ?? 1}
              </RouteLink>
              {row.state === "missing" ||
              row.state === "have" ||
              (row.state === "learning" && row.lessonsDone < 4) ? (
                <ActionForm submit={claim} label="I know this skill · take the check">
                  <input type="hidden" name="skill" value={row.skill} />
                </ActionForm>
              ) : (
                <RouteLink href={"/plan/check/" + skillKey(row.skill)}>Open mastery check</RouteLink>
              )}
            </>
          )}
        </Panel>
      ))}
      <RouteLink href="/plan/interview">Practise a mock interview</RouteLink>
      <RouteLink href="/book">Talk to an adviser</RouteLink>
    </WorkspacePage>
  );
}
