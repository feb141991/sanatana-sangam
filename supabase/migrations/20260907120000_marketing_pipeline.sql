-- Migration: 20260907120000_marketing_pipeline.sql
-- Description: Durable data model for human-approved, consent-aware marketing pipeline.
-- Access: Service-role only. Anon/authenticated access is strictly forbidden by RLS + REVOKE.
--
-- Corrected in place before first apply (never applied to any environment as of this
-- edit -- confirmed via `list_migrations` against project mnbwodcswxoojndytngu). Original
-- draft used double-quoted string literals throughout, which Postgres parses as
-- identifiers, not strings, and would have failed on `db push` before ever reaching a
-- table. This revision also adds the unique constraint the application code already
-- assumes exists, completes RLS/grants to match this repo's service-role-only table
-- convention, adds approval-binding columns, and adds the two RPCs the dispatch and
-- consent-evaluation code depend on (recipient email lookup, atomic dispatch claiming).

-- 1. Create marketing_campaigns
CREATE TABLE IF NOT EXISTS public.marketing_campaigns (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_key         TEXT NOT NULL UNIQUE,
  campaign_type        TEXT NOT NULL DEFAULT 'newsletter'
                         CHECK (campaign_type IN ('newsletter', 'festival_reminder', 'announcement')),
  title                TEXT NOT NULL,
  status               TEXT NOT NULL DEFAULT 'draft'
                         CHECK (status IN ('draft', 'in_review', 'approved', 'dispatching', 'completed', 'cancelled')),
  source_type          TEXT NOT NULL DEFAULT 'manual'
                         CHECK (source_type IN ('manual', 'published_observance')),
  source_occurrence_id UUID NULL REFERENCES public.observance_occurrences(id) ON DELETE SET NULL,
  -- Set only by the server-side re-validation step in the occurrence-sourced create/approve
  -- path (src/lib/marketing/sources/published-observance.ts). Never client-settable -- the
  -- admin UI must not display "verified" merely because source_type was picked in a dropdown.
  source_verified_at  TIMESTAMPTZ NULL,
  created_by           TEXT NOT NULL,
  approved_by          TEXT NULL,
  approved_at          TIMESTAMPTZ NULL,
  cancelled_at         TIMESTAMPTZ NULL,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Approved-or-later implies approval metadata is actually set.
  CONSTRAINT chk_marketing_campaigns_approval_metadata CHECK (
    status NOT IN ('approved', 'dispatching', 'completed')
    OR (approved_by IS NOT NULL AND approved_at IS NOT NULL)
  ),
  -- cancelled_at is set if and only if the campaign is cancelled.
  CONSTRAINT chk_marketing_campaigns_terminal_state CHECK (
    (status = 'cancelled' AND cancelled_at IS NOT NULL)
    OR (status <> 'cancelled' AND cancelled_at IS NULL)
  )
);

-- 2. Create marketing_campaign_variants
CREATE TABLE IF NOT EXISTS public.marketing_campaign_variants (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id              UUID NOT NULL REFERENCES public.marketing_campaigns(id) ON DELETE CASCADE,
  channel                  TEXT NOT NULL CHECK (channel IN ('email', 'whatsapp')),
  locale                   TEXT NOT NULL DEFAULT 'en'
                             CHECK (locale ~ '^[a-z]{2}(-[A-Z]{2})?$'),
  subject                  TEXT NULL,
  body                     TEXT NOT NULL,
  cta_text                 TEXT NULL,
  cta_url                  TEXT NULL,
  source_snapshot          JSONB NOT NULL DEFAULT '{}'::jsonb,
  content_hash             TEXT NOT NULL,
  -- Bumped on every saveVariant edit; a plain human-readable revision counter distinct
  -- from (but recorded alongside) the content-addressed hash.
  content_version          INTEGER NOT NULL DEFAULT 1,
  -- Snapshot of content_hash/content_version taken at the moment approveCampaign
  -- succeeds. Cleared (set NULL) by saveVariant whenever an approved/in_review
  -- campaign is edited, alongside the existing approved_by/approved_at reset --
  -- this is what actually enforces "editing invalidates approval," not just the
  -- campaign status flip back to draft.
  approved_manifest_hash   TEXT NULL,
  approved_content_version INTEGER NULL,
  -- AI-generation provenance: which model/prompt/run produced this draft, if any.
  generation_provenance    JSONB NULL,
  -- Structured, reviewer-checkable source citations. Required non-empty before a
  -- campaign whose content depends on cited spiritual/source material can be approved
  -- (enforced in application code at approveCampaign, not by a blanket NOT NULL check
  -- here, since manual/non-cited campaign types are legitimate).
  source_citations         JSONB NOT NULL DEFAULT '[]'::jsonb,
  generation_metadata      JSONB NULL,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_marketing_campaign_variant_identity UNIQUE (campaign_id, channel, locale)
);

