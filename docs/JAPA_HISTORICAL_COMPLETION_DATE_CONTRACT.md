# Japa historical-completion date contract — design (pre-migration)

Status: **design only, no migration written yet**. Per review: document
timestamp validation, timezone handling, the permitted recovery window,
and legacy queued entries before touching `complete_japa_session`.

**Revision history:**

- **Rev 2** found three defects in Rev 1, all corrected (search
  "CORRECTED" for the spots): (1) the fallback path derived its date as
  `v_today` and then compared that date to `v_today` to decide streak
  eligibility — always true by construction, so every fallback case
  silently qualified for the same-day streak-touching path, reproducing
  the exact bug this design exists to fix. (2) "a future attributed date
  cannot occur" was asserted as an invariant and would have `raise
  exception`ed in production — reachable via ordinary clock skew crossing
  the 4 AM boundary, or a client/profile timezone mismatch, no malicious
  or broken client required. (3) "idempotent replay is unaffected" didn't
  account for the *new* response fields this design adds — a naive
  replay would have needed to either omit them or recompute wrong ones
  from `get_japa_context()`'s always-current state.
- **Rev 3** found two further defects in Rev 2's fix, both corrected
  (search "REV 3" for the spots): (1) Rev 2's single `unknown_day`
  fallback conflated two genuinely different situations — a request from
  an app version that predates this feature entirely (which will keep
  happening for as long as any user hasn't updated, for perfectly normal
  real-time completions) and a request from an *updated* client whose
  timestamp genuinely couldn't be trusted. Skipping the streak for the
  first case would have silently stopped streak credit for every
  not-yet-updated install — the server cannot distinguish the two from
  the payload alone, so the fix is a fourth, explicit `unverified` state
  rather than trying to guess. (2) Backfilling every pre-existing
  `mala_sessions` row as `'confirmed_same_day'` invented certainty this
  design has no basis for — some existing rows may already be exactly
  the delayed-recovery-mis-dated case this whole effort exists to
  address, and backfilling them as "confirmed" would falsely certify
  data that never went through this validation. Backfill to `'unverified'`
  instead, which preserves their existing dates/rewards/streak effects
  exactly (same as Rev 3's fix for #1) without claiming a verification
  that never happened. Rev 3 also stopped presenting `v_today` as a known
  practice date for the two unconfirmed states — see "Response contract"
  below.

## The bug this fixes

`complete_japa_session` (`supabase/migrations/20260905232420_repair_japa_completion_contract_drift.sql:242`)
derives the practice day from `now()` — the server clock at the moment the
*request is processed*, not the moment the round was *completed*:

```sql
v_today := ((now() at time zone v_timezone) - interval '4 hours')::date;
```

That was harmless when a failed save was retried within seconds (the old
in-memory bounded retry in `lib/japaCompleteRetry.ts`). Native's durable
pending-completion queue (`lib/japaPendingCompletion.ts`, this session)
changes that: a completion can now legitimately arrive hours or days after
it happened — after a process death, after being offline, after a
definitive rejection is manually retried later. Recovering it always
attributes it to *today*, which is wrong: a round done Tuesday night that
syncs Thursday morning gets Thursday's date, silently mis-crediting a
streak day (or worse, breaking one).

Root cause and fix are cross-repo: the client already knows the true
completion instant (it just never sends it), and the server owns the
canonical date-derivation rule.

## Policy (agreed before this design)

Modified Option B, chosen explicitly over rebuilding historical
streaks (more complex, deferred) and over silently dropping unaccepted
completions (rejected outright):

- Preserve the **validated original practice date** and lifetime totals
  (`mala_sessions` row, `get_japa_context()`'s beads/rounds aggregates).
- Award normal eligible karma **exactly once**, attributed to that date.
- **Do not** automatically rewrite previously finalized streaks or award
  historical streak bonuses.
- Same-spiritual-day confirmation (the overwhelming common case — network
  hiccup, retried within the same day) continues through the **existing,
  unmodified** streak calculation. Nothing below changes that path.
- A genuine cross-day recovery updates lifetime totals and karma, but
  leaves `daily_sadhana`/streak untouched for both the historical date and
  today. The client shows *"Practice recovered; earlier streak
  unchanged."* instead of the normal completion celebration.
- Never silently drop a completion the server can't confidently place on
  its original day — fall back to *today's date* (never rejection), same
  as the current behavior's date-attribution.
- That fallback splits into two genuinely different cases (REV 3): a
  request that never included a client timestamp at all gets **exactly
  today's normal, unmodified streak treatment** — this is not a
  regression to avoid, it is *required*, since it also covers every
  request from an app version that predates this feature and will keep
  making perfectly normal real-time completions for as long as that
  install exists. A request that *did* include a client timestamp but
  couldn't be trusted (bad data, expired window, unconfirmable date) gets
  the same streak-untouched treatment as a genuine cross-day recovery.
  Only two of the four states below may touch `daily_sadhana`/streak, and
  "no timestamp was sent" is deliberately one of them. (Rev 1/2 of this
  document got this point wrong in different ways; see "Classifying the
  completion" for the corrected four-state design.)
- Existing `mala_sessions` rows are backfilled as **unverified**, not
  confirmed — this design has no basis to certify that pre-existing
  historical data was validated (some of it may already be exactly the
  delayed-recovery-mis-dated case this document addresses), and
  `unverified` preserves their existing dates, karma, and streak effects
  exactly without inventing that certainty.
- Retroactive streak repair is explicitly out of scope — a separate,
  future, explicitly-designed feature.

## What the client must add

`persistJapaCompletion` (`app/(tabs)/japa.tsx`) already timestamps a
pending completion locally (`createdAt`, set once, before first send) but
never sends it — the server has zero client-time input today. The request
body gains two new fields, both captured **once, at the original
completion instant**, before the first send attempt, and persisted
verbatim in the durable queue's `requestBody` so every retry (automatic or
manual) replays the *same* values, never a freshly-computed one:

- `completedAtClient`: ISO 8601 instant (`new Date().toISOString()` —
  reuse the exact value already assigned to `createdAt`, don't compute a
  second one).
- `completedAtTimezone`: IANA timezone name active on the device at that
  instant (same source `nitya-karma`/Panchang already use for the user's
  local day boundary — confirm exact accessor at implementation time; must
  be the *device's* zone at completion time, not a later profile read,
  since a traveling user's profile timezone can change between completion
  and sync).

Both are optional from the server's point of view (a missing pair
classifies as `unverified` — see "Classifying the completion" below) —
native should still always send them going forward, but the contract
must not assume every request has them.

## What the server must add

`complete_japa_session` gains two new optional parameters:

```sql
p_completed_at_client timestamptz default null,
p_completed_at_timezone text default null
```

### Timestamp validation

A client clock cannot be trusted blindly (wrong device time, manipulated
clock, clock-skewed-into-the-future). Validate before trusting:

1. `p_completed_at_client` must not be in the future relative to `now()`
   beyond a small clock-skew allowance (proposed: 5 minutes, matching
   typical NTP drift tolerance elsewhere in this codebase — confirm
   against any existing constant before hardcoding a second one).
2. `p_completed_at_timezone` must be a real IANA zone: reuse the existing
   `exists (select 1 from pg_timezone_names where name = ...)` guard
   already used for `p.timezone` earlier in this same function, applied to
   the client-supplied zone instead.
3. `p_completed_at_client` must fall within the **permitted recovery
   window** (below).

Any validation failure does **not** reject the request. A timestamp that
was actually offered but fails one of these checks classifies as
`unknown_day` (see "Classifying the completion" below) — dated to
`v_today`, streak/`daily_sadhana` skipped. Validation is about deciding
*whether to trust the client value*, not about accepting or rejecting the
completion itself — a completion is never rejected for having a
suspicious timestamp, only re-attributed. (A request with *no* timestamp
at all is a different case — `unverified`, not a validation failure —
see "Classifying the completion.")

### Permitted recovery window

Proposed: **7 days**. If `p_completed_at_client` (once validated as not
future-dated) is within 7 days of `now()`, derive the practice day from it
instead of from `now()`:

```sql
v_client_today := ((p_completed_at_client at time zone p_completed_at_timezone) - interval '4 hours')::date;
```

(Same 4-hour day-boundary shift the existing `v_today` computation
already uses, applied to the client's instant/zone instead of the
server's.) Beyond 7 days, or if the timezone/timestamp fails validation:
fall back.

7 days is a starting proposal, not derived from an existing constant in
this codebase — flag for explicit confirmation before the migration ships,
since it directly bounds how much "recovered practice" a user can see
credited to a past day versus silently folded into today.

### Classifying the completion: four states, split on whether a timestamp exists at all

**REV 3.** Rev 2 fixed the vacuous date-comparison bug (see revision
history) but still routed every untrusted case through one `unknown_day`
bucket that skipped `daily_sadhana`/streak. That bucket silently included
"no timestamp was sent at all" — which is not one narrow legacy-queue
case, it is **every completion from an app version that predates this
feature**, for as long as that version remains installed. A native
rollout is never instant: some fraction of the install base can stay on
an older build for weeks, sometimes indefinitely. Every one of those
users' perfectly normal, real-time, same-day completions would have
silently stopped incrementing their streak, because the payload of "old
app making a live request" and "queued request from before the update,
now finally delivered" is **identical** — the server has no field to
tell them apart.

The fix: split "untrusted" into two states based on **whether a
timestamp was offered at all**, not just on whether it validated:

- **`unverified`** — no `p_completed_at_client`/`p_completed_at_timezone`
  in the request at all. Gets **exactly today's current, unmodified
  behavior**: normal `daily_sadhana` upsert, normal streak
  increment/freeze, dated to `v_today`. This is not a compromise or a
  known-remaining gap — it is required, specifically so that an
  old-app-version user's ordinary same-day practice keeps crediting their
  streak exactly as it does today, for as long as their install exists.
- **`unknown_day`** — a timestamp *was* offered (this is an updated,
  timestamp-capable client) but couldn't be trusted: invalid timezone
  name, outside the recovery window, or an unconfirmable
  today-or-later date (see below). Only reachable from an updated client
  reporting something anomalous about its own data — never from a
  rollout/versioning ambiguity — so this is the state that actually gets
  the streak-skip treatment.

```sql
if p_completed_at_client is null or p_completed_at_timezone is null then
  -- No timestamp offered: an app version that predates this feature
  -- (still making perfectly normal real-time completions), or a request
  -- replaying a durably-queued body captured before the client was
  -- updated. Indistinguishable from the payload alone -- must not guess
  -- "delayed," which would silently stop streak credit for every
  -- not-yet-updated install.
  v_recovery_status := 'unverified';
