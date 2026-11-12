-- Read-only aggregate; run immediately before approving the one-time reset.
-- Account age is a cohort heuristic, not evidence of an individual's choice.
with affected as (
  select p.onboarding_completed, p.wants_brahma_muhurta_reminders
from public.profiles p
where (p.onboarding_completed is not true and (
         dharm_veer_reminder_enabled is distinct from false
       or japa_reminder_enabled is distinct from false
       or nitya_reminder_enabled is distinct from false
       or quiz_reminder_enabled is distinct from false
       or wants_brahma_muhurta_reminders is distinct from false
       or wants_community_notifications is distinct from false
       or wants_evening_reminder is distinct from false
       or wants_family_notifications is distinct from false
       or wants_family_remembrance_reminders is distinct from false
       or wants_festival_reminders is distinct from false
       or wants_madhyahn_reminder is distinct from false
       or wants_mood_reminders is distinct from false
       or wants_nitya_reminders is distinct from false
       or wants_sankalpa_midpoint_reminders is distinct from false
       or wants_sattvic_reminders is distinct from false
       or wants_shloka_reminders is distinct from false
       or wants_tithi_reminders is distinct from false
       or wants_vrat_reminders is distinct from false))
   or (p.wants_brahma_muhurta_reminders is true
       and not (p.onboarding_completed is true and p.created_at >= timestamptz '2026-10-26 11:30:00+05:30'))
)
select count(*) as distinct_profiles_to_back_up,
       count(*) filter (where onboarding_completed is not true) as all_switches_reset,
       count(*) filter (where onboarding_completed is true) as brahma_only_reset,
       count(*) filter (where wants_brahma_muhurta_reminders is true) as brahma_true_to_false
from affected;
