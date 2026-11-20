import { describe, it, expect } from 'vitest';
import { getRelatedWisdomForVrat, getRelatedWisdomForKatha } from './related-wisdom';
import { VRAT_DATABASE } from '@/lib/vrat-data';
import { ALL_KATHAS, getKathaById } from '@/lib/katha-library';
import { STOTRAMS } from '@/lib/stotrams';
import { getAllJournalEssays } from '@/config/journal';

describe('RelatedWisdom Service & Verified Route Integrity', () => {
  const allEssays = new Set(getAllJournalEssays().map((e) => `/journal/${e.slug}`));
  const allStotras = new Set(STOTRAMS.map((s) => `/bhakti/stotram/${s.id}`));
  const allVrats = new Set(Object.keys(VRAT_DATABASE).map((s) => `/vrat/${s}`));
  const validStaticRoots = new Set(['/panchang', '/traditions/hindu', '/traditions/sikh', '/traditions/jain', '/traditions/buddhist']);

  it('generates valid, non-broken links for all 10 Vrats in VRAT_DATABASE', () => {
    const slugs = Object.keys(VRAT_DATABASE);
    expect(slugs.length).toBe(10);

    for (const slug of slugs) {
      const payload = getRelatedWisdomForVrat(slug);
      expect(payload.heading).toBeDefined();
      expect(payload.links.length).toBeGreaterThan(0);
      expect(payload.aiPrompts.length).toBeGreaterThan(0);

      for (const link of payload.links) {
        expect(link.url.startsWith('/')).toBe(true);

        // Verify route targets based on category
        if (link.category === 'katha') {
          const kathaId = link.url.replace('/bhakti/katha/', '');
          const found = getKathaById(kathaId);
          expect(found, `Katha ${link.url} for vrat ${slug} must exist in ALL_KATHAS`).toBeDefined();
        } else if (link.category === 'stotram') {
          expect(allStotras.has(link.url), `Stotram ${link.url} for vrat ${slug} must exist in STOTRAMS`).toBe(true);
        } else if (link.category === 'journal') {
          expect(allEssays.has(link.url), `Journal ${link.url} for vrat ${slug} must exist in journalEssays`).toBe(true);
        } else if (link.category === 'vrat') {
          expect(allVrats.has(link.url), `Vrat ${link.url} must exist in VRAT_DATABASE`).toBe(true);
        } else if (link.category === 'panchang' || link.category === 'tradition') {
          expect(validStaticRoots.has(link.url), `Route ${link.url} must be a valid root`).toBe(true);
        }
      }
    }
  });

  it('generates valid links for sample Katha stories across traditions', () => {
    const testKathaIds = [
      'katha-ekadashi-vaisakha-shukla', // Mohini Ekadashi
      'katha-satyanarayan',             // Purnima
      'katha-shivaratri',               // Shivaratri
      'dhamma-kisa-gotami',             // Buddhist
      'jain-mahavira-chandkaushik',     // Jain
      'sakhi-guru-nanak-sacha-sauda',   // Sikh
    ];

    for (const id of testKathaIds) {
      const payload = getRelatedWisdomForKatha(id);
      expect(payload.heading).toBeDefined();
      expect(payload.links.length).toBeGreaterThan(0);
      expect(payload.aiPrompts.length).toBeGreaterThan(0);

      for (const link of payload.links) {
        expect(link.url.startsWith('/')).toBe(true);
        if (link.category === 'vrat') {
          expect(allVrats.has(link.url), `Vrat ${link.url} must exist in VRAT_DATABASE`).toBe(true);
        } else if (link.category === 'stotram') {
          expect(allStotras.has(link.url), `Stotram ${link.url} must exist in STOTRAMS`).toBe(true);
        } else if (link.category === 'journal') {
          expect(allEssays.has(link.url), `Journal ${link.url} must exist in journalEssays`).toBe(true);
        }
      }
    }
  });

  it('generates high-intent, context-aware Dharma Mitra inquiry prompts', () => {
    const ekadashi = getRelatedWisdomForVrat('ekadashi');
    expect(ekadashi.aiPrompts.some((p) => p.includes('Harivasara'))).toBe(true);

    const shivaratri = getRelatedWisdomForVrat('shivaratri');
    expect(shivaratri.aiPrompts.some((p) => p.includes('Nishita Kaal'))).toBe(true);

    const purnima = getRelatedWisdomForVrat('purnima');
    expect(purnima.aiPrompts.some((p) => p.includes('Satyanarayan'))).toBe(true);
  });
});
