-- Rollback for 20261003150000_account_deletion_purge_completeness.sql.
-- Restoring the two NO ACTION keys re-creates the behaviour where a reviewer or
-- Kul-pro activator cannot be purged. Only run this if SET NULL is wrong.

begin;
set local lock_timeout = '5s';

alter table public.push_receipts_pending drop constraint if exists push_receipts_pending_user_id_fkey;
drop index if exists public.push_receipts_pending_user_id_idx;

alter table public.pathshala_recitation_reviews drop constraint if exists pathshala_recitation_reviews_reviewer_id_fkey;
alter table public.pathshala_verse_mastery drop constraint if exists pathshala_verse_mastery_user_id_fkey;
alter table public.pathshala_user_badges drop constraint if exists pathshala_user_badges_user_id_fkey;
alter table public.pathshala_recordings drop constraint if exists pathshala_recordings_user_id_fkey;
alter table public.pathshala_progress drop constraint if exists pathshala_progress_user_id_fkey;
alter table public.pathshala_enrollments drop constraint if exists pathshala_enrollments_user_id_fkey;
alter table public.pathshala_circle_members drop constraint if exists pathshala_circle_members_user_id_fkey;

alter table public.kuls
  drop constraint if exists kuls_pro_activated_by_fkey,
  add constraint kuls_pro_activated_by_fkey
    foreign key (pro_activated_by) references public.profiles (id);

alter table public.dharm_veers
  drop constraint if exists dharm_veers_reviewed_by_fkey,
  add constraint dharm_veers_reviewed_by_fkey
    foreign key (reviewed_by) references auth.users (id);

commit;
