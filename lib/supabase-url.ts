/**
 * Accepts the common ways a Supabase project URL gets pasted and returns the API URL:
 * "https://abc.supabase.co", "abc.supabase.co", the project ref "abc…", or a dashboard link
 * "https://supabase.com/dashboard/project/abc…". Returns null if it can't tell.
 */
export function normaliseSupabaseUrl(raw: string | undefined): string | null {
  const v = raw?.trim().replace(/^["']|["']$/g, "").trim().replace(/\/+$/, "");
  // A key pasted into the URL line (JWT or sb_ key) is never a URL.
  if (!v || /^(eyJ|sb_)/.test(v)) return null;
  const dashboard = /supabase\.com\/dashboard\/project\/([a-z0-9]{20})/i.exec(v);
  if (dashboard) return `https://${dashboard[1].toLowerCase()}.supabase.co`;
  if (/^[a-z0-9]{20}$/i.test(v)) return `https://${v.toLowerCase()}.supabase.co`;
  if (/^https?:\/\/[^\s/]+$/i.test(v)) return v.replace(/\/rest\/v1$/, "");
  if (/^https?:\/\/[^\s/]+\/rest\/v1$/i.test(v)) return v.replace(/\/rest\/v1$/, "");
  if (/^[a-z0-9-]+(\.[a-z0-9-]+)+(:\d+)?$/i.test(v)) return `https://${v}`;
  return null;
}

/** Trims spaces and surrounding quotes from a pasted key. */
export const cleanKey = (raw: string | undefined) => raw?.trim().replace(/^["']|["']$/g, "").trim() || undefined;
