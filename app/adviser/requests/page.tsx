import { revalidatePath } from "next/cache";
import { WorkspacePage, Panel, RouteLink } from "@/components/workspace-page";
import { ActionForm } from "@/components/action-form";
import { listRequests, respond, sendFeedback } from "@/features/adviser/actions";
import { SharedRecord } from "@/features/adviser/shared-record";
import { bookingTime } from "@/lib/booking-time";

export default async function Page() {
  const requests = await listRequests();
  async function decide(form: FormData) {
    "use server";
    const r = await respond({
      bookingId: form.get("id"),
      accept: form.get("decision") === "accept",
      note: form.get("note"),
    });
    if (!r.ok) return r.error.fields?.note || r.error.message;
    revalidatePath("/adviser/requests");
    return "Request updated.";
  }
  async function feedback(form: FormData) {
    "use server";
    const r = await sendFeedback({ bookingId: form.get("id"), text: form.get("feedback") });
    if (!r.ok) return r.error.message;
    revalidatePath("/adviser/requests");
    return "Feedback saved.";
  }
  return (
    <WorkspacePage title="Session requests">
      <RouteLink href="/adviser/availability">Manage available times</RouteLink>
      {!requests.ok ? (
        <p>{requests.error.message}</p>
      ) : !requests.value.length ? (
        <p>No session requests yet.</p>
      ) : (
        requests.value.map((b) => (
          <Panel key={b.id}>
            <h2>
              {b.studentName} · {b.topic}
            </h2>
            <p>
              {bookingTime(b.start)} · {b.status}
            </p>
            {b.note && <p>{b.note}</p>}
            {!["declined", "cancelled"].includes(b.status) && <SharedRecord id={b.id} />}
            {["requested", "change_requested"].includes(b.status) && (
              <ActionForm submit={decide} label="Save decision">
                <input type="hidden" name="id" value={b.id} />
                <label>
                  Decision{" "}
                  <select name="decision">
                    <option value="accept">Accept</option>
                    <option value="decline">Decline</option>
                  </select>
                </label>
                <label>
                  Note (required to decline) <textarea name="note" maxLength={1000} />
                </label>
              </ActionForm>
            )}
            {(b.status === "completed" ||
              (b.status === "accepted" && Date.parse(b.start) + b.minutes * 60000 <= Date.now())) && (
              <ActionForm submit={feedback} label="Save session feedback">
                <input type="hidden" name="id" value={b.id} />
                <label>
                  Feedback for student <textarea required name="feedback" maxLength={2000} />
                </label>
              </ActionForm>
            )}
          </Panel>
        ))
      )}
    </WorkspacePage>
  );
}
