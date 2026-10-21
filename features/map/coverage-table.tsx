export type CoverageRow = { name: string; pct: number; found: number };

/** The radar's text alternative. Always visible. */
export function CoverageTable({ rows }: { rows: CoverageRow[] }) {
  return (
    <div className="table-frame">
      <table id="coverage-table">
        <caption className="visually-hidden">Skill coverage by ESCO skill group</caption>
        <thead>
          <tr>
            <th scope="col">Skill group</th>
            <th scope="col">Coverage</th>
            <th scope="col">Skills found</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.name}>
              <th scope="row">{r.name}</th>
              <td className="num-cell">{r.pct}%</td>
              <td className="num-cell">{r.found}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
