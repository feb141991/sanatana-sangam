# Native App Phase 1 Pathshala Migration Audit

Last updated: 2026-07-05

## Verdict

Do not migrate native Pathshala UI yet. The current native Pathshala screens use local static path and lesson files, while `@sangam/pathshala-engine` is a Supabase-backed engine. The package proof is complete, but the read/write contract still needs to be frozen before native UI changes.

## Native Inventory

Native files currently depending on local Pathshala data:

- `/Users/Business(C)/shoonaya-mobile/lib/pathshala-paths.ts`
- `/Users/Business(C)/shoonaya-mobile/lib/pathshala-lessons.ts`
- `/Users/Business(C)/shoonaya-mobile/components/pathshala/PathCard.tsx`
- `/Users/Business(C)/shoonaya-mobile/app/(tabs)/pathshala.tsx`
- `/Users/Business(C)/shoonaya-mobile/app/pathshala/[pathId].tsx`
- `/Users/Business(C)/shoonaya-mobile/app/pathshala/[pathId]/[lessonId].tsx`

Current native behavior:

- `SEED_PATHS` drives the browse/progress list.
- `getPathLessons(pathId)` creates lessons from local in-app static pools.
- Progress writes use `guided_path_progress`.
- Lesson reader calls `/api/pathshala/progress`, but that route does not exist in the web/API repo. The call fails and the app falls back to direct Supabase `guided_path_progress` writes.
- TTS calls `/api/tts/generate`.

## Shared Package Inventory

Shared package:

- `/Users/Business(C)/Sanatan Sangam/Shoonaya/packages/pathshala-engine`

Useful exports:

- `createPathshalaEngine`
- `Corpus`
- `Enrollment`
- `Progress`
- `ShrutiEngine`
- `ExplainEngine`
- `ShlokaOfDayEngine`
- `StudyCircleManager`
- `BadgeManager`
- Pathshala types such as `PathshalaPath`, `TodayLesson`, `LearningProgress`, `ScriptureChunk`

Package concerns before native consumption:

- `package.json` has been cleaned for tarball consumption and a native compile-time import proof exists.
- The engine creates its own Supabase client from URL/key. Native already has `lib/supabase.ts`, so we need a decision: use engine factory with native env vars, or add a client-injection factory to avoid duplicate clients.
- The package depends on Supabase and optional React hooks/components. The non-React engine path is likely portable, but the React exports should be checked before packing.
- Native local lesson content is not a one-to-one match with the package engine. The package is contract-backed, not just a static array replacement.

## Progress Contract Finding

`/api/pathshala/progress` is currently a dead endpoint reference, not a working canonical API. The native app calls it in the lesson detail flow and then silently falls back to direct `guided_path_progress` writes.

The web app also writes `guided_path_progress` directly from the Pathshala lesson client. Therefore, adopting an API contract is not simply bringing native in line with an existing web pattern; it creates a new shared contract that should be considered for both web and native.

RLS for `guided_path_progress` permits authenticated users to read, insert, update, and delete their own rows. That means direct writes are not a P0 RLS violation. The reason to prefer an API boundary is to centralize validation and side effects such as `daily_sadhana.pathshala_done`, karma, badges, streak state, notification eligibility, and recommendation freshness.

## Migration Recommendation

Use a staged migration:

1. Keep the completed `@sangam/pathshala-engine` package proof as compile-time evidence only.
2. Freeze the Pathshala data contract:
   - Browse/read payloads.
   - Path detail payloads.
   - Lesson detail payloads.
   - Enrollment/progress write payloads.
   - Error and stale/offline behavior.
3. Decide the progress write boundary:
   - Option A: direct user-owned `guided_path_progress` writes remain allowed by RLS.
   - Option B: create `/api/pathshala/progress` and migrate native, then web, to the shared API contract.
4. Recommended: use API routes for enrollment/progress writes, and use shared package types/read helpers only where proven portable.
5. Migrate browse first:
   - replace `SEED_PATHS` reads only after the engine/API returns the same fields required by `PathCard`.
6. Migrate lesson detail second:
   - replace `getPathLessons(pathId)` after canonical lesson/chunk payloads exist.
7. Migrate progress writes last:
   - avoid mixed dead API calls plus direct `guided_path_progress` writes.
8. Delete `lib/pathshala-paths.ts` and `lib/pathshala-lessons.ts` only after all imports are gone.

## Stop Rules

Stop before implementation if:

- `@sangam/pathshala-engine` cannot be packed without React/native incompatibility.
- the engine does not expose the browse/lesson fields native needs.
- migration requires copying source or static corpus data into native.
- sacred content changes without content review.
- native would keep both local static lessons and package/API lessons active for the same route.
- creating `/api/pathshala/progress` would require undocumented side effects or product rules.
- web and native would intentionally keep different progress write paths without a documented decision.

## Next Implementation Prompt

Run a contract-freeze prompt before migrating UI:

```md
Freeze the Pathshala native/web data contract before UI migration. Verify that `/api/pathshala/progress` is currently missing, inspect all current `guided_path_progress` reads/writes in web and native, and decide whether to create a shared `/api/pathshala/progress` route for both clients. Audit side effects for `daily_sadhana.pathshala_done`, karma, badges, streaks, notifications, and recommendations. Do not migrate browse or lesson UI yet. Produce exact endpoint payloads, stop rules, and verification commands.
```
