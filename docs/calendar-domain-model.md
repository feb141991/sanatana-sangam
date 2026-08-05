# Calendar Domain Model

**Status:** Draft v1.0.0 · Phase 1 specification
**Owner:** Shoonaya Calendar Engineering
**Applies to:** `packages/panchanga-core`, `packages/dharma-rules`, `src/lib/calendar/*`

---

## 0. Decision markers used across all calendar specs

Every normative statement in these documents carries one marker. Do not implement
a `[S]` item without a recorded scholar decision.

| Marker | Meaning | Who may change it |
|---|---|---|
| `[A]` | **Astronomical.** Objectively determinable from ephemeris. No tradition input. | Engineering, with an ADR |
| `[C]` | **Convention.** A defensible engineering choice among valid options. Must be documented, versioned, and disclosed in output. | Engineering, with an ADR + version bump |
| `[S]` | **Scholar review required.** A religious/observance judgement. Must be ratified by the Calendar Advisory Council before shipping. | Council only (see `source-governance.md`) |

---

## 1. The central law

> **Calculate astronomy once. Apply tradition afterwards. Never mix the two.**

Three layers, strictly ordered, with a one-way dependency:

```
┌─────────────────────────────────────────────────────────┐
│  LAYER A — ASTRONOMICAL FACTS            [A]            │
│  Universal. Location + instant in → numbers out.        │
│  Knows nothing about festivals, regions, or sampradaya. │
└──────────────────────────┬──────────────────────────────┘
                           │ (facts only)
┌──────────────────────────▼──────────────────────────────┐
│  LAYER B — CALENDAR INTERPRETATION       [C] + [S]      │
│  Turns facts into labels under a named calendar profile.│
│  Knows month systems and eras. Knows nothing about      │
│  which festival is observed when.                       │
└──────────────────────────┬──────────────────────────────┘
                           │ (labelled calendar)
┌──────────────────────────▼──────────────────────────────┐
│  LAYER C — OBSERVANCE RULES              [S]            │
│  Decides the civil date and windows for a festival or   │
│  vrata under a named tradition profile. Produces a date │
│  AND its reasoning AND its recognised alternatives.     │
└─────────────────────────────────────────────────────────┘
```

**Layer A must never import from B or C. Layer B must never import from C.**
A violation of this is a defect regardless of whether output looks correct.

### Why this ordering is non-negotiable

The same astronomical instant is described differently by different valid
conventions. If interpretation is baked into the astronomy, you can never serve a
second tradition without recomputing (or worse, without silently mislabelling).
The current codebase demonstrates the failure mode — see §6.

---

## 2. Layer A — Astronomical facts

Deterministic given `(instant, latitude, longitude, elevation)`. Fully specified in
`astronomy-conventions.md`.

| Fact | Unit | Notes |
|---|---|---|
| Solar apparent longitude (tropical) | degrees | |
| Lunar apparent longitude (tropical) | degrees | |
| Ayanāṁśa | degrees | `[C]` — choice of ayanāṁśa is a convention |
| Solar / lunar **sidereal** longitude | degrees | tropical − ayanāṁśa |
| Elongation (moon − sun) | degrees | drives tithi + karana |
| Tithi index + exact start/end instants | 1–30, UTC | boundary = elongation crossing a multiple of 12° |
| Nakshatra index + start/end | 1–27, UTC | moon sidereal ÷ 13°20′ |
| Yoga index + start/end | 1–27, UTC | (sun + moon sidereal) ÷ 13°20′ |
| Karana index + start/end | 1–60, UTC | elongation ÷ 6° |
| Sunrise / sunset | UTC | `[C]` — disc/refraction convention |
| Moonrise / moonset | UTC | may be absent on a given civil date |
| Solar ingress (Sankranti) instants | UTC | sun sidereal crossing a multiple of 30° |
| Lunar phase instants (Amavasya, Purnima) | UTC | elongation crossing 0° / 180° |
| Derived muhurta windows | UTC pairs | Nishita, Pradosha, Madhyahna, Aparahna, Brahma Muhurta, Sandhya |

**All Layer A outputs are stored and passed as UTC instants, never as
local-formatted strings.** Formatting is a presentation concern.

### What is *not* a Layer A fact

`masa` (lunar month name), `paksha` name in a regional language, `samvat` year,
"is this Ekadashi", "is today a festival" — all of these are Layer B or C.
Paksha *as a boolean* (elongation < 180° or ≥ 180°) is Layer A; its *label* is B.

---

## 3. Layer B — Calendar interpretation

Input: Layer A facts + a **calendar profile**. Output: labels. Fully specified in
`calendar-profiles.md`.

