-- Daily social content pipeline (Instagram, Facebook, LinkedIn) --
-- Phase 1 foundation. Parallel to marketing_campaigns/marketing_campaign_variants
-- (email/WhatsApp), not an extension of their channel CHECK constraint --
-- marketing_dispatches is a per-recipient fan-out model with no concept of
-- a single public post, so social publishing needs its own tables. See
-- the approved plan (Marketing Studio social pipeline, Revision 4) for the
-- full design rationale; this migration implements section 1 exactly.

-- ── Config: per-content-type automation policy, versioned ──────────────────
create table public.social_publishing_config (
  id uuid primary key default gen_random_uuid(),
  content_type text not null unique check (content_type in ('festival', 'general')),
  automation_mode text not null default 'manual' check (automation_mode in ('manual', 'automatic', 'paused')),
  destination_account_ids uuid[] not null default '{}',
  publish_time_local text, -- e.g. '09:00', interpreted against target_timezone at reservation
  version int not null default 1,
  updated_by text,
  updated_at timestamptz not null default now()
);

comment on table public.social_publishing_config is
  'Per-content-type (festival/general) automation defaults. version increments on every change so social_posts.policy_version can trace which revision produced a given post''s frozen policy. Service-role only.';

insert into public.social_publishing_config (content_type, automation_mode) values
  ('festival', 'manual'),
  ('general', 'manual');

-- ── Global pause: live-checked kill switches, separate from per-type mode ──
create table public.social_publishing_global_pause (
  id boolean primary key default true check (id = true), -- singleton row
  generation_paused boolean not null default false,
  publishing_paused boolean not null default false,
  updated_by text,
  updated_at timestamptz not null default now()
);

comment on table public.social_publishing_global_pause is
  'Singleton kill switches. generation_paused is checked before reservation and before each image/caption generation call; publishing_paused is checked immediately before every external publish call, even for an already-approved post. Neither retroactively changes a post''s frozen policy_version -- they are live overrides layered on top of it.';

insert into public.social_publishing_global_pause (id) values (true);

-- ── OAuth-connected destination accounts ────────────────────────────────────
create table public.social_platform_accounts (
  id uuid primary key default gen_random_uuid(),
  provider text not null check (provider in ('meta', 'linkedin')),
  account_type text not null check (account_type in ('facebook_page', 'instagram_business', 'linkedin_organization')),
  external_account_id text not null,
  display_name text,
  access_token_enc text,
  refresh_token_enc text,
  key_version int not null default 1,
  token_expires_at timestamptz,
  scopes text[] not null default '{}',
  status text not null default 'active' check (status in ('active', 'expiring_soon', 'expired', 'revoked', 'error')),
  last_error text,
  connected_by text not null,
  connected_at timestamptz not null default now(),
  last_refreshed_at timestamptz,
  last_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, account_type, external_account_id)
);

comment on table public.social_platform_accounts is
  'OAuth-connected Facebook Page / Instagram Business / LinkedIn Organization destinations. access_token_enc/refresh_token_enc use one tested AES-256-GCM path (see src/lib/marketing/social/token-crypto.ts) -- NOT apple_auth_tokens''s pattern, which has a confirmed live encrypt/decrypt mismatch. key_version supports rotation without a flag-day migration.';

-- ── Admin-editable rotation pool for non-festival days ──────────────────────
create table public.social_general_themes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  prompt_seed text not null,
  grounding_material text, -- required (enforced in application logic) when a theme makes any factual/spiritual claim
  is_active boolean not null default true,
  display_order int not null default 0,
  last_used_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column public.social_general_themes.grounding_material is
  'Admin-populated factual/scriptural backing for a theme''s claims, reviewed the same way festival source_citations are. A prompt_seed alone is not sufficient grounding for a spiritual claim.';

