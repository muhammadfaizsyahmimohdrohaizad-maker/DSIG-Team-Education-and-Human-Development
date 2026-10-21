import type { Metadata } from "next";
import Link from "next/link";
import { btn } from "@/components/ui/button";
import { AnswerForm } from "@/features/interview/answer-form";
import { PracticeTabs } from "@/features/practice/practice-tabs";
import { getInterview } from "@/server/engines/interview";
import { getStore } from "@/server/data";

export const metadata: Metadata = { title: "Mock interview" };

type Props = { searchParams: Promise<{ q?: string }> };

export default async function InterviewPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const [{ questions, title, occupation }, student] = await Promise.all([getInterview(), getStore().getStudent()]);
  const index = Math.min(Math.max(Number.parseInt(q ?? "1", 10) || 1, 1), questions.length);
  const question = questions[index - 1];

  return (
    <div className="stack-lg">
      <div className="page-head">
        <h1>Mock interview: {title}</h1>
        <p>
          Answer the way you would in a real interview. Each question comes from a task MASCO lists for this job. If it helps,
          follow the STAR shape: situation, task, action, result.
        </p>
      </div>
      <PracticeTabs current="interview" />
      {!student.targetCode ? (
        <p className="notice notice-info">
          You haven&apos;t chosen a target role yet, so these questions are for {occupation} {title}. Choose a target on the Matches page to
          practise for your own role.
        </p>
      ) : null}
      <AnswerForm
        key={question.id}
        questionId={question.id}
        index={index}
        total={questions.length}
        text={question.text}
        source={question.source}
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
