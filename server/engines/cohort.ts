import "server-only";
import { MIN_GROUP } from "@/lib/config";
import { getStore } from "../data";
import { describeTarget } from "./matches";

export type CohortSummary = {
  total: number;
  shownTotal: boolean;
  occupations: { code: string; title: string; students: number; averageMatch: number }[];
  hiddenOccupationGroups: number;
  noTarget: number | null;
  gaps: { label: string; students: number; averageConfidence: number | null }[];
};

/**
 * Anonymous totals for the institution. Any group smaller than MIN_GROUP (5) is left out, so no
 * figure can point at one student.
 */
export async function cohortSummary(): Promise<CohortSummary> {
  const rows = await getStore().listCohort();
  const described = await Promise.all(rows.map(async (r) => ({ row: r, t: await describeTarget(r.modules, r.targetCode) })));

  const byOccupation = new Map<string, { title: string; pcts: number[] }>();
  let noTarget = 0;
  const gapCounts = new Map<string, { label: string; students: number; ratings: number[] }>();
  for (const { row, t } of described) {
    if (!t.occupation) {
      noTarget++;
      continue;
    }
    const group = byOccupation.get(t.occupation.code) ?? { title: t.occupation.titleEn, pcts: [] };
    group.pcts.push(t.pct ?? 0);
    byOccupation.set(t.occupation.code, group);
    for (const g of t.gaps) {
      const entry = gapCounts.get(g.id) ?? { label: g.label, students: 0, ratings: [] };
      entry.students++;
      if (row.ratings[g.id]) entry.ratings.push(row.ratings[g.id]);
      gapCounts.set(g.id, entry);
    }
  }

  const occupations = [...byOccupation.entries()]
    .filter(([, g]) => g.pcts.length >= MIN_GROUP)
    .map(([code, g]) => ({ code, title: g.title, students: g.pcts.length, averageMatch: Math.round(g.pcts.reduce((a, b) => a + b, 0) / g.pcts.length) }))
    .sort((a, b) => b.students - a.students);
  const gaps = [...gapCounts.values()]
    .filter((g) => g.students >= MIN_GROUP)
    .map((g) => ({
      label: g.label,
      students: g.students,
      // Only shown when at least MIN_GROUP students rated it, for the same reason.
      averageConfidence: g.ratings.length >= MIN_GROUP ? Math.round((10 * g.ratings.reduce((a, b) => a + b, 0)) / g.ratings.length) / 10 : null,
    }))
    .sort((a, b) => b.students - a.students)
    .slice(0, 10);

  return {
    total: rows.length,
    shownTotal: rows.length >= MIN_GROUP,
    occupations,
    hiddenOccupationGroups: [...byOccupation.values()].filter((g) => g.pcts.length < MIN_GROUP).length,
    noTarget: noTarget >= MIN_GROUP ? noTarget : null,
    gaps,
  };
}
