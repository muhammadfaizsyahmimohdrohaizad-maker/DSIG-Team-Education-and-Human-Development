"use server";

import { revalidatePath } from "next/cache";
import { addWeakArea } from "@/server/engines/feedback";

export async function addWeakAreaToReviews(answerId: string): Promise<{ ok: boolean }> {
  if (typeof answerId !== "string") return { ok: false };
  const ok = await addWeakArea(answerId);
  revalidatePath("/practice");
  return { ok };
}
