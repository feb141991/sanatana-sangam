# Dinacharya System — Morning-First, Full-Day Capable

**Date:** 2026-06-06  
**Session context:** Expanding Nitya Karma from a 7-step morning routine into a full Dinacharya day rhythm  
**Category:** product

## What we decided
Shoonaya should build the full Dinacharya architecture, but expose it progressively.

Default users remain in `morning` mode with the 7-step Nitya Karma sequence as the core daily discipline. `full_day` unlocks Midday and Evening sections. `advanced` unlocks Night and is Pro/tradition-specific.

## Why
The ritually complete system is Morning / Midday / Evening / Night, but showing the whole day from the beginning creates completion anxiety. A user who completes 7 morning practices should feel successful, not punished because they missed midday or evening.

The product psychology is: stabilize the morning first, then invite the user to close the day. Complexity should be earned or explicitly opted into.

## Constraints this creates
- Morning completion, streak, karma, and the morning progress bar must never be degraded by midday/evening/night state.
- Extended sections render below the morning card as separate cards with their own indicators.
- Default `morning` mode shows only a soft "Evening Moments" invitation, not a full day checklist.
- Full-day nudges should be readiness-based, such as after 14 consecutive morning completions.
- Cron reminders for Midday and Evening must only target users in `full_day` or `advanced`.

## What we explicitly rejected
- Making all four sections visible from day one.
- Merging morning + extended sections into one completion bar.
- Treating missed evening practice as a broken morning streak.

---