elsif not exists (select 1 from pg_timezone_names where name = p_completed_at_timezone) then
  -- An updated client sent a garbage timezone -- a genuine anomaly, not
  -- a rollout ambiguity, since only updated clients attempt this field.
  v_recovery_status := 'unknown_day';
elsif p_completed_at_client > now() + interval '5 minutes' then
  v_recovery_status := 'unknown_day';
elsif p_completed_at_client < now() - interval '7 days' then
  v_recovery_status := 'unknown_day';
else
  v_client_today := ((p_completed_at_client at time zone p_completed_at_timezone) - interval '4 hours')::date;
  if v_client_today = v_today then
    v_recovery_status := 'confirmed_same_day';
  elsif v_client_today < v_today then
    v_recovery_status := 'confirmed_cross_day';
  else
    -- v_client_today > v_today: reachable by ordinary clock skew crossing
    -- the 4 AM boundary (server now() at 03:58, client timestamp at
    -- 04:02 -- only 4 minutes apart, well inside the 5-minute skew
    -- allowance, but the shift lands them on different calendar dates),
    -- or by a client/profile timezone mismatch producing a different
    -- "today" for the same instant. Not confirmable as same-day or a
    -- genuine past day -- degrades to unknown_day, not an exception.
    v_recovery_status := 'unknown_day';
  end if;
