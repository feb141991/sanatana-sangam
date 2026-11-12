-- Consent evidence ledger. NOT applied to any database by this commit.
-- Origin: the 2026-11-12 privacy audit found the four profile consents (religious data, activity personalization, product usage data,
-- notification taps) were plain yes/no flags with one shared, CLIENT-supplied timestamp: no record of when each was given or withdrawn,
-- which wording the person saw, or on which screen. This adds, in the database where no code path can skip it:
--   * public.consent_wording: the exact English wording of each consent on each screen, by version, with its SHA-256;
--   * public.consent_events: an append-only ledger, one row per change, hash-chained per person so a deleted or edited row is detectable;
--   * a trigger on profiles that writes that row for EVERY change of the four columns (API, onboarding, SQL, anything) and sets
--     consent_updated_at from the server clock;
--   * public.verify_consent_chain(user): recomputes the chain for audits;
--   * a backfill marking today's existing consents as "before_ledger" (no evidence of how they were obtained) instead of inventing it.
--
-- How the screen is recorded: a client may put {surface, wording_versions, platform, app_version} in the write-only column
-- profiles.consent_context_in in the SAME statement as the consent change. The trigger reads it, looks the version up in
-- consent_wording (so the checksum comes from the database, never from the client), and clears it, so it is always NULL at rest.
-- A change with no context, or an unknown version, is still recorded, with wording_status 'none' or 'unregistered'.
--
-- After applying: regenerate src/types/database.generated.ts and add 'consent_events' to USER_EXPORT_SOURCES
-- (src/lib/user-data-export.ts); its guard test fails until you do, which is the point.
--
-- ROC pre-flight (AGENTS.md section 4):
--  1. Function overload trap (PGRST203): all functions are new (record_profile_consent_changes, consent_events_chain,
--     consent_events_block_change, verify_consent_chain); none replaces an existing one. The two trigger functions are not callable by clients.
--  2. Caller contract: profiles gains one nullable column and two triggers. Existing writers are unaffected: an UPDATE that touches none of the
--     four consent columns and sends no context does not fire the trigger (WHEN clause). Installed apps that send no context get ledger
--     rows with surface 'unspecified'. select('*') on profiles now includes consent_context_in (always null).
--  3. User data and opt-out safety: no consent value is changed. The backfill only INSERTS ledger rows (about 16 today) for consents that are
--     already true, marked before_ledger. Pre-flight counts to re-read on the day: religious 14, activity 1, product analytics 1, taps 1.
--     consent_updated_at changes from now on only when a consent actually changes.
--  4. Locks: ADD COLUMN nullable with no default is metadata-only; lock_timeout 5s fails fast. The backfill touches ~32 profiles.
--  5. Row-level security: both new tables are FORCE RLS with no policy, so only a BYPASSRLS role can write them. The trigger functions are
--     SECURITY DEFINER owned by postgres, which has rolbypassrls = true in production (checked 2026-11-12, the same arrangement as
--     record_notification_tap). If that ever changed, every consent write would fail: it is asserted in the self-check below only on a scratch DB.
--  6. Rollback: supabase/rollbacks/20261112140000_consent_evidence_ledger_rollback.sql. It DROPS THE LEDGER (the evidence), so export it first.
--
-- Retention: ledger rows are deleted with the account (ON DELETE CASCADE), like email_consent_events. Whether proof of consent should instead
-- be kept, pseudonymised, for a limitation period after deletion is a counsel decision (docs/PRIVACY_IMPLEMENTATION_AUDIT_2026-11-12.md).

begin;
set local lock_timeout = '5s';

-- 1. The wording each consent was offered with, by version.
create table public.consent_wording (
  consent_key text not null check (consent_key in ('religious_data', 'activity_personalization', 'product_analytics', 'notification_taps')),
  surface text not null check (surface in ('onboarding', 'settings', 'inbox_card')),
  version text not null,
  language text not null default 'en',
  wording text not null check (length(wording) > 20),
  wording_sha256 text not null,
  published_at timestamptz not null default now(),
  primary key (consent_key, surface, version, language),
  constraint consent_wording_hash_matches check (wording_sha256 = encode(sha256(convert_to(wording, 'UTF8')), 'hex'))
);
alter table public.consent_wording enable row level security;
alter table public.consent_wording force row level security;
revoke all on public.consent_wording from public, anon, authenticated;
grant select on public.consent_wording to service_role;