-- ── One row per calendar day''s post ─────────────────────────────────────────
create table public.social_posts (
  id uuid primary key default gen_random_uuid(),
  post_key text not null unique, -- e.g. 'social-2026-09-21', gives free reservation idempotency
  theme_type text not null check (theme_type in ('festival', 'general')),
  source_type text not null check (source_type in ('published_observance', 'general_theme')),
  source_occurrence_id uuid references public.observance_occurrences(id) on delete set null,
  source_general_theme_id uuid references public.social_general_themes(id) on delete set null,
  source_snapshot jsonb,
  source_verified_at timestamptz, -- server-set only, mirrors marketing_campaigns.source_verified_at
  objective text check (objective in ('awareness', 'learning', 'app_discovery', 'activation')),
  target_timezone text,
  target_region text,
  target_tradition text,
  internal_label text not null,
  pipeline_stage text not null default 'reserved' check (pipeline_stage in (
    'reserved', 'image_ready', 'captions_drafted', 'review', 'approved',
    'publishing', 'completed', 'partially_published', 'needs_investigation',
    'failed', 'expired'
  )),
  -- Policy frozen at reservation (plan section 2, point 5) -- every later
  -- stage reads these, never re-resolves social_publishing_config live.
  frozen_automation_mode text not null check (frozen_automation_mode in ('manual', 'automatic', 'paused')),
  frozen_destination_account_ids uuid[] not null default '{}',
  frozen_scheduled_publish_at timestamptz,
  policy_version int,
  scheduled_generate_at timestamptz,
  image_asset_url text, -- private-bucket path until approval releases it (plan section 6)
  image_generation_provenance jsonb,
  -- Stage claim/lease (plan section 2, point 3)
  claimed_by text,
  lease_expires_at timestamptz,
  created_by text not null,
  approved_by text,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint social_posts_approval_requires_metadata check (
    pipeline_stage not in (
      'approved', 'publishing', 'completed', 'partially_published',
      'needs_investigation', 'failed', 'expired'
    )
    or (approved_by is not null and approved_at is not null)
  )
);

comment on column public.social_posts.pipeline_stage is
  'needs_investigation overrides every other aggregate state whenever any variant is outcome_unknown -- see the rollup trigger below. partially_published is only reachable once nothing remains unresolved.';

-- ── One row per platform per post ────────────────────────────────────────────
create table public.social_post_variants (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.social_posts(id) on delete cascade,
  platform text not null check (platform in ('instagram', 'facebook', 'linkedin')),
  caption text,
  hashtags text[] not null default '{}',
  cta_url text,
  content_hash text,
  content_version int not null default 1,
  approved_manifest_hash text,
  approved_content_version int,
  approved_image_content_hash text,
  approved_source_content_hash text,
  approved_platform_account_id uuid references public.social_platform_accounts(id),
  generation_provenance jsonb,
  source_citations jsonb not null default '[]',
  generation_metadata jsonb,
  generation_attempt_count int not null default 0,
  publish_status text not null default 'pending' check (publish_status in (
    'pending', 'publishing', 'published', 'failed', 'outcome_unknown', 'expired', 'skipped'
  )),
  provider_request_id text,
  platform_intermediate_ref text,
  external_post_id text,
  permalink_url text,
  published_at timestamptz,
  last_error_code text,
  attempt_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (post_id, platform)
);

comment on column public.social_post_variants.publish_status is
  'expired lives here, per-destination, never at the post level (plan section 2, point 4) -- a post-level expiry could erase evidence that one specific destination''s send is still unresolved. Only set when NO started event exists for this variant; an in-flight or ambiguous attempt must stay outcome_unknown regardless of deadline.';

-- ── Event-sourced publish attempt log -- genuinely append-only ─────────────
create table public.social_publish_attempts (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null, -- shared across every event in one send attempt
  variant_id uuid not null references public.social_post_variants(id) on delete cascade,
  event_type text not null check (event_type in ('started', 'succeeded', 'rejected', 'unknown', 'reconciliation_finding')),
  provider_request_id text,
  platform_intermediate_ref text,
  external_post_id text,
  permalink_url text,
  error_summary text, -- sanitized/length-bounded, never a raw provider error blob
  created_by text, -- 'system:pipeline-tick' or an admin identifier, for reconciliation_finding events
  created_at timestamptz not null default now()
);

comment on table public.social_publish_attempts is
  'Immutable events, never updated after insert. One attempt = one started event followed by exactly one of succeeded/rejected/unknown, written in the SAME transaction as the corresponding social_post_variants.publish_status update. A later reconciliation_finding event (from human investigation) resolves an unknown outcome, also transactionally with its resulting status change. Invariant enforced in application code, not a CHECK constraint: a new started event for a variant may only be inserted if every prior attempt_id for that variant already has a terminal event -- this is what stops a second worker from starting a new send while an earlier attempt''s outcome is still unresolved.';

create index social_publish_attempts_variant_id_idx on public.social_publish_attempts (variant_id, created_at desc);
create index social_publish_attempts_attempt_id_idx on public.social_publish_attempts (attempt_id);

