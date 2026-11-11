"use client";
import { useState } from "react";
import type { CheckOpen, CheckOutcome } from "@/lib/types";
import { submitCheck } from "./actions";
import { ActionForm } from "@/components/action-form";
import { Panel, RouteLink } from "@/components/workspace-page";

export function MasteryCheck({
  check,
  skillKey,
}: {
  check: Extract<CheckOpen, { open: true }>;
  skillKey: string;
}) {
  const [outcome, setOutcome] = useState<CheckOutcome>();
  if (outcome)
    return (
      <Panel>
        <h2>{outcome.passed ? "Skill mastered" : "Review and retry"}</h2>
        <p>You scored {outcome.score} out of 5.</p>
        {outcome.missed.map((q) => (
          <p key={q.id}>
            {q.prompt} · Lesson {q.lessonNo}. {q.explanation}
          </p>
        ))}
        {outcome.retakeAfterLesson && (
          <RouteLink href={"/plan/learn/" + skillKey + "/" + outcome.retakeAfterLesson}>
            Redo lesson {outcome.retakeAfterLesson}
          </RouteLink>
        )}
        {outcome.passed && <RouteLink href="/plan/interview">Practise a mock interview</RouteLink>}
      </Panel>
    );
  async function mark(data: FormData) {
    const r = await submitCheck({
      skill: check.skill,
      answers: check.questions.map((q) => String(data.get(q.id))),
    });
    if (!r.ok) return r.error.message;
    setOutcome(r.value);
    return "";
  }
  return (
    <ActionForm submit={mark} label="Check my answers">
      {check.questions.map((q) => (
        <fieldset key={q.id} className="w-full rounded-card border border-hairline bg-white p-4">
          <legend className="font-semibold">{q.prompt}</legend>
          {q.options.map((o) => (
            <label className="block py-2" key={o.id}>
              <input type="radio" required name={q.id} value={o.id} /> {o.text}
            </label>
          ))}
        </fieldset>
      ))}
    </ActionForm>
  );
}
