"use server";

// Review cards (FR-LRN-04, A4) and Notes to review cards. Scheduling is ts-fsrs via server/engines/schedule.ts.
// Notes become cards from their headings and bold words without AI by default; AI-written cards are an option
// only for 18+ students with AI consent, and are labelled AI-generated for the student to check before saving.
import { err, ok, type Result } from "@/lib/result";
import { addCardsInput, importNotesInput, rateCardInput } from "@/lib/schemas";
import { latestConsent } from "@/server/data/consents";
import { getInterviewee } from "@/server/data/interview";
import { addNoteCards, dueCards, getCard, nextDueAfter, saveSchedule, skillLabels } from "@/server/data/review";
import { endOfTodayMyt, newCard, next, type ReviewRating } from "@/server/engines/schedule";
import { ai, aiAllowed } from "@/server/llm/adapter";
import { asStudent, invalid } from "@/features/interview/run";
import { cardsFromNotes, notesKind, type DraftCard } from "./notes";

const RATINGS: ReviewRating[] = ["again", "hard", "good", "easy"];

export type DueCard = {
  id: string;
  front: string;
  back: string;
  /** "Databases and SQL" for lesson cards, null for cards from the student's own notes. */
  skill: string | null;
  /** When the card comes back for each rating, as ISO dates, for the "Again in ..." labels. */
  nextDue: Record<ReviewRating, string>;
};

export type DueToday = { cards: DueCard[]; nextDue: string | null };

/** Cards due by the end of today, Malaysia time, oldest first. */
export async function getDueCards(): Promise<Result<DueToday>> {
  return asStudent("getDueCards", async (userId) => {
    const now = new Date();
    const end = endOfTodayMyt(now);
    const cards = await dueCards(userId, end);
    const labels = await skillLabels([...new Set(cards.map((c) => c.skillUri).filter((u): u is string => !!u))]);
    const nextDue = cards.length ? null : await nextDueAfter(userId, end);
    return ok({
      cards: cards.map((c) => ({
        id: c.id,
        front: c.front,
        back: c.back,
        skill: c.skillUri ? labels.get(c.skillUri) ?? null : null,
        nextDue: Object.fromEntries(RATINGS.map((r) => [r, next(c.fsrs, r, now).due.toISOString()])) as Record<ReviewRating, string>,
      })),
      nextDue: nextDue?.toISOString() ?? null,
    });
  });
}

/** Records how well the student remembered a card and schedules it again. */
export async function rateCard(input: unknown): Promise<Result<{ cardId: string; due: string }>> {
  const parsed = rateCardInput.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  return asStudent("rateCard", async (userId) => {
    const card = await getCard(userId, parsed.data.cardId);
    if (!card) return err("NOT_FOUND", "That card no longer exists.");
    const scheduled = next(card.fsrs, parsed.data.rating, new Date());
    await saveSchedule(userId, card.id, scheduled);
    return ok({ cardId: card.id, due: scheduled.due.toISOString() });
  });
}

export type NotesPreview = { cards: DraftCard[]; aiGenerated: boolean };

/**
 * Turns notes into draft cards for the student to check. Nothing is saved and the file text is not kept;
 * the kept cards are saved by addNoteCardsToReview. The browser reads the file and sends its text.
 */
export async function importNotes(input: unknown): Promise<Result<NotesPreview>> {
  const parsed = importNotesInput.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const { fileName, text, method } = parsed.data;
  const kind = notesKind(fileName);
  if (!kind.ok) return err("VALIDATION", kind.message, { file: kind.message });
  if (!text.trim()) return err("VALIDATION", "This file is empty.", { file: "This file is empty" });

  return asStudent<NotesPreview>("importNotes", async (userId) => {
    if (method === "headings") {
      const cards = cardsFromNotes(text, kind.kind);
      return cards.length
        ? ok({ cards, aiGenerated: false })
        : err("VALIDATION", "No headings or bold words found. Add a heading for each topic, or put key terms in bold.", { file: "No headings or bold words found" });
    }

    const student = await getInterviewee(userId);
    if (!student) return err("NOT_FOUND", "We couldn't find your profile. Log in again.");
    // Under-18: no consent lookup and no AI call, whatever the browser asked for.
    if (student.isUnder18) return err("FORBIDDEN", "AI cards are off for accounts under 18. Use your headings and bold words instead.");
    const consent = await latestConsent(userId, "ai_processing");
    if (!aiAllowed({ isUnder18: student.isUnder18, aiConsent: consent })) {
      return err("FORBIDDEN", "AI is off for your account. Turn it on in Settings and privacy, or use your headings and bold words.");
    }
    const r = await ai().cards({ id: userId, isUnder18: false, aiConsent: true, fullName: student.fullName }, text);
    return r.ok ? ok({ cards: r.value, aiGenerated: true }) : r;
  });
}

/** Saves the cards the student kept. They come back for the first time tomorrow. */
export async function addNoteCardsToReview(input: unknown): Promise<Result<{ added: number }>> {
  const parsed = addCardsInput.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  return asStudent("addNoteCardsToReview", async (userId) => {
    const tomorrow = new Date(endOfTodayMyt(new Date()).getTime() + 1);
    const added = await addNoteCards(userId, parsed.data.cards.map((c) => ({ ...c, fsrs: newCard(tomorrow) })));
    return ok({ added });
  });
}
