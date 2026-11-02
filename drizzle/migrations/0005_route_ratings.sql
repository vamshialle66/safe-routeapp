create table public.route_ratings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  journey_id text not null,
  route_number integer not null,
  felt_safe boolean not null,
  created_at timestamptz not null default now(),
  unique (user_id, journey_id, route_number)
);

grant select, insert, update, delete on public.route_ratings to authenticated;
grant all on public.route_ratings to service_role;

alter table public.route_ratings enable row level security;

create policy "own ratings" on public.route_ratings for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function public.route_confidence(_journey_id text, _route_number integer)
returns table(safe_count bigint, total_count bigint)
language sql stable security definer set search_path = public
as $$
  select count(*) filter (where felt_safe), count(*)
  from public.route_ratings
  where journey_id = _journey_id and route_number = _route_number
$$;

revoke all on function public.route_confidence(text, integer) from public, anon;
grant execute on function public.route_confidence(text, integer) to authenticated;