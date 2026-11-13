import "server-only";
// D3 reference data (ref schema): read-only for signed-in users. Needs "ref" in the exposed API schemas.
import { cache } from "react";
import { db } from "./supabase.ts";
import type { EducationLevel, Occupation, SkillSuggestion, StudyOption } from "../../lib/types.ts";
import type { SpmLink } from "../engines/matches.ts";

export type OccupationRow = Occupation & { titleMs?: string; sourceUrl?: string };
export type SkillRow = { uri: string; label: string; altLabels: string[] };
export type LessonRow = { id: string; skillUri: string; no: number; title: string };

async function ref() {
  return (await db()).schema("ref");
}

function fail(what: string, error: { message: string }): never {
  throw new Error(`reference: ${what}: ${error.message}`);
}

export const getOccupations = cache(async (): Promise<OccupationRow[]> => {
  const r = await ref();
  const [occ, links] = await Promise.all([
    r.from("occupations").select("code, title_en, title_ms, tasks, interest_areas, source_url").order("code"),
    r.from("occupation_skills").select("code, uri, essential"),
  ]);
  if (occ.error) fail("occupations", occ.error);
  if (links.error) fail("occupation skills", links.error);
  const skillsOf = new Map<string, string[]>();
  const optionalOf = new Map<string, string[]>();
  for (const link of links.data) {
    const bucket = link.essential ? skillsOf : optionalOf;
    bucket.set(link.code, [...(bucket.get(link.code) ?? []), link.uri]);
  }
  return (occ.data as { code: string; title_en: string; title_ms: string | null; tasks: string[]; interest_areas: string[]; source_url: string | null }[])
    .map((o) => ({
      code: o.code,
      titleEn: o.title_en,
      titleMs: o.title_ms ?? undefined,
      tasks: o.tasks,
      essentialSkills: skillsOf.get(o.code) ?? [],
      optionalSkills: optionalOf.get(o.code) ?? [],
      interestAreas: o.interest_areas,
      sourceUrl: o.source_url ?? undefined,
    }));
});

export const getSkills = cache(async (): Promise<Map<string, SkillRow>> => {
  const { data, error } = await (await ref()).from("skills").select("uri, label_en, alt_labels").order("label_en");
  if (error) fail("skills", error);
  return new Map((data as { uri: string; label_en: string; alt_labels: string[] }[])
    .map((s) => [s.uri, { uri: s.uri, label: s.label_en, altLabels: s.alt_labels }]));
});

export const getInterestAreas = cache(async (): Promise<string[]> => {
  const { data, error } = await (await ref()).from("interest_areas").select("label_en");
  if (error) fail("interest areas", error);
  return (data as { label_en: string }[]).map((i) => i.label_en);
});

export type ModuleRow = { id: string; title: string; programme: string; skills: string[] };

export const getModules = cache(async (): Promise<ModuleRow[]> => {
  const r = await ref();
  const [mods, links] = await Promise.all([
    r.from("modules").select("id, title, programme").order("title"),
    r.from("module_skills").select("module_id, uri"),
  ]);
  if (mods.error) fail("modules", mods.error);
  if (links.error) fail("module skills", links.error);
  const skillsOf = new Map<string, string[]>();
  for (const l of links.data as { module_id: string; uri: string }[]) skillsOf.set(l.module_id, [...(skillsOf.get(l.module_id) ?? []), l.uri]);
  return (mods.data as { id: string; title: string; programme: string }[]).map((m) => ({ ...m, skills: skillsOf.get(m.id) ?? [] }));
});

/** SPM subject -> skills it shows at the linked minimum grade. Subjects with no link are listed with none. */
export const getSpmLinks = cache(async (): Promise<Map<string, SpmLink[]>> => {
  const { data, error } = await (await ref()).from("spm_subject_skills").select("subject, uri, min_grade");
  if (error) fail("SPM links", error);
  const out = new Map<string, SpmLink[]>();
  for (const l of data as { subject: string; uri: string; min_grade: string }[]) {
    out.set(l.subject, [...(out.get(l.subject) ?? []), { uri: l.uri, minGrade: l.min_grade }]);
  }
  return out;
});

/** A8: suggestions for a typed skill (pg_trgm, similarity 0.4 or more). The student confirms before anything is saved. */
export async function suggestSkills(text: string, limit = 3): Promise<SkillSuggestion[]> {
  const { data, error } = await (await db()).rpc("suggest_skills", { p_text: text, p_limit: limit });
  if (error) fail("skill suggestions", error);
  return (data as { uri: string; label: string; score: number }[]).map((s) => ({ uri: s.uri, label: s.label, score: s.score }));
}

const STUDY_COLUMNS = "id, code, level, kind, institution, programme, duration, award, source_url, verified";
type StudyRow = { id: string; code: string; level: EducationLevel; kind: string; institution: string; programme: string; duration: string | null; award: string | null; source_url: string; verified: boolean };
const toStudyOption = (o: StudyRow): StudyOption => ({
  id: o.id, code: o.code, level: o.level, kind: o.kind, institution: o.institution, programme: o.programme,
  duration: o.duration ?? undefined, award: o.award ?? undefined, sourceUrl: o.source_url, verified: o.verified,
});

export async function getStudyOptions(code: string): Promise<StudyOption[]> {
  const { data, error } = await (await ref()).from("study_options").select(STUDY_COLUMNS).eq("code", code).order("institution");
  if (error) fail("study options", error);
  return (data as StudyRow[]).map(toStudyOption);
}

export async function studyOptionExists(id: string): Promise<boolean> {
  const { data, error } = await (await ref()).from("study_options").select("id").eq("id", id).maybeSingle();
  if (error) fail("study option", error);
  return !!data;
}

export const getLessons = cache(async (): Promise<LessonRow[]> => {
  const { data, error } = await (await ref()).from("lessons").select("id, skill_uri, lesson_no, title").order("lesson_no");
  if (error) fail("lessons", error);
  return (data as { id: string; skill_uri: string; lesson_no: number; title: string | null }[])
    .map((l) => ({ id: l.id, skillUri: l.skill_uri, no: l.lesson_no, title: l.title ?? `Lesson ${l.lesson_no}` }));
});
