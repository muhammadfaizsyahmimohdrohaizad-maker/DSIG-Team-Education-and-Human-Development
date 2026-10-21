import "server-only";
import hint from "@/content/llm/hint.json";
import feedback from "@/content/llm/feedback.json";

const RECORDED: Record<string, Record<string, unknown>> = { hint, feedback };

/** Saved model output: the vetted static hints, and sample feedback for the tests. No network call. */
export function recorded(task: string, key: string): unknown | null {
  return RECORDED[task]?.[key] ?? null;
}
