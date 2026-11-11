import "server-only";
// D5 interview answers and the ref.interview_questions they answer, and the ai_calls log. Reads run as the user
// (RLS). Writes use the service role, because students must not be able to write their own marks: the RPCs
// record_interview_answer and add_ai_feedback are granted to service_role only and re-check the student, the
// marks range, age and consent. userId always comes from the signed-in session, never from the request.
import type { Json } from "../../lib/database.types.ts";
import type { InterviewRound, Marks } from "../../lib/types.ts";
import type { Rubric } from "../engines/feedback.ts";
import { adminDb, db } from "./supabase.ts";

function fail(what: string, error: { message: string }): never {
  throw new Error(`interview: ${what}: ${error.message}`);
}

/** A refusal from one of the RPCs, with the token the migration raises (forbidden, ai_not_allowed, not_found...). */
export class RpcRefused extends Error {
  constructor(public token: string, public sqlState: string | undefined) {
    super(token);
  }
}

function refused(error: { message: string; code?: string }): never {
  const token = /^[a-z_]+$/.test(error.message) ? error.message : "unexpected";
  if (token === "unexpected") fail("rpc", error);
  throw new RpcRefused(token, error.code);
}

export type Question = {
  id: string;
  code: string;
  round: InterviewRound;
  position: number;
  prompt: string;
  why: string;
  source: string;
  rubric: Rubric;
};

type QuestionRow = { id: string; code: string; round: InterviewRound; position: number; prompt: string; rubric: Json };

/**
 * The import stores the engine rubric plus "why" and "source" in the rubric column (content/interview/sets.ts).
 * Rows without key points (the seed's placeholders) are not usable and come back as null.
 */
function toQuestion(row: QuestionRow): Question | null {
  const r = row.rubric as Partial<Rubric> & { why?: string; source?: string } | null;
  if (!r || !Array.isArray(r.keyPoints) || r.keyPoints.length === 0) return null;
  return {
    id: row.id,
    code: row.code,
    round: row.round,
    position: row.position,
    prompt: row.prompt,
    why: r.why ?? "",
    source: r.source ?? "",
    rubric: {
      situation: r.situation ?? [],
      action: r.action ?? [],
      result: r.result ?? [],
      evidence: r.evidence ?? [],
      keyPoints: r.keyPoints,
    },
  };
}

const QUESTION_COLUMNS = "id, code, round, position, prompt, rubric";

/** The three questions of one round for one job, in order. Empty if the set is missing or still a placeholder. */
export async function questionsFor(code: string, round: InterviewRound): Promise<Question[]> {
  const { data, error } = await (await db()).schema("ref").from("interview_questions")
    .select(QUESTION_COLUMNS).eq("code", code).eq("round", round).order("position");
  if (error) fail("questions", error);
  const qs = (data as QuestionRow[]).map(toQuestion);
  return qs.every((q): q is Question => q !== null) ? qs : [];
}

export async function getQuestion(id: string): Promise<Question | null> {
  const { data, error } = await (await db()).schema("ref").from("interview_questions")
    .select(QUESTION_COLUMNS).eq("id", id).maybeSingle();
  if (error) fail("question", error);
  return data ? toQuestion(data as QuestionRow) : null;
}

export type Interviewee = { fullName: string; isUnder18: boolean; target?: string; projectNames: string[] };

/** What marking and the AI gate need about the student: age flag, name (for redaction), target job, project names. */
export async function getInterviewee(userId: string): Promise<Interviewee | null> {
  const client = await db();
  const [p, projects] = await Promise.all([
    client.from("profiles").select("full_name, is_under_18, target_occupation").eq("user_id", userId).maybeSingle(),
    client.from("projects").select("name").eq("user_id", userId),
  ]);
  if (p.error) fail("profile", p.error);
  if (projects.error) fail("projects", projects.error);
  if (!p.data) return null;
  return {
    fullName: p.data.full_name,
    isUnder18: p.data.is_under_18,
    target: p.data.target_occupation ?? undefined,
    projectNames: (projects.data ?? []).map((x: { name: string }) => x.name),
  };
}

/** Saves an answer with its checklist marks. Throws RpcRefused for forbidden, account_locked, not_found, answer_required. */
export async function recordAnswer(userId: string, questionId: string, text: string | null, skipped: boolean, marks: Marks): Promise<string> {
  const { data, error } = await adminDb().rpc("record_interview_answer", {
    p_user: userId,
    p_question: questionId,
    p_answer: text ?? "",
    p_skipped: skipped,
    p_marks: marks as unknown as Json,
  });
  if (error) refused(error);
  return data as string;
}

/** Stores AI feedback on an answer (sets ai_used). The database refuses it for under-18s or without AI consent. */
export async function addAiFeedback(userId: string, answerId: string, feedback: string): Promise<void> {
  const { error } = await adminDb().rpc("add_ai_feedback", { p_user: userId, p_answer: answerId, p_feedback: feedback });
  if (error) refused(error);
}

export type SavedAnswer = { id: string; questionId: string; text: string | null; skipped: boolean; marks: Marks; aiUsed: boolean };

export async function getAnswer(userId: string, answerId: string): Promise<SavedAnswer | null> {
  const { data, error } = await (await db()).from("interview_answers")
    .select("id, question_id, answer_text, skipped, marks, ai_used").eq("user_id", userId).eq("id", answerId).maybeSingle();
  if (error) fail("answer", error);
  if (!data) return null;
  return { id: data.id, questionId: data.question_id, text: data.answer_text, skipped: data.skipped, marks: data.marks as unknown as Marks, aiUsed: data.ai_used };
}

/** AI budget count: provider calls logged in ai_calls since an instant, failed ones included. RLS: own rows. */
export async function aiUsedSince(userId: string, since: Date): Promise<number> {
  const { count, error } = await (await db()).from("ai_calls")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId).gte("created_at", since.toISOString());
  if (error) fail("ai usage", error);
  return count ?? 0;
}

/** Logs one provider call for the budget. Students cannot insert into ai_calls, so this uses the service role. */
export async function logAiCall(userId: string, kind: "interview_feedback" | "notes_cards", ok: boolean): Promise<void> {
  const { error } = await adminDb().from("ai_calls").insert({ user_id: userId, kind, ok });
  if (error) console.error(`interview: log ai call: ${error.message}`);
}

/** Short-window AI limit per student, on top of the daily budget: AI_RATE_MAX calls per AI_RATE_WINDOW_S seconds. */
export const AI_RATE_MAX = 6;
export const AI_RATE_WINDOW_S = 60;

/**
 * True if one more AI call is allowed now (the DBA's hit_rate_limit: fixed window, service role only).
 * Errors throw, and the AI gate treats a throw as a refusal. The key holds only the user id.
 */
export async function hitAiRateLimit(userId: string): Promise<boolean> {
  const { data, error } = await adminDb().rpc("hit_rate_limit", {
    p_key: `ai:${userId}`,
    p_limit: AI_RATE_MAX,
    p_window: `${AI_RATE_WINDOW_S} seconds`,
  });
  if (error) fail("rate limit", error);
  return data === true;
}

export async function occupationTitle(code: string): Promise<string | null> {
  const { data, error } = await (await db()).schema("ref").from("occupations").select("title_en").eq("code", code).maybeSingle();
  if (error) fail("occupation", error);
  return data?.title_en ?? null;
}
