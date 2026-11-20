// ============================================================================
// Shoonaya Semantic & Cross-Corpus Search Service (Pramana Search)
// Comprehensive RAG-powered discovery across Scriptures, Journal Essays,
// Dharm Veer Heroes, Festival Rules, and Kathas.
// ============================================================================

import { getAllJournalEssays, type JournalEssay } from '@/config/journal';
import { ALL_KATHAS, type Katha } from '@/lib/katha-library';
import dharmVeer365Snapshot from '@/lib/data/dharm-veer-365-snapshot.json';
import festivalRulesJson from '../../../packages/dharma-rules/src/festivals/rules.json';
import { retrievePathshalaContext, type RetrievalChunk } from '@/lib/ai/retrieval';
import { PramanaRetrieverSelector } from '@sangam/pramana-serve';

export type PramanaSearchCategory = 'all' | 'scripture' | 'journal' | 'hero' | 'festival' | 'story';

export interface PramanaSearchResultItem {
  id: string;
  category: 'scripture' | 'journal' | 'hero' | 'festival' | 'story';
  title: string;
  subtitle?: string;
  source: string;
  citation?: string;
  content: string;
  originalText?: string;
  url: string;
  tradition: string;
  relevanceScore: number;
  tags?: string[];
}

export interface PramanaSearchParams {
  query: string;
  category?: PramanaSearchCategory;
  tradition?: string | null;
  limit?: number;
}

export interface PramanaSearchResponse {
  query: string;
  category: PramanaSearchCategory;
  tradition: string;
  total: number;
  results: PramanaSearchResultItem[];
}

interface DharmVeerHero {
  id: string;
  name: string;
  tradition: string;
  era?: string;
  region?: string;
  tagline?: string;
  journey?: string;
  teaching?: string;
  moral?: string;
  quote?: string | { text: string; attribution?: string };
  source?: string;
}

interface FestivalRule {
  slug: string;
  display_name: string;
  emoji?: string;
  description?: string;
  kind?: string;
  tradition?: string;
  rule_family?: string;
}

/**
 * Tokenize a search query into lowercase keywords, removing punctuation.
 */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s\u0900-\u097F\u0A00-\u0A7F]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 1);
}

/**
 * Calculate lexical match score between search query and candidate text.
 */
function calculateScore(tokens: string[], fullText: string, titleText = ''): number {
  if (tokens.length === 0) return 0;
  const lowerText = fullText.toLowerCase();
  const lowerTitle = titleText.toLowerCase();

  let score = 0;
  let matches = 0;

  for (const token of tokens) {
    if (lowerTitle.includes(token)) {
      score += 3.0; // Higher weight for title matches
      matches++;
    } else if (lowerText.includes(token)) {
      score += 1.0;
      matches++;
    }
  }

  // Bonus for matching multiple query terms
  const coverageRatio = matches / tokens.length;
  score *= (1 + coverageRatio);

  return Math.min(score / (tokens.length * 4), 1.0);
}

/**
 * Search the 32 Sanctuary Journal Essays.
 */
function searchJournalEssays(tokens: string[], traditionFilter?: string | null): PramanaSearchResultItem[] {
  const essays = getAllJournalEssays();
  const results: PramanaSearchResultItem[] = [];

  for (const essay of essays) {
    if (traditionFilter && traditionFilter !== 'all') {
      const matchTradition = essay.tradition.toLowerCase().includes(traditionFilter.toLowerCase());
      if (!matchTradition && essay.tradition.toLowerCase() !== 'sanatan dharma') {
        continue;
      }
    }

    const searchableBody = [
      essay.subtitle,
      essay.excerpt,
      ...essay.keyTakeaways,
      ...essay.sections.map((s) => `${s.heading} ${s.paragraphs.join(' ')}`),
      ...essay.citations.map((c) => `${c.text} ${c.reference}`),
    ].join(' ');

    const score = calculateScore(tokens, searchableBody, essay.title);
    if (score > 0.05) {
      results.push({
        id: `journal-${essay.slug}`,
        category: 'journal',
        title: essay.title,
        subtitle: essay.subtitle,
        source: 'The Sanctuary Journal',
        citation: essay.publishedDate,
        content: essay.excerpt,
        url: `/journal/${essay.slug}`,
        tradition: essay.tradition,
        relevanceScore: Number(score.toFixed(3)),
        tags: ['journal', essay.tradition.toLowerCase(), 'essay'],
      });
    }
  }

  return results;
}

/**
 * Search the 365 Dharm Veer Heroes Archive.
 */
