# Festival Rule Schema (Layer C)

**Status:** Draft v1.0.0 · Phase 1 specification
**Applies to:** `packages/dharma-rules/{schemas,engine,festivals}`
**Markers:** `[A]` astronomical · `[C]` convention · `[S]` scholar review

Rules are **versioned data**, never code. Adding a regional or sampradāya variant
must never require an engine change.

---

## 1. Object model

```
ObservanceDefinition          identity + content pointer (tradition-neutral)
   └── ObservanceRuleVariant  (definition × calendarProfile × traditionProfile)
          └── evaluated → ObservanceOccurrence (+ reasons + alternatives)
```

### 1.1 `ObservanceDefinition`

```jsonc
{
  "festivalId": "maha_shivaratri",
  "canonicalName": "Mahā Śivarātri",
  "category": "major",              // major | vrat | regional | commemoration
  "tradition": "hindu",
  "contentId": "content_maha_shivaratri",   // → content layer, NEVER inline
  "locationDependency": "full",     // full | day_boundary_only | none
  "active": true
}
```

A definition **never** contains a date, a tithi, or a rule. If it does, that is a
defect (see AGENTS.md rule 1).

### 1.2 `ObservanceRuleVariant`

```jsonc
{
  "ruleId": "maha_shivaratri__purnimanta__smarta",
  "festivalId": "maha_shivaratri",
  "version": "1.0.0",
  "calendarSystem": "lunisolar",          // lunisolar | solar | fixed_civil | relative

  "appliesTo": {
    "calendarProfiles": ["north_indian_purnimanta", "nepali_bikram"],
    "traditionProfiles": ["smarta", "shaiva", "unspecified"]
  },
  "priority": 100,
  "locationDependent": true,

  "conditions": [
    { "type": "lunar_month", "value": "phalguna", "monthSystem": "purnimanta" },
    { "type": "paksha",      "value": "krishna" },
    { "type": "tithi",       "value": 14 },
    { "type": "tithi_presence", "tithi": 14, "period": "nishita", "mode": "prevails" }
  ],

  "selection":  { "policy": "last_match" },
  "fallback":   { "policy": "tradition_specific", "onNoMatch": "report_unresolved" },
  "adhikaPolicy": "nija",
  "kshayaPolicy": "follow_nija",

  "observanceWindows": [
    { "name": "nishita_puja", "from": "nishita.start", "to": "nishita.end" },
    { "name": "prahar_1", "from": "sunset", "to": "sunset+0.25*night" }
  ],
  "paran": { "policy": "next_sunrise_after", "notBefore": "sunrise+0" },

  "sources": ["src_rashtriya_panchang", "src_nirnaya_sindhu"],
  "review": {
    "status": "approved",             // draft | technical_ok | in_review | approved | disputed
    "reviewedBy": "council_2027_q1",
    "effectiveFrom": "2027-01-01",
    "lastReviewed": "2026-11-02",
    "notes": "Nishita-vyāpinī rule; see source §4.2"
  }
}
```

---

## 2. Condition vocabulary `[C]`

The evaluator supports exactly these types. Adding a type is an engine change and
requires an ADR; adding a *rule* using existing types is data only.

### 2.1 Calendar-position conditions

| Type | Fields | Semantics |
|---|---|---|
| `lunar_month` | `value`, `monthSystem` | Month name under the stated system. `monthSystem` is **mandatory** — an unqualified month name is ambiguous. |
| `paksha` | `value: shukla\|krishna` | |
| `tithi` | `value: 1..15` + paksha (or `1..30` absolute) | Canonical scheme for rule authoring: within-paksha index 1..15 (1=Pratipada, 8=Ashtami, 14=Chaturdashi, 15=Purnima/Amavasya) qualified by `paksha` (`shukla` \| `krishna`). Evaluator normalises absolute 1..30 at condition boundary. |
| `nakshatra` | `value` | |
| `yoga` | `value` | |
| `karana` | `value` | |
| `vara` | `value: 0..6` | Weekday of the **Vedic day**, not the civil date. |
| `solar_month` | `value`, `profileRule` | Solar-calendar month (see `calendar-profiles.md` §2). |
| `solar_day` | `value` | Day index within the solar month. |

### 2.2 Prevalence conditions — the core of Layer C

| Type | Fields | Semantics |
|---|---|---|
| `tithi_presence` | `tithi`, `period`, `mode` | The named tithi is present in the window. |
| `nakshatra_presence` | `nakshatra`, `period`, `mode` | |
| `yoga_presence` | `yoga`, `period`, `mode` | |

