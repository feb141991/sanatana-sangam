import type { TithiReminder, SpiritualPulse } from './panchang';

export type FastingType = 'nirjala' | 'phalahar' | 'sattvic' | 'ekbhukta' | 'partial' | 'none';

export interface VratData {
  id: string;
  emoji: string;
  name: string;
  nameLocal?: string;
  tagline: string;
  taglineLocal?: string;
  significance: string;
  significanceLocal?: string;
  practice: string;
  practiceLocal?: string;
  mantra: string;
  mantraLocal?: string;
  // ── Enriched fields ──────────────────────────────────────────────────────
  fastingType?: FastingType;
  breakFastTime?: string;      // e.g. "After moonrise" / "Next day sunrise"
  dos?: string[];
  donts?: string[];
  pujaItems?: string[];
  kathaId?: string;            // links to katha-library.ts katha ID
}

export const VRAT_DATABASE: Record<string, VratData> = {
  'ekadashi': {
    id: 'ekadashi',
    emoji: '🌿',
    name: 'Ekadashi',
    nameLocal: 'एकादशी',
    tagline: 'The Day of Spiritual Fasting and Devotion',
    taglineLocal: 'आध्यात्मिक उपवास और भक्ति का दिन',
    significance: 'Ekadashi occurs on the eleventh day of both the waxing (Shukla) and waning (Krishna) phases of the moon. It is highly auspicious for fasting and purifying the body and mind. Observing Ekadashi helps cleanse karma and deepens spiritual connection.',
    significanceLocal: 'एकादशी चंद्रमा के शुक्ल और कृष्ण दोनों पक्षों के ग्यारहवें दिन होती है। यह उपवास और शरीर तथा मन को शुद्ध करने के लिए अत्यधिक शुभ है। एकादशी का पालन करने से कर्मों की शुद्धि होती है और आध्यात्मिक जुड़ाव गहरा होता है।',
    practice: 'Avoid grains and beans. Observe a fast (either waterless, fruit-based, or light sattvic food). Increase chanting (Japa) and meditation. Give in charity if possible.',
    practiceLocal: 'अनाज और बीन्स से बचें। उपवास रखें (या तो निर्जला, फलाहारी, या हल्का सात्विक भोजन)। जप और ध्यान बढ़ाएं। संभव हो तो दान दें।',
    mantra: 'Om Namo Bhagavate Vasudevaya',
    mantraLocal: 'ॐ नमो भगवते वासुदेवाय',
    fastingType: 'nirjala',
    breakFastTime: 'Next day (Dwadashi) after sunrise within the parana window',
    dos: [
      'Wake before sunrise and take a bath before starting the fast',
      'Chant the name of Lord Vishnu throughout the day',
      'Read or listen to Vishnu Sahasranama or Ekadashi Katha',
      'Offer Tulsi leaves to Lord Vishnu — they are especially sacred today',
      'Keep a night vigil (jagaran) and spend the night in prayer or kirtan',
      'Donate food, clothing, or money to the needy on this day',
      'Break the fast (parana) on Dwadashi within the prescribed time window',
    ],
    donts: [
      'Do not eat grains (rice, wheat, dal, bread) or beans of any kind',
      'Do not consume onion, garlic, or non-vegetarian food',
      'Do not sleep during the daytime on Ekadashi',
      'Do not break the fast before the parana time on Dwadashi — breaking too early or too late invalidates the vrat',
      'Do not cut hair or nails on this day',
      'Do not speak harsh words or engage in gossip',
      'Do not touch or eat Tulsi leaves that have been plucked on Ekadashi itself',
    ],
    pujaItems: [
      'Tulsi leaves (essential — do not substitute)',
      'Yellow flowers (especially marigold)',
      'Panchamrit (milk, curd, ghee, honey, sugar)',
      'Incense sticks and camphor',
      'Sesame oil lamp or ghee lamp',
      'Yellow cloth for the deity',
      'Fruits (banana, coconut, mango)',
      'Chandan (sandalwood paste)',
    ],
    kathaId: 'katha-ekadashi-margashirsha-shukla',
  },
  'purnima': {
    id: 'purnima',
    emoji: '🌕',
    name: 'Purnima',
    nameLocal: 'पूर्णिमा',
    tagline: 'The Full Moon of Radiance and Fulfillment',
    taglineLocal: 'पूर्ण चंद्रमा की चमक और पूर्णता',
    significance: 'Purnima marks the full moon day. It represents fulfillment, abundance, and spiritual illumination. The moon\'s energy is at its peak, making it a powerful day for meditation, charity, and community prayers.',
    significanceLocal: 'पूर्णिमा पूर्ण चंद्रमा का दिन है। यह पूर्णता, प्रचुरता और आध्यात्मिक प्रकाश का प्रतीक है। चंद्रमा की ऊर्जा अपने चरम पर होती है, जिससे यह ध्यान, दान और सामूहिक प्रार्थनाओं के लिए एक शक्तिशाली दिन बन जाता है।',
    practice: 'Many observe a fast from sunrise to moonrise. Perform Satyanarayan Puja, offer water to the moon, and meditate on inner clarity.',
    practiceLocal: 'कई लोग सूर्योदय से चंद्रोदय तक उपवास रखते हैं। सत्यनारायण पूजा करें, चंद्रमा को अर्घ्य दें और आंतरिक स्पष्टता पर ध्यान करें।',
    mantra: 'Om Som Somaya Namah',
    mantraLocal: 'ॐ सों सोमाय नमः',
    fastingType: 'partial',
    breakFastTime: 'After moonrise — offer Arghya to the moon first',
    dos: [
      'Take a bath at sunrise and wear white or light-coloured clothes',
      'Perform Satyanarayan Puja in the evening with family',
      'Offer water (Arghya) to the full moon at moonrise',
      'Light a lamp before the Lord and meditate on inner clarity',
      'Share food and sweets with neighbours and the needy (Langar / Prasad)',
      'Recite Vishnu Sahasranama or Lalita Sahasranama',
    ],
    donts: [
      'Avoid non-vegetarian food and alcohol',
      'Avoid harsh speech and unnecessary conflict',
      'Do not begin the fast-breaking meal before offering Arghya to the moon',
    ],
    pujaItems: [
      'Akshat (unbroken rice with turmeric)',
      'Flowers — white jasmine, lotus',
      'Panchamrit',
      'Camphor and incense',
      'Fruits and milk sweets',
      'Copper vessel for moon Arghya',
    ],
    kathaId: 'katha-satyanarayan',
  },
  'amavasya': {
    id: 'amavasya',
    emoji: '🌑',
    name: 'Amavasya',
    nameLocal: 'अमावस्या',
    tagline: 'The New Moon of Stillness and Ancestral Gratitude',
    taglineLocal: 'स्थिरता और पैतृक कृतज्ञता की नई चाँदनी',
    significance: 'Amavasya is the new moon day, marking a time of deep stillness and introspection. It is particularly dedicated to honoring ancestors (Pitru) and seeking their blessings. The lack of moonlight symbolizes looking inward rather than outward.',
    significanceLocal: 'अमावस्या नए चंद्रमा का दिन है, जो गहरी स्थिरता और आत्मनिरीक्षण का समय है। यह विशेष रूप से पूर्वजों (पितृ) को सम्मानित करने और उनका आशीर्वाद लेने के लिए समर्पित है।',
    practice: 'Perform Tarpan (offerings to ancestors). Observe silence or deep meditation. Light a lamp to dispel inner darkness. Many avoid starting new worldly ventures on this day.',
    practiceLocal: 'तर्पण (पूर्वजों को प्रसाद) करें। मौन या गहरे ध्यान का पालन करें। आंतरिक अंधकार को दूर करने के लिए दीपक जलाएं।',
    mantra: 'Om Shanti Shanti Shanti',
    mantraLocal: 'ॐ शांति शांति शांति',
    fastingType: 'sattvic',
    breakFastTime: 'After completing Tarpan at the river / after midday',
    dos: [
      'Perform Pitru Tarpan at a river, pond, or dedicated Tarpan vessel',
      'Offer sesame seeds and water in the name of each ancestor (3 generations)',
      'Donate food, clothes, or money in memory of the departed',
      'Light a sesame oil lamp in the south-facing direction at dusk',
      'Observe silence or limit speech — a day of reflection and gratitude',
      'Feed Brahmins or the poor as proxy offering to ancestors',
    ],
    donts: [
      'Avoid non-vegetarian food and alcohol — considered inauspicious for Pitru',
      'Do not start any new auspicious venture (wedding, housewarming, etc.)',
      'Avoid cutting hair or nails',
      'Do not waste food on this day',
    ],
    pujaItems: [
      'Black sesame seeds (til)',
      'Kusha grass',
      'Holy water (Ganga jal or pure water)',
      'Copper plate and vessel for Tarpan',
      'Sesame oil lamp',
      'White flowers',
      'Barley (jau)',
    ],
    kathaId: 'katha-amavasya-tarpan',
  },
  'pradosh': {
    id: 'pradosh',
    emoji: '🕉️',
    name: 'Pradosh Vrat',
    nameLocal: 'प्रदोष व्रत',
    tagline: 'The Twilight Vow to Lord Shiva',
    taglineLocal: 'भगवान शिव के लिए गोधूलि का संकल्प',
    significance: 'Pradosh Vrat falls on the 13th day (Trayodashi) of both lunar fortnights. It is intensely sacred for worshipping Lord Shiva and Goddess Parvati. It is believed that during the twilight hours (Pradosh Kaal), Shiva performs his cosmic dance, dissolving negative karma.',
    significanceLocal: 'प्रदोष व्रत दोनों चंद्र पक्षों के 13वें दिन (त्रयोदशी) को पड़ता है। भगवान शिव और माता पार्वती की पूजा के लिए यह अत्यंत पवित्र है।',
    practice: 'Observe a fast during the day. As twilight approaches (sunset), perform Shiva Puja or Abhishekam. Chant the Maha Mrityunjaya Mantra or Shiva Panchakshari.',
    practiceLocal: 'दिन में उपवास रखें। गोधूलि (सूर्यास्त) के समय, शिव पूजा या अभिषेक करें। महामृत्युंजय मंत्र या शिव पंचाक्षरी का जाप करें।',
    mantra: 'Om Namah Shivaya',
    mantraLocal: 'ॐ नमः शिवाय',
    fastingType: 'ekbhukta',
    breakFastTime: 'During Pradosh Kaal (1.5 hours before and after sunset)',
    dos: [
      'Fast through the day, eating nothing until Pradosh Kaal',
      'Perform Shiva Abhishekam with milk, curd, honey, ghee, and rose water at twilight',
      'Offer Bilva leaves (bel patra) — most sacred to Shiva',
      'Chant Maha Mrityunjaya Mantra 108 times during twilight hour',
      'Light a ghee lamp and incense before the Shivalinga',
      'Recite Shiva Chalisa or Shiva Ashtakam during the evening puja',
    ],
    donts: [
      'Do not eat during the day before Pradosh Kaal',
      'Avoid onion, garlic, and non-vegetarian food entirely',
      'Do not break the fast before the twilight puja is complete',
      'Avoid speaking ill of anyone or engaging in dispute today',
    ],
    pujaItems: [
      'Bilva leaves (bel patra) — 3 or 5 leaves, stem removed',
      'Raw milk for Abhishekam',
      'Panchamrit (five nectars)',
      'Dhatura flower (if available — sacred to Shiva)',
      'White flowers',
      'Sandalwood paste (chandan)',
      'Camphor and incense',
      'Ghee lamp',
    ],
    kathaId: 'katha-pradosh-vrat',
  },
  'chaturthi': {
    id: 'chaturthi',
    emoji: '🐘',
    name: 'Sankashti Chaturthi',
    nameLocal: 'संकष्टी चतुर्थी',
    tagline: 'The Day of Overcoming Obstacles',
    taglineLocal: 'बाधाओं को दूर करने का दिन',
    significance: 'Falling on the 4th day of the waning moon (Krishna Paksha), Sankashti Chaturthi is dedicated to Lord Ganesha, the remover of obstacles. Observing this vrat brings peace, prosperity, and the clearing of life\'s hurdles.',
    significanceLocal: 'कृष्ण पक्ष के चौथे दिन पड़ने वाली संकष्टी चतुर्थी विघ्नहर्ता भगवान गणेश को समर्पित है। इस व्रत का पालन करने से शांति और समृद्धि आती है।',
    practice: 'Fast from morning until moonrise. Offer Durva grass and modaks to Lord Ganesha. Break the fast only after sighting the moon and offering Arghya.',
    practiceLocal: 'सुबह से चंद्रोदय तक उपवास रखें। भगवान गणेश को दूर्वा घास और मोदक चढ़ाएं। चंद्रमा के दर्शन और अर्घ्य देने के बाद ही उपवास खोलें।',
    mantra: 'Om Gam Ganapataye Namaha',
    mantraLocal: 'ॐ गं गणपतये नमः',
    fastingType: 'partial',
    breakFastTime: 'After moonrise — sight the moon and offer Arghya first',
    dos: [
      'Fast from sunrise until moonrise — no grains or beans',
      'Offer Durva grass (21 blades tied together) to Ganesha — most sacred offering',
      'Offer modak (coconut + jaggery sweet) as naivedya',
      'Recite Ganesha Atharvashirsha or Sankata Nashan Ganesha Stotra',
      'Light a lamp and apply red sindhoor to Ganesha\'s idol',
      'Break the fast only after sighting the moon and offering Arghya with rice',
    ],
    donts: [
      'Never look at the moon directly on Ganesh Chaturthi itself — there is a specific curse associated with this',
      'Do not offer Tulsi leaves to Ganesha — He does not accept them due to a divine disagreement',
      'Do not eat rice before sighting the moon',
      'Avoid non-vegetarian food and alcohol',
    ],
    pujaItems: [
      'Durva grass (most important)',
      'Modak (fresh — coconut and jaggery)',
      'Red flowers (hibiscus, rose)',
      'Red sindhoor / kumkum',
      'Panchamrit',
      'Coconut',
      'Camphor and incense',
      'Yellow cloth or thread for decoration',
    ],
    kathaId: 'katha-sankashti-chaturthi',
  },
  'shivaratri': {
    id: 'shivaratri',
    emoji: '🌙',
    name: 'Masik Shivaratri',
    nameLocal: 'मासिक शिवरात्रि',
    tagline: 'The Monthly Night of Shiva',
    taglineLocal: 'शिव की मासिक रात्रि',
    significance: 'Observed on the 14th day of the waning moon (Krishna Paksha) every month, Masik Shivaratri is a powerful night for awakening inner consciousness and seeking liberation through Lord Shiva\'s grace.',
    significanceLocal: 'हर महीने कृष्ण पक्ष के 14वें दिन मनाए जाने वाली मासिक शिवरात्रि आंतरिक चेतना को जगाने और भगवान शिव की कृपा से मुक्ति पाने की एक शक्तिशाली रात है।',
    practice: 'Observe a day-long fast. Perform night vigil (Jagaran) and Shiva Abhishekam at midnight. Contemplate on the formless nature of the Divine.',
    practiceLocal: 'दिन भर उपवास रखें। आधी रात को जागरण और शिव अभिषेक करें। परमात्मा के निराकार स्वरूप का चिंतन करें।',
    mantra: 'Om Tatpurushaya Vidmahe Mahadevaya Dhimahi',
    mantraLocal: 'ॐ तत्पुरुषाय विद्महे महादेवाय धीमहि',
    fastingType: 'nirjala',
    breakFastTime: 'Next morning after sunrise — the Chaturdashi night ends at dawn',
    dos: [
      'Observe a complete day-long fast (Nirjala is highest, water-only or fruit acceptable)',
      'Perform Shiva Abhishekam four times — at midnight and the three praharas of night',
      'Offer Bilva leaves, Dhatura, Aak flowers, and white sandalwood paste',
      'Keep complete Jagaran — stay awake through all four praharas of the night',
      'Chant Om Namah Shivaya or Maha Mrityunjaya Mantra continuously',
      'Visit a Shiva temple for the four-prahara puja if possible',
    ],
    donts: [
      'Do not sleep during the night of Shivaratri — Jagaran is essential',
      'Avoid all grains, non-vegetarian food, and alcohol',
      'Do not break the fast before sunrise on the following day',
      'Avoid Tulsi leaves for Shiva puja — He prefers Bilva',
    ],
    pujaItems: [
      'Bilva leaves (bel patra) — most important',
      'Raw milk (for Abhishekam)',
      'Panchamrit',
      'White flowers (dhatura, aak, white roses)',
      'Bhasma (sacred ash)',
      'Camphor for Aarti',
      'Hemp seeds / bhang (traditional offering)',
      'Chandan and kumkum',
    ],
    kathaId: 'katha-shivaratri',
  },
  'puranmashi': {
    id: 'puranmashi',
    emoji: '🌕',
    name: 'Puranmashi',
    nameLocal: 'ਪੂਰਨਮਾਸ਼ੀ',
    tagline: 'The Radiant Full Moon of Sangat',
    taglineLocal: 'ਸੰਗਤ ਦੀ ਚਮਕਦੀ ਪੂਰਨਮਾਸ਼ੀ',
    significance: 'Puranmashi marks the full moon. In the Sikh tradition, it is a spiritually uplifting day meant for gathering with the Sangat, singing Kirtan, and reflecting on the Guru\'s teachings.',
    significanceLocal: 'ਪੂਰਨਮਾਸ਼ੀ ਪੂਰੇ ਚੰਦ ਨੂੰ ਦਰਸਾਉਂਦੀ ਹੈ। ਸਿੱਖ ਪਰੰਪਰਾ ਵਿੱਚ, ਇਹ ਇੱਕ ਅਧਿਆਤਮਿਕ ਤੌਰ ਤੇ ਉਤਸ਼ਾਹਜਨਕ ਦਿਨ ਹੈ ਜੋ ਸੰਗਤ ਨਾਲ ਇਕੱਠੇ ਹੋਣ, ਕੀਰਤਨ ਗਾਉਣ ਅਤੇ ਗੁਰੂ ਦੀਆਂ ਸਿੱਖਿਆਵਾਂ \'ਤੇ ਵਿਚਾਰ ਕਰਨ ਲਈ ਹੈ।',
    practice: 'Attend the Gurudwara, participate in Langar, and immerse yourself in Gurbani Kirtan. Share the joy of community.',
    practiceLocal: 'ਗੁਰਦੁਆਰੇ ਜਾਓ, ਲੰਗਰ ਵਿੱਚ ਹਿੱਸਾ ਲਓ, ਅਤੇ ਗੁਰਬਾਣੀ ਕੀਰਤਨ ਵਿੱਚ ਆਪਣੇ ਆਪ ਨੂੰ ਲੀਨ ਕਰੋ।',
    mantra: 'Waheguru',
    mantraLocal: 'ਵਾਹਿਗੁਰੂ',
  },
  'uposatha': {
    id: 'uposatha',
    emoji: '☸️',
    name: 'Uposatha',
    nameLocal: 'उपोसथ',
    tagline: 'The Day of Observance and Renewal',
    taglineLocal: 'अवलोकन और नवीकरण का दिन',
    significance: 'Uposatha days occur on the new moon, full moon, and quarter moons. For Buddhists, it is a time to renew commitment to the Dhamma, cleanse the defiled mind, and practice intensive meditation.',
    significanceLocal: 'उपोसथ के दिन नए चंद्रमा, पूर्णिमा और चौथाई चंद्रमा पर होते हैं। बौद्धों के लिए, यह धम्म के प्रति प्रतिबद्धता को नवीनीकृत करने, मन को शुद्ध करने और गहन ध्यान का अभ्यास करने का समय है।',
    practice: 'Observe the Eight Precepts. Spend the day in meditation, listening to Dhamma talks, and maintaining mindful silence.',
    practiceLocal: 'आठ शील का पालन करें। अपना दिन ध्यान में, धम्म वार्ता सुनने और मौन बनाए रखने में बिताएं।',
    mantra: 'Namo Tassa Bhagavato Arahato Samma Sambuddhassa',
    mantraLocal: 'नमो तस्स भगवतो अरहतो सम्मा सम्बुद्धस्स',
  }
};

