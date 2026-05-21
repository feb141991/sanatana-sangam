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

// ── Additional named festivals ────────────────────────────────────────────────
const NAMED_VRAT_DATABASE: Record<string, VratData> = {

  'vat-savitri': {
    id: 'vat-savitri',
    emoji: '🌳',
    name: 'Vat Savitri Vrat',
    nameLocal: 'वट सावित्री व्रत',
    tagline: 'The vow of a devoted heart — where love overcomes even death.',
    taglineLocal: 'समर्पित हृदय की प्रतिज्ञा — जहाँ प्रेम मृत्यु को भी जीत लेता है।',
    significance: `Vat Savitri Vrat celebrates the legendary devotion of Savitri, who through her unwavering love and spiritual resolve brought her husband Satyavan back from the realm of Yama, the god of death.

Observed on the Amavasya of Jyeshtha month (some observe on Purnima), this vrat is performed by married Hindu women for the long life and well-being of their husbands. The banyan tree — sacred, immortal, and shelter of a thousand lives — stands as witness to this eternal vow.

The story of Savitri is not merely romantic legend. It is Dharma embodied: the courage to walk where mortals fear, the purity to question even Yama, and the wisdom to ask for boons that brought back life itself. Savitri's steadfast love is considered the highest form of pativrata — not subservience, but sovereign devotion.`,
    significanceLocal: `वट सावित्री व्रत सावित्री की महान भक्ति का उत्सव है, जिन्होंने अपने अटूट प्रेम और आध्यात्मिक संकल्प से अपने पति सत्यवान को यम के लोक से वापस लाया था।

ज्येष्ठ मास की अमावस्या को (कुछ पूर्णिमा को) मनाया जाने वाला यह व्रत विवाहित हिन्दू स्त्रियाँ अपने पति की दीर्घायु और सुख-समृद्धि के लिए करती हैं। वटवृक्ष — जो अमर, छायादार और हजारों जीवों का आश्रय है — इस अनंत प्रतिज्ञा का साक्षी बनता है।`,
    practice: `Wake before sunrise and bathe. Wear fresh or auspicious clothes — red or yellow are traditional.

Gather puja items at the base of a banyan (vat) tree: flowers, raw rice, incense, earthen lamp, red thread, and water in a kalash.

Offer water and flowers to the banyan tree. Tie red or yellow sacred thread around the trunk while walking around it in pradakshina (clockwise circumambulation) — traditionally 108 or 5 rounds while reciting the Savitri story.

Observe nirjala (waterless) or phalahar (fruit) fast from sunrise to moonrise.

Pray for your husband's long life and well-being. Listen to or recite the Savitri-Satyavan katha. Break the fast after offering water to the moon.`,
    practiceLocal: `सूर्योदय से पहले उठें और स्नान करें। शुभ वस्त्र पहनें — लाल या पीले रंग का परंपरागत महत्व है।

वट वृक्ष के पास पूजा सामग्री रखें: फूल, कच्चे चावल, अगरबत्ती, मिट्टी का दीपक, लाल धागा और कलश में जल।

वट वृक्ष को जल और फूल अर्पित करें। धागा बाँधते हुए 108 या 5 बार परिक्रमा करें और सावित्री कथा का पाठ करें।

निर्जला या फलाहार व्रत रखें। सावित्री-सत्यवान कथा सुनें या पढ़ें। चंद्र दर्शन के बाद व्रत खोलें।`,
    mantra: 'ॐ सावित्र्यै नमः। सत्यवते नमः। वटाय नमः।',
    mantraLocal: 'ॐ सावित्र्यै नमः। सत्यवते नमः। वटाय नमः।',
    fastingType: 'nirjala',
    breakFastTime: 'After moonrise / chandrodaya',
    dos: [
      'Wake before sunrise and bathe',
      'Perform puja at a banyan tree',
      'Circumambulate the vat tree 108 or 5 times',
      'Recite or listen to the Savitri-Satyavan katha',
      'Offer sindoor, turmeric, and red/yellow thread',
      'Pray for your husband\'s long life',
      'Donate food or cloth to the needy after the fast',
    ],
    donts: [
      'Do not eat grains or salt during the fast',
      'Do not sleep during the day',
      'Do not speak harshly or argue',
      'Do not cut hair, nails, or wear black/dark colours',
      'Avoid activities that create rajasic disturbance',
    ],
    pujaItems: [
      'Fresh flowers (marigold, roses)',
      'Raw rice (akshat)',
      'Red or yellow thread (mauli)',
      'Earthen or brass diya',
      'Incense sticks',
      'Sindoor and turmeric',
      'Water kalash',
      'Fruits (banana, mango)',
      'Betel leaves and betel nuts',
    ],
  },

  'navratri': {
    id: 'navratri',
    emoji: '🔱',
    name: 'Navratri',
    nameLocal: 'नवरात्रि',
    tagline: 'Nine nights of the Divine Mother — the cosmos trembles with her grace.',
    taglineLocal: 'नौ रातें दिव्य माँ की — उनकी कृपा से ब्रह्मांड कंपित होता है।',
    significance: `Navratri — the nine sacred nights — celebrates the victory of Shakti over darkness. Across India, nine forms of Devi Durga (the Navadurga) are worshipped: Shailputri, Brahmacharini, Chandraghanta, Kushmanda, Skandamata, Katyayani, Kalaratri, Mahagauri, and Siddhidatri.

This is not merely a festival — it is a cosmic recalibration. The nine nights mark transitional seasons when earth's energies are most potent for spiritual practice. What you plant in prayer during Navratri — intention, discipline, surrender — takes root at a deeper level.

The Devi Mahatmya (Durga Saptashati) describes how Devi annihilated Mahishasura, the buffalo demon of ego and delusion. The real battle is inner: Navratri is an invitation to let the Mother destroy what no longer serves.`,
    practice: `Begin with sankalpa (intention setting) on the first day. Light an akhand diya (continuously burning lamp) for all nine days if possible.

Fast according to your capacity — sattvic foods, fruits, or nirjala on key days. Recite or listen to the Durga Saptashati, Devi Stotras, or the names of the nine Durgas.

Visit a Devi temple, especially on Ashtami and Navami — the most sacred days. Perform kanya puja (worship of young girls as manifestations of Devi) on Ashtami or Navami.

Participate in Garba or Dandiya (a dance offering to the Divine Mother) if your tradition includes it. Conclude with Dussehra / Vijayadashami — the day Devi triumphed.`,
    mantra: 'ॐ दुं दुर्गायै नमः | या देवी सर्वभूतेषु शक्तिरूपेण संस्थिता',
    fastingType: 'sattvic',
    breakFastTime: 'After Navami puja on the 9th day',
    dos: ['Light an akhand diya for nine days', 'Recite Durga Saptashati or Devi names', 'Offer red flowers to Devi', 'Perform kanya puja on Ashtami or Navami', 'Wear traditional colours for each day'],
    donts: ['Avoid non-vegetarian food and alcohol', 'Do not cut hair or nails during the nine days', 'Avoid anger and negative speech', 'Do not extinguish the akhand diya'],
    pujaItems: ['Red flowers (hibiscus, roses)', 'Coconut and kalash', 'Sindoor', 'Red cloth/dupatta', 'Camphor and incense', 'Durga idol or image', 'Nine types of fruit'],
  },

  'diwali': {
    id: 'diwali',
    emoji: '🪔',
    name: 'Diwali',
    nameLocal: 'दीपावली',
    tagline: 'The festival of lights — darkness retreats where consciousness shines.',
    taglineLocal: 'दीपों का उत्सव — जहाँ चेतना जलती है, वहाँ अंधकार पीछे हट जाता है।',
    significance: `Diwali — Deepavali, the "row of lamps" — commemorates Lord Rama's triumphant return to Ayodhya after 14 years of exile and the defeat of Ravana. Every lamp lit is a prayer: may light overcome darkness, truth overcome falsehood, life overcome death.

For Vaishnavites, it is also the day Krishna annihilated the demon Narakasura. For Jains, it marks Mahavira's Nirvana. For Sikhs, it is Bandi Chhor Divas — the day Guru Hargobind ji was released from imprisonment, arriving in Amritsar on this night.

The outer celebration — lamps, sweets, fireworks — mirrors an inner aspiration: may I illuminate every dark corner of my own mind with the light of awareness.`,
    practice: `Clean and purify the home thoroughly before Diwali — this creates space for Lakshmi's arrival. Light diyas (earthen lamps) around your home and in the four directions.

On Lakshmi Puja (the main evening), bathe, wear fresh clothes, and arrange the puja thali. Invoke Lakshmi, Ganesha, and Saraswati. Offer lotus flowers, white sweets, incense, and gold or silver.

Light the lamps at dusk and keep them burning through the night. Share sweets with family and neighbours. Recite Lakshmi Stotra, Shri Sukta, or Mahalakshmi Ashtakam.`,
    mantra: 'ॐ श्रीं ह्रीं श्रीं कमले कमलालये प्रसीद प्रसीद श्रीं ह्रीं श्रीं महालक्ष्म्यै नमः',
    fastingType: 'none',
    dos: ['Clean and decorate the home', 'Light diyas and keep them burning overnight', 'Perform Lakshmi-Ganesha puja in the evening', 'Share sweets and gifts with neighbours', 'Wear new or fresh clothes'],
    donts: ['Do not sleep during Lakshmi Puja time', 'Avoid gambling excessively (a distortion of the tradition)', 'Do not leave the home in darkness', 'Avoid harsh speech and disputes on this day'],
    pujaItems: ['Earthen diyas and oil', 'Lotus flowers', 'Incense and camphor', 'Sweets (kheer, laddoo)', 'Coins and gold/silver', 'Lakshmi and Ganesha idols', 'Red cloth for altar'],
  },

  'janmashtami': {
    id: 'janmashtami',
    emoji: '🦚',
    name: 'Janmashtami',
    nameLocal: 'जन्माष्टमी',
    tagline: 'The night the universe held its breath — and Krishna was born.',
    taglineLocal: 'वह रात जब ब्रह्मांड ने सांस रोकी — और कृष्ण का जन्म हुआ।',
    significance: `Janmashtami celebrates the birth of Lord Krishna — the eighth avatar of Vishnu — who took form in Mathura's prison at midnight on the Ashtami of Krishna Paksha in Bhadrapada month.

Krishna's birth was not a coincidence. It was cosmic intervention: Kamsa's reign of darkness had grown unbearable, and the universe called for a force of love, wisdom, and dharma to restore balance. The Bhagavad Gita that emerged from Krishna's life remains the most direct map of the human soul ever given.

To observe Janmashtami is to welcome the inner Krishna — the one who plays the flute of the present moment, who dances on the serpent of ego, who says: "Give up all dharmas, take refuge in me alone, and I shall free you from all sins."`,
    practice: `Fast until midnight — the sacred birth hour. Chant Krishna's names throughout the day: Hare Krishna, Govinda, Gopala, Madhava.

At midnight, bathe the Krishna idol or image (abhisheka) with panchamrit (milk, curd, honey, ghee, sugar). Dress the idol, offer tulsi leaves, makhan (butter), and flute — symbols of Krishna's life.

Break your fast only after midnight puja is complete. Sing bhajans, kirtans, and the Hare Krishna mahamantra. Read from the Bhagavad Gita or Bhagavata Purana. Celebrate with joy — for Krishna's nature is ananda.`,
    mantra: 'हरे कृष्ण हरे कृष्ण कृष्ण कृष्ण हरे हरे | हरे राम हरे राम राम राम हरे हरे',
    mantraLocal: 'हरे कृष्ण हरे कृष्ण कृष्ण कृष्ण हरे हरे | हरे राम हरे राम राम राम हरे हरे',
    fastingType: 'nirjala',
    breakFastTime: 'After midnight puja (around 12:00–1:00 AM)',
    dos: ['Fast until midnight', 'Perform abhisheka (bathing) of the Krishna idol at midnight', 'Chant Hare Krishna mahamantra throughout', 'Sing bhajans and read Bhagavad Gita', 'Decorate with flowers, tulsi, and peacock feathers'],
    donts: ['Do not eat grains before midnight', 'Avoid tamasic food and intoxicants', 'Do not sleep before the midnight puja', "Avoid anger — Krishna's nature is compassion and joy"],
    pujaItems: ['Panchamrit (milk, curd, honey, ghee, sugar)', 'Tulsi leaves', 'Makhan (butter) and mishri', 'Yellow and blue flowers', 'Small flute', 'Peacock feather', 'Incense and diya'],
  },

  'holi': {
    id: 'holi',
    emoji: '🎨',
    name: 'Holi',
    nameLocal: 'होली',
    tagline: 'Colour the world as God colours the dawn — with abandon and joy.',
    significance: `Holi celebrates the triumph of devotion over tyranny. Prahlada, a young devotee of Vishnu, survived every attempt by his demon king father Hiranyakashipu to kill him — protected by divine grace. When Holika (Hiranyakashipu's sister, immune to fire) tried to burn Prahlada alive, she perished and he emerged unharmed. The bonfire of Holika Dahan the night before Holi commemorates this victory.

The next day, in an explosion of colour, Holi expresses what Prahlada embodied: that divine love transcends all divisions. On this one day, all social barriers dissolve — colour touches everyone equally, and the boundary between self and other blurs in laughter and play.

Holi is also associated with Radha and Krishna's love — the spring festival of colour was said to have been Krishna's own playful invention in Vrindavan.`,
    practice: `On the eve of Holi (Holika Dahan night): light a bonfire, circumambulate it three times, pray for the burning away of ego, hatred, and past hurts. Throw coconut, wheat stalks, and sacred wood into the fire.

On Holi day: play with natural colours (gulal made from flowers). Drink thandai (a traditional drink with milk and spices) — avoid substances that harm the body.

Sing songs of Krishna and Radha. Visit family and elders. Offer forgiveness to all and seek it from those you have wronged. The spirit of Holi is radical inclusion: let down every wall.`,
    mantra: 'ॐ नमो भगवते वासुदेवाय। राधे राधे गोविन्द गोपाल।',
    fastingType: 'none',
    dos: ['Play with natural, flower-based colours', 'Perform Holika Dahan puja the night before', 'Visit elders and seek blessings', 'Share sweets — gujiya, puran poli, thandai', 'Offer forgiveness and reconcile broken relationships'],
    donts: ['Avoid synthetic chemical colours that harm skin and eyes', 'Do not force colour on those who decline', 'Avoid excessive alcohol', 'Do not disrespect temples or places of worship during play'],
    pujaItems: ['Firewood for Holika Dahan', 'Coconut and wheat stalks', 'Gulal (natural colours)', 'Incense and flowers', 'Gujiya and sweets'],
  },

  'gurpurab': {
    id: 'gurpurab',
    emoji: '☬',
    name: 'Gurpurab',
    nameLocal: 'ਗੁਰਪੁਰਬ',
    tagline: 'The Guru\'s light never sets — it only changes form.',
    significance: `Gurpurab marks the birth anniversaries (and other sacred days) of the ten Sikh Gurus. The most celebrated is Guru Nanak Jayanti — the birthday of Guru Nanak Dev Ji, founder of Sikhism and one of the greatest spiritual teachers the world has known.

Guru Nanak's life was a continuous act of breaking walls: between Hindu and Muslim, between rich and poor, between the sacred and the mundane. His three core teachings — Naam Japna (meditate on the Name), Kirat Karni (earn through honest work), Vand Chhakna (share what you have) — are a complete dharma for life.

Gurpurab is not merely a birthday celebration. It is a remembrance of what one human life can accomplish when surrendered entirely to the divine Name.`,
    practice: `Gurpurab begins with Prabhat Pheri — the pre-dawn procession through the neighbourhood, singing hymns from the Guru Granth Sahib.

Visit the Gurdwara for kirtan (continuous singing of shabads). Listen to the akhand path (48-hour continuous reading of Guru Granth Sahib), or join for any portion. Participate in langar — the free community kitchen that embodies Guru Nanak's principle of equality.

At home: light a diya, recite Japji Sahib (especially at dawn), and sing or listen to gurbani. Reflect on the Guru's life and what one teaching you will carry forward. Serve — volunteering at langar is considered seva of the highest order.`,
    mantra: 'ਵਾਹਿਗੁਰੂ ਵਾਹਿਗੁਰੂ ਵਾਹਿਗੁਰੂ ਵਾਹਿਗੁਰੂ',
    mantraLocal: 'ਵਾਹਿਗੁਰੂ ਵਾਹਿਗੁਰੂ ਵਾਹਿਗੁਰੂ ਵਾਹਿਗੁਰੂ',
    fastingType: 'none',
    dos: ['Attend the Gurdwara and listen to kirtan', 'Participate in langar seva (volunteering)', 'Recite Japji Sahib at dawn', 'Join or support the Prabhat Pheri', 'Share food and gifts with neighbours'],
    donts: ['Avoid tobacco and alcohol', 'Do not enter the Gurdwara with shoes or head uncovered', 'Avoid tamasic activities — this is a day of satvik joy and service'],
    pujaItems: ['Kada prasad ingredients (wheat, ghee, sugar)', 'Fresh flowers for the Gurdwara', 'Donation for langar'],
  },

};

