import "server-only";
import { env } from "../env";

/**
 * Sends one plain-text email through Resend (https://resend.com) when RESEND_API_KEY is set;
 * otherwise it only logs that an email would have gone. A failed send never throws, because
 * the booking status is already saved and must not roll back (docs/09 UC7 extension 5b).
 */
export async function sendEmail(message: { to: string; subject: string; text: string }): Promise<void> {
  try {
    if (!env.RESEND_API_KEY) {
      console.info(`[email] not sent (no RESEND_API_KEY): to=${message.to} subject="${message.subject}"`);
      return;
    }
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, "content-type": "application/json" },
      body: JSON.stringify({ from: env.EMAIL_FROM ?? "CareerPrep <onboarding@resend.dev>", to: [message.to], subject: message.subject, text: message.text }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) console.error(`[email] Resend answered ${res.status}: ${(await res.text()).slice(0, 200)}`);
  } catch (e) {
    console.error("[email] send failed:", e instanceof Error ? e.message : e);
  }
}
