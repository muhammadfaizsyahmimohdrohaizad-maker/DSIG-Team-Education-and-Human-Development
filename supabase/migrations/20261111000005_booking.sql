-- Booking and adviser RPCs for features/booking and features/adviser. Written by the backend engineer in
-- sprint 1, reviewed and adjusted by the DBA:
--   * search_path = public, pg_temp on every SECURITY DEFINER function (temp objects cannot shadow tables);
--   * move_booking follows analysis 4.11: moving an accepted booking makes it change_requested;
--   * adviser_requests also returns student_id, programme, semester and the ticked item names
--     (the Requests board lists them before the adviser opens the request);
--   * slot_is_free is internal: revoked from authenticated too.
-- PostgREST cannot hold a row lock across calls, so every booking state change runs here, in one
-- transaction, with SELECT ... FOR UPDATE on the rows it changes (System Design A7).
-- Errors are raised with a short message token that server/data maps to a Result code:
--   not_allowed, not_found, slot_closed, slot_taken, bad_status, too_late, not_completed, undertaking_required

alter table bookings add column if not exists adviser_note text check (char_length(adviser_note) <= 1000);
alter table blocked_days add column if not exists reason text check (char_length(reason) <= 200);
-- Without this, deleting an adviser who has any booking fails (account deletion and the 12-month purge).
alter table bookings drop constraint bookings_slot_id_fkey,
  add constraint bookings_slot_id_fkey foreign key (slot_id) references availability_slots(id) on delete cascade;

-- True when the slot can take a new booking: offered, in the future, not on a blocked day, no active booking.
create or replace function slot_is_free(s availability_slots) returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select s.is_open and s.slot_start > now()
    and not exists (select 1 from blocked_days d where d.adviser_id = s.adviser_id
                    and d.day = (s.slot_start at time zone 'Asia/Kuala_Lumpur')::date)
    and not exists (select 1 from bookings b where b.slot_id = s.id and b.status in ('requested','accepted','change_requested'))
$$;

-- Open times a student can request, with the adviser's name (students cannot read other profiles).
create or replace function open_slots(p_from timestamptz, p_to timestamptz, p_adviser uuid default null)
returns table (id uuid, adviser_id uuid, adviser_name text, slot_start timestamptz, minutes int)
language sql stable security definer set search_path = public, pg_temp as $$
  select s.id, s.adviser_id, p.full_name, s.slot_start, s.minutes
  from availability_slots s join profiles p on p.user_id = s.adviser_id
  where auth.uid() is not null and p.role = 'adviser'
    and (p_adviser is null or s.adviser_id = p_adviser)
    and s.slot_start >= greatest(p_from, now()) and s.slot_start < p_to
    and slot_is_free(s)
  order by s.slot_start, p.full_name
  limit 500
$$;

-- A7 slot claim. Idempotent on p_request_id: a retry returns the booking the first call made.
create or replace function claim_slot(p_slot uuid, p_topic text, p_note text, p_shared text[], p_request_id uuid)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare s availability_slots; b bookings;
begin
  if app_role() <> 'student' or not is_unlocked() then raise exception 'not_allowed' using errcode = '42501'; end if;

  select * into b from bookings where request_id = p_request_id;
  if found then
    if b.student_id <> auth.uid() then raise exception 'not_allowed' using errcode = '42501'; end if;
    select * into s from availability_slots where availability_slots.id = b.slot_id;
    return jsonb_build_object('booking_id', b.id, 'adviser_id', s.adviser_id, 'slot_start', s.slot_start,
                              'minutes', s.minutes, 'replayed', true);
  end if;

  select * into s from availability_slots where availability_slots.id = p_slot for update;
  if not found then raise exception 'not_found' using errcode = 'P0002'; end if;
  if exists (select 1 from bookings x where x.slot_id = s.id and x.status in ('requested','accepted','change_requested')) then
    raise exception 'slot_taken' using errcode = 'P0001';
  end if;
  if not slot_is_free(s) then raise exception 'slot_closed' using errcode = 'P0001'; end if;

  begin
    insert into bookings (student_id, slot_id, topic, note, shared_items, request_id)
    values (auth.uid(), s.id, p_topic, nullif(trim(p_note), ''), coalesce(p_shared, '{}'), p_request_id)
    returning * into b;
  exception when unique_violation then
    -- Same request id committed by a parallel retry, or the one-active-booking index fired.
    select * into b from bookings where request_id = p_request_id and student_id = auth.uid();
    if found then
      return jsonb_build_object('booking_id', b.id, 'adviser_id', s.adviser_id, 'slot_start', s.slot_start,
                                'minutes', s.minutes, 'replayed', true);
    end if;
    raise exception 'slot_taken' using errcode = 'P0001';
  end;
  insert into booking_status_history (booking_id, status, changed_by) values (b.id, 'requested', auth.uid());
  return jsonb_build_object('booking_id', b.id, 'adviser_id', s.adviser_id, 'slot_start', s.slot_start,
                            'minutes', s.minutes, 'replayed', false);
