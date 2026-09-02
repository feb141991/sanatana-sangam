-- Native's Mandali compose flow needs the same durable-outbox precedent
-- already applied to mood check-in (20260902160000) and Sankalpa/reactions
-- (native repo): a retry of a POST that may have already committed
-- server-side (dropped connection, not an actual failure, or an app-kill
-- mid-flight resumed later) must not create a second post or comment.
-- There was no idempotency mechanism at all on either table before this
-- (plain insert, no unique constraint touching either column). NULL is
-- allowed and excluded from both unique indexes so existing rows and any
-- caller that doesn't send a key (web, until/unless it adopts the same
-- outbox) are unaffected.
alter table public.posts
  add column if not exists client_operation_id uuid;

create unique index if not exists posts_client_operation_id_key
  on public.posts (client_operation_id)
  where client_operation_id is not null;

alter table public.post_comments
  add column if not exists client_operation_id uuid;

create unique index if not exists post_comments_client_operation_id_key
  on public.post_comments (client_operation_id)
  where client_operation_id is not null;
