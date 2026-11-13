"use server";

import { resumeAiInput } from "@/lib/schemas";
import { err, invalid, ok, type Result } from "@/lib/result";
import { withUser } from "@/features/matches/run";
import { ownProfile } from "@/server/data/account";
import { hitAiRateLimit } from "@/server/data/interview";
import { redact } from "@/server/llm/redact";
import { reviewResume } from "@/server/llm/huggingface";
import occupations from "@/content/reference/occupations.json";
import skills from "@/content/reference/skills.json";

export async function analyseResume(input: unknown): Promise<Result<string>> {
  const parsed = resumeAiInput.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  return withUser("resume.huggingface", async userId => {
    const profile = await ownProfile(userId);
    if (!profile || profile.locked) return err("FORBIDDEN", "Your account is awaiting approval.");
    if (!process.env.HF_TOKEN) return err("AI_ERROR", "Hugging Face analysis is awaiting service configuration. Your résumé is still available.");
    const role = occupations.find(item => item.code === parsed.data.code);
    if (!role) return err("VALIDATION", "Choose an occupation from the list.");
    if (!await hitAiRateLimit(userId)) return err("CONFLICT", "Please wait before requesting another AI review.");
    try {
      const text = redact(parsed.data.text, [profile.fullName]);
      const labels = role.essential_skills.map(key => skills.find(skill => skill.key === key)?.label_en ?? key);
      return ok(await reviewResume(text, role.title_en, labels));
    } catch (e) {
      console.error("resume.huggingface", e instanceof Error ? e.message : "provider failure");
      return err("AI_ERROR", "Hugging Face could not finish this review. Your résumé is preserved. Try again shortly.");
    }
  });
}
