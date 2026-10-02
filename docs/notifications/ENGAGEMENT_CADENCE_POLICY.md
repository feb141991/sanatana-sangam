# Engagement notification cadence

**Status (2026-10-03):** the base database guard is applied to production as
`20261002181447`. The producer/resolver release and follow-up fail-closed
reservation migration are prepared and locally verified, but not yet deployed or
applied. Production candidate flags have not been changed.

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
no-safe-slot rollback path; those still need a disposable database run because no
local database container is available. A separate two-session test held the user/day lock
in one transaction while another candidate batch waited; after commit, the second
batch saw the first three reservations and rejected its three-row request rather
than exceeding the five-item cap. This verifies the database lock behavior but
does not replace a full shadow run against the deployed Supabase schema. The
migration was subsequently applied to production after preflight; its version was
aligned with Supabase's returned version and postconditions were verified read-only.

Roll out in this order:

1. Deploy the queue-backed producers and resolver with candidate flags unchanged.
2. Apply the follow-up fail-closed migration after that source is live.
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
