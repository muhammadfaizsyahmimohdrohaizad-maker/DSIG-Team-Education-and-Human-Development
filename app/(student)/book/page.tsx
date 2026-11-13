import { HeroBand } from "@/components/ui";
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
      <HeroBand gap="gap-4"><h2 className="text-2xl">Plan a career conversation</h2>
        <p>Choose an adviser and a time, add your question, and select the parts of your plan to share.</p>
        <div className="flex flex-wrap gap-3"><a href="#available-sessions" className="font-semibold text-white underline">Available sessions{slots.ok && " · " + slots.value.length}</a>
        <a href="#my-bookings" className="font-semibold text-white underline">My bookings{bookings.ok && " · " + bookings.value.length}</a></div>
      </HeroBand>
      <div className="grid items-start gap-4 tablet:grid-cols-[3fr_2fr]">
      <Panel>
        <h2 className="text-xl" id="available-sessions">Choose a session</h2>
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
        <h2 className="text-xl" id="my-bookings">Your bookings</h2>
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
      </div>
    </WorkspacePage>
  );
}

