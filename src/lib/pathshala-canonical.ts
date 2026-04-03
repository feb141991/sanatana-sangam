import { GITA_ENTRIES, RAMAYANA_ENTRIES, type LibraryEntry } from '@/lib/library-content';

export interface CanonicalChapter {
  id: string;
  sectionId: 'gita';
  tradition: 'hindu';
  chapterNumber: number;
  verseCount: number;
  sanskritTitle: string;
  transliterationTitle: string;
  englishTitle: string;
  summary: string;
}

export interface CanonicalVerseLink {
  chapterNumber: number;
  verseNumber: number;
  officialUrl: string;
  officialAudioUrl: string;
  localEntry?: LibraryEntry;
}

export interface CanonicalReadingPlan {
  id: string;
  sectionId: 'gita' | 'ramayana';
  title: string;
  subtitle: string;
  cadence: string;
  chapters: number[];
}

export interface CanonicalRamayanaKanda {
  id: string;
  sectionId: 'ramayana';
  tradition: 'hindu';
  kandaNumber: number;
  cantoCount: number;
  sanskritTitle: string;
  transliterationTitle: string;
  englishTitle: string;
  summary: string;
}

export const GITA_CHAPTERS: CanonicalChapter[] = [
  {
    id: 'chapter-1',
    sectionId: 'gita',
    tradition: 'hindu',
    chapterNumber: 1,
    verseCount: 47,
    sanskritTitle: 'अर्जुनविषादयोग',
    transliterationTitle: 'Arjunavishadayoga',
    englishTitle: 'The Yoga of Arjuna’s Despondency',
    summary: 'The crisis of duty, grief, and moral confusion that opens the Gita and sets the stage for Krishna’s teaching.',
  },
  {
    id: 'chapter-2',
    sectionId: 'gita',
    tradition: 'hindu',
    chapterNumber: 2,
    verseCount: 72,
    sanskritTitle: 'सांख्ययोग',
    transliterationTitle: 'Sankhyayoga',
    englishTitle: 'The Yoga of Knowledge',
    summary: 'Krishna introduces the immortality of the Self, steady wisdom, and the foundations of karma yoga.',
  },
  {
    id: 'chapter-3',
    sectionId: 'gita',
    tradition: 'hindu',
    chapterNumber: 3,
    verseCount: 43,
    sanskritTitle: 'कर्मयोग',
    transliterationTitle: 'Karmayoga',
    englishTitle: 'The Yoga of Action',
    summary: 'Selfless action, duty without attachment, and the discipline of action aligned to dharma.',
  },
  {
    id: 'chapter-4',
    sectionId: 'gita',
    tradition: 'hindu',
    chapterNumber: 4,
    verseCount: 42,
    sanskritTitle: 'ज्ञानकर्मसंन्यासयोग',
    transliterationTitle: 'Jnanakarmasannyasayoga',
    englishTitle: 'The Yoga of Wisdom in Action',
    summary: 'Krishna explains divine descent, sacred knowledge, and how wisdom transforms action.',
  },
  {
    id: 'chapter-5',
    sectionId: 'gita',
    tradition: 'hindu',
    chapterNumber: 5,
    verseCount: 29,
    sanskritTitle: 'कर्मसंन्यासयोग',
    transliterationTitle: 'Karmasannyasayoga',
    englishTitle: 'The Yoga of Renunciation',
    summary: 'The inward renunciation of attachment while remaining active in the world.',
  },
  {
    id: 'chapter-6',
    sectionId: 'gita',
    tradition: 'hindu',
    chapterNumber: 6,
    verseCount: 47,
    sanskritTitle: 'आत्मसंयमयोग',
    transliterationTitle: 'Atmasamyamayoga',
    englishTitle: 'The Yoga of Meditation',
    summary: 'Discipline of mind, meditation, and the inner training needed for steadiness and realization.',
  },
  {
    id: 'chapter-7',
    sectionId: 'gita',
    tradition: 'hindu',
    chapterNumber: 7,
    verseCount: 30,
    sanskritTitle: 'ज्ञानविज्ञानयोग',
    transliterationTitle: 'Jnanavijnanayoga',
    englishTitle: 'The Yoga of Wisdom and Realization',
    summary: 'Knowledge of Krishna as the ground of the manifest and unmanifest universe.',
  },
  {
    id: 'chapter-8',
    sectionId: 'gita',
    tradition: 'hindu',
    chapterNumber: 8,
    verseCount: 28,
    sanskritTitle: 'अक्षरब्रह्मयोग',
    transliterationTitle: 'Aksharabrahmayoga',
    englishTitle: 'The Yoga of the Imperishable Brahman',
    summary: 'Questions of death, remembrance, the imperishable, and the path of ultimate departure.',
  },
  {
    id: 'chapter-9',
    sectionId: 'gita',
    tradition: 'hindu',
    chapterNumber: 9,
    verseCount: 34,
    sanskritTitle: 'राजविद्याराजगुह्ययोग',
    transliterationTitle: 'Rajavidyarajaguhyayoga',
    englishTitle: 'The Yoga of Royal Knowledge and Royal Secret',
    summary: 'The intimate heart of bhakti, where Krishna reveals loving devotion and divine immanence.',
  },
  {
    id: 'chapter-10',
    sectionId: 'gita',
    tradition: 'hindu',
    chapterNumber: 10,
    verseCount: 42,
    sanskritTitle: 'विभूतियोग',
    transliterationTitle: 'Vibhutiyoga',
    englishTitle: 'The Yoga of Divine Glories',
    summary: 'Krishna names his manifestations in the cosmos so the seeker can recognize the divine everywhere.',
  },
  {
    id: 'chapter-11',
    sectionId: 'gita',
    tradition: 'hindu',
    chapterNumber: 11,
    verseCount: 55,
    sanskritTitle: 'विश्वरूपदर्शनयोग',
    transliterationTitle: 'Vishvarupadarshanayoga',
    englishTitle: 'The Yoga of the Vision of the Cosmic Form',
    summary: 'Arjuna beholds Krishna’s universal form, the overwhelming vision of time, power, and totality.',
  },
  {
    id: 'chapter-12',
    sectionId: 'gita',
    tradition: 'hindu',
    chapterNumber: 12,
    verseCount: 20,
    sanskritTitle: 'भक्तियोग',
    transliterationTitle: 'Bhaktiyoga',
    englishTitle: 'The Yoga of Devotion',
    summary: 'A concise and beloved teaching on devotion, character, and the qualities of the dear devotee.',
  },
  {
    id: 'chapter-13',
    sectionId: 'gita',
    tradition: 'hindu',
    chapterNumber: 13,
    verseCount: 35,
    sanskritTitle: 'क्षेत्रक्षेत्रज्ञविभागयोग',
    transliterationTitle: 'Kshetrakshetrajnavibhagayoga',
    englishTitle: 'The Yoga of the Field and the Knower of the Field',
    summary: 'Distinguishing body, mind, and nature from the knower, and clarifying the metaphysics of experience.',
  },
  {
    id: 'chapter-14',
    sectionId: 'gita',
    tradition: 'hindu',
    chapterNumber: 14,
    verseCount: 27,
    sanskritTitle: 'गुणत्रयविभागयोग',
    transliterationTitle: 'Gunatrayavibhagayoga',
    englishTitle: 'The Yoga of the Division of the Three Gunas',
    summary: 'How sattva, rajas, and tamas shape life, bondage, and the path beyond conditioned nature.',
  },
  {
    id: 'chapter-15',
    sectionId: 'gita',
    tradition: 'hindu',
    chapterNumber: 15,
    verseCount: 20,
    sanskritTitle: 'पुरुषोत्तमयोग',
    transliterationTitle: 'Purushottamayoga',
    englishTitle: 'The Yoga of the Supreme Person',
    summary: 'The inverted tree of worldly existence and the teaching of the supreme purusha beyond decay.',
  },
  {
    id: 'chapter-16',
    sectionId: 'gita',
    tradition: 'hindu',
    chapterNumber: 16,
    verseCount: 24,
    sanskritTitle: 'दैवासुरसम्पद्विभागयोग',
    transliterationTitle: 'Daivasurasampadvibhagayoga',
    englishTitle: 'The Yoga of Divine and Demoniac Qualities',
    summary: 'A moral map of character that contrasts liberating qualities with destructive tendencies.',
  },
  {
    id: 'chapter-17',
    sectionId: 'gita',
    tradition: 'hindu',
    chapterNumber: 17,
    verseCount: 28,
    sanskritTitle: 'श्रद्धात्रयविभागयोग',
    transliterationTitle: 'Shraddhatrayavibhagayoga',
    englishTitle: 'The Yoga of the Threefold Faith',
    summary: 'Faith, food, austerity, and worship understood through the lens of the three gunas.',
  },
  {
    id: 'chapter-18',
    sectionId: 'gita',
    tradition: 'hindu',
    chapterNumber: 18,
    verseCount: 78,
    sanskritTitle: 'मोक्षसंन्यासयोग',
    transliterationTitle: 'Mokshasannyasayoga',
    englishTitle: 'The Yoga of Liberation and Renunciation',
    summary: 'The grand synthesis of action, devotion, knowledge, duty, surrender, and liberation.',
  },
];

