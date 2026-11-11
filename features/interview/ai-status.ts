import "server-only";
// Whether AI is on for one student, and if not, why: the screens say which in plain words.
import { latestConsent } from "@/server/data/consents";
import { aiAllowed, aiConfigured } from "@/server/llm/adapter";

export type AiStatus = "on" | "off_under_18" | "off_unavailable" | "off_no_consent";

export async function aiStatusFor(userId: string, isUnder18: boolean): Promise<AiStatus> {
  if (isUnder18) return "off_under_18"; // first: no consent lookup is needed to say no
  if (!aiConfigured()) return "off_unavailable";
  const consent = await latestConsent(userId, "ai_processing");
  return aiAllowed({ isUnder18, aiConsent: consent }) ? "on" : "off_no_consent";
}
