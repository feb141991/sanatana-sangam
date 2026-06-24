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

  'nirjala-ekadashi': {
    id: 'nirjala-ekadashi',
    emoji: '🌿',
    name: 'Nirjala Ekadashi',
    nameLocal: 'निर्जला एकादशी',
    tagline: 'The waterless Ekadashi of complete surrender to Vishnu.',
    taglineLocal: 'विष्णु-भक्ति में पूर्ण समर्पण की निर्जला एकादशी।',
    significance: `Nirjala Ekadashi is observed on Jyeshtha Shukla Ekadashi and is one of the most austere Ekadashi vrats. It is traditionally associated with Bhima, who found regular fasting difficult and was advised to observe this single strict Ekadashi with deep devotion.

The word nirjala means "without water." Its ideal form is a complete fast from food and water, but the heart of the vrat is not harshness for its own sake. It is sankalpa, restraint, Vishnu-smriti, and humility. Those who are elderly, unwell, pregnant, nursing, travelling, or medically advised otherwise should follow a lighter form with family, guru, or doctor guidance.

This vrat is also called Bhimseni Ekadashi or Pandava Nirjala Ekadashi in many traditions. Shoonaya treats the named date separately from generic Ekadashi so the guidance can preserve its distinct austerity while still respecting capacity and sampradaya practice.`,
    significanceLocal: `निर्जला एकादशी ज्येष्ठ शुक्ल एकादशी को मनाई जाती है और एकादशी व्रतों में अत्यंत कठोर मानी जाती है। यह परंपरा भीमसेन से जुड़ी है, जिन्हें नियमित उपवास कठिन लगता था और जिन्हें एक विशेष कठोर एकादशी गहरी भक्ति से करने का मार्ग बताया गया।

"निर्जला" का अर्थ है जल के बिना। इसका आदर्श रूप अन्न और जल दोनों का त्याग है, पर व्रत का केन्द्र केवल कठोरता नहीं है। इसका केन्द्र है संकल्प, संयम, विष्णु-स्मरण और विनम्रता। वृद्ध, अस्वस्थ, गर्भवती, स्तनपान कराने वाली, यात्रा में रहने वाली या चिकित्सा-परामर्श वाले साधक अपनी क्षमता, परिवार, गुरु या डॉक्टर के मार्गदर्शन से हल्का रूप अपनाएँ।

कई परंपराओं में इसे भीमसेनी एकादशी या पांडव निर्जला एकादशी भी कहा जाता है। शून्य इस नामित तिथि को सामान्य एकादशी से अलग रखता है ताकि इसकी विशिष्ट तपस्या और संप्रदाय-भेद दोनों सुरक्षित रहें।`,
    practice: `Begin with a clear sankalpa at sunrise after bathing. Worship Lord Vishnu or Narayana with Tulsi, yellow flowers, diya, incense, and simple offerings. Chant "Om Namo Bhagavate Vasudevaya" or "Om Namo Narayanaya" through the day, and read or listen to Vishnu Sahasranama, Bhagavad Gita, or Ekadashi katha.

The traditional form is nirjala: no food and no water from sunrise on Ekadashi until the proper Dwadashi parana window. If full nirjala is not suitable, observe according to capacity: water-only, phalahar, or sattvic fasting is better than harming the body.

Break the fast on Dwadashi within the parana window after prayer. Offer water, food, or charity where possible, because this vrat is closely tied to compassion and self-control, not ego.`,
    practiceLocal: `स्नान के बाद सूर्योदय पर स्पष्ट संकल्प लें। भगवान विष्णु या नारायण की पूजा तुलसी, पीले फूल, दीपक, धूप और सरल नैवेद्य से करें। दिन भर "ॐ नमो भगवते वासुदेवाय" या "ॐ नमो नारायणाय" का जप करें, और विष्णु सहस्रनाम, भगवद्गीता या एकादशी कथा सुनें-पढ़ें।

परंपरागत रूप निर्जला है: एकादशी सूर्योदय से द्वादशी पारण-काल तक अन्न और जल दोनों का त्याग। यदि पूर्ण निर्जला आपके लिए उचित नहीं है, तो क्षमता के अनुसार जल, फलाहार या सात्त्विक उपवास करें। शरीर को हानि पहुँचाना व्रत का उद्देश्य नहीं है।

द्वादशी के पारण-काल में प्रार्थना के बाद व्रत खोलें। संभव हो तो जल, भोजन या दान दें, क्योंकि यह व्रत अहंकार नहीं, करुणा और आत्मसंयम से जुड़ा है।`,
    mantra: 'ॐ नमो भगवते वासुदेवाय। ॐ नमो नारायणाय।',
    mantraLocal: 'ॐ नमो भगवते वासुदेवाय। ॐ नमो नारायणाय।',
    fastingType: 'nirjala',
    breakFastTime: 'Next day on Dwadashi, within the local parana window',
    dos: [
      'Take a clear sankalpa after morning bath',
      'Worship Lord Vishnu with Tulsi, yellow flowers, diya, and incense',
      'Chant Vishnu nama through the day',
      'Read or listen to Vishnu Sahasranama, Bhagavad Gita, or Ekadashi katha',
      'Keep the fast according to health, capacity, and sampradaya guidance',
      'Offer charity, water, or food after completing the vrat',
      'Break the fast only during the Dwadashi parana window',
    ],
    donts: [
      'Do not attempt strict nirjala if it is medically unsafe',
      'Do not eat grains, beans, onion, garlic, or tamasic food',
      'Do not treat austerity as ego or competition',
      'Do not break the fast before the proper parana time if observing the full vrat',
      'Avoid harsh speech, anger, and gossip',
      'Avoid daytime sleep and unnecessary distraction where possible',
    ],
    pujaItems: [
      'Tulsi leaves',
      'Yellow flowers',
      'Vishnu or Narayana image',
      'Ghee lamp',
      'Incense and camphor',
      'Panchamrit for offering',
      'Fruits for post-parana charity or naivedya',
      'Water pot for charity or offering',
    ],
    kathaId: 'katha-ekadashi-margashirsha-shukla',
  },

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

  'vat-savitri-purnima': {
    id: 'vat-savitri-purnima',
    emoji: '🌳',
    name: 'Vat Savitri Purnima',
    nameLocal: 'वट सावित्री पूर्णिमा',
    tagline: 'A regional full-moon observance of Savitri’s vow, rooted in western and southern practice.',
    taglineLocal: 'सावित्री की प्रतिज्ञा का क्षेत्रीय पूर्णिमा-व्रत, जो पश्चिमी और दक्षिणी परंपराओं में जीवित है।',
    significance: `Vat Savitri Purnima is the Jyeshtha Purnima observance followed in Maharashtra, Gujarat, and parts of Karnataka. It honours the same Savitri-Satyavan katha, but follows the full-moon calendar practice rather than the North Indian Amavasya observance.

This is not a contradiction in Dharma. It is a legitimate regional calendar variation preserved by living sampradayas. The spiritual centre remains the same: steadfast devotion, protection of family life, and prayer for the long life and well-being of one's husband.`,
    significanceLocal: `वट सावित्री पूर्णिमा ज्येष्ठ पूर्णिमा पर मनाया जाने वाला वह क्षेत्रीय व्रत है जिसे महाराष्ट्र, गुजरात और कर्नाटक के कुछ भागों में माना जाता है। इसमें वही सावित्री-सत्यवान कथा पूजित होती है, पर पालन पूर्णिमा पर होता है, न कि उत्तर भारतीय अमावस्या पर।

यह धर्म में विरोध नहीं, बल्कि जीवित क्षेत्रीय परंपरा है। इसका आध्यात्मिक केन्द्र वही है: अटूट समर्पण, गृहस्थ जीवन की रक्षा, और पति की दीर्घायु व कल्याण की प्रार्थना।`,
    practice: `Wake before sunrise, bathe, and wear auspicious clothes. Worship the vat tree or a home altar with flowers, diya, akshat, turmeric, and thread. Listen to or recite the Savitri-Satyavan katha, offer water, and do pradakshina around the banyan tree.

Observe the fast according to family practice — many keep phalahar or a day-long vrat until the evening puja is complete. Offer charity and complete the vrat with prayer for long marital well-being and inner strength.`,
    practiceLocal: `सूर्योदय से पहले उठें, स्नान करें और शुभ वस्त्र धारण करें। वट वृक्ष या गृह-वेदी की पूजा फूल, दीपक, अक्षत, हल्दी और धागे से करें। सावित्री-सत्यवान कथा सुनें या पढ़ें, जल अर्पित करें और वट-वृक्ष की परिक्रमा करें।

परिवार की परंपरा के अनुसार व्रत रखें — कई लोग फलाहार या संध्या-पूजा तक व्रत करते हैं। दान दें और पति के कल्याण तथा आंतरिक धैर्य की प्रार्थना के साथ व्रत पूर्ण करें।`,
    mantra: 'ॐ सावित्र्यै नमः। वटवृक्षाय नमः। सत्यवते नमः।',
    mantraLocal: 'ॐ सावित्र्यै नमः। वटवृक्षाय नमः। सत्यवते नमः।',
    fastingType: 'partial',
    breakFastTime: 'After evening puja, according to family tradition',
    dos: [
      'Follow the Purnima observance if that is your family or regional tradition',
      'Offer water, flowers, and sacred thread to the vat tree',
      'Recite the Savitri-Satyavan katha',
      'Do pradakshina around the banyan tree',
      'Give charity after the puja',
    ],
    donts: [
      'Do not treat the Purnima observance as incorrect just because another region follows Amavasya',
      'Avoid harsh speech and unnecessary conflict on the vrat day',
      'Avoid tamasic food and intoxicants',
    ],
    pujaItems: [
      'Fresh flowers',
      'Akshat (raw rice)',
      'Turmeric and kumkum',
      'Sacred thread (mauli)',
      'Diya and incense',
      'Water kalash',
      'Fruits and sweets for naivedya',
    ],
  },

  'hartalika-teej': {
    id: 'hartalika-teej',
    emoji: '🌿',
    name: 'Hartalika Teej',
    nameLocal: 'हरतालिका तीज',
    tagline: 'The vow of Parvati’s resolve — austerity offered for sacred companionship.',
    taglineLocal: 'पार्वती के संकल्प का व्रत — पवित्र दांपत्य के लिए तपस्वी अर्पण।',
    significance: `Hartalika Teej commemorates Goddess Parvati's intense tapas to attain Lord Shiva as her husband. It is observed on Bhadrapada Shukla Tritiya, especially in North India and Nepal, by women praying for marital harmony, steadfast companionship, and spiritual strength.

The vrat is not merely about worldly marriage. It honours Parvati's uncompromising resolve, self-mastery, and devotion — the inner strength required to choose Dharma consciously.`,
    significanceLocal: `हरतालिका तीज भाद्रपद शुक्ल तृतीया को मनाया जाने वाला वह व्रत है जो माता पार्वती के उस कठोर तप की स्मृति है जिससे उन्होंने भगवान शिव को पति रूप में प्राप्त किया। यह उत्तर भारत और नेपाल में विशेष रूप से मनाया जाता है।

यह व्रत केवल सांसारिक दांपत्य के लिए नहीं है। यह पार्वती के संकल्प, आत्मसंयम और धर्मपूर्ण चयन की स्मृति है।`,
    practice: `Observe a fast according to your tradition — many keep nirjala or strict phalahar. Worship Shiva and Parvati together with flowers, bel leaves, fruits, and clay or metal murti forms. Listen to the Hartalika Teej katha and pray for a stable, dharmic, and compassionate household life.

Evening puja, songs, and mehendi are traditional in many regions. The vrat is completed with prayer, seva, and, where customary, moon sighting or the next morning break-fast.`,
    practiceLocal: `अपनी परंपरा के अनुसार व्रत रखें — कई स्त्रियाँ निर्जला या कठोर फलाहार रखती हैं। शिव-पार्वती की संयुक्त पूजा फूल, बेलपत्र, फल और प्रतिमा के साथ करें। हरतालिका तीज कथा सुनें और धर्ममय, करुणामय गृहस्थ जीवन की प्रार्थना करें।

अनेक क्षेत्रों में संध्या-पूजा, गीत और मेहंदी की परंपरा है। व्रत प्रार्थना, सेवा और, जहाँ प्रचलन हो, चंद्र-दर्शन या अगले दिन पारण के साथ पूर्ण होता है।`,
    mantra: 'ॐ पार्वत्यै नमः। ॐ नमः शिवाय।',
    mantraLocal: 'ॐ पार्वत्यै नमः। ॐ नमः शिवाय।',
    fastingType: 'nirjala',
    breakFastTime: 'After the vrat completion according to local tradition, often next morning',
    dos: [
      'Worship Shiva and Parvati together',
      'Recite or hear the Hartalika Teej katha',
      'Keep the fast according to family tradition',
      'Pray for a dharmic and compassionate marriage',
      'Offer seva or charity after the vrat',
    ],
    donts: [
      'Do not mock or flatten regional custom into a single fixed pattern',
      'Avoid tamasic food and intoxicants',
      'Avoid anger and argument on the vrat day',
    ],
    pujaItems: [
      'Flowers and fruits',
      'Bel leaves',
      'Mehendi',
      'Diya and incense',
      'Clay or metal murti of Shiva-Parvati',
      'Kumkum and turmeric',
    ],
  },

  'karva-chauth': {
    id: 'karva-chauth',
    emoji: '🌙',
    name: 'Karva Chauth',
    nameLocal: 'करवा चौथ',
    tagline: 'A moon-bound fast of devotion, restraint, and prayer for household well-being.',
    taglineLocal: 'चंद्र-दर्शन से पूर्ण होने वाला संयम, समर्पण और गृहस्थ-कल्याण का व्रत।',
    significance: `Karva Chauth is observed on Kartik Krishna Chaturthi, especially in North India, by married women praying for the long life and well-being of their husbands. The fast culminates with moonrise, when the moon is offered arghya and the vrat is completed.

Its emotional language is familiar, but the deeper current is discipline, sankalpa, and the sacred guarding of household bonds. It is a vow of restraint linked to prayer, not spectacle.`,
    significanceLocal: `करवा चौथ कार्तिक कृष्ण चतुर्थी को विशेष रूप से उत्तर भारत में रखा जाने वाला व्रत है। विवाहित स्त्रियाँ अपने पति की दीर्घायु और कल्याण के लिए यह उपवास रखती हैं। चंद्र-दर्शन और अर्घ्य के बाद व्रत पूर्ण होता है।

इसका गहरा अर्थ अनुशासन, संकल्प और गृहस्थ-बंधन की रक्षा में है। यह केवल उत्सव नहीं, प्रार्थना से जुड़ा संयम का व्रत है।`,
    practice: `Begin with sargi or the customary pre-dawn meal if your family observes it. Keep the fast through the day, often nirjala, while maintaining prayerful awareness. In the evening, gather for puja with the karva, diya, sieve, and offerings.

At moonrise, offer arghya to the moon, see the moon through the sieve if that is your custom, and then complete the vrat. The form varies by region and family, but the prayerful centre remains the same.`,
    practiceLocal: `यदि परिवार में प्रथा हो तो प्रातःकाल सर्गी ग्रहण करें। दिन भर उपवास रखें, कई घरों में निर्जला व्रत होता है। संध्या में करवा, दीपक, छलनी और पूजन-सामग्री के साथ पूजा करें।

चंद्र-दर्शन के समय चंद्रमा को अर्घ्य दें, और यदि परिवार में प्रचलन हो तो छलनी से चंद्र-दर्शन करें। फिर व्रत पूर्ण करें। रूप-भेद हो सकते हैं, पर प्रार्थना का केन्द्र एक ही है।`,
    mantra: 'ॐ सोमाय नमः। ॐ नमः शिवाय।',
    mantraLocal: 'ॐ सोमाय नमः। ॐ नमः शिवाय।',
    fastingType: 'nirjala',
    breakFastTime: 'After moonrise and arghya',
    dos: [
      'Follow your family’s Karva Chauth puja sequence',
      'Offer arghya to the moon before breaking the fast',
      'Keep the day prayerful and restrained',
      'Use the vrat to cultivate gratitude rather than social comparison',
    ],
    donts: [
      'Do not break the fast before moonrise if your tradition requires moonrise completion',
      'Avoid reducing the vrat to appearance or performance',
      'Avoid anger, gossip, and unnecessary strain during the fast',
    ],
    pujaItems: [
      'Karva (ritual pot)',
      'Diya',
      'Sieve (where customary)',
      'Kumkum and rice',
      'Water for moon arghya',
      'Sweets and fruits',
    ],
  },

  'vaikunta-ekadashi': {
    id: 'vaikunta-ekadashi',
    emoji: '🏵️',
    name: 'Vaikunta Ekadashi',
    nameLocal: 'वैकुण्ठ एकादशी',
    tagline: 'The Ekadashi of the open gate — Vishnu devotion intensified by temple tradition.',
    taglineLocal: 'वह एकादशी जब वैकुण्ठ-द्वार प्रतीकात्मक रूप से खुलते हैं — विष्णु-भक्ति का उत्कर्ष।',
    significance: `Vaikunta Ekadashi is one of the most revered Vishnu observances, especially in Sri Vaishnava and South Indian temple traditions. It carries the theology of the Vaikunta Dwaram — the opening of the Lord's gate to the sincere devotee.

Different calendar traditions can place its observance slightly differently relative to Mokshada Ekadashi or Dhanurmasa practice. The devotional heart, however, remains unambiguous: vrata, nama, darshan, and surrender to Narayana.`,
    significanceLocal: `वैकुण्ठ एकादशी विष्णु-भक्ति की अत्यंत पूज्य एकादशी है, विशेषकर श्रीवैष्णव और दक्षिण भारतीय मंदिर-परंपराओं में। इसमें वैकुण्ठ-द्वार के खुलने की प्रतीकात्मक भावना जुड़ी है।

कुछ परंपराओं में इसकी तिथि-गणना में हल्का अंतर हो सकता है, पर भक्ति का केन्द्र स्पष्ट है — व्रत, नाम, दर्शन और नारायण में शरण।`,
    practice: `Observe an Ekadashi fast according to your sampradaya. Increase Vishnu nama-japa, read the Gita or Vishnu Sahasranama, and, if possible, attend temple darshan, especially where Vaikunta Dwaram processions are held.

This observance is best treated as a named Vishnu festival, not merely a generic fast day. Temple tradition and sampradaya guidance should lead the exact practice.`,
    practiceLocal: `अपनी संप्रदाय-परंपरा के अनुसार एकादशी-व्रत रखें। विष्णु-नाम जप बढ़ाएँ, गीता या विष्णु सहस्रनाम का पाठ करें, और जहाँ संभव हो, मंदिर-दर्शन करें — विशेषकर जहाँ वैकुण्ठ-द्वार की परंपरा होती है।

इसे केवल सामान्य उपवास-दिवस नहीं, बल्कि नामित विष्णु-उत्सव की तरह मानें। सटीक विधि में मंदिर-परंपरा और संप्रदाय का मार्गदर्शन प्रधान होना चाहिए।`,
    mantra: 'ॐ नमो नारायणाय।',
    mantraLocal: 'ॐ नमो नारायणाय।',
    fastingType: 'nirjala',
    breakFastTime: 'Ekadashi parana on the following Dwadashi, per sampradaya',
    dos: [
      'Follow Ekadashi discipline and parana timing carefully',
      'Increase Vishnu nama-japa and stotra recitation',
      'Attend temple darshan if possible',
      'Follow sampradaya guidance where dates vary slightly',
    ],
    donts: [
      'Do not flatten the observance into “just another Ekadashi” when temple tradition gives it a distinct place',
      'Avoid grains and tamasic food',
      'Do not break the fast outside the Dwadashi parana window',
    ],
    pujaItems: [
      'Tulsi leaves',
      'Yellow flowers',
      'Vishnu image or saligrama',
      'Ghee lamp',
      'Panchamrit',
      'Fruits for naivedya',
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
    significanceLocal: `नवरात्रि — नौ पवित्र रातें — शक्ति की अंधकार पर विजय का उत्सव है। भारत भर में देवी दुर्गा के नौ स्वरूपों (नवदुर्गा) की पूजा होती है: शैलपुत्री, ब्रह्मचारिणी, चंद्रघंटा, कुष्मांडा, स्कंदमाता, कात्यायनी, कालरात्रि, महागौरी और सिद्धिदात्री।

यह केवल एक उत्सव नहीं — यह एक ब्रह्मांडीय पुनर्संतुलन है। ये नौ रातें वे संक्रांति-काल हैं जब धरती की ऊर्जाएँ आध्यात्मिक साधना के लिए सर्वाधिक सक्रिय होती हैं। नवरात्रि में जो संकल्प, अनुशासन और समर्पण बोया जाता है, वह गहरी जड़ें पकड़ता है।

देवी महात्म्य (दुर्गा सप्तशती) बताती है कि देवी ने महिषासुर — अहंकार और भ्रम के रूपक — का वध कैसे किया। वास्तविक युद्ध भीतर है: नवरात्रि माँ को आमंत्रित करने का अवसर है — वह जो अनावश्यक को भस्म करती है।`,
    practice: `Begin with sankalpa (intention setting) on the first day. Light an akhand diya (continuously burning lamp) for all nine days if possible.

Fast according to your capacity — sattvic foods, fruits, or nirjala on key days. Recite or listen to the Durga Saptashati, Devi Stotras, or the names of the nine Durgas.

Visit a Devi temple, especially on Ashtami and Navami — the most sacred days. Perform kanya puja (worship of young girls as manifestations of Devi) on Ashtami or Navami.

Participate in Garba or Dandiya (a dance offering to the Divine Mother) if your tradition includes it. Conclude with Dussehra / Vijayadashami — the day Devi triumphed.`,
    practiceLocal: `पहले दिन संकल्प (मनोकामना की घोषणा) से आरंभ करें। यदि संभव हो तो नौ दिनों के लिए अखंड दीपक जलाएं।

अपनी क्षमता के अनुसार उपवास रखें — सात्विक भोजन, फल-फूल, या प्रमुख दिनों पर निर्जला। दुर्गा सप्तशती, देवी स्तोत्र, या नवदुर्गा के नामों का जाप करें।

अष्टमी और नवमी — सबसे पवित्र दिनों — पर विशेष रूप से देवी मंदिर जाएँ। अष्टमी या नवमी पर कन्या पूजन करें।

यदि परंपरा हो तो गरबा या डांडिया में भाग लें। दशमी (विजयादशमी/दशहरा) पर — देवी की विजय के दिन — उत्सव का समापन करें।`,
    mantra: 'ॐ दुं दुर्गायै नमः | या देवी सर्वभूतेषु शक्तिरूपेण संस्थिता',
    mantraLocal: 'ॐ दुं दुर्गायै नमः | या देवी सर्वभूतेषु शक्तिरूपेण संस्थिता',
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
    significanceLocal: `दीपावली — "दीपों की पंक्ति" — भगवान राम के 14 वर्षों के वनवास के बाद अयोध्या लौटने और रावण के वध की स्मृति में मनाई जाती है। प्रत्येक प्रज्वलित दीप एक प्रार्थना है: प्रकाश अंधकार को जीते, सत्य असत्य को, जीवन मृत्यु को।

वैष्णवों के लिए यह वह दिन है जब कृष्ण ने नरकासुर का वध किया। जैनों के लिए यह महावीर निर्वाण की वेला है। सिखों के लिए यह बंदी छोड़ दिवस है — जब गुरु हरगोबिंद जी बंदीगृह से मुक्त हुए।

बाहरी उत्सव — दीप, मिठाइयाँ, आतिशबाजी — एक आंतरिक आकांक्षा का प्रतिबिंब है: मेरे मन का हर अंधकोण चेतना के प्रकाश से आलोकित हो जाए।`,
    practice: `Clean and purify the home thoroughly before Diwali — this creates space for Lakshmi's arrival. Light diyas (earthen lamps) around your home and in the four directions.

On Lakshmi Puja (the main evening), bathe, wear fresh clothes, and arrange the puja thali. Invoke Lakshmi, Ganesha, and Saraswati. Offer lotus flowers, white sweets, incense, and gold or silver.

Light the lamps at dusk and keep them burning through the night. Share sweets with family and neighbours. Recite Lakshmi Stotra, Shri Sukta, or Mahalakshmi Ashtakam.`,
    practiceLocal: `दीपावली से पहले घर की पूरी तरह सफाई और शुद्धि करें — यह लक्ष्मीजी के आगमन के लिए स्थान बनाता है। घर के चारों दिशाओं में मिट्टी के दीये जलाएँ।

लक्ष्मी पूजन (मुख्य संध्या) पर स्नान करें, नवीन वस्त्र धारण करें और पूजा की थाली सजाएँ। लक्ष्मी, गणेश और सरस्वती का आह्वान करें। कमल, सफेद मिठाइयाँ, अगरबत्ती और सोना-चाँदी अर्पण करें।

सूर्यास्त के बाद दीप जलाएँ और उन्हें रात भर जलते रहने दें। परिवार और पड़ोसियों में मिठाइयाँ बाँटें। लक्ष्मी स्तोत्र, श्री सूक्त, या महालक्ष्मी अष्टकम का पाठ करें।`,
    mantra: 'ॐ श्रीं ह्रीं श्रीं कमले कमलालये प्रसीद प्रसीद श्रीं ह्रीं श्रीं महालक्ष्म्यै नमः',
    mantraLocal: 'ॐ श्रीं ह्रीं श्रीं कमले कमलालये प्रसीद प्रसीद श्रीं ह्रीं श्रीं महालक्ष्म्यै नमः',
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
    significanceLocal: `जन्माष्टमी भगवान कृष्ण के जन्म का उत्सव है — विष्णु के आठवें अवतार, जो भाद्रपद कृष्ण अष्टमी की मध्यरात्रि को मथुरा के कारागार में प्रकट हुए।

कृष्ण का जन्म संयोग नहीं था — यह एक दैवीय हस्तक्षेप था। कंस के अत्याचार से जगत त्रस्त था, और ब्रह्मांड ने प्रेम, ज्ञान और धर्म की एक शक्ति को पुकारा। कृष्ण के जीवन से उद्भूत भगवद्गीता आज भी मानव आत्मा का सबसे सीधा नक्शा है।

जन्माष्टमी मनाना आंतरिक कृष्ण का स्वागत है — वे जो वर्तमान क्षण की बाँसुरी बजाते हैं, अहंकार-सर्प पर नृत्य करते हैं, और कहते हैं: "सब धर्म छोड़ो, केवल मेरी शरण आओ — मैं तुम्हें सब पापों से मुक्त करूंगा।"`,
    practice: `Fast until midnight — the sacred birth hour. Chant Krishna's names throughout the day: Hare Krishna, Govinda, Gopala, Madhava.

At midnight, bathe the Krishna idol or image (abhisheka) with panchamrit (milk, curd, honey, ghee, sugar). Dress the idol, offer tulsi leaves, makhan (butter), and flute — symbols of Krishna's life.

Break your fast only after midnight puja is complete. Sing bhajans, kirtans, and the Hare Krishna mahamantra. Read from the Bhagavad Gita or Bhagavata Purana. Celebrate with joy — for Krishna's nature is ananda.`,
    practiceLocal: `मध्यरात्रि — पवित्र जन्म-वेला — तक उपवास रखें। दिन भर कृष्ण के नाम जपें: हरे कृष्ण, गोविंद, गोपाल, माधव।

मध्यरात्रि को कृष्ण की मूर्ति का पंचामृत (दूध, दही, शहद, घी, शक्कर) से अभिषेक करें। मूर्ति को सजाएँ, तुलसी पत्र, माखन और बाँसुरी अर्पण करें — कृष्ण के जीवन के प्रतीक।

मध्यरात्रि पूजन के बाद ही व्रत खोलें। भजन, कीर्तन और हरे कृष्ण महामंत्र गाएँ। भगवद्गीता या भागवत पुराण का पाठ करें। आनंद के साथ उत्सव मनाएँ — क्योंकि कृष्ण का स्वभाव ही आनंद है।`,
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
    taglineLocal: 'रंगों से जगत को रंगो जैसे ईश्वर भोर को — उमंग और आनंद के साथ।',
    significance: `Holi celebrates the triumph of devotion over tyranny. Prahlada, a young devotee of Vishnu, survived every attempt by his demon king father Hiranyakashipu to kill him — protected by divine grace. When Holika (Hiranyakashipu's sister, immune to fire) tried to burn Prahlada alive, she perished and he emerged unharmed. The bonfire of Holika Dahan the night before Holi commemorates this victory.

The next day, in an explosion of colour, Holi expresses what Prahlada embodied: that divine love transcends all divisions. On this one day, all social barriers dissolve — colour touches everyone equally, and the boundary between self and other blurs in laughter and play.

Holi is also associated with Radha and Krishna's love — the spring festival of colour was said to have been Krishna's own playful invention in Vrindavan.`,
    practice: `On the eve of Holi (Holika Dahan night): light a bonfire, circumambulate it three times, pray for the burning away of ego, hatred, and past hurts. Throw coconut, wheat stalks, and sacred wood into the fire.

On Holi day: play with natural colours (gulal made from flowers). Drink thandai (a traditional drink with milk and spices) — avoid substances that harm the body.

Sing songs of Krishna and Radha. Visit family and elders. Offer forgiveness to all and seek it from those you have wronged. The spirit of Holi is radical inclusion: let down every wall.`,
    significanceLocal: `होली भक्ति की अत्याचार पर विजय का उत्सव है। प्रह्लाद — विष्णु के बालभक्त — अपने दैत्य-राज पिता हिरण्यकश्यपु के हर प्रयास से बचे, दैवी कृपा से सुरक्षित। जब होलिका (हिरण्यकश्यपु की बहन, जिसे अग्नि जला नहीं सकती थी) ने प्रह्लाद को जीवित जलाने का प्रयास किया, तो वह स्वयं नष्ट हो गई और प्रह्लाद अक्षत निकले। होलिका दहन की अग्नि इसी विजय की स्मृति है।

अगले दिन रंगों के उत्सव में होली वही प्रकट करती है जो प्रह्लाद ने जिया: दिव्य प्रेम सभी भेदों को पार कर जाता है। इस एक दिन सभी सामाजिक दीवारें गिर जाती हैं — रंग सबको समान रूप से रंगता है, और हँसी-खेल में स्व और पर का भेद मिट जाता है।

होली राधा और कृष्ण के प्रेम से भी जुड़ी है — वसंत का यह रंग-उत्सव स्वयं कृष्ण की वृंदावन में की गई लीला माना जाता है।`,
    practiceLocal: `होलिका दहन की रात: होलिका जलाएँ, तीन बार परिक्रमा करें, अहंकार, द्वेष और पुरानी पीड़ाओं के भस्म होने की प्रार्थना करें। अग्नि में नारियल, गेहूँ की बालियाँ और पवित्र लकड़ी अर्पित करें।

होली के दिन: फूलों से बने प्राकृतिक रंग (गुलाल) से खेलें। ठंडाई (दूध और मसालों का पारंपरिक पेय) पिएं — शरीर को हानि पहुँचाने वाले पदार्थों से बचें।

कृष्ण और राधा के भजन गाएं। परिवार और बड़ों से मिलें। सबको क्षमा करें और जिनसे भूल हुई हो उनसे क्षमा माँगें। होली की भावना है पूर्ण समावेश — हर दीवार को गिरा दो।`,
    mantra: 'ॐ नमो भगवते वासुदेवाय। राधे राधे गोविन्द गोपाल।',
    mantraLocal: 'ॐ नमो भगवते वासुदेवाय। राधे राधे गोविन्द गोपाल।',
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
    significanceLocal: `ਗੁਰਪੁਰਬ ਦਸ ਸਿੱਖ ਗੁਰੂਆਂ ਦੇ ਜਨਮ-ਦਿਹਾੜੇ ਅਤੇ ਹੋਰ ਪਵਿੱਤਰ ਦਿਨਾਂ ਦੀ ਯਾਦਗਾਰ ਹੈ। ਸਭ ਤੋਂ ਵੱਡਾ ਗੁਰਪੁਰਬ ਗੁਰੂ ਨਾਨਕ ਜਯੰਤੀ ਹੈ — ਸਿੱਖ ਧਰਮ ਦੇ ਬਾਨੀ ਗੁਰੂ ਨਾਨਕ ਦੇਵ ਜੀ ਦਾ ਪ੍ਰਕਾਸ਼ ਦਿਹਾੜਾ।

ਗੁਰੂ ਨਾਨਕ ਜੀ ਦਾ ਜੀਵਨ ਹਰ ਦੀਵਾਰ ਢਾਉਣ ਦਾ ਅਮਲ ਸੀ: ਹਿੰਦੂ ਅਤੇ ਮੁਸਲਮਾਨ ਵਿਚਕਾਰ, ਅਮੀਰ ਅਤੇ ਗ਼ਰੀਬ ਵਿਚਕਾਰ, ਧਾਰਮਿਕ ਅਤੇ ਸੰਸਾਰਕ ਵਿਚਕਾਰ। ਉਨ੍ਹਾਂ ਦੀਆਂ ਤਿੰਨ ਮੂਲ ਸਿੱਖਿਆਵਾਂ — ਨਾਮ ਜਪਣਾ, ਕਿਰਤ ਕਰਨੀ, ਵੰਡ ਛਕਣਾ — ਜੀਵਨ ਲਈ ਪੂਰਨ ਧਰਮ ਹਨ।

ਗੁਰਪੁਰਬ ਕੇਵਲ ਜਨਮਦਿਨ ਦਾ ਜਸ਼ਨ ਨਹੀਂ। ਇਹ ਉਸ ਦੀ ਯਾਦ ਹੈ ਜੋ ਇੱਕ ਇਨਸਾਨੀ ਜ਼ਿੰਦਗੀ ਉਦੋਂ ਕਰ ਸਕਦੀ ਹੈ ਜਦੋਂ ਉਹ ਪੂਰੀ ਤਰ੍ਹਾਂ ਪਰਮਾਤਮਾ ਦੇ ਨਾਮ ਨੂੰ ਸਮਰਪਿਤ ਹੋ ਜਾਂਦੀ ਹੈ।`,
    practiceLocal: `ਗੁਰਪੁਰਬ ਪ੍ਰਭਾਤ ਫੇਰੀ ਨਾਲ ਸ਼ੁਰੂ ਹੁੰਦਾ ਹੈ — ਸਵੇਰੇ ਤੜਕੇ ਮੁਹੱਲੇ ਵਿੱਚ ਗੁਰਬਾਣੀ ਗਾਉਂਦੇ ਹੋਏ ਜਲੂਸ।

ਕੀਰਤਨ ਲਈ ਗੁਰਦੁਆਰੇ ਜਾਓ। ਅਖੰਡ ਪਾਠ (ਗੁਰੂ ਗ੍ਰੰਥ ਸਾਹਿਬ ਦਾ 48 ਘੰਟੇ ਦਾ ਲਗਾਤਾਰ ਪਾਠ) ਸੁਣੋ ਜਾਂ ਕਿਸੇ ਵੀ ਹਿੱਸੇ ਵਿੱਚ ਸ਼ਾਮਲ ਹੋਵੋ। ਲੰਗਰ ਵਿੱਚ ਹਿੱਸਾ ਲਓ — ਉਹ ਮੁਫ਼ਤ ਸਾਂਝਾ ਰਸੋਈਘਰ ਜੋ ਗੁਰੂ ਨਾਨਕ ਜੀ ਦੀ ਬਰਾਬਰੀ ਦੀ ਭਾਵਨਾ ਨੂੰ ਜ਼ਿੰਦਾ ਰੱਖਦਾ ਹੈ।

ਘਰ ਵਿੱਚ: ਦੀਵਾ ਜਲਾਓ, ਜਪੁਜੀ ਸਾਹਿਬ ਦਾ ਪਾਠ ਕਰੋ (ਖਾਸ ਕਰਕੇ ਸਵੇਰੇ), ਅਤੇ ਗੁਰਬਾਣੀ ਗਾਓ ਜਾਂ ਸੁਣੋ। ਗੁਰੂ ਜੀ ਦੇ ਜੀਵਨ ਬਾਰੇ ਸੋਚੋ ਅਤੇ ਇੱਕ ਸਿੱਖਿਆ ਚੁਣੋ ਜੋ ਤੁਸੀਂ ਅੱਗੇ ਲੈ ਜਾਓਗੇ। ਸੇਵਾ ਕਰੋ — ਲੰਗਰ ਵਿੱਚ ਸੇਵਾਦਾਰੀ ਸਭ ਤੋਂ ਉੱਚੀ ਸੇਵਾ ਮੰਨੀ ਜਾਂਦੀ ਹੈ।`,
    mantra: 'ਵਾਹਿਗੁਰੂ ਵਾਹਿਗੁਰੂ ਵਾਹਿਗੁਰੂ ਵਾਹਿਗੁਰੂ',
    mantraLocal: 'ਵਾਹਿਗੁਰੂ ਵਾਹਿਗੁਰੂ ਵਾਹਿਗੁਰੂ ਵਾਹਿਗੁਰੂ',
    fastingType: 'none',
    dos: ['Attend the Gurdwara and listen to kirtan', 'Participate in langar seva (volunteering)', 'Recite Japji Sahib at dawn', 'Join or support the Prabhat Pheri', 'Share food and gifts with neighbours'],
    donts: ['Avoid tobacco and alcohol', 'Do not enter the Gurdwara with shoes or head uncovered', 'Avoid tamasic activities — this is a day of satvik joy and service'],
    pujaItems: ['Kada prasad ingredients (wheat, ghee, sugar)', 'Fresh flowers for the Gurdwara', 'Donation for langar'],
  },

};

