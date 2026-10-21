import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { btn } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { LessonRunner } from "@/features/practice/lesson-runner";
import { lessonBySlug } from "@/server/engines/lesson";

type Params = { params: Promise<{ skillId: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { skillId } = await params;
  const lesson = await lessonBySlug(skillId);
  return { title: lesson ? `Practice: ${lesson.label}` : "Practice" };
}

export default async function LessonPage({ params }: Params) {
  const { skillId } = await params;
  const lesson = await lessonBySlug(skillId);
  if (!lesson) notFound();

  return (
    <div className="stack-lg">
      <div className="page-head">
        <p className="stage-label">Stage 3 of 4 · Practice</p>
        <h1>{lesson.label}</h1>
      </div>
      {lesson.items.length === 0 ? (
        <Card flush>
          <EmptyState
            title="Questions for this skill are still being written"
            action={
              <div className="row">
                <Link href="/bookings/new" className={btn("primary")}>Talk to a human</Link>
                <Link href="/practice" className={btn("secondary")}>Back to today&apos;s practice</Link>
              </div>
            }
          >
            The team is preparing the recall questions for {lesson.label}. An adviser can help you with it in the meantime.
          </EmptyState>
        </Card>
      ) : (
        <LessonRunner
          slug={lesson.slug}
          skillLabel={lesson.label}
          items={lesson.items.map((i) => ({ id: i.id, question: i.question }))}
          hasMastery={lesson.mastery.length > 0}
        />
      )}
    </div>
  );
}
