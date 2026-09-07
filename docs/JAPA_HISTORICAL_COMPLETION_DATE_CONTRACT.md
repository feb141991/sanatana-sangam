# Japa historical-completion date contract — design (pre-migration)

Status: **design only, no migration written yet**. Per review: document
timestamp validation, timezone handling, the permitted recovery window,
and legacy queued entries before touching `complete_japa_session`.

**Revision note:** a second review pass found three defects in the first
draft of this document, all now corrected below (search "CORRECTED" for
the exact spots): (1) the fallback path derived its date as `v_today` and
then compared that date to `v_today` to decide streak eligibility — which
is always true by construction, so every fallback case silently qualified
for the same-day streak-touching path, reproducing the exact bug this
design exists to fix. (2) "a future attributed date cannot occur" was
asserted as an invariant and would have `raise exception`ed in production
-- it is reachable via ordinary clock skew crossing the 4 AM boundary, or
via a client/profile timezone mismatch, with no malicious or broken
client required. (3) "idempotent replay is unaffected" was true of the
*existing* replay branch but did not account for the *new* response
fields this design adds (`recoveredAcrossDay`/`attributedDate`) --
`get_japa_context()` returns live current state, not what a specific past
completion was attributed to, so a naive replay would have needed to
either omit those fields or recompute wrong ones.

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
  as the current behavior's date-attribution. Critically, this fallback
  gets the **same streak-untouched treatment as a genuine cross-day
  recovery**, not the normal same-day path — only an actually validated,
  confirmed-same-day timestamp may touch `daily_sadhana`/streak. (An
  earlier draft of this document got this specific point wrong; see the
  design doc's "Classifying the completion" section for the corrected
  three-state design.)
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

Both are optional from the server's point of view (see Legacy entries,
below) — native should still always send them going forward, but the
contract must not assume every request has them.

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

Any validation failure does **not** reject the request — it falls back to
the server-derived `now()`-based date exactly as today (see Fallback,
below). Validation is about deciding *whether to trust the client value*,
not about accepting or rejecting the completion itself — a completion is
never rejected for having a suspicious timestamp, only re-attributed.

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

### Fallback (no trusted client timestamp)

Classified as `unknown_day` (see below) — attributed to `v_today` from
server `now()`, same date-attribution as today's current live behavior,
but **not** the same streak handling: `unknown_day` skips
`daily_sadhana`/streak entirely, which current live behavior does not.
That's the actual fix -- see "Classifying the completion" below for why.
Covers three cases identically, by design, so there is exactly one
fallback code path rather than three ad hoc ones:

