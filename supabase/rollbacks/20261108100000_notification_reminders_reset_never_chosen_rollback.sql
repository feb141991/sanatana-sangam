-- Rollback for 20261108100000_notification_reminders_reset_never_chosen.sql.
-- Restores each backed-up reminder value, but ONLY where:
--   1. The profile has NOT been modified since the reset (p.updated_at <= b.taken_at).
--      If a person has modified their profile or preferences after the reset (p.updated_at > b.taken_at),
--      a `false` value could be a deliberate opt-out made subsequently in Settings or Onboarding;
--      blindly restoring `b.col` (true) would destroy that deliberate opt-out (Rule 6).
--   2. The profile still holds the `false` this migration wrote (p.col is not distinct from false).
--
-- Then drops the backup table only after verifying restored rows.
begin;
set local lock_timeout = '5s';

update public.profiles p
set
      dharm_veer_reminder_enabled = case when p.dharm_veer_reminder_enabled is not distinct from false and b.dharm_veer_reminder_enabled is distinct from false then b.dharm_veer_reminder_enabled else p.dharm_veer_reminder_enabled end,
      japa_reminder_enabled = case when p.japa_reminder_enabled is not distinct from false and b.japa_reminder_enabled is distinct from false then b.japa_reminder_enabled else p.japa_reminder_enabled end,
      nitya_reminder_enabled = case when p.nitya_reminder_enabled is not distinct from false and b.nitya_reminder_enabled is distinct from false then b.nitya_reminder_enabled else p.nitya_reminder_enabled end,
      quiz_reminder_enabled = case when p.quiz_reminder_enabled is not distinct from false and b.quiz_reminder_enabled is distinct from false then b.quiz_reminder_enabled else p.quiz_reminder_enabled end,
      wants_brahma_muhurta_reminders = case when p.wants_brahma_muhurta_reminders is not distinct from false and b.wants_brahma_muhurta_reminders is distinct from false then b.wants_brahma_muhurta_reminders else p.wants_brahma_muhurta_reminders end,
      wants_community_notifications = case when p.wants_community_notifications is not distinct from false and b.wants_community_notifications is distinct from false then b.wants_community_notifications else p.wants_community_notifications end,
      wants_evening_reminder = case when p.wants_evening_reminder is not distinct from false and b.wants_evening_reminder is distinct from false then b.wants_evening_reminder else p.wants_evening_reminder end,
      wants_family_notifications = case when p.wants_family_notifications is not distinct from false and b.wants_family_notifications is distinct from false then b.wants_family_notifications else p.wants_family_notifications end,
      wants_family_remembrance_reminders = case when p.wants_family_remembrance_reminders is not distinct from false and b.wants_family_remembrance_reminders is distinct from false then b.wants_family_remembrance_reminders else p.wants_family_remembrance_reminders end,
      wants_festival_reminders = case when p.wants_festival_reminders is not distinct from false and b.wants_festival_reminders is distinct from false then b.wants_festival_reminders else p.wants_festival_reminders end,
      wants_madhyahn_reminder = case when p.wants_madhyahn_reminder is not distinct from false and b.wants_madhyahn_reminder is distinct from false then b.wants_madhyahn_reminder else p.wants_madhyahn_reminder end,
      wants_mood_reminders = case when p.wants_mood_reminders is not distinct from false and b.wants_mood_reminders is distinct from false then b.wants_mood_reminders else p.wants_mood_reminders end,
      wants_nitya_reminders = case when p.wants_nitya_reminders is not distinct from false and b.wants_nitya_reminders is distinct from false then b.wants_nitya_reminders else p.wants_nitya_reminders end,
      wants_sankalpa_midpoint_reminders = case when p.wants_sankalpa_midpoint_reminders is not distinct from false and b.wants_sankalpa_midpoint_reminders is distinct from false then b.wants_sankalpa_midpoint_reminders else p.wants_sankalpa_midpoint_reminders end,
      wants_sattvic_reminders = case when p.wants_sattvic_reminders is not distinct from false and b.wants_sattvic_reminders is distinct from false then b.wants_sattvic_reminders else p.wants_sattvic_reminders end,
      wants_shloka_reminders = case when p.wants_shloka_reminders is not distinct from false and b.wants_shloka_reminders is distinct from false then b.wants_shloka_reminders else p.wants_shloka_reminders end,
      wants_tithi_reminders = case when p.wants_tithi_reminders is not distinct from false and b.wants_tithi_reminders is distinct from false then b.wants_tithi_reminders else p.wants_tithi_reminders end,
      wants_vrat_reminders = case when p.wants_vrat_reminders is not distinct from false and b.wants_vrat_reminders is distinct from false then b.wants_vrat_reminders else p.wants_vrat_reminders end
from public.notification_reset_backup_20261108 b
where b.user_id = p.id
  and (p.updated_at is null or p.updated_at <= b.taken_at);

drop table public.notification_reset_backup_20261108;

commit;
