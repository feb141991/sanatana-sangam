# @sangam/panchang-engine

High-precision Panchang engine lane for Sanatana Sangam.

## Purpose

This package is the serious upgrade path beyond the current in-app Panchang estimate.

It is intended to become:

- the precise sacred-time engine
- the source of exact transition windows
- the backend-facing Panchang service layer

## Not the same as the current app Panchang

The current app-level calculator is still useful for:

- daily guidance
- quick browsing
- fallback display

This package exists for:

- exact astronomical timing
- observance-sensitive logic
- validated precision

## Planned stack

- Swiss Ephemeris-backed calculations
- server-only execution
- exact transition windows for tithi / nakshatra / yoga / karana
- configurable observance logic
- trust metadata and validation hooks

## License note

Do not ship Swiss Ephemeris-backed production functionality from this package without an explicit license decision.

Swiss Ephemeris requires one of:

- AGPL compliance
- Swiss Ephemeris Professional License

## Status

Scaffolded only.

The public API is defined so the app can integrate against a stable seam before the underlying Swiss Ephemeris runtime is activated.
