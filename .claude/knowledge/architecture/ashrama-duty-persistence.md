# Ashrama Duty Persistence — localStorage for Grihastha, sessionStorage for Others

**Date:** 2026-06-06
**Session context:** Grihastha Dharma duty checks resetting between page loads
**Category:** architecture

## What we decided

Duty check state for `localLifeStage === 'grihastha'` is persisted to `localStorage` with
the key `grihastha-duties-{userId}-{YYYY-MM-DD}`. All other ashrama stages (brahmacharya,
vanaprastha, sannyasa) continue using `sessionStorage`.

An all-done celebration card is shown for every ashrama stage on completion, not only grihastha.

## Why

Grihastha duties are household obligations spread across a full day — family members, work,
community. It is realistic and expected that a grihastha user closes the browser tab and returns
hours later. Losing checked state on tab close breaks the completion loop.

Other ashrama stages (especially brahmacharya students, monastics) tend to complete their
practice in a single sitting. sessionStorage is appropriate — clean slate on next session.

The key includes userId and date to prevent cross-user contamination on shared devices and to
auto-expire after midnight (next day = new key = fresh state).

## Constraints this creates

- The date suffix must use the user's local date (`YYYY-MM-DD`), not UTC, to avoid midnight
  reset happening mid-evening in IST
- localStorage is only available client-side — any SSR code must guard with `typeof window`
- State cleanup: old keys accumulate in localStorage. A pruning pass (delete keys older than
  7 days for this userId prefix) should be added before or at the same time as launch
- The celebration card is now universal — any future ashrama stage added must also trigger it

## What we explicitly rejected

- Using sessionStorage for grihastha (state lost on tab close mid-day, breaks completion loop)
- Persisting grihastha duty state to Supabase on every check (write-heavy, requires online,
  overkill for ephemeral daily check state)
- Using a single key without date suffix (would show yesterday's completed duties as done today)

---
