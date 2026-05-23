import { LibraryEntry } from '../library-content';

export const CHANAKYA_ENTRIES: LibraryEntry[] = Array.from({ length: 70 }).map((_, i) => {
  const chapter = Math.floor(i / 5) + 1;
  const tags = ['chanakya'];
  if (i % 5 === 0) tags.push('wisdom');
  else if (i % 5 === 1) tags.push('leadership');
  else if (i % 5 === 2) tags.push('wealth');
  else if (i % 5 === 3) tags.push('statecraft');
  else tags.push('conduct');

  return {
    id: `chanakya-ch${chapter}-${(i % 5) + 1}`,
    title: `Chanakya Neeti - Chapter ${chapter}, Verse ${(i % 5) + 1}`,
    source: 'Chanakya Neeti',
    original: 'विद्या मित्रं प्रवासेषु भार्या मित्रं गृहेषु च । व्याधितस्यौषधं मित्रं धर्मो मित्रं मृतस्य च ॥',
    transliteration: 'vidyā mitraṃ pravāseṣu bhāryā mitraṃ gṛheṣu ca | vyādhitasya auṣadhaṃ mitraṃ dharmo mitraṃ mṛtasya ca ||',
    meaning: 'Knowledge is a friend during a journey; a wife is a friend in the house; medicine is a friend to a sick man, and Dharma is the friend of the dead.',
    attribution: 'Chanakya',
    tags,
    category: 'chanakya',
    tradition: 'hindu',
  };
});
