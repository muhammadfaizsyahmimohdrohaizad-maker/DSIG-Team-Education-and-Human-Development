"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getStore } from "@/server/data";

/** Makes an occupation the student's target. New target, new gap skills, so the plan starts again. */
export async function chooseTarget(form: FormData) {
  const code = String(form.get("code") ?? "");
  const store = getStore();
  if (!(await store.listOccupations()).some((o) => o.code === code)) redirect("/matches");
  await store.setTarget(code);
  await store.setPlanBuilt(false);
  revalidatePath("/", "layout");
  redirect("/plan");
}
