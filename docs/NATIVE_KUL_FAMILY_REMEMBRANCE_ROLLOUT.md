# Native KUL Family Remembrance

This is a private, opt-in annual reminder for a recurring KUL date linked to a family-tree person marked deceased. It supports either a civil Gregorian anniversary or the tithi the family enters. Tithi dates use the KUL's local sunrise calculation; this feature does not select or claim a Shraddha muhurta or prescribe a ritual.

## Implementation contract

1. A guardian links a recurring `death_anniversary` event to a person in the same KUL who is explicitly marked deceased. Native and the database both reject missing, living, or cross-KUL links.
2. A user independently opts in under Native notification settings. Consent defaults off. The reminder uses a separate profile preference and a local delivery-time field; it does not inherit the broad family-activity preference.
3. The backend resolves recurring civil dates annually, and resolves entered tithis against the linked KUL's date, month convention, location, and timezone. Missing location/timezone or an unresolved tithi fails closed for that event. Gregorian dates do not require latitude/longitude.
4. The producer writes a single semantic candidate per user and local date, coalescing multiple family dates for the same day. It never sends a push directly. The central resolver and PostgreSQL cadence guard both classify it as explicitly requested, so it does not consume the shared engagement budget; the central dispatcher rechecks consent before delivery.
5. Lock-screen copy is generic and localized. It contains no deceased person's name, event title, tithi, or KUL name. Tapping it opens the authenticated KUL family-dates section; membership is revalidated by that screen.
6. Source edits, deceased-status changes, KUL calendar changes, membership departure, account deletion, consent changes, delivery-time changes, timezone/language changes, and quiet-hours changes invalidate queued work. Candidate insertion also verifies the current source snapshot to close the read-then-insert race.
7. The candidate type is visible through the shared notification pipeline-mode registry and is disabled unless both its type gate and the global resolver gate are enabled. Structured cron logs report aggregate counts only.

## Rollout

Keep `NOTIFICATION_CANDIDATE_MODE_FAMILY_REMEMBRANCE` unset/disabled while reviewing and applying the schema. If the earlier Native KUL family-hub expansion migration (`20261003140809_native_kul_family_hub_expansion.sql`) is still pending, apply it before `20261003174633_native_kul_deceased_remembrance_notifications.sql`; the reminder migration adds triggers against its tithi and calendar columns.

After the backend with both migrations is deployed, install a Native build with the Settings schema-compatibility fallback. The new preference control stays disabled until the database column exists, so installing Native first does not break the existing settings screen.

Before enabling the candidate flag, verify on a test account that: (a) no candidate exists before explicit opt-in; (b) an opted-in deceased-relative event yields one candidate and one in-app notification; (c) repeated producer runs do not duplicate it; (d) the push copy is generic; (e) changing consent, quiet hours, the event, the person, the KUL calendar, or membership cancels queued work; and (f) dispatcher delivery rechecks consent. Exercise Gregorian and tithi dates, a leap date, a daylight-saving transition, and a reminder at the end of the allowed 08:00–21:59 local window.

The producer runs daily at 17:00 UTC. The supported local reminder window is 08:00–21:59, so that run is before the selected delivery time across civil time zones. Quiet hours can move the delivery to the next allowed local time. If the scheduled annual date/time has already passed, the producer does not send a late reminder.

Enable only `NOTIFICATION_CANDIDATE_MODE_FAMILY_REMEMBRANCE=candidate` after the resolver is available. Observe candidate creation, resolution, in-app delivery, push receipts, opt-in skips, unresolved tithis, and dedupe counts before broadening use. Roll back by disabling the family-remembrance candidate flag first; use the matching rollback migration only after queued candidates/schedules are confirmed stopped.

No PWA surface or direct-send notification route is part of this implementation. Migrations and feature flags are not applied by this change.
