import "server-only";
import type { Card } from "ts-fsrs";
import modulesFile from "@/content/demo/modules.json";
import skillsFile from "@/content/demo/skills.json";
import linksFile from "@/content/demo/links.json";
import occupationsFile from "@/content/demo/occupations.json";
import personas from "@/content/demo/personas.json";
import adviserFile from "@/content/demo/adviser.json";
import bookingsFile from "@/content/demo/bookings.json";
import interviewFile from "@/content/interview/2519-01.json";
import integration from "@/content/lessons/execute-integration-testing.json";
import automation from "@/content/lessons/use-test-automation-tools.json";
import reporting from "@/content/lessons/report-test-findings.json";
import { addDays } from "@/lib/date";
import { DEMO_TODAY } from "@/lib/config";
import type { Booking, InterviewAnswer, Lesson, Occupation } from "@/lib/types";
import type { MasteryRecord, Store } from "./store";

type State = {
  ticked: string[];
  ratings: Record<string, number>;
  planBuilt: boolean;
  cards: Record<string, Card>;
  mastery: Record<string, MasteryRecord>;
  weakAreas: string[];
  answers: InterviewAnswer[];
  bookings: Booking[];
};

function initialState(): State {
  const demoAnswer = interviewFile.questions[0].demoAnswer ?? "";
  return {
    ticked: [...personas.tickedModules],
    ratings: {},
    planBuilt: false,
    cards: {},
    mastery: {},
    weakAreas: [],
    // One answer from yesterday, so Today and the adviser row have something to refer to.
    answers: [{ id: "ans-1", questionId: "q1", text: demoAnswer, createdAt: addDays(DEMO_TODAY, -1) }],
    bookings: structuredClone(bookingsFile.bookings) as Booking[],
  };
}

// Kept on globalThis so dev-server reloads don't wipe the demo state.
const holder = globalThis as unknown as { __careerprepState?: State };
function state(): State {
  return (holder.__careerprepState ??= initialState());
}

const LESSONS = [integration, automation, reporting] as Lesson[];

export const fixtures: Store = {
  async getStudent() {
    return personas.student;
  },
  async getAdviser() {
    const { id, name, unit } = adviserFile;
    return { id, name, unit };
  },
  async listAdviserStudents() {
    return adviserFile.students;
  },

  async listModules() {
    return { axes: modulesFile.axes, modules: modulesFile.modules };
  },
  async getTicked() {
    return [...state().ticked];
  },
  async setTicked(ids) {
    state().ticked = [...ids];
  },

  async getSkills() {
    return { groups: skillsFile.groups, skills: skillsFile.skills };
  },
  async getLinks() {
    return linksFile.links;
  },
  async listOccupations() {
    return occupationsFile.occupations as Occupation[];
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
    return LESSONS;
  },
  async listCards() {
    return { ...state().cards };
  },
  async saveCard(itemId, card) {
    state().cards[itemId] = card;
  },
  async getMastery() {
    return { ...state().mastery };
  },
  async saveMastery(skillId, record) {
    state().mastery[skillId] = record;
  },
  async listWeakAreas() {
    return [...state().weakAreas];
  },
  async addWeakArea(itemId) {
    const s = state();
    if (!s.weakAreas.includes(itemId)) s.weakAreas.push(itemId);
  },

  async getInterview() {
    return interviewFile;
  },
  async saveAnswer({ questionId, text }) {
    const s = state();
    const answer = { id: `ans-${s.answers.length + 1}`, questionId, text, createdAt: DEMO_TODAY };
    s.answers.push(answer);
    return answer;
  },
  async getAnswer(id) {
    return state().answers.find((a) => a.id === id) ?? null;
  },
  async listAnswers() {
    return [...state().answers];
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
    const open = s.bookings.find((b) => b.studentId === "aina" && b.status === "requested");
    if (open) {
      const updated: Booking = { ...open, slot, note: note?.trim() || undefined, changedSinceViewed: false };
      s.bookings = s.bookings.map((b) => (b.id === open.id ? updated : b));
      return updated;
    }
    const booking: Booking = {
      id: `bk-aina-${s.bookings.filter((b) => b.studentId === "aina").length + 1}`,
      studentId: "aina",
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
    s.bookings = s.bookings.map((b) => (b.studentId === "aina" ? { ...b, changedSinceViewed: false } : b));
  },

  async reset() {
    holder.__careerprepState = initialState();
  },
};

