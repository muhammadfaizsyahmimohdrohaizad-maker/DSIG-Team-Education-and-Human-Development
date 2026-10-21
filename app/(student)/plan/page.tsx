import type { Metadata } from "next";
import { ConfidenceForm } from "@/features/plan/confidence-form";
import { getStore } from "@/server/data";
import { getGapSkills } from "@/server/engines/matches";

export const metadata: Metadata = { title: "Plan: your gap skills" };

export default async function PlanPage() {
  const store = getStore();
  const [{ gaps, targetCode, targetTitle }, ratings, built, lessons] = await Promise.all([
    getGapSkills(),
    store.getRatings(),
    store.isPlanBuilt(),
    store.listLessons(),
  ]);

  return (
    <div className="stack-lg">
      <div className="page-head">
        <p className="stage-label">
          Stage 2 of 4 · Plan · target {targetCode} {targetTitle}
        </p>
        <h1>Your gap skills for {targetTitle}</h1>
        <p>Be honest here. Your answers only decide what you practise first, and nobody else sees them.</p>
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
