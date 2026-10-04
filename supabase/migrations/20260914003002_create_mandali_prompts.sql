create table if not exists public.mandali_prompts (
  id           uuid        primary key default gen_random_uuid(),
  text_en      text        not null,
  text_hi      text,
  text_pa      text,
  tradition    text,
  active       boolean     not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

comment on table public.mandali_prompts is
  'Curated pool of Mandali conversation-starter prompts, authored via '
  'admin/mandali-prompts. Read server-side only by mandali-data-server.ts; '
  'never queried directly by native or web clients.';

alter table public.mandali_prompts enable row level security;

revoke all on public.mandali_prompts from anon;
revoke all on public.mandali_prompts from authenticated;
revoke all on public.mandali_prompts from public;
grant  all on public.mandali_prompts to service_role;