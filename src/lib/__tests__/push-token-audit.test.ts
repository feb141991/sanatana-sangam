import { describe, it, expect, vi, beforeEach } from 'vitest';
import { hashPushToken, recordPushTokenEvent, recordPushTokenEventBatch } from '../push-token-audit';
import { recordNotificationDispatchBatch } from '../notification-dispatch-audit';
import { createHash } from 'node:crypto';

vi.mock('@/lib/admin', () => ({
  createServiceRoleSupabaseClient: vi.fn(),
}));

import { createServiceRoleSupabaseClient } from '@/lib/admin';

describe('push-token-audit', () => {
  let mockInsert: ReturnType<typeof vi.fn>;
  let mockFrom: ReturnType<typeof vi.fn>;
  let mockSupabase: { from: typeof mockFrom };

  beforeEach(() => {
    vi.clearAllMocks();
    mockInsert = vi.fn().mockResolvedValue({ error: null });
    mockFrom = vi.fn().mockReturnValue({ insert: mockInsert });
    mockSupabase = { from: mockFrom };
    vi.mocked(createServiceRoleSupabaseClient).mockReturnValue(mockSupabase as any);
  });

  describe('hashPushToken', () => {
    it('returns deterministic SHA-256 hash', () => {
      const token = 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]';
      const expected = createHash('sha256').update(token.trim()).digest('hex');
      expect(hashPushToken(token)).toBe(expected);
      expect(hashPushToken(token)).toHaveLength(64);
    });

    it('handles whitespace trimming', () => {
      const token = '  ExponentPushToken[abc]  ';
      const expected = createHash('sha256').update('ExponentPushToken[abc]').digest('hex');
      expect(hashPushToken(token)).toBe(expected);
    });

    it('returns empty string for empty token', () => {
      expect(hashPushToken('')).toBe('');
    });
  });

  describe('recordPushTokenEvent', () => {
    it('inserts single row into push_token_events table', async () => {
      await recordPushTokenEvent({
        userId: '11111111-1111-1111-1111-111111111111',
        token: 'ExponentPushToken[test-123]',
        eventType: 'registered',
        reason: 'platform:ios',
        source: '/api/notifications/register-token',
      });

      expect(mockFrom).toHaveBeenCalledWith('push_token_events');
      expect(mockInsert).toHaveBeenCalledWith({
        user_id: '11111111-1111-1111-1111-111111111111',
        token: hashPushToken('ExponentPushToken[test-123]'),
        event_type: 'registered',
        reason: 'platform:ios',
        source: '/api/notifications/register-token',
      });
    });

    it('does not throw on database insert error (fail-open)', async () => {
      mockInsert.mockResolvedValueOnce({ error: { message: 'db error' } });
      await expect(
        recordPushTokenEvent({
          userId: '11111111-1111-1111-1111-111111111111',
          token: 'ExponentPushToken[test-123]',
          eventType: 'pruned_device_not_registered',
          reason: 'DeviceNotRegistered receipt from Expo',
          source: 'push-receipts',
        })
      ).resolves.not.toThrow();
    });
  });

  describe('recordPushTokenEventBatch', () => {
    it('inserts batch of rows into push_token_events table', async () => {
      await recordPushTokenEventBatch([
        {
          userId: 'user-1',
          token: 'token-1',
          eventType: 'pruned_device_not_registered',
          reason: 'DeviceNotRegistered',
          source: 'push-receipts',
        },
        {
          userId: 'user-2',
          token: 'token-2',
          eventType: 'pruned_device_not_registered',
          reason: 'DeviceNotRegistered',
          source: 'push-receipts',
        },
      ]);

      expect(mockFrom).toHaveBeenCalledWith('push_token_events');
      expect(mockInsert).toHaveBeenCalledWith([
        {
          user_id: 'user-1',
          token: hashPushToken('token-1'),
          event_type: 'pruned_device_not_registered',
          reason: 'DeviceNotRegistered',
          source: 'push-receipts',
        },
        {
          user_id: 'user-2',
          token: hashPushToken('token-2'),
          event_type: 'pruned_device_not_registered',
          reason: 'DeviceNotRegistered',
          source: 'push-receipts',
        },
      ]);
    });

    it('handles empty batch gracefully without calling DB', async () => {
      await recordPushTokenEventBatch([]);
      expect(mockFrom).not.toHaveBeenCalled();
    });
  });
});