end $$;

-- Student moves an active booking to another free time. The adviser of the new time has to accept again
-- (status requested, or change_requested if it had been accepted).
create or replace function move_booking(p_booking uuid, p_slot uuid)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare b bookings; old_s availability_slots; new_s availability_slots; new_status booking_state;
begin
  select * into b from bookings where bookings.id = p_booking and student_id = auth.uid() for update;
  if not found then raise exception 'not_found' using errcode = 'P0002'; end if;
  if b.status not in ('requested','accepted','change_requested') then raise exception 'bad_status' using errcode = 'P0001'; end if;
  select * into old_s from availability_slots where availability_slots.id = b.slot_id;
  if old_s.slot_start <= now() then raise exception 'too_late' using errcode = 'P0001'; end if;
  if p_slot = b.slot_id then
    return jsonb_build_object('booking_id', b.id, 'old_adviser_id', old_s.adviser_id, 'old_start', old_s.slot_start,
      'adviser_id', old_s.adviser_id, 'slot_start', old_s.slot_start, 'minutes', old_s.minutes, 'status', b.status, 'changed', false);
  end if;

  select * into new_s from availability_slots where availability_slots.id = p_slot for update;
  if not found then raise exception 'not_found' using errcode = 'P0002'; end if;
  if exists (select 1 from bookings x where x.slot_id = new_s.id and x.status in ('requested','accepted','change_requested')) then
    raise exception 'slot_taken' using errcode = 'P0001';
  end if;
  if not slot_is_free(new_s) then raise exception 'slot_closed' using errcode = 'P0001'; end if;

  -- Analysis 4.11: a request stays a request; an accepted booking that moves waits as change_requested.
  new_status := case when b.status = 'requested' then 'requested'::booking_state else 'change_requested'::booking_state end;
  begin
    update bookings set slot_id = new_s.id, status = new_status, adviser_note = null where bookings.id = b.id;
  exception when unique_violation then
    raise exception 'slot_taken' using errcode = 'P0001';
  end;
  insert into booking_status_history (booking_id, status, changed_by) values (b.id, new_status, auth.uid());
  return jsonb_build_object('booking_id', b.id, 'old_adviser_id', old_s.adviser_id, 'old_start', old_s.slot_start,
    'adviser_id', new_s.adviser_id, 'slot_start', new_s.slot_start, 'minutes', new_s.minutes, 'status', new_status, 'changed', true);
end $$;

