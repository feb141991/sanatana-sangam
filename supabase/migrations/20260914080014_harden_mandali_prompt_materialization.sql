-- Follow-up hardening for the already-live Mandali prompt pool.
--
-- The first release identified prompt posts only by author and UTC creation
-- date. That made duplicate prevention vulnerable to concurrent first reads
-- and left prompt-specific engagement impossible to query reliably. These
-- columns make the derived-post identity explicit and enforce one prompt per
-- Mandali per UTC day in Postgres.

alter table public.posts
  add column if not exists mandali_prompt_id uuid,
  add column if not exists mandali_prompt_date date;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'mandali_prompts_text_length_check'
      and conrelid = 'public.mandali_prompts'::regclass
  ) then
    alter table public.mandali_prompts
      add constraint mandali_prompts_text_length_check
      check (
        char_length(btrim(text_en)) between 1 and 500
        and (text_hi is null or char_length(btrim(text_hi)) between 1 and 500)
        and (text_pa is null or char_length(btrim(text_pa)) between 1 and 500)
      );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'posts_mandali_prompt_id_fkey'
      and conrelid = 'public.posts'::regclass
  ) then
    alter table public.posts
      add constraint posts_mandali_prompt_id_fkey
      foreign key (mandali_prompt_id)
      references public.mandali_prompts(id)
      on delete restrict;
  end if;
end
$$;

-- Preserve the prompt already materialized by the first release when its
-- canonical English text identifies one prompt unambiguously. If historical
-- duplicates ever exist, only the earliest row receives the daily identity;
-- the others remain ordinary historical posts so the unique constraint can
-- be installed without deleting community activity.
with candidates as (
  select
    post.id as post_id,
    prompt.id as prompt_id,
    (post.created_at at time zone 'UTC')::date as prompt_date,
    row_number() over (
      partition by post.mandali_id, (post.created_at at time zone 'UTC')::date
      order by post.created_at, post.id, prompt.id
    ) as daily_rank
  from public.posts as post
  join public.profiles as author
    on author.id = post.author_id
   and author.username = 'shoonaya'
  join public.mandali_prompts as prompt
    on prompt.text_en = post.content
  where post.mandali_id is not null
    and post.mandali_prompt_id is null
)
update public.posts as post
set
  mandali_prompt_id = candidates.prompt_id,
  mandali_prompt_date = candidates.prompt_date
from candidates
where post.id = candidates.post_id
  and candidates.daily_rank = 1;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'posts_mandali_prompt_identity_check'
      and conrelid = 'public.posts'::regclass
  ) then
    alter table public.posts
      add constraint posts_mandali_prompt_identity_check
      check (
        (mandali_prompt_id is null and mandali_prompt_date is null)
        or
        (mandali_prompt_id is not null and mandali_prompt_date is not null and mandali_id is not null)
      );
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'posts_one_mandali_prompt_per_day_key'
      and conrelid = 'public.posts'::regclass
  ) then
    alter table public.posts
      add constraint posts_one_mandali_prompt_per_day_key
      unique (mandali_id, mandali_prompt_date);
  end if;
end
$$;

create index if not exists posts_mandali_prompt_engagement_idx
  on public.posts (mandali_prompt_id, created_at desc)
  where mandali_prompt_id is not null;

comment on column public.posts.mandali_prompt_id is
  'Curated conversation-starter source. Enables prompt-level reply and reaction measurement.';

comment on column public.posts.mandali_prompt_date is
  'UTC calendar date assigned by the Mandali prompt rotation. Unique per Mandali.';

-- Only the service-role materializer may set or preserve prompt identity.
-- Without these predicates, an authenticated member could submit these new
-- columns directly, reserve today's unique key, and suppress the official
-- starter for their Mandali.
drop policy if exists "Authenticated users can post" on public.posts;
create policy "Authenticated users can post"
  on public.posts
  for insert
  to authenticated
  with check (
    (select auth.uid()) = author_id
    and mandali_prompt_id is null
    and mandali_prompt_date is null
    and exists (
      select 1
      from public.profiles as profile
      where profile.id = (select auth.uid())
        and profile.mandali_id = posts.mandali_id
    )
  );

drop policy if exists "Authors can update own posts" on public.posts;
create policy "Authors can update own posts"
  on public.posts
  for update
  to authenticated
  using ((select auth.uid()) = author_id)
  with check (
    (select auth.uid()) = author_id
    and mandali_prompt_id is null
    and mandali_prompt_date is null
    and exists (
      select 1
      from public.profiles as profile
      where profile.id = (select auth.uid())
        and profile.mandali_id = posts.mandali_id
    )
  );

-- The prompt table stays service-role only. New nullable post columns inherit
-- the existing posts grants and select/delete policies; the insert/update
-- policies above prevent client-authored prompt identities. Rollback: restore
-- the policies from 20260704203733_native_phase0_mandali_security.sql, then
-- drop the index, four constraints and two nullable columns. Existing post
-- content and engagement remain intact.
