import "server-only";
// D4 learning progress: skill claims, lessons done, mastery checks, review cards, saved study options.
import { adminDb, db } from "./supabase.ts";
import { getLessons } from "./reference.ts";
import type { SkillProgress, SkillState } from "../../lib/types.ts";
import type { Json } from "../../lib/database.types.ts";

function fail(what: string, error: { message: string }): never {
  throw new Error(`learning: ${what}: ${error.message}`);
}

export type LatestCheck = { score: number; retakeAfterLesson?: number; takenAt: Date };
export type SkillProgressDetail = SkillProgress & {
  lessonDoneAt: Map<number, Date>;
  latestCheck?: LatestCheck;
  masteredAt?: Date;
};

/** Everything A2 and A3 need, for every skill the student has touched. */
export async function getProgress(userId: string): Promise<Map<string, SkillProgressDetail>> {
  const client = await db();
  const [claims, lessonsDone, checks, lessons] = await Promise.all([
    client.from("skill_progress").select("skill_uri, claimed, evidence_note").eq("user_id", userId),
    client.from("lesson_progress").select("lesson_id, done_at").eq("user_id", userId).not("done_at", "is", null),
    client.from("mastery_checks").select("skill_uri, score, retake_after_lesson, taken_at").eq("user_id", userId).order("taken_at", { ascending: false }),
    getLessons(),
  ]);
  if (claims.error) fail("claims", claims.error);
  if (lessonsDone.error) fail("lessons done", lessonsDone.error);
  if (checks.error) fail("checks", checks.error);

  const out = new Map<string, SkillProgressDetail>();
  const get = (uri: string): SkillProgressDetail => {
    let p = out.get(uri);
    if (!p) { p = { skill: uri, claimed: false, lessonsDone: [], lessonDoneAt: new Map() }; out.set(uri, p); }
    return p;
  };

  for (const c of claims.data) {
    const progress = get(c.skill_uri);
    progress.claimed = c.claimed;
    progress.evidenceNote = c.evidence_note ?? undefined;
  }

  const lessonById = new Map(lessons.map((l) => [l.id, l]));
  for (const d of lessonsDone.data as { lesson_id: string; done_at: string }[]) {
    const l = lessonById.get(d.lesson_id);
    if (!l) continue;
    const p = get(l.skillUri);
    p.lessonDoneAt.set(l.no, new Date(d.done_at));
    p.lessonsDone = [...p.lessonDoneAt.keys()].sort((a, b) => a - b);
  }

  // Newest first, so the first row per skill is the latest check.
  for (const c of checks.data as { skill_uri: string; score: number; retake_after_lesson: number | null; taken_at: string }[]) {
    const p = get(c.skill_uri);
    const takenAt = new Date(c.taken_at);
    p.latestCheck ??= { score: c.score, retakeAfterLesson: c.retake_after_lesson ?? undefined, takenAt };
    if (p.bestCheckScore === undefined || c.score > p.bestCheckScore) p.bestCheckScore = c.score;
    if (c.score >= 4 && (!p.masteredAt || takenAt < p.masteredAt)) p.masteredAt = takenAt;
  }
  return out;
}

async function upsertSkillState(userId: string, uri: string, state: SkillState, claimed?: boolean): Promise<void> {
  const row = {
    user_id: userId, skill_uri: uri, state, updated_at: new Date().toISOString(),
    ...(claimed !== undefined ? { claimed } : {}),
  };
  const { error } = await (await db()).from("skill_progress").upsert(row, { onConflict: "user_id,skill_uri" });
  if (error) fail("skill state", error);
}

export async function claimSkill(userId: string, uri: string): Promise<void> {
  await upsertSkillState(userId, uri, "check_needed", true);
}

/** Marks a lesson done now (again, if it was done before: a retake needs a fresh done time) and keeps the notes. */
export async function markLessonDone(userId: string, lessonId: string, notes?: string): Promise<Date> {
  const doneAt = new Date();
  const row = { user_id: userId, lesson_id: lessonId, done_at: doneAt.toISOString(), ...(notes !== undefined ? { notes } : {}) };
  const { error } = await (await db()).from("lesson_progress").upsert(row, { onConflict: "user_id,lesson_id" });
  if (error) fail("lesson done", error);
  return doneAt;
}

export async function setLearningState(userId: string, uri: string): Promise<void> {
  await upsertSkillState(userId, uri, "learning");
}

export async function getNotes(userId: string, lessonIds: string[]): Promise<Map<string, string>> {
  if (!lessonIds.length) return new Map();
  const { data, error } = await (await db()).from("lesson_progress").select("lesson_id, notes").eq("user_id", userId).in("lesson_id", lessonIds);
  if (error) fail("notes", error);
  return new Map((data as { lesson_id: string; notes: string | null }[]).filter((n) => n.notes).map((n) => [n.lesson_id, n.notes!]));
}

/**
 * Records a marked check. Students can read mastery_checks but never write them (the score is the
 * server's), so this one insert uses the service-role client, scoped to the signed-in user's id.
 */
export async function recordCheck(userId: string, uri: string, score: number, retakeAfterLesson?: number): Promise<void> {
  const { error } = await adminDb().from("mastery_checks").insert({
    user_id: userId, skill_uri: uri, score, retake_after_lesson: retakeAfterLesson ?? null,
  });
  if (error) fail("record check", error);
  await upsertSkillState(userId, uri, score >= 4 ? "mastered" : "learning");
}

export type NewCard = { front: string; back: string; fsrs: unknown; due: Date };

/** Adds review cards for a mastered skill once; a later pass does not duplicate them. Returns how many were added. */
export async function addReviewCards(userId: string, uri: string, cards: NewCard[]): Promise<number> {
  const client = await db();
  const existing = await client.from("review_cards").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("skill_uri", uri);
  if (existing.error) fail("review cards", existing.error);
  if ((existing.count ?? 0) > 0 || cards.length === 0) return 0;
  const { error } = await client.from("review_cards").insert(cards.map((c) => ({
    user_id: userId, skill_uri: uri, front: c.front, back: c.back, fsrs: c.fsrs as Json, card_due_at: c.due.toISOString(),
  })));
  if (error) fail("add review cards", error);
  return cards.length;
}

export async function getSavedOptionIds(userId: string): Promise<string[]> {
  const { data, error } = await (await db()).from("saved_study_options").select("option_id").eq("user_id", userId);
  if (error) fail("saved options", error);
  return (data as { option_id: string }[]).map((o) => o.option_id);
}

export async function saveOption(userId: string, optionId: string): Promise<void> {
  const { error } = await (await db()).from("saved_study_options")
    .upsert({ user_id: userId, option_id: optionId }, { onConflict: "user_id,option_id", ignoreDuplicates: true });
  if (error) fail("save option", error);
}

export async function removeOption(userId: string, optionId: string): Promise<void> {
  const { error } = await (await db()).from("saved_study_options").delete().eq("user_id", userId).eq("option_id", optionId);
  if (error) fail("remove option", error);
}
