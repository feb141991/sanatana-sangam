import { describe, expect, it } from 'vitest';
import { produceSankalpaMidpointCandidate } from './sankalpa-midpoint-candidate';

const base = {
  userId: 'user-1',
  sankalpaId: 'sankalpa-1',
  startDate: '2026-09-01',
  targetDays: 10,
  localDate: '2026-09-06',
  timezone: 'Asia/Kolkata',
  optedIn: true,
  now: new Date('2026-09-06T06:00:00.000Z'),
};

describe('Sankalpa midpoint candidate', () => {
  it('creates a single local-time candidate on the exact midpoint date', () => {
    const result = produceSankalpaMidpointCandidate(base);
    expect(result).not.toBeNull();
    expect(result?.event_type).toBe('sankalpa_midpoint');
    expect(result?.event_id).toBe('sankalpa-1');
    expect(result?.event_instance).toBe('midpoint');
    expect(result?.scheduled_for).toBe('2026-09-06T12:30:00.000Z');
    expect(result?.expires_at).toBe('2026-09-06T18:29:00.000Z');
  });

  it('fails closed for missing opt-in, a wrong date, invalid timezone, or elapsed send slot', () => {
    expect(produceSankalpaMidpointCandidate({ ...base, optedIn: false })).toBeNull();
    expect(produceSankalpaMidpointCandidate({ ...base, localDate: '2026-09-07' })).toBeNull();
    expect(produceSankalpaMidpointCandidate({ ...base, timezone: 'Not/AZone' })).toBeNull();
    expect(produceSankalpaMidpointCandidate({ ...base, now: new Date('2026-09-06T13:00:00Z') })).toBeNull();
  });

  it('does not place vow text or tradition-specific claims in the candidate', () => {
    const result = produceSankalpaMidpointCandidate(base);
    expect(JSON.stringify(result)).not.toContain('text');
    expect(result?.body).toBe('You are halfway through your Sankalpa. Take a moment to reconnect with your intention.');
  });

  it('uses the requested app language for the generic copy', () => {
    expect(produceSankalpaMidpointCandidate({ ...base, language: 'hi' })?.language).toBe('hi');
    expect(produceSankalpaMidpointCandidate({ ...base, language: 'pa' })?.title).toBe('ਸੰਕਲਪ ਦਾ ਅੱਧਾ ਪੜਾਅ');
  });
});
