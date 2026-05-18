-- ─── Migration 017: Birth Profiles — upsert safety & RLS fix ────────────────
-- Fixes the unique-primary constraint violation when auto-saving a second chart.
-- Also adds service-role bypass policy needed for guest claim flow.

-- 1. Drop the strict unique index (API already unsets existing primary first,
--    but race conditions can still trigger the constraint).
drop index if exists idx_birth_profiles_one_primary;

-- 2. Re-create as a regular (non-unique) index for fast ordering.
create index if not exists idx_birth_profiles_primary_order
  on birth_profiles(owner_id, is_primary desc)
  where owner_id is not null;

-- 3. Allow service-role key to bypass RLS (needed for API routes & claim flow).
create policy if not exists "Service role full access"
  on birth_profiles for all
  to service_role
  using (true)
  with check (true);
