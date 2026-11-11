-- Booking and adviser functions (migration 000005, A7, analysis 4.11). The backend engineer's original
-- checks, in pgTAP form. Runs with `supabase test db` or supabase/tests/local/run.sh.
begin;
select plan(45);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'adv@test.local'), ('00000000-0000-0000-0000-00000000000b', 'aina@test.local'),
  ('00000000-0000-0000-0000-00000000000c', 'dan@test.local'), ('00000000-0000-0000-0000-00000000000d', 'locked@test.local');
insert into public.profiles (user_id, role, full_name, account_locked, programme, semester) values
  ('00000000-0000-0000-0000-00000000000a', 'adviser', 'Pn. Nurul Huda', false, null, null),
  ('00000000-0000-0000-0000-00000000000b', 'student', 'Aina Rahman', false, 'Software Engineering', 5),
  ('00000000-0000-0000-0000-00000000000c', 'student', 'Daniel Lim', false, 'Software Engineering', 4),
  ('00000000-0000-0000-0000-00000000000d', 'student', 'Hana Yusof', true, null, null);
insert into public.availability_slots (id, adviser_id, slot_start, minutes) values
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000000a', now() + interval '2 days', 30),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-00000000000a', now() + interval '3 days', 30),
  ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-00000000000a', now() - interval '2 hours', 30),
  ('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-00000000000a', now() + interval '4 days', 60),
  ('10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-00000000000a', now() + interval '5 days', 30);
insert into public.blocked_days (adviser_id, day, reason) values
  ('00000000-0000-0000-0000-00000000000a', ((now() + interval '4 days') at time zone 'Asia/Kuala_Lumpur')::date, 'Industry visit');

-- Aina
set local request.jwt.claims to '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated","app_metadata":{"role":"student"}}';
set local role authenticated;
select is((select count(*)::int from public.open_slots(now(), now() + interval '30 days')), 3, 'open_slots hides past and blocked-day times');
select is((select adviser_name from public.open_slots(now(), now() + interval '30 days') limit 1), 'Pn. Nurul Huda', 'open_slots carries the adviser name');
select is((public.claim_slot('10000000-0000-0000-0000-000000000001', 'Career matches', '', array['gap_progress'], '20000000-0000-0000-0000-000000000001') ->> 'replayed')::boolean,
  false, 'claim_slot books a free time');
select is((public.claim_slot('10000000-0000-0000-0000-000000000001', 'Career matches', '', array['gap_progress'], '20000000-0000-0000-0000-000000000001') ->> 'replayed')::boolean,
  true, 'claim_slot replay returns the same booking');
select is((select count(*)::int from public.bookings), 1, 'the replay did not create a second booking');
select is((select count(*)::int from public.booking_status_history), 1, 'one history row');
select is((select count(*)::int from public.open_slots(now(), now() + interval '30 days')), 2, 'a booked time is no longer open');
select throws_ok($$select public.claim_slot('10000000-0000-0000-0000-000000000003', 'x', null, '{}', gen_random_uuid())$$, 'P0001', 'slot_closed', 'a past time cannot be booked');
select throws_ok($$select public.claim_slot('10000000-0000-0000-0000-000000000004', 'x', null, '{}', gen_random_uuid())$$, 'P0001', 'slot_closed', 'a time on a blocked day cannot be booked');
select throws_ok($$select public.claim_slot(gen_random_uuid(), 'x', null, '{}', gen_random_uuid())$$, 'P0002', 'not_found', 'an unknown slot is not found');
select throws_ok($$select public.slot_is_free(s) from public.availability_slots s$$, '42501', null, 'slot_is_free is internal');
select is((select count(*)::int from public.my_bookings()), 1, 'my_bookings lists own booking');
reset role;

-- Daniel tries the same time, and replays Aina's request id
set local request.jwt.claims to '{"sub":"00000000-0000-0000-0000-00000000000c","role":"authenticated","app_metadata":{"role":"student"}}';
set local role authenticated;
select throws_ok($$select public.claim_slot('10000000-0000-0000-0000-000000000001', 'x', null, '{}', gen_random_uuid())$$, 'P0001', 'slot_taken', 'a taken time is refused');
select throws_ok($$select public.claim_slot('10000000-0000-0000-0000-000000000002', 'x', null, '{}', '20000000-0000-0000-0000-000000000001')$$, '42501', 'not_allowed', 'another student''s request id is refused');
select is((select count(*)::int from public.my_bookings()), 0, 'my_bookings shows only own rows');
select throws_ok($$select public.cancel_booking('00000000-0000-0000-0000-000000000099')$$, 'P0002', 'not_found', 'cancel of an unknown booking');
select throws_ok($$select public.move_booking((select b.id from public.bookings b), '10000000-0000-0000-0000-000000000005')$$, 'P0002', 'not_found', 'a student cannot move another student''s booking (invisible)');
reset role;

-- Locked student cannot book
set local request.jwt.claims to '{"sub":"00000000-0000-0000-0000-00000000000d","role":"authenticated","app_metadata":{"role":"student"}}';
set local role authenticated;
select throws_ok($$select public.claim_slot('10000000-0000-0000-0000-000000000002', 'x', null, '{}', gen_random_uuid())$$, '42501', 'not_allowed', 'a locked student cannot book');
reset role;

