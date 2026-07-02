# Waitlist Funnel Architecture

**Date:** 2026-06-06
**Session context:** Building the pre-launch waitlist funnel on the landing page
**Category:** product

## What we decided

The waitlist funnel is a 3-step progressive form: (1) Name + Country + Email, (2) Tradition selection,
(3) Founding member toggle. Both the hero form and the CTA section form use the same fields and
validation — they are unified, not separate components.

Success copy is locked as: "You are now part of Shoonaya's founding circle."

Duplicate email handling: the `/api/waitlist` POST returns `alreadyRegistered: true` and the UI
shows "You're already part of Shoonaya's founding circle." — a welcoming confirmation, not an error.

Email is normalised to lowercase before submission to Supabase.

## Why

Progressive disclosure: asking name + email first minimises friction at the highest drop-off point.
Tradition and founding-member intent are deeper signals that belong later in the flow, after the
user has committed their email.

The duplicate-email copy mirrors the success copy in tone so returning users feel affirmed rather
than rejected. There is no "try a different email" nudge — the correct action is to just sign in.

## Constraints this creates

- The `waitlist` Supabase table must have a unique constraint on `email`
- The API must return `{ alreadyRegistered: true }` (not a 4xx error) for duplicate emails so the
  front-end can branch on tone rather than on HTTP status
- Both landing forms must stay in sync — any field added to one must be added to the other

## What we explicitly rejected

- Putting tradition on step 1 (too much friction before the user has committed)
- Showing an error for duplicate email (punishes returning interest, contradicts the welcoming tone)

---
