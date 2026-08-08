# Next batch — prompts

Both prompts are binding on `docs/REVIEW_CHECKLIST.md` and `AGENTS.md` rules 1–15.

**Evidence rule (§2), restated because it has been broken five times:** every number you
report must be printed by a committed script that I can run with one command. Do not
report a number you typed by hand. Do not label engine output as an external source.
If you compare a thing to itself, say so — that is not a residual.

**Do not touch `src/lib/panchang.ts`.** It is on the `verify:harness` import path (§7 X8).
Not "avoid putting canonical code there" — do not edit the file at all.

**Guards, before and after every commit:**
- `npm run verify:harness` → **988 passed / 216 skipped**
- `npx vitest run --root packages/panchang-engine` → **63 passed**
- `npx tsc --noEmit` → clean

Movement in any of these is a **STOP**, not a snapshot to regenerate.

---

## Task 1 — Make the two engine gates mean what they claim

### Why this exists

`docs/CALENDAR_ENGINE_ASSESSMENT.md` lists "flip `USE_CORRECTED_MASA`" and "flip
`USE_CONDITION_EVALUATOR`" as two independent switches awaiting approval. Neither
statement is true, and the gap was found by grepping for reads rather than trusting
the tracker:

1. **`USE_CORRECTED_MASA` is read by nothing.** `grep -rn USE_CORRECTED_MASA` returns
   only its own definition (`src/lib/calendar/engine.ts:34`) and comments. Setting it
   `true` changes no behaviour whatsoever. The doc comment claims it swaps
   `precomputePanchangForYear` → `precomputePanchangCorrectedForYear` and repoints
   rules at `corrected_lunar_masa_name`. **That wiring does not exist.**

2. **`USE_CONDITION_EVALUATOR` silently carries the masa change with it.**
   `materialize.ts:507` branches on it into `calculateOccurrencesWithEvaluator`, and
   that function calls `calculateObservancesForYearCorrected` at line 302
   **unconditionally**. So turning on the evaluator also turns on corrected masa. Two
   changes documented as separable, delivered as one.

3. **The client read path is already mixed.**
   `src/lib/calendar/observance-formatter.ts:81` calls
   `calculateObservancesForYearCorrected` unconditionally and assigns it to a variable
   named `legacyDate` (line 153). So the fallback date shown for an unresolved
   observance comes from the *corrected* path while materialisation published the
   *legacy* one. Same festival, two engines, one response.

### What the flip actually costs — already measured

`npx tsx scripts/diff-masa-correction.ts` → `docs/MASA_CORRECTION_DIFF_REPORT.md`:

| Year | Legacy | Corrected | Shifted | Removed | Max shift |
|---|---|---|---|---|---|
| 2026 | 180 | 174 | **69** | 6 | 59 days |
| 2027 | 179 | 180 | 38 | 1 | 30 days |
| 2028 | 181 | 179 | 14 | 2 | 30 days |

2026 average absolute shift is **29.7 days**. `shani-jayanti` and
`vat-savitri-amavasya` both move **16 May → 14 Jul**. Six observances vanish, including
`shravan-somvar`. This is a re-dating of roughly 40% of the 2026 calendar — not a
config change.

Of the 69 shifted rows, **53 are `NEEDS_MUHURTA_EVAL`** — masa correction moves them but
the final date can only be set by the condition evaluator. That is the actual coupling:
the masa flip is not meaningful on its own.

### Scope — wiring and honesty only. Change no dates.

**Do not flip either gate to `true` in this task.** The end state is that flipping them
becomes a real, reviewable decision. Right now it is not one.

**A.** Make `USE_CORRECTED_MASA` load-bearing. Whatever selects between
`precomputePanchangForYear` and `precomputePanchangCorrectedForYear`, and between the
legacy and corrected rule fields, must branch on this constant. With it `false`,
output must be **byte-identical to today**. Prove that: a script that runs both paths
with the flag `false` and prints the count of differing (slug, date) pairs. Expected `0`.

