import "server-only";
import { env } from "../../env";

export type Prompt = { system: string; user: string };

const TIMEOUT_MS = 25_000;

const DEFAULT_MODEL = {
  openai: "gpt-4o-mini",
  anthropic: "claude-haiku-5-5",
  gemini: "gemini-2.5-flash",
} as const;

type Live = keyof typeof DEFAULT_MODEL;

function key(provider: Live): string {
  const value = { openai: env.OPENAI_API_KEY, anthropic: env.ANTHROPIC_API_KEY, gemini: env.GEMINI_API_KEY }[provider];
  if (!value) throw new Error(`LLM_PROVIDER=${provider} needs ${provider.toUpperCase()}_API_KEY in .env.local`);
  return value;
}

async function post<T>(url: string, headers: Record<string, string>, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`${new URL(url).host} answered ${res.status}: ${(await res.text()).slice(0, 300)}`);
  return (await res.json()) as T;
}

/** Sends one prompt to the configured provider and returns the reply text. Throws on any failure. */
export async function complete(provider: Live, prompt: Prompt): Promise<string> {
  const model = env.LLM_MODEL ?? DEFAULT_MODEL[provider];

  if (provider === "openai") {
    const data = await post<{ choices?: { message?: { content?: string } }[] }>(
      "https://api.openai.com/v1/chat/completions",
      { authorization: `Bearer ${key("openai")}` },
      {
        model,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: prompt.system },
          { role: "user", content: prompt.user },
        ],
      },
    );
    return data.choices?.[0]?.message?.content ?? "";
  }

  if (provider === "anthropic") {
    const data = await post<{ content?: { type: string; text?: string }[] }>(
      "https://api.anthropic.com/v1/messages",
      { "x-api-key": key("anthropic"), "anthropic-version": "2023-06-01" },
      { model, max_tokens: 1500, system: prompt.system, messages: [{ role: "user", content: prompt.user }] },
    );
    return (data.content ?? []).map((c) => (c.type === "text" ? c.text : "")).join("");
  }

  const data = await post<{ candidates?: { content?: { parts?: { text?: string }[] } }[] }>(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
    { "x-goog-api-key": key("gemini") },
    {
      systemInstruction: { parts: [{ text: prompt.system }] },
      contents: [{ role: "user", parts: [{ text: prompt.user }] }],
      generationConfig: { responseMimeType: "application/json" },
    },
  );
  return (data.candidates?.[0]?.content?.parts ?? []).map((p) => p.text ?? "").join("");
}
