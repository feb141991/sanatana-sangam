# Native Home Parity Matrix

Last updated: 2026-07-07 (implemented: native Home summary contract)

This document started as a read-only audit and now tracks the implemented
native Home contract slice.

## Scope

Compares the native Home tab against the web/PWA Home dashboard, for the
dynamic (per-user, per-day) items only. Per
`docs/NATIVE_APP_PHASE_1_PARITY_PLAN.md` Slice 3 ("Native Shell And Home
Next Action"), Phase 1's job is one focused next-action screen, not full
parity with every below-the-fold web section — so Community/Discovery/
Calendar-modal sections are called out as explicitly out of scope below
rather than scored row by row.

- PWA: `src/app/(main)/home/page.tsx` (server component, 232 lines) +
  `src/app/(main)/home/HomeDashboard.tsx` (client component, 1719 lines) +
  `src/app/(main)/home/BelowFoldSections.tsx` + `src/app/(main)/home/sections/*.tsx`
- Native: `app/(tabs)/index.tsx`

## Implemented in follow-up slice

- Added `GET /api/native/home-summary`.
- Replaced native Home's direct profile read and `/api/home/personalise`
  dependency with the new summary contract.
- Removed hardcoded native `VERSE_BY_TRADITION`, six-item `RELICS`, and
  hardcoded `practiceRows`.
- Fixed broken relic image URLs in both web and native relic catalogs.
- Native Home now receives hero image, daily sacred text, user practice state,
  Sankalpa, Dharm Veer, relic image, city, karma, and date/location payloads
  from the API.
- Native Home computes visible tithi/yoga labels with the already-adopted
  `@sangam/panchang-engine`, using the API's date/timezone/location.

## Matrix

| # | Item | PWA source | Native source | Status | Required API/field if missing | Phase 1 or later |
|---|------|-----------|----------------|--------|-------------------------------|-------------------|
| 1 | Display name / greeting | `page.tsx` `getDisplayName()`, `HomeDashboard` greeting render | Native Home receives `profile.name` / `profile.firstName` from `/api/native/home-summary` | **Implemented** | `/api/native/home-summary.profile` | Phase 1 done |
| 2 | City / location display | `page.tsx` `city={profile?.city ?? ''}` | Native Home receives `profile.city` from `/api/native/home-summary` | **Implemented** | `/api/native/home-summary.profile.city` | Phase 1 done |
| 3 | Karma points display | `page.tsx` `karmaPoints={...profile?.karma_points ?? 0}` | Native Home receives `profile.karmaPoints` from `/api/native/home-summary` | **Implemented** | `/api/native/home-summary.profile.karmaPoints` | Phase 1 done |
| 4 | Personalized "next action" suggestion/nudge | `page.tsx` → `HomeDashboard` daily-content props; backed by daily practice state | `index.tsx` calls `apiFetch('/api/native/home-summary')` and renders `nextPractice` | **Implemented** | `/api/native/home-summary.nextPractice` | Phase 1 done |
| 5 | Relic/symbol avatar image | `src/lib/relics.ts` full catalog | Native Home receives `profile.relicImageUrl` from `/api/native/home-summary`; native local catalog remains for Kosh/Profile | **Implemented for Home** | `/api/native/home-summary.profile.relicImageUrl` | Phase 1 done |
| 5a | ↳ concrete bug | `public/relics/*` real filenames | Web/native relic catalogs now point to existing filenames | **Fixed** | n/a | Phase 1 done |
| 5b | ↳ non-Hindu users | Any Sikh/Buddhist/Jain relic (`nishan-sahib`, `khanda-gold`, `dharma-wheel`, `bodhi-leaf`, `jain-swastika`, etc.) | Home no longer has a six-item native-only map; API returns the active relic image for any catalog id | **Implemented for Home** | `/api/native/home-summary.profile.relicImageUrl` | Phase 1 done |
| 6 | Practice completion state (japa/pathshala/quiz/dharm veer/nitya "done today") | `page.tsx` derives from `daily_sadhana`/`guided_path_progress`/`mala_sessions`/`nitya_karma_log` | Native Home receives `practices[]` from `/api/native/home-summary` | **Implemented** | `/api/native/home-summary.practices[]` | Phase 1 done |
| 7 | Streak displays (japa streak, nitya streak, shloka streak) | `page.tsx` reads `daily_sadhana.streak_count` / `nitya_karma_streaks.current_streak` | Native Home receives quiet streak metadata on practice rows | **Implemented for japa/Nitya** | `/api/native/home-summary.practices[].streak` | Phase 1 done |
| 8 | Active Sankalpa (real intention, dates, check-in) | `page.tsx` builds `activeSankalpa` from `sankalpas` table | Native Home receives `sankalpa` from `/api/native/home-summary`; full native Sankalpa check-in remains future work | **Partial** | `/api/native/home-summary.sankalpa` | Home display done; interactive Sankalpa later |
| 9 | Dharm Veer of the day preview on Home | `getDharmVeerRoster()` + `selectDharmVeerOfTheDayFromRoster()` | Native Home receives `dharmVeer` in summary payload and has a practice row route | **Implemented for Home** | `/api/native/home-summary.dharmVeer` | Phase 1 done |
| 10 | Festival/Panchang live widget (today's tithi, days-until-next-festival) | PWA uses calendar/hero observances and client panchang | Native Home receives observance labels and computes tithi/yoga via `@sangam/panchang-engine` | **Implemented for Home** | `/api/native/home-summary.panchang` + local panchang engine | Phase 1 done |
| 11 | Notification bell | `HomeDashboard.tsx:974` `onNotifBellClick`, real query/panel (`notifQuery`, lines ~1571-1660) | `index.tsx:449-464` bell icon renders, `accessibilityLabel="Open notifications"`, but **no `onPress` handler at all** | **Missing** | `GET /api/notifications` (list) — route exists (`src/app/api/notifications/*`) but native has no screen to show them yet | Later (needs a native notifications screen, not just a Home wire-up) |
| 12 | Onboarding-completion gate | `page.tsx:164,176` `willRedirectToOnboarding` → `redirect('/onboarding')` if `profile.onboarding_completed === false` | No occurrence of `onboarding_completed` anywhere in the native repo (confirmed via full-repo search) | **Missing** | None — the `onboarding_completed` column already exists on `profiles`; native just needs to check it (in `_layout.tsx`'s `routeForSession` or in Home's `loadHome`) | Phase 1 — flagged here because Home is where the gap is most visible, but the actual fix belongs with Slice 2 (Auth/Onboarding) |
| 13 | Hero background theming (festival-driven) | `page.tsx` `heroThemes` from `hero_assets` table, swaps hero art by active festival | Native Home receives `hero` from `/api/native/home-summary` and renders it behind the greeting | **Implemented for Home** | `/api/native/home-summary.hero` | Phase 1 done |
| 14 | Live Darshan awareness | `page.tsx:233,410` `resolveActiveLiveStreams()` | No Live Darshan route/screen exists anywhere in the native app | **Out of scope** | n/a | Later — Live Darshan isn't a native destination yet at all (consistent with Tirtha/Mandali being "contextual until usage proves otherwise" per `PRODUCT_CONSOLIDATION_PLAN.md`) |
| 15 | Community/Discovery below-fold sections | `BelowFoldSections.tsx` → `CommunitySection.tsx`, `DiscoverySection.tsx` | Not present | **Out of scope for Phase 1** | n/a | Later — explicitly out of scope per Slice 3 ("Out of scope: Full parity for every destination linked from Home") |

## Recommended implementation order

1. **Nitya Karma native destination** — Home now knows Nitya state, but native has no `/nitya-karma` screen yet.
2. **Onboarding-completion gate** (row 12) — small correctness gap; coordinate with Slice 2 rather than fixing only inside Home.
3. **Sankalpa interactions** — Home display is wired; native still needs a real create/check-in/complete surface.
4. **Notification bell → real notifications screen** (row 11) — defer; needs a new native screen, not just a Home tap handler.
5. **Live Darshan, Community/Discovery** (rows 14-15) — later, no Phase 1 urgency; native's own product hierarchy (Home = one next action) argues against adding more surface area here.

## Out of scope for Phase 1 (explicit)

- Full Community/Discovery section parity (`CommunitySection.tsx`, `DiscoverySection.tsx`).
- Live Darshan integration (no native destination exists yet).
- Calendar modal / date-picker UI (`CalendarModal.tsx`, `DatePickerModal.tsx`) — native's Panchang/Vrat screens already have their own simpler date handling.
