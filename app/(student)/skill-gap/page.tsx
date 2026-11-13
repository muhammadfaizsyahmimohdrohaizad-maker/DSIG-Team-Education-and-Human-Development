import { WorkspacePage, Panel, RouteLink } from "@/components/workspace-page";
import { getSkillGap } from "@/features/plan/actions";

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

  return (
    <WorkspacePage title={target.title + " skill gap"}>
      <p>
        MASCO {target.code}
      </p>
      {rows.map((row) => (
        <Panel key={row.skill}>
          <h2>{row.label}</h2>
          <strong>{row.state.replace("_", " ")}</strong>
          <p>{row.evidence}</p>

        </Panel>
      ))}
      <RouteLink href="/plan/interview">Practise a mock interview</RouteLink>
      <RouteLink href="/book">Talk to an adviser</RouteLink>
    </WorkspacePage>
  );
}
