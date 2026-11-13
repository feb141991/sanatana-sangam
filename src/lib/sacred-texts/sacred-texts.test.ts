import { describe, expect, it } from 'vitest';
import { getDailySacredText, DHAMMA_VERSES, SHABADS, JAIN_SUTRAS, DAILY_WISDOM_TEXTS } from '../sacred-texts';
import { BUDDHIST_VERSES } from './buddhist';
import { HINDU_SHLOKAS } from './hindu';
import { SHLOKAS, getTodayShloka } from '../shlokas';

describe('Sacred Texts & Traditions Pool', () => {
  it('Buddhist pool contains exactly 365 Dhammapada verses', () => {
    expect(BUDDHIST_VERSES.length).toBe(365);
    expect(DHAMMA_VERSES.length).toBe(365);
  });

  it('Hindu pool contains exactly 365 classical verses', () => {
    expect(HINDU_SHLOKAS.length).toBe(365);
    expect(SHLOKAS.length).toBe(365);
  });

  it('Jain pool contains exactly 365 canonical verses and sutras', () => {
    expect(JAIN_SUTRAS.length).toBe(365);
  });

  it('Sikh pool contains exactly 365 sacred shabads from Sri Guru Granth Sahib', () => {
    expect(SHABADS.length).toBe(365);
  });

  it('Universal wisdom pool contains exactly 365 classical verses', () => {
    expect(DAILY_WISDOM_TEXTS.length).toBe(365);
  });

  it('every Universal wisdom verse has valid original, transliteration, meaning, and source', () => {
    for (const u of DAILY_WISDOM_TEXTS) {
      expect(u.id).toBeGreaterThanOrEqual(1);
      expect(u.id).toBeLessThanOrEqual(365);
      expect(u.tradition).toBe('other');
      expect(u.original.trim().length).toBeGreaterThan(0);
      expect(u.transliteration.trim().length).toBeGreaterThan(0);
      expect(u.meaning.trim().length).toBeGreaterThan(0);
      expect(u.source.trim().length).toBeGreaterThan(0);
    }
  });

  it('rotates deterministically without repeating across 365 days for Universal wisdom', () => {
    const seen = new Set<string>();
    for (let day = 0; day < 365; day++) {
      const verse = getDailySacredText('other', day);
      expect(verse).not.toBeNull();
      expect(seen.has(verse!.original)).toBe(false);
      seen.add(verse!.original);
    }
    expect(seen.size).toBe(365);
  });

  it('every Sikh shabad has valid original, transliteration, meaning, and source', () => {
    for (const s of SHABADS) {
      expect(s.id).toBeGreaterThanOrEqual(1);
      expect(s.id).toBeLessThanOrEqual(365);
      expect(s.tradition).toBe('sikh');
      expect(s.original.trim().length).toBeGreaterThan(0);
      expect(s.transliteration.trim().length).toBeGreaterThan(0);
      expect(s.meaning.trim().length).toBeGreaterThan(0);
      expect(s.source.trim().length).toBeGreaterThan(0);
    }
  });

  it('rotates deterministically without repeating across 365 days for Sikh', () => {
    const seen = new Set<string>();
    for (let day = 0; day < 365; day++) {
      const verse = getDailySacredText('sikh', day);
      expect(verse).not.toBeNull();
      expect(seen.has(verse!.original)).toBe(false);
      seen.add(verse!.original);
    }
    expect(seen.size).toBe(365);
  });

  it('every Jain verse has valid original, transliteration, meaning, and source', () => {
    for (const j of JAIN_SUTRAS) {
      expect(j.id).toBeGreaterThanOrEqual(1);
      expect(j.id).toBeLessThanOrEqual(365);
      expect(j.tradition).toBe('jain');
      expect(j.original.trim().length).toBeGreaterThan(0);
      expect(j.transliteration.trim().length).toBeGreaterThan(0);
      expect(j.meaning.trim().length).toBeGreaterThan(0);
      expect(j.source.trim().length).toBeGreaterThan(0);
    }
  });

  it('rotates deterministically without repeating across 365 days for Jain', () => {
    const seen = new Set<string>();
    for (let day = 0; day < 365; day++) {
      const verse = getDailySacredText('jain', day);
      expect(verse).not.toBeNull();
      expect(seen.has(verse!.source)).toBe(false);
      seen.add(verse!.source);
    }
    expect(seen.size).toBe(365);
  });

  it('every Buddhist verse has valid original, transliteration, meaning, and source', () => {
    for (const v of BUDDHIST_VERSES) {
      expect(v.id).toBeGreaterThanOrEqual(1);
      expect(v.id).toBeLessThanOrEqual(365);
      expect(v.tradition).toBe('buddhist');
      expect(v.original.trim().length).toBeGreaterThan(0);
      expect(v.transliteration.trim().length).toBeGreaterThan(0);
      expect(v.meaning.trim().length).toBeGreaterThan(0);
      expect(v.source).toMatch(/^Dhammapada, Verse \d+ — /);
    }
  });

  it('every Hindu verse has valid sanskrit, transliteration, meaning, and source', () => {
    for (const s of SHLOKAS) {
      expect(s.id).toBeGreaterThanOrEqual(1);
      expect(s.id).toBeLessThanOrEqual(365);
      expect(s.sanskrit.trim().length).toBeGreaterThan(0);
      expect(s.transliteration.trim().length).toBeGreaterThan(0);
      expect(s.meaning.trim().length).toBeGreaterThan(0);
      expect(s.source.trim().length).toBeGreaterThan(0);
    }
  });

  it('rotates deterministically without repeating across 365 days for Buddhist', () => {
    const seen = new Set<string>();
    for (let day = 0; day < 365; day++) {
      const verse = getDailySacredText('buddhist', day);
      expect(verse).not.toBeNull();
      expect(seen.has(verse!.source)).toBe(false);
      seen.add(verse!.source);
    }
    expect(seen.size).toBe(365);
  });

  it('getTodayShloka returns a valid shloka with non-empty fields', () => {
    const today = getTodayShloka('Asia/Kolkata');
    expect(today).toBeDefined();
    expect(today.sanskrit.length).toBeGreaterThan(0);
    expect(today.transliteration.length).toBeGreaterThan(0);
    expect(today.meaning.length).toBeGreaterThan(0);
    expect(today.source.length).toBeGreaterThan(0);
  });

  it('existing traditions return non-null DailySacredText', () => {
    expect(getDailySacredText('sikh', 0)).toMatchObject({
      original: expect.any(String),
      transliteration: expect.any(String),
      meaning: expect.any(String),
      source: expect.any(String),
    });
    expect(getDailySacredText('jain', 0)).toMatchObject({
      original: expect.any(String),
      transliteration: expect.any(String),
      meaning: expect.any(String),
      source: expect.any(String),
    });
    expect(getDailySacredText('other', 0)).toMatchObject({
      original: expect.any(String),
      transliteration: expect.any(String),
      meaning: expect.any(String),
      source: expect.any(String),
    });
    expect(getDailySacredText('hindu', 0)).toBeNull(); // Hindu uses shlokas.ts
  });
});
