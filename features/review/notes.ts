// Notes to review cards without AI (Notes to review cards board, "Use my headings and bold words"). Pure.
// The default method, and the only one for under-18 accounts. Each heading or bold term becomes the front of a
// card and the text after it the back. Plain text works too: a short line followed by a longer one counts as a
// heading, and "Term: meaning" or "Term - meaning" lines become cards.

export type DraftCard = { front: string; back: string };

export const MAX_CARDS = 50;
const FRONT_MAX = 300;
const BACK_MAX = 600;

export type NotesKind = "markdown" | "text";

/** Which parser a file name gets, or why it can't be read. */
export function notesKind(fileName: string): { ok: true; kind: NotesKind } | { ok: false; message: string } {
  const ext = fileName.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1] ?? "";
  if (ext === "md" || ext === "markdown") return { ok: true, kind: "markdown" };
  if (ext === "txt") return { ok: true, kind: "text" };
  if (ext === "pdf") return { ok: false, message: "PDF notes can't be read yet. Copy the text into a .md or .txt file and add that instead." };
  return { ok: false, message: "Choose a Markdown (.md) or text (.txt) file." };
}

/** Inline Markdown to plain text: links, images, code, emphasis, HTML tags. */
export function plain(s: string): string {
  return s
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/(\*\*|__)(.+?)\1/g, "$2")
    .replace(/(^|[\s(])[*_]([^*_\s][^*_]*?)[*_](?=[\s).,;:!?]|$)/g, "$1$2")
    .replace(/\s+/g, " ")
    .trim();
}

function clip(s: string, max: number): string {
  if (s.length <= max) return s;
  const cut = s.slice(0, max);
  const end = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("? "), cut.lastIndexOf("! "));
  return end > max / 3 ? cut.slice(0, end + 1) : `${cut.slice(0, max - 1).trimEnd()}…`;
}

type Line = { raw: string; text: string; heading?: string };

function lines(source: string, kind: NotesKind): Line[] {
  const out: Line[] = [];
  let inFence = false;
  const body = source.replace(/\r\n?/g, "\n").replace(/^---\n[\s\S]*?\n---\n/, ""); // drop front matter
  for (const raw of body.split("\n")) {
    if (/^\s*(```|~~~)/.test(raw)) { inFence = !inFence; continue; }
    if (inFence) continue;
    const h = kind === "markdown" ? /^\s{0,3}#{1,6}\s+(.+?)\s*#*\s*$/.exec(raw) : null;
    const text = plain(raw.replace(/^\s*(?:[-*+•]|\d+[.)])\s+/, "").replace(/^\s*>\s?/, ""));
    out.push(h ? { raw, text: plain(h[1]!), heading: plain(h[1]!) } : { raw, text });
  }
  // Setext headings (Title / =====) and, in plain text, short title lines followed by a longer line.
  for (let i = 0; i < out.length - 1; i++) {
    const cur = out[i]!;
    const next = out[i + 1]!;
    if (cur.heading || !cur.text) continue;
    if (kind === "markdown" && /^\s*(=+|-+)\s*$/.test(next.raw) && cur.text) {
      cur.heading = cur.text;
      next.text = "";
      continue;
    }
    if (kind === "text") {
      const looksLikeTitle = cur.text.length <= 60 && !/[.,;!?]$/.test(cur.text) && !/[:\-–]\s/.test(cur.text);
      const nextIsBody = next.text.length > cur.text.length && !/^\s*$/.test(next.raw);
      const prevBlank = i === 0 || !out[i - 1]!.text;
      if (looksLikeTitle && nextIsBody && prevBlank) cur.heading = cur.text.replace(/:$/, "");
    }
  }
  return out;
}

/** Cards from headings, bold terms and "Term: meaning" lines, in the order they appear. No AI. */
export function cardsFromNotes(source: string, kind: NotesKind): DraftCard[] {
  const ls = lines(source, kind);
  const cards: DraftCard[] = [];
  const seen = new Set<string>();
  const add = (front: string, back: string) => {
    const f = clip(front.replace(/[:\-–]\s*$/, "").trim(), FRONT_MAX);
    const b = clip(back.replace(/^[:\-–]\s*/, "").trim(), BACK_MAX);
    const key = f.toLowerCase();
    if (!f || !b || f.toLowerCase() === b.toLowerCase() || seen.has(key) || cards.length >= MAX_CARDS) return;
    seen.add(key);
    cards.push({ front: f, back: b });
  };
  const nextText = (from: number) => {
    for (let j = from; j < ls.length; j++) {
      if (ls[j]!.heading) return "";
      if (ls[j]!.text) return ls[j]!.text;
    }
    return "";
  };

  for (let i = 0; i < ls.length; i++) {
    const l = ls[i]!;
    if (l.heading) {
      add(l.heading, nextText(i + 1));
      continue;
    }
    if (!l.text) continue;

    // Bold terms: "**git switch** moves you onto a branch" or "**Merge conflict**" with the meaning on the next line.
    const bold = [...l.raw.matchAll(/(\*\*|__)(.+?)\1/g)];
    if (bold.length) {
      for (const [idx, m] of bold.entries()) {
        const term = plain(m[2]!);
        const start = m.index! + m[0].length;
        const end = bold[idx + 1]?.index ?? l.raw.length;
        const rest = plain(l.raw.slice(start, end)).replace(/^[\s:,\-–]+/, "");
        // A term inside a sentence ("Use **git log** often") takes the whole line as its meaning.
        const before = plain(l.raw.slice(0, m.index!)).replace(/^\s*(?:[-*+•]|\d+[.)])\s*/, "");
        const back = before ? l.text : rest || nextText(i + 1);
        add(term, back);
      }
      continue;
    }

    // "Term: meaning" and "Term - meaning" lines (short term, real meaning).
    const def = /^(.{2,40}?)\s*(?::|\s[-–]\s)\s*(.{3,})$/.exec(l.text);
    if (def && !/https?$/i.test(def[1]!) && def[1]!.split(" ").length <= 6) add(def[1]!, def[2]!);
  }
  return cards;
}
