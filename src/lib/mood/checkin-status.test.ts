import { describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';

import {
  getMoodCheckinDayWindow,
  readMoodCheckinStatus,
  resolveMoodTimeZone,
  summarizeMoodCheckins,
  type MoodCheckinRow,
} from './checkin-status';

describe('mood check-in spiritual-day status', () => {
  it('uses the 4 a.m. boundary in the supplied timezone', () => {
    const beforeBoundary = getMoodCheckinDayWindow('Asia/Kolkata', new Date('2026-10-01T22:20:00.000Z'));
    const afterBoundary = getMoodCheckinDayWindow('Asia/Kolkata', new Date('2026-10-01T22:40:00.000Z'));

    expect(beforeBoundary?.spiritualDate).toBe('2026-10-01');
    expect(beforeBoundary?.start.toISOString()).toBe('2026-09-30T22:30:00.000Z');
    expect(beforeBoundary?.end.toISOString()).toBe('2026-10-01T22:30:00.000Z');
    expect(afterBoundary?.spiritualDate).toBe('2026-10-02');
  });

  it('uses real local-day lengths across DST transitions', () => {
    const spring = getMoodCheckinDayWindow('Europe/London', new Date('2026-03-29T02:30:00.000Z'));
    const autumn = getMoodCheckinDayWindow('Europe/London', new Date('2026-10-25T03:30:00.000Z'));

    expect(spring?.end.getTime()! - spring?.start.getTime()!).toBe(23 * 60 * 60 * 1000);
    expect(autumn?.end.getTime()! - autumn?.start.getTime()!).toBe(25 * 60 * 60 * 1000);
  });

  it('fails safely to UTC for an invalid timezone', () => {
    expect(resolveMoodTimeZone('Mars/Olympus')).toBe('UTC');
    expect(getMoodCheckinDayWindow('Mars/Olympus', new Date('2026-10-02T12:00:00.000Z'))?.spiritualDate).toBe('2026-10-02');
  });

  it('derives completed, dismissed, open, and logged state from one ordered day slice', () => {
    const rows: MoodCheckinRow[] = [
      { id: 'newest', before_mood: 'grateful', clicked_action: null, session_status: 'dismissed', dismissed: true, created_at: '2026-10-02T10:00:00.000Z' },
      { id: 'older', before_mood: 'anxious', clicked_action: 'japa', session_status: 'completed', dismissed: false, created_at: '2026-10-02T08:00:00.000Z' },
    ];
    const status = summarizeMoodCheckins(rows, '2026-10-02');

    expect(status.hasLoggedMoodToday).toBe(true);
    expect(status.lastMood).toBe('grateful');
    expect(status.hasCompletedToday).toBe(true);
    expect(status.lastCompletedMood).toBe('anxious');
    expect(status.hasDismissedToday).toBe(true);
    expect(status.openSession).toBeNull();
  });

  it('returns no status on a failed database read, rather than a false “not logged” status', async () => {
    const query = {
      select: vi.fn(() => query),
      eq: vi.fn(() => query),
      gte: vi.fn(() => query),
      lt: vi.fn(() => query),
      order: vi.fn(async () => ({ data: null, error: new Error('database unavailable') })),
    };
    const supabase = { from: vi.fn(() => query) } as unknown as SupabaseClient;

    const result = await readMoodCheckinStatus(supabase, 'user-1', 'Asia/Kolkata', new Date('2026-10-02T12:00:00.000Z'));

    expect(result.status).toBeNull();
    expect(result.error).toBeInstanceOf(Error);
  });
});
