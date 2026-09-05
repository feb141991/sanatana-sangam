# Astronomy Conventions

**Status:** Draft v1.0.0 · Phase 1 specification
**Applies to:** `packages/panchanga-core` (Layer A)
**Markers:** see `calendar-domain-model.md` §0 — `[A]` astronomical · `[C]` convention · `[S]` scholar review

This document fixes every physical convention the engine depends on. Any change
to a `[C]` value is a breaking change: it requires an ADR, an engine version bump,
re-materialisation of stored occurrences, and a full golden-case re-run.

---

## 1. Reference frame and ephemeris

| Item | Decision | Marker |
|---|---|---|
| Time scale (input) | UTC | `[A]` |
| Time scale (dynamics) | TT, via ΔT correction from UTC | `[A]` |
| Julian date | JDE (Julian Ephemeris Day) for all position calls | `[A]` |
| Coordinate frame | Apparent geocentric ecliptic longitude of date, including nutation and aberration | `[C]` |
| Topocentric correction | **Not applied** to longitudes for tithi/nakshatra/yoga/karana. Applied only to rise/set. | `[C]` |

**Rationale for geocentric `[C]`:** Traditional Indian panchanga (and the
*Rashtriya Panchang*) computes tithi from geocentric positions. Lunar parallax is
up to ~1°, which would shift tithi boundaries by up to ~2 hours if applied — a
change that would disagree with every printed panchang. Do not "improve" this.

### 1.1 Ephemeris source

| Option | Accuracy (moon λ) | Licence | Verdict |
|---|---|---|---|
| `astronomia` (current) | ~10″ (Meeus/ELP truncated) | MIT | **Acceptable for v1** `[C]` |
| Astronomy Engine | ~1″ | MIT | Preferred upgrade path |
| Swiss Ephemeris | <0.001″ | AGPL **or** paid commercial | Requires licence decision before use |
| JPL DE440 | reference | public domain data, large | Validation only |

**Decision `[C]`:** ship v1 on the current MIT-licensed engine. Swiss Ephemeris
must not be introduced without a recorded commercial-licence decision — the
existing `PlannedPanchangPrecisionEngine` correctly refuses to run with
`licenseMode: 'undecided'` (`packages/panchang-engine/src/index.ts:913`). Keep that guard.

### 1.2 Precision budget — why this determines date correctness

Rates of change (mean):

| Quantity | Rate | Time per 0.01° |
|---|---|---|
| Moon longitude | 13.176°/day | 1.1 min |
| Sun longitude | 0.9856°/day | 14.6 min |
| **Elongation (tithi)** | **12.19°/day** | **1.2 min** |
| Sun+Moon (yoga) | 14.16°/day | 1.0 min |

A tithi boundary landing within *n* minutes of sunrise means any boundary error
> *n* **flips the festival date**. Precision is therefore not a nicety.

**ADR 2026-08-08 — solar ephemeris moved to full VSOP87 (D30).**
`getSolarApparentLongitude` called Meeus ch. 25's truncated series (~0.01° stated
accuracy). Measured worst error over 2026–2028 was **27.3″** against astronomia's
own VSOP87, and **24.0″** against JPL Horizons on 2026-03-20 — two independent
references agreeing. Against the 12.2″ Sankranti budget below that is **2.2×
over**, and it leaked into tithi through the elongation (33.1″ vs 30.6″).
Now uses `solar.apparentVSOP87`, which applies the same nutation and aberration,
so the **reference frame is unchanged** — this is a precision fix, not a
convention change, and it moves us *into* compliance with the tolerances that
were already `[C]`. Date impact measured before landing: across 1096 days at the
rule engine's own evaluation instant, one index changed (2026-03-13 tithi 23→24)
and no rule can fire there. `verify:harness` stayed at 988/216.
The **Moon deliberately remains on Meeus ch. 47** — 6.5″ worst against a 61.2″
budget, so switching it would be churn with real risk to the moonrise fixtures.

**Required tolerances `[C]`:**

