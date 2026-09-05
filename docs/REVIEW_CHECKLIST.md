# Review Checklist — the coverage contract

**Binding for every change to** `packages/panchang-engine`, `packages/panchanga-core`,
`packages/dharma-rules`, `src/lib/calendar/*`, or the `observance_*` tables.

Every item below exists because it was **actually missed**, by an implementer or a
reviewer, on this workstream. The citation on each line is the defect it would
have caught. This is not a generic quality checklist; do not add aspirational
items to it.

---

## 0. Why this file exists

Reviews on this workstream failed twice, in two different ways:

1. **Fabricated evidence.** Reports stated conclusions their own data contradicted
   — "8/8 tests green" on an 80-minute error (D23), "USNO golden fixtures" that
   were engine output (D23), "31 Ujjain corrections" from a harness that collapsed
   24 occurrences into one (D28), "the evaluator finds 15 Feb" when it returned
   `false` on every row (D26).
2. **Unasked questions.** The reviewer checked the change against *the prompt*
   rather than against *the domain*. The D15 uniqueness constraint was verified to
   admit two profiles and two sampradāyas — the two cases the prompt named — and
   nobody asked how many rows it must hold per definition per year. `ekadashi`
   needs 24.

§2 addresses the first failure. §3 addresses the second. They are different
failure modes and fixing one does nothing for the other.

---

## 1. Two passes, run separately

**Pass 1 — compliance.** Did the change do what the task asked?

**Pass 2 — coverage.** *What does the task description not mention that would
break this?*

Pass 1 alone is not a review. It is a closed loop: the prompt defines the test,
the test passes, nothing is learned. Pass 2 must be run deliberately, as a
separate act, against §3 below — not as a general feeling of thoroughness.

---

## 2. Evidence rules

- **Every number and every conclusion in a report must be printed by a committed
  script runnable with one command.** State the command beside each table.
  *(D23, D28)*
- **No hardcoded narrative.** A sentence that states a date, a time or a verdict
  must interpolate computed values. A conclusion that disagrees with the script's
  own output is the failure being guarded against — the script wins, and the
  disagreement gets reported. *(`scripts/adjudicate-conditions.ts:69` shipped a
  literal whose figures matched neither its own table nor its own reasoning
  strings.)*
- **A source is a citation, not a label.** `source: 'USNO Ephemeris'` beside a
  self-computed number is worse than `unsourced`, because it defeats later audit.
  Record the service and the exact query parameters. **LLM output is never a
  source** (`docs/CALENDAR_RULES_AND_VERIFICATION.md`; AGENTS.md). *(D23)*
- **Residual distributions are diagnostic.** Reference data compared against an
  imperfect engine scatters around zero in *both* directions. All-positive
  residuals inside one rounding interval mean the "reference" was derived from the
  engine. *(D23 — 13 of 13 positive.)*
- **"0.0 residual" and "all green" are red flags, not results.** Ask what the
  measurement could not have detected.

---

## 3. Coverage invariants

Applied to every change, regardless of what the task asked for.

### 3.1 Cardinality — *how many?*
- How many rows / instances / results must this hold, per key, per year?
- Which rules are **recurring** (many dates per year) versus annual?
  `ekadashi`, `pradosh-vrat`, `sankashti-chaturthi` and `karva-chauth` are single
  rules producing 12–24 dates a year. *(D15 miss)*
- Does any uniqueness constraint, map key, or `find()` silently collapse a
  collection to one element? *(D28 — `matchedDates[0]`)*

### 3.2 Detection capability — *can this test fail?*
- Write down the defect this test would **not** catch.
- Does the assertion compare two values that share the suspect code path? A
  difference between two wrong numbers is not a validation. *(D23 — topocentric
  vs geocentric in the same broken frame)*
- Is the assertion falsifiable at all? *(D23 — T7's `if/else` passed by
  construction)*
- Do the new tests actually run? Check the test-runner `include` globs. *(D27 —
  `src/conditions/__tests__` was excluded; the suite reported an unchanged
  988/216 before *and* after the code landed — a figure that was itself stale for
  days before anyone rechecked it; see the baseline note in §3.8)*

### 3.3 Both directions
- Verified it works. Verified it **stops** working when it should?
- Verified the happy path. Verified the guard rejects the bad input?

### 3.4 Detection versus behaviour
- The astronomy *detects* the condition — do the **rules know what to do** about
  it? Detecting an adhika māsa is not the same as knowing that most festivals are
  not observed in one. *(missed in the tracker comparison)*
- A diagnostic flag is not a policy. `latitude_proxy` was emitted for two weeks
  before anything recomputed at the proxy latitude. *(D21)*

### 3.5 Degenerate and boundary inputs
- Null / absent result (a civil date may legitimately contain **no** moonrise)
- Polar and high latitude; `latitude_proxy`; `compressed_night` (N < 4 h)
- DST transition **days** — 23 h and 25 h civil days, not just offset lookups
- Year boundary — a date computed for year *N* that lands in *N±1* for a user
  east or west of the reference
