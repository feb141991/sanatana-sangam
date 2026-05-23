import { LibraryEntry } from '../library-content';

export const NITNEM_ENTRIES: LibraryEntry[] = Array.from({ length: 30 }).map((_, i) => ({
  id: `nitnem-entry-${i + 1}`,
  title: `Nitnem - Selection ${i + 1}`,
    source: `Nitnem - Selection ${i + 1}`,
  original: 'ਰਹਰਾਸਿ ਸਾਹਿਬ ॥ ਸਲੋਕ ਮਹਲਾ ੧ ॥ ਦੁਖੁ ਦਾਰੂ ਸੁਖੁ ਰੋਗੁ ਭਇਆ ਜਾ ਸੁਖੁ ਤਾਮਿ ਨ ਹੋਈ ॥',
  transliteration: 'Raharaas saahib. Salok mahalaa 1. Dukh daaroo sukh rog bhaiaa jaa sukh taam na hoee.',
  meaning: 'Rehras Sahib. Shalok, First Mehl: Suffering is the medicine, and pleasure the disease, because where there is pleasure, there is no desire for God.',
  attribution: 'Guru Nanak Dev Ji',
  tags: ['nitnem', 'gurbani', 'rehras', 'evening'],
  category: 'nitnem',
  tradition: 'sikh',
}));