const NAMED_VRAT_ALIASES: Array<{ canonical: string; aliases: string[] }> = [
  { canonical: 'nirjala-ekadashi', aliases: ['nirjala ekadashi', 'nirjala-ekadashi', 'bhimseni ekadashi', 'bhimseni-ekadashi', 'pandava nirjala ekadashi'] },
  { canonical: 'vat-savitri-purnima', aliases: ['vat savitri purnima', 'vat-savitri-purnima'] },
  { canonical: 'vat-savitri', aliases: ['vat savitri vrat', 'vat savitri', 'vat-savitri', 'savitri vrat', 'savitri'] },
  { canonical: 'hartalika-teej', aliases: ['hartalika teej', 'hartalika-teej', 'hartalika'] },
  { canonical: 'karva-chauth', aliases: ['karva chauth', 'karwa chauth', 'karva-chauth', 'karwa-chauth'] },
  { canonical: 'vaikunta-ekadashi', aliases: ['vaikunta ekadashi', 'vaikuntha ekadashi', 'vaikunta-ekadashi', 'vaikuntha-ekadashi', 'mokshada ekadashi'] },
  { canonical: 'navratri', aliases: ['navratri', 'navaratri'] },
  { canonical: 'diwali', aliases: ['diwali', 'deepavali', 'divali'] },
  { canonical: 'janmashtami', aliases: ['janmashtami', 'krishna jayanti', 'gokulashtami'] },
  { canonical: 'holi', aliases: ['holi', 'holika'] },
  { canonical: 'gurpurab', aliases: ['gurpurab', 'guru nanak', 'gurupurab'] },
];

