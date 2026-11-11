-- pgTAP checks for row-level security (NFR-06). Run with: pnpm db:test
begin;
select plan(4);

select ok(
  (select bool_and(rowsecurity) from pg_tables where schemaname = 'public'),
  'RLS is on for every public table'
);
select has_function('public', 'open_request', array['uuid'], 'open_request exists');
select has_function('public', 'cohort_rows', 'cohort_rows exists');
select ok(
  not exists (select 1 from pg_policies where tablename in ('consents','audit_log') and cmd in ('UPDATE','DELETE')),
  'consents and audit_log have no update or delete policies'
);

select * from finish();
rollback;
