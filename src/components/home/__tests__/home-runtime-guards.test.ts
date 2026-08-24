import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  buildBrahmaDismissKey,
  getBrowserNotificationApi,
  isMilestoneAlreadyDismissed,
} from '@/components/home/home-runtime-guards';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('Home browser runtime guards', () => {
  it('does not evaluate an undeclared Notification global', () => {
    vi.stubGlobal('window', {});

    expect(() => getBrowserNotificationApi()).not.toThrow();
    expect(getBrowserNotificationApi()).toBeNull();
  });

  it('returns the window-scoped Notification API when supported', () => {
    const notificationApi = class FakeNotification {};
    vi.stubGlobal('window', { Notification: notificationApi });

    expect(getBrowserNotificationApi()).toBe(notificationApi);
  });

  it('builds dismissal keys from the user timezone and spiritual day', () => {
    const instant = new Date('2026-08-24T01:30:00.000Z');

    expect(buildBrahmaDismissKey('Europe/London', instant))
      .toBe('shoonaya-brahma-dismissed-2026-08-23');
    expect(buildBrahmaDismissKey('Asia/Kolkata', instant))
      .toBe('shoonaya-brahma-dismissed-2026-08-24');
  });

  it('reads milestone dismissal state without requiring browser storage', () => {
    expect(isMilestoneAlreadyDismissed(21, null)).toBe(false);
    expect(isMilestoneAlreadyDismissed(21, { getItem: () => null })).toBe(false);
    expect(isMilestoneAlreadyDismissed(21, { getItem: () => '1' })).toBe(true);
  });

  it('fails closed when storage access is blocked', () => {
    expect(isMilestoneAlreadyDismissed(40, {
      getItem: () => { throw new Error('storage blocked'); },
    })).toBe(false);
  });
});
