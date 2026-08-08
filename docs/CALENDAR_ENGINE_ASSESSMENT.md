# Calendar Engine — Assessment & Progress Tracker

**Baseline taken:** 2026-07-30
**Assessed against:** the Shoonaya Dharma Calendar product specification
(universal astronomical engine + customisable traditional rule sets)
**Companion specs:** `calendar-domain-model.md` · `astronomy-conventions.md` ·
`calendar-profiles.md` · `festival-rule-schema.md` · `calculation-examples.md` ·
`source-governance.md`

> **How to use this document.** §3 is the live tracker — update `Status` and
> `Evidence` as work lands. §2 is a frozen baseline: **do not edit it.** It is the
> "before" picture we compare against when the work is done.

---

## 1. Verdict

The foundation is **materially stronger than a typical calendar app** — real
ephemeris-backed astronomy, a genuine rule-family engine, and review/provenance
columns already in the schema. It is not a prototype.

But there is one structural gap at the centre of everything the specification
cares about:

> **The engine produces one date per festival, computed at Ujjain, for every user
> on Earth — with no Amānta/Pūrṇimānta distinction, no regional profile, and no
> sampradāya variant.**

That is precisely the anti-pattern the product spec names as wrong ("do not promise
one universal date"). Layer A largely exists. **Layer B is effectively absent.
Layer C exists but evaluates the wrong thing** (one synthetic instant per day, not
real local sunrise or any muhurta window).

Fixing this is **extension, not rewrite** — but it is not small, and two of the
defects are load-bearing (D1/D2 below) and must be fixed together.

---

## 2. Baseline snapshot — FROZEN, do not edit

### 2.1 Quantitative

| Measure | Value at baseline |
|---|---|
| `observance_definitions` rows | 87 |
| `observance_occurrences` rows | 557 |
| — audit `not_run` / `verified` | 383 / 173 |
| Canonical rules in code | 118 (`src/lib/calendar/rules.ts`) |
| Rule families implemented | 7 |
| Occurrences hand-frozen (`locked_for_regeneration`) | ~116 |
| Calendar profiles supported | **0** |
| Tradition/sampradāya variants | **0** (1 near-miss: Vat Savitri as two definitions) |
| Locations festivals are computed for | **1** (Ujjain) |
| Muhurta-window conditions available | **0** |
| Calendar/festival test files | **0** |
| Golden fixtures | **0** |
| External-source automated validation | **none** |
| Panchāṅga engine LOC | 923 |

> **Erratum / Current-State Note (2026-07-30):**
> - Direct import of `CANONICAL_RULES` from `src/lib/calendar/rules.ts` currently yields **79 canonical rule objects** in code.
> - The `observance_definitions` table in Supabase contains **87 definition rows** (a separate denominator representing database entities, some of which map to shared rules or historical seeds).
> - Do not merge or silently rewrite these distinct counts.

### 2.2 What exists and works

| Capability | Evidence |
|---|---|
| Real solar/lunar longitude from ephemeris (`astronomia`, MIT) | `packages/panchang-engine/src/index.ts:166-186` |
| Nutation + apparent longitude | `index.ts:169-172` |
| Sidereal conversion via Lahiri ayanāṁśa | `index.ts:161-164` |
| Tithi / nakshatra / yoga / karana from true angular separation | `index.ts:376-382` |
| **Boundary solving by bisection** (not midnight-floored) | `index.ts:306-345` |
| Real sunrise/sunset solver + NOAA fallback | `index.ts:261-288` |
| Upper-limb-with-refraction convention (90.833°) — **correct** | `index.ts:239` |
| IANA timezone + DST-aware offset derivation | `index.ts:116-137` |
| Generic rule-family engine (7 handlers, data-driven within family) | `src/lib/calendar/engine.ts:78-331` |
| Two-pass resolution for relative-to-other-observance rules | `engine.ts:285-331` |
| Rule-engine versioning | `engine.ts:9` (`RULE_ENGINE_VERSION`) |
| Curated-override + lock mechanism (council can beat the engine) | `materialize.ts:58-61, 217-225` |
| Provenance / review / verification columns already in schema | `observance_occurrences` |
| Integrity cron detecting rule drift | `src/lib/calendar/integrity.ts:88-153` |
| Honest trust-metadata scaffolding | `index.ts:36-40` (`PANCHANG_TRUST_META`) |
| Swiss-Ephemeris licence guard | `index.ts:913` |

### 2.3 Defects found at baseline

| # | Defect | Location | Sev |
|---|---|---|---|
| **D1** | **Lunar month name derived from the Sun's rāśi, not lunar-month boundaries.** ~2 months behind the traditional name — and the offset is **not constant**, because the label changes on Sankranti days instead of amāvāsyā/pūrṇimā days. **User-visible today** on the Panchāṅga screen. | `panchang-engine/src/index.ts:427-428` | **High** |
| **D2** | **The 118 rules were calibrated around D1** rather than D1 being fixed. Fixing D1 alone breaks every lunar festival. Must ship atomically with a rule migration + full date diff. | `src/lib/calendar/rules.ts:47-58` | **High** |
| **D3** | No Amānta/Pūrṇimānta distinction anywhere. Layer B absent. | engine-wide | **High** |
| **D4** | Rules evaluated at one synthetic instant/day (`1am UTC ≈ Ujjain sunrise`). No Nishita / Pradosha / Madhyāhna / Aparāhna / moonrise conditions exist. | `engine.ts:52-66` | **High** |
| **D5** | Every occurrence computed at Ujjain and served to all users. Diaspora users get Indian timings. | `engine.ts:4-6, 60` | **Partially Resolved** (Prerequisite done in `ProfileClient.tsx`) |
| **D6** | Brahma Muhurta hardcoded to sunrise −96/−48 min; correct only for a 12-hour night. In Bedford in June the true window is ≈ −56/−28 min. | `panchang-engine/src/index.ts:398` | **Resolved** |
| **D7** | Ayanāṁśa is a local polynomial fit, not the Lahiri definition; no stated valid range. | `panchang-engine/src/core/astronomy.ts` | **Resolved** |
| **D8** | Vikram Samvat rolls over on a hardcoded 1 April ("±14 days" per its own comment). | `panchang-engine/src/index.ts:431-434` | Low |
| **D9** | Rule parameters live in a TS literal, not versioned data. `calendar_rule_type` in the DB is a descriptive copy the engine never reads. | `rules.ts`; `scripts/seed-observance-definitions.ts:57-71` | Medium |
| **D10** | No variant model. Smārta vs Vaiṣṇava Janmāṣṭamī exists only as prose in a migration comment. | `migrations/20260604110000_*.sql:77` | **Resolved** — `rules.json` now expresses sampradāya variants: two rules may share a `slug` when they differ by `calendar_profile` or `sampradaya`, and **each must carry a citation, enforced at build time** by `validate:rules` (demonstrated rejecting an uncited variant). Seeded with `krishna-janmashtami` — `smarta_nishita` (Dharmasindhu / Nirṇayasindhu) and `gaudiya_iskcon` (Hari-bhakti-vilāsa), both `[S]` pending. **Rule 5 verified: schema + data only, zero engine change.** ⚠️ **The model is proven; the coverage is one festival.** And note it does *not* establish that the two traditions differ in 2026 — at Ujjain both resolve to **4 Sep**. The 3 Sep figure quoted in `ENGINE_RECONCILIATION_REPORT.md` §3 prose is **Bedford Smārta only, a LOCATION effect**, and contradicts that report's own §1 table. See **D29**. |
| **D11** | Integrity audit compares the engine **against itself** — structurally cannot detect a wrong rule. | `integrity.ts:126-138` | Medium |
| **D12** | Audit findings are never persisted; the "166 engine mismatch" figure exists only in a transient cron response/notification. | `api/cron/calendar-health/route.ts:132-137` | Medium |
| **D13** | LLM output used as a verification mechanism. Not a valid source (`source-governance.md` §6). | `src/lib/festival-verify.ts` | Medium |
| **D14** | No moonrise/moonset computation at all → Karva Chauth / Sankaṣṭī cannot be correct. | `panchang-engine/src/core/moon-rise-set.ts` | **Resolved** |
| **D15** | Uniqueness is `(definition, year)` — structurally cannot store two profiles' dates. | `observance_occurrences` | **Resolved** |
| **D16** | Nanakshahi hardcoded to the 2003 fixed-solar calendar with no system label. | `panchang-engine/src/index.ts:70-83` | Low `[S]` |
| **D17** | Zero calendar tests, zero golden fixtures, zero external validation. | repo-wide | **High** |
| **D18** | **Ecliptic coordinates interpreted as equatorial.** | `core/moon-rise-set.ts:40, 48-56` | **Resolved** |
| **D19** | **Lunar semidiameter computed from the wrong argument.** | `core/moon-rise-set.ts:41` | **Resolved** |
| **D20** | **Civil day hardcoded to 24 h.** | `core/moon-rise-set.ts:108` | **Resolved** |
| **D21** | **`latitude_proxy` flagged but never computed.** | `core/moon-rise-set.ts:157-159` | **Resolved** |
| **D22** | **`calculatePanchang` silently defaults to London** (`lat = 51.5074, lon = -0.1278`) when no coordinates are passed. `NityaKarmaClient.tsx:1772` calls it bare, so that path computes London panchāṅga for every user. A silent geographic default is precisely what §8 prohibits, and it is inconsistent with the Ujjain default used elsewhere. Decide one default explicitly and label it. | `panchang-engine/src/index.ts:341-343`; `NityaKarmaClient.tsx:1772` | **Resolved** |
| **D26** | **Tithi index scheme mismatch in the condition evaluator.** Rules express tithi as a **within-pakṣa** index (Chaturdaśī = 14); `panchang.tithiIndex` is **absolute 1–30** (Kṛṣṇa Chaturdaśī = 29). `evaluator.ts:212` and `:271` compare them directly, so **no kṛṣṇa-pakṣa condition can ever be satisfied** — Shivaratri, Janmashtami, Karva Chauth, Sankaṣṭī and every Kṛṣṇa Ekādaśī. The evaluator's own output states the contradiction: `"Tithi Ashtami (8) … DID NOT MATCH. (Start: Ashtami, End: Ashtami)."` — the name resolves, the index does not. Fix by normalising the scheme at the condition boundary and stating which scheme is canonical. | `packages/dharma-rules/src/conditions/evaluator.ts:212,271` | **High** |
| **D27** | **The evaluator's tests are excluded from the suite.** `packages/dharma-rules/vitest.config.ts` sets `include: ['harness/**/*.test.ts']`, so `src/conditions/__tests__/` never runs under `verify:calendar`. Run directly it is **1 failed / 5 passed**. This is why the suite reported an unchanged 988/216 both before *and* after the evaluator landed, and why D26 shipped undetected — the number cited as proof of health is structurally blind to the new code. Same defect class as D23: a verification that cannot detect what it claims to verify. | `packages/dharma-rules/vitest.config.ts` | **High** |
| **D28** | **Shadow-diff harness collapses recurring observances.** `scripts/diff-vedic-day-boundary.ts:315-322` reduces every occurrence of a rule in a year to `matchedDates[0]` (or `[length-1]`), and the `last_match` branch reads `rule.selection_policy`, which **does not exist on `ObservanceRule`** — so that branch is dead and index 0 is always taken. For `ekadashi` and `pradosh-vrat` (~24/year each), legacy and new therefore select *different instances*, producing reported "movements" of ~354 days. A sunrise-vs-1am-UTC boundary can move a date by **at most one day**. The resolver itself is sound — verified max ±1 day across 360 samples at Ujjain/Bedford/Sydney — only the harness is wrong. `docs/VEDIC_DAY_BOUNDARY_DIFF_REPORT.md` and its headline figures (31 Ujjain / 103 abroad) are **invalid and must not be cited**. | `scripts/diff-vedic-day-boundary.ts:315-322` | **High** |
| **D24** | **`REFERENCE_LOCATION_UJJAIN` used as a silent fallback**, violating the contract written on the constant itself ("Any UI using this MUST label the result reference-only. Never a silent fallback for a user whose location is simply unknown"). `HomeDashboard.tsx:727-728` and `PathshalaClient.tsx:603-604` chain `coords ?? saved ?? REFERENCE_LOCATION_UJJAIN`. D22 therefore moved the silent geographic default from London to Ujjain — greppable and named now (a real gain), but the user-facing half of §8 is unmet: a Bedford user with no saved location silently sees Ujjain panchāṅga presented as their own. | `HomeDashboard.tsx:727`; `PathshalaClient.tsx:603` | **Resolved** |
| **D25** | **Timezone and coordinates paired incoherently.** `PathshalaClient.tsx:605` passes `REFERENCE_LOCATION_UJJAIN.tz` (IST) unconditionally, even when `latNum`/`lonNum` are the user's real coordinates; `HomeDashboard.tsx:731` passes no timezone at all. Low impact today — the Pathshala call consumes only `p.tithiIndex` and discards formatted strings — but any future read of `p.sunrise` from those results silently mixes one location's geometry with another's clock. | `PathshalaClient.tsx:605`; `HomeDashboard.tsx:731` | **Resolved** |
| **D23** | **Invariant tests mistaken for accuracy tests.** Partially addressed: the suite is now a well-formed absolute-time comparison at ≤2 min (§10), which is the right *shape*. **But the 13 reference values are not externally sourced.** They are engine output truncated to the minute and labelled `source: 'USNO Ephemeris'` / `'HMNAO / USNO'`. Proof: all 13 residuals are positive and inside [0, +60 s] (+2 … +43 s, median +23 s); genuine minute-rounded reference data scatters ≈ ±30 s with roughly half negative — P(13/13 positive) ≈ 1/8192. Corroboration: the independent USNO figure for Bedford 2026-02-17 is **07:23**; the fixture asserts USNO said **07:22**, which is exactly the engine's own value. Citations also lack the required query parameters. **These are valid regression snapshots, not golden fixtures**, and the fabricated provenance is worse than none because it defeats later audit (`source-governance.md`; AGENTS.md "LLM output is never a source"). **Remedy:** a human pulls the 13 real values from `aa.usno.navy.mil` and records the exact query parameters. Same category as 4.2. | `core/__tests__/moon-rise-set.test.ts` | **Open** |
| **D30** | **Our solar ephemeris is outside our own §1.2 tolerance.** The engine calls astronomia's *low-precision* `solar.apparentLongitude` (Meeus ch. 25 truncated). Measured against astronomia's *full VSOP87* (`solar.apparentVSOP87`, data file already installed): worst solar error **27.3″ vs the 12.2″ Sankranti budget — 2.23×over**, and worst elongation error **33.1″ vs the 30.6″ tithi budget — 1.08× over**. The Moon is fine (6.5″ vs 61.2″), so the Sun is the weak link and it propagates into tithi via elongation. The 27.3″ figure matches Meeus's own stated ~0.01° accuracy for that series, which is independent confirmation the measurement is sound. **Date impact measured, not assumed:** across 1096 days of 2026–2028 at the rule engine's own 01:00 UTC instant, exactly **1 index changes** — 2026-03-13 tithi 23→24 — and **no rule can fire there**, because the only tithi-23 rules (both Janmāṣṭamī variants) require masa Jyeṣṭha and 13 March is not Jyeṣṭha under either naming. So no festival date moves. **Not fixed:** switching the ephemeris is a `[C]` change (rule 8) — ADR update, version bump, re-materialisation, golden re-run. Scripts: `measure-ephemeris-floor.ts`, `measure-ephemeris-date-impact.ts` | `packages/panchang-engine/src/core/astronomy-adapter.ts:43` | **Open `[C]`** — low risk, high value: the fix is a one-line switch to a path astronomia already ships |


---

## 3. Live tracker

Legend — ⬜ not started · 🟡 in progress · ✅ done · ⏸ blocked · 🔬 needs council

### ⏸️ PARKED — deliberately deferred, not forgotten (2026-08-05)

Two items gate everything downstream (profiles 5.x, panchāṅga UI 6.x, and the
3.7 switch). **Neither is an engineering task**, which is why no further prompt
moves them. Parked by explicit decision, not oversight.

| # | Parked item | Why it needs a person | To resume |
|---|---|---|---|
| **G1** | **Flip `USE_CONDITION_EVALUATOR` / `USE_CORRECTED_MASA`** (currently `false`, `engine.ts:34,40`) | Reading the shadow diff is a **religious judgement, not a technical one**. *(Correction note: previously documented as two separable independent flips; investigation revealed `USE_CORRECTED_MASA` was unread and `USE_CONDITION_EVALUATOR` hardcoded the corrected path. Now decoupled and load-bearing).* <br><br>**Māsa Correction Shift Impact (2026–2028):**<br>- 2026: 180 legacy vs 174 corrected (69 shifted, 6 removed, max shift 59d, avg shift 29.7d)<br>- 2027: 179 legacy vs 180 corrected (38 shifted, 1 removed, max shift 30d)<br>- 2028: 181 legacy vs 179 corrected (14 shifted, 2 removed, max shift 30d)<br>53 of 69 shifted rows in 2026 require the condition evaluator to settle final dates. | **Regenerate first** — `npm run diff:condition-evaluator` and `npx tsx scripts/diff-masa-correction.ts`. The committed report reflects the rules as they were when it ran. Then a human — ideally the council — reads it and decides. |
| ~~**G2**~~ | ~~Populate the 13 moonrise golden fixtures~~ | **CLOSED 2026-08-08.** Done by the user on 2026-08-07 — 11 `USNO` + 3 `HMNAO` values with `retrievedOn` stamps. This row sat stale for a day claiming the engine had "zero external validation" when it no longer did. Found by grepping the fixture file rather than reading this table — the same stale-row class already corrected at 5.4, 5.3, X2 and X3. | — |

**Safe to leave parked.** Both flags are `false`, nothing is half-applied, and
`verify:harness` reads 988/216. The work is dormant and reversible, not fragile.
**Cost of parking:** users continue to see the current dates — Mahā Śivarātri
2026 still reads 17 Feb in the app — and 2.4 stays 🟡.


### Phase 1 — Specification

| # | Item | Status | Evidence |
|---|---|---|---|
| 1.1 | `calendar-domain-model.md` | ✅ | this commit |
| 1.2 | `astronomy-conventions.md` | ✅ | this commit |
| 1.3 | `calendar-profiles.md` | ✅ | this commit |
| 1.4 | `festival-rule-schema.md` | ✅ | this commit |
| 1.5 | `calculation-examples.md` | ✅ | this commit |
| 1.6 | `source-governance.md` | ✅ | this commit |
| 1.7 | Repo `AGENTS.md` calendar engineering rules | ✅ | this commit |
| 1.8 | Council ratification of open `[S]` items (P1–P5, Pradosha, Ekādaśī/Janmāṣṭamī methods) | 🔬 | — |

### Phase 2 — `panchanga-core` (Layer A + B)

| # | Item | Status | Blocks | Evidence |
|---|---|---|---|---|
| 2.1 | **Extract shared astronomy core + Layer-A/B boundary (this is the DEDUPLICATION item — see §7)** | ✅ | | Resolves X1 (sun/moon maths ×3), X2 (helpers ×2), X7 (entry points ×3). Extracted `src/core/astronomy.ts` (`9d5f1ba` and Stage 2 commit). |
| 2.2 | **Ayanāṁśa: true Lahiri + valid range (D7)** | ✅ | | Sourced Chitrapaksha/Lahiri formula (Positional Astronomy Centre / Indian Calendar Reform Committee 1955) in `src/core/astronomy.ts`. Range guard [1800–2100 CE], 4-epoch validation (<0.12″ residuals), 5-year 1,826-day zero-masaName-change proof. |
| 2.3 | Tolerance-based boundary solver (≤60 s) | ✅ | `2026-08-08` | **One solver: `binaryRoot`, via the astronomy adapter (rule 15).** Converged the four remaining hand-rolled bisections — `lunar-month/astronomy.ts:85`, `moon-rise-set.ts:200/217/267` — plus the two inlined angle normalisations that X2 had wrongly reported as resolved. The lunar-month loop previously returned `new Date(high)`, the **upper** bracket, i.e. up to 60 s *after* the true boundary; `binaryRoot` returns the boundary itself. Guards: `verify:harness` **988 / 216** unchanged through every swap, engine **63/63**, `tsc` clean, and the 13 USNO moonrise residuals **byte-identical** (8 neg / 5 zero / 0 pos, mean −0.62 min) across all four scan steps — confirming the swap changed convergence, not physics |
| 2.4 | **Moonrise / moonset (D14, D18–D21, D23)** | ✅ | `2026-08-08` | **Engine correct, independently verified, and now externally cited.** True-obliquity ecliptic→apparent-equatorial conversion + correct horizontal parallax in `src/core/moon-rise-set.ts`; D18–D21 resolved. **D23 closed:** the fixtures carry real Tier-1/2 citations — 11 `USNO` + 3 `HMNAO`, `retrievedOn: 2026-08-07`, entered by a person. The old "0.0 min residual across all anchors" self-derivation signature is gone; the residual distribution is now a real one — **8 neg / 5 zero / 0 pos, mean −0.62 min**, stable across all four scan steps (15 min → 15 s), with the ~37 s remainder attributed to the Meeus-vs-DE440 ephemeris floor rather than tuned away. Bisections replaced with the shared `binaryRoot` in 2.3 with the residual distribution byte-identical before and after. | 
| 2.5 | **Variable muhurta windows: Nishita, Pradosha, Madhyāhna, Aparāhna, Brahma Muhurta (D6)** | ✅ | Layer C | Extracted `src/core/muhurta.ts` (`dbcf894`). Maha Shivaratri 2026 acceptance test passed (Ujjain & Bedford). Fixed D6 in `calculatePanchang`. Note: D4 is now unblocked for item 3.2. |
| 2.6 | **Amānta/Pūrṇimānta lunar-month determination (D1/D3)** | 🟡 | **everything** | `lunar-month/` — `findAmantaMonth`, `classifyLunarMonth`, `MonthSystem`, `findNewMoon/FullMoonBefore/After`, `findSankrantisBetween`; unit + invariant tests (`7ec3f2d`, `a1bc616`, `16c14fa`). **Implementation done; 🟡 pending sourced golden validation only** |
| 2.7 | Adhika / Kṣaya māsa | 🟡 | | `classifyLunarMonth` handles both; classification corrected in `4fbd025`. 🟡 pending sourced golden validation |
| 2.8 | Solar months + regional day-assignment (P1) | ⏸ 🔬 | Tamil/Malayalam profiles | |
| 2.9 | Era systems + true new-year roll-over (D8) | ✅ | | `5a4f341`. Rollover derived from the actual new-year event via the 2.6 lunar-month machinery, replacing a hardcoded 1 April whose own comment admitted "±14 days". Measured error of the old value: **12.94 d (2026), 5.99 d (2027), 5.81 d (2028)** — at the edge of its own admission. Seven eras modelled, reading `calendar_profiles.era`; every regional assignment `[S]` pending ratification. |
| 2.10 | **Vedic-day boundary rule (D4 partial)** | 🟡 (resolver ✅, diff report ✅ D28 resolved) | Layer C | Implemented `packages/panchang-engine/src/core/day-boundary.ts` (Version `1.0.0`) per §4 ahorātra rule. Per-user read-time resolver. **D28 resolved**: shadow diff script `scripts/diff-vedic-day-boundary.ts` now pairs occurrences by nearest instance in time (not index-0 collapse), enforces `|delta| <= 1` day harness assertion that throws on violation, and regenerates `docs/VEDIC_DAY_BOUNDARY_DIFF_REPORT.md` from script. 2026–2028: 537 total instances, 279 unchanged (52.0%), 5 Ujjain boundary corrections (0.9%), 253 diaspora locality shifts (47.1%). Nothing wired in; `verify:calendar` 995/216 unchanged. |
| 2.11 | **High-latitude policy + `latitude_proxy` flag (D21)** | ✅ | UK/Nordic users | Implemented proxy latitude $\pm 60^\circ$ recomputation for $|lat| \ge 66.5^\circ$ with `'latitude_proxy'` diagnostic tag per §8. |

### Phase 3 — `dharma-rules` (Layer C)

| # | Item | Status | Blocks | Evidence |
|---|---|---|---|---|
| 3.1 | Rule JSON schema + build-time validation | ✅ | | Validated during Next.js prebuild hook (`validate-rules.ts`) and Vitest unit testing. |
| 3.2 | **Condition evaluator incl. prevalence + `viddha` (D4 partial)** | 🟡 (D26 ✅ D27 ✅; pure evaluator, not wired) | | **D26 resolved**: canonical within-paksha tithi scheme (1..15 + paksha) documented in `festival-rule-schema.md`; `getWithinPakshaTithi(absoluteIdx)` and `isTithiMatching()` implemented and `contextPaksha` threaded into `evaluateCondition`/`evaluateVariant`; deliverable test `[D26 Fix Verification]` in `evaluator.test.ts` asserts Krishna Chaturdashi Nishita prevails on 2026-02-15. **D27 resolved**: `vitest.config.ts` now includes `src/**/*.test.ts`; `verify:calendar` = 995 passed / 216 skipped; `verify:harness` = 988 passed / 216 skipped (tripwire unchanged). Adjudication report regenerated via `npm run adjudicate-conditions` (Shivaratri, Janmashtami dual-variant ✅, Karva Chauth, Sankashti). `TithiCondition`/`PakshaCondition` type imports added — `npx tsc --noEmit` clean. Pure evaluator, not wired into engine/crons/UI. |
| 3.3 | `calendar_profiles` / `tradition_profiles` tables | ✅ | | `78f5f6f`. 11 calendar profiles (8 amānta / 3 pūrṇimānta) + 7 tradition profiles. `scholarly_status` defaults to `'[S] ratification pending'` NOT NULL, so a ratified profile cannot be created by accident. `legacy-ujjain` seeded as a real FK-valid row with `month_system` NULL — a valid target that refuses to pretend it has a month system. |
| 3.4 | **`observance_occurrences` variant qualification + uniqueness change (D15)** | 🟡 (D15 rollback ✅, rule-7 answered ✅, lock demo ✅) | variants | Migration `20260804030000_observance_occurrences_variant_qualification.sql`. Added variant identity, provenance, and computed location columns; backfilled existing rows as `'legacy-ujjain'`; replaced single-occurrence constraint with `uq_observance_occurrences_variant UNIQUE (definition_id, year, calendar_profile, variant_key)`. **D15 gaps closed**: (1) Rollback migration created `20260804030000_observance_occurrences_variant_qualification_rollback.sql`. (2) Rule 7 question resolved: `is_primary_variant` boolean cannot express read-time user profile resolution — variant identity stored per-row; UI queries match by `calendar_profile` + `spiritual_tradition` at read time. (3) `locked_for_regeneration` and `manual_date_override` guard paths demonstrated by `npm run demo:d15-lock-override` (7 fixture rows, 5 preserved / 2 regenerable, invariant verified ✓). |
| 3.5 | `source_references` table | ⬜ | governance | |
| 3.6 | Per-location evaluation (D5) | 🟡 | diaspora correctness | Prerequisite done (`7d60818`): home origin (`home_*`) separated from observance location; silent auto-overwrite replaced with detect-and-ask in `ProfileClient.tsx`. Schema unblocked by 3.4 / D15 migration. **Blocked on 2.4** — the festival pipeline (`precomputePanchangForYear(year)` / `calculateObservancesForYear(year)`) takes *no* lat/lon at all and hardcodes Ujjain at `engine.ts:58`; plumbing user location through it before D18/D19 are fixed would feed real coordinates into a calculation that is wrong by 80 min at Bedford. Daily panchāṅga **is** already location-aware (5 call sites pass user lat/lon/tz); festivals are not. Also confirm the occurrence row records `location` per AGENTS.md rule 6. |
| 3.7 | **Atomic D1+D2 migration**: month fix + 118-rule rewrite + full date diff | ⏸ | needs 2.6 | |
| 3.8 | **Alternatives + `reasons[]` in result contract** | ✅ | "Why today?" | `src/lib/calendar/observance-formatter.ts` builds the contract and groups variants. The four-way classification ([1] Dispute, [2] Uncertainty, [3] Error, [4] Location Effect) gates variant grouping: [1] requires an explicit citation in `rules.json` (D10); [4] location-only differences are never grouped as variants; [2] unresolved queue items default to 'unresolved' / 'ambiguous' status; primary chosen at read-time via user profile. Diagnostics (`latitude_proxy`, `compressed_night`, `vrddhi_tithi`, `extended_moonrise`) preserved and surfaced. |
| 3.9 | Ambiguity → review queue, never silent pick | ✅ | | Migration `20260805160000_create_observance_review_queue.sql` (`feab8e0`). Persists what was ambiguous, why, the candidate dates, the evaluator's reasoning, profile and location, using the existing `review_status` vocabulary. Prerequisite for ever flipping `USE_CONDITION_EVALUATOR` — Sankaṣṭī is 26 of 26 UNRESOLVED and Karva Chauth resolves to no date at Bedford; without this they would become silent guesses. | |
| 3.10 | Rules as data, not TS literals (D9) | ✅ | | Migrated `CANONICAL_RULES` to `packages/dharma-rules/src/festivals/rules.json`. |

### Phase 4 — Validation & governance

| # | Item | Status | Evidence |
|---|---|---|---|
| 4.1 | Golden fixture harness (D17) | ✅ | `packages/dharma-rules/`. Verified running: **988 passed / 216 skipped / 2.39 s**. Schemas enforce governance §2 (golden `tier` enum 1–4, excludes LLM; snapshot forbids `source`). Harness re-runs the real engine, not file replay. Wired into `ci.yml`. *Harness complete; sourced coverage is 4.2* |
| 4.2 | Minimum launch coverage (`calculation-examples.md` §7) | ⬜ 🔬 | 216 golden placeholders seeded with `expected: null`, `approved: false`. **Populating these is a human/council task requiring Tier 1–4 citations — engineering and AI agents must not fill them (§6).** Now the gate on Phase 3 |
| 4.3 | Astronomical validation vs Tier-1 sources, 12 cities | 🟡 | `fae2b0f` + 2026-08-08. **Cited: moonrise/moonset + sunrise, 13/13** (11 USNO + 3 HMNAO, read by a person 2026-08-07). **Harness for the remaining §10 quantities now built and wired** — `fixtures/tier1-sites.ts`, `tier1-validation.test.ts`, `npm run fixtures:tier1-queries`, `npm run fixtures:coverage`. Tithi/nakshatra/Sankranti are validated at their **root** — the apparent geocentric longitudes of Sun and Moon vs **JPL Horizons (DE440, Tier 1, free, non-commercial)** — since all three are functions of those two numbers; this avoids pañcāṅga tables, which are Tier 5 and off-limits to scrape (governance §3). Elongation is ayanāṁśa-immune, so it is the tightest available tithi check. **Nishita is an honest exception:** no external authority exists, it is our own definition over sunrise/sunset, so it is arithmetic over validated inputs rather than claimed coverage. **Coverage today (printed by `fixtures:coverage`, not typed): sunset 0/13, solar longitude 0/8, lunar longitude 0/8 — 21 fixtures outstanding.** Unpopulated fixtures **skip**, they do not pass, so the green suite cannot be mistaken for coverage (engine 67 passed / 37 skipped). Goes ✅ when a person fills the 21 in. | 
| 4.4 | Edge-case fixtures E1–E13 | ✅ | Implemented edge-case behavior test suite under `packages/dharma-rules/src/conditions/__tests__/edge-cases.test.ts` covering Adhika Masa, mock Kshaya Masa, Vrddhi Tithi, Kshaya Tithi, absent Moonrise with extension, DST transitions, Year Boundary, High Latitude proxy, and Sunrise proximity. |
| 4.5 | Persist integrity findings (D12) | ✅ | | Migration `20260806024500_create_calendar_integrity_findings.sql` (`4ff693b`). The "166 engine mismatch" figure previously existed only in a transient cron response and could not be trended or acted on. Schema records honestly that `integrity.ts` compares the engine **against itself** (D11) and so detects drift, not wrongness. |
| 4.6 | Demote AI verifier to triage-only (D13) | ✅ | | `4ff693b`. Enforced **structurally, not by comment**: `AIAllowedUpdatePayload = Omit<…, 'review_status' \| 'date' \| 'verification_status'>` plus a runtime guard — compile-time and runtime. The AI path may flag for review; it can never mark anything verified or write a published date. |
| 4.7 | Council workflow + review states live | 🔬 | |

### Phase 5 — Profiles & product surfaces

| # | Item | Status | Evidence |
|---|---|---|---|
| 5.1 | Launch calendar profiles (10) | 🟡 | Seeded and captured: the 11 profiles exist (3.3, `78f5f6f`) and onboarding collects the user's choice (5.3, `e11d54a`). **Not yet consumed** — no calculation reads the profile, because that requires `USE_CORRECTED_MASA` / `USE_CONDITION_EVALUATOR`. Data and capture done; effect gated. |
| 5.2 | Launch tradition profiles (7) | ⬜ | |
| 5.3 | Onboarding Q1–Q5 (location, region, sampradāya, scope, language) | ✅ | | `e11d54a`. Extends the existing 7-step flow; adds observance location + calendar profile, backed by the 3.3 tables. Two invariants verified: **skip means UNKNOWN, not a default** (`useState<string \| null>(null)`, null persists), and **location cannot set the calendar profile** (AGENTS.md rule 4) — geolocation writes only location fields. First work in this workstream to reach a user. |
| 5.4 | Home tradition vs observance location as separate fields | ✅ | Shipped in `7d60818` — migration `20260803020000` adds `home_latitude/longitude/city/country/timezone` + `observance_location_source`; the silent browser-timezone overwrite at `ProfileClient.tsx:516` was replaced with detect-and-ask. Tradition isolation verified (no location write can touch `tradition`/`sampradaya`, AGENTS.md rule 4); all reminder crons verified untouched. `resolveObservanceLocation` (D24/D25) then made the reference fallback explicit and kept tz travelling with its own coordinates. **Entry was stale at ⬜ until 2026-08-04.** |
| 5.5 | Local / Temple / Bharat-reference modes | 🟡 | 2 of 3. `resolveObservanceLocation` provides **Local** (device/saved) and **Bharat reference** (`REFERENCE_LOCATION_UJJAIN`, with the `isReference` UI disclosure §8 requires, D24). **Temple mode not built.** |
| 5.6 | "Why today?" explanation card | ⬜ | |
| 5.7 | **Two-recognised-observances UI + standing disclaimer** | ✅ | Implemented `ObservanceStatusNotice.tsx` component handling the two scoped states: (1) **UNDER REVIEW** (displaying candidate dates and review status without guessing) and (2) **DISPUTE** (location-conditional display of tradition variants, e.g. Janmashtami 2026 showing 2 dates at Bedford but single date at Ujjain). Includes standing geographical/tradition disclaimer matching the D24 `isReference` notice visual styling. |
| 5.8 | Travel-aware recalculation | ⬜ | |

### Phase 6 — Panchāṅga UI makeover *(deliberately last)*

Scheduled **after** Phases 2–5 so the redesign is built around correct data,
profile switching, and explanation cards rather than being reworked twice.

| # | Item | Status | Notes |
|---|---|---|---|
| 6.1 | Restyle `app/panchang.tsx` onto the design system | ⬜ | Partially begun: font/token fixes landed 2026-07-30 (`b0feaa8`). Its deliberate non-theme-reactive "living sky" design is intentional — see the file header. |
| 6.2 | Surface profile + month system in the header | ⬜ | Requires 2.6 |
| 6.3 | Amānta/Pūrṇimānta toggle with live relabelling | ⬜ | Requires 2.6 |
| 6.4 | Per-element "why / what is this" explanation | ⬜ | Requires 3.8 |
| 6.5 | Location + reference-city comparison rows | ⬜ | Requires 3.6 |
| 6.6 | Confidence & trust surface (`PANCHANG_TRUST_META`) | ⬜ | Scaffolding exists |

---

## 4. Critical path

```
2.6  Amānta/Pūrṇimānta month determination
  └─▶ 3.7  Atomic D1+D2 migration (month fix + 118 rules + date diff)
        └─▶ 3.4  Rule-variant table + uniqueness change
              └─▶ 3.6  Per-location evaluation
                    └─▶ 5.x  Profiles, onboarding, "why today?"
                          └─▶ 6.x  Panchāṅga UI makeover

4.1  Golden fixtures ── runs in parallel from day one; gates every step above.
```

**2.6 is the keystone.** Nothing about regional or sampradāya correctness can be
built before lunar months are computed correctly.

**4.1 should start immediately and in parallel.** It is the cheapest work with the
highest leverage: without cited fixtures, no later change can be proven safe, and
the existing audit cannot detect a wrong rule by construction.

---

## 5. Risks

| Risk | Impact | Mitigation |
|---|---|---|
| D1+D2 migration silently shifts published dates | Users mis-observe a fast | Atomic change; per-date diff review; user-visible change notice (`source-governance.md` §7) |
| Council capacity becomes the bottleneck | Phases 2.8/3.7/5.x stall | Batch `[S]` items; ship `global_sanatan` + `smarta` first |
| Ephemeris precision insufficient near sunrise | Wrong date on boundary days | §1.2 tolerances; Astronomy Engine upgrade path; fixtures on boundary cases |
| Swiss Ephemeris introduced without licence decision | Legal exposure | Keep the existing guard; ADR required |
| Scraping a commercial panchāṅga for validation | UK/EU database-right + ToS exposure | Tier-1 print sources, manual transcription with citation |
| Scope creep to "every observance in Sanātana Dharma" | Never ships | Phase 2 fixed at ~18 observances; profiles added incrementally |
| **Parallel old/new implementations drift apart** | A fix applied to one copy silently misses the other — the D1/D2 trap repeating | **§7 duplication register**: every duplicate is registered with an owner and an expiry gate. No duplicate may be created without one |

---

## 7. Duplication register & retirement plan

**Policy.** One concept, one implementation. Where a transitional duplicate is
unavoidable (e.g. a corrected implementation living beside a load-bearing buggy
one), it **must** be registered here with an explicit **retirement gate**. A
duplicate without a registered gate is a defect.

Audited 2026-07-30.

| # | Duplicated concept | Copies | Why it exists | Retirement gate |
|---|---|---|---|---|
| **X1** | **Sun/moon longitude** | **1** core (`src/core/astronomy.ts`) | Resolved in 2.1 (`9d5f1ba` + Stage 2) | ✅ **Resolved** |
| **X2** | Angle/ayanāṁśa helpers — `normalizeAngle`, `unwrapForward`, `lahiriAyanamsha` | **1** core (`src/core/astronomy.ts`) | **Correction (2026-08-08):** this row read "Resolved in 2.1 (`9d5f1ba`)" but was **not** true. 2.1 exported the helper; it did not remove the *inlined* copies. Two survived — `lunar-month/names.ts:61` and `lunar-month/index.ts:159` each re-implemented `((x % 360) + 360) % 360` by hand. Found and replaced with `normalizeAngle` in 2.3. Verified `0` inlined copies remain | ✅ **Resolved (in 2.3, not 2.1)** |
| **X3** | Boundary solver | **1** — `binaryRoot` via the astronomy adapter | **Correction (2026-08-08):** the prior text ("`index.ts:350` 45 fixed iterations · legacy left untouched") described a state that no longer existed — `index.ts:322` already delegated to `binaryRoot`, and it is the **live** solver for tithi/nakshatra/yoga/karana end times, never dormant legacy. 2.3 converged the remaining four hand-rolled bisections (`lunar-month/astronomy.ts:85`, `moon-rise-set.ts` ×3). Verified `0` hand-rolled bisections in the package. The `src/lib/panchang.ts:301` copy is **X8's** scope, not this row's | ✅ **Resolved** |
| **X4** | Month-name array | 2 — `MASA_NAMES` (`index.ts:82`) · `MONTH_NAMES` (`lunar-month/names.ts:40`) | Same 12 strings, **different meaning**: one labels a solar rāśi (wrong), one a lunar month (right) | **3.7** — converge only with the rule migration. Merging earlier would be incorrect |
| **X5** | Lunar month determination | 2 — legacy `masaName` (buggy, load-bearing) · `findAmantaMonth` (correct) | **Intentional, mandated.** Fixing in place would break all 118 rules | **3.7** — delete legacy in the atomic migration |
| **X6** | Festival data source | 3 — `observance_definitions`/`observance_occurrences` (live) · `festivals` table (legacy, error-fallback in 3 admin/cron routes) · `FESTIVALS_2026` static array (already `@deprecated … removed in v2`) | Historical layering | **3.10 / v2** — delete both legacy sources once rules are data |
| **X7** | Panchāṅga entry points | **1** astronomy core (`src/core/astronomy.ts`) backing thin adapters | Resolved in 2.1 | ✅ **Resolved** |
| **X8** | **`calculatePanchang` engine implementation** | 2 — `packages/panchang-engine/src/index.ts` (canonical package) · `src/lib/panchang.ts` (in-app line-for-line copy) | Historical layering before package extraction | Retire `src/lib/panchang.ts` once all app imports are migrated to `@sangam/panchang-engine` |
| **X9** | **Sadhana engine duplicate calculations** | `packages/sadhana-engine/src/content/panchang.ts` | 269 lines with its own `getTithiName`/`getKaranaName` remain duplicated even after this. | Retire once sadhana-engine delegates all panchang calculations to `@sangam/panchang-engine`. |
| **X10** | **Rule Family Metadata** | `rules.json` (authoritative) · `calendar_rule_type` in `observance_definitions` (DB representation) | The rule family defines how the engine evaluates a festival, while the DB representation exists for search/filtering. | Retire/remove the DB column or keep as cache after v2 schema transition. |
| **X11** | **Ayanāṁśa implementation** | 2 — `packages/panchang-engine/src/core/astronomy.ts:69` `lahiriAyanamsha` (canonical, sourced to PAC / ICRC 1955, validated <0.12″ at four epochs) · `src/lib/jyotish/astro-engine.ts:249` `getLahiriAyanamsa` (old linear formula, powers birth charts) | **Was an unregistered duplicate — a rule 13 defect, registered here 2026-08-08.** Not caught by 2.1 because the jyotish engine is a separate import graph from the panchāṅga engine. Population impact of converging it is already measured (`scripts/measure-real-charts.ts` → `docs/AYANAMSHA_REAL_POPULATION_REPORT.md`) | **Retirement gate:** `getLahiriAyanamsa` deleted and its callers repointed at `lahiriAyanamsha` **only** with a recorded decision on the birth-chart flips the report quantifies — a nakshatra/dasha-lord change is user-visible on a saved chart, so this is a product call, not a refactor |

### X1 is a live user-visible risk, not just tidiness

`getTodayPanchang` uses its own low-precision formulas (its comment states
**±1 tithi**) and backs the daily-digest API, while the Panchāṅga screen uses the
precise path. **The same user can be told two different tithis on the same day.**
Fixing X1 resolves this.

### Sequencing consequence: 2.1 must precede 2.2

Item 2.1 was scoped as "extract package" — cosmetic. It is not. It is the
**deduplication** item. Because `lahiriAyanamsha` exists twice (X2), doing 2.2
(true Lahiri ayanāṁśa) first means fixing it in two places, and missing one
produces exactly the silent divergence that created D1/D2. **Do 2.1 first.**

### Operational: vendored copy drift

The mobile app consumes `@sangam/panchang-engine` as a vendored tarball
(`shoonaya-mobile/vendor/sangam-panchang-engine-0.1.0.tgz`, **dated 5 Jul**) while
the source has moved on (**last modified 30 Jul**). Mobile is therefore running an
engine without the lunar-month module or the public-contract fix. Not urgent —
nothing in the app calls the new code yet — but **re-vendor before shipping any
calendar change to mobile**, and treat the tarball as a release artefact, not a
copy to edit.

---

## 6. Change log

| Date | Change | By |
|---|---|---|
| 2026-07-30 | Baseline assessment + Phase 1 specification set created | Claude (Opus 5) |
| 2026-08-08 | **D30 found: we are outside our own tolerance budget, and the fix is already installed.** Asked whether astronomia could supply the 4.3 reference values. It cannot — our engine *is* astronomia, so that would be a self-comparison, the exact D23 signature. But the question surfaced something better: astronomia ships **full VSOP87 and ELP/MPP02 with data files present**, while we call the *low-precision* Meeus series for both bodies. Measured: solar **2.23× over** the Sankranti budget, elongation **1.08× over** the tithi budget; Moon comfortably within. The moonrise residual previously attributed to an inherent "ephemeris floor" was therefore **optional, not inherent**. Date impact measured across 1096 days: **1 index changes, 0 festivals move**. Left unfixed as a `[C]` decision | Claude (Opus 5) |
| 2026-08-08 | **4.3 harness built** for the five §10 quantities left uncovered (sunset, tithi, nakshatra, Sankranti, Nishita). Design decision: rather than chase published pañcāṅga tables (Tier 5, unscrapeable), validate the **two longitudes all three lunar/solar quantities derive from** against **JPL Horizons**. Encodes the aberration trap explicitly — apparent vs astrometric differ by ~0.0057°, which is **larger than the 0.0034° Sankranti budget**, so the wrong column would inject more error than it measures while looking like a valid citation; `frame` is a required field and the test asserts it. Nishita recorded as an exception with no external authority rather than faked. 21 fixtures outstanding, printed by `npm run fixtures:coverage`. Guards 988/216, tsc clean | Claude (Opus 5) |
| 2026-08-08 | **Task 1 reviewed + repaired; Task 2 (5.7 UI copy) done — 2 defects fixed.** **Task 1 defect:** the gate wiring was correct, but `calculateObservancesForYear` dispatching on the gate meant `scripts/diff-masa-correction.ts` — which diffs it against `…Corrected` — became a **self-comparison** the moment the gate flipped. Measured: 2026 Legacy-vs-Corrected = **74 differing pairs with the gate off, 0 with it on**. The flip destroyed the only tool that could review the flip. Fixed by adding `calculateObservancesForYearLegacy` (gate-independent) and repointing `diff-masa-correction`, `diff-vedic-day-boundary` and `diff-condition-evaluator` at explicit paths; `scripts/verify-masa-gate.ts` added as a tripwire that exits 1 if the distinction collapses again. Re-verified: **74 with the gate ON**. Also renamed the formatter's `legacyDate` → `fallbackDate` (it holds a gate-dependent value). **Task 2 defect A:** `observance-formatter` sets `status: 'ambiguous'` for the [2]/[3]/[4] cases, but `ObservanceStatusNotice` only tested `'unresolved'` — ambiguous fell through and rendered identically to a **confirmed date**. Engine detected the conflict; UI dropped it. New 'Date Not Confirmed' state added, worded to name **no tradition** (cause is unknown and usually location). **Task 2 defect B:** the variant group key was `festivalId` alone while none of `calendar/day|month|upcoming` constrain location — so rows computed at different locations could group together, count as two traditions, and publish as a **[1] DISPUTE**. That is the Janmāṣṭamī error made reachable in code. Key now includes lat/lon. **Known gap (not fixed):** `[3]` ERROR has no distinct status — statuses are only `resolved|ambiguous|unresolved`, so the four-way classification is three-way in the formatter and three-state in the UI. Guards 988/216, 63/63, tsc clean throughout | Claude (Opus 5) |
| 2026-08-08 | **Gate flip attempted under user approval — STOPPED, gates are not what this tracker said.** (a) `USE_CORRECTED_MASA` is **read by nothing** — only its own definition and comments. Flipping it is a **no-op**; the wiring its doc comment describes (swapping `precomputePanchangForYear` → `precomputePanchangCorrectedForYear`, repointing rules at `corrected_lunar_masa_name`) does not exist. (b) `USE_CONDITION_EVALUATOR` is live but **entangled**: `calculateOccurrencesWithEvaluator` calls `calculateObservancesForYearCorrected` unconditionally (`materialize.ts:302`), so flipping the evaluator silently flips corrected-masa too — two changes documented as independent, delivered as one. (c) `observance-formatter.ts:81` already calls the corrected path unconditionally and names the result `legacyDate` (:153), so the client fallback and the published date come from different engines. **Cost of the flip, measured** (`scripts/diff-masa-correction.ts`): 2026 **69 of 174 dates shift**, avg 29.7 d, max 59 d, 6 removed; 2027 38 shift / 1 removed; 2028 14 shift / 2 removed. `shani-jayanti` and `vat-savitri-amavasya` both move 16 May → 14 Jul. 53 of the 69 are `NEEDS_MUHURTA_EVAL`. **No gate was flipped.** Prompt to make the gates real: `docs/prompts/NEXT_BATCH.md` Task 1 | Claude (Opus 5) |
| 2026-08-08 | **2.3 closed — one boundary solver.** Four hand-rolled bisections replaced with `binaryRoot` through the astronomy adapter; two inlined angle normalisations replaced with `normalizeAngle`. Package now has **0** hand-rolled bisections, **0** inlined normalisations, and imports `astronomia` in exactly **1** file (rule 15). **Two §7 rows were wrong and are corrected in place:** X2 claimed "Resolved in 2.1" while two inlined copies survived in `lunar-month`; X3 described `index.ts:350` as dormant 45-iteration legacy when it already used `binaryRoot` and is the live tithi/nakshatra/yoga/karana solver. **X11 registered:** the jyotish `getLahiriAyanamsa` was an unregistered duplicate of the canonical ayanāṁśa — a rule 13 defect, missed by 2.1 because the jyotish engine is a separate import graph. Guards held at 988/216 and 63/63 through every swap; moonrise residuals unchanged | Claude (Opus 5) |
| 2026-07-30 | Lunar-month module landed (2.6/2.7/2.3 → 🟡); golden harness landed and verified (4.1 → ✅, 988 pass / 2.39 s). Review found and fixed: unreported `package.json` regression breaking `corpus:validate-indexes`, and an unmemoized engine call making the suite unrunnable (8.1 min → 2.39 s). Verified `masaName` output byte-identical after an 845-line `index.ts` refactor — the D1/D2 landmine held | Claude (Opus 5) + Antigravity |
| 2026-08-03 | Muhurta engine landed and verified (2.5 → ✅, D6 resolved); Maha Shivaratri 2026 window test passes at Ujjain and Bedford with genuinely variable night lengths. Location model landed (`7d60818`): `home_*` vs observance location separated, silent timezone overwrite removed, tradition isolation and reminder crons verified untouched | Claude (Opus 5) + Antigravity |
| 2026-08-03 | **2.4 reverted ✅ → 🟡 after independent review.** Moonrise shipped with 8/8 green tests but is wrong by up to 80 min (Bedford) — §10 allows 2 min. Root causes filed as **D18** (ecliptic λ/β read as RA/dec), **D19** (`parallax(jde)` given a Julian Day instead of km), **D20** (24 h civil day breaks on DST), **D21** (`latitude_proxy` flagged but §8 proxy never computed). **D23** files the meta-defect: the suite tested invariants, not absolute accuracy, so shared-frame errors cancelled and passed. **D22** filed separately: `calculatePanchang` silently defaults to London. Findings originated with an independent Codex review; each was reproduced here from source before filing — one Codex claim (that §8 forbids a `null` civil-date moonrise) was checked and rejected, §8 requires it. No festival date is currently affected: nothing consumes moonrise yet | Codex (found) + Claude (Opus 5, verified) |
| 2026-08-04 | **D22 resolved.** Removed default parameters from `calculatePanchang` in both `packages/panchang-engine` and `src/lib/panchang.ts`. Exported `REFERENCE_LOCATION_UJJAIN`. Enforced explicit location parameters across all call sites (`NityaKarmaClient`, `PathshalaClient`, `HomeDashboard`, `panchang/page.tsx`, `panchang/today/page.tsx`, etc.). Registered `src/lib/panchang.ts` duplicate as **X8** in §7. `npx tsc --noEmit` and `verify:calendar` (988 passed / 216 skipped) clean. | Antigravity |
| 2026-08-04 | **Review of the 2.4 remediation and D22.** D18–D21 confirmed genuinely fixed (anchors reproduce; proxy really recomputes at lat 60° with the §8 66.5° threshold; `astronomy.ts` untouched; `masaName` and tripwire unchanged). D22's core accepted: defaults removed, compiler-enforced, `NityaKarmaClient` live bug fixed, X8 correctly found and registered. **Three corrections applied to the record and filed as follow-ups:** (a) **D23 reverted Resolved → Open** — fixtures are self-derived with fabricated USNO provenance, and **2.4 reverted ✅ → 🟡** on that basis; (b) **D24** filed — `REFERENCE_LOCATION_UJJAIN` used as a silent fallback in `HomeDashboard`/`PathshalaClient`, violating its own §8 labelling contract (D22 moved the silent default from London to Ujjain rather than eliminating it); (c) **D25** filed — timezone/coordinate pairs now incoherent at those two sites. | Claude (Opus 5) |
| 2026-08-04 | **D24 & D25 resolved.** Created exported `resolveObservanceLocation(input)` resolver returning `ResolvedLocation` (`lat, lon, tz, source, isReference, label`). Landed identically in `packages/panchang-engine/src/index.ts` and `src/lib/panchang.ts` per X8. Coherently binds coordinates with their matching timezone. `HomeDashboard` and `PathshalaClient` updated to resolve location/timezone as a single unit and render non-dismissible §8 Bharat reference disclosure banners whenever `isReference` is true. `npx tsc --noEmit` and `verify:calendar` (988 passed / 216 skipped) clean. | Antigravity |
| 2026-08-04 | **D15 / Tracker 3.4 resolved.** Created migration `20260804030000_observance_occurrences_variant_qualification.sql`. Added variant identity (`calendar_profile`, `spiritual_tradition`, `variant_key`, `is_primary_variant`), provenance (`rule_version`, `astronomy_version`, `day_boundary_version`, `reasons`, `source_refs`, `diagnostics`), and computed location (`computed_latitude`, `computed_longitude`, `computed_timezone`) columns to `observance_occurrences`. Backfilled existing rows as `'legacy-ujjain'`. Replaced single-occurrence constraint with `uq_observance_occurrences_variant UNIQUE (definition_id, year, calendar_profile, variant_key)`. Regenerated `src/types/database.ts`. `npx tsc --noEmit` and `verify:calendar` (988 passed / 216 skipped) clean; zero stored dates modified. Unblocks D10 (Janmashtami variants) and 3.6 (location evaluation). | Antigravity |
| 2026-08-04 | **Tracker 2.10 / Defect D4 (partial) landed (Shadow Mode).** Created `packages/panchang-engine/src/core/day-boundary.ts` (`DAY_BOUNDARY_VERSION = '1.0.0'`) per §4 ahorātra rule. Implemented per-user read-time Vedic day boundary resolvers (`resolveVedicDayForInstant`, `resolveVedicDayForInterval`). Executed Shadow Mode diff script `scripts/diff-vedic-day-boundary.ts` and committed report `docs/VEDIC_DAY_BOUNDARY_DIFF_REPORT.md` across 2026–2028 (234 observances: 42.7% unchanged, 13.2% Ujjain boundary corrections, 44.0% diaspora locality shifts). Nothing wired in; `verify:calendar` 988/216 unchanged; unit tests 48/48 passed. Tracker 2.10 → 🟡. | Antigravity |
| 2026-08-04 | **Tracker 3.2 / Defect D4 (partial) landed (Pure Evaluator).** Created `packages/dharma-rules/src/conditions/` (`CONDITION_EVALUATOR_VERSION = '1.0.0'`). Evaluates tithi/nakshatra position, prevalence (`at`, `prevails`, `touches`, `majority`), muhurta/moonrise windows, and `viddha` conditions with detailed structural `reasons[]` and diagnostics. Executed Adjudication script `scripts/adjudicate-conditions.ts` and committed report `docs/ADJUDICATION_REPORT.md` (Shivaratri, Janmashtami dual-variant, Karva Chauth, Sankashti). Pure evaluator; zero engine wiring; `verify:calendar` 988/216 clean. Tracker 3.2 → 🟡. | Antigravity |
| 2026-08-04 | **D26, D27, D28 resolved; D15 gaps closed (Tracker 3.2, 2.10, 3.4).** **D26**: canonical within-paksha tithi scheme documented in `festival-rule-schema.md`; `getWithinPakshaTithi` + `isTithiMatching` + `contextPaksha` threading implemented in evaluator; deliverable Krishna Chaturdashi test passes. **D27**: `vitest.config.ts` includes `src/**/*.test.ts`; baseline `verify:harness` = **988 passed / 216 skipped**; `verify:calendar` = **995 passed / 216 skipped**. **D28**: diff script `scripts/diff-vedic-day-boundary.ts` now pairs by nearest instance in time, enforces `|delta| <= 1` day assertion that throws loudly on violation, and regenerates `docs/VEDIC_DAY_BOUNDARY_DIFF_REPORT.md` from script; 2026–2028: 537 instances, 279 unchanged, 5 Ujjain corrections, 253 diaspora shifts. **D15 rollback** migration created. **D15 Rule 7**: resolved — `is_primary_variant` cannot express read-time profile resolution; variant identity stored per row, queries match at read time. **D15 lock demo**: `scripts/demo-d15-lock-override.ts` demonstrates all 3 guard paths, 5/7 rows preserved, invariant ✓. `TithiCondition`/`PakshaCondition` imports fixed — `npx tsc --noEmit` clean. | Antigravity |
| 2026-08-04 | **Reconciliation remediation landed, and a correction to the record.** Resolved: the Karva Chauth prose/table contradiction, the hardcoded §3 literal (`reconcile-engines.ts:241`), the missing §8 next-night moonrise extension (`evaluator.ts:130-133`, reporting the actual instant per §8), the binary→three-state Disagreement column (256 comparisons, 29 YES), and the `NEEDS_MUHURTA_EVAL` reclassification. **Two findings surfaced rather than solved:** Karva Chauth at Bedford resolves to *no date* even at ±35 days — a major vrata uncomputable for diaspora users, which is a council question, not a window-widening one; and Sankaṣṭī moved from ~10-of-12 disagreeing to **26 of 26 UNRESOLVED**, i.e. the metric got cleaner while nothing got settled. **Correction:** commits `2780330` and `f9e5419` already contained this remediation, but their messages describe the pre-fix state and list four already-fixed items as "known open" — staged from an earlier review without re-reading the files at commit time. Filed as REVIEW_CHECKLIST §3.9. | Claude (Opus 5) |

### Note on snapshot fixture count

The 972 snapshot fixtures are **54 distinct assertions with 18× redundancy** — all
18 location/profile combinations currently return an identical date, because the
engine has no profile support (D3) and computes everything at Ujjain (D5). This is
expected and is documented inside each fixture.

Their value is as a **tripwire**, not as 972 independent checks: once D5/D3 land,
these combinations *must* diverge, and if they don't, the fix didn't work. The
tripwire has already proved itself once — it confirmed that the 845-line
`index.ts` refactor on 2026-07-30 changed zero festival dates.
