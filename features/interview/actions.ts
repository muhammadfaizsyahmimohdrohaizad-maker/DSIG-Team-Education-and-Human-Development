"use server";

// Mock interview (FR-INT-01 to FR-INT-04, System Design 2.2 and A5).
// The checklist marks every answer first and its marks are final. AI feedback is extra: only for 18+ students
// with AI consent, labelled AI-generated, and if it times out or fails the student keeps the checklist marks
// and gets a retry button.
import { err, ok, type Result } from "@/lib/result";
import { answerIdInput, interviewAnswer, startInterviewInput } from "@/lib/schemas";
import type { InterviewRound, Marks } from "@/lib/types";
import {
  addAiFeedback, getAnswer, getInterviewee, getQuestion, occupationTitle, questionsFor, recordAnswer, RpcRefused,
  type Interviewee, type Question,
} from "@/server/data/interview";
import { checklist, explain, SKIPPED, total, type Explained } from "@/server/engines/feedback";
import { ai } from "@/server/llm/adapter";
import { aiStatusFor, type AiStatus } from "./ai-status";
import { asStudent, invalid } from "./run";

export type { AiStatus } from "./ai-status";

/** What the feedback screen shows under the checklist marks. */
export type AiFeedback =
  | { state: "shown"; text: string }
  | { state: "off"; status: Exclude<AiStatus, "on"> }
  | { state: "skipped" }
  | { state: "failed"; message: string; canRetry: boolean };

export type InterviewStart = {
  round: InterviewRound;
  jobCode: string;
  jobTitle: string;
  ai: AiStatus;
  questions: { id: string; position: number; prompt: string; why: string }[];
};

export type MarkedAnswer = Explained & {
  answerId: string;
  questionId: string;
  marks: Marks;
  total: number;
  ai: AiFeedback;
};

async function askAi(userId: string, student: Interviewee, question: Question, answerId: string, text: string, notes: Explained): Promise<AiFeedback> {
  const status = await aiStatusFor(userId, student.isUnder18);
  if (status !== "on") return { state: "off", status };
  const r = await ai().feedback(
    { id: userId, isUnder18: student.isUnder18, aiConsent: true, fullName: student.fullName },
    { question: question.prompt, answer: text, missingPoints: notes.missingPoints, missingParts: notes.missingParts },
  );
  if (!r.ok) {
    const canRetry = r.error.code === "AI_TIMEOUT" || r.error.code === "AI_ERROR";
    return { state: "failed", message: `${r.error.message} Your checklist marks are saved.`, canRetry };
  }
  try {
    await addAiFeedback(userId, answerId, r.value);
  } catch (e) {
    // The database re-checks age and consent; if consent was withdrawn meanwhile, show nothing from the AI.
    if (e instanceof RpcRefused && e.token === "ai_not_allowed") return { state: "off", status: "off_no_consent" };
    throw e;
  }
  return { state: "shown", text: r.value };
}

export type InterviewSetup = { jobCode: string; jobTitle: string; ai: AiStatus };

/** What the start screen needs: the target job and whether AI feedback is on, and why not if it is off. */
export async function getInterviewSetup(): Promise<Result<InterviewSetup>> {
  return asStudent("getInterviewSetup", async (userId) => {
    const student = await getInterviewee(userId);
    if (!student) return err("NOT_FOUND", "We couldn't find your profile. Log in again.");
    if (!student.target) return err("CONFLICT", "Pick a target job on your Map first. The interview asks questions for that job.");
    const [title, status] = await Promise.all([occupationTitle(student.target), aiStatusFor(userId, student.isUnder18)]);
    return ok({ jobCode: student.target, jobTitle: title ?? student.target, ai: status });
  });
}

/** The three questions of the chosen round for the student's target job. */
export async function startInterview(input: unknown): Promise<Result<InterviewStart>> {
  const parsed = startInterviewInput.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  return asStudent("startInterview", async (userId) => {
    const student = await getInterviewee(userId);
    if (!student) return err("NOT_FOUND", "We couldn't find your profile. Log in again.");
    if (!student.target) return err("CONFLICT", "Pick a target job on your Map first. The interview asks questions for that job.");
    const [questions, title, status] = await Promise.all([
      questionsFor(student.target, parsed.data.round),
      occupationTitle(student.target),
      aiStatusFor(userId, student.isUnder18),
    ]);
    if (questions.length !== 3) return err("NOT_FOUND", "Interview questions for this job aren't ready yet. Try the other round.");
    return ok({
      round: parsed.data.round,
      jobCode: student.target,
      jobTitle: title ?? student.target,
      ai: status,
      questions: questions.map((q) => ({ id: q.id, position: q.position, prompt: q.prompt, why: q.why })),
    });
  });
}

/** Marks one answer with the checklist, saves it, then adds AI feedback if allowed. */
export async function submitAnswer(input: unknown): Promise<Result<MarkedAnswer>> {
  const parsed = interviewAnswer.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const { questionId, skipped } = parsed.data;
  const text = skipped ? "" : (parsed.data.text ?? "").trim();
  return asStudent("submitAnswer", async (userId) => {
    const [student, question] = await Promise.all([getInterviewee(userId), getQuestion(questionId)]);
    if (!student) return err("NOT_FOUND", "We couldn't find your profile. Log in again.");
    if (!question) return err("NOT_FOUND", "That question no longer exists. Start the interview again.");

    const marks = skipped ? SKIPPED : checklist(text, question.rubric, student.projectNames);
    const notes = explain(text, question.rubric, marks, skipped);
    const answerId = await recordAnswer(userId, question.id, skipped ? null : text, skipped, marks);

    const aiResult: AiFeedback = skipped ? { state: "skipped" } : await askAi(userId, student, question, answerId, text, notes);
    return ok({ ...notes, answerId, questionId: question.id, marks, total: total(marks), ai: aiResult });
  });
}

/** Tries AI feedback again for a saved answer whose AI call timed out or failed. The marks do not change. */
export async function retryAiFeedback(input: unknown): Promise<Result<AiFeedback>> {
  const parsed = answerIdInput.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  return asStudent("retryAiFeedback", async (userId) => {
    const answer = await getAnswer(userId, parsed.data.answerId);
    if (!answer) return err("NOT_FOUND", "That answer no longer exists.");
    if (answer.skipped || !answer.text) return err("VALIDATION", "A skipped question has no answer to give feedback on.");
    if (answer.aiUsed) return err("CONFLICT", "This answer already has AI feedback.");
    const [student, question] = await Promise.all([getInterviewee(userId), getQuestion(answer.questionId)]);
    if (!student || !question) return err("NOT_FOUND", "That question no longer exists.");
    const notes = explain(answer.text, question.rubric, answer.marks);
    return ok(await askAi(userId, student, question, answer.id, answer.text, notes));
  });
}
