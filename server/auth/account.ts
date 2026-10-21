import "server-only";
import { redirect } from "next/navigation";
import { getStore } from "../data";
import { REAL } from "../env";
import { session } from "../supabase/client";
import type { Consent, Staff } from "@/lib/types";

export type Account =
  | { kind: "signed-out" }
  | { kind: "student"; consent: Consent | null }
  | { kind: "staff"; staff: Staff };

/** Who is using the app right now. In fixtures mode it is always the sample student. */
export async function currentAccount(): Promise<Account> {
  if (REAL) {
    const { user } = await session();
    if (!user) return { kind: "signed-out" };
  }
  const store = getStore();
  const staff = await store.getStaff();
  if (staff) return { kind: "staff", staff };
  return { kind: "student", consent: await store.getConsent() };
}

/** Where each kind of account starts. */
export function homeFor(account: Account): string {
  if (account.kind === "signed-out") return "/sign-in";
  if (account.kind === "staff") {
    if (!account.staff.undertakingAccepted) return "/staff/undertaking";
    return account.staff.role === "institution" ? "/institution" : "/adviser";
  }
  return account.consent?.processing ? "/map" : "/onboarding";
}

/** For student pages: signed in, a student, and has agreed to processing. */
export async function requireStudent(): Promise<Consent> {
  const account = await currentAccount();
  if (account.kind !== "student" || !account.consent?.processing) redirect(homeFor(account));
  return account.consent;
}

/** For staff pages: the right role and the confidentiality undertaking accepted. */
export async function requireStaff(role: "adviser" | "institution"): Promise<Staff> {
  const account = await currentAccount();
  if (account.kind !== "staff" || account.staff.role !== role || !account.staff.undertakingAccepted) redirect(homeFor(account));
  return account.staff;
}
