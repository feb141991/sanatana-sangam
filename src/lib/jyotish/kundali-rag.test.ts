import { describe, expect, it } from 'vitest';
import { generateAstroChart, type BirthInput } from './astro-engine';
import { generateKundaliShastricReading } from './kundali-rag';

describe('Kundali Shastric RAG Service', () => {
  const sampleInput: BirthInput = {
    date: '1992-08-20',
    time: '06:45',
    lat: 28.6139,
    lng: 77.209,
    timezone: 'Asia/Kolkata',
    timeUnknown: false,
  };

  const chart = generateAstroChart(sampleInput);

  it('generates a privacy-preserving Shastric reading grounded in classical treatises', async () => {
    const res = await generateKundaliShastricReading({
      chart,
      language: 'en',
    });

    expect(res.title).toBeTruthy();
    expect(res.lagnaInsight).toBeTruthy();
    expect(res.chandraMindInsight).toBeTruthy();
    expect(res.dashaChapterInsight).toBeTruthy();
    expect(res.privacyPreserved).toBe(true);
    expect(res.citations.length).toBeGreaterThan(0);
    expect(res.sattvicRemedies.length).toBeGreaterThanOrEqual(1);
    expect(res.disclaimer).toBeTruthy();
  });

  it('retrieves authentic Shastric citations from BPHS or Phaladeepika', async () => {
    const res = await generateKundaliShastricReading({
      chart,
      language: 'en',
    });

    const sources = res.citations.map((c) => c.source);
    const hasBphsOrPhala = sources.some(
      (s) => s.includes('Parashara') || s.includes('Phaladeepika') || s.includes('Hora')
    );
    expect(hasBphsOrPhala).toBe(true);
  });

  it('recommends exclusively Sattvic remedies with zero commercial gemstones', async () => {
    const res = await generateKundaliShastricReading({
      chart,
      language: 'en',
    });

    for (const rem of res.sattvicRemedies) {
      expect(rem.practice).toBeTruthy();
      expect(rem.description).toBeTruthy();
      // Ensure no gemstone peddling
      expect(rem.description.toLowerCase()).not.toContain('buy ruby');
      expect(rem.description.toLowerCase()).not.toContain('wear emerald');
    }
  });
});
