# Daily Quiz reminders

Daily Quiz reminders use the existing candidate, resolver, and dispatch pipeline. They are opt-in and default off.

## Delivery behavior

- The first reminder is sent at the member's chosen local time (default 10:00; allowed range 07:00–15:00).
- **The second, 18:00 "still unfinished" reminder is switched OFF** (founder decision 2026-11-08, "drop it for now"): the morning slot already carries the quiz, and engagement-cadence-v3 allows one learning push a day, shared with Dharm Veer. The code is kept behind `QUIZ_EVENING_NUDGE_ENABLED` in `src/lib/quiz-candidate-producer.ts`; evening rows already scheduled before the change are still delivered and still re-checked for completion. When it was on, it was created only when `quiz_responses` had no row for that user and local date.
- Both stages are checked again immediately before dispatch. If the quiz was completed after a candidate or schedule row was created, that push is skipped. If the completion lookup is unavailable, dispatch requeues the claimed batch and sends nothing until it can verify completion. Candidate identity is stable across language changes during the same local day; notification copy still follows the language captured when the candidate was created.
- Quiet hours and three-hour minimum spacing still apply, so a reminder may be delayed or, if no safe slot remains, suppressed. The morning Shloka (08:00) sits three hours ahead of the quiz, so on a Shloka day the quiz usually goes out about an hour after its chosen time; the candidate lives for four hours after that time so the shift moves it instead of dropping it. The daily allowance is the learning slot (one push a day, shared with Dharm Veer) under `engagement-cadence-v3` once that migration is applied; until then the older shared five-a-day budget applies. See `ENGAGEMENT_CADENCE_POLICY.md`.
- The quiz preference is stored in `profiles.quiz_reminder_enabled` / `quiz_reminder_time`, and users control it in Native Settings. OS notification permission is still required for lock-screen delivery.

## Rollout gates

The dedicated producer route is `/api/cron/quiz-reminder-candidates`. It only enqueues candidates when both gates are enabled:

- `NOTIFICATION_RESOLVER_ENABLED=true`
- `NOTIFICATION_CANDIDATE_MODE_QUIZ=candidate`

The Supabase migration `20261005133036_daily_quiz_push_reminder_cadence.sql` installs a ten-minute producer job. Apply it only after the matching backend route is deployed and the Supabase Vault secret `notification_dispatch_secret` is present. Native Settings must also be available before inviting members to opt in. No production flag or database migration was changed as part of this implementation.

The old learning-engagement producer no longer creates the former one-stage quiz candidate. It continues to own Dharm Veer reminders.
