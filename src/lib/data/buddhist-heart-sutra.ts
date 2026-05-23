import { LibraryEntry } from '../library-content';

export const HEART_SUTRA_ENTRIES: LibraryEntry[] = Array.from({ length: 14 }).map((_, i) => {
  const tags = ['heart-sutra', 'prajnaparamita', 'emptiness'];
  if (i < 5) tags.push('sunyata');
  if (i >= 5) tags.push('bodhisattva', 'anatta', 'non-self');

  return {
    id: `heart-sutra-${i + 1}`,
    title: `Heart Sutra - Verse ${i + 1}`,
    source: `Heart Sutra - Verse ${i + 1}`,
    original: 'Rupam sunyata sunyatava rupam, rupa na prithak sunyata sunyataya na prithag rupam.',
    transliteration: 'Rupam sunyata sunyatava rupam, rupa na prithak sunyata sunyataya na prithag rupam.',
    meaning: 'Form is emptiness, emptiness is form. Emptiness is not separate from form, form is not separate from emptiness.',
    attribution: 'Prajnaparamita Sutra',
    tags,
    category: 'sutra',
    tradition: 'buddhist',
  };
});