end if;

v_touches_streak := v_recovery_status in ('confirmed_same_day', 'unverified');
v_attributed_date := case
  when v_recovery_status = 'confirmed_cross_day' then v_client_today
  else v_today
end;
```

The four states, and their treatment:

- **`confirmed_same_day`** — validated timestamp, lands on today. Existing
  code path, completely unchanged: normal `daily_sadhana` upsert, normal
  streak logic. The common case (99%+ of traffic once fully rolled out)
  and must not regress.
- **`unverified`** — no timestamp offered. **Also** takes the normal
  `daily_sadhana`/streak path, identically to `confirmed_same_day` —
  this is the fix for the rollout defect above. Differs from
  `confirmed_same_day` only in that the response is honest about not
  having confirmed anything (see "Response contract" below); the
  database write is identical.
- **`confirmed_cross_day`** — validated timestamp, lands strictly before
  today, within the trust window. New path: insert `mala_sessions` with
  `date = v_attributed_date`, `spiritual_date = v_attributed_date`
  (historical accuracy — `get_japa_context()`'s lifetime aggregates sum
  across all of `mala_sessions` unconditionally, so totals update
  correctly for free); award karma exactly once, same formula as today
  (`least(p_rounds * 5, 540)`), `earned_date = v_attributed_date`; **skip
  the `daily_sadhana` upsert entirely**, for both `v_attributed_date` and
  today — the literal mechanism behind "do not rewrite previously
  finalized streaks."
- **`unknown_day`** — timestamp offered but untrustworthy. Same
  streak-skip treatment as `confirmed_cross_day` (session/karma recorded,
  `daily_sadhana` untouched), but dated to `v_today` (the only date
  actually available) rather than a validated historical date.

Only `confirmed_same_day` and `unverified` may touch
`daily_sadhana`/streak. `confirmed_cross_day` and `unknown_day` never do,
regardless of what the recovery/skew/window constants are tuned to.

### Response contract: don't present an unconfirmed date as a known one

**REV 3.** Rev 2's response set `attributedDate: v_today` and
`recoveredAcrossDay: true` for `unknown_day` — presenting *today* as if
it were a confirmed practice date, and labeling a save "recovered" when
the server has no idea what day the practice actually happened, or
whether it was "recovered" from anything at all. Both fields overstate
what's actually known.

Fix: return the explicit classification, and only populate a practice
date when one was actually confirmed:

```sql
'recoveryStatus', v_recovery_status,
'attributedDate', case
  when v_recovery_status in ('confirmed_same_day', 'confirmed_cross_day') then v_attributed_date
  else null  -- unverified and unknown_day: no confirmed practice date to report
