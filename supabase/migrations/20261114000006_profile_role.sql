-- The profile role is provisioned by the signup server. Authenticated users
-- cannot update that column. Use it for both routing and row policies.
create or replace function public.app_role() returns text
language sql stable security definer set search_path = '' as $$
  select coalesce((select p.role::text from public.profiles p where p.user_id = auth.uid()), '')
$$;