| Quantity | Max error | Implied longitude error |
|---|---|---|
| Tithi / karana boundary | ≤ 60 s | 0.0085° elongation |
| Nakshatra / yoga boundary | ≤ 120 s | 0.017° sidereal |
| Sunrise / sunset | ≤ 30 s | — |
| Moonrise / moonset | ≤ 120 s | — |
| Sankranti instant | ≤ 300 s | 0.0034° solar |

Note: **tithi is immune to ayanāṁśa error** (it is a *difference* of two tropical
longitudes, so ayanāṁśa cancels). Nakshatra, yoga, and lunar-month naming are
**not** immune. Budget accordingly.

---

## 2. Ayanāṁśa

| Item | Decision | Marker |
|---|---|---|
| System | **Lahiri (Chitrapakṣa)** | `[C]` |
| Authority | Indian Calendar Reform Committee (1955); used by *Rashtriya Panchang* and the *Indian Astronomical Ephemeris* | — |
| Definition | The sidereal zero-point such that the star Chitra (Spica) has sidereal longitude 180° | `[A]` |
| Value at J2000.0 | ≈ 23°51′11″ (23.8531°) | `[A]` |
| Precession rate | ≈ 50.29″/yr (≈ 1.3969°/century) | `[A]` |
| Alternatives exposed | Raman, Krishnamurti — **selectable per calendar profile, never the default** | `[C]` |

**Current implementation gap.** `lahiriAyanamsha()`
(`packages/panchang-engine/src/index.ts:161-164`) is a cubic polynomial fitted
around J2000. It is adequate near the present epoch but is **not** the Lahiri
definition and will drift for historical or far-future dates. Required for v1:
replace with either (a) the Swiss-Ephemeris-equivalent Lahiri series, or (b) an
explicitly documented polynomial with a stated valid range and a hard error
outside it. Silently extrapolating is not acceptable.

**Ayanāṁśa is a profile field, not a global constant.** See `calendar-profiles.md`.

---

## 3. Sunrise and sunset

| Item | Decision | Marker |
|---|---|---|
| Definition | **Upper limb** of the solar disc on the true horizon, **with** standard atmospheric refraction | `[C]` |
| Geometric zenith distance | 90°50′ (altitude −0°50′) | `[C]` |
| Refraction model | Standard 34′ at horizon; disc semi-diameter 16′ | `[C]` |
| Elevation / horizon dip | **Ignored by default.** Optional per-location override; dip ≈ 1.76′ × √(h/m) | `[C]` |
| Atmospheric conditions | Standard (1010 hPa, 10 °C) — not modelled per-day | `[C]` |

This matches the convention used by mainstream Indian panchangas and is what the
existing fallback already assumes (`90.833°`,
`packages/panchang-engine/src/index.ts:239`). **Do not switch to centre-of-disc**
without a scholar decision — it shifts sunrise by ~1–2 minutes, which can flip a
date when a tithi boundary is near sunrise.

### 3.1 Moonrise and moonset

| Item | Decision | Marker |
|---|---|---|
| Definition | Upper limb with refraction, **topocentric** (parallax applied) | `[C]` |
| Absent events | A civil date may legitimately contain **no** moonrise. Return `null`, never a fabricated time. | `[A]` |

Moonrise is required for Karva Chauth, Sankashti Chaturthi, and any
`tithi_at_moonrise` condition. It is currently **not implemented at all**.

---

## 4. The day boundary `[C]`

Two distinct notions of "day" exist and must never be conflated.

| Concept | Span | Used for |
|---|---|---|
| **Civil date** | local midnight → midnight, per IANA zone | UI, storage keys, reminders |
| **Vedic day (ahorātra)** | local sunrise → next local sunrise | *all* observance-rule evaluation |

**Rule `[C]`:** an observance is assigned to the **civil date on which its Vedic
day begins**.

