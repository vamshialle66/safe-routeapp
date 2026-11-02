CREATE TABLE public.shared_trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  share_code TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL,
  origin_label TEXT NOT NULL,
  destination_label TEXT NOT NULL,
  origin_lat DOUBLE PRECISION NOT NULL,
  origin_lng DOUBLE PRECISION NOT NULL,
  destination_lat DOUBLE PRECISION NOT NULL,
  destination_lng DOUBLE PRECISION NOT NULL,
  route_polyline TEXT,
  route_distance_meters INTEGER,
  route_duration_seconds INTEGER,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'arrived', 'ended')),
  current_lat DOUBLE PRECISION,
  current_lng DOUBLE PRECISION,
  last_update_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ
);
CREATE INDEX shared_trips_user_idx ON public.shared_trips (user_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shared_trips TO authenticated;
GRANT SELECT ON public.shared_trips TO anon;
GRANT ALL ON public.shared_trips TO service_role;
ALTER TABLE public.shared_trips ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner manages own trips" ON public.shared_trips FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Anyone with the link can watch active trips" ON public.shared_trips FOR SELECT TO anon USING (status = 'active');
ALTER PUBLICATION supabase_realtime ADD TABLE public.shared_trips;