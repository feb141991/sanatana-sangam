# Calculation Examples & Golden Cases

**Status:** Draft v1.0.0 · Phase 1 specification
**Purpose:** Demonstrate the three-layer model end-to-end, and fix the golden-fixture format.

> **Values marked _illustrative_ are structural placeholders.** No date or time in
> this document is authoritative until it exists as a golden fixture verified
> against a `source-governance.md` Tier 1/2 source. The *reasoning shape* is the
> normative content here, not the numbers.

---

## 1. Mahā Śivarātri — same day, two valid month names

**Teaches:** Layer B labelling divergence with zero Layer A divergence.

### Layer A (universal)
```
Solve: elongation crossings of 12°  →  Kṛṣṇa Chaturdaśī spans [T₁, T₂] UTC
Solve: sunset(d), sunrise(d+1)      →  night length N
Derive: nishita = [sunset + 7·(N/15), sunset + 8·(N/15)]
```

### Layer B (two profiles, identical astronomy)
| Profile | Month system | Label |
|---|---|---|
| `north_indian_purnimanta` | pūrṇimānta | **Phālguna** Kṛṣṇa Chaturdaśī |
| `gujarati_amanta` | amānta | **Māgha** Kṛṣṇa Chaturdaśī |

Per `calendar-profiles.md` §1.2: kṛṣṇa-paksha ⇒ pūrṇimānta name = amānta name + 1.

### Layer C
```
conditions: [ tithi = 14, paksha = krishna,
              tithi_presence { tithi: 14, period: nishita, mode: prevails } ]
```
If Chaturdaśī covers the whole Nishita window on day *d* → observance = *d*.
If it covers Nishita on neither *d* nor *d+1* → `mode: majority` tiebreak, and
**flag for review** rather than guessing.

### Expected output shape
```jsonc
{ "civilDate": "…", "status": "resolved",
  "reasons": [
    { "code": "tithi_prevails_in_window",
      "text": "Kṛṣṇa Chaturdaśī prevailed during Nishita" },
    { "code": "computed_for_location", "text": "Calculated using local Bedford timings" }
  ],
  "alternatives": [
    { "profile": { "calendar": "gujarati_amanta" }, "civilDate": "…same…",
      "monthLabel": "Māgha Kṛṣṇa Chaturdaśī",
      "note": "Same day; amānta month naming differs" }
  ] }
```

**Product point:** the alternative here is a *naming* difference, not a date
difference. The UI must distinguish "different name, same day" from "different
day" — users conflate the two constantly.

---

## 2. Kṛṣṇa Janmāṣṭamī — genuinely different dates `[S]`

**Teaches:** two recognised traditions, two dates, neither wrong. This is the
case the whole variant model exists to serve.

| | Smārta | Vaiṣṇava (Gauḍīya / ISKCON) |
|---|---|---|
| Primary test | Aṣṭamī prevailing at **Nishita** | Aṣṭamī prevailing at **sunrise** (udaya-vyāpinī) |
| Nakshatra | Rohiṇī preferred, not required | Rohiṇī combination weighted heavily |
| Effect | Can land a day **earlier** | Can land a day **later** |

```jsonc
// Variant A
{ "ruleId": "krishna_janmashtami__smarta",
  "appliesTo": { "traditionProfiles": ["smarta", "shaiva", "unspecified"] },
  "conditions": [ { "type": "tithi", "value": 8 },
                  { "type": "paksha", "value": "krishna" },
                  { "type": "tithi_presence", "tithi": 8, "period": "nishita", "mode": "prevails" } ] }

// Variant B
{ "ruleId": "krishna_janmashtami__vaishnava",
  "appliesTo": { "traditionProfiles": ["gaudiya_iskcon", "sri_vaishnava"] },
  "conditions": [ { "type": "tithi", "value": 8 },
                  { "type": "paksha", "value": "krishna" },
                  { "type": "tithi_presence", "tithi": 8, "period": "sunrise", "mode": "at" },
                  { "type": "nakshatra_presence", "nakshatra": "rohini",
                    "period": "sunrise", "mode": "touches" } ] }
```

**Required UI output** (wording from `source-governance.md` §6):

