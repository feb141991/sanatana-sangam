-- Email consent ledger (plan: docs/EMAIL_CONSENT_PLAN.md). NOT applied to any database by this commit.
--
-- Why: marketing e-mail consent was three bare booleans on profiles (marketing_consent, email_newsletter, email_festivals) and one shared
-- timestamp that only an opt-in ever wrote. Nothing recorded WHEN a person agreed or withdrew, through WHICH path, in WHICH region or under WHICH
-- wording, and e-mail for festivals defaulted to ON for every account although nobody was ever asked.
--
-- What this adds:
--   email_consent_events         Append-only history, one row per consent column that changed (category marketing / newsletter / festivals):
--                                who, when, granted or withdrawn, the path (source), the wording version shown and the region that applied
--                                and where that region came from (a country code only; never an IP address). Rows die with the account.
--   log_email_consent_change()   AFTER INSERT / AFTER UPDATE trigger on profiles: EVERY path that changes one of the three columns leaves a row,
--                                including a direct client write from an app build that predates this migration (source client_direct).
--   set_email_consent(...)       The server's way to change consent with context: sets the transaction-local context the trigger reads, then
--                                updates the columns. Service role only; the caller's identity is passed by a trusted server route.
--   email_festivals              Default OFF. Every existing row is set OFF (see pre-flight 3).
--
-- ROC pre-flight (AGENTS.md section 4):
--  1. Function overload trap (PGRST203): three NEW function names (set_email_consent, log_email_consent_change, email_consent_events_immutable).
--     No existing function is replaced, renamed or given a new signature, so no overload can appear.
--  2. Caller contract: no existing caller changes. Installed app builds keep writing marketing_consent / email_newsletter straight to profiles
--     (onboarding); that still works and is now recorded as client_direct. The only behavioural change for an existing caller is the column
--     default of email_festivals (true -> false) for rows INSERTED without that column. The only code that ever wrote email_festivals was
--     /api/unsubscribe (sets false); no screen or route ever set it true (searched src/ and the Native app on 2026-11-06).
--  3. User data and opt-out safety: counts read from production on 2026-11-06 (re-check on the day this is applied):
--       email_festivals  true / false / null = 30 / 0 / 0     marketing_consent  true / false / null = 1 / 29 / 0
--     The UPDATE below changes true -> false only, so it cannot overwrite an opt-out, and every one of the 30 true values is the column default
--     (nobody was asked; no festival e-mail has ever been sent: email_outbox holds no marketing rows). It runs BEFORE the triggers exist, so it
--     writes no ledger rows: nobody "withdrew" something they never granted. The one existing newsletter opt-in is back-filled as source
--     'backfill' with its own consent_updated_at and no wording/region (not known; not invented).
--  4. Locks: ALTER COLUMN SET DEFAULT is metadata only (brief ACCESS EXCLUSIVE); CREATE TRIGGER x2 takes SHARE ROW EXCLUSIVE on profiles (30 rows;
--     the every-10-minute crons write notification tables, not profiles); the UPDATE touches 30 rows; lock_timeout is 5s so it fails fast rather
--     than queueing behind a long writer.
--  5. Rollback: supabase/rollbacks/20261106090000_email_consent_ledger_rollback.sql (drops everything above, restores the old default true; it
--     deliberately does NOT turn festival e-mail back ON for anyone, because nobody ever chose it).
--
-- RLS / privileges: the table has RLS enabled and forced with NO policy, and no grant to anon or authenticated: only the service role (and the
-- SECURITY DEFINER trigger) can read or write it. set_email_consent is executable by service_role only.

begin;
set local lock_timeout = '5s';

create table public.email_consent_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null check (category in ('marketing', 'newsletter', 'festivals')),
  action text not null check (action in ('granted', 'withdrawn')),
  source text not null check (source in ('client_direct', 'onboarding', 'settings', 'unsubscribe_link', 'one_click', 'admin', 'backfill', 'system')),
  wording_version text check (wording_version is null or wording_version ~ '^[a-z0-9][a-z0-9._-]{0,63}$'),
  region text check (region is null or region ~ '^[A-Z]{2}$'),
  region_source text check (region_source is null or region_source in ('ip_header', 'device_region', 'profile_country', 'timezone')),
  created_at timestamptz not null default now(),
  constraint email_consent_events_region_source_needs_region check (region_source is null or region is not null)
);

create index email_consent_events_user_idx on public.email_consent_events (user_id, created_at desc, id desc);

alter table public.email_consent_events enable row level security;
alter table public.email_consent_events force row level security;
revoke all on table public.email_consent_events from public, anon, authenticated;

-- History is never edited. (A delete is allowed: it is how the rows leave with the account.)
create function public.email_consent_events_immutable() returns trigger
language plpgsql set search_path = ''
as $$
begin
  raise exception 'email_consent_events rows are append-only';
