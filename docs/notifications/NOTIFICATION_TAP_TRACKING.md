# Notification tap tracking

**Status (2026-11-10): WRITTEN, NOT APPLIED, NOT DEPLOYED, NOT PUBLISHED.** The migration
`20261111100000_notification_tap_tracking.sql`, the route, the push-payload change and the export entry are in the
repository on branch `notif-tap-tracking`. The privacy wording in section 7 is a **draft for the founder's approval**; the live
policy (`src/lib/privacy-content.ts`) has not been touched. **As written, this records nothing until accounts opt in** (section 3).

## 1. What this is for

Until now nothing recorded that a notification was tapped, so every in-app "read" rate was 0% and no change to cadence,
wording or timing could be judged (the study plan in the Native repo, `docs/research/NOTIFICATION_STUDY_PLAN.md`, step 2).
A tap record lets us ask, per notification type: of the pushes we sent, how many were opened?

It does **not** measure: dismissals, notifications that were seen but not tapped, whether a person acted afterwards,
whether a notification annoyed them, or anyone who has not opted in. A tap is evidence of interest, not of benefit; the
agreed goal is sustained practice without feeling nagged, and taps alone are never the goal.

## 2. What is recorded, and what is not

| Recorded (one row per tap) | Source |
|---|---|
| Account | the signed-in session (`auth.uid()`), never the request |
| Notification key | the app, re-checked against our own send log |
| Notification type | **our send log** (`notification_deliveries.type`), not the client |
| Tap time | the app's clock, clamped: never in the future, never more than 10 minutes before the send, never older than 7 days |
| Launch state | `cold_start` (the tap launched the app) or `running` (it was already open) |
| App version, platform | the app |

**Not recorded:** title, body, URL, route, screen, content, location, mood, tradition, or any text the client chooses. The
route accepts exactly six fields and refuses anything else, including a user id or a type.

A tap is stored only if the key matches a push **actually sent to that account** (status `sent`, channel `push`, not a dry run).
An invented key, another account's key, a failed or skipped send and an e-mail all record nothing. Retention is 90 days
(daily purge at 21:45 UTC); rows are deleted with the account and when consent is withdrawn; they are in the data export.

## 3. Consent: the decision this needs from the founder

`notification_tap_recording_allowed(user, type)` is the **single place** the rule lives. As written it follows the existing
product-measurement rule:

