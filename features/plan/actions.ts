"use server";

import { revalidatePath } from "next/cache";
import { getStore } from "@/server/data";
import { getGapSkills } from "@/server/engines/matches";

/** Stores the 1 to 5 self-ratings for the gap skills only, and whether the plan is built. */
export async function saveRatings(ratings: Record<string, number>, built: boolean): Promise<{ ok: boolean }> {
  const { gaps } = await getGapSkills();
  const known = new Set(gaps.map((g) => g.id));
  const clean: Record<string, number> = {};
  for (const [id, value] of Object.entries(ratings)) {
    if (known.has(id) && Number.isInteger(value) && value >= 1 && value <= 5) clean[id] = value;
  }
  const store = getStore();
  await store.setRatings(clean);
  await store.setPlanBuilt(built && Object.keys(clean).length === known.size);
  revalidatePath("/practice");
  return { ok: true };
}
