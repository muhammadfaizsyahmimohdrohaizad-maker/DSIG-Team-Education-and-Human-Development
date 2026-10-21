import "server-only";
import type { Card } from "ts-fsrs";
import type {
  AdviserStudent,
  Booking,
  InterviewAnswer,
  InterviewQuestion,
  Lesson,
  Module,
  Occupation,
  Persona,
  Skill,
  SkillLink,
} from "@/lib/types";

export type MasteryRecord = { score: number; total: number; passed: boolean };

/** Everything a page or action may read or write. Fixtures and Supabase both implement this. */
export interface Store {
  getStudent(): Promise<Persona>;
  getAdviser(): Promise<{ id: string; name: string; unit: string }>;
  listAdviserStudents(): Promise<AdviserStudent[]>;

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
  saveCard(itemId: string, card: Card): Promise<void>;
  getMastery(): Promise<Record<string, MasteryRecord>>;
  saveMastery(skillId: string, record: MasteryRecord): Promise<void>;
  listWeakAreas(): Promise<string[]>;
  addWeakArea(itemId: string): Promise<void>;

  getInterview(): Promise<{ occupation: string; title: string; questions: InterviewQuestion[] }>;
  saveAnswer(input: { questionId: string; text: string }): Promise<InterviewAnswer>;
  getAnswer(id: string): Promise<InterviewAnswer | null>;
  listAnswers(): Promise<InterviewAnswer[]>;

  listBookings(): Promise<Booking[]>;
  saveBooking(booking: Booking): Promise<void>;
  createBooking(input: { slot: string; note?: string }): Promise<Booking>;
  markBookingsViewed(): Promise<void>;

  reset(): Promise<void>;
}
