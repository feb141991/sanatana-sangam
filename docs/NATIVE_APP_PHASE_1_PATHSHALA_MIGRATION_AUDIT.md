# Native App Phase 1 Pathshala Migration Audit

Last updated: 2026-07-05

## Verdict

Do not migrate native Pathshala yet. The current native Pathshala screens use local static path and lesson files, while `@sangam/pathshala-engine` is a Supabase-backed engine. The package can become the canonical data path, but it needs a packaging pass and a contract decision before native code changes.

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
- Lesson reader also calls `/api/pathshala/progress` and falls back to direct Supabase `guided_path_progress` writes.
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

- `package.json` should be cleaned like `@sangam/panchang-engine`: add `files: ["dist"]` and put `types` first in the export condition.
- The engine creates its own Supabase client from URL/key. Native already has `lib/supabase.ts`, so we need a decision: use engine factory with native env vars, or add a client-injection factory to avoid duplicate clients.
- The package depends on Supabase and optional React hooks/components. The non-React engine path is likely portable, but the React exports should be checked before packing.
- Native local lesson content is not a one-to-one match with the package engine. The package is contract-backed, not just a static array replacement.

## Migration Recommendation

Use a staged migration:

1. Package `@sangam/pathshala-engine` via the accepted tarball workflow.
2. Add a compile-time native import proof only, similar to `lib/shared-package-proof.ts`.
3. Decide the native data contract:
   - Option A: native imports `createPathshalaEngine` and uses Supabase under RLS.
   - Option B: native uses web API routes for browse/enroll/progress and imports only shared types.
4. Migrate browse first:
   - replace `SEED_PATHS` reads only after the engine/API returns the same fields required by `PathCard`.
5. Migrate lesson detail second:
   - replace `getPathLessons(pathId)` after canonical lesson/chunk payloads exist.
6. Migrate progress writes last:
   - avoid mixed `/api/pathshala/progress` plus direct `guided_path_progress` writes.
7. Delete `lib/pathshala-paths.ts` and `lib/pathshala-lessons.ts` only after all imports are gone.

## Stop Rules

Stop before implementation if:

- `@sangam/pathshala-engine` cannot be packed without React/native incompatibility.
- the engine does not expose the browse/lesson fields native needs.
- migration requires copying source or static corpus data into native.
- sacred content changes without content review.
- native would keep both local static lessons and package/API lessons active for the same route.

## Next Implementation Prompt

Run a package-proof prompt before migrating UI:

```md
Package `@sangam/pathshala-engine` with the Phase 1 tarball workflow, clean its package metadata, add a native compile-time import proof for shared types only, and do not change Pathshala UI behavior. Verify native `npm run typecheck` and `npx expo-doctor`. Stop if the package pulls React-only exports or Node/browser-only APIs into the native bundle.
```