export const GITA_READING_PLANS: CanonicalReadingPlan[] = [
  {
    id: 'gita-18-day-journey',
    sectionId: 'gita',
    title: '18-day chapter journey',
    subtitle: 'Read one chapter a day and move through the whole Gita in order.',
    cadence: 'Daily',
    chapters: Array.from({ length: 18 }, (_, index) => index + 1),
  },
  {
    id: 'gita-7-day-essentials',
    sectionId: 'gita',
    title: '7-day essentials',
    subtitle: 'A strong first pass through the most returned-to teachings on duty, meditation, devotion, and surrender.',
    cadence: '7 sessions',
    chapters: [2, 3, 6, 9, 12, 15, 18],
  },
  {
    id: 'gita-bhakti-path',
    sectionId: 'gita',
    title: 'Bhakti focus',
    subtitle: 'A devotional reading arc centered on loving remembrance, divine presence, and surrender.',
    cadence: '5 sessions',
    chapters: [7, 9, 10, 12, 18],
  },
];

export const RAMAYANA_KANDAS: CanonicalRamayanaKanda[] = [
  {
    id: 'kanda-1',
    sectionId: 'ramayana',
    tradition: 'hindu',
    kandaNumber: 1,
    cantoCount: 77,
    sanskritTitle: 'बालकाण्ड',
    transliterationTitle: 'Bala Kanda',
    englishTitle: 'The Book of Childhood',
    summary: 'Rama’s birth, youth, marriage to Sita, and the sacred beginnings of the dharmic story.',
  },
  {
    id: 'kanda-2',
    sectionId: 'ramayana',
    tradition: 'hindu',
    kandaNumber: 2,
    cantoCount: 119,
    sanskritTitle: 'अयोध्याकाण्ड',
    transliterationTitle: 'Ayodhya Kanda',
    englishTitle: 'The Book of Ayodhya',
    summary: 'Court intrigue, exile, filial duty, and the moral gravity of Rama leaving Ayodhya.',
  },
  {
    id: 'kanda-3',
    sectionId: 'ramayana',
    tradition: 'hindu',
    kandaNumber: 3,
    cantoCount: 75,
    sanskritTitle: 'अरण्यकाण्ड',
    transliterationTitle: 'Aranya Kanda',
    englishTitle: 'The Book of the Forest',
    summary: 'Forest life, the testing of endurance, the encounter with Surpanakha, and Sita’s abduction.',
  },
  {
    id: 'kanda-4',
    sectionId: 'ramayana',
    tradition: 'hindu',
    kandaNumber: 4,
    cantoCount: 67,
    sanskritTitle: 'किष्किन्धाकाण्ड',
    transliterationTitle: 'Kishkindha Kanda',
    englishTitle: 'The Book of Kishkindha',
    summary: 'Alliance, friendship, Sugriva’s restoration, and the gathering of strength for the search.',
  },
  {
    id: 'kanda-5',
    sectionId: 'ramayana',
    tradition: 'hindu',
    kandaNumber: 5,
    cantoCount: 68,
    sanskritTitle: 'सुन्दरकाण्ड',
    transliterationTitle: 'Sundara Kanda',
    englishTitle: 'The Book of Beauty',
    summary: 'Hanuman’s leap, the discovery of Sita, and one of the most beloved devotional arcs in the epic.',
  },
  {
    id: 'kanda-6',
    sectionId: 'ramayana',
    tradition: 'hindu',
    kandaNumber: 6,
    cantoCount: 128,
    sanskritTitle: 'युद्धकाण्ड',
    transliterationTitle: 'Yuddha Kanda',
    englishTitle: 'The Book of War',
    summary: 'The Lanka campaign, Ravana’s fall, reunion, and the culminating battle for justice.',
  },
  {
    id: 'kanda-7',
    sectionId: 'ramayana',
    tradition: 'hindu',
    kandaNumber: 7,
    cantoCount: 111,
    sanskritTitle: 'उत्तरकाण्ड',
    transliterationTitle: 'Uttara Kanda',
    englishTitle: 'The Book of Afterward',
    summary: 'Rama’s reign, the testing aftermath of kingship, and the later moral legacy of the epic.',
  },
];

