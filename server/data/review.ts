import "server-only";
// D4 review cards, read and written as the student (RLS: own rows only). The fsrs column holds a ts-fsrs Card
// as JSON and card_due_at its due date; the full-stack engineer's addReviewCards (learning.ts) writes the same shape.
import type { Card } from "ts-fsrs";
import type { Json } from "../../lib/database.types.ts";
import { db } from "./supabase.ts";

function fail(what: string, error: { message: string }): never {
  throw new Error(`review: ${what}: ${error.message}`);
}

export type StoredCard = { id: string; skillUri: string | null; front: string; back: string; fsrs: Card };

/** JSON round-trips turn the Card's dates into strings; turn them back. */
export function cardFromJson(json: Json): Card {
  const c = json as unknown as Record<string, unknown>;
  return {
    ...(c as unknown as Card),
    due: new Date(c.due as string),
    last_review: c.last_review ? new Date(c.last_review as string) : undefined,
  };
}

type Row = { id: string; skill_uri: string | null; front: string; back: string; fsrs: Json };
const toCard = (r: Row): StoredCard => ({ id: r.id, skillUri: r.skill_uri, front: r.front, back: r.back, fsrs: cardFromJson(r.fsrs) });

export async function dueCards(userId: string, until: Date, limit = 100): Promise<StoredCard[]> {
  const { data, error } = await (await db()).from("review_cards")
    .select("id, skill_uri, front, back, fsrs").eq("user_id", userId)
    .lte("card_due_at", until.toISOString()).order("card_due_at").limit(limit);
  if (error) fail("due cards", error);
  return (data as Row[]).map(toCard);
}

/** The next time any card is due after `after`, for "Your next review is due ..." */
export async function nextDueAfter(userId: string, after: Date): Promise<Date | null> {
  const { data, error } = await (await db()).from("review_cards")
    .select("card_due_at").eq("user_id", userId).gt("card_due_at", after.toISOString())
    .order("card_due_at").limit(1).maybeSingle();
  if (error) fail("next due", error);
  return data ? new Date(data.card_due_at) : null;
}

export async function getCard(userId: string, id: string): Promise<StoredCard | null> {
  const { data, error } = await (await db()).from("review_cards")
    .select("id, skill_uri, front, back, fsrs").eq("user_id", userId).eq("id", id).maybeSingle();
  if (error) fail("card", error);
  return data ? toCard(data as Row) : null;
}

export async function saveSchedule(userId: string, id: string, card: Card): Promise<void> {
  const { error } = await (await db()).from("review_cards")
    .update({ fsrs: card as unknown as Json, card_due_at: card.due.toISOString() })
    .eq("user_id", userId).eq("id", id);
  if (error) fail("save schedule", error);
}

/** Cards made from the student's own notes have no skill. */
export async function addNoteCards(userId: string, cards: { front: string; back: string; fsrs: Card }[]): Promise<number> {
  if (!cards.length) return 0;
  const { error } = await (await db()).from("review_cards").insert(cards.map((c) => ({
    user_id: userId, skill_uri: null, front: c.front, back: c.back, fsrs: c.fsrs as unknown as Json, card_due_at: c.fsrs.due.toISOString(),
  })));
  if (error) fail("add note cards", error);
  return cards.length;
}

export async function skillLabels(uris: string[]): Promise<Map<string, string>> {
  if (!uris.length) return new Map();
  const { data, error } = await (await db()).schema("ref").from("skills").select("uri, label_en").in("uri", uris);
  if (error) fail("skill labels", error);
  return new Map((data ?? []).map((s: { uri: string; label_en: string }) => [s.uri, s.label_en]));
}
