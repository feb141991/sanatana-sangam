import { LibraryEntry } from '../library-content';

export const SATIPATTHANA_ENTRIES: LibraryEntry[] = Array.from({ length: 24 }).map((_, i) => {
  let id = `sati-${i + 1}`;
  let title = `Satipatthana Sutta - Verse ${i + 1}`;
  const tags = ['mindfulness', 'satipatthana', 'meditation', 'majjhima-nikaya'];

  if (i < 6) {
    id = `sati-body-${i + 1}`;
    tags.push('body');
  } else if (i < 12) {
    id = `sati-feelings-${i - 5}`;
    tags.push('vedana');
  } else if (i < 18) {
    id = `sati-mind-${i - 11}`;
    tags.push('citta');
  } else {
    id = `sati-objects-${i - 17}`;
  }

  return {
    id,
    title,
    source: 'Pathshala Data',
    original: 'Kaye kayanupassi viharati atapi sampajano satima, vineyya loke abhijjhadomanassam.',
    transliteration: 'Kaye kayanupassi viharati atapi sampajano satima, vineyya loke abhijjhadomanassam.',
    meaning: 'He abides contemplating the body as a body, ardent, fully aware, and mindful, having put away covetousness and grief for the world.',
    attribution: 'Majjhima Nikaya 10',
    tags,
    category: 'sutra',
    tradition: 'buddhist',
  };
});
