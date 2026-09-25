# Separate consent for practice activity personalization

**Date:** 2026-09-25
**Session context:** Making Mood and Sankalpa suggestions respond to recent practice while adding an optional midpoint reminder.
**Category:** architecture

## What we decided

Keep profile/tradition personalization and practice-activity personalization as separate user choices. Activity history may influence Mood ordering or Sankalpa suggestion selection only when `profiles.consent_activity_personalization` is true; missing or false consent means the baseline output is used.

The optional Sankalpa midpoint reminder has its own preference, `profiles.wants_sankalpa_midpoint_reminders`, defaulting to false. Its candidate copy is generic and must never contain the user's private vow text. The event is classified as `explicit_user_requested`, outside generic engagement budgets.

## Why

Choosing a tradition or entering a vow does not imply consent to use activity history or to receive a new reminder. Independent controls let users use profile-aware experiences without activity-based ranking, and let reminder delivery remain explicit. A deterministic practice-matched Sankalpa anchor makes the activity signal's effect inspectable even when optional AI copy is available.

The midpoint producer uses the existing candidate ledger and scheduler. It is disabled by default until its migration and resolver rollout have been reviewed; it does not send directly.

## Constraints this creates

- Recommendation routes must check activity consent before querying practice history.
- Turning activity consent off immediately returns subsequent requests to baseline ranking; stored activity is not deleted by this preference.
- New reminder types require a specific preference check at dispatch and an idempotent candidate identity.
- Candidate metadata or copy must not carry the private Sankalpa text.
- A source migration or a passing local test does not establish production schema application or delivery readiness.

## What we explicitly rejected

- Treating profile/tradition consent, creating a Sankalpa, or OS push permission as consent to use practice history or send a midpoint reminder.
- Generating reminder copy from the private vow text.
- Sending directly from the midpoint cron or letting the generic engagement budget suppress an opted-in user-requested reminder.

---
