// Mock interview sets: file format, checks and the rows the reference import writes to ref.interview_questions.
// Pure (no fs), so scripts/import-reference.ts and the unit tests can both use it.
//
// One JSON file per occupation (MASCO code as in content/reference/occupations.json), plus behavioural.json
// (occupation "*"), the behavioural round for every occupation that has no behavioural round of its own.
// Each round has exactly three questions, positions 1 to 3. The rubric feeds server/engines/feedback.ts
// checklist(): situation/action/result/evidence words are the shared STAR lists below plus any the question
// adds; keyPoints are the technical points, each with synonyms. Matching is lower-case substring matching,
// so "join" also matches "joined"; avoid short words that sit inside other words.
import type { InterviewRound } from "../../lib/types.ts";
import type { Rubric } from "../../server/engines/feedback.ts";

export type RubricEntry = {
  keyPoints: { point: string; words: string[] }[];
  situation?: string[];
  action?: string[];
  result?: string[];
  evidence?: string[];
};

export type QuestionEntry = {
  id: string;
  round: InterviewRound;
  position: 1 | 2 | 3;
  text: string;
  /** "Why employers ask this", shown under the question. */
  why: string;
  /** The eMASCO task the question was built from, or why it is not tied to one. */
  source: string;
  rubric: RubricEntry;
};

export type InterviewFile = {
  occupation: string;
  title: string;
  _note?: string;
  questions: QuestionEntry[];
};

export type InterviewRow = {
  key: string;
  code: string;
  round: InterviewRound;
  position: number;
  prompt: string;
  why: string;
  source: string;
  rubric: Rubric;
};

export const SHARED = "*";

/** Shared STAR words, merged into every rubric. */
export const STAR = {
  situation: [
    "when i ", "when we ", "when our", "when my", "in my", "in our", "on my", "on our", "during", "for my", "for our", "at my", "last semester", "last year",
    "project", "assignment", "internship", "my class", "our class", "the task", "the problem was", "we had", "i had",
    "i was asked", "we were asked", "for example", "for instance", "situation", "once",
  ],
  action: [
    "i used", "i wrote", "i built", "i added", "i checked", "i asked", "i made", "i set", "i ran", "i tested",
    "i fixed", "i split", "i created", "i changed", "i decided", "i started", "i talked", "i read", "i compared",
    "i looked", "i tried", "i went", "i spoke", "i suggested", "i learned to", "i learnt to", "i followed", "i kept",
    "i took", "i would", "i'd", "i will", "i put", "i plotted", "i trained", "i cleaned", "i searched", "i moved",
    "i installed", "i replaced", "i opened", "i traced", "i watched", "i listed", "i reset", "i restarted",
    "i found", "i reproduced", "i only", "i raised", "i explained", "i showed", "i also", "i turned", "i first", "i told",
    "we used", "we built", "we wrote", "we decided", "we agreed", "we split", "we tested", "we met", "we talked",
    "we compared", "we tried", "we changed",
  ],
  result: [
    "so that", "as a result", "result", "in the end", "it worked", "which meant", "this meant", "afterwards",
    "reduced", "improved", "faster", "solved", "finished", "learned", "learnt", "outcome", "ended up", "turned out",
    "so i could", "so we could", "so it", "so the", "which showed", "which let", "that way", "now it", "now we",
    "worked again", "was fixed", "got fixed", "on time", "submitted", "we got", "i got", "passed", "came back",
    "so she", "so he", "so they", "so we know",
  ],
  evidence: [
    "project", "assignment", "coursework", "fyp", "internship",
    "my class", "in class", "my app", "our app", "my website", "our website", "my chatbot", "our chatbot",
    "my team", "our team", "my group", "our group", "hackathon", "club", "part-time", "my lab", "in the lab",
    "my capstone", "my diploma", "our system", "my system", "my model", "our model", "my notebook", "my code",
  ],
} as const;

const union = (base: readonly string[], extra: readonly string[] = []) => [...new Set([...base, ...extra].map((w) => w.toLowerCase()))];