-- Student cancels an active booking before it starts; the time becomes free again.
create or replace function cancel_booking(p_booking uuid)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare b bookings; s availability_slots;
begin
  select * into b from bookings where bookings.id = p_booking and student_id = auth.uid() for update;
  if not found then raise exception 'not_found' using errcode = 'P0002'; end if;
  if b.status = 'cancelled' then
    select * into s from availability_slots where availability_slots.id = b.slot_id;
    return jsonb_build_object('booking_id', b.id, 'adviser_id', s.adviser_id, 'slot_start', s.slot_start, 'changed', false);
  end if;
  if b.status not in ('requested','accepted','change_requested') then raise exception 'bad_status' using errcode = 'P0001'; end if;
  select * into s from availability_slots where availability_slots.id = b.slot_id;
  if s.slot_start <= now() then raise exception 'too_late' using errcode = 'P0001'; end if;
  update bookings set status = 'cancelled' where bookings.id = b.id;
  insert into booking_status_history (booking_id, status, changed_by) values (b.id, 'cancelled', auth.uid());
  return jsonb_build_object('booking_id', b.id, 'adviser_id', s.adviser_id, 'slot_start', s.slot_start, 'changed', true);
end $$;

-- Adviser accepts or declines a request on one of their own times. A decline withdraws the shared items.
create or replace function respond_booking(p_booking uuid, p_accept boolean, p_note text)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare b bookings; s availability_slots; new_status booking_state;
begin
  if app_role() <> 'adviser' then raise exception 'not_allowed' using errcode = '42501'; end if;
  if not has_current_undertaking(auth.uid()) then raise exception 'undertaking_required' using errcode = '42501'; end if;
  select bk.* into b from bookings bk join availability_slots sl on sl.id = bk.slot_id
   where bk.id = p_booking and sl.adviser_id = auth.uid() for update of bk;
  if not found then raise exception 'not_found' using errcode = 'P0002'; end if;
  select * into s from availability_slots where availability_slots.id = b.slot_id;
  new_status := case when p_accept then 'accepted'::booking_state else 'declined'::booking_state end;
  if b.status = new_status then
    return jsonb_build_object('booking_id', b.id, 'student_id', b.student_id, 'slot_start', s.slot_start,
                              'minutes', s.minutes, 'status', b.status, 'changed', false);
  end if;
  if b.status not in ('requested','change_requested') then raise exception 'bad_status' using errcode = 'P0001'; end if;
  if s.slot_start <= now() then raise exception 'too_late' using errcode = 'P0001'; end if;

  update bookings set status = new_status,
         adviser_note = nullif(trim(p_note), ''),
         shared_items = case when p_accept then shared_items else '{}' end
   where bookings.id = b.id;
  insert into booking_status_history (booking_id, status, changed_by) values (b.id, new_status, auth.uid());
  return jsonb_build_object('booking_id', b.id, 'student_id', b.student_id, 'slot_start', s.slot_start,
                            'minutes', s.minutes, 'status', new_status, 'changed', true);
end $$;

-- Adviser feedback after the session. A booking counts as completed once it was accepted and its time
-- has ended; the first feedback marks it completed. Sending again replaces the text.
create or replace function send_feedback(p_booking uuid, p_text text)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare b bookings; s availability_slots; first_time boolean;
begin
  if app_role() <> 'adviser' then raise exception 'not_allowed' using errcode = '42501'; end if;
  if not has_current_undertaking(auth.uid()) then raise exception 'undertaking_required' using errcode = '42501'; end if;
  select bk.* into b from bookings bk join availability_slots sl on sl.id = bk.slot_id
   where bk.id = p_booking and sl.adviser_id = auth.uid() for update of bk;
  if not found then raise exception 'not_found' using errcode = 'P0002'; end if;
  select * into s from availability_slots where availability_slots.id = b.slot_id;
  if not (b.status = 'completed' or (b.status = 'accepted' and s.slot_start + make_interval(mins => s.minutes) <= now())) then
    raise exception 'not_completed' using errcode = 'P0001';
  end if;
  if b.status = 'accepted' then
    update bookings set status = 'completed' where bookings.id = b.id;
    insert into booking_status_history (booking_id, status, changed_by) values (b.id, 'completed', auth.uid());
  end if;
  first_time := not exists (select 1 from adviser_feedback f where f.booking_id = b.id);
  insert into adviser_feedback (booking_id, feedback_text) values (b.id, trim(p_text))
  on conflict (booking_id) do update set feedback_text = excluded.feedback_text, sent_at = now();
  return jsonb_build_object('booking_id', b.id, 'student_id', b.student_id, 'slot_start', s.slot_start, 'first_time', first_time);
