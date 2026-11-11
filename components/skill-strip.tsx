import { cn } from "./ui";

// Readiness strip from the Dashboard board: one segment per skill the target job needs. Mastered segments are
// filled navy, learning ones striped maroon, not-started ones outlined, and the legend carries the numbers in
// words, so the strip never relies on colour alone.
export function SkillStrip({ mastered, learning, notStarted }: { mastered: number; learning: number; notStarted: number }) {
  const segments = [
    ...Array.from({ length: mastered }, () => "strip-done"),
    ...Array.from({ length: learning }, () => "strip-learning"),
    ...Array.from({ length: notStarted }, () => "strip-todo"),
  ];
  const legend = [
    { cls: "strip-done", text: `Mastered: ${mastered}` },
    { cls: "strip-learning", text: `Learning: ${learning}` },
    { cls: "strip-todo", text: `Not started: ${notStarted}` },
  ];
  return (
    <>
      <div aria-hidden="true" className="grid gap-1" style={{ gridTemplateColumns: `repeat(${Math.max(segments.length, 1)}, minmax(0, 1fr))` }}>
        {segments.map((cls, i) => <span key={i} className={cn("h-2.5 rounded-[3px]", cls)} />)}
      </div>
      <ul className="m-0 flex list-none flex-col gap-1 p-0 text-sm">
        {legend.map((l) => (
          <li key={l.cls} className="flex items-center gap-2">
            <span aria-hidden="true" className={cn("size-3 rounded-[3px]", l.cls)} />
            {l.text}
          </li>
        ))}
      </ul>
    </>
  );
}
