-- Name: advance_enrollment(uuid, uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.advance_enrollment(p_user_id uuid, p_path_id uuid) RETURNS jsonb
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
DECLARE
  v_enrollment    pathshala_enrollments%ROWTYPE;
  v_total_chunks  INT;
  v_next_position INT;
BEGIN
  -- Lock the enrollment row
  SELECT * INTO v_enrollment
    FROM pathshala_enrollments
   WHERE user_id = p_user_id AND path_id = p_path_id
     FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'enrollment_not_found');
  END IF;

  SELECT total_chunks INTO v_total_chunks
    FROM pathshala_paths WHERE id = p_path_id;

  v_next_position := v_enrollment.current_position + 1;

  IF v_next_position > v_total_chunks THEN
    -- Path complete
    UPDATE pathshala_enrollments
       SET current_position = v_total_chunks,
           completed_at     = NOW(),
           last_activity_at = NOW()
     WHERE user_id = p_user_id AND path_id = p_path_id;

    RETURN jsonb_build_object(
      'status',           'completed',
      'position',         v_total_chunks,
      'total_chunks',     v_total_chunks
    );
  ELSE
    UPDATE pathshala_enrollments
       SET current_position = v_next_position,
           last_activity_at = NOW()
     WHERE user_id = p_user_id AND path_id = p_path_id;

    RETURN jsonb_build_object(
      'status',           'advanced',
      'position',         v_next_position,
      'total_chunks',     v_total_chunks,
      'pct_complete',     ROUND(v_next_position::NUMERIC / v_total_chunks * 100, 1)
    );
  END IF;
END;
$$;


ALTER FUNCTION public.advance_enrollment(p_user_id uuid, p_path_id uuid) OWNER TO postgres;

