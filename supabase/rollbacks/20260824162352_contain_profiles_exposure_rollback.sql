-- Roll back stage 1 only. Roll back stage 2 first if it was applied.

DROP TRIGGER IF EXISTS profiles_sync_public_projection ON public.profiles;
DROP FUNCTION IF EXISTS app_private.sync_public_profile();
DROP TABLE IF EXISTS public.public_profiles;