function resolveCanonicalVratKey(slug: string): string | null {
  const n = slug.toLowerCase().trim();

  // Exact or keyword matches against enriched named database
  if (n.includes('vat savitri') || n.includes('vat-savitri') || n.includes('savitri'))
    return 'vat-savitri';
  if (n.includes('navratri') || n.includes('navaratri'))
    return 'navratri';
  if (n.includes('diwali') || n.includes('deepavali') || n.includes('divali'))
    return 'diwali';
  if (n.includes('janmashtami') || n.includes('krishna jayanti') || n.includes('gokulashtami'))
    return 'janmashtami';
  if (n.includes('holi') || n.includes('holika'))
    return 'holi';
  if (n.includes('gurpurab') || n.includes('guru nanak') || n.includes('gurupurab'))
    return 'gurpurab';

  // Recurring tithis
  if (n.includes('ekadashi')) return 'ekadashi';
  if (n.includes('purnima') || n.includes('poornima')) return 'purnima';
  if (n.includes('amavasya') || n.includes('amavasai')) return 'amavasya';
  if (n.includes('pradosh') || n.includes('pradosham')) return 'pradosh';
  if (n.includes('chaturthi') || n.includes('sankashti')) return 'chaturthi';
  if (n.includes('shivaratri') || n.includes('shivratri')) return 'shivaratri';
  if (n.includes('puranmashi') || n.includes('sangrand')) return 'puranmashi';
  if (n.includes('uposatha')) return 'uposatha';

  return null;
}

