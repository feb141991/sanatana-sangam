-- Name: nitya_karma_log; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.nitya_karma_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    date date DEFAULT CURRENT_DATE NOT NULL,
    woke_brahma_muhurta boolean DEFAULT false,
    snana_done boolean DEFAULT false,
    tilak_done boolean DEFAULT false,
    sandhya_done boolean DEFAULT false,
    japa_done boolean DEFAULT false,
    shloka_done boolean DEFAULT false,
    aarti_done boolean DEFAULT false,
    steps_completed integer GENERATED ALWAYS AS ((((((((woke_brahma_muhurta)::integer + (snana_done)::integer) + (tilak_done)::integer) + (sandhya_done)::integer) + (japa_done)::integer) + (shloka_done)::integer) + (aarti_done)::integer)) STORED,
    full_sequence boolean GENERATED ALWAYS AS ((woke_brahma_muhurta AND snana_done AND tilak_done AND sandhya_done AND japa_done AND shloka_done AND aarti_done)) STORED,
    completed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    log_date date DEFAULT CURRENT_DATE NOT NULL,
    step_id text
);


ALTER TABLE public.nitya_karma_log OWNER TO postgres;

--
-- Name: mark_nitya_step(uuid, date, text, boolean); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.mark_nitya_step(p_user_id uuid, p_date date, p_step text, p_done boolean DEFAULT true) RETURNS public.nitya_karma_log
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $_$
DECLARE
  v_row nitya_karma_log;
BEGIN
  -- Ensure row exists
  INSERT INTO nitya_karma_log (user_id, date)
  VALUES (p_user_id, p_date)
  ON CONFLICT (user_id, date) DO NOTHING;

  -- Update the specific step using dynamic SQL
  EXECUTE format(
    'UPDATE nitya_karma_log SET %I = $1, updated_at = NOW() WHERE user_id = $2 AND date = $3',
    p_step
  ) USING p_done, p_user_id, p_date;

  SELECT * INTO v_row FROM nitya_karma_log WHERE user_id = p_user_id AND date = p_date;
  RETURN v_row;
END;
$_$;


ALTER FUNCTION public.mark_nitya_step(p_user_id uuid, p_date date, p_step text, p_done boolean) OWNER TO postgres;

--
-- Name: match_scriptures(public.vector, integer, double precision); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.match_scriptures(query_embedding public.vector, match_count integer DEFAULT 5, match_threshold double precision DEFAULT 0.5) RETURNS TABLE(id uuid, text_id text, chapter integer, verse integer, sanskrit text, translation text, commentary text, tags text[], similarity double precision)
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    sc.id,
    sc.text_id,
    sc.chapter,
    sc.verse,
    sc.sanskrit,
    sc.translation,
    sc.commentary,
    sc.tags,
    1 - (sc.embedding <=> query_embedding) AS similarity
  FROM scripture_chunks sc
  WHERE 1 - (sc.embedding <=> query_embedding) > match_threshold
  ORDER BY sc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;


ALTER FUNCTION public.match_scriptures(query_embedding public.vector, match_count integer, match_threshold double precision) OWNER TO postgres;

--
-- Name: match_scriptures_text(text, integer, double precision, text[]); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.match_scriptures_text(query_text text, match_count integer DEFAULT 5, match_threshold double precision DEFAULT 0.1, filter_text_ids text[] DEFAULT NULL::text[]) RETURNS TABLE(id uuid, text_id text, chapter integer, verse integer, sanskrit text, transliteration text, translation text, commentary text, tags text[], similarity double precision)
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
DECLARE
  search_terms TEXT[];
  term TEXT;
  ts_query TSQUERY;
BEGIN
  -- Tokenise query into terms
  search_terms := string_to_array(lower(trim(query_text)), ' ');

  -- Build a ts_query with OR between terms for broad matching
  ts_query := NULL;
  FOREACH term IN ARRAY search_terms LOOP
    IF length(term) > 2 THEN  -- skip short words
      IF ts_query IS NULL THEN
        ts_query := to_tsquery('english', term || ':*');
      ELSE
        ts_query := ts_query || to_tsquery('english', term || ':*');
      END IF;
    END IF;
  END LOOP;

  IF ts_query IS NULL THEN
    ts_query := to_tsquery('english', search_terms[1] || ':*');
  END IF;

  RETURN QUERY
  SELECT
    sc.id,
    sc.text_id,
    sc.chapter,
    sc.verse,
    sc.sanskrit,
    sc.transliteration,
    sc.translation,
    sc.commentary,
    sc.tags,
    -- Similarity: combination of text rank + tag overlap
    (
      ts_rank(
        to_tsvector('english', COALESCE(sc.translation, '') || ' ' || array_to_string(sc.tags, ' ')),
        ts_query
      ) * 0.8
      +
      -- Boost if any tag matches a search term
      CASE WHEN sc.tags && search_terms THEN 0.2 ELSE 0.0 END
    )::FLOAT AS similarity
  FROM scripture_chunks sc
  WHERE
    (filter_text_ids IS NULL OR sc.text_id = ANY(filter_text_ids))
    AND (
      to_tsvector('english', COALESCE(sc.translation, '') || ' ' || array_to_string(sc.tags, ' '))
      @@ ts_query
      OR sc.tags && search_terms
    )
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;


ALTER FUNCTION public.match_scriptures_text(query_text text, match_count integer, match_threshold double precision, filter_text_ids text[]) OWNER TO postgres;

