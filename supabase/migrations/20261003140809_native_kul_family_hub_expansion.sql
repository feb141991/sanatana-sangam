-- Native KUL expansion: preserve shared family data through member deletion,
-- add private family lineage and tithi-date metadata, and connect family yatra
-- wishes to the canonical Tirtha catalog.

-- A KUL belongs to its members, not permanently to the account that created it.
ALTER TABLE public.kuls
  ALTER COLUMN created_by DROP NOT NULL;

ALTER TABLE public.kuls
  DROP CONSTRAINT IF EXISTS kuls_created_by_fkey;
ALTER TABLE public.kuls
  ADD CONSTRAINT kuls_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.kuls
  ADD COLUMN IF NOT EXISTS gotra text,
  ADD COLUMN IF NOT EXISTS pravara text,
  ADD COLUMN IF NOT EXISTS kuldevi_name text,
  ADD COLUMN IF NOT EXISTS kuldevta_name text,
  ADD COLUMN IF NOT EXISTS kuldevi_place_id text,
  ADD COLUMN IF NOT EXISTS kuldevta_place_id text,
  ADD COLUMN IF NOT EXISTS ancestral_origin text,
  ADD COLUMN IF NOT EXISTS kulachara_notes text,
  ADD COLUMN IF NOT EXISTS calendar_latitude double precision NOT NULL DEFAULT 23.1765,
  ADD COLUMN IF NOT EXISTS calendar_longitude double precision NOT NULL DEFAULT 75.7885,
  ADD COLUMN IF NOT EXISTS calendar_reference_label text NOT NULL DEFAULT 'Ujjain reference',
  ADD COLUMN IF NOT EXISTS calendar_timezone text NOT NULL DEFAULT 'Asia/Kolkata',
  ADD COLUMN IF NOT EXISTS calendar_month_system text NOT NULL DEFAULT 'amanta';

ALTER TABLE public.kuls
  ADD CONSTRAINT kuls_gotra_length_check CHECK (gotra IS NULL OR length(gotra) <= 120),
  ADD CONSTRAINT kuls_pravara_length_check CHECK (pravara IS NULL OR length(pravara) <= 240),
  ADD CONSTRAINT kuls_kuldevi_name_length_check CHECK (kuldevi_name IS NULL OR length(kuldevi_name) <= 120),
  ADD CONSTRAINT kuls_kuldevta_name_length_check CHECK (kuldevta_name IS NULL OR length(kuldevta_name) <= 120),
  ADD CONSTRAINT kuls_ancestral_origin_length_check CHECK (ancestral_origin IS NULL OR length(ancestral_origin) <= 160),
  ADD CONSTRAINT kuls_kulachara_notes_length_check CHECK (kulachara_notes IS NULL OR length(kulachara_notes) <= 2000),
  ADD CONSTRAINT kuls_calendar_latitude_check CHECK (calendar_latitude BETWEEN -90 AND 90),
  ADD CONSTRAINT kuls_calendar_longitude_check CHECK (calendar_longitude BETWEEN -180 AND 180),
  ADD CONSTRAINT kuls_calendar_reference_label_check CHECK (length(calendar_reference_label) BETWEEN 1 AND 100),
  ADD CONSTRAINT kuls_calendar_timezone_check CHECK (length(calendar_timezone) BETWEEN 1 AND 80),
  ADD CONSTRAINT kuls_calendar_month_system_check CHECK (calendar_month_system IN ('amanta', 'purnimanta'));