export const RAMAYANA_READING_PLANS: CanonicalReadingPlan[] = [
  {
    id: 'ramayana-7-kanda-journey',
    sectionId: 'ramayana',
    title: '7-kanda journey',
    subtitle: 'Move through the whole Valmiki Ramayana one kanda at a time, in narrative order.',
    cadence: '7 sessions',
    chapters: [1, 2, 3, 4, 5, 6, 7],
  },
  {
    id: 'ramayana-rama-dharma-arc',
    sectionId: 'ramayana',
    title: 'Rama dharma arc',
    subtitle: 'Follow the moral shape of Rama through exile, testing, battle, and rule.',
    cadence: '5 sessions',
    chapters: [1, 2, 3, 6, 7],
  },
  {
    id: 'ramayana-hanuman-focus',
    sectionId: 'ramayana',
    title: 'Hanuman focus',
    subtitle: 'Begin with the alliance and move into the devotional force of Sundara Kanda.',
    cadence: '3 sessions',
    chapters: [4, 5, 6],
  },
];

function getOfficialGitaBaseParams(chapterNumber: number, verseNumber = 1) {
  return `field_chapter_value=${chapterNumber}&field_nsutra_value=${verseNumber}&language=dv&setgb=1`;
}

export function getOfficialGitaChapterUrl(chapterNumber: number, verseNumber = 1) {
  return `https://www.gitasupersite.iitk.ac.in/srimad?${getOfficialGitaBaseParams(chapterNumber, verseNumber)}`;
}

