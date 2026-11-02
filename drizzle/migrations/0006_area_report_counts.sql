create or replace function public.area_report_counts(_limit integer default 8)
returns table(location_label text, reports bigint, latest_at timestamptz)
language sql stable security definer set search_path = public
as $$
  select location_label, count(*) as reports, max(moderated_at) as latest_at
  from public.community_alerts
  where status = 'approved'
  group by location_label
  order by reports desc, latest_at desc
  limit greatest(1, least(_limit, 50))
$$;

revoke all on function public.area_report_counts(integer) from public, anon;
grant execute on function public.area_report_counts(integer) to authenticated;