-- Removes every demo account created by supabase/seed.sql (all use @demo.careerprep.test)
-- and, through ON DELETE CASCADE, their profiles, consents, progress, answers, bookings,
-- availability and feedback. Safe to run more than once. Run it in the Supabase SQL editor
-- on the production project if seed.sql was ever run there.
-- Reference data (jobs, skills, lessons) is not touched: production needs it.
begin;
delete from public.audit_log
 where accessor_id in (select id from auth.users where email like '%@demo.careerprep.test')
    or subject_id  in (select id from auth.users where email like '%@demo.careerprep.test');
delete from auth.users where email like '%@demo.careerprep.test';
select count(*) as demo_accounts_left from auth.users where email like '%@demo.careerprep.test';
commit;
