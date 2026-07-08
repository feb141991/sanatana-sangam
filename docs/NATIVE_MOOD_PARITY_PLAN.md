# Native Mood Parity Plan

Last updated: 2026-07-08
Status: Planning only. No application code changed by this task. This is a design/scoping document, separate from the P0-3 completion-spoofing security work (`docs/NATIVE_DAILY_COMPLETION_P0_REMEDIATION_PLAN.md`) — the two must not be conflated. See Product Integrity section below for why.

## Why this doc exists

`docs/NATIVE_DAILY_COMPLETION_MATRIX.md` (P1-2) flagged Mood as a real, non-trivial web feature entirely absent from native. This plan scopes what a native Mood feature would look like, reusing web's existing API contract, before any implementation begins.

## What exists on web today (read in full or in relevant part for this plan)

Mood is not one screen on web — it's three overlapping surfaces built from the same underlying data (`user_mood_checkins`) and the same 10-mood taxonomy:

1. **`MoodPulse`** (`src/components/mood/MoodPulse.tsx`) — a full-screen modal dialog embedded in Home's `SadhanaSection.tsx`, shown once per spiritual day (gated by `localStorage['shoonaya_mood_dismissed']` plus backend `hasCompletedToday`/`hasDismissedToday`). Shows a 2-column mood grid; picking one reveals a confirm bar with "Done ✓" (logs the mood, dismisses, no further action) or "Explore →" (opens `MoodJourneySheet`).
2. **`MoodJourneySheet`** (`src/components/mood/MoodJourneySheet.tsx`, 404 lines) — the "Explore" destination, a bottom sheet with steps `context` (need/time/type, mirroring `DiscoverClient`'s time-selection step) → `mirror` (`MoodMirror.tsx`: an AI-generated reflection from `/api/mood/reflection-summary` plus weekly insight metrics) → `path` (`MoodPath.tsx`: the personalized recommendation stack from `/api/mood/recommendations`) → close (`MoodReturn.tsx`: a completion/return state).
3. **`/discover/mood`** (`src/app/(main)/discover/mood/page.tsx` → `DiscoverClient.tsx`, 691 lines) — a standalone full-page version of essentially the same `mood → time → recommendations` flow, reachable independently of Home (e.g. from a Discover entry point), *not* gated by the once-per-day dismissal logic.

`MoodFollowupSheet` (`src/components/mood/MoodFollowupSheet.tsx`) is a fourth, later-triggered surface: after a user clicks into a recommended practice from either flow, this sheet re-prompts them (on a subsequent visit) to log `after_mood` + an optional `reflection_note` via `/api/mood/complete`, with a small celebration animation.

`MoodGlyph` (`src/components/ui/MoodGlyph.tsx`, 322 lines) renders each of the 10 moods as a hand-drawn inline SVG (viewBox `0 0 32 32`, `stroke`/`fill` paths, no external icon library) — directly portable to native via `react-native-svg` (already a native dependency, used in `app/(tabs)/profile.tsx`'s `ProgressRing`). No new icon assets needed.

The 10-mood taxonomy (`src/lib/mood/registry.ts`, `MOODS_CONFIG`, dark/light color variants each): `anxious`, `grieving`, `angry`, `scattered`, `lost`, `joyful`, `seeking`, `lonely`, `overwhelmed`, `grateful`.

## API contract (reused, not reinvented)

All five required routes exist and were confirmed present on disk:

| Route | Method | Purpose | Current auth | Native-ready? |
|---|---|---|---|---|
| `/api/mood/checkin` | GET | Today's status: `hasCompletedToday`, `hasDismissedToday`, `openSession`, `lastCompletedMood`. Also accepts `?history=<days>` for a date→mood map. | `requireUserNotBanned(createServerSupabaseClient())` — **cookie-only** | **No — see Prerequisite below** |
| `/api/mood/checkin` | POST | Start a session: `{ before_mood, source_surface, context_need?, context_time?, context_type?, dismissed? }` → `{ checkin_id }`. Closes any prior open session as `abandoned` first. | Same — cookie-only | No |
| `/api/mood/complete` | POST | Close a session: `{ checkin_id, clicked_action?, completed_action?, after_mood?, reflection_note? }` → `{ success }`. | Same — cookie-only | No |
| `/api/mood/discover-track` | POST | Track skip/click on a recommendation: `{ checkinId, action: 'skip'\|'click', itemType, targetId? }` → `{ success }`. | `supabase.auth.getUser()` on `createServerSupabaseClient()` — **cookie-only** | No |
| `/api/mood/recommendations` | GET | `?mood=&need=&time=&type=&checkin_id=&full=true` → `{ recommendations: MoodRecommendation[] }`. Personalizes using the last 50 check-ins if authenticated; works unauthenticated too (no history). | Same — cookie-only, but degrades gracefully without a user | Partially (works logged-out, but won't persist recommendation metadata for a Bearer-only caller) |
| `/api/mood/reflection-summary` | GET | Last 14 days → AI-generated reflection paragraph, with a fallback summary if the AI call fails. Requires auth. | Same — cookie-only | No |

### Prerequisite: auth layer, not a new feature

**None of the five routes currently accept a Bearer token.** They all call `createServerSupabaseClient()` (`src/lib/supabase-server.ts`), which reads only Next.js request cookies — there is no fallback to an `Authorization` header. Native's `apiFetch()` (`lib/api.ts`) sends only a Bearer token, never cookies, so every one of these calls would fail auth as they stand today.

This is not a Mood-specific problem — it is the exact same gap already hit and fixed for `/api/pathshala/progress` (its own header comment: *"Auth switched from a cookie-only server client to getApiUser... native requests carry only a Bearer token and were being rejected with 401"*) and is why `/api/native/home-summary`, `/api/native/nitya-karma`, `/api/japa/complete`, and `/api/vrat/observe` all use `getApiUser(req)` (`src/lib/api-auth.ts`) instead. The fix is mechanical and well-precedented: swap `createServerSupabaseClient()` + `requireUserNotBanned`/`getUser()` for `getApiUser(req)` in each of the five route files, keeping every other line of logic unchanged. No schema change, no new table, no new route — this satisfies task rule 5 (no new tables — `user_mood_checkins` already has every field these routes read/write).

This prerequisite is listed as an expected file change below, not as something this plan implements.

## Product Integrity: Mood must not become a fake completion reward

Per this task's explicit brief and to keep this cleanly separated from the P0-3 security work: **Mood check-ins must not write to `daily_sadhana` or feed `/api/sadhana/perfect-day` in any way**, now or in this plan's v1. `user_mood_checkins` is a separate table from `daily_sadhana`, and none of the five routes above touch `daily_sadhana` — confirmed by reading all five. This plan does not propose changing that. If product later wants mood check-ins to count toward a daily completion or reward, that would need its own explicit product decision and, per the P0-3 remediation plan's own precedent, a server-verified write path from day one — not a client-trusted boolean. Recommend treating "should Mood ever be a rewarded completion" as a standing open question (see below), not something this plan or its implementation should decide unilaterally.

## Proposed native v1 scope

Web's three overlapping surfaces (daily modal, journey sheet, standalone page) exist because they evolved incrementally on web, not because a mobile-first design needs three separate constructs for one user journey. Native's own conventions in this codebase are full expo-router screens, not stacked modal-over-modal flows (see `app/vrat.tsx`, `app/quiz.tsx`, `app/dharm-veer.tsx` — each a single screen with internal step state, not nested sheets).

**Recommendation: consolidate into one screen**, `app/mood.tsx`, that reproduces `DiscoverClient.tsx`'s three-step flow (`mood → time/context → recommendations`) as internal state, matching the pattern already proven in `app/vrat.tsx` and `app/dharm-veer.tsx`. This covers the core, valuable part of both `MoodPulse`'s and `DiscoverClient`'s functionality (log a mood, get a recommendation) without building three redundant surfaces.

**Deferred to a later slice, not v1:**
- `MoodMirror`'s AI reflection (`/api/mood/reflection-summary`) and weekly insight metrics — richer, analytics-heavy, not required for the core "I feel X, suggest something" loop. Native's Home already has an established pattern of deferring analytics-heavy web features (per `docs/NATIVE_APP_PARITY_BLUEPRINT.md`'s phased approach).
- `MoodFollowupSheet`'s after-practice re-prompt — needs a return-visit trigger mechanism (web relies on a client-side pending-followup check on next page load) that doesn't have an obvious native equivalent yet (push notification? re-check on next app foreground?) — flagged as an open question, not designed here.
- Mood history (`GET /api/mood/checkin?history=<days>`) — the data is available and cheap to add later as a small section on the same screen or a separate view; not required for v1.

## Where Mood lives in navigation

**Recommendation: a Home card, not a full-screen modal takeover.** Web's `MoodPulse` is an aggressive once-daily modal over the entire Home screen; that pattern is a heavier interruption than most native daily-practice apps use for a non-core, optional feature, and native's Home (`app/(tabs)/index.tsx`) has no precedent for a blocking full-screen daily prompt — every existing Home surface (Panchang pill, practice cards, Dharm Veer) is a passive card the user opts into, not a takeover. A compact "How are you feeling?" card in Home's existing practice-card list (same visual tier as the Japa/Quiz/Pathshala/Dharm Veer cards, tapping through to `/mood`) reuses the daily-status check (`GET /api/mood/checkin`) to show either the mood-picker prompt (if not yet logged today) or a "You felt [mood] today" summary state (if already logged), without blocking the rest of Home.

**This placement decision needs explicit product sign-off before implementation** — it is a deliberate deviation from web's modal-first pattern, made for native-appropriateness reasons stated above, not a neutral parity choice. See Open Questions.

Mood is not proposed as a primary tab — it does not warrant one at native's current scale (one screen, optional, non-core), consistent with `PRODUCT_CONSOLIDATION_PLAN.md`'s "contextual until usage proves otherwise" treatment of Mandali/Tirtha before they were built out.

## Proposed route

`/mood` — bare route, single screen, no dynamic segment needed for v1 (no per-checkin detail view proposed). Confirmed no conflict: `app/mood.tsx` and `app/mood/` do not currently exist in the native repo (verified via direct file/dir check), and `/mood` does not collide with any existing top-level route (`(auth)`, `(tabs)`, `ai-chat`, `dharm-veer`, `dharm-veer/[id]`, `kosh`, `nitya-karma`, `notifications`, `panchang`, `pathshala/*`, `quiz`, `sankalpa`, `settings`, `shloka`, `vichaar-sabha`, `vichaar-sabha/[id]`, `vrat`). `lib/routes.ts`'s `resolveNativeRoute()` already has a comment explicitly naming `mood` as one of the "no native screen at all" paths that falls back to a caller-supplied default — this plan is what closes that gap; the route resolver would need one new line (`if (pathname.startsWith('/discover/mood') || pathname.startsWith('/mood')) return '/mood';`) alongside the existing dispatch table, not a redesign of it.

## Screen sketch (v1, `app/mood.tsx` — three internal steps, one screen)

```
Step 1 — mood                         Step 2 — context (time)             Step 3 — recommendations
┌─────────────────────────┐           ┌─────────────────────────┐        ┌─────────────────────────┐
│ ← Back      Mood         │           │ ← (change mood)    ✕    │        │ ← (change time)    ✕    │
│                           │           │                          │        │                          │
│  How are you feeling?     │           │   [glyph] You're feeling │        │  [mood pill] [time pill] │
│  Pick what's closest      │           │        Anxious           │        │                          │
│                           │           │                          │        │  For when you feel       │
│  ┌────┐ ┌────┐ ┌────┐    │           │  How much time do you    │        │  anxious                 │
│  │anx │ │grie│ │angr│    │           │  have?                   │        │                          │
│  └────┘ └────┘ └────┘    │  ──tap──> │                          │ ──tap─>│  ┌─────────────────────┐ │
│  ┌────┐ ┌────┐ ┌────┐    │           │  ⚡ Just 5 minutes       │        │  │ [icon]               │ │
│  │scat│ │lost│ │joy │    │           │  🕐 About 15 minutes     │        │  │ Stotram · 3 min       │ │
│  └────┘ ┌────┐ ┌────┐    │           │  ∞ I have all the time   │        │  │ Why this fits: ...    │ │
│  ┌────┐ │lone│ │over│    │           │                          │        │  │ [Start practice →]    │ │
│  │seek│ └────┘ └────┘    │           │  ✓ Just set my mood      │        │  └─────────────────────┘ │
│  └────┘ ┌────┐            │           │    — go home             │        │  (second card below)     │
│         │grat│            │           │                          │        │                          │
│         └────┘            │           │                          │        │  Done — go home           │
└─────────────────────────┘           └─────────────────────────┘        └─────────────────────────┘
```

10 moods in a 2- or 3-column grid (matches `Pill`/`Card` primitives already in `components/ui/`); each cell uses `MoodGlyph`'s ported SVG plus label, colored per the mood's `colour`/`bg`, same as web.

## State model

```
type MoodStep = 'mood' | 'time' | 'recs';

type MoodScreenState = {
  step: MoodStep;
  selectedMood: MoodKey | null;
  selectedTime: 'short' | 'medium' | 'open' | null;
  checkinId: string | null;
  recommendations: MoodRecommendation[];
  todayStatus: 'loading' | 'not_checked_in' | 'checked_in_today' | 'error';
  lastCompletedMood: MoodKey | null;
  recsLoading: boolean;
  recsError: boolean;
};
```

- **Loading**: initial `GET /api/mood/checkin` while resolving `todayStatus` (skeleton, reuse `components/ui/SkeletonLoader.tsx`); `recsLoading` while `GET /api/mood/recommendations` resolves (reuse the same shimmer-card pattern web uses, ported to `SkeletonLoader`).
- **Empty**: `recommendations.length === 0` after a successful fetch — reuse `components/ui/EmptyState.tsx` with a "No recommendations right now — try a different mood or check back later" message, matching web's plain "No recommendations found" state but using the native empty-state primitive instead of bare text.
- **Error**: any of the three API calls fails — reuse `components/ui/ErrorBoundary.tsx` conventions already established elsewhere (e.g. `app/dharm-veer/[id].tsx`'s `loadError` retry pattern) — a retry action, never a silent dead end.
- **Already checked in today**: `todayStatus === 'checked_in_today'` — show the "You felt [mood] · Explore →" summary state (mirrors `MoodPulse`'s `hasCompleted` branch) instead of the mood grid, with an explicit "Log a different mood" affordance rather than silently blocking re-entry (web allows re-checking in; a stale native cache should not trap the user).

## Accessibility requirements

- Each mood grid cell: `accessibilityRole="button"`, `accessibilityLabel` = the mood label (glyphs are decorative, not the accessible name), minimum 44×44 touch target (matches `MIN_TOUCH_TARGET` already used elsewhere in native, e.g. `components/mandali/JoinMandaliPrompt.tsx`).
- Color is never the only signal: mood selection state must pair color with a visible border/checkmark, not rely on the tinted background alone (matches this codebase's existing pattern of pairing active-state color with a border, e.g. `app/(tabs)/profile.tsx`'s tradition/language pickers).
- The "Secured"-style locked-state pattern is not applicable here (mood is always editable, unlike tradition), but the "already checked in today" summary state must have an `accessibilityLabel` stating both the logged mood and that it can be changed, not just the mood name alone — avoids a screen-reader user assuming it's locked.
- Recommendation cards: `accessibilityRole="button"` on the CTA, with a label combining the practice title and time estimate ("Start Stotram, 3 minutes"), not just "Start practice."
- Reduced motion: web gates its entrance animations behind `useReducedMotion()` throughout (`DiscoverClient.tsx`, `MoodPulse.tsx`); native should gate any `Animated`/`react-native-reanimated` transitions behind the existing reduced-motion check already established for `PanchangPill`'s auto-cycle (per task #56 in this session's history — "Stop pill auto-cycle under reduced motion").

## New files expected (implementation, not built by this plan)

Native (`/Users/Business(C)/shoonaya-mobile`):
- `app/mood.tsx` — the screen itself.
- `lib/mood.ts` — data layer: `fetchMoodStatus()`, `startMoodCheckin()`, `fetchRecommendations()`, `trackDiscoverAction()`, `completeMoodSession()` (thin wrappers around the five routes via `apiFetch`, mirroring `lib/mandali.ts`'s and `lib/vichaar.ts`'s established shape).
- `lib/mood-registry.ts` — ports `MOODS_CONFIG` (10 moods × dark/light colour pairs) verbatim; single source of truth shared by the grid and the summary state.
- `components/mood/MoodGlyph.tsx` — ports the 10 SVG glyphs to `react-native-svg`.
- One-line edit to `lib/routes.ts`'s `resolveNativeRoute()` (see Proposed route above) and a manual patch to `.expo/types/router.d.ts` for `/mood` (same established pattern as every other new route this session).
- Small edit to `app/(tabs)/index.tsx` to add the Home card (not a new file).

Web (`/Users/Business(C)/Sanatan Sangam/Shoonaya`) — prerequisite only, not new features:
- `src/app/api/mood/checkin/route.ts`, `complete/route.ts`, `discover-track/route.ts`, `recommendations/route.ts`, `reflection-summary/route.ts` — swap cookie-only auth for `getApiUser(req)`, per the Prerequisite section above. No behavior change for existing web callers (cookie auth still works first, per `getApiUser`'s own fallback order).

No new database tables or columns — `user_mood_checkins` already carries every field these routes and this plan need.

## Open Questions

1. **Home placement**: card-in-list (this plan's recommendation) vs. a lighter-weight modal-once-per-day matching web more closely vs. no Home presence at all (nav-only, e.g. under Discover/Pathshala) — needs explicit product sign-off, not an engineering default.
2. **Should mood ever feed a completion reward?** Recommend "no" as the standing default (see Product Integrity section); only revisit with an explicit product decision and a server-verified write path.
3. **`MoodFollowupSheet`'s return-visit trigger** — web relies on a client-side "pending followup" check on next page load; native has no clear equivalent without a push notification or app-foreground hook. Deferred, not designed here.
4. **AI reflection (`MoodMirror`) and weekly insights** — worth a native surface eventually, but v1 should ship without it per the deferred-scope list above; needs a decision on whether/when to build it.

## Verification performed for this plan

- Confirmed all five required API route files exist on disk (see table above and the direct file check run: all five returned `OK`).
- Confirmed native currently has no mood route: `rg -in "mood" app lib components` in the native repo returns only unrelated hits (`dharm-veer.tsx`'s hero-swipe mood field, `tirtha.tsx`'s `darshan_mood` temple check-in field, and `lib/routes.ts`'s own comment noting mood has no native screen yet) — zero references to a Discover-style mood feature.
- Confirmed `/mood` does not conflict with Expo Router: `app/mood.tsx` and `app/mood/` do not exist; checked against the full list of existing top-level `app/` entries.
- Confirmed no new database table is required: all data this plan needs already lives in `user_mood_checkins`, read/written entirely by the five existing routes.
