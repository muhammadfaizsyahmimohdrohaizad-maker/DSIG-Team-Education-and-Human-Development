import "server-only";
import hint from "@/content/llm/hint.json";
import feedback from "@/content/llm/feedback.json";

const RECORDED: Record<string, Record<string, unknown>> = { hint, feedback };

/** Replays saved LLM output. No network call, so the demo is the same every time. */
export function recorded(task: string, key: string): unknown | null {
  return RECORDED[task]?.[key] ?? null;
}
