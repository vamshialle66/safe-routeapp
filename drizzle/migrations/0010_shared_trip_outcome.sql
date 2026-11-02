CREATE OR REPLACE FUNCTION public.get_shared_trip_outcome(_share_code text)
RETURNS TABLE(status text, traveler_name text, origin_label text, destination_label text, ended_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT t.status::text, t.traveler_name, t.origin_label, t.destination_label, t.ended_at
  FROM public.shared_trips t
  WHERE t.share_code = _share_code AND t.status IN ('arrived','ended')
    AND t.ended_at > now() - interval '24 hours'
  LIMIT 1
$$;
REVOKE ALL ON FUNCTION public.get_shared_trip_outcome(text) FROM public;
GRANT EXECUTE ON FUNCTION public.get_shared_trip_outcome(text) TO anon, authenticated;