import "server-only";
import type { ZodType } from "zod";
import { extractJson } from "@/lib/llm/guards";
import { env } from "../env";
import { complete, type Prompt } from "./providers/live";
import { recorded } from "./providers/recorded";

export type LlmTask = "hint" | "feedback";

// Live answers are cached for the life of the server, so a page that renders twice, or a hint
// ladder asked for one step at a time, shows the same text instead of a fresh generation.
const g = globalThis as unknown as { __careerprepLlmCache?: Map<string, unknown> };
const cache = (g.__careerprepLlmCache ??= new Map());

/**
 * The one door to the LLM. Returns validated output, or null when there is nothing to return.
 * - `recorded` replays content/llm/ by `key` (the demo, the e2e tests).
 * - a live provider sends `prompt`; `cacheKey` identifies the answer. If the call fails or the
 *   reply fails the schema (or `accept`), the recorded output for `key` is used instead, if any.
 */
export async function generateJSON<T>(request: {
  task: LlmTask;
  key: string;
  schema: ZodType<T>;
  prompt?: Prompt;
  cacheKey?: string;
  /** Extra check on a live reply, e.g. that hints don't give the answer away. */
  accept?: (value: T) => boolean;
}): Promise<T | null> {
  const fromRecording = (): T | null => {
    const raw = recorded(request.task, request.key);
    if (raw === null) return null;
    const parsed = request.schema.safeParse(raw);
    return parsed.success ? parsed.data : null;
  };

  const provider = env.LLM_PROVIDER;
  if (provider === "recorded" || !request.prompt) return fromRecording();

  const cacheKey = `${request.task}:${request.cacheKey ?? request.key}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey) as T;

  try {
    const text = await complete(provider, request.prompt);
    const parsed = request.schema.safeParse(extractJson(text));
    if (parsed.success && (request.accept?.(parsed.data) ?? true)) {
      cache.set(cacheKey, parsed.data);
      return parsed.data;
    }
    console.warn(`[llm] ${request.task}: reply did not pass the checks, using the recorded fallback`);
  } catch (error) {
    console.error(`[llm] ${request.task}: ${error instanceof Error ? error.message : String(error)}`);
  }
  return fromRecording();
}
