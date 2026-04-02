import type { LibraryEntry } from '@/lib/library-content';

export interface LibrarySourceMeta {
  label: string;
  note: string;
}

export function getLibrarySourceMeta(entry: LibraryEntry): LibrarySourceMeta {
  const source = entry.source.toLowerCase();

  if (
    source.includes('gita') ||
    source.includes('upanishad') ||
    source.includes('rigveda') ||
    source.includes('yajurveda') ||
    source.includes('guru granth sahib') ||
    source.includes('dhammapada') ||
    source.includes('sutra') ||
    source.includes('samayasara') ||
    source.includes('tattvartha') ||
    source.includes('agamas')
  ) {
    return {
      label: 'Canonical text',
      note: 'This entry points to a canonical scripture or primary source within the tradition.',
    };
  }

  if (
    source.includes('traditional') ||
    source.includes('tulsidas') ||
    source.includes('shankaracharya') ||
    source.includes('pushpadanta') ||
    source.includes('kundakunda')
  ) {
    return {
      label: 'Traditional composition',
      note: 'This entry comes from a revered traditional hymn, commentary tradition, or devotional composition rather than a primary canon alone.',
    };
  }

  return {
    label: 'Curated tradition excerpt',
    note: 'This entry is curated for learning and devotional context. Use the cited source as the next step for deeper study.',
  };
}