-- 3. Create marketing_dispatches
CREATE TABLE IF NOT EXISTS public.marketing_dispatches (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id         UUID NOT NULL REFERENCES public.marketing_campaigns(id) ON DELETE CASCADE,
  variant_id          UUID NOT NULL REFERENCES public.marketing_campaign_variants(id) ON DELETE CASCADE,
  recipient_user_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  channel             TEXT NOT NULL CHECK (channel IN ('email', 'whatsapp')),
  status              TEXT NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending', 'claimed', 'sent', 'failed', 'suppressed')),
  provider            TEXT NOT NULL DEFAULT 'resend',
  provider_message_id TEXT NULL,
  attempt_count       INTEGER NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  last_error_code     TEXT NULL,
  claimed_at          TIMESTAMPTZ NULL,
  sent_at             TIMESTAMPTZ NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_marketing_dispatch_recipient UNIQUE (campaign_id, variant_id, recipient_user_id, channel)
);

-- 4. RLS: enable + force + explicitly revoke anon/authenticated (service-role only,
--    matching the convention used by content_generation_jobs and
--    observance_materialisation_manifests -- no policies at all, deny by default).
ALTER TABLE public.marketing_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_campaigns FORCE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_campaign_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_campaign_variants FORCE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_dispatches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_dispatches FORCE ROW LEVEL SECURITY;

REVOKE ALL ON public.marketing_campaigns FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.marketing_campaign_variants FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.marketing_dispatches FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.marketing_campaigns TO service_role;
GRANT ALL ON public.marketing_campaign_variants TO service_role;
GRANT ALL ON public.marketing_dispatches TO service_role;

-- 5. Indexes for fast status filtering and atomic claiming
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_status ON public.marketing_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_marketing_campaign_variants_campaign ON public.marketing_campaign_variants(campaign_id);
CREATE INDEX IF NOT EXISTS idx_marketing_dispatches_claim ON public.marketing_dispatches(campaign_id, variant_id, channel, status);
CREATE INDEX IF NOT EXISTS idx_marketing_dispatches_recipient ON public.marketing_dispatches(recipient_user_id);

-- 6a. content_version is maintained entirely at the database layer -- always 1 on
--     first insert, bumped only when a manifest-relevant column actually changes on
--     update (not when approveCampaign later stamps approved_manifest_hash /
--     approved_content_version onto the same row -- that stamp must not itself count
--     as a new content edit). Application code (saveVariant) never has to pre-fetch a
--     row just to compute the next version, and can't get it wrong by racing a
--     concurrent edit.
CREATE OR REPLACE FUNCTION public.bump_marketing_variant_content_version()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.content_version := 1;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.subject IS DISTINCT FROM OLD.subject
       OR NEW.body IS DISTINCT FROM OLD.body
       OR NEW.cta_text IS DISTINCT FROM OLD.cta_text
       OR NEW.cta_url IS DISTINCT FROM OLD.cta_url
       OR NEW.source_snapshot IS DISTINCT FROM OLD.source_snapshot
       OR NEW.source_citations IS DISTINCT FROM OLD.source_citations
    THEN
      NEW.content_version := OLD.content_version + 1;
    ELSE
      NEW.content_version := OLD.content_version;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_bump_marketing_variant_content_version
  BEFORE INSERT OR UPDATE ON public.marketing_campaign_variants
  FOR EACH ROW EXECUTE FUNCTION public.bump_marketing_variant_content_version();

