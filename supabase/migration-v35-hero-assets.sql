-- Hero artwork registry for dynamic Home hero selection.
-- Run this before using the Admin > Hero assets metadata workflow.

create table if not exists public.hero_assets (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  label text not null,
  hero_image text not null,
  hero_alt text not null,
  object_position text not null default 'center 24%',
  traditions text[] not null default '{}',
  sampradayas text[] not null default '{}',
  ishta_devatas text[] not null default '{}',
  festival_slugs text[] not null default '{}',
  tags text[] not null default '{}',
  priority integer not null default 0,
  is_active boolean not null default true,
  uploaded_by text
);

create index if not exists hero_assets_active_idx on public.hero_assets (is_active, priority desc);
create index if not exists hero_assets_traditions_idx on public.hero_assets using gin (traditions);
create index if not exists hero_assets_festival_slugs_idx on public.hero_assets using gin (festival_slugs);

create or replace function public.set_hero_assets_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_hero_assets_updated_at on public.hero_assets;
create trigger trg_hero_assets_updated_at
before update on public.hero_assets
for each row execute function public.set_hero_assets_updated_at();
