-- Exact new-slot save and discovery path, including stale adviser metadata.
begin;
select plan(8);
insert into auth.users(id,email) values
 ('40000000-0000-4000-8000-000000000001','calendar-adviser@example.test'),
 ('40000000-0000-4000-8000-000000000002','calendar-student@example.test');
insert into public.profiles(user_id,role,full_name,is_under_18,account_locked) values
 ('40000000-0000-4000-8000-000000000001','adviser','Calendar Adviser',false,false),
 ('40000000-0000-4000-8000-000000000002','student','Calendar Student',false,false);
set local role authenticated;
set local request.jwt.claims to '{"sub":"40000000-0000-4000-8000-000000000001","role":"authenticated","app_metadata":{"role":"student"}}';
select is(public.app_role(),'adviser','refresh resolves provisioned adviser role');
select public.accept_staff_undertaking();
insert into public.availability_slots(adviser_id,slot_start,minutes,is_open)
 values(auth.uid(),now()+interval '2 days',30,true)
 on conflict(adviser_id,slot_start) do nothing;
select is((select count(*)::int from public.availability_slots where adviser_id=auth.uid() and is_open),1,'adviser reload finds saved slot');
set local request.jwt.claims to '{"sub":"40000000-0000-4000-8000-000000000002","role":"authenticated","app_metadata":{"role":"student"}}';
select is(public.app_role(),'student','second session resolves student');
select is((select count(*)::int from public.open_slots(now(),now()+interval '14 days','40000000-0000-4000-8000-000000000001')),1,'Book lists future slot within UI window');
select public.claim_slot((select id from public.open_slots(now(),now()+interval '14 days','40000000-0000-4000-8000-000000000001')), 'Career matches','calendar-test','{}',gen_random_uuid());
select is((select status::text from public.my_bookings()),'requested','student sees requested status');
select is((select count(*)::int from public.open_slots(now(),now()+interval '14 days','40000000-0000-4000-8000-000000000001')),0,'claimed slot disappears');
set local request.jwt.claims to '{"sub":"40000000-0000-4000-8000-000000000001","role":"authenticated","app_metadata":{"role":"student"}}';
select is((select count(*)::int from public.adviser_requests()),1,'request reaches adviser');
select public.respond_booking((select id from public.adviser_requests() limit 1),true,null);
set local request.jwt.claims to '{"sub":"40000000-0000-4000-8000-000000000002","role":"authenticated","app_metadata":{"role":"student"}}';
select is((select status::text from public.my_bookings()),'accepted','student sees adviser decision');
select * from finish();
rollback;