export function toRubric(entry: RubricEntry): Rubric {
  return {
    situation: union(STAR.situation, entry.situation),
    action: union(STAR.action, entry.action),
    result: union(STAR.result, entry.result),
    evidence: union(STAR.evidence, entry.evidence),
    keyPoints: entry.keyPoints.map((k) => ({ point: k.point, words: union([], k.words) })),
  };
}

/** Problems that would make a set unusable. Empty means the files are fine. */
export function checkFiles(files: readonly InterviewFile[]): string[] {
  const problems: string[] = [];
  const ids = new Set<string>();
  const codes = new Set<string>();
  for (const f of files) {
    if (!f.occupation) problems.push(`${f.title}: occupation is missing`);
    if (codes.has(f.occupation)) problems.push(`${f.occupation}: more than one file`);
    codes.add(f.occupation);
    const byRound = new Map<string, number[]>();
    for (const q of f.questions) {
      const where = `${f.occupation} ${q.id}`;
      if (ids.has(q.id)) problems.push(`${where}: duplicate id`);
      ids.add(q.id);
      if (q.round !== "technical" && q.round !== "behavioural") problems.push(`${where}: round must be technical or behavioural`);
      if (![1, 2, 3].includes(q.position)) problems.push(`${where}: position must be 1, 2 or 3`);
      if (!q.text?.trim()) problems.push(`${where}: text is empty`);
      if (!q.why?.trim()) problems.push(`${where}: why is empty`);
      if (!q.source?.trim()) problems.push(`${where}: source is empty`);
      if (!q.rubric || q.rubric.keyPoints.length < 2) problems.push(`${where}: rubric needs at least 2 key points`);
      for (const k of q.rubric?.keyPoints ?? []) {
        if (!k.point.trim() || !k.words.length) problems.push(`${where}: key point "${k.point}" needs words`);
        for (const w of k.words) if (w.trim().length < 3) problems.push(`${where}: key word "${w}" is too short to match safely`);
      }
      byRound.set(q.round, [...(byRound.get(q.round) ?? []), q.position]);
    }
    for (const [round, positions] of byRound) {
      const sorted = [...positions].sort().join(",");
      if (sorted !== "1,2,3") problems.push(`${f.occupation} ${round}: needs exactly positions 1, 2 and 3 (has ${sorted})`);
    }
    if (f.occupation === SHARED && byRound.has("technical")) problems.push(`shared set: technical questions belong to one occupation`);
  }
  return problems;
}

/**
 * Rows for ref.interview_questions. Every occupation in `occupationCodes` gets its own rounds, and the shared
 * behavioural round when it has none. Files for codes not in the reference are returned in `unknownCodes`
 * (not imported); occupations with no technical round are returned in `noTechnical`.
 */
export function expandSets(files: readonly InterviewFile[], occupationCodes: readonly string[]) {
  const shared = files.find((f) => f.occupation === SHARED);
  const own = new Map(files.filter((f) => f.occupation !== SHARED).map((f) => [f.occupation, f]));
  const rows: InterviewRow[] = [];
  const noTechnical: string[] = [];
  for (const code of occupationCodes) {
    const file = own.get(code);
    const ownQs = file?.questions ?? [];
    const hasOwn = (r: InterviewRound) => ownQs.some((q) => q.round === r);
    if (!hasOwn("technical")) noTechnical.push(code);
    const qs = [...ownQs, ...(hasOwn("behavioural") ? [] : shared?.questions ?? [])];
    for (const q of qs) {
      rows.push({
        key: `${code}:${q.round}:${q.position}`,
        code,
        round: q.round,
        position: q.position,
        prompt: q.text,
        why: q.why,
        source: q.source,
        rubric: toRubric(q.rubric),
      });
    }
  }
  const unknownCodes = [...own.keys()].filter((c) => !occupationCodes.includes(c));
  return { rows, noTechnical, unknownCodes };
}
