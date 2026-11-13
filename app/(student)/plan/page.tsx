import { ButtonLink, HeroBand, SoftPanel } from "@/components/ui";
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
      <HeroBand gap="gap-4"><h2 className="text-2xl">{gap.ok ? gap.value.target.title : "Choose your target occupation"}</h2>
        <p>{gap.ok ? gap.value.lessonsLeft + " lessons remaining in your skill plan." : gap.error.message}</p>
        <ButtonLink className="self-start" variant="on-navy" href={gap.ok ? "/skill-gap" : "/map"}>{gap.ok ? "Open my skill gap" : "Explore the career map"}</ButtonLink>
      </HeroBand>
      <h2 className="text-2xl">Learning and practice</h2>
      <div className="grid gap-4 tablet:grid-cols-2">
        {[
          ["/plan/lessons","Lessons and notes","Study a skill and revisit your practice notes."],
          ["/plan/progress","My progress","Review completed lessons and mastery checks."],
          ["/plan/review","Review cards","Practise recalling what you learned."],
          ["/plan/interview","Mock interview","Rehearse answers for your target occupation."],
          ["/plan/cv","My CV","Prepare a printable CV from your profile."]
        ].map(([href,title,detail]) => <SoftPanel key={href}><h3 className="text-xl"><RouteLink href={href!}>{title}</RouteLink></h3><p>{detail}</p></SoftPanel>)}
      </div>
      {gap.ok && <h2 className="text-2xl">Study options</h2>}
      {gap.ok && !gap.value.options.length && <p>No study options are listed for this occupation yet.</p>}
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

