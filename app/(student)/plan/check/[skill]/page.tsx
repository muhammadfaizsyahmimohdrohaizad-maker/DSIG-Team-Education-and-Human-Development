import { getCheck } from "@/features/learning/actions";
import { WorkspacePage, RouteLink } from "@/components/workspace-page";
import { skillUri } from "@/content/reference/keys";
import { MasteryCheck } from "@/features/learning/mastery-check";

export default async function Page({ params }: { params: Promise<{ skill: string }> }) {
  const { skill } = await params;
  const r = await getCheck({ skill: skillUri(skill) });
  return (
    <WorkspacePage title={r.ok ? r.value.title + " mastery check" : "Mastery check"}>
      {!r.ok ? (
        <p>{r.error.message}</p>
      ) : r.value.open ? (
        <MasteryCheck check={r.value} skillKey={skill} />
      ) : (
        <RouteLink href={"/plan/learn/" + skill + "/" + r.value.finishLesson}>
          Finish lesson {r.value.finishLesson} to open the check
        </RouteLink>
      )}
      <RouteLink href="/skill-gap">Back to skills</RouteLink>
    </WorkspacePage>
  );
}
