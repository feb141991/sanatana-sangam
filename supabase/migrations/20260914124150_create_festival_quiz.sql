-- Festival Quiz Seasons: a curated, multi-day quiz journey tied to a
-- multi-day festival series (see src/lib/calendar/observance-series.ts /
-- packages/dharma-rules/src/festivals/series.json). Deliberately modeled on
-- the Monthly Dharma Challenge (monthly_challenges/challenge_packs/
-- challenge_questions/user_challenge_progress), not the AI-generated
-- daily_quiz -- this content is human-curated and reviewed, never
-- AI-authored straight to production.
--
-- `definition_key` is the stable key from series.json's `definitionKey`
-- (e.g. 'sharad-navratri') -- there is no DB row for the series itself by
-- design (see observance-series.ts's own "no parent persistence is needed"
-- comment); these tables key off that same string rather than inventing a
-- new id.

create table if not exists public.festival_quiz_seasons (
  id            uuid        primary key default gen_random_uuid(),
  definition_key text       not null unique,
  title         text        not null,
  -- pathshala_badges.slug to award via award_badge_if_earned() once every
  -- day of the season is answered for a given year.
  badge_slug    text        not null,
  active        boolean     not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table public.festival_quiz_seasons is
  'One row per festival series enabled for a quiz season, keyed by the '
  'stable definitionKey from packages/dharma-rules/src/festivals/series.json. '
  'Authored via admin/festival-quiz.';

create table if not exists public.festival_quiz_questions (
  id             uuid        primary key default gen_random_uuid(),
  definition_key text        not null,
  -- Matches the series child's `sequence` in series.json (1..totalDays).
  day_sequence   smallint    not null,

  question_en    text        not null,
  question_hi    text,
  question_pa    text,
  options_en     text[]      not null,
  options_hi     text[],
  options_pa     text[],
  correct_option_idx smallint not null check (correct_option_idx between 0 and 3),
  explanation_en text,
  explanation_hi text,
  explanation_pa text,
  source         text,

  active         boolean     not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),

  constraint festival_quiz_questions_options_en_len check (array_length(options_en, 1) = 4),
  unique (definition_key, day_sequence)
);

comment on table public.festival_quiz_questions is
  'Curated per-day question for a festival quiz season. text/options '
  'missing a hi/pa translation fall back to English for that viewer, same '
  'convention as mandali_prompts and ObservanceEntry.';

create table if not exists public.user_festival_quiz_progress (
  id                 uuid        primary key default gen_random_uuid(),
  user_id            uuid        not null references public.profiles(id) on delete cascade,
  definition_key     text        not null,
  -- Civil year the series ran in -- a fresh journey every year, matching
  -- ObservanceSeries' own per-year scoping (buildObservanceSeriesKey groups
  -- by civil year).
  year               integer     not null,
  day_sequence       smallint    not null,
  chosen_option_idx  smallint    not null check (chosen_option_idx between 0 and 3),
  is_correct         boolean     not null,
  answered_at        timestamptz not null default now(),

  -- No ordering constraint on day_sequence relative to other rows for this
  -- user -- days can be answered out of order (catch-up), the API route
  -- only enforces that the day has actually arrived (child.civilDate <=
  -- today) before accepting an answer.
  unique (user_id, definition_key, year, day_sequence)
);

comment on table public.user_festival_quiz_progress is
  'One row per user answer to a festival quiz day. Completion (all days '
  'answered for a definition_key+year) triggers award_badge_if_earned '
  '(see /api/native/festival-quiz/answer).';

-- ── Row-Level Security ───────────────────────────────────────────────────────
alter table public.festival_quiz_seasons        enable row level security;
alter table public.festival_quiz_questions       enable row level security;
alter table public.user_festival_quiz_progress   enable row level security;

revoke all on public.festival_quiz_seasons        from anon, authenticated, public;
revoke all on public.festival_quiz_questions       from anon, authenticated, public;
revoke all on public.user_festival_quiz_progress   from anon, authenticated, public;

grant all on public.festival_quiz_seasons        to service_role;
grant all on public.festival_quiz_questions       to service_role;
grant all on public.user_festival_quiz_progress   to service_role;

-- No RLS policies: service_role bypasses RLS (Supabase default). All three
-- tables are read/written exclusively through the native API routes
-- (getApiUser + admin client), matching every other native-only table
-- added this cycle (mandali_prompts) -- no direct client access needed.
