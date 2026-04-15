// ============================================================
// Event Tracker — logs all sadhana activity
// Works offline-first: writes to Dexie, syncs to Supabase
// ============================================================

import type { SupabaseClient } from '@supabase/supabase-js';
import type { SadhanaEvent, SadhanaEventType, JapaSession } from '../types';
import { offlineQueue } from '../utils/offline-queue';

export class SadhanaTracker {
  private supabase: SupabaseClient;
  private userId: string | null = null;
  private debug: boolean;

  constructor(supabase: SupabaseClient, debug = false) {
    this.supabase = supabase;
    this.debug = debug;
  }

  setUser(userId: string) {
    this.userId = userId;
  }

  // --- Core tracking method ---

  async track(eventType: SadhanaEventType, data: Record<string, unknown> = {}): Promise<void> {
    if (!this.userId) {
      if (this.debug) console.warn('[SadhanaTracker] No user set, skipping event:', eventType);
      return;
    }

    const event: SadhanaEvent = {
      user_id: this.userId,
      event_type: eventType,
      event_data: {
        ...data,
        client_timestamp: new Date().toISOString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      synced: false,
    };

    if (this.debug) console.log('[SadhanaTracker]', eventType, data);

    // Write to offline queue first (always succeeds)
    await offlineQueue.addEvent(event);

    // Try to sync immediately if online
    if (navigator.onLine) {
      await this.syncOne(event);
    }
  }

  // --- Convenience methods for common events ---

  async trackAppOpen(screen = 'home') {
    const now = new Date();
    await this.track('app_open', {
      screen,
      time: now.toTimeString().slice(0, 5), // "05:12"
      day: now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase(),
      hour: now.getHours(),
    });
  }

  async trackJapaSession(session: JapaSession) {
    await this.track('japa_session', {
      mantra_id: session.mantra_id,
      mantra_name: session.mantra_name,
      rounds_completed: session.rounds_completed,
      beads_count: session.beads_count,
      duration_seconds: session.duration_seconds,
      completed: session.completed,
      started_at: session.started_at,
      completed_at: session.completed_at,
    });
  }

  async trackShlokaRead(textId: string, chapter: number, verse: number, timeSpentSeconds: number) {
    await this.track('shloka_read', {
      text_id: textId,
      chapter,
      verse,
      time_spent_s: timeSpentSeconds,
    });
  }

  async trackShlokaBookmark(textId: string, chapter: number, verse: number) {
    await this.track('shloka_bookmark', { text_id: textId, chapter, verse });
  }

  async trackPanchangViewed(tithi: string, vrata?: string) {
    await this.track('panchang_viewed', { tithi, vrata });
  }

  async trackVrataObserved(vrataName: string, fasted: boolean) {
    await this.track('vrata_observed', { vrata: vrataName, fasted });
  }

  async trackTirthaVisited(tirthaName: string, tirthaId?: string) {
    await this.track('tirtha_visited', { name: tirthaName, tirtha_id: tirthaId });
  }

  async trackGreetingShared(greetingText: string) {
    await this.track('greeting_shared', { text: greetingText });
  }

  async trackNotification(action: 'opened' | 'dismissed', notificationType: string) {
    await this.track(action === 'opened' ? 'notification_opened' : 'notification_dismissed', {
      notification_type: notificationType,
    });
  }

  // --- Sync methods ---

  private async syncOne(event: { id?: string | number; user_id: string; event_type: string; event_data: Record<string, unknown> }): Promise<boolean> {
    try {
      const { error } = await this.supabase.from('sadhana_events').insert({
        user_id: event.user_id,
        event_type: event.event_type,
        event_data: event.event_data,
      });

      if (error) {
        if (this.debug) console.warn('[SadhanaTracker] Sync failed, will retry:', error.message);
        return false;
      }

      // Mark as synced in offline queue
      if (event.id) {
        await offlineQueue.markSynced(event.id);
      }
      return true;
    } catch {
      return false;
    }
  }

  async syncAll(): Promise<{ synced: number; failed: number }> {
    const pending = await offlineQueue.getPendingEvents();
    let synced = 0;
    let failed = 0;

    for (const event of pending) {
      const success = await this.syncOne(event);
      if (success) synced++;
      else failed++;
    }

    if (this.debug) console.log(`[SadhanaTracker] Sync complete: ${synced} synced, ${failed} failed`);
    return { synced, failed };
  }

  // --- Query methods (for profile computation) ---

  async getEventsForUser(
    userId: string,
    days = 30,
    eventType?: SadhanaEventType
  ): Promise<SadhanaEvent[]> {
    const since = new Date();
    since.setDate(since.getDate() - days);

    let query = this.supabase
      .from('sadhana_events')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', since.toISOString())
      .order('created_at', { ascending: false });

    if (eventType) {
      query = query.eq('event_type', eventType);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }
}