Consequence — a Nishita event at 00:30 local on 5 March belongs to the Vedic day
that began at sunrise on **4 March**, and is therefore reported under civil date
**4 March**, with the window timestamps correctly showing 00:30 on the 5th. The UI
must render this as "night of 4–5 March", never as two separate days.

This single rule resolves most "why does my app say a different day" confusion for
Shivaratri and Janmashtami.

---

## 5. Time zones

| Item | Decision | Marker |
|---|---|---|
| Storage | **All instants stored in UTC**, ISO-8601 with `Z` | `[C]` |
| Display | Always via an IANA zone id (`Europe/London`, `Asia/Kolkata`) | `[C]` |
| Fixed offsets | **Forbidden.** Never store or compute with `+05:30`. | `[C]` |
| Historical rules | Use the system IANA tzdb; do not hardcode DST rules | `[C]` |
| DST transitions | Must be handled for sunrise/sunset windows spanning a transition | `[C]` |

Two live hazards:

1. **India had DST historically** (1942–1945) and pre-1947 offsets differ. Any
   birth-chart or historical feature must use tzdb, not a constant.
2. **UK DST** shifts the local clock time of every observance window twice a year;
   a window computed in UTC and formatted per-zone handles this automatically —
   a window computed in local minutes-since-midnight does not.

The existing `getUtcOffsetHours()` (`packages/panchang-engine/src/index.ts:116`)
derives the offset by diffing two `Intl` formats. That is correct and should be
kept, but it must be applied to **all** location maths, not only display.

---

## 6. Boundary solving `[A]`

**Proven monotonicity.** Over any interval of interest:

- Moon apparent longitude rate ∈ [11.8, 15.4]°/day — always positive (the Moon
  never retrogrades in longitude).
- Sun apparent longitude rate ∈ [0.953, 1.020]°/day — always positive.
- Therefore **elongation** (moon − sun) rate ∈ ~[10.8, 14.4]°/day and
  **yoga** (moon + sun) rate ∈ ~[12.8, 16.4]°/day are both strictly positive.

All four panchanga angles are strictly increasing. **Bisection is therefore
guaranteed to converge** and no multi-root search is required.

**Required algorithm `[C]`:**

1. Compute the angle at the anchor instant; unwrap forward past any 360° wrap.
2. Target = next multiple of the step (12° tithi, 6° karana, 13°20′
   nakshatra/yoga, 30° sankranti).
3. Expand a bracket forward in ≤ 6 h steps to a hard cap (72 h tithi, 40 d sankranti).
4. Bisect to the tolerance in §1.2 (≤ 60 s), not to a fixed iteration count.
5. If the bracket cap is exceeded, return `null` and record a diagnostic.
   **Never return an estimated boundary.**

The existing `solveNextBoundary()`
(`packages/panchang-engine/src/index.ts:306`) implements exactly this shape with
45 fixed iterations; convert the loop to a tolerance test and keep the rest.

---

## 7. Muhurta windows `[C]` `[S]`

All windows derive from the **variable** day and night lengths of the location and
date. None may be hardcoded to clock minutes.

```
D = sunset(d) − sunrise(d)              (day length)
N = sunrise(d+1) − sunset(d)            (night length)
dayMuhurta   = D / 15
nightMuhurta = N / 15
dayFifth     = D / 5
```

| Window | Definition | Marker |
|---|---|---|
| **Brahma Muhurta** | 14th night muhurta: `[sunrise − 2·nightMuhurta, sunrise − 1·nightMuhurta]` | `[C]` |
| **Prātaḥ** | 1st day-fifth | `[C]` |
| **Saṅgava** | 2nd day-fifth | `[C]` |
| **Madhyāhna** | 3rd day-fifth: `[sunrise + 2·dayFifth, sunrise + 3·dayFifth]` | `[C]` |
| **Aparāhna** | 4th day-fifth: `[sunrise + 3·dayFifth, sunrise + 4·dayFifth]` | `[C]` |
| **Sāyāhna** | 5th day-fifth | `[C]` |
| **Pradosha** | `[sunset, sunset + 72 min]` (3 ghaṭikās) | `[S]` |
| **Nishita** | 8th night muhurta: `[sunset + 7·nightMuhurta, sunset + 8·nightMuhurta]`; midpoint = true local midnight | `[C]` |
| **Abhijit** | Midpoint of D ± 24 min | `[C]` |
| **Rāhu Kāla** | 1/8 of D, index by weekday | `[C]` |

