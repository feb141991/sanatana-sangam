# Engagement notification cadence

> **Policy `engagement-cadence-v3` ("one other nudge a day") is WRITTEN, NOT APPLIED (2026-11-10).**
> Migration `20261110140000_one_nudge_a_day_cadence.sql` and its rollback are in the repository and the
> resolver change is committed, but production still enforces `engagement-cadence-v2` (the contract under
> "Previous contract" below) until that migration is applied. Nothing here has been run against a Supabase
> branch or production.

## engagement-cadence-v3

Founder decisions, 2026-11-08: at most one other nudge a day; Shloka and a daily learning slot are protected;
**7 is an outer safety ceiling, not a target**; the Daily Quiz 18:00 follow-up is dropped for now.

Every notification belongs to exactly one class:

| Class | Types | Allowance per user per local day |
|---|---|---|
| exempt | security and account; explicit user reminders (Japa, Sankalpa, family and Sanskāra milestones); ritual windows (Brahma Muhurta, Nitya, Aarti and the rest); reviewed observances; and nine person-initiated Mandali rows (connection requests, reactions, comments, block and report receipts) | never counted, never suppressed here |
| shloka | `shloka` (and the `streak` aliases) | 1 |
| learning | `quiz`, `dharm_veer` (one slot, shared) | 1 |
| other | every remaining non-exempt type, including types added later | 1 (shared) |

The ceiling of **7** caps shloka + learning + other together. The class limits already allow at most three, so
the ceiling is a backstop against a mislabelled producer, not a working limit. Exempt rows do not count toward it.

Why the Mandali rows are exempt: they are another person's action, not a Shoonaya nudge; counting them would
let a reaction at 09:00 use up the day's one other nudge. They are also written by database triggers without a
`local_date`, so the resolver could never see them while the database counted them, and that disagreement would
roll back whole resolver batches (see "The two sides must agree"). This is a product decision made while
building v3; reversing it is one list entry on each side.

**What changes for a person:** Shloka is no longer crowded out (83% of Shloka candidates were suppressed in the
14 days before 2026-11-07, because it was the last to be considered at 19:00); mood, Sattvic, the weekly summary
and similar share one slot instead of up to five; and the AI digest, if still running, is one of those.

### The two sides must agree

The limits are enforced in the resolver (`src/lib/notification-resolver.ts`, numbers in
`src/lib/notification-cadence-policy.ts`) and in the database (`notification_cadence_limit`,
`notification_cadence_class`, and the three functions that use them). If the resolver accepts a row the trigger
then refuses, `persist_notification_candidate_resolution` raises, and **every candidate claimed in that run, for
every user, goes back to pending and is retried ten minutes later** until the offending candidate expires.
`src/lib/notification-cadence-parity.test.ts` reads the SQL and fails if the limits, class lists, exempt list,
alias map or version string differ; `supabase/tests/notification_cadence_atomicity.test.sql` asserts the same
classes. Change both sides in one commit.

History is classified by type **and** key on both sides, so a generic bell row (`type = general`,
`notification_key = quiz:...`) is counted as the quiz it mirrors, and a push plus its bell row count once.

### Rollout order

1. Verify the migration versions are unique (`20261110100000` is the separate profile-tradition lock), and run the notification Vitest suites, TypeScript, and `bash scripts/shadow/verify-notification-migrations-shadow.sh`. Verify the supported Native onboarding build starts reminder switches off and writes the person's choices. Old installed builds can still write `true` explicitly; a database default cannot distinguish that write from a choice. Confirm the supported-client rollout before treating the consent issue as closed.
2. In an approved production window, pause resolver invocations. Deploy the intended v3 revision with `NOTIFICATION_RESOLVER_ENABLED=false`. Use the authenticated resolver `?dryRun=true` response to check `revision` and `cadenceVersion` on the production alias without claiming candidates. Confirm the previous deployment cannot receive new cron invocations and no prior run is active. Check `public.notification_resolver_lock.lease_expires_at` and drain the previous deployment's running invocations; do not clear live leases to force the transition.
3. Apply `20261112100000` (tiered defaults: shloka, Japa, festival, vrat, tithi ON for a new profile; the other 13 OFF) individually and check the 18 defaults. It supersedes `20261107100000` (all OFF), which may be skipped. It changes defaults only and rewrites no existing row. Then run `scripts/notification-routing/reminder-reset-preflight.sql` and `reminder-preference-counts.sql` (true/false/NULL) against live profiles and apply `20261112110000` once, individually: it switches Brahma Muhurta OFF for every profile except one that finished onboarding after 2026-10-26 11:30 IST, backed up in `notification_brahma_reset_backup_20261112`. It touches nothing else. The former all-OFF reset of never-onboarded profiles (`20261108100000`) was removed because it conflicts with the approved tiers; what to do about the non-core switches of profiles that never finished onboarding is an open founder decision. This is a reset of uncertain consent, not proof of who opted in. Compare the backup count with the approved preflight and keep the restricted backup until the review is complete. The new Native onboarding must show the five core choices pre-selected (AGENTS.md rule 19) before the defaults are relied on.
4. Apply `20261110140000` individually. Its SQL runs in one transaction with a five-second lock timeout. For **each** migration run `node scripts/assert-supabase-migration-version.mjs <version>` and verify the linked history. Confirm `SELECT public.notification_cadence_policy_version();` returns `engagement-cadence-v3`.
5. Resume only the verified v3 revision. Live runs skip before claiming when the version RPC is absent or mismatched, and report an error if the version cannot be read. Observe the next scheduled resolver and dispatch runs for claimed/promoted counts, batch aborts, and PGRST203 errors. This is an operational check; it does not establish device delivery.
6. For cadence rollback: pause and drain again, roll back SQL, deploy the matching v2 resolver, then resume. Never put the v2 resolver back on the live cron while v3 SQL is active. The reminder data rollback is separate: it restores only the affected columns on untouched tuple versions and can re-enable old reminders. Review and approve restoration separately.

