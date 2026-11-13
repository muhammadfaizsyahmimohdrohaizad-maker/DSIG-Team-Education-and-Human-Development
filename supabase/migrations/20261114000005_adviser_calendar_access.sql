-- The adviser calendar uses these tables through the authenticated client.
-- Existing row policies restrict slot reads and enforce ownership on writes.
grant select (id, adviser_id, slot_start, minutes, is_open),
      insert (adviser_id, slot_start, minutes, is_open),
      update (is_open)
  on public.availability_slots to authenticated;
grant select (adviser_id, day, reason), insert (adviser_id, day, reason),
      update (adviser_id, day, reason), delete
  on public.blocked_days to authenticated;

-- Recheck under the slot row lock, including when a booking raced the calendar read.
create function public.protect_booked_slot_open_state() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if old.is_open is distinct from new.is_open and exists (
    select 1 from public.bookings where slot_id = old.id
      and status in ('requested', 'accepted', 'change_requested')
  ) then
    raise exception 'slot_booked';
  end if;
  return new;
end;
$$;
revoke all on function public.protect_booked_slot_open_state() from public;
create trigger protect_booked_slot_open_state before update of is_open on public.availability_slots
for each row execute function public.protect_booked_slot_open_state();