export function getVratData(slug: string): VratData | null {
  const normalizedSlug = slug.toLowerCase().trim().replace(/\\s+vrat$/i, '').replace(/\\s+today$/i, '');
  
  if (normalizedSlug.includes('ekadashi')) return VRAT_DATABASE['ekadashi'];
  if (normalizedSlug.includes('purnima')) return VRAT_DATABASE['purnima'];
  if (normalizedSlug.includes('amavasya')) return VRAT_DATABASE['amavasya'];
  if (normalizedSlug.includes('pradosh')) return VRAT_DATABASE['pradosh'];
  if (normalizedSlug.includes('chaturthi')) return VRAT_DATABASE['chaturthi'];
  if (normalizedSlug.includes('shivaratri')) return VRAT_DATABASE['shivaratri'];
  if (normalizedSlug.includes('puranmashi')) return VRAT_DATABASE['puranmashi'];
  if (normalizedSlug.includes('uposatha')) return VRAT_DATABASE['uposatha'];
  
  // Generic fallback if we don't have it explicitly
  return {
    id: slug.toLowerCase().replace(/\\s+/g, '-'),
    emoji: '✨',
    name: slug.replace(/\\b\\w/g, c => c.toUpperCase()),
    tagline: 'A Sacred Observance',
    significance: `Today is an auspicious day for the observance of ${slug}. It is a time for deepened spiritual focus, inner discipline, and alignment with the divine rhythms.`,
    practice: 'Follow your tradition\'s specific guidelines for this day. This usually involves fasting, increased japa, and visiting a sacred space.',
    mantra: 'Om Shanti Shanti Shanti',
  };
}
