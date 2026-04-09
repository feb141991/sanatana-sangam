# Panchang Source Strategy

Last updated: 2026-04-09

## Purpose

This file defines how Sanatana Sangam should talk about Panchang at launch and how the underlying source strategy should evolve after launch.

## Current state

- The app currently calculates Panchang in-app from date and location.
- The engine now uses:
  - sidereal solar/lunar longitudes for nakshatra, yoga, and masa
  - a better solar-time sunrise/sunset estimate with equation-of-time correction
- This gives a useful daily orientation surface:
  - tithi
  - nakshatra
  - yoga
  - sunrise / sunset
  - rahu kaal
  - abhijit muhurat
- It is helpful for daily guidance, but it should not be framed as priest-level ritual precision.

## Launch posture

At launch, Panchang should be described as:

- `Location-based Panchang estimate`
- `Best for daily guidance, not priestly precision`

This means:

- Home and Panchang screens should show clear trust copy
- festival countdowns should not imply exact muhurat precision
- Jyotish or Rashiphal claims must not expand faster than this source posture

## Why this matters

User trust breaks quickly if sacred-time information feels overconfident and then turns out to be wrong for temple, guru, or regional practice.

## Product rule

Use the current engine for:

- daily orientation
- beginner-friendly sacred rhythm
- home summaries
- quick planning

Do not overclaim it for:

- exact observance start/end moments
- temple-specific ritual windows
- guru-specific or sampradaya-specific timing authority

## Next source strategy

The next improvement should not be cosmetic. It should be one of:

1. Better trusted calculation engine
2. Verified external Panchang provider
3. Hybrid model:
   - current in-app engine for everyday browsing
   - verified source for exact observance-sensitive cases

## Requirements for the next step

- timezone-aware behavior must remain explicit
- location handling must remain transparent
- tradition- or region-specific differences must not be flattened into one claim
- UI must show when exact verification is recommended

## Sacred-time relationship

Panchang should eventually sit inside one coherent `Sacred Time` system:

- Panchang
- festival calendar
- later Jyotish / Rashi guidance

But the trust order stays:

1. festival truth
2. Panchang source clarity
3. Jyotish definition
4. later expansion into richer sacred-time guidance
