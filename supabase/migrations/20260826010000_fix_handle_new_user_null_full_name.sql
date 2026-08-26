-- Fixes a real signup-failure bug found while QA-verifying the consent
-- toggle: handle_new_user() inserted raw_user_meta_data->>'full_name'
-- into profiles.full_name unconditionally, but that column is NOT NULL.
-- Confirmed live via auth logs: "null value in column \"full_name\" of
-- relation \"profiles\" violates not-null constraint" (SQLSTATE 23502)
-- when a user is created without full_name metadata -- reachable in
-- production by Google/Apple OAuth sign-ins where the provider omits a
-- name (Apple's private-relay/anonymized sign-in in particular), not just
-- by the admin-API test account that surfaced it here.
--
-- Falls back to the same email-local-part derivation already used for
-- the username default, then to 'Seeker' if even that is empty (e.g. an
-- email of "@example.com" with nothing before the @, which split_part
-- would otherwise turn into an empty string).
--
-- Also fixes avatar_url for Google sign-ins: Google's OAuth metadata puts
-- the photo URL under 'picture', not 'avatar_url', so this previously
-- inserted NULL for every Google-originated profile. Coalesces both keys,
-- matching the same fallback now applied client-side in
-- src/lib/auth-profile.ts and src/app/(main)/layout.tsx, and backfills
-- existing profiles below -- guarded to only touch rows where avatar_url
-- is currently NULL, so no user-set avatar is ever overwritten.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  _username  text;
  _base      text;
  _counter   int := 0;
  _full_name text;
BEGIN
  _username := NEW.raw_user_meta_data->>'username';

  IF _username IS NULL OR _username = '' THEN
    _base := lower(regexp_replace(
      coalesce(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
      '[^a-z0-9]+', '_', 'g'
    ));
    _base := trim(both '_' from _base);
    IF _base = '' THEN _base := 'user'; END IF;

    _username := _base;

    WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = _username) LOOP
      _counter  := _counter + 1;
      _username := _base || '_' || _counter;
    END LOOP;
  END IF;

  _full_name := NEW.raw_user_meta_data->>'full_name';
  IF _full_name IS NULL OR trim(_full_name) = '' THEN
    _full_name := nullif(split_part(NEW.email, '@', 1), '');
  END IF;
  IF _full_name IS NULL OR trim(_full_name) = '' THEN
    _full_name := 'Seeker';
  END IF;

  INSERT INTO public.profiles (id, username, full_name, avatar_url)
  VALUES (
    NEW.id,
    _username,
    _full_name,
    coalesce(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture')
  );

  RETURN NEW;
END;
$function$;

-- Backfill existing profiles missing avatar_url where auth metadata contains one
UPDATE public.profiles p
SET avatar_url = coalesce(u.raw_user_meta_data->>'avatar_url', u.raw_user_meta_data->>'picture')
FROM auth.users u
WHERE p.id = u.id
  AND p.avatar_url IS NULL
  AND coalesce(u.raw_user_meta_data->>'avatar_url', u.raw_user_meta_data->>'picture') IS NOT NULL;
