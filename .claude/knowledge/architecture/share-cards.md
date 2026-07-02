# Nitya Share Cards — Canvas Cards at Emotional Moments

**Date:** 2026-06-06  
**Session context:** Adding rich share cards for Nitya Karma insights, completion, and milestone moments  
**Category:** architecture

## What we decided
Shoonaya uses offline canvas-rendered image cards for Nitya Karma sharing instead of text-only sharing.

The renderer supports five card types:

- `streak_milestone` — 1080x1080
- `week_summary` — 1080x1920
- `morning_complete` — 1080x1080
- `sadhana_quote` — 1080x1080
- `monthly_report` — 1080x1350

Data assembly lives in `src/lib/share/nitya-card-data.ts`, while drawing lives in `src/lib/share/generate-share-image.ts`.

## Why
The generic text share did not match the emotional value of the practice. Users are more likely to share when the app surfaces a beautiful card at the exact moment of meaning: morning completion, streak milestone, or monthly reflection.

Canvas keeps the feature offline-capable and avoids external image/font dependencies.

## Constraints this creates
- Canvas renderers must not fetch external images, fonts, or assets.
- Share helpers should use native `navigator.share({ files })` when possible and download fallback otherwise.
- Card data mapping should stay centralized in `nitya-card-data.ts` so insights, Nitya page, and milestone cards do not drift.
- Morning completion cards should represent the 7 core morning steps, not custom Pro extras.

## What we explicitly rejected
- Keeping share cards buried only inside Insights.
- Duplicating card-data assembly in every component.
- Relying on external image generation or remote assets for share cards.

---
