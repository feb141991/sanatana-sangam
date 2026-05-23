import { LibraryEntry } from '../library-content';

export const METTA_SUTTA_ENTRIES: LibraryEntry[] = Array.from({ length: 11 }).map((_, i) => ({
  id: `metta-${i + 1}`,
  title: `Karaniya Metta Sutta - Verse ${i + 1}`,
    source: `Karaniya Metta Sutta - Verse ${i + 1}`,
  original: 'Mata yatha niyam puttam ayusa ekaputtamanurakkhe; Evampi sabbabhutesu manasam bhavaye aparimanam.',
  transliteration: 'Mata yatha niyam puttam ayusa ekaputtamanurakkhe; Evampi sabbabhutesu manasam bhavaye aparimanam.',
  meaning: 'As a mother would risk her life to protect her child, her only child, even so should one cultivate a limitless heart with regard to all beings.',
  attribution: 'Sutta Nipata 1.8',
  tags: ['metta', 'loving-kindness', 'compassion', 'all-beings'],
  category: 'sutra',
  tradition: 'buddhist',
}));
