# Location Persistence — Save on Most-Visited Screen

**Date:** 2026-06-06
**Session context:** Debugging why SeekersNearYou showed nothing for most users
**Category:** architecture

## What we decided

GPS coordinates must be saved to `profiles` (lat/lon columns) from the most-visited screen in
the app — `HomeDashboard.tsx` — not only from the profile page. `HomeDashboard.tsx` now calls
the location save on every coordinate resolve.

`SeekersNearYou` shows an explicit empty state rather than silently disappearing when 0 results
are returned.

## Why

Root cause: `ProfileClient.tsx` (profile page) was the only place that persisted coords.
Users who never navigate to `/profile` — the majority — had `latitude: null` in the database
forever. The feature appeared broken but the bug was a persistence gap, not a query bug.

The fix follows the principle: location should be collected at the highest-traffic touchpoint,
not gated behind a page most users never visit.

## Constraints this creates

- Any future screen that resolves GPS must check whether it is more frequently visited than
  `HomeDashboard` before deciding where to persist. `HomeDashboard` is the canonical save point
  unless a higher-traffic screen is introduced.
- Saving from multiple screens is acceptable (idempotent upsert); duplicate saves are not a bug
- Features that depend on location data must show a meaningful empty state — silent disappearance
  is not acceptable

## What we explicitly rejected

- Saving only on profile page (requires active navigation, most users skip it)
- Silently hiding components when location data is absent (hides the root cause from the team)

---
