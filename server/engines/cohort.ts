// A6. Cohort totals (FR-ADV-04). The database function cohort_rows applies the same rule,
// so suppressed groups never leave Postgres; this copy keeps the rule unit-tested.

export const MIN_GROUP = 5;

export type CohortRow = { group: string; count: number };

export function aggregate(rows: readonly CohortRow[], minGroup = MIN_GROUP): CohortRow[] {
  return rows.filter((r) => r.count >= minGroup).sort((a, b) => b.count - a.count || a.group.localeCompare(b.group));
}
