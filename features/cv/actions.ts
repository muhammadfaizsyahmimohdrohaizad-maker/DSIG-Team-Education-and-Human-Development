"use server";

// cv: a CV built only from what the student has shown: mastered skills (passed checks), modules they
// passed and their projects (FR-CV). The "PDF" is the print page at /plan/cv/print: the browser's
// Save as PDF gives a clean A4 file without a PDF library on the server.
import { err, ok, type Result } from "@/lib/result";
import type { CvView } from "@/lib/types";
import { withUser } from "@/features/matches/run";
import { loadCv } from "./build";

export async function buildCv(): Promise<Result<CvView>> {
  return withUser("buildCv", async (userId) => {
    const cv = await loadCv(userId);
    return cv ? ok(cv) : err("NOT_FOUND", "We could not find your profile. Log out and in again.");
  });
}

export async function exportCvPdf(): Promise<Result<{ href: string }>> {
  return withUser("exportCvPdf", async () => ok({ href: "/plan/cv/print" }));
}
