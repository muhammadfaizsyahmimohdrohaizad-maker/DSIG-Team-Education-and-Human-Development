"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { UNDERTAKING_VERSION } from "@/lib/config";
import { currentAccount, homeFor } from "@/server/auth/account";
import { getStore } from "@/server/data";

export type UndertakingState = { error?: string } | null;

/** Records the staff member's acceptance, then opens their dashboard. */
export async function acceptUndertaking(_prev: UndertakingState, form: FormData): Promise<UndertakingState> {
  if (form.get("agree") !== "on") return { error: "Tick the box to accept the undertaking. Your dashboard opens after that." };
  await getStore().acceptUndertaking(UNDERTAKING_VERSION);
  revalidatePath("/", "layout");
  redirect(homeFor(await currentAccount()));
}
