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
| **D5** | **Every occurrence computed at Ujjain and served to all users.** Diaspora users get Indian timings. | `engine.ts:4-6, 60` | **High** |
| **D6** | Brahma Muhurta hardcoded to sunrise −96/−48 min; correct only for a 12-hour night. In Bedford in June the true window is ≈ −56/−28 min. | `panchang-engine/src/index.ts:414-415` | Medium |
| **D7** | Ayanāṁśa is a local polynomial fit, not the Lahiri definition; no stated valid range. | `panchang-engine/src/index.ts:161-164` | Medium |
| **D8** | Vikram Samvat rolls over on a hardcoded 1 April ("±14 days" per its own comment). | `panchang-engine/src/index.ts:431-434` | Low |
| **D9** | Rule parameters live in a TS literal, not versioned data. `calendar_rule_type` in the DB is a descriptive copy the engine never reads. | `rules.ts`; `scripts/seed-observance-definitions.ts:57-71` | Medium |
| **D10** | No variant model. Smārta vs Vaiṣṇava Janmāṣṭamī exists only as prose in a migration comment. | `migrations/20260604110000_*.sql:77` | Medium |
| **D11** | Integrity audit compares the engine **against itself** — structurally cannot detect a wrong rule. | `integrity.ts:126-138` | Medium |
| **D12** | Audit findings are never persisted; the "166 engine mismatch" figure exists only in a transient cron response/notification. | `api/cron/calendar-health/route.ts:132-137` | Medium |
| **D13** | LLM output used as a verification mechanism. Not a valid source (`source-governance.md` §6). | `src/lib/festival-verify.ts` | Medium |
| **D14** | No moonrise/moonset computation at all → Karva Chauth / Sankaṣṭī cannot be correct. | engine-wide | Medium |
| **D15** | Uniqueness is `(definition, year)` — structurally cannot store two profiles' dates. | `observance_occurrences` | **High** (blocker) |
| **D16** | Nanakshahi hardcoded to the 2003 fixed-solar calendar with no system label. | `panchang-engine/src/index.ts:70-83` | Low `[S]` |
| **D17** | Zero calendar tests, zero golden fixtures, zero external validation. | repo-wide | **High** |

---

## 3. Live tracker

Legend — ⬜ not started · 🟡 in progress · ✅ done · ⏸ blocked · 🔬 needs council

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
| 2.1 | Extract package; Layer-A/B boundary enforced | ⬜ | all | Module still lives inside `packages/panchang-engine`; extraction deferred |
| 2.2 | Ayanāṁśa: true Lahiri + valid range (D7) | ⬜ | | `lahiriAyanamsha` re-exported unchanged — still the J2000 polynomial fit, no valid-range guard |
| 2.3 | Tolerance-based boundary solver (≤60 s) | 🟡 | | `lunar-month/astronomy.ts` `solveBoundary`/`solveBoundaryBefore` use `TOLERANCE_MS = 60_000` per conventions §1.2. **Legacy `index.ts:350` still 45 fixed iterations — deliberately untouched** (changing it would alter existing output) |
| 2.4 | Moonrise / moonset (D14) | ⬜ | Karva Chauth | Verified absent: zero references engine-wide |
| 2.5 | Variable muhurta windows: Nishita, Pradosha, Madhyāhna, Aparāhna, Brahma Muhurta (D6) | ⬜ | Layer C | Verified absent: zero references engine-wide. **Largest remaining Layer-A gap** |
| 2.6 | **Amānta/Pūrṇimānta lunar-month determination (D1/D3)** | 🟡 | **everything** | `lunar-month/` — `findAmantaMonth`, `classifyLunarMonth`, `MonthSystem`, `findNewMoon/FullMoonBefore/After`, `findSankrantisBetween`; unit + invariant tests (`7ec3f2d`, `a1bc616`, `16c14fa`). **Implementation done; 🟡 pending sourced golden validation only** |
| 2.7 | Adhika / Kṣaya māsa | 🟡 | | `classifyLunarMonth` handles both; classification corrected in `4fbd025`. 🟡 pending sourced golden validation |
| 2.8 | Solar months + regional day-assignment (P1) | ⏸ 🔬 | Tamil/Malayalam profiles | |
| 2.9 | Era systems + true new-year roll-over (D8) | ⬜ | | |
| 2.10 | Vedic-day boundary rule | ⬜ | Layer C | |
| 2.11 | High-latitude policy + `latitude_proxy` flag | ⬜ | UK/Nordic users | |

