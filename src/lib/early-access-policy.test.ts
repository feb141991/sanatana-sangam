import { describe, expect, it } from 'vitest';
import {
  boundedText,
  csvCell,
  isValidIanaTimezone,
  normalizeWaitlistEmail,
  parseEarlyAccessFilters,
} from './early-access-policy';

describe('early access input policy', () => {
  it('normalizes valid email addresses and rejects malformed or overlong input', () => {
    expect(normalizeWaitlistEmail('  Prince@Example.COM ')).toBe('prince@example.com');
    expect(normalizeWaitlistEmail('no-at-sign')).toBeNull();
    expect(normalizeWaitlistEmail('a@b.c')).toBeNull();
    expect(normalizeWaitlistEmail(`${'a'.repeat(250)}@example.com`)).toBeNull();
    expect(normalizeWaitlistEmail(null)).toBeNull();
  });

  it('bounds optional text instead of persisting arbitrary request content', () => {
    expect(boundedText('  Prince  ', 32)).toBe('Prince');
    expect(boundedText('x'.repeat(33), 32)).toBeNull();
    expect(boundedText('   ', 32)).toBeNull();
  });

  it('accepts real IANA zones and rejects invalid zones', () => {
    expect(isValidIanaTimezone('Asia/Kolkata')).toBe(true);
    expect(isValidIanaTimezone('not/a-zone')).toBe(false);
    expect(isValidIanaTimezone(null)).toBe(false);
  });

  it('quotes CSV values and neutralizes spreadsheet formulas after leading whitespace', () => {
    expect(csvCell('plain, value')).toBe('"plain, value"');
    expect(csvCell('say "hi"')).toBe('"say ""hi"""');
    expect(csvCell('  =HYPERLINK("https://example.com")')).toBe('"\'  =HYPERLINK(""https://example.com"")"');
    expect(csvCell('-1')).toBe('"\'-1"');
  });

  it('preserves the admin Universal filter and normalizes unsupported filters safely', () => {
    expect(parseEarlyAccessFilters(new URLSearchParams('tradition=universal&device=web&sort=oldest'))).toEqual({
      query: '',
      tradition: 'universal',
      platform: 'web',
      sort: 'oldest',
    });
    expect(parseEarlyAccessFilters(new URLSearchParams('tradition=unknown&device=unknown&sort=unknown'))).toEqual({
      query: '',
      tradition: 'all',
      platform: 'all',
      sort: 'newest',
    });
  });
});
