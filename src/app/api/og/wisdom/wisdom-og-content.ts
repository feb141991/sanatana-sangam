import { getKathaById, getCanonicalKathaId } from '@/lib/katha-library';
import { STOTRAMS } from '@/lib/stotrams';
import { findJournalEssay } from '@/config/journal';

export interface WisdomOgContent {
  title: string;
  subtitle: string;
  traditionKey: string;
  categoryBadge: string;
}

/**
 * Resolves what this image shows, from already-vetted app content only.
 * Deliberately has no fallback that reads raw `title`/`subtitle` query
 * params: this image carries the official Shoonaya brand, domain and
 * styling, so free-text from the URL would let anyone generate a
 * convincing, officially-branded image saying whatever they typed. An
 * unresolved type/id/slug (or a not-found katha/stotram/journal entry)
 * falls through to the generic defaults below instead.
 */
export function resolveWisdomOgContent(searchParams: URLSearchParams): WisdomOgContent {
  const type = searchParams.get('type') || 'katha';
  const id = searchParams.get('id');
  const slug = searchParams.get('slug');

  let title = 'Sacred Wisdom';
  let subtitle = 'Explore timeless stories, stotrams, and spiritual literature on Shoonaya.';
  let traditionKey = 'hindu';
  let categoryBadge = 'Katha';

  if (type === 'katha' && id) {
    const canonicalId = getCanonicalKathaId(id);
    const katha = getKathaById(canonicalId);
    if (katha) {
      title = katha.title;
      subtitle = katha.preview || (katha.body && katha.body[0]) || '';
      traditionKey = katha.tradition || 'hindu';
      categoryBadge = katha.tags.includes('ekadashi')
        ? 'Ekadashi Mahatmya'
        : katha.tags.includes('panchatantra')
        ? 'Panchatantra Wisdom'
        : 'Sacred Katha';
    }
  } else if (type === 'stotram' && id) {
    const stotram = STOTRAMS.find((s) => s.id === id);
    if (stotram) {
      title = stotram.title;
      subtitle = stotram.description || `${stotram.deity} • ${stotram.verses.length} Sacred Verses`;
      traditionKey = stotram.tradition === 'all' ? 'hindu' : stotram.tradition;
      categoryBadge = `Stotram • ${stotram.verses.length} Verses`;
    }
  } else if (type === 'journal' && slug) {
    const essay = findJournalEssay(slug);
    if (essay) {
      title = essay.title;
      subtitle = essay.excerpt;
      traditionKey = 'hindu';
      categoryBadge = `Journal • ${essay.readTime}`;
    }
  }

  return { title, subtitle, traditionKey, categoryBadge };
}
