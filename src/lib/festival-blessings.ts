/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Shoonaya — Festival Blessing Cards
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Each entry powers:
 *   1. The shareable /blessing/[slug] page
 *   2. WhatsApp / Twitter share copy from the landing page
 *   3. Push notification body (tradition-aware)
 *
 * Scripture lines are chosen for emotional resonance and shareability —
 * they should feel like a blessing, not a lecture.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export type Tradition = 'hindu' | 'sikh' | 'buddhist' | 'jain' | 'all';

export interface FestivalBlessing {
  slug:        string;
  name:        string;
  emoji:       string;
  date:        string;           // YYYY-MM-DD
  tradition:   Tradition;
  greeting:    string;           // e.g. "Shubh Diwali", "Waheguru Mehar Kare"
  // Scripture
  scriptLine:  string;           // Original script (Sanskrit / Gurmukhi / Pali / Prakrit)
  scriptLang:  'sanskrit' | 'gurmukhi' | 'pali' | 'prakrit' | 'hindi';
  translation: string;           // English translation
  source:      string;           // Text · chapter/verse
  // Visual
  accentColor: string;           // Primary hex
  bgGradient:  string;           // CSS gradient for card background
  textColor:   string;           // Foreground text
  // Share copy — feels like a devotional act
  shareTitle:  string;           // WhatsApp/Twitter message first line
  shareBody:   string;           // Second line — the scripture in brief
}

