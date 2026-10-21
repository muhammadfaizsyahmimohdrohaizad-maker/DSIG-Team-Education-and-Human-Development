import { Card } from "@/components/ui/card";
import { StudentTable, type StudentRow } from "@/features/adviser/student-table";
import { DEMO_TODAY } from "@/lib/config";
import { getStore } from "@/server/data";

function cohortLine(students: { target: string; gaps: string }[]): string {
  const withTarget = students.filter((s) => !s.target.toLowerCase().startsWith("exploring")).length;
  const counts = new Map<string, number>();
  for (const s of students) {
    for (const raw of s.gaps.split(";")) {
      const gap = raw.replace(/\(.*?\)/g, "").trim();
      if (gap && !gap.toLowerCase().startsWith("not set")) counts.set(gap, (counts.get(gap) ?? 0) + 1);
    }
  }
  const top = Math.max(0, ...counts.values());
  const common = [...counts.entries()].filter(([, n]) => n === top && n > 1).map(([g]) => g);
  const list = common.length > 1 ? `${common.slice(0, -1).join(", ")} and ${common[common.length - 1]}` : common[0];
  return `This cohort: ${withTarget} of ${students.length} students have a target role.${common.length ? ` Most common gaps are ${list} (${top} students each).` : ""}`;
}

export default async function AdviserPage() {
  const store = getStore();
  const [students, bookings] = await Promise.all([store.listAdviserStudents(), store.listBookings()]);

  const rows: StudentRow[] = students.map((s) => {
    const b = bookings.filter((x) => x.studentId === s.id).sort((a, c) => (a.slot < c.slot ? 1 : -1))[0];
    return {
      ...s,
      booking: b ? { id: b.id, slot: b.slot, status: b.status, note: b.note } : null,
      needsOutcome: !!b && b.status === "accepted" && b.slot < `${DEMO_TODAY}T00:00`,
    };
  });
  const waiting = rows.filter((r) => r.booking?.status === "requested").length;
  const needOutcome = rows.filter((r) => r.needsOutcome).length;

  return (
    <div className="stack-lg">
      <div className="page-head">
        <h1>Students</h1>
        <p>Each row shows a student&apos;s target role, gaps and booking. Student data is read-only; you can act on bookings only.</p>
      </div>
      <Card className="stack-sm">
        <p>
          <strong style={{ fontWeight: 600 }}>{waiting}</strong> waiting for a reply · <strong style={{ fontWeight: 600 }}>{needOutcome}</strong> needs an outcome
        </p>
        <p className="secondary muted">{cohortLine(students)}</p>
      </Card>
      <StudentTable rows={rows} />
      <p className="secondary muted prose">
        Accepting, declining or cancelling updates the student&apos;s bookings page straight away and sends them an email. Emails carry the status, the time and a link, nothing else.
      </p>
    </div>
  );
}
