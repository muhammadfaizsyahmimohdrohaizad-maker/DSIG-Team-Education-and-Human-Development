import { WorkspacePage, Panel } from "@/components/workspace-page";
import { listRequests } from "@/features/adviser/actions";
import { SharedRecord } from "@/features/adviser/shared-record";
import { bookingTime } from "@/lib/booking-time";
export default async function Page() {
  const r = await listRequests();
  const sessions = r.ok ? r.value.filter((b) => !["cancelled", "declined"].includes(b.status)) : [];
  return (
    <WorkspacePage title="Students">
      {!r.ok ? (
        <p>{r.error.message}</p>
      ) : !sessions.length ? (
        <p>You have no students with current shared sessions.</p>
      ) : (
        sessions.map((b) => (
          <Panel key={b.id}>
            <h2>{b.studentName}</h2>
            <p>
              {b.topic} · {bookingTime(b.start)}
            </p>
            <SharedRecord id={b.id} />
          </Panel>
        ))
      )}
    </WorkspacePage>
  );
}
