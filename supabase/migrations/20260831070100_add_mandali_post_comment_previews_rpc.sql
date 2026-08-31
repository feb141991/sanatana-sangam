-- Returns the most recent N top-level comments per post plus each post's
-- total top-level comment count, in one query. Needed because "top-N-per-
-- group" isn't expressible through a single PostgREST filter chain -- the
-- Mandali feed DTO needs comment previews + counts without loading every
-- comment for every post upfront (see the Home/Mandali performance review
-- this was built for).
create or replace function public.get_post_comment_previews(
  p_post_ids uuid[],
  p_preview_count int default 2
)
returns table (
  post_id uuid,
  id uuid,
  author_id uuid,
  body text,
  created_at timestamptz,
  deleted_at timestamptz,
  total_count bigint
)
language sql
stable
security invoker
as $$
  with counts as (
    select pc.post_id, count(*) as total_count
    from public.post_comments pc
    where pc.post_id = any(p_post_ids)
      and pc.parent_id is null
    group by pc.post_id
  ),
  ranked as (
    select pc.*,
      row_number() over (partition by pc.post_id order by pc.created_at desc) as rn
    from public.post_comments pc
    where pc.post_id = any(p_post_ids)
      and pc.parent_id is null
  )
  select r.post_id, r.id, r.author_id, r.body, r.created_at, r.deleted_at, c.total_count
  from ranked r
  join counts c on c.post_id = r.post_id
  where r.rn <= p_preview_count
  order by r.post_id, r.created_at desc;
$$;

revoke all on function public.get_post_comment_previews(uuid[], int) from public;
grant execute on function public.get_post_comment_previews(uuid[], int) to service_role;
