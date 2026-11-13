import "server-only";
// Name chip for the signed-in user's header, from their own profile (D1). There is no notifications
// table yet, so the bell shows an empty list until the backend adds one.
import { redirect } from "next/navigation";
import type { HeaderAccount, HeaderNotification } from "@/components/app-header";
import { ownProfile } from "@/server/data/account";
import { currentUser } from "@/server/data/supabase";

export function nameParts(fullName: string): { firstName: string; initials: string } {
  const words = fullName.trim().split(/\s+/).filter((w) => !/^(pn|en|ms|mr|mrs|dr|cik|puan|encik)\.?$/i.test(w));
  const first = words[0] ?? fullName.trim();
  const last = words.length > 1 ? (words[words.length - 1] ?? "") : "";
  const initials = (last ? first.charAt(0) + last.charAt(0) : first.slice(0, 2)).toUpperCase();
  return { firstName: first, initials };
}

export async function headerFor(links: HeaderAccount["links"]): Promise<{ account: HeaderAccount; notifications: HeaderNotification[] }> {
  const user = await currentUser();
  if (!user) redirect("/sign-in");
  const profile = await ownProfile(user.id);
  const { firstName, initials } = nameParts(profile?.fullName || "You");
  return { account: { firstName, initials, links }, notifications: [] };
}
