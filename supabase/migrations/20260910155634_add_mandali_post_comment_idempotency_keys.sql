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