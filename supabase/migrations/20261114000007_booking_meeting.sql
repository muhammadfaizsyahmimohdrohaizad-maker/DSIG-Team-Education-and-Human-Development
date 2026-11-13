alter table public.bookings add column meeting_url text
  check (meeting_url ~ '^https://meet[.]google[.]com/[a-z]{3}-[a-z]{4}-[a-z]{3}$');

create function public.set_booking_meeting(p_booking uuid, p_url text)
returns void language plpgsql security definer set search_path = '' as $$
declare me uuid := public.require_adviser();
begin
  update public.bookings b set meeting_url = nullif(trim(p_url), '')
  from public.availability_slots s
  where b.id = p_booking and s.id = b.slot_id and s.adviser_id = me
    and b.status = 'accepted' and s.slot_start + s.minutes * interval '1 minute' > now();
  if not found then raise exception 'bad_status' using errcode = 'P0001'; end if;
end $$;
revoke all on function public.set_booking_meeting(uuid,text) from public, anon;
grant execute on function public.set_booking_meeting(uuid,text) to authenticated;

create function public.clear_booking_meeting() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.meeting_url := null;
  return new;
end $$;
create trigger clear_booking_meeting before update of slot_id,status on public.bookings
for each row when (old.slot_id is distinct from new.slot_id or new.status <> 'accepted')
execute function public.clear_booking_meeting();
