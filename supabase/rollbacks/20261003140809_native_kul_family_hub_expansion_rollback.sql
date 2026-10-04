-- Rollback for 20261003140809_native_kul_family_hub_expansion.sql.
-- The shared-data retention behavior and nullable created_by are deliberately
-- retained: restoring ON DELETE CASCADE would reintroduce data loss when a
-- KUL creator deletes their account.

BEGIN;

-- This rollback removes user-entered family data. Refuse to run if the feature
-- has accumulated any data so an operator must export it or choose a forward
-- repair instead of silently discarding it.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.kul_tirtha_wishes LIMIT 1) THEN
    RAISE EXCEPTION 'KUL Tirtha wishes exist; export them before rolling back this migration';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.kuls
    WHERE gotra IS NOT NULL OR pravara IS NOT NULL OR kuldevi_name IS NOT NULL
      OR kuldevta_name IS NOT NULL OR kuldevi_place_id IS NOT NULL
      OR kuldevta_place_id IS NOT NULL OR ancestral_origin IS NOT NULL
      OR kulachara_notes IS NOT NULL
      OR calendar_latitude IS DISTINCT FROM 23.1765
      OR calendar_longitude IS DISTINCT FROM 75.7885
      OR calendar_reference_label IS DISTINCT FROM 'Ujjain reference'
      OR calendar_timezone IS DISTINCT FROM 'Asia/Kolkata'
      OR calendar_month_system IS DISTINCT FROM 'amanta'
    LIMIT 1
  ) THEN
    RAISE EXCEPTION 'KUL lineage or calendar settings exist; export them before rolling back this migration';
  END IF;
  IF EXISTS (SELECT 1 FROM public.kul_events WHERE date_system = 'tithi' LIMIT 1) THEN
    RAISE EXCEPTION 'Tithi family dates exist; export them before rolling back this migration';
  END IF;
END;
$$;

DROP FUNCTION IF EXISTS public.transfer_kul_guardian(uuid);
DROP FUNCTION IF EXISTS public.remove_kul_member(uuid);
DROP TRIGGER IF EXISTS trg_preserve_kul_after_member_delete ON public.kul_members;
DROP FUNCTION IF EXISTS public.preserve_kul_after_member_delete();

DROP TABLE IF EXISTS public.kul_tirtha_wishes;

ALTER TABLE public.kul_events
  DROP CONSTRAINT IF EXISTS kul_events_date_system_check,
  DROP CONSTRAINT IF EXISTS kul_events_tithi_fields_check,
  DROP CONSTRAINT IF EXISTS kul_events_tithi_resolution_check,
  DROP COLUMN IF EXISTS date_system,
  DROP COLUMN IF EXISTS masa,
  DROP COLUMN IF EXISTS paksha,
  DROP COLUMN IF EXISTS tithi,
  DROP COLUMN IF EXISTS month_system,
  DROP COLUMN IF EXISTS masa_is_adhika,
  DROP COLUMN IF EXISTS tithi_resolution;

ALTER TABLE public.kuls
  DROP CONSTRAINT IF EXISTS kuls_gotra_length_check,
  DROP CONSTRAINT IF EXISTS kuls_pravara_length_check,
  DROP CONSTRAINT IF EXISTS kuls_kuldevi_name_length_check,
  DROP CONSTRAINT IF EXISTS kuls_kuldevta_name_length_check,
  DROP CONSTRAINT IF EXISTS kuls_ancestral_origin_length_check,
  DROP CONSTRAINT IF EXISTS kuls_kulachara_notes_length_check,
  DROP CONSTRAINT IF EXISTS kuls_calendar_latitude_check,
  DROP CONSTRAINT IF EXISTS kuls_calendar_longitude_check,
  DROP CONSTRAINT IF EXISTS kuls_calendar_reference_label_check,
  DROP CONSTRAINT IF EXISTS kuls_calendar_timezone_check,
  DROP CONSTRAINT IF EXISTS kuls_calendar_month_system_check,
  DROP CONSTRAINT IF EXISTS kuls_kuldevi_place_id_fkey,
  DROP CONSTRAINT IF EXISTS kuls_kuldevta_place_id_fkey,
  DROP COLUMN IF EXISTS gotra,
  DROP COLUMN IF EXISTS pravara,
  DROP COLUMN IF EXISTS kuldevi_name,
  DROP COLUMN IF EXISTS kuldevta_name,
  DROP COLUMN IF EXISTS kuldevi_place_id,
  DROP COLUMN IF EXISTS kuldevta_place_id,
  DROP COLUMN IF EXISTS ancestral_origin,
  DROP COLUMN IF EXISTS kulachara_notes,
  DROP COLUMN IF EXISTS calendar_latitude,
  DROP COLUMN IF EXISTS calendar_longitude,
  DROP COLUMN IF EXISTS calendar_reference_label,
  DROP COLUMN IF EXISTS calendar_timezone,
  DROP COLUMN IF EXISTS calendar_month_system;

COMMIT;