### Phase 3 — `dharma-rules` (Layer C)

| # | Item | Status | Blocks | Evidence |
|---|---|---|---|---|
| 3.1 | Rule JSON schema + build-time validation | ⬜ | | |
| 3.2 | Condition evaluator incl. prevalence + `viddha` (D4) | ⬜ | | |
| 3.3 | `calendar_profiles` / `tradition_profiles` tables | ⬜ | | |
| 3.4 | **`observance_rule_variants` table + uniqueness change (D15)** | ⬜ | variants | |
| 3.5 | `source_references` table | ⬜ | governance | |
| 3.6 | Per-location evaluation (D5) | ⬜ | diaspora correctness | |
| 3.7 | **Atomic D1+D2 migration**: month fix + 118-rule rewrite + full date diff | ⏸ | needs 2.6 | |
| 3.8 | Alternatives + `reasons[]` in result contract | ⬜ | "Why today?" | |
| 3.9 | Ambiguity → review queue, never silent pick | ⬜ | | |
| 3.10 | Rules as data, not TS literals (D9) | ⬜ | | |

### Phase 4 — Validation & governance

| # | Item | Status | Evidence |
|---|---|---|---|
| 4.1 | Golden fixture harness (D17) | ✅ | `packages/dharma-rules/`. Verified running: **988 passed / 216 skipped / 2.39 s**. Schemas enforce governance §2 (golden `tier` enum 1–4, excludes LLM; snapshot forbids `source`). Harness re-runs the real engine, not file replay. Wired into `ci.yml`. *Harness complete; sourced coverage is 4.2* |
| 4.2 | Minimum launch coverage (`calculation-examples.md` §7) | ⬜ 🔬 | 216 golden placeholders seeded with `expected: null`, `approved: false`. **Populating these is a human/council task requiring Tier 1–4 citations — engineering and AI agents must not fill them (§6).** Now the gate on Phase 3 |
| 4.3 | Astronomical validation vs Tier-1 sources, 12 cities | ⬜ | |
| 4.4 | Edge-case fixtures E1–E13 | ⬜ | |
| 4.5 | Persist integrity findings (D12) | ⬜ | |
| 4.6 | Demote AI verifier to triage-only (D13) | ⬜ | |
| 4.7 | Council workflow + review states live | 🔬 | |

### Phase 5 — Profiles & product surfaces

| # | Item | Status | Evidence |
|---|---|---|---|
| 5.1 | Launch calendar profiles (10) | ⬜ | |
| 5.2 | Launch tradition profiles (7) | ⬜ | |
| 5.3 | Onboarding Q1–Q5 (location, region, sampradāya, scope, language) | ⬜ | |
| 5.4 | Home tradition vs observance location as separate fields | ⬜ | |
| 5.5 | Local / Temple / Bharat-reference modes | ⬜ | |
| 5.6 | "Why today?" explanation card | ⬜ | |
| 5.7 | Two-recognised-observances UI + standing disclaimer | ⬜ | |
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

---

## 6. Change log

| Date | Change | By |
|---|---|---|
| 2026-07-30 | Baseline assessment + Phase 1 specification set created | Claude (Opus 5) |
| 2026-07-30 | Lunar-month module landed (2.6/2.7/2.3 → 🟡); golden harness landed and verified (4.1 → ✅, 988 pass / 2.39 s). Review found and fixed: unreported `package.json` regression breaking `corpus:validate-indexes`, and an unmemoized engine call making the suite unrunnable (8.1 min → 2.39 s). Verified `masaName` output byte-identical after an 845-line `index.ts` refactor — the D1/D2 landmine held | Claude (Opus 5) + Antigravity |

### Note on snapshot fixture count

The 972 snapshot fixtures are **54 distinct assertions with 18× redundancy** — all
18 location/profile combinations currently return an identical date, because the
engine has no profile support (D3) and computes everything at Ujjain (D5). This is
expected and is documented inside each fixture.

Their value is as a **tripwire**, not as 972 independent checks: once D5/D3 land,
these combinations *must* diverge, and if they don't, the fix didn't work. The
tripwire has already proved itself once — it confirmed that the 845-line
`index.ts` refactor on 2026-07-30 changed zero festival dates.
