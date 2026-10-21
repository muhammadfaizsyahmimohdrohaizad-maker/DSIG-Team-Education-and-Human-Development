import "server-only";
import { z } from "zod";
import { normaliseSupabaseUrl } from "@/lib/supabase-url";

/** Trims spaces and surrounding quotes, so `LLM_PROVIDER = "Gemini" ` still reads as gemini. */
const clean = (v: string | undefined) => v?.trim().replace(/^["']|["']$/g, "").trim() || undefined;

const schema = z.object({
  DATA_MODE: z.enum(["fixtures", "supabase"]),
  LLM_PROVIDER: z.enum(["recorded", "openai", "anthropic", "gemini"]),
  LLM_MODEL: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  /** Staff sign up with this code. Without it, nobody can become an adviser or institution user. */
  STAFF_INVITE_CODE: z.string().optional(),
  /** Booking status emails go through Resend when this is set; otherwise they are logged only. */
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().optional(),
  SITE_URL: z.string().optional(),
});

const raw = {
  DATA_MODE: clean(process.env.DATA_MODE)?.toLowerCase() ?? "fixtures",
  LLM_PROVIDER: clean(process.env.LLM_PROVIDER)?.toLowerCase() ?? "recorded",
  LLM_MODEL: clean(process.env.LLM_MODEL),
  OPENAI_API_KEY: clean(process.env.OPENAI_API_KEY),
  ANTHROPIC_API_KEY: clean(process.env.ANTHROPIC_API_KEY),
  GEMINI_API_KEY: clean(process.env.GEMINI_API_KEY),
  NEXT_PUBLIC_SUPABASE_URL: clean(process.env.NEXT_PUBLIC_SUPABASE_URL),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: clean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  SUPABASE_SERVICE_ROLE_KEY: clean(process.env.SUPABASE_SERVICE_ROLE_KEY),
  STAFF_INVITE_CODE: clean(process.env.STAFF_INVITE_CODE),
  RESEND_API_KEY: clean(process.env.RESEND_API_KEY),
  EMAIL_FROM: clean(process.env.EMAIL_FROM),
  SITE_URL: clean(process.env.SITE_URL),
};

const parsed = schema.safeParse(raw);
if (!parsed.success) {
  throw new Error(
    `Check .env.local: DATA_MODE is "${raw.DATA_MODE}" (use fixtures or supabase), ` +
      `LLM_PROVIDER is "${raw.LLM_PROVIDER}" (use recorded, openai, anthropic or gemini).`,
  );
}
if (parsed.data.DATA_MODE === "supabase" && parsed.data.NEXT_PUBLIC_SUPABASE_URL) {
  const url = normaliseSupabaseUrl(parsed.data.NEXT_PUBLIC_SUPABASE_URL);
  if (!url) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL in .env.local isn't a Supabase project URL. Copy it from Supabase → Project Settings → Data API; it looks like https://abcdefghijklmnopqrst.supabase.co",
    );
  }
  parsed.data.NEXT_PUBLIC_SUPABASE_URL = url;
}
if (parsed.data.DATA_MODE === "supabase") {
  const missing = (["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY"] as const).filter(
    (k) => !parsed.data[k],
  );
  if (missing.length) throw new Error(`DATA_MODE=supabase needs ${missing.join(", ")} in .env.local.`);
}

// Defaults apply above, so the app runs with no .env file at all (in fixtures mode).
export const env = parsed.data;
export const SITE_URL = (env.SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
export const REAL = env.DATA_MODE === "supabase";
