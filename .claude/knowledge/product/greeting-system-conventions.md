# Greeting System Conventions

**Date:** 2026-06-07
**Session context:** Fixing greeting comma artifact and sampradaya-null fallback gap
**Category:** product

## What we decided

### userName fallback
`userName` falls back to `''` (empty string), never to `'Seeker'` or any placeholder noun.
Greeting renders without a comma when name is empty: `"Shubh Ratri"` not `"Shubh Ratri, "`.

### Greeting pool fallback chain
`getGreetingPool` resolves in this order:
1. `${tradition}:${sampradaya}` — e.g. `hindu:shaiva`
2. `${tradition}:other` — tradition-level pool when sampradaya is null
3. `'default'` — generic cross-tradition fallback

The old behavior skipped step 2, jumping directly from a missing sampradaya to `'default'`, producing generic greetings for users who had a tradition set but no sampradaya.

## Constraints this creates

- All greeting rendering code must guard against an empty userName before inserting a comma separator
- Any new tradition added must have a `${tradition}:other` pool defined before launch, or users without a sampradaya will fall through to generic English greetings
- The `'default'` pool is a last resort only — it should never be the expected path for a known tradition

## What we explicitly rejected

- `'Seeker'` as the userName fallback: adds a comma artifact and feels presumptuous for users who have not named themselves
- Skipping the `${tradition}:other` tier: loses the tradition signal for ~40% of users who complete tradition selection but not sampradaya selection during onboarding

## Files

- `src/lib/traditions.ts` — `getGreetingPool` fallback logic
- `src/app/(main)/home/page.tsx` — `userName` derivation
- `src/app/(main)/home/sections/HeroSection.tsx` — comma-guard rendering

---