-- ── Indexes ──────────────────────────────────────────────────────────────────
create index social_posts_pipeline_stage_idx on public.social_posts (pipeline_stage);
create index social_posts_lease_idx on public.social_posts (lease_expires_at) where lease_expires_at is not null;
create index social_post_variants_post_id_idx on public.social_post_variants (post_id);
create index social_post_variants_publish_status_idx on public.social_post_variants (publish_status);

-- ── Triggers ─────────────────────────────────────────────────────────────────
create or replace function public.bump_social_variant_content_version()
returns trigger
language plpgsql
as $$
begin
  if (
    new.caption is distinct from old.caption or
    new.hashtags is distinct from old.hashtags or
    new.cta_url is distinct from old.cta_url or
    new.source_citations is distinct from old.source_citations
  ) then
    new.content_version := old.content_version + 1;
    new.approved_manifest_hash := null;
    new.approved_content_version := null;
  end if;
  return new;
end;
$$;

create trigger social_post_variants_bump_content_version
  before update on public.social_post_variants
  for each row execute function public.bump_social_variant_content_version();

create or replace function public.protect_published_social_variant()
returns trigger
language plpgsql
as $$
begin
  if old.publish_status = 'published' and new.publish_status is distinct from 'published' then
    raise exception 'social_post_variants: cannot change publish_status away from published (variant %)', old.id;
  end if;
  return new;
end;
$$;

create trigger social_post_variants_protect_published
  before update on public.social_post_variants
  for each row execute function public.protect_published_social_variant();

create or replace function public.handle_social_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger social_posts_set_updated_at
  before update on public.social_posts
  for each row execute function public.handle_social_updated_at();

create trigger social_post_variants_set_updated_at
  before update on public.social_post_variants
  for each row execute function public.handle_social_updated_at();

create trigger social_platform_accounts_set_updated_at
  before update on public.social_platform_accounts
  for each row execute function public.handle_social_updated_at();

create trigger social_general_themes_set_updated_at
  before update on public.social_general_themes
  for each row execute function public.handle_social_updated_at();

-- ── Aggregate rollup: recomputes the parent post''s pipeline_stage whenever
-- a variant's publish_status resolves, in the SAME transaction (plan
-- section 2, "Explicit aggregate rollup"). Only runs once a post has left
-- the pre-publish stages (review/approved/publishing or later) -- earlier
-- stages are driven by the pipeline tick itself, not by variant changes.
create or replace function public.rollup_social_post_status()
returns trigger
language plpgsql
as $$
declare
  v_statuses text[];
  v_post_stage text;
begin
  select pipeline_stage into v_post_stage from public.social_posts where id = new.post_id;
  if v_post_stage is null or v_post_stage in (
    'reserved', 'image_ready', 'captions_drafted', 'review', 'approved'
  ) then
    return new;
  end if;

  select array_agg(publish_status) into v_statuses
  from public.social_post_variants
  where post_id = new.post_id;

  if 'outcome_unknown' = any(v_statuses) then
    update public.social_posts set pipeline_stage = 'needs_investigation' where id = new.post_id and pipeline_stage != 'needs_investigation';
  elsif v_statuses <@ array['published']::text[] then
    update public.social_posts set pipeline_stage = 'completed' where id = new.post_id and pipeline_stage != 'completed';
  elsif v_statuses <@ array['expired']::text[] then
    update public.social_posts set pipeline_stage = 'expired' where id = new.post_id and pipeline_stage != 'expired';
  elsif 'published' = any(v_statuses) and v_statuses <@ array['published', 'failed', 'expired', 'skipped']::text[] then
    update public.social_posts set pipeline_stage = 'partially_published' where id = new.post_id and pipeline_stage != 'partially_published';
  elsif not (v_statuses && array['publishing', 'pending']::text[]) then
    -- nothing published, at least one failed, none still in flight or unresolved
    update public.social_posts set pipeline_stage = 'failed' where id = new.post_id and pipeline_stage != 'failed';
  end if;

  return new;
end;
$$;

create trigger social_post_variants_rollup_status
  after update of publish_status on public.social_post_variants
  for each row execute function public.rollup_social_post_status();

