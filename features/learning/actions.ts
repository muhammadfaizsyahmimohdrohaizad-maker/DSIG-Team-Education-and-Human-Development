"use server";

// learning: lessons and the 5-question mastery check (FR-LRN-01 to FR-LRN-04). Marking is A3 and never
// calls AI. The answer key stays on the server: getCheck sends questions without it, submitCheck marks
// against the bundled content, and a failed check never reveals the right answers.
import { err, ok, type Result } from "@/lib/result";
import { checkAnswers, completeLessonInput, skillInput } from "@/lib/schemas";
import type { CheckOpen, CheckOutcome, LessonOutline } from "@/lib/types";
import type { LessonContent } from "@/content/lessons/types";
import { lessonFile } from "@/content/lessons";
import { skillKey } from "@/content/reference/keys";
import { getLessons, getSkills } from "@/server/data/reference";
import { addReviewCards, getNotes, getProgress, markLessonDone, recordCheck, setLearningState } from "@/server/data/learning";
import { checkGate, markCheck, PASS_MARK } from "@/server/engines/lesson";
import { newCard } from "@/server/engines/schedule";
import { invalid, withUser } from "@/features/matches/run";

const filesFor = (uri: string) => {
  const key = skillKey(uri);
  return key ? lessonFile(key) : undefined;
};

export type LessonPage = {
  skill: string;
  skillTitle: string;
  lesson: LessonContent;
  done: boolean;
  notes: string;
  outline: LessonOutline[];
};

/** One lesson's body, the student's notes for it and the skill's lesson list. */
export async function getLesson(input: unknown): Promise<Result<LessonPage>> {
  const parsed = completeLessonInput.pick({ skill: true, lessonNo: true }).safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const { skill, lessonNo } = parsed.data;
  return withUser("getLesson", async (userId) => {
    const file = filesFor(skill);
    const lesson = file?.lessons.find((l) => l.no === lessonNo);
    const row = (await getLessons()).find((l) => l.skillUri === skill && l.no === lessonNo);
    if (!file || !lesson || !row) return err("NOT_FOUND", "That lesson is not written yet.");
    const [progress, notes] = await Promise.all([getProgress(userId), getNotes(userId, [row.id])]);
    const done = progress.get(skill)?.lessonsDone ?? [];
    return ok({
      skill,
      skillTitle: file.title,
      lesson,
      done: done.includes(lessonNo),
      notes: notes.get(row.id) ?? "",
      outline: file.lessons.map((l) => ({ no: l.no, title: l.title, minutes: l.minutes, done: done.includes(l.no) })),
    });
  });
}

/** Marks a lesson done (again, for a retake) and keeps the notes. */
export async function completeLesson(input: unknown): Promise<Result<{ lessonNo: number; nextLesson?: number; checkOpen: boolean }>> {
  const parsed = completeLessonInput.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const { skill, lessonNo, notes } = parsed.data;
  return withUser("completeLesson", async (userId) => {
    const row = (await getLessons()).find((l) => l.skillUri === skill && l.no === lessonNo);
    if (!row) return err("NOT_FOUND", "That lesson is not written yet.");
    const before = (await getProgress(userId)).get(skill);
    const doneAt = await markLessonDone(userId, row.id, notes);
    if (!before?.claimed && (before?.bestCheckScore ?? 0) < PASS_MARK) await setLearningState(userId, skill);

    const lessonsDone = [...new Set([...(before?.lessonsDone ?? []), lessonNo])];
    const lessonDoneAt = new Map(before?.lessonDoneAt ?? []).set(lessonNo, doneAt);
    const gate = checkGate({ claimed: before?.claimed ?? false, lessonsDone, lessonDoneAt, latestCheck: before?.latestCheck });
    return ok({ lessonNo, nextLesson: [1, 2, 3, 4].find((n) => !lessonsDone.includes(n)), checkOpen: gate.open });
  });
}

