const fs = require('fs');

const data = `
  // ── Japji Sahib ───────────────────────────────────────────────────────────
  {
    id: 'japji-sahib-full',
    title: 'Japji Sahib',
    titleDevanagari: 'ਜਪੁਜੀ ਸਾਹਿਬ',
    deity: 'universal',
    deityEmoji: 'ੴ',
    tradition: 'sikh',
    type: 'simran',
    mood: 'meditative',
    language: 'Gurmukhi',
    source: 'Guru Granth Sahib Ji — Page 1-8 (Guru Nanak Dev Ji)',
    description: 'The sacred morning prayer of the Sikhs composed by Guru Nanak Dev Ji. It reveals the path to spiritual awakening and unity with the Divine.',
    verses: [
      ${Array.from({length: 38}, (_, i) => `{
        number: ${i + 1},
        sanskrit: 'ਪਉੜੀ ${i + 1} ਦੀ ਬਾਣੀ (Pauri ${i + 1} text)',
        transliteration: 'paurī ${i + 1} dī bāṇī',
        meaning: 'English meaning for Pauri ${i + 1}',
        meaning_hi: 'पउड़ी ${i + 1} का अर्थ',
        meaning_pa: 'ਪਉੜੀ ${i + 1} ਦਾ ਅਰਥ'
      }`).join(',\n      ')},
      {
        number: 39,
        sanskrit: 'ਸਲੋਕੁ ॥ ਪਵਣੁ ਗੁਰੂ ਪਾਣੀ ਪਿਤਾ ਮਾਤਾ ਧਰਤਿ ਮਹਤੁ ॥ ਦਿਵਸੁ ਰਾਤਿ ਦੁਇ ਦਾਈ ਦਾਇਆ ਖੇਲੈ ਸਗਲ ਜਗਤੁ ॥ ਚੰਗਿਆਈਆ ਬੁਰਿਆਈਆ ਵਾਚੈ ਧਰਮੁ ਹਦੂਰਿ ॥ ਕਰਮੀ ਆਪੋ ਆਪਣੀ ਕੇ ਨੇੜੈ ਕੇ ਦੂਰਿ ॥ ਜਿਨੀ ਨਾਮੁ ਧਿਆਇਆ ਗਏ ਮਸਕਤਿ ਘਾਲਿ ॥ ਨਾਨਕ ਤੇ ਮੁਖ ਉਜਲੇ ਕੇਤੀ ਛੁਟੀ ਨਾਲਿ ॥੧॥',
        transliteration: 'salok || pavaṇ gurū pāṇī pitā mātā dharat mahat || divas rāt du-e dā-ī dā-i-ā khēlai sagal jagat || chaṅgi-ā-ī-ā buri-ā-ī-ā vāchai dharam hadūr || karamī āpō āpaṇī kē nēṛai kē dūr || jinī nām dhi-ā-i-ā ga-ē masakat ghāl || nānak tē mukh ujalē kētī chhuṭī nāl ||1||',
        meaning: 'Slok: Air is the Guru, Water the Father, and Earth the Great Mother. Day and night are the two nurses, in whose lap the whole world is at play. Good and bad deeds are read out in the presence of the Lord of Dharma. According to their own actions, some are drawn closer, and some are driven farther away. Those who have meditated on the Naam, and departed after having worked by the sweat of their brows - O Nanak, their faces are radiant, and many others are saved along with them!',
        meaning_hi: 'श्लोक: पवन गुरु है, पानी पिता है, और धरती महान माता है। दिन और रात दो दाइयाँ हैं, जिनकी गोद में सारा जगत खेलता है। धर्मराज की हुजूरी में अच्छे और बुरे कर्मों का हिसाब होता है। अपने-अपने कर्मों के अनुसार कोई प्रभु के समीप है, कोई दूर। जिन्होंने नाम का ध्यान किया है और अपनी कमाई सफल की है, नानक कहते हैं, उनके मुख उज्ज्वल हैं और उनके साथ कई और भी मुक्त हो जाते हैं।',
        meaning_pa: 'ਸਲੋਕ: ਪਵਣ (ਹਵਾ) ਗੁਰੂ ਹੈ, ਪਾਣੀ ਪਿਤਾ ਹੈ ਅਤੇ ਧਰਤੀ ਮਹਾਨ ਮਾਤਾ ਹੈ। ਦਿਨ ਅਤੇ ਰਾਤ ਦੋ ਖਿਡਾਵੇ ਹਨ ਜਿਨ੍ਹਾਂ ਦੀ ਗੋਦ ਵਿੱਚ ਸਾਰਾ ਸੰਸਾਰ ਖੇਡਦਾ ਹੈ। ਧਰਮਰਾਜ ਦੀ ਹਜ਼ੂਰੀ ਵਿੱਚ ਚੰਗੇ ਅਤੇ ਮਾੜੇ ਕਰਮਾਂ ਦਾ ਲੇਖਾ ਹੁੰਦਾ ਹੈ। ਆਪੋ-ਆਪਣੇ ਕਰਮਾਂ ਅਨੁਸਾਰ ਕੋਈ ਪ੍ਰਭੂ ਦੇ ਨੇੜੇ ਹੈ ਅਤੇ ਕੋਈ ਦੂਰ। ਜਿਨ੍ਹਾਂ ਨੇ ਨਾਮ ਧਿਆਇਆ ਹੈ ਅਤੇ ਸਫਲ ਕਮਾਈ ਕੀਤੀ ਹੈ, ਨਾਨਕ ਆਖਦੇ ਹਨ, ਉਹਨਾਂ ਦੇ ਮੁਖ ਉਜਲੇ ਹਨ ਅਤੇ ਉਹਨਾਂ ਦੀ ਸੰਗਤ ਵਿੱਚ ਕਈ ਹੋਰ ਵੀ ਬਚ ਜਾਂਦੇ ਹਨ।'
      }
    ]
  },
  // ── Jaap Sahib ─────────────────────────────────────────────────────────────
  {
    id: 'jaap-sahib',
    title: 'Jaap Sahib',
    titleDevanagari: 'ਜਾਪੁ ਸਾਹਿਬ',
    deity: 'universal',
    deityEmoji: '⚔️',
    tradition: 'sikh',
    type: 'simran',
    mood: 'devotional',
    language: 'Gurmukhi',
    source: 'Dasam Granth — Guru Gobind Singh Ji',
    description: 'A martial and devotional prayer by Guru Gobind Singh Ji, praising the Formless Lord through hundreds of His attributes and names.',
    verses: [
      ${Array.from({length: 10}, (_, i) => `{
        number: ${i + 1},
        sanskrit: 'ਛੰਦ ${i + 1} (Chhand ${i + 1})',
        transliteration: 'chhand ${i + 1}',
        meaning: 'English meaning for Chhand ${i + 1}',
        meaning_hi: 'छंद ${i + 1} का अर्थ',
        meaning_pa: 'ਛੰਦ ${i + 1} ਦਾ ਅਰਥ'
      }`).join(',\n      ')}
    ]
  },
  // ── Rehras Sahib ──────────────────────────────────────────────────────────
  {
    id: 'rehras-sahib',
    title: 'Rehras Sahib',
    titleDevanagari: 'ਰਹਿਰਾਸਿ ਸਾਹਿਬ',
    deity: 'universal',
    deityEmoji: '🌅',
    tradition: 'sikh',
    type: 'simran',
    mood: 'devotional',
    language: 'Gurmukhi',
    source: 'Guru Granth Sahib Ji — Evening prayer (multiple Gurus)',
    description: 'The evening prayer of the Sikhs, recited at sunset. It includes hymns by Guru Nanak, Guru Amar Das, Guru Ram Das, Guru Arjan Dev, and Guru Gobind Singh.',
    verses: [
      ${Array.from({length: 9}, (_, i) => `{
        number: ${i + 1},
        sanskrit: 'ਸ਼ਬਦ ${i + 1} (Shabad ${i + 1})',
        transliteration: 'shabad ${i + 1}',
        meaning: 'English meaning for Shabad ${i + 1}',
        meaning_hi: 'शबद ${i + 1} का अर्थ',
        meaning_pa: 'ਸ਼ਬਦ ${i + 1} ਦਾ ਅਰਥ'
      }`).join(',\n      ')}
    ]
  },
  // ── Kirtan Sohila ─────────────────────────────────────────────────────────
  {
    id: 'kirtan-sohila',
    title: 'Kirtan Sohila',
    titleDevanagari: 'ਸੋਹਿਲਾ',
    deity: 'universal',
    deityEmoji: '🌙',
    tradition: 'sikh',
    type: 'simran',
    mood: 'meditative',
    language: 'Gurmukhi',
    source: 'Guru Granth Sahib Ji — Page 12-13 (Night prayer)',
    description: 'The night prayer of the Sikhs, recited before going to sleep. It consists of five shabads offering gratitude for the day and preparing the soul for rest.',
    verses: [
      ${Array.from({length: 5}, (_, i) => `{
        number: ${i + 1},
        sanskrit: 'ਸ਼ਬਦ ${i + 1} (Shabad ${i + 1})',
        transliteration: 'shabad ${i + 1}',
        meaning: 'English meaning for Shabad ${i + 1}',
        meaning_hi: 'शबद ${i + 1} का अर्थ',
        meaning_pa: 'ਸ਼ਬਦ ${i + 1} ਦਾ ਅਰਥ'
      }`).join(',\n      ')}
    ]
  },
  // ── Sukhmani Sahib ────────────────────────────────────────────────────────
  {
    id: 'sukhmani-sahib',
    title: 'Sukhmani Sahib',
    titleDevanagari: 'ਸੁਖਮਨੀ ਸਾਹਿਬ',
    deity: 'universal',
    deityEmoji: '🕊️',
    tradition: 'sikh',
    type: 'simran',
    mood: 'meditative',
    language: 'Gurmukhi',
    source: 'Guru Granth Sahib Ji — Page 262-296 (Guru Arjan Dev Ji)',
    description: 'The Psalm of Peace by Guru Arjan Dev Ji. It brings profound inner tranquility and is divided into 24 Ashtpadis.',
    verses: [
      ${Array.from({length: 24}, (_, i) => `{
        number: ${i + 1},
        sanskrit: 'ਅਸਟਪਦੀ ${i + 1} ਦਾ ਸਲੋਕ ਅਤੇ ਪਹਿਲੀ ਪਉੜੀ',
        transliteration: 'asaṭapadī ${i + 1} salōk atē pahilī paurī',
        meaning: 'English meaning for Ashtpadi ${i + 1}',
        meaning_hi: 'अष्टपदी ${i + 1} का अर्थ',
        meaning_pa: 'ਅਸਟਪਦੀ ${i + 1} ਦਾ ਅਰਥ'
      }`).join(',\n      ')}
    ]
  },
  // ── Ardas ────────────────────────────────────────────────────────────────
  {
    id: 'ardas',
    title: 'Ardas',
    titleDevanagari: 'ਅਰਦਾਸ',
    deity: 'universal',
    deityEmoji: '🙏',
    tradition: 'sikh',
    type: 'simran',
    mood: 'devotional',
    language: 'Gurmukhi',
    source: 'Sikh Rehat Maryada — communal prayer (Guru Gobind Singh Ji + Panth additions)',
    description: 'The formal Sikh prayer of supplication, seeking blessings, peace, and Chardi Kala (high spirits) for all of humanity.',
    verses: [
      {
        number: 1,
        sanskrit: 'ੴ ਵਾਹਿਗੁਰੂ ਜੀ ਕੀ ਫਤਹਿ ॥ ਸ੍ਰੀ ਭਗਉਤੀ ਜੀ ਸਹਾਇ ॥ ਵਾਰ ਸ੍ਰੀ ਭਗਉਤੀ ਜੀ ਕੀ ਪਾਤਿਸਾਹੀ ੧੦ ॥ ਪ੍ਰਿਥਮ ਭਗਉਤੀ ਸਿਮਰਿ ਕੈ ਗੁਰ ਨਾਨਕ ਲਈਂ ਧਿਆਇ ॥...',
        transliteration: 'ik oankar vaheguru ji ki fateh. sri bhagauti ji sahae. vaar sri bhagauti ji ki patisahi 10. pritham bhagauti simar kai gur nanak la-een dhia-e...',
        meaning: 'One Universal Creator God. Victory belongs to the Wondrous Lord. May the Divine power help us. The Ode of the Divine power by the Tenth Master. First, I remember the Divine power, then I meditate upon Guru Nanak...',
        meaning_hi: 'एक ओंकार, वाहेगुरु की विजय हो। भगवती (दिव्य शक्ति) सहाय हो। पहले मैं भगवती का स्मरण करके गुरु नानक का ध्यान करता हूँ...',
        meaning_pa: 'ੴ ਵਾਹਿਗੁਰੂ ਜੀ ਕੀ ਫਤਹਿ॥ ਸ੍ਰੀ ਭਗਉਤੀ ਜੀ ਸਹਾਇ॥ ਪਹਿਲਾਂ ਅਕਾਲ ਪੁਰਖ (ਭਗਉਤੀ) ਨੂੰ ਸਿਮਰ ਕੇ ਗੁਰੂ ਨਾਨਕ ਦੇਵ ਜੀ ਦਾ ਧਿਆਨ ਧਰਾਂ...'
      },
      {
        number: 2,
        sanskrit: 'ਪੰਜਾਂ ਪਿਆਰਿਆਂ, ਚੌਹਾਂ ਸਾਹਿਬਜ਼ਾਦਿਆਂ, ਚਾਲ੍ਹੀਆਂ ਮੁਕਤਿਆਂ, ਹਠੀਆਂ ਜਪੀਆਂ, ਤਪੀਆਂ, ਜਿਨ੍ਹਾਂ ਨਾਮ ਜਪਿਆ, ਵੰਡ ਛਕਿਆ...',
        transliteration: 'panjan piarian, chauhan sahibzadian, chahlian muktian, hathian, japian, tapian, jinha naam japia, vand chhakia...',
        meaning: 'Think of and remember the Five Beloved Ones, the Four Princes, the Forty Liberated Ones, the steadfast, the meditators, the ascetics, those who chanted the Naam, shared their food...',
        meaning_hi: 'पाँच प्यारों, चार साहिबजादों, चालीस मुक्तों, हठियों, जपने वालों, तपस्वियों, जिन्होंने नाम जपा और बाँट कर खाया...',
        meaning_pa: 'ਪੰਜਾਂ ਪਿਆਰਿਆਂ, ਚਾਰ ਸਾਹਿਬਜ਼ਾਦਿਆਂ, ਚਾਲੀ ਮੁਕਤਿਆਂ, ਹਠੀਆਂ, ਜਪੀਆਂ, ਤਪੀਆਂ, ਜਿਨ੍ਹਾਂ ਨਾਮ ਜਪਿਆ, ਵੰਡ ਕੇ ਛਕਿਆ, ਉਨ੍ਹਾਂ ਦੀ ਕਮਾਈ ਦਾ ਧਿਆਨ ਧਰ ਕੇ ਬੋਲੋ ਜੀ ਵਾਹਿਗੁਰੂ...'
      },
      {
        number: 3,
        sanskrit: 'ਨਾਨਕ ਨਾਮ ਚੜ੍ਹਦੀ ਕਲਾ ॥ ਤੇਰੇ ਭਾਣੇ ਸਰਬੱਤ ਦਾ ਭਲਾ ॥',
        transliteration: 'nanak naam chardi kala. tere bhane sarbat da bhala.',
        meaning: 'Through Nanak, may Your Name be exalted, and may all prosper according to Your Will.',
        meaning_hi: 'हे नानक! नाम की चढ़दी कला (सदा उत्साह) रहे, और आपके भाणे (इच्छा) में सबका भला हो।',
        meaning_pa: 'ਨਾਨਕ ਨਾਮ ਚੜ੍ਹਦੀ ਕਲਾ॥ ਤੇਰੇ ਭਾਣੇ ਸਰਬੱਤ ਦਾ ਭਲਾ॥ ਹੇ ਵਾਹਿਗੁਰੂ, ਤੇਰੇ ਨਾਮ ਦੀ ਸਦਾ ਜੈ-ਜੈਕਾਰ ਹੋਵੇ ਅਤੇ ਤੇਰੇ ਭਾਣੇ ਵਿੱਚ ਸਭ ਦਾ ਭਲਾ ਹੋਵੇ।'
      }
    ]
  }
];

const file = 'src/lib/stotrams.ts';
let content = fs.readFileSync(file, 'utf8');

// replace the last '];' with the new objects and '];'
content = content.replace(/];\\s*$/, data + '\\n];\\n');

fs.writeFileSync(file, content);
console.log('Successfully added Sikh stotrams.');
