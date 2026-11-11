import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { checkFiles, expandSets, importRow, toRubric, SHARED, type InterviewFile } from "@/content/interview/sets.ts";
import { checklist, explain, total } from "@/server/engines/feedback.ts";
import { SAMPLES } from "./ai-interview-samples.ts";

const dir = fileURLToPath(new URL("../../content/interview", import.meta.url));
const files: InterviewFile[] = readdirSync(dir).filter((f) => f.endsWith(".json")).sort()
  .map((f) => JSON.parse(readFileSync(join(dir, f), "utf8")) as InterviewFile);
const questions = files.flatMap((f) => f.questions);

describe("interview content", () => {
  it("passes the format checks", () => {
    expect(checkFiles(files)).toEqual([]);
  });
  it("names each file after its occupation", () => {
    for (const f of readdirSync(dir).filter((n) => n.endsWith(".json"))) {
      const file = JSON.parse(readFileSync(join(dir, f), "utf8")) as InterviewFile;
      expect(f).toBe(file.occupation === SHARED ? "behavioural.json" : `${file.occupation}.json`);
    }
  });
  it("gives the AI engineer a technical and a behavioural round of three", () => {
    const { rows, noTechnical } = expandSets(files, ["2519-03", "2524-03"]);
    const ai = rows.filter((r) => r.code === "2519-03");
    expect(ai.filter((r) => r.round === "technical").map((r) => r.position)).toEqual([1, 2, 3]);
    expect(ai.filter((r) => r.round === "behavioural").map((r) => r.position)).toEqual([1, 2, 3]);
    expect(ai[0]!.prompt).toMatch("INNER JOIN");
    expect(noTechnical).toEqual(["2524-03"]);
  });
  it("carries why and source in the rubric column for the import", () => {
    const row = importRow(expandSets(files, ["2519-03"]).rows[0]!);
    expect(row.key).toBe("2519-03:technical:1");
    expect(row.rubric.why).toMatch("database queries");
    expect(row.rubric.keyPoints.length).toBeGreaterThanOrEqual(2);
  });
  it("reports files whose occupation is not in the reference", () => {
    expect(expandSets(files, ["2519-03"]).unknownCodes).toContain("3514");
  });
});

describe("rubrics mark sample answers sensibly", () => {
  it("has three or more samples per question", () => {
    for (const q of questions) expect((SAMPLES[q.id] ?? []).length).toBeGreaterThanOrEqual(3);
  });
  for (const q of questions) {
    it(q.id, () => {
      const rubric = toRubric(q.rubric);
      const samples = SAMPLES[q.id] ?? [];
      for (const s of samples) expect({ answer: s.answer.slice(0, 50), marks: checklist(s.answer, rubric, s.projects ?? []) }).toEqual({ answer: s.answer.slice(0, 50), marks: s.expect });
      // Strong answers score higher than weak ones.
      const totals = samples.map((s) => total(checklist(s.answer, rubric, s.projects ?? [])));
      expect(totals[0]!).toBeGreaterThan(totals[totals.length - 1]!);
    });
  }
});

describe("checklist notes", () => {
  it("names missing points and parts in plain words", () => {
    const q = questions.find((x) => x.id === "2519-03-t3")!;
    const answer = "Overfitting means the model is too good on the training data but bad on unseen data.";
    const rubric = toRubric(q.rubric);
    const e = explain(answer, rubric, checklist(answer, rubric));
    expect(e.missingPoints).toContain("compare training and validation or test results");
    expect(e.missingParts).toEqual(["the situation", "what you did", "the result"]);
    expect(e.tip).toMatch("Give a fuller answer");
  });
  it("explains a skipped answer without marks", () => {
    const q = questions[0]!;
    const e = explain("", toRubric(q.rubric), { structure: 0, accuracy: 0, evidence: 0 }, true);
    expect(e.headline).toBe("Skipped");
  });
});
