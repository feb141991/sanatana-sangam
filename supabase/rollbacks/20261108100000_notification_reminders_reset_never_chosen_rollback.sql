-- Rollback for 20261108100000_notification_reminders_reset_never_chosen.sql.
-- Restore only the columns this reset targeted, and only on an untouched row
-- version. A later UPDATE (even false -> false) makes that profile ineligible.
-- A rewrite that changes tuple versions also skips restoration safely.
-- Restoring old true values can re-enable reminders: requires separate approval.
begin;
set local lock_timeout = '5s';
lock table public.profiles in share row exclusive mode;

update public.profiles p
set
      dharm_veer_reminder_enabled = case when b.reason = 'never_finished_onboarding' and p.dharm_veer_reminder_enabled is not distinct from false and b.dharm_veer_reminder_enabled is distinct from false then b.dharm_veer_reminder_enabled else p.dharm_veer_reminder_enabled end,
      japa_reminder_enabled = case when b.reason = 'never_finished_onboarding' and p.japa_reminder_enabled is not distinct from false and b.japa_reminder_enabled is distinct from false then b.japa_reminder_enabled else p.japa_reminder_enabled end,
      nitya_reminder_enabled = case when b.reason = 'never_finished_onboarding' and p.nitya_reminder_enabled is not distinct from false and b.nitya_reminder_enabled is distinct from false then b.nitya_reminder_enabled else p.nitya_reminder_enabled end,
      quiz_reminder_enabled = case when b.reason = 'never_finished_onboarding' and p.quiz_reminder_enabled is not distinct from false and b.quiz_reminder_enabled is distinct from false then b.quiz_reminder_enabled else p.quiz_reminder_enabled end,
      wants_brahma_muhurta_reminders = case when p.wants_brahma_muhurta_reminders is not distinct from false and b.wants_brahma_muhurta_reminders is distinct from false then b.wants_brahma_muhurta_reminders else p.wants_brahma_muhurta_reminders end,
      wants_community_notifications = case when b.reason = 'never_finished_onboarding' and p.wants_community_notifications is not distinct from false and b.wants_community_notifications is distinct from false then b.wants_community_notifications else p.wants_community_notifications end,
      wants_evening_reminder = case when b.reason = 'never_finished_onboarding' and p.wants_evening_reminder is not distinct from false and b.wants_evening_reminder is distinct from false then b.wants_evening_reminder else p.wants_evening_reminder end,
      wants_family_notifications = case when b.reason = 'never_finished_onboarding' and p.wants_family_notifications is not distinct from false and b.wants_family_notifications is distinct from false then b.wants_family_notifications else p.wants_family_notifications end,
      wants_family_remembrance_reminders = case when b.reason = 'never_finished_onboarding' and p.wants_family_remembrance_reminders is not distinct from false and b.wants_family_remembrance_reminders is distinct from false then b.wants_family_remembrance_reminders else p.wants_family_remembrance_reminders end,
      wants_festival_reminders = case when b.reason = 'never_finished_onboarding' and p.wants_festival_reminders is not distinct from false and b.wants_festival_reminders is distinct from false then b.wants_festival_reminders else p.wants_festival_reminders end,
      wants_madhyahn_reminder = case when b.reason = 'never_finished_onboarding' and p.wants_madhyahn_reminder is not distinct from false and b.wants_madhyahn_reminder is distinct from false then b.wants_madhyahn_reminder else p.wants_madhyahn_reminder end,
      wants_mood_reminders = case when b.reason = 'never_finished_onboarding' and p.wants_mood_reminders is not distinct from false and b.wants_mood_reminders is distinct from false then b.wants_mood_reminders else p.wants_mood_reminders end,
      wants_nitya_reminders = case when b.reason = 'never_finished_onboarding' and p.wants_nitya_reminders is not distinct from false and b.wants_nitya_reminders is distinct from false then b.wants_nitya_reminders else p.wants_nitya_reminders end,
      wants_sankalpa_midpoint_reminders = case when b.reason = 'never_finished_onboarding' and p.wants_sankalpa_midpoint_reminders is not distinct from false and b.wants_sankalpa_midpoint_reminders is distinct from false then b.wants_sankalpa_midpoint_reminders else p.wants_sankalpa_midpoint_reminders end,
      wants_sattvic_reminders = case when b.reason = 'never_finished_onboarding' and p.wants_sattvic_reminders is not distinct from false and b.wants_sattvic_reminders is distinct from false then b.wants_sattvic_reminders else p.wants_sattvic_reminders end,
      wants_shloka_reminders = case when b.reason = 'never_finished_onboarding' and p.wants_shloka_reminders is not distinct from false and b.wants_shloka_reminders is distinct from false then b.wants_shloka_reminders else p.wants_shloka_reminders end,
      wants_tithi_reminders = case when b.reason = 'never_finished_onboarding' and p.wants_tithi_reminders is not distinct from false and b.wants_tithi_reminders is distinct from false then b.wants_tithi_reminders else p.wants_tithi_reminders end,
      wants_vrat_reminders = case when b.reason = 'never_finished_onboarding' and p.wants_vrat_reminders is not distinct from false and b.wants_vrat_reminders is distinct from false then b.wants_vrat_reminders else p.wants_vrat_reminders end
from public.notification_reset_backup_20261108 b
where b.user_id = p.id
  and p.xmin::text = b.post_reset_xmin;

drop table public.notification_reset_backup_20261108;

commit;
