# Native App Phase 1 Route & Contract Matrix

Last updated: 2026-07-05

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
| `app/(tabs)/pathshala.tsx` | `/pathshala` | Supabase direct | `guided_path_progress` upsert | User-owned write is allowed by RLS; progression validation and side effects still need a contract | Local path data | Freeze contract before replacing with API/package | P1 |
| `app/pathshala/[pathId].tsx` | `/pathshala/[id]` | Supabase direct | None | Direct reads bypass central logic | None | Replace with API | P1 |
| `app/pathshala/[pathId]/[lessonId].tsx` | `/pathshala/[pathId]/[lessonId]` | Dead API call plus Supabase fallback | `guided_path_progress` upsert | Calls missing `/api/pathshala/progress`, then falls back to user-owned direct write allowed by RLS | Progression logic and local lesson data | Fix/freeze progress contract before UI migration | P1 |
| `app/dharm-veer.tsx` | `/dharm-veer` | Mixed (API + Supabase direct) | `daily_sadhana` upsert | User-owned write; daily-content completion should be contract-backed | Local fixture pool | Replace with API | P1 |
| `app/kosh.tsx` | `/kosh` | Mixed (API + Supabase direct) | None | Direct reads bypass central logic | None | Replace with API | P1 |
| `app/settings.tsx` | `/settings` | Mixed (API + Supabase direct) | `profiles` update | User-owned profile write; must not expose entitlement/admin columns | None | Keep with column guard or replace with API | P1 |
| `app/mandali.tsx` | `/mandali` | Supabase direct | `content_reports`, `user_blocked_profiles`, `posts` inserts | Community/global writes require validated RLS/API boundaries | Moderation/rules | Replace write actions with API or prove RLS per action | P0 |

## Local Logic to Replace

| File | Concern | Phase 1 Disposition | Priority |
|---|---|---|---|
| `lib/panchang.ts` | Duplicated Panchang math | Completed: replaced with `@sangam/panchang-engine` and deleted from native repo | Done |
| `lib/pathshala-lessons.ts` | Local static content | Replace with `@sangam/pathshala-engine` / API | P1 |
| `lib/pathshala-paths.ts` | Local static content | Replace with `@sangam/pathshala-engine` / API | P1 |
| `lib/dharm-veer.ts` | Local fixture data pool | Replace with API | P1 |
| `lib/vrat-data.ts` | Local fixture calendar | Replace with API | P1 |

## Verified As Safe
- `app/(auth)/login.tsx` and `app/(auth)/otp.tsx` are using correct standard providers.
- `lib/api.ts` correctly establishes an `apiFetch` wrapper.

## Blockers
- **P0**: Community/global writes in `app/mandali.tsx` (`posts`, `content_reports`, `user_blocked_profiles`) must not expand until each action is covered by a verified API/RLS boundary.
- **P1**: User-owned direct writes (`profiles`, `mala_sessions`, `guided_path_progress`, `tirtha_checkins`, `tirtha_saves`, `daily_sadhana`) are not automatically P0 after Phase 0 RLS hardening, but each route still needs contract review so native does not bypass domain validation, entitlement rules, or shared progress logic.
- **P1**: Native Pathshala lesson detail references missing `/api/pathshala/progress`. Decide whether to create that route and migrate both native and web progress writes, or remove the dead call and document direct-write behavior.
