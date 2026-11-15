import { describe, it, expect } from 'vitest';
import {
  LIVE_STREAMS,
  VERIFIED_STATIC_STREAM_IDS,
  ID_ALIASES,
  resolveActiveLiveStreams,
  type LiveDarshanDbRow,
} from '../live-streams';

describe('Live Streams Resolution & Catalog Integrity', () => {
  it('all VERIFIED_STATIC_STREAM_IDS exist in LIVE_STREAMS catalog', () => {
    const catalogIds = new Set(LIVE_STREAMS.map((s) => s.id));
    for (const id of VERIFIED_STATIC_STREAM_IDS) {
      expect(catalogIds.has(id)).toBe(true);
    }
  });

  it('resolves confirmed static streams with valid video IDs when DB is absent', () => {
    const resolved = resolveActiveLiveStreams(null);
    expect(resolved.length).toBe(VERIFIED_STATIC_STREAM_IDS.size);

    const mahakal = resolved.find((s) => s.id === 'mahakaleshwar-ujjain');
    expect(mahakal).toBeDefined();
    expect(mahakal?.youtubeVideoId).toBe('WvJD65-eVPo');

    const tirupati = resolved.find((s) => s.id === 'tirupati-balaji');
    expect(tirupati).toBeDefined();
    expect(tirupati?.youtubeVideoId).toBe('XxdarKTmJ8c');

    const ayodhya = resolved.find((s) => s.id === 'ayodhya-ram-mandir');
    expect(ayodhya).toBeDefined();
    expect(ayodhya?.youtubeVideoId).toBe('F5D962RZtOU');
  });

  it('guarantees verified live representation across all 4 traditions', () => {
    const resolved = resolveActiveLiveStreams(null);
    const hindu = resolved.filter((s) => s.tradition === 'hindu');
    const sikh = resolved.filter((s) => s.tradition === 'sikh');
    const jain = resolved.filter((s) => s.tradition === 'jain');
    const buddhist = resolved.filter((s) => s.tradition === 'buddhist');

    expect(hindu.length).toBeGreaterThanOrEqual(15);
    expect(sikh.length).toBeGreaterThanOrEqual(5);
    expect(jain.length).toBeGreaterThanOrEqual(3);
    expect(buddhist.length).toBeGreaterThanOrEqual(3);

    // Verify key tradition anchors
    expect(sikh.some((s) => s.id === 'golden-temple-sgpc')).toBe(true);
    expect(jain.some((s) => s.id === 'jinvani-tv-live')).toBe(true);
    expect(buddhist.some((s) => s.id === 'mahabodhi-bodh-gaya')).toBe(true);
    expect(hindu.some((s) => s.id === 'mahakaleshwar-ujjain')).toBe(true);
  });

  it('correctly maps legacy or DB aliases to canonical catalog IDs', () => {
    const dbRows: LiveDarshanDbRow[] = [
      {
        id: 'mahakaleshwar',
        current_video_id: 'NEW_MAHAKAL_VID',
        is_active: true,
        health_status: 'healthy',
      },
    ];

    const resolved = resolveActiveLiveStreams(dbRows);
    const mahakal = resolved.find((s) => s.id === 'mahakaleshwar-ujjain');
    expect(mahakal).toBeDefined();
    expect(mahakal?.youtubeVideoId).toBe('NEW_MAHAKAL_VID');
    expect(mahakal?.location).toContain('Ujjain');

    // Ensure no duplicate under legacy id
    const legacy = resolved.filter((s) => s.id === 'mahakaleshwar');
    expect(legacy.length).toBe(0);
  });

  it('suppresses stream when marked is_active=false in DB', () => {
    const dbRows: LiveDarshanDbRow[] = [
      {
        id: 'tirupati-balaji',
        current_video_id: 'XxdarKTmJ8c',
        is_active: false,
      },
    ];

    const resolved = resolveActiveLiveStreams(dbRows);
    const tirupati = resolved.find((s) => s.id === 'tirupati-balaji');
    expect(tirupati).toBeUndefined();
  });

  it('suppresses stream when marked health_status=offline in DB', () => {
    const dbRows: LiveDarshanDbRow[] = [
      {
        id: 'mahakaleshwar',
        current_video_id: 'WvJD65-eVPo',
        is_active: true,
        health_status: 'offline',
      },
    ];

    const resolved = resolveActiveLiveStreams(dbRows);
    const mahakal = resolved.find((s) => s.id === 'mahakaleshwar-ujjain');
    expect(mahakal).toBeUndefined();
  });
});
