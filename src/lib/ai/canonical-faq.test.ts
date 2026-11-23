import { describe, it, expect } from 'vitest';
import { findCanonicalFaqMatch, CANONICAL_FAQS } from './canonical-faq';

describe('Canonical FAQ Resolver', () => {
  it('has valid entries with both English and Hindi answers and sources', () => {
    expect(CANONICAL_FAQS.length).toBeGreaterThan(5);
    for (const faq of CANONICAL_FAQS) {
      expect(faq.id).toBeTruthy();
      expect(faq.questionEn).toBeTruthy();
      expect(faq.questionHi).toBeTruthy();
      expect(faq.answerEn.length).toBeGreaterThan(50);
      expect(faq.answerHi.length).toBeGreaterThan(50);
      expect(faq.sources.length).toBeGreaterThan(0);
    }
  });

  it('matches Ekadashi fasting rules in English', () => {
    const match = findCanonicalFaqMatch('Can you explain the rules for Ekadashi fast and why rice is avoided?');
    expect(match.found).toBe(true);
    expect(match.entry?.id).toBe('ekadashi-rules');
    expect(match.answerText).toContain('Grains & Rice Avoidance');
    expect(match.sources).toContain('Padma Purana');
  });

  it('matches Ekadashi fasting rules in Hindi', () => {
    const match = findCanonicalFaqMatch('एकादशी व्रत के नियम और चावल क्यों नहीं खाना चाहिए?', 'hi');
    expect(match.found).toBe(true);
    expect(match.entry?.id).toBe('ekadashi-rules');
    expect(match.answerText).toContain('अन्न व चावल का त्याग');
  });

  it('matches Brahma Muhurta query', () => {
    const match = findCanonicalFaqMatch('What is brahma muhurta and when should I wake up?');
    expect(match.found).toBe(true);
    expect(match.entry?.id).toBe('brahma-muhurta');
    expect(match.answerText).toContain('1 hour and 36 minutes');
  });

  it('matches Gayatri Mantra recitation query', () => {
    const match = findCanonicalFaqMatch('When to chant gayatri mantra timing?');
    expect(match.found).toBe(true);
    expect(match.entry?.id).toBe('gayatri-mantra-timing');
    expect(match.answerText).toContain('Tri-Sandhya');
  });

  // Regression: the English count said "108, 27, or 10 times" while the Hindi
  // answer for the identical entry said "108, 27 या 11 बार" -- an English
  // speaker and a Hindi speaker asking the same question got contradictory
  // ritual guidance. Fixed to 11 in both (the count actually documented
  // across sources; "10" appeared nowhere). Pins both language answers to
  // the same count so they can't drift apart again.
  it('gives the same Gayatri chanting count in English and Hindi', () => {
    const entry = CANONICAL_FAQS.find((f) => f.id === 'gayatri-mantra-timing');
    expect(entry).toBeTruthy();
    expect(entry!.answerEn).toContain('108, 27, or 11 times');
    expect(entry!.answerHi).toContain('108, 27 या 11 बार');
    expect(entry!.answerEn).not.toMatch(/\b10 times\b/);
  });

  it('matches Mool Mantar meaning', () => {
    const match = findCanonicalFaqMatch('What is the meaning of the Mool Mantar in Sikhism?');
    expect(match.found).toBe(true);
    expect(match.entry?.id).toBe('mool-mantar-meaning');
    expect(match.answerText).toContain('Ik Onkar');
  });

  it('matches Navkar Mantra meaning', () => {
    const match = findCanonicalFaqMatch('Explain the meaning of Navkar mantra in Jainism');
    expect(match.found).toBe(true);
    expect(match.entry?.id).toBe('navkar-mantra-meaning');
    expect(match.answerText).toContain('Pancha Parameshthi');
  });

  it('returns false for unrelated query', () => {
    const match = findCanonicalFaqMatch('What is the capital of France?');
    expect(match.found).toBe(false);
  });
});
