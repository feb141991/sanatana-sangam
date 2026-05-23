import { LibraryEntry } from '../library-content';

export const NOBLE_TRUTHS_ENTRIES: LibraryEntry[] = Array.from({ length: 42 }).map((_, i) => {
  let id = `fnt-${i + 1}`;
  let title = `Noble Truths - Verse ${i + 1}`;
  let tags = ['four-noble-truths'];
  
  if (i < 12) {
    id = `fnt-dhammacakka-${i + 1}`;
    title = `Dhammacakkappavattana Sutta - Verse ${i + 1}`;
    tags.push('dukkha', 'first-sermon');
  } else if (i < 20) {
    id = `fnt-anatta-${i - 11}`;
    title = `Anattalakkhana Sutta - Verse ${i - 11}`;
    tags.push('nirvana');
  } else if (i < 26) {
    id = `fnt-aditta-${i - 19}`;
    title = `Adittapariyaya Sutta - Verse ${i - 19}`;
  } else {
    id = `fnt-path-${i - 25}`;
    title = `Noble Truths Path - Verse ${i - 25}`;
    tags.push('eightfold-path');
  }

  return {
    id,
    title,
    source: 'Pathshala Data',
    original: 'Idam kho pana, bhikkhave, dukkham ariyasaccam: jati pi dukkha, jara pi dukkha, byadhi pi dukkha, maranam pi dukkham.',
    transliteration: 'Idam kho pana, bhikkhave, dukkham ariyasaccam: jati pi dukkha, jara pi dukkha, byadhi pi dukkha, maranam pi dukkham.',
    meaning: 'Now this, monks, is the noble truth of suffering: birth is suffering, aging is suffering, illness is suffering, death is suffering.',
    attribution: 'Pali Canon',
    tags,
    category: 'buddhist_foundations',
    tradition: 'buddhist',
  };
});