end;
$$;

create trigger email_consent_events_no_update before update on public.email_consent_events
  for each row execute function public.email_consent_events_immutable();

-- Back-fill what is knowable, BEFORE the profile triggers exist so nothing is logged twice.
insert into public.email_consent_events (user_id, category, action, source, created_at)
select p.id, 'marketing', 'granted', 'backfill', coalesce(p.consent_updated_at, now())
from public.profiles p where p.marketing_consent is true;

insert into public.email_consent_events (user_id, category, action, source, created_at)
select p.id, 'newsletter', 'granted', 'backfill', coalesce(p.consent_updated_at, now())
from public.profiles p where p.email_newsletter is true;

-- Festival e-mail is something a person opts into. Nobody was asked, so the default (and every existing default value) goes to OFF.
alter table public.profiles alter column email_festivals set default false;
update public.profiles set email_festivals = false where email_festivals is true;

-- The two data steps above are not visible to the SQL test (it runs afterwards), so the migration checks its own post-conditions and aborts
-- (rolling everything back) if either did not hold.
do $check$
begin
  if exists (select 1 from public.profiles where email_festivals is true) then
    raise exception 'email_consent_ledger: festival e-mail reset did not apply';
  end if;
  if (select count(*) from public.email_consent_events where source = 'backfill' and category = 'marketing')
       <> (select count(*) from public.profiles where marketing_consent is true)
     or (select count(*) from public.email_consent_events where source = 'backfill' and category = 'newsletter')
       <> (select count(*) from public.profiles where email_newsletter is true) then
    raise exception 'email_consent_ledger: back-fill does not match the current consent flags';
  end if;
end
$check$;

create function public.log_email_consent_change() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  v_source text := nullif(current_setting('app.email_consent_source', true), '');
  v_wording text := nullif(current_setting('app.email_consent_wording', true), '');
  v_region text := nullif(current_setting('app.email_consent_region', true), '');
  v_region_source text := nullif(current_setting('app.email_consent_region_source', true), '');
  v_old_marketing boolean := false;
  v_old_newsletter boolean := false;
  v_old_festivals boolean := false;
begin
  -- Context comes only from set_email_consent. Anything else (a direct client write, an admin SQL edit) is recorded without it.
  if v_source is null or v_source not in ('onboarding', 'settings', 'unsubscribe_link', 'one_click', 'admin', 'system') then
    v_source := 'client_direct';
    v_wording := null;
    v_region := null;
    v_region_source := null;
  end if;
  if v_wording is not null and v_wording !~ '^[a-z0-9][a-z0-9._-]{0,63}$' then v_wording := null; end if;
  if v_region is not null and v_region !~ '^[A-Z]{2}$' then v_region := null; end if;
  if v_region_source is not null and v_region_source not in ('ip_header', 'device_region', 'profile_country', 'timezone') then v_region_source := null; end if;
  if v_region is null then v_region_source := null; end if;

  if tg_op = 'UPDATE' then
    v_old_marketing := coalesce(old.marketing_consent, false);
    v_old_newsletter := coalesce(old.email_newsletter, false);
    v_old_festivals := coalesce(old.email_festivals, false);
  end if;

  if coalesce(new.marketing_consent, false) is distinct from v_old_marketing then
    insert into public.email_consent_events (user_id, category, action, source, wording_version, region, region_source)
    values (new.id, 'marketing', case when coalesce(new.marketing_consent, false) then 'granted' else 'withdrawn' end, v_source, v_wording, v_region, v_region_source);
  end if;
  if coalesce(new.email_newsletter, false) is distinct from v_old_newsletter then
    insert into public.email_consent_events (user_id, category, action, source, wording_version, region, region_source)
    values (new.id, 'newsletter', case when coalesce(new.email_newsletter, false) then 'granted' else 'withdrawn' end, v_source, v_wording, v_region, v_region_source);
  end if;
  if coalesce(new.email_festivals, false) is distinct from v_old_festivals then
    insert into public.email_consent_events (user_id, category, action, source, wording_version, region, region_source)
    values (new.id, 'festivals', case when coalesce(new.email_festivals, false) then 'granted' else 'withdrawn' end, v_source, v_wording, v_region, v_region_source);
  end if;
  return null;
end;
$$;

create trigger profiles_log_email_consent_insert after insert on public.profiles
  for each row
  when (new.marketing_consent is true or new.email_newsletter is true or new.email_festivals is true)
  execute function public.log_email_consent_change();

create trigger profiles_log_email_consent_update after update of marketing_consent, email_newsletter, email_festivals on public.profiles
  for each row
  when (old.marketing_consent is distinct from new.marketing_consent
     or old.email_newsletter is distinct from new.email_newsletter
     or old.email_festivals is distinct from new.email_festivals)
  execute function public.log_email_consent_change();

