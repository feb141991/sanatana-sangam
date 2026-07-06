# Native App Phase 1 Route & Contract Matrix

Last updated: 2026-07-06 (Slice 4D: Pathshala progress/profile API contract cleanup)

## Matrix

| Native Route / File | Web/API Equivalent | Current Data Source | User Writes | Security/RLS Concern | Duplicated Logic Concern | Phase 1 Disposition | Priority |
|---|---|---|---|---|---|---|---|
| `app/(auth)/login.tsx` | `/login` | Supabase auth | None | Standard auth handled safely | None | Keep | P0 |
| `app/(auth)/onboarding.tsx` | `/onboarding` | Supabase direct | `profiles` upsert | User-owned profile write; must not expose entitlement/admin columns | None | Keep with column guard or replace with API | P1 |
| `app/(auth)/otp.tsx` | `/verify-otp` | API (`/api/auth/whatsapp-otp/verify`) | OTP Verify | None | None | Keep | P0 |
| `app/(tabs)/index.tsx` | `/` (Home) | Mixed (API + Supabase direct) | None | Direct DB reads bypass unified API logic | Home state logic | Replace with API | P1 |
| `app/(tabs)/bhakti.tsx` | `/bhakti` | Mixed (API + Supabase direct) | `mala_sessions` insert | User-owned write; verify RLS and server validation before expansion | Mala progression | Replace with API or shared package | P1 |
| `app/(tabs)/tirtha.tsx` | `/tirtha` | Mixed (API + Supabase direct) | `tirtha_saves` upsert/delete, `tirtha_checkins` insert | Canonical place import is API-backed; user-owned save/checkin writes depend on RLS | Checkin rules | Keep only if RLS verified; otherwise replace with API | P1 |
| `app/(tabs)/profile.tsx` | `/profile` | Supabase direct | `profiles` update | User-owned profile write; must not expose entitlement/admin columns | None | Keep with column guard or replace with API | P1 |
| `app/(tabs)/pathshala.tsx` | `/pathshala` | API (`/api/pathshala/paths`, `/api/pathshala/progress`, `/api/pathshala/enroll`) | None (enrollment via `POST /api/pathshala/enroll`) | Resolved: no direct table access remains; API routes are RLS-scoped to the caller | None remaining | Done (Slice 4D) | Done |
| `app/pathshala/[pathId].tsx` | `/pathshala/[id]` | API (`/api/pathshala/paths/[pathId]`, `/api/pathshala/progress`) | None | Resolved: lesson list and progress both API-backed (Slice 4C + 4D) | None remaining | Done | Done |
| `app/pathshala/[pathId]/[lessonId].tsx` | `/pathshala/[pathId]/[lessonId]` | API (`/api/pathshala/paths/[pathId]`, `/api/pathshala/progress`) | POST via `/api/pathshala/progress` | Resolved: `/api/pathshala/progress` now authenticates via `getApiUser` (cookie OR Bearer); previously cookie-only, so native "Done" taps were silently 401ing. Direct `profiles` (app_language/meaning_language) read intentionally left as-is — out of scope for Slice 4D | None remaining for progress; language-pref read still direct (by design) | Done (Slice 4D) | Done |
| `app/dharm-veer.tsx` | `/dharm-veer` | Mixed (API + Supabase direct) | `daily_sadhana` upsert | User-owned write; daily-content completion should be contract-backed | Local fixture pool | Replace with API | P1 |
| `app/kosh.tsx` | `/kosh` | Mixed (API + Supabase direct) | None | Direct reads bypass central logic | None | Replace with API | P1 |
| `app/settings.tsx` | `/settings` | Mixed (API + Supabase direct) | `profiles` update | User-owned profile write; must not expose entitlement/admin columns | None | Keep with column guard or replace with API | P1 |
| `app/mandali.tsx` | `/mandali` | Supabase direct | `content_reports`, `user_blocked_profiles`, `posts` inserts | Community/global writes require validated RLS/API boundaries | Moderation/rules | Replace write actions with API or prove RLS per action | P0 |

## Local Logic to Replace

| File | Concern | Phase 1 Disposition | Priority |
|---|---|---|---|
| `lib/panchang.ts` | Duplicated Panchang math | Completed: replaced with `@sangam/panchang-engine` and deleted from native repo | Done |
| `lib/pathshala-lessons.ts` | Local static content | Completed: deleted in Slice 4C, replaced by `/api/pathshala/paths/[pathId]` | Done |
| `lib/pathshala-paths.ts` | Local static content | Completed: deleted in Slice 4C, replaced by `/api/pathshala/paths/[pathId]`; only the `PathshalaPath` type survives in `lib/pathshala-types.ts` | Done |
| `lib/dharm-veer.ts` | Local fixture data pool | Replace with API | P1 |
| `lib/vrat-data.ts` | Local fixture calendar | Replace with API | P1 |

## Verified As Safe
- `app/(auth)/login.tsx` and `app/(auth)/otp.tsx` are using correct standard providers.
- `lib/api.ts` correctly establishes an `apiFetch` wrapper.

## Blockers
- **P0**: Community/global writes in `app/mandali.tsx` (`posts`, `content_reports`, `user_blocked_profiles`) must not expand until each action is covered by a verified API/RLS boundary.
- **P1**: User-owned direct writes (`profiles`, `mala_sessions`, `guided_path_progress`, `tirtha_checkins`, `tirtha_saves`, `daily_sadhana`) are not automatically P0 after Phase 0 RLS hardening, but each route still needs contract review so native does not bypass domain validation, entitlement rules, or shared progress logic.
- **Resolved (Slice 4D)**: `/api/pathshala/progress` existed but authenticated via a cookie-only server client (`createServerSupabaseClient()` + `requireUserNotBanned`), which cannot read a Bearer-only Authorization header — every native "Done" tap was silently receiving a 401 despite the route and payload shape being correct. Fixed by switching to `getApiUser(req)` (cookie OR Bearer) across `/api/pathshala/progress` (GET + POST) and the new `/api/pathshala/enroll` (POST). Both routes now reuse the RLS-scoped client `getApiUser` resolves (not a service-role admin client) — `guided_path_progress` RLS already permits a user to read/write their own rows, so no elevated privilege is needed. All three native Pathshala screens (`(tabs)/pathshala.tsx`, `pathshala/[pathId].tsx`, `pathshala/[pathId]/[lessonId].tsx`) no longer call `.from('guided_path_progress')` directly — confirmed via `rg` sweep.
