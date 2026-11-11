import { redirect } from "next/navigation";
import { WorkspacePage, Panel, RouteLink } from "@/components/workspace-page";
import { ActionForm } from "@/components/action-form";
import { getLesson, completeLesson } from "@/features/learning/actions";
import { skillUri } from "@/content/reference/keys";

export default async function Page({ params }: { params: Promise<{ skill: string; lesson: string }> }) {
  const { skill: key, lesson: number } = await params;
  const skill = skillUri(key);
  const lessonNo = Number(number);
  const result = await getLesson({ skill, lessonNo });
  if (!result.ok)
    return (
      <WorkspacePage title="Lesson">
        <p>{result.error.message}</p>
        <RouteLink href="/skill-gap">Back to skills</RouteLink>
      </WorkspacePage>
    );
  const { lesson, notes, skillTitle } = result.value;
  async function finish(form: FormData) {
    "use server";
    const r = await completeLesson({ skill, lessonNo, notes: form.get("notes") });
    if (!r.ok) return r.error.message;
    redirect(
      r.value.checkOpen
        ? "/plan/check/" + key
        : "/plan/learn/" + key + "/" + (r.value.nextLesson ?? lessonNo),
    );
  }
  return (
    <WorkspacePage title={lesson.title}>
      <p>
        {skillTitle} · Lesson {lesson.no} of 4 · {lesson.minutes} minutes
      </p>
      <Panel>
        <h2>Key points</h2>
        <ul>
          {lesson.key_points.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      </Panel>
      <Panel>
        <h2>{lesson.worked_example.title}</h2>
        <ol>
          {lesson.worked_example.steps.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
        {lesson.worked_example.code && (
          <pre className="max-w-full overflow-auto">{lesson.worked_example.code}</pre>
        )}
      </Panel>
      <Panel>
        <h2>{lesson.mini_project.title}</h2>
        <p>{lesson.mini_project.brief}</p>
        <div className="w-full divide-y divide-hairline">{lesson.mini_project.steps.map((step, index) => (
          <details key={step} className="py-2"><summary className="cursor-pointer font-semibold">Show hint {index + 1}</summary><p>{step}</p></details>
        ))}</div>
        <p>{lesson.mini_project.done_when}</p>
      </Panel>
      <ActionForm label="Save and continue" submit={finish}>
        <label htmlFor="notes">Your lesson notes</label>
        <textarea
          id="notes"
          name="notes"
          defaultValue={notes}
          maxLength={20000}
          rows={4}
          className="w-full border border-control p-3"
        />
      </ActionForm>
      <RouteLink href="/skill-gap">Back to skills</RouteLink>
    </WorkspacePage>
  );
}
