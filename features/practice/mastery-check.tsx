"use client";

import { useRef, useState } from "react";
import { Button, btn } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAnnounce } from "@/components/ui/live-region";
import { markMastery } from "@/lib/mastery/mark";
import type { MasteryQuestion } from "@/lib/types";
import { saveMasteryResult } from "./actions";

/**
 * Marks entirely in the browser against the key the page was given: no network call and no LLM.
 * Saving the finished result is a separate, explicit step on the result screen.
 */
export function MasteryCheck({ slug, questions }: { slug: string; questions: MasteryQuestion[] }) {
  const [idx, setIdx] = useState(0);
  const [picks, setPicks] = useState<(number | undefined)[]>([]);
  const [needPick, setNeedPick] = useState(false);
  const announce = useAnnounce();
  const heading = useRef<HTMLLegendElement>(null);
  const done = idx >= questions.length;

  if (done) {
    const result = markMastery(questions, picks);
    return (
      <div className="stack-lg">
        <Card className="stack" aria-labelledby="result-title">
          <h2 id="result-title">
            {result.passed
              ? `${result.score} of ${result.total} correct. You passed.`
              : `${result.score} of ${result.total} correct. Retake the check after your next lesson.`}
          </h2>
          <p className="prose">
            {result.passed
              ? "This skill now counts as mastered. It still comes back for the odd review, and if you slip on one it goes back to learning."
              : "Nothing is lost. Your next lesson focuses on the questions below that you missed."}
          </p>
        </Card>

        <section className="stack" aria-labelledby="answers-title">
          <div className="stack-sm">
            <h3 id="answers-title">Your answers</h3>
            <p className="secondary muted">Each question with your answer and the answer key</p>
          </div>
          <div className="table-frame">
            <table>
              <thead>
                <tr>
                  <th scope="col">Question</th>
                  <th scope="col">Your answer</th>
                  <th scope="col">Answer key</th>
                </tr>
              </thead>
              <tbody>
                {result.rows.map((r) => (
                  <tr key={r.n}>
                    <th scope="row">
                      {r.n}. {r.question}
                    </th>
                    <td>
                      {r.mine} <span className="muted">{r.correct ? "(correct)" : "(not correct)"}</span>
                    </td>
                    <td>{r.key}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <form action={saveMasteryResult} className="row">
          <input type="hidden" name="slug" value={slug} />
          <input type="hidden" name="picks" value={JSON.stringify(picks.map((p) => p ?? null))} />
          <button type="submit" name="to" value="plan" className={btn("primary")}>
            Back to my plan
          </button>
          {!result.passed ? (
            <button type="submit" name="to" value="lesson" className={btn("secondary")}>
              Start next lesson
            </button>
          ) : null}
        </form>
        <p className="meta">Marked against the answer key. No AI was used.</p>
      </div>
    );
  }

  const q = questions[idx];

  function saveAnswer() {
    if (picks[idx] === undefined) {
      setNeedPick(true);
      announce("Choose an answer to carry on.");
      return;
    }
    const n = idx + 1;
    setIdx(n);
    setNeedPick(false);
    announce(n >= questions.length ? "Check finished." : `Answer saved. Question ${n + 1} of ${questions.length}.`);
    requestAnimationFrame(() => heading.current?.focus());
  }

  return (
    <Card className="stack" aria-labelledby="mq-title">
      <p className="progress-text">
        Question {idx + 1} of {questions.length}
      </p>
      <fieldset className="stack">
        <legend className="q-text" id="mq-title" tabIndex={-1} ref={heading} style={{ fontWeight: 500 }}>
          {q.text}
        </legend>
        <div className="choices" aria-describedby={needPick ? "pick-note" : undefined}>
          {q.options.map((opt, j) => (
            <label key={opt} className="choice">
              <input
                type="radio"
                name={`mq-${idx}`}
                checked={picks[idx] === j}
                onChange={() => {
                  const next = picks.slice();
                  next[idx] = j;
                  setPicks(next);
                  setNeedPick(false);
                }}
              />
              <span>{opt}</span>
            </label>
          ))}
        </div>
        {needPick ? (
          <p id="pick-note" className="field-error" role="alert">
            Choose an answer to carry on.
          </p>
        ) : null}
      </fieldset>
      <div className="stack-sm">
        <div>
          <Button variant="primary" onClick={saveAnswer}>
            {idx === questions.length - 1 ? "Finish the check" : "Save answer"}
          </Button>
        </div>
        <p className="secondary muted">No timer. You can leave and come back.</p>
      </div>
    </Card>
  );
}