const RECURRING_VRAT_ALIASES: Array<{ canonical: string; aliases: string[] }> = [
  { canonical: 'ekadashi', aliases: ['ekadashi'] },
  { canonical: 'purnima', aliases: ['purnima', 'poornima'] },
  { canonical: 'amavasya', aliases: ['amavasya', 'amavasai'] },
  { canonical: 'pradosh', aliases: ['pradosh', 'pradosham'] },
  { canonical: 'chaturthi', aliases: ['chaturthi', 'sankashti'] },
  { canonical: 'shivaratri', aliases: ['shivaratri', 'shivratri'] },
  { canonical: 'puranmashi', aliases: ['puranmashi', 'sangrand'] },
  { canonical: 'uposatha', aliases: ['uposatha'] },
];

function includesAlias(value: string, aliases: string[]): boolean {
  return aliases.some((alias) => value.includes(alias));
}

function resolveCanonicalVratKey(slug: string): string | null {
  const n = slug.toLowerCase().trim();

  for (const entry of NAMED_VRAT_ALIASES) {
    if (includesAlias(n, entry.aliases)) return entry.canonical;
  }

  for (const entry of RECURRING_VRAT_ALIASES) {
    if (includesAlias(n, entry.aliases)) return entry.canonical;
  }

  return null;
}

export function lookupVratData(slug: string): VratData | null {
  if (slug in NAMED_VRAT_DATABASE) {
    return NAMED_VRAT_DATABASE[slug as keyof typeof NAMED_VRAT_DATABASE];
  }
  if (slug in VRAT_DATABASE) {
    return VRAT_DATABASE[slug as keyof typeof VRAT_DATABASE];
  }

  const canonical = resolveCanonicalVratKey(slug);
  if (!canonical) return null;

  if (canonical in NAMED_VRAT_DATABASE) {
    return NAMED_VRAT_DATABASE[canonical as keyof typeof NAMED_VRAT_DATABASE];
  }
  if (canonical in VRAT_DATABASE) {
    return VRAT_DATABASE[canonical as keyof typeof VRAT_DATABASE];
  }
  return null;
}

export function resolveVratSlug(slug: string): string | null {
  const canonical = resolveCanonicalVratKey(slug);
  return canonical && lookupVratData(canonical) ? canonical : null;
}

export function getVratData(slug: string): VratData | null {
  const resolved = lookupVratData(slug);
  if (resolved) return resolved;

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
