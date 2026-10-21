"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getStore } from "@/server/data";
import { hintFor, modelAnswerFor, rateItem, lessonBySlug } from "@/server/engines/lesson";
import { markMastery } from "@/lib/mastery/mark";
import type { Hint } from "@/lib/types";
import type { RecallRating } from "@/lib/fsrs/scheduler";

const RATINGS: RecallRating[] = ["again", "hard", "good", "easy"];

/** One hint per call. The model answer is never in this response. */
export async function requestHint(itemId: string, level: number): Promise<{ ok: true; hint: Hint } | { ok: false }> {
  if (typeof itemId !== "string" || ![1, 2, 3].includes(level)) return { ok: false };
  const hint = await hintFor(itemId, level as 1 | 2 | 3);
  return hint ? { ok: true, hint } : { ok: false };
}

/** The model answer appears only after the student presses "Check answer". */
export async function checkAnswer(itemId: string): Promise<{ ok: true; modelAnswer: string } | { ok: false }> {
  if (typeof itemId !== "string") return { ok: false };
  const modelAnswer = await modelAnswerFor(itemId);
  return modelAnswer ? { ok: true, modelAnswer } : { ok: false };
}

export async function submitRecall(itemId: string, rating: string): Promise<{ ok: true; nextReview: string } | { ok: false }> {
  if (typeof itemId !== "string" || !RATINGS.includes(rating as RecallRating)) return { ok: false };
  const result = await rateItem(itemId, rating as RecallRating);
  revalidatePath("/practice");
  return result ? { ok: true, nextReview: result.nextReview } : { ok: false };
}

/**
 * Saves a finished mastery check. The page already marked it in the browser with no network call;
 * the server marks the same picks again against its own copy of the key, so the saved result can't be forged.
 */
export async function saveMasteryResult(formData: FormData) {
  const slug = String(formData.get("slug") ?? "");
  const to = String(formData.get("to") ?? "plan");
  let picks: (number | undefined)[] = [];
  try {
    const parsed = JSON.parse(String(formData.get("picks") ?? "[]"));
    if (Array.isArray(parsed)) picks = parsed.map((p) => (Number.isInteger(p) ? p : undefined));
  } catch {
    picks = [];
  }
  const lesson = await lessonBySlug(slug);
  if (lesson && lesson.mastery.length > 0) {
    const result = markMastery(lesson.mastery, picks);
    await getStore().saveMastery(lesson.skillId, { score: result.score, total: result.total, passed: result.passed });
    revalidatePath("/practice");
  }
  redirect(to === "lesson" ? `/practice/${slug}` : "/plan");
}
