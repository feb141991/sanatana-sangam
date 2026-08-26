-- Rollback for 20260826010000_fix_handle_new_user_null_full_name.sql
-- Restores handle_new_user() to its prior definition (full_name inserted
-- directly from raw_user_meta_data with no NULL fallback). Reverting
-- reintroduces the signup-failure bug this migration fixed.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  _username text;
  _base     text;
  _counter  int := 0;
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

  INSERT INTO public.profiles (id, username, full_name, avatar_url)
  VALUES (
    NEW.id,
    _username,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );

  RETURN NEW;
END;
$function$;