-- The server's single entry point for changing e-mail consent. p_category: 'newsletter' (grant sets marketing_consent and email_newsletter, the two
-- flags the campaign audience reads; withdraw sets email_newsletter only), 'festivals', or 'all' (withdraw only: all three flags off).
-- Idempotent: asking for the state the person is already in changes nothing, writes no ledger row and does not move consent_updated_at.
create function public.set_email_consent(
  p_user_id uuid,
  p_category text,
  p_granted boolean,
  p_source text,
  p_wording_version text default null,
  p_region text default null,
  p_region_source text default null
) returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  v_profile record;
  v_marketing boolean;
  v_newsletter boolean;
  v_festivals boolean;
  v_t_marketing boolean;
  v_t_newsletter boolean;
  v_t_festivals boolean;
begin
  if p_user_id is null or p_granted is null then
    raise exception 'email_consent_invalid_input' using errcode = '22023';
  end if;
  if p_category is null or p_category not in ('newsletter', 'festivals', 'all') then
    raise exception 'email_consent_invalid_category' using errcode = '22023';
  end if;
  if p_category = 'all' and p_granted then
    raise exception 'email_consent_all_is_withdraw_only' using errcode = '22023';
  end if;
  if p_source is null or p_source not in ('onboarding', 'settings', 'unsubscribe_link', 'one_click', 'admin', 'system') then
    raise exception 'email_consent_invalid_source' using errcode = '22023';
  end if;
  if p_wording_version is not null and p_wording_version !~ '^[a-z0-9][a-z0-9._-]{0,63}$' then
    raise exception 'email_consent_invalid_wording' using errcode = '22023';
  end if;
  if p_region is not null and p_region !~ '^[A-Z]{2}$' then
    raise exception 'email_consent_invalid_region' using errcode = '22023';
  end if;

  select p.marketing_consent, p.email_newsletter, p.email_festivals, p.is_deleting
  into v_profile
  from public.profiles p where p.id = p_user_id for update;
  if not found then
    raise exception 'email_consent_profile_not_found' using errcode = 'P0002';
  end if;
  -- Withdrawing is always allowed; agreeing is not, while the account is being deleted.
  if p_granted and coalesce(v_profile.is_deleting, false) then
    raise exception 'email_consent_account_deleting' using errcode = '55000';
  end if;

  v_marketing := coalesce(v_profile.marketing_consent, false);
  v_newsletter := coalesce(v_profile.email_newsletter, false);
  v_festivals := coalesce(v_profile.email_festivals, false);
  v_t_marketing := v_marketing;
  v_t_newsletter := v_newsletter;
  v_t_festivals := v_festivals;

  if p_category = 'newsletter' then
    if p_granted then
      v_t_marketing := true;
      v_t_newsletter := true;
    else
      v_t_newsletter := false;
    end if;
  elsif p_category = 'festivals' then
    v_t_festivals := p_granted;
  else
    v_t_marketing := false;
    v_t_newsletter := false;
    v_t_festivals := false;
  end if;

  if v_t_marketing = v_marketing and v_t_newsletter = v_newsletter and v_t_festivals = v_festivals then
    return jsonb_build_object('changed', false, 'marketing', v_marketing, 'newsletter', v_newsletter, 'festivals', v_festivals);
  end if;

  perform set_config('app.email_consent_source', p_source, true);
  perform set_config('app.email_consent_wording', coalesce(p_wording_version, ''), true);
  perform set_config('app.email_consent_region', coalesce(p_region, ''), true);
  perform set_config('app.email_consent_region_source', coalesce(p_region_source, ''), true);

  update public.profiles
  set marketing_consent = v_t_marketing,
      email_newsletter = v_t_newsletter,
      email_festivals = v_t_festivals,
      consent_updated_at = now()
  where id = p_user_id;

  -- The context belongs to this one change; clear it so a later write in the same transaction is not mislabelled.
  perform set_config('app.email_consent_source', '', true);
  perform set_config('app.email_consent_wording', '', true);
  perform set_config('app.email_consent_region', '', true);
  perform set_config('app.email_consent_region_source', '', true);

  return jsonb_build_object('changed', true, 'marketing', v_t_marketing, 'newsletter', v_t_newsletter, 'festivals', v_t_festivals);
end;
$$;

revoke all on function public.set_email_consent(uuid, text, boolean, text, text, text, text) from public, anon, authenticated;
grant execute on function public.set_email_consent(uuid, text, boolean, text, text, text, text) to service_role;
revoke all on function public.log_email_consent_change() from public, anon, authenticated;
revoke all on function public.email_consent_events_immutable() from public, anon, authenticated;

commit;