--
-- Name: auth_kul_id(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.auth_kul_id() RETURNS uuid
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT kul_id FROM profiles WHERE id = auth.uid() LIMIT 1;
$$;


ALTER FUNCTION public.auth_kul_id() OWNER TO postgres;

--
-- Name: auth_kul_role(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.auth_kul_role() RETURNS text
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT role
  FROM   kul_members
  WHERE  user_id = auth.uid()
    AND  kul_id  = (SELECT kul_id FROM profiles WHERE id = auth.uid() LIMIT 1)
  LIMIT 1;
$$;


ALTER FUNCTION public.auth_kul_role() OWNER TO postgres;

--
-- Name: auto_assign_mandali(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.auto_assign_mandali() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_mandali_id UUID;
BEGIN
  -- Only run if city or country changed and both are set
  IF (NEW.city IS NOT NULL AND NEW.country IS NOT NULL)
    AND (OLD.city IS DISTINCT FROM NEW.city OR OLD.country IS DISTINCT FROM NEW.country)
  THEN
    v_mandali_id := public.find_or_create_mandali(NEW.city, NEW.country);
    NEW.mandali_id := v_mandali_id;
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION public.auto_assign_mandali() OWNER TO postgres;

--
-- Name: auto_assign_mandali_on_insert(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.auto_assign_mandali_on_insert() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_mandali_id UUID;
BEGIN
  IF NEW.city IS NOT NULL AND NEW.country IS NOT NULL THEN
    v_mandali_id := public.find_or_create_mandali(NEW.city, NEW.country);
    NEW.mandali_id := v_mandali_id;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.auto_assign_mandali_on_insert() OWNER TO postgres;

--
-- Name: award_badge_if_earned(uuid, text, jsonb); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.award_badge_if_earned(p_user_id uuid, p_badge_slug text, p_context jsonb DEFAULT '{}'::jsonb) RETURNS boolean
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
DECLARE
  v_badge_id UUID;
BEGIN
  SELECT id INTO v_badge_id FROM pathshala_badges WHERE slug = p_badge_slug;
  IF NOT FOUND THEN RETURN false; END IF;

  INSERT INTO pathshala_user_badges (user_id, badge_id, context)
    VALUES (p_user_id, v_badge_id, p_context)
    ON CONFLICT (user_id, badge_id) DO NOTHING;

  RETURN FOUND;
END;
$$;


ALTER FUNCTION public.award_badge_if_earned(p_user_id uuid, p_badge_slug text, p_context jsonb) OWNER TO postgres;

--
-- Name: award_karma(uuid, text, integer, date, integer, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.award_karma(p_user_id uuid, p_reason text, p_amount integer, p_date date, p_daily_cap integer, p_source_route text DEFAULT NULL::text) RETURNS json
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_daily_total INTEGER;
  v_new_total   INTEGER;
BEGIN
  -- Serialise concurrent awards for this user
  PERFORM id FROM profiles WHERE id = p_user_id FOR UPDATE;

  -- Per-reason deduplication
  IF EXISTS (
    SELECT 1 FROM karma_award_log
    WHERE user_id = p_user_id AND reason = p_reason AND awarded_date = p_date
  ) THEN
    RETURN json_build_object('status', 'already_awarded', 'karma_earned', 0, 'daily_total', 0);
  END IF;

  -- Daily cap check (now race-safe because of the FOR UPDATE above)
  SELECT COALESCE(SUM(amount), 0) INTO v_daily_total
  FROM karma_award_log
  WHERE user_id = p_user_id AND awarded_date = p_date;

  IF v_daily_total + p_amount > p_daily_cap THEN
    RETURN json_build_object('status', 'daily_cap_reached', 'karma_earned', 0, 'daily_total', v_daily_total);
  END IF;

  -- Record the award
  INSERT INTO karma_award_log (user_id, reason, amount, awarded_date)
  VALUES (p_user_id, p_reason, p_amount, p_date);

  -- Increment karma (same transaction — rolls back together if anything above fails)
  UPDATE profiles SET seva_score = seva_score + p_amount WHERE id = p_user_id;

  -- Ledger entry (audit trail, inside the same transaction)
  INSERT INTO karma_ledger (user_id, amount, reason, source_route)
  VALUES (p_user_id, p_amount, p_reason, p_source_route);

  v_new_total := v_daily_total + p_amount;
  RETURN json_build_object('status', 'ok', 'karma_earned', p_amount, 'daily_total', v_new_total);
END;
$$;


ALTER FUNCTION public.award_karma(p_user_id uuid, p_reason text, p_amount integer, p_date date, p_daily_cap integer, p_source_route text) OWNER TO postgres;

--
-- Name: create_kul(text, text, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.create_kul(p_name text, p_emoji text, p_invite_code text) RETURNS json
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_kul     kuls;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Guard: don't let someone in an existing kul create another
  IF EXISTS (SELECT 1 FROM profiles WHERE id = v_user_id AND kul_id IS NOT NULL) THEN
    RAISE EXCEPTION 'You are already in a Kul. Leave it first.';
  END IF;

  -- Guard: invite code must be unique
  IF EXISTS (SELECT 1 FROM kuls WHERE invite_code = p_invite_code) THEN
    RAISE EXCEPTION 'Invite code already taken — please try again.';
  END IF;

  -- Step 1: create the kul
  INSERT INTO kuls (name, avatar_emoji, invite_code, created_by)
  VALUES (p_name, p_emoji, p_invite_code, v_user_id)
  RETURNING * INTO v_kul;

  -- Step 2: creator becomes guardian
  INSERT INTO kul_members (kul_id, user_id, role)
  VALUES (v_kul.id, v_user_id, 'guardian');

  -- Step 3: link profile → kul (this is what auth_kul_id() reads)
  UPDATE profiles SET kul_id = v_kul.id WHERE id = v_user_id;

  RETURN row_to_json(v_kul);
END;
$$;


ALTER FUNCTION public.create_kul(p_name text, p_emoji text, p_invite_code text) OWNER TO postgres;

--
-- Name: export_user_data(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.export_user_data() RETURNS json
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_result  json;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT json_build_object(
    'exported_at', now(),
    'profile', (SELECT row_to_json(p) FROM profiles p WHERE id = v_user_id),
    'sadhana_sessions', (SELECT json_agg(s) FROM (SELECT * FROM mala_sessions WHERE user_id = v_user_id) s),
    'nitya_karma_logs', (SELECT json_agg(l) FROM (SELECT * FROM nitya_karma_logs WHERE user_id = v_user_id) l),
    'kul_memberships', (SELECT json_agg(m) FROM (SELECT * FROM kul_members WHERE user_id = v_user_id) m),
    'messages_sent', (SELECT json_agg(msg) FROM (SELECT * FROM kul_messages WHERE sender_id = v_user_id) msg),
    'quiz_responses', (SELECT json_agg(q) FROM (SELECT * FROM quiz_responses WHERE user_id = v_user_id) q),
    'notification_preferences', (SELECT row_to_json(n) FROM notification_preferences n WHERE user_id = v_user_id)
  ) INTO v_result;

  RETURN v_result;
END;
$$;


ALTER FUNCTION public.export_user_data() OWNER TO postgres;

--
-- Name: find_nearby_satsang_seekers(double precision, double precision, double precision, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.find_nearby_satsang_seekers(p_lat double precision, p_lon double precision, p_km double precision DEFAULT 10.0, p_limit integer DEFAULT 20) RETURNS TABLE(id uuid, full_name text, username text, avatar_url text, tradition text, sampradaya text, neighbourhood text, city text, distance_km double precision)
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT
    p.id,
    p.full_name,
    p.username,
    p.avatar_url,
    p.tradition,
    p.sampradaya,
    p.neighbourhood,
    p.city,
    -- Haversine distance in km
    ROUND(CAST(
      6371 * 2 * ASIN(SQRT(
        POWER(SIN(RADIANS((p.latitude  - p_lat) / 2)), 2) +
        COS(RADIANS(p_lat)) * COS(RADIANS(p.latitude)) *
        POWER(SIN(RADIANS((p.longitude - p_lon) / 2)), 2)
      ))
    AS NUMERIC), 1)::FLOAT AS distance_km
  FROM profiles p
  WHERE
    p.location_visible    = true
    AND p.looking_for_satsang = true
    AND p.latitude  IS NOT NULL
    AND p.longitude IS NOT NULL
    AND p.id != auth.uid()
    -- Bounding box pre-filter (fast, avoids full table scan)
    AND p.latitude  BETWEEN p_lat - (p_km / 111.0) AND p_lat + (p_km / 111.0)
    AND p.longitude BETWEEN p_lon - (p_km / (111.0 * COS(RADIANS(p_lat))))
                        AND p_lon + (p_km / (111.0 * COS(RADIANS(p_lat))))
  ORDER BY distance_km ASC
  LIMIT p_limit;
$$;


ALTER FUNCTION public.find_nearby_satsang_seekers(p_lat double precision, p_lon double precision, p_km double precision, p_limit integer) OWNER TO postgres;

--
-- Name: find_or_create_mandali(text, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.find_or_create_mandali(p_city text, p_country text) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_mandali_id UUID;
BEGIN
  -- Normalise input
  p_city    := TRIM(INITCAP(p_city));
  p_country := TRIM(UPPER(p_country));

  -- 1. Look for an existing Mandali for this city (case-insensitive)
  SELECT id INTO v_mandali_id
  FROM public.mandalis
  WHERE LOWER(city) = LOWER(p_city)
    AND LOWER(country) = LOWER(p_country)
  LIMIT 1;

  -- 2. If not found, create one automatically
  IF v_mandali_id IS NULL THEN
    INSERT INTO public.mandalis (name, city, country, latitude, longitude, radius_km)
    VALUES (
      p_city || ' Mandali',
      p_city,
      p_country,
      0,   -- lat/lng default to 0; updated later via geocoding or manually
      0,
      15   -- default 15km radius
    )
    RETURNING id INTO v_mandali_id;
  END IF;

  RETURN v_mandali_id;
END;
$$;


ALTER FUNCTION public.find_or_create_mandali(p_city text, p_country text) OWNER TO postgres;

--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'username',
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.handle_new_user() OWNER TO postgres;

--
-- Name: handle_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.handle_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;


ALTER FUNCTION public.handle_updated_at() OWNER TO postgres;

--
-- Name: increment_ai_chat_usage(uuid, date, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.increment_ai_chat_usage(p_user_id uuid, p_date date, p_limit integer) RETURNS json
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_new_count INTEGER;
  v_was_allowed BOOLEAN;
BEGIN
  INSERT INTO ai_chat_usage (user_id, usage_date, message_count)
  VALUES (p_user_id, p_date, 1)
  ON CONFLICT (user_id, usage_date)
  DO UPDATE SET message_count = ai_chat_usage.message_count + 1
  WHERE ai_chat_usage.message_count < p_limit
  RETURNING message_count INTO v_new_count;

  IF v_new_count IS NULL THEN
    -- Row exists but was already at limit — get current count
    SELECT message_count INTO v_new_count
    FROM ai_chat_usage
    WHERE user_id = p_user_id AND usage_date = p_date;
    v_was_allowed := FALSE;
  ELSE
    v_was_allowed := TRUE;
  END IF;

  RETURN json_build_object('new_count', v_new_count, 'was_allowed', v_was_allowed);
END;
$$;


ALTER FUNCTION public.increment_ai_chat_usage(p_user_id uuid, p_date date, p_limit integer) OWNER TO postgres;

--
-- Name: increment_karma(uuid, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.increment_karma(p_user_id uuid, p_amount integer) RETURNS void
    LANGUAGE sql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  UPDATE public.profiles
  SET seva_score = seva_score + p_amount
  WHERE id = p_user_id;
$$;


ALTER FUNCTION public.increment_karma(p_user_id uuid, p_amount integer) OWNER TO postgres;

--
-- Name: increment_period_seva(uuid, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.increment_period_seva(p_user_id uuid, p_points integer) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  UPDATE public.profiles
  SET seva_score   = COALESCE(seva_score, 0) + p_points,
      weekly_seva  = COALESCE(weekly_seva, 0) + p_points,
      monthly_seva = COALESCE(monthly_seva, 0) + p_points
  WHERE id = p_user_id;
END;
$$;


ALTER FUNCTION public.increment_period_seva(p_user_id uuid, p_points integer) OWNER TO postgres;

--
-- Name: increment_streak_freeze(uuid, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.increment_streak_freeze(p_user_id uuid, p_amount integer DEFAULT 1) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  next_count integer;
BEGIN
  UPDATE public.profiles
  SET streak_freeze_count = LEAST(3, GREATEST(0, COALESCE(streak_freeze_count, 0) + p_amount))
  WHERE id = p_user_id
  RETURNING streak_freeze_count INTO next_count;

  RETURN COALESCE(next_count, 0);
END;
$$;


ALTER FUNCTION public.increment_streak_freeze(p_user_id uuid, p_amount integer) OWNER TO postgres;

--
-- Name: is_kul_member_pro(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.is_kul_member_pro(p_user_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM   kul_members km
    JOIN   kuls         k  ON k.id = km.kul_id
    WHERE  km.user_id      = p_user_id
      AND  k.is_pro         = true
      AND  (k.pro_expires_at IS NULL OR k.pro_expires_at > now())
  );
$$;


ALTER FUNCTION public.is_kul_member_pro(p_user_id uuid) OWNER TO postgres;

--
-- Name: join_kul(text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.join_kul(p_invite_code text) RETURNS json
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_kul     kuls;
  v_existing_kul_id uuid;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- 1. Find the target kul by invite code
  SELECT * INTO v_kul FROM kuls WHERE invite_code = upper(trim(p_invite_code));
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Kul not found. Check the invite code and try again.';
  END IF;

  -- 2. Check current profile state
  SELECT kul_id INTO v_existing_kul_id FROM profiles WHERE id = v_user_id;

  -- 3. If they are already linked to THIS Kul, just return it (Idempotent success)
  IF v_existing_kul_id = v_kul.id THEN
    RETURN row_to_json(v_kul);
  END IF;

  -- 4. If they are already in a DIFFERENT Kul, they must leave it first
  IF v_existing_kul_id IS NOT NULL THEN
    RAISE EXCEPTION 'You are already in a Kul. Leave it first.';
  END IF;

  -- 5. Extra check: maybe they are in kul_members but profiles.kul_id was out of sync
  IF EXISTS (SELECT 1 FROM kul_members WHERE kul_id = v_kul.id AND user_id = v_user_id) THEN
    -- Repair profile link and return success
    UPDATE profiles SET kul_id = v_kul.id WHERE id = v_user_id;
    RETURN row_to_json(v_kul);
  END IF;

  -- 6. Final guard: if they are in ANOTHER Kul according to members table 
  -- (even if profiles.kul_id is null)
  IF EXISTS (SELECT 1 FROM kul_members WHERE user_id = v_user_id) THEN
     RAISE EXCEPTION 'You are already a member of another Kul. Leave it first.';
  END IF;

  -- Step 1: join as sadhak
  INSERT INTO kul_members (kul_id, user_id, role)
  VALUES (v_kul.id, v_user_id, 'sadhak');

  -- Step 2: link profile → kul
  UPDATE profiles SET kul_id = v_kul.id WHERE id = v_user_id;

  RETURN row_to_json(v_kul);
END;
$$;


ALTER FUNCTION public.join_kul(p_invite_code text) OWNER TO postgres;

--
-- Name: leave_kul(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.leave_kul() RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_kul_id  uuid;
BEGIN
  SELECT kul_id INTO v_kul_id FROM profiles WHERE id = v_user_id;
  IF v_kul_id IS NULL THEN
    RAISE EXCEPTION 'You are not in a Kul.';
  END IF;

  DELETE FROM kul_members WHERE kul_id = v_kul_id AND user_id = v_user_id;
  UPDATE profiles SET kul_id = NULL WHERE id = v_user_id;
END;
$$;


ALTER FUNCTION public.leave_kul() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
