"use client";
// Tabs (WAI-ARIA tabs pattern): arrow keys, Home and End move between tabs; Tab moves into the panel.
// For two pages that are separate routes (Log in / Sign up), use SegmentedLinks instead: they are links, not tabs.
import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "./cn";

export type TabItem = { id: string; label: string; content: ReactNode };

export function Tabs({ items, label, defaultTab, className }: { items: TabItem[]; label: string; defaultTab?: string; className?: string }) {
  const base = useId();
  const [active, setActive] = useState(defaultTab ?? items[0]?.id ?? "");
  const refs = useRef<Array<HTMLButtonElement | null>>([]);

  function onKeyDown(e: KeyboardEvent<HTMLButtonElement>, index: number) {
    const last = items.length - 1;
    const next = e.key === "ArrowRight" ? (index === last ? 0 : index + 1)
      : e.key === "ArrowLeft" ? (index === 0 ? last : index - 1)
      : e.key === "Home" ? 0
      : e.key === "End" ? last
      : null;
    if (next === null) return;
    e.preventDefault();
    const item = items[next];
    if (!item) return;
    setActive(item.id);
    refs.current[next]?.focus();
  }

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div role="tablist" aria-label={label} className="flex max-w-full gap-1 overflow-x-auto rounded-button bg-cream p-1">
        {items.map((item, i) => {
          const selected = item.id === active;
          return (
            <button
              key={item.id}
              ref={(el) => { refs.current[i] = el; }}
              type="button"
              role="tab"
              id={`${base}-tab-${item.id}`}
              aria-selected={selected}
              aria-controls={`${base}-panel-${item.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(item.id)}
              onKeyDown={(e) => onKeyDown(e, i)}
              className={cn("min-h-11 flex-1 cursor-pointer whitespace-nowrap rounded-control px-4 font-semibold", selected ? "bg-navy text-white" : "text-navy hover:bg-white")}
            >
              {item.label}
            </button>
          );
        })}
      </div>
      {items.map((item) => (
        <div key={item.id} role="tabpanel" id={`${base}-panel-${item.id}`} aria-labelledby={`${base}-tab-${item.id}`} hidden={item.id !== active} tabIndex={0}>
          {item.content}
        </div>
      ))}
    </div>
  );
}
