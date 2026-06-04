-- ─────────────────────────────────────────────────────────────────────────────
-- Shoonaya — Co-Creator Feature Naming Rights
-- Sthapakas #1–#100 may name a feature. Forever attributed on the UI.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.feature_namings (
  id                uuid        primary key default gen_random_uuid(),
  -- The named feature
  feature_slug      text        not null unique,        -- e.g. 'daily-shloka', 'brahma-muhurta-bell'
  feature_name      text        not null,               -- The name the Sthapaka chose
  feature_category  text        not null default 'feature', -- 'feature' | 'ritual' | 'section' | 'cron'
  feature_desc      text,                               -- Short public description of what it does
  -- The Sthapaka who named it
  sthapaka_number   int         not null check (sthapaka_number between 1 and 100),
  named_by          text        not null,               -- Display name (not email)
  tradition         text        check (tradition in ('hindu','sikh','buddhist','jain')),
  -- Meta
  named_on          date        not null default current_date,
  is_public         boolean     not null default true,
  created_at        timestamptz not null default now()
);

-- RLS
alter table public.feature_namings enable row level security;

-- Anyone can read public namings
create policy "feature_namings_public_read"
  on public.feature_namings for select
  using (is_public = true);

-- Only service role can insert/update (admin-only operation)
create policy "feature_namings_service_write"
  on public.feature_namings for all
  using (auth.role() = 'service_role');

-- Index for ordering
create index if not exists idx_feature_namings_number
  on public.feature_namings (sthapaka_number asc);