- **Legacy queued entries**: a completion durably queued by an app version
  older than this change has a `requestBody` with no
  `completedAtClient`/`completedAtTimezone` fields at all. `jsonb -> 'foo'`
  (or the request parser's equivalent) yields `null`, which flows straight
  into "no trusted client timestamp" — no separate migration-version
  branch needed in the function itself.
- **Failed validation** (future-dated beyond skew allowance, invalid
  timezone name).
- **Outside the recovery window** (older than 7 days).

### Classifying the completion: three states, not a date comparison

**CORRECTED.** The first draft derived `v_attributed_date` (client date if
trusted, else `v_today`) and then compared `v_attributed_date = v_today`
to decide whether the streak-touching path applied. That comparison is
vacuous for every fallback case: the fallback *is* `v_today` by
definition, so `v_attributed_date = v_today` is always true whenever the
client timestamp wasn't trusted at all — meaning a legacy entry, an
invalid timezone, or a stale (out-of-window) completion would all have
silently taken the normal-streak path, exactly reproducing the bug this
document exists to fix (a late-arriving completion crediting a day the
user didn't actually practice on).

The fix: classify into an explicit `v_recovery_status`, computed from
**whether the client timestamp was actually trusted**, never from
comparing derived dates. Only one of the three states is allowed to touch
`daily_sadhana`/streaks at all:

```sql
if p_completed_at_client is not null
   and p_completed_at_timezone is not null
   and exists (select 1 from pg_timezone_names where name = p_completed_at_timezone)
   and p_completed_at_client <= now() + interval '5 minutes'
   and p_completed_at_client >= now() - interval '7 days'
then
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
    -- "today" for the same instant. This is NOT a validation failure to
    -- reject or an invariant to assert -- it is simply not confirmable
    -- as either same-day or a genuine past day, so it degrades to the
    -- same treatment as any other untrusted timestamp.
    v_recovery_status := 'unknown_day';
  end if;
else
  v_recovery_status := 'unknown_day';
end if;

v_attributed_date := case
  when v_recovery_status = 'confirmed_cross_day' then v_client_today
  else v_today  -- confirmed_same_day, and unknown_day's best-available guess
end;
```

- **`confirmed_same_day`** — the client timestamp was validated and lands
  on today. Take the existing code path completely unchanged: normal
  `daily_sadhana` upsert, normal streak increment/freeze logic, normal
  `spiritual_date = v_today`. This is the common case (99%+ of traffic)
  and must not regress.
- **`confirmed_cross_day`** — the client timestamp was validated and
  lands strictly before today, within the trust window. New path:
  - Insert `mala_sessions` with `date = v_attributed_date`,
    `spiritual_date = v_attributed_date` (historical accuracy — this
    session genuinely happened that day, and `get_japa_context()`'s
    lifetime aggregates already sum across all of `mala_sessions`
    unconditionally, so totals update correctly for free).
  - Award karma exactly once, same formula as today
    (`least(p_rounds * 5, 540)`), same `karma_ledger` insert, with
    `earned_date = v_attributed_date` — karma here has never been
    streak-shaped (it's a pure function of `p_rounds`), so "normal
    eligible karma" requires no new formula.
  - **Skip the `daily_sadhana` upsert entirely** — for both
    `v_attributed_date` and today. This is the literal mechanism behind
    "do not rewrite previously finalized streaks."
- **`unknown_day`** — no trusted client timestamp at all (legacy entry,
  failed validation, outside the window) **or** a client timestamp that
  computed to today-or-later without being confirmably same-day (the
  future-relative-to-`v_today` case above). Treated **identically to
  `confirmed_cross_day` for streak purposes** — this is the actual fix
  for the reported bug: session and karma are recorded (attributed to
  `v_today`, the best available guess, same as today's live behavior),
  but `daily_sadhana`/streak are **skipped**, exactly like a confirmed
  cross-day recovery. The only difference from `confirmed_cross_day` is
  which date the session lands on (today's best guess, vs. a validated
  historical date) — never whether the streak is touched.
- Response gains `recoveredAcrossDay: v_recovery_status <> 'confirmed_same_day'`
  and `attributedDate: v_attributed_date`, so the client shows *"Practice
  recovered; earlier streak unchanged"* for both `confirmed_cross_day` and
  `unknown_day` — both are honestly "we couldn't confirm this happened
  today," and the copy should say so identically. `recoveredAcrossDay:
  false` only for the confirmed-same-day path — no client-visible change
  there.

### Idempotent replay reconstructs the original attribution

**CORRECTED.** The existing idempotency check runs before any date
computation, unchanged by this design:

```sql
select id into v_existing_session_id
from public.mala_sessions
where user_id = v_user_id and client_completion_id = p_client_completion_id;
```

The first draft claimed this made replay "unaffected" — true for the
*existing* fields, but this design adds two *new* response fields
(`recoveredAcrossDay`, `attributedDate`) that describe a specific past
completion's attribution, not current state. `get_japa_context()` (what
the replay branch returns today) computes **live, current** dashboard
data — today's streak, today's `japaDone`, current lifetime totals — it
has no memory of what a specific historical session was attributed to. A
replay must reconstruct the ORIGINAL completion's classification, not
recompute a new one from `p_completed_at_client`-as-replayed (which could
even be absent or different on a manual retry) and not silently omit the
new fields on a replay.

Fix: persist the classification on the row itself, and read it back on
replay instead of recomputing anything. `mala_sessions` gains one new
column:

```sql
alter table public.mala_sessions
  add column recovery_status text not null default 'confirmed_same_day'
    check (recovery_status in ('confirmed_same_day', 'confirmed_cross_day', 'unknown_day'));
```

(Default `'confirmed_same_day'` backfills every pre-existing row
correctly — they all predate this feature and were, by definition, normal
same-day completions. No `attributed_date` column is needed: the
existing `date` column already stores exactly that value for every
session, old and new, since a normal same-day session's `date` already
equals `v_today` today.)

The replay branch becomes:

```sql
select id, date, recovery_status
  into v_existing_session_id, v_existing_date, v_existing_recovery_status
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
    'recoveredAcrossDay', v_existing_recovery_status <> 'confirmed_same_day',
    'attributedDate', v_existing_date
  );
end if;
```

A retry of an already-committed operation (manual Retry from the failed-
item review sheet, or an automatic resume racing a request that actually
landed) now returns the *original* `recoveredAcrossDay`/`attributedDate`
exactly as first written, regardless of what `p_completed_at_client` the
retry happens to carry — nothing about this design re-evaluates or
re-awards an already-committed completion. This must be an explicit test
(see below), not an assumption.

## Required test coverage before this ships

1. Same-day completion with a trusted, validated client timestamp landing
   on today (`confirmed_same_day`): behavior byte-for-byte identical to
   today's live function — normal `daily_sadhana` upsert, normal streak
   increment/freeze — this is the regression-risk case, since it's 99%+
   of traffic. `recoveredAcrossDay: false`.
2. Cross-day recovery within the window (`confirmed_cross_day`):
   `mala_sessions`/karma dated to the original day; **today's streak AND
   the original day's `daily_sadhana` both unchanged** (assert both
   explicitly, not just one); response carries `recoveredAcrossDay: true`
   with the correct `attributedDate`.
3. Legacy entry (no `completedAtClient`/`completedAtTimezone` at all):
   classified `unknown_day`, attributed to today's date (matching current
   live behavior for the date), **but streak/`daily_sadhana` must NOT be
   touched** — this is the specific case the first draft got wrong
   (it would have taken the same-day path since its fallback date always
   equaled `v_today` by construction). Assert the streak is unchanged
   before and after this call, not just that the call succeeds.
4. Client timestamp beyond the recovery window: classified `unknown_day`,
   same streak-skip assertion as #3, not rejected.
5. A client timestamp within the 5-minute skew allowance that crosses the
   4 AM boundary into a date *after* `v_today` (e.g. server `now()` at
   03:58, client timestamp at 04:02): classified `unknown_day` (not an
   exception, not treated as `confirmed_cross_day` or `confirmed_same_day`),
   same streak-skip assertion. This is the concrete reproduction of the
   "future attributed date" case the first draft asserted couldn't happen.
6. A validated client timestamp and timezone that, compared against the
   *profile's* timezone for the same instant, disagree on which
   day it is: confirm which one governs `v_today` (the profile's, since
   that's what the rest of the function already uses) and that a resulting
   client-side "future" date is handled by test 5's same path, not a
   crash.
7. Invalid `completedAtTimezone` (not a real IANA name): classified
   `unknown_day`, same streak-skip assertion.
8. Idempotent replay of an already-committed `confirmed_cross_day`
   completion: returns the *original* `recoveredAcrossDay: true` and
   `attributedDate` read back from the stored row (not recomputed from
   `get_japa_context()` or from whatever `p_completed_at_client` the
   replay happens to carry), does not re-derive a new date, does not
   re-award karma.
9. Idempotent replay of an already-committed `unknown_day` completion:
   same assertions as #8 — `recoveredAcrossDay: true` reconstructed from
   the stored `recovery_status`, not re-derived.
10. Idempotent replay of an already-committed `confirmed_same_day`
    completion: `recoveredAcrossDay: false`, reconstructed the same way
    (proves the reconstruction path doesn't accidentally mark every
    replay as recovered).
11. Manual Retry (from the failed-item review sheet) of a completion whose
    original attempt actually succeeded server-side already: resolves as
    idempotent replay (tests 8-10), not a new classification evaluation.
12. Pre-existing `mala_sessions` rows (written before this migration):
    `recovery_status` backfills to `'confirmed_same_day'` and a replay of
    one of them (if ever retried) returns `recoveredAcrossDay: false`
    correctly.

## Open questions to confirm before implementation

- Exact accessor for "device timezone at completion time" on native — an
  engineering investigation (find and reuse the existing Nitya
  Karma/Panchang day-boundary source), not a design decision to make here.
- 7-day recovery window and 5-minute clock-skew allowance are proposals,
  not confirmed constants — need explicit sign-off. Per review: these may
  ship as configurable initial limits, but neither may ever authorize
  moving historical practice into today's streak -- that guarantee comes
  from the recovery_status classification above (only `confirmed_same_day`
  touches `daily_sadhana`/streak, and that requires actual validated
  confirmation, never a fallback), not from the window/skew values
  themselves, and must hold regardless of what either is tuned to.
- Whether `recoveredAcrossDay`/`attributedDate` need to also flow through
  `get_japa_context()` (for a cold app relaunch to know a *past* recovery
  happened) or are only meaningful on the completion response itself that
  triggered them — affects whether `daily_sadhana`-adjacent read paths
  need any change at all (current design says no).

**Resolved by this revision** (previously open, now designed for
explicitly): whether a future-relative-to-`v_today` attributed date can
occur (yes, via clock skew or timezone mismatch near the 4 AM boundary —
see "Classifying the completion") and whether idempotent replay needs new
handling for the fields this design adds (yes — see "Idempotent replay
reconstructs the original attribution").