export function getOfficialGitaAudioUrl(chapterNumber: number, verseNumber = 1) {
  return `https://www.gitasupersite.iitk.ac.in/srimad?choose=1&${getOfficialGitaBaseParams(chapterNumber, verseNumber)}`;
}

export function getOfficialGitaVerseUrl(chapterNumber: number, verseNumber: number) {
  return getOfficialGitaChapterUrl(chapterNumber, verseNumber);
}

export function getOfficialRamayanaTextUrl() {
  return 'https://en.wikisource.org/wiki/File:Valmiki_-_Ramayana,_Griffith,_1895.djvu';
}

export function getOfficialRamayanaStudyUrl() {
  return 'https://www.valmikiramayan.net/';
}

export function getCanonicalChaptersForSection(sectionId: string) {
  if (sectionId === 'gita') return GITA_CHAPTERS;
  return [];
}

export function getCanonicalChapter(sectionId: string, chapterId: string) {
  return getCanonicalChaptersForSection(sectionId).find((chapter) => chapter.id === chapterId);
}

export function getRamayanaKandasForSection(sectionId: string) {
  if (sectionId === 'ramayana') return RAMAYANA_KANDAS;
  return [];
}

export function getRamayanaKanda(sectionId: string, kandaId: string) {
  return getRamayanaKandasForSection(sectionId).find((kanda) => kanda.id === kandaId);
}

export function getGitaChapterForEntry(entry: LibraryEntry) {
  if (entry.category !== 'gita') return null;

  const match = entry.id.match(/^gita-(\d+)-(\d+)/);
  if (!match) return null;

  const chapterNumber = Number(match[1]);
  return GITA_CHAPTERS.find((chapter) => chapter.chapterNumber === chapterNumber) ?? null;
}

