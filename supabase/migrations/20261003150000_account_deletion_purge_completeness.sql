-- Make the 30-day account purge actually complete.
--
-- hardDeleteAccount (src/lib/account-deletion.ts) deletes the auth user and the
-- profile and relies on foreign keys to remove everything else. An audit of the
-- live schema found three ways that falls short:
--
--  1. Two delete-blocking foreign keys (NO ACTION). A reviewer or a Kul-pro
--     activator could never be purged: auth.admin.deleteUser fails and the
--     daily purge cron retries and fails forever.
--  2. Per-user tables with no foreign key at all, so their rows survive the
--     user: eight Pathshala tables and push_receipts_pending.
--  3. (Not changed here) pathshala_study_circles.created_by has no foreign key
--     either. It is NOT NULL and only the creator can update or delete the
--     circle, so cascading would delete other members' circle and SET NULL
--     would leave a circle nobody can administer. That is a product decision,
--     so it is deliberately left alone.
--
-- All of the tables below are empty today (push_receipts_pending has a few
-- pending rows, none orphaned), so adding the constraints validates instantly.
--
-- Rollback guidance: supabase/rollbacks/20261003150000_account_deletion_purge_completeness_rollback.sql
-- drops the new constraints and restores the two NO ACTION keys. Restoring
-- those re-creates the purge-blocking behaviour, so only do it if the SET NULL
-- semantics themselves turn out to be wrong.
--
-- Privilege review: constraints only. No table, policy, grant or function
-- changes, so RLS and privileges are unchanged.

begin;
set local lock_timeout = '5s';

-- 1. Audit references: keep the row, drop the pointer to the deleted user.
alter table public.dharm_veers
  drop constraint if exists dharm_veers_reviewed_by_fkey,
  add constraint dharm_veers_reviewed_by_fkey
    foreign key (reviewed_by) references auth.users (id) on delete set null;

alter table public.kuls
  drop constraint if exists kuls_pro_activated_by_fkey,
  add constraint kuls_pro_activated_by_fkey
    foreign key (pro_activated_by) references public.profiles (id) on delete set null;

-- 2. Personal rows: removed with the user, like the other 89 cascading keys.
alter table public.pathshala_circle_members
  add constraint pathshala_circle_members_user_id_fkey
    foreign key (user_id) references auth.users (id) on delete cascade;

alter table public.pathshala_enrollments
  add constraint pathshala_enrollments_user_id_fkey
    foreign key (user_id) references auth.users (id) on delete cascade;

alter table public.pathshala_progress
  add constraint pathshala_progress_user_id_fkey
    foreign key (user_id) references auth.users (id) on delete cascade;

alter table public.pathshala_recordings
  add constraint pathshala_recordings_user_id_fkey
    foreign key (user_id) references auth.users (id) on delete cascade;

alter table public.pathshala_user_badges
  add constraint pathshala_user_badges_user_id_fkey
    foreign key (user_id) references auth.users (id) on delete cascade;

alter table public.pathshala_verse_mastery
  add constraint pathshala_verse_mastery_user_id_fkey
    foreign key (user_id) references auth.users (id) on delete cascade;

-- reviewer_id is nullable, but a null reviewer would be indistinguishable from
-- a system-generated review, so a deleted human's reviews are removed instead.
alter table public.pathshala_recitation_reviews
  add constraint pathshala_recitation_reviews_reviewer_id_fkey
    foreign key (reviewer_id) references auth.users (id) on delete cascade;

create index if not exists push_receipts_pending_user_id_idx
  on public.push_receipts_pending (user_id);

alter table public.push_receipts_pending
  add constraint push_receipts_pending_user_id_fkey
    foreign key (user_id) references auth.users (id) on delete cascade;

commit;
