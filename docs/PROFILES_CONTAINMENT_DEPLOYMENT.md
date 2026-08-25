# Profiles Containment Deployment Runbook

Status: code and shadow verification complete; both migrations are unapplied.
Production remains exposed until the reviewed sequence below is executed.

## Contract

- `public.profiles` is private and self-readable for authenticated users.
- Cross-user identity is limited to `id`, `username`, `avatar_url`, `bio`,
  leaderboard scores and `active_symbol_id`.
- Mandali and Kul readers use authenticated server routes. Precise coordinates,
  birth data, tradition, sampradaya, gotra and private profile state are never
  returned by directory or nearby-seeker APIs.
- Nearby discovery returns coarse distance bands, never another user's
  coordinates or exact distance.

## Reviewed Deployment Sequence

1. Apply `20260824162352_contain_profiles_exposure.sql`. This creates and
   backfills `public_profiles` without changing legacy `profiles` reads.
2. Deploy the PWA/backend and Native versions containing the server-owned
   Mandali, connection, search, nearby and Kul readers.
3. Smoke-test authenticated profile editing, Mandali feed/search/nearby,
   connection requests, Kul refresh, safety dashboard and scoreboards.
4. Apply `20260824162430_lock_down_profiles_reads.sql`.
5. Run the metadata checks below and an anonymous REST request selecting
   `profiles?id=not.is.null`. It must return a permission error, not rows.
6. Monitor 401/403/5xx rates on the migrated routes. Do not log response bodies.

Rollback order is stage 2 first, then stage 1. Rolling back stage 2 deliberately
reopens the documented exposure and is an emergency action requiring an
incident note.

## Aggregate-Only Production Verification

```sql
select relname, relrowsecurity, relforcerowsecurity
from pg_class
where oid in ('public.profiles'::regclass, 'public.public_profiles'::regclass);

select schemaname, tablename, policyname, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public' and tablename in ('profiles', 'public_profiles')
order by tablename, policyname;

select grantee, table_name, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in ('profiles', 'public_profiles')
order by table_name, grantee, privilege_type;
```

Expected result: anon has no grant on either relation; authenticated can select
the projection and can select/insert/update the base table subject to self-only
RLS; service role remains server-only.

## Historical Access Evidence

Preserve Supabase API, Postgres and hosting logs. Check aggregate request counts
for anonymous REST access to `/rest/v1/profiles`, broad selects, unusual column
selection and large response sizes over the available retention window. Do not
export tokens, IP addresses, coordinates or profile values into this repository.
Whether any observed access is a reportable incident is an external privacy-
counsel decision, not an engineering conclusion.
