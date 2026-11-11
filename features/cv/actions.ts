"use server";

// cv: server actions. Each validates input with Zod, calls server/data and server/engines,
// and returns a Result. See System Design 2.2 for the logic each one needs.
import { notBuilt, type Result } from "@/lib/result";

export async function buildCv(): Promise<Result<never>> {
  return notBuilt("Building the CV");
}

export async function exportCvPdf(): Promise<Result<never>> {
  return notBuilt("CV PDF export");
}
