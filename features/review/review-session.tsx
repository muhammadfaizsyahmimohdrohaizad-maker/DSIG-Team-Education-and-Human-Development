"use client";

// Review board: one card at a time, reveal the answer, rate it, see when it comes back. Ratings are saved as
// they are given, so leaving half-way keeps what was done.
import { useMemo, useRef, useState, useTransition } from "react";
import { AlertMessage, Button, ButtonLink, Card, EmptyState, HeroBand, Kicker, SoftPanel, StatusTag, cn } from "@/components/ui";
import { rateCard, type DueCard, type ReviewRating } from "./actions";
import { whenLabel } from "./when";

const GRADES: { rating: ReviewRating; label: string; look: string }[] = [
  { rating: "again", label: "Forgot", look: "border-maroon bg-maroon text-white hover:bg-maroon-dark" },
  { rating: "hard", label: "Hard", look: "border-control bg-white text-navy hover:bg-cream" },
  { rating: "good", label: "Good", look: "border-control bg-white text-navy hover:bg-cream" },
  { rating: "easy", label: "Easy", look: "border-navy bg-navy text-white hover:opacity-90" },
];
const labelOf = (r: ReviewRating) => GRADES.find((g) => g.rating === r)!.label;
const source = (c: DueCard) => c.skill ?? "Your notes";

type Rated = { card: DueCard; rating: ReviewRating; due: string };

