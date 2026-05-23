import { LibraryEntry } from '../library-content';

export const NAMOKAR_ENTRIES: LibraryEntry[] = [
  {
    id: 'namokar-full',
    title: 'Namokar Mantra - Full',
    source: 'Namokar Mantra - Full',
    original: 'णਮੋ ਅਰिहंताणੰ ॥ ਣਮੋ सिੱਧਾणੰ ॥ ਣਮੋ आਇਰियाणੰ ॥ ਣਮੋ उवज्झायाणੰ ॥ ਣਮੋ ਲੋਏ सव्वसाहूणੰ ॥\nਏਸੋ ਪੰਚਣਮੁੱਕਾਰੋ, ਸਵ੍ਵਪਾਵੱਪਣਾਸਣੋ ॥ ਮੰਗਲਾ ਣੰ ਚ ਸਵ੍ਵੇਸਿੰ, ਪਢਮੰ ਹਵਈ ਮੰਗਲੰ ॥',
    transliteration: 'Namo Arihantanam. Namo Siddhanam. Namo Ayariyanam. Namo Uvajjhayanam. Namo Loe Savvasahunam. Eso Panch Namokkaro, Savvapavappanasano. Mangalanam cha Savvesim, Padhamam Havai Mangalam.',
    meaning: 'I bow to the Arihantas. I bow to the Siddhas. I bow to the Acharyas. I bow to the Upadhyayas. I bow to all the Sadhus in the world. This five-fold bow destroys all sins and is the first and foremost of all auspicious mantras.',
    attribution: 'Jain Agamas',
    tags: ['navkar', 'namokar', 'mantra', 'prayer', 'arihantas'],
    category: 'jain_mantra',
    tradition: 'jain',
  },
  ...Array.from({ length: 5 }).map((_, i) => {
    const lines = [
      { t: 'Namo Arihantanam', m: 'I bow to the Arihantas', tag: 'arihantas' },
      { t: 'Namo Siddhanam', m: 'I bow to the Siddhas', tag: 'siddhas' },
      { t: 'Namo Ayariyanam', m: 'I bow to the Acharyas', tag: 'acharyas' },
      { t: 'Namo Uvajjhayanam', m: 'I bow to the Upadhyayas', tag: 'upadhyayas' },
      { t: 'Namo Loe Savvasahunam', m: 'I bow to all the Sadhus in the world', tag: 'sadhus' },
    ];
    return {
      id: `namokar-line-${i + 1}`,
      title: `Namokar Mantra - Line ${i + 1}`,
    source: `Namokar Mantra - Line ${i + 1}`,
      original: 'ਣਮੋ अਰिਹंताणੰ', // Placeholder for individual lines in Prakrit
      transliteration: lines[i].t,
      meaning: lines[i].m,
      attribution: 'Jain Agamas',
      tags: ['navkar', 'namokar', 'mantra', 'prayer', lines[i].tag],
      category: 'jain_mantra',
      tradition: 'jain',
    } as LibraryEntry;
  }),
  {
    id: 'namokar-titthayara',
    title: 'Tittha-yara Namo',
    source: 'Tittha-yara Namo',
    original: 'ਤਿੱਥਯਰ ਨਮੋ',
    transliteration: 'Tittha-yara Namo',
    meaning: 'Obeisance to the Tirthankaras',
    attribution: 'Jain Agamas',
    tags: ['navkar', 'namokar', 'prayer', 'tirthankara'],
    category: 'jain_mantra',
    tradition: 'jain',
  }
];