/** The five questions without their answer key, or which lesson to finish first. */
export async function getCheck(input: unknown): Promise<Result<CheckOpen>> {
  const parsed = skillInput.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const { skill } = parsed.data;
  return withUser<CheckOpen>("getCheck", async (userId) => {
    const file = filesFor(skill);
    if (!file) return err("NOT_FOUND", "The check for this skill is not written yet.");
    const p = (await getProgress(userId)).get(skill);
    const gate = checkGate({ claimed: p?.claimed ?? false, lessonsDone: p?.lessonsDone ?? [], lessonDoneAt: p?.lessonDoneAt ?? new Map(), latestCheck: p?.latestCheck });
    if (!gate.open) return ok({ open: false, skill, title: file.title, finishLesson: gate.finishLesson, reason: gate.reason });
    return ok({
      open: true,
      skill,
      title: file.title,
      questions: file.check.map((q) => ({ id: q.id, lessonNo: q.lesson, prompt: q.prompt, options: q.options })),
    });
  });
}

/** Marks the check (pass at 4 of 5). On a pass, adds the skill's review cards; on a fail, names the lesson to redo. */
export async function submitCheck(input: unknown): Promise<Result<CheckOutcome>> {
  const parsed = checkAnswers.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const { skill, answers } = parsed.data;
  return withUser("submitCheck", async (userId) => {
    const file = filesFor(skill);
    if (!file) return err("NOT_FOUND", "The check for this skill is not written yet.");
    const p = (await getProgress(userId)).get(skill);
    const gate = checkGate({ claimed: p?.claimed ?? false, lessonsDone: p?.lessonsDone ?? [], lessonDoneAt: p?.lessonDoneAt ?? new Map(), latestCheck: p?.latestCheck });
    if (!gate.open) return err("CONFLICT", `Finish lesson ${gate.finishLesson} before taking the check.`);

    const result = markCheck(answers, file.check.map((q) => ({ id: q.id, lessonNo: q.lesson, answerKey: q.answer })));
    await recordCheck(userId, skill, result.score, result.retakeAfterLesson);

    let reviewCardsAdded = 0;
    if (result.passed) {
      const now = new Date();
      reviewCardsAdded = await addReviewCards(userId, skill, file.review_cards.map((c) => {
        const card = newCard(now);
        return { front: c.front, back: c.back, fsrs: card, due: card.due };
      }));
    }

    const byId = new Map(file.check.map((q) => [q.id, q]));
    return ok({
      score: result.score,
      passed: result.passed,
      retakeAfterLesson: result.retakeAfterLesson,
      reviewCardsAdded,
      missed: result.missed.map((id) => {
        const q = byId.get(id)!;
        const base = { id, lessonNo: q.lesson, prompt: q.prompt };
        if (!result.passed) return base;
        return { ...base, answer: q.options.find((o) => o.id === q.answer)?.text ?? "", explanation: q.explanation };
      }),
    });
  });
}

/** All lesson notes as one Markdown file, grouped by skill and lesson. */
export async function exportNotes(): Promise<Result<{ filename: string; markdown: string }>> {
  return withUser("exportNotes", async (userId) => {
    const lessons = await getLessons();
    const [notes, skills] = await Promise.all([getNotes(userId, lessons.map((l) => l.id)), getSkills()]);
    const parts: string[] = ["# My CareerPrep notes", ""];
    for (const uri of [...new Set(lessons.map((l) => l.skillUri))]) {
      const own = lessons.filter((l) => l.skillUri === uri && notes.has(l.id));
      if (!own.length) continue;
      parts.push(`## ${skills.get(uri)?.label ?? uri}`, "");
      for (const l of own) parts.push(`### Lesson ${l.no}: ${l.title}`, "", notes.get(l.id)!, "");
    }
    if (parts.length === 2) return err("NOT_FOUND", "You have no notes yet. Notes you write in a lesson appear here.");
    return ok({ filename: "careerprep-notes.md", markdown: parts.join("\n") });
  });
}