function searchDharmVeerHeroes(tokens: string[], traditionFilter?: string | null): PramanaSearchResultItem[] {
  const heroes = dharmVeer365Snapshot as unknown as DharmVeerHero[];
  const results: PramanaSearchResultItem[] = [];

  for (const hero of heroes) {
    if (traditionFilter && traditionFilter !== 'all' && hero.tradition.toLowerCase() !== traditionFilter.toLowerCase()) {
      continue;
    }

    const quoteStr = typeof hero.quote === 'string'
      ? hero.quote
      : (hero.quote && typeof hero.quote === 'object' ? `${hero.quote.text} ${hero.quote.attribution || ''}` : '');

    const searchableBody = [
      hero.tagline ?? '',
      hero.journey ?? '',
      hero.teaching ?? '',
      hero.moral ?? '',
      quoteStr,
      hero.source ?? '',
    ].join(' ');

    const score = calculateScore(tokens, searchableBody, hero.name);
    if (score > 0.08) {
      results.push({
        id: `hero-${hero.id}`,
        category: 'hero',
        title: hero.name,
        subtitle: hero.tagline,
        source: hero.source || 'Dharm Veer 365 Archive',
        citation: hero.era,
        content: hero.teaching || hero.journey?.slice(0, 240) || '',
        url: `/dharm-veer/${hero.id}`,
        tradition: hero.tradition,
        relevanceScore: Number(score.toFixed(3)),
        tags: ['hero', hero.tradition, hero.region || 'bharat'],
      });
    }
  }

  return results;
}

/**
 * Search Festival and Calendar Rules.
 */
function searchFestivalRules(tokens: string[], traditionFilter?: string | null): PramanaSearchResultItem[] {
  const rules = festivalRulesJson as unknown as FestivalRule[];
  const results: PramanaSearchResultItem[] = [];

  for (const rule of rules) {
    if (traditionFilter && traditionFilter !== 'all' && rule.tradition && rule.tradition.toLowerCase() !== traditionFilter.toLowerCase()) {
      continue;
    }

    const searchableBody = `${rule.description ?? ''} ${rule.rule_family ?? ''}`;
    const score = calculateScore(tokens, searchableBody, rule.display_name);

    if (score > 0.1) {
      results.push({
        id: `festival-${rule.slug}`,
        category: 'festival',
        title: rule.display_name,
        subtitle: rule.rule_family ? `Rule Family: ${rule.rule_family}` : undefined,
        source: 'Shoonaya Canonical Calendar Rules',
        citation: rule.kind || 'Festival',
        content: rule.description || `Canonical astronomical observance rule for ${rule.display_name}.`,
        url: `/festival/${rule.slug}`,
        tradition: rule.tradition || 'universal',
        relevanceScore: Number(score.toFixed(3)),
        tags: ['festival', rule.tradition || 'universal', rule.kind || 'calendar'],
      });
    }
  }

  return results;
}

/**
 * Search Kathas, Panchatantra, and Moral Tales.
 */
function searchStories(tokens: string[], traditionFilter?: string | null): PramanaSearchResultItem[] {
  const kathas = ALL_KATHAS;
  const results: PramanaSearchResultItem[] = [];

  for (const katha of kathas) {
    if (traditionFilter && traditionFilter !== 'all' && katha.tradition !== 'all' && katha.tradition !== traditionFilter.toLowerCase()) {
      continue;
    }

    const searchableBody = [
      katha.preview,
      katha.phal,
      ...(katha.body || []).slice(0, 3),
    ].join(' ');

    const score = calculateScore(tokens, searchableBody, katha.title);
    if (score > 0.08) {
      results.push({
        id: `story-${katha.id}`,
        category: 'story',
        title: katha.title,
        subtitle: katha.occasion ? `Occasion: ${katha.occasion}` : undefined,
        source: 'Panchatantra & Sacred Kathas',
        citation: katha.phal,
        content: katha.preview,
        url: `/bhakti/katha/${katha.id}`,
        tradition: katha.tradition,
        relevanceScore: Number(score.toFixed(3)),
        tags: ['story', katha.tradition, katha.occasion],
      });
    }
  }

  return results;
}

/**
 * Search Canonical Scriptures via Pramana Retrieval Pipeline.
 */