export function ReviewSession({ cards, nextDue }: { cards: DueCard[]; nextDue: string | null }) {
  const [index, setIndex] = useState(0);
  const [shown, setShown] = useState(false);
  const [rated, setRated] = useState<Rated[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const now = useMemo(() => new Date(), []);

  const groups = useMemo(() => {
    const m = new Map<string, number>();
    for (const c of cards) m.set(source(c), (m.get(source(c)) ?? 0) + 1);
    return [...m.entries()];
  }, [cards]);

  if (cards.length === 0) {
    return (
      <div className="flex max-w-2xl flex-col gap-4">
        <h1 className="m-0 text-[clamp(1.75rem,3vw,2.25rem)] leading-tight">Review</h1>
        <EmptyState
          headingLevel={2}
          title={nextDue ? "No cards due today" : "No review cards yet"}
          actions={<><ButtonLink href="/plan/review/import" variant="outline">Make cards from my notes</ButtonLink><ButtonLink href="/plan" variant="text">Back to my plan</ButtonLink></>}
        >
          <p className="m-0">
            {nextDue
              ? `Your next review is due ${whenLabel(new Date(nextDue), now)}.`
              : "Cards appear here when you pass a skill check, or when you make cards from your own notes."}
          </p>
        </EmptyState>
      </div>
    );
  }

  const done = index >= cards.length;
  const focusHeading = () => requestAnimationFrame(() => headingRef.current?.focus());

  function rate(card: DueCard, rating: ReviewRating) {
    if (pending) return;
    setError(null);
    startTransition(async () => {
      const r = await rateCard({ cardId: card.id, rating });
      if (!r.ok) { setError(`${r.error.message} Reference ${r.error.ref}.`); return; }
      setRated((prev) => [...prev, { card, rating, due: r.value.due }]);
      setShown(false);
      setIndex((i) => i + 1);
      focusHeading();
    });
  }

  if (done) {
    const remembered = rated.filter((r) => r.rating !== "again").length;
    const soonest = rated.reduce<string | null>((min, r) => (!min || r.due < min ? r.due : min), null);
    return (
      <section aria-labelledby="dn-h" className="flex max-w-3xl flex-col gap-5">
        <HeroBand>
          <h1 id="dn-h" ref={headingRef} tabIndex={-1} className="m-0 text-[clamp(1.5rem,2.5vw,2rem)]">Review done</h1>
          <p className="m-0 text-cream">
            You remembered {remembered} of {rated.length} {rated.length === 1 ? "card" : "cards"}.
            {soonest ? ` Your next review is due ${whenLabel(new Date(soonest), new Date())}.` : ""}
          </p>
        </HeroBand>
        <ul className="m-0 flex list-none flex-col rounded-card border border-hairline p-0">
          {rated.map((r, i) => (
            <li key={r.card.id} className={cn("flex flex-wrap items-baseline justify-between gap-2 px-5 py-3.5", i > 0 && "border-t border-hairline")}>
              <span className="min-w-0 flex-[1_1_240px]">{r.card.front}</span>
              <span className={cn("font-semibold", r.rating === "again" ? "text-maroon" : "text-navy")}>{labelOf(r.rating)} · again {whenLabel(new Date(r.due), new Date())}</span>
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap gap-3">
          <ButtonLink href="/dashboard" variant="outline">Back to dashboard</ButtonLink>
          <ButtonLink href="/plan/review/import" variant="outline">Make cards from my notes</ButtonLink>
        </div>
      </section>
    );
  }

  const card = cards[index]!;
  return (
    <div className="flex flex-col gap-6 desktop:flex-row desktop:items-start">
      <section aria-labelledby="rv-h" className="flex min-w-0 flex-[2_1_560px] flex-col gap-4">
        <div className="flex flex-col gap-1">
          <Kicker>Review · {cards.length} {cards.length === 1 ? "card" : "cards"} due today</Kicker>
          <h1 id="rv-h" ref={headingRef} tabIndex={-1} className="m-0 text-[clamp(1.75rem,3vw,2.25rem)] leading-tight">Card {index + 1} of {cards.length}</h1>
        </div>
        <div role="progressbar" aria-label="Review progress" aria-valuenow={index} aria-valuemin={0} aria-valuemax={cards.length} aria-valuetext={`${index} of ${cards.length} done`} className="h-2 w-full overflow-hidden rounded-full bg-hairline">
          <div className="h-full rounded-full bg-maroon" style={{ width: `${Math.round((index / cards.length) * 100)}%` }} />
        </div>
        <article aria-live="polite" className="flex flex-col overflow-hidden rounded-card border border-hairline">
          <div className="flex flex-col gap-2 px-5 py-6 tablet:px-8 tablet:py-10">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm text-muted">Question</span>
              {card.aiGenerated ? <StatusTag kind="ai_generated" /> : null}
            </div>
            <p className="m-0 font-display text-[clamp(1.25rem,2.2vw,1.625rem)] font-bold leading-snug text-navy">{card.front}</p>
          </div>
          {shown ? (
            <div className="flex flex-col gap-2 border-t border-hairline bg-cream px-5 pb-8 pt-6 tablet:px-8">
              <span className="text-sm text-muted">Answer</span>
              <p className="m-0 text-lg">{card.back}</p>
              <span className="text-sm text-muted">{card.skill ? `From your lesson: ${card.skill}` : "From your notes"}</span>
            </div>
          ) : null}
        </article>
        {error ? <AlertMessage>{error}</AlertMessage> : null}
        {!shown ? (
          <div className="flex flex-col gap-2">
            <p className="m-0 text-sm text-muted">Answer it in your head first, then check.</p>
            <Button onClick={() => setShown(true)} className="self-start">Show the answer</Button>
          </div>
        ) : (
          <fieldset className="m-0 flex min-w-0 flex-col gap-2 border-0 p-0">
            <legend className="mb-2 p-0 font-bold text-navy">How well did you remember it?</legend>
            <div className="grid grid-cols-2 gap-2 tablet:grid-cols-4">
              {GRADES.map((g) => (
                <button
                  key={g.rating}
                  type="button"
                  onClick={() => rate(card, g.rating)}
                  aria-busy={pending || undefined}
                  className={cn("flex min-h-16 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-button border px-2 font-sans", g.look)}
                >
                  <b>{g.label}</b>
                  <span className="text-sm">Again {whenLabel(new Date(card.nextDue[g.rating]), now)}</span>
                </button>
              ))}
            </div>
          </fieldset>
        )}
      </section>
      <aside className="flex min-w-0 flex-[1_1_300px] flex-col gap-4 desktop:max-w-[340px]">
        <SoftPanel as="section" aria-labelledby="due-h" gap="gap-3.5">
          <h2 id="due-h" className="m-0 text-[17px]">Due today</h2>
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {groups.map(([name, n]) => (
              <li key={name} className="flex justify-between gap-2 rounded-[10px] bg-white px-3 py-2.5 text-[15px]">
                <b className="text-navy">{name}</b>
                <span className="whitespace-nowrap">{n} {n === 1 ? "card" : "cards"}</span>
              </li>
            ))}
          </ul>
        </SoftPanel>
        <Card as="section" aria-labelledby="why-h">
          <h2 id="why-h" className="m-0 text-[17px]">Why review?</h2>
          <p className="m-0 text-[15px]">Each card comes back just before you&apos;re likely to forget it. Cards you find easy come back less often, so a review takes about 5 minutes.</p>
          <ButtonLink href="/plan/review/import" variant="outline" fullWidth>Make cards from my notes</ButtonLink>
        </Card>
      </aside>
    </div>
  );
}