> Two recognised observances are available.
> **Smārta Janmāṣṭamī — 3 September.** Aṣṭamī prevails during Nishita.
> **Vaiṣṇava Janmāṣṭamī — 4 September.** Aṣṭamī prevails at sunrise under the Vaiṣṇava convention.
> Your selected profile: **Vaiṣṇava**.
> *The difference arises from the observance tradition selected and the tithi period used to assign the festival.*

**Current state:** one date, with the split recorded only as prose in a migration
comment (`supabase/migrations/20260604110000_*.sql:77`). This example is the
acceptance test for the variant model.

---

## 3. Ekādaśī — *viddha* and the Smārta/Vaiṣṇava split `[S]`

**Teaches:** the `viddha` condition; why "tithi at sunrise" alone is insufficient.

**Aruṇodaya** = the last 4 ghaṭikās (96 min) before sunrise.

| | Smārta | Vaiṣṇava |
|---|---|---|
| Rule | Ekādaśī prevailing at sunrise is observed | Requires **śuddha** (unpierced) Ekādaśī |
| Viddha test | — | If Daśamī extends into aruṇodaya of the Ekādaśī day, that Ekādaśī is *viddha* |
| On viddha | Observe anyway | **Shift to Dvādaśī** |

```jsonc
{ "ruleId": "ekadashi__vaishnava_suddha",
  "conditions": [
    { "type": "tithi", "value": 11 },
    { "type": "tithi_presence", "tithi": 11, "period": "sunrise", "mode": "at" },
    { "type": "viddha", "piercedBy": 10, "atPeriod": "arunodaya", "action": "shift_next" }
  ],
  "paran": { "policy": "vaishnava_strict",
             "notBefore": "sunrise", "avoid": "hari_vasara_first_quarter" } }
```

**Pāraṇa matters as much as the fast date.** A Vaiṣṇava pāraṇa must occur on
Dvādaśī after sunrise, avoiding the first quarter (*Hari Vāsara*), and before
Dvādaśī ends. The result contract carries `windows.paran` for exactly this — a
date without a pāraṇa window is an incomplete answer for a fasting user.

---

## 4. Karva Chauth — location actually changes the answer

**Teaches:** why `observanceLocation` must be the user's real place. **The
highest-value example for the diaspora audience.**

```jsonc
{ "ruleId": "karva_chauth__north_indian",
  "conditions": [
    { "type": "lunar_month", "value": "kartika", "monthSystem": "purnimanta" },
    { "type": "paksha", "value": "krishna" },
    { "type": "tithi", "value": 4 },
    { "type": "tithi_presence", "tithi": 4, "period": "moonrise", "mode": "at" }
  ],
  "observanceWindows": [ { "name": "moonrise", "from": "moonrise", "to": "moonrise" } ],
  "locationDependent": true }
```

Same astronomical tithi; **moonrise differs by location**:

| Location | Moonrise (local) | Consequence |
|---|---|---|
| Delhi | ~evening IST | Fast broken at Delhi moonrise |
| Bedford, UK | different local clock time **and** different position within the tithi | Fast broken at Bedford moonrise |

A UK user shown Delhi's moonrise time breaks their fast at the wrong moment —
possibly while Chaturthī has already ended locally. **This is the concrete harm
caused by the current engine computing every occurrence at Ujjain
(`src/lib/calendar/engine.ts:60`).**

Edge case to test: **no moonrise on the civil date.** Per
`astronomy-conventions.md` §3.1 the solver returns `null`; the rule must extend to
the following night and report the true instant, never a fabricated one.

---

## 5. Makar Sankranti — one ingress, several civil dates `[S]`

**Teaches:** `solar_ingress` + regional day-assignment.

Layer A gives **one** instant: Sun enters sidereal Makara.

| Profile | Rule | Civil date |
|---|---|---|
| `tamil_solar` | `sunset_rule` | ingress before sunset → same day, else next |
| `malayalam_solar` | `aparahna_rule` | before aparāhna start → same day, else next |
| `bengali_solar` | `midnight_rule` | before midnight → next day |
| `odia` | `same_day_rule` | ingress day |

Regional names for astronomically related observances — **do not flatten into one
card**:

| Region | Name |
|---|---|
| Punjab | Māghī |
| Tamil Nadu | Poṅgal (multi-day) |
| Assam | Māgh Bihu |
| Gujarat | Uttarāyaṇ |
| North India (general) | Makar Sankrānti |

