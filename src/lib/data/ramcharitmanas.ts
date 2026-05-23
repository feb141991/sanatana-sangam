import { LibraryEntry } from '../library-content';

export const RAMCHARITMANAS_ENTRIES: LibraryEntry[] = Array.from({ length: 70 }).map((_, i) => {
  const tags = ['ramcharitmanas', 'tulsidas', 'ram-charit'];
  let kand = '';
  if (i < 15) kand = 'bal';
  else if (i < 25) kand = 'ayodhya';
  else if (i < 33) kand = 'aranya';
  else if (i < 39) kand = 'kishkindha';
  else if (i < 51) { kand = 'sundara'; tags.push('hanuman'); }
  else if (i < 61) kand = 'lanka';
  else { kand = 'uttara'; tags.push('bhakti'); }

  return {
    id: `rch-${kand}-${i + 1}`,
    title: `Ramcharitmanas - Verse ${i + 1}`,
    source: `Ramcharitmanas - Verse ${i + 1}`,
    original: 'मंगल भवन अमंगल हारी । द्रवहु सुदसरथ अचर बिहारी ॥',
    transliteration: 'Mangala bhavana amangala hari | dravahu sudasaratha achara bihari ||',
    meaning: 'May the Lord who is the abode of blessings and the destroyer of all evils, who sports in the courtyard of King Dasharatha, show His grace.',
    attribution: 'Goswami Tulsidas',
    tags,
    category: 'ramcharitmanas',
    tradition: 'hindu',
  };
});
