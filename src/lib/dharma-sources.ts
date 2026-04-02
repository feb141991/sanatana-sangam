import { ALL_LIBRARY_ENTRIES, type LibraryEntry, type LibraryTradition } from '@/lib/library-content';

export interface DharmaReference {
  id: string;
  title: string;
  source: string;
  tradition: LibraryTradition;
  excerpt: string;
  tags: string[];
}

const STOP_WORDS = new Set([
  'the', 'and', 'for', 'with', 'this', 'that', 'from', 'what', 'when', 'where', 'which',
  'about', 'into', 'your', 'have', 'will', 'would', 'should', 'could', 'them', 'they',
  'how', 'why', 'who', 'can', 'just', 'like', 'than', 'then', 'does', 'mean', 'daily',
  'life', 'start', 'simple', 'simply', 'today', 'best', 'more',
]);

function tokenize(query: string) {
  return Array.from(new Set(
    query
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .map((token) => token.trim())
      .filter((token) => token.length >= 3 && !STOP_WORDS.has(token))
  ));
}

function truncateMeaning(text: string, limit = 180) {
  if (text.length <= limit) return text;
  const clipped = text.slice(0, limit);
  const lastSpace = clipped.lastIndexOf(' ');
  return `${clipped.slice(0, lastSpace > 0 ? lastSpace : limit).trim()}…`;
}

function getEntryScore(entry: LibraryEntry, tokens: string[], tradition?: string | null) {
  if (tokens.length === 0) return 0;

  const haystack = [
    entry.title.toLowerCase(),
    entry.source.toLowerCase(),
    entry.meaning.toLowerCase(),
    entry.tags.join(' ').toLowerCase(),
  ];

  let score = 0;

  for (const token of tokens) {
    if (haystack[0].includes(token)) score += 5;
    if (haystack[1].includes(token)) score += 4;
    if (haystack[2].includes(token)) score += 2;
    if (haystack[3].includes(token)) score += 3;
  }

  if (tradition && entry.tradition === tradition) score += 3;
  if (entry.title.toLowerCase().includes('daily') || entry.tags.includes('daily')) score += 1;

  return score;
}

export function getDharmaReferences(query: string, tradition?: string | null, limit = 3): DharmaReference[] {
  const tokens = tokenize(query);
  if (tokens.length === 0) return [];

  return ALL_LIBRARY_ENTRIES
    .map((entry) => ({
      entry,
      score: getEntryScore(entry, tokens, tradition),
    }))
    .filter((candidate) => candidate.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ entry }) => ({
      id: entry.id,
      title: entry.title,
      source: entry.source,
      tradition: entry.tradition,
      excerpt: truncateMeaning(entry.meaning),
      tags: entry.tags,
    }));
}

export function formatDharmaReferencePack(references: DharmaReference[]) {
  if (references.length === 0) {
    return 'No curated internal reference pack was matched for this question.';
  }

  return references
    .map((reference, index) => (
      `${index + 1}. ${reference.title}\n` +
      `Source: ${reference.source}\n` +
      `Tradition: ${reference.tradition}\n` +
      `Summary: ${reference.excerpt}`
    ))
    .join('\n\n');
}
