// Shape of one content/lessons/<skill>.json file: four lessons, a five-question mastery check
// (each question linked to the lesson it tests) and the review cards made when the check is passed.
// Validated by scripts/reference-payload.ts before import and by tests/unit/content.test.ts.

export type LessonContent = {
  no: 1 | 2 | 3 | 4;
  title: string;
  minutes: number;
  key_points: string[];
  worked_example: { title: string; steps: string[]; code?: string };
  mini_project: { title: string; brief: string; steps: string[]; done_when: string };
};

export type CheckOption = { id: string; text: string };

export type CheckQuestionContent = {
  id: string;
  lesson: 1 | 2 | 3 | 4;
  prompt: string;
  options: CheckOption[];
  answer: string; // option id; server-only, never sent to the browser
  explanation: string;
};

export type LessonFile = {
  skill: string; // skill key from content/reference/skills.json
  title: string;
  lessons: LessonContent[];
  check: CheckQuestionContent[];
  review_cards: { front: string; back: string }[];
};

/** Returns a list of problems; empty means the file is usable. Pure, so the import script and tests share it. */
export function lessonFileProblems(f: LessonFile, knownSkillKeys: ReadonlySet<string>): string[] {
  const p: string[] = [];
  const where = `content/lessons/${f.skill}.json`;
  if (!knownSkillKeys.has(f.skill)) p.push(`${where}: skill "${f.skill}" is not in content/reference/skills.json`);
  const nos = f.lessons.map((l) => l.no).join(",");
  if (nos !== "1,2,3,4") p.push(`${where}: needs lessons 1,2,3,4 in order, has ${nos}`);
  for (const l of f.lessons) {
    if (l.key_points.length < 3) p.push(`${where}: lesson ${l.no} needs at least 3 key points`);
    if (l.worked_example.steps.length < 2) p.push(`${where}: lesson ${l.no} worked example needs steps`);
    if (l.mini_project.steps.length < 2) p.push(`${where}: lesson ${l.no} mini project needs steps`);
  }
  if (f.check.length !== 5) p.push(`${where}: the check needs exactly 5 questions, has ${f.check.length}`);
  const ids = new Set<string>();
  for (const q of f.check) {
    if (ids.has(q.id)) p.push(`${where}: duplicate question id ${q.id}`);
    ids.add(q.id);
    if (![1, 2, 3, 4].includes(q.lesson)) p.push(`${where}: ${q.id} links to lesson ${q.lesson}`);
    if (q.options.length < 2) p.push(`${where}: ${q.id} needs at least 2 options`);
    if (!q.options.some((o) => o.id === q.answer)) p.push(`${where}: ${q.id} answer "${q.answer}" is not one of its options`);
    if (new Set(q.options.map((o) => o.id)).size !== q.options.length) p.push(`${where}: ${q.id} has duplicate option ids`);
  }
  if (f.review_cards.length === 0) p.push(`${where}: needs at least one review card`);
  return p;
}
