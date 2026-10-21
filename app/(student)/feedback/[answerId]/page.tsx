import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { btn } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StarList } from "@/features/feedback/star-list";
import { WeakAreaButton } from "@/features/feedback/weak-area-button";
import { feedbackFor } from "@/server/engines/feedback";

export const metadata: Metadata = { title: "Feedback on your answer" };

type Params = { params: Promise<{ answerId: string }> };

export default async function FeedbackPage({ params }: Params) {
  const { answerId } = await params;
  const result = await feedbackFor(answerId);
  if (!result) notFound();
  const { answer, question, feedback, weakAreaAdded } = result;

  return (
    <div className="stack-lg">
      <div className="page-head">
        <p className="stage-label">Stage 4 of 4 · Feedback · System Tester interview, {question ? `question ${question.id.replace("q", "")}` : "your answer"}</p>
        <h1>Feedback on your answer</h1>
        <p>There is no score here. The notes below are about this one answer, so you know exactly what to change next time.</p>
      </div>

      <Card className="stack">
        <h2 style={{ fontSize: "var(--text-h3)" }}>{question?.text}</h2>
        <details>
          <summary style={{ cursor: "pointer", minHeight: 44, display: "flex", alignItems: "center", fontWeight: 500 }}>Show your answer</summary>
          <p className="prose pre-line" style={{ marginTop: 8 }}>{answer.text}</p>
        </details>
      </Card>

      {feedback ? (
        <>
          <section className="stack" aria-labelledby="star-title">
            <h2 id="star-title">Structure (STAR)</h2>
            <StarList parts={feedback.star} />
          </section>
          <section className="stack-sm" aria-labelledby="evidence-title">
            <h2 id="evidence-title">Evidence</h2>
            <p className="prose">{feedback.evidence}</p>
          </section>
          <section className="stack-sm" aria-labelledby="tech-title">
            <h2 id="tech-title">Technical accuracy</h2>
            <p className="prose">{feedback.technicalAccuracy}</p>
          </section>
          <section className="stack-sm" aria-labelledby="next-title">
            <h2 id="next-title">One next step</h2>
            <p className="prose">{feedback.nextStep}</p>
          </section>
          <div className="stack">
            <WeakAreaButton answerId={answer.id} label={feedback.weakArea.label} initiallyAdded={weakAreaAdded} />
            <div className="row">
              <Link href="/bookings/new" className={btn("secondary")}>Talk to a human</Link>
              <Link href="/interview?q=2" className={btn("secondary")}>Try question 2</Link>
            </div>
          </div>
          <p className="meta prose">
            Feedback was written by AI from this answer only, checked against the task list for 2519-01. If something looks wrong, an adviser can go through it with you.
          </p>
        </>
      ) : (
        <Card className="stack">
          <h2>No feedback for this question yet</h2>
          <p className="prose">
            The demo only has recorded feedback for question 1. Try that one, or ask an adviser to go through your answer with you.
          </p>
          <div className="row">
            <Link href="/interview?q=1" className={btn("primary")}>Try question 1</Link>
            <Link href="/bookings/new" className={btn("secondary")}>Talk to a human</Link>
          </div>
        </Card>
      )}
    </div>
  );
}
