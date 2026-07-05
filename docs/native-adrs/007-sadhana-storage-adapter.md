# ADR 007: Sadhana Storage Adapter

- **Status:** Proposed
- **Context:** `@sangam/sadhana-engine` currently imports a Dexie-backed singleton from `src/utils/offline-queue.ts`. Dexie depends on IndexedDB and is not React Native compatible. Native Phase 1 must not copy the engine or create a second event-tracking implementation; it needs an injectable queue adapter.
- **Decision:** Introduce a storage adapter boundary before using `@sangam/sadhana-engine` from the native app. The web implementation can keep Dexie behind the same interface. The native implementation should use SQLite for structured offline event records, SecureStore only for secrets, and AsyncStorage only for simple non-sensitive preferences.
- **Adapter interface:**
  ```ts
  export type SadhanaQueuedEvent = {
    id?: string | number;
    user_id: string;
    event_type: string;
    event_data: Record<string, unknown>;
    created_at?: string;
    synced: boolean;
    retry_count: number;
  };

  export interface SadhanaEventQueue {
    addEvent(event: Omit<SadhanaQueuedEvent, 'id' | 'retry_count'>): Promise<void>;
    getPendingEvents(limit?: number): Promise<SadhanaQueuedEvent[]>;
    markSynced(id: string | number): Promise<void>;
    incrementRetry(id: string | number): Promise<void>;
    getPendingCount(): Promise<number>;
    clearSynced(beforeIso?: string): Promise<void>;
    getLocalEvents(userId: string, days?: number): Promise<SadhanaQueuedEvent[]>;
    deleteEvent(id: string | number): Promise<void>;
  }
  ```
- **Sync boundary:** The queue stores local user activity events only. Server truth remains Supabase/API. Native may enqueue when offline, then sync through the existing event insert contract when online. If a server write fails with authorization or validation errors, the event must not retry forever; mark it failed or increment retry with a cap.
- **Conflict behavior:** Events are append-only. Conflicts are handled by idempotency keys or server-side dedupe where needed. Native must not locally overwrite server streaks, entitlements, Mandali state, or canonical practice totals.
- **Migration/versioning behavior:** Store a local queue schema version. SQLite migrations must be additive where possible. If a queue migration fails, preserve unsynced rows and report the failure; do not silently clear user activity.
- **Security/privacy impact:** Do not store tokens, refresh tokens, phone numbers, precise location, payment state, or entitlement state in the queue. Event payloads should avoid sensitive free text unless the feature explicitly requires it and the privacy policy covers it.
- **Store-compliance impact:** Offline practice logs are user activity data. App Store privacy labels and Play Data Safety forms must include this if shipped.
- **Implementation tasks:**
  1. Refactor `packages/sadhana-engine/src/utils/offline-queue.ts` so Dexie implements `SadhanaEventQueue` instead of exporting a hard-coded singleton only.
  2. Update `SadhanaTracker` to accept a queue adapter through constructor/config, with Dexie as the web default.
  3. Add a native `SadhanaSQLiteQueue` implementation after `expo-sqlite` is installed.
  4. Add tests for enqueue, pending query, retry cap, mark synced, clear synced, and migration preservation.
- **Verification plan:**
  ```bash
  cd "/Users/Business(C)/Sanatan Sangam/Shoonaya" && npm run build --workspace=@sangam/sadhana-engine
  cd "/Users/Business(C)/shoonaya-mobile" && npm run typecheck
  ```
- **Open questions:**
  - Should native event sync call Supabase directly under RLS or a server API route with stronger validation?
  - What retry cap and retention period should apply to failed offline events?
