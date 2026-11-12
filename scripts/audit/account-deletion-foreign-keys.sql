-- Run (read-only) before every release that adds a table, and after every migration that touches a foreign key to auth.users.
-- Origin: 2026-11-12 privacy audit. A foreign key to auth.users with no ON DELETE action (NO ACTION or RESTRICT) makes
-- auth.admin.deleteUser fail, so the account is never erased. Expected: section 1 returns no rows.

-- 1. Keys that BLOCK account deletion. Any row here is a defect.
select conrelid::regclass as table_name, a.attname as column_name, conname, confdeltype as on_delete
from pg_constraint c
join pg_attribute a on a.attrelid = c.conrelid and a.attnum = any (c.conkey)
where c.contype = 'f' and c.confrelid = 'auth.users'::regclass and c.confdeltype in ('a', 'r')
order by 1, 2;

-- 2. Keys that keep the row but clear the person (SET NULL / SET DEFAULT). Each is a decision: is what the row still holds
--    (message text, media, tokens) acceptable to keep once its author is gone? Review any new entry.
select conrelid::regclass as table_name, a.attname as column_name, conname, confdeltype as on_delete
from pg_constraint c
join pg_attribute a on a.attrelid = c.conrelid and a.attnum = any (c.conkey)
where c.contype = 'f' and c.confrelid = 'auth.users'::regclass and c.confdeltype in ('n', 'd')
order by 1, 2;

-- 3. Tables with a person-shaped column and NO key to auth.users at all: the id of an erased person would be left behind.
select t.table_name, c.column_name
from information_schema.columns c
join information_schema.tables t on t.table_schema = c.table_schema and t.table_name = c.table_name and t.table_type = 'BASE TABLE'
where c.table_schema = 'public'
  and c.column_name in ('user_id', 'owner_id', 'author_id', 'created_by', 'sender_id', 'requester_id', 'recipient_id', 'blocker_id')
  and not exists (
    select 1 from pg_constraint k
    join pg_attribute a on a.attrelid = k.conrelid and a.attnum = any (k.conkey)
    where k.contype = 'f' and k.conrelid = format('%I.%I', t.table_schema, t.table_name)::regclass
      and a.attname = c.column_name and k.confrelid in ('auth.users'::regclass, 'public.profiles'::regclass)
  )
order by 1, 2;
