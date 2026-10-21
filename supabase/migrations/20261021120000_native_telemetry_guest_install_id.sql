-- Guest uploads to native_startup_telemetry_summaries have always had
-- user_id = null (by design -- a guest session has no account identity to
-- attach), which meant fleet analysis could never tell "the same guest
-- install uploaded N summaries" from "N different guest installs uploaded
-- one each" -- unlike authenticated rows, which already get that for free
-- from user_id. Found 2026-10-21 auditing a cold-start stall rate: the
-- authenticated half of the analysis could at least deduplicate by user_id;
-- the guest half genuinely could not be deduplicated at all. See AGENTS.md
-- rule 14 (native repo) for the full origin of that audit.
--
-- guest_install_id is a random, locally-generated id (shoonaya-mobile
-- lib/telemetryUpload.ts's getOrCreateGuestInstallId) -- never an account
-- id, never derived from any device/hardware signal, reset to a new random
-- value if the app's storage is ever cleared. It is the guest-row
-- counterpart to user_id, nothing more: still no free text, still no
-- content, still nothing that identifies what the user was looking at.
alter table public.native_startup_telemetry_summaries
  add column if not exists guest_install_id text;

alter table public.native_startup_telemetry_summaries
  drop constraint if exists native_startup_telemetry_guest_install_id_format;
alter table public.native_startup_telemetry_summaries
  add constraint native_startup_telemetry_guest_install_id_format
  check (guest_install_id is null or guest_install_id ~ '^[0-9a-fA-F-]{1,64}$');

comment on column public.native_startup_telemetry_summaries.guest_install_id is
  'Random, locally-generated anonymous id sent only by guest uploads, so fleet analysis can deduplicate repeat uploads from the same install -- the guest-row counterpart to user_id. Never an account id.';

create index if not exists native_startup_telemetry_guest_install_id_idx
  on public.native_startup_telemetry_summaries (guest_install_id, received_at desc)
  where guest_install_id is not null;
