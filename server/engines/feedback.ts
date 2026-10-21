import "server-only";
import { getStore } from "../data";
import { generateJSON } from "../llm/adapter";
import { feedbackSchema } from "../llm/schemas";

/** Feedback for one saved answer. `feedback` is null when nothing is recorded for that question. */
export async function feedbackFor(answerId: string) {
  const store = getStore();
  const answer = await store.getAnswer(answerId);
  if (!answer) return null;
  const interview = await store.getInterview();
  const question = interview.questions.find((q) => q.id === answer.questionId);
  const items = (await store.listLessons()).flatMap((l) => l.items.map((i) => ({ id: i.id, skill: l.label, question: i.question })));
  const feedback = await generateJSON({
    task: "feedback",
    key: `${interview.occupation}:${answer.questionId}`,
    cacheKey: answer.id,
    schema: feedbackSchema,
    prompt: {
      system: [
        `You give feedback on one mock-interview answer for the job ${interview.occupation} ${interview.title}. The student is a Malaysian diploma student in software engineering.`,
        "Never give a score, grade, mark or percentage. Be specific to this answer, kind and direct. Plain English, no markdown.",
        "Reply with JSON only, in this shape:",
        '{"star":[{"part":"Situation","present":true,"note":"..."},{"part":"Task","present":true,"note":"..."},{"part":"Action","present":true,"note":"..."},{"part":"Result","present":false,"note":"..."}],',
        '"evidence":"...","technicalAccuracy":"...","nextStep":"...","weakArea":{"label":"...","itemId":"..."}}',
        "star: all four parts in that order; present says whether the answer contains that part; note is one short sentence quoting or summarising it, or saying what is missing.",
        "evidence: two or three sentences on how concrete the answer is. technicalAccuracy: two or three sentences, correct any mistake. nextStep: one thing to change next time.",
        "weakArea: the review question below that best matches the student's weakest point. itemId must be one of the listed ids; label is a short phrase.",
      ].join("\n"),
      user: [
        `Interview question: ${question?.text ?? ""}`,
        `Student's answer: ${answer.text}`,
        "Review questions (id: skill, question):",
        ...items.map((i) => `${i.id}: ${i.skill}, ${i.question}`),
      ].join("\n"),
    },
    accept: (f) => items.some((i) => i.id === f.weakArea.itemId),
  });
  const weak = await store.listWeakAreas();
  return { answer, question, feedback, weakAreaAdded: !!feedback && weak.includes(feedback.weakArea.itemId) };
}

/** Puts the answer's weak area into the review queue (it comes back as a due recall item). */
export async function addWeakArea(answerId: string): Promise<boolean> {
  const result = await feedbackFor(answerId);
  if (!result?.feedback) return false;
  await getStore().addWeakArea(result.feedback.weakArea.itemId);
  return true;
}

export async function latestAnswerId(): Promise<string | null> {
  const answers = await getStore().listAnswers();
  return answers.length ? answers[answers.length - 1].id : null;
}