-- 6. updated_at maintenance, reusing the existing public.handle_updated_at() trigger
--    function already used by (among others) public.profiles' set_profiles_updated_at
--    trigger. marketing_campaign_variants has no updated_at column (it's upserted
--    wholesale by saveVariant, never partially patched) so no trigger is needed there.
CREATE TRIGGER set_marketing_campaigns_updated_at
  BEFORE UPDATE ON public.marketing_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_marketing_dispatches_updated_at
  BEFORE UPDATE ON public.marketing_dispatches
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 7. 'sent' is a terminal, one-way status. No code path may move a dispatch row off
--    'sent' once reached -- enforced at the database, not left to every call site to
--    remember. A lost/uncertain provider response must never be "corrected" by
--    downgrading an already-sent row; it must instead never have been marked sent in
--    the first place until the provider confirmed success.
CREATE OR REPLACE FUNCTION public.protect_sent_marketing_dispatch()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF OLD.status = 'sent' AND NEW.status <> 'sent' THEN
    RAISE EXCEPTION 'marketing_dispatches: cannot change status away from sent (id=%)', OLD.id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_protect_sent_marketing_dispatch
  BEFORE UPDATE ON public.marketing_dispatches
  FOR EACH ROW EXECUTE FUNCTION public.protect_sent_marketing_dispatch();

-- 8. Recipient email lookup. profiles/public_profiles carry no email column -- email
--    only exists on Supabase's built-in auth.users, which is unreachable via a plain
--    PostgREST `.from('profiles')` query. This function is intentionally narrow: it
--    returns emails only for IDs the caller already selected via the normal
--    profiles-based eligibility query (tradition/consent/is_banned/pagination), never
--    a bulk auth.users read. service_role only.
CREATE OR REPLACE FUNCTION public.get_recipient_emails(p_user_ids UUID[])
RETURNS TABLE(id UUID, email TEXT)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT u.id, u.email
  FROM auth.users u
  WHERE u.id = ANY(p_user_ids);
$$;

REVOKE ALL ON FUNCTION public.get_recipient_emails(UUID[]) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_recipient_emails(UUID[]) TO service_role;

-- 9. Atomic dispatch claiming, mirroring public.claim_due_scheduled_notifications'
--    FOR UPDATE SKIP LOCKED + lease-recovery pattern (notification_schedule_pipeline /
--    notification_schedule_lease_recovery migrations). Only the caller holding a
--    claimed row may invoke a provider for it; a claim whose lease has expired
--    (worker crashed/timed out) becomes reclaimable by the next batch instead of being
--    force-marked failed or sent -- a lost provider response is uncertain, not
--    definitively failed. attempt_count increments atomically as part of the claim
--    itself, never as a separate read-modify-write.
CREATE OR REPLACE FUNCTION public.claim_marketing_dispatches(
  p_campaign_id UUID,
  p_variant_id UUID,
  p_channel TEXT,
  p_limit INT DEFAULT 100,
  p_lease_minutes INT DEFAULT 15
)
RETURNS SETOF public.marketing_dispatches
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH to_claim AS (
    SELECT id
    FROM public.marketing_dispatches
    WHERE campaign_id = p_campaign_id
      AND variant_id = p_variant_id
      AND channel = p_channel
      AND (
        status = 'pending'
        OR (status = 'claimed' AND claimed_at <= NOW() - (p_lease_minutes || ' minutes')::INTERVAL)
      )
    ORDER BY created_at ASC
    LIMIT p_limit
    FOR UPDATE SKIP LOCKED
  )
  UPDATE public.marketing_dispatches d
  SET status = 'claimed',
      claimed_at = NOW(),
      attempt_count = attempt_count + 1
  FROM to_claim
  WHERE d.id = to_claim.id
  RETURNING d.*;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_marketing_dispatches(UUID, UUID, TEXT, INT, INT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_marketing_dispatches(UUID, UUID, TEXT, INT, INT) TO service_role;
