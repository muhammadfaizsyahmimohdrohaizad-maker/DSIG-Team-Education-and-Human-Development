"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getStore } from "@/server/data";

const CONSENT_COOKIE = "cp_consent";

export async function startDemo() {
  (await cookies()).set(CONSENT_COOKIE, "1", { path: "/", sameSite: "lax", maxAge: 60 * 60 * 24 });
  redirect("/map");
}

/** Puts the demo student back to the starting state. Used between takes. */
export async function resetDemo() {
  await getStore().reset();
  revalidatePath("/", "layout");
  redirect("/map");
}

/** Removes the student's modules, answers and bookings and returns to the consent screen. */
export async function deleteMyData() {
  await getStore().reset();
  (await cookies()).delete(CONSENT_COOKIE);
  revalidatePath("/", "layout");
  redirect("/onboarding");
}
