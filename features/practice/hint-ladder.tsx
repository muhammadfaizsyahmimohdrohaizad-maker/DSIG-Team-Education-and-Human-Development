import type { Hint } from "@/lib/types";

/** Hints appear here one at a time. The region is always on the page so screen readers announce each new hint. */
export function HintLadder({ hints }: { hints: Hint[] }) {
  return (
    <div aria-live="polite" className="stack-sm">
      {hints.map((h) => (
        <section key={h.level} className="hint-box" aria-label={`Hint ${h.level}`}>
          <h3>
            Hint {h.level} · {h.title}
          </h3>
          <p className="prose">{h.text}</p>
        </section>
      ))}
    </div>
  );
}
