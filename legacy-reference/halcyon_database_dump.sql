--
-- PostgreSQL database dump
--

-- Dumped from database version 15.8
-- Dumped by pg_dump version 15.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: auth; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA auth;


--
-- Name: extensions; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA extensions;


--
-- Name: graphql; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA graphql;


--
-- Name: graphql_public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA graphql_public;


--
-- Name: pgbouncer; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA pgbouncer;


--
-- Name: realtime; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA realtime;


--
-- Name: storage; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA storage;


--
-- Name: supabase_migrations; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA supabase_migrations;


--
-- Name: vault; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA vault;


--
-- Name: pg_graphql; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_graphql WITH SCHEMA graphql;


--
-- Name: EXTENSION pg_graphql; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pg_graphql IS 'pg_graphql: GraphQL support';


--
-- Name: pg_stat_statements; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_stat_statements WITH SCHEMA extensions;


--
-- Name: EXTENSION pg_stat_statements; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pg_stat_statements IS 'track planning and execution statistics of all SQL statements executed';


--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: supabase_vault; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS supabase_vault WITH SCHEMA vault;


--
-- Name: EXTENSION supabase_vault; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION supabase_vault IS 'Supabase Vault Extension';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: aal_level; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.aal_level AS ENUM (
    'aal1',
    'aal2',
    'aal3'
);


--
-- Name: code_challenge_method; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.code_challenge_method AS ENUM (
    's256',
    'plain'
);


--
-- Name: factor_status; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.factor_status AS ENUM (
    'unverified',
    'verified'
);


--
-- Name: factor_type; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.factor_type AS ENUM (
    'totp',
    'webauthn',
    'phone'
);


--
-- Name: one_time_token_type; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.one_time_token_type AS ENUM (
    'confirmation_token',
    'reauthentication_token',
    'recovery_token',
    'email_change_token_new',
    'email_change_token_current',
    'phone_change_token'
);


--
-- Name: trip_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.trip_status AS ENUM (
    'scheduled',
    'confirmed',
    'in_progress',
    'completed',
    'cancelled'
);


--
-- Name: trip_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.trip_type AS ENUM (
    'one_way',
    'round_trip'
);


--
-- Name: user_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.user_role AS ENUM (
    'super_admin',
    'monarch_owner',
    'organization_admin',
    'organization_user',
    'driver'
);


--
-- Name: action; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.action AS ENUM (
    'INSERT',
    'UPDATE',
    'DELETE',
    'TRUNCATE',
    'ERROR'
);


--
-- Name: equality_op; Type: TYPE; Schema: realtime; Owner: -
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


--
-- Name: user_defined_filter; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.user_defined_filter AS (
	column_name text,
	op realtime.equality_op,
	value text
);


--
-- Name: wal_column; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.wal_column AS (
	name text,
	type_name text,
	type_oid oid,
	value jsonb,
	is_pkey boolean,
	is_selectable boolean
);


--
-- Name: wal_rls; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.wal_rls AS (
	wal jsonb,
	is_rls_enabled boolean,
	subscription_ids uuid[],
	errors text[]
);


--
-- Name: email(); Type: FUNCTION; Schema: auth; Owner: -
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


--
-- Name: FUNCTION email(); Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON FUNCTION auth.email() IS 'Deprecated. Use auth.jwt() -> ''email'' instead.';


--
-- Name: jwt(); Type: FUNCTION; Schema: auth; Owner: -
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


--
-- Name: role(); Type: FUNCTION; Schema: auth; Owner: -
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


--
-- Name: FUNCTION role(); Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON FUNCTION auth.role() IS 'Deprecated. Use auth.jwt() -> ''role'' instead.';


--
-- Name: uid(); Type: FUNCTION; Schema: auth; Owner: -
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


--
-- Name: FUNCTION uid(); Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON FUNCTION auth.uid() IS 'Deprecated. Use auth.jwt() -> ''sub'' instead.';


--
-- Name: grant_pg_cron_access(); Type: FUNCTION; Schema: extensions; Owner: -
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


--
-- Name: FUNCTION grant_pg_cron_access(); Type: COMMENT; Schema: extensions; Owner: -
--

COMMENT ON FUNCTION extensions.grant_pg_cron_access() IS 'Grants access to pg_cron';


--
-- Name: grant_pg_graphql_access(); Type: FUNCTION; Schema: extensions; Owner: -
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


--
-- Name: FUNCTION grant_pg_graphql_access(); Type: COMMENT; Schema: extensions; Owner: -
--

COMMENT ON FUNCTION extensions.grant_pg_graphql_access() IS 'Grants access to pg_graphql';


--
-- Name: grant_pg_net_access(); Type: FUNCTION; Schema: extensions; Owner: -
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


--
-- Name: FUNCTION grant_pg_net_access(); Type: COMMENT; Schema: extensions; Owner: -
--

COMMENT ON FUNCTION extensions.grant_pg_net_access() IS 'Grants access to pg_net';


--
-- Name: pgrst_ddl_watch(); Type: FUNCTION; Schema: extensions; Owner: -
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


--
-- Name: pgrst_drop_watch(); Type: FUNCTION; Schema: extensions; Owner: -
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


--
-- Name: set_graphql_placeholder(); Type: FUNCTION; Schema: extensions; Owner: -
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


--
-- Name: FUNCTION set_graphql_placeholder(); Type: COMMENT; Schema: extensions; Owner: -
--

COMMENT ON FUNCTION extensions.set_graphql_placeholder() IS 'Reintroduces placeholder function for graphql_public.graphql';


--
-- Name: get_auth(text); Type: FUNCTION; Schema: pgbouncer; Owner: -
--

CREATE FUNCTION pgbouncer.get_auth(p_usename text) RETURNS TABLE(username text, password text)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $_$
begin
    raise debug 'PgBouncer auth request: %', p_usename;

    return query
    select 
        rolname::text, 
        case when rolvaliduntil < now() 
            then null 
            else rolpassword::text 
        end 
    from pg_authid 
    where rolname=$1 and rolcanlogin;
end;
$_$;


--
-- Name: populate_cms1500_from_client_trip(text, text, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.populate_cms1500_from_client_trip(p_organization_id text, p_client_id text, p_trip_id text, p_created_by text) RETURNS text
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_form_id TEXT;
    v_client_record RECORD;
    v_trip_record RECORD;
    v_billing_info RECORD;
    v_form_number TEXT;
BEGIN
    -- Get client information
    SELECT * INTO v_client_record FROM clients WHERE id = p_client_id;
    
    -- Get trip information
    SELECT * INTO v_trip_record FROM trips WHERE id = p_trip_id;
    
    -- Get client billing information
    SELECT * INTO v_billing_info FROM client_billing_info WHERE client_id = p_client_id;
    
    -- Generate form number
    v_form_number := 'CMS-' || TO_CHAR(CURRENT_DATE, 'YYYY') || '-' || 
                     LPAD(EXTRACT(DOY FROM CURRENT_DATE)::TEXT, 3, '0') || '-' ||
                     LPAD(EXTRACT(HOUR FROM CURRENT_TIME)::TEXT, 2, '0') ||
                     LPAD(EXTRACT(MINUTE FROM CURRENT_TIME)::TEXT, 2, '0');
    
    -- Create CMS-1500 form with populated data
    INSERT INTO cms1500_forms (
        organization_id,
        client_id,
        trip_id,
        form_number,
        insurance_type,
        insured_id,
        patient_last_name,
        patient_first_name,
        patient_birth_date,
        patient_sex,
        insured_last_name,
        insured_first_name,
        patient_address,
        patient_city,
        patient_state,
        patient_zip,
        patient_phone,
        patient_relationship,
        insured_address,
        insured_city,
        insured_state,
        insured_zip,
        federal_tax_id,
        total_charge,
        billing_provider_name,
        billing_provider_address,
        billing_provider_npi,
        created_by,
        updated_by
    ) VALUES (
        p_organization_id,
        p_client_id,
        p_trip_id,
        v_form_number,
        COALESCE(v_billing_info.insurance_type, 'medicaid'),
        COALESCE(v_billing_info.medicaid_id, v_billing_info.medicare_id, 'PENDING'),
        v_client_record.last_name,
        v_client_record.first_name,
        CURRENT_DATE - INTERVAL '30 years', -- Default birth date, should be updated
        'M', -- Default sex, should be updated
        v_client_record.last_name,
        v_client_record.first_name,
        v_client_record.address,
        'Denver', -- Default city, should be parsed from address
        'CO', -- Default state for Colorado
        '80201', -- Default ZIP, should be parsed from address
        v_client_record.phone,
        'self',
        v_client_record.address,
        'Denver',
        'CO',
        '80201',
        '12-3456789', -- Default, should be organization specific
        30.00, -- Default transport rate
        'Monarch Competency Transport',
        '5245 Lowell Blvd, Denver, CO 80221',
        COALESCE(v_billing_info.billing_provider_npi, '1234567890'),
        p_created_by,
        p_created_by
    ) RETURNING id INTO v_form_id;
    
    -- Create service line
    INSERT INTO cms1500_service_lines (
        form_id,
        line_number,
        date_from,
        date_to,
        place_of_service,
        procedure_code,
        modifier_1,
        charges,
        days_or_units,
        diagnosis_pointer
    ) VALUES (
        v_form_id,
        1,
        v_trip_record.scheduled_pickup_time::DATE,
        v_trip_record.scheduled_pickup_time::DATE,
        '41', -- Ambulance - Land
        'T2003', -- Non-emergency transport
        'U2', -- Default modifier
        30.00,
        1,
        'A'
    );
    
    RETURN v_form_id;
END;
$$;


--
-- Name: sync_cms1500_with_billing_claim(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.sync_cms1500_with_billing_claim() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Update billing claim when CMS-1500 form is updated
    IF TG_OP = 'UPDATE' AND NEW.billing_claim_id IS NOT NULL THEN
        UPDATE billing_claims 
        SET 
            status = NEW.status,
            submission_date = NEW.submission_date,
            payment_date = NEW.payment_date,
            denial_reason = NEW.rejection_reason,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = NEW.billing_claim_id;
    END IF;
    
    -- Create billing claim if CMS-1500 form is created without one
    IF TG_OP = 'INSERT' AND NEW.billing_claim_id IS NULL AND NEW.trip_id IS NOT NULL THEN
        INSERT INTO billing_claims (
            organization_id,
            client_id,
            trip_id,
            service_date,
            billing_code,
            total_amount,
            status,
            created_at,
            updated_at
        ) VALUES (
            NEW.organization_id,
            NEW.client_id,
            NEW.trip_id,
            COALESCE(
                (SELECT date_from FROM cms1500_service_lines WHERE form_id = NEW.id ORDER BY line_number LIMIT 1),
                CURRENT_DATE
            ),
            COALESCE(
                (SELECT procedure_code FROM cms1500_service_lines WHERE form_id = NEW.id ORDER BY line_number LIMIT 1),
                'T2003'
            ),
            NEW.total_charge::text,
            NEW.status,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
        );
        
        -- Update the CMS-1500 form with the new billing claim ID
        UPDATE cms1500_forms 
        SET billing_claim_id = (SELECT id FROM billing_claims WHERE trip_id = NEW.trip_id ORDER BY created_at DESC LIMIT 1)
        WHERE id = NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$;


--
-- Name: update_cms1500_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_cms1500_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


--
-- Name: apply_rls(jsonb, integer); Type: FUNCTION; Schema: realtime; Owner: -
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
        subs.entity = entity_;

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


--
-- Name: broadcast_changes(text, text, text, text, text, record, record, text); Type: FUNCTION; Schema: realtime; Owner: -
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


--
-- Name: build_prepared_statement_sql(text, regclass, realtime.wal_column[]); Type: FUNCTION; Schema: realtime; Owner: -
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


--
-- Name: cast(text, regtype); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime."cast"(val text, type_ regtype) RETURNS jsonb
    LANGUAGE plpgsql IMMUTABLE
    AS $$
    declare
      res jsonb;
    begin
      execute format('select to_jsonb(%L::'|| type_::text || ')', val)  into res;
      return res;
    end
    $$;


--
-- Name: check_equality_op(realtime.equality_op, regtype, text, text); Type: FUNCTION; Schema: realtime; Owner: -
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


--
-- Name: is_visible_through_filters(realtime.wal_column[], realtime.user_defined_filter[]); Type: FUNCTION; Schema: realtime; Owner: -
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


--
-- Name: list_changes(name, name, integer, integer); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) RETURNS SETOF realtime.wal_rls
    LANGUAGE sql
    SET log_min_messages TO 'fatal'
    AS $$
      with pub as (
        select
          concat_ws(
            ',',
            case when bool_or(pubinsert) then 'insert' else null end,
            case when bool_or(pubupdate) then 'update' else null end,
            case when bool_or(pubdelete) then 'delete' else null end
          ) as w2j_actions,
          coalesce(
            string_agg(
              realtime.quote_wal2json(format('%I.%I', schemaname, tablename)::regclass),
              ','
            ) filter (where ppt.tablename is not null and ppt.tablename not like '% %'),
            ''
          ) w2j_add_tables
        from
          pg_publication pp
          left join pg_publication_tables ppt
            on pp.pubname = ppt.pubname
        where
          pp.pubname = publication
        group by
          pp.pubname
        limit 1
      ),
      w2j as (
        select
          x.*, pub.w2j_add_tables
        from
          pub,
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
      )
      select
        xyz.wal,
        xyz.is_rls_enabled,
        xyz.subscription_ids,
        xyz.errors
      from
        w2j,
        realtime.apply_rls(
          wal := w2j.data::jsonb,
          max_record_bytes := max_record_bytes
        ) xyz(wal, is_rls_enabled, subscription_ids, errors)
      where
        w2j.w2j_add_tables <> ''
        and xyz.subscription_ids[1] is not null
    $$;


--
-- Name: quote_wal2json(regclass); Type: FUNCTION; Schema: realtime; Owner: -
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


--
-- Name: send(jsonb, text, text, boolean); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.send(payload jsonb, event text, topic text, private boolean DEFAULT true) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  BEGIN
    -- Set the topic configuration
    EXECUTE format('SET LOCAL realtime.topic TO %L', topic);

    -- Attempt to insert the message
    INSERT INTO realtime.messages (payload, event, topic, private, extension)
    VALUES (payload, event, topic, private, 'broadcast');
  EXCEPTION
    WHEN OTHERS THEN
      -- Capture and notify the error
      RAISE WARNING 'ErrorSendingBroadcastMessage: %', SQLERRM;
  END;
END;
$$;


--
-- Name: subscription_check_filters(); Type: FUNCTION; Schema: realtime; Owner: -
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


--
-- Name: to_regrole(text); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.to_regrole(role_name text) RETURNS regrole
    LANGUAGE sql IMMUTABLE
    AS $$ select role_name::regrole $$;


--
-- Name: topic(); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.topic() RETURNS text
    LANGUAGE sql STABLE
    AS $$
select nullif(current_setting('realtime.topic', true), '')::text;
$$;


--
-- Name: can_insert_object(text, text, uuid, jsonb); Type: FUNCTION; Schema: storage; Owner: -
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


--
-- Name: extension(text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.extension(name text) RETURNS text
    LANGUAGE plpgsql
    AS $$
DECLARE
_parts text[];
_filename text;
BEGIN
	select string_to_array(name, '/') into _parts;
	select _parts[array_length(_parts,1)] into _filename;
	-- @todo return the last part instead of 2
	return reverse(split_part(reverse(_filename), '.', 1));
END
$$;


--
-- Name: filename(text); Type: FUNCTION; Schema: storage; Owner: -
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


--
-- Name: foldername(text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.foldername(name text) RETURNS text[]
    LANGUAGE plpgsql
    AS $$
DECLARE
_parts text[];
BEGIN
	select string_to_array(name, '/') into _parts;
	return _parts[1:array_length(_parts,1)-1];
END
$$;


--
-- Name: get_size_by_bucket(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.get_size_by_bucket() RETURNS TABLE(size bigint, bucket_id text)
    LANGUAGE plpgsql
    AS $$
BEGIN
    return query
        select sum((metadata->>'size')::int) as size, obj.bucket_id
        from "storage".objects as obj
        group by obj.bucket_id;
END
$$;


--
-- Name: list_multipart_uploads_with_delimiter(text, text, text, integer, text, text); Type: FUNCTION; Schema: storage; Owner: -
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


--
-- Name: list_objects_with_delimiter(text, text, text, integer, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.list_objects_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer DEFAULT 100, start_after text DEFAULT ''::text, next_token text DEFAULT ''::text) RETURNS TABLE(name text, id uuid, metadata jsonb, updated_at timestamp with time zone)
    LANGUAGE plpgsql
    AS $_$
BEGIN
    RETURN QUERY EXECUTE
        'SELECT DISTINCT ON(name COLLATE "C") * from (
            SELECT
                CASE
                    WHEN position($2 IN substring(name from length($1) + 1)) > 0 THEN
                        substring(name from 1 for length($1) + position($2 IN substring(name from length($1) + 1)))
                    ELSE
                        name
                END AS name, id, metadata, updated_at
            FROM
                storage.objects
            WHERE
                bucket_id = $5 AND
                name ILIKE $1 || ''%'' AND
                CASE
                    WHEN $6 != '''' THEN
                    name COLLATE "C" > $6
                ELSE true END
                AND CASE
                    WHEN $4 != '''' THEN
                        CASE
                            WHEN position($2 IN substring(name from length($1) + 1)) > 0 THEN
                                substring(name from 1 for length($1) + position($2 IN substring(name from length($1) + 1))) COLLATE "C" > $4
                            ELSE
                                name COLLATE "C" > $4
                            END
                    ELSE
                        true
                END
            ORDER BY
                name COLLATE "C" ASC) as e order by name COLLATE "C" LIMIT $3'
        USING prefix_param, delimiter_param, max_keys, next_token, bucket_id, start_after;
END;
$_$;


--
-- Name: operation(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.operation() RETURNS text
    LANGUAGE plpgsql STABLE
    AS $$
BEGIN
    RETURN current_setting('storage.operation', true);
END;
$$;


--
-- Name: search(text, text, integer, integer, integer, text, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.search(prefix text, bucketname text, limits integer DEFAULT 100, levels integer DEFAULT 1, offsets integer DEFAULT 0, search text DEFAULT ''::text, sortcolumn text DEFAULT 'name'::text, sortorder text DEFAULT 'asc'::text) RETURNS TABLE(name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $_$
declare
  v_order_by text;
  v_sort_order text;
begin
  case
    when sortcolumn = 'name' then
      v_order_by = 'name';
    when sortcolumn = 'updated_at' then
      v_order_by = 'updated_at';
    when sortcolumn = 'created_at' then
      v_order_by = 'created_at';
    when sortcolumn = 'last_accessed_at' then
      v_order_by = 'last_accessed_at';
    else
      v_order_by = 'name';
  end case;

  case
    when sortorder = 'asc' then
      v_sort_order = 'asc';
    when sortorder = 'desc' then
      v_sort_order = 'desc';
    else
      v_sort_order = 'asc';
  end case;

  v_order_by = v_order_by || ' ' || v_sort_order;

  return query execute
    'with folders as (
       select path_tokens[$1] as folder
       from storage.objects
         where objects.name ilike $2 || $3 || ''%''
           and bucket_id = $4
           and array_length(objects.path_tokens, 1) <> $1
       group by folder
       order by folder ' || v_sort_order || '
     )
     (select folder as "name",
            null as id,
            null as updated_at,
            null as created_at,
            null as last_accessed_at,
            null as metadata from folders)
     union all
     (select path_tokens[$1] as "name",
            id,
            updated_at,
            created_at,
            last_accessed_at,
            metadata
     from storage.objects
     where objects.name ilike $2 || $3 || ''%''
       and bucket_id = $4
       and array_length(objects.path_tokens, 1) = $1
     order by ' || v_order_by || ')
     limit $5
     offset $6' using levels, prefix, search, bucketname, limits, offsets;
end;
$_$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW; 
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: audit_log_entries; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.audit_log_entries (
    instance_id uuid,
    id uuid NOT NULL,
    payload json,
    created_at timestamp with time zone,
    ip_address character varying(64) DEFAULT ''::character varying NOT NULL
);


--
-- Name: TABLE audit_log_entries; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.audit_log_entries IS 'Auth: Audit trail for user actions.';


--
-- Name: flow_state; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.flow_state (
    id uuid NOT NULL,
    user_id uuid,
    auth_code text NOT NULL,
    code_challenge_method auth.code_challenge_method NOT NULL,
    code_challenge text NOT NULL,
    provider_type text NOT NULL,
    provider_access_token text,
    provider_refresh_token text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    authentication_method text NOT NULL,
    auth_code_issued_at timestamp with time zone
);


--
-- Name: TABLE flow_state; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.flow_state IS 'stores metadata for pkce logins';


--
-- Name: identities; Type: TABLE; Schema: auth; Owner: -
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


--
-- Name: TABLE identities; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.identities IS 'Auth: Stores identities associated to a user.';


--
-- Name: COLUMN identities.email; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.identities.email IS 'Auth: Email is a generated column that references the optional email property in the identity_data';


--
-- Name: instances; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.instances (
    id uuid NOT NULL,
    uuid uuid,
    raw_base_config text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


--
-- Name: TABLE instances; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.instances IS 'Auth: Manages users across multiple sites.';


--
-- Name: mfa_amr_claims; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.mfa_amr_claims (
    session_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    authentication_method text NOT NULL,
    id uuid NOT NULL
);


--
-- Name: TABLE mfa_amr_claims; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.mfa_amr_claims IS 'auth: stores authenticator method reference claims for multi factor authentication';


--
-- Name: mfa_challenges; Type: TABLE; Schema: auth; Owner: -
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


--
-- Name: TABLE mfa_challenges; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.mfa_challenges IS 'auth: stores metadata about challenge requests made';


--
-- Name: mfa_factors; Type: TABLE; Schema: auth; Owner: -
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
    web_authn_aaguid uuid
);


--
-- Name: TABLE mfa_factors; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.mfa_factors IS 'auth: stores metadata about factors';


--
-- Name: one_time_tokens; Type: TABLE; Schema: auth; Owner: -
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


--
-- Name: refresh_tokens; Type: TABLE; Schema: auth; Owner: -
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


--
-- Name: TABLE refresh_tokens; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.refresh_tokens IS 'Auth: Store of tokens used to refresh JWT tokens once they expire.';


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE; Schema: auth; Owner: -
--

CREATE SEQUENCE auth.refresh_tokens_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: auth; Owner: -
--

ALTER SEQUENCE auth.refresh_tokens_id_seq OWNED BY auth.refresh_tokens.id;


--
-- Name: saml_providers; Type: TABLE; Schema: auth; Owner: -
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


--
-- Name: TABLE saml_providers; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.saml_providers IS 'Auth: Manages SAML Identity Provider connections.';


--
-- Name: saml_relay_states; Type: TABLE; Schema: auth; Owner: -
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


--
-- Name: TABLE saml_relay_states; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.saml_relay_states IS 'Auth: Contains SAML Relay State information for each Service Provider initiated login.';


--
-- Name: schema_migrations; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.schema_migrations (
    version character varying(255) NOT NULL
);


--
-- Name: TABLE schema_migrations; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.schema_migrations IS 'Auth: Manages updates to the auth system.';


--
-- Name: sessions; Type: TABLE; Schema: auth; Owner: -
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
    tag text
);


--
-- Name: TABLE sessions; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.sessions IS 'Auth: Stores session data associated to a user.';


--
-- Name: COLUMN sessions.not_after; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.sessions.not_after IS 'Auth: Not after is a nullable column that contains a timestamp after which the session should be regarded as expired.';


--
-- Name: sso_domains; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.sso_domains (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    domain text NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    CONSTRAINT "domain not empty" CHECK ((char_length(domain) > 0))
);


--
-- Name: TABLE sso_domains; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.sso_domains IS 'Auth: Manages SSO email address domain mapping to an SSO Identity Provider.';


--
-- Name: sso_providers; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.sso_providers (
    id uuid NOT NULL,
    resource_id text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    disabled boolean,
    CONSTRAINT "resource_id not empty" CHECK (((resource_id = NULL::text) OR (char_length(resource_id) > 0)))
);


--
-- Name: TABLE sso_providers; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.sso_providers IS 'Auth: Manages SSO identity provider information; see saml_providers for SAML.';


--
-- Name: COLUMN sso_providers.resource_id; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.sso_providers.resource_id IS 'Auth: Uniquely identifies a SSO provider according to a user-chosen resource ID (case insensitive), useful in infrastructure as code.';


--
-- Name: users; Type: TABLE; Schema: auth; Owner: -
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


--
-- Name: TABLE users; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.users IS 'Auth: Stores user login data within a secure schema.';


--
-- Name: COLUMN users.is_sso_user; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.users.is_sso_user IS 'Auth: Set this column to true when the account comes from SSO. These accounts can have duplicate emails.';


--
-- Name: billing_batches; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.billing_batches (
    id text NOT NULL,
    organization_id text NOT NULL,
    name text NOT NULL,
    description text,
    claim_ids text[],
    total_claims integer DEFAULT 0,
    total_amount text,
    status text DEFAULT 'draft'::text NOT NULL,
    created_by text NOT NULL,
    submitted_date timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: billing_claims; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.billing_claims (
    id text NOT NULL,
    organization_id text NOT NULL,
    client_id text NOT NULL,
    trip_id text NOT NULL,
    claim_number text,
    service_date timestamp without time zone NOT NULL,
    billing_code text NOT NULL,
    modifiers text[],
    units integer DEFAULT 1,
    rate text,
    total_amount text,
    status text DEFAULT 'draft'::text NOT NULL,
    submission_date timestamp without time zone,
    payment_date timestamp without time zone,
    paid_amount text,
    denial_reason text,
    cms_1500_data jsonb,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: billing_codes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.billing_codes (
    id text NOT NULL,
    code text NOT NULL,
    description text NOT NULL,
    category text NOT NULL,
    rate_colorado text,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: billing_modifiers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.billing_modifiers (
    id text NOT NULL,
    code text NOT NULL,
    description text NOT NULL,
    applies_to_codes text[],
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: client_billing_info; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.client_billing_info (
    id text NOT NULL,
    client_id text NOT NULL,
    organization_id text NOT NULL,
    insurance_type text NOT NULL,
    medicaid_id text,
    medicare_id text,
    group_number text,
    waiver_type text,
    waiver_id text,
    prior_authorization_number text,
    authorization_expiry timestamp without time zone,
    billing_provider_npi text,
    billing_provider_name text,
    billing_provider_taxonomy text,
    hipaa_authorization_date timestamp without time zone,
    billing_consent_date timestamp without time zone,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: client_group_memberships; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.client_group_memberships (
    id text DEFAULT ('cgm_'::text || gen_random_uuid()) NOT NULL,
    client_id text NOT NULL,
    group_id text NOT NULL,
    joined_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: client_groups; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.client_groups (
    id text DEFAULT ('cg_'::text || gen_random_uuid()) NOT NULL,
    organization_id text NOT NULL,
    name text NOT NULL,
    description text,
    service_area_id text,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    expires_at timestamp without time zone
);


--
-- Name: clients; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.clients (
    id text DEFAULT ('client_'::text || gen_random_uuid()) NOT NULL,
    organization_id text NOT NULL,
    service_area_id text NOT NULL,
    first_name text NOT NULL,
    last_name text NOT NULL,
    phone text,
    email text,
    address text,
    emergency_contact text,
    emergency_phone text,
    medical_notes text,
    mobility_requirements text,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: clients_v2; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.clients_v2 (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    client_number character varying(50) NOT NULL,
    first_name character varying(100) NOT NULL,
    last_name character varying(100) NOT NULL,
    email character varying(255),
    phone character varying(20),
    address text,
    emergency_contact character varying(100),
    emergency_phone character varying(20),
    medical_notes text,
    mobility_requirements text,
    is_active boolean DEFAULT true,
    organization_id character varying(50) NOT NULL,
    service_area_id character varying(50) NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: cms1500_forms; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cms1500_forms (
    id text DEFAULT ('cms1500_'::text || gen_random_uuid()) NOT NULL,
    organization_id text NOT NULL,
    client_id text,
    trip_id text,
    billing_claim_id text,
    form_number text NOT NULL,
    insurance_type text NOT NULL,
    insured_id text NOT NULL,
    patient_last_name text NOT NULL,
    patient_first_name text NOT NULL,
    patient_middle_initial text,
    patient_birth_date date NOT NULL,
    patient_sex text NOT NULL,
    insured_last_name text NOT NULL,
    insured_first_name text NOT NULL,
    insured_middle_initial text,
    patient_address text NOT NULL,
    patient_city text NOT NULL,
    patient_state text NOT NULL,
    patient_zip text NOT NULL,
    patient_phone text,
    patient_relationship text NOT NULL,
    insured_address text NOT NULL,
    insured_city text NOT NULL,
    insured_state text NOT NULL,
    insured_zip text NOT NULL,
    insured_phone text,
    other_insured_name text,
    other_insured_policy text,
    other_insurance_plan text,
    related_employment boolean DEFAULT false,
    related_auto_accident boolean DEFAULT false,
    related_other_accident boolean DEFAULT false,
    accident_state text,
    claim_codes text,
    insured_group_number text,
    insured_birth_date date,
    insured_sex text,
    other_claim_id text,
    insurance_plan_name text,
    has_other_health_plan boolean DEFAULT false,
    patient_signature text DEFAULT 'Signature on File'::text,
    patient_signature_date date,
    insured_signature text DEFAULT 'Signature on File'::text,
    illness_date date,
    other_date date,
    unable_to_work_from date,
    unable_to_work_to date,
    referring_provider text,
    referring_provider_npi text,
    hospitalization_from date,
    hospitalization_to date,
    additional_info text,
    outside_lab boolean DEFAULT false,
    outside_lab_charges numeric(10,2),
    diagnosis_1 text,
    diagnosis_2 text,
    diagnosis_3 text,
    diagnosis_4 text,
    resubmission_code text,
    original_ref text,
    prior_auth_number text,
    federal_tax_id text NOT NULL,
    ssn_ein text DEFAULT 'EIN'::text NOT NULL,
    patient_account_number text,
    accept_assignment boolean DEFAULT true,
    total_charge numeric(10,2) NOT NULL,
    amount_paid numeric(10,2) DEFAULT 0.00,
    provider_signature text DEFAULT 'Signature on File'::text,
    provider_signature_date date,
    service_facility_name text,
    service_facility_address text,
    service_facility_npi text,
    billing_provider_name text NOT NULL,
    billing_provider_address text NOT NULL,
    billing_provider_npi text NOT NULL,
    billing_provider_phone text,
    status text DEFAULT 'draft'::text NOT NULL,
    submission_date timestamp without time zone,
    payment_date timestamp without time zone,
    rejection_reason text,
    pdf_generated boolean DEFAULT false,
    pdf_url text,
    exported_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    created_by text NOT NULL,
    updated_by text NOT NULL,
    CONSTRAINT cms1500_forms_insurance_type_check CHECK ((insurance_type = ANY (ARRAY['medicare'::text, 'medicaid'::text, 'champus'::text, 'champva'::text, 'group_health'::text, 'feca'::text, 'other'::text]))),
    CONSTRAINT cms1500_forms_insured_sex_check CHECK ((insured_sex = ANY (ARRAY['M'::text, 'F'::text]))),
    CONSTRAINT cms1500_forms_patient_relationship_check CHECK ((patient_relationship = ANY (ARRAY['self'::text, 'spouse'::text, 'child'::text, 'other'::text]))),
    CONSTRAINT cms1500_forms_patient_sex_check CHECK ((patient_sex = ANY (ARRAY['M'::text, 'F'::text]))),
    CONSTRAINT cms1500_forms_ssn_ein_check CHECK ((ssn_ein = ANY (ARRAY['SSN'::text, 'EIN'::text]))),
    CONSTRAINT cms1500_forms_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'submitted'::text, 'paid'::text, 'rejected'::text, 'pending'::text])))
);


--
-- Name: cms1500_service_lines; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cms1500_service_lines (
    id text DEFAULT ('cms1500_line_'::text || gen_random_uuid()) NOT NULL,
    form_id text NOT NULL,
    line_number integer NOT NULL,
    date_from date,
    date_to date,
    place_of_service text,
    procedure_code text,
    modifier_1 text,
    modifier_2 text,
    modifier_3 text,
    modifier_4 text,
    diagnosis_pointer text,
    charges numeric(10,2),
    days_or_units integer,
    epsdt_family_plan text,
    emergency_indicator text,
    coordination_of_benefits text,
    rendering_provider_npi text,
    rendering_provider_name text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT cms1500_service_lines_line_number_check CHECK (((line_number >= 1) AND (line_number <= 6)))
);


--
-- Name: driver_organization_access; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.driver_organization_access (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    driver_id uuid NOT NULL,
    organization_id character varying(50) NOT NULL,
    granted_at timestamp without time zone DEFAULT now()
);


--
-- Name: driver_schedules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.driver_schedules (
    id text DEFAULT ('sched_'::text || gen_random_uuid()) NOT NULL,
    driver_id text NOT NULL,
    organization_id text NOT NULL,
    day_of_week integer NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    is_available boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT driver_schedules_day_of_week_check CHECK (((day_of_week >= 0) AND (day_of_week <= 6)))
);


--
-- Name: driver_vehicle_assignments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.driver_vehicle_assignments (
    id text NOT NULL,
    driver_id text NOT NULL,
    vehicle_id text NOT NULL,
    assigned_date date NOT NULL,
    is_primary boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: drivers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.drivers (
    id text DEFAULT ('driver_'::text || gen_random_uuid()) NOT NULL,
    user_id text NOT NULL,
    primary_organization_id text NOT NULL,
    authorized_organizations text[] DEFAULT '{}'::text[],
    license_number text NOT NULL,
    license_expiry date,
    vehicle_info text,
    phone text,
    emergency_contact text,
    emergency_phone text,
    is_available boolean DEFAULT true,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: drivers_v2; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.drivers_v2 (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    employee_id character varying(50) NOT NULL,
    first_name character varying(100) NOT NULL,
    last_name character varying(100) NOT NULL,
    email character varying(255) NOT NULL,
    phone character varying(20),
    license_number character varying(50) NOT NULL,
    license_expiry date,
    vehicle_info text,
    emergency_contact character varying(100),
    emergency_phone character varying(20),
    is_available boolean DEFAULT true,
    is_active boolean DEFAULT true,
    primary_organization_id character varying(50) NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: feature_flags; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.feature_flags (
    id integer NOT NULL,
    flag_name character varying(100) NOT NULL,
    is_enabled boolean DEFAULT false,
    organization_id character varying(50),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: feature_flags_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.feature_flags_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: feature_flags_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.feature_flags_id_seq OWNED BY public.feature_flags.id;


--
-- Name: frequent_locations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.frequent_locations (
    id text DEFAULT ('fl_'::text || gen_random_uuid()) NOT NULL,
    organization_id text NOT NULL,
    name text NOT NULL,
    description text,
    street_address text NOT NULL,
    city text NOT NULL,
    state text NOT NULL,
    zip_code text,
    full_address text NOT NULL,
    location_type text DEFAULT 'destination'::text,
    usage_count integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT frequent_locations_location_type_check CHECK ((location_type = ANY (ARRAY['destination'::text, 'service_area'::text, 'medical'::text, 'commercial'::text, 'other'::text])))
);


--
-- Name: organizations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.organizations (
    id text DEFAULT ('org_'::text || gen_random_uuid()) NOT NULL,
    name text NOT NULL,
    address text,
    phone text,
    email text,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    logo_url text
);


--
-- Name: recurring_trips; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.recurring_trips (
    id character varying(255) NOT NULL,
    organization_id character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    day_of_week integer NOT NULL,
    time_of_day time without time zone NOT NULL,
    pickup_location character varying(500) NOT NULL,
    dropoff_location character varying(500) NOT NULL,
    is_round_trip boolean DEFAULT false,
    duration_weeks integer NOT NULL,
    is_active boolean DEFAULT true,
    created_by character varying(255) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    client_id character varying,
    client_group_id character varying,
    pickup_address character varying,
    dropoff_address character varying,
    scheduled_time time without time zone,
    frequency character varying,
    days_of_week text[],
    duration integer,
    trip_type character varying,
    trip_nickname character varying(100)
);


--
-- Name: role_permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.role_permissions (
    id integer NOT NULL,
    role character varying(50) NOT NULL,
    permission character varying(100) NOT NULL,
    resource character varying(50) NOT NULL,
    organization_id character varying(50),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: role_permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.role_permissions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: role_permissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.role_permissions_id_seq OWNED BY public.role_permissions.id;


--
-- Name: service_areas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.service_areas (
    id text DEFAULT ('sa_'::text || gen_random_uuid()) NOT NULL,
    organization_id text NOT NULL,
    nickname text NOT NULL,
    description text,
    boundary_coordinates jsonb,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    street_address text,
    city text,
    state text,
    zip_code text,
    full_address text
);


--
-- Name: service_areas_v2; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.service_areas_v2 (
    id text DEFAULT ('sa_v2_'::text || gen_random_uuid()) NOT NULL,
    organization_id text NOT NULL,
    nickname text NOT NULL,
    description text,
    boundary_coordinates jsonb,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    street_address text,
    city text,
    state text,
    zip_code text,
    full_address text
);


--
-- Name: system_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.system_settings (
    id text DEFAULT 'app_settings'::text NOT NULL,
    app_name text DEFAULT 'Amish Limo Service'::text,
    main_logo_url text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: trip_creation_rules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.trip_creation_rules (
    id text NOT NULL,
    integration_id text NOT NULL,
    organization_id text NOT NULL,
    trip_type text DEFAULT 'one_way'::text,
    pickup_offset_minutes integer DEFAULT '-15'::integer,
    default_pickup_location text,
    requires_approval boolean DEFAULT false,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: trips; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.trips (
    id text DEFAULT ('trip_'::text || gen_random_uuid()) NOT NULL,
    organization_id text NOT NULL,
    client_id text,
    driver_id text,
    trip_type public.trip_type DEFAULT 'one_way'::public.trip_type NOT NULL,
    pickup_address text NOT NULL,
    dropoff_address text NOT NULL,
    scheduled_pickup_time timestamp without time zone NOT NULL,
    scheduled_return_time timestamp without time zone,
    actual_pickup_time timestamp without time zone,
    actual_dropoff_time timestamp without time zone,
    actual_return_time timestamp without time zone,
    passenger_count integer DEFAULT 1,
    special_requirements text,
    status text DEFAULT 'scheduled'::public.trip_status NOT NULL,
    notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    pickup_location text,
    dropoff_location text,
    scheduled_dropoff_time timestamp with time zone,
    vehicle_id text,
    recurring_trip_id character varying(255),
    is_recurring boolean DEFAULT false,
    client_group_id character varying(255),
    created_by character varying(255),
    group_name character varying(255),
    start_latitude numeric(10,8),
    start_longitude numeric(11,8),
    end_latitude numeric(10,8),
    end_longitude numeric(11,8),
    distance_miles numeric(8,2),
    fuel_cost numeric(8,2),
    driver_notes text
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    user_id text DEFAULT ('user_'::text || gen_random_uuid()) NOT NULL,
    user_name text NOT NULL,
    email text NOT NULL,
    password_hash text NOT NULL,
    role public.user_role DEFAULT 'organization_user'::public.user_role NOT NULL,
    primary_organization_id text,
    authorized_organizations text[] DEFAULT '{}'::text[],
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    avatar_url text,
    phone_number character varying(20),
    billing_pin text
);


--
-- Name: vehicles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vehicles (
    id text NOT NULL,
    organization_id text NOT NULL,
    year integer NOT NULL,
    make text NOT NULL,
    model text NOT NULL,
    color text NOT NULL,
    license_plate text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    odometer_reading integer,
    mpg_rating numeric(4,1)
);


--
-- Name: trip_details; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.trip_details AS
 SELECT t.id,
    t.organization_id,
    o.name AS organization_name,
    t.client_id,
    ((c.first_name || ' '::text) || c.last_name) AS client_name,
    t.driver_id,
    u.user_name AS driver_name,
    t.pickup_address,
    t.dropoff_address,
    t.scheduled_pickup_time,
    t.scheduled_dropoff_time,
    t.actual_pickup_time,
    t.actual_dropoff_time,
    t.status,
    t.passenger_count,
    t.notes,
    t.created_at,
    t.updated_at,
    ((((v.year || ' '::text) || v.make) || ' '::text) || v.model) AS vehicle_info
   FROM ((((public.trips t
     LEFT JOIN public.organizations o ON ((t.organization_id = o.id)))
     LEFT JOIN public.clients c ON ((t.client_id = c.id)))
     LEFT JOIN public.users u ON ((t.driver_id = u.user_id)))
     LEFT JOIN public.vehicles v ON ((t.vehicle_id = v.id)));


--
-- Name: trips_v2; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.trips_v2 (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    trip_number character varying(50) NOT NULL,
    organization_id character varying(50) NOT NULL,
    client_id uuid NOT NULL,
    driver_id uuid,
    service_area_id character varying(50),
    trip_type character varying(20) DEFAULT 'one_way'::character varying NOT NULL,
    status character varying(20) DEFAULT 'scheduled'::character varying NOT NULL,
    pickup_address text NOT NULL,
    dropoff_address text NOT NULL,
    pickup_coordinates point,
    dropoff_coordinates point,
    scheduled_pickup_time timestamp without time zone NOT NULL,
    scheduled_dropoff_time timestamp without time zone,
    scheduled_return_time timestamp without time zone,
    actual_pickup_time timestamp without time zone,
    actual_dropoff_time timestamp without time zone,
    actual_return_time timestamp without time zone,
    passenger_count integer DEFAULT 1,
    special_requirements text,
    notes text,
    is_recurring boolean DEFAULT false,
    recurrence_pattern character varying(50),
    recurrence_end_date date,
    created_by character varying(50),
    updated_by character varying(50),
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: vehicles_v2; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vehicles_v2 (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    vehicle_number character varying(50) NOT NULL,
    organization_id character varying(50) NOT NULL,
    make character varying(50) NOT NULL,
    model character varying(50) NOT NULL,
    year integer NOT NULL,
    color character varying(30),
    license_plate character varying(20),
    vin character varying(17),
    registration_expiry date,
    insurance_expiry date,
    capacity integer DEFAULT 4,
    vehicle_type character varying(20) DEFAULT 'sedan'::character varying,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: webhook_event_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.webhook_event_logs (
    id text NOT NULL,
    integration_id text NOT NULL,
    organization_id text NOT NULL,
    event_type text NOT NULL,
    event_data jsonb NOT NULL,
    status text DEFAULT 'success'::text,
    trips_created text[] DEFAULT '{}'::text[],
    error_message text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT webhook_event_logs_status_check CHECK ((status = ANY (ARRAY['success'::text, 'error'::text, 'skipped'::text])))
);


--
-- Name: webhook_integrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.webhook_integrations (
    id text NOT NULL,
    organization_id text NOT NULL,
    name text NOT NULL,
    provider text NOT NULL,
    webhook_url text,
    secret_key text,
    filter_keywords text[] DEFAULT '{}'::text[],
    filter_attendees text[] DEFAULT '{}'::text[],
    status text DEFAULT 'active'::text,
    last_sync timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT webhook_integrations_status_check CHECK ((status = ANY (ARRAY['active'::text, 'inactive'::text, 'error'::text])))
);


--
-- Name: messages; Type: TABLE; Schema: realtime; Owner: -
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


--
-- Name: schema_migrations; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.schema_migrations (
    version bigint NOT NULL,
    inserted_at timestamp(0) without time zone
);


--
-- Name: subscription; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.subscription (
    id bigint NOT NULL,
    subscription_id uuid NOT NULL,
    entity regclass NOT NULL,
    filters realtime.user_defined_filter[] DEFAULT '{}'::realtime.user_defined_filter[] NOT NULL,
    claims jsonb NOT NULL,
    claims_role regrole GENERATED ALWAYS AS (realtime.to_regrole((claims ->> 'role'::text))) STORED NOT NULL,
    created_at timestamp without time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);


--
-- Name: subscription_id_seq; Type: SEQUENCE; Schema: realtime; Owner: -
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
-- Name: buckets; Type: TABLE; Schema: storage; Owner: -
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
    owner_id text
);


--
-- Name: COLUMN buckets.owner; Type: COMMENT; Schema: storage; Owner: -
--

COMMENT ON COLUMN storage.buckets.owner IS 'Field is deprecated, use owner_id instead';


--
-- Name: migrations; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.migrations (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    hash character varying(40) NOT NULL,
    executed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: objects; Type: TABLE; Schema: storage; Owner: -
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


--
-- Name: COLUMN objects.owner; Type: COMMENT; Schema: storage; Owner: -
--

COMMENT ON COLUMN storage.objects.owner IS 'Field is deprecated, use owner_id instead';


--
-- Name: s3_multipart_uploads; Type: TABLE; Schema: storage; Owner: -
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
    user_metadata jsonb
);


--
-- Name: s3_multipart_uploads_parts; Type: TABLE; Schema: storage; Owner: -
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


--
-- Name: schema_migrations; Type: TABLE; Schema: supabase_migrations; Owner: -
--

CREATE TABLE supabase_migrations.schema_migrations (
    version text NOT NULL,
    statements text[],
    name text
);


--
-- Name: seed_files; Type: TABLE; Schema: supabase_migrations; Owner: -
--

CREATE TABLE supabase_migrations.seed_files (
    path text NOT NULL,
    hash text NOT NULL
);


--
-- Name: refresh_tokens id; Type: DEFAULT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.refresh_tokens ALTER COLUMN id SET DEFAULT nextval('auth.refresh_tokens_id_seq'::regclass);


--
-- Name: feature_flags id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feature_flags ALTER COLUMN id SET DEFAULT nextval('public.feature_flags_id_seq'::regclass);


--
-- Name: role_permissions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions ALTER COLUMN id SET DEFAULT nextval('public.role_permissions_id_seq'::regclass);


--
-- Data for Name: audit_log_entries; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) FROM stdin;
\.


--
-- Data for Name: flow_state; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.flow_state (id, user_id, auth_code, code_challenge_method, code_challenge, provider_type, provider_access_token, provider_refresh_token, created_at, updated_at, authentication_method, auth_code_issued_at) FROM stdin;
\.


--
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, id) FROM stdin;
\.


--
-- Data for Name: instances; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.instances (id, uuid, raw_base_config, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: mfa_amr_claims; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.mfa_amr_claims (session_id, created_at, updated_at, authentication_method, id) FROM stdin;
\.


--
-- Data for Name: mfa_challenges; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.mfa_challenges (id, factor_id, created_at, verified_at, ip_address, otp_code, web_authn_session_data) FROM stdin;
\.


--
-- Data for Name: mfa_factors; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.mfa_factors (id, user_id, friendly_name, factor_type, status, created_at, updated_at, secret, phone, last_challenged_at, web_authn_credential, web_authn_aaguid) FROM stdin;
\.


--
-- Data for Name: one_time_tokens; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.one_time_tokens (id, user_id, token_type, token_hash, relates_to, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.refresh_tokens (instance_id, id, token, user_id, revoked, created_at, updated_at, parent, session_id) FROM stdin;
\.


--
-- Data for Name: saml_providers; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.saml_providers (id, sso_provider_id, entity_id, metadata_xml, metadata_url, attribute_mapping, created_at, updated_at, name_id_format) FROM stdin;
\.


--
-- Data for Name: saml_relay_states; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.saml_relay_states (id, sso_provider_id, request_id, for_email, redirect_to, created_at, updated_at, flow_state_id) FROM stdin;
\.


--
-- Data for Name: schema_migrations; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.schema_migrations (version) FROM stdin;
20171026211738
20171026211808
20171026211834
20180103212743
20180108183307
20180119214651
20180125194653
00
20210710035447
20210722035447
20210730183235
20210909172000
20210927181326
20211122151130
20211124214934
20211202183645
20220114185221
20220114185340
20220224000811
20220323170000
20220429102000
20220531120530
20220614074223
20220811173540
20221003041349
20221003041400
20221011041400
20221020193600
20221021073300
20221021082433
20221027105023
20221114143122
20221114143410
20221125140132
20221208132122
20221215195500
20221215195800
20221215195900
20230116124310
20230116124412
20230131181311
20230322519590
20230402418590
20230411005111
20230508135423
20230523124323
20230818113222
20230914180801
20231027141322
20231114161723
20231117164230
20240115144230
20240214120130
20240306115329
20240314092811
20240427152123
20240612123726
20240729123726
20240802193726
20240806073726
20241009103726
20250717082212
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.sessions (id, user_id, created_at, updated_at, factor_id, aal, not_after, refreshed_at, user_agent, ip, tag) FROM stdin;
\.


--
-- Data for Name: sso_domains; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.sso_domains (id, sso_provider_id, domain, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: sso_providers; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.sso_providers (id, resource_id, created_at, updated_at, disabled) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, invited_at, confirmation_token, confirmation_sent_at, recovery_token, recovery_sent_at, email_change_token_new, email_change, email_change_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, phone, phone_confirmed_at, phone_change, phone_change_token, phone_change_sent_at, email_change_token_current, email_change_confirm_status, banned_until, reauthentication_token, reauthentication_sent_at, is_sso_user, deleted_at, is_anonymous) FROM stdin;
\.


--
-- Data for Name: billing_batches; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.billing_batches (id, organization_id, name, description, claim_ids, total_claims, total_amount, status, created_by, submitted_date, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: billing_claims; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.billing_claims (id, organization_id, client_id, trip_id, claim_number, service_date, billing_code, modifiers, units, rate, total_amount, status, submission_date, payment_date, paid_amount, denial_reason, cms_1500_data, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: billing_codes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.billing_codes (id, code, description, category, rate_colorado, is_active, created_at, updated_at) FROM stdin;
t2003	T2003	Non-emergency transportation	transport	15.00	t	2025-07-12 04:26:39.031211	2025-07-12 04:26:39.031211
t2004	T2004	Non-emergency transportation; wait time	transport	25.00	t	2025-07-12 04:26:39.031211	2025-07-12 04:26:39.031211
a0120	A0120	Non-emergency transportation: mini-bus, mountain area transports	transport	20.00	t	2025-07-12 04:26:39.031211	2025-07-12 04:26:39.031211
t2001	T2001	Non-emergency transportation; patient attendant/escort	transport	35.00	t	2025-07-12 04:26:39.031211	2025-07-12 04:26:39.031211
a0080	A0080	Non-emergency transportation, per mile - vehicle provided by volunteer	transport	0.65	t	2025-07-12 04:26:39.031211	2025-07-12 04:26:39.031211
a0090	A0090	Non-emergency transportation, per mile - vehicle provided by individual	transport	0.65	t	2025-07-12 04:26:39.031211	2025-07-12 04:26:39.031211
\.


--
-- Data for Name: billing_modifiers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.billing_modifiers (id, code, description, applies_to_codes, is_active, created_at, updated_at) FROM stdin;
u1	U1	One way trip	{T2003,T2004,A0120}	t	2025-07-12 04:26:49.651645	2025-07-12 04:26:49.651645
u2	U2	Two way trip	{T2003,T2004,A0120}	t	2025-07-12 04:26:49.651645	2025-07-12 04:26:49.651645
u3	U3	Three way trip	{T2003,T2004,A0120}	t	2025-07-12 04:26:49.651645	2025-07-12 04:26:49.651645
u4	U4	Four way trip	{T2003,T2004,A0120}	t	2025-07-12 04:26:49.651645	2025-07-12 04:26:49.651645
u5	U5	Five way trip	{T2003,T2004,A0120}	t	2025-07-12 04:26:49.651645	2025-07-12 04:26:49.651645
u6	U6	Six way trip	{T2003,T2004,A0120}	t	2025-07-12 04:26:49.651645	2025-07-12 04:26:49.651645
u7	U7	Seven way trip	{T2003,T2004,A0120}	t	2025-07-12 04:26:49.651645	2025-07-12 04:26:49.651645
u8	U8	Eight way trip	{T2003,T2004,A0120}	t	2025-07-12 04:26:49.651645	2025-07-12 04:26:49.651645
u9	U9	Nine way trip	{T2003,T2004,A0120}	t	2025-07-12 04:26:49.651645	2025-07-12 04:26:49.651645
qm	QM	Ambulatory patient	{T2003,T2004,A0120}	t	2025-07-12 04:26:49.651645	2025-07-12 04:26:49.651645
tk	TK	Actual charge	{T2003,T2004,A0120}	t	2025-07-12 04:26:49.651645	2025-07-12 04:26:49.651645
gk	GK	Actual charge for item/service furnished	{T2003,T2004,A0120}	t	2025-07-12 04:26:49.651645	2025-07-12 04:26:49.651645
gn	GN	Services delivered under an outpatient speech-language pathology plan	{T2003,T2004}	t	2025-07-12 04:26:49.651645	2025-07-12 04:26:49.651645
go	GO	Services delivered under an outpatient occupational therapy plan	{T2003,T2004}	t	2025-07-12 04:26:49.651645	2025-07-12 04:26:49.651645
gp	GP	Services delivered under an outpatient physical therapy plan	{T2003,T2004}	t	2025-07-12 04:26:49.651645	2025-07-12 04:26:49.651645
\.


--
-- Data for Name: client_billing_info; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.client_billing_info (id, client_id, organization_id, insurance_type, medicaid_id, medicare_id, group_number, waiver_type, waiver_id, prior_authorization_number, authorization_expiry, billing_provider_npi, billing_provider_name, billing_provider_taxonomy, hipaa_authorization_date, billing_consent_date, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: client_group_memberships; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.client_group_memberships (id, client_id, group_id, joined_at) FROM stdin;
\.


--
-- Data for Name: client_groups; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.client_groups (id, organization_id, name, description, service_area_id, is_active, created_at, updated_at, expires_at) FROM stdin;
group_1750569577165_dz1y507ql	monarch_competency	test group	test 24 hr	\N	t	2025-06-22 05:19:37.165	2025-06-22 05:19:37.165	2025-06-23 05:19:37.165
group_1750743483904_ec10tl16d	monarch_competency	Test Group A	\N	\N	t	2025-06-24 05:38:03.904	2025-06-24 05:38:03.904	2025-07-01 05:38:03.904
group_1750815373509_lhbsz3ohp	monarch_competency	Phoenix Group	\N	\N	t	2025-06-25 01:36:13.509	2025-06-25 01:36:13.509	\N
\.


--
-- Data for Name: clients; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.clients (id, organization_id, service_area_id, first_name, last_name, phone, email, address, emergency_contact, emergency_phone, medical_notes, mobility_requirements, is_active, created_at, updated_at) FROM stdin;
client_002	monarch_mental_health	sa_9967a431-f3c8-4e42-bfa3-4087f52a1467	Mary	Johnson	(704) 555-1002	\N	200 South Blvd, Charlotte, NC	\N	\N	\N	\N	t	2025-06-11 07:05:47.553224	2025-06-18 06:33:59.361636
client_003	monarch_sober_living	sa_7dc16828-038f-4ae2-b4a2-e5ebd563c1f1	Robert	Williams	(704) 555-1003	\N	300 University City Blvd, Charlotte, NC	\N	\N	\N	\N	t	2025-06-11 07:05:47.553224	2025-06-18 06:39:19.856358
client_004	monarch_launch	sa_f4e8b2a1-9c7d-4e3f-8b5a-2d1c9e6f4a8b	Lisa	Brown	(704) 555-1004	\N	400 Concord Pkwy N, Concord, NC	\N	\N	\N	\N	t	2025-06-11 07:05:47.553224	2025-06-18 06:40:27.420027
client_1752090490406_vwwdrmtm2	monarch_competency	sa_b562c823-0196-489b-a3c6-6a05ab9c38d1	colin	test	303-333-4455	colin@monarch.com	\N	\N	\N		\N	t	2025-07-09 19:48:10.457347	2025-09-14 23:35:50.220802
client_1750785580055_ipbgnehzd	monarch_competency	sa_b562c823-0196-489b-a3c6-6a05ab9c38d1	Veronica	TestUpdated	303-333-4444	Veronica@monarch.com	\N	\N	\N	\N	\N	t	2025-06-24 17:19:40.087652	2025-09-15 16:07:19.466905
client_1752090113362_gi6azlxux	monarch_competency	sa_5d995f17-d906-4f22-8848-8741ae17fa7e	Morgan	Test 4	303-444-5566	morgan@monarch.com	\N	\N	\N		\N	t	2025-07-09 19:41:53.401389	2025-09-15 16:08:40.494384
client_1751417752798_93ulnpqf0	monarch_competency	sa_b562c823-0196-489b-a3c6-6a05ab9c38d1	Brooklyn	Test 4	303-444-5555	brooklyn@monarch.com	\N	\N	\N		\N	t	2025-07-02 00:55:52.860463	2025-09-15 16:08:50.999566
client_1750883156672_d94hmf7ug	monarch_competency	sa_5d995f17-d906-4f22-8848-8741ae17fa7e	Ryan	Bell Test	303-330-3184	octane53x@gmail.com	\N	\N	\N		\N	t	2025-06-25 20:25:56.71601	2025-09-15 16:09:17.162822
client_1757991319468_5r9ts2pdn_630	monarch_launch	sa_50aedb65-359e-4575-a94f-d629c9da2205	Test	Client	\N	\N	\N	\N	\N	\N	\N	t	2025-09-16 02:55:19.580302	2025-09-16 02:55:19.580302
client_1757991438347_htzg4g6r5_481	monarch_launch	sa_50aedb65-359e-4575-a94f-d629c9da2205	Timmy	Test 1	303-444-9999	Timmy@Test.com	\N	\N	\N	\N	\N	t	2025-09-16 02:57:18.504463	2025-09-16 02:57:18.504463
client_1758076075012_x7sjskl7v_989	monarch_competency	sa_5d995f17-d906-4f22-8848-8741ae17fa7e	Peter	Test	303-789-4141	Peter@test.com	\N	\N	\N	\N	\N	t	2025-09-17 02:27:55.128565	2025-09-17 02:27:55.128565
\.


--
-- Data for Name: clients_v2; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.clients_v2 (id, client_number, first_name, last_name, email, phone, address, emergency_contact, emergency_phone, medical_notes, mobility_requirements, is_active, organization_id, service_area_id, created_at, updated_at) FROM stdin;
1fb08d13-7f64-45db-940f-cbbba71113cf	C-1758065983476-0BW5	Mary	Johnson	\N	(704) 555-1002	200 South Blvd, Charlotte, NC	\N	\N	\N	\N	t	monarch_mental_health	sa_9967a431-f3c8-4e42-bfa3-4087f52a1467	2025-06-11 07:05:47.553224	2025-06-18 06:33:59.361636
2da019e7-16ee-49a9-a16d-2e157fd25209	C-1758065983580-ISSQ	Robert	Williams	\N	(704) 555-1003	300 University City Blvd, Charlotte, NC	\N	\N	\N	\N	t	monarch_sober_living	sa_7dc16828-038f-4ae2-b4a2-e5ebd563c1f1	2025-06-11 07:05:47.553224	2025-06-18 06:39:19.856358
63387414-0a2d-415e-b239-9d53d181a12c	C-1758065983679-FCSF	Lisa	Brown	\N	(704) 555-1004	400 Concord Pkwy N, Concord, NC	\N	\N	\N	\N	t	monarch_launch	sa_f4e8b2a1-9c7d-4e3f-8b5a-2d1c9e6f4a8b	2025-06-11 07:05:47.553224	2025-06-18 06:40:27.420027
74dabca0-8fb1-4493-88a3-f38489f4d317	C-1758065983769-TMNO	colin	test	colin@monarch.com	303-333-4455	\N	\N	\N		\N	t	monarch_competency	sa_b562c823-0196-489b-a3c6-6a05ab9c38d1	2025-07-09 19:48:10.457347	2025-09-14 23:35:50.220802
0dc14602-6720-41af-8e1f-13f214447efb	C-1758065983878-NOF5	Veronica	TestUpdated	Veronica@monarch.com	303-333-4444	\N	\N	\N	\N	\N	t	monarch_competency	sa_b562c823-0196-489b-a3c6-6a05ab9c38d1	2025-06-24 17:19:40.087652	2025-09-15 16:07:19.466905
09784652-c5ef-437d-8f6e-d411678fd4cc	C-1758065983965-E7CW	Morgan	Test 4	morgan@monarch.com	303-444-5566	\N	\N	\N		\N	t	monarch_competency	sa_5d995f17-d906-4f22-8848-8741ae17fa7e	2025-07-09 19:41:53.401389	2025-09-15 16:08:40.494384
2ee20ce4-ed80-4648-b8fe-b63e925349ec	C-1758065984083-ESOY	Brooklyn	Test 4	brooklyn@monarch.com	303-444-5555	\N	\N	\N		\N	t	monarch_competency	sa_b562c823-0196-489b-a3c6-6a05ab9c38d1	2025-07-02 00:55:52.860463	2025-09-15 16:08:50.999566
5334f101-aad5-4cf1-8159-034b5b34dfc0	C-1758065984193-7UD4	Ryan	Bell Test	octane53x@gmail.com	303-330-3184	\N	\N	\N		\N	t	monarch_competency	sa_5d995f17-d906-4f22-8848-8741ae17fa7e	2025-06-25 20:25:56.71601	2025-09-15 16:09:17.162822
035f8606-79d5-4dc9-9314-743c13b042ae	C-1758065984296-WXTL	Test	Client	\N	\N	\N	\N	\N	\N	\N	t	monarch_launch	sa_50aedb65-359e-4575-a94f-d629c9da2205	2025-09-16 02:55:19.580302	2025-09-16 02:55:19.580302
f51e6b29-7342-4508-8629-6a956330d340	C-1758065984418-B84Y	Timmy	Test 1	Timmy@Test.com	303-444-9999	\N	\N	\N	\N	\N	t	monarch_launch	sa_50aedb65-359e-4575-a94f-d629c9da2205	2025-09-16 02:57:18.504463	2025-09-16 02:57:18.504463
\.


--
-- Data for Name: cms1500_forms; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.cms1500_forms (id, organization_id, client_id, trip_id, billing_claim_id, form_number, insurance_type, insured_id, patient_last_name, patient_first_name, patient_middle_initial, patient_birth_date, patient_sex, insured_last_name, insured_first_name, insured_middle_initial, patient_address, patient_city, patient_state, patient_zip, patient_phone, patient_relationship, insured_address, insured_city, insured_state, insured_zip, insured_phone, other_insured_name, other_insured_policy, other_insurance_plan, related_employment, related_auto_accident, related_other_accident, accident_state, claim_codes, insured_group_number, insured_birth_date, insured_sex, other_claim_id, insurance_plan_name, has_other_health_plan, patient_signature, patient_signature_date, insured_signature, illness_date, other_date, unable_to_work_from, unable_to_work_to, referring_provider, referring_provider_npi, hospitalization_from, hospitalization_to, additional_info, outside_lab, outside_lab_charges, diagnosis_1, diagnosis_2, diagnosis_3, diagnosis_4, resubmission_code, original_ref, prior_auth_number, federal_tax_id, ssn_ein, patient_account_number, accept_assignment, total_charge, amount_paid, provider_signature, provider_signature_date, service_facility_name, service_facility_address, service_facility_npi, billing_provider_name, billing_provider_address, billing_provider_npi, billing_provider_phone, status, submission_date, payment_date, rejection_reason, pdf_generated, pdf_url, exported_at, created_at, updated_at, created_by, updated_by) FROM stdin;
\.


--
-- Data for Name: cms1500_service_lines; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.cms1500_service_lines (id, form_id, line_number, date_from, date_to, place_of_service, procedure_code, modifier_1, modifier_2, modifier_3, modifier_4, diagnosis_pointer, charges, days_or_units, epsdt_family_plan, emergency_indicator, coordination_of_benefits, rendering_provider_npi, rendering_provider_name, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: driver_organization_access; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.driver_organization_access (id, driver_id, organization_id, granted_at) FROM stdin;
726c9cb2-2ba2-4bd9-b7d0-2bcab7a97f48	2934ee67-9feb-42a0-9d99-757e0b21afc8	real_transport_org	2025-09-16 05:50:52.281
891c0d51-4347-4913-a236-ca773066131d	033c45e0-5d12-4798-b05a-1aad5432e85d	monarch_competency	2025-09-16 05:50:52.514
2ac013d8-b471-429c-828a-92f7c474df3f	033c45e0-5d12-4798-b05a-1aad5432e85d	monarch_mental_health	2025-09-16 05:50:52.626
8d5645e6-bb0e-4b6c-b6b1-1a5116241f9d	033c45e0-5d12-4798-b05a-1aad5432e85d	monarch_sober_living	2025-09-16 05:50:52.715
a9b861a4-67ec-418f-a508-bdca41c6ddc2	033c45e0-5d12-4798-b05a-1aad5432e85d	monarch_launch	2025-09-16 05:50:52.815
4356e078-94b0-4a64-a253-2d91f1b30c84	a28192d9-c7e8-42c7-8624-4c52acbc81c0	monarch_competency	2025-09-16 05:50:53.017
e3cbb6a7-c03c-4ce6-a46f-7950a7337eca	a28192d9-c7e8-42c7-8624-4c52acbc81c0	monarch_mental_health	2025-09-16 05:50:53.12
3f389c8f-1395-425e-8994-e5532c38f701	a28192d9-c7e8-42c7-8624-4c52acbc81c0	monarch_sober_living	2025-09-16 05:50:53.215
975da164-23f8-4639-bb4b-6d5f9b121928	a28192d9-c7e8-42c7-8624-4c52acbc81c0	monarch_launch	2025-09-16 05:50:53.311
e7199063-a516-4ee8-b80c-9f7c484c356e	2c85739f-e9ba-4b0e-b401-a964cb18a62f	monarch_competency	2025-09-16 05:50:53.515
45d7bbea-94cc-42b5-b133-2d0427abbe74	2c85739f-e9ba-4b0e-b401-a964cb18a62f	monarch_mental_health	2025-09-16 05:50:53.61
1b9b482f-d9f0-4b67-91f7-58bc99b46d2d	2c85739f-e9ba-4b0e-b401-a964cb18a62f	monarch_sober_living	2025-09-16 05:50:53.705
a966d6ca-a6e2-4edf-adb4-417e865f8076	2c85739f-e9ba-4b0e-b401-a964cb18a62f	monarch_launch	2025-09-16 05:50:53.795
f62e207c-4c25-4dbb-a3e5-e0b8113ad776	1dbc2063-a1b8-4f2b-a146-b9462062365c	monarch_competency	2025-09-16 05:50:53.986
202ab42e-9c02-45da-bc68-34591d824a28	1dbc2063-a1b8-4f2b-a146-b9462062365c	monarch_mental_health	2025-09-16 05:50:54.08
a89ef576-1d1f-4d2e-b315-b60e88679fe7	1dbc2063-a1b8-4f2b-a146-b9462062365c	monarch_sober_living	2025-09-16 05:50:54.175
020d1271-e5a9-4f31-8ce3-50e07082a9ea	1dbc2063-a1b8-4f2b-a146-b9462062365c	monarch_launch	2025-09-16 05:50:54.275
cfebeaa5-95e2-407e-86d3-e5406c23f16e	556c5a81-ede7-4cc6-98f8-49b57e452202	monarch_competency	2025-09-16 05:50:54.475
62b52051-ea56-4a44-9307-a66e90cfd988	556c5a81-ede7-4cc6-98f8-49b57e452202	monarch_mental_health	2025-09-16 05:50:54.575
42427f93-b679-450e-911e-305a34dfdd1f	556c5a81-ede7-4cc6-98f8-49b57e452202	monarch_sober_living	2025-09-16 05:50:54.655
6620529d-41f5-441c-990e-316563cd5825	556c5a81-ede7-4cc6-98f8-49b57e452202	monarch_launch	2025-09-16 05:50:54.752
865ecad8-ae66-41cd-b59b-dda00eaac5c1	1ecbc584-4f1d-43e9-8eee-29a4cffed083	monarch_competency	2025-09-16 05:50:54.945
87930aa5-57bc-4fe5-a2e9-f58702bb8bc4	1ecbc584-4f1d-43e9-8eee-29a4cffed083	monarch_mental_health	2025-09-16 05:50:55.035
398df918-4b39-434b-83d4-9d1faf2352e9	1ecbc584-4f1d-43e9-8eee-29a4cffed083	monarch_sober_living	2025-09-16 05:50:55.13
29ff12be-6e68-402b-8310-ba6d5c8fcf9f	1ecbc584-4f1d-43e9-8eee-29a4cffed083	monarch_launch	2025-09-16 05:50:55.215
3d1c155a-2246-4d09-99d8-b88076a18991	5ef4e673-68ff-46a1-87da-315fb796c876	monarch_competency	2025-09-16 05:50:55.422
18383e03-9a70-4539-995c-f98347ea3048	5ef4e673-68ff-46a1-87da-315fb796c876	monarch_mental_health	2025-09-16 05:50:55.52
0c7c0186-887e-4fd4-a35b-dc64888bf17c	5ef4e673-68ff-46a1-87da-315fb796c876	monarch_sober_living	2025-09-16 05:50:55.625
e40fa6df-2387-440f-90b9-52cfb7cbd822	5ef4e673-68ff-46a1-87da-315fb796c876	monarch_launch	2025-09-16 05:50:55.719
36c6b43b-d672-4fe0-b41a-447b9d7bb97e	4fee3ee9-49f5-4c20-a56b-97fbe98beb50	monarch_competency	2025-09-16 05:50:55.905
ff91443b-250a-4c7e-bb78-5e25b5163ae3	4fee3ee9-49f5-4c20-a56b-97fbe98beb50	monarch_mental_health	2025-09-16 05:50:55.995
2dabb7b6-516c-4a6c-a701-5d78d30f842f	4fee3ee9-49f5-4c20-a56b-97fbe98beb50	monarch_sober_living	2025-09-16 05:50:56.115
04fd494d-180d-4611-ba86-da845bd7b192	4fee3ee9-49f5-4c20-a56b-97fbe98beb50	monarch_launch	2025-09-16 05:50:56.215
0dcb4308-db9e-43f7-b277-b2efd289f277	34e8eac3-c273-4cdb-b8f4-05eec1a9b46c	monarch_competency	2025-09-16 05:50:56.41
ba84badc-502b-4693-9849-90307b806c5c	34e8eac3-c273-4cdb-b8f4-05eec1a9b46c	monarch_mental_health	2025-09-16 05:50:56.505
57a19998-506f-4e82-9c83-e2aa066e9a84	34e8eac3-c273-4cdb-b8f4-05eec1a9b46c	monarch_sober_living	2025-09-16 05:50:56.61
750d963d-20c4-4745-abc7-71b2fa0e23da	34e8eac3-c273-4cdb-b8f4-05eec1a9b46c	monarch_launch	2025-09-16 05:50:56.705
6c5e2506-17b7-4ab3-af55-9639cab83d73	96fcbf46-9648-4e74-bdbd-e0adbf59891c	monarch_competency	2025-09-16 05:50:56.895
5531e256-d14d-4dbf-adb5-59e4ed33263d	96fcbf46-9648-4e74-bdbd-e0adbf59891c	monarch_mental_health	2025-09-16 05:50:56.985
8ad602e0-b0f2-4650-9872-951248626963	96fcbf46-9648-4e74-bdbd-e0adbf59891c	monarch_sober_living	2025-09-16 05:50:57.075
824eb2a3-3d5f-4ac7-b0e5-61508428fa67	96fcbf46-9648-4e74-bdbd-e0adbf59891c	monarch_launch	2025-09-16 05:50:57.176
8211dacb-fc22-42e0-81b8-dc17e50b5023	7fd7fb56-6dcd-4a3e-ad61-f31188f44fff	monarch_competency	2025-09-16 05:50:57.371
057a7b88-bc00-42f4-a611-dec11dae8f72	7fd7fb56-6dcd-4a3e-ad61-f31188f44fff	monarch_mental_health	2025-09-16 05:50:57.47
e95ad4c8-adb1-4e85-b8f1-af50a06db7e6	7fd7fb56-6dcd-4a3e-ad61-f31188f44fff	monarch_sober_living	2025-09-16 05:50:57.555
4b30b681-1e61-418b-9d7f-a0b66317949b	7fd7fb56-6dcd-4a3e-ad61-f31188f44fff	monarch_launch	2025-09-16 05:50:57.655
\.


--
-- Data for Name: driver_schedules; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.driver_schedules (id, driver_id, organization_id, day_of_week, start_time, end_time, is_available, created_at, updated_at) FROM stdin;
sched_001	driver_sarah_001	monarch_competency	1	08:00:00	16:00:00	t	2025-06-24 16:55:49.401979	2025-06-24 16:55:49.401979
sched_002	driver_sarah_001	monarch_competency	2	08:00:00	16:00:00	t	2025-06-24 16:55:49.401979	2025-06-24 16:55:49.401979
sched_003	driver_sarah_001	monarch_competency	3	08:00:00	16:00:00	t	2025-06-24 16:55:49.401979	2025-06-24 16:55:49.401979
sched_004	driver_michael_001	monarch_competency	1	09:00:00	17:00:00	t	2025-06-24 16:55:49.401979	2025-06-24 16:55:49.401979
sched_005	driver_michael_001	monarch_competency	2	09:00:00	17:00:00	t	2025-06-24 16:55:49.401979	2025-06-24 16:55:49.401979
sched_006	driver_3a7ff0fb-3f54-4943-8c97-6ced934ab2d6	monarch_competency	4	10:00:00	15:00:00	t	2025-06-24 16:55:49.401979	2025-06-24 16:55:49.401979
sched_007	driver_3a7ff0fb-3f54-4943-8c97-6ced934ab2d6	monarch_competency	5	10:00:00	15:00:00	t	2025-06-24 16:55:49.401979	2025-06-24 16:55:49.401979
\.


--
-- Data for Name: driver_vehicle_assignments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.driver_vehicle_assignments (id, driver_id, vehicle_id, assigned_date, is_primary, created_at) FROM stdin;
\.


--
-- Data for Name: drivers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.drivers (id, user_id, primary_organization_id, authorized_organizations, license_number, license_expiry, vehicle_info, phone, emergency_contact, emergency_phone, is_available, is_active, created_at, updated_at) FROM stdin;
driver_real_001	driver_real_001	real_transport_org	{real_transport_org}	NC123456789	2026-12-31	Toyota Camry - Silver	(704) 555-0201	Emergency Contact	(704) 555-0202	t	t	2025-06-16 22:02:35.793301	2025-06-16 22:02:55.369865
driver_lisa_001	driver_lisa_wilson	monarch_sober_living	{monarch_competency,monarch_mental_health,monarch_sober_living,monarch_launch}	NC987123654	\N	2021 Ford Transit Connect - Red	555-4101	Steve Wilson	555-4102	t	t	2025-06-13 06:07:42.233226	2025-09-15 21:29:18.502973
driver_david_001	driver_david_taylor	monarch_sober_living	{monarch_competency,monarch_mental_health,monarch_sober_living,monarch_launch}	NC321654987	\N	2020 Toyota Highlander - Black	555-4201	Karen Taylor	555-4202	t	t	2025-06-13 06:07:42.233226	2025-09-15 21:29:18.731115
driver_jessica_001	driver_jessica_moore	monarch_launch	{monarch_competency,monarch_mental_health,monarch_sober_living,monarch_launch}	NC159753468	\N	2022 Tesla Model Y - White	555-5101	Brian Moore	555-5102	t	t	2025-06-13 06:07:52.79433	2025-09-15 21:29:19.182169
driver_kevin_001	driver_kevin_anderson	monarch_launch	{monarch_competency,monarch_mental_health,monarch_sober_living,monarch_launch}	NC864297531	\N	2021 BMW X3 - Silver	555-5201	Rebecca Anderson	555-5202	t	t	2025-06-13 06:07:52.79433	2025-09-15 21:29:19.396635
driver_sarah_001	driver_sarah_williams	monarch_competency	{monarch_competency,monarch_mental_health,monarch_sober_living,monarch_launch}	NC123789456	\N	2021 Toyota Sienna - Silver	555-2101	Tom Williams	555-2102	t	t	2025-06-13 06:07:14.593777	2025-09-15 21:29:16.198994
driver_michael_001	driver_michael_brown	monarch_competency	{monarch_competency,monarch_mental_health,monarch_sober_living,monarch_launch}	NC789456123	\N	2020 Ford Transit - White	555-2201	Amy Brown	555-2202	t	t	2025-06-13 06:07:14.593777	2025-09-15 21:29:16.421272
driver_alex_001	alex_monarch_competency_001	monarch_competency	{monarch_competency,monarch_mental_health,monarch_sober_living,monarch_launch}	NC456789012	\N	2021 Toyota Camry - Blue	555-3101	Lisa Thompson	555-3102	t	t	2025-06-15 04:44:47.391	2025-09-15 21:29:16.829281
driver_3a7ff0fb-3f54-4943-8c97-6ced934ab2d6	alex_driver_user	monarch_competency	{monarch_competency,monarch_mental_health,monarch_sober_living,monarch_launch}	NC987654321	2026-12-31	2022 Toyota Sienna - Blue (Wheelchair Accessible)	(704) 555-ALEX	Sarah Thompson	(704) 555-9999	t	t	2025-06-20 04:53:09.311787	2025-09-15 21:29:17.064625
driver_55476c50-ef1a-4244-9a71-e46bf2eae9ff	user_seffe_monarch_competency_001	monarch_competency	{monarch_competency,monarch_mental_health,monarch_sober_living,monarch_launch}	TBD-001	\N	Vehicle TBD	\N	\N	\N	t	t	2025-06-24 05:20:20.937349	2025-09-15 21:29:17.296669
driver_jennifer_001	driver_jennifer_davis	monarch_mental_health	{monarch_competency,monarch_mental_health,monarch_sober_living,monarch_launch}	NC456123789	\N	2022 Honda Odyssey - Blue	555-3101	Mark Davis	555-3102	t	t	2025-06-13 06:07:28.62132	2025-09-15 21:29:17.794573
driver_robert_001	driver_robert_miller	monarch_mental_health	{monarch_competency,monarch_mental_health,monarch_sober_living,monarch_launch}	NC654321987	\N	2019 Chevrolet Express - Gray	555-3201	Linda Miller	555-3202	t	t	2025-06-13 06:07:28.62132	2025-09-15 21:29:18.028831
\.


--
-- Data for Name: drivers_v2; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.drivers_v2 (id, employee_id, first_name, last_name, email, phone, license_number, license_expiry, vehicle_info, emergency_contact, emergency_phone, is_available, is_active, primary_organization_id, created_at, updated_at) FROM stdin;
2934ee67-9feb-42a0-9d99-757e0b21afc8	D-1758001852147-ILUN	Real	Driver	driver@realtransport.com	(704) 555-0201	NC123456789	2026-12-31	Toyota Camry - Silver	Emergency Contact	(704) 555-0202	t	t	real_transport_org	2025-06-16 22:02:35.793301	2025-06-16 22:02:55.369865
033c45e0-5d12-4798-b05a-1aad5432e85d	D-1758001852411-1ROQ	Lisa	Wilson	lisa.wilson@monarch.org	555-4101	NC987123654	\N	2021 Ford Transit Connect - Red	Steve Wilson	555-4102	t	t	monarch_sober_living	2025-06-13 06:07:42.233226	2025-09-15 21:29:18.502973
a28192d9-c7e8-42c7-8624-4c52acbc81c0	D-1758001852915-F1E7	David	Taylor	david.taylor@monarch.org	555-4201	NC321654987	\N	2020 Toyota Highlander - Black	Karen Taylor	555-4202	t	t	monarch_sober_living	2025-06-13 06:07:42.233226	2025-09-15 21:29:18.731115
2c85739f-e9ba-4b0e-b401-a964cb18a62f	D-1758001853410-VJ54	Jessica	Moore	jessica.moore@monarch.org	555-5101	NC159753468	\N	2022 Tesla Model Y - White	Brian Moore	555-5102	t	t	monarch_launch	2025-06-13 06:07:52.79433	2025-09-15 21:29:19.182169
1dbc2063-a1b8-4f2b-a146-b9462062365c	D-1758001853895-0DTJ	Kevin	Anderson	kevin.anderson@monarch.org	555-5201	NC864297531	\N	2021 BMW X3 - Silver	Rebecca Anderson	555-5202	t	t	monarch_launch	2025-06-13 06:07:52.79433	2025-09-15 21:29:19.396635
556c5a81-ede7-4cc6-98f8-49b57e452202	D-1758001854375-FD6Q	Sarah	Williams	sarah.williams@monarch.org	555-2101	NC123789456	\N	2021 Toyota Sienna - Silver	Tom Williams	555-2102	t	t	monarch_competency	2025-06-13 06:07:14.593777	2025-09-15 21:29:16.198994
1ecbc584-4f1d-43e9-8eee-29a4cffed083	D-1758001854855-LS77	Michael	Brown	michael.brown@monarch.org	555-2201	NC789456123	\N	2020 Ford Transit - White	Amy Brown	555-2202	t	t	monarch_competency	2025-06-13 06:07:14.593777	2025-09-15 21:29:16.421272
5ef4e673-68ff-46a1-87da-315fb796c876	D-1758001855315-IG24	Alex	Martinez	alex@littlemonarch.com	555-3101	NC456789012	\N	2021 Toyota Camry - Blue	Lisa Thompson	555-3102	t	t	monarch_competency	2025-06-15 04:44:47.391	2025-09-15 21:29:16.829281
4fee3ee9-49f5-4c20-a56b-97fbe98beb50	D-1758001855815-WVC2	Alex	Thompson	alex@monarch.com	(704) 555-ALEX	NC987654321	2026-12-31	2022 Toyota Sienna - Blue (Wheelchair Accessible)	Sarah Thompson	(704) 555-9999	t	t	monarch_competency	2025-06-20 04:53:09.311787	2025-09-15 21:29:17.064625
34e8eac3-c273-4cdb-b8f4-05eec1a9b46c	D-1758001856320-BNOA	seffe	Driver	SBrown@monarchcompetency.com	\N	TBD-001	\N	Vehicle TBD	\N	\N	t	t	monarch_competency	2025-06-24 05:20:20.937349	2025-09-15 21:29:17.296669
96fcbf46-9648-4e74-bdbd-e0adbf59891c	D-1758001856800-R5DZ	Jennifer	Davis	jennifer.davis@monarch.org	555-3101	NC456123789	\N	2022 Honda Odyssey - Blue	Mark Davis	555-3102	t	t	monarch_mental_health	2025-06-13 06:07:28.62132	2025-09-15 21:29:17.794573
7fd7fb56-6dcd-4a3e-ad61-f31188f44fff	D-1758001857275-C10X	Robert	Miller	robert.miller@monarch.org	555-3201	NC654321987	\N	2019 Chevrolet Express - Gray	Linda Miller	555-3202	t	t	monarch_mental_health	2025-06-13 06:07:28.62132	2025-09-15 21:29:18.028831
\.


--
-- Data for Name: feature_flags; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.feature_flags (id, flag_name, is_enabled, organization_id, created_at, updated_at) FROM stdin;
1	MOBILE_APP_ACCESS	t	\N	2025-06-22 19:45:13.188116	2025-06-22 19:45:13.188116
2	REAL_TIME_TRACKING	f	\N	2025-06-22 19:45:13.188116	2025-06-22 19:45:13.188116
3	ADVANCED_ANALYTICS	t	\N	2025-06-22 19:45:13.188116	2025-06-22 19:45:13.188116
4	BULK_OPERATIONS	t	\N	2025-06-22 19:45:13.188116	2025-06-22 19:45:13.188116
5	API_ACCESS	t	\N	2025-06-22 19:45:13.188116	2025-06-22 19:45:13.188116
6	CUSTOM_REPORTING	f	\N	2025-06-22 19:45:13.188116	2025-06-22 19:45:13.188116
7	EMERGENCY_ALERTS	t	\N	2025-06-22 19:45:13.188116	2025-06-22 19:45:13.188116
8	DRIVER_SELF_ASSIGNMENT	f	\N	2025-06-22 19:45:13.188116	2025-06-22 19:45:13.188116
9	MOBILE_APP_ACCESS	t	\N	2025-06-22 19:45:15.430388	2025-06-22 19:45:15.430388
10	MOBILE_APP_ACCESS	t	\N	2025-06-22 19:46:19.391115	2025-06-22 19:46:19.391115
11	MOBILE_APP_ACCESS	t	\N	2025-06-22 19:46:53.351981	2025-06-22 19:46:53.351981
12	MOBILE_APP_ACCESS	t	\N	2025-06-22 19:48:27.561644	2025-06-22 19:48:27.561644
13	MOBILE_APP_ACCESS	t	\N	2025-06-22 19:49:51.731557	2025-06-22 19:49:51.731557
14	MOBILE_APP_ACCESS	t	\N	2025-06-22 19:51:12.843429	2025-06-22 19:51:12.843429
15	MOBILE_APP_ACCESS	t	\N	2025-06-22 19:53:13.745442	2025-06-22 19:53:13.745442
16	MOBILE_APP_ACCESS	t	\N	2025-06-22 19:54:31.296785	2025-06-22 19:54:31.296785
17	MOBILE_APP_ACCESS	t	\N	2025-06-22 19:55:11.044964	2025-06-22 19:55:11.044964
18	MOBILE_APP_ACCESS	t	\N	2025-06-22 20:40:26.013207	2025-06-22 20:40:26.013207
19	MOBILE_APP_ACCESS	t	\N	2025-06-22 21:08:13.797224	2025-06-22 21:08:13.797224
20	MOBILE_APP_ACCESS	t	\N	2025-06-22 21:08:51.615261	2025-06-22 21:08:51.615261
21	MOBILE_APP_ACCESS	t	\N	2025-06-22 21:20:24.304514	2025-06-22 21:20:24.304514
22	MOBILE_APP_ACCESS	t	\N	2025-06-22 21:21:18.749758	2025-06-22 21:21:18.749758
23	MOBILE_APP_ACCESS	t	\N	2025-06-23 00:43:17.889665	2025-06-23 00:43:17.889665
24	MOBILE_APP_ACCESS	t	\N	2025-06-23 00:56:20.806599	2025-06-23 00:56:20.806599
25	MOBILE_APP_ACCESS	t	\N	2025-06-23 03:21:00.607732	2025-06-23 03:21:00.607732
26	MOBILE_APP_ACCESS	t	\N	2025-06-23 04:22:31.288363	2025-06-23 04:22:31.288363
27	MOBILE_APP_ACCESS	t	\N	2025-06-23 04:23:38.133934	2025-06-23 04:23:38.133934
28	MOBILE_APP_ACCESS	t	\N	2025-06-23 04:49:02.857811	2025-06-23 04:49:02.857811
29	MOBILE_APP_ACCESS	t	\N	2025-06-23 04:54:17.142251	2025-06-23 04:54:17.142251
30	MOBILE_APP_ACCESS	t	\N	2025-06-23 05:04:56.454884	2025-06-23 05:04:56.454884
31	MOBILE_APP_ACCESS	t	\N	2025-06-23 05:09:18.179736	2025-06-23 05:09:18.179736
32	MOBILE_APP_ACCESS	t	\N	2025-06-23 05:10:19.571122	2025-06-23 05:10:19.571122
33	MOBILE_APP_ACCESS	t	\N	2025-06-23 05:13:15.555428	2025-06-23 05:13:15.555428
34	MOBILE_APP_ACCESS	t	\N	2025-06-23 05:13:30.062945	2025-06-23 05:13:30.062945
35	MOBILE_APP_ACCESS	t	\N	2025-06-23 05:16:00.822516	2025-06-23 05:16:00.822516
36	MOBILE_APP_ACCESS	t	\N	2025-06-23 05:16:15.498571	2025-06-23 05:16:15.498571
37	MOBILE_APP_ACCESS	t	\N	2025-06-23 05:19:34.624333	2025-06-23 05:19:34.624333
38	MOBILE_APP_ACCESS	t	\N	2025-06-23 05:25:35.496195	2025-06-23 05:25:35.496195
39	MOBILE_APP_ACCESS	t	\N	2025-06-23 05:27:15.136416	2025-06-23 05:27:15.136416
40	MOBILE_APP_ACCESS	t	\N	2025-06-23 06:24:35.557203	2025-06-23 06:24:35.557203
41	MOBILE_APP_ACCESS	t	\N	2025-06-23 06:40:54.587378	2025-06-23 06:40:54.587378
42	MOBILE_APP_ACCESS	t	\N	2025-06-23 06:47:03.069365	2025-06-23 06:47:03.069365
43	MOBILE_APP_ACCESS	t	\N	2025-06-23 06:49:13.921164	2025-06-23 06:49:13.921164
44	MOBILE_APP_ACCESS	t	\N	2025-06-23 06:56:12.658981	2025-06-23 06:56:12.658981
45	MOBILE_APP_ACCESS	t	\N	2025-06-23 17:39:21.527636	2025-06-23 17:39:21.527636
46	MOBILE_APP_ACCESS	t	\N	2025-06-24 00:12:39.120737	2025-06-24 00:12:39.120737
47	MOBILE_APP_ACCESS	t	\N	2025-06-24 00:21:20.281963	2025-06-24 00:21:20.281963
48	MOBILE_APP_ACCESS	t	\N	2025-06-24 00:30:59.364335	2025-06-24 00:30:59.364335
49	MOBILE_APP_ACCESS	t	\N	2025-06-24 00:32:10.147715	2025-06-24 00:32:10.147715
50	MOBILE_APP_ACCESS	t	\N	2025-06-24 00:33:35.437457	2025-06-24 00:33:35.437457
51	MOBILE_APP_ACCESS	t	\N	2025-06-24 03:40:18.496497	2025-06-24 03:40:18.496497
52	MOBILE_APP_ACCESS	t	\N	2025-06-24 03:52:29.986548	2025-06-24 03:52:29.986548
53	MOBILE_APP_ACCESS	t	\N	2025-06-24 03:56:33.701085	2025-06-24 03:56:33.701085
54	MOBILE_APP_ACCESS	t	\N	2025-06-24 04:08:44.850839	2025-06-24 04:08:44.850839
55	MOBILE_APP_ACCESS	t	\N	2025-06-24 04:14:44.814154	2025-06-24 04:14:44.814154
56	MOBILE_APP_ACCESS	t	\N	2025-06-24 04:30:57.798166	2025-06-24 04:30:57.798166
57	MOBILE_APP_ACCESS	t	\N	2025-06-24 04:33:35.875867	2025-06-24 04:33:35.875867
58	MOBILE_APP_ACCESS	t	\N	2025-06-24 04:33:46.862719	2025-06-24 04:33:46.862719
59	MOBILE_APP_ACCESS	t	\N	2025-06-24 04:37:11.892644	2025-06-24 04:37:11.892644
60	MOBILE_APP_ACCESS	t	\N	2025-06-24 04:43:22.903959	2025-06-24 04:43:22.903959
61	MOBILE_APP_ACCESS	t	\N	2025-06-24 04:52:42.134269	2025-06-24 04:52:42.134269
62	MOBILE_APP_ACCESS	t	\N	2025-06-24 05:13:37.964963	2025-06-24 05:13:37.964963
63	MOBILE_APP_ACCESS	t	\N	2025-06-24 05:17:53.818586	2025-06-24 05:17:53.818586
64	MOBILE_APP_ACCESS	t	\N	2025-06-24 05:20:39.841383	2025-06-24 05:20:39.841383
65	MOBILE_APP_ACCESS	t	\N	2025-06-24 05:33:54.207959	2025-06-24 05:33:54.207959
66	MOBILE_APP_ACCESS	t	\N	2025-06-24 05:44:19.192924	2025-06-24 05:44:19.192924
67	MOBILE_APP_ACCESS	t	\N	2025-06-24 05:45:30.133482	2025-06-24 05:45:30.133482
68	MOBILE_APP_ACCESS	t	\N	2025-06-24 05:59:46.217434	2025-06-24 05:59:46.217434
69	MOBILE_APP_ACCESS	t	\N	2025-06-24 06:01:11.762373	2025-06-24 06:01:11.762373
70	MOBILE_APP_ACCESS	t	\N	2025-06-24 06:19:14.979825	2025-06-24 06:19:14.979825
71	MOBILE_APP_ACCESS	t	\N	2025-06-24 06:20:11.055942	2025-06-24 06:20:11.055942
72	MOBILE_APP_ACCESS	t	\N	2025-06-24 06:20:57.70893	2025-06-24 06:20:57.70893
73	MOBILE_APP_ACCESS	t	\N	2025-06-24 14:37:55.494016	2025-06-24 14:37:55.494016
74	MOBILE_APP_ACCESS	t	\N	2025-06-24 14:42:27.046587	2025-06-24 14:42:27.046587
75	MOBILE_APP_ACCESS	t	\N	2025-06-24 15:27:36.593424	2025-06-24 15:27:36.593424
76	MOBILE_APP_ACCESS	t	\N	2025-06-24 16:03:05.104395	2025-06-24 16:03:05.104395
77	MOBILE_APP_ACCESS	t	\N	2025-06-24 16:11:42.244909	2025-06-24 16:11:42.244909
78	MOBILE_APP_ACCESS	t	\N	2025-06-24 16:23:54.983427	2025-06-24 16:23:54.983427
79	MOBILE_APP_ACCESS	t	\N	2025-06-24 16:24:35.575522	2025-06-24 16:24:35.575522
80	MOBILE_APP_ACCESS	t	\N	2025-06-24 16:25:10.720773	2025-06-24 16:25:10.720773
81	MOBILE_APP_ACCESS	t	\N	2025-06-24 16:25:55.719686	2025-06-24 16:25:55.719686
82	MOBILE_APP_ACCESS	t	\N	2025-06-24 16:35:51.339934	2025-06-24 16:35:51.339934
83	MOBILE_APP_ACCESS	t	\N	2025-06-24 16:36:55.429923	2025-06-24 16:36:55.429923
84	MOBILE_APP_ACCESS	t	\N	2025-06-24 16:42:11.115052	2025-06-24 16:42:11.115052
85	MOBILE_APP_ACCESS	t	\N	2025-06-24 16:42:51.646345	2025-06-24 16:42:51.646345
86	MOBILE_APP_ACCESS	t	\N	2025-06-24 16:53:15.527232	2025-06-24 16:53:15.527232
87	MOBILE_APP_ACCESS	t	\N	2025-06-24 16:54:45.453389	2025-06-24 16:54:45.453389
88	MOBILE_APP_ACCESS	t	\N	2025-06-24 16:55:55.794883	2025-06-24 16:55:55.794883
89	MOBILE_APP_ACCESS	t	\N	2025-06-24 17:13:21.782472	2025-06-24 17:13:21.782472
90	MOBILE_APP_ACCESS	t	\N	2025-06-24 17:55:49.546775	2025-06-24 17:55:49.546775
91	MOBILE_APP_ACCESS	t	\N	2025-06-24 18:09:22.857749	2025-06-24 18:09:22.857749
92	MOBILE_APP_ACCESS	t	\N	2025-06-24 18:10:23.712203	2025-06-24 18:10:23.712203
93	MOBILE_APP_ACCESS	t	\N	2025-06-24 18:20:41.480142	2025-06-24 18:20:41.480142
94	MOBILE_APP_ACCESS	t	\N	2025-06-24 18:21:13.072609	2025-06-24 18:21:13.072609
95	MOBILE_APP_ACCESS	t	\N	2025-06-24 18:21:43.952682	2025-06-24 18:21:43.952682
96	MOBILE_APP_ACCESS	t	\N	2025-06-24 18:48:55.341251	2025-06-24 18:48:55.341251
97	MOBILE_APP_ACCESS	t	\N	2025-06-24 18:51:00.75349	2025-06-24 18:51:00.75349
98	MOBILE_APP_ACCESS	t	\N	2025-06-24 18:52:14.13458	2025-06-24 18:52:14.13458
99	MOBILE_APP_ACCESS	t	\N	2025-06-24 19:42:23.021905	2025-06-24 19:42:23.021905
100	MOBILE_APP_ACCESS	t	\N	2025-06-24 19:55:21.383509	2025-06-24 19:55:21.383509
101	MOBILE_APP_ACCESS	t	\N	2025-06-24 19:55:59.849898	2025-06-24 19:55:59.849898
102	MOBILE_APP_ACCESS	t	\N	2025-06-24 20:03:58.457104	2025-06-24 20:03:58.457104
103	MOBILE_APP_ACCESS	t	\N	2025-06-24 20:05:42.877252	2025-06-24 20:05:42.877252
104	MOBILE_APP_ACCESS	t	\N	2025-06-24 20:06:30.022619	2025-06-24 20:06:30.022619
105	MOBILE_APP_ACCESS	t	\N	2025-06-24 20:07:08.940251	2025-06-24 20:07:08.940251
106	MOBILE_APP_ACCESS	t	\N	2025-06-24 20:16:05.902527	2025-06-24 20:16:05.902527
107	MOBILE_APP_ACCESS	t	\N	2025-06-24 20:16:58.053849	2025-06-24 20:16:58.053849
108	MOBILE_APP_ACCESS	t	\N	2025-06-24 20:18:57.012937	2025-06-24 20:18:57.012937
109	MOBILE_APP_ACCESS	t	\N	2025-06-24 20:24:53.895143	2025-06-24 20:24:53.895143
110	MOBILE_APP_ACCESS	t	\N	2025-06-24 20:31:40.776272	2025-06-24 20:31:40.776272
111	MOBILE_APP_ACCESS	t	\N	2025-06-24 20:38:38.794397	2025-06-24 20:38:38.794397
112	MOBILE_APP_ACCESS	t	\N	2025-06-24 20:39:08.517837	2025-06-24 20:39:08.517837
113	MOBILE_APP_ACCESS	t	\N	2025-06-24 20:39:16.954175	2025-06-24 20:39:16.954175
114	MOBILE_APP_ACCESS	t	\N	2025-06-25 00:18:02.275271	2025-06-25 00:18:02.275271
115	MOBILE_APP_ACCESS	t	\N	2025-06-25 00:48:19.084961	2025-06-25 00:48:19.084961
116	MOBILE_APP_ACCESS	t	\N	2025-06-25 01:03:33.437529	2025-06-25 01:03:33.437529
117	MOBILE_APP_ACCESS	t	\N	2025-06-25 01:04:29.603746	2025-06-25 01:04:29.603746
118	MOBILE_APP_ACCESS	t	\N	2025-06-25 01:14:48.412838	2025-06-25 01:14:48.412838
119	MOBILE_APP_ACCESS	t	\N	2025-06-25 01:16:43.517859	2025-06-25 01:16:43.517859
120	MOBILE_APP_ACCESS	t	\N	2025-06-25 01:22:05.581297	2025-06-25 01:22:05.581297
121	MOBILE_APP_ACCESS	t	\N	2025-06-25 01:22:35.797564	2025-06-25 01:22:35.797564
122	MOBILE_APP_ACCESS	t	\N	2025-06-25 01:23:05.195137	2025-06-25 01:23:05.195137
123	MOBILE_APP_ACCESS	t	\N	2025-06-25 01:54:21.444849	2025-06-25 01:54:21.444849
124	MOBILE_APP_ACCESS	t	\N	2025-06-25 01:55:11.142219	2025-06-25 01:55:11.142219
125	MOBILE_APP_ACCESS	t	\N	2025-06-25 02:02:41.715771	2025-06-25 02:02:41.715771
126	MOBILE_APP_ACCESS	t	\N	2025-06-25 02:04:22.446858	2025-06-25 02:04:22.446858
127	MOBILE_APP_ACCESS	t	\N	2025-06-25 02:05:01.463768	2025-06-25 02:05:01.463768
128	MOBILE_APP_ACCESS	t	\N	2025-06-25 02:10:41.587364	2025-06-25 02:10:41.587364
129	MOBILE_APP_ACCESS	t	\N	2025-06-25 02:13:42.236891	2025-06-25 02:13:42.236891
130	MOBILE_APP_ACCESS	t	\N	2025-06-25 02:16:28.512643	2025-06-25 02:16:28.512643
131	MOBILE_APP_ACCESS	t	\N	2025-06-25 02:17:04.981653	2025-06-25 02:17:04.981653
132	MOBILE_APP_ACCESS	t	\N	2025-06-25 02:54:00.16107	2025-06-25 02:54:00.16107
133	MOBILE_APP_ACCESS	t	\N	2025-06-25 02:57:57.31126	2025-06-25 02:57:57.31126
134	MOBILE_APP_ACCESS	t	\N	2025-06-25 03:15:18.481132	2025-06-25 03:15:18.481132
135	MOBILE_APP_ACCESS	t	\N	2025-06-25 03:23:38.397118	2025-06-25 03:23:38.397118
136	MOBILE_APP_ACCESS	t	\N	2025-06-25 03:32:51.531299	2025-06-25 03:32:51.531299
137	MOBILE_APP_ACCESS	t	\N	2025-06-25 03:50:42.781962	2025-06-25 03:50:42.781962
138	MOBILE_APP_ACCESS	t	\N	2025-06-25 04:25:47.201744	2025-06-25 04:25:47.201744
139	MOBILE_APP_ACCESS	t	\N	2025-06-25 04:58:58.433435	2025-06-25 04:58:58.433435
140	MOBILE_APP_ACCESS	t	\N	2025-06-25 04:59:44.299015	2025-06-25 04:59:44.299015
141	MOBILE_APP_ACCESS	t	\N	2025-06-25 05:34:26.09191	2025-06-25 05:34:26.09191
142	MOBILE_APP_ACCESS	t	\N	2025-06-25 05:36:04.254659	2025-06-25 05:36:04.254659
143	MOBILE_APP_ACCESS	t	\N	2025-06-25 05:45:16.054335	2025-06-25 05:45:16.054335
144	MOBILE_APP_ACCESS	t	\N	2025-06-25 05:53:37.379332	2025-06-25 05:53:37.379332
145	MOBILE_APP_ACCESS	t	\N	2025-06-25 05:54:23.699324	2025-06-25 05:54:23.699324
146	MOBILE_APP_ACCESS	t	\N	2025-06-25 06:02:48.04564	2025-06-25 06:02:48.04564
147	MOBILE_APP_ACCESS	t	\N	2025-06-25 06:04:01.158502	2025-06-25 06:04:01.158502
148	MOBILE_APP_ACCESS	t	\N	2025-06-25 06:08:49.203168	2025-06-25 06:08:49.203168
149	MOBILE_APP_ACCESS	t	\N	2025-06-25 06:34:03.330299	2025-06-25 06:34:03.330299
150	MOBILE_APP_ACCESS	t	\N	2025-06-25 06:46:12.04518	2025-06-25 06:46:12.04518
151	MOBILE_APP_ACCESS	t	\N	2025-06-25 06:55:56.169241	2025-06-25 06:55:56.169241
152	MOBILE_APP_ACCESS	t	\N	2025-06-25 07:15:06.667444	2025-06-25 07:15:06.667444
153	MOBILE_APP_ACCESS	t	\N	2025-06-25 07:17:11.617468	2025-06-25 07:17:11.617468
154	MOBILE_APP_ACCESS	t	\N	2025-06-25 07:31:21.2681	2025-06-25 07:31:21.2681
155	MOBILE_APP_ACCESS	t	\N	2025-06-25 07:36:46.182431	2025-06-25 07:36:46.182431
156	MOBILE_APP_ACCESS	t	\N	2025-06-25 07:41:21.344981	2025-06-25 07:41:21.344981
157	MOBILE_APP_ACCESS	t	\N	2025-06-25 07:43:00.229109	2025-06-25 07:43:00.229109
158	MOBILE_APP_ACCESS	t	\N	2025-06-25 07:45:22.972695	2025-06-25 07:45:22.972695
159	MOBILE_APP_ACCESS	t	\N	2025-06-25 07:46:44.913723	2025-06-25 07:46:44.913723
160	MOBILE_APP_ACCESS	t	\N	2025-06-25 14:09:35.403718	2025-06-25 14:09:35.403718
161	MOBILE_APP_ACCESS	t	\N	2025-06-25 14:45:03.862956	2025-06-25 14:45:03.862956
162	MOBILE_APP_ACCESS	t	\N	2025-06-25 14:51:55.157937	2025-06-25 14:51:55.157937
163	MOBILE_APP_ACCESS	t	\N	2025-06-25 14:52:58.541569	2025-06-25 14:52:58.541569
164	MOBILE_APP_ACCESS	t	\N	2025-06-25 14:53:59.041038	2025-06-25 14:53:59.041038
165	MOBILE_APP_ACCESS	t	\N	2025-06-25 14:55:02.079557	2025-06-25 14:55:02.079557
166	MOBILE_APP_ACCESS	t	\N	2025-06-25 15:10:55.751909	2025-06-25 15:10:55.751909
167	MOBILE_APP_ACCESS	t	\N	2025-06-25 15:16:08.038279	2025-06-25 15:16:08.038279
168	MOBILE_APP_ACCESS	t	\N	2025-06-25 15:19:53.537945	2025-06-25 15:19:53.537945
169	MOBILE_APP_ACCESS	t	\N	2025-06-25 19:46:43.471151	2025-06-25 19:46:43.471151
170	MOBILE_APP_ACCESS	t	\N	2025-06-25 19:55:33.850127	2025-06-25 19:55:33.850127
171	MOBILE_APP_ACCESS	t	\N	2025-06-25 19:59:08.427485	2025-06-25 19:59:08.427485
172	MOBILE_APP_ACCESS	t	\N	2025-06-25 20:08:57.332588	2025-06-25 20:08:57.332588
173	MOBILE_APP_ACCESS	t	\N	2025-06-25 20:25:22.178843	2025-06-25 20:25:22.178843
174	MOBILE_APP_ACCESS	t	\N	2025-06-25 21:23:38.47808	2025-06-25 21:23:38.47808
175	MOBILE_APP_ACCESS	t	\N	2025-06-25 21:46:29.068229	2025-06-25 21:46:29.068229
176	MOBILE_APP_ACCESS	t	\N	2025-06-25 22:44:46.941039	2025-06-25 22:44:46.941039
177	MOBILE_APP_ACCESS	t	\N	2025-06-25 23:17:51.334358	2025-06-25 23:17:51.334358
178	MOBILE_APP_ACCESS	t	\N	2025-06-25 23:42:36.310755	2025-06-25 23:42:36.310755
179	MOBILE_APP_ACCESS	t	\N	2025-06-25 23:45:44.551071	2025-06-25 23:45:44.551071
180	MOBILE_APP_ACCESS	t	\N	2025-06-25 23:46:16.531967	2025-06-25 23:46:16.531967
181	MOBILE_APP_ACCESS	t	\N	2025-06-25 23:52:33.778784	2025-06-25 23:52:33.778784
182	MOBILE_APP_ACCESS	t	\N	2025-06-26 00:04:29.893762	2025-06-26 00:04:29.893762
183	MOBILE_APP_ACCESS	t	\N	2025-06-26 03:42:53.81666	2025-06-26 03:42:53.81666
184	MOBILE_APP_ACCESS	t	\N	2025-06-26 04:19:12.011285	2025-06-26 04:19:12.011285
185	MOBILE_APP_ACCESS	t	\N	2025-06-26 04:42:46.654237	2025-06-26 04:42:46.654237
186	MOBILE_APP_ACCESS	t	\N	2025-06-26 05:17:25.984749	2025-06-26 05:17:25.984749
187	MOBILE_APP_ACCESS	t	\N	2025-06-26 05:51:12.622967	2025-06-26 05:51:12.622967
188	MOBILE_APP_ACCESS	t	\N	2025-06-26 06:42:35.971187	2025-06-26 06:42:35.971187
189	MOBILE_APP_ACCESS	t	\N	2025-06-26 06:45:37.644112	2025-06-26 06:45:37.644112
190	MOBILE_APP_ACCESS	t	\N	2025-06-26 06:48:26.152409	2025-06-26 06:48:26.152409
191	MOBILE_APP_ACCESS	t	\N	2025-06-26 14:45:32.880583	2025-06-26 14:45:32.880583
192	MOBILE_APP_ACCESS	t	\N	2025-06-27 02:02:46.359109	2025-06-27 02:02:46.359109
193	MOBILE_APP_ACCESS	t	\N	2025-06-27 04:02:06.858068	2025-06-27 04:02:06.858068
194	MOBILE_APP_ACCESS	t	\N	2025-06-27 05:12:53.155532	2025-06-27 05:12:53.155532
195	MOBILE_APP_ACCESS	t	\N	2025-06-27 05:41:57.33928	2025-06-27 05:41:57.33928
196	MOBILE_APP_ACCESS	t	\N	2025-06-27 05:42:40.959009	2025-06-27 05:42:40.959009
197	MOBILE_APP_ACCESS	t	\N	2025-06-27 05:45:35.96548	2025-06-27 05:45:35.96548
198	MOBILE_APP_ACCESS	t	\N	2025-06-27 05:46:25.876412	2025-06-27 05:46:25.876412
199	MOBILE_APP_ACCESS	t	\N	2025-06-27 20:00:14.85901	2025-06-27 20:00:14.85901
200	MOBILE_APP_ACCESS	t	\N	2025-06-27 20:05:13.669662	2025-06-27 20:05:13.669662
201	MOBILE_APP_ACCESS	t	\N	2025-06-27 20:10:06.346749	2025-06-27 20:10:06.346749
202	MOBILE_APP_ACCESS	t	\N	2025-06-27 20:19:41.823966	2025-06-27 20:19:41.823966
203	MOBILE_APP_ACCESS	t	\N	2025-06-27 20:20:44.913291	2025-06-27 20:20:44.913291
204	MOBILE_APP_ACCESS	t	\N	2025-06-27 20:21:18.89851	2025-06-27 20:21:18.89851
205	MOBILE_APP_ACCESS	t	\N	2025-06-27 20:27:43.168984	2025-06-27 20:27:43.168984
206	MOBILE_APP_ACCESS	t	\N	2025-06-27 20:29:49.654619	2025-06-27 20:29:49.654619
207	MOBILE_APP_ACCESS	t	\N	2025-06-28 03:31:45.484885	2025-06-28 03:31:45.484885
208	MOBILE_APP_ACCESS	t	\N	2025-06-28 03:40:19.955918	2025-06-28 03:40:19.955918
209	MOBILE_APP_ACCESS	t	\N	2025-06-28 04:03:18.568248	2025-06-28 04:03:18.568248
210	MOBILE_APP_ACCESS	t	\N	2025-06-28 04:07:55.344944	2025-06-28 04:07:55.344944
211	MOBILE_APP_ACCESS	t	\N	2025-06-28 04:10:23.74748	2025-06-28 04:10:23.74748
212	MOBILE_APP_ACCESS	t	\N	2025-06-28 04:27:49.613824	2025-06-28 04:27:49.613824
213	MOBILE_APP_ACCESS	t	\N	2025-06-28 04:28:57.440195	2025-06-28 04:28:57.440195
214	MOBILE_APP_ACCESS	t	\N	2025-06-28 04:46:40.415129	2025-06-28 04:46:40.415129
215	MOBILE_APP_ACCESS	t	\N	2025-06-28 04:51:41.409036	2025-06-28 04:51:41.409036
216	MOBILE_APP_ACCESS	t	\N	2025-06-28 05:01:22.252834	2025-06-28 05:01:22.252834
217	MOBILE_APP_ACCESS	t	\N	2025-06-28 05:14:43.909599	2025-06-28 05:14:43.909599
218	MOBILE_APP_ACCESS	t	\N	2025-06-28 05:17:25.728225	2025-06-28 05:17:25.728225
219	MOBILE_APP_ACCESS	t	\N	2025-06-28 05:30:31.823831	2025-06-28 05:30:31.823831
220	MOBILE_APP_ACCESS	t	\N	2025-06-28 05:48:24.933552	2025-06-28 05:48:24.933552
221	MOBILE_APP_ACCESS	t	\N	2025-06-28 05:50:10.903195	2025-06-28 05:50:10.903195
222	MOBILE_APP_ACCESS	t	\N	2025-06-28 05:51:28.441283	2025-06-28 05:51:28.441283
223	MOBILE_APP_ACCESS	t	\N	2025-06-28 06:05:09.145675	2025-06-28 06:05:09.145675
224	MOBILE_APP_ACCESS	t	\N	2025-06-28 06:06:12.469801	2025-06-28 06:06:12.469801
225	MOBILE_APP_ACCESS	t	\N	2025-06-28 16:53:36.750985	2025-06-28 16:53:36.750985
226	MOBILE_APP_ACCESS	t	\N	2025-06-28 19:31:20.854228	2025-06-28 19:31:20.854228
227	MOBILE_APP_ACCESS	t	\N	2025-07-01 22:47:18.594383	2025-07-01 22:47:18.594383
228	MOBILE_APP_ACCESS	t	\N	2025-07-02 00:20:55.567005	2025-07-02 00:20:55.567005
229	MOBILE_APP_ACCESS	t	\N	2025-07-02 00:31:49.061654	2025-07-02 00:31:49.061654
230	MOBILE_APP_ACCESS	t	\N	2025-07-02 00:36:55.569748	2025-07-02 00:36:55.569748
231	MOBILE_APP_ACCESS	t	\N	2025-07-02 00:37:25.982952	2025-07-02 00:37:25.982952
232	MOBILE_APP_ACCESS	t	\N	2025-07-02 00:41:47.720737	2025-07-02 00:41:47.720737
233	MOBILE_APP_ACCESS	t	\N	2025-07-02 00:50:18.264511	2025-07-02 00:50:18.264511
234	MOBILE_APP_ACCESS	t	\N	2025-07-02 00:51:48.337045	2025-07-02 00:51:48.337045
235	MOBILE_APP_ACCESS	t	\N	2025-07-02 00:53:02.194394	2025-07-02 00:53:02.194394
236	MOBILE_APP_ACCESS	t	\N	2025-07-02 01:03:47.978057	2025-07-02 01:03:47.978057
237	MOBILE_APP_ACCESS	t	\N	2025-07-02 01:05:08.758337	2025-07-02 01:05:08.758337
238	MOBILE_APP_ACCESS	t	\N	2025-07-02 05:04:59.050176	2025-07-02 05:04:59.050176
239	MOBILE_APP_ACCESS	t	\N	2025-07-02 05:13:18.293204	2025-07-02 05:13:18.293204
240	MOBILE_APP_ACCESS	t	\N	2025-07-02 05:37:55.69046	2025-07-02 05:37:55.69046
241	MOBILE_APP_ACCESS	t	\N	2025-07-02 05:40:45.942516	2025-07-02 05:40:45.942516
242	MOBILE_APP_ACCESS	t	\N	2025-07-02 18:16:12.501218	2025-07-02 18:16:12.501218
243	MOBILE_APP_ACCESS	t	\N	2025-07-02 18:24:36.680541	2025-07-02 18:24:36.680541
244	MOBILE_APP_ACCESS	t	\N	2025-07-02 18:45:14.796375	2025-07-02 18:45:14.796375
245	MOBILE_APP_ACCESS	t	\N	2025-07-02 20:06:38.142856	2025-07-02 20:06:38.142856
246	MOBILE_APP_ACCESS	t	\N	2025-07-02 21:33:05.609708	2025-07-02 21:33:05.609708
247	MOBILE_APP_ACCESS	t	\N	2025-07-02 21:33:54.033696	2025-07-02 21:33:54.033696
248	MOBILE_APP_ACCESS	t	\N	2025-07-02 21:35:43.87475	2025-07-02 21:35:43.87475
249	MOBILE_APP_ACCESS	t	\N	2025-07-02 22:28:10.171407	2025-07-02 22:28:10.171407
250	MOBILE_APP_ACCESS	t	\N	2025-07-02 22:39:57.236258	2025-07-02 22:39:57.236258
251	MOBILE_APP_ACCESS	t	\N	2025-07-02 23:55:38.80091	2025-07-02 23:55:38.80091
252	MOBILE_APP_ACCESS	t	\N	2025-07-03 00:11:51.562116	2025-07-03 00:11:51.562116
253	MOBILE_APP_ACCESS	t	\N	2025-07-03 00:17:13.48861	2025-07-03 00:17:13.48861
254	MOBILE_APP_ACCESS	t	\N	2025-07-03 00:21:14.439838	2025-07-03 00:21:14.439838
255	MOBILE_APP_ACCESS	t	\N	2025-07-03 06:41:33.907684	2025-07-03 06:41:33.907684
256	MOBILE_APP_ACCESS	t	\N	2025-07-05 22:23:43.160042	2025-07-05 22:23:43.160042
257	MOBILE_APP_ACCESS	t	\N	2025-07-06 01:31:19.378142	2025-07-06 01:31:19.378142
258	MOBILE_APP_ACCESS	t	\N	2025-07-06 02:11:35.480873	2025-07-06 02:11:35.480873
259	MOBILE_APP_ACCESS	t	\N	2025-07-06 02:20:32.471098	2025-07-06 02:20:32.471098
260	MOBILE_APP_ACCESS	t	\N	2025-07-06 02:21:17.921032	2025-07-06 02:21:17.921032
261	MOBILE_APP_ACCESS	t	\N	2025-07-06 04:22:51.328642	2025-07-06 04:22:51.328642
262	MOBILE_APP_ACCESS	t	\N	2025-07-06 04:34:02.383974	2025-07-06 04:34:02.383974
263	MOBILE_APP_ACCESS	t	\N	2025-07-06 04:45:19.785784	2025-07-06 04:45:19.785784
264	MOBILE_APP_ACCESS	t	\N	2025-07-06 04:54:33.681711	2025-07-06 04:54:33.681711
265	MOBILE_APP_ACCESS	t	\N	2025-07-06 05:07:39.220889	2025-07-06 05:07:39.220889
266	MOBILE_APP_ACCESS	t	\N	2025-07-06 07:38:28.720201	2025-07-06 07:38:28.720201
267	MOBILE_APP_ACCESS	t	\N	2025-07-06 17:28:06.379926	2025-07-06 17:28:06.379926
268	MOBILE_APP_ACCESS	t	\N	2025-07-06 21:16:33.09383	2025-07-06 21:16:33.09383
269	MOBILE_APP_ACCESS	t	\N	2025-07-06 21:35:53.040097	2025-07-06 21:35:53.040097
270	MOBILE_APP_ACCESS	t	\N	2025-07-06 21:37:57.064584	2025-07-06 21:37:57.064584
271	MOBILE_APP_ACCESS	t	\N	2025-07-06 21:59:05.234948	2025-07-06 21:59:05.234948
272	MOBILE_APP_ACCESS	t	\N	2025-07-06 22:15:11.172872	2025-07-06 22:15:11.172872
273	MOBILE_APP_ACCESS	t	\N	2025-07-06 23:06:04.484632	2025-07-06 23:06:04.484632
274	MOBILE_APP_ACCESS	t	\N	2025-07-06 23:14:10.997682	2025-07-06 23:14:10.997682
275	MOBILE_APP_ACCESS	t	\N	2025-07-06 23:22:45.32984	2025-07-06 23:22:45.32984
276	MOBILE_APP_ACCESS	t	\N	2025-07-06 23:27:35.580772	2025-07-06 23:27:35.580772
277	MOBILE_APP_ACCESS	t	\N	2025-07-07 01:17:38.166189	2025-07-07 01:17:38.166189
278	MOBILE_APP_ACCESS	t	\N	2025-07-07 03:21:48.298947	2025-07-07 03:21:48.298947
279	MOBILE_APP_ACCESS	t	\N	2025-07-07 03:47:53.889833	2025-07-07 03:47:53.889833
280	MOBILE_APP_ACCESS	t	\N	2025-07-07 03:48:59.369413	2025-07-07 03:48:59.369413
281	MOBILE_APP_ACCESS	t	\N	2025-07-07 04:40:54.719687	2025-07-07 04:40:54.719687
282	MOBILE_APP_ACCESS	t	\N	2025-07-07 05:07:42.025488	2025-07-07 05:07:42.025488
283	MOBILE_APP_ACCESS	t	\N	2025-07-07 06:09:09.499314	2025-07-07 06:09:09.499314
284	MOBILE_APP_ACCESS	t	\N	2025-07-07 06:10:05.096622	2025-07-07 06:10:05.096622
285	MOBILE_APP_ACCESS	t	\N	2025-07-07 06:37:55.799206	2025-07-07 06:37:55.799206
286	MOBILE_APP_ACCESS	t	\N	2025-07-07 06:51:53.278538	2025-07-07 06:51:53.278538
287	MOBILE_APP_ACCESS	t	\N	2025-07-07 07:01:48.325927	2025-07-07 07:01:48.325927
288	MOBILE_APP_ACCESS	t	\N	2025-07-07 07:04:15.335809	2025-07-07 07:04:15.335809
289	MOBILE_APP_ACCESS	t	\N	2025-07-07 07:05:34.814615	2025-07-07 07:05:34.814615
290	MOBILE_APP_ACCESS	t	\N	2025-07-07 11:57:16.077733	2025-07-07 11:57:16.077733
291	MOBILE_APP_ACCESS	t	\N	2025-07-07 12:00:00.968516	2025-07-07 12:00:00.968516
292	MOBILE_APP_ACCESS	t	\N	2025-07-07 12:04:29.555719	2025-07-07 12:04:29.555719
293	MOBILE_APP_ACCESS	t	\N	2025-07-07 12:19:03.914116	2025-07-07 12:19:03.914116
294	MOBILE_APP_ACCESS	t	\N	2025-07-07 12:23:28.701813	2025-07-07 12:23:28.701813
295	MOBILE_APP_ACCESS	t	\N	2025-07-07 12:32:26.390538	2025-07-07 12:32:26.390538
296	MOBILE_APP_ACCESS	t	\N	2025-07-07 12:52:03.848572	2025-07-07 12:52:03.848572
297	MOBILE_APP_ACCESS	t	\N	2025-07-07 12:54:50.77804	2025-07-07 12:54:50.77804
298	MOBILE_APP_ACCESS	t	\N	2025-07-07 13:26:42.312277	2025-07-07 13:26:42.312277
299	MOBILE_APP_ACCESS	t	\N	2025-07-08 04:56:29.882516	2025-07-08 04:56:29.882516
300	MOBILE_APP_ACCESS	t	\N	2025-07-08 05:04:12.740696	2025-07-08 05:04:12.740696
301	MOBILE_APP_ACCESS	t	\N	2025-07-08 05:26:36.369503	2025-07-08 05:26:36.369503
302	MOBILE_APP_ACCESS	t	\N	2025-07-08 05:27:14.056132	2025-07-08 05:27:14.056132
303	MOBILE_APP_ACCESS	t	\N	2025-07-08 05:27:24.944754	2025-07-08 05:27:24.944754
304	MOBILE_APP_ACCESS	t	\N	2025-07-08 05:30:52.494131	2025-07-08 05:30:52.494131
305	MOBILE_APP_ACCESS	t	\N	2025-07-08 05:42:43.624367	2025-07-08 05:42:43.624367
306	MOBILE_APP_ACCESS	t	\N	2025-07-08 06:56:01.442799	2025-07-08 06:56:01.442799
307	MOBILE_APP_ACCESS	t	\N	2025-07-08 15:51:19.718854	2025-07-08 15:51:19.718854
308	MOBILE_APP_ACCESS	t	\N	2025-07-08 16:44:40.4301	2025-07-08 16:44:40.4301
309	MOBILE_APP_ACCESS	t	\N	2025-07-08 18:17:21.308967	2025-07-08 18:17:21.308967
310	MOBILE_APP_ACCESS	t	\N	2025-07-08 18:22:59.140751	2025-07-08 18:22:59.140751
311	MOBILE_APP_ACCESS	t	\N	2025-07-08 18:24:03.478668	2025-07-08 18:24:03.478668
312	MOBILE_APP_ACCESS	t	\N	2025-07-08 19:33:55.204898	2025-07-08 19:33:55.204898
313	MOBILE_APP_ACCESS	t	\N	2025-07-08 19:48:26.843642	2025-07-08 19:48:26.843642
314	MOBILE_APP_ACCESS	t	\N	2025-07-08 19:53:43.627822	2025-07-08 19:53:43.627822
315	MOBILE_APP_ACCESS	t	\N	2025-07-08 19:58:09.047771	2025-07-08 19:58:09.047771
316	MOBILE_APP_ACCESS	t	\N	2025-07-08 21:58:54.11373	2025-07-08 21:58:54.11373
317	MOBILE_APP_ACCESS	t	\N	2025-07-08 22:06:55.52992	2025-07-08 22:06:55.52992
318	MOBILE_APP_ACCESS	t	\N	2025-07-08 22:10:07.805455	2025-07-08 22:10:07.805455
319	MOBILE_APP_ACCESS	t	\N	2025-07-08 22:13:50.861669	2025-07-08 22:13:50.861669
320	MOBILE_APP_ACCESS	t	\N	2025-07-08 22:16:14.504724	2025-07-08 22:16:14.504724
321	MOBILE_APP_ACCESS	t	\N	2025-07-08 22:17:17.097975	2025-07-08 22:17:17.097975
322	MOBILE_APP_ACCESS	t	\N	2025-07-08 22:17:44.113602	2025-07-08 22:17:44.113602
323	MOBILE_APP_ACCESS	t	\N	2025-07-08 22:19:56.896522	2025-07-08 22:19:56.896522
324	MOBILE_APP_ACCESS	t	\N	2025-07-08 22:20:53.529678	2025-07-08 22:20:53.529678
325	MOBILE_APP_ACCESS	t	\N	2025-07-08 22:23:13.810305	2025-07-08 22:23:13.810305
326	MOBILE_APP_ACCESS	t	\N	2025-07-08 22:23:28.866029	2025-07-08 22:23:28.866029
327	MOBILE_APP_ACCESS	t	\N	2025-07-08 22:25:01.1312	2025-07-08 22:25:01.1312
328	MOBILE_APP_ACCESS	t	\N	2025-07-08 23:16:45.398262	2025-07-08 23:16:45.398262
329	MOBILE_APP_ACCESS	t	\N	2025-07-08 23:24:53.371658	2025-07-08 23:24:53.371658
330	MOBILE_APP_ACCESS	t	\N	2025-07-08 23:25:07.060486	2025-07-08 23:25:07.060486
331	MOBILE_APP_ACCESS	t	\N	2025-07-08 23:31:40.971156	2025-07-08 23:31:40.971156
332	MOBILE_APP_ACCESS	t	\N	2025-07-08 23:33:57.681294	2025-07-08 23:33:57.681294
333	MOBILE_APP_ACCESS	t	\N	2025-07-08 23:37:50.946453	2025-07-08 23:37:50.946453
334	MOBILE_APP_ACCESS	t	\N	2025-07-08 23:38:21.15093	2025-07-08 23:38:21.15093
335	MOBILE_APP_ACCESS	t	\N	2025-07-09 06:50:22.614517	2025-07-09 06:50:22.614517
336	MOBILE_APP_ACCESS	t	\N	2025-07-09 07:19:46.770586	2025-07-09 07:19:46.770586
337	MOBILE_APP_ACCESS	t	\N	2025-07-09 16:43:40.406162	2025-07-09 16:43:40.406162
338	MOBILE_APP_ACCESS	t	\N	2025-07-09 19:36:35.170819	2025-07-09 19:36:35.170819
339	MOBILE_APP_ACCESS	t	\N	2025-07-09 20:16:09.653618	2025-07-09 20:16:09.653618
340	MOBILE_APP_ACCESS	t	\N	2025-07-09 20:19:47.637102	2025-07-09 20:19:47.637102
341	MOBILE_APP_ACCESS	t	\N	2025-07-09 20:24:12.117547	2025-07-09 20:24:12.117547
342	MOBILE_APP_ACCESS	t	\N	2025-07-09 20:26:53.660199	2025-07-09 20:26:53.660199
343	MOBILE_APP_ACCESS	t	\N	2025-07-09 21:29:19.901549	2025-07-09 21:29:19.901549
344	MOBILE_APP_ACCESS	t	\N	2025-07-09 21:55:15.773317	2025-07-09 21:55:15.773317
345	MOBILE_APP_ACCESS	t	\N	2025-07-09 21:58:27.712642	2025-07-09 21:58:27.712642
346	MOBILE_APP_ACCESS	t	\N	2025-07-09 22:36:17.38174	2025-07-09 22:36:17.38174
347	MOBILE_APP_ACCESS	t	\N	2025-07-10 00:05:54.785282	2025-07-10 00:05:54.785282
348	MOBILE_APP_ACCESS	t	\N	2025-07-10 04:15:01.271124	2025-07-10 04:15:01.271124
349	MOBILE_APP_ACCESS	t	\N	2025-07-10 04:32:39.649483	2025-07-10 04:32:39.649483
350	MOBILE_APP_ACCESS	t	\N	2025-07-10 05:19:20.202144	2025-07-10 05:19:20.202144
351	MOBILE_APP_ACCESS	t	\N	2025-07-10 05:21:31.334378	2025-07-10 05:21:31.334378
352	MOBILE_APP_ACCESS	t	\N	2025-07-10 05:22:07.116437	2025-07-10 05:22:07.116437
353	MOBILE_APP_ACCESS	t	\N	2025-07-10 15:40:54.75351	2025-07-10 15:40:54.75351
354	MOBILE_APP_ACCESS	t	\N	2025-07-10 16:06:03.395413	2025-07-10 16:06:03.395413
355	MOBILE_APP_ACCESS	t	\N	2025-07-10 16:09:05.250621	2025-07-10 16:09:05.250621
356	MOBILE_APP_ACCESS	t	\N	2025-07-10 16:21:47.36348	2025-07-10 16:21:47.36348
357	MOBILE_APP_ACCESS	t	\N	2025-07-10 17:03:25.864439	2025-07-10 17:03:25.864439
358	MOBILE_APP_ACCESS	t	\N	2025-07-10 17:03:25.931558	2025-07-10 17:03:25.931558
359	MOBILE_APP_ACCESS	t	\N	2025-07-10 17:03:32.162413	2025-07-10 17:03:32.162413
360	MOBILE_APP_ACCESS	t	\N	2025-07-10 17:03:45.082925	2025-07-10 17:03:45.082925
361	MOBILE_APP_ACCESS	t	\N	2025-07-10 17:03:49.450847	2025-07-10 17:03:49.450847
362	MOBILE_APP_ACCESS	t	\N	2025-07-10 17:20:22.453054	2025-07-10 17:20:22.453054
363	MOBILE_APP_ACCESS	t	\N	2025-07-10 21:58:20.874709	2025-07-10 21:58:20.874709
364	MOBILE_APP_ACCESS	t	\N	2025-07-10 22:14:22.485639	2025-07-10 22:14:22.485639
365	MOBILE_APP_ACCESS	t	\N	2025-07-11 03:02:18.542456	2025-07-11 03:02:18.542456
366	MOBILE_APP_ACCESS	t	\N	2025-07-11 07:55:10.778932	2025-07-11 07:55:10.778932
367	MOBILE_APP_ACCESS	t	\N	2025-07-11 16:28:45.268965	2025-07-11 16:28:45.268965
368	MOBILE_APP_ACCESS	t	\N	2025-07-11 17:34:17.137853	2025-07-11 17:34:17.137853
369	MOBILE_APP_ACCESS	t	\N	2025-07-11 17:57:59.779643	2025-07-11 17:57:59.779643
370	MOBILE_APP_ACCESS	t	\N	2025-07-12 01:52:19.352624	2025-07-12 01:52:19.352624
371	MOBILE_APP_ACCESS	t	\N	2025-07-12 03:04:00.122788	2025-07-12 03:04:00.122788
372	MOBILE_APP_ACCESS	t	\N	2025-07-12 04:25:41.892959	2025-07-12 04:25:41.892959
373	MOBILE_APP_ACCESS	t	\N	2025-07-12 04:29:08.047417	2025-07-12 04:29:08.047417
374	MOBILE_APP_ACCESS	t	\N	2025-07-12 04:30:08.790652	2025-07-12 04:30:08.790652
375	MOBILE_APP_ACCESS	t	\N	2025-07-12 04:45:01.834075	2025-07-12 04:45:01.834075
376	MOBILE_APP_ACCESS	t	\N	2025-07-12 04:46:30.791342	2025-07-12 04:46:30.791342
377	MOBILE_APP_ACCESS	t	\N	2025-07-12 04:56:58.672967	2025-07-12 04:56:58.672967
378	MOBILE_APP_ACCESS	t	\N	2025-07-12 05:03:26.313733	2025-07-12 05:03:26.313733
379	MOBILE_APP_ACCESS	t	\N	2025-07-12 05:04:29.340849	2025-07-12 05:04:29.340849
380	MOBILE_APP_ACCESS	t	\N	2025-07-12 05:10:54.236047	2025-07-12 05:10:54.236047
381	MOBILE_APP_ACCESS	t	\N	2025-07-12 05:17:17.733712	2025-07-12 05:17:17.733712
382	MOBILE_APP_ACCESS	t	\N	2025-07-12 05:21:49.173516	2025-07-12 05:21:49.173516
383	MOBILE_APP_ACCESS	t	\N	2025-07-12 18:24:04.441439	2025-07-12 18:24:04.441439
384	MOBILE_APP_ACCESS	t	\N	2025-07-17 18:34:22.931993	2025-07-17 18:34:22.931993
385	MOBILE_APP_ACCESS	t	\N	2025-07-17 18:37:42.468957	2025-07-17 18:37:42.468957
386	MOBILE_APP_ACCESS	t	\N	2025-07-27 18:04:11.94591	2025-07-27 18:04:11.94591
387	MOBILE_APP_ACCESS	t	\N	2025-08-16 18:25:52.814405	2025-08-16 18:25:52.814405
388	MOBILE_APP_ACCESS	t	\N	2025-08-16 18:30:16.993474	2025-08-16 18:30:16.993474
389	MOBILE_APP_ACCESS	t	\N	2025-08-16 19:26:15.840016	2025-08-16 19:26:15.840016
390	MOBILE_APP_ACCESS	t	\N	2025-09-13 04:55:14.631631	2025-09-13 04:55:14.631631
391	MOBILE_APP_ACCESS	t	\N	2025-09-13 17:23:37.422188	2025-09-13 17:23:37.422188
392	MOBILE_APP_ACCESS	t	\N	2025-09-13 17:26:59.600633	2025-09-13 17:26:59.600633
393	MOBILE_APP_ACCESS	t	\N	2025-09-13 17:56:55.28505	2025-09-13 17:56:55.28505
394	MOBILE_APP_ACCESS	t	\N	2025-09-13 18:11:38.673601	2025-09-13 18:11:38.673601
395	MOBILE_APP_ACCESS	t	\N	2025-09-13 18:26:25.416418	2025-09-13 18:26:25.416418
396	MOBILE_APP_ACCESS	t	\N	2025-09-13 18:38:18.690768	2025-09-13 18:38:18.690768
397	MOBILE_APP_ACCESS	t	\N	2025-09-13 20:32:47.618199	2025-09-13 20:32:47.618199
398	MOBILE_APP_ACCESS	t	\N	2025-09-13 21:45:48.832222	2025-09-13 21:45:48.832222
399	MOBILE_APP_ACCESS	t	\N	2025-09-14 01:01:10.167472	2025-09-14 01:01:10.167472
400	MOBILE_APP_ACCESS	t	\N	2025-09-14 01:07:29.616176	2025-09-14 01:07:29.616176
401	MOBILE_APP_ACCESS	t	\N	2025-09-14 01:24:17.767547	2025-09-14 01:24:17.767547
402	MOBILE_APP_ACCESS	t	\N	2025-09-14 01:44:44.478855	2025-09-14 01:44:44.478855
403	MOBILE_APP_ACCESS	t	\N	2025-09-14 03:29:26.842506	2025-09-14 03:29:26.842506
404	MOBILE_APP_ACCESS	t	\N	2025-09-14 03:31:00.459914	2025-09-14 03:31:00.459914
405	MOBILE_APP_ACCESS	t	\N	2025-09-14 04:49:07.394523	2025-09-14 04:49:07.394523
406	MOBILE_APP_ACCESS	t	\N	2025-09-14 22:56:35.033792	2025-09-14 22:56:35.033792
407	MOBILE_APP_ACCESS	t	\N	2025-09-15 00:49:56.340584	2025-09-15 00:49:56.340584
408	MOBILE_APP_ACCESS	t	\N	2025-09-15 00:52:10.888118	2025-09-15 00:52:10.888118
409	MOBILE_APP_ACCESS	t	\N	2025-09-15 01:01:34.891471	2025-09-15 01:01:34.891471
410	MOBILE_APP_ACCESS	t	\N	2025-09-15 01:04:04.978375	2025-09-15 01:04:04.978375
411	MOBILE_APP_ACCESS	t	\N	2025-09-15 01:04:44.352944	2025-09-15 01:04:44.352944
412	MOBILE_APP_ACCESS	t	\N	2025-09-15 01:05:03.432309	2025-09-15 01:05:03.432309
413	MOBILE_APP_ACCESS	t	\N	2025-09-15 01:41:19.752262	2025-09-15 01:41:19.752262
414	MOBILE_APP_ACCESS	t	\N	2025-09-15 01:46:29.289071	2025-09-15 01:46:29.289071
415	MOBILE_APP_ACCESS	t	\N	2025-09-15 01:47:28.466771	2025-09-15 01:47:28.466771
416	MOBILE_APP_ACCESS	t	\N	2025-09-15 01:54:03.831542	2025-09-15 01:54:03.831542
417	MOBILE_APP_ACCESS	t	\N	2025-09-15 15:30:50.537981	2025-09-15 15:30:50.537981
418	MOBILE_APP_ACCESS	t	\N	2025-09-15 15:41:30.821276	2025-09-15 15:41:30.821276
419	MOBILE_APP_ACCESS	t	\N	2025-09-15 15:56:03.369734	2025-09-15 15:56:03.369734
420	MOBILE_APP_ACCESS	t	\N	2025-09-15 15:58:08.718369	2025-09-15 15:58:08.718369
421	MOBILE_APP_ACCESS	t	\N	2025-09-15 17:02:50.363618	2025-09-15 17:02:50.363618
422	MOBILE_APP_ACCESS	t	\N	2025-09-15 17:10:17.374899	2025-09-15 17:10:17.374899
423	MOBILE_APP_ACCESS	t	\N	2025-09-15 17:27:59.832519	2025-09-15 17:27:59.832519
424	MOBILE_APP_ACCESS	t	\N	2025-09-15 17:29:46.248074	2025-09-15 17:29:46.248074
425	MOBILE_APP_ACCESS	t	\N	2025-09-15 17:31:37.003204	2025-09-15 17:31:37.003204
426	MOBILE_APP_ACCESS	t	\N	2025-09-15 18:05:31.666651	2025-09-15 18:05:31.666651
427	MOBILE_APP_ACCESS	t	\N	2025-09-15 21:21:28.244325	2025-09-15 21:21:28.244325
428	MOBILE_APP_ACCESS	t	\N	2025-09-15 21:25:42.396041	2025-09-15 21:25:42.396041
429	MOBILE_APP_ACCESS	t	\N	2025-09-15 21:31:29.470073	2025-09-15 21:31:29.470073
430	MOBILE_APP_ACCESS	t	\N	2025-09-15 21:34:04.239436	2025-09-15 21:34:04.239436
431	MOBILE_APP_ACCESS	t	\N	2025-09-16 00:03:24.823649	2025-09-16 00:03:24.823649
432	MOBILE_APP_ACCESS	t	\N	2025-09-16 00:04:52.31854	2025-09-16 00:04:52.31854
433	MOBILE_APP_ACCESS	t	\N	2025-09-16 02:54:45.683212	2025-09-16 02:54:45.683212
434	MOBILE_APP_ACCESS	t	\N	2025-09-16 03:58:36.865284	2025-09-16 03:58:36.865284
435	MOBILE_APP_ACCESS	t	\N	2025-09-16 04:31:33.169033	2025-09-16 04:31:33.169033
436	MOBILE_APP_ACCESS	t	\N	2025-09-16 05:01:14.13054	2025-09-16 05:01:14.13054
437	MOBILE_APP_ACCESS	t	\N	2025-09-16 05:13:57.551503	2025-09-16 05:13:57.551503
438	MOBILE_APP_ACCESS	t	\N	2025-09-16 05:15:32.201143	2025-09-16 05:15:32.201143
439	MOBILE_APP_ACCESS	t	\N	2025-09-16 05:50:00.594294	2025-09-16 05:50:00.594294
440	MOBILE_APP_ACCESS	t	\N	2025-09-16 16:35:04.16452	2025-09-16 16:35:04.16452
441	MOBILE_APP_ACCESS	t	\N	2025-09-16 16:55:52.753529	2025-09-16 16:55:52.753529
442	MOBILE_APP_ACCESS	t	\N	2025-09-16 17:48:52.295414	2025-09-16 17:48:52.295414
443	MOBILE_APP_ACCESS	t	\N	2025-09-16 23:39:02.221571	2025-09-16 23:39:02.221571
444	MOBILE_APP_ACCESS	t	\N	2025-09-16 23:58:46.467393	2025-09-16 23:58:46.467393
445	MOBILE_APP_ACCESS	t	\N	2025-09-17 00:09:23.066129	2025-09-17 00:09:23.066129
446	MOBILE_APP_ACCESS	t	\N	2025-09-17 00:23:35.178334	2025-09-17 00:23:35.178334
447	MOBILE_APP_ACCESS	t	\N	2025-09-17 04:15:51.377853	2025-09-17 04:15:51.377853
448	MOBILE_APP_ACCESS	t	\N	2025-09-17 05:13:51.48278	2025-09-17 05:13:51.48278
449	MOBILE_APP_ACCESS	t	\N	2025-09-17 17:54:13.245685	2025-09-17 17:54:13.245685
450	MOBILE_APP_ACCESS	t	\N	2025-09-17 17:59:41.75801	2025-09-17 17:59:41.75801
451	MOBILE_APP_ACCESS	t	\N	2025-09-17 18:01:00.645006	2025-09-17 18:01:00.645006
452	MOBILE_APP_ACCESS	t	\N	2025-09-17 18:04:21.650312	2025-09-17 18:04:21.650312
453	MOBILE_APP_ACCESS	t	\N	2025-09-17 18:07:14.332353	2025-09-17 18:07:14.332353
454	MOBILE_APP_ACCESS	t	\N	2025-09-17 18:10:42.833026	2025-09-17 18:10:42.833026
455	MOBILE_APP_ACCESS	t	\N	2025-09-17 18:11:16.320653	2025-09-17 18:11:16.320653
456	MOBILE_APP_ACCESS	t	\N	2025-09-17 18:12:37.03563	2025-09-17 18:12:37.03563
457	MOBILE_APP_ACCESS	t	\N	2025-09-17 18:14:05.137424	2025-09-17 18:14:05.137424
458	MOBILE_APP_ACCESS	t	\N	2025-09-17 18:15:56.089436	2025-09-17 18:15:56.089436
459	MOBILE_APP_ACCESS	t	\N	2025-09-17 18:16:47.766615	2025-09-17 18:16:47.766615
460	MOBILE_APP_ACCESS	t	\N	2025-09-17 18:16:53.836898	2025-09-17 18:16:53.836898
461	MOBILE_APP_ACCESS	t	\N	2025-09-17 18:17:21.162739	2025-09-17 18:17:21.162739
462	MOBILE_APP_ACCESS	t	\N	2025-09-17 18:20:50.029488	2025-09-17 18:20:50.029488
463	MOBILE_APP_ACCESS	t	\N	2025-09-17 18:20:56.05499	2025-09-17 18:20:56.05499
464	MOBILE_APP_ACCESS	t	\N	2025-09-17 18:21:10.299971	2025-09-17 18:21:10.299971
465	MOBILE_APP_ACCESS	t	\N	2025-09-17 18:21:16.336561	2025-09-17 18:21:16.336561
\.


--
-- Data for Name: frequent_locations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.frequent_locations (id, organization_id, name, description, street_address, city, state, zip_code, full_address, location_type, usage_count, is_active, created_at, updated_at) FROM stdin;
fl_denver_health_medical	monarch_competency	Denver Health Medical Center	Main hospital and medical services	777 Bannock St	Denver	CO	80204	777 Bannock St, Denver, CO 80204	medical	0	t	2025-06-18 06:46:14.739375	2025-06-18 06:46:14.739375
fl_king_soopers_evans	monarch_competency	King Soopers - Evans	Grocery store for shopping trips	1155 S Evans St	Denver	CO	80210	1155 S Evans St, Denver, CO 80210	commercial	0	t	2025-06-18 06:46:55.675362	2025-06-18 06:46:55.675362
fl_walmart_aurora	monarch_competency	Colorado Department of Human Services	Government services and appointments	1575 Sherman St	Denver	CO	80203	1575 Sherman St, Denver, CO 80203	other	0	t	2025-06-18 06:46:55.748968	2025-06-18 06:46:55.748968
fl_target_colfax	monarch_mental_health	Denver Health Medical Center	Main hospital and medical services	777 Bannock St	Denver	CO	80204	777 Bannock St, Denver, CO 80204	medical	0	t	2025-06-18 06:46:55.822465	2025-06-18 06:46:55.822465
fl_safeway_denver	monarch_mental_health	King Soopers - Evans	Grocery store for shopping trips	1155 S Evans St	Denver	CO	80210	1155 S Evans St, Denver, CO 80210	commercial	0	t	2025-06-18 06:46:55.895957	2025-06-18 06:46:55.895957
fl_cvs_pharmacy	monarch_mental_health	Colorado Department of Human Services	Government services and appointments	1575 Sherman St	Denver	CO	80203	1575 Sherman St, Denver, CO 80203	other	0	t	2025-06-18 06:46:55.969067	2025-06-18 06:46:55.969067
fl_walgreens_broadway	monarch_sober_living	Denver Health Medical Center	Main hospital and medical services	777 Bannock St	Denver	CO	80204	777 Bannock St, Denver, CO 80204	medical	0	t	2025-06-18 06:46:56.042072	2025-06-18 06:46:56.042072
fl_home_depot_westminster	monarch_sober_living	King Soopers - Evans	Grocery store for shopping trips	1155 S Evans St	Denver	CO	80210	1155 S Evans St, Denver, CO 80210	commercial	0	t	2025-06-18 06:46:56.115226	2025-06-18 06:46:56.115226
fl_costco_thornton	monarch_sober_living	Colorado Department of Human Services	Government services and appointments	1575 Sherman St	Denver	CO	80203	1575 Sherman St, Denver, CO 80203	other	0	t	2025-06-18 06:46:56.187919	2025-06-18 06:46:56.187919
fl_king_soopers_federal	monarch_launch	Denver Health Medical Center	Main hospital and medical services	777 Bannock St	Denver	CO	80204	777 Bannock St, Denver, CO 80204	medical	0	t	2025-06-18 06:46:56.260778	2025-06-18 06:46:56.260778
fl_walmart_commerce_city	monarch_launch	King Soopers - Evans	Grocery store for shopping trips	1155 S Evans St	Denver	CO	80210	1155 S Evans St, Denver, CO 80210	commercial	0	t	2025-06-18 06:46:56.333331	2025-06-18 06:46:56.333331
fl_target_northfield	monarch_launch	Colorado Department of Human Services	Government services and appointments	1575 Sherman St	Denver	CO	80203	1575 Sherman St, Denver, CO 80203	other	0	t	2025-06-18 06:46:56.406055	2025-06-18 06:46:56.406055
fl_lowell_south	monarch_competency	Lowell South	Womens House (Service Area)	5231 Lowell Blvd	Denver	CO	80221	5231 Lowell Blvd, Denver, CO 80221	service_area	0	t	2025-06-18 06:46:14.353165	2025-06-18 06:46:14.353165
fl_lowell_north	monarch_competency	Lowell North	Mens House (Service Area)	5241 Lowell Blvd	Denver	CO	80221	5241 Lowell Blvd, Denver, CO 80221	service_area	0	t	2025-06-18 06:46:14.271603	2025-06-18 06:46:14.271603
fl_highland_sober_living	monarch_sober_living	Highland Sober Living	Sober living residential facility (Service Area)	2145 S High St	Denver	CO	80210	2145 S High St, Denver, CO 80210	service_area	0	t	2025-06-18 06:46:14.662828	2025-06-18 06:46:14.662828
fl_capitol_hill_mental_health	monarch_mental_health	Capitol Hill Mental Health Center	Mental health residential facility (Service Area)	1350 N Logan St	Denver	CO	80203	1350 N Logan St, Denver, CO 80203	service_area	0	t	2025-06-18 06:46:14.58574	2025-06-18 06:46:14.58574
fl_newton	monarch_competency	Newton	Womens House, Office (Service Area)	5335 Newton St	Denver	CO	80221	5335 Newton St, Denver, CO 80221	service_area	0	t	2025-06-18 06:46:14.430711	2025-06-18 06:46:14.430711
fl_rino_launch_center	monarch_launch	RiNo Launch Center	Career launch and training facility (Service Area)	3456 Walnut St	Denver	CO	80205	3456 Walnut St, Denver, CO 80205	service_area	0	t	2025-06-18 06:46:14.507961	2025-06-18 06:46:14.507961
fl_ae3100ea-5d47-49c1-bf91-398bfaf46680	monarch_competency	Walmart	\N	5957 W 44th Ave	Lakeside	CO	80212	5957 W 44th Ave, Lakeside, CO 80212	commercial	0	t	2025-06-24 06:14:05.197943	2025-06-24 06:14:05.197943
fl_d9add75f-a188-4bed-82c0-256d57f44199	monarch_competency	The Phoenix	Sober Gym	2239 Champa St	Denver	CO	80205	2239 Champa St, Denver, CO 80205	other	0	t	2025-06-25 01:38:36.322665	2025-06-25 01:38:36.322665
fl_c0e72dc4-8e38-43b7-a3ba-8ac1ac62ff0b	monarch_competency	Linsey Flanigan Courthouse	\N	520 W Colfax Ave	Denver	CO	80204	520 W Colfax Ave, Denver, CO 80204	other	0	t	2025-07-09 19:52:17.683469	2025-07-09 19:52:17.683469
fl_6d844481-0954-4141-bdc2-64a66f806760	monarch_competency	Jefferson County Justice Center	\N	100 Jefferson County Pkwy	Golden	CO	80401	100 Jefferson County Pkwy, Golden, CO 80401	other	0	t	2025-07-09 19:53:26.709465	2025-07-09 19:53:26.709465
\.


--
-- Data for Name: organizations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.organizations (id, name, address, phone, email, is_active, created_at, updated_at, logo_url) FROM stdin;
real_transport_org	Real Transport Services	123 Business Ave, Charlotte, NC 28202	(704) 555-0100	admin@realtransport.com	t	2025-06-16 22:00:44.563618	2025-06-16 22:02:55.129974	\N
monarch_competency	Monarch Competency	5245 Lowell Blvd. Denver, CO  80221	(555) 999-8888	updated@monarchcompetency.org	t	2025-06-11 07:05:47.553224	2025-07-09 20:23:42.198869	/uploads/logos/monarch-competency-logo.png
monarch_mental_health	Monarch Mental Health	8420 W Sixth Ave. Denver, CO  80215	(555) 777-1234	mental@monarchhealth.org	t	2025-06-11 07:05:47.553224	2025-06-24 16:47:38.909072	\N
monarch_launch	Monarch Launch	9130 W 13th Ave. Lakewood, CO  80215\n	(704) 555-0104	info@monarchlaunch.org	t	2025-06-11 07:05:47.553224	2025-06-24 16:48:42.033854	\N
monarch_sober_living	monarch sober_living	6590 W Arkansas Ave. Lakewood, CO  80232	303-444-5555	test@monarchsl.com	t	2025-06-11 07:05:47.553224	2025-06-24 16:49:11.383776	\N
\.


--
-- Data for Name: recurring_trips; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.recurring_trips (id, organization_id, name, day_of_week, time_of_day, pickup_location, dropoff_location, is_round_trip, duration_weeks, is_active, created_by, created_at, updated_at, client_id, client_group_id, pickup_address, dropoff_address, scheduled_time, frequency, days_of_week, duration, trip_type, trip_nickname) FROM stdin;
recurring_trip_1750882910462_f0l6xzpip	monarch_competency	Individual Trip - undefined	4	13:00:00	5241 Lowell Blvd, Denver, CO 80221	5957 W 44th Ave, Lakeside, CO 80212	t	10	f	user_ryan_monarch_readonly	2025-06-25 20:21:50.502277	2025-06-25 20:21:50.502277	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
recurring_trip_1750883469938_qxsznos0r	monarch_competency	Individual Trip - undefined	4	13:00:00	5241 Lowell Blvd, Denver, CO 80221	5957 W 44th Ave, Lakeside, CO 80212	t	10	f	user_ryan_monarch_readonly	2025-06-25 20:31:09.990264	2025-06-25 20:31:09.990264	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
recurring_trip_1750831626732_wyynooamv	monarch_competency	Group Trip - Phoenix Group	2	13:00:00	5241 Lowell Blvd, Denver, CO 80221	2239 Champa St, Denver, CO 80205	t	4	f	super_admin_monarch_001	2025-06-25 06:07:06.781091	2025-06-25 06:07:06.781091	\N	group_1750815373509_lhbsz3ohp	\N	\N	\N	Weekly	{2}	\N	\N	\N
recurring_trip_1752091519628_le658s000	monarch_competency	Individual Trip - undefined	2	13:00:00	5241 Lowell Blvd, Denver, CO 80221	2239 Champa St, Denver, CO 80205	t	8	t	super_admin_monarch_001	2025-07-09 20:05:19.693133	2025-07-09 20:05:19.693133	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
recurring_trip_1752091649621_yfhjz31q2	monarch_competency	Individual Trip - undefined	3	13:00:00	5241 Lowell Blvd, Denver, CO 80221	2239 Champa St, Denver, CO 80205	t	8	t	super_admin_monarch_001	2025-07-09 20:07:29.670042	2025-07-09 20:07:29.670042	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
recurring_trip_1752091783545_z3zn9fhu0	monarch_competency	Individual Trip - undefined	4	13:00:00	5241 Lowell Blvd, Denver, CO 80221	5957 W 44th Ave, Lakeside, CO 80212	f	8	t	super_admin_monarch_001	2025-07-09 20:09:43.595453	2025-07-09 20:09:43.595453	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
recurring_trip_1752091835773_lwbw8or7q	monarch_competency	Individual Trip - undefined	5	13:00:00	5241 Lowell Blvd, Denver, CO 80221	5957 W 44th Ave, Lakeside, CO 80212	f	8	t	super_admin_monarch_001	2025-07-09 20:10:35.827877	2025-07-09 20:10:35.827877	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
recurring_trip_1757892849738_k6qmqpjuw	monarch_competency	Individual Trip - undefined	2	13:00:00	5241 Lowell Blvd, Denver, CO 80221	2239 Champa St, Denver, CO 80205	t	4	t	unknown	2025-09-14 23:34:09.88954	2025-09-14 23:34:09.88954	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
\.


--
-- Data for Name: role_permissions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.role_permissions (id, role, permission, resource, organization_id, created_at, updated_at) FROM stdin;
1	super_admin	VIEW_TRIPS	*	\N	2025-06-22 19:45:06.151005	2025-06-22 19:45:06.151005
2	super_admin	CREATE_TRIPS	*	\N	2025-06-22 19:45:06.151005	2025-06-22 19:45:06.151005
3	super_admin	EDIT_TRIPS	*	\N	2025-06-22 19:45:06.151005	2025-06-22 19:45:06.151005
4	super_admin	DELETE_TRIPS	*	\N	2025-06-22 19:45:06.151005	2025-06-22 19:45:06.151005
5	super_admin	VIEW_DRIVERS	*	\N	2025-06-22 19:45:06.151005	2025-06-22 19:45:06.151005
6	super_admin	CREATE_DRIVERS	*	\N	2025-06-22 19:45:06.151005	2025-06-22 19:45:06.151005
7	super_admin	EDIT_DRIVERS	*	\N	2025-06-22 19:45:06.151005	2025-06-22 19:45:06.151005
8	super_admin	DELETE_DRIVERS	*	\N	2025-06-22 19:45:06.151005	2025-06-22 19:45:06.151005
9	super_admin	VIEW_CLIENTS	*	\N	2025-06-22 19:45:06.151005	2025-06-22 19:45:06.151005
10	super_admin	CREATE_CLIENTS	*	\N	2025-06-22 19:45:06.151005	2025-06-22 19:45:06.151005
11	super_admin	EDIT_CLIENTS	*	\N	2025-06-22 19:45:06.151005	2025-06-22 19:45:06.151005
12	super_admin	DELETE_CLIENTS	*	\N	2025-06-22 19:45:06.151005	2025-06-22 19:45:06.151005
13	super_admin	MANAGE_USERS	*	\N	2025-06-22 19:45:06.151005	2025-06-22 19:45:06.151005
14	super_admin	MANAGE_PERMISSIONS	*	\N	2025-06-22 19:45:06.151005	2025-06-22 19:45:06.151005
15	super_admin	VIEW_ANALYTICS	*	\N	2025-06-22 19:45:06.151005	2025-06-22 19:45:06.151005
16	super_admin	MANAGE_ORGANIZATIONS	*	\N	2025-06-22 19:45:06.151005	2025-06-22 19:45:06.151005
17	organization_admin	VIEW_TRIPS	organization	\N	2025-06-22 19:45:09.046194	2025-06-22 19:45:09.046194
18	organization_admin	CREATE_TRIPS	organization	\N	2025-06-22 19:45:09.046194	2025-06-22 19:45:09.046194
19	organization_admin	EDIT_TRIPS	organization	\N	2025-06-22 19:45:09.046194	2025-06-22 19:45:09.046194
20	organization_admin	DELETE_TRIPS	organization	\N	2025-06-22 19:45:09.046194	2025-06-22 19:45:09.046194
21	organization_admin	VIEW_DRIVERS	organization	\N	2025-06-22 19:45:09.046194	2025-06-22 19:45:09.046194
22	organization_admin	CREATE_DRIVERS	organization	\N	2025-06-22 19:45:09.046194	2025-06-22 19:45:09.046194
23	organization_admin	EDIT_DRIVERS	organization	\N	2025-06-22 19:45:09.046194	2025-06-22 19:45:09.046194
24	organization_admin	VIEW_CLIENTS	organization	\N	2025-06-22 19:45:09.046194	2025-06-22 19:45:09.046194
25	organization_admin	CREATE_CLIENTS	organization	\N	2025-06-22 19:45:09.046194	2025-06-22 19:45:09.046194
26	organization_admin	EDIT_CLIENTS	organization	\N	2025-06-22 19:45:09.046194	2025-06-22 19:45:09.046194
27	organization_admin	MANAGE_USERS	organization	\N	2025-06-22 19:45:09.046194	2025-06-22 19:45:09.046194
28	organization_admin	VIEW_ANALYTICS	organization	\N	2025-06-22 19:45:09.046194	2025-06-22 19:45:09.046194
29	organization_user	VIEW_TRIPS	organization	\N	2025-06-22 19:45:10.858637	2025-06-22 19:45:10.858637
30	organization_user	VIEW_DRIVERS	organization	\N	2025-06-22 19:45:10.858637	2025-06-22 19:45:10.858637
31	organization_user	VIEW_CLIENTS	organization	\N	2025-06-22 19:45:10.858637	2025-06-22 19:45:10.858637
32	driver	VIEW_TRIPS	own	\N	2025-06-22 19:45:10.858637	2025-06-22 19:45:10.858637
33	driver	EDIT_TRIPS	own	\N	2025-06-22 19:45:10.858637	2025-06-22 19:45:10.858637
34	super_admin	VIEW_TRIPS	*	\N	2025-06-22 19:45:15.282877	2025-06-22 19:45:15.282877
35	super_admin	VIEW_TRIPS	*	\N	2025-06-22 19:46:19.302764	2025-06-22 19:46:19.302764
36	super_admin	VIEW_TRIPS	*	\N	2025-06-22 19:46:53.213809	2025-06-22 19:46:53.213809
37	super_admin	VIEW_TRIPS	*	\N	2025-06-22 19:48:27.409838	2025-06-22 19:48:27.409838
38	super_admin	VIEW_TRIPS	*	\N	2025-06-22 19:49:51.595157	2025-06-22 19:49:51.595157
39	super_admin	VIEW_TRIPS	*	\N	2025-06-22 19:51:12.709121	2025-06-22 19:51:12.709121
40	super_admin	VIEW_TRIPS	*	\N	2025-06-22 19:53:13.65989	2025-06-22 19:53:13.65989
41	super_admin	VIEW_TRIPS	*	\N	2025-06-22 19:54:31.203484	2025-06-22 19:54:31.203484
42	super_admin	VIEW_TRIPS	*	\N	2025-06-22 19:55:10.969594	2025-06-22 19:55:10.969594
43	super_admin	VIEW_TRIPS	*	\N	2025-06-22 20:40:25.88864	2025-06-22 20:40:25.88864
44	super_admin	VIEW_TRIPS	*	\N	2025-06-22 21:08:13.694609	2025-06-22 21:08:13.694609
45	super_admin	VIEW_TRIPS	*	\N	2025-06-22 21:08:51.45691	2025-06-22 21:08:51.45691
46	super_admin	VIEW_TRIPS	*	\N	2025-06-22 21:20:24.207049	2025-06-22 21:20:24.207049
47	super_admin	VIEW_TRIPS	*	\N	2025-06-22 21:21:18.593635	2025-06-22 21:21:18.593635
48	super_admin	VIEW_TRIPS	*	\N	2025-06-23 00:43:17.717655	2025-06-23 00:43:17.717655
49	super_admin	VIEW_TRIPS	*	\N	2025-06-23 00:56:20.728787	2025-06-23 00:56:20.728787
50	monarch_owner	manage_users	users	\N	2025-06-23 01:21:01.494451	2025-06-23 01:21:01.494451
51	monarch_owner	manage_service_areas	service_areas	\N	2025-06-23 01:21:01.494451	2025-06-23 01:21:01.494451
52	monarch_owner	manage_clients	clients	\N	2025-06-23 01:21:01.494451	2025-06-23 01:21:01.494451
53	monarch_owner	manage_drivers	drivers	\N	2025-06-23 01:21:01.494451	2025-06-23 01:21:01.494451
54	monarch_owner	manage_trips	trips	\N	2025-06-23 01:21:01.494451	2025-06-23 01:21:01.494451
55	monarch_owner	create_trips	trips	\N	2025-06-23 01:21:01.494451	2025-06-23 01:21:01.494451
56	monarch_owner	view_clients_cross_org	clients	\N	2025-06-23 01:21:01.494451	2025-06-23 01:21:01.494451
57	monarch_owner	manage_clients_cross_org	clients	\N	2025-06-23 01:21:01.494451	2025-06-23 01:21:01.494451
58	monarch_owner	create_trips_cross_org	trips	\N	2025-06-23 01:21:01.494451	2025-06-23 01:21:01.494451
59	monarch_owner	view_service_areas_cross_org	service_areas	\N	2025-06-23 01:21:01.494451	2025-06-23 01:21:01.494451
60	super_admin	VIEW_TRIPS	*	\N	2025-06-23 03:21:00.468164	2025-06-23 03:21:00.468164
61	super_admin	VIEW_TRIPS	*	\N	2025-06-23 04:22:31.216426	2025-06-23 04:22:31.216426
62	super_admin	VIEW_TRIPS	*	\N	2025-06-23 04:23:38.021573	2025-06-23 04:23:38.021573
63	super_admin	VIEW_TRIPS	*	\N	2025-06-23 04:49:02.727395	2025-06-23 04:49:02.727395
64	super_admin	VIEW_TRIPS	*	\N	2025-06-23 04:54:17.048295	2025-06-23 04:54:17.048295
65	super_admin	VIEW_TRIPS	*	\N	2025-06-23 05:04:56.377623	2025-06-23 05:04:56.377623
66	super_admin	VIEW_TRIPS	*	\N	2025-06-23 05:09:18.049627	2025-06-23 05:09:18.049627
67	super_admin	VIEW_TRIPS	*	\N	2025-06-23 05:10:19.483626	2025-06-23 05:10:19.483626
68	super_admin	VIEW_TRIPS	*	\N	2025-06-23 05:13:15.474913	2025-06-23 05:13:15.474913
69	super_admin	VIEW_TRIPS	*	\N	2025-06-23 05:13:29.987686	2025-06-23 05:13:29.987686
70	super_admin	VIEW_TRIPS	*	\N	2025-06-23 05:16:00.722534	2025-06-23 05:16:00.722534
71	super_admin	VIEW_TRIPS	*	\N	2025-06-23 05:16:15.424518	2025-06-23 05:16:15.424518
72	super_admin	VIEW_TRIPS	*	\N	2025-06-23 05:19:34.543742	2025-06-23 05:19:34.543742
73	super_admin	VIEW_TRIPS	*	\N	2025-06-23 05:25:35.165457	2025-06-23 05:25:35.165457
74	super_admin	VIEW_TRIPS	*	\N	2025-06-23 05:27:15.05691	2025-06-23 05:27:15.05691
75	super_admin	VIEW_TRIPS	*	\N	2025-06-23 06:24:35.393986	2025-06-23 06:24:35.393986
76	super_admin	VIEW_TRIPS	*	\N	2025-06-23 06:40:54.51127	2025-06-23 06:40:54.51127
77	super_admin	VIEW_TRIPS	*	\N	2025-06-23 06:47:02.989258	2025-06-23 06:47:02.989258
78	super_admin	VIEW_TRIPS	*	\N	2025-06-23 06:49:13.850634	2025-06-23 06:49:13.850634
79	super_admin	VIEW_TRIPS	*	\N	2025-06-23 06:56:12.574963	2025-06-23 06:56:12.574963
80	super_admin	VIEW_TRIPS	*	\N	2025-06-23 17:39:21.389519	2025-06-23 17:39:21.389519
81	super_admin	VIEW_TRIPS	*	\N	2025-06-24 00:12:38.994986	2025-06-24 00:12:38.994986
82	super_admin	VIEW_TRIPS	*	\N	2025-06-24 00:21:20.153429	2025-06-24 00:21:20.153429
83	super_admin	VIEW_TRIPS	*	\N	2025-06-24 00:30:59.285984	2025-06-24 00:30:59.285984
84	super_admin	VIEW_TRIPS	*	\N	2025-06-24 00:32:09.939299	2025-06-24 00:32:09.939299
85	super_admin	VIEW_TRIPS	*	\N	2025-06-24 00:33:35.343857	2025-06-24 00:33:35.343857
86	super_admin	VIEW_TRIPS	*	\N	2025-06-24 03:40:18.341281	2025-06-24 03:40:18.341281
87	super_admin	VIEW_TRIPS	*	\N	2025-06-24 03:52:29.857813	2025-06-24 03:52:29.857813
88	super_admin	VIEW_TRIPS	*	\N	2025-06-24 03:56:33.58503	2025-06-24 03:56:33.58503
89	super_admin	VIEW_TRIPS	*	\N	2025-06-24 04:08:44.772134	2025-06-24 04:08:44.772134
90	super_admin	VIEW_TRIPS	*	\N	2025-06-24 04:14:44.739092	2025-06-24 04:14:44.739092
91	super_admin	VIEW_TRIPS	*	\N	2025-06-24 04:30:57.708206	2025-06-24 04:30:57.708206
92	super_admin	VIEW_TRIPS	*	\N	2025-06-24 04:33:35.79438	2025-06-24 04:33:35.79438
93	super_admin	VIEW_TRIPS	*	\N	2025-06-24 04:33:46.742473	2025-06-24 04:33:46.742473
94	super_admin	VIEW_TRIPS	*	\N	2025-06-24 04:37:11.808698	2025-06-24 04:37:11.808698
95	super_admin	VIEW_TRIPS	*	\N	2025-06-24 04:43:22.810221	2025-06-24 04:43:22.810221
96	super_admin	VIEW_TRIPS	*	\N	2025-06-24 04:52:42.051614	2025-06-24 04:52:42.051614
97	super_admin	VIEW_TRIPS	*	\N	2025-06-24 05:13:37.837201	2025-06-24 05:13:37.837201
98	super_admin	VIEW_TRIPS	*	\N	2025-06-24 05:17:53.737582	2025-06-24 05:17:53.737582
99	super_admin	VIEW_TRIPS	*	\N	2025-06-24 05:20:39.748469	2025-06-24 05:20:39.748469
100	super_admin	VIEW_TRIPS	*	\N	2025-06-24 05:33:54.121883	2025-06-24 05:33:54.121883
101	super_admin	VIEW_TRIPS	*	\N	2025-06-24 05:44:19.066936	2025-06-24 05:44:19.066936
102	super_admin	VIEW_TRIPS	*	\N	2025-06-24 05:45:30.065345	2025-06-24 05:45:30.065345
103	super_admin	VIEW_TRIPS	*	\N	2025-06-24 05:59:46.143364	2025-06-24 05:59:46.143364
104	super_admin	VIEW_TRIPS	*	\N	2025-06-24 06:01:11.635381	2025-06-24 06:01:11.635381
105	super_admin	VIEW_TRIPS	*	\N	2025-06-24 06:19:14.90561	2025-06-24 06:19:14.90561
106	super_admin	VIEW_TRIPS	*	\N	2025-06-24 06:20:10.992058	2025-06-24 06:20:10.992058
107	super_admin	VIEW_TRIPS	*	\N	2025-06-24 06:20:57.638848	2025-06-24 06:20:57.638848
108	super_admin	VIEW_TRIPS	*	\N	2025-06-24 14:37:55.29724	2025-06-24 14:37:55.29724
109	super_admin	VIEW_TRIPS	*	\N	2025-06-24 14:42:26.904622	2025-06-24 14:42:26.904622
110	super_admin	VIEW_TRIPS	*	\N	2025-06-24 15:27:36.461551	2025-06-24 15:27:36.461551
111	super_admin	VIEW_TRIPS	*	\N	2025-06-24 16:03:04.940364	2025-06-24 16:03:04.940364
112	super_admin	VIEW_TRIPS	*	\N	2025-06-24 16:11:42.137728	2025-06-24 16:11:42.137728
113	super_admin	VIEW_TRIPS	*	\N	2025-06-24 16:23:54.891761	2025-06-24 16:23:54.891761
114	super_admin	VIEW_TRIPS	*	\N	2025-06-24 16:24:35.471741	2025-06-24 16:24:35.471741
115	super_admin	VIEW_TRIPS	*	\N	2025-06-24 16:25:10.624793	2025-06-24 16:25:10.624793
116	super_admin	VIEW_TRIPS	*	\N	2025-06-24 16:25:55.620253	2025-06-24 16:25:55.620253
117	super_admin	VIEW_TRIPS	*	\N	2025-06-24 16:35:51.255397	2025-06-24 16:35:51.255397
118	super_admin	VIEW_TRIPS	*	\N	2025-06-24 16:36:55.341487	2025-06-24 16:36:55.341487
119	super_admin	VIEW_TRIPS	*	\N	2025-06-24 16:42:10.995269	2025-06-24 16:42:10.995269
120	super_admin	VIEW_TRIPS	*	\N	2025-06-24 16:42:51.560314	2025-06-24 16:42:51.560314
121	super_admin	VIEW_TRIPS	*	\N	2025-06-24 16:53:15.427735	2025-06-24 16:53:15.427735
122	super_admin	VIEW_TRIPS	*	\N	2025-06-24 16:54:45.361483	2025-06-24 16:54:45.361483
123	super_admin	VIEW_TRIPS	*	\N	2025-06-24 16:55:55.699428	2025-06-24 16:55:55.699428
124	super_admin	VIEW_TRIPS	*	\N	2025-06-24 17:13:21.626187	2025-06-24 17:13:21.626187
125	super_admin	VIEW_TRIPS	*	\N	2025-06-24 17:55:49.400227	2025-06-24 17:55:49.400227
126	super_admin	VIEW_TRIPS	*	\N	2025-06-24 18:09:22.784855	2025-06-24 18:09:22.784855
127	super_admin	VIEW_TRIPS	*	\N	2025-06-24 18:10:23.621933	2025-06-24 18:10:23.621933
128	super_admin	VIEW_TRIPS	*	\N	2025-06-24 18:20:41.382417	2025-06-24 18:20:41.382417
129	super_admin	VIEW_TRIPS	*	\N	2025-06-24 18:21:12.962354	2025-06-24 18:21:12.962354
130	super_admin	VIEW_TRIPS	*	\N	2025-06-24 18:21:43.835831	2025-06-24 18:21:43.835831
131	super_admin	VIEW_TRIPS	*	\N	2025-06-24 18:48:55.204902	2025-06-24 18:48:55.204902
132	super_admin	VIEW_TRIPS	*	\N	2025-06-24 18:51:00.673164	2025-06-24 18:51:00.673164
133	super_admin	VIEW_TRIPS	*	\N	2025-06-24 18:52:14.026717	2025-06-24 18:52:14.026717
134	super_admin	VIEW_TRIPS	*	\N	2025-06-24 19:42:22.874994	2025-06-24 19:42:22.874994
135	super_admin	VIEW_TRIPS	*	\N	2025-06-24 19:55:21.252841	2025-06-24 19:55:21.252841
136	super_admin	VIEW_TRIPS	*	\N	2025-06-24 19:55:59.739881	2025-06-24 19:55:59.739881
137	super_admin	VIEW_TRIPS	*	\N	2025-06-24 20:03:58.35634	2025-06-24 20:03:58.35634
138	super_admin	VIEW_TRIPS	*	\N	2025-06-24 20:05:42.790761	2025-06-24 20:05:42.790761
139	super_admin	VIEW_TRIPS	*	\N	2025-06-24 20:06:29.936233	2025-06-24 20:06:29.936233
140	super_admin	VIEW_TRIPS	*	\N	2025-06-24 20:07:08.857801	2025-06-24 20:07:08.857801
141	super_admin	VIEW_TRIPS	*	\N	2025-06-24 20:16:05.804058	2025-06-24 20:16:05.804058
142	super_admin	VIEW_TRIPS	*	\N	2025-06-24 20:16:57.95277	2025-06-24 20:16:57.95277
143	super_admin	VIEW_TRIPS	*	\N	2025-06-24 20:18:56.899102	2025-06-24 20:18:56.899102
144	super_admin	VIEW_TRIPS	*	\N	2025-06-24 20:24:53.80057	2025-06-24 20:24:53.80057
145	super_admin	VIEW_TRIPS	*	\N	2025-06-24 20:31:40.6881	2025-06-24 20:31:40.6881
146	super_admin	VIEW_TRIPS	*	\N	2025-06-24 20:38:38.671799	2025-06-24 20:38:38.671799
147	super_admin	VIEW_TRIPS	*	\N	2025-06-24 20:39:08.429506	2025-06-24 20:39:08.429506
148	super_admin	VIEW_TRIPS	*	\N	2025-06-24 20:39:16.841629	2025-06-24 20:39:16.841629
149	super_admin	VIEW_TRIPS	*	\N	2025-06-25 00:18:02.14076	2025-06-25 00:18:02.14076
150	super_admin	VIEW_TRIPS	*	\N	2025-06-25 00:48:19.001201	2025-06-25 00:48:19.001201
151	super_admin	VIEW_TRIPS	*	\N	2025-06-25 01:03:33.350611	2025-06-25 01:03:33.350611
152	super_admin	VIEW_TRIPS	*	\N	2025-06-25 01:04:29.508985	2025-06-25 01:04:29.508985
153	super_admin	VIEW_TRIPS	*	\N	2025-06-25 01:14:48.314927	2025-06-25 01:14:48.314927
154	super_admin	VIEW_TRIPS	*	\N	2025-06-25 01:16:43.420952	2025-06-25 01:16:43.420952
155	super_admin	VIEW_TRIPS	*	\N	2025-06-25 01:22:05.493724	2025-06-25 01:22:05.493724
156	super_admin	VIEW_TRIPS	*	\N	2025-06-25 01:22:35.706561	2025-06-25 01:22:35.706561
157	super_admin	VIEW_TRIPS	*	\N	2025-06-25 01:23:05.101977	2025-06-25 01:23:05.101977
158	super_admin	VIEW_TRIPS	*	\N	2025-06-25 01:54:21.355111	2025-06-25 01:54:21.355111
159	super_admin	VIEW_TRIPS	*	\N	2025-06-25 01:55:11.04971	2025-06-25 01:55:11.04971
160	super_admin	VIEW_TRIPS	*	\N	2025-06-25 02:02:41.61503	2025-06-25 02:02:41.61503
161	super_admin	VIEW_TRIPS	*	\N	2025-06-25 02:04:22.355689	2025-06-25 02:04:22.355689
162	super_admin	VIEW_TRIPS	*	\N	2025-06-25 02:05:01.369733	2025-06-25 02:05:01.369733
163	super_admin	VIEW_TRIPS	*	\N	2025-06-25 02:10:41.486018	2025-06-25 02:10:41.486018
164	super_admin	VIEW_TRIPS	*	\N	2025-06-25 02:13:42.145185	2025-06-25 02:13:42.145185
165	super_admin	VIEW_TRIPS	*	\N	2025-06-25 02:16:28.423063	2025-06-25 02:16:28.423063
166	super_admin	VIEW_TRIPS	*	\N	2025-06-25 02:17:04.907664	2025-06-25 02:17:04.907664
167	super_admin	VIEW_TRIPS	*	\N	2025-06-25 02:54:00.027972	2025-06-25 02:54:00.027972
168	super_admin	VIEW_TRIPS	*	\N	2025-06-25 02:57:57.232966	2025-06-25 02:57:57.232966
169	super_admin	VIEW_TRIPS	*	\N	2025-06-25 03:15:18.366632	2025-06-25 03:15:18.366632
170	super_admin	VIEW_TRIPS	*	\N	2025-06-25 03:23:38.302609	2025-06-25 03:23:38.302609
171	super_admin	VIEW_TRIPS	*	\N	2025-06-25 03:32:51.437317	2025-06-25 03:32:51.437317
172	super_admin	VIEW_TRIPS	*	\N	2025-06-25 03:50:42.693282	2025-06-25 03:50:42.693282
173	super_admin	VIEW_TRIPS	*	\N	2025-06-25 04:25:47.123719	2025-06-25 04:25:47.123719
174	super_admin	VIEW_TRIPS	*	\N	2025-06-25 04:58:58.355436	2025-06-25 04:58:58.355436
175	super_admin	VIEW_TRIPS	*	\N	2025-06-25 04:59:44.223201	2025-06-25 04:59:44.223201
176	super_admin	VIEW_TRIPS	*	\N	2025-06-25 05:34:25.946845	2025-06-25 05:34:25.946845
177	super_admin	VIEW_TRIPS	*	\N	2025-06-25 05:36:04.186156	2025-06-25 05:36:04.186156
178	super_admin	VIEW_TRIPS	*	\N	2025-06-25 05:45:15.958387	2025-06-25 05:45:15.958387
179	super_admin	VIEW_TRIPS	*	\N	2025-06-25 05:53:37.307954	2025-06-25 05:53:37.307954
180	super_admin	VIEW_TRIPS	*	\N	2025-06-25 05:54:23.622145	2025-06-25 05:54:23.622145
181	super_admin	VIEW_TRIPS	*	\N	2025-06-25 06:02:47.968751	2025-06-25 06:02:47.968751
182	super_admin	VIEW_TRIPS	*	\N	2025-06-25 06:04:01.089465	2025-06-25 06:04:01.089465
183	super_admin	VIEW_TRIPS	*	\N	2025-06-25 06:08:49.131772	2025-06-25 06:08:49.131772
184	super_admin	VIEW_TRIPS	*	\N	2025-06-25 06:34:03.228514	2025-06-25 06:34:03.228514
185	super_admin	VIEW_TRIPS	*	\N	2025-06-25 06:46:11.969313	2025-06-25 06:46:11.969313
186	super_admin	VIEW_TRIPS	*	\N	2025-06-25 06:55:56.091378	2025-06-25 06:55:56.091378
187	super_admin	VIEW_TRIPS	*	\N	2025-06-25 07:15:06.586469	2025-06-25 07:15:06.586469
188	super_admin	VIEW_TRIPS	*	\N	2025-06-25 07:17:11.538374	2025-06-25 07:17:11.538374
189	super_admin	VIEW_TRIPS	*	\N	2025-06-25 07:31:21.192025	2025-06-25 07:31:21.192025
190	super_admin	VIEW_TRIPS	*	\N	2025-06-25 07:36:46.088159	2025-06-25 07:36:46.088159
191	super_admin	VIEW_TRIPS	*	\N	2025-06-25 07:41:21.280185	2025-06-25 07:41:21.280185
192	super_admin	VIEW_TRIPS	*	\N	2025-06-25 07:43:00.149194	2025-06-25 07:43:00.149194
193	super_admin	VIEW_TRIPS	*	\N	2025-06-25 07:45:22.90033	2025-06-25 07:45:22.90033
194	super_admin	VIEW_TRIPS	*	\N	2025-06-25 07:46:44.83754	2025-06-25 07:46:44.83754
195	super_admin	VIEW_TRIPS	*	\N	2025-06-25 14:09:35.264308	2025-06-25 14:09:35.264308
196	super_admin	VIEW_TRIPS	*	\N	2025-06-25 14:45:03.734126	2025-06-25 14:45:03.734126
197	super_admin	VIEW_TRIPS	*	\N	2025-06-25 14:51:54.999185	2025-06-25 14:51:54.999185
198	super_admin	VIEW_TRIPS	*	\N	2025-06-25 14:52:58.428693	2025-06-25 14:52:58.428693
199	super_admin	VIEW_TRIPS	*	\N	2025-06-25 14:53:58.91816	2025-06-25 14:53:58.91816
200	super_admin	VIEW_TRIPS	*	\N	2025-06-25 14:55:01.957071	2025-06-25 14:55:01.957071
201	super_admin	VIEW_TRIPS	*	\N	2025-06-25 15:10:55.598674	2025-06-25 15:10:55.598674
202	super_admin	VIEW_TRIPS	*	\N	2025-06-25 15:16:07.937135	2025-06-25 15:16:07.937135
203	super_admin	VIEW_TRIPS	*	\N	2025-06-25 15:19:53.442635	2025-06-25 15:19:53.442635
204	super_admin	VIEW_TRIPS	*	\N	2025-06-25 19:46:43.391635	2025-06-25 19:46:43.391635
205	super_admin	VIEW_TRIPS	*	\N	2025-06-25 19:55:33.752783	2025-06-25 19:55:33.752783
206	super_admin	VIEW_TRIPS	*	\N	2025-06-25 19:59:08.337428	2025-06-25 19:59:08.337428
207	super_admin	VIEW_TRIPS	*	\N	2025-06-25 20:08:57.240716	2025-06-25 20:08:57.240716
208	super_admin	VIEW_TRIPS	*	\N	2025-06-25 20:25:22.038294	2025-06-25 20:25:22.038294
209	super_admin	VIEW_TRIPS	*	\N	2025-06-25 21:23:38.369692	2025-06-25 21:23:38.369692
210	super_admin	VIEW_TRIPS	*	\N	2025-06-25 21:46:28.956738	2025-06-25 21:46:28.956738
211	super_admin	VIEW_TRIPS	*	\N	2025-06-25 22:44:46.816935	2025-06-25 22:44:46.816935
212	super_admin	VIEW_TRIPS	*	\N	2025-06-25 23:17:51.243603	2025-06-25 23:17:51.243603
213	super_admin	VIEW_TRIPS	*	\N	2025-06-25 23:42:36.169088	2025-06-25 23:42:36.169088
214	super_admin	VIEW_TRIPS	*	\N	2025-06-25 23:45:44.468426	2025-06-25 23:45:44.468426
215	super_admin	VIEW_TRIPS	*	\N	2025-06-25 23:46:16.390317	2025-06-25 23:46:16.390317
216	super_admin	VIEW_TRIPS	*	\N	2025-06-25 23:52:33.638703	2025-06-25 23:52:33.638703
217	super_admin	VIEW_TRIPS	*	\N	2025-06-26 00:04:29.800588	2025-06-26 00:04:29.800588
218	super_admin	VIEW_TRIPS	*	\N	2025-06-26 03:42:53.697564	2025-06-26 03:42:53.697564
219	super_admin	VIEW_TRIPS	*	\N	2025-06-26 04:19:11.889265	2025-06-26 04:19:11.889265
220	super_admin	VIEW_TRIPS	*	\N	2025-06-26 04:42:46.524428	2025-06-26 04:42:46.524428
221	super_admin	VIEW_TRIPS	*	\N	2025-06-26 05:17:25.860312	2025-06-26 05:17:25.860312
222	super_admin	VIEW_TRIPS	*	\N	2025-06-26 05:51:12.495294	2025-06-26 05:51:12.495294
223	super_admin	VIEW_TRIPS	*	\N	2025-06-26 06:42:35.890593	2025-06-26 06:42:35.890593
224	super_admin	VIEW_TRIPS	*	\N	2025-06-26 06:45:37.557458	2025-06-26 06:45:37.557458
225	super_admin	VIEW_TRIPS	*	\N	2025-06-26 06:48:26.064601	2025-06-26 06:48:26.064601
226	super_admin	VIEW_TRIPS	*	\N	2025-06-26 14:45:32.71801	2025-06-26 14:45:32.71801
227	super_admin	VIEW_TRIPS	*	\N	2025-06-27 02:02:45.342145	2025-06-27 02:02:45.342145
228	super_admin	VIEW_TRIPS	*	\N	2025-06-27 04:02:06.786106	2025-06-27 04:02:06.786106
229	super_admin	VIEW_TRIPS	*	\N	2025-06-27 05:12:53.004893	2025-06-27 05:12:53.004893
230	super_admin	VIEW_TRIPS	*	\N	2025-06-27 05:41:57.242751	2025-06-27 05:41:57.242751
231	super_admin	VIEW_TRIPS	*	\N	2025-06-27 05:42:40.885236	2025-06-27 05:42:40.885236
232	super_admin	VIEW_TRIPS	*	\N	2025-06-27 05:45:35.894257	2025-06-27 05:45:35.894257
233	super_admin	VIEW_TRIPS	*	\N	2025-06-27 05:46:25.808844	2025-06-27 05:46:25.808844
234	super_admin	VIEW_TRIPS	*	\N	2025-06-27 20:00:14.655056	2025-06-27 20:00:14.655056
235	super_admin	VIEW_TRIPS	*	\N	2025-06-27 20:05:13.583469	2025-06-27 20:05:13.583469
236	super_admin	VIEW_TRIPS	*	\N	2025-06-27 20:10:06.26749	2025-06-27 20:10:06.26749
237	super_admin	VIEW_TRIPS	*	\N	2025-06-27 20:19:41.739541	2025-06-27 20:19:41.739541
238	super_admin	VIEW_TRIPS	*	\N	2025-06-27 20:20:44.81642	2025-06-27 20:20:44.81642
239	super_admin	VIEW_TRIPS	*	\N	2025-06-27 20:21:18.810989	2025-06-27 20:21:18.810989
240	super_admin	VIEW_TRIPS	*	\N	2025-06-27 20:27:43.065988	2025-06-27 20:27:43.065988
241	super_admin	VIEW_TRIPS	*	\N	2025-06-27 20:29:49.529901	2025-06-27 20:29:49.529901
242	super_admin	VIEW_TRIPS	*	\N	2025-06-28 03:31:45.322073	2025-06-28 03:31:45.322073
243	super_admin	VIEW_TRIPS	*	\N	2025-06-28 03:40:19.82786	2025-06-28 03:40:19.82786
244	super_admin	VIEW_TRIPS	*	\N	2025-06-28 04:03:18.496376	2025-06-28 04:03:18.496376
245	super_admin	VIEW_TRIPS	*	\N	2025-06-28 04:07:55.264155	2025-06-28 04:07:55.264155
246	super_admin	VIEW_TRIPS	*	\N	2025-06-28 04:10:23.646462	2025-06-28 04:10:23.646462
247	super_admin	VIEW_TRIPS	*	\N	2025-06-28 04:27:49.480469	2025-06-28 04:27:49.480469
248	super_admin	VIEW_TRIPS	*	\N	2025-06-28 04:28:57.325415	2025-06-28 04:28:57.325415
249	super_admin	VIEW_TRIPS	*	\N	2025-06-28 04:46:40.332426	2025-06-28 04:46:40.332426
250	super_admin	VIEW_TRIPS	*	\N	2025-06-28 04:51:41.274589	2025-06-28 04:51:41.274589
251	super_admin	VIEW_TRIPS	*	\N	2025-06-28 05:01:22.128953	2025-06-28 05:01:22.128953
252	super_admin	VIEW_TRIPS	*	\N	2025-06-28 05:14:43.808547	2025-06-28 05:14:43.808547
253	super_admin	VIEW_TRIPS	*	\N	2025-06-28 05:17:25.594119	2025-06-28 05:17:25.594119
254	super_admin	VIEW_TRIPS	*	\N	2025-06-28 05:30:31.697147	2025-06-28 05:30:31.697147
255	super_admin	VIEW_TRIPS	*	\N	2025-06-28 05:48:24.855084	2025-06-28 05:48:24.855084
256	super_admin	VIEW_TRIPS	*	\N	2025-06-28 05:50:10.57333	2025-06-28 05:50:10.57333
257	super_admin	VIEW_TRIPS	*	\N	2025-06-28 05:51:28.363206	2025-06-28 05:51:28.363206
258	super_admin	VIEW_TRIPS	*	\N	2025-06-28 06:05:09.02889	2025-06-28 06:05:09.02889
259	super_admin	VIEW_TRIPS	*	\N	2025-06-28 06:06:12.346361	2025-06-28 06:06:12.346361
260	super_admin	VIEW_TRIPS	*	\N	2025-06-28 16:53:35.651623	2025-06-28 16:53:35.651623
261	super_admin	VIEW_TRIPS	*	\N	2025-06-28 19:31:20.717089	2025-06-28 19:31:20.717089
262	super_admin	VIEW_TRIPS	*	\N	2025-07-01 22:47:18.394051	2025-07-01 22:47:18.394051
263	super_admin	VIEW_TRIPS	*	\N	2025-07-02 00:20:55.478606	2025-07-02 00:20:55.478606
264	super_admin	VIEW_TRIPS	*	\N	2025-07-02 00:31:48.930371	2025-07-02 00:31:48.930371
265	super_admin	VIEW_TRIPS	*	\N	2025-07-02 00:36:55.485785	2025-07-02 00:36:55.485785
266	super_admin	VIEW_TRIPS	*	\N	2025-07-02 00:37:25.84133	2025-07-02 00:37:25.84133
267	super_admin	VIEW_TRIPS	*	\N	2025-07-02 00:41:47.564977	2025-07-02 00:41:47.564977
268	super_admin	VIEW_TRIPS	*	\N	2025-07-02 00:50:18.175241	2025-07-02 00:50:18.175241
269	super_admin	VIEW_TRIPS	*	\N	2025-07-02 00:51:48.237262	2025-07-02 00:51:48.237262
270	super_admin	VIEW_TRIPS	*	\N	2025-07-02 00:53:02.086434	2025-07-02 00:53:02.086434
271	super_admin	VIEW_TRIPS	*	\N	2025-07-02 01:03:47.89625	2025-07-02 01:03:47.89625
272	super_admin	VIEW_TRIPS	*	\N	2025-07-02 01:05:08.670401	2025-07-02 01:05:08.670401
273	super_admin	VIEW_TRIPS	*	\N	2025-07-02 05:04:58.888655	2025-07-02 05:04:58.888655
274	super_admin	VIEW_TRIPS	*	\N	2025-07-02 05:13:18.174227	2025-07-02 05:13:18.174227
275	super_admin	VIEW_TRIPS	*	\N	2025-07-02 05:37:55.56003	2025-07-02 05:37:55.56003
276	super_admin	VIEW_TRIPS	*	\N	2025-07-02 05:40:45.806862	2025-07-02 05:40:45.806862
277	super_admin	VIEW_TRIPS	*	\N	2025-07-02 18:16:12.274947	2025-07-02 18:16:12.274947
278	super_admin	VIEW_TRIPS	*	\N	2025-07-02 18:24:36.533791	2025-07-02 18:24:36.533791
279	super_admin	VIEW_TRIPS	*	\N	2025-07-02 18:45:14.640286	2025-07-02 18:45:14.640286
280	super_admin	VIEW_TRIPS	*	\N	2025-07-02 20:06:37.988827	2025-07-02 20:06:37.988827
281	super_admin	VIEW_TRIPS	*	\N	2025-07-02 21:33:05.483174	2025-07-02 21:33:05.483174
282	super_admin	VIEW_TRIPS	*	\N	2025-07-02 21:33:53.887245	2025-07-02 21:33:53.887245
283	super_admin	VIEW_TRIPS	*	\N	2025-07-02 21:35:43.749437	2025-07-02 21:35:43.749437
284	super_admin	VIEW_TRIPS	*	\N	2025-07-02 22:28:10.082471	2025-07-02 22:28:10.082471
285	super_admin	VIEW_TRIPS	*	\N	2025-07-02 22:39:57.115059	2025-07-02 22:39:57.115059
286	super_admin	VIEW_TRIPS	*	\N	2025-07-02 23:55:38.638775	2025-07-02 23:55:38.638775
287	super_admin	VIEW_TRIPS	*	\N	2025-07-03 00:11:51.469856	2025-07-03 00:11:51.469856
288	super_admin	VIEW_TRIPS	*	\N	2025-07-03 00:17:13.407329	2025-07-03 00:17:13.407329
289	super_admin	VIEW_TRIPS	*	\N	2025-07-03 00:21:14.308872	2025-07-03 00:21:14.308872
290	super_admin	VIEW_TRIPS	*	\N	2025-07-03 06:41:33.755477	2025-07-03 06:41:33.755477
291	super_admin	VIEW_TRIPS	*	\N	2025-07-05 22:23:42.953869	2025-07-05 22:23:42.953869
292	super_admin	VIEW_TRIPS	*	\N	2025-07-06 01:31:19.23477	2025-07-06 01:31:19.23477
293	super_admin	VIEW_TRIPS	*	\N	2025-07-06 02:11:35.397262	2025-07-06 02:11:35.397262
294	super_admin	VIEW_TRIPS	*	\N	2025-07-06 02:20:32.377763	2025-07-06 02:20:32.377763
295	super_admin	VIEW_TRIPS	*	\N	2025-07-06 02:21:17.835811	2025-07-06 02:21:17.835811
296	super_admin	VIEW_TRIPS	*	\N	2025-07-06 04:22:51.178973	2025-07-06 04:22:51.178973
297	super_admin	VIEW_TRIPS	*	\N	2025-07-06 04:34:02.247694	2025-07-06 04:34:02.247694
298	super_admin	VIEW_TRIPS	*	\N	2025-07-06 04:45:19.679584	2025-07-06 04:45:19.679584
299	super_admin	VIEW_TRIPS	*	\N	2025-07-06 04:54:33.598899	2025-07-06 04:54:33.598899
300	super_admin	VIEW_TRIPS	*	\N	2025-07-06 05:07:39.150443	2025-07-06 05:07:39.150443
301	super_admin	VIEW_TRIPS	*	\N	2025-07-06 07:38:28.594112	2025-07-06 07:38:28.594112
302	super_admin	VIEW_TRIPS	*	\N	2025-07-06 17:28:06.166177	2025-07-06 17:28:06.166177
303	super_admin	VIEW_TRIPS	*	\N	2025-07-06 21:16:32.036569	2025-07-06 21:16:32.036569
304	super_admin	VIEW_TRIPS	*	\N	2025-07-06 21:35:52.938987	2025-07-06 21:35:52.938987
305	super_admin	VIEW_TRIPS	*	\N	2025-07-06 21:37:56.968337	2025-07-06 21:37:56.968337
306	super_admin	VIEW_TRIPS	*	\N	2025-07-06 21:59:05.083999	2025-07-06 21:59:05.083999
307	super_admin	VIEW_TRIPS	*	\N	2025-07-06 22:15:11.081616	2025-07-06 22:15:11.081616
308	super_admin	VIEW_TRIPS	*	\N	2025-07-06 23:06:04.342185	2025-07-06 23:06:04.342185
309	super_admin	VIEW_TRIPS	*	\N	2025-07-06 23:14:10.854941	2025-07-06 23:14:10.854941
310	super_admin	VIEW_TRIPS	*	\N	2025-07-06 23:22:45.147015	2025-07-06 23:22:45.147015
311	super_admin	VIEW_TRIPS	*	\N	2025-07-06 23:27:35.494977	2025-07-06 23:27:35.494977
312	super_admin	VIEW_TRIPS	*	\N	2025-07-07 01:17:38.030744	2025-07-07 01:17:38.030744
313	super_admin	VIEW_TRIPS	*	\N	2025-07-07 03:21:48.132696	2025-07-07 03:21:48.132696
314	super_admin	VIEW_TRIPS	*	\N	2025-07-07 03:47:53.804421	2025-07-07 03:47:53.804421
315	super_admin	VIEW_TRIPS	*	\N	2025-07-07 03:48:59.252181	2025-07-07 03:48:59.252181
316	super_admin	VIEW_TRIPS	*	\N	2025-07-07 04:40:54.581026	2025-07-07 04:40:54.581026
317	super_admin	VIEW_TRIPS	*	\N	2025-07-07 05:07:41.88676	2025-07-07 05:07:41.88676
318	super_admin	VIEW_TRIPS	*	\N	2025-07-07 06:09:09.421128	2025-07-07 06:09:09.421128
319	super_admin	VIEW_TRIPS	*	\N	2025-07-07 06:10:05.01304	2025-07-07 06:10:05.01304
320	super_admin	VIEW_TRIPS	*	\N	2025-07-07 06:37:54.69797	2025-07-07 06:37:54.69797
321	super_admin	VIEW_TRIPS	*	\N	2025-07-07 06:51:53.197756	2025-07-07 06:51:53.197756
322	super_admin	VIEW_TRIPS	*	\N	2025-07-07 07:01:48.255048	2025-07-07 07:01:48.255048
323	super_admin	VIEW_TRIPS	*	\N	2025-07-07 07:04:15.266292	2025-07-07 07:04:15.266292
324	super_admin	VIEW_TRIPS	*	\N	2025-07-07 07:05:34.739209	2025-07-07 07:05:34.739209
325	super_admin	VIEW_TRIPS	*	\N	2025-07-07 11:57:15.911759	2025-07-07 11:57:15.911759
326	super_admin	VIEW_TRIPS	*	\N	2025-07-07 12:00:00.859842	2025-07-07 12:00:00.859842
327	super_admin	VIEW_TRIPS	*	\N	2025-07-07 12:04:29.438875	2025-07-07 12:04:29.438875
328	super_admin	VIEW_TRIPS	*	\N	2025-07-07 12:19:03.834538	2025-07-07 12:19:03.834538
329	super_admin	VIEW_TRIPS	*	\N	2025-07-07 12:23:28.611762	2025-07-07 12:23:28.611762
330	super_admin	VIEW_TRIPS	*	\N	2025-07-07 12:32:26.313368	2025-07-07 12:32:26.313368
331	super_admin	VIEW_TRIPS	*	\N	2025-07-07 12:52:03.756036	2025-07-07 12:52:03.756036
332	super_admin	VIEW_TRIPS	*	\N	2025-07-07 12:54:50.605716	2025-07-07 12:54:50.605716
333	super_admin	VIEW_TRIPS	*	\N	2025-07-07 13:26:42.210447	2025-07-07 13:26:42.210447
334	super_admin	VIEW_TRIPS	*	\N	2025-07-08 04:56:29.708485	2025-07-08 04:56:29.708485
335	super_admin	VIEW_TRIPS	*	\N	2025-07-08 05:04:12.657622	2025-07-08 05:04:12.657622
336	super_admin	VIEW_TRIPS	*	\N	2025-07-08 05:26:36.285341	2025-07-08 05:26:36.285341
337	super_admin	VIEW_TRIPS	*	\N	2025-07-08 05:27:13.929817	2025-07-08 05:27:13.929817
338	super_admin	VIEW_TRIPS	*	\N	2025-07-08 05:27:24.831346	2025-07-08 05:27:24.831346
339	super_admin	VIEW_TRIPS	*	\N	2025-07-08 05:30:52.424474	2025-07-08 05:30:52.424474
340	super_admin	VIEW_TRIPS	*	\N	2025-07-08 05:42:43.532846	2025-07-08 05:42:43.532846
341	super_admin	VIEW_TRIPS	*	\N	2025-07-08 06:56:01.229918	2025-07-08 06:56:01.229918
342	super_admin	VIEW_TRIPS	*	\N	2025-07-08 15:51:19.49699	2025-07-08 15:51:19.49699
343	super_admin	VIEW_TRIPS	*	\N	2025-07-08 16:44:40.278359	2025-07-08 16:44:40.278359
344	super_admin	VIEW_TRIPS	*	\N	2025-07-08 18:17:21.153608	2025-07-08 18:17:21.153608
345	super_admin	VIEW_TRIPS	*	\N	2025-07-08 18:22:59.07052	2025-07-08 18:22:59.07052
346	super_admin	VIEW_TRIPS	*	\N	2025-07-08 18:24:03.395159	2025-07-08 18:24:03.395159
347	super_admin	VIEW_TRIPS	*	\N	2025-07-08 19:33:55.051216	2025-07-08 19:33:55.051216
348	super_admin	VIEW_TRIPS	*	\N	2025-07-08 19:48:26.70217	2025-07-08 19:48:26.70217
349	super_admin	VIEW_TRIPS	*	\N	2025-07-08 19:53:43.510663	2025-07-08 19:53:43.510663
350	super_admin	VIEW_TRIPS	*	\N	2025-07-08 19:58:08.940074	2025-07-08 19:58:08.940074
351	super_admin	VIEW_TRIPS	*	\N	2025-07-08 21:58:53.971435	2025-07-08 21:58:53.971435
352	super_admin	VIEW_TRIPS	*	\N	2025-07-08 22:06:55.449308	2025-07-08 22:06:55.449308
353	super_admin	VIEW_TRIPS	*	\N	2025-07-08 22:10:07.711701	2025-07-08 22:10:07.711701
354	super_admin	VIEW_TRIPS	*	\N	2025-07-08 22:13:50.784465	2025-07-08 22:13:50.784465
355	super_admin	VIEW_TRIPS	*	\N	2025-07-08 22:16:14.384455	2025-07-08 22:16:14.384455
356	super_admin	VIEW_TRIPS	*	\N	2025-07-08 22:17:16.975412	2025-07-08 22:17:16.975412
357	super_admin	VIEW_TRIPS	*	\N	2025-07-08 22:17:43.980913	2025-07-08 22:17:43.980913
358	super_admin	VIEW_TRIPS	*	\N	2025-07-08 22:19:56.802579	2025-07-08 22:19:56.802579
359	super_admin	VIEW_TRIPS	*	\N	2025-07-08 22:20:53.444847	2025-07-08 22:20:53.444847
360	super_admin	VIEW_TRIPS	*	\N	2025-07-08 22:23:13.709336	2025-07-08 22:23:13.709336
361	super_admin	VIEW_TRIPS	*	\N	2025-07-08 22:23:28.791571	2025-07-08 22:23:28.791571
362	super_admin	VIEW_TRIPS	*	\N	2025-07-08 22:25:01.019613	2025-07-08 22:25:01.019613
363	super_admin	VIEW_TRIPS	*	\N	2025-07-08 23:16:45.268774	2025-07-08 23:16:45.268774
364	super_admin	VIEW_TRIPS	*	\N	2025-07-08 23:24:53.227582	2025-07-08 23:24:53.227582
365	super_admin	VIEW_TRIPS	*	\N	2025-07-08 23:25:06.970907	2025-07-08 23:25:06.970907
366	super_admin	VIEW_TRIPS	*	\N	2025-07-08 23:31:40.817278	2025-07-08 23:31:40.817278
367	super_admin	VIEW_TRIPS	*	\N	2025-07-08 23:33:57.540272	2025-07-08 23:33:57.540272
368	super_admin	VIEW_TRIPS	*	\N	2025-07-08 23:37:50.852005	2025-07-08 23:37:50.852005
369	super_admin	VIEW_TRIPS	*	\N	2025-07-08 23:38:21.034339	2025-07-08 23:38:21.034339
370	super_admin	VIEW_TRIPS	*	\N	2025-07-09 06:50:22.387479	2025-07-09 06:50:22.387479
371	super_admin	VIEW_TRIPS	*	\N	2025-07-09 07:19:46.649199	2025-07-09 07:19:46.649199
372	super_admin	VIEW_TRIPS	*	\N	2025-07-09 16:43:40.255739	2025-07-09 16:43:40.255739
373	super_admin	VIEW_TRIPS	*	\N	2025-07-09 19:36:35.004144	2025-07-09 19:36:35.004144
374	super_admin	VIEW_TRIPS	*	\N	2025-07-09 20:16:09.562726	2025-07-09 20:16:09.562726
375	super_admin	VIEW_TRIPS	*	\N	2025-07-09 20:19:47.538118	2025-07-09 20:19:47.538118
376	super_admin	VIEW_TRIPS	*	\N	2025-07-09 20:24:12.022814	2025-07-09 20:24:12.022814
377	super_admin	VIEW_TRIPS	*	\N	2025-07-09 20:26:53.56748	2025-07-09 20:26:53.56748
378	super_admin	VIEW_TRIPS	*	\N	2025-07-09 21:29:19.813634	2025-07-09 21:29:19.813634
379	super_admin	VIEW_TRIPS	*	\N	2025-07-09 21:55:15.664501	2025-07-09 21:55:15.664501
380	super_admin	VIEW_TRIPS	*	\N	2025-07-09 21:58:27.625041	2025-07-09 21:58:27.625041
381	super_admin	VIEW_TRIPS	*	\N	2025-07-09 22:36:17.224634	2025-07-09 22:36:17.224634
382	super_admin	VIEW_TRIPS	*	\N	2025-07-10 00:05:54.694777	2025-07-10 00:05:54.694777
383	super_admin	VIEW_TRIPS	*	\N	2025-07-10 04:15:01.05138	2025-07-10 04:15:01.05138
384	super_admin	VIEW_TRIPS	*	\N	2025-07-10 04:32:39.477342	2025-07-10 04:32:39.477342
385	super_admin	VIEW_TRIPS	*	\N	2025-07-10 05:19:20.049279	2025-07-10 05:19:20.049279
386	super_admin	VIEW_TRIPS	*	\N	2025-07-10 05:21:31.24091	2025-07-10 05:21:31.24091
387	super_admin	VIEW_TRIPS	*	\N	2025-07-10 05:22:07.011339	2025-07-10 05:22:07.011339
388	super_admin	VIEW_TRIPS	*	\N	2025-07-10 15:40:54.568923	2025-07-10 15:40:54.568923
389	super_admin	VIEW_TRIPS	*	\N	2025-07-10 16:06:03.291483	2025-07-10 16:06:03.291483
390	super_admin	VIEW_TRIPS	*	\N	2025-07-10 16:09:05.161077	2025-07-10 16:09:05.161077
391	super_admin	VIEW_TRIPS	*	\N	2025-07-10 16:21:47.258978	2025-07-10 16:21:47.258978
392	super_admin	VIEW_TRIPS	*	\N	2025-07-10 17:03:25.747369	2025-07-10 17:03:25.747369
393	super_admin	VIEW_TRIPS	*	\N	2025-07-10 17:03:25.845283	2025-07-10 17:03:25.845283
394	super_admin	VIEW_TRIPS	*	\N	2025-07-10 17:03:32.089924	2025-07-10 17:03:32.089924
395	super_admin	VIEW_TRIPS	*	\N	2025-07-10 17:03:45.005091	2025-07-10 17:03:45.005091
396	super_admin	VIEW_TRIPS	*	\N	2025-07-10 17:03:49.355672	2025-07-10 17:03:49.355672
397	super_admin	VIEW_TRIPS	*	\N	2025-07-10 17:20:22.224279	2025-07-10 17:20:22.224279
398	super_admin	VIEW_TRIPS	*	\N	2025-07-10 21:58:20.773404	2025-07-10 21:58:20.773404
399	super_admin	VIEW_TRIPS	*	\N	2025-07-10 22:14:22.376161	2025-07-10 22:14:22.376161
400	super_admin	VIEW_TRIPS	*	\N	2025-07-11 03:02:18.410687	2025-07-11 03:02:18.410687
401	super_admin	VIEW_TRIPS	*	\N	2025-07-11 07:55:10.506778	2025-07-11 07:55:10.506778
402	super_admin	VIEW_TRIPS	*	\N	2025-07-11 16:28:45.027021	2025-07-11 16:28:45.027021
403	super_admin	VIEW_TRIPS	*	\N	2025-07-11 17:34:16.997582	2025-07-11 17:34:16.997582
404	super_admin	VIEW_TRIPS	*	\N	2025-07-11 17:57:59.638667	2025-07-11 17:57:59.638667
405	super_admin	VIEW_TRIPS	*	\N	2025-07-12 01:52:19.168462	2025-07-12 01:52:19.168462
406	super_admin	VIEW_TRIPS	*	\N	2025-07-12 03:03:59.941997	2025-07-12 03:03:59.941997
407	super_admin	VIEW_TRIPS	*	\N	2025-07-12 04:25:41.746344	2025-07-12 04:25:41.746344
408	super_admin	VIEW_TRIPS	*	\N	2025-07-12 04:29:07.971263	2025-07-12 04:29:07.971263
409	super_admin	VIEW_TRIPS	*	\N	2025-07-12 04:30:08.707469	2025-07-12 04:30:08.707469
410	super_admin	VIEW_TRIPS	*	\N	2025-07-12 04:45:01.708072	2025-07-12 04:45:01.708072
411	super_admin	VIEW_TRIPS	*	\N	2025-07-12 04:46:30.699052	2025-07-12 04:46:30.699052
412	super_admin	VIEW_TRIPS	*	\N	2025-07-12 04:56:58.56498	2025-07-12 04:56:58.56498
413	super_admin	VIEW_TRIPS	*	\N	2025-07-12 05:03:26.199654	2025-07-12 05:03:26.199654
414	super_admin	VIEW_TRIPS	*	\N	2025-07-12 05:04:29.26055	2025-07-12 05:04:29.26055
415	super_admin	VIEW_TRIPS	*	\N	2025-07-12 05:10:54.147684	2025-07-12 05:10:54.147684
416	super_admin	VIEW_TRIPS	*	\N	2025-07-12 05:17:17.659786	2025-07-12 05:17:17.659786
417	super_admin	VIEW_TRIPS	*	\N	2025-07-12 05:21:49.044246	2025-07-12 05:21:49.044246
418	super_admin	VIEW_TRIPS	*	\N	2025-07-12 18:24:04.265827	2025-07-12 18:24:04.265827
419	super_admin	VIEW_TRIPS	*	\N	2025-07-17 18:34:22.711498	2025-07-17 18:34:22.711498
420	super_admin	VIEW_TRIPS	*	\N	2025-07-17 18:37:42.323838	2025-07-17 18:37:42.323838
421	super_admin	VIEW_TRIPS	*	\N	2025-07-27 18:04:11.584535	2025-07-27 18:04:11.584535
422	super_admin	VIEW_TRIPS	*	\N	2025-08-16 18:25:52.599414	2025-08-16 18:25:52.599414
423	super_admin	VIEW_TRIPS	*	\N	2025-08-16 18:30:16.789846	2025-08-16 18:30:16.789846
424	super_admin	VIEW_TRIPS	*	\N	2025-08-16 19:26:14.858945	2025-08-16 19:26:14.858945
425	super_admin	VIEW_TRIPS	*	\N	2025-09-13 04:55:14.380199	2025-09-13 04:55:14.380199
426	super_admin	VIEW_TRIPS	*	\N	2025-09-13 17:23:37.264716	2025-09-13 17:23:37.264716
427	super_admin	VIEW_TRIPS	*	\N	2025-09-13 17:26:59.449892	2025-09-13 17:26:59.449892
428	super_admin	VIEW_TRIPS	*	\N	2025-09-13 17:56:55.154279	2025-09-13 17:56:55.154279
429	super_admin	VIEW_TRIPS	*	\N	2025-09-13 18:11:38.537216	2025-09-13 18:11:38.537216
430	super_admin	VIEW_TRIPS	*	\N	2025-09-13 18:26:25.269029	2025-09-13 18:26:25.269029
431	super_admin	VIEW_TRIPS	*	\N	2025-09-13 18:38:18.580502	2025-09-13 18:38:18.580502
432	super_admin	VIEW_TRIPS	*	\N	2025-09-13 20:32:47.484561	2025-09-13 20:32:47.484561
433	super_admin	VIEW_TRIPS	*	\N	2025-09-13 21:45:48.687582	2025-09-13 21:45:48.687582
434	super_admin	VIEW_TRIPS	*	\N	2025-09-14 01:01:09.9882	2025-09-14 01:01:09.9882
435	super_admin	VIEW_TRIPS	*	\N	2025-09-14 01:04:25.507562	2025-09-14 01:04:25.507562
436	super_admin	VIEW_TRIPS	*	\N	2025-09-14 01:07:29.453098	2025-09-14 01:07:29.453098
437	super_admin	VIEW_TRIPS	*	\N	2025-09-14 01:24:17.584352	2025-09-14 01:24:17.584352
438	super_admin	VIEW_TRIPS	*	\N	2025-09-14 01:44:44.35159	2025-09-14 01:44:44.35159
439	super_admin	VIEW_TRIPS	*	\N	2025-09-14 03:29:26.745944	2025-09-14 03:29:26.745944
440	super_admin	VIEW_TRIPS	*	\N	2025-09-14 03:31:00.328117	2025-09-14 03:31:00.328117
441	super_admin	VIEW_TRIPS	*	\N	2025-09-14 04:49:07.194871	2025-09-14 04:49:07.194871
442	super_admin	VIEW_TRIPS	*	\N	2025-09-14 22:56:34.881572	2025-09-14 22:56:34.881572
443	super_admin	VIEW_TRIPS	*	\N	2025-09-15 00:49:56.035626	2025-09-15 00:49:56.035626
444	super_admin	VIEW_TRIPS	*	\N	2025-09-15 00:52:10.743372	2025-09-15 00:52:10.743372
445	super_admin	VIEW_TRIPS	*	\N	2025-09-15 01:01:34.721082	2025-09-15 01:01:34.721082
446	super_admin	VIEW_TRIPS	*	\N	2025-09-15 01:04:04.859798	2025-09-15 01:04:04.859798
447	super_admin	VIEW_TRIPS	*	\N	2025-09-15 01:04:44.201871	2025-09-15 01:04:44.201871
448	super_admin	VIEW_TRIPS	*	\N	2025-09-15 01:05:03.314136	2025-09-15 01:05:03.314136
449	super_admin	VIEW_TRIPS	*	\N	2025-09-15 01:41:19.478751	2025-09-15 01:41:19.478751
450	super_admin	VIEW_TRIPS	*	\N	2025-09-15 01:46:29.161225	2025-09-15 01:46:29.161225
451	super_admin	VIEW_TRIPS	*	\N	2025-09-15 01:47:28.340733	2025-09-15 01:47:28.340733
452	super_admin	VIEW_TRIPS	*	\N	2025-09-15 01:54:03.702105	2025-09-15 01:54:03.702105
453	super_admin	VIEW_TRIPS	*	\N	2025-09-15 15:30:50.405028	2025-09-15 15:30:50.405028
454	super_admin	VIEW_TRIPS	*	\N	2025-09-15 15:41:30.518296	2025-09-15 15:41:30.518296
455	super_admin	VIEW_TRIPS	*	\N	2025-09-15 15:56:03.236564	2025-09-15 15:56:03.236564
456	super_admin	VIEW_TRIPS	*	\N	2025-09-15 15:58:08.591709	2025-09-15 15:58:08.591709
457	super_admin	VIEW_TRIPS	*	\N	2025-09-15 16:25:09.071489	2025-09-15 16:25:09.071489
458	super_admin	VIEW_TRIPS	*	\N	2025-09-15 17:02:50.186976	2025-09-15 17:02:50.186976
459	super_admin	VIEW_TRIPS	*	\N	2025-09-15 17:10:16.897952	2025-09-15 17:10:16.897952
460	super_admin	VIEW_TRIPS	*	\N	2025-09-15 17:27:59.394492	2025-09-15 17:27:59.394492
461	super_admin	VIEW_TRIPS	*	\N	2025-09-15 17:29:45.824368	2025-09-15 17:29:45.824368
462	super_admin	VIEW_TRIPS	*	\N	2025-09-15 17:31:36.868219	2025-09-15 17:31:36.868219
463	super_admin	VIEW_TRIPS	*	\N	2025-09-15 18:05:30.347948	2025-09-15 18:05:30.347948
464	super_admin	VIEW_TRIPS	*	\N	2025-09-15 21:21:27.879885	2025-09-15 21:21:27.879885
465	super_admin	VIEW_TRIPS	*	\N	2025-09-15 21:25:42.288526	2025-09-15 21:25:42.288526
466	super_admin	VIEW_TRIPS	*	\N	2025-09-15 21:31:29.270012	2025-09-15 21:31:29.270012
467	super_admin	VIEW_TRIPS	*	\N	2025-09-15 21:34:03.46525	2025-09-15 21:34:03.46525
468	super_admin	VIEW_TRIPS	*	\N	2025-09-16 00:03:24.675223	2025-09-16 00:03:24.675223
469	super_admin	VIEW_TRIPS	*	\N	2025-09-16 00:04:52.167244	2025-09-16 00:04:52.167244
470	super_admin	VIEW_TRIPS	*	\N	2025-09-16 02:54:44.864692	2025-09-16 02:54:44.864692
471	super_admin	VIEW_TRIPS	*	\N	2025-09-16 03:58:36.247316	2025-09-16 03:58:36.247316
472	super_admin	VIEW_TRIPS	*	\N	2025-09-16 04:31:33.066611	2025-09-16 04:31:33.066611
473	super_admin	VIEW_TRIPS	*	\N	2025-09-16 05:01:14.032718	2025-09-16 05:01:14.032718
474	super_admin	VIEW_TRIPS	*	\N	2025-09-16 05:13:56.959491	2025-09-16 05:13:56.959491
475	super_admin	VIEW_TRIPS	*	\N	2025-09-16 05:15:32.033795	2025-09-16 05:15:32.033795
476	super_admin	VIEW_TRIPS	*	\N	2025-09-16 05:50:00.378209	2025-09-16 05:50:00.378209
477	super_admin	VIEW_TRIPS	*	\N	2025-09-16 16:35:03.987132	2025-09-16 16:35:03.987132
478	super_admin	VIEW_TRIPS	*	\N	2025-09-16 16:55:52.594202	2025-09-16 16:55:52.594202
479	super_admin	VIEW_TRIPS	*	\N	2025-09-16 17:48:52.191901	2025-09-16 17:48:52.191901
480	super_admin	VIEW_TRIPS	*	\N	2025-09-16 23:39:01.63531	2025-09-16 23:39:01.63531
481	super_admin	VIEW_TRIPS	*	\N	2025-09-16 23:58:46.366745	2025-09-16 23:58:46.366745
482	super_admin	VIEW_TRIPS	*	\N	2025-09-17 00:09:22.498785	2025-09-17 00:09:22.498785
483	super_admin	VIEW_TRIPS	*	\N	2025-09-17 00:23:34.68697	2025-09-17 00:23:34.68697
484	super_admin	VIEW_TRIPS	*	\N	2025-09-17 04:15:50.5284	2025-09-17 04:15:50.5284
485	super_admin	VIEW_TRIPS	*	\N	2025-09-17 05:13:51.352489	2025-09-17 05:13:51.352489
486	super_admin	VIEW_TRIPS	*	\N	2025-09-17 17:54:12.723415	2025-09-17 17:54:12.723415
487	super_admin	VIEW_TRIPS	*	\N	2025-09-17 17:59:41.309126	2025-09-17 17:59:41.309126
488	super_admin	VIEW_TRIPS	*	\N	2025-09-17 18:01:00.545481	2025-09-17 18:01:00.545481
489	super_admin	VIEW_TRIPS	*	\N	2025-09-17 18:04:21.249879	2025-09-17 18:04:21.249879
490	super_admin	VIEW_TRIPS	*	\N	2025-09-17 18:07:14.201541	2025-09-17 18:07:14.201541
491	super_admin	VIEW_TRIPS	*	\N	2025-09-17 18:10:42.692779	2025-09-17 18:10:42.692779
492	super_admin	VIEW_TRIPS	*	\N	2025-09-17 18:11:16.164443	2025-09-17 18:11:16.164443
493	super_admin	VIEW_TRIPS	*	\N	2025-09-17 18:12:36.925072	2025-09-17 18:12:36.925072
494	super_admin	VIEW_TRIPS	*	\N	2025-09-17 18:14:04.634521	2025-09-17 18:14:04.634521
495	super_admin	VIEW_TRIPS	*	\N	2025-09-17 18:15:55.989466	2025-09-17 18:15:55.989466
496	super_admin	VIEW_TRIPS	*	\N	2025-09-17 18:16:47.574647	2025-09-17 18:16:47.574647
497	super_admin	VIEW_TRIPS	*	\N	2025-09-17 18:16:53.728787	2025-09-17 18:16:53.728787
498	super_admin	VIEW_TRIPS	*	\N	2025-09-17 18:17:21.04209	2025-09-17 18:17:21.04209
499	super_admin	VIEW_TRIPS	*	\N	2025-09-17 18:20:49.909808	2025-09-17 18:20:49.909808
500	super_admin	VIEW_TRIPS	*	\N	2025-09-17 18:20:55.940425	2025-09-17 18:20:55.940425
501	super_admin	VIEW_TRIPS	*	\N	2025-09-17 18:21:10.172595	2025-09-17 18:21:10.172595
502	super_admin	VIEW_TRIPS	*	\N	2025-09-17 18:21:16.235122	2025-09-17 18:21:16.235122
\.


--
-- Data for Name: service_areas; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.service_areas (id, organization_id, nickname, description, boundary_coordinates, is_active, created_at, updated_at, street_address, city, state, zip_code, full_address) FROM stdin;
sa_b562c823-0196-489b-a3c6-6a05ab9c38d1	monarch_competency	Newton	Womens House, Office	\N	t	2025-06-18 04:55:08.195346	2025-06-18 05:49:26.487521	5335 Newton St	Denver	CO	80221	5335 Newton St, Denver, CO 80221
sa_5d995f17-d906-4f22-8848-8741ae17fa7e	monarch_competency	Lowell North	Mens House	\N	t	2025-06-18 06:22:06.930044	2025-06-18 06:22:06.930044	5241 Lowell Blvd	Denver	CO	80221	5241 Lowell Blvd, Denver, CO 80221
sa_0a6f98d4-c3ca-4a00-9af8-6515655e43aa	monarch_competency	Lowell South	Womens House	\N	t	2025-06-18 06:22:17.075862	2025-06-18 06:22:17.075862	5231 Lowell Blvd	Denver	CO	80221	5231 Lowell Blvd, Denver, CO 80221
sa_7dc16828-038f-4ae2-b4a2-e5ebd563c1f1	monarch_sober_living	Highland Sober Living	Sober living residential facility	\N	t	2025-06-18 06:39:14.249521	2025-06-18 06:39:14.249521	2145 S High St	Denver	CO	80210	2145 S High St, Denver, CO 80210
sa_f4e8b2a1-9c7d-4e3f-8b5a-2d1c9e6f4a8b	monarch_launch	RiNo Launch Center	Career launch and training facility	\N	t	2025-06-18 06:40:27.380345	2025-06-18 06:40:27.380345	3456 Walnut St	Denver	CO	80205	3456 Walnut St, Denver, CO 80205
sa_50aedb65-359e-4575-a94f-d629c9da2205	monarch_launch	Dakota Launch Center	Career launch and training facility - Dakota location	\N	t	2025-09-15 21:22:13.201629	2025-09-15 21:22:13.201629	6581 E. Dakota Ave.	Denver	CO	80224	6581 E. Dakota Ave. Denver, CO 80224
sa_9967a431-f3c8-4e42-bfa3-4087f52a1467	monarch_mental_health	Lakewood	Mental health residential facility	\N	t	2025-06-18 06:33:48.608335	2025-09-16 04:02:24.18688	1800 W 6th Ave	Lakewood	CO	80204	1800 W 6th Ave, Lakewood, CO 80204
sa_ac09c531-a768-4d89-ba60-6d671a98d324	monarch_sober_living	Arkansas	Sober Living Launch	\N	t	2025-09-16 04:03:23.199595	2025-09-16 04:03:23.199595	6590 W Arkansas Ave	Lakewood	CO	80213	6590 W Arkansas Ave, Lakewood, CO 80213
\.


--
-- Data for Name: service_areas_v2; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.service_areas_v2 (id, organization_id, nickname, description, boundary_coordinates, is_active, created_at, updated_at, street_address, city, state, zip_code, full_address) FROM stdin;
sa_v2_1758074431547_9qpnkn482	monarch_competency	Newton	Womens House, Office	\N	t	2025-06-18 04:55:08.195346	2025-06-18 05:49:26.487521	5335 Newton St	Denver	CO	80221	5335 Newton St, Denver, CO 80221
sa_v2_1758074431663_b78zoplrx	monarch_competency	Lowell North	Mens House	\N	t	2025-06-18 06:22:06.930044	2025-06-18 06:22:06.930044	5241 Lowell Blvd	Denver	CO	80221	5241 Lowell Blvd, Denver, CO 80221
sa_v2_1758074431767_xr6uvhb11	monarch_competency	Lowell South	Womens House	\N	t	2025-06-18 06:22:17.075862	2025-06-18 06:22:17.075862	5231 Lowell Blvd	Denver	CO	80221	5231 Lowell Blvd, Denver, CO 80221
sa_v2_1758074431877_ob5n21amr	monarch_mental_health	Lakewood	Mental health residential facility	\N	t	2025-06-18 06:33:48.608335	2025-09-16 04:02:24.18688	1800 W 6th Ave	Lakewood	CO	80204	1800 W 6th Ave, Lakewood, CO 80204
sa_v2_1758074432057_gr11aquy4	monarch_sober_living	Highland Sober Living	Sober living residential facility	\N	t	2025-06-18 06:39:14.249521	2025-06-18 06:39:14.249521	2145 S High St	Denver	CO	80210	2145 S High St, Denver, CO 80210
sa_v2_1758074432162_41osigil7	monarch_launch	RiNo Launch Center	Career launch and training facility	\N	t	2025-06-18 06:40:27.380345	2025-06-18 06:40:27.380345	3456 Walnut St	Denver	CO	80205	3456 Walnut St, Denver, CO 80205
sa_v2_1758074432262_bpr8jcyzc	monarch_launch	Dakota Launch Center	Career launch and training facility - Dakota location	\N	t	2025-09-15 21:22:13.201629	2025-09-15 21:22:13.201629	6581 E. Dakota Ave.	Denver	CO	80224	6581 E. Dakota Ave. Denver, CO 80224
sa_v2_1758074432368_0obe7b0pa	monarch_sober_living	Arkansas	Sober Living Launch	\N	t	2025-09-16 04:03:23.199595	2025-09-16 04:03:23.199595	6590 W Arkansas Ave	Lakewood	CO	80213	6590 W Arkansas Ave, Lakewood, CO 80213
\.


--
-- Data for Name: system_settings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.system_settings (id, app_name, main_logo_url, created_at, updated_at) FROM stdin;
app_settings	Amish Limo Service	\N	2025-06-27 20:26:50.743026	2025-06-27 20:26:50.743026
\.


--
-- Data for Name: trip_creation_rules; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.trip_creation_rules (id, integration_id, organization_id, trip_type, pickup_offset_minutes, default_pickup_location, requires_approval, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: trips; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.trips (id, organization_id, client_id, driver_id, trip_type, pickup_address, dropoff_address, scheduled_pickup_time, scheduled_return_time, actual_pickup_time, actual_dropoff_time, actual_return_time, passenger_count, special_requirements, status, notes, created_at, updated_at, pickup_location, dropoff_location, scheduled_dropoff_time, vehicle_id, recurring_trip_id, is_recurring, client_group_id, created_by, group_name, start_latitude, start_longitude, end_latitude, end_longitude, distance_miles, fuel_cost, driver_notes) FROM stdin;
trip_monarch_mental_health_001	monarch_mental_health	client_002	\N	one_way	111 main st denver, co 80001	222 main st denver, co 80002	2025-06-21 15:33:00	\N	\N	\N	\N	1	\N	scheduled	\N	2025-06-13 21:33:47.166	2025-06-18 08:00:46.043281	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
trip_sl_1	monarch_sober_living	client_003	\N	one_way	300 University City Blvd, Charlotte, NC	Recovery Support Center	2025-06-15 20:08:09.735462	\N	\N	\N	\N	1	\N	scheduled	Recovery program meeting - driver TBD	2025-06-11 07:08:09.735462	2025-06-11 07:08:09.735462	\N	\N	2025-06-15 21:08:09.735462+00	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
trip_launch_1	monarch_launch	client_004	\N	one_way	400 Launch Ave, Charlotte, NC	Employment Center, 987 Career Blvd	2025-06-16 19:08:09.735462	\N	\N	\N	\N	1	\N	scheduled	Job training session - driver TBD	2025-06-10 07:08:09.735462	2025-06-10 07:08:09.735462	\N	\N	2025-06-16 20:08:09.735462+00	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
trip_1752091519734_u20tjqn2e_w0	monarch_competency	\N	\N	round_trip	5241 Lowell Blvd, Denver, CO 80221	2239 Champa St, Denver, CO 80205	2025-07-15 13:00:00	\N	\N	\N	\N	1	\N	scheduled	\N	2025-07-09 20:05:19.783619	2025-07-09 20:05:19.783619	\N	\N	\N	\N	recurring_trip_1752091519628_le658s000	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
trip_1752091519734_72atf1nbw_w1	monarch_competency	\N	\N	round_trip	5241 Lowell Blvd, Denver, CO 80221	2239 Champa St, Denver, CO 80205	2025-07-22 13:00:00	\N	\N	\N	\N	1	\N	scheduled	\N	2025-07-09 20:05:19.783619	2025-07-09 20:05:19.783619	\N	\N	\N	\N	recurring_trip_1752091519628_le658s000	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
trip_1752091519734_smvr3qsdt_w2	monarch_competency	\N	\N	round_trip	5241 Lowell Blvd, Denver, CO 80221	2239 Champa St, Denver, CO 80205	2025-07-29 13:00:00	\N	\N	\N	\N	1	\N	scheduled	\N	2025-07-09 20:05:19.783619	2025-07-09 20:05:19.783619	\N	\N	\N	\N	recurring_trip_1752091519628_le658s000	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
trip_1752091519734_ic2ojo8rf_w3	monarch_competency	\N	\N	round_trip	5241 Lowell Blvd, Denver, CO 80221	2239 Champa St, Denver, CO 80205	2025-08-05 13:00:00	\N	\N	\N	\N	1	\N	scheduled	\N	2025-07-09 20:05:19.783619	2025-07-09 20:05:19.783619	\N	\N	\N	\N	recurring_trip_1752091519628_le658s000	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
trip_1752091519734_lq64vvz9p_w4	monarch_competency	\N	\N	round_trip	5241 Lowell Blvd, Denver, CO 80221	2239 Champa St, Denver, CO 80205	2025-08-12 13:00:00	\N	\N	\N	\N	1	\N	scheduled	\N	2025-07-09 20:05:19.783619	2025-07-09 20:05:19.783619	\N	\N	\N	\N	recurring_trip_1752091519628_le658s000	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
trip_1752091519734_jg5yke5oy_w5	monarch_competency	\N	\N	round_trip	5241 Lowell Blvd, Denver, CO 80221	2239 Champa St, Denver, CO 80205	2025-08-19 13:00:00	\N	\N	\N	\N	1	\N	scheduled	\N	2025-07-09 20:05:19.783619	2025-07-09 20:05:19.783619	\N	\N	\N	\N	recurring_trip_1752091519628_le658s000	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
trip_1752091519734_161xhn736_w6	monarch_competency	\N	\N	round_trip	5241 Lowell Blvd, Denver, CO 80221	2239 Champa St, Denver, CO 80205	2025-08-26 13:00:00	\N	\N	\N	\N	1	\N	scheduled	\N	2025-07-09 20:05:19.783619	2025-07-09 20:05:19.783619	\N	\N	\N	\N	recurring_trip_1752091519628_le658s000	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
trip_1752091519734_3p8fo63zi_w7	monarch_competency	\N	\N	round_trip	5241 Lowell Blvd, Denver, CO 80221	2239 Champa St, Denver, CO 80205	2025-09-02 13:00:00	\N	\N	\N	\N	1	\N	scheduled	\N	2025-07-09 20:05:19.783619	2025-07-09 20:05:19.783619	\N	\N	\N	\N	recurring_trip_1752091519628_le658s000	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
trip_1750835511441_qyklks72t	monarch_competency	client_1750785580055_ipbgnehzd	driver_55476c50-ef1a-4244-9a71-e46bf2eae9ff	round_trip	5335 Newton St, Denver, CO 80221	1575 Sherman St, Denver, CO 80203	2025-07-03 14:00:00	2025-07-03 16:30:00	\N	\N	\N	1	\N	confirmed	\N	2025-06-25 07:11:51.441	2025-07-02 22:10:45.243014	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
trip_monarch_mental_health_002	monarch_mental_health	client_002	driver_3a7ff0fb-3f54-4943-8c97-6ced934ab2d6	one_way	111 main st	333 main st	2025-06-26 13:00:00	\N	\N	\N	\N	1	\N	scheduled	\N	2025-06-13 23:45:36.95	2025-06-20 04:53:09.378938	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
trip_1752091649710_prc0doenn_w0	monarch_competency	\N	\N	round_trip	5241 Lowell Blvd, Denver, CO 80221	2239 Champa St, Denver, CO 80205	2025-07-09 13:00:00	\N	\N	\N	\N	1	\N	scheduled	\N	2025-07-09 20:07:29.764379	2025-07-09 20:07:29.764379	\N	\N	\N	\N	recurring_trip_1752091649621_yfhjz31q2	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
trip_1752091649710_ps7b66s0y_w1	monarch_competency	\N	\N	round_trip	5241 Lowell Blvd, Denver, CO 80221	2239 Champa St, Denver, CO 80205	2025-07-16 13:00:00	\N	\N	\N	\N	1	\N	scheduled	\N	2025-07-09 20:07:29.764379	2025-07-09 20:07:29.764379	\N	\N	\N	\N	recurring_trip_1752091649621_yfhjz31q2	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
trip_1752091649710_comj4t26z_w2	monarch_competency	\N	\N	round_trip	5241 Lowell Blvd, Denver, CO 80221	2239 Champa St, Denver, CO 80205	2025-07-23 13:00:00	\N	\N	\N	\N	1	\N	scheduled	\N	2025-07-09 20:07:29.764379	2025-07-09 20:07:29.764379	\N	\N	\N	\N	recurring_trip_1752091649621_yfhjz31q2	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
trip_1752091649710_buywnp8xv_w3	monarch_competency	\N	\N	round_trip	5241 Lowell Blvd, Denver, CO 80221	2239 Champa St, Denver, CO 80205	2025-07-30 13:00:00	\N	\N	\N	\N	1	\N	scheduled	\N	2025-07-09 20:07:29.764379	2025-07-09 20:07:29.764379	\N	\N	\N	\N	recurring_trip_1752091649621_yfhjz31q2	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
trip_1752091649710_nvorczxij_w4	monarch_competency	\N	\N	round_trip	5241 Lowell Blvd, Denver, CO 80221	2239 Champa St, Denver, CO 80205	2025-08-06 13:00:00	\N	\N	\N	\N	1	\N	scheduled	\N	2025-07-09 20:07:29.764379	2025-07-09 20:07:29.764379	\N	\N	\N	\N	recurring_trip_1752091649621_yfhjz31q2	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
trip_1752091649710_8xrmos0w9_w5	monarch_competency	\N	\N	round_trip	5241 Lowell Blvd, Denver, CO 80221	2239 Champa St, Denver, CO 80205	2025-08-13 13:00:00	\N	\N	\N	\N	1	\N	scheduled	\N	2025-07-09 20:07:29.764379	2025-07-09 20:07:29.764379	\N	\N	\N	\N	recurring_trip_1752091649621_yfhjz31q2	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
trip_1752091649710_sm30kpto7_w6	monarch_competency	\N	\N	round_trip	5241 Lowell Blvd, Denver, CO 80221	2239 Champa St, Denver, CO 80205	2025-08-20 13:00:00	\N	\N	\N	\N	1	\N	scheduled	\N	2025-07-09 20:07:29.764379	2025-07-09 20:07:29.764379	\N	\N	\N	\N	recurring_trip_1752091649621_yfhjz31q2	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
trip_1752091649710_fuujbtkto_w7	monarch_competency	\N	\N	round_trip	5241 Lowell Blvd, Denver, CO 80221	2239 Champa St, Denver, CO 80205	2025-08-27 13:00:00	\N	\N	\N	\N	1	\N	scheduled	\N	2025-07-09 20:07:29.764379	2025-07-09 20:07:29.764379	\N	\N	\N	\N	recurring_trip_1752091649621_yfhjz31q2	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
trip_1752090429069_8z2mq4alo	monarch_competency	client_1752090113362_gi6azlxux	driver_55476c50-ef1a-4244-9a71-e46bf2eae9ff	round_trip	5241 Lowell Blvd, Denver, CO 80221	100 Jefferson County Pkwy, Golden, CO 80401	2025-08-07 11:00:00	2025-08-07 11:00:00	\N	\N	\N	1	\N	scheduled	\N	2025-07-09 19:47:09.069	2025-07-09 19:47:09.069	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
trip_1752091783626_q9al7c3m1_w0	monarch_competency	\N	\N	one_way	5241 Lowell Blvd, Denver, CO 80221	5957 W 44th Ave, Lakeside, CO 80212	2025-07-10 13:00:00	\N	\N	\N	\N	1	\N	scheduled	\N	2025-07-09 20:09:43.73167	2025-07-09 20:09:43.73167	\N	\N	\N	\N	recurring_trip_1752091783545_z3zn9fhu0	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
trip_1752091783626_ecsd15xnp_w1	monarch_competency	\N	\N	one_way	5241 Lowell Blvd, Denver, CO 80221	5957 W 44th Ave, Lakeside, CO 80212	2025-07-17 13:00:00	\N	\N	\N	\N	1	\N	scheduled	\N	2025-07-09 20:09:43.73167	2025-07-09 20:09:43.73167	\N	\N	\N	\N	recurring_trip_1752091783545_z3zn9fhu0	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
trip_1752091783626_jn9v3z9bl_w2	monarch_competency	\N	\N	one_way	5241 Lowell Blvd, Denver, CO 80221	5957 W 44th Ave, Lakeside, CO 80212	2025-07-24 13:00:00	\N	\N	\N	\N	1	\N	scheduled	\N	2025-07-09 20:09:43.73167	2025-07-09 20:09:43.73167	\N	\N	\N	\N	recurring_trip_1752091783545_z3zn9fhu0	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
trip_1752091783626_1mvn8tce2_w3	monarch_competency	\N	\N	one_way	5241 Lowell Blvd, Denver, CO 80221	5957 W 44th Ave, Lakeside, CO 80212	2025-07-31 13:00:00	\N	\N	\N	\N	1	\N	scheduled	\N	2025-07-09 20:09:43.73167	2025-07-09 20:09:43.73167	\N	\N	\N	\N	recurring_trip_1752091783545_z3zn9fhu0	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
trip_1752091783626_v8z6316re_w4	monarch_competency	\N	\N	one_way	5241 Lowell Blvd, Denver, CO 80221	5957 W 44th Ave, Lakeside, CO 80212	2025-08-07 13:00:00	\N	\N	\N	\N	1	\N	scheduled	\N	2025-07-09 20:09:43.73167	2025-07-09 20:09:43.73167	\N	\N	\N	\N	recurring_trip_1752091783545_z3zn9fhu0	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
trip_1752091783626_1pkkrr9w9_w5	monarch_competency	\N	\N	one_way	5241 Lowell Blvd, Denver, CO 80221	5957 W 44th Ave, Lakeside, CO 80212	2025-08-14 13:00:00	\N	\N	\N	\N	1	\N	scheduled	\N	2025-07-09 20:09:43.73167	2025-07-09 20:09:43.73167	\N	\N	\N	\N	recurring_trip_1752091783545_z3zn9fhu0	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
trip_1752091783626_zz4k5qbxs_w6	monarch_competency	\N	\N	one_way	5241 Lowell Blvd, Denver, CO 80221	5957 W 44th Ave, Lakeside, CO 80212	2025-08-21 13:00:00	\N	\N	\N	\N	1	\N	scheduled	\N	2025-07-09 20:09:43.73167	2025-07-09 20:09:43.73167	\N	\N	\N	\N	recurring_trip_1752091783545_z3zn9fhu0	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
trip_1752091783626_xtoqj3ncu_w7	monarch_competency	\N	\N	one_way	5241 Lowell Blvd, Denver, CO 80221	5957 W 44th Ave, Lakeside, CO 80212	2025-08-28 13:00:00	\N	\N	\N	\N	1	\N	scheduled	\N	2025-07-09 20:09:43.73167	2025-07-09 20:09:43.73167	\N	\N	\N	\N	recurring_trip_1752091783545_z3zn9fhu0	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
trip_1751417876873_bimgmj8ij	monarch_competency	client_1751417752798_93ulnpqf0	driver_jessica_001	round_trip	5335 Newton St, Denver, CO 80221	4000 Justice Way. Castle Rock, CO 80109	2025-08-04 11:00:00	2025-08-04 13:00:00	\N	\N	\N	1	\N	confirmed	\N	2025-07-02 00:57:56.873	2025-09-15 21:50:29.239936	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
trip_1750863695238_c6ihg3dr1	monarch_competency	client_1750785580055_ipbgnehzd	driver_55476c50-ef1a-4244-9a71-e46bf2eae9ff	round_trip	5335 Newton St, Denver, CO 80221	4755 Paris St ste 120. Denver, CO 80239	2025-06-30 12:45:00	2025-06-30 15:15:00	\N	\N	\N	1	\N	scheduled	\N	2025-06-25 15:01:35.238	2025-06-25 15:01:35.238	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
trip_1752090628232_3u8606nyk	monarch_competency	client_1752090490406_vwwdrmtm2	driver_55476c50-ef1a-4244-9a71-e46bf2eae9ff	round_trip	5231 Lowell Blvd, Denver, CO 80221	520 W Colfax Ave, Denver, CO 80204	2025-07-10 07:45:00	2025-07-10 08:30:00	\N	\N	\N	1	\N	scheduled	\N	2025-07-09 19:50:28.232	2025-07-09 19:50:28.232	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
trip_1752091835860_y28q5i5bo_w0	monarch_competency	\N	\N	one_way	5241 Lowell Blvd, Denver, CO 80221	5957 W 44th Ave, Lakeside, CO 80212	2025-07-11 13:00:00	\N	\N	\N	\N	1	\N	scheduled	\N	2025-07-09 20:10:35.912137	2025-07-09 20:10:35.912137	\N	\N	\N	\N	recurring_trip_1752091835773_lwbw8or7q	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
trip_1752091835860_aayauvt9r_w1	monarch_competency	\N	\N	one_way	5241 Lowell Blvd, Denver, CO 80221	5957 W 44th Ave, Lakeside, CO 80212	2025-07-18 13:00:00	\N	\N	\N	\N	1	\N	scheduled	\N	2025-07-09 20:10:35.912137	2025-07-09 20:10:35.912137	\N	\N	\N	\N	recurring_trip_1752091835773_lwbw8or7q	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
trip_1752091835860_dsdkxsgkc_w2	monarch_competency	\N	\N	one_way	5241 Lowell Blvd, Denver, CO 80221	5957 W 44th Ave, Lakeside, CO 80212	2025-07-25 13:00:00	\N	\N	\N	\N	1	\N	scheduled	\N	2025-07-09 20:10:35.912137	2025-07-09 20:10:35.912137	\N	\N	\N	\N	recurring_trip_1752091835773_lwbw8or7q	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
trip_1752091835860_5foyntat1_w3	monarch_competency	\N	\N	one_way	5241 Lowell Blvd, Denver, CO 80221	5957 W 44th Ave, Lakeside, CO 80212	2025-08-01 13:00:00	\N	\N	\N	\N	1	\N	scheduled	\N	2025-07-09 20:10:35.912137	2025-07-09 20:10:35.912137	\N	\N	\N	\N	recurring_trip_1752091835773_lwbw8or7q	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
trip_1752091835860_dyae1gg9x_w4	monarch_competency	\N	\N	one_way	5241 Lowell Blvd, Denver, CO 80221	5957 W 44th Ave, Lakeside, CO 80212	2025-08-08 13:00:00	\N	\N	\N	\N	1	\N	scheduled	\N	2025-07-09 20:10:35.912137	2025-07-09 20:10:35.912137	\N	\N	\N	\N	recurring_trip_1752091835773_lwbw8or7q	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
trip_1752091835860_kz2hgvp61_w5	monarch_competency	\N	\N	one_way	5241 Lowell Blvd, Denver, CO 80221	5957 W 44th Ave, Lakeside, CO 80212	2025-08-15 13:00:00	\N	\N	\N	\N	1	\N	scheduled	\N	2025-07-09 20:10:35.912137	2025-07-09 20:10:35.912137	\N	\N	\N	\N	recurring_trip_1752091835773_lwbw8or7q	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
trip_1752091835860_pyno9yxnn_w6	monarch_competency	\N	\N	one_way	5241 Lowell Blvd, Denver, CO 80221	5957 W 44th Ave, Lakeside, CO 80212	2025-08-22 13:00:00	\N	\N	\N	\N	1	\N	scheduled	\N	2025-07-09 20:10:35.912137	2025-07-09 20:10:35.912137	\N	\N	\N	\N	recurring_trip_1752091835773_lwbw8or7q	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
trip_1752091835860_f4zav9gpb_w7	monarch_competency	\N	\N	one_way	5241 Lowell Blvd, Denver, CO 80221	5957 W 44th Ave, Lakeside, CO 80212	2025-08-29 13:00:00	\N	\N	\N	\N	1	\N	scheduled	\N	2025-07-09 20:10:35.912137	2025-07-09 20:10:35.912137	\N	\N	\N	\N	recurring_trip_1752091835773_lwbw8or7q	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
trip_1752091248385_tkgksbabx	monarch_competency	client_1751417752798_93ulnpqf0	driver_55476c50-ef1a-4244-9a71-e46bf2eae9ff	round_trip	5335 Newton St, Denver, CO 80221	4000 Justice Way. Castle Rock, CO 80109	2025-08-04 11:00:00	2025-08-04 10:30:00	\N	\N	\N	1	\N	scheduled	\N	2025-07-09 20:00:48.385	2025-07-09 20:00:48.385	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
trip_1757892849888_q260q4shc_w0	monarch_competency	\N	\N	round_trip	5241 Lowell Blvd, Denver, CO 80221	2239 Champa St, Denver, CO 80205	2025-09-16 19:00:00	\N	\N	\N	\N	1	\N	scheduled	\N	2025-09-14 23:34:10.027058	2025-09-14 23:34:10.027058	\N	\N	\N	\N	recurring_trip_1757892849738_k6qmqpjuw	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
trip_1757892849888_desqmcvt2_w1	monarch_competency	\N	\N	round_trip	5241 Lowell Blvd, Denver, CO 80221	2239 Champa St, Denver, CO 80205	2025-09-23 19:00:00	\N	\N	\N	\N	1	\N	scheduled	\N	2025-09-14 23:34:10.027058	2025-09-14 23:34:10.027058	\N	\N	\N	\N	recurring_trip_1757892849738_k6qmqpjuw	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
trip_1757892849888_2zbd210fb_w2	monarch_competency	\N	\N	round_trip	5241 Lowell Blvd, Denver, CO 80221	2239 Champa St, Denver, CO 80205	2025-09-30 19:00:00	\N	\N	\N	\N	1	\N	scheduled	\N	2025-09-14 23:34:10.027058	2025-09-14 23:34:10.027058	\N	\N	\N	\N	recurring_trip_1757892849738_k6qmqpjuw	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
trip_1757892849888_e7fgeoiry_w3	monarch_competency	\N	\N	round_trip	5241 Lowell Blvd, Denver, CO 80221	2239 Champa St, Denver, CO 80205	2025-10-07 19:00:00	\N	\N	\N	\N	1	\N	scheduled	\N	2025-09-14 23:34:10.027058	2025-09-14 23:34:10.027058	\N	\N	\N	\N	recurring_trip_1757892849738_k6qmqpjuw	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
\.


--
-- Data for Name: trips_v2; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.trips_v2 (id, trip_number, organization_id, client_id, driver_id, service_area_id, trip_type, status, pickup_address, dropoff_address, pickup_coordinates, dropoff_coordinates, scheduled_pickup_time, scheduled_dropoff_time, scheduled_return_time, actual_pickup_time, actual_dropoff_time, actual_return_time, passenger_count, special_requirements, notes, is_recurring, recurrence_pattern, recurrence_end_date, created_by, updated_by, is_active, created_at, updated_at) FROM stdin;
e548540a-8a55-416c-81b5-2b45eeb45dc4	T-1758067169902-IVXWCP	monarch_launch	63387414-0a2d-415e-b239-9d53d181a12c	\N	\N	one_way	scheduled	400 Launch Ave, Charlotte, NC	Employment Center, 987 Career Blvd	\N	\N	2025-06-16 19:08:09.735462	2025-06-16 20:08:09.735462	\N	\N	\N	\N	1	\N	Job training session - driver TBD	f	\N	\N	\N	\N	t	2025-06-10 07:08:09.735462	2025-06-10 07:08:09.735462
5d77d988-f016-4659-8bdc-d180e9c1352a	T-1758067169997-8DK3JP	monarch_sober_living	2da019e7-16ee-49a9-a16d-2e157fd25209	\N	\N	one_way	scheduled	300 University City Blvd, Charlotte, NC	Recovery Support Center	\N	\N	2025-06-15 20:08:09.735462	2025-06-15 21:08:09.735462	\N	\N	\N	\N	1	\N	Recovery program meeting - driver TBD	f	\N	\N	\N	\N	t	2025-06-11 07:08:09.735462	2025-06-11 07:08:09.735462
70060080-42c2-4d32-92f5-1c3bf18c2b54	T-1758067170100-SYRJBR	monarch_mental_health	1fb08d13-7f64-45db-940f-cbbba71113cf	\N	\N	one_way	scheduled	111 main st denver, co 80001	222 main st denver, co 80002	\N	\N	2025-06-21 15:33:00	\N	\N	\N	\N	\N	1	\N	\N	f	\N	\N	\N	\N	t	2025-06-13 21:33:47.166	2025-06-18 08:00:46.043281
7b15676b-f337-4cfd-9c4b-d308767f15f2	T-1758067170203-7YCC47	monarch_mental_health	1fb08d13-7f64-45db-940f-cbbba71113cf	\N	\N	one_way	scheduled	111 main st	333 main st	\N	\N	2025-06-26 13:00:00	\N	\N	\N	\N	\N	1	\N	\N	f	\N	\N	\N	\N	t	2025-06-13 23:45:36.95	2025-06-20 04:53:09.378938
e3656cdc-bc33-4459-92c9-69459f8e760f	T-1758067170310-O27AMK	monarch_competency	0dc14602-6720-41af-8e1f-13f214447efb	\N	\N	round_trip	confirmed	5335 Newton St, Denver, CO 80221	1575 Sherman St, Denver, CO 80203	\N	\N	2025-07-03 14:00:00	\N	2025-07-03 16:30:00	\N	\N	\N	1	\N	\N	f	\N	\N	\N	\N	t	2025-06-25 07:11:51.441	2025-07-02 22:10:45.243014
2f19fc52-ff4e-49fa-99ea-65e0da1fe66b	T-1758067170412-CXGMJ9	monarch_competency	0dc14602-6720-41af-8e1f-13f214447efb	\N	\N	round_trip	scheduled	5335 Newton St, Denver, CO 80221	4755 Paris St ste 120. Denver, CO 80239	\N	\N	2025-06-30 12:45:00	\N	2025-06-30 15:15:00	\N	\N	\N	1	\N	\N	f	\N	\N	\N	\N	t	2025-06-25 15:01:35.238	2025-06-25 15:01:35.238
f5ad6c2f-ca1c-4206-8716-c428471643e6	T-1758067170532-FU6OK1	monarch_competency	2ee20ce4-ed80-4648-b8fe-b63e925349ec	\N	\N	round_trip	confirmed	5335 Newton St, Denver, CO 80221	4000 Justice Way. Castle Rock, CO 80109	\N	\N	2025-08-04 11:00:00	\N	2025-08-04 13:00:00	\N	\N	\N	1	\N	\N	f	\N	\N	\N	\N	t	2025-07-02 00:57:56.873	2025-09-15 21:50:29.239936
b3aad727-1780-4f81-a8f7-8068c588618b	T-1758067170659-SZTKRG	monarch_competency	09784652-c5ef-437d-8f6e-d411678fd4cc	\N	\N	round_trip	scheduled	5241 Lowell Blvd, Denver, CO 80221	100 Jefferson County Pkwy, Golden, CO 80401	\N	\N	2025-08-07 11:00:00	\N	2025-08-07 11:00:00	\N	\N	\N	1	\N	\N	f	\N	\N	\N	\N	t	2025-07-09 19:47:09.069	2025-07-09 19:47:09.069
ae52b5ab-67b4-4604-9a53-76919536a4cf	T-1758067170769-7YJMK0	monarch_competency	74dabca0-8fb1-4493-88a3-f38489f4d317	\N	\N	round_trip	scheduled	5231 Lowell Blvd, Denver, CO 80221	520 W Colfax Ave, Denver, CO 80204	\N	\N	2025-07-10 07:45:00	\N	2025-07-10 08:30:00	\N	\N	\N	1	\N	\N	f	\N	\N	\N	\N	t	2025-07-09 19:50:28.232	2025-07-09 19:50:28.232
ada40ba4-83a4-4362-82ec-36e983c53ad1	T-1758067170874-Q9IZYP	monarch_competency	2ee20ce4-ed80-4648-b8fe-b63e925349ec	\N	\N	round_trip	scheduled	5335 Newton St, Denver, CO 80221	4000 Justice Way. Castle Rock, CO 80109	\N	\N	2025-08-04 11:00:00	\N	2025-08-04 10:30:00	\N	\N	\N	1	\N	\N	f	\N	\N	\N	\N	t	2025-07-09 20:00:48.385	2025-07-09 20:00:48.385
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (user_id, user_name, email, password_hash, role, primary_organization_id, authorized_organizations, is_active, created_at, updated_at, avatar_url, phone_number, billing_pin) FROM stdin;
test_user_001	John Driver	testdriver@example.com	$2b$10$dummyhashfortest	driver	\N	{}	t	2025-06-12 15:07:20.820028	2025-06-12 15:07:20.820028	\N	\N	\N
booking_kiosk_user	Booking Kiosk	booking@monarch.com	$2b$10$8N7NlII0xVqFdwMOSvY4ce.vzJxDLWG8MNHWAP/t1szAfnVq1.etC	organization_user	monarch_competency	{monarch_competency,monarch_mental_health,monarch_sober_living,monarch_launch}	t	2025-06-13 02:30:30.298126	2025-06-13 02:30:30.298126	\N	\N	\N
driver_sarah_williams	Sarah Williams	sarah.williams@monarch.org	$2b$10$Hq5P5z1oLKzEm9E5yLcY0eU8dR7dDGjGnA2oKWoA5J5Zs9I6Ly/gK	driver	monarch_competency	{monarch_competency}	t	2025-06-13 06:07:04.508394	2025-06-13 06:07:04.508394	\N	\N	\N
driver_michael_brown	Michael Brown	michael.brown@monarch.org	$2b$10$Hq5P5z1oLKzEm9E5yLcY0eU8dR7dDGjGnA2oKWoA5J5Zs9I6Ly/gK	driver	monarch_competency	{monarch_competency}	t	2025-06-13 06:07:04.508394	2025-06-13 06:07:04.508394	\N	\N	\N
driver_jennifer_davis	Jennifer Davis	jennifer.davis@monarch.org	$2b$10$Hq5P5z1oLKzEm9E5yLcY0eU8dR7dDGjGnA2oKWoA5J5Zs9I6Ly/gK	driver	monarch_mental_health	{monarch_mental_health}	t	2025-06-13 06:07:04.508394	2025-06-13 06:07:04.508394	\N	\N	\N
driver_robert_miller	Robert Miller	robert.miller@monarch.org	$2b$10$Hq5P5z1oLKzEm9E5yLcY0eU8dR7dDGjGnA2oKWoA5J5Zs9I6Ly/gK	driver	monarch_mental_health	{monarch_mental_health}	t	2025-06-13 06:07:04.508394	2025-06-13 06:07:04.508394	\N	\N	\N
driver_lisa_wilson	Lisa Wilson	lisa.wilson@monarch.org	$2b$10$Hq5P5z1oLKzEm9E5yLcY0eU8dR7dDGjGnA2oKWoA5J5Zs9I6Ly/gK	driver	monarch_sober_living	{monarch_sober_living}	t	2025-06-13 06:07:04.508394	2025-06-13 06:07:04.508394	\N	\N	\N
driver_david_taylor	David Taylor	david.taylor@monarch.org	$2b$10$Hq5P5z1oLKzEm9E5yLcY0eU8dR7dDGjGnA2oKWoA5J5Zs9I6Ly/gK	driver	monarch_sober_living	{monarch_sober_living}	t	2025-06-13 06:07:04.508394	2025-06-13 06:07:04.508394	\N	\N	\N
driver_jessica_moore	Jessica Moore	jessica.moore@monarch.org	$2b$10$Hq5P5z1oLKzEm9E5yLcY0eU8dR7dDGjGnA2oKWoA5J5Zs9I6Ly/gK	driver	monarch_launch	{monarch_launch}	t	2025-06-13 06:07:04.508394	2025-06-13 06:07:04.508394	\N	\N	\N
driver_kevin_anderson	Kevin Anderson	kevin.anderson@monarch.org	$2b$10$Hq5P5z1oLKzEm9E5yLcY0eU8dR7dDGjGnA2oKWoA5J5Zs9I6Ly/gK	driver	monarch_launch	{monarch_launch}	t	2025-06-13 06:07:04.508394	2025-06-13 06:07:04.508394	\N	\N	\N
sarah_monarch_owner	Sarah Johnson	sarah@monarch.com	$2b$10$C.MG7FwnZFnnPl43lhC6JuNKNO31iejfm4JTtF.oBTqItLkw2j6Xy	monarch_owner	monarch_competency	{monarch_competency,monarch_mental_health,monarch_sober_living,monarch_launch}	t	2025-06-14 17:07:16.017869	2025-06-14 17:07:16.017869	\N	\N	\N
david_org_user	David Rodriguez	david@monarch.com	$2b$10$p0zZLSDTzBogA6/Jzl2u1unqDpRhuTEJs.Gnf8VHcdISHHwSXFgUC	organization_user	monarch_mental_health	{monarch_mental_health}	t	2025-06-14 17:15:26.146667	2025-06-14 17:15:26.146667	\N	\N	\N
lisa_org_user	Lisa Thompson	lisa@monarch.com	$2b$10$W3xekACkrtu5pQo0NxYx.Oz0bQbEInxjtAi.Q4m31jtRgjrTEESdK	organization_user	monarch_sober_living	{monarch_sober_living}	t	2025-06-14 17:15:31.928275	2025-06-14 17:15:31.928275	\N	\N	\N
mike_org_user	Mike Johnson	mike@monarch.com	$2b$10$qyRkP1zGMYP/5fDgovZaKeNYh2Xz424UsKoy8N4AAa.ge/n4t2PkK	organization_user	monarch_launch	{monarch_launch}	t	2025-06-14 17:15:37.411273	2025-06-14 17:15:37.411273	\N	\N	\N
melissa_org_user	Melissa Chen	melissa@monarch.com	$2b$10$Mx.QCGD5/YwmzIoPIbQOkuCN1x9CbGDN/1smglMuKrAc3oOhfLVqm	organization_user	monarch_competency	{monarch_competency}	t	2025-06-14 17:15:20.347569	2025-06-14 22:45:04.212762	\N	\N	\N
admin_monarch_competency_001	admin@littlemonarch.com	admin@littlemonarch.com	$2b$10$.v5wVOXC/1HSeLKPhdfW8OAx8Shj/J6TyWTBVE7tLBxINEdlgVnd2	organization_admin	monarch_competency	{monarch_competency,monarch_mental_health,monarch_sober_living,monarch_launch}	t	2025-06-17 04:49:25.137624	2025-06-19 18:26:46.085779	\N	\N	\N
admin_001	admin	admin@monarch.org	$2b$12$yxjaHcC5WC7bK4ePuYml9eh1D2ab6s/.qy5vw124r/MUOg67lM4SW	super_admin	monarch_competency	{}	t	2025-06-11 07:05:47.553224	2025-07-17 18:37:12.545721	\N	\N	\N
admin_real_transport	Admin User	admin@realtransport.com	$2b$10$ockX2kqwlDksR5sjFr0JE.i8XlCl9S3ppfWVGAcFJaZQYsLtL14MK	organization_admin	real_transport_org	{real_transport_org}	t	2025-06-16 22:01:51.362145	2025-06-16 22:02:55.231347	\N	\N	\N
driver_real_001	Real Driver	driver@realtransport.com	$2b$10$MYqy4Advws0a1EJpusfHxegqgY8eEo/GamZX.lcLJBrbIP0OKSuJG	driver	real_transport_org	{real_transport_org}	t	2025-06-16 22:01:51.462647	2025-06-16 22:02:55.329132	\N	\N	\N
alex_driver_user	Alex Thompson	alex@monarch.com	$2b$10$PEBmBX2za.dWH9z38/xAouyZ74swSAIxzkLxze5NPZ7p4I.eQvWkq	driver	monarch_competency	{monarch_competency}	t	2025-06-14 18:43:50.400742	2025-06-20 05:06:12.927316	\N	\N	\N
user_seffe_monarch_competency_001	seffe	SBrown@monarchcompetency.com	$2b$12$3EIrMqXRSGdPu8jYHIgIh.9y5eobnET4YmuzFUnATQ9LMnmDNL6PS	driver	monarch_competency	{monarch_competency}	t	2025-06-23 03:36:48.059	2025-07-02 18:50:38.591675	/uploads/avatars/avatar-user_seffe_monarch_competency_001-zjpUkT4QUWKFRcz8LUt3R.webp	(555) 123-4567	\N
demo_admin_user	Demo Admin	admin@monarch.com	$2b$10$XV0P0Pgpqx9UFlVIKsJxjOCNExjnBPMeGiIwmdePGFOq0K9Ndcaim	super_admin	monarch_competency	{monarch_competency,monarch_mental_health,monarch_sober_living,monarch_launch}	f	2025-06-13 00:12:10.367996	2025-06-23 00:46:44.681434	\N	\N	\N
user_jackson_hurd_monarch_competency_001	Jackson Hurd	jhurd@monarchcompetency.com	$2b$12$.6T/OxfWzJy.EtmUsGIU1uoRf79A3LS1uGP3AQKcLKdrV/JEEqpfC	organization_user	monarch_competency	{monarch_competency}	t	2025-06-23 00:58:25.554	2025-06-23 01:04:32.509242	\N	\N	\N
super_admin_monarch_001	superadmin@monarch.com	superadmin@monarch.com	$2b$12$vm4okmO1r8x00eaKWOtUXuXoKzxLH.63Qmo9Nrq3mnjO./aIuzjuS	super_admin	monarch_competency	{monarch_competency,monarch_mental_health,monarch_sober_living,monarch_launch}	t	2025-06-17 06:06:13.361	2025-07-17 18:37:47.281885	/uploads/avatars/avatar-super_admin_monarch_001-v_x_aRuSO0qU5JQHQjX0h.webp	\N	$2b$12$4gs3MaBW8DTwogtpMcCVC.PeG4eF3FAic8FopF1ooOsrG3YLv4jxO
user_mike_peterson_monarch_executive_001	Mike Peterson	mpeterson@monarchcompetency.com	$2b$12$LUvS.c1SORLL211QhC8B9.bTy0gubg6Om2EQf0SrHLkete18wPBp2	monarch_owner	monarch_competency	{monarch_competency,monarch_mental_health,monarch_sober_living,monarch_launch}	t	2025-06-23 01:12:05.099	2025-06-23 01:43:31.12595	\N	\N	\N
user_ryan_monarch_readonly	Ryan - Monarch Readonly	Ryan@monarch.com	$2b$12$yxjaHcC5WC7bK4ePuYml9eh1D2ab6s/.qy5vw124r/MUOg67lM4SW	super_admin	monarch_competency	{monarch_competency,monarch_mental_health,monarch_sober_living,monarch_launch}	t	2025-06-25 19:49:02.937983	2025-07-17 18:37:12.545721	\N	\N	\N
admin_comp_001	comp_admin	admin@monarchcompetency.org	$2b$12$placeholder_hash	organization_admin	monarch_competency	{monarch_competency}	t	2025-06-11 07:05:47.553224	2025-06-28 06:05:30.994537	\N	(555) 234-5678	\N
driver_001	mike_driver	mike@monarch.org	$2b$12$placeholder_hash	driver	monarch_competency	{monarch_competency,monarch_mental_health}	t	2025-06-11 07:05:47.553224	2025-06-28 06:05:30.994537	\N	(555) 345-6789	\N
alex_monarch_competency_001	Alex Martinez	alex@littlemonarch.com	$2b$10$PEBmBX2za.dWH9z38/xAouyZ74swSAIxzkLxze5NPZ7p4I.eQvWkq	driver	monarch_competency	{}	t	2025-06-17 16:37:29.600681	2025-06-28 06:05:30.994537	\N	(555) 567-8901	\N
user_alewis_new_001	Alissa Lewis	alewis@monarchcompetency.com	$2b$10$ilOvFFUztj/whABS25XmV.f/eIp.uDfSz8i9QD6RjsFuwKfbonYpW	organization_admin	monarch_competency	{monarch_competency}	t	2025-07-02 00:50:10.69084	2025-07-02 00:50:51.274928	\N	(720) 555-0123	\N
\.


--
-- Data for Name: vehicles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.vehicles (id, organization_id, year, make, model, color, license_plate, is_active, created_at, updated_at, odometer_reading, mpg_rating) FROM stdin;
vehicle_001	monarch_competency	2020	Honda	Pilot	White	MC-001	t	2025-06-13 05:19:51.357215+00	2025-06-13 05:19:51.357215+00	\N	\N
vehicle_002	monarch_competency	2019	Toyota	Sienna	Silver	MC-002	t	2025-06-13 05:19:51.357215+00	2025-06-13 05:19:51.357215+00	\N	\N
vehicle_003	monarch_competency	2021	Ford	Transit	Blue	MC-003	t	2025-06-13 05:19:51.357215+00	2025-06-13 05:19:51.357215+00	\N	\N
vehicle_004	monarch_competency	2018	Chevrolet	Express	Gray	MC-004	t	2025-06-13 05:19:51.357215+00	2025-06-13 05:19:51.357215+00	\N	\N
vehicle_005	monarch_mental_health	2022	Honda	Odyssey	Black	MMH-001	t	2025-06-13 05:20:19.433454+00	2025-06-13 05:20:19.433454+00	\N	\N
vehicle_006	monarch_mental_health	2020	Toyota	Highlander	Red	MMH-002	t	2025-06-13 05:20:19.433454+00	2025-06-13 05:20:19.433454+00	\N	\N
vehicle_007	monarch_sober_living	2021	Ford	Transit Connect	Blue	MSL-001	t	2025-06-13 05:20:19.433454+00	2025-06-13 05:20:19.433454+00	\N	\N
vehicle_008	monarch_launch	2022	Tesla	Model Y	White	ML-001	t	2025-06-13 05:20:19.433454+00	2025-06-13 05:20:19.433454+00	\N	\N
vehicle_1750389510939_2jtj718qt	monarch_competency	2011	FORD	E-350	WHITE	CO-1234	t	2025-06-20 03:18:30.939+00	2025-06-20 03:18:30.939+00	\N	\N
vehicle_1750389758856_8zdw7g1ka	monarch_competency	2012	FORD	E-350	WHITE	CO-5678	t	2025-06-20 03:22:38.856+00	2025-06-20 03:22:38.856+00	\N	\N
vehicle_1750390839291_gymju4bgj	monarch_launch	2014	FORD	E-350 Turtletop	WHITE	CO-2468	t	2025-06-20 03:40:39.291+00	2025-06-20 03:40:39.291+00	\N	\N
\.


--
-- Data for Name: vehicles_v2; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.vehicles_v2 (id, vehicle_number, organization_id, make, model, year, color, license_plate, vin, registration_expiry, insurance_expiry, capacity, vehicle_type, is_active, created_at, updated_at) FROM stdin;
48422ae2-663d-43d1-8087-95838743d563	vehicle_001	monarch_competency	Honda	Pilot	2020	White	MC-001	\N	\N	\N	8	van	t	2025-06-13 05:19:51.357215	2025-06-13 05:19:51.357215
ed123c37-2836-4fa3-8560-9eaa28437a78	vehicle_002	monarch_competency	Toyota	Sienna	2019	Silver	MC-002	\N	\N	\N	8	van	t	2025-06-13 05:19:51.357215	2025-06-13 05:19:51.357215
b9966f1b-4dd1-4f73-b4ef-cf9d2c7c650d	vehicle_003	monarch_competency	Ford	Transit	2021	Blue	MC-003	\N	\N	\N	8	van	t	2025-06-13 05:19:51.357215	2025-06-13 05:19:51.357215
122a165b-71cb-4194-bdbb-c2377e7d9fcc	vehicle_004	monarch_competency	Chevrolet	Express	2018	Gray	MC-004	\N	\N	\N	8	van	t	2025-06-13 05:19:51.357215	2025-06-13 05:19:51.357215
e336db85-5bf7-4d02-b306-b64df7924a7d	vehicle_005	monarch_mental_health	Honda	Odyssey	2022	Black	MMH-001	\N	\N	\N	8	van	t	2025-06-13 05:20:19.433454	2025-06-13 05:20:19.433454
6b8a8dfc-fccc-4e9b-ac4b-85361702efff	vehicle_006	monarch_mental_health	Toyota	Highlander	2020	Red	MMH-002	\N	\N	\N	8	van	t	2025-06-13 05:20:19.433454	2025-06-13 05:20:19.433454
ec8d847a-b4c9-4225-9e3d-370c964ca51f	vehicle_007	monarch_sober_living	Ford	Transit Connect	2021	Blue	MSL-001	\N	\N	\N	8	van	t	2025-06-13 05:20:19.433454	2025-06-13 05:20:19.433454
2ed48e9d-0b3b-4c24-8e3f-541311f22319	vehicle_008	monarch_launch	Tesla	Model Y	2022	White	ML-001	\N	\N	\N	8	van	t	2025-06-13 05:20:19.433454	2025-06-13 05:20:19.433454
5fe845f0-e4c7-48bf-bc19-6323fea56cd2	vehicle_1750389510939_2jtj718qt	monarch_competency	FORD	E-350	2011	WHITE	CO-1234	\N	\N	\N	8	van	t	2025-06-20 03:18:30.939	2025-06-20 03:18:30.939
790eb7d5-2ae5-410a-9db5-fd5d110e93ae	vehicle_1750389758856_8zdw7g1ka	monarch_competency	FORD	E-350	2012	WHITE	CO-5678	\N	\N	\N	8	van	t	2025-06-20 03:22:38.856	2025-06-20 03:22:38.856
76a9e298-31af-4b16-8ff8-33140aeee61c	vehicle_1750390839291_gymju4bgj	monarch_launch	FORD	E-350 Turtletop	2014	WHITE	CO-2468	\N	\N	\N	8	van	t	2025-06-20 03:40:39.291	2025-06-20 03:40:39.291
\.


--
-- Data for Name: webhook_event_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.webhook_event_logs (id, integration_id, organization_id, event_type, event_data, status, trips_created, error_message, created_at) FROM stdin;
\.


--
-- Data for Name: webhook_integrations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.webhook_integrations (id, organization_id, name, provider, webhook_url, secret_key, filter_keywords, filter_attendees, status, last_sync, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: schema_migrations; Type: TABLE DATA; Schema: realtime; Owner: -
--

COPY realtime.schema_migrations (version, inserted_at) FROM stdin;
20211116024918	2025-06-11 02:26:29
20211116045059	2025-06-11 02:26:32
20211116050929	2025-06-11 02:26:34
20211116051442	2025-06-11 02:26:36
20211116212300	2025-06-11 02:26:39
20211116213355	2025-06-11 02:26:41
20211116213934	2025-06-11 02:26:43
20211116214523	2025-06-11 02:26:46
20211122062447	2025-06-11 02:26:48
20211124070109	2025-06-11 02:26:50
20211202204204	2025-06-11 02:26:52
20211202204605	2025-06-11 02:26:54
20211210212804	2025-06-11 02:27:00
20211228014915	2025-06-11 02:27:02
20220107221237	2025-06-11 02:27:04
20220228202821	2025-06-11 02:27:06
20220312004840	2025-06-11 02:27:08
20220603231003	2025-06-11 02:27:12
20220603232444	2025-06-11 02:27:14
20220615214548	2025-06-11 02:27:16
20220712093339	2025-06-11 02:27:18
20220908172859	2025-06-11 02:27:20
20220916233421	2025-06-11 02:27:22
20230119133233	2025-06-11 02:27:24
20230128025114	2025-06-11 02:27:27
20230128025212	2025-06-11 02:27:29
20230227211149	2025-06-11 02:27:31
20230228184745	2025-06-11 02:27:33
20230308225145	2025-06-11 02:27:35
20230328144023	2025-06-11 02:27:37
20231018144023	2025-06-11 02:27:40
20231204144023	2025-06-11 02:27:43
20231204144024	2025-06-11 02:27:45
20231204144025	2025-06-11 02:27:47
20240108234812	2025-06-11 02:27:49
20240109165339	2025-06-11 02:27:51
20240227174441	2025-06-11 02:27:54
20240311171622	2025-06-11 02:27:57
20240321100241	2025-06-11 02:28:02
20240401105812	2025-06-11 02:28:07
20240418121054	2025-06-11 02:28:10
20240523004032	2025-06-11 02:28:18
20240618124746	2025-06-11 02:28:20
20240801235015	2025-06-11 02:28:22
20240805133720	2025-06-11 02:28:24
20240827160934	2025-06-11 02:28:26
20240919163303	2025-06-11 02:28:28
20240919163305	2025-06-11 02:28:30
20241019105805	2025-06-11 02:28:32
20241030150047	2025-06-11 02:28:40
20241108114728	2025-06-11 02:28:43
20241121104152	2025-06-11 02:28:45
20241130184212	2025-06-11 02:28:47
20241220035512	2025-06-11 02:28:49
20241220123912	2025-06-11 02:28:51
20241224161212	2025-06-11 02:28:53
20250107150512	2025-06-11 02:28:56
20250110162412	2025-06-11 02:28:58
20250123174212	2025-06-11 02:29:00
20250128220012	2025-06-11 02:29:02
20250506224012	2025-06-11 02:29:03
20250523164012	2025-06-11 02:29:05
20250714121412	2025-08-16 22:29:55
\.


--
-- Data for Name: subscription; Type: TABLE DATA; Schema: realtime; Owner: -
--

COPY realtime.subscription (id, subscription_id, entity, filters, claims, created_at) FROM stdin;
\.


--
-- Data for Name: buckets; Type: TABLE DATA; Schema: storage; Owner: -
--

COPY storage.buckets (id, name, owner, created_at, updated_at, public, avif_autodetection, file_size_limit, allowed_mime_types, owner_id) FROM stdin;
\.


--
-- Data for Name: migrations; Type: TABLE DATA; Schema: storage; Owner: -
--

COPY storage.migrations (id, name, hash, executed_at) FROM stdin;
0	create-migrations-table	e18db593bcde2aca2a408c4d1100f6abba2195df	2025-06-11 02:26:25.528108
1	initialmigration	6ab16121fbaa08bbd11b712d05f358f9b555d777	2025-06-11 02:26:25.536597
2	storage-schema	5c7968fd083fcea04050c1b7f6253c9771b99011	2025-06-11 02:26:25.539672
3	pathtoken-column	2cb1b0004b817b29d5b0a971af16bafeede4b70d	2025-06-11 02:26:25.558095
4	add-migrations-rls	427c5b63fe1c5937495d9c635c263ee7a5905058	2025-06-11 02:26:25.578768
5	add-size-functions	79e081a1455b63666c1294a440f8ad4b1e6a7f84	2025-06-11 02:26:25.582327
6	change-column-name-in-get-size	f93f62afdf6613ee5e7e815b30d02dc990201044	2025-06-11 02:26:25.58726
7	add-rls-to-buckets	e7e7f86adbc51049f341dfe8d30256c1abca17aa	2025-06-11 02:26:25.591169
8	add-public-to-buckets	fd670db39ed65f9d08b01db09d6202503ca2bab3	2025-06-11 02:26:25.594621
9	fix-search-function	3a0af29f42e35a4d101c259ed955b67e1bee6825	2025-06-11 02:26:25.598299
10	search-files-search-function	68dc14822daad0ffac3746a502234f486182ef6e	2025-06-11 02:26:25.602057
11	add-trigger-to-auto-update-updated_at-column	7425bdb14366d1739fa8a18c83100636d74dcaa2	2025-06-11 02:26:25.607189
12	add-automatic-avif-detection-flag	8e92e1266eb29518b6a4c5313ab8f29dd0d08df9	2025-06-11 02:26:25.61487
13	add-bucket-custom-limits	cce962054138135cd9a8c4bcd531598684b25e7d	2025-06-11 02:26:25.618746
14	use-bytes-for-max-size	941c41b346f9802b411f06f30e972ad4744dad27	2025-06-11 02:26:25.622517
15	add-can-insert-object-function	934146bc38ead475f4ef4b555c524ee5d66799e5	2025-06-11 02:26:25.647212
16	add-version	76debf38d3fd07dcfc747ca49096457d95b1221b	2025-06-11 02:26:25.650852
17	drop-owner-foreign-key	f1cbb288f1b7a4c1eb8c38504b80ae2a0153d101	2025-06-11 02:26:25.654312
18	add_owner_id_column_deprecate_owner	e7a511b379110b08e2f214be852c35414749fe66	2025-06-11 02:26:25.65814
19	alter-default-value-objects-id	02e5e22a78626187e00d173dc45f58fa66a4f043	2025-06-11 02:26:25.66349
20	list-objects-with-delimiter	cd694ae708e51ba82bf012bba00caf4f3b6393b7	2025-06-11 02:26:25.668498
21	s3-multipart-uploads	8c804d4a566c40cd1e4cc5b3725a664a9303657f	2025-06-11 02:26:25.677975
22	s3-multipart-uploads-big-ints	9737dc258d2397953c9953d9b86920b8be0cdb73	2025-06-11 02:26:25.709164
23	optimize-search-function	9d7e604cddc4b56a5422dc68c9313f4a1b6f132c	2025-06-11 02:26:25.73436
24	operation-function	8312e37c2bf9e76bbe841aa5fda889206d2bf8aa	2025-06-11 02:26:25.738252
25	custom-metadata	d974c6057c3db1c1f847afa0e291e6165693b990	2025-06-11 02:26:25.742151
\.


--
-- Data for Name: objects; Type: TABLE DATA; Schema: storage; Owner: -
--

COPY storage.objects (id, bucket_id, name, owner, created_at, updated_at, last_accessed_at, metadata, version, owner_id, user_metadata) FROM stdin;
\.


--
-- Data for Name: s3_multipart_uploads; Type: TABLE DATA; Schema: storage; Owner: -
--

COPY storage.s3_multipart_uploads (id, in_progress_size, upload_signature, bucket_id, key, version, owner_id, created_at, user_metadata) FROM stdin;
\.


--
-- Data for Name: s3_multipart_uploads_parts; Type: TABLE DATA; Schema: storage; Owner: -
--

COPY storage.s3_multipart_uploads_parts (id, upload_id, size, part_number, bucket_id, key, etag, owner_id, version, created_at) FROM stdin;
\.


--
-- Data for Name: schema_migrations; Type: TABLE DATA; Schema: supabase_migrations; Owner: -
--

COPY supabase_migrations.schema_migrations (version, statements, name) FROM stdin;
\.


--
-- Data for Name: seed_files; Type: TABLE DATA; Schema: supabase_migrations; Owner: -
--

COPY supabase_migrations.seed_files (path, hash) FROM stdin;
\.


--
-- Data for Name: secrets; Type: TABLE DATA; Schema: vault; Owner: -
--

COPY vault.secrets (id, name, description, secret, key_id, nonce, created_at, updated_at) FROM stdin;
\.


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: -
--

SELECT pg_catalog.setval('auth.refresh_tokens_id_seq', 1, false);


--
-- Name: feature_flags_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.feature_flags_id_seq', 465, true);


--
-- Name: role_permissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.role_permissions_id_seq', 502, true);


--
-- Name: subscription_id_seq; Type: SEQUENCE SET; Schema: realtime; Owner: -
--

SELECT pg_catalog.setval('realtime.subscription_id_seq', 1, false);


--
-- Name: mfa_amr_claims amr_id_pk; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT amr_id_pk PRIMARY KEY (id);


--
-- Name: audit_log_entries audit_log_entries_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.audit_log_entries
    ADD CONSTRAINT audit_log_entries_pkey PRIMARY KEY (id);


--
-- Name: flow_state flow_state_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.flow_state
    ADD CONSTRAINT flow_state_pkey PRIMARY KEY (id);


--
-- Name: identities identities_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_pkey PRIMARY KEY (id);


--
-- Name: identities identities_provider_id_provider_unique; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_provider_id_provider_unique UNIQUE (provider_id, provider);


--
-- Name: instances instances_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.instances
    ADD CONSTRAINT instances_pkey PRIMARY KEY (id);


--
-- Name: mfa_amr_claims mfa_amr_claims_session_id_authentication_method_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT mfa_amr_claims_session_id_authentication_method_pkey UNIQUE (session_id, authentication_method);


--
-- Name: mfa_challenges mfa_challenges_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_challenges
    ADD CONSTRAINT mfa_challenges_pkey PRIMARY KEY (id);


--
-- Name: mfa_factors mfa_factors_last_challenged_at_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_last_challenged_at_key UNIQUE (last_challenged_at);


--
-- Name: mfa_factors mfa_factors_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_pkey PRIMARY KEY (id);


--
-- Name: one_time_tokens one_time_tokens_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.one_time_tokens
    ADD CONSTRAINT one_time_tokens_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_token_unique; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_token_unique UNIQUE (token);


--
-- Name: saml_providers saml_providers_entity_id_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_entity_id_key UNIQUE (entity_id);


--
-- Name: saml_providers saml_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_pkey PRIMARY KEY (id);


--
-- Name: saml_relay_states saml_relay_states_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: sso_domains sso_domains_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sso_domains
    ADD CONSTRAINT sso_domains_pkey PRIMARY KEY (id);


--
-- Name: sso_providers sso_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sso_providers
    ADD CONSTRAINT sso_providers_pkey PRIMARY KEY (id);


--
-- Name: users users_phone_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_phone_key UNIQUE (phone);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: billing_batches billing_batches_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.billing_batches
    ADD CONSTRAINT billing_batches_pkey PRIMARY KEY (id);


--
-- Name: billing_claims billing_claims_claim_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.billing_claims
    ADD CONSTRAINT billing_claims_claim_number_key UNIQUE (claim_number);


--
-- Name: billing_claims billing_claims_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.billing_claims
    ADD CONSTRAINT billing_claims_pkey PRIMARY KEY (id);


--
-- Name: billing_codes billing_codes_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.billing_codes
    ADD CONSTRAINT billing_codes_code_key UNIQUE (code);


--
-- Name: billing_codes billing_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.billing_codes
    ADD CONSTRAINT billing_codes_pkey PRIMARY KEY (id);


--
-- Name: billing_modifiers billing_modifiers_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.billing_modifiers
    ADD CONSTRAINT billing_modifiers_code_key UNIQUE (code);


--
-- Name: billing_modifiers billing_modifiers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.billing_modifiers
    ADD CONSTRAINT billing_modifiers_pkey PRIMARY KEY (id);


--
-- Name: client_billing_info client_billing_info_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_billing_info
    ADD CONSTRAINT client_billing_info_pkey PRIMARY KEY (id);


--
-- Name: client_group_memberships client_group_memberships_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_group_memberships
    ADD CONSTRAINT client_group_memberships_pkey PRIMARY KEY (id);


--
-- Name: client_groups client_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_groups
    ADD CONSTRAINT client_groups_pkey PRIMARY KEY (id);


--
-- Name: clients clients_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_pkey PRIMARY KEY (id);


--
-- Name: clients_v2 clients_v2_client_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clients_v2
    ADD CONSTRAINT clients_v2_client_number_key UNIQUE (client_number);


--
-- Name: clients_v2 clients_v2_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clients_v2
    ADD CONSTRAINT clients_v2_pkey PRIMARY KEY (id);


--
-- Name: cms1500_forms cms1500_forms_form_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cms1500_forms
    ADD CONSTRAINT cms1500_forms_form_number_key UNIQUE (form_number);


--
-- Name: cms1500_forms cms1500_forms_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cms1500_forms
    ADD CONSTRAINT cms1500_forms_pkey PRIMARY KEY (id);


--
-- Name: cms1500_service_lines cms1500_service_lines_form_id_line_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cms1500_service_lines
    ADD CONSTRAINT cms1500_service_lines_form_id_line_number_key UNIQUE (form_id, line_number);


--
-- Name: cms1500_service_lines cms1500_service_lines_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cms1500_service_lines
    ADD CONSTRAINT cms1500_service_lines_pkey PRIMARY KEY (id);


--
-- Name: driver_organization_access driver_organization_access_driver_id_organization_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.driver_organization_access
    ADD CONSTRAINT driver_organization_access_driver_id_organization_id_key UNIQUE (driver_id, organization_id);


--
-- Name: driver_organization_access driver_organization_access_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.driver_organization_access
    ADD CONSTRAINT driver_organization_access_pkey PRIMARY KEY (id);


--
-- Name: driver_schedules driver_schedules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.driver_schedules
    ADD CONSTRAINT driver_schedules_pkey PRIMARY KEY (id);


--
-- Name: driver_vehicle_assignments driver_vehicle_assignments_driver_id_vehicle_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.driver_vehicle_assignments
    ADD CONSTRAINT driver_vehicle_assignments_driver_id_vehicle_id_key UNIQUE (driver_id, vehicle_id);


--
-- Name: driver_vehicle_assignments driver_vehicle_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.driver_vehicle_assignments
    ADD CONSTRAINT driver_vehicle_assignments_pkey PRIMARY KEY (id);


--
-- Name: drivers drivers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.drivers
    ADD CONSTRAINT drivers_pkey PRIMARY KEY (id);


--
-- Name: drivers_v2 drivers_v2_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.drivers_v2
    ADD CONSTRAINT drivers_v2_email_key UNIQUE (email);


--
-- Name: drivers_v2 drivers_v2_employee_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.drivers_v2
    ADD CONSTRAINT drivers_v2_employee_id_key UNIQUE (employee_id);


--
-- Name: drivers_v2 drivers_v2_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.drivers_v2
    ADD CONSTRAINT drivers_v2_pkey PRIMARY KEY (id);


--
-- Name: feature_flags feature_flags_flag_name_organization_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feature_flags
    ADD CONSTRAINT feature_flags_flag_name_organization_id_key UNIQUE (flag_name, organization_id);


--
-- Name: feature_flags feature_flags_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feature_flags
    ADD CONSTRAINT feature_flags_pkey PRIMARY KEY (id);


--
-- Name: frequent_locations frequent_locations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.frequent_locations
    ADD CONSTRAINT frequent_locations_pkey PRIMARY KEY (id);


--
-- Name: organizations organizations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_pkey PRIMARY KEY (id);


--
-- Name: recurring_trips recurring_trips_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recurring_trips
    ADD CONSTRAINT recurring_trips_pkey PRIMARY KEY (id);


--
-- Name: role_permissions role_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_pkey PRIMARY KEY (id);


--
-- Name: role_permissions role_permissions_role_permission_resource_organization_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_role_permission_resource_organization_id_key UNIQUE (role, permission, resource, organization_id);


--
-- Name: service_areas service_areas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_areas
    ADD CONSTRAINT service_areas_pkey PRIMARY KEY (id);


--
-- Name: service_areas_v2 service_areas_v2_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_areas_v2
    ADD CONSTRAINT service_areas_v2_pkey PRIMARY KEY (id);


--
-- Name: system_settings system_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_settings
    ADD CONSTRAINT system_settings_pkey PRIMARY KEY (id);


--
-- Name: trip_creation_rules trip_creation_rules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trip_creation_rules
    ADD CONSTRAINT trip_creation_rules_pkey PRIMARY KEY (id);


--
-- Name: trips trips_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trips
    ADD CONSTRAINT trips_pkey PRIMARY KEY (id);


--
-- Name: trips_v2 trips_v2_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trips_v2
    ADD CONSTRAINT trips_v2_pkey PRIMARY KEY (id);


--
-- Name: trips_v2 trips_v2_trip_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trips_v2
    ADD CONSTRAINT trips_v2_trip_number_key UNIQUE (trip_number);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);


--
-- Name: users users_user_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_user_name_key UNIQUE (user_name);


--
-- Name: vehicles vehicles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vehicles
    ADD CONSTRAINT vehicles_pkey PRIMARY KEY (id);


--
-- Name: vehicles_v2 vehicles_v2_license_plate_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vehicles_v2
    ADD CONSTRAINT vehicles_v2_license_plate_key UNIQUE (license_plate);


--
-- Name: vehicles_v2 vehicles_v2_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vehicles_v2
    ADD CONSTRAINT vehicles_v2_pkey PRIMARY KEY (id);


--
-- Name: vehicles_v2 vehicles_v2_vehicle_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vehicles_v2
    ADD CONSTRAINT vehicles_v2_vehicle_number_key UNIQUE (vehicle_number);


--
-- Name: vehicles_v2 vehicles_v2_vin_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vehicles_v2
    ADD CONSTRAINT vehicles_v2_vin_key UNIQUE (vin);


--
-- Name: webhook_event_logs webhook_event_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.webhook_event_logs
    ADD CONSTRAINT webhook_event_logs_pkey PRIMARY KEY (id);


--
-- Name: webhook_integrations webhook_integrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.webhook_integrations
    ADD CONSTRAINT webhook_integrations_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: subscription pk_subscription; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.subscription
    ADD CONSTRAINT pk_subscription PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: buckets buckets_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.buckets
    ADD CONSTRAINT buckets_pkey PRIMARY KEY (id);


--
-- Name: migrations migrations_name_key; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.migrations
    ADD CONSTRAINT migrations_name_key UNIQUE (name);


--
-- Name: migrations migrations_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.migrations
    ADD CONSTRAINT migrations_pkey PRIMARY KEY (id);


--
-- Name: objects objects_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.objects
    ADD CONSTRAINT objects_pkey PRIMARY KEY (id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_pkey PRIMARY KEY (id);


--
-- Name: s3_multipart_uploads s3_multipart_uploads_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads
    ADD CONSTRAINT s3_multipart_uploads_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: supabase_migrations; Owner: -
--

ALTER TABLE ONLY supabase_migrations.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: seed_files seed_files_pkey; Type: CONSTRAINT; Schema: supabase_migrations; Owner: -
--

ALTER TABLE ONLY supabase_migrations.seed_files
    ADD CONSTRAINT seed_files_pkey PRIMARY KEY (path);


--
-- Name: audit_logs_instance_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX audit_logs_instance_id_idx ON auth.audit_log_entries USING btree (instance_id);


--
-- Name: confirmation_token_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX confirmation_token_idx ON auth.users USING btree (confirmation_token) WHERE ((confirmation_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: email_change_token_current_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX email_change_token_current_idx ON auth.users USING btree (email_change_token_current) WHERE ((email_change_token_current)::text !~ '^[0-9 ]*$'::text);


--
-- Name: email_change_token_new_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX email_change_token_new_idx ON auth.users USING btree (email_change_token_new) WHERE ((email_change_token_new)::text !~ '^[0-9 ]*$'::text);


--
-- Name: factor_id_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX factor_id_created_at_idx ON auth.mfa_factors USING btree (user_id, created_at);


--
-- Name: flow_state_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX flow_state_created_at_idx ON auth.flow_state USING btree (created_at DESC);


--
-- Name: identities_email_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX identities_email_idx ON auth.identities USING btree (email text_pattern_ops);


--
-- Name: INDEX identities_email_idx; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON INDEX auth.identities_email_idx IS 'Auth: Ensures indexed queries on the email column';


--
-- Name: identities_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX identities_user_id_idx ON auth.identities USING btree (user_id);


--
-- Name: idx_auth_code; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX idx_auth_code ON auth.flow_state USING btree (auth_code);


--
-- Name: idx_user_id_auth_method; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX idx_user_id_auth_method ON auth.flow_state USING btree (user_id, authentication_method);


--
-- Name: mfa_challenge_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX mfa_challenge_created_at_idx ON auth.mfa_challenges USING btree (created_at DESC);


--
-- Name: mfa_factors_user_friendly_name_unique; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX mfa_factors_user_friendly_name_unique ON auth.mfa_factors USING btree (friendly_name, user_id) WHERE (TRIM(BOTH FROM friendly_name) <> ''::text);


--
-- Name: mfa_factors_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX mfa_factors_user_id_idx ON auth.mfa_factors USING btree (user_id);


--
-- Name: one_time_tokens_relates_to_hash_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX one_time_tokens_relates_to_hash_idx ON auth.one_time_tokens USING hash (relates_to);


--
-- Name: one_time_tokens_token_hash_hash_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX one_time_tokens_token_hash_hash_idx ON auth.one_time_tokens USING hash (token_hash);


--
-- Name: one_time_tokens_user_id_token_type_key; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX one_time_tokens_user_id_token_type_key ON auth.one_time_tokens USING btree (user_id, token_type);


--
-- Name: reauthentication_token_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX reauthentication_token_idx ON auth.users USING btree (reauthentication_token) WHERE ((reauthentication_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: recovery_token_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX recovery_token_idx ON auth.users USING btree (recovery_token) WHERE ((recovery_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: refresh_tokens_instance_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_instance_id_idx ON auth.refresh_tokens USING btree (instance_id);


--
-- Name: refresh_tokens_instance_id_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_instance_id_user_id_idx ON auth.refresh_tokens USING btree (instance_id, user_id);


--
-- Name: refresh_tokens_parent_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_parent_idx ON auth.refresh_tokens USING btree (parent);


--
-- Name: refresh_tokens_session_id_revoked_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_session_id_revoked_idx ON auth.refresh_tokens USING btree (session_id, revoked);


--
-- Name: refresh_tokens_updated_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_updated_at_idx ON auth.refresh_tokens USING btree (updated_at DESC);


--
-- Name: saml_providers_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX saml_providers_sso_provider_id_idx ON auth.saml_providers USING btree (sso_provider_id);


--
-- Name: saml_relay_states_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX saml_relay_states_created_at_idx ON auth.saml_relay_states USING btree (created_at DESC);


--
-- Name: saml_relay_states_for_email_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX saml_relay_states_for_email_idx ON auth.saml_relay_states USING btree (for_email);


--
-- Name: saml_relay_states_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX saml_relay_states_sso_provider_id_idx ON auth.saml_relay_states USING btree (sso_provider_id);


--
-- Name: sessions_not_after_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sessions_not_after_idx ON auth.sessions USING btree (not_after DESC);


--
-- Name: sessions_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sessions_user_id_idx ON auth.sessions USING btree (user_id);


--
-- Name: sso_domains_domain_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX sso_domains_domain_idx ON auth.sso_domains USING btree (lower(domain));


--
-- Name: sso_domains_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sso_domains_sso_provider_id_idx ON auth.sso_domains USING btree (sso_provider_id);


--
-- Name: sso_providers_resource_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX sso_providers_resource_id_idx ON auth.sso_providers USING btree (lower(resource_id));


--
-- Name: sso_providers_resource_id_pattern_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sso_providers_resource_id_pattern_idx ON auth.sso_providers USING btree (resource_id text_pattern_ops);


--
-- Name: unique_phone_factor_per_user; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX unique_phone_factor_per_user ON auth.mfa_factors USING btree (user_id, phone);


--
-- Name: user_id_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX user_id_created_at_idx ON auth.sessions USING btree (user_id, created_at);


--
-- Name: users_email_partial_key; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX users_email_partial_key ON auth.users USING btree (email) WHERE (is_sso_user = false);


--
-- Name: INDEX users_email_partial_key; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON INDEX auth.users_email_partial_key IS 'Auth: A partial unique index that applies only when is_sso_user is false';


--
-- Name: users_instance_id_email_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX users_instance_id_email_idx ON auth.users USING btree (instance_id, lower((email)::text));


--
-- Name: users_instance_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX users_instance_id_idx ON auth.users USING btree (instance_id);


--
-- Name: users_is_anonymous_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX users_is_anonymous_idx ON auth.users USING btree (is_anonymous);


--
-- Name: idx_billing_batches_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_billing_batches_created_by ON public.billing_batches USING btree (created_by);


--
-- Name: idx_billing_batches_organization_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_billing_batches_organization_id ON public.billing_batches USING btree (organization_id);


--
-- Name: idx_billing_claims_client_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_billing_claims_client_id ON public.billing_claims USING btree (client_id);


--
-- Name: idx_billing_claims_organization_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_billing_claims_organization_id ON public.billing_claims USING btree (organization_id);


--
-- Name: idx_billing_claims_service_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_billing_claims_service_date ON public.billing_claims USING btree (service_date);


--
-- Name: idx_billing_claims_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_billing_claims_status ON public.billing_claims USING btree (status);


--
-- Name: idx_billing_claims_trip_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_billing_claims_trip_id ON public.billing_claims USING btree (trip_id);


--
-- Name: idx_client_billing_info_client_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_client_billing_info_client_id ON public.client_billing_info USING btree (client_id);


--
-- Name: idx_client_billing_info_organization_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_client_billing_info_organization_id ON public.client_billing_info USING btree (organization_id);


--
-- Name: idx_client_group_memberships_client; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_client_group_memberships_client ON public.client_group_memberships USING btree (client_id);


--
-- Name: idx_client_group_memberships_group; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_client_group_memberships_group ON public.client_group_memberships USING btree (group_id);


--
-- Name: idx_client_groups_org; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_client_groups_org ON public.client_groups USING btree (organization_id);


--
-- Name: idx_client_groups_service_area; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_client_groups_service_area ON public.client_groups USING btree (service_area_id);


--
-- Name: idx_clients_org; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clients_org ON public.clients USING btree (organization_id);


--
-- Name: idx_clients_service_area; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clients_service_area ON public.clients USING btree (service_area_id);


--
-- Name: idx_clients_v2_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clients_v2_active ON public.clients_v2 USING btree (is_active);


--
-- Name: idx_clients_v2_client_number; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clients_v2_client_number ON public.clients_v2 USING btree (client_number);


--
-- Name: idx_clients_v2_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clients_v2_email ON public.clients_v2 USING btree (email);


--
-- Name: idx_clients_v2_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clients_v2_name ON public.clients_v2 USING btree (first_name, last_name);


--
-- Name: idx_clients_v2_org; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clients_v2_org ON public.clients_v2 USING btree (organization_id);


--
-- Name: idx_clients_v2_service_area; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clients_v2_service_area ON public.clients_v2 USING btree (service_area_id);


--
-- Name: idx_cms1500_forms_client_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cms1500_forms_client_id ON public.cms1500_forms USING btree (client_id);


--
-- Name: idx_cms1500_forms_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cms1500_forms_created_at ON public.cms1500_forms USING btree (created_at);


--
-- Name: idx_cms1500_forms_form_number; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cms1500_forms_form_number ON public.cms1500_forms USING btree (form_number);


--
-- Name: idx_cms1500_forms_organization_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cms1500_forms_organization_id ON public.cms1500_forms USING btree (organization_id);


--
-- Name: idx_cms1500_forms_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cms1500_forms_status ON public.cms1500_forms USING btree (status);


--
-- Name: idx_cms1500_forms_trip_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cms1500_forms_trip_id ON public.cms1500_forms USING btree (trip_id);


--
-- Name: idx_cms1500_service_lines_form_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cms1500_service_lines_form_id ON public.cms1500_service_lines USING btree (form_id);


--
-- Name: idx_driver_org_access_driver; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_driver_org_access_driver ON public.driver_organization_access USING btree (driver_id);


--
-- Name: idx_driver_org_access_org; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_driver_org_access_org ON public.driver_organization_access USING btree (organization_id);


--
-- Name: idx_driver_schedules_driver; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_driver_schedules_driver ON public.driver_schedules USING btree (driver_id);


--
-- Name: idx_driver_schedules_org; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_driver_schedules_org ON public.driver_schedules USING btree (organization_id);


--
-- Name: idx_drivers_org; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_drivers_org ON public.drivers USING btree (primary_organization_id);


--
-- Name: idx_drivers_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_drivers_user ON public.drivers USING btree (user_id);


--
-- Name: idx_drivers_v2_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_drivers_v2_email ON public.drivers_v2 USING btree (email);


--
-- Name: idx_drivers_v2_employee_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_drivers_v2_employee_id ON public.drivers_v2 USING btree (employee_id);


--
-- Name: idx_drivers_v2_org; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_drivers_v2_org ON public.drivers_v2 USING btree (primary_organization_id);


--
-- Name: idx_service_areas_org; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_service_areas_org ON public.service_areas USING btree (organization_id);


--
-- Name: idx_service_areas_v2_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_service_areas_v2_active ON public.service_areas_v2 USING btree (is_active);


--
-- Name: idx_service_areas_v2_city_state; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_service_areas_v2_city_state ON public.service_areas_v2 USING btree (city, state);


--
-- Name: idx_service_areas_v2_nickname; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_service_areas_v2_nickname ON public.service_areas_v2 USING btree (nickname);


--
-- Name: idx_service_areas_v2_org; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_service_areas_v2_org ON public.service_areas_v2 USING btree (organization_id);


--
-- Name: idx_trip_creation_rules_integration; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_trip_creation_rules_integration ON public.trip_creation_rules USING btree (integration_id);


--
-- Name: idx_trips_client; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_trips_client ON public.trips USING btree (client_id);


--
-- Name: idx_trips_client_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_trips_client_id ON public.trips USING btree (client_id);


--
-- Name: idx_trips_driver; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_trips_driver ON public.trips USING btree (driver_id);


--
-- Name: idx_trips_driver_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_trips_driver_id ON public.trips USING btree (driver_id);


--
-- Name: idx_trips_org; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_trips_org ON public.trips USING btree (organization_id);


--
-- Name: idx_trips_organization_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_trips_organization_id ON public.trips USING btree (organization_id);


--
-- Name: idx_trips_scheduled_pickup; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_trips_scheduled_pickup ON public.trips USING btree (scheduled_pickup_time);


--
-- Name: idx_trips_scheduled_time; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_trips_scheduled_time ON public.trips USING btree (scheduled_pickup_time);


--
-- Name: idx_trips_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_trips_status ON public.trips USING btree (status);


--
-- Name: idx_trips_v2_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_trips_v2_active ON public.trips_v2 USING btree (is_active);


--
-- Name: idx_trips_v2_client; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_trips_v2_client ON public.trips_v2 USING btree (client_id);


--
-- Name: idx_trips_v2_client_org; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_trips_v2_client_org ON public.trips_v2 USING btree (client_id, organization_id);


--
-- Name: idx_trips_v2_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_trips_v2_created_at ON public.trips_v2 USING btree (created_at);


--
-- Name: idx_trips_v2_driver; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_trips_v2_driver ON public.trips_v2 USING btree (driver_id);


--
-- Name: idx_trips_v2_driver_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_trips_v2_driver_status ON public.trips_v2 USING btree (driver_id, status);


--
-- Name: idx_trips_v2_org; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_trips_v2_org ON public.trips_v2 USING btree (organization_id);


--
-- Name: idx_trips_v2_org_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_trips_v2_org_status ON public.trips_v2 USING btree (organization_id, status);


--
-- Name: idx_trips_v2_scheduled_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_trips_v2_scheduled_date ON public.trips_v2 USING btree (scheduled_pickup_time, status);


--
-- Name: idx_trips_v2_scheduled_pickup; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_trips_v2_scheduled_pickup ON public.trips_v2 USING btree (scheduled_pickup_time);


--
-- Name: idx_trips_v2_service_area; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_trips_v2_service_area ON public.trips_v2 USING btree (service_area_id);


--
-- Name: idx_trips_v2_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_trips_v2_status ON public.trips_v2 USING btree (status);


--
-- Name: idx_trips_v2_trip_number; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_trips_v2_trip_number ON public.trips_v2 USING btree (trip_number);


--
-- Name: idx_trips_vehicle_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_trips_vehicle_id ON public.trips USING btree (vehicle_id);


--
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- Name: idx_users_organization; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_organization ON public.users USING btree (primary_organization_id);


--
-- Name: idx_users_role; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_role ON public.users USING btree (role);


--
-- Name: idx_webhook_event_logs_integration; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_webhook_event_logs_integration ON public.webhook_event_logs USING btree (integration_id);


--
-- Name: idx_webhook_event_logs_org; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_webhook_event_logs_org ON public.webhook_event_logs USING btree (organization_id);


--
-- Name: idx_webhook_integrations_org; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_webhook_integrations_org ON public.webhook_integrations USING btree (organization_id);


--
-- Name: ix_realtime_subscription_entity; Type: INDEX; Schema: realtime; Owner: -
--

CREATE INDEX ix_realtime_subscription_entity ON realtime.subscription USING btree (entity);


--
-- Name: subscription_subscription_id_entity_filters_key; Type: INDEX; Schema: realtime; Owner: -
--

CREATE UNIQUE INDEX subscription_subscription_id_entity_filters_key ON realtime.subscription USING btree (subscription_id, entity, filters);


--
-- Name: bname; Type: INDEX; Schema: storage; Owner: -
--

CREATE UNIQUE INDEX bname ON storage.buckets USING btree (name);


--
-- Name: bucketid_objname; Type: INDEX; Schema: storage; Owner: -
--

CREATE UNIQUE INDEX bucketid_objname ON storage.objects USING btree (bucket_id, name);


--
-- Name: idx_multipart_uploads_list; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX idx_multipart_uploads_list ON storage.s3_multipart_uploads USING btree (bucket_id, key, created_at);


--
-- Name: idx_objects_bucket_id_name; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX idx_objects_bucket_id_name ON storage.objects USING btree (bucket_id, name COLLATE "C");


--
-- Name: name_prefix_search; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX name_prefix_search ON storage.objects USING btree (name text_pattern_ops);


--
-- Name: cms1500_forms cms1500_forms_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER cms1500_forms_updated_at BEFORE UPDATE ON public.cms1500_forms FOR EACH ROW EXECUTE FUNCTION public.update_cms1500_updated_at();


--
-- Name: cms1500_service_lines cms1500_service_lines_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER cms1500_service_lines_updated_at BEFORE UPDATE ON public.cms1500_service_lines FOR EACH ROW EXECUTE FUNCTION public.update_cms1500_updated_at();


--
-- Name: cms1500_forms sync_cms1500_billing_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER sync_cms1500_billing_trigger AFTER INSERT OR UPDATE ON public.cms1500_forms FOR EACH ROW EXECUTE FUNCTION public.sync_cms1500_with_billing_claim();


--
-- Name: client_groups update_client_groups_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_client_groups_updated_at BEFORE UPDATE ON public.client_groups FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: clients update_clients_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: driver_schedules update_driver_schedules_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_driver_schedules_updated_at BEFORE UPDATE ON public.driver_schedules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: drivers update_drivers_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_drivers_updated_at BEFORE UPDATE ON public.drivers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: organizations update_organizations_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON public.organizations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: service_areas update_service_areas_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_service_areas_updated_at BEFORE UPDATE ON public.service_areas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: service_areas_v2 update_service_areas_v2_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_service_areas_v2_updated_at BEFORE UPDATE ON public.service_areas_v2 FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: trips update_trips_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_trips_updated_at BEFORE UPDATE ON public.trips FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: users update_users_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: subscription tr_check_filters; Type: TRIGGER; Schema: realtime; Owner: -
--

CREATE TRIGGER tr_check_filters BEFORE INSERT OR UPDATE ON realtime.subscription FOR EACH ROW EXECUTE FUNCTION realtime.subscription_check_filters();


--
-- Name: objects update_objects_updated_at; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER update_objects_updated_at BEFORE UPDATE ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.update_updated_at_column();


--
-- Name: identities identities_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: mfa_amr_claims mfa_amr_claims_session_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT mfa_amr_claims_session_id_fkey FOREIGN KEY (session_id) REFERENCES auth.sessions(id) ON DELETE CASCADE;


--
-- Name: mfa_challenges mfa_challenges_auth_factor_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_challenges
    ADD CONSTRAINT mfa_challenges_auth_factor_id_fkey FOREIGN KEY (factor_id) REFERENCES auth.mfa_factors(id) ON DELETE CASCADE;


--
-- Name: mfa_factors mfa_factors_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: one_time_tokens one_time_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.one_time_tokens
    ADD CONSTRAINT one_time_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: refresh_tokens refresh_tokens_session_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_session_id_fkey FOREIGN KEY (session_id) REFERENCES auth.sessions(id) ON DELETE CASCADE;


--
-- Name: saml_providers saml_providers_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: saml_relay_states saml_relay_states_flow_state_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_flow_state_id_fkey FOREIGN KEY (flow_state_id) REFERENCES auth.flow_state(id) ON DELETE CASCADE;


--
-- Name: saml_relay_states saml_relay_states_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: sessions sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: sso_domains sso_domains_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sso_domains
    ADD CONSTRAINT sso_domains_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: billing_batches billing_batches_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.billing_batches
    ADD CONSTRAINT billing_batches_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(user_id);


--
-- Name: billing_batches billing_batches_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.billing_batches
    ADD CONSTRAINT billing_batches_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id);


--
-- Name: billing_claims billing_claims_billing_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.billing_claims
    ADD CONSTRAINT billing_claims_billing_code_fkey FOREIGN KEY (billing_code) REFERENCES public.billing_codes(code);


--
-- Name: billing_claims billing_claims_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.billing_claims
    ADD CONSTRAINT billing_claims_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id);


--
-- Name: billing_claims billing_claims_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.billing_claims
    ADD CONSTRAINT billing_claims_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id);


--
-- Name: billing_claims billing_claims_trip_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.billing_claims
    ADD CONSTRAINT billing_claims_trip_id_fkey FOREIGN KEY (trip_id) REFERENCES public.trips(id);


--
-- Name: client_billing_info client_billing_info_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_billing_info
    ADD CONSTRAINT client_billing_info_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id);


--
-- Name: client_billing_info client_billing_info_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_billing_info
    ADD CONSTRAINT client_billing_info_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id);


--
-- Name: client_group_memberships client_group_memberships_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_group_memberships
    ADD CONSTRAINT client_group_memberships_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;


--
-- Name: client_group_memberships client_group_memberships_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_group_memberships
    ADD CONSTRAINT client_group_memberships_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.client_groups(id) ON DELETE CASCADE;


--
-- Name: client_groups client_groups_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_groups
    ADD CONSTRAINT client_groups_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: client_groups client_groups_service_area_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_groups
    ADD CONSTRAINT client_groups_service_area_id_fkey FOREIGN KEY (service_area_id) REFERENCES public.service_areas(id);


--
-- Name: clients clients_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: clients clients_service_area_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_service_area_id_fkey FOREIGN KEY (service_area_id) REFERENCES public.service_areas(id);


--
-- Name: clients_v2 clients_v2_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clients_v2
    ADD CONSTRAINT clients_v2_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id);


--
-- Name: clients_v2 clients_v2_service_area_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clients_v2
    ADD CONSTRAINT clients_v2_service_area_id_fkey FOREIGN KEY (service_area_id) REFERENCES public.service_areas(id);


--
-- Name: cms1500_forms cms1500_forms_billing_claim_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cms1500_forms
    ADD CONSTRAINT cms1500_forms_billing_claim_id_fkey FOREIGN KEY (billing_claim_id) REFERENCES public.billing_claims(id);


--
-- Name: cms1500_forms cms1500_forms_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cms1500_forms
    ADD CONSTRAINT cms1500_forms_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id);


--
-- Name: cms1500_forms cms1500_forms_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cms1500_forms
    ADD CONSTRAINT cms1500_forms_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(user_id);


--
-- Name: cms1500_forms cms1500_forms_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cms1500_forms
    ADD CONSTRAINT cms1500_forms_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id);


--
-- Name: cms1500_forms cms1500_forms_trip_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cms1500_forms
    ADD CONSTRAINT cms1500_forms_trip_id_fkey FOREIGN KEY (trip_id) REFERENCES public.trips(id);


--
-- Name: cms1500_forms cms1500_forms_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cms1500_forms
    ADD CONSTRAINT cms1500_forms_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(user_id);


--
-- Name: cms1500_service_lines cms1500_service_lines_form_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cms1500_service_lines
    ADD CONSTRAINT cms1500_service_lines_form_id_fkey FOREIGN KEY (form_id) REFERENCES public.cms1500_forms(id) ON DELETE CASCADE;


--
-- Name: driver_organization_access driver_organization_access_driver_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.driver_organization_access
    ADD CONSTRAINT driver_organization_access_driver_id_fkey FOREIGN KEY (driver_id) REFERENCES public.drivers_v2(id) ON DELETE CASCADE;


--
-- Name: driver_organization_access driver_organization_access_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.driver_organization_access
    ADD CONSTRAINT driver_organization_access_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id);


--
-- Name: driver_schedules driver_schedules_driver_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.driver_schedules
    ADD CONSTRAINT driver_schedules_driver_id_fkey FOREIGN KEY (driver_id) REFERENCES public.drivers(id) ON DELETE CASCADE;


--
-- Name: driver_schedules driver_schedules_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.driver_schedules
    ADD CONSTRAINT driver_schedules_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id);


--
-- Name: drivers drivers_primary_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.drivers
    ADD CONSTRAINT drivers_primary_organization_id_fkey FOREIGN KEY (primary_organization_id) REFERENCES public.organizations(id);


--
-- Name: drivers drivers_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.drivers
    ADD CONSTRAINT drivers_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: drivers_v2 drivers_v2_primary_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.drivers_v2
    ADD CONSTRAINT drivers_v2_primary_organization_id_fkey FOREIGN KEY (primary_organization_id) REFERENCES public.organizations(id);


--
-- Name: clients fk_clients_service_area; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT fk_clients_service_area FOREIGN KEY (service_area_id) REFERENCES public.service_areas(id);


--
-- Name: frequent_locations frequent_locations_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.frequent_locations
    ADD CONSTRAINT frequent_locations_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id);


--
-- Name: recurring_trips recurring_trips_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recurring_trips
    ADD CONSTRAINT recurring_trips_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id);


--
-- Name: service_areas service_areas_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_areas
    ADD CONSTRAINT service_areas_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: service_areas_v2 service_areas_v2_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_areas_v2
    ADD CONSTRAINT service_areas_v2_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: trip_creation_rules trip_creation_rules_integration_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trip_creation_rules
    ADD CONSTRAINT trip_creation_rules_integration_id_fkey FOREIGN KEY (integration_id) REFERENCES public.webhook_integrations(id) ON DELETE CASCADE;


--
-- Name: trips trips_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trips
    ADD CONSTRAINT trips_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id);


--
-- Name: trips trips_driver_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trips
    ADD CONSTRAINT trips_driver_id_fkey FOREIGN KEY (driver_id) REFERENCES public.drivers(id);


--
-- Name: trips trips_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trips
    ADD CONSTRAINT trips_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: trips trips_recurring_trip_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trips
    ADD CONSTRAINT trips_recurring_trip_id_fkey FOREIGN KEY (recurring_trip_id) REFERENCES public.recurring_trips(id);


--
-- Name: trips_v2 trips_v2_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trips_v2
    ADD CONSTRAINT trips_v2_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients_v2(id);


--
-- Name: trips_v2 trips_v2_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trips_v2
    ADD CONSTRAINT trips_v2_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(user_id);


--
-- Name: trips_v2 trips_v2_driver_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trips_v2
    ADD CONSTRAINT trips_v2_driver_id_fkey FOREIGN KEY (driver_id) REFERENCES public.drivers_v2(id);


--
-- Name: trips_v2 trips_v2_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trips_v2
    ADD CONSTRAINT trips_v2_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id);


--
-- Name: trips_v2 trips_v2_service_area_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trips_v2
    ADD CONSTRAINT trips_v2_service_area_id_fkey FOREIGN KEY (service_area_id) REFERENCES public.service_areas(id);


--
-- Name: trips_v2 trips_v2_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trips_v2
    ADD CONSTRAINT trips_v2_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(user_id);


--
-- Name: trips trips_vehicle_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trips
    ADD CONSTRAINT trips_vehicle_id_fkey FOREIGN KEY (vehicle_id) REFERENCES public.vehicles(id);


--
-- Name: users users_primary_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_primary_organization_id_fkey FOREIGN KEY (primary_organization_id) REFERENCES public.organizations(id);


--
-- Name: vehicles_v2 vehicles_v2_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vehicles_v2
    ADD CONSTRAINT vehicles_v2_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id);


--
-- Name: webhook_event_logs webhook_event_logs_integration_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.webhook_event_logs
    ADD CONSTRAINT webhook_event_logs_integration_id_fkey FOREIGN KEY (integration_id) REFERENCES public.webhook_integrations(id) ON DELETE CASCADE;


--
-- Name: objects objects_bucketId_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.objects
    ADD CONSTRAINT "objects_bucketId_fkey" FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads s3_multipart_uploads_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads
    ADD CONSTRAINT s3_multipart_uploads_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_upload_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_upload_id_fkey FOREIGN KEY (upload_id) REFERENCES storage.s3_multipart_uploads(id) ON DELETE CASCADE;


--
-- Name: audit_log_entries; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.audit_log_entries ENABLE ROW LEVEL SECURITY;

--
-- Name: flow_state; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.flow_state ENABLE ROW LEVEL SECURITY;

--
-- Name: identities; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.identities ENABLE ROW LEVEL SECURITY;

--
-- Name: instances; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.instances ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_amr_claims; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.mfa_amr_claims ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_challenges; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.mfa_challenges ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_factors; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.mfa_factors ENABLE ROW LEVEL SECURITY;

--
-- Name: one_time_tokens; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.one_time_tokens ENABLE ROW LEVEL SECURITY;

--
-- Name: refresh_tokens; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.refresh_tokens ENABLE ROW LEVEL SECURITY;

--
-- Name: saml_providers; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.saml_providers ENABLE ROW LEVEL SECURITY;

--
-- Name: saml_relay_states; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.saml_relay_states ENABLE ROW LEVEL SECURITY;

--
-- Name: schema_migrations; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.schema_migrations ENABLE ROW LEVEL SECURITY;

--
-- Name: sessions; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.sessions ENABLE ROW LEVEL SECURITY;

--
-- Name: sso_domains; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.sso_domains ENABLE ROW LEVEL SECURITY;

--
-- Name: sso_providers; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.sso_providers ENABLE ROW LEVEL SECURITY;

--
-- Name: users; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

--
-- Name: client_group_memberships Client group memberships access policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Client group memberships access policy" ON public.client_group_memberships USING ((((auth.jwt() ->> 'role'::text) = 'super_admin'::text) OR (EXISTS ( SELECT 1
   FROM public.client_groups cg
  WHERE ((cg.id = client_group_memberships.group_id) AND (cg.organization_id = ANY (string_to_array((auth.jwt() ->> 'authorized_organizations'::text), ','::text))))))));


--
-- Name: client_groups Client groups access policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Client groups access policy" ON public.client_groups USING ((((auth.jwt() ->> 'role'::text) = 'super_admin'::text) OR (organization_id = ANY (string_to_array((auth.jwt() ->> 'authorized_organizations'::text), ','::text)))));


--
-- Name: clients Clients access policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Clients access policy" ON public.clients USING ((((auth.jwt() ->> 'role'::text) = 'super_admin'::text) OR (organization_id = ANY (string_to_array((auth.jwt() ->> 'authorized_organizations'::text), ','::text)))));


--
-- Name: driver_schedules Driver schedules access policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Driver schedules access policy" ON public.driver_schedules USING ((((auth.jwt() ->> 'role'::text) = 'super_admin'::text) OR (organization_id = ANY (string_to_array((auth.jwt() ->> 'authorized_organizations'::text), ','::text)))));


--
-- Name: drivers Drivers access policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Drivers access policy" ON public.drivers USING ((((auth.jwt() ->> 'role'::text) = 'super_admin'::text) OR (primary_organization_id = ANY (string_to_array((auth.jwt() ->> 'authorized_organizations'::text), ','::text))) OR (authorized_organizations && string_to_array((auth.jwt() ->> 'authorized_organizations'::text), ','::text))));


--
-- Name: organizations Organizations access policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Organizations access policy" ON public.organizations USING ((((auth.jwt() ->> 'role'::text) = 'super_admin'::text) OR (id = ANY (string_to_array((auth.jwt() ->> 'authorized_organizations'::text), ','::text)))));


--
-- Name: service_areas Service areas access policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service areas access policy" ON public.service_areas USING ((((auth.jwt() ->> 'role'::text) = 'super_admin'::text) OR (organization_id = ANY (string_to_array((auth.jwt() ->> 'authorized_organizations'::text), ','::text)))));


--
-- Name: trips Trips access policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Trips access policy" ON public.trips USING ((((auth.jwt() ->> 'role'::text) = 'super_admin'::text) OR (organization_id = ANY (string_to_array((auth.jwt() ->> 'authorized_organizations'::text), ','::text)))));


--
-- Name: users Users access policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users access policy" ON public.users USING ((((auth.jwt() ->> 'role'::text) = 'super_admin'::text) OR (primary_organization_id = ANY (string_to_array((auth.jwt() ->> 'authorized_organizations'::text), ','::text)))));


--
-- Name: client_group_memberships; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.client_group_memberships ENABLE ROW LEVEL SECURITY;

--
-- Name: client_groups; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.client_groups ENABLE ROW LEVEL SECURITY;

--
-- Name: clients; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

--
-- Name: cms1500_forms; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.cms1500_forms ENABLE ROW LEVEL SECURITY;

--
-- Name: cms1500_service_lines; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.cms1500_service_lines ENABLE ROW LEVEL SECURITY;

--
-- Name: driver_schedules; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.driver_schedules ENABLE ROW LEVEL SECURITY;

--
-- Name: drivers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;

--
-- Name: organizations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

--
-- Name: service_areas; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.service_areas ENABLE ROW LEVEL SECURITY;

--
-- Name: trips; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;

--
-- Name: users; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

--
-- Name: messages; Type: ROW SECURITY; Schema: realtime; Owner: -
--

ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

--
-- Name: buckets; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

--
-- Name: migrations; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.migrations ENABLE ROW LEVEL SECURITY;

--
-- Name: objects; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

--
-- Name: s3_multipart_uploads; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.s3_multipart_uploads ENABLE ROW LEVEL SECURITY;

--
-- Name: s3_multipart_uploads_parts; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.s3_multipart_uploads_parts ENABLE ROW LEVEL SECURITY;

--
-- Name: supabase_realtime; Type: PUBLICATION; Schema: -; Owner: -
--

CREATE PUBLICATION supabase_realtime WITH (publish = 'insert, update, delete, truncate');


--
-- Name: issue_graphql_placeholder; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER issue_graphql_placeholder ON sql_drop
         WHEN TAG IN ('DROP EXTENSION')
   EXECUTE FUNCTION extensions.set_graphql_placeholder();


--
-- Name: issue_pg_cron_access; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER issue_pg_cron_access ON ddl_command_end
         WHEN TAG IN ('CREATE EXTENSION')
   EXECUTE FUNCTION extensions.grant_pg_cron_access();


--
-- Name: issue_pg_graphql_access; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER issue_pg_graphql_access ON ddl_command_end
         WHEN TAG IN ('CREATE FUNCTION')
   EXECUTE FUNCTION extensions.grant_pg_graphql_access();


--
-- Name: issue_pg_net_access; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER issue_pg_net_access ON ddl_command_end
         WHEN TAG IN ('CREATE EXTENSION')
   EXECUTE FUNCTION extensions.grant_pg_net_access();


--
-- Name: pgrst_ddl_watch; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER pgrst_ddl_watch ON ddl_command_end
   EXECUTE FUNCTION extensions.pgrst_ddl_watch();


--
-- Name: pgrst_drop_watch; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER pgrst_drop_watch ON sql_drop
   EXECUTE FUNCTION extensions.pgrst_drop_watch();


--
-- PostgreSQL database dump complete
--

