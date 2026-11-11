import "server-only";
import { after } from "next/server";
import { saveParentApproval } from "@/server/data/account";
import { sendEmail } from "@/server/email/send";
import { env } from "@/server/env";
import { newParentToken, parentApprovalEmail } from "./rules";

// Not a server action: called by signUp and requestParentApproval with a user id they have checked.

/** Stores a fresh single-use token (hash only, 7-day expiry) and emails the link after the response. */
export async function startParentApproval(userId: string, parentEmail: string): Promise<{ expiresAt: string } | null> {
  const t = newParentToken();
  if (!(await saveParentApproval(userId, parentEmail, t.hash, t.expiresAt))) return null;
  const mail = parentApprovalEmail(env().SITE_URL, t.token);
  after(async () => {
    const res = await sendEmail({ to: parentEmail, ...mail });
    if (!res.ok) console.error(`[parent email] user=${userId} ref=${res.error.ref}`);
  });
  return { expiresAt: t.expiresAt };
}
