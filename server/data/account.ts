import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ConsentKind, EducationLevel, Role } from "../../lib/types.ts";
import { err, fromDb, ok, unexpected, type KnownDbErrors, type Result } from "../../lib/result.ts";
import { authErrorFor } from "../../features/auth/rules.ts";
import { adminDb, db } from "./supabase.ts";

// D1 accounts, D2 consents and parent approvals, plus the Auth calls behind sign-up and log-in.
// db() acts as the signed-in user (RLS applies). adminDb() is used only where no user session can do
// the job: creating the profile at sign-up, the parent's decision (the parent has no account),
// last-log-in time, email addresses for booking emails, account deletion and the cron jobs.
// Every adminDb() call here is scoped to one user id or one token hash.

const NONE: KnownDbErrors = {};

type AuthErr = { code?: string; message?: string; status?: number };

function fromAuth(e: AuthErr, context: string): Result<never> {
  const known = authErrorFor(e.code);
  if (known) return err(known[0], known[1]);
  return unexpected(context, `${e.status ?? "?"} ${e.code ?? "?"}`);
}

// ---------- Auth ----------

export async function authSignUp(email: string, password: string, redirectTo: string): Promise<Result<{ userId: string; hasSession: boolean }>> {
  const { data, error } = await (await db()).auth.signUp({ email, password, options: { emailRedirectTo: redirectTo } });
  if (error) return fromAuth(error, "auth.signUp");
  // With email confirmation on, an existing address returns a user with no identities instead of an error.
  if (!data.user || (data.user.identities && data.user.identities.length === 0)) {
    return err("CONFLICT", "There's already an account with this email. Log in, or reset your password.");
  }
  return ok({ userId: data.user.id, hasSession: !!data.session });
}

/** The role goes in app_metadata, which only the service role can write; RLS reads it from the JWT. */
export async function setAuthRole(userId: string, role: Role): Promise<boolean> {
  const { error } = await adminDb().auth.admin.updateUserById(userId, { app_metadata: { role } });
  if (error) console.error(`[setAuthRole] user=${userId} status=${error.status ?? "?"}`);
  return !error;
}

/** Picks up the new role claim after setAuthRole, when sign-up returned a session. */
export async function refreshSession(): Promise<void> {
  await (await db()).auth.refreshSession();
}

export async function deleteAuthUser(userId: string): Promise<boolean> {
  const { error } = await adminDb().auth.admin.deleteUser(userId);
  if (error) console.error(`[deleteAuthUser] user=${userId} status=${error.status ?? "?"}`);
  return !error;
}

export async function authSignIn(email: string, password: string): Promise<Result<{ userId: string; role?: Role }>> {
  const { data, error } = await (await db()).auth.signInWithPassword({ email, password });
  if (error) return fromAuth(error, "auth.signIn");
  const role = (data.user.app_metadata as { role?: Role } | undefined)?.role;
  return ok({ userId: data.user.id, role });
}

export async function authSignOut(scope: "global" | "local" = "global"): Promise<void> {
  await (await db()).auth.signOut({ scope });
}

export async function authSendPasswordReset(email: string, redirectTo: string): Promise<Result<null>> {
  const { error } = await (await db()).auth.resetPasswordForEmail(email, { redirectTo });
  // Rate limits are worth reporting; anything else is not, so the reply never reveals whether the email has an account.
  if (error && (error.code === "over_email_send_rate_limit" || error.code === "over_request_rate_limit")) return fromAuth(error, "auth.reset");
  if (error) console.error(`[auth.reset] status=${error.status ?? "?"} code=${error.code ?? "?"}`);
  return ok(null);
}

export async function authUpdatePassword(password: string): Promise<Result<null>> {
  const { error } = await (await db()).auth.updateUser({ password });
  if (error) return fromAuth(error, "auth.updatePassword");
  return ok(null);
}

/** Email address for status emails to the other party of a booking, and for reminders. */
export async function authEmail(userId: string): Promise<string | null> {
  const { data, error } = await adminDb().auth.admin.getUserById(userId);
  if (error) console.error(`[authEmail] user=${userId} status=${error.status ?? "?"}`);
  return data?.user?.email ?? null;
}

// ---------- Profiles (D1) ----------

export type OwnProfile = { userId: string; role: Role; fullName: string; isUnder18: boolean; locked: boolean; educationLevel: EducationLevel | null };

type ProfileRow = { user_id: string; role: Role; full_name: string; is_under_18: boolean; account_locked: boolean; education_level: EducationLevel | null };

export async function ownProfile(userId: string): Promise<OwnProfile | null> {
  const { data, error } = await (await db())
    .from("profiles")
    .select("user_id, role, full_name, is_under_18, account_locked, education_level")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) console.error(`[ownProfile] user=${userId} code=${error.code}`);
  const r = data as ProfileRow | null;
  return r ? { userId: r.user_id, role: r.role, fullName: r.full_name, isUnder18: r.is_under_18, locked: r.account_locked, educationLevel: r.education_level } : null;
}

export type NewAccount = {
  userId: string;
  role: Role;
  fullName: string;
  isUnder18: boolean;
  consents: { kind: ConsentKind; given: boolean }[];
  noticeVersion: string;
};

