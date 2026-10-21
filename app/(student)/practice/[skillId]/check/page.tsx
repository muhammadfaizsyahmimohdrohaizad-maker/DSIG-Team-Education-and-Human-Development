import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { btn } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { MasteryCheck } from "@/features/practice/mastery-check";
import { lessonBySlug } from "@/server/engines/lesson";

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

  return (
    <div className="stack-lg">
      <div className="page-head">
        <p className="stage-label">Stage 3 of 4 · Practice</p>
        <h1>Mastery check: {lesson.label}</h1>
        <p>Hints and AI are off for this check. You need 4 of 5. Your answers are marked against a fixed answer key, so the result is yours alone.</p>
      </div>
      {lesson.mastery.length === 0 ? (
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
