import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { MIN_GROUP } from "@/lib/config";
import { cohortSummary } from "@/server/engines/cohort";

export default async function InstitutionPage() {
  const c = await cohortSummary();

  return (
    <div className="stack-lg">
      <div className="page-head">
        <h1>Cohort overview</h1>
        <p>
          Anonymous totals for students who use CareerPrep. Any group of fewer than {MIN_GROUP} students is hidden, so no figure
          points at one person. You cannot see names or individual records here.
        </p>
      </div>

      {!c.shownTotal ? (
        <Card flush>
          <EmptyState title={`Fewer than ${MIN_GROUP} students so far`} level={2}>
            Totals appear once at least {MIN_GROUP} students have signed up and agreed to have their data used.
          </EmptyState>
        </Card>
      ) : (
        <>
          <dl className="stat-row">
            <div className="stat">
              <dt className="secondary muted">Students counted</dt>
              <dd><strong>{c.total}</strong></dd>
            </div>
            <div className="stat">
              <dt className="secondary muted">No target role yet</dt>
              <dd><strong>{c.noTarget ?? `Under ${MIN_GROUP}`}</strong></dd>
            </div>
          </dl>

          <section className="stack" aria-labelledby="occ-title">
            <h2 id="occ-title">Coverage by target occupation</h2>
            <p className="secondary muted prose">Average match is how much of each occupation&apos;s skill list the students&apos; finished modules cover.</p>
            {c.occupations.length ? (
              <div className="table-frame">
                <table>
                  <thead>
                    <tr><th scope="col">Occupation (MASCO 2020)</th><th scope="col">Students</th><th scope="col">Average match</th></tr>
                  </thead>
                  <tbody>
                    {c.occupations.map((o) => (
                      <tr key={o.code}>
                        <th scope="row">{o.code} {o.title}</th>
                        <td className="num-cell">{o.students}</td>
                        <td className="num-cell">{o.averageMatch}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="prose">No occupation has {MIN_GROUP} or more students yet.</p>
            )}
            {c.hiddenOccupationGroups > 0 ? (
              <p className="meta">{c.hiddenOccupationGroups} more {c.hiddenOccupationGroups === 1 ? "occupation is" : "occupations are"} hidden because fewer than {MIN_GROUP} students chose them.</p>
            ) : null}
          </section>

          <section className="stack" aria-labelledby="gap-title">
            <h2 id="gap-title">Most common gap skills</h2>
            {c.gaps.length ? (
              <div className="table-frame">
                <table>
                  <thead>
                    <tr><th scope="col">Skill (ESCO)</th><th scope="col">Students missing it</th><th scope="col">Average confidence (1 to 5)</th></tr>
                  </thead>
                  <tbody>
                    {c.gaps.map((g) => (
                      <tr key={g.label}>
                        <th scope="row">{g.label}</th>
                        <td className="num-cell">{g.students}</td>
                        <td className="num-cell">{g.averageConfidence ?? `Under ${MIN_GROUP} ratings`}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="prose">No gap skill is shared by {MIN_GROUP} or more students yet.</p>
            )}
          </section>
        </>
      )}
    </div>
  );
}
