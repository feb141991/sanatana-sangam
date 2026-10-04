-- Stop any future family-remembrance delivery before removing its contract.
UPDATE public.notification_candidates
SET status = 'cancelled', decision_reason = 'family_remembrance_feature_rollback',
    resolved_at = now(), updated_at = now()
WHERE event_type = 'family_remembrance' AND status IN ('pending', 'resolving');

UPDATE public.notification_schedule
SET status = 'cancelled', error = 'family_remembrance_feature_rollback'
WHERE notification_type = 'family_remembrance' AND status IN ('pending', 'sending');

-- Restore the pre-feature cadence exemption set.
CREATE OR REPLACE FUNCTION public.notification_is_budget_exempt(
  p_event_type TEXT,
  p_notification_key TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE SQL
IMMUTABLE
SET search_path = ''
AS $$
  SELECT public.canonical_notification_budget_type(p_event_type, p_notification_key) = ANY(ARRAY[
    'security', 'account', 'moderation', 'auth', 'transactional', 'critical_alert',
    'user_reminder', 'custom_reminder', 'explicit_request', 'user_sadhana_reminder',
    'sankalpa_midpoint', 'japa', 'brahma_muhurta', 'sandhya', 'nitya_madhyahn',
    'nitya_sandhya', 'ritual_window', 'pradosha_window', 'pradosha_kala',
    'ekadashi_parana', 'nitya', 'aarti', 'observance', 'festival', 'vrat', 'tithi',
    'observance_series', 'sankranti', 'sanskar_milestone'
  ]::TEXT[]);
$$;

REVOKE ALL ON FUNCTION public.notification_is_budget_exempt(TEXT, TEXT)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.notification_is_budget_exempt(TEXT, TEXT)
  TO service_role;

DROP TRIGGER IF EXISTS handle_family_remembrance_preference_change ON public.profiles;
DROP TRIGGER IF EXISTS validate_family_remembrance_candidate ON public.notification_candidates;
DROP TRIGGER IF EXISTS handle_kul_remembrance_membership_delete ON public.kul_members;
DROP TRIGGER IF EXISTS handle_kul_remembrance_calendar_change ON public.kuls;
DROP TRIGGER IF EXISTS guard_kul_calendar_remembrance_generation ON public.kuls;
DROP TRIGGER IF EXISTS guard_kul_event_remembrance_generation ON public.kul_events;
DROP TRIGGER IF EXISTS handle_kul_remembrance_member_change ON public.kul_family_members;
DROP TRIGGER IF EXISTS guard_kul_remembrance_generation ON public.kul_family_members;
DROP TRIGGER IF EXISTS handle_kul_remembrance_event_change ON public.kul_events;
DROP TRIGGER IF EXISTS validate_kul_death_anniversary_event ON public.kul_events;

DROP FUNCTION IF EXISTS public.handle_family_remembrance_preference_change();
DROP FUNCTION IF EXISTS public.validate_family_remembrance_candidate();
DROP FUNCTION IF EXISTS public.handle_kul_remembrance_membership_delete();
DROP FUNCTION IF EXISTS public.handle_kul_remembrance_calendar_change();
DROP FUNCTION IF EXISTS public.guard_kul_calendar_remembrance_generation();
DROP FUNCTION IF EXISTS public.guard_kul_event_remembrance_generation();
DROP FUNCTION IF EXISTS public.handle_kul_remembrance_member_change();
DROP FUNCTION IF EXISTS public.guard_kul_remembrance_generation();
DROP FUNCTION IF EXISTS public.handle_kul_remembrance_event_change();
DROP FUNCTION IF EXISTS public.cancel_family_remembrance_for_user(uuid);
DROP FUNCTION IF EXISTS public.cancel_family_remembrance_for_kul(uuid);
DROP FUNCTION IF EXISTS public.cancel_family_remembrance_for_event(uuid);
DROP FUNCTION IF EXISTS public.validate_kul_death_anniversary_event();

DROP INDEX IF EXISTS public.idx_profiles_family_remembrance_opted_in;
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_family_remembrance_time_check,
  DROP CONSTRAINT IF EXISTS profiles_family_remembrance_generation_check,
  DROP COLUMN IF EXISTS wants_family_remembrance_reminders,
  DROP COLUMN IF EXISTS family_remembrance_time,
  DROP COLUMN IF EXISTS family_remembrance_opt_in_generation;
ALTER TABLE public.kul_family_members
  DROP CONSTRAINT IF EXISTS kul_family_members_remembrance_generation_check,
  DROP COLUMN IF EXISTS remembrance_generation;
ALTER TABLE public.kul_events
  DROP CONSTRAINT IF EXISTS kul_events_remembrance_generation_check,
  DROP COLUMN IF EXISTS remembrance_generation;
ALTER TABLE public.kuls
  DROP CONSTRAINT IF EXISTS kuls_remembrance_generation_check,
  DROP COLUMN IF EXISTS remembrance_generation;
