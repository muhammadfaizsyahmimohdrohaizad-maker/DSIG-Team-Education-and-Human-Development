import { redirect } from "next/navigation";
import { WorkspacePage, Panel, RouteLink } from "@/components/workspace-page";
import { ActionForm } from "@/components/action-form";
import { listMyBookings, getOpenSlots, moveBooking, cancelBooking } from "@/features/booking/actions";
import { bookingTime } from "@/lib/booking-time";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const bookings = await listMyBookings();
  const b = bookings.ok && bookings.value.find((row) => row.id === id);
  if (!b)
    return (
      <WorkspacePage title="Booking">
        <p>{bookings.ok ? "Booking not found." : bookings.error.message}</p>
        <RouteLink href="/book">Back to bookings</RouteLink>
      </WorkspacePage>
    );
  const active =
    ["accepted", "requested", "change_requested"].includes(b.status) && Date.parse(b.start) > Date.now();
  const slots = active ? await getOpenSlots() : undefined;
  async function move(form: FormData) {
    "use server";
    const r = await moveBooking({ bookingId: id, slotId: form.get("slot") });
    if (!r.ok) return r.error.message;
    redirect("/book/" + id);
  }
  async function cancel() {
    "use server";
    const r = await cancelBooking({ bookingId: id });
    if (!r.ok) return r.error.message;
    redirect("/book");
  }
  return (
    <WorkspacePage title={b.topic}>
      <Panel>
        <h2>{b.adviserName}</h2>
        <p>
          {bookingTime(b.start)} · {b.minutes} min · {b.status}
        </p>
        {b.note && <p>Your note: {b.note}</p>}
        {b.adviserNote && <p>Adviser note: {b.adviserNote}</p>}
        <p>Shared for this session: {b.shared.map((s) => s.replaceAll("_", " ")).join(", ") || "Nothing"}</p>
        {b.feedback && <p>Session feedback: {b.feedback.text}</p>}
      </Panel>
      {active && (
        <Panel>
          <h2>Manage session</h2>
          {slots && !slots.ok && <p>{slots.error.message}</p>}
          {slots?.ok && slots.value.length > 0 && (
            <ActionForm label="Move session" submit={move}>
              <label>
                New time{" "}
                <select name="slot" required defaultValue="">
                  <option value="" disabled>
                    Select a time
                  </option>
                  {slots.value.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.adviserName} · {bookingTime(s.start)}
                    </option>
                  ))}
                </select>
              </label>
            </ActionForm>
          )}
          <ActionForm submit={cancel} label="Cancel booking" />
        </Panel>
      )}
      <RouteLink href="/book">Back to bookings</RouteLink>
    </WorkspacePage>
  );
}
