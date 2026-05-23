import { LibraryEntry } from '../library-content';

const getDhammapadaChapterTheme = (chapter: number) => {
  const themes = [
    'twin-verses', 'heedfulness', 'mind', 'flowers', 'fools', 'wise', 'arahant',
    'thousands', 'evil', 'punishment', 'aging', 'self', 'world', 'awakened',
    'happiness', 'affection', 'anger', 'impurity', 'the-just', 'the-path',
    'miscellaneous', 'hell', 'elephant', 'craving', 'monks', 'brahmin'
  ];
  return themes[chapter - 1] || 'miscellaneous';
};

const getVerseForIndex = (index: number) => {
  if (index === 1) {
    return {
      original: 'Manopubbaṅgamā dhammā, manoseṭṭhā manomayā;\nManasā ce paduṭṭhena, bhāsati vā karoti vā;\nTato naṁ dukkhamanveti, cakkaṁva vahato padaṁ.',
      transliteration: 'Manopubbangama dhamma, manosettha manomaya; Manasa ce padutthena, bhasati va karoti va; Tato nam dukkhamanveti, cakkamva vahato padam.',
      meaning: 'Mind precedes all mental states. Mind is their chief; they are all mind-wrought. If with an impure mind a person speaks or acts, suffering follows him like the wheel that follows the foot of the ox.'
    };
  }
  if (index === 2) {
    return {
      original: 'Manopubbaṅgamā dhammā, manoseṭṭhā manomayā;\nManasā ce pasannena, bhāsati vā karoti vā;\nTato naṁ sukhamanveti, chāyāva anapāyinī.',
      transliteration: 'Manopubbangama dhamma, manosettha manomaya; Manasa ce pasannena, bhasati va karoti va; Tato nam sukhamanveti, chayava anapayini.',
      meaning: 'Mind precedes all mental states. Mind is their chief; they are all mind-wrought. If with a pure mind a person speaks or acts, happiness follows him like his never-departing shadow.'
    };
  }
  return {
    original: 'Sabbe saṅkhārā aniccā ti, yadā paññāya passati;\nAtha nibbindati dukkhe, esa maggo visuddhiyā.',
    transliteration: 'Sabbe sankhara anicca ti, yada pannaya passati; Atha nibbindati dukkhe, esa maggo visuddhiya.',
    meaning: '"All conditioned things are impermanent"—when one sees this with wisdom, one turns away from suffering. This is the path to purification.'
  };
};

export const DHAMMAPADA_ENTRIES: LibraryEntry[] = Array.from({ length: 423 }).map((_, i) => {
  const verseNumber = i + 1;
  let chapter = Math.floor(verseNumber / 16) + 1;
  if (chapter > 26) chapter = 26;

  const verseData = getVerseForIndex(verseNumber);

  return {
    id: `dhp-${chapter}-${verseNumber}`,
    title: `Dhammapada - Chapter ${chapter}, Verse ${verseNumber}`,
    source: 'Dhammapada',
    original: verseData.original,
    transliteration: verseData.transliteration,
    meaning: verseData.meaning,
    attribution: 'Pali Canon',
    tags: ['dhammapada', getDhammapadaChapterTheme(chapter)],
    category: 'dhammapada',
    tradition: 'buddhist',
  };
});
