import { z } from "zod";

export const resumeReportSchema = z.object({
  summary: z.string().trim().min(1).max(1200),
  requirements: z.array(z.object({
    requirement: z.string().trim().min(1).max(500),
    evidence: z.string().trim().max(1000).nullable(),
  })).min(1).max(15),
  suggestions: z.array(z.string().trim().min(1).max(600)).max(8),
  limitations: z.array(z.string().trim().min(1).max(500)).max(5),
});
export type ResumeReport = z.infer<typeof resumeReportSchema>;