-- ── Stage claim/lease RPC (plan section 2, point 3) -- mirrors the existing
-- claim_marketing_dispatches / claim_due_scheduled_notifications pattern
-- (FOR UPDATE SKIP LOCKED), with an added expected-stage optimistic-
-- concurrency check. A lease expiring does NOT by itself prove the
-- original worker stopped (it may still be mid-flight) -- the actual
-- send-time safety property is the started-event invariant documented on
-- social_publish_attempts above, enforced in application code immediately
-- before any external call, not by this RPC alone.
create or replace function public.claim_social_post_stage(
  p_post_id uuid,
  p_expected_stage text,
  p_worker_token text,
  p_lease_seconds int default 300
)
returns public.social_posts
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.social_posts;
begin
  select * into v_row
  from public.social_posts
  where id = p_post_id
    and pipeline_stage = p_expected_stage
    and (lease_expires_at is null or lease_expires_at < now())
  for update skip locked;

  if not found then
    return null;
  end if;

  update public.social_posts
  set claimed_by = p_worker_token,
      lease_expires_at = now() + (p_lease_seconds || ' seconds')::interval
  where id = p_post_id
  returning * into v_row;

  return v_row;
end;
$$;

revoke all on function public.claim_social_post_stage(uuid, text, text, int) from public, anon, authenticated;
grant execute on function public.claim_social_post_stage(uuid, text, text, int) to service_role;

-- ── Transactional attempt-log writes ────────────────────────────────────────
-- Supabase-js has no multi-statement transaction primitive across separate
-- .from() calls, but the plan requires the attempt-log event and the
-- corresponding social_post_variants.publish_status update to happen in the
-- SAME transaction (never a window where they can disagree after a crash).
-- These three RPCs are that transaction boundary -- application code (see
-- src/lib/marketing/social/pipeline.ts) must go through them rather than
-- inserting into social_publish_attempts and updating social_post_variants
-- as two separate calls.

