-- Mandali conversation-starter prompt pool. A curated, human-authored bank of
-- short prompts (e.g. "Who's observing Ekadashi this week?") that the feed
-- loader materializes as a real, pinned post once per Mandali per day --
-- see src/lib/mandali-data-server.ts. Deterministic selection by day-of-year,
-- mirroring buildDailySacredText's pool[dayIndex % pool.length] pattern
-- (src/lib/daily-sacred-text.ts) -- not AI-generated, so no job/queue table.
create table if not exists public.mandali_prompts (
  id           uuid        primary key default gen_random_uuid(),

  text_en      text        not null,
  -- Hindi/Punjabi renderings, optional -- a prompt missing a translation
  -- simply falls back to English for that language, same convention as
  -- ObservanceEntry's nameLocal/namePa fields.
  text_hi      text,
  text_pa      text,

  -- null = shown to every tradition's Mandalis. Set to scope a prompt to one
  -- tradition only (e.g. a Sikh-specific observance prompt).
  tradition    text,

  active       boolean     not null default true,

  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

comment on table public.mandali_prompts is
  'Curated pool of Mandali conversation-starter prompts, authored via '
  'admin/mandali-prompts. Read server-side only by mandali-data-server.ts; '
  'never queried directly by native or web clients.';

-- ── Row-Level Security ───────────────────────────────────────────────────────
alter table public.mandali_prompts enable row level security;

revoke all on public.mandali_prompts from anon;
revoke all on public.mandali_prompts from authenticated;
revoke all on public.mandali_prompts from public;
grant  all on public.mandali_prompts to service_role;

-- No RLS policies: service_role bypasses RLS (Supabase default). The admin
-- UI and the feed loader's materialize-on-read both use the service-role
-- client -- no other role should ever reach this table.
