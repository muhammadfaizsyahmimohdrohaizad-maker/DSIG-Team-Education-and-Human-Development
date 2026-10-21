import type { Metadata } from "next";
import Link from "next/link";
import { btn } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfidenceForm } from "@/features/plan/confidence-form";
import { getStore } from "@/server/data";
import { getGapSkills } from "@/server/engines/matches";

export const metadata: Metadata = { title: "Plan: your gap skills" };

export default async function PlanPage() {
  const store = getStore();
  const [{ gaps, targetCode, targetTitle }, ratings, built, lessons, consent] = await Promise.all([
    getGapSkills(),
    store.getRatings(),
    store.isPlanBuilt(),
    store.listLessons(),
    store.getConsent(),
  ]);

  if (!targetCode) {
    return (
      <div className="stack-lg">
        <div className="page-head">
          <h1>Your plan</h1>
          <p>Your plan is built from the skills a target job needs that your modules don&apos;t cover yet.</p>
        </div>
        <Card flush>
          <EmptyState title="Choose a target role first" action={<Link href="/matches" className={btn("primary")}>See your matches</Link>}>
            Pick one of the nine occupations your modules point to, then rate your confidence in each missing skill.
          </EmptyState>
        </Card>
      </div>
    );
  }

  return (
    <div className="stack-lg">
      <div className="page-head">
        <h1>Your gap skills for {targetTitle}</h1>
        <p>
          Be honest here. Your answers only decide what you practise first.{" "}
          {consent?.adviserVisibility ? "Your adviser can see them, read-only." : "Nobody else sees them."}
        </p>
      </div>
      <ConfidenceForm
        gaps={gaps.map((g) => ({
          id: g.id,
          label: g.escoLabel,
          note: g.note,
          essential: g.essential,
          slug: lessons.find((l) => l.skillId === g.id)?.slug ?? "",
        }))}
        initialRatings={ratings}
        initialBuilt={built}
      />
    </div>
  );
}