/** Profile and first consent rows. Under-18 accounts start locked (FR-CON-02). */
export async function insertAccountRows(a: NewAccount): Promise<boolean> {
  const admin = adminDb();
  const p = await admin.from("profiles").insert({
    user_id: a.userId, role: a.role, full_name: a.fullName, is_under_18: a.isUnder18, account_locked: a.isUnder18,
  });
  if (p.error) {
    console.error(`[insertAccountRows] profile user=${a.userId} code=${p.error.code}`);
    return false;
  }
  const c = await admin.from("consents").insert(a.consents.map((x) => ({
    user_id: a.userId, kind: x.kind, given: x.given, notice_version: a.noticeVersion, given_by: "self",
  })));
  if (c.error) console.error(`[insertAccountRows] consents user=${a.userId} code=${c.error.code}`);
  return !c.error;
}

export async function touchLastLogin(userId: string): Promise<void> {
  const { error } = await adminDb().from("profiles").update({ last_login_at: new Date().toISOString() }).eq("user_id", userId);
  if (error) console.error(`[touchLastLogin] user=${userId} code=${error.code}`);
}

export async function setLocked(userId: string, locked: boolean): Promise<boolean> {
  const { error } = await adminDb().from("profiles").update({ account_locked: locked }).eq("user_id", userId);
  if (error) console.error(`[setLocked] user=${userId} code=${error.code}`);
  return !error;
}

export async function hasCurrentUndertaking(userId: string): Promise<boolean> {
  const { data, error } = await (await db()).rpc("has_current_undertaking", { uid: userId });
  if (error) console.error(`[hasCurrentUndertaking] user=${userId} code=${error.code}`);
  return data === true;
}

// ---------- Consents (D2) ----------

export type ConsentEntry = { kind: ConsentKind; given: boolean; givenBy: "self" | "parent"; noticeVersion: string; at: string };

/** Appends a consent row as the signed-in user (RLS: own rows, given_by 'self'). */
export async function appendOwnConsent(userId: string, kind: ConsentKind, given: boolean, noticeVersion: string): Promise<Result<ConsentEntry>> {
  const { data, error } = await (await db())
    .from("consents")
    .insert({ user_id: userId, kind, given, notice_version: noticeVersion, given_by: "self" })
    .select("kind, given, given_by, notice_version, consented_at")
    .single();
  if (error) return fromDb(error, NONE, "appendOwnConsent");
  const r = data as { kind: ConsentKind; given: boolean; given_by: "self" | "parent"; notice_version: string; consented_at: string };
  return ok({ kind: r.kind, given: r.given, givenBy: r.given_by, noticeVersion: r.notice_version, at: r.consented_at });
}

export async function consentHistory(userId: string): Promise<Result<ConsentEntry[]>> {
  const { data, error } = await (await db())
    .from("consents")
    .select("kind, given, given_by, notice_version, consented_at")
    .eq("user_id", userId)
    .order("consented_at", { ascending: false })
    .limit(200);
  if (error) return fromDb(error, NONE, "consentHistory");
  return ok((data as { kind: ConsentKind; given: boolean; given_by: "self" | "parent"; notice_version: string; consented_at: string }[])
    .map((r) => ({ kind: r.kind, given: r.given, givenBy: r.given_by, noticeVersion: r.notice_version, at: r.consented_at })));
}

// ---------- Parent approvals (D2) ----------

/** One open request per student: a new token replaces the old one, so older links stop working. */
export async function saveParentApproval(userId: string, parentEmail: string, tokenHash: string, expiresAt: string): Promise<boolean> {
  const { error } = await adminDb().from("parent_approvals").upsert(
    { user_id: userId, parent_email: parentEmail, token_hash: tokenHash, expires_at: expiresAt, decision: null, decided_at: null },
    { onConflict: "user_id" },
  );
  if (error) console.error(`[saveParentApproval] user=${userId} code=${error.code}`);
  return !error;
}

export async function parentEmailFor(userId: string): Promise<string | null> {
  const { data } = await adminDb().from("parent_approvals").select("parent_email").eq("user_id", userId).maybeSingle();
  return (data as { parent_email: string } | null)?.parent_email ?? null;
}

export type ParentRequest = {
  userId: string;
  expiresAt: string;
  decision: boolean | null;
  studentName: string;
  aiProcessing: boolean;
  adviserVisibility: boolean;
};

export async function findParentRequest(tokenHash: string): Promise<ParentRequest | null> {
  const admin = adminDb();
  const { data } = await admin
    .from("parent_approvals")
    .select("user_id, expires_at, decision, profiles(full_name)")
    .eq("token_hash", tokenHash)
    .maybeSingle();
  const row = data as { user_id: string; expires_at: string; decision: boolean | null; profiles: { full_name: string } | null } | null;
  if (!row) return null;
  const { data: consents } = await admin
    .from("consents")
    .select("kind, given")
    .eq("user_id", row.user_id)
    .in("kind", ["ai_processing", "adviser_visibility"])
    .order("consented_at", { ascending: false });
  const latest = (kind: ConsentKind) => (consents as { kind: ConsentKind; given: boolean }[] | null)?.find((c) => c.kind === kind)?.given ?? false;
  return {
    userId: row.user_id,
    expiresAt: row.expires_at,
    decision: row.decision,
    studentName: row.profiles?.full_name ?? "The student",
    aiProcessing: latest("ai_processing"),
    adviserVisibility: latest("adviser_visibility"),
  };
}