export const FESTIVAL_BLESSINGS: FestivalBlessing[] = [

  // ── HINDU ──────────────────────────────────────────────────────────────────

  {
    slug:        'maha-shivaratri',
    name:        'Maha Shivaratri',
    emoji:       '🕉️',
    date:        '2026-02-17',
    tradition:   'hindu',
    greeting:    'Shubh Maha Shivaratri',
    scriptLine:  'ॐ नमः शिवाय',
    scriptLang:  'sanskrit',
    translation: '"I bow to Shiva — the auspicious one who dwells in all."',
    source:      'Panchakshara Mantra · Shiva Purana',
    accentColor: '#5B7FA6',
    bgGradient:  'linear-gradient(145deg, #0e1820 0%, #1a2d3e 50%, #0e1820 100%)',
    textColor:   '#E8F4F8',
    shareTitle:  '🕉️ Shubh Maha Shivaratri',
    shareBody:   'ॐ नमः शिवाय — may Shiva\'s grace fill this sacred night.',
  },

  {
    slug:        'holi',
    name:        'Holi',
    emoji:       '🎨',
    date:        '2026-03-03',
    tradition:   'hindu',
    greeting:    'Shubh Holi',
    scriptLine:  'होली है! रंग डालो प्रेम से, गाओ आनंद से।',
    scriptLang:  'hindi',
    translation: '"It is Holi! Splash with love, sing with joy."',
    source:      'Traditional · Braj Bhumi folk verse',
    accentColor: '#D4784A',
    bgGradient:  'linear-gradient(145deg, #2a0a0a 0%, #3d1a0e 40%, #1a0820 100%)',
    textColor:   '#FAF0E8',
    shareTitle:  '🎨 Shubh Holi — बुरा न मानो, होली है!',
    shareBody:   'May this Holi fill your life with colour, joy and love.',
  },

  {
    slug:        'ram-navami',
    name:        'Ram Navami',
    emoji:       '🏹',
    date:        '2026-03-27',
    tradition:   'hindu',
    greeting:    'Shri Ram Navami Ki Shubhkamnayein',
    scriptLine:  'रामो विग्रहवान् धर्मः।',
    scriptLang:  'sanskrit',
    translation: '"Rama is dharma in human form."',
    source:      'Valmiki Ramayana · Aranya Kanda · 37.13',
    accentColor: '#C5A059',
    bgGradient:  'linear-gradient(145deg, #1a1000 0%, #2d2000 50%, #1a1000 100%)',
    textColor:   '#FAF6EF',
    shareTitle:  '🏹 Shri Ram Navami Ki Shubhkamnayein',
    shareBody:   'रामो विग्रहवान् धर्मः — Rama is dharma itself. Jai Shri Ram 🙏',
  },

  {
    slug:        'krishna-janmashtami',
    name:        'Krishna Janmashtami',
    emoji:       '🦚',
    date:        '2026-08-19',
    tradition:   'hindu',
    greeting:    'Shubh Janmashtami',
    scriptLine:  'यदा यदा हि धर्मस्य ग्लानिर्भवति भारत।\nतदात्मानं सृजाम्यहम्॥',
    scriptLang:  'sanskrit',
    translation: '"Whenever righteousness wanes, I manifest myself anew."',
    source:      'Bhagavad Gita · 4.7 · Sri Krishna to Arjuna',
    accentColor: '#1A7B82',
    bgGradient:  'linear-gradient(145deg, #020e10 0%, #071a1c 50%, #020e10 100%)',
    textColor:   '#E8FAF8',
    shareTitle:  '🦚 Shubh Janmashtami — Jai Shri Krishna!',
    shareBody:   'Celebrating the birth of the one who said: "I come again and again to restore dharma." 🕉️',
  },

  {
    slug:        'ganesh-chaturthi',
    name:        'Ganesh Chaturthi',
    emoji:       '🐘',
    date:        '2026-08-23',
    tradition:   'hindu',
    greeting:    'Ganpati Bappa Morya!',
    scriptLine:  'वक्रतुण्ड महाकाय सूर्यकोटि समप्रभ।\nनिर्विघ्नं कुरु मे देव सर्वकार्येषु सर्वदा॥',
    scriptLang:  'sanskrit',
    translation: '"O curved-trunk, mighty-bodied Lord, radiant as a million suns — make all my endeavours free of obstacles, always."',
    source:      'Vakratunda Mahakaya Shloka · Traditional invocation',
    accentColor: '#D88A1C',
    bgGradient:  'linear-gradient(145deg, #140a00 0%, #261400 50%, #140a00 100%)',
    textColor:   '#FFF3DC',
    shareTitle:  '🐘 Ganpati Bappa Morya!',
    shareBody:   'Wishing you a blessed Ganesh Chaturthi — may all obstacles be removed from your path.',
  },

  {
    slug:        'navratri',
    name:        'Navratri',
    emoji:       '🪔',
    date:        '2026-09-20',
    tradition:   'hindu',
    greeting:    'Shubh Navratri',
    scriptLine:  'सर्वमङ्गलमाङ्गल्ये शिवे सर्वार्थसाधिके।\nशरण्ये त्र्यम्बके गौरि नारायणि नमोऽस्तु ते॥',
    scriptLang:  'sanskrit',
    translation: '"O Devi, auspicious in all things, fulfiller of every purpose — O Gauri, O three-eyed one, I bow to you."',
    source:      'Devi Mahatmyam · 11.10 · Markandeya Purana',
    accentColor: '#C5605A',
    bgGradient:  'linear-gradient(145deg, #150404 0%, #2a0808 50%, #150404 100%)',
    textColor:   '#FFE8E8',
    shareTitle:  '🪔 Shubh Navratri — Jai Mata Di!',
    shareBody:   'Nine nights. Nine forms of Shakti. May the Divine Mother\'s grace be with you.',
  },

  {
    slug:        'diwali',
    name:        'Diwali',
    emoji:       '🎆',
    date:        '2026-10-29',
    tradition:   'all',
    greeting:    'Shubh Deepavali',
    scriptLine:  'तमसो मा ज्योतिर्गमय।',
    scriptLang:  'sanskrit',
    translation: '"Lead me from darkness into light."',
    source:      'Brihadaranyaka Upanishad · 1.3.28',
    accentColor: '#D4A020',
    bgGradient:  'linear-gradient(145deg, #0d0800 0%, #1e1400 40%, #0d0800 100%)',
    textColor:   '#FFF8DC',
    shareTitle:  '🎆 Shubh Deepavali — तमसो मा ज्योतिर्गमय',
    shareBody:   '"Lead me from darkness into light." — Wishing you a luminous Diwali 🪔',
  },

  {
    slug:        'gita-jayanti',
    name:        'Gita Jayanti',
    emoji:       '📖',
    date:        '2026-12-03',
    tradition:   'hindu',
    greeting:    'Shubh Gita Jayanti',
    scriptLine:  'कर्मण्येवाधिकारस्ते मा फलेषु कदाचन।',
    scriptLang:  'sanskrit',
    translation: '"Your right is to act alone — never to claim the fruits of action."',
    source:      'Bhagavad Gita · 2.47 · Sri Krishna to Arjuna',
    accentColor: '#C5A059',
    bgGradient:  'linear-gradient(145deg, #0a0800 0%, #1a1400 50%, #0a0800 100%)',
    textColor:   '#FAF6EF',
    shareTitle:  '📖 Shubh Gita Jayanti',
    shareBody:   'कर्मण्येवाधिकारस्ते — On the day the Gita was spoken, its greatest verse.',
  },

  // ── SIKH ───────────────────────────────────────────────────────────────────

  {
    slug:        'guru-gobind-singh-gurpurab',
    name:        'Guru Gobind Singh Gurpurab',
    emoji:       '☬',
    date:        '2026-01-05',
    tradition:   'sikh',
    greeting:    'Gurpurab Di Lakh Lakh Vadhaiyan',
    scriptLine:  'ਵਾਹਿਗੁਰੂ ਜੀ ਕਾ ਖਾਲਸਾ ਵਾਹਿਗੁਰੂ ਜੀ ਕੀ ਫਤਹਿ',
    scriptLang:  'gurmukhi',
    translation: '"The Khalsa belongs to Waheguru — Victory belongs to Waheguru."',
    source:      'Fateh Mantra · Guru Gobind Singh Ji · 1699',
    accentColor: '#1B5E8B',
    bgGradient:  'linear-gradient(145deg, #00080f 0%, #001525 50%, #00080f 100%)',
    textColor:   '#DCF0FF',
    shareTitle:  '☬ Gurpurab Di Lakh Lakh Vadhaiyan',
    shareBody:   'Celebrating the birth of Guru Gobind Singh Ji — the warrior-saint who gave us the Khalsa. Waheguru Ji Ki Fateh 🙏',
  },

  {
    slug:        'baisakhi',
    name:        'Baisakhi',
    emoji:       '🌾',
    date:        '2026-04-14',
    tradition:   'sikh',
    greeting:    'Baisakhi Di Lakh Lakh Vadhaiyan',
    scriptLine:  'ਸਗਲ ਦੁਆਰ ਕਉ ਛਾਡਿ ਕੈ ਗਹਿਓ ਤੁਹਾਰੋ ਦੁਆਰੁ।',
    scriptLang:  'gurmukhi',
    translation: '"Leaving all other doors, I have come to Yours, O Lord."',
    source:      'Guru Granth Sahib Ji · Ang 97 · Bhagat Kabir Ji',
    accentColor: '#F5A623',
    bgGradient:  'linear-gradient(145deg, #0f0800 0%, #1e1000 50%, #0f0800 100%)',
    textColor:   '#FFF8DC',
    shareTitle:  '🌾 Baisakhi Di Lakh Lakh Vadhaiyan!',
    shareBody:   'The harvest festival and the birthday of the Khalsa Panth — Sat Sri Akal! ☬',
  },

  {
    slug:        'guru-nanak-gurpurab',
    name:        'Guru Nanak Gurpurab',
    emoji:       '☬',
    date:        '2026-11-23',
    tradition:   'sikh',
    greeting:    'Guru Nanak Dev Ji De Prakash Utsav Di Lakh Lakh Vadhaiyan',
    scriptLine:  'ਨਾਨਕ ਨਾਮੁ ਚੜਦੀ ਕਲਾ ਤੇਰੇ ਭਾਣੇ ਸਰਬੱਤ ਦਾ ਭਲਾ।',
    scriptLang:  'gurmukhi',
    translation: '"Nanak, in the Name, in ascending grace — and by Your will, may all be blessed."',
    source:      'Ardas · Sikh daily prayer · Closing verse',
    accentColor: '#F5A623',
    bgGradient:  'linear-gradient(145deg, #0a0600 0%, #1a1000 50%, #0a0600 100%)',
    textColor:   '#FFF8DC',
    shareTitle:  '☬ Guru Nanak Gurpurab Di Lakh Lakh Vadhaiyan!',
    shareBody:   'ਸਰਬੱਤ ਦਾ ਭਲਾ — may all of humanity be blessed, on this most sacred day.',
  },

  {
    slug:        'bandhi-chhor-divas',
    name:        'Bandhi Chhor Divas',
    emoji:       '🕊️',
    date:        '2026-10-29',
    tradition:   'sikh',
    greeting:    'Bandhi Chhor Divas Di Vadhaiyan',
    scriptLine:  'ਮਿਤ੍ਰ ਪਿਆਰੇ ਨੂੰ ਹਾਲੁ ਮੁਰੀਦਾਂ ਦਾ ਕਹਣਾ॥',
    scriptLang:  'gurmukhi',
    translation: '"To my beloved friend, convey the state of your devoted ones."',
    source:      'Guru Granth Sahib Ji · Ang 963 · Guru Gobind Singh Ji',
    accentColor: '#1B5E8B',
    bgGradient:  'linear-gradient(145deg, #00050a 0%, #000f1a 50%, #00050a 100%)',
    textColor:   '#DCF0FF',
    shareTitle:  '🕊️ Bandhi Chhor Divas Di Vadhaiyan',
    shareBody:   'On this day, Guru Hargobind Ji walked free — and brought 52 kings with him. The Sikh Diwali.',
  },

  // ── BUDDHIST ───────────────────────────────────────────────────────────────

  {
    slug:        'vesak-buddha-purnima',
    name:        'Vesak / Buddha Purnima',
    emoji:       '🪷',
    date:        '2026-05-11',
    tradition:   'buddhist',
    greeting:    'Namo Buddhaya · Shubh Vesak',
    scriptLine:  'Sabbe sattā sukhitā hontu.',
    scriptLang:  'pali',
    translation: '"May all beings be happy. May all beings be free from suffering."',
    source:      'Metta Sutta · Sutta Nipata 1.8 · Pali Canon',
    accentColor: '#8B5E3C',
    bgGradient:  'linear-gradient(145deg, #0a0600 0%, #1a1000 40%, #0a0600 100%)',
    textColor:   '#FFF5E8',
    shareTitle:  '🪷 Namo Buddhaya — Shubh Vesak',
    shareBody:   'Sabbe sattā sukhitā hontu — May all beings be happy, on the Buddha\'s sacred day 🙏',
  },

  {
    slug:        'bodhi-day',
    name:        'Bodhi Day',
    emoji:       '🌳',
    date:        '2026-12-08',
    tradition:   'buddhist',
    greeting:    'Shubh Bodhi Day',
    scriptLine:  'Manopubbaṅgamā dhammā, manoseṭṭhā manomayā.',
    scriptLang:  'pali',
    translation: '"Mind is the forerunner of all actions — all things arise from mind, fashioned by mind."',
    source:      'Dhammapada · Verse 1 · Pali Canon',
    accentColor: '#4A8C6F',
    bgGradient:  'linear-gradient(145deg, #020a06 0%, #061408 50%, #020a06 100%)',
    textColor:   '#E8FFF4',
    shareTitle:  '🌳 Shubh Bodhi Day',
    shareBody:   'On this night in 528 BCE, under the Bodhi tree, a human being became fully awake. Mind is everything. 🙏',
  },

  {
    slug:        'parinirvana-day',
    name:        'Parinirvana Day',
    emoji:       '☸️',
    date:        '2026-02-15',
    tradition:   'buddhist',
    greeting:    'Shubh Nirvana Day',
    scriptLine:  'Vayadhammā saṅkhārā, appamādena sampādethā.',
    scriptLang:  'pali',
    translation: '"All conditioned things are impermanent — work out your salvation with diligence."',
    source:      'Mahaparinibbana Sutta · DN 16 · The Buddha\'s last words',
    accentColor: '#8B7355',
    bgGradient:  'linear-gradient(145deg, #080604 0%, #141008 50%, #080604 100%)',
    textColor:   '#F5EFE0',
    shareTitle:  '☸️ Parinirvana Day — reflecting on impermanence',
    shareBody:   '"Work out your salvation with diligence" — the Buddha\'s final teaching, remembered today.',
  },

  {
    slug:        'asalha-puja',
    name:        'Asalha Puja (Dharma Day)',
    emoji:       '☸️',
    date:        '2026-07-10',
    tradition:   'buddhist',
    greeting:    'Shubh Asalha Puja',
    scriptLine:  'Dhammaṃ saraṇaṃ gacchāmi.',
    scriptLang:  'pali',
    translation: '"I take refuge in the Dharma."',
    source:      'Tisarana · Triple Refuge · Pali Canon',
    accentColor: '#D4827A',
    bgGradient:  'linear-gradient(145deg, #0a0202 0%, #1a0808 50%, #0a0202 100%)',
    textColor:   '#FFE8E8',
    shareTitle:  '☸️ Shubh Asalha Puja — Dharma Day',
    shareBody:   'On this day, the Wheel of Dharma first turned. "I take refuge in the Dharma." 🙏',
  },

  // ── JAIN ───────────────────────────────────────────────────────────────────

  {
    slug:        'mahavir-jayanti',
    name:        'Mahavir Jayanti',
    emoji:       '🤲',
    date:        '2026-03-27',
    tradition:   'jain',
    greeting:    'Jai Jinendra · Mahavir Jayanti Ki Shubhkamnayein',
    scriptLine:  'अहिंसा परमो धर्मः।',
    scriptLang:  'sanskrit',
    translation: '"Non-violence is the highest dharma."',
    source:      'Acharanga Sutra · Jain Agama · Bhagwan Mahavira\'s teaching',
    accentColor: '#4A8C6F',
    bgGradient:  'linear-gradient(145deg, #020a06 0%, #061408 50%, #020a06 100%)',
    textColor:   '#E8FFF4',
    shareTitle:  '🤲 Jai Jinendra — Mahavir Jayanti',
    shareBody:   'अहिंसा परमो धर्मः — Non-violence is the highest dharma. Celebrating Bhagwan Mahavira\'s birth. 🙏',
  },

  {
    slug:        'paryushana',
    name:        'Paryushana Parva',
    emoji:       '🕊️',
    date:        '2026-08-28',
    tradition:   'jain',
    greeting:    'Paryushana Parva Ki Shubhkamnayein',
    scriptLine:  'परस्परोपग्रहो जीवानाम्।',
    scriptLang:  'sanskrit',
    translation: '"Souls render service to one another."',
    source:      'Tattvartha Sutra · 5.21 · Umasvati',
    accentColor: '#4A8C6F',
    bgGradient:  'linear-gradient(145deg, #020804 0%, #061204 50%, #020804 100%)',
    textColor:   '#E8FFF4',
    shareTitle:  '🕊️ Paryushana Parva — Days of forgiveness',
    shareBody:   'परस्परोपग्रहो जीवानाम् — Souls exist to serve one another. Michhami Dukkadam 🙏',
  },

  {
    slug:        'samvatsari',
    name:        'Samvatsari',
    emoji:       '🕊️',
    date:        '2026-09-04',
    tradition:   'jain',
    greeting:    'Michhami Dukkadam',
    scriptLine:  'खामेमि सव्वे जीवे, सव्वे जीवा खमंतु मे।',
    scriptLang:  'prakrit',
    translation: '"I forgive all beings, may all beings forgive me."',
    source:      'Iryavahiyam Sutra · Jain prayer of forgiveness',
    accentColor: '#6AB99A',
    bgGradient:  'linear-gradient(145deg, #020c08 0%, #061a0c 50%, #020c08 100%)',
    textColor:   '#DCFFF4',
    shareTitle:  '🕊️ Michhami Dukkadam — Samvatsari',
    shareBody:   '"I forgive all beings, may all beings forgive me." The most beautiful day in the Jain calendar 🙏',
  },

  {
    slug:        'akshaya-tritiya-jain',
    name:        'Akshaya Tritiya',
    emoji:       '💛',
    date:        '2026-04-21',
    tradition:   'jain',
    greeting:    'Akshaya Tritiya Ki Shubhkamnayein',
    scriptLine:  'इक्खाकू वंस तिलओ, जओ जहिं जाओ सयंभू।',
    scriptLang:  'prakrit',
    translation: '"Glory to Rishabhanatha — first Tirthankara, who taught the path of liberation."',
    source:      'Adipurana · Jinasena · Jain scripture',
    accentColor: '#D4A020',
    bgGradient:  'linear-gradient(145deg, #0a0800 0%, #1a1200 50%, #0a0800 100%)',
    textColor:   '#FFF8DC',
    shareTitle:  '💛 Akshaya Tritiya — Jai Jinendra',
    shareBody:   'The day Bhagwan Rishabhanatha broke his year-long fast. The most auspicious beginning.',
  },

  // ── ALL TRADITIONS ─────────────────────────────────────────────────────────

  {
    slug:        'guru-purnima',
    name:        'Guru Purnima',
    emoji:       '🙏',
    date:        '2026-07-10',
    tradition:   'all',
    greeting:    'Guru Purnima Ki Shubhkamnayein',
    scriptLine:  'गुरुर्ब्रह्मा गुरुर्विष्णुः गुरुर्देवो महेश्वरः।\nगुरुः साक्षात् परब्रह्म तस्मै श्री गुरवे नमः॥',
    scriptLang:  'sanskrit',
    translation: '"The Guru is Brahma, Vishnu, and Shiva — the Guru is the Supreme itself. To that Guru, I bow."',
    source:      'Guru Stotram · Traditional invocation across all dharmic traditions',
    accentColor: '#C5A059',
    bgGradient:  'linear-gradient(145deg, #080600 0%, #141000 50%, #080600 100%)',
    textColor:   '#FAF6EF',
    shareTitle:  '🙏 Guru Purnima — Jai Gurudev',
    shareBody:   'On this full moon, all four dharmic traditions bow to the teacher who lights the path.',
  },
];

/** Lookup by slug */
export function getBlessingBySlug(slug: string): FestivalBlessing | undefined {
  return FESTIVAL_BLESSINGS.find(b => b.slug === slug);
}

/** Get upcoming blessings — sorted by how soon they occur relative to today */
export function getUpcomingBlessings(limit = 6): FestivalBlessing[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return [...FESTIVAL_BLESSINGS]
    .map(b => ({ ...b, _d: new Date(b.date) }))
    .filter(b => b._d >= today)
    .sort((a, b) => a._d.getTime() - b._d.getTime())
    .slice(0, limit);
}

/** Get blessing for today if any festival matches */
export function getTodayBlessing(): FestivalBlessing | undefined {
  const today = new Date().toISOString().slice(0, 10);
  return FESTIVAL_BLESSINGS.find(b => b.date === today);
}

/** Get blessings by tradition */
export function getBlessingsByTradition(tradition: Tradition): FestivalBlessing[] {
  return FESTIVAL_BLESSINGS.filter(
    b => b.tradition === tradition || b.tradition === 'all'
  );
}
