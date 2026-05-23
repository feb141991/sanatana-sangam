import { LibraryEntry } from '../library-content';

export const JAIN_COSMOLOGY_ENTRIES: LibraryEntry[] = Array.from({ length: 20 }).map((_, i) => {
  const tags = ['cosmology', 'loka', 'soul'];
  if (i >= 10) tags.push('kalachakra');
  if (i >= 15) tags.push('siddha', 'liberation');

  return {
    id: `jain-cosmo-${i + 1}`,
    title: `Jain Cosmology - Section ${i + 1}`,
    source: `Jain Cosmology - Section ${i + 1}`,
    original: 'लोगो अकिट्टिमो अणाइणिहणो',
    transliteration: 'Logo akittimo anainihano',
    meaning: 'The universe is uncreated and is without beginning or end.',
    attribution: 'Jain Agamas',
    tags,
    category: 'jain_foundations',
    tradition: 'jain',
  };
});
