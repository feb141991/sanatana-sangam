import { describe, expect, it, vi } from 'vitest';
import { enqueueNotificationSchedule, type NotificationScheduleDraft } from './notification-schedule-queue';

function draft(userId: string, localDate: string, sendAt: string, key: string): NotificationScheduleDraft {
  return {
    user_id: userId,
    notification_type: 'weekly_summary',
    title: key,
    body: key,
    send_at: sendAt,
    notification_key: key,
    metadata: { local_date: localDate, timezone: 'UTC' },
  };
}

describe('enqueueNotificationSchedule', () => {
  it('sorts lock acquisition deterministically and batches at 100 rows', async () => {
    const submitted: NotificationScheduleDraft[][] = [];
    const query = {
      upsert: vi.fn((rows: NotificationScheduleDraft[]) => {
        submitted.push(rows);
        return query;
      }),
      select: vi.fn(async () => ({
        data: submitted.at(-1)?.map((_, index) => ({ id: `inserted-${index}` })) ?? [],
        error: null,
      })),
    };
    const supabase = { from: vi.fn(() => query) } as any;
    const drafts = Array.from({ length: 101 }, (_, index) =>
      draft(`user-${String(100 - index).padStart(3, '0')}`, '2026-10-12', '2026-10-12T12:00:00.000Z', `key-${index}`),
    );

    const result = await enqueueNotificationSchedule(supabase, drafts);

    expect(submitted).toHaveLength(2);
    expect(submitted[0]).toHaveLength(100);
    expect(submitted[1]).toHaveLength(1);
    expect(submitted[0][0].user_id).toBe('user-000');
    expect(result).toEqual({ queued: 101, ignored: 0 });
  });

  it('surfaces queue failures so producers cannot report a successful delivery', async () => {
    const query = {
      upsert: vi.fn(() => query),
      select: vi.fn(async () => ({ data: null, error: { message: 'cadence database unavailable' } })),
    };
    const supabase = { from: vi.fn(() => query) } as any;

    await expect(
      enqueueNotificationSchedule(supabase, [draft('user-1', '2026-10-12', '2026-10-12T12:00:00.000Z', 'key-1')]),
    ).rejects.toThrow('Notification schedule admission failed: cadence database unavailable');
  });

  it('puts multiple reminders for one user and local date in separate trigger-visible statements', async () => {
    const submitted: NotificationScheduleDraft[][] = [];
    const query = {
      upsert: vi.fn((rows: NotificationScheduleDraft[]) => {
        submitted.push(rows);
        return query;
      }),
      select: vi.fn(async () => ({
        data: submitted.at(-1)?.map((_, index) => ({ id: `inserted-${index}` })) ?? [],
        error: null,
      })),
    };
    const supabase = { from: vi.fn(() => query) } as any;

    const result = await enqueueNotificationSchedule(supabase, [
      draft('same-user', '2026-10-12', '2026-10-12T12:00:00.000Z', 'one'),
      draft('same-user', '2026-10-12', '2026-10-12T15:00:00.000Z', 'two'),
      draft('same-user', '2026-10-13', '2026-10-13T08:00:00.000Z', 'next-day'),
    ]);

    expect(submitted.map((batch) => batch.map((row) => row.notification_key))).toEqual([
      ['one', 'next-day'],
      ['two'],
    ]);
    expect(result).toEqual({ queued: 3, ignored: 0 });
  });
});
