-- Native's mood check-in outbox needs to retry a POST that may have
-- already committed server-side (e.g. the response was lost to a dropped
-- connection, not an actual failure). Without a dedup key, that retry
-- creates a genuine duplicate user_mood_checkins row -- there was no
-- idempotency mechanism at all before this (plain insert, no unique
-- constraint touching this table). NULL is allowed and excluded from the
-- unique index so existing rows and any caller that doesn't send a key
-- (e.g. web, until/unless it adopts the same outbox) are unaffected.
alter table public.user_mood_checkins
  add column if not exists client_operation_id uuid;

create unique index if not exists user_mood_checkins_client_operation_id_key
  on public.user_mood_checkins (client_operation_id)
  where client_operation_id is not null;