| Label | Depends on | Marker |
|---|---|---|
| Lunar month name (chandra-māsa) | month-naming rule + Sankranti containment | `[C]` |
| Month system: Amānta / Pūrṇimānta | profile | `[C]` |
| Adhika Māsa (intercalary) | no Sankranti in the lunar month | `[C]` |
| Kshaya Māsa (decayed) | two Sankrantis in one lunar month | `[C]` |
| Paksha label (Śukla / Kṛṣṇa) | elongation half | `[A]` label of an `[A]` fact |
| Solar month name (Tamil / Malayalam / Bengali / Odia) | profile + Sankranti day-assignment rule | `[C]` `[S]` |
| Era + year (Vikram / Śaka / Kollam / Bengali San / Bikram Sambat / Nanakshahi) | profile epoch + new-year rule | `[C]` |
| Regional month/festival naming | profile locale | `[C]` |

**Key invariant:** the *same* astronomical day, under two different profiles, may
legitimately carry two different month names. That is correct behaviour, not a bug.
Example, Maha Shivaratri:

```
Astronomical day D  (Kṛṣṇa Chaturdaśī, one specific tithi)
  ├─ Amānta profile      → "Māgha Kṛṣṇa Chaturdaśī"
  └─ Pūrṇimānta profile  → "Phālguna Kṛṣṇa Chaturdaśī"
```

Same day. Same tithi. Two valid names.

---

## 4. Layer C — Observance rules

Input: Layer B calendar + a **tradition profile** + location. Output: a civil date,
observance windows, reasoning, and recognised alternatives. Fully specified in
`festival-rule-schema.md`.

A Layer C rule may test conditions such as:

- tithi prevailing at sunrise
- tithi prevailing during Nishita / Pradosha / Madhyahna / Aparahna
- tithi prevailing at moonrise
- nakshatra overlapping a named window
- solar ingress before/after sunset
- *viddha* (piercing) restrictions
- shift to previous / following day
- sampradāya-specific exception

**Layer C must never return a bare date.** Every occurrence carries:
`{ civilDate, windows, ruleVersion, engineVersion, profile, reasons[], alternatives[] }`.

### The alternatives rule `[S]`

When two or more recognised traditions place an observance on different civil
dates, the engine returns **all** of them, marks the user's selected profile as
primary, and never characterises the others as wrong. Product wording is fixed in
`source-governance.md` §6.

---

## 5. Entity model

```
Location            (lat, lon, elevation, tz_id, label)
   │
CalendarProfile     (month_system, era, solar_month_rule, ayanamsha, sunrise_rule, locale)
   │
TraditionProfile    (sampradaya, ekadashi_method, janmashtami_method, paran_rule, …)
   │
   ├── PanchangaDay          — Layer A+B, per (local_date, location, profile)
   │
   └── ObservanceDefinition  — identity + content pointer, tradition-neutral
          └── ObservanceRuleVariant   — (definition, calendar_profile, tradition_profile)
                                        → versioned rule JSON, priority, source refs
                 └── ObservanceOccurrence — resolved (definition, variant, location, year)
                                            → civil date, windows, reasons, confidence
```

Two boundaries matter most:

1. **`ObservanceDefinition` is *not* a date.** It is an identity plus content.
   A definition with a hardcoded Gregorian date is a defect.
2. **A `ObservanceRuleVariant` is data, not code.** Adding a regional variant must
   never require a code change. (Current code violates this — see §6.)

### Content separation

Spiritual content (meaning, deity, scriptural account, puja guidance, fasting
guidance, mantra, regional customs) lives in a **content layer keyed by
`definition_id`**, never inside rule objects. This lets scholars revise meaning
without touching astronomy, and lets astronomy change without re-reviewing prose.

---

## 6. Current-state deviations from this model

Recorded here so the specification is honest about where the code stands as of
this document. Detail and tracking in `CALENDAR_ENGINE_ASSESSMENT.md`.

