# Astronomy Boundary — plan

**Decision (2026-08-07):** stop owning physics. Every astronomical calculation
delegates to `astronomia`; everything dharma-specific is ours. The division is
enforced by a **file boundary**, not by a convention people have to remember.

---

## 1. Why

Eleven defects were filed on this workstream (D18–D28). **Every one was in code
we wrote. None were astronomia's.**

| | Implementation | Measured against USNO, 13 sites |
|---|---|---|
| Sunrise | astronomia's `Sunrise` | **10 of 13 exact**, mean −0.23 min |
| Moonrise | ~250 lines we hand-wrote | **13 of 13 early**, mean −1.62 min |

Same library underneath, same timezone code, same time base. The half we
delegated is exact; the half we wrote carries a systematic bias. Before that,
the same 250 lines produced an **80-minute** error at Bedford (D18/D19).

This is not a discipline problem. It is a **missing boundary**: nothing in the
codebase distinguishes "physics we should never write" from "dharma only we can
write", so physics kept getting written.

### How it happened

The 2.4 prompt said *"reuse the existing sunrise solver's conventions and
helpers where applicable; do not duplicate anything already in `core/`."* It
pointed at **our** `core/`. Nobody checked astronomia's own module list, so
`astronomia/rise` — which ships `PlanetRise`, `times`, `stdh0Lunar` — was never
considered. Work was commissioned to build something the dependency already
provided.

The same mechanism produced **four** ayanāṁśa implementations, two
`normalizeAngle`s, and a hand-rolled bisection alongside `iterate.binaryRoot`.

---

## 2. The division

**astronomia owns — never hand-write:**

- sun and moon positions
- rise and set finding
- coordinate conversions (ecliptic ↔ equatorial)
- nutation, obliquity, sidereal time
- parallax, observer-on-surface corrections
- root-finding, angle normalisation
- ΔT / time-base conversions

**Ours forever — astronomia has no concept of these:**

- **ayanāṁśa** (astronomia provides none at all; ours is sourced to the
  Positional Astronomy Centre / ICRC 1955)
- tithi, nakshatra, yoga, karana
- muhurta windows (Nishita, Pradoṣa, Madhyāhna, Aparāhna, Brahma)
- the Vedic day boundary and civil-date ownership
- which 24-hour window is "today" in the user's timezone
- returning `null` when a civil date genuinely has no moonrise, and the §8
  next-night extension
- the §8 proxy-latitude policy and every diagnostic that reaches `reasons[]`
- calendar profiles, festival rules, variant resolution — all of Layers B and C

> **The test:** if a Hindu calendar concept appears in the name or the reasoning,
> it is ours. If it would be identical for an observatory in Chile, it is
> astronomia's.

---

## 3. The boundary

Today `astronomia` is imported in **three** files, and our own physics is spread
across more. That scattering is what allowed the drift.

**Target:** one adapter module owns *every* `astronomia` import. Nothing else in
the repo imports it.

```
  ┌─ astronomy adapter ─────────────────────────┐
  │  the ONLY place `import … from 'astronomia'`│
  │  appears. Standardises UTC, observer coords,│
  │  rise/set config, boundary solving.         │
  └──────────────────┬──────────────────────────┘
                     ▼
        ayanāṁśa  (ours — sourced, validated)
                     ▼
     Panchāṅga core → Vedic day → Profiles → Rules
```

Once that exists:

- *"Is this physics or dharma?"* is answered by **which side of the file
  boundary it sits on** — not by judgement
- hand-writing physics becomes *visibly* wrong: adapter code that doesn't
  delegate
- a future provider decision (Swiss Ephemeris, JPL) is **one file**, not a
  migration
- the dharma layer cannot reach into physics even by accident

---

## 4. Sequence

**Piece by piece, each verified. Not a big bang.**

The 13 USNO golden fixtures (`fae2b0f`) make every step falsifiable — change
one thing, re-run, read the residuals. That safety net did not exist before
2026-08-07 and is the reason this plan is now safe to execute.

| # | Step | Verified by |
|---|---|---|
| 0 | ✅ **Golden fixtures populated** — 13 real USNO values | 63/63 tests green |
| 1 | Create the adapter module; move the 3 existing `astronomia` imports behind it. **No logic change.** | `verify:harness` 988/216 unchanged; 13 fixtures unchanged |
| 2 | Replace the moonrise **search loop** with `rise.times` / `PlanetRise` | *the residual sign distribution* — 13/13 negative must become roughly balanced |
| 3 | Replace `normalizeAngle` → `base.pmod`; hand-rolled bisection → `iterate.binaryRoot` | tripwire must not move; if it does, **stop** |
| 4 | Sweep for any remaining hand-written physics; register anything that must stay, with a reason | grep: `astronomia` imported in exactly one file |

### Standing caution

**A correct-looking replacement can be wrong.** During this analysis the rise
threshold was nearly swapped for `stdh0Lunar` on the assumption it was the
better version. It is not — it is a *different convention*:

```
ours:            −0.8244°  topocentric
USNO / Meeus:    0.7275π − 34′ = +0.1212° geocentric  →  −0.8244° topocentric
astronomia:      stdh0Lunar(π) = −0.5547°
```

Ours agrees with USNO to four decimal places. The swap would have injected a
0.27° error into correct code. **Verify semantics numerically before replacing;
a matching name is not a matching meaning** (D19 was a units mismatch inside a
correctly-named function).

---

## 5. The rule that survives

Replacement clears today's debt. It does not stop the *next* moonset, eclipse
time or Sankranti instant from being hand-written. Once the boundary exists the
rule is trivial to state and easy to enforce:

> **Physics lives in the adapter, and the adapter delegates. If astronomia
> genuinely lacks it, that is a documented exception with a stated reason —
> recorded in `CALENDAR_ENGINE_ASSESSMENT.md` §7, like any other duplicate.**

---

## 6. Known ceiling

astronomia is a translation of Meeus — roughly **10 arcseconds** for the moon,
about **18 seconds** of time. Our tolerance budget is 60 s for tithi boundaries
and 2 min against external references (§1.2, §10), so it is comfortably inside
what we need and will be for years.

It is *not* JPL-grade. If precision beyond that is ever required, the adapter is
what makes changing provider cheap — which is the second reason to build it.