end $$;

-- The signed-in student's bookings with time, adviser name and feedback (closed and past slots are
-- not readable through availability_slots RLS, so this reads them here).
create or replace function my_bookings()
returns table (id uuid, status booking_state, topic text, note text, shared_items text[], adviser_note text,
               slot_id uuid, slot_start timestamptz, minutes int, adviser_id uuid, adviser_name text,
               feedback_text text, feedback_sent_at timestamptz, created_at timestamptz)
language sql stable security definer set search_path = public, pg_temp as $$
  select b.id, b.status, b.topic, b.note, b.shared_items, b.adviser_note, s.id, s.slot_start, s.minutes,
         s.adviser_id, p.full_name, f.feedback_text, f.sent_at, b.created_at
  from bookings b join availability_slots s on s.id = b.slot_id
  join profiles p on p.user_id = s.adviser_id
  left join adviser_feedback f on f.booking_id = b.id
  where b.student_id = auth.uid()
  order by s.slot_start desc
  limit 200
$$;

-- Requests on the adviser's own times, for the Requests list: who, when, topic and which items were ticked.
-- The shared data itself comes only from open_request, which writes the audit row.
create or replace function adviser_requests()
returns table (id uuid, status booking_state, topic text, note text, shared_count int, student_name text,
               education_level edu_level, slot_start timestamptz, minutes int, has_feedback boolean, created_at timestamptz,
               student_id uuid, programme text, semester smallint, shared_items text[])
language plpgsql stable security definer set search_path = public, pg_temp as $$
begin
  if app_role() <> 'adviser' then raise exception 'not_allowed' using errcode = '42501'; end if;
  if not has_current_undertaking(auth.uid()) then raise exception 'undertaking_required' using errcode = '42501'; end if;
  return query
  select b.id, b.status, b.topic, b.note, cardinality(b.shared_items), p.full_name, p.education_level,
         s.slot_start, s.minutes, exists (select 1 from adviser_feedback f where f.booking_id = b.id), b.created_at,
         b.student_id, p.programme, p.semester, b.shared_items
  from bookings b join availability_slots s on s.id = b.slot_id
  join profiles p on p.user_id = b.student_id
  where s.adviser_id = auth.uid() and s.slot_start > now() - interval '30 days'
  order by (b.status in ('requested','change_requested')) desc, s.slot_start
  limit 200;
end $$;

-- Slot ids among the given ones that hold an active booking, so Availability keeps them as they are.
create or replace function my_booked_slots(p_slots uuid[])
returns setof uuid language sql stable security definer set search_path = public, pg_temp as $$
  select distinct b.slot_id from bookings b join availability_slots s on s.id = b.slot_id
  where s.adviser_id = auth.uid() and b.slot_id = any(p_slots) and b.status in ('requested','accepted','change_requested')
$$;

revoke all on function slot_is_free(availability_slots), open_slots(timestamptz, timestamptz, uuid),
  claim_slot(uuid, text, text, text[], uuid), move_booking(uuid, uuid), cancel_booking(uuid),
  respond_booking(uuid, boolean, text), send_feedback(uuid, text), my_bookings(), adviser_requests(),
  my_booked_slots(uuid[]) from public, anon;
revoke all on function slot_is_free(availability_slots) from authenticated;
grant execute on function open_slots(timestamptz, timestamptz, uuid), claim_slot(uuid, text, text, text[], uuid),
  move_booking(uuid, uuid), cancel_booking(uuid), respond_booking(uuid, boolean, text), send_feedback(uuid, text),
  my_bookings(), adviser_requests(), my_booked_slots(uuid[]) to authenticated;