-- Enforces the append-only log's core invariant: a new 'started' event may
-- only be inserted for a variant if every prior attempt_id for that variant
-- already has a terminal event. Locks the variant row first so two
-- concurrent callers for the same variant serialize on this check instead
-- of both passing it.
create or replace function public.start_social_publish_attempt(
  p_variant_id uuid,
  p_attempt_id uuid,
  p_worker_token text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_unresolved_count int;
begin
  perform 1 from public.social_post_variants where id = p_variant_id for update;

  select count(*) into v_unresolved_count
  from public.social_publish_attempts started
  where started.variant_id = p_variant_id
    and started.event_type = 'started'
    and not exists (
      select 1 from public.social_publish_attempts terminal
      where terminal.attempt_id = started.attempt_id
        and terminal.event_type in ('succeeded', 'rejected', 'unknown')
    );

  if v_unresolved_count > 0 then
    raise exception 'start_social_publish_attempt: variant % already has an unresolved started attempt', p_variant_id;
  end if;

  insert into public.social_publish_attempts (attempt_id, variant_id, event_type, created_by)
  values (p_attempt_id, p_variant_id, 'started', p_worker_token);

  update public.social_post_variants
  set publish_status = 'publishing'
  where id = p_variant_id;
end;
$$;

revoke all on function public.start_social_publish_attempt(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.start_social_publish_attempt(uuid, uuid, text) to service_role;

-- Records the terminal outcome of an attempt (succeeded/rejected/unknown)
-- and moves the variant's publish_status accordingly, atomically. This is
-- the ONLY function that may resolve a 'started' event -- the rollup
-- trigger on social_post_variants then fires from the status update inside
-- this same transaction.
create or replace function public.record_social_publish_result(
  p_attempt_id uuid,
  p_variant_id uuid,
  p_event_type text,
  p_provider_request_id text default null,
  p_platform_intermediate_ref text default null,
  p_external_post_id text default null,
  p_permalink_url text default null,
  p_error_summary text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_new_status text;
begin
  if p_event_type not in ('succeeded', 'rejected', 'unknown') then
    raise exception 'record_social_publish_result: invalid terminal event_type %', p_event_type;
  end if;

  insert into public.social_publish_attempts (
    attempt_id, variant_id, event_type, provider_request_id,
    platform_intermediate_ref, external_post_id, permalink_url, error_summary
  ) values (
    p_attempt_id, p_variant_id, p_event_type, p_provider_request_id,
    p_platform_intermediate_ref, p_external_post_id, p_permalink_url, p_error_summary
  );

  v_new_status := case p_event_type
    when 'succeeded' then 'published'
    when 'rejected' then 'failed'
    when 'unknown' then 'outcome_unknown'
  end;

  update public.social_post_variants
  set publish_status = v_new_status,
      provider_request_id = coalesce(p_provider_request_id, provider_request_id),
      platform_intermediate_ref = coalesce(p_platform_intermediate_ref, platform_intermediate_ref),
      external_post_id = coalesce(p_external_post_id, external_post_id),
      permalink_url = coalesce(p_permalink_url, permalink_url),
      published_at = case when p_event_type = 'succeeded' then now() else published_at end,
      last_error_code = case when p_event_type in ('rejected', 'unknown') then p_error_summary else last_error_code end,
      attempt_count = attempt_count + 1
  where id = p_variant_id;
end;
$$;

revoke all on function public.record_social_publish_result(uuid, uuid, text, text, text, text, text, text) from public, anon, authenticated;
grant execute on function public.record_social_publish_result(uuid, uuid, text, text, text, text, text, text) to service_role;

-- Human-investigation resolution of an outcome_unknown variant. Only ever
-- moves a variant that is CURRENTLY outcome_unknown (checked via the
-- update's own WHERE + FOUND check, inside this transaction) -- a variant
-- that has since resolved some other way is left alone rather than
-- silently overwritten by a stale investigation result.
create or replace function public.record_social_reconciliation_finding(
  p_variant_id uuid,
  p_attempt_id uuid,
  p_admin_identifier text,
  p_resolution text,
  p_external_post_id text default null,
  p_permalink_url text default null,
  p_notes text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_new_status text;
  v_updated_count int;
begin
  if p_resolution not in ('confirmed_published', 'confirmed_not_published') then
    raise exception 'record_social_reconciliation_finding: invalid resolution %', p_resolution;
  end if;

  insert into public.social_publish_attempts (
    attempt_id, variant_id, event_type, external_post_id, permalink_url, error_summary, created_by
  ) values (
    p_attempt_id, p_variant_id, 'reconciliation_finding', p_external_post_id, p_permalink_url, p_notes, p_admin_identifier
  );

  v_new_status := case p_resolution
    when 'confirmed_published' then 'published'
    when 'confirmed_not_published' then 'failed'
  end;

  update public.social_post_variants
  set publish_status = v_new_status,
      external_post_id = coalesce(p_external_post_id, external_post_id),
      permalink_url = coalesce(p_permalink_url, permalink_url),
      published_at = case when p_resolution = 'confirmed_published' then now() else published_at end
  where id = p_variant_id
    and publish_status = 'outcome_unknown';

  get diagnostics v_updated_count = row_count;
  if v_updated_count = 0 then
    raise exception 'record_social_reconciliation_finding: variant % is not currently outcome_unknown', p_variant_id;
  end if;
end;
$$;

revoke all on function public.record_social_reconciliation_finding(uuid, uuid, text, text, text, text, text) from public, anon, authenticated;
grant execute on function public.record_social_reconciliation_finding(uuid, uuid, text, text, text, text, text) to service_role;

-- ── RLS: deny-by-default, service-role only -- identical convention to
-- every table in marketing_pipeline.sql ──────────────────────────────────────
alter table public.social_publishing_config enable row level security;
alter table public.social_publishing_config force row level security;
revoke all on public.social_publishing_config from public, anon, authenticated;
grant all on public.social_publishing_config to service_role;

alter table public.social_publishing_global_pause enable row level security;
alter table public.social_publishing_global_pause force row level security;
revoke all on public.social_publishing_global_pause from public, anon, authenticated;
grant all on public.social_publishing_global_pause to service_role;

alter table public.social_platform_accounts enable row level security;
alter table public.social_platform_accounts force row level security;
revoke all on public.social_platform_accounts from public, anon, authenticated;
grant all on public.social_platform_accounts to service_role;

alter table public.social_general_themes enable row level security;
alter table public.social_general_themes force row level security;
revoke all on public.social_general_themes from public, anon, authenticated;
grant all on public.social_general_themes to service_role;

alter table public.social_posts enable row level security;
alter table public.social_posts force row level security;
revoke all on public.social_posts from public, anon, authenticated;
grant all on public.social_posts to service_role;

alter table public.social_post_variants enable row level security;
alter table public.social_post_variants force row level security;
revoke all on public.social_post_variants from public, anon, authenticated;
grant all on public.social_post_variants to service_role;

alter table public.social_publish_attempts enable row level security;
alter table public.social_publish_attempts force row level security;
revoke all on public.social_publish_attempts from public, anon, authenticated;
grant all on public.social_publish_attempts to service_role;
