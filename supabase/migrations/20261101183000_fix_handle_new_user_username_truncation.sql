-- Migration: 20261101183000_fix_handle_new_user_username_truncation.sql
-- Status: PREPARED
--
-- PURPOSE:
--   Fixes username truncation bug in handle_new_user() trigger where capital letters
--   in full_name or email local part were matched by [^a-z0-9]+ and replaced with underscores,
--   causing leading capital letters to be stripped (e.g., "Alex" -> "lex", "Emily Rose" -> "mily_ose").
--   Also backfills the existing profiles whose username matches the truncated bug pattern.
--
-- CAUSE & CONTEXT:
--   In migration 20260826010000_fix_handle_new_user_null_full_name.sql:
--     _base := lower(regexp_replace(
--       coalesce(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
--       '[^a-z0-9]+', '_', 'g'
--     ));
--   regexp_replace executed BEFORE lower(). The regex [^a-z0-9]+ only permitted lowercase characters,
--   so every uppercase character matched and was replaced by '_'. Then trim(both '_' from _base)
--   stripped leading underscores, dropping the first letter.
--
-- FIX:
--   Run lower() inside regexp_replace():
--     _base := regexp_replace(
--       lower(coalesce(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))),
--       '[^a-z0-9]+', '_', 'g'
--     );
--
-- ROLLBACK: supabase/rollbacks/20261101183000_fix_handle_new_user_username_truncation_rollback.sql

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
    _base := regexp_replace(
      lower(coalesce(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))),
      '[^a-z0-9]+', '_', 'g'
    );
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

-- Backfill: repair existing profiles whose auto-generated username was truncated by the bug
DO $backfill$
DECLARE
  rec RECORD;
  _new_username text;
  _base text;
  _counter int;
BEGIN
  FOR rec IN
    SELECT
      p.id,
      p.username AS current_username,
      trim(both '_' from regexp_replace(
        lower(coalesce(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1))),
        '[^a-z0-9]+', '_', 'g'
      )) AS intended_base
    FROM public.profiles p
    JOIN auth.users u ON p.id = u.id
    WHERE p.username = coalesce(
      nullif(trim(both '_' from lower(regexp_replace(
        coalesce(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1)),
        '[^a-z0-9]+', '_', 'g'
      ))), ''),
      'user'
    )
    AND coalesce(
      nullif(trim(both '_' from lower(regexp_replace(
        coalesce(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1)),
        '[^a-z0-9]+', '_', 'g'
      ))), ''),
      'user'
    ) IS DISTINCT FROM trim(both '_' from regexp_replace(
      lower(coalesce(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1))),
      '[^a-z0-9]+', '_', 'g'
    ))
  LOOP
    _base := nullif(rec.intended_base, '');
    IF _base IS NULL THEN
      _base := 'user';
    END IF;

    _new_username := _base;
    _counter := 0;

    WHILE EXISTS (
      SELECT 1 FROM public.profiles
      WHERE username = _new_username AND id != rec.id
    ) LOOP
      _counter := _counter + 1;
      _new_username := _base || '_' || _counter;
    END LOOP;

    UPDATE public.profiles
    SET username = _new_username
    WHERE id = rec.id;
  END LOOP;
END;
$backfill$;
