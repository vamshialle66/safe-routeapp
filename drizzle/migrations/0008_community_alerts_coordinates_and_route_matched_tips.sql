-- Store where a reported concern happened, so approved tips can be matched to routes.
ALTER TABLE public.community_alerts
  ADD COLUMN latitude double precision,
  ADD COLUMN longitude double precision;

COMMENT ON COLUMN public.community_alerts.latitude IS 'Optional latitude of the reported spot, captured from the route map. Tips without coordinates are never shown as route-matched.';
COMMENT ON COLUMN public.community_alerts.longitude IS 'Optional longitude of the reported spot, captured from the route map.';

-- Route-matched tips: when a route bounding box is given, only approved tips
-- inside it are returned; otherwise the latest approved tips are returned.
CREATE OR REPLACE FUNCTION public.list_community_tips(
  _limit integer DEFAULT 10,
  _min_lat double precision DEFAULT NULL,
  _min_lng double precision DEFAULT NULL,
  _max_lat double precision DEFAULT NULL,
  _max_lng double precision DEFAULT NULL
)
 RETURNS TABLE(id uuid, category text, urgency text, summary text, location_label text, approved_at timestamp with time zone)
 LANGUAGE sql
 STABLE
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT id, category, urgency, summary, location_label, moderated_at
  FROM public.community_alerts
  WHERE status = 'approved'
    AND (
      _min_lat IS NULL OR _min_lng IS NULL OR _max_lat IS NULL OR _max_lng IS NULL
      OR (
        latitude IS NOT NULL AND longitude IS NOT NULL
        AND latitude BETWEEN _min_lat AND _max_lat
        AND longitude BETWEEN _min_lng AND _max_lng
      )
    )
  ORDER BY moderated_at DESC
  LIMIT least(greatest(_limit, 1), 50)
$function$;