end,
'processedDate', v_today  -- always known: when the server actually handled this write
```

`recoveredAcrossDay` (the Rev 1/2 boolean) is dropped from the contract
entirely rather than kept as a derived convenience — the whole point of
this correction is that a single boolean can't honestly represent four
states. The client selects its copy directly from `recoveryStatus`:

| `recoveryStatus` | Client-visible behavior |
|---|---|
| `confirmed_same_day` | Normal completion celebration. No special copy. |
| `unverified` | Normal completion celebration. No special copy — this must look and feel identical to today's app, since nothing unusual is being claimed. |
| `confirmed_cross_day` | *"Practice recovered; earlier streak unchanged."* Shows `attributedDate`. |
| `unknown_day` | *"Practice recorded; original day could not be confirmed."* Does **not** show a date (there isn't a confirmed one) — may reference `processedDate` if the copy needs to say when it was recorded. |

### Idempotent replay reconstructs the original attribution

The existing idempotency check runs before any date computation,
unchanged by this design:

```sql
select id into v_existing_session_id
from public.mala_sessions
where user_id = v_user_id and client_completion_id = p_client_completion_id;
```

Rev 1 claimed this made replay "unaffected" — true for the *existing*
fields, but this design adds new response fields describing a specific
past completion's classification, not current state.
`get_japa_context()` (what the replay branch returns today) computes
**live, current** dashboard data — it has no memory of what a specific
historical session was attributed to. A replay must reconstruct the
ORIGINAL completion's classification, not recompute one from
`p_completed_at_client`-as-replayed (which could even be absent or
different on a manual retry) and not silently omit the new fields.

Fix: persist the classification on the row itself, and read it back on
replay. `mala_sessions` gains one new column — four states, backfilled to
`unverified` (REV 3; Rev 2 defaulted to `confirmed_same_day`, which is
exactly the "invented certainty" problem from the revision history):

```sql
alter table public.mala_sessions
  add column recovery_status text not null default 'unverified'
    check (recovery_status in ('confirmed_same_day', 'confirmed_cross_day', 'unknown_day', 'unverified'));
