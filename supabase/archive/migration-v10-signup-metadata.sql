-- ─── Migration v10 — Persist signup metadata in handle_new_user ─────────────
-- Fixes profile data being lost when email confirmation is enabled.
-- The signup form now sends dharmic/profile fields in raw_user_meta_data,
-- and this trigger copies them into public.profiles as soon as auth.users is created.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_seeking text[] := ARRAY[]::text[];
BEGIN
  IF jsonb_typeof(NEW.raw_user_meta_data->'seeking') = 'array' THEN
    v_seeking := ARRAY(
      SELECT jsonb_array_elements_text(NEW.raw_user_meta_data->'seeking')
    );
  END IF;

  INSERT INTO public.profiles (
    id,
    full_name,
    username,
    tradition,
    neighbourhood,
    city,
    country,
    latitude,
    longitude,
    sampradaya,
    ishta_devata,
    spiritual_level,
    seeking,
    kul,
    gotra
  )
  VALUES (
    NEW.id,
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'full_name', ''), 'Sanatani'),
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'username', ''), 'user_' || substr(NEW.id::text, 1, 8)),
    NULLIF(NEW.raw_user_meta_data->>'tradition', ''),
    NULLIF(NEW.raw_user_meta_data->>'neighbourhood', ''),
    NULLIF(NEW.raw_user_meta_data->>'city', ''),
    NULLIF(NEW.raw_user_meta_data->>'country', ''),
    NULLIF(NEW.raw_user_meta_data->>'latitude', '')::double precision,
    NULLIF(NEW.raw_user_meta_data->>'longitude', '')::double precision,
    NULLIF(NEW.raw_user_meta_data->>'sampradaya', ''),
    NULLIF(NEW.raw_user_meta_data->>'ishta_devata', ''),
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'spiritual_level', ''), 'jigyasu'),
    v_seeking,
    NULLIF(NEW.raw_user_meta_data->>'kul', ''),
    NULLIF(NEW.raw_user_meta_data->>'gotra', '')
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
