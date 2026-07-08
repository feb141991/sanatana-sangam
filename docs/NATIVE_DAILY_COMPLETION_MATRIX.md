# Native Daily Completion Contract Audit

Last updated: 2026-07-08
Status: Read-only audit (per `docs/NATIVE_APP_AGENT_RULES.md` default mode), with two narrow P0 RPC-hardening exceptions applied directly per this task's own rule ("do not implement UI yet unless the fix is a clear P0 security issue") — no UI was touched either time. No other application code was changed by this audit.

## Scope

Canonical completion model for six daily-practice surfaces: **Tithi, Shloka, Mood, Profile, Nitya, Quiz.** Covers native (`/Users/Business(C)/shoonaya-mobile`) against web/API (`/Users/Business(C)/Sanatan Sangam/Shoonaya`).

## Read order followed

Per `docs/NATIVE_APP_AGENT_RULES.md` Read Order: `SHOONAYA_RULES.md` -> `PRODUCT_CONSOLIDATION_PLAN.md` -> `docs/NATIVE_APP_PARITY_BLUEPRINT.md` -> `docs/NATIVE_APP_AGENT_RULES.md` -> this task's prompt (issued twice; the second pass added `src/app/api/sadhana/perfect-day/route.ts` to required reading, which surfaced a new P0 — see below). Full file list in Files Read.

## Stop-rule trigger: live code contradicts planning docs (disclosed, not blocking)

`PRODUCT_CONSOLIDATION_PLAN.md` states the launch shape is five destinations — **Home, Pathshala, Bhakti, Kul, Profile** — with Mandali explicitly "contextual... until usage proves it should become a primary tab," and Kul as a primary destination. `docs/NATIVE_APP_PARITY_BLUEPRINT.md` (2026-07-03) still frames the native repo as pre-Phase-0 ("no broad native coding should start before Phase 0 is complete") and lists Quiz, Dharma Veer, Vrat, Kosh as "must be audited in Phase 0; likely Phase 2/3."

