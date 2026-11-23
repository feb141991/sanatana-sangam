/**
 * Canonical Dharma FAQ Resolver
 * 
 * High-frequency spiritual, ritual, and philosophical queries with authoritative,
 * scripture-backed answers. When a user asks one of these questions in Dharma Mitra,
 * we return the canonical verified answer immediately with 0ms latency and 0 LLM token cost.
 * 
 * Adheres strictly to Rule 14 (Dharma Mitra Must Give the Same Answer Twice & zero hallucination).
 */

export interface CanonicalFaqEntry {
  id: string;
  tradition: 'hindu' | 'sikh' | 'jain' | 'buddhist' | 'all';
  keywords: string[];
  patterns: RegExp[];
  questionEn: string;
  questionHi: string;
  answerEn: string;
  answerHi: string;
  sources: string[];
}

export const CANONICAL_FAQS: CanonicalFaqEntry[] = [
  {
    id: 'ekadashi-rules',
    tradition: 'hindu',
    keywords: ['ekadashi', 'fasting rules', 'ekadashi vrat', 'parana', 'rice', 'chawal'],
    patterns: [
      /\b(ekadashi|ekadasi)\b.*(rule|fast|vrat|eat|eating|rice|chawal|parana|break)/i,
      /(एकादशी|एकादसी).*(नियम|व्रत|उपवास|चावल|पारण)/u,
    ],
    questionEn: 'What are the core fasting rules for Ekadashi?',
    questionHi: 'एकादशी व्रत के मुख्य नियम क्या हैं?',
    answerEn: `Ekadashi is observed on the 11th tithi of each lunar fortnight (Shukla and Krishna Paksha), dedicated to Lord Vishnu.

Key Observance Rules:
1. Grains & Rice Avoidance: Strictly avoid consuming grains, pulses, and especially rice (annadan / chawal) on Ekadashi. Scripture explains that subtle karmic impurities reside in food grains on this day.
2. Fasting Tiers:
   - Nirjala (waterless): Highest austerity, practiced especially on Nirjala Ekadashi.
   - Sajala / Phalahar: Taking water, milk, fruits, and roots (sama ke chawal, sabudana, kuttu, singhara).
3. Sadhana: Spend the day in remembrance (japa, chanting Vishnu Sahasranama, reading Bhagavad Gita or Katha).
4. Parana (Breaking the Fast): The fast must be broken during Parana time on Dwadashi tithi before Hari Vasara ends. Consuming a small portion of prasadam or tulsi water completes the vrat.`,
    answerHi: `एकादशी का व्रत प्रत्येक पक्ष की ग्यारहवीं तिथि को भगवान श्री विष्णु की आराधना हेतु रखा जाता है।

मुख्य नियम:
1. अन्न व चावल का त्याग: एकादशी के दिन अन्न, दालें और विशेषकर चावल का सेवन पूर्णतः वर्जित है।
2. उपवास के प्रकार:
   - निर्जला: बिना जल ग्रहण किए पूर्ण संयम।
   - फलाहार: फल, दूध, श्यामाक (सामक के चावल), कुट्टू, सिंघाड़ा और जल का सेवन।
3. साधना: दिन भर भगवान विष्णु का स्मरण, नाम जप, गीता पाठ या एकादशी महात्म्य कथा का श्रवण करें।
4. पारण का समय: व्रत का पारण द्वादशी तिथि को हरि वासर समाप्त होने के पश्चात और द्वादशी समाप्त होने से पूर्व करना अनिवार्य है।`,
    sources: ['Padma Purana', 'Hari Bhakti Vilasa', 'Vishnu Purana'],
  },
  {
    id: 'brahma-muhurta',
    tradition: 'hindu',
    keywords: ['brahma muhurta', 'brahmamuhurta', 'wake up time', 'morning time', '4 am'],
    patterns: [
      /\bbrahma\s*muhurta\b/i,
      /(ब्रह्म\s*मुहूर्त)/u,
      /\b(best time to wake up|morning meditation time)\b/i,
    ],
    questionEn: 'What is Brahma Muhurta and why is it sacred?',
    questionHi: 'ब्रह्म मुहूर्त क्या है और इसका क्या महत्व है?',
    answerEn: `Brahma Muhurta literally means "The Hour of Divine Consciousness." It occurs precisely 1 hour and 36 minutes (2 ghatikas) before sunrise and concludes 48 minutes before sunrise.

Significance & Practice:
1. Pure Sattva: The atmosphere carries the highest concentration of Sattva guna, with zero environmental and mental noise.
2. Mental Clarity: The mind is naturally serene, transitioning seamlessly from deep sleep into transcendent awareness.
3. Recommended Sadhana: The ideal period for Japa, Dhyana (meditation), pranayama, and sacred study. Physical indulgence or eating during this time is strictly avoided in traditional Ayurveda and Yoga.`,
    answerHi: `ब्रह्म मुहूर्त का अर्थ है "परम चेतना का समय"। यह सूर्योदय से 1 घंटा 36 मिनट (2 घटी) पूर्व आरंभ होकर सूर्योदय से 48 मिनट पहले तक रहता है।

महत्व व साधना:
1. सात्विक वातावरण: इस समय प्रकृति में सत्व गुण का सर्वोच्च प्रवाह होता है और वातावरण पूर्ण शांत रहता है।
2. मानसिक शांति: निद्रा से जागने के बाद मन स्वाभाविक रूप से स्थिर और अंतर्मुखी होता है।
3. उत्तम साधना: यह समय नाम जप, ध्यान, प्राणायाम और धर्मग्रंथों के स्वाध्याय के लिए सर्वश्रेष्ठ माना गया है।`,
    sources: ['Ashtanga Hridaya', 'Manu Smriti', 'Shiva Samhita'],
  },
  {
    id: 'gayatri-mantra-timing',
    tradition: 'hindu',
    keywords: ['gayatri mantra', 'when to chant gayatri', 'tri-sandhya', 'sandhya vandanam'],
    patterns: [
      /\bgayatri\s*mantra\b.*(when|time|chant|timing|how many times)/i,
      /(गायत्री\s*मंत्र).*(कब|समय|जप|नियम)/u,
    ],
    questionEn: 'When should the Gayatri Mantra be chanted?',
    questionHi: 'गायत्री मंत्र का जप कब और कैसे करना चाहिए?',
    answerEn: `The sacred Gayatri Mantra (Rigveda 3.62.10) is traditionally chanted during the three Sandhyas (Tri-Sandhya):

1. Pratah Sandhya (Morning Twilight): Chanted facing East, just before sunrise as the sky begins to lighten until the sun rises.
2. Madhyahna Sandhya (Noon): Chanted facing North or East at solar noon.
3. Sayam Sandhya (Evening Twilight): Chanted facing West, beginning just before sunset until stars appear.

Guidelines:
- Purity: Bathe or wash hands, feet, and face, sit in a calm posture with a straight spine (Padmasana / Sukhasana).
- Pronunciation: Chant with clear, gentle articulation, avoiding haste. Focus on the divine light (Savitr) illuminating the intellect (dhiyo yo nah prachodayat).
- Count: Traditionally chanted 108, 27, or 11 times with a Rudraksha or Tulsi mala.`,
    answerHi: `ऋग्वेद का पावन गायत्री मंत्र (3.62.10) परंपरागत रूप से तीनों संध्याओं (त्रिकाल संध्या) में जपा जाता है:

1. प्रातः संध्या: सूर्योदय से कुछ पूर्व, जब आकाश में उषाकाल का प्रकाश हो, पूर्व दिशा की ओर मुख करके।
2. मध्याह्न संध्या: दोपहर के समय जब सूर्य आकाश के केंद्र में हो।
3. सायं संध्या: सूर्यास्त से कुछ पूर्व, पश्चिम दिशा की ओर मुख करके।

साधना नियम:
- शुद्धि: स्नानोपरांत पवित्र वस्त्र धारण कर रीढ़ सीधी रखकर सुखासन या पद्मासन में बैठें।
- उच्चारण: शांत और लयबद्ध स्वर में स्पष्ट उच्चारण करें। 'धियो यो नः प्रचोदयात्' के भाव में परमात्मा के दिव्य प्रकाश का ध्यान करें।
- संख्या: कम से कम 108, 27 या 11 बार जप करना शुभ माना जाता है।`,
    sources: ['Rigveda 3.62.10', 'Yajurveda', 'Taittiriya Aranyaka'],
  },
  {
    id: 'tulsi-water-prana-tyag',
    tradition: 'hindu',
    keywords: ['tulsi water', 'ganga jal', 'death', 'passing away', 'prana tyag', 'antim sanskar'],
    patterns: [
      /\b(tulsi|ganga\s*jal)\b.*(death|dying|passing|prana|mouth)/i,
      /(तुलसी|गंगाजल).*(प्राण त्याग|मृत्यु|अंतिम समय|मुख)/u,
    ],
    questionEn: 'Why are Ganga Jal and Tulsi placed in the mouth during a person’s final moments?',
    questionHi: 'प्राण त्याग के समय मुख में गंगाजल और तुलसी क्यों दी जाती है?',
    answerEn: `In Sanatan tradition, placing sacred Ganga Jal and a sanctified Tulsi leaf on the tongue of a departing soul is an act of deep reverence, spiritual liberation, and peace:

1. Divine Purification: Ganga Jal carries sacred elemental purity that cleanses residual prarabdha karma and provides spiritual serenity to the departing jiva.
2. Tulsi (Haripriya): Tulsi is dearly beloved to Lord Vishnu (Vaikuntha Duti). Her presence safeguards the subtle body from lower astral distress and guides the soul toward an elevated, peaceful realm.
3. Physical Comfort: On a physical level, a few drops of pure water moisten the throat, easing breathing and relaxing the vocal organs during the final breath.`,
    answerHi: `सनातन परंपरा में अंतिम समय में व्यक्ति के मुख में गंगाजल और तुलसी पत्र रखना परम पवित्रता और मोक्षदायिनी शांति का प्रतीक है:

1. आध्यात्मिक शुद्धि: गंगाजल समस्त पापों और कर्म-संस्कारों को शांत कर आत्मा को दिव्य शांति प्रदान करता है।
2. तुलसी का पावन सान्निध्य: तुलसी भगवान श्री हरि विष्णु को अत्यंत प्रिय हैं। तुलसी पत्र की उपस्थिति से जीवात्मा को यमदूतों का भय नहीं रहता और वह सद्गति को प्राप्त होती है।
3. शांति और शीतलता: शारीरिक स्तर पर अंतिम क्षणों में कंठ सूखने से मुक्ति मिलती है और प्राण त्याग शांत भाव से संभव होता है।`,
    sources: ['Garuda Purana', 'Skanda Purana', 'Padma Purana'],
  },
  {
    id: 'mool-mantar-meaning',
    tradition: 'sikh',
    keywords: ['mool mantar', 'mul mantar', 'ik onkar', 'meaning', 'sikh prayer'],
    patterns: [
      /\b(mool|mul)\s*manta?r\b/i,
      /\bik\s*onkar\b/i,
      /(मूल\s*मंतर|ੴ)/u,
    ],
    questionEn: 'What is the Mool Mantar and what does it mean?',
    questionHi: 'मूल मंतर क्या है और इसका क्या अर्थ है?',
    answerEn: `The Mool Mantar is the opening composition of the Sri Guru Granth Sahib Ji, revealed through Guru Nanak Dev Ji. It defines the primal, unconditioned nature of the Supreme Reality:

- ੴ (Ik Onkar): One Universal Creator / Supreme Reality.
- ਸਤਿ ਨਾਮੁ (Satnam): The Truth is Their True Identity / Name.
- ਕਰਤਾ ਪੁਰਖੁ (Karta Purakh): The Creative Being personified.
- ਨਿਰਭਉ (Nirbhau): Free from fear / Without fear.
- ਨਿਰਵੈਰੁ (Nirvair): Free from vengeance or hatred / Without enmity.
- ਅਕਾਲ ਮੂਰਤਿ (Akaal Moorat): Timeless Form, immortal and imperishable.
- ਅਜੂਨੀ (Ajuni): Beyond birth and reincarnation.
- ਸੈਭੰ (Saibhang): Self-existent and self-illuminated.
- ਗੁਰ ਪ੍ਰਸਾਦਿ (Gur Prasad): Realized through the Grace of the True Guru.`,
    answerHi: `मूल मंतर श्री गुरु ग्रंथ साहिब जी का पहला शबद है, जो गुरु नानक देव जी द्वारा प्रकट हुआ। यह परमात्मा के स्वरूप का वर्णन करता है:

- ੴ (इक ओंकार): एक ही परमात्मा, जो सर्वव्यापी है।
- सति नामु: उनका नाम सत्य है।
- करता पुरखु: वे ही सृष्टि के रचयिता हैं।
- निरभउ: वे भय से रहित हैं।
- निरवैरु: उनका किसी से कोई वैर या द्वेष नहीं है।
- अकाल मूरति: उनका स्वरूप काल (मृत्यु) से परे है।
- अजूनी: वे जन्म-मरण के बंधन से मुक्त हैं।
- सैभं: वे स्वयं-प्रकाशित और स्वयंभू हैं।
- गुर प्रसादि: उनकी प्राप्ति केवल गुरु की कृपा से संभव है।`,
    sources: ['Sri Guru Granth Sahib Ji, Ang 1'],
  },
  {
    id: 'navkar-mantra-meaning',
    tradition: 'jain',
    keywords: ['navkar mantra', 'namokar mantra', 'jain mantra', 'panca paramesthi'],
    patterns: [
      /\b(navkar|namokar)\s*mantra\b/i,
      /(णमोकार|नवकार\s*मंत्र)/u,
    ],
    questionEn: 'What is the Navkar (Namokar) Mantra in Jainism?',
    questionHi: 'जैन धर्म में णमोकार (नवकार) मंत्र का क्या महत्व और अर्थ है?',
    answerEn: `The Navkar (Namokar) Mantra is the supreme, primordial mantra of Jainism. It is entirely non-sectarian: it does not bow to any individual by name, but reveres virtues and spiritual liberation across the Five Supreme Souls (Pancha Parameshthi):

1. Ṇamō Arihantāṇaṁ: I bow to the Arihantas (liberated souls who destroyed internal passions and teach the path).
2. Ṇamō Siddhāṇaṁ: I bow to the Siddhas (fully liberated bodiless souls resting in Moksha).
3. Ṇamō Āyariyāṇaṁ: I bow to the Acharyas (spiritual masters and heads of the monastic order).
4. Ṇamō Uvajjhāyāṇaṁ: I bow to the Upadhyayas (ascetic preceptors and sacred teachers).
5. Ṇamō Lōē Savva Sāhūṇaṁ: I bow to all Sadhus and Sadhvis (monks and nuns everywhere practicing pure right conduct).

Esō Pañca Ṇamukkārō, Savva Pāvappaṇāsaṇō — This fivefold bow eradicates all sins and obstacles.`,
    answerHi: `णमोकार मंत्र जैन धर्म का मूल और शाश्वत महामंत्र है। यह किसी व्यक्ति विशेष की वंदना न करके पांच परम पदों (पंच परमेष्ठी) के पावन गुणों को नमस्कार करता है:

1. णमो अरिहंताणं: अनंत ज्ञान प्राप्त अरिहंतों को मेरा नमन।
2. णमो सिद्धाणं: समस्त कर्म बंधनों से मुक्त सिद्ध परमात्माओं को मेरा नमन।
3. णमो आयरियाणं: धर्म संघ के प्रधान पूज्य आचार्यों को मेरा नमन।
4. णमो उवज्झायाणं: ज्ञान का उपदेश देने वाले उपाध्यायों को मेरा नमन।
5. णमो लोए सव्व साहूणं: संसार के समस्त साधु-संतों को मेरा नमन।

एसो पंच णमुक्कारो, सव्व पावप्पणासणो — यह पंच नमस्कार समस्त पापों का नाश करने वाला है।`,
    sources: ['Shatkhandagama', 'Acaranga Sutra'],
  },
  {
    id: 'pradosh-vrat-timing',
    tradition: 'hindu',
    keywords: ['pradosh', 'pradosham', 'shiva vrat', 'trayodashi', 'timing'],
    patterns: [
      /\bpradosh(am)?\b.*(timing|time|rule|when|vrat)/i,
      /(प्रदोष).*(व्रत|पूजा|समय|नियम)/u,
    ],
    questionEn: 'When is Pradosh Vrat and how should it be performed?',
    questionHi: 'प्रदोष व्रत कब होता है और इसकी पूजा विधि क्या है?',
    answerEn: `Pradosh Vrat is observed twice every lunar month on Trayodashi tithi (13th day), dedicated to Lord Shiva and Goddess Parvati.

Timing & Meaning:
- The word "Pradosha" refers to the twilight window (sandhyakaal) spanning approximately 45 minutes before sunset to 45 minutes after sunset.
- Shiva Mahapuran states that during this twilight window, Lord Shiva performs the cosmic Ananda Tandava on Mount Kailash.

Observance Guidelines:
1. Fasting: Maintain a fast through the day; water or milk/fruits may be taken.
2. Pradosha Puja: Bathe before sunset, dress in clean light-colored garments, and perform Shiva Abhishekam (Bilha leaves, water, raw milk, honey, sacred ash/bhasma, chandan).
3. Chanting: Recite the Maha Mrityunjaya Mantra, Shiva Chalisa, or Shiva Tandava Stotram. Break the fast after the evening puja.`,
    answerHi: `प्रदोष व्रत प्रत्येक माह के दोनों पक्षों की त्रयोदशी तिथि को भगवान शिव और माता पार्वती की कृपा प्राप्ति हेतु रखा जाता है।

समय और महत्व:
- सूर्यास्त से 45 मिनट पहले और 45 मिनट बाद का संधिकाल 'प्रदोष काल' कहलाता है।
- शिव पुराण के अनुसार इस पावन वेला में भगवान शिव कैलाश पर्वत पर आनंद तांडव करते हैं।

पूजा विधि:
1. उपवास: दिन भर निराहार या फलाहार रहकर भगवान शिव का ध्यान करें।
2. प्रदोष काल पूजा: सूर्यास्त से पूर्व स्नान कर स्वच्छ वस्त्र पहनें और शिवलिंग का जल, कच्चे दूध, गंगाजल, बेलपत्र, धतूरा और भस्म से अभिषेक करें।
3. मंत्र जप: महामृत्युंजय मंत्र या ॐ नमः शिवाय का श्रद्धापूर्वक जप करें और आरती के बाद व्रत का पारण करें।`,
    sources: ['Shiva Purana, Vidyeshvara Samhita', 'Skanda Purana'],
  },
];

/**
 * Searches for a canonical FAQ match based on the user query.
 */
export function findCanonicalFaqMatch(query: string, languageHint: string = 'en'): {
  found: boolean;
  entry?: CanonicalFaqEntry;
  answerText?: string;
  sources?: string[];
} {
  const normalized = query.trim().toLowerCase();
  if (normalized.length < 3) return { found: false };

  for (const entry of CANONICAL_FAQS) {
    // 1. Pattern matching
    for (const pattern of entry.patterns) {
      if (pattern.test(normalized)) {
        const isHindi = languageHint === 'hi' || /[ऀ-ॿ]/.test(query);
        return {
          found: true,
          entry,
          answerText: isHindi ? entry.answerHi : entry.answerEn,
          sources: entry.sources,
        };
      }
    }

    // 2. Keyword density match
    const matchingKeywords = entry.keywords.filter((kw) => normalized.includes(kw));
    if (matchingKeywords.length >= 2) {
      const isHindi = languageHint === 'hi' || /[ऀ-ॿ]/.test(query);
      return {
        found: true,
        entry,
        answerText: isHindi ? entry.answerHi : entry.answerEn,
        sources: entry.sources,
      };
    }
  }

  return { found: false };
}
