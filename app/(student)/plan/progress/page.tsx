import { WorkspacePage, Panel, RouteLink } from "@/components/workspace-page";
import { getSkillGap } from "@/features/plan/actions";
export default async function Page() {
  const gap = await getSkillGap();
  return (
    <WorkspacePage title="My progress">
      {gap.ok ? (
        <Panel>
          <h2>{gap.value.target.title}</h2>
          {gap.value.rows.map((row) => (
            <div key={row.skill}>
              <strong>{row.label}</strong>
              <p>{row.evidence}</p>
            </div>
          ))}
        </Panel>
      ) : (
        <p>{gap.error.message}</p>
      )}
      <RouteLink href="/skill-gap">Open skills and lessons</RouteLink>
    </WorkspacePage>
  );
}
