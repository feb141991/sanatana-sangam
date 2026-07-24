-- Dharm Veer source-backed review flow
--
-- Backfills a migration file for schema changes that were applied directly
-- to production via the Supabase MCP on 2026-07-24 (two apply_migration
-- calls: dharm_veer_source_backed_review, dharm_veer_generation_log) while
-- building the auto-sourcing agent + review queue. Written after the fact so
-- the repo can reproduce the live schema from a clean database instead of
-- only working because production was patched out-of-band. Statements are
-- IF NOT EXISTS / idempotent-safe so this is a no-op against the current
-- production database.
--
-- See also: src/lib/dharm-veer-generation.ts, src/lib/dharm-veer-db.ts,
-- src/lib/dharm-veer-source-finder.ts, src/app/api/cron/generate-dharm-veer,
-- src/app/api/admin/dharm-veer-review, src/app/admin/dharm-veer-review.

-- ── dharm_veers: review/provenance columns ──────────────────────────────────
alter table public.dharm_veers
  add column if not exists source_backed boolean not null default false,
  add column if not exists review_status text not null default 'approved',
  add column if not exists source_citations jsonb not null default '[]'::jsonb,
  add column if not exists reviewed_by uuid references auth.users(id),
  add column if not exists reviewed_at timestamptz;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'dharm_veers_review_status_check'
      and conrelid = 'public.dharm_veers'::regclass
  ) then
    alter table public.dharm_veers
      add constraint dharm_veers_review_status_check
      check (review_status = any (array['approved', 'pending_review', 'rejected']));
  end if;
end $$;

comment on column public.dharm_veers.source_backed is
  'True when this hero''s content is grounded in a real fetched/verified source (RAG manifest or archive.org excerpt), as opposed to the old freeform/ungrounded generator.';
comment on column public.dharm_veers.review_status is
  'approved: visible to users. pending_review: auto-sourced by the cron, awaiting human approval in /admin/dharm-veer-review -- never shown publicly (see src/lib/dharm-veer-db.ts and the dharm_veers_public_read RLS policy). rejected: reviewer declined; also hidden.';
comment on column public.dharm_veers.source_citations is
  'Array of {sourceName, sourceUrl, rightsStatus, excerpt} the content was grounded in. Populated by citationsFromSources() in src/lib/dharm-veer-generation.ts.';
comment on column public.dharm_veers.reviewed_by is 'Admin user who approved/rejected a pending_review row, if known.';
comment on column public.dharm_veers.reviewed_at is 'When review_status was last changed from pending_review.';

create index if not exists dharm_veers_review_status_idx on public.dharm_veers (review_status);

-- Backfill: the 39 heroes already covered by the hand-verified RAG manifest
-- corpus (python/ai_pipeline/corpus/manifests/dharam_veer/) as of 2026-07-24
-- are marked source_backed regardless of when their row was first inserted.
update public.dharm_veers
set source_backed = true
where slug in (
  'ananda', 'arjuna', 'bhishma', 'bodhidharma', 'chanakya', 'chhatrapati-shivaji',
  'dhruv', 'emperor-ashoka', 'gautama-swami', 'guru-arjan-dev', 'guru-gobind-singh',
  'guru-nanak-dev', 'guru-tegh-bahadur', 'hanuman', 'harishchandra', 'kabir',
  'lord-mahavira', 'mahapajapati-gotami', 'maharana-pratap', 'milinda', 'moggallana',
  'parshvanatha', 'prahlad', 'ramakrishna', 'ramanujacharya', 'rani-lakshmibai',
  'rishabhanatha', 'sanghamitra', 'sariputta', 'savitri', 'shabari',
  'siddhartha-gautama', 'sri-krishna', 'sri-rama', 'swami-vivekananda', 'tukaram',
  'tulsidas', 'valmiki', 'xuanzang'
)
and source_backed = false;

-- ── Defense-in-depth: gate the public read policy on review_status ─────────
-- The app filters pending_review/rejected rows out at the query level
-- (src/lib/dharm-veer-db.ts), but that alone only protects callers that go
-- through those helper functions. Any other code path querying dharm_veers
-- directly under RLS should not be able to see unapproved rows either.
drop policy if exists dharm_veers_public_read on public.dharm_veers;

create policy dharm_veers_public_read
  on public.dharm_veers
  for select
  to public
  using (review_status = 'approved');

-- ── dharm_veer_generation_log ────────────────────────────────────────────────
create table if not exists public.dharm_veer_generation_log (
  slug text primary key,
  status text not null check (status in ('no_source_found', 'generated_pending_review', 'generated_approved')),
  attempted_at timestamptz not null default now(),
  notes text
);

comment on table public.dharm_veer_generation_log is
  'One row per Dharm Veer seed the generation cron has ever attempted. Lets the cron skip past seeds with no findable source instead of retrying them every day forever, without needing to insert a placeholder row into dharm_veers itself.';

alter table public.dharm_veer_generation_log enable row level security;
