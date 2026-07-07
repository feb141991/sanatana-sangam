# Native Home Parity Matrix

Last updated: 2026-07-07

Read-only audit. No app code was changed producing this document, per
`docs/NATIVE_APP_AGENT_RULES.md`'s default read-only-audit mode.

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
- Native: `app/(tabs)/index.tsx` (774 lines)

## Matrix

| # | Item | PWA source | Native source | Status | Required API/field if missing | Phase 1 or later |
|---|------|-----------|----------------|--------|-------------------------------|-------------------|
| 1 | Display name / greeting | `page.tsx:150-181` `getDisplayName()`, `HomeDashboard.tsx` greeting render | `index.tsx:128-130` `getFirstName()`, `:530` render | **Present** | — | — |
| 2 | City / location display | `page.tsx:378` `city={profile?.city ?? ''}` | `index.tsx:313` profile select includes `city`, `:520-527` render | **Present** | — | — |
| 3 | Karma points display | `page.tsx:422` `karmaPoints={...profile?.karma_points ?? 0}` | `index.tsx:313,332` reads `karma_points` directly | **Present** | — | — |
| 4 | Personalized "next action" suggestion/nudge | `page.tsx` → `HomeDashboard` daily-content props; backed by `/api/home/personalise` logic (same route native calls) | `index.tsx:317-322` calls `apiFetch('/api/home/personalise')` | **Present** | — | — |
| 5 | Relic/symbol avatar image | `src/lib/relics.ts` (621 lines, `SACRED_RELICS: Relic[]`, ~50 entries across hindu/sikh/buddhist/jain/universal, each with `id`+`imageUrl`) | `index.tsx:115-122` hardcoded `RELICS` array, only 6 entries, all Hindu-coded (diya/kalash/incense/camphor/bell/lota) | **Partial — and 3 of the 6 are broken** | Expose `SACRED_RELICS` (or at least `id → imageUrl`) via an API, e.g. `GET /api/relics` | Phase 1 (bug), full catalog later |
| 5a | ↳ concrete bug | `public/relics/incense-sandalwood.png`, `camphor-flame.png`, `mindful-bell.png` are the real filenames | `index.tsx:118-120` map these ids to `/relics/incense.png`, `/relics/camphor.png`, `/relics/bell.png` — **none of those 3 files exist** | **Missing (404)** | n/a — just fix the 3 filenames to match `relics.ts` | Phase 1 |
| 5b | ↳ non-Hindu users | Any Sikh/Buddhist/Jain relic (`nishan-sahib`, `khanda-gold`, `dharma-wheel`, `bodhi-leaf`, `jain-swastika`, etc.) | Not in the 6-item `RELICS` array at all | **Missing** | same as row 5 | Later (full catalog) |
| 6 | Practice completion state (japa/pathshala/quiz/dharm veer/nitya "done today") | `page.tsx:236-256` derives `pathshalaDoneToday`, `japaAlreadyDoneToday`, `nityaDoneToday`, `quizDoneToday`, `dharmVeerDoneToday` from `daily_sadhana`/`guided_path_progress`/`mala_sessions`/`nitya_karma_log` | `index.tsx:244-298` `practiceRows` — every row hardcodes `done: false, progress: 0` | **Missing** | `GET /api/home/practice-status` (or extend `/api/home/personalise`) returning `{ japa_done, pathshala_done, quiz_done, dharmveer_done, nitya_done }`, sourced from `daily_sadhana` (same table native's Dharm Veer/Vrat screens already write to) | Phase 1 |
| 7 | Streak displays (japa streak, nitya streak, shloka streak) | `page.tsx:262,402,424` `effectiveJapaStreak`, `japaStreak`, `displayStreak` from `daily_sadhana.streak_count` / `nitya_karma_streaks.current_streak` | Not present anywhere in `index.tsx` | **Missing** | Add `streak_count`/`current_streak` fields to the practice-status response in row 6 | Phase 1 |
| 8 | Active Sankalpa (real intention, dates, check-in) | `page.tsx:301-312` builds `activeSankalpa` from `sankalpas` table; `HomeDashboard.tsx:448-556` fetch/check-in/complete flow; backed by `/api/sankalpa`, `/api/sankalpa/checkin`, `/api/sankalpa/complete` (all already exist and are auth-only, no native-specific gap) | `index.tsx:704-727` static card, same copy always, routes to `/(tabs)/profile` regardless of whether a Sankalpa exists | **Missing** | None — `/api/sankalpa`, `/api/sankalpa/checkin`, `/api/sankalpa/complete` already exist; native just needs to call them | Later (Sankalpa has no native screen at all yet — this is a new feature build, not a contract gap) |
| 9 | Dharm Veer of the day preview on Home | `page.tsx:233` + `getCachedDharmVeer()` (uses the same `getDharmVeerRoster`/`selectDharmVeerOfTheDayFromRoster` this session's Slice 11 wrapped for native) | Not shown on Home at all — only a generic label in the collapsed "View all practices" list (`index.tsx:276-285`) | **Missing** | None — `GET /api/dharm-veer/roster` already exists (built this session) | Phase 1 (cheap — contract already shipped) |
| 10 | Festival/Panchang live widget (today's tithi, days-until-next-festival) | `page.tsx:216-219,222` `getTodayPanchang(lat, lon)` (SSR) + `festivals`/`daysLeft` from `observance_occurrences` | `index.tsx:729-760` static card, fixed copy ("Check tithi, vrat, and sacred timing..."), no live data | **Missing** | None — `/api/calendar/upcoming` already exists and native's own Vrat/Panchang screens (Slice 17, this session) already call it; Home just needs the same call | Phase 1 (contract already proven on two other native screens) |
| 11 | Notification bell | `HomeDashboard.tsx:974` `onNotifBellClick`, real query/panel (`notifQuery`, lines ~1571-1660) | `index.tsx:449-464` bell icon renders, `accessibilityLabel="Open notifications"`, but **no `onPress` handler at all** | **Missing** | `GET /api/notifications` (list) — route exists (`src/app/api/notifications/*`) but native has no screen to show them yet | Later (needs a native notifications screen, not just a Home wire-up) |
| 12 | Onboarding-completion gate | `page.tsx:164,176` `willRedirectToOnboarding` → `redirect('/onboarding')` if `profile.onboarding_completed === false` | No occurrence of `onboarding_completed` anywhere in the native repo (confirmed via full-repo search) | **Missing** | None — the `onboarding_completed` column already exists on `profiles`; native just needs to check it (in `_layout.tsx`'s `routeForSession` or in Home's `loadHome`) | Phase 1 — flagged here because Home is where the gap is most visible, but the actual fix belongs with Slice 2 (Auth/Onboarding) |
| 13 | Hero background theming (festival-driven) | `page.tsx:233,384` `heroThemes` from `hero_assets` table, swaps hero art by active festival | `index.tsx:415-446` static two-blob decorative background, never changes | **Missing** | `hero_assets` table already exists; would need a small `GET /api/home/hero-theme` wrapper (no such route exists yet) | Later |
| 14 | Live Darshan awareness | `page.tsx:233,410` `resolveActiveLiveStreams()` | No Live Darshan route/screen exists anywhere in the native app | **Out of scope** | n/a | Later — Live Darshan isn't a native destination yet at all (consistent with Tirtha/Mandali being "contextual until usage proves otherwise" per `PRODUCT_CONSOLIDATION_PLAN.md`) |
| 15 | Community/Discovery below-fold sections | `BelowFoldSections.tsx` → `CommunitySection.tsx`, `DiscoverySection.tsx` | Not present | **Out of scope for Phase 1** | n/a | Later — explicitly out of scope per Slice 3 ("Out of scope: Full parity for every destination linked from Home") |

## Recommended implementation order

1. **Fix the 3 broken relic filenames** (row 5a) — one-line data fix in `index.tsx`'s `RELICS` array, zero contract work, currently a visible broken-image bug for a subset of real users today.
2. **Wire the already-shipped Dharm Veer roster and Panchang/calendar-upcoming calls into Home** (rows 9, 10) — both APIs already exist and are already proven working on other native screens this session (`app/dharm-veer.tsx`, `app/panchang.tsx`, `app/vrat.tsx`); this is the highest-value-for-lowest-risk pair since no new contract is needed at all.
3. **Add a practice-status + streak endpoint and wire real `done`/streak state into `practiceRows`** (rows 6, 7) — turns the "View all practices" list from decorative to real; needs one new (or extended) API response shape.
4. **Add the `onboarding_completed` gate** (row 12) — small, but a genuine correctness gap; coordinate with Slice 2 rather than fixing only inside Home.
5. **Sankalpa on Home** (row 8) — defer until there's a native Sankalpa surface at all; wiring it into Home before that exists would mean routing "Set your Sankalpa" to a screen that can't actually set one.
6. **Notification bell → real notifications screen** (row 11) — defer; needs a new native screen, not just a Home tap handler.
7. **Hero theming, Live Darshan, Community/Discovery** (rows 13-15) — later, no Phase 1 urgency; native's own product hierarchy (Home = one next action) argues against adding more surface area here anyway.

## Out of scope for Phase 1 (explicit)

- Full Community/Discovery section parity (`CommunitySection.tsx`, `DiscoverySection.tsx`).
- Hero image theme rotation.
- Live Darshan integration (no native destination exists yet).
- Calendar modal / date-picker UI (`CalendarModal.tsx`, `DatePickerModal.tsx`) — native's Panchang/Vrat screens already have their own simpler date handling.
