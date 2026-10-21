import type { Metadata } from "next";
import Link from "next/link";
import { btn } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { MatchList } from "@/features/matches/match-list";
import { getMatches } from "@/server/engines/matches";
import { getStore } from "@/server/data";

export const metadata: Metadata = { title: "Occupation matches" };

export default async function MatchesPage() {
  const [matches, student, ticked] = await Promise.all([getMatches(), getStore().getStudent(), getStore().getTicked()]);
  if (ticked.length === 0) {
    return (
      <div className="stack-lg">
        <div className="page-head">
          <h1>Occupations your modules point to</h1>
          <p>Matches come from the modules you have finished.</p>
        </div>
        <Card flush>
          <EmptyState title="Tick your modules first" action={<Link href="/map" className={btn("primary")}>Choose my modules</Link>}>
            Tick the modules you have finished on the Map, and the nine MASCO 2020 occupations are ranked against them.
          </EmptyState>
        </Card>
      </div>
    );
  }
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
        <h1>Occupations your modules point to</h1>
        <p>
          Ranked by how much of each job&apos;s skill list your modules already cover. Codes come from MASCO 2020,
          Malaysia&apos;s official list of occupations.
        </p>
      </div>
      <details className="disclosure">
        <summary style={{ cursor: "pointer", fontWeight: 500, minHeight: 44, display: "flex", alignItems: "center" }}>
          How the match is calculated
        </summary>
        <div className="stack prose">
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