export function resolveVratSlug(slug: string): string | null {
  return resolveCanonicalVratKey(slug);
}

export function getVratData(slug: string): VratData | null {
  const canonical = resolveCanonicalVratKey(slug);
  if (canonical) {
    if (canonical in NAMED_VRAT_DATABASE) return NAMED_VRAT_DATABASE[canonical as keyof typeof NAMED_VRAT_DATABASE];
    if (canonical in VRAT_DATABASE) return VRAT_DATABASE[canonical as keyof typeof VRAT_DATABASE];
  }

  // Generic fallback — remove "Today is" which is wrong when viewing ahead of the date
  return {
    id: slug.toLowerCase().replace(/\s+/g, '-'),
    emoji: '✨',
    name: slug.replace(/\b\w/g, c => c.toUpperCase()),
    tagline: 'A Sacred Observance',
    significance: `${slug.replace(/\b\w/g, c => c.toUpperCase())} is a sacred day in the dharmic calendar — a time for deepened spiritual focus, inner discipline, and alignment with the divine rhythms. Prepare your heart through prayer, fasting, and reflection.`,
    practice: 'Follow your tradition\'s specific guidelines for this observance. This usually involves fasting, increased japa, visiting a sacred space, and sharing with those in need.',
    mantra: 'Om Shanti Shanti Shanti',
  };
}
