import "server-only";
// D1 profiles, projects and saved "Tell us about yourself" sessions. Every query runs as the user (RLS).
import { db } from "./supabase.ts";
import type { EducationLevel, Profile, Project, SpmGrade } from "../../lib/types.ts";

export type ProfileDetails = Profile & { reminderEmails: boolean; fullName: string; educationLevel?: EducationLevel };

export type ProfileFields = {
  educationLevel: EducationLevel;
  spmGrades: SpmGrade[];
  moduleIds: string[];
  skills: string[];
  interests: string[];
  projects: Project[];
  jobInMind?: string;
};

function fail(what: string, error: { message: string }): never {
  throw new Error(`profiles: ${what}: ${error.message}`);
}

type ProfileRow = {
  reminder_emails: boolean; user_id: string; full_name: string; is_under_18: boolean; education_level: EducationLevel | null;
  spm_grades: SpmGrade[]; module_ids: string[]; skills: string[]; interests: string[];
  job_in_mind: string | null; target_occupation: string | null;
};

export async function getProfile(userId: string): Promise<ProfileDetails | null> {
  const client = await db();
  const [p, projects] = await Promise.all([
    client.from("profiles")
      .select("reminder_emails, user_id, full_name, is_under_18, education_level, spm_grades, module_ids, skills, interests, job_in_mind, target_occupation")
      .eq("user_id", userId).maybeSingle(),
    client.from("projects").select("name, description, link").eq("user_id", userId).order("name"),
  ]);
  if (p.error) fail("read", p.error);
  if (projects.error) fail("projects", projects.error);
  const row = p.data as ProfileRow | null;
  if (!row) return null;
  return {
    userId: row.user_id,
    reminderEmails: row.reminder_emails,
    fullName: row.full_name,
    isUnder18: row.is_under_18,
    educationLevel: row.education_level ?? undefined,
    spmGrades: row.spm_grades,
    moduleIds: row.module_ids,
    skills: row.skills,
    interests: row.interests,
    jobInMind: row.job_in_mind ?? undefined,
    target: row.target_occupation ?? undefined,
    projects: (projects.data as { name: string; description: string | null; link: string | null }[])
      .map((x) => ({ name: x.name, description: x.description ?? undefined, link: x.link ?? undefined })),
  };
}

/**
 * Saves the form, replaces the project list and stores a dated snapshot (with the match codes shown)
 * for the Map's session list. Not one transaction: if a later step fails, the next Save repairs it,
 * because every step writes the full state.
 */
export async function saveProfile(userId: string, f: ProfileFields, matchCodes: string[]): Promise<{ sessionId: string; savedAt: string }> {
  const client = await db();
  const upd = await client.from("profiles").update({
    education_level: f.educationLevel,
    spm_grades: f.spmGrades,
    module_ids: f.moduleIds,
    skills: f.skills,
    interests: f.interests,
    job_in_mind: f.jobInMind ?? null,
  }).eq("user_id", userId);
  if (upd.error) fail("update", upd.error);

  const del = await client.from("projects").delete().eq("user_id", userId);
  if (del.error) fail("clear projects", del.error);
  if (f.projects.length) {
    const ins = await client.from("projects").insert(f.projects.map((p) => ({
      user_id: userId, name: p.name, description: p.description ?? null, link: p.link ?? null,
    })));
    if (ins.error) fail("add projects", ins.error);
  }

  const snap = await client.from("profile_sessions")
    .insert({ user_id: userId, snapshot: { ...f, matches: matchCodes } })
    .select("id, created_at").single();
  if (snap.error) fail("snapshot", snap.error);
  const s = snap.data as { id: string; created_at: string };
  return { sessionId: s.id, savedAt: s.created_at };
}

export async function setTarget(userId: string, code: string): Promise<void> {
  const { error } = await (await db()).from("profiles").update({ target_occupation: code }).eq("user_id", userId);
  if (error) fail("set target", error);
}

export type SessionRow = { id: string; createdAt: string; snapshot: ProfileFields & { matches: string[] } };

export async function listSessions(userId: string, limit = 10): Promise<SessionRow[]> {
  const { data, error } = await (await db()).from("profile_sessions").select("id, created_at, snapshot")
    .eq("user_id", userId).order("created_at", { ascending: false }).limit(limit);
  if (error) fail("sessions", error);
  return (data as { id: string; created_at: string; snapshot: SessionRow["snapshot"] }[])
    .map((s) => ({ id: s.id, createdAt: s.created_at, snapshot: s.snapshot }));
}