**Two live defects this corrects:**

- Brahma Muhurta is currently hardcoded to sunrise − 96/48 minutes
  (`packages/panchang-engine/src/index.ts:414-415`). That is only correct for a
  12-hour night. In Bedford in June (night ≈ 7 h) the true window is ≈ 56/28
  minutes before sunrise — the app is currently over an hour early.
- Abhijit currently uses ±24 min around solver noon, which is acceptable, but
  must be re-derived from D once D is available.

**Pradosha is marked `[S]`.** Multiple defensible definitions are in use
(3 ghaṭikās after sunset; 45 min either side of sunset; the last day-fifth plus
the first night portion). The council must ratify one as default and the rest as
profile options.

---

## 8. High-latitude and degenerate cases `[C]` `[S]`

Bedford (52.1°N) is already outside the latitude band traditional panchanga math
assumes. Explicit policy is required — silence here produces absurd output.

| Condition | Policy |
|---|---|
| Normal sunrise and sunset exist | **Actual local values.** Default for all users. |
| Sun does not rise or does not set (\|lat\| ≳ 66.5°, seasonal) | Fall back to **proxy latitude 60°**, same date and longitude. Flag the result `latitude_proxy` and disclose it in the UI. |
| No moonrise on the civil date | Return `null`. Rules requiring moonrise must extend the search to the following night and report the actual instant. |
| Extremely short night (N < 4 h) | Muhurta windows still computed proportionally; flag `compressed_night` so the UI can warn that Nishita/Brahma Muhurta are unusually brief. |
| Polar day/night | `latitude_proxy` as above; **never** silently substitute an Indian city. |

**Three user-facing modes `[C]`:**

| Mode | Behaviour |
|---|---|
| **Local** (default) | User's actual coordinates. |
| **Temple** | A chosen temple/community location. Labelled with that location. |
| **Bharat reference** | Ujjain / Delhi / Varanasi / hometown, **explicitly labelled reference-only**. |

**Prohibited:** silently computing a UK user's observance from Indian coordinates.
This is what the engine does today for every festival
(`src/lib/calendar/engine.ts:60` computes all occurrences at Ujjain) and it is the
single largest correctness gap for the diaspora audience.

---

## 9. Versioning `[C]`

```
PANCHANGA_CORE_VERSION   — Layer A. Bump on any change in this document.
CALENDAR_PROFILE_VERSION — Layer B. Bump on month/era rule change.
RULE_ENGINE_VERSION      — Layer C. Bump on evaluator change.
<rule>.version           — per festival rule variant.
```

Semantic versioning. **Every stored occurrence records all four.** A change to any
`[C]` in this document requires:

1. an ADR under `docs/native-adrs/`,
2. a version bump,
3. re-materialisation of affected occurrences (respecting `locked_for_regeneration`),
4. a full golden-case run with an explicit diff review.

A passing type-check or unit test does **not** authorise a convention change.

---

## 10. Validation targets

Validate against documented manual spot-check evidence attached to the fixture
or rule (see `docs/CALENDAR_RULES_AND_VERIFICATION.md`), at minimum for:

**Cities:** Ujjain · Delhi · Varanasi · Mumbai · Chennai · Kolkata · Kathmandu ·
London · Bedford · New York · Sydney · Reykjavík (high-latitude probe).

**Quantities:** sunrise, sunset, moonrise, tithi boundary, nakshatra boundary,
Sankranti instant, Nishita window.

**Acceptance:** within the §1.2 tolerances against the *Indian Astronomical
Ephemeris* / *Rashtriya Panchang* for Indian cities; within 2 minutes against a
reputable reference for non-Indian cities.
