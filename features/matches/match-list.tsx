"use client";

import { useState } from "react";
import { useAnnounce } from "@/components/ui/live-region";
import { MatchCard, type MatchCardData } from "./match-card";

const FIRST = 3;

export function MatchList({ items }: { items: MatchCardData[] }) {
  const [more, setMore] = useState(false);
  const announce = useAnnounce();
  const shown = more ? items : items.slice(0, FIRST);
  const hidden = items.length - FIRST;

  return (
    <div className="stack">
      <ol className="stack">
        {shown.map((o, i) => (
          <MatchCard key={o.code} o={o} rank={i + 1} />
        ))}
      </ol>
      {!more && hidden > 0 ? (
        <div>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              setMore(true);
              announce(`${hidden} more occupations shown.`);
            }}
          >
            Show {hidden} more occupations
          </button>
        </div>
      ) : null}
    </div>
  );
}