insert into public.consent_wording (consent_key, surface, version, wording, wording_sha256)
select v.consent_key, v.surface, v.version, v.wording, encode(sha256(convert_to(v.wording, 'UTF8')), 'hex')
from (values
  ('religious_data', 'onboarding', '2026-11-12', $w$Your tradition is personal information
Your tradition, and the birth details you may add next (date of birth, nakshatra, rashi, gotra), are religious and personal information. With your permission, Shoonaya saves them to your account to tailor your calendar, reminders, practice and guidance.
I agree to Shoonaya saving and using these details
Off by default. Turn it on to continue with this tradition.
You can change this any time in Settings, under Privacy & Data, and delete your account and data there too. Prefer not to share? Choose Universal / Exploring and nothing about your tradition is saved to your account.$w$),
  ('religious_data', 'settings', '2026-11-12', $w$Uses your spiritual preference data to tailor recommendations. If product usage sharing is enabled, it also permits a broad practice-completed event for measurement.$w$),
  ('activity_personalization', 'settings', '2026-11-12', $w$Allow recent practice activity to reorder Mood and Sankalpa suggestions. Turn this off any time.$w$),
  ('product_analytics', 'settings', '2026-11-12', $w$Optional, account-linked daily events (such as app opened or practice completed) are kept for up to 90 days. Practice events require “Tradition-aware personalization” too. Admin reports show daily totals only for groups of 20 or more accounts. We never send screen names, spiritual content, mood, location, or profile details. Turn this off any time to stop collection and delete saved events.$w$),
  ('notification_taps', 'settings', '2026-11-12', $w$Optional. When on, we record when you tap a reminder we sent (which reminder, when, and your app version), linked to your account, for up to 90 days. This includes practice reminders such as japa, quiz and festivals, which can reflect your religious practice. We never record the text or what you read or wrote. Turning it off deletes these records.$w$),
  ('notification_taps', 'onboarding', '2026-11-12', $w$Optional. Lets us see which reminders you tap (which one, when, your app version) so we can send fewer that do not help. This includes practice reminders, which can reflect your religious practice. We never record what you read or wrote. Turn it off any time in Settings and these records are deleted.$w$),
  ('notification_taps', 'inbox_card', '2026-11-12', $w$If you say yes, we record which reminder you tap, when, and your app version, linked to your account, for up to 90 days, so we can send fewer reminders that do not help. This includes practice reminders, which can reflect your religious practice. We never record what you read or wrote. You can turn it off any time in Settings, and the records are deleted.$w$)
) as v(consent_key, surface, version, wording);

-- 2. The ledger.
create table public.consent_events (
  seq bigint generated always as identity primary key,
  id uuid not null default gen_random_uuid() unique,
  user_id uuid not null references auth.users(id) on delete cascade,
  consent_key text not null check (consent_key in ('religious_data', 'activity_personalization', 'product_analytics', 'notification_taps')),
  granted boolean not null,
  previous_value boolean,
  surface text not null check (surface in ('onboarding', 'settings', 'inbox_card', 'unspecified', 'before_ledger')),
  wording_version text,
  wording_sha256 text,
  wording_status text not null check (wording_status in ('registered', 'unregistered', 'none')),
  platform text,
  app_version text,
  evidence text not null check (evidence in ('recorded', 'before_ledger')),
  recorded_at timestamptz not null default now(),
  prev_hash text,
  row_hash text not null
);
create index consent_events_user_idx on public.consent_events (user_id, seq);
alter table public.consent_events enable row level security;
alter table public.consent_events force row level security;
revoke all on public.consent_events from public, anon, authenticated;
grant select on public.consent_events to service_role;

