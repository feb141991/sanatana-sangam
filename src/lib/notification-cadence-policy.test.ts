import { describe, expect, it } from 'vitest';
import {
  canonicalNotificationBudgetType,
  findNextCadenceSlot,
  NOTIFICATION_CADENCE_POLICY,
} from './notification-cadence-policy';

const noBlockedInstants: Date[] = [];

describe('notification cadence policy', () => {
  it('canonicalizes legacy aliases into the same per-type allowance', () => {
    expect(canonicalNotificationBudgetType('mood_checkin')).toBe('mood');
    expect(canonicalNotificationBudgetType('mood')).toBe('mood');
    expect(canonicalNotificationBudgetType('general', 'mood-evening:2026-11-08')).toBe('mood');
    expect(canonicalNotificationBudgetType('sattvic_reminder')).toBe('sattvic');
    expect(canonicalNotificationBudgetType('sattvic')).toBe('sattvic');
    expect(canonicalNotificationBudgetType('streak_nudge')).toBe('shloka');
    expect(canonicalNotificationBudgetType('streak')).toBe('shloka');
  });

  it('keeps a requested local time when no cadence conflict exists', () => {
    const slot = findNextCadenceSlot({
      scheduledFor: '2026-11-08T06:30:00.000Z', // 12:00 in Kolkata
      expiresAt: '2026-11-08T18:00:00.000Z',
      localDate: '2026-11-08',
      timezone: 'Asia/Kolkata',
      now: new Date('2026-11-08T02:00:00.000Z'),
      blockedInstants: noBlockedInstants,
    });

    expect(slot?.scheduledFor.toISOString()).toBe('2026-11-08T06:30:00.000Z');
    expect(slot?.delayMinutes).toBe(0);
  });

  it('moves flexible pushes to at least three hours after an earlier delivery', () => {
    const slot = findNextCadenceSlot({
      scheduledFor: '2026-11-08T13:30:00.000Z', // 19:00 in Kolkata
      expiresAt: '2026-11-08T18:00:00.000Z',
      localDate: '2026-11-08',
      timezone: 'Asia/Kolkata',
      now: new Date('2026-11-08T02:00:00.000Z'),
      blockedInstants: [new Date('2026-11-08T11:30:00.000Z')], // 17:00 local
    });

    expect(slot?.scheduledFor.toISOString()).toBe('2026-11-08T14:30:00.000Z'); // 20:00 local
    expect(slot?.delayMinutes).toBe(60);
  });

  it('waits until quiet hours end without leaving the local day', () => {
    const slot = findNextCadenceSlot({
      scheduledFor: '2026-11-08T02:30:00.000Z', // 08:00 in Kolkata
      expiresAt: '2026-11-08T18:00:00.000Z',
      localDate: '2026-11-08',
      timezone: 'Asia/Kolkata',
      now: new Date('2026-11-08T01:00:00.000Z'),
      quietHours: { startHour: 8, endHour: 10 },
      blockedInstants: noBlockedInstants,
    });

    expect(slot?.scheduledFor.toISOString()).toBe('2026-11-08T04:30:00.000Z'); // 10:00 local
  });

  it('does not shift before the daytime window or beyond its end', () => {
    const early = findNextCadenceSlot({
      scheduledFor: '2026-11-08T00:30:00.000Z', // 06:00 in Kolkata
      expiresAt: '2026-11-08T18:00:00.000Z',
      localDate: '2026-11-08',
      timezone: 'Asia/Kolkata',
      now: new Date('2026-11-08T00:00:00.000Z'),
      blockedInstants: noBlockedInstants,
    });
    const late = findNextCadenceSlot({
      scheduledFor: '2026-11-08T15:30:00.000Z', // 21:00 in Kolkata
      expiresAt: '2026-11-08T18:00:00.000Z',
      localDate: '2026-11-08',
      timezone: 'Asia/Kolkata',
      now: new Date('2026-11-08T00:00:00.000Z'),
      blockedInstants: noBlockedInstants,
    });

    expect(early?.scheduledFor.toISOString()).toBe('2026-11-08T01:30:00.000Z'); // 07:00 local
    expect(late).toBeNull();
  });

  it('never shifts a flexible reminder onto the following local date', () => {
    const slot = findNextCadenceSlot({
      scheduledFor: '2026-11-08T13:30:00.000Z',
      expiresAt: '2026-11-09T02:00:00.000Z',
      localDate: '2026-11-08',
      timezone: 'Asia/Kolkata',
      now: new Date('2026-11-08T02:00:00.000Z'),
      blockedInstants: [new Date('2026-11-08T12:00:00.000Z')],
      minSpacingMinutes: 600,
    });

    expect(slot).toBeNull();
  });

  it('keeps the local civil date across daylight-saving transitions', () => {
    const slot = findNextCadenceSlot({
      scheduledFor: '2026-10-25T00:30:00.000Z',
      expiresAt: '2026-10-25T21:00:00.000Z',
      localDate: '2026-10-25',
      timezone: 'Europe/London',
      now: new Date('2026-10-25T00:00:00.000Z'),
      blockedInstants: [new Date('2026-10-25T00:30:00.000Z')],
    });

    expect(slot?.scheduledFor.toISOString()).toBe('2026-10-25T07:00:00.000Z');
    expect(NOTIFICATION_CADENCE_POLICY.maxBudgetedPerLocalDate).toBe(5);
  });
});
