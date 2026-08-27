import { describe, expect, it } from 'vitest';

import { buildObservanceHref, getPulseRouteSlug } from './observance-route';

describe('observance route helpers', () => {
  it('routes vrat and festival entries to their canonical detail pages', () => {
    expect(buildObservanceHref('vrat', 'purnima')).toBe('/vrat/purnima');
    expect(buildObservanceHref('festival', 'diwali')).toBe('/festival/diwali');
  });

  it('fails safely to a list or Panchang instead of creating a dead detail route', () => {
    expect(buildObservanceHref('vrat', null)).toBe('/vrat');
    expect(buildObservanceHref('vrat', 'vrat')).toBe('/vrat');
    expect(buildObservanceHref('festival', null)).toBe('/panchang');
    expect(buildObservanceHref('regional', 'example')).toBe('/panchang');
  });

  it('maps supported multi-tradition pulses and leaves unknown pulses unresolved', () => {
    expect(getPulseRouteSlug('Masik Shivaratri')).toBe('shivaratri');
    expect(getPulseRouteSlug('Purnima')).toBe('purnima');
    expect(getPulseRouteSlug('Sangrand (Chet)')).toBe('puranmashi');
    expect(getPulseRouteSlug('Puranmashi')).toBe('puranmashi');
    expect(getPulseRouteSlug('Uposatha')).toBe('uposatha');
    expect(getPulseRouteSlug('Ashtami/Chaturdashi')).toBeNull();
  });
});
