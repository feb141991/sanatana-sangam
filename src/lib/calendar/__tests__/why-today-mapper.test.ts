/**
 * why-today-mapper.test.ts
 *
 * Unit test suite for mapWhyTodayExplanation data mapper.
 * Verifies:
 * 1. Single resolved observance mapping (title, formatted date, profile, location, reasons, windows, sources).
 * 2. Diagnostics disclosures mapping (latitude_proxy, compressed_night, vrddhi_tithi, extended_moonrise).
 * 3. Under-review / disputed state mapping with candidate alternatives.
 * 4. Unspecified tradition default tag mapping.
 * 5. Clean, human-dignified explanations without exposed internal debug text.
 */

import { describe, it, expect } from 'vitest';
import { mapWhyTodayExplanation } from '../why-today-mapper';
import { resolveCalendarContext } from '../calendar-context';
import type { ClientObservanceResult } from '../observance-formatter';

describe('Phase 5 "Why today?" Data Mapper (mapWhyTodayExplanation)', () => {
  const sampleResolvedResult: ClientObservanceResult = {
    date: '2026-04-26',
    slug: 'ram-navami',
    display_name: 'Ram Navami',
    emoji: '🏹',
    kind: 'major',
    tradition: 'hindu',
    route_kind: 'major',
    route_slug: 'ram-navami',
    description: 'Birth celebration of Lord Rama',
    festivalId: 'ram-navami',
    status: 'resolved',
    civilDate: '2026-04-26',
    vedicDay: { start: '06:05 AM', end: '06:08 AM (+1 day)' },
    windows: {
      observance: { start: '06:05 AM', end: '07:30 PM' },
      puja: { name: 'Madhyahna Puja', start: '11:00 AM', end: '01:30 PM' },
      paran: null,
    },
    location: {
      label: 'Ujjain, India',
      lat: 23.1765,
      lon: 75.7885,
      tz: 'Asia/Kolkata',
    },
    profile: {
      calendar: 'north_indian_purnimanta',
      tradition: 'smarta',
    },
    versions: {
      panchangaCore: '1.0.0',
      calendarProfile: '1.0.0',
      ruleEngine: '1.0.0',
      rule: '1.0.0',
    },
    reasons: [
      { code: 'tithi_sunrise_match', text: 'Navami tithi active at local sunrise' },
      { code: 'madhyahna_window_match', text: 'Madhyahna period intersects Navami tithi' },
    ],
    alternatives: [],
    confidence: 'high',
    diagnostics: [],
    sourceRefs: [
      { title: 'Rashtriya Panchang Saka 1948', tier: 1, citation: 'Page 42' } as any,
    ],
    reviewStatus: 'reviewed',
    isPrimary: true,
  };

  it('1. Maps a resolved observance with title, date, profile, location, reasons, windows, and sources', () => {
    const exp = mapWhyTodayExplanation(sampleResolvedResult);

    expect(exp.title).toBe('Ram Navami');
    expect(exp.civilDate).toBe('2026-04-26');
    expect(exp.formattedDate).toContain('April 26, 2026');
    expect(exp.profileLabel).toContain('North Indian (Purnimanta)');
    expect(exp.profileLabel).toContain('Smarta');
    expect(exp.locationLabel).toContain('Ujjain, India');
    expect(exp.locationLabel).toContain('23.1765° N');

    // Reasons
    expect(exp.reasons).toHaveLength(2);
    expect(exp.reasons[0].label).toBe('Sunrise Tithi Match');
    expect(exp.reasons[0].description).toBe('Navami tithi active at local sunrise');

    // Ritual Windows
    expect(exp.ritualWindows.length).toBeGreaterThan(0);
    const pujaWin = exp.ritualWindows.find(w => w.type === 'puja');
    expect(pujaWin).toBeDefined();
    expect(pujaWin!.label).toBe('Madhyahna Puja');
    expect(pujaWin!.timeRange).toBe('11:00 AM – 01:30 PM');

    // Sources
    expect(exp.sources).toHaveLength(1);
    expect(exp.sources[0].title).toBe('Rashtriya Panchang Saka 1948');
    expect(exp.sources[0].tier).toContain('Tier 1');
  });

  it('2. Maps diagnostics disclosures (latitude_proxy, compressed_night, vrddhi_tithi, extended_moonrise)', () => {
    const resultWithDisclosures: ClientObservanceResult = {
      ...sampleResolvedResult,
      diagnostics: [
        'latitude_proxy',
        'compressed_night',
        'vrddhi_tithi',
        'extended_moonrise',
      ],
    };

    const exp = mapWhyTodayExplanation(resultWithDisclosures);

    expect(exp.disclosures).toHaveLength(4);

    const latProxy = exp.disclosures.find(d => d.code === 'latitude_proxy');
    expect(latProxy).toBeDefined();
    expect(latProxy!.label).toBe('High-Latitude Proxy Applied');
    expect(latProxy!.severity).toBe('warning');

    const compNight = exp.disclosures.find(d => d.code === 'compressed_night');
    expect(compNight).toBeDefined();
    expect(compNight!.label).toBe('Compressed Night Adjustments');
    expect(compNight!.severity).toBe('info');

    const vrddhi = exp.disclosures.find(d => d.code === 'vrddhi_tithi');
    expect(vrddhi).toBeDefined();
    expect(vrddhi!.label).toBe('Vrddhi Tithi (Double Sunrise)');

    const moonrise = exp.disclosures.find(d => d.code === 'extended_moonrise');
    expect(moonrise).toBeDefined();
    expect(moonrise!.label).toBe('Extended Moonrise Window');
  });

  it('3. Maps under-review / disputed state with candidate alternatives', () => {
    const disputedResult: ClientObservanceResult = {
      ...sampleResolvedResult,
      status: 'under_review',
      reviewStatus: 'pending_review',
      civilDate: null,
      date: '',
      reasons: [
        { code: 'disputed_year', text: 'Smarta 2026-07-10 vs Vaishnava 2026-07-11 dispute' },
      ],
      alternatives: [
        {
          profile: { calendar: 'north_indian_purnimanta', tradition: 'vaishnava_vidhava' },
          civilDate: '2026-07-11',
          monthLabel: null,
          note: 'Vaishnava Vidhava reading',
        },
      ],
    };

    const exp = mapWhyTodayExplanation(disputedResult);

    expect(exp.reviewState.isUnderReview).toBe(true);
    expect(exp.reviewState.statusLabel).toBe('Under Governance Review');
    expect(exp.civilDate).toBeNull();
    expect(exp.formattedDate).toBe('Date Under Review');

    expect(exp.alternatives).toHaveLength(1);
    expect(exp.alternatives[0].civilDate).toBe('2026-07-11');
    expect(exp.alternatives[0].traditionLabel).toContain('Vaishnava');
    expect(exp.alternatives[0].note).toBe('Vaishnava Vidhava reading');
  });

  it('4. Maps unspecified tradition default disclosure tag when context specifies it', () => {
    const context = resolveCalendarContext({
      calendarProfile: 'north_indian_purnimanta',
      traditionProfile: 'unspecified',
    });

    const exp = mapWhyTodayExplanation(sampleResolvedResult, context);

    const unspecTag = exp.disclosures.find(d => d.code === 'unspecified_tradition_default');
    expect(unspecTag).toBeDefined();
    expect(unspecTag!.label).toBe('Unspecified Tradition Default');
  });

  it('5. Strips internal debug text from raw reason strings', () => {
    const debugResult: ClientObservanceResult = {
      ...sampleResolvedResult,
      reasons: [
        { code: 'custom_factor', text: 'Calculated using morning solar angle [debug: eval_code_4291]' },
      ],
    };

    const exp = mapWhyTodayExplanation(debugResult);
    expect(exp.reasons[0].description).not.toContain('[debug: eval_code_4291]');
    expect(exp.reasons[0].description).toBe('Calculated using morning solar angle');
  });
});