-- Adviser without, then with, the undertaking
set local request.jwt.claims to '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated","app_metadata":{"role":"adviser"}}';
set local role authenticated;
select throws_ok($$select * from public.adviser_requests()$$, '42501', 'undertaking_required', 'request list needs the undertaking');
select throws_ok($$select public.respond_booking((select '00000000-0000-0000-0000-000000000099'::uuid), true, null)$$, '42501', 'undertaking_required', 'responding needs the undertaking');
select lives_ok($$select public.accept_staff_undertaking()$$, 'adviser accepts the undertaking');
select is((select count(*)::int from public.adviser_requests()), 1, 'adviser_requests lists the request');
select is((select student_name from public.adviser_requests()), 'Aina Rahman', 'adviser_requests carries the student name');
select is((select programme from public.adviser_requests()), 'Software Engineering', 'and the programme');
select is((select count(*)::int from public.my_booked_slots(array['10000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000002']::uuid[])), 1,
  'my_booked_slots finds the booked time');
reset role;

-- Aina moves the request to slot 2
set local request.jwt.claims to '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated","app_metadata":{"role":"student"}}';
set local role authenticated;
select is(public.move_booking((select id from public.bookings limit 1), '10000000-0000-0000-0000-000000000002') ->> 'status', 'requested', 'moving a request keeps it requested');
select is((select count(*)::int from public.open_slots(now(), now() + interval '30 days')), 2, 'the old time is free again after the move');
select is((select slot_id from public.bookings limit 1), '10000000-0000-0000-0000-000000000002'::uuid, 'the booking points at the new slot');
reset role;

-- Adviser declines with a note: shared items withdrawn
set local request.jwt.claims to '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated","app_metadata":{"role":"adviser"}}';
set local role authenticated;
select is(public.respond_booking((select id from public.bookings limit 1), false, 'Can you do Friday?') ->> 'status', 'declined', 'adviser declines');
select is((select shared_items from public.bookings limit 1), '{}'::text[], 'a decline withdraws the shared items');
select is((select adviser_note from public.bookings limit 1), 'Can you do Friday?', 'a decline keeps the note');
select throws_ok($$select public.respond_booking((select id from public.bookings limit 1), true, null)$$, 'P0001', 'bad_status', 'a declined booking cannot be accepted');
select throws_ok($$select public.send_feedback((select id from public.bookings limit 1), 'Good')$$, 'P0001', 'not_completed', 'no feedback on a declined booking');
reset role;

-- Aina cannot cancel a declined booking; books again; adviser accepts; she moves it (change_requested)
set local request.jwt.claims to '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated","app_metadata":{"role":"student"}}';
set local role authenticated;
select throws_ok($$select public.cancel_booking((select id from public.bookings limit 1))$$, 'P0001', 'bad_status', 'a declined booking cannot be cancelled');
select is((public.claim_slot('10000000-0000-0000-0000-000000000001', 'Study plan', null, array['study_plan'], '20000000-0000-0000-0000-000000000002') ->> 'replayed')::boolean,
  false, 'second booking');
reset role;
set local request.jwt.claims to '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated","app_metadata":{"role":"adviser"}}';
set local role authenticated;
select is(public.respond_booking((select id from public.bookings where request_id = '20000000-0000-0000-0000-000000000002'), true, null) ->> 'status', 'accepted', 'adviser accepts');
reset role;
set local request.jwt.claims to '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated","app_metadata":{"role":"student"}}';
set local role authenticated;
select is(public.move_booking((select id from public.bookings where request_id = '20000000-0000-0000-0000-000000000002'), '10000000-0000-0000-0000-000000000005') ->> 'status',
  'change_requested', 'moving an accepted booking makes it change_requested');
reset role;
set local request.jwt.claims to '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated","app_metadata":{"role":"adviser"}}';
set local role authenticated;
select is(public.respond_booking((select id from public.bookings where request_id = '20000000-0000-0000-0000-000000000002'), true, null) ->> 'status', 'accepted', 'adviser accepts the new time');
reset role;

-- The session ends: feedback completes the booking, and can be replaced
update public.availability_slots set slot_start = now() - interval '3 hours' where id = '10000000-0000-0000-0000-000000000005';
set local request.jwt.claims to '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated","app_metadata":{"role":"adviser"}}';
set local role authenticated;
select is((public.send_feedback((select id from public.bookings where request_id = '20000000-0000-0000-0000-000000000002'), ' Practise Git. ') ->> 'first_time')::boolean,
  true, 'feedback on an ended session');
select is((select status::text from public.bookings where request_id = '20000000-0000-0000-0000-000000000002'), 'completed', 'feedback marks the booking completed');
select is((public.send_feedback((select id from public.bookings where request_id = '20000000-0000-0000-0000-000000000002'), 'Edited') ->> 'first_time')::boolean,
  false, 'feedback can be replaced');
reset role;
set local request.jwt.claims to '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated","app_metadata":{"role":"student"}}';
set local role authenticated;
select is((select feedback_text from public.my_bookings() where status = 'completed'), 'Edited', 'the student reads feedback in my_bookings');
select throws_ok($$select public.cancel_booking((select id from public.bookings where request_id = '20000000-0000-0000-0000-000000000002'))$$, 'P0001', 'bad_status', 'a completed booking cannot be cancelled');
select throws_ok($$select public.respond_booking((select id from public.bookings limit 1), true, null)$$, '42501', 'not_allowed', 'a student cannot respond to bookings');
reset role;

-- anon
set local request.jwt.claims to '{"role":"anon"}';
set local role anon;
select throws_ok($$select * from public.open_slots(now(), now() + interval '1 day')$$, '42501', null, 'anon cannot list open times');
reset role;

select * from finish();
rollback;
