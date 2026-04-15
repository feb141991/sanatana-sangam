// ============================================================
// Sync — manages offline queue → Supabase synchronisation
// Handles connectivity changes, retry logic, conflict resolution
// ============================================================

import type { SupabaseClient } from '@supabase/supabase-js';
import { offlineQueue } from './offline-queue';

export class SyncManager {
  private supabase: SupabaseClient;
  private syncing = false;
  private listeners: Array<(status: SyncStatus) => void> = [];

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  // Start listening for connectivity changes
  startAutoSync() {
    if (typeof window === 'undefined') return;

    window.addEventListener('online', () => this.sync());

    // Periodic sync every 5 minutes when online
    setInterval(() => {
      if (navigator.onLine && !this.syncing) this.sync();
    }, 5 * 60 * 1000);

    // Initial sync
    if (navigator.onLine) this.sync();
  }

  // Manual sync trigger
  async sync(): Promise<SyncResult> {
    if (this.syncing) return { synced: 0, failed: 0, pending: 0 };
    this.syncing = true;
    this.notify({ state: 'syncing' });

    const pending = await offlineQueue.getPendingEvents();
    let synced = 0;
    let failed = 0;

    // Batch insert for efficiency (max 50 per batch)
    const batches = this.chunk(pending, 50);

    for (const batch of batches) {
      const rows = batch.map(e => ({
        user_id: e.user_id,
        event_type: e.event_type,
        event_data: e.event_data,
        created_at: e.created_at,
      }));

      const { error } = await this.supabase.from('sadhana_events').insert(rows);

      if (!error) {
        for (const event of batch) {
          if (event.id) await offlineQueue.markSynced(event.id);
        }
        synced += batch.length;
      } else {
        // Fall back to individual inserts
        for (const event of batch) {
          const { error: singleErr } = await this.supabase.from('sadhana_events').insert({
            user_id: event.user_id,
            event_type: event.event_type,
            event_data: event.event_data,
            created_at: event.created_at,
          });

          if (!singleErr && event.id) {
            await offlineQueue.markSynced(event.id);
            synced++;
          } else {
            if (event.id) await offlineQueue.incrementRetry(event.id);
            failed++;
          }
        }
      }
    }

    // Clean up old synced events
    await offlineQueue.clearSynced();

    const remainingPending = await offlineQueue.getPendingCount();
    this.syncing = false;
    this.notify({ state: remainingPending > 0 ? 'pending' : 'synced', pending: remainingPending });

    return { synced, failed, pending: remainingPending };
  }

  // Subscribe to sync status changes
  onStatusChange(listener: (status: SyncStatus) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  async getPendingCount(): Promise<number> {
    return offlineQueue.getPendingCount();
  }

  // --- Private ---

  private notify(status: SyncStatus) {
    this.listeners.forEach(l => l(status));
  }

  private chunk<T>(arr: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < arr.length; i += size) {
      chunks.push(arr.slice(i, i + size));
    }
    return chunks;
  }
}

export interface SyncStatus {
  state: 'syncing' | 'synced' | 'pending' | 'offline';
  pending?: number;
}

export interface SyncResult {
  synced: number;
  failed: number;
  pending: number;
}