`period` ∈ `sunrise` · `sunset` · `midday` · `moonrise` · `moonset` ·
`nishita` · `pradosha` · `madhyahna` · `aparahna` · `brahma_muhurta` · `abhijit`
(instant windows collapse to a point; see `astronomy-conventions.md` §7).

`mode`:

| Mode | Meaning |
|---|---|
| `at` | Holds at the instant (for point periods such as `sunrise`, `moonrise`). |
| `prevails` | Holds for the **entire** window. |
| `touches` | Overlaps the window at all. |
| `majority` | Occupies > 50 % of the window. Used to disambiguate two-day spans. |

### 2.3 Solar-event conditions

| Type | Fields | Semantics |
|---|---|---|
| `solar_ingress` | `rashi`, `relativeTo`, `comparison` | Sankranti into `rashi` occurs before/after `sunset` \| `midnight` \| `aparahna` \| `sunrise`. Implements the regional day-assignment rules. |

### 2.4 Restriction and shift conditions

| Type | Fields | Semantics |
|---|---|---|
| `viddha` | `piercedBy`, `atPeriod`, `action` | The target tithi is "pierced" by `piercedBy` at `atPeriod`. `action` ∈ `shift_next` \| `shift_prev` \| `disqualify`. This is what separates Smārta from Vaiṣṇava Ekādaśī. `[S]` |
| `shift` | `days`, `condition?` | Unconditional or conditional day shift. |
| `relative_to` | `festivalId`, `offsetDays` | Resolved in a second pass after all absolute rules. |
| `sampradaya_exception` | `traditionProfile`, `override` | Escape hatch; **must** carry a `sources[]` entry and `review.status: approved`. |

---

## 3. Selection, fallback, ambiguity `[C]`

### 3.1 Selection policies

| Policy | Behaviour |
|---|---|
| `first_match` | Earliest candidate in the year. |
| `last_match` | Latest candidate. (Dark-half tithis spanning two lunar months.) |
| `all_recurring` | Every match — for Ekādaśī, Pradoṣa, Sankaṣṭī etc. |
| `nearest_to_anchor` | Nearest candidate to a named anchor festival. |

### 3.2 Ambiguity is never resolved silently `[C]`

If, after selection, **more than one candidate remains** for a non-recurring rule:

1. Do **not** pick one.
2. Return `status: 'ambiguous'` with all candidates and their reasons.
3. Emit a `multiple_candidates` diagnostic for the review queue.
4. The UI shows the pending-review state, not a guessed date.

The current engine silently applies `prefer_last_match`
(`src/lib/calendar/rules.ts:20-26`) as a per-rule boolean. That flag maps onto
`selection.policy: 'last_match'` — but it must additionally record *why* the
policy applies, so the reason string is derivable.

### 3.3 Variant priority `[C]`

Most specific wins:

```
1. calendarProfile AND traditionProfile both matched   (specificity 3)
2. traditionProfile matched, calendar wildcard         (specificity 2)
3. calendarProfile matched, tradition wildcard         (specificity 1)
4. global default                                      (specificity 0)
```

Ties broken by numeric `priority` (higher wins). **A remaining tie is a data
defect** — fail the build, do not pick arbitrarily.

### 3.4 Alternatives `[S]`

After resolving the user's variant, the engine evaluates every *other* variant of
the same `festivalId` whose `appliesTo` intersects a **recognised** profile. Any
that yields a different `civilDate` is returned in `alternatives[]`.

Alternatives are **informational and neutral**. Wording is fixed in
`source-governance.md` §6. The engine must never emit a field implying another
tradition is incorrect.

---

## 4. Result contract `[C]`

