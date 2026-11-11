import "server-only";
import type { Result } from "../../lib/result.ts";
import { err, ok } from "../../lib/result.ts";
import { env } from "../env.ts";

// Emails carry status, time and link only: never shared data or feedback text (System Design 5.3).
export type Email = { to: string; subject: string; text: string };

const BACKOFF_MS = [1_000, 2_000, 4_000];
const TIMEOUT_MS = 5_000;

export async function sendEmail(mail: Email): Promise<Result<{ id?: string }>> {
  const e = env();
  if (!e.RESEND_API_KEY) {
    console.info("[email] RESEND_API_KEY not set; not sent:", mail.subject);
    return ok({});
  }
  for (let attempt = 0; attempt < BACKOFF_MS.length; attempt++) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        signal: AbortSignal.timeout(TIMEOUT_MS),
        headers: { authorization: `Bearer ${e.RESEND_API_KEY}`, "content-type": "application/json" },
        body: JSON.stringify({ from: e.EMAIL_FROM, to: mail.to, subject: mail.subject, text: mail.text }),
      });
      if (res.ok) return ok((await res.json()) as { id?: string });
      if (res.status < 500 && res.status !== 429) break; // not worth retrying
    } catch {
      // network error or timeout: retry
    }
    await new Promise((r) => setTimeout(r, BACKOFF_MS[attempt]));
  }
  return err("EMAIL_FAILED", "We couldn't send the email. The status is still shown in the app.");
}
