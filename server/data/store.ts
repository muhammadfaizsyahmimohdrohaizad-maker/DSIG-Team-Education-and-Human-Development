import "server-only";
import type { Card } from "ts-fsrs";
import type {
  Booking,
  CohortRow,
  Consent,
  Feedback,
  InterviewAnswer,
  InterviewQuestion,
  Lesson,
  Module,
  Occupation,
  Persona,
  RosterRow,
  Skill,
  SkillLink,
  Staff,
} from "@/lib/types";

export type MasteryRecord = { score: number; total: number; passed: boolean; takenAt?: string };

/**
 * Everything a page or action may read or write. Fixtures and Supabase both implement this.
 * "Current user" means the signed-in person; in fixtures mode it is the sample student.
 */
export interface Store {
  /** The signed-in student. Throws if nobody is signed in. */
  getStudent(): Promise<Persona>;
  setTarget(code: string | null): Promise<void>;
  /** The student's adviser, if one is assigned. */
  getMyAdviser(): Promise<{ name: string; unit: string } | null>;
  /** The signed-in staff member, or null for a student. */
  getStaff(): Promise<Staff | null>;
  acceptUndertaking(version: string): Promise<void>;
  /** An adviser's own students who allow it. Read-only. */
  listRoster(): Promise<RosterRow[]>;
  /** Names of students who sent this adviser a booking (even if they keep their progress private). */
  studentNames(ids: string[]): Promise<Record<string, { name: string; semester: number | null }>>;
  /** Anonymous rows for the institution view. */
  listCohort(): Promise<CohortRow[]>;

  getConsent(): Promise<Consent | null>;
  listConsents(): Promise<Consent[]>;
  recordConsent(consent: Omit<Consent, "createdAt">): Promise<void>;

  listModules(): Promise<{ axes: string[]; modules: Module[] }>;
  getTicked(): Promise<string[]>;
  setTicked(ids: string[]): Promise<void>;

  getSkills(): Promise<{ groups: string[]; skills: Skill[] }>;
  getLinks(): Promise<SkillLink[]>;
  listOccupations(): Promise<Occupation[]>;

  getRatings(): Promise<Record<string, number>>;
  setRatings(ratings: Record<string, number>): Promise<void>;
  isPlanBuilt(): Promise<boolean>;
  setPlanBuilt(built: boolean): Promise<void>;

  listLessons(): Promise<Lesson[]>;
  listCards(): Promise<Record<string, Card>>;
  /** When each card was last reviewed, by item id. */
  listReviewTimes(): Promise<Record<string, string>>;
  saveCard(itemId: string, card: Card): Promise<void>;
  getMastery(): Promise<Record<string, MasteryRecord>>;
  saveMastery(skillId: string, record: MasteryRecord): Promise<void>;
  listWeakAreas(): Promise<string[]>;
  addWeakArea(itemId: string): Promise<void>;

  /** The mock-interview questions for the student's target occupation. */
  getInterview(): Promise<{ occupation: string; title: string; questions: InterviewQuestion[] }>;
  saveAnswer(input: { questionId: string; text: string }): Promise<InterviewAnswer>;
  getAnswer(id: string): Promise<InterviewAnswer | null>;
  listAnswers(): Promise<InterviewAnswer[]>;
  saveFeedback(answerId: string, feedback: Feedback | null, needsAdviser: boolean): Promise<void>;

  /** A student's own bookings, or the bookings addressed to an adviser. */
  listBookings(): Promise<Booking[]>;
  saveBooking(booking: Booking): Promise<void>;
  createBooking(input: { slot: string; note?: string }): Promise<Booking | null>;
  markBookingsViewed(): Promise<void>;
  /** A student's email address if they asked for booking emails, else null. Server use only. */
  studentEmail(studentId: string): Promise<string | null>;

  /** Everything stored about the current user, for "Export my data". */
  exportMine(): Promise<Record<string, unknown>>;
  /** Deletes the current user's account and every row they own. */
  deleteMine(): Promise<void>;
}
