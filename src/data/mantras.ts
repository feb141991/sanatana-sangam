export interface Mantra {
  id: string;
  tradition: 'hindu' | 'sikh' | 'jain' | 'buddhist' | 'all';
  deity?: string;
  nameEn: string;
  nameLocal: string;
  textSanskrit?: string;
  textTransliteration: string;
  textMeaning: string;
  tags: Array<'daily' | 'healing' | 'protection' | 'prosperity' | 'peace' | 'devotion'>;
  countPerMala: 108;
  isPremium: boolean;
}

export const MANTRAS: Mantra[] = [
  // ── Universal ──
  {
    id: 'om_pranava',
    tradition: 'all',
    nameEn: 'Om (Pranava)',
    nameLocal: 'ॐ',
    textSanskrit: 'ॐ',
    textTransliteration: 'Om',
    textMeaning: 'The primordial sound of the universe. It represents the supreme reality, consciousness, and the essence of all creation.',
    tags: ['daily', 'peace'],
    countPerMala: 108,
    isPremium: false,
  },

  // ── Hindu ──
  {
    id: 'gayatri_mantra',
    tradition: 'hindu',
    deity: 'Savitr / Mother Divine',
    nameEn: 'Gayatri Mantra',
    nameLocal: 'गायत्री मंत्र',
    textSanskrit: 'ॐ भूर्भुवः स्वः तत्सवितुर्वरेण्यं भर्गो देवस्य धीमहि धियो यो नः प्रचोदयात्',
    textTransliteration: 'Om bhur bhuva svaha, tat savitur varenyam, bhargo devasya dhimahi, dhiyo yo nah prachodayat',
    textMeaning: 'We meditate on the glory of the Creator; who has created the Universe; who is worthy of Worship; who is the embodiment of Knowledge and Light; who is the remover of Sin and Ignorance. May He open our hearts and enlighten our Intellect.',
    tags: ['daily', 'peace'],
    countPerMala: 108,
    isPremium: false,
  },
  {
    id: 'om_namah_shivaya',
    tradition: 'hindu',
    deity: 'Shiva',
    nameEn: 'Om Namah Shivaya',
    nameLocal: 'ॐ नमः शिवाय',
    textSanskrit: 'ॐ नमः शिवाय',
    textTransliteration: 'Om Namah Shivaya',
    textMeaning: 'I bow to Shiva, the supreme reality and the inner self. It is a powerful panchakshari (five-syllable) mantra of purification.',
    tags: ['daily', 'devotion', 'healing'],
    countPerMala: 108,
    isPremium: false,
  },
  {
    id: 'mahamrityunjaya',
    tradition: 'hindu',
    deity: 'Shiva',
    nameEn: 'Mahamrityunjaya',
    nameLocal: 'महामृत्युंजय मंत्र',
    textSanskrit: 'ॐ त्र्यम्बकं यजामहे सुगन्धिं पुष्टिवर्धनम्। उर्वारुकमिव बन्धनान्मृत्योर्मुक्षीय मामृतात्॥',
    textTransliteration: 'Om tryambakam yajamahe sugandhim pustivardhanam | urvarukamiva bandhanan mrityormuksiya mamritat ||',
    textMeaning: 'We worship the three-eyed One, who is fragrant and who nourishes all. Like the fruit falls off from the bondage of the stem, may we be liberated from death, from mortality.',
    tags: ['healing', 'protection'],
    countPerMala: 108,
    isPremium: true,
  },
  {
    id: 'hare_krishna',
    tradition: 'hindu',
    deity: 'Krishna / Rama',
    nameEn: 'Hare Krishna Maha Mantra',
    nameLocal: 'हरे कृष्ण महामंत्र',
    textSanskrit: 'हरे कृष्ण हरे कृष्ण कृष्ण कृष्ण हरे हरे। हरे राम हरे राम राम राम हरे हरे॥',
    textTransliteration: 'Hare Krishna Hare Krishna Krishna Krishna Hare Hare | Hare Rama Hare Rama Rama Rama Hare Hare ||',
    textMeaning: 'O Lord, O Energy of the Lord, please engage me in Your loving service. This mantra invokes a profound state of spiritual ecstasy and devotion.',
    tags: ['daily', 'devotion'],
    countPerMala: 108,
    isPremium: true,
  },
  {
    id: 'om_namo_bhagavate',
    tradition: 'hindu',
    deity: 'Vishnu / Krishna',
    nameEn: 'Om Namo Bhagavate Vasudevaya',
    nameLocal: 'ॐ नमो भगवते वासुदेवाय',
    textSanskrit: 'ॐ नमो भगवते वासुदेवाय',
    textTransliteration: 'Om Namo Bhagavate Vasudevaya',
    textMeaning: 'Prostration to the Supreme Lord Vasudeva. It is a mantra of spiritual liberation and devotion to the preserver of the universe.',
    tags: ['devotion', 'peace'],
    countPerMala: 108,
    isPremium: true,
  },
  {
    id: 'ganapataye_namaha',
    tradition: 'hindu',
    deity: 'Ganesha',
    nameEn: 'Om Gam Ganapataye Namaha',
    nameLocal: 'ॐ गं गणपतये नमः',
    textSanskrit: 'ॐ गं गणपतये नमः',
    textTransliteration: 'Om Gam Ganapataye Namaha',
    textMeaning: 'I bow to Lord Ganesha, the remover of obstacles. Chanted before beginning any new endeavor for success and auspiciousness.',
    tags: ['prosperity', 'protection'],
    countPerMala: 108,
    isPremium: true,
  },
  {
    id: 'maha_lakshmyai',
    tradition: 'hindu',
    deity: 'Lakshmi',
    nameEn: 'Om Shri Maha Lakshmyai Namaha',
    nameLocal: 'ॐ श्री महालक्ष्म्यै नमः',
    textSanskrit: 'ॐ श्री महालक्ष्म्यै नमः',
    textTransliteration: 'Om Shri Maha Lakshmyai Namaha',
    textMeaning: 'Salutations to the great Goddess Lakshmi. A powerful invocation for spiritual and material abundance, beauty, and prosperity.',
    tags: ['prosperity'],
    countPerMala: 108,
    isPremium: true,
  },

  // ── Sikh ──
  {
    id: 'waheguru',
    tradition: 'sikh',
    deity: 'Akal Purakh',
    nameEn: 'Waheguru (Gurmantar)',
    nameLocal: 'ਵਾਹਿਗੁਰੂ',
    textTransliteration: 'Waheguru',
    textMeaning: 'Wondrous Enlightener. It is the primary mantra of the Sikh tradition, clearing darkness and filling the mind with divine light.',
    tags: ['daily', 'devotion'],
    countPerMala: 108,
    isPremium: false,
  },
  {
    id: 'mool_mantar',
    tradition: 'sikh',
    deity: 'Akal Purakh',
    nameEn: 'Mool Mantar',
    nameLocal: 'ਮੂਲ ਮੰਤਰ',
    textTransliteration: 'Ik Onkar, Satnam, Karta Purakh, Nirbhau, Nirvair, Akal Moorat, Ajooni, Saibhang, Gur Parsad',
    textMeaning: 'One Universal Creator God. The Name Is Truth. Creative Being Personified. No Fear. No Hatred. Image Of The Undying, Beyond Birth, Self-Existent. By Guru\'s Grace.',
    tags: ['daily', 'protection'],
    countPerMala: 108,
    isPremium: false,
  },
  {
    id: 'ik_onkar',
    tradition: 'sikh',
    deity: 'Akal Purakh',
    nameEn: 'Ik Onkar',
    nameLocal: 'ੴ',
    textTransliteration: 'Ik Onkar',
    textMeaning: 'There is only one God. It emphasizes the fundamental unity and singularity of the divine.',
    tags: ['peace'],
    countPerMala: 108,
    isPremium: true,
  },

  // ── Jain ──
  {
    id: 'navkar',
    tradition: 'jain',
    deity: 'Panch Parameshti',
    nameEn: 'Navkar Mantra',
    nameLocal: 'णमोकार मंत्र',
    textSanskrit: 'णमो अरिहंताणं। णमो सिद्धाणं। णमो आयरियाणं। णमो उवज्झायाणं। णमो लोए सव्वसाहूणं।',
    textTransliteration: 'Namo Arihantanam, Namo Siddhanam, Namo Ayariyanam, Namo Uvajjhayanam, Namo Loe Savva-sahunam',
    textMeaning: 'I bow to the Arihants. I bow to the Siddhas. I bow to the Acharyas. I bow to the Upadhyayas. I bow to all the Sadhus and Sadhvis in the world.',
    tags: ['daily', 'devotion'],
    countPerMala: 108,
    isPremium: false,
  },
  {
    id: 'logassa',
    tradition: 'jain',
    deity: 'Tirthankaras',
    nameEn: 'Logassa',
    nameLocal: 'लोगस्स',
    textSanskrit: 'लोगस्स उज्जोअगरे, धम्म तित्थयरे जिणे। अरिहंते कित्तइस्सं, चउवीसं पि केवली॥',
    textTransliteration: 'Logassa ujjoagare, dhamma titthayare jine; Arihante kittayissam, chauveesam pi kevali',
    textMeaning: 'I glorify the twenty-four Tirthankaras who are the illuminators of the universe, founders of the religious order, conquerors of the inner enemies, and the omniscient ones.',
    tags: ['peace', 'protection'],
    countPerMala: 108,
    isPremium: true,
  },

  // ── Buddhist ──
  {
    id: 'om_mani_padme_hum',
    tradition: 'buddhist',
    deity: 'Avalokiteshvara',
    nameEn: 'Om Mani Padme Hum',
    nameLocal: 'ཨོཾ་མ་ཎི་པདྨེ་ཧཱུྃ',
    textSanskrit: 'ॐ मणिपद्मे हूँ',
    textTransliteration: 'Om Mani Padme Hum',
    textMeaning: 'The jewel is in the lotus. A profound mantra of compassion invoking the blessings of Avalokiteshvara.',
    tags: ['daily', 'peace', 'healing'],
    countPerMala: 108,
    isPremium: false,
  },
  {
    id: 'om_tare',
    tradition: 'buddhist',
    deity: 'Green Tara',
    nameEn: 'Om Tare Tuttare Ture Soha',
    nameLocal: 'ཨོཾ་ཏཱ་རེ་ཏུཏྟཱ་རེ་ཏུ་རེ་སྭཱ་ཧཱ',
    textSanskrit: 'ॐ तारे तुत्तारे तुरे स्वाहा',
    textTransliteration: 'Om Tare Tuttare Ture Soha',
    textMeaning: 'I prostrate to the Liberator, Mother of all the Victorious Ones. It invokes the swift protection and fearless compassion of Green Tara.',
    tags: ['protection', 'healing'],
    countPerMala: 108,
    isPremium: true,
  },
];

export function getMantrasForTradition(tradition: string): Mantra[] {
  if (tradition === 'all' || tradition === 'other') {
    return MANTRAS;
  }
  return MANTRAS.filter(m => m.tradition === tradition || m.tradition === 'all');
}
