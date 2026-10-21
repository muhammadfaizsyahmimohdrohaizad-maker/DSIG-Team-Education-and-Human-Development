import "server-only";

/**
 * Sends one plain-text email. In the demo build nothing leaves the server: the message is
 * printed so you can see exactly what a student would get. A failed send never throws,
 * because the booking status is already saved and must not roll back.
 */
export async function sendEmail(message: { to: string; subject: string; text: string }): Promise<void> {
  try {
    console.info(`[email:demo] to=${message.to} subject="${message.subject}"\n${message.text}`);
  } catch {
    // Intentionally ignored: see above.
  }
}
