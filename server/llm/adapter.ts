import "server-only";
import { aiUsedSince } from "../data/interview.ts";
import { env } from "../env.ts";
import { createAi, DEFAULT_DAILY_LIMIT, stubProvider, type Ai, type AiProvider } from "./core.ts";

// The only file that talks to an AI provider (System Design 2.3, 5.3, 5.4). The guarded steps (age and
// consent gate, budget, redaction, prompt, timeout, output checks) live in core.ts; this file wires the
// real provider and the budget count to them.
export { aiAllowed, AI_TIMEOUT_MS, type AiUser, type AiCard } from "./core.ts";

const gemini: AiProvider = {
  async generate(prompt, signal) {
    const e = env();
    if (!e.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not set");
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${e.GEMINI_MODEL}:generateContent`, {
      method: "POST",
      signal,
      headers: { "content-type": "application/json", "x-goog-api-key": e.GEMINI_API_KEY },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: prompt.system }] },
        contents: [{ role: "user", parts: [{ text: prompt.user }] }],
        generationConfig: { maxOutputTokens: prompt.maxOutputTokens, temperature: 0.3 },
      }),
    });
    if (!res.ok) throw new Error(`Gemini responded ${res.status}`);
    const json = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
    return json.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
  },
};

/** AI_DAILY_LIMIT: calls per student per Malaysian day (default 20). Read here until server/env.ts has it. */
function dailyLimit(): number {
  const n = Number.parseInt(process.env.AI_DAILY_LIMIT ?? "", 10);
  return Number.isFinite(n) && n >= 0 ? n : DEFAULT_DAILY_LIMIT;
}

let instance: Ai | undefined;

export function ai(): Ai {
  instance ??= createAi({
    provider: env().LLM_PROVIDER === "gemini" ? gemini : stubProvider(),
    budget: { usedSince: aiUsedSince },
    dailyLimit: dailyLimit(),
  });
  return instance;
}
