--
-- PostgreSQL database dump
--

\restrict VS6ruW641wqpWV1QzYAuW5bRemer4btQcdezOMAbHgpVZJjhd4ZGXjGpteLA6L0

-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.3 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: auth; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA auth;


ALTER SCHEMA auth OWNER TO supabase_admin;

--
-- Name: pg_cron; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;


--
-- Name: EXTENSION pg_cron; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pg_cron IS 'Job scheduler for PostgreSQL';


--
-- Name: extensions; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA extensions;


ALTER SCHEMA extensions OWNER TO postgres;

--
-- Name: graphql; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA graphql;


ALTER SCHEMA graphql OWNER TO supabase_admin;

--
-- Name: graphql_public; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA graphql_public;


ALTER SCHEMA graphql_public OWNER TO supabase_admin;

--
-- Name: pg_net; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA public;


--
-- Name: EXTENSION pg_net; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pg_net IS 'Async HTTP';


--
-- Name: pgbouncer; Type: SCHEMA; Schema: -; Owner: pgbouncer
--

CREATE SCHEMA pgbouncer;


ALTER SCHEMA pgbouncer OWNER TO pgbouncer;

--
-- Name: realtime; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA realtime;


ALTER SCHEMA realtime OWNER TO supabase_admin;

--
-- Name: storage; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA storage;


ALTER SCHEMA storage OWNER TO supabase_admin;

--
-- Name: supabase_migrations; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA supabase_migrations;


ALTER SCHEMA supabase_migrations OWNER TO postgres;

--
-- Name: vault; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA vault;


ALTER SCHEMA vault OWNER TO supabase_admin;

--
-- Name: hypopg; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS hypopg WITH SCHEMA extensions;


--
-- Name: EXTENSION hypopg; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION hypopg IS 'Hypothetical indexes for PostgreSQL';


--
-- Name: index_advisor; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS index_advisor WITH SCHEMA extensions;


--
-- Name: EXTENSION index_advisor; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION index_advisor IS 'Query index advisor';


--
-- Name: pg_stat_statements; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_stat_statements WITH SCHEMA extensions;


--
-- Name: EXTENSION pg_stat_statements; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pg_stat_statements IS 'track planning and execution statistics of all SQL statements executed';


--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: postgis; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA public;


--
-- Name: EXTENSION postgis; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION postgis IS 'PostGIS geometry and geography spatial types and functions';


--
-- Name: supabase_vault; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS supabase_vault WITH SCHEMA vault;


--
-- Name: EXTENSION supabase_vault; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION supabase_vault IS 'Supabase Vault Extension';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: vector; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA public;


--
-- Name: EXTENSION vector; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION vector IS 'vector data type and ivfflat and hnsw access methods';


--
-- Name: aal_level; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.aal_level AS ENUM (
    'aal1',
    'aal2',
    'aal3'
);


ALTER TYPE auth.aal_level OWNER TO supabase_auth_admin;

--
-- Name: code_challenge_method; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.code_challenge_method AS ENUM (
    's256',
    'plain'
);


ALTER TYPE auth.code_challenge_method OWNER TO supabase_auth_admin;

--
-- Name: factor_status; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.factor_status AS ENUM (
    'unverified',
    'verified'
);


ALTER TYPE auth.factor_status OWNER TO supabase_auth_admin;

--
-- Name: factor_type; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.factor_type AS ENUM (
    'totp',
    'webauthn',
    'phone'
);


ALTER TYPE auth.factor_type OWNER TO supabase_auth_admin;

--
-- Name: oauth_authorization_status; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.oauth_authorization_status AS ENUM (
    'pending',
    'approved',
    'denied',
    'expired'
);


ALTER TYPE auth.oauth_authorization_status OWNER TO supabase_auth_admin;

--
-- Name: oauth_client_type; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.oauth_client_type AS ENUM (
    'public',
    'confidential'
);


ALTER TYPE auth.oauth_client_type OWNER TO supabase_auth_admin;

--
-- Name: oauth_registration_type; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.oauth_registration_type AS ENUM (
    'dynamic',
    'manual'
);


ALTER TYPE auth.oauth_registration_type OWNER TO supabase_auth_admin;

--
-- Name: oauth_response_type; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.oauth_response_type AS ENUM (
    'code'
);


ALTER TYPE auth.oauth_response_type OWNER TO supabase_auth_admin;

--
-- Name: one_time_token_type; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.one_time_token_type AS ENUM (
    'confirmation_token',
    'reauthentication_token',
    'recovery_token',
    'email_change_token_new',
    'email_change_token_current',
    'phone_change_token'
);


ALTER TYPE auth.one_time_token_type OWNER TO supabase_auth_admin;

--
-- Name: action; Type: TYPE; Schema: realtime; Owner: supabase_admin
--

CREATE TYPE realtime.action AS ENUM (
    'INSERT',
    'UPDATE',
    'DELETE',
    'TRUNCATE',
    'ERROR'
);


ALTER TYPE realtime.action OWNER TO supabase_admin;

--
-- Name: equality_op; Type: TYPE; Schema: realtime; Owner: supabase_admin
--

CREATE TYPE realtime.equality_op AS ENUM (
    'eq',
    'neq',
    'lt',
    'lte',
    'gt',
    'gte',
    'in'
);


ALTER TYPE realtime.equality_op OWNER TO supabase_admin;

--
-- Name: user_defined_filter; Type: TYPE; Schema: realtime; Owner: supabase_admin
--

CREATE TYPE realtime.user_defined_filter AS (
	column_name text,
	op realtime.equality_op,
	value text
);


ALTER TYPE realtime.user_defined_filter OWNER TO supabase_admin;

--
-- Name: wal_column; Type: TYPE; Schema: realtime; Owner: supabase_admin
--

CREATE TYPE realtime.wal_column AS (
	name text,
	type_name text,
	type_oid oid,
	value jsonb,
	is_pkey boolean,
	is_selectable boolean
);


ALTER TYPE realtime.wal_column OWNER TO supabase_admin;

--
-- Name: wal_rls; Type: TYPE; Schema: realtime; Owner: supabase_admin
--

CREATE TYPE realtime.wal_rls AS (
	wal jsonb,
	is_rls_enabled boolean,
	subscription_ids uuid[],
	errors text[]
);


ALTER TYPE realtime.wal_rls OWNER TO supabase_admin;

--
-- Name: buckettype; Type: TYPE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TYPE storage.buckettype AS ENUM (
    'STANDARD',
    'ANALYTICS',
    'VECTOR'
);


ALTER TYPE storage.buckettype OWNER TO supabase_storage_admin;

--
-- Name: email(); Type: FUNCTION; Schema: auth; Owner: supabase_auth_admin
--

CREATE FUNCTION auth.email() RETURNS text
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.email', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'email')
  )::text
$$;


ALTER FUNCTION auth.email() OWNER TO supabase_auth_admin;

--
-- Name: FUNCTION email(); Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON FUNCTION auth.email() IS 'Deprecated. Use auth.jwt() -> ''email'' instead.';


--
-- Name: jwt(); Type: FUNCTION; Schema: auth; Owner: supabase_auth_admin
--

CREATE FUNCTION auth.jwt() RETURNS jsonb
    LANGUAGE sql STABLE
    AS $$
  select 
    coalesce(
        nullif(current_setting('request.jwt.claim', true), ''),
        nullif(current_setting('request.jwt.claims', true), '')
    )::jsonb
$$;


ALTER FUNCTION auth.jwt() OWNER TO supabase_auth_admin;

--
-- Name: role(); Type: FUNCTION; Schema: auth; Owner: supabase_auth_admin
--

CREATE FUNCTION auth.role() RETURNS text
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')
  )::text
$$;


ALTER FUNCTION auth.role() OWNER TO supabase_auth_admin;

--
-- Name: FUNCTION role(); Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON FUNCTION auth.role() IS 'Deprecated. Use auth.jwt() -> ''role'' instead.';


--
-- Name: uid(); Type: FUNCTION; Schema: auth; Owner: supabase_auth_admin
--

CREATE FUNCTION auth.uid() RETURNS uuid
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid
$$;


ALTER FUNCTION auth.uid() OWNER TO supabase_auth_admin;

--
-- Name: FUNCTION uid(); Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON FUNCTION auth.uid() IS 'Deprecated. Use auth.jwt() -> ''sub'' instead.';


--
-- Name: grant_pg_cron_access(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
--

CREATE FUNCTION extensions.grant_pg_cron_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF EXISTS (
    SELECT
    FROM pg_event_trigger_ddl_commands() AS ev
    JOIN pg_extension AS ext
    ON ev.objid = ext.oid
    WHERE ext.extname = 'pg_cron'
  )
  THEN
    grant usage on schema cron to postgres with grant option;

    alter default privileges in schema cron grant all on tables to postgres with grant option;
    alter default privileges in schema cron grant all on functions to postgres with grant option;
    alter default privileges in schema cron grant all on sequences to postgres with grant option;

    alter default privileges for user supabase_admin in schema cron grant all
        on sequences to postgres with grant option;
    alter default privileges for user supabase_admin in schema cron grant all
        on tables to postgres with grant option;
    alter default privileges for user supabase_admin in schema cron grant all
        on functions to postgres with grant option;

    grant all privileges on all tables in schema cron to postgres with grant option;
    revoke all on table cron.job from postgres;
    grant select on table cron.job to postgres with grant option;
  END IF;
END;
$$;


ALTER FUNCTION extensions.grant_pg_cron_access() OWNER TO supabase_admin;

--
-- Name: FUNCTION grant_pg_cron_access(); Type: COMMENT; Schema: extensions; Owner: supabase_admin
--

COMMENT ON FUNCTION extensions.grant_pg_cron_access() IS 'Grants access to pg_cron';


--
-- Name: grant_pg_graphql_access(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
--

CREATE FUNCTION extensions.grant_pg_graphql_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $_$
DECLARE
    func_is_graphql_resolve bool;
BEGIN
    func_is_graphql_resolve = (
        SELECT n.proname = 'resolve'
        FROM pg_event_trigger_ddl_commands() AS ev
        LEFT JOIN pg_catalog.pg_proc AS n
        ON ev.objid = n.oid
    );

    IF func_is_graphql_resolve
    THEN
        -- Update public wrapper to pass all arguments through to the pg_graphql resolve func
        DROP FUNCTION IF EXISTS graphql_public.graphql;
        create or replace function graphql_public.graphql(
            "operationName" text default null,
            query text default null,
            variables jsonb default null,
            extensions jsonb default null
        )
            returns jsonb
            language sql
        as $$
            select graphql.resolve(
                query := query,
                variables := coalesce(variables, '{}'),
                "operationName" := "operationName",
                extensions := extensions
            );
        $$;

        -- This hook executes when `graphql.resolve` is created. That is not necessarily the last
        -- function in the extension so we need to grant permissions on existing entities AND
        -- update default permissions to any others that are created after `graphql.resolve`
        grant usage on schema graphql to postgres, anon, authenticated, service_role;
        grant select on all tables in schema graphql to postgres, anon, authenticated, service_role;
        grant execute on all functions in schema graphql to postgres, anon, authenticated, service_role;
        grant all on all sequences in schema graphql to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on tables to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on functions to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on sequences to postgres, anon, authenticated, service_role;

        -- Allow postgres role to allow granting usage on graphql and graphql_public schemas to custom roles
        grant usage on schema graphql_public to postgres with grant option;
        grant usage on schema graphql to postgres with grant option;
    END IF;

END;
$_$;


ALTER FUNCTION extensions.grant_pg_graphql_access() OWNER TO supabase_admin;

--
-- Name: FUNCTION grant_pg_graphql_access(); Type: COMMENT; Schema: extensions; Owner: supabase_admin
--

COMMENT ON FUNCTION extensions.grant_pg_graphql_access() IS 'Grants access to pg_graphql';


--
-- Name: grant_pg_net_access(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
--

CREATE FUNCTION extensions.grant_pg_net_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_event_trigger_ddl_commands() AS ev
    JOIN pg_extension AS ext
    ON ev.objid = ext.oid
    WHERE ext.extname = 'pg_net'
  )
  THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_roles
      WHERE rolname = 'supabase_functions_admin'
    )
    THEN
      CREATE USER supabase_functions_admin NOINHERIT CREATEROLE LOGIN NOREPLICATION;
    END IF;

    GRANT USAGE ON SCHEMA net TO supabase_functions_admin, postgres, anon, authenticated, service_role;

    IF EXISTS (
      SELECT FROM pg_extension
      WHERE extname = 'pg_net'
      -- all versions in use on existing projects as of 2025-02-20
      -- version 0.12.0 onwards don't need these applied
      AND extversion IN ('0.2', '0.6', '0.7', '0.7.1', '0.8', '0.10.0', '0.11.0')
    ) THEN
      ALTER function net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) SECURITY DEFINER;
      ALTER function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) SECURITY DEFINER;

      ALTER function net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) SET search_path = net;
      ALTER function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) SET search_path = net;

      REVOKE ALL ON FUNCTION net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) FROM PUBLIC;
      REVOKE ALL ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) FROM PUBLIC;

      GRANT EXECUTE ON FUNCTION net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) TO supabase_functions_admin, postgres, anon, authenticated, service_role;
      GRANT EXECUTE ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) TO supabase_functions_admin, postgres, anon, authenticated, service_role;
    END IF;
  END IF;
END;
$$;


ALTER FUNCTION extensions.grant_pg_net_access() OWNER TO supabase_admin;

--
-- Name: FUNCTION grant_pg_net_access(); Type: COMMENT; Schema: extensions; Owner: supabase_admin
--

COMMENT ON FUNCTION extensions.grant_pg_net_access() IS 'Grants access to pg_net';


--
-- Name: pgrst_ddl_watch(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
--

CREATE FUNCTION extensions.pgrst_ddl_watch() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN SELECT * FROM pg_event_trigger_ddl_commands()
  LOOP
    IF cmd.command_tag IN (
      'CREATE SCHEMA', 'ALTER SCHEMA'
    , 'CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO', 'ALTER TABLE'
    , 'CREATE FOREIGN TABLE', 'ALTER FOREIGN TABLE'
    , 'CREATE VIEW', 'ALTER VIEW'
    , 'CREATE MATERIALIZED VIEW', 'ALTER MATERIALIZED VIEW'
    , 'CREATE FUNCTION', 'ALTER FUNCTION'
    , 'CREATE TRIGGER'
    , 'CREATE TYPE', 'ALTER TYPE'
    , 'CREATE RULE'
    , 'COMMENT'
    )
    -- don't notify in case of CREATE TEMP table or other objects created on pg_temp
    AND cmd.schema_name is distinct from 'pg_temp'
    THEN
      NOTIFY pgrst, 'reload schema';
    END IF;
  END LOOP;
END; $$;


ALTER FUNCTION extensions.pgrst_ddl_watch() OWNER TO supabase_admin;

--
-- Name: pgrst_drop_watch(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
--

CREATE FUNCTION extensions.pgrst_drop_watch() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  obj record;
BEGIN
  FOR obj IN SELECT * FROM pg_event_trigger_dropped_objects()
  LOOP
    IF obj.object_type IN (
      'schema'
    , 'table'
    , 'foreign table'
    , 'view'
    , 'materialized view'
    , 'function'
    , 'trigger'
    , 'type'
    , 'rule'
    )
    AND obj.is_temporary IS false -- no pg_temp objects
    THEN
      NOTIFY pgrst, 'reload schema';
    END IF;
  END LOOP;
END; $$;


ALTER FUNCTION extensions.pgrst_drop_watch() OWNER TO supabase_admin;

--
-- Name: set_graphql_placeholder(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
--

CREATE FUNCTION extensions.set_graphql_placeholder() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $_$
    DECLARE
    graphql_is_dropped bool;
    BEGIN
    graphql_is_dropped = (
        SELECT ev.schema_name = 'graphql_public'
        FROM pg_event_trigger_dropped_objects() AS ev
        WHERE ev.schema_name = 'graphql_public'
    );

    IF graphql_is_dropped
    THEN
        create or replace function graphql_public.graphql(
            "operationName" text default null,
            query text default null,
            variables jsonb default null,
            extensions jsonb default null
        )
            returns jsonb
            language plpgsql
        as $$
            DECLARE
                server_version float;
            BEGIN
                server_version = (SELECT (SPLIT_PART((select version()), ' ', 2))::float);

                IF server_version >= 14 THEN
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql extension is not enabled.'
                            )
                        )
                    );
                ELSE
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql is only available on projects running Postgres 14 onwards.'
                            )
                        )
                    );
                END IF;
            END;
        $$;
    END IF;

    END;
$_$;


ALTER FUNCTION extensions.set_graphql_placeholder() OWNER TO supabase_admin;

--
-- Name: FUNCTION set_graphql_placeholder(); Type: COMMENT; Schema: extensions; Owner: supabase_admin
--

COMMENT ON FUNCTION extensions.set_graphql_placeholder() IS 'Reintroduces placeholder function for graphql_public.graphql';


--
-- Name: graphql(text, text, jsonb, jsonb); Type: FUNCTION; Schema: graphql_public; Owner: supabase_admin
--

CREATE FUNCTION graphql_public.graphql("operationName" text DEFAULT NULL::text, query text DEFAULT NULL::text, variables jsonb DEFAULT NULL::jsonb, extensions jsonb DEFAULT NULL::jsonb) RETURNS jsonb
    LANGUAGE plpgsql
    AS $$
            DECLARE
                server_version float;
            BEGIN
                server_version = (SELECT (SPLIT_PART((select version()), ' ', 2))::float);

                IF server_version >= 14 THEN
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql extension is not enabled.'
                            )
                        )
                    );
                ELSE
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql is only available on projects running Postgres 14 onwards.'
                            )
                        )
                    );
                END IF;
            END;
        $$;


ALTER FUNCTION graphql_public.graphql("operationName" text, query text, variables jsonb, extensions jsonb) OWNER TO supabase_admin;

--
-- Name: get_auth(text); Type: FUNCTION; Schema: pgbouncer; Owner: supabase_admin
--

CREATE FUNCTION pgbouncer.get_auth(p_usename text) RETURNS TABLE(username text, password text)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $_$
  BEGIN
      RAISE DEBUG 'PgBouncer auth request: %', p_usename;

      RETURN QUERY
      SELECT
          rolname::text,
          CASE WHEN rolvaliduntil < now()
              THEN null
              ELSE rolpassword::text
          END
      FROM pg_authid
      WHERE rolname=$1 and rolcanlogin;
  END;
  $_$;


ALTER FUNCTION pgbouncer.get_auth(p_usename text) OWNER TO supabase_admin;

--
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
-- Name: apply_rls(jsonb, integer); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
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
-- Name: broadcast_changes(text, text, text, text, text, record, record, text); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
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
-- Name: build_prepared_statement_sql(text, regclass, realtime.wal_column[]); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
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
-- Name: cast(text, regtype); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
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
-- Name: check_equality_op(realtime.equality_op, regtype, text, text); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
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
-- Name: is_visible_through_filters(realtime.wal_column[], realtime.user_defined_filter[]); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
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
-- Name: list_changes(name, name, integer, integer); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
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
-- Name: quote_wal2json(regclass); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
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
-- Name: send(jsonb, text, text, boolean); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
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
-- Name: subscription_check_filters(); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
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
-- Name: to_regrole(text); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.to_regrole(role_name text) RETURNS regrole
    LANGUAGE sql IMMUTABLE
    AS $$ select role_name::regrole $$;


ALTER FUNCTION realtime.to_regrole(role_name text) OWNER TO supabase_admin;

--
-- Name: topic(); Type: FUNCTION; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE FUNCTION realtime.topic() RETURNS text
    LANGUAGE sql STABLE
    AS $$
select nullif(current_setting('realtime.topic', true), '')::text;
$$;


ALTER FUNCTION realtime.topic() OWNER TO supabase_realtime_admin;

--
-- Name: allow_any_operation(text[]); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
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
-- Name: allow_only_operation(text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
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
-- Name: can_insert_object(text, text, uuid, jsonb); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
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
-- Name: enforce_bucket_name_length(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
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
-- Name: extension(text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
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
-- Name: filename(text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
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
-- Name: foldername(text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
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
-- Name: get_common_prefix(text, text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
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
-- Name: get_size_by_bucket(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
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
-- Name: list_multipart_uploads_with_delimiter(text, text, text, integer, text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
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
-- Name: list_objects_with_delimiter(text, text, text, integer, text, text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
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
-- Name: operation(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
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
-- Name: protect_delete(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
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
-- Name: search(text, text, integer, integer, integer, text, text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
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
-- Name: search_by_timestamp(text, text, integer, integer, text, text, text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
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
-- Name: search_v2(text, text, integer, integer, text, text, text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
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
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
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
-- Name: audit_log_entries; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
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
-- Name: TABLE audit_log_entries; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.audit_log_entries IS 'Auth: Audit trail for user actions.';


--
-- Name: custom_oauth_providers; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
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
-- Name: flow_state; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
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
-- Name: TABLE flow_state; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.flow_state IS 'Stores metadata for all OAuth/SSO login flows';


--
-- Name: identities; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
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
-- Name: TABLE identities; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.identities IS 'Auth: Stores identities associated to a user.';


--
-- Name: COLUMN identities.email; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.identities.email IS 'Auth: Email is a generated column that references the optional email property in the identity_data';


--
-- Name: instances; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
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
-- Name: TABLE instances; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.instances IS 'Auth: Manages users across multiple sites.';


--
-- Name: mfa_amr_claims; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
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
-- Name: TABLE mfa_amr_claims; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.mfa_amr_claims IS 'auth: stores authenticator method reference claims for multi factor authentication';


--
-- Name: mfa_challenges; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
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
-- Name: TABLE mfa_challenges; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.mfa_challenges IS 'auth: stores metadata about challenge requests made';


--
-- Name: mfa_factors; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
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
-- Name: TABLE mfa_factors; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.mfa_factors IS 'auth: stores metadata about factors';


--
-- Name: COLUMN mfa_factors.last_webauthn_challenge_data; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.mfa_factors.last_webauthn_challenge_data IS 'Stores the latest WebAuthn challenge data including attestation/assertion for customer verification';


--
-- Name: oauth_authorizations; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
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
-- Name: oauth_client_states; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.oauth_client_states (
    id uuid NOT NULL,
    provider_type text NOT NULL,
    code_verifier text,
    created_at timestamp with time zone NOT NULL
);


ALTER TABLE auth.oauth_client_states OWNER TO supabase_auth_admin;

--
-- Name: TABLE oauth_client_states; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.oauth_client_states IS 'Stores OAuth states for third-party provider authentication flows where Supabase acts as the OAuth client.';


--
-- Name: oauth_clients; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
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
-- Name: oauth_consents; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
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
-- Name: one_time_tokens; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
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
-- Name: refresh_tokens; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
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
-- Name: TABLE refresh_tokens; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.refresh_tokens IS 'Auth: Store of tokens used to refresh JWT tokens once they expire.';


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE; Schema: auth; Owner: supabase_auth_admin
--

CREATE SEQUENCE auth.refresh_tokens_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE auth.refresh_tokens_id_seq OWNER TO supabase_auth_admin;

--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: auth; Owner: supabase_auth_admin
--

ALTER SEQUENCE auth.refresh_tokens_id_seq OWNED BY auth.refresh_tokens.id;


--
-- Name: saml_providers; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
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
-- Name: TABLE saml_providers; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.saml_providers IS 'Auth: Manages SAML Identity Provider connections.';


--
-- Name: saml_relay_states; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
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
-- Name: TABLE saml_relay_states; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.saml_relay_states IS 'Auth: Contains SAML Relay State information for each Service Provider initiated login.';


--
-- Name: schema_migrations; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.schema_migrations (
    version character varying(255) NOT NULL
);


ALTER TABLE auth.schema_migrations OWNER TO supabase_auth_admin;

--
-- Name: TABLE schema_migrations; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.schema_migrations IS 'Auth: Manages updates to the auth system.';


--
-- Name: sessions; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
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
-- Name: TABLE sessions; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.sessions IS 'Auth: Stores session data associated to a user.';


--
-- Name: COLUMN sessions.not_after; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.sessions.not_after IS 'Auth: Not after is a nullable column that contains a timestamp after which the session should be regarded as expired.';


--
-- Name: COLUMN sessions.refresh_token_hmac_key; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.sessions.refresh_token_hmac_key IS 'Holds a HMAC-SHA256 key used to sign refresh tokens for this session.';


--
-- Name: COLUMN sessions.refresh_token_counter; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.sessions.refresh_token_counter IS 'Holds the ID (counter) of the last issued refresh token.';


--
-- Name: sso_domains; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
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
-- Name: TABLE sso_domains; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.sso_domains IS 'Auth: Manages SSO email address domain mapping to an SSO Identity Provider.';


--
-- Name: sso_providers; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
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
-- Name: TABLE sso_providers; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.sso_providers IS 'Auth: Manages SSO identity provider information; see saml_providers for SAML.';


--
-- Name: COLUMN sso_providers.resource_id; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.sso_providers.resource_id IS 'Auth: Uniquely identifies a SSO provider according to a user-chosen resource ID (case insensitive), useful in infrastructure as code.';


--
-- Name: users; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
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
-- Name: TABLE users; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.users IS 'Auth: Stores user login data within a secure schema.';


--
-- Name: COLUMN users.is_sso_user; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.users.is_sso_user IS 'Auth: Set this column to true when the account comes from SSO. These accounts can have duplicate emails.';


--
-- Name: webauthn_challenges; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
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
-- Name: webauthn_credentials; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
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
-- Name: messages; Type: TABLE; Schema: realtime; Owner: supabase_realtime_admin
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
-- Name: messages_2026_05_30; Type: TABLE; Schema: realtime; Owner: supabase_admin
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
-- Name: messages_2026_05_31; Type: TABLE; Schema: realtime; Owner: supabase_admin
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
-- Name: messages_2026_06_01; Type: TABLE; Schema: realtime; Owner: supabase_admin
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
-- Name: messages_2026_06_02; Type: TABLE; Schema: realtime; Owner: supabase_admin
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
-- Name: messages_2026_06_03; Type: TABLE; Schema: realtime; Owner: supabase_admin
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
-- Name: messages_2026_06_04; Type: TABLE; Schema: realtime; Owner: supabase_admin
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
-- Name: messages_2026_06_05; Type: TABLE; Schema: realtime; Owner: supabase_admin
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
-- Name: schema_migrations; Type: TABLE; Schema: realtime; Owner: supabase_admin
--

CREATE TABLE realtime.schema_migrations (
    version bigint NOT NULL,
    inserted_at timestamp(0) without time zone
);


ALTER TABLE realtime.schema_migrations OWNER TO supabase_admin;

--
-- Name: subscription; Type: TABLE; Schema: realtime; Owner: supabase_admin
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
-- Name: subscription_id_seq; Type: SEQUENCE; Schema: realtime; Owner: supabase_admin
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
-- Name: buckets; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
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
-- Name: COLUMN buckets.owner; Type: COMMENT; Schema: storage; Owner: supabase_storage_admin
--

COMMENT ON COLUMN storage.buckets.owner IS 'Field is deprecated, use owner_id instead';


--
-- Name: buckets_analytics; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
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
-- Name: buckets_vectors; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.buckets_vectors (
    id text NOT NULL,
    type storage.buckettype DEFAULT 'VECTOR'::storage.buckettype NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE storage.buckets_vectors OWNER TO supabase_storage_admin;

--
-- Name: migrations; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.migrations (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    hash character varying(40) NOT NULL,
    executed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE storage.migrations OWNER TO supabase_storage_admin;

--
-- Name: objects; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
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
-- Name: COLUMN objects.owner; Type: COMMENT; Schema: storage; Owner: supabase_storage_admin
--

COMMENT ON COLUMN storage.objects.owner IS 'Field is deprecated, use owner_id instead';


--
-- Name: s3_multipart_uploads; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
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
-- Name: s3_multipart_uploads_parts; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
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
-- Name: vector_indexes; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
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
-- Name: messages_2026_05_30; Type: TABLE ATTACH; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.messages ATTACH PARTITION realtime.messages_2026_05_30 FOR VALUES FROM ('2026-05-30 00:00:00') TO ('2026-05-31 00:00:00');


--
-- Name: messages_2026_05_31; Type: TABLE ATTACH; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.messages ATTACH PARTITION realtime.messages_2026_05_31 FOR VALUES FROM ('2026-05-31 00:00:00') TO ('2026-06-01 00:00:00');


--
-- Name: messages_2026_06_01; Type: TABLE ATTACH; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.messages ATTACH PARTITION realtime.messages_2026_06_01 FOR VALUES FROM ('2026-06-01 00:00:00') TO ('2026-06-02 00:00:00');


--
-- Name: messages_2026_06_02; Type: TABLE ATTACH; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.messages ATTACH PARTITION realtime.messages_2026_06_02 FOR VALUES FROM ('2026-06-02 00:00:00') TO ('2026-06-03 00:00:00');


--
-- Name: messages_2026_06_03; Type: TABLE ATTACH; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.messages ATTACH PARTITION realtime.messages_2026_06_03 FOR VALUES FROM ('2026-06-03 00:00:00') TO ('2026-06-04 00:00:00');


--
-- Name: messages_2026_06_04; Type: TABLE ATTACH; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.messages ATTACH PARTITION realtime.messages_2026_06_04 FOR VALUES FROM ('2026-06-04 00:00:00') TO ('2026-06-05 00:00:00');


--
-- Name: messages_2026_06_05; Type: TABLE ATTACH; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.messages ATTACH PARTITION realtime.messages_2026_06_05 FOR VALUES FROM ('2026-06-05 00:00:00') TO ('2026-06-06 00:00:00');


--
-- Name: refresh_tokens id; Type: DEFAULT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.refresh_tokens ALTER COLUMN id SET DEFAULT nextval('auth.refresh_tokens_id_seq'::regclass);


--
-- Name: waitlist founding_number; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.waitlist ALTER COLUMN founding_number SET DEFAULT nextval('public.waitlist_founding_seq'::regclass);


--
-- Name: mfa_amr_claims amr_id_pk; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT amr_id_pk PRIMARY KEY (id);


--
-- Name: audit_log_entries audit_log_entries_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.audit_log_entries
    ADD CONSTRAINT audit_log_entries_pkey PRIMARY KEY (id);


--
-- Name: custom_oauth_providers custom_oauth_providers_identifier_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.custom_oauth_providers
    ADD CONSTRAINT custom_oauth_providers_identifier_key UNIQUE (identifier);


--
-- Name: custom_oauth_providers custom_oauth_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.custom_oauth_providers
    ADD CONSTRAINT custom_oauth_providers_pkey PRIMARY KEY (id);


--
-- Name: flow_state flow_state_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.flow_state
    ADD CONSTRAINT flow_state_pkey PRIMARY KEY (id);


--
-- Name: identities identities_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_pkey PRIMARY KEY (id);


--
-- Name: identities identities_provider_id_provider_unique; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_provider_id_provider_unique UNIQUE (provider_id, provider);


--
-- Name: instances instances_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.instances
    ADD CONSTRAINT instances_pkey PRIMARY KEY (id);


--
-- Name: mfa_amr_claims mfa_amr_claims_session_id_authentication_method_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT mfa_amr_claims_session_id_authentication_method_pkey UNIQUE (session_id, authentication_method);


--
-- Name: mfa_challenges mfa_challenges_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_challenges
    ADD CONSTRAINT mfa_challenges_pkey PRIMARY KEY (id);


--
-- Name: mfa_factors mfa_factors_last_challenged_at_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_last_challenged_at_key UNIQUE (last_challenged_at);


--
-- Name: mfa_factors mfa_factors_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_pkey PRIMARY KEY (id);


--
-- Name: oauth_authorizations oauth_authorizations_authorization_code_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_authorization_code_key UNIQUE (authorization_code);


--
-- Name: oauth_authorizations oauth_authorizations_authorization_id_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_authorization_id_key UNIQUE (authorization_id);


--
-- Name: oauth_authorizations oauth_authorizations_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_pkey PRIMARY KEY (id);


--
-- Name: oauth_client_states oauth_client_states_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_client_states
    ADD CONSTRAINT oauth_client_states_pkey PRIMARY KEY (id);


--
-- Name: oauth_clients oauth_clients_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_clients
    ADD CONSTRAINT oauth_clients_pkey PRIMARY KEY (id);


--
-- Name: oauth_consents oauth_consents_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_pkey PRIMARY KEY (id);


--
-- Name: oauth_consents oauth_consents_user_client_unique; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_user_client_unique UNIQUE (user_id, client_id);


--
-- Name: one_time_tokens one_time_tokens_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.one_time_tokens
    ADD CONSTRAINT one_time_tokens_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_token_unique; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_token_unique UNIQUE (token);


--
-- Name: saml_providers saml_providers_entity_id_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_entity_id_key UNIQUE (entity_id);


--
-- Name: saml_providers saml_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_pkey PRIMARY KEY (id);


--
-- Name: saml_relay_states saml_relay_states_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: sso_domains sso_domains_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sso_domains
    ADD CONSTRAINT sso_domains_pkey PRIMARY KEY (id);


--
-- Name: sso_providers sso_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sso_providers
    ADD CONSTRAINT sso_providers_pkey PRIMARY KEY (id);


--
-- Name: users users_phone_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_phone_key UNIQUE (phone);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: webauthn_challenges webauthn_challenges_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.webauthn_challenges
    ADD CONSTRAINT webauthn_challenges_pkey PRIMARY KEY (id);


--
-- Name: webauthn_credentials webauthn_credentials_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.webauthn_credentials
    ADD CONSTRAINT webauthn_credentials_pkey PRIMARY KEY (id);


--
-- Name: ai_chat_usage ai_chat_usage_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_chat_usage
    ADD CONSTRAINT ai_chat_usage_pkey PRIMARY KEY (user_id, usage_date);


--
-- Name: birth_profiles birth_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.birth_profiles
    ADD CONSTRAINT birth_profiles_pkey PRIMARY KEY (id);


--
-- Name: content_meanings content_meanings_entry_id_language_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.content_meanings
    ADD CONSTRAINT content_meanings_entry_id_language_key UNIQUE (entry_id, language);


--
-- Name: content_meanings content_meanings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.content_meanings
    ADD CONSTRAINT content_meanings_pkey PRIMARY KEY (id);


--
-- Name: content_reports content_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.content_reports
    ADD CONSTRAINT content_reports_pkey PRIMARY KEY (id);


--
-- Name: daily_quiz daily_quiz_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.daily_quiz
    ADD CONSTRAINT daily_quiz_pkey PRIMARY KEY (id);


--
-- Name: daily_quiz daily_quiz_tradition_language_date_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.daily_quiz
    ADD CONSTRAINT daily_quiz_tradition_language_date_key UNIQUE (tradition, language, date);


--
-- Name: daily_sadhana daily_sadhana_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.daily_sadhana
    ADD CONSTRAINT daily_sadhana_pkey PRIMARY KEY (id);


--
-- Name: daily_sadhana daily_sadhana_user_id_date_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.daily_sadhana
    ADD CONSTRAINT daily_sadhana_user_id_date_key UNIQUE (user_id, date);


--
-- Name: darshan_preferences darshan_preferences_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.darshan_preferences
    ADD CONSTRAINT darshan_preferences_pkey PRIMARY KEY (user_id, stream_id);


--
-- Name: device_tokens device_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.device_tokens
    ADD CONSTRAINT device_tokens_pkey PRIMARY KEY (id);


--
-- Name: devotional_tracks devotional_tracks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.devotional_tracks
    ADD CONSTRAINT devotional_tracks_pkey PRIMARY KEY (id);


--
-- Name: dharm_veer_daily dharm_veer_daily_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dharm_veer_daily
    ADD CONSTRAINT dharm_veer_daily_pkey PRIMARY KEY (id);


--
-- Name: dharm_veer_daily dharm_veer_daily_tradition_date_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dharm_veer_daily
    ADD CONSTRAINT dharm_veer_daily_tradition_date_key UNIQUE (tradition, date);


--
-- Name: dharm_veers dharm_veers_day_index_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dharm_veers
    ADD CONSTRAINT dharm_veers_day_index_key UNIQUE (day_index);


--
-- Name: dharm_veers dharm_veers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dharm_veers
    ADD CONSTRAINT dharm_veers_pkey PRIMARY KEY (id);


--
-- Name: dharm_veers dharm_veers_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dharm_veers
    ADD CONSTRAINT dharm_veers_slug_key UNIQUE (slug);


--
-- Name: event_rsvps event_rsvps_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_rsvps
    ADD CONSTRAINT event_rsvps_pkey PRIMARY KEY (id);


--
-- Name: event_rsvps event_rsvps_post_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_rsvps
    ADD CONSTRAINT event_rsvps_post_id_user_id_key UNIQUE (post_id, user_id);


--
-- Name: festivals festivals_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.festivals
    ADD CONSTRAINT festivals_pkey PRIMARY KEY (id);


--
-- Name: forum_replies forum_replies_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.forum_replies
    ADD CONSTRAINT forum_replies_pkey PRIMARY KEY (id);


--
-- Name: forum_threads forum_threads_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.forum_threads
    ADD CONSTRAINT forum_threads_pkey PRIMARY KEY (id);


--
-- Name: guided_path_progress guided_path_progress_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.guided_path_progress
    ADD CONSTRAINT guided_path_progress_pkey PRIMARY KEY (id);


--
-- Name: guided_path_progress guided_path_progress_user_id_path_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.guided_path_progress
    ADD CONSTRAINT guided_path_progress_user_id_path_id_key UNIQUE (user_id, path_id);


--
-- Name: hero_assets hero_assets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hero_assets
    ADD CONSTRAINT hero_assets_pkey PRIMARY KEY (id);


--
-- Name: karma_award_log karma_award_log_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.karma_award_log
    ADD CONSTRAINT karma_award_log_pkey PRIMARY KEY (id);


--
-- Name: karma_ledger karma_ledger_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.karma_ledger
    ADD CONSTRAINT karma_ledger_pkey PRIMARY KEY (id);


--
-- Name: kul_events kul_events_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kul_events
    ADD CONSTRAINT kul_events_pkey PRIMARY KEY (id);


--
-- Name: kul_family_members kul_family_members_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kul_family_members
    ADD CONSTRAINT kul_family_members_pkey PRIMARY KEY (id);


--
-- Name: kul_members kul_members_kul_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kul_members
    ADD CONSTRAINT kul_members_kul_id_user_id_key UNIQUE (kul_id, user_id);


--
-- Name: kul_members kul_members_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kul_members
    ADD CONSTRAINT kul_members_pkey PRIMARY KEY (id);


--
-- Name: kul_messages kul_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kul_messages
    ADD CONSTRAINT kul_messages_pkey PRIMARY KEY (id);


--
-- Name: kul_tasks kul_tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kul_tasks
    ADD CONSTRAINT kul_tasks_pkey PRIMARY KEY (id);


--
-- Name: kuls kuls_invite_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kuls
    ADD CONSTRAINT kuls_invite_code_key UNIQUE (invite_code);


--
-- Name: kuls kuls_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kuls
    ADD CONSTRAINT kuls_pkey PRIMARY KEY (id);


--
-- Name: live_darshans live_darshans_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.live_darshans
    ADD CONSTRAINT live_darshans_pkey PRIMARY KEY (id);


--
-- Name: mala_sessions mala_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mala_sessions
    ADD CONSTRAINT mala_sessions_pkey PRIMARY KEY (id);


--
-- Name: mandalis mandalis_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mandalis
    ADD CONSTRAINT mandalis_pkey PRIMARY KEY (id);


--
-- Name: mantras mantras_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mantras
    ADD CONSTRAINT mantras_pkey PRIMARY KEY (id);


--
-- Name: message_threads message_threads_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.message_threads
    ADD CONSTRAINT message_threads_pkey PRIMARY KEY (id);


--
-- Name: monitoring_events monitoring_events_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.monitoring_events
    ADD CONSTRAINT monitoring_events_pkey PRIMARY KEY (id);


--
-- Name: nitya_karma_log nitya_karma_log_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nitya_karma_log
    ADD CONSTRAINT nitya_karma_log_pkey PRIMARY KEY (id);


--
-- Name: nitya_karma_log nitya_karma_log_user_date; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nitya_karma_log
    ADD CONSTRAINT nitya_karma_log_user_date UNIQUE (user_id, date);


--
-- Name: nitya_karma_log nitya_karma_log_user_id_log_date_step_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nitya_karma_log
    ADD CONSTRAINT nitya_karma_log_user_id_log_date_step_id_key UNIQUE (user_id, log_date, step_id);


--
-- Name: nitya_karma_streaks nitya_karma_streaks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nitya_karma_streaks
    ADD CONSTRAINT nitya_karma_streaks_pkey PRIMARY KEY (user_id);


--
-- Name: notification_schedule notification_schedule_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification_schedule
    ADD CONSTRAINT notification_schedule_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: observance_definitions observance_definitions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.observance_definitions
    ADD CONSTRAINT observance_definitions_pkey PRIMARY KEY (id);


--
-- Name: observance_definitions observance_definitions_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.observance_definitions
    ADD CONSTRAINT observance_definitions_slug_key UNIQUE (slug);


--
-- Name: observance_occurrences observance_occurrences_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.observance_occurrences
    ADD CONSTRAINT observance_occurrences_pkey PRIMARY KEY (id);


--
-- Name: pathshala_badges pathshala_badges_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pathshala_badges
    ADD CONSTRAINT pathshala_badges_pkey PRIMARY KEY (id);


--
-- Name: pathshala_badges pathshala_badges_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pathshala_badges
    ADD CONSTRAINT pathshala_badges_slug_key UNIQUE (slug);


--
-- Name: pathshala_circle_members pathshala_circle_members_circle_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pathshala_circle_members
    ADD CONSTRAINT pathshala_circle_members_circle_id_user_id_key UNIQUE (circle_id, user_id);


--
-- Name: pathshala_circle_members pathshala_circle_members_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pathshala_circle_members
    ADD CONSTRAINT pathshala_circle_members_pkey PRIMARY KEY (id);


--
-- Name: pathshala_enrollments pathshala_enrollments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pathshala_enrollments
    ADD CONSTRAINT pathshala_enrollments_pkey PRIMARY KEY (id);


--
-- Name: pathshala_enrollments pathshala_enrollments_user_id_path_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pathshala_enrollments
    ADD CONSTRAINT pathshala_enrollments_user_id_path_id_key UNIQUE (user_id, path_id);


--
-- Name: pathshala_path_chunks pathshala_path_chunks_path_id_chunk_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pathshala_path_chunks
    ADD CONSTRAINT pathshala_path_chunks_path_id_chunk_id_key UNIQUE (path_id, chunk_id);


--
-- Name: pathshala_path_chunks pathshala_path_chunks_path_id_position_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pathshala_path_chunks
    ADD CONSTRAINT pathshala_path_chunks_path_id_position_key UNIQUE (path_id, "position");


--
-- Name: pathshala_path_chunks pathshala_path_chunks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pathshala_path_chunks
    ADD CONSTRAINT pathshala_path_chunks_pkey PRIMARY KEY (id);


--
-- Name: pathshala_paths pathshala_paths_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pathshala_paths
    ADD CONSTRAINT pathshala_paths_pkey PRIMARY KEY (id);


--
-- Name: pathshala_paths pathshala_paths_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pathshala_paths
    ADD CONSTRAINT pathshala_paths_slug_key UNIQUE (slug);


--
-- Name: pathshala_progress pathshala_progress_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pathshala_progress
    ADD CONSTRAINT pathshala_progress_pkey PRIMARY KEY (id);


--
-- Name: pathshala_progress pathshala_progress_user_id_chunk_id_path_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pathshala_progress
    ADD CONSTRAINT pathshala_progress_user_id_chunk_id_path_id_key UNIQUE (user_id, chunk_id, path_id);


--
-- Name: pathshala_recitation_reviews pathshala_recitation_reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pathshala_recitation_reviews
    ADD CONSTRAINT pathshala_recitation_reviews_pkey PRIMARY KEY (id);


--
-- Name: pathshala_recordings pathshala_recordings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pathshala_recordings
    ADD CONSTRAINT pathshala_recordings_pkey PRIMARY KEY (id);


--
-- Name: pathshala_study_circles pathshala_study_circles_kul_id_path_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pathshala_study_circles
    ADD CONSTRAINT pathshala_study_circles_kul_id_path_id_key UNIQUE (kul_id, path_id);


--
-- Name: pathshala_study_circles pathshala_study_circles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pathshala_study_circles
    ADD CONSTRAINT pathshala_study_circles_pkey PRIMARY KEY (id);


--
-- Name: pathshala_translations pathshala_translations_chunk_id_language_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pathshala_translations
    ADD CONSTRAINT pathshala_translations_chunk_id_language_key UNIQUE (chunk_id, language);


--
-- Name: pathshala_translations pathshala_translations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pathshala_translations
    ADD CONSTRAINT pathshala_translations_pkey PRIMARY KEY (id);


--
-- Name: pathshala_user_badges pathshala_user_badges_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pathshala_user_badges
    ADD CONSTRAINT pathshala_user_badges_pkey PRIMARY KEY (id);


--
-- Name: pathshala_user_badges pathshala_user_badges_user_id_badge_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pathshala_user_badges
    ADD CONSTRAINT pathshala_user_badges_user_id_badge_id_key UNIQUE (user_id, badge_id);


--
-- Name: pathshala_user_state pathshala_user_state_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pathshala_user_state
    ADD CONSTRAINT pathshala_user_state_pkey PRIMARY KEY (id);


--
-- Name: pathshala_user_state pathshala_user_state_user_id_entry_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pathshala_user_state
    ADD CONSTRAINT pathshala_user_state_user_id_entry_id_key UNIQUE (user_id, entry_id);


--
-- Name: pathshala_verse_mastery pathshala_verse_mastery_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pathshala_verse_mastery
    ADD CONSTRAINT pathshala_verse_mastery_pkey PRIMARY KEY (user_id, chunk_id);


--
-- Name: post_comments post_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.post_comments
    ADD CONSTRAINT post_comments_pkey PRIMARY KEY (id);


--
-- Name: post_upvotes post_upvotes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.post_upvotes
    ADD CONSTRAINT post_upvotes_pkey PRIMARY KEY (post_id, user_id);


--
-- Name: posts posts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_unsubscribe_token_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_unsubscribe_token_key UNIQUE (unsubscribe_token);


--
-- Name: profiles profiles_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_username_key UNIQUE (username);


--
-- Name: push_subscriptions push_subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.push_subscriptions
    ADD CONSTRAINT push_subscriptions_pkey PRIMARY KEY (id);


--
-- Name: push_subscriptions push_subscriptions_user_id_endpoint_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.push_subscriptions
    ADD CONSTRAINT push_subscriptions_user_id_endpoint_key UNIQUE (user_id, endpoint);


--
-- Name: quiz_responses quiz_responses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quiz_responses
    ADD CONSTRAINT quiz_responses_pkey PRIMARY KEY (id);


--
-- Name: quiz_responses quiz_responses_user_date_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quiz_responses
    ADD CONSTRAINT quiz_responses_user_date_unique UNIQUE (user_id, date);


--
-- Name: quiz_sessions quiz_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quiz_sessions
    ADD CONSTRAINT quiz_sessions_pkey PRIMARY KEY (id);


--
-- Name: reading_progress reading_progress_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reading_progress
    ADD CONSTRAINT reading_progress_pkey PRIMARY KEY (id);


--
-- Name: reading_progress reading_progress_user_id_text_id_chapter_verse_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reading_progress
    ADD CONSTRAINT reading_progress_user_id_text_id_chapter_verse_key UNIQUE (user_id, text_id, chapter, verse);


--
-- Name: recommendations recommendations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recommendations
    ADD CONSTRAINT recommendations_pkey PRIMARY KEY (id);


--
-- Name: recommendations recommendations_user_id_date_type_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recommendations
    ADD CONSTRAINT recommendations_user_id_date_type_key UNIQUE (user_id, date, type);


--
-- Name: sadhana_events sadhana_events_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sadhana_events
    ADD CONSTRAINT sadhana_events_pkey PRIMARY KEY (id);


--
-- Name: sankalpa_checkins sankalpa_checkins_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sankalpa_checkins
    ADD CONSTRAINT sankalpa_checkins_pkey PRIMARY KEY (id);


--
-- Name: sankalpa_checkins sankalpa_checkins_user_id_sankalpa_id_checked_date_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sankalpa_checkins
    ADD CONSTRAINT sankalpa_checkins_user_id_sankalpa_id_checked_date_key UNIQUE (user_id, sankalpa_id, checked_date);


--
-- Name: sankalpa sankalpa_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sankalpa
    ADD CONSTRAINT sankalpa_pkey PRIMARY KEY (id);


--
-- Name: sankalpa_reflections sankalpa_reflections_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sankalpa_reflections
    ADD CONSTRAINT sankalpa_reflections_pkey PRIMARY KEY (id);


--
-- Name: sankalpas sankalpas_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sankalpas
    ADD CONSTRAINT sankalpas_pkey PRIMARY KEY (id);


--
-- Name: sanskars sanskars_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sanskars
    ADD CONSTRAINT sanskars_pkey PRIMARY KEY (id);


--
-- Name: sanskars sanskars_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sanskars
    ADD CONSTRAINT sanskars_slug_key UNIQUE (slug);


--
-- Name: sattvic_sessions sattvic_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sattvic_sessions
    ADD CONSTRAINT sattvic_sessions_pkey PRIMARY KEY (id);


--
-- Name: scripture_chunks scripture_chunks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.scripture_chunks
    ADD CONSTRAINT scripture_chunks_pkey PRIMARY KEY (id);


--
-- Name: scripture_chunks scripture_chunks_text_id_chapter_verse_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.scripture_chunks
    ADD CONSTRAINT scripture_chunks_text_id_chapter_verse_key UNIQUE (text_id, chapter, verse);


--
-- Name: seva_log seva_log_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.seva_log
    ADD CONSTRAINT seva_log_pkey PRIMARY KEY (id);


--
-- Name: seva_task_completions seva_task_completions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.seva_task_completions
    ADD CONSTRAINT seva_task_completions_pkey PRIMARY KEY (id);


--
-- Name: shlokas shlokas_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shlokas
    ADD CONSTRAINT shlokas_pkey PRIMARY KEY (id);


--
-- Name: thread_messages thread_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.thread_messages
    ADD CONSTRAINT thread_messages_pkey PRIMARY KEY (id);


--
-- Name: thread_participants thread_participants_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.thread_participants
    ADD CONSTRAINT thread_participants_pkey PRIMARY KEY (thread_id, user_id);


--
-- Name: thread_reactions thread_reactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.thread_reactions
    ADD CONSTRAINT thread_reactions_pkey PRIMARY KEY (id);


--
-- Name: thread_reactions thread_reactions_thread_id_user_id_reaction_type_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.thread_reactions
    ADD CONSTRAINT thread_reactions_thread_id_user_id_reaction_type_key UNIQUE (thread_id, user_id, reaction_type);


--
-- Name: thread_upvotes thread_upvotes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.thread_upvotes
    ADD CONSTRAINT thread_upvotes_pkey PRIMARY KEY (thread_id, user_id);


--
-- Name: tirtha_checkins tirtha_checkins_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tirtha_checkins
    ADD CONSTRAINT tirtha_checkins_pkey PRIMARY KEY (id);


--
-- Name: tirtha_collections tirtha_collections_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tirtha_collections
    ADD CONSTRAINT tirtha_collections_pkey PRIMARY KEY (id);


--
-- Name: tirtha_collections tirtha_collections_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tirtha_collections
    ADD CONSTRAINT tirtha_collections_slug_key UNIQUE (slug);


--
-- Name: tirtha_place_media tirtha_place_media_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tirtha_place_media
    ADD CONSTRAINT tirtha_place_media_pkey PRIMARY KEY (id);


--
-- Name: tirtha_place_notes tirtha_place_notes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tirtha_place_notes
    ADD CONSTRAINT tirtha_place_notes_pkey PRIMARY KEY (id);


--
-- Name: tirtha_places tirtha_places_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tirtha_places
    ADD CONSTRAINT tirtha_places_pkey PRIMARY KEY (id);


--
-- Name: tirtha_reports tirtha_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tirtha_reports
    ADD CONSTRAINT tirtha_reports_pkey PRIMARY KEY (id);


--
-- Name: tirtha_reviews tirtha_reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tirtha_reviews
    ADD CONSTRAINT tirtha_reviews_pkey PRIMARY KEY (id);


--
-- Name: tirtha_saves tirtha_saves_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tirtha_saves
    ADD CONSTRAINT tirtha_saves_pkey PRIMARY KEY (id);


--
-- Name: tirtha_saves tirtha_saves_user_id_place_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tirtha_saves
    ADD CONSTRAINT tirtha_saves_user_id_place_id_key UNIQUE (user_id, place_id);


--
-- Name: tirtha_visits tirtha_visits_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tirtha_visits
    ADD CONSTRAINT tirtha_visits_pkey PRIMARY KEY (id);


--
-- Name: tirtha_visits tirtha_visits_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tirtha_visits
    ADD CONSTRAINT tirtha_visits_unique UNIQUE (user_id, tirtha_id, visited_at);


--
-- Name: tirthas tirthas_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tirthas
    ADD CONSTRAINT tirthas_pkey PRIMARY KEY (id);


--
-- Name: tirthas tirthas_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tirthas
    ADD CONSTRAINT tirthas_slug_key UNIQUE (slug);


--
-- Name: observance_occurrences uq_observance_definition_date; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.observance_occurrences
    ADD CONSTRAINT uq_observance_definition_date UNIQUE (definition_id, date);


--
-- Name: user_blocked_profiles user_blocked_profiles_blocker_id_blocked_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_blocked_profiles
    ADD CONSTRAINT user_blocked_profiles_blocker_id_blocked_user_id_key UNIQUE (blocker_id, blocked_user_id);


--
-- Name: user_blocked_profiles user_blocked_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_blocked_profiles
    ADD CONSTRAINT user_blocked_profiles_pkey PRIMARY KEY (id);


--
-- Name: user_hidden_content user_hidden_content_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_hidden_content
    ADD CONSTRAINT user_hidden_content_pkey PRIMARY KEY (id);


--
-- Name: user_hidden_content user_hidden_content_user_id_content_type_content_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_hidden_content
    ADD CONSTRAINT user_hidden_content_user_id_content_type_content_id_key UNIQUE (user_id, content_type, content_id);


--
-- Name: user_mood_checkins user_mood_checkins_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_mood_checkins
    ADD CONSTRAINT user_mood_checkins_pkey PRIMARY KEY (id);


--
-- Name: user_muted_profiles user_muted_profiles_muter_id_muted_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_muted_profiles
    ADD CONSTRAINT user_muted_profiles_muter_id_muted_user_id_key UNIQUE (muter_id, muted_user_id);


--
-- Name: user_muted_profiles user_muted_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_muted_profiles
    ADD CONSTRAINT user_muted_profiles_pkey PRIMARY KEY (id);


--
-- Name: user_practice user_practice_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_practice
    ADD CONSTRAINT user_practice_pkey PRIMARY KEY (user_id);


--
-- Name: user_sanskaras user_sanskaras_member_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_sanskaras
    ADD CONSTRAINT user_sanskaras_member_unique UNIQUE (user_id, kul_member_id, sanskara_id);


--
-- Name: user_sanskaras user_sanskaras_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_sanskaras
    ADD CONSTRAINT user_sanskaras_pkey PRIMARY KEY (id);


--
-- Name: user_sanskaras user_sanskaras_user_sanskara_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_sanskaras
    ADD CONSTRAINT user_sanskaras_user_sanskara_unique UNIQUE (user_id, sanskara_id);


--
-- Name: user_sanskars user_sanskars_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_sanskars
    ADD CONSTRAINT user_sanskars_pkey PRIMARY KEY (id);


--
-- Name: user_warnings user_warnings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_warnings
    ADD CONSTRAINT user_warnings_pkey PRIMARY KEY (id);


--
-- Name: waitlist waitlist_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.waitlist
    ADD CONSTRAINT waitlist_email_key UNIQUE (email);


--
-- Name: waitlist waitlist_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.waitlist
    ADD CONSTRAINT waitlist_pkey PRIMARY KEY (id);


--
-- Name: yatra_plans yatra_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.yatra_plans
    ADD CONSTRAINT yatra_plans_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER TABLE ONLY realtime.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: messages_2026_05_30 messages_2026_05_30_pkey; Type: CONSTRAINT; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.messages_2026_05_30
    ADD CONSTRAINT messages_2026_05_30_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: messages_2026_05_31 messages_2026_05_31_pkey; Type: CONSTRAINT; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.messages_2026_05_31
    ADD CONSTRAINT messages_2026_05_31_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: messages_2026_06_01 messages_2026_06_01_pkey; Type: CONSTRAINT; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.messages_2026_06_01
    ADD CONSTRAINT messages_2026_06_01_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: messages_2026_06_02 messages_2026_06_02_pkey; Type: CONSTRAINT; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.messages_2026_06_02
    ADD CONSTRAINT messages_2026_06_02_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: messages_2026_06_03 messages_2026_06_03_pkey; Type: CONSTRAINT; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.messages_2026_06_03
    ADD CONSTRAINT messages_2026_06_03_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: messages_2026_06_04 messages_2026_06_04_pkey; Type: CONSTRAINT; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.messages_2026_06_04
    ADD CONSTRAINT messages_2026_06_04_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: messages_2026_06_05 messages_2026_06_05_pkey; Type: CONSTRAINT; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.messages_2026_06_05
    ADD CONSTRAINT messages_2026_06_05_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: subscription pk_subscription; Type: CONSTRAINT; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.subscription
    ADD CONSTRAINT pk_subscription PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: buckets_analytics buckets_analytics_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.buckets_analytics
    ADD CONSTRAINT buckets_analytics_pkey PRIMARY KEY (id);


--
-- Name: buckets buckets_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.buckets
    ADD CONSTRAINT buckets_pkey PRIMARY KEY (id);


--
-- Name: buckets_vectors buckets_vectors_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.buckets_vectors
    ADD CONSTRAINT buckets_vectors_pkey PRIMARY KEY (id);


--
-- Name: migrations migrations_name_key; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.migrations
    ADD CONSTRAINT migrations_name_key UNIQUE (name);


--
-- Name: migrations migrations_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.migrations
    ADD CONSTRAINT migrations_pkey PRIMARY KEY (id);


--
-- Name: objects objects_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.objects
    ADD CONSTRAINT objects_pkey PRIMARY KEY (id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_pkey PRIMARY KEY (id);


--
-- Name: s3_multipart_uploads s3_multipart_uploads_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.s3_multipart_uploads
    ADD CONSTRAINT s3_multipart_uploads_pkey PRIMARY KEY (id);


--
-- Name: vector_indexes vector_indexes_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.vector_indexes
    ADD CONSTRAINT vector_indexes_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: supabase_migrations; Owner: postgres
--

ALTER TABLE ONLY supabase_migrations.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: audit_logs_instance_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX audit_logs_instance_id_idx ON auth.audit_log_entries USING btree (instance_id);


--
-- Name: confirmation_token_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX confirmation_token_idx ON auth.users USING btree (confirmation_token) WHERE ((confirmation_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: custom_oauth_providers_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX custom_oauth_providers_created_at_idx ON auth.custom_oauth_providers USING btree (created_at);


--
-- Name: custom_oauth_providers_enabled_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX custom_oauth_providers_enabled_idx ON auth.custom_oauth_providers USING btree (enabled);


--
-- Name: custom_oauth_providers_identifier_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX custom_oauth_providers_identifier_idx ON auth.custom_oauth_providers USING btree (identifier);


--
-- Name: custom_oauth_providers_provider_type_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX custom_oauth_providers_provider_type_idx ON auth.custom_oauth_providers USING btree (provider_type);


--
-- Name: email_change_token_current_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX email_change_token_current_idx ON auth.users USING btree (email_change_token_current) WHERE ((email_change_token_current)::text !~ '^[0-9 ]*$'::text);


--
-- Name: email_change_token_new_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX email_change_token_new_idx ON auth.users USING btree (email_change_token_new) WHERE ((email_change_token_new)::text !~ '^[0-9 ]*$'::text);


--
-- Name: factor_id_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX factor_id_created_at_idx ON auth.mfa_factors USING btree (user_id, created_at);


--
-- Name: flow_state_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX flow_state_created_at_idx ON auth.flow_state USING btree (created_at DESC);


--
-- Name: identities_email_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX identities_email_idx ON auth.identities USING btree (email text_pattern_ops);


--
-- Name: INDEX identities_email_idx; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON INDEX auth.identities_email_idx IS 'Auth: Ensures indexed queries on the email column';


--
-- Name: identities_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX identities_user_id_idx ON auth.identities USING btree (user_id);


--
-- Name: idx_auth_code; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX idx_auth_code ON auth.flow_state USING btree (auth_code);


--
-- Name: idx_oauth_client_states_created_at; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX idx_oauth_client_states_created_at ON auth.oauth_client_states USING btree (created_at);


--
-- Name: idx_user_id_auth_method; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX idx_user_id_auth_method ON auth.flow_state USING btree (user_id, authentication_method);


--
-- Name: mfa_challenge_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX mfa_challenge_created_at_idx ON auth.mfa_challenges USING btree (created_at DESC);


--
-- Name: mfa_factors_user_friendly_name_unique; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX mfa_factors_user_friendly_name_unique ON auth.mfa_factors USING btree (friendly_name, user_id) WHERE (TRIM(BOTH FROM friendly_name) <> ''::text);


--
-- Name: mfa_factors_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX mfa_factors_user_id_idx ON auth.mfa_factors USING btree (user_id);


--
-- Name: oauth_auth_pending_exp_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX oauth_auth_pending_exp_idx ON auth.oauth_authorizations USING btree (expires_at) WHERE (status = 'pending'::auth.oauth_authorization_status);


--
-- Name: oauth_clients_deleted_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX oauth_clients_deleted_at_idx ON auth.oauth_clients USING btree (deleted_at);


--
-- Name: oauth_consents_active_client_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX oauth_consents_active_client_idx ON auth.oauth_consents USING btree (client_id) WHERE (revoked_at IS NULL);


--
-- Name: oauth_consents_active_user_client_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX oauth_consents_active_user_client_idx ON auth.oauth_consents USING btree (user_id, client_id) WHERE (revoked_at IS NULL);


--
-- Name: oauth_consents_user_order_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX oauth_consents_user_order_idx ON auth.oauth_consents USING btree (user_id, granted_at DESC);


--
-- Name: one_time_tokens_relates_to_hash_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX one_time_tokens_relates_to_hash_idx ON auth.one_time_tokens USING hash (relates_to);


--
-- Name: one_time_tokens_token_hash_hash_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX one_time_tokens_token_hash_hash_idx ON auth.one_time_tokens USING hash (token_hash);


--
-- Name: one_time_tokens_user_id_token_type_key; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX one_time_tokens_user_id_token_type_key ON auth.one_time_tokens USING btree (user_id, token_type);


--
-- Name: reauthentication_token_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX reauthentication_token_idx ON auth.users USING btree (reauthentication_token) WHERE ((reauthentication_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: recovery_token_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX recovery_token_idx ON auth.users USING btree (recovery_token) WHERE ((recovery_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: refresh_tokens_instance_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_instance_id_idx ON auth.refresh_tokens USING btree (instance_id);


--
-- Name: refresh_tokens_instance_id_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_instance_id_user_id_idx ON auth.refresh_tokens USING btree (instance_id, user_id);


--
-- Name: refresh_tokens_parent_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_parent_idx ON auth.refresh_tokens USING btree (parent);


--
-- Name: refresh_tokens_session_id_revoked_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_session_id_revoked_idx ON auth.refresh_tokens USING btree (session_id, revoked);


--
-- Name: refresh_tokens_updated_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_updated_at_idx ON auth.refresh_tokens USING btree (updated_at DESC);


--
-- Name: saml_providers_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX saml_providers_sso_provider_id_idx ON auth.saml_providers USING btree (sso_provider_id);


--
-- Name: saml_relay_states_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX saml_relay_states_created_at_idx ON auth.saml_relay_states USING btree (created_at DESC);


--
-- Name: saml_relay_states_for_email_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX saml_relay_states_for_email_idx ON auth.saml_relay_states USING btree (for_email);


--
-- Name: saml_relay_states_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX saml_relay_states_sso_provider_id_idx ON auth.saml_relay_states USING btree (sso_provider_id);


--
-- Name: sessions_not_after_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX sessions_not_after_idx ON auth.sessions USING btree (not_after DESC);


--
-- Name: sessions_oauth_client_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX sessions_oauth_client_id_idx ON auth.sessions USING btree (oauth_client_id);


--
-- Name: sessions_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX sessions_user_id_idx ON auth.sessions USING btree (user_id);


--
-- Name: sso_domains_domain_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX sso_domains_domain_idx ON auth.sso_domains USING btree (lower(domain));


--
-- Name: sso_domains_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX sso_domains_sso_provider_id_idx ON auth.sso_domains USING btree (sso_provider_id);


--
-- Name: sso_providers_resource_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX sso_providers_resource_id_idx ON auth.sso_providers USING btree (lower(resource_id));


--
-- Name: sso_providers_resource_id_pattern_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX sso_providers_resource_id_pattern_idx ON auth.sso_providers USING btree (resource_id text_pattern_ops);


--
-- Name: unique_phone_factor_per_user; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX unique_phone_factor_per_user ON auth.mfa_factors USING btree (user_id, phone);


--
-- Name: user_id_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX user_id_created_at_idx ON auth.sessions USING btree (user_id, created_at);


--
-- Name: users_email_partial_key; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX users_email_partial_key ON auth.users USING btree (email) WHERE (is_sso_user = false);


--
-- Name: INDEX users_email_partial_key; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON INDEX auth.users_email_partial_key IS 'Auth: A partial unique index that applies only when is_sso_user is false';


--
-- Name: users_instance_id_email_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX users_instance_id_email_idx ON auth.users USING btree (instance_id, lower((email)::text));


--
-- Name: users_instance_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX users_instance_id_idx ON auth.users USING btree (instance_id);


--
-- Name: users_is_anonymous_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX users_is_anonymous_idx ON auth.users USING btree (is_anonymous);


--
-- Name: webauthn_challenges_expires_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX webauthn_challenges_expires_at_idx ON auth.webauthn_challenges USING btree (expires_at);


--
-- Name: webauthn_challenges_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX webauthn_challenges_user_id_idx ON auth.webauthn_challenges USING btree (user_id);


--
-- Name: webauthn_credentials_credential_id_key; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX webauthn_credentials_credential_id_key ON auth.webauthn_credentials USING btree (credential_id);


--
-- Name: webauthn_credentials_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX webauthn_credentials_user_id_idx ON auth.webauthn_credentials USING btree (user_id);


--
-- Name: darshan_pref_evening_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX darshan_pref_evening_idx ON public.darshan_preferences USING btree (stream_id) WHERE (notify_evening = true);


--
-- Name: darshan_pref_morning_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX darshan_pref_morning_idx ON public.darshan_preferences USING btree (stream_id) WHERE (notify_morning = true);


--
-- Name: devotional_tracks_deity_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX devotional_tracks_deity_idx ON public.devotional_tracks USING btree (deity);


--
-- Name: devotional_tracks_is_active_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX devotional_tracks_is_active_idx ON public.devotional_tracks USING btree (is_active);


--
-- Name: devotional_tracks_tradition_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX devotional_tracks_tradition_idx ON public.devotional_tracks USING btree (tradition);


--
-- Name: devotional_tracks_type_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX devotional_tracks_type_idx ON public.devotional_tracks USING btree (type);


--
-- Name: dharm_veer_daily_tradition_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX dharm_veer_daily_tradition_date ON public.dharm_veer_daily USING btree (tradition, date DESC);


--
-- Name: dharm_veers_day_index_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX dharm_veers_day_index_idx ON public.dharm_veers USING btree (day_index);


--
-- Name: dharm_veers_tradition_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX dharm_veers_tradition_idx ON public.dharm_veers USING btree (tradition);


--
-- Name: hero_assets_active_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX hero_assets_active_idx ON public.hero_assets USING btree (is_active, priority DESC);


--
-- Name: hero_assets_festival_slugs_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX hero_assets_festival_slugs_idx ON public.hero_assets USING gin (festival_slugs);


--
-- Name: hero_assets_traditions_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX hero_assets_traditions_idx ON public.hero_assets USING gin (traditions);


--
-- Name: idx_birth_profiles_owner; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_birth_profiles_owner ON public.birth_profiles USING btree (owner_id);


--
-- Name: idx_birth_profiles_primary; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_birth_profiles_primary ON public.birth_profiles USING btree (owner_id) WHERE (is_primary = true);


--
-- Name: idx_birth_profiles_primary_order; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_birth_profiles_primary_order ON public.birth_profiles USING btree (owner_id, is_primary DESC) WHERE (owner_id IS NOT NULL);


--
-- Name: idx_birth_profiles_rashi_notify; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_birth_profiles_rashi_notify ON public.birth_profiles USING btree (owner_id, rashi) WHERE ((is_primary = true) AND (rashi IS NOT NULL));


--
-- Name: idx_birth_profiles_session; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_birth_profiles_session ON public.birth_profiles USING btree (session_token) WHERE (session_token IS NOT NULL);


--
-- Name: idx_daily_sadhana_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_daily_sadhana_user ON public.daily_sadhana USING btree (user_id, date DESC);


--
-- Name: idx_device_tokens_player; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_device_tokens_player ON public.device_tokens USING btree (player_id);


--
-- Name: idx_device_tokens_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_device_tokens_user ON public.device_tokens USING btree (user_id) WHERE (is_active = true);


--
-- Name: idx_event_rsvps_post; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_event_rsvps_post ON public.event_rsvps USING btree (post_id, created_at DESC);


--
-- Name: idx_event_rsvps_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_event_rsvps_user ON public.event_rsvps USING btree (user_id, created_at DESC);


--
-- Name: idx_family_members_kul; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_family_members_kul ON public.kul_family_members USING btree (kul_id, generation, display_order);


--
-- Name: idx_family_members_parent; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_family_members_parent ON public.kul_family_members USING btree (parent_id);


--
-- Name: idx_festivals_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_festivals_date ON public.festivals USING btree (date);


--
-- Name: idx_festivals_tradition_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_festivals_tradition_date ON public.festivals USING btree (tradition, date);


--
-- Name: idx_festivals_verification_run_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_festivals_verification_run_at ON public.festivals USING btree (verification_run_at DESC);


--
-- Name: idx_festivals_verification_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_festivals_verification_status ON public.festivals USING btree (verification_status);


--
-- Name: idx_guided_path_progress_active_day; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_guided_path_progress_active_day ON public.guided_path_progress USING btree (status, day_reached, updated_at DESC) WHERE (status = 'active'::text);


--
-- Name: idx_guided_path_progress_user_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_guided_path_progress_user_status ON public.guided_path_progress USING btree (user_id, status, updated_at DESC);


--
-- Name: idx_kul_events_kul; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_kul_events_kul ON public.kul_events USING btree (kul_id, event_date);


--
-- Name: idx_kul_events_upcoming; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_kul_events_upcoming ON public.kul_events USING btree (kul_id, event_date);


--
-- Name: idx_kul_is_pro; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_kul_is_pro ON public.kuls USING btree (is_pro) WHERE (is_pro = true);


--
-- Name: idx_kul_members_kul; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_kul_members_kul ON public.kul_members USING btree (kul_id);


--
-- Name: idx_kul_members_kul_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_kul_members_kul_id ON public.kul_members USING btree (kul_id);


--
-- Name: idx_kul_members_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_kul_members_user ON public.kul_members USING btree (user_id);


--
-- Name: idx_kul_members_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_kul_members_user_id ON public.kul_members USING btree (user_id);


--
-- Name: idx_kul_messages_kul; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_kul_messages_kul ON public.kul_messages USING btree (kul_id, created_at DESC);


--
-- Name: idx_kul_tasks_assigned; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_kul_tasks_assigned ON public.kul_tasks USING btree (assigned_to);


--
-- Name: idx_kul_tasks_kul_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_kul_tasks_kul_id ON public.kul_tasks USING btree (kul_id);


--
-- Name: idx_kul_tasks_kul_pending; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_kul_tasks_kul_pending ON public.kul_tasks USING btree (kul_id, completed, due_date) WHERE (completed = false);


--
-- Name: idx_kuls_invite; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_kuls_invite ON public.kuls USING btree (invite_code);


--
-- Name: idx_mala_sessions_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_mala_sessions_user ON public.mala_sessions USING btree (user_id, completed_at DESC);


--
-- Name: idx_mala_sessions_user_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_mala_sessions_user_date ON public.mala_sessions USING btree (user_id, completed_at DESC);


--
-- Name: idx_mala_sessions_user_mala; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_mala_sessions_user_mala ON public.mala_sessions USING btree (user_id, mala_id);


--
-- Name: idx_mala_sessions_user_practice_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_mala_sessions_user_practice_type ON public.mala_sessions USING btree (user_id, practice_type, spiritual_date DESC);


--
-- Name: idx_mala_sessions_user_spiritual_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_mala_sessions_user_spiritual_date ON public.mala_sessions USING btree (user_id, spiritual_date DESC);


--
-- Name: idx_mantras_deity; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_mantras_deity ON public.mantras USING btree (deity);


--
-- Name: idx_mantras_level; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_mantras_level ON public.mantras USING btree (level);


--
-- Name: idx_mantras_tags; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_mantras_tags ON public.mantras USING gin (tags);


--
-- Name: idx_mantras_tradition; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_mantras_tradition ON public.mantras USING btree (tradition);


--
-- Name: idx_monitoring_events_domain_timestamp; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_monitoring_events_domain_timestamp ON public.monitoring_events USING btree (domain, "timestamp" DESC);


--
-- Name: idx_monitoring_events_provider_timestamp; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_monitoring_events_provider_timestamp ON public.monitoring_events USING btree (provider, "timestamp" DESC) WHERE (provider IS NOT NULL);


--
-- Name: idx_monitoring_events_severity_timestamp; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_monitoring_events_severity_timestamp ON public.monitoring_events USING btree (severity, "timestamp" DESC);


--
-- Name: idx_monitoring_events_timestamp; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_monitoring_events_timestamp ON public.monitoring_events USING btree ("timestamp" DESC);


--
-- Name: idx_nitya_karma_full; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_nitya_karma_full ON public.nitya_karma_log USING btree (user_id, full_sequence) WHERE (full_sequence = true);


--
-- Name: idx_nitya_karma_user_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_nitya_karma_user_date ON public.nitya_karma_log USING btree (user_id, date DESC);


--
-- Name: idx_notification_schedule_pending; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notification_schedule_pending ON public.notification_schedule USING btree (send_at, status) WHERE (status = 'pending'::text);


--
-- Name: idx_notification_schedule_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notification_schedule_user ON public.notification_schedule USING btree (user_id);


--
-- Name: idx_notifications_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_notifications_key ON public.notifications USING btree (notification_key) WHERE (notification_key IS NOT NULL);


--
-- Name: idx_notifications_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_user_id ON public.notifications USING btree (user_id, created_at DESC);


--
-- Name: idx_observance_definitions_guarantee_level; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_observance_definitions_guarantee_level ON public.observance_definitions USING btree (guarantee_level);


--
-- Name: idx_observance_definitions_slug; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_observance_definitions_slug ON public.observance_definitions USING btree (slug);


--
-- Name: idx_observance_definitions_tradition; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_observance_definitions_tradition ON public.observance_definitions USING btree (tradition);


--
-- Name: idx_observance_occurrences_audit_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_observance_occurrences_audit_status ON public.observance_occurrences USING btree (audit_status);


--
-- Name: idx_observance_occurrences_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_observance_occurrences_date ON public.observance_occurrences USING btree (date);


--
-- Name: idx_observance_occurrences_definition; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_observance_occurrences_definition ON public.observance_occurrences USING btree (definition_id);


--
-- Name: idx_observance_occurrences_final_date_source; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_observance_occurrences_final_date_source ON public.observance_occurrences USING btree (final_date_source);


--
-- Name: idx_observance_occurrences_locked; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_observance_occurrences_locked ON public.observance_occurrences USING btree (locked_for_regeneration);


--
-- Name: idx_observance_occurrences_ver_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_observance_occurrences_ver_status ON public.observance_occurrences USING btree (verification_status);


--
-- Name: idx_observance_occurrences_year; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_observance_occurrences_year ON public.observance_occurrences USING btree (year);


--
-- Name: idx_pathshala_circle_members_circle; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pathshala_circle_members_circle ON public.pathshala_circle_members USING btree (circle_id, current_position DESC);


--
-- Name: idx_pathshala_circle_members_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pathshala_circle_members_user ON public.pathshala_circle_members USING btree (user_id);


--
-- Name: idx_pathshala_enrollments_path; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pathshala_enrollments_path ON public.pathshala_enrollments USING btree (path_id);


--
-- Name: idx_pathshala_enrollments_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pathshala_enrollments_user ON public.pathshala_enrollments USING btree (user_id);


--
-- Name: idx_pathshala_path_chunks_path; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pathshala_path_chunks_path ON public.pathshala_path_chunks USING btree (path_id, "position");


--
-- Name: idx_pathshala_progress_chunk; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pathshala_progress_chunk ON public.pathshala_progress USING btree (chunk_id, user_id);


--
-- Name: idx_pathshala_progress_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pathshala_progress_user ON public.pathshala_progress USING btree (user_id, path_id);


--
-- Name: idx_pathshala_recordings_chunk; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pathshala_recordings_chunk ON public.pathshala_recordings USING btree (chunk_id, user_id);


--
-- Name: idx_pathshala_recordings_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pathshala_recordings_status ON public.pathshala_recordings USING btree (status) WHERE (status = ANY (ARRAY['processing'::text, 'pending_guru'::text]));


--
-- Name: idx_pathshala_recordings_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pathshala_recordings_user ON public.pathshala_recordings USING btree (user_id, submitted_at DESC);


--
-- Name: idx_pathshala_reviews_recording; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pathshala_reviews_recording ON public.pathshala_recitation_reviews USING btree (recording_id);


--
-- Name: idx_pathshala_reviews_reviewer; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pathshala_reviews_reviewer ON public.pathshala_recitation_reviews USING btree (reviewer_id) WHERE (reviewer_id IS NOT NULL);


--
-- Name: idx_pathshala_study_circles_kul; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pathshala_study_circles_kul ON public.pathshala_study_circles USING btree (kul_id, is_active);


--
-- Name: idx_pathshala_translations_chunk; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pathshala_translations_chunk ON public.pathshala_translations USING btree (chunk_id, language);


--
-- Name: idx_pathshala_user_badges_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pathshala_user_badges_user ON public.pathshala_user_badges USING btree (user_id, earned_at DESC);


--
-- Name: idx_pathshala_user_state_bookmarks; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pathshala_user_state_bookmarks ON public.pathshala_user_state USING btree (user_id, bookmarked_at DESC);


--
-- Name: idx_pathshala_user_state_recent; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pathshala_user_state_recent ON public.pathshala_user_state USING btree (user_id, last_opened_at DESC);


--
-- Name: idx_pathshala_verse_mastery_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pathshala_verse_mastery_user ON public.pathshala_verse_mastery USING btree (user_id, certified, is_fully_mastered);


--
-- Name: idx_post_comments_parent; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_post_comments_parent ON public.post_comments USING btree (parent_id, created_at);


--
-- Name: idx_post_comments_post; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_post_comments_post ON public.post_comments USING btree (post_id, created_at);


--
-- Name: idx_posts_author; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_posts_author ON public.posts USING btree (author_id);


--
-- Name: idx_posts_mandali; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_posts_mandali ON public.posts USING btree (mandali_id, created_at DESC);


--
-- Name: idx_profiles_dob; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_profiles_dob ON public.profiles USING btree (date_of_birth) WHERE (date_of_birth IS NOT NULL);


--
-- Name: idx_profiles_founding_number; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_profiles_founding_number ON public.profiles USING btree (founding_number) WHERE (founding_number IS NOT NULL);


--
-- Name: idx_profiles_gender_context; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_profiles_gender_context ON public.profiles USING btree (gender_context) WHERE (gender_context IS NOT NULL);


--
-- Name: idx_profiles_is_pro; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_profiles_is_pro ON public.profiles USING btree (is_pro) WHERE (is_pro = true);


--
-- Name: idx_profiles_life_stage; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_profiles_life_stage ON public.profiles USING btree (life_stage) WHERE (life_stage IS NOT NULL);


--
-- Name: idx_profiles_location; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_profiles_location ON public.profiles USING btree (latitude, longitude);


--
-- Name: idx_profiles_mandali; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_profiles_mandali ON public.profiles USING btree (mandali_id);


--
-- Name: idx_profiles_monthly_seva; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_profiles_monthly_seva ON public.profiles USING btree (monthly_seva DESC);


--
-- Name: idx_profiles_neighbourhood; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_profiles_neighbourhood ON public.profiles USING btree (neighbourhood) WHERE (neighbourhood IS NOT NULL);


--
-- Name: idx_profiles_satsang_radar; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_profiles_satsang_radar ON public.profiles USING btree (latitude, longitude) WHERE ((location_visible = true) AND (looking_for_satsang = true));


--
-- Name: idx_profiles_weekly_seva; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_profiles_weekly_seva ON public.profiles USING btree (weekly_seva DESC);


--
-- Name: idx_quiz_responses_user_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_quiz_responses_user_date ON public.quiz_responses USING btree (user_id, date);


--
-- Name: idx_quiz_sessions_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_quiz_sessions_user ON public.quiz_sessions USING btree (user_id, completed_at DESC);


--
-- Name: idx_reading_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_reading_user ON public.reading_progress USING btree (user_id, text_id, chapter, verse);


--
-- Name: idx_recommendations_user_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_recommendations_user_date ON public.recommendations USING btree (user_id, date DESC);


--
-- Name: idx_replies_thread; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_replies_thread ON public.forum_replies USING btree (thread_id, created_at);


--
-- Name: idx_sadhana_events_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sadhana_events_type ON public.sadhana_events USING btree (event_type, created_at DESC);


--
-- Name: idx_sadhana_events_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sadhana_events_user ON public.sadhana_events USING btree (user_id, created_at DESC);


--
-- Name: idx_sanskars_sequence; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sanskars_sequence ON public.sanskars USING btree (sequence_number);


--
-- Name: idx_sanskars_stage; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sanskars_stage ON public.sanskars USING btree (life_stage);


--
-- Name: idx_scripture_chunks_language; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_scripture_chunks_language ON public.scripture_chunks USING btree (language, text_category);


--
-- Name: idx_scripture_chunks_tradition; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_scripture_chunks_tradition ON public.scripture_chunks USING btree (tradition_region, text_category);


--
-- Name: idx_scripture_embedding; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_scripture_embedding ON public.scripture_chunks USING ivfflat (embedding public.vector_cosine_ops) WITH (lists='50');


--
-- Name: idx_scripture_fulltext; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_scripture_fulltext ON public.scripture_chunks USING gin (search_vector);


--
-- Name: idx_scripture_text; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_scripture_text ON public.scripture_chunks USING btree (text_id, chapter, verse);


--
-- Name: idx_seva_task_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_seva_task_unique ON public.seva_task_completions USING btree (user_id, task_key);


--
-- Name: idx_threads_author; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_threads_author ON public.forum_threads USING btree (author_id);


--
-- Name: idx_threads_category; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_threads_category ON public.forum_threads USING btree (category, created_at DESC);


--
-- Name: idx_tirtha_places_tradition; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tirtha_places_tradition ON public.tirtha_places USING btree (tradition);


--
-- Name: idx_tirtha_reviews_place; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tirtha_reviews_place ON public.tirtha_reviews USING btree (place_id);


--
-- Name: idx_tirtha_visits_tirtha; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tirtha_visits_tirtha ON public.tirtha_visits USING btree (tirtha_id);


--
-- Name: idx_tirtha_visits_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tirtha_visits_user ON public.tirtha_visits USING btree (user_id);


--
-- Name: idx_tirthas_state; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tirthas_state ON public.tirthas USING btree (state);


--
-- Name: idx_tirthas_tradition; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tirthas_tradition ON public.tirthas USING btree (tradition);


--
-- Name: idx_tirthas_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tirthas_type ON public.tirthas USING btree (tirtha_type);


--
-- Name: idx_user_blocked_profiles_blocked; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_blocked_profiles_blocked ON public.user_blocked_profiles USING btree (blocked_user_id, created_at DESC);


--
-- Name: idx_user_blocked_profiles_blocker; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_blocked_profiles_blocker ON public.user_blocked_profiles USING btree (blocker_id, created_at DESC);


--
-- Name: idx_user_hidden_content_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_hidden_content_user ON public.user_hidden_content USING btree (user_id, created_at DESC);


--
-- Name: idx_user_mood_checkins_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_mood_checkins_created_at ON public.user_mood_checkins USING btree (created_at);


--
-- Name: idx_user_mood_checkins_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_mood_checkins_user_id ON public.user_mood_checkins USING btree (user_id);


--
-- Name: idx_user_muted_profiles_muter; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_muted_profiles_muter ON public.user_muted_profiles USING btree (muter_id, created_at DESC);


--
-- Name: idx_user_sanskaras_member; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_sanskaras_member ON public.user_sanskaras USING btree (kul_member_id) WHERE (kul_member_id IS NOT NULL);


--
-- Name: idx_user_sanskaras_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_sanskaras_user ON public.user_sanskaras USING btree (user_id);


--
-- Name: idx_user_sanskars_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_sanskars_user ON public.user_sanskars USING btree (user_id);


--
-- Name: idx_user_warnings_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_warnings_user_id ON public.user_warnings USING btree (user_id);


--
-- Name: idx_waitlist_founding_number; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_waitlist_founding_number ON public.waitlist USING btree (founding_number);


--
-- Name: idx_yatra_plans_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_yatra_plans_user ON public.yatra_plans USING btree (user_id);


--
-- Name: karma_award_log_user_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX karma_award_log_user_date ON public.karma_award_log USING btree (user_id, awarded_date);


--
-- Name: karma_award_log_user_reason_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX karma_award_log_user_reason_date ON public.karma_award_log USING btree (user_id, reason, awarded_date);


--
-- Name: karma_ledger_user_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX karma_ledger_user_date ON public.karma_ledger USING btree (user_id, created_at DESC);


--
-- Name: notifications_local_date_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX notifications_local_date_idx ON public.notifications USING btree (local_date DESC);


--
-- Name: notifications_user_notification_key_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX notifications_user_notification_key_idx ON public.notifications USING btree (user_id, notification_key) WHERE (notification_key IS NOT NULL);


--
-- Name: sankalpas_user_id_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX sankalpas_user_id_status_idx ON public.sankalpas USING btree (user_id, status);


--
-- Name: sattvic_sessions_completed_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX sattvic_sessions_completed_at_idx ON public.sattvic_sessions USING btree (completed_at);


--
-- Name: sattvic_sessions_user_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX sattvic_sessions_user_id_idx ON public.sattvic_sessions USING btree (user_id);


--
-- Name: seva_log_user_logged_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX seva_log_user_logged_at_idx ON public.seva_log USING btree (user_id, logged_at DESC);


--
-- Name: waitlist_created_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX waitlist_created_idx ON public.waitlist USING btree (created_at DESC);


--
-- Name: waitlist_tradition_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX waitlist_tradition_idx ON public.waitlist USING btree (tradition);


--
-- Name: ix_realtime_subscription_entity; Type: INDEX; Schema: realtime; Owner: supabase_admin
--

CREATE INDEX ix_realtime_subscription_entity ON realtime.subscription USING btree (entity);


--
-- Name: messages_inserted_at_topic_index; Type: INDEX; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE INDEX messages_inserted_at_topic_index ON ONLY realtime.messages USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE));


--
-- Name: messages_2026_05_30_inserted_at_topic_idx; Type: INDEX; Schema: realtime; Owner: supabase_admin
--

CREATE INDEX messages_2026_05_30_inserted_at_topic_idx ON realtime.messages_2026_05_30 USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE));


--
-- Name: messages_2026_05_31_inserted_at_topic_idx; Type: INDEX; Schema: realtime; Owner: supabase_admin
--

CREATE INDEX messages_2026_05_31_inserted_at_topic_idx ON realtime.messages_2026_05_31 USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE));


--
-- Name: messages_2026_06_01_inserted_at_topic_idx; Type: INDEX; Schema: realtime; Owner: supabase_admin
--

CREATE INDEX messages_2026_06_01_inserted_at_topic_idx ON realtime.messages_2026_06_01 USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE));


--
-- Name: messages_2026_06_02_inserted_at_topic_idx; Type: INDEX; Schema: realtime; Owner: supabase_admin
--

CREATE INDEX messages_2026_06_02_inserted_at_topic_idx ON realtime.messages_2026_06_02 USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE));


--
-- Name: messages_2026_06_03_inserted_at_topic_idx; Type: INDEX; Schema: realtime; Owner: supabase_admin
--

CREATE INDEX messages_2026_06_03_inserted_at_topic_idx ON realtime.messages_2026_06_03 USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE));


--
-- Name: messages_2026_06_04_inserted_at_topic_idx; Type: INDEX; Schema: realtime; Owner: supabase_admin
--

CREATE INDEX messages_2026_06_04_inserted_at_topic_idx ON realtime.messages_2026_06_04 USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE));


--
-- Name: messages_2026_06_05_inserted_at_topic_idx; Type: INDEX; Schema: realtime; Owner: supabase_admin
--

CREATE INDEX messages_2026_06_05_inserted_at_topic_idx ON realtime.messages_2026_06_05 USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE));


--
-- Name: subscription_subscription_id_entity_filters_action_filter_key; Type: INDEX; Schema: realtime; Owner: supabase_admin
--

CREATE UNIQUE INDEX subscription_subscription_id_entity_filters_action_filter_key ON realtime.subscription USING btree (subscription_id, entity, filters, action_filter);


--
-- Name: bname; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE UNIQUE INDEX bname ON storage.buckets USING btree (name);


--
-- Name: bucketid_objname; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE UNIQUE INDEX bucketid_objname ON storage.objects USING btree (bucket_id, name);


--
-- Name: buckets_analytics_unique_name_idx; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE UNIQUE INDEX buckets_analytics_unique_name_idx ON storage.buckets_analytics USING btree (name) WHERE (deleted_at IS NULL);


--
-- Name: idx_multipart_uploads_list; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE INDEX idx_multipart_uploads_list ON storage.s3_multipart_uploads USING btree (bucket_id, key, created_at);


--
-- Name: idx_objects_bucket_id_name; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE INDEX idx_objects_bucket_id_name ON storage.objects USING btree (bucket_id, name COLLATE "C");


--
-- Name: idx_objects_bucket_id_name_lower; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE INDEX idx_objects_bucket_id_name_lower ON storage.objects USING btree (bucket_id, lower(name) COLLATE "C");


--
-- Name: name_prefix_search; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE INDEX name_prefix_search ON storage.objects USING btree (name text_pattern_ops);


--
-- Name: vector_indexes_name_bucket_id_idx; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE UNIQUE INDEX vector_indexes_name_bucket_id_idx ON storage.vector_indexes USING btree (name, bucket_id);


--
-- Name: messages_2026_05_30_inserted_at_topic_idx; Type: INDEX ATTACH; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER INDEX realtime.messages_inserted_at_topic_index ATTACH PARTITION realtime.messages_2026_05_30_inserted_at_topic_idx;


--
-- Name: messages_2026_05_30_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER INDEX realtime.messages_pkey ATTACH PARTITION realtime.messages_2026_05_30_pkey;


--
-- Name: messages_2026_05_31_inserted_at_topic_idx; Type: INDEX ATTACH; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER INDEX realtime.messages_inserted_at_topic_index ATTACH PARTITION realtime.messages_2026_05_31_inserted_at_topic_idx;


--
-- Name: messages_2026_05_31_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER INDEX realtime.messages_pkey ATTACH PARTITION realtime.messages_2026_05_31_pkey;


--
-- Name: messages_2026_06_01_inserted_at_topic_idx; Type: INDEX ATTACH; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER INDEX realtime.messages_inserted_at_topic_index ATTACH PARTITION realtime.messages_2026_06_01_inserted_at_topic_idx;


--
-- Name: messages_2026_06_01_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER INDEX realtime.messages_pkey ATTACH PARTITION realtime.messages_2026_06_01_pkey;


--
-- Name: messages_2026_06_02_inserted_at_topic_idx; Type: INDEX ATTACH; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER INDEX realtime.messages_inserted_at_topic_index ATTACH PARTITION realtime.messages_2026_06_02_inserted_at_topic_idx;


--
-- Name: messages_2026_06_02_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER INDEX realtime.messages_pkey ATTACH PARTITION realtime.messages_2026_06_02_pkey;


--
-- Name: messages_2026_06_03_inserted_at_topic_idx; Type: INDEX ATTACH; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER INDEX realtime.messages_inserted_at_topic_index ATTACH PARTITION realtime.messages_2026_06_03_inserted_at_topic_idx;


--
-- Name: messages_2026_06_03_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER INDEX realtime.messages_pkey ATTACH PARTITION realtime.messages_2026_06_03_pkey;


--
-- Name: messages_2026_06_04_inserted_at_topic_idx; Type: INDEX ATTACH; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER INDEX realtime.messages_inserted_at_topic_index ATTACH PARTITION realtime.messages_2026_06_04_inserted_at_topic_idx;


--
-- Name: messages_2026_06_04_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER INDEX realtime.messages_pkey ATTACH PARTITION realtime.messages_2026_06_04_pkey;


--
-- Name: messages_2026_06_05_inserted_at_topic_idx; Type: INDEX ATTACH; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER INDEX realtime.messages_inserted_at_topic_index ATTACH PARTITION realtime.messages_2026_06_05_inserted_at_topic_idx;


--
-- Name: messages_2026_06_05_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER INDEX realtime.messages_pkey ATTACH PARTITION realtime.messages_2026_06_05_pkey;


--
-- Name: users on_auth_user_created; Type: TRIGGER; Schema: auth; Owner: supabase_auth_admin
--

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


--
-- Name: birth_profiles birth_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER birth_profiles_updated_at BEFORE UPDATE ON public.birth_profiles FOR EACH ROW EXECUTE FUNCTION public.update_birth_profiles_updated_at();


--
-- Name: darshan_preferences darshan_preferences_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER darshan_preferences_updated_at BEFORE UPDATE ON public.darshan_preferences FOR EACH ROW EXECUTE FUNCTION public.update_darshan_preferences_updated_at();


--
-- Name: guided_path_progress guided_path_progress_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER guided_path_progress_updated_at BEFORE UPDATE ON public.guided_path_progress FOR EACH ROW EXECUTE FUNCTION public.update_guided_path_progress_timestamp();


--
-- Name: profiles on_profile_insert_assign_mandali; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER on_profile_insert_assign_mandali BEFORE INSERT ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.auto_assign_mandali_on_insert();


--
-- Name: profiles on_profile_location_change; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER on_profile_location_change BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.auto_assign_mandali();


--
-- Name: profiles on_profile_mandali_change; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER on_profile_mandali_change AFTER UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_mandali_member_count();


--
-- Name: event_rsvps set_event_rsvps_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_event_rsvps_updated_at BEFORE UPDATE ON public.event_rsvps FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: forum_threads set_forum_threads_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_forum_threads_updated_at BEFORE UPDATE ON public.forum_threads FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: posts set_posts_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_posts_updated_at BEFORE UPDATE ON public.posts FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: profiles set_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: post_comments sync_post_comment_count_on_delete; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER sync_post_comment_count_on_delete AFTER DELETE ON public.post_comments FOR EACH ROW EXECUTE FUNCTION public.sync_post_comment_count();


--
-- Name: post_comments sync_post_comment_count_on_insert; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER sync_post_comment_count_on_insert AFTER INSERT ON public.post_comments FOR EACH ROW EXECUTE FUNCTION public.sync_post_comment_count();


--
-- Name: device_tokens trg_device_tokens_updated; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_device_tokens_updated BEFORE UPDATE ON public.device_tokens FOR EACH ROW EXECUTE FUNCTION public.update_device_token_timestamp();


--
-- Name: kul_family_members trg_family_member_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_family_member_updated_at BEFORE UPDATE ON public.kul_family_members FOR EACH ROW EXECUTE FUNCTION public.update_family_member_updated_at();


--
-- Name: hero_assets trg_hero_assets_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_hero_assets_updated_at BEFORE UPDATE ON public.hero_assets FOR EACH ROW EXECUTE FUNCTION public.set_hero_assets_updated_at();


--
-- Name: kuls trg_kul_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_kul_updated_at BEFORE UPDATE ON public.kuls FOR EACH ROW EXECUTE FUNCTION public.update_kul_updated_at();


--
-- Name: observance_definitions trg_sync_definition_to_festival; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_sync_definition_to_festival AFTER UPDATE ON public.observance_definitions FOR EACH ROW EXECUTE FUNCTION public.sync_definition_to_festival();


--
-- Name: festivals trg_sync_festival_to_observance; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_sync_festival_to_observance AFTER INSERT OR DELETE OR UPDATE ON public.festivals FOR EACH ROW EXECUTE FUNCTION public.sync_festival_to_observance();


--
-- Name: observance_occurrences trg_sync_occurrence_to_festival; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_sync_occurrence_to_festival AFTER INSERT OR DELETE OR UPDATE ON public.observance_occurrences FOR EACH ROW EXECUTE FUNCTION public.sync_occurrence_to_festival();


--
-- Name: pathshala_recitation_reviews trg_verse_mastery_after_review; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_verse_mastery_after_review AFTER INSERT ON public.pathshala_recitation_reviews FOR EACH ROW EXECUTE FUNCTION public.update_verse_mastery_after_review();


--
-- Name: subscription tr_check_filters; Type: TRIGGER; Schema: realtime; Owner: supabase_admin
--

CREATE TRIGGER tr_check_filters BEFORE INSERT OR UPDATE ON realtime.subscription FOR EACH ROW EXECUTE FUNCTION realtime.subscription_check_filters();


--
-- Name: buckets enforce_bucket_name_length_trigger; Type: TRIGGER; Schema: storage; Owner: supabase_storage_admin
--

CREATE TRIGGER enforce_bucket_name_length_trigger BEFORE INSERT OR UPDATE OF name ON storage.buckets FOR EACH ROW EXECUTE FUNCTION storage.enforce_bucket_name_length();


--
-- Name: buckets protect_buckets_delete; Type: TRIGGER; Schema: storage; Owner: supabase_storage_admin
--

CREATE TRIGGER protect_buckets_delete BEFORE DELETE ON storage.buckets FOR EACH STATEMENT EXECUTE FUNCTION storage.protect_delete();


--
-- Name: objects protect_objects_delete; Type: TRIGGER; Schema: storage; Owner: supabase_storage_admin
--

CREATE TRIGGER protect_objects_delete BEFORE DELETE ON storage.objects FOR EACH STATEMENT EXECUTE FUNCTION storage.protect_delete();


--
-- Name: objects update_objects_updated_at; Type: TRIGGER; Schema: storage; Owner: supabase_storage_admin
--

CREATE TRIGGER update_objects_updated_at BEFORE UPDATE ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.update_updated_at_column();


--
-- Name: identities identities_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: mfa_amr_claims mfa_amr_claims_session_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT mfa_amr_claims_session_id_fkey FOREIGN KEY (session_id) REFERENCES auth.sessions(id) ON DELETE CASCADE;


--
-- Name: mfa_challenges mfa_challenges_auth_factor_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_challenges
    ADD CONSTRAINT mfa_challenges_auth_factor_id_fkey FOREIGN KEY (factor_id) REFERENCES auth.mfa_factors(id) ON DELETE CASCADE;


--
-- Name: mfa_factors mfa_factors_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: oauth_authorizations oauth_authorizations_client_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_client_id_fkey FOREIGN KEY (client_id) REFERENCES auth.oauth_clients(id) ON DELETE CASCADE;


--
-- Name: oauth_authorizations oauth_authorizations_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: oauth_consents oauth_consents_client_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_client_id_fkey FOREIGN KEY (client_id) REFERENCES auth.oauth_clients(id) ON DELETE CASCADE;


--
-- Name: oauth_consents oauth_consents_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: one_time_tokens one_time_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.one_time_tokens
    ADD CONSTRAINT one_time_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: refresh_tokens refresh_tokens_session_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_session_id_fkey FOREIGN KEY (session_id) REFERENCES auth.sessions(id) ON DELETE CASCADE;


--
-- Name: saml_providers saml_providers_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: saml_relay_states saml_relay_states_flow_state_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_flow_state_id_fkey FOREIGN KEY (flow_state_id) REFERENCES auth.flow_state(id) ON DELETE CASCADE;


--
-- Name: saml_relay_states saml_relay_states_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: sessions sessions_oauth_client_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_oauth_client_id_fkey FOREIGN KEY (oauth_client_id) REFERENCES auth.oauth_clients(id) ON DELETE CASCADE;


--
-- Name: sessions sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: sso_domains sso_domains_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sso_domains
    ADD CONSTRAINT sso_domains_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: webauthn_challenges webauthn_challenges_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.webauthn_challenges
    ADD CONSTRAINT webauthn_challenges_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: webauthn_credentials webauthn_credentials_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.webauthn_credentials
    ADD CONSTRAINT webauthn_credentials_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: ai_chat_usage ai_chat_usage_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_chat_usage
    ADD CONSTRAINT ai_chat_usage_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: birth_profiles birth_profiles_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.birth_profiles
    ADD CONSTRAINT birth_profiles_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: content_reports content_reports_content_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.content_reports
    ADD CONSTRAINT content_reports_content_author_id_fkey FOREIGN KEY (content_author_id) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: content_reports content_reports_reported_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.content_reports
    ADD CONSTRAINT content_reports_reported_by_fkey FOREIGN KEY (reported_by) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: daily_sadhana daily_sadhana_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.daily_sadhana
    ADD CONSTRAINT daily_sadhana_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: darshan_preferences darshan_preferences_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.darshan_preferences
    ADD CONSTRAINT darshan_preferences_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: device_tokens device_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.device_tokens
    ADD CONSTRAINT device_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: event_rsvps event_rsvps_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_rsvps
    ADD CONSTRAINT event_rsvps_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;


--
-- Name: event_rsvps event_rsvps_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_rsvps
    ADD CONSTRAINT event_rsvps_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: forum_replies forum_replies_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.forum_replies
    ADD CONSTRAINT forum_replies_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: forum_replies forum_replies_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.forum_replies
    ADD CONSTRAINT forum_replies_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.forum_replies(id) ON DELETE CASCADE;


--
-- Name: forum_replies forum_replies_thread_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.forum_replies
    ADD CONSTRAINT forum_replies_thread_id_fkey FOREIGN KEY (thread_id) REFERENCES public.forum_threads(id) ON DELETE CASCADE;


--
-- Name: forum_threads forum_threads_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.forum_threads
    ADD CONSTRAINT forum_threads_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: guided_path_progress guided_path_progress_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.guided_path_progress
    ADD CONSTRAINT guided_path_progress_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: karma_award_log karma_award_log_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.karma_award_log
    ADD CONSTRAINT karma_award_log_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: karma_ledger karma_ledger_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.karma_ledger
    ADD CONSTRAINT karma_ledger_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: kul_events kul_events_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kul_events
    ADD CONSTRAINT kul_events_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: kul_events kul_events_kul_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kul_events
    ADD CONSTRAINT kul_events_kul_id_fkey FOREIGN KEY (kul_id) REFERENCES public.kuls(id) ON DELETE CASCADE;


--
-- Name: kul_events kul_events_member_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kul_events
    ADD CONSTRAINT kul_events_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.kul_family_members(id) ON DELETE SET NULL;


--
-- Name: kul_family_members kul_family_members_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kul_family_members
    ADD CONSTRAINT kul_family_members_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: kul_family_members kul_family_members_kul_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kul_family_members
    ADD CONSTRAINT kul_family_members_kul_id_fkey FOREIGN KEY (kul_id) REFERENCES public.kuls(id) ON DELETE CASCADE;


--
-- Name: kul_family_members kul_family_members_linked_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kul_family_members
    ADD CONSTRAINT kul_family_members_linked_user_id_fkey FOREIGN KEY (linked_user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: kul_family_members kul_family_members_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kul_family_members
    ADD CONSTRAINT kul_family_members_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.kul_family_members(id) ON DELETE SET NULL;


--
-- Name: kul_family_members kul_family_members_spouse_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kul_family_members
    ADD CONSTRAINT kul_family_members_spouse_id_fkey FOREIGN KEY (spouse_id) REFERENCES public.kul_family_members(id) ON DELETE SET NULL;


--
-- Name: kul_members kul_members_kul_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kul_members
    ADD CONSTRAINT kul_members_kul_id_fkey FOREIGN KEY (kul_id) REFERENCES public.kuls(id) ON DELETE CASCADE;


--
-- Name: kul_members kul_members_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kul_members
    ADD CONSTRAINT kul_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: kul_messages kul_messages_kul_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kul_messages
    ADD CONSTRAINT kul_messages_kul_id_fkey FOREIGN KEY (kul_id) REFERENCES public.kuls(id) ON DELETE CASCADE;


--
-- Name: kul_messages kul_messages_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kul_messages
    ADD CONSTRAINT kul_messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: kul_tasks kul_tasks_assigned_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kul_tasks
    ADD CONSTRAINT kul_tasks_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: kul_tasks kul_tasks_assigned_to_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kul_tasks
    ADD CONSTRAINT kul_tasks_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: kul_tasks kul_tasks_kul_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kul_tasks
    ADD CONSTRAINT kul_tasks_kul_id_fkey FOREIGN KEY (kul_id) REFERENCES public.kuls(id) ON DELETE CASCADE;


--
-- Name: kuls kuls_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kuls
    ADD CONSTRAINT kuls_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: kuls kuls_pro_admin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kuls
    ADD CONSTRAINT kuls_pro_admin_id_fkey FOREIGN KEY (pro_admin_id) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: mala_sessions mala_sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mala_sessions
    ADD CONSTRAINT mala_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: nitya_karma_log nitya_karma_log_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nitya_karma_log
    ADD CONSTRAINT nitya_karma_log_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: nitya_karma_streaks nitya_karma_streaks_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nitya_karma_streaks
    ADD CONSTRAINT nitya_karma_streaks_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: notification_schedule notification_schedule_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification_schedule
    ADD CONSTRAINT notification_schedule_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: observance_occurrences observance_occurrences_definition_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.observance_occurrences
    ADD CONSTRAINT observance_occurrences_definition_id_fkey FOREIGN KEY (definition_id) REFERENCES public.observance_definitions(id) ON DELETE CASCADE;


--
-- Name: pathshala_circle_members pathshala_circle_members_circle_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pathshala_circle_members
    ADD CONSTRAINT pathshala_circle_members_circle_id_fkey FOREIGN KEY (circle_id) REFERENCES public.pathshala_study_circles(id) ON DELETE CASCADE;


--
-- Name: pathshala_enrollments pathshala_enrollments_path_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pathshala_enrollments
    ADD CONSTRAINT pathshala_enrollments_path_id_fkey FOREIGN KEY (path_id) REFERENCES public.pathshala_paths(id) ON DELETE CASCADE;


--
-- Name: pathshala_path_chunks pathshala_path_chunks_chunk_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pathshala_path_chunks
    ADD CONSTRAINT pathshala_path_chunks_chunk_id_fkey FOREIGN KEY (chunk_id) REFERENCES public.scripture_chunks(id) ON DELETE CASCADE;


--
-- Name: pathshala_path_chunks pathshala_path_chunks_path_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pathshala_path_chunks
    ADD CONSTRAINT pathshala_path_chunks_path_id_fkey FOREIGN KEY (path_id) REFERENCES public.pathshala_paths(id) ON DELETE CASCADE;


--
-- Name: pathshala_progress pathshala_progress_chunk_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pathshala_progress
    ADD CONSTRAINT pathshala_progress_chunk_id_fkey FOREIGN KEY (chunk_id) REFERENCES public.scripture_chunks(id) ON DELETE CASCADE;


--
-- Name: pathshala_progress pathshala_progress_enrollment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pathshala_progress
    ADD CONSTRAINT pathshala_progress_enrollment_id_fkey FOREIGN KEY (enrollment_id) REFERENCES public.pathshala_enrollments(id) ON DELETE SET NULL;


--
-- Name: pathshala_progress pathshala_progress_path_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pathshala_progress
    ADD CONSTRAINT pathshala_progress_path_id_fkey FOREIGN KEY (path_id) REFERENCES public.pathshala_paths(id) ON DELETE SET NULL;


--
-- Name: pathshala_recitation_reviews pathshala_recitation_reviews_recording_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pathshala_recitation_reviews
    ADD CONSTRAINT pathshala_recitation_reviews_recording_id_fkey FOREIGN KEY (recording_id) REFERENCES public.pathshala_recordings(id) ON DELETE CASCADE;


--
-- Name: pathshala_recordings pathshala_recordings_chunk_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pathshala_recordings
    ADD CONSTRAINT pathshala_recordings_chunk_id_fkey FOREIGN KEY (chunk_id) REFERENCES public.scripture_chunks(id) ON DELETE CASCADE;


--
-- Name: pathshala_recordings pathshala_recordings_enrollment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pathshala_recordings
    ADD CONSTRAINT pathshala_recordings_enrollment_id_fkey FOREIGN KEY (enrollment_id) REFERENCES public.pathshala_enrollments(id) ON DELETE SET NULL;


--
-- Name: pathshala_study_circles pathshala_study_circles_path_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pathshala_study_circles
    ADD CONSTRAINT pathshala_study_circles_path_id_fkey FOREIGN KEY (path_id) REFERENCES public.pathshala_paths(id) ON DELETE CASCADE;


--
-- Name: pathshala_translations pathshala_translations_chunk_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pathshala_translations
    ADD CONSTRAINT pathshala_translations_chunk_id_fkey FOREIGN KEY (chunk_id) REFERENCES public.scripture_chunks(id) ON DELETE CASCADE;


--
-- Name: pathshala_user_badges pathshala_user_badges_badge_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pathshala_user_badges
    ADD CONSTRAINT pathshala_user_badges_badge_id_fkey FOREIGN KEY (badge_id) REFERENCES public.pathshala_badges(id) ON DELETE CASCADE;


--
-- Name: pathshala_user_state pathshala_user_state_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pathshala_user_state
    ADD CONSTRAINT pathshala_user_state_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: pathshala_verse_mastery pathshala_verse_mastery_chunk_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pathshala_verse_mastery
    ADD CONSTRAINT pathshala_verse_mastery_chunk_id_fkey FOREIGN KEY (chunk_id) REFERENCES public.scripture_chunks(id) ON DELETE CASCADE;


--
-- Name: post_comments post_comments_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.post_comments
    ADD CONSTRAINT post_comments_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: post_comments post_comments_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.post_comments
    ADD CONSTRAINT post_comments_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.post_comments(id) ON DELETE CASCADE;


--
-- Name: post_comments post_comments_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.post_comments
    ADD CONSTRAINT post_comments_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;


--
-- Name: post_upvotes post_upvotes_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.post_upvotes
    ADD CONSTRAINT post_upvotes_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;


--
-- Name: post_upvotes post_upvotes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.post_upvotes
    ADD CONSTRAINT post_upvotes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: posts posts_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: posts posts_mandali_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_mandali_id_fkey FOREIGN KEY (mandali_id) REFERENCES public.mandalis(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_kul_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_kul_id_fkey FOREIGN KEY (kul_id) REFERENCES public.kuls(id) ON DELETE SET NULL;


--
-- Name: profiles profiles_mandali_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_mandali_id_fkey FOREIGN KEY (mandali_id) REFERENCES public.mandalis(id) ON DELETE SET NULL;


--
-- Name: push_subscriptions push_subscriptions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.push_subscriptions
    ADD CONSTRAINT push_subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: quiz_responses quiz_responses_daily_quiz_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quiz_responses
    ADD CONSTRAINT quiz_responses_daily_quiz_id_fkey FOREIGN KEY (daily_quiz_id) REFERENCES public.daily_quiz(id) ON DELETE SET NULL;


--
-- Name: quiz_responses quiz_responses_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quiz_responses
    ADD CONSTRAINT quiz_responses_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: quiz_sessions quiz_sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quiz_sessions
    ADD CONSTRAINT quiz_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: reading_progress reading_progress_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reading_progress
    ADD CONSTRAINT reading_progress_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: recommendations recommendations_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recommendations
    ADD CONSTRAINT recommendations_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


--
-- Name: sadhana_events sadhana_events_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sadhana_events
    ADD CONSTRAINT sadhana_events_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: sankalpa_checkins sankalpa_checkins_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sankalpa_checkins
    ADD CONSTRAINT sankalpa_checkins_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: sankalpa_reflections sankalpa_reflections_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sankalpa_reflections
    ADD CONSTRAINT sankalpa_reflections_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: sankalpa sankalpa_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sankalpa
    ADD CONSTRAINT sankalpa_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: sankalpas sankalpas_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sankalpas
    ADD CONSTRAINT sankalpas_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: sattvic_sessions sattvic_sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sattvic_sessions
    ADD CONSTRAINT sattvic_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: seva_log seva_log_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.seva_log
    ADD CONSTRAINT seva_log_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: seva_task_completions seva_task_completions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.seva_task_completions
    ADD CONSTRAINT seva_task_completions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: thread_messages thread_messages_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.thread_messages
    ADD CONSTRAINT thread_messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: thread_messages thread_messages_thread_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.thread_messages
    ADD CONSTRAINT thread_messages_thread_id_fkey FOREIGN KEY (thread_id) REFERENCES public.message_threads(id) ON DELETE CASCADE;


--
-- Name: thread_participants thread_participants_thread_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.thread_participants
    ADD CONSTRAINT thread_participants_thread_id_fkey FOREIGN KEY (thread_id) REFERENCES public.message_threads(id) ON DELETE CASCADE;


--
-- Name: thread_participants thread_participants_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.thread_participants
    ADD CONSTRAINT thread_participants_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: thread_reactions thread_reactions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.thread_reactions
    ADD CONSTRAINT thread_reactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: thread_upvotes thread_upvotes_thread_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.thread_upvotes
    ADD CONSTRAINT thread_upvotes_thread_id_fkey FOREIGN KEY (thread_id) REFERENCES public.forum_threads(id) ON DELETE CASCADE;


--
-- Name: thread_upvotes thread_upvotes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.thread_upvotes
    ADD CONSTRAINT thread_upvotes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: tirtha_checkins tirtha_checkins_place_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tirtha_checkins
    ADD CONSTRAINT tirtha_checkins_place_id_fkey FOREIGN KEY (place_id) REFERENCES public.tirtha_places(id) ON DELETE CASCADE;


--
-- Name: tirtha_checkins tirtha_checkins_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tirtha_checkins
    ADD CONSTRAINT tirtha_checkins_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: tirtha_place_media tirtha_place_media_place_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tirtha_place_media
    ADD CONSTRAINT tirtha_place_media_place_id_fkey FOREIGN KEY (place_id) REFERENCES public.tirtha_places(id) ON DELETE CASCADE;


--
-- Name: tirtha_place_media tirtha_place_media_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tirtha_place_media
    ADD CONSTRAINT tirtha_place_media_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: tirtha_place_notes tirtha_place_notes_place_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tirtha_place_notes
    ADD CONSTRAINT tirtha_place_notes_place_id_fkey FOREIGN KEY (place_id) REFERENCES public.tirtha_places(id) ON DELETE CASCADE;


--
-- Name: tirtha_place_notes tirtha_place_notes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tirtha_place_notes
    ADD CONSTRAINT tirtha_place_notes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: tirtha_places tirtha_places_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tirtha_places
    ADD CONSTRAINT tirtha_places_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: tirtha_reports tirtha_reports_place_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tirtha_reports
    ADD CONSTRAINT tirtha_reports_place_id_fkey FOREIGN KEY (place_id) REFERENCES public.tirtha_places(id) ON DELETE CASCADE;


--
-- Name: tirtha_reports tirtha_reports_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tirtha_reports
    ADD CONSTRAINT tirtha_reports_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: tirtha_reviews tirtha_reviews_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tirtha_reviews
    ADD CONSTRAINT tirtha_reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: tirtha_saves tirtha_saves_place_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tirtha_saves
    ADD CONSTRAINT tirtha_saves_place_id_fkey FOREIGN KEY (place_id) REFERENCES public.tirtha_places(id) ON DELETE CASCADE;


--
-- Name: tirtha_saves tirtha_saves_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tirtha_saves
    ADD CONSTRAINT tirtha_saves_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: tirtha_visits tirtha_visits_tirtha_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tirtha_visits
    ADD CONSTRAINT tirtha_visits_tirtha_id_fkey FOREIGN KEY (tirtha_id) REFERENCES public.tirthas(id);


--
-- Name: tirtha_visits tirtha_visits_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tirtha_visits
    ADD CONSTRAINT tirtha_visits_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_blocked_profiles user_blocked_profiles_blocked_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_blocked_profiles
    ADD CONSTRAINT user_blocked_profiles_blocked_user_id_fkey FOREIGN KEY (blocked_user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: user_blocked_profiles user_blocked_profiles_blocker_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_blocked_profiles
    ADD CONSTRAINT user_blocked_profiles_blocker_id_fkey FOREIGN KEY (blocker_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: user_hidden_content user_hidden_content_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_hidden_content
    ADD CONSTRAINT user_hidden_content_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: user_mood_checkins user_mood_checkins_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_mood_checkins
    ADD CONSTRAINT user_mood_checkins_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: user_muted_profiles user_muted_profiles_muted_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_muted_profiles
    ADD CONSTRAINT user_muted_profiles_muted_user_id_fkey FOREIGN KEY (muted_user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: user_muted_profiles user_muted_profiles_muter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_muted_profiles
    ADD CONSTRAINT user_muted_profiles_muter_id_fkey FOREIGN KEY (muter_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: user_practice user_practice_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_practice
    ADD CONSTRAINT user_practice_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_sanskaras user_sanskaras_kul_member_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_sanskaras
    ADD CONSTRAINT user_sanskaras_kul_member_id_fkey FOREIGN KEY (kul_member_id) REFERENCES public.kul_family_members(id) ON DELETE SET NULL;


--
-- Name: user_sanskaras user_sanskaras_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_sanskaras
    ADD CONSTRAINT user_sanskaras_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_sanskars user_sanskars_sanskar_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_sanskars
    ADD CONSTRAINT user_sanskars_sanskar_id_fkey FOREIGN KEY (sanskar_id) REFERENCES public.sanskars(id);


--
-- Name: user_sanskars user_sanskars_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_sanskars
    ADD CONSTRAINT user_sanskars_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_warnings user_warnings_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_warnings
    ADD CONSTRAINT user_warnings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: yatra_plans yatra_plans_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.yatra_plans
    ADD CONSTRAINT yatra_plans_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: objects objects_bucketId_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.objects
    ADD CONSTRAINT "objects_bucketId_fkey" FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads s3_multipart_uploads_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.s3_multipart_uploads
    ADD CONSTRAINT s3_multipart_uploads_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_upload_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_upload_id_fkey FOREIGN KEY (upload_id) REFERENCES storage.s3_multipart_uploads(id) ON DELETE CASCADE;


--
-- Name: vector_indexes vector_indexes_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.vector_indexes
    ADD CONSTRAINT vector_indexes_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets_vectors(id);


--
-- Name: audit_log_entries; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.audit_log_entries ENABLE ROW LEVEL SECURITY;

--
-- Name: flow_state; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.flow_state ENABLE ROW LEVEL SECURITY;

--
-- Name: identities; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.identities ENABLE ROW LEVEL SECURITY;

--
-- Name: instances; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.instances ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_amr_claims; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.mfa_amr_claims ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_challenges; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.mfa_challenges ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_factors; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.mfa_factors ENABLE ROW LEVEL SECURITY;

--
-- Name: one_time_tokens; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.one_time_tokens ENABLE ROW LEVEL SECURITY;

--
-- Name: refresh_tokens; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.refresh_tokens ENABLE ROW LEVEL SECURITY;

--
-- Name: saml_providers; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.saml_providers ENABLE ROW LEVEL SECURITY;

--
-- Name: saml_relay_states; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.saml_relay_states ENABLE ROW LEVEL SECURITY;

--
-- Name: schema_migrations; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.schema_migrations ENABLE ROW LEVEL SECURITY;

--
-- Name: sessions; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.sessions ENABLE ROW LEVEL SECURITY;

--
-- Name: sso_domains; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.sso_domains ENABLE ROW LEVEL SECURITY;

--
-- Name: sso_providers; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.sso_providers ENABLE ROW LEVEL SECURITY;

--
-- Name: users; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

--
-- Name: user_warnings Admins can manage all warnings; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can manage all warnings" ON public.user_warnings USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.is_admin = true)))));


--
-- Name: live_darshans Allow public read access to live_darshans; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow public read access to live_darshans" ON public.live_darshans FOR SELECT USING (true);


--
-- Name: live_darshans Allow service role full access to live_darshans; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow service role full access to live_darshans" ON public.live_darshans USING (((auth.jwt() ->> 'role'::text) = 'service_role'::text));


--
-- Name: message_threads Anyone authenticated can insert a thread; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Anyone authenticated can insert a thread" ON public.message_threads FOR INSERT WITH CHECK ((auth.role() = 'authenticated'::text));


--
-- Name: festivals Anyone can read festivals; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Anyone can read festivals" ON public.festivals FOR SELECT USING (true);


--
-- Name: hero_assets Anyone can read hero assets; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Anyone can read hero assets" ON public.hero_assets FOR SELECT USING (true);


--
-- Name: content_meanings Anyone can read localized content meanings; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Anyone can read localized content meanings" ON public.content_meanings FOR SELECT USING (true);


--
-- Name: observance_definitions Anyone can read observance_definitions; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Anyone can read observance_definitions" ON public.observance_definitions FOR SELECT USING (true);


--
-- Name: observance_occurrences Anyone can read observance_occurrences; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Anyone can read observance_occurrences" ON public.observance_occurrences FOR SELECT USING (true);


--
-- Name: tirtha_reviews Anyone can read tirtha reviews; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Anyone can read tirtha reviews" ON public.tirtha_reviews FOR SELECT USING (true);


--
-- Name: shlokas Anyone can view shlokas; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Anyone can view shlokas" ON public.shlokas FOR SELECT TO authenticated USING (true);


--
-- Name: mandalis Authenticated can create; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Authenticated can create" ON public.mandalis FOR INSERT WITH CHECK ((auth.role() = 'authenticated'::text));


--
-- Name: forum_threads Authenticated can create threads; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Authenticated can create threads" ON public.forum_threads FOR INSERT WITH CHECK ((auth.uid() = author_id));


--
-- Name: forum_replies Authenticated can reply; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Authenticated can reply" ON public.forum_replies FOR INSERT WITH CHECK ((auth.uid() = author_id));


--
-- Name: content_meanings Authenticated users can cache localized content meanings; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Authenticated users can cache localized content meanings" ON public.content_meanings FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: post_comments Authenticated users can comment; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Authenticated users can comment" ON public.post_comments FOR INSERT WITH CHECK ((auth.uid() = author_id));


--
-- Name: posts Authenticated users can post; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Authenticated users can post" ON public.posts FOR INSERT WITH CHECK ((auth.uid() = author_id));


--
-- Name: content_meanings Authenticated users can refresh localized content meanings; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Authenticated users can refresh localized content meanings" ON public.content_meanings FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: post_comments Authors can delete own post comments; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Authors can delete own post comments" ON public.post_comments FOR DELETE USING ((auth.uid() = author_id));


--
-- Name: posts Authors can delete own posts; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Authors can delete own posts" ON public.posts FOR DELETE USING ((auth.uid() = author_id));


--
-- Name: forum_replies Authors can delete replies; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Authors can delete replies" ON public.forum_replies FOR DELETE USING ((auth.uid() = author_id));


--
-- Name: forum_threads Authors can delete threads; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Authors can delete threads" ON public.forum_threads FOR DELETE USING ((auth.uid() = author_id));


--
-- Name: post_comments Authors can update own post comments; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Authors can update own post comments" ON public.post_comments FOR UPDATE USING ((auth.uid() = author_id));


--
-- Name: posts Authors can update own posts; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Authors can update own posts" ON public.posts FOR UPDATE USING ((auth.uid() = author_id));


--
-- Name: forum_replies Authors can update replies; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Authors can update replies" ON public.forum_replies FOR UPDATE USING ((auth.uid() = author_id));


--
-- Name: forum_threads Authors can update threads; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Authors can update threads" ON public.forum_threads FOR UPDATE USING ((auth.uid() = author_id));


--
-- Name: mantras Block anon writes on mantras; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Block anon writes on mantras" ON public.mantras FOR INSERT WITH CHECK (false);


--
-- Name: pathshala_study_circles Circle creators manage circles; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Circle creators manage circles" ON public.pathshala_study_circles USING ((auth.uid() = created_by));


--
-- Name: pathshala_circle_members Circle members read all member positions; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Circle members read all member positions" ON public.pathshala_circle_members FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.pathshala_circle_members cm2
  WHERE ((cm2.circle_id = cm2.circle_id) AND (cm2.user_id = auth.uid())))));


--
-- Name: event_rsvps Event RSVPs viewable by all; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Event RSVPs viewable by all" ON public.event_rsvps FOR SELECT USING (true);


--
-- Name: pathshala_study_circles Kul members read circles; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Kul members read circles" ON public.pathshala_study_circles FOR SELECT USING (true);


--
-- Name: mandalis Mandalis viewable by all; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Mandalis viewable by all" ON public.mandalis FOR SELECT USING (true);


--
-- Name: mantras Mantras are publicly readable; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Mantras are publicly readable" ON public.mantras FOR SELECT USING (true);


--
-- Name: hero_assets Only service_role can manage hero assets; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Only service_role can manage hero assets" ON public.hero_assets USING (((auth.jwt() ->> 'role'::text) = 'service_role'::text));


--
-- Name: message_threads Participants can update a thread; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Participants can update a thread" ON public.message_threads FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.thread_participants
  WHERE ((thread_participants.thread_id = message_threads.id) AND (thread_participants.user_id = auth.uid())))));


--
-- Name: post_comments Post comments viewable by all; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Post comments viewable by all" ON public.post_comments FOR SELECT USING (true);


--
-- Name: posts Posts viewable by all; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Posts viewable by all" ON public.posts FOR SELECT USING (true);


--
-- Name: profiles Public profiles are viewable by everyone; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);


--
-- Name: dharm_veer_daily Public read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Public read" ON public.dharm_veer_daily FOR SELECT USING (true);


--
-- Name: pathshala_badges Public read badges; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Public read badges" ON public.pathshala_badges FOR SELECT USING ((is_active = true));


--
-- Name: pathshala_path_chunks Public read path chunks; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Public read path chunks" ON public.pathshala_path_chunks FOR SELECT USING (true);


--
-- Name: pathshala_paths Public read paths; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Public read paths" ON public.pathshala_paths FOR SELECT USING ((is_active = true));


--
-- Name: pathshala_translations Public read translations; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Public read translations" ON public.pathshala_translations FOR SELECT USING (true);


--
-- Name: forum_replies Replies viewable by all; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Replies viewable by all" ON public.forum_replies FOR SELECT USING (true);


--
-- Name: pathshala_recitation_reviews Reviewers insert reviews; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Reviewers insert reviews" ON public.pathshala_recitation_reviews FOR INSERT WITH CHECK (((reviewer_type = 'ai'::text) OR (reviewer_id = auth.uid())));


--
-- Name: sanskars Sanskars are public; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Sanskars are public" ON public.sanskars FOR SELECT USING (true);


--
-- Name: scripture_chunks Scripture is publicly readable; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Scripture is publicly readable" ON public.scripture_chunks FOR SELECT USING (true);


--
-- Name: user_practice Service can manage profiles; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Service can manage profiles" ON public.user_practice TO service_role USING (true) WITH CHECK (true);


--
-- Name: dharm_veer_daily Service insert; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Service insert" ON public.dharm_veer_daily FOR INSERT WITH CHECK (true);


--
-- Name: birth_profiles Service role full access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Service role full access" ON public.birth_profiles TO service_role USING (true) WITH CHECK (true);


--
-- Name: notifications Service role insert notifications; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Service role insert notifications" ON public.notifications FOR INSERT TO service_role WITH CHECK (true);


--
-- Name: monitoring_events Service role manages monitoring events; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Service role manages monitoring events" ON public.monitoring_events TO service_role USING (true) WITH CHECK (true);


--
-- Name: thread_upvotes Thread upvotes viewable; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Thread upvotes viewable" ON public.thread_upvotes FOR SELECT USING (true);


--
-- Name: forum_threads Threads viewable by all; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Threads viewable by all" ON public.forum_threads FOR SELECT USING (true);


--
-- Name: tirthas Tirthas are public; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Tirthas are public" ON public.tirthas FOR SELECT USING (true);


--
-- Name: post_upvotes Upvotes viewable by all; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Upvotes viewable by all" ON public.post_upvotes FOR SELECT USING (true);


--
-- Name: mala_sessions Users can create own mala sessions; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can create own mala sessions" ON public.mala_sessions FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: user_blocked_profiles Users can create their own blocks; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can create their own blocks" ON public.user_blocked_profiles FOR INSERT WITH CHECK ((auth.uid() = blocker_id));


--
-- Name: user_muted_profiles Users can create their own mutes; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can create their own mutes" ON public.user_muted_profiles FOR INSERT WITH CHECK ((auth.uid() = muter_id));


--
-- Name: mala_sessions Users can delete own mala sessions; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can delete own mala sessions" ON public.mala_sessions FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: thread_participants Users can delete participant records they own; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can delete participant records they own" ON public.thread_participants FOR DELETE USING ((user_id = auth.uid()));


--
-- Name: guided_path_progress Users can delete their guided path progress; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can delete their guided path progress" ON public.guided_path_progress FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: user_blocked_profiles Users can delete their own blocks; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can delete their own blocks" ON public.user_blocked_profiles FOR DELETE USING ((auth.uid() = blocker_id));


--
-- Name: user_muted_profiles Users can delete their own mutes; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can delete their own mutes" ON public.user_muted_profiles FOR DELETE USING ((auth.uid() = muter_id));


--
-- Name: sattvic_sessions Users can delete their own sattvic sessions; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can delete their own sattvic sessions" ON public.sattvic_sessions FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: pathshala_user_state Users can delete their pathshala state; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can delete their pathshala state" ON public.pathshala_user_state FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: user_hidden_content Users can hide their own content view; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can hide their own content view" ON public.user_hidden_content FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: sadhana_events Users can insert own events; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can insert own events" ON public.sadhana_events FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: nitya_karma_log Users can insert own karma log; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can insert own karma log" ON public.nitya_karma_log FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: profiles Users can insert own profile; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK ((auth.uid() = id));


--
-- Name: quiz_responses Users can insert own quiz responses; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can insert own quiz responses" ON public.quiz_responses FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: quiz_sessions Users can insert own quiz sessions; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can insert own quiz sessions" ON public.quiz_sessions FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: thread_participants Users can insert participant records; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can insert participant records" ON public.thread_participants FOR INSERT WITH CHECK ((auth.role() = 'authenticated'::text));


--
-- Name: guided_path_progress Users can insert their guided path progress; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can insert their guided path progress" ON public.guided_path_progress FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: user_mood_checkins Users can insert their own checkins; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can insert their own checkins" ON public.user_mood_checkins FOR INSERT WITH CHECK ((user_id = auth.uid()));


--
-- Name: sattvic_sessions Users can insert their own sattvic sessions; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can insert their own sattvic sessions" ON public.sattvic_sessions FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: pathshala_user_state Users can insert their pathshala state; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can insert their pathshala state" ON public.pathshala_user_state FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: event_rsvps Users can manage own RSVPs; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can manage own RSVPs" ON public.event_rsvps USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: daily_sadhana Users can manage own daily sadhana; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can manage own daily sadhana" ON public.daily_sadhana USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: reading_progress Users can manage own reading progress; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can manage own reading progress" ON public.reading_progress USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: sankalpa Users can manage own sankalpa; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can manage own sankalpa" ON public.sankalpa USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: post_upvotes Users can manage own upvotes; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can manage own upvotes" ON public.post_upvotes USING ((auth.uid() = user_id));


--
-- Name: thread_messages Users can read messages in threads they participate in; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can read messages in threads they participate in" ON public.thread_messages FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.thread_participants
  WHERE ((thread_participants.thread_id = thread_participants.thread_id) AND (thread_participants.user_id = auth.uid())))));


--
-- Name: sadhana_events Users can read own events; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can read own events" ON public.sadhana_events FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: mala_sessions Users can read own mala sessions; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can read own mala sessions" ON public.mala_sessions FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: user_practice Users can read own profile; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can read own profile" ON public.user_practice FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: recommendations Users can read own recommendations; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can read own recommendations" ON public.recommendations FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: guided_path_progress Users can read their guided path progress; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can read their guided path progress" ON public.guided_path_progress FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: pathshala_user_state Users can read their pathshala state; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can read their pathshala state" ON public.pathshala_user_state FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: message_threads Users can read threads they participate in; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can read threads they participate in" ON public.message_threads FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.thread_participants
  WHERE ((thread_participants.thread_id = message_threads.id) AND (thread_participants.user_id = auth.uid())))));


--
-- Name: user_blocked_profiles Users can see block relationships involving them; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can see block relationships involving them" ON public.user_blocked_profiles FOR SELECT USING (((auth.uid() = blocker_id) OR (auth.uid() = blocked_user_id)));


--
-- Name: user_mood_checkins Users can see their own checkins; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can see their own checkins" ON public.user_mood_checkins FOR SELECT USING ((user_id = auth.uid()));


--
-- Name: user_hidden_content Users can see their own hidden content; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can see their own hidden content" ON public.user_hidden_content FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: user_muted_profiles Users can see their own mutes; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can see their own mutes" ON public.user_muted_profiles FOR SELECT USING ((auth.uid() = muter_id));


--
-- Name: user_warnings Users can see their own warnings; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can see their own warnings" ON public.user_warnings FOR SELECT USING ((user_id = auth.uid()));


--
-- Name: thread_messages Users can send messages to threads they participate in; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can send messages to threads they participate in" ON public.thread_messages FOR INSERT WITH CHECK (((sender_id = auth.uid()) AND (EXISTS ( SELECT 1
   FROM public.thread_participants
  WHERE ((thread_participants.thread_id = thread_participants.thread_id) AND (thread_participants.user_id = auth.uid()))))));


--
-- Name: user_hidden_content Users can unhide their own content view; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can unhide their own content view" ON public.user_hidden_content FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: daily_sadhana Users can update own daily sadhana rows; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can update own daily sadhana rows" ON public.daily_sadhana FOR UPDATE USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: mala_sessions Users can update own mala sessions; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can update own mala sessions" ON public.mala_sessions FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: profiles Users can update own profile; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING ((auth.uid() = id)) WITH CHECK ((auth.uid() = id));


--
-- Name: thread_participants Users can update participant records they own; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can update participant records they own" ON public.thread_participants FOR UPDATE USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));


--
-- Name: guided_path_progress Users can update their guided path progress; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can update their guided path progress" ON public.guided_path_progress FOR UPDATE USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: user_mood_checkins Users can update their own checkins; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can update their own checkins" ON public.user_mood_checkins FOR UPDATE USING ((user_id = auth.uid()));


--
-- Name: thread_messages Users can update their own messages; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can update their own messages" ON public.thread_messages FOR UPDATE USING ((sender_id = auth.uid()));


--
-- Name: sattvic_sessions Users can update their own sattvic sessions; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can update their own sattvic sessions" ON public.sattvic_sessions FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: pathshala_user_state Users can update their pathshala state; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can update their pathshala state" ON public.pathshala_user_state FOR UPDATE USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: nitya_karma_log Users can upsert own karma log; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can upsert own karma log" ON public.nitya_karma_log FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: nitya_karma_log Users can view own karma log; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view own karma log" ON public.nitya_karma_log FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: quiz_responses Users can view own quiz responses; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view own quiz responses" ON public.quiz_responses FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: quiz_sessions Users can view own quiz sessions; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view own quiz sessions" ON public.quiz_sessions FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: thread_participants Users can view participants of threads they are in; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view participants of threads they are in" ON public.thread_participants FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.thread_participants tp
  WHERE ((tp.thread_id = tp.thread_id) AND (tp.user_id = auth.uid())))));


--
-- Name: sattvic_sessions Users can view their own sattvic sessions; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view their own sattvic sessions" ON public.sattvic_sessions FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: tirtha_reviews Users insert own reviews; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users insert own reviews" ON public.tirtha_reviews FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: seva_task_completions Users insert seva tasks; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users insert seva tasks" ON public.seva_task_completions FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: birth_profiles Users manage own birth profiles; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users manage own birth profiles" ON public.birth_profiles USING ((auth.uid() = owner_id)) WITH CHECK ((auth.uid() = owner_id));


--
-- Name: sankalpa_checkins Users manage own checkins; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users manage own checkins" ON public.sankalpa_checkins USING ((auth.uid() = user_id));


--
-- Name: pathshala_circle_members Users manage own circle membership; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users manage own circle membership" ON public.pathshala_circle_members USING ((auth.uid() = user_id));


--
-- Name: darshan_preferences Users manage own darshan prefs; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users manage own darshan prefs" ON public.darshan_preferences USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: device_tokens Users manage own device tokens; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users manage own device tokens" ON public.device_tokens USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: pathshala_enrollments Users manage own enrollments; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users manage own enrollments" ON public.pathshala_enrollments USING ((auth.uid() = user_id));


--
-- Name: pathshala_verse_mastery Users manage own mastery; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users manage own mastery" ON public.pathshala_verse_mastery USING ((auth.uid() = user_id));


--
-- Name: nitya_karma_log Users manage own nitya karma; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users manage own nitya karma" ON public.nitya_karma_log USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: nitya_karma_streaks Users manage own nitya streaks; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users manage own nitya streaks" ON public.nitya_karma_streaks USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: pathshala_progress Users manage own progress; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users manage own progress" ON public.pathshala_progress USING ((auth.uid() = user_id));


--
-- Name: push_subscriptions Users manage own push subscriptions; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users manage own push subscriptions" ON public.push_subscriptions USING ((auth.uid() = user_id));


--
-- Name: thread_reactions Users manage own reactions; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users manage own reactions" ON public.thread_reactions USING ((auth.uid() = user_id));


--
-- Name: pathshala_recordings Users manage own recordings; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users manage own recordings" ON public.pathshala_recordings USING ((auth.uid() = user_id));


--
-- Name: sankalpa_reflections Users manage own reflections; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users manage own reflections" ON public.sankalpa_reflections USING ((auth.uid() = user_id));


--
-- Name: sankalpas Users manage own sankalpas; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users manage own sankalpas" ON public.sankalpas USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: user_sanskaras Users manage own sanskaras; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users manage own sanskaras" ON public.user_sanskaras USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: user_sanskars Users manage own sanskars; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users manage own sanskars" ON public.user_sanskars USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: tirtha_visits Users manage own visits; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users manage own visits" ON public.tirtha_visits USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: yatra_plans Users manage own yatra; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users manage own yatra" ON public.yatra_plans USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: thread_upvotes Users manage thread upvotes; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users manage thread upvotes" ON public.thread_upvotes USING ((auth.uid() = user_id));


--
-- Name: pathshala_user_badges Users read own badges; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users read own badges" ON public.pathshala_user_badges FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: notification_schedule Users read own notifications; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users read own notifications" ON public.notification_schedule FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: notifications Users read own notifications; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users read own notifications" ON public.notifications FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: pathshala_recitation_reviews Users read own reviews; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users read own reviews" ON public.pathshala_recitation_reviews FOR SELECT USING (((reviewer_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM public.pathshala_recordings r
  WHERE ((r.id = pathshala_recitation_reviews.recording_id) AND (r.user_id = auth.uid()))))));


--
-- Name: seva_task_completions Users read own seva tasks; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users read own seva tasks" ON public.seva_task_completions FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: notifications Users update own notifications; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users update own notifications" ON public.notifications FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: tirtha_reviews Users update own reviews; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users update own reviews" ON public.tirtha_reviews FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: ai_chat_usage; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.ai_chat_usage ENABLE ROW LEVEL SECURITY;

--
-- Name: birth_profiles; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.birth_profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: content_meanings; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.content_meanings ENABLE ROW LEVEL SECURITY;

--
-- Name: content_reports; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.content_reports ENABLE ROW LEVEL SECURITY;

--
-- Name: daily_quiz; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.daily_quiz ENABLE ROW LEVEL SECURITY;

--
-- Name: daily_quiz daily_quiz_public_read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY daily_quiz_public_read ON public.daily_quiz FOR SELECT USING (true);


--
-- Name: daily_quiz daily_quiz_service_insert; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY daily_quiz_service_insert ON public.daily_quiz FOR INSERT WITH CHECK (true);


--
-- Name: daily_sadhana; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.daily_sadhana ENABLE ROW LEVEL SECURITY;

--
-- Name: darshan_preferences; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.darshan_preferences ENABLE ROW LEVEL SECURITY;

--
-- Name: device_tokens; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.device_tokens ENABLE ROW LEVEL SECURITY;

--
-- Name: devotional_tracks; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.devotional_tracks ENABLE ROW LEVEL SECURITY;

--
-- Name: devotional_tracks devotional_tracks: public read active; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "devotional_tracks: public read active" ON public.devotional_tracks FOR SELECT USING ((is_active = true));


--
-- Name: dharm_veer_daily; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.dharm_veer_daily ENABLE ROW LEVEL SECURITY;

--
-- Name: dharm_veers; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.dharm_veers ENABLE ROW LEVEL SECURITY;

--
-- Name: dharm_veers dharm_veers_public_read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY dharm_veers_public_read ON public.dharm_veers FOR SELECT USING (true);


--
-- Name: event_rsvps; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.event_rsvps ENABLE ROW LEVEL SECURITY;

--
-- Name: kul_events events_delete; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY events_delete ON public.kul_events FOR DELETE USING (((kul_id = public.auth_kul_id()) AND (public.auth_kul_role() = 'guardian'::text)));


--
-- Name: kul_events events_insert; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY events_insert ON public.kul_events FOR INSERT WITH CHECK (((kul_id = public.auth_kul_id()) AND (public.auth_kul_role() = 'guardian'::text)));


--
-- Name: kul_events events_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY events_select ON public.kul_events FOR SELECT USING ((kul_id = public.auth_kul_id()));


--
-- Name: kul_events events_update; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY events_update ON public.kul_events FOR UPDATE USING (((kul_id = public.auth_kul_id()) AND (public.auth_kul_role() = 'guardian'::text))) WITH CHECK (((kul_id = public.auth_kul_id()) AND (public.auth_kul_role() = 'guardian'::text)));


--
-- Name: festivals; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.festivals ENABLE ROW LEVEL SECURITY;

--
-- Name: forum_replies; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.forum_replies ENABLE ROW LEVEL SECURITY;

--
-- Name: forum_threads; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.forum_threads ENABLE ROW LEVEL SECURITY;

--
-- Name: guided_path_progress; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.guided_path_progress ENABLE ROW LEVEL SECURITY;

--
-- Name: hero_assets; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.hero_assets ENABLE ROW LEVEL SECURITY;

--
-- Name: karma_award_log; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.karma_award_log ENABLE ROW LEVEL SECURITY;

--
-- Name: karma_award_log karma_award_log_no_client_insert; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY karma_award_log_no_client_insert ON public.karma_award_log FOR INSERT WITH CHECK (false);


--
-- Name: karma_award_log karma_award_log_select_own; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY karma_award_log_select_own ON public.karma_award_log FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: karma_ledger; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.karma_ledger ENABLE ROW LEVEL SECURITY;

--
-- Name: kul_events; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.kul_events ENABLE ROW LEVEL SECURITY;

--
-- Name: kul_family_members; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.kul_family_members ENABLE ROW LEVEL SECURITY;

--
-- Name: kuls kul_insert; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY kul_insert ON public.kuls FOR INSERT WITH CHECK ((auth.uid() = created_by));


--
-- Name: kul_members; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.kul_members ENABLE ROW LEVEL SECURITY;

--
-- Name: kul_members kul_members_delete; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY kul_members_delete ON public.kul_members FOR DELETE USING (((auth.uid() = user_id) OR (public.auth_kul_role() = 'guardian'::text)));


--
-- Name: kul_members kul_members_insert; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY kul_members_insert ON public.kul_members FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: kul_members kul_members_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY kul_members_select ON public.kul_members FOR SELECT USING (((kul_id = public.auth_kul_id()) OR (auth.uid() = user_id)));


--
-- Name: kul_members kul_members_update; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY kul_members_update ON public.kul_members FOR UPDATE USING (((kul_id = public.auth_kul_id()) AND (public.auth_kul_role() = 'guardian'::text)));


--
-- Name: kul_messages; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.kul_messages ENABLE ROW LEVEL SECURITY;

--
-- Name: kul_messages kul_messages_delete; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY kul_messages_delete ON public.kul_messages FOR DELETE USING ((auth.uid() = sender_id));


--
-- Name: kul_messages kul_messages_insert; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY kul_messages_insert ON public.kul_messages FOR INSERT WITH CHECK (((auth.uid() = sender_id) AND (kul_id = public.auth_kul_id())));


--
-- Name: kul_messages kul_messages_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY kul_messages_select ON public.kul_messages FOR SELECT USING ((kul_id = public.auth_kul_id()));


--
-- Name: kuls kul_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY kul_select ON public.kuls FOR SELECT USING (((id = public.auth_kul_id()) OR (EXISTS ( SELECT 1
   FROM public.kul_members
  WHERE ((kul_members.kul_id = kuls.id) AND (kul_members.user_id = auth.uid()))))));


--
-- Name: kul_tasks; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.kul_tasks ENABLE ROW LEVEL SECURITY;

--
-- Name: kul_tasks kul_tasks_delete; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY kul_tasks_delete ON public.kul_tasks FOR DELETE USING ((public.auth_kul_role() = 'guardian'::text));


--
-- Name: kul_tasks kul_tasks_insert; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY kul_tasks_insert ON public.kul_tasks FOR INSERT WITH CHECK (((kul_id = public.auth_kul_id()) AND (public.auth_kul_role() = 'guardian'::text)));


--
-- Name: kul_tasks kul_tasks_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY kul_tasks_select ON public.kul_tasks FOR SELECT USING ((kul_id = public.auth_kul_id()));


--
-- Name: kul_tasks kul_tasks_update; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY kul_tasks_update ON public.kul_tasks FOR UPDATE USING (((auth.uid() = assigned_to) OR (public.auth_kul_role() = 'guardian'::text)));


--
-- Name: kuls kul_update; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY kul_update ON public.kuls FOR UPDATE TO authenticated USING (((id = public.auth_kul_id()) AND (public.auth_kul_role() = 'guardian'::text))) WITH CHECK (((id = public.auth_kul_id()) AND (public.auth_kul_role() = 'guardian'::text)));


--
-- Name: kuls; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.kuls ENABLE ROW LEVEL SECURITY;

--
-- Name: live_darshans; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.live_darshans ENABLE ROW LEVEL SECURITY;

--
-- Name: mala_sessions; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.mala_sessions ENABLE ROW LEVEL SECURITY;

--
-- Name: mandalis; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.mandalis ENABLE ROW LEVEL SECURITY;

--
-- Name: mantras; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.mantras ENABLE ROW LEVEL SECURITY;

--
-- Name: message_threads; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.message_threads ENABLE ROW LEVEL SECURITY;

--
-- Name: monitoring_events; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.monitoring_events ENABLE ROW LEVEL SECURITY;

--
-- Name: nitya_karma_log; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.nitya_karma_log ENABLE ROW LEVEL SECURITY;

--
-- Name: nitya_karma_streaks; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.nitya_karma_streaks ENABLE ROW LEVEL SECURITY;

--
-- Name: notification_schedule; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.notification_schedule ENABLE ROW LEVEL SECURITY;

--
-- Name: notifications; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

--
-- Name: observance_definitions; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.observance_definitions ENABLE ROW LEVEL SECURITY;

--
-- Name: observance_occurrences; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.observance_occurrences ENABLE ROW LEVEL SECURITY;

--
-- Name: pathshala_badges; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.pathshala_badges ENABLE ROW LEVEL SECURITY;

--
-- Name: pathshala_circle_members; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.pathshala_circle_members ENABLE ROW LEVEL SECURITY;

--
-- Name: pathshala_enrollments; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.pathshala_enrollments ENABLE ROW LEVEL SECURITY;

--
-- Name: pathshala_path_chunks; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.pathshala_path_chunks ENABLE ROW LEVEL SECURITY;

--
-- Name: pathshala_paths; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.pathshala_paths ENABLE ROW LEVEL SECURITY;

--
-- Name: pathshala_progress; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.pathshala_progress ENABLE ROW LEVEL SECURITY;

--
-- Name: pathshala_recitation_reviews; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.pathshala_recitation_reviews ENABLE ROW LEVEL SECURITY;

--
-- Name: pathshala_recordings; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.pathshala_recordings ENABLE ROW LEVEL SECURITY;

--
-- Name: pathshala_study_circles; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.pathshala_study_circles ENABLE ROW LEVEL SECURITY;

--
-- Name: pathshala_translations; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.pathshala_translations ENABLE ROW LEVEL SECURITY;

--
-- Name: pathshala_user_badges; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.pathshala_user_badges ENABLE ROW LEVEL SECURITY;

--
-- Name: pathshala_user_state; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.pathshala_user_state ENABLE ROW LEVEL SECURITY;

--
-- Name: pathshala_verse_mastery; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.pathshala_verse_mastery ENABLE ROW LEVEL SECURITY;

--
-- Name: post_comments; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;

--
-- Name: post_upvotes; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.post_upvotes ENABLE ROW LEVEL SECURITY;

--
-- Name: posts; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: waitlist public_waitlist_insert; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY public_waitlist_insert ON public.waitlist FOR INSERT TO authenticated, anon WITH CHECK (((email IS NOT NULL) AND (length(email) > 5)));


--
-- Name: push_subscriptions; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

--
-- Name: quiz_responses; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.quiz_responses ENABLE ROW LEVEL SECURITY;

--
-- Name: quiz_sessions; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.quiz_sessions ENABLE ROW LEVEL SECURITY;

--
-- Name: reading_progress; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.reading_progress ENABLE ROW LEVEL SECURITY;

--
-- Name: recommendations; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;

--
-- Name: sadhana_events; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.sadhana_events ENABLE ROW LEVEL SECURITY;

--
-- Name: sankalpa; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.sankalpa ENABLE ROW LEVEL SECURITY;

--
-- Name: sankalpa_checkins; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.sankalpa_checkins ENABLE ROW LEVEL SECURITY;

--
-- Name: sankalpa_reflections; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.sankalpa_reflections ENABLE ROW LEVEL SECURITY;

--
-- Name: sankalpas; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.sankalpas ENABLE ROW LEVEL SECURITY;

--
-- Name: sanskars; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.sanskars ENABLE ROW LEVEL SECURITY;

--
-- Name: sattvic_sessions; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.sattvic_sessions ENABLE ROW LEVEL SECURITY;

--
-- Name: scripture_chunks; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.scripture_chunks ENABLE ROW LEVEL SECURITY;

--
-- Name: waitlist service_waitlist_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY service_waitlist_select ON public.waitlist FOR SELECT USING (((auth.jwt() ->> 'role'::text) = 'service_role'::text));


--
-- Name: seva_log; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.seva_log ENABLE ROW LEVEL SECURITY;

--
-- Name: seva_log seva_log_insert_own; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY seva_log_insert_own ON public.seva_log FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: seva_log seva_log_select_own; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY seva_log_select_own ON public.seva_log FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: seva_task_completions; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.seva_task_completions ENABLE ROW LEVEL SECURITY;

--
-- Name: shlokas; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.shlokas ENABLE ROW LEVEL SECURITY;

--
-- Name: thread_messages; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.thread_messages ENABLE ROW LEVEL SECURITY;

--
-- Name: thread_participants; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.thread_participants ENABLE ROW LEVEL SECURITY;

--
-- Name: thread_reactions; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.thread_reactions ENABLE ROW LEVEL SECURITY;

--
-- Name: thread_upvotes; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.thread_upvotes ENABLE ROW LEVEL SECURITY;

--
-- Name: tirtha_checkins; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.tirtha_checkins ENABLE ROW LEVEL SECURITY;

--
-- Name: tirtha_collections; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.tirtha_collections ENABLE ROW LEVEL SECURITY;

--
-- Name: tirtha_place_media; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.tirtha_place_media ENABLE ROW LEVEL SECURITY;

--
-- Name: tirtha_place_notes; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.tirtha_place_notes ENABLE ROW LEVEL SECURITY;

--
-- Name: tirtha_places; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.tirtha_places ENABLE ROW LEVEL SECURITY;

--
-- Name: tirtha_reports; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.tirtha_reports ENABLE ROW LEVEL SECURITY;

--
-- Name: tirtha_reviews; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.tirtha_reviews ENABLE ROW LEVEL SECURITY;

--
-- Name: tirtha_saves; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.tirtha_saves ENABLE ROW LEVEL SECURITY;

--
-- Name: tirtha_visits; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.tirtha_visits ENABLE ROW LEVEL SECURITY;

--
-- Name: tirthas; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.tirthas ENABLE ROW LEVEL SECURITY;

--
-- Name: user_blocked_profiles; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.user_blocked_profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: user_hidden_content; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.user_hidden_content ENABLE ROW LEVEL SECURITY;

--
-- Name: user_mood_checkins; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.user_mood_checkins ENABLE ROW LEVEL SECURITY;

--
-- Name: user_muted_profiles; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.user_muted_profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: user_practice; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.user_practice ENABLE ROW LEVEL SECURITY;

--
-- Name: user_sanskaras; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.user_sanskaras ENABLE ROW LEVEL SECURITY;

--
-- Name: user_sanskars; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.user_sanskars ENABLE ROW LEVEL SECURITY;

--
-- Name: user_warnings; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.user_warnings ENABLE ROW LEVEL SECURITY;

--
-- Name: karma_ledger users_insert_own_karma_ledger; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY users_insert_own_karma_ledger ON public.karma_ledger FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: ai_chat_usage users_own_ai_usage; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY users_own_ai_usage ON public.ai_chat_usage USING ((auth.uid() = user_id));


--
-- Name: karma_ledger users_read_own_karma_ledger; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY users_read_own_karma_ledger ON public.karma_ledger FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: kul_family_members vamsha_delete; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY vamsha_delete ON public.kul_family_members FOR DELETE USING (((kul_id = public.auth_kul_id()) AND (public.auth_kul_role() = 'guardian'::text)));


--
-- Name: kul_family_members vamsha_insert; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY vamsha_insert ON public.kul_family_members FOR INSERT WITH CHECK (((kul_id = public.auth_kul_id()) AND (public.auth_kul_role() = 'guardian'::text)));


--
-- Name: kul_family_members vamsha_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY vamsha_select ON public.kul_family_members FOR SELECT USING ((kul_id = public.auth_kul_id()));


--
-- Name: kul_family_members vamsha_update; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY vamsha_update ON public.kul_family_members FOR UPDATE USING (((kul_id = public.auth_kul_id()) AND (public.auth_kul_role() = 'guardian'::text))) WITH CHECK (((kul_id = public.auth_kul_id()) AND (public.auth_kul_role() = 'guardian'::text)));


--
-- Name: waitlist; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

--
-- Name: yatra_plans; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.yatra_plans ENABLE ROW LEVEL SECURITY;

--
-- Name: messages; Type: ROW SECURITY; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

--
-- Name: objects Guardians can delete kul assets; Type: POLICY; Schema: storage; Owner: supabase_storage_admin
--

CREATE POLICY "Guardians can delete kul assets" ON storage.objects FOR DELETE TO authenticated USING (((bucket_id = 'avatars'::text) AND (name ~~ (('kuls/'::text || (public.auth_kul_id())::text) || '/%'::text)) AND (public.auth_kul_role() = 'guardian'::text)));


--
-- Name: objects Guardians can update kul assets; Type: POLICY; Schema: storage; Owner: supabase_storage_admin
--

CREATE POLICY "Guardians can update kul assets" ON storage.objects FOR UPDATE TO authenticated USING (((bucket_id = 'avatars'::text) AND (name ~~ (('kuls/'::text || (public.auth_kul_id())::text) || '/%'::text)) AND (public.auth_kul_role() = 'guardian'::text)));


--
-- Name: objects Guardians manage kul assets; Type: POLICY; Schema: storage; Owner: supabase_storage_admin
--

CREATE POLICY "Guardians manage kul assets" ON storage.objects TO authenticated USING (((bucket_id = 'avatars'::text) AND ((storage.foldername(name))[1] = 'kuls'::text) AND ((storage.foldername(name))[2] = (public.auth_kul_id())::text) AND (public.auth_kul_role() = 'guardian'::text))) WITH CHECK (((bucket_id = 'avatars'::text) AND ((storage.foldername(name))[1] = 'kuls'::text) AND ((storage.foldername(name))[2] = (public.auth_kul_id())::text) AND (public.auth_kul_role() = 'guardian'::text)));


--
-- Name: objects Service role manages TTS cache objects; Type: POLICY; Schema: storage; Owner: supabase_storage_admin
--

CREATE POLICY "Service role manages TTS cache objects" ON storage.objects TO service_role USING ((bucket_id = 'shoonaya-tts-cache'::text)) WITH CHECK ((bucket_id = 'shoonaya-tts-cache'::text));


--
-- Name: objects Users manage own assets; Type: POLICY; Schema: storage; Owner: supabase_storage_admin
--

CREATE POLICY "Users manage own assets" ON storage.objects TO authenticated USING (((bucket_id = 'avatars'::text) AND (((storage.foldername(name))[1] = (auth.uid())::text) OR (((storage.foldername(name))[1] = 'profiles'::text) AND ((storage.foldername(name))[2] = (auth.uid())::text))))) WITH CHECK (((bucket_id = 'avatars'::text) AND (((storage.foldername(name))[1] = (auth.uid())::text) OR (((storage.foldername(name))[1] = 'profiles'::text) AND ((storage.foldername(name))[2] = (auth.uid())::text)))));


--
-- Name: objects Users manage their own avatar 1oj01fe_0; Type: POLICY; Schema: storage; Owner: supabase_storage_admin
--

CREATE POLICY "Users manage their own avatar 1oj01fe_0" ON storage.objects FOR SELECT TO authenticated USING (((bucket_id = 'avatars'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));


--
-- Name: objects Users manage their own avatar 1oj01fe_1; Type: POLICY; Schema: storage; Owner: supabase_storage_admin
--

CREATE POLICY "Users manage their own avatar 1oj01fe_1" ON storage.objects FOR INSERT TO authenticated WITH CHECK (((bucket_id = 'avatars'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));


--
-- Name: objects Users manage their own avatar 1oj01fe_2; Type: POLICY; Schema: storage; Owner: supabase_storage_admin
--

CREATE POLICY "Users manage their own avatar 1oj01fe_2" ON storage.objects FOR UPDATE TO authenticated USING (((bucket_id = 'avatars'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));


--
-- Name: objects Users manage their own avatar 1oj01fe_3; Type: POLICY; Schema: storage; Owner: supabase_storage_admin
--

CREATE POLICY "Users manage their own avatar 1oj01fe_3" ON storage.objects FOR DELETE TO authenticated USING (((bucket_id = 'avatars'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));


--
-- Name: objects Users read own recordings; Type: POLICY; Schema: storage; Owner: supabase_storage_admin
--

CREATE POLICY "Users read own recordings" ON storage.objects FOR SELECT USING (((bucket_id = 'pathshala-recordings'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));


--
-- Name: objects Users upload own recordings; Type: POLICY; Schema: storage; Owner: supabase_storage_admin
--

CREATE POLICY "Users upload own recordings" ON storage.objects FOR INSERT WITH CHECK (((bucket_id = 'pathshala-recordings'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));


--
-- Name: buckets; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

--
-- Name: buckets_analytics; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.buckets_analytics ENABLE ROW LEVEL SECURITY;

--
-- Name: buckets_vectors; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.buckets_vectors ENABLE ROW LEVEL SECURITY;

--
-- Name: migrations; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.migrations ENABLE ROW LEVEL SECURITY;

--
-- Name: objects; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

--
-- Name: s3_multipart_uploads; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.s3_multipart_uploads ENABLE ROW LEVEL SECURITY;

--
-- Name: s3_multipart_uploads_parts; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.s3_multipart_uploads_parts ENABLE ROW LEVEL SECURITY;

--
-- Name: vector_indexes; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.vector_indexes ENABLE ROW LEVEL SECURITY;

--
-- Name: supabase_realtime; Type: PUBLICATION; Schema: -; Owner: postgres
--

CREATE PUBLICATION supabase_realtime WITH (publish = 'insert, update, delete, truncate');


ALTER PUBLICATION supabase_realtime OWNER TO postgres;

--
-- Name: supabase_realtime_messages_publication; Type: PUBLICATION; Schema: -; Owner: supabase_admin
--

CREATE PUBLICATION supabase_realtime_messages_publication WITH (publish = 'insert, update, delete, truncate');


ALTER PUBLICATION supabase_realtime_messages_publication OWNER TO supabase_admin;

--
-- Name: supabase_realtime notifications; Type: PUBLICATION TABLE; Schema: public; Owner: postgres
--

ALTER PUBLICATION supabase_realtime ADD TABLE ONLY public.notifications;


--
-- Name: supabase_realtime thread_messages; Type: PUBLICATION TABLE; Schema: public; Owner: postgres
--

ALTER PUBLICATION supabase_realtime ADD TABLE ONLY public.thread_messages;


--
-- Name: supabase_realtime_messages_publication messages; Type: PUBLICATION TABLE; Schema: realtime; Owner: supabase_admin
--

ALTER PUBLICATION supabase_realtime_messages_publication ADD TABLE ONLY realtime.messages;


--
-- Name: SCHEMA auth; Type: ACL; Schema: -; Owner: supabase_admin
--

GRANT USAGE ON SCHEMA auth TO anon;
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT USAGE ON SCHEMA auth TO service_role;
GRANT ALL ON SCHEMA auth TO supabase_auth_admin;
GRANT ALL ON SCHEMA auth TO dashboard_user;
GRANT USAGE ON SCHEMA auth TO postgres;


--
-- Name: SCHEMA cron; Type: ACL; Schema: -; Owner: supabase_admin
--

GRANT USAGE ON SCHEMA cron TO postgres WITH GRANT OPTION;


--
-- Name: SCHEMA extensions; Type: ACL; Schema: -; Owner: postgres
--

GRANT USAGE ON SCHEMA extensions TO anon;
GRANT USAGE ON SCHEMA extensions TO authenticated;
GRANT USAGE ON SCHEMA extensions TO service_role;
GRANT ALL ON SCHEMA extensions TO dashboard_user;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: pg_database_owner
--

GRANT USAGE ON SCHEMA public TO postgres;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;


--
-- Name: SCHEMA net; Type: ACL; Schema: -; Owner: supabase_admin
--

GRANT USAGE ON SCHEMA net TO supabase_functions_admin;
GRANT USAGE ON SCHEMA net TO postgres;
GRANT USAGE ON SCHEMA net TO anon;
GRANT USAGE ON SCHEMA net TO authenticated;
GRANT USAGE ON SCHEMA net TO service_role;


--
-- Name: SCHEMA realtime; Type: ACL; Schema: -; Owner: supabase_admin
--

GRANT USAGE ON SCHEMA realtime TO postgres;
GRANT USAGE ON SCHEMA realtime TO anon;
GRANT USAGE ON SCHEMA realtime TO authenticated;
GRANT USAGE ON SCHEMA realtime TO service_role;
GRANT ALL ON SCHEMA realtime TO supabase_realtime_admin;


--
-- Name: SCHEMA storage; Type: ACL; Schema: -; Owner: supabase_admin
--

GRANT USAGE ON SCHEMA storage TO postgres WITH GRANT OPTION;
GRANT USAGE ON SCHEMA storage TO anon;
GRANT USAGE ON SCHEMA storage TO authenticated;
GRANT USAGE ON SCHEMA storage TO service_role;
GRANT ALL ON SCHEMA storage TO supabase_storage_admin WITH GRANT OPTION;
GRANT ALL ON SCHEMA storage TO dashboard_user;


--
-- Name: SCHEMA vault; Type: ACL; Schema: -; Owner: supabase_admin
--

GRANT USAGE ON SCHEMA vault TO postgres WITH GRANT OPTION;
GRANT USAGE ON SCHEMA vault TO service_role;


--
-- Name: FUNCTION box2d_in(cstring); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.box2d_in(cstring) TO postgres;
GRANT ALL ON FUNCTION public.box2d_in(cstring) TO anon;
GRANT ALL ON FUNCTION public.box2d_in(cstring) TO authenticated;
GRANT ALL ON FUNCTION public.box2d_in(cstring) TO service_role;


--
-- Name: FUNCTION box2d_out(public.box2d); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.box2d_out(public.box2d) TO postgres;
GRANT ALL ON FUNCTION public.box2d_out(public.box2d) TO anon;
GRANT ALL ON FUNCTION public.box2d_out(public.box2d) TO authenticated;
GRANT ALL ON FUNCTION public.box2d_out(public.box2d) TO service_role;


--
-- Name: FUNCTION box2df_in(cstring); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.box2df_in(cstring) TO postgres;
GRANT ALL ON FUNCTION public.box2df_in(cstring) TO anon;
GRANT ALL ON FUNCTION public.box2df_in(cstring) TO authenticated;
GRANT ALL ON FUNCTION public.box2df_in(cstring) TO service_role;


--
-- Name: FUNCTION box2df_out(public.box2df); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.box2df_out(public.box2df) TO postgres;
GRANT ALL ON FUNCTION public.box2df_out(public.box2df) TO anon;
GRANT ALL ON FUNCTION public.box2df_out(public.box2df) TO authenticated;
GRANT ALL ON FUNCTION public.box2df_out(public.box2df) TO service_role;


--
-- Name: FUNCTION box3d_in(cstring); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.box3d_in(cstring) TO postgres;
GRANT ALL ON FUNCTION public.box3d_in(cstring) TO anon;
GRANT ALL ON FUNCTION public.box3d_in(cstring) TO authenticated;
GRANT ALL ON FUNCTION public.box3d_in(cstring) TO service_role;


--
-- Name: FUNCTION box3d_out(public.box3d); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.box3d_out(public.box3d) TO postgres;
GRANT ALL ON FUNCTION public.box3d_out(public.box3d) TO anon;
GRANT ALL ON FUNCTION public.box3d_out(public.box3d) TO authenticated;
GRANT ALL ON FUNCTION public.box3d_out(public.box3d) TO service_role;


--
-- Name: FUNCTION geography_analyze(internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.geography_analyze(internal) TO postgres;
GRANT ALL ON FUNCTION public.geography_analyze(internal) TO anon;
GRANT ALL ON FUNCTION public.geography_analyze(internal) TO authenticated;
GRANT ALL ON FUNCTION public.geography_analyze(internal) TO service_role;


--
-- Name: FUNCTION geography_in(cstring, oid, integer); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.geography_in(cstring, oid, integer) TO postgres;
GRANT ALL ON FUNCTION public.geography_in(cstring, oid, integer) TO anon;
GRANT ALL ON FUNCTION public.geography_in(cstring, oid, integer) TO authenticated;
GRANT ALL ON FUNCTION public.geography_in(cstring, oid, integer) TO service_role;


--
-- Name: FUNCTION geography_out(public.geography); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.geography_out(public.geography) TO postgres;
GRANT ALL ON FUNCTION public.geography_out(public.geography) TO anon;
GRANT ALL ON FUNCTION public.geography_out(public.geography) TO authenticated;
GRANT ALL ON FUNCTION public.geography_out(public.geography) TO service_role;


--
-- Name: FUNCTION geography_recv(internal, oid, integer); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.geography_recv(internal, oid, integer) TO postgres;
GRANT ALL ON FUNCTION public.geography_recv(internal, oid, integer) TO anon;
GRANT ALL ON FUNCTION public.geography_recv(internal, oid, integer) TO authenticated;
GRANT ALL ON FUNCTION public.geography_recv(internal, oid, integer) TO service_role;


--
-- Name: FUNCTION geography_send(public.geography); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.geography_send(public.geography) TO postgres;
GRANT ALL ON FUNCTION public.geography_send(public.geography) TO anon;
GRANT ALL ON FUNCTION public.geography_send(public.geography) TO authenticated;
GRANT ALL ON FUNCTION public.geography_send(public.geography) TO service_role;


--
-- Name: FUNCTION geography_typmod_in(cstring[]); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.geography_typmod_in(cstring[]) TO postgres;
GRANT ALL ON FUNCTION public.geography_typmod_in(cstring[]) TO anon;
GRANT ALL ON FUNCTION public.geography_typmod_in(cstring[]) TO authenticated;
GRANT ALL ON FUNCTION public.geography_typmod_in(cstring[]) TO service_role;


--
-- Name: FUNCTION geography_typmod_out(integer); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.geography_typmod_out(integer) TO postgres;
GRANT ALL ON FUNCTION public.geography_typmod_out(integer) TO anon;
GRANT ALL ON FUNCTION public.geography_typmod_out(integer) TO authenticated;
GRANT ALL ON FUNCTION public.geography_typmod_out(integer) TO service_role;


--
-- Name: FUNCTION geometry_analyze(internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.geometry_analyze(internal) TO postgres;
GRANT ALL ON FUNCTION public.geometry_analyze(internal) TO anon;
GRANT ALL ON FUNCTION public.geometry_analyze(internal) TO authenticated;
GRANT ALL ON FUNCTION public.geometry_analyze(internal) TO service_role;


--
-- Name: FUNCTION geometry_in(cstring); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.geometry_in(cstring) TO postgres;
GRANT ALL ON FUNCTION public.geometry_in(cstring) TO anon;
GRANT ALL ON FUNCTION public.geometry_in(cstring) TO authenticated;
GRANT ALL ON FUNCTION public.geometry_in(cstring) TO service_role;


--
-- Name: FUNCTION geometry_out(public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.geometry_out(public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.geometry_out(public.geometry) TO anon;
GRANT ALL ON FUNCTION public.geometry_out(public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.geometry_out(public.geometry) TO service_role;


--
-- Name: FUNCTION geometry_recv(internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.geometry_recv(internal) TO postgres;
GRANT ALL ON FUNCTION public.geometry_recv(internal) TO anon;
GRANT ALL ON FUNCTION public.geometry_recv(internal) TO authenticated;
GRANT ALL ON FUNCTION public.geometry_recv(internal) TO service_role;


--
-- Name: FUNCTION geometry_send(public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.geometry_send(public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.geometry_send(public.geometry) TO anon;
GRANT ALL ON FUNCTION public.geometry_send(public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.geometry_send(public.geometry) TO service_role;


--
-- Name: FUNCTION geometry_typmod_in(cstring[]); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.geometry_typmod_in(cstring[]) TO postgres;
GRANT ALL ON FUNCTION public.geometry_typmod_in(cstring[]) TO anon;
GRANT ALL ON FUNCTION public.geometry_typmod_in(cstring[]) TO authenticated;
GRANT ALL ON FUNCTION public.geometry_typmod_in(cstring[]) TO service_role;


--
-- Name: FUNCTION geometry_typmod_out(integer); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.geometry_typmod_out(integer) TO postgres;
GRANT ALL ON FUNCTION public.geometry_typmod_out(integer) TO anon;
GRANT ALL ON FUNCTION public.geometry_typmod_out(integer) TO authenticated;
GRANT ALL ON FUNCTION public.geometry_typmod_out(integer) TO service_role;


--
-- Name: FUNCTION gidx_in(cstring); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gidx_in(cstring) TO postgres;
GRANT ALL ON FUNCTION public.gidx_in(cstring) TO anon;
GRANT ALL ON FUNCTION public.gidx_in(cstring) TO authenticated;
GRANT ALL ON FUNCTION public.gidx_in(cstring) TO service_role;


--
-- Name: FUNCTION gidx_out(public.gidx); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gidx_out(public.gidx) TO postgres;
GRANT ALL ON FUNCTION public.gidx_out(public.gidx) TO anon;
GRANT ALL ON FUNCTION public.gidx_out(public.gidx) TO authenticated;
GRANT ALL ON FUNCTION public.gidx_out(public.gidx) TO service_role;


--
-- Name: FUNCTION halfvec_in(cstring, oid, integer); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.halfvec_in(cstring, oid, integer) TO postgres;
GRANT ALL ON FUNCTION public.halfvec_in(cstring, oid, integer) TO anon;
GRANT ALL ON FUNCTION public.halfvec_in(cstring, oid, integer) TO authenticated;
GRANT ALL ON FUNCTION public.halfvec_in(cstring, oid, integer) TO service_role;


--
-- Name: FUNCTION halfvec_out(public.halfvec); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.halfvec_out(public.halfvec) TO postgres;
GRANT ALL ON FUNCTION public.halfvec_out(public.halfvec) TO anon;
GRANT ALL ON FUNCTION public.halfvec_out(public.halfvec) TO authenticated;
GRANT ALL ON FUNCTION public.halfvec_out(public.halfvec) TO service_role;


--
-- Name: FUNCTION halfvec_recv(internal, oid, integer); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.halfvec_recv(internal, oid, integer) TO postgres;
GRANT ALL ON FUNCTION public.halfvec_recv(internal, oid, integer) TO anon;
GRANT ALL ON FUNCTION public.halfvec_recv(internal, oid, integer) TO authenticated;
GRANT ALL ON FUNCTION public.halfvec_recv(internal, oid, integer) TO service_role;


--
-- Name: FUNCTION halfvec_send(public.halfvec); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.halfvec_send(public.halfvec) TO postgres;
GRANT ALL ON FUNCTION public.halfvec_send(public.halfvec) TO anon;
GRANT ALL ON FUNCTION public.halfvec_send(public.halfvec) TO authenticated;
GRANT ALL ON FUNCTION public.halfvec_send(public.halfvec) TO service_role;


--
-- Name: FUNCTION halfvec_typmod_in(cstring[]); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.halfvec_typmod_in(cstring[]) TO postgres;
GRANT ALL ON FUNCTION public.halfvec_typmod_in(cstring[]) TO anon;
GRANT ALL ON FUNCTION public.halfvec_typmod_in(cstring[]) TO authenticated;
GRANT ALL ON FUNCTION public.halfvec_typmod_in(cstring[]) TO service_role;


--
-- Name: FUNCTION sparsevec_in(cstring, oid, integer); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.sparsevec_in(cstring, oid, integer) TO postgres;
GRANT ALL ON FUNCTION public.sparsevec_in(cstring, oid, integer) TO anon;
GRANT ALL ON FUNCTION public.sparsevec_in(cstring, oid, integer) TO authenticated;
GRANT ALL ON FUNCTION public.sparsevec_in(cstring, oid, integer) TO service_role;


--
-- Name: FUNCTION sparsevec_out(public.sparsevec); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.sparsevec_out(public.sparsevec) TO postgres;
GRANT ALL ON FUNCTION public.sparsevec_out(public.sparsevec) TO anon;
GRANT ALL ON FUNCTION public.sparsevec_out(public.sparsevec) TO authenticated;
GRANT ALL ON FUNCTION public.sparsevec_out(public.sparsevec) TO service_role;


--
-- Name: FUNCTION sparsevec_recv(internal, oid, integer); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.sparsevec_recv(internal, oid, integer) TO postgres;
GRANT ALL ON FUNCTION public.sparsevec_recv(internal, oid, integer) TO anon;
GRANT ALL ON FUNCTION public.sparsevec_recv(internal, oid, integer) TO authenticated;
GRANT ALL ON FUNCTION public.sparsevec_recv(internal, oid, integer) TO service_role;


--
-- Name: FUNCTION sparsevec_send(public.sparsevec); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.sparsevec_send(public.sparsevec) TO postgres;
GRANT ALL ON FUNCTION public.sparsevec_send(public.sparsevec) TO anon;
GRANT ALL ON FUNCTION public.sparsevec_send(public.sparsevec) TO authenticated;
GRANT ALL ON FUNCTION public.sparsevec_send(public.sparsevec) TO service_role;


--
-- Name: FUNCTION sparsevec_typmod_in(cstring[]); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.sparsevec_typmod_in(cstring[]) TO postgres;
GRANT ALL ON FUNCTION public.sparsevec_typmod_in(cstring[]) TO anon;
GRANT ALL ON FUNCTION public.sparsevec_typmod_in(cstring[]) TO authenticated;
GRANT ALL ON FUNCTION public.sparsevec_typmod_in(cstring[]) TO service_role;


--
-- Name: FUNCTION spheroid_in(cstring); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.spheroid_in(cstring) TO postgres;
GRANT ALL ON FUNCTION public.spheroid_in(cstring) TO anon;
GRANT ALL ON FUNCTION public.spheroid_in(cstring) TO authenticated;
GRANT ALL ON FUNCTION public.spheroid_in(cstring) TO service_role;


--
-- Name: FUNCTION spheroid_out(public.spheroid); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.spheroid_out(public.spheroid) TO postgres;
GRANT ALL ON FUNCTION public.spheroid_out(public.spheroid) TO anon;
GRANT ALL ON FUNCTION public.spheroid_out(public.spheroid) TO authenticated;
GRANT ALL ON FUNCTION public.spheroid_out(public.spheroid) TO service_role;


--
-- Name: FUNCTION vector_in(cstring, oid, integer); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.vector_in(cstring, oid, integer) TO postgres;
GRANT ALL ON FUNCTION public.vector_in(cstring, oid, integer) TO anon;
GRANT ALL ON FUNCTION public.vector_in(cstring, oid, integer) TO authenticated;
GRANT ALL ON FUNCTION public.vector_in(cstring, oid, integer) TO service_role;


--
-- Name: FUNCTION vector_out(public.vector); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.vector_out(public.vector) TO postgres;
GRANT ALL ON FUNCTION public.vector_out(public.vector) TO anon;
GRANT ALL ON FUNCTION public.vector_out(public.vector) TO authenticated;
GRANT ALL ON FUNCTION public.vector_out(public.vector) TO service_role;


--
-- Name: FUNCTION vector_recv(internal, oid, integer); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.vector_recv(internal, oid, integer) TO postgres;
GRANT ALL ON FUNCTION public.vector_recv(internal, oid, integer) TO anon;
GRANT ALL ON FUNCTION public.vector_recv(internal, oid, integer) TO authenticated;
GRANT ALL ON FUNCTION public.vector_recv(internal, oid, integer) TO service_role;


--
-- Name: FUNCTION vector_send(public.vector); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.vector_send(public.vector) TO postgres;
GRANT ALL ON FUNCTION public.vector_send(public.vector) TO anon;
GRANT ALL ON FUNCTION public.vector_send(public.vector) TO authenticated;
GRANT ALL ON FUNCTION public.vector_send(public.vector) TO service_role;


--
-- Name: FUNCTION vector_typmod_in(cstring[]); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.vector_typmod_in(cstring[]) TO postgres;
GRANT ALL ON FUNCTION public.vector_typmod_in(cstring[]) TO anon;
GRANT ALL ON FUNCTION public.vector_typmod_in(cstring[]) TO authenticated;
GRANT ALL ON FUNCTION public.vector_typmod_in(cstring[]) TO service_role;


--
-- Name: FUNCTION array_to_halfvec(real[], integer, boolean); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.array_to_halfvec(real[], integer, boolean) TO postgres;
GRANT ALL ON FUNCTION public.array_to_halfvec(real[], integer, boolean) TO anon;
GRANT ALL ON FUNCTION public.array_to_halfvec(real[], integer, boolean) TO authenticated;
GRANT ALL ON FUNCTION public.array_to_halfvec(real[], integer, boolean) TO service_role;


--
-- Name: FUNCTION array_to_sparsevec(real[], integer, boolean); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.array_to_sparsevec(real[], integer, boolean) TO postgres;
GRANT ALL ON FUNCTION public.array_to_sparsevec(real[], integer, boolean) TO anon;
GRANT ALL ON FUNCTION public.array_to_sparsevec(real[], integer, boolean) TO authenticated;
GRANT ALL ON FUNCTION public.array_to_sparsevec(real[], integer, boolean) TO service_role;


--
-- Name: FUNCTION array_to_vector(real[], integer, boolean); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.array_to_vector(real[], integer, boolean) TO postgres;
GRANT ALL ON FUNCTION public.array_to_vector(real[], integer, boolean) TO anon;
GRANT ALL ON FUNCTION public.array_to_vector(real[], integer, boolean) TO authenticated;
GRANT ALL ON FUNCTION public.array_to_vector(real[], integer, boolean) TO service_role;


--
-- Name: FUNCTION array_to_halfvec(double precision[], integer, boolean); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.array_to_halfvec(double precision[], integer, boolean) TO postgres;
GRANT ALL ON FUNCTION public.array_to_halfvec(double precision[], integer, boolean) TO anon;
GRANT ALL ON FUNCTION public.array_to_halfvec(double precision[], integer, boolean) TO authenticated;
GRANT ALL ON FUNCTION public.array_to_halfvec(double precision[], integer, boolean) TO service_role;


--
-- Name: FUNCTION array_to_sparsevec(double precision[], integer, boolean); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.array_to_sparsevec(double precision[], integer, boolean) TO postgres;
GRANT ALL ON FUNCTION public.array_to_sparsevec(double precision[], integer, boolean) TO anon;
GRANT ALL ON FUNCTION public.array_to_sparsevec(double precision[], integer, boolean) TO authenticated;
GRANT ALL ON FUNCTION public.array_to_sparsevec(double precision[], integer, boolean) TO service_role;


--
-- Name: FUNCTION array_to_vector(double precision[], integer, boolean); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.array_to_vector(double precision[], integer, boolean) TO postgres;
GRANT ALL ON FUNCTION public.array_to_vector(double precision[], integer, boolean) TO anon;
GRANT ALL ON FUNCTION public.array_to_vector(double precision[], integer, boolean) TO authenticated;
GRANT ALL ON FUNCTION public.array_to_vector(double precision[], integer, boolean) TO service_role;


--
-- Name: FUNCTION array_to_halfvec(integer[], integer, boolean); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.array_to_halfvec(integer[], integer, boolean) TO postgres;
GRANT ALL ON FUNCTION public.array_to_halfvec(integer[], integer, boolean) TO anon;
GRANT ALL ON FUNCTION public.array_to_halfvec(integer[], integer, boolean) TO authenticated;
GRANT ALL ON FUNCTION public.array_to_halfvec(integer[], integer, boolean) TO service_role;


--
-- Name: FUNCTION array_to_sparsevec(integer[], integer, boolean); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.array_to_sparsevec(integer[], integer, boolean) TO postgres;
GRANT ALL ON FUNCTION public.array_to_sparsevec(integer[], integer, boolean) TO anon;
GRANT ALL ON FUNCTION public.array_to_sparsevec(integer[], integer, boolean) TO authenticated;
GRANT ALL ON FUNCTION public.array_to_sparsevec(integer[], integer, boolean) TO service_role;


--
-- Name: FUNCTION array_to_vector(integer[], integer, boolean); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.array_to_vector(integer[], integer, boolean) TO postgres;
GRANT ALL ON FUNCTION public.array_to_vector(integer[], integer, boolean) TO anon;
GRANT ALL ON FUNCTION public.array_to_vector(integer[], integer, boolean) TO authenticated;
GRANT ALL ON FUNCTION public.array_to_vector(integer[], integer, boolean) TO service_role;


--
-- Name: FUNCTION array_to_halfvec(numeric[], integer, boolean); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.array_to_halfvec(numeric[], integer, boolean) TO postgres;
GRANT ALL ON FUNCTION public.array_to_halfvec(numeric[], integer, boolean) TO anon;
GRANT ALL ON FUNCTION public.array_to_halfvec(numeric[], integer, boolean) TO authenticated;
GRANT ALL ON FUNCTION public.array_to_halfvec(numeric[], integer, boolean) TO service_role;


--
-- Name: FUNCTION array_to_sparsevec(numeric[], integer, boolean); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.array_to_sparsevec(numeric[], integer, boolean) TO postgres;
GRANT ALL ON FUNCTION public.array_to_sparsevec(numeric[], integer, boolean) TO anon;
GRANT ALL ON FUNCTION public.array_to_sparsevec(numeric[], integer, boolean) TO authenticated;
GRANT ALL ON FUNCTION public.array_to_sparsevec(numeric[], integer, boolean) TO service_role;


--
-- Name: FUNCTION array_to_vector(numeric[], integer, boolean); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.array_to_vector(numeric[], integer, boolean) TO postgres;
GRANT ALL ON FUNCTION public.array_to_vector(numeric[], integer, boolean) TO anon;
GRANT ALL ON FUNCTION public.array_to_vector(numeric[], integer, boolean) TO authenticated;
GRANT ALL ON FUNCTION public.array_to_vector(numeric[], integer, boolean) TO service_role;


--
-- Name: FUNCTION box3d(public.box2d); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.box3d(public.box2d) TO postgres;
GRANT ALL ON FUNCTION public.box3d(public.box2d) TO anon;
GRANT ALL ON FUNCTION public.box3d(public.box2d) TO authenticated;
GRANT ALL ON FUNCTION public.box3d(public.box2d) TO service_role;


--
-- Name: FUNCTION geometry(public.box2d); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.geometry(public.box2d) TO postgres;
GRANT ALL ON FUNCTION public.geometry(public.box2d) TO anon;
GRANT ALL ON FUNCTION public.geometry(public.box2d) TO authenticated;
GRANT ALL ON FUNCTION public.geometry(public.box2d) TO service_role;


--
-- Name: FUNCTION box(public.box3d); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.box(public.box3d) TO postgres;
GRANT ALL ON FUNCTION public.box(public.box3d) TO anon;
GRANT ALL ON FUNCTION public.box(public.box3d) TO authenticated;
GRANT ALL ON FUNCTION public.box(public.box3d) TO service_role;


--
-- Name: FUNCTION box2d(public.box3d); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.box2d(public.box3d) TO postgres;
GRANT ALL ON FUNCTION public.box2d(public.box3d) TO anon;
GRANT ALL ON FUNCTION public.box2d(public.box3d) TO authenticated;
GRANT ALL ON FUNCTION public.box2d(public.box3d) TO service_role;


--
-- Name: FUNCTION geometry(public.box3d); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.geometry(public.box3d) TO postgres;
GRANT ALL ON FUNCTION public.geometry(public.box3d) TO anon;
GRANT ALL ON FUNCTION public.geometry(public.box3d) TO authenticated;
GRANT ALL ON FUNCTION public.geometry(public.box3d) TO service_role;


--
-- Name: FUNCTION geography(bytea); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.geography(bytea) TO postgres;
GRANT ALL ON FUNCTION public.geography(bytea) TO anon;
GRANT ALL ON FUNCTION public.geography(bytea) TO authenticated;
GRANT ALL ON FUNCTION public.geography(bytea) TO service_role;


--
-- Name: FUNCTION geometry(bytea); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.geometry(bytea) TO postgres;
GRANT ALL ON FUNCTION public.geometry(bytea) TO anon;
GRANT ALL ON FUNCTION public.geometry(bytea) TO authenticated;
GRANT ALL ON FUNCTION public.geometry(bytea) TO service_role;


--
-- Name: FUNCTION bytea(public.geography); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.bytea(public.geography) TO postgres;
GRANT ALL ON FUNCTION public.bytea(public.geography) TO anon;
GRANT ALL ON FUNCTION public.bytea(public.geography) TO authenticated;
GRANT ALL ON FUNCTION public.bytea(public.geography) TO service_role;


--
-- Name: FUNCTION geography(public.geography, integer, boolean); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.geography(public.geography, integer, boolean) TO postgres;
GRANT ALL ON FUNCTION public.geography(public.geography, integer, boolean) TO anon;
GRANT ALL ON FUNCTION public.geography(public.geography, integer, boolean) TO authenticated;
GRANT ALL ON FUNCTION public.geography(public.geography, integer, boolean) TO service_role;


--
-- Name: FUNCTION geometry(public.geography); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.geometry(public.geography) TO postgres;
GRANT ALL ON FUNCTION public.geometry(public.geography) TO anon;
GRANT ALL ON FUNCTION public.geometry(public.geography) TO authenticated;
GRANT ALL ON FUNCTION public.geometry(public.geography) TO service_role;


--
-- Name: FUNCTION box(public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.box(public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.box(public.geometry) TO anon;
GRANT ALL ON FUNCTION public.box(public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.box(public.geometry) TO service_role;


--
-- Name: FUNCTION box2d(public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.box2d(public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.box2d(public.geometry) TO anon;
GRANT ALL ON FUNCTION public.box2d(public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.box2d(public.geometry) TO service_role;


--
-- Name: FUNCTION box3d(public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.box3d(public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.box3d(public.geometry) TO anon;
GRANT ALL ON FUNCTION public.box3d(public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.box3d(public.geometry) TO service_role;


--
-- Name: FUNCTION bytea(public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.bytea(public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.bytea(public.geometry) TO anon;
GRANT ALL ON FUNCTION public.bytea(public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.bytea(public.geometry) TO service_role;


--
-- Name: FUNCTION geography(public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.geography(public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.geography(public.geometry) TO anon;
GRANT ALL ON FUNCTION public.geography(public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.geography(public.geometry) TO service_role;


--
-- Name: FUNCTION geometry(public.geometry, integer, boolean); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.geometry(public.geometry, integer, boolean) TO postgres;
GRANT ALL ON FUNCTION public.geometry(public.geometry, integer, boolean) TO anon;
GRANT ALL ON FUNCTION public.geometry(public.geometry, integer, boolean) TO authenticated;
GRANT ALL ON FUNCTION public.geometry(public.geometry, integer, boolean) TO service_role;


--
-- Name: FUNCTION "json"(public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public."json"(public.geometry) TO postgres;
GRANT ALL ON FUNCTION public."json"(public.geometry) TO anon;
GRANT ALL ON FUNCTION public."json"(public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public."json"(public.geometry) TO service_role;


--
-- Name: FUNCTION jsonb(public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.jsonb(public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.jsonb(public.geometry) TO anon;
GRANT ALL ON FUNCTION public.jsonb(public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.jsonb(public.geometry) TO service_role;


--
-- Name: FUNCTION path(public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.path(public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.path(public.geometry) TO anon;
GRANT ALL ON FUNCTION public.path(public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.path(public.geometry) TO service_role;


--
-- Name: FUNCTION point(public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.point(public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.point(public.geometry) TO anon;
GRANT ALL ON FUNCTION public.point(public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.point(public.geometry) TO service_role;


--
-- Name: FUNCTION polygon(public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.polygon(public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.polygon(public.geometry) TO anon;
GRANT ALL ON FUNCTION public.polygon(public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.polygon(public.geometry) TO service_role;


--
-- Name: FUNCTION text(public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.text(public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.text(public.geometry) TO anon;
GRANT ALL ON FUNCTION public.text(public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.text(public.geometry) TO service_role;


--
-- Name: FUNCTION halfvec_to_float4(public.halfvec, integer, boolean); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.halfvec_to_float4(public.halfvec, integer, boolean) TO postgres;
GRANT ALL ON FUNCTION public.halfvec_to_float4(public.halfvec, integer, boolean) TO anon;
GRANT ALL ON FUNCTION public.halfvec_to_float4(public.halfvec, integer, boolean) TO authenticated;
GRANT ALL ON FUNCTION public.halfvec_to_float4(public.halfvec, integer, boolean) TO service_role;


--
-- Name: FUNCTION halfvec(public.halfvec, integer, boolean); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.halfvec(public.halfvec, integer, boolean) TO postgres;
GRANT ALL ON FUNCTION public.halfvec(public.halfvec, integer, boolean) TO anon;
GRANT ALL ON FUNCTION public.halfvec(public.halfvec, integer, boolean) TO authenticated;
GRANT ALL ON FUNCTION public.halfvec(public.halfvec, integer, boolean) TO service_role;


--
-- Name: FUNCTION halfvec_to_sparsevec(public.halfvec, integer, boolean); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.halfvec_to_sparsevec(public.halfvec, integer, boolean) TO postgres;
GRANT ALL ON FUNCTION public.halfvec_to_sparsevec(public.halfvec, integer, boolean) TO anon;
GRANT ALL ON FUNCTION public.halfvec_to_sparsevec(public.halfvec, integer, boolean) TO authenticated;
GRANT ALL ON FUNCTION public.halfvec_to_sparsevec(public.halfvec, integer, boolean) TO service_role;


--
-- Name: FUNCTION halfvec_to_vector(public.halfvec, integer, boolean); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.halfvec_to_vector(public.halfvec, integer, boolean) TO postgres;
GRANT ALL ON FUNCTION public.halfvec_to_vector(public.halfvec, integer, boolean) TO anon;
GRANT ALL ON FUNCTION public.halfvec_to_vector(public.halfvec, integer, boolean) TO authenticated;
GRANT ALL ON FUNCTION public.halfvec_to_vector(public.halfvec, integer, boolean) TO service_role;


--
-- Name: FUNCTION geometry(path); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.geometry(path) TO postgres;
GRANT ALL ON FUNCTION public.geometry(path) TO anon;
GRANT ALL ON FUNCTION public.geometry(path) TO authenticated;
GRANT ALL ON FUNCTION public.geometry(path) TO service_role;


--
-- Name: FUNCTION geometry(point); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.geometry(point) TO postgres;
GRANT ALL ON FUNCTION public.geometry(point) TO anon;
GRANT ALL ON FUNCTION public.geometry(point) TO authenticated;
GRANT ALL ON FUNCTION public.geometry(point) TO service_role;


--
-- Name: FUNCTION geometry(polygon); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.geometry(polygon) TO postgres;
GRANT ALL ON FUNCTION public.geometry(polygon) TO anon;
GRANT ALL ON FUNCTION public.geometry(polygon) TO authenticated;
GRANT ALL ON FUNCTION public.geometry(polygon) TO service_role;


--
-- Name: FUNCTION sparsevec_to_halfvec(public.sparsevec, integer, boolean); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.sparsevec_to_halfvec(public.sparsevec, integer, boolean) TO postgres;
GRANT ALL ON FUNCTION public.sparsevec_to_halfvec(public.sparsevec, integer, boolean) TO anon;
GRANT ALL ON FUNCTION public.sparsevec_to_halfvec(public.sparsevec, integer, boolean) TO authenticated;
GRANT ALL ON FUNCTION public.sparsevec_to_halfvec(public.sparsevec, integer, boolean) TO service_role;


--
-- Name: FUNCTION sparsevec(public.sparsevec, integer, boolean); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.sparsevec(public.sparsevec, integer, boolean) TO postgres;
GRANT ALL ON FUNCTION public.sparsevec(public.sparsevec, integer, boolean) TO anon;
GRANT ALL ON FUNCTION public.sparsevec(public.sparsevec, integer, boolean) TO authenticated;
GRANT ALL ON FUNCTION public.sparsevec(public.sparsevec, integer, boolean) TO service_role;


--
-- Name: FUNCTION sparsevec_to_vector(public.sparsevec, integer, boolean); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.sparsevec_to_vector(public.sparsevec, integer, boolean) TO postgres;
GRANT ALL ON FUNCTION public.sparsevec_to_vector(public.sparsevec, integer, boolean) TO anon;
GRANT ALL ON FUNCTION public.sparsevec_to_vector(public.sparsevec, integer, boolean) TO authenticated;
GRANT ALL ON FUNCTION public.sparsevec_to_vector(public.sparsevec, integer, boolean) TO service_role;


--
-- Name: FUNCTION geometry(text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.geometry(text) TO postgres;
GRANT ALL ON FUNCTION public.geometry(text) TO anon;
GRANT ALL ON FUNCTION public.geometry(text) TO authenticated;
GRANT ALL ON FUNCTION public.geometry(text) TO service_role;


--
-- Name: FUNCTION vector_to_float4(public.vector, integer, boolean); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.vector_to_float4(public.vector, integer, boolean) TO postgres;
GRANT ALL ON FUNCTION public.vector_to_float4(public.vector, integer, boolean) TO anon;
GRANT ALL ON FUNCTION public.vector_to_float4(public.vector, integer, boolean) TO authenticated;
GRANT ALL ON FUNCTION public.vector_to_float4(public.vector, integer, boolean) TO service_role;


--
-- Name: FUNCTION vector_to_halfvec(public.vector, integer, boolean); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.vector_to_halfvec(public.vector, integer, boolean) TO postgres;
GRANT ALL ON FUNCTION public.vector_to_halfvec(public.vector, integer, boolean) TO anon;
GRANT ALL ON FUNCTION public.vector_to_halfvec(public.vector, integer, boolean) TO authenticated;
GRANT ALL ON FUNCTION public.vector_to_halfvec(public.vector, integer, boolean) TO service_role;


--
-- Name: FUNCTION vector_to_sparsevec(public.vector, integer, boolean); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.vector_to_sparsevec(public.vector, integer, boolean) TO postgres;
GRANT ALL ON FUNCTION public.vector_to_sparsevec(public.vector, integer, boolean) TO anon;
GRANT ALL ON FUNCTION public.vector_to_sparsevec(public.vector, integer, boolean) TO authenticated;
GRANT ALL ON FUNCTION public.vector_to_sparsevec(public.vector, integer, boolean) TO service_role;


--
-- Name: FUNCTION vector(public.vector, integer, boolean); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.vector(public.vector, integer, boolean) TO postgres;
GRANT ALL ON FUNCTION public.vector(public.vector, integer, boolean) TO anon;
GRANT ALL ON FUNCTION public.vector(public.vector, integer, boolean) TO authenticated;
GRANT ALL ON FUNCTION public.vector(public.vector, integer, boolean) TO service_role;


--
-- Name: FUNCTION email(); Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON FUNCTION auth.email() TO dashboard_user;


--
-- Name: FUNCTION jwt(); Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON FUNCTION auth.jwt() TO postgres;
GRANT ALL ON FUNCTION auth.jwt() TO dashboard_user;


--
-- Name: FUNCTION role(); Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON FUNCTION auth.role() TO dashboard_user;


--
-- Name: FUNCTION uid(); Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON FUNCTION auth.uid() TO dashboard_user;


--
-- Name: FUNCTION alter_job(job_id bigint, schedule text, command text, database text, username text, active boolean); Type: ACL; Schema: cron; Owner: supabase_admin
--

GRANT ALL ON FUNCTION cron.alter_job(job_id bigint, schedule text, command text, database text, username text, active boolean) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION job_cache_invalidate(); Type: ACL; Schema: cron; Owner: supabase_admin
--

GRANT ALL ON FUNCTION cron.job_cache_invalidate() TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION schedule(schedule text, command text); Type: ACL; Schema: cron; Owner: supabase_admin
--

GRANT ALL ON FUNCTION cron.schedule(schedule text, command text) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION schedule(job_name text, schedule text, command text); Type: ACL; Schema: cron; Owner: supabase_admin
--

GRANT ALL ON FUNCTION cron.schedule(job_name text, schedule text, command text) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION schedule_in_database(job_name text, schedule text, command text, database text, username text, active boolean); Type: ACL; Schema: cron; Owner: supabase_admin
--

GRANT ALL ON FUNCTION cron.schedule_in_database(job_name text, schedule text, command text, database text, username text, active boolean) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION unschedule(job_id bigint); Type: ACL; Schema: cron; Owner: supabase_admin
--

GRANT ALL ON FUNCTION cron.unschedule(job_id bigint) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION unschedule(job_name text); Type: ACL; Schema: cron; Owner: supabase_admin
--

GRANT ALL ON FUNCTION cron.unschedule(job_name text) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION armor(bytea); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.armor(bytea) FROM postgres;
GRANT ALL ON FUNCTION extensions.armor(bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.armor(bytea) TO dashboard_user;


--
-- Name: FUNCTION armor(bytea, text[], text[]); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.armor(bytea, text[], text[]) FROM postgres;
GRANT ALL ON FUNCTION extensions.armor(bytea, text[], text[]) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.armor(bytea, text[], text[]) TO dashboard_user;


--
-- Name: FUNCTION crypt(text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.crypt(text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.crypt(text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.crypt(text, text) TO dashboard_user;


--
-- Name: FUNCTION dearmor(text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.dearmor(text) FROM postgres;
GRANT ALL ON FUNCTION extensions.dearmor(text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.dearmor(text) TO dashboard_user;


--
-- Name: FUNCTION decrypt(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.decrypt(bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.decrypt(bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.decrypt(bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION decrypt_iv(bytea, bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.decrypt_iv(bytea, bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.decrypt_iv(bytea, bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.decrypt_iv(bytea, bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION digest(bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.digest(bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.digest(bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.digest(bytea, text) TO dashboard_user;


--
-- Name: FUNCTION digest(text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.digest(text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.digest(text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.digest(text, text) TO dashboard_user;


--
-- Name: FUNCTION encrypt(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.encrypt(bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.encrypt(bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.encrypt(bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION encrypt_iv(bytea, bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.encrypt_iv(bytea, bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.encrypt_iv(bytea, bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.encrypt_iv(bytea, bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION gen_random_bytes(integer); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.gen_random_bytes(integer) FROM postgres;
GRANT ALL ON FUNCTION extensions.gen_random_bytes(integer) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.gen_random_bytes(integer) TO dashboard_user;


--
-- Name: FUNCTION gen_random_uuid(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.gen_random_uuid() FROM postgres;
GRANT ALL ON FUNCTION extensions.gen_random_uuid() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.gen_random_uuid() TO dashboard_user;


--
-- Name: FUNCTION gen_salt(text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.gen_salt(text) FROM postgres;
GRANT ALL ON FUNCTION extensions.gen_salt(text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.gen_salt(text) TO dashboard_user;


--
-- Name: FUNCTION gen_salt(text, integer); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.gen_salt(text, integer) FROM postgres;
GRANT ALL ON FUNCTION extensions.gen_salt(text, integer) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.gen_salt(text, integer) TO dashboard_user;


--
-- Name: FUNCTION grant_pg_cron_access(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

REVOKE ALL ON FUNCTION extensions.grant_pg_cron_access() FROM supabase_admin;
GRANT ALL ON FUNCTION extensions.grant_pg_cron_access() TO supabase_admin WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.grant_pg_cron_access() TO dashboard_user;


--
-- Name: FUNCTION grant_pg_graphql_access(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.grant_pg_graphql_access() TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION grant_pg_net_access(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

REVOKE ALL ON FUNCTION extensions.grant_pg_net_access() FROM supabase_admin;
GRANT ALL ON FUNCTION extensions.grant_pg_net_access() TO supabase_admin WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.grant_pg_net_access() TO dashboard_user;


--
-- Name: FUNCTION hmac(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.hmac(bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.hmac(bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.hmac(bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION hmac(text, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.hmac(text, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.hmac(text, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.hmac(text, text, text) TO dashboard_user;


--
-- Name: FUNCTION hypopg(OUT indexname text, OUT indexrelid oid, OUT indrelid oid, OUT innatts integer, OUT indisunique boolean, OUT indkey int2vector, OUT indcollation oidvector, OUT indclass oidvector, OUT indoption oidvector, OUT indexprs pg_node_tree, OUT indpred pg_node_tree, OUT amid oid); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.hypopg(OUT indexname text, OUT indexrelid oid, OUT indrelid oid, OUT innatts integer, OUT indisunique boolean, OUT indkey int2vector, OUT indcollation oidvector, OUT indclass oidvector, OUT indoption oidvector, OUT indexprs pg_node_tree, OUT indpred pg_node_tree, OUT amid oid) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION hypopg_create_index(sql_order text, OUT indexrelid oid, OUT indexname text); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.hypopg_create_index(sql_order text, OUT indexrelid oid, OUT indexname text) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION hypopg_drop_index(indexid oid); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.hypopg_drop_index(indexid oid) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION hypopg_get_indexdef(indexid oid); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.hypopg_get_indexdef(indexid oid) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION hypopg_hidden_indexes(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.hypopg_hidden_indexes() TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION hypopg_hide_index(indexid oid); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.hypopg_hide_index(indexid oid) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION hypopg_relation_size(indexid oid); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.hypopg_relation_size(indexid oid) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION hypopg_reset(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.hypopg_reset() TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION hypopg_reset_index(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.hypopg_reset_index() TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION hypopg_unhide_all_indexes(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.hypopg_unhide_all_indexes() TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION hypopg_unhide_index(indexid oid); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.hypopg_unhide_index(indexid oid) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION index_advisor(query text); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.index_advisor(query text) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION pg_stat_statements(showtext boolean, OUT userid oid, OUT dbid oid, OUT toplevel boolean, OUT queryid bigint, OUT query text, OUT plans bigint, OUT total_plan_time double precision, OUT min_plan_time double precision, OUT max_plan_time double precision, OUT mean_plan_time double precision, OUT stddev_plan_time double precision, OUT calls bigint, OUT total_exec_time double precision, OUT min_exec_time double precision, OUT max_exec_time double precision, OUT mean_exec_time double precision, OUT stddev_exec_time double precision, OUT rows bigint, OUT shared_blks_hit bigint, OUT shared_blks_read bigint, OUT shared_blks_dirtied bigint, OUT shared_blks_written bigint, OUT local_blks_hit bigint, OUT local_blks_read bigint, OUT local_blks_dirtied bigint, OUT local_blks_written bigint, OUT temp_blks_read bigint, OUT temp_blks_written bigint, OUT shared_blk_read_time double precision, OUT shared_blk_write_time double precision, OUT local_blk_read_time double precision, OUT local_blk_write_time double precision, OUT temp_blk_read_time double precision, OUT temp_blk_write_time double precision, OUT wal_records bigint, OUT wal_fpi bigint, OUT wal_bytes numeric, OUT jit_functions bigint, OUT jit_generation_time double precision, OUT jit_inlining_count bigint, OUT jit_inlining_time double precision, OUT jit_optimization_count bigint, OUT jit_optimization_time double precision, OUT jit_emission_count bigint, OUT jit_emission_time double precision, OUT jit_deform_count bigint, OUT jit_deform_time double precision, OUT stats_since timestamp with time zone, OUT minmax_stats_since timestamp with time zone); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pg_stat_statements(showtext boolean, OUT userid oid, OUT dbid oid, OUT toplevel boolean, OUT queryid bigint, OUT query text, OUT plans bigint, OUT total_plan_time double precision, OUT min_plan_time double precision, OUT max_plan_time double precision, OUT mean_plan_time double precision, OUT stddev_plan_time double precision, OUT calls bigint, OUT total_exec_time double precision, OUT min_exec_time double precision, OUT max_exec_time double precision, OUT mean_exec_time double precision, OUT stddev_exec_time double precision, OUT rows bigint, OUT shared_blks_hit bigint, OUT shared_blks_read bigint, OUT shared_blks_dirtied bigint, OUT shared_blks_written bigint, OUT local_blks_hit bigint, OUT local_blks_read bigint, OUT local_blks_dirtied bigint, OUT local_blks_written bigint, OUT temp_blks_read bigint, OUT temp_blks_written bigint, OUT shared_blk_read_time double precision, OUT shared_blk_write_time double precision, OUT local_blk_read_time double precision, OUT local_blk_write_time double precision, OUT temp_blk_read_time double precision, OUT temp_blk_write_time double precision, OUT wal_records bigint, OUT wal_fpi bigint, OUT wal_bytes numeric, OUT jit_functions bigint, OUT jit_generation_time double precision, OUT jit_inlining_count bigint, OUT jit_inlining_time double precision, OUT jit_optimization_count bigint, OUT jit_optimization_time double precision, OUT jit_emission_count bigint, OUT jit_emission_time double precision, OUT jit_deform_count bigint, OUT jit_deform_time double precision, OUT stats_since timestamp with time zone, OUT minmax_stats_since timestamp with time zone) FROM postgres;
GRANT ALL ON FUNCTION extensions.pg_stat_statements(showtext boolean, OUT userid oid, OUT dbid oid, OUT toplevel boolean, OUT queryid bigint, OUT query text, OUT plans bigint, OUT total_plan_time double precision, OUT min_plan_time double precision, OUT max_plan_time double precision, OUT mean_plan_time double precision, OUT stddev_plan_time double precision, OUT calls bigint, OUT total_exec_time double precision, OUT min_exec_time double precision, OUT max_exec_time double precision, OUT mean_exec_time double precision, OUT stddev_exec_time double precision, OUT rows bigint, OUT shared_blks_hit bigint, OUT shared_blks_read bigint, OUT shared_blks_dirtied bigint, OUT shared_blks_written bigint, OUT local_blks_hit bigint, OUT local_blks_read bigint, OUT local_blks_dirtied bigint, OUT local_blks_written bigint, OUT temp_blks_read bigint, OUT temp_blks_written bigint, OUT shared_blk_read_time double precision, OUT shared_blk_write_time double precision, OUT local_blk_read_time double precision, OUT local_blk_write_time double precision, OUT temp_blk_read_time double precision, OUT temp_blk_write_time double precision, OUT wal_records bigint, OUT wal_fpi bigint, OUT wal_bytes numeric, OUT jit_functions bigint, OUT jit_generation_time double precision, OUT jit_inlining_count bigint, OUT jit_inlining_time double precision, OUT jit_optimization_count bigint, OUT jit_optimization_time double precision, OUT jit_emission_count bigint, OUT jit_emission_time double precision, OUT jit_deform_count bigint, OUT jit_deform_time double precision, OUT stats_since timestamp with time zone, OUT minmax_stats_since timestamp with time zone) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pg_stat_statements(showtext boolean, OUT userid oid, OUT dbid oid, OUT toplevel boolean, OUT queryid bigint, OUT query text, OUT plans bigint, OUT total_plan_time double precision, OUT min_plan_time double precision, OUT max_plan_time double precision, OUT mean_plan_time double precision, OUT stddev_plan_time double precision, OUT calls bigint, OUT total_exec_time double precision, OUT min_exec_time double precision, OUT max_exec_time double precision, OUT mean_exec_time double precision, OUT stddev_exec_time double precision, OUT rows bigint, OUT shared_blks_hit bigint, OUT shared_blks_read bigint, OUT shared_blks_dirtied bigint, OUT shared_blks_written bigint, OUT local_blks_hit bigint, OUT local_blks_read bigint, OUT local_blks_dirtied bigint, OUT local_blks_written bigint, OUT temp_blks_read bigint, OUT temp_blks_written bigint, OUT shared_blk_read_time double precision, OUT shared_blk_write_time double precision, OUT local_blk_read_time double precision, OUT local_blk_write_time double precision, OUT temp_blk_read_time double precision, OUT temp_blk_write_time double precision, OUT wal_records bigint, OUT wal_fpi bigint, OUT wal_bytes numeric, OUT jit_functions bigint, OUT jit_generation_time double precision, OUT jit_inlining_count bigint, OUT jit_inlining_time double precision, OUT jit_optimization_count bigint, OUT jit_optimization_time double precision, OUT jit_emission_count bigint, OUT jit_emission_time double precision, OUT jit_deform_count bigint, OUT jit_deform_time double precision, OUT stats_since timestamp with time zone, OUT minmax_stats_since timestamp with time zone) TO dashboard_user;


--
-- Name: FUNCTION pg_stat_statements_info(OUT dealloc bigint, OUT stats_reset timestamp with time zone); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pg_stat_statements_info(OUT dealloc bigint, OUT stats_reset timestamp with time zone) FROM postgres;
GRANT ALL ON FUNCTION extensions.pg_stat_statements_info(OUT dealloc bigint, OUT stats_reset timestamp with time zone) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pg_stat_statements_info(OUT dealloc bigint, OUT stats_reset timestamp with time zone) TO dashboard_user;


--
-- Name: FUNCTION pg_stat_statements_reset(userid oid, dbid oid, queryid bigint, minmax_only boolean); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pg_stat_statements_reset(userid oid, dbid oid, queryid bigint, minmax_only boolean) FROM postgres;
GRANT ALL ON FUNCTION extensions.pg_stat_statements_reset(userid oid, dbid oid, queryid bigint, minmax_only boolean) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pg_stat_statements_reset(userid oid, dbid oid, queryid bigint, minmax_only boolean) TO dashboard_user;


--
-- Name: FUNCTION pgp_armor_headers(text, OUT key text, OUT value text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_armor_headers(text, OUT key text, OUT value text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_armor_headers(text, OUT key text, OUT value text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_armor_headers(text, OUT key text, OUT value text) TO dashboard_user;


--
-- Name: FUNCTION pgp_key_id(bytea); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_key_id(bytea) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_key_id(bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_key_id(bytea) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_decrypt(bytea, bytea); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_decrypt(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_decrypt(bytea, bytea, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_decrypt_bytea(bytea, bytea); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_decrypt_bytea(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_decrypt_bytea(bytea, bytea, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_encrypt(text, bytea); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_encrypt(text, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_encrypt_bytea(bytea, bytea); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_encrypt_bytea(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_decrypt(bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_decrypt(bytea, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_decrypt_bytea(bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_decrypt_bytea(bytea, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_encrypt(text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_encrypt(text, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_encrypt_bytea(bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_encrypt_bytea(bytea, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text, text) TO dashboard_user;


--
-- Name: FUNCTION pgrst_ddl_watch(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.pgrst_ddl_watch() TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION pgrst_drop_watch(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.pgrst_drop_watch() TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION set_graphql_placeholder(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.set_graphql_placeholder() TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION uuid_generate_v1(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_generate_v1() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_generate_v1() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_generate_v1() TO dashboard_user;


--
-- Name: FUNCTION uuid_generate_v1mc(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_generate_v1mc() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_generate_v1mc() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_generate_v1mc() TO dashboard_user;


--
-- Name: FUNCTION uuid_generate_v3(namespace uuid, name text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_generate_v3(namespace uuid, name text) FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_generate_v3(namespace uuid, name text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_generate_v3(namespace uuid, name text) TO dashboard_user;


--
-- Name: FUNCTION uuid_generate_v4(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_generate_v4() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_generate_v4() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_generate_v4() TO dashboard_user;


--
-- Name: FUNCTION uuid_generate_v5(namespace uuid, name text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_generate_v5(namespace uuid, name text) FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_generate_v5(namespace uuid, name text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_generate_v5(namespace uuid, name text) TO dashboard_user;


--
-- Name: FUNCTION uuid_nil(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_nil() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_nil() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_nil() TO dashboard_user;


--
-- Name: FUNCTION uuid_ns_dns(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_ns_dns() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_ns_dns() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_ns_dns() TO dashboard_user;


--
-- Name: FUNCTION uuid_ns_oid(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_ns_oid() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_ns_oid() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_ns_oid() TO dashboard_user;


--
-- Name: FUNCTION uuid_ns_url(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_ns_url() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_ns_url() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_ns_url() TO dashboard_user;


--
-- Name: FUNCTION uuid_ns_x500(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_ns_x500() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_ns_x500() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_ns_x500() TO dashboard_user;


--
-- Name: FUNCTION graphql("operationName" text, query text, variables jsonb, extensions jsonb); Type: ACL; Schema: graphql_public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION graphql_public.graphql("operationName" text, query text, variables jsonb, extensions jsonb) TO postgres;
GRANT ALL ON FUNCTION graphql_public.graphql("operationName" text, query text, variables jsonb, extensions jsonb) TO anon;
GRANT ALL ON FUNCTION graphql_public.graphql("operationName" text, query text, variables jsonb, extensions jsonb) TO authenticated;
GRANT ALL ON FUNCTION graphql_public.graphql("operationName" text, query text, variables jsonb, extensions jsonb) TO service_role;


--
-- Name: FUNCTION pg_reload_conf(); Type: ACL; Schema: pg_catalog; Owner: supabase_admin
--

GRANT ALL ON FUNCTION pg_catalog.pg_reload_conf() TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION get_auth(p_usename text); Type: ACL; Schema: pgbouncer; Owner: supabase_admin
--

REVOKE ALL ON FUNCTION pgbouncer.get_auth(p_usename text) FROM PUBLIC;
GRANT ALL ON FUNCTION pgbouncer.get_auth(p_usename text) TO pgbouncer;


--
-- Name: FUNCTION _postgis_deprecate(oldname text, newname text, version text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public._postgis_deprecate(oldname text, newname text, version text) TO postgres;
GRANT ALL ON FUNCTION public._postgis_deprecate(oldname text, newname text, version text) TO anon;
GRANT ALL ON FUNCTION public._postgis_deprecate(oldname text, newname text, version text) TO authenticated;
GRANT ALL ON FUNCTION public._postgis_deprecate(oldname text, newname text, version text) TO service_role;


--
-- Name: FUNCTION _postgis_index_extent(tbl regclass, col text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public._postgis_index_extent(tbl regclass, col text) TO postgres;
GRANT ALL ON FUNCTION public._postgis_index_extent(tbl regclass, col text) TO anon;
GRANT ALL ON FUNCTION public._postgis_index_extent(tbl regclass, col text) TO authenticated;
GRANT ALL ON FUNCTION public._postgis_index_extent(tbl regclass, col text) TO service_role;


--
-- Name: FUNCTION _postgis_join_selectivity(regclass, text, regclass, text, text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public._postgis_join_selectivity(regclass, text, regclass, text, text) TO postgres;
GRANT ALL ON FUNCTION public._postgis_join_selectivity(regclass, text, regclass, text, text) TO anon;
GRANT ALL ON FUNCTION public._postgis_join_selectivity(regclass, text, regclass, text, text) TO authenticated;
GRANT ALL ON FUNCTION public._postgis_join_selectivity(regclass, text, regclass, text, text) TO service_role;


--
-- Name: FUNCTION _postgis_pgsql_version(); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public._postgis_pgsql_version() TO postgres;
GRANT ALL ON FUNCTION public._postgis_pgsql_version() TO anon;
GRANT ALL ON FUNCTION public._postgis_pgsql_version() TO authenticated;
GRANT ALL ON FUNCTION public._postgis_pgsql_version() TO service_role;


--
-- Name: FUNCTION _postgis_scripts_pgsql_version(); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public._postgis_scripts_pgsql_version() TO postgres;
GRANT ALL ON FUNCTION public._postgis_scripts_pgsql_version() TO anon;
GRANT ALL ON FUNCTION public._postgis_scripts_pgsql_version() TO authenticated;
GRANT ALL ON FUNCTION public._postgis_scripts_pgsql_version() TO service_role;


--
-- Name: FUNCTION _postgis_selectivity(tbl regclass, att_name text, geom public.geometry, mode text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public._postgis_selectivity(tbl regclass, att_name text, geom public.geometry, mode text) TO postgres;
GRANT ALL ON FUNCTION public._postgis_selectivity(tbl regclass, att_name text, geom public.geometry, mode text) TO anon;
GRANT ALL ON FUNCTION public._postgis_selectivity(tbl regclass, att_name text, geom public.geometry, mode text) TO authenticated;
GRANT ALL ON FUNCTION public._postgis_selectivity(tbl regclass, att_name text, geom public.geometry, mode text) TO service_role;


--
-- Name: FUNCTION _postgis_stats(tbl regclass, att_name text, text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public._postgis_stats(tbl regclass, att_name text, text) TO postgres;
GRANT ALL ON FUNCTION public._postgis_stats(tbl regclass, att_name text, text) TO anon;
GRANT ALL ON FUNCTION public._postgis_stats(tbl regclass, att_name text, text) TO authenticated;
GRANT ALL ON FUNCTION public._postgis_stats(tbl regclass, att_name text, text) TO service_role;


--
-- Name: FUNCTION _st_3ddfullywithin(geom1 public.geometry, geom2 public.geometry, double precision); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public._st_3ddfullywithin(geom1 public.geometry, geom2 public.geometry, double precision) TO postgres;
GRANT ALL ON FUNCTION public._st_3ddfullywithin(geom1 public.geometry, geom2 public.geometry, double precision) TO anon;
GRANT ALL ON FUNCTION public._st_3ddfullywithin(geom1 public.geometry, geom2 public.geometry, double precision) TO authenticated;
GRANT ALL ON FUNCTION public._st_3ddfullywithin(geom1 public.geometry, geom2 public.geometry, double precision) TO service_role;


--
-- Name: FUNCTION _st_3ddwithin(geom1 public.geometry, geom2 public.geometry, double precision); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public._st_3ddwithin(geom1 public.geometry, geom2 public.geometry, double precision) TO postgres;
GRANT ALL ON FUNCTION public._st_3ddwithin(geom1 public.geometry, geom2 public.geometry, double precision) TO anon;
GRANT ALL ON FUNCTION public._st_3ddwithin(geom1 public.geometry, geom2 public.geometry, double precision) TO authenticated;
GRANT ALL ON FUNCTION public._st_3ddwithin(geom1 public.geometry, geom2 public.geometry, double precision) TO service_role;


--
-- Name: FUNCTION _st_3dintersects(geom1 public.geometry, geom2 public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public._st_3dintersects(geom1 public.geometry, geom2 public.geometry) TO postgres;
GRANT ALL ON FUNCTION public._st_3dintersects(geom1 public.geometry, geom2 public.geometry) TO anon;
GRANT ALL ON FUNCTION public._st_3dintersects(geom1 public.geometry, geom2 public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public._st_3dintersects(geom1 public.geometry, geom2 public.geometry) TO service_role;


--
-- Name: FUNCTION _st_asgml(integer, public.geometry, integer, integer, text, text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public._st_asgml(integer, public.geometry, integer, integer, text, text) TO postgres;
GRANT ALL ON FUNCTION public._st_asgml(integer, public.geometry, integer, integer, text, text) TO anon;
GRANT ALL ON FUNCTION public._st_asgml(integer, public.geometry, integer, integer, text, text) TO authenticated;
GRANT ALL ON FUNCTION public._st_asgml(integer, public.geometry, integer, integer, text, text) TO service_role;


--
-- Name: FUNCTION _st_asx3d(integer, public.geometry, integer, integer, text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public._st_asx3d(integer, public.geometry, integer, integer, text) TO postgres;
GRANT ALL ON FUNCTION public._st_asx3d(integer, public.geometry, integer, integer, text) TO anon;
GRANT ALL ON FUNCTION public._st_asx3d(integer, public.geometry, integer, integer, text) TO authenticated;
GRANT ALL ON FUNCTION public._st_asx3d(integer, public.geometry, integer, integer, text) TO service_role;


--
-- Name: FUNCTION _st_bestsrid(public.geography); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public._st_bestsrid(public.geography) TO postgres;
GRANT ALL ON FUNCTION public._st_bestsrid(public.geography) TO anon;
GRANT ALL ON FUNCTION public._st_bestsrid(public.geography) TO authenticated;
GRANT ALL ON FUNCTION public._st_bestsrid(public.geography) TO service_role;


--
-- Name: FUNCTION _st_bestsrid(public.geography, public.geography); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public._st_bestsrid(public.geography, public.geography) TO postgres;
GRANT ALL ON FUNCTION public._st_bestsrid(public.geography, public.geography) TO anon;
GRANT ALL ON FUNCTION public._st_bestsrid(public.geography, public.geography) TO authenticated;
GRANT ALL ON FUNCTION public._st_bestsrid(public.geography, public.geography) TO service_role;


--
-- Name: FUNCTION _st_contains(geom1 public.geometry, geom2 public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public._st_contains(geom1 public.geometry, geom2 public.geometry) TO postgres;
GRANT ALL ON FUNCTION public._st_contains(geom1 public.geometry, geom2 public.geometry) TO anon;
GRANT ALL ON FUNCTION public._st_contains(geom1 public.geometry, geom2 public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public._st_contains(geom1 public.geometry, geom2 public.geometry) TO service_role;


--
-- Name: FUNCTION _st_containsproperly(geom1 public.geometry, geom2 public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public._st_containsproperly(geom1 public.geometry, geom2 public.geometry) TO postgres;
GRANT ALL ON FUNCTION public._st_containsproperly(geom1 public.geometry, geom2 public.geometry) TO anon;
GRANT ALL ON FUNCTION public._st_containsproperly(geom1 public.geometry, geom2 public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public._st_containsproperly(geom1 public.geometry, geom2 public.geometry) TO service_role;


--
-- Name: FUNCTION _st_coveredby(geog1 public.geography, geog2 public.geography); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public._st_coveredby(geog1 public.geography, geog2 public.geography) TO postgres;
GRANT ALL ON FUNCTION public._st_coveredby(geog1 public.geography, geog2 public.geography) TO anon;
GRANT ALL ON FUNCTION public._st_coveredby(geog1 public.geography, geog2 public.geography) TO authenticated;
GRANT ALL ON FUNCTION public._st_coveredby(geog1 public.geography, geog2 public.geography) TO service_role;


--
-- Name: FUNCTION _st_coveredby(geom1 public.geometry, geom2 public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public._st_coveredby(geom1 public.geometry, geom2 public.geometry) TO postgres;
GRANT ALL ON FUNCTION public._st_coveredby(geom1 public.geometry, geom2 public.geometry) TO anon;
GRANT ALL ON FUNCTION public._st_coveredby(geom1 public.geometry, geom2 public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public._st_coveredby(geom1 public.geometry, geom2 public.geometry) TO service_role;


--
-- Name: FUNCTION _st_covers(geog1 public.geography, geog2 public.geography); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public._st_covers(geog1 public.geography, geog2 public.geography) TO postgres;
GRANT ALL ON FUNCTION public._st_covers(geog1 public.geography, geog2 public.geography) TO anon;
GRANT ALL ON FUNCTION public._st_covers(geog1 public.geography, geog2 public.geography) TO authenticated;
GRANT ALL ON FUNCTION public._st_covers(geog1 public.geography, geog2 public.geography) TO service_role;


--
-- Name: FUNCTION _st_covers(geom1 public.geometry, geom2 public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public._st_covers(geom1 public.geometry, geom2 public.geometry) TO postgres;
GRANT ALL ON FUNCTION public._st_covers(geom1 public.geometry, geom2 public.geometry) TO anon;
GRANT ALL ON FUNCTION public._st_covers(geom1 public.geometry, geom2 public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public._st_covers(geom1 public.geometry, geom2 public.geometry) TO service_role;


--
-- Name: FUNCTION _st_crosses(geom1 public.geometry, geom2 public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public._st_crosses(geom1 public.geometry, geom2 public.geometry) TO postgres;
GRANT ALL ON FUNCTION public._st_crosses(geom1 public.geometry, geom2 public.geometry) TO anon;
GRANT ALL ON FUNCTION public._st_crosses(geom1 public.geometry, geom2 public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public._st_crosses(geom1 public.geometry, geom2 public.geometry) TO service_role;


--
-- Name: FUNCTION _st_dfullywithin(geom1 public.geometry, geom2 public.geometry, double precision); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public._st_dfullywithin(geom1 public.geometry, geom2 public.geometry, double precision) TO postgres;
GRANT ALL ON FUNCTION public._st_dfullywithin(geom1 public.geometry, geom2 public.geometry, double precision) TO anon;
GRANT ALL ON FUNCTION public._st_dfullywithin(geom1 public.geometry, geom2 public.geometry, double precision) TO authenticated;
GRANT ALL ON FUNCTION public._st_dfullywithin(geom1 public.geometry, geom2 public.geometry, double precision) TO service_role;


--
-- Name: FUNCTION _st_distancetree(public.geography, public.geography); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public._st_distancetree(public.geography, public.geography) TO postgres;
GRANT ALL ON FUNCTION public._st_distancetree(public.geography, public.geography) TO anon;
GRANT ALL ON FUNCTION public._st_distancetree(public.geography, public.geography) TO authenticated;
GRANT ALL ON FUNCTION public._st_distancetree(public.geography, public.geography) TO service_role;


--
-- Name: FUNCTION _st_distancetree(public.geography, public.geography, double precision, boolean); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public._st_distancetree(public.geography, public.geography, double precision, boolean) TO postgres;
GRANT ALL ON FUNCTION public._st_distancetree(public.geography, public.geography, double precision, boolean) TO anon;
GRANT ALL ON FUNCTION public._st_distancetree(public.geography, public.geography, double precision, boolean) TO authenticated;
GRANT ALL ON FUNCTION public._st_distancetree(public.geography, public.geography, double precision, boolean) TO service_role;


--
-- Name: FUNCTION _st_distanceuncached(public.geography, public.geography); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public._st_distanceuncached(public.geography, public.geography) TO postgres;
GRANT ALL ON FUNCTION public._st_distanceuncached(public.geography, public.geography) TO anon;
GRANT ALL ON FUNCTION public._st_distanceuncached(public.geography, public.geography) TO authenticated;
GRANT ALL ON FUNCTION public._st_distanceuncached(public.geography, public.geography) TO service_role;


--
-- Name: FUNCTION _st_distanceuncached(public.geography, public.geography, boolean); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public._st_distanceuncached(public.geography, public.geography, boolean) TO postgres;
GRANT ALL ON FUNCTION public._st_distanceuncached(public.geography, public.geography, boolean) TO anon;
GRANT ALL ON FUNCTION public._st_distanceuncached(public.geography, public.geography, boolean) TO authenticated;
GRANT ALL ON FUNCTION public._st_distanceuncached(public.geography, public.geography, boolean) TO service_role;


--
-- Name: FUNCTION _st_distanceuncached(public.geography, public.geography, double precision, boolean); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public._st_distanceuncached(public.geography, public.geography, double precision, boolean) TO postgres;
GRANT ALL ON FUNCTION public._st_distanceuncached(public.geography, public.geography, double precision, boolean) TO anon;
GRANT ALL ON FUNCTION public._st_distanceuncached(public.geography, public.geography, double precision, boolean) TO authenticated;
GRANT ALL ON FUNCTION public._st_distanceuncached(public.geography, public.geography, double precision, boolean) TO service_role;


--
-- Name: FUNCTION _st_dwithin(geom1 public.geometry, geom2 public.geometry, double precision); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public._st_dwithin(geom1 public.geometry, geom2 public.geometry, double precision) TO postgres;
GRANT ALL ON FUNCTION public._st_dwithin(geom1 public.geometry, geom2 public.geometry, double precision) TO anon;
GRANT ALL ON FUNCTION public._st_dwithin(geom1 public.geometry, geom2 public.geometry, double precision) TO authenticated;
GRANT ALL ON FUNCTION public._st_dwithin(geom1 public.geometry, geom2 public.geometry, double precision) TO service_role;


--
-- Name: FUNCTION _st_dwithin(geog1 public.geography, geog2 public.geography, tolerance double precision, use_spheroid boolean); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public._st_dwithin(geog1 public.geography, geog2 public.geography, tolerance double precision, use_spheroid boolean) TO postgres;
GRANT ALL ON FUNCTION public._st_dwithin(geog1 public.geography, geog2 public.geography, tolerance double precision, use_spheroid boolean) TO anon;
GRANT ALL ON FUNCTION public._st_dwithin(geog1 public.geography, geog2 public.geography, tolerance double precision, use_spheroid boolean) TO authenticated;
GRANT ALL ON FUNCTION public._st_dwithin(geog1 public.geography, geog2 public.geography, tolerance double precision, use_spheroid boolean) TO service_role;


--
-- Name: FUNCTION _st_dwithinuncached(public.geography, public.geography, double precision); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public._st_dwithinuncached(public.geography, public.geography, double precision) TO postgres;
GRANT ALL ON FUNCTION public._st_dwithinuncached(public.geography, public.geography, double precision) TO anon;
GRANT ALL ON FUNCTION public._st_dwithinuncached(public.geography, public.geography, double precision) TO authenticated;
GRANT ALL ON FUNCTION public._st_dwithinuncached(public.geography, public.geography, double precision) TO service_role;


--
-- Name: FUNCTION _st_dwithinuncached(public.geography, public.geography, double precision, boolean); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public._st_dwithinuncached(public.geography, public.geography, double precision, boolean) TO postgres;
GRANT ALL ON FUNCTION public._st_dwithinuncached(public.geography, public.geography, double precision, boolean) TO anon;
GRANT ALL ON FUNCTION public._st_dwithinuncached(public.geography, public.geography, double precision, boolean) TO authenticated;
GRANT ALL ON FUNCTION public._st_dwithinuncached(public.geography, public.geography, double precision, boolean) TO service_role;


--
-- Name: FUNCTION _st_equals(geom1 public.geometry, geom2 public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public._st_equals(geom1 public.geometry, geom2 public.geometry) TO postgres;
GRANT ALL ON FUNCTION public._st_equals(geom1 public.geometry, geom2 public.geometry) TO anon;
GRANT ALL ON FUNCTION public._st_equals(geom1 public.geometry, geom2 public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public._st_equals(geom1 public.geometry, geom2 public.geometry) TO service_role;


--
-- Name: FUNCTION _st_expand(public.geography, double precision); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public._st_expand(public.geography, double precision) TO postgres;
GRANT ALL ON FUNCTION public._st_expand(public.geography, double precision) TO anon;
GRANT ALL ON FUNCTION public._st_expand(public.geography, double precision) TO authenticated;
GRANT ALL ON FUNCTION public._st_expand(public.geography, double precision) TO service_role;


--
-- Name: FUNCTION _st_geomfromgml(text, integer); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public._st_geomfromgml(text, integer) TO postgres;
GRANT ALL ON FUNCTION public._st_geomfromgml(text, integer) TO anon;
GRANT ALL ON FUNCTION public._st_geomfromgml(text, integer) TO authenticated;
GRANT ALL ON FUNCTION public._st_geomfromgml(text, integer) TO service_role;


--
-- Name: FUNCTION _st_intersects(geom1 public.geometry, geom2 public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public._st_intersects(geom1 public.geometry, geom2 public.geometry) TO postgres;
GRANT ALL ON FUNCTION public._st_intersects(geom1 public.geometry, geom2 public.geometry) TO anon;
GRANT ALL ON FUNCTION public._st_intersects(geom1 public.geometry, geom2 public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public._st_intersects(geom1 public.geometry, geom2 public.geometry) TO service_role;


--
-- Name: FUNCTION _st_linecrossingdirection(line1 public.geometry, line2 public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public._st_linecrossingdirection(line1 public.geometry, line2 public.geometry) TO postgres;
GRANT ALL ON FUNCTION public._st_linecrossingdirection(line1 public.geometry, line2 public.geometry) TO anon;
GRANT ALL ON FUNCTION public._st_linecrossingdirection(line1 public.geometry, line2 public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public._st_linecrossingdirection(line1 public.geometry, line2 public.geometry) TO service_role;


--
-- Name: FUNCTION _st_longestline(geom1 public.geometry, geom2 public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public._st_longestline(geom1 public.geometry, geom2 public.geometry) TO postgres;
GRANT ALL ON FUNCTION public._st_longestline(geom1 public.geometry, geom2 public.geometry) TO anon;
GRANT ALL ON FUNCTION public._st_longestline(geom1 public.geometry, geom2 public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public._st_longestline(geom1 public.geometry, geom2 public.geometry) TO service_role;


--
-- Name: FUNCTION _st_maxdistance(geom1 public.geometry, geom2 public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public._st_maxdistance(geom1 public.geometry, geom2 public.geometry) TO postgres;
GRANT ALL ON FUNCTION public._st_maxdistance(geom1 public.geometry, geom2 public.geometry) TO anon;
GRANT ALL ON FUNCTION public._st_maxdistance(geom1 public.geometry, geom2 public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public._st_maxdistance(geom1 public.geometry, geom2 public.geometry) TO service_role;


--
-- Name: FUNCTION _st_orderingequals(geom1 public.geometry, geom2 public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public._st_orderingequals(geom1 public.geometry, geom2 public.geometry) TO postgres;
GRANT ALL ON FUNCTION public._st_orderingequals(geom1 public.geometry, geom2 public.geometry) TO anon;
GRANT ALL ON FUNCTION public._st_orderingequals(geom1 public.geometry, geom2 public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public._st_orderingequals(geom1 public.geometry, geom2 public.geometry) TO service_role;


--
-- Name: FUNCTION _st_overlaps(geom1 public.geometry, geom2 public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public._st_overlaps(geom1 public.geometry, geom2 public.geometry) TO postgres;
GRANT ALL ON FUNCTION public._st_overlaps(geom1 public.geometry, geom2 public.geometry) TO anon;
GRANT ALL ON FUNCTION public._st_overlaps(geom1 public.geometry, geom2 public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public._st_overlaps(geom1 public.geometry, geom2 public.geometry) TO service_role;


--
-- Name: FUNCTION _st_pointoutside(public.geography); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public._st_pointoutside(public.geography) TO postgres;
GRANT ALL ON FUNCTION public._st_pointoutside(public.geography) TO anon;
GRANT ALL ON FUNCTION public._st_pointoutside(public.geography) TO authenticated;
GRANT ALL ON FUNCTION public._st_pointoutside(public.geography) TO service_role;


--
-- Name: FUNCTION _st_sortablehash(geom public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public._st_sortablehash(geom public.geometry) TO postgres;
GRANT ALL ON FUNCTION public._st_sortablehash(geom public.geometry) TO anon;
GRANT ALL ON FUNCTION public._st_sortablehash(geom public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public._st_sortablehash(geom public.geometry) TO service_role;


--
-- Name: FUNCTION _st_touches(geom1 public.geometry, geom2 public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public._st_touches(geom1 public.geometry, geom2 public.geometry) TO postgres;
GRANT ALL ON FUNCTION public._st_touches(geom1 public.geometry, geom2 public.geometry) TO anon;
GRANT ALL ON FUNCTION public._st_touches(geom1 public.geometry, geom2 public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public._st_touches(geom1 public.geometry, geom2 public.geometry) TO service_role;


--
-- Name: FUNCTION _st_voronoi(g1 public.geometry, clip public.geometry, tolerance double precision, return_polygons boolean); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public._st_voronoi(g1 public.geometry, clip public.geometry, tolerance double precision, return_polygons boolean) TO postgres;
GRANT ALL ON FUNCTION public._st_voronoi(g1 public.geometry, clip public.geometry, tolerance double precision, return_polygons boolean) TO anon;
GRANT ALL ON FUNCTION public._st_voronoi(g1 public.geometry, clip public.geometry, tolerance double precision, return_polygons boolean) TO authenticated;
GRANT ALL ON FUNCTION public._st_voronoi(g1 public.geometry, clip public.geometry, tolerance double precision, return_polygons boolean) TO service_role;


--
-- Name: FUNCTION _st_within(geom1 public.geometry, geom2 public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public._st_within(geom1 public.geometry, geom2 public.geometry) TO postgres;
GRANT ALL ON FUNCTION public._st_within(geom1 public.geometry, geom2 public.geometry) TO anon;
GRANT ALL ON FUNCTION public._st_within(geom1 public.geometry, geom2 public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public._st_within(geom1 public.geometry, geom2 public.geometry) TO service_role;


--
-- Name: FUNCTION addauth(text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.addauth(text) TO postgres;
GRANT ALL ON FUNCTION public.addauth(text) TO anon;
GRANT ALL ON FUNCTION public.addauth(text) TO authenticated;
GRANT ALL ON FUNCTION public.addauth(text) TO service_role;


--
-- Name: FUNCTION addgeometrycolumn(table_name character varying, column_name character varying, new_srid integer, new_type character varying, new_dim integer, use_typmod boolean); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.addgeometrycolumn(table_name character varying, column_name character varying, new_srid integer, new_type character varying, new_dim integer, use_typmod boolean) TO postgres;
GRANT ALL ON FUNCTION public.addgeometrycolumn(table_name character varying, column_name character varying, new_srid integer, new_type character varying, new_dim integer, use_typmod boolean) TO anon;
GRANT ALL ON FUNCTION public.addgeometrycolumn(table_name character varying, column_name character varying, new_srid integer, new_type character varying, new_dim integer, use_typmod boolean) TO authenticated;
GRANT ALL ON FUNCTION public.addgeometrycolumn(table_name character varying, column_name character varying, new_srid integer, new_type character varying, new_dim integer, use_typmod boolean) TO service_role;


--
-- Name: FUNCTION addgeometrycolumn(schema_name character varying, table_name character varying, column_name character varying, new_srid integer, new_type character varying, new_dim integer, use_typmod boolean); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.addgeometrycolumn(schema_name character varying, table_name character varying, column_name character varying, new_srid integer, new_type character varying, new_dim integer, use_typmod boolean) TO postgres;
GRANT ALL ON FUNCTION public.addgeometrycolumn(schema_name character varying, table_name character varying, column_name character varying, new_srid integer, new_type character varying, new_dim integer, use_typmod boolean) TO anon;
GRANT ALL ON FUNCTION public.addgeometrycolumn(schema_name character varying, table_name character varying, column_name character varying, new_srid integer, new_type character varying, new_dim integer, use_typmod boolean) TO authenticated;
GRANT ALL ON FUNCTION public.addgeometrycolumn(schema_name character varying, table_name character varying, column_name character varying, new_srid integer, new_type character varying, new_dim integer, use_typmod boolean) TO service_role;


--
-- Name: FUNCTION addgeometrycolumn(catalog_name character varying, schema_name character varying, table_name character varying, column_name character varying, new_srid_in integer, new_type character varying, new_dim integer, use_typmod boolean); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.addgeometrycolumn(catalog_name character varying, schema_name character varying, table_name character varying, column_name character varying, new_srid_in integer, new_type character varying, new_dim integer, use_typmod boolean) TO postgres;
GRANT ALL ON FUNCTION public.addgeometrycolumn(catalog_name character varying, schema_name character varying, table_name character varying, column_name character varying, new_srid_in integer, new_type character varying, new_dim integer, use_typmod boolean) TO anon;
GRANT ALL ON FUNCTION public.addgeometrycolumn(catalog_name character varying, schema_name character varying, table_name character varying, column_name character varying, new_srid_in integer, new_type character varying, new_dim integer, use_typmod boolean) TO authenticated;
GRANT ALL ON FUNCTION public.addgeometrycolumn(catalog_name character varying, schema_name character varying, table_name character varying, column_name character varying, new_srid_in integer, new_type character varying, new_dim integer, use_typmod boolean) TO service_role;


--
-- Name: FUNCTION advance_enrollment(p_user_id uuid, p_path_id uuid); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.advance_enrollment(p_user_id uuid, p_path_id uuid) FROM PUBLIC;
GRANT ALL ON FUNCTION public.advance_enrollment(p_user_id uuid, p_path_id uuid) TO service_role;
GRANT ALL ON FUNCTION public.advance_enrollment(p_user_id uuid, p_path_id uuid) TO authenticated;


--
-- Name: FUNCTION auth_kul_id(); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.auth_kul_id() FROM PUBLIC;
GRANT ALL ON FUNCTION public.auth_kul_id() TO service_role;
GRANT ALL ON FUNCTION public.auth_kul_id() TO authenticated;
GRANT ALL ON FUNCTION public.auth_kul_id() TO anon;


--
-- Name: FUNCTION auth_kul_role(); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.auth_kul_role() FROM PUBLIC;
GRANT ALL ON FUNCTION public.auth_kul_role() TO service_role;
GRANT ALL ON FUNCTION public.auth_kul_role() TO authenticated;
GRANT ALL ON FUNCTION public.auth_kul_role() TO anon;


--
-- Name: FUNCTION auto_assign_mandali(); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.auto_assign_mandali() FROM PUBLIC;
GRANT ALL ON FUNCTION public.auto_assign_mandali() TO service_role;


--
-- Name: FUNCTION auto_assign_mandali_on_insert(); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.auto_assign_mandali_on_insert() FROM PUBLIC;
GRANT ALL ON FUNCTION public.auto_assign_mandali_on_insert() TO service_role;


--
-- Name: FUNCTION award_badge_if_earned(p_user_id uuid, p_badge_slug text, p_context jsonb); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.award_badge_if_earned(p_user_id uuid, p_badge_slug text, p_context jsonb) FROM PUBLIC;
GRANT ALL ON FUNCTION public.award_badge_if_earned(p_user_id uuid, p_badge_slug text, p_context jsonb) TO service_role;


--
-- Name: FUNCTION award_karma(p_user_id uuid, p_reason text, p_amount integer, p_date date, p_daily_cap integer, p_source_route text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.award_karma(p_user_id uuid, p_reason text, p_amount integer, p_date date, p_daily_cap integer, p_source_route text) TO anon;
GRANT ALL ON FUNCTION public.award_karma(p_user_id uuid, p_reason text, p_amount integer, p_date date, p_daily_cap integer, p_source_route text) TO authenticated;
GRANT ALL ON FUNCTION public.award_karma(p_user_id uuid, p_reason text, p_amount integer, p_date date, p_daily_cap integer, p_source_route text) TO service_role;


--
-- Name: FUNCTION binary_quantize(public.halfvec); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.binary_quantize(public.halfvec) TO postgres;
GRANT ALL ON FUNCTION public.binary_quantize(public.halfvec) TO anon;
GRANT ALL ON FUNCTION public.binary_quantize(public.halfvec) TO authenticated;
GRANT ALL ON FUNCTION public.binary_quantize(public.halfvec) TO service_role;


--
-- Name: FUNCTION binary_quantize(public.vector); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.binary_quantize(public.vector) TO postgres;
GRANT ALL ON FUNCTION public.binary_quantize(public.vector) TO anon;
GRANT ALL ON FUNCTION public.binary_quantize(public.vector) TO authenticated;
GRANT ALL ON FUNCTION public.binary_quantize(public.vector) TO service_role;


--
-- Name: FUNCTION box3dtobox(public.box3d); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.box3dtobox(public.box3d) TO postgres;
GRANT ALL ON FUNCTION public.box3dtobox(public.box3d) TO anon;
GRANT ALL ON FUNCTION public.box3dtobox(public.box3d) TO authenticated;
GRANT ALL ON FUNCTION public.box3dtobox(public.box3d) TO service_role;


--
-- Name: FUNCTION checkauth(text, text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.checkauth(text, text) TO postgres;
GRANT ALL ON FUNCTION public.checkauth(text, text) TO anon;
GRANT ALL ON FUNCTION public.checkauth(text, text) TO authenticated;
GRANT ALL ON FUNCTION public.checkauth(text, text) TO service_role;


--
-- Name: FUNCTION checkauth(text, text, text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.checkauth(text, text, text) TO postgres;
GRANT ALL ON FUNCTION public.checkauth(text, text, text) TO anon;
GRANT ALL ON FUNCTION public.checkauth(text, text, text) TO authenticated;
GRANT ALL ON FUNCTION public.checkauth(text, text, text) TO service_role;


--
-- Name: FUNCTION checkauthtrigger(); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.checkauthtrigger() TO postgres;
GRANT ALL ON FUNCTION public.checkauthtrigger() TO anon;
GRANT ALL ON FUNCTION public.checkauthtrigger() TO authenticated;
GRANT ALL ON FUNCTION public.checkauthtrigger() TO service_role;


--
-- Name: FUNCTION contains_2d(public.box2df, public.box2df); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.contains_2d(public.box2df, public.box2df) TO postgres;
GRANT ALL ON FUNCTION public.contains_2d(public.box2df, public.box2df) TO anon;
GRANT ALL ON FUNCTION public.contains_2d(public.box2df, public.box2df) TO authenticated;
GRANT ALL ON FUNCTION public.contains_2d(public.box2df, public.box2df) TO service_role;


--
-- Name: FUNCTION contains_2d(public.box2df, public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.contains_2d(public.box2df, public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.contains_2d(public.box2df, public.geometry) TO anon;
GRANT ALL ON FUNCTION public.contains_2d(public.box2df, public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.contains_2d(public.box2df, public.geometry) TO service_role;


--
-- Name: FUNCTION contains_2d(public.geometry, public.box2df); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.contains_2d(public.geometry, public.box2df) TO postgres;
GRANT ALL ON FUNCTION public.contains_2d(public.geometry, public.box2df) TO anon;
GRANT ALL ON FUNCTION public.contains_2d(public.geometry, public.box2df) TO authenticated;
GRANT ALL ON FUNCTION public.contains_2d(public.geometry, public.box2df) TO service_role;


--
-- Name: FUNCTION cosine_distance(public.halfvec, public.halfvec); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.cosine_distance(public.halfvec, public.halfvec) TO postgres;
GRANT ALL ON FUNCTION public.cosine_distance(public.halfvec, public.halfvec) TO anon;
GRANT ALL ON FUNCTION public.cosine_distance(public.halfvec, public.halfvec) TO authenticated;
GRANT ALL ON FUNCTION public.cosine_distance(public.halfvec, public.halfvec) TO service_role;


--
-- Name: FUNCTION cosine_distance(public.sparsevec, public.sparsevec); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.cosine_distance(public.sparsevec, public.sparsevec) TO postgres;
GRANT ALL ON FUNCTION public.cosine_distance(public.sparsevec, public.sparsevec) TO anon;
GRANT ALL ON FUNCTION public.cosine_distance(public.sparsevec, public.sparsevec) TO authenticated;
GRANT ALL ON FUNCTION public.cosine_distance(public.sparsevec, public.sparsevec) TO service_role;


--
-- Name: FUNCTION cosine_distance(public.vector, public.vector); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.cosine_distance(public.vector, public.vector) TO postgres;
GRANT ALL ON FUNCTION public.cosine_distance(public.vector, public.vector) TO anon;
GRANT ALL ON FUNCTION public.cosine_distance(public.vector, public.vector) TO authenticated;
GRANT ALL ON FUNCTION public.cosine_distance(public.vector, public.vector) TO service_role;


--
-- Name: FUNCTION create_kul(p_name text, p_emoji text, p_invite_code text); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.create_kul(p_name text, p_emoji text, p_invite_code text) FROM PUBLIC;
GRANT ALL ON FUNCTION public.create_kul(p_name text, p_emoji text, p_invite_code text) TO service_role;
GRANT ALL ON FUNCTION public.create_kul(p_name text, p_emoji text, p_invite_code text) TO authenticated;


--
-- Name: FUNCTION disablelongtransactions(); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.disablelongtransactions() TO postgres;
GRANT ALL ON FUNCTION public.disablelongtransactions() TO anon;
GRANT ALL ON FUNCTION public.disablelongtransactions() TO authenticated;
GRANT ALL ON FUNCTION public.disablelongtransactions() TO service_role;


--
-- Name: FUNCTION dropgeometrycolumn(table_name character varying, column_name character varying); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.dropgeometrycolumn(table_name character varying, column_name character varying) TO postgres;
GRANT ALL ON FUNCTION public.dropgeometrycolumn(table_name character varying, column_name character varying) TO anon;
GRANT ALL ON FUNCTION public.dropgeometrycolumn(table_name character varying, column_name character varying) TO authenticated;
GRANT ALL ON FUNCTION public.dropgeometrycolumn(table_name character varying, column_name character varying) TO service_role;


--
-- Name: FUNCTION dropgeometrycolumn(schema_name character varying, table_name character varying, column_name character varying); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.dropgeometrycolumn(schema_name character varying, table_name character varying, column_name character varying) TO postgres;
GRANT ALL ON FUNCTION public.dropgeometrycolumn(schema_name character varying, table_name character varying, column_name character varying) TO anon;
GRANT ALL ON FUNCTION public.dropgeometrycolumn(schema_name character varying, table_name character varying, column_name character varying) TO authenticated;
GRANT ALL ON FUNCTION public.dropgeometrycolumn(schema_name character varying, table_name character varying, column_name character varying) TO service_role;


--
-- Name: FUNCTION dropgeometrycolumn(catalog_name character varying, schema_name character varying, table_name character varying, column_name character varying); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.dropgeometrycolumn(catalog_name character varying, schema_name character varying, table_name character varying, column_name character varying) TO postgres;
GRANT ALL ON FUNCTION public.dropgeometrycolumn(catalog_name character varying, schema_name character varying, table_name character varying, column_name character varying) TO anon;
GRANT ALL ON FUNCTION public.dropgeometrycolumn(catalog_name character varying, schema_name character varying, table_name character varying, column_name character varying) TO authenticated;
GRANT ALL ON FUNCTION public.dropgeometrycolumn(catalog_name character varying, schema_name character varying, table_name character varying, column_name character varying) TO service_role;


--
-- Name: FUNCTION dropgeometrytable(table_name character varying); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.dropgeometrytable(table_name character varying) TO postgres;
GRANT ALL ON FUNCTION public.dropgeometrytable(table_name character varying) TO anon;
GRANT ALL ON FUNCTION public.dropgeometrytable(table_name character varying) TO authenticated;
GRANT ALL ON FUNCTION public.dropgeometrytable(table_name character varying) TO service_role;


--
-- Name: FUNCTION dropgeometrytable(schema_name character varying, table_name character varying); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.dropgeometrytable(schema_name character varying, table_name character varying) TO postgres;
GRANT ALL ON FUNCTION public.dropgeometrytable(schema_name character varying, table_name character varying) TO anon;
GRANT ALL ON FUNCTION public.dropgeometrytable(schema_name character varying, table_name character varying) TO authenticated;
GRANT ALL ON FUNCTION public.dropgeometrytable(schema_name character varying, table_name character varying) TO service_role;


--
-- Name: FUNCTION dropgeometrytable(catalog_name character varying, schema_name character varying, table_name character varying); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.dropgeometrytable(catalog_name character varying, schema_name character varying, table_name character varying) TO postgres;
GRANT ALL ON FUNCTION public.dropgeometrytable(catalog_name character varying, schema_name character varying, table_name character varying) TO anon;
GRANT ALL ON FUNCTION public.dropgeometrytable(catalog_name character varying, schema_name character varying, table_name character varying) TO authenticated;
GRANT ALL ON FUNCTION public.dropgeometrytable(catalog_name character varying, schema_name character varying, table_name character varying) TO service_role;


--
-- Name: FUNCTION enablelongtransactions(); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.enablelongtransactions() TO postgres;
GRANT ALL ON FUNCTION public.enablelongtransactions() TO anon;
GRANT ALL ON FUNCTION public.enablelongtransactions() TO authenticated;
GRANT ALL ON FUNCTION public.enablelongtransactions() TO service_role;


--
-- Name: FUNCTION equals(geom1 public.geometry, geom2 public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.equals(geom1 public.geometry, geom2 public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.equals(geom1 public.geometry, geom2 public.geometry) TO anon;
GRANT ALL ON FUNCTION public.equals(geom1 public.geometry, geom2 public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.equals(geom1 public.geometry, geom2 public.geometry) TO service_role;


--
-- Name: FUNCTION export_user_data(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.export_user_data() TO anon;
GRANT ALL ON FUNCTION public.export_user_data() TO authenticated;
GRANT ALL ON FUNCTION public.export_user_data() TO service_role;


--
-- Name: FUNCTION find_nearby_satsang_seekers(p_lat double precision, p_lon double precision, p_km double precision, p_limit integer); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.find_nearby_satsang_seekers(p_lat double precision, p_lon double precision, p_km double precision, p_limit integer) FROM PUBLIC;
GRANT ALL ON FUNCTION public.find_nearby_satsang_seekers(p_lat double precision, p_lon double precision, p_km double precision, p_limit integer) TO service_role;
GRANT ALL ON FUNCTION public.find_nearby_satsang_seekers(p_lat double precision, p_lon double precision, p_km double precision, p_limit integer) TO authenticated;


--
-- Name: FUNCTION find_or_create_mandali(p_city text, p_country text); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.find_or_create_mandali(p_city text, p_country text) FROM PUBLIC;
GRANT ALL ON FUNCTION public.find_or_create_mandali(p_city text, p_country text) TO service_role;
GRANT ALL ON FUNCTION public.find_or_create_mandali(p_city text, p_country text) TO authenticated;


--
-- Name: FUNCTION find_srid(character varying, character varying, character varying); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.find_srid(character varying, character varying, character varying) TO postgres;
GRANT ALL ON FUNCTION public.find_srid(character varying, character varying, character varying) TO anon;
GRANT ALL ON FUNCTION public.find_srid(character varying, character varying, character varying) TO authenticated;
GRANT ALL ON FUNCTION public.find_srid(character varying, character varying, character varying) TO service_role;


--
-- Name: FUNCTION geog_brin_inclusion_add_value(internal, internal, internal, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.geog_brin_inclusion_add_value(internal, internal, internal, internal) TO postgres;
GRANT ALL ON FUNCTION public.geog_brin_inclusion_add_value(internal, internal, internal, internal) TO anon;
GRANT ALL ON FUNCTION public.geog_brin_inclusion_add_value(internal, internal, internal, internal) TO authenticated;
GRANT ALL ON FUNCTION public.geog_brin_inclusion_add_value(internal, internal, internal, internal) TO service_role;


--
-- Name: FUNCTION geography_cmp(public.geography, public.geography); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.geography_cmp(public.geography, public.geography) TO postgres;
GRANT ALL ON FUNCTION public.geography_cmp(public.geography, public.geography) TO anon;
GRANT ALL ON FUNCTION public.geography_cmp(public.geography, public.geography) TO authenticated;
GRANT ALL ON FUNCTION public.geography_cmp(public.geography, public.geography) TO service_role;


--
-- Name: FUNCTION geography_distance_knn(public.geography, public.geography); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.geography_distance_knn(public.geography, public.geography) TO postgres;
GRANT ALL ON FUNCTION public.geography_distance_knn(public.geography, public.geography) TO anon;
GRANT ALL ON FUNCTION public.geography_distance_knn(public.geography, public.geography) TO authenticated;
GRANT ALL ON FUNCTION public.geography_distance_knn(public.geography, public.geography) TO service_role;


--
-- Name: FUNCTION geography_eq(public.geography, public.geography); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.geography_eq(public.geography, public.geography) TO postgres;
GRANT ALL ON FUNCTION public.geography_eq(public.geography, public.geography) TO anon;
GRANT ALL ON FUNCTION public.geography_eq(public.geography, public.geography) TO authenticated;
GRANT ALL ON FUNCTION public.geography_eq(public.geography, public.geography) TO service_role;


--
-- Name: FUNCTION geography_ge(public.geography, public.geography); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.geography_ge(public.geography, public.geography) TO postgres;
GRANT ALL ON FUNCTION public.geography_ge(public.geography, public.geography) TO anon;
GRANT ALL ON FUNCTION public.geography_ge(public.geography, public.geography) TO authenticated;
GRANT ALL ON FUNCTION public.geography_ge(public.geography, public.geography) TO service_role;


--
-- Name: FUNCTION geography_gist_compress(internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.geography_gist_compress(internal) TO postgres;
GRANT ALL ON FUNCTION public.geography_gist_compress(internal) TO anon;
GRANT ALL ON FUNCTION public.geography_gist_compress(internal) TO authenticated;
GRANT ALL ON FUNCTION public.geography_gist_compress(internal) TO service_role;


--
-- Name: FUNCTION geography_gist_consistent(internal, public.geography, integer); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.geography_gist_consistent(internal, public.geography, integer) TO postgres;
GRANT ALL ON FUNCTION public.geography_gist_consistent(internal, public.geography, integer) TO anon;
GRANT ALL ON FUNCTION public.geography_gist_consistent(internal, public.geography, integer) TO authenticated;
GRANT ALL ON FUNCTION public.geography_gist_consistent(internal, public.geography, integer) TO service_role;


--
-- Name: FUNCTION geography_gist_decompress(internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.geography_gist_decompress(internal) TO postgres;
GRANT ALL ON FUNCTION public.geography_gist_decompress(internal) TO anon;
GRANT ALL ON FUNCTION public.geography_gist_decompress(internal) TO authenticated;
GRANT ALL ON FUNCTION public.geography_gist_decompress(internal) TO service_role;


--
-- Name: FUNCTION geography_gist_distance(internal, public.geography, integer); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.geography_gist_distance(internal, public.geography, integer) TO postgres;
GRANT ALL ON FUNCTION public.geography_gist_distance(internal, public.geography, integer) TO anon;
GRANT ALL ON FUNCTION public.geography_gist_distance(internal, public.geography, integer) TO authenticated;
GRANT ALL ON FUNCTION public.geography_gist_distance(internal, public.geography, integer) TO service_role;


--
-- Name: FUNCTION geography_gist_penalty(internal, internal, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.geography_gist_penalty(internal, internal, internal) TO postgres;
GRANT ALL ON FUNCTION public.geography_gist_penalty(internal, internal, internal) TO anon;
GRANT ALL ON FUNCTION public.geography_gist_penalty(internal, internal, internal) TO authenticated;
GRANT ALL ON FUNCTION public.geography_gist_penalty(internal, internal, internal) TO service_role;


--
-- Name: FUNCTION geography_gist_picksplit(internal, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.geography_gist_picksplit(internal, internal) TO postgres;
GRANT ALL ON FUNCTION public.geography_gist_picksplit(internal, internal) TO anon;
GRANT ALL ON FUNCTION public.geography_gist_picksplit(internal, internal) TO authenticated;
GRANT ALL ON FUNCTION public.geography_gist_picksplit(internal, internal) TO service_role;


--
-- Name: FUNCTION geography_gist_same(public.box2d, public.box2d, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.geography_gist_same(public.box2d, public.box2d, internal) TO postgres;
GRANT ALL ON FUNCTION public.geography_gist_same(public.box2d, public.box2d, internal) TO anon;
GRANT ALL ON FUNCTION public.geography_gist_same(public.box2d, public.box2d, internal) TO authenticated;
GRANT ALL ON FUNCTION public.geography_gist_same(public.box2d, public.box2d, internal) TO service_role;


--
-- Name: FUNCTION geography_gist_union(bytea, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.geography_gist_union(bytea, internal) TO postgres;
GRANT ALL ON FUNCTION public.geography_gist_union(bytea, internal) TO anon;
GRANT ALL ON FUNCTION public.geography_gist_union(bytea, internal) TO authenticated;
GRANT ALL ON FUNCTION public.geography_gist_union(bytea, internal) TO service_role;


--
-- Name: FUNCTION geography_gt(public.geography, public.geography); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.geography_gt(public.geography, public.geography) TO postgres;
GRANT ALL ON FUNCTION public.geography_gt(public.geography, public.geography) TO anon;
GRANT ALL ON FUNCTION public.geography_gt(public.geography, public.geography) TO authenticated;
GRANT ALL ON FUNCTION public.geography_gt(public.geography, public.geography) TO service_role;


--
-- Name: FUNCTION geography_le(public.geography, public.geography); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.geography_le(public.geography, public.geography) TO postgres;
GRANT ALL ON FUNCTION public.geography_le(public.geography, public.geography) TO anon;
GRANT ALL ON FUNCTION public.geography_le(public.geography, public.geography) TO authenticated;
GRANT ALL ON FUNCTION public.geography_le(public.geography, public.geography) TO service_role;


--
-- Name: FUNCTION geography_lt(public.geography, public.geography); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.geography_lt(public.geography, public.geography) TO postgres;
GRANT ALL ON FUNCTION public.geography_lt(public.geography, public.geography) TO anon;
GRANT ALL ON FUNCTION public.geography_lt(public.geography, public.geography) TO authenticated;
GRANT ALL ON FUNCTION public.geography_lt(public.geography, public.geography) TO service_role;


--
-- Name: FUNCTION geography_overlaps(public.geography, public.geography); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.geography_overlaps(public.geography, public.geography) TO postgres;
GRANT ALL ON FUNCTION public.geography_overlaps(public.geography, public.geography) TO anon;
GRANT ALL ON FUNCTION public.geography_overlaps(public.geography, public.geography) TO authenticated;
GRANT ALL ON FUNCTION public.geography_overlaps(public.geography, public.geography) TO service_role;


--
-- Name: FUNCTION geography_spgist_choose_nd(internal, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.geography_spgist_choose_nd(internal, internal) TO postgres;
GRANT ALL ON FUNCTION public.geography_spgist_choose_nd(internal, internal) TO anon;
GRANT ALL ON FUNCTION public.geography_spgist_choose_nd(internal, internal) TO authenticated;
GRANT ALL ON FUNCTION public.geography_spgist_choose_nd(internal, internal) TO service_role;


--
-- Name: FUNCTION geography_spgist_compress_nd(internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.geography_spgist_compress_nd(internal) TO postgres;
GRANT ALL ON FUNCTION public.geography_spgist_compress_nd(internal) TO anon;
GRANT ALL ON FUNCTION public.geography_spgist_compress_nd(internal) TO authenticated;
GRANT ALL ON FUNCTION public.geography_spgist_compress_nd(internal) TO service_role;


--
-- Name: FUNCTION geography_spgist_config_nd(internal, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.geography_spgist_config_nd(internal, internal) TO postgres;
GRANT ALL ON FUNCTION public.geography_spgist_config_nd(internal, internal) TO anon;
GRANT ALL ON FUNCTION public.geography_spgist_config_nd(internal, internal) TO authenticated;
GRANT ALL ON FUNCTION public.geography_spgist_config_nd(internal, internal) TO service_role;


--
-- Name: FUNCTION geography_spgist_inner_consistent_nd(internal, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.geography_spgist_inner_consistent_nd(internal, internal) TO postgres;
GRANT ALL ON FUNCTION public.geography_spgist_inner_consistent_nd(internal, internal) TO anon;
GRANT ALL ON FUNCTION public.geography_spgist_inner_consistent_nd(internal, internal) TO authenticated;
GRANT ALL ON FUNCTION public.geography_spgist_inner_consistent_nd(internal, internal) TO service_role;


--
-- Name: FUNCTION geography_spgist_leaf_consistent_nd(internal, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.geography_spgist_leaf_consistent_nd(internal, internal) TO postgres;
GRANT ALL ON FUNCTION public.geography_spgist_leaf_consistent_nd(internal, internal) TO anon;
GRANT ALL ON FUNCTION public.geography_spgist_leaf_consistent_nd(internal, internal) TO authenticated;
GRANT ALL ON FUNCTION public.geography_spgist_leaf_consistent_nd(internal, internal) TO service_role;


--
-- Name: FUNCTION geography_spgist_picksplit_nd(internal, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.geography_spgist_picksplit_nd(internal, internal) TO postgres;
GRANT ALL ON FUNCTION public.geography_spgist_picksplit_nd(internal, internal) TO anon;
GRANT ALL ON FUNCTION public.geography_spgist_picksplit_nd(internal, internal) TO authenticated;
GRANT ALL ON FUNCTION public.geography_spgist_picksplit_nd(internal, internal) TO service_role;


--
-- Name: FUNCTION geom2d_brin_inclusion_add_value(internal, internal, internal, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.geom2d_brin_inclusion_add_value(internal, internal, internal, internal) TO postgres;
GRANT ALL ON FUNCTION public.geom2d_brin_inclusion_add_value(internal, internal, internal, internal) TO anon;
GRANT ALL ON FUNCTION public.geom2d_brin_inclusion_add_value(internal, internal, internal, internal) TO authenticated;
GRANT ALL ON FUNCTION public.geom2d_brin_inclusion_add_value(internal, internal, internal, internal) TO service_role;


--
-- Name: FUNCTION geom3d_brin_inclusion_add_value(internal, internal, internal, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.geom3d_brin_inclusion_add_value(internal, internal, internal, internal) TO postgres;
GRANT ALL ON FUNCTION public.geom3d_brin_inclusion_add_value(internal, internal, internal, internal) TO anon;
GRANT ALL ON FUNCTION public.geom3d_brin_inclusion_add_value(internal, internal, internal, internal) TO authenticated;
GRANT ALL ON FUNCTION public.geom3d_brin_inclusion_add_value(internal, internal, internal, internal) TO service_role;


--
-- Name: FUNCTION geom4d_brin_inclusion_add_value(internal, internal, internal, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.geom4d_brin_inclusion_add_value(internal, internal, internal, internal) TO postgres;
GRANT ALL ON FUNCTION public.geom4d_brin_inclusion_add_value(internal, internal, internal, internal) TO anon;
GRANT ALL ON FUNCTION public.geom4d_brin_inclusion_add_value(internal, internal, internal, internal) TO authenticated;
GRANT ALL ON FUNCTION public.geom4d_brin_inclusion_add_value(internal, internal, internal, internal) TO service_role;


--
-- Name: FUNCTION geometry_above(geom1 public.geometry, geom2 public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.geometry_above(geom1 public.geometry, geom2 public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.geometry_above(geom1 public.geometry, geom2 public.geometry) TO anon;
GRANT ALL ON FUNCTION public.geometry_above(geom1 public.geometry, geom2 public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.geometry_above(geom1 public.geometry, geom2 public.geometry) TO service_role;


--
-- Name: FUNCTION geometry_below(geom1 public.geometry, geom2 public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.geometry_below(geom1 public.geometry, geom2 public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.geometry_below(geom1 public.geometry, geom2 public.geometry) TO anon;
GRANT ALL ON FUNCTION public.geometry_below(geom1 public.geometry, geom2 public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.geometry_below(geom1 public.geometry, geom2 public.geometry) TO service_role;


--
-- Name: FUNCTION geometry_cmp(geom1 public.geometry, geom2 public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.geometry_cmp(geom1 public.geometry, geom2 public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.geometry_cmp(geom1 public.geometry, geom2 public.geometry) TO anon;
GRANT ALL ON FUNCTION public.geometry_cmp(geom1 public.geometry, geom2 public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.geometry_cmp(geom1 public.geometry, geom2 public.geometry) TO service_role;


--
-- Name: FUNCTION geometry_contained_3d(geom1 public.geometry, geom2 public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.geometry_contained_3d(geom1 public.geometry, geom2 public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.geometry_contained_3d(geom1 public.geometry, geom2 public.geometry) TO anon;
GRANT ALL ON FUNCTION public.geometry_contained_3d(geom1 public.geometry, geom2 public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.geometry_contained_3d(geom1 public.geometry, geom2 public.geometry) TO service_role;


--
-- Name: FUNCTION geometry_contains(geom1 public.geometry, geom2 public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.geometry_contains(geom1 public.geometry, geom2 public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.geometry_contains(geom1 public.geometry, geom2 public.geometry) TO anon;
GRANT ALL ON FUNCTION public.geometry_contains(geom1 public.geometry, geom2 public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.geometry_contains(geom1 public.geometry, geom2 public.geometry) TO service_role;


--
-- Name: FUNCTION geometry_contains_3d(geom1 public.geometry, geom2 public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.geometry_contains_3d(geom1 public.geometry, geom2 public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.geometry_contains_3d(geom1 public.geometry, geom2 public.geometry) TO anon;
GRANT ALL ON FUNCTION public.geometry_contains_3d(geom1 public.geometry, geom2 public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.geometry_contains_3d(geom1 public.geometry, geom2 public.geometry) TO service_role;


--
-- Name: FUNCTION geometry_contains_nd(public.geometry, public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.geometry_contains_nd(public.geometry, public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.geometry_contains_nd(public.geometry, public.geometry) TO anon;
GRANT ALL ON FUNCTION public.geometry_contains_nd(public.geometry, public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.geometry_contains_nd(public.geometry, public.geometry) TO service_role;


--
-- Name: FUNCTION geometry_distance_box(geom1 public.geometry, geom2 public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.geometry_distance_box(geom1 public.geometry, geom2 public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.geometry_distance_box(geom1 public.geometry, geom2 public.geometry) TO anon;
GRANT ALL ON FUNCTION public.geometry_distance_box(geom1 public.geometry, geom2 public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.geometry_distance_box(geom1 public.geometry, geom2 public.geometry) TO service_role;


--
-- Name: FUNCTION geometry_distance_centroid(geom1 public.geometry, geom2 public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.geometry_distance_centroid(geom1 public.geometry, geom2 public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.geometry_distance_centroid(geom1 public.geometry, geom2 public.geometry) TO anon;
GRANT ALL ON FUNCTION public.geometry_distance_centroid(geom1 public.geometry, geom2 public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.geometry_distance_centroid(geom1 public.geometry, geom2 public.geometry) TO service_role;


--
-- Name: FUNCTION geometry_distance_centroid_nd(public.geometry, public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.geometry_distance_centroid_nd(public.geometry, public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.geometry_distance_centroid_nd(public.geometry, public.geometry) TO anon;
GRANT ALL ON FUNCTION public.geometry_distance_centroid_nd(public.geometry, public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.geometry_distance_centroid_nd(public.geometry, public.geometry) TO service_role;


--
-- Name: FUNCTION geometry_distance_cpa(public.geometry, public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.geometry_distance_cpa(public.geometry, public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.geometry_distance_cpa(public.geometry, public.geometry) TO anon;
GRANT ALL ON FUNCTION public.geometry_distance_cpa(public.geometry, public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.geometry_distance_cpa(public.geometry, public.geometry) TO service_role;


--
-- Name: FUNCTION geometry_eq(geom1 public.geometry, geom2 public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.geometry_eq(geom1 public.geometry, geom2 public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.geometry_eq(geom1 public.geometry, geom2 public.geometry) TO anon;
GRANT ALL ON FUNCTION public.geometry_eq(geom1 public.geometry, geom2 public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.geometry_eq(geom1 public.geometry, geom2 public.geometry) TO service_role;


--
-- Name: FUNCTION geometry_ge(geom1 public.geometry, geom2 public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.geometry_ge(geom1 public.geometry, geom2 public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.geometry_ge(geom1 public.geometry, geom2 public.geometry) TO anon;
GRANT ALL ON FUNCTION public.geometry_ge(geom1 public.geometry, geom2 public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.geometry_ge(geom1 public.geometry, geom2 public.geometry) TO service_role;


--
-- Name: FUNCTION geometry_gist_compress_2d(internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.geometry_gist_compress_2d(internal) TO postgres;
GRANT ALL ON FUNCTION public.geometry_gist_compress_2d(internal) TO anon;
GRANT ALL ON FUNCTION public.geometry_gist_compress_2d(internal) TO authenticated;
GRANT ALL ON FUNCTION public.geometry_gist_compress_2d(internal) TO service_role;


--
-- Name: FUNCTION geometry_gist_compress_nd(internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.geometry_gist_compress_nd(internal) TO postgres;
GRANT ALL ON FUNCTION public.geometry_gist_compress_nd(internal) TO anon;
GRANT ALL ON FUNCTION public.geometry_gist_compress_nd(internal) TO authenticated;
GRANT ALL ON FUNCTION public.geometry_gist_compress_nd(internal) TO service_role;


--
-- Name: FUNCTION geometry_gist_consistent_2d(internal, public.geometry, integer); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.geometry_gist_consistent_2d(internal, public.geometry, integer) TO postgres;
GRANT ALL ON FUNCTION public.geometry_gist_consistent_2d(internal, public.geometry, integer) TO anon;
GRANT ALL ON FUNCTION public.geometry_gist_consistent_2d(internal, public.geometry, integer) TO authenticated;
GRANT ALL ON FUNCTION public.geometry_gist_consistent_2d(internal, public.geometry, integer) TO service_role;


--
-- Name: FUNCTION geometry_gist_consistent_nd(internal, public.geometry, integer); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.geometry_gist_consistent_nd(internal, public.geometry, integer) TO postgres;
GRANT ALL ON FUNCTION public.geometry_gist_consistent_nd(internal, public.geometry, integer) TO anon;
GRANT ALL ON FUNCTION public.geometry_gist_consistent_nd(internal, public.geometry, integer) TO authenticated;
GRANT ALL ON FUNCTION public.geometry_gist_consistent_nd(internal, public.geometry, integer) TO service_role;


--
-- Name: FUNCTION geometry_gist_decompress_2d(internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.geometry_gist_decompress_2d(internal) TO postgres;
GRANT ALL ON FUNCTION public.geometry_gist_decompress_2d(internal) TO anon;
GRANT ALL ON FUNCTION public.geometry_gist_decompress_2d(internal) TO authenticated;
GRANT ALL ON FUNCTION public.geometry_gist_decompress_2d(internal) TO service_role;


--
-- Name: FUNCTION geometry_gist_decompress_nd(internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.geometry_gist_decompress_nd(internal) TO postgres;
GRANT ALL ON FUNCTION public.geometry_gist_decompress_nd(internal) TO anon;
GRANT ALL ON FUNCTION public.geometry_gist_decompress_nd(internal) TO authenticated;
GRANT ALL ON FUNCTION public.geometry_gist_decompress_nd(internal) TO service_role;


--
-- Name: FUNCTION geometry_gist_distance_2d(internal, public.geometry, integer); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.geometry_gist_distance_2d(internal, public.geometry, integer) TO postgres;
GRANT ALL ON FUNCTION public.geometry_gist_distance_2d(internal, public.geometry, integer) TO anon;
GRANT ALL ON FUNCTION public.geometry_gist_distance_2d(internal, public.geometry, integer) TO authenticated;
GRANT ALL ON FUNCTION public.geometry_gist_distance_2d(internal, public.geometry, integer) TO service_role;


--
-- Name: FUNCTION geometry_gist_distance_nd(internal, public.geometry, integer); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.geometry_gist_distance_nd(internal, public.geometry, integer) TO postgres;
GRANT ALL ON FUNCTION public.geometry_gist_distance_nd(internal, public.geometry, integer) TO anon;
GRANT ALL ON FUNCTION public.geometry_gist_distance_nd(internal, public.geometry, integer) TO authenticated;
GRANT ALL ON FUNCTION public.geometry_gist_distance_nd(internal, public.geometry, integer) TO service_role;


--
-- Name: FUNCTION geometry_gist_penalty_2d(internal, internal, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.geometry_gist_penalty_2d(internal, internal, internal) TO postgres;
GRANT ALL ON FUNCTION public.geometry_gist_penalty_2d(internal, internal, internal) TO anon;
GRANT ALL ON FUNCTION public.geometry_gist_penalty_2d(internal, internal, internal) TO authenticated;
GRANT ALL ON FUNCTION public.geometry_gist_penalty_2d(internal, internal, internal) TO service_role;


--
-- Name: FUNCTION geometry_gist_penalty_nd(internal, internal, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.geometry_gist_penalty_nd(internal, internal, internal) TO postgres;
GRANT ALL ON FUNCTION public.geometry_gist_penalty_nd(internal, internal, internal) TO anon;
GRANT ALL ON FUNCTION public.geometry_gist_penalty_nd(internal, internal, internal) TO authenticated;
GRANT ALL ON FUNCTION public.geometry_gist_penalty_nd(internal, internal, internal) TO service_role;


--
-- Name: FUNCTION geometry_gist_picksplit_2d(internal, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.geometry_gist_picksplit_2d(internal, internal) TO postgres;
GRANT ALL ON FUNCTION public.geometry_gist_picksplit_2d(internal, internal) TO anon;
GRANT ALL ON FUNCTION public.geometry_gist_picksplit_2d(internal, internal) TO authenticated;
GRANT ALL ON FUNCTION public.geometry_gist_picksplit_2d(internal, internal) TO service_role;


--
-- Name: FUNCTION geometry_gist_picksplit_nd(internal, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.geometry_gist_picksplit_nd(internal, internal) TO postgres;
GRANT ALL ON FUNCTION public.geometry_gist_picksplit_nd(internal, internal) TO anon;
GRANT ALL ON FUNCTION public.geometry_gist_picksplit_nd(internal, internal) TO authenticated;
GRANT ALL ON FUNCTION public.geometry_gist_picksplit_nd(internal, internal) TO service_role;


--
-- Name: FUNCTION geometry_gist_same_2d(geom1 public.geometry, geom2 public.geometry, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.geometry_gist_same_2d(geom1 public.geometry, geom2 public.geometry, internal) TO postgres;
GRANT ALL ON FUNCTION public.geometry_gist_same_2d(geom1 public.geometry, geom2 public.geometry, internal) TO anon;
GRANT ALL ON FUNCTION public.geometry_gist_same_2d(geom1 public.geometry, geom2 public.geometry, internal) TO authenticated;
GRANT ALL ON FUNCTION public.geometry_gist_same_2d(geom1 public.geometry, geom2 public.geometry, internal) TO service_role;


--
-- Name: FUNCTION geometry_gist_same_nd(public.geometry, public.geometry, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.geometry_gist_same_nd(public.geometry, public.geometry, internal) TO postgres;
GRANT ALL ON FUNCTION public.geometry_gist_same_nd(public.geometry, public.geometry, internal) TO anon;
GRANT ALL ON FUNCTION public.geometry_gist_same_nd(public.geometry, public.geometry, internal) TO authenticated;
GRANT ALL ON FUNCTION public.geometry_gist_same_nd(public.geometry, public.geometry, internal) TO service_role;


--
-- Name: FUNCTION geometry_gist_sortsupport_2d(internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.geometry_gist_sortsupport_2d(internal) TO postgres;
GRANT ALL ON FUNCTION public.geometry_gist_sortsupport_2d(internal) TO anon;
GRANT ALL ON FUNCTION public.geometry_gist_sortsupport_2d(internal) TO authenticated;
GRANT ALL ON FUNCTION public.geometry_gist_sortsupport_2d(internal) TO service_role;


--
-- Name: FUNCTION geometry_gist_union_2d(bytea, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.geometry_gist_union_2d(bytea, internal) TO postgres;
GRANT ALL ON FUNCTION public.geometry_gist_union_2d(bytea, internal) TO anon;
GRANT ALL ON FUNCTION public.geometry_gist_union_2d(bytea, internal) TO authenticated;
GRANT ALL ON FUNCTION public.geometry_gist_union_2d(bytea, internal) TO service_role;


--
-- Name: FUNCTION geometry_gist_union_nd(bytea, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.geometry_gist_union_nd(bytea, internal) TO postgres;
GRANT ALL ON FUNCTION public.geometry_gist_union_nd(bytea, internal) TO anon;
GRANT ALL ON FUNCTION public.geometry_gist_union_nd(bytea, internal) TO authenticated;
GRANT ALL ON FUNCTION public.geometry_gist_union_nd(bytea, internal) TO service_role;


--
-- Name: FUNCTION geometry_gt(geom1 public.geometry, geom2 public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.geometry_gt(geom1 public.geometry, geom2 public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.geometry_gt(geom1 public.geometry, geom2 public.geometry) TO anon;
GRANT ALL ON FUNCTION public.geometry_gt(geom1 public.geometry, geom2 public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.geometry_gt(geom1 public.geometry, geom2 public.geometry) TO service_role;


--
-- Name: FUNCTION geometry_hash(public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.geometry_hash(public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.geometry_hash(public.geometry) TO anon;
GRANT ALL ON FUNCTION public.geometry_hash(public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.geometry_hash(public.geometry) TO service_role;


--
-- Name: FUNCTION geometry_le(geom1 public.geometry, geom2 public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.geometry_le(geom1 public.geometry, geom2 public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.geometry_le(geom1 public.geometry, geom2 public.geometry) TO anon;
GRANT ALL ON FUNCTION public.geometry_le(geom1 public.geometry, geom2 public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.geometry_le(geom1 public.geometry, geom2 public.geometry) TO service_role;


--
-- Name: FUNCTION geometry_left(geom1 public.geometry, geom2 public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.geometry_left(geom1 public.geometry, geom2 public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.geometry_left(geom1 public.geometry, geom2 public.geometry) TO anon;
GRANT ALL ON FUNCTION public.geometry_left(geom1 public.geometry, geom2 public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.geometry_left(geom1 public.geometry, geom2 public.geometry) TO service_role;


--
-- Name: FUNCTION geometry_lt(geom1 public.geometry, geom2 public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.geometry_lt(geom1 public.geometry, geom2 public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.geometry_lt(geom1 public.geometry, geom2 public.geometry) TO anon;
GRANT ALL ON FUNCTION public.geometry_lt(geom1 public.geometry, geom2 public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.geometry_lt(geom1 public.geometry, geom2 public.geometry) TO service_role;


--
-- Name: FUNCTION geometry_overabove(geom1 public.geometry, geom2 public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.geometry_overabove(geom1 public.geometry, geom2 public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.geometry_overabove(geom1 public.geometry, geom2 public.geometry) TO anon;
GRANT ALL ON FUNCTION public.geometry_overabove(geom1 public.geometry, geom2 public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.geometry_overabove(geom1 public.geometry, geom2 public.geometry) TO service_role;


--
-- Name: FUNCTION geometry_overbelow(geom1 public.geometry, geom2 public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.geometry_overbelow(geom1 public.geometry, geom2 public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.geometry_overbelow(geom1 public.geometry, geom2 public.geometry) TO anon;
GRANT ALL ON FUNCTION public.geometry_overbelow(geom1 public.geometry, geom2 public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.geometry_overbelow(geom1 public.geometry, geom2 public.geometry) TO service_role;


--
-- Name: FUNCTION geometry_overlaps(geom1 public.geometry, geom2 public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.geometry_overlaps(geom1 public.geometry, geom2 public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.geometry_overlaps(geom1 public.geometry, geom2 public.geometry) TO anon;
GRANT ALL ON FUNCTION public.geometry_overlaps(geom1 public.geometry, geom2 public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.geometry_overlaps(geom1 public.geometry, geom2 public.geometry) TO service_role;


--
-- Name: FUNCTION geometry_overlaps_3d(geom1 public.geometry, geom2 public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.geometry_overlaps_3d(geom1 public.geometry, geom2 public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.geometry_overlaps_3d(geom1 public.geometry, geom2 public.geometry) TO anon;
GRANT ALL ON FUNCTION public.geometry_overlaps_3d(geom1 public.geometry, geom2 public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.geometry_overlaps_3d(geom1 public.geometry, geom2 public.geometry) TO service_role;


--
-- Name: FUNCTION geometry_overlaps_nd(public.geometry, public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.geometry_overlaps_nd(public.geometry, public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.geometry_overlaps_nd(public.geometry, public.geometry) TO anon;
GRANT ALL ON FUNCTION public.geometry_overlaps_nd(public.geometry, public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.geometry_overlaps_nd(public.geometry, public.geometry) TO service_role;


--
-- Name: FUNCTION geometry_overleft(geom1 public.geometry, geom2 public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.geometry_overleft(geom1 public.geometry, geom2 public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.geometry_overleft(geom1 public.geometry, geom2 public.geometry) TO anon;
GRANT ALL ON FUNCTION public.geometry_overleft(geom1 public.geometry, geom2 public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.geometry_overleft(geom1 public.geometry, geom2 public.geometry) TO service_role;


--
-- Name: FUNCTION geometry_overright(geom1 public.geometry, geom2 public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.geometry_overright(geom1 public.geometry, geom2 public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.geometry_overright(geom1 public.geometry, geom2 public.geometry) TO anon;
GRANT ALL ON FUNCTION public.geometry_overright(geom1 public.geometry, geom2 public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.geometry_overright(geom1 public.geometry, geom2 public.geometry) TO service_role;


--
-- Name: FUNCTION geometry_right(geom1 public.geometry, geom2 public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.geometry_right(geom1 public.geometry, geom2 public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.geometry_right(geom1 public.geometry, geom2 public.geometry) TO anon;
GRANT ALL ON FUNCTION public.geometry_right(geom1 public.geometry, geom2 public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.geometry_right(geom1 public.geometry, geom2 public.geometry) TO service_role;


--
-- Name: FUNCTION geometry_same(geom1 public.geometry, geom2 public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.geometry_same(geom1 public.geometry, geom2 public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.geometry_same(geom1 public.geometry, geom2 public.geometry) TO anon;
GRANT ALL ON FUNCTION public.geometry_same(geom1 public.geometry, geom2 public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.geometry_same(geom1 public.geometry, geom2 public.geometry) TO service_role;


--
-- Name: FUNCTION geometry_same_3d(geom1 public.geometry, geom2 public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.geometry_same_3d(geom1 public.geometry, geom2 public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.geometry_same_3d(geom1 public.geometry, geom2 public.geometry) TO anon;
GRANT ALL ON FUNCTION public.geometry_same_3d(geom1 public.geometry, geom2 public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.geometry_same_3d(geom1 public.geometry, geom2 public.geometry) TO service_role;


--
-- Name: FUNCTION geometry_same_nd(public.geometry, public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.geometry_same_nd(public.geometry, public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.geometry_same_nd(public.geometry, public.geometry) TO anon;
GRANT ALL ON FUNCTION public.geometry_same_nd(public.geometry, public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.geometry_same_nd(public.geometry, public.geometry) TO service_role;


--
-- Name: FUNCTION geometry_sortsupport(internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.geometry_sortsupport(internal) TO postgres;
GRANT ALL ON FUNCTION public.geometry_sortsupport(internal) TO anon;
GRANT ALL ON FUNCTION public.geometry_sortsupport(internal) TO authenticated;
GRANT ALL ON FUNCTION public.geometry_sortsupport(internal) TO service_role;


--
-- Name: FUNCTION geometry_spgist_choose_2d(internal, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.geometry_spgist_choose_2d(internal, internal) TO postgres;
GRANT ALL ON FUNCTION public.geometry_spgist_choose_2d(internal, internal) TO anon;
GRANT ALL ON FUNCTION public.geometry_spgist_choose_2d(internal, internal) TO authenticated;
GRANT ALL ON FUNCTION public.geometry_spgist_choose_2d(internal, internal) TO service_role;


--
-- Name: FUNCTION geometry_spgist_choose_3d(internal, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.geometry_spgist_choose_3d(internal, internal) TO postgres;
GRANT ALL ON FUNCTION public.geometry_spgist_choose_3d(internal, internal) TO anon;
GRANT ALL ON FUNCTION public.geometry_spgist_choose_3d(internal, internal) TO authenticated;
GRANT ALL ON FUNCTION public.geometry_spgist_choose_3d(internal, internal) TO service_role;


--
-- Name: FUNCTION geometry_spgist_choose_nd(internal, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.geometry_spgist_choose_nd(internal, internal) TO postgres;
GRANT ALL ON FUNCTION public.geometry_spgist_choose_nd(internal, internal) TO anon;
GRANT ALL ON FUNCTION public.geometry_spgist_choose_nd(internal, internal) TO authenticated;
GRANT ALL ON FUNCTION public.geometry_spgist_choose_nd(internal, internal) TO service_role;


--
-- Name: FUNCTION geometry_spgist_compress_2d(internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.geometry_spgist_compress_2d(internal) TO postgres;
GRANT ALL ON FUNCTION public.geometry_spgist_compress_2d(internal) TO anon;
GRANT ALL ON FUNCTION public.geometry_spgist_compress_2d(internal) TO authenticated;
GRANT ALL ON FUNCTION public.geometry_spgist_compress_2d(internal) TO service_role;


--
-- Name: FUNCTION geometry_spgist_compress_3d(internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.geometry_spgist_compress_3d(internal) TO postgres;
GRANT ALL ON FUNCTION public.geometry_spgist_compress_3d(internal) TO anon;
GRANT ALL ON FUNCTION public.geometry_spgist_compress_3d(internal) TO authenticated;
GRANT ALL ON FUNCTION public.geometry_spgist_compress_3d(internal) TO service_role;


--
-- Name: FUNCTION geometry_spgist_compress_nd(internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.geometry_spgist_compress_nd(internal) TO postgres;
GRANT ALL ON FUNCTION public.geometry_spgist_compress_nd(internal) TO anon;
GRANT ALL ON FUNCTION public.geometry_spgist_compress_nd(internal) TO authenticated;
GRANT ALL ON FUNCTION public.geometry_spgist_compress_nd(internal) TO service_role;


--
-- Name: FUNCTION geometry_spgist_config_2d(internal, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.geometry_spgist_config_2d(internal, internal) TO postgres;
GRANT ALL ON FUNCTION public.geometry_spgist_config_2d(internal, internal) TO anon;
GRANT ALL ON FUNCTION public.geometry_spgist_config_2d(internal, internal) TO authenticated;
GRANT ALL ON FUNCTION public.geometry_spgist_config_2d(internal, internal) TO service_role;


--
-- Name: FUNCTION geometry_spgist_config_3d(internal, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.geometry_spgist_config_3d(internal, internal) TO postgres;
GRANT ALL ON FUNCTION public.geometry_spgist_config_3d(internal, internal) TO anon;
GRANT ALL ON FUNCTION public.geometry_spgist_config_3d(internal, internal) TO authenticated;
GRANT ALL ON FUNCTION public.geometry_spgist_config_3d(internal, internal) TO service_role;


--
-- Name: FUNCTION geometry_spgist_config_nd(internal, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.geometry_spgist_config_nd(internal, internal) TO postgres;
GRANT ALL ON FUNCTION public.geometry_spgist_config_nd(internal, internal) TO anon;
GRANT ALL ON FUNCTION public.geometry_spgist_config_nd(internal, internal) TO authenticated;
GRANT ALL ON FUNCTION public.geometry_spgist_config_nd(internal, internal) TO service_role;


--
-- Name: FUNCTION geometry_spgist_inner_consistent_2d(internal, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.geometry_spgist_inner_consistent_2d(internal, internal) TO postgres;
GRANT ALL ON FUNCTION public.geometry_spgist_inner_consistent_2d(internal, internal) TO anon;
GRANT ALL ON FUNCTION public.geometry_spgist_inner_consistent_2d(internal, internal) TO authenticated;
GRANT ALL ON FUNCTION public.geometry_spgist_inner_consistent_2d(internal, internal) TO service_role;


--
-- Name: FUNCTION geometry_spgist_inner_consistent_3d(internal, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.geometry_spgist_inner_consistent_3d(internal, internal) TO postgres;
GRANT ALL ON FUNCTION public.geometry_spgist_inner_consistent_3d(internal, internal) TO anon;
GRANT ALL ON FUNCTION public.geometry_spgist_inner_consistent_3d(internal, internal) TO authenticated;
GRANT ALL ON FUNCTION public.geometry_spgist_inner_consistent_3d(internal, internal) TO service_role;


--
-- Name: FUNCTION geometry_spgist_inner_consistent_nd(internal, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.geometry_spgist_inner_consistent_nd(internal, internal) TO postgres;
GRANT ALL ON FUNCTION public.geometry_spgist_inner_consistent_nd(internal, internal) TO anon;
GRANT ALL ON FUNCTION public.geometry_spgist_inner_consistent_nd(internal, internal) TO authenticated;
GRANT ALL ON FUNCTION public.geometry_spgist_inner_consistent_nd(internal, internal) TO service_role;


--
-- Name: FUNCTION geometry_spgist_leaf_consistent_2d(internal, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.geometry_spgist_leaf_consistent_2d(internal, internal) TO postgres;
GRANT ALL ON FUNCTION public.geometry_spgist_leaf_consistent_2d(internal, internal) TO anon;
GRANT ALL ON FUNCTION public.geometry_spgist_leaf_consistent_2d(internal, internal) TO authenticated;
GRANT ALL ON FUNCTION public.geometry_spgist_leaf_consistent_2d(internal, internal) TO service_role;


--
-- Name: FUNCTION geometry_spgist_leaf_consistent_3d(internal, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.geometry_spgist_leaf_consistent_3d(internal, internal) TO postgres;
GRANT ALL ON FUNCTION public.geometry_spgist_leaf_consistent_3d(internal, internal) TO anon;
GRANT ALL ON FUNCTION public.geometry_spgist_leaf_consistent_3d(internal, internal) TO authenticated;
GRANT ALL ON FUNCTION public.geometry_spgist_leaf_consistent_3d(internal, internal) TO service_role;


--
-- Name: FUNCTION geometry_spgist_leaf_consistent_nd(internal, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.geometry_spgist_leaf_consistent_nd(internal, internal) TO postgres;
GRANT ALL ON FUNCTION public.geometry_spgist_leaf_consistent_nd(internal, internal) TO anon;
GRANT ALL ON FUNCTION public.geometry_spgist_leaf_consistent_nd(internal, internal) TO authenticated;
GRANT ALL ON FUNCTION public.geometry_spgist_leaf_consistent_nd(internal, internal) TO service_role;


--
-- Name: FUNCTION geometry_spgist_picksplit_2d(internal, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.geometry_spgist_picksplit_2d(internal, internal) TO postgres;
GRANT ALL ON FUNCTION public.geometry_spgist_picksplit_2d(internal, internal) TO anon;
GRANT ALL ON FUNCTION public.geometry_spgist_picksplit_2d(internal, internal) TO authenticated;
GRANT ALL ON FUNCTION public.geometry_spgist_picksplit_2d(internal, internal) TO service_role;


--
-- Name: FUNCTION geometry_spgist_picksplit_3d(internal, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.geometry_spgist_picksplit_3d(internal, internal) TO postgres;
GRANT ALL ON FUNCTION public.geometry_spgist_picksplit_3d(internal, internal) TO anon;
GRANT ALL ON FUNCTION public.geometry_spgist_picksplit_3d(internal, internal) TO authenticated;
GRANT ALL ON FUNCTION public.geometry_spgist_picksplit_3d(internal, internal) TO service_role;


--
-- Name: FUNCTION geometry_spgist_picksplit_nd(internal, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.geometry_spgist_picksplit_nd(internal, internal) TO postgres;
GRANT ALL ON FUNCTION public.geometry_spgist_picksplit_nd(internal, internal) TO anon;
GRANT ALL ON FUNCTION public.geometry_spgist_picksplit_nd(internal, internal) TO authenticated;
GRANT ALL ON FUNCTION public.geometry_spgist_picksplit_nd(internal, internal) TO service_role;


--
-- Name: FUNCTION geometry_within(geom1 public.geometry, geom2 public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.geometry_within(geom1 public.geometry, geom2 public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.geometry_within(geom1 public.geometry, geom2 public.geometry) TO anon;
GRANT ALL ON FUNCTION public.geometry_within(geom1 public.geometry, geom2 public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.geometry_within(geom1 public.geometry, geom2 public.geometry) TO service_role;


--
-- Name: FUNCTION geometry_within_nd(public.geometry, public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.geometry_within_nd(public.geometry, public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.geometry_within_nd(public.geometry, public.geometry) TO anon;
GRANT ALL ON FUNCTION public.geometry_within_nd(public.geometry, public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.geometry_within_nd(public.geometry, public.geometry) TO service_role;


--
-- Name: FUNCTION geometrytype(public.geography); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.geometrytype(public.geography) TO postgres;
GRANT ALL ON FUNCTION public.geometrytype(public.geography) TO anon;
GRANT ALL ON FUNCTION public.geometrytype(public.geography) TO authenticated;
GRANT ALL ON FUNCTION public.geometrytype(public.geography) TO service_role;


--
-- Name: FUNCTION geometrytype(public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.geometrytype(public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.geometrytype(public.geometry) TO anon;
GRANT ALL ON FUNCTION public.geometrytype(public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.geometrytype(public.geometry) TO service_role;


--
-- Name: FUNCTION geomfromewkb(bytea); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.geomfromewkb(bytea) TO postgres;
GRANT ALL ON FUNCTION public.geomfromewkb(bytea) TO anon;
GRANT ALL ON FUNCTION public.geomfromewkb(bytea) TO authenticated;
GRANT ALL ON FUNCTION public.geomfromewkb(bytea) TO service_role;


--
-- Name: FUNCTION geomfromewkt(text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.geomfromewkt(text) TO postgres;
GRANT ALL ON FUNCTION public.geomfromewkt(text) TO anon;
GRANT ALL ON FUNCTION public.geomfromewkt(text) TO authenticated;
GRANT ALL ON FUNCTION public.geomfromewkt(text) TO service_role;


--
-- Name: FUNCTION get_proj4_from_srid(integer); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.get_proj4_from_srid(integer) TO postgres;
GRANT ALL ON FUNCTION public.get_proj4_from_srid(integer) TO anon;
GRANT ALL ON FUNCTION public.get_proj4_from_srid(integer) TO authenticated;
GRANT ALL ON FUNCTION public.get_proj4_from_srid(integer) TO service_role;


--
-- Name: FUNCTION gettransactionid(); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gettransactionid() TO postgres;
GRANT ALL ON FUNCTION public.gettransactionid() TO anon;
GRANT ALL ON FUNCTION public.gettransactionid() TO authenticated;
GRANT ALL ON FUNCTION public.gettransactionid() TO service_role;


--
-- Name: FUNCTION gserialized_gist_joinsel_2d(internal, oid, internal, smallint); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gserialized_gist_joinsel_2d(internal, oid, internal, smallint) TO postgres;
GRANT ALL ON FUNCTION public.gserialized_gist_joinsel_2d(internal, oid, internal, smallint) TO anon;
GRANT ALL ON FUNCTION public.gserialized_gist_joinsel_2d(internal, oid, internal, smallint) TO authenticated;
GRANT ALL ON FUNCTION public.gserialized_gist_joinsel_2d(internal, oid, internal, smallint) TO service_role;


--
-- Name: FUNCTION gserialized_gist_joinsel_nd(internal, oid, internal, smallint); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gserialized_gist_joinsel_nd(internal, oid, internal, smallint) TO postgres;
GRANT ALL ON FUNCTION public.gserialized_gist_joinsel_nd(internal, oid, internal, smallint) TO anon;
GRANT ALL ON FUNCTION public.gserialized_gist_joinsel_nd(internal, oid, internal, smallint) TO authenticated;
GRANT ALL ON FUNCTION public.gserialized_gist_joinsel_nd(internal, oid, internal, smallint) TO service_role;


--
-- Name: FUNCTION gserialized_gist_sel_2d(internal, oid, internal, integer); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gserialized_gist_sel_2d(internal, oid, internal, integer) TO postgres;
GRANT ALL ON FUNCTION public.gserialized_gist_sel_2d(internal, oid, internal, integer) TO anon;
GRANT ALL ON FUNCTION public.gserialized_gist_sel_2d(internal, oid, internal, integer) TO authenticated;
GRANT ALL ON FUNCTION public.gserialized_gist_sel_2d(internal, oid, internal, integer) TO service_role;


--
-- Name: FUNCTION gserialized_gist_sel_nd(internal, oid, internal, integer); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gserialized_gist_sel_nd(internal, oid, internal, integer) TO postgres;
GRANT ALL ON FUNCTION public.gserialized_gist_sel_nd(internal, oid, internal, integer) TO anon;
GRANT ALL ON FUNCTION public.gserialized_gist_sel_nd(internal, oid, internal, integer) TO authenticated;
GRANT ALL ON FUNCTION public.gserialized_gist_sel_nd(internal, oid, internal, integer) TO service_role;


--
-- Name: FUNCTION halfvec_accum(double precision[], public.halfvec); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.halfvec_accum(double precision[], public.halfvec) TO postgres;
GRANT ALL ON FUNCTION public.halfvec_accum(double precision[], public.halfvec) TO anon;
GRANT ALL ON FUNCTION public.halfvec_accum(double precision[], public.halfvec) TO authenticated;
GRANT ALL ON FUNCTION public.halfvec_accum(double precision[], public.halfvec) TO service_role;


--
-- Name: FUNCTION halfvec_add(public.halfvec, public.halfvec); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.halfvec_add(public.halfvec, public.halfvec) TO postgres;
GRANT ALL ON FUNCTION public.halfvec_add(public.halfvec, public.halfvec) TO anon;
GRANT ALL ON FUNCTION public.halfvec_add(public.halfvec, public.halfvec) TO authenticated;
GRANT ALL ON FUNCTION public.halfvec_add(public.halfvec, public.halfvec) TO service_role;


--
-- Name: FUNCTION halfvec_avg(double precision[]); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.halfvec_avg(double precision[]) TO postgres;
GRANT ALL ON FUNCTION public.halfvec_avg(double precision[]) TO anon;
GRANT ALL ON FUNCTION public.halfvec_avg(double precision[]) TO authenticated;
GRANT ALL ON FUNCTION public.halfvec_avg(double precision[]) TO service_role;


--
-- Name: FUNCTION halfvec_cmp(public.halfvec, public.halfvec); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.halfvec_cmp(public.halfvec, public.halfvec) TO postgres;
GRANT ALL ON FUNCTION public.halfvec_cmp(public.halfvec, public.halfvec) TO anon;
GRANT ALL ON FUNCTION public.halfvec_cmp(public.halfvec, public.halfvec) TO authenticated;
GRANT ALL ON FUNCTION public.halfvec_cmp(public.halfvec, public.halfvec) TO service_role;


--
-- Name: FUNCTION halfvec_combine(double precision[], double precision[]); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.halfvec_combine(double precision[], double precision[]) TO postgres;
GRANT ALL ON FUNCTION public.halfvec_combine(double precision[], double precision[]) TO anon;
GRANT ALL ON FUNCTION public.halfvec_combine(double precision[], double precision[]) TO authenticated;
GRANT ALL ON FUNCTION public.halfvec_combine(double precision[], double precision[]) TO service_role;


--
-- Name: FUNCTION halfvec_concat(public.halfvec, public.halfvec); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.halfvec_concat(public.halfvec, public.halfvec) TO postgres;
GRANT ALL ON FUNCTION public.halfvec_concat(public.halfvec, public.halfvec) TO anon;
GRANT ALL ON FUNCTION public.halfvec_concat(public.halfvec, public.halfvec) TO authenticated;
GRANT ALL ON FUNCTION public.halfvec_concat(public.halfvec, public.halfvec) TO service_role;


--
-- Name: FUNCTION halfvec_eq(public.halfvec, public.halfvec); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.halfvec_eq(public.halfvec, public.halfvec) TO postgres;
GRANT ALL ON FUNCTION public.halfvec_eq(public.halfvec, public.halfvec) TO anon;
GRANT ALL ON FUNCTION public.halfvec_eq(public.halfvec, public.halfvec) TO authenticated;
GRANT ALL ON FUNCTION public.halfvec_eq(public.halfvec, public.halfvec) TO service_role;


--
-- Name: FUNCTION halfvec_ge(public.halfvec, public.halfvec); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.halfvec_ge(public.halfvec, public.halfvec) TO postgres;
GRANT ALL ON FUNCTION public.halfvec_ge(public.halfvec, public.halfvec) TO anon;
GRANT ALL ON FUNCTION public.halfvec_ge(public.halfvec, public.halfvec) TO authenticated;
GRANT ALL ON FUNCTION public.halfvec_ge(public.halfvec, public.halfvec) TO service_role;


--
-- Name: FUNCTION halfvec_gt(public.halfvec, public.halfvec); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.halfvec_gt(public.halfvec, public.halfvec) TO postgres;
GRANT ALL ON FUNCTION public.halfvec_gt(public.halfvec, public.halfvec) TO anon;
GRANT ALL ON FUNCTION public.halfvec_gt(public.halfvec, public.halfvec) TO authenticated;
GRANT ALL ON FUNCTION public.halfvec_gt(public.halfvec, public.halfvec) TO service_role;


--
-- Name: FUNCTION halfvec_l2_squared_distance(public.halfvec, public.halfvec); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.halfvec_l2_squared_distance(public.halfvec, public.halfvec) TO postgres;
GRANT ALL ON FUNCTION public.halfvec_l2_squared_distance(public.halfvec, public.halfvec) TO anon;
GRANT ALL ON FUNCTION public.halfvec_l2_squared_distance(public.halfvec, public.halfvec) TO authenticated;
GRANT ALL ON FUNCTION public.halfvec_l2_squared_distance(public.halfvec, public.halfvec) TO service_role;


--
-- Name: FUNCTION halfvec_le(public.halfvec, public.halfvec); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.halfvec_le(public.halfvec, public.halfvec) TO postgres;
GRANT ALL ON FUNCTION public.halfvec_le(public.halfvec, public.halfvec) TO anon;
GRANT ALL ON FUNCTION public.halfvec_le(public.halfvec, public.halfvec) TO authenticated;
GRANT ALL ON FUNCTION public.halfvec_le(public.halfvec, public.halfvec) TO service_role;


--
-- Name: FUNCTION halfvec_lt(public.halfvec, public.halfvec); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.halfvec_lt(public.halfvec, public.halfvec) TO postgres;
GRANT ALL ON FUNCTION public.halfvec_lt(public.halfvec, public.halfvec) TO anon;
GRANT ALL ON FUNCTION public.halfvec_lt(public.halfvec, public.halfvec) TO authenticated;
GRANT ALL ON FUNCTION public.halfvec_lt(public.halfvec, public.halfvec) TO service_role;


--
-- Name: FUNCTION halfvec_mul(public.halfvec, public.halfvec); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.halfvec_mul(public.halfvec, public.halfvec) TO postgres;
GRANT ALL ON FUNCTION public.halfvec_mul(public.halfvec, public.halfvec) TO anon;
GRANT ALL ON FUNCTION public.halfvec_mul(public.halfvec, public.halfvec) TO authenticated;
GRANT ALL ON FUNCTION public.halfvec_mul(public.halfvec, public.halfvec) TO service_role;


--
-- Name: FUNCTION halfvec_ne(public.halfvec, public.halfvec); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.halfvec_ne(public.halfvec, public.halfvec) TO postgres;
GRANT ALL ON FUNCTION public.halfvec_ne(public.halfvec, public.halfvec) TO anon;
GRANT ALL ON FUNCTION public.halfvec_ne(public.halfvec, public.halfvec) TO authenticated;
GRANT ALL ON FUNCTION public.halfvec_ne(public.halfvec, public.halfvec) TO service_role;


--
-- Name: FUNCTION halfvec_negative_inner_product(public.halfvec, public.halfvec); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.halfvec_negative_inner_product(public.halfvec, public.halfvec) TO postgres;
GRANT ALL ON FUNCTION public.halfvec_negative_inner_product(public.halfvec, public.halfvec) TO anon;
GRANT ALL ON FUNCTION public.halfvec_negative_inner_product(public.halfvec, public.halfvec) TO authenticated;
GRANT ALL ON FUNCTION public.halfvec_negative_inner_product(public.halfvec, public.halfvec) TO service_role;


--
-- Name: FUNCTION halfvec_spherical_distance(public.halfvec, public.halfvec); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.halfvec_spherical_distance(public.halfvec, public.halfvec) TO postgres;
GRANT ALL ON FUNCTION public.halfvec_spherical_distance(public.halfvec, public.halfvec) TO anon;
GRANT ALL ON FUNCTION public.halfvec_spherical_distance(public.halfvec, public.halfvec) TO authenticated;
GRANT ALL ON FUNCTION public.halfvec_spherical_distance(public.halfvec, public.halfvec) TO service_role;


--
-- Name: FUNCTION halfvec_sub(public.halfvec, public.halfvec); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.halfvec_sub(public.halfvec, public.halfvec) TO postgres;
GRANT ALL ON FUNCTION public.halfvec_sub(public.halfvec, public.halfvec) TO anon;
GRANT ALL ON FUNCTION public.halfvec_sub(public.halfvec, public.halfvec) TO authenticated;
GRANT ALL ON FUNCTION public.halfvec_sub(public.halfvec, public.halfvec) TO service_role;


--
-- Name: FUNCTION hamming_distance(bit, bit); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.hamming_distance(bit, bit) TO postgres;
GRANT ALL ON FUNCTION public.hamming_distance(bit, bit) TO anon;
GRANT ALL ON FUNCTION public.hamming_distance(bit, bit) TO authenticated;
GRANT ALL ON FUNCTION public.hamming_distance(bit, bit) TO service_role;


--
-- Name: FUNCTION handle_new_user(); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;
GRANT ALL ON FUNCTION public.handle_new_user() TO service_role;


--
-- Name: FUNCTION handle_updated_at(); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.handle_updated_at() FROM PUBLIC;
GRANT ALL ON FUNCTION public.handle_updated_at() TO service_role;


--
-- Name: FUNCTION hnsw_bit_support(internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.hnsw_bit_support(internal) TO postgres;
GRANT ALL ON FUNCTION public.hnsw_bit_support(internal) TO anon;
GRANT ALL ON FUNCTION public.hnsw_bit_support(internal) TO authenticated;
GRANT ALL ON FUNCTION public.hnsw_bit_support(internal) TO service_role;


--
-- Name: FUNCTION hnsw_halfvec_support(internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.hnsw_halfvec_support(internal) TO postgres;
GRANT ALL ON FUNCTION public.hnsw_halfvec_support(internal) TO anon;
GRANT ALL ON FUNCTION public.hnsw_halfvec_support(internal) TO authenticated;
GRANT ALL ON FUNCTION public.hnsw_halfvec_support(internal) TO service_role;


--
-- Name: FUNCTION hnsw_sparsevec_support(internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.hnsw_sparsevec_support(internal) TO postgres;
GRANT ALL ON FUNCTION public.hnsw_sparsevec_support(internal) TO anon;
GRANT ALL ON FUNCTION public.hnsw_sparsevec_support(internal) TO authenticated;
GRANT ALL ON FUNCTION public.hnsw_sparsevec_support(internal) TO service_role;


--
-- Name: FUNCTION hnswhandler(internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.hnswhandler(internal) TO postgres;
GRANT ALL ON FUNCTION public.hnswhandler(internal) TO anon;
GRANT ALL ON FUNCTION public.hnswhandler(internal) TO authenticated;
GRANT ALL ON FUNCTION public.hnswhandler(internal) TO service_role;


--
-- Name: FUNCTION increment_ai_chat_usage(p_user_id uuid, p_date date, p_limit integer); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.increment_ai_chat_usage(p_user_id uuid, p_date date, p_limit integer) TO anon;
GRANT ALL ON FUNCTION public.increment_ai_chat_usage(p_user_id uuid, p_date date, p_limit integer) TO authenticated;
GRANT ALL ON FUNCTION public.increment_ai_chat_usage(p_user_id uuid, p_date date, p_limit integer) TO service_role;


--
-- Name: FUNCTION increment_karma(p_user_id uuid, p_amount integer); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.increment_karma(p_user_id uuid, p_amount integer) FROM PUBLIC;
GRANT ALL ON FUNCTION public.increment_karma(p_user_id uuid, p_amount integer) TO service_role;
GRANT ALL ON FUNCTION public.increment_karma(p_user_id uuid, p_amount integer) TO authenticated;


--
-- Name: FUNCTION increment_period_seva(p_user_id uuid, p_points integer); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.increment_period_seva(p_user_id uuid, p_points integer) TO anon;
GRANT ALL ON FUNCTION public.increment_period_seva(p_user_id uuid, p_points integer) TO authenticated;
GRANT ALL ON FUNCTION public.increment_period_seva(p_user_id uuid, p_points integer) TO service_role;


--
-- Name: FUNCTION increment_streak_freeze(p_user_id uuid, p_amount integer); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.increment_streak_freeze(p_user_id uuid, p_amount integer) TO anon;
GRANT ALL ON FUNCTION public.increment_streak_freeze(p_user_id uuid, p_amount integer) TO authenticated;
GRANT ALL ON FUNCTION public.increment_streak_freeze(p_user_id uuid, p_amount integer) TO service_role;


--
-- Name: FUNCTION inner_product(public.halfvec, public.halfvec); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.inner_product(public.halfvec, public.halfvec) TO postgres;
GRANT ALL ON FUNCTION public.inner_product(public.halfvec, public.halfvec) TO anon;
GRANT ALL ON FUNCTION public.inner_product(public.halfvec, public.halfvec) TO authenticated;
GRANT ALL ON FUNCTION public.inner_product(public.halfvec, public.halfvec) TO service_role;


--
-- Name: FUNCTION inner_product(public.sparsevec, public.sparsevec); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.inner_product(public.sparsevec, public.sparsevec) TO postgres;
GRANT ALL ON FUNCTION public.inner_product(public.sparsevec, public.sparsevec) TO anon;
GRANT ALL ON FUNCTION public.inner_product(public.sparsevec, public.sparsevec) TO authenticated;
GRANT ALL ON FUNCTION public.inner_product(public.sparsevec, public.sparsevec) TO service_role;


--
-- Name: FUNCTION inner_product(public.vector, public.vector); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.inner_product(public.vector, public.vector) TO postgres;
GRANT ALL ON FUNCTION public.inner_product(public.vector, public.vector) TO anon;
GRANT ALL ON FUNCTION public.inner_product(public.vector, public.vector) TO authenticated;
GRANT ALL ON FUNCTION public.inner_product(public.vector, public.vector) TO service_role;


--
-- Name: FUNCTION is_contained_2d(public.box2df, public.box2df); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.is_contained_2d(public.box2df, public.box2df) TO postgres;
GRANT ALL ON FUNCTION public.is_contained_2d(public.box2df, public.box2df) TO anon;
GRANT ALL ON FUNCTION public.is_contained_2d(public.box2df, public.box2df) TO authenticated;
GRANT ALL ON FUNCTION public.is_contained_2d(public.box2df, public.box2df) TO service_role;


--
-- Name: FUNCTION is_contained_2d(public.box2df, public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.is_contained_2d(public.box2df, public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.is_contained_2d(public.box2df, public.geometry) TO anon;
GRANT ALL ON FUNCTION public.is_contained_2d(public.box2df, public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.is_contained_2d(public.box2df, public.geometry) TO service_role;


--
-- Name: FUNCTION is_contained_2d(public.geometry, public.box2df); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.is_contained_2d(public.geometry, public.box2df) TO postgres;
GRANT ALL ON FUNCTION public.is_contained_2d(public.geometry, public.box2df) TO anon;
GRANT ALL ON FUNCTION public.is_contained_2d(public.geometry, public.box2df) TO authenticated;
GRANT ALL ON FUNCTION public.is_contained_2d(public.geometry, public.box2df) TO service_role;


--
-- Name: FUNCTION is_kul_member_pro(p_user_id uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.is_kul_member_pro(p_user_id uuid) TO anon;
GRANT ALL ON FUNCTION public.is_kul_member_pro(p_user_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.is_kul_member_pro(p_user_id uuid) TO service_role;


--
-- Name: FUNCTION ivfflat_bit_support(internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.ivfflat_bit_support(internal) TO postgres;
GRANT ALL ON FUNCTION public.ivfflat_bit_support(internal) TO anon;
GRANT ALL ON FUNCTION public.ivfflat_bit_support(internal) TO authenticated;
GRANT ALL ON FUNCTION public.ivfflat_bit_support(internal) TO service_role;


--
-- Name: FUNCTION ivfflat_halfvec_support(internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.ivfflat_halfvec_support(internal) TO postgres;
GRANT ALL ON FUNCTION public.ivfflat_halfvec_support(internal) TO anon;
GRANT ALL ON FUNCTION public.ivfflat_halfvec_support(internal) TO authenticated;
GRANT ALL ON FUNCTION public.ivfflat_halfvec_support(internal) TO service_role;


--
-- Name: FUNCTION ivfflathandler(internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.ivfflathandler(internal) TO postgres;
GRANT ALL ON FUNCTION public.ivfflathandler(internal) TO anon;
GRANT ALL ON FUNCTION public.ivfflathandler(internal) TO authenticated;
GRANT ALL ON FUNCTION public.ivfflathandler(internal) TO service_role;


--
-- Name: FUNCTION jaccard_distance(bit, bit); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.jaccard_distance(bit, bit) TO postgres;
GRANT ALL ON FUNCTION public.jaccard_distance(bit, bit) TO anon;
GRANT ALL ON FUNCTION public.jaccard_distance(bit, bit) TO authenticated;
GRANT ALL ON FUNCTION public.jaccard_distance(bit, bit) TO service_role;


--
-- Name: FUNCTION join_kul(p_invite_code text); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.join_kul(p_invite_code text) FROM PUBLIC;
GRANT ALL ON FUNCTION public.join_kul(p_invite_code text) TO service_role;
GRANT ALL ON FUNCTION public.join_kul(p_invite_code text) TO authenticated;


--
-- Name: FUNCTION l1_distance(public.halfvec, public.halfvec); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.l1_distance(public.halfvec, public.halfvec) TO postgres;
GRANT ALL ON FUNCTION public.l1_distance(public.halfvec, public.halfvec) TO anon;
GRANT ALL ON FUNCTION public.l1_distance(public.halfvec, public.halfvec) TO authenticated;
GRANT ALL ON FUNCTION public.l1_distance(public.halfvec, public.halfvec) TO service_role;


--
-- Name: FUNCTION l1_distance(public.sparsevec, public.sparsevec); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.l1_distance(public.sparsevec, public.sparsevec) TO postgres;
GRANT ALL ON FUNCTION public.l1_distance(public.sparsevec, public.sparsevec) TO anon;
GRANT ALL ON FUNCTION public.l1_distance(public.sparsevec, public.sparsevec) TO authenticated;
GRANT ALL ON FUNCTION public.l1_distance(public.sparsevec, public.sparsevec) TO service_role;


--
-- Name: FUNCTION l1_distance(public.vector, public.vector); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.l1_distance(public.vector, public.vector) TO postgres;
GRANT ALL ON FUNCTION public.l1_distance(public.vector, public.vector) TO anon;
GRANT ALL ON FUNCTION public.l1_distance(public.vector, public.vector) TO authenticated;
GRANT ALL ON FUNCTION public.l1_distance(public.vector, public.vector) TO service_role;


--
-- Name: FUNCTION l2_distance(public.halfvec, public.halfvec); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.l2_distance(public.halfvec, public.halfvec) TO postgres;
GRANT ALL ON FUNCTION public.l2_distance(public.halfvec, public.halfvec) TO anon;
GRANT ALL ON FUNCTION public.l2_distance(public.halfvec, public.halfvec) TO authenticated;
GRANT ALL ON FUNCTION public.l2_distance(public.halfvec, public.halfvec) TO service_role;


--
-- Name: FUNCTION l2_distance(public.sparsevec, public.sparsevec); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.l2_distance(public.sparsevec, public.sparsevec) TO postgres;
GRANT ALL ON FUNCTION public.l2_distance(public.sparsevec, public.sparsevec) TO anon;
GRANT ALL ON FUNCTION public.l2_distance(public.sparsevec, public.sparsevec) TO authenticated;
GRANT ALL ON FUNCTION public.l2_distance(public.sparsevec, public.sparsevec) TO service_role;


--
-- Name: FUNCTION l2_distance(public.vector, public.vector); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.l2_distance(public.vector, public.vector) TO postgres;
GRANT ALL ON FUNCTION public.l2_distance(public.vector, public.vector) TO anon;
GRANT ALL ON FUNCTION public.l2_distance(public.vector, public.vector) TO authenticated;
GRANT ALL ON FUNCTION public.l2_distance(public.vector, public.vector) TO service_role;


--
-- Name: FUNCTION l2_norm(public.halfvec); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.l2_norm(public.halfvec) TO postgres;
GRANT ALL ON FUNCTION public.l2_norm(public.halfvec) TO anon;
GRANT ALL ON FUNCTION public.l2_norm(public.halfvec) TO authenticated;
GRANT ALL ON FUNCTION public.l2_norm(public.halfvec) TO service_role;


--
-- Name: FUNCTION l2_norm(public.sparsevec); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.l2_norm(public.sparsevec) TO postgres;
GRANT ALL ON FUNCTION public.l2_norm(public.sparsevec) TO anon;
GRANT ALL ON FUNCTION public.l2_norm(public.sparsevec) TO authenticated;
GRANT ALL ON FUNCTION public.l2_norm(public.sparsevec) TO service_role;


--
-- Name: FUNCTION l2_normalize(public.halfvec); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.l2_normalize(public.halfvec) TO postgres;
GRANT ALL ON FUNCTION public.l2_normalize(public.halfvec) TO anon;
GRANT ALL ON FUNCTION public.l2_normalize(public.halfvec) TO authenticated;
GRANT ALL ON FUNCTION public.l2_normalize(public.halfvec) TO service_role;


--
-- Name: FUNCTION l2_normalize(public.sparsevec); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.l2_normalize(public.sparsevec) TO postgres;
GRANT ALL ON FUNCTION public.l2_normalize(public.sparsevec) TO anon;
GRANT ALL ON FUNCTION public.l2_normalize(public.sparsevec) TO authenticated;
GRANT ALL ON FUNCTION public.l2_normalize(public.sparsevec) TO service_role;


--
-- Name: FUNCTION l2_normalize(public.vector); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.l2_normalize(public.vector) TO postgres;
GRANT ALL ON FUNCTION public.l2_normalize(public.vector) TO anon;
GRANT ALL ON FUNCTION public.l2_normalize(public.vector) TO authenticated;
GRANT ALL ON FUNCTION public.l2_normalize(public.vector) TO service_role;


--
-- Name: FUNCTION leave_kul(); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.leave_kul() FROM PUBLIC;
GRANT ALL ON FUNCTION public.leave_kul() TO service_role;
GRANT ALL ON FUNCTION public.leave_kul() TO authenticated;


--
-- Name: FUNCTION lockrow(text, text, text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.lockrow(text, text, text) TO postgres;
GRANT ALL ON FUNCTION public.lockrow(text, text, text) TO anon;
GRANT ALL ON FUNCTION public.lockrow(text, text, text) TO authenticated;
GRANT ALL ON FUNCTION public.lockrow(text, text, text) TO service_role;


--
-- Name: FUNCTION lockrow(text, text, text, text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.lockrow(text, text, text, text) TO postgres;
GRANT ALL ON FUNCTION public.lockrow(text, text, text, text) TO anon;
GRANT ALL ON FUNCTION public.lockrow(text, text, text, text) TO authenticated;
GRANT ALL ON FUNCTION public.lockrow(text, text, text, text) TO service_role;


--
-- Name: FUNCTION lockrow(text, text, text, timestamp without time zone); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.lockrow(text, text, text, timestamp without time zone) TO postgres;
GRANT ALL ON FUNCTION public.lockrow(text, text, text, timestamp without time zone) TO anon;
GRANT ALL ON FUNCTION public.lockrow(text, text, text, timestamp without time zone) TO authenticated;
GRANT ALL ON FUNCTION public.lockrow(text, text, text, timestamp without time zone) TO service_role;


--
-- Name: FUNCTION lockrow(text, text, text, text, timestamp without time zone); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.lockrow(text, text, text, text, timestamp without time zone) TO postgres;
GRANT ALL ON FUNCTION public.lockrow(text, text, text, text, timestamp without time zone) TO anon;
GRANT ALL ON FUNCTION public.lockrow(text, text, text, text, timestamp without time zone) TO authenticated;
GRANT ALL ON FUNCTION public.lockrow(text, text, text, text, timestamp without time zone) TO service_role;


--
-- Name: FUNCTION longtransactionsenabled(); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.longtransactionsenabled() TO postgres;
GRANT ALL ON FUNCTION public.longtransactionsenabled() TO anon;
GRANT ALL ON FUNCTION public.longtransactionsenabled() TO authenticated;
GRANT ALL ON FUNCTION public.longtransactionsenabled() TO service_role;


--
-- Name: TABLE nitya_karma_log; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.nitya_karma_log TO anon;
GRANT ALL ON TABLE public.nitya_karma_log TO authenticated;
GRANT ALL ON TABLE public.nitya_karma_log TO service_role;


--
-- Name: FUNCTION mark_nitya_step(p_user_id uuid, p_date date, p_step text, p_done boolean); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.mark_nitya_step(p_user_id uuid, p_date date, p_step text, p_done boolean) FROM PUBLIC;
GRANT ALL ON FUNCTION public.mark_nitya_step(p_user_id uuid, p_date date, p_step text, p_done boolean) TO service_role;
GRANT ALL ON FUNCTION public.mark_nitya_step(p_user_id uuid, p_date date, p_step text, p_done boolean) TO authenticated;


--
-- Name: FUNCTION match_scriptures(query_embedding public.vector, match_count integer, match_threshold double precision); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.match_scriptures(query_embedding public.vector, match_count integer, match_threshold double precision) FROM PUBLIC;
GRANT ALL ON FUNCTION public.match_scriptures(query_embedding public.vector, match_count integer, match_threshold double precision) TO service_role;


--
-- Name: FUNCTION match_scriptures_text(query_text text, match_count integer, match_threshold double precision, filter_text_ids text[]); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.match_scriptures_text(query_text text, match_count integer, match_threshold double precision, filter_text_ids text[]) FROM PUBLIC;
GRANT ALL ON FUNCTION public.match_scriptures_text(query_text text, match_count integer, match_threshold double precision, filter_text_ids text[]) TO service_role;


--
-- Name: FUNCTION overlaps_2d(public.box2df, public.box2df); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.overlaps_2d(public.box2df, public.box2df) TO postgres;
GRANT ALL ON FUNCTION public.overlaps_2d(public.box2df, public.box2df) TO anon;
GRANT ALL ON FUNCTION public.overlaps_2d(public.box2df, public.box2df) TO authenticated;
GRANT ALL ON FUNCTION public.overlaps_2d(public.box2df, public.box2df) TO service_role;


--
-- Name: FUNCTION overlaps_2d(public.box2df, public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.overlaps_2d(public.box2df, public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.overlaps_2d(public.box2df, public.geometry) TO anon;
GRANT ALL ON FUNCTION public.overlaps_2d(public.box2df, public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.overlaps_2d(public.box2df, public.geometry) TO service_role;


--
-- Name: FUNCTION overlaps_2d(public.geometry, public.box2df); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.overlaps_2d(public.geometry, public.box2df) TO postgres;
GRANT ALL ON FUNCTION public.overlaps_2d(public.geometry, public.box2df) TO anon;
GRANT ALL ON FUNCTION public.overlaps_2d(public.geometry, public.box2df) TO authenticated;
GRANT ALL ON FUNCTION public.overlaps_2d(public.geometry, public.box2df) TO service_role;


--
-- Name: FUNCTION overlaps_geog(public.geography, public.gidx); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.overlaps_geog(public.geography, public.gidx) TO postgres;
GRANT ALL ON FUNCTION public.overlaps_geog(public.geography, public.gidx) TO anon;
GRANT ALL ON FUNCTION public.overlaps_geog(public.geography, public.gidx) TO authenticated;
GRANT ALL ON FUNCTION public.overlaps_geog(public.geography, public.gidx) TO service_role;


--
-- Name: FUNCTION overlaps_geog(public.gidx, public.geography); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.overlaps_geog(public.gidx, public.geography) TO postgres;
GRANT ALL ON FUNCTION public.overlaps_geog(public.gidx, public.geography) TO anon;
GRANT ALL ON FUNCTION public.overlaps_geog(public.gidx, public.geography) TO authenticated;
GRANT ALL ON FUNCTION public.overlaps_geog(public.gidx, public.geography) TO service_role;


--
-- Name: FUNCTION overlaps_geog(public.gidx, public.gidx); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.overlaps_geog(public.gidx, public.gidx) TO postgres;
GRANT ALL ON FUNCTION public.overlaps_geog(public.gidx, public.gidx) TO anon;
GRANT ALL ON FUNCTION public.overlaps_geog(public.gidx, public.gidx) TO authenticated;
GRANT ALL ON FUNCTION public.overlaps_geog(public.gidx, public.gidx) TO service_role;


--
-- Name: FUNCTION overlaps_nd(public.geometry, public.gidx); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.overlaps_nd(public.geometry, public.gidx) TO postgres;
GRANT ALL ON FUNCTION public.overlaps_nd(public.geometry, public.gidx) TO anon;
GRANT ALL ON FUNCTION public.overlaps_nd(public.geometry, public.gidx) TO authenticated;
GRANT ALL ON FUNCTION public.overlaps_nd(public.geometry, public.gidx) TO service_role;


--
-- Name: FUNCTION overlaps_nd(public.gidx, public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.overlaps_nd(public.gidx, public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.overlaps_nd(public.gidx, public.geometry) TO anon;
GRANT ALL ON FUNCTION public.overlaps_nd(public.gidx, public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.overlaps_nd(public.gidx, public.geometry) TO service_role;


--
-- Name: FUNCTION overlaps_nd(public.gidx, public.gidx); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.overlaps_nd(public.gidx, public.gidx) TO postgres;
GRANT ALL ON FUNCTION public.overlaps_nd(public.gidx, public.gidx) TO anon;
GRANT ALL ON FUNCTION public.overlaps_nd(public.gidx, public.gidx) TO authenticated;
GRANT ALL ON FUNCTION public.overlaps_nd(public.gidx, public.gidx) TO service_role;


--
-- Name: FUNCTION pgis_asflatgeobuf_finalfn(internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.pgis_asflatgeobuf_finalfn(internal) TO postgres;
GRANT ALL ON FUNCTION public.pgis_asflatgeobuf_finalfn(internal) TO anon;
GRANT ALL ON FUNCTION public.pgis_asflatgeobuf_finalfn(internal) TO authenticated;
GRANT ALL ON FUNCTION public.pgis_asflatgeobuf_finalfn(internal) TO service_role;


--
-- Name: FUNCTION pgis_asflatgeobuf_transfn(internal, anyelement); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.pgis_asflatgeobuf_transfn(internal, anyelement) TO postgres;
GRANT ALL ON FUNCTION public.pgis_asflatgeobuf_transfn(internal, anyelement) TO anon;
GRANT ALL ON FUNCTION public.pgis_asflatgeobuf_transfn(internal, anyelement) TO authenticated;
GRANT ALL ON FUNCTION public.pgis_asflatgeobuf_transfn(internal, anyelement) TO service_role;


--
-- Name: FUNCTION pgis_asflatgeobuf_transfn(internal, anyelement, boolean); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.pgis_asflatgeobuf_transfn(internal, anyelement, boolean) TO postgres;
GRANT ALL ON FUNCTION public.pgis_asflatgeobuf_transfn(internal, anyelement, boolean) TO anon;
GRANT ALL ON FUNCTION public.pgis_asflatgeobuf_transfn(internal, anyelement, boolean) TO authenticated;
GRANT ALL ON FUNCTION public.pgis_asflatgeobuf_transfn(internal, anyelement, boolean) TO service_role;


--
-- Name: FUNCTION pgis_asflatgeobuf_transfn(internal, anyelement, boolean, text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.pgis_asflatgeobuf_transfn(internal, anyelement, boolean, text) TO postgres;
GRANT ALL ON FUNCTION public.pgis_asflatgeobuf_transfn(internal, anyelement, boolean, text) TO anon;
GRANT ALL ON FUNCTION public.pgis_asflatgeobuf_transfn(internal, anyelement, boolean, text) TO authenticated;
GRANT ALL ON FUNCTION public.pgis_asflatgeobuf_transfn(internal, anyelement, boolean, text) TO service_role;


--
-- Name: FUNCTION pgis_asgeobuf_finalfn(internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.pgis_asgeobuf_finalfn(internal) TO postgres;
GRANT ALL ON FUNCTION public.pgis_asgeobuf_finalfn(internal) TO anon;
GRANT ALL ON FUNCTION public.pgis_asgeobuf_finalfn(internal) TO authenticated;
GRANT ALL ON FUNCTION public.pgis_asgeobuf_finalfn(internal) TO service_role;


--
-- Name: FUNCTION pgis_asgeobuf_transfn(internal, anyelement); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.pgis_asgeobuf_transfn(internal, anyelement) TO postgres;
GRANT ALL ON FUNCTION public.pgis_asgeobuf_transfn(internal, anyelement) TO anon;
GRANT ALL ON FUNCTION public.pgis_asgeobuf_transfn(internal, anyelement) TO authenticated;
GRANT ALL ON FUNCTION public.pgis_asgeobuf_transfn(internal, anyelement) TO service_role;


--
-- Name: FUNCTION pgis_asgeobuf_transfn(internal, anyelement, text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.pgis_asgeobuf_transfn(internal, anyelement, text) TO postgres;
GRANT ALL ON FUNCTION public.pgis_asgeobuf_transfn(internal, anyelement, text) TO anon;
GRANT ALL ON FUNCTION public.pgis_asgeobuf_transfn(internal, anyelement, text) TO authenticated;
GRANT ALL ON FUNCTION public.pgis_asgeobuf_transfn(internal, anyelement, text) TO service_role;


--
-- Name: FUNCTION pgis_asmvt_combinefn(internal, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.pgis_asmvt_combinefn(internal, internal) TO postgres;
GRANT ALL ON FUNCTION public.pgis_asmvt_combinefn(internal, internal) TO anon;
GRANT ALL ON FUNCTION public.pgis_asmvt_combinefn(internal, internal) TO authenticated;
GRANT ALL ON FUNCTION public.pgis_asmvt_combinefn(internal, internal) TO service_role;


--
-- Name: FUNCTION pgis_asmvt_deserialfn(bytea, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.pgis_asmvt_deserialfn(bytea, internal) TO postgres;
GRANT ALL ON FUNCTION public.pgis_asmvt_deserialfn(bytea, internal) TO anon;
GRANT ALL ON FUNCTION public.pgis_asmvt_deserialfn(bytea, internal) TO authenticated;
GRANT ALL ON FUNCTION public.pgis_asmvt_deserialfn(bytea, internal) TO service_role;


--
-- Name: FUNCTION pgis_asmvt_finalfn(internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.pgis_asmvt_finalfn(internal) TO postgres;
GRANT ALL ON FUNCTION public.pgis_asmvt_finalfn(internal) TO anon;
GRANT ALL ON FUNCTION public.pgis_asmvt_finalfn(internal) TO authenticated;
GRANT ALL ON FUNCTION public.pgis_asmvt_finalfn(internal) TO service_role;


--
-- Name: FUNCTION pgis_asmvt_serialfn(internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.pgis_asmvt_serialfn(internal) TO postgres;
GRANT ALL ON FUNCTION public.pgis_asmvt_serialfn(internal) TO anon;
GRANT ALL ON FUNCTION public.pgis_asmvt_serialfn(internal) TO authenticated;
GRANT ALL ON FUNCTION public.pgis_asmvt_serialfn(internal) TO service_role;


--
-- Name: FUNCTION pgis_asmvt_transfn(internal, anyelement); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.pgis_asmvt_transfn(internal, anyelement) TO postgres;
GRANT ALL ON FUNCTION public.pgis_asmvt_transfn(internal, anyelement) TO anon;
GRANT ALL ON FUNCTION public.pgis_asmvt_transfn(internal, anyelement) TO authenticated;
GRANT ALL ON FUNCTION public.pgis_asmvt_transfn(internal, anyelement) TO service_role;


--
-- Name: FUNCTION pgis_asmvt_transfn(internal, anyelement, text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.pgis_asmvt_transfn(internal, anyelement, text) TO postgres;
GRANT ALL ON FUNCTION public.pgis_asmvt_transfn(internal, anyelement, text) TO anon;
GRANT ALL ON FUNCTION public.pgis_asmvt_transfn(internal, anyelement, text) TO authenticated;
GRANT ALL ON FUNCTION public.pgis_asmvt_transfn(internal, anyelement, text) TO service_role;


--
-- Name: FUNCTION pgis_asmvt_transfn(internal, anyelement, text, integer); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.pgis_asmvt_transfn(internal, anyelement, text, integer) TO postgres;
GRANT ALL ON FUNCTION public.pgis_asmvt_transfn(internal, anyelement, text, integer) TO anon;
GRANT ALL ON FUNCTION public.pgis_asmvt_transfn(internal, anyelement, text, integer) TO authenticated;
GRANT ALL ON FUNCTION public.pgis_asmvt_transfn(internal, anyelement, text, integer) TO service_role;


--
-- Name: FUNCTION pgis_asmvt_transfn(internal, anyelement, text, integer, text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.pgis_asmvt_transfn(internal, anyelement, text, integer, text) TO postgres;
GRANT ALL ON FUNCTION public.pgis_asmvt_transfn(internal, anyelement, text, integer, text) TO anon;
GRANT ALL ON FUNCTION public.pgis_asmvt_transfn(internal, anyelement, text, integer, text) TO authenticated;
GRANT ALL ON FUNCTION public.pgis_asmvt_transfn(internal, anyelement, text, integer, text) TO service_role;


--
-- Name: FUNCTION pgis_asmvt_transfn(internal, anyelement, text, integer, text, text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.pgis_asmvt_transfn(internal, anyelement, text, integer, text, text) TO postgres;
GRANT ALL ON FUNCTION public.pgis_asmvt_transfn(internal, anyelement, text, integer, text, text) TO anon;
GRANT ALL ON FUNCTION public.pgis_asmvt_transfn(internal, anyelement, text, integer, text, text) TO authenticated;
GRANT ALL ON FUNCTION public.pgis_asmvt_transfn(internal, anyelement, text, integer, text, text) TO service_role;


--
-- Name: FUNCTION pgis_geometry_accum_transfn(internal, public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.pgis_geometry_accum_transfn(internal, public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.pgis_geometry_accum_transfn(internal, public.geometry) TO anon;
GRANT ALL ON FUNCTION public.pgis_geometry_accum_transfn(internal, public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.pgis_geometry_accum_transfn(internal, public.geometry) TO service_role;


--
-- Name: FUNCTION pgis_geometry_accum_transfn(internal, public.geometry, double precision); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.pgis_geometry_accum_transfn(internal, public.geometry, double precision) TO postgres;
GRANT ALL ON FUNCTION public.pgis_geometry_accum_transfn(internal, public.geometry, double precision) TO anon;
GRANT ALL ON FUNCTION public.pgis_geometry_accum_transfn(internal, public.geometry, double precision) TO authenticated;
GRANT ALL ON FUNCTION public.pgis_geometry_accum_transfn(internal, public.geometry, double precision) TO service_role;


--
-- Name: FUNCTION pgis_geometry_accum_transfn(internal, public.geometry, double precision, integer); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.pgis_geometry_accum_transfn(internal, public.geometry, double precision, integer) TO postgres;
GRANT ALL ON FUNCTION public.pgis_geometry_accum_transfn(internal, public.geometry, double precision, integer) TO anon;
GRANT ALL ON FUNCTION public.pgis_geometry_accum_transfn(internal, public.geometry, double precision, integer) TO authenticated;
GRANT ALL ON FUNCTION public.pgis_geometry_accum_transfn(internal, public.geometry, double precision, integer) TO service_role;


--
-- Name: FUNCTION pgis_geometry_clusterintersecting_finalfn(internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.pgis_geometry_clusterintersecting_finalfn(internal) TO postgres;
GRANT ALL ON FUNCTION public.pgis_geometry_clusterintersecting_finalfn(internal) TO anon;
GRANT ALL ON FUNCTION public.pgis_geometry_clusterintersecting_finalfn(internal) TO authenticated;
GRANT ALL ON FUNCTION public.pgis_geometry_clusterintersecting_finalfn(internal) TO service_role;


--
-- Name: FUNCTION pgis_geometry_clusterwithin_finalfn(internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.pgis_geometry_clusterwithin_finalfn(internal) TO postgres;
GRANT ALL ON FUNCTION public.pgis_geometry_clusterwithin_finalfn(internal) TO anon;
GRANT ALL ON FUNCTION public.pgis_geometry_clusterwithin_finalfn(internal) TO authenticated;
GRANT ALL ON FUNCTION public.pgis_geometry_clusterwithin_finalfn(internal) TO service_role;


--
-- Name: FUNCTION pgis_geometry_collect_finalfn(internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.pgis_geometry_collect_finalfn(internal) TO postgres;
GRANT ALL ON FUNCTION public.pgis_geometry_collect_finalfn(internal) TO anon;
GRANT ALL ON FUNCTION public.pgis_geometry_collect_finalfn(internal) TO authenticated;
GRANT ALL ON FUNCTION public.pgis_geometry_collect_finalfn(internal) TO service_role;


--
-- Name: FUNCTION pgis_geometry_makeline_finalfn(internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.pgis_geometry_makeline_finalfn(internal) TO postgres;
GRANT ALL ON FUNCTION public.pgis_geometry_makeline_finalfn(internal) TO anon;
GRANT ALL ON FUNCTION public.pgis_geometry_makeline_finalfn(internal) TO authenticated;
GRANT ALL ON FUNCTION public.pgis_geometry_makeline_finalfn(internal) TO service_role;


--
-- Name: FUNCTION pgis_geometry_polygonize_finalfn(internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.pgis_geometry_polygonize_finalfn(internal) TO postgres;
GRANT ALL ON FUNCTION public.pgis_geometry_polygonize_finalfn(internal) TO anon;
GRANT ALL ON FUNCTION public.pgis_geometry_polygonize_finalfn(internal) TO authenticated;
GRANT ALL ON FUNCTION public.pgis_geometry_polygonize_finalfn(internal) TO service_role;


--
-- Name: FUNCTION pgis_geometry_union_parallel_combinefn(internal, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.pgis_geometry_union_parallel_combinefn(internal, internal) TO postgres;
GRANT ALL ON FUNCTION public.pgis_geometry_union_parallel_combinefn(internal, internal) TO anon;
GRANT ALL ON FUNCTION public.pgis_geometry_union_parallel_combinefn(internal, internal) TO authenticated;
GRANT ALL ON FUNCTION public.pgis_geometry_union_parallel_combinefn(internal, internal) TO service_role;


--
-- Name: FUNCTION pgis_geometry_union_parallel_deserialfn(bytea, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.pgis_geometry_union_parallel_deserialfn(bytea, internal) TO postgres;
GRANT ALL ON FUNCTION public.pgis_geometry_union_parallel_deserialfn(bytea, internal) TO anon;
GRANT ALL ON FUNCTION public.pgis_geometry_union_parallel_deserialfn(bytea, internal) TO authenticated;
GRANT ALL ON FUNCTION public.pgis_geometry_union_parallel_deserialfn(bytea, internal) TO service_role;


--
-- Name: FUNCTION pgis_geometry_union_parallel_finalfn(internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.pgis_geometry_union_parallel_finalfn(internal) TO postgres;
GRANT ALL ON FUNCTION public.pgis_geometry_union_parallel_finalfn(internal) TO anon;
GRANT ALL ON FUNCTION public.pgis_geometry_union_parallel_finalfn(internal) TO authenticated;
GRANT ALL ON FUNCTION public.pgis_geometry_union_parallel_finalfn(internal) TO service_role;


--
-- Name: FUNCTION pgis_geometry_union_parallel_serialfn(internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.pgis_geometry_union_parallel_serialfn(internal) TO postgres;
GRANT ALL ON FUNCTION public.pgis_geometry_union_parallel_serialfn(internal) TO anon;
GRANT ALL ON FUNCTION public.pgis_geometry_union_parallel_serialfn(internal) TO authenticated;
GRANT ALL ON FUNCTION public.pgis_geometry_union_parallel_serialfn(internal) TO service_role;


--
-- Name: FUNCTION pgis_geometry_union_parallel_transfn(internal, public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.pgis_geometry_union_parallel_transfn(internal, public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.pgis_geometry_union_parallel_transfn(internal, public.geometry) TO anon;
GRANT ALL ON FUNCTION public.pgis_geometry_union_parallel_transfn(internal, public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.pgis_geometry_union_parallel_transfn(internal, public.geometry) TO service_role;


--
-- Name: FUNCTION pgis_geometry_union_parallel_transfn(internal, public.geometry, double precision); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.pgis_geometry_union_parallel_transfn(internal, public.geometry, double precision) TO postgres;
GRANT ALL ON FUNCTION public.pgis_geometry_union_parallel_transfn(internal, public.geometry, double precision) TO anon;
GRANT ALL ON FUNCTION public.pgis_geometry_union_parallel_transfn(internal, public.geometry, double precision) TO authenticated;
GRANT ALL ON FUNCTION public.pgis_geometry_union_parallel_transfn(internal, public.geometry, double precision) TO service_role;


--
-- Name: FUNCTION populate_geometry_columns(use_typmod boolean); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.populate_geometry_columns(use_typmod boolean) TO postgres;
GRANT ALL ON FUNCTION public.populate_geometry_columns(use_typmod boolean) TO anon;
GRANT ALL ON FUNCTION public.populate_geometry_columns(use_typmod boolean) TO authenticated;
GRANT ALL ON FUNCTION public.populate_geometry_columns(use_typmod boolean) TO service_role;


--
-- Name: FUNCTION populate_geometry_columns(tbl_oid oid, use_typmod boolean); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.populate_geometry_columns(tbl_oid oid, use_typmod boolean) TO postgres;
GRANT ALL ON FUNCTION public.populate_geometry_columns(tbl_oid oid, use_typmod boolean) TO anon;
GRANT ALL ON FUNCTION public.populate_geometry_columns(tbl_oid oid, use_typmod boolean) TO authenticated;
GRANT ALL ON FUNCTION public.populate_geometry_columns(tbl_oid oid, use_typmod boolean) TO service_role;


--
-- Name: FUNCTION postgis_addbbox(public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.postgis_addbbox(public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.postgis_addbbox(public.geometry) TO anon;
GRANT ALL ON FUNCTION public.postgis_addbbox(public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.postgis_addbbox(public.geometry) TO service_role;


--
-- Name: FUNCTION postgis_cache_bbox(); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.postgis_cache_bbox() TO postgres;
GRANT ALL ON FUNCTION public.postgis_cache_bbox() TO anon;
GRANT ALL ON FUNCTION public.postgis_cache_bbox() TO authenticated;
GRANT ALL ON FUNCTION public.postgis_cache_bbox() TO service_role;


--
-- Name: FUNCTION postgis_constraint_dims(geomschema text, geomtable text, geomcolumn text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.postgis_constraint_dims(geomschema text, geomtable text, geomcolumn text) TO postgres;
GRANT ALL ON FUNCTION public.postgis_constraint_dims(geomschema text, geomtable text, geomcolumn text) TO anon;
GRANT ALL ON FUNCTION public.postgis_constraint_dims(geomschema text, geomtable text, geomcolumn text) TO authenticated;
GRANT ALL ON FUNCTION public.postgis_constraint_dims(geomschema text, geomtable text, geomcolumn text) TO service_role;


--
-- Name: FUNCTION postgis_constraint_srid(geomschema text, geomtable text, geomcolumn text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.postgis_constraint_srid(geomschema text, geomtable text, geomcolumn text) TO postgres;
GRANT ALL ON FUNCTION public.postgis_constraint_srid(geomschema text, geomtable text, geomcolumn text) TO anon;
GRANT ALL ON FUNCTION public.postgis_constraint_srid(geomschema text, geomtable text, geomcolumn text) TO authenticated;
GRANT ALL ON FUNCTION public.postgis_constraint_srid(geomschema text, geomtable text, geomcolumn text) TO service_role;


--
-- Name: FUNCTION postgis_constraint_type(geomschema text, geomtable text, geomcolumn text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.postgis_constraint_type(geomschema text, geomtable text, geomcolumn text) TO postgres;
GRANT ALL ON FUNCTION public.postgis_constraint_type(geomschema text, geomtable text, geomcolumn text) TO anon;
GRANT ALL ON FUNCTION public.postgis_constraint_type(geomschema text, geomtable text, geomcolumn text) TO authenticated;
GRANT ALL ON FUNCTION public.postgis_constraint_type(geomschema text, geomtable text, geomcolumn text) TO service_role;


--
-- Name: FUNCTION postgis_dropbbox(public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.postgis_dropbbox(public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.postgis_dropbbox(public.geometry) TO anon;
GRANT ALL ON FUNCTION public.postgis_dropbbox(public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.postgis_dropbbox(public.geometry) TO service_role;


--
-- Name: FUNCTION postgis_extensions_upgrade(); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.postgis_extensions_upgrade() TO postgres;
GRANT ALL ON FUNCTION public.postgis_extensions_upgrade() TO anon;
GRANT ALL ON FUNCTION public.postgis_extensions_upgrade() TO authenticated;
GRANT ALL ON FUNCTION public.postgis_extensions_upgrade() TO service_role;


--
-- Name: FUNCTION postgis_full_version(); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.postgis_full_version() TO postgres;
GRANT ALL ON FUNCTION public.postgis_full_version() TO anon;
GRANT ALL ON FUNCTION public.postgis_full_version() TO authenticated;
GRANT ALL ON FUNCTION public.postgis_full_version() TO service_role;


--
-- Name: FUNCTION postgis_geos_noop(public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.postgis_geos_noop(public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.postgis_geos_noop(public.geometry) TO anon;
GRANT ALL ON FUNCTION public.postgis_geos_noop(public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.postgis_geos_noop(public.geometry) TO service_role;


--
-- Name: FUNCTION postgis_geos_version(); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.postgis_geos_version() TO postgres;
GRANT ALL ON FUNCTION public.postgis_geos_version() TO anon;
GRANT ALL ON FUNCTION public.postgis_geos_version() TO authenticated;
GRANT ALL ON FUNCTION public.postgis_geos_version() TO service_role;


--
-- Name: FUNCTION postgis_getbbox(public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.postgis_getbbox(public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.postgis_getbbox(public.geometry) TO anon;
GRANT ALL ON FUNCTION public.postgis_getbbox(public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.postgis_getbbox(public.geometry) TO service_role;


--
-- Name: FUNCTION postgis_hasbbox(public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.postgis_hasbbox(public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.postgis_hasbbox(public.geometry) TO anon;
GRANT ALL ON FUNCTION public.postgis_hasbbox(public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.postgis_hasbbox(public.geometry) TO service_role;


--
-- Name: FUNCTION postgis_index_supportfn(internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.postgis_index_supportfn(internal) TO postgres;
GRANT ALL ON FUNCTION public.postgis_index_supportfn(internal) TO anon;
GRANT ALL ON FUNCTION public.postgis_index_supportfn(internal) TO authenticated;
GRANT ALL ON FUNCTION public.postgis_index_supportfn(internal) TO service_role;


--
-- Name: FUNCTION postgis_lib_build_date(); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.postgis_lib_build_date() TO postgres;
GRANT ALL ON FUNCTION public.postgis_lib_build_date() TO anon;
GRANT ALL ON FUNCTION public.postgis_lib_build_date() TO authenticated;
GRANT ALL ON FUNCTION public.postgis_lib_build_date() TO service_role;


--
-- Name: FUNCTION postgis_lib_revision(); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.postgis_lib_revision() TO postgres;
GRANT ALL ON FUNCTION public.postgis_lib_revision() TO anon;
GRANT ALL ON FUNCTION public.postgis_lib_revision() TO authenticated;
GRANT ALL ON FUNCTION public.postgis_lib_revision() TO service_role;


--
-- Name: FUNCTION postgis_lib_version(); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.postgis_lib_version() TO postgres;
GRANT ALL ON FUNCTION public.postgis_lib_version() TO anon;
GRANT ALL ON FUNCTION public.postgis_lib_version() TO authenticated;
GRANT ALL ON FUNCTION public.postgis_lib_version() TO service_role;


--
-- Name: FUNCTION postgis_libjson_version(); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.postgis_libjson_version() TO postgres;
GRANT ALL ON FUNCTION public.postgis_libjson_version() TO anon;
GRANT ALL ON FUNCTION public.postgis_libjson_version() TO authenticated;
GRANT ALL ON FUNCTION public.postgis_libjson_version() TO service_role;


--
-- Name: FUNCTION postgis_liblwgeom_version(); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.postgis_liblwgeom_version() TO postgres;
GRANT ALL ON FUNCTION public.postgis_liblwgeom_version() TO anon;
GRANT ALL ON FUNCTION public.postgis_liblwgeom_version() TO authenticated;
GRANT ALL ON FUNCTION public.postgis_liblwgeom_version() TO service_role;


--
-- Name: FUNCTION postgis_libprotobuf_version(); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.postgis_libprotobuf_version() TO postgres;
GRANT ALL ON FUNCTION public.postgis_libprotobuf_version() TO anon;
GRANT ALL ON FUNCTION public.postgis_libprotobuf_version() TO authenticated;
GRANT ALL ON FUNCTION public.postgis_libprotobuf_version() TO service_role;


--
-- Name: FUNCTION postgis_libxml_version(); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.postgis_libxml_version() TO postgres;
GRANT ALL ON FUNCTION public.postgis_libxml_version() TO anon;
GRANT ALL ON FUNCTION public.postgis_libxml_version() TO authenticated;
GRANT ALL ON FUNCTION public.postgis_libxml_version() TO service_role;


--
-- Name: FUNCTION postgis_noop(public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.postgis_noop(public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.postgis_noop(public.geometry) TO anon;
GRANT ALL ON FUNCTION public.postgis_noop(public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.postgis_noop(public.geometry) TO service_role;


--
-- Name: FUNCTION postgis_proj_version(); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.postgis_proj_version() TO postgres;
GRANT ALL ON FUNCTION public.postgis_proj_version() TO anon;
GRANT ALL ON FUNCTION public.postgis_proj_version() TO authenticated;
GRANT ALL ON FUNCTION public.postgis_proj_version() TO service_role;


--
-- Name: FUNCTION postgis_scripts_build_date(); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.postgis_scripts_build_date() TO postgres;
GRANT ALL ON FUNCTION public.postgis_scripts_build_date() TO anon;
GRANT ALL ON FUNCTION public.postgis_scripts_build_date() TO authenticated;
GRANT ALL ON FUNCTION public.postgis_scripts_build_date() TO service_role;


--
-- Name: FUNCTION postgis_scripts_installed(); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.postgis_scripts_installed() TO postgres;
GRANT ALL ON FUNCTION public.postgis_scripts_installed() TO anon;
GRANT ALL ON FUNCTION public.postgis_scripts_installed() TO authenticated;
GRANT ALL ON FUNCTION public.postgis_scripts_installed() TO service_role;


--
-- Name: FUNCTION postgis_scripts_released(); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.postgis_scripts_released() TO postgres;
GRANT ALL ON FUNCTION public.postgis_scripts_released() TO anon;
GRANT ALL ON FUNCTION public.postgis_scripts_released() TO authenticated;
GRANT ALL ON FUNCTION public.postgis_scripts_released() TO service_role;


--
-- Name: FUNCTION postgis_svn_version(); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.postgis_svn_version() TO postgres;
GRANT ALL ON FUNCTION public.postgis_svn_version() TO anon;
GRANT ALL ON FUNCTION public.postgis_svn_version() TO authenticated;
GRANT ALL ON FUNCTION public.postgis_svn_version() TO service_role;


--
-- Name: FUNCTION postgis_transform_geometry(geom public.geometry, text, text, integer); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.postgis_transform_geometry(geom public.geometry, text, text, integer) TO postgres;
GRANT ALL ON FUNCTION public.postgis_transform_geometry(geom public.geometry, text, text, integer) TO anon;
GRANT ALL ON FUNCTION public.postgis_transform_geometry(geom public.geometry, text, text, integer) TO authenticated;
GRANT ALL ON FUNCTION public.postgis_transform_geometry(geom public.geometry, text, text, integer) TO service_role;


--
-- Name: FUNCTION postgis_type_name(geomname character varying, coord_dimension integer, use_new_name boolean); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.postgis_type_name(geomname character varying, coord_dimension integer, use_new_name boolean) TO postgres;
GRANT ALL ON FUNCTION public.postgis_type_name(geomname character varying, coord_dimension integer, use_new_name boolean) TO anon;
GRANT ALL ON FUNCTION public.postgis_type_name(geomname character varying, coord_dimension integer, use_new_name boolean) TO authenticated;
GRANT ALL ON FUNCTION public.postgis_type_name(geomname character varying, coord_dimension integer, use_new_name boolean) TO service_role;


--
-- Name: FUNCTION postgis_typmod_dims(integer); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.postgis_typmod_dims(integer) TO postgres;
GRANT ALL ON FUNCTION public.postgis_typmod_dims(integer) TO anon;
GRANT ALL ON FUNCTION public.postgis_typmod_dims(integer) TO authenticated;
GRANT ALL ON FUNCTION public.postgis_typmod_dims(integer) TO service_role;


--
-- Name: FUNCTION postgis_typmod_srid(integer); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.postgis_typmod_srid(integer) TO postgres;
GRANT ALL ON FUNCTION public.postgis_typmod_srid(integer) TO anon;
GRANT ALL ON FUNCTION public.postgis_typmod_srid(integer) TO authenticated;
GRANT ALL ON FUNCTION public.postgis_typmod_srid(integer) TO service_role;


--
-- Name: FUNCTION postgis_typmod_type(integer); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.postgis_typmod_type(integer) TO postgres;
GRANT ALL ON FUNCTION public.postgis_typmod_type(integer) TO anon;
GRANT ALL ON FUNCTION public.postgis_typmod_type(integer) TO authenticated;
GRANT ALL ON FUNCTION public.postgis_typmod_type(integer) TO service_role;


--
-- Name: FUNCTION postgis_version(); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.postgis_version() TO postgres;
GRANT ALL ON FUNCTION public.postgis_version() TO anon;
GRANT ALL ON FUNCTION public.postgis_version() TO authenticated;
GRANT ALL ON FUNCTION public.postgis_version() TO service_role;


--
-- Name: FUNCTION postgis_wagyu_version(); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.postgis_wagyu_version() TO postgres;
GRANT ALL ON FUNCTION public.postgis_wagyu_version() TO anon;
GRANT ALL ON FUNCTION public.postgis_wagyu_version() TO authenticated;
GRANT ALL ON FUNCTION public.postgis_wagyu_version() TO service_role;


--
-- Name: FUNCTION prune_old_user_data(p_days integer); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.prune_old_user_data(p_days integer) TO anon;
GRANT ALL ON FUNCTION public.prune_old_user_data(p_days integer) TO authenticated;
GRANT ALL ON FUNCTION public.prune_old_user_data(p_days integer) TO service_role;


--
-- Name: FUNCTION repair_kul_membership(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.repair_kul_membership() TO anon;
GRANT ALL ON FUNCTION public.repair_kul_membership() TO authenticated;
GRANT ALL ON FUNCTION public.repair_kul_membership() TO service_role;


--
-- Name: FUNCTION rls_auto_enable(); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.rls_auto_enable() FROM PUBLIC;
GRANT ALL ON FUNCTION public.rls_auto_enable() TO service_role;


--
-- Name: FUNCTION set_hero_assets_updated_at(); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.set_hero_assets_updated_at() FROM PUBLIC;
GRANT ALL ON FUNCTION public.set_hero_assets_updated_at() TO service_role;


--
-- Name: FUNCTION sparsevec_cmp(public.sparsevec, public.sparsevec); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.sparsevec_cmp(public.sparsevec, public.sparsevec) TO postgres;
GRANT ALL ON FUNCTION public.sparsevec_cmp(public.sparsevec, public.sparsevec) TO anon;
GRANT ALL ON FUNCTION public.sparsevec_cmp(public.sparsevec, public.sparsevec) TO authenticated;
GRANT ALL ON FUNCTION public.sparsevec_cmp(public.sparsevec, public.sparsevec) TO service_role;


--
-- Name: FUNCTION sparsevec_eq(public.sparsevec, public.sparsevec); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.sparsevec_eq(public.sparsevec, public.sparsevec) TO postgres;
GRANT ALL ON FUNCTION public.sparsevec_eq(public.sparsevec, public.sparsevec) TO anon;
GRANT ALL ON FUNCTION public.sparsevec_eq(public.sparsevec, public.sparsevec) TO authenticated;
GRANT ALL ON FUNCTION public.sparsevec_eq(public.sparsevec, public.sparsevec) TO service_role;


--
-- Name: FUNCTION sparsevec_ge(public.sparsevec, public.sparsevec); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.sparsevec_ge(public.sparsevec, public.sparsevec) TO postgres;
GRANT ALL ON FUNCTION public.sparsevec_ge(public.sparsevec, public.sparsevec) TO anon;
GRANT ALL ON FUNCTION public.sparsevec_ge(public.sparsevec, public.sparsevec) TO authenticated;
GRANT ALL ON FUNCTION public.sparsevec_ge(public.sparsevec, public.sparsevec) TO service_role;


--
-- Name: FUNCTION sparsevec_gt(public.sparsevec, public.sparsevec); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.sparsevec_gt(public.sparsevec, public.sparsevec) TO postgres;
GRANT ALL ON FUNCTION public.sparsevec_gt(public.sparsevec, public.sparsevec) TO anon;
GRANT ALL ON FUNCTION public.sparsevec_gt(public.sparsevec, public.sparsevec) TO authenticated;
GRANT ALL ON FUNCTION public.sparsevec_gt(public.sparsevec, public.sparsevec) TO service_role;


--
-- Name: FUNCTION sparsevec_l2_squared_distance(public.sparsevec, public.sparsevec); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.sparsevec_l2_squared_distance(public.sparsevec, public.sparsevec) TO postgres;
GRANT ALL ON FUNCTION public.sparsevec_l2_squared_distance(public.sparsevec, public.sparsevec) TO anon;
GRANT ALL ON FUNCTION public.sparsevec_l2_squared_distance(public.sparsevec, public.sparsevec) TO authenticated;
GRANT ALL ON FUNCTION public.sparsevec_l2_squared_distance(public.sparsevec, public.sparsevec) TO service_role;


--
-- Name: FUNCTION sparsevec_le(public.sparsevec, public.sparsevec); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.sparsevec_le(public.sparsevec, public.sparsevec) TO postgres;
GRANT ALL ON FUNCTION public.sparsevec_le(public.sparsevec, public.sparsevec) TO anon;
GRANT ALL ON FUNCTION public.sparsevec_le(public.sparsevec, public.sparsevec) TO authenticated;
GRANT ALL ON FUNCTION public.sparsevec_le(public.sparsevec, public.sparsevec) TO service_role;


--
-- Name: FUNCTION sparsevec_lt(public.sparsevec, public.sparsevec); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.sparsevec_lt(public.sparsevec, public.sparsevec) TO postgres;
GRANT ALL ON FUNCTION public.sparsevec_lt(public.sparsevec, public.sparsevec) TO anon;
GRANT ALL ON FUNCTION public.sparsevec_lt(public.sparsevec, public.sparsevec) TO authenticated;
GRANT ALL ON FUNCTION public.sparsevec_lt(public.sparsevec, public.sparsevec) TO service_role;


--
-- Name: FUNCTION sparsevec_ne(public.sparsevec, public.sparsevec); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.sparsevec_ne(public.sparsevec, public.sparsevec) TO postgres;
GRANT ALL ON FUNCTION public.sparsevec_ne(public.sparsevec, public.sparsevec) TO anon;
GRANT ALL ON FUNCTION public.sparsevec_ne(public.sparsevec, public.sparsevec) TO authenticated;
GRANT ALL ON FUNCTION public.sparsevec_ne(public.sparsevec, public.sparsevec) TO service_role;


--
-- Name: FUNCTION sparsevec_negative_inner_product(public.sparsevec, public.sparsevec); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.sparsevec_negative_inner_product(public.sparsevec, public.sparsevec) TO postgres;
GRANT ALL ON FUNCTION public.sparsevec_negative_inner_product(public.sparsevec, public.sparsevec) TO anon;
GRANT ALL ON FUNCTION public.sparsevec_negative_inner_product(public.sparsevec, public.sparsevec) TO authenticated;
GRANT ALL ON FUNCTION public.sparsevec_negative_inner_product(public.sparsevec, public.sparsevec) TO service_role;


--
-- Name: FUNCTION st_3dclosestpoint(geom1 public.geometry, geom2 public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_3dclosestpoint(geom1 public.geometry, geom2 public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.st_3dclosestpoint(geom1 public.geometry, geom2 public.geometry) TO anon;
GRANT ALL ON FUNCTION public.st_3dclosestpoint(geom1 public.geometry, geom2 public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.st_3dclosestpoint(geom1 public.geometry, geom2 public.geometry) TO service_role;


--
-- Name: FUNCTION st_3ddfullywithin(geom1 public.geometry, geom2 public.geometry, double precision); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_3ddfullywithin(geom1 public.geometry, geom2 public.geometry, double precision) TO postgres;
GRANT ALL ON FUNCTION public.st_3ddfullywithin(geom1 public.geometry, geom2 public.geometry, double precision) TO anon;
GRANT ALL ON FUNCTION public.st_3ddfullywithin(geom1 public.geometry, geom2 public.geometry, double precision) TO authenticated;
GRANT ALL ON FUNCTION public.st_3ddfullywithin(geom1 public.geometry, geom2 public.geometry, double precision) TO service_role;


--
-- Name: FUNCTION st_3ddistance(geom1 public.geometry, geom2 public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_3ddistance(geom1 public.geometry, geom2 public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.st_3ddistance(geom1 public.geometry, geom2 public.geometry) TO anon;
GRANT ALL ON FUNCTION public.st_3ddistance(geom1 public.geometry, geom2 public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.st_3ddistance(geom1 public.geometry, geom2 public.geometry) TO service_role;


--
-- Name: FUNCTION st_3ddwithin(geom1 public.geometry, geom2 public.geometry, double precision); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_3ddwithin(geom1 public.geometry, geom2 public.geometry, double precision) TO postgres;
GRANT ALL ON FUNCTION public.st_3ddwithin(geom1 public.geometry, geom2 public.geometry, double precision) TO anon;
GRANT ALL ON FUNCTION public.st_3ddwithin(geom1 public.geometry, geom2 public.geometry, double precision) TO authenticated;
GRANT ALL ON FUNCTION public.st_3ddwithin(geom1 public.geometry, geom2 public.geometry, double precision) TO service_role;


--
-- Name: FUNCTION st_3dintersects(geom1 public.geometry, geom2 public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_3dintersects(geom1 public.geometry, geom2 public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.st_3dintersects(geom1 public.geometry, geom2 public.geometry) TO anon;
GRANT ALL ON FUNCTION public.st_3dintersects(geom1 public.geometry, geom2 public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.st_3dintersects(geom1 public.geometry, geom2 public.geometry) TO service_role;


--
-- Name: FUNCTION st_3dlength(public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_3dlength(public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.st_3dlength(public.geometry) TO anon;
GRANT ALL ON FUNCTION public.st_3dlength(public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.st_3dlength(public.geometry) TO service_role;


--
-- Name: FUNCTION st_3dlineinterpolatepoint(public.geometry, double precision); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_3dlineinterpolatepoint(public.geometry, double precision) TO postgres;
GRANT ALL ON FUNCTION public.st_3dlineinterpolatepoint(public.geometry, double precision) TO anon;
GRANT ALL ON FUNCTION public.st_3dlineinterpolatepoint(public.geometry, double precision) TO authenticated;
GRANT ALL ON FUNCTION public.st_3dlineinterpolatepoint(public.geometry, double precision) TO service_role;


--
-- Name: FUNCTION st_3dlongestline(geom1 public.geometry, geom2 public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_3dlongestline(geom1 public.geometry, geom2 public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.st_3dlongestline(geom1 public.geometry, geom2 public.geometry) TO anon;
GRANT ALL ON FUNCTION public.st_3dlongestline(geom1 public.geometry, geom2 public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.st_3dlongestline(geom1 public.geometry, geom2 public.geometry) TO service_role;


--
-- Name: FUNCTION st_3dmakebox(geom1 public.geometry, geom2 public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_3dmakebox(geom1 public.geometry, geom2 public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.st_3dmakebox(geom1 public.geometry, geom2 public.geometry) TO anon;
GRANT ALL ON FUNCTION public.st_3dmakebox(geom1 public.geometry, geom2 public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.st_3dmakebox(geom1 public.geometry, geom2 public.geometry) TO service_role;


--
-- Name: FUNCTION st_3dmaxdistance(geom1 public.geometry, geom2 public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_3dmaxdistance(geom1 public.geometry, geom2 public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.st_3dmaxdistance(geom1 public.geometry, geom2 public.geometry) TO anon;
GRANT ALL ON FUNCTION public.st_3dmaxdistance(geom1 public.geometry, geom2 public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.st_3dmaxdistance(geom1 public.geometry, geom2 public.geometry) TO service_role;


--
-- Name: FUNCTION st_3dperimeter(public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_3dperimeter(public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.st_3dperimeter(public.geometry) TO anon;
GRANT ALL ON FUNCTION public.st_3dperimeter(public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.st_3dperimeter(public.geometry) TO service_role;


--
-- Name: FUNCTION st_3dshortestline(geom1 public.geometry, geom2 public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_3dshortestline(geom1 public.geometry, geom2 public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.st_3dshortestline(geom1 public.geometry, geom2 public.geometry) TO anon;
GRANT ALL ON FUNCTION public.st_3dshortestline(geom1 public.geometry, geom2 public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.st_3dshortestline(geom1 public.geometry, geom2 public.geometry) TO service_role;


--
-- Name: FUNCTION st_addmeasure(public.geometry, double precision, double precision); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_addmeasure(public.geometry, double precision, double precision) TO postgres;
GRANT ALL ON FUNCTION public.st_addmeasure(public.geometry, double precision, double precision) TO anon;
GRANT ALL ON FUNCTION public.st_addmeasure(public.geometry, double precision, double precision) TO authenticated;
GRANT ALL ON FUNCTION public.st_addmeasure(public.geometry, double precision, double precision) TO service_role;


--
-- Name: FUNCTION st_addpoint(geom1 public.geometry, geom2 public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_addpoint(geom1 public.geometry, geom2 public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.st_addpoint(geom1 public.geometry, geom2 public.geometry) TO anon;
GRANT ALL ON FUNCTION public.st_addpoint(geom1 public.geometry, geom2 public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.st_addpoint(geom1 public.geometry, geom2 public.geometry) TO service_role;


--
-- Name: FUNCTION st_addpoint(geom1 public.geometry, geom2 public.geometry, integer); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_addpoint(geom1 public.geometry, geom2 public.geometry, integer) TO postgres;
GRANT ALL ON FUNCTION public.st_addpoint(geom1 public.geometry, geom2 public.geometry, integer) TO anon;
GRANT ALL ON FUNCTION public.st_addpoint(geom1 public.geometry, geom2 public.geometry, integer) TO authenticated;
GRANT ALL ON FUNCTION public.st_addpoint(geom1 public.geometry, geom2 public.geometry, integer) TO service_role;


--
-- Name: FUNCTION st_affine(public.geometry, double precision, double precision, double precision, double precision, double precision, double precision); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_affine(public.geometry, double precision, double precision, double precision, double precision, double precision, double precision) TO postgres;
GRANT ALL ON FUNCTION public.st_affine(public.geometry, double precision, double precision, double precision, double precision, double precision, double precision) TO anon;
GRANT ALL ON FUNCTION public.st_affine(public.geometry, double precision, double precision, double precision, double precision, double precision, double precision) TO authenticated;
GRANT ALL ON FUNCTION public.st_affine(public.geometry, double precision, double precision, double precision, double precision, double precision, double precision) TO service_role;


--
-- Name: FUNCTION st_affine(public.geometry, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_affine(public.geometry, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision) TO postgres;
GRANT ALL ON FUNCTION public.st_affine(public.geometry, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision) TO anon;
GRANT ALL ON FUNCTION public.st_affine(public.geometry, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision) TO authenticated;
GRANT ALL ON FUNCTION public.st_affine(public.geometry, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision, double precision) TO service_role;


--
-- Name: FUNCTION st_angle(line1 public.geometry, line2 public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_angle(line1 public.geometry, line2 public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.st_angle(line1 public.geometry, line2 public.geometry) TO anon;
GRANT ALL ON FUNCTION public.st_angle(line1 public.geometry, line2 public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.st_angle(line1 public.geometry, line2 public.geometry) TO service_role;


--
-- Name: FUNCTION st_angle(pt1 public.geometry, pt2 public.geometry, pt3 public.geometry, pt4 public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_angle(pt1 public.geometry, pt2 public.geometry, pt3 public.geometry, pt4 public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.st_angle(pt1 public.geometry, pt2 public.geometry, pt3 public.geometry, pt4 public.geometry) TO anon;
GRANT ALL ON FUNCTION public.st_angle(pt1 public.geometry, pt2 public.geometry, pt3 public.geometry, pt4 public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.st_angle(pt1 public.geometry, pt2 public.geometry, pt3 public.geometry, pt4 public.geometry) TO service_role;


--
-- Name: FUNCTION st_area(text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_area(text) TO postgres;
GRANT ALL ON FUNCTION public.st_area(text) TO anon;
GRANT ALL ON FUNCTION public.st_area(text) TO authenticated;
GRANT ALL ON FUNCTION public.st_area(text) TO service_role;


--
-- Name: FUNCTION st_area(public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_area(public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.st_area(public.geometry) TO anon;
GRANT ALL ON FUNCTION public.st_area(public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.st_area(public.geometry) TO service_role;


--
-- Name: FUNCTION st_area(geog public.geography, use_spheroid boolean); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_area(geog public.geography, use_spheroid boolean) TO postgres;
GRANT ALL ON FUNCTION public.st_area(geog public.geography, use_spheroid boolean) TO anon;
GRANT ALL ON FUNCTION public.st_area(geog public.geography, use_spheroid boolean) TO authenticated;
GRANT ALL ON FUNCTION public.st_area(geog public.geography, use_spheroid boolean) TO service_role;


--
-- Name: FUNCTION st_area2d(public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_area2d(public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.st_area2d(public.geometry) TO anon;
GRANT ALL ON FUNCTION public.st_area2d(public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.st_area2d(public.geometry) TO service_role;


--
-- Name: FUNCTION st_asbinary(public.geography); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_asbinary(public.geography) TO postgres;
GRANT ALL ON FUNCTION public.st_asbinary(public.geography) TO anon;
GRANT ALL ON FUNCTION public.st_asbinary(public.geography) TO authenticated;
GRANT ALL ON FUNCTION public.st_asbinary(public.geography) TO service_role;


--
-- Name: FUNCTION st_asbinary(public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_asbinary(public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.st_asbinary(public.geometry) TO anon;
GRANT ALL ON FUNCTION public.st_asbinary(public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.st_asbinary(public.geometry) TO service_role;


--
-- Name: FUNCTION st_asbinary(public.geography, text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_asbinary(public.geography, text) TO postgres;
GRANT ALL ON FUNCTION public.st_asbinary(public.geography, text) TO anon;
GRANT ALL ON FUNCTION public.st_asbinary(public.geography, text) TO authenticated;
GRANT ALL ON FUNCTION public.st_asbinary(public.geography, text) TO service_role;


--
-- Name: FUNCTION st_asbinary(public.geometry, text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_asbinary(public.geometry, text) TO postgres;
GRANT ALL ON FUNCTION public.st_asbinary(public.geometry, text) TO anon;
GRANT ALL ON FUNCTION public.st_asbinary(public.geometry, text) TO authenticated;
GRANT ALL ON FUNCTION public.st_asbinary(public.geometry, text) TO service_role;


--
-- Name: FUNCTION st_asencodedpolyline(geom public.geometry, nprecision integer); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_asencodedpolyline(geom public.geometry, nprecision integer) TO postgres;
GRANT ALL ON FUNCTION public.st_asencodedpolyline(geom public.geometry, nprecision integer) TO anon;
GRANT ALL ON FUNCTION public.st_asencodedpolyline(geom public.geometry, nprecision integer) TO authenticated;
GRANT ALL ON FUNCTION public.st_asencodedpolyline(geom public.geometry, nprecision integer) TO service_role;


--
-- Name: FUNCTION st_asewkb(public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_asewkb(public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.st_asewkb(public.geometry) TO anon;
GRANT ALL ON FUNCTION public.st_asewkb(public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.st_asewkb(public.geometry) TO service_role;


--
-- Name: FUNCTION st_asewkb(public.geometry, text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_asewkb(public.geometry, text) TO postgres;
GRANT ALL ON FUNCTION public.st_asewkb(public.geometry, text) TO anon;
GRANT ALL ON FUNCTION public.st_asewkb(public.geometry, text) TO authenticated;
GRANT ALL ON FUNCTION public.st_asewkb(public.geometry, text) TO service_role;


--
-- Name: FUNCTION st_asewkt(text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_asewkt(text) TO postgres;
GRANT ALL ON FUNCTION public.st_asewkt(text) TO anon;
GRANT ALL ON FUNCTION public.st_asewkt(text) TO authenticated;
GRANT ALL ON FUNCTION public.st_asewkt(text) TO service_role;


--
-- Name: FUNCTION st_asewkt(public.geography); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_asewkt(public.geography) TO postgres;
GRANT ALL ON FUNCTION public.st_asewkt(public.geography) TO anon;
GRANT ALL ON FUNCTION public.st_asewkt(public.geography) TO authenticated;
GRANT ALL ON FUNCTION public.st_asewkt(public.geography) TO service_role;


--
-- Name: FUNCTION st_asewkt(public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_asewkt(public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.st_asewkt(public.geometry) TO anon;
GRANT ALL ON FUNCTION public.st_asewkt(public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.st_asewkt(public.geometry) TO service_role;


--
-- Name: FUNCTION st_asewkt(public.geography, integer); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_asewkt(public.geography, integer) TO postgres;
GRANT ALL ON FUNCTION public.st_asewkt(public.geography, integer) TO anon;
GRANT ALL ON FUNCTION public.st_asewkt(public.geography, integer) TO authenticated;
GRANT ALL ON FUNCTION public.st_asewkt(public.geography, integer) TO service_role;


--
-- Name: FUNCTION st_asewkt(public.geometry, integer); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_asewkt(public.geometry, integer) TO postgres;
GRANT ALL ON FUNCTION public.st_asewkt(public.geometry, integer) TO anon;
GRANT ALL ON FUNCTION public.st_asewkt(public.geometry, integer) TO authenticated;
GRANT ALL ON FUNCTION public.st_asewkt(public.geometry, integer) TO service_role;


--
-- Name: FUNCTION st_asgeojson(text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_asgeojson(text) TO postgres;
GRANT ALL ON FUNCTION public.st_asgeojson(text) TO anon;
GRANT ALL ON FUNCTION public.st_asgeojson(text) TO authenticated;
GRANT ALL ON FUNCTION public.st_asgeojson(text) TO service_role;


--
-- Name: FUNCTION st_asgeojson(geog public.geography, maxdecimaldigits integer, options integer); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_asgeojson(geog public.geography, maxdecimaldigits integer, options integer) TO postgres;
GRANT ALL ON FUNCTION public.st_asgeojson(geog public.geography, maxdecimaldigits integer, options integer) TO anon;
GRANT ALL ON FUNCTION public.st_asgeojson(geog public.geography, maxdecimaldigits integer, options integer) TO authenticated;
GRANT ALL ON FUNCTION public.st_asgeojson(geog public.geography, maxdecimaldigits integer, options integer) TO service_role;


--
-- Name: FUNCTION st_asgeojson(geom public.geometry, maxdecimaldigits integer, options integer); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_asgeojson(geom public.geometry, maxdecimaldigits integer, options integer) TO postgres;
GRANT ALL ON FUNCTION public.st_asgeojson(geom public.geometry, maxdecimaldigits integer, options integer) TO anon;
GRANT ALL ON FUNCTION public.st_asgeojson(geom public.geometry, maxdecimaldigits integer, options integer) TO authenticated;
GRANT ALL ON FUNCTION public.st_asgeojson(geom public.geometry, maxdecimaldigits integer, options integer) TO service_role;


--
-- Name: FUNCTION st_asgeojson(r record, geom_column text, maxdecimaldigits integer, pretty_bool boolean); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_asgeojson(r record, geom_column text, maxdecimaldigits integer, pretty_bool boolean) TO postgres;
GRANT ALL ON FUNCTION public.st_asgeojson(r record, geom_column text, maxdecimaldigits integer, pretty_bool boolean) TO anon;
GRANT ALL ON FUNCTION public.st_asgeojson(r record, geom_column text, maxdecimaldigits integer, pretty_bool boolean) TO authenticated;
GRANT ALL ON FUNCTION public.st_asgeojson(r record, geom_column text, maxdecimaldigits integer, pretty_bool boolean) TO service_role;


--
-- Name: FUNCTION st_asgml(text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_asgml(text) TO postgres;
GRANT ALL ON FUNCTION public.st_asgml(text) TO anon;
GRANT ALL ON FUNCTION public.st_asgml(text) TO authenticated;
GRANT ALL ON FUNCTION public.st_asgml(text) TO service_role;


--
-- Name: FUNCTION st_asgml(geom public.geometry, maxdecimaldigits integer, options integer); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_asgml(geom public.geometry, maxdecimaldigits integer, options integer) TO postgres;
GRANT ALL ON FUNCTION public.st_asgml(geom public.geometry, maxdecimaldigits integer, options integer) TO anon;
GRANT ALL ON FUNCTION public.st_asgml(geom public.geometry, maxdecimaldigits integer, options integer) TO authenticated;
GRANT ALL ON FUNCTION public.st_asgml(geom public.geometry, maxdecimaldigits integer, options integer) TO service_role;


--
-- Name: FUNCTION st_asgml(geog public.geography, maxdecimaldigits integer, options integer, nprefix text, id text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_asgml(geog public.geography, maxdecimaldigits integer, options integer, nprefix text, id text) TO postgres;
GRANT ALL ON FUNCTION public.st_asgml(geog public.geography, maxdecimaldigits integer, options integer, nprefix text, id text) TO anon;
GRANT ALL ON FUNCTION public.st_asgml(geog public.geography, maxdecimaldigits integer, options integer, nprefix text, id text) TO authenticated;
GRANT ALL ON FUNCTION public.st_asgml(geog public.geography, maxdecimaldigits integer, options integer, nprefix text, id text) TO service_role;


--
-- Name: FUNCTION st_asgml(version integer, geog public.geography, maxdecimaldigits integer, options integer, nprefix text, id text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_asgml(version integer, geog public.geography, maxdecimaldigits integer, options integer, nprefix text, id text) TO postgres;
GRANT ALL ON FUNCTION public.st_asgml(version integer, geog public.geography, maxdecimaldigits integer, options integer, nprefix text, id text) TO anon;
GRANT ALL ON FUNCTION public.st_asgml(version integer, geog public.geography, maxdecimaldigits integer, options integer, nprefix text, id text) TO authenticated;
GRANT ALL ON FUNCTION public.st_asgml(version integer, geog public.geography, maxdecimaldigits integer, options integer, nprefix text, id text) TO service_role;


--
-- Name: FUNCTION st_asgml(version integer, geom public.geometry, maxdecimaldigits integer, options integer, nprefix text, id text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_asgml(version integer, geom public.geometry, maxdecimaldigits integer, options integer, nprefix text, id text) TO postgres;
GRANT ALL ON FUNCTION public.st_asgml(version integer, geom public.geometry, maxdecimaldigits integer, options integer, nprefix text, id text) TO anon;
GRANT ALL ON FUNCTION public.st_asgml(version integer, geom public.geometry, maxdecimaldigits integer, options integer, nprefix text, id text) TO authenticated;
GRANT ALL ON FUNCTION public.st_asgml(version integer, geom public.geometry, maxdecimaldigits integer, options integer, nprefix text, id text) TO service_role;


--
-- Name: FUNCTION st_ashexewkb(public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_ashexewkb(public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.st_ashexewkb(public.geometry) TO anon;
GRANT ALL ON FUNCTION public.st_ashexewkb(public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.st_ashexewkb(public.geometry) TO service_role;


--
-- Name: FUNCTION st_ashexewkb(public.geometry, text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_ashexewkb(public.geometry, text) TO postgres;
GRANT ALL ON FUNCTION public.st_ashexewkb(public.geometry, text) TO anon;
GRANT ALL ON FUNCTION public.st_ashexewkb(public.geometry, text) TO authenticated;
GRANT ALL ON FUNCTION public.st_ashexewkb(public.geometry, text) TO service_role;


--
-- Name: FUNCTION st_askml(text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_askml(text) TO postgres;
GRANT ALL ON FUNCTION public.st_askml(text) TO anon;
GRANT ALL ON FUNCTION public.st_askml(text) TO authenticated;
GRANT ALL ON FUNCTION public.st_askml(text) TO service_role;


--
-- Name: FUNCTION st_askml(geog public.geography, maxdecimaldigits integer, nprefix text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_askml(geog public.geography, maxdecimaldigits integer, nprefix text) TO postgres;
GRANT ALL ON FUNCTION public.st_askml(geog public.geography, maxdecimaldigits integer, nprefix text) TO anon;
GRANT ALL ON FUNCTION public.st_askml(geog public.geography, maxdecimaldigits integer, nprefix text) TO authenticated;
GRANT ALL ON FUNCTION public.st_askml(geog public.geography, maxdecimaldigits integer, nprefix text) TO service_role;


--
-- Name: FUNCTION st_askml(geom public.geometry, maxdecimaldigits integer, nprefix text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_askml(geom public.geometry, maxdecimaldigits integer, nprefix text) TO postgres;
GRANT ALL ON FUNCTION public.st_askml(geom public.geometry, maxdecimaldigits integer, nprefix text) TO anon;
GRANT ALL ON FUNCTION public.st_askml(geom public.geometry, maxdecimaldigits integer, nprefix text) TO authenticated;
GRANT ALL ON FUNCTION public.st_askml(geom public.geometry, maxdecimaldigits integer, nprefix text) TO service_role;


--
-- Name: FUNCTION st_aslatlontext(geom public.geometry, tmpl text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_aslatlontext(geom public.geometry, tmpl text) TO postgres;
GRANT ALL ON FUNCTION public.st_aslatlontext(geom public.geometry, tmpl text) TO anon;
GRANT ALL ON FUNCTION public.st_aslatlontext(geom public.geometry, tmpl text) TO authenticated;
GRANT ALL ON FUNCTION public.st_aslatlontext(geom public.geometry, tmpl text) TO service_role;


--
-- Name: FUNCTION st_asmarc21(geom public.geometry, format text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_asmarc21(geom public.geometry, format text) TO postgres;
GRANT ALL ON FUNCTION public.st_asmarc21(geom public.geometry, format text) TO anon;
GRANT ALL ON FUNCTION public.st_asmarc21(geom public.geometry, format text) TO authenticated;
GRANT ALL ON FUNCTION public.st_asmarc21(geom public.geometry, format text) TO service_role;


--
-- Name: FUNCTION st_asmvtgeom(geom public.geometry, bounds public.box2d, extent integer, buffer integer, clip_geom boolean); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_asmvtgeom(geom public.geometry, bounds public.box2d, extent integer, buffer integer, clip_geom boolean) TO postgres;
GRANT ALL ON FUNCTION public.st_asmvtgeom(geom public.geometry, bounds public.box2d, extent integer, buffer integer, clip_geom boolean) TO anon;
GRANT ALL ON FUNCTION public.st_asmvtgeom(geom public.geometry, bounds public.box2d, extent integer, buffer integer, clip_geom boolean) TO authenticated;
GRANT ALL ON FUNCTION public.st_asmvtgeom(geom public.geometry, bounds public.box2d, extent integer, buffer integer, clip_geom boolean) TO service_role;


--
-- Name: FUNCTION st_assvg(text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_assvg(text) TO postgres;
GRANT ALL ON FUNCTION public.st_assvg(text) TO anon;
GRANT ALL ON FUNCTION public.st_assvg(text) TO authenticated;
GRANT ALL ON FUNCTION public.st_assvg(text) TO service_role;


--
-- Name: FUNCTION st_assvg(geog public.geography, rel integer, maxdecimaldigits integer); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_assvg(geog public.geography, rel integer, maxdecimaldigits integer) TO postgres;
GRANT ALL ON FUNCTION public.st_assvg(geog public.geography, rel integer, maxdecimaldigits integer) TO anon;
GRANT ALL ON FUNCTION public.st_assvg(geog public.geography, rel integer, maxdecimaldigits integer) TO authenticated;
GRANT ALL ON FUNCTION public.st_assvg(geog public.geography, rel integer, maxdecimaldigits integer) TO service_role;


--
-- Name: FUNCTION st_assvg(geom public.geometry, rel integer, maxdecimaldigits integer); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_assvg(geom public.geometry, rel integer, maxdecimaldigits integer) TO postgres;
GRANT ALL ON FUNCTION public.st_assvg(geom public.geometry, rel integer, maxdecimaldigits integer) TO anon;
GRANT ALL ON FUNCTION public.st_assvg(geom public.geometry, rel integer, maxdecimaldigits integer) TO authenticated;
GRANT ALL ON FUNCTION public.st_assvg(geom public.geometry, rel integer, maxdecimaldigits integer) TO service_role;


--
-- Name: FUNCTION st_astext(text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_astext(text) TO postgres;
GRANT ALL ON FUNCTION public.st_astext(text) TO anon;
GRANT ALL ON FUNCTION public.st_astext(text) TO authenticated;
GRANT ALL ON FUNCTION public.st_astext(text) TO service_role;


--
-- Name: FUNCTION st_astext(public.geography); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_astext(public.geography) TO postgres;
GRANT ALL ON FUNCTION public.st_astext(public.geography) TO anon;
GRANT ALL ON FUNCTION public.st_astext(public.geography) TO authenticated;
GRANT ALL ON FUNCTION public.st_astext(public.geography) TO service_role;


--
-- Name: FUNCTION st_astext(public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_astext(public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.st_astext(public.geometry) TO anon;
GRANT ALL ON FUNCTION public.st_astext(public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.st_astext(public.geometry) TO service_role;


--
-- Name: FUNCTION st_astext(public.geography, integer); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_astext(public.geography, integer) TO postgres;
GRANT ALL ON FUNCTION public.st_astext(public.geography, integer) TO anon;
GRANT ALL ON FUNCTION public.st_astext(public.geography, integer) TO authenticated;
GRANT ALL ON FUNCTION public.st_astext(public.geography, integer) TO service_role;


--
-- Name: FUNCTION st_astext(public.geometry, integer); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_astext(public.geometry, integer) TO postgres;
GRANT ALL ON FUNCTION public.st_astext(public.geometry, integer) TO anon;
GRANT ALL ON FUNCTION public.st_astext(public.geometry, integer) TO authenticated;
GRANT ALL ON FUNCTION public.st_astext(public.geometry, integer) TO service_role;


--
-- Name: FUNCTION st_astwkb(geom public.geometry, prec integer, prec_z integer, prec_m integer, with_sizes boolean, with_boxes boolean); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_astwkb(geom public.geometry, prec integer, prec_z integer, prec_m integer, with_sizes boolean, with_boxes boolean) TO postgres;
GRANT ALL ON FUNCTION public.st_astwkb(geom public.geometry, prec integer, prec_z integer, prec_m integer, with_sizes boolean, with_boxes boolean) TO anon;
GRANT ALL ON FUNCTION public.st_astwkb(geom public.geometry, prec integer, prec_z integer, prec_m integer, with_sizes boolean, with_boxes boolean) TO authenticated;
GRANT ALL ON FUNCTION public.st_astwkb(geom public.geometry, prec integer, prec_z integer, prec_m integer, with_sizes boolean, with_boxes boolean) TO service_role;


--
-- Name: FUNCTION st_astwkb(geom public.geometry[], ids bigint[], prec integer, prec_z integer, prec_m integer, with_sizes boolean, with_boxes boolean); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_astwkb(geom public.geometry[], ids bigint[], prec integer, prec_z integer, prec_m integer, with_sizes boolean, with_boxes boolean) TO postgres;
GRANT ALL ON FUNCTION public.st_astwkb(geom public.geometry[], ids bigint[], prec integer, prec_z integer, prec_m integer, with_sizes boolean, with_boxes boolean) TO anon;
GRANT ALL ON FUNCTION public.st_astwkb(geom public.geometry[], ids bigint[], prec integer, prec_z integer, prec_m integer, with_sizes boolean, with_boxes boolean) TO authenticated;
GRANT ALL ON FUNCTION public.st_astwkb(geom public.geometry[], ids bigint[], prec integer, prec_z integer, prec_m integer, with_sizes boolean, with_boxes boolean) TO service_role;


--
-- Name: FUNCTION st_asx3d(geom public.geometry, maxdecimaldigits integer, options integer); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_asx3d(geom public.geometry, maxdecimaldigits integer, options integer) TO postgres;
GRANT ALL ON FUNCTION public.st_asx3d(geom public.geometry, maxdecimaldigits integer, options integer) TO anon;
GRANT ALL ON FUNCTION public.st_asx3d(geom public.geometry, maxdecimaldigits integer, options integer) TO authenticated;
GRANT ALL ON FUNCTION public.st_asx3d(geom public.geometry, maxdecimaldigits integer, options integer) TO service_role;


--
-- Name: FUNCTION st_azimuth(geog1 public.geography, geog2 public.geography); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_azimuth(geog1 public.geography, geog2 public.geography) TO postgres;
GRANT ALL ON FUNCTION public.st_azimuth(geog1 public.geography, geog2 public.geography) TO anon;
GRANT ALL ON FUNCTION public.st_azimuth(geog1 public.geography, geog2 public.geography) TO authenticated;
GRANT ALL ON FUNCTION public.st_azimuth(geog1 public.geography, geog2 public.geography) TO service_role;


--
-- Name: FUNCTION st_azimuth(geom1 public.geometry, geom2 public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_azimuth(geom1 public.geometry, geom2 public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.st_azimuth(geom1 public.geometry, geom2 public.geometry) TO anon;
GRANT ALL ON FUNCTION public.st_azimuth(geom1 public.geometry, geom2 public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.st_azimuth(geom1 public.geometry, geom2 public.geometry) TO service_role;


--
-- Name: FUNCTION st_bdmpolyfromtext(text, integer); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_bdmpolyfromtext(text, integer) TO postgres;
GRANT ALL ON FUNCTION public.st_bdmpolyfromtext(text, integer) TO anon;
GRANT ALL ON FUNCTION public.st_bdmpolyfromtext(text, integer) TO authenticated;
GRANT ALL ON FUNCTION public.st_bdmpolyfromtext(text, integer) TO service_role;


--
-- Name: FUNCTION st_bdpolyfromtext(text, integer); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_bdpolyfromtext(text, integer) TO postgres;
GRANT ALL ON FUNCTION public.st_bdpolyfromtext(text, integer) TO anon;
GRANT ALL ON FUNCTION public.st_bdpolyfromtext(text, integer) TO authenticated;
GRANT ALL ON FUNCTION public.st_bdpolyfromtext(text, integer) TO service_role;


--
-- Name: FUNCTION st_boundary(public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_boundary(public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.st_boundary(public.geometry) TO anon;
GRANT ALL ON FUNCTION public.st_boundary(public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.st_boundary(public.geometry) TO service_role;


--
-- Name: FUNCTION st_boundingdiagonal(geom public.geometry, fits boolean); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_boundingdiagonal(geom public.geometry, fits boolean) TO postgres;
GRANT ALL ON FUNCTION public.st_boundingdiagonal(geom public.geometry, fits boolean) TO anon;
GRANT ALL ON FUNCTION public.st_boundingdiagonal(geom public.geometry, fits boolean) TO authenticated;
GRANT ALL ON FUNCTION public.st_boundingdiagonal(geom public.geometry, fits boolean) TO service_role;


--
-- Name: FUNCTION st_box2dfromgeohash(text, integer); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_box2dfromgeohash(text, integer) TO postgres;
GRANT ALL ON FUNCTION public.st_box2dfromgeohash(text, integer) TO anon;
GRANT ALL ON FUNCTION public.st_box2dfromgeohash(text, integer) TO authenticated;
GRANT ALL ON FUNCTION public.st_box2dfromgeohash(text, integer) TO service_role;


--
-- Name: FUNCTION st_buffer(text, double precision); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_buffer(text, double precision) TO postgres;
GRANT ALL ON FUNCTION public.st_buffer(text, double precision) TO anon;
GRANT ALL ON FUNCTION public.st_buffer(text, double precision) TO authenticated;
GRANT ALL ON FUNCTION public.st_buffer(text, double precision) TO service_role;


--
-- Name: FUNCTION st_buffer(public.geography, double precision); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_buffer(public.geography, double precision) TO postgres;
GRANT ALL ON FUNCTION public.st_buffer(public.geography, double precision) TO anon;
GRANT ALL ON FUNCTION public.st_buffer(public.geography, double precision) TO authenticated;
GRANT ALL ON FUNCTION public.st_buffer(public.geography, double precision) TO service_role;


--
-- Name: FUNCTION st_buffer(text, double precision, integer); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_buffer(text, double precision, integer) TO postgres;
GRANT ALL ON FUNCTION public.st_buffer(text, double precision, integer) TO anon;
GRANT ALL ON FUNCTION public.st_buffer(text, double precision, integer) TO authenticated;
GRANT ALL ON FUNCTION public.st_buffer(text, double precision, integer) TO service_role;


--
-- Name: FUNCTION st_buffer(text, double precision, text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_buffer(text, double precision, text) TO postgres;
GRANT ALL ON FUNCTION public.st_buffer(text, double precision, text) TO anon;
GRANT ALL ON FUNCTION public.st_buffer(text, double precision, text) TO authenticated;
GRANT ALL ON FUNCTION public.st_buffer(text, double precision, text) TO service_role;


--
-- Name: FUNCTION st_buffer(public.geography, double precision, integer); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_buffer(public.geography, double precision, integer) TO postgres;
GRANT ALL ON FUNCTION public.st_buffer(public.geography, double precision, integer) TO anon;
GRANT ALL ON FUNCTION public.st_buffer(public.geography, double precision, integer) TO authenticated;
GRANT ALL ON FUNCTION public.st_buffer(public.geography, double precision, integer) TO service_role;


--
-- Name: FUNCTION st_buffer(public.geography, double precision, text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_buffer(public.geography, double precision, text) TO postgres;
GRANT ALL ON FUNCTION public.st_buffer(public.geography, double precision, text) TO anon;
GRANT ALL ON FUNCTION public.st_buffer(public.geography, double precision, text) TO authenticated;
GRANT ALL ON FUNCTION public.st_buffer(public.geography, double precision, text) TO service_role;


--
-- Name: FUNCTION st_buffer(geom public.geometry, radius double precision, quadsegs integer); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_buffer(geom public.geometry, radius double precision, quadsegs integer) TO postgres;
GRANT ALL ON FUNCTION public.st_buffer(geom public.geometry, radius double precision, quadsegs integer) TO anon;
GRANT ALL ON FUNCTION public.st_buffer(geom public.geometry, radius double precision, quadsegs integer) TO authenticated;
GRANT ALL ON FUNCTION public.st_buffer(geom public.geometry, radius double precision, quadsegs integer) TO service_role;


--
-- Name: FUNCTION st_buffer(geom public.geometry, radius double precision, options text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_buffer(geom public.geometry, radius double precision, options text) TO postgres;
GRANT ALL ON FUNCTION public.st_buffer(geom public.geometry, radius double precision, options text) TO anon;
GRANT ALL ON FUNCTION public.st_buffer(geom public.geometry, radius double precision, options text) TO authenticated;
GRANT ALL ON FUNCTION public.st_buffer(geom public.geometry, radius double precision, options text) TO service_role;


--
-- Name: FUNCTION st_buildarea(public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_buildarea(public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.st_buildarea(public.geometry) TO anon;
GRANT ALL ON FUNCTION public.st_buildarea(public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.st_buildarea(public.geometry) TO service_role;


--
-- Name: FUNCTION st_centroid(text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_centroid(text) TO postgres;
GRANT ALL ON FUNCTION public.st_centroid(text) TO anon;
GRANT ALL ON FUNCTION public.st_centroid(text) TO authenticated;
GRANT ALL ON FUNCTION public.st_centroid(text) TO service_role;


--
-- Name: FUNCTION st_centroid(public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_centroid(public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.st_centroid(public.geometry) TO anon;
GRANT ALL ON FUNCTION public.st_centroid(public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.st_centroid(public.geometry) TO service_role;


--
-- Name: FUNCTION st_centroid(public.geography, use_spheroid boolean); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_centroid(public.geography, use_spheroid boolean) TO postgres;
GRANT ALL ON FUNCTION public.st_centroid(public.geography, use_spheroid boolean) TO anon;
GRANT ALL ON FUNCTION public.st_centroid(public.geography, use_spheroid boolean) TO authenticated;
GRANT ALL ON FUNCTION public.st_centroid(public.geography, use_spheroid boolean) TO service_role;


--
-- Name: FUNCTION st_chaikinsmoothing(public.geometry, integer, boolean); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_chaikinsmoothing(public.geometry, integer, boolean) TO postgres;
GRANT ALL ON FUNCTION public.st_chaikinsmoothing(public.geometry, integer, boolean) TO anon;
GRANT ALL ON FUNCTION public.st_chaikinsmoothing(public.geometry, integer, boolean) TO authenticated;
GRANT ALL ON FUNCTION public.st_chaikinsmoothing(public.geometry, integer, boolean) TO service_role;


--
-- Name: FUNCTION st_cleangeometry(public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_cleangeometry(public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.st_cleangeometry(public.geometry) TO anon;
GRANT ALL ON FUNCTION public.st_cleangeometry(public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.st_cleangeometry(public.geometry) TO service_role;


--
-- Name: FUNCTION st_clipbybox2d(geom public.geometry, box public.box2d); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_clipbybox2d(geom public.geometry, box public.box2d) TO postgres;
GRANT ALL ON FUNCTION public.st_clipbybox2d(geom public.geometry, box public.box2d) TO anon;
GRANT ALL ON FUNCTION public.st_clipbybox2d(geom public.geometry, box public.box2d) TO authenticated;
GRANT ALL ON FUNCTION public.st_clipbybox2d(geom public.geometry, box public.box2d) TO service_role;


--
-- Name: FUNCTION st_closestpoint(geom1 public.geometry, geom2 public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_closestpoint(geom1 public.geometry, geom2 public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.st_closestpoint(geom1 public.geometry, geom2 public.geometry) TO anon;
GRANT ALL ON FUNCTION public.st_closestpoint(geom1 public.geometry, geom2 public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.st_closestpoint(geom1 public.geometry, geom2 public.geometry) TO service_role;


--
-- Name: FUNCTION st_closestpointofapproach(public.geometry, public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_closestpointofapproach(public.geometry, public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.st_closestpointofapproach(public.geometry, public.geometry) TO anon;
GRANT ALL ON FUNCTION public.st_closestpointofapproach(public.geometry, public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.st_closestpointofapproach(public.geometry, public.geometry) TO service_role;


--
-- Name: FUNCTION st_clusterdbscan(public.geometry, eps double precision, minpoints integer); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_clusterdbscan(public.geometry, eps double precision, minpoints integer) TO postgres;
GRANT ALL ON FUNCTION public.st_clusterdbscan(public.geometry, eps double precision, minpoints integer) TO anon;
GRANT ALL ON FUNCTION public.st_clusterdbscan(public.geometry, eps double precision, minpoints integer) TO authenticated;
GRANT ALL ON FUNCTION public.st_clusterdbscan(public.geometry, eps double precision, minpoints integer) TO service_role;


--
-- Name: FUNCTION st_clusterintersecting(public.geometry[]); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_clusterintersecting(public.geometry[]) TO postgres;
GRANT ALL ON FUNCTION public.st_clusterintersecting(public.geometry[]) TO anon;
GRANT ALL ON FUNCTION public.st_clusterintersecting(public.geometry[]) TO authenticated;
GRANT ALL ON FUNCTION public.st_clusterintersecting(public.geometry[]) TO service_role;


--
-- Name: FUNCTION st_clusterkmeans(geom public.geometry, k integer, max_radius double precision); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_clusterkmeans(geom public.geometry, k integer, max_radius double precision) TO postgres;
GRANT ALL ON FUNCTION public.st_clusterkmeans(geom public.geometry, k integer, max_radius double precision) TO anon;
GRANT ALL ON FUNCTION public.st_clusterkmeans(geom public.geometry, k integer, max_radius double precision) TO authenticated;
GRANT ALL ON FUNCTION public.st_clusterkmeans(geom public.geometry, k integer, max_radius double precision) TO service_role;


--
-- Name: FUNCTION st_clusterwithin(public.geometry[], double precision); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_clusterwithin(public.geometry[], double precision) TO postgres;
GRANT ALL ON FUNCTION public.st_clusterwithin(public.geometry[], double precision) TO anon;
GRANT ALL ON FUNCTION public.st_clusterwithin(public.geometry[], double precision) TO authenticated;
GRANT ALL ON FUNCTION public.st_clusterwithin(public.geometry[], double precision) TO service_role;


--
-- Name: FUNCTION st_collect(public.geometry[]); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_collect(public.geometry[]) TO postgres;
GRANT ALL ON FUNCTION public.st_collect(public.geometry[]) TO anon;
GRANT ALL ON FUNCTION public.st_collect(public.geometry[]) TO authenticated;
GRANT ALL ON FUNCTION public.st_collect(public.geometry[]) TO service_role;


--
-- Name: FUNCTION st_collect(geom1 public.geometry, geom2 public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_collect(geom1 public.geometry, geom2 public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.st_collect(geom1 public.geometry, geom2 public.geometry) TO anon;
GRANT ALL ON FUNCTION public.st_collect(geom1 public.geometry, geom2 public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.st_collect(geom1 public.geometry, geom2 public.geometry) TO service_role;


--
-- Name: FUNCTION st_collectionextract(public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_collectionextract(public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.st_collectionextract(public.geometry) TO anon;
GRANT ALL ON FUNCTION public.st_collectionextract(public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.st_collectionextract(public.geometry) TO service_role;


--
-- Name: FUNCTION st_collectionextract(public.geometry, integer); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_collectionextract(public.geometry, integer) TO postgres;
GRANT ALL ON FUNCTION public.st_collectionextract(public.geometry, integer) TO anon;
GRANT ALL ON FUNCTION public.st_collectionextract(public.geometry, integer) TO authenticated;
GRANT ALL ON FUNCTION public.st_collectionextract(public.geometry, integer) TO service_role;


--
-- Name: FUNCTION st_collectionhomogenize(public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_collectionhomogenize(public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.st_collectionhomogenize(public.geometry) TO anon;
GRANT ALL ON FUNCTION public.st_collectionhomogenize(public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.st_collectionhomogenize(public.geometry) TO service_role;


--
-- Name: FUNCTION st_combinebbox(public.box2d, public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_combinebbox(public.box2d, public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.st_combinebbox(public.box2d, public.geometry) TO anon;
GRANT ALL ON FUNCTION public.st_combinebbox(public.box2d, public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.st_combinebbox(public.box2d, public.geometry) TO service_role;


--
-- Name: FUNCTION st_combinebbox(public.box3d, public.box3d); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_combinebbox(public.box3d, public.box3d) TO postgres;
GRANT ALL ON FUNCTION public.st_combinebbox(public.box3d, public.box3d) TO anon;
GRANT ALL ON FUNCTION public.st_combinebbox(public.box3d, public.box3d) TO authenticated;
GRANT ALL ON FUNCTION public.st_combinebbox(public.box3d, public.box3d) TO service_role;


--
-- Name: FUNCTION st_combinebbox(public.box3d, public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_combinebbox(public.box3d, public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.st_combinebbox(public.box3d, public.geometry) TO anon;
GRANT ALL ON FUNCTION public.st_combinebbox(public.box3d, public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.st_combinebbox(public.box3d, public.geometry) TO service_role;


--
-- Name: FUNCTION st_concavehull(param_geom public.geometry, param_pctconvex double precision, param_allow_holes boolean); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_concavehull(param_geom public.geometry, param_pctconvex double precision, param_allow_holes boolean) TO postgres;
GRANT ALL ON FUNCTION public.st_concavehull(param_geom public.geometry, param_pctconvex double precision, param_allow_holes boolean) TO anon;
GRANT ALL ON FUNCTION public.st_concavehull(param_geom public.geometry, param_pctconvex double precision, param_allow_holes boolean) TO authenticated;
GRANT ALL ON FUNCTION public.st_concavehull(param_geom public.geometry, param_pctconvex double precision, param_allow_holes boolean) TO service_role;


--
-- Name: FUNCTION st_contains(geom1 public.geometry, geom2 public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_contains(geom1 public.geometry, geom2 public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.st_contains(geom1 public.geometry, geom2 public.geometry) TO anon;
GRANT ALL ON FUNCTION public.st_contains(geom1 public.geometry, geom2 public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.st_contains(geom1 public.geometry, geom2 public.geometry) TO service_role;


--
-- Name: FUNCTION st_containsproperly(geom1 public.geometry, geom2 public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_containsproperly(geom1 public.geometry, geom2 public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.st_containsproperly(geom1 public.geometry, geom2 public.geometry) TO anon;
GRANT ALL ON FUNCTION public.st_containsproperly(geom1 public.geometry, geom2 public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.st_containsproperly(geom1 public.geometry, geom2 public.geometry) TO service_role;


--
-- Name: FUNCTION st_convexhull(public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_convexhull(public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.st_convexhull(public.geometry) TO anon;
GRANT ALL ON FUNCTION public.st_convexhull(public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.st_convexhull(public.geometry) TO service_role;


--
-- Name: FUNCTION st_coorddim(geometry public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_coorddim(geometry public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.st_coorddim(geometry public.geometry) TO anon;
GRANT ALL ON FUNCTION public.st_coorddim(geometry public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.st_coorddim(geometry public.geometry) TO service_role;


--
-- Name: FUNCTION st_coveredby(text, text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_coveredby(text, text) TO postgres;
GRANT ALL ON FUNCTION public.st_coveredby(text, text) TO anon;
GRANT ALL ON FUNCTION public.st_coveredby(text, text) TO authenticated;
GRANT ALL ON FUNCTION public.st_coveredby(text, text) TO service_role;


--
-- Name: FUNCTION st_coveredby(geog1 public.geography, geog2 public.geography); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_coveredby(geog1 public.geography, geog2 public.geography) TO postgres;
GRANT ALL ON FUNCTION public.st_coveredby(geog1 public.geography, geog2 public.geography) TO anon;
GRANT ALL ON FUNCTION public.st_coveredby(geog1 public.geography, geog2 public.geography) TO authenticated;
GRANT ALL ON FUNCTION public.st_coveredby(geog1 public.geography, geog2 public.geography) TO service_role;


--
-- Name: FUNCTION st_coveredby(geom1 public.geometry, geom2 public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_coveredby(geom1 public.geometry, geom2 public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.st_coveredby(geom1 public.geometry, geom2 public.geometry) TO anon;
GRANT ALL ON FUNCTION public.st_coveredby(geom1 public.geometry, geom2 public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.st_coveredby(geom1 public.geometry, geom2 public.geometry) TO service_role;


--
-- Name: FUNCTION st_covers(text, text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_covers(text, text) TO postgres;
GRANT ALL ON FUNCTION public.st_covers(text, text) TO anon;
GRANT ALL ON FUNCTION public.st_covers(text, text) TO authenticated;
GRANT ALL ON FUNCTION public.st_covers(text, text) TO service_role;


--
-- Name: FUNCTION st_covers(geog1 public.geography, geog2 public.geography); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_covers(geog1 public.geography, geog2 public.geography) TO postgres;
GRANT ALL ON FUNCTION public.st_covers(geog1 public.geography, geog2 public.geography) TO anon;
GRANT ALL ON FUNCTION public.st_covers(geog1 public.geography, geog2 public.geography) TO authenticated;
GRANT ALL ON FUNCTION public.st_covers(geog1 public.geography, geog2 public.geography) TO service_role;


--
-- Name: FUNCTION st_covers(geom1 public.geometry, geom2 public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_covers(geom1 public.geometry, geom2 public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.st_covers(geom1 public.geometry, geom2 public.geometry) TO anon;
GRANT ALL ON FUNCTION public.st_covers(geom1 public.geometry, geom2 public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.st_covers(geom1 public.geometry, geom2 public.geometry) TO service_role;


--
-- Name: FUNCTION st_cpawithin(public.geometry, public.geometry, double precision); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_cpawithin(public.geometry, public.geometry, double precision) TO postgres;
GRANT ALL ON FUNCTION public.st_cpawithin(public.geometry, public.geometry, double precision) TO anon;
GRANT ALL ON FUNCTION public.st_cpawithin(public.geometry, public.geometry, double precision) TO authenticated;
GRANT ALL ON FUNCTION public.st_cpawithin(public.geometry, public.geometry, double precision) TO service_role;


--
-- Name: FUNCTION st_crosses(geom1 public.geometry, geom2 public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_crosses(geom1 public.geometry, geom2 public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.st_crosses(geom1 public.geometry, geom2 public.geometry) TO anon;
GRANT ALL ON FUNCTION public.st_crosses(geom1 public.geometry, geom2 public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.st_crosses(geom1 public.geometry, geom2 public.geometry) TO service_role;


--
-- Name: FUNCTION st_curvetoline(geom public.geometry, tol double precision, toltype integer, flags integer); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_curvetoline(geom public.geometry, tol double precision, toltype integer, flags integer) TO postgres;
GRANT ALL ON FUNCTION public.st_curvetoline(geom public.geometry, tol double precision, toltype integer, flags integer) TO anon;
GRANT ALL ON FUNCTION public.st_curvetoline(geom public.geometry, tol double precision, toltype integer, flags integer) TO authenticated;
GRANT ALL ON FUNCTION public.st_curvetoline(geom public.geometry, tol double precision, toltype integer, flags integer) TO service_role;


--
-- Name: FUNCTION st_delaunaytriangles(g1 public.geometry, tolerance double precision, flags integer); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_delaunaytriangles(g1 public.geometry, tolerance double precision, flags integer) TO postgres;
GRANT ALL ON FUNCTION public.st_delaunaytriangles(g1 public.geometry, tolerance double precision, flags integer) TO anon;
GRANT ALL ON FUNCTION public.st_delaunaytriangles(g1 public.geometry, tolerance double precision, flags integer) TO authenticated;
GRANT ALL ON FUNCTION public.st_delaunaytriangles(g1 public.geometry, tolerance double precision, flags integer) TO service_role;


--
-- Name: FUNCTION st_dfullywithin(geom1 public.geometry, geom2 public.geometry, double precision); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_dfullywithin(geom1 public.geometry, geom2 public.geometry, double precision) TO postgres;
GRANT ALL ON FUNCTION public.st_dfullywithin(geom1 public.geometry, geom2 public.geometry, double precision) TO anon;
GRANT ALL ON FUNCTION public.st_dfullywithin(geom1 public.geometry, geom2 public.geometry, double precision) TO authenticated;
GRANT ALL ON FUNCTION public.st_dfullywithin(geom1 public.geometry, geom2 public.geometry, double precision) TO service_role;


--
-- Name: FUNCTION st_difference(geom1 public.geometry, geom2 public.geometry, gridsize double precision); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_difference(geom1 public.geometry, geom2 public.geometry, gridsize double precision) TO postgres;
GRANT ALL ON FUNCTION public.st_difference(geom1 public.geometry, geom2 public.geometry, gridsize double precision) TO anon;
GRANT ALL ON FUNCTION public.st_difference(geom1 public.geometry, geom2 public.geometry, gridsize double precision) TO authenticated;
GRANT ALL ON FUNCTION public.st_difference(geom1 public.geometry, geom2 public.geometry, gridsize double precision) TO service_role;


--
-- Name: FUNCTION st_dimension(public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_dimension(public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.st_dimension(public.geometry) TO anon;
GRANT ALL ON FUNCTION public.st_dimension(public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.st_dimension(public.geometry) TO service_role;


--
-- Name: FUNCTION st_disjoint(geom1 public.geometry, geom2 public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_disjoint(geom1 public.geometry, geom2 public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.st_disjoint(geom1 public.geometry, geom2 public.geometry) TO anon;
GRANT ALL ON FUNCTION public.st_disjoint(geom1 public.geometry, geom2 public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.st_disjoint(geom1 public.geometry, geom2 public.geometry) TO service_role;


--
-- Name: FUNCTION st_distance(text, text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_distance(text, text) TO postgres;
GRANT ALL ON FUNCTION public.st_distance(text, text) TO anon;
GRANT ALL ON FUNCTION public.st_distance(text, text) TO authenticated;
GRANT ALL ON FUNCTION public.st_distance(text, text) TO service_role;


--
-- Name: FUNCTION st_distance(geom1 public.geometry, geom2 public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_distance(geom1 public.geometry, geom2 public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.st_distance(geom1 public.geometry, geom2 public.geometry) TO anon;
GRANT ALL ON FUNCTION public.st_distance(geom1 public.geometry, geom2 public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.st_distance(geom1 public.geometry, geom2 public.geometry) TO service_role;


--
-- Name: FUNCTION st_distance(geog1 public.geography, geog2 public.geography, use_spheroid boolean); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_distance(geog1 public.geography, geog2 public.geography, use_spheroid boolean) TO postgres;
GRANT ALL ON FUNCTION public.st_distance(geog1 public.geography, geog2 public.geography, use_spheroid boolean) TO anon;
GRANT ALL ON FUNCTION public.st_distance(geog1 public.geography, geog2 public.geography, use_spheroid boolean) TO authenticated;
GRANT ALL ON FUNCTION public.st_distance(geog1 public.geography, geog2 public.geography, use_spheroid boolean) TO service_role;


--
-- Name: FUNCTION st_distancecpa(public.geometry, public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_distancecpa(public.geometry, public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.st_distancecpa(public.geometry, public.geometry) TO anon;
GRANT ALL ON FUNCTION public.st_distancecpa(public.geometry, public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.st_distancecpa(public.geometry, public.geometry) TO service_role;


--
-- Name: FUNCTION st_distancesphere(geom1 public.geometry, geom2 public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_distancesphere(geom1 public.geometry, geom2 public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.st_distancesphere(geom1 public.geometry, geom2 public.geometry) TO anon;
GRANT ALL ON FUNCTION public.st_distancesphere(geom1 public.geometry, geom2 public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.st_distancesphere(geom1 public.geometry, geom2 public.geometry) TO service_role;


--
-- Name: FUNCTION st_distancesphere(geom1 public.geometry, geom2 public.geometry, radius double precision); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_distancesphere(geom1 public.geometry, geom2 public.geometry, radius double precision) TO postgres;
GRANT ALL ON FUNCTION public.st_distancesphere(geom1 public.geometry, geom2 public.geometry, radius double precision) TO anon;
GRANT ALL ON FUNCTION public.st_distancesphere(geom1 public.geometry, geom2 public.geometry, radius double precision) TO authenticated;
GRANT ALL ON FUNCTION public.st_distancesphere(geom1 public.geometry, geom2 public.geometry, radius double precision) TO service_role;


--
-- Name: FUNCTION st_distancespheroid(geom1 public.geometry, geom2 public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_distancespheroid(geom1 public.geometry, geom2 public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.st_distancespheroid(geom1 public.geometry, geom2 public.geometry) TO anon;
GRANT ALL ON FUNCTION public.st_distancespheroid(geom1 public.geometry, geom2 public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.st_distancespheroid(geom1 public.geometry, geom2 public.geometry) TO service_role;


--
-- Name: FUNCTION st_distancespheroid(geom1 public.geometry, geom2 public.geometry, public.spheroid); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_distancespheroid(geom1 public.geometry, geom2 public.geometry, public.spheroid) TO postgres;
GRANT ALL ON FUNCTION public.st_distancespheroid(geom1 public.geometry, geom2 public.geometry, public.spheroid) TO anon;
GRANT ALL ON FUNCTION public.st_distancespheroid(geom1 public.geometry, geom2 public.geometry, public.spheroid) TO authenticated;
GRANT ALL ON FUNCTION public.st_distancespheroid(geom1 public.geometry, geom2 public.geometry, public.spheroid) TO service_role;


--
-- Name: FUNCTION st_dump(public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_dump(public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.st_dump(public.geometry) TO anon;
GRANT ALL ON FUNCTION public.st_dump(public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.st_dump(public.geometry) TO service_role;


--
-- Name: FUNCTION st_dumppoints(public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_dumppoints(public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.st_dumppoints(public.geometry) TO anon;
GRANT ALL ON FUNCTION public.st_dumppoints(public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.st_dumppoints(public.geometry) TO service_role;


--
-- Name: FUNCTION st_dumprings(public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_dumprings(public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.st_dumprings(public.geometry) TO anon;
GRANT ALL ON FUNCTION public.st_dumprings(public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.st_dumprings(public.geometry) TO service_role;


--
-- Name: FUNCTION st_dumpsegments(public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_dumpsegments(public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.st_dumpsegments(public.geometry) TO anon;
GRANT ALL ON FUNCTION public.st_dumpsegments(public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.st_dumpsegments(public.geometry) TO service_role;


--
-- Name: FUNCTION st_dwithin(text, text, double precision); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_dwithin(text, text, double precision) TO postgres;
GRANT ALL ON FUNCTION public.st_dwithin(text, text, double precision) TO anon;
GRANT ALL ON FUNCTION public.st_dwithin(text, text, double precision) TO authenticated;
GRANT ALL ON FUNCTION public.st_dwithin(text, text, double precision) TO service_role;


--
-- Name: FUNCTION st_dwithin(geom1 public.geometry, geom2 public.geometry, double precision); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_dwithin(geom1 public.geometry, geom2 public.geometry, double precision) TO postgres;
GRANT ALL ON FUNCTION public.st_dwithin(geom1 public.geometry, geom2 public.geometry, double precision) TO anon;
GRANT ALL ON FUNCTION public.st_dwithin(geom1 public.geometry, geom2 public.geometry, double precision) TO authenticated;
GRANT ALL ON FUNCTION public.st_dwithin(geom1 public.geometry, geom2 public.geometry, double precision) TO service_role;


--
-- Name: FUNCTION st_dwithin(geog1 public.geography, geog2 public.geography, tolerance double precision, use_spheroid boolean); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_dwithin(geog1 public.geography, geog2 public.geography, tolerance double precision, use_spheroid boolean) TO postgres;
GRANT ALL ON FUNCTION public.st_dwithin(geog1 public.geography, geog2 public.geography, tolerance double precision, use_spheroid boolean) TO anon;
GRANT ALL ON FUNCTION public.st_dwithin(geog1 public.geography, geog2 public.geography, tolerance double precision, use_spheroid boolean) TO authenticated;
GRANT ALL ON FUNCTION public.st_dwithin(geog1 public.geography, geog2 public.geography, tolerance double precision, use_spheroid boolean) TO service_role;


--
-- Name: FUNCTION st_endpoint(public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_endpoint(public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.st_endpoint(public.geometry) TO anon;
GRANT ALL ON FUNCTION public.st_endpoint(public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.st_endpoint(public.geometry) TO service_role;


--
-- Name: FUNCTION st_envelope(public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_envelope(public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.st_envelope(public.geometry) TO anon;
GRANT ALL ON FUNCTION public.st_envelope(public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.st_envelope(public.geometry) TO service_role;


--
-- Name: FUNCTION st_equals(geom1 public.geometry, geom2 public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_equals(geom1 public.geometry, geom2 public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.st_equals(geom1 public.geometry, geom2 public.geometry) TO anon;
GRANT ALL ON FUNCTION public.st_equals(geom1 public.geometry, geom2 public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.st_equals(geom1 public.geometry, geom2 public.geometry) TO service_role;


--
-- Name: FUNCTION st_estimatedextent(text, text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_estimatedextent(text, text) TO postgres;
GRANT ALL ON FUNCTION public.st_estimatedextent(text, text) TO anon;
GRANT ALL ON FUNCTION public.st_estimatedextent(text, text) TO authenticated;
GRANT ALL ON FUNCTION public.st_estimatedextent(text, text) TO service_role;


--
-- Name: FUNCTION st_estimatedextent(text, text, text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_estimatedextent(text, text, text) TO postgres;
GRANT ALL ON FUNCTION public.st_estimatedextent(text, text, text) TO anon;
GRANT ALL ON FUNCTION public.st_estimatedextent(text, text, text) TO authenticated;
GRANT ALL ON FUNCTION public.st_estimatedextent(text, text, text) TO service_role;


--
-- Name: FUNCTION st_estimatedextent(text, text, text, boolean); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_estimatedextent(text, text, text, boolean) TO postgres;
GRANT ALL ON FUNCTION public.st_estimatedextent(text, text, text, boolean) TO anon;
GRANT ALL ON FUNCTION public.st_estimatedextent(text, text, text, boolean) TO authenticated;
GRANT ALL ON FUNCTION public.st_estimatedextent(text, text, text, boolean) TO service_role;


--
-- Name: FUNCTION st_expand(public.box2d, double precision); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_expand(public.box2d, double precision) TO postgres;
GRANT ALL ON FUNCTION public.st_expand(public.box2d, double precision) TO anon;
GRANT ALL ON FUNCTION public.st_expand(public.box2d, double precision) TO authenticated;
GRANT ALL ON FUNCTION public.st_expand(public.box2d, double precision) TO service_role;


--
-- Name: FUNCTION st_expand(public.box3d, double precision); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_expand(public.box3d, double precision) TO postgres;
GRANT ALL ON FUNCTION public.st_expand(public.box3d, double precision) TO anon;
GRANT ALL ON FUNCTION public.st_expand(public.box3d, double precision) TO authenticated;
GRANT ALL ON FUNCTION public.st_expand(public.box3d, double precision) TO service_role;


--
-- Name: FUNCTION st_expand(public.geometry, double precision); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_expand(public.geometry, double precision) TO postgres;
GRANT ALL ON FUNCTION public.st_expand(public.geometry, double precision) TO anon;
GRANT ALL ON FUNCTION public.st_expand(public.geometry, double precision) TO authenticated;
GRANT ALL ON FUNCTION public.st_expand(public.geometry, double precision) TO service_role;


--
-- Name: FUNCTION st_expand(box public.box2d, dx double precision, dy double precision); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_expand(box public.box2d, dx double precision, dy double precision) TO postgres;
GRANT ALL ON FUNCTION public.st_expand(box public.box2d, dx double precision, dy double precision) TO anon;
GRANT ALL ON FUNCTION public.st_expand(box public.box2d, dx double precision, dy double precision) TO authenticated;
GRANT ALL ON FUNCTION public.st_expand(box public.box2d, dx double precision, dy double precision) TO service_role;


--
-- Name: FUNCTION st_expand(box public.box3d, dx double precision, dy double precision, dz double precision); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_expand(box public.box3d, dx double precision, dy double precision, dz double precision) TO postgres;
GRANT ALL ON FUNCTION public.st_expand(box public.box3d, dx double precision, dy double precision, dz double precision) TO anon;
GRANT ALL ON FUNCTION public.st_expand(box public.box3d, dx double precision, dy double precision, dz double precision) TO authenticated;
GRANT ALL ON FUNCTION public.st_expand(box public.box3d, dx double precision, dy double precision, dz double precision) TO service_role;


--
-- Name: FUNCTION st_expand(geom public.geometry, dx double precision, dy double precision, dz double precision, dm double precision); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_expand(geom public.geometry, dx double precision, dy double precision, dz double precision, dm double precision) TO postgres;
GRANT ALL ON FUNCTION public.st_expand(geom public.geometry, dx double precision, dy double precision, dz double precision, dm double precision) TO anon;
GRANT ALL ON FUNCTION public.st_expand(geom public.geometry, dx double precision, dy double precision, dz double precision, dm double precision) TO authenticated;
GRANT ALL ON FUNCTION public.st_expand(geom public.geometry, dx double precision, dy double precision, dz double precision, dm double precision) TO service_role;


--
-- Name: FUNCTION st_exteriorring(public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_exteriorring(public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.st_exteriorring(public.geometry) TO anon;
GRANT ALL ON FUNCTION public.st_exteriorring(public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.st_exteriorring(public.geometry) TO service_role;


--
-- Name: FUNCTION st_filterbym(public.geometry, double precision, double precision, boolean); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_filterbym(public.geometry, double precision, double precision, boolean) TO postgres;
GRANT ALL ON FUNCTION public.st_filterbym(public.geometry, double precision, double precision, boolean) TO anon;
GRANT ALL ON FUNCTION public.st_filterbym(public.geometry, double precision, double precision, boolean) TO authenticated;
GRANT ALL ON FUNCTION public.st_filterbym(public.geometry, double precision, double precision, boolean) TO service_role;


--
-- Name: FUNCTION st_findextent(text, text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_findextent(text, text) TO postgres;
GRANT ALL ON FUNCTION public.st_findextent(text, text) TO anon;
GRANT ALL ON FUNCTION public.st_findextent(text, text) TO authenticated;
GRANT ALL ON FUNCTION public.st_findextent(text, text) TO service_role;


--
-- Name: FUNCTION st_findextent(text, text, text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_findextent(text, text, text) TO postgres;
GRANT ALL ON FUNCTION public.st_findextent(text, text, text) TO anon;
GRANT ALL ON FUNCTION public.st_findextent(text, text, text) TO authenticated;
GRANT ALL ON FUNCTION public.st_findextent(text, text, text) TO service_role;


--
-- Name: FUNCTION st_flipcoordinates(public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_flipcoordinates(public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.st_flipcoordinates(public.geometry) TO anon;
GRANT ALL ON FUNCTION public.st_flipcoordinates(public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.st_flipcoordinates(public.geometry) TO service_role;


--
-- Name: FUNCTION st_force2d(public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_force2d(public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.st_force2d(public.geometry) TO anon;
GRANT ALL ON FUNCTION public.st_force2d(public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.st_force2d(public.geometry) TO service_role;


--
-- Name: FUNCTION st_force3d(geom public.geometry, zvalue double precision); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_force3d(geom public.geometry, zvalue double precision) TO postgres;
GRANT ALL ON FUNCTION public.st_force3d(geom public.geometry, zvalue double precision) TO anon;
GRANT ALL ON FUNCTION public.st_force3d(geom public.geometry, zvalue double precision) TO authenticated;
GRANT ALL ON FUNCTION public.st_force3d(geom public.geometry, zvalue double precision) TO service_role;


--
-- Name: FUNCTION st_force3dm(geom public.geometry, mvalue double precision); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_force3dm(geom public.geometry, mvalue double precision) TO postgres;
GRANT ALL ON FUNCTION public.st_force3dm(geom public.geometry, mvalue double precision) TO anon;
GRANT ALL ON FUNCTION public.st_force3dm(geom public.geometry, mvalue double precision) TO authenticated;
GRANT ALL ON FUNCTION public.st_force3dm(geom public.geometry, mvalue double precision) TO service_role;


--
-- Name: FUNCTION st_force3dz(geom public.geometry, zvalue double precision); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_force3dz(geom public.geometry, zvalue double precision) TO postgres;
GRANT ALL ON FUNCTION public.st_force3dz(geom public.geometry, zvalue double precision) TO anon;
GRANT ALL ON FUNCTION public.st_force3dz(geom public.geometry, zvalue double precision) TO authenticated;
GRANT ALL ON FUNCTION public.st_force3dz(geom public.geometry, zvalue double precision) TO service_role;


--
-- Name: FUNCTION st_force4d(geom public.geometry, zvalue double precision, mvalue double precision); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_force4d(geom public.geometry, zvalue double precision, mvalue double precision) TO postgres;
GRANT ALL ON FUNCTION public.st_force4d(geom public.geometry, zvalue double precision, mvalue double precision) TO anon;
GRANT ALL ON FUNCTION public.st_force4d(geom public.geometry, zvalue double precision, mvalue double precision) TO authenticated;
GRANT ALL ON FUNCTION public.st_force4d(geom public.geometry, zvalue double precision, mvalue double precision) TO service_role;


--
-- Name: FUNCTION st_forcecollection(public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_forcecollection(public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.st_forcecollection(public.geometry) TO anon;
GRANT ALL ON FUNCTION public.st_forcecollection(public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.st_forcecollection(public.geometry) TO service_role;


--
-- Name: FUNCTION st_forcecurve(public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_forcecurve(public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.st_forcecurve(public.geometry) TO anon;
GRANT ALL ON FUNCTION public.st_forcecurve(public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.st_forcecurve(public.geometry) TO service_role;


--
-- Name: FUNCTION st_forcepolygonccw(public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_forcepolygonccw(public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.st_forcepolygonccw(public.geometry) TO anon;
GRANT ALL ON FUNCTION public.st_forcepolygonccw(public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.st_forcepolygonccw(public.geometry) TO service_role;


--
-- Name: FUNCTION st_forcepolygoncw(public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_forcepolygoncw(public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.st_forcepolygoncw(public.geometry) TO anon;
GRANT ALL ON FUNCTION public.st_forcepolygoncw(public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.st_forcepolygoncw(public.geometry) TO service_role;


--
-- Name: FUNCTION st_forcerhr(public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_forcerhr(public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.st_forcerhr(public.geometry) TO anon;
GRANT ALL ON FUNCTION public.st_forcerhr(public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.st_forcerhr(public.geometry) TO service_role;


--
-- Name: FUNCTION st_forcesfs(public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_forcesfs(public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.st_forcesfs(public.geometry) TO anon;
GRANT ALL ON FUNCTION public.st_forcesfs(public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.st_forcesfs(public.geometry) TO service_role;


--
-- Name: FUNCTION st_forcesfs(public.geometry, version text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_forcesfs(public.geometry, version text) TO postgres;
GRANT ALL ON FUNCTION public.st_forcesfs(public.geometry, version text) TO anon;
GRANT ALL ON FUNCTION public.st_forcesfs(public.geometry, version text) TO authenticated;
GRANT ALL ON FUNCTION public.st_forcesfs(public.geometry, version text) TO service_role;


--
-- Name: FUNCTION st_frechetdistance(geom1 public.geometry, geom2 public.geometry, double precision); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_frechetdistance(geom1 public.geometry, geom2 public.geometry, double precision) TO postgres;
GRANT ALL ON FUNCTION public.st_frechetdistance(geom1 public.geometry, geom2 public.geometry, double precision) TO anon;
GRANT ALL ON FUNCTION public.st_frechetdistance(geom1 public.geometry, geom2 public.geometry, double precision) TO authenticated;
GRANT ALL ON FUNCTION public.st_frechetdistance(geom1 public.geometry, geom2 public.geometry, double precision) TO service_role;


--
-- Name: FUNCTION st_fromflatgeobuf(anyelement, bytea); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_fromflatgeobuf(anyelement, bytea) TO postgres;
GRANT ALL ON FUNCTION public.st_fromflatgeobuf(anyelement, bytea) TO anon;
GRANT ALL ON FUNCTION public.st_fromflatgeobuf(anyelement, bytea) TO authenticated;
GRANT ALL ON FUNCTION public.st_fromflatgeobuf(anyelement, bytea) TO service_role;


--
-- Name: FUNCTION st_fromflatgeobuftotable(text, text, bytea); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_fromflatgeobuftotable(text, text, bytea) TO postgres;
GRANT ALL ON FUNCTION public.st_fromflatgeobuftotable(text, text, bytea) TO anon;
GRANT ALL ON FUNCTION public.st_fromflatgeobuftotable(text, text, bytea) TO authenticated;
GRANT ALL ON FUNCTION public.st_fromflatgeobuftotable(text, text, bytea) TO service_role;


--
-- Name: FUNCTION st_generatepoints(area public.geometry, npoints integer); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_generatepoints(area public.geometry, npoints integer) TO postgres;
GRANT ALL ON FUNCTION public.st_generatepoints(area public.geometry, npoints integer) TO anon;
GRANT ALL ON FUNCTION public.st_generatepoints(area public.geometry, npoints integer) TO authenticated;
GRANT ALL ON FUNCTION public.st_generatepoints(area public.geometry, npoints integer) TO service_role;


--
-- Name: FUNCTION st_generatepoints(area public.geometry, npoints integer, seed integer); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_generatepoints(area public.geometry, npoints integer, seed integer) TO postgres;
GRANT ALL ON FUNCTION public.st_generatepoints(area public.geometry, npoints integer, seed integer) TO anon;
GRANT ALL ON FUNCTION public.st_generatepoints(area public.geometry, npoints integer, seed integer) TO authenticated;
GRANT ALL ON FUNCTION public.st_generatepoints(area public.geometry, npoints integer, seed integer) TO service_role;


--
-- Name: FUNCTION st_geogfromtext(text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_geogfromtext(text) TO postgres;
GRANT ALL ON FUNCTION public.st_geogfromtext(text) TO anon;
GRANT ALL ON FUNCTION public.st_geogfromtext(text) TO authenticated;
GRANT ALL ON FUNCTION public.st_geogfromtext(text) TO service_role;


--
-- Name: FUNCTION st_geogfromwkb(bytea); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_geogfromwkb(bytea) TO postgres;
GRANT ALL ON FUNCTION public.st_geogfromwkb(bytea) TO anon;
GRANT ALL ON FUNCTION public.st_geogfromwkb(bytea) TO authenticated;
GRANT ALL ON FUNCTION public.st_geogfromwkb(bytea) TO service_role;


--
-- Name: FUNCTION st_geographyfromtext(text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_geographyfromtext(text) TO postgres;
GRANT ALL ON FUNCTION public.st_geographyfromtext(text) TO anon;
GRANT ALL ON FUNCTION public.st_geographyfromtext(text) TO authenticated;
GRANT ALL ON FUNCTION public.st_geographyfromtext(text) TO service_role;


--
-- Name: FUNCTION st_geohash(geog public.geography, maxchars integer); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_geohash(geog public.geography, maxchars integer) TO postgres;
GRANT ALL ON FUNCTION public.st_geohash(geog public.geography, maxchars integer) TO anon;
GRANT ALL ON FUNCTION public.st_geohash(geog public.geography, maxchars integer) TO authenticated;
GRANT ALL ON FUNCTION public.st_geohash(geog public.geography, maxchars integer) TO service_role;


--
-- Name: FUNCTION st_geohash(geom public.geometry, maxchars integer); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_geohash(geom public.geometry, maxchars integer) TO postgres;
GRANT ALL ON FUNCTION public.st_geohash(geom public.geometry, maxchars integer) TO anon;
GRANT ALL ON FUNCTION public.st_geohash(geom public.geometry, maxchars integer) TO authenticated;
GRANT ALL ON FUNCTION public.st_geohash(geom public.geometry, maxchars integer) TO service_role;


--
-- Name: FUNCTION st_geomcollfromtext(text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_geomcollfromtext(text) TO postgres;
GRANT ALL ON FUNCTION public.st_geomcollfromtext(text) TO anon;
GRANT ALL ON FUNCTION public.st_geomcollfromtext(text) TO authenticated;
GRANT ALL ON FUNCTION public.st_geomcollfromtext(text) TO service_role;


--
-- Name: FUNCTION st_geomcollfromtext(text, integer); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_geomcollfromtext(text, integer) TO postgres;
GRANT ALL ON FUNCTION public.st_geomcollfromtext(text, integer) TO anon;
GRANT ALL ON FUNCTION public.st_geomcollfromtext(text, integer) TO authenticated;
GRANT ALL ON FUNCTION public.st_geomcollfromtext(text, integer) TO service_role;


--
-- Name: FUNCTION st_geomcollfromwkb(bytea); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_geomcollfromwkb(bytea) TO postgres;
GRANT ALL ON FUNCTION public.st_geomcollfromwkb(bytea) TO anon;
GRANT ALL ON FUNCTION public.st_geomcollfromwkb(bytea) TO authenticated;
GRANT ALL ON FUNCTION public.st_geomcollfromwkb(bytea) TO service_role;


--
-- Name: FUNCTION st_geomcollfromwkb(bytea, integer); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_geomcollfromwkb(bytea, integer) TO postgres;
GRANT ALL ON FUNCTION public.st_geomcollfromwkb(bytea, integer) TO anon;
GRANT ALL ON FUNCTION public.st_geomcollfromwkb(bytea, integer) TO authenticated;
GRANT ALL ON FUNCTION public.st_geomcollfromwkb(bytea, integer) TO service_role;


--
-- Name: FUNCTION st_geometricmedian(g public.geometry, tolerance double precision, max_iter integer, fail_if_not_converged boolean); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_geometricmedian(g public.geometry, tolerance double precision, max_iter integer, fail_if_not_converged boolean) TO postgres;
GRANT ALL ON FUNCTION public.st_geometricmedian(g public.geometry, tolerance double precision, max_iter integer, fail_if_not_converged boolean) TO anon;
GRANT ALL ON FUNCTION public.st_geometricmedian(g public.geometry, tolerance double precision, max_iter integer, fail_if_not_converged boolean) TO authenticated;
GRANT ALL ON FUNCTION public.st_geometricmedian(g public.geometry, tolerance double precision, max_iter integer, fail_if_not_converged boolean) TO service_role;


--
-- Name: FUNCTION st_geometryfromtext(text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_geometryfromtext(text) TO postgres;
GRANT ALL ON FUNCTION public.st_geometryfromtext(text) TO anon;
GRANT ALL ON FUNCTION public.st_geometryfromtext(text) TO authenticated;
GRANT ALL ON FUNCTION public.st_geometryfromtext(text) TO service_role;


--
-- Name: FUNCTION st_geometryfromtext(text, integer); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_geometryfromtext(text, integer) TO postgres;
GRANT ALL ON FUNCTION public.st_geometryfromtext(text, integer) TO anon;
GRANT ALL ON FUNCTION public.st_geometryfromtext(text, integer) TO authenticated;
GRANT ALL ON FUNCTION public.st_geometryfromtext(text, integer) TO service_role;


--
-- Name: FUNCTION st_geometryn(public.geometry, integer); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_geometryn(public.geometry, integer) TO postgres;
GRANT ALL ON FUNCTION public.st_geometryn(public.geometry, integer) TO anon;
GRANT ALL ON FUNCTION public.st_geometryn(public.geometry, integer) TO authenticated;
GRANT ALL ON FUNCTION public.st_geometryn(public.geometry, integer) TO service_role;


--
-- Name: FUNCTION st_geometrytype(public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_geometrytype(public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.st_geometrytype(public.geometry) TO anon;
GRANT ALL ON FUNCTION public.st_geometrytype(public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.st_geometrytype(public.geometry) TO service_role;


--
-- Name: FUNCTION st_geomfromewkb(bytea); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_geomfromewkb(bytea) TO postgres;
GRANT ALL ON FUNCTION public.st_geomfromewkb(bytea) TO anon;
GRANT ALL ON FUNCTION public.st_geomfromewkb(bytea) TO authenticated;
GRANT ALL ON FUNCTION public.st_geomfromewkb(bytea) TO service_role;


--
-- Name: FUNCTION st_geomfromewkt(text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_geomfromewkt(text) TO postgres;
GRANT ALL ON FUNCTION public.st_geomfromewkt(text) TO anon;
GRANT ALL ON FUNCTION public.st_geomfromewkt(text) TO authenticated;
GRANT ALL ON FUNCTION public.st_geomfromewkt(text) TO service_role;


--
-- Name: FUNCTION st_geomfromgeohash(text, integer); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_geomfromgeohash(text, integer) TO postgres;
GRANT ALL ON FUNCTION public.st_geomfromgeohash(text, integer) TO anon;
GRANT ALL ON FUNCTION public.st_geomfromgeohash(text, integer) TO authenticated;
GRANT ALL ON FUNCTION public.st_geomfromgeohash(text, integer) TO service_role;


--
-- Name: FUNCTION st_geomfromgeojson(json); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_geomfromgeojson(json) TO postgres;
GRANT ALL ON FUNCTION public.st_geomfromgeojson(json) TO anon;
GRANT ALL ON FUNCTION public.st_geomfromgeojson(json) TO authenticated;
GRANT ALL ON FUNCTION public.st_geomfromgeojson(json) TO service_role;


--
-- Name: FUNCTION st_geomfromgeojson(jsonb); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_geomfromgeojson(jsonb) TO postgres;
GRANT ALL ON FUNCTION public.st_geomfromgeojson(jsonb) TO anon;
GRANT ALL ON FUNCTION public.st_geomfromgeojson(jsonb) TO authenticated;
GRANT ALL ON FUNCTION public.st_geomfromgeojson(jsonb) TO service_role;


--
-- Name: FUNCTION st_geomfromgeojson(text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_geomfromgeojson(text) TO postgres;
GRANT ALL ON FUNCTION public.st_geomfromgeojson(text) TO anon;
GRANT ALL ON FUNCTION public.st_geomfromgeojson(text) TO authenticated;
GRANT ALL ON FUNCTION public.st_geomfromgeojson(text) TO service_role;


--
-- Name: FUNCTION st_geomfromgml(text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_geomfromgml(text) TO postgres;
GRANT ALL ON FUNCTION public.st_geomfromgml(text) TO anon;
GRANT ALL ON FUNCTION public.st_geomfromgml(text) TO authenticated;
GRANT ALL ON FUNCTION public.st_geomfromgml(text) TO service_role;


--
-- Name: FUNCTION st_geomfromgml(text, integer); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_geomfromgml(text, integer) TO postgres;
GRANT ALL ON FUNCTION public.st_geomfromgml(text, integer) TO anon;
GRANT ALL ON FUNCTION public.st_geomfromgml(text, integer) TO authenticated;
GRANT ALL ON FUNCTION public.st_geomfromgml(text, integer) TO service_role;


--
-- Name: FUNCTION st_geomfromkml(text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_geomfromkml(text) TO postgres;
GRANT ALL ON FUNCTION public.st_geomfromkml(text) TO anon;
GRANT ALL ON FUNCTION public.st_geomfromkml(text) TO authenticated;
GRANT ALL ON FUNCTION public.st_geomfromkml(text) TO service_role;


--
-- Name: FUNCTION st_geomfrommarc21(marc21xml text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_geomfrommarc21(marc21xml text) TO postgres;
GRANT ALL ON FUNCTION public.st_geomfrommarc21(marc21xml text) TO anon;
GRANT ALL ON FUNCTION public.st_geomfrommarc21(marc21xml text) TO authenticated;
GRANT ALL ON FUNCTION public.st_geomfrommarc21(marc21xml text) TO service_role;


--
-- Name: FUNCTION st_geomfromtext(text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_geomfromtext(text) TO postgres;
GRANT ALL ON FUNCTION public.st_geomfromtext(text) TO anon;
GRANT ALL ON FUNCTION public.st_geomfromtext(text) TO authenticated;
GRANT ALL ON FUNCTION public.st_geomfromtext(text) TO service_role;


--
-- Name: FUNCTION st_geomfromtext(text, integer); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_geomfromtext(text, integer) TO postgres;
GRANT ALL ON FUNCTION public.st_geomfromtext(text, integer) TO anon;
GRANT ALL ON FUNCTION public.st_geomfromtext(text, integer) TO authenticated;
GRANT ALL ON FUNCTION public.st_geomfromtext(text, integer) TO service_role;


--
-- Name: FUNCTION st_geomfromtwkb(bytea); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_geomfromtwkb(bytea) TO postgres;
GRANT ALL ON FUNCTION public.st_geomfromtwkb(bytea) TO anon;
GRANT ALL ON FUNCTION public.st_geomfromtwkb(bytea) TO authenticated;
GRANT ALL ON FUNCTION public.st_geomfromtwkb(bytea) TO service_role;


--
-- Name: FUNCTION st_geomfromwkb(bytea); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_geomfromwkb(bytea) TO postgres;
GRANT ALL ON FUNCTION public.st_geomfromwkb(bytea) TO anon;
GRANT ALL ON FUNCTION public.st_geomfromwkb(bytea) TO authenticated;
GRANT ALL ON FUNCTION public.st_geomfromwkb(bytea) TO service_role;


--
-- Name: FUNCTION st_geomfromwkb(bytea, integer); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_geomfromwkb(bytea, integer) TO postgres;
GRANT ALL ON FUNCTION public.st_geomfromwkb(bytea, integer) TO anon;
GRANT ALL ON FUNCTION public.st_geomfromwkb(bytea, integer) TO authenticated;
GRANT ALL ON FUNCTION public.st_geomfromwkb(bytea, integer) TO service_role;


--
-- Name: FUNCTION st_gmltosql(text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_gmltosql(text) TO postgres;
GRANT ALL ON FUNCTION public.st_gmltosql(text) TO anon;
GRANT ALL ON FUNCTION public.st_gmltosql(text) TO authenticated;
GRANT ALL ON FUNCTION public.st_gmltosql(text) TO service_role;


--
-- Name: FUNCTION st_gmltosql(text, integer); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_gmltosql(text, integer) TO postgres;
GRANT ALL ON FUNCTION public.st_gmltosql(text, integer) TO anon;
GRANT ALL ON FUNCTION public.st_gmltosql(text, integer) TO authenticated;
GRANT ALL ON FUNCTION public.st_gmltosql(text, integer) TO service_role;


--
-- Name: FUNCTION st_hasarc(geometry public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_hasarc(geometry public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.st_hasarc(geometry public.geometry) TO anon;
GRANT ALL ON FUNCTION public.st_hasarc(geometry public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.st_hasarc(geometry public.geometry) TO service_role;


--
-- Name: FUNCTION st_hausdorffdistance(geom1 public.geometry, geom2 public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_hausdorffdistance(geom1 public.geometry, geom2 public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.st_hausdorffdistance(geom1 public.geometry, geom2 public.geometry) TO anon;
GRANT ALL ON FUNCTION public.st_hausdorffdistance(geom1 public.geometry, geom2 public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.st_hausdorffdistance(geom1 public.geometry, geom2 public.geometry) TO service_role;


--
-- Name: FUNCTION st_hausdorffdistance(geom1 public.geometry, geom2 public.geometry, double precision); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_hausdorffdistance(geom1 public.geometry, geom2 public.geometry, double precision) TO postgres;
GRANT ALL ON FUNCTION public.st_hausdorffdistance(geom1 public.geometry, geom2 public.geometry, double precision) TO anon;
GRANT ALL ON FUNCTION public.st_hausdorffdistance(geom1 public.geometry, geom2 public.geometry, double precision) TO authenticated;
GRANT ALL ON FUNCTION public.st_hausdorffdistance(geom1 public.geometry, geom2 public.geometry, double precision) TO service_role;


--
-- Name: FUNCTION st_hexagon(size double precision, cell_i integer, cell_j integer, origin public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_hexagon(size double precision, cell_i integer, cell_j integer, origin public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.st_hexagon(size double precision, cell_i integer, cell_j integer, origin public.geometry) TO anon;
GRANT ALL ON FUNCTION public.st_hexagon(size double precision, cell_i integer, cell_j integer, origin public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.st_hexagon(size double precision, cell_i integer, cell_j integer, origin public.geometry) TO service_role;


--
-- Name: FUNCTION st_hexagongrid(size double precision, bounds public.geometry, OUT geom public.geometry, OUT i integer, OUT j integer); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_hexagongrid(size double precision, bounds public.geometry, OUT geom public.geometry, OUT i integer, OUT j integer) TO postgres;
GRANT ALL ON FUNCTION public.st_hexagongrid(size double precision, bounds public.geometry, OUT geom public.geometry, OUT i integer, OUT j integer) TO anon;
GRANT ALL ON FUNCTION public.st_hexagongrid(size double precision, bounds public.geometry, OUT geom public.geometry, OUT i integer, OUT j integer) TO authenticated;
GRANT ALL ON FUNCTION public.st_hexagongrid(size double precision, bounds public.geometry, OUT geom public.geometry, OUT i integer, OUT j integer) TO service_role;


--
-- Name: FUNCTION st_interiorringn(public.geometry, integer); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_interiorringn(public.geometry, integer) TO postgres;
GRANT ALL ON FUNCTION public.st_interiorringn(public.geometry, integer) TO anon;
GRANT ALL ON FUNCTION public.st_interiorringn(public.geometry, integer) TO authenticated;
GRANT ALL ON FUNCTION public.st_interiorringn(public.geometry, integer) TO service_role;


--
-- Name: FUNCTION st_interpolatepoint(line public.geometry, point public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_interpolatepoint(line public.geometry, point public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.st_interpolatepoint(line public.geometry, point public.geometry) TO anon;
GRANT ALL ON FUNCTION public.st_interpolatepoint(line public.geometry, point public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.st_interpolatepoint(line public.geometry, point public.geometry) TO service_role;


--
-- Name: FUNCTION st_intersection(text, text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_intersection(text, text) TO postgres;
GRANT ALL ON FUNCTION public.st_intersection(text, text) TO anon;
GRANT ALL ON FUNCTION public.st_intersection(text, text) TO authenticated;
GRANT ALL ON FUNCTION public.st_intersection(text, text) TO service_role;


--
-- Name: FUNCTION st_intersection(public.geography, public.geography); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_intersection(public.geography, public.geography) TO postgres;
GRANT ALL ON FUNCTION public.st_intersection(public.geography, public.geography) TO anon;
GRANT ALL ON FUNCTION public.st_intersection(public.geography, public.geography) TO authenticated;
GRANT ALL ON FUNCTION public.st_intersection(public.geography, public.geography) TO service_role;


--
-- Name: FUNCTION st_intersection(geom1 public.geometry, geom2 public.geometry, gridsize double precision); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_intersection(geom1 public.geometry, geom2 public.geometry, gridsize double precision) TO postgres;
GRANT ALL ON FUNCTION public.st_intersection(geom1 public.geometry, geom2 public.geometry, gridsize double precision) TO anon;
GRANT ALL ON FUNCTION public.st_intersection(geom1 public.geometry, geom2 public.geometry, gridsize double precision) TO authenticated;
GRANT ALL ON FUNCTION public.st_intersection(geom1 public.geometry, geom2 public.geometry, gridsize double precision) TO service_role;


--
-- Name: FUNCTION st_intersects(text, text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_intersects(text, text) TO postgres;
GRANT ALL ON FUNCTION public.st_intersects(text, text) TO anon;
GRANT ALL ON FUNCTION public.st_intersects(text, text) TO authenticated;
GRANT ALL ON FUNCTION public.st_intersects(text, text) TO service_role;


--
-- Name: FUNCTION st_intersects(geog1 public.geography, geog2 public.geography); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_intersects(geog1 public.geography, geog2 public.geography) TO postgres;
GRANT ALL ON FUNCTION public.st_intersects(geog1 public.geography, geog2 public.geography) TO anon;
GRANT ALL ON FUNCTION public.st_intersects(geog1 public.geography, geog2 public.geography) TO authenticated;
GRANT ALL ON FUNCTION public.st_intersects(geog1 public.geography, geog2 public.geography) TO service_role;


--
-- Name: FUNCTION st_intersects(geom1 public.geometry, geom2 public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_intersects(geom1 public.geometry, geom2 public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.st_intersects(geom1 public.geometry, geom2 public.geometry) TO anon;
GRANT ALL ON FUNCTION public.st_intersects(geom1 public.geometry, geom2 public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.st_intersects(geom1 public.geometry, geom2 public.geometry) TO service_role;


--
-- Name: FUNCTION st_isclosed(public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_isclosed(public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.st_isclosed(public.geometry) TO anon;
GRANT ALL ON FUNCTION public.st_isclosed(public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.st_isclosed(public.geometry) TO service_role;


--
-- Name: FUNCTION st_iscollection(public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_iscollection(public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.st_iscollection(public.geometry) TO anon;
GRANT ALL ON FUNCTION public.st_iscollection(public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.st_iscollection(public.geometry) TO service_role;


--
-- Name: FUNCTION st_isempty(public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_isempty(public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.st_isempty(public.geometry) TO anon;
GRANT ALL ON FUNCTION public.st_isempty(public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.st_isempty(public.geometry) TO service_role;


--
-- Name: FUNCTION st_ispolygonccw(public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_ispolygonccw(public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.st_ispolygonccw(public.geometry) TO anon;
GRANT ALL ON FUNCTION public.st_ispolygonccw(public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.st_ispolygonccw(public.geometry) TO service_role;


--
-- Name: FUNCTION st_ispolygoncw(public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_ispolygoncw(public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.st_ispolygoncw(public.geometry) TO anon;
GRANT ALL ON FUNCTION public.st_ispolygoncw(public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.st_ispolygoncw(public.geometry) TO service_role;


--
-- Name: FUNCTION st_isring(public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_isring(public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.st_isring(public.geometry) TO anon;
GRANT ALL ON FUNCTION public.st_isring(public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.st_isring(public.geometry) TO service_role;


--
-- Name: FUNCTION st_issimple(public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_issimple(public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.st_issimple(public.geometry) TO anon;
GRANT ALL ON FUNCTION public.st_issimple(public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.st_issimple(public.geometry) TO service_role;


--
-- Name: FUNCTION st_isvalid(public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_isvalid(public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.st_isvalid(public.geometry) TO anon;
GRANT ALL ON FUNCTION public.st_isvalid(public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.st_isvalid(public.geometry) TO service_role;


--
-- Name: FUNCTION st_isvalid(public.geometry, integer); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_isvalid(public.geometry, integer) TO postgres;
GRANT ALL ON FUNCTION public.st_isvalid(public.geometry, integer) TO anon;
GRANT ALL ON FUNCTION public.st_isvalid(public.geometry, integer) TO authenticated;
GRANT ALL ON FUNCTION public.st_isvalid(public.geometry, integer) TO service_role;


--
-- Name: FUNCTION st_isvaliddetail(geom public.geometry, flags integer); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_isvaliddetail(geom public.geometry, flags integer) TO postgres;
GRANT ALL ON FUNCTION public.st_isvaliddetail(geom public.geometry, flags integer) TO anon;
GRANT ALL ON FUNCTION public.st_isvaliddetail(geom public.geometry, flags integer) TO authenticated;
GRANT ALL ON FUNCTION public.st_isvaliddetail(geom public.geometry, flags integer) TO service_role;


--
-- Name: FUNCTION st_isvalidreason(public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_isvalidreason(public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.st_isvalidreason(public.geometry) TO anon;
GRANT ALL ON FUNCTION public.st_isvalidreason(public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.st_isvalidreason(public.geometry) TO service_role;


--
-- Name: FUNCTION st_isvalidreason(public.geometry, integer); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_isvalidreason(public.geometry, integer) TO postgres;
GRANT ALL ON FUNCTION public.st_isvalidreason(public.geometry, integer) TO anon;
GRANT ALL ON FUNCTION public.st_isvalidreason(public.geometry, integer) TO authenticated;
GRANT ALL ON FUNCTION public.st_isvalidreason(public.geometry, integer) TO service_role;


--
-- Name: FUNCTION st_isvalidtrajectory(public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_isvalidtrajectory(public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.st_isvalidtrajectory(public.geometry) TO anon;
GRANT ALL ON FUNCTION public.st_isvalidtrajectory(public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.st_isvalidtrajectory(public.geometry) TO service_role;


--
-- Name: FUNCTION st_length(text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_length(text) TO postgres;
GRANT ALL ON FUNCTION public.st_length(text) TO anon;
GRANT ALL ON FUNCTION public.st_length(text) TO authenticated;
GRANT ALL ON FUNCTION public.st_length(text) TO service_role;


--
-- Name: FUNCTION st_length(public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_length(public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.st_length(public.geometry) TO anon;
GRANT ALL ON FUNCTION public.st_length(public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.st_length(public.geometry) TO service_role;


--
-- Name: FUNCTION st_length(geog public.geography, use_spheroid boolean); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_length(geog public.geography, use_spheroid boolean) TO postgres;
GRANT ALL ON FUNCTION public.st_length(geog public.geography, use_spheroid boolean) TO anon;
GRANT ALL ON FUNCTION public.st_length(geog public.geography, use_spheroid boolean) TO authenticated;
GRANT ALL ON FUNCTION public.st_length(geog public.geography, use_spheroid boolean) TO service_role;


--
-- Name: FUNCTION st_length2d(public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_length2d(public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.st_length2d(public.geometry) TO anon;
GRANT ALL ON FUNCTION public.st_length2d(public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.st_length2d(public.geometry) TO service_role;


--
-- Name: FUNCTION st_length2dspheroid(public.geometry, public.spheroid); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_length2dspheroid(public.geometry, public.spheroid) TO postgres;
GRANT ALL ON FUNCTION public.st_length2dspheroid(public.geometry, public.spheroid) TO anon;
GRANT ALL ON FUNCTION public.st_length2dspheroid(public.geometry, public.spheroid) TO authenticated;
GRANT ALL ON FUNCTION public.st_length2dspheroid(public.geometry, public.spheroid) TO service_role;


--
-- Name: FUNCTION st_lengthspheroid(public.geometry, public.spheroid); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_lengthspheroid(public.geometry, public.spheroid) TO postgres;
GRANT ALL ON FUNCTION public.st_lengthspheroid(public.geometry, public.spheroid) TO anon;
GRANT ALL ON FUNCTION public.st_lengthspheroid(public.geometry, public.spheroid) TO authenticated;
GRANT ALL ON FUNCTION public.st_lengthspheroid(public.geometry, public.spheroid) TO service_role;


--
-- Name: FUNCTION st_letters(letters text, font json); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_letters(letters text, font json) TO postgres;
GRANT ALL ON FUNCTION public.st_letters(letters text, font json) TO anon;
GRANT ALL ON FUNCTION public.st_letters(letters text, font json) TO authenticated;
GRANT ALL ON FUNCTION public.st_letters(letters text, font json) TO service_role;


--
-- Name: FUNCTION st_linecrossingdirection(line1 public.geometry, line2 public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_linecrossingdirection(line1 public.geometry, line2 public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.st_linecrossingdirection(line1 public.geometry, line2 public.geometry) TO anon;
GRANT ALL ON FUNCTION public.st_linecrossingdirection(line1 public.geometry, line2 public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.st_linecrossingdirection(line1 public.geometry, line2 public.geometry) TO service_role;


--
-- Name: FUNCTION st_linefromencodedpolyline(txtin text, nprecision integer); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_linefromencodedpolyline(txtin text, nprecision integer) TO postgres;
GRANT ALL ON FUNCTION public.st_linefromencodedpolyline(txtin text, nprecision integer) TO anon;
GRANT ALL ON FUNCTION public.st_linefromencodedpolyline(txtin text, nprecision integer) TO authenticated;
GRANT ALL ON FUNCTION public.st_linefromencodedpolyline(txtin text, nprecision integer) TO service_role;


--
-- Name: FUNCTION st_linefrommultipoint(public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_linefrommultipoint(public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.st_linefrommultipoint(public.geometry) TO anon;
GRANT ALL ON FUNCTION public.st_linefrommultipoint(public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.st_linefrommultipoint(public.geometry) TO service_role;


--
-- Name: FUNCTION st_linefromtext(text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_linefromtext(text) TO postgres;
GRANT ALL ON FUNCTION public.st_linefromtext(text) TO anon;
GRANT ALL ON FUNCTION public.st_linefromtext(text) TO authenticated;
GRANT ALL ON FUNCTION public.st_linefromtext(text) TO service_role;


--
-- Name: FUNCTION st_linefromtext(text, integer); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_linefromtext(text, integer) TO postgres;
GRANT ALL ON FUNCTION public.st_linefromtext(text, integer) TO anon;
GRANT ALL ON FUNCTION public.st_linefromtext(text, integer) TO authenticated;
GRANT ALL ON FUNCTION public.st_linefromtext(text, integer) TO service_role;


--
-- Name: FUNCTION st_linefromwkb(bytea); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_linefromwkb(bytea) TO postgres;
GRANT ALL ON FUNCTION public.st_linefromwkb(bytea) TO anon;
GRANT ALL ON FUNCTION public.st_linefromwkb(bytea) TO authenticated;
GRANT ALL ON FUNCTION public.st_linefromwkb(bytea) TO service_role;


--
-- Name: FUNCTION st_linefromwkb(bytea, integer); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_linefromwkb(bytea, integer) TO postgres;
GRANT ALL ON FUNCTION public.st_linefromwkb(bytea, integer) TO anon;
GRANT ALL ON FUNCTION public.st_linefromwkb(bytea, integer) TO authenticated;
GRANT ALL ON FUNCTION public.st_linefromwkb(bytea, integer) TO service_role;


--
-- Name: FUNCTION st_lineinterpolatepoint(public.geometry, double precision); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_lineinterpolatepoint(public.geometry, double precision) TO postgres;
GRANT ALL ON FUNCTION public.st_lineinterpolatepoint(public.geometry, double precision) TO anon;
GRANT ALL ON FUNCTION public.st_lineinterpolatepoint(public.geometry, double precision) TO authenticated;
GRANT ALL ON FUNCTION public.st_lineinterpolatepoint(public.geometry, double precision) TO service_role;


--
-- Name: FUNCTION st_lineinterpolatepoints(public.geometry, double precision, repeat boolean); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_lineinterpolatepoints(public.geometry, double precision, repeat boolean) TO postgres;
GRANT ALL ON FUNCTION public.st_lineinterpolatepoints(public.geometry, double precision, repeat boolean) TO anon;
GRANT ALL ON FUNCTION public.st_lineinterpolatepoints(public.geometry, double precision, repeat boolean) TO authenticated;
GRANT ALL ON FUNCTION public.st_lineinterpolatepoints(public.geometry, double precision, repeat boolean) TO service_role;


--
-- Name: FUNCTION st_linelocatepoint(geom1 public.geometry, geom2 public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_linelocatepoint(geom1 public.geometry, geom2 public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.st_linelocatepoint(geom1 public.geometry, geom2 public.geometry) TO anon;
GRANT ALL ON FUNCTION public.st_linelocatepoint(geom1 public.geometry, geom2 public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.st_linelocatepoint(geom1 public.geometry, geom2 public.geometry) TO service_role;


--
-- Name: FUNCTION st_linemerge(public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_linemerge(public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.st_linemerge(public.geometry) TO anon;
GRANT ALL ON FUNCTION public.st_linemerge(public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.st_linemerge(public.geometry) TO service_role;


--
-- Name: FUNCTION st_linemerge(public.geometry, boolean); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_linemerge(public.geometry, boolean) TO postgres;
GRANT ALL ON FUNCTION public.st_linemerge(public.geometry, boolean) TO anon;
GRANT ALL ON FUNCTION public.st_linemerge(public.geometry, boolean) TO authenticated;
GRANT ALL ON FUNCTION public.st_linemerge(public.geometry, boolean) TO service_role;


--
-- Name: FUNCTION st_linestringfromwkb(bytea); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_linestringfromwkb(bytea) TO postgres;
GRANT ALL ON FUNCTION public.st_linestringfromwkb(bytea) TO anon;
GRANT ALL ON FUNCTION public.st_linestringfromwkb(bytea) TO authenticated;
GRANT ALL ON FUNCTION public.st_linestringfromwkb(bytea) TO service_role;


--
-- Name: FUNCTION st_linestringfromwkb(bytea, integer); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_linestringfromwkb(bytea, integer) TO postgres;
GRANT ALL ON FUNCTION public.st_linestringfromwkb(bytea, integer) TO anon;
GRANT ALL ON FUNCTION public.st_linestringfromwkb(bytea, integer) TO authenticated;
GRANT ALL ON FUNCTION public.st_linestringfromwkb(bytea, integer) TO service_role;


--
-- Name: FUNCTION st_linesubstring(public.geometry, double precision, double precision); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_linesubstring(public.geometry, double precision, double precision) TO postgres;
GRANT ALL ON FUNCTION public.st_linesubstring(public.geometry, double precision, double precision) TO anon;
GRANT ALL ON FUNCTION public.st_linesubstring(public.geometry, double precision, double precision) TO authenticated;
GRANT ALL ON FUNCTION public.st_linesubstring(public.geometry, double precision, double precision) TO service_role;


--
-- Name: FUNCTION st_linetocurve(geometry public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_linetocurve(geometry public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.st_linetocurve(geometry public.geometry) TO anon;
GRANT ALL ON FUNCTION public.st_linetocurve(geometry public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.st_linetocurve(geometry public.geometry) TO service_role;


--
-- Name: FUNCTION st_locatealong(geometry public.geometry, measure double precision, leftrightoffset double precision); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_locatealong(geometry public.geometry, measure double precision, leftrightoffset double precision) TO postgres;
GRANT ALL ON FUNCTION public.st_locatealong(geometry public.geometry, measure double precision, leftrightoffset double precision) TO anon;
GRANT ALL ON FUNCTION public.st_locatealong(geometry public.geometry, measure double precision, leftrightoffset double precision) TO authenticated;
GRANT ALL ON FUNCTION public.st_locatealong(geometry public.geometry, measure double precision, leftrightoffset double precision) TO service_role;


--
-- Name: FUNCTION st_locatebetween(geometry public.geometry, frommeasure double precision, tomeasure double precision, leftrightoffset double precision); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_locatebetween(geometry public.geometry, frommeasure double precision, tomeasure double precision, leftrightoffset double precision) TO postgres;
GRANT ALL ON FUNCTION public.st_locatebetween(geometry public.geometry, frommeasure double precision, tomeasure double precision, leftrightoffset double precision) TO anon;
GRANT ALL ON FUNCTION public.st_locatebetween(geometry public.geometry, frommeasure double precision, tomeasure double precision, leftrightoffset double precision) TO authenticated;
GRANT ALL ON FUNCTION public.st_locatebetween(geometry public.geometry, frommeasure double precision, tomeasure double precision, leftrightoffset double precision) TO service_role;


--
-- Name: FUNCTION st_locatebetweenelevations(geometry public.geometry, fromelevation double precision, toelevation double precision); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_locatebetweenelevations(geometry public.geometry, fromelevation double precision, toelevation double precision) TO postgres;
GRANT ALL ON FUNCTION public.st_locatebetweenelevations(geometry public.geometry, fromelevation double precision, toelevation double precision) TO anon;
GRANT ALL ON FUNCTION public.st_locatebetweenelevations(geometry public.geometry, fromelevation double precision, toelevation double precision) TO authenticated;
GRANT ALL ON FUNCTION public.st_locatebetweenelevations(geometry public.geometry, fromelevation double precision, toelevation double precision) TO service_role;


--
-- Name: FUNCTION st_longestline(geom1 public.geometry, geom2 public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_longestline(geom1 public.geometry, geom2 public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.st_longestline(geom1 public.geometry, geom2 public.geometry) TO anon;
GRANT ALL ON FUNCTION public.st_longestline(geom1 public.geometry, geom2 public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.st_longestline(geom1 public.geometry, geom2 public.geometry) TO service_role;


--
-- Name: FUNCTION st_m(public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_m(public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.st_m(public.geometry) TO anon;
GRANT ALL ON FUNCTION public.st_m(public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.st_m(public.geometry) TO service_role;


--
-- Name: FUNCTION st_makebox2d(geom1 public.geometry, geom2 public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_makebox2d(geom1 public.geometry, geom2 public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.st_makebox2d(geom1 public.geometry, geom2 public.geometry) TO anon;
GRANT ALL ON FUNCTION public.st_makebox2d(geom1 public.geometry, geom2 public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.st_makebox2d(geom1 public.geometry, geom2 public.geometry) TO service_role;


--
-- Name: FUNCTION st_makeenvelope(double precision, double precision, double precision, double precision, integer); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_makeenvelope(double precision, double precision, double precision, double precision, integer) TO postgres;
GRANT ALL ON FUNCTION public.st_makeenvelope(double precision, double precision, double precision, double precision, integer) TO anon;
GRANT ALL ON FUNCTION public.st_makeenvelope(double precision, double precision, double precision, double precision, integer) TO authenticated;
GRANT ALL ON FUNCTION public.st_makeenvelope(double precision, double precision, double precision, double precision, integer) TO service_role;


--
-- Name: FUNCTION st_makeline(public.geometry[]); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_makeline(public.geometry[]) TO postgres;
GRANT ALL ON FUNCTION public.st_makeline(public.geometry[]) TO anon;
GRANT ALL ON FUNCTION public.st_makeline(public.geometry[]) TO authenticated;
GRANT ALL ON FUNCTION public.st_makeline(public.geometry[]) TO service_role;


--
-- Name: FUNCTION st_makeline(geom1 public.geometry, geom2 public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_makeline(geom1 public.geometry, geom2 public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.st_makeline(geom1 public.geometry, geom2 public.geometry) TO anon;
GRANT ALL ON FUNCTION public.st_makeline(geom1 public.geometry, geom2 public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.st_makeline(geom1 public.geometry, geom2 public.geometry) TO service_role;


--
-- Name: FUNCTION st_makepoint(double precision, double precision); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_makepoint(double precision, double precision) TO postgres;
GRANT ALL ON FUNCTION public.st_makepoint(double precision, double precision) TO anon;
GRANT ALL ON FUNCTION public.st_makepoint(double precision, double precision) TO authenticated;
GRANT ALL ON FUNCTION public.st_makepoint(double precision, double precision) TO service_role;


--
-- Name: FUNCTION st_makepoint(double precision, double precision, double precision); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_makepoint(double precision, double precision, double precision) TO postgres;
GRANT ALL ON FUNCTION public.st_makepoint(double precision, double precision, double precision) TO anon;
GRANT ALL ON FUNCTION public.st_makepoint(double precision, double precision, double precision) TO authenticated;
GRANT ALL ON FUNCTION public.st_makepoint(double precision, double precision, double precision) TO service_role;


--
-- Name: FUNCTION st_makepoint(double precision, double precision, double precision, double precision); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_makepoint(double precision, double precision, double precision, double precision) TO postgres;
GRANT ALL ON FUNCTION public.st_makepoint(double precision, double precision, double precision, double precision) TO anon;
GRANT ALL ON FUNCTION public.st_makepoint(double precision, double precision, double precision, double precision) TO authenticated;
GRANT ALL ON FUNCTION public.st_makepoint(double precision, double precision, double precision, double precision) TO service_role;


--
-- Name: FUNCTION st_makepointm(double precision, double precision, double precision); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_makepointm(double precision, double precision, double precision) TO postgres;
GRANT ALL ON FUNCTION public.st_makepointm(double precision, double precision, double precision) TO anon;
GRANT ALL ON FUNCTION public.st_makepointm(double precision, double precision, double precision) TO authenticated;
GRANT ALL ON FUNCTION public.st_makepointm(double precision, double precision, double precision) TO service_role;


--
-- Name: FUNCTION st_makepolygon(public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_makepolygon(public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.st_makepolygon(public.geometry) TO anon;
GRANT ALL ON FUNCTION public.st_makepolygon(public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.st_makepolygon(public.geometry) TO service_role;


--
-- Name: FUNCTION st_makepolygon(public.geometry, public.geometry[]); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_makepolygon(public.geometry, public.geometry[]) TO postgres;
GRANT ALL ON FUNCTION public.st_makepolygon(public.geometry, public.geometry[]) TO anon;
GRANT ALL ON FUNCTION public.st_makepolygon(public.geometry, public.geometry[]) TO authenticated;
GRANT ALL ON FUNCTION public.st_makepolygon(public.geometry, public.geometry[]) TO service_role;


--
-- Name: FUNCTION st_makevalid(public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_makevalid(public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.st_makevalid(public.geometry) TO anon;
GRANT ALL ON FUNCTION public.st_makevalid(public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.st_makevalid(public.geometry) TO service_role;


--
-- Name: FUNCTION st_makevalid(geom public.geometry, params text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_makevalid(geom public.geometry, params text) TO postgres;
GRANT ALL ON FUNCTION public.st_makevalid(geom public.geometry, params text) TO anon;
GRANT ALL ON FUNCTION public.st_makevalid(geom public.geometry, params text) TO authenticated;
GRANT ALL ON FUNCTION public.st_makevalid(geom public.geometry, params text) TO service_role;


--
-- Name: FUNCTION st_maxdistance(geom1 public.geometry, geom2 public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_maxdistance(geom1 public.geometry, geom2 public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.st_maxdistance(geom1 public.geometry, geom2 public.geometry) TO anon;
GRANT ALL ON FUNCTION public.st_maxdistance(geom1 public.geometry, geom2 public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.st_maxdistance(geom1 public.geometry, geom2 public.geometry) TO service_role;


--
-- Name: FUNCTION st_maximuminscribedcircle(public.geometry, OUT center public.geometry, OUT nearest public.geometry, OUT radius double precision); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_maximuminscribedcircle(public.geometry, OUT center public.geometry, OUT nearest public.geometry, OUT radius double precision) TO postgres;
GRANT ALL ON FUNCTION public.st_maximuminscribedcircle(public.geometry, OUT center public.geometry, OUT nearest public.geometry, OUT radius double precision) TO anon;
GRANT ALL ON FUNCTION public.st_maximuminscribedcircle(public.geometry, OUT center public.geometry, OUT nearest public.geometry, OUT radius double precision) TO authenticated;
GRANT ALL ON FUNCTION public.st_maximuminscribedcircle(public.geometry, OUT center public.geometry, OUT nearest public.geometry, OUT radius double precision) TO service_role;


--
-- Name: FUNCTION st_memsize(public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_memsize(public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.st_memsize(public.geometry) TO anon;
GRANT ALL ON FUNCTION public.st_memsize(public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.st_memsize(public.geometry) TO service_role;


--
-- Name: FUNCTION st_minimumboundingcircle(inputgeom public.geometry, segs_per_quarter integer); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_minimumboundingcircle(inputgeom public.geometry, segs_per_quarter integer) TO postgres;
GRANT ALL ON FUNCTION public.st_minimumboundingcircle(inputgeom public.geometry, segs_per_quarter integer) TO anon;
GRANT ALL ON FUNCTION public.st_minimumboundingcircle(inputgeom public.geometry, segs_per_quarter integer) TO authenticated;
GRANT ALL ON FUNCTION public.st_minimumboundingcircle(inputgeom public.geometry, segs_per_quarter integer) TO service_role;


--
-- Name: FUNCTION st_minimumboundingradius(public.geometry, OUT center public.geometry, OUT radius double precision); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_minimumboundingradius(public.geometry, OUT center public.geometry, OUT radius double precision) TO postgres;
GRANT ALL ON FUNCTION public.st_minimumboundingradius(public.geometry, OUT center public.geometry, OUT radius double precision) TO anon;
GRANT ALL ON FUNCTION public.st_minimumboundingradius(public.geometry, OUT center public.geometry, OUT radius double precision) TO authenticated;
GRANT ALL ON FUNCTION public.st_minimumboundingradius(public.geometry, OUT center public.geometry, OUT radius double precision) TO service_role;


--
-- Name: FUNCTION st_minimumclearance(public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_minimumclearance(public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.st_minimumclearance(public.geometry) TO anon;
GRANT ALL ON FUNCTION public.st_minimumclearance(public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.st_minimumclearance(public.geometry) TO service_role;


--
-- Name: FUNCTION st_minimumclearanceline(public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_minimumclearanceline(public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.st_minimumclearanceline(public.geometry) TO anon;
GRANT ALL ON FUNCTION public.st_minimumclearanceline(public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.st_minimumclearanceline(public.geometry) TO service_role;


--
-- Name: FUNCTION st_mlinefromtext(text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_mlinefromtext(text) TO postgres;
GRANT ALL ON FUNCTION public.st_mlinefromtext(text) TO anon;
GRANT ALL ON FUNCTION public.st_mlinefromtext(text) TO authenticated;
GRANT ALL ON FUNCTION public.st_mlinefromtext(text) TO service_role;


--
-- Name: FUNCTION st_mlinefromtext(text, integer); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_mlinefromtext(text, integer) TO postgres;
GRANT ALL ON FUNCTION public.st_mlinefromtext(text, integer) TO anon;
GRANT ALL ON FUNCTION public.st_mlinefromtext(text, integer) TO authenticated;
GRANT ALL ON FUNCTION public.st_mlinefromtext(text, integer) TO service_role;


--
-- Name: FUNCTION st_mlinefromwkb(bytea); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_mlinefromwkb(bytea) TO postgres;
GRANT ALL ON FUNCTION public.st_mlinefromwkb(bytea) TO anon;
GRANT ALL ON FUNCTION public.st_mlinefromwkb(bytea) TO authenticated;
GRANT ALL ON FUNCTION public.st_mlinefromwkb(bytea) TO service_role;


--
-- Name: FUNCTION st_mlinefromwkb(bytea, integer); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_mlinefromwkb(bytea, integer) TO postgres;
GRANT ALL ON FUNCTION public.st_mlinefromwkb(bytea, integer) TO anon;
GRANT ALL ON FUNCTION public.st_mlinefromwkb(bytea, integer) TO authenticated;
GRANT ALL ON FUNCTION public.st_mlinefromwkb(bytea, integer) TO service_role;


--
-- Name: FUNCTION st_mpointfromtext(text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_mpointfromtext(text) TO postgres;
GRANT ALL ON FUNCTION public.st_mpointfromtext(text) TO anon;
GRANT ALL ON FUNCTION public.st_mpointfromtext(text) TO authenticated;
GRANT ALL ON FUNCTION public.st_mpointfromtext(text) TO service_role;


--
-- Name: FUNCTION st_mpointfromtext(text, integer); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_mpointfromtext(text, integer) TO postgres;
GRANT ALL ON FUNCTION public.st_mpointfromtext(text, integer) TO anon;
GRANT ALL ON FUNCTION public.st_mpointfromtext(text, integer) TO authenticated;
GRANT ALL ON FUNCTION public.st_mpointfromtext(text, integer) TO service_role;


--
-- Name: FUNCTION st_mpointfromwkb(bytea); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_mpointfromwkb(bytea) TO postgres;
GRANT ALL ON FUNCTION public.st_mpointfromwkb(bytea) TO anon;
GRANT ALL ON FUNCTION public.st_mpointfromwkb(bytea) TO authenticated;
GRANT ALL ON FUNCTION public.st_mpointfromwkb(bytea) TO service_role;


--
-- Name: FUNCTION st_mpointfromwkb(bytea, integer); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_mpointfromwkb(bytea, integer) TO postgres;
GRANT ALL ON FUNCTION public.st_mpointfromwkb(bytea, integer) TO anon;
GRANT ALL ON FUNCTION public.st_mpointfromwkb(bytea, integer) TO authenticated;
GRANT ALL ON FUNCTION public.st_mpointfromwkb(bytea, integer) TO service_role;


--
-- Name: FUNCTION st_mpolyfromtext(text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_mpolyfromtext(text) TO postgres;
GRANT ALL ON FUNCTION public.st_mpolyfromtext(text) TO anon;
GRANT ALL ON FUNCTION public.st_mpolyfromtext(text) TO authenticated;
GRANT ALL ON FUNCTION public.st_mpolyfromtext(text) TO service_role;


--
-- Name: FUNCTION st_mpolyfromtext(text, integer); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_mpolyfromtext(text, integer) TO postgres;
GRANT ALL ON FUNCTION public.st_mpolyfromtext(text, integer) TO anon;
GRANT ALL ON FUNCTION public.st_mpolyfromtext(text, integer) TO authenticated;
GRANT ALL ON FUNCTION public.st_mpolyfromtext(text, integer) TO service_role;


--
-- Name: FUNCTION st_mpolyfromwkb(bytea); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_mpolyfromwkb(bytea) TO postgres;
GRANT ALL ON FUNCTION public.st_mpolyfromwkb(bytea) TO anon;
GRANT ALL ON FUNCTION public.st_mpolyfromwkb(bytea) TO authenticated;
GRANT ALL ON FUNCTION public.st_mpolyfromwkb(bytea) TO service_role;


--
-- Name: FUNCTION st_mpolyfromwkb(bytea, integer); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_mpolyfromwkb(bytea, integer) TO postgres;
GRANT ALL ON FUNCTION public.st_mpolyfromwkb(bytea, integer) TO anon;
GRANT ALL ON FUNCTION public.st_mpolyfromwkb(bytea, integer) TO authenticated;
GRANT ALL ON FUNCTION public.st_mpolyfromwkb(bytea, integer) TO service_role;


--
-- Name: FUNCTION st_multi(public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_multi(public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.st_multi(public.geometry) TO anon;
GRANT ALL ON FUNCTION public.st_multi(public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.st_multi(public.geometry) TO service_role;


--
-- Name: FUNCTION st_multilinefromwkb(bytea); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_multilinefromwkb(bytea) TO postgres;
GRANT ALL ON FUNCTION public.st_multilinefromwkb(bytea) TO anon;
GRANT ALL ON FUNCTION public.st_multilinefromwkb(bytea) TO authenticated;
GRANT ALL ON FUNCTION public.st_multilinefromwkb(bytea) TO service_role;


--
-- Name: FUNCTION st_multilinestringfromtext(text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_multilinestringfromtext(text) TO postgres;
GRANT ALL ON FUNCTION public.st_multilinestringfromtext(text) TO anon;
GRANT ALL ON FUNCTION public.st_multilinestringfromtext(text) TO authenticated;
GRANT ALL ON FUNCTION public.st_multilinestringfromtext(text) TO service_role;


--
-- Name: FUNCTION st_multilinestringfromtext(text, integer); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_multilinestringfromtext(text, integer) TO postgres;
GRANT ALL ON FUNCTION public.st_multilinestringfromtext(text, integer) TO anon;
GRANT ALL ON FUNCTION public.st_multilinestringfromtext(text, integer) TO authenticated;
GRANT ALL ON FUNCTION public.st_multilinestringfromtext(text, integer) TO service_role;


--
-- Name: FUNCTION st_multipointfromtext(text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_multipointfromtext(text) TO postgres;
GRANT ALL ON FUNCTION public.st_multipointfromtext(text) TO anon;
GRANT ALL ON FUNCTION public.st_multipointfromtext(text) TO authenticated;
GRANT ALL ON FUNCTION public.st_multipointfromtext(text) TO service_role;


--
-- Name: FUNCTION st_multipointfromwkb(bytea); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_multipointfromwkb(bytea) TO postgres;
GRANT ALL ON FUNCTION public.st_multipointfromwkb(bytea) TO anon;
GRANT ALL ON FUNCTION public.st_multipointfromwkb(bytea) TO authenticated;
GRANT ALL ON FUNCTION public.st_multipointfromwkb(bytea) TO service_role;


--
-- Name: FUNCTION st_multipointfromwkb(bytea, integer); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_multipointfromwkb(bytea, integer) TO postgres;
GRANT ALL ON FUNCTION public.st_multipointfromwkb(bytea, integer) TO anon;
GRANT ALL ON FUNCTION public.st_multipointfromwkb(bytea, integer) TO authenticated;
GRANT ALL ON FUNCTION public.st_multipointfromwkb(bytea, integer) TO service_role;


--
-- Name: FUNCTION st_multipolyfromwkb(bytea); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_multipolyfromwkb(bytea) TO postgres;
GRANT ALL ON FUNCTION public.st_multipolyfromwkb(bytea) TO anon;
GRANT ALL ON FUNCTION public.st_multipolyfromwkb(bytea) TO authenticated;
GRANT ALL ON FUNCTION public.st_multipolyfromwkb(bytea) TO service_role;


--
-- Name: FUNCTION st_multipolyfromwkb(bytea, integer); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_multipolyfromwkb(bytea, integer) TO postgres;
GRANT ALL ON FUNCTION public.st_multipolyfromwkb(bytea, integer) TO anon;
GRANT ALL ON FUNCTION public.st_multipolyfromwkb(bytea, integer) TO authenticated;
GRANT ALL ON FUNCTION public.st_multipolyfromwkb(bytea, integer) TO service_role;


--
-- Name: FUNCTION st_multipolygonfromtext(text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_multipolygonfromtext(text) TO postgres;
GRANT ALL ON FUNCTION public.st_multipolygonfromtext(text) TO anon;
GRANT ALL ON FUNCTION public.st_multipolygonfromtext(text) TO authenticated;
GRANT ALL ON FUNCTION public.st_multipolygonfromtext(text) TO service_role;


--
-- Name: FUNCTION st_multipolygonfromtext(text, integer); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_multipolygonfromtext(text, integer) TO postgres;
GRANT ALL ON FUNCTION public.st_multipolygonfromtext(text, integer) TO anon;
GRANT ALL ON FUNCTION public.st_multipolygonfromtext(text, integer) TO authenticated;
GRANT ALL ON FUNCTION public.st_multipolygonfromtext(text, integer) TO service_role;


--
-- Name: FUNCTION st_ndims(public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_ndims(public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.st_ndims(public.geometry) TO anon;
GRANT ALL ON FUNCTION public.st_ndims(public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.st_ndims(public.geometry) TO service_role;


--
-- Name: FUNCTION st_node(g public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_node(g public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.st_node(g public.geometry) TO anon;
GRANT ALL ON FUNCTION public.st_node(g public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.st_node(g public.geometry) TO service_role;


--
-- Name: FUNCTION st_normalize(geom public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_normalize(geom public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.st_normalize(geom public.geometry) TO anon;
GRANT ALL ON FUNCTION public.st_normalize(geom public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.st_normalize(geom public.geometry) TO service_role;


--
-- Name: FUNCTION st_npoints(public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_npoints(public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.st_npoints(public.geometry) TO anon;
GRANT ALL ON FUNCTION public.st_npoints(public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.st_npoints(public.geometry) TO service_role;


--
-- Name: FUNCTION st_nrings(public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_nrings(public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.st_nrings(public.geometry) TO anon;
GRANT ALL ON FUNCTION public.st_nrings(public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.st_nrings(public.geometry) TO service_role;


--
-- Name: FUNCTION st_numgeometries(public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_numgeometries(public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.st_numgeometries(public.geometry) TO anon;
GRANT ALL ON FUNCTION public.st_numgeometries(public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.st_numgeometries(public.geometry) TO service_role;


--
-- Name: FUNCTION st_numinteriorring(public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_numinteriorring(public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.st_numinteriorring(public.geometry) TO anon;
GRANT ALL ON FUNCTION public.st_numinteriorring(public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.st_numinteriorring(public.geometry) TO service_role;


--
-- Name: FUNCTION st_numinteriorrings(public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_numinteriorrings(public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.st_numinteriorrings(public.geometry) TO anon;
GRANT ALL ON FUNCTION public.st_numinteriorrings(public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.st_numinteriorrings(public.geometry) TO service_role;


--
-- Name: FUNCTION st_numpatches(public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_numpatches(public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.st_numpatches(public.geometry) TO anon;
GRANT ALL ON FUNCTION public.st_numpatches(public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.st_numpatches(public.geometry) TO service_role;


--
-- Name: FUNCTION st_numpoints(public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_numpoints(public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.st_numpoints(public.geometry) TO anon;
GRANT ALL ON FUNCTION public.st_numpoints(public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.st_numpoints(public.geometry) TO service_role;


--
-- Name: FUNCTION st_offsetcurve(line public.geometry, distance double precision, params text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_offsetcurve(line public.geometry, distance double precision, params text) TO postgres;
GRANT ALL ON FUNCTION public.st_offsetcurve(line public.geometry, distance double precision, params text) TO anon;
GRANT ALL ON FUNCTION public.st_offsetcurve(line public.geometry, distance double precision, params text) TO authenticated;
GRANT ALL ON FUNCTION public.st_offsetcurve(line public.geometry, distance double precision, params text) TO service_role;


--
-- Name: FUNCTION st_orderingequals(geom1 public.geometry, geom2 public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_orderingequals(geom1 public.geometry, geom2 public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.st_orderingequals(geom1 public.geometry, geom2 public.geometry) TO anon;
GRANT ALL ON FUNCTION public.st_orderingequals(geom1 public.geometry, geom2 public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.st_orderingequals(geom1 public.geometry, geom2 public.geometry) TO service_role;


--
-- Name: FUNCTION st_orientedenvelope(public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_orientedenvelope(public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.st_orientedenvelope(public.geometry) TO anon;
GRANT ALL ON FUNCTION public.st_orientedenvelope(public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.st_orientedenvelope(public.geometry) TO service_role;


--
-- Name: FUNCTION st_overlaps(geom1 public.geometry, geom2 public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_overlaps(geom1 public.geometry, geom2 public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.st_overlaps(geom1 public.geometry, geom2 public.geometry) TO anon;
GRANT ALL ON FUNCTION public.st_overlaps(geom1 public.geometry, geom2 public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.st_overlaps(geom1 public.geometry, geom2 public.geometry) TO service_role;


--
-- Name: FUNCTION st_patchn(public.geometry, integer); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_patchn(public.geometry, integer) TO postgres;
GRANT ALL ON FUNCTION public.st_patchn(public.geometry, integer) TO anon;
GRANT ALL ON FUNCTION public.st_patchn(public.geometry, integer) TO authenticated;
GRANT ALL ON FUNCTION public.st_patchn(public.geometry, integer) TO service_role;


--
-- Name: FUNCTION st_perimeter(public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_perimeter(public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.st_perimeter(public.geometry) TO anon;
GRANT ALL ON FUNCTION public.st_perimeter(public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.st_perimeter(public.geometry) TO service_role;


--
-- Name: FUNCTION st_perimeter(geog public.geography, use_spheroid boolean); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_perimeter(geog public.geography, use_spheroid boolean) TO postgres;
GRANT ALL ON FUNCTION public.st_perimeter(geog public.geography, use_spheroid boolean) TO anon;
GRANT ALL ON FUNCTION public.st_perimeter(geog public.geography, use_spheroid boolean) TO authenticated;
GRANT ALL ON FUNCTION public.st_perimeter(geog public.geography, use_spheroid boolean) TO service_role;


--
-- Name: FUNCTION st_perimeter2d(public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_perimeter2d(public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.st_perimeter2d(public.geometry) TO anon;
GRANT ALL ON FUNCTION public.st_perimeter2d(public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.st_perimeter2d(public.geometry) TO service_role;


--
-- Name: FUNCTION st_point(double precision, double precision); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_point(double precision, double precision) TO postgres;
GRANT ALL ON FUNCTION public.st_point(double precision, double precision) TO anon;
GRANT ALL ON FUNCTION public.st_point(double precision, double precision) TO authenticated;
GRANT ALL ON FUNCTION public.st_point(double precision, double precision) TO service_role;


--
-- Name: FUNCTION st_point(double precision, double precision, srid integer); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_point(double precision, double precision, srid integer) TO postgres;
GRANT ALL ON FUNCTION public.st_point(double precision, double precision, srid integer) TO anon;
GRANT ALL ON FUNCTION public.st_point(double precision, double precision, srid integer) TO authenticated;
GRANT ALL ON FUNCTION public.st_point(double precision, double precision, srid integer) TO service_role;


--
-- Name: FUNCTION st_pointfromgeohash(text, integer); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_pointfromgeohash(text, integer) TO postgres;
GRANT ALL ON FUNCTION public.st_pointfromgeohash(text, integer) TO anon;
GRANT ALL ON FUNCTION public.st_pointfromgeohash(text, integer) TO authenticated;
GRANT ALL ON FUNCTION public.st_pointfromgeohash(text, integer) TO service_role;


--
-- Name: FUNCTION st_pointfromtext(text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_pointfromtext(text) TO postgres;
GRANT ALL ON FUNCTION public.st_pointfromtext(text) TO anon;
GRANT ALL ON FUNCTION public.st_pointfromtext(text) TO authenticated;
GRANT ALL ON FUNCTION public.st_pointfromtext(text) TO service_role;


--
-- Name: FUNCTION st_pointfromtext(text, integer); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_pointfromtext(text, integer) TO postgres;
GRANT ALL ON FUNCTION public.st_pointfromtext(text, integer) TO anon;
GRANT ALL ON FUNCTION public.st_pointfromtext(text, integer) TO authenticated;
GRANT ALL ON FUNCTION public.st_pointfromtext(text, integer) TO service_role;


--
-- Name: FUNCTION st_pointfromwkb(bytea); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_pointfromwkb(bytea) TO postgres;
GRANT ALL ON FUNCTION public.st_pointfromwkb(bytea) TO anon;
GRANT ALL ON FUNCTION public.st_pointfromwkb(bytea) TO authenticated;
GRANT ALL ON FUNCTION public.st_pointfromwkb(bytea) TO service_role;


--
-- Name: FUNCTION st_pointfromwkb(bytea, integer); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_pointfromwkb(bytea, integer) TO postgres;
GRANT ALL ON FUNCTION public.st_pointfromwkb(bytea, integer) TO anon;
GRANT ALL ON FUNCTION public.st_pointfromwkb(bytea, integer) TO authenticated;
GRANT ALL ON FUNCTION public.st_pointfromwkb(bytea, integer) TO service_role;


--
-- Name: FUNCTION st_pointinsidecircle(public.geometry, double precision, double precision, double precision); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_pointinsidecircle(public.geometry, double precision, double precision, double precision) TO postgres;
GRANT ALL ON FUNCTION public.st_pointinsidecircle(public.geometry, double precision, double precision, double precision) TO anon;
GRANT ALL ON FUNCTION public.st_pointinsidecircle(public.geometry, double precision, double precision, double precision) TO authenticated;
GRANT ALL ON FUNCTION public.st_pointinsidecircle(public.geometry, double precision, double precision, double precision) TO service_role;


--
-- Name: FUNCTION st_pointm(xcoordinate double precision, ycoordinate double precision, mcoordinate double precision, srid integer); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_pointm(xcoordinate double precision, ycoordinate double precision, mcoordinate double precision, srid integer) TO postgres;
GRANT ALL ON FUNCTION public.st_pointm(xcoordinate double precision, ycoordinate double precision, mcoordinate double precision, srid integer) TO anon;
GRANT ALL ON FUNCTION public.st_pointm(xcoordinate double precision, ycoordinate double precision, mcoordinate double precision, srid integer) TO authenticated;
GRANT ALL ON FUNCTION public.st_pointm(xcoordinate double precision, ycoordinate double precision, mcoordinate double precision, srid integer) TO service_role;


--
-- Name: FUNCTION st_pointn(public.geometry, integer); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_pointn(public.geometry, integer) TO postgres;
GRANT ALL ON FUNCTION public.st_pointn(public.geometry, integer) TO anon;
GRANT ALL ON FUNCTION public.st_pointn(public.geometry, integer) TO authenticated;
GRANT ALL ON FUNCTION public.st_pointn(public.geometry, integer) TO service_role;


--
-- Name: FUNCTION st_pointonsurface(public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_pointonsurface(public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.st_pointonsurface(public.geometry) TO anon;
GRANT ALL ON FUNCTION public.st_pointonsurface(public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.st_pointonsurface(public.geometry) TO service_role;


--
-- Name: FUNCTION st_points(public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_points(public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.st_points(public.geometry) TO anon;
GRANT ALL ON FUNCTION public.st_points(public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.st_points(public.geometry) TO service_role;


--
-- Name: FUNCTION st_pointz(xcoordinate double precision, ycoordinate double precision, zcoordinate double precision, srid integer); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_pointz(xcoordinate double precision, ycoordinate double precision, zcoordinate double precision, srid integer) TO postgres;
GRANT ALL ON FUNCTION public.st_pointz(xcoordinate double precision, ycoordinate double precision, zcoordinate double precision, srid integer) TO anon;
GRANT ALL ON FUNCTION public.st_pointz(xcoordinate double precision, ycoordinate double precision, zcoordinate double precision, srid integer) TO authenticated;
GRANT ALL ON FUNCTION public.st_pointz(xcoordinate double precision, ycoordinate double precision, zcoordinate double precision, srid integer) TO service_role;


--
-- Name: FUNCTION st_pointzm(xcoordinate double precision, ycoordinate double precision, zcoordinate double precision, mcoordinate double precision, srid integer); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_pointzm(xcoordinate double precision, ycoordinate double precision, zcoordinate double precision, mcoordinate double precision, srid integer) TO postgres;
GRANT ALL ON FUNCTION public.st_pointzm(xcoordinate double precision, ycoordinate double precision, zcoordinate double precision, mcoordinate double precision, srid integer) TO anon;
GRANT ALL ON FUNCTION public.st_pointzm(xcoordinate double precision, ycoordinate double precision, zcoordinate double precision, mcoordinate double precision, srid integer) TO authenticated;
GRANT ALL ON FUNCTION public.st_pointzm(xcoordinate double precision, ycoordinate double precision, zcoordinate double precision, mcoordinate double precision, srid integer) TO service_role;


--
-- Name: FUNCTION st_polyfromtext(text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_polyfromtext(text) TO postgres;
GRANT ALL ON FUNCTION public.st_polyfromtext(text) TO anon;
GRANT ALL ON FUNCTION public.st_polyfromtext(text) TO authenticated;
GRANT ALL ON FUNCTION public.st_polyfromtext(text) TO service_role;


--
-- Name: FUNCTION st_polyfromtext(text, integer); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_polyfromtext(text, integer) TO postgres;
GRANT ALL ON FUNCTION public.st_polyfromtext(text, integer) TO anon;
GRANT ALL ON FUNCTION public.st_polyfromtext(text, integer) TO authenticated;
GRANT ALL ON FUNCTION public.st_polyfromtext(text, integer) TO service_role;


--
-- Name: FUNCTION st_polyfromwkb(bytea); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_polyfromwkb(bytea) TO postgres;
GRANT ALL ON FUNCTION public.st_polyfromwkb(bytea) TO anon;
GRANT ALL ON FUNCTION public.st_polyfromwkb(bytea) TO authenticated;
GRANT ALL ON FUNCTION public.st_polyfromwkb(bytea) TO service_role;


--
-- Name: FUNCTION st_polyfromwkb(bytea, integer); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_polyfromwkb(bytea, integer) TO postgres;
GRANT ALL ON FUNCTION public.st_polyfromwkb(bytea, integer) TO anon;
GRANT ALL ON FUNCTION public.st_polyfromwkb(bytea, integer) TO authenticated;
GRANT ALL ON FUNCTION public.st_polyfromwkb(bytea, integer) TO service_role;


--
-- Name: FUNCTION st_polygon(public.geometry, integer); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_polygon(public.geometry, integer) TO postgres;
GRANT ALL ON FUNCTION public.st_polygon(public.geometry, integer) TO anon;
GRANT ALL ON FUNCTION public.st_polygon(public.geometry, integer) TO authenticated;
GRANT ALL ON FUNCTION public.st_polygon(public.geometry, integer) TO service_role;


--
-- Name: FUNCTION st_polygonfromtext(text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_polygonfromtext(text) TO postgres;
GRANT ALL ON FUNCTION public.st_polygonfromtext(text) TO anon;
GRANT ALL ON FUNCTION public.st_polygonfromtext(text) TO authenticated;
GRANT ALL ON FUNCTION public.st_polygonfromtext(text) TO service_role;


--
-- Name: FUNCTION st_polygonfromtext(text, integer); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_polygonfromtext(text, integer) TO postgres;
GRANT ALL ON FUNCTION public.st_polygonfromtext(text, integer) TO anon;
GRANT ALL ON FUNCTION public.st_polygonfromtext(text, integer) TO authenticated;
GRANT ALL ON FUNCTION public.st_polygonfromtext(text, integer) TO service_role;


--
-- Name: FUNCTION st_polygonfromwkb(bytea); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_polygonfromwkb(bytea) TO postgres;
GRANT ALL ON FUNCTION public.st_polygonfromwkb(bytea) TO anon;
GRANT ALL ON FUNCTION public.st_polygonfromwkb(bytea) TO authenticated;
GRANT ALL ON FUNCTION public.st_polygonfromwkb(bytea) TO service_role;


--
-- Name: FUNCTION st_polygonfromwkb(bytea, integer); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_polygonfromwkb(bytea, integer) TO postgres;
GRANT ALL ON FUNCTION public.st_polygonfromwkb(bytea, integer) TO anon;
GRANT ALL ON FUNCTION public.st_polygonfromwkb(bytea, integer) TO authenticated;
GRANT ALL ON FUNCTION public.st_polygonfromwkb(bytea, integer) TO service_role;


--
-- Name: FUNCTION st_polygonize(public.geometry[]); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_polygonize(public.geometry[]) TO postgres;
GRANT ALL ON FUNCTION public.st_polygonize(public.geometry[]) TO anon;
GRANT ALL ON FUNCTION public.st_polygonize(public.geometry[]) TO authenticated;
GRANT ALL ON FUNCTION public.st_polygonize(public.geometry[]) TO service_role;


--
-- Name: FUNCTION st_project(geog public.geography, distance double precision, azimuth double precision); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_project(geog public.geography, distance double precision, azimuth double precision) TO postgres;
GRANT ALL ON FUNCTION public.st_project(geog public.geography, distance double precision, azimuth double precision) TO anon;
GRANT ALL ON FUNCTION public.st_project(geog public.geography, distance double precision, azimuth double precision) TO authenticated;
GRANT ALL ON FUNCTION public.st_project(geog public.geography, distance double precision, azimuth double precision) TO service_role;


--
-- Name: FUNCTION st_quantizecoordinates(g public.geometry, prec_x integer, prec_y integer, prec_z integer, prec_m integer); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_quantizecoordinates(g public.geometry, prec_x integer, prec_y integer, prec_z integer, prec_m integer) TO postgres;
GRANT ALL ON FUNCTION public.st_quantizecoordinates(g public.geometry, prec_x integer, prec_y integer, prec_z integer, prec_m integer) TO anon;
GRANT ALL ON FUNCTION public.st_quantizecoordinates(g public.geometry, prec_x integer, prec_y integer, prec_z integer, prec_m integer) TO authenticated;
GRANT ALL ON FUNCTION public.st_quantizecoordinates(g public.geometry, prec_x integer, prec_y integer, prec_z integer, prec_m integer) TO service_role;


--
-- Name: FUNCTION st_reduceprecision(geom public.geometry, gridsize double precision); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_reduceprecision(geom public.geometry, gridsize double precision) TO postgres;
GRANT ALL ON FUNCTION public.st_reduceprecision(geom public.geometry, gridsize double precision) TO anon;
GRANT ALL ON FUNCTION public.st_reduceprecision(geom public.geometry, gridsize double precision) TO authenticated;
GRANT ALL ON FUNCTION public.st_reduceprecision(geom public.geometry, gridsize double precision) TO service_role;


--
-- Name: FUNCTION st_relate(geom1 public.geometry, geom2 public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_relate(geom1 public.geometry, geom2 public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.st_relate(geom1 public.geometry, geom2 public.geometry) TO anon;
GRANT ALL ON FUNCTION public.st_relate(geom1 public.geometry, geom2 public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.st_relate(geom1 public.geometry, geom2 public.geometry) TO service_role;


--
-- Name: FUNCTION st_relate(geom1 public.geometry, geom2 public.geometry, integer); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_relate(geom1 public.geometry, geom2 public.geometry, integer) TO postgres;
GRANT ALL ON FUNCTION public.st_relate(geom1 public.geometry, geom2 public.geometry, integer) TO anon;
GRANT ALL ON FUNCTION public.st_relate(geom1 public.geometry, geom2 public.geometry, integer) TO authenticated;
GRANT ALL ON FUNCTION public.st_relate(geom1 public.geometry, geom2 public.geometry, integer) TO service_role;


--
-- Name: FUNCTION st_relate(geom1 public.geometry, geom2 public.geometry, text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_relate(geom1 public.geometry, geom2 public.geometry, text) TO postgres;
GRANT ALL ON FUNCTION public.st_relate(geom1 public.geometry, geom2 public.geometry, text) TO anon;
GRANT ALL ON FUNCTION public.st_relate(geom1 public.geometry, geom2 public.geometry, text) TO authenticated;
GRANT ALL ON FUNCTION public.st_relate(geom1 public.geometry, geom2 public.geometry, text) TO service_role;


--
-- Name: FUNCTION st_relatematch(text, text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_relatematch(text, text) TO postgres;
GRANT ALL ON FUNCTION public.st_relatematch(text, text) TO anon;
GRANT ALL ON FUNCTION public.st_relatematch(text, text) TO authenticated;
GRANT ALL ON FUNCTION public.st_relatematch(text, text) TO service_role;


--
-- Name: FUNCTION st_removepoint(public.geometry, integer); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_removepoint(public.geometry, integer) TO postgres;
GRANT ALL ON FUNCTION public.st_removepoint(public.geometry, integer) TO anon;
GRANT ALL ON FUNCTION public.st_removepoint(public.geometry, integer) TO authenticated;
GRANT ALL ON FUNCTION public.st_removepoint(public.geometry, integer) TO service_role;


--
-- Name: FUNCTION st_removerepeatedpoints(geom public.geometry, tolerance double precision); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_removerepeatedpoints(geom public.geometry, tolerance double precision) TO postgres;
GRANT ALL ON FUNCTION public.st_removerepeatedpoints(geom public.geometry, tolerance double precision) TO anon;
GRANT ALL ON FUNCTION public.st_removerepeatedpoints(geom public.geometry, tolerance double precision) TO authenticated;
GRANT ALL ON FUNCTION public.st_removerepeatedpoints(geom public.geometry, tolerance double precision) TO service_role;


--
-- Name: FUNCTION st_reverse(public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_reverse(public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.st_reverse(public.geometry) TO anon;
GRANT ALL ON FUNCTION public.st_reverse(public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.st_reverse(public.geometry) TO service_role;


--
-- Name: FUNCTION st_rotate(public.geometry, double precision); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_rotate(public.geometry, double precision) TO postgres;
GRANT ALL ON FUNCTION public.st_rotate(public.geometry, double precision) TO anon;
GRANT ALL ON FUNCTION public.st_rotate(public.geometry, double precision) TO authenticated;
GRANT ALL ON FUNCTION public.st_rotate(public.geometry, double precision) TO service_role;


--
-- Name: FUNCTION st_rotate(public.geometry, double precision, public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_rotate(public.geometry, double precision, public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.st_rotate(public.geometry, double precision, public.geometry) TO anon;
GRANT ALL ON FUNCTION public.st_rotate(public.geometry, double precision, public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.st_rotate(public.geometry, double precision, public.geometry) TO service_role;


--
-- Name: FUNCTION st_rotate(public.geometry, double precision, double precision, double precision); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_rotate(public.geometry, double precision, double precision, double precision) TO postgres;
GRANT ALL ON FUNCTION public.st_rotate(public.geometry, double precision, double precision, double precision) TO anon;
GRANT ALL ON FUNCTION public.st_rotate(public.geometry, double precision, double precision, double precision) TO authenticated;
GRANT ALL ON FUNCTION public.st_rotate(public.geometry, double precision, double precision, double precision) TO service_role;


--
-- Name: FUNCTION st_rotatex(public.geometry, double precision); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_rotatex(public.geometry, double precision) TO postgres;
GRANT ALL ON FUNCTION public.st_rotatex(public.geometry, double precision) TO anon;
GRANT ALL ON FUNCTION public.st_rotatex(public.geometry, double precision) TO authenticated;
GRANT ALL ON FUNCTION public.st_rotatex(public.geometry, double precision) TO service_role;


--
-- Name: FUNCTION st_rotatey(public.geometry, double precision); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_rotatey(public.geometry, double precision) TO postgres;
GRANT ALL ON FUNCTION public.st_rotatey(public.geometry, double precision) TO anon;
GRANT ALL ON FUNCTION public.st_rotatey(public.geometry, double precision) TO authenticated;
GRANT ALL ON FUNCTION public.st_rotatey(public.geometry, double precision) TO service_role;


--
-- Name: FUNCTION st_rotatez(public.geometry, double precision); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_rotatez(public.geometry, double precision) TO postgres;
GRANT ALL ON FUNCTION public.st_rotatez(public.geometry, double precision) TO anon;
GRANT ALL ON FUNCTION public.st_rotatez(public.geometry, double precision) TO authenticated;
GRANT ALL ON FUNCTION public.st_rotatez(public.geometry, double precision) TO service_role;


--
-- Name: FUNCTION st_scale(public.geometry, public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_scale(public.geometry, public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.st_scale(public.geometry, public.geometry) TO anon;
GRANT ALL ON FUNCTION public.st_scale(public.geometry, public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.st_scale(public.geometry, public.geometry) TO service_role;


--
-- Name: FUNCTION st_scale(public.geometry, double precision, double precision); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_scale(public.geometry, double precision, double precision) TO postgres;
GRANT ALL ON FUNCTION public.st_scale(public.geometry, double precision, double precision) TO anon;
GRANT ALL ON FUNCTION public.st_scale(public.geometry, double precision, double precision) TO authenticated;
GRANT ALL ON FUNCTION public.st_scale(public.geometry, double precision, double precision) TO service_role;


--
-- Name: FUNCTION st_scale(public.geometry, public.geometry, origin public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_scale(public.geometry, public.geometry, origin public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.st_scale(public.geometry, public.geometry, origin public.geometry) TO anon;
GRANT ALL ON FUNCTION public.st_scale(public.geometry, public.geometry, origin public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.st_scale(public.geometry, public.geometry, origin public.geometry) TO service_role;


--
-- Name: FUNCTION st_scale(public.geometry, double precision, double precision, double precision); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_scale(public.geometry, double precision, double precision, double precision) TO postgres;
GRANT ALL ON FUNCTION public.st_scale(public.geometry, double precision, double precision, double precision) TO anon;
GRANT ALL ON FUNCTION public.st_scale(public.geometry, double precision, double precision, double precision) TO authenticated;
GRANT ALL ON FUNCTION public.st_scale(public.geometry, double precision, double precision, double precision) TO service_role;


--
-- Name: FUNCTION st_scroll(public.geometry, public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_scroll(public.geometry, public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.st_scroll(public.geometry, public.geometry) TO anon;
GRANT ALL ON FUNCTION public.st_scroll(public.geometry, public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.st_scroll(public.geometry, public.geometry) TO service_role;


--
-- Name: FUNCTION st_segmentize(geog public.geography, max_segment_length double precision); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_segmentize(geog public.geography, max_segment_length double precision) TO postgres;
GRANT ALL ON FUNCTION public.st_segmentize(geog public.geography, max_segment_length double precision) TO anon;
GRANT ALL ON FUNCTION public.st_segmentize(geog public.geography, max_segment_length double precision) TO authenticated;
GRANT ALL ON FUNCTION public.st_segmentize(geog public.geography, max_segment_length double precision) TO service_role;


--
-- Name: FUNCTION st_segmentize(public.geometry, double precision); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_segmentize(public.geometry, double precision) TO postgres;
GRANT ALL ON FUNCTION public.st_segmentize(public.geometry, double precision) TO anon;
GRANT ALL ON FUNCTION public.st_segmentize(public.geometry, double precision) TO authenticated;
GRANT ALL ON FUNCTION public.st_segmentize(public.geometry, double precision) TO service_role;


--
-- Name: FUNCTION st_seteffectivearea(public.geometry, double precision, integer); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_seteffectivearea(public.geometry, double precision, integer) TO postgres;
GRANT ALL ON FUNCTION public.st_seteffectivearea(public.geometry, double precision, integer) TO anon;
GRANT ALL ON FUNCTION public.st_seteffectivearea(public.geometry, double precision, integer) TO authenticated;
GRANT ALL ON FUNCTION public.st_seteffectivearea(public.geometry, double precision, integer) TO service_role;


--
-- Name: FUNCTION st_setpoint(public.geometry, integer, public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_setpoint(public.geometry, integer, public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.st_setpoint(public.geometry, integer, public.geometry) TO anon;
GRANT ALL ON FUNCTION public.st_setpoint(public.geometry, integer, public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.st_setpoint(public.geometry, integer, public.geometry) TO service_role;


--
-- Name: FUNCTION st_setsrid(geog public.geography, srid integer); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_setsrid(geog public.geography, srid integer) TO postgres;
GRANT ALL ON FUNCTION public.st_setsrid(geog public.geography, srid integer) TO anon;
GRANT ALL ON FUNCTION public.st_setsrid(geog public.geography, srid integer) TO authenticated;
GRANT ALL ON FUNCTION public.st_setsrid(geog public.geography, srid integer) TO service_role;


--
-- Name: FUNCTION st_setsrid(geom public.geometry, srid integer); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_setsrid(geom public.geometry, srid integer) TO postgres;
GRANT ALL ON FUNCTION public.st_setsrid(geom public.geometry, srid integer) TO anon;
GRANT ALL ON FUNCTION public.st_setsrid(geom public.geometry, srid integer) TO authenticated;
GRANT ALL ON FUNCTION public.st_setsrid(geom public.geometry, srid integer) TO service_role;


--
-- Name: FUNCTION st_sharedpaths(geom1 public.geometry, geom2 public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_sharedpaths(geom1 public.geometry, geom2 public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.st_sharedpaths(geom1 public.geometry, geom2 public.geometry) TO anon;
GRANT ALL ON FUNCTION public.st_sharedpaths(geom1 public.geometry, geom2 public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.st_sharedpaths(geom1 public.geometry, geom2 public.geometry) TO service_role;


--
-- Name: FUNCTION st_shiftlongitude(public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_shiftlongitude(public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.st_shiftlongitude(public.geometry) TO anon;
GRANT ALL ON FUNCTION public.st_shiftlongitude(public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.st_shiftlongitude(public.geometry) TO service_role;


--
-- Name: FUNCTION st_shortestline(geom1 public.geometry, geom2 public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_shortestline(geom1 public.geometry, geom2 public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.st_shortestline(geom1 public.geometry, geom2 public.geometry) TO anon;
GRANT ALL ON FUNCTION public.st_shortestline(geom1 public.geometry, geom2 public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.st_shortestline(geom1 public.geometry, geom2 public.geometry) TO service_role;


--
-- Name: FUNCTION st_simplify(public.geometry, double precision); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_simplify(public.geometry, double precision) TO postgres;
GRANT ALL ON FUNCTION public.st_simplify(public.geometry, double precision) TO anon;
GRANT ALL ON FUNCTION public.st_simplify(public.geometry, double precision) TO authenticated;
GRANT ALL ON FUNCTION public.st_simplify(public.geometry, double precision) TO service_role;


--
-- Name: FUNCTION st_simplify(public.geometry, double precision, boolean); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_simplify(public.geometry, double precision, boolean) TO postgres;
GRANT ALL ON FUNCTION public.st_simplify(public.geometry, double precision, boolean) TO anon;
GRANT ALL ON FUNCTION public.st_simplify(public.geometry, double precision, boolean) TO authenticated;
GRANT ALL ON FUNCTION public.st_simplify(public.geometry, double precision, boolean) TO service_role;


--
-- Name: FUNCTION st_simplifypolygonhull(geom public.geometry, vertex_fraction double precision, is_outer boolean); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_simplifypolygonhull(geom public.geometry, vertex_fraction double precision, is_outer boolean) TO postgres;
GRANT ALL ON FUNCTION public.st_simplifypolygonhull(geom public.geometry, vertex_fraction double precision, is_outer boolean) TO anon;
GRANT ALL ON FUNCTION public.st_simplifypolygonhull(geom public.geometry, vertex_fraction double precision, is_outer boolean) TO authenticated;
GRANT ALL ON FUNCTION public.st_simplifypolygonhull(geom public.geometry, vertex_fraction double precision, is_outer boolean) TO service_role;


--
-- Name: FUNCTION st_simplifypreservetopology(public.geometry, double precision); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_simplifypreservetopology(public.geometry, double precision) TO postgres;
GRANT ALL ON FUNCTION public.st_simplifypreservetopology(public.geometry, double precision) TO anon;
GRANT ALL ON FUNCTION public.st_simplifypreservetopology(public.geometry, double precision) TO authenticated;
GRANT ALL ON FUNCTION public.st_simplifypreservetopology(public.geometry, double precision) TO service_role;


--
-- Name: FUNCTION st_simplifyvw(public.geometry, double precision); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_simplifyvw(public.geometry, double precision) TO postgres;
GRANT ALL ON FUNCTION public.st_simplifyvw(public.geometry, double precision) TO anon;
GRANT ALL ON FUNCTION public.st_simplifyvw(public.geometry, double precision) TO authenticated;
GRANT ALL ON FUNCTION public.st_simplifyvw(public.geometry, double precision) TO service_role;


--
-- Name: FUNCTION st_snap(geom1 public.geometry, geom2 public.geometry, double precision); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_snap(geom1 public.geometry, geom2 public.geometry, double precision) TO postgres;
GRANT ALL ON FUNCTION public.st_snap(geom1 public.geometry, geom2 public.geometry, double precision) TO anon;
GRANT ALL ON FUNCTION public.st_snap(geom1 public.geometry, geom2 public.geometry, double precision) TO authenticated;
GRANT ALL ON FUNCTION public.st_snap(geom1 public.geometry, geom2 public.geometry, double precision) TO service_role;


--
-- Name: FUNCTION st_snaptogrid(public.geometry, double precision); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_snaptogrid(public.geometry, double precision) TO postgres;
GRANT ALL ON FUNCTION public.st_snaptogrid(public.geometry, double precision) TO anon;
GRANT ALL ON FUNCTION public.st_snaptogrid(public.geometry, double precision) TO authenticated;
GRANT ALL ON FUNCTION public.st_snaptogrid(public.geometry, double precision) TO service_role;


--
-- Name: FUNCTION st_snaptogrid(public.geometry, double precision, double precision); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_snaptogrid(public.geometry, double precision, double precision) TO postgres;
GRANT ALL ON FUNCTION public.st_snaptogrid(public.geometry, double precision, double precision) TO anon;
GRANT ALL ON FUNCTION public.st_snaptogrid(public.geometry, double precision, double precision) TO authenticated;
GRANT ALL ON FUNCTION public.st_snaptogrid(public.geometry, double precision, double precision) TO service_role;


--
-- Name: FUNCTION st_snaptogrid(public.geometry, double precision, double precision, double precision, double precision); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_snaptogrid(public.geometry, double precision, double precision, double precision, double precision) TO postgres;
GRANT ALL ON FUNCTION public.st_snaptogrid(public.geometry, double precision, double precision, double precision, double precision) TO anon;
GRANT ALL ON FUNCTION public.st_snaptogrid(public.geometry, double precision, double precision, double precision, double precision) TO authenticated;
GRANT ALL ON FUNCTION public.st_snaptogrid(public.geometry, double precision, double precision, double precision, double precision) TO service_role;


--
-- Name: FUNCTION st_snaptogrid(geom1 public.geometry, geom2 public.geometry, double precision, double precision, double precision, double precision); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_snaptogrid(geom1 public.geometry, geom2 public.geometry, double precision, double precision, double precision, double precision) TO postgres;
GRANT ALL ON FUNCTION public.st_snaptogrid(geom1 public.geometry, geom2 public.geometry, double precision, double precision, double precision, double precision) TO anon;
GRANT ALL ON FUNCTION public.st_snaptogrid(geom1 public.geometry, geom2 public.geometry, double precision, double precision, double precision, double precision) TO authenticated;
GRANT ALL ON FUNCTION public.st_snaptogrid(geom1 public.geometry, geom2 public.geometry, double precision, double precision, double precision, double precision) TO service_role;


--
-- Name: FUNCTION st_split(geom1 public.geometry, geom2 public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_split(geom1 public.geometry, geom2 public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.st_split(geom1 public.geometry, geom2 public.geometry) TO anon;
GRANT ALL ON FUNCTION public.st_split(geom1 public.geometry, geom2 public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.st_split(geom1 public.geometry, geom2 public.geometry) TO service_role;


--
-- Name: FUNCTION st_square(size double precision, cell_i integer, cell_j integer, origin public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_square(size double precision, cell_i integer, cell_j integer, origin public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.st_square(size double precision, cell_i integer, cell_j integer, origin public.geometry) TO anon;
GRANT ALL ON FUNCTION public.st_square(size double precision, cell_i integer, cell_j integer, origin public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.st_square(size double precision, cell_i integer, cell_j integer, origin public.geometry) TO service_role;


--
-- Name: FUNCTION st_squaregrid(size double precision, bounds public.geometry, OUT geom public.geometry, OUT i integer, OUT j integer); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_squaregrid(size double precision, bounds public.geometry, OUT geom public.geometry, OUT i integer, OUT j integer) TO postgres;
GRANT ALL ON FUNCTION public.st_squaregrid(size double precision, bounds public.geometry, OUT geom public.geometry, OUT i integer, OUT j integer) TO anon;
GRANT ALL ON FUNCTION public.st_squaregrid(size double precision, bounds public.geometry, OUT geom public.geometry, OUT i integer, OUT j integer) TO authenticated;
GRANT ALL ON FUNCTION public.st_squaregrid(size double precision, bounds public.geometry, OUT geom public.geometry, OUT i integer, OUT j integer) TO service_role;


--
-- Name: FUNCTION st_srid(geog public.geography); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_srid(geog public.geography) TO postgres;
GRANT ALL ON FUNCTION public.st_srid(geog public.geography) TO anon;
GRANT ALL ON FUNCTION public.st_srid(geog public.geography) TO authenticated;
GRANT ALL ON FUNCTION public.st_srid(geog public.geography) TO service_role;


--
-- Name: FUNCTION st_srid(geom public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_srid(geom public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.st_srid(geom public.geometry) TO anon;
GRANT ALL ON FUNCTION public.st_srid(geom public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.st_srid(geom public.geometry) TO service_role;


--
-- Name: FUNCTION st_startpoint(public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_startpoint(public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.st_startpoint(public.geometry) TO anon;
GRANT ALL ON FUNCTION public.st_startpoint(public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.st_startpoint(public.geometry) TO service_role;


--
-- Name: FUNCTION st_subdivide(geom public.geometry, maxvertices integer, gridsize double precision); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_subdivide(geom public.geometry, maxvertices integer, gridsize double precision) TO postgres;
GRANT ALL ON FUNCTION public.st_subdivide(geom public.geometry, maxvertices integer, gridsize double precision) TO anon;
GRANT ALL ON FUNCTION public.st_subdivide(geom public.geometry, maxvertices integer, gridsize double precision) TO authenticated;
GRANT ALL ON FUNCTION public.st_subdivide(geom public.geometry, maxvertices integer, gridsize double precision) TO service_role;


--
-- Name: FUNCTION st_summary(public.geography); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_summary(public.geography) TO postgres;
GRANT ALL ON FUNCTION public.st_summary(public.geography) TO anon;
GRANT ALL ON FUNCTION public.st_summary(public.geography) TO authenticated;
GRANT ALL ON FUNCTION public.st_summary(public.geography) TO service_role;


--
-- Name: FUNCTION st_summary(public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_summary(public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.st_summary(public.geometry) TO anon;
GRANT ALL ON FUNCTION public.st_summary(public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.st_summary(public.geometry) TO service_role;


--
-- Name: FUNCTION st_swapordinates(geom public.geometry, ords cstring); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_swapordinates(geom public.geometry, ords cstring) TO postgres;
GRANT ALL ON FUNCTION public.st_swapordinates(geom public.geometry, ords cstring) TO anon;
GRANT ALL ON FUNCTION public.st_swapordinates(geom public.geometry, ords cstring) TO authenticated;
GRANT ALL ON FUNCTION public.st_swapordinates(geom public.geometry, ords cstring) TO service_role;


--
-- Name: FUNCTION st_symdifference(geom1 public.geometry, geom2 public.geometry, gridsize double precision); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_symdifference(geom1 public.geometry, geom2 public.geometry, gridsize double precision) TO postgres;
GRANT ALL ON FUNCTION public.st_symdifference(geom1 public.geometry, geom2 public.geometry, gridsize double precision) TO anon;
GRANT ALL ON FUNCTION public.st_symdifference(geom1 public.geometry, geom2 public.geometry, gridsize double precision) TO authenticated;
GRANT ALL ON FUNCTION public.st_symdifference(geom1 public.geometry, geom2 public.geometry, gridsize double precision) TO service_role;


--
-- Name: FUNCTION st_symmetricdifference(geom1 public.geometry, geom2 public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_symmetricdifference(geom1 public.geometry, geom2 public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.st_symmetricdifference(geom1 public.geometry, geom2 public.geometry) TO anon;
GRANT ALL ON FUNCTION public.st_symmetricdifference(geom1 public.geometry, geom2 public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.st_symmetricdifference(geom1 public.geometry, geom2 public.geometry) TO service_role;


--
-- Name: FUNCTION st_tileenvelope(zoom integer, x integer, y integer, bounds public.geometry, margin double precision); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_tileenvelope(zoom integer, x integer, y integer, bounds public.geometry, margin double precision) TO postgres;
GRANT ALL ON FUNCTION public.st_tileenvelope(zoom integer, x integer, y integer, bounds public.geometry, margin double precision) TO anon;
GRANT ALL ON FUNCTION public.st_tileenvelope(zoom integer, x integer, y integer, bounds public.geometry, margin double precision) TO authenticated;
GRANT ALL ON FUNCTION public.st_tileenvelope(zoom integer, x integer, y integer, bounds public.geometry, margin double precision) TO service_role;


--
-- Name: FUNCTION st_touches(geom1 public.geometry, geom2 public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_touches(geom1 public.geometry, geom2 public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.st_touches(geom1 public.geometry, geom2 public.geometry) TO anon;
GRANT ALL ON FUNCTION public.st_touches(geom1 public.geometry, geom2 public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.st_touches(geom1 public.geometry, geom2 public.geometry) TO service_role;


--
-- Name: FUNCTION st_transform(public.geometry, integer); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_transform(public.geometry, integer) TO postgres;
GRANT ALL ON FUNCTION public.st_transform(public.geometry, integer) TO anon;
GRANT ALL ON FUNCTION public.st_transform(public.geometry, integer) TO authenticated;
GRANT ALL ON FUNCTION public.st_transform(public.geometry, integer) TO service_role;


--
-- Name: FUNCTION st_transform(geom public.geometry, to_proj text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_transform(geom public.geometry, to_proj text) TO postgres;
GRANT ALL ON FUNCTION public.st_transform(geom public.geometry, to_proj text) TO anon;
GRANT ALL ON FUNCTION public.st_transform(geom public.geometry, to_proj text) TO authenticated;
GRANT ALL ON FUNCTION public.st_transform(geom public.geometry, to_proj text) TO service_role;


--
-- Name: FUNCTION st_transform(geom public.geometry, from_proj text, to_srid integer); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_transform(geom public.geometry, from_proj text, to_srid integer) TO postgres;
GRANT ALL ON FUNCTION public.st_transform(geom public.geometry, from_proj text, to_srid integer) TO anon;
GRANT ALL ON FUNCTION public.st_transform(geom public.geometry, from_proj text, to_srid integer) TO authenticated;
GRANT ALL ON FUNCTION public.st_transform(geom public.geometry, from_proj text, to_srid integer) TO service_role;


--
-- Name: FUNCTION st_transform(geom public.geometry, from_proj text, to_proj text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_transform(geom public.geometry, from_proj text, to_proj text) TO postgres;
GRANT ALL ON FUNCTION public.st_transform(geom public.geometry, from_proj text, to_proj text) TO anon;
GRANT ALL ON FUNCTION public.st_transform(geom public.geometry, from_proj text, to_proj text) TO authenticated;
GRANT ALL ON FUNCTION public.st_transform(geom public.geometry, from_proj text, to_proj text) TO service_role;


--
-- Name: FUNCTION st_translate(public.geometry, double precision, double precision); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_translate(public.geometry, double precision, double precision) TO postgres;
GRANT ALL ON FUNCTION public.st_translate(public.geometry, double precision, double precision) TO anon;
GRANT ALL ON FUNCTION public.st_translate(public.geometry, double precision, double precision) TO authenticated;
GRANT ALL ON FUNCTION public.st_translate(public.geometry, double precision, double precision) TO service_role;


--
-- Name: FUNCTION st_translate(public.geometry, double precision, double precision, double precision); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_translate(public.geometry, double precision, double precision, double precision) TO postgres;
GRANT ALL ON FUNCTION public.st_translate(public.geometry, double precision, double precision, double precision) TO anon;
GRANT ALL ON FUNCTION public.st_translate(public.geometry, double precision, double precision, double precision) TO authenticated;
GRANT ALL ON FUNCTION public.st_translate(public.geometry, double precision, double precision, double precision) TO service_role;


--
-- Name: FUNCTION st_transscale(public.geometry, double precision, double precision, double precision, double precision); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_transscale(public.geometry, double precision, double precision, double precision, double precision) TO postgres;
GRANT ALL ON FUNCTION public.st_transscale(public.geometry, double precision, double precision, double precision, double precision) TO anon;
GRANT ALL ON FUNCTION public.st_transscale(public.geometry, double precision, double precision, double precision, double precision) TO authenticated;
GRANT ALL ON FUNCTION public.st_transscale(public.geometry, double precision, double precision, double precision, double precision) TO service_role;


--
-- Name: FUNCTION st_triangulatepolygon(g1 public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_triangulatepolygon(g1 public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.st_triangulatepolygon(g1 public.geometry) TO anon;
GRANT ALL ON FUNCTION public.st_triangulatepolygon(g1 public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.st_triangulatepolygon(g1 public.geometry) TO service_role;


--
-- Name: FUNCTION st_unaryunion(public.geometry, gridsize double precision); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_unaryunion(public.geometry, gridsize double precision) TO postgres;
GRANT ALL ON FUNCTION public.st_unaryunion(public.geometry, gridsize double precision) TO anon;
GRANT ALL ON FUNCTION public.st_unaryunion(public.geometry, gridsize double precision) TO authenticated;
GRANT ALL ON FUNCTION public.st_unaryunion(public.geometry, gridsize double precision) TO service_role;


--
-- Name: FUNCTION st_union(public.geometry[]); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_union(public.geometry[]) TO postgres;
GRANT ALL ON FUNCTION public.st_union(public.geometry[]) TO anon;
GRANT ALL ON FUNCTION public.st_union(public.geometry[]) TO authenticated;
GRANT ALL ON FUNCTION public.st_union(public.geometry[]) TO service_role;


--
-- Name: FUNCTION st_union(geom1 public.geometry, geom2 public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_union(geom1 public.geometry, geom2 public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.st_union(geom1 public.geometry, geom2 public.geometry) TO anon;
GRANT ALL ON FUNCTION public.st_union(geom1 public.geometry, geom2 public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.st_union(geom1 public.geometry, geom2 public.geometry) TO service_role;


--
-- Name: FUNCTION st_union(geom1 public.geometry, geom2 public.geometry, gridsize double precision); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_union(geom1 public.geometry, geom2 public.geometry, gridsize double precision) TO postgres;
GRANT ALL ON FUNCTION public.st_union(geom1 public.geometry, geom2 public.geometry, gridsize double precision) TO anon;
GRANT ALL ON FUNCTION public.st_union(geom1 public.geometry, geom2 public.geometry, gridsize double precision) TO authenticated;
GRANT ALL ON FUNCTION public.st_union(geom1 public.geometry, geom2 public.geometry, gridsize double precision) TO service_role;


--
-- Name: FUNCTION st_voronoilines(g1 public.geometry, tolerance double precision, extend_to public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_voronoilines(g1 public.geometry, tolerance double precision, extend_to public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.st_voronoilines(g1 public.geometry, tolerance double precision, extend_to public.geometry) TO anon;
GRANT ALL ON FUNCTION public.st_voronoilines(g1 public.geometry, tolerance double precision, extend_to public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.st_voronoilines(g1 public.geometry, tolerance double precision, extend_to public.geometry) TO service_role;


--
-- Name: FUNCTION st_voronoipolygons(g1 public.geometry, tolerance double precision, extend_to public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_voronoipolygons(g1 public.geometry, tolerance double precision, extend_to public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.st_voronoipolygons(g1 public.geometry, tolerance double precision, extend_to public.geometry) TO anon;
GRANT ALL ON FUNCTION public.st_voronoipolygons(g1 public.geometry, tolerance double precision, extend_to public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.st_voronoipolygons(g1 public.geometry, tolerance double precision, extend_to public.geometry) TO service_role;


--
-- Name: FUNCTION st_within(geom1 public.geometry, geom2 public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_within(geom1 public.geometry, geom2 public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.st_within(geom1 public.geometry, geom2 public.geometry) TO anon;
GRANT ALL ON FUNCTION public.st_within(geom1 public.geometry, geom2 public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.st_within(geom1 public.geometry, geom2 public.geometry) TO service_role;


--
-- Name: FUNCTION st_wkbtosql(wkb bytea); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_wkbtosql(wkb bytea) TO postgres;
GRANT ALL ON FUNCTION public.st_wkbtosql(wkb bytea) TO anon;
GRANT ALL ON FUNCTION public.st_wkbtosql(wkb bytea) TO authenticated;
GRANT ALL ON FUNCTION public.st_wkbtosql(wkb bytea) TO service_role;


--
-- Name: FUNCTION st_wkttosql(text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_wkttosql(text) TO postgres;
GRANT ALL ON FUNCTION public.st_wkttosql(text) TO anon;
GRANT ALL ON FUNCTION public.st_wkttosql(text) TO authenticated;
GRANT ALL ON FUNCTION public.st_wkttosql(text) TO service_role;


--
-- Name: FUNCTION st_wrapx(geom public.geometry, wrap double precision, move double precision); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_wrapx(geom public.geometry, wrap double precision, move double precision) TO postgres;
GRANT ALL ON FUNCTION public.st_wrapx(geom public.geometry, wrap double precision, move double precision) TO anon;
GRANT ALL ON FUNCTION public.st_wrapx(geom public.geometry, wrap double precision, move double precision) TO authenticated;
GRANT ALL ON FUNCTION public.st_wrapx(geom public.geometry, wrap double precision, move double precision) TO service_role;


--
-- Name: FUNCTION st_x(public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_x(public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.st_x(public.geometry) TO anon;
GRANT ALL ON FUNCTION public.st_x(public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.st_x(public.geometry) TO service_role;


--
-- Name: FUNCTION st_xmax(public.box3d); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_xmax(public.box3d) TO postgres;
GRANT ALL ON FUNCTION public.st_xmax(public.box3d) TO anon;
GRANT ALL ON FUNCTION public.st_xmax(public.box3d) TO authenticated;
GRANT ALL ON FUNCTION public.st_xmax(public.box3d) TO service_role;


--
-- Name: FUNCTION st_xmin(public.box3d); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_xmin(public.box3d) TO postgres;
GRANT ALL ON FUNCTION public.st_xmin(public.box3d) TO anon;
GRANT ALL ON FUNCTION public.st_xmin(public.box3d) TO authenticated;
GRANT ALL ON FUNCTION public.st_xmin(public.box3d) TO service_role;


--
-- Name: FUNCTION st_y(public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_y(public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.st_y(public.geometry) TO anon;
GRANT ALL ON FUNCTION public.st_y(public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.st_y(public.geometry) TO service_role;


--
-- Name: FUNCTION st_ymax(public.box3d); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_ymax(public.box3d) TO postgres;
GRANT ALL ON FUNCTION public.st_ymax(public.box3d) TO anon;
GRANT ALL ON FUNCTION public.st_ymax(public.box3d) TO authenticated;
GRANT ALL ON FUNCTION public.st_ymax(public.box3d) TO service_role;


--
-- Name: FUNCTION st_ymin(public.box3d); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_ymin(public.box3d) TO postgres;
GRANT ALL ON FUNCTION public.st_ymin(public.box3d) TO anon;
GRANT ALL ON FUNCTION public.st_ymin(public.box3d) TO authenticated;
GRANT ALL ON FUNCTION public.st_ymin(public.box3d) TO service_role;


--
-- Name: FUNCTION st_z(public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_z(public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.st_z(public.geometry) TO anon;
GRANT ALL ON FUNCTION public.st_z(public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.st_z(public.geometry) TO service_role;


--
-- Name: FUNCTION st_zmax(public.box3d); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_zmax(public.box3d) TO postgres;
GRANT ALL ON FUNCTION public.st_zmax(public.box3d) TO anon;
GRANT ALL ON FUNCTION public.st_zmax(public.box3d) TO authenticated;
GRANT ALL ON FUNCTION public.st_zmax(public.box3d) TO service_role;


--
-- Name: FUNCTION st_zmflag(public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_zmflag(public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.st_zmflag(public.geometry) TO anon;
GRANT ALL ON FUNCTION public.st_zmflag(public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.st_zmflag(public.geometry) TO service_role;


--
-- Name: FUNCTION st_zmin(public.box3d); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_zmin(public.box3d) TO postgres;
GRANT ALL ON FUNCTION public.st_zmin(public.box3d) TO anon;
GRANT ALL ON FUNCTION public.st_zmin(public.box3d) TO authenticated;
GRANT ALL ON FUNCTION public.st_zmin(public.box3d) TO service_role;


--
-- Name: FUNCTION subvector(public.halfvec, integer, integer); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.subvector(public.halfvec, integer, integer) TO postgres;
GRANT ALL ON FUNCTION public.subvector(public.halfvec, integer, integer) TO anon;
GRANT ALL ON FUNCTION public.subvector(public.halfvec, integer, integer) TO authenticated;
GRANT ALL ON FUNCTION public.subvector(public.halfvec, integer, integer) TO service_role;


--
-- Name: FUNCTION subvector(public.vector, integer, integer); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.subvector(public.vector, integer, integer) TO postgres;
GRANT ALL ON FUNCTION public.subvector(public.vector, integer, integer) TO anon;
GRANT ALL ON FUNCTION public.subvector(public.vector, integer, integer) TO authenticated;
GRANT ALL ON FUNCTION public.subvector(public.vector, integer, integer) TO service_role;


--
-- Name: FUNCTION sync_definition_to_festival(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.sync_definition_to_festival() TO anon;
GRANT ALL ON FUNCTION public.sync_definition_to_festival() TO authenticated;
GRANT ALL ON FUNCTION public.sync_definition_to_festival() TO service_role;


--
-- Name: FUNCTION sync_festival_to_observance(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.sync_festival_to_observance() TO anon;
GRANT ALL ON FUNCTION public.sync_festival_to_observance() TO authenticated;
GRANT ALL ON FUNCTION public.sync_festival_to_observance() TO service_role;


--
-- Name: FUNCTION sync_occurrence_to_festival(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.sync_occurrence_to_festival() TO anon;
GRANT ALL ON FUNCTION public.sync_occurrence_to_festival() TO authenticated;
GRANT ALL ON FUNCTION public.sync_occurrence_to_festival() TO service_role;


--
-- Name: FUNCTION sync_post_comment_count(); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.sync_post_comment_count() FROM PUBLIC;
GRANT ALL ON FUNCTION public.sync_post_comment_count() TO service_role;


--
-- Name: FUNCTION unlockrows(text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.unlockrows(text) TO postgres;
GRANT ALL ON FUNCTION public.unlockrows(text) TO anon;
GRANT ALL ON FUNCTION public.unlockrows(text) TO authenticated;
GRANT ALL ON FUNCTION public.unlockrows(text) TO service_role;


--
-- Name: FUNCTION update_birth_profiles_updated_at(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.update_birth_profiles_updated_at() TO anon;
GRANT ALL ON FUNCTION public.update_birth_profiles_updated_at() TO authenticated;
GRANT ALL ON FUNCTION public.update_birth_profiles_updated_at() TO service_role;


--
-- Name: FUNCTION update_darshan_preferences_updated_at(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.update_darshan_preferences_updated_at() TO anon;
GRANT ALL ON FUNCTION public.update_darshan_preferences_updated_at() TO authenticated;
GRANT ALL ON FUNCTION public.update_darshan_preferences_updated_at() TO service_role;


--
-- Name: FUNCTION update_device_token_timestamp(); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.update_device_token_timestamp() FROM PUBLIC;
GRANT ALL ON FUNCTION public.update_device_token_timestamp() TO service_role;


--
-- Name: FUNCTION update_family_member_updated_at(); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.update_family_member_updated_at() FROM PUBLIC;
GRANT ALL ON FUNCTION public.update_family_member_updated_at() TO service_role;


--
-- Name: FUNCTION update_guided_path_progress_timestamp(); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.update_guided_path_progress_timestamp() FROM PUBLIC;
GRANT ALL ON FUNCTION public.update_guided_path_progress_timestamp() TO service_role;


--
-- Name: FUNCTION update_kul_updated_at(); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.update_kul_updated_at() FROM PUBLIC;
GRANT ALL ON FUNCTION public.update_kul_updated_at() TO service_role;


--
-- Name: FUNCTION update_mandali_member_count(); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.update_mandali_member_count() FROM PUBLIC;
GRANT ALL ON FUNCTION public.update_mandali_member_count() TO service_role;


--
-- Name: FUNCTION update_verse_mastery_after_review(); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.update_verse_mastery_after_review() FROM PUBLIC;
GRANT ALL ON FUNCTION public.update_verse_mastery_after_review() TO service_role;


--
-- Name: FUNCTION updategeometrysrid(character varying, character varying, integer); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.updategeometrysrid(character varying, character varying, integer) TO postgres;
GRANT ALL ON FUNCTION public.updategeometrysrid(character varying, character varying, integer) TO anon;
GRANT ALL ON FUNCTION public.updategeometrysrid(character varying, character varying, integer) TO authenticated;
GRANT ALL ON FUNCTION public.updategeometrysrid(character varying, character varying, integer) TO service_role;


--
-- Name: FUNCTION updategeometrysrid(character varying, character varying, character varying, integer); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.updategeometrysrid(character varying, character varying, character varying, integer) TO postgres;
GRANT ALL ON FUNCTION public.updategeometrysrid(character varying, character varying, character varying, integer) TO anon;
GRANT ALL ON FUNCTION public.updategeometrysrid(character varying, character varying, character varying, integer) TO authenticated;
GRANT ALL ON FUNCTION public.updategeometrysrid(character varying, character varying, character varying, integer) TO service_role;


--
-- Name: FUNCTION updategeometrysrid(catalogn_name character varying, schema_name character varying, table_name character varying, column_name character varying, new_srid_in integer); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.updategeometrysrid(catalogn_name character varying, schema_name character varying, table_name character varying, column_name character varying, new_srid_in integer) TO postgres;
GRANT ALL ON FUNCTION public.updategeometrysrid(catalogn_name character varying, schema_name character varying, table_name character varying, column_name character varying, new_srid_in integer) TO anon;
GRANT ALL ON FUNCTION public.updategeometrysrid(catalogn_name character varying, schema_name character varying, table_name character varying, column_name character varying, new_srid_in integer) TO authenticated;
GRANT ALL ON FUNCTION public.updategeometrysrid(catalogn_name character varying, schema_name character varying, table_name character varying, column_name character varying, new_srid_in integer) TO service_role;


--
-- Name: FUNCTION upsert_device_token(p_user_id uuid, p_player_id text, p_platform text); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.upsert_device_token(p_user_id uuid, p_player_id text, p_platform text) FROM PUBLIC;
GRANT ALL ON FUNCTION public.upsert_device_token(p_user_id uuid, p_player_id text, p_platform text) TO service_role;
GRANT ALL ON FUNCTION public.upsert_device_token(p_user_id uuid, p_player_id text, p_platform text) TO authenticated;


--
-- Name: FUNCTION vector_accum(double precision[], public.vector); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.vector_accum(double precision[], public.vector) TO postgres;
GRANT ALL ON FUNCTION public.vector_accum(double precision[], public.vector) TO anon;
GRANT ALL ON FUNCTION public.vector_accum(double precision[], public.vector) TO authenticated;
GRANT ALL ON FUNCTION public.vector_accum(double precision[], public.vector) TO service_role;


--
-- Name: FUNCTION vector_add(public.vector, public.vector); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.vector_add(public.vector, public.vector) TO postgres;
GRANT ALL ON FUNCTION public.vector_add(public.vector, public.vector) TO anon;
GRANT ALL ON FUNCTION public.vector_add(public.vector, public.vector) TO authenticated;
GRANT ALL ON FUNCTION public.vector_add(public.vector, public.vector) TO service_role;


--
-- Name: FUNCTION vector_avg(double precision[]); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.vector_avg(double precision[]) TO postgres;
GRANT ALL ON FUNCTION public.vector_avg(double precision[]) TO anon;
GRANT ALL ON FUNCTION public.vector_avg(double precision[]) TO authenticated;
GRANT ALL ON FUNCTION public.vector_avg(double precision[]) TO service_role;


--
-- Name: FUNCTION vector_cmp(public.vector, public.vector); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.vector_cmp(public.vector, public.vector) TO postgres;
GRANT ALL ON FUNCTION public.vector_cmp(public.vector, public.vector) TO anon;
GRANT ALL ON FUNCTION public.vector_cmp(public.vector, public.vector) TO authenticated;
GRANT ALL ON FUNCTION public.vector_cmp(public.vector, public.vector) TO service_role;


--
-- Name: FUNCTION vector_combine(double precision[], double precision[]); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.vector_combine(double precision[], double precision[]) TO postgres;
GRANT ALL ON FUNCTION public.vector_combine(double precision[], double precision[]) TO anon;
GRANT ALL ON FUNCTION public.vector_combine(double precision[], double precision[]) TO authenticated;
GRANT ALL ON FUNCTION public.vector_combine(double precision[], double precision[]) TO service_role;


--
-- Name: FUNCTION vector_concat(public.vector, public.vector); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.vector_concat(public.vector, public.vector) TO postgres;
GRANT ALL ON FUNCTION public.vector_concat(public.vector, public.vector) TO anon;
GRANT ALL ON FUNCTION public.vector_concat(public.vector, public.vector) TO authenticated;
GRANT ALL ON FUNCTION public.vector_concat(public.vector, public.vector) TO service_role;


--
-- Name: FUNCTION vector_dims(public.halfvec); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.vector_dims(public.halfvec) TO postgres;
GRANT ALL ON FUNCTION public.vector_dims(public.halfvec) TO anon;
GRANT ALL ON FUNCTION public.vector_dims(public.halfvec) TO authenticated;
GRANT ALL ON FUNCTION public.vector_dims(public.halfvec) TO service_role;


--
-- Name: FUNCTION vector_dims(public.vector); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.vector_dims(public.vector) TO postgres;
GRANT ALL ON FUNCTION public.vector_dims(public.vector) TO anon;
GRANT ALL ON FUNCTION public.vector_dims(public.vector) TO authenticated;
GRANT ALL ON FUNCTION public.vector_dims(public.vector) TO service_role;


--
-- Name: FUNCTION vector_eq(public.vector, public.vector); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.vector_eq(public.vector, public.vector) TO postgres;
GRANT ALL ON FUNCTION public.vector_eq(public.vector, public.vector) TO anon;
GRANT ALL ON FUNCTION public.vector_eq(public.vector, public.vector) TO authenticated;
GRANT ALL ON FUNCTION public.vector_eq(public.vector, public.vector) TO service_role;


--
-- Name: FUNCTION vector_ge(public.vector, public.vector); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.vector_ge(public.vector, public.vector) TO postgres;
GRANT ALL ON FUNCTION public.vector_ge(public.vector, public.vector) TO anon;
GRANT ALL ON FUNCTION public.vector_ge(public.vector, public.vector) TO authenticated;
GRANT ALL ON FUNCTION public.vector_ge(public.vector, public.vector) TO service_role;


--
-- Name: FUNCTION vector_gt(public.vector, public.vector); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.vector_gt(public.vector, public.vector) TO postgres;
GRANT ALL ON FUNCTION public.vector_gt(public.vector, public.vector) TO anon;
GRANT ALL ON FUNCTION public.vector_gt(public.vector, public.vector) TO authenticated;
GRANT ALL ON FUNCTION public.vector_gt(public.vector, public.vector) TO service_role;


--
-- Name: FUNCTION vector_l2_squared_distance(public.vector, public.vector); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.vector_l2_squared_distance(public.vector, public.vector) TO postgres;
GRANT ALL ON FUNCTION public.vector_l2_squared_distance(public.vector, public.vector) TO anon;
GRANT ALL ON FUNCTION public.vector_l2_squared_distance(public.vector, public.vector) TO authenticated;
GRANT ALL ON FUNCTION public.vector_l2_squared_distance(public.vector, public.vector) TO service_role;


--
-- Name: FUNCTION vector_le(public.vector, public.vector); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.vector_le(public.vector, public.vector) TO postgres;
GRANT ALL ON FUNCTION public.vector_le(public.vector, public.vector) TO anon;
GRANT ALL ON FUNCTION public.vector_le(public.vector, public.vector) TO authenticated;
GRANT ALL ON FUNCTION public.vector_le(public.vector, public.vector) TO service_role;


--
-- Name: FUNCTION vector_lt(public.vector, public.vector); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.vector_lt(public.vector, public.vector) TO postgres;
GRANT ALL ON FUNCTION public.vector_lt(public.vector, public.vector) TO anon;
GRANT ALL ON FUNCTION public.vector_lt(public.vector, public.vector) TO authenticated;
GRANT ALL ON FUNCTION public.vector_lt(public.vector, public.vector) TO service_role;


--
-- Name: FUNCTION vector_mul(public.vector, public.vector); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.vector_mul(public.vector, public.vector) TO postgres;
GRANT ALL ON FUNCTION public.vector_mul(public.vector, public.vector) TO anon;
GRANT ALL ON FUNCTION public.vector_mul(public.vector, public.vector) TO authenticated;
GRANT ALL ON FUNCTION public.vector_mul(public.vector, public.vector) TO service_role;


--
-- Name: FUNCTION vector_ne(public.vector, public.vector); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.vector_ne(public.vector, public.vector) TO postgres;
GRANT ALL ON FUNCTION public.vector_ne(public.vector, public.vector) TO anon;
GRANT ALL ON FUNCTION public.vector_ne(public.vector, public.vector) TO authenticated;
GRANT ALL ON FUNCTION public.vector_ne(public.vector, public.vector) TO service_role;


--
-- Name: FUNCTION vector_negative_inner_product(public.vector, public.vector); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.vector_negative_inner_product(public.vector, public.vector) TO postgres;
GRANT ALL ON FUNCTION public.vector_negative_inner_product(public.vector, public.vector) TO anon;
GRANT ALL ON FUNCTION public.vector_negative_inner_product(public.vector, public.vector) TO authenticated;
GRANT ALL ON FUNCTION public.vector_negative_inner_product(public.vector, public.vector) TO service_role;


--
-- Name: FUNCTION vector_norm(public.vector); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.vector_norm(public.vector) TO postgres;
GRANT ALL ON FUNCTION public.vector_norm(public.vector) TO anon;
GRANT ALL ON FUNCTION public.vector_norm(public.vector) TO authenticated;
GRANT ALL ON FUNCTION public.vector_norm(public.vector) TO service_role;


--
-- Name: FUNCTION vector_spherical_distance(public.vector, public.vector); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.vector_spherical_distance(public.vector, public.vector) TO postgres;
GRANT ALL ON FUNCTION public.vector_spherical_distance(public.vector, public.vector) TO anon;
GRANT ALL ON FUNCTION public.vector_spherical_distance(public.vector, public.vector) TO authenticated;
GRANT ALL ON FUNCTION public.vector_spherical_distance(public.vector, public.vector) TO service_role;


--
-- Name: FUNCTION vector_sub(public.vector, public.vector); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.vector_sub(public.vector, public.vector) TO postgres;
GRANT ALL ON FUNCTION public.vector_sub(public.vector, public.vector) TO anon;
GRANT ALL ON FUNCTION public.vector_sub(public.vector, public.vector) TO authenticated;
GRANT ALL ON FUNCTION public.vector_sub(public.vector, public.vector) TO service_role;


--
-- Name: FUNCTION apply_rls(wal jsonb, max_record_bytes integer); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) TO postgres;
GRANT ALL ON FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) TO anon;
GRANT ALL ON FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) TO authenticated;
GRANT ALL ON FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) TO service_role;
GRANT ALL ON FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) TO supabase_realtime_admin;


--
-- Name: FUNCTION broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text) TO postgres;
GRANT ALL ON FUNCTION realtime.broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text) TO dashboard_user;


--
-- Name: FUNCTION build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) TO postgres;
GRANT ALL ON FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) TO anon;
GRANT ALL ON FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) TO authenticated;
GRANT ALL ON FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) TO service_role;
GRANT ALL ON FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) TO supabase_realtime_admin;


--
-- Name: FUNCTION "cast"(val text, type_ regtype); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime."cast"(val text, type_ regtype) TO postgres;
GRANT ALL ON FUNCTION realtime."cast"(val text, type_ regtype) TO dashboard_user;
GRANT ALL ON FUNCTION realtime."cast"(val text, type_ regtype) TO anon;
GRANT ALL ON FUNCTION realtime."cast"(val text, type_ regtype) TO authenticated;
GRANT ALL ON FUNCTION realtime."cast"(val text, type_ regtype) TO service_role;
GRANT ALL ON FUNCTION realtime."cast"(val text, type_ regtype) TO supabase_realtime_admin;


--
-- Name: FUNCTION check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) TO postgres;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) TO anon;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) TO authenticated;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) TO service_role;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) TO supabase_realtime_admin;


--
-- Name: FUNCTION is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) TO postgres;
GRANT ALL ON FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) TO anon;
GRANT ALL ON FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) TO authenticated;
GRANT ALL ON FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) TO service_role;
GRANT ALL ON FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) TO supabase_realtime_admin;


--
-- Name: FUNCTION list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) TO postgres;
GRANT ALL ON FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) TO dashboard_user;


--
-- Name: FUNCTION quote_wal2json(entity regclass); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.quote_wal2json(entity regclass) TO postgres;
GRANT ALL ON FUNCTION realtime.quote_wal2json(entity regclass) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.quote_wal2json(entity regclass) TO anon;
GRANT ALL ON FUNCTION realtime.quote_wal2json(entity regclass) TO authenticated;
GRANT ALL ON FUNCTION realtime.quote_wal2json(entity regclass) TO service_role;
GRANT ALL ON FUNCTION realtime.quote_wal2json(entity regclass) TO supabase_realtime_admin;


--
-- Name: FUNCTION send(payload jsonb, event text, topic text, private boolean); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.send(payload jsonb, event text, topic text, private boolean) TO postgres;
GRANT ALL ON FUNCTION realtime.send(payload jsonb, event text, topic text, private boolean) TO dashboard_user;


--
-- Name: FUNCTION subscription_check_filters(); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.subscription_check_filters() TO postgres;
GRANT ALL ON FUNCTION realtime.subscription_check_filters() TO dashboard_user;
GRANT ALL ON FUNCTION realtime.subscription_check_filters() TO anon;
GRANT ALL ON FUNCTION realtime.subscription_check_filters() TO authenticated;
GRANT ALL ON FUNCTION realtime.subscription_check_filters() TO service_role;
GRANT ALL ON FUNCTION realtime.subscription_check_filters() TO supabase_realtime_admin;


--
-- Name: FUNCTION to_regrole(role_name text); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.to_regrole(role_name text) TO postgres;
GRANT ALL ON FUNCTION realtime.to_regrole(role_name text) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.to_regrole(role_name text) TO anon;
GRANT ALL ON FUNCTION realtime.to_regrole(role_name text) TO authenticated;
GRANT ALL ON FUNCTION realtime.to_regrole(role_name text) TO service_role;
GRANT ALL ON FUNCTION realtime.to_regrole(role_name text) TO supabase_realtime_admin;


--
-- Name: FUNCTION topic(); Type: ACL; Schema: realtime; Owner: supabase_realtime_admin
--

GRANT ALL ON FUNCTION realtime.topic() TO postgres;
GRANT ALL ON FUNCTION realtime.topic() TO dashboard_user;


--
-- Name: FUNCTION _crypto_aead_det_decrypt(message bytea, additional bytea, key_id bigint, context bytea, nonce bytea); Type: ACL; Schema: vault; Owner: supabase_admin
--

GRANT ALL ON FUNCTION vault._crypto_aead_det_decrypt(message bytea, additional bytea, key_id bigint, context bytea, nonce bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION vault._crypto_aead_det_decrypt(message bytea, additional bytea, key_id bigint, context bytea, nonce bytea) TO service_role;


--
-- Name: FUNCTION create_secret(new_secret text, new_name text, new_description text, new_key_id uuid); Type: ACL; Schema: vault; Owner: supabase_admin
--

GRANT ALL ON FUNCTION vault.create_secret(new_secret text, new_name text, new_description text, new_key_id uuid) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION vault.create_secret(new_secret text, new_name text, new_description text, new_key_id uuid) TO service_role;


--
-- Name: FUNCTION update_secret(secret_id uuid, new_secret text, new_name text, new_description text, new_key_id uuid); Type: ACL; Schema: vault; Owner: supabase_admin
--

GRANT ALL ON FUNCTION vault.update_secret(secret_id uuid, new_secret text, new_name text, new_description text, new_key_id uuid) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION vault.update_secret(secret_id uuid, new_secret text, new_name text, new_description text, new_key_id uuid) TO service_role;


--
-- Name: FUNCTION avg(public.halfvec); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.avg(public.halfvec) TO postgres;
GRANT ALL ON FUNCTION public.avg(public.halfvec) TO anon;
GRANT ALL ON FUNCTION public.avg(public.halfvec) TO authenticated;
GRANT ALL ON FUNCTION public.avg(public.halfvec) TO service_role;


--
-- Name: FUNCTION avg(public.vector); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.avg(public.vector) TO postgres;
GRANT ALL ON FUNCTION public.avg(public.vector) TO anon;
GRANT ALL ON FUNCTION public.avg(public.vector) TO authenticated;
GRANT ALL ON FUNCTION public.avg(public.vector) TO service_role;


--
-- Name: FUNCTION st_3dextent(public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_3dextent(public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.st_3dextent(public.geometry) TO anon;
GRANT ALL ON FUNCTION public.st_3dextent(public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.st_3dextent(public.geometry) TO service_role;


--
-- Name: FUNCTION st_asflatgeobuf(anyelement); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_asflatgeobuf(anyelement) TO postgres;
GRANT ALL ON FUNCTION public.st_asflatgeobuf(anyelement) TO anon;
GRANT ALL ON FUNCTION public.st_asflatgeobuf(anyelement) TO authenticated;
GRANT ALL ON FUNCTION public.st_asflatgeobuf(anyelement) TO service_role;


--
-- Name: FUNCTION st_asflatgeobuf(anyelement, boolean); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_asflatgeobuf(anyelement, boolean) TO postgres;
GRANT ALL ON FUNCTION public.st_asflatgeobuf(anyelement, boolean) TO anon;
GRANT ALL ON FUNCTION public.st_asflatgeobuf(anyelement, boolean) TO authenticated;
GRANT ALL ON FUNCTION public.st_asflatgeobuf(anyelement, boolean) TO service_role;


--
-- Name: FUNCTION st_asflatgeobuf(anyelement, boolean, text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_asflatgeobuf(anyelement, boolean, text) TO postgres;
GRANT ALL ON FUNCTION public.st_asflatgeobuf(anyelement, boolean, text) TO anon;
GRANT ALL ON FUNCTION public.st_asflatgeobuf(anyelement, boolean, text) TO authenticated;
GRANT ALL ON FUNCTION public.st_asflatgeobuf(anyelement, boolean, text) TO service_role;


--
-- Name: FUNCTION st_asgeobuf(anyelement); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_asgeobuf(anyelement) TO postgres;
GRANT ALL ON FUNCTION public.st_asgeobuf(anyelement) TO anon;
GRANT ALL ON FUNCTION public.st_asgeobuf(anyelement) TO authenticated;
GRANT ALL ON FUNCTION public.st_asgeobuf(anyelement) TO service_role;


--
-- Name: FUNCTION st_asgeobuf(anyelement, text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_asgeobuf(anyelement, text) TO postgres;
GRANT ALL ON FUNCTION public.st_asgeobuf(anyelement, text) TO anon;
GRANT ALL ON FUNCTION public.st_asgeobuf(anyelement, text) TO authenticated;
GRANT ALL ON FUNCTION public.st_asgeobuf(anyelement, text) TO service_role;


--
-- Name: FUNCTION st_asmvt(anyelement); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_asmvt(anyelement) TO postgres;
GRANT ALL ON FUNCTION public.st_asmvt(anyelement) TO anon;
GRANT ALL ON FUNCTION public.st_asmvt(anyelement) TO authenticated;
GRANT ALL ON FUNCTION public.st_asmvt(anyelement) TO service_role;


--
-- Name: FUNCTION st_asmvt(anyelement, text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_asmvt(anyelement, text) TO postgres;
GRANT ALL ON FUNCTION public.st_asmvt(anyelement, text) TO anon;
GRANT ALL ON FUNCTION public.st_asmvt(anyelement, text) TO authenticated;
GRANT ALL ON FUNCTION public.st_asmvt(anyelement, text) TO service_role;


--
-- Name: FUNCTION st_asmvt(anyelement, text, integer); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_asmvt(anyelement, text, integer) TO postgres;
GRANT ALL ON FUNCTION public.st_asmvt(anyelement, text, integer) TO anon;
GRANT ALL ON FUNCTION public.st_asmvt(anyelement, text, integer) TO authenticated;
GRANT ALL ON FUNCTION public.st_asmvt(anyelement, text, integer) TO service_role;


--
-- Name: FUNCTION st_asmvt(anyelement, text, integer, text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_asmvt(anyelement, text, integer, text) TO postgres;
GRANT ALL ON FUNCTION public.st_asmvt(anyelement, text, integer, text) TO anon;
GRANT ALL ON FUNCTION public.st_asmvt(anyelement, text, integer, text) TO authenticated;
GRANT ALL ON FUNCTION public.st_asmvt(anyelement, text, integer, text) TO service_role;


--
-- Name: FUNCTION st_asmvt(anyelement, text, integer, text, text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_asmvt(anyelement, text, integer, text, text) TO postgres;
GRANT ALL ON FUNCTION public.st_asmvt(anyelement, text, integer, text, text) TO anon;
GRANT ALL ON FUNCTION public.st_asmvt(anyelement, text, integer, text, text) TO authenticated;
GRANT ALL ON FUNCTION public.st_asmvt(anyelement, text, integer, text, text) TO service_role;


--
-- Name: FUNCTION st_clusterintersecting(public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_clusterintersecting(public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.st_clusterintersecting(public.geometry) TO anon;
GRANT ALL ON FUNCTION public.st_clusterintersecting(public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.st_clusterintersecting(public.geometry) TO service_role;


--
-- Name: FUNCTION st_clusterwithin(public.geometry, double precision); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_clusterwithin(public.geometry, double precision) TO postgres;
GRANT ALL ON FUNCTION public.st_clusterwithin(public.geometry, double precision) TO anon;
GRANT ALL ON FUNCTION public.st_clusterwithin(public.geometry, double precision) TO authenticated;
GRANT ALL ON FUNCTION public.st_clusterwithin(public.geometry, double precision) TO service_role;


--
-- Name: FUNCTION st_collect(public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_collect(public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.st_collect(public.geometry) TO anon;
GRANT ALL ON FUNCTION public.st_collect(public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.st_collect(public.geometry) TO service_role;


--
-- Name: FUNCTION st_extent(public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_extent(public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.st_extent(public.geometry) TO anon;
GRANT ALL ON FUNCTION public.st_extent(public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.st_extent(public.geometry) TO service_role;


--
-- Name: FUNCTION st_makeline(public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_makeline(public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.st_makeline(public.geometry) TO anon;
GRANT ALL ON FUNCTION public.st_makeline(public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.st_makeline(public.geometry) TO service_role;


--
-- Name: FUNCTION st_memcollect(public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_memcollect(public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.st_memcollect(public.geometry) TO anon;
GRANT ALL ON FUNCTION public.st_memcollect(public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.st_memcollect(public.geometry) TO service_role;


--
-- Name: FUNCTION st_memunion(public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_memunion(public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.st_memunion(public.geometry) TO anon;
GRANT ALL ON FUNCTION public.st_memunion(public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.st_memunion(public.geometry) TO service_role;


--
-- Name: FUNCTION st_polygonize(public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_polygonize(public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.st_polygonize(public.geometry) TO anon;
GRANT ALL ON FUNCTION public.st_polygonize(public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.st_polygonize(public.geometry) TO service_role;


--
-- Name: FUNCTION st_union(public.geometry); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_union(public.geometry) TO postgres;
GRANT ALL ON FUNCTION public.st_union(public.geometry) TO anon;
GRANT ALL ON FUNCTION public.st_union(public.geometry) TO authenticated;
GRANT ALL ON FUNCTION public.st_union(public.geometry) TO service_role;


--
-- Name: FUNCTION st_union(public.geometry, double precision); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.st_union(public.geometry, double precision) TO postgres;
GRANT ALL ON FUNCTION public.st_union(public.geometry, double precision) TO anon;
GRANT ALL ON FUNCTION public.st_union(public.geometry, double precision) TO authenticated;
GRANT ALL ON FUNCTION public.st_union(public.geometry, double precision) TO service_role;


--
-- Name: FUNCTION sum(public.halfvec); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.sum(public.halfvec) TO postgres;
GRANT ALL ON FUNCTION public.sum(public.halfvec) TO anon;
GRANT ALL ON FUNCTION public.sum(public.halfvec) TO authenticated;
GRANT ALL ON FUNCTION public.sum(public.halfvec) TO service_role;


--
-- Name: FUNCTION sum(public.vector); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.sum(public.vector) TO postgres;
GRANT ALL ON FUNCTION public.sum(public.vector) TO anon;
GRANT ALL ON FUNCTION public.sum(public.vector) TO authenticated;
GRANT ALL ON FUNCTION public.sum(public.vector) TO service_role;


--
-- Name: TABLE audit_log_entries; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.audit_log_entries TO dashboard_user;
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.audit_log_entries TO postgres;
GRANT SELECT ON TABLE auth.audit_log_entries TO postgres WITH GRANT OPTION;


--
-- Name: TABLE custom_oauth_providers; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.custom_oauth_providers TO postgres;
GRANT ALL ON TABLE auth.custom_oauth_providers TO dashboard_user;


--
-- Name: TABLE flow_state; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.flow_state TO postgres;
GRANT SELECT ON TABLE auth.flow_state TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.flow_state TO dashboard_user;


--
-- Name: TABLE identities; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.identities TO postgres;
GRANT SELECT ON TABLE auth.identities TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.identities TO dashboard_user;


--
-- Name: TABLE instances; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.instances TO dashboard_user;
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.instances TO postgres;
GRANT SELECT ON TABLE auth.instances TO postgres WITH GRANT OPTION;


--
-- Name: TABLE mfa_amr_claims; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.mfa_amr_claims TO postgres;
GRANT SELECT ON TABLE auth.mfa_amr_claims TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.mfa_amr_claims TO dashboard_user;


--
-- Name: TABLE mfa_challenges; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.mfa_challenges TO postgres;
GRANT SELECT ON TABLE auth.mfa_challenges TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.mfa_challenges TO dashboard_user;


--
-- Name: TABLE mfa_factors; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.mfa_factors TO postgres;
GRANT SELECT ON TABLE auth.mfa_factors TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.mfa_factors TO dashboard_user;


--
-- Name: TABLE oauth_authorizations; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.oauth_authorizations TO postgres;
GRANT ALL ON TABLE auth.oauth_authorizations TO dashboard_user;


--
-- Name: TABLE oauth_client_states; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.oauth_client_states TO postgres;
GRANT ALL ON TABLE auth.oauth_client_states TO dashboard_user;


--
-- Name: TABLE oauth_clients; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.oauth_clients TO postgres;
GRANT ALL ON TABLE auth.oauth_clients TO dashboard_user;


--
-- Name: TABLE oauth_consents; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.oauth_consents TO postgres;
GRANT ALL ON TABLE auth.oauth_consents TO dashboard_user;


--
-- Name: TABLE one_time_tokens; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.one_time_tokens TO postgres;
GRANT SELECT ON TABLE auth.one_time_tokens TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.one_time_tokens TO dashboard_user;


--
-- Name: TABLE refresh_tokens; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.refresh_tokens TO dashboard_user;
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.refresh_tokens TO postgres;
GRANT SELECT ON TABLE auth.refresh_tokens TO postgres WITH GRANT OPTION;


--
-- Name: SEQUENCE refresh_tokens_id_seq; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON SEQUENCE auth.refresh_tokens_id_seq TO dashboard_user;
GRANT ALL ON SEQUENCE auth.refresh_tokens_id_seq TO postgres;


--
-- Name: TABLE saml_providers; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.saml_providers TO postgres;
GRANT SELECT ON TABLE auth.saml_providers TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.saml_providers TO dashboard_user;


--
-- Name: TABLE saml_relay_states; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.saml_relay_states TO postgres;
GRANT SELECT ON TABLE auth.saml_relay_states TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.saml_relay_states TO dashboard_user;


--
-- Name: TABLE schema_migrations; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT SELECT ON TABLE auth.schema_migrations TO postgres WITH GRANT OPTION;


--
-- Name: TABLE sessions; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.sessions TO postgres;
GRANT SELECT ON TABLE auth.sessions TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.sessions TO dashboard_user;


--
-- Name: TABLE sso_domains; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.sso_domains TO postgres;
GRANT SELECT ON TABLE auth.sso_domains TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.sso_domains TO dashboard_user;


--
-- Name: TABLE sso_providers; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.sso_providers TO postgres;
GRANT SELECT ON TABLE auth.sso_providers TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.sso_providers TO dashboard_user;


--
-- Name: TABLE users; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.users TO dashboard_user;
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.users TO postgres;
GRANT SELECT ON TABLE auth.users TO postgres WITH GRANT OPTION;


--
-- Name: TABLE webauthn_challenges; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.webauthn_challenges TO postgres;
GRANT ALL ON TABLE auth.webauthn_challenges TO dashboard_user;


--
-- Name: TABLE webauthn_credentials; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.webauthn_credentials TO postgres;
GRANT ALL ON TABLE auth.webauthn_credentials TO dashboard_user;


--
-- Name: TABLE job; Type: ACL; Schema: cron; Owner: supabase_admin
--

GRANT SELECT ON TABLE cron.job TO postgres WITH GRANT OPTION;


--
-- Name: TABLE job_run_details; Type: ACL; Schema: cron; Owner: supabase_admin
--

GRANT ALL ON TABLE cron.job_run_details TO postgres WITH GRANT OPTION;


--
-- Name: TABLE hypopg_list_indexes; Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON TABLE extensions.hypopg_list_indexes TO postgres WITH GRANT OPTION;


--
-- Name: TABLE hypopg_hidden_indexes; Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON TABLE extensions.hypopg_hidden_indexes TO postgres WITH GRANT OPTION;


--
-- Name: TABLE pg_stat_statements; Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON TABLE extensions.pg_stat_statements FROM postgres;
GRANT ALL ON TABLE extensions.pg_stat_statements TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE extensions.pg_stat_statements TO dashboard_user;


--
-- Name: TABLE pg_stat_statements_info; Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON TABLE extensions.pg_stat_statements_info FROM postgres;
GRANT ALL ON TABLE extensions.pg_stat_statements_info TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE extensions.pg_stat_statements_info TO dashboard_user;


--
-- Name: TABLE ai_chat_usage; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.ai_chat_usage TO anon;
GRANT ALL ON TABLE public.ai_chat_usage TO authenticated;
GRANT ALL ON TABLE public.ai_chat_usage TO service_role;


--
-- Name: TABLE birth_profiles; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.birth_profiles TO anon;
GRANT ALL ON TABLE public.birth_profiles TO authenticated;
GRANT ALL ON TABLE public.birth_profiles TO service_role;


--
-- Name: TABLE content_meanings; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.content_meanings TO anon;
GRANT ALL ON TABLE public.content_meanings TO authenticated;
GRANT ALL ON TABLE public.content_meanings TO service_role;


--
-- Name: TABLE content_reports; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.content_reports TO anon;
GRANT ALL ON TABLE public.content_reports TO authenticated;
GRANT ALL ON TABLE public.content_reports TO service_role;


--
-- Name: TABLE daily_quiz; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.daily_quiz TO anon;
GRANT ALL ON TABLE public.daily_quiz TO authenticated;
GRANT ALL ON TABLE public.daily_quiz TO service_role;


--
-- Name: TABLE daily_sadhana; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.daily_sadhana TO anon;
GRANT ALL ON TABLE public.daily_sadhana TO authenticated;
GRANT ALL ON TABLE public.daily_sadhana TO service_role;


--
-- Name: TABLE darshan_preferences; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.darshan_preferences TO anon;
GRANT ALL ON TABLE public.darshan_preferences TO authenticated;
GRANT ALL ON TABLE public.darshan_preferences TO service_role;


--
-- Name: TABLE device_tokens; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.device_tokens TO anon;
GRANT ALL ON TABLE public.device_tokens TO authenticated;
GRANT ALL ON TABLE public.device_tokens TO service_role;


--
-- Name: TABLE devotional_tracks; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.devotional_tracks TO anon;
GRANT ALL ON TABLE public.devotional_tracks TO authenticated;
GRANT ALL ON TABLE public.devotional_tracks TO service_role;


--
-- Name: TABLE dharm_veer_daily; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.dharm_veer_daily TO anon;
GRANT ALL ON TABLE public.dharm_veer_daily TO authenticated;
GRANT ALL ON TABLE public.dharm_veer_daily TO service_role;


--
-- Name: TABLE dharm_veers; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.dharm_veers TO anon;
GRANT ALL ON TABLE public.dharm_veers TO authenticated;
GRANT ALL ON TABLE public.dharm_veers TO service_role;


--
-- Name: TABLE event_rsvps; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.event_rsvps TO anon;
GRANT ALL ON TABLE public.event_rsvps TO authenticated;
GRANT ALL ON TABLE public.event_rsvps TO service_role;


--
-- Name: TABLE festivals; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.festivals TO anon;
GRANT ALL ON TABLE public.festivals TO authenticated;
GRANT ALL ON TABLE public.festivals TO service_role;


--
-- Name: TABLE forum_replies; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.forum_replies TO anon;
GRANT ALL ON TABLE public.forum_replies TO authenticated;
GRANT ALL ON TABLE public.forum_replies TO service_role;


--
-- Name: TABLE forum_threads; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.forum_threads TO anon;
GRANT ALL ON TABLE public.forum_threads TO authenticated;
GRANT ALL ON TABLE public.forum_threads TO service_role;


--
-- Name: TABLE guided_path_progress; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.guided_path_progress TO anon;
GRANT ALL ON TABLE public.guided_path_progress TO authenticated;
GRANT ALL ON TABLE public.guided_path_progress TO service_role;


--
-- Name: TABLE hero_assets; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.hero_assets TO anon;
GRANT ALL ON TABLE public.hero_assets TO authenticated;
GRANT ALL ON TABLE public.hero_assets TO service_role;


--
-- Name: TABLE karma_award_log; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.karma_award_log TO anon;
GRANT ALL ON TABLE public.karma_award_log TO authenticated;
GRANT ALL ON TABLE public.karma_award_log TO service_role;


--
-- Name: TABLE karma_ledger; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.karma_ledger TO anon;
GRANT ALL ON TABLE public.karma_ledger TO authenticated;
GRANT ALL ON TABLE public.karma_ledger TO service_role;


--
-- Name: TABLE kul_events; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.kul_events TO anon;
GRANT ALL ON TABLE public.kul_events TO authenticated;
GRANT ALL ON TABLE public.kul_events TO service_role;


--
-- Name: TABLE kul_family_members; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.kul_family_members TO anon;
GRANT ALL ON TABLE public.kul_family_members TO authenticated;
GRANT ALL ON TABLE public.kul_family_members TO service_role;


--
-- Name: TABLE kul_members; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.kul_members TO anon;
GRANT ALL ON TABLE public.kul_members TO authenticated;
GRANT ALL ON TABLE public.kul_members TO service_role;


--
-- Name: TABLE mala_sessions; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.mala_sessions TO anon;
GRANT ALL ON TABLE public.mala_sessions TO authenticated;
GRANT ALL ON TABLE public.mala_sessions TO service_role;


--
-- Name: TABLE user_practice; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.user_practice TO anon;
GRANT ALL ON TABLE public.user_practice TO authenticated;
GRANT ALL ON TABLE public.user_practice TO service_role;


--
-- Name: TABLE kul_member_profiles; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.kul_member_profiles TO anon;
GRANT ALL ON TABLE public.kul_member_profiles TO authenticated;
GRANT ALL ON TABLE public.kul_member_profiles TO service_role;


--
-- Name: TABLE kul_messages; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.kul_messages TO anon;
GRANT ALL ON TABLE public.kul_messages TO authenticated;
GRANT ALL ON TABLE public.kul_messages TO service_role;


--
-- Name: TABLE kul_tasks; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.kul_tasks TO anon;
GRANT ALL ON TABLE public.kul_tasks TO authenticated;
GRANT ALL ON TABLE public.kul_tasks TO service_role;


--
-- Name: TABLE kul_pending_tasks; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.kul_pending_tasks TO anon;
GRANT ALL ON TABLE public.kul_pending_tasks TO authenticated;
GRANT ALL ON TABLE public.kul_pending_tasks TO service_role;


--
-- Name: TABLE kul_practice_today; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.kul_practice_today TO anon;
GRANT ALL ON TABLE public.kul_practice_today TO authenticated;
GRANT ALL ON TABLE public.kul_practice_today TO service_role;


--
-- Name: TABLE kuls; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.kuls TO anon;
GRANT ALL ON TABLE public.kuls TO authenticated;
GRANT ALL ON TABLE public.kuls TO service_role;


--
-- Name: TABLE kul_weekly_stats; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.kul_weekly_stats TO anon;
GRANT ALL ON TABLE public.kul_weekly_stats TO authenticated;
GRANT ALL ON TABLE public.kul_weekly_stats TO service_role;


--
-- Name: TABLE live_darshans; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.live_darshans TO anon;
GRANT ALL ON TABLE public.live_darshans TO authenticated;
GRANT ALL ON TABLE public.live_darshans TO service_role;


--
-- Name: TABLE mandalis; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.mandalis TO anon;
GRANT ALL ON TABLE public.mandalis TO authenticated;
GRANT ALL ON TABLE public.mandalis TO service_role;


--
-- Name: TABLE mantras; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.mantras TO anon;
GRANT ALL ON TABLE public.mantras TO authenticated;
GRANT ALL ON TABLE public.mantras TO service_role;


--
-- Name: TABLE message_threads; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.message_threads TO anon;
GRANT ALL ON TABLE public.message_threads TO authenticated;
GRANT ALL ON TABLE public.message_threads TO service_role;


--
-- Name: TABLE monitoring_events; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.monitoring_events TO anon;
GRANT ALL ON TABLE public.monitoring_events TO authenticated;
GRANT ALL ON TABLE public.monitoring_events TO service_role;


--
-- Name: TABLE nitya_karma_streaks; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.nitya_karma_streaks TO anon;
GRANT ALL ON TABLE public.nitya_karma_streaks TO authenticated;
GRANT ALL ON TABLE public.nitya_karma_streaks TO service_role;


--
-- Name: TABLE notification_schedule; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.notification_schedule TO anon;
GRANT ALL ON TABLE public.notification_schedule TO authenticated;
GRANT ALL ON TABLE public.notification_schedule TO service_role;


--
-- Name: TABLE notifications; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.notifications TO anon;
GRANT ALL ON TABLE public.notifications TO authenticated;
GRANT ALL ON TABLE public.notifications TO service_role;


--
-- Name: TABLE sadhana_events; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.sadhana_events TO anon;
GRANT ALL ON TABLE public.sadhana_events TO authenticated;
GRANT ALL ON TABLE public.sadhana_events TO service_role;


--
-- Name: TABLE nudge_effectiveness; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.nudge_effectiveness TO anon;
GRANT ALL ON TABLE public.nudge_effectiveness TO authenticated;
GRANT ALL ON TABLE public.nudge_effectiveness TO service_role;


--
-- Name: TABLE observance_definitions; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.observance_definitions TO anon;
GRANT ALL ON TABLE public.observance_definitions TO authenticated;
GRANT ALL ON TABLE public.observance_definitions TO service_role;


--
-- Name: TABLE observance_occurrences; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.observance_occurrences TO anon;
GRANT ALL ON TABLE public.observance_occurrences TO authenticated;
GRANT ALL ON TABLE public.observance_occurrences TO service_role;


--
-- Name: TABLE pathshala_badges; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.pathshala_badges TO anon;
GRANT ALL ON TABLE public.pathshala_badges TO authenticated;
GRANT ALL ON TABLE public.pathshala_badges TO service_role;


--
-- Name: TABLE pathshala_circle_members; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.pathshala_circle_members TO anon;
GRANT ALL ON TABLE public.pathshala_circle_members TO authenticated;
GRANT ALL ON TABLE public.pathshala_circle_members TO service_role;


--
-- Name: TABLE pathshala_paths; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.pathshala_paths TO anon;
GRANT ALL ON TABLE public.pathshala_paths TO authenticated;
GRANT ALL ON TABLE public.pathshala_paths TO service_role;


--
-- Name: TABLE pathshala_study_circles; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.pathshala_study_circles TO anon;
GRANT ALL ON TABLE public.pathshala_study_circles TO authenticated;
GRANT ALL ON TABLE public.pathshala_study_circles TO service_role;


--
-- Name: TABLE pathshala_circle_leaderboard; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.pathshala_circle_leaderboard TO anon;
GRANT ALL ON TABLE public.pathshala_circle_leaderboard TO authenticated;
GRANT ALL ON TABLE public.pathshala_circle_leaderboard TO service_role;


--
-- Name: TABLE pathshala_enrollments; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.pathshala_enrollments TO anon;
GRANT ALL ON TABLE public.pathshala_enrollments TO authenticated;
GRANT ALL ON TABLE public.pathshala_enrollments TO service_role;


--
-- Name: TABLE pathshala_path_chunks; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.pathshala_path_chunks TO anon;
GRANT ALL ON TABLE public.pathshala_path_chunks TO authenticated;
GRANT ALL ON TABLE public.pathshala_path_chunks TO service_role;


--
-- Name: TABLE pathshala_progress; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.pathshala_progress TO anon;
GRANT ALL ON TABLE public.pathshala_progress TO authenticated;
GRANT ALL ON TABLE public.pathshala_progress TO service_role;


--
-- Name: TABLE pathshala_recitation_reviews; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.pathshala_recitation_reviews TO anon;
GRANT ALL ON TABLE public.pathshala_recitation_reviews TO authenticated;
GRANT ALL ON TABLE public.pathshala_recitation_reviews TO service_role;


--
-- Name: TABLE pathshala_recordings; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.pathshala_recordings TO anon;
GRANT ALL ON TABLE public.pathshala_recordings TO authenticated;
GRANT ALL ON TABLE public.pathshala_recordings TO service_role;


--
-- Name: TABLE pathshala_recitation_stats; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.pathshala_recitation_stats TO anon;
GRANT ALL ON TABLE public.pathshala_recitation_stats TO authenticated;
GRANT ALL ON TABLE public.pathshala_recitation_stats TO service_role;


--
-- Name: TABLE pathshala_verse_mastery; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.pathshala_verse_mastery TO anon;
GRANT ALL ON TABLE public.pathshala_verse_mastery TO authenticated;
GRANT ALL ON TABLE public.pathshala_verse_mastery TO service_role;


--
-- Name: TABLE scripture_chunks; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.scripture_chunks TO anon;
GRANT ALL ON TABLE public.scripture_chunks TO authenticated;
GRANT ALL ON TABLE public.scripture_chunks TO service_role;


--
-- Name: TABLE pathshala_today_lessons; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.pathshala_today_lessons TO anon;
GRANT ALL ON TABLE public.pathshala_today_lessons TO authenticated;
GRANT ALL ON TABLE public.pathshala_today_lessons TO service_role;


--
-- Name: TABLE pathshala_translations; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.pathshala_translations TO anon;
GRANT ALL ON TABLE public.pathshala_translations TO authenticated;
GRANT ALL ON TABLE public.pathshala_translations TO service_role;


--
-- Name: TABLE pathshala_user_badges; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.pathshala_user_badges TO anon;
GRANT ALL ON TABLE public.pathshala_user_badges TO authenticated;
GRANT ALL ON TABLE public.pathshala_user_badges TO service_role;


--
-- Name: TABLE pathshala_user_state; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.pathshala_user_state TO anon;
GRANT ALL ON TABLE public.pathshala_user_state TO authenticated;
GRANT ALL ON TABLE public.pathshala_user_state TO service_role;


--
-- Name: TABLE post_comments; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.post_comments TO anon;
GRANT ALL ON TABLE public.post_comments TO authenticated;
GRANT ALL ON TABLE public.post_comments TO service_role;


--
-- Name: TABLE post_upvotes; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.post_upvotes TO anon;
GRANT ALL ON TABLE public.post_upvotes TO authenticated;
GRANT ALL ON TABLE public.post_upvotes TO service_role;


--
-- Name: TABLE posts; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.posts TO anon;
GRANT ALL ON TABLE public.posts TO authenticated;
GRANT ALL ON TABLE public.posts TO service_role;


--
-- Name: TABLE profiles; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.profiles TO anon;
GRANT ALL ON TABLE public.profiles TO authenticated;
GRANT ALL ON TABLE public.profiles TO service_role;


--
-- Name: TABLE push_subscriptions; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.push_subscriptions TO anon;
GRANT ALL ON TABLE public.push_subscriptions TO authenticated;
GRANT ALL ON TABLE public.push_subscriptions TO service_role;


--
-- Name: TABLE quiz_responses; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.quiz_responses TO anon;
GRANT ALL ON TABLE public.quiz_responses TO authenticated;
GRANT ALL ON TABLE public.quiz_responses TO service_role;


--
-- Name: TABLE quiz_sessions; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.quiz_sessions TO anon;
GRANT ALL ON TABLE public.quiz_sessions TO authenticated;
GRANT ALL ON TABLE public.quiz_sessions TO service_role;


--
-- Name: TABLE reading_progress; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.reading_progress TO anon;
GRANT ALL ON TABLE public.reading_progress TO authenticated;
GRANT ALL ON TABLE public.reading_progress TO service_role;


--
-- Name: TABLE recommendations; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.recommendations TO anon;
GRANT ALL ON TABLE public.recommendations TO authenticated;
GRANT ALL ON TABLE public.recommendations TO service_role;


--
-- Name: TABLE sankalpa; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.sankalpa TO anon;
GRANT ALL ON TABLE public.sankalpa TO authenticated;
GRANT ALL ON TABLE public.sankalpa TO service_role;


--
-- Name: TABLE sankalpa_checkins; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.sankalpa_checkins TO anon;
GRANT ALL ON TABLE public.sankalpa_checkins TO authenticated;
GRANT ALL ON TABLE public.sankalpa_checkins TO service_role;


--
-- Name: TABLE sankalpa_reflections; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.sankalpa_reflections TO anon;
GRANT ALL ON TABLE public.sankalpa_reflections TO authenticated;
GRANT ALL ON TABLE public.sankalpa_reflections TO service_role;


--
-- Name: TABLE sankalpas; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.sankalpas TO anon;
GRANT ALL ON TABLE public.sankalpas TO authenticated;
GRANT ALL ON TABLE public.sankalpas TO service_role;


--
-- Name: TABLE sanskars; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.sanskars TO anon;
GRANT ALL ON TABLE public.sanskars TO authenticated;
GRANT ALL ON TABLE public.sanskars TO service_role;


--
-- Name: TABLE sattvic_sessions; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.sattvic_sessions TO anon;
GRANT ALL ON TABLE public.sattvic_sessions TO authenticated;
GRANT ALL ON TABLE public.sattvic_sessions TO service_role;


--
-- Name: TABLE seva_log; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.seva_log TO anon;
GRANT ALL ON TABLE public.seva_log TO authenticated;
GRANT ALL ON TABLE public.seva_log TO service_role;


--
-- Name: TABLE seva_task_completions; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.seva_task_completions TO anon;
GRANT ALL ON TABLE public.seva_task_completions TO authenticated;
GRANT ALL ON TABLE public.seva_task_completions TO service_role;


--
-- Name: TABLE shlokas; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.shlokas TO anon;
GRANT ALL ON TABLE public.shlokas TO authenticated;
GRANT ALL ON TABLE public.shlokas TO service_role;


--
-- Name: TABLE thread_messages; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.thread_messages TO anon;
GRANT ALL ON TABLE public.thread_messages TO authenticated;
GRANT ALL ON TABLE public.thread_messages TO service_role;


--
-- Name: TABLE thread_participants; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.thread_participants TO anon;
GRANT ALL ON TABLE public.thread_participants TO authenticated;
GRANT ALL ON TABLE public.thread_participants TO service_role;


--
-- Name: TABLE thread_reactions; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.thread_reactions TO anon;
GRANT ALL ON TABLE public.thread_reactions TO authenticated;
GRANT ALL ON TABLE public.thread_reactions TO service_role;


--
-- Name: TABLE thread_reaction_counts; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.thread_reaction_counts TO anon;
GRANT ALL ON TABLE public.thread_reaction_counts TO authenticated;
GRANT ALL ON TABLE public.thread_reaction_counts TO service_role;


--
-- Name: TABLE thread_upvotes; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.thread_upvotes TO anon;
GRANT ALL ON TABLE public.thread_upvotes TO authenticated;
GRANT ALL ON TABLE public.thread_upvotes TO service_role;


--
-- Name: TABLE tirtha_checkins; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.tirtha_checkins TO anon;
GRANT ALL ON TABLE public.tirtha_checkins TO authenticated;
GRANT ALL ON TABLE public.tirtha_checkins TO service_role;


--
-- Name: TABLE tirtha_collections; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.tirtha_collections TO anon;
GRANT ALL ON TABLE public.tirtha_collections TO authenticated;
GRANT ALL ON TABLE public.tirtha_collections TO service_role;


--
-- Name: TABLE tirtha_place_media; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.tirtha_place_media TO anon;
GRANT ALL ON TABLE public.tirtha_place_media TO authenticated;
GRANT ALL ON TABLE public.tirtha_place_media TO service_role;


--
-- Name: TABLE tirtha_place_notes; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.tirtha_place_notes TO anon;
GRANT ALL ON TABLE public.tirtha_place_notes TO authenticated;
GRANT ALL ON TABLE public.tirtha_place_notes TO service_role;


--
-- Name: TABLE tirtha_places; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.tirtha_places TO anon;
GRANT ALL ON TABLE public.tirtha_places TO authenticated;
GRANT ALL ON TABLE public.tirtha_places TO service_role;


--
-- Name: TABLE tirtha_reports; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.tirtha_reports TO anon;
GRANT ALL ON TABLE public.tirtha_reports TO authenticated;
GRANT ALL ON TABLE public.tirtha_reports TO service_role;


--
-- Name: TABLE tirtha_reviews; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.tirtha_reviews TO anon;
GRANT ALL ON TABLE public.tirtha_reviews TO authenticated;
GRANT ALL ON TABLE public.tirtha_reviews TO service_role;


--
-- Name: TABLE tirtha_saves; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.tirtha_saves TO anon;
GRANT ALL ON TABLE public.tirtha_saves TO authenticated;
GRANT ALL ON TABLE public.tirtha_saves TO service_role;


--
-- Name: TABLE tirtha_visits; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.tirtha_visits TO anon;
GRANT ALL ON TABLE public.tirtha_visits TO authenticated;
GRANT ALL ON TABLE public.tirtha_visits TO service_role;


--
-- Name: TABLE tirthas; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.tirthas TO anon;
GRANT ALL ON TABLE public.tirthas TO authenticated;
GRANT ALL ON TABLE public.tirthas TO service_role;


--
-- Name: TABLE user_blocked_profiles; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.user_blocked_profiles TO anon;
GRANT ALL ON TABLE public.user_blocked_profiles TO authenticated;
GRANT ALL ON TABLE public.user_blocked_profiles TO service_role;


--
-- Name: TABLE user_hidden_content; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.user_hidden_content TO anon;
GRANT ALL ON TABLE public.user_hidden_content TO authenticated;
GRANT ALL ON TABLE public.user_hidden_content TO service_role;


--
-- Name: TABLE user_mood_checkins; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.user_mood_checkins TO anon;
GRANT ALL ON TABLE public.user_mood_checkins TO authenticated;
GRANT ALL ON TABLE public.user_mood_checkins TO service_role;


--
-- Name: TABLE user_muted_profiles; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.user_muted_profiles TO anon;
GRANT ALL ON TABLE public.user_muted_profiles TO authenticated;
GRANT ALL ON TABLE public.user_muted_profiles TO service_role;


--
-- Name: TABLE user_sanskaras; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.user_sanskaras TO anon;
GRANT ALL ON TABLE public.user_sanskaras TO authenticated;
GRANT ALL ON TABLE public.user_sanskaras TO service_role;


--
-- Name: TABLE user_sanskars; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.user_sanskars TO anon;
GRANT ALL ON TABLE public.user_sanskars TO authenticated;
GRANT ALL ON TABLE public.user_sanskars TO service_role;


--
-- Name: TABLE user_tirtha_progress; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.user_tirtha_progress TO anon;
GRANT ALL ON TABLE public.user_tirtha_progress TO authenticated;
GRANT ALL ON TABLE public.user_tirtha_progress TO service_role;


--
-- Name: TABLE user_warnings; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.user_warnings TO anon;
GRANT ALL ON TABLE public.user_warnings TO authenticated;
GRANT ALL ON TABLE public.user_warnings TO service_role;


--
-- Name: TABLE waitlist; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.waitlist TO anon;
GRANT ALL ON TABLE public.waitlist TO authenticated;
GRANT ALL ON TABLE public.waitlist TO service_role;


--
-- Name: SEQUENCE waitlist_founding_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.waitlist_founding_seq TO anon;
GRANT ALL ON SEQUENCE public.waitlist_founding_seq TO authenticated;
GRANT ALL ON SEQUENCE public.waitlist_founding_seq TO service_role;


--
-- Name: TABLE yatra_plans; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.yatra_plans TO anon;
GRANT ALL ON TABLE public.yatra_plans TO authenticated;
GRANT ALL ON TABLE public.yatra_plans TO service_role;


--
-- Name: TABLE messages; Type: ACL; Schema: realtime; Owner: supabase_realtime_admin
--

GRANT ALL ON TABLE realtime.messages TO postgres;
GRANT ALL ON TABLE realtime.messages TO dashboard_user;
GRANT SELECT,INSERT,UPDATE ON TABLE realtime.messages TO anon;
GRANT SELECT,INSERT,UPDATE ON TABLE realtime.messages TO authenticated;
GRANT SELECT,INSERT,UPDATE ON TABLE realtime.messages TO service_role;


--
-- Name: TABLE messages_2026_05_30; Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON TABLE realtime.messages_2026_05_30 TO postgres;
GRANT ALL ON TABLE realtime.messages_2026_05_30 TO dashboard_user;


--
-- Name: TABLE messages_2026_05_31; Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON TABLE realtime.messages_2026_05_31 TO postgres;
GRANT ALL ON TABLE realtime.messages_2026_05_31 TO dashboard_user;


--
-- Name: TABLE messages_2026_06_01; Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON TABLE realtime.messages_2026_06_01 TO postgres;
GRANT ALL ON TABLE realtime.messages_2026_06_01 TO dashboard_user;


--
-- Name: TABLE messages_2026_06_02; Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON TABLE realtime.messages_2026_06_02 TO postgres;
GRANT ALL ON TABLE realtime.messages_2026_06_02 TO dashboard_user;


--
-- Name: TABLE messages_2026_06_03; Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON TABLE realtime.messages_2026_06_03 TO postgres;
GRANT ALL ON TABLE realtime.messages_2026_06_03 TO dashboard_user;


--
-- Name: TABLE messages_2026_06_04; Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON TABLE realtime.messages_2026_06_04 TO postgres;
GRANT ALL ON TABLE realtime.messages_2026_06_04 TO dashboard_user;


--
-- Name: TABLE messages_2026_06_05; Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON TABLE realtime.messages_2026_06_05 TO postgres;
GRANT ALL ON TABLE realtime.messages_2026_06_05 TO dashboard_user;


--
-- Name: TABLE schema_migrations; Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON TABLE realtime.schema_migrations TO postgres;
GRANT ALL ON TABLE realtime.schema_migrations TO dashboard_user;
GRANT SELECT ON TABLE realtime.schema_migrations TO anon;
GRANT SELECT ON TABLE realtime.schema_migrations TO authenticated;
GRANT SELECT ON TABLE realtime.schema_migrations TO service_role;
GRANT ALL ON TABLE realtime.schema_migrations TO supabase_realtime_admin;


--
-- Name: TABLE subscription; Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON TABLE realtime.subscription TO postgres;
GRANT ALL ON TABLE realtime.subscription TO dashboard_user;
GRANT SELECT ON TABLE realtime.subscription TO anon;
GRANT SELECT ON TABLE realtime.subscription TO authenticated;
GRANT SELECT ON TABLE realtime.subscription TO service_role;
GRANT ALL ON TABLE realtime.subscription TO supabase_realtime_admin;


--
-- Name: SEQUENCE subscription_id_seq; Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE realtime.subscription_id_seq TO postgres;
GRANT ALL ON SEQUENCE realtime.subscription_id_seq TO dashboard_user;
GRANT USAGE ON SEQUENCE realtime.subscription_id_seq TO anon;
GRANT USAGE ON SEQUENCE realtime.subscription_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE realtime.subscription_id_seq TO service_role;
GRANT ALL ON SEQUENCE realtime.subscription_id_seq TO supabase_realtime_admin;


--
-- Name: TABLE buckets; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

REVOKE ALL ON TABLE storage.buckets FROM supabase_storage_admin;
GRANT ALL ON TABLE storage.buckets TO supabase_storage_admin WITH GRANT OPTION;
GRANT ALL ON TABLE storage.buckets TO service_role;
GRANT ALL ON TABLE storage.buckets TO authenticated;
GRANT ALL ON TABLE storage.buckets TO anon;
GRANT ALL ON TABLE storage.buckets TO postgres WITH GRANT OPTION;


--
-- Name: TABLE buckets_analytics; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON TABLE storage.buckets_analytics TO service_role;
GRANT ALL ON TABLE storage.buckets_analytics TO authenticated;
GRANT ALL ON TABLE storage.buckets_analytics TO anon;


--
-- Name: TABLE buckets_vectors; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT SELECT ON TABLE storage.buckets_vectors TO service_role;
GRANT SELECT ON TABLE storage.buckets_vectors TO authenticated;
GRANT SELECT ON TABLE storage.buckets_vectors TO anon;


--
-- Name: TABLE objects; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

REVOKE ALL ON TABLE storage.objects FROM supabase_storage_admin;
GRANT ALL ON TABLE storage.objects TO supabase_storage_admin WITH GRANT OPTION;
GRANT ALL ON TABLE storage.objects TO service_role;
GRANT ALL ON TABLE storage.objects TO authenticated;
GRANT ALL ON TABLE storage.objects TO anon;
GRANT ALL ON TABLE storage.objects TO postgres WITH GRANT OPTION;


--
-- Name: TABLE s3_multipart_uploads; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON TABLE storage.s3_multipart_uploads TO service_role;
GRANT SELECT ON TABLE storage.s3_multipart_uploads TO authenticated;
GRANT SELECT ON TABLE storage.s3_multipart_uploads TO anon;


--
-- Name: TABLE s3_multipart_uploads_parts; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON TABLE storage.s3_multipart_uploads_parts TO service_role;
GRANT SELECT ON TABLE storage.s3_multipart_uploads_parts TO authenticated;
GRANT SELECT ON TABLE storage.s3_multipart_uploads_parts TO anon;


--
-- Name: TABLE vector_indexes; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT SELECT ON TABLE storage.vector_indexes TO service_role;
GRANT SELECT ON TABLE storage.vector_indexes TO authenticated;
GRANT SELECT ON TABLE storage.vector_indexes TO anon;


--
-- Name: TABLE secrets; Type: ACL; Schema: vault; Owner: supabase_admin
--

GRANT SELECT,REFERENCES,DELETE,TRUNCATE ON TABLE vault.secrets TO postgres WITH GRANT OPTION;
GRANT SELECT,DELETE ON TABLE vault.secrets TO service_role;


--
-- Name: TABLE decrypted_secrets; Type: ACL; Schema: vault; Owner: supabase_admin
--

GRANT SELECT,REFERENCES,DELETE,TRUNCATE ON TABLE vault.decrypted_secrets TO postgres WITH GRANT OPTION;
GRANT SELECT,DELETE ON TABLE vault.decrypted_secrets TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: auth; Owner: supabase_auth_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON SEQUENCES TO dashboard_user;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: auth; Owner: supabase_auth_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON FUNCTIONS TO dashboard_user;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: auth; Owner: supabase_auth_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON TABLES TO dashboard_user;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: cron; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA cron GRANT ALL ON SEQUENCES TO postgres WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: cron; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA cron GRANT ALL ON FUNCTIONS TO postgres WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: cron; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA cron GRANT ALL ON TABLES TO postgres WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: extensions; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA extensions GRANT ALL ON SEQUENCES TO postgres WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: extensions; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA extensions GRANT ALL ON FUNCTIONS TO postgres WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: extensions; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA extensions GRANT ALL ON TABLES TO postgres WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: graphql; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: graphql; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: graphql; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON TABLES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: graphql_public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: graphql_public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: graphql_public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON TABLES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: realtime; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON SEQUENCES TO dashboard_user;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: realtime; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON FUNCTIONS TO dashboard_user;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: realtime; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON TABLES TO dashboard_user;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: storage; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: storage; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: storage; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON TABLES TO service_role;


--
-- Name: ensure_rls; Type: EVENT TRIGGER; Schema: -; Owner: postgres
--

CREATE EVENT TRIGGER ensure_rls ON ddl_command_end
         WHEN TAG IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
   EXECUTE FUNCTION public.rls_auto_enable();


ALTER EVENT TRIGGER ensure_rls OWNER TO postgres;

--
-- Name: issue_graphql_placeholder; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER issue_graphql_placeholder ON sql_drop
         WHEN TAG IN ('DROP EXTENSION')
   EXECUTE FUNCTION extensions.set_graphql_placeholder();


ALTER EVENT TRIGGER issue_graphql_placeholder OWNER TO supabase_admin;

--
-- Name: issue_pg_cron_access; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER issue_pg_cron_access ON ddl_command_end
         WHEN TAG IN ('CREATE EXTENSION')
   EXECUTE FUNCTION extensions.grant_pg_cron_access();


ALTER EVENT TRIGGER issue_pg_cron_access OWNER TO supabase_admin;

--
-- Name: issue_pg_graphql_access; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER issue_pg_graphql_access ON ddl_command_end
         WHEN TAG IN ('CREATE FUNCTION')
   EXECUTE FUNCTION extensions.grant_pg_graphql_access();


ALTER EVENT TRIGGER issue_pg_graphql_access OWNER TO supabase_admin;

--
-- Name: issue_pg_net_access; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER issue_pg_net_access ON ddl_command_end
         WHEN TAG IN ('CREATE EXTENSION')
   EXECUTE FUNCTION extensions.grant_pg_net_access();


ALTER EVENT TRIGGER issue_pg_net_access OWNER TO supabase_admin;

--
-- Name: pgrst_ddl_watch; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER pgrst_ddl_watch ON ddl_command_end
   EXECUTE FUNCTION extensions.pgrst_ddl_watch();


ALTER EVENT TRIGGER pgrst_ddl_watch OWNER TO supabase_admin;

--
-- Name: pgrst_drop_watch; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER pgrst_drop_watch ON sql_drop
   EXECUTE FUNCTION extensions.pgrst_drop_watch();


ALTER EVENT TRIGGER pgrst_drop_watch OWNER TO supabase_admin;

--
-- PostgreSQL database dump complete
--

\unrestrict VS6ruW641wqpWV1QzYAuW5bRemer4btQcdezOMAbHgpVZJjhd4ZGXjGpteLA6L0

