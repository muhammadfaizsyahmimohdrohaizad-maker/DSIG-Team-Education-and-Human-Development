import { z, type ZodType } from "zod";
import type { Feedback, Hint } from "@/lib/types";

export const hintSchema = z.object({
  level: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  title: z.enum(["Nudge", "Concept", "Worked example"]),
  text: z.string().min(1),
});
// Live providers return a JSON object, so the ladder may arrive wrapped as { hints: [...] }.
const unwrapHints = (v: unknown) => (v && typeof v === "object" && !Array.isArray(v) && "hints" in v ? (v as { hints: unknown }).hints : v);
export const hintLadderSchema: ZodType<Hint[]> = z.preprocess(unwrapHints, z.array(hintSchema).length(3));

export const feedbackSchema: ZodType<Feedback> = z.object({
  star: z
    .array(
      z.object({
        part: z.enum(["Situation", "Task", "Action", "Result"]),
        present: z.boolean(),
        note: z.string(),
      }),
    )
    .length(4),
  evidence: z.string(),
  technicalAccuracy: z.string(),
  nextStep: z.string(),
  weakArea: z.object({ label: z.string(), itemId: z.string() }),
});