- International date line
- A boundary falling **inside the tolerance** (§1.2 budgets ≤ 60 s; a tithi
  boundary within 60 s of sunrise has undefined ownership — that is `[S]`, not an
  engineering call)
- Adhika māsa, kṣaya māsa, vṛddhi tithi (spanning two sunrises), kṣaya tithi
  (touching none)

### 3.6 Units, frames and pairs
- Coordinates and timezone must always travel as **one unit**. *(D25 —
  `PathshalaClient` paired real coordinates with hardcoded IST;
  `evaluator.ts:312` concatenated a local date with a UTC time)*
- What frame is this in? Ecliptic and equatorial are not interchangeable, and an
  alias accessor will not tell you. *(D18 — `pos.lon === pos.ra`, exactly)*
- What unit does this library expect? *(D19 — `parallax()` given a Julian Day
  where it wanted kilometres)*

### 3.7 Compensation
- Does this work around a known defect rather than fix it? A compensation that
  ships becomes load-bearing and the next fix breaks it. *(D2 — the 118 rules
  were calibrated around D1)*
- Conversely: before deleting something that looks like a hack, establish whether
  it also encodes real semantics. `allow_skipped_tithi` is both a D1 compensation
  **and** the only kṣaya-tithi handling in the codebase.

### 3.7b Is the evidence reproducible?
- Every number in a report must come from a **committed one-command script**.
  *(A "19/19 shadow checks pass" once lived only as prose here, with the scripts
  in a temp directory — unreproducible by anyone, including its author the next
  day. A number nobody can regenerate is a claim, not evidence.)*
- `npm run verify:materialisation-shadow` builds a shadow database, applies the
  migration, runs every check, verifies the rollback and drops it.

### 3.8 Scope honesty
- List **every** file touched, including any outside the stated scope. Three
  consecutive tasks changed files they did not report.
- Did anything switch live that was supposed to be shadow-only? The snapshot
  tripwire must stay **574 passed / 666 skipped (1240)** for any change that is
  not intended to move a date.

  > **Baseline updated 2026-08-11**, from the long-quoted 988/216. That number
  > went stale when the launch-set deferral and the disputed-year withholding
  > moved snapshots to skipped, and it sat wrong in five documents until a review
  > caught it. The drift is fully accountable, with no regression:
  >
  > `988 − 450 newly-skipped + 36 new tests = 574`, exactly.
  >
  > **When you change this number, show the arithmetic.** A tripwire whose
  > expected value is folklore cannot trip: nobody can tell a real regression
  > from another quiet drift. If your change moves it, the reconciliation belongs
  > in the commit message.

### 3.9 Cross-engine consistency
- **When two components can answer the same question, something must assert they
  agree.** Three engines gave three different dates for Maha Shivaratri 2026 —
  stored DB `2026-02-17`, masa-corrected rule engine `2026-02-16`, condition
  evaluator `2026-02-15` — and nothing in the repo compared them. The
  disagreement surfaced only because a human read two reports side by side.
  `npm run reconcile:engines` now exists; keep it green or keep it explained.
- **A report must never contradict its own generated data.** Twice a script
  produced a correct table and then asserted something different in a
  hand-written sentence: `scripts/adjudicate-conditions.ts:69` claimed a Nishita
  window matching neither its own column nor its own reasoning string;
  `scripts/reconcile-engines.ts:241` stated a Karva Chauth date its own table
  contradicted. If a sentence states a date, a time or a verdict, it must be
  interpolated from the same data as the table above it.
- **This applies to commit messages too.** Commits `2780330` and `f9e5419` list
  as "known open" four findings that were already fixed in the content those
  same commits contain — staged from an earlier review without re-reading the
  files at commit time. Re-verify at the moment of commit, not from memory of
  the review.
- **When a metric improves, check whether the situation improved.** Sankaṣṭī
  went from "~10 of 12 months disagree" to "0 disagreements" only because a
  third state absorbed them — 26 of 26 comparisons are now UNRESOLVED. The
  number got cleaner; nothing got settled.

---

## 4. Known closed loops

Structural blind spots. Do not cite these as evidence of correctness.

| Mechanism | Cannot detect |
|---|---|
| `verify:harness` (574/666) | Anything outside `harness/**`. It is a date-movement tripwire, not a correctness check. **Also blind to anything it SKIPS** — 666 of 1240 are skipped, so more than half the fixtures assert nothing on any given run. |
| Snapshot fixtures | Correctness. All 18 location/profile combinations currently return identical dates (no profile support, D3/D5). They prove *no unintended change*, nothing more. |
| `integrity.ts` audit | A wrong rule — it compares the engine against itself. *(D11)* |
| Invariant tests | Errors shared by both sides of the comparison. *(D23)* |
| Golden fixtures without a real citation | Anything. They are snapshots wearing golden clothes. *(D23, open)* |

---

## 5. Sign-off

A review states, explicitly:

1. The command that reproduces each figure.
2. For each §3 heading: checked and clear, or checked and here is the finding, or
   **not applicable because —**.
3. What this change's tests would **not** catch.

"Not applicable" is a fine answer. Silence is not.
