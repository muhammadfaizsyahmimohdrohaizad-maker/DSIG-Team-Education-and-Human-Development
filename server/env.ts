import "server-only";
import { z } from "zod";

const schema = z.object({
  DATA_MODE: z.enum(["fixtures", "supabase"]),
  LLM_PROVIDER: z.enum(["recorded", "openai", "anthropic", "gemini"]),
  LLM_MODEL: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
});

// Defaults are applied here so the demo runs with no .env file at all.
export const env = schema.parse({
  DATA_MODE: process.env.DATA_MODE ?? "fixtures",
  LLM_PROVIDER: process.env.LLM_PROVIDER ?? "recorded",
  LLM_MODEL: process.env.LLM_MODEL || undefined,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || undefined,
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || undefined,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || undefined,
});
