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
  const { answer, question, feedback, weakAreaAdded, aiAllowed, questionNumber, questionCount, occupationTitle } = result;
  const next = questionNumber >= questionCount ? 1 : questionNumber + 1;

  return (
    <div className="stack-lg">
      <div className="page-head">
        <p className="stage-label">
          Mock interview for {occupationTitle}, question {questionNumber}
        </p>
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
          <p className="notice notice-info">
            Written by AI from this answer only. It can be wrong. It is about your answer, not about you, and there is no grade.
          </p>
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
              <Link href={`/interview?q=${next}`} className={btn("secondary")}>Try question {next}</Link>
            </div>
          </div>
        </>
      ) : (
        <Card className="stack" aria-labelledby="na-title">
          <p>
            <span className="chip chip-warn">Needs adviser</span>
          </p>
          <h2 id="na-title">An adviser should look at this answer</h2>
          <p className="prose">
            {aiAllowed
              ? "The AI couldn't write feedback that passed our checks, so we won't show you anything unreliable. Your answer is saved."
              : "You chose not to send your answers to an AI provider, so there is no AI feedback. Your answer is saved."}{" "}
            A career adviser can go through it with you.
          </p>
          <div className="row">
            <Link href="/bookings/new" className={btn("primary")}>Talk to a human</Link>
            <Link href={`/interview?q=${next}`} className={btn("secondary")}>Try question {next}</Link>
          </div>
        </Card>
      )}
    </div>
  );
}
