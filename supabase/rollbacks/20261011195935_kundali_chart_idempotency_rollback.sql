drop index if exists public.idx_birth_profiles_owner_idempotency;
drop index if exists public.idx_birth_profiles_guest_idempotency;
alter table public.birth_profiles drop column if exists idempotency_key;
