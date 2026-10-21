import "server-only";
import type { Card } from "ts-fsrs";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Booking, Consent, Feedback, InterviewAnswer, Role } from "@/lib/types";
import { session, supabaseAdmin } from "../supabase/client";
import { reference } from "./reference";
import type { MasteryRecord, Store } from "./store";

/**
 * The real store. Every query runs as the signed-in user, so Postgres row-level security
 * (supabase/migrations/0001_init.sql) decides what each person can read and change.
 */

async function me(): Promise<{ sb: SupabaseClient; uid: string }> {
  const { sb, user } = await session();
  if (!user) throw new Error("Not signed in");
  return { sb, uid: user.id };
}

/** Throws a readable error instead of carrying on with half a result. */
function check<T>(res: { data: T; error: { message: string } | null }, what: string): T {
  if (res.error) throw new Error(`Could not ${what}: ${res.error.message}`);
  return res.data;
}

type BookingRow = {
  id: string;
  student_id: string;
  slot: string;
  status: Booking["status"];
  note: string | null;
  cancel_reason: string | null;
  cancelled_by: "student" | "adviser" | null;
  changed_since_viewed: boolean;
};

const toBooking = (r: BookingRow): Booking => ({
  id: r.id,
  studentId: r.student_id,
  slot: r.slot,
  status: r.status,
  note: r.note ?? undefined,
  cancelReason: r.cancel_reason ?? undefined,
  cancelledBy: r.cancelled_by ?? undefined,
  changedSinceViewed: r.changed_since_viewed,
});

type ConsentRow = {
  processing: boolean;
  ai_processing: boolean;
  booking_emails: boolean;
  adviser_visibility: boolean;
  under_18: boolean;
  parental_consent: boolean;
  notice_version: string;
  created_at: string;
};

const toConsent = (r: ConsentRow): Consent => ({
  processing: r.processing,
  aiProcessing: r.ai_processing,
  bookingEmails: r.booking_emails,
  adviserVisibility: r.adviser_visibility,
  under18: r.under_18,
  parentalConsent: r.parental_consent,
  noticeVersion: r.notice_version,
  createdAt: r.created_at,
});

type AnswerRow = { id: string; question_id: string; text: string; created_at: string; feedback: Feedback | null; needs_adviser: boolean };
const toAnswer = (r: AnswerRow): InterviewAnswer => ({
  id: r.id,
  questionId: r.question_id,
  text: r.text,
  createdAt: r.created_at,
  feedback: r.feedback,
  needsAdviser: r.needs_adviser,
});

/** JSON turns the card's dates into strings; the scheduler needs Date objects back. */
function reviveCard(raw: Record<string, unknown>): Card {
  return {
    ...(raw as unknown as Card),
    due: new Date(raw.due as string),
    last_review: raw.last_review ? new Date(raw.last_review as string) : undefined,
  } as Card;
}

const ANSWER_COLUMNS = "id, question_id, text, created_at, feedback, needs_adviser";
const BOOKING_COLUMNS = "id, student_id, slot, status, note, cancel_reason, cancelled_by, changed_since_viewed";
const CONSENT_COLUMNS = "processing, ai_processing, booking_emails, adviser_visibility, under_18, parental_consent, notice_version, created_at";

