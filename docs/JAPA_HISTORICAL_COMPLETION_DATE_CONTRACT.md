# Japa historical-completion date contract — design (pre-migration)

Status: **design only, no migration written yet**. Per review: document
timestamp validation, timezone handling, the permitted recovery window,
and legacy queued entries before touching `complete_japa_session`.

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
  its original day — fall back to *today*, exactly like the current
  (unfixed) behavior, rather than rejecting the request. This is the
  documented fallback, not a workaround: today's date is the same "best
  available guess" the function already makes for every completion right
  now, so a distrusted client timestamp is no worse off than the status
  quo.
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

Exactly today's current, live behavior — `v_today` from server `now()`.
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

### Determining "same-day" vs "cross-day recovery"

Compute `v_attributed_date` as: `v_client_today` if the client timestamp
was trusted (validated and in-window), else `v_today` (today, the
existing fallback) — using the **already-computed** `v_today` for
comparison, not a second `now()` call, so a request cannot straddle a day
boundary between two internal computations.

- `v_attributed_date = v_today` → **same-spiritual-day**. Take the
  existing code path completely unchanged: normal `daily_sadhana`
  upsert, normal streak increment/freeze logic, normal
  `spiritual_date = v_today`. This is the common case and must not
  regress.
- `v_attributed_date < v_today` → **cross-day recovery**. New path:
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
    "do not rewrite previously finalized streaks": today's already-
    computed streak is untouched, and the historical date's
    `daily_sadhana` row (if one exists, already finalized as
    incomplete) is left exactly as it was. A user does not retroactively
    gain a streak day, and today's streak does not shift because of a
    recovered historical round.
  - `v_attributed_date > v_today` cannot occur (future timestamps are
    rejected by clock-skew validation before reaching this branch) —
    treat as an assertion / defensive `raise exception`, not a silent
    case.
  - Response gains `recoveredAcrossDay: true` and `attributedDate:
    v_attributed_date` so the client can show *"Practice recovered;
    earlier streak unchanged"* instead of the normal completion
    celebration. `recoveredAcrossDay: false` (or the field omitted) for
    the same-day path — no client-visible change there.

### Idempotent replay is unaffected

The existing check —

```sql
select id into v_existing_session_id
from public.mala_sessions
where user_id = v_user_id and client_completion_id = p_client_completion_id;

if v_existing_session_id is not null then
  return v_context || jsonb_build_object('success', true, 'idempotentReplay', true, ...);
end if;
```

— runs **before** any date computation, unchanged by this design. A
retry of an already-committed operation (manual Retry from the failed-
item review sheet, or an automatic resume racing a request that actually
landed) returns the original receipt exactly as it was first written,
regardless of what `p_completed_at_client` the retry happens to carry.
Nothing about this design re-evaluates or re-awards an already-committed
completion — this must be preserved verbatim as an explicit test, not
just an assumption.

## Required test coverage before this ships

1. Same-day completion (normal case): behavior byte-for-byte identical to
   today — this is the regression-risk case, since it's 99%+ of traffic.
2. Cross-day recovery within the window: `mala_sessions`/karma dated to
   the original day; today's streak and the original day's
   `daily_sadhana` both unchanged; response carries
   `recoveredAcrossDay: true` with the correct `attributedDate`.
3. Legacy entry (no `completedAtClient`/`completedAtTimezone` at all):
   falls back to today's date, identical to current live behavior — not
   an error.
4. Client timestamp beyond the recovery window: falls back to today,
   not rejected.
5. Future-dated client timestamp beyond skew allowance: falls back to
   today, not rejected, not trusted.
6. Invalid `completedAtTimezone` (not a real IANA name): falls back to
   today.
7. Idempotent replay of an already-committed cross-day-recovered
   completion: returns the original receipt (including its original
   `attributedDate`/`recoveredAcrossDay`), does not re-derive a new date,
   does not re-award karma.
8. Manual Retry (from the failed-item review sheet) of a completion whose
   original attempt actually succeeded server-side already: resolves as
   idempotent replay, not a new cross-day evaluation.

## Open questions to confirm before implementation

- Exact accessor for "device timezone at completion time" on native —
  confirm against the existing Nitya Karma/Panchang day-boundary source
  rather than introducing a second one.
- 7-day recovery window and 5-minute clock-skew allowance are proposals,
  not confirmed constants — need explicit sign-off.
- Whether `recoveredAcrossDay`/`attributedDate` need to also flow through
  `get_japa_context()` (for a cold app relaunch to know a *past* recovery
  happened) or are only meaningful on the completion response itself that
  triggered them — affects whether `daily_sadhana`-adjacent read paths
  need any change at all (current design says no).
