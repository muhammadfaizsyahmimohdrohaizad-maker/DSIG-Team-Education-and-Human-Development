import "server-only";
import { getStore } from "../data";

export async function getInterview() {
  return getStore().getInterview();
}

export async function submitAnswer(questionId: string, text: string) {
  return getStore().saveAnswer({ questionId, text: text.trim() });
}