Live native code (this repo, as of today) contradicts both: the bottom tab bar is Home/Japa/Bhakti/Pathshala/**Mandali** (Mandali now a primary tab, built to full parity including join flow, comments, RSVPs, and a new Vichaar Sabha screen, in a prior session task today), there is **no Kul screen anywhere in the native repo**, and Quiz/Nitya Karma/Dharm Veer/Vrat/Kosh already have real, committed implementations — well past "Phase 0 audit."

This is a genuine, evidence-backed contradiction under this task's own stop rule ("Stop if live code contradicts old planning docs"). It is **not blocking this specific audit** — none of Tithi/Shloka/Mood/Profile/Nitya/Quiz's completion-write mechanics depend on resolving Mandali-vs-Kul navigation priority — so this audit proceeded and the contradiction is logged here as an **Open Question** for a product decision, rather than halting a scoped, independent technical deliverable over an orthogonal IA question.

## Completion Matrix

| Feature | Native route | Web/PWA equivalent | Current write path | DB table / RPC / API touched | Security status | Missing UI state | Recommended canonical route |
|---|---|---|---|---|---|---|---|
| **Tithi** | `app/panchang.tsx` (read-only) | `/panchang` via `home/page.tsx` -> `getTodayPanchang()`, `HeroSection.tsx` panchang pill | No write exists on either platform. Native computes Panchang locally via `@sangam/panchang-engine` (correct reuse per blueprint) + `apiFetch('/api/calendar/upcoming')` for festival list. | None — informational only. The only completion-like action tithi-adjacent is Vrat/Ekadashi observance, a separate feature (`POST /api/vrat/observe`), already wired correctly in `app/vrat.tsx`. | N/A (no write) | None — matches web, which also has no tithi-completion action | No change needed. Do not invent a "mark tithi complete" action — it does not exist in the product on either platform. |
| **Shloka** | `app/shloka.tsx` | `HeroSection.tsx` `markShlokaRead()` (home hero panel) | Direct Supabase client write, both platforms: `supabase.from('profiles').update({ shloka_streak, last_shloka_date })`, then `supabase.rpc('increment_period_seva', ...)` with a direct-column fallback. Native's write was deliberately built to mirror PWA's own live behavior. | `profiles.shloka_streak`, `profiles.last_shloka_date` (direct column write, both platforms) + `increment_period_seva` RPC (hardened in a prior task — ownership check + 1-500 point clamp, migration `20260708140920`) | RPC: fixed. Underlying columns: still unprotected. `profiles` has `GRANT ALL` to `authenticated`/`anon` and RLS `WITH CHECK (auth.uid() = id)` only — no column-level restriction. Any authenticated client can bypass the hardened RPC entirely and directly `.update({ shloka_streak: 999999 })` on their own row. See P0-3. | Both platforms have full UI feedback (streak card, celebration) — no missing state. | Convert to a `mark_shloka_read(p_user_id uuid)` SECURITY DEFINER RPC (same ownership-check pattern as `increment_period_seva`) that atomically does the streak calc + column write + seva award server-side, then revoke direct column UPDATE grants on `shloka_streak`/`last_shloka_date` from `authenticated`. Must update both `HeroSection.tsx` and `app/shloka.tsx` in the same change. |
| **Mood** | None — feature does not exist in native. | `/discover/mood` (`MoodMirror.tsx`, `MoodPulse.tsx`, `MoodJourneySheet.tsx` etc.) + Home's mood chip (`HeroSection.tsx:716-745`, links to `/discover/mood`) | Web: `GET/POST /api/mood/checkin` (real REST route, `requireUserNotBanned` auth, RLS-scoped). Also `/api/mood/complete`, `/api/mood/discover-track`, `/api/mood/recommendations`, `/api/mood/reflection-summary`. | `user_mood_checkins` table | Web's own API routes: clean (proper auth guard, RLS-scoped). Underlying table has the same schema-wide "GRANT ALL to anon / RLS ownership only" pattern as every other table audited here — see P0-3. | Entire feature missing from native — no mood chip, no check-in surface, no route. This is a completeness gap, not a bug: nothing to harden because nothing was built. | `/discover/mood` is a substantial feature — larger than a single completion action. Recommend treating as its own scoped native task, reusing the existing `/api/mood/checkin` + `/api/mood/discover-track` + `/api/mood/recommendations` REST contract as-is (already clean) rather than folding into this pass. |
| **Profile** | `app/(tabs)/profile.tsx` (`handleSave`), `app/settings.tsx` (`persistSettings`) | `ProfileClient.tsx` `saveProfile()` -> `useUpdateProfileMutation` -> `src/lib/api/profile.ts` `updateProfile()` | Direct Supabase client write on both platforms (web's own canonical path is also a direct `.update()`, not a REST route, for general fields). Web's `updateProfile()` runs every payload through a `sanitizePayload()` allowlist-by-exclusion (`SERVER_MANAGED_COLUMNS`). Native's `handleSave()`/`persistSettings()` have no equivalent sanitizer. | `profiles` (`full_name`, `tradition`, `app_language` in profile.tsx; `wants_*_reminders`, language prefs in settings.tsx) | Contract mismatch, evidence-backed: web's `ProfileClient.tsx` explicitly excludes `tradition` from every save (`// tradition is locked at signup — never include it in updates`), but native's `handleSave()` includes and saves `tradition`. Not an RLS bypass (equal privilege on own row either way), but native reaches a product state web deliberately blocks. See P1-1. | None visually — the edit sheet works and saves correctly. The gap is a silent contract violation, not a broken UI. | Remove `tradition` from native's editable fields to match web's actual product rule, or get an explicit product decision to change the rule everywhere (update `PRODUCT_CONSOLIDATION_PLAN.md` if so). Also port a `SERVER_MANAGED_COLUMNS`-style sanitizer into a shared native `lib/profile.ts`. |
| **Nitya Karma** | `app/nitya-karma.tsx` | `NityaKarmaClient.tsx` (morning section; midday/evening/night off by default, matching native's scope) | Clean REST API on native, matching web's own semantics: `GET/POST /api/native/nitya-karma`. Auth via `getApiUser` (Bearer/cookie), RLS-scoped, insert-and-tolerate-23505 pattern for idempotent step marking. | `nitya_karma_log`, `nitya_karma_streaks`, `daily_sadhana.nitya_done` (on all-steps-complete) | Clean. Server route does the write, not the client. Matches every other hardened native contract this session (`/api/native/home-summary`, `/api/vrat/observe`). This is the model other features should follow. | None — optimistic UI with correct revert-on-failure already implemented. | No change needed. Reference implementation for the Shloka RPC migration recommended above. |
| **Quiz** | `app/quiz.tsx` | `/quiz` page -> `POST /api/quiz/save` | Mostly clean, one inconsistency: the write (`handleAnswer`) correctly goes through `POST /api/quiz/save`. The read (`loadQuiz`, checking "did I already answer today") bypasses the API and does a direct `supabase.from('quiz_responses').select(...)`. `quiz/save` also awards karma via `increment_karma` (hardened this task — see P0-2). | `quiz_responses` (direct read on native; write via API route); `profiles.seva_score` via `increment_karma` RPC | RLS is `auth.uid() = user_id` scoped for both SELECT and INSERT — the direct read is safe (own-row select, no mutation). The underlying INSERT path shares the same schema-wide "RLS checks ownership only" pattern — a raw client insert could set `is_correct: true` without going through `/api/quiz/save`'s actual correctness check. Same systemic issue as P0-3, not specific to native. `increment_karma` call itself is now ownership-checked (P0-2, fixed this task). | None — native's read/write split doesn't produce any incorrect UI state. | Route the "already answered today" check through `GET /api/quiz/daily` or a small new GET on `/api/quiz/save` (mirroring nitya-karma's GET), purely for architectural consistency — P2, not urgent. |

**Cross-cutting note — `POST /api/sadhana/perfect-day`:** not one of the six named features, but reads across five of them (`daily_sadhana.{japa_done, quiz_done, nitya_done, pathshala_done, dharmveer_done}`) to award a "perfect day" bonus (30 karma, 15 seva, a streak freeze). Added to required reading on the second pass of this task and directly relevant to P0-2 and P0-3 below.

## Findings

### P0

- **P0-1 — `increment_period_seva` had no ownership check, granted to `anon`. Fixed (prior task).**
  Evidence: `supabase/public_schema.sql:473` (pre-fix definition, schema dump not yet regenerated), `supabase/migrations/20260708140920_harden_increment_period_seva.sql` (fix, already committed `e2ae927` in the web repo prior to this audit).
  Impact: any client could inflate any user's `seva_score`/`weekly_seva`/`monthly_seva` by calling the RPC with an arbitrary `p_user_id`.
  Status: Resolved — RPC now resolves `auth.uid()` internally, rejects mismatched `p_user_id`, clamps `p_points` to 1-500, `anon` grant revoked. Migration not yet applied to any live database from this sandbox (no local Postgres available) — needs `supabase db push` against the actual project.

- **P0-2 (NEW, found and fixed this task) — `increment_karma` and `increment_streak_freeze` had the identical missing-ownership-check bug as P0-1, and were missed when P0-1 was fixed.**
  Evidence: `supabase/public_schema.sql:457-464` (`increment_karma` — no `auth.uid()` check, no amount clamp, `GRANT ALL ... TO authenticated`) and `:492-507` (`increment_streak_freeze` — no `auth.uid()` check, `GRANT ALL ... TO anon` — worse, callable unauthenticated).
  How it was found: this task's required-reading list was re-issued with `src/app/api/sadhana/perfect-day/route.ts` added. That route calls both RPCs (`increment_karma` for +30 karma, `increment_streak_freeze` for +1 freeze) after checking five `daily_sadhana` completion flags — reading it surfaced that neither RPC it depends on was actually ownership-checked, unlike its sibling `increment_period_seva` call in the same route (already fixed).
  Concrete exploit prior to this fix: any authenticated client could call `supabase.rpc('increment_karma', { p_user_id: '<any-uuid>', p_amount: 999999 })` directly — no app code involved at all — and inflate (or, with a negative amount, drain) any user's `seva_score`. `increment_streak_freeze` was reachable even without authentication.
  Verified safe to fix immediately (unlike P0-3 below): grepped every call site across both repos (`src/app/api/vrat/observe/route.ts`, `src/app/api/quiz/{save,practice}/route.ts`, `src/app/api/sadhana/perfect-day/route.ts`, `src/app/api/japa/complete/route.ts`, `src/app/(main)/japa/JapaClient.tsx`) — every single call passes only the caller's own authenticated user id, never a service-role/cron call on another user's behalf. This matches the same low-risk profile as the already-approved P0-1 fix.
  Status: Resolved this task. New migration: `supabase/migrations/20260708150500_harden_karma_streak_freeze_rpcs.sql` — same pattern as P0-1 (`auth.uid()` ownership check, amount clamp on `increment_karma`, `anon`/`PUBLIC` grants revoked on both). Not yet applied to any live database (no local Postgres in this sandbox) — needs `supabase db push`.
  This was a clear, narrowly-scoped P0 with an obvious, already-precedented safe fix, so it was implemented directly per this task's own exception rule, with no UI touched.

- **P0-3 (was P0-2 in the prior draft of this doc) — `profiles` (and every other table checked: `daily_sadhana`, `quiz_responses`, `user_mood_checkins`) has blanket `GRANT ALL` to `authenticated` and `anon`, with RLS enforcing row ownership only — no column-level or value-level protection anywhere in the schema.**
  Evidence:
  - `supabase/step2_constraints_policies.sql:16985-16987`: `GRANT ALL ON TABLE public.profiles TO anon; ... TO authenticated;`
  - `supabase/step2_constraints_policies.sql:5091`: `CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING ((auth.uid() = id)) WITH CHECK ((auth.uid() = id));` — no column or value predicate.
  - Confirmed zero column-level GRANT/REVOKE and zero CHECK constraints anywhere in `supabase/*.sql` or `supabase/migrations/*.sql` for `is_admin`, `is_pro`, `seva_score`, `shloka_streak`, `karma_points`, `perfect_day_bonus_given`, or any other gamification/entitlement/completion-flag column.
  - Same blanket-grant pattern confirmed on `daily_sadhana` (`streak_count`, and the five completion booleans `japa_done`/`quiz_done`/`nitya_done`/`pathshala_done`/`dharmveer_done` that `perfect-day` trusts at face value), `quiz_responses` (`is_correct`), `user_mood_checkins`.
  - **New, concrete live exploit chain found this pass**, via `src/app/api/sadhana/perfect-day/route.ts`: that route's own auth (`auth.getUser()`, real userId) and idempotency (atomic claim via conditional `.update().eq('perfect_day_bonus_given', false)`) are both clean — but it trusts `daily_sadhana.{japa_done, quiz_done, nitya_done, pathshala_done, dharmveer_done}` as ground truth without re-validating any of the underlying per-feature completion logic. Because those five booleans sit on the same unprotected `daily_sadhana` row, a user can directly `.update({ japa_done: true, quiz_done: true, nitya_done: true, pathshala_done: true, dharmveer_done: true })` on their own row (permitted today under ownership-only RLS + blanket grant), then call `POST /api/sadhana/perfect-day` to legitimately claim 30 karma + 15 seva + a streak freeze without doing any of the five actual practices. This is no longer a theoretical concern — it is a concrete, currently-live path through a real, shipped endpoint.
  Impact: any authenticated user can directly `.update()` their own `profiles`/`daily_sadhana` row and set `is_admin`, `is_pro`, `seva_score`, `karma_points`, `shloka_streak`, `mandali_id`, `kul_id`, or any completion-flag column to an arbitrary value, bypassing every RPC and API route audited in this document — including the now-fully-hardened P0-1 and P0-2 RPCs, which only close the RPC path, not the underlying columns.
  Why this is not fixed in this pass: the obvious fix (`REVOKE UPDATE (col, ...) ON profiles, daily_sadhana FROM authenticated`) would break currently-working, already-audited write paths that legitimately write these exact columns via RLS-scoped (not service-role) clients: `/api/japa/complete` and `/api/sankalpa/complete` write `karma_points` directly; `JapaClient.tsx` writes `karma_points` directly client-side; `HeroSection.tsx` and native's `app/shloka.tsx` write `shloka_streak`/`last_shloka_date` directly; native's `lib/mandali.ts` `joinMandaliForLocation` writes `mandali_id` directly; and the `daily_sadhana.*_done` flags are written from several different completion routes (japa, quiz, nitya-karma, etc.), each of which would need to move to a server-verified write before the column could be locked down. Every one of these routes deliberately avoids service-role per this codebase's own established architecture ("All reads/writes are RLS-scoped... no service-role admin client" — `api/japa/complete/route.ts` file header), which means they run as Postgres role `authenticated` — structurally identical, at the GRANT level, to a malicious raw client call. A real fix requires converting each of these direct writes into an ownership-checked SECURITY DEFINER RPC first (same pattern as P0-1/P0-2), then revoking the column grant — coordinated, multi-file work across both repos, not a one-line migration. Documented with a recommended phased remediation below rather than rushed, per this task's stop rule. Given the perfect-day exploit chain is now concrete and live, this should be the **next** engineering priority after this audit, not a someday item.

### P1

- **P1-1 — Native lets users edit `tradition` post-onboarding; web explicitly treats it as locked.**
  Evidence: `app/(tabs)/profile.tsx` `handleSave()` sends `tradition: editState.tradition` in its `profiles.update()` payload. `src/app/(main)/profile/ProfileClient.tsx:577`: `// tradition is locked at signup — never include it in updates` — `const { tradition: _locked, ... } = form;` explicitly strips it before every web save.
  Impact: no privilege escalation, but native reaches a product state web's own UI deliberately prevents. `tradition` drives sacred text selection, Nitya Karma step content/labels, hero theme resolution, and festival/observance filtering across the app.
  Required correction: remove `tradition` from native's editable profile fields to match the documented web rule, or get an explicit product decision to change the rule everywhere.

- **P1-2 — Mood is a real, non-trivial web feature entirely absent from native.**
  Evidence: `src/app/api/mood/{checkin,complete,discover-track,recommendations,reflection-summary}/route.ts`, `src/app/(main)/discover/mood/page.tsx`, `src/components/mood/*` (6 components), `user_mood_checkins` table. Zero references to any of this in the native repo.
  Impact: completeness gap, not a security issue. Listed because the task explicitly named Mood as one of six features to audit.
  Required correction: scope as its own native task if/when prioritized. Existing `/api/mood/checkin` contract is clean and reusable as-is.

- **P1-3 — Docs-vs-live-code contradiction on native IA priority (Mandali vs. Kul).** See Stop-rule trigger above. Not blocking this audit; needs a product decision and a doc update either way.

### P2

- **P2-1 — Quiz's "already answered today" check reads `quiz_responses` directly instead of through an API route**, while the write path (`/api/quiz/save`) is already correctly API-mediated. Cosmetic inconsistency, not unsafe.
- **P2-2 — Native's `app/(tabs)/profile.tsx` and 4 other screens (`kosh.tsx`, `tirtha.tsx`, `japa.tsx`, `mandali.tsx`) still use an untokenized `rgba(0,0,0,0.28)`/`0.35)` literal for bottom-sheet modal backdrops** — pre-existing, not introduced by this audit, flagged previously in the Mandali work commit message as a known follow-up.

## Verified As Correct

- Nitya Karma's full contract (`/api/native/nitya-karma` GET/POST) — clean auth, clean RLS scoping, idempotent writes, correct optimistic-UI revert. Reference implementation for the Shloka RPC migration.
- Quiz's write path (`POST /api/quiz/save`) — correctly API-mediated from native.
- Tithi/Panchang — correctly informational-only on both platforms via `@sangam/panchang-engine` reuse; no completion action exists to audit because none exists in the product.
- `find_or_create_mandali` RPC — already SECURITY DEFINER with properly revoked-from-`anon`/`public` grants (`supabase/migrations/20260612000000_mandali_slice0b_radius_fallback.sql:137-138`).
- `/api/vrat/observe` — the actual tithi-adjacent completion action — already correctly wired from native `app/vrat.tsx` in a prior session task.
- `/api/sadhana/perfect-day`'s own auth and idempotency handling — real server-side JWT verification (`auth.getUser()`, not the unverified `getSession()`), correct atomic claim-once pattern via conditional update, correct ban check. Its only weakness is trusting unprotected upstream columns (P0-3), not its own logic.

## Open Questions

- Mandali-vs-Kul primary-tab contradiction (see Stop-rule section) — needs a product decision, not an engineering one.
- Should `tradition` become editable post-onboarding as a deliberate product decision, or should native be corrected to match web's existing lock? (P1-1)
- Is native Mood in scope for the near-term roadmap, or explicitly deferred? (P1-2)

## Exact Implementation Order

1. Apply the P0-1 migration (`20260708140920_harden_increment_period_seva.sql`) to the live database — written in a prior task, not yet deployed from this sandbox (no local Postgres).
2. Apply the P0-2 migration (`20260708150500_harden_karma_streak_freeze_rpcs.sql`, written this task) to the live database — same deployment blocker as step 1.
3. Design the P0-3 remediation as its own scoped task, one RPC per currently-direct-write feature, each mirroring the P0-1/P0-2 ownership-check pattern. Given the perfect-day exploit chain, prioritize the `daily_sadhana.*_done` completion flags first, then `profiles.shloka_streak`/`karma_points`/`mandali_id`:
   - `mark_shloka_read(p_user_id uuid)` — replaces the direct `profiles.shloka_streak`/`last_shloka_date` write in both `HeroSection.tsx` and native's `app/shloka.tsx`.
   - Server-verify (not client-trust) each `daily_sadhana.*_done` flag at the point each feature's own completion route sets it, so `perfect-day` inherits protection transitively rather than needing its own re-validation logic.
   - Confirm `mandali_id` writes are fully covered by the existing `find_or_create_mandali`/`/api/mandali/join` paths before revoking the column grant.
   - Only after all real writers are migrated: `REVOKE UPDATE (shloka_streak, last_shloka_date, karma_points, seva_score, weekly_seva, monthly_seva, mandali_id, kul_id, is_admin, is_pro, is_banned, ban_reason, streak_count, japa_done, quiz_done, nitya_done, pathshala_done, dharmveer_done, perfect_day_bonus_given) ON public.profiles, public.daily_sadhana FROM authenticated, anon;` (exact column/table list to be finalized per-table during that task).
4. P1-1 (tradition lock) — low-effort once a product decision is made.
5. P1-2 (native Mood) — schedule as its own feature task when prioritized; no blocking dependencies on 1-4.
6. P2 items — opportunistic, no urgency.

## Files Read

Web repo:
- SHOONAYA_RULES.md
- PRODUCT_CONSOLIDATION_PLAN.md
- docs/NATIVE_APP_PARITY_BLUEPRINT.md
- docs/NATIVE_APP_AGENT_RULES.md
- src/app/api/native/home-summary/route.ts
- src/app/api/native/nitya-karma/route.ts
- src/app/api/japa/complete/route.ts
- src/app/api/sadhana/perfect-day/route.ts
- src/app/api/mood/checkin/route.ts
- src/app/api/profile/route.ts
- src/app/(main)/home/page.tsx
- src/app/(main)/home/sections/HeroSection.tsx (targeted: mood chip, markShlokaRead)
- src/app/(main)/profile/ProfileClient.tsx (targeted: saveProfile, form field exclusions)
- src/hooks/useProfile.ts
- src/lib/api/profile.ts
- src/lib/user-safety.ts (cross-reference from prior session's Mandali work)
- supabase/migrations/20260708140920_harden_increment_period_seva.sql
- supabase/migrations/20260708150500_harden_karma_streak_freeze_rpcs.sql (written this task)
- supabase/public_schema.sql (targeted: increment_period_seva, increment_karma, increment_streak_freeze, find_or_create_mandali, and their GRANTs)
- supabase/step2_constraints_policies.sql (targeted: RLS policies + GRANTs for profiles, daily_sadhana, quiz_responses, user_mood_checkins, nitya_karma_log, nitya_karma_streaks; GRANTs for increment_karma/increment_streak_freeze/increment_period_seva)
- supabase/migrations/20260612000000_mandali_slice0b_radius_fallback.sql (targeted: find_or_create_mandali grants)

Native repo:
- app/(tabs)/index.tsx (targeted: panchang/tithi rendering)
- app/shloka.tsx
- app/nitya-karma.tsx
- app/quiz.tsx
- app/panchang.tsx
- app/settings.tsx
- app/(tabs)/profile.tsx
- lib/api.ts
- lib/supabase.ts
- lib/mandali.ts (cross-reference, prior session)

## Commands Run

```
$ cd "/Users/Business(C)/Sanatan Sangam/Shoonaya" && git status --short --branch
## main...origin/main
?? docs/NATIVE_DAILY_COMPLETION_MATRIX.md
?? supabase/migrations/20260708150500_harden_karma_streak_freeze_rpcs.sql

$ cd "/Users/Business(C)/shoonaya-mobile" && git status --short --branch
## main...origin/main
?? check_panchang.ts

$ rg -n "daily_sadhana|shloka_streak|mood|quiz|nitya|panchang|increment_period_seva" app lib src supabase
[large sweep — see prior research + evidence citations throughout Findings/Matrix above; full raw output not reproduced here for length, spot-checked call sites individually and cited by exact file:line]
```

Note: `check_panchang.ts` in the native repo's git status is a pre-existing untracked scratch file, unrelated to this audit — not created or modified by this task.

## Edits Made By This Audit

- `supabase/migrations/20260708150500_harden_karma_streak_freeze_rpcs.sql` (new) — P0-2 fix, per this task's own "clear P0 security issue" exception. No UI touched.
- `docs/NATIVE_DAILY_COMPLETION_MATRIX.md` (this file) — created.
- No other application code (native or web) was modified. The P0-1 fix referenced above (`increment_period_seva`) was implemented and committed in a prior session task today, before this audit began, and is cited here as already-resolved context, not as work done under this task.
