-- Shadow mirror of the production tables under test.
-- Column types, nullability, defaults and CHECK/UNIQUE constraints copied from
-- production information_schema + pg_constraint, so a migration that applies
-- here is exercising the real shape rather than a convenient approximation.

CREATE SCHEMA IF NOT EXISTS auth;
CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT NULL::uuid $$;

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  is_admin boolean DEFAULT false
);

CREATE TABLE calendar_profiles (
  slug              text PRIMARY KEY,
  display_name      text NOT NULL,
  region            text NOT NULL,
  month_system      text,
  solar_month_rule  text,
  era               text,
  ayanamsha         text NOT NULL DEFAULT 'lahiri',
  sunrise_rule      text NOT NULL DEFAULT 'upper_limb_refracted',
  month_name_locale text NOT NULL,
  version           text NOT NULL DEFAULT '1.0.0',
  scholarly_status  text NOT NULL DEFAULT '[S] ratification pending',
  citation          text NOT NULL,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE tradition_profiles (
  slug                 text PRIMARY KEY,
  display_name         text NOT NULL,
  ekadashi_method      text NOT NULL,
  janmashtami_method   text NOT NULL,
  shivaratri_method    text NOT NULL,
  paran_rule           text NOT NULL,
  version              text NOT NULL DEFAULT '1.0.0',
  scholarly_status     text NOT NULL DEFAULT '[S] ratification pending',
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE observance_definitions (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  slug                text NOT NULL,
  display_name        text NOT NULL,
  kind                text,
  tradition           text,
  calendar_rule_type  text,
  verification_type   text,
  route_kind          text,
  route_slug          text,
  region              text,
  active              boolean NOT NULL DEFAULT true,
  emoji               text DEFAULT '🪔',
  description         text,
  is_shared           boolean NOT NULL DEFAULT false,
  guarantee_level     text NOT NULL DEFAULT 'manual_review_required'
);

CREATE TABLE observance_occurrences (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at               timestamptz NOT NULL DEFAULT now(),
  updated_at               timestamptz NOT NULL DEFAULT now(),
  definition_id            uuid NOT NULL REFERENCES observance_definitions(id),
  year                     integer NOT NULL,
  date                     date NOT NULL,
  calculation_version      text NOT NULL DEFAULT '1.0.0',
  calculated_by            text NOT NULL DEFAULT 'system',
  verification_status      text,
  verification_note        text,
  suggested_date           date,
  review_status            text,
  source_provenance        jsonb NOT NULL DEFAULT '{}'::jsonb,
  verification_confidence  text,
  verification_run_at      timestamptz,
  reviewed_at              timestamptz,
  review_notes             text,
  manual_date_override     date,
  manual_override_reason   text,
  locked_for_regeneration  boolean NOT NULL DEFAULT false,
  final_date_source        text NOT NULL DEFAULT 'legacy_seed',
  audit_status             text NOT NULL DEFAULT 'not_run',
  audit_failure_reason     text,
  audit_retry_count        integer NOT NULL DEFAULT 0,
  last_audited_at          timestamptz,
  calendar_profile         text,
  spiritual_tradition      text,
  variant_key              text,
  is_primary_variant       boolean,
  occurrence_date          text NOT NULL,
  rule_version             text,
  astronomy_version        text,
  day_boundary_version     text,
  reasons                  jsonb,
  source_refs              jsonb,
  diagnostics              jsonb,
  computed_latitude        double precision,
  computed_longitude       double precision,
  computed_timezone        text,
  publication_status       text NOT NULL DEFAULT 'published',
  CONSTRAINT observance_occurrences_audit_status_check
    CHECK (audit_status = ANY (ARRAY['not_run','completed','failed','skipped'])),
  CONSTRAINT observance_occurrences_final_date_source_check
    CHECK (final_date_source = ANY (ARRAY['legacy_seed','manual_override','calculation_engine','calculation_engine_reviewed','fallback'])),
  CONSTRAINT observance_occurrences_review_status_check
    CHECK (review_status = ANY (ARRAY['needs_review','reviewed'])),
  CONSTRAINT observance_occurrences_verification_confidence_check
    CHECK (verification_confidence = ANY (ARRAY['high','medium','low'])),
  CONSTRAINT observance_occurrences_verification_status_check
    CHECK (verification_status = ANY (ARRAY['verified','mismatch','uncertain','not_checked','manual_review'])),
  CONSTRAINT observance_occurrences_publication_status_check
    CHECK (publication_status IN ('published','withheld_disputed')),
  CONSTRAINT uq_observance_occurrences_instance
    UNIQUE (definition_id, year, calendar_profile, occurrence_date, variant_key)
);

CREATE INDEX idx_observance_occurrences_withheld
  ON observance_occurrences (definition_id, year)
  WHERE publication_status <> 'published';

CREATE TABLE observance_review_queue (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  definition_id      uuid NOT NULL REFERENCES observance_definitions(id),
  year               integer NOT NULL,
  calendar_profile   text NOT NULL,
  location_label     text NOT NULL,
  computed_latitude  double precision NOT NULL,
  computed_longitude double precision NOT NULL,
  computed_timezone  text NOT NULL,
  ambiguity_type     text NOT NULL,
  reasoning          text NOT NULL,
  candidate_dates    jsonb NOT NULL,
  evaluator_details  jsonb NOT NULL,
  review_status      text NOT NULL DEFAULT 'pending_review',
  reviewed_by        uuid,
  reviewed_at        timestamptz,
  review_notes       text,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT observance_review_queue_ambiguity_type_check
    CHECK (ambiguity_type IN ('no_qualified_date','multiple_qualified_dates','vrddhi_tithi','disputed_ratification')),
  CONSTRAINT observance_review_queue_review_status_check
    CHECK (review_status = ANY (ARRAY['approved','pending_review','rejected'])),
  CONSTRAINT uq_observance_review_queue_location
    UNIQUE (definition_id, year, calendar_profile, computed_latitude, computed_longitude)
);

-- ── golden_fixtures & golden_fixture_audit_logs STUBS ────────────────────────
CREATE TABLE IF NOT EXISTS public.golden_fixtures (
  case_id text PRIMARY KEY,
  festival_id text NOT NULL,
  year integer NOT NULL CHECK (year >= 2000 AND year <= 2100),
  location jsonb NOT NULL,
  profile jsonb NOT NULL,
  expected jsonb,
  tolerance jsonb NOT NULL,
  source jsonb NOT NULL,
  reasoning text NOT NULL,
  approved boolean NOT NULL DEFAULT false,
  reviewed_by text,
  reviewed_at timestamptz,
  review_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.golden_fixture_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id text NOT NULL,
  festival_id text NOT NULL,
  year integer NOT NULL,
  actor text NOT NULL,
  action text NOT NULL CHECK (action IN ('newly_approved', 're_confirmed', 'rejected', 'content_updated')),
  previous_approved boolean,
  new_approved boolean,
  review_notes text,
  diff jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
