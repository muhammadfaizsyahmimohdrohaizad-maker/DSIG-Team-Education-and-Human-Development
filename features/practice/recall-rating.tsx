"use client";

export const RECALL_OPTIONS = [
  { value: "again", name: "Again", sub: "I didn't know it" },
  { value: "hard", name: "Hard", sub: "I got part of it" },
  { value: "good", name: "Good", sub: "I knew it, with effort" },
  { value: "easy", name: "Easy", sub: "I knew it straight away" },
] as const;

export function RecallRating({
  value,
  onChange,
  error,
}: {
  value: string | null;
  onChange: (v: string) => void;
  error?: string | null;
}) {
  return (
    <fieldset className="stack-sm" aria-describedby="recall-note">
      <legend>How did that go?</legend>
      <p id="recall-note" className={error ? "field-error" : "field-hint"} role={error ? "alert" : undefined}>
        {error ?? "Choose one so we know when to bring this question back."}
      </p>
      <div className="choices cols-4">
        {RECALL_OPTIONS.map((o) => (
          <label key={o.value} className="choice">
            <input type="radio" name="recall" value={o.value} checked={value === o.value} onChange={() => onChange(o.value)} />
            <span>
              {o.name}
              <small>{o.sub}</small>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
