import Link from "next/link";
import { btn } from "@/components/ui/button";
import { dailyLoad, orderGaps, questionsPerDay } from "@/lib/plan/order-gaps";

export type PlanGap = { id: string; label: string; note: string; essential: boolean; slug: string };

export function PlanList({ gaps, ratings }: { gaps: PlanGap[]; ratings: Record<string, number> }) {
  const rated = gaps.filter((g) => ratings[g.id]);
  const ordered = orderGaps(rated.map((g) => ({ ...g, skillId: g.id, rating: ratings[g.id] })));
  const load = dailyLoad(ordered.map((g) => g.rating));

  return (
    <div className="stack">
      <ol className="divided">
        {ordered.map((g, i) => (
          <li key={g.id} className="row-between">
            <div className="stack-sm">
              <h3 style={{ fontSize: "var(--text-body)", fontWeight: 600 }}>
                {i + 1}. {g.label}
              </h3>
              <p className="secondary muted">
                Today: {questionsPerDay(g.rating)} recall {questionsPerDay(g.rating) === 1 ? "question" : "questions"} · you rated yourself {g.rating} of 5
              </p>
            </div>
            <Link href={`/practice/${g.slug}`} className={btn("secondary")}>
              Start lesson
            </Link>
          </li>
        ))}
      </ol>
      <p className="secondary muted" style={{ padding: "0 var(--space-4) var(--space-4)" }}>
        {load.questions} questions, about {load.minutes} minutes a day. No streaks, no timers.
      </p>
    </div>
  );
}
