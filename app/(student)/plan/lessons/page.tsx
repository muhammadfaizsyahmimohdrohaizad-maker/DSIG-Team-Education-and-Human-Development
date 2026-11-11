import { WorkspacePage, Panel, RouteLink } from "@/components/workspace-page";
import { getSkillGap } from "@/features/plan/actions";
import { skillKey } from "@/content/reference/keys";
export default async function Page() {
  const gap = await getSkillGap();
  const rows = gap.ok ? gap.value.rows.filter((r) => r.hasLessons) : [];
  return (
    <WorkspacePage title="My lessons">
      {!gap.ok ? (
        <p>{gap.error.message}</p>
      ) : !rows.length ? (
        <p>No lessons published for this target yet.</p>
      ) : (
        rows.map((row) => (
          <Panel key={row.skill}>
            <h2>{row.label}</h2>
            <p>{row.lessonsDone} of 4 completed</p>
            <nav aria-label={row.label + " lessons"} className="flex flex-wrap gap-4">
              {[1, 2, 3, 4].map((n) => (
                <RouteLink key={n} href={"/plan/learn/" + skillKey(row.skill) + "/" + n}>
                  Lesson {n}
                </RouteLink>
              ))}
            </nav>
          </Panel>
        ))
      )}
      <a href="/careerprep/api/notes" download>
        Download my lesson notes
      </a>
      <RouteLink href="/map">Career map</RouteLink>
    </WorkspacePage>
  );
}