export function getGitaEntriesForChapter(chapterNumber: number) {
  return GITA_ENTRIES
    .filter((entry) => entry.id.startsWith(`gita-${chapterNumber}-`))
    .sort((left, right) => {
      const leftCoverage = getGitaVerseCoverage(left);
      const rightCoverage = getGitaVerseCoverage(right);
      return (leftCoverage?.startVerse ?? 0) - (rightCoverage?.startVerse ?? 0);
    });
}

const RAMAYANA_KANDA_MATCHERS = [
  { number: 1, patterns: [/bal kanda/i, /bala kanda/i, /^ram-bal-/i] },
  { number: 2, patterns: [/ayodhya kanda/i, /^ram-ayodhya-/i] },
  { number: 3, patterns: [/aranya kanda/i, /^ram-aranya-/i] },
  { number: 4, patterns: [/kishkindha kanda/i, /^ram-kishkindha-/i] },
  { number: 5, patterns: [/sundara kanda/i, /^ram-sundara-/i] },
  { number: 6, patterns: [/yuddha kanda/i, /^ram-yuddha-/i] },
  { number: 7, patterns: [/uttara kanda/i, /^ram-uttara-/i] },
];

export function getRamayanaKandaForEntry(entry: LibraryEntry) {
  if (entry.category !== 'ramayana') return null;

  const matcher = RAMAYANA_KANDA_MATCHERS.find(({ patterns }) =>
    patterns.some((pattern) => pattern.test(entry.source) || pattern.test(entry.id))
  );

  if (!matcher) return null;
  return RAMAYANA_KANDAS.find((kanda) => kanda.kandaNumber === matcher.number) ?? null;
}

export function getRamayanaEntriesForKanda(kandaNumber: number) {
  const matcher = RAMAYANA_KANDA_MATCHERS.find((item) => item.number === kandaNumber);
  if (!matcher) return [];

  return RAMAYANA_ENTRIES.filter((entry) =>
    matcher.patterns.some((pattern) => pattern.test(entry.source) || pattern.test(entry.id))
  );
}

function getGitaVerseCoverage(entry: LibraryEntry) {
  if (entry.category !== 'gita') return null;

  const idMatch = entry.id.match(/^gita-(\d+)-(\d+)/);
  if (!idMatch) return null;

  const chapterNumber = Number(idMatch[1]);
  const startVerse = Number(idMatch[2]);
  const sourceMatch = entry.source.match(/Bhagavad Gita\s+(\d+)\.(\d+)(?:[–-](?:(\d+)\.)?(\d+))?/i);

  if (!sourceMatch) {
    return { chapterNumber, startVerse, endVerse: startVerse };
  }

  const endingChapter = sourceMatch[3] ? Number(sourceMatch[3]) : Number(sourceMatch[1]);
  if (endingChapter !== chapterNumber) {
    return { chapterNumber, startVerse, endVerse: startVerse };
  }

  return {
    chapterNumber,
    startVerse,
    endVerse: sourceMatch[4] ? Number(sourceMatch[4]) : startVerse,
  };
}

export function getCanonicalVerseLinksForChapter(chapterNumber: number): CanonicalVerseLink[] {
  const chapter = GITA_CHAPTERS.find((item) => item.chapterNumber === chapterNumber);
  if (!chapter) return [];

  const chapterEntries = getGitaEntriesForChapter(chapterNumber);

  return Array.from({ length: chapter.verseCount }, (_, index) => {
    const verseNumber = index + 1;
    const exactEntry = chapterEntries.find((entry) => {
      const coverage = getGitaVerseCoverage(entry);
      if (!coverage) return false;
      return coverage.startVerse === verseNumber && coverage.endVerse === verseNumber;
    });
    const localEntry = exactEntry ?? chapterEntries.find((entry) => {
      const coverage = getGitaVerseCoverage(entry);
      if (!coverage) return false;
      return verseNumber >= coverage.startVerse && verseNumber <= coverage.endVerse;
    });

    return {
      chapterNumber,
      verseNumber,
      officialUrl: getOfficialGitaVerseUrl(chapterNumber, verseNumber),
      officialAudioUrl: getOfficialGitaAudioUrl(chapterNumber, verseNumber),
      localEntry,
    };
  });
}

export function getCanonicalReadingPlansForSection(sectionId: string) {
  if (sectionId === 'gita') return GITA_READING_PLANS;
  return [];
}
