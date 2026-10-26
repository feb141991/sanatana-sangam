-- Closes a notification-consent gap found while auditing the native app's new
-- per-category onboarding against every column that actually gates a live cron.
--
-- wants_evening_reminder (nitya-reminder-sandhya), wants_madhyahn_reminder
-- (nitya-reminder-madhyahn), and dharm_veer_reminder_enabled
-- (learning-engagement-candidates) already exist and already gate real sends,
-- but have never been writable through /api/native/profile and have never
-- appeared in any Settings or onboarding UI -- this migration does not touch
-- them, only the API route (separate file) needs to learn their names.
--
-- Two gaps do need schema changes:
--
-- 1. Mood check-ins (mood-reminder, mood-reminder-evening) have no per-user
--    column at all today -- every non-deleting profile gets them
--    unconditionally, gated only by quiet hours. wants_mood_reminders is a
--    brand-new column, so there is no prior user choice to preserve;
--    `default true` matches the only behaviour that has ever existed.
--
-- 2. Sattvic reminders (sattvic-reminder cron) piggyback on
--    wants_nitya_reminders -- turning off "Nitya reminders" in Settings
--    silently also turns off Sattvic, a feature never named in that UI.
--    wants_sattvic_reminders splits it into its own column. This is backfilled
--    per-row from wants_nitya_reminders, not a blanket default: a user who had
--    already turned Nitya reminders off must not have Sattvic silently turned
--    back on by this migration (see AGENTS.md rule 6/14 on backfills that
--    overwrite real user choices).

alter table public.profiles
  add column wants_mood_reminders boolean not null default true;

alter table public.profiles
  add column wants_sattvic_reminders boolean;

update public.profiles set wants_sattvic_reminders = wants_nitya_reminders;

alter table public.profiles
  alter column wants_sattvic_reminders set default true,
  alter column wants_sattvic_reminders set not null;
