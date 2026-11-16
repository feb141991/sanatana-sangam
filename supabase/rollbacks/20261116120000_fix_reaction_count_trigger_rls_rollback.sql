-- Rollback for 20261116120000_fix_reaction_count_trigger_rls.sql: reverts both trigger functions to SECURITY INVOKER
-- (the state they were in before, and the root cause of the bug that migration fixed). Does NOT revert the backfilled
-- upvotes/upvotes counts: they are now correct (equal to the actual reaction row count), and rewinding them would only
-- reintroduce the symptom, not restore anything worth keeping.
begin;
set local lock_timeout = '5s';
alter function public.sync_post_upvote_count() security invoker;
alter function public.sync_comment_upvote_count() security invoker;
commit;
