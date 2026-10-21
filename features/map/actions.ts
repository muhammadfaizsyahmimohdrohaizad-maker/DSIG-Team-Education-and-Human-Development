"use server";

import { revalidatePath } from "next/cache";
import { getStore } from "@/server/data";

/** Saves the ticked modules. Unknown ids are dropped, so a stale tab can't store junk. */
export async function saveModules(ids: string[]): Promise<{ ok: boolean }> {
  const store = getStore();
  const { modules } = await store.listModules();
  const known = new Set(modules.map((m) => m.id));
  await store.setTicked(ids.filter((id) => known.has(id)));
  revalidatePath("/matches");
  revalidatePath("/plan");
  return { ok: true };
}