export const supabaseStore: Store = {
  async getStudent() {
    const { sb, uid } = await me();
    const p = check(await sb.from("profiles").select("id, full_name, semester, target_code, email").eq("id", uid).single(), "read your profile") as {
      id: string;
      full_name: string;
      semester: number | null;
      target_code: string | null;
      email: string | null;
    };
    return { id: p.id, name: p.full_name, semester: p.semester, targetCode: p.target_code, email: p.email ?? undefined };
  },
  async setTarget(code) {
    const { sb, uid } = await me();
    check(await sb.from("profiles").update({ target_code: code, plan_built: false }).eq("id", uid), "save your target role");
    // A new target means new gap skills, so the old ratings no longer apply.
    check(await sb.from("gap_ratings").delete().eq("student_id", uid), "clear old ratings");
  },
  async getMyAdviser() {
    const { sb, uid } = await me();
    const p = check(await sb.from("profiles").select("adviser_id").eq("id", uid).single(), "read your profile") as { adviser_id: string | null };
    if (!p.adviser_id) return null;
    const a = check(await sb.from("profiles").select("full_name, unit").eq("id", p.adviser_id).maybeSingle(), "read your adviser") as {
      full_name: string;
      unit: string | null;
    } | null;
    return a ? { name: a.full_name, unit: a.unit ?? "Career Services" } : null;
  },
  async getStaff() {
    const { sb, uid } = await me();
    const p = check(await sb.from("profiles").select("id, full_name, unit, role, nda_accepted_at").eq("id", uid).single(), "read your profile") as {
      id: string;
      full_name: string;
      unit: string | null;
      role: Role;
      nda_accepted_at: string | null;
    };
    if (p.role === "student") return null;
    return { id: p.id, name: p.full_name, unit: p.unit ?? "", role: p.role, undertakingAccepted: !!p.nda_accepted_at };
  },
  async acceptUndertaking(version) {
    const { sb } = await me();
    check(await sb.rpc("accept_staff_undertaking", { version }), "record your acceptance");
  },
  async listRoster() {
    const { sb } = await me();
    const rows = check(await sb.rpc("adviser_roster"), "load your students") as {
      student_id: string;
      full_name: string;
      semester: number | null;
      target_code: string | null;
      modules: string[];
      ratings: Record<string, number>;
      feedback_summary: string | null;
      needs_adviser: boolean;
    }[];
    return rows.map((r) => ({
      id: r.student_id,
      name: r.full_name,
      semester: r.semester,
      targetCode: r.target_code,
      modules: r.modules ?? [],
      ratings: r.ratings ?? {},
      feedbackSummary: r.feedback_summary,
      needsAdviser: r.needs_adviser,
    }));
  },
  async studentNames(ids) {
    if (!ids.length) return {};
    const { sb } = await me();
    const rows = check(await sb.from("profiles").select("id, full_name, semester").in("id", ids), "read student names") as {
      id: string;
      full_name: string;
      semester: number | null;
    }[];
    return Object.fromEntries(rows.map((r) => [r.id, { name: r.full_name, semester: r.semester }]));
  },
  async listCohort() {
    const { sb } = await me();
    const rows = check(await sb.rpc("cohort_rows"), "load the cohort") as { target_code: string | null; modules: string[]; ratings: Record<string, number> }[];
    return rows.map((r) => ({ targetCode: r.target_code, modules: r.modules ?? [], ratings: r.ratings ?? {} }));
  },

  async getConsent() {
    const { sb, uid } = await me();
    const rows = check(
      await sb.from("consents").select(CONSENT_COLUMNS).eq("user_id", uid).order("created_at", { ascending: false }).limit(1),
      "read your consent",
    ) as ConsentRow[];
    return rows.length ? toConsent(rows[0]) : null;
  },
  async listConsents() {
    const { sb, uid } = await me();
    const rows = check(await sb.from("consents").select(CONSENT_COLUMNS).eq("user_id", uid).order("created_at", { ascending: false }), "read your consent history") as ConsentRow[];
    return rows.map(toConsent);
  },
  async recordConsent(c) {
    const { sb, uid } = await me();
    check(
      await sb.from("consents").insert({
        user_id: uid,
        processing: c.processing,
        ai_processing: c.aiProcessing,
        booking_emails: c.bookingEmails,
        adviser_visibility: c.adviserVisibility,
        under_18: c.under18,
        parental_consent: c.parentalConsent,
        notice_version: c.noticeVersion,
      }),
      "save your consent",
    );
  },

  async listModules() {
    return reference.modules;
  },
  async getTicked() {
    const { sb, uid } = await me();
    const rows = check(await sb.from("student_modules").select("module_id").eq("student_id", uid), "read your modules") as { module_id: string }[];
    return rows.map((r) => r.module_id);
  },
  async setTicked(ids) {
    const { sb, uid } = await me();
    check(await sb.from("student_modules").delete().eq("student_id", uid), "update your modules");
    if (ids.length) check(await sb.from("student_modules").insert(ids.map((module_id) => ({ student_id: uid, module_id }))), "save your modules");
  },

  async getSkills() {
    return reference.skills;
  },
  async getLinks() {
    return reference.links;
  },
  async listOccupations() {
    return reference.occupations;
  },

  async getRatings() {
    const { sb, uid } = await me();
    const rows = check(await sb.from("gap_ratings").select("skill_id, rating").eq("student_id", uid), "read your ratings") as { skill_id: string; rating: number }[];
    return Object.fromEntries(rows.map((r) => [r.skill_id, r.rating]));
  },
  async setRatings(ratings) {
    const { sb, uid } = await me();
    check(await sb.from("gap_ratings").delete().eq("student_id", uid), "update your ratings");
    const rows = Object.entries(ratings).map(([skill_id, rating]) => ({ student_id: uid, skill_id, rating }));
    if (rows.length) check(await sb.from("gap_ratings").insert(rows), "save your ratings");
  },
  async isPlanBuilt() {
    const { sb, uid } = await me();
    const p = check(await sb.from("profiles").select("plan_built").eq("id", uid).single(), "read your plan") as { plan_built: boolean };
    return p.plan_built;
  },
  async setPlanBuilt(built) {
    const { sb, uid } = await me();
    check(await sb.from("profiles").update({ plan_built: built }).eq("id", uid), "save your plan");
  },

  async listLessons() {
    return reference.lessons;
  },
  async listCards() {
    const { sb, uid } = await me();
    const rows = check(await sb.from("review_states").select("item_id, card").eq("student_id", uid), "read your reviews") as {
      item_id: string;
      card: Record<string, unknown>;
    }[];
    return Object.fromEntries(rows.map((r) => [r.item_id, reviveCard(r.card)]));
  },
  async listReviewTimes() {
    const { sb, uid } = await me();
    const rows = check(await sb.from("review_states").select("item_id, updated_at").eq("student_id", uid), "read your reviews") as {
      item_id: string;
      updated_at: string;
    }[];
    return Object.fromEntries(rows.map((r) => [r.item_id, r.updated_at]));
  },
  async saveCard(itemId, card) {
    const { sb, uid } = await me();
    check(
      await sb
        .from("review_states")
        .upsert({ student_id: uid, item_id: itemId, card, due: card.due.toISOString(), updated_at: new Date().toISOString() }),
      "save your review",
    );
  },
  async getMastery() {
    const { sb, uid } = await me();
    const rows = check(await sb.from("mastery").select("skill_id, score, total, passed, taken_at").eq("student_id", uid), "read your checks") as {
      skill_id: string;
      score: number;
      total: number;
      passed: boolean;
      taken_at: string;
    }[];
    return Object.fromEntries(rows.map((r) => [r.skill_id, { score: r.score, total: r.total, passed: r.passed, takenAt: r.taken_at } satisfies MasteryRecord]));
  },
  async saveMastery(skillId, record) {
    const { sb, uid } = await me();
    check(
      await sb.from("mastery").upsert({
        student_id: uid,
        skill_id: skillId,
        score: record.score,
        total: record.total,
        passed: record.passed,
        taken_at: new Date().toISOString(),
      }),
      "save your check",
    );
  },
  async listWeakAreas() {
    const { sb, uid } = await me();
    const rows = check(await sb.from("weak_areas").select("item_id").eq("student_id", uid), "read your weak areas") as { item_id: string }[];
    return rows.map((r) => r.item_id);
  },
  async addWeakArea(itemId) {
    const { sb, uid } = await me();
    check(await sb.from("weak_areas").upsert({ student_id: uid, item_id: itemId }), "save the weak area");
  },

  async getInterview() {
    return reference.interviewFor((await this.getStudent()).targetCode);
  },
  async saveAnswer({ questionId, text }) {
    const { sb, uid } = await me();
    const row = check(
      await sb.from("interview_answers").insert({ student_id: uid, question_id: questionId, text }).select(ANSWER_COLUMNS).single(),
      "save your answer",
    ) as AnswerRow;
    return toAnswer(row);
  },
  async getAnswer(id) {
    if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
    const { sb } = await me();
    const row = check(await sb.from("interview_answers").select(ANSWER_COLUMNS).eq("id", id).maybeSingle(), "read your answer") as AnswerRow | null;
    return row ? toAnswer(row) : null;
  },
  async listAnswers() {
    const { sb, uid } = await me();
    const rows = check(
      await sb.from("interview_answers").select(ANSWER_COLUMNS).eq("student_id", uid).order("created_at", { ascending: true }),
      "read your answers",
    ) as AnswerRow[];
    return rows.map(toAnswer);
  },
  async saveFeedback(answerId, feedback, needsAdviser) {
    const { sb } = await me();
    check(await sb.from("interview_answers").update({ feedback, needs_adviser: needsAdviser }).eq("id", answerId), "save the feedback");
  },

  async listBookings() {
    const { sb } = await me();
    const rows = check(await sb.from("bookings").select(BOOKING_COLUMNS).order("slot", { ascending: true }), "read bookings") as BookingRow[];
    return rows.map(toBooking);
  },
  async saveBooking(b) {
    const { sb } = await me();
    check(
      await sb.from("bookings").update({ status: b.status, cancel_reason: b.cancelReason ?? null }).eq("id", b.id),
      "update the booking",
    );
  },
  async createBooking({ slot, note }) {
    const { sb, uid } = await me();
    const adviser = check(await sb.rpc("ensure_adviser"), "find your adviser") as string | null;
    if (!adviser) return null;
    const cleanNote = note?.trim() || null;
    // One open request per student: a new request replaces the one still waiting for a reply.
    const open = check(
      await sb.from("bookings").select("id").eq("student_id", uid).eq("status", "requested").limit(1),
      "read your bookings",
    ) as { id: string }[];
    const row = open.length
      ? (check(await sb.from("bookings").update({ slot, note: cleanNote }).eq("id", open[0].id).select(BOOKING_COLUMNS).single(), "update your request") as BookingRow)
      : (check(
          await sb.from("bookings").insert({ student_id: uid, adviser_id: adviser, slot, note: cleanNote }).select(BOOKING_COLUMNS).single(),
          "send your request",
        ) as BookingRow);
    return toBooking(row);
  },
  async markBookingsViewed() {
    const { sb, uid } = await me();
    check(await sb.from("bookings").update({ changed_since_viewed: false }).eq("student_id", uid).eq("changed_since_viewed", true), "update your bookings");
  },
  async studentEmail(studentId) {
    // Only for students who asked for booking emails in their latest consent.
    const admin = supabaseAdmin();
    const consent = await admin
      .from("consents")
      .select("booking_emails")
      .eq("user_id", studentId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!(consent.data as { booking_emails: boolean } | null)?.booking_emails) return null;
    const res = await admin.from("profiles").select("email").eq("id", studentId).maybeSingle();
    return (res.data as { email: string | null } | null)?.email ?? null;
  },

  async exportMine() {
    const { sb, uid } = await me();
    const own = async (table: string, column = "student_id") => check(await sb.from(table).select("*").eq(column, uid), `export ${table}`);
    const [profile, consents, modules, ratings, reviews, mastery, weakAreas, answers, bookings, audit] = await Promise.all([
      own("profiles", "id"),
      own("consents", "user_id"),
      own("student_modules"),
      own("gap_ratings"),
      own("review_states"),
      own("mastery"),
      own("weak_areas"),
      own("interview_answers"),
      own("bookings"),
      own("audit_log", "actor_id"),
    ]);
    return { exportedAt: new Date().toISOString(), profile, consents, modules, ratings, reviews, mastery, weakAreas, answers, bookings, audit };
  },
  async deleteMine() {
    const { sb } = await me();
    check(await sb.rpc("delete_my_account"), "delete your account");
    await sb.auth.signOut();
  },
};
