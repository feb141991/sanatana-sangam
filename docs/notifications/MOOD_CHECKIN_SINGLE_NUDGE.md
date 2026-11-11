# One mood check-in a day (founder decision 2026-11-12)

Before: two producers wrote mood pushes. `/api/cron/mood-reminder` (type `mood_checkin`, "Midday check-in", local noon) and
`/api/cron/mood-reminder-evening` (type `mood`, "Evening check-in"). Production, 14 days to 2026-11-12: 325 mood pushes
(161 midday, 164 evening). On 123 of 202 user-days a person received both. Only 6 check-ins were completed, by 4 people;
4 of 164 evening pushes and 2 of 161 midday pushes were followed by a check-in within 24 hours.

After: the midday producer, its cron entry and its telemetry entry are removed. The evening check-in remains the only mood push.
`mood_checkin` rows already queued are still delivered or expire normally; the dispatcher keeps its emoji mapping for them.
Guard: `src/lib/mood-checkin-single-nudge.test.ts`.

After deploy, cancel any still-pending `mood_checkin` rows (read-only count first):
`select count(*) from notification_schedule where notification_type = 'mood_checkin' and status = 'pending';`

Mood reminders become opt-in for new profiles (`wants_mood_reminders` defaults to false in the tiered-defaults migration).
