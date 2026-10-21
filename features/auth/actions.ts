"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { currentAccount, homeFor } from "@/server/auth/account";
import { env, REAL } from "@/server/env";
import { session, supabaseAdmin, supabaseServer } from "@/server/supabase/client";

export type AuthState = { error?: string; field?: string; values?: Record<string, string> } | null;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function safeNext(raw: FormDataEntryValue | null): string | null {
  const next = String(raw ?? "");
  return next.startsWith("/") && !next.startsWith("//") ? next : null;
}

export async function signIn(_prev: AuthState, form: FormData): Promise<AuthState> {
  if (!REAL) redirect("/");
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  const values = { email };
  if (!EMAIL.test(email)) return { error: "Enter an email address like name@student.gmi.edu.my.", field: "email", values };
  if (!password) return { error: "Enter your password.", field: "password", values };

  const sb = await supabaseServer();
  const { error } = await sb.auth.signInWithPassword({ email, password });
  if (error) return { error: "That email and password don't match an account. Check them and try again.", field: "password", values };

  revalidatePath("/", "layout");
  redirect(safeNext(form.get("next")) ?? homeFor(await currentAccount()));
}

export async function signUp(_prev: AuthState, form: FormData): Promise<AuthState> {
  if (!REAL) redirect("/");
  const name = String(form.get("name") ?? "").trim();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  const semester = String(form.get("semester") ?? "");
  const kind = String(form.get("kind") ?? "student");
  const code = String(form.get("code") ?? "").trim();
  const unit = String(form.get("unit") ?? "").trim();
  const values = { name, email, semester, kind, unit };

  if (!name) return { error: "Enter your name.", field: "name", values };
  if (!EMAIL.test(email)) return { error: "Enter an email address like name@student.gmi.edu.my.", field: "email", values };
  if (password.length < 8) return { error: "Use at least 8 characters for your password.", field: "password", values };
  if (kind === "student" && !/^[1-8]$/.test(semester)) return { error: "Choose your semester.", field: "semester", values };
  if (kind !== "student") {
    if (!env.STAFF_INVITE_CODE || code !== env.STAFF_INVITE_CODE) {
      return { error: "That staff code isn't right. Ask your CareerPrep administrator for it.", field: "code", values };
    }
  }

  const sb = await supabaseServer();
  const { data, error } = await sb.auth.signUp({
    email,
    password,
    options: { data: { full_name: name, semester: kind === "student" ? semester : "" } },
  });
  if (error) {
    const taken = /registered|exists/i.test(error.message);
    return {
      error: taken ? "An account with that email already exists. Sign in instead." : `We couldn't create your account: ${error.message}`,
      field: "email",
      values,
    };
  }
  if (!data.session) {
    return { error: "Your account was created, but email confirmation is switched on in Supabase. Turn it off, or confirm the email, then sign in.", values };
  }

  if (kind === "adviser" || kind === "institution") {
    // Only the server can make a staff account; the database rejects a user changing their own role.
    const res = await supabaseAdmin()
      .from("profiles")
      .update({ role: kind, unit: unit || (kind === "adviser" ? "Career Services" : "Institution") })
      .eq("id", data.user!.id);
    if (res.error) return { error: `Your account was created, but we couldn't set your staff role: ${res.error.message}`, values };
  }

  revalidatePath("/", "layout");
  redirect(kind === "student" ? "/onboarding" : "/staff/undertaking");
}

export async function signOut() {
  if (REAL) {
    const { sb } = await session();
    await sb.auth.signOut();
  }
  revalidatePath("/", "layout");
  redirect(REAL ? "/sign-in" : "/");
}
