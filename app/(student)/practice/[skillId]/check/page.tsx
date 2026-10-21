import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { btn } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { MasteryCheck } from "@/features/practice/mastery-check";
import { lessonBySlug } from "@/server/engines/lesson";
import { getStore } from "@/server/data";

type Params = { params: Promise<{ skillId: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { skillId } = await params;
  const lesson = await lessonBySlug(skillId);
  return { title: lesson ? `Mastery check: ${lesson.label}` : "Mastery check" };
}

export default async function MasteryPage({ params }: Params) {
  const { skillId } = await params;
  const lesson = await lessonBySlug(skillId);
  if (!lesson) notFound();
  const store = getStore();
  const [mastery, reviewed] = await Promise.all([store.getMastery(), store.listReviewTimes()]);
  const last = mastery[lesson.skillId];
  // After a failed check, the next lesson comes first: a retake opens once any of this skill's questions is reviewed again.
  const lessonSince = !!last?.takenAt && lesson.items.some((i) => (reviewed[i.id] ?? "") > last.takenAt!);
  const mustWait = !!last && !last.passed && !lessonSince;

  return (
    <div className="stack-lg">
      <div className="page-head">
        <h1>Mastery check: {lesson.label}</h1>
        <p>
          <span className="chip chip-completed">AI is off</span>
        </p>
        <p>No hints and no timer. You need 4 of 5. Your answers are marked against a fixed answer key, so the result is yours alone. Only this check can mark a skill as mastered.</p>
      </div>
      {mustWait ? (
        <Card flush>
          <EmptyState
            title="Do your next lesson first"
            action={<Link href={`/practice/${lesson.slug}`} className={btn("primary")}>Go to the lesson</Link>}
          >
            Last time you got {last!.score} of {last!.total}. Practise this skill once more, then the check opens again.
          </EmptyState>
        </Card>
      ) : lesson.mastery.length === 0 ? (
        <Card flush>
          <EmptyState
            title="This check is still being written"
            action={<Link href="/practice" className={btn("secondary")}>Back to today&apos;s practice</Link>}
          >
            The five questions and their answer key for {lesson.label} are not ready yet.
          </EmptyState>
        </Card>
      ) : (
        <MasteryCheck slug={lesson.slug} questions={lesson.mastery} />
      )}
    </div>
  );
}