**Transition:** rows already admitted under v2 stay. A user who already has two "other" rows today gets no third
that day, and cannot block Shloka or the learning slot, because each check looks only at the class being added.

### Verification (and what it does not show)

SQL: the existing 34-assertion test passed unmodified on a scratch PostgreSQL 18 built from the real migrations
before the change; the rewritten test passes 89 of 89 after it; 35 of 35 deliberate breakages of the migration
turn it red; the rollback restores the original behaviour (the original test passes 34 of 34 afterwards) and the
migration re-applies. Resolver: 27 of 27 deliberate breakages turn the vitest files red. The scratch database uses
stand-in tables shaped from the live column lists, the real cadence migrations and the live exempt-type function;
pgTAP is replaced by a small local shim. **This is not a Supabase branch and not the full migration chain**, and
nothing has run on a device.

### The day shape (producer changes, a separate commit, also unapplied and undeployed)

- **Shloka moves from 19:00 to 08:00 local** (`SHLOKA_REMINDER_LOCAL_HOUR`; founder: "around 08:00 or 09:00").
  A person whose quiet hours cover 08:00 is moved past them (quiet hours ending at 09:00 give 10:00). Because
  the cron enqueues the *next* occurrence, users east of UTC who already received a 19:00 reminder that day get no
  Shloka reminder on the first day after the deploy (a one-day gap, not a duplicate).
- **The quiz is moved later, not dropped.** The three-hour spacing rule keeps the quiz three hours behind
  Shloka: a quiz chosen for 10:00 goes out at about 11:00 on a day Shloka is sent (12:00 behind a 09:00 Shloka,
  13:00 behind a 10:00 one). Its candidate therefore lives until chosen time + 4 hours (60-minute creation window
  + one 180-minute shift); before this, a 09:00 Shloka made the quiz `no_safe_cadence_slot` and a 08:00 one left
  it exactly on its expiry. A second shift (for example a chosen Japa time in the way) is still refused.
  `notification-day-shape.test.ts` pins all of this against the real producers. **Settings and onboarding say
  "10:00 AM" for the quiz; on a Shloka day it arrives about an hour later.**
- **The quiz 18:00 follow-up is off** (`QUIZ_EVENING_NUDGE_ENABLED = false`). Rows already scheduled still deliver.
- The Shloka *legacy* queue path (used only when the routine mode is `legacy`) still carries its old copy; it is
  not the live path.

### Not done yet

Alternating quiz and Dharm Veer on a fixed day count, and sending Dharm Veer only when something is unread (the
Dharm Veer cron skips every user who has quiz reminders on, so today they never receive both; "unread" would have
to be defined, and `dharm_veer_responses` records a decision, not a view); retiring the AI digest; tap tracking.
Until those change, v3 only limits what the producers ask for.

## Previous contract (engagement-cadence-v2, in force until v3 is applied)

**Status (2026-10-03):** the base database guard is applied to production as
`20261002181447`; the fail-closed reservation check is applied as
`20261002185143`. Producer/resolver source commit `5a6237c` is deployed to Vercel
Production. Production candidate flags have not changed.

## Delivery contract

Flexible, non-exempt engagement messages share a maximum of **five admitted
notifications per user per local civil day**. A type therefore cannot exceed five
per day either, but this is not a five-per-type allowance that multiplies across
features. Existing pending, sending, and sent schedule rows and keyed in-app bell
records count once per semantic key. Legacy aliases such as `mood_checkin` and
`mood`, `sattvic_reminder` and `sattvic`, and `streak` and `shloka` use the same
accounting type.

