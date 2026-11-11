import { redirect } from "next/navigation";
import { randomUUID } from "node:crypto";
import { WorkspacePage, Panel, RouteLink } from "@/components/workspace-page";
import { ActionForm } from "@/components/action-form";
import { getOpenSlots, listMyBookings, requestBooking } from "@/features/booking/actions";
import { bookingTime } from "@/lib/booking-time";

export default async function Page() {
  const [slots, bookings] = await Promise.all([getOpenSlots(), listMyBookings()]);
  const requestId = randomUUID();
  async function book(form: FormData) {
    "use server";
    const r = await requestBooking({
      requestId,
      slotId: form.get("slot"),
      topic: form.get("topic"),
      note: form.get("note"),
      shared: form.getAll("share"),
    });
    if (!r.ok) return r.error.message;
    redirect("/book/" + r.value.bookingId);
  }
  return (
    <WorkspacePage title="Book an adviser">
      <Panel>
        <h2>Choose a session</h2>
        {!slots.ok ? (
          <p>{slots.error.message}</p>
        ) : !slots.value.length ? (
          <p>No appointments are available yet. Check back for new times.</p>
        ) : (
          <ActionForm submit={book} label="Request session">
            <label>
              Adviser and time{" "}
              <select name="slot" required defaultValue="">
                <option disabled value="">
                  Select a time
                </option>
                {slots.value.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.adviserName} · {bookingTime(s.start)} · {s.minutes} min
                  </option>
                ))}
              </select>
            </label>
            <label>
              What would you like to discuss? <input name="topic" required maxLength={150} />
            </label>
            <label>
              Optional note <textarea name="note" maxLength={1000} />
            </label>
            <fieldset>
              <legend>Share with this adviser for this booking</legend>
              {Object.entries({
                target_matches: "Target job and matches",
                gap_progress: "Skill gap progress",
                study_plan: "Study plan",
                interview_feedback: "Interview feedback",
              }).map(([key, label]) => (
                <label key={key} className="block">
                  <input name="share" type="checkbox" value={key} /> {label}
                </label>
              ))}
            </fieldset>
          </ActionForm>
        )}
      </Panel>
      <Panel>
        <h2>Your bookings</h2>
        {!bookings.ok ? (
          <p>{bookings.error.message}</p>
        ) : bookings.value.length ? (
          bookings.value.map((b) => (
            <RouteLink href={"/book/" + b.id} key={b.id}>
              {b.topic} · {bookingTime(b.start)} · {b.status}
            </RouteLink>
          ))
        ) : (
          <p>You have no bookings yet.</p>
        )}
      </Panel>
    </WorkspacePage>
  );
}
