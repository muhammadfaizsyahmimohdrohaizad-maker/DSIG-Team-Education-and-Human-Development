import "server-only";
import { getStore } from "../data";
import { generateJSON } from "../llm/adapter";
import { hintLadderSchema } from "../llm/schemas";
import { REAL } from "../env";
import { addDays, todayMY } from "@/lib/date";
import { newCard, review, type RecallRating } from "@/lib/fsrs/scheduler";
import { leaksAnswer } from "@/lib/llm/guards";
import { orderGaps } from "@/lib/plan/order-gaps";
import type { Hint, Lesson, RecallItem } from "@/lib/types";
import { getGapSkills } from "./matches";


export async function lessonBySlug(slug: string): Promise<Lesson | null> {
  return (await getStore().listLessons()).find((l) => l.slug === slug) ?? null;
}

async function findItem(itemId: string): Promise<{ lesson: Lesson; item: RecallItem } | null> {
  for (const lesson of await getStore().listLessons()) {
    const item = lesson.items.find((i) => i.id === itemId);
    if (item) return { lesson, item };
  }
  return null;
}

/** One hint at a time. The model answer is never part of this response. */
export async function hintFor(itemId: string, level: 1 | 2 | 3): Promise<Hint | null> {
  const found = await findItem(itemId);
  if (!found) return null;
  const { lesson, item } = found;
  // Without consent to AI processing, the vetted static hints are used and nothing is sent out.
  const consent = await getStore().getConsent();
  const ladder = await generateJSON({
    live: !!consent?.aiProcessing || !REAL,
    task: "hint",
    key: itemId,
    schema: hintLadderSchema,
    prompt: {
      system: [
        "You write hints for a recall question in a study app for Malaysian diploma students in software engineering.",
        "Write exactly three hints that get more specific, as JSON: {\"hints\":[{\"level\":1,\"title\":\"Nudge\",\"text\":\"...\"},{\"level\":2,\"title\":\"Concept\",\"text\":\"...\"},{\"level\":3,\"title\":\"Worked example\",\"text\":\"...\"}]}.",
        "Level 1 points the student at what to think about. Level 2 explains the idea behind the answer. Level 3 is an everyday analogy.",
        "Never state the answer itself and never copy phrases from the model answer. One to three short sentences each, plain English, no markdown.",
      ].join("\n"),
      user: `Skill: ${lesson.label}\nQuestion: ${item.question}\nModel answer (for you only, do not reveal): ${item.modelAnswer}`,
    },
    accept: (hints) => hints.every((h) => !leaksAnswer(h.text, item.modelAnswer)),
  });
  return ladder?.find((h) => h.level === level) ?? null;
}

/** Only called after the student has pressed "Check answer". */
export async function modelAnswerFor(itemId: string): Promise<string | null> {
  return (await findItem(itemId))?.item.modelAnswer ?? null;
}

export async function rateItem(itemId: string, rating: RecallRating): Promise<{ nextReview: string } | null> {
  if (!(await findItem(itemId))) return null;
  const store = getStore();
  const cards = await store.listCards();
  const now = new Date();
  const { card, due } = review(cards[itemId] ?? newCard(now), rating, now);
  await store.saveCard(itemId, card);
  return { nextReview: todayMY(due) };
}

export type TodaySkill = {
  slug: string;
  label: string;
  rating?: number;
  dueItems: RecallItem[];
  mastered: boolean;
  hasContent: boolean;
};

export async function todayQueue() {
  const store = getStore();
  const [{ gaps }, lessons, cards, ratings, planBuilt, mastery, weak] = await Promise.all([
    getGapSkills(),
    store.listLessons(),
    store.listCards(),
    store.getRatings(),
    store.isPlanBuilt(),
    store.getMastery(),
    store.listWeakAreas(),
  ]);

  const today = todayMY();
  const isDue = (itemId: string) => !cards[itemId] || todayMY(new Date(cards[itemId].due)) <= today;
  const ordered = orderGaps(gaps.map((g) => ({ skillId: g.id, label: g.escoLabel, essential: g.essential, rating: ratings[g.id] })));

  const skills: TodaySkill[] = ordered.flatMap((g) => {
    const lesson = lessons.find((l) => l.skillId === g.skillId);
    if (!lesson) return [];
    return [
      {
        slug: lesson.slug,
        label: lesson.label,
        rating: g.rating,
        dueItems: lesson.items.filter((i) => isDue(i.id) && !weak.includes(i.id)),
        mastered: mastery[g.skillId]?.passed ?? false,
        hasContent: lesson.items.length > 0,
      },
    ];
  });

  const allItems = lessons.flatMap((l) => l.items.map((item) => ({ item, lesson: l })));
  const weakAreaItems = allItems.filter(({ item }) => weak.includes(item.id) && isDue(item.id));
  const dueCount = skills.reduce((n, s) => n + s.dueItems.length, 0) + weakAreaItems.length;

  const upcoming = new Map<string, number>();
  for (const itemId of Object.keys(cards)) {
    const day = todayMY(new Date(cards[itemId].due));
    if (day > today) upcoming.set(day, (upcoming.get(day) ?? 0) + 1);
  }

  return {
    planBuilt,
    skills,
    weakAreaItems,
    dueCount,
    minutes: Math.max(1, dueCount),
    upcoming: [...upcoming.entries()].sort(([a], [b]) => (a < b ? -1 : 1)).map(([day, count]) => ({ day, count })),
    masteredCount: Object.values(mastery).filter((m) => m.passed).length,
    gapCount: gaps.length,
    today,
    tomorrow: addDays(today, 1),
  };
}
