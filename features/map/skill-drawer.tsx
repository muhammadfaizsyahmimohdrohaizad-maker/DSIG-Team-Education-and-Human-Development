"use client";

import Link from "next/link";
import { Overlay } from "@/components/ui/overlay";
import { FlagChip } from "@/components/ui/status-chip";
import { btn } from "@/components/ui/button";

export type FoundSkill = {
  skillId: string;
  label: string;
  group: string;
  moduleName: string;
  quote: string;
  confidence: number;
};

export function SkillDrawer({ skill, tau, onClose }: { skill: FoundSkill | null; tau: number; onClose: () => void }) {
  const low = skill ? skill.confidence < tau : false;
  return (
    <Overlay open={skill !== null} onClose={onClose} title={skill?.label ?? ""} titleId="skill-drawer-title" kind="drawer" closeLabel="Close skill details">
      {skill ? (
        <>
          <p className="secondary muted">ESCO skill · {skill.group}</p>
          <div className="stack-sm">
            <p className="label" style={{ fontWeight: 500 }}>Quoted from the learning outcome</p>
            <blockquote className="quote">
              <p>“{skill.quote}”</p>
              <cite>{skill.moduleName}</cite>
            </blockquote>
          </div>
          <p>
            <strong style={{ fontWeight: 500 }}>Confidence</strong> {Math.round(skill.confidence * 100)}%
          </p>
          <p className="secondary muted">
            Threshold {Math.round(tau * 100)}%. Links below this are not counted towards your matches.
          </p>
          {low ? (
            <div className="notice notice-warn">
              <div className="stack-sm">
                <FlagChip>Check with adviser</FlagChip>
                <p>
                  This outcome talks about documenting quality work, not reporting test results. We are not sure it counts, so
                  it is left out of your match score.
                </p>
                <div>
                  <Link href="/bookings/new" className={btn("secondary")}>
                    Talk to a human about this skill
                  </Link>
                </div>
              </div>
            </div>
          ) : null}
        </>
      ) : null}
    </Overlay>
  );
}