-- The hash covers every evidential field and the previous row's hash, so removing or editing a row breaks every later link.
create or replace function public.consent_event_hash(e public.consent_events)
returns text language sql stable as $$
  select encode(sha256(convert_to(concat_ws('|',
    coalesce(e.prev_hash, ''), e.user_id, e.consent_key, e.granted, coalesce(e.previous_value::text, ''), e.surface,
    coalesce(e.wording_version, ''), coalesce(e.wording_sha256, ''), e.wording_status, e.evidence,
    to_char(e.recorded_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US')
  ), 'UTF8')), 'hex')
$$;

create or replace function public.consent_events_chain()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  -- One writer per person at a time, so the chain cannot fork.
  perform pg_advisory_xact_lock(hashtextextended(new.user_id::text, 0));
  select c.row_hash into new.prev_hash from public.consent_events c where c.user_id = new.user_id order by c.seq desc limit 1;
  new.row_hash := public.consent_event_hash(new);
  return new;
end;
$$;
create trigger consent_events_chain before insert on public.consent_events
  for each row execute function public.consent_events_chain();

-- Append-only. A direct UPDATE or DELETE is refused; the cascade from deleting the account runs one trigger level deeper and is allowed.
create or replace function public.consent_events_block_change()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if tg_op = 'DELETE' and pg_trigger_depth() > 1 then
    return old;
  end if;
  raise exception 'consent_events is append-only' using errcode = '42501';
end;
$$;
create trigger consent_events_no_update before update on public.consent_events
  for each row execute function public.consent_events_block_change();
create trigger consent_events_no_delete before delete on public.consent_events
  for each row execute function public.consent_events_block_change();
create trigger consent_events_no_truncate before truncate on public.consent_events
  for each statement execute function public.consent_events_block_change();

-- 3. Every change of a consent column leaves a row, whatever path made it.
alter table public.profiles add column consent_context_in jsonb;
comment on column public.profiles.consent_context_in is
  'Write-only input for the consent ledger: {surface, wording_versions, platform, app_version}. Read and cleared by the trigger; always NULL at rest.';

create or replace function public.record_profile_consent_changes()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
declare
  ctx jsonb := new.consent_context_in;
  surf text;
  k text;
  newv boolean;
  oldv boolean;
  ver text;
  w public.consent_wording;
begin
  surf := coalesce(ctx ->> 'surface', 'unspecified');
  if surf not in ('onboarding', 'settings', 'inbox_card') then surf := 'unspecified'; end if;

  foreach k in array array['religious_data', 'activity_personalization', 'product_analytics', 'notification_taps'] loop
    newv := case k when 'religious_data' then new.consent_religious_data when 'activity_personalization' then new.consent_activity_personalization
                   when 'product_analytics' then new.consent_product_analytics else new.consent_notification_taps end;
    oldv := case when tg_op = 'INSERT' then null else
            case k when 'religious_data' then old.consent_religious_data when 'activity_personalization' then old.consent_activity_personalization
                   when 'product_analytics' then old.consent_product_analytics else old.consent_notification_taps end end;
    -- A new profile starts off. Only a consent that is on, or that changed, is a fact worth recording.
    if (tg_op = 'INSERT' and newv is true) or (tg_op = 'UPDATE' and newv is distinct from oldv) then
      ver := ctx -> 'wording_versions' ->> k;
      select * into w from public.consent_wording where consent_key = k and surface = surf and version = ver and language = 'en';
      insert into public.consent_events (user_id, consent_key, granted, previous_value, surface, wording_version, wording_sha256, wording_status, platform, app_version, evidence)
      values (new.id, k, newv, oldv, surf, left(ver, 40), w.wording_sha256,
              case when w.consent_key is not null then 'registered' when ver is not null then 'unregistered' else 'none' end,
              left(ctx ->> 'platform', 16), left(ctx ->> 'app_version', 32), 'recorded');
      new.consent_updated_at := now();
    end if;
  end loop;

  new.consent_context_in := null;
  return new;
end;
$$;
create trigger profiles_record_consent_changes_ins before insert on public.profiles
  for each row execute function public.record_profile_consent_changes();
create trigger profiles_record_consent_changes_upd before update on public.profiles
  for each row
  when (new.consent_context_in is not null
     or old.consent_religious_data is distinct from new.consent_religious_data
     or old.consent_activity_personalization is distinct from new.consent_activity_personalization
     or old.consent_product_analytics is distinct from new.consent_product_analytics
     or old.consent_notification_taps is distinct from new.consent_notification_taps)
  execute function public.record_profile_consent_changes();
revoke all on function public.record_profile_consent_changes() from public, anon, authenticated;
revoke all on function public.consent_events_chain() from public, anon, authenticated;
revoke all on function public.consent_events_block_change() from public, anon, authenticated;

-- 4. Audit: recompute one person's chain. True when every row's hash and link are intact.
create or replace function public.verify_consent_chain(p_user_id uuid)
returns boolean language plpgsql stable security definer set search_path = public, pg_temp as $$
declare
  r public.consent_events;
  expected_prev text := null;
begin
  for r in select * from public.consent_events where user_id = p_user_id order by seq loop
    if r.prev_hash is distinct from expected_prev or r.row_hash <> public.consent_event_hash(r) then
      return false;
    end if;
    expected_prev := r.row_hash;
  end loop;
  return true;
end;
$$;
revoke all on function public.verify_consent_chain(uuid) from public, anon, authenticated;
grant execute on function public.verify_consent_chain(uuid) to service_role;

-- 5. Consents that are already on were given before this ledger existed. Say so; do not invent evidence.
insert into public.consent_events (user_id, consent_key, granted, previous_value, surface, wording_status, evidence, recorded_at)
select p.id, c.k, true, null, 'before_ledger', 'none', 'before_ledger', coalesce(p.consent_updated_at, p.created_at, now())
from public.profiles p
cross join lateral (values
  ('religious_data', p.consent_religious_data), ('activity_personalization', p.consent_activity_personalization),
  ('product_analytics', p.consent_product_analytics), ('notification_taps', p.consent_notification_taps)
) as c(k, v)
where c.v is true
order by coalesce(p.consent_updated_at, p.created_at, now()), p.id;

do $verify$
begin
  assert (select count(*) from public.consent_wording) = 7, 'seven wordings registered';
  assert (select count(*) from pg_trigger where tgrelid = 'public.profiles'::regclass and tgname like 'profiles_record_consent_changes%') = 2, 'both profile triggers';
  assert not exists (select 1 from public.consent_events e where not public.verify_consent_chain(e.user_id)), 'every chain verifies after the backfill';
  assert (select count(*) from public.consent_events where evidence <> 'before_ledger') = 0, 'only backfill rows exist';
  assert not exists (select 1 from public.profiles where consent_context_in is not null), 'context column is empty at rest';
end
$verify$;

commit;