```

No new `attributed_date` column is needed — the existing `date` column
already stores exactly that value for every session (old and new alike);
what changes is only whether the *response* is willing to call it
confirmed. `processedDate` for a replay comes from the existing
`completed_at` column (already set to `now()` at original insert time —
no new column needed for this either):

```sql
select id, date, recovery_status, completed_at
  into v_existing_session_id, v_existing_date, v_existing_recovery_status, v_existing_completed_at
from public.mala_sessions
where user_id = v_user_id and client_completion_id = p_client_completion_id;

if v_existing_session_id is not null then
  v_context := public.get_japa_context();
  return v_context || jsonb_build_object(
    'success', true,
    'idempotentReplay', true,
    'sessionId', v_existing_session_id,
    'karmaPoints', v_karma_points,
    'karmaAwarded', 0,
    'recoveryStatus', v_existing_recovery_status,
    'attributedDate', case
      when v_existing_recovery_status in ('confirmed_same_day', 'confirmed_cross_day') then v_existing_date
      else null
    end,
    'processedDate', v_existing_completed_at::date
  );
end if;
```

A retry of an already-committed operation (manual Retry from the
failed-item review sheet, or an automatic resume racing a request that
actually landed) now returns the *original* classification exactly as
first written, regardless of what `p_completed_at_client` the retry
happens to carry — nothing about this design re-evaluates or re-awards
an already-committed completion. This must be an explicit test (see
below), not an assumption.

## Required test coverage before this ships

1. Same-day completion with a trusted, validated client timestamp landing
   on today (`confirmed_same_day`): behavior byte-for-byte identical to
   today's live function — normal `daily_sadhana` upsert, normal streak
   increment/freeze. `recoveryStatus: 'confirmed_same_day'`,
   `attributedDate` set, no `recoveredAcrossDay` field in the response at
   all (dropped from the contract).
2. **No timestamp fields sent at all (`unverified`) — the rollout-safety
   case.** Same-day, real-time semantics: normal `daily_sadhana` upsert,
   normal streak increment/freeze, **streak must actually increment**
   (not just "not decrement") when this is the day's first completion.
   This is the regression test for the versioning defect: an app version
   that predates this feature (or a request replaying a pre-update queued
   body) must keep crediting streaks exactly as today, indefinitely, for
   as long as that install exists. `attributedDate: null` in the
   response (not confirmed), even though the underlying row is dated
   `v_today`.
3. Cross-day recovery within the window (`confirmed_cross_day`):
   `mala_sessions`/karma dated to the original day; **today's streak AND
   the original day's `daily_sadhana` both unchanged** (assert both
   explicitly); `recoveryStatus: 'confirmed_cross_day'`, `attributedDate`
   set to the original day.
4. A validated, in-window client timestamp that fails to land on today
   (i.e. `unknown_day` reached via the classification's `else` branch,
   not via a missing timestamp): streak/`daily_sadhana` must NOT be
   touched, `attributedDate: null` in the response even though the
   underlying row is dated `v_today` (this is the specific "invented
   certainty" case — assert the response does NOT claim a confirmed date).
5. Client timestamp beyond the recovery window: classified `unknown_day`
   (not `unverified` — the timestamp was present, just untrustworthy),
   same streak-skip and `attributedDate: null` assertions as #4.
6. A client timestamp within the 5-minute skew allowance that crosses the
   4 AM boundary into a date *after* `v_today` (e.g. server `now()` at
   03:58, client timestamp at 04:02): classified `unknown_day` (not an
   exception, not `confirmed_cross_day`/`confirmed_same_day`), same
   streak-skip assertion.
7. A validated client timestamp and timezone that, compared against the
   *profile's* timezone for the same instant, disagree on which day it
   is: confirm which one governs `v_today` (the profile's, since that's
   what the rest of the function already uses) and that a resulting
   client-side "future" date is handled by test 6's same path, not a
   crash.
8. Invalid `completedAtTimezone` (not a real IANA name): classified
   `unknown_day` (timestamp was present, so this is NOT `unverified`),
   same streak-skip assertion.
9. Idempotent replay of an already-committed `confirmed_cross_day`
   completion: returns the *original* `recoveryStatus`/`attributedDate`
   read back from the stored row (not recomputed from
   `get_japa_context()` or from whatever `p_completed_at_client` the
   replay happens to carry), does not re-derive a new date, does not
   re-award karma.
10. Idempotent replay of an already-committed `unknown_day` completion:
    same assertions as #9 — `attributedDate: null` reconstructed
    (proves a replay doesn't retroactively invent a confirmed date
    either).
11. Idempotent replay of an already-committed `unverified` completion:
    `attributedDate: null` reconstructed, streak/karma not re-touched.
12. Idempotent replay of an already-committed `confirmed_same_day`
    completion: `attributedDate` set, reconstructed the same way (proves
    the reconstruction path doesn't treat every replay as unconfirmed
    either).
13. Manual Retry (from the failed-item review sheet) of a completion whose
    original attempt actually succeeded server-side already: resolves as
    idempotent replay (tests 9-12), not a new classification evaluation.
14. Pre-existing `mala_sessions` rows (written before this migration):
    `recovery_status` backfills to `'unverified'` (not
    `'confirmed_same_day'`), their existing `date`/karma/streak
    contribution is completely unchanged by the migration itself, and a
    replay of one of them (if ever retried) returns `attributedDate: null`
    — the migration must not retroactively certify data it never
    validated.

## Open questions to confirm before implementation

- Exact accessor for "device timezone at completion time" on native — an
  engineering investigation (find and reuse the existing Nitya
  Karma/Panchang day-boundary source), not a design decision to make here.
- 7-day recovery window and 5-minute clock-skew allowance are proposals,
  not confirmed constants — need explicit sign-off. Per review: these may
  ship as configurable initial limits, but neither may ever authorize
  moving historical practice into today's streak -- that guarantee comes
  from the recovery_status classification (only `confirmed_same_day` and
  `unverified` touch `daily_sadhana`/streak, and `unverified` exists
  specifically to protect not-yet-updated installs, never to launder an
  untrusted timestamp), not from the window/skew values themselves, and
  must hold regardless of what either is tuned to.
- Whether `recoveryStatus`/`attributedDate` need to also flow through
  `get_japa_context()` (for a cold app relaunch to know a *past* recovery
  happened) or are only meaningful on the completion response itself that
  triggered them — affects whether `daily_sadhana`-adjacent read paths
  need any change at all (current design says no).
- Whether `unverified` should eventually sunset (e.g. once telemetry shows
  pre-feature app versions have dropped below some threshold of live
  traffic, tightening it to `unknown_day`'s treatment) — explicitly a
  future decision, not part of this initial release; would need its own
  telemetry signal (e.g. counting `unverified` classifications server-side)
  to inform when it's safe.

**Resolved across revisions** (previously open, now designed for
explicitly): whether a future-relative-to-`v_today` attributed date can
occur (yes, via clock skew or timezone mismatch near the 4 AM boundary —
see "Classifying the completion"); whether idempotent replay needs new
handling for the fields this design adds (yes — see "Idempotent replay
reconstructs the original attribution"); whether "no timestamp" can be
safely treated the same as "confirmed untrustworthy" (no — see
"unverified" above, this was Rev 3's fix); whether backfilling existing
rows as confirmed is defensible (no — see "unverified" backfill, also
Rev 3).