describe('notification-dispatch-audit', () => {
  let mockInsert: ReturnType<typeof vi.fn>;
  let mockFrom: ReturnType<typeof vi.fn>;
  let mockSupabase: { from: typeof mockFrom };

  beforeEach(() => {
    vi.clearAllMocks();
    mockInsert = vi.fn().mockResolvedValue({ error: null });
    mockFrom = vi.fn().mockReturnValue({ insert: mockInsert });
    mockSupabase = { from: mockFrom };
    vi.mocked(createServiceRoleSupabaseClient).mockReturnValue(mockSupabase as any);
  });

  it('records batch of dispatch events into notification_dispatch_events table', async () => {
    await recordNotificationDispatchBatch([
      {
        userId: 'user-1',
        notificationKey: 'ekadashi-2026-08-25',
        notificationType: 'festival',
        decision: 'sent',
        reason: null,
        provider: 'expo',
      },
      {
        userId: 'user-2',
        notificationKey: 'nitya-2026-08-25',
        notificationType: 'nitya',
        decision: 'skipped',
        reason: 'quiet_hours_active',
        provider: 'expo',
      },
      {
        userId: 'user-3',
        notificationKey: 'sadhana-2026-08-25',
        notificationType: 'sattvic_reminder',
        decision: 'failed',
        reason: 'Push dispatch failed',
        provider: 'expo',
      },
    ]);

    expect(mockFrom).toHaveBeenCalledWith('notification_dispatch_events');
    expect(mockInsert).toHaveBeenCalledWith([
      {
        user_id: 'user-1',
        notification_key: 'ekadashi-2026-08-25',
        notification_type: 'festival',
        decision: 'sent',
        reason: null,
        provider: 'expo',
      },
      {
        user_id: 'user-2',
        notification_key: 'nitya-2026-08-25',
        notification_type: 'nitya',
        decision: 'skipped',
        reason: 'quiet_hours_active',
        provider: 'expo',
      },
      {
        user_id: 'user-3',
        notification_key: 'sadhana-2026-08-25',
        notification_type: 'sattvic_reminder',
        decision: 'failed',
        reason: 'Push dispatch failed',
        provider: 'expo',
      },
    ]);
  });

  it('uses passed-in client if provided', async () => {
    const customInsert = vi.fn().mockResolvedValue({ error: null });
    const customFrom = vi.fn().mockReturnValue({ insert: customInsert });
    const customClient = { from: customFrom };

    await recordNotificationDispatchBatch(
      [
        {
          userId: 'user-1',
          notificationKey: 'key-1',
          notificationType: 'general',
          decision: 'skipped',
          reason: 'account_deletion_pending',
          provider: 'expo',
        },
      ],
      customClient as any
    );

    expect(customFrom).toHaveBeenCalledWith('notification_dispatch_events');
    expect(customInsert).toHaveBeenCalledWith([
      {
        user_id: 'user-1',
        notification_key: 'key-1',
        notification_type: 'general',
        decision: 'skipped',
        reason: 'account_deletion_pending',
        provider: 'expo',
      },
    ]);
  });

  it('is fail-open on DB exception', async () => {
    mockInsert.mockRejectedValueOnce(new Error('Network error'));
    await expect(
      recordNotificationDispatchBatch([
        {
          userId: 'user-1',
          notificationKey: 'key-1',
          decision: 'sent',
        },
      ])
    ).resolves.not.toThrow();
  });
});
