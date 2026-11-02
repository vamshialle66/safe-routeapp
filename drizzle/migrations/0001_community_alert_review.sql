CREATE TABLE public.community_alerts (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL,
 journey_id text NOT NULL,
 route_label text NOT NULL,
 location_label text NOT NULL,
 concern text NOT NULL CHECK (char_length(concern) BETWEEN 20 AND 2000),
 category text NOT NULL CHECK (category IN ('lighting','harassment','obstruction','suspicious_activity','other')),
 urgency text NOT NULL CHECK (urgency IN ('informational','caution','urgent')),
 summary text NOT NULL CHECK (char_length(summary) BETWEEN 10 AND 500),
 status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','pending_review')),
 verification text NOT NULL DEFAULT 'unverified' CHECK (verification = 'unverified'),
 model text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 reviewed_at timestamptz
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.community_alerts TO authenticated;
GRANT ALL ON public.community_alerts TO service_role;
ALTER TABLE public.community_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read own alerts" ON public.community_alerts FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Create own unverified drafts" ON public.community_alerts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND status = 'draft' AND verification = 'unverified');
CREATE POLICY "Review own alerts" ON public.community_alerts FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id AND verification = 'unverified' AND status IN ('draft','pending_review'));
CREATE POLICY "Delete own alerts" ON public.community_alerts FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX community_alerts_owner_journey ON public.community_alerts (user_id, journey_id, created_at DESC);
CREATE TABLE public.ai_feature_state (
 feature text PRIMARY KEY,
 safe_message text NOT NULL,
 blocked_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.ai_feature_state TO service_role;
ALTER TABLE public.ai_feature_state ENABLE ROW LEVEL SECURITY;
COMMENT ON TABLE public.ai_feature_state IS 'Durable AI access blocks. Owner explicitly clears the feature row only after provider access or workspace billing/policy is restored.';