"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { btn } from "@/components/ui/button";
import { useAnnounce } from "@/components/ui/live-region";
import { FlagChip } from "@/components/ui/status-chip";
import { SubmitButton } from "@/components/ui/submit-button";
import { chooseTarget } from "./actions";

export type MatchCardData = {
  code: string;
  titleMs: string;
  titleEn: string;
  isTarget: boolean;
  pct: number;
  coveredEssential: number;
  essentialTotal: number;
  coveredOptional: number;
  optionalTotal: number;
  evidence: { quote: string; moduleName: string }[];
  uncertain: { label: string; confidence: number }[];
};

const PREVIEW = 2;

export function MatchCard({ o, rank }: { o: MatchCardData; rank: number }) {
  const [all, setAll] = useState(false);
  const quotesId = useId();
  const announce = useAnnounce();
  const shown = all ? o.evidence : o.evidence.slice(0, PREVIEW);

  return (
    <li className="card stack" aria-labelledby={`${quotesId}-title`}>
      <div className="row-between" style={{ alignItems: "flex-start" }}>
        <div className="stack-sm">
          <h2 id={`${quotesId}-title`} style={{ fontSize: "var(--text-h3)" }}>
            <span className="muted" style={{ fontWeight: 400 }}>{rank}. </span>
            {o.code} · {o.titleMs}
          </h2>
          <p className="muted">
            {o.titleEn}
            {o.isTarget ? <span> · your target role</span> : null}
          </p>
        </div>
        <p className="big-pct">Match {o.pct}%</p>
      </div>
      <div className="bar" aria-hidden="true">
        <span style={{ width: `${o.pct}%` }} />
      </div>
      <p className="secondary muted">
        Covers {o.coveredEssential} of {o.essentialTotal} essential skills and {o.coveredOptional} of {o.optionalTotal} optional skills.
      </p>

      {shown.length > 0 ? (
        <div className="stack-sm" id={quotesId}>
          <p className="secondary muted">Evidence from your modules</p>
          {shown.map((e) => (
            <blockquote key={e.quote} className="quote">
              <p>“{e.quote}”</p>
              <cite>{e.moduleName}</cite>
            </blockquote>
          ))}
          {o.evidence.length > PREVIEW ? (
            <div>
              <button
                type="button"
                className="link-btn"
                aria-expanded={all}
                aria-controls={quotesId}
                onClick={() => {
                  setAll(!all);
                  announce(all ? "Showing fewer quotes." : `Showing all ${o.evidence.length} quotes.`);
                }}
              >
                {all ? "Show fewer quotes" : `Show all ${o.evidence.length} quotes`}
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      {o.uncertain.length > 0 ? (
        <div className="notice notice-warn">
          <div className="stack-sm">
            <FlagChip>Check with adviser</FlagChip>
            <p>
              Some of these links are uncertain.{" "}
              {o.uncertain.map((u) => `“${u.label[0].toUpperCase()}${u.label.slice(1)}” is linked at ${Math.round(u.confidence * 100)}%`).join("; ")}
              , so it is not counted yet.
            </p>
            <p>
              <Link href="/bookings/new" style={{ color: "inherit" }}>Talk to a human</Link> if you want an adviser to check it.
            </p>
          </div>
        </div>
      ) : null}

      <div className="row">
        <Link href={`/matches/${o.code}`} className={btn("secondary")}>
          View {o.code} details
        </Link>
        {o.isTarget ? (
          <span className="secondary muted">This is your target role</span>
        ) : (
          <form action={chooseTarget}>
            <input type="hidden" name="code" value={o.code} />
            <SubmitButton variant="secondary">
              Choose as my target<span className="visually-hidden">: {o.titleEn}</span>
            </SubmitButton>
          </form>
        )}
      </div>
    </li>
  );
}
