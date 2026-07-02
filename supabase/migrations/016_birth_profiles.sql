-- ─── Migration 016: Birth Profiles ──────────────────────────────────────────
-- Stores Kundali birth data for registered users (multiple profiles per account)
-- and guest users (session_token based, claimed on signup).
-- Chart data computed once and stored — never recalculated.
-- Global-ready: stores IANA timezone for any birth location worldwide.

create table if not exists birth_profiles (
  id              uuid primary key default gen_random_uuid(),
  -- null owner_id = guest profile (temporary, claimed on signup)
  owner_id        uuid references profiles(id) on delete cascade,

  -- Who this profile is for
  label           text not null default 'My Chart',   -- 'Me', 'Priya (Wife)', 'Arjun (Son)'
  full_name       text,
  relation        text check (relation in (
                    'self','spouse','child','parent','sibling','friend','other'
                  )) default 'self',

  -- Birth details (always store in local birth timezone)
  date_of_birth   date not null,
  time_of_birth   time,                    -- null = unknown birth time
  birth_city      text,
  birth_country   text,
  birth_lat       numeric(9,6),
  birth_lng       numeric(9,6),
  birth_timezone  text,                    -- IANA e.g. 'Asia/Kolkata', 'America/New_York'

  -- Computed & stored (never recalculate — call once, keep forever)
  rashi           text,                    -- Moon sign rashi name
  sun_rashi       text,                    -- Sun sign rashi name
  nakshatra       text,                    -- Birth nakshatra
  nakshatra_pada  smallint,               -- 1-4
  nakshatra_lord  text,                    -- Planet lord
  lagna           text,                    -- Ascendant rashi
  lagna_deg       numeric(6,3),           -- Exact degree within lagna rashi
  ayanamsa        numeric(6,4),           -- Lahiri ayanamsa at birth
  chart_data      jsonb,                   -- Full planet positions, house cusps, dasha

  -- Dasha quick-access (for notifications & home card)
  current_dasha_planet   text,
  current_dasha_end_date date,
  next_dasha_planet      text,

  -- Profile meta
  is_primary      boolean default false,   -- User's own chart
  is_public       boolean default false,   -- Future: shareable via link

  -- Guest session support (claimed on signup, owner_id then set)
  session_token   text,

  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- ── Indexes ──────────────────────────────────────────────────────────────────
create index if not exists idx_birth_profiles_owner
  on birth_profiles(owner_id);

create index if not exists idx_birth_profiles_primary
  on birth_profiles(owner_id) where is_primary = true;

create index if not exists idx_birth_profiles_session
  on birth_profiles(session_token) where session_token is not null;

-- Partial index for daily Rashiphal notifications (users with known rashi)
create index if not exists idx_birth_profiles_rashi_notify
  on birth_profiles(owner_id, rashi)
  where is_primary = true and rashi is not null;

-- Enforce one primary profile per authenticated user at DB level
create unique index if not exists idx_birth_profiles_one_primary
  on birth_profiles(owner_id)
  where is_primary = true and owner_id is not null;

-- ── Row Level Security ────────────────────────────────────────────────────────
alter table birth_profiles enable row level security;

-- Authenticated users can manage their own profiles
create policy "Users manage own birth profiles"
  on birth_profiles for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

-- Guest profiles readable by anyone with the session token (handled in API layer)
-- No RLS policy for guests — API routes check session_token manually

-- ── Auto-update timestamp ─────────────────────────────────────────────────────
create or replace function update_birth_profiles_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger birth_profiles_updated_at
  before update on birth_profiles
  for each row execute function update_birth_profiles_updated_at();