**B.** Decouple the evaluator from the masa correction. `calculateOccurrencesWithEvaluator`
must take its baseline from whichever path `USE_CORRECTED_MASA` selects, not from
`calculateObservancesForYearCorrected` hardcoded. After this, the four combinations
(off/off, on/off, off/on, on/on) must each be reachable and distinct. Print a 4-row
table of occurrence counts per combination — if two rows are identical, a gate is still
dead and you must say which.

**C.** Fix the formatter. `observance-formatter.ts:81` must use the same path the
published occurrences came from. If a genuine legacy fallback is wanted, it must call
the legacy function and keep the name `legacyDate`; if the corrected one is wanted,
rename the variable. Mismatched name and source is not acceptable either way.

**D.** Correct the tracker. The rows saying these are two independent approved-pending
flips are wrong. Replace with what is actually true, and state plainly that the earlier
text was inaccurate — do not silently overwrite it. Record the 69/38/14 table.

### Explicitly out of scope

Flipping either gate; re-materialisation; re-sourcing golden fixtures; touching
`masaName` behaviour (that is 3.7, and it stays frozen).

### Report

State for each of A–D: what changed, the command that proves it, its output. Then the
three guards. Then, per REVIEW_CHECKLIST §5, for each §3 heading: clear / finding /
not-applicable-because. **Silence is not an answer.** In particular §3 "detection
capability" — a gate nothing reads is exactly the defect that produced this task, so
demonstrate each gate is now readable *and read*.

---

## Task 2 — Review the 5.7 observance UI copy, especially location-conditional wording

### Why this exists

5.7 shipped the UI copy for the four-way classification —
`[1]` DISPUTE / `[2]` UNCERTAINTY / `[3]` ERROR / `[4]` LOCATION EFFECT — and has not
been independently reviewed. The risk is specific and known: **we already got this
wrong once in prose.** A report claimed Janmāṣṭamī 2026 was a Smārta-vs-Vaiṣṇava
dispute (3 Sep vs 4 Sep). It is not. At Ujjain both traditions land on **4 September**;
the 3 September date is Bedford-only. It is a **location** effect wearing a tradition
label, and the same report's own §1 table said so.

A sweep then found this is the common case, not the exception: of six rules producing
differing dates, **five differ by location alone** (`karva-chauth`, `pradosh-vrat`,
`diwali`, `sankashti-chaturthi`, `dhanteras`). Only Janmāṣṭamī varies by tradition, and
only at some locations.

So the copy must never let a location effect read as a tradition disagreement. Telling a
user two sampradāyas disagree, when the truth is their own longitude moved a sunrise, is
a religious claim we have invented.

### Scope — review only. Change nothing yet.

Read every user-visible string in the 5.7 path and answer:

1. **Does any `[4]` LOCATION string mention a tradition, sampradāya, or lineage?** It
   must not. Quote each string and its file:line.
2. **Does any `[1]` DISPUTE string appear for a rule whose only variation is
   locational?** Run the classification over 2026–2028 and print, per slug, which of
   the four buckets it lands in and why. A slug in `[1]` with one cited variant is a
   defect — `[1]` requires cited *and* distinct traditions.
3. **Is `[2]` UNCERTAINTY distinguishable from `[3]` ERROR to a reader?** These mean
   very different things (we don't know yet vs we got it wrong). If the copy blurs
   them, say so and quote both.
4. **Does the primary-variant wording ever imply another tradition is wrong?**
   AGENTS.md rule 7 — mark the user's as primary, never imply another is mistaken.
5. **Does anything display a variant without `versions`, `reasons`, `profile` and
   `location`?** Rule 6 forbids it.

### Report

A table: string, file:line, bucket, verdict (correct / misleading / defect), and for
anything not "correct", the precise reason. Then a recommendation — but **do not edit
the copy in this task.** I want the findings first. Then REVIEW_CHECKLIST §5 sign-off.
