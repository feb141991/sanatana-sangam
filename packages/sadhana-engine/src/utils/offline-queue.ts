// ============================================================
// Offline Queue — Dexie.js IndexedDB wrapper
// Stores sadhana events locally, syncs to Supabase when online
// ============================================================

import Dexie, { type Table } from 'dexie';
import type { SadhanaEvent, SadhanaEventType } from '../types';

// OfflineEvent uses a numeric Dexie auto-increment id instead of string
interface OfflineEvent {
  id?: number;              // Dexie auto-increment primary key
  user_id: string;
  event_type: SadhanaEventType;
  event_data: Record<string, unknown>;
  created_at?: string;
  synced: boolean;
  retry_count: number;
}

class SangamOfflineDB extends Dexie {
  events!: Table<OfflineEvent>;

  constructor() {
    super('sangam-sadhana');
    this.version(1).stores({
      events: '++id, user_id, event_type, synced, created_at',
    });
  }
}

class OfflineQueue {
  private db: SangamOfflineDB;

  constructor() {
    this.db = new SangamOfflineDB();
  }

  async addEvent(event: SadhanaEvent): Promise<void> {
    // Omit the string `id` from SadhanaEvent — Dexie manages its own numeric id
    const { id: _discard, ...rest } = event;
    await this.db.events.add({
      ...rest,
      created_at: rest.created_at || new Date().toISOString(),
      synced: false,
      retry_count: 0,
    });
  }

  async getPendingEvents(): Promise<OfflineEvent[]> {
    return this.db.events
      .where('synced')
      .equals(0) // Dexie stores booleans as 0/1
      .and((e) => e.retry_count < 5) // give up after 5 retries
      .toArray();
  }

  async markSynced(id: number | string): Promise<void> {
    await this.db.events.update(Number(id), { synced: true });
  }

  async incrementRetry(id: number | string): Promise<void> {
    const event = await this.db.events.get(Number(id));
    if (event) {
      await this.db.events.update(Number(id), { retry_count: event.retry_count + 1 });
    }
  }

  async getPendingCount(): Promise<number> {
    return this.db.events.where('synced').equals(0).count();
  }

  async clearSynced(): Promise<void> {
    // Clean up events that have been synced and are older than 7 days
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 7);

    await this.db.events
      .where('synced')
      .equals(1)
      .and((e) => new Date(e.created_at || '') < cutoff)
      .delete();
  }

  async getLocalEvents(userId: string, days = 7): Promise<OfflineEvent[]> {
    const since = new Date();
    since.setDate(since.getDate() - days);

    return this.db.events
      .where('user_id')
      .equals(userId)
      .and((e) => new Date(e.created_at || '') >= since)
      .reverse()
      .sortBy('created_at');
  }
}

// Singleton — one queue for the whole app
export const offlineQueue = new OfflineQueue();
