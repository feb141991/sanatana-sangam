-- ─── Migration v34: sattvic_sessions table ────────────────────────────────────
-- Stores meditation, breathwork, and chanting sessions from the Sattvic (Zen) Mode.
-- Run this in: Supabase Dashboard → SQL Editor

create table if not exists public.sattvic_sessions (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.profiles(id) on delete cascade,
  mode             text not null check (mode in ('breath', 'chant', 'reading', 'silent')),
  duration_secs    integer not null,
  environment      text not null, -- e.g., 'temple', 'forest', 'cosmos'
  mantra           text,          -- if mode was 'chant'
  completed_at     timestamptz not null default now(),
  created_at       timestamptz not null default now()
);

-- Indexes for querying history
create index if not exists sattvic_sessions_user_id_idx on public.sattvic_sessions(user_id);
create index if not exists sattvic_sessions_completed_at_idx on public.sattvic_sessions(completed_at);

-- RLS
alter table public.sattvic_sessions enable row level security;

create policy "Users can view their own sattvic sessions"
  on public.sattvic_sessions for select
  using (auth.uid() = user_id);

create policy "Users can insert their own sattvic sessions"
  on public.sattvic_sessions for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own sattvic sessions"
  on public.sattvic_sessions for update
  using (auth.uid() = user_id);

create policy "Users can delete their own sattvic sessions"
  on public.sattvic_sessions for delete
  using (auth.uid() = user_id);