/** Single use: only an undecided, unexpired row changes. Returns the student's id, or null if nothing changed. */
export async function claimParentDecision(tokenHash: string, approve: boolean): Promise<string | null> {
  const { data, error } = await adminDb()
    .from("parent_approvals")
    .update({ decision: approve, decided_at: new Date().toISOString() })
    .eq("token_hash", tokenHash)
    .is("decision", null)
    .gt("expires_at", new Date().toISOString())
    .select("user_id");
  if (error) console.error(`[claimParentDecision] code=${error.code}`);
  return (data as { user_id: string }[] | null)?.[0]?.user_id ?? null;
}

export async function undoParentDecision(tokenHash: string): Promise<void> {
  await adminDb().from("parent_approvals").update({ decision: null, decided_at: null }).eq("token_hash", tokenHash);
}

export async function insertParentConsent(userId: string, given: boolean, noticeVersion: string): Promise<boolean> {
  const { error } = await adminDb().from("consents").insert({ user_id: userId, kind: "parent", given, notice_version: noticeVersion, given_by: "parent" });
  if (error) console.error(`[insertParentConsent] user=${userId} code=${error.code}`);
  return !error;
}

// ---------- Export (FR-ACC-01) ----------

/**
 * Everything CareerPrep holds about one user, read as that user so RLS applies. Each query also
 * filters on the user's own id, because an adviser's RLS view of bookings includes other students.
 */
export async function exportRows(userId: string): Promise<Result<Record<string, unknown>>> {
  const c = await db();
  // The export walks many tables by name, so it uses the untyped view of the same RLS-bound client.
  const u = c as unknown as SupabaseClient;
  const own = (table: string, column = "user_id") => u.from(table).select("*").eq(column, userId);
  const [profile, sessions, projects, consents, undertakings, saved, skills, lessons, checks, cards, answers, bookings, slots, blocked] =
    await Promise.all([
      own("profiles"), own("profile_sessions"), own("projects"), own("consents"), own("staff_undertakings", "adviser_id"),
      own("saved_study_options"), own("skill_progress"), own("lesson_progress"), own("mastery_checks"), own("review_cards"),
      own("interview_answers"), own("bookings", "student_id"), own("availability_slots", "adviser_id"), own("blocked_days", "adviser_id"),
    ]);
  const firstError = [profile, sessions, projects, consents, undertakings, saved, skills, lessons, checks, cards, answers, bookings, slots, blocked]
    .find((r) => r.error)?.error;
  if (firstError) return fromDb(firstError, NONE, "exportRows");

  const bookingIds = ((bookings.data ?? []) as { id: string }[]).map((b) => b.id);
  let history: unknown[] = [];
  let feedback: unknown[] = [];
  if (bookingIds.length) {
    const [h, f] = await Promise.all([
      c.from("booking_status_history").select("booking_id, status, changed_at").in("booking_id", bookingIds),
      c.from("adviser_feedback").select("*").in("booking_id", bookingIds),
    ]);
    const e = h.error ?? f.error;
    if (e) return fromDb(e, NONE, "exportRows");
    history = h.data ?? [];
    feedback = f.data ?? [];
  }

  return ok({
    profile: (profile.data ?? [])[0] ?? null,
    profileSessions: sessions.data ?? [],
    projects: projects.data ?? [],
    consents: consents.data ?? [],
    staffUndertakings: undertakings.data ?? [],
    savedStudyOptions: saved.data ?? [],
    skillProgress: skills.data ?? [],
    lessonProgress: lessons.data ?? [],
    masteryChecks: checks.data ?? [],
    reviewCards: cards.data ?? [],
    interviewAnswers: answers.data ?? [],
    bookings: bookings.data ?? [],
    bookingStatusHistory: history,
    adviserFeedback: feedback,
    availabilitySlots: slots.data ?? [],
    blockedDays: blocked.data ?? [],
  });
}

// ---------- Retention (NFR-08), cron only ----------

export async function idleUserIds(before: Date, limit: number): Promise<Result<string[]>> {
  const { data, error } = await adminDb()
    .from("profiles")
    .select("user_id")
    .lt("last_login_at", before.toISOString())
    .order("last_login_at", { ascending: true })
    .limit(limit);
  if (error) return fromDb(error, NONE, "idleUserIds");
  return ok((data as { user_id: string }[]).map((r) => r.user_id));
}

export async function deleteAuditRowsBefore(before: Date): Promise<Result<number>> {
  const { count, error } = await adminDb().from("audit_log").delete({ count: "exact" }).lt("accessed_at", before.toISOString());
  if (error) return fromDb(error, NONE, "deleteAuditRowsBefore");
  return ok(count ?? 0);
}
