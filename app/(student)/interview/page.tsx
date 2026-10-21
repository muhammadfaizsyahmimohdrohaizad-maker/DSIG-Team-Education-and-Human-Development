import type { Metadata } from "next";
import Link from "next/link";
import { btn } from "@/components/ui/button";
import { AnswerForm } from "@/features/interview/answer-form";
import { PracticeTabs } from "@/features/practice/practice-tabs";
import { getInterview } from "@/server/engines/interview";

export const metadata: Metadata = { title: "Mock interview: System Tester" };

type Props = { searchParams: Promise<{ q?: string; demo?: string }> };

export default async function InterviewPage({ searchParams }: Props) {
  const { q, demo } = await searchParams;
  const { questions, title } = await getInterview();
  const index = Math.min(Math.max(Number.parseInt(q ?? "1", 10) || 1, 1), questions.length);
  const question = questions[index - 1];

  return (
    <div className="stack-lg">
      <div className="page-head">
        <p className="stage-label">Stage 3 of 4 · Practice · Interview</p>
        <h1>Mock interview: {title}</h1>
        <p>
          Answer the way you would in a real interview. Each question comes from a task MASCO lists for this job. If it helps,
          follow the STAR shape: situation, task, action, result.
        </p>
      </div>
      <PracticeTabs current="interview" />
      <AnswerForm
        key={question.id}
        questionId={question.id}
        index={index}
        total={questions.length}
        text={question.text}
        source={question.source}
        initialAnswer={demo === "1" ? (question.demoAnswer ?? "") : ""}
      />
      <nav aria-label="Interview questions" className="row">
        {questions.map((item, i) => (
          <Link key={item.id} href={`/interview?q=${i + 1}`} className={btn(i + 1 === index ? "primary" : "secondary")} aria-current={i + 1 === index ? "step" : undefined}>
            Question {i + 1}
          </Link>
        ))}
      </nav>
    </div>
  );
}
