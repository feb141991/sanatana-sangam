-- Rollback for 20261112100000_notification_reminders_tiered_defaults.sql: restores the pre-tier defaults (true) on all 18 columns.
-- It changes no existing row. If 20261107100000 (all OFF) was applied first and you want that state instead, run its statements again.
begin;
set local lock_timeout = '5s';

alter table public.profiles
  alter column dharm_veer_reminder_enabled set default true,
  alter column japa_reminder_enabled set default true,
  alter column nitya_reminder_enabled set default true,
  alter column quiz_reminder_enabled set default true,
  alter column wants_brahma_muhurta_reminders set default true,
  alter column wants_community_notifications set default true,
  alter column wants_evening_reminder set default true,
  alter column wants_family_notifications set default true,
  alter column wants_family_remembrance_reminders set default true,
  alter column wants_festival_reminders set default true,
  alter column wants_madhyahn_reminder set default true,
  alter column wants_mood_reminders set default true,
  alter column wants_nitya_reminders set default true,
  alter column wants_sankalpa_midpoint_reminders set default true,
  alter column wants_sattvic_reminders set default true,
  alter column wants_shloka_reminders set default true,
  alter column wants_tithi_reminders set default true,
  alter column wants_vrat_reminders set default true;

commit;
