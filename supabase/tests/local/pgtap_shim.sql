-- The few pgTAP functions our tests use, for machines without pgTAP (this sandbox has none).
-- With real pgTAP (supabase test db) this file is not loaded and the same test files run unchanged.
-- Functions live in schema tap; run.sh puts tap on the search_path.

create schema tap;
grant usage on schema tap to anon, authenticated, service_role;

create table tap.results (n int primary key, ok boolean not null, descr text);
create table tap.planned (n int);
grant select, insert on tap.results, tap.planned to anon, authenticated, service_role;

create function tap._record(pass boolean, descr text, diag text default null) returns text
language plpgsql as $$
declare k int;
begin
  insert into tap.results (n, ok, descr)
  values ((select coalesce(max(n), 0) + 1 from tap.results), coalesce(pass, false), descr) returning n into k;
  return case when coalesce(pass, false) then 'ok ' else 'not ok ' end || k || ' - ' || coalesce(descr, '')
         || case when not coalesce(pass, false) and diag is not null then E'\n#   ' || diag else '' end;
end $$;

create function tap.plan(int) returns text language sql as $$
  insert into tap.planned values ($1); select '1..' || $1;
$$;

create function tap.ok(boolean, text default '') returns text language sql as $$ select tap._record($1, $2) $$;

create function tap.is(anyelement, anyelement, text default '') returns text language sql as $$
  select tap._record($1 is not distinct from $2, $3, 'have: ' || coalesce($1::text, 'NULL') || '  want: ' || coalesce($2::text, 'NULL'))
$$;

create function tap.isnt(anyelement, anyelement, text default '') returns text language sql as $$
  select tap._record($1 is distinct from $2, $3, 'both: ' || coalesce($1::text, 'NULL'))
$$;

-- throws_ok(sql, errcode, errmsg, description): NULL errcode or errmsg means "any".
create function tap.throws_ok(sql text, errcode char(5), errmsg text, descr text) returns text
language plpgsql as $$
begin
  execute sql;
  return tap._record(false, descr, 'no exception raised');
exception when others then
  return tap._record((errcode is null or sqlstate = errcode) and (errmsg is null or sqlerrm = errmsg), descr,
                     'got ' || sqlstate || ': ' || sqlerrm);
end $$;

create function tap.lives_ok(sql text, descr text) returns text
language plpgsql as $$
begin
  execute sql;
  return tap._record(true, descr);
exception when others then
  return tap._record(false, descr, 'died ' || sqlstate || ': ' || sqlerrm);
end $$;

create function tap.has_function(name, name, name[], text) returns text language sql as $$
  select tap._record(exists (
    select 1 from pg_proc p where p.pronamespace = $1::regnamespace and p.proname = $2
      and (select coalesce(array_agg(format_type(t, null) order by i), '{}') from unnest(p.proargtypes) with ordinality u(t, i)) = $3::text[]
  ), $4)
$$;

create function tap.has_function(name, name, text) returns text language sql as $$
  select tap._record(exists (select 1 from pg_proc p where p.pronamespace = $1::regnamespace and p.proname = $2), $3)
$$;

-- Raises when any test failed or the count differs from the plan, so psql exits non-zero.
create function tap.finish() returns setof text language plpgsql as $$
declare failed int; ran int; want int;
begin
  select count(*) filter (where not ok), count(*) into failed, ran from tap.results;
  select max(n) into want from tap.planned;
  if failed > 0 or (want is not null and ran <> want) then
    raise exception '% of % tests failed (planned %)', failed, ran, want;
  end if;
  return next '# all ' || ran || ' tests passed';
end $$;

grant execute on all functions in schema tap to anon, authenticated, service_role;
