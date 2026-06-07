# FirstWeekGuide — Tradition-Aware Onboarding Component

**Date:** 2026-06-07
**Session context:** Activating dead FirstWeekGuide component and making it tradition-aware
**Category:** product

## What we decided

`FirstWeekGuide` is now live and rendered in `HomeDashboard` between `HeroSection` and `CalendarSection`. Acts are derived dynamically from `getTraditionActs(tradition)` — never a static array. There are always 5 acts; vocabulary adapts per tradition, hrefs stay fixed.

## Visibility condition

Shown when `showFirstTimeGuidance = true`:
- streak = 0
- no shloka date
- no guided path active

## Act structure (fixed hrefs, tradition-aware labels)

| Act | href | Hindu | Sikh | Buddhist | Jain |
|-----|------|-------|------|----------|------|
| 1 | `/` | Shloka | Shabad | Dhamma Verse | Sutra |
| 2 | `/bhakti/mala` | Japa | Waheguru Simran | Om Mani Padme Hum | Namokar Mantra |
| 3 | `/nitya-karma` | Nitya Karma | Nitnem | Morning Sadhana | Pratikramana |
| 4 | `/pathshala` | Pathshala / Scriptures | Gurbani | Dhamma texts | Agamas |
| 5 | `/mandali` | Mandali | Sangat | Sangha | Samaj |

## Storage keys

- Progress: `shoonaya-first-week-guide` (localStorage)
- Dismiss: `shoonaya-first-week-dismissed` (localStorage)

## Header fallback

When `userName` is empty, header uses `meta.symbol` from the tradition object (not a string name).

## Constraints this creates

- Any new tradition added to the system MUST add a corresponding entry in `getTraditionActs`
- The 5-act count and the 5 hrefs are fixed contracts — reordering or adding acts is a breaking change to stored progress
- localStorage keys must not change without a migration; progress is keyed by position, not act ID

## What we explicitly rejected

- Static acts array: would not adapt to tradition, breaking the Sikh/Buddhist/Jain experience
- Showing component to all users: overwhelming for users who already have an established practice
- Generic fallback labels for unknown traditions: traditions without explicit mapping should map to Hindu defaults with a clear code comment, not silently use wrong vocabulary

---
