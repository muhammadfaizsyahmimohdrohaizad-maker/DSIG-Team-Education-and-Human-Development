"use server";

import type { ResumeReport } from "@/lib/resume-report";
import { resumeAiInput } from "@/lib/schemas";
import { err, invalid, ok, type Result } from "@/lib/result";
import { withUser } from "@/features/matches/run";
import { ownProfile } from "@/server/data/account";
import { hitAiRateLimit } from "@/server/data/interview";
import { redact } from "@/server/llm/redact";
import { reviewResume } from "@/server/llm/resume";
import occupations from "@/content/reference/occupations.json";
import skills from "@/content/reference/skills.json";

export async function analyseResume(input: unknown): Promise<Result<ResumeReport>> {
  const parsed = resumeAiInput.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  return withUser("resume.gemini", async userId => {
    const profile = await ownProfile(userId);
    if (!profile || profile.locked) return err("FORBIDDEN", "Your account is awaiting approval.");
    if (profile.isUnder18) return err("FORBIDDEN", "AI résumé review is available for accounts aged 18 and over.");
    if (!process.env.GEMINI_API_KEY) return err("AI_ERROR", "Gemini analysis is awaiting service configuration. Your résumé is still available.");
    const role = occupations.find(item => item.code === parsed.data.code);
    if (!role) return err("VALIDATION", "Choose an occupation from the list.");
    if (!await hitAiRateLimit(userId)) return err("CONFLICT", "Please wait before requesting another AI review.");
    try {
      const text = redact(parsed.data.text, [profile.fullName]);
      const labels = role.essential_skills.map(key => skills.find(skill => skill.key === key)?.label_en ?? key);
      return ok(await reviewResume(text, role.title_en, labels, redact(parsed.data.jobDescription, [profile.fullName])));
    } catch (e) {
      console.error("resume.gemini", e instanceof Error ? e.message : "provider failure");
      return err("AI_ERROR", "Gemini could not finish this review. Your résumé is preserved. Try again shortly.");
    }
  });
}
