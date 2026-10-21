import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { btn } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FlagChip, NeutralChip, OkChip } from "@/components/ui/status-chip";
import { MATCH_CONFIDENCE_THRESHOLD } from "@/lib/config";
import { getOccupationDetail, type SkillWithEvidence } from "@/server/engines/matches";

type Params = { params: Promise<{ code: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { code } = await params;
  return { title: `${code} occupation` };
}

function SkillRow({ skill, covered }: { skill: SkillWithEvidence; covered: boolean }) {
  const low = !covered && skill.link && skill.link.confidence < MATCH_CONFIDENCE_THRESHOLD;
  return (
    <li className="stack-sm">
      <div className="row">
        <h3 style={{ fontSize: "var(--text-body)", fontWeight: 500 }}>{skill.escoLabel}</h3>
        {skill.essential ? <OkChip>Essential</OkChip> : <NeutralChip>Optional</NeutralChip>}
        {low ? <FlagChip>Check with adviser</FlagChip> : null}
      </div>
      {covered && skill.link ? (
        <blockquote className="quote">
          <p>“{skill.link.quote}”</p>
          <cite>{skill.link.moduleName}</cite>
        </blockquote>
      ) : low && skill.link ? (
        <p className="secondary muted">
          Linked to {skill.link.moduleName} at {Math.round(skill.link.confidence * 100)}%, below the{" "}
          {Math.round(MATCH_CONFIDENCE_THRESHOLD * 100)}% we need to count it.
        </p>
      ) : skill.note ? (
        <p className="secondary muted">{skill.note}</p>
      ) : null}
    </li>
  );
}

export default async function OccupationPage({ params }: Params) {
  const { code } = await params;
  const detail = await getOccupationDetail(code);
  if (!detail) notFound();
  const { occupation, match, covered, gaps } = detail;

  return (
    <div className="stack-lg">
      <nav aria-label="Breadcrumb" className="secondary">
        <Link href="/matches">Matches</Link> <span aria-hidden="true">/</span> <span aria-current="page">{occupation.code}</span>
      </nav>

      <div className="page-head">
        <p className="stage-label">MASCO 2020 · {occupation.role === "primary" ? "your target role" : occupation.role === "secondary" ? "related role" : "entry-level alternative"}</p>
        <h1>
          {occupation.code} · {occupation.titleMs}
        </h1>
        <p style={{ fontSize: "var(--text-h3)", color: "var(--ink)" }}>{occupation.titleEn}</p>
      </div>

      <Card className="row-between">
        <div>
          <p className="big-pct">Match {match.pct}%</p>
          <p className="secondary muted">
            {match.coveredEssential.length} of {match.essentialTotal} essential skills · {match.coveredOptional.length} of{" "}
            {match.optionalTotal} optional
          </p>
        </div>
        <div className="row">
          <Link href="/plan" className={btn("primary")}>
            Build my plan for this role
          </Link>
          <Link href="/bookings/new" className={btn("secondary")}>
            Talk to a human
          </Link>
        </div>
      </Card>

      <section className="stack" aria-labelledby="covered-title">
        <div className="stack-sm">
          <h2 id="covered-title">Skills you already cover ({covered.length})</h2>
          <p className="muted">Each one is backed by a line from your course outline.</p>
        </div>
        <ul className="card divided card-flush">
          {covered.map((s) => (
            <SkillRow key={s.id} skill={s} covered />
          ))}
        </ul>
      </section>

      <section className="stack" aria-labelledby="gaps-title">
        <div className="stack-sm">
          <h2 id="gaps-title">Skills to build ({gaps.length})</h2>
          <p className="muted">Your plan starts with these.</p>
        </div>
        <ul className="card divided card-flush">
          {gaps.map((s) => (
            <SkillRow key={s.id} skill={s} covered={false} />
          ))}
        </ul>
      </section>
    </div>
  );
}