| # | Deviation | Location | Severity |
|---|---|---|---|
| D1 | **`masaName` is 2 months behind the traditional chandra-māsa.** Derived from solar rashi via `(floor(sunSidereal/30)+11)%12` instead of from lunar-month boundaries + Sankranti containment. User-visible in the Panchang screen today. | `packages/panchang-engine/src/index.ts:427-428` | **High** |
| D2 | **The 118 festival rules were calibrated against the D1 bug rather than the bug being fixed**, so `lunar_masa_name` values are deliberately wrong-by-two. Fixing D1 without migrating rules breaks every lunar festival. | `src/lib/calendar/rules.ts:47-58` (calibration comment) | **High** |
| D3 | No Amānta / Pūrṇimānta distinction exists anywhere. Layer B is effectively absent. | engine-wide | **High** |
| D4 | Rules are evaluated at one synthetic instant per day (`1am UTC ≈ Ujjain sunrise`), not against real local sunrise or any muhurta window. No Nishita/Pradosha/Madhyahna/moonrise conditions exist. | `src/lib/calendar/engine.ts:52-66` | **High** |
| D5 | Every observance is computed for **Ujjain**, then served to all users regardless of location. Layer A is not being run per-user-location for festival resolution. | `src/lib/calendar/engine.ts:4-6, 60` | **High** |
| D6 | Rule parameters live in a TypeScript literal array, not versioned data rows. `observance_definitions.calendar_rule_type` is a descriptive copy the engine never reads. | `src/lib/calendar/rules.ts`; `scripts/seed-observance-definitions.ts:57-71` | Medium |
| D7 | No variant model. Smārta vs Vaiṣṇava Janmāṣṭamī exists only as prose in a migration comment. | `supabase/migrations/20260604110000_*.sql:77` | Medium |
| D8 | ~116 occurrence rows are hand-frozen via SQL with `locked_for_regeneration = true`, so named festivals are largely curated data, not engine output. | `supabase/migrations/20260623004956_*.sql:151-157` | Medium (acceptable interim) |
| D9 | The integrity audit compares the engine against **itself** (recomputed rules vs stored rows), so it cannot detect a wrong rule — only rule drift. | `src/lib/calendar/integrity.ts:126-138` | Medium |
| D10 | Vikram Samvat year rolls over on a hardcoded April 1, ±14 days by the code's own admission. | `packages/panchang-engine/src/index.ts:431-434` | Low |

---

## 7. Package boundaries (target)

```
packages/
  panchanga-core/          ← Layer A only. Zero knowledge of festivals.
    astronomy/             ephemeris adapter, ayanamsha, nutation
    tithi/  nakshatra/  yoga/  karana/
    sunrise/               rise-set solver, muhurta windows
    lunar-month/           Amanta/Purnimanta boundaries, adhika/kshaya   ← Layer B
    solar-month/           Sankranti + regional day-assignment rules     ← Layer B
    timezone/              IANA + historical offsets
  dharma-rules/            ← Layer C only. Imports panchanga-core.
    engine/                condition evaluator, selection, fallback
    schemas/               rule JSON schema + validators
    profiles/              calendar + tradition profile registry
    festivals/             versioned rule variant data
    explainers/            human-readable reason generation
```

`lunar-month/` and `solar-month/` sit in `panchanga-core` for packaging
convenience but are **Layer B**: they take a profile argument. They must not be
called without one, and must never default silently to a region.

The UI imports `dharma-rules` only. The UI must never call `panchanga-core`
directly to derive a festival date.

---

## 8. Glossary

| Term | Definition |
|---|---|
| **Tithi** | Lunar day. 1/30 of a synodic month; each spans 12° of moon−sun elongation. Variable length (~19–26 h). |
| **Paksha** | Fortnight. Śukla (waxing, elongation 0–180°), Kṛṣṇa (waning, 180–360°). |
| **Nakshatra** | Lunar mansion. 1/27 of the sidereal ecliptic = 13°20′. |
| **Yoga** | 1/27 division of (sun + moon) sidereal longitude. |
| **Karana** | Half-tithi, 6° of elongation. 60 per lunar month: 7 movable × 8 + 4 fixed. |
| **Māsa** | Lunar month. |
| **Amānta** | Month system ending at Amāvasyā (new moon). |
| **Pūrṇimānta** | Month system ending at Pūrṇimā (full moon). |
| **Adhika Māsa** | Intercalary lunar month containing no Sankranti. |
| **Kshaya Māsa** | Lunar month containing two Sankrantis; a month name is dropped. |
| **Sankranti** | Solar ingress into a sidereal rashi. |
| **Ayanāṁśa** | Offset between tropical and sidereal zodiac. |
| **Nishita** | Midnight muhurta window (see `astronomy-conventions.md` §7). |
| **Pradosha** | Twilight window beginning at sunset. |
| **Madhyāhna** | Midday division of the daytime. |
| **Aparāhna** | Afternoon division of the daytime. |
| **Brahma Muhurta** | Pre-dawn window, 2 muhurtas before sunrise. |
| **Viddha** | A tithi "pierced" by the preceding tithi at a decisive moment; grounds for shifting observance. |
| **Pāraṇa** | The act/time of breaking a fast. |
| **Sampradāya** | Lineage/tradition governing observance rules. |

---

## 9. Related documents

- `astronomy-conventions.md` — Layer A + the physical constants and conventions
- `calendar-profiles.md` — Layer B + the profile registry
- `festival-rule-schema.md` — Layer C + rule JSON and result contract
- `calculation-examples.md` — worked examples and golden-case format
- `source-governance.md` — sources, review workflow, disagreement policy
- `CALENDAR_ENGINE_ASSESSMENT.md` — current state, gap tracker, phase plan

---

## 10. Engine Precedence & Authority Rule

