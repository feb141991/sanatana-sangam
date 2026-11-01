-- Rollback for: 20261101183000_fix_handle_new_user_username_truncation.sql
-- Restores previous handle_new_user() implementation from 20260826010000_fix_handle_new_user_null_full_name.sql

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
