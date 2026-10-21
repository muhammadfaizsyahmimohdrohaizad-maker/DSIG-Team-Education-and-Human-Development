-- Run against a scratch database that has Supabase's auth schema and roles, after 0001_init.sql.
-- Every check raises if it fails, so the script stops at the first broken rule.
\set ON_ERROR_STOP 1
create or replace function pg_temp.as_user(uid uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub', coalesce(uid::text, ''), false);
  perform set_config('request.jwt.claims', json_build_object('sub', uid, 'role', case when uid is null then 'service_role' else 'authenticated' end)::text, false);
end $$;
create or replace function pg_temp.expect_error(q text, why text) returns void language plpgsql as $$
begin
  begin execute q; exception when others then return; end;
  raise exception 'expected an error: %', why;
end $$;

insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000000a', 'aina@x.test', '{"full_name":"Aina","semester":"5"}'),
  ('00000000-0000-0000-0000-00000000000b', 'hafiz@x.test', '{"full_name":"Hafiz","semester":"2"}'),
  ('00000000-0000-0000-0000-0000000000ad', 'rohana@x.test', '{"full_name":"Rohana"}'),
  ('00000000-0000-0000-0000-0000000000a1', 'inst@x.test', '{"full_name":"Institution"}');

-- Server (service role) makes staff.
select pg_temp.as_user(null); set role service_role;
update profiles set role = 'adviser', unit = 'Career Services' where id = '00000000-0000-0000-0000-0000000000ad';
update profiles set role = 'institution' where id = '00000000-0000-0000-0000-0000000000a1';
reset role;

-- Student A
select pg_temp.as_user('00000000-0000-0000-0000-00000000000a'); set role authenticated;
do $$ begin if (select count(*) from profiles) <> 1 then raise exception 'A should see only own profile'; end if; end $$;
select pg_temp.expect_error($q$update profiles set role = 'adviser' where id = auth.uid()$q$, 'role escalation');
update profiles set target_code = '2519-01' where id = auth.uid();
insert into consents (user_id, processing, ai_processing, booking_emails, adviser_visibility, notice_version)
  values (auth.uid(), true, true, true, true, 'draft-1');
insert into student_modules values (auth.uid(), 'BSE'), (auth.uid(), 'QAC');
insert into gap_ratings values (auth.uid(), 'report-test-findings', 2);
select pg_temp.expect_error($q$insert into student_modules values ('00000000-0000-0000-0000-00000000000b', 'BSE')$q$, 'write to another student');
do $$ begin if public.ensure_adviser() <> '00000000-0000-0000-0000-0000000000ad' then raise exception 'adviser not assigned'; end if; end $$;
do $$ begin if (select count(*) from profiles) <> 2 then raise exception 'A should see own adviser'; end if; end $$;
insert into bookings (student_id, adviser_id, slot, note) values (auth.uid(), public.my_adviser_id(), '2026-10-22T10:00', 'help');
select pg_temp.expect_error($q$insert into bookings (student_id, adviser_id, slot, status) values (auth.uid(), public.my_adviser_id(), '2026-10-22T10:00', 'accepted')$q$, 'self-accepted booking');
insert into interview_answers (student_id, question_id, text, feedback) values (auth.uid(), 'q1', 'my answer', '{"nextStep":"Add a result"}');
reset role;

-- Student B: sees nothing of A, no adviser visibility consent
select pg_temp.as_user('00000000-0000-0000-0000-00000000000b'); set role authenticated;
insert into consents (user_id, processing, ai_processing, booking_emails, adviser_visibility, notice_version)
  values (auth.uid(), true, false, false, false, 'draft-1');
do $$ begin
  if (select count(*) from student_modules) <> 0 then raise exception 'B sees A modules'; end if;
  if (select count(*) from bookings) <> 0 then raise exception 'B sees A bookings'; end if;
  if (select count(*) from interview_answers) <> 0 then raise exception 'B sees A answers'; end if;
end $$;
select public.ensure_adviser();
reset role;

-- Adviser before and after the undertaking
select pg_temp.as_user('00000000-0000-0000-0000-0000000000ad'); set role authenticated;
do $$ begin
  if (select count(*) from adviser_roster()) <> 0 then raise exception 'roster before NDA'; end if;
  if (select count(*) from bookings) <> 0 then raise exception 'bookings before NDA'; end if;
end $$;
select accept_staff_undertaking('draft-1');
do $$ begin
  if (select count(*) from adviser_roster()) <> 1 then raise exception 'roster should hold only A (B withheld visibility)'; end if;
  if (select feedback_summary from adviser_roster()) <> 'Add a result' then raise exception 'feedback summary'; end if;
  if (select count(*) from student_modules) <> 0 then raise exception 'adviser reads raw student tables'; end if;
  if (select count(*) from interview_answers) <> 0 then raise exception 'adviser reads answers'; end if;
end $$;
select pg_temp.expect_error($q$update bookings set note = 'changed'$q$, 'adviser edits note');
select pg_temp.expect_error($q$update bookings set status = 'completed'$q$, 'complete a request');
update bookings set status = 'accepted';
select pg_temp.expect_error($q$update bookings set status = 'cancelled'$q$, 'cancel without reason');
do $$ begin if not (select changed_since_viewed from bookings limit 1) then raise exception 'marker'; end if; end $$;
update profiles set target_code = 'x' where id = '00000000-0000-0000-0000-00000000000a'; -- RLS: matches no rows
do $$ begin if (select target_code from profiles where id = '00000000-0000-0000-0000-00000000000a') <> '2519-01' then raise exception 'adviser changed student'; end if; end $$;
reset role;

-- Student cancels the accepted booking
select pg_temp.as_user('00000000-0000-0000-0000-00000000000a'); set role authenticated;
update bookings set changed_since_viewed = false;
select pg_temp.expect_error($q$update bookings set status = 'completed'$q$, 'student completes');
update bookings set status = 'cancelled';
do $$ begin if (select cancelled_by from bookings) <> 'student' then raise exception 'cancelled_by'; end if; end $$;
reset role;

-- Institution: anonymous rows only after the undertaking
select pg_temp.as_user('00000000-0000-0000-0000-0000000000a1'); set role authenticated;
do $$ begin if (select count(*) from cohort_rows()) <> 0 then raise exception 'cohort before NDA'; end if; end $$;
select accept_staff_undertaking('draft-1');
do $$ begin if (select count(*) from cohort_rows()) <> 2 then raise exception 'cohort rows'; end if; end $$;
select pg_temp.expect_error($q$select * from adviser_roster() where (select count(*) from adviser_roster()) > 0 and 1/0 = 1$q$, 'sanity');
reset role;

-- Delete my data
select pg_temp.as_user('00000000-0000-0000-0000-00000000000a'); set role authenticated;
select delete_my_account();
reset role;
do $$ begin
  if exists (select 1 from auth.users where id = '00000000-0000-0000-0000-00000000000a') then raise exception 'auth user left'; end if;
  if exists (select 1 from student_modules where student_id = '00000000-0000-0000-0000-00000000000a') then raise exception 'rows left'; end if;
  if exists (select 1 from bookings where student_id = '00000000-0000-0000-0000-00000000000a') then raise exception 'bookings left'; end if;
end $$;
select 'ALL RLS CHECKS PASSED';
