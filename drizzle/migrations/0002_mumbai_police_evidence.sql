CREATE TABLE public.mumbai_crime_datasets (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 source_url text NOT NULL CHECK (source_url ~ '^https://([a-z0-9-]+\.)*mumbaipolice\.gov\.in/'),
 title text NOT NULL CHECK (length(title) BETWEEN 1 AND 240),
 period_start date NOT NULL,
 period_end date NOT NULL CHECK (period_end >= period_start),
 retrieved_at timestamptz NOT NULL DEFAULT now(),
 content_sha256 text NOT NULL CHECK (content_sha256 ~ '^[a-f0-9]{64}$'),
 completeness text NOT NULL DEFAULT 'partial' CHECK (completeness IN ('partial','complete')),
 coverage_geojson jsonb,
 methodology text NOT NULL,
 reviewed_at timestamptz,
 UNIQUE (source_url, content_sha256),
 CHECK (completeness <> 'complete' OR (coverage_geojson IS NOT NULL AND reviewed_at IS NOT NULL))
);
GRANT SELECT ON public.mumbai_crime_datasets TO authenticated;
GRANT ALL ON public.mumbai_crime_datasets TO service_role;
ALTER TABLE public.mumbai_crime_datasets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read reviewed police sources" ON public.mumbai_crime_datasets FOR SELECT TO authenticated USING (reviewed_at IS NOT NULL);
CREATE TABLE public.mumbai_crime_reports (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 dataset_id uuid NOT NULL REFERENCES public.mumbai_crime_datasets(id),
 source_record_id text NOT NULL CHECK (length(source_record_id) BETWEEN 1 AND 200),
 category text NOT NULL CHECK (category IN ('violence','harassment','robbery','theft','other')),
 occurred_on date,
 location_label text NOT NULL CHECK (length(location_label) BETWEEN 1 AND 240),
 location_precision text NOT NULL CHECK (location_precision IN ('street','area','police_station')),
 latitude double precision,
 longitude double precision,
 incident_count integer NOT NULL DEFAULT 1 CHECK (incident_count BETWEEN 1 AND 1000000),
 source_locator text NOT NULL CHECK (length(source_locator) BETWEEN 1 AND 240),
 UNIQUE(dataset_id, source_record_id),
 CHECK ((latitude IS NULL AND longitude IS NULL) OR (latitude BETWEEN 18.85 AND 19.55 AND longitude BETWEEN 72.7 AND 73.15)),
 CHECK (location_precision <> 'street' OR (latitude IS NOT NULL AND longitude IS NOT NULL AND occurred_on IS NOT NULL))
);
GRANT SELECT ON public.mumbai_crime_reports TO authenticated;
GRANT ALL ON public.mumbai_crime_reports TO service_role;
ALTER TABLE public.mumbai_crime_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read reviewed police records" ON public.mumbai_crime_reports FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.mumbai_crime_datasets d WHERE d.id = dataset_id AND d.reviewed_at IS NOT NULL));
CREATE INDEX mumbai_crime_reports_lookup ON public.mumbai_crime_reports(dataset_id, location_precision, occurred_on);
COMMENT ON TABLE public.mumbai_crime_reports IS 'Curated official police records only. No victim names, addresses or personal narratives. Station and area totals must never be located at police-station coordinates or used as street-level evidence.';
COMMENT ON TABLE public.mumbai_crime_datasets IS 'Privileged offline imports only. Complete requires curator-reviewed geographic coverage and reporting methodology; individual press reports are partial, never evidence of absence.';