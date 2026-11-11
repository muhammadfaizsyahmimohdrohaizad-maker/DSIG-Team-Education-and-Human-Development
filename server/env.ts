import "server-only";
import { z } from "zod";

// Read once, validated. Values are never logged.
const schema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20).optional(),
  SITE_URL: z.string().url().default("http://localhost:3000"),
  STAFF_CODE_HASHES: z.string().default(""),
  CRON_SECRET: z.string().min(16).optional(),
  // AI is off unless this is "gemini" with GEMINI_API_KEY set. "stub" (fixed text) is for tests and local work
  // only and is treated as off when NODE_ENV is production (server/llm/core.ts chooseProvider).
  LLM_PROVIDER: z.enum(["off", "gemini", "stub"]).default("off"),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default("gemini-2.5-flash-lite"),
  // AI calls per student per Malaysian day; blank means the default of 20, 0 turns AI off for everyone.
  AI_DAILY_LIMIT: z.string().regex(/^\d*$/, "Use a whole number").optional().transform((v) => (v ? Number(v) : 20)),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default("CareerPrep <no-reply@example.com>"),
});

let cached: z.infer<typeof schema> | undefined;

export function env() {
  if (!cached) {
    const parsed = schema.safeParse(process.env);
    if (!parsed.success) {
      const names = parsed.error.issues.map((i) => i.path.join(".")).join(", ");
      throw new Error(`Missing or invalid environment variables: ${names}. See .env.example.`);
    }
    cached = parsed.data;
  }
  return cached;
}
