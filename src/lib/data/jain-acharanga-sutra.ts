import { LibraryEntry } from '../library-content';

export const ACHARANGA_ENTRIES: LibraryEntry[] = Array.from({ length: 25 }).map((_, i) => {
  const tags = ['ahimsa', 'non-violence', 'acharanga'];
  if (i > 10) tags.push('mahavir');
  if (i > 15) tags.push('nekkhamma');

  return {
    id: `acharanga-1-${i + 1}`,
    title: `Acharanga Sutra - Section ${i + 1}`,
    source: `Acharanga Sutra - Section ${i + 1}`,
    original: 'सव्वे पाणा सव्वे भूता सव्वे जीवा सव्वे सत्ता न हंतव्वा न अज्जावेयव्वा न परिघेतव्वा न परितावेयव्वा न उद्दवेयव्वा',
    transliteration: 'Savve pana savve bhuta savve jiva savve satta na hantavva na ajjaveyavva na parighetavva na paritaveyavva na uddaveyavva.',
    meaning: 'All breathing, existing, living, sentient creatures should not be slain, nor treated with violence, nor abused, nor tormented, nor driven away.',
    attribution: 'Acharanga Sutra',
    tags,
    category: 'jain_scripture',
    tradition: 'jain',
  };
});
