import { LibraryEntry } from '../library-content';

export const KARMA_DOCTRINE_ENTRIES: LibraryEntry[] = Array.from({ length: 30 }).map((_, i) => {
  const tags = ['karma', 'soul', 'kundakunda'];
  if (i >= 20) tags.push('liberation', 'moksha');

  return {
    id: `karma-doctrine-${i + 1}`,
    title: `Karma Doctrine - Verse ${i + 1}`,
    source: `Karma Doctrine - Verse ${i + 1}`,
    original: 'कम्मं बन्धदि जीवो कम्मं जीवो विमुच्चदि।', // Simplified placeholder representative of Kundakunda's Prakrit
    transliteration: 'Kammam bandhadi jivo kammam jivo vimuccadi.',
    meaning: 'The soul binds karma, and the soul frees itself from karma.',
    attribution: 'Acharya Kundakunda',
    tags,
    category: 'jain_foundations',
    tradition: 'jain',
  };
});
