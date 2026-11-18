import { describe, expect, it } from 'vitest';
import {
  generateDharmVeerSocialPost,
  generateFestivalSeoCampaign,
  generateSanctuaryNewsletter,
} from './marketing-rag';

describe('RAG Marketing Service', () => {
  it('generates a grounded Dharm Veer social carousel', async () => {
    const res = await generateDharmVeerSocialPost({
      heroId: 'chhatrapati-shivaji',
      platform: 'instagram',
    });

    expect(res.heroId).toBe('chhatrapati-shivaji');
    expect(res.heroName).toContain('Shivaji');
    expect(res.platform).toBe('instagram');
    expect(res.slides.length).toBeGreaterThanOrEqual(4);
    expect(res.hook).toBeTruthy();
    expect(res.caption).toBeTruthy();
    expect(res.ctaUrl).toContain('https://shoonaya.com/get');
    expect(res.sourcesVerified).toBe(true);
    expect(res.sourceAttribution).toBeTruthy();
  });

  it('generates date-resolved Dharm Veer hero post', async () => {
    const res = await generateDharmVeerSocialPost({
      date: '2026-10-15',
      platform: 'twitter',
    });

    expect(res.heroId).toBeTruthy();
    expect(res.heroName).toBeTruthy();
    expect(res.platform).toBe('twitter');
    expect(res.slides.length).toBeGreaterThan(0);
  });

  it('generates programmatic festival SEO page specification', async () => {
    const res = await generateFestivalSeoCampaign({
      festivalSlug: 'maha-shivaratri',
      city: 'London',
      year: 2027,
    });

    expect(res.festivalSlug).toBe('maha-shivaratri');
    expect(res.city).toBe('London');
    expect(res.year).toBe(2027);
    expect(res.metaTitle).toContain('London');
    expect(res.metaDescription).toContain('London');
    expect(res.h1).toContain('Maha Shivaratri');
    expect(res.astronomicalTimingExplanation).toBeTruthy();
    expect(res.faqItems.length).toBeGreaterThanOrEqual(2);
    expect(res.jsonLdFaqSchema).toContain('FAQPage');
    expect(res.ctaUrl).toContain('shoonaya.com/get');
  });

  it('generates weekly Sanctuary Dispatch newsletter', async () => {
    const res = await generateSanctuaryNewsletter({
      weekStartDate: '2026-11-23',
    });

    expect(res.weekDate).toBe('2026-11-23');
    expect(res.subjectLine).toBeTruthy();
    expect(res.previewText).toBeTruthy();
    expect(res.sections.length).toBeGreaterThanOrEqual(3);
    expect(res.plainText).toContain('THE SANCTUARY DISPATCH');
    expect(res.ctaUrl).toContain('shoonaya.com/get');
  });
});
