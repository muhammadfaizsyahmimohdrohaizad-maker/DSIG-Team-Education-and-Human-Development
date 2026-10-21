"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { Button, btn } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ErrorBanner } from "@/components/ui/error-banner";
import { Field } from "@/components/ui/field";
import { useAnnounce } from "@/components/ui/live-region";
import { dayMonth } from "@/lib/date";
import type { Hint } from "@/lib/types";
import { checkAnswer, requestHint, submitRecall } from "./actions";
import { HintLadder } from "./hint-ladder";
import { RecallRating } from "./recall-rating";

type Item = { id: string; question: string };

export function LessonRunner({ slug, skillLabel, items, hasMastery }: { slug: string; skillLabel: string; items: Item[]; hasMastery: boolean }) {
  const [idx, setIdx] = useState(0);
  const [answer, setAnswer] = useState("");
  const [hints, setHints] = useState<Hint[]>([]);
  const [modelAnswer, setModelAnswer] = useState<string | null>(null);
  const [rating, setRating] = useState<string | null>(null);
  const [ratingError, setRatingError] = useState<string | null>(null);
  const [nextReview, setNextReview] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);
  const [busy, setBusy] = useState<"hint" | "check" | "save" | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const announce = useAnnounce();
  const heading = useRef<HTMLHeadingElement>(null);

  const item = items[idx];
  const isLast = idx === items.length - 1;

  async function showHint() {
    setBusy("hint");
    setProblem(null);
    try {
      const res = await requestHint(item.id, hints.length + 1);
      if (res.ok) {
        setHints((h) => [...h, res.hint]);
        announce(`Hint ${res.hint.level}, ${res.hint.title}.`);
      } else setProblem("We couldn't load a hint. Check your connection and try again.");
    } catch {
      setProblem("We couldn't load a hint. Check your connection and try again.");
    } finally {
      setBusy(null);
    }
  }

  async function check() {
    setBusy("check");
    setProblem(null);
    try {
      const res = await checkAnswer(item.id);
      if (res.ok) {
        setModelAnswer(res.modelAnswer);
        announce("Model answer shown below.");
      } else setProblem("We couldn't load the model answer. Check your connection and try again.");
    } catch {
      setProblem("We couldn't load the model answer. Check your connection and try again.");
    } finally {
      setBusy(null);
    }
  }

  async function save() {
    if (!rating) {
      setRatingError("Choose how it went.");
      return;
    }
    setBusy("save");
    setProblem(null);
    try {
      const res = await submitRecall(item.id, rating);
      if (res.ok) {
        setNextReview(res.nextReview);
        announce(`Saved. Next review: ${dayMonth(res.nextReview)}.`);
      } else setProblem("We couldn't save your answer. Check your connection and try again.");
    } catch {
      setProblem("We couldn't save your answer. Check your connection and try again.");
    } finally {
      setBusy(null);
    }
  }

  function next() {
    if (isLast) {
      setFinished(true);
      return;
    }
    setIdx(idx + 1);
    setAnswer("");
    setHints([]);
    setModelAnswer(null);
    setRating(null);
    setRatingError(null);
    setNextReview(null);
    setProblem(null);
    requestAnimationFrame(() => heading.current?.focus());
  }

  if (finished) {
    return (
      <Card className="stack">
        <h2>Lesson done</h2>
        <p className="prose">
          You went through {items.length} {items.length === 1 ? "question" : "questions"} on {skillLabel}. They come back on the
          dates shown on your Today page.
        </p>
        <div className="row">
          {hasMastery ? (
            <Link href={`/practice/${slug}/check`} className={btn("primary")}>
              Take the mastery check
            </Link>
          ) : null}
          <Link href="/practice" className={btn("secondary")}>
            Back to today&apos;s practice
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <Card className="stack" aria-labelledby="q-title">
      <p className="progress-text">
        Question {idx + 1} of {items.length}
      </p>
      <h2 id="q-title" className="q-text" tabIndex={-1} ref={heading} style={{ fontWeight: 500 }}>
        {item.question}
      </h2>

      <Field id="your-answer" label="Your answer" helper="Take your time. There is no timer, and a rough answer is fine.">
        {(p) => (
          <textarea {...p} value={answer} onChange={(e) => setAnswer(e.target.value)} readOnly={modelAnswer !== null} />
        )}
      </Field>

      <HintLadder hints={hints} />

      {problem ? <ErrorBanner message={problem} /> : null}

      {modelAnswer === null ? (
        <div className="stack-sm">
          <div className="row">
            <Button variant="primary" onClick={check} busy={busy === "check"}>
              Check answer
            </Button>
            {hints.length < 3 ? (
              <Button variant="secondary" onClick={showHint} busy={busy === "hint"}>
                {hints.length === 0 ? "Show a hint (1 of 3)" : `Show another hint (${hints.length + 1} of 3)`}
              </Button>
            ) : null}
          </div>
          <p className="secondary muted">Hints get more specific each time. The model answer only appears after you check.</p>
        </div>
      ) : (
        <div className="stack">
          <section className="card stack-sm" aria-labelledby="model-title" style={{ background: "var(--accent-tint)" }}>
            <h3 id="model-title">Model answer</h3>
            <p className="prose pre-line">{modelAnswer}</p>
          </section>

          {nextReview === null ? (
            <>
              <RecallRating value={rating} onChange={(v) => { setRating(v); setRatingError(null); }} error={ratingError} />
              <div>
                <Button variant="primary" onClick={save} busy={busy === "save"}>
                  Save and continue
                </Button>
              </div>
            </>
          ) : (
            <div className="stack">
              <div className="notice notice-ok">
                <div className="stack-sm">
                  <p style={{ fontWeight: 500 }}>Saved. Next review: {dayMonth(nextReview)}</p>
                  <p className="secondary">Scheduled with FSRS, a spaced-repetition method that brings a question back just before you would forget it.</p>
                </div>
              </div>
              <div className="row">
                <Button variant="primary" onClick={next}>
                  {isLast ? "Finish lesson" : `Go to question ${idx + 2}`}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
