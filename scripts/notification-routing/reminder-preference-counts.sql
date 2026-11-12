-- Current state for every switch being reset; no account identifiers are returned.
select flags.preference,
       count(*) filter (where flags.enabled is true) as enabled,
       count(*) filter (where flags.enabled is false) as disabled,
       count(*) filter (where flags.enabled is null) as unset
from public.profiles p
cross join lateral (values
  ('dharm_veer_reminder_enabled', p.dharm_veer_reminder_enabled),
  ('japa_reminder_enabled', p.japa_reminder_enabled),
  ('nitya_reminder_enabled', p.nitya_reminder_enabled),
  ('quiz_reminder_enabled', p.quiz_reminder_enabled),
  ('wants_brahma_muhurta_reminders', p.wants_brahma_muhurta_reminders),
  ('wants_community_notifications', p.wants_community_notifications),
  ('wants_evening_reminder', p.wants_evening_reminder),
  ('wants_family_notifications', p.wants_family_notifications),
  ('wants_family_remembrance_reminders', p.wants_family_remembrance_reminders),
  ('wants_festival_reminders', p.wants_festival_reminders),
  ('wants_madhyahn_reminder', p.wants_madhyahn_reminder),
  ('wants_mood_reminders', p.wants_mood_reminders),
  ('wants_nitya_reminders', p.wants_nitya_reminders),
  ('wants_sankalpa_midpoint_reminders', p.wants_sankalpa_midpoint_reminders),
  ('wants_sattvic_reminders', p.wants_sattvic_reminders),
  ('wants_shloka_reminders', p.wants_shloka_reminders),
  ('wants_tithi_reminders', p.wants_tithi_reminders),
  ('wants_vrat_reminders', p.wants_vrat_reminders)
) flags(preference, enabled)
group by flags.preference
order by flags.preference;
