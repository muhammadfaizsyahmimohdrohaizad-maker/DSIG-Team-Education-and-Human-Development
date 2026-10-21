"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { btn } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorBanner } from "@/components/ui/error-banner";
import { useAnnounce } from "@/components/ui/live-region";
import { FlagChip } from "@/components/ui/status-chip";
import type { Module } from "@/lib/types";
import { saveModules } from "./actions";
import { CoverageTable } from "./coverage-table";
import { ModulePicker } from "./module-picker";
import { SkillDrawer, type FoundSkill } from "./skill-drawer";
import { SkillsRadar } from "./skills-radar";

type FoundLink = { skillId: string; moduleId: string; confidence: number; quote: string; label: string; group: string; groupIndex: number; moduleName: string };

export function MapView({
  axes,
  modules,
  initialTicked,
  links,
  tau,
}: {
  axes: string[];
  modules: Module[];
  initialTicked: string[];
  links: FoundLink[];
  tau: number;
}) {
  const [ticked, setTicked] = useState(() => new Set(initialTicked));
  const [open, setOpen] = useState<FoundSkill | null>(null);
  const [failed, setFailed] = useState(false);
  const [, startTransition] = useTransition();
  const announce = useAnnounce();

  const values = useMemo(
    () => axes.map((_, i) => Math.min(100, modules.reduce((sum, m) => sum + (ticked.has(m.id) ? m.coverage[i] : 0), 0))),
    [axes, modules, ticked],
  );

  // One row per skill: the best link among the ticked modules.
  const found = useMemo(() => {
    const best = new Map<string, FoundLink>();
    for (const l of links) {
      if (!ticked.has(l.moduleId)) continue;
      const prev = best.get(l.skillId);
      if (!prev || l.confidence > prev.confidence) best.set(l.skillId, l);
    }
    return [...best.values()];
  }, [links, ticked]);

  const rows = axes.map((name, i) => ({ name, pct: values[i], found: found.filter((f) => f.groupIndex === i).length }));
  const top = [...rows].sort((a, b) => b.pct - a.pct).slice(0, 2);
  const summary = `Strongest areas: ${top.map((t) => `${t.name} ${t.pct}%`).join(", ")}.`;

  function toggle(id: string) {
    const next = new Set(ticked);
    const was = next.has(id);
    if (was) next.delete(id);
    else next.add(id);
    setTicked(next);
    const name = modules.find((m) => m.id === id)?.name ?? "module";
    announce(`${was ? "Removed" : "Added"} ${name}. Skills map updated.`);
    startTransition(async () => {
      try {
        await saveModules([...next]);
        setFailed(false);
      } catch {
        setFailed(true);
      }
    });
  }

  return (
    <div className="stack-lg">
      {failed ? (
        <ErrorBanner message="We couldn't save your modules. Your map is still correct here. Check your connection and try again." />
      ) : null}
      <div className="cols picker">
        <Card aria-labelledby="picker-title" className="stack">
          <div className="stack-sm">
            <h2 id="picker-title">Your programme</h2>
            <p>GMI Diploma in Software Engineering</p>
          </div>
          <ModulePicker modules={modules} ticked={ticked} onToggle={toggle} />
          <p className="meta">Uploading a module descriptor is off in this demo. Modules are entered by hand.</p>
          <p className="secondary">
            <strong style={{ fontWeight: 600 }}>
              {ticked.size} of {modules.length}
            </strong>{" "}
            modules ticked
          </p>
        </Card>

        <Card aria-labelledby="results-title" className="stack">
          <div className="stack-sm">
            <h2 id="results-title">Your skills map</h2>
            <p className="muted secondary">Coverage of each ESCO skill group, based on the modules you ticked.</p>
          </div>
          {ticked.size === 0 ? (
            <EmptyState title="No modules selected" level={3}>
              Tick the modules you have completed to see your skills.
            </EmptyState>
          ) : (
            <>
              <SkillsRadar axes={axes} values={values} summary={summary} />
              <CoverageTable rows={rows} />
              <div className="stack-sm">
                <h3>Skills found ({found.length})</h3>
                <p className="secondary muted">Select a skill to see the line it came from.</p>
                <ul className="table-frame">
                  {found.map((k) => (
                    <li key={k.skillId}>
                      <button
                        type="button"
                        className="list-row"
                        aria-haspopup="dialog"
                        onClick={() => {
                          setOpen({ skillId: k.skillId, label: k.label, group: k.group, moduleName: k.moduleName, quote: k.quote, confidence: k.confidence });
                        }}
                      >
                        <span>
                          <span style={{ fontWeight: 500 }}>{k.label}</span>
                          <br />
                          <span className="secondary muted">{k.moduleName}</span>
                        </span>
                        <span className="row" style={{ justifyContent: "flex-end" }}>
                          {k.confidence < tau ? <FlagChip>Check with adviser</FlagChip> : null}
                          <span className="secondary muted">Confidence {Math.round(k.confidence * 100)}%</span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </Card>
      </div>

      <Card className="row-between">
        <p className="prose">
          Next, see which jobs these skills point to. Each match is a MASCO 2020 occupation you can look up on eMASCO.
        </p>
        <Link href="/matches" className={btn("primary")}>
          View occupation matches
        </Link>
      </Card>

      <SkillDrawer skill={open} tau={tau} onClose={() => setOpen(null)} />
    </div>
  );
}