ALTER TABLE public.kuls
  ADD CONSTRAINT kuls_kuldevi_place_id_fkey FOREIGN KEY (kuldevi_place_id)
    REFERENCES public.tirtha_places(id) ON DELETE SET NULL,
  ADD CONSTRAINT kuls_kuldevta_place_id_fkey FOREIGN KEY (kuldevta_place_id)
    REFERENCES public.tirtha_places(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.kuls.gotra IS 'Private family lineage detail; never exposed in public/community surfaces.';
COMMENT ON COLUMN public.kuls.kulachara_notes IS 'Private family-entered custom notes; not used for AI or notification copy.';
COMMENT ON COLUMN public.kuls.calendar_timezone IS 'IANA timezone for resolving this family circle’s tithi dates.';

ALTER TABLE public.kul_events
  ADD COLUMN IF NOT EXISTS date_system text NOT NULL DEFAULT 'gregorian',
  ADD COLUMN IF NOT EXISTS masa smallint,
  ADD COLUMN IF NOT EXISTS paksha text,
  ADD COLUMN IF NOT EXISTS tithi smallint,
  ADD COLUMN IF NOT EXISTS month_system text,
  ADD COLUMN IF NOT EXISTS masa_is_adhika boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS tithi_resolution text NOT NULL DEFAULT 'sunrise';

ALTER TABLE public.kul_events
  ADD CONSTRAINT kul_events_date_system_check CHECK (date_system IN ('gregorian', 'tithi')),
  ADD CONSTRAINT kul_events_tithi_fields_check CHECK (
    (date_system = 'gregorian' AND masa IS NULL AND paksha IS NULL AND tithi IS NULL AND month_system IS NULL)
    OR
    (date_system = 'tithi' AND masa BETWEEN 1 AND 12 AND paksha IN ('shukla', 'krishna')
      AND tithi BETWEEN 1 AND 15 AND month_system IN ('amanta', 'purnimanta') AND recurring = true)
  ),
  ADD CONSTRAINT kul_events_tithi_resolution_check CHECK (tithi_resolution = 'sunrise');

COMMENT ON COLUMN public.kul_events.tithi_resolution IS 'This release supports only tithi active at local sunrise; it does not claim ritual muhurta selection.';

CREATE TABLE public.kul_tirtha_wishes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kul_id uuid NOT NULL REFERENCES public.kuls(id) ON DELETE CASCADE,
  place_id text NOT NULL REFERENCES public.tirtha_places(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'wishlist' CHECK (status IN ('wishlist', 'visited')),
  added_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  visited_at date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT kul_tirtha_wishes_kul_place_key UNIQUE (kul_id, place_id),
  CONSTRAINT kul_tirtha_wishes_visit_state_check CHECK (
    (status = 'wishlist' AND visited_at IS NULL)
    OR (status = 'visited' AND visited_at IS NOT NULL)
  ),
  CONSTRAINT kul_tirtha_wishes_notes_length_check CHECK (notes IS NULL OR length(notes) <= 500)
);

CREATE INDEX kul_tirtha_wishes_kul_status_created_idx
  ON public.kul_tirtha_wishes (kul_id, status, created_at DESC);

ALTER TABLE public.kul_tirtha_wishes ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.kul_tirtha_wishes FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.kul_tirtha_wishes TO authenticated;
GRANT ALL ON public.kul_tirtha_wishes TO service_role;

CREATE POLICY kul_tirtha_wishes_select ON public.kul_tirtha_wishes
  FOR SELECT TO authenticated USING (kul_id = public.auth_kul_id());
CREATE POLICY kul_tirtha_wishes_insert ON public.kul_tirtha_wishes
  FOR INSERT TO authenticated WITH CHECK (
    kul_id = public.auth_kul_id() AND added_by = auth.uid()
  );
CREATE POLICY kul_tirtha_wishes_update ON public.kul_tirtha_wishes
  FOR UPDATE TO authenticated USING (kul_id = public.auth_kul_id())
  WITH CHECK (kul_id = public.auth_kul_id());
CREATE POLICY kul_tirtha_wishes_delete ON public.kul_tirtha_wishes
  FOR DELETE TO authenticated USING (kul_id = public.auth_kul_id());

CREATE OR REPLACE FUNCTION public.preserve_kul_after_member_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_remaining_count integer;
  v_guardian_id uuid;
BEGIN
  PERFORM 1 FROM public.kuls WHERE id = OLD.kul_id FOR UPDATE;
  SELECT count(*) INTO v_remaining_count
  FROM public.kul_members
  WHERE kul_id = OLD.kul_id;

  IF v_remaining_count = 0 THEN
    -- The last member explicitly left or was deleted. The family space has no
    -- remaining owner, so deleting it and its private data is intentional.
    DELETE FROM public.kuls WHERE id = OLD.kul_id;
    RETURN OLD;
  END IF;

  SELECT user_id INTO v_guardian_id
  FROM public.kul_members
  WHERE kul_id = OLD.kul_id AND role = 'guardian'
  ORDER BY joined_at ASC, id ASC
  LIMIT 1;

  IF v_guardian_id IS NULL THEN
    SELECT user_id INTO v_guardian_id
    FROM public.kul_members
    WHERE kul_id = OLD.kul_id
    ORDER BY joined_at ASC, id ASC
    LIMIT 1;

    UPDATE public.kul_members
    SET role = 'guardian'
    WHERE kul_id = OLD.kul_id AND user_id = v_guardian_id;
  END IF;

  -- created_by is attribution, not authority; keep it attached to a current
  -- guardian so no stale/deleted creator can own the surviving shared hub.
  UPDATE public.kuls
  SET created_by = v_guardian_id
  WHERE id = OLD.kul_id AND created_by IS DISTINCT FROM v_guardian_id;

  RETURN OLD;
END;
$$;

REVOKE ALL ON FUNCTION public.preserve_kul_after_member_delete() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER trg_preserve_kul_after_member_delete
  AFTER DELETE ON public.kul_members
  FOR EACH ROW EXECUTE FUNCTION public.preserve_kul_after_member_delete();

CREATE OR REPLACE FUNCTION public.transfer_kul_guardian(p_target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_kul_id uuid;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT kul_id INTO v_kul_id FROM public.kul_members
  WHERE user_id = v_user_id AND role = 'guardian' FOR UPDATE;
  IF v_kul_id IS NULL THEN RAISE EXCEPTION 'Only a guardian can transfer this family circle'; END IF;
  PERFORM 1 FROM public.kuls WHERE id = v_kul_id FOR UPDATE;
  IF p_target_user_id IS NULL OR p_target_user_id = v_user_id OR NOT EXISTS (
    SELECT 1 FROM public.kul_members WHERE kul_id = v_kul_id AND user_id = p_target_user_id
  ) THEN RAISE EXCEPTION 'Choose another current family member'; END IF;

  UPDATE public.kul_members SET role = 'sadhak'
  WHERE kul_id = v_kul_id AND user_id = v_user_id;
  UPDATE public.kul_members SET role = 'guardian'
  WHERE kul_id = v_kul_id AND user_id = p_target_user_id;
  UPDATE public.kuls SET created_by = p_target_user_id WHERE id = v_kul_id;
END;
$$;

REVOKE ALL ON FUNCTION public.transfer_kul_guardian(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.transfer_kul_guardian(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.remove_kul_member(p_target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_kul_id uuid;
  v_target_role text;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT kul_id INTO v_kul_id FROM public.kul_members
  WHERE user_id = v_user_id AND role = 'guardian' FOR UPDATE;
  IF v_kul_id IS NULL THEN RAISE EXCEPTION 'Only a guardian can remove a family member'; END IF;
  PERFORM 1 FROM public.kuls WHERE id = v_kul_id FOR UPDATE;
  SELECT role INTO v_target_role FROM public.kul_members
  WHERE kul_id = v_kul_id AND user_id = p_target_user_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Family member was not found'; END IF;
  IF p_target_user_id = v_user_id OR v_target_role = 'guardian' THEN
    RAISE EXCEPTION 'Transfer guardianship before removing a guardian';
  END IF;

  DELETE FROM public.kul_members WHERE kul_id = v_kul_id AND user_id = p_target_user_id;
  UPDATE public.profiles SET kul_id = NULL WHERE id = p_target_user_id AND kul_id = v_kul_id;
END;
$$;

REVOKE ALL ON FUNCTION public.remove_kul_member(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.remove_kul_member(uuid) TO authenticated;
