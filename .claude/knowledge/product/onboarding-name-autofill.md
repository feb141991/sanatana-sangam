# Onboarding Name Auto-fill from Waitlist

**Date:** 2026-06-06
**Session context:** Preventing double name-ask when user already entered name on landing page
**Category:** product

## What we decided

`onboarding/page.tsx` looks up the `waitlist` table by the authenticated user's email and
pre-fills `initialName` if `profile.full_name` is empty. This runs before the name step
renders, so the field arrives pre-populated.

## Why

A user who signed up via the waitlist form already gave their name. Asking again signals that
the product doesn't remember them — it erodes the founding-circle feeling that the waitlist copy
establishes.

The lookup is safe: if no waitlist row exists (user signed up directly), the field stays empty
and the flow is unchanged.

## Constraints this creates

- The `waitlist` table must be readable by authenticated users (or via service role in the
  server component) — row-level security must permit this lookup
- The name field in onboarding must always accept a pre-filled value and still allow editing
  (autofill is a suggestion, not a lock)
- If `profile.full_name` is already set (returning user), the waitlist lookup is skipped

---
