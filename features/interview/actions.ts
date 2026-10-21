"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { submitAnswer } from "@/server/engines/interview";
import { getInterview } from "@/server/engines/interview";

/** Saves a typed answer and opens its feedback. */
export async function sendAnswer(formData: FormData) {
  const questionId = String(formData.get("questionId") ?? "");
  const text = String(formData.get("answer") ?? "").trim();
  const { questions } = await getInterview();
  if (!text || !questions.some((q) => q.id === questionId)) redirect("/interview");
  const answer = await submitAnswer(questionId, text);
  revalidatePath("/practice");
  redirect(`/feedback/${answer.id}`);
}
