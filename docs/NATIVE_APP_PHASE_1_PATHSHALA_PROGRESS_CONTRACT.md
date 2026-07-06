# Pathshala Progress Contract Decision

## 1. Audit Findings

- **Endpoint Status**: `/api/pathshala/progress` is **missing**.
- **Native Bug**: Because the API is missing, native `[lessonId].tsx` always falls back to a direct Supabase `upsert` on `guided_path_progress`.
- **Native Side-Effect Gap**: The native fallback only updates `guided_path_progress`. It does not update `daily_sadhana.pathshala_done`, does not write local next-practice completion state, does not log the `shloka_read` sadhana event, does not call the daily/shloka streak path, and does not award karma.
- **Web Status**: Web Pathshala currently handles completion with a direct `guided_path_progress` update, `localStorage` next-practice hints, a direct `daily_sadhana.pathshala_done` upsert, and SadhanaEngine calls from `LessonClient.tsx`.
- **RLS Status**: `guided_path_progress` allows authenticated users to `SELECT`, `INSERT`, `UPDATE`, and `DELETE` their own rows. Moving progress writes behind an API is a consistency and side-effect decision, not an emergency RLS lockdown.
- **Karma Status**: Existing karma awards are centralized through `/api/karma/award` and the `award_karma` RPC. `SadhanaEngine.tracker.trackShlokaRead()` logs a `shloka_read` event; it does not itself award karma.
- **Streak Status**: `SadhanaEngine.streaks.markDone(userId, 'shloka')` updates `daily_sadhana.shloka_done` / `any_practice` / `streak_count`. It does not directly update `profiles.shloka_streak`.

## 2. Contract Decision
**Create `/api/pathshala/progress` and migrate native first.**
To prevent data inconsistency and make side effects explicit, progress writes should be centralized behind an API. The next implementation slice should create the API route, migrate native after the route is verified, and migrate web in a follow-up.

## 3. API Contract Definition

**Endpoint**: `POST /api/pathshala/progress`

**Request Payload**:
```typescript
{
  pathId: string;
  lessonIndex: number;
  currentLesson: number;
  completedLessons: number[];
  completed: boolean;
}
```

**Response Payload**:
```typescript
{
  success: boolean;
  progress: {
    pathId: string;
    currentLesson: number;
    completedLessons: number[];
    pathCompleted: boolean;
  };
  dailySadhanaUpdated: boolean;
  eventLogged: boolean;
  karmaEarned: number;
  streakUpdated: boolean;
}
```

**Server-Side Responsibilities**:
1. Validate user session.
2. Upsert `guided_path_progress` (updating `current_lesson`, `completed_lessons`, `status`, `completed_at`).
3. Upsert `daily_sadhana` setting `pathshala_done = true` for the local spiritual date.
4. Preserve the existing web `shloka_read` event behavior, either by calling the relevant SadhanaEngine tracker server-side or by documenting why Pathshala lesson completion should not log that event.
5. Decide whether Pathshala completion should also call the daily streak path (`markDone(userId, 'shloka')`) or whether `pathshala_done` alone is the correct practice signal.
6. If karma is awarded, use the existing `/api/karma/award` behavior or `award_karma` RPC semantics with reason `pathshala_lesson`; do not imply `trackShlokaRead()` awards karma.
7. Return idempotent results so repeated lesson completion does not double-award side effects.

## 4. Next Steps for Implementation
1. **API Repo**: Implement `src/app/api/pathshala/progress/route.ts` as defined above.
2. **Native Repo**: Remove the `try-catch` fallback in `app/pathshala/[pathId]/[lessonId].tsx` only after the API route exists and is verified.
3. **Web Repo**: Migrate the web lesson client to the same API in a follow-up after native is fixed, preserving current `localStorage` and completion-state behavior where needed.
