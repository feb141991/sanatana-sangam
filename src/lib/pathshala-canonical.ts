import { GITA_ENTRIES, type LibraryEntry } from '@/lib/library-content';

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

function getOfficialGitaBaseParams(chapterNumber: number, verseNumber = 1) {
  return `field_chapter_value=${chapterNumber}&field_nsutra_value=${verseNumber}&language=dv&setgb=1`;
}

export function getOfficialGitaChapterUrl(chapterNumber: number, verseNumber = 1) {
  return `https://www.gitasupersite.iitk.ac.in/srimad?${getOfficialGitaBaseParams(chapterNumber, verseNumber)}`;
}

export function getOfficialGitaAudioUrl(chapterNumber: number, verseNumber = 1) {
  return `https://www.gitasupersite.iitk.ac.in/srimad?choose=1&${getOfficialGitaBaseParams(chapterNumber, verseNumber)}`;
}

export function getCanonicalChaptersForSection(sectionId: string) {
  if (sectionId === 'gita') return GITA_CHAPTERS;
  return [];
}

export function getCanonicalChapter(sectionId: string, chapterId: string) {
  return getCanonicalChaptersForSection(sectionId).find((chapter) => chapter.id === chapterId);
}

export function getGitaChapterForEntry(entry: LibraryEntry) {
  if (entry.category !== 'gita') return null;

  const match = entry.id.match(/^gita-(\d+)-(\d+)/);
  if (!match) return null;

  const chapterNumber = Number(match[1]);
  return GITA_CHAPTERS.find((chapter) => chapter.chapterNumber === chapterNumber) ?? null;
}

export function getGitaEntriesForChapter(chapterNumber: number) {
  return GITA_ENTRIES.filter((entry) => entry.id.startsWith(`gita-${chapterNumber}-`));
}
