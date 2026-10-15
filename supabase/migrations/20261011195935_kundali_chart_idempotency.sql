-- Native retries use a stable request key so an ambiguous response cannot
-- create a second saved Kundali chart. Separate indexes scope authenticated
-- charts to account and guest charts to their temporary session.
alter table public.birth_profiles
  add column if not exists idempotency_key uuid;

create unique index if not exists idx_birth_profiles_owner_idempotency
  on public.birth_profiles (owner_id, idempotency_key)
  where owner_id is not null and idempotency_key is not null;

create unique index if not exists idx_birth_profiles_guest_idempotency
  on public.birth_profiles (session_token, idempotency_key)
  where owner_id is null and session_token is not null and idempotency_key is not null;

comment on column public.birth_profiles.idempotency_key is
  'Optional request key used to make Native chart submissions safe to retry within the same account or guest session.';
