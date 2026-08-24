import { localSpiritualDate } from '@/lib/sacred-time';

type StorageReader = Pick<Storage, 'getItem'>;

const BRAHMA_DISMISS_KEY_PREFIX = 'shoonaya-brahma-dismissed-';

export function getBrowserNotificationApi(): typeof Notification | null {
  if (typeof window === 'undefined' || !('Notification' in window)) return null;
  return window.Notification ?? null;
}

export function buildBrahmaDismissKey(timezone: string, date: Date = new Date()): string {
  return BRAHMA_DISMISS_KEY_PREFIX + localSpiritualDate(timezone, 4, date);
}

export function isMilestoneAlreadyDismissed(
  milestone: number,
  storage?: StorageReader | null,
): boolean {
  let resolvedStorage = storage;

  if (resolvedStorage === undefined) {
    if (typeof window === 'undefined') return false;
    try {
      resolvedStorage = window.localStorage;
    } catch {
      return false;
    }
  }

  try {
    return Boolean(resolvedStorage?.getItem(`shoonaya-milestone-shared-${milestone}`));
  } catch {
    return false;
  }
}
