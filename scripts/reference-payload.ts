// Builds the payload for public.import_reference from the content/ JSON files, and checks it.
// No I/O and no database: scripts/import-reference.ts reads the files and sends the result.
import { createHash } from "node:crypto";
import { lessonPath, skillUri } from "../content/reference/keys.ts";
import { lessonFileProblems, type LessonFile } from "../content/lessons/types.ts";

type Status = "verified" | "unverified";

export type RawReference = {
  source: { source_version: string };
  interestAreas: { label_en: string; label_ms?: string }[];
  skills: { key: string; label_en: string; label_ms?: string; alt_labels: string[]; esco_label: string; esco_uri: string | null; esco_uri_status: Status }[];
  occupations: {
    code: string; title_en: string; title_ms: string | null; source_url: string; code_status: Status;
    tasks: { en: string }[]; essential_skills: string[]; optional_skills?: string[]; interest_areas: string[];
  }[];
  spm: { min_grade: string; subjects: { subject: string; skills: string[] }[] };
  modules: { programme: string; modules: { id: string; title: string; skills: string[] }[] };
  studyOptions: { options: { key: string; code: string; level: string; kind: string; institution: string; programme: string; duration: string | null; award: string | null; source_url: string; status: Status }[] };
  lessons: LessonFile[];
};

export type ImportPayload = {
  source_version: string;
  interest_areas: { label_en: string; label_ms: string | null }[];
  skills: { uri: string; label_en: string; label_ms: string | null; alt_labels: string[]; esco_label: string; esco_uri: string | null; esco_uri_status: Status }[];
  occupations: { code: string; title_en: string; title_ms: string | null; tasks: string[]; interest_areas: string[]; source_url: string; verified: boolean }[];
  occupation_skills: { code: string; uri: string; essential: boolean }[];
  modules: { id: string; title: string; programme: string }[];
  module_skills: { module_id: string; uri: string }[];
  spm_subject_skills: { subject: string; uri: string; min_grade: string }[];
  study_options: { id: string; code: string; level: string; kind: string; institution: string; programme: string; duration: string | null; award: string | null; source_url: string; verified: boolean }[];
  lessons: { id: string; skill_uri: string; lesson_no: number; title: string; content_path: string }[];
  check_questions: { id: string; lesson_id: string; position: number; prompt: string; options: { id: string; text: string }[]; answer_key: string }[];
};

const LEVELS = new Set(["spm", "pre_university", "diploma", "degree"]);

/** Deterministic UUID (version-5 layout over SHA-1) so re-imports keep the same ids for progress rows. */
export function stableUuid(name: string): string {
  const h = createHash("sha1").update(`careerprep:${name}`).digest();
  h[6] = (h[6]! & 0x0f) | 0x50;
  h[8] = (h[8]! & 0x3f) | 0x80;
  const x = h.subarray(0, 16).toString("hex");
  return `${x.slice(0, 8)}-${x.slice(8, 12)}-${x.slice(12, 16)}-${x.slice(16, 20)}-${x.slice(20, 32)}`;
}