- the account must have turned on **"Share product usage data"** (`profiles.consent_product_analytics`, default off); and
- for any notification that could reveal religious practice, also **"Tradition-aware personalization"**
  (`consent_religious_data`). Social notifications (another person's reaction, comment or request) and account/security
  notices need only the first. Any type we have not seen is treated as revealing practice.

**On 2026-11-10, 0 of 32 accounts had opted in to product usage data** (14 had religious-data consent), and the analytics
table is empty. So the feature as written collects nothing at first. That is a deliberate fail-closed default, not a bug.

| Option | What it means | Code change | Policy change |
|---|---|---|---|
| **A. As built (recommended unless counsel says otherwise)** | Same opt-in as the rest of product measurement. Consistent with what the policy already promises. Gathers data only from people who opted in, which today is nobody. | none | add the sentence in 7A |
| **B. Disclosed, no separate switch** | Record for every account, disclosed in the policy. Gives data immediately, but treats engagement with religious reminders more loosely than the product treats analogous data, and religious beliefs are a sensitive category in several regimes. | replace the body of `notification_tap_recording_allowed` (one function, plus its test) | add 7B; likely needs legal review first |
| **C. Its own switch** | A dedicated "Help improve reminders" setting. Clearest to a user; needs a Settings control and a column. | new column, function change, Settings screen | add 7C |

*This is not legal advice. Whether a notice is enough, or consent is required, depends on the person's location and on how
the data is classified; it should be confirmed with counsel before option B or C is chosen.*

## 4. How a tap becomes a row

1. The backend puts each recipient's own `notificationKey` in the push `data`, using the same expression the delivery audit
   stores (`push-server.ts`). A caller cannot override it.
2. The app (Native repo) reads it when the notification is tapped, but only records once the person is signed in and the app is
   ready, and only if the person has the consent on this device. It queues the tap for the signed-in account and uploads it.
3. `POST /api/native/notification-taps` authenticates, rate-limits (60 a minute per account), validates a strict six-field body
   and calls `record_notification_tap` through the **person's own session**, not the admin client.
4. The function locks the consent row (serialising with a withdrawal), checks consent, finds the matching send, takes the type
   and send time from it, clamps the timestamp, and inserts idempotently on `(account, client_event_id)`.

The answer is always 202 with four flags (`accepted`, `consentRequired`, `religiousConsentRequired`, `unmatched`); the app
stops queueing on `consentRequired` and drops a tap that did not match.

## 5. Reading the results

`get_notification_tap_summary(p_days, p_min_recipients)` (service role only) returns, per notification type, the number of
notifications sent, the accounts sent to, the taps and the accounts that tapped. It returns no account or notification
identifier. A type appears only when **at least 5 accounts** were sent it (the function refuses a smaller threshold), and sends
are counted only for accounts whose taps could have been recorded, so the rate is not deflated by people who never opted in.

Limits to state whenever a number is quoted:
- Consent is read **now**, not as of each send, so recently opted-in accounts are slightly over-counted in the denominator.
- At this size (32 accounts, about 23 reachable) a rate is a description, not a conclusion.
- A cold-start tap and a tap while the app is open are different situations; read them separately before comparing types.
- **The live policy says internal reports hide any total from fewer than 20 accounts. This summary's floor is 5.** At 32 accounts a
  floor of 20 would show nothing. The draft wording below states 5; the founder should confirm that, or accept that nothing
  can be reported until there are more accounts.

## 6. Rollout, risk and verification

Order: apply the migration, deploy the backend (route + push payload + export), then ship the app. Any order is safe: an app
without the key sends nothing; a backend without the route answers 404 and the app keeps the tap until it ages out.

**ROC pre-flight (AGENTS section 4).** Overload trap: every function is a new name; no existing function is redefined.
Caller contract: no existing caller. User data: creates a table, updates no row, changes no default. Locks: `CREATE TABLE`
plus a trigger on `profiles` (brief, small table). Rollback: `supabase/rollbacks/20261111100000_notification_tap_tracking_rollback.sql`
drops the table, so its rows are lost (they hold no content and are kept 90 days). RLS: enabled and forced, no policy.

After applying: run `node scripts/assert-supabase-migration-version.mjs 20261111100000`, regenerate
`src/types/database.generated.ts`, and regenerate the privacy baseline (`npm run baseline:privacy`) so the new store appears in
`CAT-09-NOTIFICATIONS`.

Verification, on a scratch PostgreSQL 18 with stand-in tables shaped from the live column lists and the **real** product-analytics
migration applied beside it (not a Supabase branch):
- the new SQL test passes; 42 of 42 deliberate breakages of the migration turn it red (four survivors found and closed);
- the repository's existing analytics test passes 24 of 24 both without and with this migration;
- rollback, re-apply and applying twice in a row all work;
- route, push payload and export: 29 of 30 deliberate breakages are caught (the 30th is equivalent code).
Not verified: a Supabase branch, concurrency between a tap and a withdrawal (the lock is checked in the source only), any device.

## 7. DRAFT privacy-policy wording — NOT PUBLISHED, for the founder's approval

These belong in the existing "Diagnostics and Product Measurement" section of `src/lib/privacy-content.ts`, after the
"Optional product measurement" paragraph. The labels "Share product usage data" and "Tradition-aware personalization" are the
ones that paragraph already uses. *Not legal advice.*

**7A (matches option A):**
> Notification taps: if you have turned on "Share product usage data", we also record when you tap a notification we sent you, so we can tell whether our reminders are useful or unwelcome. Each entry holds which notification it was (its internal reference and its type, for example "quiz"), when you tapped it, whether the app was already open, your app version and platform, linked to your account. It never holds the text of the notification, the screen it opened, or anything you read or wrote. Taps on notifications that could reveal religious practice, such as a japa or festival reminder, are recorded only if you have also turned on "Tradition-aware personalization". Entries are kept for 90 days. Turning off product measurement deletes them straight away, turning off "Tradition-aware personalization" deletes the ones about practice notifications, and deleting your account deletes them all. Our internal reports show counts for each type of notification and hide any count based on fewer than 5 accounts.

**Edit to the existing export sentence** ("You can download an export of your account data from Settings, including your stored
product-measurement entries and app performance diagnostics"): add "notification taps" after "product-measurement entries".

**7B (option B, only if counsel agrees a notice is enough):**
> Notification taps: when you tap a notification we sent you, we record which notification it was (its internal reference and type), when, whether the app was already open, and your app version and platform, linked to your account, so we can tell whether our reminders are useful or unwelcome. We do not record the notification's text or what you did next. We keep these entries for 90 days, include them in your data export, and delete them when you delete your account. You can switch this off at any time in Settings.

(7B promises a Settings switch that does not exist yet; it needs option C's control, or it is not true.)

**7C (option C):** as 7A with "Help improve reminders" in place of the two switches.

**Store disclosures (Apple App Privacy, Google Play Data safety):** tap records are "Product Interaction" (Apple) and "App
interactions" (Google), linked to the account, for analytics. If product usage data is already declared there, this likely
falls under the same declaration; confirm against the current store forms before release.

## 8. Side observations

- `notification_deliveries`, the table this depends on for validation, has **no retention job** (the live cron list has purges for
  candidates and resolver events but none for deliveries). It holds an account and a notification key per send, indefinitely.
- The policy's "fewer than 20 accounts" statement and this summary's floor of 5 differ (section 5).
- Out of scope, as agreed in the study plan: "category switched off afterwards" and "OS permission revoked" are not recorded
  anywhere as history, so they cannot be attributed to a notification today.
