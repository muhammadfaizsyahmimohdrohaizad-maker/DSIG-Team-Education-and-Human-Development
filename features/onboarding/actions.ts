"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { NOTICE_VERSION } from "@/lib/config";
import { getStore } from "@/server/data";
import { REAL } from "@/server/env";

export type ConsentState = { error?: string; field?: "processing" | "parental" } | null;

const on = (form: FormData, name: string) => form.get(name) === "on";

/** Saves one consent decision as a new record. Processing is required; everything else is a free choice. */
export async function saveConsent(_prev: ConsentState, form: FormData): Promise<ConsentState> {
  const choice = {
    processing: on(form, "processing"),
    aiProcessing: on(form, "ai"),
    bookingEmails: on(form, "emails"),
    adviserVisibility: on(form, "adviser"),
    under18: on(form, "under18"),
    parentalConsent: on(form, "parental"),
    noticeVersion: NOTICE_VERSION,
  };
  if (!choice.processing) {
    return { error: "CareerPrep can't work without storing your modules and answers. Tick the first box to continue.", field: "processing" };
  }
  if (choice.under18 && !choice.parentalConsent) {
    return { error: "Because you are under 18, a parent or guardian has to agree too. Tick the box once they have.", field: "parental" };
  }
  await getStore().recordConsent(choice);
  revalidatePath("/", "layout");
  redirect(String(form.get("from") ?? "") === "settings" ? "/settings?saved=1" : "/map");
}

/** Deletes the account and every row it owns. There is no undo. */
export async function deleteMyData() {
  await getStore().deleteMine();
  revalidatePath("/", "layout");
  redirect(REAL ? "/sign-in?deleted=1" : "/onboarding");
}
