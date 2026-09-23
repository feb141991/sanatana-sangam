-- Migration: 20260923140000_notification_candidates_and_resolver.sql
-- Prompt 1: Candidate and resolver database contracts (future generic engagement stage)
-- Creates notification_candidates and notification_resolver_events audit tables.
-- Strict service-role-only access; forced RLS; structured semantic uniqueness.

-- 1. Create notification_candidates table
CREATE TABLE IF NOT EXISTS public.notification_candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_id TEXT NOT NULL,
  event_instance TEXT NOT NULL DEFAULT '',
  local_date DATE NOT NULL,
  audience_variant TEXT NOT NULL DEFAULT 'general',
  scheduled_for TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  priority INTEGER NOT NULL DEFAULT 50,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  action_url TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'en',
  timezone TEXT NOT NULL DEFAULT 'UTC',
  tradition TEXT,
  calendar_profile TEXT,
  source_status TEXT NOT NULL DEFAULT 'verified',
  source_refs JSONB NOT NULL DEFAULT '{}'::jsonb,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending'
    CONSTRAINT notification_candidates_status_check
    CHECK (status IN ('pending', 'accepted', 'suppressed', 'expired', 'cancelled')),
  decision_reason TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT notification_candidates_time_window_check
    CHECK (expires_at >= scheduled_for)
);

-- 2. Structured semantic uniqueness index
-- Ensures non-nullable tuple uniqueness across devotee, event, instance, date, and audience variant
CREATE UNIQUE INDEX IF NOT EXISTS idx_notification_candidates_semantic_unique
  ON public.notification_candidates (
    user_id,
    event_type,
    event_id,
    event_instance,
    local_date,
    audience_variant
  );

-- 3. Efficient resolution and query indexes
CREATE INDEX IF NOT EXISTS idx_notification_candidates_pending
  ON public.notification_candidates (scheduled_for, status)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_notification_candidates_user
  ON public.notification_candidates (user_id);

-- 4. Create notification_resolver_events append-only audit table
CREATE TABLE IF NOT EXISTS public.notification_resolver_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES public.notification_candidates(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  decision TEXT NOT NULL
    CONSTRAINT notification_resolver_events_decision_check
    CHECK (decision IN ('accepted', 'suppressed', 'expired', 'cancelled', 'deferred')),
  reason TEXT NOT NULL,
  winning_candidate_id UUID REFERENCES public.notification_candidates(id) ON DELETE SET NULL,
  policy_version TEXT NOT NULL DEFAULT 'v1',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  resolved_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Audit table indexes
CREATE INDEX IF NOT EXISTS idx_notification_resolver_events_candidate
  ON public.notification_resolver_events (candidate_id);

CREATE INDEX IF NOT EXISTS idx_notification_resolver_events_user_time
  ON public.notification_resolver_events (user_id, resolved_at DESC);

-- 6. Row-Level Security: strictly service-role-only, forced RLS, zero public/anon/authenticated access
ALTER TABLE public.notification_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_candidates FORCE ROW LEVEL SECURITY;

ALTER TABLE public.notification_resolver_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_resolver_events FORCE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.notification_candidates FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.notification_candidates TO service_role;

REVOKE ALL ON TABLE public.notification_resolver_events FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.notification_resolver_events TO service_role;
