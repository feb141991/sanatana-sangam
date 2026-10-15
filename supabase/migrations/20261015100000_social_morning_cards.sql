-- Morning cards: one verse card per tradition per day, generated in one click and approved in the admin portal.
--
-- Separate from social_posts on purpose. That pipeline cannot reserve a post until a platform account is
-- connected and social_publishing_config exists, and its post_key allows one general post per day, so it cannot
-- carry four traditions. A card here is an image and a caption waiting for a person to approve them; nothing in
-- this table publishes anything.
--
-- Invariants enforced here, not only in application code:
--   * one row per (card_date, tradition): generating twice is a no-op, never a duplicate;
--   * an approved card is bound to the exact image bytes it was approved with, and any later change to the image
--     or the caption sends it back to draft (the approval cannot survive an edit);
--   * only a draft can be approved, and a card that could not be made is recorded as withheld with the reason.
-- Reads and writes are service-role only (RLS enabled, no policies), like the other social tables.

create table public.social_morning_cards (
  id uuid primary key default gen_random_uuid(),
  card_date date not null,
  tradition text not null check (tradition in ('hindu', 'sikh', 'buddhist', 'jain')),
  status text not null default 'draft' check (status in ('draft', 'approved', 'rejected', 'withheld')),

  withheld_reason text check (withheld_reason in ('corpus_not_usable', 'no_usable_verse', 'font_missing', 'render_failed')),
  withheld_detail text check (char_length(withheld_detail) <= 1000),

  source_ref text,
  citation text,
  -- The verse exactly as shown: original, translation, who the translation is by, attribution, script.
  source_snapshot jsonb not null default '{}'::jsonb check (jsonb_typeof(source_snapshot) = 'object'),

  -- Path inside the private social-post-drafts bucket; never a public URL.
  image_path text,
  image_content_hash text check (image_content_hash ~ '^[0-9a-f]{64}$'),

  caption text not null default '' check (char_length(caption) <= 5000),
  hashtags text[] not null default '{}' check (coalesce(array_length(hashtags, 1), 0) <= 30),

  generated_by text not null,
  approved_by text,
  approved_at timestamptz,
  approved_image_content_hash text,
  rejected_by text,
  rejected_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint social_morning_cards_one_per_day unique (card_date, tradition),
  constraint social_morning_cards_withheld_shape check (
    (status = 'withheld') = (withheld_reason is not null)
  ),
  constraint social_morning_cards_withheld_has_no_image check (
    status <> 'withheld' or (image_path is null and image_content_hash is null)
  ),
  constraint social_morning_cards_live_has_image check (
    status = 'withheld' or (image_path is not null and image_content_hash is not null and source_ref is not null)
  ),
  constraint social_morning_cards_approval_metadata check (
    status <> 'approved' or (
      approved_by is not null and approved_at is not null
      and approved_image_content_hash is not null and approved_image_content_hash = image_content_hash
    )
  ),
  constraint social_morning_cards_rejection_metadata check (
    status <> 'rejected' or (rejected_by is not null and rejected_at is not null)
  )
);

comment on table public.social_morning_cards is
  'One verse card per tradition per day: a rendered image plus a caption awaiting human approval. Nothing here publishes. See the migration header for the invariants.';
comment on column public.social_morning_cards.source_snapshot is
  'The verse exactly as shown on the card (original, translation, translation credit, attribution, script). Kept so a card can always be audited against what the corpus said when it was made.';
comment on column public.social_morning_cards.approved_image_content_hash is
  'SHA-256 of the image bytes the approver saw. A CHECK keeps it equal to image_content_hash while the card is approved; the trigger sends a card back to draft if the image or caption changes.';

create index social_morning_cards_date_idx on public.social_morning_cards (card_date desc);

create or replace function public.social_morning_cards_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' then
    -- Only a draft can be approved. (A rejected or withheld card is regenerated or edited back to draft first.)
    if new.status = 'approved' and old.status is distinct from 'approved' and old.status is distinct from 'draft' then
      raise exception 'only a draft morning card can be approved (was %)', old.status using errcode = '23514';
    end if;

    -- An approval cannot survive an edit to what was approved.
    if old.status = 'approved' and new.status = 'approved'
       and (new.caption is distinct from old.caption
            or new.hashtags is distinct from old.hashtags
            or new.image_path is distinct from old.image_path
            or new.image_content_hash is distinct from old.image_content_hash) then
      new.status := 'draft';
      new.approved_by := null;
      new.approved_at := null;
      new.approved_image_content_hash := null;
    end if;
  end if;

  new.updated_at := now();
  return new;
end;
$$;

create trigger social_morning_cards_guard
  before insert or update on public.social_morning_cards
  for each row execute function public.social_morning_cards_guard();

alter table public.social_morning_cards enable row level security;

revoke all on public.social_morning_cards from public, anon, authenticated;
grant all on public.social_morning_cards to service_role;
