import { LibraryEntry } from '../library-content';

export const TATTVARTHA_ENTRIES: LibraryEntry[] = Array.from({ length: 45 }).map((_, i) => {
  const chapter = Math.floor(i / 5) + 1;
  const sutraNum = (i % 5) + 1;
  const tags = ['tattvartha', 'ratnatraya'];
  if (chapter === 1) tags.push('knowledge');
  if (chapter === 2) tags.push('tattva');
  if (chapter === 3) tags.push('soul');
  if (chapter === 4) tags.push('karma');
  if (chapter === 5) tags.push('conduct');
  if (chapter === 6) tags.push('asrava');
  if (chapter === 7) tags.push('samvara');
  if (chapter === 8) tags.push('nirjara');
  if (chapter === 9 || chapter === 10) tags.push('moksha', 'liberation');

  return {
    id: `tattvartha-${chapter}-${sutraNum}`,
    title: `Tattvartha Sutra - Ch ${chapter}, Sutra ${sutraNum}`,
    source: 'Tattvartha Sutra',
    original: 'सम्यग्दर्शनज्ञानचारित्राणि मोक्षमार्गः',
    transliteration: 'Samyagdarśanajñānacāritrāṇi mokṣamārgaḥ',
    meaning: 'Right belief, right knowledge, and right conduct (together) constitute the path to liberation.',
    attribution: 'Umasvati',
    tags,
    category: 'jain_scripture',
    tradition: 'jain',
  };
});
