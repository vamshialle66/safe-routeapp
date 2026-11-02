CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

ALTER TABLE public.community_alerts DROP CONSTRAINT community_alerts_status_check;
ALTER TABLE public.community_alerts ADD CONSTRAINT community_alerts_status_check CHECK (status = ANY (ARRAY['draft','pending_review','approved','rejected']));
ALTER TABLE public.community_alerts ADD COLUMN moderated_at timestamptz, ADD COLUMN moderated_by uuid, ADD COLUMN moderator_note text CHECK (moderator_note IS NULL OR char_length(moderator_note) <= 500);

CREATE POLICY "Moderators read submitted alerts" ON public.community_alerts FOR SELECT TO authenticated
  USING (status <> 'draft' AND (public.has_role(auth.uid(), 'moderator') OR public.has_role(auth.uid(), 'admin')));

CREATE OR REPLACE FUNCTION public.moderate_alert(_id uuid, _decision text, _note text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT (public.has_role(auth.uid(), 'moderator') OR public.has_role(auth.uid(), 'admin')) THEN
    RAISE EXCEPTION 'Not allowed';
  END IF;
  IF _decision NOT IN ('approved', 'rejected') THEN RAISE EXCEPTION 'Invalid decision'; END IF;
  UPDATE public.community_alerts
    SET status = _decision, moderated_at = now(), moderated_by = auth.uid(), moderator_note = left(_note, 500)
    WHERE id = _id AND status IN ('pending_review', 'approved', 'rejected');
  IF NOT FOUND THEN RAISE EXCEPTION 'Alert not available for moderation'; END IF;
END $$;
REVOKE ALL ON FUNCTION public.moderate_alert(uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.moderate_alert(uuid, text, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.list_community_tips(_limit int DEFAULT 10)
RETURNS TABLE (id uuid, category text, urgency text, summary text, location_label text, approved_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id, category, urgency, summary, location_label, moderated_at
  FROM public.community_alerts WHERE status = 'approved'
  ORDER BY moderated_at DESC LIMIT least(greatest(_limit, 1), 50)
$$;
REVOKE ALL ON FUNCTION public.list_community_tips(int) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.list_community_tips(int) TO authenticated;