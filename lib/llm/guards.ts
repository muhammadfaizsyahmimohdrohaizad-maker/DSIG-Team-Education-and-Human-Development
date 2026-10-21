/** Pulls the JSON value out of a model reply, with or without a ```json fence. Null if there is none. */
export function extractJson(text: string): unknown | null {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const body = (fenced ? fenced[1] : text).trim();
  const start = body.search(/[[{]/);
  if (start < 0) return null;
  const end = Math.max(body.lastIndexOf("}"), body.lastIndexOf("]"));
  if (end <= start) return null;
  try {
    return JSON.parse(body.slice(start, end + 1));
  } catch {
    return null;
  }
}

const words = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(Boolean);

/**
 * True when `hint` repeats `n` or more words in a row from the model answer.
 * Hints must never contain the answer, so a hint that copies a phrase from it is dropped.
 */
export function leaksAnswer(hint: string, modelAnswer: string, n = 7): boolean {
  const a = words(modelAnswer);
  const h = ` ${words(hint).join(" ")} `;
  for (let i = 0; i + n <= a.length; i++) {
    if (h.includes(` ${a.slice(i, i + n).join(" ")} `)) return true;
  }
  return false;
}