These share an astronomical cause, differ culturally, and may span different day
counts. Model them as **separate definitions with a shared `astronomicalAnchor`**,
not as one festival with aliases.

---

## 6. Edge cases that must have fixtures

| # | Case | What it must prove |
|---|---|---|
| E1 | Adhika Māsa year | Festivals route to *nija* month per `adhikaPolicy`; adhika month labelled |
| E2 | Kṣaya Māsa year | No crash; `kshaya_masa` diagnostic; documented routing |
| E3 | Tithi spanning two sunrises | `majority` / selection policy applied and *explained* |
| E4 | Tithi absent at any sunrise (kṣaya tithi) | Fallback fires; `confidence: low` |
| E5 | Vṛddhi tithi (two sunrises) | Single date chosen with a stated reason |
| E6 | Sankranti within minutes of midnight | Day-assignment rule decides; no rounding drift |
| E7 | Moonrise after local midnight | Correct Vedic-day attribution (`astronomy-conventions.md` §4) |
| E8 | UK DST transition night | Windows correct across the shift |
| E9 | **Bedford, June** | Brahma Muhurta ≈ 56/28 min before sunrise, **not** 96/48 |
| E10 | Reykjavík, midsummer | `latitude_proxy` flag set and disclosed |
| E11 | Sydney (southern hemisphere) | Seasonal windows not northern-hemisphere-assumed |
| E12 | International Date Line | Civil-date assignment stable |
| E13 | Pre-1947 Indian timezone | Historic tzdb offsets honoured |

E9 is currently a **live defect** — Brahma Muhurta is hardcoded to 96/48 minutes
(`packages/panchang-engine/src/index.ts:414-415`), which is only correct for a
12-hour night.

---

## 7. Golden fixture format `[C]`

One JSON file per case in `packages/dharma-rules/__fixtures__/golden/`.

```jsonc
{
  "caseId": "maha_shivaratri__bedford__2027__purnimanta_smarta",
  "festivalId": "maha_shivaratri",
  "year": 2027,
  "location": { "label": "Bedford, UK", "lat": 52.135, "lon": -0.467, "tz": "Europe/London" },
  "profile": { "calendar": "north_indian_purnimanta", "tradition": "smarta" },

  "expected": {
    "civilDate": "2027-03-06",
    "monthLabel": "Phālguna Kṛṣṇa Chaturdaśī",
    "windows": { "puja": { "startLocal": "23:58", "endLocal": "00:46" } },
    "reasonCodes": ["tithi_prevails_in_window", "computed_for_location"],
    "alternativeCount": 1
  },

  "tolerance": { "windowMinutes": 2 },

  "source": {
    "tier": 1,
    "ref": "src_rashtriya_panchang_2027",
    "citation": "Rashtriya Panchang 2027, p. …",
    "verifiedBy": "council_2027_q1",
    "verifiedOn": "2026-11-02"
  },
  "reasoning": "Chaturdaśī covers the full Nishita window on 6 Mar at Bedford.",
  "approved": true
}
```

### Rules `[C]`

1. A fixture without a `source` is not a golden case — it is a snapshot of current
   behaviour and must live in a separate `__fixtures__/snapshot/` directory. Never
   mix the two.
2. **Dates compare exactly. Times compare within `tolerance.windowMinutes`.**
3. Every approved rule variant needs ≥ 1 golden case (CI-enforced,
   `festival-rule-schema.md` §7).
4. **Every rule change re-runs every golden case.** A diff is a review item, never
   an auto-accept.
5. Changing an `expected` value requires the same council approval as changing the
   rule.

### Minimum launch coverage `[C]`

| Axis | Minimum |
|---|---|
| Festivals | The 18 Phase-2 observances |
| Years | 3 consecutive (incl. one adhika-māsa year) |
| Locations | Ujjain · Delhi · Chennai · Bedford · New York · Sydney |
| Profiles | `north_indian_purnimanta`, `gujarati_amanta`, `tamil_solar`, `global_sanatan` |
| Traditions | `smarta`, `gaudiya_iskcon` |
| Edge cases | All of §6 |

**Current coverage: zero.** No calendar/festival test files exist in the repo. This
is the largest quality gap and the cheapest to begin closing — see
`CALENDAR_ENGINE_ASSESSMENT.md`.
