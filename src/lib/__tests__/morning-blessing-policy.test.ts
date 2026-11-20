import { describe, expect, it } from 'vitest';
import {
  isMorningBlessingWindow,
  buildMorningBlessingKey,
  buildMorningBlessingMessage,
} from '@/lib/morning-blessing-policy';

describe('Morning Blessing policy and formatting', () => {
  it('is active strictly between 6:30 AM and 11:00 AM local time', () => {
    // 6:00 AM -> false
    expect(isMorningBlessingWindow(new Date('2026-11-20T06:00:00'))).toBe(false);

    // 6:29 AM -> false
    expect(isMorningBlessingWindow(new Date('2026-11-20T06:29:00'))).toBe(false);

    // 6:30 AM -> true
    expect(isMorningBlessingWindow(new Date('2026-11-20T06:30:00'))).toBe(true);

    // 8:00 AM -> true
    expect(isMorningBlessingWindow(new Date('2026-11-20T08:00:00'))).toBe(true);

    // 10:59 AM -> true
    expect(isMorningBlessingWindow(new Date('2026-11-20T10:59:00'))).toBe(true);

    // 11:00 AM -> false
    expect(isMorningBlessingWindow(new Date('2026-11-20T11:00:00'))).toBe(false);

    // 2:00 PM -> false
    expect(isMorningBlessingWindow(new Date('2026-11-20T14:00:00'))).toBe(false);
  });

  it('generates consistent date-scoped dismissal keys', () => {
    const d = new Date('2026-11-20T08:00:00.000Z');
    const key = buildMorningBlessingKey(d, 'Asia/Kolkata');
    expect(key).toBe('shoonaya-morning-blessing-dismissed-Asia/Kolkata-2026-11-20');
  });

  it('builds WhatsApp companion message with clean attribution and UTM params', () => {
    const text = buildMorningBlessingMessage({
      tithiName: 'Shukla Dashami',
      cityName: 'New Delhi',
      verseSnippet: 'Speak the truth, walk the path of righteousness.',
    });

    expect(text).toContain('Today is Shukla Dashami in New Delhi');
    expect(text).toContain('Speak the truth, walk the path of righteousness.');
    expect(text).toContain('utm_source=whatsapp&utm_medium=morning_card&utm_campaign=suprabhat_loop');
  });
});
