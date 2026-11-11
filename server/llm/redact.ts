// Strips personal details from text before it goes to an AI provider (System Design 5.4). Pure.
// Catches: the student's own name (passed in), names after "my name is", titles (Encik, Puan, Dr, Sir...),
// Malay and Indian patronymics (bin, binti, a/l, a/p), names after words like "teammate" or "lecturer",
// emails, URLs and bare domains, Malaysian IC numbers, passport-like ids and phone numbers.
// It is a filter, not a guarantee: the prompt also tells the model never to repeat personal details.

export const PLACEHOLDER = {
  name: "[name]",
  email: "[email]",
  link: "[link]",
  id: "[id number]",
  phone: "[phone]",
} as const;

const NAME_WORD = String.raw`[A-Z][a-zA-Z'’\-]+`;
const NAME_SEQ = String.raw`${NAME_WORD}(?:\s+${NAME_WORD}){0,3}`;
// After a title or a role word the name may be up to three capitalised words.
const TITLES = String.raw`(?:Encik|En\.|Puan|Pn\.|Cik|Tuan|Dato'?|Datuk|Datin|Tan Sri|Ustaz|Ustazah|Dr\.?|Prof\.?|Mr\.?|Mrs\.?|Ms\.?|Miss|Madam|Sir|Mdm\.?)`;
// Lead words match in any case; the name after them must be capitalised, so these regexes do not use the i flag.
const anyCase = (words: string[]) => `(?:${words.map((w) => `[${w[0]!.toUpperCase()}${w[0]}]${w.slice(1)}`).join("|")})`;
const ROLES = anyCase(["teammate", "team mate", "groupmate", "group mate", "classmate", "friend", "colleague", "lecturer", "tutor",
  "supervisor", "manager", "boss", "mentor", "leader", "partner", "senior", "junior", "adviser", "advisor", "client", "customer"]);
const NAME_LEADS = anyCase(["my name is", "i am called", "i'm called", "call me", "name's"]);

const PATTERNS: [RegExp, string][] = [
  // Emails first, so their domains are not caught as links.
  [/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, PLACEHOLDER.email],
  // URLs and bare domains (example.com, github.com/aina).
  [/\b(?:https?:\/\/|www\.)[^\s<>"')]+/gi, PLACEHOLDER.link],
  [/\b[a-z0-9-]+(?:\.[a-z0-9-]+)*\.(?:com|net|org|edu|gov|io|dev|app|my|co|ai|me|info|xyz)(?:\.my)?(?:\/[^\s<>"')]*)?\b/gi, PLACEHOLDER.link],
  // Malaysian IC: YYMMDD-PB-###G, with or without dashes or spaces.
  [/\b\d{6}[-\s]?\d{2}[-\s]?\d{4}\b/g, PLACEHOLDER.id],
  // Passport-like ids: one or two letters then 7 to 9 digits.
  [/\b[A-Z]{1,2}\d{7,9}\b/g, PLACEHOLDER.id],
  // Phones: +60 / 60 / 0 prefixes, mobile 01x and landlines, with spaces or dashes.
  [/(?:\+?60[-\s]?|\b0)\d{1,2}[-\s]?\d{3,4}[-\s]?\d{4}\b/g, PLACEHOLDER.phone],
  // Any other run of 9 or more digits (allowing separators) is treated as a phone or id.
  [/\+?\b\d(?:[-\s]?\d){8,}\b/g, PLACEHOLDER.phone],
];

const NAME_PATTERNS: RegExp[] = [
  new RegExp(String.raw`\b(${NAME_LEADS})\s+${NAME_SEQ}`, "g"),
  new RegExp(String.raw`\b${TITLES}\s+${NAME_SEQ}`, "g"),
  new RegExp(String.raw`\b${NAME_SEQ}\s+(?:bin|binti|bt\.?|bte\.?|a\/l|a\/p|s\/o|d\/o)\s+${NAME_SEQ}`, "g"),
  new RegExp(String.raw`\b(${ROLES})\s+${NAME_SEQ}`, "g"),
];

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const COMMON = new Set(["bin", "binti", "bt", "bte", "a/l", "a/p", "al", "ap", "the", "and"]);

export function redact(text: string, knownNames: readonly string[] = []): string {
  let out = text;
  for (const [re, ph] of PATTERNS) out = out.replace(re, ph);

  // The student's own name (and each part of it, 3+ letters) wherever it appears.
  const parts = new Set<string>();
  for (const full of knownNames) {
    const trimmed = full.trim();
    if (trimmed.length >= 3) parts.add(trimmed);
    for (const p of trimmed.split(/\s+/)) if (p.length >= 3 && !COMMON.has(p.toLowerCase())) parts.add(p);
  }
  for (const p of [...parts].sort((a, b) => b.length - a.length)) {
    out = out.replace(new RegExp(String.raw`(?<![\p{L}])${escape(p)}(?![\p{L}])`, "giu"), PLACEHOLDER.name);
  }

  // "my name is Aina" keeps the lead-in; titles, patronymics and role names are replaced whole except the role word.
  out = out.replace(NAME_PATTERNS[0]!, (_m, lead: string) => `${lead} ${PLACEHOLDER.name}`);
  out = out.replace(NAME_PATTERNS[1]!, PLACEHOLDER.name);
  out = out.replace(NAME_PATTERNS[2]!, PLACEHOLDER.name);
  out = out.replace(NAME_PATTERNS[3]!, (_m, role: string) => `${role} ${PLACEHOLDER.name}`);

  // Collapse "[name] [name]" left by overlapping rules.
  return out.replace(/\[name\](?:\s+\[name\])+/g, PLACEHOLDER.name);
}
