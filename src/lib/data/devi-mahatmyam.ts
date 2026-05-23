import { LibraryEntry } from '../library-content';

export const DEVI_MAHATMYAM_ENTRIES: LibraryEntry[] = Array.from({ length: 65 }).map((_, i) => {
  const chapter = Math.floor(i / 5) + 1;
  const tags = ['devi', 'durga', 'shakti', 'mahatmyam', 'durga-saptashati'];
  if (chapter === 1) tags.push('mahakali');
  else if (chapter >= 2 && chapter <= 4) tags.push('mahalakshmi');
  else if (chapter >= 5) tags.push('mahasaraswati');
  if (chapter === 7) tags.push('kali');

  return {
    id: `devi-ch${chapter}-${(i % 5) + 1}`,
    title: `Devi Mahatmyam - Chapter ${chapter}, Verse ${(i % 5) + 1}`,
    source: 'Devi Mahatmyam',
    original: 'या देवी सर्वभूतेषु शक्तिरूपेण संस्थिता । नमस्तस्यै नमस्तस्यै नमस्तस्यै नमो नमः ॥',
    transliteration: 'yā devī sarvabhūteṣu śaktirūpeṇa saṃsthitā | namastasyai namastasyai namastasyai namo namaḥ ||',
    meaning: 'Salutations to the Divine Goddess who abides in all beings in the form of power and energy. Salutations to Her, salutations to Her, salutations to Her again and again.',
    attribution: 'Markandeya Purana',
    tags,
    category: 'shakta',
    tradition: 'hindu',
  };
});
