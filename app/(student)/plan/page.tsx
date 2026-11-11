import { WorkspacePage, Panel, RouteLink } from "@/components/workspace-page";
import { getSkillGap, saveStudyOption, removeStudyOption } from "@/features/plan/actions";
import { ActionForm } from "@/components/action-form";
import { revalidatePath } from "next/cache";

export default async function Page() {
  const gap = await getSkillGap();
  async function toggle(form: FormData) {
    "use server";
    const update = form.get("saved") === "yes" ? removeStudyOption : saveStudyOption;
    const r = await update({ optionId: form.get("option") });
    if (!r.ok) return r.error.message;
    revalidatePath("/plan");
    return "Study plan updated.";
  }
  return (
    <WorkspacePage title="My plan">
      <Panel>
        <h2>{gap.ok ? gap.value.target.title : "Choose a target job"}</h2>
        {gap.ok ? (
          <>
            <p>{gap.value.lessonsLeft} lessons remaining</p>
            <RouteLink href="/skill-gap">Skills and lessons</RouteLink>
          </>
        ) : (
          <>
            <p>{gap.error.message}</p>
            <RouteLink href="/map">Career map</RouteLink>
          </>
        )}
        <RouteLink href="/plan/lessons">All lessons and notes</RouteLink>
        <RouteLink href="/plan/progress">My progress</RouteLink>
        <RouteLink href="/plan/review">Review cards</RouteLink>
        <RouteLink href="/plan/interview">Mock interview</RouteLink>
        <RouteLink href="/plan/cv">My CV</RouteLink>
      </Panel>
      {gap.ok &&
        gap.value.options.map((o) => (
          <Panel key={o.id}>
            <h2>{o.programme}</h2>
            <p>
              {o.institution} · {o.level} · {o.kind}
            </p>
            <a href={o.sourceUrl}>Programme information</a>
            <ActionForm
              label={gap.value.savedOptionIds.includes(o.id) ? "Remove from plan" : "Save to plan"}
              submit={toggle}
            >
              <input type="hidden" name="option" value={o.id} />
              <input
                type="hidden"
                name="saved"
                value={gap.value.savedOptionIds.includes(o.id) ? "yes" : "no"}
              />
            </ActionForm>
          </Panel>
        ))}
    </WorkspacePage>
  );
}
