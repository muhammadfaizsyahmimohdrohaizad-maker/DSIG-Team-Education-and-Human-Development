import { revalidatePath } from "next/cache";
import { WorkspacePage, Panel } from "@/components/workspace-page";
import { ActionForm } from "@/components/action-form";
import { getAvailability, setAvailability } from "@/features/adviser/actions";
import { bookingTime } from "@/lib/booking-time";

export default async function Page() {
  const availability = await getAvailability();
  async function save(form: FormData) {
    "use server";
    const start = form.get("start") || String(form.get("local")) + ":00+08:00";
    const r = await setAvailability({
      slots: [{ start, minutes: Number(form.get("minutes")), open: form.get("open") === "yes" }],
    });
    if (!r.ok) return r.error.message;
    revalidatePath("/adviser/availability");
    return r.value.keptBooked.length ? "This time already has a booking." : "Availability updated.";
  }
  async function block(form: FormData) {
    "use server";
    const day = form.get("day");
    const r = await setAvailability(
      form.has("unblock") ? { slots: [], unblockDays: [day] } : { slots: [], blockDays: [{ day }] },
    );
    if (!r.ok) return r.error.message;
    revalidatePath("/adviser/availability");
    return "Calendar updated.";
  }
  return (
    <WorkspacePage title="Availability">
      <Panel>
        <h2>Open a session</h2>
        <ActionForm submit={save} label="Add time">
          <label>
            Start (Malaysia time) <input required name="local" type="datetime-local" />
          </label>
          <label>
            Minutes{" "}
            <select name="minutes">
              <option>30</option>
              <option>60</option>
            </select>
          </label>
          <input type="hidden" name="open" value="yes" />
        </ActionForm>
      </Panel>
      <Panel>
        <h2>Block a day</h2>
        <ActionForm submit={block} label="Block date">
          <input aria-label="Date to block" name="day" type="date" required />
        </ActionForm>
        {availability.ok &&
          availability.value.blockedDays.map((d) => (
            <ActionForm key={d.day} submit={block} label={"Unblock " + d.day}>
              <input type="hidden" name="day" value={d.day} />
              <input type="hidden" name="unblock" />
            </ActionForm>
          ))}
      </Panel>
      <Panel>
        <h2>Your session times</h2>
        {!availability.ok ? (
          <p>{availability.error.message}</p>
        ) : availability.value.slots.length === 0 ? (
          <p>No times scheduled.</p>
        ) : (
          availability.value.slots.map((s) => (
            <div key={s.id}>
              <p>
                {bookingTime(s.start)} · {s.minutes} min · {s.booked ? "Booked" : s.open ? "Open" : "Closed"}
              </p>
              {!s.booked && (
                <ActionForm submit={save} label={s.open ? "Close time" : "Open time"}>
                  <input type="hidden" name="start" value={s.start} />
                  <input type="hidden" name="minutes" value={s.minutes} />
                  <input type="hidden" name="open" value={s.open ? "no" : "yes"} />
                </ActionForm>
              )}
            </div>
          ))
        )}
      </Panel>
    </WorkspacePage>
  );
}
