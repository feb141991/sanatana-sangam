-- Rollback for 20261112110000_notification_brahma_opt_in_reset.sql.
-- Restores Brahma Muhurta to true only for a profile whose row is still exactly the version the reset wrote and still has it off.
-- Any later UPDATE of the profile (even false -> false) makes it ineligible, so a later choice is never overwritten.
-- Restoring true re-enables a reminder: requires separate approval.
begin;
set local lock_timeout = '5s';
lock table public.profiles in share row exclusive mode;

update public.profiles p
set wants_brahma_muhurta_reminders = true
from public.notification_brahma_reset_backup_20261112 b
where b.user_id = p.id
  and p.wants_brahma_muhurta_reminders is not distinct from false
  and b.wants_brahma_muhurta_reminders is true
  and p.xmin::text = b.post_reset_xmin;

drop table public.notification_brahma_reset_backup_20261112;

commit;
