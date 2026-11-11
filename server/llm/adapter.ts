import "server-only";
import type { Result } from "../../lib/result.ts";
import { err, ok } from "../../lib/result.ts";
import { env } from "../env.ts";

// The only file that talks to an AI provider (System Design 2.3, 5.3, 5.4).
// Sends answer or notes text only: never a name, email or user id.

export type FeedbackRequest = { text: string; rubric: string };
export interface LlmAdapter {
  feedback(req: FeedbackRequest): Promise<Result<string>>;
}

export const AI_TIMEOUT_MS = 8_000;

/** Gemini terms bar users under 18, so AI is off for them whatever their consent says. */
export function aiAllowed(user: { isUnder18: boolean; aiConsent: boolean }): boolean {
  return !user.isUnder18 && user.aiConsent;
}

const stub: LlmAdapter = {
  async feedback() {
    return ok("Clear structure. Add one number from your own project to show the result.");
  },
};

const gemini: LlmAdapter = {
  async feedback({ text, rubric }) {
    const e = env();
    if (!e.GEMINI_API_KEY) return err("AI_ERROR", "AI feedback is not set up.");
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${e.GEMINI_MODEL}:generateContent`,
        {
          method: "POST",
          signal: controller.signal,
          headers: { "content-type": "application/json", "x-goog-api-key": e.GEMINI_API_KEY },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: "You give short, kind interview feedback to a Malaysian student. Two or three sentences. Never give a mark or grade." }] },
            contents: [{ role: "user", parts: [{ text: `Rubric:\n${rubric}\n\nAnswer:\n${text}` }] }],
            generationConfig: { maxOutputTokens: 200, temperature: 0.4 },
          }),
        },
      );
      if (!res.ok) return err("AI_ERROR", "AI feedback isn't available right now.");
      const json = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
      const out = json.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("").trim();
      return out ? ok(out) : err("AI_ERROR", "AI feedback came back empty.");
    } catch (e) {
      return (e as Error).name === "AbortError"
        ? err("AI_TIMEOUT", "AI feedback took too long.")
        : err("AI_ERROR", "AI feedback isn't available right now.");
    } finally {
      clearTimeout(timer);
    }
  },
};

export function llm(): LlmAdapter {
  return env().LLM_PROVIDER === "gemini" ? gemini : stub;
}
