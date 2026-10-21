"use client";

import { useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { useAnnounce } from "@/components/ui/live-region";
import { RadioScale } from "@/components/ui/radio-scale";
import { dailyLoad } from "@/lib/plan/order-gaps";
import { saveRatings } from "./actions";
import { PlanList, type PlanGap } from "./plan-list";

export function ConfidenceForm({
  gaps,
  initialRatings,
  initialBuilt,
}: {
  gaps: PlanGap[];
  initialRatings: Record<string, number>;
  initialBuilt: boolean;
}) {
  const [ratings, setRatings] = useState(initialRatings);
  const [built, setBuilt] = useState(initialBuilt);
  const [tried, setTried] = useState(false);
  const [, startTransition] = useTransition();
  const refs = useRef<Record<string, HTMLFieldSetElement | null>>({});
  const announce = useAnnounce();

  const allRated = gaps.every((g) => ratings[g.id]);

  function announcePlan(next: Record<string, number>) {
    const load = dailyLoad(gaps.map((g) => next[g.id]));
    announce(`Plan updated: ${gaps.length} skills, about ${load.minutes} minutes a day.`);
  }

  function persist(next: Record<string, number>, isBuilt: boolean) {
    startTransition(async () => {
      try {
        await saveRatings(next, isBuilt);
      } catch {
        announce("We couldn't save your ratings. Check your connection and try again.");
      }
    });
  }

  function rate(id: string, value: number) {
    const next = { ...ratings, [id]: value };
    setRatings(next);
    const done = gaps.every((g) => next[g.id]);
    persist(next, built && done);
    if (built && done) announcePlan(next);
  }

  function build() {
    const first = gaps.find((g) => !ratings[g.id]);
    if (first) {
      setTried(true);
      refs.current[first.id]?.focus();
      announce("Choose a number from 1 to 5 for each skill.");
      return;
    }
    setBuilt(true);
    persist(ratings, true);
    announcePlan(ratings);
  }

  return (
    <div className="cols split">
      <Card aria-labelledby="rate-title" className="stack">
        <div className="stack-sm">
          <h2 id="rate-title">How confident are you today?</h2>
        </div>
        {gaps.map((g) => (
          <RadioScale
            key={g.id}
            name={`conf-${g.id}`}
            legend={g.label}
            helper={g.note || "How confident are you with this today?"}
            value={ratings[g.id]}
            onChange={(v) => rate(g.id, v)}
            error={tried && !ratings[g.id] ? "Choose a number from 1 to 5." : null}
            fieldsetRef={(el) => {
              refs.current[g.id] = el;
            }}
          />
        ))}
        <div className="stack-sm">
          <div>
            <Button variant="primary" onClick={build} type="button">
              Build my plan
            </Button>
          </div>
          <p className="secondary muted">You can change these any time. The plan updates straight away.</p>
        </div>
      </Card>

      <Card aria-labelledby="plan-title" flush>
        <div style={{ padding: "var(--space-4) var(--space-4) 0" }} className="stack-sm">
          <h2 id="plan-title">Your 5-minute plan</h2>
          <p className="secondary muted">Weakest skill first. Reviews come back on the day you are about to forget them.</p>
        </div>
        {built && allRated ? (
          <PlanList gaps={gaps} ratings={ratings} />
        ) : (
          <EmptyState title="No plan yet" level={3}>
            Rate each skill, then build your plan. It takes about a minute.
          </EmptyState>
        )}
      </Card>
    </div>
  );
}
