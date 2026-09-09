import { describe, expect, it } from 'vitest';
import { escapeCalendarText, foldCalendarLine, renderSubscriptionCalendar } from '../subscription-feed';
import type { ClientObservanceResult } from '../observance-formatter';

function event(overrides: Partial<ClientObservanceResult> = {}): ClientObservanceResult {
  return {
    id: 'test-occurrence', date: '2026-12-31', civilDate: '2026-12-31', slug: 'test',
    display_name: 'Test event', emoji: '', kind: 'major', tradition: 'hindu', route_kind: null,
    route_slug: null, description: 'Test description', festivalId: 'test', status: 'resolved',
    candidateDates: [], reviewPlacementDate: null,
    location: { label: 'Test location', lat: 0, lon: 0, tz: 'UTC' },
    profile: { calendar: 'test-profile', tradition: 'test-tradition' },
    versions: { panchangaCore: 'test', calendarProfile: 'test', ruleEngine: 'test', rule: 'test' },
    reasons: [], alternatives: [], confidence: 'high', diagnostics: [], sourceRefs: [],
    reviewStatus: 'reviewed', isPrimary: true, ...overrides,
  };
}
const now = new Date('2026-09-09T12:00:00Z');

describe('subscription feed serialization', () => {
  it('escapes injection and all RFC text delimiters without creating extra properties', () => {
    const name = 'Test, semi; slash\\\r\nEND:VEVENT\rBEGIN:VEVENT';
    const output = renderSubscriptionCalendar([event({ display_name: name })], now);
    expect(output.split('\r\n').filter(line => line === 'BEGIN:VEVENT')).toHaveLength(1);
    expect(output.split('\r\n').filter(line => line === 'END:VEVENT')).toHaveLength(1);
    expect(escapeCalendarText(name)).toBe('Test\\, semi\\; slash\\\\\\nEND:VEVENT\\nBEGIN:VEVENT');
  });
  it('folds multibyte text at 75 octets, preserving every code point on unfolding', () => {
    const original = `SUMMARY:${'श्री कृष्ण 🪷 '.repeat(25)}`;
    const folded = foldCalendarLine(original);
    for (const line of folded.split('\r\n')) expect(Buffer.byteLength(line, 'utf8')).toBeLessThanOrEqual(75);
    expect(folded.replace(/\r\n /g, '')).toBe(original);
    expect(folded).not.toContain('\uFFFD');
  });
  it('uses exclusive next-day end across the year boundary', () => {
    const output = renderSubscriptionCalendar([event()], now);
    expect(output).toContain('DTSTART;VALUE=DATE:20261231\r\nDTEND;VALUE=DATE:20270101');
    expect(output).not.toContain('RRULE');
    expect(output).not.toContain('VALARM');
  });
  it('keeps event identity stable when a canonical date is corrected', () => {
    const first = renderSubscriptionCalendar([event()], now);
    const corrected = renderSubscriptionCalendar([event({ civilDate: '2027-01-01' })], now);
    const uid = (value: string) => value.split('\r\n').find(line => line.startsWith('UID:'));
    expect(uid(first)).toBe(uid(corrected));
    expect(corrected).toContain('DTSTART;VALUE=DATE:20270101');
  });
  it('retains multiple occurrences of a recurring observance', () => {
    const output = renderSubscriptionCalendar([event({ id: 'first' }), event({ id: 'second', civilDate: '2027-01-15' })], now);
    expect(output.match(/BEGIN:VEVENT/g)).toHaveLength(2);
    expect(output).toContain('UID:festival-first@shoonaya.app');
    expect(output).toContain('UID:festival-second@shoonaya.app');
  });
  it('returns a valid empty calendar and skips date-less inputs', () => {
    const output = renderSubscriptionCalendar([event({ civilDate: null })], now);
    expect(output).not.toContain('BEGIN:VEVENT');
    expect(output).toMatch(/^BEGIN:VCALENDAR\r\n/);
    expect(output).toMatch(/END:VCALENDAR\r\n$/);
  });
});
