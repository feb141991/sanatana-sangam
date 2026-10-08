# Daily Quiz reminders

Daily Quiz reminders use the existing candidate, resolver, and dispatch pipeline. They are opt-in and default off.

## Delivery behavior

- The first reminder is sent at the member's chosen local time (default 08:00; allowed range 07:00–15:00).
- A second, separate reminder is scheduled for 18:00 local time, three hours before the 21:00 evening cutoff. It is created only when `quiz_responses` has no row for that user and local date.
- Both stages are checked again immediately before dispatch. If the quiz was completed after a candidate or schedule row was created, that push is skipped. If the completion lookup is unavailable, dispatch requeues the claimed batch and sends nothing until it can verify completion. Candidate identity is stable across language changes during the same local day; notification copy still follows the language captured when the candidate was created.
- Quiet hours, the shared five-notifications-per-local-day budget, and three-hour minimum spacing still apply. The evening reminder may therefore be delayed within its 20:45 expiry or suppressed if no safe slot remains.
- The quiz preference is stored in `profiles.quiz_reminder_enabled` / `quiz_reminder_time`, and users control it in Native Settings. OS notification permission is still required for lock-screen delivery.

## Rollout gates

The dedicated producer route is `/api/cron/quiz-reminder-candidates`. It only enqueues candidates when both gates are enabled:

- `NOTIFICATION_RESOLVER_ENABLED=true`
- `NOTIFICATION_CANDIDATE_MODE_QUIZ=candidate`

The Supabase migration `20261005133036_daily_quiz_push_reminder_cadence.sql` installs a ten-minute producer job. Apply it only after the matching backend route is deployed and the Supabase Vault secret `notification_dispatch_secret` is present. Native Settings must also be available before inviting members to opt in. No production flag or database migration was changed as part of this implementation.

The old learning-engagement producer no longer creates the former one-stage quiz candidate. It continues to own Dharm Veer reminders.