Two calculation paths co-exist during the D1+D2 live-switch transition:

| Path | Code location | What it computes |
|---|---|---|
| **Corrected Rule Engine** | `src/lib/calendar/engine.ts → calculateObservancesForYearCorrected` | A single panchang snapshot per civil day at Ujjain `1 am UTC ≈ sunrise`. Matches tithi at that sampled instant against corrected `lunar_masa_name` and `lunar_tithi_index`. |
| **Condition Evaluator** | `packages/dharma-rules/src/conditions/evaluator.ts → evaluateVariant` | Computes true local muhurta windows (Nishita, Pradosha, Moonrise, Sunrise, Madhyahna) and checks whether the required tithi/nakshatra prevails, touches, or is present at that window. Timezone-aware; location-dependent. |

### Precedence assignment — per rule class

> **The condition evaluator wins for any rule whose authoritative observance criterion references a time-of-day window** (Nishita, Pradosha, Moonrise, Madhyahna, Arunodaya, Sunrise-at). The rule engine's sunrise-sampled match is an approximation that predates Layer C (Tracker 3.2) and is **not an independent correctness claim** for these rules.

| Rule / Rule Class | Authoritative Engine | Rationale |
|---|---|---|
| **Maha Shivaratri** (`maha-shivaratri`) | **Condition Evaluator** | Nishita-vyāpinī Chaturdaśī rule: the correct tithi must *prevail* through the local Nishita window (~midnight). The engine's sunrise scan misaligns when Chaturdaśī starts after sunrise on the civil day. **Evaluator output: 2026-02-15, not 2026-02-16.** |
| **Krishna Janmashtami** (`krishna-janmashtami`) | **Condition Evaluator** | Tradition-split rule. Smārta requires Aṣṭamī *touching* Nishita. Vaiṣṇava requires Aṣṭamī *at* sunrise with Rohiṇī nakṣatra. The rule engine cannot model either distinction. |
| **Karva Chauth** (`karva-chauth`) | **Condition Evaluator** | Chaturthi must be present at the exact local moonrise instant. Moonrise time varies significantly by longitude and timezone; the Ujjain-only engine is not serviceable for diaspora users. |
| **Sankashti Chaturthi** (`sankashti-chaturthi`) | **Condition Evaluator** | Same moonrise-dependent criterion; recurring monthly. Disagrees with engine ~half the months (engine is off by 1 day when moonrise falls before midnight). |
| **Pradosh Vrat** (`pradosh-vrat`) | **Condition Evaluator** | Trayodaśī must prevail during the local Pradosha window (sunset to sunset + 72 min). The engine scans sunrise, not twilight. |
| **Diwali** (`diwali`) | **Condition Evaluator** | Lakshmi Puja is performed during Pradosha on Amāvasyā. Engine scans sunrise of the Amāvasyā day; Pradosha begins at sunset and may fall on the adjacent civil date. |
| **Dhanteras** (`dhanteras`) | **Condition Evaluator** | Same Pradosha-dependent logic (Trayodaśī Pradosha). |
| **Solar Fixed** (`solar_fixed`) | **Rule Engine** | Solar ingress dates computed at midnight UTC are not muhurta-dependent. |
| **Weekday recurring** (`weekday_recurring`) | **Rule Engine** | Day-of-week criterion; no muhurta dependency. |
| **Simple lunar tithi** (remaining `lunar_tithi` family) | **Rule Engine (provisional)** | These rules check tithi at Ujjain sunrise. They are not muhurta-dependent. However, they remain sunrise-at-Ujjain until D5 (per-location evaluation) is resolved. |

### What this means for the live switch (Stage 3)

1. Rows that carry classification `NEEDS_MUHURTA_EVAL` in `docs/MASA_CORRECTION_DIFF_REPORT.md` are **not settled by the masa correction** and must not be written to the database using the rule engine date. Their final dates must be supplied by the condition evaluator for the user's location.
2. The condition evaluator is the **reference implementation** for all rules in the table above. If the rule engine output and evaluator output disagree, the evaluator wins — this is not a tie to eyeball.
3. `docs/ENGINE_RECONCILIATION_REPORT.md` (generated by `npm run reconcile:engines`) is the standing check. It must be regenerated and reviewed before every Stage 3 push.
4. Wiring the evaluator into `engine.ts` or any materialisation path is **Stage 3 work only** (`AGENTS.md` rule 14).

### What the tests do not catch

- The harness (`verify:harness`) runs the **legacy engine** path and would not catch disagreements in the corrected path.
- The condition evaluator unit tests cover individual conditions but not the full sweep across years.
- `npm run reconcile:engines` is the only gate that surfaces cross-year, cross-location disagreements. It is a **mandatory pre-merge check** for any change to `CANONICAL_RULES`, the condition evaluator, or any muhurta window calculation.
