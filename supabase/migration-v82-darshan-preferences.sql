-- ─────────────────────────────────────────────────────────────────────────────
-- v82: darshan_preferences — user favourite mandirs + aarti notification prefs
-- Idempotent: safe to re-run against a DB where the table already exists.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists darshan_preferences (
  user_id         uuid        not null references profiles(id) on delete cascade,
  stream_id       text        not null,
  is_favourite    boolean     not null default true,
  notify_morning  boolean     not null default false,
  notify_evening  boolean     not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  primary key (user_id, stream_id)
);

-- RLS: users can only see and manage their own preferences
alter table darshan_preferences enable row level security;

-- Policy — skip if already exists
do $$ begin
  create policy "Users manage own darshan prefs"
    on darshan_preferences for all
    using  (auth.uid() = user_id)
    with check (auth.uid() = user_id);
exception when duplicate_object then
  null; -- policy already exists, nothing to do
end $$;

-- Indexes for cron job: quickly find all users opted into morning / evening calls
create index if not exists darshan_pref_morning_idx
  on darshan_preferences (stream_id) where notify_morning = true;

create index if not exists darshan_pref_evening_idx
  on darshan_preferences (stream_id) where notify_evening = true;

-- updated_at trigger function + trigger (both idempotent)
create or replace function update_darshan_preferences_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Drop-and-recreate trigger so re-runs are safe
drop trigger if exists darshan_preferences_updated_at on darshan_preferences;
create trigger darshan_preferences_updated_at
  before update on darshan_preferences
  for each row execute function update_darshan_preferences_updated_at();