--
-- Name: prune_old_user_data(integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.prune_old_user_data(p_days integer DEFAULT 180) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_count int;
BEGIN
  DELETE FROM nitya_karma_logs 
  WHERE created_at < (now() - (p_days || ' days')::interval);
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;


ALTER FUNCTION public.prune_old_user_data(p_days integer) OWNER TO postgres;

--
-- Name: repair_kul_membership(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.repair_kul_membership() RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_kul_id  uuid;
BEGIN
  -- Find their membership
  SELECT kul_id INTO v_kul_id FROM kul_members WHERE user_id = v_user_id LIMIT 1;
  
  -- Sync profile if a membership exists
  IF v_kul_id IS NOT NULL THEN
    UPDATE profiles SET kul_id = v_kul_id WHERE id = v_user_id;
  END IF;
END;
$$;


ALTER FUNCTION public.repair_kul_membership() OWNER TO postgres;

--
-- Name: rls_auto_enable(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.rls_auto_enable() RETURNS event_trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$$;


ALTER FUNCTION public.rls_auto_enable() OWNER TO postgres;

--
-- Name: set_hero_assets_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.set_hero_assets_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION public.set_hero_assets_updated_at() OWNER TO postgres;

--
-- Name: sync_definition_to_festival(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.sync_definition_to_festival() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- Prevent infinite recursion
  IF pg_trigger_depth() > 1 THEN
    RETURN NEW;
  END IF;

  -- Propagate definition details to the legacy festivals table
  -- through the occurrences relation (id maps directly to festivals.id)
  UPDATE public.festivals f
  SET
    name = NEW.display_name,
    emoji = NEW.emoji,
    description = COALESCE(NEW.description, ''),
    type = COALESCE(NEW.kind, 'major'),
    tradition = NEW.tradition,
    is_shared = NEW.is_shared,
    verification_type = NEW.verification_type
  FROM public.observance_occurrences o
  WHERE f.id = o.id AND o.definition_id = NEW.id;

  RETURN NEW;
END;
$$;


ALTER FUNCTION public.sync_definition_to_festival() OWNER TO postgres;

--
-- Name: sync_festival_to_observance(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.sync_festival_to_observance() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_slug text;
  v_def_id uuid;
BEGIN
  -- Prevent infinite recursion
  IF pg_trigger_depth() > 1 THEN
    IF TG_OP = 'DELETE' THEN
      RETURN OLD;
    ELSE
      RETURN NEW;
    END IF;
  END IF;

  IF TG_OP = 'DELETE' THEN
    DELETE FROM public.observance_occurrences WHERE id = OLD.id;
    RETURN OLD;
  END IF;

  -- Slugify name
  v_slug := lower(regexp_replace(regexp_replace(NEW.name, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'));
  IF v_slug = '' OR v_slug IS NULL THEN
    v_slug := 'observance-' || substr(md5(NEW.name), 1, 8);
  END IF;

  -- Upsert definition
  INSERT INTO public.observance_definitions (
    slug,
    display_name,
    kind,
    tradition,
    calendar_rule_type,
    verification_type,
    route_kind,
    route_slug,
    region,
    active,
    emoji,
    description,
    is_shared
  ) VALUES (
    v_slug,
    NEW.name,
    NEW.type,
    COALESCE(NEW.tradition, 'all'),
    NEW.verification_type,
    NEW.verification_type,
    NULL,
    NULL,
    NULL,
    true,
    COALESCE(NEW.emoji, '🪔'),
    NEW.description,
    COALESCE(NEW.is_shared, false)
  )
  ON CONFLICT (slug) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    kind = COALESCE(EXCLUDED.kind, observance_definitions.kind),
    tradition = COALESCE(EXCLUDED.tradition, observance_definitions.tradition),
    verification_type = COALESCE(EXCLUDED.verification_type, observance_definitions.verification_type),
    calendar_rule_type = COALESCE(EXCLUDED.calendar_rule_type, observance_definitions.calendar_rule_type),
    emoji = EXCLUDED.emoji,
    description = EXCLUDED.description,
    is_shared = EXCLUDED.is_shared
  RETURNING id INTO v_def_id;

  -- Upsert occurrence with matching ID
  INSERT INTO public.observance_occurrences (
    id,
    definition_id,
    year,
    date,
    calculation_version,
    calculated_by,
    verification_status,
    verification_note,
    suggested_date,
    review_status,
    source_provenance,
    verification_confidence,
    verification_run_at,
    reviewed_at,
    review_notes
  ) VALUES (
    NEW.id,
    v_def_id,
    NEW.year,
    NEW.date,
    '1.0.0',
    'legacy_sync',
    NEW.verification_status,
    NEW.verification_note,
    NEW.suggested_date,
    NEW.review_status,
    jsonb_build_object(
      'source_name', NEW.source_name,
      'source_kind', NEW.source_kind
    ),
    NEW.verification_confidence,
    NEW.verification_run_at,
    NEW.reviewed_at,
    NEW.review_notes
  )
  ON CONFLICT (id) DO UPDATE SET
    definition_id = EXCLUDED.definition_id,
    year = EXCLUDED.year,
    date = EXCLUDED.date,
    verification_status = EXCLUDED.verification_status,
    verification_note = EXCLUDED.verification_note,
    suggested_date = EXCLUDED.suggested_date,
    review_status = EXCLUDED.review_status,
    source_provenance = EXCLUDED.source_provenance,
    verification_confidence = EXCLUDED.verification_confidence,
    verification_run_at = EXCLUDED.verification_run_at,
    reviewed_at = EXCLUDED.reviewed_at,
    review_notes = EXCLUDED.review_notes;

  RETURN NEW;
END;
$$;


ALTER FUNCTION public.sync_festival_to_observance() OWNER TO postgres;

--
-- Name: sync_occurrence_to_festival(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.sync_occurrence_to_festival() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_def public.observance_definitions%ROWTYPE;
BEGIN
  -- Prevent infinite recursion
  IF pg_trigger_depth() > 1 THEN
    IF TG_OP = 'DELETE' THEN
      RETURN OLD;
    ELSE
      RETURN NEW;
    END IF;
  END IF;

  IF TG_OP = 'DELETE' THEN
    DELETE FROM public.festivals WHERE id = OLD.id;
    RETURN OLD;
  END IF;

  -- Fetch definition detail
  SELECT * INTO v_def FROM public.observance_definitions WHERE id = NEW.definition_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Observance definition with ID % not found', NEW.definition_id;
  END IF;

  -- Upsert into festivals
  INSERT INTO public.festivals (
    id,
    name,
    date,
    emoji,
    description,
    type,
    year,
    tradition,
    is_shared,
    source_name,
    source_kind,
    review_status,
    reviewed_at,
    review_notes,
    verification_status,
    verification_confidence,
    verification_note,
    suggested_date,
    verification_run_at,
    verification_type
  ) VALUES (
    NEW.id,
    v_def.display_name,
    NEW.date,
    v_def.emoji,
    COALESCE(v_def.description, ''),
    COALESCE(v_def.kind, 'major'),
    NEW.year,
    v_def.tradition,
    v_def.is_shared,
    NEW.source_provenance->>'source_name',
    NEW.source_provenance->>'source_kind',
    NEW.review_status,
    NEW.reviewed_at,
    NEW.review_notes,
    NEW.verification_status,
    NEW.verification_confidence,
    NEW.verification_note,
    NEW.suggested_date,
    NEW.verification_run_at,
    v_def.verification_type
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    date = EXCLUDED.date,
    emoji = EXCLUDED.emoji,
    description = EXCLUDED.description,
    type = EXCLUDED.type,
    year = EXCLUDED.year,
    tradition = EXCLUDED.tradition,
    is_shared = EXCLUDED.is_shared,
    source_name = EXCLUDED.source_name,
    source_kind = EXCLUDED.source_kind,
    review_status = EXCLUDED.review_status,
    reviewed_at = EXCLUDED.reviewed_at,
    review_notes = EXCLUDED.review_notes,
    verification_status = EXCLUDED.verification_status,
    verification_confidence = EXCLUDED.verification_confidence,
    verification_note = EXCLUDED.verification_note,
    suggested_date = EXCLUDED.suggested_date,
    verification_run_at = EXCLUDED.verification_run_at,
    verification_type = EXCLUDED.verification_type;

  RETURN NEW;
END;
$$;


ALTER FUNCTION public.sync_occurrence_to_festival() OWNER TO postgres;

--
-- Name: sync_post_comment_count(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.sync_post_comment_count() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts
    SET comment_count = comment_count + 1
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts
    SET comment_count = GREATEST(comment_count - 1, 0)
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;


ALTER FUNCTION public.sync_post_comment_count() OWNER TO postgres;

--
-- Name: update_birth_profiles_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_birth_profiles_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION public.update_birth_profiles_updated_at() OWNER TO postgres;

--
-- Name: update_darshan_preferences_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_darshan_preferences_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION public.update_darshan_preferences_updated_at() OWNER TO postgres;

--
-- Name: update_device_token_timestamp(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_device_token_timestamp() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_device_token_timestamp() OWNER TO postgres;

--
-- Name: update_family_member_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_family_member_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;


ALTER FUNCTION public.update_family_member_updated_at() OWNER TO postgres;

--
-- Name: update_guided_path_progress_timestamp(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_guided_path_progress_timestamp() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_guided_path_progress_timestamp() OWNER TO postgres;

--
-- Name: update_kul_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_kul_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;


ALTER FUNCTION public.update_kul_updated_at() OWNER TO postgres;

--
-- Name: update_mandali_member_count(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_mandali_member_count() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF OLD.mandali_id IS DISTINCT FROM NEW.mandali_id THEN
      IF OLD.mandali_id IS NOT NULL THEN
        UPDATE public.mandalis SET member_count = member_count - 1 WHERE id = OLD.mandali_id;
      END IF;
      IF NEW.mandali_id IS NOT NULL THEN
        UPDATE public.mandalis SET member_count = member_count + 1 WHERE id = NEW.mandali_id;
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_mandali_member_count() OWNER TO postgres;

--
-- Name: update_verse_mastery_after_review(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_verse_mastery_after_review() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_chunk_id UUID;
  v_user_id  UUID;
BEGIN
  SELECT r.chunk_id, r.user_id INTO v_chunk_id, v_user_id FROM pathshala_recordings r WHERE r.id = NEW.recording_id;
  INSERT INTO pathshala_verse_mastery (user_id, chunk_id, attempt_count, last_attempt_at)
    VALUES (v_user_id, v_chunk_id, 1, NOW())
    ON CONFLICT (user_id, chunk_id) DO UPDATE SET attempt_count = pathshala_verse_mastery.attempt_count + 1, last_attempt_at = NOW(), updated_at = NOW();
  IF NEW.reviewer_type = 'ai' THEN
    UPDATE pathshala_verse_mastery SET best_ai_score = GREATEST(COALESCE(best_ai_score, 0), NEW.overall_score) WHERE user_id = v_user_id AND chunk_id = v_chunk_id;
  ELSE
    UPDATE pathshala_verse_mastery SET best_guru_score = GREATEST(COALESCE(best_guru_score, 0), NEW.overall_score), certified = CASE WHEN NEW.is_certified THEN true ELSE certified END, certified_by = CASE WHEN NEW.is_certified THEN NEW.reviewer_id ELSE certified_by END, certified_at = CASE WHEN NEW.is_certified THEN NOW() ELSE certified_at END WHERE user_id = v_user_id AND chunk_id = v_chunk_id;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_verse_mastery_after_review() OWNER TO postgres;

--
-- Name: upsert_device_token(uuid, text, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.upsert_device_token(p_user_id uuid, p_player_id text, p_platform text DEFAULT 'web'::text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO device_tokens (user_id, player_id, platform, is_active)
  VALUES (p_user_id, p_player_id, p_platform, true)
  ON CONFLICT (player_id) DO UPDATE
    SET user_id    = EXCLUDED.user_id,
        platform   = EXCLUDED.platform,
        is_active  = true,
        updated_at = now();
END;
$$;


ALTER FUNCTION public.upsert_device_token(p_user_id uuid, p_player_id text, p_platform text) OWNER TO postgres;

--
--

CREATE FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer DEFAULT (1024 * 1024)) RETURNS SETOF realtime.wal_rls
    LANGUAGE plpgsql
    AS $$
declare
-- Regclass of the table e.g. public.notes
entity_ regclass = (quote_ident(wal ->> 'schema') || '.' || quote_ident(wal ->> 'table'))::regclass;

-- I, U, D, T: insert, update ...
action realtime.action = (
    case wal ->> 'action'
        when 'I' then 'INSERT'
        when 'U' then 'UPDATE'
        when 'D' then 'DELETE'
        else 'ERROR'
    end
);

-- Is row level security enabled for the table
is_rls_enabled bool = relrowsecurity from pg_class where oid = entity_;

subscriptions realtime.subscription[] = array_agg(subs)
    from
        realtime.subscription subs
    where
        subs.entity = entity_
        -- Filter by action early - only get subscriptions interested in this action
        -- action_filter column can be: '*' (all), 'INSERT', 'UPDATE', or 'DELETE'
        and (subs.action_filter = '*' or subs.action_filter = action::text);

-- Subscription vars
roles regrole[] = array_agg(distinct us.claims_role::text)
    from
        unnest(subscriptions) us;

working_role regrole;
claimed_role regrole;
claims jsonb;

subscription_id uuid;
subscription_has_access bool;
visible_to_subscription_ids uuid[] = '{}';

-- structured info for wal's columns
columns realtime.wal_column[];
-- previous identity values for update/delete
old_columns realtime.wal_column[];

error_record_exceeds_max_size boolean = octet_length(wal::text) > max_record_bytes;

-- Primary jsonb output for record
output jsonb;

begin
perform set_config('role', null, true);

columns =
    array_agg(
        (
            x->>'name',
            x->>'type',
            x->>'typeoid',
            realtime.cast(
                (x->'value') #>> '{}',
                coalesce(
                    (x->>'typeoid')::regtype, -- null when wal2json version <= 2.4
                    (x->>'type')::regtype
                )
            ),
            (pks ->> 'name') is not null,
            true
        )::realtime.wal_column
    )
    from
        jsonb_array_elements(wal -> 'columns') x
        left join jsonb_array_elements(wal -> 'pk') pks
            on (x ->> 'name') = (pks ->> 'name');

old_columns =
    array_agg(
        (
            x->>'name',
            x->>'type',
            x->>'typeoid',
            realtime.cast(
                (x->'value') #>> '{}',
                coalesce(
                    (x->>'typeoid')::regtype, -- null when wal2json version <= 2.4
                    (x->>'type')::regtype
                )
            ),
            (pks ->> 'name') is not null,
            true
        )::realtime.wal_column
    )
    from
        jsonb_array_elements(wal -> 'identity') x
        left join jsonb_array_elements(wal -> 'pk') pks
            on (x ->> 'name') = (pks ->> 'name');

for working_role in select * from unnest(roles) loop

    -- Update `is_selectable` for columns and old_columns
    columns =
        array_agg(
            (
                c.name,
                c.type_name,
                c.type_oid,
                c.value,
                c.is_pkey,
                pg_catalog.has_column_privilege(working_role, entity_, c.name, 'SELECT')
            )::realtime.wal_column
        )
        from
            unnest(columns) c;

    old_columns =
            array_agg(
                (
                    c.name,
                    c.type_name,
                    c.type_oid,
                    c.value,
                    c.is_pkey,
                    pg_catalog.has_column_privilege(working_role, entity_, c.name, 'SELECT')
                )::realtime.wal_column
            )
            from
                unnest(old_columns) c;

    if action <> 'DELETE' and count(1) = 0 from unnest(columns) c where c.is_pkey then
        return next (
            jsonb_build_object(
                'schema', wal ->> 'schema',
                'table', wal ->> 'table',
                'type', action
            ),
            is_rls_enabled,
            -- subscriptions is already filtered by entity
            (select array_agg(s.subscription_id) from unnest(subscriptions) as s where claims_role = working_role),
            array['Error 400: Bad Request, no primary key']
        )::realtime.wal_rls;

    -- The claims role does not have SELECT permission to the primary key of entity
    elsif action <> 'DELETE' and sum(c.is_selectable::int) <> count(1) from unnest(columns) c where c.is_pkey then
        return next (
            jsonb_build_object(
                'schema', wal ->> 'schema',
                'table', wal ->> 'table',
                'type', action
            ),
            is_rls_enabled,
            (select array_agg(s.subscription_id) from unnest(subscriptions) as s where claims_role = working_role),
            array['Error 401: Unauthorized']
        )::realtime.wal_rls;

    else
        output = jsonb_build_object(
            'schema', wal ->> 'schema',
            'table', wal ->> 'table',
            'type', action,
            'commit_timestamp', to_char(
                ((wal ->> 'timestamp')::timestamptz at time zone 'utc'),
                'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'
            ),
            'columns', (
                select
                    jsonb_agg(
                        jsonb_build_object(
                            'name', pa.attname,
                            'type', pt.typname
                        )
                        order by pa.attnum asc
                    )
                from
                    pg_attribute pa
                    join pg_type pt
                        on pa.atttypid = pt.oid
                where
                    attrelid = entity_
                    and attnum > 0
                    and pg_catalog.has_column_privilege(working_role, entity_, pa.attname, 'SELECT')
            )
        )
        -- Add "record" key for insert and update
        || case
            when action in ('INSERT', 'UPDATE') then
                jsonb_build_object(
                    'record',
                    (
                        select
                            jsonb_object_agg(
                                -- if unchanged toast, get column name and value from old record
                                coalesce((c).name, (oc).name),
                                case
                                    when (c).name is null then (oc).value
                                    else (c).value
                                end
                            )
                        from
                            unnest(columns) c
                            full outer join unnest(old_columns) oc
                                on (c).name = (oc).name
                        where
                            coalesce((c).is_selectable, (oc).is_selectable)
                            and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                    )
                )
            else '{}'::jsonb
        end
        -- Add "old_record" key for update and delete
        || case
            when action = 'UPDATE' then
                jsonb_build_object(
                        'old_record',
                        (
                            select jsonb_object_agg((c).name, (c).value)
                            from unnest(old_columns) c
                            where
                                (c).is_selectable
                                and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                        )
                    )
            when action = 'DELETE' then
                jsonb_build_object(
                    'old_record',
                    (
                        select jsonb_object_agg((c).name, (c).value)
                        from unnest(old_columns) c
                        where
                            (c).is_selectable
                            and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                            and ( not is_rls_enabled or (c).is_pkey ) -- if RLS enabled, we can't secure deletes so filter to pkey
                    )
                )
            else '{}'::jsonb
        end;

        -- Create the prepared statement
        if is_rls_enabled and action <> 'DELETE' then
            if (select 1 from pg_prepared_statements where name = 'walrus_rls_stmt' limit 1) > 0 then
                deallocate walrus_rls_stmt;
            end if;
            execute realtime.build_prepared_statement_sql('walrus_rls_stmt', entity_, columns);
        end if;

        visible_to_subscription_ids = '{}';

        for subscription_id, claims in (
                select
                    subs.subscription_id,
                    subs.claims
                from
                    unnest(subscriptions) subs
                where
                    subs.entity = entity_
                    and subs.claims_role = working_role
                    and (
                        realtime.is_visible_through_filters(columns, subs.filters)
                        or (
                          action = 'DELETE'
                          and realtime.is_visible_through_filters(old_columns, subs.filters)
                        )
                    )
        ) loop

            if not is_rls_enabled or action = 'DELETE' then
                visible_to_subscription_ids = visible_to_subscription_ids || subscription_id;
            else
                -- Check if RLS allows the role to see the record
                perform
                    -- Trim leading and trailing quotes from working_role because set_config
                    -- doesn't recognize the role as valid if they are included
                    set_config('role', trim(both '"' from working_role::text), true),
                    set_config('request.jwt.claims', claims::text, true);

                execute 'execute walrus_rls_stmt' into subscription_has_access;

                if subscription_has_access then
                    visible_to_subscription_ids = visible_to_subscription_ids || subscription_id;
                end if;
            end if;
        end loop;

        perform set_config('role', null, true);

        return next (
            output,
            is_rls_enabled,
            visible_to_subscription_ids,
            case
                when error_record_exceeds_max_size then array['Error 413: Payload Too Large']
                else '{}'
            end
        )::realtime.wal_rls;

    end if;
end loop;

perform set_config('role', null, true);
end;
$$;


ALTER FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) OWNER TO supabase_admin;

--
--

CREATE FUNCTION realtime.broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text DEFAULT 'ROW'::text) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
    -- Declare a variable to hold the JSONB representation of the row
    row_data jsonb := '{}'::jsonb;
BEGIN
    IF level = 'STATEMENT' THEN
        RAISE EXCEPTION 'function can only be triggered for each row, not for each statement';
    END IF;
    -- Check the operation type and handle accordingly
    IF operation = 'INSERT' OR operation = 'UPDATE' OR operation = 'DELETE' THEN
        row_data := jsonb_build_object('old_record', OLD, 'record', NEW, 'operation', operation, 'table', table_name, 'schema', table_schema);
        PERFORM realtime.send (row_data, event_name, topic_name);
    ELSE
        RAISE EXCEPTION 'Unexpected operation type: %', operation;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to process the row: %', SQLERRM;
END;

$$;


ALTER FUNCTION realtime.broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text) OWNER TO supabase_admin;

--
--

CREATE FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) RETURNS text
    LANGUAGE sql
    AS $$
      /*
      Builds a sql string that, if executed, creates a prepared statement to
      tests retrive a row from *entity* by its primary key columns.
      Example
          select realtime.build_prepared_statement_sql('public.notes', '{"id"}'::text[], '{"bigint"}'::text[])
      */
          select
      'prepare ' || prepared_statement_name || ' as
          select
              exists(
                  select
                      1
                  from
                      ' || entity || '
                  where
                      ' || string_agg(quote_ident(pkc.name) || '=' || quote_nullable(pkc.value #>> '{}') , ' and ') || '
              )'
          from
              unnest(columns) pkc
          where
              pkc.is_pkey
          group by
              entity
      $$;


ALTER FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) OWNER TO supabase_admin;

--
--

CREATE FUNCTION realtime."cast"(val text, type_ regtype) RETURNS jsonb
    LANGUAGE plpgsql IMMUTABLE
    AS $$
declare
  res jsonb;
begin
  if type_::text = 'bytea' then
    return to_jsonb(val);
  end if;
  execute format('select to_jsonb(%L::'|| type_::text || ')', val) into res;
  return res;
end
$$;


ALTER FUNCTION realtime."cast"(val text, type_ regtype) OWNER TO supabase_admin;

--
--

CREATE FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) RETURNS boolean
    LANGUAGE plpgsql IMMUTABLE
    AS $$
      /*
      Casts *val_1* and *val_2* as type *type_* and check the *op* condition for truthiness
      */
      declare
          op_symbol text = (
              case
                  when op = 'eq' then '='
                  when op = 'neq' then '!='
                  when op = 'lt' then '<'
                  when op = 'lte' then '<='
                  when op = 'gt' then '>'
                  when op = 'gte' then '>='
                  when op = 'in' then '= any'
                  else 'UNKNOWN OP'
              end
          );
          res boolean;
      begin
          execute format(
              'select %L::'|| type_::text || ' ' || op_symbol
              || ' ( %L::'
              || (
                  case
                      when op = 'in' then type_::text || '[]'
                      else type_::text end
              )
              || ')', val_1, val_2) into res;
          return res;
      end;
      $$;


ALTER FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) OWNER TO supabase_admin;

--
--

CREATE FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) RETURNS boolean
    LANGUAGE sql IMMUTABLE
    AS $_$
    /*
    Should the record be visible (true) or filtered out (false) after *filters* are applied
    */
        select
            -- Default to allowed when no filters present
            $2 is null -- no filters. this should not happen because subscriptions has a default
            or array_length($2, 1) is null -- array length of an empty array is null
            or bool_and(
                coalesce(
                    realtime.check_equality_op(
                        op:=f.op,
                        type_:=coalesce(
                            col.type_oid::regtype, -- null when wal2json version <= 2.4
                            col.type_name::regtype
                        ),
                        -- cast jsonb to text
                        val_1:=col.value #>> '{}',
                        val_2:=f.value
                    ),
                    false -- if null, filter does not match
                )
            )
        from
            unnest(filters) f
            join unnest(columns) col
                on f.column_name = col.name;
    $_$;


ALTER FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) OWNER TO supabase_admin;

--
--

CREATE FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) RETURNS TABLE(wal jsonb, is_rls_enabled boolean, subscription_ids uuid[], errors text[], slot_changes_count bigint)
    LANGUAGE sql
    SET log_min_messages TO 'fatal'
    AS $$
  WITH pub AS (
    SELECT
      concat_ws(
        ',',
        CASE WHEN bool_or(pubinsert) THEN 'insert' ELSE NULL END,
        CASE WHEN bool_or(pubupdate) THEN 'update' ELSE NULL END,
        CASE WHEN bool_or(pubdelete) THEN 'delete' ELSE NULL END
      ) AS w2j_actions,
      coalesce(
        string_agg(
          realtime.quote_wal2json(format('%I.%I', schemaname, tablename)::regclass),
          ','
        ) filter (WHERE ppt.tablename IS NOT NULL AND ppt.tablename NOT LIKE '% %'),
        ''
      ) AS w2j_add_tables
    FROM pg_publication pp
    LEFT JOIN pg_publication_tables ppt ON pp.pubname = ppt.pubname
    WHERE pp.pubname = publication
    GROUP BY pp.pubname
    LIMIT 1
  ),
  -- MATERIALIZED ensures pg_logical_slot_get_changes is called exactly once
  w2j AS MATERIALIZED (
    SELECT x.*, pub.w2j_add_tables
    FROM pub,
         pg_logical_slot_get_changes(
           slot_name, null, max_changes,
           'include-pk', 'true',
           'include-transaction', 'false',
           'include-timestamp', 'true',
           'include-type-oids', 'true',
           'format-version', '2',
           'actions', pub.w2j_actions,
           'add-tables', pub.w2j_add_tables
         ) x
  ),
  -- Count raw slot entries before apply_rls/subscription filter
  slot_count AS (
    SELECT count(*)::bigint AS cnt
    FROM w2j
    WHERE w2j.w2j_add_tables <> ''
  ),
  -- Apply RLS and filter as before
  rls_filtered AS (
    SELECT xyz.wal, xyz.is_rls_enabled, xyz.subscription_ids, xyz.errors
    FROM w2j,
         realtime.apply_rls(
           wal := w2j.data::jsonb,
           max_record_bytes := max_record_bytes
         ) xyz(wal, is_rls_enabled, subscription_ids, errors)
    WHERE w2j.w2j_add_tables <> ''
      AND xyz.subscription_ids[1] IS NOT NULL
  )
  -- Real rows with slot count attached
  SELECT rf.wal, rf.is_rls_enabled, rf.subscription_ids, rf.errors, sc.cnt
  FROM rls_filtered rf, slot_count sc

  UNION ALL

  -- Sentinel row: always returned when no real rows exist so Elixir can
  -- always read slot_changes_count. Identified by wal IS NULL.
  SELECT null, null, null, null, sc.cnt
  FROM slot_count sc
  WHERE NOT EXISTS (SELECT 1 FROM rls_filtered)
$$;


ALTER FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) OWNER TO supabase_admin;

--
--

CREATE FUNCTION realtime.quote_wal2json(entity regclass) RETURNS text
    LANGUAGE sql IMMUTABLE STRICT
    AS $$
      select
        (
          select string_agg('' || ch,'')
          from unnest(string_to_array(nsp.nspname::text, null)) with ordinality x(ch, idx)
          where
            not (x.idx = 1 and x.ch = '"')
            and not (
              x.idx = array_length(string_to_array(nsp.nspname::text, null), 1)
              and x.ch = '"'
            )
        )
        || '.'
        || (
          select string_agg('' || ch,'')
          from unnest(string_to_array(pc.relname::text, null)) with ordinality x(ch, idx)
          where
            not (x.idx = 1 and x.ch = '"')
            and not (
              x.idx = array_length(string_to_array(nsp.nspname::text, null), 1)
              and x.ch = '"'
            )
          )
      from
        pg_class pc
        join pg_namespace nsp
          on pc.relnamespace = nsp.oid
      where
        pc.oid = entity
    $$;


ALTER FUNCTION realtime.quote_wal2json(entity regclass) OWNER TO supabase_admin;

--
--

CREATE FUNCTION realtime.send(payload jsonb, event text, topic text, private boolean DEFAULT true) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
  generated_id uuid;
  final_payload jsonb;
BEGIN
  BEGIN
    -- Generate a new UUID for the id
    generated_id := gen_random_uuid();

    -- Check if payload has an 'id' key, if not, add the generated UUID
    IF payload ? 'id' THEN
      final_payload := payload;
    ELSE
      final_payload := jsonb_set(payload, '{id}', to_jsonb(generated_id));
    END IF;

    -- Set the topic configuration
    EXECUTE format('SET LOCAL realtime.topic TO %L', topic);

    -- Attempt to insert the message
    INSERT INTO realtime.messages (id, payload, event, topic, private, extension)
    VALUES (generated_id, final_payload, event, topic, private, 'broadcast');
  EXCEPTION
    WHEN OTHERS THEN
      -- Capture and notify the error
      RAISE WARNING 'ErrorSendingBroadcastMessage: %', SQLERRM;
  END;
END;
$$;


ALTER FUNCTION realtime.send(payload jsonb, event text, topic text, private boolean) OWNER TO supabase_admin;

--
--

CREATE FUNCTION realtime.subscription_check_filters() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    /*
    Validates that the user defined filters for a subscription:
    - refer to valid columns that the claimed role may access
    - values are coercable to the correct column type
    */
    declare
        col_names text[] = coalesce(
                array_agg(c.column_name order by c.ordinal_position),
                '{}'::text[]
            )
            from
                information_schema.columns c
            where
                format('%I.%I', c.table_schema, c.table_name)::regclass = new.entity
                and pg_catalog.has_column_privilege(
                    (new.claims ->> 'role'),
                    format('%I.%I', c.table_schema, c.table_name)::regclass,
                    c.column_name,
                    'SELECT'
                );
        filter realtime.user_defined_filter;
        col_type regtype;

        in_val jsonb;
    begin
        for filter in select * from unnest(new.filters) loop
            -- Filtered column is valid
            if not filter.column_name = any(col_names) then
                raise exception 'invalid column for filter %', filter.column_name;
            end if;

            -- Type is sanitized and safe for string interpolation
            col_type = (
                select atttypid::regtype
                from pg_catalog.pg_attribute
                where attrelid = new.entity
                      and attname = filter.column_name
            );
            if col_type is null then
                raise exception 'failed to lookup type for column %', filter.column_name;
            end if;

            -- Set maximum number of entries for in filter
            if filter.op = 'in'::realtime.equality_op then
                in_val = realtime.cast(filter.value, (col_type::text || '[]')::regtype);
                if coalesce(jsonb_array_length(in_val), 0) > 100 then
                    raise exception 'too many values for `in` filter. Maximum 100';
                end if;
            else
                -- raises an exception if value is not coercable to type
                perform realtime.cast(filter.value, col_type);
            end if;

        end loop;

        -- Apply consistent order to filters so the unique constraint on
        -- (subscription_id, entity, filters) can't be tricked by a different filter order
        new.filters = coalesce(
            array_agg(f order by f.column_name, f.op, f.value),
            '{}'
        ) from unnest(new.filters) f;

        return new;
    end;
    $$;


ALTER FUNCTION realtime.subscription_check_filters() OWNER TO supabase_admin;

--
--

CREATE FUNCTION realtime.to_regrole(role_name text) RETURNS regrole
    LANGUAGE sql IMMUTABLE
    AS $$ select role_name::regrole $$;


ALTER FUNCTION realtime.to_regrole(role_name text) OWNER TO supabase_admin;

--
--

CREATE FUNCTION realtime.topic() RETURNS text
    LANGUAGE sql STABLE
    AS $$
select nullif(current_setting('realtime.topic', true), '')::text;
$$;


ALTER FUNCTION realtime.topic() OWNER TO supabase_realtime_admin;

--
--

CREATE FUNCTION storage.allow_any_operation(expected_operations text[]) RETURNS boolean
    LANGUAGE sql STABLE
    AS $$
  WITH current_operation AS (
    SELECT storage.operation() AS raw_operation
  ),
  normalized AS (
    SELECT CASE
      WHEN raw_operation LIKE 'storage.%' THEN substr(raw_operation, 9)
      ELSE raw_operation
    END AS current_operation
    FROM current_operation
  )
  SELECT EXISTS (
    SELECT 1
    FROM normalized n
    CROSS JOIN LATERAL unnest(expected_operations) AS expected_operation
    WHERE expected_operation IS NOT NULL
      AND expected_operation <> ''
      AND n.current_operation = CASE
        WHEN expected_operation LIKE 'storage.%' THEN substr(expected_operation, 9)
        ELSE expected_operation
      END
  );
$$;


ALTER FUNCTION storage.allow_any_operation(expected_operations text[]) OWNER TO supabase_storage_admin;

--
--

CREATE FUNCTION storage.allow_only_operation(expected_operation text) RETURNS boolean
    LANGUAGE sql STABLE
    AS $$
  WITH current_operation AS (
    SELECT storage.operation() AS raw_operation
  ),
  normalized AS (
    SELECT
      CASE
        WHEN raw_operation LIKE 'storage.%' THEN substr(raw_operation, 9)
        ELSE raw_operation
      END AS current_operation,
      CASE
        WHEN expected_operation LIKE 'storage.%' THEN substr(expected_operation, 9)
        ELSE expected_operation
      END AS requested_operation
    FROM current_operation
  )
  SELECT CASE
    WHEN requested_operation IS NULL OR requested_operation = '' THEN FALSE
    ELSE COALESCE(current_operation = requested_operation, FALSE)
  END
  FROM normalized;
$$;


ALTER FUNCTION storage.allow_only_operation(expected_operation text) OWNER TO supabase_storage_admin;

--
--

CREATE FUNCTION storage.can_insert_object(bucketid text, name text, owner uuid, metadata jsonb) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  INSERT INTO "storage"."objects" ("bucket_id", "name", "owner", "metadata") VALUES (bucketid, name, owner, metadata);
  -- hack to rollback the successful insert
  RAISE sqlstate 'PT200' using
  message = 'ROLLBACK',
  detail = 'rollback successful insert';
END
$$;


ALTER FUNCTION storage.can_insert_object(bucketid text, name text, owner uuid, metadata jsonb) OWNER TO supabase_storage_admin;

--
--

CREATE FUNCTION storage.enforce_bucket_name_length() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
    if length(new.name) > 100 then
        raise exception 'bucket name "%" is too long (% characters). Max is 100.', new.name, length(new.name);
    end if;
    return new;
end;
$$;


ALTER FUNCTION storage.enforce_bucket_name_length() OWNER TO supabase_storage_admin;

--
--

CREATE FUNCTION storage.extension(name text) RETURNS text
    LANGUAGE plpgsql IMMUTABLE
    AS $$
DECLARE
    _parts text[];
    _filename text;
BEGIN
    -- Split on "/" to get path segments
    SELECT string_to_array(name, '/') INTO _parts;
    -- Get the last path segment (the actual filename)
    SELECT _parts[array_length(_parts, 1)] INTO _filename;
    -- Extract extension: reverse, split on '.', then reverse again
    RETURN reverse(split_part(reverse(_filename), '.', 1));
END
$$;


ALTER FUNCTION storage.extension(name text) OWNER TO supabase_storage_admin;

--
--

CREATE FUNCTION storage.filename(name text) RETURNS text
    LANGUAGE plpgsql
    AS $$
DECLARE
_parts text[];
BEGIN
	select string_to_array(name, '/') into _parts;
	return _parts[array_length(_parts,1)];
END
$$;


ALTER FUNCTION storage.filename(name text) OWNER TO supabase_storage_admin;

--
--

CREATE FUNCTION storage.foldername(name text) RETURNS text[]
    LANGUAGE plpgsql IMMUTABLE
    AS $$
DECLARE
    _parts text[];
BEGIN
    -- Split on "/" to get path segments
    SELECT string_to_array(name, '/') INTO _parts;
    -- Return everything except the last segment
    RETURN _parts[1 : array_length(_parts,1) - 1];
END
$$;


ALTER FUNCTION storage.foldername(name text) OWNER TO supabase_storage_admin;

--
--

CREATE FUNCTION storage.get_common_prefix(p_key text, p_prefix text, p_delimiter text) RETURNS text
    LANGUAGE sql IMMUTABLE
    AS $$
SELECT CASE
    WHEN position(p_delimiter IN substring(p_key FROM length(p_prefix) + 1)) > 0
    THEN left(p_key, length(p_prefix) + position(p_delimiter IN substring(p_key FROM length(p_prefix) + 1)))
    ELSE NULL
END;
$$;


ALTER FUNCTION storage.get_common_prefix(p_key text, p_prefix text, p_delimiter text) OWNER TO supabase_storage_admin;

--
--

CREATE FUNCTION storage.get_size_by_bucket() RETURNS TABLE(size bigint, bucket_id text)
    LANGUAGE plpgsql STABLE
    AS $$
BEGIN
    return query
        select sum((metadata->>'size')::bigint)::bigint as size, obj.bucket_id
        from "storage".objects as obj
        group by obj.bucket_id;
END
$$;


ALTER FUNCTION storage.get_size_by_bucket() OWNER TO supabase_storage_admin;

--
--

CREATE FUNCTION storage.list_multipart_uploads_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer DEFAULT 100, next_key_token text DEFAULT ''::text, next_upload_token text DEFAULT ''::text) RETURNS TABLE(key text, id text, created_at timestamp with time zone)
    LANGUAGE plpgsql
    AS $_$
BEGIN
    RETURN QUERY EXECUTE
        'SELECT DISTINCT ON(key COLLATE "C") * from (
            SELECT
                CASE
                    WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN
                        substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1)))
                    ELSE
                        key
                END AS key, id, created_at
            FROM
                storage.s3_multipart_uploads
            WHERE
                bucket_id = $5 AND
                key ILIKE $1 || ''%'' AND
                CASE
                    WHEN $4 != '''' AND $6 = '''' THEN
                        CASE
                            WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN
                                substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1))) COLLATE "C" > $4
                            ELSE
                                key COLLATE "C" > $4
                            END
                    ELSE
                        true
                END AND
                CASE
                    WHEN $6 != '''' THEN
                        id COLLATE "C" > $6
                    ELSE
                        true
                    END
            ORDER BY
                key COLLATE "C" ASC, created_at ASC) as e order by key COLLATE "C" LIMIT $3'
        USING prefix_param, delimiter_param, max_keys, next_key_token, bucket_id, next_upload_token;
END;
$_$;


ALTER FUNCTION storage.list_multipart_uploads_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer, next_key_token text, next_upload_token text) OWNER TO supabase_storage_admin;

--
--

CREATE FUNCTION storage.list_objects_with_delimiter(_bucket_id text, prefix_param text, delimiter_param text, max_keys integer DEFAULT 100, start_after text DEFAULT ''::text, next_token text DEFAULT ''::text, sort_order text DEFAULT 'asc'::text) RETURNS TABLE(name text, id uuid, metadata jsonb, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone)
    LANGUAGE plpgsql STABLE
    AS $_$
DECLARE
    v_peek_name TEXT;
    v_current RECORD;
    v_common_prefix TEXT;

    -- Configuration
    v_is_asc BOOLEAN;
    v_prefix TEXT;
    v_start TEXT;
    v_upper_bound TEXT;
    v_file_batch_size INT;

    -- Seek state
    v_next_seek TEXT;
    v_count INT := 0;

    -- Dynamic SQL for batch query only
    v_batch_query TEXT;

BEGIN
    -- ========================================================================
    -- INITIALIZATION
    -- ========================================================================
    v_is_asc := lower(coalesce(sort_order, 'asc')) = 'asc';
    v_prefix := coalesce(prefix_param, '');
    v_start := CASE WHEN coalesce(next_token, '') <> '' THEN next_token ELSE coalesce(start_after, '') END;
    v_file_batch_size := LEAST(GREATEST(max_keys * 2, 100), 1000);

    -- Calculate upper bound for prefix filtering (bytewise, using COLLATE "C")
    IF v_prefix = '' THEN
        v_upper_bound := NULL;
    ELSIF right(v_prefix, 1) = delimiter_param THEN
        v_upper_bound := left(v_prefix, -1) || chr(ascii(delimiter_param) + 1);
    ELSE
        v_upper_bound := left(v_prefix, -1) || chr(ascii(right(v_prefix, 1)) + 1);
    END IF;

    -- Build batch query (dynamic SQL - called infrequently, amortized over many rows)
    IF v_is_asc THEN
        IF v_upper_bound IS NOT NULL THEN
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND o.name COLLATE "C" >= $2 ' ||
                'AND o.name COLLATE "C" < $3 ORDER BY o.name COLLATE "C" ASC LIMIT $4';
        ELSE
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND o.name COLLATE "C" >= $2 ' ||
                'ORDER BY o.name COLLATE "C" ASC LIMIT $4';
        END IF;
    ELSE
        IF v_upper_bound IS NOT NULL THEN
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND o.name COLLATE "C" < $2 ' ||
                'AND o.name COLLATE "C" >= $3 ORDER BY o.name COLLATE "C" DESC LIMIT $4';
        ELSE
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND o.name COLLATE "C" < $2 ' ||
                'ORDER BY o.name COLLATE "C" DESC LIMIT $4';
        END IF;
    END IF;

    -- ========================================================================
    -- SEEK INITIALIZATION: Determine starting position
    -- ========================================================================
    IF v_start = '' THEN
        IF v_is_asc THEN
            v_next_seek := v_prefix;
        ELSE
            -- DESC without cursor: find the last item in range
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_next_seek FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" >= v_prefix AND o.name COLLATE "C" < v_upper_bound
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            ELSIF v_prefix <> '' THEN
                SELECT o.name INTO v_next_seek FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" >= v_prefix
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            ELSE
                SELECT o.name INTO v_next_seek FROM storage.objects o
                WHERE o.bucket_id = _bucket_id
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            END IF;

            IF v_next_seek IS NOT NULL THEN
                v_next_seek := v_next_seek || delimiter_param;
            ELSE
                RETURN;
            END IF;
        END IF;
    ELSE
        -- Cursor provided: determine if it refers to a folder or leaf
        IF EXISTS (
            SELECT 1 FROM storage.objects o
            WHERE o.bucket_id = _bucket_id
              AND o.name COLLATE "C" LIKE v_start || delimiter_param || '%'
            LIMIT 1
        ) THEN
            -- Cursor refers to a folder
            IF v_is_asc THEN
                v_next_seek := v_start || chr(ascii(delimiter_param) + 1);
            ELSE
                v_next_seek := v_start || delimiter_param;
            END IF;
        ELSE
            -- Cursor refers to a leaf object
            IF v_is_asc THEN
                v_next_seek := v_start || delimiter_param;
            ELSE
                v_next_seek := v_start;
            END IF;
        END IF;
    END IF;

    -- ========================================================================
    -- MAIN LOOP: Hybrid peek-then-batch algorithm
    -- Uses STATIC SQL for peek (hot path) and DYNAMIC SQL for batch
    -- ========================================================================
    LOOP
        EXIT WHEN v_count >= max_keys;

        -- STEP 1: PEEK using STATIC SQL (plan cached, very fast)
        IF v_is_asc THEN
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" >= v_next_seek AND o.name COLLATE "C" < v_upper_bound
                ORDER BY o.name COLLATE "C" ASC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" >= v_next_seek
                ORDER BY o.name COLLATE "C" ASC LIMIT 1;
            END IF;
        ELSE
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" < v_next_seek AND o.name COLLATE "C" >= v_prefix
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            ELSIF v_prefix <> '' THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" < v_next_seek AND o.name COLLATE "C" >= v_prefix
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" < v_next_seek
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            END IF;
        END IF;

        EXIT WHEN v_peek_name IS NULL;

        -- STEP 2: Check if this is a FOLDER or FILE
        v_common_prefix := storage.get_common_prefix(v_peek_name, v_prefix, delimiter_param);

        IF v_common_prefix IS NOT NULL THEN
            -- FOLDER: Emit and skip to next folder (no heap access needed)
            name := rtrim(v_common_prefix, delimiter_param);
            id := NULL;
            updated_at := NULL;
            created_at := NULL;
            last_accessed_at := NULL;
            metadata := NULL;
            RETURN NEXT;
            v_count := v_count + 1;

            -- Advance seek past the folder range
            IF v_is_asc THEN
                v_next_seek := left(v_common_prefix, -1) || chr(ascii(delimiter_param) + 1);
            ELSE
                v_next_seek := v_common_prefix;
            END IF;
        ELSE
            -- FILE: Batch fetch using DYNAMIC SQL (overhead amortized over many rows)
            -- For ASC: upper_bound is the exclusive upper limit (< condition)
            -- For DESC: prefix is the inclusive lower limit (>= condition)
            FOR v_current IN EXECUTE v_batch_query USING _bucket_id, v_next_seek,
                CASE WHEN v_is_asc THEN COALESCE(v_upper_bound, v_prefix) ELSE v_prefix END, v_file_batch_size
            LOOP
                v_common_prefix := storage.get_common_prefix(v_current.name, v_prefix, delimiter_param);

                IF v_common_prefix IS NOT NULL THEN
                    -- Hit a folder: exit batch, let peek handle it
                    v_next_seek := v_current.name;
                    EXIT;
                END IF;

                -- Emit file
                name := v_current.name;
                id := v_current.id;
                updated_at := v_current.updated_at;
                created_at := v_current.created_at;
                last_accessed_at := v_current.last_accessed_at;
                metadata := v_current.metadata;
                RETURN NEXT;
                v_count := v_count + 1;

                -- Advance seek past this file
                IF v_is_asc THEN
                    v_next_seek := v_current.name || delimiter_param;
                ELSE
                    v_next_seek := v_current.name;
                END IF;

                EXIT WHEN v_count >= max_keys;
            END LOOP;
        END IF;
    END LOOP;
END;
$_$;


ALTER FUNCTION storage.list_objects_with_delimiter(_bucket_id text, prefix_param text, delimiter_param text, max_keys integer, start_after text, next_token text, sort_order text) OWNER TO supabase_storage_admin;

--
--

CREATE FUNCTION storage.operation() RETURNS text
    LANGUAGE plpgsql STABLE
    AS $$
BEGIN
    RETURN current_setting('storage.operation', true);
END;
$$;


ALTER FUNCTION storage.operation() OWNER TO supabase_storage_admin;

--
--

CREATE FUNCTION storage.protect_delete() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Check if storage.allow_delete_query is set to 'true'
    IF COALESCE(current_setting('storage.allow_delete_query', true), 'false') != 'true' THEN
        RAISE EXCEPTION 'Direct deletion from storage tables is not allowed. Use the Storage API instead.'
            USING HINT = 'This prevents accidental data loss from orphaned objects.',
                  ERRCODE = '42501';
    END IF;
    RETURN NULL;
END;
$$;


ALTER FUNCTION storage.protect_delete() OWNER TO supabase_storage_admin;

--
--

CREATE FUNCTION storage.search(prefix text, bucketname text, limits integer DEFAULT 100, levels integer DEFAULT 1, offsets integer DEFAULT 0, search text DEFAULT ''::text, sortcolumn text DEFAULT 'name'::text, sortorder text DEFAULT 'asc'::text) RETURNS TABLE(name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $_$
DECLARE
    v_peek_name TEXT;
    v_current RECORD;
    v_common_prefix TEXT;
    v_delimiter CONSTANT TEXT := '/';

    -- Configuration
    v_limit INT;
    v_prefix TEXT;
    v_prefix_lower TEXT;
    v_is_asc BOOLEAN;
    v_order_by TEXT;
    v_sort_order TEXT;
    v_upper_bound TEXT;
    v_file_batch_size INT;

    -- Dynamic SQL for batch query only
    v_batch_query TEXT;

    -- Seek state
    v_next_seek TEXT;
    v_count INT := 0;
    v_skipped INT := 0;
BEGIN
    -- ========================================================================
    -- INITIALIZATION
    -- ========================================================================
    v_limit := LEAST(coalesce(limits, 100), 1500);
    v_prefix := coalesce(prefix, '') || coalesce(search, '');
    v_prefix_lower := lower(v_prefix);
    v_is_asc := lower(coalesce(sortorder, 'asc')) = 'asc';
    v_file_batch_size := LEAST(GREATEST(v_limit * 2, 100), 1000);

    -- Validate sort column
    CASE lower(coalesce(sortcolumn, 'name'))
        WHEN 'name' THEN v_order_by := 'name';
        WHEN 'updated_at' THEN v_order_by := 'updated_at';
        WHEN 'created_at' THEN v_order_by := 'created_at';
        WHEN 'last_accessed_at' THEN v_order_by := 'last_accessed_at';
        ELSE v_order_by := 'name';
    END CASE;

    v_sort_order := CASE WHEN v_is_asc THEN 'asc' ELSE 'desc' END;

    -- ========================================================================
    -- NON-NAME SORTING: Use path_tokens approach (unchanged)
    -- ========================================================================
    IF v_order_by != 'name' THEN
        RETURN QUERY EXECUTE format(
            $sql$
            WITH folders AS (
                SELECT path_tokens[$1] AS folder
                FROM storage.objects
                WHERE objects.name ILIKE $2 || '%%'
                  AND bucket_id = $3
                  AND array_length(objects.path_tokens, 1) <> $1
                GROUP BY folder
                ORDER BY folder %s
            )
            (SELECT folder AS "name",
                   NULL::uuid AS id,
                   NULL::timestamptz AS updated_at,
                   NULL::timestamptz AS created_at,
                   NULL::timestamptz AS last_accessed_at,
                   NULL::jsonb AS metadata FROM folders)
            UNION ALL
            (SELECT path_tokens[$1] AS "name",
                   id, updated_at, created_at, last_accessed_at, metadata
             FROM storage.objects
             WHERE objects.name ILIKE $2 || '%%'
               AND bucket_id = $3
               AND array_length(objects.path_tokens, 1) = $1
             ORDER BY %I %s)
            LIMIT $4 OFFSET $5
            $sql$, v_sort_order, v_order_by, v_sort_order
        ) USING levels, v_prefix, bucketname, v_limit, offsets;
        RETURN;
    END IF;

    -- ========================================================================
    -- NAME SORTING: Hybrid skip-scan with batch optimization
    -- ========================================================================

    -- Calculate upper bound for prefix filtering
    IF v_prefix_lower = '' THEN
        v_upper_bound := NULL;
    ELSIF right(v_prefix_lower, 1) = v_delimiter THEN
        v_upper_bound := left(v_prefix_lower, -1) || chr(ascii(v_delimiter) + 1);
    ELSE
        v_upper_bound := left(v_prefix_lower, -1) || chr(ascii(right(v_prefix_lower, 1)) + 1);
    END IF;

    -- Build batch query (dynamic SQL - called infrequently, amortized over many rows)
    IF v_is_asc THEN
        IF v_upper_bound IS NOT NULL THEN
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" >= $2 ' ||
                'AND lower(o.name) COLLATE "C" < $3 ORDER BY lower(o.name) COLLATE "C" ASC LIMIT $4';
        ELSE
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" >= $2 ' ||
                'ORDER BY lower(o.name) COLLATE "C" ASC LIMIT $4';
        END IF;
    ELSE
        IF v_upper_bound IS NOT NULL THEN
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" < $2 ' ||
                'AND lower(o.name) COLLATE "C" >= $3 ORDER BY lower(o.name) COLLATE "C" DESC LIMIT $4';
        ELSE
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" < $2 ' ||
                'ORDER BY lower(o.name) COLLATE "C" DESC LIMIT $4';
        END IF;
    END IF;

    -- Initialize seek position
    IF v_is_asc THEN
        v_next_seek := v_prefix_lower;
    ELSE
        -- DESC: find the last item in range first (static SQL)
        IF v_upper_bound IS NOT NULL THEN
            SELECT o.name INTO v_peek_name FROM storage.objects o
            WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_prefix_lower AND lower(o.name) COLLATE "C" < v_upper_bound
            ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
        ELSIF v_prefix_lower <> '' THEN
            SELECT o.name INTO v_peek_name FROM storage.objects o
            WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_prefix_lower
            ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
        ELSE
            SELECT o.name INTO v_peek_name FROM storage.objects o
            WHERE o.bucket_id = bucketname
            ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
        END IF;

        IF v_peek_name IS NOT NULL THEN
            v_next_seek := lower(v_peek_name) || v_delimiter;
        ELSE
            RETURN;
        END IF;
    END IF;

    -- ========================================================================
    -- MAIN LOOP: Hybrid peek-then-batch algorithm
    -- Uses STATIC SQL for peek (hot path) and DYNAMIC SQL for batch
    -- ========================================================================
    LOOP
        EXIT WHEN v_count >= v_limit;

        -- STEP 1: PEEK using STATIC SQL (plan cached, very fast)
        IF v_is_asc THEN
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_next_seek AND lower(o.name) COLLATE "C" < v_upper_bound
                ORDER BY lower(o.name) COLLATE "C" ASC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_next_seek
                ORDER BY lower(o.name) COLLATE "C" ASC LIMIT 1;
            END IF;
        ELSE
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" < v_next_seek AND lower(o.name) COLLATE "C" >= v_prefix_lower
                ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
            ELSIF v_prefix_lower <> '' THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" < v_next_seek AND lower(o.name) COLLATE "C" >= v_prefix_lower
                ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" < v_next_seek
                ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
            END IF;
        END IF;

        EXIT WHEN v_peek_name IS NULL;

        -- STEP 2: Check if this is a FOLDER or FILE
        v_common_prefix := storage.get_common_prefix(lower(v_peek_name), v_prefix_lower, v_delimiter);

        IF v_common_prefix IS NOT NULL THEN
            -- FOLDER: Handle offset, emit if needed, skip to next folder
            IF v_skipped < offsets THEN
                v_skipped := v_skipped + 1;
            ELSE
                name := split_part(rtrim(storage.get_common_prefix(v_peek_name, v_prefix, v_delimiter), v_delimiter), v_delimiter, levels);
                id := NULL;
                updated_at := NULL;
                created_at := NULL;
                last_accessed_at := NULL;
                metadata := NULL;
                RETURN NEXT;
                v_count := v_count + 1;
            END IF;

            -- Advance seek past the folder range
            IF v_is_asc THEN
                v_next_seek := lower(left(v_common_prefix, -1)) || chr(ascii(v_delimiter) + 1);
            ELSE
                v_next_seek := lower(v_common_prefix);
            END IF;
        ELSE
            -- FILE: Batch fetch using DYNAMIC SQL (overhead amortized over many rows)
            -- For ASC: upper_bound is the exclusive upper limit (< condition)
            -- For DESC: prefix_lower is the inclusive lower limit (>= condition)
            FOR v_current IN EXECUTE v_batch_query
                USING bucketname, v_next_seek,
                    CASE WHEN v_is_asc THEN COALESCE(v_upper_bound, v_prefix_lower) ELSE v_prefix_lower END, v_file_batch_size
            LOOP
                v_common_prefix := storage.get_common_prefix(lower(v_current.name), v_prefix_lower, v_delimiter);

                IF v_common_prefix IS NOT NULL THEN
                    -- Hit a folder: exit batch, let peek handle it
                    v_next_seek := lower(v_current.name);
                    EXIT;
                END IF;

                -- Handle offset skipping
                IF v_skipped < offsets THEN
                    v_skipped := v_skipped + 1;
                ELSE
                    -- Emit file
                    name := split_part(v_current.name, v_delimiter, levels);
                    id := v_current.id;
                    updated_at := v_current.updated_at;
                    created_at := v_current.created_at;
                    last_accessed_at := v_current.last_accessed_at;
                    metadata := v_current.metadata;
                    RETURN NEXT;
                    v_count := v_count + 1;
                END IF;

                -- Advance seek past this file
                IF v_is_asc THEN
                    v_next_seek := lower(v_current.name) || v_delimiter;
                ELSE
                    v_next_seek := lower(v_current.name);
                END IF;

                EXIT WHEN v_count >= v_limit;
            END LOOP;
        END IF;
    END LOOP;
END;
$_$;


ALTER FUNCTION storage.search(prefix text, bucketname text, limits integer, levels integer, offsets integer, search text, sortcolumn text, sortorder text) OWNER TO supabase_storage_admin;

--
--

CREATE FUNCTION storage.search_by_timestamp(p_prefix text, p_bucket_id text, p_limit integer, p_level integer, p_start_after text, p_sort_order text, p_sort_column text, p_sort_column_after text) RETURNS TABLE(key text, name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $_$
DECLARE
    v_cursor_op text;
    v_query text;
    v_prefix text;
BEGIN
    v_prefix := coalesce(p_prefix, '');

    IF p_sort_order = 'asc' THEN
        v_cursor_op := '>';
    ELSE
        v_cursor_op := '<';
    END IF;

    v_query := format($sql$
        WITH raw_objects AS (
            SELECT
                o.name AS obj_name,
                o.id AS obj_id,
                o.updated_at AS obj_updated_at,
                o.created_at AS obj_created_at,
                o.last_accessed_at AS obj_last_accessed_at,
                o.metadata AS obj_metadata,
                storage.get_common_prefix(o.name, $1, '/') AS common_prefix
            FROM storage.objects o
            WHERE o.bucket_id = $2
              AND o.name COLLATE "C" LIKE $1 || '%%'
        ),
        -- Aggregate common prefixes (folders)
        -- Both created_at and updated_at use MIN(obj_created_at) to match the old prefixes table behavior
        aggregated_prefixes AS (
            SELECT
                rtrim(common_prefix, '/') AS name,
                NULL::uuid AS id,
                MIN(obj_created_at) AS updated_at,
                MIN(obj_created_at) AS created_at,
                NULL::timestamptz AS last_accessed_at,
                NULL::jsonb AS metadata,
                TRUE AS is_prefix
            FROM raw_objects
            WHERE common_prefix IS NOT NULL
            GROUP BY common_prefix
        ),
        leaf_objects AS (
            SELECT
                obj_name AS name,
                obj_id AS id,
                obj_updated_at AS updated_at,
                obj_created_at AS created_at,
                obj_last_accessed_at AS last_accessed_at,
                obj_metadata AS metadata,
                FALSE AS is_prefix
            FROM raw_objects
            WHERE common_prefix IS NULL
        ),
        combined AS (
            SELECT * FROM aggregated_prefixes
            UNION ALL
            SELECT * FROM leaf_objects
        ),
        filtered AS (
            SELECT *
            FROM combined
            WHERE (
                $5 = ''
                OR ROW(
                    date_trunc('milliseconds', %I),
                    name COLLATE "C"
                ) %s ROW(
                    COALESCE(NULLIF($6, '')::timestamptz, 'epoch'::timestamptz),
                    $5
                )
            )
        )
        SELECT
            split_part(name, '/', $3) AS key,
            name,
            id,
            updated_at,
            created_at,
            last_accessed_at,
            metadata
        FROM filtered
        ORDER BY
            COALESCE(date_trunc('milliseconds', %I), 'epoch'::timestamptz) %s,
            name COLLATE "C" %s
        LIMIT $4
    $sql$,
        p_sort_column,
        v_cursor_op,
        p_sort_column,
        p_sort_order,
        p_sort_order
    );

    RETURN QUERY EXECUTE v_query
    USING v_prefix, p_bucket_id, p_level, p_limit, p_start_after, p_sort_column_after;
END;
$_$;


ALTER FUNCTION storage.search_by_timestamp(p_prefix text, p_bucket_id text, p_limit integer, p_level integer, p_start_after text, p_sort_order text, p_sort_column text, p_sort_column_after text) OWNER TO supabase_storage_admin;

--
--

CREATE FUNCTION storage.search_v2(prefix text, bucket_name text, limits integer DEFAULT 100, levels integer DEFAULT 1, start_after text DEFAULT ''::text, sort_order text DEFAULT 'asc'::text, sort_column text DEFAULT 'name'::text, sort_column_after text DEFAULT ''::text) RETURNS TABLE(key text, name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $$
DECLARE
    v_sort_col text;
    v_sort_ord text;
    v_limit int;
BEGIN
    -- Cap limit to maximum of 1500 records
    v_limit := LEAST(coalesce(limits, 100), 1500);

    -- Validate and normalize sort_order
    v_sort_ord := lower(coalesce(sort_order, 'asc'));
    IF v_sort_ord NOT IN ('asc', 'desc') THEN
        v_sort_ord := 'asc';
    END IF;

    -- Validate and normalize sort_column
    v_sort_col := lower(coalesce(sort_column, 'name'));
    IF v_sort_col NOT IN ('name', 'updated_at', 'created_at') THEN
        v_sort_col := 'name';
    END IF;

    -- Route to appropriate implementation
    IF v_sort_col = 'name' THEN
        -- Use list_objects_with_delimiter for name sorting (most efficient: O(k * log n))
        RETURN QUERY
        SELECT
            split_part(l.name, '/', levels) AS key,
            l.name AS name,
            l.id,
            l.updated_at,
            l.created_at,
            l.last_accessed_at,
            l.metadata
        FROM storage.list_objects_with_delimiter(
            bucket_name,
            coalesce(prefix, ''),
            '/',
            v_limit,
            start_after,
            '',
            v_sort_ord
        ) l;
    ELSE
        -- Use aggregation approach for timestamp sorting
        -- Not efficient for large datasets but supports correct pagination
        RETURN QUERY SELECT * FROM storage.search_by_timestamp(
            prefix, bucket_name, v_limit, levels, start_after,
            v_sort_ord, v_sort_col, sort_column_after
        );
    END IF;
END;
$$;


ALTER FUNCTION storage.search_v2(prefix text, bucket_name text, limits integer, levels integer, start_after text, sort_order text, sort_column text, sort_column_after text) OWNER TO supabase_storage_admin;

--
--

CREATE FUNCTION storage.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW; 
END;
$$;


ALTER FUNCTION storage.update_updated_at_column() OWNER TO supabase_storage_admin;

--
--

CREATE TABLE auth.audit_log_entries (
    instance_id uuid,
    id uuid NOT NULL,
    payload json,
    created_at timestamp with time zone,
    ip_address character varying(64) DEFAULT ''::character varying NOT NULL
);


ALTER TABLE auth.audit_log_entries OWNER TO supabase_auth_admin;

--
--

COMMENT ON TABLE auth.audit_log_entries IS 'Auth: Audit trail for user actions.';


--
--

CREATE TABLE auth.custom_oauth_providers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    provider_type text NOT NULL,
    identifier text NOT NULL,
    name text NOT NULL,
    client_id text NOT NULL,
    client_secret text NOT NULL,
    acceptable_client_ids text[] DEFAULT '{}'::text[] NOT NULL,
    scopes text[] DEFAULT '{}'::text[] NOT NULL,
    pkce_enabled boolean DEFAULT true NOT NULL,
    attribute_mapping jsonb DEFAULT '{}'::jsonb NOT NULL,
    authorization_params jsonb DEFAULT '{}'::jsonb NOT NULL,
    enabled boolean DEFAULT true NOT NULL,
    email_optional boolean DEFAULT false NOT NULL,
    issuer text,
    discovery_url text,
    skip_nonce_check boolean DEFAULT false NOT NULL,
    cached_discovery jsonb,
    discovery_cached_at timestamp with time zone,
    authorization_url text,
    token_url text,
    userinfo_url text,
    jwks_uri text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT custom_oauth_providers_authorization_url_https CHECK (((authorization_url IS NULL) OR (authorization_url ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_authorization_url_length CHECK (((authorization_url IS NULL) OR (char_length(authorization_url) <= 2048))),
    CONSTRAINT custom_oauth_providers_client_id_length CHECK (((char_length(client_id) >= 1) AND (char_length(client_id) <= 512))),
    CONSTRAINT custom_oauth_providers_discovery_url_length CHECK (((discovery_url IS NULL) OR (char_length(discovery_url) <= 2048))),
    CONSTRAINT custom_oauth_providers_identifier_format CHECK ((identifier ~ '^[a-z0-9][a-z0-9:-]{0,48}[a-z0-9]$'::text)),
    CONSTRAINT custom_oauth_providers_issuer_length CHECK (((issuer IS NULL) OR ((char_length(issuer) >= 1) AND (char_length(issuer) <= 2048)))),
    CONSTRAINT custom_oauth_providers_jwks_uri_https CHECK (((jwks_uri IS NULL) OR (jwks_uri ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_jwks_uri_length CHECK (((jwks_uri IS NULL) OR (char_length(jwks_uri) <= 2048))),
    CONSTRAINT custom_oauth_providers_name_length CHECK (((char_length(name) >= 1) AND (char_length(name) <= 100))),
    CONSTRAINT custom_oauth_providers_oauth2_requires_endpoints CHECK (((provider_type <> 'oauth2'::text) OR ((authorization_url IS NOT NULL) AND (token_url IS NOT NULL) AND (userinfo_url IS NOT NULL)))),
    CONSTRAINT custom_oauth_providers_oidc_discovery_url_https CHECK (((provider_type <> 'oidc'::text) OR (discovery_url IS NULL) OR (discovery_url ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_oidc_issuer_https CHECK (((provider_type <> 'oidc'::text) OR (issuer IS NULL) OR (issuer ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_oidc_requires_issuer CHECK (((provider_type <> 'oidc'::text) OR (issuer IS NOT NULL))),
    CONSTRAINT custom_oauth_providers_provider_type_check CHECK ((provider_type = ANY (ARRAY['oauth2'::text, 'oidc'::text]))),
    CONSTRAINT custom_oauth_providers_token_url_https CHECK (((token_url IS NULL) OR (token_url ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_token_url_length CHECK (((token_url IS NULL) OR (char_length(token_url) <= 2048))),
    CONSTRAINT custom_oauth_providers_userinfo_url_https CHECK (((userinfo_url IS NULL) OR (userinfo_url ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_userinfo_url_length CHECK (((userinfo_url IS NULL) OR (char_length(userinfo_url) <= 2048)))
);


ALTER TABLE auth.custom_oauth_providers OWNER TO supabase_auth_admin;

--
--

CREATE TABLE auth.flow_state (
    id uuid NOT NULL,
    user_id uuid,
    auth_code text,
    code_challenge_method auth.code_challenge_method,
    code_challenge text,
    provider_type text NOT NULL,
    provider_access_token text,
    provider_refresh_token text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    authentication_method text NOT NULL,
    auth_code_issued_at timestamp with time zone,
    invite_token text,
    referrer text,
    oauth_client_state_id uuid,
    linking_target_id uuid,
    email_optional boolean DEFAULT false NOT NULL
);


ALTER TABLE auth.flow_state OWNER TO supabase_auth_admin;

--
--

COMMENT ON TABLE auth.flow_state IS 'Stores metadata for all OAuth/SSO login flows';


--
--

CREATE TABLE auth.identities (
    provider_id text NOT NULL,
    user_id uuid NOT NULL,
    identity_data jsonb NOT NULL,
    provider text NOT NULL,
    last_sign_in_at timestamp with time zone,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    email text GENERATED ALWAYS AS (lower((identity_data ->> 'email'::text))) STORED,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


ALTER TABLE auth.identities OWNER TO supabase_auth_admin;

--
--

COMMENT ON TABLE auth.identities IS 'Auth: Stores identities associated to a user.';


--
--

COMMENT ON COLUMN auth.identities.email IS 'Auth: Email is a generated column that references the optional email property in the identity_data';


--
--

CREATE TABLE auth.instances (
    id uuid NOT NULL,
    uuid uuid,
    raw_base_config text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


ALTER TABLE auth.instances OWNER TO supabase_auth_admin;

--
--

COMMENT ON TABLE auth.instances IS 'Auth: Manages users across multiple sites.';


--
--

CREATE TABLE auth.mfa_amr_claims (
    session_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    authentication_method text NOT NULL,
    id uuid NOT NULL
);


ALTER TABLE auth.mfa_amr_claims OWNER TO supabase_auth_admin;

--
--

COMMENT ON TABLE auth.mfa_amr_claims IS 'auth: stores authenticator method reference claims for multi factor authentication';


--
--

CREATE TABLE auth.mfa_challenges (
    id uuid NOT NULL,
    factor_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    verified_at timestamp with time zone,
    ip_address inet NOT NULL,
    otp_code text,
    web_authn_session_data jsonb
);


ALTER TABLE auth.mfa_challenges OWNER TO supabase_auth_admin;

--
--

COMMENT ON TABLE auth.mfa_challenges IS 'auth: stores metadata about challenge requests made';


--
--

CREATE TABLE auth.mfa_factors (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    friendly_name text,
    factor_type auth.factor_type NOT NULL,
    status auth.factor_status NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    secret text,
    phone text,
    last_challenged_at timestamp with time zone,
    web_authn_credential jsonb,
    web_authn_aaguid uuid,
    last_webauthn_challenge_data jsonb
);


ALTER TABLE auth.mfa_factors OWNER TO supabase_auth_admin;

--
--

COMMENT ON TABLE auth.mfa_factors IS 'auth: stores metadata about factors';


--
--

COMMENT ON COLUMN auth.mfa_factors.last_webauthn_challenge_data IS 'Stores the latest WebAuthn challenge data including attestation/assertion for customer verification';


--
--

CREATE TABLE auth.oauth_authorizations (
    id uuid NOT NULL,
    authorization_id text NOT NULL,
    client_id uuid NOT NULL,
    user_id uuid,
    redirect_uri text NOT NULL,
    scope text NOT NULL,
    state text,
    resource text,
    code_challenge text,
    code_challenge_method auth.code_challenge_method,
    response_type auth.oauth_response_type DEFAULT 'code'::auth.oauth_response_type NOT NULL,
    status auth.oauth_authorization_status DEFAULT 'pending'::auth.oauth_authorization_status NOT NULL,
    authorization_code text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone DEFAULT (now() + '00:03:00'::interval) NOT NULL,
    approved_at timestamp with time zone,
    nonce text,
    CONSTRAINT oauth_authorizations_authorization_code_length CHECK ((char_length(authorization_code) <= 255)),
    CONSTRAINT oauth_authorizations_code_challenge_length CHECK ((char_length(code_challenge) <= 128)),
    CONSTRAINT oauth_authorizations_expires_at_future CHECK ((expires_at > created_at)),
    CONSTRAINT oauth_authorizations_nonce_length CHECK ((char_length(nonce) <= 255)),
    CONSTRAINT oauth_authorizations_redirect_uri_length CHECK ((char_length(redirect_uri) <= 2048)),
    CONSTRAINT oauth_authorizations_resource_length CHECK ((char_length(resource) <= 2048)),
    CONSTRAINT oauth_authorizations_scope_length CHECK ((char_length(scope) <= 4096)),
    CONSTRAINT oauth_authorizations_state_length CHECK ((char_length(state) <= 4096))
);


ALTER TABLE auth.oauth_authorizations OWNER TO supabase_auth_admin;

--
--

CREATE TABLE auth.oauth_client_states (
    id uuid NOT NULL,
    provider_type text NOT NULL,
    code_verifier text,
    created_at timestamp with time zone NOT NULL
);


ALTER TABLE auth.oauth_client_states OWNER TO supabase_auth_admin;

--
--

COMMENT ON TABLE auth.oauth_client_states IS 'Stores OAuth states for third-party provider authentication flows where Supabase acts as the OAuth client.';


--
--

CREATE TABLE auth.oauth_clients (
    id uuid NOT NULL,
    client_secret_hash text,
    registration_type auth.oauth_registration_type NOT NULL,
    redirect_uris text NOT NULL,
    grant_types text NOT NULL,
    client_name text,
    client_uri text,
    logo_uri text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    client_type auth.oauth_client_type DEFAULT 'confidential'::auth.oauth_client_type NOT NULL,
    token_endpoint_auth_method text NOT NULL,
    CONSTRAINT oauth_clients_client_name_length CHECK ((char_length(client_name) <= 1024)),
    CONSTRAINT oauth_clients_client_uri_length CHECK ((char_length(client_uri) <= 2048)),
    CONSTRAINT oauth_clients_logo_uri_length CHECK ((char_length(logo_uri) <= 2048)),
    CONSTRAINT oauth_clients_token_endpoint_auth_method_check CHECK ((token_endpoint_auth_method = ANY (ARRAY['client_secret_basic'::text, 'client_secret_post'::text, 'none'::text])))
);


ALTER TABLE auth.oauth_clients OWNER TO supabase_auth_admin;

--
--

CREATE TABLE auth.oauth_consents (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    client_id uuid NOT NULL,
    scopes text NOT NULL,
    granted_at timestamp with time zone DEFAULT now() NOT NULL,
    revoked_at timestamp with time zone,
    CONSTRAINT oauth_consents_revoked_after_granted CHECK (((revoked_at IS NULL) OR (revoked_at >= granted_at))),
    CONSTRAINT oauth_consents_scopes_length CHECK ((char_length(scopes) <= 2048)),
    CONSTRAINT oauth_consents_scopes_not_empty CHECK ((char_length(TRIM(BOTH FROM scopes)) > 0))
);


ALTER TABLE auth.oauth_consents OWNER TO supabase_auth_admin;

--
--

CREATE TABLE auth.one_time_tokens (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    token_type auth.one_time_token_type NOT NULL,
    token_hash text NOT NULL,
    relates_to text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT one_time_tokens_token_hash_check CHECK ((char_length(token_hash) > 0))
);


ALTER TABLE auth.one_time_tokens OWNER TO supabase_auth_admin;

--
--

CREATE TABLE auth.refresh_tokens (
    instance_id uuid,
    id bigint NOT NULL,
    token character varying(255),
    user_id character varying(255),
    revoked boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    parent character varying(255),
    session_id uuid
);


ALTER TABLE auth.refresh_tokens OWNER TO supabase_auth_admin;

--
--

COMMENT ON TABLE auth.refresh_tokens IS 'Auth: Store of tokens used to refresh JWT tokens once they expire.';


--
--

CREATE SEQUENCE auth.refresh_tokens_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE auth.refresh_tokens_id_seq OWNER TO supabase_auth_admin;

--
--

ALTER SEQUENCE auth.refresh_tokens_id_seq OWNED BY auth.refresh_tokens.id;


--
--

CREATE TABLE auth.saml_providers (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    entity_id text NOT NULL,
    metadata_xml text NOT NULL,
    metadata_url text,
    attribute_mapping jsonb,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    name_id_format text,
    CONSTRAINT "entity_id not empty" CHECK ((char_length(entity_id) > 0)),
    CONSTRAINT "metadata_url not empty" CHECK (((metadata_url = NULL::text) OR (char_length(metadata_url) > 0))),
    CONSTRAINT "metadata_xml not empty" CHECK ((char_length(metadata_xml) > 0))
);


ALTER TABLE auth.saml_providers OWNER TO supabase_auth_admin;

--
--

COMMENT ON TABLE auth.saml_providers IS 'Auth: Manages SAML Identity Provider connections.';


--
--

CREATE TABLE auth.saml_relay_states (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    request_id text NOT NULL,
    for_email text,
    redirect_to text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    flow_state_id uuid,
    CONSTRAINT "request_id not empty" CHECK ((char_length(request_id) > 0))
);


ALTER TABLE auth.saml_relay_states OWNER TO supabase_auth_admin;

--
--

COMMENT ON TABLE auth.saml_relay_states IS 'Auth: Contains SAML Relay State information for each Service Provider initiated login.';


--
--

CREATE TABLE auth.schema_migrations (
    version character varying(255) NOT NULL
);


ALTER TABLE auth.schema_migrations OWNER TO supabase_auth_admin;

--
--

COMMENT ON TABLE auth.schema_migrations IS 'Auth: Manages updates to the auth system.';


--
--

CREATE TABLE auth.sessions (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    factor_id uuid,
    aal auth.aal_level,
    not_after timestamp with time zone,
    refreshed_at timestamp without time zone,
    user_agent text,
    ip inet,
    tag text,
    oauth_client_id uuid,
    refresh_token_hmac_key text,
    refresh_token_counter bigint,
    scopes text,
    CONSTRAINT sessions_scopes_length CHECK ((char_length(scopes) <= 4096))
);


ALTER TABLE auth.sessions OWNER TO supabase_auth_admin;

--
--

COMMENT ON TABLE auth.sessions IS 'Auth: Stores session data associated to a user.';


--
--

COMMENT ON COLUMN auth.sessions.not_after IS 'Auth: Not after is a nullable column that contains a timestamp after which the session should be regarded as expired.';


--
--

COMMENT ON COLUMN auth.sessions.refresh_token_hmac_key IS 'Holds a HMAC-SHA256 key used to sign refresh tokens for this session.';


--
--

COMMENT ON COLUMN auth.sessions.refresh_token_counter IS 'Holds the ID (counter) of the last issued refresh token.';


--
--

CREATE TABLE auth.sso_domains (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    domain text NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    CONSTRAINT "domain not empty" CHECK ((char_length(domain) > 0))
);


ALTER TABLE auth.sso_domains OWNER TO supabase_auth_admin;

--
--

COMMENT ON TABLE auth.sso_domains IS 'Auth: Manages SSO email address domain mapping to an SSO Identity Provider.';


--
--

CREATE TABLE auth.sso_providers (
    id uuid NOT NULL,
    resource_id text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    disabled boolean,
    CONSTRAINT "resource_id not empty" CHECK (((resource_id = NULL::text) OR (char_length(resource_id) > 0)))
);


ALTER TABLE auth.sso_providers OWNER TO supabase_auth_admin;

--
--

COMMENT ON TABLE auth.sso_providers IS 'Auth: Manages SSO identity provider information; see saml_providers for SAML.';


--
--

COMMENT ON COLUMN auth.sso_providers.resource_id IS 'Auth: Uniquely identifies a SSO provider according to a user-chosen resource ID (case insensitive), useful in infrastructure as code.';


--
--

CREATE TABLE auth.users (
    instance_id uuid,
    id uuid NOT NULL,
    aud character varying(255),
    role character varying(255),
    email character varying(255),
    encrypted_password character varying(255),
    email_confirmed_at timestamp with time zone,
    invited_at timestamp with time zone,
    confirmation_token character varying(255),
    confirmation_sent_at timestamp with time zone,
    recovery_token character varying(255),
    recovery_sent_at timestamp with time zone,
    email_change_token_new character varying(255),
    email_change character varying(255),
    email_change_sent_at timestamp with time zone,
    last_sign_in_at timestamp with time zone,
    raw_app_meta_data jsonb,
    raw_user_meta_data jsonb,
    is_super_admin boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    phone text DEFAULT NULL::character varying,
    phone_confirmed_at timestamp with time zone,
    phone_change text DEFAULT ''::character varying,
    phone_change_token character varying(255) DEFAULT ''::character varying,
    phone_change_sent_at timestamp with time zone,
    confirmed_at timestamp with time zone GENERATED ALWAYS AS (LEAST(email_confirmed_at, phone_confirmed_at)) STORED,
    email_change_token_current character varying(255) DEFAULT ''::character varying,
    email_change_confirm_status smallint DEFAULT 0,
    banned_until timestamp with time zone,
    reauthentication_token character varying(255) DEFAULT ''::character varying,
    reauthentication_sent_at timestamp with time zone,
    is_sso_user boolean DEFAULT false NOT NULL,
    deleted_at timestamp with time zone,
    is_anonymous boolean DEFAULT false NOT NULL,
    CONSTRAINT users_email_change_confirm_status_check CHECK (((email_change_confirm_status >= 0) AND (email_change_confirm_status <= 2)))
);


ALTER TABLE auth.users OWNER TO supabase_auth_admin;

--
--

COMMENT ON TABLE auth.users IS 'Auth: Stores user login data within a secure schema.';


--
--

COMMENT ON COLUMN auth.users.is_sso_user IS 'Auth: Set this column to true when the account comes from SSO. These accounts can have duplicate emails.';


--
--

CREATE TABLE auth.webauthn_challenges (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    challenge_type text NOT NULL,
    session_data jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    CONSTRAINT webauthn_challenges_challenge_type_check CHECK ((challenge_type = ANY (ARRAY['signup'::text, 'registration'::text, 'authentication'::text])))
);


ALTER TABLE auth.webauthn_challenges OWNER TO supabase_auth_admin;

--
--

CREATE TABLE auth.webauthn_credentials (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    credential_id bytea NOT NULL,
    public_key bytea NOT NULL,
    attestation_type text DEFAULT ''::text NOT NULL,
    aaguid uuid,
    sign_count bigint DEFAULT 0 NOT NULL,
    transports jsonb DEFAULT '[]'::jsonb NOT NULL,
    backup_eligible boolean DEFAULT false NOT NULL,
    backed_up boolean DEFAULT false NOT NULL,
    friendly_name text DEFAULT ''::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    last_used_at timestamp with time zone
);


ALTER TABLE auth.webauthn_credentials OWNER TO supabase_auth_admin;

--
-- Name: ai_chat_usage; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ai_chat_usage (
    user_id uuid NOT NULL,
    usage_date date NOT NULL,
    message_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public.ai_chat_usage OWNER TO postgres;

--
-- Name: birth_profiles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.birth_profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    owner_id uuid,
    label text DEFAULT 'My Chart'::text NOT NULL,
    full_name text,
    relation text DEFAULT 'self'::text,
    date_of_birth date NOT NULL,
    time_of_birth time without time zone,
    birth_city text,
    birth_country text,
    birth_lat numeric(9,6),
    birth_lng numeric(9,6),
    birth_timezone text,
    rashi text,
    sun_rashi text,
    nakshatra text,
    nakshatra_pada smallint,
    nakshatra_lord text,
    lagna text,
    lagna_deg numeric(6,3),
    ayanamsa numeric(6,4),
    chart_data jsonb,
    current_dasha_planet text,
    current_dasha_end_date date,
    next_dasha_planet text,
    is_primary boolean DEFAULT false,
    is_public boolean DEFAULT false,
    session_token text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT birth_profiles_relation_check CHECK ((relation = ANY (ARRAY['self'::text, 'spouse'::text, 'child'::text, 'parent'::text, 'sibling'::text, 'friend'::text, 'other'::text])))
);


ALTER TABLE public.birth_profiles OWNER TO postgres;

--
-- Name: content_meanings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.content_meanings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    entry_id text NOT NULL,
    language text NOT NULL,
    meaning text NOT NULL,
    source_label text,
    source_meaning_hash text,
    source_status text DEFAULT 'ai_generated'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT content_meanings_language_check CHECK ((language = ANY (ARRAY['hi'::text, 'pa'::text]))),
    CONSTRAINT content_meanings_source_status_check CHECK ((source_status = ANY (ARRAY['ai_generated'::text, 'human_reviewed'::text, 'approved'::text])))
);


ALTER TABLE public.content_meanings OWNER TO postgres;

--
-- Name: content_reports; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.content_reports (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    reported_by uuid NOT NULL,
    content_type text NOT NULL,
    content_id text NOT NULL,
    reason text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    admin_note text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    content_author_id uuid,
    CONSTRAINT content_reports_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'reviewed'::text, 'actioned'::text, 'dismissed'::text])))
);


ALTER TABLE public.content_reports OWNER TO postgres;

--
-- Name: daily_quiz; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.daily_quiz (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tradition text NOT NULL,
    language text DEFAULT 'en'::text NOT NULL,
    date date NOT NULL,
    question text NOT NULL,
    options jsonb NOT NULL,
    answer_index smallint NOT NULL,
    explanation text NOT NULL,
    fact text NOT NULL,
    source text NOT NULL,
    generated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT daily_quiz_answer_index_check CHECK (((answer_index >= 0) AND (answer_index <= 3)))
);


ALTER TABLE public.daily_quiz OWNER TO postgres;

--
-- Name: daily_sadhana; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.daily_sadhana (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    date date NOT NULL,
    japa_done boolean DEFAULT false,
    shloka_done boolean DEFAULT false,
    panchang_viewed boolean DEFAULT false,
    any_practice boolean DEFAULT false,
    streak_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    perfect_day_bonus_given boolean DEFAULT false,
    quiz_done boolean DEFAULT false,
    nitya_done boolean DEFAULT false,
    pathshala_done boolean DEFAULT false,
    dharmveer_done boolean DEFAULT false,
    stotram_done boolean DEFAULT false,
    katha_done boolean DEFAULT false,
    stotram_count integer DEFAULT 0,
    katha_count integer DEFAULT 0
);


ALTER TABLE public.daily_sadhana OWNER TO postgres;

--
-- Name: darshan_preferences; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.darshan_preferences (
    user_id uuid NOT NULL,
    stream_id text NOT NULL,
    is_favourite boolean DEFAULT true NOT NULL,
    notify_morning boolean DEFAULT false NOT NULL,
    notify_evening boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.darshan_preferences OWNER TO postgres;

--
-- Name: device_tokens; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.device_tokens (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    player_id text NOT NULL,
    platform text DEFAULT 'web'::text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    registered_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.device_tokens OWNER TO postgres;

--
-- Name: devotional_tracks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.devotional_tracks (
    id text NOT NULL,
    title text NOT NULL,
    title_devanagari text,
    type text NOT NULL,
    deity text,
    tradition text DEFAULT 'hindu'::text NOT NULL,
    mood text[],
    audio_url text,
    duration_secs integer,
    creator text,
    license text NOT NULL,
    attribution_text text,
    source_url text,
    verse_count integer,
    language text DEFAULT 'sanskrit'::text,
    is_active boolean DEFAULT false NOT NULL,
    sort_order integer DEFAULT 100,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT devotional_tracks_tradition_check CHECK ((tradition = ANY (ARRAY['hindu'::text, 'sikh'::text, 'buddhist'::text, 'jain'::text, 'all'::text]))),
    CONSTRAINT devotional_tracks_type_check CHECK ((type = ANY (ARRAY['mantra'::text, 'stotram'::text, 'kirtan'::text, 'bhajan'::text, 'dhyana'::text, 'simran'::text])))
);


ALTER TABLE public.devotional_tracks OWNER TO postgres;

--
-- Name: dharm_veer_daily; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.dharm_veer_daily (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tradition text NOT NULL,
    date date NOT NULL,
    slug text NOT NULL,
    name text NOT NULL,
    name_local text,
    era text,
    tagline text NOT NULL,
    journey text NOT NULL,
    journey_local text,
    trial text NOT NULL,
    trial_local text,
    teaching text NOT NULL,
    teaching_local text,
    moral text NOT NULL,
    moral_local text,
    legacy text,
    legacy_local text,
    quote text,
    quote_local text,
    quote_source text,
    tags text[],
    generated_by text DEFAULT 'ai'::text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.dharm_veer_daily OWNER TO postgres;

--
-- Name: dharm_veers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.dharm_veers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    slug text NOT NULL,
    name text NOT NULL,
    name_local text,
    tradition text NOT NULL,
    era text,
    tagline text NOT NULL,
    journey text NOT NULL,
    journey_local text,
    trial text NOT NULL,
    trial_local text,
    teaching text NOT NULL,
    teaching_local text,
    moral text NOT NULL,
    moral_local text,
    quote text,
    quote_local text,
    quote_source text,
    tags text[] DEFAULT '{}'::text[],
    day_index integer,
    generated_by text DEFAULT 'ai'::text,
    created_at timestamp with time zone DEFAULT now(),
    legacy text,
    legacy_local text,
    illustration_prompt text,
    CONSTRAINT dharm_veers_tradition_check CHECK ((tradition = ANY (ARRAY['hindu'::text, 'sikh'::text, 'buddhist'::text, 'jain'::text, 'sufi'::text, 'tribal'::text])))
);


ALTER TABLE public.dharm_veers OWNER TO postgres;

--
-- Name: event_rsvps; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.event_rsvps (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    post_id uuid NOT NULL,
    user_id uuid NOT NULL,
    status text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT event_rsvps_status_check CHECK ((status = ANY (ARRAY['going'::text, 'interested'::text, 'not_going'::text])))
);


ALTER TABLE public.event_rsvps OWNER TO postgres;

--
-- Name: festivals; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.festivals (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    name text NOT NULL,
    date date NOT NULL,
    emoji text DEFAULT '🪔'::text,
    description text NOT NULL,
    type text DEFAULT 'major'::text,
    year integer DEFAULT EXTRACT(year FROM now()) NOT NULL,
    tradition text,
    is_shared boolean DEFAULT false NOT NULL,
    source_name text,
    source_kind text,
    review_status text,
    reviewed_at timestamp with time zone,
    review_notes text,
    verification_status text,
    verification_confidence text,
    verification_note text,
    suggested_date date,
    verification_run_at timestamp with time zone,
    verification_type text,
    CONSTRAINT festivals_review_status_check CHECK ((review_status = ANY (ARRAY['needs_review'::text, 'reviewed'::text]))),
    CONSTRAINT festivals_source_kind_check CHECK ((source_kind = ANY (ARRAY['curated'::text, 'official'::text, 'partner'::text, 'community_reviewed'::text]))),
    CONSTRAINT festivals_tradition_check CHECK ((tradition = ANY (ARRAY['hindu'::text, 'sikh'::text, 'buddhist'::text, 'jain'::text, 'all'::text]))),
    CONSTRAINT festivals_type_check CHECK ((type = ANY (ARRAY['major'::text, 'vrat'::text, 'regional'::text]))),
    CONSTRAINT festivals_verification_confidence_check CHECK ((verification_confidence = ANY (ARRAY['high'::text, 'medium'::text, 'low'::text]))),
    CONSTRAINT festivals_verification_status_check CHECK ((verification_status = ANY (ARRAY['verified'::text, 'mismatch'::text, 'uncertain'::text, 'not_checked'::text, 'manual_review'::text]))),
    CONSTRAINT festivals_verification_type_check CHECK ((verification_type = ANY (ARRAY['solar_fixed'::text, 'lunar_tithi'::text, 'nakshatra_based'::text, 'regional_calendar'::text, 'historical_commemoration'::text])))
);


ALTER TABLE public.festivals OWNER TO postgres;

--
-- Name: forum_replies; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.forum_replies (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    thread_id uuid NOT NULL,
    author_id uuid NOT NULL,
    body text NOT NULL,
    upvotes integer DEFAULT 0,
    is_accepted boolean DEFAULT false,
    parent_id uuid
);


ALTER TABLE public.forum_replies OWNER TO postgres;

--
-- Name: forum_threads; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.forum_threads (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    author_id uuid NOT NULL,
    category text NOT NULL,
    title text NOT NULL,
    body text NOT NULL,
    upvotes integer DEFAULT 0,
    reply_count integer DEFAULT 0,
    is_answered boolean DEFAULT false,
    is_pinned boolean DEFAULT false,
    tags text[] DEFAULT ARRAY[]::text[],
    sampradaya_filter text
);


ALTER TABLE public.forum_threads OWNER TO postgres;

--
-- Name: guided_path_progress; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.guided_path_progress (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    path_id text NOT NULL,
    status text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    last_interacted_at timestamp with time zone DEFAULT now() NOT NULL,
    completed_at timestamp with time zone,
    current_lesson integer DEFAULT 0 NOT NULL,
    completed_lessons integer[] DEFAULT '{}'::integer[] NOT NULL,
    day_reached integer DEFAULT 1 NOT NULL,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT guided_path_progress_status_check CHECK ((status = ANY (ARRAY['active'::text, 'dismissed'::text, 'completed'::text])))
);


ALTER TABLE public.guided_path_progress OWNER TO postgres;

--
-- Name: COLUMN guided_path_progress.day_reached; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.guided_path_progress.day_reached IS 'Which day of the plan the user has reached (1-indexed). Incremented by the daily cron after each push is sent.';


--
-- Name: COLUMN guided_path_progress.started_at; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.guided_path_progress.started_at IS 'When the user first started this plan (set on upsert, not updated thereafter).';


--
-- Name: hero_assets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.hero_assets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    label text NOT NULL,
    hero_image text NOT NULL,
    hero_alt text NOT NULL,
    object_position text DEFAULT 'center 24%'::text NOT NULL,
    traditions text[] DEFAULT '{}'::text[] NOT NULL,
    sampradayas text[] DEFAULT '{}'::text[] NOT NULL,
    ishta_devatas text[] DEFAULT '{}'::text[] NOT NULL,
    festival_slugs text[] DEFAULT '{}'::text[] NOT NULL,
    tags text[] DEFAULT '{}'::text[] NOT NULL,
    priority integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    uploaded_by text
);


ALTER TABLE public.hero_assets OWNER TO postgres;

--
-- Name: karma_award_log; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.karma_award_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    reason text NOT NULL,
    amount integer NOT NULL,
    awarded_date date NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT karma_award_log_amount_check CHECK (((amount > 0) AND (amount <= 100)))
);


ALTER TABLE public.karma_award_log OWNER TO postgres;

--
-- Name: karma_ledger; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.karma_ledger (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    amount integer NOT NULL,
    reason text NOT NULL,
    source_route text,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.karma_ledger OWNER TO postgres;

--
-- Name: kul_events; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.kul_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    kul_id uuid NOT NULL,
    title text NOT NULL,
    event_type text DEFAULT 'custom'::text NOT NULL,
    event_date date NOT NULL,
    recurring boolean DEFAULT true NOT NULL,
    description text,
    member_id uuid,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT kul_events_event_type_check CHECK ((event_type = ANY (ARRAY['birthday'::text, 'anniversary'::text, 'death_anniversary'::text, 'puja'::text, 'custom'::text])))
);


ALTER TABLE public.kul_events OWNER TO postgres;

--
-- Name: kul_family_members; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.kul_family_members (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    kul_id uuid NOT NULL,
    name text NOT NULL,
    role text,
    gender text,
    birth_year integer,
    birth_date date,
    death_year integer,
    death_date date,
    marriage_date date,
    parent_id uuid,
    spouse_id uuid,
    linked_user_id uuid,
    notes text,
    photo_url text,
    is_alive boolean DEFAULT true NOT NULL,
    generation integer,
    display_order integer DEFAULT 0,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    birth_place text,
    CONSTRAINT kul_family_members_gender_check CHECK ((gender = ANY (ARRAY['male'::text, 'female'::text, 'other'::text])))
);


ALTER TABLE public.kul_family_members OWNER TO postgres;

--
-- Name: COLUMN kul_family_members.birth_place; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.kul_family_members.birth_place IS 'Place of birth for informative lineage tracking.';


--
-- Name: kul_members; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.kul_members (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    kul_id uuid NOT NULL,
    user_id uuid NOT NULL,
    role text DEFAULT 'sadhak'::text NOT NULL,
    joined_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT kul_members_role_check CHECK ((role = ANY (ARRAY['guardian'::text, 'sadhak'::text])))
);


ALTER TABLE public.kul_members OWNER TO postgres;

--
-- Name: mala_sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.mala_sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    mantra text NOT NULL,
    chant_source text,
    count integer DEFAULT 0 NOT NULL,
    target_count integer,
    duration_seconds integer DEFAULT 0,
    notes text,
    share_scope text DEFAULT 'private'::text NOT NULL,
    completed_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    date text,
    rounds integer DEFAULT 0,
    bead_count integer DEFAULT 0,
    mantra_id text,
    duration_secs integer DEFAULT 0,
    mala_id text,
    background_scene text,
    tradition text,
    practice_type text DEFAULT 'mala'::text,
    intention text,
    completion_type text DEFAULT 'completed'::text,
    target_rounds integer,
    completed_rounds integer,
    ambient_id text,
    spiritual_time_window text,
    timezone text,
    source_route text,
    panchang_context jsonb,
    mood_before text,
    mood_after text,
    completed_beads integer,
    spiritual_date date,
    haptics_enabled boolean DEFAULT true,
    CONSTRAINT mala_sessions_bead_count_check CHECK ((bead_count >= 0)),
    CONSTRAINT mala_sessions_completed_beads_check CHECK (((completed_beads IS NULL) OR (completed_beads >= 0))),
    CONSTRAINT mala_sessions_count_check CHECK ((count >= 0)),
    CONSTRAINT mala_sessions_duration_seconds_check CHECK ((duration_seconds >= 0)),
    CONSTRAINT mala_sessions_duration_secs_check CHECK ((duration_secs >= 0)),
    CONSTRAINT mala_sessions_rounds_check CHECK ((rounds >= 0)),
    CONSTRAINT mala_sessions_share_scope_check CHECK ((share_scope = ANY (ARRAY['private'::text, 'kul'::text, 'public'::text])))
);


ALTER TABLE public.mala_sessions OWNER TO postgres;

--
-- Name: user_practice; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_practice (
    user_id uuid NOT NULL,
    preferred_time text DEFAULT 'irregular'::text,
    avg_session_duration_s integer DEFAULT 0,
    consistency_score double precision DEFAULT 0,
    current_streak integer DEFAULT 0,
    longest_streak integer DEFAULT 0,
    primary_path text DEFAULT 'bhakti'::text,
    preferred_deity text DEFAULT 'general'::text,
    tradition text DEFAULT 'general'::text,
    content_depth text DEFAULT 'beginner'::text,
    language_pref text[] DEFAULT ARRAY['english'::text],
    favorite_texts text[] DEFAULT ARRAY[]::text[],
    most_active_day text DEFAULT 'unknown'::text,
    skip_pattern jsonb DEFAULT '{}'::jsonb,
    re_engagement_style text DEFAULT 'unknown'::text,
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.user_practice OWNER TO postgres;

--
-- Name: kul_member_profiles; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.kul_member_profiles WITH (security_invoker='true') AS
 SELECT km.kul_id,
    km.user_id,
    km.role,
    km.joined_at,
    up.tradition,
    up.preferred_deity,
    up.primary_path,
    up.content_depth,
    up.current_streak,
    up.consistency_score,
    up.preferred_time,
    up.avg_session_duration_s,
    up.favorite_texts,
    up.re_engagement_style,
    COALESCE(recent.session_count, (0)::bigint) AS sessions_last_7d,
    COALESCE(recent.total_japa, (0)::bigint) AS japa_last_7d,
    recent.last_mantra
   FROM ((public.kul_members km
     LEFT JOIN public.user_practice up ON ((up.user_id = km.user_id)))
     LEFT JOIN LATERAL ( SELECT count(*) AS session_count,
            sum(ms.count) AS total_japa,
            max(ms.mantra) AS last_mantra
           FROM public.mala_sessions ms
          WHERE ((ms.user_id = km.user_id) AND (ms.completed_at >= (now() - '7 days'::interval)))) recent ON (true));


ALTER VIEW public.kul_member_profiles OWNER TO postgres;

--
-- Name: kul_messages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.kul_messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    kul_id uuid NOT NULL,
    sender_id uuid NOT NULL,
    content text NOT NULL,
    reaction text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.kul_messages OWNER TO postgres;

--
-- Name: kul_tasks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.kul_tasks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    kul_id uuid NOT NULL,
    assigned_by uuid NOT NULL,
    assigned_to uuid NOT NULL,
    title text NOT NULL,
    description text,
    task_type text DEFAULT 'read'::text NOT NULL,
    content_ref text,
    due_date date,
    completed boolean DEFAULT false NOT NULL,
    completed_at timestamp with time zone,
    score integer,
    guardian_note text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT kul_tasks_task_type_check CHECK ((task_type = ANY (ARRAY['read'::text, 'recite'::text, 'practice'::text, 'memorise'::text])))
);


ALTER TABLE public.kul_tasks OWNER TO postgres;

--
-- Name: kul_pending_tasks; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.kul_pending_tasks WITH (security_invoker='true') AS
 SELECT id,
    kul_id,
    assigned_to,
    assigned_by,
    title,
    task_type,
    content_ref,
    due_date,
    score,
    completed,
    guardian_note,
    created_at,
        CASE
            WHEN ((due_date < CURRENT_DATE) AND (NOT completed)) THEN 'overdue'::text
            WHEN (due_date = CURRENT_DATE) THEN 'due_today'::text
            ELSE 'upcoming'::text
        END AS urgency
   FROM public.kul_tasks kt
  WHERE (completed = false);


ALTER VIEW public.kul_pending_tasks OWNER TO postgres;

--
-- Name: kul_practice_today; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.kul_practice_today WITH (security_invoker='true') AS
 SELECT km.kul_id,
    km.user_id,
    km.role,
    COALESCE(sum(ms.count), (0)::bigint) AS japa_count_today,
    count(ms.id) AS sessions_today,
    (count(ms.id) > 0) AS practiced_today
   FROM (public.kul_members km
     LEFT JOIN public.mala_sessions ms ON (((ms.user_id = km.user_id) AND ((ms.completed_at)::date = CURRENT_DATE))))
  GROUP BY km.kul_id, km.user_id, km.role;


ALTER VIEW public.kul_practice_today OWNER TO postgres;

--
-- Name: kuls; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.kuls (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    invite_code text NOT NULL,
    created_by uuid NOT NULL,
    avatar_emoji text DEFAULT '🏡'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    cover_url text,
    is_pro boolean DEFAULT false,
    pro_activated_at timestamp with time zone,
    pro_expires_at timestamp with time zone,
    pro_admin_id uuid
);


ALTER TABLE public.kuls OWNER TO postgres;

--
-- Name: kul_weekly_stats; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.kul_weekly_stats WITH (security_invoker='true') AS
 SELECT km.kul_id,
    k.name AS kul_name,
    k.avatar_emoji,
    count(DISTINCT km.user_id) AS total_members,
    count(DISTINCT ms.user_id) AS active_members_7d,
    COALESCE(sum(ms.count), (0)::bigint) AS total_japa_7d,
    (COALESCE(avg(ms.duration_seconds), (0)::numeric))::integer AS avg_session_duration_s,
    max(up.current_streak) AS top_streak,
    max(up.consistency_score) AS top_consistency
   FROM (((public.kul_members km
     JOIN public.kuls k ON ((k.id = km.kul_id)))
     LEFT JOIN public.mala_sessions ms ON (((ms.user_id = km.user_id) AND (ms.completed_at >= (now() - '7 days'::interval)))))
     LEFT JOIN public.user_practice up ON ((up.user_id = km.user_id)))
  GROUP BY km.kul_id, k.name, k.avatar_emoji;


ALTER VIEW public.kul_weekly_stats OWNER TO postgres;

--
-- Name: live_darshans; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.live_darshans (
    id text NOT NULL,
    title text NOT NULL,
    location text NOT NULL,
    schedule text NOT NULL,
    category text NOT NULL,
    tradition text NOT NULL,
    youtube_channel_id text,
    current_video_id text,
    is_active boolean DEFAULT true,
    last_synced_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.live_darshans OWNER TO postgres;

--
-- Name: mandalis; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.mandalis (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    name text NOT NULL,
    city text NOT NULL,
    country text NOT NULL,
    latitude double precision NOT NULL,
    longitude double precision NOT NULL,
    radius_km double precision DEFAULT 10,
    member_count integer DEFAULT 0,
    description text
);


ALTER TABLE public.mandalis OWNER TO postgres;

--
-- Name: mantras; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.mantras (
    id text NOT NULL,
    name text NOT NULL,
    sanskrit text DEFAULT ''::text NOT NULL,
    transliteration text NOT NULL,
    meaning text NOT NULL,
    deity text NOT NULL,
    tradition text NOT NULL,
    beads_per_round integer DEFAULT 108 NOT NULL,
    description text NOT NULL,
    japa_instructions text NOT NULL,
    tags text[] DEFAULT '{}'::text[] NOT NULL,
    recommended_rounds integer DEFAULT 4 NOT NULL,
    level text DEFAULT 'beginner'::text NOT NULL,
    audio_url text,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.mantras OWNER TO postgres;

--
-- Name: message_threads; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.message_threads (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    subtitle text,
    kind text NOT NULL,
    context_label text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT message_threads_kind_check CHECK ((kind = ANY (ARRAY['kul'::text, 'mandali'::text, 'direct'::text])))
);


ALTER TABLE public.message_threads OWNER TO postgres;

--
-- Name: monitoring_events; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.monitoring_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "timestamp" timestamp with time zone DEFAULT now() NOT NULL,
    severity text NOT NULL,
    domain text NOT NULL,
    route text,
    provider text,
    model text,
    fallback_used boolean,
    latency_ms integer,
    error_code text,
    error_message text,
    request_id text,
    trace_id text,
    context jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT monitoring_events_domain_check CHECK ((domain = ANY (ARRAY['app'::text, 'ai'::text, 'tts'::text, 'translation'::text, 'auth'::text, 'notifications'::text, 'cron'::text, 'storage'::text]))),
    CONSTRAINT monitoring_events_severity_check CHECK ((severity = ANY (ARRAY['P0'::text, 'P1'::text, 'P2'::text, 'P3'::text])))
);


ALTER TABLE public.monitoring_events OWNER TO postgres;

--
-- Name: nitya_karma_streaks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.nitya_karma_streaks (
    user_id uuid NOT NULL,
    current_streak integer DEFAULT 0,
    longest_streak integer DEFAULT 0,
    last_full_date date,
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.nitya_karma_streaks OWNER TO postgres;

--
-- Name: notification_schedule; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notification_schedule (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    title text NOT NULL,
    body text NOT NULL,
    send_at timestamp with time zone NOT NULL,
    notification_type text DEFAULT 'generic'::text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb,
    sent_at timestamp with time zone,
    error text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT notification_schedule_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'sent'::text, 'failed'::text, 'cancelled'::text])))
);


ALTER TABLE public.notification_schedule OWNER TO postgres;

--
-- Name: notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    user_id uuid NOT NULL,
    title text NOT NULL,
    body text NOT NULL,
    emoji text DEFAULT '🔔'::text,
    type text DEFAULT 'general'::text,
    read boolean DEFAULT false,
    action_url text,
    notification_key text,
    local_date date,
    sent_timezone text
);

ALTER TABLE ONLY public.notifications REPLICA IDENTITY FULL;


ALTER TABLE public.notifications OWNER TO postgres;

--
-- Name: sadhana_events; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sadhana_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    event_type text NOT NULL,
    event_data jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.sadhana_events OWNER TO postgres;

--
-- Name: nudge_effectiveness; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.nudge_effectiveness WITH (security_invoker='true') AS
 SELECT user_id,
    (event_data ->> 'nudge_style'::text) AS style,
    count(*) FILTER (WHERE (event_type = 'streak_recovered'::text)) AS recoveries,
    count(*) FILTER (WHERE (event_type = 'notification_dismissed'::text)) AS dismissals,
    round((((count(*) FILTER (WHERE (event_type = 'streak_recovered'::text)))::numeric / (NULLIF(count(*), 0))::numeric) * (100)::numeric), 1) AS recovery_rate_pct
   FROM public.sadhana_events
  WHERE ((event_type = ANY (ARRAY['streak_recovered'::text, 'notification_dismissed'::text])) AND ((event_data ->> 'nudge_style'::text) IS NOT NULL))
  GROUP BY user_id, (event_data ->> 'nudge_style'::text);


ALTER VIEW public.nudge_effectiveness OWNER TO postgres;

--
-- Name: observance_definitions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.observance_definitions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    slug text NOT NULL,
    display_name text NOT NULL,
    kind text,
    tradition text,
    calendar_rule_type text,
    verification_type text,
    route_kind text,
    route_slug text,
    region text,
    active boolean DEFAULT true NOT NULL,
    emoji text DEFAULT '🪔'::text,
    description text,
    is_shared boolean DEFAULT false NOT NULL,
    guarantee_level text DEFAULT 'manual_review_required'::text NOT NULL,
    CONSTRAINT observance_definitions_guarantee_level_check CHECK ((guarantee_level = ANY (ARRAY['canonical_engine'::text, 'manual_review_required'::text, 'multi_valid_dates'::text, 'unsupported_rule'::text]))),
    CONSTRAINT observance_definitions_kind_check CHECK ((kind = ANY (ARRAY['major'::text, 'vrat'::text, 'regional'::text]))),
    CONSTRAINT observance_definitions_tradition_check CHECK ((tradition = ANY (ARRAY['hindu'::text, 'sikh'::text, 'buddhist'::text, 'jain'::text, 'all'::text]))),
    CONSTRAINT observance_definitions_verification_type_check CHECK ((verification_type = ANY (ARRAY['solar_fixed'::text, 'lunar_tithi'::text, 'nakshatra_based'::text, 'regional_calendar'::text, 'historical_commemoration'::text])))
);


ALTER TABLE public.observance_definitions OWNER TO postgres;

--
-- Name: observance_occurrences; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.observance_occurrences (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    definition_id uuid NOT NULL,
    year integer NOT NULL,
    date date NOT NULL,
    calculation_version text DEFAULT '1.0.0'::text NOT NULL,
    calculated_by text DEFAULT 'system'::text NOT NULL,
    verification_status text,
    verification_note text,
    suggested_date date,
    review_status text,
    source_provenance jsonb DEFAULT '{}'::jsonb NOT NULL,
    verification_confidence text,
    verification_run_at timestamp with time zone,
    reviewed_at timestamp with time zone,
    review_notes text,
    manual_date_override date,
    manual_override_reason text,
    locked_for_regeneration boolean DEFAULT false NOT NULL,
    final_date_source text DEFAULT 'legacy_seed'::text NOT NULL,
    audit_status text DEFAULT 'not_run'::text NOT NULL,
    audit_failure_reason text,
    audit_retry_count integer DEFAULT 0 NOT NULL,
    last_audited_at timestamp with time zone,
    CONSTRAINT observance_occurrences_audit_status_check CHECK ((audit_status = ANY (ARRAY['not_run'::text, 'completed'::text, 'failed'::text, 'skipped'::text]))),
    CONSTRAINT observance_occurrences_final_date_source_check CHECK ((final_date_source = ANY (ARRAY['legacy_seed'::text, 'manual_override'::text, 'calculation_engine'::text, 'calculation_engine_reviewed'::text, 'fallback'::text]))),
    CONSTRAINT observance_occurrences_review_status_check CHECK ((review_status = ANY (ARRAY['needs_review'::text, 'reviewed'::text]))),
    CONSTRAINT observance_occurrences_verification_confidence_check CHECK ((verification_confidence = ANY (ARRAY['high'::text, 'medium'::text, 'low'::text]))),
    CONSTRAINT observance_occurrences_verification_status_check CHECK ((verification_status = ANY (ARRAY['verified'::text, 'mismatch'::text, 'uncertain'::text, 'not_checked'::text, 'manual_review'::text])))
);


ALTER TABLE public.observance_occurrences OWNER TO postgres;

--
-- Name: pathshala_badges; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pathshala_badges (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    slug text NOT NULL,
    title text NOT NULL,
    emoji text DEFAULT '🏅'::text NOT NULL,
    description text NOT NULL,
    category text DEFAULT 'learning'::text NOT NULL,
    criteria jsonb DEFAULT '{}'::jsonb NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    CONSTRAINT pathshala_badges_category_check CHECK ((category = ANY (ARRAY['learning'::text, 'recitation'::text, 'community'::text, 'streak'::text, 'mastery'::text])))
);


ALTER TABLE public.pathshala_badges OWNER TO postgres;

--
-- Name: pathshala_circle_members; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pathshala_circle_members (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    circle_id uuid NOT NULL,
    user_id uuid NOT NULL,
    joined_at timestamp with time zone DEFAULT now() NOT NULL,
    current_position integer DEFAULT 1 NOT NULL,
    last_activity_at timestamp with time zone
);


ALTER TABLE public.pathshala_circle_members OWNER TO postgres;

--
-- Name: pathshala_paths; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pathshala_paths (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    slug text NOT NULL,
    title text NOT NULL,
    subtitle text,
    description text,
    language text DEFAULT 'sa'::text NOT NULL,
    tradition text,
    difficulty text DEFAULT 'beginner'::text NOT NULL,
    text_category text DEFAULT 'smriti'::text NOT NULL,
    total_chunks integer DEFAULT 0 NOT NULL,
    estimated_weeks integer DEFAULT 4 NOT NULL,
    cover_emoji text DEFAULT '📖'::text,
    cover_color text DEFAULT '#FF6B35'::text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT pathshala_paths_difficulty_check CHECK ((difficulty = ANY (ARRAY['beginner'::text, 'intermediate'::text, 'advanced'::text])))
);


ALTER TABLE public.pathshala_paths OWNER TO postgres;

--
-- Name: TABLE pathshala_paths; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.pathshala_paths IS 'Curriculum path definitions — seeded, not user-created. One row per course.';


--
-- Name: pathshala_study_circles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pathshala_study_circles (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    kul_id uuid NOT NULL,
    path_id uuid NOT NULL,
    created_by uuid NOT NULL,
    title text,
    description text,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    target_completion_date date,
    chunks_per_week integer DEFAULT 7 NOT NULL,
    is_active boolean DEFAULT true NOT NULL
);


ALTER TABLE public.pathshala_study_circles OWNER TO postgres;

--
-- Name: pathshala_circle_leaderboard; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.pathshala_circle_leaderboard WITH (security_invoker='true') AS
 SELECT cm.circle_id,
    sc_circle.kul_id,
    sc_circle.path_id,
    p.title AS path_title,
    p.total_chunks,
    cm.user_id,
    cm.current_position,
    cm.last_activity_at,
    round((((cm.current_position)::numeric / (NULLIF(p.total_chunks, 0))::numeric) * (100)::numeric), 1) AS pct_complete,
    rank() OVER (PARTITION BY cm.circle_id ORDER BY cm.current_position DESC) AS rank
   FROM ((public.pathshala_circle_members cm
     JOIN public.pathshala_study_circles sc_circle ON ((sc_circle.id = cm.circle_id)))
     JOIN public.pathshala_paths p ON ((p.id = sc_circle.path_id)));


ALTER VIEW public.pathshala_circle_leaderboard OWNER TO postgres;

--
-- Name: pathshala_enrollments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pathshala_enrollments (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    path_id uuid NOT NULL,
    enrolled_at timestamp with time zone DEFAULT now() NOT NULL,
    current_position integer DEFAULT 1 NOT NULL,
    completed_at timestamp with time zone,
    paused boolean DEFAULT false NOT NULL,
    language_pref text DEFAULT 'en'::text NOT NULL,
    daily_target_chunks integer DEFAULT 1 NOT NULL,
    last_activity_at timestamp with time zone
);


ALTER TABLE public.pathshala_enrollments OWNER TO postgres;

--
-- Name: pathshala_path_chunks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pathshala_path_chunks (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    path_id uuid NOT NULL,
    chunk_id uuid NOT NULL,
    "position" integer NOT NULL,
    week_number integer DEFAULT 1 NOT NULL,
    day_number integer DEFAULT 1 NOT NULL,
    is_optional boolean DEFAULT false NOT NULL
);


ALTER TABLE public.pathshala_path_chunks OWNER TO postgres;

--
-- Name: pathshala_progress; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pathshala_progress (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    chunk_id uuid NOT NULL,
    path_id uuid,
    enrollment_id uuid,
    read_at timestamp with time zone DEFAULT now() NOT NULL,
    read_count integer DEFAULT 1 NOT NULL,
    comprehension_score integer,
    memorization_level integer DEFAULT 0 NOT NULL,
    recitation_score numeric(3,1),
    notes text,
    CONSTRAINT pathshala_progress_comprehension_score_check CHECK (((comprehension_score >= 1) AND (comprehension_score <= 5))),
    CONSTRAINT pathshala_progress_memorization_level_check CHECK (((memorization_level >= 0) AND (memorization_level <= 5))),
    CONSTRAINT pathshala_progress_recitation_score_check CHECK (((recitation_score >= (0)::numeric) AND (recitation_score <= (5)::numeric)))
);


ALTER TABLE public.pathshala_progress OWNER TO postgres;

--
-- Name: pathshala_recitation_reviews; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pathshala_recitation_reviews (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    recording_id uuid NOT NULL,
    reviewer_id uuid,
    reviewer_type text DEFAULT 'ai'::text NOT NULL,
    score_uccharan numeric(3,1),
    score_sandhi numeric(3,1),
    score_visarga numeric(3,1),
    score_laya numeric(3,1),
    score_svara numeric(3,1),
    score_fluency numeric(3,1),
    overall_score numeric(3,1) NOT NULL,
    feedback_text text,
    corrections jsonb DEFAULT '[]'::jsonb,
    is_certified boolean DEFAULT false NOT NULL,
    reviewed_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT pathshala_recitation_reviews_overall_score_check CHECK (((overall_score >= (1)::numeric) AND (overall_score <= (5)::numeric))),
    CONSTRAINT pathshala_recitation_reviews_reviewer_type_check CHECK ((reviewer_type = ANY (ARRAY['ai'::text, 'guru'::text, 'peer'::text]))),
    CONSTRAINT pathshala_recitation_reviews_score_fluency_check CHECK (((score_fluency >= (1)::numeric) AND (score_fluency <= (5)::numeric))),
    CONSTRAINT pathshala_recitation_reviews_score_laya_check CHECK (((score_laya >= (1)::numeric) AND (score_laya <= (5)::numeric))),
    CONSTRAINT pathshala_recitation_reviews_score_sandhi_check CHECK (((score_sandhi >= (1)::numeric) AND (score_sandhi <= (5)::numeric))),
    CONSTRAINT pathshala_recitation_reviews_score_svara_check CHECK (((score_svara >= (1)::numeric) AND (score_svara <= (5)::numeric))),
    CONSTRAINT pathshala_recitation_reviews_score_uccharan_check CHECK (((score_uccharan >= (1)::numeric) AND (score_uccharan <= (5)::numeric))),
    CONSTRAINT pathshala_recitation_reviews_score_visarga_check CHECK (((score_visarga >= (1)::numeric) AND (score_visarga <= (5)::numeric)))
);


ALTER TABLE public.pathshala_recitation_reviews OWNER TO postgres;

--
-- Name: pathshala_recordings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pathshala_recordings (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    chunk_id uuid NOT NULL,
    enrollment_id uuid,
    audio_url text NOT NULL,
    audio_bucket text DEFAULT 'pathshala-recordings'::text NOT NULL,
    duration_s numeric(6,1),
    file_size_bytes integer,
    language text DEFAULT 'sa'::text NOT NULL,
    script text DEFAULT 'Devanagari'::text NOT NULL,
    transcript text,
    expected_text text NOT NULL,
    status text DEFAULT 'processing'::text NOT NULL,
    error_message text,
    submitted_at timestamp with time zone DEFAULT now() NOT NULL,
    scored_at timestamp with time zone,
    reviewed_at timestamp with time zone,
    CONSTRAINT pathshala_recordings_status_check CHECK ((status = ANY (ARRAY['processing'::text, 'scored'::text, 'pending_guru'::text, 'guru_reviewed'::text, 'error'::text])))
);


ALTER TABLE public.pathshala_recordings OWNER TO postgres;

--
-- Name: pathshala_recitation_stats; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.pathshala_recitation_stats WITH (security_invoker='true') AS
 SELECT r.user_id,
    count(*) AS total_recordings,
    count(*) FILTER (WHERE (r.status = 'scored'::text)) AS scored_count,
    round(avg(rr.overall_score), 2) AS avg_overall_score,
    round(avg(rr.score_uccharan), 2) AS avg_uccharan,
    round(avg(rr.score_fluency), 2) AS avg_fluency,
    count(DISTINCT r.chunk_id) AS unique_verses_attempted,
    count(*) FILTER (WHERE (rr.is_certified = true)) AS certified_count,
    max(rr.reviewed_at) AS last_reviewed_at
   FROM (public.pathshala_recordings r
     LEFT JOIN public.pathshala_recitation_reviews rr ON (((rr.recording_id = r.id) AND (rr.reviewer_type = 'ai'::text))))
  GROUP BY r.user_id;


ALTER VIEW public.pathshala_recitation_stats OWNER TO postgres;

--
-- Name: pathshala_verse_mastery; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pathshala_verse_mastery (
    user_id uuid NOT NULL,
    chunk_id uuid NOT NULL,
    best_ai_score numeric(3,1),
    best_guru_score numeric(3,1),
    attempt_count integer DEFAULT 0 NOT NULL,
    last_attempt_at timestamp with time zone,
    certified boolean DEFAULT false NOT NULL,
    certified_by uuid,
    certified_at timestamp with time zone,
    memorization_sm2 integer DEFAULT 0 NOT NULL,
    comprehension integer DEFAULT 0 NOT NULL,
    is_fully_mastered boolean GENERATED ALWAYS AS ((certified AND (memorization_sm2 >= 3) AND (comprehension >= 4))) STORED,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.pathshala_verse_mastery OWNER TO postgres;

--
-- Name: scripture_chunks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.scripture_chunks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    text_id text NOT NULL,
    chapter integer NOT NULL,
    verse integer NOT NULL,
    sanskrit text NOT NULL,
    transliteration text,
    translation text NOT NULL,
    word_by_word jsonb,
    commentary text,
    tags text[] DEFAULT ARRAY[]::text[],
    embedding public.vector(384),
    created_at timestamp with time zone DEFAULT now(),
    search_vector tsvector GENERATED ALWAYS AS (to_tsvector('english'::regconfig, COALESCE(translation, ''::text))) STORED,
    language text DEFAULT 'sa'::text,
    script text DEFAULT 'Devanagari'::text,
    tradition_region text,
    text_category text DEFAULT 'shruti'::text
);


ALTER TABLE public.scripture_chunks OWNER TO postgres;

--
-- Name: COLUMN scripture_chunks.transliteration; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.scripture_chunks.transliteration IS 'IAST romanisation for Sanskrit; helpful for non-script readers and STT comparison';


--
-- Name: COLUMN scripture_chunks.language; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.scripture_chunks.language IS 'ISO 639-1/3 language code: sa=Sanskrit, hi=Hindi, ta=Tamil, bn=Bengali, te=Telugu, kn=Kannada, ml=Malayalam, mr=Marathi, gu=Gujarati, or=Odia, awa=Awadhi, en=English';


--
-- Name: COLUMN scripture_chunks.script; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.scripture_chunks.script IS 'Writing system: Devanagari, Tamil, Bengali, Telugu, Kannada, Malayalam, Gujarati, Odia, IAST, Latin';


--
-- Name: COLUMN scripture_chunks.tradition_region; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.scripture_chunks.tradition_region IS 'Geographic tradition: north | south | east | west | pan (pan-India)';


--
-- Name: COLUMN scripture_chunks.text_category; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.scripture_chunks.text_category IS 'Canonical text classification for corpus browsing';


--
-- Name: pathshala_today_lessons; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.pathshala_today_lessons WITH (security_invoker='true') AS
 SELECT e.user_id,
    e.id AS enrollment_id,
    e.path_id,
    p.title AS path_title,
    p.cover_emoji,
    e.current_position,
    pc.chunk_id,
    pc.week_number,
    pc.day_number,
    sc.text_id,
    sc.chapter,
    sc.verse,
    sc.sanskrit AS original_text,
    sc.translation AS default_translation,
    sc.language,
    sc.script,
    sc.transliteration,
    COALESCE(pr.read_count, 0) AS times_read,
    COALESCE(pr.recitation_score, (0)::numeric) AS best_recitation,
    vm.certified
   FROM (((((public.pathshala_enrollments e
     JOIN public.pathshala_paths p ON ((p.id = e.path_id)))
     JOIN public.pathshala_path_chunks pc ON (((pc.path_id = e.path_id) AND (pc."position" = e.current_position))))
     JOIN public.scripture_chunks sc ON ((sc.id = pc.chunk_id)))
     LEFT JOIN public.pathshala_progress pr ON (((pr.user_id = e.user_id) AND (pr.chunk_id = pc.chunk_id) AND (pr.path_id = e.path_id))))
     LEFT JOIN public.pathshala_verse_mastery vm ON (((vm.user_id = e.user_id) AND (vm.chunk_id = pc.chunk_id))))
  WHERE ((e.paused = false) AND (e.completed_at IS NULL));


ALTER VIEW public.pathshala_today_lessons OWNER TO postgres;

--
-- Name: pathshala_translations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pathshala_translations (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    chunk_id uuid NOT NULL,
    language text NOT NULL,
    script text NOT NULL,
    translation text NOT NULL,
    transliteration text,
    translator text,
    is_ai_generated boolean DEFAULT false NOT NULL,
    verified boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.pathshala_translations OWNER TO postgres;

--
-- Name: pathshala_user_badges; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pathshala_user_badges (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    badge_id uuid NOT NULL,
    earned_at timestamp with time zone DEFAULT now() NOT NULL,
    context jsonb DEFAULT '{}'::jsonb
);


ALTER TABLE public.pathshala_user_badges OWNER TO postgres;

--
-- Name: pathshala_user_state; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pathshala_user_state (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    tradition text NOT NULL,
    section_id text NOT NULL,
    entry_id text NOT NULL,
    last_opened_at timestamp with time zone DEFAULT now() NOT NULL,
    bookmarked_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT pathshala_user_state_tradition_check CHECK ((tradition = ANY (ARRAY['hindu'::text, 'sikh'::text, 'buddhist'::text, 'jain'::text])))
);


ALTER TABLE public.pathshala_user_state OWNER TO postgres;

--
-- Name: post_comments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.post_comments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    post_id uuid NOT NULL,
    author_id uuid NOT NULL,
    body text NOT NULL,
    parent_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.post_comments OWNER TO postgres;

--
-- Name: post_upvotes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.post_upvotes (
    post_id uuid NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.post_upvotes OWNER TO postgres;

--
-- Name: posts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.posts (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    author_id uuid NOT NULL,
    mandali_id uuid,
    content text NOT NULL,
    type text DEFAULT 'update'::text,
    upvotes integer DEFAULT 0,
    comment_count integer DEFAULT 0,
    is_pinned boolean DEFAULT false,
    event_date timestamp with time zone,
    event_location text,
    CONSTRAINT posts_type_check CHECK ((type = ANY (ARRAY['update'::text, 'event'::text, 'question'::text, 'announcement'::text])))
);


ALTER TABLE public.posts OWNER TO postgres;

--
-- Name: profiles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    full_name text NOT NULL,
    username text NOT NULL,
    avatar_url text,
    bio text,
    city text,
    country text,
    latitude double precision,
    longitude double precision,
    sampradaya text,
    ishta_devata text,
    spiritual_level text DEFAULT 'jigyasu'::text,
    legacy_family_name text,
    gotra text,
    languages text[] DEFAULT ARRAY['en'::text],
    seeking text[] DEFAULT ARRAY[]::text[],
    seva_score integer DEFAULT 0,
    mandali_id uuid,
    kul_devata text,
    home_town text,
    shloka_streak integer DEFAULT 0,
    last_shloka_date date,
    onesignal_player_id text,
    country_code text,
    tradition text,
    custom_greeting text,
    kul_id uuid,
    neighbourhood text,
    looking_for_satsang boolean DEFAULT false NOT NULL,
    location_visible boolean DEFAULT false NOT NULL,
    timezone text,
    wants_festival_reminders boolean DEFAULT true NOT NULL,
    wants_shloka_reminders boolean DEFAULT true NOT NULL,
    wants_community_notifications boolean DEFAULT true NOT NULL,
    wants_family_notifications boolean DEFAULT true NOT NULL,
    notification_quiet_hours_start smallint,
    notification_quiet_hours_end smallint,
    app_language text DEFAULT 'en'::text NOT NULL,
    scripture_script text DEFAULT 'original'::text NOT NULL,
    show_transliteration boolean DEFAULT true NOT NULL,
    meaning_language text DEFAULT 'en'::text NOT NULL,
    is_pro boolean DEFAULT false NOT NULL,
    pro_activated_at timestamp with time zone,
    pro_note text,
    life_stage text,
    gender_context text,
    date_of_birth date,
    life_stage_locked boolean DEFAULT false NOT NULL,
    transliteration_language text DEFAULT 'en'::text NOT NULL,
    is_admin boolean DEFAULT false,
    is_banned boolean DEFAULT false,
    ban_reason text,
    karma_points integer DEFAULT 0 NOT NULL,
    is_founding_member boolean DEFAULT false NOT NULL,
    founding_number integer,
    active_symbol_id text,
    consent_religious_data boolean DEFAULT false NOT NULL,
    consent_updated_at timestamp with time zone,
    cover_url text,
    wants_nitya_reminders boolean DEFAULT true NOT NULL,
    subscription_status text DEFAULT 'free'::text NOT NULL,
    subscription_expires_at timestamp with time zone,
    entitlement_source text,
    entitlement_updated_at timestamp with time zone,
    show_sadhana_highlights boolean DEFAULT false NOT NULL,
    weekly_seva integer DEFAULT 0,
    monthly_seva integer DEFAULT 0,
    streak_freeze_count integer DEFAULT 0,
    last_freeze_used date,
    onboarding_completed boolean DEFAULT false,
    onboarding_goal text,
    japa_reminder_enabled boolean DEFAULT false,
    japa_reminder_time text DEFAULT '07:00'::text,
    marketing_consent boolean DEFAULT false,
    email_newsletter boolean DEFAULT false,
    whatsapp_updates boolean DEFAULT false,
    newsletter_frequency text DEFAULT 'weekly'::text,
    comm_prefs_set boolean DEFAULT false,
    email_festivals boolean DEFAULT true,
    unsubscribe_token text DEFAULT (gen_random_uuid())::text,
    quiz_reminder_enabled boolean DEFAULT false,
    quiz_reminder_time text DEFAULT '08:00'::text,
    nitya_reminder_enabled boolean DEFAULT false,
    nitya_reminder_time text DEFAULT '06:30'::text,
    CONSTRAINT profiles_gender_context_check CHECK ((gender_context = ANY (ARRAY['female'::text, 'general'::text]))),
    CONSTRAINT profiles_life_stage_check CHECK ((life_stage = ANY (ARRAY['brahmacharya'::text, 'grihastha'::text, 'vanaprastha'::text, 'sannyasa'::text]))),
    CONSTRAINT profiles_subscription_status_check CHECK ((subscription_status = ANY (ARRAY['free'::text, 'pro'::text, 'kul_pro'::text, 'grace'::text, 'expired'::text])))
);


ALTER TABLE public.profiles OWNER TO postgres;

--
-- Name: COLUMN profiles.is_pro; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.profiles.is_pro IS 'True when the user has an active Sangam Pro subscription or early access grant.';


--
-- Name: COLUMN profiles.pro_note; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.profiles.pro_note IS 'Free-text note for how Pro was granted (early_access, coupon code, payment reference, etc.)';


--
-- Name: COLUMN profiles.life_stage; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.profiles.life_stage IS 'User''s current Ashrama / life stage. Universal key regardless of tradition.
   brahmacharya = student (0-25), grihastha = householder (25-50),
   vanaprastha = forest dweller / elder (50-75), sannyasa = renunciate (75+).
   NULL means the user has not yet selected a stage (skip Ashrama section).';


--
-- Name: COLUMN profiles.gender_context; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.profiles.gender_context IS 'Practice path preference. female = Stridharma duties; general = default path. NULL = unset.';


--
-- Name: COLUMN profiles.transliteration_language; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.profiles.transliteration_language IS 'Preferred script for transliteration (en for Roman, hi for Devanagari)';


--
-- Name: COLUMN profiles.active_symbol_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.profiles.active_symbol_id IS 'The ID of the sacred symbol (relic) currently active for the user profile.';


--
-- Name: COLUMN profiles.consent_religious_data; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.profiles.consent_religious_data IS 'Explicit consent for processing religious/spiritual data (GDPR Art. 9)';


--
-- Name: COLUMN profiles.subscription_status; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.profiles.subscription_status IS 'Canonical server-side entitlement state. Replaces ad hoc is_pro-only gating for production billing.';


--
-- Name: COLUMN profiles.entitlement_source; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.profiles.entitlement_source IS 'Source of current entitlement truth, e.g. early_access, admin_grant, stripe:webhook, app_store, play_store.';


--
-- Name: COLUMN profiles.show_sadhana_highlights; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.profiles.show_sadhana_highlights IS 'When true, this user''s sadhana highlights (beads, streak, shields) are visible on their public profile.';


--
-- Name: push_subscriptions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.push_subscriptions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    endpoint text NOT NULL,
    p256dh text NOT NULL,
    auth text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.push_subscriptions OWNER TO postgres;

--
-- Name: quiz_responses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.quiz_responses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    date date DEFAULT CURRENT_DATE NOT NULL,
    question text NOT NULL,
    chosen_index integer NOT NULL,
    correct_index integer NOT NULL,
    is_correct boolean NOT NULL,
    tradition text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    explanation text,
    daily_quiz_id uuid,
    streak_at_answer smallint
);


ALTER TABLE public.quiz_responses OWNER TO postgres;

--
-- Name: quiz_sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.quiz_sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    tradition text NOT NULL,
    topic text NOT NULL,
    difficulty text NOT NULL,
    questions_total integer DEFAULT 5 NOT NULL,
    questions_correct integer DEFAULT 0 NOT NULL,
    karma_earned integer DEFAULT 0 NOT NULL,
    completed_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT quiz_sessions_difficulty_check CHECK ((difficulty = ANY (ARRAY['seeker'::text, 'gyani'::text, 'pandit'::text])))
);


ALTER TABLE public.quiz_sessions OWNER TO postgres;

--
-- Name: reading_progress; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.reading_progress (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    text_id text NOT NULL,
    chapter integer NOT NULL,
    verse integer NOT NULL,
    completed boolean DEFAULT false,
    bookmarked boolean DEFAULT false,
    time_spent_s integer DEFAULT 0,
    read_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.reading_progress OWNER TO postgres;

--
-- Name: recommendations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.recommendations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    date date NOT NULL,
    type text NOT NULL,
    content jsonb NOT NULL,
    generated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.recommendations OWNER TO postgres;

--
-- Name: sankalpa; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sankalpa (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    type text NOT NULL,
    description text NOT NULL,
    target_days integer NOT NULL,
    target_count integer,
    mantra_id text,
    text_id text,
    started_at timestamp with time zone DEFAULT now(),
    current_streak integer DEFAULT 0,
    longest_streak integer DEFAULT 0,
    status text DEFAULT 'active'::text,
    completed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.sankalpa OWNER TO postgres;

--
-- Name: sankalpa_checkins; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sankalpa_checkins (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    sankalpa_id uuid NOT NULL,
    checked_date date NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.sankalpa_checkins OWNER TO postgres;

--
-- Name: sankalpa_reflections; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sankalpa_reflections (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    sankalpa_id uuid NOT NULL,
    reflection_type text DEFAULT 'midpoint'::text NOT NULL,
    mood text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT sankalpa_reflections_mood_check CHECK ((mood = ANY (ARRAY['strong'::text, 'struggling'::text, 'grateful'::text])))
);


ALTER TABLE public.sankalpa_reflections OWNER TO postgres;

--
-- Name: sankalpas; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sankalpas (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    text text NOT NULL,
    tradition text DEFAULT 'hindu'::text NOT NULL,
    related_practice text,
    target_days integer DEFAULT 30 NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    completed_at timestamp with time zone,
    CONSTRAINT sankalpas_status_check CHECK ((status = ANY (ARRAY['active'::text, 'completed'::text, 'abandoned'::text])))
);


ALTER TABLE public.sankalpas OWNER TO postgres;

--
-- Name: sanskars; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sanskars (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    slug text NOT NULL,
    sequence_number integer NOT NULL,
    name text NOT NULL,
    name_sanskrit text,
    name_meaning text,
    life_stage text NOT NULL,
    typical_age text,
    significance text NOT NULL,
    presiding_deity text,
    key_mantras text[],
    samagri text[],
    vidhi_steps jsonb NOT NULL,
    duration_hours double precision,
    priest_required boolean DEFAULT true,
    can_self_perform boolean DEFAULT false,
    notes text,
    CONSTRAINT sanskars_life_stage_check CHECK ((life_stage = ANY (ARRAY['prenatal'::text, 'birth'::text, 'infancy'::text, 'childhood'::text, 'education'::text, 'adulthood'::text, 'marriage'::text, 'elder'::text, 'death'::text])))
);


ALTER TABLE public.sanskars OWNER TO postgres;

--
-- Name: sattvic_sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sattvic_sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    mode text NOT NULL,
    duration_secs integer NOT NULL,
    environment text NOT NULL,
    mantra text,
    completed_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT sattvic_sessions_mode_check CHECK ((mode = ANY (ARRAY['breath'::text, 'chant'::text, 'reading'::text, 'silent'::text])))
);


ALTER TABLE public.sattvic_sessions OWNER TO postgres;

--
-- Name: seva_log; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.seva_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    seva_type text NOT NULL,
    note text,
    logged_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.seva_log OWNER TO postgres;

--
-- Name: seva_task_completions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.seva_task_completions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    user_id uuid NOT NULL,
    task_key text NOT NULL,
    points integer DEFAULT 0 NOT NULL
);


ALTER TABLE public.seva_task_completions OWNER TO postgres;

--
-- Name: shlokas; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.shlokas (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    devanagari text NOT NULL,
    translation text,
    sync_metadata jsonb DEFAULT '[]'::jsonb,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.shlokas OWNER TO postgres;

--
-- Name: thread_messages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.thread_messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    thread_id uuid NOT NULL,
    sender_id uuid,
    sender_name text,
    body text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    delivery_state text DEFAULT 'sent'::text NOT NULL
);


ALTER TABLE public.thread_messages OWNER TO postgres;

--
-- Name: thread_participants; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.thread_participants (
    thread_id uuid NOT NULL,
    user_id uuid NOT NULL,
    unread_count integer DEFAULT 0 NOT NULL,
    joined_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.thread_participants OWNER TO postgres;

--
-- Name: thread_reactions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.thread_reactions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    thread_id uuid NOT NULL,
    user_id uuid NOT NULL,
    reaction_type text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT thread_reactions_reaction_type_check CHECK ((reaction_type = ANY (ARRAY['pranam'::text, 'bhakti'::text, 'prakas'::text])))
);


ALTER TABLE public.thread_reactions OWNER TO postgres;

--
-- Name: thread_reaction_counts; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.thread_reaction_counts AS
 SELECT thread_id,
    reaction_type,
    count(*) AS count
   FROM public.thread_reactions
  GROUP BY thread_id, reaction_type;


ALTER VIEW public.thread_reaction_counts OWNER TO postgres;

--
-- Name: thread_upvotes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.thread_upvotes (
    thread_id uuid NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.thread_upvotes OWNER TO postgres;

--
-- Name: tirtha_checkins; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tirtha_checkins (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    place_id text NOT NULL,
    visited_at timestamp with time zone DEFAULT now() NOT NULL,
    privacy text DEFAULT 'private'::text NOT NULL,
    darshan_mood text,
    intention text,
    reflection text,
    companions text,
    family_member_ids uuid[] DEFAULT '{}'::uuid[] NOT NULL,
    pradakshina_count integer DEFAULT 0 NOT NULL,
    seva_note text,
    photo_url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT tirtha_checkins_pradakshina_count_check CHECK ((pradakshina_count >= 0)),
    CONSTRAINT tirtha_checkins_privacy_check CHECK ((privacy = ANY (ARRAY['private'::text, 'family'::text, 'mandali'::text, 'public'::text])))
);


ALTER TABLE public.tirtha_checkins OWNER TO postgres;

--
-- Name: tirtha_collections; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tirtha_collections (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    slug text NOT NULL,
    title text NOT NULL,
    description text,
    tradition text DEFAULT 'all'::text NOT NULL,
    season_key text,
    place_ids text[] DEFAULT '{}'::text[] NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.tirtha_collections OWNER TO postgres;

--
-- Name: tirtha_place_media; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tirtha_place_media (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    place_id text NOT NULL,
    user_id uuid,
    media_url text NOT NULL,
    media_type text DEFAULT 'photo'::text NOT NULL,
    license text,
    status text DEFAULT 'pending'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT tirtha_place_media_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text])))
);


ALTER TABLE public.tirtha_place_media OWNER TO postgres;

--
-- Name: tirtha_place_notes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tirtha_place_notes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    place_id text NOT NULL,
    user_id uuid,
    note_type text DEFAULT 'practical'::text NOT NULL,
    body text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT tirtha_place_notes_note_type_check CHECK ((note_type = ANY (ARRAY['practical'::text, 'etiquette'::text, 'accessibility'::text, 'parking'::text, 'timing'::text, 'seva'::text, 'correction'::text]))),
    CONSTRAINT tirtha_place_notes_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text])))
);


ALTER TABLE public.tirtha_place_notes OWNER TO postgres;

--
-- Name: tirtha_places; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tirtha_places (
    id text NOT NULL,
    source text DEFAULT 'overpass'::text NOT NULL,
    source_id text,
    name text NOT NULL,
    tradition text DEFAULT 'other'::text NOT NULL,
    lat double precision NOT NULL,
    lon double precision NOT NULL,
    address text,
    website text,
    phone text,
    opening_hours text,
    deity text,
    sampradaya text,
    source_confidence text DEFAULT 'community_import'::text NOT NULL,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.tirtha_places OWNER TO postgres;

--
-- Name: tirtha_reports; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tirtha_reports (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    place_id text,
    reason text NOT NULL,
    details text,
    status text DEFAULT 'open'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT tirtha_reports_reason_check CHECK ((reason = ANY (ARRAY['wrong_location'::text, 'closed'::text, 'duplicate'::text, 'tradition_mismatch'::text, 'inappropriate'::text, 'other'::text]))),
    CONSTRAINT tirtha_reports_status_check CHECK ((status = ANY (ARRAY['open'::text, 'reviewing'::text, 'resolved'::text, 'dismissed'::text])))
);


ALTER TABLE public.tirtha_reports OWNER TO postgres;

--
-- Name: tirtha_reviews; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tirtha_reviews (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    user_id uuid NOT NULL,
    place_id text NOT NULL,
    place_name text NOT NULL,
    rating integer NOT NULL,
    note text,
    lat double precision,
    lon double precision,
    CONSTRAINT tirtha_reviews_rating_check CHECK (((rating >= 1) AND (rating <= 5)))
);


ALTER TABLE public.tirtha_reviews OWNER TO postgres;

--
-- Name: tirtha_saves; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tirtha_saves (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    place_id text NOT NULL,
    note text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.tirtha_saves OWNER TO postgres;

--
-- Name: tirtha_visits; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tirtha_visits (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    tirtha_id uuid NOT NULL,
    visited_at date NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.tirtha_visits OWNER TO postgres;

--
-- Name: tirthas; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tirthas (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    slug text NOT NULL,
    name text NOT NULL,
    name_sanskrit text,
    deity text,
    tradition text,
    tirtha_type text NOT NULL,
    series_name text,
    series_number integer,
    state text,
    country text DEFAULT 'India'::text,
    lat double precision,
    lng double precision,
    elevation_m integer,
    significance text,
    best_months text[],
    darshan_url text,
    tags text[],
    CONSTRAINT tirthas_tirtha_type_check CHECK ((tirtha_type = ANY (ARRAY['char_dham'::text, 'chota_char_dham'::text, 'jyotirlinga'::text, 'shakti_peeth'::text, 'divya_desam'::text, 'pancha_dwaraka'::text, 'kshetra'::text, 'river'::text, 'other'::text]))),
    CONSTRAINT tirthas_tradition_check CHECK ((tradition = ANY (ARRAY['vaishnav'::text, 'shaiv'::text, 'shakta'::text, 'smarta'::text, 'general'::text])))
);


ALTER TABLE public.tirthas OWNER TO postgres;

--
-- Name: user_blocked_profiles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_blocked_profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    blocker_id uuid NOT NULL,
    blocked_user_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT user_blocked_profiles_no_self CHECK ((blocker_id <> blocked_user_id))
);


ALTER TABLE public.user_blocked_profiles OWNER TO postgres;

--
-- Name: user_hidden_content; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_hidden_content (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    content_type text NOT NULL,
    content_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT user_hidden_content_content_type_check CHECK ((content_type = ANY (ARRAY['mandali_post'::text, 'thread'::text, 'reply'::text])))
);


ALTER TABLE public.user_hidden_content OWNER TO postgres;

--
-- Name: user_mood_checkins; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_mood_checkins (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    before_mood text,
    after_mood text,
    completed_at timestamp with time zone,
    source_surface text,
    recommended_action_type text,
    recommended_action_target text,
    clicked_action text,
    completed_action text,
    reflection_note text,
    context_need text,
    context_time text,
    context_type text,
    dismissed boolean DEFAULT false NOT NULL,
    recommendations_shown jsonb,
    skipped_actions jsonb,
    session_status text DEFAULT 'open'::text,
    closed_at timestamp with time zone
);


ALTER TABLE public.user_mood_checkins OWNER TO postgres;

--
-- Name: user_muted_profiles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_muted_profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    muter_id uuid NOT NULL,
    muted_user_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT user_muted_profiles_no_self CHECK ((muter_id <> muted_user_id))
);


ALTER TABLE public.user_muted_profiles OWNER TO postgres;

--
-- Name: user_sanskaras; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_sanskaras (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    sanskara_id text NOT NULL,
    completed_date date,
    notes text,
    performed_by text,
    location text,
    created_at timestamp with time zone DEFAULT now(),
    kul_member_id uuid,
    expected_date date
);


ALTER TABLE public.user_sanskaras OWNER TO postgres;

--
-- Name: user_sanskars; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_sanskars (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    sanskar_id uuid NOT NULL,
    beneficiary_name text,
    beneficiary_dob date,
    status text DEFAULT 'planned'::text,
    scheduled_date date,
    completed_date date,
    priest_name text,
    location text,
    notes text,
    family_members text[],
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT user_sanskars_status_check CHECK ((status = ANY (ARRAY['planned'::text, 'in_progress'::text, 'completed'::text])))
);


ALTER TABLE public.user_sanskars OWNER TO postgres;

--
-- Name: user_tirtha_progress; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.user_tirtha_progress WITH (security_invoker='true') AS
 SELECT p.id AS user_id,
    t.tirtha_type,
    t.series_name,
    count(DISTINCT t.id) AS total_in_series,
    count(DISTINCT tv.tirtha_id) AS visited,
    round((((count(DISTINCT tv.tirtha_id))::numeric / (NULLIF(count(DISTINCT t.id), 0))::numeric) * (100)::numeric), 1) AS pct_complete
   FROM (((public.profiles p
     CROSS JOIN ( SELECT DISTINCT tirthas.tirtha_type,
            tirthas.series_name
           FROM public.tirthas
          WHERE (tirthas.series_name IS NOT NULL)) s)
     JOIN public.tirthas t ON (((t.tirtha_type = s.tirtha_type) AND (t.series_name = s.series_name))))
     LEFT JOIN public.tirtha_visits tv ON (((tv.tirtha_id = t.id) AND (tv.user_id = p.id))))
  GROUP BY p.id, t.tirtha_type, t.series_name;


ALTER VIEW public.user_tirtha_progress OWNER TO postgres;

--
-- Name: user_warnings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_warnings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    admin_name text,
    reason text NOT NULL,
    admin_note text,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.user_warnings OWNER TO postgres;

--
-- Name: waitlist; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.waitlist (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email text NOT NULL,
    tradition text,
    name text,
    source text DEFAULT 'landing'::text,
    country_hint text,
    created_at timestamp with time zone DEFAULT now(),
    founding_number integer,
    timezone text,
    email_sent boolean DEFAULT false NOT NULL,
    CONSTRAINT waitlist_tradition_check CHECK ((tradition = ANY (ARRAY['hindu'::text, 'sikh'::text, 'buddhist'::text, 'jain'::text])))
);


ALTER TABLE public.waitlist OWNER TO postgres;

--
-- Name: waitlist_founding_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.waitlist_founding_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.waitlist_founding_seq OWNER TO postgres;

--
-- Name: waitlist_founding_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.waitlist_founding_seq OWNED BY public.waitlist.founding_number;


--
-- Name: yatra_plans; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.yatra_plans (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    description text,
    tirtha_ids uuid[] NOT NULL,
    status text DEFAULT 'planned'::text,
    target_date date,
    started_at date,
    completed_at date,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT yatra_plans_status_check CHECK ((status = ANY (ARRAY['planned'::text, 'in_progress'::text, 'completed'::text, 'cancelled'::text])))
);


ALTER TABLE public.yatra_plans OWNER TO postgres;

--
--

CREATE TABLE realtime.messages (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
)
PARTITION BY RANGE (inserted_at);


ALTER TABLE realtime.messages OWNER TO supabase_realtime_admin;

--
--

CREATE TABLE realtime.messages_2026_05_30 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


ALTER TABLE realtime.messages_2026_05_30 OWNER TO supabase_admin;

--
--

CREATE TABLE realtime.messages_2026_05_31 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


ALTER TABLE realtime.messages_2026_05_31 OWNER TO supabase_admin;

--
--

CREATE TABLE realtime.messages_2026_06_01 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


ALTER TABLE realtime.messages_2026_06_01 OWNER TO supabase_admin;

--
--

CREATE TABLE realtime.messages_2026_06_02 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


ALTER TABLE realtime.messages_2026_06_02 OWNER TO supabase_admin;

--
--

CREATE TABLE realtime.messages_2026_06_03 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


ALTER TABLE realtime.messages_2026_06_03 OWNER TO supabase_admin;

--
--

CREATE TABLE realtime.messages_2026_06_04 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


ALTER TABLE realtime.messages_2026_06_04 OWNER TO supabase_admin;

--
--

CREATE TABLE realtime.messages_2026_06_05 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


ALTER TABLE realtime.messages_2026_06_05 OWNER TO supabase_admin;

--
--

CREATE TABLE realtime.schema_migrations (
    version bigint NOT NULL,
    inserted_at timestamp(0) without time zone
);


ALTER TABLE realtime.schema_migrations OWNER TO supabase_admin;

--
--

CREATE TABLE realtime.subscription (
    id bigint NOT NULL,
    subscription_id uuid NOT NULL,
    entity regclass NOT NULL,
    filters realtime.user_defined_filter[] DEFAULT '{}'::realtime.user_defined_filter[] NOT NULL,
    claims jsonb NOT NULL,
    claims_role regrole GENERATED ALWAYS AS (realtime.to_regrole((claims ->> 'role'::text))) STORED NOT NULL,
    created_at timestamp without time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    action_filter text DEFAULT '*'::text,
    CONSTRAINT subscription_action_filter_check CHECK ((action_filter = ANY (ARRAY['*'::text, 'INSERT'::text, 'UPDATE'::text, 'DELETE'::text])))
);


ALTER TABLE realtime.subscription OWNER TO supabase_admin;

--
--

ALTER TABLE realtime.subscription ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME realtime.subscription_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
--

CREATE TABLE storage.buckets (
    id text NOT NULL,
    name text NOT NULL,
    owner uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    public boolean DEFAULT false,
    avif_autodetection boolean DEFAULT false,
    file_size_limit bigint,
    allowed_mime_types text[],
    owner_id text,
    type storage.buckettype DEFAULT 'STANDARD'::storage.buckettype NOT NULL
);


ALTER TABLE storage.buckets OWNER TO supabase_storage_admin;

--
--

COMMENT ON COLUMN storage.buckets.owner IS 'Field is deprecated, use owner_id instead';


--
--

CREATE TABLE storage.buckets_analytics (
    name text NOT NULL,
    type storage.buckettype DEFAULT 'ANALYTICS'::storage.buckettype NOT NULL,
    format text DEFAULT 'ICEBERG'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE storage.buckets_analytics OWNER TO supabase_storage_admin;

--
--

CREATE TABLE storage.buckets_vectors (
    id text NOT NULL,
    type storage.buckettype DEFAULT 'VECTOR'::storage.buckettype NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE storage.buckets_vectors OWNER TO supabase_storage_admin;

--
--

CREATE TABLE storage.migrations (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    hash character varying(40) NOT NULL,
    executed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE storage.migrations OWNER TO supabase_storage_admin;

--
--

CREATE TABLE storage.objects (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    bucket_id text,
    name text,
    owner uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    last_accessed_at timestamp with time zone DEFAULT now(),
    metadata jsonb,
    path_tokens text[] GENERATED ALWAYS AS (string_to_array(name, '/'::text)) STORED,
    version text,
    owner_id text,
    user_metadata jsonb
);


ALTER TABLE storage.objects OWNER TO supabase_storage_admin;

--
--

COMMENT ON COLUMN storage.objects.owner IS 'Field is deprecated, use owner_id instead';


--
--

CREATE TABLE storage.s3_multipart_uploads (
    id text NOT NULL,
    in_progress_size bigint DEFAULT 0 NOT NULL,
    upload_signature text NOT NULL,
    bucket_id text NOT NULL,
    key text NOT NULL COLLATE pg_catalog."C",
    version text NOT NULL,
    owner_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    user_metadata jsonb,
    metadata jsonb
);


ALTER TABLE storage.s3_multipart_uploads OWNER TO supabase_storage_admin;

--
--

CREATE TABLE storage.s3_multipart_uploads_parts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    upload_id text NOT NULL,
    size bigint DEFAULT 0 NOT NULL,
    part_number integer NOT NULL,
    bucket_id text NOT NULL,
    key text NOT NULL COLLATE pg_catalog."C",
    etag text NOT NULL,
    owner_id text,
    version text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE storage.s3_multipart_uploads_parts OWNER TO supabase_storage_admin;

--
--

CREATE TABLE storage.vector_indexes (
    id text DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL COLLATE pg_catalog."C",
    bucket_id text NOT NULL,
    data_type text NOT NULL,
    dimension integer NOT NULL,
    distance_metric text NOT NULL,
    metadata_configuration jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE storage.vector_indexes OWNER TO supabase_storage_admin;

--
-- Name: schema_migrations; Type: TABLE; Schema: supabase_migrations; Owner: postgres
--

CREATE TABLE supabase_migrations.schema_migrations (
    version text NOT NULL,
    statements text[],
    name text
);


ALTER TABLE supabase_migrations.schema_migrations OWNER TO postgres;

--
--

ALTER TABLE ONLY realtime.messages ATTACH PARTITION realtime.messages_2026_05_30 FOR VALUES FROM ('2026-05-30 00:00:00') TO ('2026-05-31 00:00:00');


--
--

ALTER TABLE ONLY realtime.messages ATTACH PARTITION realtime.messages_2026_05_31 FOR VALUES FROM ('2026-05-31 00:00:00') TO ('2026-06-01 00:00:00');


--
--

ALTER TABLE ONLY realtime.messages ATTACH PARTITION realtime.messages_2026_06_01 FOR VALUES FROM ('2026-06-01 00:00:00') TO ('2026-06-02 00:00:00');


--
--

ALTER TABLE ONLY realtime.messages ATTACH PARTITION realtime.messages_2026_06_02 FOR VALUES FROM ('2026-06-02 00:00:00') TO ('2026-06-03 00:00:00');


--
--

ALTER TABLE ONLY realtime.messages ATTACH PARTITION realtime.messages_2026_06_03 FOR VALUES FROM ('2026-06-03 00:00:00') TO ('2026-06-04 00:00:00');


--
--

ALTER TABLE ONLY realtime.messages ATTACH PARTITION realtime.messages_2026_06_04 FOR VALUES FROM ('2026-06-04 00:00:00') TO ('2026-06-05 00:00:00');


--
--

ALTER TABLE ONLY realtime.messages ATTACH PARTITION realtime.messages_2026_06_05 FOR VALUES FROM ('2026-06-05 00:00:00') TO ('2026-06-06 00:00:00');


--
--

ALTER TABLE ONLY auth.refresh_tokens ALTER COLUMN id SET DEFAULT nextval('auth.refresh_tokens_id_seq'::regclass);


--
-- Name: waitlist founding_number; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.waitlist ALTER COLUMN founding_number SET DEFAULT nextval('public.waitlist_founding_seq'::regclass);


--
