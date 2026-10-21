import "server-only";
import type { Card } from "ts-fsrs";
import personas from "@/content/sample/personas.json";
import adviserFile from "@/content/sample/adviser.json";
import bookingsFile from "@/content/sample/bookings.json";
import { addDays, todayMY } from "@/lib/date";
import type { Booking, Consent, Feedback, InterviewAnswer } from "@/lib/types";
import { reference } from "./reference";
import type { MasteryRecord, Store } from "./store";

/**
 * In-memory store with one sample student, for the unit and browser tests and for working
 * without a database (DATA_MODE=fixtures). Real use runs on Supabase (server/data/supabase.ts).
 */
type State = {
  targetCode: string | null;
  ticked: string[];
  ratings: Record<string, number>;
  planBuilt: boolean;
  cards: Record<string, Card>;
  reviewed: Record<string, string>;
  mastery: Record<string, MasteryRecord>;
  weakAreas: string[];
  answers: InterviewAnswer[];
  bookings: Booking[];
  consents: Consent[];
};

const STUDENT_ID = personas.student.id;

function initialState(): State {
  const firstAnswer = reference.interviewFor("2519-01").questions[0].demoAnswer ?? "";
  return {
    targetCode: personas.student.targetCode,
    ticked: [...personas.tickedModules],
    ratings: {},
    planBuilt: false,
    cards: {},
    reviewed: {},
    mastery: {},
    weakAreas: [],
    answers: [{ id: "ans-1", questionId: "q1", text: firstAnswer, createdAt: addDays(todayMY(), -1) }],
    bookings: structuredClone(bookingsFile.bookings) as Booking[],
    consents: [],
  };
}

// Kept on globalThis so dev-server reloads don't wipe the state.
const holder = globalThis as unknown as { __careerprepState?: State };
function state(): State {
  // A dev server that ran an older version keeps its old state object; fill in any missing fields.
  holder.__careerprepState = { ...initialState(), ...holder.__careerprepState };
  return holder.__careerprepState;
}

/** Clears the in-memory state. Tests call this between runs. */
export function resetFixtures() {
  holder.__careerprepState = initialState();
}

export const fixtures: Store = {
  async getStudent() {
    return { ...personas.student, targetCode: state().targetCode };
  },
  async setTarget(code) {
    state().targetCode = code;
  },
  async getMyAdviser() {
    return { name: adviserFile.name, unit: adviserFile.unit };
  },
  async getStaff() {
    return null;
  },
  async acceptUndertaking() {},
  async listRoster() {
    return adviserFile.students.map((s) => ({
      id: s.id,
      name: s.name,
      semester: s.semester,
      targetCode: /^\d{4}(-\d{2})?\b/.exec(s.target)?.[0] ?? null,
      modules: s.id === STUDENT_ID ? state().ticked : [],
      ratings: s.id === STUDENT_ID ? state().ratings : {},
      feedbackSummary: s.feedback,
      needsAdviser: false,
    }));
  },
  async studentNames(ids) {
    return Object.fromEntries(adviserFile.students.filter((s) => ids.includes(s.id)).map((s) => [s.id, { name: s.name, semester: s.semester }]));
  },
  async listCohort() {
    return [];
  },

  async getConsent() {
    const all = state().consents;
    return all.length ? all[all.length - 1] : null;
  },
  async listConsents() {
    return [...state().consents].reverse();
  },
  async recordConsent(c) {
    state().consents.push({ ...c, createdAt: new Date().toISOString() });
  },

  async listModules() {
    return reference.modules;
  },
  async getTicked() {
    return [...state().ticked];
  },
  async setTicked(ids) {
    state().ticked = [...ids];
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
    return { ...state().ratings };
  },
  async setRatings(ratings) {
    state().ratings = { ...ratings };
  },
  async isPlanBuilt() {
    return state().planBuilt;
  },
  async setPlanBuilt(built) {
    state().planBuilt = built;
  },

  async listLessons() {
    return reference.lessons;
  },
  async listCards() {
    return { ...state().cards };
  },
  async listReviewTimes() {
    return { ...state().reviewed };
  },
  async saveCard(itemId, card) {
    state().cards[itemId] = card;
    state().reviewed[itemId] = new Date().toISOString();
  },
  async getMastery() {
    return { ...state().mastery };
  },
  async saveMastery(skillId, record) {
    state().mastery[skillId] = { ...record, takenAt: new Date().toISOString() };
  },
  async listWeakAreas() {
    return [...state().weakAreas];
  },
  async addWeakArea(itemId) {
    const s = state();
    if (!s.weakAreas.includes(itemId)) s.weakAreas.push(itemId);
  },

  async getInterview() {
    return reference.interviewFor(state().targetCode);
  },
  async saveAnswer({ questionId, text }) {
    const s = state();
    const answer = { id: `ans-${s.answers.length + 1}`, questionId, text, createdAt: new Date().toISOString() };
    s.answers.push(answer);
    return answer;
  },
  async getAnswer(id) {
    return state().answers.find((a) => a.id === id) ?? null;
  },
  async listAnswers() {
    return [...state().answers];
  },
  async saveFeedback(answerId: string, feedback: Feedback | null, needsAdviser: boolean) {
    const s = state();
    s.answers = s.answers.map((a) => (a.id === answerId ? { ...a, feedback, needsAdviser } : a));
  },

  async listBookings() {
    return structuredClone(state().bookings);
  },
  async saveBooking(booking) {
    const s = state();
    s.bookings = s.bookings.map((b) => (b.id === booking.id ? booking : b));
  },
  async createBooking({ slot, note }) {
    const s = state();
    // One open request per student: a new request replaces the one still waiting for a reply.
    const open = s.bookings.find((b) => b.studentId === STUDENT_ID && b.status === "requested");
    if (open) {
      const updated: Booking = { ...open, slot, note: note?.trim() || undefined, changedSinceViewed: false };
      s.bookings = s.bookings.map((b) => (b.id === open.id ? updated : b));
      return updated;
    }
    const booking: Booking = {
      id: `bk-${STUDENT_ID}-${s.bookings.filter((b) => b.studentId === STUDENT_ID).length + 1}`,
      studentId: STUDENT_ID,
      slot,
      status: "requested",
      note: note?.trim() || undefined,
      changedSinceViewed: false,
    };
    s.bookings.push(booking);
    return booking;
  },
  async markBookingsViewed() {
    const s = state();
    s.bookings = s.bookings.map((b) => (b.studentId === STUDENT_ID ? { ...b, changedSinceViewed: false } : b));
  },
  async studentEmail() {
    return null;
  },

  async exportMine() {
    const { cards, ...rest } = state();
    return { profile: await this.getStudent(), ...rest, reviewCards: cards };
  },
  async deleteMine() {
    resetFixtures();
  },
};