```jsonc
{
  "festivalId": "maha_shivaratri",
  "status": "resolved",              // resolved | ambiguous | unresolved
  "civilDate": "2027-03-06",
  "vedicDay": { "start": "2027-03-06T00:41:00Z", "end": "2027-03-07T00:40:00Z" },

  "windows": {
    "observance": { "start": "...Z", "end": "...Z" },
    "puja":       { "start": "...Z", "end": "...Z", "name": "nishita_puja" },
    "paran":      { "start": "...Z", "end": "...Z" }
  },

  "location":  { "label": "Bedford, UK", "lat": 52.135, "lon": -0.467, "tz": "Europe/London" },
  "profile":   { "calendar": "north_indian_purnimanta", "tradition": "smarta" },

  "versions": {
    "panchangaCore":   "1.0.0",
    "calendarProfile": "1.0.0",
    "ruleEngine":      "2.0.0",
    "rule":            "1.0.0"
  },

  "reasons": [
    { "code": "tithi_prevails_in_window",
      "text": "Kṛṣṇa Chaturdaśī prevailed during Nishita",
      "detail": { "tithi": 14, "window": "nishita",
                  "from": "2027-03-06T23:58:00Z", "to": "2027-03-07T00:46:00Z" } },
    { "code": "computed_for_location",
      "text": "Calculated using local Bedford timings" }
  ],

  "alternatives": [
    { "profile": { "calendar": "gujarati_amanta", "tradition": "smarta" },
      "civilDate": "2027-03-06",
      "monthLabel": "Māgha Kṛṣṇa Chaturdaśī",
      "note": "Same day; amānta month naming differs" }
  ],

  "confidence": "high",              // high | medium | low
  "diagnostics": []
}
```

**Mandatory:** `versions`, `reasons`, `profile`, `location`. An occurrence lacking
any of these must not be persisted or displayed (AGENTS.md rule 6).

`reasons[].code` is the stable, localisable key. `text` is English fallback only.

### Confidence `[C]`

| Level | Criteria |
|---|---|
| `high` | Rule `review.status: approved`, single candidate, golden case exists and passes |
| `medium` | Approved rule, single candidate, no golden case |
| `low` | Rule in `draft`/`in_review`, or a fallback policy fired, or a `latitude_proxy` flag is set |

---

## 5. Persistence mapping

| Schema concept | Table |
|---|---|
| `ObservanceDefinition` | `observance_definitions` (exists) |
| `ObservanceRuleVariant` | **`observance_rule_variants` (new)** — `rule_json`, `priority`, `version`, `review_status`, `source_ids[]` |
| `CalendarProfile` / `TraditionProfile` | **`calendar_profiles`, `tradition_profiles` (new)** |
| `ObservanceOccurrence` | `observance_occurrences` (exists; add `variant_id`, `calendar_profile_id`, `location_id`, `reasons_json`, `windows_json`) |
| Sources | **`source_references` (new)** |

`observance_occurrences` already carries `calculation_version`,
`verification_status`, `manual_date_override`, `locked_for_regeneration`,
`source_provenance` — keep all of it. The curated-and-locked mechanism is the
correct way to let a council decision override the engine, and must survive the
migration.

**Uniqueness** becomes `(definition_id, variant_id, location_id, year)` — or
`(…, date)` for recurring rules. Today it is `(definition_id, year)`, which
structurally cannot hold two profiles' dates. This is the schema change that
unlocks everything in the product spec.

---

## 6. Migration from `CANONICAL_RULES` `[C]`

The existing 118 rules map mechanically onto the new schema:

| Current `rule_family` | New conditions |
|---|---|
| `solar_fixed` | `solar_month` + `solar_day` |
| `lunar_tithi` | `lunar_month` + `tithi` (+ `tithi_presence@sunrise`, `mode: at`) |
| `lunar_tithi_recurring` | `tithi` ∈ `recurring_tithi_indices`, `selection: all_recurring` |
| `weekday_recurring` | `vara`, `selection: all_recurring` |
| `nakshatra_based` | `nakshatra` + `nakshatra_presence` |
| `regional_calendar` | `solar_month` + `solar_day` under the Nanakshahi profile |
| `relative_to_other_observance` | `relative_to` |
| `prefer_last_match: true` | `selection.policy: 'last_match'` |
| `allow_skipped_tithi: true` | **Obsolete** — an artefact of once-per-day sampling. Real boundary solving removes the need. |

**Migration is blocked on `calendar-profiles.md` §1.5.** Every rule's
`lunar_masa_name` is currently expressed in the buggy engine's vocabulary. The
migration must, in one atomic change:

1. implement correct amānta/pūrṇimānta month determination,
2. rewrite all 118 `lunar_masa_name` values to true month names + explicit
   `monthSystem`,
3. re-materialise, and
4. diff every resulting date against the previous stored dates, with **every**
   change individually explained and reviewed.

Any date that changes without an explanation is a regression, not an improvement.

---

## 7. Validation

- Rule JSON validated against a published JSON Schema at build time; invalid rules
  fail CI.
- Every rule with `review.status: approved` **must** have ≥ 1 golden case
  (`calculation-examples.md` §7).
- Every rule must declare ≥ 1 `sources[]` entry.
- CI fails on: unresolvable priority tie · condition type not in §2 ·
  `lunar_month` without `monthSystem` · approved rule with no golden case.
