create or replace function public.list_reviewers()
returns table(user_id uuid, role app_role, email text, created_at timestamptz)
language sql stable security definer set search_path = public
as $$
  select ur.user_id, ur.role, u.email::text, u.created_at
  from public.user_roles ur join auth.users u on u.id = ur.user_id
  where public.has_role(auth.uid(), 'admin') and ur.role in ('admin','moderator')
  order by u.created_at
$$;

create or replace function public.set_reviewer(_email text, _role app_role, _grant boolean)
returns text
language plpgsql security definer set search_path = public
as $$
declare _uid uuid;
begin
  if not public.has_role(auth.uid(), 'admin') then raise exception 'forbidden'; end if;
  if _role not in ('admin','moderator') then raise exception 'invalid role'; end if;
  select id into _uid from auth.users where lower(email) = lower(trim(_email));
  if _uid is null then return 'No account found with that email.'; end if;
  if _grant then
    insert into public.user_roles (user_id, role) values (_uid, _role) on conflict (user_id, role) do nothing;
    return 'ok';
  else
    if _uid = auth.uid() and _role = 'admin' then return 'You cannot remove your own admin access.'; end if;
    delete from public.user_roles where user_id = _uid and role = _role;
    return 'ok';
  end if;
end
$$;

revoke all on function public.list_reviewers() from public, anon;
revoke all on function public.set_reviewer(text, app_role, boolean) from public, anon;
grant execute on function public.list_reviewers() to authenticated;
grant execute on function public.set_reviewer(text, app_role, boolean) to authenticated;