export function buildPayload(raw: RawReference): { payload: ImportPayload; problems: string[] } {
  const problems: string[] = [];
  const keys = new Set(raw.skills.map((s) => s.key));
  const interests = new Set(raw.interestAreas.map((i) => i.label_en));
  const codes = new Set(raw.occupations.map((o) => o.code));
  const need = (where: string, key: string) => { if (!keys.has(key)) problems.push(`${where}: unknown skill "${key}"`); };
  const dupes = (where: string, list: string[]) => {
    const seen = new Set<string>();
    for (const k of list) { if (seen.has(k)) problems.push(`${where}: duplicate "${k}"`); seen.add(k); }
  };

  if (!raw.source.source_version) problems.push("source.json: source_version is empty");
  dupes("skills.json key", raw.skills.map((s) => s.key));
  dupes("occupations.json code", raw.occupations.map((o) => o.code));
  for (const s of raw.skills) {
    if (s.esco_uri_status === "verified" && !s.esco_uri?.startsWith("http://data.europa.eu/esco/skill/")) {
      problems.push(`skills.json ${s.key}: a verified ESCO URI must start with http://data.europa.eu/esco/skill/`);
    }
  }
  for (const o of raw.occupations) {
    for (const k of [...o.essential_skills, ...(o.optional_skills ?? [])]) need(`occupations.json ${o.code}`, k);
    for (const i of o.interest_areas) if (!interests.has(i)) problems.push(`occupations.json ${o.code}: unknown interest area "${i}"`);
    if (o.tasks.length === 0) problems.push(`occupations.json ${o.code}: needs at least one task`);
  }
  for (const m of raw.modules.modules) for (const k of m.skills) need(`gmi-modules.json ${m.id}`, k);
  for (const s of raw.spm.subjects) for (const k of s.skills) need(`spm-subjects.json ${s.subject}`, k);
  for (const o of raw.studyOptions.options) {
    if (!codes.has(o.code)) problems.push(`study-options.json ${o.key}: unknown occupation ${o.code}`);
    if (!LEVELS.has(o.level)) problems.push(`study-options.json ${o.key}: level must be one of ${[...LEVELS].join(", ")}`);
    if (!o.source_url.startsWith("https://")) problems.push(`study-options.json ${o.key}: source_url must be https`);
  }
  dupes("study-options.json key", raw.studyOptions.options.map((o) => o.key));
  dupes("lessons skill", raw.lessons.map((l) => l.skill));
  for (const f of raw.lessons) problems.push(...lessonFileProblems(f, keys));

  // The ESCO preferred label is matched by A8 too, but only when one skill alone maps to it
  // (several of our skills can sit under one broad ESCO concept such as "machine learning").
  const escoCount = new Map<string, number>();
  for (const s of raw.skills) escoCount.set(s.esco_label, (escoCount.get(s.esco_label) ?? 0) + 1);

  const payload: ImportPayload = {
    source_version: raw.source.source_version,
    interest_areas: raw.interestAreas.map((i) => ({ label_en: i.label_en, label_ms: i.label_ms ?? null })),
    skills: raw.skills.map((s) => ({
      uri: skillUri(s.key), label_en: s.label_en, label_ms: s.label_ms ?? null,
      alt_labels: escoCount.get(s.esco_label) === 1 ? [...new Set([...s.alt_labels, s.esco_label])] : s.alt_labels,
      esco_label: s.esco_label, esco_uri: s.esco_uri, esco_uri_status: s.esco_uri_status,
    })),
    occupations: raw.occupations.map((o) => ({
      code: o.code, title_en: o.title_en, title_ms: o.title_ms, tasks: o.tasks.map((t) => t.en),
      interest_areas: o.interest_areas, source_url: o.source_url, verified: o.code_status === "verified",
    })),
    occupation_skills: raw.occupations.flatMap((o) => [
      ...o.essential_skills.map((k) => ({ code: o.code, uri: skillUri(k), essential: true })),
      ...(o.optional_skills ?? []).map((k) => ({ code: o.code, uri: skillUri(k), essential: false })),
    ]),
    modules: raw.modules.modules.map((m) => ({ id: m.id, title: m.title, programme: raw.modules.programme })),
    module_skills: raw.modules.modules.flatMap((m) => m.skills.map((k) => ({ module_id: m.id, uri: skillUri(k) }))),
    spm_subject_skills: raw.spm.subjects.flatMap((s) => s.skills.map((k) => ({ subject: s.subject, uri: skillUri(k), min_grade: raw.spm.min_grade }))),
    study_options: raw.studyOptions.options.map((o) => ({
      id: stableUuid(`study-option:${o.key}`), code: o.code, level: o.level, kind: o.kind, institution: o.institution,
      programme: o.programme, duration: o.duration, award: o.award, source_url: o.source_url, verified: o.status === "verified",
    })),
    lessons: raw.lessons.flatMap((f) => f.lessons.map((l) => ({
      id: stableUuid(`lesson:${f.skill}:${l.no}`), skill_uri: skillUri(f.skill), lesson_no: l.no, title: l.title, content_path: lessonPath(f.skill, l.no),
    }))),
    check_questions: raw.lessons.flatMap((f) => f.check.map((q, i) => ({
      id: stableUuid(`check:${q.id}`), lesson_id: stableUuid(`lesson:${f.skill}:${q.lesson}`), position: i + 1,
      prompt: q.prompt, options: q.options, answer_key: q.answer,
    }))),
  };
  return { payload, problems };
}
