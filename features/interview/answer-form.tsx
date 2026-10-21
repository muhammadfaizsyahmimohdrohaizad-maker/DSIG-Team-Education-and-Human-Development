"use client";

import { useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { sendAnswer } from "./actions";

export function AnswerForm({
  questionId,
  index,
  total,
  text,
  source,
  initialAnswer,
}: {
  questionId: string;
  index: number;
  total: number;
  text: string;
  source: string;
  initialAnswer: string;
}) {
  const [answer, setAnswer] = useState(initialAnswer);
  const [error, setError] = useState<string | null>(null);
  const ref = useRef<HTMLTextAreaElement>(null);

  return (
    <Card className="stack" aria-labelledby="iq-title">
      <p className="progress-text">
        Question {index} of {total}
      </p>
      <h2 id="iq-title" className="q-text" style={{ fontWeight: 500 }}>
        {text}
      </h2>
      <p className="meta">Source: {source}</p>

      <form
        action={sendAnswer}
        className="stack"
        onSubmit={(e) => {
          if (!answer.trim()) {
            e.preventDefault();
            setError("Write a few sentences first. A rough answer is fine.");
            ref.current?.focus();
          }
        }}
      >
        <input type="hidden" name="questionId" value={questionId} />
        <Field id="interview-answer" label="Your answer" error={error}>
          {(p) => (
            <textarea
              {...p}
              ref={ref}
              name="answer"
              rows={8}
              value={answer}
              onChange={(e) => {
                setAnswer(e.target.value);
                if (error) setError(null);
              }}
            />
          )}
        </Field>
        <p className="meta" role="status">
          {answer.length} characters. There is no limit and no timer.
        </p>
        <div className="row">
          <SubmitButton>Send answer</SubmitButton>
          <button type="button" className="btn btn-secondary" disabled aria-describedby="dictate-note">
            Dictate answer (Chrome only)
          </button>
        </div>
        <p id="dictate-note" className="secondary muted">
          Dictation is not available in this demo. Typing works on any device, and audio is never stored.
        </p>
      </form>
    </Card>
  );
}