Flexible messages are separated by at least **three hours** from another pending
or delivered notification. Their requested local time is preserved when possible.
If it conflicts with spacing, quiet hours, or the 07:00–21:00 local delivery
window, the database moves it to the next legal 15-minute slot on the same local
date. If no safe slot remains, it suppresses the item and records the reason. It
does not replay expired content the next day. A later producer retry with the same
key is idempotent.

The shared budget excludes account/security messages, explicitly requested
reminders, approved ritual windows, and reviewed observances. These messages retain
their intended delivery contracts. Fixed-time exempt messages still block a nearby
flexible message from being scheduled, but the cadence policy does not space exempt
messages against one another.

## What the implementation covers

The candidate resolver applies priority, quota, quiet-hour, and spacing decisions.
The SQL migration adds a per-user/local-date transaction lock and a
`notification_schedule` admission trigger, so both candidate promotions and
queued legacy producers use the same quota history after the migration is applied.
Candidate persistence inserts rows one at a time inside its transaction so later
rows in the same batch can see earlier reservations and move safely. The shared
TypeScript queue helper sorts locks deterministically and puts multiple rows for a
single user/date into separate SQL statements; this avoids deadlocks and lets the
trigger space them instead of rejecting a valid batch.

The follow-up migration wraps candidate persistence with an inserted-row count
check. If the database cadence trigger suppresses a resolver-accepted schedule
row because no legal same-day slot remains, it raises inside the transaction so
the schedule, candidate decision, and audit write all roll back together. The
resolver recognizes that error and returns the claim to `pending` for a fresh
history check on the next run.

Flexible direct-send routes moved to the durable schedule include Shloka, evening
mood, weekly summaries, journal anniversaries, guided-plan reminders, achievement
milestones, Seva tier celebrations, and daily digests. Midday mood and Sattvic
legacy queue paths now use the same shared writer. `/api/sanskar/schedule` remains
an explicit user-configured family-reminder exception and now uses stable
recipient-scoped keys so repeated schedule requests do not create duplicate rows.

The cap is **not a literal limit over every OS push**. Immediate Mandali social
activity, admin broadcast/test pushes, and direct ritual/observance senders keep
their separate delivery paths. Persisted bell records from these paths can count
as history for later flexible queue admission, but a direct push can still occur
outside the spacing guard. Any product decision to coalesce social activity or
rate-limit admin campaigns should be implemented as a separate policy with its
own urgency and audit contract.

This cadence is a conservative interruption-control rule, not a claim that a
particular time is psychologically best for every person. A user-selected reminder
time stays the first choice; schedule changes only avoid collisions. Notification
batching research supports reducing interruptions, but does not define one ideal
schedule for every user ([Fitz et al., 2019](https://doi.org/10.1016/j.chb.2019.07.016)).
Apple recommends time-sensitive delivery only for messages that need attention
now or within about an hour ([Apple notification guidance](https://developer.apple.com/design/human-interface-guidelines/managing-notifications?changes=la&language=objc)).

## Verification and rollout

The base migration and its rollback were executed against an isolated PostgreSQL
18.3 cluster with a minimal fixture matching the referenced tables and columns.
The original repository SQL test's 31 assertions passed through a local pgTAP
compatibility shim because pgTAP and Docker are not installed here; this is not a
full Supabase shadow database. The follow-up adds three SQL assertions for the
no-safe-slot rollback path. The repository pgTAP suite could not run locally
because no database container is available; an equivalent isolated transaction
smoke test ran against production and verified the expected exception plus
rollback of its synthetic profile, schedule, and audit rows. A separate two-session test held the user/day lock
in one transaction while another candidate batch waited; after commit, the second
batch saw the first three reservations and rejected its three-row request rather
than exceeding the five-item cap. This verifies the database lock behavior but
does not replace a full shadow run against the deployed Supabase schema. The
migration was subsequently applied to production after preflight; its version was
aligned with Supabase's returned version and postconditions were verified read-only.

Roll out in this order:

1. Deploy the queue-backed producers and resolver with candidate flags unchanged.
   This is live from commit `5a6237c`.
2. Apply the follow-up fail-closed migration; this is live as
   `20261002185143`.
3. Run the full Supabase shadow suite when shadow infrastructure is available;
   include DST, quiet-hour, legacy-history, cancellation, repeated-key, multi-row,
   and concurrent-session cases.
4. Canary internally. Compare producer rows, cadence decisions, queue dispatch,
   push receipts, opt-outs, and notification-permission changes by canonical type
   and local date before changing candidate-mode flags.
5. Roll back by reverting backend callers first. Keep the additive database guard
   until no deployed code depends on it; use the SQL rollback only after that
   compatibility check.

Monitor scheduled, shifted, suppressed, dispatched, failed, and duplicate counts
by canonical type and timezone. Review follow-through and opt-outs alongside opens;
do not optimize solely for taps. With the current small cohort, use explicit user
preferences and diagnostic evidence instead of fitting a personalized timing
model.
