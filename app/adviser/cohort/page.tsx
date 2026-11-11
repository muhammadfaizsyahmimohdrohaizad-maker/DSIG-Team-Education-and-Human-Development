import { WorkspacePage, Panel } from "@/components/workspace-page";
import { getCohort } from "@/features/adviser/actions";
export default async function Page() {
  const r = await getCohort();
  return (
    <WorkspacePage title="Cohort overview">
      <Panel>
        <p>Only groups of five or more students appear here.</p>
        {!r.ok ? (
          <p>{r.error.message}</p>
        ) : !r.value.length ? (
          <p>No reportable groups yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Measure</th>
                <th>Group</th>
                <th>Students</th>
              </tr>
            </thead>
            <tbody>
              {r.value.map((row) => (
                <tr key={row.metric + row.label}>
                  <td>{row.metric.replaceAll("_", " ")}</td>
                  <td>{row.label || "All"}</td>
                  <td>{row.students}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>
    </WorkspacePage>
  );
}
