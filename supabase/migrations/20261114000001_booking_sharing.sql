create or replace function public.set_booking_sharing(p_booking uuid, p_shared text[])
returns void language plpgsql security definer set search_path = '' as $$
begin
  update public.bookings b set shared_items = p_shared
  from public.availability_slots s
  where b.id = p_booking and b.student_id = auth.uid() and s.id = b.slot_id
    and b.status in ('requested','accepted','change_requested') and s.slot_start > now();
  if not found then raise exception 'booking unavailable'; end if;
end;
$$;
revoke all on function public.set_booking_sharing(uuid,text[]) from public, anon;
grant execute on function public.set_booking_sharing(uuid,text[]) to authenticated;
