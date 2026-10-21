import { Card } from "@/components/ui/card";
import { StudentTable, type StudentRow } from "@/features/adviser/student-table";
import { nowSlotMY } from "@/lib/date";
import { getStore } from "@/server/data";
import { describeTarget } from "@/server/engines/matches";

export default async function AdviserPage() {
  const store = getStore();
  const [roster, bookings] = await Promise.all([store.listRoster(), store.listBookings()]);
  const now = nowSlotMY();

  // Latest booking per student; students who keep progress private still appear when they book.
  const latest = new Map<string, (typeof bookings)[number]>();
  for (const b of [...bookings].sort((a, c) => (a.slot < c.slot ? -1 : 1))) latest.set(b.studentId, b);
  const privateIds = [...latest.keys()].filter((id) => !roster.some((r) => r.id === id));
  const names = await store.studentNames(privateIds);

  const visible: StudentRow[] = await Promise.all(
    roster.map(async (s) => {
      const t = await describeTarget(s.modules, s.targetCode);
      const b = latest.get(s.id);
      return {
        id: s.id,
        name: s.name,
        semester: s.semester,
        target: t.occupation ? `${t.occupation.code} ${t.occupation.titleEn}` : "Exploring, no target yet",
        gaps: t.occupation
          ? t.gaps.map((g) => `${g.label}${g.uncertain ? " (uncertain link)" : ""}${s.ratings[g.id] ? ` · rated ${s.ratings[g.id]}/5` : ""}`).join("; ") || "No gaps"
          : "Not set until a target is chosen",
        feedback: s.needsAdviser
          ? `Needs adviser: the AI couldn't write feedback on an answer.${s.feedbackSummary ? ` Last next step: ${s.feedbackSummary}` : ""}`
          : (s.feedbackSummary ?? "No interview practice yet"),
        booking: b ? { id: b.id, slot: b.slot, status: b.status, note: b.note } : null,
        needsOutcome: !!b && b.status === "accepted" && b.slot < now,
      };
    }),
  );
  const hidden: StudentRow[] = privateIds.map((id) => {
    const b = latest.get(id)!;
    return {
      id,
      name: names[id]?.name ?? "Student",
      semester: names[id]?.semester ?? null,
      target: "Kept private by the student",
      gaps: "Kept private by the student",
      feedback: "Kept private by the student",
      booking: { id: b.id, slot: b.slot, status: b.status, note: b.note },
      needsOutcome: b.status === "accepted" && b.slot < now,
    };
  });
  const rows = [...visible, ...hidden].sort((a, b) => a.name.localeCompare(b.name));
  const waiting = rows.filter((r) => r.booking?.status === "requested").length;
  const needOutcome = rows.filter((r) => r.needsOutcome).length;

  return (
    <div className="stack-lg">
      <div className="page-head">
        <h1>Students</h1>
        <p>Your students who share their progress with you, and anyone who has sent you a booking. Student data is read-only; you can act on bookings only.</p>
      </div>
      <Card className="stack-sm">
        <p>
          <strong style={{ fontWeight: 600 }}>{waiting}</strong> waiting for a reply · <strong style={{ fontWeight: 600 }}>{needOutcome}</strong> needs an outcome
        </p>
        <p className="secondary muted">{rows.length} {rows.length === 1 ? "student" : "students"} in your list.</p>
      </Card>
      <StudentTable rows={rows} />
      <p className="secondary muted prose">
        Accepting, declining or cancelling updates the student&apos;s bookings page straight away, and emails them if they asked for
        booking emails. Emails carry the status, the time and a link, nothing else.
      </p>
    </div>
  );
}
