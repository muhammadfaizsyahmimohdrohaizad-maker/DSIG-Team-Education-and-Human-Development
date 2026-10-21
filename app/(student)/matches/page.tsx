import type { Metadata } from "next";
import { MatchList } from "@/features/matches/match-list";
import { getMatches } from "@/server/engines/matches";
import { getStore } from "@/server/data";

export const metadata: Metadata = { title: "Occupation matches" };

export default async function MatchesPage() {
  const [matches, student] = await Promise.all([getMatches(), getStore().getStudent()]);
  const items = matches.map((o) => ({
    code: o.code,
    titleMs: o.titleMs,
    titleEn: o.titleEn,
    isTarget: o.code === student.targetCode,
    pct: o.match.pct,
    coveredEssential: o.match.coveredEssential.length,
    essentialTotal: o.match.essentialTotal,
    coveredOptional: o.match.coveredOptional.length,
    optionalTotal: o.match.optionalTotal,
    evidence: o.evidence,
    uncertain: o.uncertain,
  }));

  return (
    <div className="stack-lg">
      <div className="page-head">
        <p className="stage-label">Stage 1 of 4 · Map</p>
        <h1>Occupations your modules point to</h1>
        <p>
          Ranked by how much of each job&apos;s skill list your modules already cover. Codes come from MASCO 2020,
          Malaysia&apos;s official list of occupations.
        </p>
      </div>
      <details className="card">
        <summary style={{ cursor: "pointer", fontWeight: 500, minHeight: 44, display: "flex", alignItems: "center" }}>
          How the match is calculated
        </summary>
        <div className="stack prose" style={{ marginTop: 12 }}>
          <p>
            We list the skills each occupation needs and count the ones your modules cover. Essential skills count fully,
            optional skills count half.
          </p>
          <p>
            A skill only counts when we are at least 60% sure your module teaches it. Anything below that is shown to you, but
            kept out of the score until an adviser checks it.
          </p>
        </div>
      </details>
      <MatchList items={items} />
    </div>
  );
}
