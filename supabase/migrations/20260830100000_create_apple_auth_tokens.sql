-- Apple TN3194: authorization code / refresh token custody table.
-- Addresses: P0 (backend was absent), P2 (encryption, audit, deletion semantics).
--
-- Security model:
--   • Only service_role can read/write this table (anon + authenticated revoked).
--   • refresh_token is stored encrypted using pgp_sym_decrypt / pgp_sym_encrypt
--     with the Supabase secret app.apple_token_key (set via
--     `ALTER DATABASE postgres SET app.apple_token_key = '<key>';` or Vault).
--   • ON DELETE CASCADE on user_id is the safety net: if hardDeleteAccount
--     removes the auth.users row before revocation completes, the token row
--     is cleaned up automatically.
--   • Rows are deleted after successful revocation; the table should normally
--     be empty for fully-offboarded users.
--
-- Encryption note for future maintainers:
--   pgp_sym_encrypt(plaintext, key)  → bytea, cast to text for storage
--   pgp_sym_decrypt(ciphertext::bytea, key)  → plaintext
--   The key is read at runtime via current_setting('app.apple_token_key').
--   Rotate by re-encrypting all rows with the new key and updating the setting.

create extension if not exists pgcrypto;

create table if not exists public.apple_auth_tokens (
  id                  uuid        primary key default gen_random_uuid(),

  -- Stable Supabase user identity.
  user_id             uuid        not null
                                  references auth.users (id) on delete cascade,

  -- Apple stable user identifier (sub claim from id_token).
  -- Stored plain — not a secret, used for identity-binding validation.
  apple_sub           text        not null,

  -- Refresh token encrypted with pgcrypto symmetric encryption.
  -- Recover with: pgp_sym_decrypt(refresh_token_enc::bytea, <key>)
  refresh_token_enc   text        not null,

  -- Audit trail
  created_at          timestamptz not null default now(),
  used_at             timestamptz,        -- set when /auth/revoke is attempted
  revoked_at          timestamptz,        -- set when Apple returns 200 OK

  -- One active token per user (upsert on conflict).
  constraint apple_auth_tokens_user_id_key unique (user_id)
);

comment on table public.apple_auth_tokens is
  'Encrypted Apple OAuth refresh tokens for TN3194 account-deletion revocation. '
  'service_role only. Rows removed after successful revocation or account purge.';

comment on column public.apple_auth_tokens.refresh_token_enc is
  'pgcrypto pgp_sym_encrypt output. '
  'Decrypt: pgp_sym_decrypt(refresh_token_enc::bytea, current_setting(''app.apple_token_key''))';

-- ── Row-Level Security ───────────────────────────────────────────────────────
alter table public.apple_auth_tokens enable row level security;

revoke all on public.apple_auth_tokens from anon;
revoke all on public.apple_auth_tokens from authenticated;
revoke all on public.apple_auth_tokens from public;
grant  all on public.apple_auth_tokens to service_role;

-- No RLS policies: service_role bypasses RLS (Supabase default).
-- No other role should ever reach this table.
