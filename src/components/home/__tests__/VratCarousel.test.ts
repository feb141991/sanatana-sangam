import { describe, it, expect } from 'vitest';
import {
  getSafeChildEditorialCopy,
  getSafeSeriesName,
  getSeriesCardCopy,
  getSeriesCardChildren,
  isSeriesStartWithinWindow,
} from '@/lib/calendar/series-card-helpers';
import type {
  ObservanceSeries,
  ObservanceSeriesChild,
} from '../../../../contracts/observance-series-contract';

describe('PWA Observance Series & Editorial Guard Logic (Prompt 4)', () => {

  const sourceRef = {
    sourceName: 'Rashtriya Panchang',
    pageOrSection: 'p. 7',
    tier: 1 as const,
  };

  const baseChild: ObservanceSeriesChild = {
    occurrenceId: 'occ-123',
    slug: 'durga-ashtami',
    civilDate: '2026-10-19',
    sequence: 8,
    title: 'Durga Ashtami (Maha Ashtami)',
    routeKind: 'vrat',
    routeSlug: 'durga-ashtami',
    status: 'resolved',
    diagnostics: [],
    sourceRefs: [],
    editorial: {
      canonicalTitle: {
        value: {
          en: 'Durga Ashtami (Maha Ashtami)',
          hi: 'दुर्गा अष्टमी (महाअष्टमी)',
          pa: 'ਦੁਰਗਾ ਅਸ਼ਟਮੀ (ਮਹਾਅਸ਼ਟਮੀ)',
        },
        status: 'source_backed',
        sourceRefs: [sourceRef],
        applicability: { universal: true },
      },
      deityOrTheme: {
        value: {
          en: 'Maa Mahagauri',
          hi: 'माँ महागौरी',
          pa: 'ਮਾਂ ਮਹਾਗੌਰੀ',
        },
        status: 'council_reviewed_editorial',
        sourceRefs: [],
        applicability: { universal: true },
        reviewRef: 'council:navratri-editorial-v1',
      },
      rituals: {
        value: {
          en: ['Maha Ashtami Puja', 'Sandhi Puja', 'Kanya Pujan'],
          hi: ['महाअष्टमी पूजा', 'संधि पूजा', 'कन्या पूजन'],
          pa: ['ਮਹਾਅਸ਼ਟਮੀ ਪੂਜਾ', 'ਸੰਧੀ ਪੂਜਾ', 'ਕੰਨਿਆ ਪੂਜਨ'],
        },
        status: 'council_reviewed_editorial',
        sourceRefs: [],
        applicability: { universal: true },
        reviewRef: 'council:navratri-editorial-v1',
      },
      significance: {
        value: {
          en: 'Eighth form of Navadurga, embodiment of purity and luminous grace.',
          hi: 'नवदुर्गा का आठवाँ स्वरूप, परम पवित्र और दिव्य कांति स्वरूपा।',
          pa: 'ਨਵਦੁਰਗਾ ਦਾ ਅੱਠਵਾਂ ਸਰੂਪ।',
        },
        status: 'council_reviewed_editorial',
        sourceRefs: [],
        applicability: { universal: true },
        reviewRef: 'council:navratri-editorial-v1',
      },
    },
  };

  it('1. resolves source-backed and reviewed editorial copy in English, Hindi, and Punjabi', () => {
    const enCopy = getSafeChildEditorialCopy(baseChild, 'en');
    expect(enCopy.title).toBe('Durga Ashtami (Maha Ashtami)');
    expect(enCopy.subtitle).toBe('Maa Mahagauri');
    expect(enCopy.rituals).toContain('Sandhi Puja');

    const hiCopy = getSafeChildEditorialCopy(baseChild, 'hi');
    expect(hiCopy.title).toBe('दुर्गा अष्टमी (महाअष्टमी)');
    expect(hiCopy.subtitle).toBe('माँ महागौरी');
    expect(hiCopy.rituals).toContain('संधि पूजा');

    const paCopy = getSafeChildEditorialCopy(baseChild, 'pa');
    expect(paCopy.title).toBe('ਦੁਰਗਾ ਅਸ਼ਟਮੀ (ਮਹਾਅਸ਼ਟਮੀ)');
    expect(paCopy.subtitle).toBe('ਮਾਂ ਮਹਾਗੌਰੀ');
  });

  it('2. editorial guard: withheld and pending_source fields NEVER render and fall back safely', () => {
    const withheldChild: ObservanceSeriesChild = {
      ...baseChild,
      title: 'Canonical Fallback Title',
      editorial: {
        canonicalTitle: {
          value: { en: 'Unverified Title' },
          status: 'withheld',
          sourceRefs: [],
          applicability: { universal: true },
        },
        deityOrTheme: {
          value: { en: 'Unverified Deity' },
          status: 'pending_source',
          sourceRefs: [],
          applicability: { universal: true },
        },
        significance: {
          value: { en: 'Fabricated paragraph' },
          status: 'withheld',
          sourceRefs: [],
          applicability: { universal: true },
        },
        rituals: {
          value: { en: ['Invented Ritual'] },
          status: 'withheld',
          sourceRefs: [],
          applicability: { universal: true },
        },
      },
    };

    const copy = getSafeChildEditorialCopy(withheldChild, 'en');
    expect(copy.title).toBe('Canonical Fallback Title');
    expect(copy.subtitle).toBe('');
    expect(copy.description).toBeNull();
    expect(copy.rituals).toEqual([]);
  });

  it('3. regional applicability: region-mismatched rituals do NOT render', () => {
    const regionalChild: ObservanceSeriesChild = {
      ...baseChild,
      editorial: {
        ...baseChild.editorial,
        rituals: {
          value: { en: ['Bilva Nimantran', 'Sasthi Bodhon'] },
          status: 'council_reviewed_editorial',
          sourceRefs: [],
          reviewRef: 'council:bengal-navratri-rituals-v1',
          applicability: {
            regions: ['Bengal', 'East India', 'Odisha'],
            universal: false,
          },
        },
      },
    };

    // User in Bengal receives the rituals
    const bengalCopy = getSafeChildEditorialCopy(regionalChild, 'en', { region: 'Bengal' });
    expect(bengalCopy.rituals).toContain('Bilva Nimantran');

    // User in Punjab (outside applicability) does NOT receive region-mismatched rituals
    const punjabCopy = getSafeChildEditorialCopy(regionalChild, 'en', { region: 'Punjab' });
    expect(punjabCopy.rituals).toEqual([]);

    // Unknown region is not permission to show regional ritual claims globally.
    const unknownRegionCopy = getSafeChildEditorialCopy(regionalChild, 'en');
    expect(unknownRegionCopy.rituals).toEqual([]);
  });

  it('4. same-date multi-children in Diwali cluster: Naraka Chaturdashi and Diwali remain distinct and independently routeable', () => {
    const diwaliSeries: ObservanceSeries = {
      seriesKey: 'diwali-five-days:hindu:2026',
      definitionKey: 'diwali-five-days',
      mode: 'festival_cluster',
      name: 'Diwali',
      tradition: 'hindu',
      profile: { calendar: 'legacy-ujjain', tradition: 'hindu' },
      location: { label: 'Local', lat: 23.17, lon: 75.78, tz: 'Asia/Kolkata' },
      status: 'active',
      startDate: '2026-11-07',
      endDate: '2026-11-11',
      currentCivilDate: '2026-11-08',
      activeChildOccurrenceIds: ['occ-naraka-2026', 'occ-diwali-2026'],
      currentDay: 2,
      totalDays: 5,
      children: [
        {
          occurrenceId: 'occ-naraka-2026',
          slug: 'naraka-chaturdashi',
          civilDate: '2026-11-08',
          sequence: 2,
          title: 'Naraka Chaturdashi',
          routeKind: 'vrat',
          routeSlug: 'naraka-chaturdashi',
          status: 'resolved',
          diagnostics: [],
          sourceRefs: [],
        },
        {
          occurrenceId: 'occ-diwali-2026',
          slug: 'diwali',
          civilDate: '2026-11-08',
          sequence: 3,
          title: 'Diwali (Lakshmi Puja)',
          routeKind: 'vrat',
          routeSlug: 'diwali',
          status: 'resolved',
          diagnostics: [],
          sourceRefs: [],
        },
      ],
      diagnostics: [],
      sourceRefs: [],
      versions: {},
    };

    const activeChildren = getSeriesCardChildren(diwaliSeries);

    expect(activeChildren.length).toBe(2);
    expect(activeChildren[0].slug).toBe('naraka-chaturdashi');
    expect(activeChildren[1].slug).toBe('diwali');
    expect(activeChildren[0].routeSlug).not.toBe(activeChildren[1].routeSlug);
  });

  it('5. fails closed when active occurrence identities are absent', () => {
    const invalidActiveSeries: ObservanceSeries = {
      seriesKey: 'invalid-series',
      definitionKey: 'invalid-series',
      mode: 'daily_journey',
      name: 'Invalid Series',
      tradition: 'hindu',
      profile: { calendar: 'legacy-ujjain', tradition: 'hindu' },
      location: { label: 'Local', lat: 23.17, lon: 75.78, tz: 'Asia/Kolkata' },
      status: 'active',
      startDate: baseChild.civilDate,
      endDate: baseChild.civilDate,
      currentCivilDate: baseChild.civilDate,
      activeChildOccurrenceIds: [],
      currentDay: baseChild.sequence,
      totalDays: 1,
      children: [baseChild],
      diagnostics: [],
      sourceRefs: [],
      versions: {},
    };
    expect(getSeriesCardChildren(invalidActiveSeries)).toEqual([]);
  });

  it('6. rejects source-backed and council-reviewed fields without evidence', () => {
    const unsafeChild: ObservanceSeriesChild = {
      ...baseChild,
      title: 'Canonical occurrence title',
      editorial: {
        canonicalTitle: {
          value: { en: 'Unsourced override' },
          status: 'source_backed',
          sourceRefs: [],
          applicability: { universal: true },
        },
        deityOrTheme: {
          value: { en: 'Unreviewed council copy' },
          status: 'council_reviewed_editorial',
          sourceRefs: [],
          applicability: { universal: true },
        },
      },
    };
    const copy = getSafeChildEditorialCopy(unsafeChild);
    expect(copy.title).toBe('Canonical occurrence title');
    expect(copy.subtitle).toBe('');
  });

  it('7. localizes status and action chrome with the selected app language', () => {
    const hi = getSeriesCardCopy('hi');
    expect(hi.today).toBe('आज');
    expect(hi.dayOf(4, 9)).toBe('दिन 4 / 9');
    expect(hi.explore).toBe('पर्व देखें');

    const pa = getSeriesCardCopy('pa');
    expect(pa.tomorrow).toBe('ਕੱਲ੍ਹ');
    expect(pa.reviewPending).toBe('ਕੈਲੰਡਰ ਸਮੀਖਿਆ ਬਾਕੀ');
  });

  it('8. resolves the backend-owned localized series name and fails back to the canonical name', () => {
    const localized = {
      seriesKey: 'localized',
      definitionKey: 'localized',
      mode: 'festival_cluster',
      name: 'Diwali',
      editorial: {
        name: {
          value: { en: 'Diwali', hi: 'दीपावली', pa: 'ਦੀਵਾਲੀ' },
          status: 'council_reviewed_editorial',
          sourceRefs: [],
          reviewRef: 'council:series-name-v1',
          applicability: { universal: true },
        },
      },
      tradition: 'hindu',
      profile: { calendar: 'legacy-ujjain', tradition: 'hindu' },
      location: { label: 'Local', lat: 23.17, lon: 75.78, tz: 'Asia/Kolkata' },
      status: 'upcoming',
      startDate: '2026-11-08',
      endDate: '2026-11-08',
      currentCivilDate: null,
      activeChildOccurrenceIds: [],
      currentDay: null,
      totalDays: 1,
      children: [],
      diagnostics: [],
      sourceRefs: [],
      versions: {},
    } satisfies ObservanceSeries;
    expect(getSafeSeriesName(localized, 'hi')).toBe('दीपावली');
    expect(getSafeSeriesName({ ...localized, editorial: undefined }, 'hi')).toBe('Diwali');
  });

  it('9. keeps under-review series outside the Home window off the card surface', () => {
    const reviewSeries = {
      seriesKey: 'review-series',
      definitionKey: 'review-series',
      mode: 'festival_cluster',
      name: 'Review Series',
      tradition: 'hindu',
      profile: { calendar: 'legacy-ujjain', tradition: 'hindu' },
      location: { label: 'Local', lat: 23.17, lon: 75.78, tz: 'Asia/Kolkata' },
      status: 'under_review',
      startDate: '2026-11-12',
      endDate: '2026-11-12',
      currentCivilDate: null,
      activeChildOccurrenceIds: [],
      currentDay: null,
      totalDays: 1,
      children: [],
      diagnostics: ['series_child_under_review:test'],
      sourceRefs: [],
      versions: {},
    } satisfies ObservanceSeries;
    expect(isSeriesStartWithinWindow(reviewSeries, '2026-11-08', 3)).toBe(false);
    expect(isSeriesStartWithinWindow({ ...reviewSeries, startDate: '2026-11-11' }, '2026-11-08', 3)).toBe(true);
  });

});