async function searchScriptures(query: string, traditionFilter?: string | null): Promise<PramanaSearchResultItem[]> {
  const results: PramanaSearchResultItem[] = [];

  try {
    const chunks = await retrievePathshalaContext({
      title: query,
      tradition: traditionFilter || 'hindu',
    });

    for (let index = 0; index < chunks.length; index++) {
      const chunk = chunks[index];
      const meta = (chunk.metadata || {}) as Record<string, any>;
      const sourceName = (meta.sourceName as string) || (meta.docId as string) || 'Sacred Scripture';
      const chunkId = meta.chunkId ? `Ref: ${meta.chunkId}` : undefined;

      results.push({
        id: `scripture-${(meta.docId as string) || 'chunk'}-${index}`,
        category: 'scripture',
        title: sourceName,
        subtitle: chunkId,
        source: sourceName,
        citation: chunkId,
        content: chunk.content,
        originalText: meta.sanskrit as string | undefined,
        url: '/pathshala',
        tradition: (meta.tradition as string) || traditionFilter || 'sanatan',
        relevanceScore: Number((chunk.score ?? 0.85).toFixed(3)),
        tags: ['scripture', (meta.tradition as string) || 'sanatan'],
      });
    }
  } catch {
    // If dense scripture retriever has no match or query doesn't match specific verse
  }

  // Cross-search classical canonical corpora (Ramayana, Yoga, Jyotish, Bhakti, Stotras)
  if (traditionFilter && traditionFilter !== 'all') {
    const tf = traditionFilter.toLowerCase();
    const isHinduFamily = tf === 'hindu' || tf === 'sanatan' || tf === 'vedic';
    if (!isHinduFamily) {
      return results;
    }
  }

  const additionalCorpora = ['valmiki_ramayana', 'tulsidas_ramcharitmanas', 'yoga_sutras', 'jyotish_classics', 'bhakti_sutras', 'vedic_suktas_stotras'];
  const queryTokens = tokenize(query);
  const seenTexts = new Set<string>();

  for (const corp of additionalCorpora) {
    try {
      const retriever = PramanaRetrieverSelector.get(corp);
      if (retriever) {
        const res = await retriever.retrieve({ text: query, topK: 3 });
        if (res.documents) {
          for (let i = 0; i < res.documents.length; i++) {
            const doc = res.documents[i];
            const cleanContent = doc.content.trim();
            if (seenTexts.has(cleanContent)) continue;
            seenTexts.add(cleanContent);

            const meta = (doc.metadata || {}) as Record<string, any>;
            const title = (meta.sourceName as string) || corp.replace(/_/g, ' ');
            const tokenScore = calculateScore(queryTokens, cleanContent, title);
            const finalScore = Math.max(tokenScore, (doc.score ?? 0.5) * 1.5);

            results.push({
              id: `scripture-${corp}-${i}`,
              category: 'scripture',
              title,
              subtitle: (meta.chunkId as string) || (doc.id ?? undefined),
              source: (meta.sourceName as string) || corp,
              citation: (meta.chunkId as string) || undefined,
              content: cleanContent,
              originalText: meta.sanskrit as string | undefined,
              url: '/pathshala',
              tradition: (meta.tradition as string) || 'Sanatan Dharma',
              relevanceScore: Number(finalScore.toFixed(3)),
              tags: ['scripture', corp],
            });
          }
        }
      }
    } catch {
      // Continue safely
    }
  }

  return results;
}

/**
 * Primary Unified Search Engine Function.
 */
export async function performSemanticPramanaSearch(params: PramanaSearchParams): Promise<PramanaSearchResponse> {
  const query = params.query.trim();
  const category = params.category || 'all';
  const tradition = params.tradition || 'all';
  const limit = Math.min(Math.max(params.limit || 10, 1), 50);

  if (!query) {
    return {
      query: '',
      category,
      tradition,
      total: 0,
      results: [],
    };
  }

  const tokens = tokenize(query);
  const candidateLists: PramanaSearchResultItem[][] = [];

  // Parallel collection across requested categories
  const tasks: Promise<void>[] = [];

  if (category === 'all' || category === 'journal') {
    candidateLists.push(searchJournalEssays(tokens, tradition));
  }

  if (category === 'all' || category === 'hero') {
    candidateLists.push(searchDharmVeerHeroes(tokens, tradition));
  }

  if (category === 'all' || category === 'festival') {
    candidateLists.push(searchFestivalRules(tokens, tradition));
  }

  if (category === 'all' || category === 'story') {
    candidateLists.push(searchStories(tokens, tradition));
  }

  if (category === 'all' || category === 'scripture') {
    tasks.push(
      searchScriptures(query, tradition).then((scriptureResults) => {
        candidateLists.push(scriptureResults);
      })
    );
  }

  await Promise.all(tasks);

  // Flatten and sort by relevance score descending
  const combined = candidateLists.flat();
  combined.sort((a, b) => b.relevanceScore - a.relevanceScore);

  const finalResults = combined.slice(0, limit);

  return {
    query,
    category,
    tradition,
    total: combined.length,
    results: finalResults,
  };
}
