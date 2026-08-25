-- P0 containment, stage 1: create and backfill a deliberately narrow identity
-- projection. The base-table lockdown is a separate migration so application
-- readers can be deployed before the legacy policy is removed.

CREATE TABLE public.public_profiles (
  id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  seva_score INTEGER NOT NULL DEFAULT 0,
  weekly_seva INTEGER NOT NULL DEFAULT 0,
  monthly_seva INTEGER NOT NULL DEFAULT 0,
  active_symbol_id TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.public_profiles IS
  'Allowlisted public identity and leaderboard projection. Never add sensitive profile fields without privacy review.';

ALTER TABLE public.public_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.public_profiles FORCE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read public profile projection"
  ON public.public_profiles
  FOR SELECT
  TO authenticated
  USING (true);

REVOKE ALL ON TABLE public.public_profiles FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.public_profiles TO authenticated;
GRANT ALL ON TABLE public.public_profiles TO service_role;

INSERT INTO public.public_profiles (
  id,
  username,
  avatar_url,
  bio,
  seva_score,
  weekly_seva,
  monthly_seva,
  active_symbol_id,
  updated_at
)
SELECT
  id,
  username,
  avatar_url,
  bio,
  COALESCE(seva_score, 0),
  COALESCE(weekly_seva, 0),
  COALESCE(monthly_seva, 0),
  active_symbol_id,
  now()
FROM public.profiles;

CREATE SCHEMA IF NOT EXISTS app_private;
REVOKE ALL ON SCHEMA app_private FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION app_private.sync_public_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.public_profiles (
    id,
    username,
    avatar_url,
    bio,
    seva_score,
    weekly_seva,
    monthly_seva,
    active_symbol_id,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.username,
    NEW.avatar_url,
    NEW.bio,
    COALESCE(NEW.seva_score, 0),
    COALESCE(NEW.weekly_seva, 0),
    COALESCE(NEW.monthly_seva, 0),
    NEW.active_symbol_id,
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    username = EXCLUDED.username,
    avatar_url = EXCLUDED.avatar_url,
    bio = EXCLUDED.bio,
    seva_score = EXCLUDED.seva_score,
    weekly_seva = EXCLUDED.weekly_seva,
    monthly_seva = EXCLUDED.monthly_seva,
    active_symbol_id = EXCLUDED.active_symbol_id,
    updated_at = EXCLUDED.updated_at;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION app_private.sync_public_profile() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER profiles_sync_public_projection
AFTER INSERT OR UPDATE OF username, avatar_url, bio, seva_score, weekly_seva, monthly_seva, active_symbol_id
ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION app_private.sync_public_profile();
