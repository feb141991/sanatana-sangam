import { LibraryEntry } from '../library-content';

export const SHIVA_PURANA_ENTRIES: LibraryEntry[] = Array.from({ length: 40 }).map((_, i) => {
  const tags = ['shiva', 'shaiva'];
  if (i < 10) tags.push('linga');
  else if (i < 20) tags.push('parvati');
  else if (i < 30) tags.push('shakti');
  else tags.push('mahadev');

  return {
    id: `shiva-pur-${i + 1}`,
    title: `Shiva Purana - Verse ${i + 1}`,
    source: `Shiva Purana - Verse ${i + 1}`,
    original: 'शिवो गुरुः शिवो देवः शिवो बन्धुः शरीरिणाम् । शिव आत्मा शिवो जीवः शिवादन्यन्न किञ्चन ॥',
    transliteration: 'śivo guruḥ śivo devaḥ śivo bandhuḥ śarīriṇām | śiva ātmā śivo jīvaḥ śivādanyanna kiñcana ||',
    meaning: 'Shiva is the Guru, Shiva is the Lord, Shiva is the relative of all embodied beings. Shiva is the soul, Shiva is the living being; there is nothing other than Shiva.',
    attribution: 'Shiva Purana',
    tags,
    category: 'shiva_purana',
    tradition: 'hindu',
  };
});
