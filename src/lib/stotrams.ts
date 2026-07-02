// ─── Stotrams data library ────────────────────────────────────────────────────
// Contains full verse text for stotrams with Sanskrit, transliteration & meaning.
// Audio is loaded separately via devotional-audio.ts / devotional_tracks DB table.

export interface StotramVerse {
  number: number;
  sanskrit: string;
  transliteration: string;
  meaning: string;
  meaning_hi?: string;
  meaning_pa?: string;
  startSecs?: number; // approximate audio start (for future sync)
  sync_metadata?: { start: number; end: number; word: string }[];
}

export interface Stotram {
  id: string;
  title: string;
  titleDevanagari: string;
  deity: string;
  deityEmoji: string;
  tradition: 'hindu' | 'sikh' | 'buddhist' | 'jain' | 'all' | 'vaishnava' | 'shaiva' | 'shakta';
  type: 'mantra' | 'stotram' | 'bhajan' | 'kirtan' | 'dhyana' | 'simran' | 'aarti';
  mood?: 'devotional' | 'meditative' | 'energetic' | 'grief' | 'gratitude' | 'protective' | 'celebratory';
  language: string;
  source: string;          // scripture reference
  description: string;     // brief description
  audioTrackId?: string;   // links to devotional_tracks.id
  verses: StotramVerse[];
}

export const STOTRAMS: Stotram[] = [
  // ── Ganesha Pancharatnam ───────────────────────────────────────────────────
  {
    id: 'ganesha-pancharatnam',
    title: 'Ganesha Pancharatnam',
    titleDevanagari: 'गणेश पञ्चरत्नम्',
    deity: 'ganesha',
    deityEmoji: '🐘',
    tradition: 'hindu',
    type: 'stotram',
    mood: 'gratitude',
    language: 'Sanskrit',
    source: 'Composed by Adi Shankaracharya (8th century CE)',
    description: 'Five gems in praise of Ganesha — one of the most beloved stotrams composed by Adi Shankaracharya. Chanted at the start of any auspicious undertaking.',
    audioTrackId: 'ganesha-pancharatnam',
    verses: [
      {
        number: 1,
        sanskrit: 'मुदाकरात्त मोदकं सदा विमुक्ति साधकम्\nकलाधरावतंसकं विलासिलोक रक्षकम्\nअनायकैक नायकं विनाशितेभदैत्यकम्\nनताशुभाशु नाशकं नमामि तं विनायकम्॥',
        transliteration: 'Mudā karātta modakaṃ sadā vimukti sādhakaṃ\nKalādharāvataṃsakaṃ vilāsiloka rakṣakam\nAnāyakaika nāyakaṃ vināśitebhadaityakam\nNatāśubhāśu nāśakaṃ namāmi taṃ vināyakam',
        meaning: 'I bow to Vinayaka (Ganesha), who holds a modaka (sweet) in His hand with joy, who always furthers liberation, who wears the moon as an ornament, who protects the world with playfulness, who is the one leader of the leaderless, who destroyed the elephant demon, and who swiftly removes the misfortune of those who bow to Him.',
        startSecs: 0,
        meaning_hi: 'मुदा करात्त मोदकम् — जो आनंद से मोदक ग्रहण करते हैं, दीनत्राण की अभिलाषा रखते हैं, करुणाशील और विशाल उदर वाले हैं, गणाधीश हैं जो दोषों का नाश करते हैं — गजानन को प्रातः स्मरण करता हूँ।',
      },
      {
        number: 2,
        sanskrit: 'नतेतरातिभीकरं नवोदितार्क भास्वरम्\nनमत्सुरारिनिर्जरं नताधिकापदुद्धरम्\nसुरेश्वरं निधीश्वरं गजेश्वरं गणेश्वरम्\nमहेश्वरं समाश्रये पराम्बरं भजाम्यहम्॥',
        transliteration: 'Natetarāti bhīkaraṃ navoditārka bhāsvaram\nNamatsurārinirjaraṃ natādhikāpadudddharam\nSureśvaraṃ nidhīśvaraṃ gajeśvaraṃ gaṇeśvaram\nMaheśvaraṃ samāśraye parāmbaraṃ bhajāmyaham',
        meaning: 'I take refuge in and worship Maheshvara (Ganesha), who is terrifying to those who do not bow to Him, who shines like the newly risen sun, before whom the enemies of the gods bow, who lifts those who bow from terrible difficulties, who is the lord of gods, lord of treasures, lord of elephants, and lord of the Ganas.',
        startSecs: 35,
        meaning_hi: 'जो अकेले ही एकदंत, द्विबाहु, चार भुज और शूर्पकर्ण हैं, राम के प्रिय, वरद और भक्तों के मनोरथ पूर्ण करने वाले हैं — उन गजानन को प्रातः स्मरण करता हूँ।',
      },
      {
        number: 3,
        sanskrit: 'समस्त लोक शंकरं निरस्त दैत्य कुञ्जरम्\nदरेतरोदरं वरं वरेभवक्त्रमक्षरम्\nकृपाकरं क्षमाकरं मुदाकरं यशस्करम्\nमनस्करं नमस्कृतां नमस्करोमि भास्वरम्॥',
        transliteration: 'Samasta loka śaṃkaraṃ nirasta daitya kuñjaram\nDaretarodaraṃ varaṃ varebhavaktramakṣaram\nKṛpākaraṃ kṣamākaraṃ mudākaraṃ yaśaskaram\nManaskaraṃ namaskṛtāṃ namaskaromi bhāsvaram',
        meaning: 'I bow to the radiant one who brings auspiciousness to all worlds, who demolished the elephant-demon, whose large belly is a blessing, whose face resembles a noble elephant, who is the imperishable, who is the source of compassion, forgiveness, joy, and fame — the one who grants boons to those who bow to Him with their minds.',
        startSecs: 70,
        meaning_hi: 'जो एकदंत, चतुर्हस्त, पाशाङ्कुश, वरद-अभय मुद्रा में हैं, जिनका मूषक वाहन है, जो रक्तवर्णी, लंबोदर, शूर्पकर्ण और सिद्धिप्रद हैं — उन गणेश को प्रातः स्मरण करता हूँ।',
      },
      {
        number: 4,
        sanskrit: 'अकिञ्चनार्तिमार्जनं चिरन्तनोक्ति भाजनम्\nपुरारिपूर्व नन्दनं सुरारि गर्व चर्वणम्\nप्रपञ्च नाश भीषणं धनञ्जयादि भूषणम्\nकपोलदान वारणं भजे पुराणवारणम्॥',
        transliteration: 'Akiñcanārti mārjanaṃ cirantanokti bhājanam\nPurāripūrva nandanaṃ surāri garva carvaṇam\nPrapañca nāśa bhīṣaṇaṃ dhanañjayādi bhūṣaṇam\nKapoladāna vāraṇaṃ bhaje purāṇavāraṇam',
        meaning: 'I worship the ancient elephant (Ganesha), who removes the suffering of those who have nothing, who is the vessel of eternal declarations, the eldest son of the enemy of Tripura (Shiva), who devours the pride of the enemies of the gods, who is terrifying to the destruction of the universe, adorned with Dhananjaya (Arjuna\'s bow), and whose cheeks drip with ichor.',
        startSecs: 105,
        meaning_hi: 'जो सनातन, सर्वोत्कृष्ट, सत्-चित् के सार हैं, जिनसे वाणी, जीव और जगत उत्पन्न हैं, जो परमात्मा हैं — उन गजानन को प्रातः स्मरण करता हूँ।',
      },
      {
        number: 5,
        sanskrit: 'नितान्तकान्त दन्तकान्तिमन्त कान्तिमत्\nकृतान्तदन्त पाशबन्ध चित्रदन्तधारिणम्\nरसान्त भूरिवन्तमन्तरान्त धन्तिरं\nसुमन्तमन्त भूतमेमं विनतमन्तरम् ॥',
        transliteration: 'Nitānta kānta dantakānti manta kāntimad\nKṛtānta danta pāśabandha citra dantadhāriṇam\nRasānta bhūrivantam antarānta dhantiraṃ\nSumantam anta bhūtamemaṃ vinatamantatam',
        meaning: 'I bow to this supreme being whose tusk shines with magnificent, pure radiance, who bears a wonderful tusk that has been fashioned like the noose of Yama (death), who is full of nectar within, whose inner self is deeply joyful, who is the essence of all wisdom, who encompasses all beings, and who is ultimately beyond all limit.',
        startSecs: 140,
        meaning_hi: 'जो गणेश पञ्चरत्नम् प्रातःकाल पढ़ता है, उसे पूर्ण ज्ञान मिलता है। जो इसे भक्ति और श्रद्धा से पढ़ता है, उसे विघ्नराज गणेश का आशीर्वाद और बुद्धि-सिद्धि प्राप्त होती है।',
      },
    ],
  },

  // ── Gayatri Mantra ─────────────────────────────────────────────────────────
  {
    id: 'gayatri-mantra',
    title: 'Gayatri Mantra',
    titleDevanagari: 'गायत्री मंत्र',
    deity: 'surya',
    deityEmoji: '☀️',
    tradition: 'hindu',
    type: 'mantra',
    mood: 'meditative',
    language: 'Sanskrit',
    source: 'Rigveda 3.62.10',
    description: 'The most sacred mantra of the Vedic tradition, addressed to Savitur — the divine light. Traditionally chanted at Brahma Muhurta (dawn) to illuminate the mind and awaken higher consciousness.',
    audioTrackId: 'gayatri-mantra',
    verses: [
      {
        number: 1,
        sanskrit: 'ॐ भूर्भुवः स्वः\nतत् सवितुर्वरेण्यम्\nभर्गो देवस्य धीमहि\nधियो यो नः प्रचोदयात् ॥',
        transliteration: 'Oṃ bhūr bhuvaḥ svaḥ\ntat saviturvareṇyam\nbhargo devasya dhīmahi\ndhiyo yo naḥ pracodayāt',
        meaning: 'We meditate on the divine light of that adorable Sun (Savitur), who is the creator of all three worlds — the earth (bhūr), the atmosphere (bhuvaḥ), and the heavens (svaḥ). May that divine light illuminate our intellect and inspire us towards righteous action.',
        startSecs: 0,
        meaning_hi: 'हम उस दिव्य सविता के पावन तेज का ध्यान करते हैं, जो तीनों लोकों को प्रकाशित करता है। वही परम प्रकाश हमारी बुद्धि को शुद्ध करे, हमें सही दिशा दे और धर्ममय कर्मों के लिए प्रेरित करे।',
      },
    ],
  },

  // ── Mahamrityunjaya Mantra ─────────────────────────────────────────────────
  {
    id: 'mahamrityunjaya-mantra',
    title: 'Mahamrityunjaya Mantra',
    titleDevanagari: 'महामृत्युञ्जय मंत्र',
    deity: 'shiva',
    deityEmoji: '🕉️',
    tradition: 'hindu',
    type: 'mantra',
    mood: 'protective',
    language: 'Sanskrit',
    source: 'Rigveda 7.59.12 & Yajurveda',
    description: 'The Great Death-Conquering Mantra — one of the most potent mantras in the Vedic tradition. Addressed to Lord Shiva as Tryambaka (the three-eyed one). Chanted for health, longevity, liberation from fear, and protection.',
    audioTrackId: 'mahamrityunjaya-mantra',
    verses: [
      {
        number: 1,
        sanskrit: 'ॐ त्र्यम्बकं यजामहे\nसुगन्धिं पुष्टिवर्धनम् ।\nउर्वारुकमिव बन्धनान्\nमृत्योर्मुक्षीय माऽमृतात् ॥',
        transliteration: 'Oṃ tryambakaṃ yajāmahe\nsugandhiṃ puṣṭivardhanam\nurvārukamiva bandhanān\nmṛtyormukṣīya māmṛtāt',
        meaning: 'We worship the three-eyed Lord Shiva, who is fragrant and who nourishes and grows all beings. As a cucumber is severed from its bondage to the vine, may He liberate us from death — and grant us immortality (not from it).',
        startSecs: 0,
        meaning_hi: 'हम तीन नेत्रों वाले भगवान शिव की उपासना करते हैं, जो जीवन को पोषण देने वाले और मंगलमय हैं। जैसे पका हुआ फल डंठल से सहज छूट जाता है, वैसे ही वे हमें मृत्यु और भय के बंधन से मुक्त कर अमृतस्वरूप सत्य की ओर ले जाएँ।',
      },
    ],
  },

  // ── Shiva Panchakshara Stotram ─────────────────────────────────────────────
  {
    id: 'shiva-panchakshara',
    title: 'Shiva Panchakshara Stotram',
    titleDevanagari: 'शिव पञ्चाक्षर स्तोत्रम्',
    deity: 'shiva',
    deityEmoji: '🕉️',
    tradition: 'hindu',
    type: 'stotram',
    mood: 'devotional',
    language: 'Sanskrit',
    source: 'Composed by Adi Shankaracharya',
    description: 'A five-verse hymn to Lord Shiva, each verse beginning with one syllable of the Panchakshara mantra (Na-Ma-Śi-Vā-Ya). One of the most beloved hymns of the Shaiva tradition.',
    audioTrackId: 'shiva-panchakshara',
    verses: [
      {
        number: 1,
        sanskrit: 'नागेन्द्रहाराय त्रिलोचनाय\nभस्माङ्गरागाय महेश्वराय ।\nनित्याय शुद्धाय दिगम्बराय\nतस्मै नकाराय नमः शिवाय ॥',
        transliteration: 'Nāgendrahārāya trilocanāya\nbhasmāṅgarāgāya maheśvarāya\nnityāya śuddhāya digambarāya\ntasmai nakārāya namaḥ śivāya',
        meaning: 'Salutations to Shiva, represented by the syllable "Na" — who wears the king of serpents as a garland, who has three eyes, whose body is smeared with holy ash, who is the great lord, who is eternal, pure, and clothed by the directions (the sky itself).',
        startSecs: 0,
        meaning_hi: 'नागेन्द्र हार, ललाट में चन्द्रमा, शरीर में भस्म, नेत्रों से अग्नि प्रकट करने वाले, तीनों लोकों के रक्षक, महाराज शंकर को नमन। नकार-सहित "नमः शिवाय" उनके लिए जो सनातन सत्य हैं।',
      },
      {
        number: 2,
        sanskrit: 'मन्दाकिनीसलिलचन्दनचर्चिताय\nनन्दीश्वरप्रमथनाथमहेश्वराय ।\nमन्दारपुष्पबहुपुष्पसुपूजिताय\nतस्मै मकाराय नमः शिवाय ॥',
        transliteration: 'Mandākinī salila candana carcitāya\nnandīśvara pramatha nātha maheśvarāya\nmandāra puṣpa bahu puṣpa supūjitāya\ntasmai makārāya namaḥ śivāya',
        meaning: 'Salutations to Shiva, represented by the syllable "Ma" — who is anointed with the waters of the Mandakini (Ganges) and sandalwood paste, who is the great lord of Nandishvara and the Pramathas (attendants), and who is worshipped with mandara flowers and many other blooms.',
        startSecs: 40,
        meaning_hi: 'मंदाकिनी के जल और चम्पक-पुष्प से अभिषिक्त, भस्म-शृंगार से सुशोभित, मोक्षप्रदायक, देवाधिदेव शिव को नमन। मकार-सहित "नमः शिवाय" उनके लिए।',
      },
      {
        number: 3,
        sanskrit: 'शिवाय गौरीवदनाब्जवृन्द\nसूर्याय दक्षाध्वरनाशकाय ।\nश्रीनीलकण्ठाय वृषध्वजाय\nतस्मै शिकाराय नमः शिवाय ॥',
        transliteration: 'Śivāya gaurī vadana abja vṛnda\nsūryāya dakṣādhvara nāśakāya\nśrī nīlakaṇṭhāya vṛṣadhvajāya\ntasmai śikārāya namaḥ śivāya',
        meaning: 'Salutations to Shiva, represented by the syllable "Śi" — who is the auspicious one, who is the sun to the lotus face of Gauri (Parvati), who destroyed the sacrifice of Daksha, who has a blue throat (Neelakantha), and whose flag bears the bull (Nandi).',
        startSecs: 80,
        meaning_hi: 'यक्ष, राक्षस, देव और मुनि जिनकी स्तुति करते हैं, मेघ-वर्ण वाले, नन्दी के स्वामी, त्रिपुरासुर के नाशक — उन भव को नमन। शिकार-सहित "नमः शिवाय"।',
      },
      {
        number: 4,
        sanskrit: 'वसिष्ठकुम्भोद्भवगौतमार्य\nमुनीन्द्रदेवार्चितशेखराय ।\nचन्द्रार्कवैश्वानरलोचनाय\nतस्मै वकाराय नमः शिवाय ॥',
        transliteration: 'Vasiṣṭha kumbhodbhava gautama ārya\nmunīndra devārcita śekharāya\ncandrārka vaiśvānara locanāya\ntasmai vakārāya namaḥ śivāya',
        meaning: 'Salutations to Shiva, represented by the syllable "Va" — who is worshipped by the great sages Vasishtha, Agastya, and Gautama, and by the gods, whose crown is adorned by all, and whose three eyes are the moon, the sun, and fire.',
        startSecs: 120,
        meaning_hi: 'जो रामेश्वर और नागेश में विराजमान हैं, जिनके मस्तक पर गंगा और चन्द्र हैं, सभी दुखों के हर्ता और सर्वलोक पूज्य — उन्हें नमन। वकार-सहित "नमः शिवाय।',
      },
      {
        number: 5,
        sanskrit: 'यक्षस्वरूपाय जटाधराय\nपिनाकहस्ताय सनातनाय ।\nदिव्याय देवाय दिगम्बराय\nतस्मै यकाराय नमः शिवाय ॥',
        transliteration: 'Yakṣa svarūpāya jaṭādharāya\npināka hastāya sanātanāya\ndivyāya devāya digambarāya\ntasmai yakārāya namaḥ śivāya',
        meaning: 'Salutations to Shiva, represented by the syllable "Ya" — who manifested as a Yaksha (spirit) before Brahma and Vishnu, who has matted locks of hair, who holds the Pinaka bow, who is the eternal Sanatana, who is divine, luminous, and clothed by the sky (directions).',
        startSecs: 160,
        meaning_hi: 'जो वाराणसी में निवास करते हैं और मणिकर्णिका के घाट पर मोक्ष देते हैं, सर्वज्ञ और सर्वेश्वर — उन्हें यकार-सहित "नमः शिवाय" अर्पित है। जो इस पञ्चाक्षर स्तोत्र को पढ़ता है वह शिवलोक जाता है।',
      },
    ],
  },

  // ── Guru Stotram ──────────────────────────────────────────────────────────
  {
    id: 'guru-stotram',
    title: 'Guru Stotram',
    titleDevanagari: 'गुरु स्तोत्रम्',
    deity: 'universal',
    deityEmoji: '🪔',
    tradition: 'hindu',
    type: 'stotram',
    mood: 'devotional',
    language: 'Sanskrit',
    source: 'Traditional — Guru Gita and Tantra scripture',
    description: 'A sacred hymn in praise of the Guru (spiritual teacher). Chanted to invoke the grace of one\'s teacher and to recognise the divine light that flows through the lineage of masters. Traditionally recited before any study or practice.',
    audioTrackId: 'guru-stotram',
    verses: [
      {
        number: 1,
        sanskrit: 'गुरुर्ब्रह्मा गुरुर्विष्णुः गुरुर्देवो महेश्वरः।\nगुरुरेव परं ब्रह्म तस्मै श्री गुरवे नमः॥',
        transliteration: 'Gururbrahmā gururviṣṇuḥ gururdevo maheśvaraḥ\ngurureva paraṃ brahma tasmai śrī gurave namaḥ',
        meaning: 'The Guru is Brahma, the Guru is Vishnu, the Guru is Maheshvara (Shiva). The Guru is verily the Supreme Brahman. Salutations to that revered Guru.',
        meaning_hi: 'गुरु ब्रह्मा हैं, गुरु विष्णु हैं और गुरु ही महेश्वर हैं। गुरु ही साक्षात् परब्रह्म हैं। ऐसे श्री गुरु को मेरा प्रणाम।'
      },
      {
        number: 2,
        sanskrit: 'अज्ञानतिमिरान्धस्य ज्ञानाञ्जनशलाकया।\nचक्षुरुन्मीलितं येन तस्मै श्री गुरवे नमः॥',
        transliteration: 'Ajñānatimirāndhasya jñānāñjanaśalākayā\ncakṣurunmīlitaṃ yena tasmai śrī gurave namaḥ',
        meaning: 'Salutations to the Guru who opens the eyes of one blinded by the darkness of ignorance, applying the collyrium of knowledge. What was hidden becomes unmistakably clear through that grace.',
        meaning_hi: 'अज्ञानरूपी अन्धकार से अंधे हुए मेरे नेत्रों को जिसने ज्ञानरूपी अंजन (काजल) की शलाका से खोल दिया है, उन श्री गुरु को मेरा नमस्कार है।'
      },
      {
        number: 3,
        sanskrit: 'स्थावरं जंगमं व्याप्तं यत्किंचित्सचराचरम्।\nतत्पदं दर्शितं येन तस्मै श्री गुरवे नमः॥',
        transliteration: 'Sthāvaraṃ jaṃgamaṃ vyāptaṃ yatkiṃcitsacarācaram\ntatpadaṃ darśitaṃ yena tasmai śrī gurave namaḥ',
        meaning: 'Salutations to the Guru who showed that every moving and unmoving thing is filled by the one Supreme Presence. Through the Guru, the seeker learns to see the sacred everywhere.',
        meaning_hi: 'सृष्टि के कण-कण में, चर और अचर (जड़ और चेतन) में जो परमात्मा व्याप्त है, उनका मुझे दर्शन कराने वाले श्री गुरु को मेरा प्रणाम।'
      },
      {
        number: 4,
        sanskrit: 'चिन्मयं व्यापि यत्सर्वं त्रैलोक्यं सचराचरम्।\nतत्पदं दर्शितं येन तस्मै श्री गुरवे नमः॥',
        transliteration: 'Cinmayaṃ vyāpi yatsarvaṃ trailokyaṃ sacarācaram\ntatpadaṃ darśitaṃ yena tasmai śrī gurave namaḥ',
        meaning: 'Salutations to the Guru who reveals the Supreme Truth, showing that this entire universe, across all three worlds and comprising moving and unmoving things, is pervaded by Pure Consciousness.',
        meaning_hi: 'तीनों लोकों में जड़ और चेतन सभी जगह जो चेतना-स्वरूप परमात्मा व्याप्त है, उसका साक्षात् ज्ञान कराने वाले श्री गुरुदेव को मेरा नमन।'
      },
      {
        number: 5,
        sanskrit: 'त्सर्वश्रुतिशिरोरत्नविराजितपदाम्बुजः।\nवेदान्ताम्बुजसूर्याय तस्मै श्री गुरवे नमः॥',
        transliteration: 'Tsarvaśrutiśiroratnavirājitapadāmbujaḥ\nvedāntāmbujasūryāya tasmai śrī gurave namaḥ',
        meaning: 'Salutations to the Guru whose lotus feet are adorned with the jewel of all the Vedas (Upanishads), and who is the radiant sun that blossoms the lotus of Vedanta.',
        meaning_hi: 'जिनके चरणकमल समस्त वेदों के मस्तक के रत्नों (उपनिषदों) से सुशोभित हैं, और जो वेदान्त रूपी कमल को प्रफुल्लित करने वाले सूर्य हैं, उन श्री गुरु को प्रणाम।'
      },
      {
        number: 6,
        sanskrit: 'चैतन्यः शाश्वतः शान्तो व्योमातीतो निरञ्जनः।\nबिन्दुनादकलातीतः तस्मै श्री गुरवे नमः॥',
        transliteration: 'Caitanyaḥ śāśvataḥ śānto vyomātīto nirañjanaḥ\nbindunādakalātītaḥ tasmai śrī gurave namaḥ',
        meaning: 'Salutations to the Guru who is pure consciousness, eternal, peaceful, beyond space, spotless, and who transcends the realms of Bindu (point of creation), Nada (primordial sound), and Kala (manifest parts).',
        meaning_hi: 'जो शुद्ध चैतन्य, शाश्वत, शांत, आकाश से भी परे और दोषरहित हैं, तथा जो बिंदु, नाद और कला से भी अतीत हैं, उन श्री गुरु को मेरा नमन।'
      },
      {
        number: 7,
        sanskrit: 'ज्ञानशक्तिसमारूढः तत्त्वमालाविभूषितः।\nभुक्तिमुक्तिप्रदाता च तस्मै श्री गुरवे नमः॥',
        transliteration: 'Jñānaśaktisamārūḍhaḥ tattvamālāvibhūṣitaḥ\nbhuktimuktipradātā ca tasmai śrī gurave namaḥ',
        meaning: 'Salutations to the Guru who is established in the power of supreme knowledge, adorned with the garland of ultimate truths, and who bestows both worldly fulfillment (bhukti) and spiritual liberation (mukti).',
        meaning_hi: 'ज्ञान और शक्ति से परिपूर्ण, तत्त्वों की माला से सुशोभित, तथा भोग और मोक्ष दोनों प्रदान करने वाले श्री गुरु को मेरा प्रणाम।'
      },
      {
        number: 8,
        sanskrit: 'अनेकजन्मसम्प्राप्तकर्मबन्धविदाहिने।\nआत्मज्ञानप्रदानेन तस्मै श्री गुरवे नमः॥',
        transliteration: 'Anekajanmasamprāptakarmabandhavidāhine\nātmajñānapradānena tasmai śrī gurave namaḥ',
        meaning: 'Salutations to the Guru who, by bestowing the light of Self-knowledge, burns away the bondage of karmas accumulated across countless lifetimes.',
        meaning_hi: 'आत्मज्ञान प्रदान करके अनेक जन्मों के संचित कर्मों के बंधन को भस्म कर देने वाले श्री गुरुदेव को मेरा नमस्कार है।'
      }
    ]
  },

  // ── Om Namah Shivaya ──────────────────────────────────────────────────────
  {
    id: 'om-namah-shivaya',
    title: 'Om Namah Shivaya',
    titleDevanagari: 'ॐ नमः शिवाय',
    deity: 'shiva',
    deityEmoji: '🕉️',
    tradition: 'hindu',
    type: 'mantra',
    mood: 'meditative',
    language: 'Sanskrit',
    source: 'Krishna Yajurveda — Sri Rudram, 8th Anuvaka',
    description: 'The Panchakshara mantra — five syllables (Na-Ma-Śi-Vā-Ya) that are the heart of Shaiva devotion. Each syllable represents one of the five elements: earth, water, fire, air, and space. Chanted for purification, liberation, and union with Shiva-consciousness.',
    audioTrackId: 'om-namah-shivaya',
    verses: [
      {
        number: 1,
        sanskrit: 'ॐ नमः शिवाय',
        transliteration: 'Oṃ namaḥ śivāya',
        meaning: 'Salutations to the auspicious one — to Shiva. "Na" is earth, "Ma" is water, "Śi" is fire, "Vā" is air, "Ya" is space. The mantra honours Shiva in all five elements of creation.',
        startSecs: 0,
        meaning_hi: 'यह मंत्र भगवान शिव को नमस्कार है, जो समस्त सृष्टि में व्याप्त कल्याणस्वरूप चेतना हैं। इसके पाँच अक्षर पंचमहाभूतों का स्मरण कराते हैं और साधक को भीतर और बाहर दोनों स्तरों पर शुद्धि की ओर ले जाते हैं।',
      },
    ],
  },

  // ── Hare Krishna Maha Mantra ───────────────────────────────────────────────
  {
    id: 'hare-krishna-maha-mantra',
    title: 'Hare Krishna Maha Mantra',
    titleDevanagari: 'हरे कृष्ण महामंत्र',
    deity: 'vishnu',
    deityEmoji: '🪈',
    tradition: 'hindu',
    type: 'mantra',
    mood: 'celebratory',
    language: 'Sanskrit',
    source: 'Kali-Santarana Upanishad; Gaudiya Vaishnava tradition',
    description: 'A central Vaishnava mantra invoking Krishna, Rama, and the divine energy of Hari. Chanted as sankirtan, japa, and congregational kirtan for purification of the heart and remembrance of the Divine.',
    audioTrackId: 'kirtana-in-hindi',
    verses: [
      {
        number: 1,
        sanskrit: 'हरे कृष्ण हरे कृष्ण\nकृष्ण कृष्ण हरे हरे ।\nहरे राम हरे राम\nराम राम हरे हरे ॥',
        transliteration: 'Hare Kṛṣṇa Hare Kṛṣṇa\nKṛṣṇa Kṛṣṇa Hare Hare\nHare Rāma Hare Rāma\nRāma Rāma Hare Hare',
        meaning: 'O Divine energy of Hari, O Krishna, O Rama — please engage me in loving remembrance and service. The mantra is a call of devotion, surrender, and joyful return to the Divine Name.',
        startSecs: 0,
        meaning_hi: 'यह महा-मंत्र भगवान और उनकी दिव्य शक्ति को प्रेमपूर्ण पुकार है। इसका जप हृदय को शुद्ध करता है, अहंकार को नरम करता है और साधक को नाम-स्मरण तथा भक्ति की सरल अवस्था में ले जाता है।',
      },
    ],
  },

  // ── Om Namo Bhagavate Vasudevaya ──────────────────────────────────────────
  {
    id: 'om-namo-bhagavate-vasudevaya',
    title: 'Om Namo Bhagavate Vasudevaya',
    titleDevanagari: 'ॐ नमो भगवते वासुदेवाय',
    deity: 'vishnu',
    deityEmoji: '🐚',
    tradition: 'hindu',
    type: 'mantra',
    mood: 'devotional',
    language: 'Sanskrit',
    source: 'Bhagavata Purana and Vaishnava mantra tradition',
    description: 'The twelve-syllable mantra of Bhagavan Vasudeva, widely used in Vaishnava japa and meditation. Chanted for devotion, surrender, protection, and inner clarity.',
    verses: [
      {
        number: 1,
        sanskrit: 'ॐ नमो भगवते वासुदेवाय',
        transliteration: 'Oṃ namo bhagavate vāsudevāya',
        meaning: 'Om. Salutations to Bhagavan Vasudeva, the indwelling Lord present in all beings. The mantra expresses surrender to the Divine source and sustainer of life.',
        startSecs: 0,
        meaning_hi: 'यह मंत्र भगवान वासुदेव को समर्पित प्रणाम है, जो सबके भीतर निवास करने वाले परमात्मा हैं। इसका जप मन में समर्पण, स्थिरता और ईश्वर की सर्वव्यापक उपस्थिति का अनुभव जगाता है।',
      },
    ],
  },

  // ── Sri Ram Jai Ram Jai Jai Ram ───────────────────────────────────────────
  {
    id: 'sri-ram-jai-ram',
    title: 'Sri Ram Jai Ram Jai Jai Ram',
    titleDevanagari: 'श्री राम जय राम जय जय राम',
    deity: 'vishnu',
    deityEmoji: '🏹',
    tradition: 'hindu',
    type: 'mantra',
    mood: 'devotional',
    language: 'Sanskrit',
    source: 'Rama bhakti and nama-japa tradition',
    description: 'A beloved Rama nama mantra used in japa, kirtan, and daily remembrance. Chanted for courage, steadiness, dharma, and devotion to Lord Rama.',
    verses: [
      {
        number: 1,
        sanskrit: 'श्री राम जय राम जय जय राम',
        transliteration: 'Śrī Rāma jaya Rāma jaya jaya Rāma',
        meaning: 'Glory to Sri Rama. Victory to Rama again and again. The mantra invokes Rama as the embodiment of dharma, compassion, courage, and righteous action.',
        startSecs: 0,
        meaning_hi: 'यह रामनाम का मंगलमय जयघोष है, जो जीवन में धर्म, करुणा और साहस को जगाता है। बार-बार इसका जप करने से मन स्थिर होता है और श्रीराम की मर्यादा साधक के भीतर जागती है।',
      },
    ],
  },

  // ── Ganesha Mantra ────────────────────────────────────────────────────────
  {
    id: 'om-gam-ganapataye-namah',
    title: 'Om Gam Ganapataye Namah',
    titleDevanagari: 'ॐ गं गणपतये नमः',
    deity: 'ganesha',
    deityEmoji: '🐘',
    tradition: 'hindu',
    type: 'mantra',
    mood: 'gratitude',
    language: 'Sanskrit',
    source: 'Traditional Ganesha bija mantra',
    description: 'A concise mantra for invoking Ganesha, remover of obstacles and guardian of auspicious beginnings. Chanted before study, travel, work, and new undertakings.',
    verses: [
      {
        number: 1,
        sanskrit: 'ॐ गं गणपतये नमः',
        transliteration: 'Oṃ gaṃ gaṇapataye namaḥ',
        meaning: 'Om. Salutations to Ganapati. May obstacles be removed, wisdom awaken, and the path ahead become clear and auspicious.',
        startSecs: 0,
        meaning_hi: 'यह गणपति को नमस्कार करने वाला मंत्र है, जो विघ्नों को दूर करने वाले और शुभारम्भ के अधिष्ठाता माने जाते हैं। इसका जप बुद्धि, स्पष्टता और आगे के मार्ग में मंगल की प्रार्थना है।',
      },
    ],
  },

  // ── Waheguru Simran ───────────────────────────────────────────────────────
  {
    id: 'waheguru-simran',
    title: 'Waheguru Simran',
    titleDevanagari: 'ਵਾਹਿਗੁਰੂ ਸਿਮਰਨ',
    deity: 'universal',
    deityEmoji: '☬',
    tradition: 'sikh',
    type: 'simran',
    mood: 'meditative',
    language: 'Gurmukhi',
    source: 'Sikh Naam Simran tradition',
    description: 'Naam Simran on Waheguru, the wondrous Guru. Practised for remembrance, humility, steadiness, and living awareness of the Divine.',
    verses: [
      {
        number: 1,
        sanskrit: 'ਵਾਹਿਗੁਰੂ',
        transliteration: 'Vāhigurū',
        meaning: 'Wondrous Guru. A remembrance of the Divine wisdom that carries the seeker from darkness into light.',
        startSecs: 0,
        meaning_hi: 'वाहेगुरु का स्मरण उस अद्भुत दिव्य प्रकाश को याद करना है जो साधक को अज्ञान से ज्ञान की ओर ले जाता है। यह नाम मन को विनम्र, सजग और प्रभु की उपस्थिति में स्थिर करता है।',
        meaning_pa: 'ਵਾਹਿਗੁਰੂ ਦਾ ਸਿਮਰਨ ਰੱਬੀ ਜੋਤ ਦੀ ਯਾਦ ਹੈ, ਜੋ ਮਨੁੱਖ ਨੂੰ ਅਗਿਆਨ ਦੇ ਹਨੇਰੇ ਤੋਂ ਸਚ ਦੇ ਚਾਨਣ ਵੱਲ ਲੈ ਜਾਂਦਾ ਹੈ। ਇਹ ਨਾਮ ਮਨ ਨੂੰ ਨਿਮਰ, ਸਚੇਤ ਅਤੇ ਹਜ਼ੂਰੀ ਵਿੱਚ ਟਿਕਾਉਂਦਾ ਹੈ। ਜਿੰਨਾ ਜਪਿਆ ਜਾਵੇ, ਉੱਨਾ ਹੀ ਅੰਦਰ ਸੁਖ ਅਤੇ ਸਹਜ ਵੱਸਦਾ ਹੈ।',
      },
    ],
  },

  // ── Namokar Mantra (Jain) ─────────────────────────────────────────────────
  {
    id: 'namokar-mantra',
    title: 'Namokar Mantra',
    titleDevanagari: 'णमोकार मंत्र',
    deity: 'universal',
    deityEmoji: '🤲',
    tradition: 'jain',
    type: 'mantra',
    mood: 'devotional',
    language: 'Sanskrit',
    source: 'Jain Agamas — the most sacred Jain prayer',
    description: 'The Navkar Mantra — the supreme prayer of the Jain tradition. It salutes the five supreme beings (Pancha Parameshthi) and is chanted for purification of the mind, merit, and liberation.',
    verses: [
      {
        number: 1,
        sanskrit: 'णमो अरिहंताणं\nणमो सिद्धाणं\nणमो आयरियाणं\nणमो उवज्झायाणं\nणमो लोए सव्व साहूणं',
        transliteration: 'Ṇamo arihantāṇaṃ\nṇamo siddhāṇaṃ\nṇamo āyariyāṇaṃ\nṇamo uvajjhāyāṇaṃ\nṇamo loe savva sāhūṇaṃ',
        meaning: 'I bow to the Arihantas (liberated souls still in body). I bow to the Siddhas (perfected liberated souls). I bow to the Acharyas (spiritual heads of the Jain order). I bow to the Upadhyayas (teachers of scriptures). I bow to all the Sadhus (monks and nuns) in the world.',
        startSecs: 0,
        meaning_hi: 'यह मंत्र जैन धर्म के पाँच परम पूज्य स्वरूपों को नमस्कार है। इसका जप मन को नम्र करता है, आत्मा को पवित्र बनाता है और साधक को मुक्ति के मार्ग पर चलने की प्रेरणा देता है।',
      },
    ],
  },

  // ── Om Mani Padme Hum (Buddhist) ──────────────────────────────────────────
  {
    id: 'om-mani-padme-hum',
    title: 'Om Mani Padme Hum',
    titleDevanagari: 'ॐ मणि पद्मे हूँ',
    deity: 'universal',
    deityEmoji: '☸️',
    tradition: 'buddhist',
    type: 'mantra',
    mood: 'meditative',
    language: 'Sanskrit',
    source: 'Karandavyuha Sutra — associated with Avalokiteshvara',
    description: 'The six-syllable mantra of Avalokiteshvara (Bodhisattva of Compassion). One of the most widely chanted mantras in Tibetan Buddhism. Each syllable purifies the six realms of existence and cultivates the six perfections (paramitas).',
    verses: [
      {
        number: 1,
        sanskrit: 'ॐ मणि पद्मे हूँ',
        transliteration: 'Oṃ maṇi padme hūṃ',
        meaning: '"Om — the jewel in the lotus — Hum." The jewel (maṇi) represents the enlightened mind and compassion; the lotus (padme) represents wisdom. Together they invoke Avalokiteshvara\'s compassion to purify the mind and heart.',
        startSecs: 0,
        meaning_hi: 'यह मंत्र करुणा और प्रज्ञा के मिलन का स्मरण कराता है। इसमें कमल की निर्मलता और मणि की दिव्य आभा के माध्यम से हृदय को शुद्ध करने और करुणा को जागृत करने की साधना निहित है।',
      },
    ],
  },
  // ── Shiva Tandava Stotram ──────────────────────────────────────────────────
  {
    id: 'shiva-tandava',
    title: 'Shiva Tandava Stotram',
    titleDevanagari: 'शिवताण्डवस्तोत्रम्',
    deity: 'shiva',
    deityEmoji: '🕉️',
    tradition: 'hindu',
    type: 'stotram',
    mood: 'energetic',
    language: 'Sanskrit',
    source: 'Composed by Ravana',
    description: 'A powerful dynamic stotram composed by Ravana in praise of Lord Shiva\'s divine cosmic dance. It represents the pinnacle of Sanskrit rhythmic meter and Shaiva aesthetics.',
    verses: [
      {
        number: 1,
        sanskrit: 'जटाटवीगलज्जलप्रवाहपावितस्थले\nगलेऽवलम्ब्य लम्बितां भुजङ्गतुङ्गमालिकाम् ।\nडमड्डमड्डमड्डमन्निनादवडड्डमर्वयं\nचकार चण्डताण्डवं तनोतु नः शिवः शिवम् ॥',
        transliteration: 'Jaṭāṭavīgalajjala pravāhapāvitasthale\ngale\'valambya lambitāṃ bhujaṅgatuṅgamālikām\ndamaddamad damaddaman ninādavaddamarvayaṃ\ncakāra caṇḍatāṇḍavaṃ tanotu naḥ śivaḥ śivam',
        meaning: 'May Lord Shiva, who has matted locks like a forest purified by the flowing Ganges, who wears a garland of snakes around His neck, and who danced His fierce Tandava to the rhythmic sound of the damaru, bestow auspiciousness upon us.',
        startSecs: 0,
        meaning_hi: 'यहाँ भगवान शिव के उस प्रचंड ताण्डव का ध्यान है जिसमें उनकी जटाओं से गंगाजल प्रवाहित हो रहा है और गले में सर्पमाला सुशोभित है। डमरू की गूँज के साथ उनका यह नृत्य समस्त जगत को शुद्ध करने वाला और परम मंगल देने वाला माना गया है।',
        sync_metadata: [
          { start: 0, end: 2000, word: 'जटाटवी' },
          { start: 2000, end: 4000, word: 'गलज्जल' },
          { start: 4000, end: 6000, word: 'प्रवाह' },
          { start: 6000, end: 8000, word: 'पावितस्थले' },
          { start: 8000, end: 10000, word: "गलेऽवलम्ब्य" },
          { start: 10000, end: 12000, word: 'लम्बितां' },
          { start: 12000, end: 14000, word: 'भुजङ्गतुङ्ग' },
          { start: 14000, end: 16000, word: 'मालिकाम्' },
          { start: 16000, end: 17000, word: '।' },
          { start: 17000, end: 19000, word: 'डमड्डमड्डमड्डमन्' },
          { start: 19000, end: 21000, word: 'निनाद' },
          { start: 21000, end: 23000, word: 'वड्डमर्वयं' },
          { start: 23000, end: 25000, word: 'चकार' },
          { start: 25000, end: 27000, word: 'चण्डताण्डवं' },
          { start: 27000, end: 29000, word: 'तनोतु' },
          { start: 29000, end: 30000, word: 'नः' },
          { start: 30000, end: 31500, word: 'शिवः' },
          { start: 31500, end: 33000, word: 'शिवम्' },
          { start: 33000, end: 34000, word: '।।' }
        ]
      }
    ]
  },
  // ── Madhurashtakam ──────────────────────────────────────────────────────────
  {
    id: 'madhurashtakam',
    title: 'Madhurashtakam',
    titleDevanagari: 'मधुराष्टकम्',
    deity: 'vishnu',
    deityEmoji: '🪈',
    tradition: 'hindu',
    type: 'bhajan',
    mood: 'devotional',
    language: 'Sanskrit',
    source: 'Composed by Sri Vallabhacharya (15th century)',
    description: 'An exquisitely sweet stotram describing the sweetness (madhura) of Lord Krishna. Every single aspect of the Lord of Sweetness is sweet.',
    verses: [
      {
        number: 1,
        sanskrit: 'अधरं मधुरं वदनं मधुरं\nनयनं मधुरं हसितं मधुरम् ।\nहृदयं मधुरं गमनं मधुरं\nमधुराधिपतेरखिलं मधुरम् ॥',
        transliteration: 'Adharaṃ madhuraṃ vadanaṃ madhuraṃ\nnayanaṃ madhuraṃ hasitaṃ madhuram\nhṛdayaṃ madhuraṃ gamanaṃ madhuraṃ\nmadhurādhipaterakhilaṃ madhuram',
        meaning: 'His lips are sweet, His face is sweet, His eyes are sweet, and His smile is sweet. His heart and even His gait are sweet; everything about the Lord of Sweetness is sweet.',
        startSecs: 0,
        meaning_hi: 'कृष्ण के अधर, मुख, नेत्र और मुस्कान — सब कुछ मधुर है। उनका हृदय, उनका चलना और उनका सम्पूर्ण स्वरूप ऐसा है कि उसमें केवल प्रेम, रस और माधुर्य ही अनुभव होता है।',
      },
      {
        number: 2,
        sanskrit: 'वचनं मधुरं चरितं मधुरं\nवसनं मधुरं वलितं मधुरम् ।\nचलितं मधुरं भ्रमितं मधुरं\nमधुराधिपतेरखिलं मधुरम् ॥',
        transliteration: 'Vacanaṃ madhuraṃ caritaṃ madhuraṃ\nvasanaṃ madhuraṃ valitaṃ madhuram\ncalitaṃ madhuraṃ bhramitaṃ madhuraṃ\nmadhurādhipaterakhilaṃ madhuram',
        meaning: 'His speech is sweet, His deeds are sweet, His garments are sweet, and His graceful bearing is sweet. His movements and wanderings are sweet; everything about the Lord of Sweetness is sweet.',
        meaning_hi: 'कृष्ण की वाणी मधुर है, उनका आचरण मधुर है और उनके वस्त्र भी मधुर लगते हैं। वे जैसे चलते हैं, जैसे विहार करते हैं, उसमें भी वही आकर्षक माधुर्य प्रकट होता है जो भक्त के मन को बाँध लेता है।',
      },
      {
        number: 3,
        sanskrit: 'वेणुर्मधुरो रेणुर्मधुरः\nपाणिर्मधुरः पादौ मधुरौ ।\nनृत्यं मधुरं सख्यं मधुरं\nमधुराधिपतेरखिलं मधुरम् ॥',
        transliteration: 'Veṇurmadhuro reṇurmadhuraḥ\npāṇirmadhuraḥ pādau madhurau\nnṛtyaṃ madhuraṃ sakhyaṃ madhuraṃ\nmadhurādhipaterakhilaṃ madhuram',
        meaning: 'His flute is sweet, the dust around Him is sweet, His hands are sweet, and His feet are sweet. His dance and friendship are sweet; everything about the Lord of Sweetness is sweet.',
        meaning_hi: 'उनकी बांसुरी की धुन मधुर है, उनके चरणों की धूल भी मधुर है। उनके हाथ, चरण, नृत्य और सखा-भाव — सब कुछ ऐसा है कि भक्त का हृदय सहज ही प्रेम से भर उठता है।',
      },
      {
        number: 4,
        sanskrit: 'गीतं मधुरं पीतं मधुरं\nभुक्तं मधुरं सुप्तं मधुरम् ।\nरूपं मधुरं तिलकं मधुरं\nमधुराधिपतेरखिलं मधुरम् ॥',
        transliteration: 'Gītaṃ madhuraṃ pītaṃ madhuraṃ\nbhuktaṃ madhuraṃ suptaṃ madhuram\nrūpaṃ madhuraṃ tilakaṃ madhuraṃ\nmadhurādhipaterakhilaṃ madhuram',
        meaning: 'His song is sweet, what He drinks is sweet, what He eats is sweet, and even His sleep is sweet. His form and the tilaka upon Him are sweet; everything about the Lord of Sweetness is sweet.',
        meaning_hi: 'कृष्ण का गीत मधुर है, उनका भोजन मधुर है और उनका विश्राम भी मधुर है। उनका रूप और उनके मस्तक का तिलक इतना मनोहर है कि भक्त उन्हें निहारते-निहारते तृप्त नहीं होता।',
      },
      {
        number: 5,
        sanskrit: 'करणं मधुरं तरणं मधुरं\nहरणं मधुरं रमणं मधुरम् ।\nवमितं मधुरं शमितं मधुरं\nमधुराधिपतेरखिलं मधुरम् ॥',
        transliteration: 'Karaṇaṃ madhuraṃ taraṇaṃ madhuraṃ\nharaṇaṃ madhuraṃ ramaṇaṃ madhuram\nvamitaṃ madhuraṃ śamitaṃ madhuraṃ\nmadhurādhipaterakhilaṃ madhuram',
        meaning: 'His acts are sweet, His deliverance is sweet, His stealing is sweet, and His loving play is sweet. What He offers and what He quiets are sweet; everything about the Lord of Sweetness is sweet.',
        meaning_hi: 'कृष्ण की हर लीला मधुर है, उनका तारना मधुर है और उनका चितचोर बन जाना भी मधुर है। वे जो देते हैं, जो हर लेते हैं और जिससे मन को शांत करते हैं, वह सब भक्त के लिए प्रेमरस से भरा हुआ है।',
      },
      {
        number: 6,
        sanskrit: 'गुञ्जा मधुरा माला मधुरा\nयमुना मधुरा वीची मधुरा ।\nसलिलं मधुरं कमलं मधुरं\nमधुराधिपतेरखिलं मधुरम् ॥',
        transliteration: 'Guñjā madhurā mālā madhurā\nyamunā madhurā vīcī madhurā\nsalilaṃ madhuraṃ kamalaṃ madhuraṃ\nmadhurādhipaterakhilaṃ madhuram',
        meaning: 'His guñjā necklace is sweet, His garland is sweet, the Yamunā is sweet, and her waves are sweet. Her waters and lotuses are sweet; everything about the Lord of Sweetness is sweet.',
        meaning_hi: 'कृष्ण की गुञ्जा-माला मधुर है, उनकी वनमाला मधुर है और यमुना भी मधुर है। उसकी लहरें, उसका जल और उसके कमल — सब कुछ उस माधुर्य में डूबा है जो श्रीकृष्ण से प्रकट होता है।',
      },
      {
        number: 7,
        sanskrit: 'गोपी मधुरा लीला मधुरा\nयुक्तं मधुरं मुक्तं मधुरम् ।\nदृष्टं मधुरं शिष्टं मधुरं\nमधुराधिपतेरखिलं मधुरम् ॥',
        transliteration: 'Gopī madhurā līlā madhurā\nyuktaṃ madhuraṃ muktaṃ madhuram\ndṛṣṭaṃ madhuraṃ śiṣṭaṃ madhuraṃ\nmadhurādhipaterakhilaṃ madhuram',
        meaning: 'His gopīs are sweet, His līlā is sweet, His union is sweet, and His liberation is sweet. His glance and His refined conduct are sweet; everything about the Lord of Sweetness is sweet.',
        meaning_hi: 'उनकी गोपियाँ मधुर हैं और उनकी लीला भी मधुर है। उनका मिलन, उनकी कृपा-दृष्टि और उनका कोमल, सुसंस्कृत व्यवहार — सबमें वही दिव्य प्रेमरस झलकता है जो साधक को भीतर से बदल देता है।',
      },
      {
        number: 8,
        sanskrit: 'गोपा मधुरा गावो मधुरा\nयष्टिर्मधुरा सृष्टिर्मधुरा ।\nदलितं मधुरं फलितं मधुरं\nमधुराधिपतेरखिलं मधुरम् ॥',
        transliteration: 'Gopā madhurā gāvo madhurā\nyaṣṭirmadhurā sṛṣṭirmadhurā\ndalitaṃ madhuraṃ phalitaṃ madhuraṃ\nmadhurādhipaterakhilaṃ madhuram',
        meaning: 'His cowherd friends are sweet, His cows are sweet, His herding staff is sweet, and His creation is sweet. What He breaks and what He brings to fruition are sweet; everything about the Lord of Sweetness is sweet.',
        meaning_hi: 'कृष्ण के ग्वालबाल मधुर हैं, उनकी गौएँ मधुर हैं और उनकी गोपाल-दण्डिका भी मधुर है। वे जो रचते हैं, जो तोड़ते हैं और जिसे सिद्ध करते हैं, वह सब भी उसी परम माधुर्य का विस्तार है।',
      }
    ]
  },
  // ── Deh Shiva Bar Mohe ──────────────────────────────────────────────────────
  {
    id: 'deh-shiva-bar-mohe',
    title: 'Deh Shiva Bar Mohe',
    titleDevanagari: 'ਦੇਹ ਸਿਵਾ ਬਰੁ ਮੋਹਿ',
    deity: 'universal',
    deityEmoji: 'ੴ',
    tradition: 'sikh',
    type: 'bhajan',
    mood: 'energetic',
    language: 'Brajobhasha / Gurmukhi',
    source: 'Composed by Guru Gobind Singh Ji — Chandi Charitar',
    description: 'A powerful dynamic shabad (hymn) requesting a boon of courage, righteousness, and fearlessness in the battle of life. The ultimate anthem of spiritual and moral courage.',
    verses: [
      {
        number: 1,
        sanskrit: 'ਦੇਹ ਸਿਵਾ ਬਰੁ ਮੋਹਿ ਇਹੈ\nਸੁਭ ਕਰਮਨ ਤੇ ਕਬਹੂੰ ਨ ਟਰੋਂ ।\nਨ ਡਰੋਂ ਅਰਿ ਸੋ ਜਬ ਜਾਇ ਲਰੋਂ\nਨਿਸਚੈ ਕਰਿ ਅਪਨੀ ਜੀਤ ਕਰੋਂ ॥',
        transliteration: 'Deh śivā bar mohe ihai\nsubh karman te kabhūṅ na taroṅ\nna daroṅ ari so jab jāe laroṅ\nnisacai kar apnī jīt karoṅ',
        meaning: 'O Divine Power, grant me this boon: may I never hold back from performing righteous deeds. May I have no fear of the enemy when I go into battle, and with determination, may I secure my victory.',
        startSecs: 0,
        meaning_hi: 'हे दिव्य शक्ति, मुझे यह वरदान दो कि मैं शुभ कर्मों से कभी पीछे न हटूँ। जब धर्म के लिए संघर्ष का समय आए, तब मैं निर्भय रहूँ और दृढ़ निश्चय के साथ सत्य की विजय के लिए खड़ा हो सकूँ।',
        meaning_pa: 'ਹੇ ਅਕਾਲ ਪੁਰਖ, ਮੈਨੂੰ ਇਹ ਵਰ ਬਖ਼ਸ਼ੋ ਕਿ ਮੈਂ ਸੁਭ ਕਰਮਾਂ ਤੋਂ ਕਦੇ ਪਿੱਛੇ ਨਾ ਹਟਾਂ। ਜਦੋਂ ਧਰਮ ਦੀ ਰੱਖਿਆ ਲਈ ਡਟਣਾ ਪਏ, ਤਦੋਂ ਮੇਰੇ ਅੰਦਰ ਡਰ ਨਾ ਹੋਵੇ। ਦ੍ਰਿੜ ਨਿਸਚੇ ਨਾਲ ਮੈਂ ਸੱਚ ਅਤੇ ਨਿਆਂ ਦੀ ਜਿੱਤ ਲਈ ਖੜਾ ਰਹਾਂ।',
        sync_metadata: [
          { start: 0, end: 1500, word: 'ਦੇਹ' },
          { start: 1500, end: 3000, word: 'ਸਿਵਾ' },
          { start: 3000, end: 4500, word: 'ਬਰੁ' },
          { start: 4500, end: 6000, word: 'ਮੋਹਿ' },
          { start: 6000, end: 7500, word: 'ਇਹੈ' },
          { start: 7500, end: 9000, word: 'ਸੁਭ' },
          { start: 9000, end: 10500, word: 'ਕਰਮਨ' },
          { start: 10500, end: 12000, word: 'ਤੇ' },
          { start: 12000, end: 13500, word: 'ਕਬਹੂੰ' },
          { start: 13500, end: 14500, word: 'ਨ' },
          { start: 14500, end: 16000, word: 'ਟਰੋਂ' },
          { start: 16000, end: 16500, word: '।' },
          { start: 16500, end: 18000, word: 'ਨ' },
          { start: 18000, end: 19500, word: 'ਡਰੋਂ' },
          { start: 19500, end: 21000, word: 'ਅਰਿ' },
          { start: 21000, end: 22500, word: 'ਸੋ' },
          { start: 22500, end: 24000, word: 'ਜਬ' },
          { start: 24000, end: 25500, word: 'ਜਾਇ' },
          { start: 25500, end: 27000, word: 'ਲਰੋਂ' },
          { start: 27000, end: 28500, word: 'ਨਿਸਚੈ' },
          { start: 28500, end: 30000, word: 'ਕਰਿ' },
          { start: 30000, end: 31500, word: 'ਅਪਨੀ' },
          { start: 31500, end: 33000, word: 'ਜੀਤ' },
          { start: 33000, end: 34500, word: 'ਕਰੋਂ' },
          { start: 34500, end: 35500, word: '॥' }
        ]
      }
    ]
  },
  // ── Buddham Saranam Gacchami ────────────────────────────────────────────────
  {
    id: 'buddham-saranam',
    title: 'Buddham Saranam Gacchami',
    titleDevanagari: 'बुद्धं शरणं गच्छामि',
    deity: 'universal',
    deityEmoji: '☸️',
    tradition: 'buddhist',
    type: 'mantra',
    mood: 'meditative',
    language: 'Pali',
    source: 'The Three Refuges (Trisarana) — Khuddakapatha',
    description: 'The foundational refuge mantra of the Buddhist tradition, expressing shelter and alignment with the Buddha (the Awakened One), the Dharma (the Truth), and the Sangha (the Community).',
    verses: [
      {
        number: 1,
        sanskrit: 'बुद्धं शरणं गच्छामि\nधर्मं शरणं गच्छामि\nसंघं शरणं गच्छामि',
        transliteration: 'Buddhaṃ saraṇaṃ gacchāmi\nDharmaṃ saraṇaṃ gacchāmi\nSaṅghaṃ saraṇaṃ gacchāmi',
        meaning: 'I take refuge in the Buddha (Awakened Wisdom). I take refuge in the Dharma (Cosmic Law & Path). I take refuge in the Sangha (Noble Spiritual Community).',
        startSecs: 0,
        meaning_hi: 'मैं बुद्ध की शरण जाता हूँ, अर्थात जागृति और करुणा के मार्ग को स्वीकार करता हूँ। मैं धर्म की शरण जाता हूँ, यानी सत्य और साधना के पथ को अपनाता हूँ। मैं संघ की शरण जाता हूँ, अर्थात उन सहयात्रियों के समुदाय में आश्रय लेता हूँ जो मुक्ति की ओर अग्रसर हैं।',
        sync_metadata: [
          { start: 0, end: 1200, word: 'बुद्धं' },
          { start: 1200, end: 2400, word: 'शरणं' },
          { start: 2400, end: 3600, word: 'गच्छामि' },
          { start: 3600, end: 4800, word: 'धर्मं' },
          { start: 4800, end: 6000, word: 'शरणं' },
          { start: 6000, end: 7200, word: 'गच्छामि' },
          { start: 7200, end: 8400, word: 'संघं' },
          { start: 8400, end: 9600, word: 'शरणं' },
          { start: 9600, end: 11000, word: 'गच्छामि' }
        ]
      }
    ]
  },
  // ── Bhaktamar Stotra ────────────────────────────────────────────────────────
  {
    id: 'bhaktamar-stotra',
    title: 'Bhaktamar Stotra',
    titleDevanagari: 'भक्तामर स्तोत्र',
    deity: 'universal',
    deityEmoji: '🪷',
    tradition: 'jain',
    type: 'stotram',
    mood: 'devotional',
    language: 'Sanskrit',
    source: 'Composed by Acharya Manatunga (7th century CE)',
    description: 'The most celebrated Jain hymn composed in praise of Adinatha (Rishabhadeva), the first Tirthankara. The title "Bhaktamara" comes from its opening word, referencing the bowing of celestial devotees.',
    verses: [
      {
        number: 1,
        sanskrit: 'भक्तामर-प्रणत-मौलि-मणि-प्रभाणा-\nमुद्योतकं दलित-पाप-तमो-वितानम् ।\nसम्यक्-प्रणम्य जिन-पाद-युगं युगादा-\nवालम्बनं भव-जले पततां जनानाम् ॥',
        transliteration: 'Bhaktāmara-praṇata-mauli-maṇi-prabhāṇām\nuddyotakaṃ dalita-pāpa-tamo-vitānam\nsamyak-praṇamya jina-pāda-yugaṃ yugādāv\nālambanaṃ bhava-jale patatāṃ janānām',
        meaning: 'I offer my deepest salutations to the lotus feet of the Jina Adinatha, which shine like the crest-jewels of bowing celestial beings, which destroy the darkness of karmic sins, and which are the sole support for people drowning in the worldly ocean.',
        startSecs: 0,
        meaning_hi: 'मैं आदिनाथ जिनेंद्र के उन पावन चरणों को प्रणाम करता हूँ जो झुके हुए देवों के मुकुट-मणियों से भी अधिक तेजस्वी हैं। वे कर्मजन्य अंधकार को मिटाते हैं और संसार-सागर में डूबते जीवों के लिए सच्चा आश्रय बनते हैं।',
        sync_metadata: [
          { start: 0, end: 2000, word: 'भक्तामर' },
          { start: 2000, end: 4000, word: 'प्रणत' },
          { start: 4000, end: 6000, word: 'मौलि' },
          { start: 6000, end: 8000, word: 'मणि' },
          { start: 8000, end: 9500, word: 'प्रभाणाम्' },
          { start: 9500, end: 11000, word: 'उद्योतकं' },
          { start: 11000, end: 12500, word: 'दलित' },
          { start: 12500, end: 14000, word: 'पाप' },
          { start: 14000, end: 15500, word: 'तमो' },
          { start: 15500, end: 17000, word: 'वितानम्' },
          { start: 17000, end: 17500, word: '।' },
          { start: 17500, end: 19000, word: 'सम्यक्' },
          { start: 19000, end: 20500, word: 'प्रणम्य' },
          { start: 20500, end: 22000, word: 'जिन' },
          { start: 22000, end: 23500, word: 'पाद' },
          { start: 23500, end: 25000, word: 'युगं' },
          { start: 25000, end: 26500, word: 'युगादाव्' },
          { start: 26500, end: 28000, word: 'आलम्बनं' },
          { start: 28000, end: 29500, word: 'भव' },
          { start: 29500, end: 31000, word: 'जले' },
          { start: 31000, end: 32500, word: 'पततां' },
          { start: 32500, end: 34000, word: 'जनानाम्' },
          { start: 34000, end: 35000, word: '।।' }
        ]
      }
    ]
  },
  // ── Nirvana Shatakam ───────────────────────────────────────────────────────
  {
    id: 'nirvana-shatakam',
    title: 'Nirvana Shatakam',
    titleDevanagari: 'निर्वाणषट्कम्',
    deity: 'shiva',
    deityEmoji: '🕉️',
    tradition: 'hindu',
    type: 'stotram',
    mood: 'meditative',
    language: 'Sanskrit',
    source: 'Composed by Adi Shankaracharya (8th century CE)',
    description: 'Six verses representing the absolute essence of Advaita Vedanta philosophy, composed by Adi Shankaracharya to declare the nature of the true Self as pure consciousness and bliss.',
    audioTrackId: 'nirvana-shatakam',
    verses: [
      {
        number: 1,
        sanskrit: 'मनोबुद्ध्यहंकारचित्तानि नाहं\nन च श्रोत्रजिह्वे न च घ्राणनेत्रे।\nन च व्योम भूमिर्न तेजो न वायुः\nचिदानन्दरूपः शिवोऽहं शिवोऽहम्॥',
        transliteration: 'Manobuddhyahaṃkāracittāni nāhaṃ\nna ca śrotrajihve na ca ghrāṇanetre\nna ca vyoma bhūmirna tejo na vāyuḥ\ncidānandarūpaḥ śivo\'haṃ śivo\'ham',
        meaning: 'I am not the mind, intellect, ego, or memory. I am not the senses of hearing, tasting, smelling, or seeing. I am not space, earth, fire, or air. My true nature is consciousness and bliss alone — I am Shiva, I am Shiva.',
        meaning_hi: 'मैं न तो मन हूँ, न बुद्धि, न अहंकार और न ही चित्त हूँ। मैं कान, जीभ, नाक और आँख भी नहीं हूँ। न मैं आकाश हूँ, न भूमि, न अग्नि और न ही वायु हूँ। मैं तो विशुद्ध चेतना और आनंद का रूप हूँ, मैं शिव हूँ, मैं शिव हूँ।'
      },
      {
        number: 2,
        sanskrit: 'न च प्राणसंज्ञो न वै पञ्चवायुः\nन वा सप्तधातुर्न वा पञ्चकोशः।\nन वाक्पाणिपादौ न चोपस्थपायू\nचिदानन्दरूपः शिवोऽहं शिवोऽहम्॥',
        transliteration: 'Na ca prāṇasaṃjño na vai pañcavāyuḥ\nna vā saptadhāturna vā pañcakośaḥ\nna vākpāṇipādau na copasthapāyū\ncidānandarūpaḥ śivo\'haṃ śivo\'ham',
        meaning: 'I am not the vital breath, nor the five vital airs. I am not the seven bodily constituents, nor the five sheaths of the body. I am not the organs of speech, hands, feet, or excretion. My true nature is consciousness and bliss alone — I am Shiva, I am Shiva.',
        meaning_hi: 'मैं प्राण नहीं हूँ, न ही शरीर की पाँच वायु हूँ। मैं शरीर की सात धातुएँ या पाँच कोश भी नहीं हूँ। वाणी, हाथ, पैर और जननेंद्रिय आदि कर्मेंद्रियाँ भी मैं नहीं हूँ। मैं तो चेतना और आनंद का स्वरूप हूँ, मैं शिव हूँ, मैं शिव हूँ।'
      },
      {
        number: 3,
        sanskrit: 'न मे द्वेषरागौ न मे लोभमोहौ\nमदो नैव मे नैव मात्सर्यभावः।\nन धर्मो न चार्थो न कामो न मोक्षः\nचिदानन्दरूपः शिवोऽहं शिवोऽहम्॥',
        transliteration: 'Na me dveṣarāgau na me lobhamohau\nmado naiva me naiva mātsaryabhāvaḥ\nna dharmo na cārtho na kāmo na mokṣaḥ\ncidānandarūpaḥ śivo\'haṃ śivo\'ham',
        meaning: 'I have no aversion or attachment, no greed or delusion. I have no pride, nor any feeling of jealousy. I am beyond the four aims of life—righteousness, wealth, desire, and liberation. My true nature is consciousness and bliss alone — I am Shiva, I am Shiva.',
        meaning_hi: 'मुझमें न राग है न द्वेष, न लोभ है न मोह। मुझमें न तो अहंकार है और न ही ईर्ष्या। मैं धर्म, अर्थ, काम और मोक्ष से भी परे हूँ। मैं तो केवल चेतना और आनंद का स्वरूप हूँ, मैं शिव हूँ, मैं शिव हूँ।'
      },
      {
        number: 4,
        sanskrit: 'न पुण्यं न पापं न सौख्यं न दुःखं\nन मन्त्रो न तीर्थं न वेदा न यज्ञाः।\nअहं भोजनं नैव भोज्यं न भोक्ता\nचिदानन्दरूपः शिवोऽहं शिवोऽहम्॥',
        transliteration: 'Na puṇyaṃ na pāpaṃ na saukhyaṃ na duḥkhaṃ\nna mantro na tīrthaṃ na vedā na yajñāḥ\nahaṃ bhojanaṃ naiva bhojyaṃ na bhoktā\ncidānandarūpaḥ śivo\'haṃ śivo\'ham',
        meaning: 'I am neither merit nor sin, neither pleasure nor sorrow. I am not the mantra, the sacred pilgrimage, the scriptures, or the fire sacrifice. I am neither the experience, the object of experience, nor the experiencer. My true nature is consciousness and bliss alone — I am Shiva, I am Shiva.',
        meaning_hi: 'मैं न पुण्य हूँ न पाप, न सुख हूँ न दुख। मैं न मंत्र हूँ, न तीर्थ, न वेद हूँ और न ही यज्ञ। मैं न भोजन (अनुभव) हूँ, न भोज्य (अनुभव की वस्तु) और न ही भोक्ता हूँ। मैं तो विशुद्ध चेतना और आनंद का रूप हूँ, मैं शिव हूँ, मैं शिव हूँ।'
      },
      {
        number: 5,
        sanskrit: 'न मृत्युर्न शंका न मे जातिभेदः\nपिता नैव मे नैव माता न जन्मः।\nन बन्धुर्न मित्रं गुरुर्नैव शिष्यः\nचिदानन्दरूपः शिवोऽहं शिवोऽहम्॥',
        transliteration: 'Na mṛtyurna śaṃkā na me jātibhedaḥ\npitā naiva me naiva mātā na janmaḥ\nna bandhurna mitraṃ gururnaiva śiṣyaḥ\ncidānandarūpaḥ śivo\'haṃ śivo\'ham',
        meaning: 'I have no fear of death, no doubts, and no caste distinctions. I have no father, no mother, and no birth. I have no relatives, no friends, no guru, and no disciple. My true nature is consciousness and bliss alone — I am Shiva, I am Shiva.',
        meaning_hi: 'मुझे न मृत्यु का भय है और न ही कोई शंका। मेरा कोई जाति-भेद नहीं है। मेरे न पिता हैं, न माता और न ही मेरा कोई जन्म हुआ है। मेरा कोई सगा-संबंधी, मित्र, गुरु या शिष्य नहीं है। मैं तो केवल चेतना और आनंद का स्वरूप हूँ, मैं शिव हूँ, मैं शिव हूँ।'
      },
      {
        number: 6,
        sanskrit: 'अहं निर्विकल्पो निराकाररूपः\nविभुत्वाच्च सर्वत्र सर्वेन्द्रियाणाम्।\nन चासंगतं नैव मुक्तिर्न मेयः\nचिदानन्दरूपः शिवोऽहं शिवोऽहम्॥',
        transliteration: 'Ahaṃ nirvikalpo nirākārarūpaḥ\nvibhutvācca sarvatra sarvendriyāṇām\nna cāsaṃgataṃ naiva muktirna meyaḥ\ncidānandarūpaḥ śivo\'haṃ śivo\'ham',
        meaning: 'I am without division, beyond all form, and all-pervading. I exist everywhere, transcending all senses. I am neither attached to anything, nor am I bound, nor am I something to be liberated. My true nature is consciousness and bliss alone — I am Shiva, I am Shiva.',
        meaning_hi: 'मैं सभी विकल्पों से रहित और निराकार हूँ। मैं सर्वव्यापी हूँ और सभी इंद्रियों से परे हूँ। मैं न तो किसी वस्तु से जुड़ा हूँ, न बंधन में हूँ और न ही मुझे मोक्ष की आवश्यकता है। मैं तो विशुद्ध चेतना और आनंद का रूप हूँ, मैं शिव हूँ, मैं शिव हूँ।'
      }
    ]
  },
  // ── Lingashtakam ───────────────────────────────────────────────────────────
  {
    id: 'lingashtakam',
    title: 'Lingashtakam',
    titleDevanagari: 'लिङ्गाष्टकम्',
    deity: 'shiva',
    deityEmoji: '🔱',
    tradition: 'hindu',
    type: 'stotram',
    mood: 'devotional',
    language: 'Sanskrit',
    source: 'Composed by Adi Shankaracharya',
    description: 'An eight-verse hymn praising the infinite glory of the Shiva Lingam, expressing surrender, worship, and the purification of karmas.',
    verses: [
      {
        number: 1,
        sanskrit: 'ब्रह्ममुरारिसुरार्चितलिङ्गं\nनिर्मलभासितशोभितलिङ्गम् ।\nजन्मजदुःखविनाशकलिङ्गं\nतत्प्रणमामि सदाशिवलिङ्गम् ॥',
        transliteration: 'Brahmamurārisurārcitaliṅgaṃ\nnirmalabhāsitaśobhitaliṅgam\njanmajaduḥkhavināśakaliṅgaṃ\ntatpraṇamāmi sadāśivaliṅgam',
        meaning: 'I bow to that Sadāśiva Liṅga, worshipped by Brahmā, Viṣṇu, and the gods, radiant in purity and beauty, and destroying the sorrows born of repeated birth.',
        startSecs: 0,
        meaning_hi: 'मैं उस सदाशिवलिंग को प्रणाम करता हूँ जिसकी ब्रह्मा, विष्णु और देवता भी पूजा करते हैं। वह निर्मल, प्रकाशमय और सुंदर है, और जन्म-जन्म के दुखों को नष्ट करने वाला है।'
      },
      {
        number: 2,
        sanskrit: 'देवमुनिप्रवरार्चितलिङ्गं\nकामदहनकरुणाकरलिङ्गम् ।\nरावणदर्पविनाशनलिङ्गं\nतत्प्रणमामि सदाशिवलिङ्गम् ॥',
        transliteration: 'Devamunipravarārcitaliṅgaṃ\nkāmadahanakaruṇākaraliṅgam\nrāvaṇadarpavināśanaliṅgaṃ\ntatpraṇamāmi sadāśivaliṅgam',
        meaning: 'I bow to that Sadāśiva Liṅga, adored by the foremost gods and sages, source of compassion, destroyer of desire, and crusher of Rāvaṇa’s pride.',
        meaning_hi: 'मैं उस सदाशिवलिंग को प्रणाम करता हूँ जिसे श्रेष्ठ देवता और मुनि पूजते हैं। वह करुणा का स्रोत है, कामना की अग्नि को शांत करने वाला है और रावण के अभिमान को चूर्ण करने वाला है।',
      },
      {
        number: 3,
        sanskrit: 'सर्वसुगन्धसुलेपितलिङ्गं\nबुद्धिविवर्धनकारणलिङ्गम् ।\nसिद्धसुरासुरवन्दितलिङ्गं\nतत्प्रणमामि सदाशिवलिङ्गम् ॥',
        transliteration: 'Sarvasugandhasulepitaliṅgaṃ\nbuddhivivardhanakāraṇaliṅgam\nsiddhasurāsuravanditaliṅgaṃ\ntatpraṇamāmi sadāśivaliṅgam',
        meaning: 'I bow to that Sadāśiva Liṅga, anointed with every fragrance, cause of the growth of wisdom, and revered by siddhas, devas, and asuras alike.',
        meaning_hi: 'मैं उस सदाशिवलिंग को प्रणाम करता हूँ जो विविध सुगंधों से अभिषिक्त है और बुद्धि को विकसित करने वाला है। सिद्ध, देव और असुर — सभी उसकी वंदना करते हैं।',
      },
      {
        number: 4,
        sanskrit: 'कनकमहामणिभूषितलिङ्गं\nफणिपतिवेष्टितशोभितलिङ्गम् ।\nदक्षसुयज्ञविनाशनलिङ्गं\nतत्प्रणमामि सदाशिवलिङ्गम् ॥',
        transliteration: 'Kanakamahāmaṇibhūṣitaliṅgaṃ\nphaṇipativeṣṭitaśobhitaliṅgam\ndakṣasuyajñavināśanaliṅgaṃ\ntatpraṇamāmi sadāśivaliṅgam',
        meaning: 'I bow to that Sadāśiva Liṅga, adorned with gold and great jewels, beautified by the encircling serpent, and destroyer of Dakṣa’s arrogant sacrifice.',
        meaning_hi: 'मैं उस सदाशिवलिंग को प्रणाम करता हूँ जो स्वर्ण और रत्नों से विभूषित है और सर्प-आभूषण से सुशोभित है। उसी ने दक्ष के अहंकारपूर्ण यज्ञ का विनाश किया और शिवमहिमा को प्रकट किया।',
      },
      {
        number: 5,
        sanskrit: 'कुङ्कुमचन्दनलेपितलिङ्गं\nपङ्कजहारसुशोभितलिङ्गम् ।\nसञ्चितपापविनाशनलिङ्गं\nतत्प्रणमामि सदाशिवलिङ्गम् ॥',
        transliteration: 'Kuṅkumacandanalepitaliṅgaṃ\npaṅkajahārasuśobhitaliṅgam\nsañcitapāpavināśanaliṅgaṃ\ntatpraṇamāmi sadāśivaliṅgam',
        meaning: 'I bow to that Sadāśiva Liṅga, adorned with sandal and saffron, graced by lotus garlands, and capable of destroying the heap of accumulated karmic sin.',
        meaning_hi: 'मैं उस सदाशिवलिंग को प्रणाम करता हूँ जो कुमकुम और चन्दन से अलंकृत है और कमल-मालाओं से शोभित है। उसकी पूजा संचित पापों को नष्ट करके जीवन को पवित्र करती है।',
      },
      {
        number: 6,
        sanskrit: 'देवगणार्चितसेवितलिङ्गं\nभावैर्भक्तिभिरेव च लिङ्गम् ।\nदिनकरकोटिप्रभाकरलिङ्गं\nतत्प्रणमामि सदाशिवलिङ्गम् ॥',
        transliteration: 'Devagaṇārcitasevitaliṅgaṃ\nbhāvairbhaktibhireva ca liṅgam\ndinakarakoṭiprabhākaraliṅgaṃ\ntatpraṇamāmi sadāśivaliṅgam',
        meaning: 'I bow to that Sadāśiva Liṅga, worshipped and served by divine hosts, reached by feeling and devotion, and shining with the brilliance of millions of suns.',
        meaning_hi: 'मैं उस सदाशिवलिंग को प्रणाम करता हूँ जिसकी देवगण सेवा और आराधना करते हैं। वह भक्ति और भाव से प्राप्त होता है और करोड़ों सूर्यों के समान तेजस्वी प्रकाश से दमकता है।',
      },
      {
        number: 7,
        sanskrit: 'अष्टदलोपरिवेष्टितलिङ्गं\nसर्वसमुद्भवकारणलिङ्गम् ।\nअष्टदरिद्रविनाशनलिङ्गं\nतत्प्रणमामि सदाशिवलिङ्गम् ॥',
        transliteration: 'Aṣṭadalopariveṣṭitaliṅgaṃ\nsarvasamudbhavakāraṇaliṅgam\naṣṭadaridravināśanaliṅgaṃ\ntatpraṇamāmi sadāśivaliṅgam',
        meaning: 'I bow to that Sadāśiva Liṅga, encircled by the eight petals, cause of all manifestation, and destroyer of the eight forms of poverty in life and spirit.',
        meaning_hi: 'मैं उस सदाशिवलिंग को प्रणाम करता हूँ जो अष्टदल कमल से आवेष्टित माना गया है और समस्त सृष्टि का कारण है। वह बाहरी ही नहीं, भीतर की आध्यात्मिक दरिद्रता को भी दूर करने वाला है।',
      },
      {
        number: 8,
        sanskrit: 'सुरगुरुसुरवरपूजितलिङ्गं\nसुरवनपुष्पसदार्चितलिङ्गम् ।\nपरात्परं परमात्मकलिङ्गं\nतत्प्रणमामि सदाशिवलिङ्गम् ॥',
        transliteration: 'Suragurusuravarapūjitāliṅgaṃ\nsuravanapuṣpasadārcitaliṅgam\nparātparaṃ paramātmakaliṅgaṃ\ntatpraṇamāmi sadāśivaliṅgam',
        meaning: 'I bow to that Sadāśiva Liṅga, worshipped by the teacher of the gods and the best among the gods, ever adored with flowers of the celestial groves, and established as the supreme Self beyond all beyond.',
        meaning_hi: 'मैं उस सदाशिवलिंग को प्रणाम करता हूँ जिसकी पूजा देवगुरु और श्रेष्ठ देवता करते हैं और जो दिव्य पुष्पों से नित्य अर्चित है। वह परमात्मस्वरूप है, सभी से परे और सबका अंतिम आश्रय।',
      }
    ]
  },
  // ── Bilvashtakam ───────────────────────────────────────────────────────────
  {
    id: 'bilvashtakam',
    title: 'Bilvashtakam',
    titleDevanagari: 'बिल्वाष्टकम्',
    deity: 'shiva',
    deityEmoji: '🍃',
    tradition: 'hindu',
    type: 'stotram',
    mood: 'devotional',
    language: 'Sanskrit',
    source: 'Shiva Purana',
    description: 'A beautiful prayer detailing the spiritual merits of offering Bilva leaves to Lord Shiva during worship.',
    verses: [
      {
        number: 1,
        sanskrit: 'त्रिदलं त्रिगुणाकारं त्रिनेत्रं च त्रियायुधम् ।\nत्रिजन्मपापसंहारं एकबिल्वं शिवार्पणम् ॥',
        transliteration: 'Tridalaṃ triguṇākāraṃ trinetraṃ ca triyāyudham\ntrijanmapāpasaṃhāraṃ ekabilvaṃ śivārpaṇam',
        meaning: 'I offer one bilva leaf to Shiva, threefold in form like the three guṇas, the three eyes, and the three weapons of the Lord. Even one such offering is held to destroy the sins of many births.',
        startSecs: 0,
        meaning_hi: 'यह एक बिल्वपत्र शिव को अर्पित है, जिसमें तीन दल हैं और जो भगवान के त्रिनेत्र, त्रिगुण तथा त्रिशूलादि दिव्य चिन्हों का स्मरण कराता है। ऐसी श्रद्धापूर्ण अर्पणा को अनेक जन्मों के पापों का नाश करने वाली माना गया है।'
      },
      {
        number: 2,
        sanskrit: 'त्रिशाखैर्बिल्वपत्रैश्च ह्यच्छिद्रैः कोमलैः शुभैः ।\nशिवपूजां करिष्यामि एकबिल्वं शिवार्पणम् ॥',
        transliteration: 'Triśākhairbilvapatraiśca hyacchidraiḥ komalaiḥ śubhaiḥ\nśivapūjāṃ kariṣyāmi ekabilvaṃ śivārpaṇam',
        meaning: 'I worship Shiva with bilva leaves that are whole, tender, auspicious, and perfectly formed in their threefold cluster. This single bilva offering is placed at Shiva’s feet.',
        meaning_hi: 'मैं अखंड, कोमल और शुभ त्रिपत्र बिल्वदल से भगवान शिव की पूजा करता हूँ। यह एक बिल्वपत्र भी श्रद्धा से अर्पित होने पर पूर्ण पूजा के समान माना जाता है।',
      },
      {
        number: 3,
        sanskrit: 'अखण्डबिल्वपत्रेण पूजिते नन्दिकेश्वरे ।\nशुद्ध्यन्ति सर्वपापेभ्यः एकबिल्वं शिवार्पणम् ॥',
        transliteration: 'Akhaṇḍabilvapatreṇa pūjite nandikeśvare\nśuddhyanti sarvapāpebhyaḥ ekabilvaṃ śivārpaṇam',
        meaning: 'When Nandikeśvara, Lord Shiva, is worshipped with an unbroken bilva leaf, one is purified from all sins. Such a simple offering is treated as an act of deep sanctification.',
        meaning_hi: 'जब नन्दीश्वर रूप शिव की पूजा अखंड बिल्वपत्र से की जाती है, तब साधक समस्त पापों से शुद्ध होता है। यह सरल अर्पण भी अत्यंत पवित्र और फलदायी माना गया है।',
      },
      {
        number: 4,
        sanskrit: 'शालिग्रामशिलामेकां विप्राणां जातु चार्पयेत् ।\nसोमयज्ञमहापुण्यं एकबिल्वं शिवार्पणम् ॥',
        transliteration: 'Śāligrāmaśilāmekāṃ viprāṇāṃ jātu cārpayet\nsomayajñamahāpuṇyaṃ ekabilvaṃ śivārpaṇam',
        meaning: 'To offer a single bilva leaf to Shiva is praised as yielding merit equal to gifting a sacred śāligrāma to a worthy knower. The hymn treats the leaf-offering as comparable to a great Vedic sacrifice.',
        meaning_hi: 'एक बिल्वपत्र शिव को अर्पित करने का पुण्य शालिग्राम दान या महान वैदिक यज्ञ के पुण्य के तुल्य बताया गया है। इससे भाव का महत्व प्रकट होता है, बाहरी वैभव का नहीं।',
      },
      {
        number: 5,
        sanskrit: 'दन्तिकोटिसहस्राणि वाजपेयशतानि च ।\nकोटिकन्यामहादानं एकबिल्वं शिवार्पणम् ॥',
        transliteration: 'Dantikoṭisahasrāṇi vājapeyaśatāni ca\nkoṭikanyāmahādānaṃ ekabilvaṃ śivārpaṇam',
        meaning: 'The merit of gifting countless elephants, performing hundreds of grand sacrifices, or making vast acts of charity is said to stand beside the offering of one bilva leaf to Shiva. The verse elevates devotion over display.',
        meaning_hi: 'असंख्य दान, बड़े यज्ञ और महान पुण्यकर्मों के बराबर एक बिल्वपत्र की अर्पणा का महत्त्व बताया गया है। इसका तात्पर्य यह है कि शिवभक्ति में सच्चे भाव का स्थान सबसे ऊँचा है।',
      },
      {
        number: 6,
        sanskrit: 'लक्ष्म्याः स्तनुत उत्पन्नं महादेवस्य च प्रियम् ।\nबिल्ववृक्षं प्रयच्छामि एकबिल्वं शिवार्पणम् ॥',
        transliteration: 'Lakṣmyāḥ stanuta utpannaṃ mahādevasya ca priyam\nbilvavṛkṣaṃ prayacchāmi ekabilvaṃ śivārpaṇam',
        meaning: 'Born of Lakshmi’s own body and beloved of Mahādeva, the bilva tree is itself sacred. In offering its leaf, the devotee offers something already cherished by Shiva.',
        meaning_hi: 'बिल्ववृक्ष को लक्ष्मीजन्य और महादेव का अत्यंत प्रिय माना गया है। इसलिए उसका एक पत्र अर्पित करना ऐसा है मानो भगवान को वही अर्पित किया जाए जो उन्हें हृदय से प्रिय है।',
      },
      {
        number: 7,
        sanskrit: 'दर्शनं बिल्ववृक्षस्य स्पर्शनं पापनाशनम् ।\nअघोरपापसंहारं एकबिल्वं शिवार्पणम् ॥',
        transliteration: 'Darśanaṃ bilvavṛkṣasya sparśanaṃ pāpanāśanam\naghorapāpasaṃhāraṃ ekabilvaṃ śivārpaṇam',
        meaning: 'Even seeing or touching the bilva tree is said to destroy sin. The hymn honors the tree itself as a purifier and the leaf as a sacred extension of that grace.',
        meaning_hi: 'बिल्ववृक्ष का दर्शन और स्पर्श भी पापों का नाश करने वाला कहा गया है। उसका पत्र शिव को अर्पित करना उस पवित्रता और कृपा को अपने जीवन में आमंत्रित करना है।',
      },
      {
        number: 8,
        sanskrit: 'काशीक्षेत्रनिवासं च कालभैरवदर्शनम् ।\nप्रयागमाधवं दृष्ट्वा एकबिल्वं शिवार्पणम् ॥',
        transliteration: 'Kāśīkṣetranivāsaṃ ca kālabhairavadarśanam\nprayāgamādhavaṃ dṛṣṭvā ekabilvaṃ śivārpaṇam',
        meaning: 'Residence in Kāśī, vision of Kālabhairava, and darśana of Mādhava at Prayāga are all counted as holy attainments. The hymn places one bilva offering within that same sacred current of pilgrimage and grace.',
        meaning_hi: 'काशी में निवास, कालभैरव का दर्शन और प्रयाग में माधव के दर्शन जितने पवित्र माने गए हैं, उसी धारा में एक बिल्वपत्र की अर्पणा भी रखी गई है। यह बताता है कि शिवभक्ति में सरल अर्पण भी तीर्थयात्रा जितना ऊँचा हो सकता है।',
      }
    ]
  },
  // ── Mahishasura Mardini Stotram ───────────────────────────────────────────
  {
    id: 'mahishasura-mardini',
    title: 'Mahishasura Mardini Stotram',
    titleDevanagari: 'महिषासुरमर्दिनी स्तोत्रम्',
    deity: 'devi',
    deityEmoji: '🦁',
    tradition: 'hindu',
    type: 'stotram',
    mood: 'energetic',
    language: 'Sanskrit',
    source: 'Composed by Adi Shankaracharya',
    description: 'A rhythmic and highly energetic stotram in praise of Mother Durga as the slayer of the buffalo demon Mahishasura.',
    verses: [
      {
        number: 1,
        sanskrit: 'अयि गिरिनन्दिनि नन्दितमेदिनि विश्वविनोदिनि नन्दिनुते\nगिरिवरविन्ध्यशिरोधिनिवासिनि विष्णुविलासिनि जिष्णुनुते ।\nभगवति हे शितिकण्ठकुटुम्बिनि भूरिकुटुम्बिनि भूरिकृते\nजय जय हे महिषासुरमर्दिनि रम्यकपर्दिनि शैलसुते ॥',
        transliteration: 'Ayi girinandini nanditamedini viśvavinodini nandinute\ngirivaravindhya śirodhinivāsini viṣṇuvilāsini jiṣṇunute\nbhagavati he śitikaṇṭhakuṭumbini bhūrikuṭumbini bhūrikṛte\njaya jaya he mahiṣāsuramardini ramyakapardini śailasute',
        meaning: 'Victory, victory to you, O slayer of the demon Mahishasura, O daughter of the mountain Himavan, who has beautiful locks of hair, who rejoices the earth, delights the universe, is praised by Nandi, dwells on the peaks of the Vindhyas, gladdens Vishnu, is worshipped by Indra, and is the consort of Lord Shiva.',
        startSecs: 0,
        meaning_hi: 'हे पर्वतराज की पुत्री, समस्त पृथ्वी को आनंद देने वाली और जगत को क्रीड़ा समान धारण करने वाली माता, आपकी जय हो। आप नंदी द्वारा स्तुत, देवताओं द्वारा पूजित और महिषासुर का संहार करने वाली परम शक्ति हैं; आपकी विजय ही संसार का मंगल है।'
      }
    ]
  },
  // ── Durga Chalisa ──────────────────────────────────────────────────────────
  {
    id: 'durga-chalisa',
    title: 'Durga Chalisa',
    titleDevanagari: 'दुर्गा चालीसा',
    deity: 'devi',
    deityEmoji: '🔱',
    tradition: 'hindu',
    type: 'stotram',
    mood: 'energetic',
    language: 'Hindi',
    source: 'Traditional Devotional Stuti',
    description: 'Forty verses of prayer dedicated to Mother Durga, chanted to seek her divine protection, strength, and grace.',
    verses: [
      {
        number: 1,
        sanskrit: 'नमो नमो दुर्गे सुख करनी ।\nनमो नमो अम्बे दुःख हरनी ॥\nनिरंकार है ज्योति तुम्हारी ।\nतिहूँ लोक फैली उजियारी ॥',
        transliteration: 'Namo namo durge sukha karanī\nnamo namo ambe duḥkha haranī\nniraṅkāra hai jyoti tumhārī\ntihūṅ loka phailī ujiyārī',
        meaning: 'Salutations to Mother Durga, the dispenser of happiness. Salutations to Mother Amba, who removes all sorrows. Your light is formless and supreme, and its brilliance is spread across all three worlds.',
        meaning_hi: 'नमो नमो दुर्गे सुखकारी, नमो नमो अम्बे दुखहारी। निराकार है ज्योति तुम्हारी, तिहूँ लोक फैली उजियारी।',
      },
      {
        number: 2,
        sanskrit: 'शशि ललाट मुख महाविशाला । नेत्र लाल भृकुटि विकराला ॥\nरूप मातु को अधिक सुहावे । दरश करत जन अति सुख पावे ॥',
        transliteration: 'Śaśi lalāṭa mukha mahāvishālā, netra lāla bhṛkuṭi vikarālā.\nRūpa mātu kō adhika suhāvē, daraśa karata jana ati sukha pāvē.',
        meaning: 'Your forehead is adorned with the moon, and your face is majestic. Red-eyed with formidable eyebrows, your divine form is highly pleasing; devotees find great joy in beholding you.',
        meaning_hi: 'शशि ललाट मुख महाविशाला, नेत्र लाल भृकुटि विकराला। रूप मातु को अधिक सुहावे, दरश पाइ जन अति हर्षावे।',
      },
      {
        number: 3,
        sanskrit: 'तुम संसार शक्ति लय कीना । पालन हेतु अन्न धन दीना ॥\nअन्नपूर्णा हुई जग पाला । तुम ही आदि सुन्दरी बाला ॥',
        transliteration: 'Tuma saṃsāra śakti laya kīnā, pālana hētu anna dhana dīnā.\nAnnapūrṇā huī jaga pālā, tuma hī ādi sundarī bālā.',
        meaning: 'You are the source of cosmic energy, holding creation and dissolution. You sustain all by providing food and wealth. As Annapurna, you feed the universe; you are the beautiful, primeval maiden.',
        meaning_hi: 'तुम संसार-शक्ति लय-कारी, मानव की पीड़ा हरनहारी। ब्रह्मा विष्णु महेश अधारा, तुम सबको करती हो पारा।',
      },
      {
        number: 4,
        sanskrit: 'प्रलयकाल सब नाशन हारी । तुम गौरी शिवशंकर प्यारी ॥\nशिव योगी तुम्हरे गुण गावें । ब्रह्मा विष्णु तुम्हें नित ध्यावें ॥',
        transliteration: 'Pralayakāla saba nāśana hārī, tuma gaurī śivaśaṅkara pyārī.\nŚiva yōgī tumharē guṇa gāvēna, brahmā viṣṇu tumhē nita dhyāvēna.',
        meaning: 'At the time of cosmic dissolution, you destroy all that is bad. You are Gauri, beloved of Lord Shiva. Shiva and yogis sing your praises, while Brahma and Vishnu meditate upon you constantly.',
        meaning_hi: 'रूप सरस्वती का तुम धारा, दे सुबुद्धि ऋषि मुनिन उबारा। धरा रूप नरसिंह को अम्बा, परगट भई फाड़कर खम्बा।',
      },
      {
        number: 5,
        sanskrit: 'रूप सरस्वती को तुम धारा । दे सुबुद्धि ऋषि-मुनिन उबारा ॥\nधरा रूप नरसिंह को अम्बा । परगट भई फाड़ कर खम्बा ॥',
        transliteration: 'Rūpa sarasvatī kō tuma dhārā, dē subuddhi ṛṣi-munina ubārā.\nDharā rūpa narasiṃha kō ambā, paragaṭa bhaī phāṛa kara khambā.',
        meaning: 'Assuming the form of Saraswati, you grant wisdom to sages and redeem them. O Mother Amba, you also took the form of Narasimha, emerging by bursting open the stone pillar.',
        meaning_hi: 'रक्षा करि प्रह्लाद बचायो, हिरण्याक्ष को स्वर्ग पठायो। लक्ष्मी रूप धरो जग माहीं, श्री नारायण अंग समाहीं।',
      },
      {
        number: 6,
        sanskrit: 'रक्षा करि प्रह्लाद बचायो । हिरण्याक्ष को स्वर्ग पठायो ॥\nलक्ष्मी रूप धरो जग माहीं । श्री नारायण अंग समाहीं ॥',
        transliteration: 'Rakṣā kari prahlāda bacāyō, hiranyākṣa kō svarga paṭhāyō.\nLakṣmī rūpa dharō jaga māhīṅ, śrī nārāyaṇa aṅga samāhīṅ.',
        meaning: 'Protecting and saving your devotee Prahlada, you sent Hiranyakashipu to heaven (liberated him). As Lakshmi, you reside in this world as the consort of Lord Narayana.',
        meaning_hi: 'क्षीरसिंधु में करत विलासा, दयासिंधु दीजे मन आसा। हिंगलाज में तुम्हीं भवानी, महिमा अमित न जाई बखानी।',
      },
      {
        number: 7,
        sanskrit: 'क्षीरसिन्धु में करत विलासा । दयासिन्धु दीजै मन आसा ॥\nहिंगलाज में तुम्हीं भवानी । महिमा अमित न जात बखानी ॥',
        transliteration: 'Kṣīrasindhu mēṅ karata vilāsā, dayāsindhu dījai mana āsā.\nHiṅgalāja mēṅ tumhīṅ bhavānī, mahimā amita na jāta bakhānī.',
        meaning: 'Dwelling in the ocean of milk, you sport in divine play; O ocean of compassion, fulfill my heart\'s wishes. In Hinglaj, you reside as Bhavani; your boundless glory cannot be described.',
        meaning_hi: 'मातंगी अरु धूमावति माता, भुवनेश्वरी बगला सुखदाता। श्री भैरव तारा जग तारिणी, छिन्न भाल भव दुःख निवारिणी।',
      },
      {
        number: 8,
        sanskrit: 'मातंगी धूमावति माता । भुवनेश्वरी बगला सुखदाता ॥\nश्री भैरव तारा जग ताराणी । छिन्न भाल भव दुःख निवारिणी ॥',
        transliteration: 'Mātaṅgī dhūmāvati mātā, bhuvanēśvarī bagalā sukhadātā.\nŚrī bhairava tārā jaga tāriṇī, chinna bhāla bhava duḥkha nivāriṇī.',
        meaning: 'You are Matangi, Dhumavati, Bhuvaneshwari, and Bagalamukhi, the bestowers of happiness. As Tara, you cross us over existence, and as Chhinnamasta, you end all worldly grief.',
        meaning_hi: 'केहरि वाहन सोह भवानी, लांगुर वीर चलत अगवानी। कर में खप्पर खड्ग विराजे, जाको देख काल डर भाजे।',
      },
      {
        number: 9,
        sanskrit: 'केहरि वाहन सोह भवानी । लांगुर वीर चलत अगवानी ॥\nकर में खप्पर खड्ग विराजै । जाको देख काल डर भाजै ॥',
        transliteration: 'Kēhari vāhana sōha bhavānī, lāṅgura vīra calata agavānī.\nKara mēṅ khappara khaḍga virājai, jākō dēkha kāla dara bhājai.',
        meaning: 'O Bhavani, you look splendid mounted on your lion, preceded by Langur (Hanuman). Bearing the skull-cup and sword in hand, even Time flees in terror at your sight.',
        meaning_hi: 'सोहे अस्त्र और त्रिशूला, जाते उठत शत्रु हिय शूला। नगरकोट में तुम्हीं विराजत, तिहुँलोक में डंका बाजत।',
      },
      {
        number: 10,
        sanskrit: 'सोहे अस्त्र और त्रिशूला । जाते उठत शत्रु हिय शूला ॥\nनगर कोटि में तुम्हीं विराजत । तिहूँ लोक में डंका बाजत ॥',
        transliteration: 'Sōhē astra aura triśūlā, jātē uṭhata śatru hiya śūlā.\nNagara kōṭi mēṅ tumhīṅ virājata, tihūṅ lōka mēṅ ḍaṅkā bājata.',
        meaning: 'Adorned with various weapons and your trident, you strike terror in the hearts of enemies. In Nagarkot (Kangra), you reside in glory; your drums sound across all three worlds.',
        meaning_hi: 'शुंभ निशुंभ दानव तुम मारे, रक्तबीज शंखन संहारे। महिषासुर अति अभिमानी, जेहि अघ भार धरा अकुलानी।',
      },
      {
        number: 11,
        sanskrit: 'शुम्भ निशुम्भ दानव तुम मारे । रक्तबीज शंखन संहारे ॥\nमहिषासुर नृप अति अभिमानी । जेहि अघ भार मही अकुलानी ॥',
        transliteration: 'Śumbha niśumbha dānava tuma mārē, raktabīja śaṅkhana saṃhārē.\nMahiṣāsura nṛpa ati abhimānī, jēhi agha bhāra mahī akulānī.',
        meaning: 'You slew the demons Shumbha and Nishumbha, and decimated the countless duplicates of Raktabija. You crushed the highly arrogant demon Mahishasura, whose sins had distressed the earth.',
        meaning_hi: 'रूप कराल काली का धारा, सेन सहित तुम तिहि संहारा। परी गाढ़ संतन पर जब जब, भई सहाय मातु तुम तब तब।',
      },
      {
        number: 12,
        sanskrit: 'रूप कराल कालिका धारा । सेन सहित तुम तिहि संहारा ॥\nपरी गाढ़ संतन पर जब-जब । भई सहाय मातु तुम तब-तब ॥',
        transliteration: 'Rūpa karāla kālikā dhārā, sēna sahita tuma tihi saṃhārā.\nParī gāṛha santana para jaba-jaba, bhaī sahāya mātu tuma taba-taba.',
        meaning: 'Assuming the terrifying form of Kali, you destroyed him along with his entire army. Whenever the saints faced severe distress, O Mother, you came to their rescue.',
        meaning_hi: 'अमरपुरी अरु बासव लोका, तब महिमा सब रहें अशोका। ज्वाला में है जोत तुम्हारी, तुम्हें सदा पूजें नर-नारी।',
      },
      {
        number: 13,
        sanskrit: 'अमरपुरी अरु बासव लोका । तब महिमा सब रहें अशोका ॥\nज्वाला में है ज्योति तुम्हारी । तुम्हें सदा पूजें नर-नारी ॥',
        transliteration: 'Amarapurī aru bāsava lōkā, taba mahimā saba rahēṅ aśōkā.\nJvālā mēṅ hai jyōti tumhārī, tumhē sadā pūjēṅ nara-nārī.',
        meaning: 'Your glory keeps the heaven and the realms of Indra free from grief. Your light shines brightly in Jwalamukhi; men and women worship you forever.',
        meaning_hi: 'प्रेम भक्ति से जो यश गावें, दुःख दारिद्रय निकट नहिं आवें। ध्यावे तुम्हें जो नर मन लाई, जन्म मरण ताकौ छुटि जाई।',
      },
      {
        number: 14,
        sanskrit: 'प्रेम भक्ति से जो यश गावें । दुःख दारिद्र निकट नहिं आवें ॥\nध्यावे तुम्हें जो नर मन लाई । जन्म-मरण ताकौ छुटि जाई ॥',
        transliteration: 'Prēma bhakti sē jō yaśa gāvēna, duḥkha dāridra nikaṭa nahiṅ āvēna.\nDhyāvē tumhē jō nara mana lāī, janma-maraṇa tākau chuṭi jāī.',
        meaning: 'Whoever sings your glory with love and devotion is never approached by sorrow or poverty. He who meditates upon you with a focused mind is freed from the cycle of birth and death.',
        meaning_hi: 'जोगी सुर मुनि कहत पुकारी, योग न हो बिन शक्ति तुम्हारी। शंकर आचारज तप कीनो, काम अरु क्रोध जीत सब लीनो।',
      },
      {
        number: 15,
        sanskrit: 'जोगी सुर मुनि कहत पुकारी । योग न हो बिन शक्ति तुम्हारी ॥\nशंकर आचारज तप कीनो । काम अरु क्रोध जीति सब लीनो ॥',
        transliteration: 'Jōgī sura muni kahata pukārī, yōga na hō bina śakti tumhārī.\nŚaṅkara ācāraja tapa kīnō, kāma aru krōdha jīti saba līnō.',
        meaning: 'Yogis, gods, and sages declare: no yoga is possible without your divine energy (Shakti). Adi Shankaracharya performed intense penance and completely conquered lust and anger by your grace.',
        meaning_hi: 'निशिदिन ध्यान धरत शंकर को, काहु काज नहिं आवत पर को। निज गुणवर्णन करत न, सोभा। करत न रहत नाम जप, लोभा।',
      },
      {
        number: 16,
        sanskrit: 'निशिदिन ध्यान धरो शंकर को । काहु काल नहिं सुमिरो तुमको ॥\nशक्ति रूप का मरम न पायो । शक्ति गई तब मन पछितायो ॥',
        transliteration: 'Niśidina dhyāna dharō śaṅkara kō, kāhu kāla nahiṅ sumirō tumakō.\nŚakti rūpa kā marama na pāyō, śakti gaī taba mana pachitāyō.',
        meaning: 'He meditated day and night on Lord Shiva, but did not remember you. When he failed to realize the mystery of your energy-aspect, and his power waned, he regretted.',
        meaning_hi: 'शंकर ने तुम्हारी महिमा गाई, बहु विधि मन में भक्ति लाई। श्री दुर्गे चालीसा नित पढ़ें, सकल मनोरथ पूर्ण जग में।',
      },
      {
        number: 17,
        sanskrit: 'शरणागत हुई कीर्ति बखानी । जय जय जय जगदम्ब भवानी ॥\nभई प्रसन्न आदि जगदम्बा । दई शक्ति नहिं कीन बिलम्बा ॥',
        transliteration: 'Śaraṇāgata huī kīrti bakhānī, jaya jaya jaya jagadamba bhavānī.\nBhaī prasanna ādi jagadambā, daī śakti nahiṅ kīna bilambā.',
        meaning: 'Taking refuge in you and singing your glories: \"Victory, victory, victory to Mother Jagdamba Bhavani!\" The primordial Mother was pleased and immediately restored his strength.',
        meaning_hi: 'देवी पूजन जो नर करई, बांछित फल पावत नर सोई। दुर्गासप्तशती पाठ करई, मनवाँछित फल सब पावई।',
      },
      {
        number: 18,
        sanskrit: 'मोको मातु कष्ट अति घेरो । तुम बिन कौन हरै दुःख मेरो ॥\nआशा तृष्णा निपट सतावे । मोह मदादिक सब विनशावे ॥',
        transliteration: 'Mōkō mātu kaṣṭa ati ghērō, tuma bina kauna harai duḥkha mērō.\nĀśā tṛṣṇā nipaṭa satāvē, mōha madādika saba vinaśāvē.',
        meaning: 'O Mother, severe troubles surround me; who else but you can remove my pain? Hopes and desires torment me; please destroy my attachments, pride, and ignorance.',
        meaning_hi: 'महागौरी की जय जय जयकारी, मंगल दायिनी महिमा भारी। शक्ति रूपिणी नमो नमस्ते, पाप-ताप मोचन हे माते।',
      },
      {
        number: 19,
        sanskrit: 'शत्रु नाश कीजै महारानी । सुमिरौं इकचित तुम्हें भवानी ॥\nकरो कृपा हे मातु दयाला । ऋद्धि-सिद्धि दे करहु निहाला ॥',
        transliteration: 'Śatru nāśa kījai mahārānī, sumirauṅ ikacita tumhē bhavānī.\nKarō kṛpā hē mātu dayālā, ṛddhi-siddhi dē karahu nihālā.',
        meaning: 'O Sovereign Queen Bhavani, destroy my inner and outer enemies as I contemplate you single-mindedly. Show your mercy, O kind Mother, and make me blissful by granting wisdom and abundance.',
        meaning_hi: 'देवी कात्यायनी महाशक्ती, दो हम सबको सुंदर भक्ती। जीवन में न कोई कष्ट रहे, नित्य तुम्हारा यश मन में बहे।',
      },
      {
        number: 20,
        sanskrit: 'जब लगि जियौ दया फल पाऊं । तुम्हरो यश मैं सदा सुनाऊं ॥\nदुर्गा चालीसा जो नित गावै । सब सुख भोग परमपद पावै ॥',
        transliteration: 'Jaba lagi jiyau dayā phala pāūṅ, tumharō yaśa maiṅ sadā sunāūṅ.\nDurgā cālīsā jō nita gāvai, saba sukha bhōga paramapada pāvai.',
        meaning: 'As long as I live, let me receive the fruits of your mercy, and let me sing your glories. Whoever recites this Durga Chalisa daily enjoys all comforts and achieves the supreme state.',
        meaning_hi: 'जो यह दुर्गा चालीसा पढ़े नित्य, होवे पूर्ण उसकी सब इच्छा। दुर्गे माता की जय हो सदा, रहे हम सब पर तुम्हारी कृपा।',
      },
      {
        number: 21,
        sanskrit: 'देवीदास शरण निज जानी । करहु कृपा जगदम्ब भवानी ॥\nशरणागत रक्षा करे, भक्त रहे निर्भय ।\nश्री दुर्गा माँ की कृपा से, सब के पूर्ण हो जय ॥',
        transliteration: 'Devīdāsa śaraṇa nija jānī, karahu kṛpā jagadamba bhavānī.\nŚaraṇāgata rakṣā karē, bhakta rahē nirbhaya.\nŚrī durgā māṅ kī kṛpā sē, saba kē pūrṇa hō jaya.',
        meaning: 'Knowing Devidas to be under your protection, bless him, O Mother Jagdamba Bhavani. You protect those who seek refuge, keeping devotees fearless; by the grace of Mother Durga, may all achieve absolute victory!'
        ,
        meaning_hi: 'हे जगदम्बा भवानी, अपने शरणागत भक्त पर कृपा कीजिए। जो आपकी शरण आता है, आप उसकी रक्षा करती हैं और उसे निर्भय बनाती हैं। माँ दुर्गा की कृपा से भक्त के शुभ कार्य सिद्ध होते हैं और अंततः विजय उसी की होती है।'
      },
      {
        number: 22,
        sanskrit: 'तुम बिन यज्ञ न होय कुमारी । रहत सदा ब्रह्मादि सुखारी ॥\nब्रह्माणी रुद्राणी तुम कमला । तुम हो विष्णु प्रिया विमला ॥',
        transliteration: 'Tuma bina yajña na hoya kumārī, rahata sadā brahmādi sukhārī.\nBrahmāṇī rudrāṇī tuma kamalā, tuma hō viṣṇu priyā vimalā.',
        meaning: 'No sacrifice is complete without you, O Kumari. The lords Brahma and others remain always happy through you. You are Brahmani, Rudrani, and Kamala — the beloved and pure consort of Vishnu.',
        meaning_hi: 'तुम बिन यज्ञ न होय कुमारी, रहत सदा ब्रह्मादि सुखारी। ब्रह्माणी, रुद्राणी, कमला — तुम्हीं हो विष्णु की प्रिया विमला।',
      },
      {
        number: 23,
        sanskrit: 'श्वेतांबरी श्वेत विभूषण वाली । संकट हरो मातु कृपाली ॥\nतुम हो भक्त वत्सला माता । सबकी दुखिया सुनती दाता ॥',
        transliteration: 'Śvetāmbarī śveta vibhūṣaṇa vālī, saṅkaṭa harō mātu kṛpālī.\nTuma hō bhakta vatsalā mātā, sabakī dukhiyā sunatī dātā.',
        meaning: 'O Mother robed in white and adorned with white jewels, merciful remover of hardships. You are the affectionate mother of devotees, who hears every sufferer and grants their wishes.',
        meaning_hi: 'श्वेतांबरी, श्वेत विभूषण वाली, संकट हरो माता कृपाली। तुम हो भक्त-वत्सला माता, सबकी दुखिया सुनती दाता।',
      },
      {
        number: 24,
        sanskrit: 'भक्त कष्ट निर्वारण करती । दुर्गा जी शोभित हैं बहुल रती ॥\nतुम्हरी शरण जो आवे माता । सुख संपत्ति सब पावे दाता ॥',
        transliteration: 'Bhakta kaṣṭa nirvāraṇa karatī, durgā jī śōbhita haiṁ bahula ratī.\nTumharī śaraṇa jō āvē mātā, sukha saṃpatti saba pāvē dātā.',
        meaning: 'Mother Durga removes the sufferings of devotees, shining with abundant delight. Whoever takes refuge in you, O Mother, attains all happiness and prosperity.',
        meaning_hi: 'भक्त कष्ट निर्वारण करती, दुर्गाजी शोभित हैं बहुल रती। तुम्हारी शरण जो आए माता, सुख-संपत्ति सब पाए दाता।',
      },
      {
        number: 25,
        sanskrit: 'प्रेम भक्ति से जो यश गावें । दुःख दारिद्रय निकट नहिं आवें ॥\nध्यावे तुम्हें जो नर मन लाई । जन्म मरण ताकौ छुटि जाई ॥',
        transliteration: 'Prēma bhakti sē jō yaśa gāvēṁ, duḥkha dāridrya nikaṭa nahiṁ āvēṁ.\nDhyāvē tumhēṁ jō nara mana lāī, janma maraṇa tākau chuṭi jāī.',
        meaning: 'Those who sing your praises with love and devotion never face poverty or grief. Whoever meditates on you wholeheartedly is freed from the cycle of birth and death.',
        meaning_hi: 'प्रेम भक्ति से जो यश गावें, दुख दारिद्रय निकट नहीं आवें। ध्यावे तुम्हें जो नर मन लाई, जन्म-मरण ताकौ छुटि जाई।',
      },
      {
        number: 26,
        sanskrit: 'जोगी सुर मुनि कहत पुकारी । योग न होत बिना शक्ति तुम्हारी ॥\nशंकर आचारज तप कीनो । काम अरु क्रोध जीत सब लीनो ॥',
        transliteration: 'Jōgī sura muni kahata pukārī, yōga na hōta binā śakti tumhārī.\nŚaṅkara ācāraja tapa kīnō, kāma aru krōdha jīta saba līnō.',
        meaning: 'Yogis, gods and sages all proclaim: yoga is not possible without your Shakti. Shankaracharya performed austerities, conquering desire and anger through your grace.',
        meaning_hi: 'जोगी सुर मुनि कहत पुकारी, योग न होत बिना शक्ति तुम्हारी। शंकर आचारज तप कीनो, काम अरु क्रोध जीत सब लीनो।',
      },
      {
        number: 27,
        sanskrit: 'निसि दिन ध्यान धरत शंकर को । काहु काज नहिं आवत ऊपर को ॥\nशक्ति रूप को मरम न पायो । शक्ति गई तब मन पछितायो ॥',
        transliteration: 'Nisi dina dhyāna dharata śaṅkara kō, kāhu kāja nahiṁ āvata ūpara kō.\nŚakti rūpa kō marama na pāyō, śakti gaī taba mana pachitāyō.',
        meaning: 'Day and night Shankar meditated, yet his work did not go forward. He had not grasped your true nature as Shakti — and when Shakti left, he repented.',
        meaning_hi: 'निसि दिन ध्यान धरत शंकर को, काहु काज नहीं आवत ऊपर को। शक्ति रूप को मरम न पायो, शक्ति गई तब मन पछितायो।',
      },
      {
        number: 28,
        sanskrit: 'शरणागत हुई कीर्ति बखानी । जय जय जय अम्बे भवानी ॥\nभई प्रसन्न आदि जगदंबा । दई शक्ति नहीं कीन्ही विलंबा ॥',
        transliteration: 'Śaraṇāgata huī kīrti bakhānī, jaya jaya jaya ambe bhavānī.\nBhaī prasanna ādi jagadambā, daī śakti nahīṁ kīnhī vilambā.',
        meaning: 'When he took refuge and extolled your glory — "Victory, victory, victory to Ambe Bhavani!" — the primordial Jagadamba was pleased and bestowed her Shakti without delay.',
        meaning_hi: 'शरणागत हुए कीर्ति बखानी, जय जय जय अम्बे भवानी। भई प्रसन्न आदि जगदंबा, दई शक्ति नहीं कीन्ही विलंबा।',
      },
      {
        number: 29,
        sanskrit: 'मोको मातु कष्ट अति घेरो । तुम बिन कौन हरे दुख मेरो ॥\nआशा तृष्णा निपट सतावें । मोह मदादिक सब दुख दावें ॥',
        transliteration: 'Mōkō mātu kaṣṭa ati ghērō, tuma bina kauna harē dukha mērō.\nĀśā tṛṣṇā nipaṭa satāvēṁ, mōha madādika saba dukha dāvēṁ.',
        meaning: 'O Mother, I am besieged by great troubles — who but you can remove my grief? Craving and thirst torment me; delusion and pride and all their companions burn me.',
        meaning_hi: 'मोको माता कष्ट अति घेरो, तुम बिन कौन हरे दुख मेरो। आशा तृष्णा निपट सतावें, मोह मदादिक सब दुख दावें।',
      },
      {
        number: 30,
        sanskrit: 'शत्रु नाश कीजे महारानी । सुमिरौं इकचित्त तुम्हें भवानी ॥\nकरो कृपा हे मातु दयाला । ऋद्धि सिद्धि दे करहु निहाला ॥',
        transliteration: 'Śatru nāśa kījē mahārānī, sumirauṃ ikacita tumhēṃ bhavānī.\nKarō kṛpā hē mātu dayālā, ṛddhi siddhi dē karahu nihālā.',
        meaning: 'O great Queen, destroy my enemies; I remember you with one-pointed focus, O Bhavani. O compassionate Mother, shower your grace — bestow prosperity and accomplishment and make me fulfilled.',
        meaning_hi: 'शत्रु नाश कीजे महारानी, सुमिरौं इकचित्त तुम्हें भवानी। करो कृपा हे माता दयाला, ऋद्धि-सिद्धि दे करहु निहाला।',
      },
      {
        number: 31,
        sanskrit: 'जब लगि जिऊं दया फल पाऊं । तुम्हरो यश नित नित गुण गाऊं ॥\nदुर्गा चालीसा जो नित गावे । सब सुख भोग परम पद पावे ॥',
        transliteration: 'Jaba lagi jiūṃ dayā phala pāūṃ, tumharō yaśa nita nita guṇa gāūṃ.\nDurgā cālīsā jō nita gāvē, saba sukha bhōga parama pada pāvē.',
        meaning: 'As long as I live may I receive your mercy\'s fruit, and sing your praises and virtues day after day. Whoever recites this Durga Chalisa daily enjoys all worldly pleasures and attains the supreme state.',
        meaning_hi: 'जब लगि जिऊं दया फल पाऊं, तुम्हरो यश नित नित गुण गाऊं। दुर्गा चालीसा जो नित गावे, सब सुख भोग परम पद पावे।',
      },
      {
        number: 32,
        sanskrit: 'देवीदास शरण निज जाना । करहु कृपा जगत अभिमाना ॥\nतुम आदि शक्ति जगत की माता । गावत हैं तुम्हरे गुण विधाता ॥',
        transliteration: 'Dēvīdāsa śaraṇa nija jānā, karahu kṛpā jagata abhimānā.\nTuma ādi śakti jagata kī mātā, gāvata haiṃ tumharē guṇa vidhātā.',
        meaning: 'Devidas has taken refuge as your own — O glory of the world, be gracious. You are the primordial Shakti, mother of the universe; even Brahma sings your virtues.',
        meaning_hi: 'देवीदास शरण निज जाना, करहु कृपा जगत अभिमाना। तुम आदि शक्ति जगत की माता, गावत हैं तुम्हरे गुण विधाता।',
      },
      {
        number: 33,
        sanskrit: 'विद्यावती वाणी सुहावे । जो नित दुर्गा पाठ कर धावे ॥\nकरत पाठ चालीसा माता । ता पर होत सदा शुभ दाता ॥',
        transliteration: 'Vidyāvatī vāṇī suhāvē, jō nita durgā pāṭha kara dhāvē.\nKarata pāṭha cālīsā mātā, tā para hōta sadā śubha dātā.',
        meaning: 'Sweet is the speech of the learned; whoever runs to recite Durga daily. Whoever recites this Chalisa of Mother Durga — upon that person all auspiciousness is ever bestowed.',
        meaning_hi: 'विद्यावती वाणी सुहावे, जो नित दुर्गा पाठ कर धावे। करत पाठ चालीसा माता, ता पर होत सदा शुभ दाता।',
      },
      {
        number: 34,
        sanskrit: 'धूप दीप नैवेद्य चढ़ावे । संकट से माँ शीघ्र छुड़ावे ॥\nदुर्गा पूजन जो नर करहीं । बाँछित फल पावहिं सुख भरहीं ॥',
        transliteration: 'Dhūpa dīpa naivedya caṛhāvē, saṅkaṭa sē māṃ śīghra chUṛāvē.\nDurgā pūjana jō nara karahīṃ, bāṃchita phala pāvahiṃ sukha bharahīṃ.',
        meaning: 'Offer incense, lamp and food — Mother swiftly delivers you from hardship. Those who worship Durga obtain their desired fruit and fill their lives with joy.',
        meaning_hi: 'धूप दीप नैवेद्य चढ़ावे, संकट से माँ शीघ्र छुड़ावे। दुर्गा पूजन जो नर करहीं, बाँछित फल पावहिं सुख भरहीं।',
      },
      {
        number: 35,
        sanskrit: 'दुर्गाजी की आरती गावे । घर परिवार सुखी हो जावे ॥\nसब मनकामना पूर्ण होवे । दुर्गे कृपा से सुख फल बोवे ॥',
        transliteration: 'Durgājī kī āratī gāvē, ghara parivāra sukhī hō jāvē.\nSaba manakāmanā pūrṇa hōvē, durge kṛpā sē sukha phala bōvē.',
        meaning: 'Sing the aarti of Durgaji — the whole household becomes happy. All heart\'s desires are fulfilled; through Durga\'s grace the fruit of happiness is sown.',
        meaning_hi: 'दुर्गाजी की आरती गावे, घर परिवार सुखी हो जावे। सब मनकामना पूर्ण होवे, दुर्गे कृपा से सुख फल बोवे।',
      },
      {
        number: 36,
        sanskrit: 'पाठ करो दुर्गा चालीसा के । मिटें कष्ट सब अवगुण तिसके ॥\nकहें रामसखा मन लाई । माँ की महिमा सबसे बड़ाई ॥',
        transliteration: 'Pāṭha karō durgā cālīsā kē, miṭēṃ kaṣṭa saba avaguṇa tisakē.\nKahēṁ rāmasakha mana lāī, māṅ kī mahimā sabasē baṛāī.',
        meaning: 'Recite the Durga Chalisa — all hardships and faults are erased. Ramasakha says with heartfelt devotion: Mother\'s glory is the greatest of all.',
        meaning_hi: 'पाठ करो दुर्गा चालीसा के, मिटें कष्ट सब अवगुण तिसके। कहें रामसखा मन लाई, माँ की महिमा सबसे बड़ाई।',
      },
      {
        number: 37,
        sanskrit: 'सप्तशती पाठ जो नित करहीं । सब दुःखन से वे नर उबरहीं ॥\nनवरात्रा पूजन जो कीजे । सर्व कामना फल वे लीजे ॥',
        transliteration: 'Saptaśatī pāṭha jō nita karahīṃ, saba duḥkhana sē vē nara ubarahīṃ.\nNavarātrā pūjana jō kījē, sarva kāmanā phala vē lījē.',
        meaning: 'Those who recite the Saptashati daily are saved from every grief. Those who perform the Navratri worship receive the fruit of all their desires.',
        meaning_hi: 'सप्तशती पाठ जो नित करहीं, सब दुखन से वे नर उबरहीं। नवरात्रा पूजन जो कीजे, सर्व कामना फल वे लीजे।',
      },
      {
        number: 38,
        sanskrit: 'कन्या पूजन जो नर करहीं । दुर्गा कृपा उन पर सदा रहीं ॥\nदान करे जो श्रद्धा माता । जीवन में वह सदा सुखी दाता ॥',
        transliteration: 'Kanyā pūjana jō nara karahīṃ, durgā kṛpā una para sadā rahīṃ.\nDāna karē jō śraddhā mātā, jīvana mēṃ vaha sadā sukhī dātā.',
        meaning: 'Those who worship the young girl (kumari) — Durga\'s grace rests on them forever. Those who donate with devotion to the Mother live ever in happiness.',
        meaning_hi: 'कन्या पूजन जो नर करहीं, दुर्गा कृपा उन पर सदा रहीं। दान करे जो श्रद्धा माता, जीवन में वह सदा सुखी दाता।',
      },
      {
        number: 39,
        sanskrit: 'जो यह चालीसा पढ़े हर बारा । ताहि दुर्गा हों सहाई सारा ॥\nपढ़े चालीसा नित प्रति सोई । ताके काज न विघ्न होई ॥',
        transliteration: 'Jō yaha cālīsā paṛhē hara bārā, tāhi durgā hōṅ sahāī sārā.\nPaṛhē cālīsā nita prati sōī, tākē kāja na vighna hōī.',
        meaning: 'Whoever reads this Chalisa every time — Durga becomes their helper in everything. Whoever reads the Chalisa every day — no obstacle comes in their way.',
        meaning_hi: 'जो यह चालीसा पढ़े हर बारा, ताहि दुर्गा हों सहाई सारा। पढ़े चालीसा नित प्रति सोई, ताके काज न विघ्न होई।',
      },
      {
        number: 40,
        sanskrit: 'इस चालीसा को जो पढ़े नर सोई । दुर्गा माँ की कृपा उस पर होई ॥\nजय जय जय दुर्गे महारानी । पाप ताप हर दे कल्याणी ॥',
        transliteration: 'Isa cālīsā kō jō paṛhē nara sōī, durgā māṅ kī kṛpā usa para hōī.\nJaya jaya jaya durge mahārānī, pāpa tāpa hara dē kalyāṇī.',
        meaning: 'Whoever recites this Chalisa — upon that person Mother Durga\'s grace descends. Victory, victory, victory to Durga the great queen — O auspicious one, remove sin and suffering.',
        meaning_hi: 'इस चालीसा को जो पढ़े नर सोई, दुर्गा माँ की कृपा उस पर होई। जय जय जय दुर्गे महारानी, पाप ताप हर दे कल्याणी।',
      }
    ]
  },
  // ── Lalitha Sahasranama Stotram ─────────────────────────────────────────────
  {
    id: 'lalitha-sahasranama',
    title: 'Lalitha Sahasranama Stotram',
    titleDevanagari: 'ललिता सहस्रनाम स्तोत्रम्',
    deity: 'devi',
    deityEmoji: '🌸',
    tradition: 'hindu',
    type: 'stotram',
    mood: 'devotional',
    language: 'Sanskrit',
    source: 'Brahmanda Purana',
    description: 'The thousand sacred names of the Divine Mother Lalitha Tripurasundari, sung to invoke the maternal protection and spiritual elevation.',
    verses: [
      {
        number: 1,
        sanskrit: 'श्रीमन्माता श्रीमहाराज्ञी श्रीमत्सिंहासनेश्वरी ।\nचिदग्निकुण्डसम्भूत देवकार्यसमुद्यता ॥',
        transliteration: 'Śrīmatmātā śrīmahārājñī śrīmatsiṃhāsaneśvarī\ncidagnikuṇḍasambhūtā devakāryasamudyatā',
        meaning: 'Salutations to the Divine Mother, who is the Empress of the universe, who sits on the supreme throne of consciousness, who arose from the fire-altar of pure awareness to accomplish the work of the gods.',
        startSecs: 0,
        meaning_hi: 'मैं उस दिव्य माता को प्रणाम करता हूँ जो सम्पूर्ण जगत की महारानी हैं और चेतना के सिंहासन पर विराजमान हैं। वे चिदग्नि से प्रकट होकर देवकार्य की सिद्धि के लिए उदित हुई परम शक्ति हैं।'
      }
    ]
  },
  // ── Hanuman Chalisa ────────────────────────────────────────────────────────
  {
    id: 'hanuman-chalisa',
    title: 'Hanuman Chalisa',
    titleDevanagari: 'हनुमान चालीसा',
    deity: 'hanuman',
    deityEmoji: '🐒',
    tradition: 'hindu',
    type: 'stotram',
    mood: 'energetic',
    language: 'Awadhi / Hindi',
    source: 'Composed by Goswami Tulsidas',
    description: 'The most beloved forty-verse prayer dedicated to Lord Hanuman, sung worldwide for courage, health, protection, and devotion.',
    verses: [
      // ── Opening Dohas ─────────────────────────────────────────────────────
      {
        number: 1,
        sanskrit: 'श्रीगुरु चरन सरोज रज निज मनु मुकुरु सुधारि ।\nबरनऊँ रघुबर बिमल जसु जो दायकु फल चारि ॥\nबुद्धिहीन तनु जानिके सुमिरौ पवन-कुमार ।\nबल बुधि बिद्या देहु मोहिं हरहु कलेस बिकार ॥',
        transliteration: 'Śrīguru carana saroja raja nija manu mukuru sudhāri,\nbaranaūṃ raghubara bimala jasu jo dāyaku phala cāri.\nBuddhihīna tanu jānike sumirau pavana-kumāra,\nbala budhi bidyā dehu mohiṃ harahu kalesa bikāra.',
        meaning: 'Cleansing the mirror of my mind with the dust of my Guru\'s lotus feet, I sing the pure glory of Sri Ram, which bestows the four fruits of life. Knowing myself to be of weak intellect, I contemplate Hanuman, son of the wind — grant me strength, wisdom, and knowledge, and remove all my afflictions and impurities.',
        startSecs: 0,
        meaning_hi: 'अपने गुरु के चरण-कमलों की धूल से अपने मन रूपी दर्पण को स्वच्छ करके, मैं श्री रघुवर के निर्मल यश का वर्णन करता हूँ, जो चारों फल (धर्म, अर्थ, काम और मोक्ष) देने वाला है। मैं स्वयं को बुद्धिहीन मानकर, हे पवन-कुमार आपका स्मरण करता हूँ; मुझे बल, बुद्धि और विद्या प्रदान करें और मेरे सभी कष्टों व दोषों को हर लें।',
      },
      // ── Chaupais 1–40 (displayed as 20 stanzas of 4 lines each) ───────────
      {
        number: 2,
        sanskrit: 'जय हनुमान ज्ञान गुन सागर । जय कपीस तिहुँ लोक उजागर ॥\nरामदूत अतुलित बल धामा । अंजनि-पुत्र पवनसुत नामा ॥',
        transliteration: 'Jaya Hanumāna jñāna guṇa sāgara, jaya kapīśa tihuṃ loka ujāgara.\nRāmadūta atulita bala dhāmā, aṃjani-putra pavanasuta nāmā.',
        meaning: 'Victory to Hanuman, the ocean of wisdom and virtue! Victory to the Lord of monkeys who illumines all three worlds. O messenger of Ram, dwelling-place of incomparable strength — son of Anjani, known as the son of the wind.',
        meaning_hi: 'हे हनुमान जी! आपकी जय हो, आप ज्ञान और गुणों के सागर हैं। हे वानरराज! आपकी जय हो, आप तीनों लोकों में प्रसिद्ध और प्रकाशमान हैं। आप श्री राम के दूत और अतुलनीय बल के धाम हैं, अंजनी माता के पुत्र और पवनसुत नाम से जाने जाते हैं।',
      },
      {
        number: 3,
        sanskrit: 'महावीर विक्रम बजरंगी । कुमति निवार सुमति के संगी ॥\nकंचन वरन विराज सुवेसा । कानन कुंडल कुंचित केसा ॥',
        transliteration: 'Mahāvīra vikrama bajaraṃgī, kumati nivāra sumati ke saṃgī.\nKañcana varana virāja suveśā, kānana kuṃḍala kuṃcita keśā.',
        meaning: 'Great hero, mighty as a thunderbolt, dispeller of evil thoughts and companion of the wise. You shine with a golden complexion, adorned in beautiful robes, ear-rings of gold, and curly locks of hair.',
        meaning_hi: 'हे महावीर, आप अत्यंत पराक्रमी और वज्र के समान दृढ़ अंगों वाले हैं। आप कुबुद्धि (बुरी बुद्धि) को दूर करने वाले और सुबुद्धि (अच्छी बुद्धि) के साथी हैं। आपका वर्ण सुवर्ण के समान है, आप सुंदर वस्त्र पहने हुए हैं, कानों में कुंडल और घुंघराले बाल सुशोभित हैं।',
      },
      {
        number: 4,
        sanskrit: 'हाथ बज्र औ ध्वजा बिराजे । काँधे मूँज जनेऊ साजे ॥\nशंकर सुवन केसरीनंदन । तेज प्रताप महा जग वंदन ॥',
        transliteration: 'Hātha bajra au dhvajā birāje, kāṃdhe mūṃja janeu sāje.\nŚaṃkara suvana kesarīnaṃdana, teja pratāpa mahā jaga vaṃdana.',
        meaning: 'In your hands gleam a thunderbolt and a victory banner; on your shoulder shines the sacred Munja-grass thread. O offspring of Shankara (Vayu), O son of Kesari — your splendour and glory are worshipped throughout the world.',
        meaning_hi: 'आपके हाथों में वज्र और ध्वजा सुशोभित हैं और कंधे पर मूंज का जनेऊ शोभा दे रहा है। आप भगवान शंकर के अवतार और केसरी नंदन हैं। आपका तेज और प्रताप महान है, और सारा संसार आपकी वंदना करता है।',
      },
      {
        number: 5,
        sanskrit: 'विद्यावान गुनी अति चातुर । राम काज करिबे को आतुर ॥\nप्रभु चरित्र सुनिबे को रसिया । राम लखन सीता मन बसिया ॥',
        transliteration: 'Vidyāvāna guṇī ati cātura, rāma kāja karibe ko ātura.\nPrabhu caritra sunibe ko rasiyā, rāma lakhana sītā mana basiyā.',
        meaning: 'You are supremely learned, virtuous, and wise — always eager to serve Lord Ram. You delight in hearing the Lord\'s glorious deeds, and Ram, Lakshman, and Sita ever dwell in your heart.',
        meaning_hi: 'आप परम विद्यावान, गुणी और अत्यंत चतुर हैं। आप श्री राम के कार्य (सेवा) को करने के लिए सदैव आतुर रहते हैं। आप प्रभु श्री राम के चरित्र को सुनने के परम रसिया हैं। श्री राम, लक्ष्मण और माता सीता आपके हृदय में निवास करते हैं।',
      },
      {
        number: 6,
        sanskrit: 'सूक्ष्म रूप धरि सियहिं दिखावा । विकट रूप धरि लंक जरावा ॥\nभीम रूप धरि असुर सँहारे । रामचंद्र के काज सँवारे ॥',
        transliteration: 'Sūkṣma rūpa dhari siyahiṃ dikhāvā, vikaṭa rūpa dhari laṃka jarāvā.\nBhīma rūpa dhari asura saṃhāre, rāmacaṃdra ke kāja saṃvāre.',
        meaning: 'You appeared before Sita in a tiny form, took a terrifying form to burn Lanka, and in a colossal form slew the demons — thereby accomplishing all the missions of Lord Ram.',
        meaning_hi: 'ने अत्यंत सूक्ष्म रूप धारण करके माता सीता को दर्शन दिए और अत्यंत भयंकर व विकराल रूप धारण करके लंका नगरी को जलाया। आपने विशालकाय भीम रूप धारण करके राक्षसों का संहार किया और श्री रामचंद्र जी के सभी कार्यों को संवारा।',
      },
      {
        number: 7,
        sanskrit: 'लाय सजीवन लखन जियाये । श्रीरघुबीर हरषि उर लाये ॥\nरघुपति कीन्हीं बहुत बड़ाई । तुम मम प्रिय भरतहि सम भाई ॥',
        transliteration: 'Lāya sajīvana lakhana jiyāye, śrīraghubīra haraṣi ura lāye.\nRaghupati kīnhīṃ bahuta baṛāī, tuma mama priya bharatahi sama bhāī.',
        meaning: 'You brought the Sanjivani herb and revived Lakshman — and Sri Raghuveer (Ram) embraced you with great joy. The Lord of the Raghus praised you greatly, saying: "You are as dear to me as my own brother Bharat."',
        meaning_hi: 'आप संजीवनी बूटी लेकर आए जिससे लक्ष्मण जी के प्राण बचे और श्री रघुबीर ने अत्यंत हर्षित होकर आपको हृदय से लगा लिया। रघुपति ने आपकी बहुत प्रशंसा की और कहा कि तुम मेरे प्रिय भाई भरत के समान ही प्यारे हो।',
      },
      {
        number: 8,
        sanskrit: 'सहस बदन तुम्हरो जस गावैं । अस कहि श्रीपति कंठ लगावैं ॥\nसनकादिक ब्रह्मादि मुनीसा । नारद-सारद सहित अहीसा ॥',
        transliteration: 'Sahasa badana tumharo jasa gāvaiṃ, asa kahi śrīpati kaṃṭha lagāvaiṃ.\nSanakādika brahmādi munīśā, nārada-sārada sahita ahīśā.',
        meaning: '"A thousand mouths sing your glory" — saying this, the Lord of Lakshmi (Vishnu) embraced you. Sages like Sanaka, Lord Brahma, and the great seers, Narada, Saraswati, and the Lord of serpents — all praise your glory.',
        meaning_hi: 'श्री रामचंद्र जी ने आपको यह कहकर गले से लगाया कि तुम्हारा यश हजारों मुखों से गाने योग्य है। सनक, सनातन आदि ऋषि, ब्रह्मा आदि देवता, मुनीश्वर, नारद, माता सरस्वती और शेषनाग सभी आपका यश गाते हैं।',
      },
      {
        number: 9,
        sanskrit: 'जम कुबेर दिगपाल जहाँ ते । कवि कोबिद कहि सकैं कहाँ ते ॥\nतुम उपकार सुग्रीवहिं कीन्हा । राम मिलाय राजपद दीन्हा ॥',
        transliteration: 'Jama kubera digapāla jahāṃ te, kavi kobida kahi sakaiṃ kahāṃ te.\nTuma upakāra sugrīvahiṃ kīnhā, rāma milāya rājapada dīnhā.',
        meaning: 'Yama, Kubera, and all the guardians of the eight directions — even the greatest poets and scholars cannot fully describe your glory. You rendered a great service to Sugriva: you united him with Ram and restored his royal throne.',
        meaning_hi: 'यमराज, कुबेर और दसों दिशाओं के रक्षक (दिग्पाल) तथा कवि, विद्वान और पंडित भी आपकी महिमा का पूर्ण वर्णन कहाँ तक कर सकते हैं! आपने सुग्रीव जी पर महान उपकार किया, उन्हें श्री राम से मिलाकर राजपद वापस दिलाया।',
      },
      {
        number: 10,
        sanskrit: 'तुम्हरो मंत्र विभीषण माना । लंकेश्वर भये सब जग जाना ॥\nजुग सहस्र जोजन पर भानू । लीन्हो ताहि मधुर फल जानू ॥',
        transliteration: 'Tumharo maṃtra vibhīṣaṇa mānā, laṃkeśvara bhaye saba jaga jānā.\nJuga sahasra jojana para bhānū, līnho tāhi madhura phala jānū.',
        meaning: 'Vibhishana accepted your counsel and became the ruler of Lanka — the whole world knows this. The sun, thousands of yuga-yojanas away, you swallowed as a child thinking it was a sweet fruit.',
        meaning_hi: 'आपके परामर्श और मंत्र को विभीषण ने माना, जिसके कारण वे लंका के राजा बने, इस बात को सारा संसार जानता है। जो सूर्य यहाँ से हजारों योजन की दूरी पर स्थित है, उसे आपने एक मीठा फल समझकर निगल लिया था।',
      },
      {
        number: 11,
        sanskrit: 'प्रभु मुद्रिका मेलि मुख माहीं । जलधि लाँघि गये अचरज नाहीं ॥\nदुर्गम काज जगत के जेते । सुगम अनुग्रह तुम्हरे तेते ॥',
        transliteration: 'Prabhu mudrikā meli mukha māhīṃ, jaladhi lāṃghi gaye acaraja nāhīṃ.\nDurgama kāja jagata ke jete, sugama anugraha tumhare tete.',
        meaning: 'Holding the Lord\'s ring in your mouth, you leaped across the ocean — there is no wonder in this for one like you. All the most difficult tasks in the world become easy through your grace and blessing.',
        meaning_hi: 'प्रभु श्री राम की मुद्रिका (अंगूठी) को मुख में रखकर आपने समुद्र को पार किया, इसमें आपके जैसी अपार शक्ति के लिए कोई आश्चर्य नहीं है। संसार के जितने भी कठिन से कठिन कार्य हैं, वे आपकी कृपा और अनुग्रह से अत्यंत सुगम हो जाते हैं।',
      },
      {
        number: 12,
        sanskrit: 'राम दुआरे तुम रखवारे । होत न आज्ञा बिनु पैसारे ॥\nसब सुख लहैं तुम्हारी सरना । तुम रच्छक काहू को डरना ॥',
        transliteration: 'Rāma duāre tuma rakhavāre, hota na ājñā binu paisāre.\nSaba sukha lahai tumhārī saranā, tuma racchaka kāhū ko ḍaranā.',
        meaning: 'You are the guardian of Ram\'s divine threshold — none may enter without your permission. All comforts are obtained under your shelter, and with you as protector one need fear nothing and no one.',
        meaning_hi: 'श्री राम के मंदिर के आप रक्षक (द्वारपाल) हैं, जहाँ आपकी आज्ञा के बिना कोई प्रवेश नहीं कर सकता। आपकी शरण में आने वाले सभी सुख प्राप्त करते हैं, और जब आप रक्षक हैं तो किसी का कोई डर नहीं रहता।',
      },
      {
        number: 13,
        sanskrit: 'आपन तेज सम्हारो आपे । तीनों लोक हाँक तें काँपे ॥\nभूत पिसाच निकट नहिं आवैं । महावीर जब नाम सुनावैं ॥',
        transliteration: 'Āpana teja samhāro āpe, tīnoṃ loka hāṃka teṃ kāṃpe.\nBhūta piśāca nikaṭa nahiṃ āvaiṃ, mahāvīra jaba nāma sunāvaiṃ.',
        meaning: 'You alone can contain your own immense radiance; all three worlds tremble at a single roar from you. Ghosts and evil spirits dare not come near to those who chant the name of the great hero Hanuman.',
        meaning_hi: 'आप अपने तेज और वेग को स्वयं ही संभाल सकते हैं, आपके एक गर्जन से तीनों लोक कांप उठते हैं। जहाँ महावीर हनुमान जी का नाम सुनाया जाता है, वहाँ भूत-प्रेत और पिशाच पास भी नहीं फटक सकते।',
      },
      {
        number: 14,
        sanskrit: 'नासै रोग हरैं सब पीरा । जपत निरंतर हनुमत बीरा ॥\nसंकट तें हनुमान छुड़ावैं । मन क्रम बचन ध्यान जो लावैं ॥',
        transliteration: 'Nāsai roga harai saba pīrā, japata niraṃtara hanumata bīrā.\nSaṃkaṭa teṃ hanumāna chuṛāvaiṃ, mana krama bacana dhyāna jo lāvaiṃ.',
        meaning: 'Diseases are destroyed and all pain removed for those who continually chant the name of the brave Hanuman. Hanuman delivers from all troubles those who contemplate him in thought, deed, and word.',
        meaning_hi: 'वीर हनुमान जी का निरंतर जप करने से सभी रोग नष्ट हो जाते हैं और समस्त पीड़ा का अंत हो जाता है। जो कोई भी मन, कर्म और वचन से हनुमान जी का ध्यान लगाता है, उन्हें हनुमान जी सभी संकटों से छुड़ा लेते हैं।',
      },
      {
        number: 15,
        sanskrit: 'सब पर राम तपस्वी राजा । तिन के काज सकल तुम साजा ॥\nऔर मनोरथ जो कोई लावे । सोइ अमित जीवन फल पावे ॥',
        transliteration: 'Saba para rāma tapasvi rājā, tina ke kāja sakala tuma sājā.\nAura manoaratha jo koī lāve, soi amita jīvana phala pāve.',
        meaning: 'Ram the ascetic king reigns over all, and you accomplish all his missions to perfection. Whoever brings any wish or prayer before you receives the boundless fruit of life.',
        meaning_hi: 'तपस्वी राजा श्री राम सर्वश्रेष्ठ हैं, और उनके सभी कार्यों को आपने पूरी तरह संवारा है। इसके अतिरिक्त जो कोई भी अपनी कोई अभिलाषा (मनोरथ) लेकर आपके पास आता है, वह जीवन का असीम और शाश्वत फल प्राप्त करता है।',
      },
      {
        number: 16,
        sanskrit: 'चारों जुग परताप तुम्हारा । है परसिद्ध जगत उजियारा ॥\nसाधु-संत के तुम रखवारे । असुर निकंदन राम दुलारे ॥',
        transliteration: 'Cāroṃ juga paratāpa tumhārā, hai parasiddha jagata ujiyārā.\nSādhu-saṃta ke tuma rakhavāre, asura nikaṃdana rāma dulāre.',
        meaning: 'Your glory shines resplendent through all four ages and is famed throughout the illumined world. You are the protector of saints and sages, the destroyer of demons, and the beloved of Ram.',
        meaning_hi: 'चारों युगों में आपका प्रताप और प्रभाव फैला हुआ है, और आपका यश पूरे संसार को आलोकित कर रहा है। आप सज्जनों और साधु-संतों के रक्षक हैं, राक्षसों का संहार करने वाले और श्री राम के परम दुलारे हैं।',
      },
      {
        number: 17,
        sanskrit: 'अष्ट सिद्धि नव निधि के दाता । अस बर दीन जानकी माता ॥\nराम रसायन तुम्हरे पासा । सदा रहो रघुपति के दासा ॥',
        transliteration: 'Aṣṭa siddhi nava nidhi ke dātā, asa bara dīna jānakī mātā.\nRāma rasāyana tumhare pāsā, sadā raho raghupati ke dāsā.',
        meaning: 'You are the bestower of the eight mystic powers and the nine divine treasures — such a boon was granted to you by Mother Janaki (Sita). You hold the supreme elixir of devotion to Ram; may you ever dwell as a faithful servant of the Lord of the Raghus.',
        meaning_hi: 'माता जानकी (सीता) ने आपको ऐसा वरदान दिया है कि आप किसी को भी आठों सिद्धियां और नौ निधियां प्रदान कर सकते हैं। आपके पास श्री राम की भक्ति रूपी परम रसायन (औषधि) है, और आप सदा श्री रघुपति के सेवक बने रहते हैं।',
      },
      {
        number: 18,
        sanskrit: 'तुम्हरे भजन राम को पावैं । जनम-जनम के दुख बिसरावैं ॥\nअन्तकाल रघुबर पुर जाई । जहाँ जन्म हरि-भक्त कहाई ॥',
        transliteration: 'Tumhare bhajana rāma ko pāvaiṃ, janama-janama ke dukha bisarāvaiṃ.\nAntakāla raghubara pura jāī, jahāṃ janma hari-bhakta kahāī.',
        meaning: 'Through devotion to you one attains Ram and forgets the sorrows accumulated over many lifetimes. At the time of death one departs to Ram\'s celestial abode, and wherever one is reborn, one is known as a devotee of Hari.',
        meaning_hi: 'आपका भजन करने से श्री राम की प्राप्ति होती है और जन्म-जन्मांतर के दुःख दूर हो जाते हैं। अंत समय में व्यक्ति श्री राम के परम धाम को जाता है और यदि संसार में पुनः जन्म लेता है तो हरि-भक्त के रूप में प्रसिद्ध होता है।',
      },
      {
        number: 19,
        sanskrit: 'और देवता चित्त न धरई । हनुमत सेइ सर्व सुख करई ॥\nसंकट कटै मिटैं सब पीरा । जो सुमिरैं हनुमत बलबीरा ॥',
        transliteration: 'Aura devatā citta na dharaī, hanumata sei sarva sukha karaī.\nSaṃkaṭa kaṭai miṭaiṃ saba pīrā, jo sumaraiṃ hanumata balabīrā.',
        meaning: 'One need not fix the mind on any other deity — serving Hanuman alone bestows all happiness. All obstacles are removed and all pain vanishes for one who remembers the mighty hero Hanuman.',
        meaning_hi: 'किसी अन्य देवी-देवता का ध्यान न धरते हुए भी, केवल हनुमान जी की सेवा-साधना करने से सभी सुख प्राप्त हो जाते हैं। वीर हनुमान जी का स्मरण करने से सारे संकट कट जाते हैं और सभी पीड़ा मिट जाती है।',
      },
      {
        number: 20,
        sanskrit: 'जय जय जय हनुमान गोसाईं । कृपा करहु गुरुदेव की नाईं ॥\nजो सत बार पाठ कर कोई । छूटहि बंदि महा सुख होई ॥',
        transliteration: 'Jaya jaya jaya hanumāna gosāīṃ, kṛpā karahu gurudeva kī nāīṃ.\nJo sata bāra pāṭha kara koī, chuṭahi baṃdi mahā sukha hoī.',
        meaning: 'Victory, victory, victory to you, O Lord Hanuman! Bestow your grace upon me as a compassionate Guru. Whoever recites this prayer a hundred times is freed from all bondage and attains supreme happiness.',
        meaning_hi: 'हे स्वामी हनुमान जी! आपकी जय हो, जय हो, जय हो! मुझ पर अपने गुरुदेव के समान कृपा करें। जो कोई भी इस चालीसा का सौ बार पाठ करता है, वह सभी बंधनों से मुक्त हो जाता है और उसे महान सुख की प्राप्ति होती है।',
      },
      {
        number: 21,
        sanskrit: 'जो यह पढ़ैं हनुमान चालीसा । होय सिद्धि साखी गौरीसा ॥\nतुलसीदास सदा हरि चेरा । कीजैं नाथ हृदय महँ डेरा ॥',
        transliteration: 'Jo yaha paṛhaiṃ hanumāna cālīsā, hoya siddhi sākhī gaurīśā.\nTulasīdāsa sadā hari cerā, kījai nātha hṛdaya mahaṃ ḍerā.',
        meaning: 'Whoever reads this Hanuman Chalisa attains perfection in all endeavours — Lord Shiva (Gaureesh) himself is the witness to this truth. Tulsidas, ever a humble servant of Hari, prays: O Lord, make your divine abode in my heart.',
        meaning_hi: 'जो कोई भी इस हनुमान चालीसा का पाठ करता है, उसे सभी कार्यों में सिद्धि प्राप्त होती है, इसके साक्षी स्वयं भगवान शिव (गौरीश) हैं। तुलसीदास सदा श्री हरि के सेवक हैं, इसलिए वे प्रार्थना करते हैं कि हे नाथ! आप मेरे हृदय में सदा के लिए निवास करें।',
      },
      // ── Closing Doha ──────────────────────────────────────────────────────
      {
        number: 22,
        sanskrit: 'पवनतनय संकट हरन, मंगल मूरति रूप ।\nराम लखन सीता सहित, हृदय बसहु सुर भूप ॥',
        transliteration: 'Pavanatanaya saṃkaṭa harana, maṃgala mūrti rūpa.\nRāma lakhana sītā sahita, hṛdaya basahu sura bhūpa.',
        meaning: 'O Son of the Wind, remover of all difficulties, embodiment of auspiciousness and grace — together with Ram, Lakshman, and Sita, O King of the gods, dwell forever in my heart.',
        meaning_hi: 'हे पवनपुत्र, संकटों का नाश करने वाले, कल्याण और अमंगल के नाशक, आनंद की मूर्ति! आप श्री राम, लक्ष्मण और माता सीता सहित मेरे हृदय में सदा निवास करें, हे देवराज!',
      },
    ]
  },
  // ── Bajrang Baan ───────────────────────────────────────────────────────────
  {
    id: 'bajrang-baan',
    title: 'Bajrang Baan',
    titleDevanagari: 'बजरंग बाण',
    deity: 'hanuman',
    deityEmoji: '🏹',
    tradition: 'hindu',
    type: 'stotram',
    mood: 'energetic',
    language: 'Hindi',
    source: 'Composed by Goswami Tulsidas',
    description: 'An arrow of prayer to Lord Hanuman, chanted in times of severe difficulty, fear, and negativity to invoke instant divine intervention.',
    verses: [
      {
        number: 1,
        sanskrit: 'निश्चय प्रेम प्रतीति ते बिनय करैं सनमान ।\nतेहि के कारज सकल शुभ सिद्ध करैं हनुमान ॥',
        transliteration: 'Niścaya prema pratīti te binaya karaiṅ sanamāna\ntehi ke kāraja sakala śubha siddha karaiṅ hanumāna',
        meaning: 'Whoever bows to Hanuman with absolute faith, love, and respect, all their undertakings are auspiciously and successfully completed by Lord Hanuman.',
        startSecs: 0,
        meaning_hi: 'जो कोई अटूट विश्वास, प्रेम और विनय के साथ हनुमान जी को प्रणाम करता है, उसके सभी शुभ कार्य उनकी कृपा से सिद्ध होते हैं। यह पद बताता है कि सच्ची श्रद्धा के साथ की गई प्रार्थना व्यर्थ नहीं जाती।'
      }
    ]
  },
  // ── Sankat Mochan Hanuman Ashtak ───────────────────────────────────────────
  {
    id: 'hanuman-ashtak',
    title: 'Sankat Mochan Hanuman Ashtak',
    titleDevanagari: 'संकटमोचन हनुमानाष्टक',
    deity: 'hanuman',
    deityEmoji: '🧡',
    tradition: 'hindu',
    type: 'stotram',
    mood: 'devotional',
    language: 'Hindi',
    source: 'Composed by Goswami Tulsidas',
    description: 'Eight verses praising the child deeds and infinite power of Hanuman, sung to remove any crisis or sorrow.',
    verses: [
      {
        number: 1,
        sanskrit: 'बाल समय रवि भक्षी लियो तब, तीनहुं लोक भयो अंधियारों ।\nताहि सों त्रास भयो जग को, यह संकट काहु सों जात न टारो ।\nदेवन आनि करी बिनती तब, छांड़ि दियो रवि कष्ट निवारो ।\nको नहिं जानत है जग में कपि, संकटमोचन नाम तिहारो ॥१॥',
        transliteration: 'Bāla samaya ravi bhakṣī liyo taba, tīnahuṅ loka bhayo andhiyāro.\nTāhi soṅ trāsa bhayo jaga ko, yaha saṅkaṭa kāhu soṅ jāta na ṭāro.\nDevana āni karī binatee taba, chāṅṛi diyo ravi kaṣṭa nivāro.\nKo nahiṅ jānata hai jaga meṅ kapi, saṅkaṭamocana nāma tihāro.',
        meaning: 'As a child, you swallowed the sun, plunging the three worlds into darkness. The world was terrified, and no one could resolve this crisis. When the gods begged you, you released the sun, ending the suffering. Who in this world does not know, O Monkey, that your name is the Destroyer of Suffering (Sankat Mochan)?',
        meaning_hi: 'जय हनुमान! ज्ञान और गुण के भण्डार, शत्रुओं के अहंकार का नाश करने वाले, रोगों को समूल नष्ट करने वाले, महाप्रतापी। जो सदा विजयी हैं, जिनका नाम दुखों को हरता है।',
      },
      {
        number: 2,
        sanskrit: 'बालि की त्रास कपीस बसैं गिरि, जात महाप्रभु पंथ निहारो ।\nचौंकि महामुनि साप दियो तब, चाहिए कौन बिचार बिचारो ।\nकै द्विज रूप लिवाय महाप्रभु, सो तुम दास के सोक निवारो ।\nको नहिं जानत है जग में कपि, संकटमोचन नाम तिहारो ॥२॥',
        transliteration: 'Bāli kī trāsa kapīsa basaiṅ giri, jāta mahāprabhu paṅtha nihāro.\nCauṅki mahāmuni sāpa diyo taba, cāhiye kauna bicāra bicāro.\nKai dvija rūpa livāya mahāprabhu, so tuma dāsa ke soka nivāro.\nKo nahiṅ jānata hai jaga meṅ kapi, saṅkaṭamocana nāma tihāro.',
        meaning: "Fearing Bali, Sugriva lived on the mountain, watching the path for a savior. Terrified of the sage's curse, he wondered what to do. Appearing in the form of a Brahmin, you brought Lord Rama to him, removing your devotee's sorrow. Who in this world does not know, O Monkey, that your name is Sankat Mochan?",
        meaning_hi: 'हे महाबली! जिन्होंने राम का कार्य किया — सीता की खोज, लंका दहन, सेतु निर्माण में योगदान। आपकी भुजाओं का बल अतुलित है।',
      },
      {
        number: 3,
        sanskrit: 'अंगद के संग लेन गए सिय, खोज कपीस यह बैन उचारो ।\nजीवत ना बचिहौ हम सो जु, बिना सुधि लाए इहाँ पगु धारो ॥\nहेरि थके तट सिंधु सबै तब, लाए सिय-सुधि प्राण उबारो ।\nको नहिं जानत है जग में कपि, संकटमोचन नाम तिहारो ॥३॥',
        transliteration: 'Aṅgada ke saṅga lena gae siya, khoja kapīsa yaha baina ucāro.\nJīvata nā bacihau hama so ju, binā sudhi lāe ihāṅ pagu dhāro.\nHeri thake taṭa siṅdhu sabai taba, lāe siya-sudhi prāṇa ubāro.\nKo nahiṅ jānata hai jaga meṅ kapi, saṅkaṭamocana nāma tihāro.',
        meaning: "When you went with Angada to find Sita, the monkey king Sugriva warned: 'You shall not survive if you return here without bringing news.' When all grew exhausted at the seashore, you crossed the ocean, brought news of Sita, and saved their lives. Who in this world does not know, O Monkey, that your name is Sankat Mochan?",
        meaning_hi: 'जब लक्ष्मण मूर्छित हुए, आपने द्रोणाचल पर्वत उठाकर संजीवनी लाई। श्री रघुवीर के प्रिय, आपकी महिमा अपार है।',
      },
      {
        number: 4,
        sanskrit: 'रावन त्रास दई सिय को सब, राक्षसि सों कहि सोक निवारो ।\nताहि समय हनुमान महाप्रभु, जाय महा रजनीचर मारो ॥\nचाहत सिय असोक सों आगि सु, दै प्रभु मुद्रिका सोक निवारो ।\nको नहिं जानत है जग में कपि, संकटमोचन नाम तिहारो ॥४॥',
        transliteration: 'Rāvana trāsa daī siya ko saba, rākṣasi soṅ kahi soka nivāro.\nTāhi samaya hanumāna mahāprabhu, jāya mahā rajanīcara māro.\nCāhata siya asoka soṅ āgi su, dai prabhu mudrikā soka nivāro.\nKo nahiṅ jānata hai jaga meṅ kapi, saṅkaṭamocana nāma tihāro.',
        meaning: "When Ravana threatened Sita and ordered demonesses to torment her to remove her resolve, you, O Lord Hanuman, went there and destroyed the great demons. When Sita wished for fire from the Ashoka tree to end her grief, you dropped the Lord's ring, removing her sorrow. Who in this world does not know, O Monkey, that your name is Sankat Mochan?",
        meaning_hi: 'सुग्रीव को राम से मिलाया, विभीषण को लंका का राजा बनाया। समुद्र लाँघे, अशोक वाटिका उजाड़ी — आपके कार्य अनगिनत हैं।',
      },
      {
        number: 5,
        sanskrit: 'बान लग्यो उर लछिमन के तब, प्राण तजे सुत रावन मारो ।\nलै गृह बैद्य सुषेण समेत तबै, गिरि द्रोण सु बीर उपारो ॥\nआनि सजीवन हाथ दई तब, लछिमन के तुम प्राण उबारो ।\nको नहिं जानत है जग में कपि, संकटमोचन नाम तिहारो ॥५॥',
        transliteration: 'Bāna lagyo ura lachimana ke taba, prāṇa taje suta rāvana māro.\nLai gṛha vaidya suṣeṇa sameta tabai, giri droṇa su bīra upāro.\nĀni sajīvana hātha daī taba, lachimana ke tuma prāṇa ubāro.\nKo nahiṅ jānata hai jaga meṅ kapi, saṅkaṭamocana nāma tihāro.',
        meaning: "When the arrow struck Lakshman's chest and he lay near death, shot by Ravana's son, you brought the physician Sushena along with his house. You then plucked and carried the Drona mountain, placed the Sanjeevani herb in hand, and saved Lakshman's life. Who in this world does not know, O Monkey, that your name is Sankat Mochan?",
        meaning_hi: 'पाताल में जाकर अहिरावण का नाश किया और प्रभु को मुक्त कराया। आप भक्तों की रक्षा के लिए सदा तत्पर रहते हैं।',
      },
      {
        number: 6,
        sanskrit: 'रावन जुद्ध अजान कियो तब, नाग की फाँस सबै सिर डारो ।\nश्रीरघुनाथ समेत सबै दल, मोह भयो यह संकट भारो ॥\nआनि खगेस तबै हनुमान जु, बंधन काटि सु त्रास निवारो ।\nको नहिं जानत है जग में कपि, संकटमोचन नाम तिहारो ॥६॥',
        transliteration: 'Rāvana juddha ajāna kiyo taba, nāga kī phāṅsa sabai sira dāro.\nŚrīraghunātha sameta sabai dala, moha bhayo yaha saṅkaṭa bhāro.\nĀni khagesa tabai hanumāna ju, baṅdhana kāṭi su trāsa nivāro.\nKo nahiṅ jānata hai jaga meṅ kapi, saṅkaṭamocana nāma tihāro.',
        meaning: "When Ravana waged a deceitful war and bound all in the serpent-noose, Lord Rama and the entire army fell into deep delusion — a massive crisis. You brought Garuda (the king of birds), who severed the bonds and removed their terror. Who in this world does not know, O Monkey, that your name is Sankat Mochan?",
        meaning_hi: 'जो भी संकट में आपको पुकारे, आप तुरंत दौड़ते हैं। आपकी भक्ति से सभी बाधाएँ दूर होती हैं और मनोकामनाएँ पूर्ण होती हैं।',
      },
      {
        number: 7,
        sanskrit: 'बंधु समेत जबै अहिरावन, लै रघुनाथ पताल सिधारो ।\nदेविहिं पूजि भली बिधि सों बलि, देउ सबै मिलि मंत्र बिचारो ॥\nजाय सहाय भयो तब ही, अहिरावन सैन्य समेत संघारो ।\nको नहिं जानत है जग में कपि, संकटमोचन नाम तिहारो ॥७॥',
        transliteration: 'Baṅdhu sameta jabai ahirāvana, lai raghunātha patāla sidhāro.\nDevihiṅ pūji bhalī bidhi soṅ bali, deu sabai mili maṅtra bicāro.\nJāya sahāya bhayo taba hī, ahirāvana sainya sameta saṅghāro.\nKo nahiṅ jānata hai jaga meṅ kapi, saṅkaṭamocana nāma tihāro.',
        meaning: "When Ahiravana abducted Lord Rama and his brother Lakshman to the netherworld to sacrifice them after worshipping the Goddess, you went to their aid, destroying Ahiravana along with his entire army. Who in this world does not know, O Monkey, that your name is Sankat Mochan?",
        meaning_hi: 'राम नाम आपके हृदय में बसा है। आप राम के दूत, परम भक्त और शक्ति के स्वामी हैं। आपका स्मरण मात्र ही भय का नाश करता है।',
      },
      {
        number: 8,
        sanskrit: 'काज किए बड़ देवन के तुम, बीर महाप्रभु देखि बिचारो ।\nकौन सो संकट मोर गरीब को, जो तुमसों नहिं जात है टारो ॥\nबेगि हरो हनुमान महाप्रभु, जो कछु संकट होय हमारो ।\nको नहिं जानत है जग में कपि, संकटमोचन नाम तिहारो ॥८॥',
        transliteration: 'Kāja kie baṛa devana ke tuma, bīra mahāprabhu dekhi bicāro.\nKauna so saṅkaṭa mora garība ko, jo tumasoṅ nahiṅ jāta hai ṭāro.\nBegi haro hanumāna mahāprabhu, jo kachu saṅkaṭa hoya hamāro.\nKo nahiṅ jānata hai jaga meṅ kapi, saṅkaṭamocana nāma tihāro.',
        meaning: "O brave, great Lord, think of all the grand deeds you have accomplished for the gods! What crisis of this poor devotee of yours is so great that you cannot remove it? O Lord Hanuman, quickly dispel whatever suffering I have. Who in this world does not know, O Monkey, that your name is Sankat Mochan?",
        meaning_hi: 'जो यह हनुमान अष्टक पढ़ता है, उसे सभी सुख मिलते हैं। रोग, दुख और संकट दूर होते हैं और वह राम भक्ति में स्थिर होता है।',
      }
    ]
  },
  // ── Ram Raksha Stotram ─────────────────────────────────────────────────────
  {
    id: 'ram-raksha-stotram',
    title: 'Ram Raksha Stotram',
    titleDevanagari: 'रामरक्षास्तोत्रम्',
    deity: 'vishnu',
    deityEmoji: '🏹',
    tradition: 'hindu',
    type: 'stotram',
    mood: 'protective',
    language: 'Sanskrit',
    source: 'Composed by Budha Kaushika Rishi',
    description: 'A powerful armour of prayer (Raksha Kavach) to Lord Ramachandra, widely chanted for longevity, protection, and complete safety.',
    verses: [
      {
        number: 1,
        sanskrit: 'चरितं रघुनाथस्य शतकोटिप्रविस्तरम् ।\nएकैकमक्षरं पुंसां महापातकनाशनम् ॥',
        transliteration: 'Caritaṃ raghunāthasya śatakoṭipravistaram\nekaikamākṣaraṃ puṃsāṃ mahāpātakanāśanam',
        meaning: 'The story of Lord Rama is infinite and spans a hundred crore verses. Every single letter of it is capable of destroying the greatest sins of humanity.',
        startSecs: 0,
        meaning_hi: 'रघुनाथ का चरित्र अनंत है और उसकी महिमा का विस्तार असंख्य श्लोकों में भी पूरा नहीं हो सकता। उसके प्रत्येक अक्षर में इतना पवित्र बल है कि वह बड़े से बड़े पाप को भी नष्ट करने की शक्ति रखता है।'
      }
    ]
  },
  // ── Vishnu Sahasranama Stotram ─────────────────────────────────────────────
  {
    id: 'vishnu-sahasranama',
    title: 'Vishnu Sahasranama Stotram',
    titleDevanagari: 'विष्णुसहस्रनामस्तोत्रम्',
    deity: 'vishnu',
    deityEmoji: '👑',
    tradition: 'hindu',
    type: 'stotram',
    mood: 'devotional',
    language: 'Sanskrit',
    source: 'Mahabharata — Anushasana Parva',
    description: 'The thousand names of Lord Vishnu revealed by Bhishma Pitamah to Yudhishthira on his bed of arrows, representing the ultimate path of peace.',
    verses: [
      {
        number: 1,
        sanskrit: 'शुक्लाम्बरधरं विष्णुं शशिवर्णं चतुर्भुजम् ।\nप्रसन्नवदनं ध्यायेत् सर्वविघ्नोपशान्तये ॥',
        transliteration: 'Śuklāmbaradharaṃ viṣṇuṃ śasivarṇaṃ caturbhujam\nprasannavadanaṃ dhyāyet sarvavighnopaśāntaye',
        meaning: 'We meditate upon Lord Vishnu, who wears white robes, is radiant like the moon, has four arms, and bears a compassionate smile, to remove all obstacles.',
        startSecs: 0,
        meaning_hi: 'हम श्वेतवस्त्रधारी, चंद्रमा के समान शांत और उज्ज्वल, चार भुजाओं वाले तथा प्रसन्न मुख भगवान विष्णु का ध्यान करते हैं। उनका स्मरण सभी विघ्नों को शांत करने और मन को स्थिर करने वाला है।'
      }
    ]
  },
  // ── Achyutashtakam ─────────────────────────────────────────────────────────
  {
    id: 'achyutashtakam',
    title: 'Achyutashtakam',
    titleDevanagari: 'अच्युताष्टकम्',
    deity: 'vishnu',
    deityEmoji: '🪶',
    tradition: 'hindu',
    type: 'stotram',
    mood: 'devotional',
    language: 'Sanskrit',
    source: 'Composed by Adi Shankaracharya',
    description: 'A beautiful eight-verse devotional song listing the sacred names and sweet forms of Lord Krishna and Ramachandra.',
    audioTrackId: 'achyutashtakam',
    verses: [
      {
        number: 1,
        sanskrit: 'अच्युतं केशवं रामनारायणं\nकृष्णदामोदरं वासुदेवं हरिम्।\nश्रीधरं माधवं गोपिकावल्लभं\nजानकीनायकं रामचन्द्रं भजे॥',
        transliteration: 'Acyutaṃ keśavaṃ rāmanārāyaṇaṃ\nkṛṣṇadāmodaraṃ vāsudevaṃ harim\nśrīdharaṃ mādhavaṃ gopikāvallabhaṃ\njānakīnāyakaṃ rāmacandraṃ bhaje',
        meaning: 'I worship the Lord through these beloved names: Achyuta (the infallible), Keshava, Rama, Narayana, Krishna, Damodara, Vasudeva, Hari, Shridhara, Madhava, the beloved of the gopis, and Ramachandra, the Lord of Janaki.',
        meaning_hi: 'मैं भगवान अच्युत, केशव, राम, नारायण, कृष्ण, दामोदर, वासुदेव, हरि, श्रीधर, माधव, गोपिकाओं के प्रियतम और जानकी के स्वामी श्रीरामचन्द्र का भजन करता हूँ।'
      },
      {
        number: 2,
        sanskrit: 'अच्युतं केशवं सत्यभामाधवं\nमाधवं श्रीधरं राधिकाराधितम्।\nइन्दिरामन्दिरं चेतसा सुन्दरं\nदेवकीनन्दनं नन्दजं सन्दधे॥',
        transliteration: 'Acyutaṃ keśavaṃ satyabhāmādhavaṃ\nmādhavaṃ śrīdharaṃ rādhikārādhitam\nindirāmandiraṃ cetasā sundaraṃ\ndevakīnandanaṃ nandajaṃ sandadhe',
        meaning: 'In my heart, I hold the beautiful Lord who is Keshava, the beloved of Satyabhama, Madhava, Shridhara, adored by Radhika, the abode of Lakshmi (Indira), Devaki’s son, and Nanda’s child.',
        meaning_hi: 'मैं उन अति सुन्दर भगवान केशव, सत्यभामा के प्रिय माधव, श्रीधर, राधिका द्वारा आराधित, लक्ष्मी के आश्रय, देवकीनन्दन और नन्दलाल का अपने हृदय में ध्यान करता हूँ।'
      },
      {
        number: 3,
        sanskrit: 'विष्णवे जिष्णवे शंखिने चक्रिणे\nरुक्मिणीरागिणे जानकीजानये।\nवल्लवीवल्लभायार्चितायात्मने\nकंसविध्वंसिने वंशिने ते नमः॥',
        transliteration: 'Viṣṇave jiṣṇave śaṃkhine cakriṇe\nrukmiṇīrāgiṇe jānakījānaye\nvallavīvallabhāyārcitāyātmane\nkaṃsavidhvaṃsine vaṃśine te namaḥ',
        meaning: 'Salutations to Vishnu, the victorious Lord bearing the conch and discus, beloved of Rukmini, known to Janaki, cherished and worshipped by the cowherd maidens, destroyer of Kamsa, and player of the divine flute.',
        meaning_hi: 'शंख और चक्र धारण करने वाले, विजयी विष्णु, रुक्मिणी के प्रिय, जानकी के स्वामी, गोपियों द्वारा पूजित, कंस का विनाश करने वाले और वंशी बजाने वाले भगवान को मेरा नमस्कार है।'
      },
      {
        number: 4,
        sanskrit: 'कृष्ण गोविन्द हे राम नारायण\nश्रीपते वासुदेवाजित श्रीनिधे।\nअच्युतानन्त हे माधव त्र्यम्बक\nद्वारकानायक द्रौपदीरक्षक॥',
        transliteration: 'Kṛṣṇa govinda he rāma nārāyaṇa\nśrīpate vāsudevājita śrīnidhe\nacyutānanta he mādhava tryambaka\ndvārakānāyaka draupadīrakṣaka',
        meaning: 'O Krishna, Govinda, Rama, Narayana, Lord of Lakshmi, Vasudeva, unconquered treasure of grace! O Achyuta, Ananta, Madhava, Tryambaka, Lord of Dwaraka and protector of Draupadi — I call out to You.',
        meaning_hi: 'हे कृष्ण, गोविन्द, राम, नारायण, रमानिवास, अजेय वासुदेव, श्रीनिधे, अच्युत, अनन्त, माधव, त्रयम्बक, द्वारकानाथ और द्रौपदी की रक्षा करने वाले प्रभो! मैं आपको पुकारता हूँ।'
      },
      {
        number: 5,
        sanskrit: 'राक्षसक्षोभितः सीतया शंकितो\nनस्तदा रामकृष्णेति विक्रोशति।\nसुप्तवान् पुण्डरीकाक्ष लोकत्रये\nतारयस्वाशु मां भक्तवत्सल प्रभो॥',
        transliteration: 'Rākṣasakṣobhitaḥ sītayā śaṃkito\nnastadā rāmakṛṣṇeti vikrośati\nsuptavān puṇḍarīkākṣa lokatraye\ntārayasvāśu māṃ bhaktavatsala prabho',
        meaning: 'When frightened by the demons and fearful for Sita, or when calling out "Rama, Krishna," one is heard by the lotus-eyed Lord who watches over the three worlds. O Lord who loves His devotees, please ferry me swiftly across this ocean of existence.',
        meaning_hi: 'राक्षसों से भयभीत और सीता के लिए चिंतित होने पर जो \'राम, कृष्ण\' पुकारते हैं, उनकी रक्षा करने वाले, तीनों लोकों के स्वामी कमलनेत्र भगवान! हे भक्तवत्सल प्रभो, मुझे शीघ्र इस संसार-सागर से पार करें।'
      },
      {
        number: 6,
        sanskrit: 'स्तोत्रमेतत्पठेद्विष्णोर्भक्तो यः शृणुयादपि।\nसर्वपापविनिर्मुक्तो विष्णोः सायुज्यमाप्नुयात्॥',
        transliteration: 'Stotrametatpaṭhedviṣṇorbhakto yaḥ śṛṇuyādapi\nsarvapāpavinirmukto viṣṇoḥ sāyujyamāpnuyāt',
        meaning: 'Any devotee of Lord Vishnu who recites or even listens to this hymn will be freed from all sins and will attain union (Sayujya) with the Supreme Lord.',
        meaning_hi: 'जो भी भगवान विष्णु का भक्त इस स्तोत्र का पाठ करता है या इसे सुनता है, वह सभी पापों से मुक्त होकर भगवान विष्णु के सायुज्य (परम धाम) को प्राप्त कर लेता है।'
      },
      {
        number: 7,
        sanskrit: 'विद्युदुद्योतवत् प्रस्फुरद्वाससं\nप्रावृडम्भोदवत् प्रोल्लसद्विग्रहम्।\nवन्यमालाधरं शोभितोरःस्थलं\nलोहिताङ्घ्रिद्वयं वारिजाक्षं भजे॥',
        transliteration: 'Vidyududyotavat prasphuradvāsasaṃ\nprāvṛḍambhodavat prollasadvigraham\nvanyamālādharaṃ śobhitoraḥsthalaṃ\nlohitāṅghridvayaṃ vārijākṣaṃ bhaje',
        meaning: 'I worship the lotus-eyed Lord whose garments flash like lightning, whose form shines beautifully like a dark raincloud, who wears a forest garland across His chest, and whose two feet glow a soft rosy-red.',
        meaning_hi: 'बिजली के समान चमकते हुए पीताम्बर वाले, वर्षाकाल के बादलों के समान श्याम वर्ण वाले, वनमाला धारण करने वाले और जिनके चरण कमल लाल हैं, ऐसे कमलनयन भगवान का मैं भजन करता हूँ।'
      },
      {
        number: 8,
        sanskrit: 'कुञ्चितैः कुन्तलैर्भ्राजमानाननं\nरत्नमौलिं लसत्कुण्डलं गण्डयोः।\nहारकेयूरकं कङ्कणप्रोज्ज्वलं\nकिङ्किणीमञ्जुलं श्यामलं तं भजे॥',
        transliteration: 'Kuñcitaiḥ kuntalairbhrājamānānanaṃ\nratnamauliṃ lasatkuṇḍalaṃ gaṇḍayoḥ\nhārakeyūrakaṃ kaṅkaṇaprojjvalaṃ\nkiṅkiṇīmañjulaṃ śyāmalaṃ taṃ bhaje',
        meaning: 'I worship that dark and beautiful Lord, whose face is radiant with curling locks of hair, who wears a jeweled crown, shining earrings resting on His cheeks, and is brightly adorned with necklaces, armlets, bracelets, and sweet-sounding waist-bells.',
        meaning_hi: 'घुंघराले बालों से सुशोभित मुख वाले, मस्तक पर रत्नजड़ित मुकुट और गालों पर चमकते कुंडल धारण करने वाले, हार, बाजूबंद, कंगन और करधनी से सजे हुए श्यामसुंदर का मैं ध्यान करता हूँ।'
      }
    ]
  },
  // ── Govinda Damodara Stotram ───────────────────────────────────────────────
  {
    id: 'govinda-damodara',
    title: 'Govinda Damodara Stotram',
    titleDevanagari: 'गोविन्द दामोदर स्तोत्रम्',
    deity: 'vishnu',
    deityEmoji: '🪈',
    tradition: 'hindu',
    type: 'stotram',
    mood: 'devotional',
    language: 'Sanskrit',
    source: 'Composed by Sri Bilvamangala Thakura',
    description: 'An ecstatic stotram glorifying the sweet names of Govinda, Damodara, and Madhava, capturing the deep devotion of Draupadi and other bhaktas.',
    verses: [
      {
        number: 1,
        sanskrit: 'अग्रे कुरूणामथ पाण्डवानां\nदुःशासनेनाहृतवस्त्रकेशा ।\nकृष्णा क्रोशद्द्द्वारवतिस्थं\nगोविन्द दामोदर माधवेति ॥',
        transliteration: 'Agre kurūṇāmatha pāṇḍavānām\nduḥśāsanenāhṛtavastrakeśā\nkṛṣṇā krośad dvāravatisthaṃ\ngovinda dāmodara mādhaveti',
        meaning: 'In front of the Kurus and Pandavas, when Draupadi\'s robes and hair were dragged by Duhshasana, she cried out to the Lord dwelling in Dwaraka: "O Govinda! O Damodara! O Madhava!"',
        startSecs: 0,
        meaning_hi: 'जब सभा में दुष्शासन ने द्रौपदी का अपमान किया, तब उसने सभी सांसारिक सहारों को छोड़कर केवल कृष्ण को पुकारा। उस पुकार में गोविन्द, दामोदर और माधव नाम ही उसके रक्षक बनकर प्रकट हुए।'
      }
    ]
  },
  // ── Bhaja Govindam ─────────────────────────────────────────────────────────
  {
    id: 'bhaja-govindam',
    title: 'Bhaja Govindam',
    titleDevanagari: 'भज गोविन्दम्',
    deity: 'vishnu',
    deityEmoji: '🪔',
    tradition: 'hindu',
    type: 'stotram',
    mood: 'devotional',
    language: 'Sanskrit',
    source: 'Composed by Adi Shankaracharya',
    description: 'A wake-up call to the soul, encouraging surrender and memory of the divine rather than wasting life on dry intellect and material acquisitions.',
    verses: [
      {
        number: 1,
        sanskrit: 'भज गोविन्दं भज गोविन्दं\nगोविन्दं भज मूढमते ।\nसम्प्राप्ते सन्निहिते काले\nनहि नहि रक्षति डुकृञ्करणे ॥ १ ॥',
        transliteration: 'Bhaja gōvindaṃ bhaja gōvindaṃ gōvindaṃ bhaja mūḍhamatē |\nSamprāptē sannihitē kālē nahi nahi rakṣati ḍukṛṅkaraṇē || 1 ||',
        meaning: 'Worship Govinda, worship Govinda, worship Govinda, O foolish mind! When the appointed time of death arrives, the rules of grammar and worldly knowledge will not save you.',
        meaning_hi: 'भज गोविंद, भज गोविंद, गोविंद भज मूढ़मते। जब अंत समय (मृत्यु काल) निकट आएगा, तब व्याकरण के नियम और सांसारिक ज्ञान तुम्हारी रक्षा नहीं कर पाएंगे।',
      },
      {
        number: 2,
        sanskrit: 'मूढ जहीहि धनागमतृष्णां\nकुरु सद्बुद्धिं मनसि वितृष्णाम् ।\nयल्लभसे निजकर्मोपात्तं\nवित्तं तेन विनोदय चित्तम् ॥ २ ॥',
        transliteration: 'Mūḍha jahīhi dhanāgamatṛṣṇāṃ kuru sadbuddhiṃ manasi vitṛṣṇām |\nYallabhasē nijakarmōpāttaṃ vittaṃ tēna vinōdaya chittam || 2 ||',
        meaning: 'O fool! Give up your thirst to amass wealth, and devote your mind to dispassion and thoughts of the Real. Be content with what comes to you through your own past actions.',
        meaning_hi: 'हे मूर्ख! धन एकत्र करने की तृष्णा को त्याग दो। अपने मन में वैराग्य और सत्य के प्रति विचार लाओ। अपने पूर्व कर्मों के अनुसार तुम्हें जो भी प्राप्त हो, उसी से अपने चित्त को संतुष्ट रखो।',
      },
      {
        number: 3,
        sanskrit: 'नारीस्तनभरनाभीदेशं\nदृष्ट्वा मा गा मोहावेशम् ।\nएतन्मांसवसादिविकारं\nमनसि विचिन्तय वारं वारम् ॥ ३ ॥',
        transliteration: 'Nārīstanabhara-nābhīdēśaṃ dṛṣṭvā mā gā mōhāvēśam |\nĒtanmāṃsavasādivikāraṃ manasi vichintaya vāraṃ vāram || 3 ||',
        meaning: 'Do not fall into delusion by getting lost in lust at the sight of a woman’s form. These are nothing but modifications of flesh, fat and bones. Contemplate this again and again in your mind.',
        meaning_hi: 'नारी के सौंदर्य को देखकर काम-मोह के वशीभूत मत हो। अपने मन में बार-बार विचार करो कि यह शरीर केवल हाड़-मांस, वसा और त्वचा का एक विकार मात्र है।',
      },
      {
        number: 4,
        sanskrit: 'नलिनीदलगतजलमतितरलं\nतद्वज्जीवितमतिशयचपलम् ।\nविद्धि व्याध्यभिमानग्रस्तं\nलोकं शोकहतं च समस्तम् ॥ ४ ॥',
        transliteration: 'Nalinīdala-gatajalamatitaralaṃ tadvajjīvitamatiśaya-chapalam |\nViddhi vyādhyabhimānagrastaṃ lōkaṃ śōkahataṃ cha samastam || 4 ||',
        meaning: 'The life of a person is as uncertain as a water drop resting on a lotus leaf. Know that the entire world is consumed by disease, ego, and overwhelming grief.',
        meaning_hi: 'मनुष्य का जीवन कमल के पत्ते पर स्थित पानी की बूंद के समान अत्यंत चंचल और अस्थिर है। जानो कि यह संपूर्ण संसार रोग, अहंकार और शोक से ग्रस्त है।',
      },
      {
        number: 5,
        sanskrit: 'यावद्वित्तोपाजनसक्तः\nतावन्निजपरिवारो रक्तः ।\nपश्चाज्जीवति जर्जरदेहे\nवार्तां कोऽपि न पृच्छति गेहे ॥ ५ ॥',
        transliteration: 'Yāvadvittōpārjanasaktaḥ tāvannijaparivārō raktaḥ |\nPaśchājjīvati jarjaradēhē vārtāṃ kō\'pi na pṛchChati gēhē || 5 ||',
        meaning: 'As long as a man is able to earn wealth, his family members are affectionate toward him. But when his body grows old and weak, no one at home even cares to speak to him.',
        meaning_hi: 'जब तक मनुष्य धन उपार्जन करने में समर्थ रहता है, तब तक परिवार के लोग उसके प्रति अनुराग रखते हैं। लेकिन वृद्ध और जर्जर शरीर होने पर, घर में कोई उसका कुशल-क्षेम भी नहीं पूछता।',
      },
      {
        number: 6,
        sanskrit: 'यावत्पवनो निवसति देहे\nतावत्पृच्छति कुशलं गेहे ।\nगतवति वायौ देहापाये\nभार्या बिभ्यति तस्मिन्काये ॥ ६ ॥',
        transliteration: 'Yāvatpavanō nivasati dēhē tāvatpṛchChati kuśalaṃ gēhē |\nGatavati vāyau dēhāpāyē bhāryā bibhyati tasminkāyē || 6 ||',
        meaning: 'As long as there is life and breath in the body, people in the house ask about your welfare. Once the life force departs, even your own wife fears the cold body.',
        meaning_hi: 'जब तक शरीर में प्राण (वायु) रहते हैं, तब तक घर के लोग आदर से हालचाल पूछते हैं। प्राण चले जाने पर (मृत्यु होने पर) स्वयं पत्नी भी उस ठंडे शरीर (शव) से भयभीत होने लगती है।',
      },
      {
        number: 7,
        sanskrit: 'बालस्तावत्क्रीडासक्तः\nतरुणस्तावत्तरुणीसक्तः ।\nवृद्धस्तावच्चिन्तासक्तः\nपरमे ब्रह्मणि कोऽपि न सक्तः ॥ ७ ॥',
        transliteration: 'Bālastāvatkrīḍāsaktaḥ taruṇastāvattaruṇīsaktaḥ |\nVṛddhastāvachchintāsaktaḥ paramē brahmaṇi kō\'pi na saktaḥ || 7 ||',
        meaning: 'Childhood is lost in play, youth is lost in attraction to partners, and old age is lost in anxiety. Alas, there is hardly anyone who remains devoted to the Supreme Brahman.',
        meaning_hi: 'बचपन खेल-कूद में बीत जाता है, युवावस्था भोग-विलास और काम में नष्ट हो जाती है, और वृद्धावस्था चिंताओं से घिर जाती है। हाए, परमब्रह्म परमेश्वर में किसी का मन लीन नहीं होता।',
      },
      {
        number: 8,
        sanskrit: 'का ते कान्ता कस्ते पुत्रः\nसंसारोऽयमतीव विचित्रः ।\nकस्य त्वं कः कुत आयातः\nतत्त्वं चिन्तय तदिह भ्रातः ॥ ८ ॥',
        transliteration: 'Kā tē kāntā kastē putraḥ saṃsārō\'yamatīva vichitraḥ |\nKasya tvaṃ kaḥ kuta āyātaḥ tattvaṃ chintaya tadiha bhrātaḥ || 8 ||',
        meaning: 'Who is your wife? Who is your son? This world of relative existence is indeed very strange. Whose are you? Where have you come from? Brother, think of the ultimate Truth behind all this.',
        meaning_hi: 'तुम्हारी पत्नी कौन है? तुम्हारा पुत्र कौन है? यह संसार अत्यंत विचित्र और रहस्यमयी है। तुम किसके हो? कहाँ से आए हो? हे भाई! इस परम सत्य का सदा मन में विचार करो।',
      },
      {
        number: 9,
        sanskrit: 'सत्सङ्गत्वे निस्सङ्गत्वं\nनिस्सङ्गत्वे निर्मोहत्वम् ।\nनिर्मोहत्वे निश्चलतत्त्वं\nनिश्चलतत्त्वे जीवन्मुक्तिः ॥ ९ ॥',
        transliteration: 'Satsaṅgatvē nissaṅgatvaṃ nissaṅgatvē nirmōhatvam |\nNirmōhatvē niśchalatattvaṃ niśchalatattvē jīvanamuktiḥ || 9 ||',
        meaning: 'Through the company of the holy, non-attachment arises; through non-attachment, delusion ceases; when delusion ceases, the mind becomes unwavering; when the mind is unwavering, one attains liberation while still alive.',
        meaning_hi: 'जो प्रतिदिन दान, पूजा और तप करता है — उसे मोक्ष की प्राप्ति होती है; इसमें संशय नहीं।',
      },
      {
        number: 10,
        sanskrit: 'वयसि गते कः कामविकारः\nशुष्के नीरे कः कासारः ।\nक्षीणे वित्ते कः परिवारो\nज्ञाते तत्त्वे कः संसारः ॥ १० ॥',
        transliteration: 'Vayasi gatē kaḥ kāmavikāhaḥ śuṣkē nīrē kaḥ kāsāraḥ |\nKṣīṇē vittē kaḥ parivārō jñātē tattvē kaḥ saṃsāraḥ || 10 ||',
        meaning: 'When youth has passed, where is the lust? When the water has dried up, where is the lake? When wealth is gone, where are the relatives? When the Truth is realized, where is the cycle of rebirth (samsara)?',
        meaning_hi: 'गेरुआ वस्त्र पहन लेने से संन्यास नहीं होता, शिखा काट लेने से नहीं। भगवद्गीता पढ़ो, भगवान का नाम जपो — यही सच्चा संन्यास है।',
      },
      {
        number: 11,
        sanskrit: 'मा कुरु धनजनयौवनगर्वं\nहरति निमेषात्कालः सर्वम् ।\nमायामयमिदमखिलं हितत्वा\nब्रह्मपदं त्वं प्रविश विदित्वा ॥ ११ ॥',
        transliteration: 'Mā kuru dhanajana yauvana garvaṃ harati nimeṣāt-kālaḥ sarvam |\nMāyāmayamidam-akhilaṃ hitvā brahmapadaṃ tvaṃ praviśa viditvā || 11 ||',
        meaning: 'Do not be proud of wealth, followers, or youth. Time destroys all of these in a blink. Realizing that this entire world is an illusion created by Maya, abandon it and enter the state of Brahman.',
        meaning_hi: 'जब तक शरीर में श्वास है, पत्नी-परिवार सब पूछते हैं। जब प्राण निकल जाते हैं, वही शरीर से डर जाते हैं।',
      },
      {
        number: 12,
        sanskrit: 'दिनयामिन्यौ सायं प्रातः\nशिशिरवसन्तौ पुनरायातः ।\nकालः क्रीडति गच्छत्यायुः\nतदपि न मुञ्चत्याशावायुः ॥ १२ ॥',
        transliteration: 'Dinarāminyau sāyaṃprātaḥ śiśiravasantau punāyātaḥ |\nKālaḥ krīḍati gachchatyāyuḥ tadapi na muñcatyāśāvāyuḥ || 12 ||',
        meaning: 'Day and night, dusk and dawn, winter and spring come and go again and again. Time plays, and life flows away, yet the storm of desire never leaves a person.',
        meaning_hi: 'बालक ब्रह्मचर्य में रत है, युवक सांसारिक विषयों में — वृद्ध अपनी चिंताओं में — कोई परमात्मा का ध्यान नहीं करता।',
      },
      {
        number: 13,
        sanskrit: 'द्वादशमञ्जरिकाभिरशेषः\nकथितो वैयाकरणस्यैषः ।\nउपदेशोऽभूद्विद्यानिपुणैः\nश्रीमच्छङ्करभगवच्छरणैः ॥ १३ ॥',
        transliteration: 'Dvādaśamañjarikābhiraśēṣaḥ kathitō vaiyākaraṇasyaiṣah |\nUpadēśō\'bhūdvidyānipuṇaiḥ śrīmachChaṅkarabhagavachCharaṇaiḥ || 13 ||',
        meaning: 'This bouquet of twelve verses was composed as an instruction to the grammarian by the highly intelligent and venerable Adi Shankaracharya.',
        meaning_hi: 'जो ज्ञान है वह विनम्रता से आता है, विनम्रता से पात्रता और पात्रता से धन — धन से धर्म और अंततः मोक्ष।',
      },
      {
        number: 14,
        sanskrit: 'का ते कान्ता कस्ते पुत्रः\nसंसारोऽयमतीव विचित्रः ।\nकस्य त्वं वा कुत आयातः\nतत्वं चिन्तय तदिह भ्रातः ॥ १४ ॥',
        transliteration: 'Kā tē kāntā kastē putraḥ saṃsārō\'yamatīva vichitraḥ |\nKasya tvaṃ vā kuta āyātaḥ tattvaṃ chintaya tadiha bhrātaḥ || 14 ||',
        meaning: 'Who is your wife? Who is your son? This relative world is highly mysterious. Whose are you? Where did you come from? O brother, contemplate this Truth here.',
        meaning_hi: 'काम की इच्छा क्रोध को जन्म देती है, क्रोध से मोह, मोह से भ्रम, भ्रम से स्मृतिनाश, स्मृतिनाश से विनाश।',
      },
      {
        number: 15,
        sanskrit: 'कामं क्रोधं लोभं मोहं\nत्यक्त्वाऽत्मानं भावय कोऽहम् ।\nआत्मज्ञानविहीना मूढाः\nते पच्यन्ते नरकनिगूढाः ॥ १५ ॥',
        transliteration: 'Kāmaṃ krōdhaṃ lōbhaṃ mōhaṃ tyaktvā\'tmānaṃ bhāvaya kō\'ham |\nĀtmajñānavihīnā mūḍhāḥ tē pachyantē narakanigūḍhāḥ || 15 ||',
        meaning: 'Renouncing lust, anger, greed, and delusion, contemplate within: "Who am I?" The fools who are devoid of self-knowledge undergo suffering, trapped in the hell of ignorance.',
        meaning_hi: 'गेरुए वस्त्र हों या जटा हों या फिर नग्नावस्था — बाहरी वेश से मुक्ति नहीं होती। जो देखा-सुना है उसे छोड़ो — अनुभव से ही ब्रह्म मिलता है।',
      },
      {
        number: 16,
        sanskrit: 'शत्रौ मित्रे पुत्रे बन्धौ\nमा कुरु यत्नं विग्रहसन्धौ ।\nभव समचित्तः सर्वत्र त्वं\nवाञ्छस्यचिराद्यदि विष्णुत्वम् ॥ १६ ॥',
        transliteration: 'Śatrau mitrē putrē bandhau mā kuru yatnaṃ vigrahasandhau |\nBhava samachittaḥ sarvatra tvaṃ vāñChasyachirādyadi viṣṇutvam || 16 ||',
        meaning: 'Do not waste your energy in making enemies or friends, or in bonding and fighting with sons and relatives. Be equal-minded in all situations if you wish to attain the state of Vishnu (omnipresence).',
        meaning_hi: 'शरीर रोगग्रस्त हो जाता है, यौवन नष्ट हो जाता है — काल (मृत्यु) किसी की प्रतीक्षा नहीं करता। तो भी मनुष्य अपनी आसक्ति नहीं छोड़ता।',
      },
      {
        number: 17,
        sanskrit: 'कुरुते गङ्गासागरगमनं\nव्रतपरिपालन मथवा दानम् ।\nज्ञानविहीनः सर्वमतेन\nमुक्तिं न भजति जन्मशतेन ॥ १७ ॥',
        transliteration: 'Kurutē gaṅgāsāgaragamanaṃ vrataparipālanamathavā dānam |\nJñānavihīnaḥ sarvamatēna muktiṃ na bhajati janmaśatēna || 17 ||',
        meaning: 'One may travel to the holy confluence of Ganga Sagar, keep rigorous vows, or perform charity. Yet, without spiritual wisdom, all paths agree one cannot attain liberation even in a hundred births.',
        meaning_hi: 'रोज देखते हो कि लोग मर रहे हैं — फिर भी मनुष्य इस भ्रम में जीता है कि मैं नहीं मरूँगा। यह माया की अद्भुत शक्ति है।',
      },
      {
        number: 18,
        sanskrit: 'सुरमन्दिरतरुमूलनिवासः\nशय्या भूतल मजिनं वासः ।\nसर्वपरिग्रह भोगत्यागः\nकस्य सुखं न करोति विरागः ॥ १८ ॥',
        transliteration: 'Suramandiratarumūlanivāsaḥ śayyā bhūtalamajinaṃ vāsaḥ |\nSarvaparigrahabhogatyāgaḥ kasya sukhaṃ na karoti virāgaḥ || 18 ||',
        meaning: 'Dwelling in a temple or under a tree, sleeping on the bare ground, wearing simple skins, and renouncing all possessions and pleasures—to whom will such dispassion (vairagya) not bring ultimate joy?',
        meaning_hi: 'द्वादशमंजरिका — ये बारह श्लोक शंकराचार्य ने मूढ़ व्यक्ति के कल्याण के लिए कहे हैं। भज गोविंद!',
      },
      {
        number: 19,
        sanskrit: 'योगरतो वा भोगरतो वा\nसङ्गरतो वा सङ्गविहीनः ।\nयस्य ब्रह्मणि रमते चित्तं\nनन्दति नन्दति नन्दत्येव ॥ १९ ॥',
        transliteration: 'Yōgaratō vā bhōgaratō vā saṅgaratō vā saṅgavihīnaḥ |\nYasya brahmaṇi ramatē chittaṃ nandati nandati nandatyēva || 19 ||',
        meaning: 'Whether one is practicing yoga or enjoying comforts, whether in company or in solitude—only he whose mind delights in the Supreme Brahman experiences true bliss.',
        meaning_hi: 'जिस घर में पुत्र हो, उसकी माँ हो, उसकी पत्नी हो — उस घर में भी अकेलापन है। यह संसार अद्भुत है — गोविंद का भजन करो।',
      },
      {
        number: 20,
        sanskrit: 'भगवद्गीता किञ्चिदधीता\nगङ्गाजललवकणिका पीता ।\nसकृदपि येन मुरारिसमर्चा\nतस्य यमेन न चर्चा ॥ २० ॥',
        transliteration: 'Bhagavadgītā kiñcidadhītā gaṅgājalalavakaṇikā pītā |\nSakṛdapi yēna murārisamarcā tasya yamēna na charchā || 20 ||',
        meaning: 'To one who has studied even a little of the Bhagavad Gita, drunk a single drop of the holy Ganges, and worshipped Lord Krishna (Murari) even once, there is no confrontation with Yama, the Lord of Death.',
        meaning_hi: 'सत्संग करो, विषयों से विरक्ति पाओ। आत्मा के ज्ञान में स्थिर हो। समभाव से जगत को देखो — मन आनंद में लीन होगा।',
      },
      {
        number: 21,
        sanskrit: 'पुनरपि जननं पुनरपि मरणं\nपुनरपि जननीजठरे शयनम् ।\nइह संसारे बहुदुस्तारे\nकृपयाऽपारे पाहि मुरारे ॥ २१ ॥',
        transliteration: 'Punarapi jananaṃ punarapi maraṇaṃ punarapi jananījaṭhare śayanam |\nIha saṃsāre bahudustāre kṛpayā\'pāre pāhi murāre || 21 ||',
        meaning: 'Birth again, death again, sleeping again in the mother\'s womb! This cycle of relative existence is extremely difficult to cross. Protect me, O Lord Krishna, through Your limitless compassion.',
        meaning_hi: 'काम, क्रोध, लोभ को छोड़ो। आत्म-विचार करो। मूर्ख! कब मन में परमात्मा का भाव जागेगा?',
      },
      {
        number: 22,
        sanskrit: 'रथ्याचर्पटविरचितकन्थः\nपुण्यापुण्यविवर्जितपन्थः ।\nयोगी योगनियोजितचित्तो\nरमत्युन्मत्तवदेव हि कोऽपि ॥ २२ ॥',
        transliteration: 'Rathyācharpaṭavirachitakanthaḥ puṇyāpuṇyavivarjitapanthaḥ |\nYōgī yōganiyōjitachittō ramatyunmattavadēva hi kō\'pi || 22 ||',
        meaning: 'Wearing a patchwork garment made of rags picked from the road, walking the path that transcends virtue and vice, the yogi whose mind is absorbed in yoga lives in pure bliss, like an ecstatic child.',
        meaning_hi: 'गंगा के जल में स्नान करने से, व्रत रखने से पापों का नाश होता है — परंतु चित्त की शुद्धि केवल गोविंद-भजन से होती है।',
      },
      {
        number: 23,
        sanskrit: 'कस्त्वं कोऽहं कुत आयातः\nका मे जननी को मे तातः ।\nइति परिभावय सर्वमसारं\nविश्वं त्यक्त्वा स्वप्नविचारम् ॥ २३ ॥',
        transliteration: 'Kastvaṃ kō\'haṃ kuta āyātaḥ kā mē jananī kō mē tātaḥ |\nIti paribhāvaya sarvamasāraṃ viśvaṃ tyaktvā svapnavichāram || 23 ||',
        meaning: '"Who are you? Who am I? Where did I come from? Who is my mother, who is my father?" Contemplating thus, realize that this entire world of names and forms is insubstantial, like a dream.',
        meaning_hi: 'जब तक धन है तब तक सब मित्र-बंधु हैं। जब धन चला जाता है, कोई नहीं पूछता — यह संसार का नियम है।',
      },
      {
        number: 24,
        sanskrit: 'त्वयि मयि चान्यत्रैको विष्णुः\nव्यर्थं कुप्यसि मय्यसहिष्णुः ।\nभव समचित्तः सर्वत्र त्वं\nवाञ्छस्यचिराद्यदि विष्णुत्वम् ॥ २४ ॥',
        transliteration: 'Tvayi mayi chānyatraikō viṣṇuḥ vyarthaṃ kupyasi mayyasahiṣṇuḥ |\nBhava samachittaḥ sarvatra tvaṃ vāñChasyachirādyadi viṣṇutvam || 24 ||',
        meaning: 'In you, in me, and everywhere else, there dwells only the one Lord Vishnu. Your anger toward me is in vain, born of impatience. Maintain equanimity under all circumstances if you wish to realize Vishnu.',
        meaning_hi: 'जब तक शरीर में प्राण हैं तब तक सब प्रेम करते हैं। प्राण निकलते ही वही शरीर को दूर ले जाते हैं।',
      },
      {
        number: 25,
        sanskrit: 'प्राणायामं प्रत्याहारं\nनित्यानित्यविवेकविचारम् ।\nजाप्यसमेतसमाधिविधानं\nकुर्ववधानं महदवधानम् ॥ २५ ॥',
        transliteration: 'Prāṇāyāmaṃ pratyāhāraṃ nityānityavivēkavichāram |\nJāpyasamētasamādhividhānaṃ kurvavadhānaṃ mahadadhānaṃ || 25 ||',
        meaning: 'Control of breath (pranayama), withdrawal of senses (pratyahara), discriminating between the permanent and the transient, along with japa and the state of absorption (samadhi)—practice these with utmost care.',
        meaning_hi: 'पुत्र से विरक्ति, पत्नी से विरक्ति — फिर भी संसार-चक्र चलता रहता है। जो सत्संगी है, वही इस चक्र से बाहर निकल सकता है।',
      },
      {
        number: 26,
        sanskrit: 'सुखतः क्रियते रामाभोगः\nपश्चाद्धन्त शरीरे रोगः ।\nयद्यपि लोके मरणं शरणं\nतदपि न मुञ्चति पापाचरणम् ॥ २६ ॥',
        transliteration: 'Sukhataḥ kriyatē rāmābhōgaḥ paśchāddhanta śarīrē rōgaḥ |\nYadyapi lōkē maraṇaṃ śaraṇaṃ tadapi na muucchati pāpācharaṇam || 26 ||',
        meaning: 'Sensory pleasures are indulged in with ease, but alas, they lead to disease in the body afterwards. Even though death is the ultimate destination of all, people do not abandon sinful conduct.',
        meaning_hi: 'एक ही परमात्मा सूर्य, चन्द्र, अग्नि, जल — सब में व्याप्त है। जो इस तत्त्व को जानता है वह जन्म-मृत्यु के बंधन से मुक्त होता है।',
      },
      {
        number: 27,
        sanskrit: 'अङ्गं गलितं पलितं मुण्डं\nदशनविहीनं जातं तुण्डम् ।\nवृद्धो याति गृहीत्वा दण्डं\nतदपि न मुञ्चत्याशापिण्डम् ॥ २७ ॥',
        transliteration: 'Aṅgaṃ galitaṃ palitaṃ muṇḍaṃ daśanavihīnaṃ jātaṃ tuṇḍam |\nVṛddhō yāti gṛhītvā daṇḍaṃ tadapi na muñchatyāśāpiṇḍam || 27 ||',
        meaning: 'The limbs have withered, the hair turned grey, the mouth has become toothless. The old man totters along holding a staff, yet the knot of desire does not leave him.',
        meaning_hi: 'वेद पढ़ो, पुराण पढ़ो — सब यही कहते हैं कि परमात्मा एक है, गोविंद का भजन करो।',
      },
      {
        number: 28,
        sanskrit: 'अग्रे वह्निः पृष्ठे भानुः\nरात्रौ चुबुकसमर्पितजानुः ।\nकरतलभिक्षस्तरुतलवासः\nतदपि न मुञ्चत्याशापाशः ॥ २८ ॥',
        transliteration: 'Agrē vahniḥ pṛṣṭhē bhānuḥ rātrau chubukasamarpitajānuḥ |\nKaratalabhikṣastarutalavāsaḥ tadapi na muñchatyāśāpāśaḥ || 28 ||',
        meaning: 'With fire in front and the sun behind him, huddled up at night with knees to chin, begging for food in his palms and living under trees—even then, the noose of desire holds him fast.',
        meaning_hi: 'अद्वैत तत्त्व को पहचानो — जो देख रहा है और जो देखा जा रहा है, दोनों एक ही ब्रह्म हैं।',
      },
      {
        number: 29,
        sanskrit: 'कुरुते गङ्गासागरगमनं\nव्रतपरिपालन मथवा दानम् ।\nज्ञानविहीनः सर्वमतेन\nमुक्तिं न भजति जन्मशतेन ॥ २९ ॥',
        transliteration: 'Kurutē gaṅgāsāgaragamanaṃ vrataparipālanamathavā dānam |\nJñānavihīnaḥ sarvamatēna muktiṃ na bhajati janmaśatēna || 29 ||',
        meaning: 'Traveling to Ganga Sagar, keeping vows, or giving charity—without self-knowledge, no scripture believes one can be liberated even in a hundred births.',
        meaning_hi: 'आत्मा न जन्म लेती है, न मरती है, न बढ़ती है, न घटती है। यह शरीर क्षणभंगुर है — आत्मा का भजन करो।',
      },
      {
        number: 30,
        sanskrit: 'सुरमन्दिरतरुमूलनिवासः\nशय्या भूतल मजिनं वासः ।\nसर्वपरिग्रह भोगत्यागः\nकस्य सुखं न करोति विरागः ॥ ३० ॥',
        transliteration: 'Suramandiratarumūlanivāsaḥ śayyā bhūtalamajinaṃ vāsaḥ |\nSarvaparigrahabhogatyāgaḥ kasya sukhaṃ na karoti virāgaḥ || 30 ||',
        meaning: 'Living under trees, sleeping on the floor, wearing simple skins, and giving up all acquisitions and comforts—whom does such dispassion not fill with supreme joy?',
        meaning_hi: 'जब तक श्वास चलती है तब तक जीवन है। जब श्वास रुकती है — कोई नहीं जानता क्या होगा। तो अभी गोविंद का भजन करो।',
      },
      {
        number: 31,
        sanskrit: 'गुरुचरणाम्बुजनिर्भरभक्तः\nसंसारादचिराद्भव मुक्तः ।\nसेन्द्रियमानसनियमादेवं\nद्रक्ष्यसि निजहृदयस्थं देवम् ॥ ३१ ॥',
        transliteration: 'Gurucaraṇāmbuja-nirbhara-bhaktaḥ saṃsārādachirādbhava muktaḥ |\nSendriyāmānasaniyamādevam drakṣyasi nijahṛdayasthaṃ devem || 31 ||',
        meaning: 'O devotee of the lotus feet of the Guru, may you soon be liberated from this relative world. By controlling your senses and mind, you shall behold the Divine residing within your own heart.',
        meaning_hi: 'गुरु का मिलना दुर्लभ है। मानव जन्म भी दुर्लभ है। इन दोनों का लाभ उठाकर परमात्मा को पाओ — यही जीवन का सार है।',
      }
    ]
  },
  // ── Aditya Hrudaya Stotram ─────────────────────────────────────────────────
  {
    id: 'aditya-hrudaya',
    title: 'Aditya Hrudaya Stotram',
    titleDevanagari: 'आदित्यहृदयम्',
    deity: 'surya',
    deityEmoji: '☀️',
    tradition: 'hindu',
    type: 'stotram',
    mood: 'energetic',
    language: 'Sanskrit',
    source: 'Ramayana — Yuddha Kanda',
    description: 'A powerful solar stotram imparted by Sage Agastya to Lord Rama on the battlefield, enabling the victory over Ravana.',
    verses: [
      {
        number: 1,
        sanskrit: 'ततो युद्धपरिश्रान्तं समरे चिन्तया स्थितम् ।\nरावणञ्चाग्रतो दृष्ट्वा युद्धाय समुपस्थितम् ॥ १ ॥',
        transliteration: 'Tato yuddhapariśrāntaṃ samare cintayā sthitam |\nRāvaṇañcāgrato dṛṣṭvā yuddhāya samupasthitam || 1 ||',
        meaning: 'Seeing Lord Rama exhausted from the battle and standing in deep thought on the battlefield, as Ravana stood before Him fully prepared for war.',
        meaning_hi: 'तब अगस्त्य मुनि आए और युद्ध देखकर — थके हुए राम को ध्यान में लीन देखकर — उन्होंने कहा: "हे राम, यह रहस्य सुनो।"',
      },
      {
        number: 2,
        sanskrit: 'दैवतैश्च समागम्य द्रष्टुमभ्यागतो रणम् ।\nउपागम्याब्रवीद्राममगस्त्यो भगवांस्तदा ॥ २ ॥',
        transliteration: 'Daivataiśca samāgamya draṣṭumabhyāgato raṇam |\nUpāgamyābravīdrāmamagastyo bhagavāṃstadā || 2 ||',
        meaning: 'Approaching Lord Rama, the venerable Sage Agastya, who had gathered with the gods to witness the battle, spoke to him.',
        meaning_hi: '"यह आदित्य-हृदय स्तोत्र सभी शत्रुओं का नाश करता है, सब विजय देता है — पवित्र और उत्तम मंगल-स्तोत्र है।"',
      },
      {
        number: 3,
        sanskrit: 'राम राम महाबाहो शृणु गुह्यं सनातनम् ।\nयेन सर्वानरीन् वत्स समरे विजयिष्यसि ॥ ३ ॥',
        transliteration: 'Rāma rāma mahābāho śṛṇu guhyaṃ sanātanam |\nYena sarvānarīn vatsa samare vijayiṣyasi || 3 ||',
        meaning: "'O Rama, O mighty-armed one, listen to this eternal, sacred secret by which, my child, you shall conquer all your enemies in battle.'",
        meaning_hi: '"इससे सभी पाप नष्ट होते हैं, सब चिंता मिटती है, आयु बढ़ती है — इसे सुनो और विजय पाओ।"',
      },
      {
        number: 4,
        sanskrit: 'आदित्यहृदयं पुण्यं सर्वशत्रुविनाशनम् ।\nजयावहं जपेन्नित्यमक्षयं परमं शिवम् ॥ ४ ॥',
        transliteration: 'Ādityahṛdayaṃ puṇyaṃ sarvaśatruvināśanam |\nJayāvahaṃ japennityamakṣayaṃ paramaṃ śivam || 4 ||',
        meaning: "'This holy hymn, the Aditya Hrudayam, destroys all enemies, bestows victory, and brings eternal auspiciousness and supreme bliss when recited daily.'",
        meaning_hi: '"यह सूर्य सभी देवताओं का समूह है — तेजस्वी, किरणों वाला, सात घोड़ों वाले रथ का स्वामी।"',
      },
      {
        number: 5,
        sanskrit: 'सर्वमङ्गलमाङ्गल्यं सर्वपापप्रणाशनम् ।\nचिन्ताशोकप्रशमनमायुर्वर्धनमुत्तमम् ॥ ५ ॥',
        transliteration: 'Sarvamaṅgalamāṅgalyaṃ sarvapāpapraṇāśanam |\nCintāśokapraśamanamāyurvardhanamuttamam || 5 ||',
        meaning: "'It is the source of all auspiciousness, the destroyer of all sins, the dispeller of worry and sorrow, and the ultimate enhancer of life span.'",
        meaning_hi: '"यह सूर्य ब्रह्मांड का ह्रदय है — विष्णु, शिव, स्कंद, प्रजापति, इंद्र, कुबेर, काल — सभी इसी में हैं।"',
      },
      {
        number: 6,
        sanskrit: 'रश्मिमन्तं समुद्यन्तं देवासुरनमस्कृतम् ।\nपूजयस्व विवस्वन्तं भास्करं भुवनेश्वरम् ॥ ६ ॥',
        transliteration: 'Raśmimantaṃ samudyantaṃ devāsuranamaskṛtam |\nPūjayasva vivasvantaṃ bhāskaraṃ bhuvaneśvaram || 6 ||',
        meaning: "'Worship the Sun God—who is crowned with effulgent rays, who rises at the horizon, who is greeted by both gods and demons, and who is the Lord of the universe.'",
        meaning_hi: '"यह अदिति-पुत्र, शक्तिशाली, तेज का भंडार, सोना-समान, विश्व का कर्ता और उसकी माता भी यही है।"',
      },
      {
        number: 7,
        sanskrit: 'सर्वदेवात्मको ह्येष तेजस्वी रश्मिभावनः ।\nएष देवासुरगणॉल्लोकान् पाति गभस्तिभिः ॥ ७ ॥',
        transliteration: 'Sarvadevātmakō hyēṣa tējasvī raśmibhāvanah |\nĒṣa dēvāsuragaṇāllōkān pāti gabhastibhih || 7 ||',
        meaning: "'He is indeed the embodiment of all deities, self-effulgent and the creator of rays. He protects the worlds of gods and demons alike with his beams.'",
        meaning_hi: '"यह ब्रह्मा, विष्णु, शिव, स्कंद, वेद, यज्ञ, भूत-भविष्य-वर्तमान का स्वामी, आकाश और पृथ्वी के बीच जो श्वास है — वही सूर्य है।"',
      },
      {
        number: 8,
        sanskrit: 'एष ब्रह्मा च विष्णुश्च शिवः स्कन्दः प्रजापतिः ।\nमहेन्द्रो धनदः कालो यमः सोमो ह्यपां पतिः ॥ ८ ॥',
        transliteration: 'Ēṣa brahmā ca viṣṇuśca śivaḥ skandaḥ prajāpatiḥ |\nMahēndrō dhanadaḥ kālō yamaḥ sōmō hyapāṃ patiḥ || 8 ||',
        meaning: "'He is Brahma, Vishnu, Shiva, Skanda, Prajapati, the mighty Indra, Kubera (giver of wealth), Kala (Time), Yama, Soma (Moon), and Varuna (Lord of the waters).'",
        meaning_hi: '"यही पितरों का तर्पण ग्रहण करता है, यही देवताओं का हव्य ग्रहण करता है। यही सबका पालक, जीवनदाता, विश्व का प्रणेता।"',
      },
      {
        number: 9,
        sanskrit: 'पितरो वसवः साध्या अश्विनौ मरुतो मनुः ।\nवायुर्वह्निः प्रजाप्राण ऋतुकर्ता प्रभाकरः ॥ ९ ॥',
        transliteration: 'Pitarō vasavaḥ sādhyā aśvinau marutō manuḥ |\nVāyurvahniḥ prajāprāṇa ṛtukartā prabhākaraḥ || 9 ||',
        meaning: "'He is the Pitris (ancestors), Vasus, Sadhyas, the twin Ashwini Kumaras, the wind-gods (Maruts), Manu, Vayu, Agni, the life-breath of all beings, the creator of seasons, and the source of light.'",
        meaning_hi: '"यही प्रकाश देता है, वर्षा करता है, गर्मी और ठंड उत्पन्न करता है। यही रात और दिन बनाता है — सृष्टि इसी से चलती है।"',
      },
      {
        number: 10,
        sanskrit: 'आदित्यः सविता सूर्यः खगः पूषा गभस्तिमान् ।\nसुवर्णसदृशो भानुर्हिरण्यरेता दिवाकरः ॥ १० ॥',
        transliteration: 'Ādityaḥ savitā sūryaḥ khagaḥ pūṣā gabhastimān |\nSuvarṇasadṛśō bhānurhiraṇyaretā divākaraḥ || 10 ||',
        meaning: "'He is Aditya (son of Aditi), सविता (the instigator of life), Surya, Khaga (he who traverses the sky), Pusha (nourisher), possessor of rays, golden-hued, the brilliant creator, and the maker of the day.'",
        meaning_hi: '"यह अनंत किरणों वाला, जल से उत्पन्न, सहस्र-किरणी है। यही नारायण, विकर्तन, मार्तण्ड — कभी नहीं थकने वाला।"',
      },
      {
        number: 11,
        sanskrit: 'हरिदश्वः सहस्रार्चिः सप्तसप्तिर्मरीचिमान् ।\nतिमिरोन्मथनः शम्भुस्त्वष्टा मार्तण्ड अंशुमान् ॥ ११ ॥',
        transliteration: 'Haridaśvaḥ sahasrārciḥ saptasaptirmarīcimān |\nTimirōnmathanaḥ śambhustvaṣṭā mārtaṇḍa aṃśumān || 11 ||',
        meaning: "'Salutations to him who has green horses, who possesses thousands of rays, who is pulled by seven horses, who dispels darkness, who is the source of joy, the cosmic architect, the son of Marta, and full of light.'",
        meaning_hi: '"यह पद्मप्रभव — कमल से उत्पन्न, विश्वकर्ता, सूर्य — तम का विनाशक, मृत्यु का भी मृत्यु, अमृत का भी स्वामी।"',
      },
      {
        number: 12,
        sanskrit: 'हिरण्यगर्भः शिशिरस्तपनो भास्करो रविः ।\nअग्निगर्भोऽदितेः पुत्रः शङ्खः शिशिरनाशनः ॥ १२ ॥',
        transliteration: 'Hiraṇyagarbhaḥ śiśirastapanō bhāskarō raviḥ |\nAgnigarbhō\'diteḥ putraḥ śaṅkhaḥ śiśiranāśanaḥ || 12 ||',
        meaning: "'He is Hiranyagarbha (golden womb), the cool breeze, the intense heat, the light-maker, the sun sung by all, contain-fire, son of Aditi, the shell-like sound of peace, and the destroyer of frost.'",
        meaning_hi: '"यह सोम, शुक्र, बुध, मंगल, गुरु, शनि को धारण करता है। यही रुद्र, अग्नि और ब्रह्मांड की आत्मा है।"',
      },
      {
        number: 13,
        sanskrit: 'व्योमनाथस्तमोभेदी ऋग्यजुःसामपारगः ।\nघनवृष्टिरपां मित्रो विन्ध्यवीथीप्लवङ्गमः ॥ १३ ॥',
        transliteration: 'Vyōmanāthastamōbhēdī ṛgyajuḥsāmapāragah |\nGhanavṛṣṭirapāṃ mitrō vindhyavīthīplavaṅgamah || 13 ||',
        meaning: "'He is the Lord of the heavens, the breaker of darkness, the master of Rig, Yajur, and Sama Vedas, the source of heavy rains, friend of the waters, and he who glides over the Vindhya mountain range.'",
        meaning_hi: '"हे राघव! यह आदित्य — जब उदय होते हैं तो सारी सृष्टि जागती है। जब अस्त होते हैं तो सब सो जाते हैं। इनका स्तवन करो।"',
      },
      {
        number: 14,
        sanskrit: 'आताप्री मण्डली मृत्युः पिङ्गलः सर्वतापनः ।\nकविर्विश्वो महातेजा रक्तः सर्वभवोद्भवः ॥ १४ ॥',
        transliteration: 'Ātapī maṇḍalī mṛtyuḥ piṅgalaḥ sarvatāpanah |\nKavirviśvō mahātējā raktaḥ sarvabhavōdbhavah || 14 ||',
        meaning: "'He is the source of heat, the circular orb, death to obstacles, the golden-yellow one, who warms all, the supreme poet, the cosmic soul, highly effulgent, the beloved, and the origin of all creation.'",
        meaning_hi: '"यह पितामह — सर्वदेवमय, जल का देवता। इनकी महिमा का वर्णन ब्रह्मा भी पूरा नहीं कर सकते।"',
      },
      {
        number: 15,
        sanskrit: 'नक्षत्रग्रहताराणामधिपो विश्वभावनः ।\nतेजसामपि तेजस्वी द्वादशात्मन् नमोऽस्तु ते ॥ १५ ॥',
        transliteration: 'Nakṣatragrahatārāṇāmadhipō viśvabhāvanah |\nTējasāmapi tējasvī dvādaśātman namō\'stu tē || 15 ||',
        meaning: "'Salutations to the Lord of constellations, planets and stars, the sustainer of the cosmos, the most brilliant among the brilliant, and the twelve-fold soul (Adityas).'",
        meaning_hi: '"तब राम ने तीन बार आचमन किया, शुद्ध होकर धनुष उठाया और सूर्य की ओर देखते हुए आदित्य-हृदय का पाठ किया।"',
      },
      {
        number: 16,
        sanskrit: 'नमः पूर्वाय गिरये पश्चिमायाद्रये नमः ।\nज्योतिर्गणानां पतये दिनाधिपतये नमः ॥ १६ ॥',
        transliteration: 'Namaḥ pūrvāya girayē paścimāyādrayē namaḥ |\nJyōtirgaṇānām patayē dinādhipatayē namaḥ || 16 ||',
        meaning: "'Salutations to the mountain in the east where you rise, and to the mountain in the west where you set. Salutations to the Lord of the celestial lights and the Lord of the day.'",
        meaning_hi: '"तीन बार पाठ करने के बाद राम का उत्साह बढ़ा। उन्होंने रावण को देखा और उससे युद्ध के लिए आगे बढ़े।"',
      },
      {
        number: 17,
        sanskrit: 'जयाय जयभद्राय हर्यश्वाय नमो नमः ।\nनमो नमः सहस्रांशो आदित्याय नमो नमः ॥ १७ ॥',
        transliteration: 'Jayāya jayabhadrāya haryaśvāya namō namaḥ |\nNamō namaḥ sahasrāṃśō ādityāya namō namaḥ || 17 ||',
        meaning: "'Salutations to the bestower of victory and the prosperity of triumph. Salutations to the one who rides green horses, who has thousands of rays, and is the son of Aditi.'",
        meaning_hi: '"तब अगस्त्य मुनि प्रसन्न होकर वापस चले गए। राम ने सूर्य का स्मरण करके धनुष उठाया।"',
      },
      {
        number: 18,
        sanskrit: 'नम उग्राय वीराय सारङ्गाय नमो नमः ।\nनमः पद्मप्रबोधाय मार्तण्डाय नमो नमः ॥ १८ ॥',
        transliteration: 'Nama ugrāya vīrāya sāraṅgāya namō namaḥ |\nNamaḥ padmaprabōdhāya mārtaṇḍāya namō namaḥ || 18 ||',
        meaning: "'Salutations to the fierce and heroic Lord, who travels swiftly. Salutations to the one who awakens the lotus flower, and who is the son of Marta.'",
        meaning_hi: '"रावण ने राम को आते देखा, क्रोध से भर गया और आगे बढ़ा। राम ने शरों की वर्षा आरंभ की।"',
      },
      {
        number: 19,
        sanskrit: 'ब्रह्मेशानाच्युतेशाय सूर्यायादित्यवर्चसे ।\nभास्वते सर्वभक्षाय रौद्राय वपुषे नमः ॥ १९ ॥',
        transliteration: 'Brahmēśānācyutēśāya sūryāyādityavarcasē |\nBhāsvatē sarvabhakṣāya raudrāya vapuṣē namaḥ || 19 ||',
        meaning: "'Salutations to the Lord of Brahma, Shiva, and Vishnu, who shines with the splendor of Aditya. Salutations to the shining one who consumes all and has a fierce aspect like Rudra.'",
        meaning_hi: '"जो प्रतिदिन प्रातः उठकर इस आदित्य-हृदय का पाठ करता है, उसके सभी पाप नष्ट होते हैं और वह दीर्घायु होता है।"',
      },
      {
        number: 20,
        sanskrit: 'तमोघ्नाय हिमघ्नाय शत्रुघ्नायामितात्मने ।\nकृतघ्नघ्नाय देवाय ज्योतिषाम्पतये नमः ॥ २० ॥',
        transliteration: 'Tamōghnāya himaghnāya śatrughnāyāmitātmanē |\nKṛtaghnaghnāya dēvāya jyōtiṣāmpatayē namaḥ || 20 ||',
        meaning: "'Salutations to the destroyer of darkness, cold and enemies, whose form is immeasurable. Salutations to the punisher of the ungrateful, the divine Lord of all lights.'",
        meaning_hi: '"यह पाठ शत्रुओं पर विजय दिलाता है, संकट में रक्षा करता है। रण में, कठिन परिस्थिति में यह परम सहायक है।"',
      },
      {
        number: 21,
        sanskrit: 'तप्तचामीकराभाय वह्नये विश्वकर्मणे ।\nनमस्तमोऽभिनिघ्नाय रुचये लोकसाक्षिणे ॥ २१ ॥',
        transliteration: 'Taptacāmīkarābhāya vahnayē viśvakarmaṇē |\nNamastamō\'bhinighnāya rucayē lōkasākṣiṇē || 21 ||',
        meaning: "'Salutations to him who has the glow of molten gold, who is in the form of fire, and is the architect of the universe. Salutations to the dispeller of darkness, the radiant witness of the world.'",
        meaning_hi: '"यह स्तोत्र त्रिकाल (प्रातः-मध्याह्न-सायं) जो पढ़ता है — पाप, चिंता, और शत्रु — सभी नष्ट होते हैं।"',
      },
      {
        number: 22,
        sanskrit: 'नाशयत्येष वै भूतं तदेव सृजति प्रभुः ।\nपायत्येष तपत्येष वर्षत्येष गभस्तिभिः ॥ २२ ॥',
        transliteration: 'Nāśayatyeṣa vai bhūtaṃ tadēva sṛjati prabhuḥ |\nPāyatyeṣa tapatyeṣa varṣatyeṣa gabhastibhiḥ || 22 ||',
        meaning: "'The Lord indeed destroys all beings at the time of dissolution, and creates them anew. He protects, heats, and causes rain through his powerful rays.'",
        meaning_hi: '"भगवान सूर्य सभी देवताओं में श्रेष्ठ हैं। इनकी उपासना से सभी इच्छाएँ पूर्ण होती हैं।"',
      },
      {
        number: 23,
        sanskrit: 'एष सुप्तेषु जागर्ति भूतेषु परिनिष्ठितः ।\nएष एवाग्निहोत्रञ्च फलं चैवाग्निहोत्रिणाम् ॥ २३ ॥',
        transliteration: 'Eṣa suptēṣu jāgarti bhūtēṣu pariniṣṭhitaḥ |\nEṣa ēvāgnihōtrañca phalaṃ caivāgnihōtriṇām || 23 ||',
        meaning: "'He remains awake within all living beings even when they sleep. He is the sacrificial fire (Agnihotra) as well as the reward obtained by those who perform the sacrifice.'",
        meaning_hi: '"सूर्य ही एकमात्र दृश्यमान देवता हैं जो प्रत्यक्ष रूप से जगत को प्रकाश और जीवन देते हैं।"',
      },
      {
        number: 24,
        sanskrit: 'वेदाश्च क्रतवश्चैव क्रतूनां फलमेव च ।\nयानी कृत्यानी लोकेषु सर्व एष रविः प्रभुः ॥ २४ ॥',
        transliteration: 'Vēdāśca kratavaścaiva kratūnāṃ phalameva ca |\nYānī kṛtyānī lōkēṣu sarva ēṣa raviḥ prabhuḥ || 24 ||',
        meaning: "'He is the essence of the Vedas, the sacrifices, and their fruits. All actions and duties in the universe are ultimately guided and sustained by the Sun God.'",
        meaning_hi: '"इस स्तोत्र को अगस्त्य मुनि ने ब्रह्मा से प्राप्त किया और राम को दिया। यह परंपरागत दिव्य ज्ञान है।"',
      },
      {
        number: 25,
        sanskrit: 'एनमापतसु कृच्छ्रेषु कान्तारेषु भयेषु च ।\nकीर्तयन् पुरुषः कश्चिन्नावासीदति राघव ॥ २५ ॥',
        transliteration: 'Enamāpatsu kṛcchrēṣu kāntārēṣu bhayēṣu ca |\nKīrtayan puruṣaḥ kaścinnāvāsīdati rāghava || 25 ||',
        meaning: "'O Raghava, a person who chants the glory of the Sun God in times of danger, distress, in lonely forests, or when filled with fear, will never perish or lose heart.'",
        meaning_hi: '"सूर्योदय के समय और सूर्यास्त के समय यदि इसका पाठ किया जाए तो समस्त पापों का नाश होता है।"',
      },
      {
        number: 26,
        sanskrit: 'पूजयस्वैनमेकाग्रो देवदेवं जगत्पतिम् ।\nएतत् त्रिगुणितं जप्त्वा युद्धेषु विजयिष्यसि ॥ २६ ॥',
        transliteration: 'Pūjayasvainamēkāgrō dēvadēvaṃ jagatpatim |\nEtat triguṇitaṃ japtvā yuddhēṣu vijayiṣyasi || 26 ||',
        meaning: "'Worship this Lord of all gods and the ruler of the universe with undivided focus. Chanting this hymn three times, you shall emerge victorious in battle.'",
        meaning_hi: '"भूख लगे, प्यास लगे, राह में फँसे हों — जो सूर्य का ध्यान करता है उसे कष्ट नहीं भोगना पड़ता।"',
      },
      {
        number: 27,
        sanskrit: 'एतच्छ्रुत्वा महातेजा नष्टशोकोऽभवत्तदा ।\nधारयामास सुप्रीतो राघवः प्रयतात्मवान् ॥ २७ ॥',
        transliteration: 'Etacchrutvā mahātējā naṣṭaśōkō\'bhavattadā |\nDhārayāmāsa suprītō rāghavaḥ prayatātmavān || 27 ||',
        meaning: "'Hearing this, the highly radiant Rama became free from all grief and sorrow. Deeply pleased, he held the arrow with supreme concentration.'",
        meaning_hi: '"युद्ध में, जल में, वन में, या भयंकर विपत्ति में — जो सूर्य का स्मरण करता है वह सुरक्षित रहता है।"',
      },
      {
        number: 28,
        sanskrit: 'आदित्यं प्रेक्ष्य जप्त्वा तु परं हर्षमवाप्तवान् ।\nत्रिराचम्य शुचिर्भूत्वा धनुरादाय वीर्यवान् ॥ २८ ॥',
        transliteration: 'Ādityaṃ prēkṣya japtvā tu paraṃ harṣamavāptavān |\nTrirācamya śucirbhūtvā dhanurādāya vīryavān || 28 ||',
        meaning: "'Beholding the Sun, Rama chanted the stotram and experienced great bliss. Sipping water three times to purify himself, the heroic warrior took up his mighty bow.'",
        meaning_hi: '"जो सूर्य की इस महिमा को सुनता और सुनाता है, वह सुखी रहता है, स्वस्थ रहता है और समृद्धि पाता है।"',
      },
      {
        number: 29,
        sanskrit: 'रावणं प्रेक्ष्य हृष्टात्मा युद्धाय समुपगमत् ।\nसर्वयत्नेन महता वधे तस्य धृतोऽभवत् ॥ २९ ॥',
        transliteration: 'Rāvaṇaṃ prēkṣya hṛṣṭātmā yuddhāya samupagamat |\nSarvayatnēna mahatā vadhē tasya dhṛtō\'bhavat || 29 ||',
        meaning: "'Seeing Ravana approaching, Rama advanced with a joyous spirit. He gathered all his strength, fully resolved to destroy the demon king.'",
        meaning_hi: '"हे राघव! तुम रावण को अवश्य जीतोगे। आज ही उसका वध होगा — अगस्त्य ने यह आशीर्वाद देकर प्रस्थान किया।"',
      },
      {
        number: 30,
        sanskrit: 'अथ रविरवदन्निरीक्ष्य रामं मुदितमनाः परमं प्रहृष्यमाणः ।\nनिशिचरपतिसंक्षयं विदितत्वा सुरगणमध्यगतो वचस्त्वरेति ॥ ३० ॥',
        transliteration: 'Atha raviravadannirēkṣya rāmaṃ muditamanāḥ paramaṃ prahṛṣyamāṇaḥ |\nNiśicarapatisaṅkṣayaṃ viditvā suragaṇamadhyagatō vacastvarēti || 30 ||',
        meaning: "'Then, gazing upon Rama with a highly pleased and ecstatic mind, knowing that the end of Ravana was near, the Sun God, standing amidst the assembly of gods, exclaimed: \"Hurry!\"'",
        meaning_hi: '"यह सुनकर राम का उत्साह और बढ़ गया। उन्होंने प्रसन्न चित्त से सूर्य को प्रणाम किया और युद्ध के लिए कमर कसी।"',
      }
    ]
  },
  // ── Surya Ashtakam ─────────────────────────────────────────────────────────
  {
    id: 'surya-ashtakam',
    title: 'Surya Ashtakam',
    titleDevanagari: 'सूर्याष्टकम्',
    deity: 'surya',
    deityEmoji: '🌅',
    tradition: 'hindu',
    type: 'stotram',
    mood: 'gratitude',
    language: 'Sanskrit',
    source: 'Samba Purana',
    description: 'Eight verses praising the sun god Surya as the supreme source of life, health, and cosmic energy, traditionally chanted at dawn.',
    verses: [
      {
        number: 1,
        sanskrit: 'आदिदेव नमस्तुभ्यं प्रसीद मम भास्कर ।\nदिवाकर नमस्तुभ्यं प्रभाकर नमोऽस्तु ते ॥',
        transliteration: 'Ādideva namastubhyaṃ prasīda mama bhāskara\ndivākara namastubhyaṃ prabhākara namo\'stu te',
        meaning: 'Salutations to the primordial Lord, shine your grace upon me, O Bhaskara! Salutations to the creator of the day, salutations to the source of light.',
        startSecs: 0,
        meaning_hi: 'हे आदिदेव सूर्य, आपको मेरा प्रणाम है; मुझ पर कृपा कीजिए। आप ही दिन के निर्माता और प्रकाश के स्रोत हैं, इसलिए आपका स्मरण जीवन, स्वास्थ्य और जागृति का आह्वान है।'
      }
    ]
  },
  // ── Japji Sahib (Mool Mantar) ──────────────────────────────────────────────
  {
    id: 'japji-mool-mantar',
    title: 'Japji Sahib (Mool Mantar)',
    titleDevanagari: 'ਜਪੁਜੀ ਸਾਹਿਬ (ਮੂਲ ਮੰਤਰ)',
    deity: 'universal',
    deityEmoji: 'ੴ',
    tradition: 'sikh',
    type: 'simran',
    mood: 'meditative',
    language: 'Gurmukhi',
    source: 'Guru Granth Sahib Ji — Page 1',
    description: 'The root mantra of the Sikh tradition, defining the absolute, formless Divine and serving as the portal to high spiritual realization.',
    verses: [
      {
        number: 1,
        sanskrit: 'ੴ ਸਤਿ ਨਾਮੁ ਕਰਤਾ ਪੁਰਖੁ ਨਿਰਭਉ ਨਿਰਵੈਰੁ\nਅਕਾਲ ਮੂਰਤਿ ਅਜੂਨੀ ਸੈਭੰ ਗੁਰ ਪ੍ਰਸਾਦਿ ॥',
        transliteration: 'Ik oṅkār sat nām karatā purakh nirabhau niravair\nakāl mūrat ajūnī saibhaṅ gur prasād',
        meaning: 'There is only one Divine Source. Truth is Its name. Creator of all things. Fearless. Without enmity. Timeless, undying image. Beyond birth and death. Self-existent. Known by the grace of the Guru.',
        startSecs: 0,
        meaning_hi: 'एक ही परम सत्य है, वही सृष्टि का रचयिता है। वह निर्भय है, किसी से वैर नहीं रखता, काल से परे है, जन्म-मरण से रहित है और स्वयंप्रकाश है। गुरु की कृपा से ही उसका सच्चा अनुभव होता है।',
        meaning_pa: 'ਇੱਕੋ ਹੀ ਪਰਮ ਸੱਚ ਹੈ, ਜਿਸ ਦਾ ਨਾਮ ਸਤਿ ਹੈ ਅਤੇ ਜੋ ਸਾਰੀ ਸ੍ਰਿਸ਼ਟੀ ਦਾ ਕਰਤਾ ਪੁਰਖ ਹੈ। ਉਹ ਨਿਰਭਉ ਹੈ, ਕਿਸੇ ਨਾਲ ਵੈਰ ਨਹੀਂ ਰੱਖਦਾ, ਕਾਲ ਤੋਂ ਪਰੇ ਹੈ ਅਤੇ ਜਨਮ ਮਰਨ ਤੋਂ ਰਹਿਤ ਹੈ। ਗੁਰੂ ਦੀ ਕਿਰਪਾ ਨਾਲ ਹੀ ਉਸ ਦਾ ਸੱਚਾ ਬੋਧ ਪ੍ਰਾਪਤ ਹੁੰਦਾ ਹੈ।'
      }
    ]
  },
  // ── Tav-Prasad Savaiye ─────────────────────────────────────────────────────
  {
    id: 'tav-prasad-savaiye',
    title: 'Tav-Prasad Savaiye',
    titleDevanagari: 'ਤ੍ਵਪ੍ਰਸਾਦਿ ਸਵੱਯੇ',
    deity: 'universal',
    deityEmoji: '⚔️',
    tradition: 'sikh',
    type: 'simran',
    mood: 'devotional',
    language: 'Gurmukhi',
    source: 'Composed by Guru Gobind Singh Ji — Dasam Granth',
    description: 'A ten-stanza hymn focusing on the supreme necessity of pure love and devotion above all outward rituals and spiritual pride.',
    verses: [
      {
        number: 1,
        sanskrit: 'ਸ੍ਰਾਵਗ ਸੁਧ ਸਮੂਹ ਸਿਧਾਨ ਕੇ ਦੇਖਿ ਫਿਰਿਓ ਘਰ ਜੋਗ ਜਤੀ ਕੇ ।\nਸੂਰ ਸੁਰਾਦਨ ਸੁਧ ਸੁਧਾਦਿਕ ਸੰਤ ਸਮੂਹ ਅਨੇਕ ਮਤੀ ਕੇ ॥',
        transliteration: 'Srāvag sudh samūh sidhān ke dekh phirio ghar jog jatī ke\nsūr surādan sudh sudhādik sant samūh anek matī ke',
        meaning: 'I have visited many holy seekers, siddhas, yogis and ascetics. I have met great warriors, saints, and leaders of different philosophies.',
        startSecs: 0,
        meaning_hi: 'मैंने अनेक साधक, सिद्ध, योगी, जती, वीर और भिन्न-भिन्न मतों के संत देखे हैं। बाहरी रूप, परंपरा और उपलब्धियाँ बहुत हैं, परंतु सच्चा आध्यात्मिक सार प्रेम और निष्कपट भक्ति में ही प्रकट होता है।',
        meaning_pa: 'ਮੈਂ ਅਨੇਕ ਤਰ੍ਹਾਂ ਦੇ ਸਾਧਕ, ਸਿੱਧ, ਜੋਗੀ, ਜਤੀ, ਸੂਰਮੇ ਅਤੇ ਵੱਖ-ਵੱਖ ਮਤਾਂ ਵਾਲੇ ਸੰਤ ਵੇਖੇ ਹਨ। ਪਰ ਬਾਹਰੀ ਚੋਲਿਆਂ, ਰਸਮਾਂ ਜਾਂ ਵਾਦਾਂ ਨਾਲ ਪਰਮਾਤਮਾ ਨਹੀਂ ਮਿਲਦਾ। ਸੱਚਾ ਮਿਲਾਪ ਤਾਂ ਖ਼ਾਲਿਸ ਪ੍ਰੇਮ, ਭਗਤੀ ਅਤੇ ਅੰਦਰਲੀ ਸੱਚਾਈ ਨਾਲ ਹੀ ਹੁੰਦਾ ਹੈ।'
      }
    ]
  },
  // ── Chaupai Sahib ──────────────────────────────────────────────────────────
  {
    id: 'chaupai-sahib',
    title: 'Chaupai Sahib',
    titleDevanagari: 'ਚੌਪਈ ਸਾਹਿਬ',
    deity: 'universal',
    deityEmoji: '☬',
    tradition: 'sikh',
    type: 'simran',
    mood: 'protective',
    language: 'Gurmukhi',
    source: 'Composed by Guru Gobind Singh Ji — Dasam Granth',
    description: 'A prayer of ultimate surrender and protection, requesting the Divine Hand to guard the seeker against all inner and outer obstacles.',
    verses: [
      {
        number: 1,
        sanskrit: 'ਕਬਯੋਬਾਚ ਬੇਨਤੀ ॥ ਚੌਪਈ ॥\nਹਮਰੀ ਕਰੋ ਹਾਥ ਦੇ ਰੱਛਾ । ਪੂਰਨ ਹੋਇ ਚਿੱਤ ਕੀ ਇੱਛਾ ॥',
        transliteration: 'Kabiyobāc benatī || caupaī ||\nhamarī karo hāth de racchā | pūran hoe citt kī icchā',
        meaning: 'Hear my prayer, O Lord: protect me with Your hand. May all the desires of my heart be fulfilled, and my mind remain devoted to Your feet.',
        startSecs: 0,
        meaning_hi: 'हे प्रभु, मेरी विनती सुनिए और अपने हाथ से मेरी रक्षा कीजिए। मेरे हृदय की शुभ इच्छाएँ पूर्ण हों और मेरा मन आपकी शरण में स्थिर बना रहे।',
        meaning_pa: 'ਹੇ ਪ੍ਰਭੂ, ਮੇਰੀ ਬੇਨਤੀ ਸੁਣੋ ਅਤੇ ਆਪਣੇ ਹੱਥ ਨਾਲ ਮੇਰੀ ਰੱਖਿਆ ਕਰੋ। ਮੇਰੇ ਚਿੱਤ ਦੀਆਂ ਉਹੀ ਇੱਛਾਵਾਂ ਪੂਰੀਆਂ ਹੋਣ ਜੋ ਤੇਰੀ ਰਜ਼ਾ ਨਾਲ ਇਕਰੂਪ ਹਨ। ਮੇਰਾ ਮਨ ਸਦਾ ਤੇਰੀ ਸ਼ਰਣ ਵਿੱਚ ਟਿਕਿਆ ਰਹੇ।'
      }
    ]
  },
  // ── Anand Sahib ────────────────────────────────────────────────────────────
  {
    id: 'anand-sahib',
    title: 'Anand Sahib',
    titleDevanagari: 'ਅਨੰਦੁ ਸਾਹਿਬ',
    deity: 'universal',
    deityEmoji: '🍯',
    tradition: 'sikh',
    type: 'simran',
    mood: 'celebratory',
    language: 'Gurmukhi',
    source: 'Composed by Guru Amar Das Ji — Guru Granth Sahib Ji',
    description: 'The song of spiritual bliss (Anand), celebrating the absolute joy of finding the Guru and awakening the mind to eternal presence.',
    verses: [
      {
        number: 1,
        sanskrit: 'ਰਾਮਕਲੀ ਮਹਲਾ ੩ ਅਨੰਦੁ ॥\nਅਨੰਦੁ ਭਇਆ ਮੇਰੀ ਮਾਏ ਸਤਿਗੁਰੂ ਮੈ ਪਾਇਆ ॥',
        transliteration: 'Rāmakalī mahalā 3 anandu ||\nanandu bhaeā merī māe satigurū mae pāeā',
        meaning: 'I am in ecstasy, O my mother, for I have found the True Guru.',
        startSecs: 0,
        meaning_hi: 'हे माता, मेरे भीतर महान आनंद उमड़ आया है क्योंकि मुझे सच्चे गुरु का मिलन हुआ है। गुरु की प्राप्ति से जीवन का अंधकार दूर होता है और आत्मा को उसका सच्चा आसरा मिल जाता है।',
        meaning_pa: 'ਹੇ ਮਾਂ, ਮੇਰੇ ਅੰਦਰ ਅਸਲ ਆਨੰਦ ਇਸ ਲਈ ਉਠਿਆ ਹੈ ਕਿ ਮੈਨੂੰ ਸਤਿਗੁਰੂ ਮਿਲ ਪਿਆ ਹੈ। ਸਤਿਗੁਰੂ ਮਿਲਣ ਨਾਲ ਜੀਵਨ ਦਾ ਹਨੇਰਾ ਦੂਰ ਹੋ ਜਾਂਦਾ ਹੈ ਅਤੇ ਆਤਮਾ ਨੂੰ ਆਪਣਾ ਸੱਚਾ ਆਸਰਾ ਲੱਭ ਜਾਂਦਾ ਹੈ। ਇਹ ਆਨੰਦ ਅੰਦਰਲੀ ਜਾਗਰਤੀ ਦਾ ਪ੍ਰਸਾਦ ਹੈ।'
      }
    ]
  },
  // ── Heart Sutra (Gate Gate) ────────────────────────────────────────────────
  {
    id: 'heart-sutra',
    title: 'Heart Sutra (Gate Gate)',
    titleDevanagari: 'प्रज्ञापारमिताहृदयसूत्रम्',
    deity: 'universal',
    deityEmoji: '☸️',
    tradition: 'buddhist',
    type: 'mantra',
    mood: 'meditative',
    language: 'Sanskrit',
    source: 'Prajnaparamita Hridaya Sutra',
    description: 'The core Buddhist sutra on emptiness (Shunyata), concluding with the supreme mantra of awakening.',
    verses: [
      {
        number: 1,
        sanskrit: 'गते गते पारगते पारसंगते बोधि स्वाहा ॥',
        transliteration: 'Gate gate pāragate pārasaṃgate bodhi svāhā',
        meaning: 'Gone, gone, gone beyond, gone altogether beyond, O awakening, hail!',
        startSecs: 0,
        meaning_hi: 'यह मंत्र साधक को सीमित अहंकार और भ्रम से आगे बढ़ने का आह्वान करता है। यह कहता है: आगे बढ़ो, पार जाओ, पूर्णतः पार हो जाओ — और जागृति को प्राप्त करो।'
      }
    ]
  },
  // ── Green Tara Mantra ──────────────────────────────────────────────────────
  {
    id: 'green-tara-mantra',
    title: 'Green Tara Mantra',
    titleDevanagari: 'हरित तारा मंत्र',
    deity: 'universal',
    deityEmoji: '🟢',
    tradition: 'buddhist',
    type: 'mantra',
    mood: 'protective',
    language: 'Sanskrit',
    source: 'Buddhist Dharani tradition',
    description: 'The loving mantra of Green Tara, the mother of liberation, chanted for protection, swift assistance, and overcoming fear.',
    verses: [
      {
        number: 1,
        sanskrit: 'ॐ तारे तुत्तारे तुरे स्वाहा ॥',
        transliteration: 'Oṃ tāre tuttāre ture svāhā',
        meaning: 'Om! O Tara, I bow to you who liberates from all fears, obstacles, and suffering. May wisdom and compassion quickly awaken.',
        startSecs: 0,
        meaning_hi: 'यह माँ तारा का आवाहन है, जो भय, बाधा और दुख से पार ले जाने वाली करुणामयी शक्ति मानी जाती हैं। इस मंत्र का जप शीघ्र सहायता, आंतरिक साहस और जागृत प्रज्ञा की प्रार्थना है।'
      }
    ]
  },
  // ── Medicine Buddha Mantra ─────────────────────────────────────────────────
  {
    id: 'medicine-buddha-mantra',
    title: 'Medicine Buddha Mantra',
    titleDevanagari: 'भैषज्यगुरु मंत्र',
    deity: 'universal',
    deityEmoji: '🥣',
    tradition: 'buddhist',
    type: 'mantra',
    mood: 'protective',
    language: 'Sanskrit',
    source: 'Bhaisajyaguru Sutra',
    description: 'The supreme healing mantra of the Medicine Buddha, chanted to eliminate physical illnesses, mental obstacles, and negative karma.',
    verses: [
      {
        number: 1,
        sanskrit: 'तद्यथा ॐ भैषज्ये भैषज्ये महाभैषज्ये भैषज्यराजसमुद्गते स्वाहा ॥',
        transliteration: 'Tadyathā oṃ bhaiṣajye bhaiṣajye mahābhaiṣajye bhaiṣajyarājasamudgate svāhā',
        meaning: 'Om! May the healing, healing, supreme healing, rising from the King of Healing, cure all physical and mental suffering.',
        startSecs: 0,
        meaning_hi: 'यह औषधि बुद्ध का महान आरोग्य मंत्र है, जो शारीरिक और मानसिक पीड़ा के शमन की प्रार्थना करता है। इसमें परम उपचारक करुणा को पुकारा जाता है ताकि रोग, क्लेश और नकारात्मक कर्म शुद्ध हों।'
      }
    ]
  },
  // ── Amitabha Mantra ────────────────────────────────────────────────────────
  {
    id: 'amitabha-mantra',
    title: 'Amitabha Mantra',
    titleDevanagari: 'अमिताभ बुद्ध मंत्र',
    deity: 'universal',
    deityEmoji: '🌅',
    tradition: 'buddhist',
    type: 'mantra',
    mood: 'devotional',
    language: 'Sanskrit',
    source: 'Pure Land Tradition',
    description: 'The sacred chant invoking the Buddha of Infinite Light, purifying the mind and establishing peace.',
    verses: [
      {
        number: 1,
        sanskrit: 'ॐ अमिदे वा ह्रीः ॥',
        transliteration: 'Oṃ amide vā hrīḥ',
        meaning: 'Om! Salutations to Amitabha, the Buddha of Infinite Light. May all beings be liberated and attain supreme peace.',
        startSecs: 0,
        meaning_hi: 'यह अमिताभ बुद्ध, अनंत प्रकाश के स्वामी, को प्रणाम करने वाला मंत्र है। इसका जप मन को शांति, करुणा और निर्मल प्रकाश की ओर ले जाकर सभी प्राणियों के कल्याण की भावना जगाता है।'
      }
    ]
  },
  // ── Mangala Sutta ──────────────────────────────────────────────────────────
  {
    id: 'mangala-sutta',
    title: 'Mangala Sutta',
    titleDevanagari: 'मङ्गल सुत्त',
    deity: 'universal',
    deityEmoji: '☸️',
    tradition: 'buddhist',
    type: 'mantra',
    mood: 'gratitude',
    language: 'Pali',
    source: 'Sutta Nipata 2.4',
    description: 'A beautiful Pali scripture outlining the thirty-eight highest blessings of life, promoting wholesome action.',
    verses: [
      {
        number: 1,
        sanskrit: 'बहू देवा मनुस्सा च मङ्गलानि अचिन्तयुं ।\nआकङ्खमाना सोत्थानं ब्रूहि मङ्गलमुत्तमम् ॥',
        transliteration: 'Bahū devā manussā ca maṅgalāni acintayuṃ\nākaṅkhamānā sotthānaṃ brūhi maṅgalamuttamam',
        meaning: 'Many gods and humans have pondered on what is auspicious, yearning for safety. Tell us, O Buddha, what is the highest blessing.',
        startSecs: 0,
        meaning_hi: 'देवता और मनुष्य सभी यह जानना चाहते हैं कि जीवन का सच्चा मंगल क्या है। यह प्रश्न केवल बाहरी शुभ संकेतों का नहीं, बल्कि ऐसे जीवन-पथ का है जो सुरक्षा, शांति और परम कल्याण की ओर ले जाए।'
      }
    ]
  },
  // ── Kalyanmandir Stotra ────────────────────────────────────────────────────
  {
    id: 'kalyanmandir-stotra',
    title: 'Kalyanmandir Stotra',
    titleDevanagari: 'कल्याणमन्दिर स्तोत्र',
    deity: 'universal',
    deityEmoji: '🪷',
    tradition: 'jain',
    type: 'stotram',
    mood: 'devotional',
    language: 'Sanskrit',
    source: 'Composed by Acharya Kumudachandra',
    description: 'A highly sacred Jain stotra of devotion, seeking inner purity, protection, and complete spiritual release.',
    verses: [
      {
        number: 1,
        sanskrit: 'कल्याणमन्दिरमुदारमुदारकीर्तेः\nसंसारसागरतारणमप्रमेयम् ।\nसौम्यं प्रणम्य जिनपादयुगं युगादौ\nभक्तिप्रकर्षरचितैः स्तवनैर्जनेन्द्रम् ॥',
        transliteration: 'Kalyāṇamandiramudāramudārakīrteḥ\nsaṃsārasāgaratāraṇamaprameyam\nsaumyaṃ praṇamya jinapādayugaṃ yugādau\nbhaktiprakarṣaracitaiḥ stavanairjanendram',
        meaning: 'Deeply bowing to the gentle lotus feet of the Jina Adinatha, the temple of auspiciousness and the vessel to cross the ocean of transmigration, I sing these praises with deep devotion.',
        startSecs: 0,
        meaning_hi: 'मैं जिनेंद्र आदिनाथ के उन कोमल और मंगलमय चरणों को प्रणाम करता हूँ जो संसार-सागर से पार उतारने वाले आश्रय हैं। गहन भक्ति से रचा गया यह स्तवन आत्मा को शुद्धि, शरण और कल्याण की दिशा देता है।'
      }
    ]
  },
  // ── Uvasaggaharam Stotra ───────────────────────────────────────────────────
  {
    id: 'uvasaggaharam-stotra',
    title: 'Uvasaggaharam Stotra',
    titleDevanagari: 'उवसग्गहरं स्तोत्र',
    deity: 'universal',
    deityEmoji: '🪷',
    tradition: 'jain',
    type: 'stotram',
    mood: 'protective',
    language: 'Prakrit',
    source: 'Composed by Acharya Bhadrabahu',
    description: 'Chanted to Lord Parshvanatha to ward off planetary obstacles, evil influences, and negative karma, filling the mind with peace.',
    verses: [
      {
        number: 1,
        sanskrit: 'उवसग्गहरं पासं पणमामि जिणेसरं नमंसामि ।\nजास सविहपओगा सव्व दुक्खाई विप्पणस्सन्ति ॥',
        transliteration: 'Uvasaggaharaṃ pāsaṃ paṇamāmi jiṇesaraṃ namaṃsāmi\njāsa savihapaogā savva dukkhāī vippaṇassanti',
        meaning: 'I bow to Lord Parshvanatha, the Jina, who destroys all obstacles and planetary afflictions, by whose remembrance all sufferings are dissolved.',
        startSecs: 0,
        meaning_hi: 'मैं भगवान पार्श्वनाथ को प्रणाम करता हूँ, जिनका स्मरण विघ्नों, अशुभ प्रभावों और मानसिक क्लेशों को दूर करने वाला माना जाता है। उनकी शरण में जाकर साधक को शांति, विश्वास और भीतरी संरक्षण का अनुभव होता है।'
      }
    ]
  },
  // ── Shanti Mantra (Om Asato Ma Sadgamaya) ──────────────────────────────────
  {
    id: 'om-asato-ma',
    title: 'Shanti Mantra (Om Asato Ma)',
    titleDevanagari: 'शान्ति मन्त्र (ॐ असतो मा)',
    deity: 'universal',
    deityEmoji: '🕊️',
    tradition: 'hindu',
    type: 'mantra',
    mood: 'meditative',
    language: 'Sanskrit',
    source: 'Brihadaranyaka Upanishad 1.3.28',
    description: 'An ancient Upanishadic prayer for illumination, guidance, and peace, wishing to move from darkness to eternal light.',
    verses: [
      {
        number: 1,
        sanskrit: 'ॐ असतो मा सद्गमय ।\nतमसो मा ज्योतिर्गमय ।\nमृत्योर्मा अमृतं गमय ।\nॐ शान्तिः शान्तिः शान्तिः ॥',
        transliteration: 'Oṃ asato mā sadgamaya\ntamaso ma jyotirgamaya\nmṛtyormā amṛtaṃ gamaya\noṃ śāntiḥ śāntiḥ śāntiḥ',
        meaning: 'Lead me from untruth to truth. Lead me from darkness to light. Lead me from death to immortality. Om Peace, Peace, Peace.',
        startSecs: 0,
        meaning_hi: 'यह उपनिषद् की गहन प्रार्थना है कि हमें असत्य से सत्य की ओर, अज्ञान के अंधकार से ज्ञान के प्रकाश की ओर ले जाया जाए। साथ ही यह मृत्यु और सीमितता के भय से ऊपर उठाकर अमृततत्त्व की अनुभूति कराने की विनती है।'
      }
    ]
  },
  // ── Om Purnamadah Purnamidam ───────────────────────────────────────────────
  {
    id: 'om-purnamadah',
    title: 'Om Purnamadah Purnamidam',
    titleDevanagari: 'ॐ पूर्णमदः पूर्णमिदम्',
    deity: 'universal',
    deityEmoji: '⭕',
    tradition: 'hindu',
    type: 'mantra',
    mood: 'meditative',
    language: 'Sanskrit',
    source: 'Isha Upanishad — Invocation',
    description: 'The supreme declaration of wholeness, expressing that the supreme absolute remains whole and complete regardless of creation.',
    verses: [
      {
        number: 1,
        sanskrit: 'ॐ पूर्णमदः पूर्णमिदं पूर्णात्पूर्णमुदच्यते ।\nपूर्णस्य पूर्णमादाय पूर्णमेवावशिष्यते ॥',
        transliteration: 'Oṃ pūrṇamadaḥ pūrṇamidaṃ pūrṇāt pūrṇamudacyate\npūrṇस्य pūrṇamādāya pūrṇamevāvaśiṣyate',
        meaning: 'That absolute is whole; this manifest universe is whole. From the whole, the whole arises. Take the whole from the whole, yet the whole remains.',
        startSecs: 0,
        meaning_hi: 'वह परम सत्य पूर्ण है और यह जगत भी उसी पूर्णता से प्रकट हुआ है। पूर्ण से पूर्ण प्रकट होने पर भी मूल पूर्णता कम नहीं होती; यह मंत्र हमें दिव्य अखंडता और एकत्व का बोध कराता है।'
      }
    ]
  },
  // ── Lokah Samastah Sukhino Bhavantu ────────────────────────────────────────
  {
    id: 'lokah-samastah',
    title: 'Lokah Samastah Sukhino Bhavantu',
    titleDevanagari: 'लोकाः समस्ताः सुखिनो भवन्तु',
    deity: 'universal',
    deityEmoji: '🌏',
    tradition: 'all',
    type: 'mantra',
    mood: 'meditative',
    language: 'Sanskrit',
    source: 'Universal Vedic Prayer',
    description: 'A beautiful prayer wishing peace, happiness, and absolute freedom to all beings across all worlds.',
    verses: [
      {
        number: 1,
        sanskrit: 'ॐ लोकाः समस्ताः सुखिनो भवन्तु ॥',
        transliteration: 'Oṃ lokāḥ samastāḥ sukhino bhavantu',
        meaning: 'May all beings everywhere be happy and free, and may the thoughts, words, and actions of my own life contribute in some way to that happiness and to that freedom for all.',
        startSecs: 0,
        meaning_hi: 'यह प्रार्थना केवल अपने लिए नहीं, बल्कि समस्त लोकों के सभी प्राणियों के सुख और स्वतंत्रता के लिए है। साथ ही यह स्मरण भी है कि हमारा जीवन, वचन और कर्म उस सार्वभौमिक कल्याण में योगदान दें।'
      }
    ]
  },
  // ── Sarvesham Svastir Bhavatu ──────────────────────────────────────────────
  {
    id: 'sarvesham-svastir',
    title: 'Sarvesham Svastir Bhavatu',
    titleDevanagari: 'सर्वेशां स्वस्तिर्भवतु',
    deity: 'universal',
    deityEmoji: '👐',
    tradition: 'all',
    type: 'mantra',
    mood: 'gratitude',
    language: 'Sanskrit',
    source: 'Universal Vedic Prayer',
    description: 'A comprehensive blessing wishing well-being, peace, wholeness, and auspiciousness for all living creatures.',
    verses: [
      {
        number: 1,
        sanskrit: 'ॐ सर्वेशां स्वस्तिर्भवतु ।\nसर्वेशां शान्तिर्भवतु ।\nसर्वेशां पूर्णं भवतु ।\nसर्वेशां मङ्गलं भवतु ॥',
        transliteration: 'Oṃ sarveṣāṃ svastirbhavatu\nsarveṣāṃ śāntirbhavatu\nsarveṣāṃ pūrṇam bhavatu\nsarveṣāṃ maṅgalam bhavatu',
        meaning: 'May well-being be unto all. May peace be unto all. May wholeness be unto all. May auspiciousness be unto all.',
        startSecs: 0,
        meaning_hi: 'यह सर्वजन कल्याण की मंगलकामना है कि सबको स्वास्थ्य, शांति, पूर्णता और शुभता प्राप्त हो। ऐसा भाव साधक के मन को व्यापक करुणा और समदृष्टि से भर देता है।'
      }
    ]
  },
  // ── Shivoham (Nirvana Shatakam short) ──────────────────────────────────────
  {
    id: 'shivoham',
    title: 'Shivoham (Consciousness & Bliss)',
    titleDevanagari: 'शिवोऽहम्',
    deity: 'shiva',
    deityEmoji: '🕉️',
    tradition: 'hindu',
    type: 'mantra',
    mood: 'meditative',
    language: 'Sanskrit',
    source: 'Composed by Adi Shankaracharya',
    description: 'The single ultimate declaration of non-dual consciousness: "I am Shiva, the form of consciousness and bliss."',
    verses: [
      {
        number: 1,
        sanskrit: 'चिदानन्दरूपः शिवोऽहं शिवोऽहम् ॥',
        transliteration: 'Cidānandarūpaḥ śivo\'haṃ śivo\'ham',
        meaning: 'I am of the form of consciousness and bliss — I am Shiva, I am Shiva.',
        startSecs: 0,
        meaning_hi: 'यह वाक्य आत्मा की परम पहचान का उद्घोष है कि मेरा सत्य स्वरूप शुद्ध चेतना और आनंद है। यहाँ शिवोऽहम् का अर्थ व्यक्तिगत अहंकार नहीं, बल्कि उस दिव्य, निष्कलुष और सर्वव्यापक सत्ता से एकत्व है।'
      }
    ]
  },
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
      {
        number: 1,
        sanskrit: `ੴ ਸਤਿ ਨਾਮੁ ਕਰਤਾ ਪੁਰਖੁ ਨਿਰਭਉ ਨਿਰਵੈਰੁ ਅਕਾਲ ਮੂਰਤਿ ਅਜੂਨੀ ਸੈਭੰ ਗੁਰ ਪ੍ਰਸਾਦਿ ॥
॥ ਜਪੁ ॥
ਆਦਿ ਸਚੁ ਜੁਗਾਦਿ ਸਚੁ ॥
ਹੈ ਭੀ ਸਚੁ ਨਾਨਕ ਹੋਸੀ ਭੀ ਸਚੁ ॥੧॥
ਸੋਚੈ ਸੋਚਿ ਨ ਹੋਵਈ ਜੇ ਸੋਚੀ ਲਖ ਵਾਰ ॥
ਚੁਪੈ ਚੁਪ ਨ ਹੋਵਈ ਜੇ ਲਾਇ ਰਹਾ ਲਿਵ ਤਾਰ ॥
ਭੁਖਿਆ ਭੁਖ ਨ ਉਤਰੀ ਜੇ ਬੰਨਾ ਪੁਰੀਆ ਭਾਰ ॥
ਸਹਸ ਸਿਆਣਪਾ ਲਖ ਹੋਹਿ ਤ ਇਕ ਨ ਚਲੈ ਨਾਲਿ ॥
ਕਿਵ ਸਚਿਆਰਾ ਹੋਈਐ ਕਿਵ ਕੂੜੈ ਤੁਟੈ ਪਾਲਿ ॥
ਹੁਕਮਿ ਰਜਾਈ ਚਲਣਾ ਨਾਨਕ ਲਿਖਿਆ ਨਾਲਿ ॥੧॥`,
        transliteration: `ik oankaar sat naam karataa purakh nirbhau niravair akaal moorat ajoonee saibhan gur prasaad |
| jap |
aad sach jugaad sach |
hai bhee sach naanak hosee bhee sach |1|
sochai soch na hovee je sochee lakh vaar |
chupai chup na hovee je laae rahaa liv taar |
bhukhiaa bhukh na utaree je banaa pureea bhaar |
sehas siaanapaa lakh hohi ta ik na chalai naal |
kiv sachiaaraa hoeeai kiv koorrai tuttai paal |
hukam rajaaee chalanaa naanak likhiaa naal |1|`,
        meaning: `One Universal Creator God. The Name Is Truth. Creative Being Personified. No Fear. No Hatred. Image Of The Undying, Beyond Birth, Self-Existent. By Guru's Grace ~ Chant And Meditate: True In The Primal Beginning. True Throughout The Ages. True Here And Now. O Nanak, Forever And Ever True. ||1|| By thinking, He cannot be reduced to thought, even by thinking hundreds of thousands of times. By remaining silent, inner silence is not obtained, even by remaining lovingly absorbed deep within. The hunger of the hungry is not appeased, even by piling up loads of worldly goods. Hundreds of thousands of clever tricks, but not even one of them will go along with you in the end. So how can you become truthful? And how can the veil of illusion be torn away? O Nanak, it is written that you shall obey the Hukam of His Command, and walk in the Way of His Will. ||1||`,
        meaning_pa: `ਅਕਾਲ ਪੁਰਖ ਇੱਕ ਹੈ, ਜਿਸ ਦਾ ਨਾਮ 'ਹੋਂਦ ਵਾਲਾ' ਹੈ ਜੋ ਸ੍ਰਿਸ਼ਟੀ ਦਾ ਰਚਨਹਾਰ ਹੈ, ਜੋ ਸਭ ਵਿਚ ਵਿਆਪਕ ਹੈ, ਭੈ ਤੋਂ ਰਹਿਤ ਹੈ, ਵੈਰ-ਰਹਿਤ ਹੈ, ਜਿਸ ਦਾ ਸਰੂਪ ਕਾਲ ਤੋਂ ਪਰੇ ਹੈ, (ਭਾਵ, ਜਿਸ ਦਾ ਸਰੀਰ ਨਾਸ-ਰਹਿਤ ਹੈ), ਜੋ ਜੂਨਾਂ ਵਿਚ ਨਹੀਂ ਆਉਂਦਾ, ਜਿਸ ਦਾ ਪ੍ਰਕਾਸ਼ ਆਪਣੇ ਆਪ ਤੋਂ ਹੋਇਆ ਹੈ ਅਤੇ ਜੋ ਸਤਿਗੁਰੂ ਦੀ ਕਿਰਪਾ ਨਾਲ ਮਿਲਦਾ ਹੈ। 'ਜਪੁ' ਬਾਣੀ ਦਾ ਨਾਮ ਹੈ। ਅਕਾਲ ਪੁਰਖ ਮੁੱਢ ਤੋਂ ਹੋਂਦ ਵਾਲਾ ਹੈ, ਜੁਗਾਂ ਦੇ ਮੁੱਢ ਤੋਂ ਮੌਜੂਦ ਹੈ। ਹੇ ਨਾਨਕ! ਇਸ ਵੇਲੇ ਭੀ ਮੌਜੂਦ ਹੈ ਤੇ ਅਗਾਂਹ ਨੂੰ ਭੀ ਹੋਂਦ ਵਾਲਾ ਰਹੇਗਾ ॥੧॥ ਜੇ ਮੈਂ ਲੱਖ ਵਾਰੀ (ਭੀ) (ਇਸ਼ਨਾਨ ਆਦਿਕ ਨਾਲ ਸਰੀਰ ਦੀ) ਸੁੱਚ ਰੱਖਾਂ, (ਤਾਂ ਭੀ ਇਸ ਤਰ੍ਹਾਂ) ਸੁੱਚ ਰੱਖਣ ਨਾਲ (ਮਨ ਦੀ) ਸੁੱਚ ਨਹੀਂ ਰਹਿ ਸਕਦੀ। ਜੇ ਮੈਂ (ਸਰੀਰ ਦੀ) ਇਕ-ਤਾਰ ਸਮਾਧੀ ਲਾਈ ਰੱਖਾਂ; (ਤਾਂ ਭੀ ਇਸ ਤਰ੍ਹਾਂ) ਚੁੱਪ ਕਰ ਰਹਿਣ ਨਾਲ ਮਨ ਦੀ ਸ਼ਾਂਤੀ ਨਹੀਂ ਹੋ ਸਕਦੀ। ਜੇ ਮੈਂ ਸਾਰੇ ਭਵਣਾਂ ਦੇ ਪਦਾਰਥਾਂ ਦੇ ਢੇਰ (ਭੀ) ਸਾਂਭ ਲਵਾਂ, ਤਾਂ ਭੀ ਤ੍ਰਿਸ਼ਨਾ ਦੇ ਅਧੀਨ ਰਿਹਾਂ ਤ੍ਰਿਸ਼ਨਾ ਦੂਰ ਨਹੀਂ ਹੋ ਸਕਦੀ। ਜੇ (ਮੇਰੇ ਵਿਚ) ਹਜ਼ਾਰਾਂ ਤੇ ਲੱਖਾਂ ਚਤੁਰਾਈਆਂ ਹੋਵਣ, (ਤਾਂ ਭੀ ਉਹਨਾਂ ਵਿਚੋਂ) ਇਕ ਭੀ ਚਤੁਰਾਈ ਸਾਥ ਨਹੀਂ ਦੇਂਦੀ। (ਤਾਂ ਫਿਰ) ਅਕਾਲ ਪੁਰਖ ਦਾ ਪਰਕਾਸ਼ ਹੋਣ ਲਈ ਯੋਗ ਕਿਵੇਂ ਬਣ ਸਕੀਦਾ ਹੈ (ਅਤੇ ਸਾਡੇ ਅੰਦਰ ਦਾ) ਕੂੜ ਦਾ ਪਰਦਾ ਕਿਵੇਂ ਟੁੱਟ ਸਕਦਾ ਹੈ? ਰਜ਼ਾ ਦੇ ਮਾਲਕ ਅਕਾਲ ਪੁਰਖ ਦੇ ਹੁਕਮ ਵਿਚ ਤੁਰਨਾ-(ਇਹੀ ਇਕ ਵਿਧੀ ਹੈ)। ਹੇ ਨਾਨਕ! (ਇਹ ਵਿਧੀ) ਧੁਰ ਤੋਂ ਹੀ ਜਦ ਤੋਂ ਜਗਤ ਬਣਿਆ ਹੈ, ਲਿਖੀ ਚਲੀ ਆ ਰਹੀ ਹੈ ॥੧॥`
      },

      {
        number: 2,
        sanskrit: `ਹੁਕਮੀ ਹੋਵਨਿ ਆਕਾਰ ਹੁਕਮੁ ਨ ਕਹਿਆ ਜਾਈ ॥
ਹੁਕਮੀ ਹੋਵਨਿ ਜੀਅ ਹੁਕਮਿ ਮਿਲੈ ਵਡਿਆਈ ॥
ਹੁਕਮੀ ਉਤਮੁ ਨੀਚੁ ਹੁਕਮਿ ਲਿਖਿ ਦੁਖ ਸੁਖ ਪਾਈਅਹਿ ॥
ਇਕਨਾ ਹੁਕਮੀ ਬਖਸੀਸ ਇਕਿ ਹੁਕਮੀ ਸਦਾ ਭਵਾਈਅਹਿ ॥
ਹੁਕਮੈ ਅੰਦਰਿ ਸਭੁ ਕੋ ਬਾਹਰਿ ਹੁਕਮ ਨ ਕੋਇ ॥
ਨਾਨਕ ਹੁਕਮੈ ਜੇ ਬੁਝੈ ਤ ਹਉਮੈ ਕਹੈ ਨ ਕੋਇ ॥੨॥`,
        transliteration: `hukamee hovan aakaar hukam na kahiaa jaaee |
hukamee hovan jeea hukam milai vaddiaaee |
hukamee utam neech hukam likh dukh sukh paaeeeh |
eikanaa hukamee bakhasees ik hukamee sadaa bhavaaeeeh |
hukamai andar sabh ko baahar hukam na koe |
naanak hukamai je bujhai ta haumai kahai na koe |2|`,
        meaning: `By His Command, bodies are created; His Command cannot be described. By His Command, souls come into being; by His Command, glory and greatness are obtained. By His Command, some are high and some are low; by His Written Command, pain and pleasure are obtained. Some, by His Command, are blessed and forgiven; others, by His Command, wander aimlessly forever. Everyone is subject to His Command; no one is beyond His Command. O Nanak, one who understands His Command, does not speak in ego. ||2||`,
        meaning_hi: `उनके आदेश से, शरीर निर्मित होते हैं; उनके आदेश का वर्णन नहीं किया जा सकता. उनकी आज्ञा से आत्माएं अस्तित्व में आती हैं; उनकी आज्ञा से महिमा और महानता प्राप्त होती है। उसकी आज्ञा से कुछ ऊँचे और कुछ नीच हैं; उनकी लिखित आज्ञा से दुःख और सुख प्राप्त होते हैं। कुछ, उसकी आज्ञा से, धन्य और क्षमा किये गये हैं; अन्य लोग, उसकी आज्ञा से, सदैव लक्ष्यहीन होकर भटकते रहते हैं। हर कोई उसकी आज्ञा के अधीन है; कोई भी उसकी आज्ञा से परे नहीं है। हे नानक, जो उसकी आज्ञा को समझता है, वह अहंकार में नहीं बोलता। ||2||`,
        meaning_pa: `ਅਕਾਲ ਪੁਰਖ ਦੇ ਹੁਕਮ ਅਨੁਸਾਰ ਸਾਰੇ ਸਰੀਰ ਬਣਦੇ ਹਨ, (ਪਰ ਇਹ) ਹੁਕਮ ਦੱਸਿਆ ਨਹੀਂ ਜਾ ਸਕਦਾ ਕਿ ਕਿਹੋ ਜਿਹਾ ਹੈ। ਰੱਬ ਦੇ ਹੁਕਮ ਅਨੁਸਾਰ ਹੀ ਸਾਰੇ ਜੀਵ ਜੰਮ ਪੈਂਦੇ ਹਨ ਅਤੇ ਹੁਕਮ ਅਨੁਸਾਰ ਹੀ (ਰੱਬ ਦੇ ਦਰ 'ਤੇ) ਸ਼ੋਭਾ ਮਿਲਦੀ ਹੈ। ਰੱਬ ਦੇ ਹੁਕਮ ਵਿਚ ਕੋਈ ਮਨੁੱਖ ਚੰਗਾ (ਬਣ ਜਾਂਦਾ) ਹੈ, ਕੋਈ ਭੈੜਾ। ਉਸ ਦੇ ਹੁਕਮ ਵਿਚ ਹੀ (ਆਪਣੇ ਕੀਤੇ ਹੋਏ ਕਰਮਾਂ ਦੇ) ਲਿਖੇ ਅਨੁਸਾਰ ਦੁੱਖ ਤੇ ਸੁਖ ਭੋਗੀਦੇ ਹਨ। ਹੁਕਮ ਵਿਚ ਹੀ ਕਦੀ ਮਨੁੱਖਾਂ ਉੱਤੇ (ਅਕਾਲ ਪੁਰਖ ਦੇ ਦਰ ਤੋਂ) ਬਖ਼ਸ਼ਸ਼ ਹੁੰਦੀ ਹੈ, ਅਤੇ ਉਸ ਦੇ ਹੁਕਮ ਵਿਚ ਹੀ ਕਈ ਮਨੁੱਖ ਨਿੱਤ ਜਨਮ ਮਰਨ ਦੇ ਗੇੜ ਵਿਚ ਭਵਾਈਦੇ ਹਨ। ਹਰੇਕ ਜੀਵ ਰੱਬ ਦੇ ਹੁਕਮ ਵਿਚ ਹੀ ਹੈ, ਕੋਈ ਜੀਵ ਹੁਕਮ ਤੋਂ ਬਾਹਰ (ਭਾਵ, ਹੁਕਮ ਤੋ ਆਕੀ) ਨਹੀਂ ਹੋ ਸਕਦਾ। ਹੇ ਨਾਨਕ! ਜੇ ਕੋਈ ਮਨੁੱਖ ਅਕਾਲ ਪੁਰਖ ਦੇ ਹੁਕਮ ਨੂੰ ਸਮਝ ਲਏ ਤਾਂ ਫਿਰ ਉਹ ਸੁਆਰਥ ਦੀਆਂ ਗੱਲਾਂ ਨਹੀਂ ਕਰਦਾ (ਭਾਵ, ਫਿਰ ਉਹ ਸੁਆਰਥੀ ਜੀਵਨ ਛੱਡ ਦੇਂਦਾ ਹੈ) ॥੨॥`
      },
      {
        number: 3,
        sanskrit: `ਗਾਵੈ ਕੋ ਤਾਣੁ ਹੋਵੈ ਕਿਸੈ ਤਾਣੁ ॥
ਗਾਵੈ ਕੋ ਦਾਤਿ ਜਾਣੈ ਨੀਸਾਣੁ ॥
ਗਾਵੈ ਕੋ ਗੁਣ ਵਡਿਆਈਆ ਚਾਰ ॥
ਗਾਵੈ ਕੋ ਵਿਦਿਆ ਵਿਖਮੁ ਵੀਚਾਰੁ ॥
ਗਾਵੈ ਕੋ ਸਾਜਿ ਕਰੇ ਤਨੁ ਖੇਹ ॥
ਗਾਵੈ ਕੋ ਜੀਅ ਲੈ ਫਿਰਿ ਦੇਹ ॥
ਗਾਵੈ ਕੋ ਜਾਪੈ ਦਿਸੈ ਦੂਰਿ ॥
ਗਾਵੈ ਕੋ ਵੇਖੈ ਹਾਦਰਾ ਹਦੂਰਿ ॥
ਕਥਨਾ ਕਥੀ ਨ ਆਵੈ ਤੋਟਿ ॥
ਕਥਿ ਕਥਿ ਕਥੀ ਕੋਟੀ ਕੋਟਿ ਕੋਟਿ ॥
ਦੇਦਾ ਦੇ ਲੈਦੇ ਥਕਿ ਪਾਹਿ ॥
ਜੁਗਾ ਜੁਗੰਤਰਿ ਖਾਹੀ ਖਾਹਿ ॥
ਹੁਕਮੀ ਹੁਕਮੁ ਚਲਾਏ ਰਾਹੁ ॥
ਨਾਨਕ ਵਿਗਸੈ ਵੇਪਰਵਾਹੁ ॥੩॥`,
        transliteration: `gaavai ko taan hovai kisai taan |
gaavai ko daat jaanai neesaan |
gaavai ko gun vaddiaaeea chaar |
gaavai ko vidiaa vikham veechaar |
gaavai ko saaj kare tan kheh |
gaavai ko jeea lai fir deh |
gaavai ko jaapai disai door |
gaavai ko vekhai haadaraa hadoor |
kathanaa kathee na aavai tott |
kath kath kathee kottee kott kott |
dedaa de laide thak paeh |
jugaa jugantar khaahee khaeh |
hukamee hukam chalaae raahu |
naanak vigasai veparavaahu |3|`,
        meaning: `Some sing of His Power-who has that Power? Some sing of His Gifts, and know His Sign and Insignia. Some sing of His Glorious Virtues, Greatness and Beauty. Some sing of knowledge obtained of Him, through difficult philosophical studies. Some sing that He fashions the body, and then again reduces it to dust. Some sing that He takes life away, and then again restores it. Some sing that He seems so very far away. Some sing that He watches over us, face to face, ever-present. There is no shortage of those who preach and teach. Millions upon millions offer millions of sermons and stories. The Great Giver keeps on giving, while those who receive grow weary of receiving. Throughout the ages, consumers consume. The Commander, by His Command, leads us to walk on the Path. O Nanak, He blossoms forth, Carefree and Untroubled. ||3||`,
        meaning_hi: `कुछ लोग उसकी शक्ति के बारे में गाते हैं- वह शक्ति किसके पास है? कुछ लोग उसके उपहारों के बारे में गाते हैं, और उसके चिन्ह और चिन्ह को जानते हैं। कुछ लोग उनके गौरवशाली गुणों, महानता और सुंदरता के बारे में गाते हैं। कुछ लोग कठिन दार्शनिक अध्ययनों से प्राप्त ज्ञान का गुणगान करते हैं। कुछ लोग गाते हैं कि वह शरीर को बनाता है, और फिर उसे मिट्टी में मिला देता है। कोई-कोई गाते हैं कि वह प्राण ले लेता है, फिर बना देता है। कोई-कोई गाते हैं वह बहुत दूर मालूम होता है। कुछ लोग गाते हैं कि वह हम पर नज़र रखता है, आमने-सामने, सदैव मौजूद। उपदेश देने और शिक्षा देने वालों की कमी नहीं है। लाखों-करोड़ों लोग लाखों उपदेश और कहानियाँ पेश करते हैं। महान दाता देता रहता है, जबकि जो लेते हैं वे लेते-लेते थक जाते हैं। युगों-युगों से उपभोक्ता उपभोग करते हैं। कमांडर, अपनी आज्ञा से, हमें पथ पर चलने के लिए प्रेरित करता है। हे नानक, वह निश्चिन्त और निष्कंटक होकर खिलता है। ||3||`,
        meaning_pa: `ਜਿਸ ਕਿਸੇ ਮਨੁੱਖ ਨੂੰ ਸਮਰਥਾ ਹੁੰਦੀ ਹੈ, ਉਹ ਰੱਬ ਦੇ ਤਾਣ ਨੂੰ ਗਾਉਂਦਾ ਹੈ, (ਭਾਵ, ਉਸ ਦੀ ਸਿਫ਼ਤ-ਸਾਲਾਹ ਕਰਦਾ ਹੈ ਤੇ ਉਸ ਦੇ ਉਹ ਕੰਮ ਕਥਨ ਕਰਦਾ ਹੈ, ਜਿਨ੍ਹਾਂ ਤੋਂ ਉਸ ਦੀ ਵੱਡੀ ਤਾਕਤ ਪਰਗਟ ਹੋਵੇ)। ਕੋਈ ਮਨੁੱਖ ਉਸ ਦੀਆਂ ਦਾਤਾਂ ਨੂੰ ਹੀ ਗਾਉਂਦਾ ਹੈ, (ਕਿਉਂਕਿ ਇਹਨਾਂ ਦਾਤਾਂ ਨੂੰ ਉਹ ਰੱਬ ਦੀ ਰਹਿਮਤ ਦਾ) ਨਿਸ਼ਾਨ ਸਮਝਦਾ ਹੈ। ਕੋਈ ਮਨੁੱਖ ਰੱਬ ਦੇ ਸੋਹਣੇ ਗੁਣ ਤੇ ਸੋਹਣੀਆਂ ਵਡਿਆਈਆਂ ਵਰਣਨ ਕਰਦਾ ਹੈ। ਕੋਈ ਮਨੁੱਖ ਵਿੱਦਿਆ ਦੇ ਬਲ ਨਾਲ ਅਕਾਲ ਪੁਰਖ ਦੇ ਕਠਨ ਗਿਆਨ ਨੂੰ ਗਾਉਂਦਾ ਹੈ (ਭਾਵ, ਸ਼ਾਸਤਰ ਆਦਿਕ ਦੁਆਰਾ ਆਤਮਕ ਫ਼ਿਲਾਸਫ਼ੀ ਦੇ ਔਖੇ ਵਿਸ਼ਿਆਂ 'ਤੇ ਵਿਚਾਰ ਕਰਦਾ ਹੈ)। ਕੋਈ ਮਨੁੱਖ ਇਉਂ ਗਾਉਂਦਾ ਹੈ, 'ਅਕਾਲ ਪੁਰਖ ਸਰੀਰ ਨੂੰ ਬਣਾ ਕੇ (ਫਿਰ) ਸੁਆਹ ਕਰ ਦੇਂਦਾ ਹੈ'। ਕੋਈ ਇਉਂ ਗਾਉਂਦਾ ਹੈ, 'ਹਰੀ (ਸਰੀਰਾਂ ਵਿਚੋਂ) ਜਿੰਦਾਂ ਕੱਢ ਕੇ ਫਿਰ (ਦੂਜੇ ਸਰੀਰਾਂ ਵਿਚ) ਪਾ ਦੇਂਦਾ ਹੈ'। ਕੋਈ ਮਨੁੱਖ ਆਖਦਾ ਹੈ, 'ਅਕਾਲ ਪੁਰਖ ਦੂਰ ਜਾਪਦਾ ਹੈ, ਦੂਰ ਦਿੱਸਦਾ ਹੈ'; ਪਰ ਕੋਈ ਆਖਦਾ ਹੈ, '(ਨਹੀਂ, ਨੇੜੇ ਹੈ), ਸਭ ਥਾਈਂ ਹਾਜ਼ਰ ਹੈ, ਸਭ ਨੂੰ ਵੇਖ ਰਿਹਾ ਹੈ'। ਹੁਕਮ ਦੇ ਵਰਣਨ ਕਰਨ ਦੀ ਤੋਟ ਨਹੀਂ ਆ ਸਕੀ (ਭਾਵ, ਵਰਣਨ ਕਰ ਕਰ ਕੇ ਹੁਕਮ ਦਾ ਅੰਤ ਨਹੀਂ ਪੈ ਸਕਿਆ, ਹੁਕਮ ਦਾ ਸਹੀ ਸਰੂਪ ਨਹੀਂ ਲੱਭ ਸਕਿਆ); ਭਾਵੇਂ ਕ੍ਰੋੜਾਂ ਹੀ ਜੀਵਾਂ ਨੇ ਬੇਅੰਤ ਵਾਰੀ (ਅਕਾਲ ਪੁਰਖ ਦੇ ਹੁਕਮ ਦਾ) ਵਰਣਨ ਕੀਤਾ ਹੈ। ਦਾਤਾਰ ਅਕਾਲ ਪੁਰਖ (ਸਭ ਜੀਆਂ ਨੂੰ ਰਿਜ਼ਕ) ਦੇ ਰਿਹਾ ਹੈ, ਪਰ ਜੀਵ ਲੈ ਲੈ ਕੇ ਥੱਕ ਪੈਂਦੇ ਹਨ। (ਸਭ ਜੀਵ) ਸਦਾ ਤੋਂ ਹੀ (ਰੱਬ ਦੇ ਦਿੱਤੇ ਪਦਾਰਥ) ਖਾਂਦੇ ਚਲੇ ਆ ਰਹੇ ਹਨ। *** ਹੁਕਮ ਵਾਲੇ ਰੱਬ ਦਾ ਹੁਕਮ ਹੀ (ਸੰਸਾਰ ਦੀ ਕਾਰ ਵਾਲਾ) ਰਸਤਾ ਚਲਾ ਰਿਹਾ ਹੈ। ਹੇ ਨਾਨਕ! ਉਹ ਨਿਰੰਕਾਰ ਸਦਾ ਵੇਪਰਵਾਹ ਹੈ ਤੇ ਪਰਸੰਨ ਹੈ ॥੩॥`
      },
      {
        number: 4,
        sanskrit: `ਸਾਚਾ ਸਾਹਿਬੁ ਸਾਚੁ ਨਾਇ ਭਾਖਿਆ ਭਾਉ ਅਪਾਰੁ ॥
ਆਖਹਿ ਮੰਗਹਿ ਦੇਹਿ ਦੇਹਿ ਦਾਤਿ ਕਰੇ ਦਾਤਾਰੁ ॥
ਫੇਰਿ ਕਿ ਅਗੈ ਰਖੀਐ ਜਿਤੁ ਦਿਸੈ ਦਰਬਾਰੁ ॥
ਮੁਹੌ ਕਿ ਬੋਲਣੁ ਬੋਲੀਐ ਜਿਤੁ ਸੁਣਿ ਧਰੇ ਪਿਆਰੁ ॥
ਅੰਮ੍ਰਿਤ ਵੇਲਾ ਸਚੁ ਨਾਉ ਵਡਿਆਈ ਵੀਚਾਰੁ ॥
ਕਰਮੀ ਆਵੈ ਕਪੜਾ ਨਦਰੀ ਮੋਖੁ ਦੁਆਰੁ ॥
ਨਾਨਕ ਏਵੈ ਜਾਣੀਐ ਸਭੁ ਆਪੇ ਸਚਿਆਰੁ ॥੪॥`,
        transliteration: `saachaa saahib saach naae bhaakhiaa bhaau apaar |
aakheh mangeh dehi dehi daat kare daataar |
fer ki agai rakheeai jit disai darabaar |
muhau ki bolan boleeai jit sun dhare piaar |
amrit velaa sach naau vaddiaaee veechaar |
karamee aavai kaparraa nadaree mokh duaar |
naanak evai jaaneeai sabh aape sachiaar |4|`,
        meaning: `True is the Master, True is His Name-speak it with infinite love. People beg and pray, "Give to us, give to us", and the Great Giver gives His Gifts. So what offering can we place before Him, by which we might see the Darbaar of His Court? What words can we speak to evoke His Love? In the Amrit Vaylaa, the ambrosial hours before dawn, chant the True Name, and contemplate His Glorious Greatness. By the karma of past actions, the robe of this physical body is obtained. By His Grace, the Gate of Liberation is found. O Nanak, know this well: the True One Himself is All. ||4||`,
        meaning_hi: `सच्चा है मालिक, सच्चा है उसका नाम - इसे असीम प्रेम से बोलो। लोग भीख मांगते हैं और प्रार्थना करते हैं, "हमें दो, हमें दो", और महान दाता अपना उपहार देता है। तो हम उनके सामने क्या भेंट चढ़ा सकते हैं, जिससे हम उनके दरबार के दर्शन कर सकें? हम उसके प्रेम को प्रकट करने के लिए कौन से शब्द बोल सकते हैं? अमृत ​​वेला में, भोर से पहले के अमृत घंटों में, सच्चे नाम का जाप करें, और उनकी गौरवशाली महानता का चिंतन करें। पिछले कर्मों के फलस्वरूप इस भौतिक शरीर का वस्त्र प्राप्त होता है। उनकी कृपा से मुक्ति का द्वार मिल गया है। हे नानक, यह अच्छी तरह से जान लो: सच्चा स्वयं ही सब कुछ है। ||4||`,
        meaning_pa: `ਅਕਾਲ ਪੁਰਖ ਸਦਾ-ਥਿਰ ਰਹਿਣ ਵਾਲਾ ਹੀ ਹੈ, ਉਸ ਦਾ ਨਿਯਮ ਭੀ ਸਦਾ ਅਟੱਲ ਹੈ। ਉਸ ਦੀ ਬੋਲੀ ਪ੍ਰੇਮ ਹੈ ਅਤੇ ਉਹ ਆਪ ਅਕਾਲ ਪੁਰਖ ਬੇਅੰਤ ਹੈ। ਅਸੀਂ ਜੀਵ ਉਸ ਪਾਸੋਂ ਦਾਤਾਂ ਮੰਗਦੇ ਹਾਂ ਤੇ ਆਖਦੇ ਹਾਂ,'(ਹੇ ਹਰੀ! ਸਾਨੂੰ ਦਾਤਾਂ) ਦੇਹ'। ਉਹ ਦਾਤਾਰ ਬਖ਼ਸ਼ਸ਼ਾਂ ਕਰਦਾ ਹੈ। (ਜੇ ਸਾਰੀਆਂ ਦਾਤਾਂ ਉਹ ਆਪ ਹੀ ਬਖਸ਼ ਰਿਹਾ ਹੈ ਤਾਂ) ਫਿਰ ਅਸੀਂ ਕਿਹੜੀ ਭੇਟਾ ਉਸ ਅਕਾਲ ਪੁਰਖ ਦੇ ਅੱਗੇ ਰੱਖੀਏ, ਜਿਸ ਦੇ ਸਦਕੇ ਸਾਨੂੰ ਉਸ ਦਾ ਦਰਬਾਰ ਦਿੱਸ ਪਏ? ਅਸੀਂ ਮੂੰਹੋਂ ਕਿਹੜਾ ਬਚਨ ਬੋਲੀਏ (ਭਾਵ, ਕਿਹੋ ਜਿਹੀ ਅਰਦਾਸ ਕਰੀਏ) ਜਿਸ ਨੂੰ ਸੁਣ ਕੇ ਉਹ ਹਰੀ (ਸਾਨੂੰ) ਪਿਆਰ ਕਰੇ। ਪੂਰਨ ਖਿੜਾਉ ਦਾ ਸਮਾਂ ਹੋਵੇ (ਭਾਵ, ਪ੍ਰਭਾਤ ਵੇਲਾ ਹੋਵੇ), ਨਾਮ (ਸਿਮਰੀਏ) ਤੇ ਉਸ ਦੀਆਂ ਵਡਿਆਈਆਂ ਦੀ ਵਿਚਾਰ ਕਰੀਏ। (ਇਸ ਤਰ੍ਹਾਂ) ਪ੍ਰਭੂ ਦੀ ਮਿਹਰ ਨਾਲ 'ਸਿਫਤਿ' ਰੂਪ ਪਟੋਲਾ ਮਿਲਦਾ ਹੈ, ਉਸ ਦੀ ਕ੍ਰਿਪਾ-ਦ੍ਰਿਸ਼ਟੀ ਨਾਲ 'ਕੂੜ ਦੀ ਪਾਲਿ' ਤੋਂ ਖ਼ਲਾਸੀ ਹੁੰਦੀ ਹੈ ਤੇ ਰੱਬ ਦਾ ਦਰ ਪ੍ਰਾਪਤ ਹੋ ਜਾਂਦਾ ਹੈ। ਹੇ ਨਾਨਕ! ਇਸ ਤਰ੍ਹਾਂ ਇਹ ਸਮਝ ਆ ਜਾਂਦੀ ਹੈ ਕਿ ਉਹ ਹੋਂਦ ਦਾ ਮਾਲਕ ਅਕਾਲ ਪੁਰਖ ਸਭ ਥਾਈਂ ਭਰਪੂਰ ਹੈ ॥੪॥`
      },
      {
        number: 5,
        sanskrit: `ਥਾਪਿਆ ਨ ਜਾਇ ਕੀਤਾ ਨ ਹੋਇ ॥
ਆਪੇ ਆਪਿ ਨਿਰੰਜਨੁ ਸੋਇ ॥
ਜਿਨਿ ਸੇਵਿਆ ਤਿਨਿ ਪਾਇਆ ਮਾਨੁ ॥
ਨਾਨਕ ਗਾਵੀਐ ਗੁਣੀ ਨਿਧਾਨੁ ॥
ਗਾਵੀਐ ਸੁਣੀਐ ਮਨਿ ਰਖੀਐ ਭਾਉ ॥
ਦੁਖੁ ਪਰਹਰਿ ਸੁਖੁ ਘਰਿ ਲੈ ਜਾਇ ॥
ਗੁਰਮੁਖਿ ਨਾਦੰ ਗੁਰਮੁਖਿ ਵੇਦੰ ਗੁਰਮੁਖਿ ਰਹਿਆ ਸਮਾਈ ॥
ਗੁਰੁ ਈਸਰੁ ਗੁਰੁ ਗੋਰਖੁ ਬਰਮਾ ਗੁਰੁ ਪਾਰਬਤੀ ਮਾਈ ॥
ਜੇ ਹਉ ਜਾਣਾ ਆਖਾ ਨਾਹੀ ਕਹਣਾ ਕਥਨੁ ਨ ਜਾਈ ॥
ਗੁਰਾ ਇਕ ਦੇਹਿ ਬੁਝਾਈ ॥
ਸਭਨਾ ਜੀਆ ਕਾ ਇਕੁ ਦਾਤਾ ਸੋ ਮੈ ਵਿਸਰਿ ਨ ਜਾਈ ॥੫॥`,
        transliteration: `thaapiaa na jaae keetaa na hoe |
aape aap niranjan soe |
jin seviaa tin paaeaa maan |
naanak gaaveeai gunee nidhaan |
gaaveeai suneeai man rakheeai bhaau |
dukh parahar sukh ghar lai jaae |
guramukh naadan guramukh vedan guramukh rahiaa samaaee |
gur eesar gur gorakh baramaa gur paarabatee maaee |
je hau jaanaa aakhaa naahee kahanaa kathan na jaaee |
guraa ik dehi bujhaaee |
sabhanaa jeea kaa ik daataa so mai visar na jaaee |5|`,
        meaning: `He cannot be established, He cannot be created. He Himself is Immaculate and Pure. Those who serve Him are honored. O Nanak, sing of the Lord, the Treasure of Excellence. Sing, and listen, and let your mind be filled with love. Your pain shall be sent far away, and peace shall come to your home. The Guru's Word is the Sound-current of the Naad; the Guru's Word is the Wisdom of the Vedas; the Guru's Word is all-pervading. The Guru is Shiva, the Guru is Vishnu and Brahma; the Guru is Paarvati and Lakhshmi. Even knowing God, I cannot describe Him; He cannot be described in words. The Guru has given me this one understanding: there is only the One, the Giver of all souls. May I never forget Him! ||5||`,
        meaning_hi: `उसे स्थापित नहीं किया जा सकता, उसे बनाया नहीं जा सकता. वह स्वयं बेदाग और पवित्र है। जो लोग उसकी सेवा करते हैं उनका सम्मान किया जाता है। हे नानक, प्रभु का गुणगान करो, जो उत्कृष्टता का खजाना है। गाओ, और सुनो, और अपने मन को प्रेम से भर दो। आपका दर्द दूर भेज दिया जाएगा, और शांति आपके घर आ जाएगी। गुरु का शब्द नाद की ध्वनि-धारा है; गुरु का वचन वेदों का ज्ञान है; गुरु का वचन सर्वव्यापी है। गुरु शिव हैं, गुरु विष्णु और ब्रह्मा हैं; गुरु पार्वती और लक्ष्मी हैं। ईश्वर को जानते हुए भी मैं उसका वर्णन नहीं कर सकता; उसका वर्णन शब्दों में नहीं किया जा सकता. गुरु ने मुझे यह समझ दी है: सभी आत्माओं का दाता केवल एक ही है। क्या मैं उसे कभी नहीं भूल सकता! ||5||`,
        meaning_pa: `ਨਾ ਉਹ ਪੈਦਾ ਕੀਤਾ ਜਾ ਸਕਦਾ ਹੈ ਅਤੇ ਨਾ ਹੀ ਸਾਡਾ ਬਣਾਇਆ ਬਣਦਾ ਹੈ। ਉਹ ਨਿਰੋਲ ਆਪ ਹੀ ਆਪ ਹੈ। ਉਹ ਅਕਾਲ ਪੁਰਖ ਮਾਇਆ ਦੇ ਪਰਭਾਵ ਤੋਂ ਪਰੇ ਹੈ। ਜਿਸ ਮਨੁੱਖ ਨੇ ਉਸ ਅਕਾਲ ਪੁਰਖ ਨੂੰ ਸਿਮਰਿਆ ਹੈ, ਉਸ ਨੇ ਹੀ ਵਡਿਆਈ ਪਾ ਲਈ ਹੈ। ਹੇ ਨਾਨਕ! (ਆਓ) ਅਸੀਂ ਭੀ ਉਸ ਗੁਣਾਂ ਦੇ ਖ਼ਜ਼ਾਨੇ ਹਰੀ ਦੀ ਸਿਫ਼ਤ-ਸਾਲਾਹ ਕਰੀਏ। (ਆਓ, ਅਕਾਲ ਪੁਰਖ ਦੇ ਗੁਣ) ਗਾਵੀਏ ਤੇ ਸੁਣੀਏ ਅਤੇ ਆਪਣੇ ਮਨ ਵਿਚ ਉਸਦਾ ਪ੍ਰੇਮ ਟਿਕਾਈਏ। (ਜੋ ਮਨੁੱਖ ਇਹ ਆਹਰ ਕਰਦਾ ਹੈ, ਉਹ) ਆਪਣਾ ਦੁੱਖ ਦੂਰ ਕਰਕੇ ਸੁੱਖ ਨੂੰ ਹਿਰਦੇ ਵਿਚ ਵਸਾ ਲੈਂਦਾ ਹੈ। (ਪਰ ਉਸ ਰੱਬ ਦਾ) ਨਾਮ ਤੇ ਗਿਆਨ ਗੁਰੂ ਦੀ ਰਾਹੀਂ (ਪ੍ਰਾਪਤ ਹੁੰਦਾ ਹੈ)। ਗੁਰੂ ਦੀ ਰਾਹੀਂ ਹੀ (ਇਹ ਪਰਤੀਤ ਆਉਂਦੀ ਹੈ ਕਿ) ਉਹ ਹਰੀ ਸਭ ਥਾਈਂ ਵਿਆਪਕ ਹੈ। ਗੁਰੂ ਹੀ (ਸਾਡੇ ਲਈ) ਸ਼ਿਵ ਹੈ, ਗੁਰੂ ਹੀ (ਸਾਡੇ ਲਈ) ਗੋਰਖ ਤੇ ਬ੍ਰਹਮਾ ਹੈ ਅਤੇ ਗੁਰੂ ਹੀ (ਸਾਡੇ ਲਈ) ਮਾਈ ਪਾਰਬਤੀ ਹੈ। ਉਂਝ (ਇਸ ਅਕਾਲ ਪੁਰਖ ਦੇ ਹੁਕਮ ਨੂੰ) ਜੇ ਮੈਂ ਸਮਝ, (ਭੀ) ਲਵਾਂ, (ਤਾਂ ਭੀ) ਉਸ ਦਾ ਵਰਣਨ ਨਹੀਂ ਕਰ ਸਕਦਾ। (ਅਕਾਲ ਪੁਰਖ ਦੇ ਹੁਕਮ ਦਾ) ਕਥਨ ਨਹੀਂ ਕੀਤਾ ਜਾ ਸਕਦਾ। (ਮੇਰੀ ਤਾਂ) ਹੇ ਸਤਿਗੁਰੂ! (ਤੇਰੇ ਅੱਗੇ ਅਰਦਾਸ ਹੈ ਕਿ) ਮੈਨੂੰ ਇਕ ਸਮਝ ਦੇਹ, ਕਿ ਜਿਹੜਾ ਸਭਨਾਂ ਜੀਵਾਂ ਨੂੰ ਦਾਤਾਂ ਦੇਣ ਵਾਲਾ ਇਕ ਰੱਬ ਹੈ, ਮੈਂ ਉਸ ਨੂੰ ਭੁਲਾ ਨਾ ਦਿਆਂ ॥੫॥`
      },
      {
        number: 6,
        sanskrit: `ਤੀਰਥਿ ਨਾਵਾ ਜੇ ਤਿਸੁ ਭਾਵਾ ਵਿਣੁ ਭਾਣੇ ਕਿ ਨਾਇ ਕਰੀ ॥
ਜੇਤੀ ਸਿਰਠਿ ਉਪਾਈ ਵੇਖਾ ਵਿਣੁ ਕਰਮਾ ਕਿ ਮਿਲੈ ਲਈ ॥
ਮਤਿ ਵਿਚਿ ਰਤਨ ਜਵਾਹਰ ਮਾਣਿਕ ਜੇ ਇਕ ਗੁਰ ਕੀ ਸਿਖ ਸੁਣੀ ॥
ਗੁਰਾ ਇਕ ਦੇਹਿ ਬੁਝਾਈ ॥
ਸਭਨਾ ਜੀਆ ਕਾ ਇਕੁ ਦਾਤਾ ਸੋ ਮੈ ਵਿਸਰਿ ਨ ਜਾਈ ॥੬॥`,
        transliteration: `teerath naavaa je tis bhaavaa vin bhaane ki naae karee |
jetee siratth upaaee vekhaa vin karamaa ki milai lee |
mat vich ratan javaahar maanik je ik gur kee sikh sunee |
guraa ik dehi bujhaaee |
sabhanaa jeea kaa ik daataa so mai visar na jaaee |6|`,
        meaning: `If I am pleasing to Him, then that is my pilgrimage and cleansing bath. Without pleasing Him, what good are ritual cleansings? I gaze upon all the created beings: without the karma of good actions, what are they given to receive? Within the mind are gems, jewels and rubies, if you listen to the Guru's Teachings, even once. The Guru has given me this one understanding: there is only the One, the Giver of all souls. May I never forget Him! ||6||`,
        meaning_hi: `यदि मैं उसे प्रसन्न कर रहा हूं तो वह मेरा तीर्थ और शुद्धिकरण स्नान है। उसे प्रसन्न किए बिना, अनुष्ठानिक सफ़ाई का क्या फ़ायदा? मैं सभी सृजित प्राणियों को देखता हूँ: अच्छे कर्मों के कर्म के बिना, उन्हें क्या प्राप्त करने के लिए दिया जाता है? यदि आप गुरु की शिक्षाओं को एक बार भी सुनते हैं, तो मन के भीतर रत्न, जवाहरात और माणिक हैं। गुरु ने मुझे यह समझ दी है: सभी आत्माओं का दाता केवल एक ही है। क्या मैं उसे कभी नहीं भूल सकता! ||6||`,
        meaning_pa: `ਮੈਂ ਤੀਰਥ ਉੱਤੇ ਜਾ ਕੇ ਤਦ ਇਸ਼ਨਾਨ ਕਰਾਂ ਜੇ ਇਉਂ ਕਰਨ ਨਾਲ ਉਸ ਪਰਮਾਤਮਾ ਨੂੰ ਖ਼ੁਸ਼ ਕਰ ਸਕਾਂ, ਪਰ ਜੇ ਇਸ ਤਰ੍ਹਾਂ ਪਰਮਾਤਮਾ ਖ਼ੁਸ਼ ਨਹੀਂ ਹੁੰਦਾ, ਤਾਂ ਮੈਂ (ਤੀਰਥ ਉੱਤੇ) ਇਸ਼ਨਾਨ ਕਰਕੇ ਕੀਹ ਖੱਟਾਂਗਾ? ਅਕਾਲ ਪੁਰਖ ਦੀ ਪੈਦਾ ਕੀਤੀ ਹੋਈ ਜਿਤਨੀ ਭੀ ਦੁਨੀਆ ਮੈਂ ਵੇਖਦਾ ਹਾਂ, (ਇਸ ਵਿੱਚ) ਪਰਮਾਤਮਾ ਦੀ ਕਿਰਪਾ ਤੋਂ ਬਿਨਾ ਕਿਸੇ ਨੂੰ ਕੁਝ ਨਹੀਂ ਮਿਲਦਾ, ਕੋਈ ਕੁਝ ਨਹੀਂ ਲੈ ਸਕਦਾ। ਜੇ ਸਤਿਗੁਰੂ ਦੀ ਇਕ ਸਿੱਖਿਆ ਸੁਣ ਲਈ ਜਾਏ, ਤਾਂ ਮਨੁੱਖ ਦੀ ਬੁੱਧ ਦੇ ਅੰਦਰ ਰਤਨ, ਜਵਾਹਰ ਤੇ ਮੌਤੀ (ਉਪਜ ਪੈਂਦੇ ਹਨ, ਭਾਵ, ਪਰਮਾਤਮਾ ਦੇ ਗੁਣ ਪੈਦਾ ਹੋ ਜਾਂਦੇ ਹਨ)। (ਤਾਂ ਤੇ) ਹੇ ਸਤਿਗੁਰੂ! (ਮੇਰੀ ਤੇਰੇ ਅੱਗੇ ਇਹ ਅਰਦਾਸ ਹੈ ਕਿ) ਮੈਨੂੰ ਇਕ ਇਹ ਸਮਝ ਦੇਹ, ਜਿਸ ਕਰਕੇ ਮੈਨੂੰ ਉਹ ਅਕਾਲ ਪੁਰਖ ਨਾ ਵਿਸਰ ਜਾਏ, ਜੋ ਸਾਰੇ ਜੀਵਾਂ ਨੂੰ ਦਾਤਾਂ ਦੇਣ ਵਾਲਾ ਹੈ ॥੬॥`
      },
      {
        number: 7,
        sanskrit: `ਜੇ ਜੁਗ ਚਾਰੇ ਆਰਜਾ ਹੋਰ ਦਸੂਣੀ ਹੋਇ ॥
ਨਵਾ ਖੰਡਾ ਵਿਚਿ ਜਾਣੀਐ ਨਾਲਿ ਚਲੈ ਸਭੁ ਕੋਇ ॥
ਚੰਗਾ ਨਾਉ ਰਖਾਇ ਕੈ ਜਸੁ ਕੀਰਤਿ ਜਗਿ ਲੇਇ ॥
ਜੇ ਤਿਸੁ ਨਦਰਿ ਨ ਆਵਈ ਤ ਵਾਤ ਨ ਪੁਛੈ ਕੇ ॥
ਕੀਟਾ ਅੰਦਰਿ ਕੀਟੁ ਕਰਿ ਦੋਸੀ ਦੋਸੁ ਧਰੇ ॥
ਨਾਨਕ ਨਿਰਗੁਣਿ ਗੁਣੁ ਕਰੇ ਗੁਣਵੰਤਿਆ ਗੁਣੁ ਦੇ ॥
ਤੇਹਾ ਕੋਇ ਨ ਸੁਝਈ ਜਿ ਤਿਸੁ ਗੁਣੁ ਕੋਇ ਕਰੇ ॥੭॥`,
        transliteration: `je jug chaare aarajaa hor dasoonee hoe |
navaa khanddaa vich jaaneeai naal chalai sabh koe |
changaa naau rakhaae kai jas keerat jag lee |
je tis nadar na aavee ta vaat na puchhai ke |
keettaa andar keett kar dosee dos dhare |
naanak niragun gun kare gunavantiaa gun de |
tehaa koe na sujhee ji tis gun koe kare |7|`,
        meaning: `Even if you could live throughout the four ages, or even ten times more, and even if you were known throughout the nine continents and followed by all, with a good name and reputation, with praise and fame throughout the world- still, if the Lord does not bless you with His Glance of Grace, then who cares? What is the use? Among worms, you would be considered a lowly worm, and even contemptible sinners would hold you in contempt. O Nanak, God blesses the unworthy with virtue, and bestows virtue on the virtuous. No one can even imagine anyone who can bestow virtue upon Him. ||7||`,
        meaning_hi: `भले ही आप चारों युगों में जीवित रह सकें, या दस गुना अधिक, और भले ही आप नौ महाद्वीपों में जाने जाते हों और सभी आपका अनुसरण करते हों, अच्छे नाम और प्रतिष्ठा के साथ, दुनिया भर में प्रशंसा और प्रसिद्धि के साथ हों - फिर भी, अगर प्रभु आपको अपनी कृपा दृष्टि से आशीर्वाद नहीं देते हैं, तो कौन परवाह करता है? क्या फायदा? कीड़ों में तू एक तुच्छ कीड़ा समझा जाएगा, और घृणित पापी भी तुझे तुच्छ समझेंगे। हे नानक, भगवान अयोग्य लोगों को सद्गुणों का आशीर्वाद देते हैं, और सज्जनों को सद्गुण प्रदान करते हैं। कोई ऐसे व्यक्ति की कल्पना भी नहीं कर सकता जो उसे सद्गुण प्रदान कर सके। ||7||`,
        meaning_pa: `ਜੇ ਕਿਸੇ ਮਨੁੱਖ ਦੀ ਉਮਰ ਚਾਰ ਜੁਗਾਂ ਜਿਤਨੀ ਹੋ ਜਾਏ, (ਨਿਰੀ ਇਤਨੀ ਹੀ ਨਹੀਂ, ਸਗੋਂ ਜੇ) ਇਸ ਤੋਂ ਭੀ ਦਸ ਗੁਣੀ ਹੋਰ (ਉਮਰ) ਹੋ ਜਾਏ, ਜੇ ਉਹ ਸਾਰੇ ਸੰਸਾਰ ਵਿਚ ਭੀ ਪਰਗਟ ਹੋ ਜਾਏ ਅਤੇ ਹਰੇਕ ਮਨੁੱਖ ਉਸ ਦੇ ਪਿੱਛੇ ਲੱਗ ਕੇ ਤੁਰੇ। ਜੇ ਉਹ ਚੰਗੀ ਨਾਮਵਰੀ ਖੱਟ ਕੇ ਸਾਰੇ ਸੰਸਾਰ ਵਿਚ ਸ਼ੋਭਾ ਭੀ ਪ੍ਰਾਪਤ ਕਰ ਲਏ, (ਪਰ) ਜੇਕਰ ਅਕਾਲ ਪੁਰਖ ਦੀ ਮਿਹਰ ਦੀ ਨਜ਼ਰ ਵਿਚ ਨਹੀਂ ਆ ਸਕਦਾ, ਤਾਂ ਉਹ ਉਸ ਬੰਦੇ ਵਰਗਾ ਹੈ ਜਿਸ ਦੀ ਕੋਈ ਖ਼ਬਰ ਭੀ ਨਹੀਂ ਪੁੱਛਦਾ (ਭਾਵ, ਇਤਨੀ ਮਾਣ ਵਡਿਆਈ ਵਾਲਾ ਹੁੰਦਿਆਂ ਭੀ ਅਸਲ ਵਿਚ ਨਿਆਸਰਾ ਹੀ ਹੈ)। (ਸਗੋਂ ਅਜਿਹਾ ਮਨੁੱਖ ਅਕਾਲ ਪੁਰਖ ਦੇ ਸਾਹਮਣੇ) ਇਕ ਮਮੂਲੀ ਜਿਹਾ ਕੀੜਾ ਹੈ ("ਖਸਮੈ ਨਦਰੀ ਕੀੜਾ ਆਵੈ" ਆਸਾ ਮ: ੧) ਅਕਾਲ ਪੁਰਖ ਉਸ ਨੂੰ ਦੋਸੀ ਥਾਪ ਕੇ (ਉਸ ਉੱਤੇ ਨਾਮ ਨੂੰ ਭੁੱਲਣ ਦਾ) ਦੋਸ਼ ਲਾਉਂਦਾ ਹੈ। ਹੇ ਨਾਨਕ! ਉਹ ਅਕਾਲ ਪੁਰਖ ਗੁਣ-ਹੀਨ ਮਨੁੱਖ ਵਿੱਚ ਗੁਣ ਪੈਦਾ ਕਰ ਦੇਂਦਾ ਹੈ ਤੇ ਗੁਣੀ ਮਨੁੱਖਾਂ ਨੂੰ ਭੀ ਗੁਣ ਉਹੀ ਬਖ਼ਸ਼ਦਾ ਹੈ। ਇਹੋ ਜਿਹਾ ਕੋਈ ਹੋਰ ਨਹੀਂ ਦਿੱਸਦਾ, ਜੋ ਨਿਰਗੁਣ ਜੀਵ ਨੂੰ ਕੋਈ ਗੁਣ ਦੇ ਸਕਦਾ ਹੋਵੇ। (ਭਾਵ ਪ੍ਰਭੂ ਦੀ ਮਿਹਰ ਦੀ ਨਜ਼ਰ ਹੀ ਉਸ ਨੂੰ ਉੱਚਾ ਕਰ ਸਕਦੀ ਹੈ, ਲੰਮੀ ਉਮਰ ਤੇ ਜਗਤ ਦੀ ਸ਼ੋਭਾ ਸਹਾਇਤਾ ਨਹੀਂ ਕਰਦੀ) ॥੭॥`
      },
      {
        number: 8,
        sanskrit: `ਸੁਣਿਐ ਸਿਧ ਪੀਰ ਸੁਰਿ ਨਾਥ ॥
ਸੁਣਿਐ ਧਰਤਿ ਧਵਲ ਆਕਾਸ ॥
ਸੁਣਿਐ ਦੀਪ ਲੋਅ ਪਾਤਾਲ ॥
ਸੁਣਿਐ ਪੋਹਿ ਨ ਸਕੈ ਕਾਲੁ ॥
ਨਾਨਕ ਭਗਤਾ ਸਦਾ ਵਿਗਾਸੁ ॥
ਸੁਣਿਐ ਦੂਖ ਪਾਪ ਕਾ ਨਾਸੁ ॥੮॥`,
        transliteration: `suniai sidh peer sur naath |
suniai dharat dhaval aakaas |
suniai deep loa paataal |
suniai pohi na sakai kaal |
naanak bhagataa sadaa vigaas |
suniai dookh paap kaa naas |8|`,
        meaning: `Listening-the Siddhas, the spiritual teachers, the heroic warriors, the yogic masters. Listening-the earth, its support and the Akaashic ethers. Listening-the oceans, the lands of the world and the nether regions of the underworld. Listening-Death cannot even touch you. O Nanak, the devotees are forever in bliss. Listening-pain and sin are erased. ||8||`,
        meaning_hi: `श्रवण- सिद्ध, आध्यात्मिक शिक्षक, वीर योद्धा, योग गुरु। श्रवण-पृथ्वी, उसका आधार और आकाशीय आकाश। श्रवण- समुद्र, भूमि और अधोलोक। सुनना-मृत्यु तुम्हें छू भी नहीं सकती। हे नानक, भक्त सदैव आनंद में रहते हैं। श्रवण से कष्ट और पाप मिट जाते हैं। ||8||`,
        meaning_pa: `ਇਹ ਨਾਮ ਹਿਰਦੇ ਵਿਚ ਟਿਕਣ ਦੀ ਹੀ ਬਰਕਤਿ ਹੈ ਕਿ ਵਾਹਿਗੁਰੂ ਦੀ ਸਿਫ਼ਤ-ਸਾਲਾਹ ਸੁਣਨ ਨਾਲ (ਸਾਧਾਰਨ ਮਨੁੱਖ) ਸਿੱਧਾਂ, ਪੀਰਾਂ, ਦੇਵਤਿਆਂ ਤੇ ਨਾਥਾਂ ਦੀ ਪਦਵੀ ਪਾ ਲੈਂਦੇ ਹਨ ਤੇ ਵਾਹਿਗੁਰੂ ਦੀ ਸਿਫ਼ਤ-ਸਾਲਾਹ ਸੁਣਨ ਨਾਲ ਉਹਨਾਂ ਨੂੰ ਇਹ ਸੋਝੀ ਹੋ ਜਾਂਦੀ ਹੈ ਕਿ ਧਰਤੀ ਆਕਾਸ਼ ਦਾ ਆਸਰਾ ਉਹ ਪ੍ਰਭੂ ਹੈ, ਵਾਹਿਗੁਰੂ ਦੀ ਸਿਫ਼ਤ-ਸਾਲਾਹ ਸੁਣਨ ਨਾਲ ਸੋਝੀ ਪੈਂਦੀ ਹੈ ਕਿ ਵਾਹਿਗੁਰੂ ਜੋ ਸਾਰੇ ਦੀਪਾਂ, ਲੋਕਾਂ, ਪਾਤਾਲਾਂ ਵਿਚ ਵਿਆਪਕ ਹੈ (ਵਾਹਿਗੁਰੂ ਦੀ ਸਿਫ਼ਤ-ਸਾਲਾਹ ਸੁਣਨ ਵਾਲੇ ਮਨੁੱਖ ਕਾਲ ਵੀ ਨਹੀਂ ਪੋਂਹਦਾ ਭਾਵ ਉਨ੍ਹਾਂ ਨੂੰ ਮੌਤ ਨਹੀਂ ਡਰਾ ਸਕਦੀ) ਹੇ ਨਾਨਕ! (ਅਕਾਲ ਪੁਰਖ ਦੇ ਨਾਮ ਵਿਚ ਸੁਰਤ ਜੋੜਨ ਵਾਲੇ) ਭਗਤ ਜਨਾਂ ਦੇ ਹਿਰਦੇ ਵਿਚ ਸਦਾ ਖਿੜਾਉ ਬਣਿਆ ਰਹਿੰਦਾ ਹੈ, (ਕਿੳਂਕਿ) ਉਸ ਦੀ ਸਿਫ਼ਤ-ਸਾਲਾਹ ਸੁਣਨ ਕਰ ਕੇ (ਮਨੁੱਖ ਦੇ) ਦੁੱਖਾਂ ਤੇ ਪਾਪਾਂ ਦਾ ਨਾਸ ਹੋ ਜਾਂਦਾ ਹੈ ॥੮॥`
      },
      {
        number: 9,
        sanskrit: `ਸੁਣਿਐ ਈਸਰੁ ਬਰਮਾ ਇੰਦੁ ॥
ਸੁਣਿਐ ਮੁਖਿ ਸਾਲਾਹਣ ਮੰਦੁ ॥
ਸੁਣਿਐ ਜੋਗ ਜੁਗਤਿ ਤਨਿ ਭੇਦ ॥
ਸੁਣਿਐ ਸਾਸਤ ਸਿਮ੍ਰਿਤਿ ਵੇਦ ॥
ਨਾਨਕ ਭਗਤਾ ਸਦਾ ਵਿਗਾਸੁ ॥
ਸੁਣਿਐ ਦੂਖ ਪਾਪ ਕਾ ਨਾਸੁ ॥੯॥`,
        transliteration: `suniai eesar baramaa ind |
suniai mukh saalaahan mand |
suniai jog jugat tan bhed |
suniai saasat simrit ved |
naanak bhagataa sadaa vigaas |
suniai dookh paap kaa naas |9|`,
        meaning: `Listening-Shiva, Brahma and Indra. Listening-even foul-mouthed people praise Him. Listening-the technology of Yoga and the secrets of the body. Listening-the Shaastras, the Simritees and the Vedas. O Nanak, the devotees are forever in bliss. Listening-pain and sin are erased. ||9||`,
        meaning_hi: `श्रवण-शिव, ब्रह्मा और इन्द्र। सुनकर-दुःखयुक्त मनुष्य भी उसकी स्तुति करते हैं। श्रवण-योग की तकनीक और शरीर के रहस्य | श्रवण-शास्त्र, सिमृति और वेद। हे नानक, भक्त सदैव आनंद में रहते हैं। श्रवण से कष्ट और पाप मिट जाते हैं। ||9||`,
        meaning_pa: `ਅਕਾਲ ਪੁਰਖ ਦੇ ਨਾਮ ਵਿਚ ਸੁਰਤ ਜੋੜਨ ਦਾ ਸਦਕਾ ਸਾਧਾਰਨ ਮਨੁੱਖ ਸ਼ਿਵ, ਬ੍ਰਹਮਾ ਤੇ ਇੰਦਰ ਦੀ ਪਦਵੀ 'ਤੇ ਅੱਪੜ ਜਾਂਦਾ ਹੈ, ਮੰਦਾ ਮਨੁੱਖ ਭੀ ਮੂੰਹੋਂ ਰੱਬ ਦੀਆਂ ਸਿਫ਼ਤਾਂ ਕਰਨ ਲੱਗ ਪੈਂਦਾ ਹੈ, (ਸਾਧਾਰਨ ਬੁੱਧ ਵਾਲੇ ਨੂੰ ਭੀ) ਸਰੀਰ ਵਿਚ ਦੀਆਂ ਗੁੱਝੀਆਂ ਗੱਲਾਂ, (ਭਾਵ, ਅੱਖਾਂ, ਕੰਨ, ਜੀਭ ਆਦਿਕ ਇੰਦਰੀਆਂ ਦੇ ਚਾਲਿਆਂ ਤੇ ਵਿਕਾਰ ਆਦਿਕਾਂ ਵੱਲ ਦੌੜ-ਭੱਜ) ਦੇ ਭੇਦ ਦਾ ਪਤਾ ਲੱਗ ਜਾਂਦਾ ਹੈ, ਪ੍ਰਭੂ-ਮੇਲ ਦੀ ਜੁਗਤੀ ਦੀ ਸਮਝ ਪੈ ਜਾਂਦੀ ਹੈ, ਸ਼ਾਸਤ੍ਰਾਂ ਸਿਮ੍ਰਿਤੀਆਂ ਤੇ ਵੇਦਾਂ ਦੀ ਸਮਝ ਪੈ ਜਾਂਦੀ ਹੈ (ਭਾਵ, ਧਾਰਮਿਕ ਪੁਸਤਕਾਂ ਦਾ ਅਸਲ ਉੱਚਾ ਨਿਸ਼ਾਨਾ ਤਦੋਂ ਸਮਝ ਪੈਂਦਾ ਹੈ ਜਦੋਂ ਅਸੀਂ ਨਾਮ ਵਿਚ ਸੁਰਤ ਜੋੜਦੇ ਹਾਂ, ਨਹੀਂ ਤਾਂ ਨਿਰੇ ਲਫ਼ਜ਼ਾਂ ਨੂੰ ਹੀ ਪੜ੍ਹ ਛਡਦੇ ਹਾਂ, ਉਸ ਅਸਲੀ ਜਜ਼ਬੇ ਵਿਚ ਨਹੀਂ ਪਹੁੰਚਦੇ, ਜਿਸ ਜਜ਼ਬੇ ਵਿਚ ਅਪੜ ਕੇ ਉਹ ਧਾਰਮਿਕ ਪੁਸਤਕਾਂ ਉਚਾਰੀਆਂ ਹੁੰਦੀਆਂ ਹਨ) ਹੇ ਨਾਨਕ! (ਨਾਮ ਨਾਲ ਪ੍ਰੀਤ ਕਰਨ ਵਾਲੇ) ਭਗਤ ਜਨਾਂ ਦੇ ਹਿਰਦੇ ਵਿਚ ਸਦਾ ਖਿੜਾਉ ਬਣਿਆ ਰਹਿੰਦਾ ਹੈ; (ਕਿਉਂਕਿ) ਰੱਬ ਦੀ ਸਿਫ਼ਤਿ ਸਾਲਾਹ ਸੁਣਨ ਕਰਕੇ (ਮਨੁੱਖ ਦੇ) ਦੁਖਾਂ ਤੇ ਪਾਪਾਂ ਦਾ ਨਾਸ਼ ਹੋ ਜਾਂਦਾ ਹੈ ॥੯॥`
      },
      {
        number: 10,
        sanskrit: `ਸੁਣਿਐ ਸਤੁ ਸੰਤੋਖੁ ਗਿਆਨੁ ॥
ਸੁਣਿਐ ਅਠਸਠਿ ਕਾ ਇਸਨਾਨੁ ॥
ਸੁਣਿਐ ਪੜਿ ਪੜਿ ਪਾਵਹਿ ਮਾਨੁ ॥
ਸੁਣਿਐ ਲਾਗੈ ਸਹਜਿ ਧਿਆਨੁ ॥
ਨਾਨਕ ਭਗਤਾ ਸਦਾ ਵਿਗਾਸੁ ॥
ਸੁਣਿਐ ਦੂਖ ਪਾਪ ਕਾ ਨਾਸੁ ॥੧੦॥`,
        transliteration: `suniai sat santokh giaan |
suniai atthasatth kaa isanaan |
suniai parr parr paaveh maan |
suniai laagai sehaj dhiaan |
naanak bhagataa sadaa vigaas |
suniai dookh paap kaa naas |10|`,
        meaning: `Listening-truth, contentment and spiritual wisdom. Listening-take your cleansing bath at the sixty-eight places of pilgrimage. Listening-reading and reciting, honor is obtained. Listening-intuitively grasp the essence of meditation. O Nanak, the devotees are forever in bliss. Listening-pain and sin are erased. ||10||`,
        meaning_hi: `श्रवण-सत्य, संतोष और आध्यात्मिक ज्ञान। सुनो-अड़सठ तीर्थों पर शुद्धि स्नान करो। सुनने-पढ़ने और सुनाने से मान-सम्मान की प्राप्ति होती है। श्रवण-सहज रूप से ध्यान के सार को समझें। हे नानक, भक्त सदैव आनंद में रहते हैं। श्रवण से कष्ट और पाप मिट जाते हैं। ||10||`,
        meaning_pa: `ਰੱਬ ਦੇ ਨਾਮ ਵਿਚ ਜੁੜਨ ਨਾਲ (ਹਿਰਦੇ ਵਿਚ) ਦਾਨ (ਦੇਣ ਦਾ ਸੁਭਾਉ), ਸੰਤੋਖ ਤੇ ਪ੍ਰਕਾਸ਼ ਪਰਗਟ ਹੋ ਜਾਂਦਾ ਹੈ, ਮਾਨੋ, ਅਠਾਹਠ ਤੀਰਥਾਂ ਦਾ ਇਸ਼ਨਾਨ (ਹੀ) ਹੋ ਜਾਂਦਾ ਹੈ (ਭਾਵ, ਅਠਾਰਠ ਤੀਰਥਾਂ ਦੇ ਇਸ਼ਨਾਨ ਨਾਮ ਜਪਣ ਦੇ ਵਿਚ ਹੀ ਆ ਜਾਂਦੇ ਹਨ)। ਜੋ ਸਤਕਾਰ (ਮਨੁੱਖ ਵਿੱਦਿਆ) ਪੜ੍ਹ ਕੇ ਪਾਂਦੇ ਹਨ, ਉਹ ਭਗਤ ਜਨਾਂ ਨੂੰ ਅਕਾਲ ਪੁਰਖ ਦੇ ਨਾਮ ਵਿਚ ਜੁੜ ਕੇ ਹੀ ਮਿਲ ਜਾਂਦਾ ਹੈ। ਨਾਮ ਸੁਣਨ ਦਾ ਸਦਕਾ ਅਡੋਲਤਾ ਵਿਚ ਚਿੱਤ ਦੀ ਬ੍ਰਿਤੀ ਟਿਕ ਜਾਂਦੀ ਹੈ। ਹੇ ਨਾਨਕ! (ਅਕਾਲ ਪੁਰਖ ਦੇ ਨਾਮ ਵਿਚ ਸੁਰਤ ਜੋੜਨ ਵਾਲੇ) ਭਗਤ ਜਨਾਂ ਦੇ ਹਿਰਦੇ ਵਿਚ ਸਦਾ ਖਿੜਾਉ ਬਣਿਆ ਰਹਿੰਦਾ ਹੈ, (ਕਿਉਂਕਿ) ਅਕਾਲ ਪੁਰਖ ਦੀ ਸਿਫ਼ਤ-ਸਾਲਾਹ ਸੁਣਨ ਨਾਲ (ਮਨੁੱਖ ਦੇ) ਦੱਖਾਂ ਤੇ ਪਾਪਾਂ ਦਾ ਨਾਸ ਹੋ ਜਾਂਦਾ ਹੈ ॥੧੦॥`
      },
      {
        number: 11,
        sanskrit: `ਸੁਣਿਐ ਸਰਾ ਗੁਣਾ ਕੇ ਗਾਹ ॥
ਸੁਣਿਐ ਸੇਖ ਪੀਰ ਪਾਤਿਸਾਹ ॥
ਸੁਣਿਐ ਅੰਧੇ ਪਾਵਹਿ ਰਾਹੁ ॥
ਸੁਣਿਐ ਹਾਥ ਹੋਵੈ ਅਸਗਾਹੁ ॥
ਨਾਨਕ ਭਗਤਾ ਸਦਾ ਵਿਗਾਸੁ ॥
ਸੁਣਿਐ ਦੂਖ ਪਾਪ ਕਾ ਨਾਸੁ ॥੧੧॥`,
        transliteration: `suniai saraa gunaa ke gaah |
suniai sekh peer paatisaah |
suniai andhe paaveh raahu |
suniai haath hovai asagaahu |
naanak bhagataa sadaa vigaas |
suniai dookh paap kaa naas |11|`,
        meaning: `Listening-dive deep into the ocean of virtue. Listening-the Shaykhs, religious scholars, spiritual teachers and emperors. Listening-even the blind find the Path. Listening-the Unreachable comes within your grasp. O Nanak, the devotees are forever in bliss. Listening-pain and sin are erased. ||11||`,
        meaning_hi: `सुनो-पुण्य के सागर में गोता लगाओ। सुनना- शेख, धार्मिक विद्वान, आध्यात्मिक शिक्षक और सम्राट। सुनने वाले-अंधों को भी रास्ता मिल जाता है। सुनते-सुनते अप्राप्य आपकी पकड़ में आ जाता है। हे नानक, भक्त सदैव आनंद में रहते हैं। श्रवण से कष्ट और पाप मिट जाते हैं। ||11||`,
        meaning_pa: `ਅਕਾਲ ਪੁਰਖ ਦੇ ਨਾਮ ਵਿਚ ਸੁਰਤ ਜੋੜਨ ਨਾਲ (ਸਾਧਾਰਨ ਮਨੁੱਖ) ਬੇਅੰਤ ਗੁਣਾਂ ਦੀ ਸੂਝ ਵਾਲੇ ਹੋ ਜਾਂਦੇ ਹਨ, ਅਤੇ ਸ਼ੇਖ ਪੀਰ ਤੇ ਪਾਤਿਸ਼ਾਹਾਂ ਦੀ ਪਦਵੀ ਪਾ ਲੈਂਦੇ ਹਨ। ਇਹ ਨਾਮ ਸੁਣਨ ਦੀ ਹੀ ਬਰਕਤਿ ਹੈ ਕਿ ਅੰਨ੍ਹੇ ਗਿਆਨ-ਹੀਣ ਮਨੁੱਖ ਭੀ (ਅਕਾਲ ਪੁਰਖ ਨੂੰ ਮਿਲਣ ਦਾ) ਰਾਹ ਲੱਭ ਲੈਂਦੇ ਹਨ। ਅਕਾਲ ਪੁਰਖ ਦੇ ਨਾਮ ਵਿਚ ਜੁੜਨ ਦਾ ਸਦਕਾ ਇਸ ਡੂੰਘੇ ਸੰਸਾਰ-ਸਮੁੰਦਰ ਦੀ ਅਸਲੀਅਤ ਸਮਝ ਵਿਚ ਆ ਜਾਂਦੀ ਹੈ। ਹੇ ਨਾਨਕ! (ਅਕਾਲ ਪੁਰਖ ਦੇ ਨਾਮ ਵਿਚ ਸੁਰਤ ਜੋੜਨ ਵਾਲੇ) ਭਗਤ ਜਨਾਂ ਦੇ ਹਿਰਦੇ ਵਿਚ ਸਦਾ ਖਿੜਾਉ ਬਣਿਆ ਰਹਿੰਦਾ ਹੈ, (ਕਿਉਂਕਿ) ਅਕਾਲ ਪੁਰਖ ਦਾ ਨਾਮ ਸੁਣਨ ਨਾਲ (ਮਨੁੱਖ ਦੇ) ਦੁੱਖਾਂ ਤੇ ਪਾਪਾਂ ਦਾ ਨਾਸ ਹੋ ਜਾਂਦਾ ਹੈ ॥੧੧॥`
      },
      {
        number: 12,
        sanskrit: `ਮੰਨੇ ਕੀ ਗਤਿ ਕਹੀ ਨ ਜਾਇ ॥
ਜੇ ਕੋ ਕਹੈ ਪਿਛੈ ਪਛੁਤਾਇ ॥
ਕਾਗਦਿ ਕਲਮ ਨ ਲਿਖਣਹਾਰੁ ॥
ਮੰਨੇ ਕਾ ਬਹਿ ਕਰਨਿ ਵੀਚਾਰੁ ॥
ਐਸਾ ਨਾਮੁ ਨਿਰੰਜਨੁ ਹੋਇ ॥
ਜੇ ਕੋ ਮੰਨਿ ਜਾਣੈ ਮਨਿ ਕੋਇ ॥੧੨॥`,
        transliteration: `mane kee gat kahee na jaae |
je ko kahai pichhai pachhutaae |
kaagad kalam na likhanahaar |
mane kaa beh karan veechaar |
aisaa naam niranjan hoe |
je ko man jaanai man koe |12|`,
        meaning: `The state of the faithful cannot be described. One who tries to describe this shall regret the attempt. No paper, no pen, no scribe can record the state of the faithful. Such is the Name of the Immaculate Lord. Only one who has faith comes to know such a state of mind. ||12||`,
        meaning_hi: `भक्तों की स्थिति का वर्णन नहीं किया जा सकता। जो कोई इसका वर्णन करने का प्रयास करेगा उसे इस प्रयास पर पछतावा होगा। कोई कागज़, कोई कलम, कोई मुंशी वफ़ादारों की स्थिति को दर्ज नहीं कर सकता। ऐसा है बेदाग भगवान का नाम. ऐसी मनःस्थिति को वही जान पाता है, जिसमें विश्वास होता है। ||12||`,
        meaning_pa: `ਉਸ ਮਨੁੱਖ ਦੀ (ਉੱਚੀ) ਆਤਮਕ ਅਵਸਥਾ ਦੱਸੀ ਨਹੀਂ ਜਾ ਸਕਦੀ, ਜਿਸ ਨੇ (ਅਕਾਲ ਪੁਰਖ ਦੇ ਨਾਮ ਨੂੰ) ਮੰਨ ਲਿਆ ਹੈ, (ਭਾਵ, ਜਿਸ ਦੀ ਲਗਨ ਨਾਮ ਵਿਚ ਲੱਗ ਗਈ ਹੈ)। ਜੇ ਕੋਈ ਮਨੁੱਖ ਬਿਆਨ ਕਰੇ ਭੀ, ਤਾਂ ਉਹ ਪਿਛੋਂ ਪਛਤਾਉਂਦਾ ਹੈ (ਕਿ ਮੈਂ ਹੋਛਾ ਜਤਨ ਕੀਤਾ ਹੈ)। (ਨਾਮ ਵਿਚ) ਪਤੀਜੇ ਹੋਏ ਦੀ ਆਤਮਕ ਅਵਸਥਾ ਕਾਗਜ਼ ਉੱਤੇ ਕਲਮ ਨਾਲ ਕੋਈ ਮਨੁੱਖ ਲਿਖਣ ਦੇ ਸਮਰੱਥ ਨਹੀਂ ਹੈ, (ਭਾਵੇਂ ਕਿ ਮਨੁੱਖ) ਰਲ ਕੇ ਉਸ ਦਾ ਅੰਦਾਜ਼ਾ ਲਾਂਦੇ ਲਾਉਣ ਬਾਬਤ ਵੀਚਾਰ (ਜ਼ਰੂਰ) ਕਰਦੇ ਹਨ। ਅਕਾਲ ਪੁਰਖ ਦਾ ਨਾਮ ਬਹੁਤ (ਉੱਚਾ) ਹੈ ਤੇ ਮਾਇਆ ਦੇ ਪਰਭਾਵ ਤੋਂ ਪਰੇ ਹੈ, (ਇਸ ਵਿਚ ਜੁੜਨ ਵਾਲਾ ਭੀ ਉੱਚੀ ਆਤਮਕ ਅਵਸਥਾ ਵਾਲਾ ਹੋ ਜਾਂਦਾ ਹੈ, ਪਰ ਇਹ ਗੱਲ ਤਾਂ ਹੀ ਸਮਝ ਵਿੱਚ ਆਉਂਦੀ ਹੈ) ਜੇ ਕੋਈ ਮਨੁੱਖ ਆਪਣੇ ਅੰਦਰ ਲਗਨ ਲਾ ਕੇ ਵੇਖੇ ॥੧੨॥`
      },
      {
        number: 13,
        sanskrit: `ਮੰਨੈ ਸੁਰਤਿ ਹੋਵੈ ਮਨਿ ਬੁਧਿ ॥
ਮੰਨੈ ਸਗਲ ਭਵਣ ਕੀ ਸੁਧਿ ॥
ਮੰਨੈ ਮੁਹਿ ਚੋਟਾ ਨਾ ਖਾਇ ॥
ਮੰਨੈ ਜਮ ਕੈ ਸਾਥਿ ਨ ਜਾਇ ॥
ਐਸਾ ਨਾਮੁ ਨਿਰੰਜਨੁ ਹੋਇ ॥
ਜੇ ਕੋ ਮੰਨਿ ਜਾਣੈ ਮਨਿ ਕੋਇ ॥੧੩॥`,
        transliteration: `manai surat hovai man budh |
manai sagal bhavan kee sudh |
manai muhi chottaa naa khaae |
manai jam kai saath na jaae |
aisaa naam niranjan hoe |
je ko man jaanai man koe |13|`,
        meaning: `The faithful have intuitive awareness and intelligence. The faithful know about all worlds and realms. The faithful shall never be struck across the face. The faithful do not have to go with the Messenger of Death. Such is the Name of the Immaculate Lord. Only one who has faith comes to know such a state of mind. ||13||`,
        meaning_hi: `आस्थावानों में सहज जागरूकता और बुद्धिमत्ता होती है। वफादार लोग सभी दुनियाओं और लोकों के बारे में जानते हैं। वफ़ादारों के चेहरे पर कभी भी प्रहार नहीं किया जाएगा। वफादारों को मौत के दूत के साथ जाने की ज़रूरत नहीं है। ऐसा है बेदाग भगवान का नाम. ऐसी मनःस्थिति को वही जान पाता है, जिसमें विश्वास होता है। ||13||`,
        meaning_pa: `ਜੇ ਮਨੁੱਖ ਦੇ ਮਨ ਵਿਚ ਪ੍ਰਭੂ ਦੇ ਨਾਮ ਦੀ ਲਗਨ ਲੱਗ ਜਾਏ, ਤਾਂ ਉਸ ਦੀ ਸੁਰਤ ਉੱਚੀ ਹੋ ਜਾਂਦੀ ਹੈ, ਉਸ ਦੇ ਮਨ ਵਿਚ ਜਾਗ੍ਰਤ ਆ ਜਾਂਦੀ ਹੈ, (ਭਾਵ, ਮਾਇਆ ਵਿਚ ਸੁੱਤਾ ਮਨ ਜਾਗ ਪੈਂਦਾ ਹੈ) ਸਾਰੇ ਭਵਨਾਂ ਦੀ ਉਸ ਨੂੰ ਸੋਝੀ ਹੋ ਜਾਂਦੀ ਹੈ (ਕਿ ਹਰ ਥਾਂ ਪ੍ਰਭੂ ਵਿਆਪਕ ਹੈ।) ਉਹ ਮਨੁੱਖ (ਸੰਸਾਰ ਦੇ ਵਿਕਾਰਾਂ ਦੀਆਂ) ਸੱਟਾਂ ਮੂੰਹ ਉੱਤੇ ਨਹੀਂ ਖਾਦਾ (ਭਾਵ, ਸੰਸਾਰਕ ਵਿਕਾਰ ਉਸ ਉੱਤੇ ਦਬਾ ਨਹੀਂ ਪਾ ਸਕਦੇ), ਅਤੇ ਜਮਾਂ ਨਾਲ ਉਸ ਨੂੰ ਵਾਹ ਨਹੀਂ ਪੈਂਦਾ (ਭਾਵ, ਉਹ ਜਨਮ ਮਰਨ ਦੇ ਗੇੜ ਵਿਚੋਂ ਬਚ ਜਾਂਦਾ ਹੈ)। ਅਕਾਲ ਪੁਰਖ ਦਾ ਨਾਮ, ਜੋ ਮਾਇਆ ਦੇ ਪਰਭਾਵ ਤੋਂ ਪਰੇ ਹੈ, ਇੱਡਾ (ਉੱਚਾ) ਹੈ (ਕਿ ਇਸ ਵਿਚ ਜੁੜਨ ਵਾਲਾ ਭੀ ਉੱਚੀ ਆਤਮਕ ਅਵਸਥਾ ਵਾਲਾ ਹੋ ਜਾਂਦਾ ਹੈ, ਪਰ ਇਹ ਗੱਲ ਤਾਂ ਹੀ ਸਮਝ ਵਿਚ ਆਉਂਦੀ ਹੈ), ਜੇ ਕੋਈ ਮਨੁੱਖ ਆਪਣੇ ਮਨ ਵਿਚ ਹਰਿ-ਨਾਮ ਦੀ ਲਗਨ ਪੈਦਾ ਕਰ ਲਏ ॥੧੩॥`
      },
      {
        number: 14,
        sanskrit: `ਮੰਨੈ ਮਾਰਗਿ ਠਾਕ ਨ ਪਾਇ ॥
ਮੰਨੈ ਪਤਿ ਸਿਉ ਪਰਗਟੁ ਜਾਇ ॥
ਮੰਨੈ ਮਗੁ ਨ ਚਲੈ ਪੰਥੁ ॥
ਮੰਨੈ ਧਰਮ ਸੇਤੀ ਸਨਬੰਧੁ ॥
ਐਸਾ ਨਾਮੁ ਨਿਰੰਜਨੁ ਹੋਇ ॥
ਜੇ ਕੋ ਮੰਨਿ ਜਾਣੈ ਮਨਿ ਕੋਇ ॥੧੪॥`,
        transliteration: `manai maarag tthaak na paae |
manai pat siau paragatt jaae |
manai mag na chalai panth |
manai dharam setee sanabandh |
aisaa naam niranjan hoe |
je ko man jaanai man koe |14|`,
        meaning: `The path of the faithful shall never be blocked. The faithful shall depart with honor and fame. The faithful do not follow empty religious rituals. The faithful are firmly bound to the Dharma. Such is the Name of the Immaculate Lord. Only one who has faith comes to know such a state of mind. ||14||`,
        meaning_hi: `आस्थावानों का मार्ग कभी अवरुद्ध नहीं होगा। वफ़ादार सम्मान और प्रसिद्धि के साथ प्रस्थान करेंगे। श्रद्धालु खोखले धार्मिक अनुष्ठानों का पालन नहीं करते हैं। श्रद्धालु धर्म के प्रति दृढ़ता से बंधे हुए हैं। ऐसा है बेदाग भगवान का नाम. ऐसी मनःस्थिति को वही जान पाता है, जिसमें विश्वास होता है। ||14||`,
        meaning_pa: `ਜੇ ਮਨੁੱਖ ਦਾ ਮਨ ਨਾਮ ਵਿਚ ਪਤੀਜ ਜਾਏ ਤਾਂ ਜ਼ਿਦੰਗੀ ਦੇ ਸਫ਼ਰ ਵਿਚ ਵਿਚਾਰ ਆਦਿਕ ਦੀ ਕੋਈ ਰੋਕ ਨਹੀਂ ਪੈਂਦੀ। ਉਹ (ਸੰਸਾਰ ਵਿਚ) ਸ਼ੋਭਾ ਖੱਟ ਕੇ ਇੱਜ਼ਤ ਨਾਲ ਜਾਂਦਾ ਹੈ। ਉਹ ਫਿਰ (ਦੁਨੀਆਂ ਦੇ ਵੱਖੋ-ਵੱਖਰੇ ਮਜ਼ਹਬਾਂ ਦੇ ਦੱਸੇ) ਰਸਤਿਆਂ 'ਤੇ ਨਹੀਂ ਤੁਰਦਾ (ਭਾਵ, ਉਸ ਦੇ ਅੰਦਰ ਇਹ ਵਿਖੇਪਤਾ ਨਹੀਂ ਰਹਿੰਦੀ ਕਿ ਇਹ ਰਸਤਾ ਚੰਗਾ ਹੈ ਤੇ ਇਹ ਮੰਦਾ ਹੈ)। ਉਸ ਮਨੁੱਖ ਦਾ ਧਰਮ ਨਾਲ (ਸਿੱਧਾ) ਜੋੜ ਬਣ ਜਾਂਦਾ ਹੈ। ਅਕਾਲ ਪੁਰਖ ਦਾ ਨਾਮ ਜੋ ਮਾਇਆ ਦੇ ਪ੍ਰਭਾਵ ਤੋਂ ਪਰ੍ਹੇ ਹੈ, ਏਡਾ (ਉੱਚਾ) ਹੈ, (ਕਿ ਇਸ ਵਿਚ ਜੁੜਨ ਵਾਲਾ ਭੀ ਉੱਚੀ ਆਤਮਕ ਅਵਸਥਾ ਵਾਲਾ ਹੋ ਜਾਂਦਾ ਹੈ, ਪਰ ਇਹ ਗੱਲ ਤਾਂ ਹੀ ਸਮਝ ਵਿਚ ਆਉਂਦੀ ਹੈ) ਜੇ ਕੋਈ ਮਨੁੱਖ ਆਪਣੇ ਮਨ ਵਿਚ ਹਰਿ-ਨਾਮ ਦੀ ਲਗਨ ਪੈਦਾ ਕਰ ਲਏ ॥੧੪॥`
      },
      {
        number: 15,
        sanskrit: `ਮੰਨੈ ਪਾਵਹਿ ਮੋਖੁ ਦੁਆਰੁ ॥
ਮੰਨੈ ਪਰਵਾਰੈ ਸਾਧਾਰੁ ॥
ਮੰਨੈ ਤਰੈ ਤਾਰੇ ਗੁਰੁ ਸਿਖ ॥
ਮੰਨੈ ਨਾਨਕ ਭਵਹਿ ਨ ਭਿਖ ॥
ਐਸਾ ਨਾਮੁ ਨਿਰੰਜਨੁ ਹੋਇ ॥
ਜੇ ਕੋ ਮੰਨਿ ਜਾਣੈ ਮਨਿ ਕੋਇ ॥੧੫॥`,
        transliteration: `manai paaveh mokh duaar |
manai paravaarai saadhaar |
manai tarai taare gur sikh |
manai naanak bhaveh na bhikh |
aisaa naam niranjan hoe |
je ko man jaanai man koe |15|`,
        meaning: `The faithful find the Door of Liberation. The faithful uplift and redeem their family and relations. The faithful are saved, and carried across with the Sikhs of the Guru. The faithful, O Nanak, do not wander around begging. Such is the Name of the Immaculate Lord. Only one who has faith comes to know such a state of mind. ||15||`,
        meaning_hi: `आस्थावानों को मुक्ति का द्वार मिल जाता है। वफादार लोग अपने परिवार और रिश्तों का उत्थान और उद्धार करते हैं। वफादारों को बचाया जाता है, और गुरु के सिखों के साथ पार ले जाया जाता है। हे नानक, विश्वासयोग्य लोग भीख माँगते फिरते नहीं। ऐसा है बेदाग भगवान का नाम. ऐसी मनःस्थिति को वही जान पाता है, जिसमें विश्वास होता है। ||15||`,
        meaning_pa: `ਜੇ ਮਨ ਵਿਚ ਪ੍ਰਭੂ ਦੇ ਨਾਮ ਦੀ ਲਗਨ ਲੱਗ ਜਾਏ, ਤਾਂ (ਮਨੁੱਖ) 'ਕੂੜ' ਤੋਂ ਖ਼ਲਾਸੀ ਪਾਣ ਦਾ ਰਾਹ ਲੱਭ ਲੈਂਦੇ ਹਨ। (ਇਹੋ ਜਿਹਾ ਮਨੁੱਖ) ਆਪਣੇ ਪਰਵਾਰ ਨੂੰ ਭੀ (ਅਕਾਲ ਪੁਰਖ ਦੀ) ਟੇਕ ਦ੍ਰਿੜ੍ਹ ਕਰਾਉਂਦਾ ਹੈ। ਨਾਮ ਵਿਚ ਮਨ ਪਤੀਜਣ ਕਰਕੇ ਹੀ, ਸਤਿਗੁਰੂ (ਭੀ ਆਪ ਸੰਸਾਰ-ਸਾਗਰ ਤੋਂ) ਪਾਰ ਲੰਘ ਜਾਂਦਾ ਹੈ ਤੇ ਸਿੱਖਾਂ ਨੂੰ ਪਾਰ ਲੰਘਾਉਂਦਾ ਹੈ। ਨਾਮ ਵਿਚ ਮਨ ਜੁੜਨ ਕਰ ਕੇ, ਹੇ ਨਾਨਕ! ਮਨੁੱਖ ਧਿਰ ਧਿਰ ਦੀ ਮੁਥਾਜੀ ਨਹੀਂ ਕਰਦੇ ਫਿਰਦੇ। ਅਕਾਲ ਪੁਰਖ ਦਾ ਨਾਮ, ਜੋ ਮਾਇਆ ਦੇ ਪਰਭਾਵ ਤੋਂ ਪਰੇ ਹੈ, ਏਡਾ (ਉੱਚਾ) ਹੈ (ਕਿ ਇਸ ਵਿਚ ਜੁੜਨ ਵਾਲਾ ਭੀ ਉੱਚੇ ਜੀਵਨ ਵਾਲਾ ਹੋ ਜਾਂਦਾ ਹੈ, ਪਰ ਇਹ ਗੱਲ ਤਾਂ ਹੀ ਸਮਝ ਵਿਚ ਆਉਂਦੀ ਹੈ), ਜੇ ਕੋਈ ਮਨੁੱਖ ਆਪਣੇ ਮਨ ਵਿਚ ਹਰਿ-ਨਾਮ ਦੀ ਲਗਨ ਪੈਦਾ ਕਰੇ ॥੧੫॥`
      },
      {
        number: 16,
        sanskrit: `ਪੰਚ ਪਰਵਾਣ ਪੰਚ ਪਰਧਾਨੁ ॥
ਪੰਚੇ ਪਾਵਹਿ ਦਰਗਹਿ ਮਾਨੁ ॥
ਪੰਚੇ ਸੋਹਹਿ ਦਰਿ ਰਾਜਾਨੁ ॥
ਪੰਚਾ ਕਾ ਗੁਰੁ ਏਕੁ ਧਿਆਨੁ ॥
ਜੇ ਕੋ ਕਹੈ ਕਰੈ ਵੀਚਾਰੁ ॥
ਕਰਤੇ ਕੈ ਕਰਣੈ ਨਾਹੀ ਸੁਮਾਰੁ ॥
ਧੌਲੁ ਧਰਮੁ ਦਇਆ ਕਾ ਪੂਤੁ ॥
ਸੰਤੋਖੁ ਥਾਪਿ ਰਖਿਆ ਜਿਨਿ ਸੂਤਿ ॥
ਜੇ ਕੋ ਬੁਝੈ ਹੋਵੈ ਸਚਿਆਰੁ ॥
ਧਵਲੈ ਉਪਰਿ ਕੇਤਾ ਭਾਰੁ ॥
ਧਰਤੀ ਹੋਰੁ ਪਰੈ ਹੋਰੁ ਹੋਰੁ ॥
ਤਿਸ ਤੇ ਭਾਰੁ ਤਲੈ ਕਵਣੁ ਜੋਰੁ ॥
ਜੀਅ ਜਾਤਿ ਰੰਗਾ ਕੇ ਨਾਵ ॥
ਸਭਨਾ ਲਿਖਿਆ ਵੁੜੀ ਕਲਾਮ ॥
ਏਹੁ ਲੇਖਾ ਲਿਖਿ ਜਾਣੈ ਕੋਇ ॥
ਲੇਖਾ ਲਿਖਿਆ ਕੇਤਾ ਹੋਇ ॥
ਕੇਤਾ ਤਾਣੁ ਸੁਆਲਿਹੁ ਰੂਪੁ ॥
ਕੇਤੀ ਦਾਤਿ ਜਾਣੈ ਕੌਣੁ ਕੂਤੁ ॥
ਕੀਤਾ ਪਸਾਉ ਏਕੋ ਕਵਾਉ ॥
ਤਿਸ ਤੇ ਹੋਏ ਲਖ ਦਰੀਆਉ ॥
ਕੁਦਰਤਿ ਕਵਣ ਕਹਾ ਵੀਚਾਰੁ ॥
ਵਾਰਿਆ ਨ ਜਾਵਾ ਏਕ ਵਾਰ ॥
ਜੋ ਤੁਧੁ ਭਾਵੈ ਸਾਈ ਭਲੀ ਕਾਰ ॥
ਤੂ ਸਦਾ ਸਲਾਮਤਿ ਨਿਰੰਕਾਰ ॥੧੬॥`,
        transliteration: `panch paravaan panch paradhaan |
panche paaveh darageh maan |
panche soheh dar raajaan |
panchaa kaa gur ek dhiaan |
je ko kahai karai veechaar |
karate kai karanai naahee sumaar |
dhaual dharam deaa kaa poot |
santokh thaap rakhiaa jin soot |
je ko bujhai hovai sachiaar |
dhavalai upar ketaa bhaar |
dharatee hor parai hor hor |
tis te bhaar talai kavan jor |
jeea jaat rangaa ke naav |
sabhanaa likhiaa vurree kalaam |
ehu lekhaa likh jaanai koe |
lekhaa likhiaa ketaa hoe |
ketaa taan suaalihu roop |
ketee daat jaanai kauan koot |
keetaa pasaau eko kavaau |
tis te hoe lakh dareeaau |
kudarat kavan kahaa veechaar |
vaariaa na jaavaa ek vaar |
jo tudh bhaavai saaee bhalee kaar |
too sadaa salaamat nirankaar |16|`,
        meaning: `The chosen ones, the self-elect, are accepted and approved. The chosen ones are honored in the Court of the Lord. The chosen ones look beautiful in the courts of kings. The chosen ones meditate single-mindedly on the Guru. No matter how much anyone tries to explain and describe them, the actions of the Creator cannot be counted. The mythical bull is Dharma, the son of compassion; this is what patiently holds the earth in its place. One who understands this becomes truthful. What a great load there is on the bull! So many worlds beyond this world-so very many! What power holds them, and supports their weight? The names and the colors of the assorted species of beings were all inscribed by the Ever-flowing Pen of God. Who knows how to write this account? Just imagine what a huge scroll it would take! What power! What fascinating beauty! And what gifts! Who can know their extent? You created the vast expanse of the Universe with One Word! Hundreds of thousands of rivers began to flow. How can Your Creative Potency be described? I cannot even once be a sacrifice to You. Whatever pleases You is the only good done, You, Eternal and Formless One! ||16||`,
        meaning_hi: `चुने हुए लोग, स्व-निर्वाचित, स्वीकार किए जाते हैं और स्वीकृत होते हैं। चुने हुए लोगों को प्रभु के दरबार में सम्मानित किया जाता है। चुने हुए लोग राजाओं के दरबार में सुन्दर लगते हैं। चुने हुए लोग एकचित्त होकर गुरु का ध्यान करते हैं। इन्हें कोई कितना भी समझाने और वर्णन करने का प्रयास करे, विधाता के कार्यों की गणना नहीं की जा सकती। पौराणिक बैल धर्म है, करुणा का पुत्र; यही वह चीज़ है जो धैर्यपूर्वक पृथ्वी को उसके स्थान पर रखती है। जो इसे समझ लेता है वह सच्चा हो जाता है। बैल पर कितना भारी बोझ है! इस संसार से परे इतने सारे संसार-इतने सारे संसार! कौन सी शक्ति उन्हें धारण करती है, और उनके वजन को संभालती है? प्राणियों की विभिन्न प्रजातियों के नाम और रंग सभी ईश्वर की सदैव बहने वाली कलम द्वारा अंकित किए गए थे। कौन जानता है कि यह खाता कैसे लिखना है? ज़रा कल्पना करें कि यह कितना बड़ा स्क्रॉल होगा! कैसी शक्ति! क्या मनमोहक सौंदर्य है! और क्या उपहार! उनकी सीमा कौन जान सकता है? आपने एक शब्द से ब्रह्मांड का विशाल विस्तार बनाया! सैकड़ों-हजारों नदियाँ बहने लगीं। आपकी रचनात्मक क्षमता का वर्णन कैसे किया जा सकता है? मैं एक बार भी आपके लिए बलिदान नहीं हो सकता। जो कुछ भी आपको प्रसन्न करता है, वही एकमात्र अच्छा कार्य है, आप, शाश्वत और निराकार! ||16||`,
        meaning_pa: `ਜਿਨ੍ਹਾਂ ਮਨੁੱਖਾਂ ਦੀ ਸੁਰਤ ਨਾਮ ਵਿਚ ਜੁੜੀ ਰਹਿੰਦੀ ਹੈ ਤੇ ਜਿਨ੍ਹਾਂ ਦੇ ਅੰਦਰ ਪ੍ਰਭੂ ਵਾਸਤੇ ਲਗਨ ਬਣ ਜਾਂਦੀ ਹੈ ਉਹੀ ਮਨੁੱਖ (ਇੱਥੇ ਜਗਤ ਵਿਚ) ਮੰਨੇ-ਪ੍ਰਮੰਨੇ ਰਹਿੰਦੇ ਹਨ ਅਤੇ ਸਭ ਦੇ ਆਗੂ ਹੁੰਦੇ ਹਨ। ਅਕਾਲ ਪੁਰਖ ਦੀ ਦਰਗਾਹ ਵਿਚ ਭੀ ਉਹ ਪੰਚ ਜਨ ਹੀ ਆਦਰ ਪਾਂਦੇ ਹਨ। ਰਾਜ-ਦਰਬਾਰਾਂ ਵਿਚ ਭੀ ਉਹ ਪਂਚ ਜਨ ਹੀ ਸੋਭਦੇ ਹਨ। ਇਹਨਾਂ ਪੰਚ ਜਨਾਂ ਦੀ ਸੁਰਤ ਦਾ ਨਿਸ਼ਾਨਾ ਕੇਵਲ ਇਕ ਗੁਰੂ ਹੀ ਹੈ (ਭਾਵ, ਇਹਨਾਂ ਦੀ ਸੁਰਤ ਗੁਰ-ਸ਼ਬਦ ਵਿਚ ਹੀ ਰਹਿਂਦੀ ਹੈ, ਗੁਰ-ਸ਼ਬਦ ਵਿਚ ਜੁੜੇ ਰਹਿੰਦਾ ਹੀ ਇਹਨਾਂ ਦਾ ਅਸਲ ਨਿਸ਼ਾਨਾ ਹੈ)। ਭਾਵੇਂ ਕੋਈ ਕਥਨ ਕਰ ਵੇਖੇ ਤੇ ਵਿਚਾਰ ਕਰ ਲਏ, ਅਕਾਲ-ਪੁਰਖ ਦੀ ਕੁਦਰਤਿ ਦਾ ਕੋਈ ਲੇਖਾ ਹੀ ਨਹੀਂ (ਭਾਵ, ਅੰਤ ਨਹੀਂ ਪੈ ਸਕਦਾ) ਪਰ (ਗੁਰ-ਸ਼ਬਦ ਵਿਚ ਜੁੜੇ ਰਹਿਣ ਦਾ ਇਹ ਸਿੱਟਾ ਨਹੀਂ ਨਿਕਲ ਸਕਦਾ ਕਿ ਕੋਈ ਮਨੁੱਖ ਪ੍ਰਭੂ ਦੀ ਰਚੀ ਸਿਸ਼੍ਰਟੀ ਦਾ ਅੰਤ ਪਾ ਸਕੇ। ਪਰਮਾਤਮਾ ਤੇ ਉਸ ਦੀ ਕੁਦਰਤਿ ਦਾ ਅੰਤ ਲੱਭਣਾ ਮਨੁੱਖ ਦੀ ਜ਼ਿੰਦਗੀ ਦਾ ਮਨੋਰਥ ਹੋ ਹੀ ਨਹੀਂ ਸਕਦਾ) (ਅਕਾਲ ਪੁਰਖ ਦਾ) ਧਰਮ-ਰੂਪੀ ਬੱਝਵਾਂ ਨਿਯਮ ਹੀ ਬਲਦ ਹੈ (ਜੋ ਸ੍ਰਿਸ਼ਟੀ ਨੂੰ ਕਾਇਮ ਰੱਖ ਰਿਹਾ ਹੈ)। (ਇਹ ਧਰਮ) ਦਇਆ ਦਾ ਪੁੱਤਰ ਹੈ (ਭਾਵ, ਅਕਾਲ ਪੁਰਖ ਨੇ ਆਪਣੀ ਮਿਹਰ ਕਰ ਕੇ ਸ੍ਰਿਸ਼ਟੀ ਨੂੰ ਟਿਕਾ ਰੱਖਣ ਲਈ 'ਧਰਮ' ਰੂਪ ਨਿਯਮ ਬਣਾ ਦਿੱਤਾ ਹੈ)। ਇਸ ਧਰਮ ਨੇ ਆਪਣੀ ਮਰਯਾਦਾ ਅਨੁਸਾਰ ਸੰਤੋਖੁ ਨੂੰ ਜਨਮ ਦੇ ਦਿੱਤਾ ਹੈ। ਜੇ ਕੋਈ ਮਨੁੱਖ (ਇਸ ਉਪਰ-ਦੱਸੀ ਵਿਚਾਰ ਨੂੰ) ਸਮਝ ਲਏ, ਤਾਂ ਉਹ ਇਸ ਯੋਗ ਹੋ ਜਾਂਦਾ ਹੈ ਕਿ ਉਸ ਦੇ ਅੰਦਰ ਅਕਾਲ ਪੁਰਖ ਦਾ ਪਰਕਾਸ਼ ਹੋ ਜਾਏ। (ਨਹੀਂ ਤਾਂ, ਖ਼ਿਆਲ ਤਾਂ ਕਰੋ ਕਿ) ਬਲਦ ਉੱਤੇ ਧਰਤੀ ਦਾ ਕਿਤਨਾ ਕੁ ਬੇਅੰਤ ਭਾਰ ਹੈ (ਉਹ ਵਿਚਾਰਾ ਇਤਨੇ ਭਾਰ ਨੂੰ ਚੁੱਕ ਕਿਵੇਂ ਸਕਦਾ ਹੈ?) (ਦੂਜੀ ਵਿਚਾਰ ਹੋਰ ਹੈ ਕਿ ਜੇ ਧਰਤੀ ਦੇ ਹੇਠ ਬਲਦ ਹੈ, ਉਸ ਬਲਦ ਨੂੰ ਸਹਾਰਾ ਦੇਣ ਲਈ ਹੇਠ ਹੋਰ ਧਰਤੀ ਹੋਈ, ਉਸ) ਧਰਤੀ ਦੇ ਹੇਠਾਂ ਹੋਰ ਬਲਦ, ਉਸ ਤੋਂ ਹੇਠਾਂ (ਧਰਤੀ ਦੇ ਹੇਠ) ਹੋਰ ਬਲਦ, ਫੇਰ ਹੋਰ ਬਲਦ; (ਇਸੇ ਤਰ੍ਹਾਂ ਅਖ਼ੀਰਲੇ) ਬਲਦ ਤੋਂ ਭਾਰ (ਸਹਾਰਨ ਲਈ ਉਸ ਦੇ) ਹੇਠ ਕਿਹੜਾ ਆਸਰਾ ਹੋਵੇਗਾ? (ਸ੍ਰਿਸ਼ਟੀ ਵਿਚ) ਕਈ ਜ਼ਾਤਾਂ ਦੇ, ਕਈ ਕਿਸਮਾਂ ਦੇ ਅਤੇ ਕਈ ਨਾਵਾਂ ਦੇ ਜੀਵ ਹਨ। ਇਹਨਾਂ ਸਭਨਾਂ ਨੇ ਇਕ-ਤਾਰ ਚਲਦੀ ਕਲਮ ਨਾਲ (ਅਕਾਲ ਪੁਰਖ ਦੀ ਕੁਦਰਤ ਦਾ) ਲੇਖਾ ਲਿਖਿਆ ਹੈ। (ਪਰ) ਕੋਈ ਵਿਰਲਾ ਮਨੁੱਖ ਇਹ ਲੇਖਾ ਲਿਖਣਾ ਜਾਣਦਾ ਹੈ (ਭਾਵ, ਪਰਮਾਤਮਾ ਦੀ ਕੁਦਰਤ ਦਾ ਅੰਤ ਕੋਈ ਭੀ ਜੀਵ ਪਾ ਨਹੀਂ ਸਕਦਾ। (ਜੇ) ਲੇਖਾ ਲਿਖਿਆ (ਭੀ ਜਾਏ ਤਾਂ ਇਹ ਅੰਦਾਜ਼ਾ ਨਹੀਂ ਲੱਗ ਸਕਦਾ ਕਿ ਲੇਖਾ) ਕੇਡਾ ਵੱਡਾ ਹੋ ਜਾਏ। ਅਕਾਲ ਪੁਰਖ ਦਾ ਬੇਅੰਤ ਬਲ ਹੈ, ਬੇਅੰਤ ਸੁੰਦਰ ਰੂਪ ਹੈ, ਬੇਅੰਤ ਉਸ ਦੀ ਦਾਤ ਹੈ। ਇਸ ਦਾ ਕੌਣ ਅੰਦਾਜ਼ਾ ਲਾ ਸਕਦਾ ਹੈ? (ਅਕਾਲ ਪੁਰਖ ਨੇ) ਆਪਣੇ ਹੁਕਮ ਨਾਲ ਸਾਰਾ ਸੰਸਾਰ ਬਣਾ ਦਿੱਤਾ, ਉਸ ਹੁਕਮ ਨਾਲ (ਹੀ ਜ਼ਿੰਦਗੀ ਦੇ) ਲੱਖਾਂ ਦਰੀਆ ਬਣ ਗਏ। (ਸੋ) ਮੇਰੀ ਕੀਹ ਤਾਕਤ ਹੈ ਕਿ (ਕਰਤਾਰ ਦੀ ਕੁਦਰਤਿ ਦੀ) ਵਿਚਾਰ ਕਰ ਸਕਾਂ? (ਹੇ ਅਕਾਲ ਪੁਰਖ!) ਮੈਂ ਤਾਂ ਤੇਰੇ ਉੱਤੋਂ ਇਕ ਵਾਰੀ ਭੀ ਸਦਕੇ ਹੋਣ ਜੋਗਾ ਨਹੀਂ ਹਾਂ (ਭਾਵ, ਮੇਰੀ ਹਸਤੀ ਬਹੁਤ ਹੀ ਤੁੱਛ ਹੈ।) ਜੋ ਤੈਨੂੰ ਚੰਗਾ ਲੱਗਦਾ ਹੈ, ਉਹ ਕੰਮ ਭਲਾ ਹੈ (ਭਾਵ, ਤੇਰੀ ਰਜ਼ਾ ਵਿਚ ਰਹਿਣਾ ਹੀ ਠੀਕ ਹੈ)। ਹੇ ਨਿਰੰਕਾਰ! ਤੂੰ ਸਦਾ ਅਟੱਲ ਰਹਿਣ ਵਾਲਾ ਹੈਂ ॥੧੬॥`
      },
      {
        number: 17,
        sanskrit: `ਅਸੰਖ ਜਪ ਅਸੰਖ ਭਾਉ ॥
ਅਸੰਖ ਪੂਜਾ ਅਸੰਖ ਤਪ ਤਾਉ ॥
ਅਸੰਖ ਗਰੰਥ ਮੁਖਿ ਵੇਦ ਪਾਠ ॥
ਅਸੰਖ ਜੋਗ ਮਨਿ ਰਹਹਿ ਉਦਾਸ ॥
ਅਸੰਖ ਭਗਤ ਗੁਣ ਗਿਆਨ ਵੀਚਾਰ ॥
ਅਸੰਖ ਸਤੀ ਅਸੰਖ ਦਾਤਾਰ ॥
ਅਸੰਖ ਸੂਰ ਮੁਹ ਭਖ ਸਾਰ ॥
ਅਸੰਖ ਮੋਨਿ ਲਿਵ ਲਾਇ ਤਾਰ ॥
ਕੁਦਰਤਿ ਕਵਣ ਕਹਾ ਵੀਚਾਰੁ ॥
ਵਾਰਿਆ ਨ ਜਾਵਾ ਏਕ ਵਾਰ ॥
ਜੋ ਤੁਧੁ ਭਾਵੈ ਸਾਈ ਭਲੀ ਕਾਰ ॥
ਤੂ ਸਦਾ ਸਲਾਮਤਿ ਨਿਰੰਕਾਰ ॥੧੭॥`,
        transliteration: `asankh jap asankh bhaau |
asankh poojaa asankh tap taau |
asankh garanth mukh ved paatth |
asankh jog man raheh udaas |
asankh bhagat gun giaan veechaar |
asankh satee asankh daataar |
asankh soor muh bhakh saar |
asankh mon liv laae taar |
kudarat kavan kahaa veechaar |
vaariaa na jaavaa ek vaar |
jo tudh bhaavai saaee bhalee kaar |
too sadaa salaamat nirankaar |17|`,
        meaning: `Countless meditations, countless loves. Countless worship services, countless austere disciplines. Countless scriptures, and ritual recitations of the Vedas. Countless Yogis, whose minds remain detached from the world. Countless devotees contemplate the Wisdom and Virtues of the Lord. Countless the holy, countless the givers. Countless heroic spiritual warriors, who bear the brunt of the attack in battle (who with their mouths eat steel). Countless silent sages, vibrating the String of His Love. How can Your Creative Potency be described? I cannot even once be a sacrifice to You. Whatever pleases You is the only good done, You, Eternal and Formless One. ||17||`,
        meaning_hi: `अनगिनत ध्यान, अनगिनत प्रेम। अनगिनत पूजा सेवाएँ, अनगिनत कठोर अनुशासन। अनगिनत ग्रंथ, और वेदों का अनुष्ठान पाठ। असंख्य योगी, जिनका मन संसार से विरक्त रहता है। अनगिनत भक्त भगवान की बुद्धि और गुणों पर चिंतन करते हैं। अनगिनत पवित्र, अनगिनत दाता। अनगिनत वीर आध्यात्मिक योद्धा, जो युद्ध में हमले का खामियाजा भुगतते हैं (जो अपने मुंह से स्टील खाते हैं)। अनगिनत मूक संत, उसके प्रेम की डोर को कंपित करते हुए। आपकी रचनात्मक क्षमता का वर्णन कैसे किया जा सकता है? मैं एक बार भी आपके लिए बलिदान नहीं हो सकता। जो कुछ भी आपको प्रसन्न करता है, वही एकमात्र अच्छा काम है, आप, शाश्वत और निराकार। ||17||`,
        meaning_pa: `(ਅਕਾਲ ਪੁਰਖ ਦੀ ਰਚਨਾ ਵਿਚ) ਅਨਗਿਣਤ ਜੀਵ ਜਪ ਕਰਦੇ ਹਨ, ਬੇਅੰਤ ਜੀਵ (ਹੋਰਨਾਂ ਨਾਲ) ਪਿਆਰ (ਦਾ ਵਰਤਾਉ) ਕਰ ਰਹੇ ਹਨ। ਕਈ ਜੀਵ ਪੂਜਾ ਕਰ ਰਹੇ ਹਨ ਅਤੇ ਅਨਗਿਣਤ ਹੀ ਜੀਵ ਤਪ ਸਾਧ ਰਹੇ ਹਨ। ਬੇਅੰਤ ਜੀਵ ਵੇਦਾਂ ਅਤੇ ਹੋਰ ਧਾਰਮਿਕ ਪੁਸਤਕਾਂ ਦੇ ਪਾਠ ਮੂੰਹ ਨਾਲ ਕਰ ਰਹੇ ਹਨ। ਜੋਗ ਦੇ ਸਾਧਨ ਕਰਨ ਵਾਲੇ ਬੇਅੰਤ ਮਨੁੱਖ ਆਪਣੇ ਮਨ ਵਿਚ (ਮਾਇਆ ਵਲੋਂ) ਉਪਰਾਮ ਰਹਿੰਦੇ ਹਨ। (ਅਕਾਲ ਪੁਰਖ ਦੀ ਕੁਦਰਤਿ ਵਿਚ) ਅਣਗਿਣਤ ਭਗਤ ਹਨ, ਜੋ ਅਕਾਲ ਪੁਰਖ ਦੇ ਗੁਣਾਂ ਅਤੇ ਗਿਆਨ ਦੀ ਵਿਚਾਰ ਕਰ ਰਹੇ ਹਨ, ਅਨੇਕਾਂ ਹੀ ਦਾਨੀ ਤੇ ਦਾਤੇ ਹਨ। (ਅਕਾਲ ਪੁਰਖ ਦੀ ਰਚਨਾ ਵਿਚ) ਬੇਅੰਤ ਸੂਰਮੇ ਹਨ ਜੋ ਆਪਣੇ ਮੂੰਹਾਂ ਉੱਤੇ (ਭਾਵ ਸਨਮੁਖ ਹੋ ਕੇ) ਸ਼ਾਸਤ੍ਰਾਂ ਦੇ ਵਾਰ ਸਹਿੰਦੇ ਹਨ। ਅਨੇਕਾਂ ਮੋਨੀ ਹਨ, ਜੋ ਇਕ-ਰਸ ਬ੍ਰਿਤੀ ਜੋੜ ਕੇ ਬੈਠ ਰਹੇ ਹਨ। ਮੇਰੀ ਕੀਹ ਤਾਕਤ ਹੈ ਕਿ ਕਰਤਾਰ ਦੀ ਕੁਦਰਤਿ ਦੀ ਵਿਚਾਰ ਕਰ ਸਕਾਂ। (ਹੇ ਅਕਾਲ ਪੁਰਖ!) ਮੈਂ ਤਾਂ ਤੇਰੇ ਉੱਤੋਂ ਇਕ ਵਾਰੀ ਭੀ ਸਦਕੇ ਹੋਣ ਜੋਗਾ ਨਹੀਂ ਹਾਂ (ਭਾਵ, ਮੇਰੀ ਹਸਤੀ ਬਹੁਤ ਹੀ ਤੁੱਛ ਹੈ।) ਜੋ ਤੈਨੂੰ ਚੰਗਾ ਲਗਦਾ ਹੈ ਉਹੀ ਕੰਮ ਭਲਾ ਹੈ (ਭਾਵ, ਤੇਰੀ ਰਜ਼ਾ ਵਿਚ ਰਹਿਣਾ ਹੀ ਠੀਕ ਹੈ)। ਹੇ ਨਿਰੰਕਾਰ! ਤੂੰ ਸਦਾ ਅਟੱਲ ਰਹਿਣ ਵਾਲਾ ਹੈਂ ॥੧੭॥`
      },
      {
        number: 18,
        sanskrit: `ਅਸੰਖ ਮੂਰਖ ਅੰਧ ਘੋਰ ॥
ਅਸੰਖ ਚੋਰ ਹਰਾਮਖੋਰ ॥
ਅਸੰਖ ਅਮਰ ਕਰਿ ਜਾਹਿ ਜੋਰ ॥
ਅਸੰਖ ਗਲਵਢ ਹਤਿਆ ਕਮਾਹਿ ॥
ਅਸੰਖ ਪਾਪੀ ਪਾਪੁ ਕਰਿ ਜਾਹਿ ॥
ਅਸੰਖ ਕੂੜਿਆਰ ਕੂੜੇ ਫਿਰਾਹਿ ॥
ਅਸੰਖ ਮਲੇਛ ਮਲੁ ਭਖਿ ਖਾਹਿ ॥
ਅਸੰਖ ਨਿੰਦਕ ਸਿਰਿ ਕਰਹਿ ਭਾਰੁ ॥
ਨਾਨਕੁ ਨੀਚੁ ਕਹੈ ਵੀਚਾਰੁ ॥
ਵਾਰਿਆ ਨ ਜਾਵਾ ਏਕ ਵਾਰ ॥
ਜੋ ਤੁਧੁ ਭਾਵੈ ਸਾਈ ਭਲੀ ਕਾਰ ॥
ਤੂ ਸਦਾ ਸਲਾਮਤਿ ਨਿਰੰਕਾਰ ॥੧੮॥`,
        transliteration: `asankh moorakh andh ghor |
asankh chor haraamakhor |
asankh amar kar jaeh jor |
asankh galavadt hatiaa kamaeh |
asankh paapee paap kar jaeh |
asankh koorriaar koorre firaeh |
asankh malechh mal bhakh khaeh |
asankh nindak sir kareh bhaar |
naanak neech kahai veechaar |
vaariaa na jaavaa ek vaar |
jo tudh bhaavai saaee bhalee kaar |
too sadaa salaamat nirankaar |18|`,
        meaning: `Countless fools, blinded by ignorance. Countless thieves and embezzlers. Countless impose their will by force. Countless cut-throats and ruthless killers. Countless sinners who keep on sinning. Countless liars, wandering lost in their lies. Countless wretches, eating filth as their ration. Countless slanderers, carrying the weight of their stupid mistakes on their heads. Nanak describes the state of the lowly. I cannot even once be a sacrifice to You. Whatever pleases You is the only good done, You, Eternal and Formless One. ||18||`,
        meaning_hi: `अनगिनत मूर्ख, अज्ञान से अंधे। अनगिनत चोर और गबनकर्ता। असंख्य लोग अपनी इच्छा बलपूर्वक थोपते हैं। अनगिनत कातिलों और क्रूर हत्यारे। असंख्य पापी जो पाप करते रहते हैं। अनगिनत झूठे, अपने झूठ में खोए फिर रहे हैं। अनगिनत अभागे, राशन के रूप में गन्दगी खा रहे हैं। अनगिनत निंदक, अपनी मूर्खतापूर्ण गलतियों का बोझ अपने सिर पर लिए हुए। नानक द्वारा नीचों की स्थिति का वर्णन | मैं एक बार भी आपके लिए बलिदान नहीं हो सकता। जो कुछ भी आपको प्रसन्न करता है, वही एकमात्र अच्छा काम है, आप, शाश्वत और निराकार। ||18||`,
        meaning_pa: `(ਨਿਰੰਕਾਰ ਦੀ ਰਚੀ ਹੋਈ ਸ੍ਰਿਸ਼ਟੀ ਵਿਚ) ਅਨੇਕਾਂ ਹੀ ਮਹਾਂ ਮੂਰਖ ਹਨ, ਅਨੇਕਾਂ ਹੀ ਚੋਰ ਹਨ, ਜੋ ਪਰਾਇਆ ਮਾਲ (ਚੁਰਾ ਚੁਰਾ ਕੇ) ਵਰਤ ਰਹੇ ਹਨ ਅਤੇ ਅਨੇਕਾਂ ਹੀ ਇਹੋ ਜਿਹੇ ਮਨੁੱਖ ਹਨ, ਜੋ (ਦੂਜਿਆਂ ਉੱਤੇ) ਹੁਕਮ ਤੇ ਵਧੀਕੀਆਂ ਕਰ ਕਰ ਕੇ (ਅੰਤ ਨੂੰ ਇਸ ਸੰਸਾਰ ਤੋਂ) ਚਲੇ ਜਾਂਦੇ ਹਨ। ਅਨੇਕਾਂ ਹੀ ਖ਼ੂਨੀ ਮਨੁੱਖ ਲੋਕਾਂ ਦੇ ਗਲ ਵੱਢ ਰਹੇ ਹਨ ਅਤੇ ਅਨੇਕਾਂ ਹੀ ਪਾਪੀ ਮਨੁੱਖ ਪਾਪ ਕਮਾ ਕੇ (ਆਖ਼ਰ) ਇਸ ਦੁਨੀਆ ਤੋਂ ਤੁਰ ਜਾਂਦੇ ਹਨ। ਅਨੇਕਾਂ ਹੀ ਝੂਠ ਬੋਲਣ ਦੇ ਸੁਭਾਉ ਵਾਲੇ ਮਨੁੱਖ ਝੂਠ ਵਿਚ ਹੀ ਰੁੱਝੇ ਪਏ ਹਨ ਅਤੇ ਅਨੇਕਾਂ ਹੀ ਖੋਟੀ ਬੁੱਧੀ ਵਾਲੇ ਮਨੁੱਖ ਮਲ (ਭਾਵ, ਅਖਾਜ) ਹੀ ਖਾਈ ਜਾ ਰਹੇ ਹਨ। ਅਨੇਕਾਂ ਹੀ ਨਿਦੰਕ (ਨਿੰਦਾ ਕਰ ਕੇ) ਆਪਣੇ ਸਿਰ ਉੱਤੇ (ਨਿੰਦਿਆ ਦਾ) ਭਾਰ ਚੁੱਕ ਰਹੇ ਹਨ। (ਹੇ ਨਿਰੰਕਾਰ! ਅਨੇਕਾਂ ਹੋਰ ਜੀਵ ਕਈ ਹੋਰ ਕੁਕਰਮਾਂ ਵਿਚ ਫਸੇ ਹੋਣਗੇ, ਮੇਰੀ ਕੀਹ ਤਾਕਤ ਹੈ ਕਿ ਤੇਰੀ ਕੁਦਰਤਿ ਦੀ ਪੂਰਨ ਵਿਚਾਰ ਕਰ ਸਕਾਂ?ਨਾਨਕ ਵਿਚਾਰਾ (ਤਾਂ) ਇਹ (ਉਪਰਲੀ ਤੁੱਛ ਜਿਹੀ) ਵਿਚਾਰ ਪੇਸ਼ ਕਰਦਾ ਹੈ। (ਹੇ ਅਕਾਲ ਪੁਰਖ!) ਮੈਂ ਤਾਂ ਤੇਰੇ ਉੱਤੇਂ ਇਕ ਵਾਰੀ ਭੀ ਸਦਕੇ ਹੋਣ ਜੋਗਾ ਨਹੀਂ ਹਾਂ (ਭਾਵ, ਮੈਂ ਤੇਰੀ ਬੇਅੰਤ ਕੁਦਰਤਿ ਦੀ ਪੂਰਨ ਵਿਚਾਰ ਕਰਨ ਜੋਗਾ ਨਹੀਂ ਹਾਂ)। ਜੋ ਤੈਨੂੰ ਚੰਗਾ ਲੱਗਦਾ ਹੈ, ਉਹੀ ਕੰਮ ਭਲਾ ਹੈ (ਭਾਵ, ਤੇਰੀ ਰਜ਼ਾ ਵਿਚ ਹੀ ਰਹਿਣਾ ਠੀਕ ਹੈ। ਤੇਰੀ ਸਿਫ਼ਤ-ਸਾਲਾਹ ਕਰ ਕੇ ਅਸਾਂ ਜੀਵਾਂ ਲਈ ਇਹੀ ਭਲੀ ਗੱਲ ਹੈ ਕਿ ਤੇਰੀ ਰਜ਼ਾ ਵਿਚ ਰਹੀਏ)। ਹੇ ਨਿਰੰਕਾਰ! ਤੂੰ ਸਦਾ-ਥਿਰ ਰਹਿਣ ਵਾਲਾ ਹੈਂ ॥੧੮॥`
      },
      {
        number: 19,
        sanskrit: `ਅਸੰਖ ਨਾਵ ਅਸੰਖ ਥਾਵ ॥
ਅਗੰਮ ਅਗੰਮ ਅਸੰਖ ਲੋਅ ॥
ਅਸੰਖ ਕਹਹਿ ਸਿਰਿ ਭਾਰੁ ਹੋਇ ॥
ਅਖਰੀ ਨਾਮੁ ਅਖਰੀ ਸਾਲਾਹ ॥
ਅਖਰੀ ਗਿਆਨੁ ਗੀਤ ਗੁਣ ਗਾਹ ॥
ਅਖਰੀ ਲਿਖਣੁ ਬੋਲਣੁ ਬਾਣਿ ॥
ਅਖਰਾ ਸਿਰਿ ਸੰਜੋਗੁ ਵਖਾਣਿ ॥
ਜਿਨਿ ਏਹਿ ਲਿਖੇ ਤਿਸੁ ਸਿਰਿ ਨਾਹਿ ॥
ਜਿਵ ਫੁਰਮਾਏ ਤਿਵ ਤਿਵ ਪਾਹਿ ॥
ਜੇਤਾ ਕੀਤਾ ਤੇਤਾ ਨਾਉ ॥
ਵਿਣੁ ਨਾਵੈ ਨਾਹੀ ਕੋ ਥਾਉ ॥
ਕੁਦਰਤਿ ਕਵਣ ਕਹਾ ਵੀਚਾਰੁ ॥
ਵਾਰਿਆ ਨ ਜਾਵਾ ਏਕ ਵਾਰ ॥
ਜੋ ਤੁਧੁ ਭਾਵੈ ਸਾਈ ਭਲੀ ਕਾਰ ॥
ਤੂ ਸਦਾ ਸਲਾਮਤਿ ਨਿਰੰਕਾਰ ॥੧੯॥`,
        transliteration: `asankh naav asankh thaav |
agam agam asankh loa |
asankh kaheh sir bhaar hoe |
akharee naam akharee saalaah |
akharee giaan geet gun gaah |
akharee likhan bolan baan |
akharaa sir sanjog vakhaan |
jin ehi likhe tis sir naeh |
jiv furamaae tiv tiv paeh |
jetaa keetaa tetaa naau |
vin naavai naahee ko thaau |
kudarat kavan kahaa veechaar |
vaariaa na jaavaa ek vaar |
jo tudh bhaavai saaee bhalee kaar |
too sadaa salaamat nirankaar |19|`,
        meaning: `Countless names, countless places. Inaccessible, unapproachable, countless celestial realms. Even to call them countless is to carry the weight on your head. From the Word, comes the Naam; from the Word, comes Your Praise. From the Word, comes spiritual wisdom, singing the Songs of Your Glory. From the Word, come the written and spoken words and hymns. From the Word, comes destiny, written on one's forehead. But the One who wrote these Words of Destiny-no words are written on His Forehead. As He ordains, so do we receive. The created universe is the manifestation of Your Name. Without Your Name, there is no place at all. How can I describe Your Creative Power? I cannot even once be a sacrifice to You. Whatever pleases You is the only good done, You, Eternal and Formless One. ||19||`,
        meaning_hi: `अनगिनत नाम, अनगिनत जगहें. दुर्गम, अगम्य, अनगिनत दिव्य लोक। उन्हें असंख्य कहना भी अपने सिर पर बोझ ढोना है। शब्द से, नाम आता है; वचन से आपकी स्तुति आती है। वचन से, आध्यात्मिक ज्ञान आता है, आपकी महिमा के गीत गाते हुए। शब्द से, लिखित और बोले गए शब्द और भजन आते हैं। शब्द से भाग्य आता है, जो किसी के माथे पर लिखा होता है। लेकिन जिसने नियति के ये शब्द लिखे-उसके माथे पर कोई शब्द नहीं लिखा है। जैसा वह आदेश देता है, हमें वैसा ही प्राप्त होता है। सृजित ब्रह्मांड आपके नाम की अभिव्यक्ति है। तेरे नाम के बिना, कोई ठिकाना ही नहीं। मैं आपकी रचनात्मक शक्ति का वर्णन कैसे कर सकता हूँ? मैं एक बार भी आपके लिए बलिदान नहीं हो सकता। जो कुछ भी आपको प्रसन्न करता है, वही एकमात्र अच्छा काम है, आप, शाश्वत और निराकार। ||19||`,
        meaning_pa: `(ਕੁਦਰਤਿ ਦੇ ਅਨੇਕ ਜੀਵਾਂ ਤੇ ਹੋਰ ਬੇਅੰਤ ਪਦਾਰਥਾਂ ਦੇ) ਅਸੰਖਾਂ ਹੀ ਨਾਮ ਹਨ ਤੇ ਅਸੰਖਾਂ ਹੀ (ਉਹਨਾਂ ਦੇ) ਥਾਂ ਟਿਕਾਣੇ ਹਨ। (ਕੁਦਰਤਿ ਵਿਚ) ਅਸੰਖਾਂ ਹੀ ਭਵਣ ਹਨ ਜਿਨ੍ਹਾਂ ਤਕ ਮਨੁੱਖ ਦੀ ਪਹੁੰਚ ਹੀ ਨਹੀਂ ਹੋ ਸਕਦੀ। (ਪਰ ਜੋ ਮਨੁੱਖ ਕੁਦਰਤਿ ਦਾ ਲੇਖਾ ਕਰਨ ਵਾਸਤੇ ਸ਼ਬਦ) 'ਅਸੰਖ' (ਭੀ) ਆਖਦੇ ਹਨ, (ਉਹਨਾਂ ਦੇ) ਸਿਰ ਉੱਤੇ ਭੀ ਭਾਰ ਹੁੰਦਾ ਹੈ (ਭਾਵ, ਉਹ ਭੀ ਭੁੱਲ ਕਰਦੇ ਹਨ, 'ਅਸੰਖ' ਸ਼ਬਦ ਭੀ ਕਾਫੀ ਨਹੀਂ ਹੈ)। (ਭਾਵੇਂ ਅਕਾਲ ਪੁਰਖ ਦੀ ਕੁਦਰਤਿ ਦਾ ਲੇਖਾ ਲਫ਼ਜ਼ 'ਅਸੰਖ' ਤਾਂ ਕਿਤੇ ਰਿਹਾ, ਕੋਈ ਭੀ ਸ਼ਬਦ ਕਾਫ਼ੀ ਨਹੀਂ ਹੈ, ਪਰ) ਅਕਾਲ ਪੁਰਖ ਦਾ ਨਾਮ ਭੀ ਅੱਖਰਾਂ ਦੀ ਰਾਹੀਂ ਹੀ (ਲਿਆ ਜਾ ਸਕਦਾ ਹੈ), ਉਸ ਦੀ ਸਿਫ਼ਿਤ-ਸਾਲਾਹ ਭੀ ਅੱਖਰਾਂ ਦੀ ਰਾਹੀਂ ਹੀ ਕੀਤੀ ਜਾ ਸਕਦੀ ਹੈ। ਅਕਾਲ ਪੁਰਖ ਦਾ ਗਿਆਨ ਭੀ ਅੱਖਰਾਂ ਦੀ ਰਾਹੀਂ ਹੀ (ਵਿਚਾਰਿਆ ਜਾ ਸਕਦਾ ਹੈ)। ਅੱਖਰਾਂ ਦੀ ਰਾਹੀਂ ਹੀ ਉਸਦੇ ਗੀਤ ਅਤੇ ਗੁਣਾਂ ਦਾ ਵਾਕਫ਼ ਹੋ ਸਕੀਦਾ ਹੈ। ਬੋਲੀ ਦਾ ਲਿਖਣਾ ਤੇ ਬੋਲਣਾ ਭੀ ਅੱਖਰਾਂ ਦੀ ਰਾਹੀਂ ਹੀ ਦੱਸਿਆ ਜਾ ਸਕਦਾ ਹੈ। (ਇਸ ਕਰਕੇ ਸ਼ਬਦ 'ਅਸੰਖ' ਵਰਤਿਆ ਗਿਆ ਹੈ।) (ਅੱਖਰਾਂ ਰਾਹੀਂ ਹੀ ਭਾਗਾਂ ਦਾ ਸੰਜੋਗ ਵਖਿਆਨ ਕੀਤਾ ਜਾ ਸਕਦਾ ਹੈ) (ਉਂਝ) ਜਿਸ ਅਕਾਲ ਪੁਰਖ ਨੇ (ਜੀਵਾਂ ਦੇ ਸੰਜੋਗ ਦੇ) ਇਹ ਅੱਖਰ ਲਿਖੇ ਹਨ, ਉਸ ਦੇ ਸਿਰ ਉੱਤੇ ਕੋਈ ਲੇਖ ਕਹੀਂ ਹੈ (ਭਾਵ, ਕੋਈ ਮਨੁੱਖ ਉਸ ਅਕਾਲ ਪੁਰਖ ਦਾ ਲੇਖਾ ਨਹੀਂ ਕਰ ਸਕਦਾ)। ਜਿਸ ਜਿਸ ਤਰ੍ਹਾਂ ਉਹ ਅਕਾਲ ਪੁਰਖ ਹੁਕਮ ਕਰਦਾ ਹੈ ਉਸੇ ਤਰ੍ਹਾਂ (ਜੀਵ ਆਪਣੇ ਸੰਜੋਗ) ਭੋਗਦੇ ਹਨ। ਇਹ ਸਾਰਾ ਸੰਸਾਰ, ਜੋ ਅਕਾਲ ਪੁਰਖ ਨੇ ਬਣਾਇਆ ਹੈ, ਇਹ ਉਸ ਦਾ ਸਰੂਪ ਹੈ ('ਇਹੁ ਵਿਸੁ ਸੰਸਾਰੁ ਤੁਮ ਦੇਖਦੇ, ਇਹੁ ਹਰਿ ਕਾ ਰੂਪੁ ਹੈ, ਹਰਿ ਰੂਪੁ ਨਦਰੀ ਆਇਆ')। ਕੋਈ ਥਾਂ ਅਕਾਲ ਪੁਰਖ ਦੇ ਸਰੂਪ ਤੋਂ ਖ਼ਾਲੀ ਨਹੀਂ ਹੈ, (ਭਾਵ, ਜਿਹੜੀ ਥਾਂ ਜਾਂ ਪਦਾਰਥ ਵੇਖੀਏ ਉਹੀ ਅਕਾਲ ਪੁਰਖ ਦਾ ਸਰੂਪ ਦਿੱਸਦਾ ਹੈ, ਸ੍ਰਿਸ਼ਟੀ ਦਾ ਜ਼ੱਰਾ ਜ਼ੱਰਾ ਅਕਾਲ ਪੁਰਖ ਦਾ ਸਰੂਪ ਹੈ)। ਮੇਰੀ ਕੀਹ ਤਾਕਤ ਹੈ ਕਿ ਕਰਤਾਰ ਦੀ ਕੁਦਰਤਿ ਦੀ ਵੀਚਾਰ ਕਰ ਸਕਾਂ? (ਹੇ ਅਕਾਲ ਪੁਰਖ!) ਮੈਂ ਤਾਂ ਤੇਰੇ ਉਤੋਂ ਇਕ ਵਾਰੀ ਭੀ ਸਦਕੇ ਹੋਣ ਜੋਗਾ ਨਹੀਂ ਹਾਂ (ਭਾਵ, ਮੇਰੀ ਹਸਤੀ ਬਹੁਤ ਹੀ ਤੁੱਛ ਹੈ)। ਜੋ ਤੈਨੂੰ ਚੰਗਾ ਲੱਗਦਾ ਹੈ, ਉਹੀ ਕੰਮ ਭਲਾ ਹੈ, (ਭਾਵ, ਤੇਰੀ ਰਜ਼ਾ ਵਿਚ ਰਹਿਣਾ ਹੀ ਅਸਾਂ ਜੀਵਾਂ ਲਈ ਭਲੀ ਗੱਲ ਹੈ)। ਹੇ ਨਿਰੰਕਾਰ! ਤੂੰ ਸਦਾ ਥਿਰ ਰਹਿਣ ਵਾਲਾ ਹੈਂ ॥੧੯॥`
      },
      {
        number: 20,
        sanskrit: `ਭਰੀਐ ਹਥੁ ਪੈਰੁ ਤਨੁ ਦੇਹ ॥
ਪਾਣੀ ਧੋਤੈ ਉਤਰਸੁ ਖੇਹ ॥
ਮੂਤ ਪਲੀਤੀ ਕਪੜੁ ਹੋਇ ॥
ਦੇ ਸਾਬੂਣੁ ਲਈਐ ਓਹੁ ਧੋਇ ॥
ਭਰੀਐ ਮਤਿ ਪਾਪਾ ਕੈ ਸੰਗਿ ॥
ਓਹੁ ਧੋਪੈ ਨਾਵੈ ਕੈ ਰੰਗਿ ॥
ਪੁੰਨੀ ਪਾਪੀ ਆਖਣੁ ਨਾਹਿ ॥
ਕਰਿ ਕਰਿ ਕਰਣਾ ਲਿਖਿ ਲੈ ਜਾਹੁ ॥
ਆਪੇ ਬੀਜਿ ਆਪੇ ਹੀ ਖਾਹੁ ॥
ਨਾਨਕ ਹੁਕਮੀ ਆਵਹੁ ਜਾਹੁ ॥੨੦॥`,
        transliteration: `bhareeai hath pair tan deh |
paanee dhotai utaras kheh |
moot paleetee kaparr hoe |
de saaboon leeai ohu dhoe |
bhareeai mat paapaa kai sang |
ohu dhopai naavai kai rang |
punee paapee aakhan naeh |
kar kar karanaa likh lai jaahu |
aape beej aape hee khaahu |
naanak hukamee aavahu jaahu |20|`,
        meaning: `When the hands and the feet and the body are dirty, water can wash away the dirt. When the clothes are soiled and stained by urine, soap can wash them clean. But when the intellect is stained and polluted by sin, it can only be cleansed by the Love of the Name. Virtue and vice do not come by mere words; actions repeated, over and over again, are engraved on the soul. You shall harvest what you plant. O Nanak, by the Hukam of God's Command, we come and go in reincarnation. ||20||`,
        meaning_hi: `जब हाथ-पैर और शरीर गंदा हो तो पानी गंदगी को धो सकता है। जब कपड़े गंदे हो जाएं और पेशाब से दाग लग जाए तो साबुन से उन्हें साफ किया जा सकता है। लेकिन जब बुद्धि पाप से कलंकित और प्रदूषित हो जाती है, तो इसे केवल नाम के प्रेम से ही साफ किया जा सकता है। सद्गुण और पाप केवल शब्दों से नहीं आते; बार-बार दोहराए गए कार्य आत्मा पर अंकित हो जाते हैं। तुम जो बोओगे वही काटोगे। हे नानक, भगवान की आज्ञा के हुक्म से, हम पुनर्जन्म में आते और जाते हैं। ||20||`,
        meaning_pa: `ਜੇ ਹੱਥ ਜਾਂ ਪੈਰ ਜਾਂ ਸਰੀਰ ਲਿੱਬੜ ਜਾਏ, ਤਾਂ ਪਾਣੀ ਨਾਲ ਧੋਤਿਆਂ ਉਹ ਮੈਲ ਉਤਰ ਜਾਂਦੀ ਹੈ। ਜੇ (ਕੋਈ) ਕੱਪੜਾ ਮੂਤਰ ਨਾਲ ਗੰਦਾ ਹੋ ਜਾਏ, ਤਾਂ ਸਾਬੁਣ ਲਾ ਕੇ ਉਸ ਨੂੰ ਧੋ ਲਈਦਾ ਹੈ। (ਪਰ) ਜੇ (ਮਨੁੱਖ ਦੀ) ਬੁੱਧੀ ਪਾਪਾਂ ਨਾਲ ਮਲੀਨ ਹੋ ਜਾਏ, ਤਾਂ ਉਹ ਪਾਪ ਅਕਾਲ ਪੁਰਖ ਦੇ ਨਾਮ ਵਿਚ ਪਿਆਰ ਕਰਨ ਨਾਲ ਹੀ ਧੋਇਆ ਜਾ ਸਕਦਾ ਹੈ। ਹੇ ਨਾਨਕ! 'ਪੁੰਨੀ' ਜਾਂ 'ਪਾਪ' ਨਿਰਾ ਨਾਮ ਹੀ ਨਹੀਂ ਹੈ (ਭਾਵ, ਨਿਰਾ ਕਹਿਣ-ਮਾਤਰ ਨਹੀਂ ਹੈ, ਸੱਚ-ਮੁੱਚ ਹੀ) ਤੂੰ ਜਿਹੋ ਜਿਹੇ ਕਰਮ ਕਰੇਂਗਾ ਤਿਹੋ ਜਿਹੇ ਸੰਸਕਾਰ ਆਪਣੇ ਅੰਦਰ ਉੱਕਰ ਕੇ ਨਾਲ ਲੈ ਜਾਹਿਂਗਾ। ਜੋ ਕੁਝ ਤੂੰ ਬੀਜੇਂਗਾ, ਉਸ ਦਾ ਫਲ ਆਪ ਹੀ ਖਾਹਿਂਗਾ। (ਆਪਣੇ ਬੀਜੇ ਅਨੁਸਾਰ) ਅਕਾਲ ਪੁਰਖ ਦੇ ਹੁਕਮ ਵਿਚ ਜਨਮ ਮਰਨ ਦੇ ਗੇੜ ਵਿਚ ਪਿਆ ਰਹੇਂਗਾ ॥੨੦॥`
      },
      {
        number: 21,
        sanskrit: `ਤੀਰਥੁ ਤਪੁ ਦਇਆ ਦਤੁ ਦਾਨੁ ॥
ਜੇ ਕੋ ਪਾਵੈ ਤਿਲ ਕਾ ਮਾਨੁ ॥
ਸੁਣਿਆ ਮੰਨਿਆ ਮਨਿ ਕੀਤਾ ਭਾਉ ॥
ਅੰਤਰਗਤਿ ਤੀਰਥਿ ਮਲਿ ਨਾਉ ॥
ਸਭਿ ਗੁਣ ਤੇਰੇ ਮੈ ਨਾਹੀ ਕੋਇ ॥
ਵਿਣੁ ਗੁਣ ਕੀਤੇ ਭਗਤਿ ਨ ਹੋਇ ॥
ਸੁਅਸਤਿ ਆਥਿ ਬਾਣੀ ਬਰਮਾਉ ॥
ਸਤਿ ਸੁਹਾਣੁ ਸਦਾ ਮਨਿ ਚਾਉ ॥
ਕਵਣੁ ਸੁ ਵੇਲਾ ਵਖਤੁ ਕਵਣੁ ਕਵਣ ਥਿਤਿ ਕਵਣੁ ਵਾਰੁ ॥
ਕਵਣਿ ਸਿ ਰੁਤੀ ਮਾਹੁ ਕਵਣੁ ਜਿਤੁ ਹੋਆ ਆਕਾਰੁ ॥
ਵੇਲ ਨ ਪਾਈਆ ਪੰਡਤੀ ਜਿ ਹੋਵੈ ਲੇਖੁ ਪੁਰਾਣੁ ॥
ਵਖਤੁ ਨ ਪਾਇਓ ਕਾਦੀਆ ਜਿ ਲਿਖਨਿ ਲੇਖੁ ਕੁਰਾਣੁ ॥
ਥਿਤਿ ਵਾਰੁ ਨਾ ਜੋਗੀ ਜਾਣੈ ਰੁਤਿ ਮਾਹੁ ਨਾ ਕੋਈ ॥
ਜਾ ਕਰਤਾ ਸਿਰਠੀ ਕਉ ਸਾਜੇ ਆਪੇ ਜਾਣੈ ਸੋਈ ॥
ਕਿਵ ਕਰਿ ਆਖਾ ਕਿਵ ਸਾਲਾਹੀ ਕਿਉ ਵਰਨੀ ਕਿਵ ਜਾਣਾ ॥
ਨਾਨਕ ਆਖਣਿ ਸਭੁ ਕੋ ਆਖੈ ਇਕ ਦੂ ਇਕੁ ਸਿਆਣਾ ॥
ਵਡਾ ਸਾਹਿਬੁ ਵਡੀ ਨਾਈ ਕੀਤਾ ਜਾ ਕਾ ਹੋਵੈ ॥
ਨਾਨਕ ਜੇ ਕੋ ਆਪੌ ਜਾਣੈ ਅਗੈ ਗਇਆ ਨ ਸੋਹੈ ॥੨੧॥`,
        transliteration: `teerath tap deaa dat daan |
je ko paavai til kaa maan |
suniaa maniaa man keetaa bhaau |
antaragat teerath mal naau |
sabh gun tere mai naahee koe |
vin gun keete bhagat na hoe |
suasat aath baanee baramaau |
sat suhaan sadaa man chaau |
kavan su velaa vakhat kavan kavan thit kavan vaar |
kavan si rutee maahu kavan jit hoaa aakaar |
vel na paaeea panddatee ji hovai lekh puraan |
vakhat na paaeo kaadeea ji likhan lekh kuraan |
thit vaar naa jogee jaanai rut maahu naa koee |
jaa karataa siratthee kau saaje aape jaanai soee |
kiv kar aakhaa kiv saalaahee kiau varanee kiv jaanaa |
naanak aakhan sabh ko aakhai ik doo ik siaanaa |
vaddaa saahib vaddee naaee keetaa jaa kaa hovai |
naanak je ko aapau jaanai agai geaa na sohai |21|`,
        meaning: `Pilgrimages, austere discipline, compassion and charity these, by themselves, bring only an iota of merit. Listening and believing with love and humility in your mind, cleanse yourself with the Name, at the sacred shrine deep within. All virtues are Yours, Lord, I have none at all. Without virtue, there is no devotional worship. I bow to the Lord of the World, to His Word, to Brahma the Creator. He is Beautiful, True and Eternally Joyful. What was that time, and what was that moment? What was that day, and what was that date? What was that season, and what was that month, when the Universe was created? The Pandits, the religious scholars, cannot find that time, even if it is written in the Puraanas. That time is not known to the Qazis, who study the Koran. The day and the date are not known to the Yogis, nor is the month or the season. The Creator who created this creation-only He Himself knows. How can we speak of Him? How can we praise Him? How can we describe Him? How can we know Him? O Nanak, everyone speaks of Him, each one wiser than the rest. Great is the Master, Great is His Name. Whatever happens is according to His Will. O Nanak, one who claims to know everything shall not be decorated in the world hereafter. ||21||`,
        meaning_hi: `तीर्थयात्रा, कठोर अनुशासन, करुणा और दान, ये अपने आप में थोड़ा सा ही पुण्य लाते हैं। अपने मन में प्रेम और विनम्रता के साथ सुनकर और विश्वास करके, अपने भीतर के पवित्र मंदिर में, नाम से खुद को शुद्ध करें। सारे गुण आपके हैं प्रभु, मुझमें तो एक भी नहीं। सद्गुण के बिना भक्ति नहीं होती। मैं विश्व के स्वामी को, उनके वचन को, सृष्टिकर्ता ब्रह्मा को प्रणाम करता हूँ। वह सुंदर, सच्चा और शाश्वत रूप से आनंदमय है। वह समय क्या था, और वह क्षण क्या था? वह दिन कौन सा था और वह तारीख कौन सी थी? वह कौन सी ऋतु थी, और वह कौन सा महीना था, जब ब्रह्माण्ड की रचना हुई? पंडित, धार्मिक विद्वान, उस समय को नहीं पा सकते, भले ही यह पुराणों में लिखा हो। उस समय का ज्ञान कुरान का अध्ययन करने वाले काजियों को नहीं है। योगियों को न तो दिन और तारीख का ज्ञान होता है, न माह या ऋतु का। जिस रचयिता ने यह रचना रची, वह ही जानता है। हम उसके बारे में कैसे बात कर सकते हैं? हम उसकी स्तुति कैसे कर सकते हैं? हम उसका वर्णन कैसे कर सकते हैं? हम उसे कैसे जान सकते हैं? हे नानक, हर कोई उसके बारे में बात करता है, हर कोई दूसरों से अधिक बुद्धिमान है। गुरु महान है, उसका नाम महान है। जो कुछ भी होता है वह उसकी इच्छा के अनुसार होता है। हे नानक, जो सब कुछ जानने का दावा करता है, उसे परलोक में शोभा नहीं मिलेगी। ||21||`,
        meaning_pa: `ਤੀਰਥ ਜਾਤ੍ਰਾ, ਤਪਾਂ ਦੀ ਸਾਧਨਾ, (ਜੀਆਂ ਤੇ) ਦਇਆ ਕਰਨੀ, ਦਿੱਤਾ ਹੋਇਆ ਦਾਨ (ਇਹਨਾਂ ਕਰਮਾਂ ਦੇ ਵੱਟੇ); ਜੇ ਕਿਸੇ ਮਨੁੱਖ ਨੂੰ ਕੋਈ ਵਡਿਆਈ ਮਿਲ ਭੀ ਜਾਏ, ਤਾਂ ਰਤਾ-ਮਾਤਰ ਹੀ ਮਿਲਦੀ ਹੈ। (ਪਰ ਜਿਸ ਮਨੁੱਖ ਨੇ ਅਕਾਲ ਪੁਰਖ ਦੇ ਨਾਮ ਵਿਚ) ਸੁਰਤ ਜੋੜੀ ਹੈ, (ਜਿਸ ਦਾ ਮਨ ਨਾਮ ਵਿਚ) ਪਤੀਜ ਗਿਆ ਹੈ. (ਅਤੇ ਜਿਸ ਨੇ ਆਪਣੇ ਮਨ) ਵਿਚ (ਅਕਾਲ ਪੁਰਖ ਦਾ) ਪਿਆਰ ਜਮਾਇਆ ਹੈ, ਉਸ ਮਨੁੱਖ ਨੇ (ਮਾਨੋ) ਆਪਣੇ ਅੰਦਰਲੇ ਤੀਰਥ ਵਿਚ ਮਲ ਮਲ ਕੇ ਇਸ਼ਨਾਨ ਕਰ ਲਿਆ ਹੈ (ਭਾਵ, ਉਸ ਮਨੁੱਖ ਨੇ ਆਪਣੇ ਅੰਦਰ ਵੱਸ ਰਹੇ ਅਕਾਲ ਪੁਰਖ ਵਿਚ ਜੁੜ ਕੇ ਚੰਗੀ ਤਰ੍ਹਾਂ ਆਪਣੇ ਮਨ ਦੀ ਮੈਲ ਲਾਹ ਲਈ ਹੈ)। ਮੇਰੀ ਕੋਈ ਪਾਂਇਆਂ ਨਹੀਂ (ਕਿ ਮੈਂ ਤੇਰੇ ਗੁਣ ਗਾ ਸਕਾਂ), ਇਹ ਸਭ ਤੇਰੀਆਂ ਹੀ ਵਡਿਆਈਆਂ ਹਨ। (ਹੇ ਅਕਾਲ ਪੁਰਖ!) ਜੇ ਤੂੰ (ਆਪ ਆਪਣੇ) ਗੁਣ (ਮੇਰੇ ਵਿਚ) ਪੈਦਾ ਨਾਹ ਕਰੇਂ ਤਾਂ ਮੈਥੋਂ ਤੇਰੀ ਭਗਤੀ ਨਹੀਂ ਹੋ ਸਕਦੀ। (ਹੇ ਨਿਰੰਕਾਰ!) ਤੇਰੀ ਸਦਾ ਜੈ ਹੋਵੇ! ਤੂੰ ਆਪ ਹੀ ਮਾਇਆ ਹੈਂ, ਤੂੰ ਆਪ ਹੀ ਬਾਣੀ ਹੈਂ, ਤੂੰ ਆਪ ਹੀ ਬ੍ਰਹਮਾ ਹੈਂ (ਭਾਵ, ਇਸ ਸ੍ਰਿਸ਼ਟੀ ਨੂੰ ਬਣਾਨ ਵਾਲੇ ਮਾਇਆ, ਬਾਣੀ ਜਾਂ ਬ੍ਰਹਮਾ ਤੈਥੋਂ ਵੱਖਰੀ ਹਸਤੀ ਵਾਲੇ ਨਹੀਂ ਹਨ, ਜੋ ਲੋਕਾਂ ਨੇ ਮੰਨ ਰੱਖੇ ਹਨ।) ਤੂੰ ਸਦਾ-ਥਿਰ ਹੈਂ, ਸੋਹਣਾ ਹੈਂ, ਤੇਰੇ ਮਨ ਵਿਚ ਸਦਾ ਖਿੜਾਉ ਹੈ, (ਤੂੰ ਹੀ ਜਗਤ ਰਚਣ ਵਾਲਾ ਹੈਂ, ਤੈਨੂੰ ਹੀ ਪਤਾ ਹੈ ਤੂੰ ਕਦੋਂ ਬਣਾਇਆ)। ਕਿਹੜਾ ਉਹ ਵੇਲਾ ਤੇ ਵਕਤ ਸੀ, ਕਿਹੜੀ ਥਿਤ ਸੀ, ਕਿਹੜਾ ਦਿਨ ਸੀ, ਕਿਹੜੀਆਂ ਉਹ ਰੁੱਤਾਂ ਸਨ ਅਤੇ ਕਿਹੜਾ ਉਹ ਮਹੀਨਾ ਸੀ, ਜਦੋਂ ਇਹ ਸੰਸਾਰ ਬਣਿਆ ਸੀ? (ਕਦੋਂ ਇਹ ਸੰਸਾਰ ਬਣਿਆ?) ਉਸ ਸਮੇਂ ਦਾ ਪੰਡਤਾਂ ਨੂੰ ਭੀ ਪਤਾ ਨਾਹ ਲੱਗਾ। ਜੇ ਪਤਾ ਹੁੰਦਾ ਤਾਂ (ਇਸ ਮਜ਼ਮੂਨ ਉੱਤੇ ਭੀ) ਇਕ ਪੁਰਾਣ ਲਿਖਿਆ ਹੁੰਦਾ। ਉਸ ਸਮੇਂ ਦੀ ਕਾਜ਼ੀਆਂ ਨੂੰ ਖ਼ਬਰ ਨਾਹ ਲੱਗ ਸਕੀ, ਨਹੀਂ ਤਾਂ ਉਹ ਲੇਖ ਲਿਖ ਦੇਂਦੇ ਜਿਵੇਂ ਉਹਨਾਂ (ਆਇਤਾਂ ਇਕੱਠੀਆਂ ਕਰ ਕੇ) ਕੁਰਾਨ (ਲਿਖਿਆ ਸੀ)। (ਜਦੋਂ ਜਗਤ ਬਣਿਆ ਸੀ ਤਦੋਂ) ਕਿਹੜੀ ਥਿੱਤ ਸੀ, (ਕਿਹੜਾ) ਵਾਰ ਸੀ, ਇਹ ਗੱਲ ਕੋਈ ਜੋਗੀ ਭੀ ਨਹੀਂ ਜਾਣਦਾ। ਕੋਈ ਮਨੁੱਖ ਨਹੀਂ (ਦੱਸ ਨਹੀਂ ਸਕਦਾ) ਕਿ ਤਦੋਂ ਕਿਹੜੀ ਰੁੱਤ ਸੀ ਅਤੇ ਕਿਹੜਾ ਮਹੀਨਾ ਸੀ। ਜੋ ਸਿਰਜਣਹਾਰ ਇਸ ਜਗਤ ਨੂੰ ਪੈਦਾ ਕਰਦਾ ਹੈ, ਉਹ ਆਪ ਹੀ ਜਾਣਦਾ ਹੈ (ਕਿ ਜਗਤ ਕਦੋਂ ਰਚਿਆ)। ਮੈਂ ਕਿਸ ਤਰ੍ਹਾਂ (ਅਕਾਲ ਪੁਰਖ ਦੀ ਵਡਿਆਈ) ਦੱਸਾਂ, ਕਿਸ ਤਰ੍ਹਾਂ ਅਕਾਲ ਪੁਰਖ ਦੀ ਸਿਫਤਿ-ਸਾਲਾਹ ਕਰਾਂ, ਕਿਸ ਤਰ੍ਹਾਂ (ਅਕਾਲ ਪੁਰਖ ਦੀ ਵਡਿਆਈ) ਵਰਣਨ ਕਰਾਂ ਅਤੇ ਕਿਸ ਤਰ੍ਹਾਂ ਸਮਝ ਸਕਾਂ? ਹੇ ਨਾਨਕ! ਹਰੇਕ ਜੀਵ ਆਪਣੇ ਆਪ ਨੂੰ ਦੂਜੇ ਨਾਲੋਂ ਸਿਆਣਾ ਸਮਝ ਕੇ (ਅਕਾਲ ਪੁਰਖ ਦੀ ਵਡਿਆਈ) ਦੱਸਣ ਦਾ ਜਤਨ ਕਰਦਾ ਹੈ, (ਪਰ ਦੱਸ ਨਹੀਂ ਸਕਦਾ)। ਅਕਾਲ ਪੁਰਖ (ਸਭ ਤੋਂ) ਵੱਡਾ ਹੈ, ਉਸ ਦੀ ਵਡਿਆਈ ਉੱਚੀ ਹੈ। ਜੋ ਕੁਝ ਜਗਤ ਵਿਚ ਹੋ ਰਿਹਾ ਹੈ, ਉਸੇ ਦਾ ਕੀਤਾ ਹੋ ਰਿਹਾ ਹੈ। ਹੇ ਨਾਨਕ! ਜੇ ਕੋਈ ਮਨੁੱਖ ਆਪਣੀ ਅਕਲ ਦੇ ਆਸਰੇ (ਪ੍ਰਭੂ ਦੀ ਵਡਿਆਈ ਦਾ ਅੰਤ ਪਾਣ ਦਾ) ਜਤਨ ਕਰੇ, ਉਹ ਅਕਾਲ ਪੁਰਖ ਦੇ ਦਰ 'ਤੇ ਜਾ ਕੇ ਆਦਰ ਨਹੀਂ ਪਾਂਦਾ ॥੨੧॥`
      },
      {
        number: 22,
        sanskrit: `ਪਾਤਾਲਾ ਪਾਤਾਲ ਲਖ ਆਗਾਸਾ ਆਗਾਸ ॥
ਓੜਕ ਓੜਕ ਭਾਲਿ ਥਕੇ ਵੇਦ ਕਹਨਿ ਇਕ ਵਾਤ ॥
ਸਹਸ ਅਠਾਰਹ ਕਹਨਿ ਕਤੇਬਾ ਅਸੁਲੂ ਇਕੁ ਧਾਤੁ ॥
ਲੇਖਾ ਹੋਇ ਤ ਲਿਖੀਐ ਲੇਖੈ ਹੋਇ ਵਿਣਾਸੁ ॥
ਨਾਨਕ ਵਡਾ ਆਖੀਐ ਆਪੇ ਜਾਣੈ ਆਪੁ ॥੨੨॥`,
        transliteration: `paataalaa paataal lakh aagaasaa aagaas |
orrak orrak bhaal thake ved kehan ik vaat |
sehas atthaarah kehan katebaa asuloo ik dhaat |
lekhaa hoe ta likheeai lekhai hoe vinaas |
naanak vaddaa aakheeai aape jaanai aap |22|`,
        meaning: `There are nether worlds beneath nether worlds, and hundreds of thousands of heavenly worlds above. The Vedas say that you can search and search for them all, until you grow weary. The scriptures say that there are 18,000 worlds, but in reality, there is only One Universe. If you try to write an account of this, you will surely finish yourself before you finish writing it. O Nanak, call Him Great! He Himself knows Himself. ||22||`,
        meaning_hi: `पाताल लोक के नीचे पाताल लोक हैं, और ऊपर सैकड़ों-हजारों स्वर्गीय लोक हैं। वेद कहते हैं कि आप उन सभी को खोज सकते हैं और खोज सकते हैं, जब तक कि आप थक न जाएं। धर्मग्रंथ कहते हैं कि 18,000 विश्व हैं, लेकिन वास्तव में, केवल एक ब्रह्मांड है। यदि आप इसका वृत्तांत लिखने का प्रयास करेंगे, तो निश्चित रूप से आप इसे लिखने से पहले ही स्वयं को समाप्त कर लेंगे। हे नानक, उसे महान कहो! वह स्वयं अपने आप को जानता है। ||22||`,
        meaning_pa: `(ਸਾਰੇ ਵੇਦ ਇੱਕ-ਜ਼ਬਾਨ ਹੋ ਕੇ ਆਖਦੇ ਹਨ) "ਪਾਤਾਲਾਂ ਦੇ ਹੇਠ ਹੋਰ ਲੱਖਾਂ ਪਾਤਾਲ ਹਨ ਅਤੇ ਆਕਾਸ਼ਾਂ ਦੇ ਉੱਤੇ ਹੋਰ ਲੱਖਾਂ ਆਕਾਸ਼ ਹਨ, (ਬੇਅੰਤ ਰਿਸ਼ੀ ਮੁਨੀ ਇਹਨਾਂ ਦੇ) ਅਖ਼ੀਰਲੇ ਬੰਨਿਆਂ ਦੀ ਭਾਲ ਕਰਕੇ ਥੱਕ ਗਏ ਹਨ, (ਪਰ ਲੱਭ ਨਹੀਂ ਸਕੇ)।" (ਮੁਸਲਮਾਨ ਤੇ ਈਸਾਈ ਆਦਿਕ ਦੀਆਂ ਚਾਰੇ) ਕਤੇਬਾਂ ਆਖਦੀਆਂ ਹਨ, "ਕੁੱਲ ਅਠਾਰਹ ਹਜ਼ਾਰ ਆਲਮ ਹਨ, ਜਿਨ੍ਹਾਂ ਦਾ ਮੁੱਢ ਇਕ ਅਕਾਲ ਪੁਰਖ ਹੈ।" (ਪਰ ਸੱਚੀ ਗੱਲ ਤਾਂ ਇਹ ਹੈ ਕਿ ਸ਼ਬਦ) 'ਹਜ਼ਾਰਾਂ' ਤੇ 'ਲੱਖਾਂ' ਭੀ ਕੁਦਰਤ ਦੀ ਗਿਣਤੀ ਵਿਚ ਵਰਤੇ ਨਹੀਂ ਜਾ ਸਕਦੇ। ਅਕਾਲ ਪੁਰਖ ਦੀ ਕੁਦਰਤ ਦਾ) ਲੇਖਾ ਤਦੋਂ ਹੀ ਲਿੱਖ ਸਕੀਦਾ ਹੈ, ਜੇ ਲੇਖਾ ਹੋ ਹੀ ਸਕੇ। (ਇਹ ਲੇਖਾ ਤਾਂ ਹੋ ਹੀ ਨਹੀਂ ਸਕਦਾ, ਲੇਖਾ ਕਰਦਿਆਂ ਕਰਦਿਆਂ) ਲੇਖੇ ਦਾ ਹੀ ਖ਼ਾਤਮਾ ਹੋ ਜਾਂਦਾ ਹੈ (ਗਿਣਤੀ ਦੇ ਹਿੰਦਸੇ ਹੀ ਮੁੱਕ ਜਾਂਦੇ ਹਨ)। ਹੇ ਨਾਨਕ! ਜਿਸ ਅਕਾਲ ਪੁਰਖ ਨੂੰ (ਸਾਰੇ ਜਗਤ ਵਿਚ) ਵੱਡਾ ਆਖਿਆ ਜਾ ਰਿਹਾ ਹੈ, ਉਹ ਆਪ ਹੀ ਆਪਣੇ ਆਪ ਨੂੰ ਜਾਣਦਾ ਹੈ। (ਉਹ ਆਪਣੀ ਵਡਿਆਈ ਆਪ ਹੀ ਜਾਣਦਾ ਹੈ ॥੨੨॥`
      },
      {
        number: 23,
        sanskrit: `ਸਾਲਾਹੀ ਸਾਲਾਹਿ ਏਤੀ ਸੁਰਤਿ ਨ ਪਾਈਆ ॥
ਨਦੀਆ ਅਤੈ ਵਾਹ ਪਵਹਿ ਸਮੁੰਦਿ ਨ ਜਾਣੀਅਹਿ ॥
ਸਮੁੰਦ ਸਾਹ ਸੁਲਤਾਨ ਗਿਰਹਾ ਸੇਤੀ ਮਾਲੁ ਧਨੁ ॥
ਕੀੜੀ ਤੁਲਿ ਨ ਹੋਵਨੀ ਜੇ ਤਿਸੁ ਮਨਹੁ ਨ ਵੀਸਰਹਿ ॥੨੩॥`,
        transliteration: `saalaahee saalaeh etee surat na paaeea |
nadeea atai vaah paveh samund na jaaneeeh |
samund saah sulataan girahaa setee maal dhan |
keerree tul na hovanee je tis manahu na veesareh |23|`,
        meaning: `The praisers praise the Lord, but they do not obtain intuitive understanding the streams and rivers flowing into the ocean do not know its vastness. Even kings and emperors, with mountains of property and oceans of wealth -these are not even equal to an ant, who does not forget God. ||23||`,
        meaning_hi: `स्तुति करने वाले भगवान की स्तुति करते हैं, लेकिन उन्हें समुद्र में बहने वाली नदियों और नदियों की सहज समझ नहीं होती है, वे इसकी विशालता को नहीं जानते हैं। यहाँ तक कि राजा-महाराजा भी, जिनके पास सम्पत्ति के पहाड़ और धन का सागर है, एक चींटी के बराबर भी नहीं हैं, जो ईश्वर को नहीं भूलतीं। ||23||`,
        meaning_pa: `ਸਲਾਹੁਣ-ਜੋਗ ਅਕਾਲ ਪੁਰਖ ਦੀਆਂ ਵਡਿਆਈਆਂ ਆਖ ਆਖ ਕੇ ਕਿਸੇ ਮਨੁੱਖ ਨੇ ਇਤਨੀ ਸਮਝ ਨਹੀਂ ਪਾਈ ਕਿ ਅਕਾਲ ਪੁਰਖ ਕੇਡਾ ਵੱਡਾ ਹੈ। (ਸਿਫ਼ਤ-ਸਾਲਾਹ ਕਰਨ ਵਾਲੇ ਮਨੁੱਖ ਉਸ ਅਕਾਲ ਪੁਰਖ ਦੇ ਵਿਚੇ ਹੀ ਲੀਨ ਹੋ ਜਾਂਦੇ ਹਨ)। ਨਦੀਆਂ ਤੇ ਨਾਲੇ ਸਮੁੰਦਰ ਵਿਚ ਪੈਂਦੇ ਹਨ, (ਪਰ ਫਿਰ ਵੱਖਰੇ) ਉਹ ਪਛਾਣੇ ਨਹੀਂ ਜਾ ਸਕਦੇ (ਵਿਚੇ ਹੀ ਲੀਨ ਹੋ ਜਾਂਦੇ ਹਨ, ਤੇ ਸਮੁੰਦਰ ਦੀ ਥਾਹ ਨਹੀਂ ਪਾ ਸਕਦੇ)। ਸਮੁੰਦਰਾਂ ਦੇ ਪਾਤਸ਼ਾਹ ਤੇ ਸੁਲਤਾਨ (ਜਿਨ੍ਹਾਂ ਦੇ ਖ਼ਜ਼ਾਨਿਆਂ ਵਿੱਚ) ਪਹਾੜ ਜੇਡੇ ਧਨ ਪਦਾਰਥਾਂ (ਦੇ ਢੇਰ ਹੋਣ) (ਪ੍ਰਭੂ ਦੀ ਸਿਫ਼ਤ-ਸਾਲਾਹ ਕਰਨ ਵਾਲੇ ਦੀਆਂ ਨਜ਼ਰਾਂ ਵਿਚ) ਇਕ ਕੀੜੀ ਦੇ ਭੀ ਬਰਾਬਰ ਨਹੀਂ ਹੁੰਦੇ, ਜੇ (ਹੇ ਅਕਾਲ ਪੁਰਖ!) ਉਸ ਕੀੜੀ ਦੇ ਮਨ ਵਿਚੋਂ ਤੂੰ ਨਾਹ ਵਿਸਰ ਜਾਏਂ ॥੨੩॥`
      },
      {
        number: 24,
        sanskrit: `ਅੰਤੁ ਨ ਸਿਫਤੀ ਕਹਣਿ ਨ ਅੰਤੁ ॥
ਅੰਤੁ ਨ ਕਰਣੈ ਦੇਣਿ ਨ ਅੰਤੁ ॥
ਅੰਤੁ ਨ ਵੇਖਣਿ ਸੁਣਣਿ ਨ ਅੰਤੁ ॥
ਅੰਤੁ ਨ ਜਾਪੈ ਕਿਆ ਮਨਿ ਮੰਤੁ ॥
ਅੰਤੁ ਨ ਜਾਪੈ ਕੀਤਾ ਆਕਾਰੁ ॥
ਅੰਤੁ ਨ ਜਾਪੈ ਪਾਰਾਵਾਰੁ ॥
ਅੰਤ ਕਾਰਣਿ ਕੇਤੇ ਬਿਲਲਾਹਿ ॥
ਤਾ ਕੇ ਅੰਤ ਨ ਪਾਏ ਜਾਹਿ ॥
ਏਹੁ ਅੰਤੁ ਨ ਜਾਣੈ ਕੋਇ ॥
ਬਹੁਤਾ ਕਹੀਐ ਬਹੁਤਾ ਹੋਇ ॥
ਵਡਾ ਸਾਹਿਬੁ ਊਚਾ ਥਾਉ ॥
ਊਚੇ ਉਪਰਿ ਊਚਾ ਨਾਉ ॥
ਏਵਡੁ ਊਚਾ ਹੋਵੈ ਕੋਇ ॥
ਤਿਸੁ ਊਚੇ ਕਉ ਜਾਣੈ ਸੋਇ ॥
ਜੇਵਡੁ ਆਪਿ ਜਾਣੈ ਆਪਿ ਆਪਿ ॥
ਨਾਨਕ ਨਦਰੀ ਕਰਮੀ ਦਾਤਿ ॥੨੪॥`,
        transliteration: `ant na sifatee kehan na ant |
ant na karanai den na ant |
ant na vekhan sunan na ant |
ant na jaapai kiaa man mant |
ant na jaapai keetaa aakaar |
ant na jaapai paaraavaar |
ant kaaran kete bilalaeh |
taa ke ant na paae jaeh |
ehu ant na jaanai koe |
bahutaa kaheeai bahutaa hoe |
vaddaa saahib aoochaa thaau |
aooche upar aoochaa naau |
evadd aoochaa hovai koe |
tis aooche kau jaanai soe |
jevadd aap jaanai aap aap |
naanak nadaree karamee daat |24|`,
        meaning: `Endless are His Praises, endless are those who speak them. Endless are His Actions, endless are His Gifts. Endless is His Vision, endless is His Hearing. His limits cannot be perceived. What is the Mystery of His Mind? The limits of the created universe cannot be perceived. Its limits here and beyond cannot be perceived. Many struggle to know His limits, but His limits cannot be found. No one can know these limits. The more you say about them, the more there still remains to be said. Great is the Master, High is His Heavenly Home. Highest of the High, above all is His Name. Only one as Great and as High as God can know His Lofty and Exalted State. Only He Himself is that Great. He Himself knows Himself. O Nanak, by His Glance of Grace, He bestows His Blessings. ||24||`,
        meaning_hi: `उसकी स्तुति अनन्त है, उसे कहने वाले अनन्त हैं। उसके कार्य अनंत हैं, उसके उपहार अनंत हैं। अनंत है उसका दर्शन, अनंत है उसका श्रवण। उसकी सीमाएं समझी नहीं जा सकतीं. उसके मन का रहस्य क्या है? निर्मित ब्रह्माण्ड की सीमाएँ समझी नहीं जा सकतीं। इहलोक और परलोक में इसकी सीमाएं इंद्रियों के परे हैं। कई लोग उसकी सीमाएँ जानने के लिए संघर्ष करते हैं, लेकिन उसकी सीमाएँ नहीं पाई जा सकतीं। इन सीमाओं को कोई नहीं जान सकता. आप उनके बारे में जितना अधिक कहेंगे, उतना ही अधिक कहा जाना बाकी है। महान है गुरु, ऊँचा है उसका स्वर्गीय घर। सबसे ऊँचा, सबसे ऊपर उसका नाम है। केवल ईश्वर जैसा महान और उच्च व्यक्ति ही उसकी उदात्त और श्रेष्ठ स्थिति को जान सकता है। केवल वही स्वयं इतना महान है। वह स्वयं अपने आप को जानता है। हे नानक, अपनी कृपा की दृष्टि से, वह अपना आशीर्वाद प्रदान करता है। ||24||`,
        meaning_pa: `(ਅਕਾਲ ਪੁਰਖ ਦੇ) ਗੁਣਾਂ ਦਾ ਕੋਈ ਹੱਦ-ਬੰਨਾ ਨਹੀਂ ਹੈ, ਗਿਣਨ ਨਾਲ ਭੀ (ਗੁਣਾਂ ਦਾ) ਅੰਤ ਨਹੀਂ ਪੈ ਸਕਦਾ। (ਗਿਣੇ ਨਹੀਂ ਜਾ ਸਕਦੇ)। ਅਕਾਲ ਪੁਰਖ ਦੀ ਰਚਨਾ ਤੇ ਦਾਤਾਂ ਦਾ ਅੰਤ ਨਹੀਂ ਪੈ ਸਕਦਾ। ਵੇਖਣ ਤੇ ਸੁਣਨ ਨਾਲ ਭੀ ਉਸ ਦੇ ਗੁਣਾਂ ਦਾ ਪਾਰ ਨਹੀਂ ਪਾ ਸਕੀਦਾ। ਉਸ ਅਕਾਲ ਪੁਰਖ ਦੇ ਮਨ ਵਿਚ ਕਿਹੜੀ ਸਲਾਹ ਹੈ, ਇਸ ਗੱਲ ਦਾ ਭੀ ਅੰਤ ਨਹੀਂ ਪਾਇਆ ਜਾ ਸਕਦਾ। ਅਕਾਲ ਪੁਰਖ ਨੇ ਇਹ ਜਗਤ (ਜੋ ਦਿੱਸ ਰਿਹਾ ਹੈ) ਬਣਾਇਆ ਹੈ, ਪਰ ਇਸ ਦਾ ਹੀ ਅੰਤ ਨਹੀਂ ਪਾਇਆ ਜਾਂਦਾ। ਅਖ਼ੀਰ ਇਸ ਦਾ ਉਰਲਾ ਤੇ ਪਾਰਲਾ ਬੰਨਾ ਕੋਈ ਨਹੀਂ ਦਿੱਸਦਾ। ਕਈ ਮਨੁੱਖ ਅਕਾਲ ਪੁਰਖ ਦਾ ਹੱਦ-ਬੰਨਾ ਲੱਭਣ ਲਈ ਤਰਲੈ ਲੈ ਰਹੇ ਸਨ, ਪਰ ਉਸ ਦੇ ਹੱਦ-ਬੰਨੇ ਲੱਭੇ ਨਹੀਂ ਜਾ ਸਕਦੇ। (ਅਕਾਲ ਪੁਰਖ ਦੇ ਗੁਣਾਂ ਦਾ) ਇਹ ਹੱਦ-ਬੰਨਾ (ਜਿਸ ਦੀ ਬੇਅੰਤ ਜੀਵ ਭਾਲ ਕਰ ਰਹੇ ਹਨ) ਕੋਈ ਮਨੁੱਖ ਨਹੀਂ ਪਾ ਸਕਦਾ। ਜਿਉਂ ਜਿਉਂ ਇਹ ਗੱਲ ਆਖੀ ਜਾਵੀਏ ਕਿ ਉਹ ਵੱਡਾ ਹੈ, ਤਿਉਂ ਤਿਉਂ ਉਹ ਹੋਰ ਵੱਡਾ, ਹੋਰ ਵੱਡਾ ਪਰਤੀਤ ਹੋਣ ਲੱਗ ਪੈਂਦਾ ਹੈ। ਅਕਾਲ ਪੁਰੱਖ ਵੱਡਾ ਹੈ, ਉਸ ਦਾ ਟਿਕਾਣਾ ਉੱਚਾ ਹੈ। ਉਸ ਦਾ ਨਾਮਣਾ ਭੀ ਉੱਚਾ ਹੈ। ਜੇ ਕੋਈ ਹੋਰ ਉਸ ਜੇਡਾ ਵੱਡਾ ਹੋਵੇ, ਉਹ ਹੀ ਉਸ ਉੱਚੇ ਅਕਾਲ ਪੁਰਖ ਨੂੰ ਸਮਝ ਸਕਦਾ ਹੈ (ਕਿ ਉਹ ਕੇਡਾ ਵੱਡਾ ਹੈ)। ਅਕਾਲ ਪੁਰਖ ਆਪ ਹੀ ਜਾਣਦਾ ਹੈ ਕਿ ਉਹ ਆਪ ਕੇਡਾ ਵੱਡਾ ਹੈ। ਹੇ ਨਾਨਕ! (ਹਰੇਕ) ਦਾਤ ਮਿਹਰ ਦੀ ਨਜ਼ਰ ਕਰਨ ਵਾਲੇ ਅਕਾਲ ਪੁਰਖ ਦੀ ਬਖ਼ਸ਼ਸ਼ ਨਾਲ ਮਿਲਦੀ ਹੈ ॥੨੪॥`
      },
      {
        number: 25,
        sanskrit: `ਬਹੁਤਾ ਕਰਮੁ ਲਿਖਿਆ ਨਾ ਜਾਇ ॥
ਵਡਾ ਦਾਤਾ ਤਿਲੁ ਨ ਤਮਾਇ ॥
ਕੇਤੇ ਮੰਗਹਿ ਜੋਧ ਅਪਾਰ ॥
ਕੇਤਿਆ ਗਣਤ ਨਹੀ ਵੀਚਾਰੁ ॥
ਕੇਤੇ ਖਪਿ ਤੁਟਹਿ ਵੇਕਾਰ ॥
ਕੇਤੇ ਲੈ ਲੈ ਮੁਕਰੁ ਪਾਹਿ ॥
ਕੇਤੇ ਮੂਰਖ ਖਾਹੀ ਖਾਹਿ ॥
ਕੇਤਿਆ ਦੂਖ ਭੂਖ ਸਦ ਮਾਰ ॥
ਏਹਿ ਭਿ ਦਾਤਿ ਤੇਰੀ ਦਾਤਾਰ ॥
ਬੰਦਿ ਖਲਾਸੀ ਭਾਣੈ ਹੋਇ ॥
ਹੋਰੁ ਆਖਿ ਨ ਸਕੈ ਕੋਇ ॥
ਜੇ ਕੋ ਖਾਇਕੁ ਆਖਣਿ ਪਾਇ ॥
ਓਹੁ ਜਾਣੈ ਜੇਤੀਆ ਮੁਹਿ ਖਾਇ ॥
ਆਪੇ ਜਾਣੈ ਆਪੇ ਦੇਇ ॥
ਆਖਹਿ ਸਿ ਭਿ ਕੇਈ ਕੇਇ ॥
ਜਿਸ ਨੋ ਬਖਸੇ ਸਿਫਤਿ ਸਾਲਾਹ ॥
ਨਾਨਕ ਪਾਤਿਸਾਹੀ ਪਾਤਿਸਾਹੁ ॥੨੫॥`,
        transliteration: `bahutaa karam likhiaa naa jaae |
vaddaa daataa til na tamaae |
kete mangeh jodh apaar |
ketiaa ganat nahee veechaar |
kete khap tutteh vekaar |
kete lai lai mukar paeh |
kete moorakh khaahee khaeh |
ketiaa dookh bhookh sad maar |
ehi bhi daat teree daataar |
band khalaasee bhaanai hoe |
hor aakh na sakai koe |
je ko khaaeik aakhan paae |
ohu jaanai jeteea muhi khaae |
aape jaanai aape dee |
aakheh si bhi keee kee |
jis no bakhase sifat saalaah |
naanak paatisaahee paatisaahu |25|`,
        meaning: `His Blessings are so abundant that there can be no written account of them. The Great Giver does not hold back anything. There are so many great, heroic warriors begging at the Door of the Infinite Lord. So many contemplate and dwell upon Him, that they cannot be counted. So many waste away to death engaged in corruption. So many take and take again, and then deny receiving. So many foolish consumers keep on consuming. So many endure distress, deprivation and constant abuse. Even these are Your Gifts, O Great Giver! Liberation from bondage comes only by Your Will. No one else has any say in this. If some fool should presume to say that he does, he shall learn, and feel the effects of his folly. He Himself knows, He Himself gives. Few, very few are those who acknowledge this. One who is blessed to sing the Praises of the Lord, O Nanak, is the king of kings. ||25||`,
        meaning_hi: `उनके आशीर्वाद इतने प्रचुर हैं कि उनका कोई लिखित विवरण नहीं हो सकता। महान दाता कुछ भी वापस नहीं रखता। अनंत भगवान के द्वार पर बहुत सारे महान, वीर योद्धा भीख मांग रहे हैं। इतने सारे लोग उस पर चिंतन और मनन करते हैं, कि उनकी गिनती नहीं की जा सकती। बहुत से लोग भ्रष्टाचार में लिप्त होकर मौत के घाट उतर जाते हैं। बहुत से लोग लेते हैं और दोबारा लेते हैं, और फिर लेने से इनकार कर देते हैं। बहुत से मूर्ख उपभोक्ता उपभोग करते रहते हैं। बहुत से लोग संकट, अभाव और निरंतर दुर्व्यवहार सहते हैं। ये भी आपके उपहार हैं, हे महान दाता! बंधन से मुक्ति आपकी इच्छा से ही मिलती है। इसमें किसी और का कोई कहना नहीं है. यदि कोई मूर्ख यह कहने का साहस करे कि वह ऐसा करता है, तो वह सीखेगा, और अपनी मूर्खता के प्रभाव को महसूस करेगा। वह स्वयं जानता है, वह स्वयं देता है। बहुत कम, बहुत ही कम ऐसे लोग हैं जो इस बात को स्वीकार करते हैं। हे नानक, जिसे भगवान की स्तुति गाने का सौभाग्य प्राप्त है, वह राजाओं का राजा है। ||25||`,
        meaning_pa: `ਅਕਾਲ ਪੁਰਖ ਦੀ ਬਖ਼ਸ਼ਸ਼ ਏਡੀ ਵੱਡੀ ਹੈ ਕਿ ਲਿਖਣ ਵਿਚ ਲਿਆਂਦੀ ਨਹੀਂ ਜਾ ਸਕਦੀ। ਉਹ ਬੜੀਆਂ ਦਾਤਾਂ ਦੇਣ ਵਾਲਾ ਹੈ, ਉਸ ਨੂੰ ਰਤਾ ਭੀ ਲਾਲਚ ਨਹੀਂ। ਬੇਅੰਤ ਸੂਰਮੇ (ਅਕਾਲ ਪੁਰਖ ਦੇ ਦਰ 'ਤੇ) ਮੰਗ ਰਹੇ ਹਨ, ਅਤੇ (ਮੰਗਣ ਵਾਲੇ) ਕਈ ਹੋਰ ਅਜਿਹੇ ਹਨ, ਜਿਨ੍ਹਾਂ ਦੀ ਗਿਣਤੀ 'ਤੇ ਵਿਚਾਰ ਨਹੀਂ ਹੋ ਸਕਦੀ। ਕਈ ਜੀਵ (ਉਸ ਦੀਆਂ ਦਾਤਾਂ ਵਰਤ ਕੇ) ਵਿਕਾਰਾਂ ਵਿਚ (ਹੀ) ਖਪ ਖਪ ਕੇ ਨਾਸ ਹੁੰਦੇ ਹਨ। ਬੇਅੰਤ ਜੀਵ (ਅਕਾਲ ਪੁਰਖ ਦੇ ਦਰ ਤੋਂ ਪਦਾਰਥ) ਪਰਾਪਤ ਕਰ ਕੇ ਮੁਕਰ ਪੈਂਦੇ ਹਨ (ਭਾਵ, ਕਦੇ ਸ਼ੁਕਰ ਵਿਚ ਆ ਕੇ ਇਹ ਨਹੀ ਆਖਦੇ ਕਿ ਸਭ ਪਦਾਰਥ ਪ੍ਰਭੂ ਆਪ ਦੇ ਰਿਹਾ ਹੈ)। ਅਨੇਕਾਂ ਮੂਰਖ (ਪਦਾਰਥ ਲੈ ਕੇ) ਖਾਹੀ ਹੀ ਜਾਂਦੇ ਹਨ (ਪਰ ਦਾਤਾਰ ਨੂੰ ਚੇਤੇ ਨਹੀਂ ਰੱਖਦੇ)। ਅਨੇਕਾਂ ਜੀਵਾਂ ਨੂੰ ਸਦਾ ਮਾਰ, ਕਲੇਸ਼ ਅਤੇ ਭੁਖ (ਹੀ ਭਾਗਾਂ ਵਿਚ ਲਿਖੇ ਹਨ)। (ਪਰ) ਹੇ ਦੇਣਹਾਰ ਅਕਾਲ ਪੁਰਖ! ਇਹ ਭੀ ਤੇਰੀ ਬਖ਼ਸ਼ਸ਼ ਹੀ ਹੈ (ਕਿਉਂਕਿ ਇਹਨਾਂ ਦੁੱਖਾਂ ਕਲੇਸ਼ਾਂ ਦੇ ਕਾਰਨ ਹੀ ਮਨੁੱਖ ਨੂੰ ਰਜ਼ਾ ਵਿਚ ਤੁਰਨ ਦੀ ਸਮਝ ਪੈਂਦੀ ਹੈ)। ਤੇ (ਮਾਇਆ ਦੇ ਮੋਹ ਰੂਪ) ਬੰਧਨ ਤੋਂ ਛੁਟਕਾਰਾ ਅਕਾਲ ਪੁਰਖ ਦੀ ਰਜ਼ਾ ਵਿਚ ਤੁਰਿਆਂ ਹੀ ਹੁੰਦਾ ਹੈ। ਰਜ਼ਾ ਤੋਂ ਬਿਨਾ ਕੋਈ ਹੋਰ ਤਰੀਕਾ ਕੋਈ ਮਨੁੱਖ ਨਹੀਂ ਦੱਸ ਸਕਦਾ (ਭਾਵ, ਕੋਈ ਮਨੁੱਖ ਨਹੀਂ ਦੱਸ ਸਕਦਾ ਕਿ ਰਜ਼ਾ ਵਿਚ ਤੁਰਨ ਤੋਂ ਬਿਨਾ ਮੋਹ ਤੋਂ ਛੁਟਕਾਰੇ ਦਾ ਕੋਈ ਹੋਰ ਵਸੀਲਾ ਭੀ ਹੋ ਸਕਦਾ ਹੈ)। (ਪਰ) ਜੇ ਕੋਈ ਮੂਰਖ (ਮਾਇਆ ਦੇ ਮੋਹ ਤੋਂ ਛੁਟਕਾਰੇ ਦਾ ਕੋਈ ਹੋਰ ਵਸੀਲਾ) ਦੱਸਣ ਦਾ ਜਤਨ ਕਰੇ, ਤਾਂ ਉਹੀ ਜਾਣਦਾ ਹੈ ਜਿਤਨੀਆਂ ਚੋਟਾਂ ਉਹ (ਇਸ ਮੂਰਖਤਾ ਦੇ ਕਾਰਨ) ਆਪਣੇ ਮੂੰਹ ਉੱਤੇ ਖਾਂਦਾ ਹੈ (ਭਾਵ, 'ਕੂੜ' ਤੋਂ ਬਚਣ ਲਈ ਇਕੋ ਹੀ ਤਰੀਕਾ ਹੈ ਕਿ ਮਨੁੱਖ ਰਜ਼ਾ ਵਿਚ ਤੁਰੇ। ਪਰ ਜੇ ਕੋਈ ਮੂਰਖ ਕੋਈ ਹੋਰ ਤਰੀਕਾ ਭਾਲਦਾ ਹੈ ਤਾਂ ਇਸ 'ਕੂੜ' ਤੋਂ ਬਚਣ ਦੇ ਥਾਂ ਸਗੋਂ ਵਧੀਕ ਦੁਖੀ ਹੁੰਦਾ ਹੈ)। 'ਅਕਾਲ ਪੁਰਖ ਆਪ ਹੀ (ਜੀਵਾਂ ਦੀਆਂ ਲੋੜਾਂ) ਜਾਣਦਾ ਹੈ ਤੇ ਆਪ ਹੀ (ਦਾਤਾਂ) ਦੇਂਦਾ ਹੈ', ਅਨੇਕਾਂ ਮਨੁੱਖ ਇਹ ਗੱਲ ਭੀ ਆਖਦੇ ਹਨ। (ਸਾਰੇ ਨ-ਸ਼ੁਕਰੇ ਹੀ ਨਹੀਂ ਹਨ) ਹੇ ਨਾਨਕ! ਜਿਸ ਮਨੁੱਖ ਨੂੰ ਅਕਾਲ ਪੁਰਖ ਆਪਣੀ ਸਿਫ਼ਤ-ਸਾਲਾਹ ਬਖਸ਼ਦਾ ਹੈ, ਉਹ ਪਾਤਸ਼ਾਹਾਂ ਦਾ ਪਾਤਸ਼ਾਹ (ਬਣ ਜਾਂਦਾ) ਹੈ (ਸਿਫ਼ਤ-ਸਾਲਾਹ ਹੀ ਸਭ ਤੋਂ ਉੱਚੀ  ਦਾਤ ਹੈ) ॥੨੫॥`
      },
      {
        number: 26,
        sanskrit: `ਅਮੁਲ ਗੁਣ ਅਮੁਲ ਵਾਪਾਰ ॥
ਅਮੁਲ ਵਾਪਾਰੀਏ ਅਮੁਲ ਭੰਡਾਰ ॥
ਅਮੁਲ ਆਵਹਿ ਅਮੁਲ ਲੈ ਜਾਹਿ ॥
ਅਮੁਲ ਭਾਇ ਅਮੁਲਾ ਸਮਾਹਿ ॥
ਅਮੁਲੁ ਧਰਮੁ ਅਮੁਲੁ ਦੀਬਾਣੁ ॥
ਅਮੁਲੁ ਤੁਲੁ ਅਮੁਲੁ ਪਰਵਾਣੁ ॥
ਅਮੁਲੁ ਬਖਸੀਸ ਅਮੁਲੁ ਨੀਸਾਣੁ ॥
ਅਮੁਲੁ ਕਰਮੁ ਅਮੁਲੁ ਫੁਰਮਾਣੁ ॥
ਅਮੁਲੋ ਅਮੁਲੁ ਆਖਿਆ ਨ ਜਾਇ ॥
ਆਖਿ ਆਖਿ ਰਹੇ ਲਿਵ ਲਾਇ ॥
ਆਖਹਿ ਵੇਦ ਪਾਠ ਪੁਰਾਣ ॥
ਆਖਹਿ ਪੜੇ ਕਰਹਿ ਵਖਿਆਣ ॥
ਆਖਹਿ ਬਰਮੇ ਆਖਹਿ ਇੰਦ ॥
ਆਖਹਿ ਗੋਪੀ ਤੈ ਗੋਵਿੰਦ ॥
ਆਖਹਿ ਈਸਰ ਆਖਹਿ ਸਿਧ ॥
ਆਖਹਿ ਕੇਤੇ ਕੀਤੇ ਬੁਧ ॥
ਆਖਹਿ ਦਾਨਵ ਆਖਹਿ ਦੇਵ ॥
ਆਖਹਿ ਸੁਰਿ ਨਰ ਮੁਨਿ ਜਨ ਸੇਵ ॥
ਕੇਤੇ ਆਖਹਿ ਆਖਣਿ ਪਾਹਿ ॥
ਕੇਤੇ ਕਹਿ ਕਹਿ ਉਠਿ ਉਠਿ ਜਾਹਿ ॥
ਏਤੇ ਕੀਤੇ ਹੋਰਿ ਕਰੇਹਿ ॥
ਤਾ ਆਖਿ ਨ ਸਕਹਿ ਕੇਈ ਕੇਇ ॥
ਜੇਵਡੁ ਭਾਵੈ ਤੇਵਡੁ ਹੋਇ ॥
ਨਾਨਕ ਜਾਣੈ ਸਾਚਾ ਸੋਇ ॥
ਜੇ ਕੋ ਆਖੈ ਬੋਲੁਵਿਗਾੜੁ ॥
ਤਾ ਲਿਖੀਐ ਸਿਰਿ ਗਾਵਾਰਾ ਗਾਵਾਰੁ ॥੨੬॥`,
        transliteration: `amul gun amul vaapaar |
amul vaapaaree amul bhanddaar |
amul aaveh amul lai jaeh |
amul bhaae amulaa samaeh |
amul dharam amul deebaan |
amul tul amul paravaan |
amul bakhasees amul neesaan |
amul karam amul furamaan |
amulo amul aakhiaa na jaae |
aakh aakh rahe liv laae |
aakheh ved paatth puraan |
aakheh parre kareh vakhiaan |
aakheh barame aakheh ind |
aakheh gopee tai govind |
aakheh eesar aakheh sidh |
aakheh kete keete budh |
aakheh daanav aakheh dev |
aakheh sur nar mun jan sev |
kete aakheh aakhan paeh |
kete keh keh utth utth jaeh |
ete keete hor karehi |
taa aakh na sakeh keee kee |
jevadd bhaavai tevadd hoe |
naanak jaanai saachaa soe |
je ko aakhai boluvigaarr |
taa likheeai sir gaavaaraa gaavaar |26|`,
        meaning: `Priceless are His Virtues, Priceless are His Dealings. Priceless are His Dealers, Priceless are His Treasures. Priceless are those who come to Him, Priceless are those who buy from Him. Priceless is Love for Him, Priceless is absorption into Him. Priceless is the Divine Law of Dharma, Priceless is the Divine Court of Justice. Priceless are the scales, priceless are the weights. Priceless are His Blessings, Priceless is His Banner and Insignia. Priceless is His Mercy, Priceless is His Royal Command. Priceless, O Priceless beyond expression! Speak of Him continually, and remain absorbed in His Love. The Vedas and the Puraanas speak. The scholars speak and lecture. Brahma speaks, Indra speaks. The Gopis and Krishna speak. Shiva speaks, the Siddhas speak. The many created Buddhas speak. The demons speak, the demi-gods speak. The spiritual warriors, the heavenly beings, the silent sages, the humble and serviceful speak. Many speak and try to describe Him. Many have spoken of Him over and over again, and have then arisen and departed. If He were to create as many again as there already are, even then, they could not describe Him. He is as Great as He wishes to be. O Nanak, the True Lord knows. If anyone presumes to describe God, he shall be known as the greatest fool of fools! ||26||`,
        meaning_hi: `उसके गुण अनमोल हैं, उसका व्यवहार अनमोल है। उसके सौदागर अमूल्य हैं, उसके भण्डार अमूल्य हैं। अनमोल हैं वे जो उसके पास आते हैं, अनमोल हैं वे जो उससे खरीदते हैं। उसके लिए प्यार अनमोल है, उसमें तल्लीनता अनमोल है। अमूल्य है धर्म का दैवी विधान, अमूल्य है दैवीय न्यायालय। अनमोल हैं तराजू, अनमोल हैं बाट। अनमोल हैं उनके आशीर्वाद, अनमोल हैं उनके बैनर और प्रतीक चिन्ह। अनमोल है उसकी दया, अनमोल है उसकी शाही आज्ञा। अनमोल, हे अभिव्यक्ति से परे अनमोल! निरंतर उसके बारे में बोलें और उसके प्रेम में लीन रहें। वेद और पुराण बोलते हैं. विद्वान बोलते हैं और व्याख्यान देते हैं। ब्रह्मा बोलते हैं, इंद्र बोलते हैं. गोपियाँ और कृष्ण बोलते हैं। शिव बोलते हैं, सिद्ध बोलते हैं। अनेक निर्मित बुद्ध बोलते हैं। राक्षस बोलते हैं, देवता बोलते हैं। आध्यात्मिक योद्धा, स्वर्गीय प्राणी, मौन संत, विनम्र और सेवाभावी बोलते हैं। कई लोग बोलते हैं और उसका वर्णन करने का प्रयास करते हैं। कई लोगों ने उसके बारे में बार-बार बात की है, और फिर उठे और चले गए। यदि वह फिर से उतनी ही सृष्टि करता जितनी पहले से हैं, तब भी, वे उसका वर्णन नहीं कर सकते। वह उतना ही महान है जितना वह बनना चाहता है। हे नानक, सच्चा भगवान जानता है। यदि कोई ईश्वर का वर्णन करने का साहस करेगा तो वह मूर्खों में सबसे बड़ा मूर्ख कहलाएगा! ||26||`,
        meaning_pa: `(ਅਕਾਲ ਪੁਰਖ ਦੇ) ਗੁਣ ਅਮੋਲਕ ਹਨ (ਭਾਵ, ਗੁਣਾਂ ਦਾ ਮੁੱਲ ਨਹੀਂ ਪੈ ਸਕਦਾ।) (ਇਹਨਾਂ ਗੁਣਾਂ ਦੇ) ਵਪਾਰ ਕਰਨੇ ਭੀ ਅਮੋਲਕ ਹਨ। ਉਹਨਾਂ ਮਨੁੱਖਾਂ ਦਾ (ਭੀ) ਮੁੱਲ ਨਹੀਂ ਪੈ ਸਕਦਾ, ਜੋ (ਅਕਾਲ ਪੁਰਖ ਦੇ ਗੁਣਾਂ ਦੇ) ਵਪਾਰ ਕਰਦੇ ਹਨ, (ਗੁਣਾਂ ਦੇ) ਖ਼ਜ਼ਾਨੇ (ਭੀ) ਅਮੋਲਕ ਹਨ। ਉਹਨਾਂ ਮਨੁੱਖਾਂ ਦਾ ਮੁੱਲ ਨਹੀਂ ਪੈ ਸਕਦਾ, ਜੋ (ਇਸ ਵਪਾਰ ਲਈ ਜਗਤ ਵਿਚ) ਆਉਂਦੇ ਹਨ। ਉਹ ਭੀ ਵੱਡੇ ਭਾਗਾਂ ਵਾਲੇ ਹਨ, ਜੋ (ਇਹ ਸੌਦਾ ਖ਼ਰੀਦ ਕੇ) ਲੈ ਜਾਂਦੇ ਹਨ। ਜੋ ਮਨੁੱਖ ਅਕਾਲ ਪੁਰਖ ਦੇ ਪ੍ਰੇਮ ਵਿਚ ਹਨ ਅਤੇ ਜੋ ਮਨੁੱਖ ਉਸ ਅਕਾਲ ਪੁਰਖ ਵਿਚ ਲੀਨ ਹੋਏ ਹੋਏ ਹਨ, ਉਹ ਭੀ ਅਮੋਲਕ ਹਨ। ਅਕਾਲ ਪੁਰਖ ਦੇ ਕਨੂੰਨ ਤੇ ਰਾਜ-ਦਰਬਾਰ ਅਮੋਲਕ ਹਨ। ਉਹ ਤੱਕੜ ਅਮੋਲਕ ਹਨ ਤੇ ਉਹ ਵੱਟਾ ਅਮੋਲਕ ਹੈ (ਜਿਸ ਨਾਲ ਜੀਵਾਂ ਦੇ ਚੰਗੇ-ਮੰਦੇ ਕੰਮਾਂ ਨੂੰ ਤੋਲਦਾ ਹੈ)। ਉਸ ਦੀ ਬਖ਼ਸ਼ਸ਼ ਤੇ ਬਖ਼ਸ਼ਸ਼ ਦੇ ਨਿਸ਼ਾਨ ਭੀ ਅਮੋਲਕ ਹਨ। ਅਕਾਲ ਪੁਰਖ ਦੀ ਬਖਸ਼ਸ਼ ਤੇ ਹੁਕਮ ਭੀ ਮੁੱਲ ਤੋਂ ਪਰੇ ਹਨ (ਕਿਸੇ ਦਾ ਭੀ ਅੰਦਾਜ਼ਾ ਨਹੀਂ ਲੱਗ ਸਕਦਾ)। ਅਕਾਲ ਪੁਰਖ ਸਭ ਅੰਦਾਜ਼ਿਆਂ ਤੋਂ ਪਰੇ ਹੈ, ਉਸ ਦਾ ਕੋਈ ਅੰਦਾਜ਼ਾ ਨਹੀਂ ਲੱਗ ਸਕਦਾ। ਜੋ ਮਨੁੱਖ ਧਿਆਨ ਜੋੜ ਜੋੜ ਕੇ ਅਕਾਲ ਪੁਰਖ ਦਾ ਅੰਦਾਜ਼ਾ ਲਾਂਦੇ ਹਨ, ਉਹ (ਅੰਤ ਨੂੰ) ਰਹਿ ਜਾਂਦੇ ਹਨ। ਵੇਦਾਂ ਦੇ ਮੰਤਰ ਤੇ ਪੁਰਾਣ ਅਕਾਲ ਪੁਰਖ ਦਾ ਅੰਦਾਜ਼ਾ ਲਾਂਦੇ ਹਨ। ਵਿਦਵਾਨ ਮਨੁੱਖ ਭੀ, ਜੋ (ਹੋਰਨਾਂ ਨੂੰ) ਉਪਦੇਸ਼ ਕਰਦੇ ਹਨ, (ਅਕਾਲ ਪੁਰਖ ਦਾ) ਬਿਆਨ ਕਰਦੇ ਹਨ। ਕਈ ਬ੍ਰਹਮਾ, ਕਈ ਇੰਦਰ ਅਕਾਲ ਪੁਰਖ ਦੀ ਵਡਿਆਈ ਆਖਦੇ ਹਨ। ਗੋਪੀਆਂ ਤੇ ਕਈ ਕਾਨ੍ਹ ਅਕਾਲ ਪੁਰਖ ਦਾ ਅੰਦਾਜ਼ਾ ਲਾਂਦੇ ਹਨ। ਕਈ ਸ਼ਿਵ ਤੇ ਸਿੱਧ ਅਕਾਲ ਪੁਰਖ ਦੀ ਵਡਿਆਈ ਆਖਦੇ ਹਨ। ਅਕਾਲ ਪੁਰਖ ਦੇ ਪੈਦਾ ਕੀਤੇ ਹੋਏ ਬੇਅੰਤ ਬੁੱਧ ਉਸ ਦੀ ਵਡਿਆਈ ਆਖਦੇ ਹਨ। ਰਾਖਸ਼ ਤੇ ਦੇਵਤੇ (ਵੀ) ਅਕਾਲ ਪੁਰਖ ਦੀ ਵਡਿਆਈ ਆਖਦੇ ਹਨ। ਦੇਵਤਾ-ਸੁਭਾਉ ਮਨੁੱਖ, ਮੁਨੀ ਲੋਕ ਤੇ ਸੇਵਕ ਅਕਾਲ ਪੁਰਖ ਦਾ ਅੰਦਾਜ਼ਾ ਲਾਂਦੇ ਹਨ। ਬੇਅੰਤ ਜੀਵ ਅਕਾਲ ਪੁਰਖ ਦਾ ਅੰਦਾਜ਼ਾ ਲਾ ਰਹੇ ਹਨ, ਅਤੇ ਬੇਅੰਤ ਹੀ ਲਾਉਣ ਦਾ ਜਤਨ ਕਰ ਰਹੇ ਹਨ। ਬੇਅੰਤ ਜੀਵ ਅੰਦਾਜ਼ਾ ਲਾ ਲਾ ਕੇ ਇਸ ਜਗਤ ਤੋਂ ਤੁਰੇ ਜਾ ਰਹੇ ਹਨ। ਜਗਤ ਵਿਚ ਇਤਨੇ (ਬੇਅੰਤ) ਜੀਵ ਪੈਦਾ ਕੀਤੇ ਹੋਏ ਹਨ (ਜੋ ਬਿਆਨ ਕਰ ਰਹੇ ਹਨ), (ਪਰ ਹੇ ਹਰੀ!) ਜੇ ਤੂੰ ਹੋਰ ਭੀ (ਬੇਅੰਤ ਜੀਵ) ਪੈਦਾ ਕਰ ਦੇਵੇਂ, ਤਾਂ ਭੀ ਕੋਈ ਜੀਵ ਤੇਰਾ ਅੰਦਾਜ਼ਾ ਨਹੀਂ ਲਾ ਸਕਦੇ। ਹੇ ਨਾਨਕ! ਪਰਮਾਤਮਾ ਜਿਤਨਾ ਚਾਹੁੰਦਾ ਹੈ ਉਤਨਾ ਹੀ ਵੱਡਾ ਹੋ ਜਾਂਦਾ ਹੈ (ਆਪਣੀ ਕੁਦਰਤ ਵਧਾ ਲੈਂਦਾ ਹੈ)। ਉਹ ਸਦਾ-ਥਿਰ ਰਹਿਣ ਵਾਲਾ ਹਰੀ ਆਪ ਹੀ ਜਾਣਦਾ ਹੈ (ਕਿ ਉਹ ਕੇਡਾ ਵੱਡਾ ਹੈ)। ਜੇ ਕੋਈ ਬੜਬੋਲਾ ਮਨੁੱਖ ਦੱਸਣ ਲੱਗੇ (ਕਿ ਅਕਾਲ ਪੁਰਖ ਕਿਤਨਾ ਵੱਡਾ ਹੈ) ਤਾਂ ਉਹ ਮਨੁੱਖ ਮੂਰਖਾਂ-ਸਿਰ-ਮੂਰਖ ਗਿਣਿਆ ਜਾਂਦਾ ਹੈ ॥੨੬॥`
      },
      {
        number: 27,
        sanskrit: `ਸੋ ਦਰੁ ਕੇਹਾ ਸੋ ਘਰੁ ਕੇਹਾ ਜਿਤੁ ਬਹਿ ਸਰਬ ਸਮਾਲੇ ॥
ਵਾਜੇ ਨਾਦ ਅਨੇਕ ਅਸੰਖਾ ਕੇਤੇ ਵਾਵਣਹਾਰੇ ॥
ਕੇਤੇ ਰਾਗ ਪਰੀ ਸਿਉ ਕਹੀਅਨਿ ਕੇਤੇ ਗਾਵਣਹਾਰੇ ॥
ਗਾਵਹਿ ਤੁਹਨੋ ਪਉਣੁ ਪਾਣੀ ਬੈਸੰਤਰੁ ਗਾਵੈ ਰਾਜਾ ਧਰਮੁ ਦੁਆਰੇ ॥
ਗਾਵਹਿ ਚਿਤੁ ਗੁਪਤੁ ਲਿਖਿ ਜਾਣਹਿ ਲਿਖਿ ਲਿਖਿ ਧਰਮੁ ਵੀਚਾਰੇ ॥
ਗਾਵਹਿ ਈਸਰੁ ਬਰਮਾ ਦੇਵੀ ਸੋਹਨਿ ਸਦਾ ਸਵਾਰੇ ॥
ਗਾਵਹਿ ਇੰਦ ਇਦਾਸਣਿ ਬੈਠੇ ਦੇਵਤਿਆ ਦਰਿ ਨਾਲੇ ॥
ਗਾਵਹਿ ਸਿਧ ਸਮਾਧੀ ਅੰਦਰਿ ਗਾਵਨਿ ਸਾਧ ਵਿਚਾਰੇ ॥
ਗਾਵਨਿ ਜਤੀ ਸਤੀ ਸੰਤੋਖੀ ਗਾਵਹਿ ਵੀਰ ਕਰਾਰੇ ॥
ਗਾਵਨਿ ਪੰਡਿਤ ਪੜਨਿ ਰਖੀਸਰ ਜੁਗੁ ਜੁਗੁ ਵੇਦਾ ਨਾਲੇ ॥
ਗਾਵਹਿ ਮੋਹਣੀਆ ਮਨੁ ਮੋਹਨਿ ਸੁਰਗਾ ਮਛ ਪਇਆਲੇ ॥
ਗਾਵਨਿ ਰਤਨ ਉਪਾਏ ਤੇਰੇ ਅਠਸਠਿ ਤੀਰਥ ਨਾਲੇ ॥
ਗਾਵਹਿ ਜੋਧ ਮਹਾਬਲ ਸੂਰਾ ਗਾਵਹਿ ਖਾਣੀ ਚਾਰੇ ॥
ਗਾਵਹਿ ਖੰਡ ਮੰਡਲ ਵਰਭੰਡਾ ਕਰਿ ਕਰਿ ਰਖੇ ਧਾਰੇ ॥
ਸੇਈ ਤੁਧੁਨੋ ਗਾਵਹਿ ਜੋ ਤੁਧੁ ਭਾਵਨਿ ਰਤੇ ਤੇਰੇ ਭਗਤ ਰਸਾਲੇ ॥
ਹੋਰਿ ਕੇਤੇ ਗਾਵਨਿ ਸੇ ਮੈ ਚਿਤਿ ਨ ਆਵਨਿ ਨਾਨਕੁ ਕਿਆ ਵੀਚਾਰੇ ॥
ਸੋਈ ਸੋਈ ਸਦਾ ਸਚੁ ਸਾਹਿਬੁ ਸਾਚਾ ਸਾਚੀ ਨਾਈ ॥
ਹੈ ਭੀ ਹੋਸੀ ਜਾਇ ਨ ਜਾਸੀ ਰਚਨਾ ਜਿਨਿ ਰਚਾਈ ॥
ਰੰਗੀ ਰੰਗੀ ਭਾਤੀ ਕਰਿ ਕਰਿ ਜਿਨਸੀ ਮਾਇਆ ਜਿਨਿ ਉਪਾਈ ॥
ਕਰਿ ਕਰਿ ਵੇਖੈ ਕੀਤਾ ਆਪਣਾ ਜਿਵ ਤਿਸ ਦੀ ਵਡਿਆਈ ॥
ਜੋ ਤਿਸੁ ਭਾਵੈ ਸੋਈ ਕਰਸੀ ਹੁਕਮੁ ਨ ਕਰਣਾ ਜਾਈ ॥
ਸੋ ਪਾਤਿਸਾਹੁ ਸਾਹਾ ਪਾਤਿਸਾਹਿਬੁ ਨਾਨਕ ਰਹਣੁ ਰਜਾਈ ॥੨੭॥`,
        transliteration: `so dar kehaa so ghar kehaa jit beh sarab samaale |
vaaje naad anek asankhaa kete vaavanahaare |
kete raag paree siau kaheean kete gaavanahaare |
gaaveh tuhano paun paanee baisantar gaavai raajaa dharam duaare |
gaaveh chit gupat likh jaaneh likh likh dharam veechaare |
gaaveh eesar baramaa devee sohan sadaa savaare |
gaaveh ind idaasan baitthe devatiaa dar naale |
gaaveh sidh samaadhee andar gaavan saadh vichaare |
gaavan jatee satee santokhee gaaveh veer karaare |
gaavan panddit parran rakheesar jug jug vedaa naale |
gaaveh mohaneea man mohan suragaa machh peaale |
gaavan ratan upaae tere atthasatth teerath naale |
gaaveh jodh mahaabal sooraa gaaveh khaanee chaare |
gaaveh khandd manddal varabhanddaa kar kar rakhe dhaare |
seee tudhuno gaaveh jo tudh bhaavan rate tere bhagat rasaale |
hor kete gaavan se mai chit na aavan naanak kiaa veechaare |
soee soee sadaa sach saahib saachaa saachee naaee |
hai bhee hosee jaae na jaasee rachanaa jin rachaaee |
rangee rangee bhaatee kar kar jinasee maaeaa jin upaaee |
kar kar vekhai keetaa aapanaa jiv tis dee vaddiaaee |
jo tis bhaavai soee karasee hukam na karanaa jaaee |
so paatisaahu saahaa paatisaahib naanak rehan rajaaee |27|`,
        meaning: `Where is that Gate, and where is that Dwelling, in which You sit and take care of all? The Sound-current of the Naad vibrates there, and countless musicians play on all sorts of instruments there. So many Ragas, so many musicians singing there. The praanic wind, water and fire sing; the Righteous Judge of Dharma sings at Your Door. Chitr and Gupt, the angels of the conscious and the subconscious who record actions, and the Righteous Judge of Dharma who judges this record sing. Shiva, Brahma and the Goddess of Beauty, ever adorned, sing. Indra, seated upon His Throne, sings with the deities at Your Door. The Siddhas in Samaadhi sing; the Saadhus sing in contemplation. The celibates, the fanatics, the peacefully accepting and the fearless warriors sing. The Pandits, the religious scholars who recite the Vedas, with the supreme sages of all the ages, sing. The Mohinis, the enchanting heavenly beauties who entice hearts in this world, in paradise, and in the underworld of the subconscious sing. The celestial jewels created by You, and the sixty-eight holy places of pilgrimage sing. The brave and mighty warriors sing; the spiritual heroes and the four sources of creation sing. The planets, solar systems and galaxies, created and arranged by Your Hand, sing. They alone sing, who are pleasing to Your Will. Your devotees are imbued with the Nectar of Your Essence. So many others sing, they do not come to mind. O Nanak, how can I consider them all? That True Lord is True, Forever True, and True is His Name. He is, and shall always be. He shall not depart, even when this Universe which He has created departs. He created the world, with its various colors, species of beings, and the variety of Maya. Having created the creation, He watches over it Himself, by His Greatness. He does whatever He pleases. No order can be issued to Him. He is the King, the King of kings, the Supreme Lord and Master of kings. Nanak remains subject to His Will. ||27||`,
        meaning_hi: `वह द्वार कहां है, और वह निवास कहां है, जिस में आप बैठ कर सब का ध्यान रखते हैं? वहां नाद की ध्वनि-धारा स्पंदित होती है और अनगिनत संगीतकार वहां तरह-तरह के वाद्ययंत्र बजाते हैं। इतने सारे राग, इतने सारे संगीतकार वहां गा रहे हैं। प्राणिक वायु, जल और अग्नि गाते हैं; धर्म का न्यायी न्यायाधीश आपके द्वार पर गाता है। चित्र और गुप्त, चेतन और अवचेतन के देवदूत जो कार्यों को रिकॉर्ड करते हैं, और धर्म के धर्मी न्यायाधीश जो इस रिकॉर्ड का न्याय करते हैं, गाते हैं। शिव, ब्रह्मा और सौंदर्य की देवी, सदैव सुशोभित, गाते हैं। इंद्र अपने सिंहासन पर बैठकर आपके द्वार पर देवताओं के साथ गाते हैं। समाधिस्थ सिद्ध गाते हैं; साधु चिंतन में गाते हैं। ब्रह्मचारी, धर्मांध, शांति स्वीकार करने वाले और निर्भीक योद्धा गाते हैं। पंडित, धार्मिक विद्वान जो वेदों का पाठ करते हैं, सभी युगों के सर्वोच्च ऋषियों के साथ गाते हैं। मोहिनी, मनमोहक स्वर्गीय सुंदरियाँ जो इस दुनिया में, स्वर्ग में और अवचेतन के पाताल में दिलों को लुभाती हैं, गाती हैं। आपके द्वारा निर्मित दिव्य रत्न और अड़सठ पवित्र तीर्थ गाते हैं। वीर और पराक्रमी योद्धा गाते हैं; आध्यात्मिक नायक और सृष्टि के चार स्रोत गाते हैं। आपके हाथ से निर्मित और व्यवस्थित ग्रह, सौर मंडल और आकाशगंगाएँ गाते हैं। वे ही गाते हैं, जो तेरी इच्छा को प्रसन्न करते हैं। आपके भक्त आपके सार के अमृत से सराबोर हैं। और कितने गाते हैं, याद नहीं आता। हे नानक, मैं उन सभी पर कैसे विचार कर सकता हूं? वह सच्चा प्रभु सत्य है, सदैव सत्य है, और उसका नाम सत्य है। वह है, और सदैव रहेगा। वह तब भी नहीं हटेगा, जब यह ब्रह्मांड, जिसे उसने बनाया है, चला जाएगा। उन्होंने विभिन्न रंगों, प्राणियों की प्रजातियों और माया की विविधता के साथ दुनिया की रचना की। सृष्टि की रचना करने के बाद, वह अपनी महानता से स्वयं इसकी देखभाल करता है। वह जो चाहे करता है। उन्हें कोई आदेश जारी नहीं किया जा सकता. वह राजा, राजाओं का राजा, सर्वोच्च भगवान और राजाओं का स्वामी है। नानक उनकी इच्छा के अधीन रहते हैं। ||27||`,
        meaning_pa: `ਉਹ ਦਰ-ਘਰ ਬੜਾ ਹੀ ਅਸਚਰਜ ਹੈ ਜਿੱਥੇ ਬਹਿ ਕੇ, (ਹੇ ਨਿਰੰਕਾਰ!) ਤੂੰ ਸਾਰੇ ਜੀਵਾਂ ਦੀ ਸੰਭਾਲ ਕਰ ਰਿਹਾ ਹੈਂ। (ਤੇਰੀ ਇਸ ਰਚੀ ਹੋਈ ਕੁਦਰਤ ਵਿਚ) ਅਨੇਕਾਂ ਤੇ ਅਣਗਿਣਤ ਵਾਜੇ ਤੇ ਰਾਗ ਹਨ; ਬੇਅੰਤ ਹੀ ਜੀਵ (ਉਹਨਾਂ ਵਾਜਿਆਂ ਨੂੰ) ਵਜਾਣ ਵਾਲੇ ਹਨ। ਰਾਗਣੀਆਂ ਸਣੇ ਬੇਅੰਤ ਹੀ ਰਾਗ ਕਹੇ ਜਾਂਦੇ ਹਨ ਅਤੇ ਅਨੇਕਾਂ ਹੀ ਜੀਵ (ਇਹਨਾਂ ਰਾਗਾਂ ਦੇ) ਗਾਉਣ ਵਾਲੇ ਹਨ (ਜੋ ਤੈਨੂੰ ਗਾ ਰਹੇ ਹਨ)! (ਹੇ ਨਿਰੰਕਾਰ!) ਪਉਣ, ਪਾਣੀ, ਅਗਨੀ ਤੇਰੇ ਗੁਣ ਗਾ ਰਹੇ ਹਨ। ਧਰਮ-ਰਾਜ ਤੇਰੇ ਦਰ 'ਤੇ (ਖਲੋ ਕੇ) ਤੈਨੂੰ ਵਡਿਆਇ ਰਿਹਾ ਹੈ। ਉਹ ਚਿੱਤਰ-ਗੁਪਤ ਭੀ ਜੋ (ਜੀਵਾਂ ਦੇ ਚੰਗੇ-ਮੰਦੇ ਕਰਮਾਂ ਦੇ ਲੇਖੇ) ਲਿਖਣੇ ਜਾਣਦੇ ਹਨ, ਅਤੇ ਜਿਨ੍ਹਾਂ ਦੇ ਲਿਖੇ ਹੋਏ ਨੂੰ ਧਰਮ-ਰਾਜ ਵਿਚਾਰਦਾ ਹੈ, ਤੇਰੀਆਂ ਵਡਿਆਈਆਂ ਕਰ ਰਹੇ ਹਨ। (ਹੇ ਅਕਾਲ ਪੁਰਖ!) ਦੇਵੀਆਂ, ਸ਼ਿਵ ਤੇ ਬ੍ਰਹਮਾ, ਜੋ ਤੇਰੇ ਸਵਾਰੇ ਹੋਏ ਹਨ, ਤੈਨੂੰ ਗਾ ਰਹੇ ਹਨ। ਕਈ ਇੰਦਰ ਆਪਣੇ ਤਖ਼ਤ 'ਤੇ ਬੈਠੇ ਹੋਏ ਦੇਵਤਿਆਂ ਸਮੇਤ ਤੇਰੇ ਦਰ 'ਤੇ ਤੈਨੂੰ ਸਲਾਹ ਰਹੇ ਹਨ। ਸਿੱਧ ਲੋਕ ਸਮਾਧੀਆਂ ਲਾ ਕੇ ਤੈਨੂੰ ਗਾ ਰਹੇ ਹਨ, ਸਾਧ ਵਿਚਾਰ ਕਰ ਕਰ ਕੇ ਤੈਨੂੰ ਸਲਾਹ ਰਹੇ ਹਨ। ਜਤ-ਧਾਰੀ, ਦਾਨ ਕਰਨ ਵਾਲੇ ਤੇ ਸੰਤੋਖ ਵਾਲੇ ਪੁਰਸ਼ ਤੇਰੇ ਗੁਣ ਗਾ ਰਹੇ ਹਨ ਅਤੇ (ਬੇਅੰਤ) ਤਕੜੇ ਸੂਰਮੇ ਤੇਰੀਆਂ ਵਡਿਆਈਆਂ ਕਰ ਰਹੇ ਹਨ। (ਹੇ ਅਕਾਲ ਪੁਰਖ!) ਪੰਡਿਤ ਤੇ ਮਹਾਂਰਿਖੀ ਜੋ (ਵੇਦਾਂ ਨੂੰ) ਪੜ੍ਹਦੇ ਹਨ, ਵੇਦਾਂ ਸਣੇ ਤੈਨੂੰ ਗਾ ਰਹੇ ਹਨ। ਸੁੰਦਰ ਇਸਤ੍ਰੀਆਂ, ਜੋ ਸੁਰਗ, ਮਾਤ-ਲੋਕ ਤੇ ਪਾਤਾਲ ਵਿਚ (ਭਾਵ, ਹਰ ਥਾਂ) ਮਨੁੱਖ ਦੇ ਮਨ ਨੂੰ ਮੋਹ ਲੈਂਦੀਆਂ ਹਨ, ਤੈਨੂੰ ਗਾ ਰਹੀਆਂ ਹਨ। (ਹੇ ਨਿਰੰਕਾਰ!) ਤੇਰੇ ਪੈਦਾ ਕੀਤੇ ਹੋਏ ਰਤਨ ਅਠਾਹਠ ਤੀਰਥਾਂ ਸਮੇਤ ਤੈਨੂੰ ਗਾ ਰਹੇ ਹਨ। ਵੱਡੇ ਬਲ ਵਾਲੇ ਜੋਧੇ ਤੇ ਸੂਰਮੇ ਤੇਰੀ ਸਿਫ਼ਤ ਕਰ ਰਹੇ ਹਨ। ਚੌਹਾਂ ਹੀ ਖਾਣੀਆਂ ਦੇ ਜੀਅ ਜੰਤ ਤੈਨੂੰ ਗਾ ਰਹੇ ਹਨ। ਸਾਰੀ ਸ੍ਰਿਸ਼ਟੀ, ਸ੍ਰਿਸ਼ਟੀ ਦੇ ਸਾਰੇ ਖੰਡ ਅਤੇ ਚੱਕਰ, ਜੋ ਤੂੰ ਪੈਦਾ ਕਰ ਕੇ ਟਿਕਾ ਰਖੇ ਹਨ, ਤੈਨੂੰ ਗਾਉਂਦੇ ਹਨ। (ਹੇ ਅਕਾਲ ਪੁਰਖ!) (ਅਸਲ ਵਿਚ ਤਾਂ) ਉਹੋ ਤੇਰੇ ਪ੍ਰੇਮ ਵਿਚ ਰੱਤੇ ਰਸੀਏ ਭਗਤ ਜਨ ਤੈਨੂੰ ਗਾਉਂਦੇ ਹਨ (ਭਾਵ, ਉਹਨਾਂ ਦਾ ਹੀ ਗਾਉਣਾ ਸਫਲ ਹੈ) ਜੋ ਤੈਨੂੰ ਚੰਗੇ ਲੱਗਦੇ ਹਨ। ਅਨੇਕਾਂ ਹੋਰ ਜੀਵ ਤੈਨੂੰ ਗਾ ਰਹੇ ਹਨ, ਜਿਹੜੇ ਮੈਥੋਂ ਗਿਣੇ ਭੀ ਨਹੀਂ ਜਾ ਸਕਦੇ। (ਭਲਾ) ਨਾਨਕ (ਵਿਚਾਰਾ) ਕੀਹ ਵਿਚਾਰ ਕਰ ਸਕਦਾ ਹੈ? ਉਹ ਅਕਾਲ ਪੁਰਖ ਸਦਾ-ਥਿਰ ਹੈ। ਉਹ ਮਾਲਕ ਸੱਚਾ ਹੈ, ਉਸ ਦੀ ਵਡਿਆਈ ਭੀ ਸਦਾ ਅਟੱਲ ਹੈ। ਜਿਸ ਅਕਾਲ ਪੁਰਖ ਨੇ ਇਹ ਸ੍ਰਿਸ਼ਟੀ ਪੈਦਾ ਕੀਤੀ ਹੈ, ਉਹ ਐਸ ਵੇਲੇ ਮੌਜੂਦ ਹੈ, ਸਦਾ ਰਹੇਗਾ। ਨਾਹ ਉਹ ਜੰਮਿਆ ਹੈ ਅਤੇ ਨਾਹ ਹੀ ਮਰੇਗਾ। ਜਿਸ ਅਕਾਲ ਪੁਰਖ ਨੇ ਕਈ ਰੰਗਾਂ, ਕਿਸਮਾਂ ਅਤੇ ਜਿਨਸਾਂ ਦੀ ਮਾਇਆ ਰਚ ਦਿੱਤੀ ਹੈ। ਉਹ ਜਿਵੇਂ ਉਸ ਦੀ ਰਜ਼ਾ ਹੈ, (ਭਾਵ, ਜੇਡਾ ਵੱਡਾ ਆਪ ਹੈ ਓਡੇ ਵੱਡੇ ਜਿਗਰੇ ਨਾਲ ਜਗਤ ਨੂੰ ਰਚ ਕੇ) ਆਪਣੇ ਪੈਦਾ ਕੀਤੇ ਹੋਏ ਦੀ ਸੰਭਾਲ ਭੀ ਕਰ ਰਿਹਾ ਹੈ। ਜੋ ਕੁਝ ਅਕਾਲ ਪੁਰਖ ਨੂੰ ਭਾਉਂਦਾ ਹੈ, ਉਹੋ ਹੀ ਕਰੇਗਾ, ਕਿਸੇ ਜੀਵ ਪਾਸੋਂ ਅਕਾਲ ਪੁਰਖ ਅੱਗੇ ਹੁਕਮ ਨਹੀਂ ਕੀਤਾ ਜਾ ਸਕਦਾ (ਉਸ ਨੂੰ ਇਹ ਨਹੀਂ ਆਖ ਸਕਦੇ-'ਇਉਂ ਨ ਕਰੀਂ, ਇਉਂ ਕਰ')। ਅਕਾਲ ਪੁਰਖ ਪਾਤਿਸ਼ਾਹ ਹੈ, ਪਾਤਿਸ਼ਾਹਾਂ ਦਾ ਭੀ ਪਾਤਿਸ਼ਾਹ ਹੈ। ਹੇ ਨਾਨਕ! (ਜੀਵਾਂ ਨੂੰ) ਉਸ ਦੀ ਰਜ਼ਾ ਵਿਚ ਰਹਿਣਾ (ਹੀ ਫਬਦਾ ਹੈ) ॥੨੭॥`
      },
      {
        number: 28,
        sanskrit: `ਮੁੰਦਾ ਸੰਤੋਖੁ ਸਰਮੁ ਪਤੁ ਝੋਲੀ ਧਿਆਨ ਕੀ ਕਰਹਿ ਬਿਭੂਤਿ ॥
ਖਿੰਥਾ ਕਾਲੁ ਕੁਆਰੀ ਕਾਇਆ ਜੁਗਤਿ ਡੰਡਾ ਪਰਤੀਤਿ ॥
ਆਈ ਪੰਥੀ ਸਗਲ ਜਮਾਤੀ ਮਨਿ ਜੀਤੈ ਜਗੁ ਜੀਤੁ ॥
ਆਦੇਸੁ ਤਿਸੈ ਆਦੇਸੁ ॥
ਆਦਿ ਅਨੀਲੁ ਅਨਾਦਿ ਅਨਾਹਤਿ ਜੁਗੁ ਜੁਗੁ ਏਕੋ ਵੇਸੁ ॥੨੮॥`,
        transliteration: `mundaa santokh saram pat jholee dhiaan kee kareh bibhoot |
khinthaa kaal kuaaree kaaeaa jugat ddanddaa parateet |
aaee panthee sagal jamaatee man jeetai jag jeet |
aades tisai aades |
aad aneel anaad anaahat jug jug eko ves |28|`,
        meaning: `Make contentment your ear-rings, humility your begging bowl, and meditation the ashes you apply to your body. Let the remembrance of death be the patched coat you wear, let the purity of virginity be your way in the world, and let faith in the Lord be your walking stick. See the brotherhood of all mankind as the highest order of Yogis; conquer your own mind, and conquer the world. I bow to Him, I humbly bow. The Primal One, the Pure Light, without beginning, without end. Throughout all the ages, He is One and the Same. ||28||`,
        meaning_hi: `संतोष को अपने कानों के कुण्डल बनाओ, विनम्रता को अपना भिक्षापात्र बनाओ और ध्यान को अपने शरीर पर लगाने वाली राख बनाओ। मृत्यु की स्मृति को आपके द्वारा पहना जाने वाला पैबंद वाला कोट बनने दें, कौमार्य की पवित्रता को दुनिया में आपका रास्ता बनने दें, और प्रभु में विश्वास को आपकी चलने की छड़ी बनने दें। संपूर्ण मानव जाति के भाईचारे को योगियों के सर्वोच्च क्रम के रूप में देखें; अपने मन को जीतो, और दुनिया को जीतो। मैं उनको प्रणाम करता हूं, नम्रतापूर्वक प्रणाम करता हूं। आदिम एक, शुद्ध प्रकाश, जिसका कोई आरंभ नहीं, कोई अंत नहीं। सभी युगों में, वह एक ही है। ||28||`,
        meaning_pa: `(ਹੇ ਜੋਗੀ!) ਜੇ ਤੂੰ ਸੰਤੋਖ ਨੂੰ ਆਪਣੀਆਂ ਮੁੰਦਰਾਂ ਬਣਾਵੇ, ਮਿਹਨਤ ਨੂੰ ਖੱਪਰ ਤੇ ਝੋਲੀ, ਅਤੇ ਅਕਾਲ ਪੁਰਖ ਦੇ ਧਿਆਨ ਦੀ ਸੁਆਹ (ਪਿੰਡੇ ਤੇ ਮਲੇਂ), ਮੌਤ (ਦਾ ਭਉ) ਤੇਰੀ ਗੋਦੜੀ ਹੋਵੇ, ਸਰੀਰ ਨੂੰ ਵਿਕਾਰਾਂ ਤੋਂ ਬਚਾ ਕੇ ਰੱਖਣਾ ਤੇਰੇ ਲਈ ਜੋਗ ਦੀ ਰਹਿਤ ਹੋਵੇ ਅਤੇ ਸ਼ਰਧਾ ਨੂੰ ਡੰਡਾ ਬਣਾਵੇਂ (ਤਾਂ ਅੰਦਰੋਂ ਕੂੜ ਦੀ ਕੰਧ ਟੁੱਟ ਸਕਦੀ ਹੈ)। ਜੋ ਮਨੁੱਖ ਸਾਰੀ ਸ੍ਰਿਸ਼ਟੀ ਦੇ ਜੀਵਾਂ ਨੂੰ ਆਪਣੇ ਸੱਜਣ ਮਿੱਤਰ ਸਮਝਦਾ ਹੈ (ਅਸਲ ਵਿਚ) ਉਹੀ ਆਈ ਪੰਥ ਵਾਲਾ ਹੈ। ਜੇ ਆਪਣਾ ਮਨ ਜਿੱਤਿਆ ਜਾਏ, ਤਾਂ ਸਾਰਾ ਜਗਤ ਹੀ ਜਿੱਤਿਆ ਜਾਂਦਾ ਹੈ (ਭਾਵ, ਤਾਂ ਜਗਤ ਦੀ ਮਾਇਆ ਪਰਮਾਤਮਾ ਤੋਂ ਵਿਛੋੜ ਨਹੀਂ ਸਕਦੀ)। (ਸੋ, ਕੂੜ ਦੀ ਕੰਧ ਦੂਰ ਕਰਨ ਲਈ) ਕੇਵਲ ਉਸ (ਅਕਾਲ ਪੁਰਖ) ਨੂੰ ਪ੍ਰਣਾਮ ਕਰੋ, ਜੋ (ਸਭ ਦਾ) ਮੁੱਢ ਹੈ, ਜੋ ਸੁੱਧ ਸਰੂਪ ਹੈ, ਜਿਸ ਦਾ ਕੋਈ ਮੁੱਢ ਨਹੀਂ (ਲੱਭ ਸਕਦਾ), ਜੋ ਨਾਸ-ਰਹਿਤ ਹੈ ਅਤੇ ਜੋ ਸਦਾ ਹੀ ਇਕੋ ਜਿਹਾ ਰਹਿੰਦਾ ਹੈ ॥੨੮॥`
      },
      {
        number: 29,
        sanskrit: `ਭੁਗਤਿ ਗਿਆਨੁ ਦਇਆ ਭੰਡਾਰਣਿ ਘਟਿ ਘਟਿ ਵਾਜਹਿ ਨਾਦ ॥
ਆਪਿ ਨਾਥੁ ਨਾਥੀ ਸਭ ਜਾ ਕੀ ਰਿਧਿ ਸਿਧਿ ਅਵਰਾ ਸਾਦ ॥
ਸੰਜੋਗੁ ਵਿਜੋਗੁ ਦੁਇ ਕਾਰ ਚਲਾਵਹਿ ਲੇਖੇ ਆਵਹਿ ਭਾਗ ॥
ਆਦੇਸੁ ਤਿਸੈ ਆਦੇਸੁ ॥
ਆਦਿ ਅਨੀਲੁ ਅਨਾਦਿ ਅਨਾਹਤਿ ਜੁਗੁ ਜੁਗੁ ਏਕੋ ਵੇਸੁ ॥੨੯॥`,
        transliteration: `bhugat giaan deaa bhanddaaran ghatt ghatt vaajeh naad |
aap naath naathee sabh jaa kee ridh sidh avaraa saad |
sanjog vijog due kaar chalaaveh lekhe aaveh bhaag |
aades tisai aades |
aad aneel anaad anaahat jug jug eko ves |29|`,
        meaning: `Let spiritual wisdom be your food, and compassion your attendant. The Sound-current of the Naad vibrates in each and every heart. He Himself is the Supreme Master of all; wealth and miraculous spiritual powers, and all other external tastes and pleasures, are all like beads on a string. Union with Him, and separation from Him, come by His Will. We come to receive what is written in our destiny. I bow to Him, I humbly bow. The Primal One, the Pure Light, without beginning, without end. Throughout all the ages, He is One and the Same. ||29||`,
        meaning_hi: `आध्यात्मिक ज्ञान को अपना भोजन और करुणा को अपना सहायक बनने दो। नाद की ध्वनि-धारा प्रत्येक हृदय में स्पंदित होती है। वह स्वयं ही सबका परम स्वामी है; धन और चमत्कारी आध्यात्मिक शक्तियाँ, और अन्य सभी बाहरी स्वाद और सुख, सभी एक डोरी पर मोतियों की तरह हैं। उसके साथ मिलन, और उससे अलगाव, उसकी इच्छा से आते हैं। हमारे भाग्य में जो लिखा है वह हमें प्राप्त होता है। मैं उनको प्रणाम करता हूं, नम्रतापूर्वक प्रणाम करता हूं। आदिम एक, शुद्ध प्रकाश, जिसका कोई आरंभ नहीं, कोई अंत नहीं। सभी युगों में, वह एक ही है। ||29||`,
        meaning_pa: `(ਹੇ ਜੋਗੀ! ਜੇ) ਅਕਾਲ ਪੁਰਖ ਦੀ ਸਰਬ-ਵਿਆਪਕਤਾ ਦਾ ਗਿਆਨ ਤੇਰੇ ਲਈ ਭੰਡਾਰਾ (ਚੂਰਮਾ) ਹੋਵੇ, ਦਇਆ ਇਸ (ਗਿਆਨ-ਰੂਪ) ਭੰਡਾਰੇ ਦੀ ਵਰਤਾਵੀ ਹੋਵੇ, ਹਰੇਕ ਜੀਵ ਦੇ ਅੰਦਰ ਜਿਹੜੀ (ਜ਼ਿੰਦਗੀ ਦੀ ਰੌ ਚੱਲ ਰਹੀ ਹੈ, (ਭੰਡਾਰਾ ਛਕਣ ਵੇਲੇ ਜੇ ਤੇਰੇ ਅੰਦਰ) ਇਹ ਨਾਦੀ ਵੱਜ ਰਹੀ ਹੋਵੇ, ਤੇਰਾ ਨਾਥ ਆਪ ਅਕਾਲ ਪੁਰਖ ਹੋਵੇ, ਜਿਸ ਦੇ ਵੱਸ ਵਿਚ ਸਾਰੀ ਸ੍ਰਿਸ਼ਟੀ ਹੈ, (ਤਾਂ ਕੂੜ ਦੀ ਕੰਧ ਤੇਰੇ ਅੰਦਰੋਂ ਟੁੱਟ ਕੇ ਪਰਮਾਤਮਾ ਨਾਲੋਂ ਤੇਰੀ ਵਿੱਥ ਮਿਟ ਸਕਦੀ ਹੈ। ਜੋਗ ਸਾਧਨਾਂ ਦੀ ਰਾਹੀਂ ਪ੍ਰਾਪਤ ਹੋਈਆਂ ਰਿੱਧੀਆਂ ਵਿਅਰਥ ਹਨ, ਇਹ) ਰਿੱਧੀਆਂ ਤੇ ਸਿੱਧੀਆਂ (ਤਾਂ) ਕਿਸੇ ਹੋਰ ਪਾਸੇ ਖੜਨ ਵਾਲੇ ਸੁਆਦ ਹਨ। ਅਕਾਲ ਪੁਰਖ ਦੀ "ਸੰਜੋਗ" ਸੱਤਾ ਤੇ "ਵਿਜੋਗ" ਸੱਤਾ ਦੋਵੇਂ (ਮਿਲ ਕੇ ਇਸ ਸੰਸਾਰ ਦੀ) ਕਾਰ ਨੂੰ ਚਲਾ ਰਹੀਆਂ ਹਨ (ਭਾਵ, ਪਿਛਲੇ ਸੰਜੋਗਾਂ ਕਰ ਕੇ ਟੱਬਰ ਆਦਿਕਾਂ ਦੇ ਜੀਵ ਇੱਥੇ ਆ ਇਕੱਠੇ ਹੁੰਦੇ ਹਨ। ਰਜ਼ਾ ਵਿਚ ਫਿਰ ਵਿਛੜ ਵਿਛੜ ਕੇ ਆਪੋ-ਆਪਣੀ ਵਾਰੀ ਇੱਥੋਂ ਤੁਰ ਜਾਂਦੇ ਹਨ) ਅਤੇ (ਸਭ ਜੀਵਾਂ ਦੇ ਕੀਤੇ ਕਰਮਾਂ ਦੇ) ਲੇਖ ਅਨੁਸਾਰ (ਦਰਜਾ-ਬ-ਦਰਜਾ ਸੁਖ ਦੁਖ ਦੇ) ਛਾਂਦੇ ਮਿਲ ਰਹੇ ਹਨ (ਜੇ ਇਹ ਯਕੀਨ ਬਣ ਜਾਏ ਤਾਂ ਅੰਦਰੋਂ ਕੂੜ ਦੀ ਕੰਧ ਟੁੱਟ ਜਾਂਦੀ ਹੈ।) (ਸੋ, ਕੂੜ ਦੀ ਕੰਧ ਦੂਰ ਕਰਨ ਲਈ) ਕੇਵਲ ਉਸ (ਅਕਾਲ ਪੁਰਖ) ਨੂੰ ਪ੍ਰਣਾਮ ਕਰੋ, ਜੋ (ਸਭ ਦਾ) ਮੁੱਢ ਹੈ, ਜੋ ਸੁੱਧ ਸਰੂਪ ਹੈ, ਜਿਸ ਦਾ ਕੋਈ ਮੁੱਢ ਨਹੀਂ (ਲੱਭ ਸਕਦਾ), ਜੋ ਨਾਸ ਰਹਿਤ ਹੈ ਅਤੇ ਜੋ ਸਦਾ ਇਕੋ ਜਿਹਾ ਰਹਿੰਦਾ ਹੈ ॥੨੯॥`
      },
      {
        number: 30,
        sanskrit: `ਏਕਾ ਮਾਈ ਜੁਗਤਿ ਵਿਆਈ ਤਿਨਿ ਚੇਲੇ ਪਰਵਾਣੁ ॥
ਇਕੁ ਸੰਸਾਰੀ ਇਕੁ ਭੰਡਾਰੀ ਇਕੁ ਲਾਏ ਦੀਬਾਣੁ ॥
ਜਿਵ ਤਿਸੁ ਭਾਵੈ ਤਿਵੈ ਚਲਾਵੈ ਜਿਵ ਹੋਵੈ ਫੁਰਮਾਣੁ ॥
ਓਹੁ ਵੇਖੈ ਓਨਾ ਨਦਰਿ ਨ ਆਵੈ ਬਹੁਤਾ ਏਹੁ ਵਿਡਾਣੁ ॥
ਆਦੇਸੁ ਤਿਸੈ ਆਦੇਸੁ ॥
ਆਦਿ ਅਨੀਲੁ ਅਨਾਦਿ ਅਨਾਹਤਿ ਜੁਗੁ ਜੁਗੁ ਏਕੋ ਵੇਸੁ ॥੩੦॥`,
        transliteration: `ekaa maaee jugat viaaee tin chele paravaan |
eik sansaaree ik bhanddaaree ik laae deebaan |
jiv tis bhaavai tivai chalaavai jiv hovai furamaan |
ohu vekhai onaa nadar na aavai bahutaa ehu viddaan |
aades tisai aades |
aad aneel anaad anaahat jug jug eko ves |30|`,
        meaning: `The One Divine Mother conceived and gave birth to the three deities. One, the Creator of the World; One, the Sustainer; and One, the Destroyer. He makes things happen according to the Pleasure of His Will. Such is His Celestial Order. He watches over all, but none see Him. How wonderful this is! I bow to Him, I humbly bow. The Primal One, the Pure Light, without beginning, without end. Throughout all the ages, He is One and the Same. ||30||`,
        meaning_hi: `एक दिव्य माँ ने गर्भ धारण किया और तीन देवताओं को जन्म दिया। एक, विश्व का रचयिता; एक, पालनकर्ता; और एक, विध्वंसक। वह चीज़ों को अपनी इच्छा के अनुसार घटित करता है। ऐसा उनका दिव्य आदेश है। वह सब पर दृष्टि रखता है, परन्तु कोई उसे नहीं देखता। यह कितना अद्भुत है! मैं उनको प्रणाम करता हूं, नम्रतापूर्वक प्रणाम करता हूं। आदिम एक, शुद्ध प्रकाश, जिसका कोई आरंभ नहीं, कोई अंत नहीं। सभी युगों में, वह एक ही है। ||30||`,
        meaning_pa: `(ਲੋਕਾਂ ਵਿਚ ਇਹ ਖ਼ਿਆਲ ਆਮ ਪ੍ਰਚੱਲਤ ਹੈ ਕਿ) ਇਕੱਲੀ ਮਾਇਆ (ਕਿਸੇ) ਜੁਗਤੀ ਨਾਲ ਪ੍ਰਸੂਤ ਹੋਈ ਤੇ ਪਰਤੱਖ ਤੌਰ 'ਤੇ ਉਸ ਦੇ ਤਿੰਨ ਪੁੱਤਰ ਜੰਮ ਪਏ। ਉਹਨਾਂ ਵਿਚੋਂ ਇਕ (ਬ੍ਰਹਮਾ) ਘਰਬਾਰੀ ਬਣ ਗਿਆ (ਭਾਵ, ਜੀਵ-ਜੰਤਾਂ ਨੂੰ ਪੈਦਾ ਕਰਨ ਲੱਗ ਪਿਆ), ਇਕ (ਵਿਸ਼ਨੂੰ) ਭੰਡਾਰੇ ਦਾ ਮਾਲਕ ਬਣ ਗਿਆ (ਭਾਵ, ਜੀਵਾਂ ਨੂੰ ਰਿਜ਼ਕ ਅਪੜਾਣ ਦਾ ਕੰਮ ਕਰਨ ਲੱਗਾ), ਅਤੇ ਇੱਕ (ਸ਼ਿਵ) ਕਚਹਿਰੀ ਲਾਉਂਦਾ ਹੈ (ਭਾਵ, ਜੀਵਾਂ ਨੂੰ ਸੰਘਾਰਦਾ ਹੈ)। (ਪਰ ਅਸਲ ਗੱਲ ਇਹ ਹੈ ਕਿ) ਜਿਵੇਂ ਉਸ ਅਕਾਲ ਪੁਰਖ ਨੂੰ ਭਾਉਂਦਾ ਹੈ ਅਤੇ ਜਿਵੇਂ ਉਸ ਦਾ ਹੁਕਮ ਹੁੰਦਾ ਹੈ, ਤਿਵੇਂ ਹੀ ਉਹ ਆਪ ਸੰਸਾਰ ਦੀ ਕਾਰ ਚਲਾ ਰਿਹਾ ਹੈ, (ਇਹਨਾਂ ਬ੍ਰਹਮਾ, ਵਿਸ਼ਨੂੰ ਅਤੇ ਸ਼ਿਵ ਦੇ ਕੁਝ ਹੱਥ ਨਹੀਂ)। ਇਹ ਬੜਾ ਅਸਚਰਜ ਕੌਤਕ ਹੈ ਕਿ ਉਹ ਅਕਾਲ ਪੁਰਖ (ਸਭ ਜੀਵਾਂ ਨੂੰ) ਵੇਖ ਰਿਹਾ ਹੈ ਪਰ ਜੀਵਾਂ ਨੂੰ ਅਕਾਲ ਪੁਰਖ ਨਹੀਂ ਦਿੱਸਦਾ। (ਸੋ ਬ੍ਰਹਮਾ, ਵਿਸ਼ਨੂੰ, ਸ਼ਿਵ ਆਦਿਕ ਦੇ ਥਾਂ) ਕੇਵਲ ਉਸ (ਅਕਾਲ ਪੁਰਖ) ਨੂੰ ਪ੍ਰਣਾਮ ਕਰੋ, ਜੋ (ਸਭ ਦਾ) ਮੁੱਢ ਹੈ, ਜੋ ਸ਼ੁੱਧ ਸਰੂਪ ਹੈ, ਜਿਸ ਦਾ ਕੋਈ ਮੁੱਢ ਨਹੀਂ (ਲੱਭ ਸਕਦਾ), ਜੋ ਨਾਸ ਰਹਿਤ ਹੈ ਅਤੇ ਜੋ ਸਦਾ ਹੀ ਇਕੋ ਜਿਹਾ ਰਹਿੰਦਾ ਹੈ। (ਇਹੀ ਹੈ ਵਸੀਲਾ ਉਸ ਪ੍ਰਭੂ ਨਾਲੋਂ ਵਿੱਥ ਦੂਰ ਕਰਨ ਦਾ) ॥੩੦॥`
      },
      {
        number: 31,
        sanskrit: `ਆਸਣੁ ਲੋਇ ਲੋਇ ਭੰਡਾਰ ॥
ਜੋ ਕਿਛੁ ਪਾਇਆ ਸੁ ਏਕਾ ਵਾਰ ॥
ਕਰਿ ਕਰਿ ਵੇਖੈ ਸਿਰਜਣਹਾਰੁ ॥
ਨਾਨਕ ਸਚੇ ਕੀ ਸਾਚੀ ਕਾਰ ॥
ਆਦੇਸੁ ਤਿਸੈ ਆਦੇਸੁ ॥
ਆਦਿ ਅਨੀਲੁ ਅਨਾਦਿ ਅਨਾਹਤਿ ਜੁਗੁ ਜੁਗੁ ਏਕੋ ਵੇਸੁ ॥੩੧॥`,
        transliteration: `aasan loe loe bhanddaar |
jo kichh paaeaa su ekaa vaar |
kar kar vekhai sirajanahaar |
naanak sache kee saachee kaar |
aades tisai aades |
aad aneel anaad anaahat jug jug eko ves |31|`,
        meaning: `On world after world are His Seats of Authority and His Storehouses. Whatever was put into them, was put there once and for all. Having created the creation, the Creator Lord watches over it. O Nanak, True is the Creation of the True Lord. I bow to Him, I humbly bow. The Primal One, the Pure Light, without beginning, without end. Throughout all the ages, He is One and the Same. ||31||`,
        meaning_hi: `दुनिया-दर-दुनिया में उनके अधिकार के स्थान और उनके भण्डार हैं। उनमें जो कुछ भी डाला गया, वह हमेशा के लिए डाल दिया गया। सृष्टि रचने के बाद, सृष्टिकर्ता भगवान इसकी देखरेख करते हैं। हे नानक, सत्य सच्चे प्रभु की रचना है। मैं उनको प्रणाम करता हूं, नम्रतापूर्वक प्रणाम करता हूं। आदिम एक, शुद्ध प्रकाश, जिसका कोई आरंभ नहीं, कोई अंत नहीं। सभी युगों में, वह एक ही है। ||31||`,
        meaning_pa: `ਅਕਾਲ ਪੁਰਖ ਦੇ ਭੰਡਾਰਿਆਂ ਦਾ ਟਿਕਾਣਾ ਹਰੇਕ ਭਵਨ ਵਿਚ ਹੈ (ਭਾਵ, ਹਰੇਕ ਭਵਨ ਵਿਚ ਅਕਾਲ ਪੁਰਖ ਦੇ ਭੰਡਾਰੇ ਚੱਲ ਰਹੇ ਹਨ)। ਜੋ ਕੁਝ (ਅਕਾਲ ਪੁਰਖ ਨੇ ਉਹਨਾਂ ਭੰਡਾਰਿਆਂ ਵਿਚ) ਪਾਇਆ ਹੈ ਇਕੋ ਵਾਰੀ ਪਾ ਦਿੱਤਾ ਹੈ, (ਭਾਵ, ਉਸ ਦੇ ਭੰਡਾਰੇ ਸਦਾ ਅਖੁੱਟ ਹਨ)। ਸ੍ਰਿਸ਼ਟੀ ਨੂੰ ਪੈਦਾ ਕਰਨ ਵਾਲਾ ਅਕਾਲ ਪੁਰਖ (ਜੀਵਾਂ ਨੂੰ) ਪੈਦਾ ਕਰ ਕੇ (ਉਹਨਾਂ ਦੀ) ਸੰਭਾਲ ਕਰ ਰਿਹਾ ਹੈ। ਹੇ ਨਾਨਕ! ਸਦਾ-ਥਿਰ ਰਹਿਣ ਵਾਲੇ (ਅਕਾਲ ਪੁਰਖ) ਦੀ (ਸ੍ਰਿਸ਼ਟੀ ਦੀ ਸੰਭਾਂਲ ਵਾਲੀ) ਇਹ ਕਾਰ ਸਦਾ ਅਟੱਲ ਹੈ (ਉਕਾਈ ਤੋਂ ਖ਼ਾਲੀ ਹੈ)। (ਸੋ) ਕੇਵਲ ਉਸ (ਅਕਾਲ ਪੁਰਖ) ਨੂੰ ਪ੍ਰਣਾਮ ਕਰੋ, ਜੋ (ਸਭ ਦਾ) ਮੁੱਢ ਹੈ, ਜੋ ਸੁੱਧ-ਸਰੂਪ ਹੈ, ਜਿਸ ਦਾ ਕੋਈ ਮੁੱਢ ਨਹੀਂ (ਲੱਭ ਸਕਦਾ), ਜੋ ਨਾਸ-ਰਹਿਤ ਹੈ ਅਤੇ ਜੋ ਸਦਾ ਹੀ ਇਕੋ ਜਿਹਾ ਰਹਿੰਦਾ ਹੈ (ਇਹੀ ਹੈ ਤਰੀਕਾ, ਜਿਸ ਨਾਲ ਉਸ ਪ੍ਰਭੂ ਨਾਲੋਂ ਵਿੱਥ ਮਿਟ ਸਕਦੀ ਹੈ) ॥੩੧॥`
      },
      {
        number: 32,
        sanskrit: `ਇਕ ਦੂ ਜੀਭੌ ਲਖ ਹੋਹਿ ਲਖ ਹੋਵਹਿ ਲਖ ਵੀਸ ॥
ਲਖੁ ਲਖੁ ਗੇੜਾ ਆਖੀਅਹਿ ਏਕੁ ਨਾਮੁ ਜਗਦੀਸ ॥
ਏਤੁ ਰਾਹਿ ਪਤਿ ਪਵੜੀਆ ਚੜੀਐ ਹੋਇ ਇਕੀਸ ॥
ਸੁਣਿ ਗਲਾ ਆਕਾਸ ਕੀ ਕੀਟਾ ਆਈ ਰੀਸ ॥
ਨਾਨਕ ਨਦਰੀ ਪਾਈਐ ਕੂੜੀ ਕੂੜੈ ਠੀਸ ॥੩੨॥`,
        transliteration: `eik doo jeebhau lakh hohi lakh hoveh lakh vees |
lakh lakh gerraa aakheeeh ek naam jagadees |
et raeh pat pavarreea charreeai hoe ikees |
sun galaa aakaas kee keettaa aaee rees |
naanak nadaree paaeeai koorree koorrai tthees |32|`,
        meaning: `If I had 100,000 tongues, and these were then multiplied twenty times more, with each tongue, I would repeat, hundreds of thousands of times, the Name of the One, the Lord of the Universe. Along this path to our Husband Lord, we climb the steps of the ladder, and come to merge with Him. Hearing of the etheric realms, even worms long to come back home. O Nanak, by His Grace He is obtained. False are the boastings of the false. ||32||`,
        meaning_hi: `यदि मेरे पास 100,000 जीभें होतीं, और फिर इन्हें बीस गुना अधिक कर दिया जाता, तो मैं प्रत्येक जीभ के साथ, सैकड़ों-हजारों बार, उस एक, ब्रह्मांड के भगवान का नाम दोहराता। अपने पति भगवान के इस मार्ग पर, हम सीढ़ी की सीढ़ियाँ चढ़ते हैं, और उनके साथ विलीन हो जाते हैं। ईथर लोकों के बारे में सुनकर, कीड़े भी घर वापस आने के लिए उत्सुक रहते हैं। हे नानक, उसकी कृपा से वह प्राप्त होता है। झूठ का घमंड झूठा है। ||32||`,
        meaning_pa: `ਜੇ ਇੱਕ ਜੀਭ ਤੋਂ ਲੱਖ ਜੀਭਾਂ ਹੋ ਜਾਣ, ਅਤੇ ਲੱਖ ਜੀਭਾਂ ਤੋਂ ਵੀਹ ਲੱਖ ਬਣ ਜਾਣ, (ਇਹਨਾਂ ਵੀਹ ਲੱਖ ਜੀਭਾਂ ਨਾਲ ਜੇ) ਅਕਾਲ ਪੁਰਖ ਦੇ ਇਕ ਨਾਮ ਨੂੰ ਇਕ ਇਕ ਲੱਖ ਵਾਰੀ ਆਖੀਏ (ਤਾਂ ਭੀ ਕੂੜੇ ਮਨੁੱਖ ਦੀ ਇਹ ਕੂੜੀ ਹੀ ਠੀਸ ਹੈ, ਭਾਵ, ਜੇ ਮਨੁੱਖ ਇਹ ਖ਼ਿਆਲ ਕਰੇ ਕਿ ਮੈਂ ਆਪਣੇ ਉੱਦਮ ਦੇ ਆਸਰੇ ਇਸ ਤਰ੍ਹਾਂ ਨਾਮ ਸਿਮਰ ਕੇ ਅਕਾਲ ਪੁਰਖ ਨੂੰ ਪਾ ਸਕਦਾ ਹਾਂ, ਤਾਂ ਇਹ ਝੂਠਾ ਅਹੰਕਾਰ ਹੈ)। ਇਸ ਰਸਤੇ ਵਿਚ (ਪਰਮਾਤਮਾ ਨਾਲੋਂ ਵਿੱਥ ਦੂਰ ਕਰਨ ਵਾਲੇ ਰਾਹ ਵਿਚ) ਅਕਾਲ ਪੁਰਖ ਨੂੰ ਮਿਲਣ ਵਾਸਤੇ ਜੋ ਪਉੜੀਆਂ ਹਨ, ਉਹਨਾਂ ਉੱਤੇ ਆਪਾ-ਭਾਵ ਗਵਾ ਕੇ ਹੀ ਚੜ੍ਹ ਸਕੀਦਾ ਹੈ। (ਲੱਖਾਂ ਜੀਭਾਂ ਨਾਲ ਭੀ ਗਿਣਤੀ ਦੇ ਸਿਮਰਨ ਨਾਲ ਕੁਝ ਨਹੀਂ ਬਣਦਾ। ਆਪਾ-ਭਾਵ ਦੂਰ ਕਰਨ ਤੋਂ ਬਿਨਾ ਇਹ ਗਿਣਤੀ ਦੇ ਪਾਠਾਂ ਵਾਲਾ ਉੱਦਮ ਇਉਂ ਹੈ, ਮਾਨੋ) ਆਕਾਸ਼ ਦੀਆਂ ਗੱਲਾਂ ਸੁਣ ਕੇ ਕੀੜਿਆਂ ਨੂੰ ਭੀ ਇਹ ਰੀਸ ਆ ਗਈ ਹੈ (ਕਿ ਅਸੀਂ ਭੀ ਆਕਾਸ਼ ਤੇ ਅੱਪੜ ਜਾਈਏ)। ਹੇ ਨਾਨਕ! ਜੇ ਅਕਾਲ ਪੁਰਖ ਮਿਹਰ ਦੀ ਨਜ਼ਰ ਕਰੇ, ਤਾਂ ਹੀ ਉਸ ਨੂੰ ਮਿਲੀਦਾ ਹੈ, (ਨਹੀਂ ਤਾਂ) ਕੂੜੇ ਮਨੁੱਖ ਦੀ ਆਪਣੇ ਆਪ ਦੀ ਨਿਰੀ ਕੂੜੀ ਹੀ ਵਡਿਆਈ ਹੈ (ਕਿ ਮੈਂ ਸਿਮਰਨ ਕਰ ਰਿਹਾ ਹਾਂ) ॥੩੨॥`
      },
      {
        number: 33,
        sanskrit: `ਆਖਣਿ ਜੋਰੁ ਚੁਪੈ ਨਹ ਜੋਰੁ ॥
ਜੋਰੁ ਨ ਮੰਗਣਿ ਦੇਣਿ ਨ ਜੋਰੁ ॥
ਜੋਰੁ ਨ ਜੀਵਣਿ ਮਰਣਿ ਨਹ ਜੋਰੁ ॥
ਜੋਰੁ ਨ ਰਾਜਿ ਮਾਲਿ ਮਨਿ ਸੋਰੁ ॥
ਜੋਰੁ ਨ ਸੁਰਤੀ ਗਿਆਨਿ ਵੀਚਾਰਿ ॥
ਜੋਰੁ ਨ ਜੁਗਤੀ ਛੁਟੈ ਸੰਸਾਰੁ ॥
ਜਿਸੁ ਹਥਿ ਜੋਰੁ ਕਰਿ ਵੇਖੈ ਸੋਇ ॥
ਨਾਨਕ ਉਤਮੁ ਨੀਚੁ ਨ ਕੋਇ ॥੩੩॥`,
        transliteration: `aakhan jor chupai neh jor |
jor na mangan den na jor |
jor na jeevan maran neh jor |
jor na raaj maal man sor |
jor na suratee giaan veechaar |
jor na jugatee chhuttai sansaar |
jis hath jor kar vekhai soe |
naanak utam neech na koe |33|`,
        meaning: `No power to speak, no power to keep silent. No power to beg, no power to give. No power to live, no power to die. No power to rule, with wealth and occult mental powers. No power to gain intuitive understanding, spiritual wisdom and meditation. No power to find the way to escape from the world. He alone has the Power in His Hands. He watches over all. O Nanak, no one is high or low. ||33||`,
        meaning_hi: `न बोलने की शक्ति, न चुप रहने की शक्ति। न माँगने की शक्ति, न देने की शक्ति। न जीने की शक्ति, न मरने की शक्ति। धन और गुप्त मानसिक शक्तियों के साथ शासन करने की कोई शक्ति नहीं। सहज समझ, आध्यात्मिक ज्ञान और ध्यान प्राप्त करने की कोई शक्ति नहीं। संसार से मुक्ति का मार्ग ढूंढने की शक्ति नहीं। केवल उसी के हाथ में शक्ति है। वह सब पर नजर रखता है. हे नानक, कोई ऊंचा या नीचा नहीं है। ||33||`,
        meaning_pa: `ਬੋਲਣ ਵਿਚ ਤੇ ਚੁੱਪ ਰਹਿਣ ਵਿਚ ਭੀ ਸਾਡਾ ਕੋਈ ਆਪਣਾ ਇਖ਼ਤਿਆਰ ਨਹੀਂ ਹੈ। ਨਾ ਹੀ ਮੰਗਣ ਵਿਚ ਸਾਡੀ ਮਨ-ਮਰਜ਼ੀ ਚੱਲਦੀ ਹੈ ਅਤੇ ਨਾ ਹੀ ਦੇਣ ਵਿਚ। ਜੀਵਨ ਵਿਚ ਤੇ ਮਰਨ ਵਿਚ ਭੀ ਸਾਡੀ ਕੋਈ ਸਮਰਥਾ (ਕੰਮ ਨਹੀਂ ਦੇਂਦੀ)। ਇਸ ਰਾਜ ਤੇ ਮਾਲ ਦੇ ਪ੍ਰਾਪਤ ਕਰਨ ਵਿਚ ਭੀ ਸਾਡਾ ਕੋਈ ਜ਼ੋਰ ਨਹੀਂ ਚੱਲਦਾ (ਜਿਸ ਰਾਜ ਤੇ ਮਾਲ ਦੇ ਕਾਰਨ ਸਾਡੇ) ਮਨ ਵਿਚ ਫੂੰ-ਫਾਂ ਹੁੰਦੀ ਹੈ। ਆਤਮਾਕ ਜਾਗ ਵਿਚ, ਗਿਆਨ ਵਿਚ ਅਤੇ ਵਿਚਾਰ ਵਿਚ ਰਹਿਣ ਦੀ ਭੀ ਸਾਡੀ ਸਮਰਥਾ ਨਹੀਂ ਹੈ। ਉਸ ਜੁਗਤੀ ਵਿਚ ਰਹਿਣ ਲਈ ਭੀ ਸਾਡਾ ਇਖ਼ਤਿਆਰ ਨਹੀਂ ਹੈ, ਜਿਸ ਕਰ ਕੇ ਜਨਮ ਮਰਨ ਮੁੱਕ ਜਾਂਦਾ ਹੈ। ਉਹੀ ਅਕਾਲ-ਪੁਰਖ ਰਚਨਾ ਰਚ ਕੇ (ਉਸ ਦੀ ਹਰ ਪਰਕਾਰ) ਸੰਭਾਲ ਕਰਦਾ ਹੈ, ਜਿਸ ਦੇ ਹੱਥ ਵਿਚ ਸਮਰੱਥਾ ਹੈ। ਹੇ ਨਾਨਕ! ਆਪਣੇ ਆਪ ਵਿਚ ਨਾਹ ਕੋਈ ਮਨੁੱਖ ਉੱਤਮ ਹੈ ਅਤੇ ਨਾਹ ਹੀ ਨੀਚ (ਭਾਵ, ਜੀਵਾਂ ਨੂੰ ਸਦਾਚਾਰੀ ਜਾਂ ਦੁਰਾਚਾਰੀ ਬਣਾਣ ਵਾਲਾ ਉਹ ਪ੍ਰਭੂ ਆਪ ਹੀ ਹੈ। ਜੇ ਸਿਮਰਨ ਦੀ ਬਰਕਤਿ ਨਾਲ ਇਹ ਨਿਸਚਾ ਬਣ ਜਾਏ ਤਾਂ ਹੀ ਪਰਮਾਤਮਾਂ ਨਾਲੋਂ ਜੀਵ ਦੀ ਵਿੱਥ ਦੂਰ ਹੁੰਦੀ ਹੈ) ॥੩੩॥`
      },
      {
        number: 34,
        sanskrit: `ਰਾਤੀ ਰੁਤੀ ਥਿਤੀ ਵਾਰ ॥
ਪਵਣ ਪਾਣੀ ਅਗਨੀ ਪਾਤਾਲ ॥
ਤਿਸੁ ਵਿਚਿ ਧਰਤੀ ਥਾਪਿ ਰਖੀ ਧਰਮ ਸਾਲ ॥
ਤਿਸੁ ਵਿਚਿ ਜੀਅ ਜੁਗਤਿ ਕੇ ਰੰਗ ॥
ਤਿਨ ਕੇ ਨਾਮ ਅਨੇਕ ਅਨੰਤ ॥
ਕਰਮੀ ਕਰਮੀ ਹੋਇ ਵੀਚਾਰੁ ॥
ਸਚਾ ਆਪਿ ਸਚਾ ਦਰਬਾਰੁ ॥
ਤਿਥੈ ਸੋਹਨਿ ਪੰਚ ਪਰਵਾਣੁ ॥
ਨਦਰੀ ਕਰਮਿ ਪਵੈ ਨੀਸਾਣੁ ॥
ਕਚ ਪਕਾਈ ਓਥੈ ਪਾਇ ॥
ਨਾਨਕ ਗਇਆ ਜਾਪੈ ਜਾਇ ॥੩੪॥`,
        transliteration: `raatee rutee thitee vaar |
pavan paanee aganee paataal |
tis vich dharatee thaap rakhee dharam saal |
tis vich jeea jugat ke rang |
tin ke naam anek anant |
karamee karamee hoe veechaar |
sachaa aap sachaa darabaar |
tithai sohan panch paravaan |
nadaree karam pavai neesaan |
kach pakaaee othai paae |
naanak geaa jaapai jaae |34|`,
        meaning: `Nights, days, weeks and seasons; wind, water, fire and the nether regions in the midst of these, He established the earth as a home for Dharma. Upon it, He placed the various species of beings. Their names are uncounted and endless. By their deeds and their actions, they shall be judged. God Himself is True, and True is His Court. There, in perfect grace and ease, sit the self-elect, the self-realized Saints. They receive the Mark of Grace from the Merciful Lord. The ripe and the unripe, the good and the bad, shall there be judged. O Nanak, when you go home, you will see this. ||34||`,
        meaning_hi: `रातें, दिन, सप्ताह और ऋतुएँ; वायु, जल, अग्नि और पाताल इनके बीच में उन्होंने पृथ्वी को धर्म के घर के रूप में स्थापित किया। उस पर, उसने प्राणियों की विभिन्न प्रजातियों को रखा। उनके नाम अनगिनत और अनंत हैं। उनके कर्मों और कार्यों के आधार पर उनका न्याय किया जाएगा। ईश्वर स्वयं सत्य है, और उसका दरबार भी सत्य है। वहाँ, पूर्ण कृपा और सहजता से, स्व-निर्वाचित, आत्म-साक्षात्कारी संत बैठे हैं। वे दयालु प्रभु से अनुग्रह का चिह्न प्राप्त करते हैं। वहां पके और कच्चे, अच्छे और बुरे का न्याय किया जाएगा। हे नानक, जब तुम घर जाओगे तो यह देखोगे। ||34||`,
        meaning_pa: `ਰਾਤਾਂ, ਰੁੱਤਾਂ, ਥਿਤਾਂ ਅਤੇ ਵਾਰ, ਹਵਾ, ਪਾਣੀ, ਅੱਗ ਅਤੇ ਪਾਤਾਲ- ਇਹਨਾਂ ਸਾਰਿਆਂ ਦੇ ਇਕੱਠ ਵਿਚ (ਅਕਾਲ ਪੁਰਖ ਨੇ) ਧਰਤੀ ਨੂੰ ਧਰਮ ਕਮਾਣ ਦਾ ਅਸਥਾਨ ਬਣਾ ਕੇ ਟਿਕਾ ਦਿੱਤਾ ਹੈ। ਇਸ ਧਰਤੀ ਉੱਤੇ ਕਈ ਜੁਗਤੀਆਂ ਅਤੇ ਰੰਗਾਂ ਦੇ ਜੀਵ (ਵੱਸਦੇ ਹਨ), ਜਿਨ੍ਹਾਂ ਦੇ ਅਨੇਕਾਂ ਤੇ ਅਨਗਿਣਤ ਹੀ ਨਾਮ ਹਨ। (ਇਹਨਾਂ ਅਨੇਕਾਂ ਨਾਵਾਂ ਤੇ ਰੰਗਾਂ ਵਾਲੇ ਜੀਵਾਂ ਦੇ) ਆਪੋ-ਆਪਣੇ ਕੀਤੇ ਹੋਏ ਕਰਮਾਂ ਅਨੁਸਾਰ (ਅਕਾਲ ਪੁਰਖ ਦੇ ਦਰ ਤੇ) ਨਿਬੇੜਾ ਹੁੰਦਾ ਹੈ (ਜਿਸ ਵਿਚ ਕੋਈ ਉਕਾਈ ਨਹੀਂ ਹੁੰਦੀ, ਕਿਉਂਕਿ ਨਿਆਂ ਕਰਨ ਵਾਲਾ) ਅਕਾਲ ਪੁਰਖ ਆਪ ਸੱਚਾ ਹੈ, ਉਸਦਾ ਦਰਬਾਰ ਭੀ ਸੱਚਾ ਹੈ। ਉਸ ਦਰਬਾਰ ਵਿਚ ਸੰਤ ਜਨ ਪਰਤੱਖ ਤੌਰ 'ਤੇ ਸੋਭਦੇ ਹਨ, ਅਤੇ ਮਿਹਰ ਦੀ ਨਜ਼ਰ ਕਰਨ ਵਾਲੇ ਅਕਾਲ ਪੁਰਖ ਦੀ ਬਖਸ਼ਸ਼ ਨਾਲ (ਉਹਨਾਂ ਸੰਤ ਜਨਾਂ ਦੇ ਮੱਥੇ ਉਤੇ) ਵਡਿਆਈ ਦਾ ਨਿਸ਼ਾਨ ਚਮਕ ਪੈਂਦਾ ਹੈ। (ਇੱਥੇ ਸੰਸਾਰ ਵਿਚ ਕਿਸੇ ਦਾ ਵੱਡਾ ਛੋਟਾ ਅਖਵਾਣਾ ਕਿਸੇ ਅਰਥ ਨਹੀਂ, ਇਹਨਾਂ ਦੀ) ਕਚਿਆਈ ਪਕਿਆਈ ਅਕਾਲ ਪੁਰਖ ਦੇ ਦਰ ਤੇ ਜਾ ਕੇ ਮਲੂਮ ਹੁੰਦੀ ਹੈ। ਹੇ ਨਾਨਕ! ਅਕਾਲ ਪੁਰਖ ਦੇ ਦਰ 'ਤੇ ਗਿਆਂ ਹੀ ਸਮਝ ਅਉਂਦੀ ਹੈ (ਕਿ ਅਸਲ ਵਿਚ ਕੌਣ ਪੱਕਾ ਹੈ ਤੇ ਕੌਣ ਕੱਚਾ) ॥੩੪॥`
      },
      {
        number: 35,
        sanskrit: `ਧਰਮ ਖੰਡ ਕਾ ਏਹੋ ਧਰਮੁ ॥
ਗਿਆਨ ਖੰਡ ਕਾ ਆਖਹੁ ਕਰਮੁ ॥
ਕੇਤੇ ਪਵਣ ਪਾਣੀ ਵੈਸੰਤਰ ਕੇਤੇ ਕਾਨ ਮਹੇਸ ॥
ਕੇਤੇ ਬਰਮੇ ਘਾੜਤਿ ਘੜੀਅਹਿ ਰੂਪ ਰੰਗ ਕੇ ਵੇਸ ॥
ਕੇਤੀਆ ਕਰਮ ਭੂਮੀ ਮੇਰ ਕੇਤੇ ਕੇਤੇ ਧੂ ਉਪਦੇਸ ॥
ਕੇਤੇ ਇੰਦ ਚੰਦ ਸੂਰ ਕੇਤੇ ਕੇਤੇ ਮੰਡਲ ਦੇਸ ॥
ਕੇਤੇ ਸਿਧ ਬੁਧ ਨਾਥ ਕੇਤੇ ਕੇਤੇ ਦੇਵੀ ਵੇਸ ॥
ਕੇਤੇ ਦੇਵ ਦਾਨਵ ਮੁਨਿ ਕੇਤੇ ਕੇਤੇ ਰਤਨ ਸਮੁੰਦ ॥
ਕੇਤੀਆ ਖਾਣੀ ਕੇਤੀਆ ਬਾਣੀ ਕੇਤੇ ਪਾਤ ਨਰਿੰਦ ॥
ਕੇਤੀਆ ਸੁਰਤੀ ਸੇਵਕ ਕੇਤੇ ਨਾਨਕ ਅੰਤੁ ਨ ਅੰਤੁ ॥੩੫॥`,
        transliteration: `dharam khandd kaa eho dharam |
giaan khandd kaa aakhahu karam |
kete pavan paanee vaisantar kete kaan mahes |
kete barame ghaarrat gharreeeh roop rang ke ves |
keteea karam bhoomee mer kete kete dhoo upades |
kete ind chand soor kete kete manddal des |
kete sidh budh naath kete kete devee ves |
kete dev daanav mun kete kete ratan samund |
keteea khaanee keteea baanee kete paat narind |
keteea suratee sevak kete naanak ant na ant |35|`,
        meaning: `This is righteous living in the realm of Dharma. And now we speak of the realm of spiritual wisdom. So many winds, waters and fires; so many Krishnas and Shivas. So many Brahmas, fashioning forms of great beauty, adorned and dressed in many colors. So many worlds and lands for working out karma. So very many lessons to be learned! So many Indras, so many moons and suns, so many worlds and lands. So many Siddhas and Buddhas, so many Yogic masters. So many goddesses of various kinds. So many demi-gods and demons, so many silent sages. So many oceans of jewels. So many ways of life, so many languages. So many dynasties of rulers. So many intuitive people, so many selfless servants. O Nanak, His limit has no limit! ||35||`,
        meaning_hi: `यह धर्म के दायरे में रहना धर्मनिष्ठ है। और अब हम आध्यात्मिक ज्ञान के क्षेत्र की बात करते हैं। इतनी हवाएँ, पानी और आग; इतने सारे कृष्ण और शिव। इतने सारे ब्रह्मा, महान सौंदर्य के रूप धारण करते हुए, विभिन्न रंगों से सुसज्जित और सुसज्जित थे। कर्म करने के लिए इतने सारे लोक और भूमि। सीखने के लिए बहुत सारे सबक हैं! इतने सारे इंद्र, इतने सारे चंद्रमा और सूर्य, इतने सारे लोक और भूमि। इतने सारे सिद्ध और बुद्ध, इतने सारे योग गुरु। विभिन्न प्रकार की अनेक देवियाँ। इतने सारे देवता और राक्षस, इतने सारे मौन ऋषि। रत्नों के कितने सागर। जीवन के इतने सारे तरीके, इतनी सारी भाषाएँ। शासकों के इतने सारे राजवंश. इतने सारे अंतर्ज्ञानी लोग, इतने सारे निस्वार्थ सेवक। हे नानक, उसकी सीमा की कोई सीमा नहीं है! ||35||`,
        meaning_pa: `ਧਰਮ ਖੰਡ ਦਾ ਨਿਰਾ ਇਹੀ ਕਰਤੱਬ ਹੈ, (ਜੋ ਉੱਪਰ ਦੱਸਿਆ ਗਿਆ ਹੈ)। ਹੁਣ ਗਿਆਨ ਖੰਡ ਦਾ ਕਰਤੱਬ (ਭੀ) ਸਮਝ ਲਵੋ (ਜੋ ਅਗਲੀਆਂ ਤੁਕਾਂ ਵਿਚ ਹੈ)। (ਅਕਾਲ ਪੁਰਖ ਦੀ ਰਚਨਾ ਵਿਚ) ਕਈ ਪ੍ਰਕਾਰ ਦੇ ਪਉਣ, ਪਾਣੀ ਤੇ ਅਗਨੀਆਂ ਹਨ, ਕਈ ਕ੍ਰਿਸ਼ਨ ਹਨ ਤੇ ਕਈ ਸ਼ਿਵ ਹਨ। ਕਈ ਬ੍ਰਹਮੇ ਪੈਦਾ ਕੀਤੇ ਜਾ ਰਹੇ ਹਨ, ਜਿਨ੍ਹਾਂ ਦੇ ਕਈ ਰੂਪ, ਕਈ ਰੰਗ ਤੇ ਕਈ ਵੇਸ ਹਨ। (ਅਕਾਲ ਪੁਰਖ ਦੀ ਕੁਦਰਤਿ ਵਿਚ) ਬੇਅੰਤ ਧਰਤੀਆਂ ਹਨ, ਬੇਅੰਤ ਮੇਰੂ ਪਰਬਤ, ਬੇਅੰਤ ਧ੍ਰੂਅ ਭਗਤ ਤੇ ਉਹਨਾਂ ਦੇ ਉਪਦੇਸ਼ ਹਨ। ਬੇਅੰਤ ਇੰਦਰ ਦੇਵਤੇ, ਚੰਦ੍ਰਮਾ, ਬੇਅੰਤ ਸੂਰਜ ਅਤੇ ਬੇਅੰਤ ਭਵਨ-ਚੱਕਰ ਹਨ। ਬੇਅੰਤ ਸਿੱਧ ਹਨ, ਬੇਅੰਤ ਬੁਧ ਅਵਤਾਰ ਹਨ, ਬੇਅੰਤ ਨਾਥ ਹਨ ਅਤੇ ਬੇਅੰਤ ਦੇਵੀਆਂ ਦੇ ਪਹਿਰਾਵੇ ਹਨ। (ਅਕਾਲ ਪੁਰਖ ਦੀ ਰਚਨਾ ਵਿਚ) ਬੇਅੰਤ ਦੇਵਤੇ ਅਤੇ ਦੈਂਤ ਹਨ, ਬੇਅੰਤ ਮੁਨੀ ਹਨ, ਬੇਅੰਤ ਪਰਕਾਰ ਦੇ ਰਤਨ ਤੇ (ਰਤਨਾਂ ਦੇ) ਸਮੁੰਦਰ ਹਨ। (ਜੀਵ-ਰਚਨਾ ਦੀਆਂ) ਬੇਅੰਤ ਖਾਣੀਆਂ ਹਨ, (ਜੀਵਾਂ ਦੀਆਂ ਬੋਲੀਆਂ ਭੀ ਚਾਰ ਨਹੀਂ) ਬੇਅੰਤ ਬਾਣੀਆਂ ਹਨ, ਬੇਅੰਤ ਪਾਤਸ਼ਾਹ ਤੇ ਰਾਜੇ ਹਨ, ਬੇਅੰਤ ਪਰਕਾਰ ਦੇ ਧਿਆਨ ਹਨ (ਜੋ ਜੀਵ ਮਨ ਦੁਆਰਾ ਲਾਂਦੇ ਹਨ), ਬੇਅੰਤ ਸੇਵਕ ਹਨ। ਹੇ ਨਾਨਕ! ਕੋਈ ਅੰਤ ਨਹੀਂ ਪੈ ਸਕਦਾ ॥੩੫॥`
      },
      {
        number: 36,
        sanskrit: `ਗਿਆਨ ਖੰਡ ਮਹਿ ਗਿਆਨੁ ਪਰਚੰਡੁ ॥
ਤਿਥੈ ਨਾਦ ਬਿਨੋਦ ਕੋਡ ਅਨੰਦੁ ॥
ਸਰਮ ਖੰਡ ਕੀ ਬਾਣੀ ਰੂਪੁ ॥
ਤਿਥੈ ਘਾੜਤਿ ਘੜੀਐ ਬਹੁਤੁ ਅਨੂਪੁ ॥
ਤਾ ਕੀਆ ਗਲਾ ਕਥੀਆ ਨਾ ਜਾਹਿ ॥
ਜੇ ਕੋ ਕਹੈ ਪਿਛੈ ਪਛੁਤਾਇ ॥
ਤਿਥੈ ਘੜੀਐ ਸੁਰਤਿ ਮਤਿ ਮਨਿ ਬੁਧਿ ॥
ਤਿਥੈ ਘੜੀਐ ਸੁਰਾ ਸਿਧਾ ਕੀ ਸੁਧਿ ॥੩੬॥`,
        transliteration: `giaan khandd meh giaan parachandd |
tithai naad binod kodd anand |
saram khandd kee baanee roop |
tithai ghaarrat gharreeai bahut anoop |
taa keea galaa katheea naa jaeh |
je ko kahai pichhai pachhutaae |
tithai gharreeai surat mat man budh |
tithai gharreeai suraa sidhaa kee sudh |36|`,
        meaning: `In the realm of wisdom, spiritual wisdom reigns supreme. The Sound-current of the Naad vibrates there, amidst the sounds and the sights of bliss. In the realm of humility, the Word is Beauty. Forms of incomparable beauty are fashioned there. These things cannot be described. One who tries to speak of these shall regret the attempt. The intuitive consciousness, intellect and understanding of the mind are shaped there. The consciousness of the spiritual warriors and the Siddhas, the beings of spiritual perfection, are shaped there. ||36||`,
        meaning_hi: `ज्ञान के क्षेत्र में, आध्यात्मिक ज्ञान सर्वोच्च है। नाद की ध्वनि-धारा वहाँ तरंगित होती है, ध्वनियों और आनंद के दृश्यों के बीच। विनम्रता के दायरे में, शब्द सौंदर्य है. वहां अतुलनीय सौन्दर्य के रूप गढ़े जाते हैं। इन बातों का वर्णन नहीं किया जा सकता. जो कोई इनके बारे में बोलने का प्रयास करेगा उसे अपने प्रयास पर पछतावा होगा। मन की सहज चेतना, बुद्धि और समझ वहीं आकार लेती है। आध्यात्मिक योद्धाओं और सिद्धों, आध्यात्मिक पूर्णता के प्राणियों की चेतना वहां आकार लेती है। ||36||`,
        meaning_pa: `ਗਿਆਨ ਖੰਡ ਵਿਚ (ਭਾਵ, ਮਨੁੱਖ ਦੀ ਗਿਆਨ ਅਵਸਥਾ ਵਿਚ) ਗਿਆਨ ਹੀ ਬਲਵਾਨ ਹੁੰਦਾ ਹੈ। ਇਸ ਅਵਸਥਾ ਵਿਚ (ਮਾਨੋ) ਸਭ ਰਾਗਾਂ, ਤਮਾਸ਼ਿਆਂ ਤੇ ਕੌਤਕਾਂ ਦਾ ਸੁਆਦ ਆ ਜਾਂਦਾ ਹੈ। ਉੱਦਮ ਅਵਸਥਾ ਦੀ ਬਨਾਵਟ ਸੁੰਦਰਤਾ ਹੈ (ਭਾਵ, ਇਸ ਅਵਸਥਾ ਵਿਚ ਆ ਕੇ ਮਨ ਦਿਨੋ ਦਿਨ ਸੋਹਣਾ ਬਣਨਾ ਸ਼ੁਰੂ ਹੋ ਜਾਂਦਾ ਹੈ)। ਇਸ ਅਵਸਥਾ ਵਿਚ (ਨਵੀਂ) ਘਾੜਤ ਦੇ ਕਾਰਨ ਮਨ ਬਹੁਤ ਸੋਹਣਾ ਘੜਿਆ ਜਾਂਦਾ ਹੈ। ਉਸ ਅਵਸਥਾ ਦੀਆਂ ਗੱਲਾਂ ਬਿਆਨ ਨਹੀਂ ਕੀਤੀਆਂ ਜਾ ਸਕਦੀਆਂ। ਜੇ ਕੋਈ ਮਨੁੱਖ ਬਿਆਨ ਕਰਦਾ ਹੈ, ਤਾਂ ਪਿੱਛੋਂ ਪਛੁਤਾਉਂਦਾ ਹੈ (ਕਿਉਂਕਿ ਉਹ ਬਿਆਨ ਕਰਨ ਦੇ ਅਸਮਰਥ ਰਹਿੰਦਾ ਹੈ)। ਉਸ ਮਿਹਨਤ ਵਾਲੀ ਅਵਸਥਾ ਵਿਚ ਮਨੁੱਖ ਦੀ ਸੁਰਤ ਤੇ ਮਤ ਘੜੀ ਜਾਂਦੀ ਹੈ, (ਭਾਵ, ਸੁਰਤ ਤੇ ਮਤ ਉੱਚੀ ਹੋ ਜਾਂਦੀ ਹੈ) ਅਤੇ ਮਨ ਵਿਚ ਜਾਗ੍ਰਤ ਪੈਦਾ ਹੋ ਜਾਂਦੀ ਹੈ। ਸਰਮ ਖੰਡ ਵਿਚ ਦੇਵਤਿਆਂ ਤੇ ਸਿੱਧਾਂ ਵਾਲੀ ਅਕਲ (ਮਨੁੱਖ ਦੇ ਅੰਦਰ) ਬਣ ਜਾਂਦੀ ਹੈ ॥੩੬॥`
      },
      {
        number: 37,
        sanskrit: `ਕਰਮ ਖੰਡ ਕੀ ਬਾਣੀ ਜੋਰੁ ॥
ਤਿਥੈ ਹੋਰੁ ਨ ਕੋਈ ਹੋਰੁ ॥
ਤਿਥੈ ਜੋਧ ਮਹਾਬਲ ਸੂਰ ॥
ਤਿਨ ਮਹਿ ਰਾਮੁ ਰਹਿਆ ਭਰਪੂਰ ॥
ਤਿਥੈ ਸੀਤੋ ਸੀਤਾ ਮਹਿਮਾ ਮਾਹਿ ॥
ਤਾ ਕੇ ਰੂਪ ਨ ਕਥਨੇ ਜਾਹਿ ॥
ਨਾ ਓਹਿ ਮਰਹਿ ਨ ਠਾਗੇ ਜਾਹਿ ॥
ਜਿਨ ਕੈ ਰਾਮੁ ਵਸੈ ਮਨ ਮਾਹਿ ॥
ਤਿਥੈ ਭਗਤ ਵਸਹਿ ਕੇ ਲੋਅ ॥
ਕਰਹਿ ਅਨੰਦੁ ਸਚਾ ਮਨਿ ਸੋਇ ॥
ਸਚ ਖੰਡਿ ਵਸੈ ਨਿਰੰਕਾਰੁ ॥
ਕਰਿ ਕਰਿ ਵੇਖੈ ਨਦਰਿ ਨਿਹਾਲ ॥
ਤਿਥੈ ਖੰਡ ਮੰਡਲ ਵਰਭੰਡ ॥
ਜੇ ਕੋ ਕਥੈ ਤ ਅੰਤ ਨ ਅੰਤ ॥
ਤਿਥੈ ਲੋਅ ਲੋਅ ਆਕਾਰ ॥
ਜਿਵ ਜਿਵ ਹੁਕਮੁ ਤਿਵੈ ਤਿਵ ਕਾਰ ॥
ਵੇਖੈ ਵਿਗਸੈ ਕਰਿ ਵੀਚਾਰੁ ॥
ਨਾਨਕ ਕਥਨਾ ਕਰੜਾ ਸਾਰੁ ॥੩੭॥`,
        transliteration: `karam khandd kee baanee jor |
tithai hor na koee hor |
tithai jodh mahaabal soor |
tin meh raam rahiaa bharapoor |
tithai seeto seetaa mahimaa maeh |
taa ke roop na kathane jaeh |
naa ohi mareh na tthaage jaeh |
jin kai raam vasai man maeh |
tithai bhagat vaseh ke loa |
kareh anand sachaa man soe |
sach khandd vasai nirankaar |
kar kar vekhai nadar nihaal |
tithai khandd manddal varabhandd |
je ko kathai ta ant na ant |
tithai loa loa aakaar |
jiv jiv hukam tivai tiv kaar |
vekhai vigasai kar veechaar |
naanak kathanaa kararraa saar |37|`,
        meaning: `In the realm of karma, the Word is Power. No one else dwells there, except the warriors of great power, the spiritual heroes. They are totally fulfilled, imbued with the Lord's Essence. Myriads of Sitas are there, cool and calm in their majestic glory. Their beauty cannot be described. Neither death nor deception comes to those, within whose minds the Lord abides. The devotees of many worlds dwell there. They celebrate; their minds are imbued with the True Lord. In the realm of Truth, the Formless Lord abides. Having created the creation, He watches over it. By His Glance of Grace, He bestows happiness. There are planets, solar systems and galaxies. If one speaks of them, there is no limit, no end. There are worlds upon worlds of His Creation. As He commands, so they exist. He watches over all, and contemplating the creation, He rejoices. O Nanak, to describe this is as hard as steel! ||37||`,
        meaning_hi: `कर्म के क्षेत्र में, शब्द शक्ति है. महान शक्ति के योद्धाओं, आध्यात्मिक नायकों के अलावा वहां कोई भी नहीं रहता है। वे पूरी तरह से पूर्ण हैं, प्रभु के सार से ओत-प्रोत हैं। वहाँ असंख्य सीताएँ हैं, जो अपनी भव्य महिमा में शांत और शीतल हैं। उनकी खूबसूरती का वर्णन नहीं किया जा सकता. न तो मृत्यु आती है और न ही धोखा उन्हें मिलता है, जिनके मन में भगवान निवास करते हैं। वहाँ अनेक लोकों के भक्त निवास करते हैं। वे जश्न मनाते हैं; उनके मन सच्चे प्रभु से ओत-प्रोत हैं। सत्य के क्षेत्र में, निराकार भगवान निवास करते हैं। वह सृष्टि की रचना करके उसका पालन करता है। अपनी कृपा की दृष्टि से, वह खुशियाँ प्रदान करता है। ग्रह, सौर मंडल और आकाशगंगाएँ हैं। अगर कोई इनके बारे में बात करे तो इसकी कोई सीमा नहीं है, कोई अंत नहीं है। उसकी रचना के संसार पर संसार हैं। जैसा वह आज्ञा देता है, वैसे ही वे अस्तित्व में रहते हैं। वह सब पर नज़र रखता है, और सृष्टि पर विचार करके आनन्दित होता है। हे नानक, इसका वर्णन करना स्टील के समान कठिन है! ||37||`,
        meaning_pa: `ਬਖ਼ਸ਼ਸ਼ ਵਾਲੀ ਅਵਸਥਾ ਦੀ ਬਨਾਵਟ ਬਲ ਹੈ, (ਭਾਵ, ਜਦੋਂ ਮਨੁੱਖ ਉੱਤੇ ਅਕਾਲ ਪੁਰਖ ਦੀ ਮਿਹਰ ਦੀ ਨਜ਼ਰ ਹੁੰਦੀ ਹੈ, ਤਾਂ ਉਸ ਦੇ ਅੰਦਰ ਅਜਿਹਾ ਬਲ ਪੈਦਾ ਹੁੰਦਾ ਹੈ ਕਿ ਵਿਸ਼ੇ-ਵਿਕਾਰ ਉਸ ਉੱਤੇ ਆਪਣਾ ਪਰਭਾਵ ਨਹੀਂ ਪਾ ਸਕਦੇ), ਕਿਉਂਕਿ ਉਸ ਅਵਸਥਾ ਵਿਚ (ਮਨੁੱਖ ਦੇ ਅੰਦਰ) ਅਕਾਲ ਪੁਰਖ ਤੋਂ ਬਿਨਾ ਕੋਈ ਦੂਜਾ ਉੱਕਾ ਹੀ ਨਹੀਂ ਰਹਿੰਦਾ। ਉਸ ਅਵਸਥਾ ਵਿਚ(ਜੋ ਮਨੁੱਖ ਹਨ ਉਹ) ਜੋਧੇ, ਮਹਾਂਬਲੀ ਤੇ ਸੂਰਮੇ ਹਨ। ਉਹਨਾਂ ਦੇ ਰੋਮ ਰੋਮ ਵਿਚ ਅਕਾਲ ਪੁਰਖ ਵੱਸ ਰਿਹਾ ਹੈ। ਉਸ (ਬਖ਼ਸ਼ਸ਼) ਅਵਸਥਾ ਵਿਚ ਅੱਪੜੇ ਹੋਏ ਮਨੁੱਖਾਂ ਦਾ ਮਨ ਨਿਰੋਲ ਅਕਾਲ ਪੁਰਖ ਦੀ ਵਡਿਆਈ ਵਿਚ ਪਰੋਤਾ ਰਹਿੰਦਾ ਹੈ। (ਉਹਨਾਂ ਦੇ ਸਰੀਰ ਅਜਿਹੇ ਕੰਚਨ ਦੀ ਵੰਨੀ ਵਾਲੇ ਹੋ ਜਾਂਦੇ ਹਨ ਕਿ) ਉਹਨਾਂ ਦੇ ਸੋਹਣੇ ਰੂਪ ਵਰਣਨ ਨਹੀਂ ਕੀਤੇ ਜਾ ਸਕਦੇ (ਉਹਨਾਂ ਦੇ ਮੂੰਹ ਉੱਤੇ ਨੂਰ ਹੀ ਨੂਰ ਲਿਸ਼ਕਦਾ ਹੈ)। (ਇਸ ਅਵਸਥਾ ਵਿਚ) ਉਹ ਆਤਮਕ ਮੌਤ ਨਹੀਂ ਮਰਦੇ ਤੇ ਮਾਇਆ ਉਹਨਾਂ ਨੂੰ ਠੱਗ ਨਹੀਂ ਸਕਦੀ, ਜਿਨ੍ਹਾਂ ਦੇ ਮਨ ਵਿਚ ਅਕਾਲ ਪੁਰਖ ਵੱਸਦਾ ਹੈ। ਉਸ ਅਵਸਥਾ ਵਿਚ ਕਈ ਭਵਣਾਂ ਦੇ ਭਗਤ ਜਨ ਵੱਸਦੇ ਹਨ, ਜੋ ਸਦਾ ਖਿੜੇ ਰਹਿੰਦੇ ਹਨ, (ਕਿਉਂਕਿ) ਉਹ ਸੱਚਾ ਅਕਾਲ ਪੁਰਖ ਉਹਨਾਂ ਦੇ ਮਨ ਵਿਚ (ਮੌਜੂਦ) ਹੈ। ਸੱਚ ਖੰਡ ਵਿਚ (ਭਾਵ,ਅਕਾਲ ਪੁਰਖ ਨਾਲ ਇੱਕ ਰੂਪ ਹੋਣ ਵਾਲੀ ਅਵਸਥਾ ਵਿਚ) ਮਨੁੱਖ ਦੇ ਅੰਦਰ ਉਹ ਅਕਾਲ ਪੁਰਖ ਆਪ ਹੀ ਵੱਸਦਾ ਹੈ, ਜੋ ਸ੍ਰਿਸ਼ਟੀ ਨੂੰ ਰਚ ਰਚ ਕੇ ਮਿਹਰ ਦੀ ਨਜ਼ਰ ਨਾਲ ਉਸ ਦੀ ਸੰਭਾਲ ਕਰਦਾ ਹੈ। ਉਸ ਅਵਸਥਾ ਵਿਚ (ਭਾਵ, ਅਕਾਲ ਪੁਰਖ ਨਾਲ ਇੱਕ-ਰੂਪ ਹੋਣ ਵਾਲੀ ਅਵਸਥਾ ਵਿਚ) ਮਨੁੱਖ ਨੂੰ ਬੇਅੰਤ ਖੰਡ, ਮੰਡਲ ਤੇ ਬੇਅੰਤ ਬ੍ਰਹਿਮੰਡ (ਦਿੱਸਦੇ ਹਨ, ਇਤਨੇ ਬੇਅੰਤ ਕਿ) ਜੇ ਕੋਈ ਮਨੁੱਖ ਇਸ ਦਾ ਕਥਨ ਕਰਨ ਲੱਗੇ, ਤਾਂ ਉਹਨਾਂ ਦੇ ਓੜਕ ਨਹੀਂ ਪੈ ਸਕਦੇ। ਉਸ ਅਵਸਥਾ ਵਿਚ ਬੇਅੰਤ ਭਵਣ ਤੇ ਅਕਾਰ ਦਿੱਸਦੇ ਹਨ, (ਜਿਨ੍ਹਾਂ ਸਭਨਾਂ ਵਿਚ) ਉਸੇ ਤਰ੍ਹਾਂ ਕਾਰ ਚੱਲ ਰਹੀ ਹੈ ਜਿਵੇਂ ਅਕਾਲ ਪੁਰਖ ਦਾ ਹੁਕਮ ਹੁੰਦਾ ਹੈ (ਭਾਵ, ਇਸ ਅਵਸਥਾ ਵਿਚ ਅੱਪੜ ਕੇ ਮਨੁੱਖ ਨੂੰ ਹਰ ਥਾਂ ਅਕਾਲ ਪੁਰਖ ਦੀ ਰਜ਼ਾ ਵਰਤਦੀ ਦਿੱਸਦੀ ਹੈ)। (ਉਸ ਨੂੰ ਪਰਤੱਖ ਦਿਸੱਦਾ ਹੈ ਕਿ) ਅਕਾਲ ਪੁਰਖ ਵੀਚਾਰ ਕਰਕੇ (ਸਭ ਜੀਵਾਂ ਦੀ) ਸੰਭਾਲ ਕਰਦਾ ਹੈ ਤੇ ਖੁਸ਼ ਹੁੰਦਾ ਹੈ। ਹੇ ਨਾਨਕ! ਇਸ ਅਵਸਥਾ ਦਾ ਕਥਨ ਕਰਨਾ ਬਹੁਤ ਹੀ ਔਖਾ ਹੈ (ਭਾਵ, ਇਹ ਅਵਸਥਾ ਬਿਆਨ ਨਹੀਂ ਹੋ ਸਕਦੀ, ਅਨੁਭਵ ਹੀ ਕੀਤੀ ਜਾ ਸਕਦੀ ਹੈ) ॥੩੭॥`
      },
      {
        number: 38,
        sanskrit: `ਜਤੁ ਪਾਹਾਰਾ ਧੀਰਜੁ ਸੁਨਿਆਰੁ ॥
ਅਹਰਣਿ ਮਤਿ ਵੇਦੁ ਹਥੀਆਰੁ ॥
ਭਉ ਖਲਾ ਅਗਨਿ ਤਪ ਤਾਉ ॥
ਭਾਂਡਾ ਭਾਉ ਅੰਮ੍ਰਿਤੁ ਤਿਤੁ ਢਾਲਿ ॥
ਘੜੀਐ ਸਬਦੁ ਸਚੀ ਟਕਸਾਲ ॥
ਜਿਨ ਕਉ ਨਦਰਿ ਕਰਮੁ ਤਿਨ ਕਾਰ ॥
ਨਾਨਕ ਨਦਰੀ ਨਦਰਿ ਨਿਹਾਲ ॥੩੮॥`,
        transliteration: `jat paahaaraa dheeraj suniaar |
aharan mat ved hatheeaar |
bhau khalaa agan tap taau |
bhaanddaa bhaau amrit tith dtaal |
gharreeai sabad sachee ttakasaal |
jin kau nadar karam tin kaar |
naanak nadaree nadar nihaal |38|`,
        meaning: `Let self-control be the furnace, and patience the goldsmith. Let understanding be the anvil, and spiritual wisdom the tools. With the Fear of God as the bellows, fan the flames of tapa, the body's inner heat. In the crucible of love, melt the Nectar of the Name, and mint the True Coin of the Shabad, the Word of God. Such is the karma of those upon whom He has cast His Glance of Grace. O Nanak, the Merciful Lord, by His Grace, uplifts and exalts them. ||38||`,
        meaning_hi: `संयम को भट्ठी बनने दो, और धैर्य को सुनार बनने दो। समझ को निहाई और आध्यात्मिक ज्ञान को उपकरण बनने दीजिए। धौंकनी की तरह ईश्वर के भय के साथ, तप की लौ, शरीर की आंतरिक गर्मी को हवा दें। प्रेम की भट्टी में, नाम के अमृत को पिघलाएं, और शबद, परमेश्वर के वचन का सच्चा सिक्का ढालें। ऐसे ही उनके कर्म होते हैं जिन पर उन्होंने अपनी कृपा दृष्टि डाली है। हे नानक, दयालु भगवान, अपनी कृपा से, उनका उत्थान और उत्थान करते हैं। ||38||`,
        meaning_pa: `(ਜੇ) ਜਤ-ਰੂਪ ਦੁਕਾਨ (ਹੋਵੇ), ਧੀਰਜ ਸੁਨਿਆਰਾ ਬਣੇ, ਮਨੁੱਖ ਦੀ ਆਪਣੀ ਮੱਤ ਅਹਿਰਣ ਹੋਵੇ, (ਉਸ ਮਤ-ਅਹਿਰਣ ਉੱਤੇ) ਗਿਆਨ ਹਥੌੜਾ (ਵੱਜੇ)। (ਜੇ) ਅਕਾਲ ਪੁਰਖ ਦਾ ਡਰ ਧੌਂਕਣੀ (ਹੋਵੇ), ਘਾਲ-ਕਮਾਈ ਅੱਗ (ਹੋਵੇ), ਪ੍ਰੇਮ ਕੁਠਾਲੀ ਹੋਵੇ, ਤਾਂ (ਹੇ ਭਾਈ!) ਉਸ (ਕੁਠਾਲੀ) ਵਿਚ ਅਕਾਲ ਪੁਰਖ ਦਾ ਅੰਮ੍ਰਿਤ ਨਾਮ ਗਲਾਵੋ। (ਕਿਉਂਕਿ ਇਹੋ ਜਿਹੀ ਹੀ) ਸੱਚੀ ਟਕਸਾਲ ਵਿਚ (ਗੁਰੂ ਦਾ) ਸ਼ਬਦ ਘੜਿਆ ਜਾਂਦਾ ਹੈ। ਇਹ ਕਾਰ ਉਹਨਾਂ ਮਨੁੱਖਾਂ ਦੀ ਹੈ, ਜਿਨ੍ਹਾਂ ਉੱਤੇ ਮਿਹਰ ਦੀ ਨਜ਼ਰ ਹੁੰਦੀ ਹੈ। ਜਿੰਨ੍ਹਾਂ ਉੱਤੇ ਬਖ਼ਸ਼ਸ਼ ਹੁੰਦੀ ਹੈ, ਹੇ ਨਾਨਕ! ਉਹ ਮਨੁੱਖ ਅਕਾਲ ਪੁਰਖ ਦੀ ਕ੍ਰਿਪਾ-ਦ੍ਰਿਸ਼ਟੀ ਨਾਲ ਨਿਹਾਲ ਹੋ ਜਾਂਦਾ ਹੈ ॥੩੮॥{8}`
      },
      {
        number: 39,
        sanskrit: `ਸਲੋਕੁ ॥
ਪਵਣੁ ਗੁਰੂ ਪਾਣੀ ਪਿਤਾ ਮਾਤਾ ਧਰਤਿ ਮਹਤੁ ॥
ਦਿਵਸੁ ਰਾਤਿ ਦੁਇ ਦਾਈ ਦਾਇਆ ਖੇਲੈ ਸਗਲ ਜਗਤੁ ॥
ਚੰਗਿਆਈਆ ਬੁਰਿਆਈਆ ਵਾਚੈ ਧਰਮੁ ਹਦੂਰਿ ॥
ਕਰਮੀ ਆਪੋ ਆਪਣੀ ਕੇ ਨੇੜੈ ਕੇ ਦੂਰਿ ॥
ਜਿਨੀ ਨਾਮੁ ਧਿਆਇਆ ਗਏ ਮਸਕਤਿ ਘਾਲਿ ॥
ਨਾਨਕ ਤੇ ਮੁਖ ਉਜਲੇ ਕੇਤੀ ਛੁਟੀ ਨਾਲਿ ॥੧॥`,
        transliteration: `salok |
pavan guroo paanee pitaa maataa dharat mehat |
divas raat due daaee daaeaa khelai sagal jagat |
changiaaeea buriaaeea vaachai dharam hadoor |
karamee aapo aapanee ke nerrai ke door |
jinee naam dhiaaeaa ge masakat ghaal |
naanak te mukh ujale ketee chhuttee naal |1|`,
        meaning: `Salok: Air is the Guru, Water is the Father, and Earth is the Great Mother of all. Day and night are the two nurses, in whose lap all the world is at play. Good deeds and bad deeds-the record is read out in the Presence of the Lord of Dharma. According to their own actions, some are drawn closer, and some are driven farther away. Those who have meditated on the Naam, the Name of the Lord, and departed after having worked by the sweat of their brows -O Nanak, their faces are radiant in the Court of the Lord, and many are saved along with them! ||1||`,
        meaning_hi: `सलोक: वायु गुरु है, जल पिता है, और पृथ्वी सबकी महान माता है। दिन और रात ये दो नर्सें हैं, जिनकी गोद में सारा संसार खेलता है। अच्छे कर्म और बुरे कर्म-रिकॉर्ड धर्म के भगवान की उपस्थिति में पढ़ा जाता है। अपने-अपने कर्मों के अनुसार कुछ को करीब खींच लिया जाता है और कुछ को दूर कर दिया जाता है। जिन लोगों ने नाम, भगवान के नाम पर ध्यान किया है, और अपनी भौंहों के पसीने से काम करने के बाद चले गए हैं - हे नानक, उनके चेहरे भगवान के दरबार में उज्ज्वल हैं, और उनके साथ कई लोग बच गए हैं! ||1||`,
        meaning_pa: `ਸਲੋਕੁ ਪ੍ਰਾਣ (ਸਰੀਰਾਂ ਲਈ ਇਉਂ ਹਨ ਜਿਵੇਂ) ਗੁਰੂ (ਜੀਵਾਂ ਦੇ ਆਤਮਾ ਲਈ) ਹੈ। ਪਾਣੀ (ਸਭ ਜੀਵਾਂ ਦਾ) ਪਿਉ ਹੈ ਅਤੇ ਧਰਤੀ (ਸਭ ਦੀ) ਵੱਡੀ ਮਾਂ ਹੈ। ਦਿਨ ਅਤੇ ਰਾਤ ਦੋਵੇਂ ਖਿਡਾਵਾ ਤੇ ਖਿਡਾਵੀ ਹਨ, ਸਾਰਾ ਸੰਸਾਰ ਖੇਡ ਰਿਹਾ ਹੈ, (ਭਾਵ, ਸੰਸਾਰ ਦੇ ਸਾਰੇ ਜੀਵ ਰਾਤ ਨੂੰ ਸੌਣ ਵਿਚ ਅਤੇ ਦਿਨੇ ਕਾਰ-ਵਿਹਾਰ ਵਿਚ ਪਰਚੇ ਪਏ ਹਨ)। ਧਰਮਰਾਜ ਅਕਾਲ ਪੁਰਖ ਦੀ ਹਜ਼ੂਰੀ ਵਿਚ (ਜੀਵਾਂ ਦੇ ਕੀਤੇ ਹੋਏ) ਚੰਗੇ ਤੇ ਮੰਦੇ ਕੰਮ ਵਿਚਾਰਦਾ ਹੈ। ਆਪੋ ਆਪਣੇ (ਇਹਨਾਂ ਕੀਤੇ ਹੋਏ) ਕਰਮਾਂ ਦੇ ਅਨੁਸਾਰ ਕਈ ਜੀਵ ਅਕਾਲ ਪੁਰਖ ਦੇ ਨੇੜੇ ਹੋ ਜਾਂਦੇ ਹਨ ਅਤੇ ਅਕਾਲ ਪੁਰਖ ਤੋਂ ਦੂਰ ਹੋ ਜਾਂਦੇ ਹਨ। ਹੇ ਨਾਨਕ! ਜਿਨ੍ਹਾਂ ਮਨੁੱਖਾਂ ਨੇ ਅਕਾਲ ਪੁਰਖ ਦਾ ਨਾਮ ਸਿਮਰਿਆ ਹੈ, ਉਹ ਆਪਣੀ ਮਿਹਨਤ ਸਫਲੀ ਕਰ ਗਏ ਹਨ। (ਅਕਾਲ ਪੁਰਖ ਦੇ ਦਰ 'ਤੇ) ਉਹ ਉੱਜਲ ਮੁਖ ਵਾਲੇ ਹਨ ਅਤੇ (ਹੋਰ ਭੀ) ਕਈ ਜੀਵ ਉਹਨਾਂ ਦੀ ਸੰਗਤਿ ਵਿਚ (ਰਹਿ ਕੇ) ("ਕੂੜ ਦੀ ਪਾਲਿ" ਢਾਹ ਕੇ ਮਾਇਆ ਦੇ ਬੰਧਨਾਂ ਤੋਂ) ਆਜ਼ਾਦ ਹੋ ਗਏ ਹਨ ॥੧॥`
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
      {
        number: 1,
        sanskrit: `ੴ ਸਤਿਗੁਰ ਪ੍ਰਸਾਦਿ ॥
ਜਾਪੁ ॥
ਸ੍ਰੀ ਮੁਖਵਾਕ ਪਾਤਿਸਾਹੀ ੧੦ ॥
ਛਪੈ ਛੰਦ ॥ ਤ੍ਵ ਪ੍ਰਸਾਦਿ ॥
ਚੱਕ੍ਰ ਚਿਹਨ ਅਰੁ ਬਰਨ ਜਾਤਿ ਅਰੁ ਪਾਤਿ ਨਹਿਨ ਜਿਹ ॥
ਰੂਪ ਰੰਗ ਅਰੁ ਰੇਖ ਭੇਖ ਕੋਊ ਕਹਿ ਨ ਸਕਤ ਕਿਹ ॥
ਅਚਲ ਮੂਰਤਿ ਅਨਭਉ ਪ੍ਰਕਾਸ ਅਮਿਤੋਜਿ ਕਹਿੱਜੈ ॥
ਕੋਟਿ ਇੰਦ੍ਰ ਇੰਦ੍ਰਾਣ ਸਾਹੁ ਸਾਹਾਣਿ ਗਣਿਜੈ ॥
ਤ੍ਰਿਭਵਣ ਮਹੀਪ ਸੁਰ ਨਰ ਅਸੁਰ ਨੇਤ ਨੇਤ ਬਨ ਤ੍ਰਿਣ ਕਹਤ ॥
ਤਵ ਸਰਬ ਨਾਮ ਕਥੈ ਕਵਨ ਕਰਮ ਨਾਮ ਬਰਨਤ ਸੁਮਤਿ ॥੧॥`,
        transliteration: `ik oankaar satigur prasaad |
jaap |
sree mukhavaak paatisaahee 10 |
chhapai chhand | tv prasaad |
chakr chihan ar baran jaat ar paat nahin jih |
roop rang ar rekh bhekh koaoo keh na sakat kih |
achal moorat anbhau prakaas amitoj kahijai |
kott indr indraan saahu saahaan ganijai |
tribhavan maheep sur nar asur net net ban trin kehat |
tav sarab naam kathai kavan karam naam baranat sumat |1|`,
        meaning: `The Lord is One and He can be attained through the grace of the true Guru. Name of the Bani : Japu Sahib The sacred utterance of The Tenth Sovereign: CHHAPAI STANZA. BY THY GRACE He who is without mark or sign, He who is without caste or line. He who is without colour or form, and without any distinctive norm. He who is without limit and motion, All effulgence, non-descript Ocean. The Lord of millions of Indras and kings, the Master of all worlds and beings. Each twig of the foliage proclaims: “Not this Thou art.” All Thy Names cannot be told. One doth impart Thy Action-Name with benign heart.1.`,
        meaning_pa: `ਜਾਪੁ: ਦਸਮ ਗੁਰੂ ਜੀ ਦੇ ਮੁਖ ਤੋਂ ਉਚਾਰੀ ਹੋਈ: ਛਪੈ ਛੰਦ: ਤੇਰੀ ਕ੍ਰਿਪਾ ਨਾਲ: ਜਿਸ ਦਾ ਕੋਈ ਚਿੰਨ੍ਹ, ਚਕ੍ਰ, ਵਰਨ, ਜਾਤਿ ਅਤੇ ਗੋਤ ਨਹੀਂ ਹੈ, ਅਤੇ ਜਿਸ ਦੇ ਰੂਪ, ਰੰਗ, ਰੇਖ, ਭੇਖ ਬਾਰੇ ਕੋਈ ਕੁਝ ਨਹੀਂ ਕਹਿ ਸਕਦਾ (ਕਿ ਉਹ) ਕਿਹੋ ਜਿਹਾ ਹੈ। (ਉਸ ਨੂੰ) ਅਚਲ ਸਰੂਪੀ, ਸੁਤਹ ਗਿਆਨ ਦਾ ਪ੍ਰਕਾਸ਼ਕ ਅਤੇ ਅਮਿਤ ਸ਼ਕਤੀ ਵਾਲਾ ਕਿਹਾ ਜਾਂਦਾ ਹੈ। (ਉਹ ਪਰਮ ਸੱਤਾ) ਕਰੋੜਾਂ ਇੰਦਰਾਂ ਦਾ ਇੰਦਰ ਅਤੇ ਸ਼ਾਹਾਂ ਦਾ ਸ਼ਾਹ ਗਿਣਿਆ ਜਾਂਦਾ ਹੈ। (ਉਸ ਨੂੰ) ਤਿੰਨ ਲੋਕਾਂ (ਸੁਅਰਗ, ਮਾਤ ਅਤੇ ਪਾਤਾਲ) ਦੇ ਰਾਜੇ, ਦੇਵਤੇ, ਮਨੁੱਖ, ਦੈਂਤ ਅਤੇ ਬਨਾਂ ਦੇ ਤਿਨਕੇ ਵੀ ਬੇਅੰਤ ਬੇਅੰਤ ਕਹਿੰਦੇ ਹਨ। (ਹੇ ਪ੍ਰਭੂ!) ਤੇਰੇ ਸਾਰੇ ਨਾਂਵਾਂ ਦਾ ਕਥਨ ਕੌਣ ਕਰ ਸਕਦਾ ਹੈ? (ਬਸ ਤੇਰੇ ਕੁਝ ਕੁ) ਕਰਮਾਚਾਰੀ (ਉਪਕਾਰੀ) ਨਾਂਵਾਂ ਦਾ ਚੰਗੀ ਮਤ ਵਾਲਿਆਂ ਨੇ ਵਰਣਨ ਕੀਤਾ ਹੈ ॥੧॥`
      },
      {
        number: 2,
        sanskrit: `ਭੁਜੰਗ ਪ੍ਰਯਾਤ ਛੰਦ ॥
ਨਮਸਤ੍ਵੰ ਅਕਾਲੇ ॥
ਨਮਸਤ੍ਵੰ ਕ੍ਰਿਪਾਲੇ ॥
ਨਮਸਤੰ ਅਰੂਪੇ ॥
ਨਮਸਤੰ ਅਨੂਪੇ ॥੨॥
ਨਮਸਤੰ ਅਭੇਖੇ ॥
ਨਮਸਤੰ ਅਲੇਖੇ ॥
ਨਮਸਤੰ ਅਕਾਏ ॥
ਨਮਸਤੰ ਅਜਾਏ ॥੩॥
ਨਮਸਤੰ ਅਗੰਜੇ ॥
ਨਮਸਤੰ ਅਭੰਜੇ ॥
ਨਮਸਤੰ ਅਨਾਮੇ ॥
ਨਮਸਤੰ ਅਠਾਮੇ ॥੪॥
ਨਮਸਤੰ ਅਕਰਮੰ ॥
ਨਮਸਤੰ ਅਧਰਮੰ ॥
ਨਮਸਤੰ ਅਨਾਮੰ ॥
ਨਮਸਤੰ ਅਧਾਮੰ ॥੫॥
ਨਮਸਤੰ ਅਜੀਤੇ ॥
ਨਮਸਤੰ ਅਭੀਤੇ ॥
ਨਮਸਤੰ ਅਬਾਹੇ ॥
ਨਮਸਤੰ ਅਢਾਹੇ ॥੬॥
ਨਮਸਤੰ ਅਨੀਲੇ ॥
ਨਮਸਤੰ ਅਨਾਦੇ ॥
ਨਮਸਤੰ ਅਛੇਦੇ ॥
ਨਮਸਤੰ ਅਗਾਧੇ ॥੭॥
ਨਮਸਤੰ ਅਗੰਜੇ ॥
ਨਮਸਤੰ ਅਭੰਜੇ ॥
ਨਮਸਤੰ ਉਦਾਰੇ ॥
ਨਮਸਤੰ ਅਪਾਰੇ ॥੮॥
ਨਮਸਤੰ ਸੁ ਏਕੈ ॥
ਨਮਸਤੰ ਅਨੇਕੈ ॥
ਨਮਸਤੰ ਅਭੂਤੇ ॥
ਨਮਸਤੰ ਅਜੂਪੇ ॥੯॥
ਨਮਸਤੰ ਨ੍ਰਿਕਰਮੇ ॥
ਨਮਸਤੰ ਨ੍ਰਿਭਰਮੇ ॥
ਨਮਸਤੰ ਨ੍ਰਿਦੇਸੇ ॥
ਨਮਸਤੰ ਨ੍ਰਿਭੇਸੇ ॥੧੦॥
ਨਮਸਤੰ ਨ੍ਰਿਨਾਮੇ ॥
ਨਮਸਤੰ ਨ੍ਰਿਕਾਮੇ ॥
ਨਮਸਤੰ ਨ੍ਰਿਧਾਤੇ ॥
ਨਮਸਤੰ ਨ੍ਰਿਘਾਤੇ ॥੧੧॥
ਨਮਸਤੰ ਨ੍ਰਿਧੂਤੇ ॥
ਨਮਸਤੰ ਅਭੂਤੇ ॥
ਨਮਸਤੰ ਅਲੋਕੇ ॥
ਨਮਸਤੰ ਅਸੋਕੇ ॥੧੨॥
ਨਮਸਤੰ ਨ੍ਰਿਤਾਪੇ ॥
ਨਮਸਤੰ ਅਥਾਪੇ ॥
ਨਮਸਤੰ ਤ੍ਰਿਮਾਨੇ ॥
ਨਮਸਤੰ ਨਿਧਾਨੇ ॥੧੩॥
ਨਮਸਤੰ ਅਗਾਹੇ ॥
ਨਮਸਤੰ ਅਬਾਹੇ ॥
ਨਮਸਤੰ ਤ੍ਰਿਬਰਗੇ ॥
ਨਮਸਤੰ ਅਸਰਗੇ ॥੧੪॥
ਨਮਸਤੰ ਪ੍ਰਭੋਗੇ ॥
ਨਮਸਤੰ ਸੁਜੋਗੇ ॥
ਨਮਸਤੰ ਅਰੰਗੇ ॥
ਨਮਸਤੰ ਅਭੰਗੇ ॥੧੫॥
ਨਮਸਤੰ ਅਗੰਮੇ ॥
ਨਮਸਤਸਤੁ ਰੰਮੇ ॥
ਨਮਸਤੰ ਜਲਾਸਰੇ ॥
ਨਮਸਤੰ ਨਿਰਾਸਰੇ ॥੧੬॥
ਨਮਸਤੰ ਅਜਾਤੇ ॥
ਨਮਸਤੰ ਅਪਾਤੇ ॥
ਨਮਸਤੰ ਅਮਜਬੇ ॥
ਨਮਸਤਸਤੁ ਅਜਬੇ ॥੧੭॥
ਅਦੇਸੰ ਅਦੇਸੇ ॥
ਨਮਸਤੰ ਅਭੇਸੇ ॥
ਨਮਸਤੰ ਨ੍ਰਿਧਾਮੇ ॥
ਨਮਸਤੰ ਨ੍ਰਿਬਾਮੇ ॥੧੮॥
ਨਮੋ ਸਰਬ ਕਾਲੇ ॥
ਨਮੋ ਸਰਬ ਦਿਆਲੇ ॥
ਨਮੋ ਸਰਬ ਰੂਪੇ ॥
ਨਮੋ ਸਰਬ ਭੂਪੇ ॥੧੯॥
ਨਮੋ ਸਰਬ ਖਾਪੇ ॥
ਨਮੋ ਸਰਬ ਥਾਪੇ ॥
ਨਮੋ ਸਰਬ ਕਾਲੇ ॥
ਨਮੋ ਸਰਬ ਪਾਲੇ ॥੨੦॥
ਨਮਸਤਸਤੁ ਦੇਵੈ ॥
ਨਮਸਤੰ ਅਭੇਵੈ ॥
ਨਮਸਤੰ ਅਜਨਮੇ ॥
ਨਮਸਤੰ ਸੁਬਨਮੇ ॥੨੧॥
ਨਮੋ ਸਰਬ ਗਉਨੇ ॥
ਨਮੋ ਸਰਬ ਭਉਨੇ ॥
ਨਮੋ ਸਰਬ ਰੰਗੇ ॥
ਨਮੋ ਸਰਬ ਭੰਗੇ ॥੨੨॥
ਨਮੋ ਕਾਲ ਕਾਲੇ ॥
ਨਮਸਤਸਤੁ ਦਿਆਲੇ ॥
ਨਮਸਤੰ ਅਬਰਨੇ ॥
ਨਮਸਤੰ ਅਮਰਨੇ ॥੨੩॥
ਨਮਸਤੰ ਜਰਾਰੰ ॥
ਨਮਸਤੰ ਕ੍ਰਿਤਾਰੰ ॥
ਨਮੋ ਸਰਬ ਧੰਧੇ ॥
ਨਮੋਸਤ ਅਬੰਧੇ ॥੨੪॥
ਨਮਸਤੰ ਨ੍ਰਿਸਾਕੇ ॥
ਨਮਸਤੰ ਨ੍ਰਿਬਾਕੇ ॥
ਨਮਸਤੰ ਰਹੀਮੇ ॥
ਨਮਸਤੰ ਕਰੀਮੇ ॥੨੫॥
ਨਮਸਤੰ ਅਨੰਤੇ ॥
ਨਮਸਤੰ ਮਹੰਤੇ ॥
ਨਮਸਤਸਤੁ ਰਾਗੇ ॥
ਨਮਸਤੰ ਸੁਹਾਗੇ ॥੨੬॥
ਨਮੋ ਸਰਬ ਸੋਖੰ ॥
ਨਮੋ ਸਰਬ ਪੋਖੰ ॥
ਨਮੋ ਸਰਬ ਕਰਤਾ ॥
ਨਮੋ ਸਰਬ ਹਰਤਾ ॥੨੭॥
ਨਮੋ ਜੋਗ ਜੋਗੇ ॥
ਨਮੋ ਭੋਗ ਭੋਗੇ ॥
ਨਮੋ ਸਰਬ ਦਿਆਲੇ ॥
ਨਮੋ ਸਰਬ ਪਾਲੇ ॥੨੮॥`,
        transliteration: `bhujang prayaat chhand |
namasatvan akaale |
namasatvan kripaale |
namasatan aroope |
namasatan anoope |2|
namasatan abhekhe |
namasatan alekhe |
namasatan akaae |
namasatan ajaae |3|
namasatan aganje |
namasatan abhanje |
namasatan anaame |
namasatan atthaame |4|
namasatan akaraman |
namasatan adharaman |
namasatan anaaman |
namasatan adhaaman |5|
namasatan ajeete |
namasatan abheete |
namasatan abaahe |
namasatan adtaahe |6|
namasatan aneele |
namasatan anaade |
namasatan achhede |
namasatan agaadhe |7|
namasatan aganje |
namasatan abhanje |
namasatan udaare |
namasatan apaare |8|
namasatan su ekai |
namasatan anekai |
namasatan abhoote |
namasatan ajoope |9|
namasatan nrikarame |
namasatan nribharame |
namasatan nridese |
namasatan nribhese |10|
namasatan nrinaame |
namasatan nrikaame |
namasatan nridhaate |
namasatan nrighaate |11|
namasatan nridhoote |
namasatan abhoote |
namasatan aloke |
namasatan asoke |12|
namasatan nritaape |
namasatan athaape |
namasatan trimaane |
namasatan nidhaane |13|
namasatan agaahe |
namasatan abaahe |
namasatan tribarage |
namasatan asarage |14|
namasatan prabhoge |
namasatan sujoge |
namasatan arange |
namasatan abhange |15|
namasatan agame |
namasatasat rame |
namasatan jalaasare |
namasatan niraasare |16|
namasatan ajaate |
namasatan apaate |
namasatan amajabe |
namasatasat ajabe |17|
adesan adese |
namasatan abhese |
namasatan nridhaame |
namasatan nribaame |18|
namo sarab kaale |
namo sarab diaale |
namo sarab roope |
namo sarab bhoope |19|
namo sarab khaape |
namo sarab thaape |
namo sarab kaale |
namo sarab paale |20|
namasatasat devai |
namasatan abhevai |
namasatan ajaname |
namasatan subaname |21|
namo sarab gaune |
namo sarab bhaune |
namo sarab range |
namo sarab bhange |22|
namo kaal kaale |
namasatasat diaale |
namasatan abarane |
namasatan amarane |23|
namasatan jaraaran |
namasatan kritaaran |
namo sarab dhandhe |
namosat abandhe |24|
namasatan nrisaake |
namasatan nribaake |
namasatan raheeme |
namasatan kareeme |25|
namasatan anante |
namasatan mahante |
namasatasat raage |
namasatan suhaage |26|
namo sarab sokhan |
namo sarab pokhan |
namo sarab karataa |
namo sarab harataa |27|
namo jog joge |
namo bhog bhoge |
namo sarab diaale |
namo sarab paale |28|`,
        meaning: `BHUJANG PRAYAAT STANZA Salutation to Thee O Timeless Lord Salutation to Thee O Beneficent Lord! Salutation to Thee O Formless Lord! Salutation to Thee O Wonderful Lord! 2. Salutation to Thee O Garbless Lord! Salutation to Thee O Accountless Lord! Salutation to Thee O Bodyless Lord! Salutation to Thee O Unborn Lord!3. Salutation to Thee O Indestructible Lord! Salutation to Thee O Indivisible Lord! Salutation to Thee O Nameless Lord! Salutation to Thee O Non-Spatial Lord! 4 Salutation to Thee O Deedless Lord! Salutation to Thee O Non-Religious Lord! Salutation to Thee O Nameless Lord! Salutation to Thee O Abodeless Lord! 5 Salutation to Thee O Unconquerable Lord! Salutation to Thee O Fearless Lord! Salutation to Thee O Vehicleless Lord! Salutation to Thee O Unfallen Lord! 6 Salutation to Thee O Colourless Lord! Salutation to Thee O Beginningless Lord! Salutation to Thee O Blemishless Lord! Salutation to Thee O Infinite Lord! 7 Salutation to Thee O Cleaveless Lord! Salutation to Thee O Partless Lord! Salutation to Thee O Generous lord! Salutation to Thee O Limitless Lord! 8 Salutation to Thee O THE ONLY ONE LORD! Salutation to Thee O The Multi-form Lord! Salutation to Thee O Non-elemental Lord! Salutation to Thee O Bondless Lord! 9 Salutation to Thee O Deedless Lord! Salutation to Thee O Doubtless Lord! Salutation to Thee O Homeless Lord! Salutation to Thee O Garbless Lord! 10 Salutation to Thee O Nameless Lord! Salutation to Thee O Desireless Lord! Salutation to Thee O Non-elemental Lord! Salutation to Thee O invincible Lord! 11 Salutation to Thee O Motionless Lord! Salutation to Thee O Elementless Lord! Salutation to Thee O Invinciblle Lord! Salutation to Thee O Griefless Lord! 12 Salutation to Thee O Woeless Lord! Salutation to Thee O Non-established Lord! Salutation to Thee O Universally-Honoured Lord! Salutation to Thee O Treasure Lord! 13 Salutation to Thee O Bottomless Lord! Salutation to Thee O Motionless Lord! Salutation to Thee O Virtue-full Lord! Salutation to Thee O Unborn Lord! 14 Salutation to Thee O Enjoyer Lord! Salutation to Thee O Well-united Lord! Salutation to Thee O Colourless Lord! Salutation to Thee O Immortal Lord! 15 Salutation to Thee O Unfathomable Lord! Salutation to Thee O All-Pervasive Lord! Salutation to Thee O Water-Sustainer Lord! Salutation to Thee O Propless Lord! 16 Salutation to Thee O Casteless Lord! Salutation to Thee O Lineless Lord! Salutation to Thee O Religionless Lord! Salutation to Thee O Wonderful Lord! 17 Salutation to Thee O Homeless Lord! Salutation to Thee O Garbless Lord! Salutation to Thee O Abodeless Lord! Salutation to Thee O Spouseless Lord! 18 Salutation to Thee O All-destroyer Lord! Salutation to Thee O Entirely Generous Lord! Salutation to Thee O Mullti-form Lord! Salutation to Thee O Universal King Lord! 19 Salutation to Thee O Destroyer Lord! Salutation to Thee O Establisher Lord! Salutation to Thee O Annihilator Lord! Salutation to Thee O All-sustainer Lord! 20 Salutation to Thee O Divine Lord! Salutation to Thee O Mysterious Lord! Salutation to Thee O Unborn Lord! Salutation to Thee O Loveliest Lord! 21 Salutation to Thee O All-Pervasive Lord! Salutation of Thee O All-Permeator Lord! Salutation to Thee O All-loving Lord! Salutation to Thee O All-destroying Lord! 22 Salutation to Thee O Death-destroyer Lord! Salutation to Thee O Beneficent Lord! Salutation to Thee O Colourless Lord! Salutation to Thee O Deathless Lord! 23 Salutation to Thee O Omnipotent Lord! Salutation to Thee O Doer Lord.! Salutation to Thee O Involved Lord! Salutation to Thee O Detached Lord! 24 Salutation to Thee O Kindredless Lord! Salutation to Thee O Fearless Lord! Salutation to Thee O Generous Lord! Salutation to Thee O Merciful Lord! 25 Salutation to Thee O Infinite Lord! Salutation to the Thee O Greatest Lord! Salutation to Thee O Lover Lord! Salutation to Thee O Universal Master Lord! 26 Salutation to Thee O Destroyer Lord! Salutation to Thee O Sustainer Lord! Salutation to Thee O Creator Lord! Salutation to Thee O Great Indulger Lord! 27 Salutation to Thee O Greatest Yogi Lord! Salutation to Thee Great Indulger Lord! Salutation to Thee O Gracious Lord! Salutation to Thee O sustainer Lord! 28`,
        meaning_pa: `ਭੁਜੰਗ ਪ੍ਰਯਾਤ ਛੰਦ: ਹੇ ਅਕਾਲ ਪੁਰਖ! ਤੈਨੂੰ ਨਮਸਕਾਰ ਹੈ; ਹੇ ਮੇਹਰਾਂ ਦੇ ਦਾਤੇ! ਤੈਨੂੰ ਨਮਸਕਾਰ ਹੈ; ਹੇ ਰੂਪ-ਰਹਿਤ! ਤੈਨੂੰ ਨਮਸਕਾਰ ਹੈ; ਹੇ ਉਪਮਾ-ਰਹਿਤ! ਤੈਨੂੰ ਨਮਸਕਾਰ ਹੈ ॥੨॥ ਹੇ ਭੇਖਰਹਿਤ! ਤੈਨੂੰ ਨਮਸਕਾਰ ਹੈ; ਹੇ ਲਿਖੇ ਨਾ ਜਾ ਸਕਣ ਵਾਲੇ! ਤੈਨੂੰ ਨਮਸਕਾਰ ਹੈ; ਹੇ ਕਾਇਆ-ਰਹਿਤ! ਤੈਨੂੰ ਨਮਸਕਾਰ ਹੈ; ਹੇ ਅਜਨਮੇ! ਤੈਨੂੰ ਨਮਸਕਾਰ ਹੈ ॥੩॥ ਹੇ ਨਸ਼ਟ ਨਾ ਹੋ ਸਕਣ ਵਾਲੇ! ਤੈਨੂੰ ਨਮਸਕਾਰ ਹੈ; ਹੇ ਨਾ ਭੰਨੇ ਜਾ ਸਕਣ ਵਾਲੇ! ਤੈਨੂੰ ਨਮਸਕਾਰ ਹੈ; ਹੇ ਨਾਮ-ਰਹਿਤ! ਤੈਨੂੰ ਨਮਸਕਾਰ ਹੈ; ਹੇ ਸਥਾਨ-ਰਹਿਤ! ਤੈਨੂੰ ਨਮਸਕਾਰ ਹੈ ॥੪॥ ਹੇ ਕਰਮ-ਅਤੀਤ! ਤੈਨੂੰ ਨਮਸਕਾਰ ਹੈ; ਹੇ ਧਰਮ-ਅਤੀਤ! ਤੈਨੂੰ ਨਮਸਕਾਰ ਹੈ; ਹੇ ਨਾਮਰਹਿਤ! ਤੈਨੂੰ ਨਮਸਕਾਰ ਹੈ; ਹੇ ਧਾਮ-ਰਹਿਤ! ਤੈਨੂੰ ਨਮਸਕਾਰ ਹੈ ॥੫॥ ਹੇ ਨਾ ਜਿਤੇ ਜਾ ਸਕਣ ਵਾਲੇ! ਤੈਨੂੰ ਨਮਸਕਾਰ ਹੈ; ਹੇ ਨਾ ਡਰਾਏ ਜਾ ਸਕਣ ਵਾਲੇ! ਤੈਨੂੰ ਨਮਸਕਾਰ ਹੈ; ਹੇ ਨਾ ਚਲਾਏ ਜਾ ਸਕਣ ਵਾਲੇ! ਤੈਨੂੰ ਨਮਸਕਾਰ ਹੈ; ਹੇ ਨਾ ਢਾਹੇ ਜਾ ਸਕਣ ਵਾਲੇ! ਤੈਨੂੰ ਨਮਸਕਾਰ ਹੈ ॥੬॥ ਹੇ ਬਿਨਾ ਰੰਗ ਵਾਲੇ (ਉਜਲੇ)! ਤੈਨੂੰ ਨਮਸਕਾਰ ਹੈ; ਹੇ ਬਿਨਾ ਆਦਿ (ਮੁੱਢ) ਵਾਲੇ! ਤੈਨੂੰ ਨਮਸਕਾਰ ਹੈ; ਹੇ ਨਾ ਛੇਦੇ ਜਾ ਸਕਣ ਵਾਲੇ! ਤੈਨੂੰ ਨਮਸਕਾਰ ਹੈ; ਹੇ ਨਾ ਥਾਹ ਪਾਏ ਜਾ ਸਕਣ ਵਾਲੇ! ਤੈਨੂੰ ਨਮਸਕਾਰ ਹੈ ॥੭॥ ਹੇ ਨਾ ਨਾਸ਼ ਕੀਤੇ ਜਾ ਸਕਣ ਵਾਲੇ (ਅਵਿਨਾਸ਼ੀ)! ਤੈਨੂੰ ਨਮਸਕਾਰ ਹੈ; ਹੇ ਨਾ ਤੋੜੇ ਜਾ ਸਕਣ ਵਾਲੇ (ਅਖੰਡ ਸਰੂਪ)! ਤੈਨੂੰ ਨਮਸਕਾਰ ਹੈ; ਹੇ ਉਦਾਰ ਸੁਭਾ ਵਾਲੇ! ਤੈਨੂੰ ਨਮਸਕਾਰ ਹੈ; ਹੇ ਅਪਰਅਪਾਰ! ਤੈਨੂੰ ਨਮਸਕਾਰ ਹੈ ॥੮॥ ਹੇ ਇਕੋ ਇਕ ਰੂਪ ਵਾਲੇ! ਤੈਨੂੰ ਨਮਸਕਾਰ ਹੈ; ਹੇ ਅਨੇਕ ਰੂਪ ਵਾਲੇ! ਤੈਨੂੰ ਨਮਸਕਾਰ ਹੈ; ਹੇ ਭੂਤਾਂ (ਪੰਜ ਤੱਤ੍ਵਾਂ- ਜਲ, ਧਰਤੀ, ਆਕਾਸ਼, ਵਾਯੂ ਅਤੇ ਅਗਨੀ) ਤੋਂ ਰਹਿਤ! ਤੈਨੂੰ ਨਮਸਕਾਰ ਹੈ; ਹੇ ਬੰਧਨ ਤੋਂ ਰਹਿਤ! ਤੈਨੂੰ ਨਮਸਕਾਰ ਹੈ ॥੯॥ ਹੇ ਕਰਮਕਾਂਡਾਂ ਤੋਂ ਰਹਿਤ! ਤੈਨੂੰ ਨਮਸਕਾਰ ਹੈ; ਹੇ ਭਰਮਾਂ ਤੋਂ ਰਹਿਤ! ਤੈਨੂੰ ਨਮਸਕਾਰ ਹੈ; ਹੇ ਬਿਨਾ ਕਿਸੇ ਖ਼ਾਸ ਦੇਸ਼ ਵਾਲੇ! ਤੈਨੂੰ ਨਮਸਕਾਰ ਹੈ; ਹੇ ਬਿਨਾ ਕਿਸੇ ਖ਼ਾਸ ਭੇਸ ਵਾਲੇ! ਤੈਨੂੰ ਨਮਸਕਾਰ ਹੈ ॥੧੦॥ ਹੇ ਨਾਮ-ਰਹਿਤ! ਤੈਨੂੰ ਨਮਸਕਾਰ ਹੈ; ਹੇ ਕਾਮਨਾ-ਰਹਿਤ! ਤੈਨੂੰ ਨਮਸਕਾਰ ਹੈ; ਹੇ ਤੱਤ੍ਵਾਂ ਤੋਂ ਰਹਿਤ! ਤੈਨੂੰ ਨਮਸਕਾਰ ਹੈ; ਹੇ ਘਾਤ (ਮਾਰੇ ਜਾਣ) ਤੋਂ ਰਹਿਤ! ਤੈਨੂੰ ਨਮਸਕਾਰ ਹੈ ॥੧੧॥ ਹੇ ਨਾ ਹਿਲਾਏ ਜਾ ਸਕਣ ਵਾਲੇ (ਅਚਲ ਸਰੂਪ)! ਤੈਨੂੰ ਨਮਸਕਾਰ ਹੈ; ਹੇ ਪੰਜ ਤੱਤ੍ਵਾਂ ਤੋਂ ਨਾ ਬਣਨ ਵਾਲੇ! ਤੈਨੂੰ ਨਮਸਕਾਰ ਹੈ; ਹੇ ਨਾ ਵੇਖੇ ਜਾ ਸਕਣ ਵਾਲੇ! ਤੈਨੂੰ ਨਮਸਕਾਰ ਹੈ; ਹੇ ਸੋਗੀ ਨਾ ਹੋ ਸਕਣ ਵਾਲੇ! ਤੈਨੂੰ ਨਮਸਕਾਰ ਹੈ ॥੧੨॥ ਹੇ ਸੰਤਾਪ-ਰਹਿਤ! ਤੈਨੂੰ ਨਮਸਕਾਰ ਹੈ; ਹੇ ਸਥਾਪਨਾ-ਰਹਿਤ! ਤੈਨੂੰ ਨਮਸਕਾਰ ਹੈ; ਹੇ ਤਿੰਨਾਂ ਕਾਲਾਂ (ਅਥਵਾ ਤਿੰਨਾਂ ਲੋਕਾਂ) ਵਿਚ ਮੰਨੇ ਜਾਣ ਵਾਲੇ! ਤੈਨੂੰ ਨਮਸਕਾਰ ਹੈ; ਹੇ (ਸਭ ਦੇ) ਭੰਡਾਰ ਸਰੂਪ! ਤੈਨੂੰ ਨਮਸਕਾਰ ਹੈ ॥੧੩॥ ਹੇ ਨਾ ਪਕੜੇ ਜਾ ਸਕਣ ਵਾਲੇ! ਤੈਨੂੰ ਨਮਸਕਾਰ ਹੈ; ਹੇ ਨਾ ਚਲਾਏ ਜਾ ਸਕਣ ਵਾਲੇ! ਤੈਨੂੰ ਨਮਸਕਾਰ ਹੈ; ਹੇ ਤਿੰਨ ਵਰਗਾਂ (ਧਰਮ, ਅਰਥ ਅਤੇ ਕਾਮ) ਤੋਂ ਰਹਿਤ! ਤੈਨੂੰ ਨਮਸਕਾਰ ਹੈ; ਹੇ ਉਤਪੱਤੀ (ਸਰਗ) ਤੋਂ ਰਹਿਤ! ਤੈਨੂੰ ਨਮਸਕਾਰ ਹੈ ॥੧੪॥ ਹੇ ਉਤਮ ਫਲ (ਭੋਗ-ਸਾਮਗ੍ਰੀ) ਦੇਣ ਵਾਲੇ! ਤੈਨੂੰ ਨਮਸਕਾਰ ਹੈ; ਹੇ ਸਾਰੀਆਂ ਯੋਗਤਾਵਾਂ ਵਾਲੇ! ਤੈਨੂੰ ਨਮਸਕਾਰ ਹੈ; ਹੇ ਰੰਗ (ਵਰਣ) ਰਹਿਤ! ਤੈਨੂੰ ਨਮਸਕਾਰ ਹੈ; ਹੇ ਅਟੁੱਟ! ਤੈਨੂੰ ਨਮਸਕਾਰ ਹੈ ॥੧੫॥ ਹੇ ਪਹੁੰਚ ਤੋਂ ਪਰੇ! ਤੈਨੂੰ ਨਮਸਕਾਰ ਹੈ; ਹੇ ਸੁੰਦਰ ਸਰੂਪ ਵਾਲੇ! ਤੈਨੂੰ ਨਮਸਕਾਰ ਹੈ; ਹੇ ਜਲ-ਆਸ਼ੇ (ਸਮੁੰਦਰ)! ਤੈਨੂੰ ਨਮਸਕਾਰ ਹੈ; ਹੇ ਬਿਨਾ ਆਸਰੇ ਵਾਲੇ! ਤੈਨੂੰ ਨਮਸਕਾਰ ਹੈ ॥੧੬॥ ਹੇ ਜਾਤੀ-ਰਹਿਤ! ਤੈਨੂੰ ਨਮਸਕਾਰ ਹੈ; ਹੇ ਗੋਤ-ਬਰਾਦਰੀ (ਪਾਂਤੀ) ਰਹਿਤ! ਤੈਨੂੰ ਨਮਸਕਾਰ ਹੈ; ਹੇ ਮਜ਼੍ਹਬ ਤੋਂ ਰਹਿਤ! ਤੈਨੂੰ ਨਮਸਕਾਰ ਹੈ; ਹੇ ਅਜਬ ਸਰੂਪ ਵਾਲੇ! ਤੈਨੂੰ ਨਮਸਕਾਰ ਹੈ ॥੧੭॥ ਹੇ ਦੇਸ-ਰਹਿਤ (ਸਰਬ-ਵਿਆਪੀ)! ਤੈਨੂੰ ਨਮਸਕਾਰ ਹੈ; ਹੇ ਭੇਸ ਰਹਿਤ! ਤੈਨੂੰ ਨਮਸਕਾਰ ਹੈ; ਹੇ ਧਾਮ (ਠਿਕਾਣਾ) ਰਹਿਤ! ਤੈਨੂੰ ਨਮਸਕਾਰ ਹੈ; ਹੇ ਮਾਇਆ (ਬਾਮ) ਰਹਿਤ! ਤੈਨੂੰ ਨਮਸਕਾਰ ਹੈ ॥੧੮॥ ਹੇ ਸਾਰਿਆਂ ਦੇ ਕਾਲ-ਸਰੂਪ! ਤੈਨੂੰ ਨਮਸਕਾਰ ਹੈ; ਹੇ ਸਾਰਿਆਂ ਉਤੇ ਦਿਆਲੂ! (ਤੈਨੂੰ) ਨਮਸਕਾਰ ਹੈ; ਹੇ ਸਾਰਿਆਂ ਰੂਪਾਂ ਵਾਲੇ! (ਤੈਨੂੰ) ਨਮਸਕਾਰ ਹੈ; ਹੇ ਸਾਰਿਆਂ ਦੇ ਰਾਜੇ (ਭੂਪ)! (ਤੈਨੂੰ) ਨਮਸਕਾਰ ਹੈ ॥੧੯॥ ਹੇ ਸਾਰਿਆਂ ਨੂੰ ਖਪਾਉਣ ਵਾਲੇ! (ਤੈਨੂੰ) ਨਮਸਕਾਰ ਹੈ; ਹੇ ਸਾਰਿਆਂ ਨੂੰ ਸਥਾਪਿਤ ਕਰਨ ਵਾਲੇ! (ਤੈਨੂੰ) ਨਮਸਕਾਰ ਹੈ; ਹੇ ਸਾਰਿਆਂ ਦੇ ਕਾਲ-ਰੂਪ! (ਤੈਨੂੰ) ਨਮਸਕਾਰ ਹੈ; ਹੇ ਸਾਰਿਆਂ ਦੇ ਪਾਲਕ! (ਤੈਨੂੰ) ਨਮਸਕਾਰ ਹੈ ॥੨੦॥ ਹੇ (ਕਰਮ-ਫਲ) ਦੇਣ ਵਾਲੇ! ਤੈਨੂੰ ਨਮਸਕਾਰ ਹੈ; ਹੇ ਭੇਦ-ਰਹਿਤ! ਤੈਨੂੰ ਨਮਸਕਾਰ ਹੈ; ਹੇ ਜਨਮ-ਰਹਿਤ! ਤੈਨੂੰ ਨਮਸਕਾਰ ਹੈ; ਹੇ ਜਨਮ-ਸਹਿਤ! (ਸੰਤਾਨ ਅਥਵਾ ਪੁੱਤਰ ਰੂਪ ਵਿਚ ਪੈਦਾ ਹੋਣ ਵਾਲੇ-'ਸੁਵਨਮਯ') ਤੈਨੂੰ ਨਮਸਕਾਰ ਹੈ ॥੨੧॥ ਹੇ ਸਾਰਿਆਂ ਸਥਾਨਾਂ ਉਤੇ ਗਵਨ ਕਰਨ ਵਾਲੇ! (ਤੈਨੂੰ) ਨਮਸਕਾਰ ਹੈ; ਹੇ ਸਾਰਿਆਂ ਭੁਵਨਾਂ (ਲੋਕਾਂ) ਵਿਚ ਵਿਆਪਕ ਹੋਣ ਵਾਲੇ! (ਤੈਨੂੰ) ਨਮਸਕਾਰ ਹੈ; ਹੇ ਸਾਰਿਆਂ ਰੰਗਾਂ ਵਾਲੇ! (ਤੈਨੂੰ) ਨਮਸਕਾਰ ਹੈ; ਹੇ ਸਾਰਿਆਂ ਨੂੰ ਲਯ (ਨਸ਼ਟ) ਕਰਨ ਵਾਲੇ! (ਤੈਨੂੰ) ਨਮਸਕਾਰ ਹੈ ॥੨੨॥ ਹੇ ਕਾਲ ਦੇ ਵੀ ਕਾਲ! (ਤੈਨੂੰ) ਨਮਸਕਾਰ ਹੈ; ਹੇ ਸਭ ਉਤੇ ਦਇਆ ਕਰਨ ਵਾਲੇ! ਤੈਨੂੰ ਨਮਸਕਾਰ ਹੈ; ਹੇ ਵਰਣਨ ਤੋਂ ਪਰੇ (ਅਕਥਨੀ)! ਤੈਨੂੰ ਨਮਸਕਾਰ ਹੈ; ਹੇ ਮਰਨ ਤੋਂ ਪਰੇ (ਅਮਰ)! ਤੈਨੂੰ ਨਮਸਕਾਰ ਹੈ ॥੨੩॥ ਹੇ ਬੁਢਾਪੇ ਦੇ ਵੈਰੀ (ਬੁਢਾਪੇ ਤੋਂ ਮੁਕਤ)! ਤੈਨੂੰ ਨਮਸਕਾਰ ਹੈ; ਹੇ ਕ੍ਰਿਤ ਕਰਮਾਂ ਦੇ ਵੈਰੀ (ਕਰਮ-ਨਾਸ਼ਕ)! ਤੈਨੂੰ ਨਮਸਕਾਰ ਹੈ; ਹੇ ਸਾਰਿਆਂ ਧੰਧਿਆਂ ਦੇ ਪ੍ਰੇਰਕ! (ਤੈਨੂੰ) ਨਮਸਕਾਰ ਹੈ; ਹੇ ਬੰਧਨਾਂ ਤੋਂ ਮੁਕਤ! ਤੈਨੂੰ ਨਮਸਕਾਰ ਹੈ ॥੨੪॥ ਹੇ ਸਾਕਾਂ-ਸੰਬੰਧਾਂ ਤੋਂ ਰਹਿਤ! ਤੈਨੂੰ ਨਮਸਕਾਰ ਹੈ; ਹੇ ਡਰ ('ਬਾਕ') ਤੋਂ ਰਹਿਤ! ਤੈਨੂੰ ਨਮਸਕਾਰ ਹੈ; ਹੇ ਰਹਿਮ (ਦਇਆ) ਕਰਨ ਵਾਲੇ! ਤੈਨੂੰ ਨਮਸਕਾਰ ਹੈ; ਹੇ ਬਖ਼ਸ਼ਿਸ਼ (ਕਰਮ) ਕਰਨ ਵਾਲੇ! ਤੈਨੂੰ ਨਮਸਕਾਰ ਹੈ ॥੨੫॥ ਹੇ ਅਨੰਤ ਰੂਪ ਵਾਲੇ! ਤੈਨੂੰ ਨਮਸਕਾਰ ਹੈ; ਹੇ ਮਹਾਨ ਰੂਪ ਵਾਲੇ! ਤੈਨੂੰ ਨਮਸਕਾਰ ਹੈ; ਹੇ ਪ੍ਰੇਮ (ਰਾਗ) ਸਰੂਪ! ਤੈਨੂੰ ਨਮਸਕਾਰ ਹੈ; ਹੇ ਚੰਗੇ ਭਾਗਾਂ ਵਾਲੇ! ਤੈਨੂੰ ਨਮਸਕਾਰ ਹੈ ॥੨੬॥ ਹੇ ਸਭ ਨੂੰ ਸੁਕਾਉਣ (ਨਸ਼ਟ ਕਰਨ) ਵਾਲੇ! ਤੈਨੂੰ ਨਮਸਕਾਰ ਹੈ; ਹੇ ਸਭ ਦਾ ਪਾਲਨ (ਪੋਸ਼ਣ) ਕਰਨ ਵਾਲੇ! (ਤੈਨੂੰ) ਨਮਸਕਾਰ ਹੈ; ਹੇ ਸਭ ਦੇ ਸਿਰਜਨਹਾਰ! (ਤੈਨੂੰ) ਨਮਸਕਾਰ ਹੈ; ਹੇ ਸਭ ਨੂੰ ਖ਼ਤਮ (ਹਰਨ) ਕਰਨ ਵਾਲੇ! (ਤੈਨੂੰ) ਨਮਸਕਾਰ ਹੈ ॥੨੭॥ ਹੇ ਜੋਗਾਂ ਦੇ ਵੀ ਜੋਗ! (ਤੈਨੂੰ) ਨਮਸਕਾਰ ਹੈ; ਹੇ ਭੋਗਾਂ ਦੇ ਵੀ ਭੋਗ! (ਤੈਨੂੰ) ਨਮਸਕਾਰ ਹੈ; ਹੇ ਸਾਰਿਆਂ ਉਤੇ ਦਇਆ ਕਰਨ ਵਾਲੇ! (ਤੈਨੂੰ) ਨਮਸਕਾਰ ਹੈ; ਹੇ ਸਾਰਿਆਂ ਦੀ ਪਾਲਣਾ ਕਰਨ ਵਾਲੇ! (ਤੈਨੂੰ) ਨਮਸਕਾਰ ਹੈ ॥੨੮॥`
      },
      {
        number: 3,
        sanskrit: `ਚਾਚਰੀ ਛੰਦ ॥ ਤ੍ਵ ਪ੍ਰਸਾਦਿ ॥
ਅਰੂਪ ਹੈਂ ॥
ਅਨੂਪ ਹੈਂ ॥
ਅਜੂ ਹੈਂ ॥
ਅਭੂ ਹੈਂ ॥੨੯॥
ਅਲੇਖ ਹੈਂ ॥
ਅਭੇਖ ਹੈਂ ॥
ਅਨਾਮ ਹੈਂ ॥
ਅਕਾਮ ਹੈਂ ॥੩੦॥
ਅਧੇ ਹੈਂ ॥
ਅਭੇ ਹੈਂ ॥
ਅਜੀਤ ਹੈਂ ॥
ਅਭੀਤ ਹੈਂ ॥੩੧॥
ਤ੍ਰਿਮਾਨ ਹੈਂ ॥
ਨਿਧਾਨ ਹੈਂ ॥
ਤ੍ਰਿਬਰਗ ਹੈਂ ॥
ਅਸਰਗ ਹੈਂ ॥੩੨॥
ਅਨੀਲ ਹੈਂ ॥
ਅਨਾਦਿ ਹੈਂ ॥
ਅਜੇ ਹੈਂ ॥
ਅਜਾਦਿ ਹੈਂ ॥੩੩॥
ਅਜਨਮ ਹੈਂ ॥
ਅਬਰਨ ਹੈਂ ॥
ਅਭੂਤ ਹੈਂ ॥
ਅਭਰਨ ਹੈਂ ॥੩੪॥
ਅਗੰਜ ਹੈਂ ॥
ਅਭੰਜ ਹੈਂ ॥
ਅਝੂਝ ਹੈਂ ॥
ਅਝੰਝ ਹੈਂ ॥੩੫॥
ਅਮੀਕ ਹੈਂ ॥
ਰਫ਼ੀਕ ਹੈਂ ॥
ਅਧੰਧ ਹੈਂ ॥
ਅਬੰਧ ਹੈਂ ॥੩੬॥
ਨ੍ਰਿਬੂਝ ਹੈਂ ॥
ਅਸੂਝ ਹੈਂ ॥
ਅਕਾਲ ਹੈਂ ॥
ਅਜਾਲ ਹੈਂ ॥੩੭॥
ਅਲਾਹ ਹੈਂ ॥
ਅਜਾਹ ਹੈਂ ॥
ਅਨੰਤ ਹੈਂ ॥
ਮਹੰਤ ਹੈਂ ॥੩੮॥
ਅਲੀਕ ਹੈਂ ॥
ਨ੍ਰਿਸ੍ਰੀਕ ਹੈਂ ॥
ਨ੍ਰਿਲੰਭ ਹੈਂ ॥
ਅਸੰਭ ਹੈਂ ॥੩੯॥
ਅਗੰਮ ਹੈਂ ॥
ਅਜੰਮ ਹੈਂ ॥
ਅਭੂਤ ਹੈਂ ॥
ਅਛੂਤ ਹੈਂ ॥੪੦॥
ਅਲੋਕ ਹੈਂ ॥
ਅਸੋਕ ਹੈਂ ॥
ਅਕਰਮ ਹੈਂ ॥
ਅਭਰਮ ਹੈਂ ॥੪੧॥
ਅਜੀਤ ਹੈਂ ॥
ਅਭੀਤ ਹੈਂ ॥
ਅਬਾਹ ਹੈਂ ॥
ਅਗਾਹ ਹੈਂ ॥੪੨॥
ਅਮਾਨ ਹੈਂ ॥
ਨਿਧਾਨ ਹੈਂ ॥
ਅਨੇਕ ਹੈਂ ॥
ਫਿਰਿ ਏਕ ਹੈਂ ॥੪੩॥`,
        transliteration: `chaacharee chhand | tv prasaad |
aroop hain |
anoop hain |
ajoo hain |
abhoo hain |29|
alekh hain |
abhekh hain |
anaam hain |
akaam hain |30|
adhe hain |
abhe hain |
ajeet hain |
abheet hain |31|
trimaan hain |
nidhaan hain |
tribarag hain |
asarag hain |32|
aneel hain |
anaad hain |
aje hain |
ajaad hain |33|
ajanam hain |
abaran hain |
abhoot hain |
abharan hain |34|
aganj hain |
abhanj hain |
ajhoojh hain |
ajhanjh hain |35|
ameek hain |
rafeek hain |
adhandh hain |
abandh hain |36|
nriboojh hain |
asoojh hain |
akaal hain |
ajaal hain |37|
alaah hain |
ajaah hain |
anant hain |
mahant hain |38|
aleek hain |
nrisreek hain |
nrilanbh hain |
asanbh hain |39|
agam hain |
ajam hain |
abhoot hain |
achhoot hain |40|
alok hain |
asok hain |
akaram hain |
abharam hain |41|
ajeet hain |
abheet hain |
abaah hain |
agaah hain |42|
amaan hain |
nidhaan hain |
anek hain |
fir ek hain |43|`,
        meaning: `CHACHARI STANZA. BY THY GRACE Thou art Formless Lord ! Thou art Unparalleled Lord! Thou art Unborn Lord! Thou art Non-Being Lord! 29 Thou art Unaccountable Lord! Thou art Garbless Lord! Thou art Nameless Lord! Thou art Desireless Lord! 30 Thou art Propless Lord! Thou art Non-Discriminating Lord! Thou art Unconquerable Lord! Thou art Fearless Lord! 31 Thou art Universally-Honoured Lord! Thou art the Treasure Lord! Thou art Master of Attributes Lord! Thou art Unborn Lord! 32 Thou art Colourless Lord! Thou art Beginningless Lord! Thou art Unborn Lord! Thou art Independent Lord! 33 Thou art Unborn Lord! Thou art Colourless Lord! Thou art Elementless Lord! Thou art Perfect Lord! 34 Thou art Invincible Lord! Thou art Unbreakable Lord! Thou art Unconquerable Lord! Thou are Tensionless Lord! 35 Thou art Deepest Lord! Thou art Friendliest Lord! Thou art Strife less Lord! Thou art Bondless Lord! 36 Thou art Unthinkable Lord! Thou art Unknowable Lord! Thou art Immortal Lord! Thou art Unbound Lord! 37 Thou art Unbound Lord! Thou art Placeless Lord! Thou art Infinite Lord! Thou art Greatest Lord! 38 Thou art Limitless Lord! Thou art Unparalleled Lord! Thou art Propless Lord! Thou art Unborn Lord! 39 Thou art Unfathomable Lord! Thou art Unborn Lord! Thou art Elementless Lord! Thou art Uncontaminated Lord! 40 Thou art All-Pervasive Lord! Thou art Woeless Lord! Thou art Deedless Lord! Thou art Illusionless Lord! 41 Thou art Unconquerable Lord! Thou art Fearless Lord! Thou art Motionless Lord! Thou art Unfathomable Lord.! 42 Thou art Immeasurable Lord! Thou art the Treasure Lord! Thou art Manifold Lord! Thou art the Only one Lord! 43`,
        meaning_pa: `ਚਾਚਰੀ ਛੰਦ: ਤੇਰੀ ਕ੍ਰਿਪਾ ਨਾਲ: (ਹੇ ਪ੍ਰਭੂ! ਤੂੰ) ਰੂਪ ਤੋਂ ਰਹਿਤ ਹੈਂ, ਉਪਮਾ ਤੋਂ ਰਹਿਤ ਹੈਂ, ਜਨਮ ਤੋਂ ਰਹਿਤ ਹੈਂ, (ਪੰਜ) ਭੂਤਾਂ ਤੋਂ ਰਹਿਤ ਹੈਂ ॥੨੯॥ (ਤੂੰ) ਲੇਖ-ਰਹਿਤ ਹੈਂ, ਭੇਖ-ਰਹਿਤ ਹੈਂ, ਨਾਮ-ਰਹਿਤ ਹੈਂ, ਕਾਮਨਾ-ਰਹਿਤ ਹੈਂ ॥੩੦॥ (ਤੂੰ) ਧਿਆਨ-ਰਹਿਤ ਹੈਂ, ਭੇਦ-ਰਹਿਤ ਹੈਂ, ਅਜਿਤ ਹੈਂ, ਅਭੈ ਹੈਂ ॥੩੧॥ (ਤੂੰ) ਤਿੰਨਾਂ ਲੋਕਾਂ ਵਿਚ ਮੰਨਣਯੋਗ ਹੈਂ, (ਸਭ ਦਾ) ਖ਼ਜ਼ਾਨਾ ਹੈਂ, ਤਿੰਨ ਵਰਗਾਂ (ਧਰਮ, ਅਰਥ ਅਤੇ ਕਾਮ ਜਾਂ ਦੇਵਤਾ, ਦੈਂਤ ਅਤੇ ਮਨੁੱਖ) ਤੋਂ ਰਹਿਤ ਹੈਂ, ਉਤਪਤੀ (ਸਰਗ) ਰਹਿਤ ਹੈਂ ॥੩੨॥ (ਤੂੰ) ਰੰਗ-ਰਹਿਤ (ਅਥਵਾ ਸੰਖਿਆ ਰਹਿਤ) ਹੈਂ, ਆਦਿ ਰਹਿਤ ਹੈਂ, ਅਜਿਤ ਹੈਂ, ਬ੍ਰਹਮਾ (ਅਜ) ਤੋਂ ਵੀ ਪਹਿਲਾਂ ਦਾ ਹੈਂ ॥੩੩॥ (ਤੂੰ) ਜਨਮ-ਰਹਿਤ ਹੈਂ, ਰੰਗ (ਵਰਨ) ਰਹਿਤ ਹੈਂ, ਤੱਤ੍ਵ (ਭੂਤ) ਰਹਿਤ ਹੈਂ, ਪੋਸ਼ਣ (ਭਰਨ) ਰਹਿਤ ਹੈਂ ॥੩੪॥ (ਤੂੰ) ਨਾਸ਼-ਰਹਿਤ ਹੈਂ, ਅਟੁੱਟ ਹੈਂ, ਨਿਰਦੁਅੰਦ (ਝਗੜੇ ਤੋਂ ਮੁਕਤ) ਹੈਂ, ਅਡੋਲ ਹੈਂ ॥੩੫॥ (ਤੂੰ) ਅਥਾਹ (ਅਮੀਕ) ਹੈਂ, (ਸਭਨਾਂ ਦਾ) ਸਾਥੀ ਹੈਂ, ਧੰਧਿਆਂ ਤੋਂ ਰਹਿਤ ਹੈਂ, ਬੰਧਨ ਤੋਂ ਰਹਿਤ ਹੈਂ ॥੩੬॥ (ਤੂੰ) ਨਿਰਬੂਝ (ਬੁਝੇ ਜਾਣ ਤੋਂ ਪਰੇ) ਹੈਂ, ਅਸੂਝ (ਸਮਝੇ ਜਾਣ ਤੋਂ ਪਰੇ) ਹੈਂ, ਕਾਲ-ਰਹਿਤ ਹੈ, ਮਾਇਆ-ਜਾਲ ਤੋਂ ਮੁਕਤ ਹੈਂ ॥੩੭॥ (ਤੂੰ) ਲਾਭ (ਲਾਹ) ਪ੍ਰਾਪਤ ਕਰਨ ਤੋਂ ਮੁਕਤ ਹੈਂ, ਬਿਨਾ ਕਿਸੇ ਸਥਾਨ ਦੇ ਹੈਂ, ਅੰਤ-ਰਹਿਤ ਹੈਂ, ਮਹਾਨਤਾ ਵਾਲਾ ਹੈਂ ॥੩੮॥ (ਤੂੰ) ਅਸੀਮ (ਲਕੀਰ ਤੋਂ ਮੁਕਤ) ਹੈਂ, ਲਾ-ਸ਼ਰੀਕ ਹੈਂ, ਆਸਰਾ-ਰਹਿਤ ਹੈਂ, ਜਨਮ ਰਹਿਤ (ਸ੍ਵਯੰਭਵ) ਹੈਂ ॥੩੯॥ (ਤੂੰ) ਪਹੁੰਚ ਤੋਂ ਪਰੇ ਹੈਂ, ਜਨਮ ਤੋਂ ਰਹਿਤ ਹੈਂ, ਪੰਜ ਭੌਤਿਕ ਹੋਂਦ ਤੋਂ ਪਰੇ ਹੈਂ, ਅਛੋਹ ਹੈਂ ॥੪੦॥ (ਤੂੰ) ਅਦ੍ਰਿਸ਼ ਹੈਂ, ਸੋਗ-ਰਹਿਤ ਹੈਂ, ਕਰਮ-ਰਹਿਤ ਹੈਂ, ਭਰਮ-ਰਹਿਤ ਹੈਂ ॥੪੧॥ (ਤੂੰ) ਅਜਿਤ ਹੈਂ, ਨਿਡਰ ਹੈਂ, ਅਚਲ (ਵਾਹਨ ਦੁਆਰਾ ਚਲਾਏ ਨਾ ਜਾ ਸਕਣ ਵਾਲਾ) ਹੈਂ, ਅਥਾਹ (ਸਮੁੰਦਰ ਵਾਂਗ) ਹੈਂ ॥੪੨॥ (ਤੂੰ) ਅਮਿਤ ਹੈਂ, (ਸਭ ਦਾ) ਖ਼ਜ਼ਾਨਾ ਹੈਂ, ਅਨੇਕ ਰੂਪਾਂ ਵਾਲਾ ਹੈਂ, ਪਰ ਫਿਰ ਵੀ ਇਕ ਹੈਂ ॥੪੩॥`
      },
      {
        number: 4,
        sanskrit: `ਭੁਜੰਗ ਪ੍ਰਯਾਤ ਛੰਦ ॥
ਨਮੋ ਸਰਬ ਮਾਨੇ ॥
ਸਮਸਤੀ ਨਿਧਾਨੇ ॥
ਨਮੋ ਦੇਵ ਦੇਵੇ ॥
ਅਭੇਖੀ ਅਭੇਵੇ ॥੪੪॥
ਨਮੋ ਕਾਲ ਕਾਲੇ ॥
ਨਮੋ ਸਰਬ ਪਾਲੇ ॥
ਨਮੋ ਸਰਬ ਗਉਣੇ ॥
ਨਮੋ ਸਰਬ ਭਉਣੇ ॥੪੫॥
ਅਨੰਗੀ ਅਨਾਥੇ ॥
ਨ੍ਰਿਸੰਗੀ ਪ੍ਰਮਾਥੇ ॥
ਨਮੋ ਭਾਨ ਭਾਨੇ ॥
ਨਮੋ ਮਾਨ ਮਾਨੇ ॥੪੬॥
ਨਮੋ ਚੰਦ੍ਰ ਚੰਦ੍ਰੇ ॥
ਨਮੋ ਭਾਨ ਭਾਨੇ ॥
ਨਮੋ ਗੀਤ ਗੀਤੇ ॥
ਨਮੋ ਤਾਨ ਤਾਨੇ ॥੪੭॥
ਨਮੋ ਨ੍ਰਿੱਤ ਨ੍ਰਿੱਤੇ ॥
ਨਮੋ ਨਾਦ ਨਾਦੇ ॥
ਨਮੋ ਪਾਨ ਪਾਨੇ ॥
ਨਮੋ ਬਾਦ ਬਾਦੇ ॥੪੮॥
ਅਨੰਗੀ ਅਨਾਮੇ ॥
ਸਮਸਤੀ ਸਰੂਪੇ ॥
ਪ੍ਰਭੰਗੀ ਪ੍ਰਮਾਥੇ ॥
ਸਮਸਤੀ ਬਿਭੂਤੇ ॥੪੯॥
ਕਲੰਕੰ ਬਿਨਾ ਨੇਕਲੰਕੀ ਸਰੂਪੇ ॥
ਨਮੋ ਰਾਜ ਰਾਜੇਸ੍ਵਰੰ ਪਰਮ ਰੂਪੇ ॥੫੦॥
ਨਮੋ ਜੋਗ ਜੋਗੇਸ੍ਵਰੰ ਪਰਮ ਸਿੱਧੇ ॥
ਨਮੋ ਰਾਜ ਰਾਜੇਸ੍ਵਰੰ ਪਰਮ ਬ੍ਰਿਧੇ ॥੫੧॥
ਨਮੋ ਸਸਤ੍ਰ ਪਾਣੇ ॥
ਨਮੋ ਅਸਤ੍ਰ ਮਾਣੇ ॥
ਨਮੋ ਪਰਮ ਗਿਆਤਾ ॥
ਨਮੋ ਲੋਕ ਮਾਤਾ ॥੫੨॥
ਅਭੇਖੀ ਅਭਰਮੀ ਅਭੋਗੀ ਅਭੁਗਤੇ ॥
ਨਮੋ ਜੋਗ ਜੋਗੇਸ੍ਵਰੰ ਪਰਮ ਜੁਗਤੇ ॥੫੩॥
ਨਮੋ ਨਿੱਤ ਨਾਰਾਇਣੇ ਕ੍ਰੂਰ ਕਰਮੇ ॥
ਨਮੋ ਪ੍ਰੇਤ ਅਪ੍ਰੇਤ ਦੇਵੇ ਸੁਧਰਮੇ ॥੫੪॥
ਨਮੋ ਰੋਗ ਹਰਤਾ ਨਮੋ ਰਾਗ ਰੂਪੇ ॥
ਨਮੋ ਸਾਹ ਸਾਹੰ ਨਮੋ ਭੂਪ ਭੂਪੇ ॥੫੫॥
ਨਮੋ ਦਾਨ ਦਾਨੇ ਨਮੋ ਮਾਨ ਮਾਨੇ ॥
ਨਮੋ ਰੋਗ ਰੋਗੇ ਨਮਸਤੰ ਸਨਾਨੇ ॥੫੬॥
ਨਮੋ ਮੰਤ੍ਰ ਮੰਤ੍ਰੰ ॥
ਨਮੋ ਜੰਤ੍ਰ ਜੰਤ੍ਰੰ ॥
ਨਮੋ ਇਸਟ ਇਸਟੇ ॥
ਨਮੋ ਤੰਤ੍ਰ ਤੰਤ੍ਰੰ ॥੫੭॥
ਸਦਾ ਸੱਚਦਾਨੰਦ ਸਰਬੰ ਪ੍ਰਣਾਸੀ ॥
ਅਨੂਪੇ ਅਰੂਪੇ ਸਮਸਤੁਲ ਨਿਵਾਸੀ ॥੫੮॥
ਸਦਾ ਸਿਧ ਦਾ ਬੁਧ ਦਾ ਬ੍ਰਿਧ ਕਰਤਾ ॥
ਅਧੋ ਉਰਧ ਅਰਧੰ ਅਘੰ ਓਘ ਹਰਤਾ ॥੫੯॥
ਪਰੰ ਪਰਮ ਪਰਮੇਸ੍ਵਰੰ ਪ੍ਰੋਛ ਪਾਲੰ ॥
ਸਦਾ ਸਰਬ ਦਾ ਸਿੱਧ ਦਾਤਾ ਦਿਆਲੰ ॥੬੦॥
ਅਛੇਦੀ ਅਭੇਦੀ ਅਨਾਮੰ ਅਕਾਮੰ ॥
ਸਮਸਤੋ ਪਰਾਜੀ ਸਮਸਤਸਤੁ ਧਾਮੰ ॥੬੧॥`,
        transliteration: `bhujang prayaat chhand |
namo sarab maane |
samasatee nidhaane |
namo dev deve |
abhekhee abheve |44|
namo kaal kaale |
namo sarab paale |
namo sarab gaune |
namo sarab bhaune |45|
anangee anaathe |
nrisangee pramaathe |
namo bhaan bhaane |
namo maan maane |46|
namo chandr chandre |
namo bhaan bhaane |
namo geet geete |
namo taan taane |47|
namo nrat nrate |
namo naad naade |
namo paan paane |
namo baad baade |48|
anangee anaame |
samasatee saroope |
prabhangee pramaathe |
samasatee bibhoote |49|
kalankan binaa nekalankee saroope |
namo raaj raajesvaran param roope |50|
namo jog jogesvaran param sidhe |
namo raaj raajesvaran param bridhe |51|
namo sasatr paane |
namo asatr maane |
namo param giaataa |
namo lok maataa |52|
abhekhee abharamee abhogee abhugate |
namo jog jogesvaran param jugate |53|
namo nit naaraaeine kraoor karame |
namo pret apret deve sudharame |54|
namo rog harataa namo raag roope |
namo saah saahan namo bhoop bhoope |55|
namo daan daane namo maan maane |
namo rog roge namasatan sanaane |56|
namo mantr mantran |
namo jantr jantran |
namo isatt isatte |
namo tantr tantran |57|
sadaa sachadaanand saraban pranaasee |
anoope aroope samasatul nivaasee |58|
sadaa sidh daa budh daa bridh karataa |
adho uradh aradhan aghan ogh harataa |59|
paran param paramesvaran prochh paalan |
sadaa sarab daa sidh daataa diaalan |60|
achhedee abhedee anaaman akaaman |
samasato paraajee samasatasat dhaaman |61|`,
        meaning: `BHUJANG PRAYAAT STANZA Salutation to Thee O Universally-Honoured Lord! Salutation to Thee O the Treasure Lord! Salutation to Thee O Greatest Lord! Salutation to Thee O Garbless Lord! 44 Salutation to Thee O Death-Destroyer Lord! Salutation to Thee O Sustainer Lord! Salutation to Thee O All-Pervasive Lord! Salutation to Thee O Sustainer Lord! 45 Salutation to Thee O Limitless Lord! Salutation to Thee O Masterless Lord! Salutation to Thee O Omnipotent Lord! Salutation to Thee O Greatest Sun Lord! 46 Salutation to Thee O Moon-Soverieign Lord! Salutation to Thee O Sun-Sovereign Lord! Salutation to Thee O Supreme Song Lord! Salutation to Thee O Supreme Tune Lord! 47 Salutation to Thee O Supreme Dance Lord! Salutation to Thee O Supreme Sound Lord! Salutation to Thee O Water-Essence Lord! Salutation to Thee O Air-Essence Lord! 48 Salutation to Thee O Bodyless Lord!  Salutation to Thee O Nameless Lord ! Salutation to Thee O All-Form Lord! Salutation to Thee O Destroyer Lord!  Salutation to Thee O Omnipotent Lord! Salutation to Thee O Greatest to All Lord  49 Salutation to Thee O Supreme Sovereign Lord! Salutation to Thee O Most Beautiful Lord! Salutation to Thee O Supreme Sovereign Lord!  Salutation to Thee Most Beautiful Lord! 50 Salutation to Thee O Supreme Yogi Lord!  Salutation to Thee O Supreme Adept Lord! Salutation to Thee O Supreme Emperor Lord!  Salutation to Thee O Supreme Entity Lord! 51 Salutation to Thee O Weapon-wielder Lord! Salutation to Thee O Weapon-user Lord! Salutation to Thee O Supreme Knower Lord!  Salutation to Thee O Illusionless Lord! Salutation to Thee O Universal Mother Lord! 52 Salutation to Thee Garbless Lord!  Salutation to Thee O Temptationless Lord! Salutation to Thee O Supreme Yogi Lord!  Salutation to Thee O Supremely-disciplined Lord! 53 Salutation to Thee O Benign Protector Lord!  Salutation to Thee O Heinous-actions-Performer Lord! Salutation to Thee O Virtuous-Sustainer Lord !  Salutation to Thee O Love-Incarnate Lord! 54 Salutation to Thee O Ailments-remover Lord! Salutation to Thee O Love-Incarnate Lord! Salutation to Thee O Supreme Emperor Lord! Salutation to Thee O Supreme Sovereign Lord! 55 Salutation to Thee O Greatest Donor Lord! Salutation to Thee O Greatest-Honours-Recipient Lord! Salutation to Thee O Ailments-Destroyer Lord! Salutation to Thee O Health-Restorer Lord! 56 Salutation to Thee O Supreme Mantra Lord! Salutation to Thee O Supreme Yantra Lord! Salutation to Thee O Highest-Worship-Entity Lord! Salutation to Thee O Supreme Tantra Lord! 57 Thou art ever Lord Truth, Consciousness and Bliss Unique, Formless, All-Pervading and All-Destoryer.58. Thou art the Giver of riches and wisdom and Promoter. Thou Pervadest netherworld, heaven and space and Destroyer of inumerable sins.59. Thou art the Supreme Master and Sustain all without being seen, Thou art ever the Donor of riches and merciful.60. Thou art Invincible, Unbreakable, Nameless and Lustless. Thou art Victorious over all and art present every-where.61.`,
        meaning_pa: `ਭੁਜੰਗ ਪ੍ਰਯਾਤ ਛੰਦ: ਹੇ ਸਾਰਿਆਂ ਦੁਆਰਾ ਮੰਨੇ ਜਾਣ ਵਾਲੇ ਅਤੇ ਸਾਰੀਆਂ ਨਿਧੀਆਂ ਦੇ ਭੰਡਾਰ! (ਤੈਨੂੰ) ਨਮਸਕਾਰ ਹੈ; ਹੇ ਦੇਵਤਿਆਂ ਦੇ ਦੇਵਤੇ (ਤੈਨੂੰ) ਨਮਸਕਾਰ ਹੈ ਅਤੇ ਭੇਖ ਤੇ ਭੇਦ ਤੋਂ ਰਹਿਤ! (ਤੈਨੂੰ) ਨਮਸਕਾਰ ਹੈ ॥੪੪॥ ਹੇ ਕਾਲ ਦੇ ਕਾਲ! (ਤੈਨੂੰ) ਨਮਸਕਾਰ ਹੈ, ਹੇ ਸਭ ਦੇ ਪਾਲਕ! (ਤੈਨੂੰ) ਨਮਸਕਾਰ ਹੈ; ਹੇ ਸਭ ਥਾਂ ਗਵਨ ਕਰਨ ਵਾਲੇ! (ਤੈਨੂੰ) ਨਮਸਕਾਰ ਹੈ, ਹੇ ਸਾਰਿਆਂ ਭੁਵਨਾਂ (ਲੋਕਾਂ) ਵਿਚ ਰਹਿਣ ਵਾਲੇ! (ਤੈਨੂੰ) ਨਮਸਕਾਰ ਹੈ ॥੪੫॥ ਹੇ ਦੇਹ (ਅੰਗ) ਰਹਿਤ, ਸੁਆਮੀ (ਨਾਥ) ਰਹਿਤ, ਸੰਗ-ਸਾਥ ਰਹਿਤ, (ਸਭ ਦਾ) ਨਾਸ਼ ਕਰਨ ਵਾਲੇ ਅਤੇ ਸੂਰਜਾਂ ਦੇ ਸੂਰਜ, ਮਾਣਾਂ ਦੇ ਮਾਣ! (ਤੈਨੂੰ) ਨਮਸਕਾਰ ਹੈ ॥੪੬॥ ਹੇ ਚੰਦ੍ਰਮਿਆਂ ਦੇ ਚੰਦ੍ਰਮਾ! ਹੇ ਸੂਰਜਾਂ ਦੇ ਸੂਰਜ! ਹੇ ਗੀਤਾਂ ਦੇ ਗੀਤ! ਹੇ ਤਾਨਾਂ ਦੇ ਤਾਨ! (ਤੈਨੂੰ) ਨਮਸਕਾਰ ਹੈ ॥੪੭॥ ਹੇ ਨਾਚਾਂ ਦੇ ਨਾਚ! (ਤੈਨੂੰ) ਨਮਸਕਾਰ ਹੈ, ਹੇ ਨਾਦਾਂ ਦੇ ਨਾਦ (ਧ੍ਵਨੀ)! (ਤੈਨੂੰ) ਨਮਸਕਾਰ ਹੈ, ਹੇ ਹੱਥਾਂ ਦੇ ਹੱਥ! (ਤੈਨੂੰ) ਨਮਸਕਾਰ ਹੈ, ਹੇ ਵਾਜਿਆਂ ਦੇ ਵਾਜੇ! (ਤੈਨੂੰ) ਨਮਸਕਾਰ ਹੈ ॥੪੮॥ ਹੇ ਅੰਗ-ਰਹਿਤ, ਨਾਮ-ਰਹਿਤ, ਸਭ ਦੇ ਸਰੂਪ, ਦੁਖਦਾਇਕਾਂ ਨੂੰ ਨਸ਼ਟ ਕਰਨ ਵਾਲੇ ਅਤੇ ਸਾਰੀ ਸਾਮਗ੍ਰੀ ਦੇ ਭੰਡਾਰ! (ਤੈਨੂੰ) ਨਮਸਕਾਰ ਹੈ ॥੪੯॥ ਹੇ ਕਲੰਕ-ਰਹਿਤ, ਨਿਸ਼ਕਲੰਕ ਸਰੂਪ ਵਾਲੇ, ਰਾਜਿਆਂ ਦੇ ਰਾਜੇ ਅਤੇ ਮਹਾਨ ਰੂਪ ਵਾਲੇ! (ਤੈਨੂੰ) ਨਮਸਕਾਰ ਹੈ ॥੫੦॥ ਹੇ ਜੋਗੀਆਂ ਦੇ ਜੋਗੀ, ਸ੍ਰੇਸ਼ਠ ਸਿੱਧ ਸਰੂਪ! (ਤੈਨੂੰ) ਨਮਸਕਾਰ ਹੈ; ਹੇ ਰਾਜਿਆਂ ਦੇ ਰਾਜੇ, ਮਹਾਨ ਵਡਿਆਈ ਵਾਲੇ! (ਤੈਨੂੰ) ਨਮਸਕਾਰ ਹੈ ॥੫੧॥ ਹੇ ਹੱਥ ਵਿਚ ਸ਼ਸਤ੍ਰ ਧਾਰਨ ਕਰਨ ਵਾਲੇ! (ਤੈਨੂੰ) ਨਮਸਕਾਰ ਹੈ; ਹੇ ਅਸਤ੍ਰ ਵਰਤਣ ਵਾਲੇ! (ਤੈਨੂੰ) ਨਮਸਕਾਰ ਹੈ; ਹੇ ਸਭ ਕੁਝ ਜਾਣਨ ਵਾਲੇ (ਸਰਵੱਗ)! (ਤੈਨੂੰ) ਨਮਸਕਾਰ ਹੈ; ਹੇ ਜਗਤ ਦੇ ਮਾਤਾ ਸਰੂਪ! (ਤੈਨੂੰ) ਨਮਸਕਾਰ ਹੈ ॥੫੨॥ ਹੇ ਭੇਖਾਂ ਤੋਂ ਰਹਿਤ, ਭਰਮਾਂ ਤੋਂ ਰਹਿਤ, ਭੋਗਾਂ ਤੋਂ ਰਹਿਤ ਅਤੇ ਨਾ ਭੋਗੇ ਜਾ ਸਕਣ ਵਾਲੇ! ਹੇ ਜੋਗਾਂ ਦੇ ਵੀ ਜੋਗ ਅਤੇ ਸ੍ਰੇਸ਼ਠ ਜੁਗਤ ਵਾਲੇ! (ਤੈਨੂੰ) ਨਮਸਕਾਰ ਹੈ ॥੫੩॥ ਹੇ ਸਾਰਿਆਂ ਜੀਵਾਂ ਦਾ ਕਲਿਆਣ ਕਰਨ ਵਾਲੇ ਅਤੇ ਭਿਆਨਕ ਕਰਮ ਕਰਨ ਵਾਲੇ, ਪ੍ਰੇਤ-ਅਪ੍ਰੇਤ ਦਾ ਧਰਮ ਅਨੁਸਾਰ ਪਾਲਣ ਕਰਨ ਵਾਲੇ ਦੇਵ ਸਰੂਪ! (ਤੈਨੂੰ) ਨਮਸਕਾਰ ਹੈ ॥੫੪॥ ਹੇ ਰੋਗ-ਨਾਸ਼ਕ! (ਤੈਨੂੰ) ਨਮਸਕਾਰ ਹੈ; ਹੇ ਪ੍ਰੇਮ ਸਰੂਪ! (ਤੈਨੂੰ) ਨਮਸਕਾਰ ਹੈ; ਹੇ ਸ਼ਾਹਾਂ ਦੇ ਸ਼ਾਹ! (ਤੈਨੂੰ) ਨਮਸਕਾਰ ਹੈ; ਹੇ ਰਾਜਿਆਂ ਦੇ ਰਾਜੇ! (ਤੈਨੂੰ) ਨਮਸਕਾਰ ਹੈ ॥੫੫॥ ਹੇ ਦਾਨੀਆਂ ਦੇ ਵੀ ਦਾਨੀ! (ਤੈਨੂੰ) ਨਮਸਕਾਰ ਹੈ; ਹੇ ਮਾਣਾਂ ਦੇ ਮਾਣ! (ਤੈਨੂੰ) ਨਮਸਕਾਰ ਹੈ; ਹੇ ਰੋਗਾਂ ਦੇ ਰੋਗ (ਰੋਗ-ਨਾਸ਼ਕ)! (ਤੈਨੂੰ) ਨਮਸਕਾਰ ਹੈ; ਹੇ ਇਸ਼ਨਾਨ ਸਰੂਪ! ਤੈਨੂੰ ਨਮਸਕਾਰ ਹੈ ॥੫੬॥ ਹੇ ਮੰਤ੍ਰਾਂ ਦੇ ਮੰਤ੍ਰ! (ਤੈਨੂੰ) ਨਮਸਕਾਰ ਹੈ; ਹੇ ਯੰਤ੍ਰਾਂ ਦੇ ਯੰਤ੍ਰ! (ਤੈਨੂੰ) ਨਮਸਕਾਰ ਹੈ; ਹੇ ਇਸ਼ਟਾਂ ਦੇ ਇਸ਼ਟ! (ਤੈਨੂੰ) ਨਮਸਕਾਰ ਹੈ; ਹੇ ਤੰਤ੍ਰਾਂ ਦੇ ਤੰਤ੍ਰ! (ਤੈਨੂੰ) ਨਮਸਕਾਰ ਹੈ ॥੫੭॥ ਹੇ ਸਦਾ ਸੱਤ, ਚਿਤ, ਆਨੰਦ ਸਰੂਪ ਅਤੇ ਸਭ ਦਾ ਨਾਸ਼ ਕਰਨ ਵਾਲੇ! ਹੇ ਉਪਮਾਰਹਿਤ, ਰੂਪ-ਰਹਿਤ ਅਤੇ ਸਭ ਵਿਚ ਨਿਵਾਸ ਕਰ ਰਹੇ! (ਤੈਨੂੰ ਨਮਸਕਾਰ ਹੈ) ॥੫੮॥ ਹੇ ਸਦਾ ਸਿੱਧੀ ਦੇਣ ਵਾਲੇ, ਬੁੱਧੀ ਦੇਣ ਵਾਲੇ ਅਤੇ ਵਾਧਾ ਕਰਨ ਵਾਲੇ, ਸਾਰੇ ('ਓਘ') ਉਤਮ, ਮਧਮ ਅਤੇ ਅਧਮ ਪਾਪਾਂ ('ਅਘੰ') ਨੂੰ ਨਸ਼ਟ ਕਰਨ ਵਾਲੇ! (ਤੈਨੂੰ) ਨਮਸਕਾਰ ਹੈ ॥੫੯॥ ਹੇ ਪਰਮ ਸ੍ਰੇਸ਼ਠ ਪਰਮੇਸ਼ਵਰ! (ਤੂੰ ਸਭ ਦੀ) ਪਰੋਖ (ਅਦ੍ਰਿਸ਼) ਰੂਪ ਵਿਚ ਪਾਲਣਾ ਕਰਨ ਵਾਲਾ ਹੈਂ; ਹੇ ਦਿਆਲੂ! (ਤੂੰ) ਸਦਾ ਸਾਰਿਆਂ ਸਮਿਆਂ ਵਿਚ ਸਿੱਧੀਆਂ ਪ੍ਰਦਾਨ ਕਰਨ ਵਾਲਾ ਹੈਂ ॥੬੦॥ (ਹੇ ਪ੍ਰਭੂ!) ਨਾ (ਤੂੰ) ਕਟਿਆ ਜਾ ਸਕਦਾ ਹੈਂ, ਨਾ ਤੋੜਿਆ ਜਾ ਸਕਦਾ ਹੈਂ, ਤੂੰ ਨਾਮ ਅਤੇ ਕਾਮਨਾ ਤੋਂ ਰਹਿਤ ਹੈਂ; (ਤੂੰ) ਸਾਰੀ ਦੁਨੀਆ ਪੈਦਾ ਕੀਤੀ ਹੈ ਅਤੇ ਸਾਰੀ ਦਾ ਹੀ (ਤੂੰ) ਆਸਰਾ ਹੈਂ ॥੬੧॥`
      },
      {
        number: 5,
        sanskrit: `ਤੇਰਾ ਜੋਰੁ ॥ ਚਾਚਰੀ ਛੰਦ ॥
ਜਲੇ ਹੈਂ ॥
ਥਲੇ ਹੈਂ ॥
ਅਭੀਤ ਹੈਂ ॥
ਅਭੇ ਹੈਂ ॥੬੨॥
ਪ੍ਰਭੂ ਹੈਂ ॥
ਅਜੂ ਹੈਂ ॥
ਅਦੇਸ ਹੈਂ ॥
ਅਭੇਸ ਹੈਂ ॥੬੩॥`,
        transliteration: `teraa jor | chaacharee chhand |
jale hain |
thale hain |
abheet hain |
abhe hain |62|
prabhoo hain |
ajoo hain |
ades hain |
abhes hain |63|`,
        meaning: `ALL THY MIGHT. CHACHARI STANZA Thou art in water. Thou art on land. Thou art Fearless. Thou art Indiscriminate.62. Thou art the Master of all. Thou art Unborn. Thou art Countryless. Thou art Garbless.63.`,
        meaning_pa: `ਤੇਰਾ ਬਲ: ਚਾਚਰੀ ਛੰਦ: (ਹੇ ਪ੍ਰਭੂ! ਤੂੰ) ਜਲ ਵਿਚ ਹੈਂ, ਥਲ ਵਿਚ ਹੈਂ, ਅਭੈ ਹੈਂ; (ਤੇਰੇ) ਭੇਦ ਨੂੰ ਨਹੀਂ ਪਾਇਆ ਜਾ ਸਕਦਾ ॥੬੨॥ (ਤੂੰ ਸਭ ਦਾ) ਸੁਆਮੀ ਹੈਂ, ਜਨਮ ਤੋਂ ਬਿਨਾ ਹੈਂ, ਦੇਸ ਤੋਂ ਬਿਨਾ ਹੈਂ, ਭੇਸ ਤੋਂ ਬਿਨਾ ਹੈਂ ॥੬੩॥`
      },
      {
        number: 6,
        sanskrit: `ਭੁਜੰਗ ਪ੍ਰਯਾਤ ਛੰਦ ॥
ਅਗਾਧੇ ਅਬਾਧੇ ॥
ਅਨੰਦੀ ਸਰੂਪੇ ॥
ਨਮੋ ਸਰਬ ਮਾਨੇ ॥
ਸਮਸਤੀ ਨਿਧਾਨੇ ॥੬੪॥
ਨਮਸਤ੍ਵੰ ਨ੍ਰਿਨਾਥੇ ॥
ਨਮਸਤ੍ਵੰ ਪ੍ਰਮਾਥੇ ॥
ਨਮਸਤ੍ਵੰ ਅਗੰਜੇ ॥
ਨਮਸਤ੍ਵੰ ਅਭੰਜੇ ॥੬੫॥
ਨਮਸਤ੍ਵੰ ਅਕਾਲੇ ॥
ਨਮਸਤ੍ਵੰ ਅਪਾਲੇ ॥
ਨਮੋ ਸਰਬ ਦੇਸੇ ॥
ਨਮੋ ਸਰਬ ਭੇਸੇ ॥੬੬॥
ਨਮੋ ਰਾਜ ਰਾਜੇ ॥
ਨਮੋ ਸਾਜ ਸਾਜੇ ॥
ਨਮੋ ਸ਼ਾਹ ਸ਼ਾਹੇ ॥
ਨਮੋ ਮਾਹ ਮਾਹੇ ॥੬੭॥
ਨਮੋ ਗੀਤ ਗੀਤੇ ॥
ਨਮੋ ਪ੍ਰੀਤ ਪ੍ਰੀਤੇ ॥
ਨਮੋ ਰੋਖ ਰੋਖੇ ॥
ਨਮੋ ਸੋਖ ਸੋਖੇ ॥੬੮॥
ਨਮੋ ਸਰਬ ਰੋਗੇ ॥
ਨਮੋ ਸਰਬ ਭੋਗੇ ॥
ਨਮੋ ਸਰਬ ਜੀਤੰ ॥
ਨਮੋ ਸਰਬ ਭੀਤੰ ॥੬੯॥
ਨਮੋ ਸਰਬ ਗਿਆਨੰ ॥
ਨਮੋ ਪਰਮ ਤਾਨੰ ॥
ਨਮੋ ਸਰਬ ਮੰਤ੍ਰੰ ॥
ਨਮੋ ਸਰਬ ਜੰਤ੍ਰੰ ॥੭੦॥
ਨਮੋ ਸਰਬ ਦ੍ਰਿੱਸੰ ॥
ਨਮੋ ਸਰਬ ਕ੍ਰਿੱਸੰ ॥
ਨਮੋ ਸਰਬ ਰੰਗੇ ॥
ਤ੍ਰਿਭੰਗੀ ਅਨੰਗੇ ॥੭੧॥
ਨਮੋ ਜੀਵ ਜੀਵੰ ॥
ਨਮੋ ਬੀਜ ਬੀਜੇ ॥
ਅਖਿੱਜੇ ਅਭਿੱਜੇ ॥
ਸਮਸਤੰ ਪ੍ਰਸਿੱਜੇ ॥੭੨॥
ਕ੍ਰਿਪਾਲੰ ਸਰੂਪੇ ਕੁਕਰਮੰ ਪ੍ਰਣਾਸੀ ॥
ਸਦਾ ਸਰਬ ਦਾ ਰਿਧਿ ਸਿਧੰ ਨਿਵਾਸੀ ॥੭੩॥`,
        transliteration: `bhujang prayaat chhand |
agaadhe abaadhe |
anandee saroope |
namo sarab maane |
samasatee nidhaane |64|
namasatvan nrinaathe |
namasatvan pramaathe |
namasatvan aganje |
namasatvan abhanje |65|
namasatvan akaale |
namasatvan apaale |
namo sarab dese |
namo sarab bhese |66|
namo raaj raaje |
namo saaj saaje |
namo shaah shaahe |
namo maah maahe |67|
namo geet geete |
namo preet preete |
namo rokh rokhe |
namo sokh sokhe |68|
namo sarab roge |
namo sarab bhoge |
namo sarab jeetan |
namo sarab bheetan |69|
namo sarab giaanan |
namo param taanan |
namo sarab mantran |
namo sarab jantran |70|
namo sarab drasan |
namo sarab krasan |
namo sarab range |
tribhangee anange |71|
namo jeev jeevan |
namo beej beeje |
akhaje abhaje |
samasatan prasaje |72|
kripaalan saroope kukaraman pranaasee |
sadaa sarab daa ridh sidhan nivaasee |73|`,
        meaning: `BHUJANG PRAYAAT STANZA, Salutation to Thee O Impenetrable Lord!  Salutation to Thee O Unbound Lord! Salutation to Thee O All-Bliss Entity Lord! Salutation to Thee O Universally-Honoured Lord! Salutation to Thee O All-Treasure Lord! 64 Salutation to Thee O Masterless Lord! Salutation to Thee O Destroyer Lord! Salutation to Thee O Unconquerable Lord! Salutation to Thee O Invincible Lord! 65 Salutation to Thee O Deathless Lord! Salutation to Thee O Patronless Lord! Salutation to Thee O All-Pervasive Lord! Salutation to Thee O All-garb Lord! 66 Salutation to Thee O Supreme Sovereign Lord! Salutation to Thee O Best Musical Equipment Lord! Salutation to Thee O Supreme Emporer Lord! Salutation to Thee O Supreme Moon Lord! 67 Salutation to Thee O Song Lord! Salutation to Thee O Love Lord! Salutation to Thee O Zeal Lord! Salutation to Thee O Brightest Lord! 68 Salutation to Thee O Universal Ailment Lord ! Salutation to Thee O Universal Enjoyer Lord! Salutation to Thee O Universal Ailment Lord! Salutation to Thee O Universal Fear Lord! 69 Salutation to Thee O Omniscient Lord! Salutation to Thee O Omnipotent Lord! Salutation to Thee O Entire-Mantras-Knower Lord! Salutation to Thee O Entire-Yantras Knower Lord! 70 Salutation to Thee O All-Beholder Lord! Salutation to Thee O Universal attraction Lord! Salutation to Thee O All-Colour Lord! Salutation to Thee O Three-World-Destroyer Lord! 71 Salutation to Thee O Universal-Life Lord! Salutation to Thee O Primal-Seed Lord! Salutation to Thee O Harmless Lord!  Salutation to Thee O Non-Appeaser Lord! Salutation to Thee O Universal Boon-Bestwer Lord! 72 Salutation to Thee O Generosity-Embodiment Lord! Salutation to Thee O Sins-Destroyer Lord! Salutation to Thee O Ever-Universal Riches Denizen Lord!  Salutation to Thee O Ever-Universal Powers Denizen Lord! 73`,
        meaning_pa: `ਭੁਜੰਗ ਪ੍ਰਯਾਤ ਛੰਦ: ਤੇਰੀ ਕ੍ਰਿਪਾ ਨਾਲ: ਹੇ ਅਗਾਧ (ਅਥਾਹ) ਹੇ ਅਬਾਧ (ਅਸੀਮ)! ਹੇ ਆਨੰਦ-ਸਰੂਪ! ਹੇ ਸਾਰਿਆਂ ਦੁਆਰਾ ਮੰਨੇ ਜਾਣ ਵਾਲੇ ਅਤੇ ਸਾਰਿਆਂ (ਗੁਣਾਂ ਅਥਵਾ ਪਦਾਰਥਾਂ) ਦੇ ਖ਼ਜ਼ਾਨੇ! (ਤੈਨੂੰ) ਨਮਸਕਾਰ ਹੈ ॥੬੪॥ ਹੇ ਸੁਆਮੀ-ਰਹਿਤ! ਤੈਨੂੰ ਨਮਸਕਾਰ ਹੈ; ਹੇ (ਸਾਰਿਆਂ ਦੇ) ਸੰਘਾਰਕ! ਤੈਨੂੰ ਨਮਸਕਾਰ ਹੈ; ਹੇ ਨਾ ਨਸ਼ਟ ਕੀਤੇ ਜਾ ਸਕਣ ਵਾਲੇ! ਤੈਨੂੰ ਨਮਸਕਾਰ ਹੈ; ਹੇ ਨਾ ਭੰਨੇ ਜਾ ਸਕਣ ਵਾਲੇ! ਤੈਨੂੰ ਨਮਸਕਾਰ ਹੈ ॥੬੫॥ ਹੇ ਕਾਲ-ਰਹਿਤ! ਤੈਨੂੰ ਨਮਸਕਾਰ ਹੈ; ਹੇ ਪਾਲਕ-ਰਹਿਤ! ਤੈਨੂੰ ਨਮਸਕਾਰ ਹੈ; ਹੇ ਸਾਰੇ ਦੇਸ਼ਾਂ ਵਾਲੇ! (ਤੈਨੂੰ) ਨਮਸਕਾਰ ਹੈ; ਹੇ ਸਾਰੇ ਭੇਸਾਂ ਵਾਲੇ! (ਤੈਨੂੰ) ਨਮਸਕਾਰ ਹੈ ॥੬੬॥ ਹੇ ਰਾਜਿਆਂ ਦੇ ਵੀ ਰਾਜੇ! (ਤੈਨੂੰ) ਨਮਸਕਾਰ ਹੈ; ਹੇ ਸਿਰਜਨਹਾਰਾਂ ਦੇ ਵੀ ਸਿਰਜਨਹਾਰ! (ਤੈਨੂੰ) ਨਮਸਕਾਰ ਹੈ; ਹੇ ਸ਼ਾਹਾਂ ਦੇ ਵੀ ਸ਼ਾਹ! (ਤੈਨੂੰ) ਨਮਸਕਾਰ ਹੈ; ਹੇ ਚੰਦ੍ਰਮਿਆਂ ਦੇ ਚੰਦ੍ਰਮਾ ('ਮਾਹ')! (ਤੈਨੂੰ) ਨਮਸਕਾਰ ਹੈ ॥੬੭॥ ਹੇ ਗੀਤਾਂ ਦੇ ਗੀਤ! (ਤੈਨੂੰ) ਨਮਸਕਾਰ ਹੈ; ਹੇ ਪ੍ਰੇਮਾਂ ਦੇ ਪ੍ਰੇਮ (ਪ੍ਰੀਤਵਾਨਾਂ ਦੇ ਪ੍ਰੀਤਵਾਨ)! (ਤੈਨੂੰ) ਨਮਸਕਾਰ ਹੈ; ਹੇ ਰੋਹਾਂ ਦੇ ਰੋਹ (ਰੋਸ)! (ਤੈਨੂੰ) ਨਮਸਕਾਰ ਹੈ; ਹੇ ਸ਼ੋਖਾਂ ਦੇ ਸ਼ੋਖ! (ਤੈਨੂੰ) ਨਮਸਕਾਰ ਹੈ ॥੬੮॥ ਹੇ ਸਰਬ ਰੋਗ-ਸਰੂਪ! (ਤੈਨੂੰ) ਨਮਸਕਾਰ ਹੈ; ਹੇ ਸਰਬ ਭੋਗ-ਰੂਪ! (ਤੈਨੂੰ) ਨਮਸਕਾਰ ਹੈ; ਹੇ ਸਭ ਦੇ ਵਿਜੇਤਾ! (ਤੈਨੂੰ) ਨਮਸਕਾਰ ਹੈ; ਹੇ ਸਭ ਨੂੰ ਭੈ ਦੇਣ ਵਾਲੇ! (ਤੈਨੂੰ) ਨਮਸਕਾਰ ਹੈ ॥੬੯॥ ਹੇ ਸਰਬ ਗਿਆਨ-ਸਰੂਪ! (ਤੈਨੂੰ) ਨਮਸਕਾਰ ਹੈ; ਹੇ ਪਰਮ ਤ੍ਰਾਣ-ਸਰੂਪ! (ਤੈਨੂੰ) ਨਮਸਕਾਰ ਹੈ; ਹੇ ਸਰਬ ਮੰਤ੍ਰ-ਸਰੂਪ! (ਤੈਨੂੰ) ਨਮਸਕਾਰ ਹੈ; ਹੇ ਸਰਬ ਯੰਤ੍ਰ-ਸਰੂਪ; (ਤੈਨੂੰ) ਨਮਸਕਾਰ ਹੈ ॥੭੦॥ ਹੇ ਸਭ ਨੂੰ ਵੇਖਣ ਵਾਲੇ! (ਤੈਨੂੰ) ਨਮਸਕਾਰ ਹੈ; ਹੇ ਸਭ ਨੂੰ ਆਕਰਸ਼ਿਤ ਕਰਨ ਵਾਲੇ! (ਤੈਨੂੰ) ਨਮਸਕਾਰ ਹੈ; ਹੇ ਸਰਬ ਰੰਗ (ਆਨੰਦ) ਸਰੂਪ! (ਤੈਨੂੰ) ਨਮਸਕਾਰ ਹੈ; ਹੇ ਤਿੰਨ ਲੋਕਾਂ ਦੇ ਸੰਘਾਰਕ ਅਤੇ ਨਿਰਾਕਾਰ ਰੂਪ ਵਾਲੇ! (ਤੈਨੂੰ ਨਮਸਕਾਰ ਹੈ) ॥੭੧॥ ਹੇ ਜੀਵਾਂ ਦੇ ਜੀਵ! (ਤੈਨੂੰ) ਨਮਸਕਾਰ ਹੈ; ਹੇ ਬੀਜਾਂ ਦੇ ਬੀਜ (ਕਾਰਨ ਸਰੂਪ)! (ਤੈਨੂੰ) ਨਮਸਕਾਰ ਹੈ; ਹੇ ਨਾ ਖਿਝਣ ਵਾਲੇ, ਨਾ ਭਿਜਣ ਵਾਲੇ (ਘੁਲ ਮਿਲ ਜਾਣ ਵਾਲੇ) ਅਤੇ ਸਾਰਿਆਂ ਉਤੇ ਪ੍ਰਸੰਨ ਹੋਣ ਵਾਲੇ! (ਤੈਨੂੰ ਨਮਸਕਾਰ ਹੈ) ॥੭੨॥ ਹੇ ਕ੍ਰਿਪਾਲੂ ਸਰੂਪ ਵਾਲੇ, ਮਾੜੇ ਕਰਮਾਂ ਨੂੰ ਨਸ਼ਟ ਕਰਨ ਵਾਲੇ ਅਤੇ ਸਦਾ ਸਭ ਥਾਂ ਰਿੱਧੀਆਂ ਸਿੱਧੀਆਂ ਦੇ ਮੂਲ ਸਥਾਨ! (ਤੈਨੂੰ ਨਮਸਕਾਰ ਹੈ) ॥੭੩॥`
      },
      {
        number: 7,
        sanskrit: `ਚਰਪਟ ਛੰਦ ॥ ਤ੍ਵ ਪ੍ਰਸਾਦਿ ॥
ਅੰਮ੍ਰਿੱਤ ਕਰਮੇ ॥
ਅੰਬ੍ਰਿਤ ਧਰਮੇ ॥
ਅਖੱਲ ਜੋਗੇ ॥
ਅਚੱਲ ਭੋਗੇ ॥੭੪॥
ਅਚੱਲ ਰਾਜੇ ॥
ਅਟੱਲ ਸਾਜੇ ॥
ਅਖੱਲ ਧਰਮੰ ॥
ਅਲੱਖ ਕਰਮੰ ॥੭੫॥
ਸਰਬੰ ਦਾਤਾ ॥
ਸਰਬੰ ਗਿਆਤਾ ॥
ਸਰਬੰ ਭਾਨੇ ॥
ਸਰਬੰ ਮਾਨੇ ॥੭੬॥
ਸਰਬੰ ਪ੍ਰਾਣੰ ॥
ਸਰਬੰ ਤ੍ਰਾਣੰ ॥
ਸਰਬੰ ਭੁਗਤਾ ॥
ਸਰਬੰ ਜੁਗਤਾ ॥੭੭॥
ਸਰਬੰ ਦੇਵੰ ॥
ਸਰਬੰ ਭੇਵੰ ॥
ਸਰਬੰ ਕਾਲੇ ॥
ਸਰਬੰ ਪਾਲੇ ॥੭੮॥`,
        transliteration: `charapatt chhand | tv prasaad |
amrat karame |
anbrit dharame |
akhal joge |
achal bhoge |74|
achal raaje |
attal saaje |
akhal dharaman |
alakh karaman |75|
saraban daataa |
saraban giaataa |
saraban bhaane |
saraban maane |76|
saraban praanan |
saraban traanan |
saraban bhugataa |
saraban jugataa |77|
saraban devan |
saraban bhevan |
saraban kaale |
saraban paale |78|`,
        meaning: `CHARPAT STANZA. BY THY GRACE Thy actions are Permanent, Thy Laws are Permanent. Thou art united with all, Thou art their permanent Enjoyer.74. Thy Kingdom is Permanent, Thy Adornment is Permanent. Thy Laws are Complete, Thy Words are beyond Comprehension.75. Thou art the universal Donor, Thou art Omniscient. Thou art the Enlightener of all, Thou art the Enjoyer of all.76. Thou art the Life of all, Thou art the Strength of all. Thou art the Enjoyer of all, Thou art United with all.77. Thou art worshipped by all, Thou art a mystery for all. Thou art the Destroyer of all, Thou art the Sustainer of all.78.`,
        meaning_pa: `ਚਰਪਟ ਛੰਦ: ਤੇਰੀ ਕ੍ਰਿਪਾ ਨਾਲ: (ਹੇ ਪ੍ਰਭੂ! ਤੂੰ) ਅਮਰ ਕਰਮ ਵਾਲਾ, ਅਖੰਡ ('ਅੰਬ੍ਰਿਤ') ਧਰਮ ਵਾਲਾ, ਸਭ ਨਾਲ ਯੁਕਤ (ਜੁੜਿਆ ਹੋਇਆ) ਅਤੇ ਅਚਲ ਭੋਗ ਸਾਮਗ੍ਰੀ ਵਾਲਾ ਹੈਂ ॥੭੪॥ (ਹੇ ਪ੍ਰਭੂ! ਤੂੰ) ਅਚਲ ਰਾਜ ਵਾਲਾ, ਅਟਲ ਸਾਜ (ਸਿਰਜਨਾ) ਵਾਲਾ, ਸਾਰੇ ਧਰਮਾਂ ਵਾਲਾ ਅਤੇ ਅਦ੍ਰਿਸ਼ ਕਰਮਾਂ ਵਾਲਾ ਹੈਂ ॥੭੫॥ (ਹੇ ਪ੍ਰਭੂ! ਤੂੰ) ਸਭ ਨੂੰ ਦੇਣ ਵਾਲਾ, ਸਭ ਨੂੰ ਜਾਣਨ ਵਾਲਾ, ਸਭ ਨੂੰ ਪ੍ਰਕਾਸ਼ਮਾਨ ('ਭਾਨੇ') ਕਰਨ ਵਾਲਾ ਅਤੇ ਸਭ ਦੁਆਰਾ ਮੰਨੇ ਜਾਣ ਵਾਲਾ (ਪੂਜਣਯੋਗ) ਹੈਂ ॥੭੬॥ (ਹੇ ਪ੍ਰਭੂ! ਤੂੰ) ਸਭ ਦਾ ਪ੍ਰਾਣ ਹੈਂ, ਸਭ ਦਾ ਤ੍ਰਾਣ (ਬਲ) ਹੈਂ, ਸਭ ਨੂੰ ਭੋਗਣ ਵਾਲਾ ਹੈਂ ਅਤੇ ਸਭ ਨਾਲ ਜੁੜਿਆ ਹੋਇਆ ਹੈਂ ॥੭੭॥ (ਹੇ ਪ੍ਰਭੂ! ਤੂੰ) ਸਭ ਦਾ ਦੇਵ (ਇਸ਼ਟ) ਹੈਂ, ਸਭ ਦੇ ਭੇਦ ਨੂੰ ਜਾਣਨ ਵਾਲਾ ਹੈਂ, ਸਭ ਦਾ ਕਾਲ ਹੈਂ ਅਤੇ ਸਭ ਦਾ ਪਾਲਕ ਹੈਂ ॥੭੮॥`
      },
      {
        number: 8,
        sanskrit: `ਰੂਆਲ ਛੰਦ ॥ ਤ੍ਵ ਪ੍ਰਸਾਦਿ ॥
ਆਦਿ ਰੂਪ ਅਨਾਦਿ ਮੂਰਤਿ ਅਜੋਨਿ ਪੁਰਖ ਅਪਾਰ ॥
ਸਰਬ ਮਾਨ ਤ੍ਰਿਮਾਨ ਦੇਵ ਅਭੇਵ ਆਦਿ ਉਦਾਰ ॥
ਸਰਬ ਪਾਲਕ ਸਰਬ ਘਾਲਕ ਸਰਬ ਕੋ ਪੁਨਿ ਕਾਲ ॥
ਜਤ੍ਰੱ ਤਤ੍ਰੱ ਬਿਰਾਜਹੀ ਅਵਧੂਤ ਰੂਪ ਰਸਾਲ ॥੭੯॥
ਨਾਮ ਠਾਮ ਨ ਜਾਤਿ ਜਾ ਕਰ ਰੂਪ ਰੰਗ ਨ ਰੇਖ ॥
ਆਦਿ ਪੁਰਖ ਉਦਾਰ ਮੂਰਤਿ ਅਜੋਨਿ ਆਦਿ ਅਸੇਖ ॥
ਦੇਸ ਔਰ ਨ ਭੇਸ ਜਾ ਕਰ ਰੂਪ ਰੇਖ ਨ ਰਾਗ ॥
ਜਤ੍ਰੱ ਤਤ੍ਰੱ ਦਿਸਾ ਵਿਸਾ ਹੁਇ ਫੈਲਿਓ ਅਨੁਰਾਗ ॥੮੦॥
ਨਾਮ ਕਾਮ ਬਿਹੀਨ ਪੇਖਤ ਧਾਮ ਹੂੰ ਨਹਿ ਜਾਹਿ ॥
ਸਰਬ ਮਾਨ ਸਰਬਤ੍ਰ ਮਾਨ ਸਦੈਵ ਮਾਨਤ ਤਾਹਿ ॥
ਏਕ ਮੂਰਤਿ ਅਨੇਕ ਦਰਸਨ ਕੀਨ ਰੂਪ ਅਨੇਕ ॥
ਖੇਲ ਖੇਲ ਅਖੇਲ ਖੇਲਨ ਅੰਤ ਕੋ ਫਿਰਿ ਏਕ ॥੮੧॥
ਦੇਵ ਭੇਵ ਨ ਜਾਨਹੀ ਜਿਹ ਬੇਦ ਅਉਰ ਕਤੇਬ ॥
ਰੂਪ ਰੰਗ ਨ ਜਾਤਿ ਪਾਤਿ ਸੁ ਜਾਨਈ ਕਿਂਹ ਜੇਬ ॥
ਤਾਤ ਮਾਤ ਨ ਜਾਤ ਜਾ ਕਰ ਜਨਮ ਮਰਨ ਬਿਹੀਨ ॥
ਚੱਕ੍ਰ ਬੱਕ੍ਰ ਫਿਰੈ ਚਤੁਰ ਚੱਕ ਮਾਨਹੀ ਪੁਰ ਤੀਨ ॥੮੨॥
ਲੋਕ ਚਉਦਹ ਕੇ ਬਿਖੈ ਜਗ ਜਾਪਹੀ ਜਿਂਹ ਜਾਪ ॥
ਆਦਿ ਦੇਵ ਅਨਾਦਿ ਮੂਰਤਿ ਥਾਪਿਓ ਸਬੈ ਜਿਂਹ ਥਾਪਿ ॥
ਪਰਮ ਰੂਪ ਪੁਨੀਤ ਮੂਰਤਿ ਪੂਰਨ ਪੁਰਖ ਅਪਾਰ ॥
ਸਰਬ ਬਿਸ੍ਵ ਰਚਿਓ ਸੁਯੰਭਵ ਗੜਨ ਭੰਜਨਹਾਰ ॥੮੩॥
ਕਾਲ ਹੀਨ ਕਲਾ ਸੰਜੁਗਤਿ ਅਕਾਲ ਪੁਰਖ ਅਦੇਸ ॥
ਧਰਮ ਧਾਮ ਸੁ ਭਰਮ ਰਹਿਤ ਅਭੂਤ ਅਲਖ ਅਭੇਸ ॥
ਅੰਗ ਰਾਗ ਨ ਰੰਗ ਜਾ ਕਹਿ ਜਾਤਿ ਪਾਤਿ ਨ ਨਾਮ ॥
ਗਰਬ ਗੰਜਨ ਦੁਸਟ ਭੰਜਨ ਮੁਕਤਿ ਦਾਇਕ ਕਾਮ ॥੮੪॥
ਆਪ ਰੂਪ ਅਮੀਕ ਅਨਉਸਤਤਿ ਏਕ ਪੁਰਖ ਅਵਧੂਤ ॥
ਗਰਬ ਗੰਜਨ ਸਰਬ ਭੰਜਨ ਆਦਿ ਰੂਪ ਅਸੂਤ ॥
ਅੰਗ ਹੀਨ ਅਭੰਗ ਅਨਾਤਮ ਏਕ ਪੁਰਖ ਅਪਾਰ ॥
ਸਰਬ ਲਾਇਕ ਸਰਬ ਘਾਇਕ ਸਰਬ ਕੋ ਪ੍ਰਤਿਪਾਰ ॥੮੫॥
ਸਰਬ ਗੰਤਾ ਸਰਬ ਹੰਤਾ ਸਰਬ ਤੇ ਅਨਭੇਖ ॥
ਸਰਬ ਸਾਸਤ੍ਰ ਨ ਜਾਨਹੀ ਜਿਂਹ ਰੂਪ ਰੰਗੁ ਅਰੁ ਰੇਖ ॥
ਪਰਮ ਬੇਦ ਪੁਰਾਣ ਜਾ ਕਹਿ ਨੇਤ ਭਾਖਤ ਨਿੱਤ ॥
ਕੋਟਿ ਸਿੰਮ੍ਰਿਤ ਪੁਰਾਨ ਸਾਸਤ੍ਰ ਨ ਆਵਈ ਵਹੁ ਚਿੱਤ ॥੮੬॥`,
        transliteration: `rooaal chhand | tv prasaad |
aad roop anaad moorat ajon purakh apaar |
sarab maan trimaan dev abhev aad udaar |
sarab paalak sarab ghaalak sarab ko pun kaal |
jatra tatra biraajahee avadhoot roop rasaal |79|
naam tthaam na jaat jaa kar roop rang na rekh |
aad purakh udaar moorat ajon aad asekh |
des aauar na bhes jaa kar roop rekh na raag |
jatra tatra disaa visaa hue failio anuraag |80|
naam kaam biheen pekhat dhaam hoon neh jaeh |
sarab maan sarabatr maan sadaiv maanat taeh |
ek moorat anek darasan keen roop anek |
khel khel akhel khelan ant ko fir ek |81|
dev bhev na jaanahee jih bed aaur kateb |
roop rang na jaat paat su jaanee kinh jeb |
taat maat na jaat jaa kar janam maran biheen |
chakr bakr firai chatur chak maanahee pur teen |82|
lok chaudah ke bikhai jag jaapahee jinh jaap |
aad dev anaad moorat thaapio sabai jinh thaap |
param roop puneet moorat pooran purakh apaar |
sarab bisv rachio suyanbhav garran bhanjanahaar |83|
kaal heen kalaa sanjugat akaal purakh ades |
dharam dhaam su bharam rahit abhoot alakh abhes |
ang raag na rang jaa keh jaat paat na naam |
garab ganjan dusatt bhanjan mukat daaeik kaam |84|
aap roop ameek anausatat ek purakh avadhoot |
garab ganjan sarab bhanjan aad roop asoot |
ang heen abhang anaatam ek purakh apaar |
sarab laaeik sarab ghaaeik sarab ko pratipaar |85|
sarab gantaa sarab hantaa sarab te anabhekh |
sarab saasatr na jaanahee jinh roop rang ar rekh |
param bed puraan jaa keh net bhaakhat nit |
kott sinmrit puraan saasatr na aavee vahu chit |86|`,
        meaning: `ROOALL STANZA. BY THY GRACE Thou art the Supreme Purush, an Eternal Entity in the beginning and free from birth. Worshipped by all and venerated by three gods, Thou art without difference and art Generous from the very beginning. Thou art the Creator Sustainer, Inspirer and Destroyer of all. Thou art present everywhere like an ascetic with a Generous disposition.79. Thou art Nameless, Placeless, Casteless, Formless, Colourless and Lineless. Thou, the Primal Purusha, art Unborn, Generous Entity and Perfect from the very beginning. Thou art Countryless, Garbless, Formless, Lineless and Non-attached. Thou art present in all direction and conners and Pervadest the Universe as Love.80. Thou appearest without name and desire, thou hast no particular Abode. Thou, being worshipped by all, art the Enjoyer of all. Thou, the One Entity, appearest as Many creating innumerable forms. After playing the world-drama, when Thou wilt stop the play, Thou wilt be the same One again.81. The gods and the Scriptures of Hindus and Muslims do not know Thy secret. How to know Thee when thou art Formless, Colourless, Casteless and without lineage? Thou art without father and mother and art casteless, Thou art without births and deaths. Thou movest fast like the disc in all the four directions and art worshipped by the three worlds. 82. The Name is recited in the fourteen divisions of the universe. Thou, the Primal God, art Eternal Entity and hast created the entire universe. Thou, the holiest Entity, art of Supreme Form, Thou art Bondless, Perfect Purusha. Thou, the Self-Existent, Creator and Destroyer, hast crated the whole universe.83. Thou art Dearthless, Almighty, Timeless Purasha and Countryless. Thou art the Abode of righteousness,  Thou art Illusionless, Garbless, Incomprehensible and devoid of five elements. Thou art without body, without attachment, without colour, caste, lineage and name. Thou art the Destroyer of ego, the vanquisher of tyrants and performer of works leading to salvation.84. Thou art the Deepest and Indescribable Entity, the One unique ascetic Purusha. Thou, the Unborn Primal Entity, art the Destroyer of all egocentric people. Thou, the Boundless Purusha, art Limbless, Indestructible and without self. Thou art capable of doing everything, Thou Destroyest all and Sustainest all.85. Thou knowest all, Destroyest all and art beyond all the guises. Thy form, colour and marks are not known to all the Scriptures. The Vedas and the Puransa always declare Thee the Supreme and the Greatest. None can comprehend thee completely through millions of Smritis, Puranas and Shastras.86.`,
        meaning_pa: `ਰੂਆਲ ਛੰਦ: ਤੇਰੀ ਕ੍ਰਿਪਾ ਨਾਲ: (ਹੇ ਪ੍ਰਭੂ! ਤੂੰ ਸਭ ਦਾ) ਆਦਿ-ਰੂਪ, ਸਭ ਤੋਂ ਪਹਿਲਾਂ ਹੋਣ ਵਾਲਾ ਸਰੂਪ, ਅਯੋਨਿਜ ਅਤੇ ਅਪਰ ਅਪਾਰ ਪੁਰਖ ਹੈਂ; ਸਭ ਦਾ ਮਾਣ, ਤਿੰਨ ਦੇਵਤਿਆਂ ਦੁਆਰਾ ਮੰਨਣਯੋਗ, ਅਭੇਦ ਅਤੇ ਮੁੱਢ-ਕਦੀਮ ਤੋਂ ਉਦਾਰ ਹੈਂ; ਸਭ ਦਾ ਪਾਲਕ, ਸਭ ਦਾ ਨਾਸ਼ਕ ਅਤੇ ਫਿਰ ਸਭ ਦਾ ਕਾਲ-ਰੂਪ ਹੈਂ; ਜਿਥੇ ਕਿਥੇ ਨਿਰਲਿਪਤ ('ਅਵਧੂਤ ਰੂਪ') ਹੋਣ ਤੇ ਵੀ ਪਸੀਜਣ ਵਾਲਾ ਹੋ ਕੇ ਬਿਰਾਜ ਰਿਹਾ ਹੈਂ ॥੭੯॥ ਜਿਸ ਦਾ ਨਾਮ, ਧਾਮ, ਜਾਤਿ, ਰੂਪ, ਰੰਗ ਅਤੇ ਰੇਖ ਨਹੀਂ ਹੈ; ਜੋ ਆਦਿ ਪੁਰਖ, ਉਦਾਰ ਸਰੂਪ ਵਾਲਾ, ਅਜੋਨੀ ਅਤੇ ਮੁੱਢ ਤੋਂ ਹੀ ਅਸ਼ੇਸ਼-ਰੂਪ (ਪਰਿਪੂਰਣ) ਹੈ; ਜਿਸ ਦਾ ਦੇਸ, ਭੇਸ, ਰੂਪ, ਰੇਖ ਅਤੇ ਰਾਗ (ਮੋਹ) ਨਹੀਂ ਹੈ; ਜਿਥੇ ਕਿਥੇ ਦਿਸ਼ਾ-ਵਿਦਿਸ਼ਾ (ਚੌਹਾਂ ਪਾਸੇ) ਵਿਚ ਪ੍ਰੇਮ ਰੂਪ ਹੋ ਕੇ ਪਸਰਿਆ ਹੋਇਆ ਹੈ ॥੮੦॥ ਜੋ ਨਾਮ, ਕਾਮਨਾ ਤੋਂ ਬਿਨਾ ਦਿਸਦਾ ਹੈ, ਜਿਸ ਦਾ ਕੋਈ ਘਰ-ਘਾਟ ਨਹੀਂ ਹੈ; ਜੋ ਸਭ ਦਾ ਮਾਣ ਅਤੇ ਸਭ ਦੁਆਰਾ ਮਾਣਿਆ ਜਾਣ ਵਾਲਾ ਅਤੇ ਜਿਸ ਨੂੰ ਸਦਾ (ਅਸੀਂ) ਮੰਨਦੇ ਹਾਂ; ਉਹ ਇਕ ਰੂਪ ਵਾਲਾ, ਪਰ ਅਨੇਕ ਰੂਪਾਂ ਵਿਚ ਦਿਸਣ ਵਾਲਾ ਅਤੇ ਅਨੇਕ ਰੂਪਾਂ ਨੂੰ ਕਰਨ ਵਾਲਾ ਹੈ; ਖੇਡ ਖੇਡ ਕੇ ਫਿਰ ਅਖੇਡਣ ਦੀ ਅਵਸਥਾ ਹੋ ਕੇ ਅੰਤ ਨੂੰ ਫਿਰ ਇਕ ਹੋ ਜਾਂਦਾ ਹੈ ॥੮੧॥ (ਜਿਸ ਦਾ) ਭੇਦ ਦੇਵਤੇ, ਵੇਦ ਅਤੇ ਕਤੇਬ (ਸਾਮੀ ਧਰਮ ਪੁਸਤਕਾਂ) ਨਹੀਂ ਜਾਣਦੇ; (ਜਿਸ ਦਾ) ਰੂਪ, ਰੰਗ, ਜਾਤਿ-ਪਾਤਿ ਪਤਾ ਨਹੀਂ ਕਿਹੋ ਜਿਹਾ ਹੈ; ਜਿਸ ਦਾ ਪਿਤਾ, ਮਾਤਾ ਅਤੇ ਜਾਤਿ ਨਹੀਂ ਹੈ ਅਤੇ ਜੋ ਜਨਮ-ਮਰਨ ਦੇ ਚੱਕਰ ਤੋਂ ਰਹਿਤ ਹੈ; ਜਿਸ (ਦੇ ਹੁਕਮ) ਦਾ ਤੇਜ਼ੀ ਨਾਲ ਘੁੰਮਦਾ ਹੋਇਆ ('ਬਕ੍ਰ') ਚੱਕਰ ਚੌਹਾਂ ਚੱਕਾਂ ਵਿਚ ਭੌਂਦਾ ਫਿਰਦਾ ਹੈ ਅਤੇ (ਜਿਸ ਦਾ ਹੁਕਮ) ਤਿੰਨਾਂ ਲੋਕਾਂ ਵਿਚ ਮੰਨਿਆ ਜਾਂਦਾ ਹੈ ॥੮੨॥ ਜਿਸ ਦਾ ਜਾਪ ਚੌਦਾਂ ਲੋਕਾਂ ਦੇ ਸਾਰੇ ਜਗਤ ਵਿਚ ਹੋ ਰਿਹਾ ਹੈ; ਜੋ ਆਦਿ ਦੇਵ, ਆਦਿ (ਮੁੱਢ) ਤੋਂ ਰਹਿਤ ਸਰੂਪ ਵਾਲਾ ਅਤੇ ਜਿਸ ਨੇ ਸਾਰੀ ਸ੍ਰਿਸ਼ਟੀ (ਸਥਾਪਨਾ) ਨੂੰ ਸਥਾਪਿਤ ਕੀਤਾ ਹੋਇਆ ਹੈ; ਜੋ ਪਰਮ ਸ੍ਰੇਸ਼ਠ ਰੂਪ ਵਾਲਾ, ਪਵਿਤਰ ਸਰੂਪ ਵਾਲਾ ਅਤੇ ਪੂਰਨ ਤੇ ਅਪਾਰ ਪੁਰਖ ਹੈ; ਜਿਸ ਆਪਣੇ ਆਪ ਹੋਣ ਵਾਲੇ (ਸ੍ਵਯੰਭੂ) ਨੇ ਸਾਰੇ ਜਗਤ ਨੂੰ ਰਚਿਆ ਹੈ ਅਤੇ ਸਭ ਨੂੰ ਬਣਾਉਣ ਅਤੇ ਢਾਹਣ ਵਾਲਾ ਹੈ ॥੮੩॥ (ਉਸ) ਕਾਲ-ਰਹਿਤ, ਕਲਾ (ਸ਼ਕਤੀ) ਸਹਿਤ ਅਕਾਲ ਪੁਰਖ ਨੂੰ ਨਮਸਕਾਰ ਹੈ; ਉਹ ਧਰਮ ਦਾ ਸਰੋਤ, ਭਰਮ ਤੋਂ ਰਹਿਤ, ਪੰਜ ਤੱਤ੍ਵਾਂ ਤੋਂ ਨਿਆਰਾ, ਅਦ੍ਰਿਸ਼ ਅਤੇ ਭੇਸ ਰਹਿਤ ਹੈ; ਜਿਸ ਨੂੰ ਸ਼ਰੀਰ ਦਾ ਮੋਹ ਨਹੀਂ, ਜਿਸ ਦਾ ਕੋਈ ਰੰਗ, ਜਾਤਿ-ਪਾਤਿ ਜਾਂ ਨਾਮ ਨਹੀਂ ਹੈ; ਜੋ ਹੰਕਾਰ ਨੂੰ ਨਸ਼ਟ ਕਰਨ ਵਾਲਾ ਹੈ, ਦੁਸ਼ਟਾਂ ਦਾ ਦਮਨ ਕਰਨ ਵਾਲਾ, ਮੁਕਤੀਦਾਤਾ ਅਤੇ ਕਾਮਨਾਵਾਂ ਪੂਰੀਆਂ ਕਰਨ ਵਾਲਾ ਹੈ ॥੮੪॥ ਜੋ ਆਪਣੇ ਰੂਪ ਵਾਲਾ ਆਪ ਹੀ ਹੈ, ਅਤਿ ਗੰਭੀਰ ਹੈ, ਉਸਤਤ ਤੋਂ ਉੱਚਾ ਹੈ, (ਮਾਇਆ ਤੋਂ ਅਪ੍ਰਭਾਵਿਤ ਰੂਪ ਵਾਲਾ) ਪਵਿਤਰ ਇਕੋ ਇਕ ਪੁਰਸ਼ ਹੈ; ਹੰਕਾਰ ਨੂੰ ਤੋੜਨ ਵਾਲਾ, ਸਭ ਨੂੰ ਭੰਨਣ ਵਾਲਾ ਆਦਿ ਰੂਪ ਅਤੇ ਅਜਨਮਾ ਹੈ; ਉਹ ਸ਼ਰੀਰ-ਰਹਿਤ, ਨਾਸ਼ਰਹਿਤ ਅਤੇ ਆਤਮਾ ਰਹਿਤ ਇਕ ਅਪਾਰ ਪੁਰਸ਼ ਹੈ; ਉਹ ਸਭ ਕੁਝ ਕਰਨ ਦੇ ਯੋਗ, ਸਭ ਦਾ ਸੰਘਾਰਕ ਅਤੇ ਸਭ ਦਾ ਪਾਲਣਹਾਰ ਹੈ ॥੮੫॥ ਉਸ ਦੀ ਸਭ ਤਕ ਪਹੁੰਚ ਹੈ, ਉਹ ਸਭ ਦਾ ਸੰਘਾਰਕ ਅਤੇ ਸਭ ਤੋਂ ਨਿਰਾਲਾ ('ਅਨਭੇਖ') ਹੈ; ਉਸ ਦੇ ਰੂਪ ਰੰਗ ਅਤੇ ਆਕਾਰ ('ਰੇਖ') ਨੂੰ ਸਾਰੇ ਸ਼ਾਸਤ੍ਰ ਜਾਣਦੇ ਤਕ ਨਹੀਂ, ਉਸ ਦਾ ਵੇਦ, ਪੁਰਾਣ (ਆਦਿ ਸਾਰੇ ਧਰਮ ਗ੍ਰੰਥ) ਸ੍ਰੇਸ਼ਠ ਅਤੇ ਬੇਅੰਤ ਰੂਪ ਵਿਚ ਸਦਾ ਵਰਣਨ ਕਰਦੇ ਹਨ। ਕਰੋੜਾਂ ਸਮ੍ਰਿਤੀਆਂ, ਪੁਰਾਣਾਂ ਅਤੇ ਸ਼ਾਸਤ੍ਰਾਂ ਦੁਆਰਾ ਉਹ ਚਿਤਵਿਆ ਨਹੀਂ ਜਾ ਸਕਦਾ ॥੮੬॥`
      },
      {
        number: 9,
        sanskrit: `ਮਧੁਭਾਰ ਛੰਦ ॥ ਤ੍ਵ ਪ੍ਰਸਾਦਿ ॥
ਗੁਨ ਗਨ ਉਦਾਰ ॥
ਮਹਿਮਾ ਅਪਾਰ ॥
ਆਸਨ ਅਭੰਗ ॥
ਉਪਮਾ ਅਨੰਗ ॥੮੭॥
ਅਨਭਉ ਪ੍ਰਕਾਸ ॥
ਨਿਸ ਦਿਨ ਅਨਾਸ ॥
ਆਜਾਨ ਬਾਹੁ ॥
ਸਾਹਾਨ ਸਾਹੁ ॥੮੮॥
ਰਾਜਾਨ ਰਾਜ ॥
ਭਾਨਾਨ ਭਾਨ ॥
ਦੇਵਾਨ ਦੇਵ ॥
ਉਪਮਾ ਮਹਾਨ ॥੮੯॥
ਇੰਦ੍ਰਾਨ ਇੰਦ੍ਰ ॥
ਬਾਲਾਨ ਬਾਲ ॥
ਰੰਕਾਨ ਰੰਕ ॥
ਕਾਲਾਨ ਕਾਲ ॥੯੦॥
ਅਨਭੂਤ ਅੰਗ ॥
ਆਭਾ ਅਭੰਗ ॥
ਗਤਿ ਮਿਤਿ ਅਪਾਰ ॥
ਗੁਨ ਗਨ ਉਦਾਰ ॥੯੧॥
ਮੁਨਿ ਗਨ ਪ੍ਰਨਾਮ ॥
ਨਿਰਭੈ ਨਿਕਾਮ ॥
ਅਤਿ ਦੁਤਿ ਪ੍ਰਚੰਡ ॥
ਮਿਤਿ ਗਤਿ ਅਖੰਡ ॥੯੨॥
ਆਲਿਸ੍ਯ ਕਰਮ ॥
ਆਦ੍ਰਿਸ੍ਯ ਧਰਮ ॥
ਸਰਬਾ ਭਰਣਾਢਯ ॥
ਅਨਡੰਡ ਬਾਢਯ ॥੯੩॥`,
        transliteration: `madhubhaar chhand | tv prasaad |
gun gan udaar |
mahimaa apaar |
aasan abhang |
aupamaa anang |87|
anbhau prakaas |
nis din anaas |
aajaan baahu |
saahaan saahu |88|
raajaan raaj |
bhaanaan bhaan |
devaan dev |
aupamaa mahaan |89|
eindraan indr |
baalaan baal |
rankaan rank |
kaalaan kaal |90|
anabhoot ang |
aabhaa abhang |
gat mit apaar |
gun gan udaar |91|
mun gan pranaam |
nirabhai nikaam |
at dut prachandd |
mit gat akhandd |92|
aalisay karam |
aadrisay dharam |
sarabaa bharanaadtay |
anaddandd baadtay |93|`,
        meaning: `MADHUBHAR STANZA. BY THY GRACE The Virtues like Generosity and Thy Praises are Unbouded. Thy seat is Eternal Thy Eminence is Perfect.87. Thou art Self-luminous And remianest the same during day and night. They arms stretch upto Thy knees and Thou art king of kings.88. Thou art king of kings. Sun of suns. Thou art God of gods and Of greatest Eminence.89. Thou art Indra of Indras, Smallest of the Small. Thou art Poorest of the Poor And Death of Deaths.90. Thy Limbs are not of five elements, Thy glow is Eternal. Thou art Immeasurable and Thy Virtues like Generosity are countless.91 Thou art Fearless and Desireless and All the Sages bow before Thee. Thou, of the brightest effulgence, Art perfect in Thy Doings.92. Thy works are spontaneous And Thy laws are ideal. Thou Thyself art wholly ornamented And none can chastise Thee.93.`,
        meaning_pa: `ਮਧੁਭਾਰ ਛੰਦ: ਤੇਰੀ ਕ੍ਰਿਪਾ ਨਾਲ: (ਹੇ ਪ੍ਰਭੂ! ਤੂੰ) ਉਦਾਰਤਾ ਆਦਿ ਗੁਣਾਂ ਦਾ ਸਮੂਹ ਹੈਂ, ਅਪਾਰ ਮਹਿਮਾ ਵਾਲਾ ਹੈਂ, ਸਥਿਰ ਆਸਣ ਵਾਲਾ ਹੈਂ, ਤੇਰੀ ਉਪਮਾ ਨਿਰਾਧਾਰ (ਅਨੰਗ) ਹੈ ॥੮੭॥ (ਹੇ ਪ੍ਰਭੂ! ਤੂੰ) ਸੁਤਹ ਗਿਆਨ ਦਾ ਪ੍ਰਕਾਸ਼ਕ ਹੈਂ ਅਤੇ ਰਾਤ ਦਿਨ ਨਸ਼ਟ ਨਾ ਹੋਣ ਵਾਲਾ ਹੈਂ, ਗੋਡਿਆਂ ਤਕ ਲੰਬੀਆਂ ਬਾਂਹਵਾਂ ਵਾਲਾ ਹੈਂ, ਸ਼ਾਹਾਂ ਦਾ ਸ਼ਾਹ (ਸਭ ਤੋਂ ਉਪਰ) ਹੈਂ ॥੮੮॥ (ਹੇ ਪ੍ਰਭੂ! ਤੂੰ) ਰਾਜਿਆਂ ਦਾ ਰਾਜਾ ਹੈਂ, ਸੂਰਜਾਂ ਦਾ ਸੂਰਜ ਹੈਂ, ਦੇਵਤਿਆਂ ਦਾ ਦੇਵਤਾ ਹੈਂ, ਮਹਾਨ ਉਪਮਾ ਵਾਲਾ ਹੈਂ ॥੮੯॥ (ਹੇ ਪ੍ਰਭੂ! ਤੂੰ) ਇੰਦਰਾਂ ਦਾ ਇੰਦਰ ਹੈਂ, ਬਾਲਾਂ ਦਾ ਬਾਲ (ਸਰਲ ਸੁਭਾ ਵਾਲਾ) ਹੈਂ, ਗ਼ਰੀਬਾਂ ਦਾ ਵੀ ਗ਼ਰੀਬ ਹੈਂ, ਕਾਲਾਂ ਦਾ ਵੀ ਕਾਲ ਹੈਂ ॥੯੦॥ (ਹੇ ਪ੍ਰਭੂ! ਤੇਰਾ) ਸ਼ਰੀਰ (ਪੰਜ) ਭੂਤਾਂ ਤੋਂ ਬਿਨਾ ਹੈ, (ਤੇਰੀ) ਚਮਕ ਸਥਾਈ (ਅਭੰਗ) ਹੈ, ਗਤੀ ਅਤੇ ਸੀਮਾ ਅਪਾਰ ਹੈ, (ਤੂੰ) ਉਦਾਰਤਾ ਆਦਿ ਗੁਣਾਂ ਦਾ ਸਮੂਹ ਹੈਂ ॥੯੧॥ (ਹੇ ਪ੍ਰਭੂ! ਤੈਨੂੰ) ਸਾਰੇ ਮੁਨੀ ਪ੍ਰਨਾਮ ਕਰਦੇ ਹਨ, (ਤੂੰ) ਭੈ-ਰਹਿਤ ਅਤੇ ਨਿਸ਼ਕਾਮ ਹੈਂ, (ਤੇਰਾ) ਤੇਜ-ਪ੍ਰਕਾਸ਼ ਅਤਿਅੰਤ ਪ੍ਰਚੰਡ ਹੈ, (ਤੇਰੀ) ਗਤੀ ਅਤੇ ਸੀਮਾ ਅਖੰਡ (ਸਥਿਰ) ਹੈ ॥੯੨॥ (ਹੇ ਪ੍ਰਭੂ! ਤੇਰੇ) ਸਾਰੇ ਕਰਮ ਬਿਨਾ ਕੀਤੇ ਹੋ ਰਹੇ ਹਨ, ਤੇਰਾ ਧਰਮ ਆਦਰਸ਼ ਰੂਪ ('ਆਦ੍ਰਿਸ਼੍ਯ') ਹੈ, (ਤੂੰ) ਸਭ ਦਾ ਪ੍ਰਤਿਪਾਲਕ ਹੈਂ, ਨਿਸ਼ਚੇ ਹੀ ਬਿਨਾ ਦੰਡ ਦੇ ਹੈਂ ॥੯੩॥`
      },
      {
        number: 10,
        sanskrit: `ਚਾਚਰੀ ਛੰਦ ॥ ਤ੍ਵ ਪ੍ਰਸਾਦਿ ॥
ਗੁਬਿੰਦੇ ॥
ਮੁਕੰਦੇ ॥
ਉਦਾਰੇ ॥
ਅਪਾਰੇ ॥੯੪॥
ਹਰੀਅੰ ॥
ਕਰੀਅੰ ॥
ਨ੍ਰਿਨਾਮੇ ॥
ਅਕਾਮੇ ॥੯੫॥`,
        transliteration: `chaacharee chhand | tv prasaad |
gubinde |
mukande |
audaare |
apaare |94|
hareean |
kareean |
nrinaame |
akaame |95|`,
        meaning: `CHACHARI STANZA BY THY GRACE O the Preserver Lord! O Salvation-Giver Lord! O Most Genereous Lord! O Boundless Lord! 94. O Destroyer Lord! O the Creator Lord! O the Nameless Lord! O the Desireless Lord! 95.`,
        meaning_pa: `ਚਾਚਰੀ ਛੰਦ: ਤੇਰੀ ਕ੍ਰਿਪਾ ਨਾਲ: (ਹੇ ਪ੍ਰਭੂ! ਤੂੰ) ਸਾਰੀ ਸ੍ਰਿਸ਼ਟੀ ਦੀ ਪਾਲਣਾ ਕਰਨ ਵਾਲਾ, ਸਭ ਨੂੰ ਮੁਕਤੀ ਦੇਣ ਵਾਲਾ, ਉਦਾਰ-ਚਿਤ ਅਤੇ ਅਪਰ-ਅਪਾਰ ਹੈਂ ॥੯੪॥ (ਹੇ ਪ੍ਰਭੂ! ਤੂੰ) ਸਾਰਿਆਂ ਜੀਵਾਂ ਦਾ ਨਾਸ਼ ਕਰਨ ਵਾਲਾ, ਸਾਰਿਆਂ ਨੂੰ ਬਣਾਉਣ ਵਾਲਾ, ਨਾਮ ਤੋਂ ਰਹਿਤ ਅਤੇ ਕਾਮਨਾਵਾਂ ਤੋਂ ਮੁਕਤ ਹੈਂ ॥੯੫॥`
      },
      {
        number: 11,
        sanskrit: `ਭੁਜੰਗ ਪ੍ਰਯਾਤ ਛੰਦ ॥
ਚੱਤ੍ਰ ਚੱਕ੍ਰ ਕਰਤਾ ॥
ਚੱਤ੍ਰ ਚੱਕ੍ਰ ਹਰਤਾ ॥
ਚੱਤ੍ਰ ਚੱਕ੍ਰ ਦਾਨੇ ॥
ਚੱਤ੍ਰ ਚੱਕ੍ਰ ਜਾਨੇ ॥੯੬॥
ਚੱਤ੍ਰ ਚੱਕ੍ਰ ਵਰਤੀ ॥
ਚੱਤ੍ਰ ਚੱਕ੍ਰ ਭਰਤੀ ॥
ਚੱਤ੍ਰ ਚੱਕ੍ਰ ਪਾਲੇ ॥
ਚੱਤ੍ਰ ਚੱਕ੍ਰ ਕਾਲੇ ॥੯੭॥
ਚੱਤ੍ਰ ਚੱਕ੍ਰ ਪਾਸੇ ॥
ਚੱਤ੍ਰ ਚੱਕ੍ਰ ਵਾਸੇ ॥
ਚੱਤ੍ਰ ਚੱਕ੍ਰ ਮਾਨਯੈ ॥
ਚੱਤ੍ਰ ਚੱਕ੍ਰ ਦਾਨਯੈ ॥੯੮॥`,
        transliteration: `bhujang prayaat chhand |
chatr chakr karataa |
chatr chakr harataa |
chatr chakr daane |
chatr chakr jaane |96|
chatr chakr varatee |
chatr chakr bharatee |
chatr chakr paale |
chatr chakr kaale |97|
chatr chakr paase |
chatr chakr vaase |
chatr chakr maanayai |
chatr chakr daanayai |98|`,
        meaning: `BHUJANG PRYAAT STANZA O the Creator Lord of all the four directions! O the Destroyer Lord of the four directions! O the Donor Lord of all the four directions! O the Known Lord of all the four directions!96. O the Pervading Lord of the four directions! O the Permeator Lord of all the four direction! O the Sustainer Lord of all the four directions! O the Destroyer Lord of all the four directions!97. O the Lord Present in all the four direction! O the Dweller Lord in all the four directions! O the Lord Worshipped in all the four directions! O the Donor Lord of all the four directions!98.`,
        meaning_pa: `ਭੁਜੰਗ ਪ੍ਰਯਾਤ ਛੰਦ: (ਹੇ ਪ੍ਰਭੂ! ਤੂੰ) ਚੌਹਾਂ ਚੱਕਾਂ (ਦਿਸ਼ਾਵਾਂ) ਦਾ ਕਰਤਾ ਅਤੇ ਸੰਘਾਰਕ ਹੈਂ, ਸਭ ਨੂੰ ਦੇਣ ਵਾਲਾ ਅਤੇ ਸਭ ਨੂੰ ਜਾਣਨ ਵਾਲਾ ਹੈਂ ॥੯੬॥ (ਹੇ ਪ੍ਰਭੂ! ਤੂੰ) ਚੌਹਾਂ ਚੱਕਾਂ ਵਿਚ ਵਿਚਰਨ ਵਾਲਾ ਅਤੇ ਪੋਸ਼ਣ ਕਰਨ ਵਾਲਾ ਹੈਂ, ਸਭ ਦੀ ਪਾਲਨਾ ਕਰਨ ਵਾਲਾ ਅਤੇ ਸਭ ਦਾ ਨਾਸ਼ ਕਰਨ ਵਾਲਾ ਹੈਂ ॥੯੭॥ (ਹੇ ਪ੍ਰਭੂ! ਤੂੰ) ਚੌਹਾਂ ਚੱਕਾਂ ਵਾਲਿਆਂ ਦੇ ਕੋਲ ਹੈਂ, ਚੌਹਾਂ ਚੱਕਾਂ ਵਿਚ ਵਸਦਾ ਹੈਂ, ਚੌਹਾਂ ਚੱਕਾਂ ਵਿਚ ਤੇਰੀ ਮਾਨਤਾ ਹੈ, ਚੌਹਾਂ ਚੱਕਾਂ ਨੂੰ ਦੇਣ ਵਾਲਾ ਹੈਂ ॥੯੮॥`
      },
      {
        number: 12,
        sanskrit: `ਚਾਚਰੀ ਛੰਦ ॥
ਨ ਸੱਤ੍ਰੈ ॥
ਨ ਮਿੱਤ੍ਰੈ ॥
ਨ ਭਰਮੰ ॥
ਨ ਭਿੱਤ੍ਰੈ ॥੯੯॥
ਨ ਕਰਮੰ ॥
ਨ ਕਾਏ ॥
ਅਜਨਮੰ ॥
ਅਜਾਏ ॥੧੦੦॥
ਨ ਚਿੱਤ੍ਰੈ ॥
ਨ ਮਿੱਤ੍ਰੈ ॥
ਪਰੇ ਹੈਂ ॥
ਪਵਿੱਤ੍ਰੈ ॥੧੦੧॥
ਪ੍ਰਿਥੀਸੈ ॥
ਅਦੀਸੈ ॥
ਅਦ੍ਰਿਸੈ ॥
ਅਕ੍ਰਿਸੈ ॥੧੦੨॥`,
        transliteration: `chaacharee chhand |
n satrai |
n mitrai |
n bharaman |
n bhitrai |99|
n karaman |
n kaae |
ajanaman |
ajaae |100|
n chitrai |
n mitrai |
pare hain |
pavatrai |101|
pritheesai |
adeesai |
adrisai |
akrisai |102|`,
        meaning: `CHACHARI STANZA Thou art the Foeless Lord Thou art the Friendless Lord Thou art the Illusionless Lord Thou art the Fearless Lord.99. Thou art the Actionless Lord Thou art the Bodyless Lord Thu art the Birthless Lord Thou art the Aboleless Lord.100. Thou art the Portrait-less Lord Thou art the Friendliness Lord Thou art the Attachment-free Lord Thou art the Most Pure Lord.101. Thou art the World-Master Lord Thou art the Primal Lord Thou art the Invincible Lord Thou art the Almighty Lord.102.`,
        meaning_pa: `ਚਾਚਰੀ ਛੰਦ: (ਹੇ ਪ੍ਰਭੂ! ਤੇਰਾ) ਨਾ ਕੋਈ ਵੈਰੀ ਹੈ, ਨਾ ਕੋਈ ਮਿਤਰ ਹੈ, (ਤੈਨੂੰ) ਨਾ ਕੋਈ ਭਰਮ ਹੈ ਅਤੇ ਨਾ ਹੀ ਕੋਈ ਡਰ ਹੈ ॥੯੯॥ (ਹੇ ਪ੍ਰਭੂ! ਤੇਰਾ) ਨਾ ਕੋਈ ਕਰਮ ਹੈ, ਨਾ ਸ਼ਰੀਰ ਹੈ, (ਤੂੰ) ਨਾ ਜਨਮ ਲੈਂਦਾ ਹੈਂ, (ਤੇਰਾ) ਨਾ ਕੋਈ ਸਥਾਨ ਹੈ ॥੧੦੦॥ (ਹੇ ਪ੍ਰਭੂ! ਤੇਰਾ) ਨਾ ਕੋਈ ਚਿਤਰ ਹੈ, ਨਾ ਕੋਈ ਮਿਤਰ ਹੈ, ਤੂੰ ਸਭ ਤੋਂ ਪਰੇ ਅਤੇ ਸ਼ੁੱਧ-ਸਰੂਪ ਹੈਂ ॥੧੦੧॥ (ਹੇ ਪ੍ਰਭੂ! ਤੂੰ) ਪ੍ਰਿਥਵੀ ਦਾ ਸੁਆਮੀ ਹੈਂ, ਅਣਦਿਸ ਹੈਂ, ਦ੍ਰਿਸ਼ਟਮਾਨ ਨਹੀਂ ਹੈ, ਬਲ-ਹੀਨ ਨਹੀਂ ਹੈਂ ॥੧੦੨॥`
      },
      {
        number: 13,
        sanskrit: `ਭਗਵਤੀ ਛੰਦ ॥ ਤ੍ਵ ਪ੍ਰਸਾਦਿ ਕਥਤੇ ॥
ਕਿ ਆਛਿੱਜ ਦੇਸੈ ॥
ਕਿ ਆਭਿੱਜ ਭੇਸੈ ॥
ਕਿ ਆਗੰਜ ਕਰਮੈ ॥
ਕਿ ਆਭੰਜ ਭਰਮੈ ॥੧੦੩॥
ਕਿ ਆਭਿਜ ਲੋਕੈ ॥
ਕਿ ਆਦਿਤ ਸੋਕੈ ॥
ਕਿ ਅਵਧੂਤ ਬਰਨੈ ॥
ਕਿ ਬਿਭੂਤ ਕਰਨੈ ॥੧੦੪॥
ਕਿ ਰਾਜੰ ਪ੍ਰਭਾ ਹੈਂ ॥
ਕਿ ਧਰਮੰ ਧੁਜਾ ਹੈਂ ॥
ਕਿ ਆਸੋਕ ਬਰਨੈ ॥
ਕਿ ਸਰਬਾ ਅਭਰਨੈ ॥੧੦੫॥
ਕਿ ਜਗਤੰ ਕ੍ਰਿਤੀ ਹੈਂ ॥
ਕਿ ਛਤ੍ਰੰ ਛਤ੍ਰੀ ਹੈਂ ॥
ਕਿ ਬ੍ਰਹਮੰ ਸਰੂਪੈ ॥
ਕਿ ਅਨਭਉ ਅਨੂਪੈ ॥੧੦੬॥
ਕਿ ਆਦਿ ਅਦੇਵ ਹੈਂ ॥
ਕਿ ਆਪਿ ਅਭੇਵ ਹੈਂ ॥
ਕਿ ਚਿੱਤ੍ਰੰ ਬਿਹੀਨੈ ॥
ਕਿ ਏਕੈ ਅਧੀਨੈ ॥੧੦੭॥
ਕਿ ਰੋਜ਼ੀ ਰਜ਼ਾਕੈ ॥
ਰਹੀਮੈ ਰਿਹਾਕੈ ॥
ਕਿ ਪਾਕ ਬਿਐਬ ਹੈਂ ॥
ਕਿ ਗ਼ੈਬੁਲ ਗ਼ੈਬ ਹੈਂ ॥੧੦੮॥
ਕਿ ਅਫਵੁਲ ਗੁਨਾਹ ਹੈਂ ॥
ਕਿ ਸ਼ਾਹਾਨ ਸ਼ਾਹ ਹੈਂ ॥
ਕਿ ਕਾਰਨ ਕੁਨਿੰਦ ਹੈਂ ॥
ਕਿ ਰੋਜ਼ੀ ਦਿਹੰਦ ਹੈਂ ॥੧੦੯॥
ਕਿ ਰਾਜ਼ਕ ਰਹੀਮ ਹੈਂ ॥
ਕਿ ਕਰਮੰ ਕਰੀਮ ਹੈਂ ॥
ਕਿ ਸਰਬੰ ਕਲੀ ਹੈਂ ॥
ਕਿ ਸਰਬੰ ਦਲੀ ਹੈਂ ॥੧੧੦॥
ਕਿ ਸਰਬੱਤ੍ਰ ਮਾਨਿਯੈ ॥
ਕਿ ਸਰਬੱਤ੍ਰ ਦਾਨਿਯੈ ॥
ਕਿ ਸਰਬੱਤ੍ਰ ਗਉਨੈ ॥
ਕਿ ਸਰਬੱਤ੍ਰ ਭਉਨੈ ॥੧੧੧॥
ਕਿ ਸਰਬੱਤ੍ਰ ਦੇਸੈ ॥
ਕਿ ਸਰਬੱਤ੍ਰ ਭੇਸੈ ॥
ਕਿ ਸਰਬੱਤ੍ਰ ਰਾਜੈ ॥
ਕਿ ਸਰਬੱਤ੍ਰ ਸਾਜੈ ॥੧੧੨॥
ਕਿ ਸਰਬੱਤ੍ਰ ਦੀਨੈ ॥
ਕਿ ਸਰਬੱਤ੍ਰ ਲੀਨੈ ॥
ਕਿ ਸਰਬੱਤ੍ਰ ਜਾ ਹੋ ॥
ਕਿ ਸਰਬੱਤ੍ਰ ਭਾ ਹੋ ॥੧੧੩॥
ਕਿ ਸਰਬੱਤ੍ਰ ਦੇਸੈ ॥
ਕਿ ਸਰਬੱਤ੍ਰ ਭੇਸੈ ॥
ਕਿ ਸਰਬੱਤ੍ਰ ਕਾਲੈ ॥
ਕਿ ਸਰਬੱਤ੍ਰ ਪਾਲੈ ॥੧੧੪॥
ਕਿ ਸਰਬੱਤ੍ਰ ਹੰਤਾ ॥
ਕਿ ਸਰਬੱਤ੍ਰ ਗੰਤਾ ॥
ਕਿ ਸਰਬੱਤ੍ਰ ਭੇਖੀ ॥
ਕਿ ਸਰਬੱਤ੍ਰ ਪੇਖੀ ॥੧੧੫॥
ਕਿ ਸਰਬੱਤ੍ਰ ਕਾਜੈ ॥
ਕਿ ਸਰਬੱਤ੍ਰ ਰਾਜੈ ॥
ਕਿ ਸਰਬੱਤ੍ਰ ਸੋਖੈ ॥
ਕਿ ਸਰਬੱਤ੍ਰ ਪੋਖੈ ॥੧੧੬॥
ਕਿ ਸਰਬੱਤ੍ਰ ਤ੍ਰਾਣੈ ॥
ਕਿ ਸਰਬੱਤ੍ਰ ਪ੍ਰਾਣੈ ॥
ਕਿ ਸਰਬੱਤ੍ਰ ਦੇਸੈ ॥
ਕਿ ਸਰਬੱਤ੍ਰ ਭੇਸੈ ॥੧੧੭॥
ਕਿ ਸਰਬੱਤ੍ਰ ਮਾਨਿਯੈਂ ॥
ਸਦੈਵੰ ਪ੍ਰਧਾਨਿਯੈਂ ॥
ਕਿ ਸਰਬੱਤ੍ਰ ਜਾਪਿਯੈ ॥
ਕਿ ਸਰਬੱਤ੍ਰ ਥਾਪਿਯੈ ॥੧੧੮॥
ਕਿ ਸਰਬੱਤ੍ਰ ਭਾਨੈ ॥
ਕਿ ਸਰਬੱਤ੍ਰ ਮਾਨੈ ॥
ਕਿ ਸਰਬੱਤ੍ਰ ਇੰਦ੍ਰੈ ॥
ਕਿ ਸਰਬੱਤ੍ਰ ਚੰਦ੍ਰੈ ॥੧੧੯॥
ਕਿ ਸਰਬੰ ਕਲੀਮੈ ॥
ਕਿ ਪਰਮੰ ਫ਼ਹੀਮੈ ॥
ਕਿ ਆਕਲ ਅਲਾਮੈ ॥
ਕਿ ਸਾਹਿਬ ਕਲਾਮੈ ॥੧੨੦॥
ਕਿ ਹੁਸਨਲ ਵਜੂ ਹੈਂ ॥
ਤਮਾਮੁਲ ਰੁਜੂ ਹੈਂ ॥
ਹਮੇਸੁਲ ਸਲਾਮੈਂ ॥
ਸਲੀਖਤ ਮੁਦਾਮੈਂ ॥੧੨੧॥
ਗ਼ਨੀਮੁਲ ਸ਼ਿਕਸਤੈ ॥
ਗ਼ਰੀਬੁਲ ਪਰਸਤੈ ॥
ਬਿਲੰਦੁਲ ਮਕਾਨੈਂ ॥
ਜ਼ਮੀਨੁਲ ਜ਼ਮਾਨੈਂ ॥੧੨੨॥
ਤਮੀਜ਼ੁਲ ਤਮਾਮੈਂ ॥
ਰੁਜੂਅਲ ਨਿਧਾਨੈਂ ॥
ਹਰੀਫੁਲ ਅਜੀਮੈਂ ॥
ਰਜ਼ਾਇਕ ਯਕੀਨੈਂ ॥੧੨੩॥
ਅਨੇਕੁਲ ਤਰੰਗ ਹੈਂ ॥
ਅਭੇਦ ਹੈਂ ਅਭੰਗ ਹੈਂ ॥
ਅਜ਼ੀਜ਼ੁਲ ਨਿਵਾਜ਼ ਹੈਂ ॥
ਗ਼ਨੀਮੁਲ ਖ਼ਿਰਾਜ ਹੈਂ ॥੧੨੪॥
ਨਿਰੁਕਤ ਸਰੂਪ ਹੈਂ ॥
ਤ੍ਰਿਮੁਕਤਿ ਬਿਭੂਤ ਹੈਂ ॥
ਪ੍ਰਭੁਗਤਿ ਪ੍ਰਭਾ ਹੈਂ ॥
ਸੁ ਜੁਗਤਿ ਸੁਧਾ ਹੈਂ ॥੧੨੫॥
ਸਦੈਵੰ ਸਰੂਪ ਹੈਂ ॥
ਅਭੇਦੀ ਅਨੂਪ ਹੈਂ ॥
ਸਮਸਤੋ ਪਰਾਜ ਹੈਂ ॥
ਸਦਾ ਸਰਬ ਸਾਜ ਹੈਂ ॥੧੨੬॥
ਸਮਸਤੁਲ ਸਲਾਮ ਹੈਂ ॥
ਸਦੈਵਲ ਅਕਾਮ ਹੈਂ ॥
ਨ੍ਰਿਬਾਧ ਸਰੂਪ ਹੈਂ ॥
ਅਗਾਧ ਹੈਂ ਅਨੂਪ ਹੈਂ ॥੧੨੭॥
ਓਅੰ ਆਦਿ ਰੂਪੇ ॥
ਅਨਾਦਿ ਸਰੂਪੈ ॥
ਅਨੰਗੀ ਅਨਾਮੇ ॥
ਤ੍ਰਿਭੰਗੀ ਤ੍ਰਿਕਾਮੇ ॥੧੨੮॥
ਤ੍ਰਿਬਰਗੰ ਤ੍ਰਿਬਾਧੇ ॥
ਅਗੰਜੇ ਅਗਾਧੇ ॥
ਸੁਭੰ ਸਰਬ ਭਾਗੇ ॥
ਸੁ ਸਰਬਾ ਅਨੁਰਾਗੇ ॥੧੨੯॥
ਤ੍ਰਿਭੁਗਤ ਸਰੂਪ ਹੈਂ ॥
ਅਛਿੱਜ ਹੈਂ ਅਛੂਤ ਹੈਂ ॥
ਕਿ ਨਰਕੰ ਪ੍ਰਣਾਸ ਹੈਂ ॥
ਪ੍ਰਿਥੀਉਲ ਪ੍ਰਵਾਸ ਹੈਂ ॥੧੩੦॥
ਨਿਰੁਕਤਿ ਪ੍ਰਭਾ ਹੈਂ ॥
ਸਦੈਵੰ ਸਦਾ ਹੈਂ ॥
ਬਿਭੁਗਤਿ ਸਰੂਪ ਹੈਂ ॥
ਪ੍ਰਜੁਗਤਿ ਅਨੂਪ ਹੈਂ ॥੧੩੧॥
ਨਿਰੁਕਤਿ ਸਦਾ ਹੈਂ ॥
ਬਿਭੁਗਤਿ ਪ੍ਰਭਾ ਹੈਂ ॥
ਅਨਉਕਤਿ ਸਰੂਪ ਹੈਂ ॥
ਪ੍ਰਜੁਗਤਿ ਅਨੂਪ ਹੈਂ ॥੧੩੨॥`,
        transliteration: `bhagavatee chhand | tv prasaad kathate |
ki aachhaj desai |
ki aabhaj bhesai |
ki aaganj karamai |
ki aabhanj bharamai |103|
ki aabhij lokai |
ki aadit sokai |
ki avadhoot baranai |
ki bibhoot karanai |104|
ki raajan prabhaa hain |
ki dharaman dhujaa hain |
ki aasok baranai |
ki sarabaa abharanai |105|
ki jagatan kritee hain |
ki chhatran chhatree hain |
ki brahaman saroopai |
ki anbhau anoopai |106|
ki aad adev hain |
ki aap abhev hain |
ki chitran biheenai |
ki ekai adheenai |107|
ki rozee razaakai |
raheemai rihaakai |
ki paak biaib hain |
ki gaibul gaib hain |108|
ki afavul gunaah hain |
ki shaahaan shaah hain |
ki kaaran kunind hain |
ki rozee dihand hain |109|
ki raazak raheem hain |
ki karaman kareem hain |
ki saraban kalee hain |
ki saraban dalee hain |110|
ki sarabatr maaniyai |
ki sarabatr daaniyai |
ki sarabatr gaunai |
ki sarabatr bhaunai |111|
ki sarabatr desai |
ki sarabatr bhesai |
ki sarabatr raajai |
ki sarabatr saajai |112|
ki sarabatr deenai |
ki sarabatr leenai |
ki sarabatr jaa ho |
ki sarabatr bhaa ho |113|
ki sarabatr desai |
ki sarabatr bhesai |
ki sarabatr kaalai |
ki sarabatr paalai |114|
ki sarabatr hantaa |
ki sarabatr gantaa |
ki sarabatr bhekhee |
ki sarabatr pekhee |115|
ki sarabatr kaajai |
ki sarabatr raajai |
ki sarabatr sokhai |
ki sarabatr pokhai |116|
ki sarabatr traanai |
ki sarabatr praanai |
ki sarabatr desai |
ki sarabatr bhesai |117|
ki sarabatr maaniyain |
sadaivan pradhaaniyain |
ki sarabatr jaapiyai |
ki sarabatr thaapiyai |118|
ki sarabatr bhaanai |
ki sarabatr maanai |
ki sarabatr indrai |
ki sarabatr chandrai |119|
ki saraban kaleemai |
ki paraman faheemai |
ki aakal alaamai |
ki saahib kalaamai |120|
ki husanal vajoo hain |
tamaamul rujoo hain |
hamesul salaamain |
saleekhat mudaamain |121|
ganeemul shikasatai |
gareebul parasatai |
bilandul makaanain |
zameenul zamaanain |122|
tameezul tamaamain |
rujooal nidhaanain |
hareeful ajeemain |
razaaeik yakeenain |123|
anekul tarang hain |
abhed hain abhang hain |
azeezul nivaaz hain |
ganeemul khiraaj hain |124|
nirukat saroop hain |
trimukat bibhoot hain |
prabhugat prabhaa hain |
su jugat sudhaa hain |125|
sadaivan saroop hain |
abhedee anoop hain |
samasato paraaj hain |
sadaa sarab saaj hain |126|
samasatul salaam hain |
sadaival akaam hain |
nribaadh saroop hain |
agaadh hain anoop hain |127|
oan aad roope |
anaad saroopai |
anangee anaame |
tribhangee trikaame |128|
tribaragan tribaadhe |
aganje agaadhe |
subhan sarab bhaage |
su sarabaa anuraage |129|
tribhugat saroop hain |
achhaj hain achhoot hain |
ki narakan pranaas hain |
pritheeaul pravaas hain |130|
nirukat prabhaa hain |
sadaivan sadaa hain |
bibhugat saroop hain |
prajugat anoop hain |131|
nirukat sadaa hain |
bibhugat prabhaa hain |
anaukat saroop hain |
prajugat anoop hain |132|`,
        meaning: `BHAGVATI STANZA. UTTERED WITH THY GRACE That thy Abode is unconquerable! That Thy Garb is unimpaired. That Thou art beyond impact of Karmas! That Thou art free from doubts.103. That Thy abode is unimpaired! That thy canst dry up the sun. That Thy demeanour is saintly! That thou art the Source of wealth.104. That Thou art the glory of kingdom! That Thou art eh ensign of righteousness. That Thou hast no worries! That Thou art the ornamentation of all.105. That Thou art the Creator of the universe! That Thou art the Bravest of the Brave. That Thou art All-Pervading Entity! That Thou art the Source of Divine Knowledge.106. That Thou art the Primal Entity without a Master! That Thou art self-illumined! That Thou art without any portrait! That Thou art Master of Thyself! 107 That Thou art the Sustainer and Generous! That Thou art the Re-deemer and Pure! That Thou art Flawless! That Thou art most Mysterious! 108 That Thou forgivest sins! That Thou art the Emperor of Emperors! That Thou art Doer of everything! That Thou art the Giver of the means of sustenance! 109 That Thou art the Generous Sustainer! That Thou art the Most Compassionate! That Thou art Omnipotent! That Thou art the Destroyer of all! 110 That Thou art worshipped by all! That Thou art the Donor of all! That Thou goest everywhere! That Thou residest every-where! 111 That Thou art in every country! That Thou art in every garb! That Thou art the King of all! That Thou art the Creator of all! 112 That Thou be longest to all religious! That Thou art within everyone! That Thou livest everywhere! That Thou art the Glory of all! 113 That Thou art in all the countries! That Thou art in all the garbs! That Thou art the Destroyer of all! That Thou art the Sustainer of all! 114 That Thou destroyest all! That Thou goest to all the places! That Thou wearest all the garbs! That Thou seest all! 115 That Thou art the cause of all! That Thou art the Glory of all! That Thou driest up all! That Thou fillest up all! 116 That Thou art the Strength of all! That Thou art the life of all! That Thou art in all countries! That Thou art in garbs! 117 That Thou art worshipped everywhere! That Thou art the Supreme Controller of all! That Thou art remembered everywhere! That Thou art established everywhere! 118 That Thou illuminest everything! That Thou art honoured by all! That Thou art Indra (King) of all! That Thou art the moon (Light) of all! 119 That Thou art master off all powers! That Thou art Most Intelligent! That Thou art Most Wise and Learned! That Thou art the Master of Languages! 120 That Thou art the Embodiment of Beauty! That all look towards Thee! That Thou abidest forever! That Thou hast perpetual offspring! 121 That Thou art the conquereror of mighty enemies! That Thou art the Protector of the lowly! That Thy Abode is the Highest! That Thou Pervadest on Earth and in Heavens! 122 That Thou discriminatest all! That Thou art most Considerate! That Thou art the Greatest Friend! That Thou art certainlyhe Giver of food! 123 That Thou, as Ocean, Hast innumerable waves! That Thou art Immortal and none can know Thy secrets! That Thou Protectest the devotees! That Thou punishest the evil-doers! 124 That Thy Entity is Indexpressible! That Thy Glory is Beyond the three Modes! That Thine is the Most Powerful Glow! That Thou art ever united with all! 125 That Thou art Eternal Entity! That Thou art undivided and unparalleled! That Thou art the Creator of all! That Thou art ever the Ornamentation of all! 126 That Thou art saluted by all! That Thou art ever the Desireless Lord! That Thou art Invincible! That Thou art Impenetrable and Unparalleled Entity! 127 That Thou art Aum the primal Entity! That Thou art also without beginning! That Thu art Bodyless and Nameless! That Thou art the Destroyer and Restorer of three modes! 128 That Thou art the Destroyer of three gods and modes! That Thou art Immortal and Impenetrable! That Thy Writ of Destiny is for all! That Thou lovest all! 129 That Thou art the Enjoyer Entity of three worlds! That Thou art Unbreakable and untouched! That Thou art the Destroyer of hell! That Thou Pervadest the Earth! 130 That Thy Glory is Inexpressible! That Thou art Eternal! That Thou abidest in innumerable diverse guises! That Thou art wonderfully united with all! 131 That Thou art ever Inexpressible! That Thy Glory appears in diverse guises! That Thy Form is Indescribable! That Thou art wonderfully united with all! 132`,
        meaning_pa: `ਭਗਵਤੀ ਛੰਦ: ਤੇਰੀ ਕ੍ਰਿਪਾ ਨਾਲ ਕਹਿੰਦਾ ਹਾਂ: (ਹੇ ਪ੍ਰਭੂ!) ਤੇਰਾ ਦੇਸ (ਸਥਾਨ) ਨਾਸ਼-ਰਹਿਤ ਹੈ, ਤੇਰਾ ਸਰੂਪ (ਭੇਸ) ਸਦੀਵੀ ਹੈ, ਤੇਰਾ ਕਰਮ ਨਸ਼ਟ ਨਹੀਂ ਹੁੰਦਾ, ਤੂੰ ਭਰਮਾਂ ਨੂੰ ਤੋੜਨ ਵਾਲਾ ਹੈਂ ॥੧੦੩॥ (ਹੇ ਪ੍ਰਭੂ!) ਤੂੰ ਤਿੰਨਾਂ ਲੋਕਾਂ ਤੋਂ ਨਿਰਲੇਪ ਹੈਂ, ਤੂੰ ਸੂਰਜ ('ਆਦਿਤ') ਦੇ ਤੇਜ ਨੂੰ ਖ਼ਤਮ ਕਰ ਸਕਦਾ ਹੈਂ, ਤੂੰ ਪਵਿਤਰ (ਮਾਇਆ ਤੋਂ ਅਪ੍ਰਭਾਵਿਤ) ਰੰਗ (ਸਰੂਪ) ਵਾਲਾ ਹੈਂ, ਤੂੰ ਐਸ਼ਵਰਜ (ਵਿਭੂਤੀਆਂ) ਦਾ ਕਰਤਾ ਹੈਂ ॥੧੦੪॥ (ਹੇ ਪ੍ਰਭੂ!) ਤੂੰ ਰਾਜਿਆਂ ਦਾ ਤੇਜ ਹੈਂ, ਤੂੰ ਧਰਮਾਂ ਦਾ ਨਿਸ਼ਾਨ (ਝੰਡਾ) ਹੈਂ, ਤੂੰ ਸ਼ੋਕ-ਰਹਿਤ ਸਰੂਪ ਵਾਲਾ ਹੈਂ, ਤੂੰ ਸਾਰਿਆਂ ਦਾ ਸ਼ਿੰਗਾਰ ਹੈਂ ॥੧੦੫॥ (ਹੇ ਪ੍ਰਭੂ!) ਤੂੰ ਜਗਤ ਦਾ ਕਰਤਾ ਹੈਂ, ਤੂੰ ਛਤ੍ਰੀਆਂ (ਵੀਰਾਂ) ਦਾ ਵੀ ਛਤ੍ਰੀ ਹੈਂ, ਤੂੰ ਬ੍ਰਹਮ-ਸਰੂਪੀ ਹੈਂ, ਤੂੰ ਭੈ-ਰਹਿਤ ਅਤੇ ਉਪਮਾ-ਰਹਿਤ ਹੈਂ ॥੧੦੬॥ (ਹੇ ਪ੍ਰਭੂ!) ਤੂੰ ਮੁੱਢ-ਕਦੀਮ ਤੋਂ ਨਿਰਨਾਥ (ਬਿਨਾ ਕਿਸੇ ਹੋਰ ਸੁਆਮੀ ਤੋਂ) ਹੈਂ, ਤੂੰ ਆਪ ਭੇਦ-ਰਹਿਤ ਹੈਂ, ਤੂੰ ਚਿਤਰ (ਸਰੂਪ) ਤੋਂ ਬਿਨਾ ਹੈਂ, ਤੂੰ ਇਕੋ ਆਪਣੇ ਅਧੀਨ ਹੀ ਹੈਂ ॥੧੦੭॥ (ਹੇ ਪ੍ਰਭੂ!) ਤੂੰ ਸਭ ਨੂੰ ਨਿੱਤ ਰੋਜ਼ੀ ਦਿੰਦਾ ਹੈਂ, ਤੂੰ ਸਭ ਨੂੰ ਕ੍ਰਿਪਾ ਪੂਰਵਕ ਖ਼ਲਾਸੀ ਦਿੰਦਾ ਹੈਂ, ਤੂੰ ਪਵਿਤਰ ਅਤੇ ਦੋਸ਼-ਰਹਿਤ ਹੈਂ, ਤੂੰ ਗੁਪਤ ਤੋਂ ਵੀ ਗੁਪਤ ਹੈਂ ॥੧੦੮॥ (ਹੇ ਪ੍ਰਭੂ!) ਤੂੰ ਪਾਪਾਂ ਨੂੰ ਖਿਮਾ ਕਰਨ ਵਾਲਾ ('ਅਫਵੁਲ') ਹੈਂ, ਤੂੰ ਸ਼ਾਹਾਂ ਦਾ ਸ਼ਾਹ ਹੈਂ, ਤੂੰ ਸਭ ਕਾਰਨਾਂ ਦਾ ਕਰਤਾ ਹੈਂ, ਤੂੰ ਸਭ ਨੂੰ ਰੋਜ਼ੀ ਦੇਣ ਵਾਲਾ ਹੈਂ ॥੧੦੯॥ (ਹੇ ਪ੍ਰਭੂ!) ਤੂੰ ਸਭ ਨੂੰ ਰੋਜ਼ੀ ਦੇਣ ਵਾਲਾ ਅਤੇ ਦਿਆਲੂ ਹੈਂ, ਤੂੰ ਮਿਹਰਾਂ ਕਰਨ ਵਾਲਾ ਬਖ਼ਸ਼ਣਹਾਰ ਹੈਂ, ਤੂੰ ਸਾਰੀਆਂ ਸ਼ਕਤੀਆਂ ਵਾਲਾ ਹੈਂ ਅਤੇ ਸਾਰਿਆਂ ਦਾ ਸੰਘਾਰਕ ਹੈਂ ॥੧੧੦॥ (ਹੇ ਪ੍ਰਭੂ!) ਸਭ ਥਾਂ ਤੇਰੀ ਮਾਨਤਾ ਹੈ, ਤੂੰ ਸਭ ਨੂੰ ਦੇਣ ਵਾਲਾ ਹੈਂ, ਤੂੰ ਸਭ ਥਾਂ ਗਮਨ ਕਰਦਾ ਹੈਂ ਅਤੇ ਸਾਰਿਆਂ ਭੁਵਨਾਂ (ਲੋਕਾਂ) ਵਿਚ ਮੌਜੂਦ ਹੈਂ ॥੧੧੧॥ (ਹੇ ਪ੍ਰਭੂ!) ਤੂੰ ਸਾਰਿਆਂ ਦੇਸ਼ਾਂ ਵਿਚ ਹੈਂ, ਤੂੰ ਸਾਰਿਆਂ ਭੇਸਾਂ ਵਿਚ ਹੈਂ, ਤੂੰ ਸਭ ਥਾਂ ਰਾਜ ਕਰਦਾ ਹੈਂ (ਬਿਰਾਜਮਾਨ ਹੈਂ) ਤੂੰ ਹੀ ਸਭ ਨੂੰ ਸਿਰਜਦਾ ਹੈਂ ॥੧੧੨॥ (ਹੇ ਪ੍ਰਭੂ!) ਤੂੰ ਸਭ ਨੂੰ ਦਿੰਦਾ ਹੈਂ, ਸਭ ਤੋਂ ਲੈਂਦਾ ਹੈਂ, ਸਭ ਥਾਂਵਾਂ 'ਤੇ ਤੇਰੀ ਪ੍ਰਭੁਤਾ (ਤੇਜ) ਹੈ, ਸਭ ਥਾਂ ਤੇਰੀ ਹੀ ਸੋਭਾ (ਪ੍ਰਕਾਸ਼) ਹੈ ॥੧੧੩॥ (ਹੇ ਪ੍ਰਭੂ!) ਤੂੰ ਸਾਰਿਆਂ ਦੇਸਾਂ ਅਤੇ ਭੇਸਾਂ ਵਿਚ ਹੈਂ, ਤੂੰ ਸਭ ਦਾ ਕਾਲ ਅਤੇ ਸਭ ਦਾ ਪਾਲਕ ਹੈਂ ॥੧੧੪॥ (ਹੇ ਪ੍ਰਭੂ!) ਤੂੰ ਸਭ ਦਾ ਸੰਘਾਰਕ ਹੈਂ, ਸਭ ਤਕ ਤੇਰੀ ਪਹੁੰਚ ਹੈ, ਤੂੰ ਸਾਰਿਆਂ ਭੇਖਾਂ ਵਿਚ ਹੈਂ ਅਤੇ ਸਾਰਿਆਂ ਨੂੰ ਵੇਖਣ ਵਾਲਾ ਹੈਂ ॥੧੧੫॥ (ਹੇ ਪ੍ਰਭੂ!) ਤੂੰ ਸਭ ਦਾ ਕਾਰਜ (ਭਾਵ ਕਾਰਨ) ਸਰੂਪ ਹੈ, ਤੂੰ ਸਭ ਥਾਂ ਸੋਭ ਰਿਹਾ ਹੈਂ, ਤੂੰ ਸਭ ਨੂੰ ਸੁਕਾਉਂਦਾ (ਨਸ਼ਟ ਕਰਦਾ) ਹੈਂ, ਤੂੰ ਸਭ ਦੀ ਪਾਲਨਾ ਕਰਦਾ ਹੈਂ ॥੧੧੬॥ (ਹੇ ਪ੍ਰਭੂ!) ਤੂੰ ਸਭ ਦਾ ਤ੍ਰਾਣ (ਬਲ) ਹੈਂ, ਤੂੰ ਸਭ ਦਾ ਪ੍ਰਾਣ ਹੈਂ, ਤੂੰ ਸਭ ਦੇਸ਼ਾਂ ਵਿਚ ਮੌਜੂਦ ਹੈਂ ਅਤੇ ਸਾਰਿਆਂ ਭੇਸਾਂ ਵਿਚ ਸਥਿਤ ਹੈਂ ॥੧੧੭॥ (ਹੇ ਪ੍ਰਭੂ!) ਤੂੰ ਸਭ ਥਾਂ ਮੰਨਿਆ ਜਾਂਦਾ ਹੈਂ (ਪੂਜਣਯੋਗ ਹੈਂ) ਸਦਾ ਤੂੰ ਹੀ ਪ੍ਰਧਾਨ ਹੈਂ, ਤੂੰ ਸਭ ਥਾਂਵਾਂ ਤੇ ਜਪਿਆ ਜਾਂਦਾ ਹੈਂ, ਸਭ ਥਾਂਵਾਂ ਵਿਚ ਤੂੰ ਹੀ ਸਥਿਤ ਹੈਂ ॥੧੧੮॥ (ਹੇ ਪ੍ਰਭੂ!) ਤੂੰ ਸਭ ਦਾ ਪ੍ਰਕਾਸ਼ਕ (ਸੂਰਜ) ਹੈਂ, ਤੂੰ ਸਭ ਦਾ ਮਾਣ ਹੈਂ, ਤੂੰ ਸਭ ਦਾ ਰਾਜਾ (ਇੰਦਰ) ਹੈਂ ਅਤੇ ਸਭ ਨੂੰ ਸ਼ਾਂਤੀ ਦੇਣ ਵਾਲਾ (ਚੰਦ੍ਰਮਾ) ਹੈਂ ॥੧੧੯॥ (ਹੇ ਪ੍ਰਭੂ!) ਤੂੰ ਸਭ ਦਾ ਬੋਲ (ਕਲਾਮ) ਹੈਂ, ਤੂੰ ਸ੍ਰੇਸ਼ਠ ਬੁੱਧੀਮਾਨ ਹੈਂ, ਤੂੰ ਵੱਡਾ ਅਕਲਮੰਦ ਹੈਂ, ਤੂੰ ਬੋਲੀਆਂ (ਕਲਾਮ) ਦਾ ਸੁਆਮੀ ਹੈਂ ॥੧੨੦॥ (ਹੇ ਪ੍ਰਭੂ!) ਤੂੰ ਸੁੰਦਰਤਾ (ਹੁਸਨ) ਦੀ ਮੂਰਤੀ (ਵਜੂਦ) ਹੈਂ, ਤੂੰ ਸਭ ਵਲ ਧਿਆਨ ('ਰੁਜੂ') ਦੇਣ ਵਾਲਾ ਹੈਂ, ਤੂੰ ਹਮੇਸ਼ਾ ਸਲਾਮਤ ਰਹਿਣ ਵਾਲਾ ਹੈਂ, ਤੂੰ ਸਥਿਰ ਸੰਤਾਨ ('ਸਲੀਖਤ') ਵਾਲਾ ਹੈਂ ॥੧੨੧॥ (ਹੇ ਪ੍ਰਭੂ!) ਤੂੰ ਵੱਡਿਆਂ ਵੈਰੀਆਂ ਨੂੰ ਹਰਾਉਣ ਵਾਲਾ ਹੈਂ, ਤੂੰ ਗ਼ਰੀਬਾਂ ਦਾ ਪਾਲਣਹਾਰ ('ਪਰਸਤੈ') ਹੈਂ, ਤੇਰਾ ਸਥਾਨ (ਮਕਾਨ) ਬਹੁਤ ਉੱਚਾ ਹੈ, ਤੂੰ ਧਰਤੀ ਅਤੇ ਆਕਾਸ਼ ਵਿਚ (ਭਾਵ ਸਭ ਵਿਚ) ਵਿਆਪਤ ਹੈਂ ॥੧੨੨॥ (ਹੇ ਪ੍ਰਭੂ!) ਤੂੰ ਸਭ ਨੂੰ ਪਛਾਣਨ ਵਾਲਾ (ਤਮੀਜ਼ ਕਰਨ ਵਾਲਾ) ਵਿਵੇਕੀ ਹੈਂ, ਤੂੰ ਸਭ ਵਲ ਧਿਆਨ ਦੇਣ (ਰੁਜੂ ਕਰਨ) ਵਾਲੀ ਰੁਚੀ ਦਾ ਭੰਡਾਰ ਹੈਂ, ਤੂੰ (ਸਭ ਦਾ) ਵੱਡਾ ਮਿਤਰ ਹੈਂ, ਤੂੰ ਨਿਸਚੇ ਹੀ (ਸਭ ਨੂੰ) ਰੋਜ਼ੀ ਦਿੰਦਾ ਹੈਂ ॥੧੨੩॥ (ਹੇ ਪ੍ਰਭੂ!) ਤੂੰ ਅਨੇਕ ਲਹਿਰਾਂ ਵਾਲਾ (ਸਾਗਰ) ਹੈਂ, ਤੇਰਾ ਭੇਦ ਨਹੀਂ ਪਾਇਆ ਜਾ ਸਕਦਾ, ਤੂੰ ਨਾਸ਼-ਰਹਿਤ ਹੈਂ, ਤੂੰ ਪਿਆਰਿਆਂ (ਅਜ਼ੀਜ਼ਾਂ) ਨੂੰ ਵਡਿਆਉਣ ਵਾਲਾ ਹੈਂ, ਤੂੰ ਵੈਰੀਆਂ (ਗ਼ਨੀਮਾਂ) ਤੋਂ ਕਰ ('ਖ਼ਿਰਾਜ') ਵਸੂਲ ਕਰਨ ਵਾਲਾ ਹੈਂ (ਅਰਥਾਤ ਸਭ ਤੇਰੇ ਅਧੀਨ ਹਨ) ॥੧੨੪॥ (ਹੇ ਪ੍ਰਭੂ!) ਤੇਰਾ ਸਰੂਪ ਬਿਆਨ ਰਹਿਤ ਹੈ, ਤੇਰੀ ਵਿਭੂਤੀ (ਸੰਪੱਤੀ) ਮਾਇਆ ਦੇ ਤਿੰਨਾਂ ਗੁਣਾਂ ਤੋਂ ਪਰੇ ਹੈ, ਤੇਰੇ ਹੀ ਪ੍ਰਤਾਪ ਤੋਂ ਉਪਭੋਗੀ ਸਾਮਗ੍ਰੀ ਪੈਦਾ ਹੋਈ ਹੈ, ਤੂੰ ਅੰਮ੍ਰਿਤ ('ਸੁਧਾ') ਨਾਲ ਸੰਯੁਕਤ ਹੈਂ ॥੧੨੫॥ (ਹੇ ਪ੍ਰਭੂ!) ਤੇਰਾ ਸਰੂਪ ਸਦੀਵੀ ਹੈ, ਭੇਦ ਅਤੇ ਉਪਮਾ ਤੋਂ ਰਹਿਤ ਹੈ, ਤੂੰ ਸਭ ਨੂੰ ਉਪਜਾਉਣ ਵਾਲਾ ਹੈਂ ਅਤੇ ਸਭ ਨੂੰ ਸੁਸਜਿਤ ਕਰਨ ਵਾਲਾ ਹੈਂ ॥੧੨੬॥ (ਹੇ ਪ੍ਰਭੂ!) ਤੂੰ ਸਾਰਿਆਂ ਦੁਆਰਾ ਪ੍ਰਨਾਮ ਕਰਨ ਯੋਗ ਹੈਂ, ਤੂੰ ਸਦਾ ਕਾਮਨਾਵਾਂ ਤੋਂ ਮੁਕਤ ਹੈਂ, ਤੂੰ (ਹਰ ਪ੍ਰਕਾਰ ਦੀਆਂ) ਰੁਕਾਵਟਾਂ ਤੋਂ ਰਹਿਤ ਸਰੂਪ ਵਾਲਾ ਹੈਂ, ਨਾ ਤੇਰਾ ਪਾਰਾਵਾਰ ਪਾਇਆ ਜਾ ਸਕਦਾ ਹੈ ਅਤੇ ਨਾ ਹੀ ਤੇਰੀ ਉਪਮਾ ਦਿੱਤੀ ਜਾ ਸਕਦੀ ਹੈ ॥੧੨੭॥ (ਹੇ ਪ੍ਰਭੂ!) ਤੂੰ ਓਅੰਕਾਰ ਸਰੂਪ ਅਤੇ ਸਭ ਦਾ ਆਦਿ ਹੈਂ, ਤੂੰ ਸਾਰਿਆਂ ਦਾ ਸਰੋਤ-ਰੂਪ ਹੈਂ, ਤੂੰ ਸ਼ਰੀਰ ਤੋਂ ਬਿਨਾ ('ਅਨੰਗ') ਅਤੇ ਨਾਮ ਤੋਂ ਰਹਿਤ ਹੈਂ, ਤੂੰ ਤਿੰਨਾਂ ਲੋਕਾਂ ਦਾ ਵਿਨਾਸ਼ਕ ਅਤੇ ਤਿੰਨਾਂ ਲੋਕਾਂ ਦੀਆਂ ਕਾਮਨਾਵਾਂ ਪੂਰੀਆਂ ਕਰਨ ਵਾਲਾ ਹੈਂ ॥੧੨੮॥ (ਹੇ ਪ੍ਰਭੂ!) ਤੂੰ ਤਿੰਨ ਵਰਗਾਂ (ਅਰਥ, ਧਰਮ ਅਤੇ ਕਾਮ) ਵਾਲਾ ਅਤੇ ਤਿੰਨਾਂ ਲੋਕਾਂ ਨੂੰ ਬੰਨ੍ਹਣ ਵਾਲਾ (ਅਧੀਨ ਰਖਣ ਵਾਲਾ) ਹੈਂ, ਤੂੰ ਨਾਸ਼ ਤੋਂ ਰਹਿਤ ਅਤੇ ਅਥਾਹ ਹੈਂ, ਤੂੰ (ਸੰਸਾਰ ਦੇ) ਸਾਰਿਆਂ ਹਿੱਸਿਆਂ ਵਿਚ ਸ਼ੋਭਾਇਮਾਨ ਹੈਂ, ਤੂੰ ਸਭ ਨੂੰ ਪਿਆਰ ਕਰਨ ਵਾਲਾ ਹੈਂ ॥੧੨੯॥ (ਹੇ ਪ੍ਰਭੂ!) ਤੇਰਾ ਸਰੂਪ ਤਿੰਨਾਂ ਲੋਕਾਂ ਨੂੰ ਭੋਗਣ ਵਾਲਾ (ਆਨੰਦ-ਦਾਇਕ) ਹੈ, ਤੇਰਾ ਰੂਪ ਵਿਨਾਸ਼ (ਛਿਜਣ) ਤੋਂ ਰਹਿਤ ਅਤੇ ਪਵਿਤਰ ਹੈ, ਤੂੰ ਨਰਕ ਨੂੰ ਨਸ਼ਟ ਕਰਨ ਵਾਲਾ ਅਤੇ ਪ੍ਰਿਥਵੀ ਉਤੇ ਨਿਵਾਸ ਕਰਨ ਵਾਲਾ ਹੈਂ ॥੧੩੦॥ (ਹੇ ਪ੍ਰਭੂ!) ਨਾ ਵਰਣਨ ਕੀਤੇ ਜਾ ਸਕਣ ਵਾਲਾ ਤੇਰਾ ਤੇਜ ਹੈ, ਤੂੰ ਸਦਾ ਵਰਤਮਾਨ ਹੈਂ, ਤੂੰ ਹੀ ਸਾਰੀ ਭੋਗਣਯੋਗ ਸਾਮਗ੍ਰੀ ਹੈਂ, ਤੂੰ ਸਾਰਿਆਂ ਨਾਲ ਸੰਯੁਕਤ ਅਤੇ ਉਪਮਾ ਤੋਂ ਰਹਿਤ ਹੈਂ ॥੧੩੧॥ (ਹੇ ਪ੍ਰਭੂ!) ਤੂੰ ਸਦਾ ਵਰਣਨ ਤੋਂ ਪਰੇ ਹੈਂ, ਤੇਰੀ ਸੋਭਾ ਵੱਖ ਵੱਖ ਤਰ੍ਹਾਂ ਦੀ ਹੈ, ਤੇਰਾ ਸਰੂਪ ਉਕਤੀਜੁ ਗਤੀ ਤੋਂ ਰਹਿਤ ਹੈ, ਤੂੰ ਸਭ ਨਾਲ ਸੰਯੁਕਤ ਹੈਂ ਅਤੇ ਉਪਮਾ ਦੇਣ ਦੀ ਸੀਮਾ ਤੋਂ ਪਰੇ ਹੈਂ ॥੧੩੨॥`
      },
      {
        number: 14,
        sanskrit: `ਚਾਚਰੀ ਛੰਦ ॥
ਅਭੰਗ ਹੈਂ ॥
ਅਨੰਗ ਹੈਂ ॥
ਅਭੇਖ ਹੈਂ ॥
ਅਲੇਖ ਹੈਂ ॥੧੩੩॥
ਅਭਰਮ ਹੈਂ ॥
ਅਕਰਮ ਹੈਂ ॥
ਅਨਾਦਿ ਹੈਂ ॥
ਜੁਗਾਦਿ ਹੈਂ ॥੧੩੪॥
ਅਜੈ ਹੈਂ ॥
ਅਬੈ ਹੈਂ ॥
ਅਭੂਤ ਹੈਂ ॥
ਅਧੂਤ ਹੈਂ ॥੧੩੫॥
ਅਨਾਸ ਹੈਂ ॥
ਉਦਾਸ ਹੈਂ ॥
ਅਧੰਧ ਹੈਂ ॥
ਅਬੰਧ ਹੈਂ ॥੧੩੬॥
ਅਭਗਤ ਹੈਂ ॥
ਬਿਰਕਤ ਹੈਂ ॥
ਅਨਾਸ ਹੈਂ ॥
ਪ੍ਰਕਾਸ ਹੈਂ ॥੧੩੭॥
ਨਿਚਿੰਤ ਹੈਂ ॥
ਸੁਨਿੰਤ ਹੈਂ ॥
ਅਲਿੱਖ ਹੈਂ ॥
ਅਦਿੱਖ ਹੈਂ ॥੧੩੮॥
ਅਲੇਖ ਹੈਂ ॥
ਅਭੇਖ ਹੈਂ ॥
ਅਢਾਹ ਹੈਂ ॥
ਅਗਾਹ ਹੈਂ ॥੧੩੯॥
ਅਸੰਭ ਹੈਂ ॥
ਅਗੰਭ ਹੈਂ ॥
ਅਨੀਲ ਹੈਂ ॥
ਅਨਾਦਿ ਹੈਂ ॥੧੪੦॥
ਅਨਿੱਤ ਹੈਂ ॥
ਸੁ ਨਿੱਤ ਹੈਂ ॥
ਅਜਾਤ ਹੈਂ ॥
ਅਜਾਦ ਹੈਂ ॥੧੪੧॥`,
        transliteration: `chaacharee chhand |
abhang hain |
anang hain |
abhekh hain |
alekh hain |133|
abharam hain |
akaram hain |
anaad hain |
jugaad hain |134|
ajai hain |
abai hain |
abhoot hain |
adhoot hain |135|
anaas hain |
audaas hain |
adhandh hain |
abandh hain |136|
abhagat hain |
birakat hain |
anaas hain |
prakaas hain |137|
nichint hain |
sunint hain |
alakh hain |
adakh hain |138|
alekh hain |
abhekh hain |
adtaah hain |
agaah hain |139|
asanbh hain |
aganbh hain |
aneel hain |
anaad hain |140|
anat hain |
su nit hain |
ajaat hain |
ajaad hain |141|`,
        meaning: `CHACHARI STANZA Thou art Indestructible! Thou art Limbless. Thou art Dessless! Thou art Indescribable. 133. Thou art Illusionless! Thou art Actionless. Thou art Beginningless! Thou art from the beginning of ages. 134. Thou art Unconquerable! Thou art Indestuctible. Thou art Elementless! Thou art Fearless. 135. Thou art Eternal! Thou art Non-attached. Thou art Non-involyed! Thou art Unbound. 136. Thou art Indivisible! Thou art Non-attached. Thou art Eternal! Thou art Supreme Light. 137. Thou art Carefree! Thou canst restrain the senses. Thou canst control the mind! Thou art Invincible. 138. Thou art Accountless! Thou art Garbless. Thou art Coastless! Thou art Bottomless. 139. Thou art Unborn! Thou art Bottomless. Thou art Countless! Thou art Beginningless. 140. Thou art Causeless! Thou art the Listener. Thou art Unborn! Thou art free. 141.`,
        meaning_pa: `ਚਾਚਰੀ ਛੰਦ: (ਹੇ ਪ੍ਰਭੂ!) ਤੂੰ ਨਾਸ਼-ਰਹਿਤ ਹੈਂ, ਤੂੰ ਸ਼ਰੀਰ ਰਹਿਤ ਹੈਂ, ਤੂੰ ਭੇਖ ਤੋਂ ਬਿਨਾ ਹੈਂ, ਤੂੰ ਲੇਖੇ ਤੋਂ ਬਾਹਰ ਹੈਂ ॥੧੩੩॥ (ਹੇ ਪ੍ਰਭੂ!) ਤੂੰ ਭਰਮ-ਰਹਿਤ ਹੈਂ, ਤੂੰ ਕਰਮ-ਰਹਿਤ ਹੈਂ, ਤੂੰ ਆਦਿ ਤੋਂ ਬਿਨਾ ਹੈਂ, ਤੂੰ ਯੁਗਾਂ ਦੇ ਆਰੰਭ ਤੋਂ ਪਹਿਲਾਂ ਦਾ ਹੈਂ ॥੧੩੪॥ (ਹੇ ਪ੍ਰਭੂ!) ਤੂੰ ਜਿਤਿਆ ਨਹੀਂ ਜਾ ਸਕਦਾ, ਤੂੰ ਆਯੂ-ਰਹਿਤ ਹੈਂ, ਤੂੰ ਪੰਜ ਤੱਤ੍ਵਾਂ ਤੋਂ ਮੁਕਤ ਹੈਂ, ਤੂੰ ਡੁਲਾਇਮਾਨ ਨਹੀਂ ਹੁੰਦਾ ॥੧੩੫॥ (ਹੇ ਪ੍ਰਭੂ!) ਤੂੰ ਨਾਸ਼-ਰਹਿਤ ਹੈਂ, ਤੂੰ (ਸਭ ਤੋਂ) ਉਪਰਾਮ ਹੈਂ, ਤੂੰ ਸੰਸਾਰਿਕ ਧੰਧਿਆਂ ਤੋਂ ਪਰੇ ਹੈਂ, ਤੂੰ ਬੰਧਨਾਂ ਤੋਂ ਮੁਕਤ ਹੈਂ ॥੧੩੬॥ (ਹੇ ਪ੍ਰਭੂ!) ਤੂੰ ਕਿਸੇ ਦੀ ਭਗਤੀ ਨਹੀਂ ਕਰਦਾ, ਤੂੰ ਵਿਰਕਤ ਹੈਂ, ਤੂੰ ਇੱਛਾ (ਆਸ) ਤੋਂ ਮੁਕਤ ਹੈਂ, ਤੂੰ ਪ੍ਰਕਾਸ਼ ਰੂਪ ਹੈਂ ॥੧੩੭॥ (ਹੇ ਪ੍ਰਭੂ!) ਤੂੰ ਚਿੰਤਾ ਤੋਂ ਮੁਕਤ ਹੈਂ, ਤੂੰ ਸਦਾ ਸਦੀਵੀ ਹੈਂ, ਤੂੰ ਲਿਖਿਆ ਨਹੀਂ ਜਾ ਸਕਦਾ, ਤੂੰ ਵੇਖਿਆ ਨਹੀਂ ਜਾ ਸਕਦਾ ॥੧੩੮॥ (ਹੇ ਪ੍ਰਭੂ!) ਤੂੰ ਲੇਖੇ ਤੋਂ ਬਾਹਰ ਹੈਂ, ਤੂੰ ਭੇਖਾਂ ਤੋਂ ਰਹਿਤ ਹੈਂ, ਤੈਨੂੰ ਕੋਈ ਡਿਗਾ (ਢਾਹ) ਨਹੀਂ ਸਕਦਾ (ਜਾਂ ਤੇਰਾ ਕੋਈ ਕੰਢਾ ਜਾਂ ਕਿਨਾਰਾ ਨਹੀਂ ਹੈ) ਤੇਰਾ ਕੋਈ ਪਾਰਾਵਾਰ ਨਹੀਂ ਹੈ ॥੧੩੯॥ (ਹੇ ਪ੍ਰਭੂ!) ਤੂੰ ਜਨਮ ('ਸੰਭ') ਤੋਂ ਰਹਿਤ ਹੈਂ, ਤੂੰ (ਮਨ-ਬਾਣੀ ਦੀ) ਪਹੁੰਚ ਤੋਂ ਪਰੇ ਹੈਂ, ਤੂੰ ਗਿਣਤੀ ਦੀ ਸੀਮਾ ਤੋਂ ਪਰੇ ਹੈਂ, ਤੇਰਾ ਕੋਈ ਆਦਿ ਨਹੀਂ ਹੈ ॥੧੪੦॥ (ਹੇ ਪ੍ਰਭੂ!) ਤੂੰ ਸਦੀਵੀ ਰੂਪ ਵਾਲਾ ਹੈਂ, ਤੂੰ ਸਦਾ ਕਾਇਮ-ਦਾਇਮ ਹੈਂ, ਤੂੰ ਜਨਮ-ਮਰਨ ਤੋਂ ਮੁਕਤ ਹੈਂ, ਤੂੰ ਸਦਾ ਆਜ਼ਾਦ (ਸੁਤੰਤਰ) ਹੈਂ ॥੧੪੧॥`
      },
      {
        number: 15,
        sanskrit: `ਚਰਪਟ ਛੰਦ ॥ ਤ੍ਵ ਪ੍ਰਸਾਦਿ ॥
ਸਰਬੰ ਹੰਤਾ ॥
ਸਰਬੰ ਗੰਤਾ ॥
ਸਰਬੰ ਖਿਆਤਾ ॥
ਸਰਬੰ ਗਿਆਤਾ ॥੧੪੨॥
ਸਰਬੰ ਹਰਤਾ ॥
ਸਰਬੰ ਕਰਤਾ ॥
ਸਰਬੰ ਪ੍ਰਾਣੰ ॥
ਸਰਬੰ ਤ੍ਰਾਣੰ ॥੧੪੩॥
ਸਰਬੰ ਕਰਮੰ ॥
ਸਰਬੰ ਧਰਮੰ ॥
ਸਰਬੰ ਜੁਗਤਾ ॥
ਸਰਬੰ ਮੁਕਤਾ ॥੧੪੪॥`,
        transliteration: `charapatt chhand | tv prasaad |
saraban hantaa |
saraban gantaa |
saraban khiaataa |
saraban giaataa |142|
saraban harataa |
saraban karataa |
saraban praanan |
saraban traanan |143|
saraban karaman |
saraban dharaman |
saraban jugataa |
saraban mukataa |144|`,
        meaning: `CHARPAT STANZA. BY THE GRACE Thou art the Destroyer of all! Thou art the Goer to all! Thou art well-known to all! Thou art the knower of all! 142 Thou Killest all! Thou Createst all! Thou art the Life of all! Thou art the Strength of all! 143 Thou art in all works! Thou art in all Religions! Thou art united with all! Thou art free from all! 144`,
        meaning_pa: `ਚਰਪਟ ਛੰਦ: ਤੇਰੀ ਕ੍ਰਿਪਾ ਨਾਲ: (ਹੇ ਪ੍ਰਭੂ!) ਤੂੰ ਸਭ ਨੂੰ ਮਾਰਨ ਵਾਲਾ ਹੈਂ, ਤੂੰ ਸਭ ਨੂੰ ਜਾਣਨ ਵਾਲਾ ਹੈ, ਤੂੰ ਸਭ ਵਿਚ ਪ੍ਰਸਿੱਧ ('ਖਿਆਤਾ') ਹੈਂ, ਤੂੰ ਸਭ ਬਾਰੇ ਜਾਣਕਾਰ ਹੈਂ ॥੧੪੨॥ (ਹੇ ਪ੍ਰਭੂ!) ਤੂੰ ਸਭ ਦਾ ਜੀਵਨ ਲੈਣ ਵਾਲਾ ਅਤੇ ਸਭ ਦਾ ਕਰਤਾ ਹੈਂ, ਤੂੰ ਸਭ ਦਾ ਪ੍ਰਾਣ (ਜੀਵਨ) ਅਤੇ ਸਭ ਦਾ ਤ੍ਰਾਣ (ਬਲ) ਹੈਂ ॥੧੪੩॥ (ਹੇ ਪ੍ਰਭੂ!) ਤੂੰ ਸਭ ਦਾ ਕਰਮ-ਸਰੂਪ ਹੈਂ, ਤੂੰ ਸਭ ਧਰਮਾਂ ਵਿਚ ਮੌਜੂਦ ਹੈਂ, ਤੂੰ ਸਭ ਨਾਲ ਸੰਯੁਕਤ ਹੈਂ ਅਤੇ ਸਾਰਿਆਂ ਤੋਂ ਮੁਕਤ ਹੈਂ ॥੧੪੪॥`
      },
      {
        number: 16,
        sanskrit: `ਰਸਾਵਲ ਛੰਦ ॥ ਤ੍ਵ ਪ੍ਰਸਾਦਿ ॥
ਨਮੋ ਨਰਕ ਨਾਸੇ ॥
ਸਦੈਵੰ ਪ੍ਰਕਾਸੇ ॥
ਅਨੰਗੰ ਸਰੂਪੇ ॥
ਅਭੰਗੰ ਬਿਭੂਤੇ ॥੧੪੫॥
ਪ੍ਰਮਾਥੰ ਪ੍ਰਮਾਥੇ ॥
ਸਦਾ ਸਰਬ ਸਾਥੇ ॥
ਅਗਾਧ ਸਰੂਪੇ ॥
ਨ੍ਰਿਬਾਧ ਬਿਭੂਤੇ ॥੧੪੬॥
ਅਨੰਗੀ ਅਨਾਮੇ ॥
ਤ੍ਰਿਭੰਗੀ ਤ੍ਰਿਕਾਮੇ ॥
ਨ੍ਰਿਭੰਗੀ ਸਰੂਪੇ ॥
ਸਰਬੰਗੀ ਅਨੂਪੇ ॥੧੪੭॥
ਨ ਪੋਤ੍ਰੈ ਨ ਪੁੱਤ੍ਰੈ ॥
ਨ ਸੱਤ੍ਰੈ ਨ ਮਿਤ੍ਰੈ ॥
ਨ ਤਾਤੈ ਨ ਮਾਤੈ ॥
ਨ ਜਾਤੈ ਨ ਪਾਤੈ ॥੧੪੮॥
ਨ੍ਰਿਸਾਕੰ ਸਰੀਕ ਹੈਂ ॥
ਅਮਿਤੋ ਅਮੀਕ ਹੈਂ ॥
ਸਦੈਵੰ ਪ੍ਰਭਾ ਹੈਂ ॥
ਅਜੈ ਹੈਂ ਅਜਾ ਹੈਂ ॥੧੪੯॥`,
        transliteration: `rasaaval chhand | tv prasaad |
namo narak naase |
sadaivan prakaase |
anangan saroope |
abhangan bibhoote |145|
pramaathan pramaathe |
sadaa sarab saathe |
agaadh saroope |
nribaadh bibhoote |146|
anangee anaame |
tribhangee trikaame |
nribhangee saroope |
sarabangee anoope |147|
n potrai na putrai |
n satrai na mitrai |
n taatai na maatai |
n jaatai na paatai |148|
nrisaakan sareek hain |
amito ameek hain |
sadaivan prabhaa hain |
ajai hain ajaa hain |149|`,
        meaning: `RASAAVAL STANZA. BY THY GRACE Salutation to Thee O Destroyer of Hell Lord Salutation to Thee O Ever-Illumined Lord! Salutation to Thee O Bodyless Entity Lord Salutation to Thee O Eternal and Effulgent Lord ! 145 Salutation to Thee O Destroyer of Tyrants Lord Salutation to Thee O Companion of all Lord! Salutation to Thee O Impenetrable Entity Lord Salution to Thee O Non-annoying Glorious Lord ! 146 Salutation to Thee O Limbless and Nameless LordA Salutation to Thee O Destroyer and Restorer of three modes Lord! Salutation tho Thee O Eternal Enity Lord! Salutation to Thee O Unique in all respects Lord 147 O Lord !  Thou art Sonless and Grandsonless. O Lord ! Thou art Enemyless and Friendless. O Lord !  Thou art Fatherless and Motherless. O Lord ! Thou art Casteless. And Lineagless. 148. O Lord !  Thou art Relativeless. O Lord ! Thou art Limitless and Profound. O Lord !  Thou art Ever Glorious. O Lord ! Thou art Unconquerable and Unborn. 149.`,
        meaning_pa: `ਰਸਾਵਲ ਛੰਦ: ਤੇਰੀ ਕ੍ਰਿਪਾ ਨਾਲ: ਹੇ ਨਰਕਾਂ ਨੂੰ ਨਸ਼ਟ ਕਰਨ ਵਾਲੇ! ਹੇ ਸਦਾ ਪ੍ਰਕਾਸ਼ਿਤ ਰਹਿਣ ਵਾਲੇ! ਹੇ ਸ਼ਰੀਰਰਹਿਤ ਰੂਪ ਵਾਲੇ! ਹੇ ਨਸ਼ਟ ਨਾ ਹੋਣ ਵਾਲੀ ਸੰਪੱਤੀ ਵਾਲੇ! (ਤੈਨੂੰ) ਨਮਸਕਾਰ ਹੈ ॥੧੪੫॥ ਹੇ ਦੁਖ ਦੇਣ ਵਾਲਿਆਂ ਨੂੰ ਨਸ਼ਟ ਕਰਨ ਵਾਲੇ! ਹੇ ਸਦਾ ਸਭ ਦੇ ਮੱਦਦਗਾਰ ਹੋਣ ਵਾਲੇ! ਹੇ ਸਦਾ ਅਗਾਧ ਸਰੂਪ ਵਾਲੇ! ਹੇ ਨਿਰਵਿਘਨ ਸੰਪੱਤੀ ਵਾਲੇ! (ਤੈਨੂੰ ਨਮਸਕਾਰ ਹੈ) ॥੧੪੬॥ ਹੇ ਅੰਗ (ਸ਼ਰੀਰ) ਅਤੇ ਨਾਮ ਤੋਂ ਰਹਿਤ! ਹੇ ਤਿੰਨਾਂ ਲੋਕਾਂ ਨੂੰ ਨਸ਼ਟ ਕਰਨ ਵਾਲੇ ਅਤੇ ਤਿੰਨਾਂ ਦੀਆਂ ਕਾਮਨਾਵਾਂ ਪੂਰੀਆਂ ਕਰਨ ਵਾਲੇ! ਹੇ ਅਵਿਨਾਸ਼ੀ ਸਰੂਪ ਵਾਲੇ! ਹੇ ਸਾਰਿਆਂ ਦੇ ਸਾਥੀ ਅਤੇ ਉਪਮਾ ਤੋਂ ਰਹਿਤ! (ਤੈਨੂੰ ਨਮਸਕਾਰ ਹੈ) ॥੧੪੭॥ (ਹੇ ਪ੍ਰਭੂ!) ਤੇਰਾ ਨਾ ਕੋਈ ਪੁੱਤਰ ਹੈ ਅਤੇ ਨਾ ਹੀ ਪੋਤਰਾ, ਨਾ ਕੋਈ ਵੈਰੀ ਹੈ ਅਤੇ ਨਾ ਹੀ ਕੋਈ ਮਿਤਰ ਹੈ, ਨਾ ਤੇਰਾ ਕੋਈ ਪਿਤਾ ਹੈ ਨਾ ਮਾਤਾ, ਨਾ ਤੇਰੀ ਕੋਈ ਜਾਤਿ ਹੈ ਅਤੇ ਨਾ ਹੀ ਭਾਈਚਾਰਾ ॥੧੪੮॥ (ਹੇ ਪ੍ਰਭੂ!) ਤੇਰਾ ਨਾ ਤਾਂ ਕੋਈ ਸਾਕ ਹੈ, ਨਾ ਹੀ ਸ਼ਰੀਕ ਹੈ, ਤੂੰ ਅਮਿਤ ਅਤੇ ਅਪਾਰ ਹੈਂ, ਤੂੰ ਸਦਾ ਪ੍ਰਕਾਸ਼ਮਾਨ ਹੈਂ, ਤੂੰ ਅਜਿਤ ਅਤੇ ਅਜਨਮਾ ਹੈਂ ॥੧੪੯॥`
      },
      {
        number: 17,
        sanskrit: `ਭਗਵਤੀ ਛੰਦ ॥ ਤ੍ਵ ਪ੍ਰਸਾਦਿ ॥
ਕਿ ਜ਼ਾਹਰ ਜ਼ਹੂਰ ਹੈਂ ॥
ਕਿ ਹਾਜ਼ਰ ਹਜ਼ੂਰ ਹੈਂ ॥
ਹਮੇਸੁਲ ਸਲਾਮ ਹੈਂ ॥
ਸਮਸਤੁਲ ਕਲਾਮ ਹੈਂ ॥੧੫੦॥
ਕਿ ਸਾਹਿਬ ਦਿਮਾਗ਼ ਹੈਂ ॥
ਕਿ ਹੁਸਨਲ ਚਰਾਗ਼ ਹੈਂ ॥
ਕਿ ਕਾਮਲ ਕਰੀਮ ਹੈਂ ॥
ਕਿ ਰਾਜ਼ਕ ਰਹੀਮ ਹੈਂ ॥੧੫੧॥
ਕਿ ਰੋਜ਼ੀ ਦਿਹਿੰਦ ਹੈਂ ॥
ਕਿ ਰਾਜ਼ਕ ਰਹਿੰਦ ਹੈਂ ॥
ਕਰੀਮੁਲ ਕਮਾਲ ਹੈਂ ॥
ਕਿ ਹੁਸਨਲ ਜਮਾਲ ਹੈਂ ॥੧੫੨॥
ਗ਼ਨੀਮੁਲ ਖ਼ਿਰਾਜ ਹੈਂ ॥
ਗ਼ਰੀਬੁਲ ਨਿਵਾਜ਼ ਹੈਂ ॥
ਹਰੀਫ਼ੁਲ ਸ਼ਿਕੰਨ ਹੈਂ ॥
ਹਿਰਾਸੁਲ ਫਿਕੰਨ ਹੈਂ ॥੧੫੩॥
ਕਲੰਕੰ ਪ੍ਰਣਾਸ ਹੈਂ ॥
ਸਮਸਤੁਲ ਨਿਵਾਸ ਹੈਂ ॥
ਅਗੰਜੁਲ ਗਨੀਮ ਹੈਂ ॥
ਰਜਾਇਕ ਰਹੀਮ ਹੈਂ ॥੧੫੪॥
ਸਮਸਤੁਲ ਜੁਬਾਂ ਹੈਂ ॥
ਕਿ ਸਾਹਿਬ ਕਿਰਾਂ ਹੈਂ ॥
ਕਿ ਨਰਕੰ ਪ੍ਰਣਾਸ ਹੈਂ ॥
ਬਹਿਸਤੁਲ ਨਿਵਾਸ ਹੈਂ ॥੧੫੫॥
ਕਿ ਸਰਬੁਲ ਗਵੰਨ ਹੈਂ ॥
ਹਮੇਸੁਲ ਰਵੰਨ ਹੈਂ ॥
ਤਮਾਮੁਲ ਤਮੀਜ ਹੈਂ ॥
ਸਮਸਤੁਲ ਅਜੀਜ ਹੈਂ ॥੧੫੬॥
ਪਰੰ ਪਰਮ ਈਸ ਹੈਂ ॥
ਸਮਸਤੁਲ ਅਦੀਸ ਹੈਂ ॥
ਅਦੇਸੁਲ ਅਲੇਖ ਹੈਂ ॥
ਹਮੇਸੁਲ ਅਭੇਖ ਹੈਂ ॥੧੫੭॥
ਜ਼ਮੀਨੁਲ ਜ਼ਮਾ ਹੈਂ ॥
ਅਮੀਕੁਲ ਇਮਾ ਹੈਂ ॥
ਕਰੀਮੁਲ ਕਮਾਲ ਹੈਂ ॥
ਕਿ ਜੁਰਅਤਿ ਜਮਾਲ ਹੈਂ ॥੧੫੮॥
ਕਿ ਅਚਲੰ ਪ੍ਰਕਾਸ ਹੈਂ ॥
ਕਿ ਅਮਿਤੋ ਸੁਬਾਸ ਹੈਂ ॥
ਕਿ ਅਜਬ ਸਰੂਪ ਹੈਂ ॥
ਕਿ ਅਮਿਤੋ ਬਿਭੂਤ ਹੈਂ ॥੧੫੯॥
ਕਿ ਅਮਿਤੋ ਪਸਾ ਹੈਂ ॥
ਕਿ ਆਤਮ ਪ੍ਰਭਾ ਹੈਂ ॥
ਕਿ ਅਚਲੰ ਅਨੰਗ ਹੈਂ ॥
ਕਿ ਅਮਿਤੋ ਅਭੰਗ ਹੈਂ ॥੧੬੦॥`,
        transliteration: `bhagavatee chhand | tv prasaad |
ki zaahar zahoor hain |
ki haazar hazoor hain |
hamesul salaam hain |
samasatul kalaam hain |150|
ki saahib dimaag hain |
ki husanal charaag hain |
ki kaamal kareem hain |
ki raazak raheem hain |151|
ki rozee dihind hain |
ki raazak rahind hain |
kareemul kamaal hain |
ki husanal jamaal hain |152|
ganeemul khiraaj hain |
gareebul nivaaz hain |
hareeful shikan hain |
hiraasul fikan hain |153|
kalankan pranaas hain |
samasatul nivaas hain |
aganjul ganeem hain |
rajaaeik raheem hain |154|
samasatul jubaan hain |
ki saahib kiraan hain |
ki narakan pranaas hain |
bahisatul nivaas hain |155|
ki sarabul gavan hain |
hamesul ravan hain |
tamaamul tameej hain |
samasatul ajeej hain |156|
paran param ees hain |
samasatul adees hain |
adesul alekh hain |
hamesul abhekh hain |157|
zameenul zamaa hain |
ameekul imaa hain |
kareemul kamaal hain |
ki jurat jamaal hain |158|
ki achalan prakaas hain |
ki amito subaas hain |
ki ajab saroop hain |
ki amito bibhoot hain |159|
ki amito pasaa hain |
ki aatam prabhaa hain |
ki achalan anang hain |
ki amito abhang hain |160|`,
        meaning: `BHAGVATI STANZA. BY THY GRACE That Thou art visible illumination! That Thou art All-Prevading! That Thou art reveiver of Eternal conpliments! That Thou art Venerated by all! 150 That Thou art Most Intelligent! That Thou art the Lamp of Beauty! That Thou art completely Generous! That Thou art Sustainer and Merciful! 151 That Thou art Giver of Sustenance! That Thou art ever the Sustainer! That Thou art the perfection of Generosity! That Thou art Most Beautiful! 152 That Thou art the Penaliser of enemies! That Thou art the Supporter of the poor! That Thou art the Destroyer of enemies ! That Thou art the remover of Fear ! 153 That Thou art the Destroyer of blemishes! That Thou art the dweller in all! That Thou art invincible by enemies! That Thou art the Sustainer and Gracious! 154 That Thou art the Master of all languages! That Thou art the Most Glorious! That Thou art the Destroyer of hell! That Thou art the dweller in heaven! 155 That Thou art the Goer to all! That Thou art ever Blissful! That Thou art the knower of all! That Thou art dearest to all! 156 That Thou art the Lord of lords! That Thou art hidden from all! That Thou art countryless and accountless! That Thou art ever garbles! 157 That Thou art in Earth and Heaven! That Thou art Most Profound in signs! That Thou art Most Generous! That Thou art embodiment of courage and beauty! 158 That Thou art perpetual illumination! That Thou art Limitless fragrance! That Thou art wonderful entity! That Thou art Limitless Grandeur! 159 That Thou art Limitless Expanse! That Thou art selfluminous! That Thou art Steady and Limbless! That Thou art Infinite and Indestructible! 160`,
        meaning_pa: `ਭਗਵਤੀ ਛੰਦ: ਤੇਰੀ ਕ੍ਰਿਪਾ ਨਾਲ: (ਹੇ ਪ੍ਰਭੂ!) ਤੂੰ ਪ੍ਰਗਟ ਰੂਪ ਵਿਚ ਪ੍ਰਕਾਸ਼ਮਾਨ ਹੈਂ, ਤੂੰ ਸਾਹਮਣੇ ਮੌਜੂਦ ਹੈਂ, ਤੂੰ ਹਮੇਸ਼ਾ ਸਲਾਮਤ ਹੈਂ ਅਤੇ ਸਭ ਵਿਚ ਤੇਰੇ ਹੀ ਬੋਲ ('ਕਲਾਮ') ਹਨ ॥੧੫੦॥ (ਹੇ ਪ੍ਰਭੂ!) ਤੂੰ ਸ੍ਰੇਸ਼ਠ ਬੁੱਧੀ ਦਾ ਮਾਲਕ ਹੈਂ, ਤੂੰ ਹੁਸਨ ਦਾ ਦੀਪਕ ਹੈਂ, ਤੂੰ ਪਰਮ ਬਖਸ਼ਿੰਦ ਹੈਂ, ਤੂੰ ਰੋਜ਼ੀ ਦੇਣ ਵਾਲਾ ਦਿਆਲੂ ਹੈਂ ॥੧੫੧॥ (ਹੇ ਪ੍ਰਭੂ!) ਤੂੰ ਰੋਜ਼ੀ ਦੇਣ ਵਾਲਾ ਹੈਂ, ਤੂੰ ਮੁਕਤੀ ਪ੍ਰਦਾਨ ਕਰਨ ਵਾਲਾ ਦਇਆਵਾਨ ਹੈਂ, ਤੂੰ ਸ੍ਰੇਸ਼ਠ ('ਕਮਾਲ') ਕ੍ਰਿਪਾਲੂ ਹੈਂ, ਤੂੰ ਅਤਿਅੰਤ ਸੁੰਦਰ ਹੈਂ ॥੧੫੨॥ (ਹੇ ਪ੍ਰਭੂ!) ਤੂੰ ਵੈਰੀਆਂ ਤੋਂ ਵੀ ਕਰ ਵਸੂਲਣ ਵਾਲਾ ਹੈਂ (ਅਰਥਾਤ ਸਭ ਨੂੰ ਅਧੀਨ ਰਖਣ ਵਾਲਾ ਹੈਂ) ਤੂੰ ਗ਼ਰੀਬਾਂ ਨੂੰ ਵਡਿਆਉਣ ਵਾਲਾ ਹੈਂ, ਤੂੰ ਵੈਰੀਆਂ ਦਾ ਨਾਸ਼ਕ ਹੈਂ, ਤੂੰ ਭੈ ਨੂੰ ਪਰੇ ਸੁਟਣ ਵਾਲਾ ('ਫਿਕੰਨ') ਹੈਂ ॥੧੫੩॥ (ਹੇ ਪ੍ਰਭੂ!) ਤੂੰ ਕਲੰਕ ਨੂੰ ਨਸ਼ਟ ਕਰਨ ਵਾਲਾ ਹੈਂ, ਤੂੰ ਸਾਰਿਆਂ ਵਿਚ ਵਸਦਾ ਹੈਂ, ਤੂੰ ਵੈਰੀਆਂ ('ਗਨੀਮ') ਤੋਂ ਨਸ਼ਟ ਹੋਣ ਵਾਲਾ ਨਹੀਂ ਹੈਂ, ਤੂੰ ਸਭ ਨੂੰ ਰੋਜ਼ੀ ਦੇਣ ਵਾਲਾ ਮਿਹਰਬਾਨ ਹੈਂ ॥੧੫੪॥ (ਹੇ ਪ੍ਰਭੂ!) ਤੂੰ ਸਾਰਿਆਂ ਦੀ ਬੋਲੀ ਹੈਂ (ਅਰਥਾਤ ਸਭ ਵਿਚ ਤੂੰ ਹੀ ਬੋਲ ਰਿਹਾ ਹੈਂ) ਤੂੰ ਸ਼ੁਭ ਸ਼ਗਨਾਂ ('ਕਿਰਾ') ਦਾ ਸੁਆਮੀ ਹੈਂ, ਤੂੰ ਨਰਕਾਂ ਨੂੰ ਨਸ਼ਟ ਕਰਨ ਵਾਲਾ ਹੈਂ, ਤੂੰ ਬਹਿਸ਼ਤ (ਸੁਅਰਗ) ਵਿਚ ਨਿਵਾਸ ਕਰਦਾ ਹੈਂ ॥੧੫੫॥ (ਹੇ ਪ੍ਰਭੂ!) ਤੂੰ ਸਭ ਵਿਚ ਗਮਨ ਕਰਦਾ ਹੈਂ, ਤੂੰ ਹਮੇਸ਼ਾ (ਸਭ ਵਿਚ) ਵਿਆਪਤ ਹੋਣ ਵਾਲਾ ਹੈਂ, ਤੂੰ ਸਭ ਦੀ ਪਛਾਣ ਰਖਦਾ ਹੈਂ, ਤੂੰ ਸਭ ਦਾ ਪਿਆਰਾ ਹੈਂ ॥੧੫੬॥ (ਹੇ ਪ੍ਰਭੂ!) ਤੂੰ ਪਰਮ ਸ੍ਰੇਸ਼ਠ ਸੁਆਮੀ ਹੈਂ, ਤੂੰ ਸਭ ਲਈ ਅਦ੍ਰਿਸ਼ ਹੈਂ, ਤੂੰ ਦੇਸਾਂ ਤੋਂ ਰਹਿਤ ਅਤੇ ਲੇਖੇ ਤੋਂ ਰਹਿਤ ਹੈਂ, ਤੂੰ ਸਦਾ ਭੇਖਾਂ ਤੋਂ ਰਹਿਤ ਹੈਂ ॥੧੫੭॥ (ਹੇ ਪ੍ਰਭੂ!) ਤੂੰ ਧਰਤੀ ਅਤੇ ਆਕਾਸ਼ ਵਿਚ ਵਿਆਪਤ ਹੈਂ, ਤੂੰ ਗਹਿਰ ਗੰਭੀਰ ਧਰਮ ਵਾਲਾ ਹੈਂ, ਤੂੰ ਸ੍ਰੇਸ਼ਠ ਕ੍ਰਿਪਾਲੂ ਹੈਂ, ਤੂੰ ਸਾਹਸ ('ਜੁਰਅਤ') ਦਾ ਤੇਜ ਹੈਂ ॥੧੫੮॥ (ਹੇ ਪ੍ਰਭੂ!) ਤੂੰ ਅਚਲ ਪ੍ਰਕਾਸ਼ ਵਾਲਾ ਹੈਂ, ਤੂੰ ਅਮਿਤ ਸੁਗੰਧ ਵਾਲਾ ਹੈਂ, ਤੂੰ ਅਦਭੁਤ ਰੂਪ ਵਾਲਾ ਹੈਂ, ਤੂੰ ਅਸੀਮ ਸੰਪੱਤੀ ਵਾਲਾ ਹੈਂ ॥੧੫੯॥ (ਹੇ ਪ੍ਰਭੂ!) ਤੂੰ ਅਸੀਮ ਪਸਾਰ ਵਾਲਾ ਹੈਂ, ਤੂੰ ਆਪਣੇ ਆਪ ਪ੍ਰਕਾਸ਼ਵਾਨ ਹੈਂ, ਤੂੰ ਅਚਲ ਅਤੇ ਸ਼ਰੀਰ-ਰਹਿਤ ਹੈਂ, ਤੂੰ ਅਨੰਤ ਅਤੇ ਅਵਿਨਾਸ਼ੀ ਹੈਂ ॥੧੬੦॥`
      },
      {
        number: 18,
        sanskrit: `ਮਧੁਭਾਰ ਛੰਦ ॥ ਤ੍ਵ ਪ੍ਰਸਾਦਿ ॥
ਮੁਨਿ ਮਨਿ ਪ੍ਰਨਾਮ ॥
ਗੁਨਿ ਗਨ ਮੁਦਾਮ ॥
ਅਰਿ ਬਰ ਅਗੰਜ ॥
ਹਰਿ ਨਰ ਪ੍ਰਭੰਜ ॥੧੬੧॥
ਅਨਗਨ ਪ੍ਰਨਾਮ ॥
ਮੁਨਿ ਮਨਿ ਸਲਾਮ ॥
ਹਰਿ ਨਰ ਅਖੰਡ ॥
ਬਰ ਨਰ ਅਮੰਡ ॥੧੬੨॥
ਅਨਭਵ ਅਨਾਸ ॥
ਮੁਨਿ ਮਨਿ ਪ੍ਰਕਾਸ ॥
ਗੁਨਿ ਗਨ ਪ੍ਰਨਾਮ ॥
ਜਲ ਥਲ ਮੁਦਾਮ ॥੧੬੩॥
ਅਨਛਿੱਜ ਅੰਗ ॥
ਆਸਨ ਅਭੰਗ ॥
ਉਪਮਾ ਅਪਾਰ ॥
ਗਤਿ ਮਿਤਿ ਉਦਾਰ ॥੧੬੪॥
ਜਲ ਥਲ ਅਮੰਡ ॥
ਦਿਸ ਵਿਸ ਅਭੰਡ ॥
ਜਲ ਥਲ ਮਹੰਤ ॥
ਦਿਸ ਵਿਸ ਬਿਅੰਤ ॥੧੬੫॥
ਅਨਭਵ ਅਨਾਸ ॥
ਧ੍ਰਿਤ ਧਰ ਧੁਰਾਸ ॥
ਆਜਾਨ ਬਾਹੁ ॥
ਏਕੈ ਸਦਾਹੁ ॥੧੬੬॥
ਓਅੰਕਾਰ ਆਦਿ ॥
ਕਥਨੀ ਅਨਾਦਿ ॥
ਖਲ ਖੰਡ ਖਿਆਲ ॥
ਗੁਰ ਬਰ ਅਕਾਲ ॥੧੬੭॥
ਘਰ ਘਰਿ ਪ੍ਰਨਾਮ ॥
ਚਿਤ ਚਰਨ ਨਾਮ ॥
ਅਨਛਿੱਜ ਗਾਤ ॥
ਆਜਿਜ ਨ ਬਾਤ ॥੧੬੮॥
ਅਨਝੰਝ ਗਾਤ ॥
ਅਨਰੰਜ ਬਾਤ ॥
ਅਨਟੁਟ ਭੰਡਾਰ ॥
ਅਨਠਟ ਅਪਾਰ ॥੧੬੯॥
ਆਡੀਠ ਧਰਮ ॥
ਅਤਿ ਢੀਠ ਕਰਮ ॥
ਅਣਬ੍ਰਣ ਅਨੰਤ ॥
ਦਾਤਾ ਮਹੰਤ ॥੧੭੦॥`,
        transliteration: `madhubhaar chhand | tv prasaad |
mun man pranaam |
gun gan mudaam |
ar bar aganj |
har nar prabhanj |161|
anagan pranaam |
mun man salaam |
har nar akhandd |
bar nar amandd |162|
anabhav anaas |
mun man prakaas |
gun gan pranaam |
jal thal mudaam |163|
anachhaj ang |
aasan abhang |
aupamaa apaar |
gat mit udaar |164|
jal thal amandd |
dis vis abhandd |
jal thal mahant |
dis vis biant |165|
anabhav anaas |
dhrit dhar dhuraas |
aajaan baahu |
ekai sadaahu |166|
oankaar aad |
kathanee anaad |
khal khandd khiaal |
gur bar akaal |167|
ghar ghar pranaam |
chit charan naam |
anachhaj gaat |
aajij na baat |168|
anajhanjh gaat |
anaranj baat |
anattutt bhanddaar |
anatthatt apaar |169|
aaddeetth dharam |
at dteetth karam |
anabran anant |
daataa mahant |170|`,
        meaning: `MADHUBHAR STANZA. BY THY GRACE. O Lord !  The sages bow before Thee in their mind! O Lord !  Thou art ever the Treasure of virtues. O Lord !  Thou canst not be destroyed by great enemies! O Lord !  Thou art the Destroyer of all.161. O Lord !  Innumerable beings bow before Thee. O Lord ! The sages salute Thee in their mind. O Lord !  Thou art complete controller of men. O Lord ! Thou canst not be installed by the chiefs. 162. O Lord !  Thou art eternal knowledge. O Lord ! Thou art illumined in the hearts of the sages. O Lord !  The assemblies of virtuous bow before thee. O Lord ! Thou pervadest in water and on land. 163. O Lord !  Thy body is unbreakable. O Lord ! Thy seat is perpetual. O Lord !  Thy Praises are boundless. O Lord ! Thy nature is most Generous. 164. O Lord !  Thou art most glorious in water and on land. O Lord ! Thou art free from slander at all places. O Lord !  Thou art Supreme in water and on land. O Lord ! Thou art endless in all directions. 165. O Lord !  Thou art eternal knowledge. O Lord ! Thou art Supreme among the contented ones. O Lord !  Thou art the arm of gods. O Lord ! Thou art ever the Only One. 166. O Lord !  Thou art AUM, the origin of creation. O Lord ! Thou art stated to be without beginning. O Lord !  Thou destroyest the tyrants instantly! O Lord thou art supreme and Immortal. 167.! O Lord !  Thou art honoured in every house. O Lord ! Thy Feet and Thy Name are meditated in every heart. O Lord !  Thy body never becomes old. O Lord ! Thou art never subservient to anybody. 168. O Lord !  Thy body is ever steady. O Lord ! Thou art free from rage. O Lord !  Thy store is inexhaustible. O Lord ! Thou art uninstalled and boundless. 169. O Lord !  Thy Law is imperceptible. O Lord ! Thy actions are most fearless. O Lord !  Thou art Invincible and Infinite. O Lord ! Thou art the Supreme Donor. 170.`,
        meaning_pa: `ਮਧੁਭਾਰ ਛੰਦ: ਤੇਰੀ ਕ੍ਰਿਪਾ ਨਾਲ: (ਹੇ ਪ੍ਰਭੂ!) ਤੈਨੂੰ ਮੁਨੀ ਮਨ ਵਿਚ ਪ੍ਰਨਾਮ ਕਰਦੇ ਹਨ, ਤੂੰ ਸਦਾ ਗੁਣਾਂ ਦਾ ਸੁਆਮੀ ਹੈ, ਤੂੰ ਵੱਡੇ ਵੈਰੀਆਂ ਲਈ ਵੀ ਅਜਿਤ ਹੈਂ, ਹੇ ਹਰਿ! (ਤੂੰ) ਸਭ ਮਨੁੱਖਾਂ ਨੂੰ ਨਸ਼ਟ ਕਰਨ ਦੇ ਸਮਰਥ ਹੈਂ ॥੧੬੧॥ (ਹੇ ਪ੍ਰਭੂ!) ਤੈਨੂੰ ਅਨੇਕ ਜੀਵ ਜੁਹਾਰ ਕਰਦੇ ਹਨ, ਤੈਨੂੰ ਮੁਨੀ ਲੋਕ ਮਨ ਵਿਚ ਪ੍ਰਨਾਮ ਕਰਦੇ ਹਨ, ਹੇ ਹਰਿ! (ਤੂੰ) ਨਾ ਖੰਡਿਤ ਕੀਤੇ ਜਾ ਸਕਣ ਵਾਲਾ ਨਰ ਸ੍ਰੇਸ਼ਠ ਹੈਂ, ਤੂੰ ਬਿਨਾ ਸਥਾਪਿਤ ਕੀਤੇ ਸ੍ਰੇਸ਼ਠ ਪੁਰਸ਼ ਹੈਂ ॥੧੬੨॥ (ਹੇ ਪ੍ਰਭੂ!) ਤੂੰ ਨਾ ਨਸ਼ਟ ਹੋਣ ਵਾਲੇ ਸੁਤਹ ਗਿਆਨ ਵਾਲਾ ਹੈਂ, ਤੂੰ ਮੁਨੀਆਂ ਦੇ ਮਨ ਦਾ ਪ੍ਰਕਾਸ਼ (ਗਿਆਨ) ਵੀ ਹੈਂ, ਹੇ ਗੁਣਾਂ ਦੇ ਭੰਡਾਰ! (ਤੈਨੂੰ ਮੇਰਾ) ਪ੍ਰਨਾਮ ਹੈ, ਤੂੰ ਜਲ ਥਲ ਵਿਚ ਸਦਾ ਮੌਜੂਦ ਹੈਂ ॥੧੬੩॥ (ਹੇ ਪ੍ਰਭੂ!) ਤੇਰਾ ਸਰੂਪ ਛਿਜਣ ਵਾਲਾ ਨਹੀਂ ਹੈ, ਤੇਰਾ ਆਸਨ ਅਚਲ ਹੈ, ਤੇਰੀ ਉਪਮਾ ਅਪਾਰ ਹੈ, ਤੇਰੀ ਚਾਲ ਅਤੇ ਸੀਮਾ ਅਤਿ ਉਦਾਰ ਹੈ ॥੧੬੪॥ (ਹੇ ਪ੍ਰਭੂ!) ਤੂੰ ਜਲ-ਥਲ ਵਿਚ ਸ਼ੋਭਾਇਮਾਨ ਹੈਂ, ਤੂੰ ਦਿਸ਼ਾ-ਵਿਦਿਸ਼ਾ ਵਿਚ ਅਨਿੰਦ ਹੈਂ, ਤੂੰ ਜਲ-ਥਲ ਦਾ ਸੁਆਮੀ ਹੈਂ, ਤੂੰ ਦਿਸ਼ਾ-ਵਿਦਿਸ਼ਾ ਵਿਚ ਬਿਨਾ ਅੰਤ ਦੇ ਹੈਂ ॥੧੬੫॥ (ਹੇ ਪ੍ਰਭੂ!) ਤੇਰਾ ਸੁਤਹ ਗਿਆਨ ਨਸ਼ਟ ਹੋਣ ਵਾਲਾ ਨਹੀਂ, ਤੂੰ ਧੀਰਜ-ਧਾਰੀਆਂ ਦਾ ਧੁਰਾ ਹੈਂ, ਤੂੰ ਦੇਵਤਿਆਂ ਦਾ ਪ੍ਰੇਰਕ ਹੈਂ (ਜਾਂ ਗੋਡਿਆਂ ਤਕ ਲੰਬੀਆਂ ਭੁਜਾਵਾਂ ਵਾਲਾ ਹੈਂ) ਤੂੰ ਸਦਾ ਇਕੋ ਇਕ ਹੈਂ ॥੧੬੬॥ (ਹੇ ਪ੍ਰਭੂ!) ਤੂੰ ਆਦਿ ਤੋਂ ਓਅੰਕਾਰ ਸਰੂਪ ਹੈਂ, ਤੇਰਾ ਵਰਣਨ ਕਥਨ ਤੋਂ ਪਰੇ ਹੈ, ਤੂੰ ਫੁਰਨੇ ਵਿਚ ਹੀ ਦੁਸ਼ਟਾਂ ('ਖਲ') ਨੂੰ ਨਸ਼ਟ ਕਰ ਸਕਦਾ ਹੈਂ, ਤੂੰ ਸਭ ਤੋਂ ਵੱਡਾ ਅਤੇ ਕਾਲ ਤੋਂ ਪਰੇ ਹੈਂ ॥੧੬੭॥ (ਹੇ ਪ੍ਰਭੂ!) ਤੈਨੂੰ ਘਰ ਘਰ ਵਿਚ ਪ੍ਰਨਾਮ ਹੁੰਦਾ ਹੈ, (ਹਰ ਇਕ ਜੀਵ ਦੇ) ਚਿੱਤ ਵਿਚ ਤੇਰੇ ਚਰਨਾਂ ਦਾ ਧਿਆਨ ਅਤੇ ਤੇਰੇ ਨਾਮ ਦਾ ਸਿਮਰਨ ਹੈ, ਤੇਰਾ ਸ਼ਰੀਰ ਕਦੇ ਨਾਸ਼ ਹੋਣ ਵਾਲਾ ਨਹੀਂ ਹੈਂ, ਤੂੰ ਕਿਸੇ ਗੱਲ ਲਈ ਵੀ ਅਸਮਰਥ (ਆਜਿਜ਼) ਨਹੀਂ ॥੧੬੮॥ (ਹੇ ਪ੍ਰਭੂ!) ਤੂੰ ਅਡੋਲ ਸ਼ਰੀਰ ਵਾਲਾ ਹੈਂ, ਤੂੰ ਕਿਸੇ ਵੀ ਗੱਲ ਤੇ ਕ੍ਰੋਧਿਤ ਨਹੀਂ ਹੁੰਦਾ, ਤੂੰ ਅਮੁਕ ਭੰਡਾਰ ਵਾਲਾ ਹੈਂ, ਤੂੰ ਨਾ ਸਥਾਪਿਤ ਕੀਤਾ ਜਾ ਸਕਣ ਵਾਲਾ ਅਪਾਰ ਹੈਂ ॥੧੬੯॥ (ਹੇ ਪ੍ਰਭੂ!) ਤੂੰ ਅਦ੍ਰਿਸ਼ਟ ਕਰਤੱਵ ('ਧਰਮ') ਵਾਲਾ ਹੈਂ, ਤੇਰੇ ਕਰਮ ਬੜੇ ਦ੍ਰਿੜ੍ਹ ਹਨ, ਤੈਨੂੰ ਕੋਈ ਸਟ ਨਹੀਂ ਮਾਰ ਸਕਦਾ, ਤੂੰ ਅਨੰਤ ਹੈਂ, ਤੂੰ ਮਹਾਨ ਦਾਤਾ ਹੈਂ ॥੧੭੦॥`
      },
      {
        number: 19,
        sanskrit: `ਹਰਿਬੋਲਮਨਾ ਛੰਦ ॥ ਤ੍ਵ ਪ੍ਰਸਾਦਿ ॥
ਕਰੁਣਾਲਯ ਹੈਂ ॥
ਅਰਿ ਘਾਲਯ ਹੈਂ ॥
ਖਲ ਖੰਡਨ ਹੈਂ ॥
ਮਹਿ ਮੰਡਨ ਹੈਂ ॥੧੭੧॥
ਜਗਤੇਸ੍ਵਰ ਹੈਂ ॥
ਪਰਮੇਸ੍ਵਰ ਹੈਂ ॥
ਕਲਿ ਕਾਰਣ ਹੈਂ ॥
ਸਰਬ ਉਬਾਰਣ ਹੈਂ ॥੧੭੨॥
ਧ੍ਰਿਤ ਕੇ ਧ੍ਰਣ ਹੈਂ ॥
ਜਗ ਕੇ ਕ੍ਰਣ ਹੈਂ ॥
ਮਨ ਮਾਨਿਯ ਹੈਂ ॥
ਜਗ ਜਾਨਿਯ ਹੈਂ ॥੧੭੩॥
ਸਰਬੰ ਭਰ ਹੈਂ ॥
ਸਰਬੰ ਕਰ ਹੈਂ ॥
ਸਰਬ ਪਾਸਿਯ ਹੈਂ ॥
ਸਰਬ ਨਾਸਿਯ ਹੈਂ ॥੧੭੪॥
ਕਰੁਣਾਕਰ ਹੈਂ ॥
ਬਿਸ੍ਵੰਭਰ ਹੈਂ ॥
ਸਰਬੇਸ੍ਵਰ ਹੈਂ ॥
ਜਗਤੇਸ੍ਵਰ ਹੈਂ ॥੧੭੫॥
ਬ੍ਰਹਮੰਡਸ ਹੈਂ ॥
ਖਲ ਖੰਡਸ ਹੈਂ ॥
ਪਰ ਤੇ ਪਰ ਹੈਂ ॥
ਕਰੁਣਾਕਰ ਹੈਂ ॥੧੭੬॥
ਅਜਪਾ ਜਪ ਹੈਂ ॥
ਅਥਪਾ ਥਪ ਹੈਂ ॥
ਅਕ੍ਰਿਤਾ ਕ੍ਰਿਤ ਹੈਂ ॥
ਅੰਮ੍ਰਿਤਾ ਮ੍ਰਿਤ ਹੈਂ ॥੧੭੭॥
ਅਮ੍ਰਿਤਾ ਮ੍ਰਿਤ ਹੈਂ ॥
ਕਰਣਾ ਕ੍ਰਿਤ ਹੈਂ ॥
ਅਕ੍ਰਿਤਾ ਕ੍ਰਿਤ ਹੈਂ ॥
ਧਰਣੀ ਧ੍ਰਿਤ ਹੈਂ ॥੧੭੮॥
ਅਮ੍ਰਿਤੇਸ੍ਵਰ ਹੈਂ ॥
ਪਰਮੇਸ੍ਵਰ ਹੈਂ ॥
ਅਕ੍ਰਿਤਾ ਕ੍ਰਿਤ ਹੈਂ ॥
ਅਮ੍ਰਿਤਾ ਮ੍ਰਿਤ ਹੈਂ ॥੧੭੯॥
ਅਜਬਾ ਕ੍ਰਿਤ ਹੈਂ ॥
ਅਮ੍ਰਿਤਾ ਅਮ੍ਰਿਤ ਹੈਂ ॥
ਨਰ ਨਾਇਕ ਹੈਂ ॥
ਖਲ ਘਾਇਕ ਹੈਂ ॥੧੮੦॥
ਬਿਸ੍ਵੰਭਰ ਹੈਂ ॥
ਕਰੁਣਾਲਯ ਹੈਂ ॥
ਨ੍ਰਿਪ ਨਾਇਕ ਹੈਂ ॥
ਸਰਬ ਪਾਇਕ ਹੈਂ ॥੧੮੧॥
ਭਵ ਭੰਜਨ ਹੈਂ ॥
ਅਰਿ ਗੰਜਨ ਹੈਂ ॥
ਰਿਪੁ ਤਾਪਨ ਹੈਂ ॥
ਜਪੁ ਜਾਪਨ ਹੈਂ ॥੧੮੨॥
ਅਕਲੰ ਕ੍ਰਿਤ ਹੈਂ ॥
ਸਰਬਾ ਕ੍ਰਿਤ ਹੈਂ ॥
ਕਰਤਾ ਕਰ ਹੈਂ ॥
ਹਰਤਾ ਹਰਿ ਹੈਂ ॥੧੮੩॥
ਪਰਮਾਤਮ ਹੈਂ ॥
ਸਰਬਾਤਮ ਹੈਂ ॥
ਆਤਮ ਬਸ ਹੈਂ ॥
ਜਸ ਕੇ ਜਸ ਹੈਂ ॥੧੮੪॥`,
        transliteration: `haribolamanaa chhand | tv prasaad |
karunaalay hain |
ar ghaalay hain |
khal khanddan hain |
meh manddan hain |171|
jagatesvar hain |
paramesvar hain |
kal kaaran hain |
sarab ubaaran hain |172|
dhrit ke dhran hain |
jag ke kran hain |
man maaniy hain |
jag jaaniy hain |173|
saraban bhar hain |
saraban kar hain |
sarab paasiy hain |
sarab naasiy hain |174|
karunaakar hain |
bisvanbhar hain |
sarabesvar hain |
jagatesvar hain |175|
brahamanddas hain |
khal khanddas hain |
par te par hain |
karunaakar hain |176|
ajapaa jap hain |
athapaa thap hain |
akritaa krit hain |
amritaa mrit hain |177|
amritaa mrit hain |
karanaa krit hain |
akritaa krit hain |
dharanee dhrit hain |178|
amritesvar hain |
paramesvar hain |
akritaa krit hain |
amritaa mrit hain |179|
ajabaa krit hain |
amritaa amrit hain |
nar naaeik hain |
khal ghaaeik hain |180|
bisvanbhar hain |
karunaalay hain |
nrip naaeik hain |
sarab paaeik hain |181|
bhav bhanjan hain |
ar ganjan hain |
rip taapan hain |
jap jaapan hain |182|
akalan krit hain |
sarabaa krit hain |
karataa kar hain |
harataa har hain |183|
paramaatam hain |
sarabaatam hain |
aatam bas hain |
jas ke jas hain |184|`,
        meaning: `HARIBOLMANA STANZA, BY THE GRACE O Lord! Thou art the house of Mercy! Lord! Thou art The Destroyer of enemies! O Lord! Thou art the killer of evil persons! O Lord! Thou art the ornamentation of Earth! 171 O Lord! Thou art the Master of the universe! O Lord! Thou art the supreme Ishvara! O Lord! Thou art the cause of strife! O Lord! Thou art the Saviour of all! 172 O Lord! Thou art the support of the Earth! O Lord! Thou art the Creator of the Universe! O Lord! Thou art worshipped in the heart! O Lord! Thou art known throughout the world! 173 O Lord! Thou art the Sustainer of all! O Lord! Thou art the Creator of all! O Lord! Thou pervadest all! O Lord! Thou destroyest all! 174 O Lord! Thou art the Fountain of Mercy! O Lord! Thou art the nourisher of the universe! O Lord! Thou art master of all! Lord! Thou art the Master of Universe! 175 O Lord! Thou art the life of the Universe! O Lord! Thou art the destroyer of evil-doers! O Lord! Thou art beyond everything! O Lord! Thou art the Fountain of Mercy! 176 O Lord! Thou art the unmuttered mantra! O Lord! Thou canst be installed by none! O Lord! Thy Image canst not be fashioned! O Lord! Thou art Immortal! 177 O Lord! Thou art immortal! O Lord! Thou art the Merciful Entity! O Lord Thy Image canst not be fashioned! O Lord! Thou art the Support of the Earth! 178 O Lord! Thou art the Master of Nectar! O Lord! Thou art Supreme Ishvara! O Lord! Thy Image canst not be fashioned! O Lord! Thou art Immortal! 179 O Lord! Thou art of Wonderful Form! O Lord! Thou art Immortal! O Lord! Thou art the Master of men! O Lord! Thou art the destroyer of evil persons! 180 O Lord! Thou art the Nourisher of the world! O Lord! Thou art the House of Mercy! O Lord! Thou art the Lord of the kings! O Lord! Thou art the Protector of all! 181 O Lord! Thou art the destroyer of the cycle of transmigration! O Lord! Thou art the conqueror of enemies! O Lord! Thou causest suffering to the enemies! O Lord! Thou makest others to repeat Thy Name! 182 O Lord! Thou art free from blemishes! O Lord! All are Thy Forms! O Lord! Thou art the Creator of the creators! O Lord! Thou art the Destroyer of the destroyers! 183 O Lord! Thou art the Supreme Soul! Lord! Thou art the origin of all the souls! O Lord! Thou art controlled by Thyself! O Lord! Thou art not subject! 184`,
        meaning_pa: `ਹਰਿਬੋਲਮਨਾ ਛੰਦ: ਤੇਰੀ ਕ੍ਰਿਪਾ ਨਾਲ: (ਹੇ ਪ੍ਰਭੂ!) ਤੂੰ ਕ੍ਰਿਪਾ ('ਕਰੁਣਾ') ਦਾ ਘਰ ਹੈਂ, ਤੂੰ ਦੁਸ਼ਮਣਾਂ ਦਾ ਨਾਸ਼ ਕਰਨ ਵਾਲਾ ਹੈਂ, ਤੂੰ ਦੁਸ਼ਟਾਂ ਨੂੰ ਮਾਰਨ ਵਾਲਾ ਹੈਂ, ਤੂੰ ਧਰਤੀ ਦਾ ਸ਼ਿੰਗਾਰ ਹੈਂ ॥੧੭੧॥ (ਹੇ ਪ੍ਰਭੂ!) ਤੂੰ ਜਗਤ ਦਾ ਸੁਆਮੀ ਹੈਂ, ਤੂੰ ਸ੍ਰੇਸ਼ਠ ਈਸ਼ਵਰ ਹੈਂ, ਤੂੰ ਕਲ-ਕਲੇਸ਼ ਦਾ ਮੂਲ ਕਾਰਨ ਹੈਂ, ਤੂੰ ਸਭ ਨੂੰ ਬਚਾਉਣ ਵਾਲਾ ਹੈਂ ॥੧੭੨॥ (ਹੇ ਪ੍ਰਭੂ!) ਤੂੰ ਧਰਤੀ ਨੂੰ ਧਾਰਨ ਕਰਨ ਵਾਲਾ (ਸਹਾਰਾ) ਹੈਂ, ਤੂੰ ਜਗਤ ਦਾ ਕਾਰਨ ਸਰੂਪ ਹੈਂ, ਤੈਨੂੰ ਸਾਰੀ ਸ੍ਰਿਸ਼ਟੀ ਮਨ ਵਿਚ ਮੰਨਦੀ ਹੈ, ਤੂੰ ਜਗਤ ਦੁਆਰਾ ਜਾਣਨ ਯੋਗ ਹੈਂ ॥੧੭੩॥ (ਹੇ ਪ੍ਰਭੂ!) ਤੂੰ ਸਭ ਦੀ ਪਾਲਨਾ ਕਰਨ ਵਾਲਾ ਹੈਂ, ਤੂੰ ਸਭ ਦਾ ਕਰਤਾ ਹੈਂ, ਤੂੰ ਸਭ ਦੇ ਕੋਲ ਹੈਂ, ਤੂੰ ਸਭ ਦਾ ਸੰਘਾਰਕ ਵੀ ਹੈਂ ॥੧੭੪॥ (ਹੇ ਪ੍ਰਭੂ!) ਤੂੰ ਕ੍ਰਿਪਾ ('ਕਰੁਣਾ') ਕਰਨ ਵਾਲਾ ਹੈਂ, ਤੂੰ ਸੰਸਾਰ ਦਾ ਭਰਨ-ਪੋਸ਼ਣ ਕਰਨ ਵਾਲਾ ਹੈਂ, ਤੂੰ ਸਭ ਦਾ ਸੁਆਮੀ ਹੈਂ, ਤੂੰ ਜਗਤ ਦਾ ਈਸ਼ਵਰ (ਮਾਲਕ) ਹੈਂ ॥੧੭੫॥ (ਹੇ ਪ੍ਰਭੂ!) ਤੂੰ ਸਾਰੇ ਜਗਤ ਦਾ ਜੀਵਨ-ਰੂਪ ਹੈਂ, ਤੂੰ ਦੁਸ਼ਟਾਂ ਦਾ ਨਾਸ਼ ਕਰਨ ਵਾਲਾ ਹੈਂ, ਤੂੰ ਪਰੇ ਤੋਂ ਪਰੇ ਹੈਂ, ਤੂੰ ਕ੍ਰਿਪਾ ('ਕਰੁਣਾ') ਕਰਨ ਵਾਲਾ ਹੈਂ ॥੧੭੬॥ (ਹੇ ਪ੍ਰਭੂ!) ਤੂੰ ਜਪਾਂ ਤੋਂ ਪਰੇ ਹੈਂ (ਤੈਨੂੰ ਜਪਾਂ ਦੁਆਰਾ ਜਪਿਆ ਨਹੀਂ ਜਾ ਸਕਦਾ) ਤੂੰ ਸਥਾਪਨਾ ਤੋਂ ਪਰੇ ਹੈਂ (ਦੇਵ-ਮੂਰਤੀਆਂ ਵਾਂਗ ਸਥਾਪਿਤ ਨਹੀਂ ਕੀਤਾ ਜਾ ਸਕਦਾ) ਤੂੰ ਕੀਤੇ ਜਾਣ ਤੋਂ ਪਰੇ ਹੈਂ (ਤੈਨੂੰ ਬਣਾਇਆ-ਸਿਰਜਿਆ ਨਹੀਂ ਜਾ ਸਕਦਾ) ਤੂੰ ਮ੍ਰਿਤੂ ਤੋਂ ਪਰੇ ਹੈਂ (ਅਮ੍ਰਿਤ ਹੈਂ) ॥੧੭੭॥ (ਹੇ ਪ੍ਰਭੂ!) ਤੂੰ ਅਮਰ ਹੈਂ, ਤੂੰ ਕ੍ਰਿਪਾ ਸਰੂਪ ਹੈਂ, ਤੂੰ ਸਿਰਜਿਆ ਨਹੀਂ ਜਾ ਸਕਦਾ, ਤੂੰ ਧਰਤੀ ਨੂੰ ਧਾਰਨ ਕਰਨ ਵਾਲਾ ਹੈਂ ॥੧੭੮॥ (ਹੇ ਪ੍ਰਭੂ!) ਤੂੰ ਅਮਿਤ ਸੀਮਾ ਦਾ ਮਾਲਕ ਹੈਂ, ਤੂੰ ਸ੍ਰੇਸ਼ਠ ਸੁਆਮੀ ਹੈਂ, ਤੇਰਾ ਸਰੂਪ ਬਣਾਇਆ ਨਹੀਂ ਜਾ ਸਕਦਾ, ਤੂੰ ਅਮਰਾਂ ਦਾ ਅਮਰ ਹੈਂ ॥੧੭੯॥ (ਹੇ ਪ੍ਰਭੂ!) ਤੂੰ ਅਜੀਬ ਸਰੂਪ ਵਾਲਾ ਹੈਂ, ਤੂੰ ਅਮਰਾਂ ਦਾ ਵੀ ਅਮਰ ਹੈਂ; ਤੂੰ ਮਨੁੱਖਾਂ ਦਾ ਨਾਇਕ ਹੈਂ, ਤੂੰ ਦੁਸ਼ਟਾਂ ਦਾ ਸੰਘਾਰਕ ਹੈਂ ॥੧੮੦॥ (ਹੇ ਪ੍ਰਭੂ!) ਤੂੰ ਸ੍ਰਿਸ਼ਟੀ ਦਾ ਭਰਨ-ਪੋਸ਼ਣ ਕਰਨ ਵਾਲਾ ਹੈਂ, ਤੂੰ ਕ੍ਰਿਪਾ (ਕਰੁਣਾ) ਦਾ ਘਰ ਹੈਂ, ਤੂੰ ਰਾਜਿਆਂ ਦਾ ਸੁਆਮੀ ਹੈਂ, ਤੂੰ ਸਭ ਨੂੰ ਪਾਲਣ ਵਾਲਾ (ਰਖਿਅਕ) ਹੈਂ ॥੧੮੧॥ (ਹੇ ਪ੍ਰਭੂ!) ਤੂੰ ਜਨਮ-ਮਰਨ ਦੇ ਚੱਕਰ ਨੂੰ ਨਸ਼ਟ ਕਰਨ ਵਾਲਾ ਹੈਂ, ਤੂੰ ਵੈਰੀਆਂ ਨੂੰ ਮਾਰਨ ਵਾਲਾ ਹੈਂ, ਤੂੰ ਦੁਸ਼ਮਣਾਂ ਨੂੰ ਦੁਖ ਦੇਣ ਵਾਲਾ ਹੈ, ਤੂੰ ਖੁਦ ਆਪਣਾ ਜਪ ਜਪਾਉਣ ਵਾਲਾ ਵੀ ਹੈਂ ॥੧੮੨॥ (ਹੇ ਪ੍ਰਭੂ!) ਤੂੰ ਕਲੰਕ-ਰਹਿਤ ਹੈਂ, ਤੂੰ ਸਭ ਦਾ ਕਰਤਾ ਹੈ, ਤੂੰ ਕਰਤਿਆਂ ਦਾ ਵੀ ਕਰਤਾ ਹੈਂ, ਤੂੰ ਮਾਰਨ ਵਾਲਿਆਂ ਦਾ ਵੀ ਮਾਰਨ ਵਾਲਾ ਹੈਂ ॥੧੮੩॥ (ਹੇ ਪ੍ਰਭੂ!) ਤੂੰ ਪਾਰਬ੍ਰਹਮ ਹੈਂ, ਤੂੰ ਸਭ ਦੀ ਆਤਮਾ (ਜਾਂ ਸਭ ਵਿਚ ਵਿਆਪਤ) ਹੈਂ, ਤੂੰ ਆਪਣੇ ਹੀ ਵਸ ਵਿਚ ਹੈਂ, ਤੂੰ ਯਸ਼ਾਂ ਦਾ ਵੀ ਯਸ਼ ਹੈਂ ॥੧੮੪॥`
      },
      {
        number: 20,
        sanskrit: `ਭੁਜੰਗ ਪ੍ਰਯਾਤ ਛੰਦ ॥
ਨਮੋ ਸੂਰਜ ਸੂਰਜੇ ਨਮੋ ਚੰਦ੍ਰ ਚੰਦ੍ਰੇ ॥
ਨਮੋ ਰਾਜ ਰਾਜੇ ਨਮੋ ਇੰਦ੍ਰ ਇੰਦ੍ਰੇ ॥
ਨਮੋ ਅੰਧਕਾਰੇ ਨਮੋ ਤੇਜ ਤੇਜੇ ॥
ਨਮੋ ਬ੍ਰਿੰਦ ਬ੍ਰਿੰਦੇ ਨਮੋ ਬੀਜ ਬੀਜੇ ॥੧੮੫॥
ਨਮੋ ਰਾਜਸੰ ਤਾਮਸੰ ਸਾਂਤ ਰੂਪੇ ॥
ਨਮੋ ਪਰਮ ਤੱਤੰ ਅਤੱਤੰ ਸਰੂਪੇ ॥
ਨਮੋ ਜੋਗ ਜੋਗੇ ਨਮੋ ਗਿਆਨ ਗਿਆਨੇ ॥
ਨਮੋ ਮੰਤ੍ਰ ਮੰਤ੍ਰੇ ਨਮੋ ਧਿਆਨ ਧਿਆਨੇ ॥੧੮੬॥
ਨਮੋ ਜੁਧ ਜੁਧੇ ਨਮੋ ਗਿਆਨ ਗਿਆਨੇ ॥
ਨਮੋ ਭੋਜ ਭੋਜੇ ਨਮੋ ਪਾਨ ਪਾਨੇ ॥
ਨਮੋ ਕਲਹ ਕਰਤਾ ਨਮੋ ਸਾਂਤ ਰੂਪੇ ॥
ਨਮੋ ਇੰਦ੍ਰ ਇੰਦ੍ਰੇ ਅਨਾਦੰ ਬਿਭੂਤੇ ॥੧੮੭॥
ਕਲੰਕਾਰ ਰੂਪੇ ਅਲੰਕਾਰ ਅਲੰਕੇ ॥
ਨਮੋ ਆਸ ਆਸੇ ਨਮੋ ਬਾਂਕ ਬੰਕੇ ॥
ਅਭੰਗੀ ਸਰੂਪੇ ਅਨੰਗੀ ਅਨਾਮੇ ॥
ਤ੍ਰਿਭੰਗੀ ਤ੍ਰਿਕਾਲੇ ਅਨੰਗੀ ਅਕਾਮੇ ॥੧੮੮॥`,
        transliteration: `bhujang prayaat chhand |
namo sooraj sooraje namo chandr chandre |
namo raaj raaje namo indr indre |
namo andhakaare namo tej teje |
namo brind brinde namo beej beeje |185|
namo raajasan taamasan saant roope |
namo param tatan atatan saroope |
namo jog joge namo giaan giaane |
namo mantr mantre namo dhiaan dhiaane |186|
namo judh judhe namo giaan giaane |
namo bhoj bhoje namo paan paane |
namo kalah karataa namo saant roope |
namo indr indre anaadan bibhoote |187|
kalankaar roope alankaar alanke |
namo aas aase namo baank banke |
abhangee saroope anangee anaame |
tribhangee trikaale anangee akaame |188|`,
        meaning: `BHUJANG PRAYAAT STANZA Salutation to Thee O Sun of suns! Salutation to Thee O Moon of moons! Salutation to Thee O King of kings! Salutation to thee O Indra of Indras! Salutation to Thee O Creator of pitch darkness! Salutation to Thee O Light of lights.! Salutation to Thee O Greatest of the great (multitudes) Salutation to Three O Subtlest of the subtle ! 185 Salutation to Thee O embodiment of peace! Salutation to Thee O Entity bearing three modes! Salutation to Thee O Supreme Essence and Elementless Entity! Salutation to Thee O Fountain of all Yogas! Salutation to Thee O Fountain of all knowledge! Salutation to Thee O Supreme Mantra! Salutation to Thee O highest meditation 186. Salutation to Thee O Conqueror of wars! Salutation to Thee O Fountain of all knowledge! Salutation to Thee O Essence of Food ! Salutation to Thee O Essence of Warter! Salutation to Thee O Originator of Food! Salutation to Thee O Embodiment of Peace! Salutation to Thee O Indra of Indras! Salutation to Thee O Beginningless Effulgence! 187. Salutation to Thee O Entity inimical to blemishes! Salutation to Thee O Ornamentation of the ornaments Salutation to Thee O Fulfiller of hopes! Salutation to Thee O Most Beautiful! Salutation to Thee O Eternal Entity, Limbless and Nameless! Salutation to Thee O Destroyer of three worlds in three tenses! Salutation to O Limbless and Desireless Lord! 188.`,
        meaning_pa: `ਭੁਜੰਗ ਪ੍ਰਯਾਤ ਛੰਦ: ਹੇ ਸੂਰਜਾਂ ਦੇ ਸੂਰਜ! (ਤੈਨੂੰ) ਨਮਸਕਾਰ ਹੈ; ਹੇ ਚੰਦ੍ਰਮਿਆਂ ਦੇ ਚੰਦ੍ਰਮਾ! (ਤੈਨੂੰ) ਨਮਸਕਾਰ ਹੈ; ਹੇ ਰਾਜਿਆਂ ਦੇ ਰਾਜੇ! (ਤੈਨੂੰ) ਨਮਸਕਾਰ ਹੈ; ਹੇ ਇੰਦਰਾਂ ਦੇ ਇੰਦਰ! (ਤੈਨੂੰ) ਨਮਸਕਾਰ ਹੈ; ਹੇ ਅੰਧਕਾਰ ਸਰੂਪ! (ਤੈਨੂੰ) ਨਮਸਕਾਰ ਹੈ; ਹੇ ਤੇਜਾਂ ਦੇ ਤੇਜ! (ਤੈਨੂੰ) ਨਮਸਕਾਰ ਹੈ; ਹੇ ਸਮੂਹਾਂ ਦੇ ਸਮੂਹ! (ਤੈਨੂੰ) ਨਮਸਕਾਰ ਹੈ; ਹੇ (ਸੂਖਮ) ਬੀਜਾਂ ਦੇ ਬੀਜ! (ਤੈਨੂੰ) ਨਮਸਕਾਰ ਹੈ ॥੧੮੫॥ ਹੇ ਰਜੋ, ਤਮੋ ਅਤੇ ਸਤੋ ਰੂਪ! (ਤੈਨੂੰ) ਨਮਸਕਾਰ ਹੈ; ਹੇ ਪਰਮ ਤੱਤ੍ਵ ਅਤੇ ਪੰਜ ਤੱਤ੍ਵਾਂ ਤੋਂ ਰਹਿਤ ਸਰੂਪ ਵਾਲੇ! (ਤੈਨੂੰ) ਨਮਸਕਾਰ ਹੈ; ਹੇ ਜੋਗਾਂ ਦੇ ਵੀ ਜੋਗ! (ਤੈਨੂੰ) ਨਮਸਕਾਰ ਹੈ; ਹੇ ਗਿਆਨਾਂ ਦੇ ਵੀ ਗਿਆਨ! (ਤੈਨੂੰ) ਨਮਸਕਾਰ ਹੈ, ਹੇ ਮੰਤ੍ਰਾਂ ਦੇ ਵੀ ਮੰਤ੍ਰ! (ਤੈਨੂੰ) ਨਮਸਕਾਰ ਹੈ; ਹੇ ਧਿਆਨਾਂ ਦੇ ਵੀ ਧਿਆਨ! (ਤੈਨੂੰ) ਨਮਸਕਾਰ ਹੈ ॥੧੮੬॥ ਹੇ ਯੁੱਧਾਂ ਦੇ ਯੁੱਧ! (ਤੈਨੂੰ) ਨਮਸਕਾਰ ਹੈ; ਹੇ ਗਿਆਨਾਂ ਦੇ ਵੀ ਗਿਆਨ! (ਤੈਨੂੰ) ਨਮਸਕਾਰ ਹੈ; ਹੇ ਭੋਜਾਂ ਦੇ ਵੀ ਭੋਜ! (ਤੈਨੂੰ) ਨਮਸਕਾਰ ਹੈ; ਤੇ ਪੇਯਾਂ (ਪੀਣਯੋਗ ਪਦਾਰਥ) ਦੇ ਪੇਯ! (ਤੈਨੂੰ) ਨਮਸਕਾਰ ਹੈ; ਹੇ ਕਲਹ ਦੇ ਕਾਰਨ ਸਰੂਪ! (ਤੈਨੂੰ) ਨਮਸਕਾਰ ਹੈ; ਹੇ ਸ਼ਾਂਤੀ-ਸਰੂਪ! (ਤੈਨੂੰ) ਨਮਸਕਾਰ ਹੈ; ਹੇ ਇੰਦਰਾਂ ਦੇ ਵੀ ਇੰਦਰ, (ਤੈਨੂੰ) ਨਮਸਕਾਰ ਹੈ; ਹੇ ਆਦਿ-ਰਹਿਤ ਸੰਪੱਤੀ ਵਾਲੇ! (ਤੈਨੂੰ ਨਮਸਕਾਰ ਹੈ) ॥੧੮੭॥ ਹੇ ਦੋਸ਼ਾਂ ਤੋਂ ਮੁਕਤ ਰੂਪ ਵਾਲੇ! (ਤੈਨੂੰ ਨਮਸਕਾਰ ਹੈ) ਹੇ ਸ਼ਿੰਗਾਰਾਂ ਦੇ ਵੀ ਸ਼ਿੰਗਾਰ! (ਤੈਨੂੰ ਨਮਸਕਾਰ ਹੈ); ਹੇ ਮੁਖਾਂ ਦੇ ਵੀ ਮੁਖ (ਜਾਂ ਆਸ਼ਾਵਾਂ ਦੇ ਵੀ ਆਸ਼ਯ); (ਤੈਨੂੰ) ਨਮਸਕਾਰ ਹੈ; ਹੇ ਬਾਣੀ ('ਬਾਕ') ਦੇ ਵੀ ਸ਼ਿੰਗਾਰ! (ਤੈਨੂੰ) ਨਮਸਕਾਰ ਹੈ। ਹੇ ਨਾਸ਼-ਰਹਿਤ ਰੂਪ ਵਾਲੇ! ਹੇ ਨਿਰਾਕਾਰ ਅਤੇ ਨਾਮ-ਰਹਿਤ ਰੂਪ ਵਾਲੇ! (ਤੈਨੂੰ ਨਮਸਕਾਰ ਹੈ); ਹੇ ਤਿੰਨਾਂ ਲੋਕਾਂ ਨੂੰ ਤਿੰਨਾਂ ਕਾਲਾਂ ਵਿਚ ਨਸ਼ਟ ਕਰਨ ਵਾਲੇ! ਹੇ ਦੇਹ-ਰਹਿਤ! ਹੇ ਕਾਮਨਾਵਾਂ ਤੋਂ ਮੁਕਤ! (ਤੈਨੂੰ ਨਮਸਕਾਰ ਹੈ) ॥੧੮੮॥`
      },
      {
        number: 21,
        sanskrit: `ਏਕ ਅਛਰੀ ਛੰਦ ॥
ਅਜੈ ॥
ਅਲੈ ॥
ਅਭੈ ॥
ਅਬੈ ॥੧੮੯॥
ਅਭੂ ॥
ਅਜੂ ॥
ਅਨਾਸ ॥
ਅਕਾਸ ॥੧੯੦॥
ਅਗੰਜ ॥
ਅਭੰਜ ॥
ਅਲੱਖ ॥
ਅਭੱਖ ॥੧੯੧॥
ਅਕਾਲ ॥
ਦਿਆਲ ॥
ਅਲੇਖ ॥
ਅਭੇਖ ॥੧੯੨॥
ਅਨਾਮ ॥
ਅਕਾਮ ॥
ਅਗਾਹ ॥
ਅਢਾਹ ॥੧੯੩॥
ਅਨਾਥੇ ॥
ਪ੍ਰਮਾਥੇ ॥
ਅਜੋਨੀ ॥
ਅਮੋਨੀ ॥੧੯੪॥
ਨ ਰਾਗੇ ॥
ਨ ਰੰਗੇ ॥
ਨ ਰੂਪੇ ॥
ਨ ਰੇਖੇ ॥੧੯੫॥
ਅਕਰਮੰ ॥
ਅਭਰਮੰ ॥
ਅਗੰਜੇ ॥
ਅਲੇਖੇ ॥੧੯੬॥`,
        transliteration: `ek achharee chhand |
ajai |
alai |
abhai |
abai |189|
abhoo |
ajoo |
anaas |
akaas |190|
aganj |
abhanj |
alakh |
abhakh |191|
akaal |
diaal |
alekh |
abhekh |192|
anaam |
akaam |
agaah |
adtaah |193|
anaathe |
pramaathe |
ajonee |
amonee |194|
n raage |
n range |
n roope |
n rekhe |195|
akaraman |
abharaman |
aganje |
alekhe |196|`,
        meaning: `EK ACHHARI STANZA O Unconquerable Lord ! O Indestructible Lord ! O Fearless Lord ! O Indestructible Lord !189 O Unborn Lord ! O Perpetual Lord ! O Indestructible Lord ! O All-Pervasive Lord ! 190 Eternal Lord ! O Indivisible Lord ! O Unknowable Lord ! O Uninflammable Lord ! 191 O Non-Temporal Lord ! O Merciful Lord ! O Accountless Lord ! O Guiseless Lord ! 192 O Nameless Lord ! O Desireless Lord ! O Unfathomable Lord ! O Unfaltering Lord ! 193 O Masterless Lord ! O Greatest-Glorious Lord ! O Birthless Lord ! O Silenceless Lord ! 194 O Unattached Lord  ! O Colorless Lord  ! O Formless Lord  ! O Lineless Lord  ! 195 O Actionless Lord ! O Illusionless Lord ! O Indestructible Lord ! O Accountless Lord ! 196`,
        meaning_pa: `ਏਕ ਅਛਰੀ ਛੰਦ: (ਹੇ ਪ੍ਰਭੂ! ਤੂੰ) ਅਜਿਤ, ਅਵਿਨਾਸ਼ੀ, ਨਿਰਭੈ ਅਤੇ ਕਾਲ ਦੇ ਪ੍ਰਭਾਵ ਤੋਂ ਪਰੇ ਹੈਂ ॥੧੮੯॥ (ਹੇ ਪ੍ਰਭੂ! ਤੂੰ) ਅਜਨਮਾ, ਅਜੂਨੀ, ਨਾਸ਼-ਰਹਿਤ, ਸੋਗ ('ਕਾਸ') ਰਹਿਤ ਹੈਂ ॥੧੯੦॥ (ਹੇ ਪ੍ਰਭੂ! ਤੂੰ) ਨਾ ਨਸ਼ਟ ਹੋਣ ਵਾਲਾ, ਨਾ ਟੁੱਟਣ ਵਾਲਾ, ਨਾ ਜਾਣਿਆ ਜਾ ਸਕਣ ਵਾਲਾ ਅਤੇ ਖਾਣ ਦੀ ਲੋੜ ਤੋਂ ਮੁਕਤ ਹੈਂ ॥੧੯੧॥ (ਹੇ ਪ੍ਰਭੂ! ਤੂੰ) ਕਾਲ-ਰਹਿਤ, ਦਿਆਲੂ, ਲੇਖੇ ਤੋਂ ਰਹਿਤ ਅਤੇ ਭੇਖ ਤੋਂ ਰਹਿਤ ਹੈਂ ॥੧੯੨॥ (ਹੇ ਪ੍ਰਭੂ! ਤੂੰ) ਨਾਮ-ਰਹਿਤ, ਕਾਮਨਾ-ਰਹਿਤ, ਥਾਹ-ਰਹਿਤ ਅਤੇ ਅਪਰ ਅਪਾਰ ਹੈਂ ॥੧੯੩॥ (ਹੇ ਪ੍ਰਭੂ! ਤੂੰ) ਸੁਆਮੀ-ਰਹਿਤ, ਨਾਸ਼ਕ-ਰਹਿਤ, ਜੂਨ-ਰਹਿਤ ਅਤੇ ਮੋਨ-ਰਹਿਤ ਹੈਂ ॥੧੯੪॥ (ਹੇ ਪ੍ਰਭੂ! ਤੂੰ) ਮੋਹ-ਰਹਿਤ, ਰੰਗ- ਰੂਪ- ਰੇਖ ਤੋਂ ਪਰੇ ਹੈਂ ॥੧੯੫॥ (ਹੇ ਪ੍ਰਭੂ! ਤੂੰ) ਕਰਮਾਂ ਅਤੇ ਭਰਮਾਂ ਤੋਂ ਰਹਿਤ ਹੈਂ, ਨਾਸ਼ ਅਤੇ ਲੇਖੇ ਤੋਂ ਪਰੇ ਹੈਂ ॥੧੯੬॥`
      },
      {
        number: 22,
        sanskrit: `ਭੁਜੰਗ ਪ੍ਰਯਾਤ ਛੰਦ ॥
ਨਮਸਤੁਲ ਪ੍ਰਣਾਮੇ ਸਮਸਤੁਲ ਪ੍ਰਣਾਸੇ ॥
ਅਗੰਜੁਲ ਅਨਾਮੇ ਸਮਸਤੁਲ ਨਿਵਾਸੇ ॥
ਨ੍ਰਿਕਾਮੰ ਬਿਭੂਤੇ ਸਮਸਤੁਲ ਸਰੂਪੇ ॥
ਕੁਕਰਮੰ ਪ੍ਰਣਾਸੀ ਸੁਧਰਮੰ ਬਿਭੂਤੇ ॥੧੯੭॥
ਸਦਾ ਸੱਚਿਦਾਨੰਦ ਸੱਤ੍ਰੰ ਪ੍ਰਣਾਸੀ ॥
ਕਰੀਮੁਲ ਕੁਨਿੰਦਾ ਸਮਸਤੁਲ ਨਿਵਾਸੀ ॥
ਅਜਾਇਬ ਬਿਭੂਤੇ ਗਜਾਇਬ ਗਨੀਮੇ ॥
ਹਰੀਅੰ ਕਰੀਅੰ ਕਰੀਮੁਲ ਰਹੀਮੇ ॥੧੯੮॥
ਚੱਤ੍ਰ ਚੱਕ੍ਰ ਵਰਤੀ ਚੱਤ੍ਰ ਚੱਕ੍ਰ ਭੁਗਤੇ ॥
ਸੁਯੰਭਵ ਸੁਭੰ ਸਰਬ ਦਾ ਸਰਬ ਜੁਗਤੇ ॥
ਦੁਕਾਲੰ ਪ੍ਰਣਾਸੀ ਦਿਆਲੰ ਸਰੂਪੇ ॥
ਸਦਾ ਅੰਗ ਸੰਗੇ ਅਭੰਗੰ ਬਿਭੂਤੇ ॥੧੯੯॥`,
        transliteration: `bhujang prayaat chhand |
namasatul pranaame samasatul pranaase |
aganjul anaame samasatul nivaase |
nrikaaman bibhoote samasatul saroope |
kukaraman pranaasee sudharaman bibhoote |197|
sadaa sachidaanand satran pranaasee |
kareemul kunindaa samasatul nivaasee |
ajaaeib bibhoote gajaaeib ganeeme |
hareean kareean kareemul raheeme |198|
chatr chakr varatee chatr chakr bhugate |
suyanbhav subhan sarab daa sarab jugate |
dukaalan pranaasee diaalan saroope |
sadaa ang sange abhangan bibhoote |199|`,
        meaning: `BHUJANG PRAYAAT STANZA Salutation to Thee O Most Venerated and Destroyer of all Lord! Salutation to Thee O Indestructible, Nameless and All-Pervading Lord! Salutation to Thee O Desireless, Glorious and All-Pervading Lord! Salutation to Thee O Destroyer of Evil and Illuminator of Supreme Piety Lord! 197. Salutation to Thee O Perpetual Embodiment of Truth, Consciousness and Bliss and Destroyer of enemies Lord! Salutation to Thee O Gracious Creator and All-Pervading Lord! Salutation to Thee O Wonderful, Glorious and Calamity for enemies Lord! Salutation to Thee O Destroyer, Creator, Gracious and Merciful Lord! 198. Salutation to Thee O Pervader and Enjoyer in all the four directions Lord! Salutation to Thee O Self-Existent, Most Beautiful and United with all Lord! Salutation to Thee O Destroyer of hard times and Embodiment of Mercy Lord! Salutation to thee O Ever present with all, Indestructible and Glorious Lord! 199.`,
        meaning_pa: `ਭੁਜੰਗ ਪ੍ਰਯਾਤ ਛੰਦ: ਸਭਨਾਂ ਦੁਆਰਾ ਨਮਸਕਾਰੇ ਜਾਣ ਵਾਲੇ (ਉਸ ਪ੍ਰਭੂ ਨੂੰ) ਮੇਰਾ ਪ੍ਰਨਾਮ ਹੈ, ਜੋ ਸਭ ਦਾ ਸੰਘਾਰਕ ਹੈ, ਨਾਸ਼ ਤੋਂ ਪਰੇ ਹੈ, ਨਾਮ ਤੋਂ ਰਹਿਤ ਹੈ ਅਤੇ ਸਭ ਵਿਚ ਵਸਦਾ ਹੈ। ਕਾਮਨਾਵਾਂ ਤੋਂ ਰਹਿਤ ਸੰਪੱਤੀ ਵਾਲੇ ਅਤੇ ਸਾਰਿਆਂ ਦੇ ਸਰੂਪ ਵਾਲੇ (ਪ੍ਰਭੂ ਨੂੰ ਮੇਰਾ ਪ੍ਰਨਾਮ ਹੈ)। ਉਹ ਕੁਕਰਮਾਂ ਨੂੰ ਨਸ਼ਟ ਕਰਨ ਵਾਲਾ ਅਤੇ ਸ਼ੁਭ ਧਰਮ ਨੂੰ ਸੁਸਜਿਤ ਕਰਨ ਵਾਲਾ ਹੈ ॥੧੯੭॥ (ਹੇ ਪ੍ਰਭੂ! ਤੂੰ) ਸਦਾ ਚੇਤਨ ਅਤੇ ਆਨੰਦ-ਸਰੂਪ ਹੈਂ ਅਤੇ ਵੈਰੀਆਂ ਨੂੰ ਨਸ਼ਟ ਕਰਨ ਵਾਲਾ ਹੈਂ। (ਤੂੰ) ਮਿਹਰ ਕਰਨ ਵਾਲਾ, ਕਰਨਹਾਰ ਅਤੇ ਸਭ ਵਿਚ ਨਿਵਾਸ ਕਰਨ ਵਾਲਾ ਹੈਂ। (ਤੂੰ) ਅਦਭੁਤ ਸੰਪੱਤੀ ਵਾਲਾ, ਦੁਸ਼ਮਣਾਂ ਉਤੇ ਕਹਿਰ ਢਾਉਣ ਵਾਲਾ, ਨਾਸ਼ ਕਰਨ ਵਾਲਾ, ਸਿਰਜਨ ਵਾਲਾ, ਕ੍ਰਿਪਾ ਕਰਨ ਵਾਲਾ ਅਤੇ ਦਇਆ ਕਰਨ ਵਾਲਾ ਹੈਂ ॥੧੯੮॥ ਚੌਹਾਂ ਚੱਕਾਂ ਵਿਚ ਵਿਚਰਨ ਵਾਲਾ, ਚੌਹਾਂ ਚੱਕਾਂ ਨੂੰ ਭੋਗਣ ਵਾਲਾ, ਆਪਣੇ ਆਪ ਸ਼ੋਭਾਇਮਾਨ ਹੋਣ ਵਾਲਾ, ਸਦਾ ਹੀ ਸਭ ਨਾਲ ਸੰਯੁਕਤ ਰਹਿਣ ਵਾਲਾ ਹੈਂ; ਬੁਰੇ ਸਮੇਂ ਨੂੰ ਨਸ਼ਟ ਕਰਨ ਵਾਲਾ ਅਤੇ ਦਿਆਲੂ ਸਰੂਪ ਵਾਲਾ ਹੈਂ; (ਤੂੰ) ਸਦਾ ਅੰਗ-ਸੰਗ ਰਹਿੰਦਾ ਹੈਂ ਅਤੇ ਨਾ ਨਸ਼ਟ ਹੋਣ ਵਾਲੀ ਸੰਪੱਤੀ ਬਖ਼ਸ਼ਦਾ ਹੈਂ ॥੧੯੯॥`
      }
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
      {
        number: 1,
        sanskrit: `ਹਰਿ ਜੁਗੁ ਜੁਗੁ ਭਗਤ ਉਪਾਇਆ ਪੈਜ ਰਖਦਾ ਆਇਆ ਰਾਮ ਰਾਜੇ ॥
ਹਰਣਾਖਸੁ ਦੁਸਟੁ ਹਰਿ ਮਾਰਿਆ ਪ੍ਰਹਲਾਦੁ ਤਰਾਇਆ ॥
ਅਹੰਕਾਰੀਆ ਨਿੰਦਕਾ ਪਿਠਿ ਦੇਇ ਨਾਮਦੇਉ ਮੁਖਿ ਲਾਇਆ ॥
ਜਨ ਨਾਨਕ ਐਸਾ ਹਰਿ ਸੇਵਿਆ ਅੰਤਿ ਲਏ ਛਡਾਇਆ ॥੪॥੧੩॥੨੦॥`,
        transliteration: `har jug jug bhagat upaaeaa paij rakhadaa aaeaa raam raaje |
haranaakhas dusatt har maariaa prahalaad taraaeaa |
ahankaareea nindakaa pitth dee naamadeo mukh laaeaa |
jan naanak aisaa har seviaa ant le chhaddaaeaa |4|13|20|`,
        meaning: `In each and every age, He creates His devotees and preserves their honor, O Lord King. The Lord killed the wicked Harnaakhash, and saved Prahlaad. He turned his back on the egotists and slanderers, and showed His Face to Naam Dayv. Servant Nanak has so served the Lord, that He will deliver him in the end. ||4||13||20||`,
        meaning_pa: `ਪਰਮਾਤਮਾ ਹਰੇਕ ਜੁਗ ਵਿਚ ਹੀ ਭਗਤ ਪੈਦਾ ਕਰਦਾ ਹੈ, ਤੇ, (ਭੀੜਾ ਸਮੇ) ਉਹਨਾਂ ਦੀ ਇੱਜ਼ਤ ਰੱਖਦਾ ਆ ਰਿਹਾ ਹੈ। (ਜਿਵੇਂ ਕਿ, ਪ੍ਰਹਿਲਾਦ ਦੇ ਜ਼ਾਲਮ ਪਿਤਾ) ਚੰਦਰੇ ਹਰਣਾਖੁਸ਼ ਨੂੰ ਪਰਮਾਤਮਾ ਨੇ (ਆਖ਼ਰ ਜਾਨੋਂ) ਮਾਰ ਦਿੱਤਾ (ਤੇ ਆਪਣੇ ਭਗਤ) ਪ੍ਰਹਿਲਾਦ ਨੂੰ (ਪਿਉ ਦੇ ਦਿੱਤੇ ਕਸ਼ਟਾਂ ਤੋਂ) ਸਹੀ ਸਲਾਮਤਿ ਬਚਾ ਲਿਆ। (ਜਿਵੇਂ ਕਿ, ਮੰਦਰ ਵਿਚੋਂ ਧੱਕੇ ਦੇਣ ਵਾਲੇ) ਨਿੰਦਕਾਂ ਤੇ (ਜਾਤਿ-) ਅਭਿਮਾਨੀਆਂ ਨੂੰ (ਪਰਮਾਤਮਾ ਨੇ) ਪਿੱਠ ਦੇ ਕੇ (ਆਪਣੇ ਭਗਤ) ਨਾਮਦੇਵ ਨੂੰ ਦਰਸ਼ਨ ਦਿੱਤਾ। ਹੇ ਦਾਸ ਨਾਨਕ! ਜੇਹੜਾ ਭੀ ਮਨੁੱਖ ਇਹੋ ਜਿਹੀ ਸਮਰਥਾ ਵਾਲੇ ਪਰਮਾਤਮਾ ਦੀ ਸੇਵਾ-ਭਗਤੀ ਕਰਦਾ ਹੈ ਪਰਮਾਤਮਾ ਉਸ ਨੂੰ (ਦੋਖੀਆਂ ਵਲੋਂ ਦਿੱਤੇ ਜਾ ਰਹੇ ਸਭ ਕਸ਼ਟਾਂ ਤੋਂ) ਆਖ਼ਰ ਬਚਾ ਲੈਂਦਾ ਹੈ ॥੪॥੧੩॥੨੦॥`
      },
      {
        number: 2,
        sanskrit: `ਸਲੋਕੁ ਮਃ ੧ ॥
ਦੁਖੁ ਦਾਰੂ ਸੁਖੁ ਰੋਗੁ ਭਇਆ ਜਾ ਸੁਖੁ ਤਾਮਿ ਨ ਹੋਈ ॥
ਤੂੰ ਕਰਤਾ ਕਰਣਾ ਮੈ ਨਾਹੀ ਜਾ ਹਉ ਕਰੀ ਨ ਹੋਈ ॥੧॥
ਬਲਿਹਾਰੀ ਕੁਦਰਤਿ ਵਸਿਆ ॥
ਤੇਰਾ ਅੰਤੁ ਨ ਜਾਈ ਲਖਿਆ ॥੧॥ ਰਹਾਉ ॥
ਜਾਤਿ ਮਹਿ ਜੋਤਿ ਜੋਤਿ ਮਹਿ ਜਾਤਾ ਅਕਲ ਕਲਾ ਭਰਪੂਰਿ ਰਹਿਆ ॥
ਤੂੰ ਸਚਾ ਸਾਹਿਬੁ ਸਿਫਤਿ ਸੁਆਲਿੑਉ ਜਿਨਿ ਕੀਤੀ ਸੋ ਪਾਰਿ ਪਇਆ ॥
ਕਹੁ ਨਾਨਕ ਕਰਤੇ ਕੀਆ ਬਾਤਾ ਜੋ ਕਿਛੁ ਕਰਣਾ ਸੁ ਕਰਿ ਰਹਿਆ ॥੨॥`,
        transliteration: `salok mahalaa 1 |
dukh daaroo sukh rog bheaa jaa sukh taam na hoee |
toon karataa karanaa mai naahee jaa hau karee na hoee |1|
balihaaree kudarat vasiaa |
teraa ant na jaaee lakhiaa |1| rahaau |
jaat meh jot jot meh jaataa akal kalaa bharapoor rahiaa |
toon sachaa saahib sifat suaalau jin keetee so paar peaa |
kahu naanak karate keea baataa jo kichh karanaa su kar rahiaa |2|`,
        meaning: `Salok, First Mehl: Suffering is the medicine, and pleasure the disease, because where there is pleasure, there is no desire for God. You are the Creator Lord; I can do nothing. Even if I try, nothing happens. ||1|| I am a sacrifice to Your almighty creative power which is pervading everywhere. Your limits cannot be known. ||1||Pause|| Your Light is in Your creatures, and Your creatures are in Your Light; Your almighty power is pervading everywhere. You are the True Lord and Master; Your Praise is so beautiful. One who sings it, is carried across. Nanak speaks the stories of the Creator Lord; whatever He is to do, He does. ||2||`,
        meaning_pa: `(ਹੇ ਪ੍ਰਭੂ! ਤੇਰੀ ਅਜਬ ਕੁਦਰਤ ਹੈ ਕਿ) ਬਿਪਤਾ (ਜੀਵਾਂ ਦੇ ਰੋਗਾਂ ਦਾ) ਇਲਾਜ (ਬਣ ਜਾਂਦੀ) ਹੈ, ਅਤੇ ਸੁਖ (ਉਹਨਾਂ ਲਈ) ਦੁੱਖ ਦਾ (ਕਾਰਨ) ਹੋ ਜਾਂਦਾ ਹੈ। ਪਰ ਜੇ (ਅਸਲੀ ਆਤਮਕ) ਸੁਖ (ਜੀਵ ਨੂੰ) ਮਿਲ ਜਾਏ, ਤਾਂ (ਦੁੱਖ) ਨਹੀਂ ਰਹਿੰਦਾ। ਹੇ ਪ੍ਰਭੂ! ਤੂੰ ਕਰਨਹਾਰ ਕਰਤਾਰ ਹੈਂ (ਤੂੰ ਆਪ ਹੀ ਇਹਨਾਂ ਭੇਤਾਂ ਨੂੰ ਸਮਝਦਾ ਹੈਂ), ਮੇਰੀ ਸਮਰਥਾ ਨਹੀਂ ਹੈ (ਕਿ ਮੈਂ ਸਮਝ ਸਕਾਂ)। ਜੇ ਮੈਂ ਆਪਣੇ ਆਪ ਨੂੰ ਕੁਝ ਸਮਝ ਲਵਾਂ (ਭਾਵ, ਜੇ ਮੈਂ ਇਹ ਖ਼ਿਆਲ ਕਰਨ ਲੱਗ ਪਵਾਂ ਕਿ ਮੈਂ ਤੇਰੇ ਭੇਤ ਨੂੰ ਸਮਝ ਸਕਦਾ ਹਾਂ) ਤਾਂ ਇਹ ਗੱਲ ਫਬਦੀ ਨਹੀਂ ॥੧॥ ਹੇ ਕੁਦਰਤ ਵਿਚ ਵੱਸ ਰਹੇ ਕਰਤਾਰ! ਮੈਂ ਤੈਥੋਂ ਸਦਕੇ ਹਾਂ, ਤੇਰਾ ਅੰਤ ਪਾਇਆ ਨਹੀਂ ਜਾ ਸਕਦਾ ॥੧॥ ਰਹਾਉ ॥ ਸਾਰੀ ਸ੍ਰਿਸ਼ਟੀ ਵਿਚ ਤੇਰਾ ਹੀ ਨੂਰ ਵੱਸ ਰਿਹਾ ਹੈ, ਸਾਰੇ ਜੀਵਾਂ ਵਿਚ ਤੇਰਾ ਹੀ ਪ੍ਰਕਾਸ਼ ਹੈ, ਤੂੰ ਸਭ ਥਾਈਂ ਇਕ-ਰਸ ਵਿਆਪਕ ਹੈਂ। ਹੇ ਪ੍ਰਭੂ! ਤੂੰ ਸਦਾ-ਥਿਰ ਰਹਿਣ ਵਾਲਾ ਹੈਂ, ਤੇਰੀਆਂ ਸੋਹਣੀਆਂ ਵਡਿਆਈਆਂ ਹਨ। ਜਿਸ ਜਿਸ ਨੇ ਤੇਰੇ ਗੁਣ ਗਾਏ ਹਨ, ਉਹ ਸੰਸਾਰ-ਸਮੁੰਦਰ ਤੋਂ ਤਰ ਗਿਆ ਹੈ। ਹੇ ਨਾਨਕ! (ਤੂੰ ਭੀ) ਕਰਤਾਰ ਦੀ ਸਿਫ਼ਤਿ-ਸਾਲਾਹ ਕਰ, (ਤੇ ਆਖ ਕਿ) ਪ੍ਰਭੂ ਜੋ ਕੁਝ ਕਰਨਾ ਚੰਗਾ ਸਮਝਦਾ ਹੈ ਉਹ ਕਰ ਰਿਹਾ ਹੈ (ਭਾਵ, ਉਸ ਦੇ ਕੰਮਾਂ ਵਿਚ ਕਿਸੇ ਦਾ ਦਖ਼ਲ ਨਹੀਂ ਹੈ) ॥੨॥`
      },
      {
        number: 3,
        sanskrit: `ਸੋ ਦਰੁ ਰਾਗੁ ਆਸਾ ਮਹਲਾ ੧ ॥
ੴ ਸਤਿਗੁਰ ਪ੍ਰਸਾਦਿ ॥
ਸੋ ਦਰੁ ਤੇਰਾ ਕੇਹਾ ਸੋ ਘਰੁ ਕੇਹਾ ਜਿਤੁ ਬਹਿ ਸਰਬ ਸਮਾਲੇ ॥
ਵਾਜੇ ਤੇਰੇ ਨਾਦ ਅਨੇਕ ਅਸੰਖਾ ਕੇਤੇ ਤੇਰੇ ਵਾਵਣਹਾਰੇ ॥
ਕੇਤੇ ਤੇਰੇ ਰਾਗ ਪਰੀ ਸਿਉ ਕਹੀਅਹਿ ਕੇਤੇ ਤੇਰੇ ਗਾਵਣਹਾਰੇ ॥
ਗਾਵਨਿ ਤੁਧਨੋ ਪਵਣੁ ਪਾਣੀ ਬੈਸੰਤਰੁ ਗਾਵੈ ਰਾਜਾ ਧਰਮੁ ਦੁਆਰੇ ॥
ਗਾਵਨਿ ਤੁਧਨੋ ਚਿਤੁ ਗੁਪਤੁ ਲਿਖਿ ਜਾਣਨਿ ਲਿਖਿ ਲਿਖਿ ਧਰਮੁ ਬੀਚਾਰੇ ॥
ਗਾਵਨਿ ਤੁਧਨੋ ਈਸਰੁ ਬ੍ਰਹਮਾ ਦੇਵੀ ਸੋਹਨਿ ਤੇਰੇ ਸਦਾ ਸਵਾਰੇ ॥
ਗਾਵਨਿ ਤੁਧਨੋ ਇੰਦ੍ਰ ਇੰਦ੍ਰਾਸਣਿ ਬੈਠੇ ਦੇਵਤਿਆ ਦਰਿ ਨਾਲੇ ॥
ਗਾਵਨਿ ਤੁਧਨੋ ਸਿਧ ਸਮਾਧੀ ਅੰਦਰਿ ਗਾਵਨਿ ਤੁਧਨੋ ਸਾਧ ਬੀਚਾਰੇ ॥
ਗਾਵਨਿ ਤੁਧਨੋ ਜਤੀ ਸਤੀ ਸੰਤੋਖੀ ਗਾਵਨਿ ਤੁਧਨੋ ਵੀਰ ਕਰਾਰੇ ॥
ਗਾਵਨਿ ਤੁਧਨੋ ਪੰਡਿਤ ਪੜਨਿ ਰਖੀਸੁਰ ਜੁਗੁ ਜੁਗੁ ਵੇਦਾ ਨਾਲੇ ॥
ਗਾਵਨਿ ਤੁਧਨੋ ਮੋਹਣੀਆ ਮਨੁ ਮੋਹਨਿ ਸੁਰਗੁ ਮਛੁ ਪਇਆਲੇ ॥
ਗਾਵਨਿ ਤੁਧਨੋ ਰਤਨ ਉਪਾਏ ਤੇਰੇ ਅਠਸਠਿ ਤੀਰਥ ਨਾਲੇ ॥
ਗਾਵਨਿ ਤੁਧਨੋ ਜੋਧ ਮਹਾਬਲ ਸੂਰਾ ਗਾਵਨਿ ਤੁਧਨੋ ਖਾਣੀ ਚਾਰੇ ॥
ਗਾਵਨਿ ਤੁਧਨੋ ਖੰਡ ਮੰਡਲ ਬ੍ਰਹਮੰਡਾ ਕਰਿ ਕਰਿ ਰਖੇ ਤੇਰੇ ਧਾਰੇ ॥
ਸੇਈ ਤੁਧਨੋ ਗਾਵਨਿ ਜੋ ਤੁਧੁ ਭਾਵਨਿ ਰਤੇ ਤੇਰੇ ਭਗਤ ਰਸਾਲੇ ॥
ਹੋਰਿ ਕੇਤੇ ਤੁਧਨੋ ਗਾਵਨਿ ਸੇ ਮੈ ਚਿਤਿ ਨ ਆਵਨਿ ਨਾਨਕੁ ਕਿਆ ਬੀਚਾਰੇ ॥
ਸੋਈ ਸੋਈ ਸਦਾ ਸਚੁ ਸਾਹਿਬੁ ਸਾਚਾ ਸਾਚੀ ਨਾਈ ॥
ਹੈ ਭੀ ਹੋਸੀ ਜਾਇ ਨ ਜਾਸੀ ਰਚਨਾ ਜਿਨਿ ਰਚਾਈ ॥
ਰੰਗੀ ਰੰਗੀ ਭਾਤੀ ਕਰਿ ਕਰਿ ਜਿਨਸੀ ਮਾਇਆ ਜਿਨਿ ਉਪਾਈ ॥
ਕਰਿ ਕਰਿ ਦੇਖੈ ਕੀਤਾ ਆਪਣਾ ਜਿਉ ਤਿਸ ਦੀ ਵਡਿਆਈ ॥
ਜੋ ਤਿਸੁ ਭਾਵੈ ਸੋਈ ਕਰਸੀ ਫਿਰਿ ਹੁਕਮੁ ਨ ਕਰਣਾ ਜਾਈ ॥
ਸੋ ਪਾਤਿਸਾਹੁ ਸਾਹਾ ਪਤਿਸਾਹਿਬੁ ਨਾਨਕ ਰਹਣੁ ਰਜਾਈ ॥੧॥`,
        transliteration: `so dar raag aasaa mahalaa 1 |
ik oankaar satigur prasaad |
so dar teraa kehaa so ghar kehaa jit beh sarab samaale |
vaaje tere naad anek asankhaa kete tere vaavanahaare |
kete tere raag paree siau kaheeeh kete tere gaavanahaare |
gaavan tudhano pavan paanee baisantar gaavai raajaa dharam duaare |
gaavan tudhano chit gupat likh jaanan likh likh dharam beechaare |
gaavan tudhano eesar brahamaa devee sohan tere sadaa savaare |
gaavan tudhano indr indraasan baitthe devatiaa dar naale |
gaavan tudhano sidh samaadhee andar gaavan tudhano saadh beechaare |
gaavan tudhano jatee satee santokhee gaavan tudhano veer karaare |
gaavan tudhano panddit parran rakheesur jug jug vedaa naale |
gaavan tudhano mohaneea man mohan surag machh peaale |
gaavan tudhano ratan upaae tere atthasatth teerath naale |
gaavan tudhano jodh mahaabal sooraa gaavan tudhano khaanee chaare |
gaavan tudhano khandd manddal brahamanddaa kar kar rakhe tere dhaare |
seee tudhano gaavan jo tudh bhaavan rate tere bhagat rasaale |
hor kete tudhano gaavan se mai chit na aavan naanak kiaa beechaare |
soee soee sadaa sach saahib saachaa saachee naaee |
hai bhee hosee jaae na jaasee rachanaa jin rachaaee |
rangee rangee bhaatee kar kar jinasee maaeaa jin upaaee |
kar kar dekhai keetaa aapanaa jiau tis dee vaddiaaee |
jo tis bhaavai soee karasee fir hukam na karanaa jaaee |
so paatisaahu saahaa patisaahib naanak rehan rajaaee |1|`,
        meaning: `So Dar ~ That Door. Raag Aasaa, First Mehl: One Universal Creator God. By The Grace Of The True Guru: Where is That Door of Yours, and where is That Home, in which You sit and take care of all? The Sound-current of the Naad vibrates there for You, and countless musicians play all sorts of instruments there for You. There are so many Ragas and musical harmonies to You; so many minstrels sing hymns of You. Wind, water and fire sing of You. The Righteous Judge of Dharma sings at Your Door. Chitr and Gupt, the angels of the conscious and the subconscious who keep the record of actions, and the Righteous Judge of Dharma who reads this record, sing of You. Shiva, Brahma and the Goddess of Beauty, ever adorned by You, sing of You. Indra, seated on His Throne, sings of You, with the deities at Your Door. The Siddhas in Samaadhi sing of You; the Saadhus sing of You in contemplation. The celibates, the fanatics, and the peacefully accepting sing of You; the fearless warriors sing of You. The Pandits, the religious scholars who recite the Vedas, with the supreme sages of all the ages, sing of You. The Mohinis, the enchanting heavenly beauties who entice hearts in paradise, in this world, and in the underworld of the subconscious, sing of You. The celestial jewels created by You, and the sixty-eight sacred shrines of pilgrimage, sing of You. The brave and mighty warriors sing of You. The spiritual heroes and the four sources of creation sing of You. The worlds, solar systems and galaxies, created and arranged by Your Hand, sing of You. They alone sing of You, who are pleasing to Your Will. Your devotees are imbued with Your Sublime Essence. So many others sing of You, they do not come to mind. O Nanak, how can I think of them all? That True Lord is True, forever True, and True is His Name. He is, and shall always be. He shall not depart, even when this Universe which He has created departs. He created the world, with its various colors, species of beings, and the variety of Maya. Having created the creation, He watches over it Himself, by His Greatness. He does whatever He pleases. No one can issue any order to Him. He is the King, the King of kings, the Supreme Lord and Master of kings. Nanak remains subject to His Will. ||1||`,
        meaning_pa: `ਰਾਗ ਆਸਾ ਵਿੱਚ ਗੁਰੂ ਨਾਨਕ ਜੀ ਦੀ ਬਾਣੀ 'ਸੋ-ਦਰ'। ਅਕਾਲ ਪੁਰਖ ਇੱਕ ਹੈ ਅਤੇ ਸਤਿਗੁਰੂ ਦੀ ਕਿਰਪਾ ਨਾਲ ਮਿਲਦਾ ਹੈ। (ਹੇ ਪ੍ਰਭੂ!) ਤੇਰਾ ਉਹ ਘਰ ਅਤੇ (ਉਸ ਘਰ ਦਾ) ਉਹ ਦਰਵਾਜ਼ਾ ਬੜਾ ਹੀ ਅਸਚਰਜ ਹੋਵੇਗਾ, ਜਿੱਥੇ ਬੈਠ ਕੇ ਤੂੰ ਸਾਰੇ ਜੀਵਾਂ ਦੀ ਸੰਭਾਲ ਕਰ ਰਿਹਾ ਹੈਂ। (ਤੇਰੀ ਇਸ ਰਚੀ ਹੋਈ ਕੁਦਰਤ ਵਿਚ) ਅਨੇਕਾਂ ਤੇ ਅਣਗਿਣਤ ਵਾਜੇ ਤੇ ਰਾਗ ਹਨ; ਬੇਅੰਤ ਹੀ ਜੀਵ (ਉਹਨਾਂ ਵਾਜਿਆਂ ਨੂੰ) ਵਜਾਣ ਵਾਲੇ ਹਨ। ਰਾਗਣੀਆਂ ਸਮੇਤ ਬੇਅੰਤ ਹੀ ਰਾਗਾਂ ਦੇ ਨਾਮ ਲਏ ਜਾਂਦੇ ਹਨ। ਅਨੇਕਾਂ ਹੀ ਜੀਵ (ਇਹਨਾਂ ਰਾਗ-ਰਾਗਣੀਆਂ ਦੀ ਰਾਹੀਂ ਤੈਨੂੰ) ਗਾਣ ਵਾਲੇ ਹਨ (ਤੇਰੀ ਸਿਫ਼ਤਿ ਦੇ ਗੀਤ ਗਾ ਰਹੇ ਹਨ)। (ਹੇ ਪ੍ਰਭੂ!) ਹਵਾ ਪਾਣੀ ਅੱਗ (ਆਦਿਕ ਤੱਤ) ਤੇਰੇ ਗੁਣ ਗਾ ਰਹੇ ਹਨ (ਤੇਰੀ ਰਜ਼ਾ ਵਿਚ ਤੁਰ ਰਹੇ ਹਨ)। ਧਰਮ ਰਾਜ (ਤੇਰੇ) ਦਰ ਤੇ (ਖਲੋ ਕੇ ਤੇਰੀ ਸਿਫ਼ਤ-ਸਾਲਾਹ ਦੇ ਗੀਤ) ਗਾ ਰਿਹਾ ਹੈ। ਉਹ ਚਿੱਤਰ ਗੁਪਤ ਭੀ ਜੋ (ਜੀਵਾਂ ਦੇ ਚੰਗੇ ਮੰਦੇ ਕਰਮਾਂ ਦੇ ਲੇਖੇ) ਲਿਖਣੇ ਜਾਣਦੇ ਹਨ ਅਤੇ ਜਿਨ੍ਹਾਂ ਦੇ ਲਿਖੇ ਹੋਏ ਧਰਮ ਰਾਜ ਵਿਚਾਰਦਾ ਹੈ ਤੇਰੀ ਸਿਫ਼ਤ-ਸਾਲਾਹ ਦੇ ਗੀਤ ਗਾ ਰਹੇ ਹਨ। (ਹੇ ਪ੍ਰਭੂ!) ਅਨੇਕਾਂ ਦੇਵੀਆਂ ਸ਼ਿਵ ਅਤੇ ਬ੍ਰਹਮਾ (ਆਦਿਕ ਦੇਵਤੇ) ਜੋ ਤੇਰੇ ਸਵਾਰੇ ਹੋਏ ਹਨ ਸਦਾ (ਤੇਰੇ ਦਰ ਤੇ) ਸੋਭ ਰਹੇ ਹਨ ਤੈਨੂੰ ਗਾ ਰਹੇ ਹਨ (ਤੇਰੇ ਗੁਣ ਗਾ ਰਹੇ ਹਨ)। ਕਈ ਇੰਦਰ ਦੇਵਤੇ ਆਪਣੇ ਤਖ਼ਤ ਉੱਤੇ ਬੈਠੇ ਹੋਏ ਦੇਵਤਿਆਂ ਸਮੇਤ ਤੇਰੇ ਦਰ ਉੱਤੇ ਤੈਨੂੰ ਗਾ ਰਹੇ ਹਨ (ਤੇਰੀ ਸਿਫ਼ਤ-ਸਾਲਾਹ ਦੇ ਗੀਤ ਗਾ ਰਹੇ ਹਨ)। (ਹੇ ਪ੍ਰਭੂ!) ਸਿੱਧ ਲੋਕ ਸਮਾਧੀਆਂ ਲਾ ਕੇ ਤੈਨੂੰ ਗਾ ਰਹੇ ਹਨ। ਸਾਧ ਜਨ (ਤੇਰੇ ਗੁਣਾਂ ਦੀ) ਵਿਚਾਰ ਕਰ ਕੇ ਤੈਨੂੰ ਸਲਾਹ ਰਹੇ ਹਨ। ਜਤੀ, ਦਾਨੀ ਅਤੇ ਸੰਤੋਖੀ ਬੰਦੇ ਭੀ ਤੇਰੇ ਹੀ ਗੁਣ ਗਾ ਰਹੇ ਹਨ। ਬੇਅੰਤ ਤਕੜੇ ਸੂਰਮੇ ਤੇਰੀਆਂ ਹੀ ਵਡਿਆਈਆਂ ਕਰ ਰਹੇ ਹਨ। (ਹੇ ਪ੍ਰਭੂ!) ਪੰਡਿਤ ਅਤੇ ਮਹਾ ਰਿਖੀ ਜੋ (ਵੇਦਾਂ ਨੂੰ ਪੜ੍ਹਦੇ ਹਨ, ਵੇਦਾਂ ਸਣੇ ਤੇਰਾ ਹੀ ਜਸ ਕਰ ਰਹੇ ਹਨ। ਸੁੰਦਰ ਇਸਤ੍ਰੀਆਂ ਜੋ (ਆਪਣੀ ਸੁੰਦਰਤਾ ਨਾਲ ਮਨੁੱਖ ਦੇ) ਮਨ ਨੂੰ ਮੋਹ ਲੈਂਦੀਆਂ ਹਨ ਤੈਨੂੰ ਹੀ ਗਾ ਰਹੀਆਂ ਹਨ, (ਭਾਵ, ਤੇਰੀ ਸੁੰਦਰਤਾ ਦਾ ਪਰਕਾਸ਼ ਕਰ ਰਹੀਆਂ ਹਨ)। ਸੁਰਗ-ਲੋਕ, ਮਾਤ-ਲੋਕ ਅਤੇ ਪਤਾਲ-ਲੋਕ (ਭਾਵ, ਸੁਰਗ ਮਾਤ ਅਤੇ ਪਤਾਲ ਦੇ ਸਾਰੇ ਜੀਆ ਜੰਤ) ਤੇਰੀ ਹੀ ਵਡਿਆਈ ਕਰ ਰਹੇ ਹਨ। (ਹੇ ਪ੍ਰਭੂ!) ਤੇਰੇ ਪੈਦਾ ਕੀਤੇ ਹੋਏ ਰਤਨ ਅਠਾਹਠ ਤੀਰਥਾਂ ਸਮੇਤ ਤੈਨੂੰ ਹੀ ਗਾ ਰਹੇ ਹਨ। ਵੱਡੇ ਬਲ ਵਾਲੇ ਜੋਧੇ ਅਤੇ ਸੂਰਮੇ (ਤੇਰਾ ਦਿੱਤਾ ਬਲ ਵਿਖਾ ਕੇ) ਤੇਰੀ ਹੀ (ਤਾਕਤ ਦੀ) ਸਿਫ਼ਤਿ ਕਰ ਰਹੇ ਹਨ। ਚੌਹਾਂ ਹੀ ਖਾਣੀਆਂ ਦੇ ਜੀਅ ਜੰਤ ਤੈਨੂੰ ਗਾ ਰਹੇ ਹਨ। ਸਾਰੀ ਸ੍ਰਿਸ਼ਟੀ, ਸ੍ਰਿਸ਼ਟੀ ਦੇ ਸਾਰੇ ਖੰਡ ਤੇ ਮੰਡਲ, ਜੋ ਤੂੰ ਪੈਦਾ ਕਰ ਕੇ ਟਿਕਾ ਰੱਖੇ ਹਨ, ਤੈਨੂੰ ਹੀ ਗਾਉਂਦੇ ਹਨ। (ਹੇ ਪ੍ਰਭੂ!) ਅਸਲ ਵਿਚ ਉਹੀ ਬੰਦੇ ਤੇਰੀ ਸਿਫ਼ਤ-ਸਾਲਾਹ ਕਰਦੇ ਹਨ (ਭਾਵ, ਉਹਨਾਂ ਦੀ ਕੀਤੀ ਸਿਫ਼ਤ-ਸਾਲਾਹ ਸਫਲ ਹੈ) ਜੋ ਤੇਰੇ ਪ੍ਰੇਮ ਵਿਚ ਰੰਗੇ ਹੋਏ ਹਨ ਅਤੇ ਤੇਰੇ ਰਸੀਏ ਭਗਤ ਹਨ, ਉਹੀ ਬੰਦੇ ਤੈਨੂੰ ਪਿਆਰੇ ਲੱਗਦੇ ਹਨ। ਅਨੇਕਾਂ ਹੋਰ ਜੀਵ ਤੇਰੀ ਵਡਿਆਈ ਕਰ ਰਹੇ ਹਨ, ਜੋ ਮੈਥੋਂ ਗਿਣੇ ਨਹੀਂ ਜਾ ਸਕਦੇ। (ਭਲਾ, ਇਸ ਗਿਣਤੀ ਬਾਰੇ) ਨਾਨਕ ਕੀਹ ਵਿਚਾਰ ਕਰ ਸਕਦਾ ਹੈ? (ਨਾਨਕ ਇਹ ਵਿਚਾਰ ਕਰਨ-ਜੋਗਾ ਨਹੀਂ ਹੈ)। ਜਿਸ (ਪ੍ਰਭੂ) ਨੇ ਇਹ ਸ੍ਰਿਸ਼ਟੀ ਪੈਦਾ ਕੀਤੀ ਹੈ, ਉਹ ਇਸ ਵੇਲੇ ਭੀ ਮੌਜੂਦ ਹੈ, ਤੇ ਸਦਾ ਕਾਇਮ ਰਹਿਣ ਵਾਲਾ ਹੈ। ਉਹ ਮਾਲਕ-ਪ੍ਰਭੂ ਸਦਾ ਕਾਇਮ ਰਹਿਣ ਵਾਲਾ ਹੈ। ਉਸ ਦੀ ਵਡਿਆਈ ਸਦਾ ਕਾਇਮ ਰਹਿਣ ਵਾਲੀ ਹੈ। ਜਿਸ ਪ੍ਰਭੂ ਨੇ ਕਈ ਰੰਗਾਂ ਕਿਸਮਾਂ ਤੇ ਜਿਨਸਾਂ ਦੀ ਮਾਇਆ ਰਚ ਦਿੱਤੀ ਹੈ। ਉਹ, ਜਿਵੇਂ ਉਸ ਦੀ ਰਜ਼ਾ ਹੈ, ਜਗਤ ਨੂੰ ਪੈਦਾ ਕਰ ਕੇ ਆਪਣੇ ਪੈਦਾ ਕੀਤੇ ਹੋਏ ਦੀ ਸੰਭਾਲ ਕਰ ਰਿਹਾ ਹੈ। ਜੋ ਕੁਝ ਉਸ (ਪ੍ਰਭੂ) ਨੂੰ ਚੰਗਾ ਲੱਗਦਾ ਹੈ ਉਹੀ ਉਹ ਕਰਦਾ ਹੈ। ਕੋਈ ਜੀਵ ਉਸ ਦੇ ਅੱਗੇ ਹੈਂਕੜ ਨਹੀਂ ਵਿਖਾ ਸਕਦਾ (ਕੋਈ ਜੀਵ ਉਸ ਨੂੰ ਇਹ ਨਹੀਂ ਆਖ ਸਕਦਾ 'ਇਉਂ ਨਹੀਂ, ਇਉਂ ਕਰ')। ਉਹ ਪ੍ਰਭੂ (ਸਾਰੇ ਜਗਤ ਦਾ) ਪਾਤਿਸ਼ਾਹ ਹੈ, ਪਾਤਿਸ਼ਾਹਾਂ ਦਾ ਭੀ ਪਾਤਿਸ਼ਾਹ ਹੈ। ਹੇ ਨਾਨਕ! (ਜੀਵਾਂ ਨੂੰ) ਉਸ ਦੀ ਰਜ਼ਾ ਵਿਚ ਰਹਿਣਾ ਹੀ ਫਬਦਾ ਹੈ ॥੧॥{9}`
      },
      {
        number: 4,
        sanskrit: `ਆਸਾ ਮਹਲਾ ੧ ॥
ਸੁਣਿ ਵਡਾ ਆਖੈ ਸਭੁ ਕੋਇ ॥
ਕੇਵਡੁ ਵਡਾ ਡੀਠਾ ਹੋਇ ॥
ਕੀਮਤਿ ਪਾਇ ਨ ਕਹਿਆ ਜਾਇ ॥
ਕਹਣੈ ਵਾਲੇ ਤੇਰੇ ਰਹੇ ਸਮਾਇ ॥੧॥
ਵਡੇ ਮੇਰੇ ਸਾਹਿਬਾ ਗਹਿਰ ਗੰਭੀਰਾ ਗੁਣੀ ਗਹੀਰਾ ॥
ਕੋਇ ਨ ਜਾਣੈ ਤੇਰਾ ਕੇਤਾ ਕੇਵਡੁ ਚੀਰਾ ॥੧॥ ਰਹਾਉ ॥
ਸਭਿ ਸੁਰਤੀ ਮਿਲਿ ਸੁਰਤਿ ਕਮਾਈ ॥
ਸਭ ਕੀਮਤਿ ਮਿਲਿ ਕੀਮਤਿ ਪਾਈ ॥
ਗਿਆਨੀ ਧਿਆਨੀ ਗੁਰ ਗੁਰਹਾਈ ॥
ਕਹਣੁ ਨ ਜਾਈ ਤੇਰੀ ਤਿਲੁ ਵਡਿਆਈ ॥੨॥
ਸਭਿ ਸਤ ਸਭਿ ਤਪ ਸਭਿ ਚੰਗਿਆਈਆ ॥
ਸਿਧਾ ਪੁਰਖਾ ਕੀਆ ਵਡਿਆਈਆ ॥
ਤੁਧੁ ਵਿਣੁ ਸਿਧੀ ਕਿਨੈ ਨ ਪਾਈਆ ॥
ਕਰਮਿ ਮਿਲੈ ਨਾਹੀ ਠਾਕਿ ਰਹਾਈਆ ॥੩॥
ਆਖਣ ਵਾਲਾ ਕਿਆ ਵੇਚਾਰਾ ॥
ਸਿਫਤੀ ਭਰੇ ਤੇਰੇ ਭੰਡਾਰਾ ॥
ਜਿਸੁ ਤੂ ਦੇਹਿ ਤਿਸੈ ਕਿਆ ਚਾਰਾ ॥
ਨਾਨਕ ਸਚੁ ਸਵਾਰਣਹਾਰਾ ॥੪॥੨॥`,
        transliteration: `aasaa mahalaa 1 |
sun vaddaa aakhai sabh koe |
kevadd vaddaa ddeetthaa hoe |
keemat paae na kahiaa jaae |
kahanai vaale tere rahe samaae |1|
vadde mere saahibaa gahir ganbheeraa gunee gaheeraa |
koe na jaanai teraa ketaa kevadd cheeraa |1| rahaau |
sabh suratee mil surat kamaaee |
sabh keemat mil keemat paaee |
giaanee dhiaanee gur gurahaaee |
kehan na jaaee teree til vaddiaaee |2|
sabh sat sabh tap sabh changiaaeea |
sidhaa purakhaa keea vaddiaaeea |
tudh vin sidhee kinai na paaeea |
karam milai naahee tthaak rahaaeea |3|
aakhan vaalaa kiaa vechaaraa |
sifatee bhare tere bhanddaaraa |
jis too dehi tisai kiaa chaaraa |
naanak sach savaaranahaaraa |4|2|`,
        meaning: `Aasaa, First Mehl: Hearing of His Greatness, everyone calls Him Great. But just how Great His Greatness is-this is known only to those who have seen Him. His Value cannot be estimated; He cannot be described. Those who describe You, Lord, remain immersed and absorbed in You. ||1|| O my Great Lord and Master of Unfathomable Depth, You are the Ocean of Excellence. No one knows the extent or the vastness of Your Expanse. ||1||Pause|| All the intuitives met and practiced intuitive meditation. All the appraisers met and made the appraisal. The spiritual teachers, the teachers of meditation, and the teachers of teachers -they cannot describe even an iota of Your Greatness. ||2|| All Truth, all austere discipline, all goodness, all the great miraculous spiritual powers of the Siddhas without You, no one has attained such powers. They are received only by Your Grace. No one can block them or stop their flow. ||3|| What can the poor helpless creatures do? Your Praises are overflowing with Your Treasures. Those, unto whom You give-how can they think of any other? O Nanak, the True One embellishes and exalts. ||4||2||`,
        meaning_pa: `ਹਰੇਕ ਜੀਵ (ਹੋਰਨਾਂ ਪਾਸੋਂ ਸਿਰਫ਼) ਸੁਣ ਕੇ (ਹੀ) ਆਖ ਦੇਂਦਾ ਹੈ ਕਿ (ਹੇ ਪ੍ਰਭੂ!) ਤੂੰ ਵੱਡਾ ਹੈਂ। ਪਰ ਤੂੰ ਕੇਡਾ ਵੱਡਾ ਹੈਂ (ਕਿਤਨਾ ਬੇਅੰਤ ਹੈਂ?) ਇਹ ਗੱਲ ਤੇਰਾ ਦਰਸਨ ਕੀਤਿਆਂ ਹੀ ਦੱਸੀ ਜਾ ਸਕਦੀ ਹੈ (ਤੇਰਾ ਦਰਸਨ ਕੀਤਿਆਂ ਹੀ ਦੱਸਿਆ ਜਾ ਸਕਦਾ ਹੈ ਕਿ ਤੂੰ ਬਹੁਤ ਬੇਅੰਤ ਹੈਂ)। ਤੇਰੇ ਬਰਾਬਰ ਦਾ ਹੋਰ ਕੋਈ ਦੱਸਿਆ ਨਹੀਂ ਜਾ ਸਕਦਾ, ਤੇਰੇ ਸਰੂਪ ਦਾ ਬਿਆਨ ਨਹੀਂ ਕੀਤਾ ਜਾ ਸਕਦਾ। ਤੇਰੀ ਵਡਿਆਈ ਆਖਣ ਵਾਲੇ (ਆਪਾ ਭੁੱਲ ਕੇ) ਤੇਰੇ ਵਿਚ (ਹੀ) ਲੀਨ ਹੋ ਜਾਂਦੇ ਹਨ ॥੧॥ ਹੇ ਮੇਰੇ ਵੱਡੇ ਮਾਲਕ! ਤੂੰ (ਮਾਨੋ, ਇਕ) ਡੂੰਘਾ (ਸਮੁੰਦਰ) ਹੈਂ। ਤੂੰ ਬੜੇ ਜਿਗਰੇ ਵਾਲਾ ਹੈਂ, ਤੂੰ ਬੇਅੰਤ ਗੁਣਾਂ ਵਾਲਾ ਹੈਂ। ਕੋਈ ਭੀ ਜੀਵ ਨਹੀਂ ਜਾਣਦਾ ਕਿ ਤੇਰਾ ਕਿਤਨਾ ਵੱਡਾ ਵਿਸਥਾਰ ਹੈ ॥੧॥ ਰਹਾਉ ॥ (ਤੂੰ ਕੇਡਾ ਵੱਡਾ ਹੈਂ-ਇਹ ਗੱਲ ਲੱਭਣ ਵਾਸਤੇ) ਸਮਾਧੀਆਂ ਲਾਉਣ ਵਾਲੇ ਕਈ ਵੱਡੇ ਵੱਡੇ ਪ੍ਰਸਿੱਧ ਜੋਗੀਆਂ ਨੇ ਧਿਆਨ ਜੋੜਨ ਦੇ ਜਤਨ ਕੀਤੇ , ਮੁੜ ਮੁੜ ਜਤਨ ਕੀਤੇ। ਵੱਡੇ ਵੱਡੇ ਪ੍ਰਸਿੱਧ (ਸ਼ਾਸਤ੍ਰ-ਵੇੱਤਾ) ਵਿਚਾਰਵਾਨਾਂ ਨੇ ਆਪੋ ਵਿਚ ਇਕ ਦੂਜੇ ਦੀ ਸਹੈਤਾ ਲੈ ਕੇ, ਤੇਰੇ ਬਰਾਬਰ ਦੀ ਕੋਈ ਹਸਤੀ ਲੱਭਣ ਦੀ ਕੋਸ਼ਿਸ਼ ਕੀਤੀ, () ਪਰ ਤੇਰੀ ਵਡਿਆਈ ਦਾ ਇਕ ਤਿਲ ਜਿਤਨਾ ਭੀ ਹਿੱਸਾ ਨਹੀਂ ਦੱਸ ਸਕੇ ॥੨॥ (ਵਿਚਾਰਵਾਨ ਕੀਹ ਤੇ ਸਿਧ ਜੋਗੀ ਕੀਹ? ਤੇਰੀ ਵਡਿਆਈ ਦਾ ਅੰਦਾਜ਼ਾ ਤਾਂ ਕੋਈ ਭੀ ਨਹੀਂ ਲਾ ਸਕਿਆ, ਪਰ ਵਿਚਾਰਵਾਨਾਂ ਦੇ) ਸਾਰੇ ਭਲੇ ਕੰਮ; ਸਾਰੇ ਤਪ ਤੇ ਸਾਰੇ ਗੁਣ, ਸਿੱਧਾਂ ਲੋਕਾਂ ਦੀਆਂ (ਰਿੱਧੀਆਂ ਸਿੱਧੀਆਂ ਆਦਿਕ) ਵੱਡੇ ਵੱਡੇ ਕੰਮ; ਇਹ ਕਾਮਯਾਬੀ ਕਿਸੇ ਨੂੰ ਭੀ ਤੇਰੀ ਸਹੈਤਾ ਤੋਂ ਬਿਨਾ ਹਾਸਲ ਨਹੀਂ ਹੋਈ। (ਜਿਸ ਕਿਸੇ ਨੂੰ ਸਿੱਧੀ ਪ੍ਰਾਪਤ ਹੋਈ ਹੈ) ਤੇਰੀ ਮਿਹਰ ਨਾਲ ਪ੍ਰਾਪਤ ਹੋਈ ਹੈ ਤੇ, ਕੋਈ ਹੋਰ ਉਸ ਪ੍ਰਾਪਤੀ ਦੇ ਰਾਹ ਵਿਚ ਰੋਕ ਨਹੀਂ ਪਾ ਸਕਿਆ ॥੩॥ ਜੀਵ ਦੀ ਕੀਹ ਪਾਂਇਆਂ ਹੈ ਕਿ ਇਹਨਾਂ ਗੁਣਾਂ ਨੂੰ ਬਿਆਨ ਕਰ ਸਕੇ? (ਹੇ ਪ੍ਰਭੂ!) ਤੇਰੇ ਗੁਣਾਂ ਦੇ (ਮਾਨੋ) ਖ਼ਜ਼ਾਨੇ ਭਰੇ ਪਏ ਹਨ। ਜਿਸ ਨੂੰ ਤੂੰ ਸਿਫ਼ਤ-ਸਾਲਾਹ ਕਰਨ ਦੀ  ਦਾਤ ਬਖ਼ਸ਼ਦਾ ਹੈਂ; ਉਸ ਦੇ ਰਾਹ ਵਿਚ ਰੁਕਾਵਟ ਪਾਣ ਲਈ ਕਿਸੇ ਦਾ ਜ਼ੋਰ ਨਹੀਂ ਚੱਲ ਸਕਦਾ, (ਕਿਉਂਕਿ) ਹੇ ਨਾਨਕ! (ਆਖ-ਹੇ ਪ੍ਰਭੂ!) ਤੂੰ ਸਦਾ ਕਾਇਮ ਰਹਿਣ ਵਾਲਾ ਪ੍ਰਭੂ ਉਸ (ਭਾਗਾਂ ਵਾਲੇ) ਨੂੰ ਸੰਵਾਰਨ ਵਾਲਾ (ਆਪ) ਹੈਂ ॥੪॥੨॥{9}`
      },
      {
        number: 5,
        sanskrit: `ਆਸਾ ਮਹਲਾ ੧ ॥
ਆਖਾ ਜੀਵਾ ਵਿਸਰੈ ਮਰਿ ਜਾਉ ॥
ਆਖਣਿ ਅਉਖਾ ਸਾਚਾ ਨਾਉ ॥
ਸਾਚੇ ਨਾਮ ਕੀ ਲਾਗੈ ਭੂਖ ॥
ਉਤੁ ਭੂਖੈ ਖਾਇ ਚਲੀਅਹਿ ਦੂਖ ॥੧॥
ਸੋ ਕਿਉ ਵਿਸਰੈ ਮੇਰੀ ਮਾਇ ॥
ਸਾਚਾ ਸਾਹਿਬੁ ਸਾਚੈ ਨਾਇ ॥੧॥ ਰਹਾਉ ॥
ਸਾਚੇ ਨਾਮ ਕੀ ਤਿਲੁ ਵਡਿਆਈ ॥
ਆਖਿ ਥਕੇ ਕੀਮਤਿ ਨਹੀ ਪਾਈ ॥
ਜੇ ਸਭਿ ਮਿਲਿ ਕੈ ਆਖਣ ਪਾਹਿ ॥
ਵਡਾ ਨ ਹੋਵੈ ਘਾਟਿ ਨ ਜਾਇ ॥੨॥
ਨਾ ਓਹੁ ਮਰੈ ਨ ਹੋਵੈ ਸੋਗੁ ॥
ਦੇਦਾ ਰਹੈ ਨ ਚੂਕੈ ਭੋਗੁ ॥
ਗੁਣੁ ਏਹੋ ਹੋਰੁ ਨਾਹੀ ਕੋਇ ॥
ਨਾ ਕੋ ਹੋਆ ਨਾ ਕੋ ਹੋਇ ॥੩॥
ਜੇਵਡੁ ਆਪਿ ਤੇਵਡ ਤੇਰੀ ਦਾਤਿ ॥
ਜਿਨਿ ਦਿਨੁ ਕਰਿ ਕੈ ਕੀਤੀ ਰਾਤਿ ॥
ਖਸਮੁ ਵਿਸਾਰਹਿ ਤੇ ਕਮਜਾਤਿ ॥
ਨਾਨਕ ਨਾਵੈ ਬਾਝੁ ਸਨਾਤਿ ॥੪॥੩॥`,
        transliteration: `aasaa mahalaa 1 |
aakhaa jeevaa visarai mar jaau |
aakhan aaukhaa saachaa naau |
saache naam kee laagai bhookh |
aut bhookhai khaae chaleeeh dookh |1|
so kiau visarai meree maae |
saachaa saahib saachai naae |1| rahaau |
saache naam kee til vaddiaaee |
aakh thake keemat nahee paaee |
je sabh mil kai aakhan paeh |
vaddaa na hovai ghaatt na jaae |2|
naa ohu marai na hovai sog |
dedaa rahai na chookai bhog |
gun eho hor naahee koe |
naa ko hoaa naa ko hoe |3|
jevadd aap tevadd teree daat |
jin din kar kai keetee raat |
khasam visaareh te kamajaat |
naanak naavai baajh sanaat |4|3|`,
        meaning: `Aasaa, First Mehl: Chanting it, I live; forgetting it, I die. It is so difficult to chant the True Name. If someone feels hunger for the True Name, that hunger shall consume his pain. ||1|| How can I forget Him, O my mother? True is the Master, True is His Name. ||1||Pause|| Trying to describe even an iota of the Greatness of the True Name, people have grown weary, but they have not been able to evaluate it. Even if everyone were to gather together and speak of Him, He would not become any greater or any lesser. ||2|| That Lord does not die; there is no reason to mourn. He continues to give, and His Provisions never run short. This Virtue is His alone; there is no other like Him. There never has been, and there never will be. ||3|| As Great as You Yourself are, O Lord, so Great are Your Gifts. The One who created the day also created the night. Those who forget their Lord and Master are vile and despicable. O Nanak, without the Name, they are wretched outcasts. ||4||3||`,
        meaning_pa: `(ਜਿਉਂ ਜਿਉਂ) ਮੈਂ (ਪਰਮਾਤਮਾ ਦਾ) ਨਾਮ ਸਿਮਰਦਾ ਹਾਂ, ਤਿਉਂ ਤਿਉਂ ਮੇਰੇ ਅੰਦਰ ਆਤਮਕ ਜੀਵਨ ਪੈਦਾ ਹੁੰਦਾ ਹੈ। (ਪਰ ਜਦੋਂ ਮੈਨੂੰ ਪ੍ਰਭੂ ਦਾ ਨਾਮ) ਭੁੱਲ ਜਾਂਦਾ ਹੈ, ਮੇਰੀ ਆਤਮਕ ਮੌਤ ਹੋ ਜਾਂਦੀ ਹੈ। (ਇਹ ਪਤਾ ਹੁੰਦਿਆਂ ਭੀ) ਸਦਾ ਕਾਇਮ-ਰਹਿਣ ਵਾਲੇ ਪਰਮਾਤਮਾ ਦਾ ਨਾਮ ਸਿਮਰਨਾ ਔਖਾ (ਕੰਮ ਜਾਪਦਾ ਹੈ)। (ਜਿਸ ਮਨੁੱਖ ਦੇ ਅੰਦਰ) ਸਦਾ-ਥਿਰ ਪ੍ਰਭੂ ਦਾ ਨਾਮ ਸਿਮਰਨ ਦੀ ਤਾਂਘ ਪੈਦਾ ਹੋ ਜਾਂਦੀ ਹੈ, ਉਸ ਤਾਂਘ ਦੀ ਬਰਕਤਿ ਨਾਲ (ਹਰਿ-ਨਾਮ-ਭੋਜਨ) ਖਾ ਕੇ ਉਸ ਦੇ ਸਾਰੇ ਦੁੱਖ ਦੂਰ ਹੋ ਜਾਂਦੇ ਹਨ ॥੧॥ ਹੇ ਮੇਰੀ ਮਾਂ! (ਅਰਦਾਸ ਕਰ ਕਿ) ਉਹ ਪਰਮਾਤਮਾ ਮੈਨੂੰ ਕਦੇ ਭੀ ਨਾਹ ਭੁੱਲੇ। ਜਿਉਂ ਜਿਉਂ ਉਸ ਸਦਾ ਕਾਇਮ ਰਹਿਣ ਵਾਲੇ ਪ੍ਰਭੂ ਦਾ ਨਾਮ ਸਿਮਰੀਏ, ਤਿਉਂ ਤਿਉਂ ਉਹ ਸਦਾ ਕਾਇਮ ਰਹਿਣ ਵਾਲਾ ਮਾਲਕ (ਮਨ ਵਿਚ ਆ ਵੱਸਦਾ ਹੈ) ॥੧॥ ਰਹਾਉ ॥ ਸਦਾ ਕਾਇਮ ਰਹਿਣ ਵਾਲੇ ਪ੍ਰਭੂ ਦੇ ਨਾਮ ਦੀ ਰਤਾ ਜਿਤਨੀ ਭੀ ਮਹਿਮਾ… ਬਿਆਨ ਕਰ ਕੇ (ਸਾਰੇ ਜੀਵ) ਥੱਕ ਗਏ ਹਨ (ਬਿਆਨ ਨਹੀਂ ਕਰ ਸਕਦੇ)। ਕੋਈ ਭੀ ਨਹੀਂ ਦੱਸ ਸਕਿਆ ਕਿ ਪਰਮਾਤਮਾ ਦੇ ਬਰਾਬਰ ਦੀ ਕਿਹੜੀ ਹਸਤੀ ਹੈ। ਜੇ (ਜਗਤ ਦੇ) ਸਾਰੇ ਹੀ ਜੀਵ ਰਲ ਕੇ (ਪ੍ਰਭੂ ਦੀ ਵਡਿਆਈ) ਬਿਆਨ ਕਰਨ ਦਾ ਜਤਨ ਕਰਨ, ਤਾਂ ਉਹ ਪ੍ਰਭੂ (ਆਪਣੇ ਅਸਲੇ ਨਾਲੋਂ) ਵੱਡਾ ਨਹੀਂ ਹੋ ਜਾਂਦਾ (ਤੇ, ਜੇ ਕੋਈ ਭੀ ਉਸ ਦੀ ਵਡਿਆਈ ਨਾਹ ਕਰੇ), ਤਾਂ ਉਹ (ਅੱਗੇ ਨਾਲੋਂ) ਘੱਟ ਨਹੀਂ ਜਾਂਦਾ। (ਉਸ ਨੂੰ ਆਪਣੀ ਸੋਭਾ ਦਾ ਲਾਲਚ ਨਹੀਂ) ॥੨॥ ਉਹ ਪ੍ਰਭੂ ਕਦੇ ਮਰਦਾ ਨਹੀਂ, ਨਾਹ ਹੀ (ਉਸ ਦੀ ਖ਼ਾਤਰ) ਸੋਗ ਹੁੰਦਾ ਹੈ। ਉਹ ਸਦਾ (ਜੀਵਾਂ ਨੂੰ ਰਿਜ਼ਕ ਦਿੰਦਾ ਹੈ, ਉਸ ਦੀਆਂ ਦਿੱਤੀਆਂ ਦਾਤਾਂ ਦਾ ਵਰਤਣਾ ਕਦੇ ਮੁੱਕਦਾ ਨਹੀਂ (ਉਸ ਦੀਆਂ ਦਾਤਾਂ ਵਰਤਣ ਨਾਲ ਕਦੇ ਮੁਕਦੀਆਂ ਨਹੀਂ)। ਉਸ ਦੀ ਵੱਡੀ ਖ਼ੂਬੀ ਇਹ ਹੈ ਕਿ ਕੋਈ ਹੋਰ ਉਸ ਵਰਗਾ ਨਹੀਂ ਹੈ। (ਉਸ ਵਰਗਾ ਅਜੇ ਤਕ) ਨਾਹ ਕੋਈ ਹੋਇਆ ਹੈ, ਨਾਹ ਕਦੇ ਹੋਵੇਗਾ ॥੩॥ (ਹੇ ਪ੍ਰਭੂ!) ਜਿਤਨਾ ਬੇਅੰਤ ਤੂੰ ਆਪ ਹੈਂ ਉਤਨੀ ਬੇਅੰਤ ਤੇਰੀ ਬਖ਼ਸ਼ਸ਼। (ਤੂੰ ਐਸਾ ਹੈਂ) ਜਿਸ ਨੇ ਦਿਨ ਬਣਾਇਆ ਹੈ ਤੇ ਰਾਤ ਬਣਾਈ ਹੈ। ਜੋ (ਅਜਿਹੇ) ਖਸਮ-ਪ੍ਰਭੂ ਨੂੰ ਭੁਲਾ ਦੇਂਦੇ ਹਨ, ਉਹ ਬੰਦੇ ਨੀਵੇਂ ਜੀਵਨ ਵਾਲੇ ਬਣ ਜਾਂਦੇ ਹਨ। ਹੇ ਨਾਨਕ! ਨਾਮ ਤੋਂ ਖੁੰਝੇ ਹੋਏ ਜੀਵ (ਹੀ) ਨੀਚ ਹਨ ॥੪॥੩॥{9}`
      },
      {
        number: 6,
        sanskrit: `ਰਾਗੁ ਗੂਜਰੀ ਮਹਲਾ ੪ ॥
ਹਰਿ ਕੇ ਜਨ ਸਤਿਗੁਰ ਸਤਪੁਰਖਾ ਬਿਨਉ ਕਰਉ ਗੁਰ ਪਾਸਿ ॥
ਹਮ ਕੀਰੇ ਕਿਰਮ ਸਤਿਗੁਰ ਸਰਣਾਈ ਕਰਿ ਦਇਆ ਨਾਮੁ ਪਰਗਾਸਿ ॥੧॥
ਮੇਰੇ ਮੀਤ ਗੁਰਦੇਵ ਮੋ ਕਉ ਰਾਮ ਨਾਮੁ ਪਰਗਾਸਿ ॥
ਗੁਰਮਤਿ ਨਾਮੁ ਮੇਰਾ ਪ੍ਰਾਨ ਸਖਾਈ ਹਰਿ ਕੀਰਤਿ ਹਮਰੀ ਰਹਰਾਸਿ ॥੧॥ ਰਹਾਉ ॥
ਹਰਿ ਜਨ ਕੇ ਵਡ ਭਾਗ ਵਡੇਰੇ ਜਿਨ ਹਰਿ ਹਰਿ ਸਰਧਾ ਹਰਿ ਪਿਆਸ ॥
ਹਰਿ ਹਰਿ ਨਾਮੁ ਮਿਲੈ ਤ੍ਰਿਪਤਾਸਹਿ ਮਿਲਿ ਸੰਗਤਿ ਗੁਣ ਪਰਗਾਸਿ ॥੨॥
ਜਿਨ ਹਰਿ ਹਰਿ ਹਰਿ ਰਸੁ ਨਾਮੁ ਨ ਪਾਇਆ ਤੇ ਭਾਗਹੀਣ ਜਮ ਪਾਸਿ ॥
ਜੋ ਸਤਿਗੁਰ ਸਰਣਿ ਸੰਗਤਿ ਨਹੀ ਆਏ ਧ੍ਰਿਗੁ ਜੀਵੇ ਧ੍ਰਿਗੁ ਜੀਵਾਸਿ ॥੩॥
ਜਿਨ ਹਰਿ ਜਨ ਸਤਿਗੁਰ ਸੰਗਤਿ ਪਾਈ ਤਿਨ ਧੁਰਿ ਮਸਤਕਿ ਲਿਖਿਆ ਲਿਖਾਸਿ ॥
ਧਨੁ ਧੰਨੁ ਸਤਸੰਗਤਿ ਜਿਤੁ ਹਰਿ ਰਸੁ ਪਾਇਆ ਮਿਲਿ ਜਨ ਨਾਨਕ ਨਾਮੁ ਪਰਗਾਸਿ ॥੪॥੪॥`,
        transliteration: `raag goojaree mahalaa 4 |
har ke jan satigur satapurakhaa binau krau gur paas |
ham keere kiram satigur saranaaee kar deaa naam paragaas |1|
mere meet guradev mo kau raam naam paragaas |
guramat naam meraa praan sakhaaee har keerat hamaree raharaas |1| rahaau |
har jan ke vadd bhaag vaddere jin har har saradhaa har piaas |
har har naam milai tripataaseh mil sangat gun paragaas |2|
jin har har har ras naam na paaeaa te bhaagaheen jam paas |
jo satigur saran sangat nahee aae dhrig jeeve dhrig jeevaas |3|
jin har jan satigur sangat paaee tin dhur masatak likhiaa likhaas |
dhan dhan satasangat jit har ras paaeaa mil jan naanak naam paragaas |4|4|`,
        meaning: `Raag Goojaree, Fourth Mehl: O humble servant of the Lord, O True Guru, O True Primal Being: I offer my humble prayer to You, O Guru. I am a mere insect, a worm. O True Guru, I seek Your Sanctuary. Please be merciful, and bless me with the Light of the Naam, the Name of the Lord. ||1|| O my Best Friend, O Divine Guru, please enlighten me with the Name of the Lord. Through the Guru's Teachings, the Naam is my breath of life. The Kirtan of the Lord's Praise is my life's occupation. ||1||Pause|| The servants of the Lord have the greatest good fortune; they have faith in the Lord, and a longing for the Lord. Obtaining the Name of the Lord, Har, Har, they are satisfied; joining the Sangat, the Blessed Congregation, their virtues shine forth. ||2|| Those who have not obtained the Sublime Essence of the Name of the Lord, Har, Har, Har, are most unfortunate; they are led away by the Messenger of Death. Those who have not sought the Sanctuary of the True Guru and the Sangat, the Holy Congregation-cursed are their lives, and cursed are their hopes of life. ||3|| Those humble servants of the Lord who have attained the Company of the True Guru, have such pre-ordained destiny inscribed on their foreheads. Blessed, blessed is the Sat Sangat, the True Congregation, where the Lord's Essence is obtained. Meeting with His humble servant, O Nanak, the Light of the Naam shines forth. ||4||4||`,
        meaning_pa: `ਹੇ ਮਹਾਪੁਰਖ ਗੁਰੂ! ਹੇ ਪ੍ਰਭੂ ਦੇ ਭਗਤ ਸਤਿਗੁਰੂ! ਮੈਂ, ਹੇ ਗੁਰੂ! ਤੇਰੇ ਅੱਗੇ ਬੇਨਤੀ ਕਰਦਾ ਹਾਂ, ਹੇ ਸਤਿਗੁਰੂ! ਮੈਂ ਨਿਮਾਣਾ ਤੇਰੀ ਸਰਨ ਆਇਆ ਹਾਂ। ਕਿਰਪਾ ਕਰ ਕੇ (ਮੇਰੇ ਅੰਦਰ) ਪ੍ਰਭੂ ਦਾ ਨਾਮ-ਚਾਨਣ ਪੈਦਾ ਕਰ ॥੧॥ ਹੇ ਮੇਰੇ ਮਿੱਤਰ ਗੁਰੂ! ਮੈਨੂੰ ਪ੍ਰਭੂ ਦਾ ਨਾਮ-ਚਾਨਣ ਬਖ਼ਸ਼। ਗੁਰੂ ਦੀ ਦੱਸੀ ਮਤਿ ਦੀ ਰਾਹੀਂ ਮਿਲਿਆ ਹੋਇਆ ਹਰਿ-ਨਾਮ ਮੇਰੀ ਜਿੰਦ ਦਾ ਸਾਥੀ (ਬਣਿਆ ਰਹੇ), ਪ੍ਰਭੂ ਦੀ ਸਿਫ਼ਤ-ਸਾਲਾਹ ਮੇਰੀ ਜ਼ਿੰਦਗੀ ਦੇ ਸਫ਼ਰ ਲਈ ਰਾਸਿ-ਪੂੰਜੀ ਬਣੀ ਰਹੇ ॥੧॥ ਰਹਾਉ ॥ ਪ੍ਰਭੂ ਦੇ ਉਹਨਾਂ ਸੇਵਕਾਂ ਦੇ ਬੜੇ ਉੱਚੇ ਭਾਗ ਹਨ ਜਿਨ੍ਹਾਂ ਦੇ ਅੰਦਰ ਪ੍ਰਭੂ ਦੇ ਨਾਮ ਵਾਸਤੇ ਸਰਧਾ ਹੈ, ਖਿੱਚ ਹੈ। ਜਦੋਂ ਉਹਨਾਂ ਨੂੰ ਪਰਮਾਤਮਾ ਦਾ ਨਾਮ ਪ੍ਰਾਪਤ ਹੁੰਦਾ ਹੈ ਉਹ (ਮਾਇਆ ਦੀ ਤ੍ਰਿਸ਼ਨਾ ਵਲੋਂ) ਰੱਜ ਜਾਂਦੇ ਹਨ, ਸਾਧ ਸੰਗਤਿ ਵਿਚ ਮਿਲ ਕੇ (ਉਹਨਾਂ ਦੇ ਅੰਦਰ ਭਲੇ) ਗੁਣ ਪੈਦਾ ਹੁੰਦੇ ਹਨ ॥੨॥ ਪਰ ਜਿਨ੍ਹਾਂ ਮਨੁੱਖਾਂ ਨੂੰ ਪਰਮਾਤਮਾ ਦੇ ਨਾਮ ਦਾ ਸੁਆਦ ਨਹੀਂ ਆਇਆ, ਜਿਨ੍ਹਾਂ ਨੂੰ ਪ੍ਰਭੂ ਦਾ ਨਾਮ ਨਹੀਂ ਮਿਲਿਆ, ਉਹ ਬਦ-ਕਿਸਮਤ ਹਨ, ਉਹ ਜਮਾਂ ਦੇ ਵੱਸ (ਪਏ ਹੋਏ ਸਮਝੋ ਉਹਨਾਂ ਦੇ ਸਿਰ ਉਤੇ ਆਤਮਕ ਮੌਤ ਸਦਾ ਸਵਾਰ ਰਹਿੰਦੀ ਹੈ)। ਜੋ ਮਨੁੱਖ ਗੁਰੂ ਦੀ ਸਰਨ ਨਹੀਂ ਆਉਂਦੇ, ਜੋ ਸਾਧ ਸੰਗਤਿ ਵਿਚ ਨਹੀਂ ਬੈਠਦੇ, ਲਾਹਨਤ ਹੈ ਉਹਨਾਂ ਦੇ ਜੀਊਣ ਨੂੰ, ਉਹਨਾਂ ਦਾ ਜੀਊਣਾ ਫਿਟਕਾਰ-ਜੋਗ ਹੈ ॥੩॥ ਜਿਨ੍ਹਾਂ ਪ੍ਰਭੂ ਦੇ ਸੇਵਕਾਂ ਨੂੰ ਗੁਰੂ ਦੀ ਸੰਗਤਿ ਵਿਚ ਬੈਠਣਾ ਨਸੀਬ ਹੋਇਆ ਹੈ, (ਸਮਝੋ) ਉਹਨਾਂ ਦੇ ਮੱਥੇ ਉਤੇ ਧੁਰੋਂ ਹੀ ਚੰਗਾ ਲੇਖ ਲਿਖਿਆ ਹੋਇਆ ਹੈ। ਹੇ ਨਾਨਕ! ਧੰਨ ਹੈ ਸਤਸੰਗ! ਧੰਨ ਹੈ ਸਤਸੰਗ! ਜਿਸ ਵਿਚ (ਬੈਠਿਆਂ) ਪ੍ਰਭੂ ਦੇ ਨਾਮ ਦਾ ਆਨੰਦ ਮਿਲਦਾ ਹੈ, ਜਿਥੇ ਗੁਰਮੁਖਾਂ ਨੂੰ ਮਿਲਿਆਂ (ਹਿਰਦੇ ਵਿਚ ਪਰਮਾਤਮਾ ਦਾ) ਨਾਮ ਆ ਵੱਸਦਾ ਹੈ ॥੪॥੪॥`
      },
      {
        number: 7,
        sanskrit: `ਰਾਗੁ ਗੂਜਰੀ ਮਹਲਾ ੫ ॥
ਕਾਹੇ ਰੇ ਮਨ ਚਿਤਵਹਿ ਉਦਮੁ ਜਾ ਆਹਰਿ ਹਰਿ ਜੀਉ ਪਰਿਆ ॥
ਸੈਲ ਪਥਰ ਮਹਿ ਜੰਤ ਉਪਾਏ ਤਾ ਕਾ ਰਿਜਕੁ ਆਗੈ ਕਰਿ ਧਰਿਆ ॥੧॥
ਮੇਰੇ ਮਾਧਉ ਜੀ ਸਤਸੰਗਤਿ ਮਿਲੇ ਸੁ ਤਰਿਆ ॥
ਗੁਰ ਪਰਸਾਦਿ ਪਰਮ ਪਦੁ ਪਾਇਆ ਸੂਕੇ ਕਾਸਟ ਹਰਿਆ ॥੧॥ ਰਹਾਉ ॥
ਜਨਨਿ ਪਿਤਾ ਲੋਕ ਸੁਤ ਬਨਿਤਾ ਕੋਇ ਨ ਕਿਸ ਕੀ ਧਰਿਆ ॥
ਸਿਰਿ ਸਿਰਿ ਰਿਜਕੁ ਸੰਬਾਹੇ ਠਾਕੁਰੁ ਕਾਹੇ ਮਨ ਭਉ ਕਰਿਆ ॥੨॥
ਊਡੇ ਊਡਿ ਆਵੈ ਸੈ ਕੋਸਾ ਤਿਸੁ ਪਾਛੈ ਬਚਰੇ ਛਰਿਆ ॥
ਤਿਨ ਕਵਣੁ ਖਲਾਵੈ ਕਵਣੁ ਚੁਗਾਵੈ ਮਨ ਮਹਿ ਸਿਮਰਨੁ ਕਰਿਆ ॥੩॥
ਸਭਿ ਨਿਧਾਨ ਦਸ ਅਸਟ ਸਿਧਾਨ ਠਾਕੁਰ ਕਰ ਤਲ ਧਰਿਆ ॥
ਜਨ ਨਾਨਕ ਬਲਿ ਬਲਿ ਸਦ ਬਲਿ ਜਾਈਐ ਤੇਰਾ ਅੰਤੁ ਨ ਪਾਰਾਵਰਿਆ ॥੪॥੫॥`,
        transliteration: `raag goojaree mahalaa 5 |
kaahe re man chitaveh udam jaa aahar har jeeo pariaa |
sail pathar meh jant upaae taa kaa rijak aagai kar dhariaa |1|
mere maadhau jee satasangat mile su tariaa |
gur parasaad param pad paaeaa sooke kaasatt hariaa |1| rahaau |
janan pitaa lok sut banitaa koe na kis kee dhariaa |
sir sir rijak sanbaahe tthaakur kaahe man bhau kariaa |2|
aoodde aoodd aavai sai kosaa tis paachhai bachare chhariaa |
tin kavan khalaavai kavan chugaavai man meh simaran kariaa |3|
sabh nidhaan das asatt sidhaan tthaakur kar tal dhariaa |
jan naanak bal bal sad bal jaaeeai teraa ant na paaraavariaa |4|5|`,
        meaning: `Raag Goojaree, Fifth Mehl: Why, O mind, do you plot and plan, when the Dear Lord Himself provides for your care? From rocks and stones He created living beings; He places their nourishment before them. ||1|| O my Dear Lord of souls, one who joins the Sat Sangat, the True Congregation, is saved. By Guru's Grace, the supreme status is obtained, and the dry wood blossoms forth again in lush greenery. ||1||Pause|| Mothers, fathers, friends, children and spouses-no one is the support of anyone else. For each and every person, our Lord and Master provides sustenance. Why are you so afraid, O mind? ||2|| The flamingoes fly hundreds of miles, leaving their young ones behind. Who feeds them, and who teaches them to feed themselves? Have you ever thought of this in your mind? ||3|| All the nine treasures, and the eighteen supernatural powers are held by our Lord and Master in the Palm of His Hand. Servant Nanak is devoted, dedicated, forever a sacrifice to You, Lord. Your Expanse has no limit, no boundary. ||4||5||`,
        meaning_pa: `ਹੇ ਮਨ! (ਤੇਰੀ ਖ਼ਾਤਰ) ਜਿਸ ਆਹਰ ਵਿਚ ਪਰਮਾਤਮਾ ਆਪ ਲੱਗਾ ਹੋਇਆ ਹੈ, ਉਸ ਵਾਸਤੇ ਤੂੰ ਕਿਉਂ (ਸਦਾ) ਸੋਚਾਂ-ਫ਼ਿਕਰ ਕਰਦਾ ਰਹਿੰਦਾ ਹੈਂ? ਜੇਹੜੇ ਜੀਵ ਪ੍ਰਭੂ ਨੇ ਚਟਾਨਾਂ ਤੇ ਪੱਥਰਾਂ ਵਿਚ ਪੈਦਾ ਕੀਤੇ ਹਨ, ਉਹਨਾਂ ਦਾ ਭੀ ਰਿਜ਼ਕ ਉਸ ਨੇ (ਉਹਨਾਂ ਦੇ ਪੈਦਾ ਕਰਨ ਤੋਂ) ਪਹਿਲਾਂ ਹੀ ਬਣਾ ਰਖਿਆ ਹੈ ॥੧॥ ਹੇ ਮੇਰੇ ਪ੍ਰਭੂ ਜੀ! ਜੇਹੜੇ ਮਨੁੱਖ ਸਾਧ ਸੰਗਤਿ ਵਿਚ ਮਿਲ ਬੈਠਦੇ ਹਨ, ਉਹ (ਵਿਅਰਥ ਤੌਖ਼ਲੇ-ਫ਼ਿਕਰਾਂ ਤੋਂ) ਬਚ ਜਾਂਦੇ ਹਨ। ਗੁਰੂ ਦੀ ਕਿਰਪਾ ਨਾਲ ਜਿਸ ਮਨੁੱਖ ਨੂੰ ਇਹ (ਅਡੋਲਤਾ ਵਾਲੀ) ਉੱਚੀ ਆਤਮਕ ਅਵਸਥਾ ਮਿਲ ਜਾਂਦੀ ਹੈ, ਉਹ (ਮਾਨੋ) ਸੁੱਕਾ ਕਾਠ ਹਰਾ ਹੋ ਜਾਂਦਾ ਹੈ ॥੧॥ ਰਹਾਉ ॥ (ਹੇ ਮਨ!) ਮਾਂ, ਪਿਉ, ਪੁੱਤਰ, ਲੋਕ, ਵਹੁਟੀ-ਕੋਈ ਭੀ ਕਿਸੇ ਦਾ ਆਸਰਾ ਨਹੀਂ ਹੈ। ਹੇ ਮਨ! ਤੂੰ ਕਿਉਂ ਡਰਦਾ ਹੈਂ? ਪਾਲਣਹਾਰ ਪ੍ਰਭੂ ਹਰੇਕ ਜੀਵ ਨੂੰ ਆਪ ਹੀ ਰਿਜ਼ਕ ਅਪੜਾਂਦਾ ਹੈ ॥੨॥ (ਹੇ ਮਨ! ਵੇਖ! ਕੂੰਜ) ਉੱਡ ਉੱਡ ਕੇ ਸੈਂਕੜੇ ਕੋਹਾਂ ਤੇ ਆ ਜਾਂਦੀ ਹੈ, ਪਿੱਛੇ ਉਸ ਦੇ ਬੱਚੇ (ਇਕੱਲੇ) ਛੱਡੇ ਹੋਏ ਹੁੰਦੇ ਹਨ। ਉਹਨਾਂ ਨੂੰ ਕੋਈ ਕੁਝ ਖੁਆਲਣ ਵਾਲਾ ਨਹੀਂ, ਕੋਈ ਉਹਨਾਂ ਨੂੰ ਚੋਗਾ ਨਹੀਂ ਚੁਗਾਂਦਾ। ਉਹ ਕੂੰਜ ਆਪਣੇ ਬੱਚਿਆਂ ਦਾ ਧਿਆਨ ਆਪਣੇ ਮਨ ਵਿਚ ਧਰਦੀ ਰਹਿੰਦੀ ਹੈ (ਤੇ, ਇਸੇ ਨੂੰ ਪ੍ਰਭੂ ਉਹਨਾਂ ਦੇ ਪਾਲਣ ਦਾ ਵਸੀਲਾ ਬਣਾਂਦਾ ਹੈ) ॥੩॥ ਹੇ ਪਾਲਣਹਾਰ ਪ੍ਰਭੂ! ਜਗਤ ਦੇ ਸਾਰੇ ਖ਼ਜ਼ਾਨੇ ਤੇ ਅਠਾਰਾਂ ਸਿੱਧੀਆਂ (ਮਾਨੋ) ਤੇਰੇ ਹੱਥਾਂ ਦੀਆਂ ਤਲੀਆਂ ਉੱਤੇ ਰੱਖੇ ਪਏ ਹਨ। ਹੇ ਦਾਸ ਨਾਨਕ! ਐਸੇ ਪ੍ਰਭੂ ਤੋਂ ਸਦਾ ਸਦਕੇ ਹੋ, ਸਦਾ ਕੁਰਬਾਨ ਹੋ, (ਤੇ ਆਖ-ਹੇ ਪ੍ਰਭੂ!) ਤੇਰੀ ਬਜ਼ੁਰਗੀ ਦੇ ਉਰਲੇ ਪਾਰਲੇ ਬੰਨੇ ਦਾ ਅੰਤ ਨਹੀਂ ਪੈ ਸਕਦਾ ॥੪॥੫॥`
      },
      {
        number: 8,
        sanskrit: `ਰਾਗੁ ਆਸਾ ਮਹਲਾ ੪ ਸੋ ਪੁਰਖੁ ॥
ੴ ਸਤਿਗੁਰ ਪ੍ਰਸਾਦਿ ॥
ਸੋ ਪੁਰਖੁ ਨਿਰੰਜਨੁ ਹਰਿ ਪੁਰਖੁ ਨਿਰੰਜਨੁ ਹਰਿ ਅਗਮਾ ਅਗਮ ਅਪਾਰਾ ॥
ਸਭਿ ਧਿਆਵਹਿ ਸਭਿ ਧਿਆਵਹਿ ਤੁਧੁ ਜੀ ਹਰਿ ਸਚੇ ਸਿਰਜਣਹਾਰਾ ॥
ਸਭਿ ਜੀਅ ਤੁਮਾਰੇ ਜੀ ਤੂੰ ਜੀਆ ਕਾ ਦਾਤਾਰਾ ॥
ਹਰਿ ਧਿਆਵਹੁ ਸੰਤਹੁ ਜੀ ਸਭਿ ਦੂਖ ਵਿਸਾਰਣਹਾਰਾ ॥
ਹਰਿ ਆਪੇ ਠਾਕੁਰੁ ਹਰਿ ਆਪੇ ਸੇਵਕੁ ਜੀ ਕਿਆ ਨਾਨਕ ਜੰਤ ਵਿਚਾਰਾ ॥੧॥
ਤੂੰ ਘਟ ਘਟ ਅੰਤਰਿ ਸਰਬ ਨਿਰੰਤਰਿ ਜੀ ਹਰਿ ਏਕੋ ਪੁਰਖੁ ਸਮਾਣਾ ॥
ਇਕਿ ਦਾਤੇ ਇਕਿ ਭੇਖਾਰੀ ਜੀ ਸਭਿ ਤੇਰੇ ਚੋਜ ਵਿਡਾਣਾ ॥
ਤੂੰ ਆਪੇ ਦਾਤਾ ਆਪੇ ਭੁਗਤਾ ਜੀ ਹਉ ਤੁਧੁ ਬਿਨੁ ਅਵਰੁ ਨ ਜਾਣਾ ॥
ਤੂੰ ਪਾਰਬ੍ਰਹਮੁ ਬੇਅੰਤੁ ਬੇਅੰਤੁ ਜੀ ਤੇਰੇ ਕਿਆ ਗੁਣ ਆਖਿ ਵਖਾਣਾ ॥
ਜੋ ਸੇਵਹਿ ਜੋ ਸੇਵਹਿ ਤੁਧੁ ਜੀ ਜਨੁ ਨਾਨਕੁ ਤਿਨ ਕੁਰਬਾਣਾ ॥੨॥
ਹਰਿ ਧਿਆਵਹਿ ਹਰਿ ਧਿਆਵਹਿ ਤੁਧੁ ਜੀ ਸੇ ਜਨ ਜੁਗ ਮਹਿ ਸੁਖਵਾਸੀ ॥
ਸੇ ਮੁਕਤੁ ਸੇ ਮੁਕਤੁ ਭਏ ਜਿਨ ਹਰਿ ਧਿਆਇਆ ਜੀ ਤਿਨ ਤੂਟੀ ਜਮ ਕੀ ਫਾਸੀ ॥
ਜਿਨ ਨਿਰਭਉ ਜਿਨ ਹਰਿ ਨਿਰਭਉ ਧਿਆਇਆ ਜੀ ਤਿਨ ਕਾ ਭਉ ਸਭੁ ਗਵਾਸੀ ॥
ਜਿਨ ਸੇਵਿਆ ਜਿਨ ਸੇਵਿਆ ਮੇਰਾ ਹਰਿ ਜੀ ਤੇ ਹਰਿ ਹਰਿ ਰੂਪਿ ਸਮਾਸੀ ॥
ਸੇ ਧੰਨੁ ਸੇ ਧੰਨੁ ਜਿਨ ਹਰਿ ਧਿਆਇਆ ਜੀ ਜਨੁ ਨਾਨਕੁ ਤਿਨ ਬਲਿ ਜਾਸੀ ॥੩॥
ਤੇਰੀ ਭਗਤਿ ਤੇਰੀ ਭਗਤਿ ਭੰਡਾਰ ਜੀ ਭਰੇ ਬਿਅੰਤ ਬੇਅੰਤਾ ॥
ਤੇਰੇ ਭਗਤ ਤੇਰੇ ਭਗਤ ਸਲਾਹਨਿ ਤੁਧੁ ਜੀ ਹਰਿ ਅਨਿਕ ਅਨੇਕ ਅਨੰਤਾ ॥
ਤੇਰੀ ਅਨਿਕ ਤੇਰੀ ਅਨਿਕ ਕਰਹਿ ਹਰਿ ਪੂਜਾ ਜੀ ਤਪੁ ਤਾਪਹਿ ਜਪਹਿ ਬੇਅੰਤਾ ॥
ਤੇਰੇ ਅਨੇਕ ਤੇਰੇ ਅਨੇਕ ਪੜਹਿ ਬਹੁ ਸਿਮ੍ਰਿਤਿ ਸਾਸਤ ਜੀ ਕਰਿ ਕਿਰਿਆ ਖਟੁ ਕਰਮ ਕਰੰਤਾ ॥
ਸੇ ਭਗਤ ਸੇ ਭਗਤ ਭਲੇ ਜਨ ਨਾਨਕ ਜੀ ਜੋ ਭਾਵਹਿ ਮੇਰੇ ਹਰਿ ਭਗਵੰਤਾ ॥੪॥
ਤੂੰ ਆਦਿ ਪੁਰਖੁ ਅਪਰੰਪਰੁ ਕਰਤਾ ਜੀ ਤੁਧੁ ਜੇਵਡੁ ਅਵਰੁ ਨ ਕੋਈ ॥
ਤੂੰ ਜੁਗੁ ਜੁਗੁ ਏਕੋ ਸਦਾ ਸਦਾ ਤੂੰ ਏਕੋ ਜੀ ਤੂੰ ਨਿਹਚਲੁ ਕਰਤਾ ਸੋਈ ॥
ਤੁਧੁ ਆਪੇ ਭਾਵੈ ਸੋਈ ਵਰਤੈ ਜੀ ਤੂੰ ਆਪੇ ਕਰਹਿ ਸੁ ਹੋਈ ॥
ਤੁਧੁ ਆਪੇ ਸ੍ਰਿਸਟਿ ਸਭ ਉਪਾਈ ਜੀ ਤੁਧੁ ਆਪੇ ਸਿਰਜਿ ਸਭ ਗੋਈ ॥
ਜਨੁ ਨਾਨਕੁ ਗੁਣ ਗਾਵੈ ਕਰਤੇ ਕੇ ਜੀ ਜੋ ਸਭਸੈ ਕਾ ਜਾਣੋਈ ॥੫॥੧॥`,
        transliteration: `raag aasaa mahalaa 4 so purakh |
ik oankaar satigur prasaad |
so purakh niranjan har purakh niranjan har agamaa agam apaaraa |
sabh dhiaaveh sabh dhiaaveh tudh jee har sache sirajanahaaraa |
sabh jeea tumaare jee toon jeea kaa daataaraa |
har dhiaavahu santahu jee sabh dookh visaaranahaaraa |
har aape tthaakur har aape sevak jee kiaa naanak jant vichaaraa |1|
toon ghatt ghatt antar sarab nirantar jee har eko purakh samaanaa |
eik daate ik bhekhaaree jee sabh tere choj viddaanaa |
toon aape daataa aape bhugataa jee hau tudh bin avar na jaanaa |
toon paarabraham beant beant jee tere kiaa gun aakh vakhaanaa |
jo seveh jo seveh tudh jee jan naanak tin kurabaanaa |2|
har dhiaaveh har dhiaaveh tudh jee se jan jug meh sukhavaasee |
se mukat se mukat bhe jin har dhiaaeaa jee tin toottee jam kee faasee |
jin nirbhau jin har nirbhau dhiaaeaa jee tin kaa bhau sabh gavaasee |
jin seviaa jin seviaa meraa har jee te har har roop samaasee |
se dhan se dhan jin har dhiaaeaa jee jan naanak tin bal jaasee |3|
teree bhagat teree bhagat bhanddaar jee bhare biant beantaa |
tere bhagat tere bhagat salaahan tudh jee har anik anek anantaa |
teree anik teree anik kareh har poojaa jee tap taapeh japeh beantaa |
tere anek tere anek parreh bahu simrit saasat jee kar kiriaa khatt karam karantaa |
se bhagat se bhagat bhale jan naanak jee jo bhaaveh mere har bhagavantaa |4|
toon aad purakh aparanpar karataa jee tudh jevadd avar na koee |
toon jug jug eko sadaa sadaa toon eko jee toon nihachal karataa soee |
tudh aape bhaavai soee varatai jee toon aape kareh su hoee |
tudh aape srisatt sabh upaaee jee tudh aape siraj sabh goee |
jan naanak gun gaavai karate ke jee jo sabhasai kaa jaanoee |5|1|`,
        meaning: `Raag Aasaa, Fourth Mehl, So Purakh ~ That Primal Being: One Universal Creator God. By The Grace Of The True Guru: That Primal Being is Immaculate and Pure. The Lord, the Primal Being, is Immaculate and Pure. The Lord is Inaccessible, Unreachable and Unrivalled. All meditate, all meditate on You, Dear Lord, O True Creator Lord. All living beings are Yours-You are the Giver of all souls. Meditate on the Lord, O Saints; He is the Dispeller of all sorrow. The Lord Himself is the Master, the Lord Himself is the Servant. O Nanak, the poor beings are wretched and miserable! ||1|| You are constant in each and every heart, and in all things. O Dear Lord, you are the One. Some are givers, and some are beggars. This is all Your Wondrous Play. You Yourself are the Giver, and You Yourself are the Enjoyer. I know no other than You. You are the Supreme Lord God, Limitless and Infinite. What Virtues of Yours can I speak of and describe? Unto those who serve You, unto those who serve You, Dear Lord, servant Nanak is a sacrifice. ||2|| Those who meditate on You, Lord, those who meditate on You-those humble beings dwell in peace in this world. They are liberated, they are liberated-those who meditate on the Lord. For them, the noose of death is cut away. Those who meditate on the Fearless One, on the Fearless Lord-all their fears are dispelled. Those who serve, those who serve my Dear Lord, are absorbed into the Being of the Lord, Har, Har. Blessed are they, blessed are they, who meditate on their Dear Lord. Servant Nanak is a sacrifice to them. ||3|| Devotion to You, devotion to You, is a treasure overflowing, infinite and beyond measure. Your devotees, Your devotees praise You, Dear Lord, in many and various and countless ways. For You, many, for You, so very many perform worship services, O Dear Infinite Lord; they practice disciplined meditation and chant endlessly. For You, many, for You, so very many read the various Simritees and Shaastras. They perform rituals and religious rites. Those devotees, those devotees are sublime, O servant Nanak, who are pleasing to my Dear Lord God. ||4|| You are the Primal Being, the Most Wonderful Creator. There is no other as Great as You. Age after age, You are the One. Forever and ever, You are the One. You never change, O Creator Lord. Everything happens according to Your Will. You Yourself accomplish all that occurs. You Yourself created the entire universe, and having fashioned it, You Yourself shall destroy it all. Servant Nanak sings the Glorious Praises of the Dear Creator, the Knower of all. ||5||1||`,
        meaning_pa: `ਰਾਗ ਆਸਾ ਵਿੱਚ ਗੁਰੂ ਰਾਮਦਾਸ ਜੀ ਦੀ ਬਾਣੀ 'ਸੋ-ਪੁਰਖੁ'। ਅਕਾਲ ਪੁਰਖ ਇੱਕ ਹੈ ਅਤੇ ਸਤਿਗੁਰੂ ਦੀ ਕਿਰਪਾ ਨਾਲ ਮਿਲਦਾ ਹੈ। ਉਹ ਪਰਮਾਤਮਾ ਸਾਰੇ ਜੀਵਾਂ ਵਿੱਚ ਵਿਆਪਕ ਹੈ (ਫਿਰ ਵੀ) ਮਾਇਆ ਦੇ ਪ੍ਰਭਾਵ ਤੋਂ ਉਤਾਂਹ ਹੈ, ਅਪਹੁੰਚ ਹੈ ਅਤੇ ਬੇਅੰਤ ਹੈ। ਹੇ ਸਦਾ ਕਾਇਮ ਰਹਿਣ ਵਾਲੇ ਅਤੇ ਸਭ ਜੀਵਾਂ ਨੂੰ ਪੈਦਾ ਕਰਨ ਵਾਲੇ ਹਰੀ! ਸਾਰੇ ਜੀਵ ਤੈਨੂੰ ਸਦਾ ਸਿਮਰਦੇ ਹਨ, ਤੇਰਾ ਧਿਆਨ ਧਰਦੇ ਹਨ। ਹੇ ਪ੍ਰਭੂ! ਸਾਰੇ ਜੀਵ ਤੇਰੇ ਹੀ ਪੈਦਾ ਕੀਤੇ ਹੋਏ ਹਨ, ਤੂੰ ਹੀ ਸਭ ਜੀਵਾਂ ਦਾ ਰਾਜ਼ਕ ਹੈਂ। ਹੇ ਸੰਤ ਜਨੋ! ਉਸ ਪਰਮਾਤਮਾ ਦਾ ਧਿਆਨ ਧਰਿਆ ਕਰੋ, ਉਹ ਸਾਰੇ ਦੁੱਖਾਂ ਦਾ ਨਾਸ ਕਰਨ ਵਾਲਾ ਹੈ। ਉਹ (ਸਭ ਜੀਵਾਂ ਵਿਚ ਵਿਆਪਕ ਹੋਣ ਕਰਕੇ) ਆਪ ਹੀ ਮਾਲਕ ਹੈ ਅਤੇ ਆਪ ਹੀ ਸੇਵਕ ਹੈ। ਹੇ ਨਾਨਕ! ਉਸ ਤੋਂ ਬਿਨਾ) ਜੀਵ ਵਿਚਾਰੇ ਕੀਹ ਹਨ? (ਉਸ ਹਰੀ ਤੋਂ ਵੱਖਰੀ ਜੀਵਾਂ ਦੀ ਕੋਈ ਹਸਤੀ ਨਹੀਂ) ॥੧॥ ਹੇ ਹਰੀ! ਤੂੰ ਹਰੇਕ ਸਰੀਰ ਵਿਚ ਵਿਆਪਕ ਹੈਂ; ਤੂੰ ਸਾਰੇ ਜੀਵਾਂ ਵਿਚ ਇਕ-ਰਸ ਮੌਜੂਦ ਹੈਂ, ਤੂੰ ਇਕ ਆਪ ਹੀ ਸਭ ਵਿਚ ਸਮਾਇਆ ਹੋਇਆ ਹੈਂ। (ਫਿਰ ਭੀ) ਕਈ ਜੀਵ ਦਾਨੀ ਹਨ, ਕਈ ਜੀਵ ਮੰਗਤੇ ਹਨ-ਇਹ ਸਾਰੇ ਤੇਰੇ ਹੀ ਅਚਰਜ ਤਮਾਸ਼ੇ ਹਨ, (ਕਿਉਂਕਿ ਅਸਲ ਵਿਚ) ਤੂੰ ਆਪ ਹੀ ਦਾਤਾਂ ਦੇਣ ਵਾਲਾ ਹੈਂ, ਤੇ, ਆਪ (ਹੀ ਉਹਨਾਂ ਦਾਤਾਂ ਨੂੰ) ਵਰਤਣ ਵਾਲਾ ਹੈਂ। (ਸਾਰੀ ਸ੍ਰਿਸ਼ਟੀ ਵਿਚ) ਮੈਂ ਤੈਥੋਂ ਬਿਨਾ ਕਿਸੇ ਹੋਰ ਨੂੰ ਨਹੀਂ ਪਛਾਣਦਾ (ਤੈਥੋਂ ਬਿਨਾ ਕੋਈ ਹੋਰ ਨਹੀਂ ਦਿੱਸਦਾ)। ਤੂੰ ਬੇਅੰਤ ਪਾਰਬ੍ਰਹਮ ਹੈਂ। ਮੈਂ ਤੇਰੇ ਕੇਹੜੇ ਕੇਹੜੇ ਗੁਣ ਗਾ ਕੇ ਦੱਸਾਂ? ਹੇ ਪ੍ਰਭੂ! ਜੇਹੜੇ ਮਨੁੱਖ ਤੈਨੂੰ ਯਾਦ ਕਰਦੇ ਹਨ ਤੈਨੂੰ ਸਿਮਰਦੇ ਹਨ (ਤੇਰਾ) ਦਾਸ ਨਾਨਕ ਉਹਨਾਂ ਤੋਂ ਸਦਕੇ ਜਾਂਦਾ ਹੈ ॥੨॥ ਹੇ ਪ੍ਰਭੂ ਜੀ! ਜੇਹੜੇ ਮਨੁੱਖ ਤੈਨੂੰ ਸਿਮਰਦੇ ਹਨ ਤੇਰਾ ਧਿਆਨ ਧਰਦੇ ਹਨ, ਉਹ ਬੰਦੇ ਆਪਣੀ ਜ਼ਿੰਦਗੀ ਵਿਚ ਸੁਖੀ ਵੱਸਦੇ ਹਨ। ਜਿਨ੍ਹਾਂ ਮਨੁੱਖਾਂ ਨੇ ਹਰਿ-ਨਾਮ ਸਿਮਰਿਆ ਹੈ, ਉਹ ਸਦਾ ਲਈ ਮਾਇਆ ਦੇ ਬੰਧਨਾਂ ਤੋਂ ਆਜ਼ਾਦ ਹੋ ਗਏ ਹਨ, ਉਹਨਾਂ ਦੀ ਜਮਾਂ ਵਾਲੀ ਫਾਹੀ ਟੁੱਟ ਗਈ ਹੈ (ਆਤਮਕ ਮੌਤ ਉਹਨਾਂ ਦੇ ਨੇੜੇ ਨਹੀਂ ਢੁੱਕਦੀ)। ਜਿਨ੍ਹਾਂ ਬੰਦਿਆਂ ਨੇ ਸਦਾ ਨਿਰਭਉ ਪ੍ਰਭੂ ਦਾ ਨਾਮ ਸਿਮਰਿਆ ਹੈ; ਪ੍ਰਭੂ ਉਹਨਾਂ ਦਾ ਸਾਰਾ ਡਰ ਦੂਰ ਕਰ ਦੇਂਦਾ ਹੈ। ਜਿਨ੍ਹਾਂ ਮਨੁੱਖਾਂ ਨੇ ਪਿਆਰੇ ਪ੍ਰਭੂ ਨੂੰ ਸਦਾ ਸਿਮਰਿਆ ਹੈ, ਉਹ ਪ੍ਰਭੂ ਦੇ ਰੂਪ ਵਿਚ ਹੀ ਲੀਨ ਹੋ ਗਏ ਹਨ। ਭਾਗਾਂ ਵਾਲੇ ਹਨ ਉਹ ਮਨੁੱਖ, ਧੰਨ ਹਨ ਉਹ ਮਨੁੱਖ, ਜਿਨ੍ਹਾਂ ਪ੍ਰਭੂ ਦਾ ਨਾਮ ਸਿਮਰਿਆ ਹੈ। ਦਾਸ ਨਾਨਕ ਉਹਨਾਂ ਤੋਂ ਸਦਕੇ ਜਾਂਦਾ ਹੈ ॥੩॥ ਹੇ ਪ੍ਰਭੂ! ਤੇਰੀ ਭਗਤੀ ਦੇ ਬੇਅੰਤ ਖ਼ਜਾਨੇ ਭਰੇ ਪਏ ਹਨ। ਹੇ ਹਰੀ! ਅਨੇਕਾਂ ਤੇ ਬੇਅੰਤ ਤੇਰੇ ਭਗਤ ਤੇਰੀ ਸਿਫ਼ਤ-ਸਾਲਾਹ ਕਰ ਰਹੇ ਹਨ। ਹੇ ਪ੍ਰਭੂ! ਅਨੇਕਾਂ ਜੀਵ ਤੇਰੀ ਪੂਜਾ ਕਰਦੇ ਹਨ। ਬੇਅੰਤ ਜੀਵ (ਤੈਨੂੰ ਮਿਲਣ ਲਈ) ਤਪ ਸਾਧਦੇ ਹਨ। ਤੇਰੇ ਅਨੇਕਾਂ (ਸੇਵਕ) ਕਈ ਸਿਮ੍ਰਿਤਿਆਂ ਅਤੇ ਸ਼ਾਸਤ੍ਰ ਪੜ੍ਹਦੇ ਹਨ (ਅਤੇ ਉਹਨਾਂ ਦੇ ਦੱਸੇ ਹੋਏ) ਛੇ ਧਾਰਮਿਕ ਕੰਮ ਤੇ ਹੋਰ ਕਰਮ ਕਰਦੇ ਹਨ। ਹੇ ਦਾਸ ਨਾਨਕ! ਉਹੀ ਭਗਤ ਭਲੇ ਹਨ (ਉਹਨਾਂ ਦੀ ਹੀ ਘਾਲ ਕਬੂਲ ਹੋਈ ਜਾਣੋ) ਜੋ ਪਿਆਰੇ ਹਰਿ-ਭਗਵੰਤ ਨੂੰ ਪਿਆਰੇ ਲੱਗਦੇ ਹਨ ॥੪॥ ਹੇ ਪ੍ਰਭੂ! ਤੂੰ (ਸਾਰੇ ਜਗਤ ਦਾ) ਮੂਲ ਹੈਂ, ਸਭ ਵਿਚ ਵਿਆਪਕ ਹੈਂ, ਬੇਅੰਤ ਹੈਂ, ਸਭ ਦਾ ਪੈਦਾ ਕਰਨ ਵਾਲਾ ਹੈਂ, ਅਤੇ ਤੇਰੇ ਬਰਾਬਰ ਦਾ ਹੋਰ ਕੋਈ ਨਹੀਂ ਹੈ। ਤੂੰ ਹਰੇਕ ਜੁਗ ਵਿਚ ਇਕ ਆਪ ਹੀ ਹੈਂ, ਤੂੰ ਸਦਾ ਹੀ ਆਪ ਹੀ ਆਪ ਹੈਂ, ਤੂੰ ਸਦਾ ਕਾਇਮ ਰਹਿਣ ਵਾਲਾ ਹੈਂ, ਸਭ ਦਾ ਪੈਦਾ ਕਰਨ ਵਾਲਾ ਹੈਂ, ਸਭ ਦੀ ਸਾਰ ਲੈਣ ਵਾਲਾ ਹੈਂ। ਹੇ ਪ੍ਰਭੂ! ਜਗਤ ਵਿਚ ਉਹੀ ਹੁੰਦਾ ਹੈ ਜੋ ਤੈਨੂੰ ਆਪ ਨੂੰ ਚੰਗਾ ਲੱਗਦਾ ਹੈ, ਉਹੀ ਹੁੰਦਾ ਹੈ ਜੋ ਤੂੰ ਆਪ ਹੀ ਕਰਦਾ ਹੈਂ। ਹੇ ਪ੍ਰਭੂ! ਸਾਰੀ ਸ੍ਰਿਸ਼ਟੀ ਤੂੰ ਆਪ ਹੀ ਪੈਦਾ ਕੀਤੀ ਹੈ। ਤੂੰ ਆਪ ਹੀ ਇਸ ਨੂੰ ਪੈਦਾ ਕਰਕੇ ਆਪ ਹੀ ਇਸ ਨੂੰ ਨਾਸ ਕਰਦਾ ਹੈਂ। ਦਾਸ ਨਾਨਕ ਉਸ ਕਰਤਾਰ ਦੇ ਗੁਣ ਗਾਂਦਾ ਹੈ ਜੋ ਹਰੇਕ ਜੀਵ ਦੇ ਦਿਲ ਦੀ ਜਾਣਨ ਵਾਲਾ ਹੈ ॥੫॥੧॥`
      },
      {
        number: 9,
        sanskrit: `ਆਸਾ ਮਹਲਾ ੪ ॥
ਤੂੰ ਕਰਤਾ ਸਚਿਆਰੁ ਮੈਡਾ ਸਾਂਈ ॥
ਜੋ ਤਉ ਭਾਵੈ ਸੋਈ ਥੀਸੀ ਜੋ ਤੂੰ ਦੇਹਿ ਸੋਈ ਹਉ ਪਾਈ ॥੧॥ ਰਹਾਉ ॥
ਸਭ ਤੇਰੀ ਤੂੰ ਸਭਨੀ ਧਿਆਇਆ ॥
ਜਿਸ ਨੋ ਕ੍ਰਿਪਾ ਕਰਹਿ ਤਿਨਿ ਨਾਮ ਰਤਨੁ ਪਾਇਆ ॥
ਗੁਰਮੁਖਿ ਲਾਧਾ ਮਨਮੁਖਿ ਗਵਾਇਆ ॥
ਤੁਧੁ ਆਪਿ ਵਿਛੋੜਿਆ ਆਪਿ ਮਿਲਾਇਆ ॥੧॥
ਤੂੰ ਦਰੀਆਉ ਸਭ ਤੁਝ ਹੀ ਮਾਹਿ ॥
ਤੁਝ ਬਿਨੁ ਦੂਜਾ ਕੋਈ ਨਾਹਿ ॥
ਜੀਅ ਜੰਤ ਸਭਿ ਤੇਰਾ ਖੇਲੁ ॥
ਵਿਜੋਗਿ ਮਿਲਿ ਵਿਛੁੜਿਆ ਸੰਜੋਗੀ ਮੇਲੁ ॥੨॥
ਜਿਸ ਨੋ ਤੂ ਜਾਣਾਇਹਿ ਸੋਈ ਜਨੁ ਜਾਣੈ ॥
ਹਰਿ ਗੁਣ ਸਦ ਹੀ ਆਖਿ ਵਖਾਣੈ ॥
ਜਿਨਿ ਹਰਿ ਸੇਵਿਆ ਤਿਨਿ ਸੁਖੁ ਪਾਇਆ ॥
ਸਹਜੇ ਹੀ ਹਰਿ ਨਾਮਿ ਸਮਾਇਆ ॥੩॥
ਤੂ ਆਪੇ ਕਰਤਾ ਤੇਰਾ ਕੀਆ ਸਭੁ ਹੋਇ ॥
ਤੁਧੁ ਬਿਨੁ ਦੂਜਾ ਅਵਰੁ ਨ ਕੋਇ ॥
ਤੂ ਕਰਿ ਕਰਿ ਵੇਖਹਿ ਜਾਣਹਿ ਸੋਇ ॥
ਜਨ ਨਾਨਕ ਗੁਰਮੁਖਿ ਪਰਗਟੁ ਹੋਇ ॥੪॥੨॥`,
        transliteration: `aasaa mahalaa 4 |
toon karataa sachiaar maiddaa saanee |
jo tau bhaavai soee theesee jo toon dehi soee hau paaee |1| rahaau |
sabh teree toon sabhanee dhiaaeaa |
jis no kripaa kareh tin naam ratan paaeaa |
guramukh laadhaa manamukh gavaaeaa |
tudh aap vichhorriaa aap milaaeaa |1|
toon dareeaau sabh tujh hee maeh |
tujh bin doojaa koee naeh |
jeea jant sabh teraa khel |
vijog mil vichhurriaa sanjogee mel |2|
jis no too jaanaaeihi soee jan jaanai |
har gun sad hee aakh vakhaanai |
jin har seviaa tin sukh paaeaa |
sahaje hee har naam samaaeaa |3|
too aape karataa teraa keea sabh hoe |
tudh bin doojaa avar na koe |
too kar kar vekheh jaaneh soe |
jan naanak guramukh paragatt hoe |4|2|`,
        meaning: `Aasaa, Fourth Mehl: You are the True Creator, my Lord and Master. Whatever pleases You comes to pass. As You give, so do we receive. ||1||Pause|| All belong to You, all meditate on you. Those who are blessed with Your Mercy obtain the Jewel of the Naam, the Name of the Lord. The Gurmukhs obtain it, and the self-willed manmukhs lose it. You Yourself separate them from Yourself, and You Yourself reunite with them again. ||1|| You are the River of Life; all are within You. There is no one except You. All living beings are Your playthings. The separated ones meet, and by great good fortune, those suffering in separation are reunited once again. ||2|| They alone understand, whom You inspire to understand; they continually chant and repeat the Lord's Praises. Those who serve You find peace. They are intuitively absorbed into the Lord's Name. ||3|| You Yourself are the Creator. Everything that happens is by Your Doing. There is no one except You. You created the creation; You behold it and understand it. O servant Nanak, the Lord is revealed through the Gurmukh, the Living Expression of the Guru's Word. ||4||2||`,
        meaning_pa: `(ਹੇ ਪ੍ਰਭੂ!) ਤੂੰ ਸਭ ਦਾ ਪੈਦਾ ਕਰਨ ਵਾਲਾ ਹੈਂ, ਤੂੰ ਸਦਾ ਕਾਇਮ ਰਹਿਣ ਵਾਲਾ ਹੈਂ, ਤੂੰ ਹੀ ਮੇਰਾ ਖਸਮ ਹੈਂ। (ਜਗਤ ਵਿਚ) ਉਹੀ ਕੁਝ ਹੁੰਦਾ ਹੈ ਜੋ ਤੈਨੂੰ ਪਸੰਦ ਆਉਂਦਾ ਹੈ। ਜੋ ਕੁਝ ਤੂੰ ਦੇਵੇਂ, ਮੈਂ ਉਹੀ ਕੁਝ ਪ੍ਰਾਪਤ ਕਰਦਾ ਹਾਂ ॥੧॥ ਰਹਾਉ ॥ (ਹੇ ਪ੍ਰਭੂ!) ਸਾਰੀ ਸ੍ਰਿਸ਼ਟੀ ਤੇਰੀ (ਬਣਾਈ ਹੋਈ) ਹੈ, ਸਾਰੇ ਜੀਵ ਤੈਨੂੰ ਹੀ ਸਿਮਰਦੇ ਹਨ। ਜਿਸ ਉੱਤੇ ਤੂੰ ਦਇਆ ਕਰਦਾ ਹੈਂ ਉਸੇ ਨੇ ਤੇਰਾ ਰਤਨ ਵਰਗਾ (ਕੀਮਤੀ) ਨਾਮ ਲੱਭਾ ਹੈ। ਜੋ ਮਨੁੱਖ ਗੁਰੂ ਦੇ ਸਨਮੁਖ ਹੋਇਆ ਉਸ ਨੇ (ਇਹ ਰਤਨ) ਲੱਭ ਲਿਆ। ਜੋ ਆਪਣੇ ਮਨ ਦੇ ਪਿੱਛੇ ਤੁਰਿਆ, ਉਸ ਨੇ ਗਵਾ ਲਿਆ। (ਪਰ ਕਿਸੇ ਜੀਵ ਦੇ ਕੀਹ ਵੱਸ? ਹੇ ਪ੍ਰਭੂ!) ਜੀਵ ਨੂੰ ਤੂੰ ਆਪ ਹੀ (ਆਪਣੇ ਨਾਲੋਂ) ਵਿਛੋੜਦਾ ਹੈਂ, ਆਪ ਹੀ ਆਪਣੇ ਨਾਲ ਮਿਲਾਂਦਾ ਹੈਂ ॥੧॥ (ਹੇ ਪ੍ਰਭੂ!) ਤੂੰ (ਜ਼ਿੰਦਗੀ ਦਾ, ਮਾਨੋ, ਇਕ) ਦਰੀਆ ਹੈਂ, ਸਾਰੇ ਜੀਵ ਤੇਰੇ ਵਿਚ ਹੀ (ਮਾਨੋ, ਲਹਿਰਾਂ) ਹਨ। ਤੈਥੋਂ ਬਿਨਾ (ਤੇਰੇ ਵਰਗਾ) ਹੋਰ ਕੋਈ ਨਹੀਂ ਹੈ। ਇਹ ਸਾਰੇ ਜੀਆ ਜੰਤ ਤੇਰੀ (ਰਚੀ ਹੋਈ) ਖੇਡ ਹੈ। ਜਿਨ੍ਹਾਂ ਦੇ ਮੱਥੇ ਉਤੇ ਵਿਛੋੜੇ ਦਾ ਲੇਖ ਹੈ, ਉਹ ਮਨੁੱਖਾ ਜਨਮ ਪ੍ਰਾਪਤ ਕਰ ਕੇ ਭੀ ਤੈਥੋਂ ਵਿਛੁੜੇ ਹੋਏ ਹਨ। (ਪਰ ਤੇਰੀ ਰਜ਼ਾ ਅਨੁਸਾਰ) ਸੰਜੋਗਾਂ ਦੇ ਲੇਖ ਨਾਲ (ਫਿਰ ਤੇਰੇ ਨਾਲ) ਮਿਲਾਪ ਹੋ ਜਾਂਦਾ ਹੈ ॥੨॥ (ਹੇ ਪ੍ਰਭੂ!) ਜਿਸ ਮਨੁੱਖ ਨੂੰ ਤੂੰ ਆਪ ਸੂਝ ਬਖ਼ਸ਼ਦਾ ਹੈਂ, ਉਹ ਮਨੁੱਖ (ਜੀਵਨ ਦਾ ਸਹੀ ਰਸਤਾ) ਸਮਝਦਾ ਹੈ। ਉਹ ਮਨੁੱਖ, ਹੇ ਹਰੀ! ਸਦਾ ਤੇਰੇ ਗੁਣ ਗਾਂਦਾ ਹੈ, ਅਤੇ (ਹੋਰਨਾਂ ਨੂੰ) ਉਚਾਰ ਉਚਾਰ ਕੇ ਸੁਣਾਂਦਾ ਹੈ। (ਹੇ ਭਾਈ!) ਜਿਸ ਮਨੁੱਖ ਨੇ ਪਰਮਾਤਮਾ ਦਾ ਨਾਮ ਸਿਮਰਿਆ ਹੈ, ਉਸ ਨੇ ਸੁਖ ਹਾਸਲ ਕੀਤਾ ਹੈ। ਉਹ ਮਨੁੱਖ ਸਦਾ ਆਤਮਕ ਅਡੋਲਤਾ ਵਿਚ ਟਿਕਿਆ ਰਹਿ ਕੇ ਪ੍ਰਭੂ ਦੇ ਨਾਮ ਵਿਚ ਲੀਨ ਹੋ ਜਾਂਦਾ ਹੈ ॥੩॥ (ਹੇ ਪ੍ਰਭੂ!) ਤੂੰ ਆਪ ਹੀ ਸਭ ਕੁਝ ਪੈਦਾ ਕਰਨ ਵਾਲਾ ਹੈਂ, ਸਭ ਕੁਝ ਤੇਰਾ ਕੀਤਾ ਹੀ ਹੁੰਦਾ ਹੈ। ਤੈਥੋਂ ਬਿਨਾ (ਤੇਰੇ ਵਰਗਾ) ਹੋਰ ਕੋਈ ਨਹੀਂ ਹੈ। ਜੀਵ ਪੈਦਾ ਕਰ ਕੇ ਉਹਨਾਂ ਦੀ ਸੰਭਾਲ ਭੀ ਤੂੰ ਆਪ ਹੀ ਕਰਦਾ ਹੈਂ, ਤੇ, ਹਰੇਕ (ਦੇ ਦਿਲ) ਦੀ ਸਾਰ ਜਾਣਦਾ ਹੈਂ। ਹੇ ਦਾਸ ਨਾਨਕ! ਜੋ ਮਨੁੱਖ ਗੁਰੂ ਦੀ ਸ਼ਰਨ ਪੈਂਦਾ ਹੈ ਉਸ ਦੇ ਅੰਦਰ ਪਰਮਾਤਮਾ ਪਰਗਟ ਹੋ ਜਾਂਦਾ ਹੈ ॥੪॥੨॥{11-12}`
      },
      {
        number: 10,
        sanskrit: `ਆਸਾ ਮਹਲਾ ੧ ॥
ਤਿਤੁ ਸਰਵਰੜੈ ਭਈਲੇ ਨਿਵਾਸਾ ਪਾਣੀ ਪਾਵਕੁ ਤਿਨਹਿ ਕੀਆ ॥
ਪੰਕਜੁ ਮੋਹ ਪਗੁ ਨਹੀ ਚਾਲੈ ਹਮ ਦੇਖਾ ਤਹ ਡੂਬੀਅਲੇ ॥੧॥
ਮਨ ਏਕੁ ਨ ਚੇਤਸਿ ਮੂੜ ਮਨਾ ॥
ਹਰਿ ਬਿਸਰਤ ਤੇਰੇ ਗੁਣ ਗਲਿਆ ॥੧॥ ਰਹਾਉ ॥
ਨਾ ਹਉ ਜਤੀ ਸਤੀ ਨਹੀ ਪੜਿਆ ਮੂਰਖ ਮੁਗਧਾ ਜਨਮੁ ਭਇਆ ॥
ਪ੍ਰਣਵਤਿ ਨਾਨਕ ਤਿਨ ਕੀ ਸਰਣਾ ਜਿਨ ਤੂ ਨਾਹੀ ਵੀਸਰਿਆ ॥੨॥੩॥`,
        transliteration: `aasaa mahalaa 1 |
tit saravararrai bheele nivaasaa paanee paavak tineh keea |
pankaj moh pag nahee chaalai ham dekhaa teh ddoobeeale |1|
man ek na chetas moorr manaa |
har bisarat tere gun galiaa |1| rahaau |
naa hau jatee satee nahee parriaa moorakh mugadhaa janam bheaa |
pranavat naanak tin kee saranaa jin too naahee veesariaa |2|3|`,
        meaning: `Aasaa, First Mehl: In that pool, people have made their homes, but the water there is as hot as fire! In the swamp of emotional attachment, their feet cannot move. I have seen them drowning there. ||1|| In your mind, you do not remember the One Lord-you fool! You have forgotten the Lord; your virtues shall wither away. ||1||Pause|| I am not celibate, nor truthful, nor scholarly. I was born foolish and ignorant into this world. Prays Nanak, I seek the Sanctuary of those who have not forgotten You, O Lord! ||2||3||`,
        meaning_pa: `(ਹੇ ਭਾਈ! ਸਾਡੀ ਜੀਵਾਂ ਦੀ) ਉਸ ਭਿਆਨਕ (ਸੰਸਾਰ-) ਸਰੋਵਰ ਵਿਚ ਵੱਸੋਂ ਹੈ (ਜਿਸ ਵਿਚ) ਉਸ ਪ੍ਰਭੂ ਨੇ ਆਪ ਹੀ ਪਾਣੀ (ਦੇ ਥਾਂ ਤ੍ਰਿਸ਼ਨਾ ਦੀ) ਅੱਗ ਪੈਦਾ ਕੀਤੀ ਹੋਈ ਹੈ। (ਅਤੇ ਉਸ ਭਿਆਨਕ ਸਰੀਰ ਵਿਚ) ਜੋ ਮੋਹ ਦਾ ਚਿੱਕੜ ਹੈ (ਉਸ ਵਿਚ ਜੀਵਾਂ ਦਾ) ਪੈਰ ਚੱਲ ਨਹੀਂ ਸਕਦਾ (ਜੀਵ ਮੋਹ ਦੇ ਚਿੱਕੜ ਵਿਚ ਫਸੇ ਪਏ ਹਨ)। ਸਾਡੇ ਸਾਹਮਣੇ ਹੀ (ਅਨੇਕਾਂ ਜੀਵ ਮੋਹ ਦੇ ਚਿੱਕੜ ਵਿਚ ਫਸ ਕੇ) ਉਸ (ਤ੍ਰਿਸ਼ਨਾ-ਅੱਗ ਦੇ ਅਸਗਾਹ ਸਮੁੰਦਰ) ਵਿਚ ਡੁੱਬਦੇ ਜਾ ਰਹੇ ਹਨ ॥੧॥ ਹੇ ਮਨ! ਹੇ ਮੂਰਖ ਮਨ! ਤੂੰ ਇੱਕ ਪਰਮਾਤਮਾ ਨੂੰ ਯਾਦ ਨਹੀਂ ਕਰਦਾ। ਤੂੰ ਜਿਉਂ ਜਿਉਂ ਪਰਮਾਤਮਾ ਨੂੰ ਵਿਸਾਰਦਾ ਜਾ ਰਿਹਾ ਹੈਂ, ਤੇਰੇ (ਅੰਦਰੋਂ) ਗੁਣ ਘਟਦੇ ਜਾ ਰਹੇ ਹਨ ॥੧॥ ਰਹਾਉ ॥ (ਹੇ ਪ੍ਰਭੂ!) ਨਾਹ ਮੈਂ ਜਤੀ ਹਾਂ, ਨਾਹ ਮੈਂ ਸਤੀ ਹਾਂ, ਨਾਹ ਹੀ ਮੈਂ ਪੜ੍ਹਿਆ ਹੋਇਆ ਹਾਂ, ਮੇਰਾ ਜੀਵਨ ਤਾਂ ਮੂਰਖ ਬੇਸਮਝਾਂ ਵਾਲਾ ਬਣਿਆ ਹੋਇਆ ਹੈ (ਭਾਵ, ਜਤ, ਸਤ ਅਤੇ ਵਿੱਦਿਆ ਇਸ ਤ੍ਰਿਸ਼ਨਾ ਦੀ ਅੱਗ ਅਤੇ ਮੋਹ ਦੇ ਚਿੱਕੜ ਵਿਚ ਡਿਗਣੋਂ ਬਚਾ ਨਹੀਂ ਸਕਦੇ। ਜੇ ਮਨੁੱਖ ਪ੍ਰਭੂ ਨੂੰ ਭੁਲਾ ਦੇਵੇ, ਤਾਂ ਜਤ ਸਤ ਵਿੱਦਿਆ ਦੇ ਹੁੰਦਿਆਂ ਭੀ ਮਨੁੱਖ ਦੀ ਜ਼ਿੰਦਗੀ ਮਹਾਂ ਮੂਰਖਾਂ ਵਾਲੀ ਹੁੰਦੀ ਹੈ)। ਸੋ, ਨਾਨਕ ਬੇਨਤੀ ਕਰਦਾ ਹੈ (ਹੇ ਪ੍ਰਭੂ! ਮੈਨੂੰ) ਉਹਨਾਂ (ਗੁਰਮੁਖਾਂ) ਦੀ ਸਰਨ ਵਿਚ (ਰੱਖ), ਜਿਨ੍ਹਾਂ ਨੂੰ ਤੂੰ ਨਹੀਂ ਭੁੱਲਿਆ (ਜਿਨ੍ਹਾਂ ਨੂੰ ਤੇਰੀ ਯਾਦ ਨਹੀਂ ਭੁੱਲੀ) ॥੨॥੩॥`
      },
      {
        number: 11,
        sanskrit: `ਆਸਾ ਮਹਲਾ ੫ ॥
ਭਈ ਪਰਾਪਤਿ ਮਾਨੁਖ ਦੇਹੁਰੀਆ ॥
ਗੋਬਿੰਦ ਮਿਲਣ ਕੀ ਇਹ ਤੇਰੀ ਬਰੀਆ ॥
ਅਵਰਿ ਕਾਜ ਤੇਰੈ ਕਿਤੈ ਨ ਕਾਮ ॥
ਮਿਲੁ ਸਾਧਸੰਗਤਿ ਭਜੁ ਕੇਵਲ ਨਾਮ ॥੧॥
ਸਰੰਜਾਮਿ ਲਾਗੁ ਭਵਜਲ ਤਰਨ ਕੈ ॥
ਜਨਮੁ ਬ੍ਰਿਥਾ ਜਾਤ ਰੰਗਿ ਮਾਇਆ ਕੈ ॥੧॥ ਰਹਾਉ ॥
ਜਪੁ ਤਪੁ ਸੰਜਮੁ ਧਰਮੁ ਨ ਕਮਾਇਆ ॥
ਸੇਵਾ ਸਾਧ ਨ ਜਾਨਿਆ ਹਰਿ ਰਾਇਆ ॥
ਕਹੁ ਨਾਨਕ ਹਮ ਨੀਚ ਕਰੰਮਾ ॥
ਸਰਣਿ ਪਰੇ ਕੀ ਰਾਖਹੁ ਸਰਮਾ ॥੨॥੪॥`,
        transliteration: `aasaa mahalaa 5 |
bhee paraapat maanukh dehureea |
gobind milan kee ih teree bareea |
avar kaaj terai kitai na kaam |
mil saadhasangat bhaj keval naam |1|
saranjaam laag bhavajal taran kai |
janam brithaa jaat rang maaeaa kai |1| rahaau |
jap tap sanjam dharam na kamaaeaa |
sevaa saadh na jaaniaa har raaeaa |
kahu naanak ham neech karamaa |
saran pare kee raakhahu saramaa |2|4|`,
        meaning: `Aasaa, Fifth Mehl: This human body has been given to you. This is your chance to meet the Lord of the Universe. Nothing else will work. Join the Saadh Sangat, the Company of the Holy; vibrate and meditate on the Jewel of the Naam. ||1|| Make every effort to cross over this terrifying world-ocean. You are squandering this life uselessly in the love of Maya. ||1||Pause|| I have not practiced meditation, self-discipline, self-restraint or righteous living. I have not served the Holy; I have not acknowledged the Lord, my King. Says Nanak, my actions are contemptible! O Lord, I seek Your Sanctuary; please, preserve my honor! ||2||4||`,
        meaning_pa: `(ਹੇ ਭਾਈ!) ਤੈਨੂੰ ਸੋਹਣਾ ਮਨੁੱਖਾ ਸਰੀਰ ਮਿਲਿਆ ਹੈ। ਪਰਮਾਤਮਾ ਨੂੰ ਮਿਲਣ ਦਾ ਤੇਰੇ ਲਈ ਇਹੀ ਮੌਕਾ ਹੈ। (ਜੇ ਪ੍ਰਭੂ ਨੂੰ ਮਿਲਣ ਲਈ ਕੋਈ ਉੱਦਮ ਨਾਹ ਕੀਤਾ, ਤਾਂ) ਹੋਰ ਸਾਰੇ ਕੰਮ ਤੇਰੇ ਆਪਣੇ ਕਿਸੇ ਭੀ ਅਰਥ ਨਹੀਂ (ਤੇਰੀ ਜਿੰਦ ਨੂੰ ਕੋਈ ਲਾਭ ਨਹੀਂ ਅਪੜਾਣਗੇ)। (ਇਸ ਵਾਸਤੇ) ਸਾਧ ਸੰਗਤਿ ਵਿਚ (ਭੀ) ਮਿਲ ਬੈਠਿਆ ਕਰ (ਸਾਧ ਸੰਗਤਿ ਵਿਚ ਬੈਠ ਕੇ ਭੀ) ਸਿਰਫ਼ ਪਰਮਾਤਮਾ ਦਾ ਨਾਮ ਸਿਮਰਿਆ ਕਰ (ਸਾਧ ਸੰਗਤਿ ਵਿਚ ਬੈਠਣ ਦਾ ਭੀ ਤਦੋਂ ਹੀ ਲਾਭ ਹੈ, ਜੇ ਉਥੇ ਤੂੰ ਪਰਮਾਤਮਾ ਦੀ ਸਿਫ਼ਤਿ-ਸਲਾਹ ਵਿਚ ਜੁੜੇਂ) ॥੧॥ (ਹੇ ਭਾਈ!) ਸੰਸਾਰ-ਸਮੁੰਦਰ ਤੋਂ ਪਾਰ ਲੰਘਣ ਦੇ (ਭੀ) ਆਹਰੇ ਲੱਗ। (ਨਹੀਂ ਤਾਂ ਨਿਰੇ) ਮਾਇਆ ਦੇ ਪਿਆਰ ਵਿਚ ਮਨੁੱਖਾ ਜਨਮ ਵਿਅਰਥ ਜਾ ਰਿਹਾ ਹੈ ॥੧॥ ਰਹਾਉ ॥ (ਹੇ ਭਾਈ!) ਤੂੰ ਪ੍ਰਭੂ ਦਾ ਸਿਮਰਨ ਨਹੀਂ ਕਰਦਾ, (ਪ੍ਰਭੂ ਨੂੰ ਮਿਲਣ ਲਈ ਸੇਵਾ ਆਦਿਕ ਦਾ ਕੋਈ) ਉੱਦਮ ਨਹੀਂ ਕਰਦਾ, ਮਨ ਨੂੰ ਵਿਕਾਰਾਂ ਵਲੋਂ ਰੋਕਣ ਦਾ ਤੂੰ ਜਤਨ ਨਹੀਂ ਕਰਦਾ-ਤੂੰ (ਅਜੇਹਾ ਕੋਈ) ਧਰਮ ਨਹੀਂ ਕਮਾਂਦਾ। ਨਾਹ ਤੂੰ ਗੁਰੂ ਦੀ ਸੇਵਾ ਕੀਤੀ, ਨਾਹ ਤੂੰ ਮਾਲਕ ਪ੍ਰਭੂ ਦਾ ਨਾਮ ਸਿਮਰਨ ਕੀਤਾ। (ਪ੍ਰਭੂ ਦੇ ਦਰ ਤੇ ਅਰਦਾਸ ਕਰਦਾ ਹੋਇਆ) ਨਾਨਕ ਆਖਦਾ ਹੈ (ਹੇ ਪ੍ਰਭੂ!) ਅਸੀਂ ਜੀਵ ਮੰਦ-ਕਰਮੀ ਹਾਂ (ਤੇਰੀ ਸਰਨ ਪਏ ਹਾਂ), ਸਰਨ ਪਿਆਂ ਦੀ ਲਾਜ ਰੱਖ ॥੨॥੪॥`
      },
      {
        number: 12,
        sanskrit: `ੴ ਵਾਹਿਗੁਰੂ ਜੀ ਕੀ ਫਤਹ ॥
ਪਾਤਿਸਾਹੀ ੧੦ ॥`,
        transliteration: `ik oankaar vaahiguroo jee kee fatah |
paatisaahee 10 |`,
        meaning: `The Lord is One and the Victory is of the True Guru. (By) Tenth Master, (in) Deviant Metre,`,
        meaning_pa: `ਪਾਤਿਸ਼ਾਹੀ ੧੦:`
      },
      {
        number: 13,
        sanskrit: `ਕਬਿਯੋ ਬਾਚ ਬੇਨਤੀ ॥ ਚੌਪਈ ॥
ਹਮਰੀ ਕਰੋ ਹਾਥ ਦੈ ਰੱਛਾ ॥
ਪੂਰਨ ਹੋਇ ਚਿਤ ਕੀ ਇੱਛਾ ॥
ਤਵ ਚਰਨਨ ਮਨ ਰਹੈ ਹਮਾਰਾ ॥
ਅਪਨਾ ਜਾਨ ਕਰੋ ਪ੍ਰਤਿਪਾਰਾ ॥੩੭੭॥
ਹਮਰੇ ਦੁਸਟ ਸਭੈ ਤੁਮ ਘਾਵਹੁ ॥
ਆਪੁ ਹਾਥ ਦੈ ਮੋਹਿ ਬਚਾਵਹੁ ॥
ਸੁਖੀ ਬਸੈ ਮੋਰੋ ਪਰਿਵਾਰਾ ॥
ਸੇਵਕ ਸਿੱਖ ਸਭੈ ਕਰਤਾਰਾ ॥੩੭੮॥
ਮੋ ਰੱਛਾ ਨਿਜ ਕਰ ਦੈ ਕਰਿਯੈ ॥
ਸਭ ਬੈਰਨ ਕੋ ਆਜ ਸੰਘਰਿਯੈ ॥
ਪੂਰਨ ਹੋਇ ਹਮਾਰੀ ਆਸਾ ॥
ਤੋਰ ਭਜਨ ਕੀ ਰਹੈ ਪਿਆਸਾ ॥੩੭੯॥
ਤੁਮਹਿ ਛਾਡਿ ਕੋਈ ਅਵਰ ਨ ਧਿਯਾਊਂ ॥
ਜੋ ਬਰ ਚਹੋਂ ਸੁ ਤੁਮ ਤੇ ਪਾਊਂ ॥
ਸੇਵਕ ਸਿੱਖ ਹਮਾਰੇ ਤਾਰੀਅਹਿ ॥
ਚੁਨਿ ਚੁਨਿ ਸਤ੍ਰ ਹਮਾਰੇ ਮਾਰੀਅਹਿ ॥੩੮੦॥
ਆਪ ਹਾਥ ਦੈ ਮੁਝੈ ਉਬਰਿਯੈ ॥
ਮਰਨ ਕਾਲ ਕਾ ਤ੍ਰਾਸ ਨਿਵਰਿਯੈ ॥
ਹੂਜੋ ਸਦਾ ਹਮਾਰੇ ਪੱਛਾ ॥
ਸ੍ਰੀ ਅਸਿਧੁਜ ਜੂ ਕਰਿਯਹੁ ਰੱਛਾ ॥੩੮੧॥
ਰਾਖਿ ਲੇਹੁ ਮੁਹਿ ਰਾਖਨਹਾਰੇ ॥
ਸਾਹਿਬ ਸੰਤ ਸਹਾਇ ਪਿਯਾਰੇ ॥
ਦੀਨ ਬੰਧੁ ਦੁਸਟਨ ਕੇ ਹੰਤਾ ॥
ਤੁਮ ਹੋ ਪੁਰੀ ਚਤੁਰਦਸ ਕੰਤਾ ॥੩੮੨॥
ਕਾਲ ਪਾਇ ਬ੍ਰਹਮਾ ਬਪੁ ਧਰਾ ॥
ਕਾਲ ਪਾਇ ਸਿਵ ਜੂ ਅਵਤਰਾ ॥
ਕਾਲ ਪਾਇ ਕਰ ਬਿਸਨੁ ਪ੍ਰਕਾਸਾ ॥
ਸਕਲ ਕਾਲ ਕਾ ਕੀਆ ਤਮਾਸਾ ॥੩੮੩॥
ਜਵਨ ਕਾਲ ਜੋਗੀ ਸਿਵ ਕੀਓ ॥
ਬੇਦ ਰਾਜ ਬ੍ਰਹਮਾ ਜੂ ਥੀਓ ॥
ਜਵਨ ਕਾਲ ਸਭ ਲੋਕ ਸਵਾਰਾ ॥
ਨਮਸਕਾਰ ਹੈ ਤਾਹਿ ਹਮਾਰਾ ॥੩੮੪॥
ਜਵਨ ਕਾਲ ਸਭ ਜਗਤ ਬਨਾਯੋ ॥
ਦੇਵ ਦੈਤ ਜੱਛਨ ਉਪਜਾਯੋ ॥
ਆਦਿ ਅੰਤਿ ਏਕੈ ਅਵਤਾਰਾ ॥
ਸੋਈ ਗੁਰੂ ਸਮਝਿਯਹੁ ਹਮਾਰਾ ॥੩੮੫॥
ਨਮਸਕਾਰ ਤਿਸ ਹੀ ਕੋ ਹਮਾਰੀ ॥
ਸਕਲ ਪ੍ਰਜਾ ਜਿਨ ਆਪ ਸਵਾਰੀ ॥
ਸਿਵਕਨ ਕੋ ਸਿਵਗੁਨ ਸੁਖ ਦੀਓ ॥
ਸੱਤ੍ਰੁਨ ਕੋ ਪਲ ਮੋ ਬਧ ਕੀਓ ॥੩੮੬॥
ਘਟ ਘਟ ਕੇ ਅੰਤਰ ਕੀ ਜਾਨਤ ॥
ਭਲੇ ਬੁਰੇ ਕੀ ਪੀਰ ਪਛਾਨਤ ॥
ਚੀਟੀ ਤੇ ਕੁੰਚਰ ਅਸਥੂਲਾ ॥
ਸਭ ਪਰ ਕ੍ਰਿਪਾ ਦ੍ਰਿਸਟਿ ਕਰਿ ਫੂਲਾ ॥੩੮੭॥
ਸੰਤਨ ਦੁਖ ਪਾਏ ਤੇ ਦੁਖੀ ॥
ਸੁਖ ਪਾਏ ਸਾਧੁਨ ਕੇ ਸੁਖੀ ॥
ਏਕ ਏਕ ਕੀ ਪੀਰ ਪਛਾਨੈਂ ॥
ਘਟ ਘਟ ਕੇ ਪਟ ਪਟ ਕੀ ਜਾਨੈਂ ॥੩੮੮॥
ਜਬ ਉਦਕਰਖ ਕਰਾ ਕਰਤਾਰਾ ॥
ਪ੍ਰਜਾ ਧਰਤ ਤਬ ਦੇਹ ਅਪਾਰਾ ॥
ਜਬ ਆਕਰਖ ਕਰਤ ਹੋ ਕਬਹੂੰ ॥
ਤੁਮ ਮੈ ਮਿਲਤ ਦੇਹ ਧਰ ਸਭਹੂੰ ॥੩੮੯॥
ਜੇਤੇ ਬਦਨ ਸ੍ਰਿਸਟਿ ਸਭ ਧਾਰੈ ॥
ਆਪੁ ਆਪਨੀ ਬੂਝ ਉਚਾਰੈ ॥
ਤੁਮ ਸਭ ਹੀ ਤੇ ਰਹਤ ਨਿਰਾਲਮ ॥
ਜਾਨਤ ਬੇਦ ਭੇਦ ਅਰ ਆਲਮ ॥੩੯੦॥
ਨਿਰੰਕਾਰ ਨ੍ਰਿਬਿਕਾਰ ਨਿਰਲੰਭ ॥
ਆਦਿ ਅਨੀਲ ਅਨਾਦਿ ਅਸੰਭ ॥
ਤਾ ਕਾ ਮੂੜ੍ਹ ਉਚਾਰਤ ਭੇਦਾ ॥
ਜਾ ਕੋ ਭੇਵ ਨ ਪਾਵਤ ਬੇਦਾ ॥੩੯੧॥
ਤਾ ਕੋ ਕਰਿ ਪਾਹਨ ਅਨੁਮਾਨਤ ॥
ਮਹਾ ਮੂੜ੍ਹ ਕਛੁ ਭੇਦ ਨ ਜਾਨਤ ॥
ਮਹਾਦੇਵ ਕੋ ਕਹਤ ਸਦਾ ਸਿਵ ॥
ਨਿਰੰਕਾਰ ਕਾ ਚੀਨਤ ਨਹਿ ਭਿਵ ॥੩੯੨॥
ਆਪੁ ਆਪਨੀ ਬੁਧਿ ਹੈ ਜੇਤੀ ॥
ਬਰਨਤ ਭਿੰਨ ਭਿੰਨ ਤੁਹਿ ਤੇਤੀ ॥
ਤੁਮਰਾ ਲਖਾ ਨ ਜਾਇ ਪਸਾਰਾ ॥
ਕਿਹ ਬਿਧਿ ਸਜਾ ਪ੍ਰਥਮ ਸੰਸਾਰਾ ॥੩੯੩॥
ਏਕੈ ਰੂਪ ਅਨੂਪ ਸਰੂਪਾ ॥
ਰੰਕ ਭਯੋ ਰਾਵ ਕਹੀ ਭੂਪਾ ॥
ਅੰਡਜ ਜੇਰਜ ਸੇਤਜ ਕੀਨੀ ॥
ਉਤਭੁਜ ਖਾਨਿ ਬਹੁਰ ਰਚਿ ਦੀਨੀ ॥੩੯੪॥
ਕਹੂੰ ਫੂਲਿ ਰਾਜਾ ਹ੍ਵੈ ਬੈਠਾ ॥
ਕਹੂੰ ਸਿਮਟਿ ਭ੍ਯਿੋ ਸੰਕਰ ਇਕੈਠਾ ॥
ਸਗਰੀ ਸ੍ਰਿਸਟਿ ਦਿਖਾਇ ਅਚੰਭਵ ॥
ਆਦਿ ਜੁਗਾਦਿ ਸਰੂਪ ਸੁਯੰਭਵ ॥੩੯੫॥
ਅਬ ਰੱਛਾ ਮੇਰੀ ਤੁਮ ਕਰੋ ॥
ਸਿੱਖ ਉਬਾਰਿ ਅਸਿੱਖ ਸੰਘਰੋ ॥
ਦੁਸ਼ਟ ਜਿਤੇ ਉਠਵਤ ਉਤਪਾਤਾ ॥
ਸਕਲ ਮਲੇਛ ਕਰੋ ਰਣ ਘਾਤਾ ॥੩੯੬॥
ਜੇ ਅਸਿਧੁਜ ਤਵ ਸਰਨੀ ਪਰੇ ॥
ਤਿਨ ਕੇ ਦੁਸਟ ਦੁਖਿਤ ਹ੍ਵੈ ਮਰੇ ॥
ਪੁਰਖ ਜਵਨ ਪਗ ਪਰੇ ਤਿਹਾਰੇ ॥
ਤਿਨ ਕੇ ਤੁਮ ਸੰਕਟ ਸਭ ਟਾਰੇ ॥੩੯੭॥
ਜੋ ਕਲਿ ਕੋ ਇਕ ਬਾਰ ਧਿਐਹੈ ॥
ਤਾ ਕੇ ਕਾਲ ਨਿਕਟਿ ਨਹਿ ਐਹੈ ॥
ਰੱਛਾ ਹੋਇ ਤਾਹਿ ਸਭ ਕਾਲਾ ॥
ਦੁਸਟ ਅਰਿਸਟ ਟਰੇਂ ਤਤਕਾਲਾ ॥੩੯੮॥
ਕ੍ਰਿਪਾ ਦ੍ਰਿਸਟਿ ਤਨ ਜਾਹਿ ਨਿਹਰਿਹੋ ॥
ਤਾ ਕੇ ਤਾਪ ਤਨਕ ਮੋ ਹਰਿਹੋ ॥
ਰਿੱਧਿ ਸਿੱਧਿ ਘਰ ਮੋ ਸਭ ਹੋਈ ॥
ਦੁਸ਼ਟ ਛਾਹ ਛ੍ਵੈ ਸਕੈ ਨ ਕੋਈ ॥੩੯੯॥
ਏਕ ਬਾਰ ਜਿਨ ਤੁਮੈ ਸੰਭਾਰਾ ॥
ਕਾਲ ਫਾਸ ਤੇ ਤਾਹਿ ਉਬਾਰਾ ॥
ਜਿਨ ਨਰ ਨਾਮ ਤਿਹਾਰੋ ਕਹਾ ॥
ਦਾਰਿਦ ਦੁਸਟ ਦੋਖ ਤੇ ਰਹਾ ॥੪੦੦॥
ਖੜਗ ਕੇਤ ਮੈ ਸਰਣਿ ਤਿਹਾਰੀ ॥
ਆਪ ਹਾਥ ਦੈ ਲੇਹੁ ਉਬਾਰੀ ॥
ਸਰਬ ਠੌਰ ਮੋ ਹੋਹੁ ਸਹਾਈ ॥
ਦੁਸਟ ਦੋਖ ਤੇ ਲੇਹੁ ਬਚਾਈ ॥੪੦੧॥`,
        transliteration: `kabiyo baach benatee | chauapee |
hamaree karo haath dai rachhaa |
pooran hoe chit kee ichhaa |
tav charanan man rahai hamaaraa |
apanaa jaan karo pratipaaraa |377|
hamare dusatt sabhai tum ghaavahu |
aap haath dai mohi bachaavahu |
sukhee basai moro parivaaraa |
sevak sikh sabhai karataaraa |378|
mo rachhaa nij kar dai kariyai |
sabh bairan ko aaj sanghariyai |
pooran hoe hamaaree aasaa |
tor bhajan kee rahai piaasaa |379|
tumeh chhaadd koee avar na dhiyaaoon |
jo bar chahon su tum te paaoon |
sevak sikh hamaare taareeeh |
chun chun satr hamaare maareeeh |380|
aap haath dai mujhai ubariyai |
maran kaal kaa traas nivariyai |
hoojo sadaa hamaare pachhaa |
sree asidhuj joo kariyahu rachhaa |381|
raakh lehu muhi raakhanahaare |
saahib sant sahaae piyaare |
deen bandh dusattan ke hantaa |
tum ho puree chaturadas kantaa |382|
kaal paae brahamaa bap dharaa |
kaal paae siv joo avataraa |
kaal paae kar bisan prakaasaa |
sakal kaal kaa keea tamaasaa |383|
javan kaal jogee siv keeo |
bed raaj brahamaa joo theeo |
javan kaal sabh lok savaaraa |
namasakaar hai taeh hamaaraa |384|
javan kaal sabh jagat banaayo |
dev dait jachhan upajaayo |
aad ant ekai avataaraa |
soee guroo samajhiyahu hamaaraa |385|
namasakaar tis hee ko hamaaree |
sakal prajaa jin aap savaaree |
sivakan ko sivagun sukh deeo |
satrun ko pal mo badh keeo |386|
ghatt ghatt ke antar kee jaanat |
bhale bure kee peer pachhaanat |
cheettee te kunchar asathoolaa |
sabh par kripaa drisatt kar foolaa |387|
santan dukh paae te dukhee |
sukh paae saadhun ke sukhee |
ek ek kee peer pachhaanain |
ghatt ghatt ke patt patt kee jaanain |388|
jab udakarakh karaa karataaraa |
prajaa dharat tab deh apaaraa |
jab aakarakh karat ho kabahoon |
tum mai milat deh dhar sabhahoon |389|
jete badan srisatt sabh dhaarai |
aap aapanee boojh uchaarai |
tum sabh hee te rehat niraalam |
jaanat bed bhed ar aalam |390|
nirankaar nribikaar niralanbh |
aad aneel anaad asanbh |
taa kaa moorrh uchaarat bhedaa |
jaa ko bhev na paavat bedaa |391|
taa ko kar paahan anumaanat |
mahaa moorrh kachh bhed na jaanat |
mahaadev ko kehat sadaa siv |
nirankaar kaa cheenat neh bhiv |392|
aap aapanee budh hai jetee |
baranat bhin bhin tuhi tetee |
tumaraa lakhaa na jaae pasaaraa |
kih bidh sajaa pratham sansaaraa |393|
ekai roop anoop saroopaa |
rank bhayo raav kahee bhoopaa |
anddaj jeraj setaj keenee |
autabhuj khaan bahur rach deenee |394|
kahoon fool raajaa hvai baitthaa |
kahoon simatt bhiyo sankar ikaitthaa |
sagaree srisatt dikhaae achanbhav |
aad jugaad saroop suyanbhav |395|
ab rachhaa meree tum karo |
sikh ubaar asakh sangharo |
dushatt jite utthavat utapaataa |
sakal malechh karo ran ghaataa |396|
je asidhuj tav saranee pare |
tin ke dusatt dukhit hvai mare |
purakh javan pag pare tihaare |
tin ke tum sankatt sabh ttaare |397|
jo kal ko ik baar dhiaihai |
taa ke kaal nikatt neh aihai |
rachhaa hoe taeh sabh kaalaa |
dusatt arisatt ttaren tatakaalaa |398|
kripaa drisatt tan jaeh nihariho |
taa ke taap tanak mo hariho |
ridh sidh ghar mo sabh hoee |
dushatt chhaah chhvai sakai na koee |399|
ek baar jin tumai sanbhaaraa |
kaal faas te taeh ubaaraa |
jin nar naam tihaaro kahaa |
daarid dusatt dokh te rahaa |400|
kharrag ket mai saran tihaaree |
aap haath dai lehu ubaaree |
sarab tthauar mo hohu sahaaee |
dusatt dokh te lehu bachaaee |401|`,
        meaning: `Speech of the poet. Chaupai Protect me O Lord! with Thine own Hands all the desires of my heart be fulfilled. Let my mind rest under Thy Feet Sustain me, considering me Thine own.377. Destroy, O Lord! all my enemies and protect me with Thine won Hnads. May my family live in comfort and ease alongwith all my servants and disciples.378. Protect me O Lord! with Thine own Hands and destroy this day all my enemies May all the aspirations be fulfilled Let my thirst for Thy Name remain afresh.379. I may remember none else except Thee And obtain all the required boons from Thee Let my servants and disciples cross the world-ocean All my enemies be singled out and killed.380. Protect me O Lord! with Thine own Hands and relieve me form the fear of death May Thou ever Bestow Thy favours on my side Protect me O Lord! Thou, the Supreme Destroyer.381. Protect me, O Protector Lord! Most dear, the Protector of the Saints: Friend of poor and the Destroyer of the enemies Thou art the Master of the fourteen worlds.382. In due time Brahma appeared in physical form In due time Shiva incarnated In due time Vishnu manifested himself All this is the play of the Temporal Lord.383. The Temporal Lord, who created Shiva, the Yogi Who created Brahma, the Master of the Vedas The Temporal Lord who fashioned the entire world I salute the same Lord.384. The Temporal Lord, who created the whole world Who created gods, demons and yakshas He is the only one form the beginning to the end I consider Him only my Guru.385. I salute Him, non else, but Him Who has created Himself and His subject He bestows Divine virtues and happiness on His servants He destroys the enemies instantly.386. He knows the inner feelings of every heart He knows the anguish of both good and bad From the ant to the solid elephant He casts His Graceful glance on all and feels pleased.387. He is painful, when He sees His saints in grief He is happy, when His saints are happy. He knows the agony of everyone He knows the innermost secrets of every heart.388. When the Creator projected Himself, His creation manifested itself in innumerable forms When at any time He withdraws His creation, all the physical forms are merged in Him.389. All the bodies of living beings created in the world speak about Him according to their understanding But Thou, O Lord! live quite apart from everything this fact is know to the Vedas and the learned.390. The Lord is Formless, Sinless and shelterless: He is the Primal Power, without Blemish, without Beginning and Unborn The fool claims boastfully about the knowledge of His secrets, which even the Vedas do not know.391. The fool considers Him a stone, but the great fool does not know any secret He calls Shiva “The Eternal Lord, “but he does not know the secret of the Formless Lord.392. According to ones won intellect, one describes Thee differently The limits of Thy creation cannot be known and how the world was fashioned in the beginning?393. He hath only one unparalleled Form He manifests Himself as a poor man or a king at different places He created creatures from eggs, wombs and perspiration Then He created the vegetable kingdom.394. Somewhere He sits joyfully as a king Somewhere He contracts Himself as Shiva, the Yogi All His creation unfolds wonderful things He, the Primal Power, is from the beginning and Self-Existent.395. O Lord! keep me now under Thy protection Protect my disciples and destroy my enemies All the villains creations outrage and all the infidels be destroyed in the battlefield.396. O Supreme Destroyer! those who sought Thy refuge, their enemies met painful death The persons who fell at Thy Feet, Thou didst remove all their troubles.397. Those who meditate even on the Supreme Destroyer, the death cannot approach them They remain protected at all times Their enemies and troubles come to and end instantly.398. Upon whomsoever Thou dost cast Thy favourable glance, they are absolved of sins instantly They have all the worldly and spiritual pleasures in their homes None of th enemies can even touch their shadow.399. He, who remembered Thee even once, Thou didst protect him from the noose of death Those persons, who repeated Thy Name, they were saved from poverty and attacks of enemies.400. Bestow thy help own me at all places protect me from the design of my enemies. 401. Bestow Thy help on me at all places and protect me from the designs of my enemies.401.`,
        meaning_pa: `ਕਵੀ ਨੇ ਬੇਨਤੀ ਕੀਤੀ: ਚੌਪਈ: (ਹੇ ਪਰਮ ਸੱਤਾ!) ਆਪਣਾ ਹੱਥ ਦੇ ਕੇ ਮੇਰੀ ਰਖਿਆ ਕਰੋ। (ਤਾਂ ਜੋ) ਮੇਰੇ ਚਿਤ ਦੀ ਇੱਛਾ ਪੂਰੀ ਹੋ ਜਾਏ। ਮੇਰਾ ਮਨ (ਸਦਾ) ਤੁਹਾਡੇ ਚਰਨਾਂ ਨਾਲ ਜੁੜਿਆ ਰਹੇ। ਆਪਣਾ ਜਾਣ ਕੇ ਮੇਰੀ ਪ੍ਰਤਿਪਾਲਨਾ ਕਰੋ ॥੩੭੭॥ ਮੇਰੇ ਸਾਰੇ ਦੁਸ਼ਟਾਂ (ਦੁਸ਼ਮਣਾਂ) ਨੂੰ ਤੁਸੀਂ ਖ਼ਤਮ ਕਰੋ। ਮੈਨੂੰ ਆਪਣਾ ਹੱਥ ਦੇ ਕੇ ਬਚਾਓ। ਹੇ ਕਰਤਾਰ! ਮੇਰਾ ਪਰਿਵਾਰ, ਸੇਵਕ, ਸਿੱਖ ਸਭ ਸੁਖੀ ਵਸਦੇ ਰਹਿਣ ॥੩੭੮॥ ਆਪਣਾ ਹੱਥ ਦੇ ਕੇ ਮੇਰੀ ਰਖਿਆ ਕਰੋ। ਸਾਰਿਆਂ ਵੈਰੀਆਂ ਨੂੰ ਅਜ ਹੀ ਮਾਰ ਦਿਓ। ਮੇਰੀ ਆਸ ਪੂਰੀ ਹੋ ਜਾਏ। (ਸਦਾ) ਤੇਰੇ ਭਜਨ ਲਈ (ਅਥਵਾ ਭਗਤੀ ਲਈ) ਪਿਆਸ (ਤੀਬਰ ਇੱਛਾ) ਬਣੀ ਰਹੇ ॥੩੭੯॥ ਤੁਹਾਨੂੰ ਛਡ ਕੇ ਕਿਸੇ ਹੋਰ ਦੀ ਅਰਾਧਨਾ ਨਾ ਕਰਾਂ। ਜੋ ਵਰ ਚਾਹਵਾਂ, ਤੁਹਾਡੇ ਤੋਂ ਹੀ ਪ੍ਰਾਪਤ ਕਰਾਂ। ਮੇਰੇ ਸੇਵਕਾਂ ਅਤੇ ਸਿੱਖਾਂ ਨੂੰ (ਭਵਸਾਗਰ ਵਿਚੋਂ) ਤਾਰ ਦਿਓ। ਮੇਰੇ ਵੈਰੀਆਂ ਨੂੰ ਚੁਣ ਚੁਣ ਕੇ ਮਾਰ ਦਿਓ ॥੩੮੦॥ ਆਪਣਾ ਹੱਥ ਦੇ ਕੇ ਮੇਰਾ ਉੱਧਾਰ ਕਰੋ। ਮੌਤ ਦੇ ਸਮੇਂ ਦਾ ਡਰ ਦੂਰ ਕਰ ਦਿਓ। ਸਦਾ ਮੇਰੇ ਪੱਖ ਵਿਚ ਰਹੋ ਹੇ ਅਸਿਧੁਜ ਜੀ! ਅਤੇ ਮੇਰੀ ਰਖਿਆ ਕਰੋ ॥੩੮੧॥ ਹੇ ਰਖਿਆ ਕਰਨ ਵਾਲੇ! ਮੇਰੀ ਰਖਿਆ ਕਰੋ। (ਤੁਸੀਂ) ਸੰਤਾਂ ਦੇ ਸਾਹਿਬ (ਸੁਆਮੀ) ਅਤੇ ਪਿਆਰੇ ਸਹਾਇਕ ਹੋ। (ਤੁਸੀਂ) ਦੀਨਾਂ ਦੇ ਬੰਧੂ ਅਤੇ ਦੁਸ਼ਟਾਂ ਦੇ ਸੰਘਾਰਕ ਹੋ। ਤੁਸੀਂ ਹੀ ਚੌਦਾਂ ਪੁਰੀਆਂ (ਲੋਕਾਂ) ਦੇ ਸੁਆਮੀ ਹੋ ॥੩੮੨॥ ਸਮਾਂ ਆਣ ਤੇ ਹੀ ਬ੍ਰਹਮਾ ਨੇ ਸ਼ਰੀਰ ਧਾਰਨ ਕੀਤਾ। ਸਮਾਂ ਪਾ ਕੇ ਹੀ ਸ਼ਿਵ ਜੀ ਨੇ ਅਵਤਾਰ ਧਾਰਿਆ। ਕਾਲ ਦੀ ਪ੍ਰਾਪਤੀ ਤੇ ਹੀ ਵਿਸ਼ਣੂ ਦਾ ਪ੍ਰਕਾਸ਼ ਹੋਇਆ। (ਹੇ ਮਹਾਕਾਲ! ਤੁਸੀਂ ਹੀ) ਸਾਰਿਆਂ ਕਾਲਾਂ ਦਾ ਕੌਤਕ ਰਚਾਇਆ ਹੋਇਆ ਹੈ ॥੩੮੩॥ ਜਿਸ ਕਾਲ ਨੇ ਸ਼ਿਵ ਨੂੰ ਜੋਗੀ ਬਣਾਇਆ ਹੈ ਅਤੇ ਬ੍ਰਹਮਾ ਜੀ ਨੂੰ ਵੇਦਾਂ ਦਾ ਰਾਜਾ ਬਣਾਇਆ ਹੈ। ਜਿਸ ਕਾਲ ਨੇ ਸਾਰਿਆਂ ਲੋਕਾਂ (ਭੁਵਨਾਂ) ਨੂੰ ਸੰਵਾਰਿਆ ਹੈ, ਉਸ ਨੂੰ ਮੇਰਾ ਪ੍ਰਨਾਮ ਹੈ ॥੩੮੪॥ ਜਿਸ ਕਾਲ ਨੇ ਸਾਰਾ ਜਗਤ ਬਣਾਇਆ ਅਤੇ ਦੇਵਤੇ, ਦੈਂਤ ਤੇ ਯਕਸ਼ ਪੈਦਾ ਕੀਤੇ। (ਜੋ) ਆਦਿ ਤੋਂ ਅੰਤ ਤਕ ਅਵਤਰਿਤ ਹੈ (ਭਾਵ ਪ੍ਰਕਾਸ਼ਮਾਨ ਹੈ) ਉਸੇ ਨੂੰ ਮੇਰਾ ਗੁਰੂ ਸਮਝੋ ॥੩੮੫॥ ਉਸ ਨੂੰ ਮੇਰਾ ਨਮਸਕਾਰ ਹੈ, ਜਿਸ ਨੇ ਸਾਰੀ ਪ੍ਰਜਾ ਨੂੰ ਬਣਾਇਆ ਹੈ। (ਹੇ ਪਰਮ ਸੱਤਾ! ਤੁਸੀਂ) ਸੇਵਕਾਂ ਨੂੰ ਸ਼ੁਭ ਗੁਣ ਅਤੇ ਸੁਖ ਦਿੱਤਾ ਹੈ ਅਤੇ ਵੈਰੀਆਂ ਦਾ ਛਿਣ ਵਿਚ ਵੱਧ ਕੀਤਾ ਹੈ ॥੩੮੬॥ (ਤੁਸੀਂ) ਹਰ ਇਕ ਦੇ ਅੰਦਰ ਦੀ ਗੱਲ ਜਾਣਦੇ ਹੋ ਅਤੇ ਚੰਗੇ ਮਾੜੇ ਦੀ ਪੀੜ (ਦੁਖ) ਨੂੰ ਪਛਾਣਦੇ ਹੋ। ਕੀੜੀ ਤੋਂ ਲੈ ਕੇ ਵਡਾਕਾਰੇ ਹਾਥੀ ਤਕ, ਸਭ ਉਤੇ ਕ੍ਰਿਪਾ ਦ੍ਰਿਸ਼ਟੀ ਰਖ ਕੇ ਪ੍ਰਸੰਨ ਹੁੰਦੇ ਹੋ ॥੩੮੭॥ ਸੰਤਾਂ ਦੇ ਦੁਖੀ ਹੋਣ ਤੇ (ਤੁਸੀਂ) ਦੁਖੀ ਹੁੰਦੇ ਹੋ ਅਤੇ ਸਾਧਾਂ ਦੇ ਸੁਖ ਪ੍ਰਾਪਤ ਕਰਨ ਤੇ ਸੁਖੀ ਹੁੰਦੇ ਹੋ। (ਤੁਸੀਂ) ਇਕ ਇਕ ਦੇ ਦੁਖ ਨੂੰ ਪਛਾਣਦੇ ਹੋ ਅਤੇ ਹਰ ਇਕ ਦੇ ਅੰਦਰ ਪਰਦਿਆਂ (ਵਿਚ ਲੁਕੇ ਭੇਦਾਂ ਨੂੰ) ਜਾਣਦੇ ਹੋ ॥੩੮੮॥ ਹੇ ਕਰਤਾਰ! ਜਦੋਂ (ਤੁਸੀਂ ਆਪਣਾ) ਵਿਸਤਾਰ ਕਰਦੇ ਹੋ, ਤਦ ਸਾਰੀ ਪ੍ਰਜਾ (ਆਪਣੀ) ਅਪਾਰ ਹੋਂਦ ਧਾਰਨ ਕਰਦੀ ਹੈ। ਜਦ ਕਦੇ (ਸ੍ਰਿਸ਼ਟੀ ਨੂੰ ਆਪਣੇ ਵਲ) ਖਿਚਦੇ ਹੋ, (ਤਦ) ਤੁਹਾਡੇ ਵਿਚ ਸਾਰੇ ਆਕਾਰ (ਦੇਹ-ਧਾਰੀ) ਸਮਾ ਜਾਂਦੇ ਹਨ ॥੩੮੯॥ ਸ੍ਰਿਸ਼ਟੀ ਵਿਚ ਜਿਤਨੇ ਵੀ ਸਭ ਮੂੰਹ ('ਬਦਨ') ਬਣੇ ਹੋਏ ਹਨ, (ਉਨ੍ਹਾਂ ਸਭ ਨੇ) ਆਪਣੀ ਆਪਣੀ ਸੂਝ ਅਨੁਸਾਰ (ਤੇਰੇ ਗੁਣਾਂ ਦਾ) ਗਾਇਨ ਕੀਤਾ ਹੈ। ਤੁਸੀਂ ਸਾਰਿਆਂ ਤੋਂ ਬੇਲਾਗ ਰਹਿੰਦੇ ਹੋ। (ਇਸ) ਭੇਦ ਨੂੰ ਸਾਰੇ ਵੇਦ ਅਤੇ (ਸੰਸਾਰ ਦੇ) ਵਿਦਵਾਨ ਜਾਣਦੇ ਹਨ ॥੩੯੦॥ (ਹੇ ਪਰਮ ਸੱਤਾ! ਤੁਸੀਂ) ਨਿਰਾਕਾਰ, ਨਿਰਵਿਕਾਰ, ਨਿਰਾਧਾਰ ('ਨ੍ਰਿਲੰਭ') ਆਦਿ (ਸਰੂਪ) ਅਨੀਲ (ਉਜਲੇ) ਅਨਾਦਿ, ਅਸੰਭ (ਜਨਮ ਰਹਿਤ) ਹੋ। ਮੂਰਖ ਲੋਗ ਉਸ ਦੇ ਭੇਦ ਦਾ ਵਰਣਨ ਕਰਦੇ ਹਨ, ਜਿਸ ਦਾ ਭੇਦ ਵੇਦ ਵੀ ਨਹੀਂ ਪਾ ਸਕੇ ਹਨ ॥੩੯੧॥ (ਜੋ) ਉਸ ਦਾ ਅਨੁਮਾਨ ਪੱਥਰ ਵਿਚ ਕਰਦੇ ਹਨ, (ਉਹ) ਮਹਾ ਮੂਰਖ (ਉਸ ਦਾ) ਕੁਝ ਵੀ ਭੇਦ ਨਹੀਂ ਜਾਣਦੇ। ਉਹ ਮਹਾਦੇਵ ਨੂੰ ਸਦਾ ਸ਼ਿਵ (ਸਦਾ ਕਲਿਆਣਕਾਰੀ ਈਸ਼ਵਰ) ਕਹਿੰਦੇ ਹਨ, ਪਰ ਨਿਰੰਕਾਰ ਦਾ ਭੇਦ ਨਹੀਂ ਸਮਝਦੇ ॥੩੯੨॥ (ਹਰ ਇਕ ਦੀ) ਆਪੋ ਆਪਣੀ ਜਿਤਨੀ ਬੁੱਧੀ ਹੈ, (ਉਹ) ਤੁਹਾਡਾ ਭਿੰਨ ਭਿੰਨ ਵਰਣਨ ਕਰਦੇ ਹਨ। (ਹੇ ਪ੍ਰਭੂ!) ਤੁਹਾਡੇ ਪਸਾਰੇ ਨੂੰ ਸਮਝਿਆ ਨਹੀਂ ਜਾ ਸਕਦਾ ਕਿ ਕਿਸ ਤਰ੍ਹਾਂ ਪਹਿਲਾਂ ਸੰਸਾਰ ਸਾਜਿਆ ਗਿਆ ॥੩੯੩॥ (ਤੇਰਾ) ਇਕੋ ਰੂਪ ਅਨੇਕ ਸਰੂਪਾਂ ਵਾਲਾ ਹੈ। (ਤੁਸੀਂ ਹੀ) ਕਿਤੇ ਰੰਕ ਹੋ, ਕਿਤੇ ਰਾਓ ਅਤੇ ਕਿਤੇ ਰਾਜੇ ਕਹੀਦੇ ਹੋ। (ਤੁਸੀਂ ਪਹਿਲਾਂ) ਅੰਡਜ, ਜੇਰਜ ਅਤੇ ਸੇਤਜ (ਖਾਣੀਆਂ ਦੀ ਰਚਨਾ) ਕੀਤੀ ਅਤੇ ਫਿਰ ਉਤਭੁਜ ਖਾਣੀ ਦੀ ਰਚਨਾ ਕਰ ਦਿੱਤੀ ॥੩੯੪॥ ਕਿਤੇ (ਤੁਸੀਂ) ਪ੍ਰਸੰਨਤਾ ਪੂਰਵਕ ਰਾਜੇ ਬਣੇ ਬੈਠੇ ਹੋ ਅਤੇ ਕਿਤੇ ਸਿਮਟ ਕੇ ਸ਼ੰਕਰ ਦੀ (ਮੂਰਤੀ ਵਿਚ) ਇਕੱਠੇ ਹੋ ਗਏ ਹੋ (ਅਰਥਾਂਤਰ- ਕਿਤੇ ਸੰਯੁਕਤ ਹੋ ਕੇ ਇਕੱਠੇ ਸਿਮਟੇ ਹੋਏ ਹੋ)। (ਤੁਸੀਂ) ਸਾਰੀ ਸ੍ਰਿਸ਼ਟੀ ਦਾ ਅਚੰਭਾ ਵਿਖਾਇਆ ਹੈ। (ਤੁਸੀਂ) ਮੁਢ ਵਿਚ, ਜੁਗਾਂ ਦੇ ਆਰੰਭ ਵਿਚ ਆਪਣੇ ਆਪ ਹੋਂਦ ਵਿਚ ਆਣ ਵਾਲੇ ਸਰੂਪ ਹੋ ॥੩੯੫॥ (ਤੁਸੀਂ) ਹੁਣ ਮੇਰੀ ਰਖਿਆ ਕਰੋ। (ਤੁਸੀਂ) ਸਿੱਖਾਂ ਨੂੰ ਬਚਾਓ ਅਤੇ ਅਸਿੱਖਾਂ ਨੂੰ ਨਸ਼ਟ ਕਰੋ। ਜਿਤਨੇ ਦੁਸ਼ਟ ਉਤਪਾਤ (ਉਪਦ੍ਰ) ਮਚਾਉਂਦੇ ਹਨ, (ਉਨ੍ਹਾਂ) ਸਾਰਿਆਂ ਮਲੇਛਾਂ ਦਾ ਰਣ ਵਿਚ ਨਾਸ਼ ਕਰੋ ॥੩੯੬॥ ਹੇ ਅਸਿਧੁਜ! ਜੋ ਤੁਹਾਡੀ ਸ਼ਰਨ ਵਿਚ ਪੈਂਦੇ ਹਨ, ਉਨ੍ਹਾਂ ਦੇ ਦੁਸ਼ਟ (ਦੁਸ਼ਮਨ) ਦੁਖੀ ਹੋ ਕੇ ਮਰਦੇ ਹਨ। (ਜੋ) ਪੁਰਸ਼ ਤੁਹਾਡੀ ਸ਼ਰਨ ਵਿਚ ਪੈਂਦੇ ਹਨ, ਉਨ੍ਹਾਂ ਦੇ ਸਾਰੇ ਸੰਕਟ ਤੁਸੀਂ ਦੂਰ ਕਰ ਦਿੰਦੇ ਹੋ ॥੩੯੭॥ ਜੋ 'ਕਲਿ' ਨੂੰ ਇਕ ਵਾਰ ਧਿਆਉਂਦੇ ਹਨ, (ਫਿਰ) ਕਾਲ ਉਨ੍ਹਾਂ ਦੇ ਨੇੜੇ ਨਹੀਂ ਆਉਂਦਾ। ਉਨ੍ਹਾਂ ਦੀ ਸਾਰੇ ਕਾਲਾਂ ਵਿਚ ਰਖਿਆ ਹੁੰਦੀ ਹੈ (ਅਤੇ ਉਨ੍ਹਾਂ ਦੇ) ਦੁਸ਼ਟ ਅਤੇ ਵਿਘਨ ਉਸੇ ਵੇਲੇ ਦੂਰ ਹੋ ਜਾਂਦੇ ਹਨ ॥੩੯੮॥ (ਤੁਸੀਂ) ਜਿਸ ਨੂੰ ਕ੍ਰਿਪਾ ਦ੍ਰਿਸ਼ਟੀ ਨਾਲ ਵੇਖਦੇ ਹੋ, ਉਨ੍ਹਾਂ ਦੇ (ਸਾਰੇ) ਦੁਖ ਛਿਣ ਵਿਚ ਹਰੇ ਜਾਂਦੇ ਹਨ। (ਉਨ੍ਹਾਂ ਦੇ) ਘਰ ਵਿਚ ਸਭ ਰਿਧੀਆਂ ਅਤੇ ਸਿਧੀਆਂ ਹੋ ਜਾਂਦੀਆਂ ਹਨ ਅਤੇ ਕੋਈ ਦੁਸ਼ਟ (ਦੁਸ਼ਮਨ) (ਉਨ੍ਹਾਂ ਦੀ) ਪਰਛਾਈ ਨੂੰ ਵੀ ਛੋਹ ਨਹੀਂ ਸਕਦਾ ॥੩੯੯॥ (ਹੇ ਪਰਮ ਸੱਤਾ!) ਜਿਸ ਨੇ ਇਕ ਵਾਰ ਤੁਹਾਨੂੰ ਯਾਦ ਕਰ ਲਿਆ, ਉਸ ਨੂੰ (ਤੁਸੀਂ) ਕਾਲ ਦੀ ਫਾਹੀ ਤੋਂ ਬਚਾ ਲਿਆ। ਜਿਸ ਵਿਅਕਤੀ ਨੇ ਤੁਹਾਡਾ ਨਾਮ ਉਚਾਰ ਦਿੱਤਾ, (ਉਹ) ਦਰਿਦ੍ਰ (ਗ਼ਰੀਬੀ) ਦੁਸ਼ਟ (ਦੁਸ਼ਮਨ) ਅਤੇ ਦੁਖਾਂ ਤੋਂ ਬਚ ਗਿਆ ॥੪੦੦॥ ਹੇ ਖੜਗਕੇਤੁ! ਮੈਂ ਤੁਹਾਡੀ ਸ਼ਰਨ ਵਿਚ ਹਾਂ। ਆਪਣਾ ਹੱਥ ਦੇ ਕੇ (ਮੈਨੂੰ) ਬਚਾ ਲਵੋ। ਸਭ ਥਾਂਵਾਂ ਤੇ ਮੇਰੇ ਸਹਾਇਕ ਹੋ ਜਾਓ। ਦੁਸ਼ਟ (ਦੁਸ਼ਮਨ) ਅਤੇ ਦੁਖ ਤੋਂ ਬਚਾ ਲਵੋ ॥੪੦੧॥`
      },
      {
        number: 14,
        sanskrit: `ਸ੍ਵੈਯਾ ॥
ਪਾਂਇ ਗਹੇ ਜਬ ਤੇ ਤੁਮਰੇ ਤਬ ਤੇ ਕੋਊ ਆਂਖ ਤਰੇ ਨਹੀਂ ਆਨ੍ਯੋ ॥
ਰਾਮ ਰਹੀਮ ਪੁਰਾਨ ਕੁਰਾਨ ਅਨੇਕ ਕਹੈਂ ਮਤ ਏਕ ਨ ਮਾਨ੍ਯੋ ॥
ਸਿੰਮ੍ਰਿਤ ਸਾਸਤ੍ਰ ਬੇਦ ਸਭੈ ਬਹੁ ਭੇਦ ਕਹੈਂ ਹਮ ਏਕ ਨ ਜਾਨ੍ਯੋ ॥
ਸ੍ਰੀ ਅਸਿਪਾਨ ਕ੍ਰਿਪਾ ਤੁਮਰੀ ਕਰਿ ਮੈ ਨ ਕਹ੍ਯੋ ਸਭ ਤੋਹਿ ਬਖਾਨ੍ਯੋ ॥੮੬੩॥`,
        transliteration: `svaiyaa |
paane gahe jab te tumare tab te koaoo aankh tare naheen aanayo |
raam raheem puraan kuraan anek kahain mat ek na maanayo |
sinmrit saasatr bed sabhai bahu bhed kahain ham ek na jaanayo |
sree asipaan kripaa tumaree kar mai na kehayo sabh tohi bakhaanayo |863|`,
        meaning: `SWAYYA O God! the day when I caught hold of your feet, I do not bring anyone else under my sight None other is liked by me now   the Puranas and the Quran try to know Thee by the names of Ram and Rahim and talk about you through several stories, The Simritis, Shastras and Vedas describe several mysteries of yours, but I do not agree with any of them. O sword-wielder God! This all has been described by Thy Grace, what power can I have to write all this?.863.`,
        meaning_pa: `ਸ੍ਵੈਯਾ ਜਦ ਤੋਂ ਤੁਹਾਡੇ ਚਰਨ ਫੜੇ ਹਨ ਤਦ ਤੋਂ ਮੈਂ (ਹੋਰ) ਕਿਸੇ ਨੂੰ ਅੱਖਾਂ ਹੇਠਾਂ ਨਹੀਂ ਲਿਆਉਂਦਾ। ਰਾਮ, ਰਹੀਮ, ਪੁਰਾਨ ਅਤੇ ਕੁਰਾਨ ਨੇ ਅਨੇਕਾਂ ਮੱਤ ਕਹੇ ਗਏ ਹਨ। (ਪਰ ਮੈਂ ਕਿਸੇ) ਇਕ ਨੂੰ ਵੀ ਨਹੀਂ ਮੰਨਦਾ। ਸਮ੍ਰਿਤੀਆਂ, ਸ਼ਾਸਤ੍ਰ ਅਤੇ ਵੇਦ ਬਹੁਤ ਸਾਰੇ ਭੇਦ ਦੱਸਦੇ ਹਨ, ਪਰ ਮੈਂ ਇਕ ਵੀ ਨਹੀਂ ਜਾਣਿਆ। ਹੇ ਕਾਲ ਪੁਰਖ! ਤੇਰੀ ਕ੍ਰਿਪਾ ਕਰਕੇ (ਗ੍ਰੰਥ ਸਿਰਜਿਆ ਜਾ ਸਕਿਆ ਹੈ)। (ਇਹ) ਮੈਂ ਨਹੀਂ ਕਿਹਾ, ਸਾਰਾ ਤੁਸੀਂ ਹੀ ਕਥਨ ਕੀਤਾ ਹੈ ॥੮੬੩॥`
      },
      {
        number: 15,
        sanskrit: `ਦੋਹਰਾ ॥
ਸਗਲ ਦੁਆਰ ਕਉ ਛਾਡਿ ਕੈ ਗਹਿਓ ਤੁਹਾਰੋ ਦੁਆਰ ॥
ਬਾਂਹਿ ਗਹੇ ਕੀ ਲਾਜ ਅਸ ਗੋਬਿੰਦ ਦਾਸ ਤੁਹਾਰ ॥੮੬੪॥`,
        transliteration: `doharaa |
sagal duaar kau chhaadd kai gahio tuhaaro duaar |
baanhi gahe kee laaj as gobind daas tuhaar |864|`,
        meaning: `DOHRA O Lord! I have forsaken all other doors and have caught hold of only Thy door. O Lord! Thou has caught hold of my arm I, Govind, am Thy serf, kindly take (care of me and) protect my honour.864.`,
        meaning_pa: `ਦੋਹਰਾ ਸਾਰੇ ਦਰਾਂ ਨੂੰ ਛੱਡ ਕੇ, ਤੁਹਾਡਾ ਦਰ ਫੜਿਆ ਹੈ। ਤੁਹਾਨੂੰ ਬਾਂਹ ਫੜੇ ਦੀ ਲਾਜ ਹੈ, ਗੋਬਿੰਦ ਤੁਹਾਡਾ ਦਾਸ ਹਾਂ ॥੮੬੪॥`
      },
      {
        number: 16,
        sanskrit: `ਰਾਮਕਲੀ ਮਹਲਾ ੩ ਅਨੰਦੁ ॥
ੴ ਸਤਿਗੁਰ ਪ੍ਰਸਾਦਿ ॥
ਅਨੰਦੁ ਭਇਆ ਮੇਰੀ ਮਾਏ ਸਤਿਗੁਰੂ ਮੈ ਪਾਇਆ ॥
ਸਤਿਗੁਰੁ ਤ ਪਾਇਆ ਸਹਜ ਸੇਤੀ ਮਨਿ ਵਜੀਆ ਵਾਧਾਈਆ ॥
ਰਾਗ ਰਤਨ ਪਰਵਾਰ ਪਰੀਆ ਸਬਦ ਗਾਵਣ ਆਈਆ ॥
ਸਬਦੋ ਤ ਗਾਵਹੁ ਹਰੀ ਕੇਰਾ ਮਨਿ ਜਿਨੀ ਵਸਾਇਆ ॥
ਕਹੈ ਨਾਨਕੁ ਅਨੰਦੁ ਹੋਆ ਸਤਿਗੁਰੂ ਮੈ ਪਾਇਆ ॥੧॥
ਏ ਮਨ ਮੇਰਿਆ ਤੂ ਸਦਾ ਰਹੁ ਹਰਿ ਨਾਲੇ ॥
ਹਰਿ ਨਾਲਿ ਰਹੁ ਤੂ ਮੰਨ ਮੇਰੇ ਦੂਖ ਸਭਿ ਵਿਸਾਰਣਾ ॥
ਅੰਗੀਕਾਰੁ ਓਹੁ ਕਰੇ ਤੇਰਾ ਕਾਰਜ ਸਭਿ ਸਵਾਰਣਾ ॥
ਸਭਨਾ ਗਲਾ ਸਮਰਥੁ ਸੁਆਮੀ ਸੋ ਕਿਉ ਮਨਹੁ ਵਿਸਾਰੇ ॥
ਕਹੈ ਨਾਨਕੁ ਮੰਨ ਮੇਰੇ ਸਦਾ ਰਹੁ ਹਰਿ ਨਾਲੇ ॥੨॥
ਸਾਚੇ ਸਾਹਿਬਾ ਕਿਆ ਨਾਹੀ ਘਰਿ ਤੇਰੈ ॥
ਘਰਿ ਤ ਤੇਰੈ ਸਭੁ ਕਿਛੁ ਹੈ ਜਿਸੁ ਦੇਹਿ ਸੁ ਪਾਵਏ ॥
ਸਦਾ ਸਿਫਤਿ ਸਲਾਹ ਤੇਰੀ ਨਾਮੁ ਮਨਿ ਵਸਾਵਏ ॥
ਨਾਮੁ ਜਿਨ ਕੈ ਮਨਿ ਵਸਿਆ ਵਾਜੇ ਸਬਦ ਘਨੇਰੇ ॥
ਕਹੈ ਨਾਨਕੁ ਸਚੇ ਸਾਹਿਬ ਕਿਆ ਨਾਹੀ ਘਰਿ ਤੇਰੈ ॥੩॥
ਸਾਚਾ ਨਾਮੁ ਮੇਰਾ ਆਧਾਰੋ ॥
ਸਾਚੁ ਨਾਮੁ ਅਧਾਰੁ ਮੇਰਾ ਜਿਨਿ ਭੁਖਾ ਸਭਿ ਗਵਾਈਆ ॥
ਕਰਿ ਸਾਂਤਿ ਸੁਖ ਮਨਿ ਆਇ ਵਸਿਆ ਜਿਨਿ ਇਛਾ ਸਭਿ ਪੁਜਾਈਆ ॥
ਸਦਾ ਕੁਰਬਾਣੁ ਕੀਤਾ ਗੁਰੂ ਵਿਟਹੁ ਜਿਸ ਦੀਆ ਏਹਿ ਵਡਿਆਈਆ ॥
ਕਹੈ ਨਾਨਕੁ ਸੁਣਹੁ ਸੰਤਹੁ ਸਬਦਿ ਧਰਹੁ ਪਿਆਰੋ ॥
ਸਾਚਾ ਨਾਮੁ ਮੇਰਾ ਆਧਾਰੋ ॥੪॥
ਵਾਜੇ ਪੰਚ ਸਬਦ ਤਿਤੁ ਘਰਿ ਸਭਾਗੈ ॥
ਘਰਿ ਸਭਾਗੈ ਸਬਦ ਵਾਜੇ ਕਲਾ ਜਿਤੁ ਘਰਿ ਧਾਰੀਆ ॥
ਪੰਚ ਦੂਤ ਤੁਧੁ ਵਸਿ ਕੀਤੇ ਕਾਲੁ ਕੰਟਕੁ ਮਾਰਿਆ ॥
ਧੁਰਿ ਕਰਮਿ ਪਾਇਆ ਤੁਧੁ ਜਿਨ ਕਉ ਸਿ ਨਾਮਿ ਹਰਿ ਕੈ ਲਾਗੇ ॥
ਕਹੈ ਨਾਨਕੁ ਤਹ ਸੁਖੁ ਹੋਆ ਤਿਤੁ ਘਰਿ ਅਨਹਦ ਵਾਜੇ ॥੫॥
ਅਨਦੁ ਸੁਣਹੁ ਵਡਭਾਗੀਹੋ ਸਗਲ ਮਨੋਰਥ ਪੂਰੇ ॥
ਪਾਰਬ੍ਰਹਮੁ ਪ੍ਰਭੁ ਪਾਇਆ ਉਤਰੇ ਸਗਲ ਵਿਸੂਰੇ ॥
ਦੂਖ ਰੋਗ ਸੰਤਾਪ ਉਤਰੇ ਸੁਣੀ ਸਚੀ ਬਾਣੀ ॥
ਸੰਤ ਸਾਜਨ ਭਏ ਸਰਸੇ ਪੂਰੇ ਗੁਰ ਤੇ ਜਾਣੀ ॥
ਸੁਣਤੇ ਪੁਨੀਤ ਕਹਤੇ ਪਵਿਤੁ ਸਤਿਗੁਰੁ ਰਹਿਆ ਭਰਪੂਰੇ ॥
ਬਿਨਵੰਤਿ ਨਾਨਕੁ ਗੁਰ ਚਰਣ ਲਾਗੇ ਵਾਜੇ ਅਨਹਦ ਤੂਰੇ ॥੪੦॥੧॥`,
        transliteration: `raamakalee mahalaa 3 anand |
ik oankaar satigur prasaad |
anand bheaa meree maae satiguroo mai paaeaa |
satigur ta paaeaa sehaj setee man vajeea vaadhaaeea |
raag ratan paravaar pareea sabad gaavan aaeea |
sabado ta gaavahu haree keraa man jinee vasaaeaa |
kahai naanak anand hoaa satiguroo mai paaeaa |1|
e man meriaa too sadaa rahu har naale |
har naal rahu too man mere dookh sabh visaaranaa |
angeekaar ohu kare teraa kaaraj sabh savaaranaa |
sabhanaa galaa samarath suaamee so kiau manahu visaare |
kahai naanak man mere sadaa rahu har naale |2|
saache saahibaa kiaa naahee ghar terai |
ghar ta terai sabh kichh hai jis dehi su paave |
sadaa sifat salaah teree naam man vasaave |
naam jin kai man vasiaa vaaje sabad ghanere |
kahai naanak sache saahib kiaa naahee ghar terai |3|
saachaa naam meraa aadhaaro |
saach naam adhaar meraa jin bhukhaa sabh gavaaeea |
kar saant sukh man aae vasiaa jin ichhaa sabh pujaaeea |
sadaa kurabaan keetaa guroo vittahu jis deea ehi vaddiaaeea |
kahai naanak sunahu santahu sabad dharahu piaaro |
saachaa naam meraa aadhaaro |4|
vaaje panch sabad tith ghar sabhaagai |
ghar sabhaagai sabad vaaje kalaa jit ghar dhaareea |
panch doot tudh vas keete kaal kanttak maariaa |
dhur karam paaeaa tudh jin kau si naam har kai laage |
kahai naanak teh sukh hoaa tith ghar anahad vaaje |5|
anad sunahu vaddabhaageeho sagal manorath poore |
paarabraham prabh paaeaa utare sagal visoore |
dookh rog santaap utare sunee sachee baanee |
sant saajan bhe sarase poore gur te jaanee |
sunate puneet kahate pavit satigur rahiaa bharapoore |
binavant naanak gur charan laage vaaje anahad toore |40|1|`,
        meaning: `Raamkalee, Third Mehl, Anand ~ The Song Of Bliss: One Universal Creator God. By The Grace Of The True Guru: I am in ecstasy, O my mother, for I have found my True Guru. I have found the True Guru, with intuitive ease, and my mind vibrates with the music of bliss. The jewelled melodies and their related celestial harmonies have come to sing the Word of the Shabad. The Lord dwells within the minds of those who sing the Shabad. Says Nanak, I am in ecstasy, for I have found my True Guru. ||1|| O my mind, remain always with the Lord. Remain always with the Lord, O my mind, and all sufferings will be forgotten. He will accept You as His own, and all your affairs will be perfectly arranged. Our Lord and Master is all-powerful to do all things, so why forget Him from your mind? Says Nanak, O my mind, remain always with the Lord. ||2|| O my True Lord and Master, what is there which is not in Your celestial home? Everything is in Your home; they receive, unto whom You give. Constantly singing Your Praises and Glories, Your Name is enshrined in the mind. The divine melody of the Shabad vibrates for those, within whose minds the Naam abides. Says Nanak, O my True Lord and Master, what is there which is not in Your home? ||3|| The True Name is my only support. The True Name is my only support; it satisfies all hunger. It has brought peace and tranquility to my mind; it has fulfilled all my desires. I am forever a sacrifice to the Guru, who possesses such glorious greatness. Says Nanak, listen, O Saints; enshrine love for the Shabad. The True Name is my only support. ||4|| The Panch Shabad, the five primal sounds, vibrate in that blessed house. In that blessed house, the Shabad vibrates; He infuses His almighty power into it. Through You, we subdue the five demons of desire, and slay Death, the torturer. Those who have such pre-ordained destiny are attached to the Lord's Name. Says Nanak, they are at peace, and the unstruck sound current vibrates within their homes. ||5|| Listen to the song of bliss, O most fortunate ones; all your longings shall be fulfilled. I have obtained the Supreme Lord God, and all sorrows have been forgotten. Pain, illness and suffering have departed, listening to the True Bani. The Saints and their friends are in ecstasy, knowing the Perfect Guru. Pure are the listeners, and pure are the speakers; the True Guru is all-pervading and permeating. Prays Nanak, touching the Guru's Feet, the unstruck sound current of the celestial bugles vibrates and resounds. ||40||1||`,
        meaning_pa: `ਰਾਗ ਰਾਮਕਲੀ ਵਿੱਚ ਗੁਰੂ ਅਮਰਦਾਸ ਜੀ ਦੀ ਬਾਣੀ 'ਅਨੰਦ'। ਅਕਾਲ ਪੁਰਖ ਇੱਕ ਹੈ ਅਤੇ ਸਤਿਗੁਰੂ ਦੀ ਕਿਰਪਾ ਨਾਲ ਮਿਲਦਾ ਹੈ। ਹੇ ਭਾਈ ਮਾਂ! (ਮੇਰੇ ਅੰਦਰ) ਪੂਰਨ ਖਿੜਾਉ ਪੈਦਾ ਹੋ ਗਿਆ ਹੈ (ਕਿਉਂਕਿ) ਮੈਨੂੰ ਗੁਰੂ ਮਿਲ ਪਿਆ ਹੈ। ਮੈਨੂੰ ਗੁਰੂ ਮਿਲਿਆ ਹੈ, ਤੇ ਨਾਲ ਹੀ ਅਡੋਲ ਅਵਸਥਾ ਭੀ ਪ੍ਰਾਪਤ ਹੋ ਗਈ ਹੈ (ਭਾਵ, ਗੁਰੂ ਦੇ ਮਿਲਣ ਨਾਲ ਮੇਰਾ ਮਨ ਡੋਲਣੋਂ ਹਟ ਗਿਆ ਹੈ); ਮੇਰੇ ਮਨ ਵਿਚ (ਮਾਨੋ) ਖ਼ੁਸ਼ੀ ਦੇ ਵਾਜੇ ਵੱਜ ਪਏ ਹਨ, ਸੋਹਣੇ ਰਾਗ ਆਪਣੇ ਪਰਵਾਰ ਤੇ ਰਾਣੀਆਂ ਸਮੇਤ (ਮੇਰੇ ਮਨ ਵਿਚ, ਮਾਨੋ,) ਪ੍ਰਭੂ ਦੀ ਸਿਫ਼ਤ-ਸਾਲਾਹ ਦੇ ਗੀਤ ਗਾਵਣ ਆ ਗਏ ਹਨ। (ਤੁਸੀ ਭੀ) ਪ੍ਰਭੂ ਦੀ ਸਿਫ਼ਤ-ਸਾਲਾਹ ਦਾ ਗੀਤ ਗਾਵੋ। ਜਿਨ੍ਹਾਂ ਜਿਨ੍ਹਾਂ ਨੇ ਸਿਫ਼ਤ-ਸਾਲਾਹ ਦਾ ਸ਼ਬਦ ਮਨ ਵਿਚ ਵਸਾਇਆ ਹੈ (ਉਹਨਾਂ ਦੇ ਅੰਦਰ ਪੂਰਨ ਖਿੜਾਉ ਪੈਦਾ ਹੋ ਜਾਂਦਾ ਹੈ)। ਨਾਨਕ ਆਖਦਾ ਹੈ (ਮੇਰੇ ਅੰਦਰ ਭੀ) ਆਨੰਦ ਬਣ ਗਿਆ ਹੈ (ਕਿਉਂਕਿ) ਮੈਨੂੰ ਸਤਿਗੁਰੂ ਮਿਲ ਪਿਆ ਹੈ ॥੧॥ ਹੇ ਮੇਰੇ ਮਨ! ਤੂੰ ਸਦਾ ਪ੍ਰਭੂ ਦੇ ਨਾਲ (ਜੁੜਿਆ) ਰਹੁ। ਹੇ ਮੇਰੇ ਮਨ! ਤੂੰ ਸਦਾ ਪ੍ਰਭੂ ਨੂੰ ਯਾਦ ਰੱਖ। ਉਹ ਪ੍ਰਭੂ ਸਾਰੇ ਦੁੱਖ ਦੂਰ ਕਰਨ ਵਾਲਾ ਹੈ। ਉਹ ਸਦਾ ਤੇਰੀ ਸਹਾਇਤਾ ਕਰਨ ਵਾਲਾ ਹੈ ਤੇਰੇ ਸਾਰੇ ਕੰਮ ਸਿਰੇ ਚਾੜ੍ਹਨ ਦੇ ਸਮਰੱਥ ਹੈ। ਉਸ ਮਾਲਕ ਨੂੰ ਕਿਉਂ (ਆਪਣੇ) ਮਨ ਤੋਂ ਭੁਲਾਂਦਾ ਹੈਂ ਜੋ ਸਾਰੇ ਕੰਮ ਕਰਨ-ਜੋਗਾ ਹੈ? ਨਾਨਕ ਆਖਦਾ ਹੈ ਕਿ ਹੇ ਮੇਰੇ ਮਨ! ਤੂੰ ਸਦਾ ਪ੍ਰਭੂ ਦੇ ਚਰਨਾਂ ਵਿਚ ਜੁੜਿਆ ਰਹੁ ॥੨॥ ਹੇ ਸਦਾ ਕਾਇਮ ਰਹਿਣ ਵਾਲੇ ਮਾਲਕ (-ਪ੍ਰਭੂ)! (ਮੈਂ ਤੇਰੇ ਦਰ ਤੋਂ ਮਨ ਦਾ ਆਨੰਦ ਮੰਗਦਾ ਹਾਂ, ਪਰ) ਤੇਰੇ ਘਰ ਵਿਚ ਕੇਹੜੀ ਚੀਜ਼ ਨਹੀਂ ਹੈ? ਤੇਰੇ ਘਰ ਵਿਚ ਤਾਂ ਹਰੇਕ ਚੀਜ਼ ਮੌਜੂਦ ਹੈ, ਉਹੀ ਮਨੁੱਖ ਪ੍ਰਾਪਤ ਕਰਦਾ ਹੈ ਜਿਸ ਨੂੰ ਤੂੰ ਆਪ ਦੇਂਦਾ ਹੈਂ। (ਫਿਰ, ਉਹ ਮਨੁੱਖ) ਤੇਰਾ ਨਾਮ ਤੇ ਤੇਰੀ ਸਿਫ਼ਤ-ਸਾਲਾਹ (ਆਪਣੇ) ਮਨ ਵਿਚ ਵਸਾਂਦਾ ਹੈ (ਜਿਸ ਦੀ ਬਰਕਤਿ ਨਾਲ ਉਸ ਦੇ ਅੰਦਰ ਆਨੰਦ ਪੈਦਾ ਹੋ ਜਾਂਦਾ ਹੈ)। ਜਿਨ੍ਹਾਂ ਬੰਦਿਆਂ ਦੇ ਮਨ ਵਿਚ (ਤੇਰਾ) ਨਾਮ ਵੱਸਦਾ ਹੈ (ਉਹਨਾਂ ਦੇ ਅੰਦਰ, ਮਾਨੋ,) ਬੇਅੰਤ ਸਾਜ਼ਾਂ ਦੀਆਂ (ਮਿਲਵੀਆਂ) ਸੁਰਾਂ ਵੱਜਣ ਲੱਗ ਪੈਂਦੀਆਂ ਹਨ (ਭਾਵ, ਉਹਨਾਂ ਦੇ ਮਨ ਵਿਚ ਉਹ ਖ਼ੁਸ਼ੀ ਤੇ ਚਾਉ ਪੈਦਾ ਹੁੰਦਾ ਹੈ ਜੋ ਕਈ ਸਾਜ਼ਾਂ ਦਾ ਮਿਲਵਾਂ ਰਾਗ ਸੁਣ ਕੇ ਪੈਦਾ ਹੁੰਦਾ ਹੈ)। ਨਾਨਕ ਆਖਦਾ ਹੈ ਕਿ ਹੇ ਸਦਾ ਕਾਇਮ ਰਹਿਣ ਵਾਲੇ ਮਾਲਕ! ਤੇਰੇ ਘਰ ਵਿਚ ਕਿਸੇ ਸ਼ੈ ਦਾ ਘਾਟਾ ਨਹੀਂ ਹੈ (ਤੇ, ਮੈਂ ਤੇਰੇ ਦਰ ਤੋਂ ਆਨੰਦ ਦਾ ਦਾਨ ਮੰਗਦਾ ਹਾਂ) ॥੩॥ (ਪ੍ਰਭੂ ਦੀ ਮੇਹਰ ਨਾਲ ਉਸ ਦਾ) ਸਦਾ-ਥਿਰ ਰਹਿਣ ਵਾਲਾ ਨਾਮ ਮੇਰੀ ਜ਼ਿੰਦਗੀ ਦਾ ਆਸਰਾ (ਬਣ ਗਿਆ) ਹੈ। ਉਹ ਸਦਾ ਕਾਇਮ ਰਹਿਣ ਵਾਲਾ ਨਾਮ ਮੇਰੀ ਜ਼ਿੰਦਗੀ ਦਾ ਆਸਰਾ ਬਣ ਗਿਆ) ਹੈ, ਜਿਸ (ਹਰਿ-ਨਾਮ) ਨੇ ਮੇਰੇ ਸਾਰੇ ਲਾਲਚ ਦੂਰ ਕਰ ਦਿੱਤੇ ਹਨ। ਜੋ ਹਰਿ-ਨਾਮ (ਮੇਰੇ ਅੰਦਰ) ਸ਼ਾਂਤੀ ਤੇ ਸੁਖ ਪੈਦਾ ਕਰਕੇ ਮੇਰੇ ਮਨ ਵਿਚ ਆ ਟਿਕਿਆ ਹੈ, ਜਿਸ (ਹਰਿ-ਨਾਮ) ਨੇ ਮੇਰੇ ਮਨ ਦੀਆਂ ਸਾਰੀਆਂ ਕਾਮਨਾਂ ਪੂਰੀਆਂ ਕਰ ਦਿੱਤੀਆਂ ਹਨ। ਮੈਂ (ਆਪਣੇ ਆਪ ਨੂੰ) ਆਪਣੇ ਗੁਰੂ ਤੋਂ ਸਦਕੇ ਕਰਦਾ ਹਾਂ, ਕਿਉਂਕਿ ਇਹ ਸਾਰੀਆਂ ਬਰਕਤਾਂ ਗੁਰੂ ਦੀਆਂ ਹੀ ਹਨ। ਨਾਨਕ ਆਖਦਾ ਹੈ ਕਿ ਹੇ ਸੰਤ ਜਨੋ! (ਗੁਰੂ ਦਾ ਸ਼ਬਦ) ਸੁਣੋ, ਗੁਰੂ ਦੇ ਸ਼ਬਦ ਵਿਚ ਪਿਆਰ ਬਣਾਓ। (ਸਤਿਗੁਰੂ ਦੀ ਮੇਹਰ ਨਾਲ ਹੀ ਪ੍ਰਭੂ ਦਾ) ਸਦਾ ਕਾਇਮ ਰਹਿਣ ਵਾਲਾ ਨਾਮ ਮੇਰੀ ਜ਼ਿੰਦਗੀ ਦਾ ਆਸਰਾ (ਬਣ ਗਿਆ) ਹੈ ॥੪॥ ਉਸ ਭਾਗਾਂ ਵਾਲੇ (ਹਿਰਦੇ-) ਘਰ ਵਿਚ (ਮਾਨੋ) ਪੰਜ ਕਿਸਮਾਂ ਦੇ ਸਾਜ਼ਾਂ ਦੀਆਂ ਮਿਲਵੀਆਂ ਸੁਰਾਂ ਵੱਜ ਪੈਂਦੀਆਂ ਹਨ, ਜਿਸ (ਹਿਰਦੇ-) ਘਰ ਵਿਚ (ਹੇ ਪ੍ਰਭੂ! ਤੂੰ) ਸੱਤਿਆ ਪਾਈ ਹੈ, ਉਸ ਭਾਗਾਂ ਵਾਲੇ (ਹਿਰਦੇ-) ਘਰ ਵਿਚ (ਮਾਨੋ) ਪੰਜ ਕਿਸਮਾਂ ਦੇ ਸਾਜ਼ਾਂ ਦੀਆਂ ਮਿਲਵੀਆਂ ਸੁਰਾਂ ਵੱਜ ਪੈਂਦੀਆਂ ਹਨ (ਭਾਵ, ਉਸ ਹਿਰਦੇ ਵਿਚ ਪੂਰਨ ਆਨੰਦ ਬਣ ਜਾਂਦਾ ਹੈ), (ਹੇ ਪ੍ਰਭੂ!) ਉਸ ਦੇ ਪੰਜੇ ਕਾਮਾਦਿਕ ਵੈਰੀ ਤੂੰ ਕਾਬੂ ਵਿਚ ਕਰ ਦੇਂਦਾ ਹੈਂ, ਤੇ ਡਰਾਣ ਵਾਲਾ ਕਾਲ (ਭਾਵ, ਮੌਤ ਦਾ ਡਰ) ਦੂਰ ਕਰ ਦੇਂਦਾ ਹੈਂ। ਪਰ ਸਿਰਫ਼ ਉਹੀ ਮਨੁੱਖ ਹਰਿ-ਨਾਮ ਵਿਚ ਜੁੜਦੇ ਹਨ ਜਿਨ੍ਹਾਂ ਦੇ ਭਾਗਾਂ ਵਿਚ ਤੂੰ ਧੁਰ ਤੋਂ ਹੀ ਆਪਣੀ ਮੇਹਰ ਨਾਲ (ਸਿਮਰਨ ਦਾ ਲੇਖ ਲਿਖ ਕੇ) ਰੱਖ ਦਿੱਤਾ ਹੈ। ਨਾਨਕ ਆਖਦਾ ਹੈ ਕਿ ਉਸ ਹਿਰਦੇ-ਘਰ ਵਿਚ ਸੁਖ ਪੈਦਾ ਹੁੰਦਾ ਹੈ, ਉਸ ਹਿਰਦੇ ਵਿਚ (ਮਾਨੋ) ਇਕ-ਰਸ (ਵਾਜੇ) ਵੱਜਦੇ ਹਨ ॥੫॥ ਹੇ ਵੱਡੇ ਭਾਗਾਂ ਵਾਲਿਓ! ਸੁਣੋ, ਆਨੰਦ ਇਹ ਹੈ ਕਿ (ਉਸ ਅਵਸਥਾ ਵਿਚ) ਮਨ ਦੀਆਂ ਸਾਰੀਆਂ ਦੌੜਾਂ ਮੁੱਕ ਜਾਂਦੀਆਂ ਹਨ (ਸਾਰੇ ਸੰਕਲਪ ਸਿਰੇ ਚੜ੍ਹ ਜਾਂਦੇ ਹਨ), ਪਰਮ ਆਤਮਾ ਪ੍ਰਭੂ ਮਿਲ ਪੈਂਦਾ ਹੈ, ਸਾਰੇ ਚਿੰਤਾ-ਝੌਰੇ ਮਨ ਤੋਂ ਲਹਿ ਜਾਂਦੇ ਹਨ। ਅਕਾਲ ਪੁਰਖ ਦੀ ਸਿਫ਼ਤ-ਸਾਲਾਹ ਦੀ ਬਾਣੀ ਸੁਣਿਆਂ ਸਾਰੇ ਦੁੱਖ ਰੋਗ ਕਲੇਸ਼ ਮਿਟ ਜਾਂਦੇ ਹਨ। ਜੇਹੜੇ ਸੰਤ ਗੁਰਮੁਖਿ ਪੂਰੇ ਗੁਰੂ ਤੋਂ ਸਿਫ਼ਤ-ਸਾਲਾਹ ਦੀ ਬਾਣੀ ਨਾਲ ਸਾਂਝੀ ਪਾਣੀ ਸਿੱਖ ਲੈਂਦੇ ਹਨ ਉਹਨਾਂ ਦੇ ਹਿਰਦੇ ਖਿੜ ਆਉਂਦੇ ਹਨ। ਇਸ ਬਾਣੀ ਨੂੰ ਸੁਣਨ ਵਾਲੇ ਉਚਾਰਨ ਵਾਲੇ ਸਭ ਪਵਿਤ੍ਰ-ਆਤਮਕ ਹੋ ਜਾਂਦੇ ਹਨ, ਇਸ ਬਾਣੀ ਵਿਚ ਉਹਨਾਂ ਨੂੰ ਸਤਿਗੁਰੂ ਹੀ ਦਿੱਸਦਾ ਹੈ। ਨਾਨਕ ਬੇਨਤੀ ਕਰਦਾ ਹੈ-ਜੇਹੜੇ ਬੰਦੇ ਗੁਰੂ ਦੀ ਚਰਨੀਂ ਲੱਗਦੇ ਹਨ, ਉਹਨਾਂ ਦੇ ਅੰਦਰ ਇਕ-ਰਸ (ਖ਼ੁਸ਼ੀ ਦੇ) ਵਾਜੇ ਵੱਜ ਪੈਂਦੇ ਹਨ (ਉਹਨਾਂ ਦੇ ਅੰਦਰ ਆਤਮਕ ਆਨੰਦ ਪੈਦਾ ਹੋ ਜਾਂਦਾ ਹੈ) ॥੪੦॥੧॥`
      },
      {
        number: 17,
        sanskrit: `ਮੁੰਦਾਵਣੀ ਮਹਲਾ ੫ ॥
ਥਾਲ ਵਿਚਿ ਤਿੰਨਿ ਵਸਤੂ ਪਈਓ ਸਤੁ ਸੰਤੋਖੁ ਵੀਚਾਰੋ ॥
ਅੰਮ੍ਰਿਤ ਨਾਮੁ ਠਾਕੁਰ ਕਾ ਪਇਓ ਜਿਸ ਕਾ ਸਭਸੁ ਅਧਾਰੋ ॥
ਜੇ ਕੋ ਖਾਵੈ ਜੇ ਕੋ ਭੁੰਚੈ ਤਿਸ ਕਾ ਹੋਇ ਉਧਾਰੋ ॥
ਏਹ ਵਸਤੁ ਤਜੀ ਨਹ ਜਾਈ ਨਿਤ ਨਿਤ ਰਖੁ ਉਰਿ ਧਾਰੋ ॥
ਤਮ ਸੰਸਾਰੁ ਚਰਨ ਲਗਿ ਤਰੀਐ ਸਭੁ ਨਾਨਕ ਬ੍ਰਹਮ ਪਸਾਰੋ ॥੧॥`,
        transliteration: `mundaavanee mahalaa 5 |
thaal vich tin vasatoo peeo sat santokh veechaaro |
amrit naam tthaakur kaa peo jis kaa sabhas adhaaro |
je ko khaavai je ko bhunchai tis kaa hoe udhaaro |
eeh vasat tajee neh jaaee nit nit rakh ur dhaaro |
tam sansaar charan lag tareeai sabh naanak braham pasaaro |1|`,
        meaning: `Mundaavanee, Fifth Mehl: Upon this Plate, three things have been placed: Truth, Contentment and Contemplation. The Ambrosial Nectar of the Naam, the Name of our Lord and Master, has been placed upon it as well; it is the Support of all. One who eats it and enjoys it shall be saved. This thing can never be forsaken; keep this always and forever in your mind. The dark world-ocean is crossed over, by grasping the Feet of the Lord; O Nanak, it is all the extension of God. ||1||`,
        meaning_pa: `(ਉਸ ਮਨੁੱਖ ਦੇ ਹਿਰਦੇ-) ਥਾਲ ਵਿਚ ਉੱਚਾ ਆਚਰਨ, ਸੰਤੋਖ ਅਤੇ ਆਤਮਕ ਜੀਵਨ ਦੀ ਸੂਝ-ਇਹ ਤਿੰਨ ਵਸਤੂਆਂ ਟਿਕੀਆਂ ਰਹਿੰਦੀਆਂ ਹਨ, (ਜਿਸ ਮਨੁੱਖ ਦੇ ਹਿਰਦੇ-ਥਾਲ ਵਿਚ) ਪਰਮਾਤਮਾ ਦਾ ਆਤਮਕ ਜੀਵਨ ਦੇਣ ਵਾਲਾ ਨਾਮ ਆ ਵੱਸਦਾ ਹੈ (ਇਹ 'ਅੰਮ੍ਰਿਤ ਨਾਮੁ' ਐਸਾ ਹੈ) ਕਿ ਇਸ ਦਾ ਆਸਰਾ ਹਰੇਕ ਜੀਵ ਲਈ (ਜ਼ਰੂਰੀ) ਹੈ। (ਇਸ ਆਤਮਕ ਭੋਜਨ ਨੂੰ) ਜੇ ਕੋਈ ਮਨੁੱਖ ਸਦਾ ਖਾਂਦਾ ਰਹਿੰਦਾ ਹੈ, ਤਾਂ ਉਸ ਮਨੁੱਖ ਦਾ ਵਿਕਾਰਾਂ ਤੋਂ ਬਚਾਉ ਹੋ ਜਾਂਦਾ ਹੈ। (ਜੇ ਆਤਮਕ 'ਉਧਾਰ' ਦੀ ਲੋੜ ਹੈ ਤਾਂ) ਆਤਮਕ ਪ੍ਰਸੰਨਤਾ ਦੇਣ ਵਾਲੀ ਇਹ ਨਾਮ-ਵਸਤੂ ਤਿਆਗੀ ਨਹੀਂ ਜਾ ਸਕਦੀ, ਇਸ ਨੂੰ ਸਦਾ ਹੀ ਆਪਣੇ ਹਿਰਦੇ ਵਿਚ ਸਾਂਭ ਰੱਖ। ਹੇ ਨਾਨਕ! (ਇਸ ਨਾਮ ਵਸਤੂ ਦੀ ਬਰਕਤਿ ਨਾਲ) ਪ੍ਰਭੂ ਦੀ ਚਰਨੀਂ ਲੱਗ ਕੇ ਘੁੱਪ ਹਨੇਰਾ ਸੰਸਾਰ-ਸਮੁੰਦਰ ਤਰਿਆ ਜਾ ਸਕਦਾ ਹੈ ਅਤੇ ਹਰ ਥਾਂ ਪਰਮਾਤਮਾ ਦੇ ਆਪੇ ਦਾ ਪਰਕਾਸ਼ ਹੀ (ਦਿੱਸਣ ਲੱਗ ਪੈਂਦਾ ਹੈ) ॥੧॥`
      },
      {
        number: 18,
        sanskrit: `ਸਲੋਕ ਮਹਲਾ ੫ ॥
ਤੇਰਾ ਕੀਤਾ ਜਾਤੋ ਨਾਹੀ ਮੈਨੋ ਜੋਗੁ ਕੀਤੋਈ ॥
ਮੈ ਨਿਰਗੁਣਿਆਰੇ ਕੋ ਗੁਣੁ ਨਾਹੀ ਆਪੇ ਤਰਸੁ ਪਇਓਈ ॥
ਤਰਸੁ ਪਇਆ ਮਿਹਰਾਮਤਿ ਹੋਈ ਸਤਿਗੁਰੁ ਸਜਣੁ ਮਿਲਿਆ ॥
ਨਾਨਕ ਨਾਮੁ ਮਿਲੈ ਤਾਂ ਜੀਵਾਂ ਤਨੁ ਮਨੁ ਥੀਵੈ ਹਰਿਆ ॥੧॥`,
        transliteration: `salok mahalaa 5 |
teraa keetaa jaato naahee maino jog keetoee |
mai niraguniaare ko gun naahee aape taras peoee |
taras peaa miharaamat hoee satigur sajan miliaa |
naanak naam milai taan jeevaan tan man theevai hariaa |1|`,
        meaning: `Salok, Fifth Mehl: I have not appreciated what You have done for me, Lord; only You can make me worthy. I am unworthy - I have no worth or virtues at all. You have taken pity on me. You took pity on me, and blessed me with Your Mercy, and I have met the True Guru, my Friend. O Nanak, if I am blessed with the Naam, I live, and my body and mind blossom forth. ||1||`,
        meaning_pa: `(ਹੇ ਪ੍ਰਭੂ!) ਮੈਂ ਤੇਰੇ ਕੀਤੇ ਉਪਕਾਰ ਦੀ ਕਦਰ ਨਹੀਂ ਸਮਝ ਸਕਦਾ, (ਉਪਕਾਰ ਦੀ ਦਾਤ ਸਾਂਭਣ ਲਈ) ਤੂੰ (ਆਪ ਹੀ) ਮੈਨੂੰ ਫਬਵਾਂ ਭਾਂਡਾ ਬਣਾਇਆ ਹੈ। ਮੈਂ ਗੁਣ-ਹੀਨ ਵਿਚ ਕੋਈ ਗੁਣ ਨਹੀਂ ਹੈ। ਤੈਨੂੰ ਆਪ ਨੂੰ ਹੀ ਮੇਰੇ ਉਤੇ ਤਰਸ ਆ ਗਿਆ। ਹੇ ਪ੍ਰਭੂ! ਤੇਰੇ ਮਨ ਵਿਚ ਮੇਰੇ ਵਾਸਤੇ ਤਰਸ ਪੈਦਾ ਹੋਇਆ, ਮੇਰੇ ਉੱਤੇ ਤੇਰੀ ਮਿਹਰ ਹੋਈ, ਤਾਂ ਮੈਨੂੰ ਮਿੱਤਰ ਗੁਰੂ ਮਿਲ ਪਿਆ (ਤੇਰਾ ਇਹ ਉਪਕਾਰ ਭੁਲਾਇਆ ਨਹੀਂ ਜਾ ਸਕਦਾ)। ਨਾਨਕ ਆਖਦਾ ਹੈ- (ਹੁਣ ਪਿਆਰੇ ਗੁਰੂ ਪਾਸੋਂ) ਜਦੋਂ ਮੈਨੂੰ (ਤੇਰਾ) ਨਾਮ ਮਿਲਦਾ ਹੈ, ਤਾਂ ਮੇਰੇ ਅੰਦਰ ਆਤਮਕ ਜੀਵਨ ਪੈਦਾ ਹੋ ਜਾਂਦਾ ਹੈ, ਮੇਰਾ ਤਨ ਮੇਰਾ ਮਨ (ਉਸ ਆਤਮਕ ਜੀਵਨ ਦੀ ਬਰਕਤਿ ਨਾਲ) ਖਿੜ ਆਉਂਦਾ ਹੈ ॥੧॥`
      },
      {
        number: 19,
        sanskrit: `ਪਉੜੀ ॥
ਤਿਥੈ ਤੂ ਸਮਰਥੁ ਜਿਥੈ ਕੋਇ ਨਾਹਿ ॥
ਓਥੈ ਤੇਰੀ ਰਖ ਅਗਨੀ ਉਦਰ ਮਾਹਿ ॥
ਸੁਣਿ ਕੈ ਜਮ ਕੇ ਦੂਤ ਨਾਇ ਤੇਰੈ ਛਡਿ ਜਾਹਿ ॥
ਭਉਜਲੁ ਬਿਖਮੁ ਅਸਗਾਹੁ ਗੁਰਸਬਦੀ ਪਾਰਿ ਪਾਹਿ ॥
ਜਿਨ ਕਉ ਲਗੀ ਪਿਆਸ ਅੰਮ੍ਰਿਤੁ ਸੇਇ ਖਾਹਿ ॥
ਕਲਿ ਮਹਿ ਏਹੋ ਪੁੰਨੁ ਗੁਣ ਗੋਵਿੰਦ ਗਾਹਿ ॥
ਸਭਸੈ ਨੋ ਕਿਰਪਾਲੁ ਸਮੑਾਲੇ ਸਾਹਿ ਸਾਹਿ ॥
ਬਿਰਥਾ ਕੋਇ ਨ ਜਾਇ ਜਿ ਆਵੈ ਤੁਧੁ ਆਹਿ ॥੯॥`,
        transliteration: `paurree |
tithai too samarath jithai koe naeh |
othai teree rakh aganee udar maeh |
sun kai jam ke doot naae terai chhadd jaeh |
bhaujal bikham asagaahu gurasabadee paar paeh |
jin kau lagee piaas amrit see khaeh |
kal meh eho pun gun govind gaeh |
sabhasai no kirapaal samaale saeh saeh |
birathaa koe na jaae ji aavai tudh aaeh |9|`,
        meaning: `Pauree: Where You are, Almighty Lord, there is no one else. There, in the fire of the mother's womb, You protected us. Hearing Your Name, the Messenger of Death runs away. The terrifying, treacherous, impassible world-ocean is crossed over, through the Word of the Guru's Shabad. Those who feel thirst for You, take in Your Ambrosial Nectar. This is the only act of goodness in this Dark Age of Kali Yuga, to sing the Glorious Praises of the Lord of the Universe. He is Merciful to all; He sustains us with each and every breath. Those who come to You with love and faith are never turned away empty-handed. ||9||`,
        meaning_pa: `(ਹੇ ਪ੍ਰਭੂ!) ਜਿੱਥੇ ਹੋਰ ਕੋਈ (ਜੀਵ ਸਹਾਇਤਾ ਕਰਨ ਜੋਗਾ) ਨਹੀਂ ਉਥੇ, ਹੇ ਪ੍ਰਭੂ! ਤੂੰ ਹੀ ਮਦਦ ਕਰਨ ਜੋਗਾ ਹੈਂ। ਮਾਂ ਦੇ ਪੇਟ ਦੀ ਅੱਗ ਵਿਚ ਜੀਵ ਨੂੰ ਤੇਰਾ ਹੀ ਸਹਾਰਾ ਹੁੰਦਾ ਹੈ। (ਹੇ ਪ੍ਰਭੂ! ਤੇਰਾ ਨਾਮ) ਸੁਣ ਕੇ ਜਮਦੂਤ (ਨੇੜੇ ਨਹੀਂ ਢੁਕਦੇ), ਤੇਰੇ ਨਾਮ ਦੀ ਬਰਕਤਿ ਨਾਲ (ਜੀਵ ਨੂੰ) ਛੱਡ ਕੇ ਚਲੇ ਜਾਂਦੇ ਹਨ। ਇਸ ਔਖੇ ਤੇ ਅਥਾਹ ਸੰਸਾਰ-ਸਮੁੰਦਰ ਨੂੰ ਜੀਵ ਗੁਰੂ ਦੇ ਸ਼ਬਦ (ਦੀ ਸਹਾਇਤਾ) ਨਾਲ ਪਾਰ ਕਰ ਲੈਂਦੇ ਹਨ। ਪਰ ਉਹੀ ਬੰਦੇ ਆਤਮਕ ਜੀਵਨ ਦੇਣ ਵਾਲਾ ਨਾਮ-ਜਲ ਛਕਦੇ ਹਨ ਜਿਨ੍ਹਾਂ ਦੇ ਅੰਦਰ ਇਸ ਦੀ ਭੁੱਖ-ਪਿਆਸ ਪੈਦਾ ਹੋਈ ਹੈ। ਜੇਹੜੇ ਸੰਸਾਰ ਵਿਚ ਨਾਮ-ਸਿਮਰਨ ਨੂੰ ਹੀ ਸਭ ਤੋਂ ਚੰਗਾ ਨੇਕ ਕੰਮ ਜਾਣ ਕੇ ਪ੍ਰਭੂ ਦੇ ਗੁਣ ਗਾਂਦੇ ਹਨ। ਕਿਰਪਾਲ ਪ੍ਰਭੂ ਹਰੇਕ ਜੀਵ ਦੀ ਸੁਆਸ ਸੁਆਸ ਸੰਭਾਲ ਕਰਦਾ ਹੈ। ਹੇ ਪ੍ਰਭੂ! ਜਿਹੜਾ ਜੀਵ ਤੇਰੀ ਸਰਨ ਆਉਂਦਾ ਹੈ ਉਹ (ਤੇਰੇ ਦਰ ਤੋਂ) ਖ਼ਾਲੀ ਨਹੀਂ ਜਾਂਦਾ ॥੯॥`
      },
      {
        number: 20,
        sanskrit: `ਸਲੋਕੁ ਮਃ ੫ ॥
ਅੰਤਰਿ ਗੁਰੁ ਆਰਾਧਣਾ ਜਿਹਵਾ ਜਪਿ ਗੁਰ ਨਾਉ ॥
ਨੇਤ੍ਰੀ ਸਤਿਗੁਰੁ ਪੇਖਣਾ ਸ੍ਰਵਣੀ ਸੁਨਣਾ ਗੁਰ ਨਾਉ ॥
ਸਤਿਗੁਰ ਸੇਤੀ ਰਤਿਆ ਦਰਗਹ ਪਾਈਐ ਠਾਉ ॥
ਕਹੁ ਨਾਨਕ ਕਿਰਪਾ ਕਰੇ ਜਿਸ ਨੋ ਏਹ ਵਥੁ ਦੇਇ ॥
ਜਗ ਮਹਿ ਉਤਮ ਕਾਢੀਅਹਿ ਵਿਰਲੇ ਕੇਈ ਕੇਇ ॥੧॥`,
        transliteration: `salok mahalaa 5 |
antar gur aaraadhanaa jihavaa jap gur naau |
netree satigur pekhanaa sravanee sunanaa gur naau |
satigur setee ratiaa daragah paaeeai tthaau |
kahu naanak kirapaa kare jis no eeh vath dee |
jag meh utam kaadteeeh virale keee kee |1|`,
        meaning: `Salok, Fifth Mehl: Deep within yourself, worship the Guru in adoration, and with your tongue, chant the Guru's Name. Let your eyes behold the True Guru, and let your ears hear the Guru's Name. Attuned to the True Guru, you shall receive a place of honor in the Court of the Lord. Says Nanak, this treasure is bestowed on those who are blessed with His Mercy. In the midst of the world, they are known as the most pious - they are rare indeed. ||1||`,
        meaning_pa: `ਗੁਰੂ ਅਰਜਨਦੇਵ ਜੀ ਦਾ ਸਲੋਕ। ਮਨ ਵਿਚ ਗੁਰੂ ਨੂੰ ਯਾਦ ਕਰਨਾ, ਜੀਭ ਨਾਲ ਗੁਰੂ ਦਾ ਨਾਮ ਜਪਣਾ, ਅੱਖਾਂ ਨਾਲ ਗੁਰੂ ਨੂੰ ਵੇਖਣਾ, ਕੰਨਾਂ ਨਾਲ ਗੁਰੂ ਦਾ ਨਾਮ ਸੁਣਨਾ; ਜੇ ਇਸ ਤਰ੍ਹਾਂ ਆਪਣੇ ਗੁਰੂ (ਦੇ ਪਿਆਰ) ਵਿਚ ਰੰਗੇ ਜਾਈਏ ਤਾਂ (ਪ੍ਰਭੂ ਦੀ) ਹਜ਼ੂਰੀ ਵਿਚ ਥਾਂ ਮਿਲਦਾ ਹੈ। ਹੇ ਨਾਨਕ! ਇਹ ਦਾਤ ਉਸ ਮਨੁੱਖ ਨੂੰ ਪ੍ਰਭੂ ਦੇਂਦਾ ਹੈ ਜਿਸ ਉਤੇ ਮੇਹਰ ਕਰਦਾ ਹੈ, ਅਜੇਹੇ ਬੰਦੇ ਜਗਤ ਵਿਚ ਸ੍ਰੇਸ਼ਟ ਅਖਵਾਉਂਦੇ ਹਨ, (ਪਰ ਅਜੇਹੇ ਹੁੰਦੇ) ਕੋਈ ਵਿਰਲੇ ਵਿਰਲੇ ਹਨ ॥੧॥`
      },
      {
        number: 21,
        sanskrit: `ਮਃ ੫ ॥
ਰਖੇ ਰਖਣਹਾਰਿ ਆਪਿ ਉਬਾਰਿਅਨੁ ॥
ਗੁਰ ਕੀ ਪੈਰੀ ਪਾਇ ਕਾਜ ਸਵਾਰਿਅਨੁ ॥
ਹੋਆ ਆਪਿ ਦਇਆਲੁ ਮਨਹੁ ਨ ਵਿਸਾਰਿਅਨੁ ॥
ਸਾਧ ਜਨਾ ਕੈ ਸੰਗਿ ਭਵਜਲੁ ਤਾਰਿਅਨੁ ॥
ਸਾਕਤ ਨਿੰਦਕ ਦੁਸਟ ਖਿਨ ਮਾਹਿ ਬਿਦਾਰਿਅਨੁ ॥
ਤਿਸੁ ਸਾਹਿਬ ਕੀ ਟੇਕ ਨਾਨਕ ਮਨੈ ਮਾਹਿ ॥
ਜਿਸੁ ਸਿਮਰਤ ਸੁਖੁ ਹੋਇ ਸਗਲੇ ਦੂਖ ਜਾਹਿ ॥੨॥`,
        transliteration: `mahalaa 5 |
rakhe rakhanahaar aap ubaarian |
gur kee pairee paae kaaj savaarian |
hoaa aap deaal manahu na visaarian |
saadh janaa kai sang bhavajal taarian |
saakat nindak dusatt khin maeh bidaarian |
tis saahib kee ttek naanak manai maeh |
jis simarat sukh hoe sagale dookh jaeh |2|`,
        meaning: `Fifth Mehl: O Savior Lord, save us and take us across. Falling at the feet of the Guru, our works are embellished with perfection. You have become kind, merciful and compassionate; we do not forget You from our minds. In the Saadh Sangat, the Company of the Holy, we are carried across the terrifying world-ocean. In an instant, You have destroyed the faithless cynics and slanderous enemies. That Lord and Master is my Anchor and Support; O Nanak, hold firm in your mind. Remembering Him in meditation, happiness comes, and all sorrows and pains simply vanish. ||2||`,
        meaning_pa: `ਰੱਖਿਆ ਕਰਨ ਵਾਲੇ ਪਰਮਾਤਮਾ ਨੇ ਆਪ (ਵਿਕਾਰਾਂ ਤੋਂ) ਬਚਾ ਲਿਆ ਹੈ, ਤੇ ਗੁਰੂ ਦੀ ਪੈਰੀਂ ਪਾ ਕੇ ਸਾਰੇ ਕੰਮ ਉਸ ਨੇ ਸਵਾਰ ਦਿੱਤੇ ਹਨ, ਜਿਨ੍ਹਾਂ ਉਤੇ ਪ੍ਰਭੂ ਆਪ ਦਿਆਲ ਹੋਇਆ ਹੈ, ਉਹਨਾਂ ਨੂੰ ਉਸ ਨੇ (ਆਪਣੇ) ਮਨੋਂ ਵਿਸਾਰਿਆ ਨਹੀਂ, ਤੇ ਉਹਨਾਂ ਨੂੰ ਗੁਰਮੁਖਾਂ ਦੀ ਸੰਗਤ ਵਿਚ (ਰੱਖ ਕੇ) ਸੰਸਾਰ-ਸਮੁੰਦਰ ਤਰਾ ਦਿੱਤਾ। ਜੋ ਉਸ ਦੇ ਚਰਨਾਂ ਤੋਂ ਟੁੱਟੇ ਹੋਏ ਹਨ, ਜੋ ਨਿੰਦਾ ਕਰਦੇ ਰਹਿੰਦੇ ਹਨ, ਜੋ ਗੰਦੇ ਆਚਰਨ ਵਾਲੇ ਹਨ, ਉਹਨਾਂ ਨੂੰ ਇਕ ਪਲ ਵਿਚ ਉਸ ਨੇ ਮਾਰ ਮੁਕਾਇਆ ਹੈ। ਨਾਨਕ ਦੇ ਮਨ ਵਿਚ ਭੀ ਉਸ ਮਾਲਕ ਦਾ ਆਸਰਾ ਹੈ, ਜਿਸ ਨੂੰ ਸਿਮਰਿਆਂ ਸੁਖ ਮਿਲਦਾ ਹੈ ਤੇ ਸਾਰੇ ਦੁੱਖ ਦੂਰ ਹੋ ਜਾਂਦੇ ਹਨ ॥੨॥`
      }
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
      {
        number: 1,
        sanskrit: `ਸੋਹਿਲਾ ਰਾਗੁ ਗਉੜੀ ਦੀਪਕੀ ਮਹਲਾ ੧ ॥
ੴ ਸਤਿਗੁਰ ਪ੍ਰਸਾਦਿ ॥
ਜੈ ਘਰਿ ਕੀਰਤਿ ਆਖੀਐ ਕਰਤੇ ਕਾ ਹੋਇ ਬੀਚਾਰੋ ॥
ਤਿਤੁ ਘਰਿ ਗਾਵਹੁ ਸੋਹਿਲਾ ਸਿਵਰਿਹੁ ਸਿਰਜਣਹਾਰੋ ॥੧॥
ਤੁਮ ਗਾਵਹੁ ਮੇਰੇ ਨਿਰਭਉ ਕਾ ਸੋਹਿਲਾ ॥
ਹਉ ਵਾਰੀ ਜਿਤੁ ਸੋਹਿਲੈ ਸਦਾ ਸੁਖੁ ਹੋਇ ॥੧॥ ਰਹਾਉ ॥
ਨਿਤ ਨਿਤ ਜੀਅੜੇ ਸਮਾਲੀਅਨਿ ਦੇਖੈਗਾ ਦੇਵਣਹਾਰੁ ॥
ਤੇਰੇ ਦਾਨੈ ਕੀਮਤਿ ਨਾ ਪਵੈ ਤਿਸੁ ਦਾਤੇ ਕਵਣੁ ਸੁਮਾਰੁ ॥੨॥
ਸੰਬਤਿ ਸਾਹਾ ਲਿਖਿਆ ਮਿਲਿ ਕਰਿ ਪਾਵਹੁ ਤੇਲੁ ॥
ਦੇਹੁ ਸਜਣ ਅਸੀਸੜੀਆ ਜਿਉ ਹੋਵੈ ਸਾਹਿਬ ਸਿਉ ਮੇਲੁ ॥੩॥
ਘਰਿ ਘਰਿ ਏਹੋ ਪਾਹੁਚਾ ਸਦੜੇ ਨਿਤ ਪਵੰਨਿ ॥
ਸਦਣਹਾਰਾ ਸਿਮਰੀਐ ਨਾਨਕ ਸੇ ਦਿਹ ਆਵੰਨਿ ॥੪॥੧॥`,
        transliteration: `sohilaa raag gaurree deepakee mahalaa 1 |
ik oankaar satigur prasaad |
jai ghar keerat aakheeai karate kaa hoe beechaaro |
tit ghar gaavahu sohilaa sivarihu sirajanahaaro |1|
tum gaavahu mere nirbhau kaa sohilaa |
hau vaaree jit sohilai sadaa sukh hoe |1| rahaau |
nit nit jeearre samaaleean dekhaigaa devanahaar |
tere daanai keemat naa pavai tis daate kavan sumaar |2|
sanbat saahaa likhiaa mil kar paavahu tel |
dehu sajan aseesarreea jiau hovai saahib siau mel |3|
ghar ghar eho paahuchaa sadarre nit pavan |
sadanahaaraa simareeai naanak se dih aavan |4|1|`,
        meaning: `Sohilaa ~ The Song Of Praise. Raag Gauree Deepakee, First Mehl: One Universal Creator God. By The Grace Of The True Guru: In that house where the Praises of the Creator are chanted and contemplated -in that house, sing Songs of Praise; meditate and remember the Creator Lord. ||1|| Sing the Songs of Praise of my Fearless Lord. I am a sacrifice to that Song of Praise which brings eternal peace. ||1||Pause|| Day after day, He cares for His beings; the Great Giver watches over all. Your Gifts cannot be appraised; how can anyone compare to the Giver? ||2|| The day of my wedding is pre-ordained. Come, gather together and pour the oil over the threshold. My friends, give me your blessings, that I may merge with my Lord and Master. ||3|| Unto each and every home, into each and every heart, this summons is sent out; the call comes each and every day. Remember in meditation the One who summons us; O Nanak, that day is drawing near! ||4||1||`,
        meaning_pa: `ਰਾਗ ਗਉੜੀ-ਦੀਪਕੀ ਵਿੱਚ ਗੁਰੂ ਨਾਨਕ ਜੀ ਦੀ ਬਾਣੀ 'ਸੋਹਿਲਾ'। ਅਕਾਲ ਪੁਰਖ ਇੱਕ ਹੈ ਅਤੇ ਸਤਿਗੁਰੂ ਦੀ ਕਿਰਪਾ ਨਾਲ ਮਿਲਦਾ ਹੈ। ਜਿਸ (ਸਤਸੰਗ-) ਘਰ ਵਿਚ (ਪਰਮਾਤਮਾ ਦੀ) ਸਿਫ਼ਤ-ਸਾਲਾਹ ਕੀਤੀ ਜਾਂਦੀ ਹੈ ਅਤੇ ਕਰਤਾਰ ਦੇ ਗੁਣਾਂ ਦੀ ਵਿਚਾਰ ਹੁੰਦੀ ਹੈ, (ਹੇ ਜਿੰਦ-ਕੁੜੀਏ!) ਉਸ (ਸਤਸੰਗ-) ਘਰ ਵਿਚ (ਜਾ ਕੇ ਤੂੰ ਭੀ) ਪ੍ਰਭੂ ਦੀ ਸਿਫ਼ਤ-ਸਾਲਾਹ ਦੇ ਗੀਤ (ਸੁਹਾਗ-ਮਿਲਾਪ ਦੀ ਤਾਂਘ ਦੇ ਸ਼ਬਦ) ਗਾਇਆ ਕਰ ਅਤੇ ਆਪਣੇ ਪੈਦਾ ਕਰਨ ਵਾਲੇ ਪ੍ਰਭੂ ਨੂੰ ਯਾਦ ਕਰਿਆ ਕਰ ॥੧॥ (ਹੇ ਜਿੰਦੇ!) ਤੂੰ (ਸਤਸੰਗੀਆਂ ਨਾਲ ਮਿਲ ਕੇ) ਪਿਆਰੇ ਨਿਰਭਉ (ਖਸਮ) ਦੀ ਸਿਫ਼ਤਿ ਦੇ ਗੀਤ ਗਾ (ਅਤੇ ਆਖ) ਮੈਂ ਸਦਕੇ ਹਾਂ ਉਸ ਸਿਫ਼ਤਿ-ਦੇ-ਗੀਤ ਤੋਂ ਜਿਸ ਦੀ ਬਰਕਤਿ ਨਾਲ ਸਦਾ ਦਾ ਸੁਖ ਮਿਲਦਾ ਹੈ ॥੧॥ ਰਹਾਉ ॥ (ਹੇ ਜਿੰਦੇ! ਜਿਸ ਖਸਮ ਦੀ ਹਜ਼ੂਰੀ ਵਿਚ) ਸਦਾ ਹੀ ਜੀਵਾਂ ਦੀ ਸੰਭਾਲ ਹੋ ਰਹੀ ਹੈ, ਜੋ ਦਾਤਾਂ ਦੇਣ ਵਾਲਾ ਮਾਲਕ (ਹਰੇਕ ਜੀਵ ਦੀ) ਸੰਭਾਲ ਕਰਦਾ ਹੈ। (ਜਿਸ ਦਾਤਾਰ ਦੀਆਂ) ਦਾਤਾਂ ਦਾ ਮੁੱਲ (ਹੇ ਜਿੰਦੇ!) ਤੇਰੇ ਪਾਸੋਂ ਨਹੀਂ ਪੈ ਸਕਦਾ, ਉਸ ਦਾਤਾਰ ਦਾ ਭੀ ਕੀਹ ਅੰਦਾਜ਼ਾ (ਤੂੰ ਲਾ ਸਕਦੀ ਹੈਂ)? (ਉਹ ਦਾਤਾਰ-ਪ੍ਰਭੂ ਬਹੁਤ ਬੇਅੰਤ ਹੈ) ॥੨॥ (ਸਤਸੰਗ ਵਿਚ ਜਾ ਕੇ, ਹੇ ਜਿੰਦੇ! ਅਰਜ਼ੋਈਆਂ ਕਰਿਆ ਕਰ।) ਉਹ ਸੰਮਤ ਉਹ ਦਿਹਾੜਾ (ਪਹਿਲਾਂ ਹੀ) ਮਿਥਿਆ ਹੋਇਆ ਹੈ (ਜਦੋਂ ਪਤੀ ਦੇ ਦੇਸ ਜਾਣ ਲਈ ਮੇਰੇ ਵਾਸਤੇ ਸਾਹੇ-ਚਿੱਠੀ ਆਉਣੀ ਹੈ। ਹੇ ਸਤਸੰਗੀ ਸਹੇਲੀਓ!) ਰਲ ਕੇ ਮੈਨੂੰ ਮਾਂਈਏਂ ਪਾਓ, ਤੇ, ਹੇ ਸੱਜਣ (ਸਹੇਲੀਓ!) ਮੈਨੂੰ ਸੋਹਣੀਆਂ ਅਸੀਸਾਂ ਭੀ ਦਿਓ (ਭਾਵ, ਮੇਰੇ ਲਈ ਅਰਦਾਸ ਭੀ ਕਰੋ) ਜਿਵੇਂ ਪ੍ਰਭੂ-ਪਤੀ ਨਾਲ ਮੇਰਾ ਮਿਲਾਪ ਹੋ ਜਾਏ ॥੩॥ (ਪਰਲੋਕ ਵਿਚ ਜਾਣ ਲਈ ਮੌਤ ਦੀ) ਇਹ ਸਾਹੇ-ਚਿੱਠੀ ਹਰੇਕ ਘਰ ਵਿਚ ਆ ਰਹੀ ਹੈ, ਇਹ ਸੱਦੇ ਨਿਤ ਪੈ ਰਹੇ ਹਨ। (ਹੇ ਸਤਸੰਗੀਓ!) ਉਸ ਸੱਦਾ ਭੇਜਣ ਵਾਲੇ ਪ੍ਰਭੂ-ਪਤੀ ਨੂੰ ਯਾਦ ਰੱਖਣਾ ਚਾਹੀਦਾ ਹੈ (ਕਿਉਂਕਿ) ਹੇ ਨਾਨਕ! (ਸਾਡੇ ਭੀ) ਉਹ ਦਿਨ (ਨੇੜੇ) ਆ ਰਹੇ ਹਨ ॥੪॥੧॥`
      },
      {
        number: 2,
        sanskrit: `ਰਾਗੁ ਆਸਾ ਮਹਲਾ ੧ ॥
ਛਿਅ ਘਰ ਛਿਅ ਗੁਰ ਛਿਅ ਉਪਦੇਸ ॥
ਗੁਰੁ ਗੁਰੁ ਏਕੋ ਵੇਸ ਅਨੇਕ ॥੧॥
ਬਾਬਾ ਜੈ ਘਰਿ ਕਰਤੇ ਕੀਰਤਿ ਹੋਇ ॥
ਸੋ ਘਰੁ ਰਾਖੁ ਵਡਾਈ ਤੋਇ ॥੧॥ ਰਹਾਉ ॥
ਵਿਸੁਏ ਚਸਿਆ ਘੜੀਆ ਪਹਰਾ ਥਿਤੀ ਵਾਰੀ ਮਾਹੁ ਹੋਆ ॥
ਸੂਰਜੁ ਏਕੋ ਰੁਤਿ ਅਨੇਕ ॥ ਨਾਨਕ ਕਰਤੇ ਕੇ ਕੇਤੇ ਵੇਸ ॥੨॥੨॥`,
        transliteration: `raag aasaa mahalaa 1 |
chhia ghar chhia gur chhia upades |
gur gur eko ves anek |1|
baabaa jai ghar karate keerat hoe |
so ghar raakh vaddaaee toe |1| rahaau |
visue chasiaa gharreea paharaa thitee vaaree maahu hoaa |
sooraj eko rut anek | naanak karate ke kete ves |2|2|`,
        meaning: `Raag Aasaa, First Mehl: There are six schools of philosophy, six teachers, and six sets of teachings. But the Teacher of teachers is the One, who appears in so many forms. ||1|| O Baba: that system in which the Praises of the Creator are sung -follow that system; in it rests true greatness. ||1||Pause|| The seconds, minutes and hours, days, weeks and months, And the various seasons originate from the one sun; O Nanak, in just the same way, the many forms originate from the Creator. ||2||2||`,
        meaning_pa: `ਰਾਗ ਆਸਾ ਵਿੱਚ ਗੁਰੂ ਨਾਨਕ ਜੀ ਦੀ ਬਾਣੀ। (ਹੇ ਭਾਈ!) ਛੇ ਸ਼ਾਸਤਰ ਹਨ, ਛੇ ਹੀ (ਇਹਨਾਂ ਸ਼ਾਸਤਰਾਂ ਦੇ) ਚਲਾਣ ਵਾਲੇ ਹਨ, ਛੇ ਹੀ ਇਹਨਾਂ ਦੇ ਸਿੱਧਾਂਤ ਹਨ। ਪਰ ਇਹਨਾਂ ਸਾਰਿਆਂ ਦਾ ਮੂਲ-ਗੁਰੂ (ਪਰਮਾਤਮਾ) ਇੱਕ ਹੈ। (ਇਹ ਸਾਰੇ ਸਿਧਾਂਤ) ਉਸ ਇੱਕ ਪ੍ਰਭੂ ਦੇ ਹੀ ਅਨੇਕਾਂ ਵੇਸ ਹਨ (ਪ੍ਰਭੂ ਦੀ ਹਸਤੀ ਦੇ ਪਰਕਾਸ਼ ਦੇ ਰੂਪ ਹਨ) ॥੧॥ ਹੇ ਭਾਈ! ਜਿਸ (ਸਤਸੰਗ-) ਘਰ ਵਿਚ ਕਰਤਾਰ ਦੀ ਸਿਫ਼ਤ-ਸਾਲਾਹ ਹੁੰਦੀ ਹੈ, ਉਸ ਘਰ ਨੂੰ ਸਾਂਭ ਰੱਖ (ਉਸ ਸਤਸੰਗ ਦਾ ਆਸਰਾ ਲਈ ਰੱਖ) ਇਸੇ ਵਿਚ ਤੇਰੀ ਭਲਾਈ ਹੈ ॥੧॥ ਰਹਾਉ ॥ ਜਿਵੇਂ ਵਿਸੁਏ, ਚਸੇ, ਘੜੀਆਂ, ਪਹਰ, ਥਿੱਤਾਂ, ਵਾਰ, ਮਹੀਨਾ (ਆਦਿਕ), ਅਤੇ ਹੋਰ ਅਨੇਕਾਂ ਰੁੱਤਾਂ ਹਨ, ਪਰ ਸੂਰਜ ਇਕੋ ਹੀ ਹੈ (ਜਿਸ ਦੇ ਇਹ ਸਾਰੇ ਵਖ ਵਖ ਰੂਪ ਹਨ), ਤਿਵੇਂ, ਹੇ ਨਾਨਕ! ਕਰਤਾਰ ਦੇ (ਇਹ ਸਾਰੇ ਸਿਧਾਂਤ ਆਦਿਕ) ਅਨੇਕਾਂ ਸਰੂਪ ਹਨ ॥੨॥੨॥`
      },
      {
        number: 3,
        sanskrit: `ਰਾਗੁ ਧਨਾਸਰੀ ਮਹਲਾ ੧ ॥
ਗਗਨ ਮੈ ਥਾਲੁ ਰਵਿ ਚੰਦੁ ਦੀਪਕ ਬਨੇ ਤਾਰਿਕਾ ਮੰਡਲ ਜਨਕ ਮੋਤੀ ॥
ਧੂਪੁ ਮਲਆਨਲੋ ਪਵਣੁ ਚਵਰੋ ਕਰੇ ਸਗਲ ਬਨਰਾਇ ਫੂਲੰਤ ਜੋਤੀ ॥੧॥
ਕੈਸੀ ਆਰਤੀ ਹੋਇ ॥ ਭਵ ਖੰਡਨਾ ਤੇਰੀ ਆਰਤੀ ॥
ਅਨਹਤਾ ਸਬਦ ਵਾਜੰਤ ਭੇਰੀ ॥੧॥ ਰਹਾਉ ॥
ਸਹਸ ਤਵ ਨੈਨ ਨਨ ਨੈਨ ਹਹਿ ਤੋਹਿ ਕਉ ਸਹਸ ਮੂਰਤਿ ਨਨਾ ਏਕ ਤੋੁਹੀ ॥
ਸਹਸ ਪਦ ਬਿਮਲ ਨਨ ਏਕ ਪਦ ਗੰਧ ਬਿਨੁ ਸਹਸ ਤਵ ਗੰਧ ਇਵ ਚਲਤ ਮੋਹੀ ॥੨॥
ਸਭ ਮਹਿ ਜੋਤਿ ਜੋਤਿ ਹੈ ਸੋਇ ॥
ਤਿਸ ਦੈ ਚਾਨਣਿ ਸਭ ਮਹਿ ਚਾਨਣੁ ਹੋਇ ॥
ਗੁਰ ਸਾਖੀ ਜੋਤਿ ਪਰਗਟੁ ਹੋਇ ॥
ਜੋ ਤਿਸੁ ਭਾਵੈ ਸੁ ਆਰਤੀ ਹੋਇ ॥੩॥
ਹਰਿ ਚਰਣ ਕਵਲ ਮਕਰੰਦ ਲੋਭਿਤ ਮਨੋ ਅਨਦਿਨੋੁ ਮੋਹਿ ਆਹੀ ਪਿਆਸਾ ॥
ਕ੍ਰਿਪਾ ਜਲੁ ਦੇਹਿ ਨਾਨਕ ਸਾਰਿੰਗ ਕਉ ਹੋਇ ਜਾ ਤੇ ਤੇਰੈ ਨਾਇ ਵਾਸਾ ॥੪॥੩॥`,
        transliteration: `raag dhanaasaree mahalaa 1 |
gagan mai thaal rav chand deepak bane taarikaa manddal janak motee |
dhoop malaanalo pavan chavaro kare sagal banaraae foolant jotee |1|
kaisee aaratee hoe | bhav khanddanaa teree aaratee |
anahataa sabad vaajant bheree |1| rahaau |
sehas tav nain nan nain heh tohi kau sehas moorat nanaa ek tuohee |
sehas pad bimal nan ek pad gandh bin sehas tav gandh iv chalat mohee |2|
sabh meh jot jot hai soe |
tis dai chaanan sabh meh chaanan hoe |
gur saakhee jot paragatt hoe |
jo tis bhaavai su aaratee hoe |3|
har charan kaval makarand lobhit mano anadinuo mohi aahee piaasaa |
kripaa jal dehi naanak saaring kau hoe jaa te terai naae vaasaa |4|3|`,
        meaning: `Raag Dhanaasaree, First Mehl: Upon that cosmic plate of the sky, the sun and the moon are the lamps. The stars and their orbs are the studded pearls. The fragrance of sandalwood in the air is the temple incense, and the wind is the fan. All the plants of the world are the altar flowers in offering to You, O Luminous Lord. ||1|| What a beautiful Aartee, lamp-lit worship service this is! O Destroyer of Fear, this is Your Ceremony of Light. The Unstruck Sound-current of the Shabad is the vibration of the temple drums. ||1||Pause|| You have thousands of eyes, and yet You have no eyes. You have thousands of forms, and yet You do not have even one. You have thousands of Lotus Feet, and yet You do not have even one foot. You have no nose, but you have thousands of noses. This Play of Yours entrances me. ||2|| Amongst all is the Light-You are that Light. By this Illumination, that Light is radiant within all. Through the Guru's Teachings, the Light shines forth. That which is pleasing to Him is the lamp-lit worship service. ||3|| My mind is enticed by the honey-sweet Lotus Feet of the Lord. Day and night, I thirst for them. Bestow the Water of Your Mercy upon Nanak, the thirsty song-bird, so that he may come to dwell in Your Name. ||4||3||`,
        meaning_pa: `ਰਾਗ ਧਨਾਸਰੀ ਵਿੱਚ ਗੁਰੂ ਨਾਨਕ ਜੀ ਦੀ ਬਾਣੀ। ਸਾਰਾ ਆਕਾਸ਼ (ਮਾਨੋ) ਥਾਲ ਹੈ ਤੇ ਸੂਰਜ ਤੇ ਚੰਦ (ਉਸ ਥਾਲ ਵਿਚ) ਦੀਵੇ ਬਣੇ ਹੋਏ ਹਨ। ਤਾਰਿਆਂ ਦੇ ਸਮੂਹ, ਮਾਨੋ, (ਥਾਲ ਵਿਚ) ਮੋਤੀ ਰੱਖੇ ਹੋਏ ਹਨ। ਮਲਯ ਪਰਬਤ ਵਲੋਂ ਆਉਣ ਵਾਲੀ ਹਵਾ, ਮਾਨੋ, ਧੂਪ (ਧੁਖ ਰਿਹਾ) ਹੈ, ਤੇ ਹਵਾ ਚੌਰ ਕਰ ਰਹੀ ਹੈ। ਸਾਰੀ ਬਨਸਪਤੀ ਜੋਤਿ-ਰੂਪ (ਪ੍ਰਭੂ ਦੀ ਆਰਤੀ) ਵਾਸਤੇ ਫੁੱਲ ਦੇ ਰਹੀ ਹੈ ॥੧॥ (ਕੁਦਰਤਿ ਵਿਚ) ਤੇਰੀ ਕੈਸੀ ਸੁੰਦਰ ਆਰਤੀ ਹੋ ਰਹੀ ਹੈ! ਹੇ ਜੀਵਾਂ ਦੇ ਜਨਮ ਮਰਨ ਨਾਸ ਕਰਨ ਵਾਲੇ! ਇਹ ਹੈ ਤੇਰੀ ਅਦਭੁਤ ਆਰਤੀ! (ਸਭ ਜੀਵਾਂ ਵਿਚ ਰੁਮਕ ਰਹੀ) ਇੱਕੋ ਜੀਵਨ-ਰੌ, ਮਾਨੋ, ਤੇਰੀ ਆਰਤੀ ਵਾਸਤੇ ਨਾਗਾਰੇ ਵੱਜ ਰਹੇ ਹਨ ॥੧॥ ਰਹਾਉ ॥ (ਸਭ ਜੀਵਾਂ ਵਿਚ ਵਿਆਪਕ ਹੋਣ ਕਰਕੇ) ਹਜ਼ਾਰਾਂ ਤੇਰੀਆਂ ਅੱਖਾਂ ਹਨ (ਪਰ, ਨਿਰਾਕਾਰ ਹੋਣ ਕਰਕੇ, ਹੇ ਪ੍ਰਭੂ!) ਤੇਰੀਆਂ ਕੋਈ ਅੱਖਾਂ ਨਹੀਂ। ਹਜ਼ਾਰਾਂ ਤੇਰੀਆਂ ਸ਼ਕਲਾਂ ਹਨ, ਪਰ ਤੇਰੀ ਕੋਈ ਭੀ ਸ਼ਕਲ ਨਹੀਂ ਹੈ। ਹਜ਼ਾਰਾਂ ਤੇਰੇ ਸੋਹਣੇ ਪੈਰ ਹਨ, (ਪਰ ਨਿਰਾਕਾਰ ਹੋਣ ਕਰਕੇ) ਤੇਰਾ ਇੱਕ ਭੀ ਪੈਰ ਨਹੀਂ। ਹਜ਼ਾਰਾਂ ਤੇਰੇ ਨੱਕ ਹਨ, ਪਰ ਤੂੰ ਨੱਕ ਤੋਂ ਬਿਨਾ ਹੀ ਹੈਂ। ਤੇਰੇ ਅਜੇਹੇ ਕੌਤਕਾਂ ਨੇ ਮੈਨੂੰ ਹੈਰਾਨ ਕੀਤਾ ਹੋਇਆ ਹੈ ॥੨॥ ਸਾਰੇ ਜੀਵਾਂ ਵਿਚ ਇਕੋ ਉਹੀ ਪਰਮਾਤਮਾ ਦੀ ਜੋਤੀ ਵਰਤ ਰਹੀ ਹੈ। ਉਸ ਜੋਤਿ ਦੇ ਪਰਕਾਸ਼ ਨਾਲ ਸਾਰੇ ਜੀਵਾਂ ਵਿਚ ਚਾਨਣ (ਸੂਝ-ਬੂਝ) ਹੈ। ਪਰ ਇਸ ਜੋਤਿ ਦਾ ਗਿਆਨ ਗੁਰੂ ਦੀ ਸਿੱਖਿਆ ਨਾਲ ਹੀ ਹੁੰਦਾ ਹੈ। (ਗੁਰੂ ਰਾਹੀਂ ਇਹ ਸਮਝ ਪੈਂਦੀ ਹੈ ਕਿ ਹਰੇਕ ਦੇ ਅੰਦਰ ਪਰਮਾਤਮਾ ਦੀ ਜੋਤਿ ਹੈ)। (ਇਸ ਸਰਬ-ਵਿਆਪਕ ਜੋਤਿ ਦੀ) ਆਰਤੀ ਇਹ ਹੈ ਕਿ ਜੋ ਕੁਝ ਉਸ ਦੀ ਰਜ਼ਾ ਵਿਚ ਹੋ ਰਿਹਾ ਹੈ, ਉਹ ਜੀਵ ਨੂੰ ਚੰਗਾ ਲੱਗੇ (ਪ੍ਰਭੂ ਦੀ ਰਜ਼ਾ ਵਿਚ ਤੁਰਨਾ ਪ੍ਰਭੂ ਦੀ ਆਰਤੀ ਕਰਨੀ ਹੈ) ॥੩॥ ਹੇ ਹਰੀ! ਤੇਰੇ ਚਰਨ-ਰੂਪ ਕੌਲ-ਫੁੱਲਾਂ ਦੇ ਰਸ ਲਈ ਮੇਰਾ ਮਨ ਲਲਚਾਂਦਾ ਹੈ, ਹਰ ਰੋਜ਼ ਮੈਨੂੰ ਇਸੇ ਰਸ ਦੀ ਪਿਆਸ ਲੱਗੀ ਹੋਈ ਹੈ। ਮੈਨੂੰ ਨਾਨਕ ਪਪੀਹੇ ਨੂੰ ਆਪਣੀ ਮਿਹਰ ਦਾ ਜਲ ਦੇਹ, ਜਿਸ (ਦੀ ਬਰਕਤਿ) ਨਾਲ ਮੈਂ ਤੇਰੇ ਨਾਮ ਵਿਚ ਟਿਕਿਆ ਰਹਾਂ ॥੪॥੩॥`
      },
      {
        number: 4,
        sanskrit: `ਰਾਗੁ ਗਉੜੀ ਪੂਰਬੀ ਮਹਲਾ ੪ ॥
ਕਾਮਿ ਕਰੋਧਿ ਨਗਰੁ ਬਹੁ ਭਰਿਆ ਮਿਲਿ ਸਾਧੂ ਖੰਡਲ ਖੰਡਾ ਹੇ ॥
ਪੂਰਬਿ ਲਿਖਤ ਲਿਖੇ ਗੁਰੁ ਪਾਇਆ ਮਨਿ ਹਰਿ ਲਿਵ ਮੰਡਲ ਮੰਡਾ ਹੇ ॥੧॥
ਕਰਿ ਸਾਧੂ ਅੰਜੁਲੀ ਪੁਨੁ ਵਡਾ ਹੇ ॥
ਕਰਿ ਡੰਡਉਤ ਪੁਨੁ ਵਡਾ ਹੇ ॥੧॥ ਰਹਾਉ ॥
ਸਾਕਤ ਹਰਿ ਰਸ ਸਾਦੁ ਨ ਜਾਣਿਆ ਤਿਨ ਅੰਤਰਿ ਹਉਮੈ ਕੰਡਾ ਹੇ ॥
ਜਿਉ ਜਿਉ ਚਲਹਿ ਚੁਭੈ ਦੁਖੁ ਪਾਵਹਿ ਜਮਕਾਲੁ ਸਹਹਿ ਸਿਰਿ ਡੰਡਾ ਹੇ ॥੨॥
ਹਰਿ ਜਨ ਹਰਿ ਹਰਿ ਨਾਮਿ ਸਮਾਣੇ ਦੁਖੁ ਜਨਮ ਮਰਣ ਭਵ ਖੰਡਾ ਹੇ ॥
ਅਬਿਨਾਸੀ ਪੁਰਖੁ ਪਾਇਆ ਪਰਮੇਸਰੁ ਬਹੁ ਸੋਭ ਖੰਡ ਬ੍ਰਹਮੰਡਾ ਹੇ ॥੩॥
ਹਮ ਗਰੀਬ ਮਸਕੀਨ ਪ੍ਰਭ ਤੇਰੇ ਹਰਿ ਰਾਖੁ ਰਾਖੁ ਵਡ ਵਡਾ ਹੇ ॥
ਜਨ ਨਾਨਕ ਨਾਮੁ ਅਧਾਰੁ ਟੇਕ ਹੈ ਹਰਿ ਨਾਮੇ ਹੀ ਸੁਖੁ ਮੰਡਾ ਹੇ ॥੪॥੪॥`,
        transliteration: `raag gaurree poorabee mahalaa 4 |
kaam karodh nagar bahu bhariaa mil saadhoo khanddal khanddaa he |
poorab likhat likhe gur paaeaa man har liv manddal manddaa he |1|
kar saadhoo anjulee pun vaddaa he |
kar ddanddaut pun vaddaa he |1| rahaau |
saakat har ras saad na jaaniaa tin antar haumai kanddaa he |
jiau jiau chaleh chubhai dukh paaveh jamakaal saheh sir ddanddaa he |2|
har jan har har naam samaane dukh janam maran bhav khanddaa he |
abinaasee purakh paaeaa paramesar bahu sobh khandd brahamanddaa he |3|
ham gareeb masakeen prabh tere har raakh raakh vadd vaddaa he |
jan naanak naam adhaar ttek hai har naame hee sukh manddaa he |4|4|`,
        meaning: `Raag Gauree Poorbee, Fourth Mehl: The body-village is filled to overflowing with anger and sexual desire; these were broken into bits when I met with the Holy Saint. By pre-ordained destiny, I have met with the Guru. I have entered into the realm of the Lord's Love. ||1|| Greet the Holy Saint with your palms pressed together; this is an act of great merit. Bow down before Him; this is a virtuous action indeed. ||1||Pause|| The wicked shaaktas, the faithless cynics, do not know the Taste of the Lord's Sublime Essence. The thorn of egotism is embedded deep within them. The more they walk away, the deeper it pierces them, and the more they suffer in pain, until finally, the Messenger of Death smashes his club against their heads. ||2|| The humble servants of the Lord are absorbed in the Name of the Lord, Har, Har. The pain of birth and the fear of death are eradicated. They have found the Imperishable Supreme Being, the Transcendent Lord God, and they receive great honor throughout all the worlds and realms. ||3|| I am poor and meek, God, but I belong to You! Save me-please save me, O Greatest of the Great! Servant Nanak takes the Sustenance and Support of the Naam. In the Name of the Lord, he enjoys celestial peace. ||4||4||`,
        meaning_pa: `(ਮਨੁੱਖ ਦਾ ਇਹ ਸਰੀਰ-) ਸ਼ਹਰ ਕਾਮ ਅਤੇ ਕ੍ਰੋਧ ਨਾਲ ਭਰਿਆ ਰਹਿੰਦਾ ਹੈ। ਗੁਰੂ ਨੂੰ ਮਿਲ ਕੇ ਹੀ (ਕਾਮ ਕ੍ਰੋਧ ਆਦਿਕ ਦੇ ਇਸ ਜੋੜ ਨੂੰ) ਤੋੜਿਆ ਜਾ ਸਕਦਾ ਹੈ। ਜਿਸ ਮਨੁੱਖ ਨੂੰ ਪੂਰਬਲੇ ਕੀਤੇ ਕਰਮਾਂ ਦੇ ਸੰਜੋਗਾਂ ਨਾਲ ਗੁਰੂ ਮਿਲ ਪੈਂਦਾ ਹੈ, ਉਸ ਦੇ ਮਨ ਵਿਚ ਪਰਮਾਤਮਾ ਨਾਲ ਲਿਵ ਲੱਗ ਜਾਂਦੀ ਹੈ (ਅਤੇ ਉਸ ਦੇ ਅੰਦਰੋਂ ਕਾਮਾਦਿਕਾਂ ਦਾ ਜੋੜ ਟੁੱਟ ਜਾਂਦਾ ਹੈ) ॥੧॥ (ਹੇ ਭਾਈ!) ਗੁਰੂ ਅੱਗੇ ਹੱਥ ਜੋੜ, ਇਹ ਬਹੁਤ ਭਲਾ ਕੰਮ ਹੈ। ਗੁਰੂ ਅੱਗੇ ਢਹਿ ਪਉ, ਇਹ ਬੜਾ ਨੇਕ ਕੰਮ ਹੈ ॥੧॥ ਰਹਾਉ ॥ ਜੇਹੜੇ ਮਨੁੱਖ ਪਰਮਾਤਮਾ ਨਾਲੋਂ ਟੁੱਟੇ ਹੋਏ ਹਨ, ਉਹ ਉਸ ਦੇ ਨਾਮ ਦੇ ਰਸ ਦੇ ਸੁਆਦ ਨੂੰ ਸਮਝ ਨਹੀਂ ਸਕਦੇ। ਉਹਨਾਂ ਦੇ ਮਨ ਵਿਚ ਅਹੰਕਾਰ ਦਾ (ਮਾਨੋ) ਕੰਡਾ ਚੁੱਭਾ ਹੋਇਆ ਹੈ। ਜਿਉਂ ਜਿਉਂ ਉਹ ਤੁਰਦੇ ਹਨ (ਜਿਉਂ ਜਿਉਂ ਉਹ ਹਉਮੈ ਦੇ ਸੁਭਾਵ ਵਾਲੀ ਵਰਤੋਂ ਵਰਤਦੇ ਹਨ, ਹਉਮੈ ਦਾ ਉਹ ਕੰਡਾ ਉਹਨਾਂ ਨੂੰ) ਚੁੱਭਦਾ ਹੈ, ਉਹ ਦੁੱਖ ਪਾਂਦੇ ਹਨ, ਅਤੇ ਆਪਣੇ ਸਿਰ ਉੱਤੇ ਆਤਮਕ ਮੌਤ-ਰੂਪ ਡੰਡਾ ਸਹਾਰਦੇ ਹਨ (ਆਤਮਕ ਮੌਤ ਉਹਨਾਂ ਦੇ ਸਿਰ ਉਤੇ ਸਵਾਰ ਰਹਿੰਦੀ ਹੈ) ॥੨॥ (ਦੂਜੇ ਪਾਸੇ) ਪਰਮਾਤਮਾ ਦੇ ਪਿਆਰੇ ਬੰਦੇ ਪਰਮਾਤਮਾ ਦੇ ਨਾਮ ਵਿਚ ਜੁੜੇ ਰਹਿੰਦੇ ਹਨ। ਉਹਨਾਂ ਦਾ ਸੰਸਾਰ ਦਾ ਜੰਮਣ ਮਰਨ ਦਾ ਦੁੱਖ ਕੱਟਿਆ ਜਾਂਦਾ ਹੈ। ਉਹਨਾਂ ਨੂੰ ਕਦੇ ਨਾਸ਼ ਨਾਹ ਹੋਣ ਵਾਲਾ ਸਰਬ-ਵਿਆਪਕ ਪਰਮੇਸਰ ਮਿਲ ਪੈਂਦਾ ਹੈ। ਉਹਨਾਂ ਦੀ ਸੋਭਾ ਸਾਰੇ ਖੰਡਾਂ ਬ੍ਰਹਮੰਡਾਂ ਵਿਚ ਹੋ ਜਾਂਦੀ ਹੈ ॥੩॥ ਹੇ ਪ੍ਰਭੂ! ਅਸੀਂ ਜੀਵ ਤੇਰੇ ਦਰ ਦੇ ਗਰੀਬ ਮੰਗਦੇ ਹਾਂ। ਤੂੰ ਸਭ ਤੋਂ ਵੱਡਾ ਸਹਾਈ ਹੈਂ। ਸਾਨੂੰ (ਇਹਨਾਂ ਕਾਮਾਦਿਕਾਂ ਤੋਂ) ਬਚਾ ਲੈ। ਹੇ ਪ੍ਰਭੂ! ਤੇਰੇ ਦਾਸ ਨਾਨਕ ਨੂੰ ਤੇਰਾ ਨਾਮ ਹੀ ਆਸਰਾ ਹੈ, ਤੇਰਾ ਨਾਮ ਹੀ ਸਹਾਰਾ ਹੈ। ਤੇਰੇ ਨਾਮ ਵਿਚ ਜੁੜਿਆਂ ਹੀ ਸੁਖ ਮਿਲਦਾ ਹੈ ॥੪॥੪॥`
      },
      {
        number: 5,
        sanskrit: `ਰਾਗੁ ਗਉੜੀ ਪੂਰਬੀ ਮਹਲਾ ੫ ॥
ਕਰਉ ਬੇਨੰਤੀ ਸੁਣਹੁ ਮੇਰੇ ਮੀਤਾ ਸੰਤ ਟਹਲ ਕੀ ਬੇਲਾ ॥
ਈਹਾ ਖਾਟਿ ਚਲਹੁ ਹਰਿ ਲਾਹਾ ਆਗੈ ਬਸਨੁ ਸੁਹੇਲਾ ॥੧॥
ਅਉਧ ਘਟੈ ਦਿਨਸੁ ਰੈਣਾਰੇ ॥
ਮਨ ਗੁਰ ਮਿਲਿ ਕਾਜ ਸਵਾਰੇ ॥੧॥ ਰਹਾਉ ॥
ਇਹੁ ਸੰਸਾਰੁ ਬਿਕਾਰੁ ਸੰਸੇ ਮਹਿ ਤਰਿਓ ਬ੍ਰਹਮ ਗਿਆਨੀ ॥
ਜਿਸਹਿ ਜਗਾਇ ਪੀਆਵੈ ਇਹੁ ਰਸੁ ਅਕਥ ਕਥਾ ਤਿਨਿ ਜਾਨੀ ॥੨॥
ਜਾ ਕਉ ਆਏ ਸੋਈ ਬਿਹਾਝਹੁ ਹਰਿ ਗੁਰ ਤੇ ਮਨਹਿ ਬਸੇਰਾ ॥
ਨਿਜ ਘਰਿ ਮਹਲੁ ਪਾਵਹੁ ਸੁਖ ਸਹਜੇ ਬਹੁਰਿ ਨ ਹੋਇਗੋ ਫੇਰਾ ॥੩॥
ਅੰਤਰਜਾਮੀ ਪੁਰਖ ਬਿਧਾਤੇ ਸਰਧਾ ਮਨ ਕੀ ਪੂਰੇ ॥
ਨਾਨਕ ਦਾਸੁ ਇਹੈ ਸੁਖੁ ਮਾਗੈ ਮੋ ਕਉ ਕਰਿ ਸੰਤਨ ਕੀ ਧੂਰੇ ॥੪॥੫॥`,
        transliteration: `raag gaurree poorabee mahalaa 5 |
krau benantee sunahu mere meetaa sant ttehal kee belaa |
eehaa khaatt chalahu har laahaa aagai basan suhelaa |1|
aaudh ghattai dinas rainaare |
man gur mil kaaj savaare |1| rahaau |
eihu sansaar bikaar sanse meh tario braham giaanee |
jiseh jagaae peeaavai ihu ras akath kathaa tin jaanee |2|
jaa kau aae soee bihaajhahu har gur te maneh baseraa |
nij ghar mehal paavahu sukh sahaje bahur na hoeigo feraa |3|
antarajaamee purakh bidhaate saradhaa man kee poore |
naanak daas ihai sukh maagai mo kau kar santan kee dhoore |4|5|`,
        meaning: `Raag Gauree Poorbee, Fifth Mehl: Listen, my friends, I beg of you: now is the time to serve the Saints! In this world, earn the profit of the Lord's Name, and hereafter, you shall dwell in peace. ||1|| This life is diminishing, day and night. Meeting with the Guru, your affairs shall be resolved. ||1||Pause|| This world is engrossed in corruption and cynicism. Only those who know God are saved. Only those who are awakened by the Lord to drink in this Sublime Essence, come to know the Unspoken Speech of the Lord. ||2|| Purchase only that for which you have come into the world, and through the Guru, the Lord shall dwell within your mind. Within the home of your own inner being, you shall obtain the Mansion of the Lord's Presence with intuitive ease. You shall not be consigned again to the wheel of reincarnation. ||3|| O Inner-knower, Searcher of Hearts, O Primal Being, Architect of Destiny: please fulfill this yearning of my mind. Nanak, Your slave, begs for this happiness: let me be the dust of the feet of the Saints. ||4||5||`,
        meaning_pa: `ਹੇ ਮੇਰੇ ਮਿੱਤਰੋ! ਸੁਣੋ! ਮੈਂ ਬੇਨਤੀ ਕਰਦਾ ਹਾਂ-(ਹੁਣ) ਗੁਰਮੁਖਾਂ ਦੀ ਸੇਵਾ ਕਰਨ ਦਾ ਵੇਲਾ ਹੈ। (ਜੇ ਸੇਵਾ ਕਰੋਗੇ, ਤਾਂ) ਇਸ ਜਨਮ ਵਿਚ ਪ੍ਰਭੂ ਦੇ ਨਾਮ ਦੀ ਖੱਟੀ ਖੱਟ ਕੇ ਜਾਵੋਗੇ, ਅਤੇ ਪਰਲੋਕ ਵਿਚ ਰਹਿਣਾ ਸੌਖਾ ਹੋ ਜਾਇਗਾ ॥੧॥ ਹੇ ਮਨ! ਦਿਨ ਰਾਤ (ਬੀਤ ਬੀਤ ਕੇ) ਉਮਰ ਘਟਦੀ ਜਾ ਰਹੀ ਹੈ। ਹੇ (ਮੇਰੇ) ਮਨ! ਗੁਰੂ ਨੂੰ ਮਿਲ ਕੇ (ਮਨੁੱਖਾ ਜੀਵਨ ਦਾ) ਕੰਮ ਸਿਰੇ ਚਾੜ੍ਹ ॥੧॥ ਰਹਾਉ ॥ ਇਹ ਜਗਤ ਵਿਕਾਰਾਂ ਨਾਲ ਭਰਪੂਰ ਹੈ। (ਜਗਤ ਦੇ ਜੀਵ) ਤੌਖ਼ਲਿਆਂ ਵਿਚ (ਡੁੱਬ ਰਹੇ ਹਨ। ਇਹਨਾਂ ਵਿਚੋਂ) ਉਹੀ ਮਨੁੱਖ ਨਿਕਲਦਾ ਹੈ ਜਿਸ ਨੇ ਪਰਮਾਤਮਾ ਨਾਲ ਜਾਣ-ਪਛਾਣ ਪਾ ਲਈ ਹੈ। (ਵਿਕਾਰਾਂ ਵਿਚ ਸੁੱਤੇ ਹੋਏ) ਜਿਸ ਮਨੁੱਖ ਨੂੰ ਪ੍ਰਭੂ ਆਪ ਜਗਾ ਕੇ ਇਹ ਨਾਮ-ਅੰਮ੍ਰਿਤ ਪਿਲਾਂਦਾ ਹੈ, ਉਸ ਮਨੁੱਖ ਨੇ ਅਕੱਥ ਪ੍ਰਭੂ ਦੀਆਂ ਗੱਲਾਂ (ਬੇਅੰਤ ਗੁਣਾਂ ਵਾਲੇ ਪ੍ਰਭੂ ਦੀ ਸਿਫ਼ਤ-ਸਾਲਾਹ) ਕਰਨ ਦੀ ਜਾਚ ਸਿੱਖ ਲਈ ਹੈ ॥੨॥ (ਹੇ ਭਾਈ!) ਜਿਸ ਕੰਮ ਵਾਸਤੇ (ਇੱਥੇ) ਆਏ ਹੋ, ਉਸ ਦਾ ਵਣਜ ਕਰੋ। ਉਹ ਹਰਿ-ਨਾਮ ਗੁਰੂ ਦੀ ਰਾਹੀਂ (ਹੀ) ਮਨ ਵਿਚ ਵੱਸ ਸਕਦਾ ਹੈ। (ਜੇ ਗੁਰੂ ਦੀ ਸਰਨ ਪਵੋਗੇ, ਤਾਂ) ਆਤਮਕ ਆਨੰਦ ਅਤੇ ਅਡੋਲਤਾ ਵਿਚ ਟਿਕ ਕੇ ਆਪਣੇ ਅੰਦਰ ਹੀ ਪਰਮਾਤਮਾ ਦਾ ਟਿਕਾਣਾ ਲੱਭ ਲਵੋਗੇ। ਫਿਰ ਮੁੜ ਜਨਮ ਮਰਨ ਦਾ ਗੇੜ ਨਹੀਂ ਹੋਵੇਗਾ ॥੩॥ ਹੇ ਹਰੇਕ ਦੇ ਦਿਲ ਦੀ ਜਾਣਨ ਵਾਲੇ ਸਰਬ-ਵਿਆਪਕ ਸਿਰਜਨਹਾਰ! ਮੇਰੇ ਮਨ ਦੀ ਇੱਛਾ ਪੂਰੀ ਕਰ। ਦਾਸ ਨਾਨਕ ਤੈਥੋਂ ਇਹੀ ਸੁਖ ਮੰਗਦਾ ਹੈ ਕਿ ਮੈਨੂੰ ਸੰਤਾਂ ਦੇ ਚਰਨਾਂ ਦੀ ਧੂੜ ਬਣਾ ਦੇਹ ॥੪॥੫॥`
      }
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
      {
        number: 1,
        sanskrit: `ਗਉੜੀ ਸੁਖਮਨੀ ਮਃ ੫ ॥
ਸਲੋਕੁ ॥
ੴ ਸਤਿਗੁਰ ਪ੍ਰਸਾਦਿ ॥
ਆਦਿ ਗੁਰਏ ਨਮਹ ॥
ਜੁਗਾਦਿ ਗੁਰਏ ਨਮਹ ॥
ਸਤਿਗੁਰਏ ਨਮਹ ॥
ਸ੍ਰੀ ਗੁਰਦੇਵਏ ਨਮਹ ॥੧॥
ਅਸਟਪਦੀ ॥
ਸਿਮਰਉ ਸਿਮਰਿ ਸਿਮਰਿ ਸੁਖੁ ਪਾਵਉ ॥
ਕਲਿ ਕਲੇਸ ਤਨ ਮਾਹਿ ਮਿਟਾਵਉ ॥
ਸਿਮਰਉ ਜਾਸੁ ਬਿਸੁੰਭਰ ਏਕੈ ॥
ਨਾਮੁ ਜਪਤ ਅਗਨਤ ਅਨੇਕੈ ॥
ਬੇਦ ਪੁਰਾਨ ਸਿੰਮ੍ਰਿਤਿ ਸੁਧਾਖੵਰ ॥
ਕੀਨੇ ਰਾਮ ਨਾਮ ਇਕ ਆਖੵਰ ॥
ਕਿਨਕਾ ਏਕ ਜਿਸੁ ਜੀਅ ਬਸਾਵੈ ॥
ਤਾ ਕੀ ਮਹਿਮਾ ਗਨੀ ਨ ਆਵੈ ॥
ਕਾਂਖੀ ਏਕੈ ਦਰਸ ਤੁਹਾਰੋ ॥
ਨਾਨਕ ਉਨ ਸੰਗਿ ਮੋਹਿ ਉਧਾਰੋ ॥੧॥
ਸੁਖਮਨੀ ਸੁਖ ਅੰਮ੍ਰਿਤ ਪ੍ਰਭ ਨਾਮੁ ॥
ਭਗਤ ਜਨਾ ਕੈ ਮਨਿ ਬਿਸ੍ਰਾਮ ॥ ਰਹਾਉ ॥
ਪ੍ਰਭ ਕੈ ਸਿਮਰਨਿ ਗਰਭਿ ਨ ਬਸੈ ॥
ਪ੍ਰਭ ਕੈ ਸਿਮਰਨਿ ਦੂਖੁ ਜਮੁ ਨਸੈ ॥
ਪ੍ਰਭ ਕੈ ਸਿਮਰਨਿ ਕਾਲੁ ਪਰਹਰੈ ॥
ਪ੍ਰਭ ਕੈ ਸਿਮਰਨਿ ਦੁਸਮਨੁ ਟਰੈ ॥
ਪ੍ਰਭ ਸਿਮਰਤ ਕਛੁ ਬਿਘਨੁ ਨ ਲਾਗੈ ॥
ਪ੍ਰਭ ਕੈ ਸਿਮਰਨਿ ਅਨਦਿਨੁ ਜਾਗੈ ॥
ਪ੍ਰਭ ਕੈ ਸਿਮਰਨਿ ਭਉ ਨ ਬਿਆਪੈ ॥
ਪ੍ਰਭ ਕੈ ਸਿਮਰਨਿ ਦੁਖੁ ਨ ਸੰਤਾਪੈ ॥
ਪ੍ਰਭ ਕਾ ਸਿਮਰਨੁ ਸਾਧ ਕੈ ਸੰਗਿ ॥
ਸਰਬ ਨਿਧਾਨ ਨਾਨਕ ਹਰਿ ਰੰਗਿ ॥੨॥
ਪ੍ਰਭ ਕੈ ਸਿਮਰਨਿ ਰਿਧਿ ਸਿਧਿ ਨਉ ਨਿਧਿ ॥
ਪ੍ਰਭ ਕੈ ਸਿਮਰਨਿ ਗਿਆਨੁ ਧਿਆਨੁ ਤਤੁ ਬੁਧਿ ॥
ਪ੍ਰਭ ਕੈ ਸਿਮਰਨਿ ਜਪ ਤਪ ਪੂਜਾ ॥
ਪ੍ਰਭ ਕੈ ਸਿਮਰਨਿ ਬਿਨਸੈ ਦੂਜਾ ॥
ਪ੍ਰਭ ਕੈ ਸਿਮਰਨਿ ਤੀਰਥ ਇਸਨਾਨੀ ॥
ਪ੍ਰਭ ਕੈ ਸਿਮਰਨਿ ਦਰਗਹ ਮਾਨੀ ॥
ਪ੍ਰਭ ਕੈ ਸਿਮਰਨਿ ਹੋਇ ਸੁ ਭਲਾ ॥
ਪ੍ਰਭ ਕੈ ਸਿਮਰਨਿ ਸੁਫਲ ਫਲਾ ॥
ਸੇ ਸਿਮਰਹਿ ਜਿਨ ਆਪਿ ਸਿਮਰਾਏ ॥
ਨਾਨਕ ਤਾ ਕੈ ਲਾਗਉ ਪਾਏ ॥੩॥
ਪ੍ਰਭ ਕਾ ਸਿਮਰਨੁ ਸਭ ਤੇ ਊਚਾ ॥
ਪ੍ਰਭ ਕੈ ਸਿਮਰਨਿ ਉਧਰੇ ਮੂਚਾ ॥
ਪ੍ਰਭ ਕੈ ਸਿਮਰਨਿ ਤ੍ਰਿਸਨਾ ਬੁਝੈ ॥
ਪ੍ਰਭ ਕੈ ਸਿਮਰਨਿ ਸਭੁ ਕਿਛੁ ਸੁਝੈ ॥
ਪ੍ਰਭ ਕੈ ਸਿਮਰਨਿ ਨਾਹੀ ਜਮ ਤ੍ਰਾਸਾ ॥
ਪ੍ਰਭ ਕੈ ਸਿਮਰਨਿ ਪੂਰਨ ਆਸਾ ॥
ਪ੍ਰਭ ਕੈ ਸਿਮਰਨਿ ਮਨ ਕੀ ਮਲੁ ਜਾਇ ॥
ਅੰਮ੍ਰਿਤ ਨਾਮੁ ਰਿਦ ਮਾਹਿ ਸਮਾਇ ॥
ਪ੍ਰਭ ਜੀ ਬਸਹਿ ਸਾਧ ਕੀ ਰਸਨਾ ॥
ਨਾਨਕ ਜਨ ਕਾ ਦਾਸਨਿ ਦਸਨਾ ॥੪॥
ਪ੍ਰਭ ਕਉ ਸਿਮਰਹਿ ਸੇ ਧਨਵੰਤੇ ॥
ਪ੍ਰਭ ਕਉ ਸਿਮਰਹਿ ਸੇ ਪਤਿਵੰਤੇ ॥
ਪ੍ਰਭ ਕਉ ਸਿਮਰਹਿ ਸੇ ਜਨ ਪਰਵਾਨ ॥
ਪ੍ਰਭ ਕਉ ਸਿਮਰਹਿ ਸੇ ਪੁਰਖ ਪ੍ਰਧਾਨ ॥
ਪ੍ਰਭ ਕਉ ਸਿਮਰਹਿ ਸਿ ਬੇਮੁਹਤਾਜੇ ॥
ਪ੍ਰਭ ਕਉ ਸਿਮਰਹਿ ਸਿ ਸਰਬ ਕੇ ਰਾਜੇ ॥
ਪ੍ਰਭ ਕਉ ਸਿਮਰਹਿ ਸੇ ਸੁਖਵਾਸੀ ॥
ਪ੍ਰਭ ਕਉ ਸਿਮਰਹਿ ਸਦਾ ਅਬਿਨਾਸੀ ॥
ਸਿਮਰਨ ਤੇ ਲਾਗੇ ਜਿਨ ਆਪਿ ਦਇਆਲਾ ॥
ਨਾਨਕ ਜਨ ਕੀ ਮੰਗੈ ਰਵਾਲਾ ॥੫॥
ਪ੍ਰਭ ਕਉ ਸਿਮਰਹਿ ਸੇ ਪਰਉਪਕਾਰੀ ॥
ਪ੍ਰਭ ਕਉ ਸਿਮਰਹਿ ਤਿਨ ਸਦ ਬਲਿਹਾਰੀ ॥
ਪ੍ਰਭ ਕਉ ਸਿਮਰਹਿ ਸੇ ਮੁਖ ਸੁਹਾਵੇ ॥
ਪ੍ਰਭ ਕਉ ਸਿਮਰਹਿ ਤਿਨ ਸੂਖਿ ਬਿਹਾਵੈ ॥
ਪ੍ਰਭ ਕਉ ਸਿਮਰਹਿ ਤਿਨ ਆਤਮੁ ਜੀਤਾ ॥
ਪ੍ਰਭ ਕਉ ਸਿਮਰਹਿ ਤਿਨ ਨਿਰਮਲ ਰੀਤਾ ॥
ਪ੍ਰਭ ਕਉ ਸਿਮਰਹਿ ਤਿਨ ਅਨਦ ਘਨੇਰੇ ॥
ਪ੍ਰਭ ਕਉ ਸਿਮਰਹਿ ਬਸਹਿ ਹਰਿ ਨੇਰੇ ॥
ਸੰਤ ਕ੍ਰਿਪਾ ਤੇ ਅਨਦਿਨੁ ਜਾਗਿ ॥
ਨਾਨਕ ਸਿਮਰਨੁ ਪੂਰੈ ਭਾਗਿ ॥੬॥
ਪ੍ਰਭ ਕੈ ਸਿਮਰਨਿ ਕਾਰਜ ਪੂਰੇ ॥
ਪ੍ਰਭ ਕੈ ਸਿਮਰਨਿ ਕਬਹੁ ਨ ਝੂਰੇ ॥
ਪ੍ਰਭ ਕੈ ਸਿਮਰਨਿ ਹਰਿ ਗੁਨ ਬਾਨੀ ॥
ਪ੍ਰਭ ਕੈ ਸਿਮਰਨਿ ਸਹਜਿ ਸਮਾਨੀ ॥
ਪ੍ਰਭ ਕੈ ਸਿਮਰਨਿ ਨਿਹਚਲ ਆਸਨੁ ॥
ਪ੍ਰਭ ਕੈ ਸਿਮਰਨਿ ਕਮਲ ਬਿਗਾਸਨੁ ॥
ਪ੍ਰਭ ਕੈ ਸਿਮਰਨਿ ਅਨਹਦ ਝੁਨਕਾਰ ॥
ਸੁਖੁ ਪ੍ਰਭ ਸਿਮਰਨ ਕਾ ਅੰਤੁ ਨ ਪਾਰ ॥
ਸਿਮਰਹਿ ਸੇ ਜਨ ਜਿਨ ਕਉ ਪ੍ਰਭ ਮਇਆ ॥
ਨਾਨਕ ਤਿਨ ਜਨ ਸਰਨੀ ਪਇਆ ॥੭॥
ਹਰਿ ਸਿਮਰਨੁ ਕਰਿ ਭਗਤ ਪ੍ਰਗਟਾਏ ॥
ਹਰਿ ਸਿਮਰਨਿ ਲਗਿ ਬੇਦ ਉਪਾਏ ॥
ਹਰਿ ਸਿਮਰਨਿ ਭਏ ਸਿਧ ਜਤੀ ਦਾਤੇ ॥
ਹਰਿ ਸਿਮਰਨਿ ਨੀਚ ਚਹੁ ਕੁੰਟ ਜਾਤੇ ॥
ਹਰਿ ਸਿਮਰਨਿ ਧਾਰੀ ਸਭ ਧਰਨਾ ॥
ਸਿਮਰਿ ਸਿਮਰਿ ਹਰਿ ਕਾਰਨ ਕਰਨਾ ॥
ਹਰਿ ਸਿਮਰਨਿ ਕੀਓ ਸਗਲ ਅਕਾਰਾ ॥
ਹਰਿ ਸਿਮਰਨ ਮਹਿ ਆਪਿ ਨਿਰੰਕਾਰਾ ॥
ਕਰਿ ਕਿਰਪਾ ਜਿਸੁ ਆਪਿ ਬੁਝਾਇਆ ॥
ਨਾਨਕ ਗੁਰਮੁਖਿ ਹਰਿ ਸਿਮਰਨੁ ਤਿਨਿ ਪਾਇਆ ॥੮॥੧॥
ਸਲੋਕੁ ॥
ਦੀਨ ਦਰਦ ਦੁਖ ਭੰਜਨਾ ਘਟਿ ਘਟਿ ਨਾਥ ਅਨਾਥ ॥
ਸਰਣਿ ਤੁਮੑਾਰੀ ਆਇਓ ਨਾਨਕ ਕੇ ਪ੍ਰਭ ਸਾਥ ॥੧॥`,
        transliteration: `gaurree sukhamanee mahalaa 5 |
salok |
ik oankaar satigur prasaad |
aad gure namah |
jugaad gure namah |
satigure namah |
sree guradeve namah |1|
asattapadee |
simrau simar simar sukh paavau |
kal kales tan maeh mittaavau |
simrau jaas bisunbhar ekai |
naam japat aganat anekai |
bed puraan sinmrit sudhaakhayar |
keene raam naam ik aakhayar |
kinakaa ek jis jeea basaavai |
taa kee mahimaa ganee na aavai |
kaankhee ekai daras tuhaaro |
naanak un sang mohi udhaaro |1|
sukhamanee sukh amrit prabh naam |
bhagat janaa kai man bisraam | rahaau |
prabh kai simaran garabh na basai |
prabh kai simaran dookh jam nasai |
prabh kai simaran kaal paraharai |
prabh kai simaran dusaman ttarai |
prabh simarat kachh bighan na laagai |
prabh kai simaran anadin jaagai |
prabh kai simaran bhau na biaapai |
prabh kai simaran dukh na santaapai |
prabh kaa simaran saadh kai sang |
sarab nidhaan naanak har rang |2|
prabh kai simaran ridh sidh nau nidh |
prabh kai simaran giaan dhiaan tat budh |
prabh kai simaran jap tap poojaa |
prabh kai simaran binasai doojaa |
prabh kai simaran teerath isanaanee |
prabh kai simaran daragah maanee |
prabh kai simaran hoe su bhalaa |
prabh kai simaran sufal falaa |
se simareh jin aap simaraae |
naanak taa kai laagau paae |3|
prabh kaa simaran sabh te aoochaa |
prabh kai simaran udhare moochaa |
prabh kai simaran trisanaa bujhai |
prabh kai simaran sabh kichh sujhai |
prabh kai simaran naahee jam traasaa |
prabh kai simaran pooran aasaa |
prabh kai simaran man kee mal jaae |
amrit naam rid maeh samaae |
prabh jee baseh saadh kee rasanaa |
naanak jan kaa daasan dasanaa |4|
prabh kau simareh se dhanavante |
prabh kau simareh se pativante |
prabh kau simareh se jan paravaan |
prabh kau simareh se purakh pradhaan |
prabh kau simareh si bemuhataaje |
prabh kau simareh si sarab ke raaje |
prabh kau simareh se sukhavaasee |
prabh kau simareh sadaa abinaasee |
simaran te laage jin aap deaalaa |
naanak jan kee mangai ravaalaa |5|
prabh kau simareh se praupakaaree |
prabh kau simareh tin sad balihaaree |
prabh kau simareh se mukh suhaave |
prabh kau simareh tin sookh bihaavai |
prabh kau simareh tin aatam jeetaa |
prabh kau simareh tin niramal reetaa |
prabh kau simareh tin anad ghanere |
prabh kau simareh baseh har nere |
sant kripaa te anadin jaag |
naanak simaran poorai bhaag |6|
prabh kai simaran kaaraj poore |
prabh kai simaran kabahu na jhoore |
prabh kai simaran har gun baanee |
prabh kai simaran sehaj samaanee |
prabh kai simaran nihachal aasan |
prabh kai simaran kamal bigaasan |
prabh kai simaran anahad jhunakaar |
sukh prabh simaran kaa ant na paar |
simareh se jan jin kau prabh meaa |
naanak tin jan saranee peaa |7|
har simaran kar bhagat pragattaae |
har simaran lag bed upaae |
har simaran bhe sidh jatee daate |
har simaran neech chahu kuntt jaate |
har simaran dhaaree sabh dharanaa |
simar simar har kaaran karanaa |
har simaran keeo sagal akaaraa |
har simaran meh aap nirankaaraa |
kar kirapaa jis aap bujhaaeaa |
naanak guramukh har simaran tin paaeaa |8|1|
salok |
deen darad dukh bhanjanaa ghatt ghatt naath anaath |
saran tumaaree aaeo naanak ke prabh saath |1|`,
        meaning: `Gauree Sukhmani, Fifth Mehl, Salok: One Universal Creator God. By The Grace Of The True Guru: I bow to the Primal Guru. I bow to the Guru of the ages. I bow to the True Guru. I bow to the Great, Divine Guru. ||1|| Ashtapadee: Meditate, meditate, meditate in remembrance of Him, and find peace. Worry and anguish shall be dispelled from your body. Remember in praise the One who pervades the whole Universe. His Name is chanted by countless people, in so many ways. The Vedas, the Puraanas and the Simritees, the purest of utterances, were created from the One Word of the Name of the Lord. That one, in whose soul the One Lord dwells the praises of his glory cannot be recounted. Those who yearn only for the blessing of Your Darshan - Nanak: save me along with them! ||1|| Sukhmani: Peace of Mind, the Nectar of the Name of God. The minds of the devotees abide in a joyful peace. ||Pause|| Remembering God, one does not have to enter into the womb again. Remembering God, the pain of death is dispelled. Remembering God, death is eliminated. Remembering God, one's enemies are repelled. Remembering God, no obstacles are met. Remembering God, one remains awake and aware, night and day. Remembering God, one is not touched by fear. Remembering God, one does not suffer sorrow. The meditative remembrance of God is in the Company of the Holy. All treasures, O Nanak, are in the Love of the Lord. ||2|| In the remembrance of God are wealth, miraculous spiritual powers and the nine treasures. In the remembrance of God are knowledge, meditation and the essence of wisdom. In the remembrance of God are chanting, intense meditation and devotional worship. In the remembrance of God, duality is removed. In the remembrance of God are purifying baths at sacred shrines of pilgrimage. In the remembrance of God, one attains honor in the Court of the Lord. In the remembrance of God, one becomes good. In the remembrance of God, one flowers in fruition. They alone remember Him in meditation, whom He inspires to meditate. Nanak grasps the feet of those humble beings. ||3|| The remembrance of God is the highest and most exalted of all. In the remembrance of God, many are saved. In the remembrance of God, thirst is quenched. In the remembrance of God, all things are known. In the remembrance of God, there is no fear of death. In the remembrance of God, hopes are fulfilled. In the remembrance of God, the filth of the mind is removed. The Ambrosial Naam, the Name of the Lord, is absorbed into the heart. God abides upon the tongues of His Saints. Nanak is the servant of the slave of His slaves. ||4|| Those who remember God are wealthy. Those who remember God are honorable. Those who remember God are approved. Those who remember God are the most distinguished persons. Those who remember God are not lacking. Those who remember God are the rulers of all. Those who remember God dwell in peace. Those who remember God are immortal and eternal. They alone hold to the remembrance of Him, unto whom He Himself shows His Mercy. Nanak begs for the dust of their feet. ||5|| Those who remember God generously help others. Those who remember God - to them, I am forever a sacrifice. Those who remember God - their faces are beautiful. Those who remember God abide in peace. Those who remember God conquer their souls. Those who remember God have a pure and spotless lifestyle. Those who remember God experience all sorts of joys. Those who remember God abide near the Lord. By the Grace of the Saints, one remains awake and aware, night and day. O Nanak, this meditative remembrance comes only by perfect destiny. ||6|| Remembering God, one's works are accomplished. Remembering God, one never grieves. Remembering God, one speaks the Glorious Praises of the Lord. Remembering God, one is absorbed into the state of intuitive ease. Remembering God, one attains the unchanging position. Remembering God, the heart-lotus blossoms forth. Remembering God, the unstruck melody vibrates. The peace of the meditative remembrance of God has no end or limitation. They alone remember Him, upon whom God bestows His Grace. Nanak seeks the Sanctuary of those humble beings. ||7|| Remembering the Lord, His devotees are famous and radiant. Remembering the Lord, the Vedas were composed. Remembering the Lord, we become Siddhas, celibates and givers. Remembering the Lord, the lowly become known in all four directions. For the remembrance of the Lord, the whole world was established. Remember, remember in meditation the Lord, the Creator, the Cause of causes. For the remembrance of the Lord, He created the whole creation. In the remembrance of the Lord, He Himself is Formless. By His Grace, He Himself bestows understanding. O Nanak, the Gurmukh attains the remembrance of the Lord. ||8||1|| Salok: O Destroyer of the pains and the suffering of the poor, O Master of each and every heart, O Masterless One: I have come seeking Your Sanctuary. O God, please be with Nanak! ||1||`,
        meaning_pa: `ਇਸ ਬਾਣੀ ਦਾ ਨਾਮ ਹੈ 'ਸੁਖਮਨੀ' ਅਤੇ ਇਹ ਗਉੜੀ ਰਾਗ ਵਿਚ ਦਰਜ ਹੈ। ਇਸ ਦੇ ਉਚਾਰਨ ਵਾਲੇ ਗੁਰੂ ਅਰਜਨੁ ਸਾਹਿਬ ਜੀ ਹਨ। ਸਲੋਕ। ਅਕਾਲ ਪੁਰਖ ਇੱਕ ਹੈ ਅਤੇ ਸਤਿਗੁਰੂ ਦੀ ਕਿਰਪਾ ਨਾਲ ਮਿਲਦਾ ਹੈ। (ਮੇਰੀ) ਉਸ ਸਭ ਤੋਂ ਵੱਡੇ (ਅਕਾਲ ਪੁਰਖ) ਨੂੰ ਨਮਸਕਾਰ ਹੈ ਜੋ (ਸਭ ਦਾ) ਮੁੱਢ ਹੈ, ਅਤੇ ਜੋ ਜੁਗਾਂ ਦੇ ਮੁੱਢ ਤੋਂ ਹੈ। ਸਤਿਗੁਰੂ ਨੂੰ (ਮੇਰੀ) ਨਮਸਕਾਰ ਹੈ, ਸ੍ਰੀ ਗੁਰਦੇਵ ਜੀ ਨੂੰ (ਮੇਰੀ) ਨਮਸਕਾਰ ਹੈ ॥੧॥ ਮੈਂ (ਅਕਾਲ ਪੁਰਖ ਦਾ ਨਾਮ) ਸਿਮਰਾਂ ਤੇ ਸਿਮਰ ਸਿਮਰ ਕੇ ਸੁਖ ਹਾਸਲ ਕਰਾਂ; (ਇਸ ਤਰ੍ਹਾਂ) ਸਰੀਰ ਵਿਚ (ਜੋ) ਦੁੱਖ ਬਿਖਾਂਧ (ਹਨ ਉਹਨਾਂ ਨੂੰ) ਮਿਟਾ ਲਵਾਂ। ਜਿਸ ਇਕ ਜਗਤ ਪਾਲਕ (ਹਰੀ) ਦਾ ਨਾਮ- ਅਨੇਕਾਂ ਤੇ ਅਣਗਿਣਤ (ਜੀਵ) ਜਪਦੇ ਹਨ, ਮੈਂ (ਭੀ ਉਸ ਨੂੰ) ਸਿਮਰਾਂ। ਵੇਦਾਂ ਪੁਰਾਨਾਂ ਤੇ ਸਿਮ੍ਰਿਤੀਆਂ ਨੇ- ਇਕ ਅਕਾਲ ਪੁਰਖ ਦੇ ਨਾਮ ਨੂੰ ਹੀ ਸਭ ਤੋਂ ਪਵਿੱਤ੍ਰ ਨਾਮ ਮੰਨਿਆ ਹੈ। ਜਿਸ (ਮਨੁੱਖ) ਦੇ ਜੀ ਵਿਚ (ਅਕਾਲ ਪੁਰਖ ਅਪਨਾ ਨਾਮ) ਥੋੜਾ ਜਿਹਾ ਭੀ ਵਸਾਉਂਦਾ ਹੈ, ਉਸ ਦੀ ਵਡਿਆਈ ਬਿਆਨ ਨਹੀਂ ਹੋ ਸਕਦੀ। (ਹੇ ਅਕਾਲ ਪੁਰਖ!) ਜੋ ਮਨੁੱਖ ਤੇਰੇ ਦੀਦਾਰ ਦੇ ਚਾਹਵਾਨ ਹਨ, ਉਹਨਾਂ ਦੀ ਸੰਗਤਿ ਵਿਚ (ਰੱਖ ਕੇ) ਮੈਨੂੰ ਨਾਨਕ ਨੂੰ (ਸੰਸਾਰ ਸਾਗਰ ਤੋਂ) ਬਚਾ ਲਵੋ ॥੧॥ ਪ੍ਰਭੂ ਦਾ ਅਮਰ ਕਰਨ ਵਾਲਾ ਤੇ ਸੁਖਦਾਈ ਨਾਮ (ਸਭ) ਸੁਖਾਂ ਦੀ ਮਣੀ ਹੈ, ਇਸ ਦਾ ਟਿਕਾਣਾ ਭਗਤਾਂ ਦੇ ਹਿਰਦੇ ਵਿਚ ਹੈ।ਰਹਾਉ। ਪ੍ਰਭੂ ਦਾ ਸਿਮਰਨ ਕਰਨ ਨਾਲ (ਜੀਵ) ਜਨਮ ਵਿਚ ਨਹੀਂ ਆਉਂਦਾ, (ਜੀਵ ਦਾ) ਦੁਖ ਤੇ ਜਮ (ਦਾ ਡਰ) ਦੂਰ ਹੋ ਜਾਂਦਾ ਹੈ। ਮੌਤ (ਦਾ ਭਉ) ਪਰੇ ਹਟ ਜਾਂਦਾ ਹੈ, (ਵਿਕਾਰ ਰੂਪੀ) ਦੁਸ਼ਮਨ ਟਲ ਜਾਂਦਾ ਹੈ। ਪ੍ਰਭੂ ਨੂੰ ਸਿਮਰਿਆਂ (ਜ਼ਿੰਦਗੀ ਦੇ ਰਾਹ ਵਿਚ) ਕੋਈ ਰੁਕਾਵਟ ਨਹੀਂ ਪੈਂਦੀ, (ਕਿਉਂਕਿ) ਪ੍ਰਭੂ ਦਾ ਸਿਮਰਨ ਕਰਨ ਨਾਲ (ਮਨੁੱਖ) ਹਰ ਵੇਲੇ (ਵਿਕਾਰਾਂ ਵਲੋਂ) ਸੁਚੇਤ ਰਹਿੰਦਾ ਹੈ। ਪ੍ਰਭੂ ਦਾ ਸਿਮਰਨ ਕਰਨ ਨਾਲ (ਕੋਈ) ਡਰ (ਜੀਵ ਉਤੇ) ਦਬਾਉ ਨਹੀਂ ਪਾ ਸਕਦਾ, ਤੇ (ਕੋਈ) ਦੁੱਖ ਵਿਆਕੁਲ ਨਹੀਂ ਕਰ ਸਕਦਾ। ਅਕਾਲ ਪੁਰਖ ਦਾ ਸਿਮਰਨ ਗੁਰਮਖਿ ਦੀ ਸੰਗਤਿ ਵਿਚ (ਮਿਲਦਾ ਹੈ); (ਅਤੇ ਜੋ ਮਨੁੱਖ ਸਿਮਰਨ ਕਰਦਾ ਹੈ, ਉਸ ਨੂੰ) ਹੇ ਨਾਨਕ! ਅਕਾਲ ਪੁਰਖ ਦੇ ਪਿਆਰ ਵਿਚ (ਹੀ) (ਦੁਨੀਆ ਦੇ) ਸਾਰੇ ਖ਼ਜ਼ਾਨੇ (ਪ੍ਰਤੀਤ ਹੁੰਦੇ ਹਨ) ॥੨॥ ਪ੍ਰਭੂ ਦੇ ਸਿਮਰਨ ਵਿਚ (ਹੀ) ਸਾਰੀਆਂ ਰਿੱਧੀਆਂ ਸਿੱਧੀਆਂ ਤੇ ਨੌ ਖ਼ਜ਼ਾਨੇ ਹਨ, ਪ੍ਰਭ-ਸਿਮਰਨ ਵਿਚ ਹੀ ਗਿਆਨ, ਸੁਰਤ ਦਾ ਟਿਕਾਉ ਤੇ ਜਗਤ ਦੇ ਮੂਲ (ਹਰੀ) ਦੀ ਸਮਝ ਵਾਲੀ ਬੁੱਧੀ ਹੈ। ਪ੍ਰਭੂ ਦੇ ਸਿਮਰਨ ਵਿਚ ਹੀ (ਸਾਰੇ) ਜਾਪ ਤਾਪ ਤੇ (ਦੇਵ-) ਪੂਜਾ ਹਨ, (ਕਿਉਂਕਿ) ਸਿਮਰਨ ਕਰਨ ਨਾਲ ਪ੍ਰਭੂ ਤੋਂ ਬਿਨਾ ਕਿਸੇ ਹੋਰ ਉਸ ਵਰਗੀ ਹਸਤੀ ਦੀ ਹੋਂਦ ਦਾ ਖ਼ਿਆਲ ਹੀ ਦੂਰ ਹੋ ਜਾਂਦਾ ਹੈ। ਸਿਮਰਨ ਕਰਨ ਵਾਲਾ (ਆਤਮ-) ਤੀਰਥ ਦਾ ਇਸ਼ਨਾਨ ਕਰਨ ਵਾਲਾ ਹੋ ਜਾਈਦਾ ਹੈ, ਤੇ, ਦਰਗਾਹ ਵਿਚ ਇੱਜ਼ਤ ਮਿਲਦੀ ਹੈ; ਜਗਤ ਵਿਚ ਜੋ ਹੋ ਰਿਹਾ ਹੈ ਭਲਾ ਪ੍ਰਤੀਤ ਹੁੰਦਾ ਹੈ, ਤੇ ਮਨੁੱਖ-ਜਨਮ ਦਾ ਉੱਚਾ ਮਨੋਰਥ ਸਿੱਧ ਹੋ ਜਾਂਦਾ ਹੈ। (ਨਾਮ) ਉਹੀ ਸਿਮਰਦੇ ਹਨ, ਜਿਨ੍ਹਾਂ ਨੂੰ ਪ੍ਰਭੂ ਆਪਿ ਪ੍ਰੇਰਦਾ ਹੈ, (ਤਾਂ ਤੇ, ਆਖ) ਹੇ ਨਾਨਕ! ਮੈਂ ਉਹਨਾਂ (ਸਿਮਰਨ ਕਰਨ ਵਾਲਿਆਂ) ਦੀ ਪੈਰੀਂ ਲੱਗਾਂ ॥੩॥ ਪ੍ਰਭੂ ਦਾ ਸਿਮਰਨ ਕਰਨਾ (ਹੋਰ) ਸਾਰੇ (ਆਹਰਾਂ) ਨਾਲੋਂ ਚੰਗਾ ਹੈ; ਪ੍ਰਭੂ ਦਾ ਸਿਮਰਨ ਕਰਨ ਨਾਲ ਬਹੁਤ ਸਾਰੇ (ਜੀਵ) (ਵਿਕਾਰਾਂ ਤੋਂ) ਬਚ ਜਾਂਦੇ ਹਨ। ਪ੍ਰਭੂ ਦਾ ਸਿਮਰਨ ਕਰਨ ਨਾਲ (ਮਾਇਆ ਦੀ) ਤ੍ਰਿਹ ਮਿਟ ਜਾਂਦੀ ਹੈ, (ਕਿਉਂਕਿ ਮਾਇਆ ਦੇ) ਹਰੇਕ (ਕੇਲ) ਦੀ ਸਮਝ ਪੈ ਜਾਂਦੀ ਹੈ। ਪ੍ਰਭੂ ਦਾ ਸਿਮਰਨ ਕਰਨ ਨਾਲ ਜਮਾਂ ਦਾ ਡਰ ਮੁੱਕ ਜਾਂਦਾ ਹੈ, ਤੇ (ਜੀਵ ਦੀ) ਆਸ ਪੂਰਨ ਹੋ ਜਾਂਦੀ ਹੈ (ਭਾਵ, ਆਸਾਂ ਵੱਲੋਂ ਮਨ ਰੱਜ ਜਾਂਦਾ ਹੈ)। ਪ੍ਰਭੂ ਦਾ ਸਿਮਰਨ ਕੀਤਿਆਂ ਮਨ ਦੀ (ਵਿਕਾਰਾਂ ਦੀ) ਮੈਲ ਦੂਰ ਹੋ ਜਾਂਦੀ ਹੈ, ਅਤੇ ਮਨੁੱਖ ਦੇ ਹਿਰਦੇ ਵਿਚ (ਪ੍ਰਭੂ ਦਾ) ਅਮਰ ਕਰਨ ਵਾਲਾ ਨਾਮ ਟਿਕ ਜਾਂਦਾ ਹੈ। ਪ੍ਰਭੂ ਜੀ ਗੁਰਮੁਖ ਮਨੁੱਖਾਂ ਦੀ ਜੀਭ ਉਤੇ ਵੱਸਦੇ ਹਨ (ਭਾਵ, ਸਾਧ ਜਨ ਸਦਾ ਪ੍ਰਭੂ ਨੂੰ ਜਪਦੇ ਹਨ)। (ਆਖ) ਹੇ ਨਾਨਕ! (ਮੈਂ) ਗੁਰਮੁਖਾਂ ਦੇ ਸੇਵਕਾਂ ਦਾ ਸੇਵਕ (ਬਣਾਂ) ॥੪॥ ਜੋ ਮਨੁੱਖ ਪ੍ਰਭੂ ਨੂੰ ਸਿਮਰਦੇ ਹਨ, ਉਹ ਧਨਾਢ ਹਨ, ਤੇ, ਉਹ ਇੱਜ਼ਤ ਵਾਲੇ ਹਨ। ਜੋ ਮਨੁੱਖ ਪ੍ਰਭੂ ਨੂੰ ਸਿਮਰਦੇ ਹਨ, ਉਹ ਮੰਨੇ-ਪ੍ਰਮੰਨੇ ਹੋਏ ਹਨ, ਤੇ ਉਹ (ਸਭ ਮਨੁੱਖਾਂ ਤੋਂ) ਚੰਗੇ ਹਨ। ਜੋ ਮਨੁੱਖ ਪ੍ਰਭੂ ਨੂੰ ਸਿਮਰਦੇ ਹਨ ਉਹ ਕਿਸੇ ਦੇ ਮੁਥਾਜ ਨਹੀਂ ਹਨ, ਉਹ (ਤਾਂ ਸਗੋਂ) ਸਭ ਦੇ ਬਾਦਸ਼ਾਹ ਹਨ। ਜੋ ਮਨੁੱਖ ਪ੍ਰਭੂ ਨੂੰ ਸਿਮਰਦੇ ਹਨ ਉਹ ਸੁਖੀ ਵੱਸਦੇ ਹਨ, ਅਤੇ ਸਦਾ ਲਈ ਜਨਮ ਮਰਨ ਤੋਂ ਰਹਿਤ ਹੋ ਜਾਂਦੇ ਹਨ। (ਪਰ) ਪ੍ਰਭ-ਸਿਮਰਨ ਵਿਚ ਉਹੀ ਮਨੁੱਖ ਲੱਗਦੇ ਹਨ ਜਿਨ੍ਹਾਂ ਉਤੇ ਪ੍ਰਭੂ ਆਪਿ ਮੇਹਰਬਾਨ (ਹੁੰਦਾ ਹੈ); ਹੇ ਨਾਨਕ! (ਕੋਈ ਵਡ-ਭਾਗੀ) ਇਹਨਾਂ ਗੁਰਮੁਖਾਂ ਦੀ ਚਰਨ-ਧੂੜ ਮੰਗਦਾ ਹੈ ॥੫॥ ਜੋ ਮਨੁੱਖ ਪ੍ਰਭੂ ਨੂੰ ਸਿਮਰਦੇ ਹਨ, ਉਹ ਦੂਜਿਆਂ ਨਾਲ ਭਲਾਈ ਕਰਨ ਵਾਲੇ ਬਣ ਜਾਂਦੇ ਹਨ, ਉਹਨਾਂ ਤੋਂ (ਮੈਂ) ਸਦਾ ਸਦਕੇ ਹਾਂ। ਜੋ ਮਨੁੱਖ ਪ੍ਰਭੂ ਨੂੰ ਸਿਮਰਦੇ ਹਨ ਉਹਨਾਂ ਦੇ ਮੂੰਹ ਸੋਹਣੇ (ਲੱਗਦੇ) ਹਨ, ਉਹਨਾਂ ਦੀ (ਉਮਰ) ਸੁਖ ਵਿਚ ਗੁਜ਼ਰਦੀ ਹੈ। ਜੋ ਮਨੁੱਖ ਪ੍ਰਭੂ ਨੂੰ ਸਿਮਰਦੇ ਹਨ, ਉਹ ਆਪਣੇ ਆਪ ਨੂੰ ਜਿੱਤ ਲੈਂਦੇ ਹਨ, ਅਤੇ ਉਹਨਾਂ ਦੀ ਜ਼ਿੰਦਗੀ ਗੁਜ਼ਾਰਨ ਦਾ ਤਰੀਕਾ ਪਵਿਤ੍ਰ ਹੋ ਜਾਂਦਾ ਹੈ। ਜੋ ਮਨੁੱਖ ਪ੍ਰਭੂ ਨੂੰ ਸਿਮਰਦੇ ਹਨ, ਉਹਨਾਂ ਨੂੰ ਖ਼ੁਸ਼ੀਆਂ ਹੀ ਖ਼ੁਸ਼ੀਆਂ ਹਨ, (ਕਿਉਂਕਿ) ਉਹ ਪ੍ਰਭੂ ਦੀ ਹਜ਼ੂਰੀ ਵਿਚ ਵੱਸਦੇ ਹਨ। ਸੰਤਾਂ ਦੀ ਕ੍ਰਿਪਾ ਨਾਲ ਹੀ ਇਹ ਹਰ ਵੇਲੇ (ਸਿਮਰਨ ਦੀ) ਜਾਗ ਆ ਸਕਦੀ ਹੈ; ਹੇ ਨਾਨਕ! ਸਿਮਰਨ (ਦੀ ਦਾਤਿ) ਵੱਡੀ ਕਿਸਮਤ ਨਾਲ (ਮਿਲਦੀ ਹੈ) ॥੬॥ ਪ੍ਰਭੂ ਦਾ ਸਿਮਰਨ ਕਰਨ ਨਾਲ ਮਨੁੱਖ ਦੇ (ਸਾਰੇ) ਕੰਮ ਪੂਰੇ ਹੋ ਜਾਂਦੇ ਹਨ (ਭਾਵ, ਉਹ ਲੋੜਾਂ ਦੇ ਅਧੀਨ ਨਹੀਂ ਰਹਿੰਦਾ) ਅਤੇ ਕਦੇ ਚਿੰਤਾ ਦੇ ਵੱਸ ਨਹੀਂ ਹੁੰਦਾ। ਪ੍ਰਭੂ ਦਾ ਸਿਮਰਨ ਕਰਨ ਨਾਲ, ਮਨੁੱਖ ਅਕਾਲ ਪੁਰਖ ਦੇ ਗੁਣ ਹੀ ਉਚਾਰਦਾ ਹੈ (ਭਾਵ, ਉਸ ਨੂੰ ਸਿਫ਼ਤ-ਸਾਲਾਹ ਦੀ ਆਦਤ ਪੈ ਜਾਂਦੀ ਹੈ) ਅਤੇ ਸਹਜ ਅਵਸਥਾ ਵਿਚ ਟਿਕਿਆ ਰਹਿੰਦਾ ਹੈ। ਪ੍ਰਭੂ ਦਾ ਸਿਮਰਨ ਕਰਨ ਨਾਲ ਮਨੁੱਖ ਦਾ (ਮਨ ਰੂਪੀ) ਆਸਨ ਡੋਲਦਾ ਨਹੀਂ ਅਤੇ ਉਸ ਦੇ (ਹਿਰਦੇ ਦਾ) ਕਉਲ-ਫੁੱਲ ਖਿੜਿਆ ਰਹਿੰਦਾ ਹੈ। ਪ੍ਰਭੂ ਦਾ ਸਿਮਰਨ ਕਰਨ ਨਾਲ (ਮਨੁੱਖ ਦੇ ਅੰਦਰ) ਇਕ-ਰਸ ਸੰਗੀਤ (ਜਿਹਾ) (ਹੁੰਦਾ ਰਹਿੰਦਾ ਹੈ), (ਭਾਵ) ਪ੍ਰਭੂ ਦੇ ਸਿਮਰਨ ਤੋਂ ਜੋ ਸੁਖ (ਉਪਜਦਾ) ਹੈ ਉਹ (ਕਦੇ) ਮੁੱਕਦਾ ਨਹੀਂ। ਉਹੀ ਮਨੁੱਖ (ਪ੍ਰਭੂ ਨੂੰ) ਸਿਮਰਦੇ ਹਨ, ਜਿਨ੍ਹਾਂ ਉਤੇ ਪ੍ਰਭੂ ਦੀ ਮੇਹਰ ਹੁੰਦੀ ਹੈ; ਹੇ ਨਾਨਕ! (ਕੋਈ ਵਡਭਾਗੀ) ਉਹਨਾਂ (ਸਿਮਰਨ ਕਰਨ ਵਾਲੇ) ਜਨਾਂ ਦੀ ਸਰਣੀ ਪੈਂਦਾ ਹੈ ॥੭॥ ਪ੍ਰਭੂ ਦਾ ਸਿਮਰਨ ਕਰ ਕੇ ਭਗਤ (ਜਗਤ ਵਿਚ) ਮਸ਼ਹੂਰ ਹੁੰਦੇ ਹਨ, ਸਿਮਰਨ ਵਿਚ ਹੀ ਜੁੜ ਕੇ (ਰਿਸ਼ੀਆਂ ਨੇ) ਵੇਦ (ਆਦਿਕ ਧਰਮ ਪੁਸਤਕ) ਰਚੇ। ਪ੍ਰਭੂ ਦੇ ਸਿਮਰਨ ਦੁਆਰਾ ਹੀ ਮਨੁੱਖ ਸਿੱਧ ਬਣ ਗਏ, ਜਤੀ ਬਣ ਗਏ, ਦਾਤੇ ਬਣ ਗਏ; ਸਿਮਰਨ ਦੀ ਬਰਕਤਿ ਨਾਲ ਨੀਚ ਮਨੁੱਖ ਸਾਰੇ ਸੰਸਾਰ ਵਿਚ ਪਰਗਟ ਹੋ ਗਏ। ਪ੍ਰਭੂ ਦੇ ਸਿਮਰਨ ਨੇ ਸਾਰੀ ਧਰਤੀ ਨੂੰ ਆਸਰਾ ਦਿੱਤਾ ਹੋਇਆ ਹੈ; (ਤਾਂ ਤੇ ਹੇ ਭਾਈ!) ਜਗਤ ਦੇ ਕਰਤਾ ਪ੍ਰਭੂ ਨੂੰ ਸਦਾ ਸਿਮਰ। ਪ੍ਰਭੂ ਨੇ ਸਿਮਰਨ ਵਾਸਤੇ ਸਾਰਾ ਜਗਤ ਬਣਾਇਆ ਹੈ; ਜਿਥੇ ਸਿਮਰਨ ਹੈ ਓਥੇ ਨਿਰੰਕਾਰ ਆਪ ਵੱਸਦਾ ਹੈ। ਮੇਹਰ ਕਰ ਕੇ ਜਿਸ ਮਨੁੱਖ ਨੂੰ (ਸਿਮਰਨ ਕਰਨ ਦੀ) ਸਮਝ ਦੇਂਦਾ ਹੈ, ਹੇ ਨਾਨਕ! ਉਸ ਮਨੁੱਖ ਨੇ ਗੁਰੂ ਦੁਆਰਾ ਸਿਮਰਨ (ਦੀ ਦਾਤ) ਪ੍ਰਾਪਤ ਕਰ ਲਈ ਹੈ ॥੮॥੧॥ ਦੀਨਾਂ ਦੇ ਦਰਦ ਤੇ ਦੁੱਖ ਨਾਸ ਕਰਨ ਵਾਲੇ ਹੇ ਪ੍ਰਭੂ! ਹੇ ਹਰੇਕ ਸਰੀਰ ਵਿਚ ਵਿਆਪਕ ਹਰੀ! ਹੇ ਅਨਾਥਾਂ ਦੇ ਨਾਥ! ਹੇ ਪ੍ਰਭੂ! ਗੁਰੂ ਨਾਨਕ ਦਾ ਪੱਲਾ ਫੜ ਕੇ ਮੈਂ ਤੇਰੀ ਸਰਣ ਆਇਆ ਹਾਂ ॥੧॥`
      },
      {
        number: 2,
        sanskrit: `ਸਲੋਕੁ ॥
ਦੀਨ ਦਰਦ ਦੁਖ ਭੰਜਨਾ ਘਟਿ ਘਟਿ ਨਾਥ ਅਨਾਥ ॥
ਸਰਣਿ ਤੁਮੑਾਰੀ ਆਇਓ ਨਾਨਕ ਕੇ ਪ੍ਰਭ ਸਾਥ ॥੧॥
ਅਸਟਪਦੀ ॥
ਜਹ ਮਾਤ ਪਿਤਾ ਸੁਤ ਮੀਤ ਨ ਭਾਈ ॥
ਮਨ ਊਹਾ ਨਾਮੁ ਤੇਰੈ ਸੰਗਿ ਸਹਾਈ ॥
ਜਹ ਮਹਾ ਭਇਆਨ ਦੂਤ ਜਮ ਦਲੈ ॥
ਤਹ ਕੇਵਲ ਨਾਮੁ ਸੰਗਿ ਤੇਰੈ ਚਲੈ ॥
ਜਹ ਮੁਸਕਲ ਹੋਵੈ ਅਤਿ ਭਾਰੀ ॥
ਹਰਿ ਕੋ ਨਾਮੁ ਖਿਨ ਮਾਹਿ ਉਧਾਰੀ ॥
ਅਨਿਕ ਪੁਨਹਚਰਨ ਕਰਤ ਨਹੀ ਤਰੈ ॥
ਹਰਿ ਕੋ ਨਾਮੁ ਕੋਟਿ ਪਾਪ ਪਰਹਰੈ ॥
ਗੁਰਮੁਖਿ ਨਾਮੁ ਜਪਹੁ ਮਨ ਮੇਰੇ ॥
ਨਾਨਕ ਪਾਵਹੁ ਸੂਖ ਘਨੇਰੇ ॥੧॥
ਸਗਲ ਸ੍ਰਿਸਟਿ ਕੋ ਰਾਜਾ ਦੁਖੀਆ ॥
ਹਰਿ ਕਾ ਨਾਮੁ ਜਪਤ ਹੋਇ ਸੁਖੀਆ ॥
ਲਾਖ ਕਰੋਰੀ ਬੰਧੁ ਨ ਪਰੈ ॥
ਹਰਿ ਕਾ ਨਾਮੁ ਜਪਤ ਨਿਸਤਰੈ ॥
ਅਨਿਕ ਮਾਇਆ ਰੰਗ ਤਿਖ ਨ ਬੁਝਾਵੈ ॥
ਹਰਿ ਕਾ ਨਾਮੁ ਜਪਤ ਆਘਾਵੈ ॥
ਜਿਹ ਮਾਰਗਿ ਇਹੁ ਜਾਤ ਇਕੇਲਾ ॥
ਤਹ ਹਰਿ ਨਾਮੁ ਸੰਗਿ ਹੋਤ ਸੁਹੇਲਾ ॥
ਐਸਾ ਨਾਮੁ ਮਨ ਸਦਾ ਧਿਆਈਐ ॥
ਨਾਨਕ ਗੁਰਮੁਖਿ ਪਰਮ ਗਤਿ ਪਾਈਐ ॥੨॥
ਛੂਟਤ ਨਹੀ ਕੋਟਿ ਲਖ ਬਾਹੀ ॥
ਨਾਮੁ ਜਪਤ ਤਹ ਪਾਰਿ ਪਰਾਹੀ ॥
ਅਨਿਕ ਬਿਘਨ ਜਹ ਆਇ ਸੰਘਾਰੈ ॥
ਹਰਿ ਕਾ ਨਾਮੁ ਤਤਕਾਲ ਉਧਾਰੈ ॥
ਅਨਿਕ ਜੋਨਿ ਜਨਮੈ ਮਰਿ ਜਾਮ ॥
ਨਾਮੁ ਜਪਤ ਪਾਵੈ ਬਿਸ੍ਰਾਮ ॥
ਹਉ ਮੈਲਾ ਮਲੁ ਕਬਹੁ ਨ ਧੋਵੈ ॥
ਹਰਿ ਕਾ ਨਾਮੁ ਕੋਟਿ ਪਾਪ ਖੋਵੈ ॥
ਐਸਾ ਨਾਮੁ ਜਪਹੁ ਮਨ ਰੰਗਿ ॥
ਨਾਨਕ ਪਾਈਐ ਸਾਧ ਕੈ ਸੰਗਿ ॥੩॥
ਜਿਹ ਮਾਰਗ ਕੇ ਗਨੇ ਜਾਹਿ ਨ ਕੋਸਾ ॥
ਹਰਿ ਕਾ ਨਾਮੁ ਊਹਾ ਸੰਗਿ ਤੋਸਾ ॥
ਜਿਹ ਪੈਡੈ ਮਹਾ ਅੰਧ ਗੁਬਾਰਾ ॥
ਹਰਿ ਕਾ ਨਾਮੁ ਸੰਗਿ ਉਜੀਆਰਾ ॥
ਜਹਾ ਪੰਥਿ ਤੇਰਾ ਕੋ ਨ ਸਿਞਾਨੂ ॥
ਹਰਿ ਕਾ ਨਾਮੁ ਤਹ ਨਾਲਿ ਪਛਾਨੂ ॥
ਜਹ ਮਹਾ ਭਇਆਨ ਤਪਤਿ ਬਹੁ ਘਾਮ ॥
ਤਹ ਹਰਿ ਕੇ ਨਾਮ ਕੀ ਤੁਮ ਊਪਰਿ ਛਾਮ ॥
ਜਹਾ ਤ੍ਰਿਖਾ ਮਨ ਤੁਝੁ ਆਕਰਖੈ ॥
ਤਹ ਨਾਨਕ ਹਰਿ ਹਰਿ ਅੰਮ੍ਰਿਤੁ ਬਰਖੈ ॥੪॥
ਭਗਤ ਜਨਾ ਕੀ ਬਰਤਨਿ ਨਾਮੁ ॥
ਸੰਤ ਜਨਾ ਕੈ ਮਨਿ ਬਿਸ੍ਰਾਮੁ ॥
ਹਰਿ ਕਾ ਨਾਮੁ ਦਾਸ ਕੀ ਓਟ ॥
ਹਰਿ ਕੈ ਨਾਮਿ ਉਧਰੇ ਜਨ ਕੋਟਿ ॥
ਹਰਿ ਜਸੁ ਕਰਤ ਸੰਤ ਦਿਨੁ ਰਾਤਿ ॥
ਹਰਿ ਹਰਿ ਅਉਖਧੁ ਸਾਧ ਕਮਾਤਿ ॥
ਹਰਿ ਜਨ ਕੈ ਹਰਿ ਨਾਮੁ ਨਿਧਾਨੁ ॥
ਪਾਰਬ੍ਰਹਮਿ ਜਨ ਕੀਨੋ ਦਾਨ ॥
ਮਨ ਤਨ ਰੰਗਿ ਰਤੇ ਰੰਗ ਏਕੈ ॥
ਨਾਨਕ ਜਨ ਕੈ ਬਿਰਤਿ ਬਿਬੇਕੈ ॥੫॥
ਹਰਿ ਕਾ ਨਾਮੁ ਜਨ ਕਉ ਮੁਕਤਿ ਜੁਗਤਿ ॥
ਹਰਿ ਕੈ ਨਾਮਿ ਜਨ ਕਉ ਤ੍ਰਿਪਤਿ ਭੁਗਤਿ ॥
ਹਰਿ ਕਾ ਨਾਮੁ ਜਨ ਕਾ ਰੂਪ ਰੰਗੁ ॥
ਹਰਿ ਨਾਮੁ ਜਪਤ ਕਬ ਪਰੈ ਨ ਭੰਗੁ ॥
ਹਰਿ ਕਾ ਨਾਮੁ ਜਨ ਕੀ ਵਡਿਆਈ ॥
ਹਰਿ ਕੈ ਨਾਮਿ ਜਨ ਸੋਭਾ ਪਾਈ ॥
ਹਰਿ ਕਾ ਨਾਮੁ ਜਨ ਕਉ ਭੋਗ ਜੋਗ ॥
ਹਰਿ ਨਾਮੁ ਜਪਤ ਕਛੁ ਨਾਹਿ ਬਿਓਗੁ ॥
ਜਨੁ ਰਾਤਾ ਹਰਿ ਨਾਮ ਕੀ ਸੇਵਾ ॥
ਨਾਨਕ ਪੂਜੈ ਹਰਿ ਹਰਿ ਦੇਵਾ ॥੬॥
ਹਰਿ ਹਰਿ ਜਨ ਕੈ ਮਾਲੁ ਖਜੀਨਾ ॥
ਹਰਿ ਧਨੁ ਜਨ ਕਉ ਆਪਿ ਪ੍ਰਭਿ ਦੀਨਾ ॥
ਹਰਿ ਹਰਿ ਜਨ ਕੈ ਓਟ ਸਤਾਣੀ ॥
ਹਰਿ ਪ੍ਰਤਾਪਿ ਜਨ ਅਵਰ ਨ ਜਾਣੀ ॥
ਓਤਿ ਪੋਤਿ ਜਨ ਹਰਿ ਰਸਿ ਰਾਤੇ ॥
ਸੁੰਨ ਸਮਾਧਿ ਨਾਮ ਰਸ ਮਾਤੇ ॥
ਆਠ ਪਹਰ ਜਨੁ ਹਰਿ ਹਰਿ ਜਪੈ ॥
ਹਰਿ ਕਾ ਭਗਤੁ ਪ੍ਰਗਟ ਨਹੀ ਛਪੈ ॥
ਹਰਿ ਕੀ ਭਗਤਿ ਮੁਕਤਿ ਬਹੁ ਕਰੇ ॥
ਨਾਨਕ ਜਨ ਸੰਗਿ ਕੇਤੇ ਤਰੇ ॥੭॥
ਪਾਰਜਾਤੁ ਇਹੁ ਹਰਿ ਕੋ ਨਾਮ ॥
ਕਾਮਧੇਨ ਹਰਿ ਹਰਿ ਗੁਣ ਗਾਮ ॥
ਸਭ ਤੇ ਊਤਮ ਹਰਿ ਕੀ ਕਥਾ ॥
ਨਾਮੁ ਸੁਨਤ ਦਰਦ ਦੁਖ ਲਥਾ ॥
ਨਾਮ ਕੀ ਮਹਿਮਾ ਸੰਤ ਰਿਦ ਵਸੈ ॥
ਸੰਤ ਪ੍ਰਤਾਪਿ ਦੁਰਤੁ ਸਭੁ ਨਸੈ ॥
ਸੰਤ ਕਾ ਸੰਗੁ ਵਡਭਾਗੀ ਪਾਈਐ ॥
ਸੰਤ ਕੀ ਸੇਵਾ ਨਾਮੁ ਧਿਆਈਐ ॥
ਨਾਮ ਤੁਲਿ ਕਛੁ ਅਵਰੁ ਨ ਹੋਇ ॥
ਨਾਨਕ ਗੁਰਮੁਖਿ ਨਾਮੁ ਪਾਵੈ ਜਨੁ ਕੋਇ ॥੮॥੨॥
ਸਲੋਕੁ ॥
ਬਹੁ ਸਾਸਤ੍ਰ ਬਹੁ ਸਿਮ੍ਰਿਤੀ ਪੇਖੇ ਸਰਬ ਢਢੋਲਿ ॥
ਪੂਜਸਿ ਨਾਹੀ ਹਰਿ ਹਰੇ ਨਾਨਕ ਨਾਮ ਅਮੋਲ ॥੧॥`,
        transliteration: `salok |
deen darad dukh bhanjanaa ghatt ghatt naath anaath |
saran tumaaree aaeo naanak ke prabh saath |1|
asattapadee |
jeh maat pitaa sut meet na bhaaee |
man aoohaa naam terai sang sahaaee |
jeh mahaa bheaan doot jam dalai |
teh keval naam sang terai chalai |
jeh musakal hovai at bhaaree |
har ko naam khin maeh udhaaree |
anik punahacharan karat nahee tarai |
har ko naam kott paap paraharai |
guramukh naam japahu man mere |
naanak paavahu sookh ghanere |1|
sagal srisatt ko raajaa dukheea |
har kaa naam japat hoe sukheea |
laakh karoree bandh na parai |
har kaa naam japat nisatarai |
anik maaeaa rang tikh na bujhaavai |
har kaa naam japat aaghaavai |
jih maarag ihu jaat ikelaa |
teh har naam sang hot suhelaa |
aisaa naam man sadaa dhiaaeeai |
naanak guramukh param gat paaeeai |2|
chhoottat nahee kott lakh baahee |
naam japat teh paar paraahee |
anik bighan jeh aae sanghaarai |
har kaa naam tatakaal udhaarai |
anik jon janamai mar jaam |
naam japat paavai bisraam |
hau mailaa mal kabahu na dhovai |
har kaa naam kott paap khovai |
aisaa naam japahu man rang |
naanak paaeeai saadh kai sang |3|
jih maarag ke gane jaeh na kosaa |
har kaa naam aoohaa sang tosaa |
jih paiddai mahaa andh gubaaraa |
har kaa naam sang ujeeaaraa |
jahaa panth teraa ko na siyaanoo |
har kaa naam teh naal pachhaanoo |
jeh mahaa bheaan tapat bahu ghaam |
teh har ke naam kee tum aoopar chhaam |
jahaa trikhaa man tujh aakarakhai |
teh naanak har har amrit barakhai |4|
bhagat janaa kee baratan naam |
sant janaa kai man bisraam |
har kaa naam daas kee ott |
har kai naam udhare jan kott |
har jas karat sant din raat |
har har aaukhadh saadh kamaat |
har jan kai har naam nidhaan |
paarabraham jan keeno daan |
man tan rang rate rang ekai |
naanak jan kai birat bibekai |5|
har kaa naam jan kau mukat jugat |
har kai naam jan kau tripat bhugat |
har kaa naam jan kaa roop rang |
har naam japat kab parai na bhang |
har kaa naam jan kee vaddiaaee |
har kai naam jan sobhaa paaee |
har kaa naam jan kau bhog jog |
har naam japat kachh naeh biog |
jan raataa har naam kee sevaa |
naanak poojai har har devaa |6|
har har jan kai maal khajeenaa |
har dhan jan kau aap prabh deenaa |
har har jan kai ott sataanee |
har prataap jan avar na jaanee |
ot pot jan har ras raate |
sun samaadh naam ras maate |
aatth pehar jan har har japai |
har kaa bhagat pragatt nahee chhapai |
har kee bhagat mukat bahu kare |
naanak jan sang kete tare |7|
paarajaat ihu har ko naam |
kaamadhen har har gun gaam |
sabh te aootam har kee kathaa |
naam sunat darad dukh lathaa |
naam kee mahimaa sant rid vasai |
sant prataap durat sabh nasai |
sant kaa sang vaddabhaagee paaeeai |
sant kee sevaa naam dhiaaeeai |
naam tul kachh avar na hoe |
naanak guramukh naam paavai jan koe |8|2|
salok |
bahu saasatr bahu simritee pekhe sarab dtadtol |
poojas naahee har hare naanak naam amol |1|`,
        meaning: `Salok: O Destroyer of the pains and the suffering of the poor, O Master of each and every heart, O Masterless One: I have come seeking Your Sanctuary. O God, please be with Nanak! ||1|| Ashtapadee: Where there is no mother, father, children, friends or siblings O my mind, there, only the Naam, the Name of the Lord, shall be with you as your help and support. Where the great and terrible Messenger of Death shall try to crush you, there, only the Naam shall go along with you. Where the obstacles are so very heavy, the Name of the Lord shall rescue you in an instant. By performing countless religious rituals, you shall not be saved. The Name of the Lord washes off millions of sins. As Gurmukh, chant the Naam, O my mind. O Nanak, you shall obtain countless joys. ||1|| The rulers of the all the world are unhappy; one who chants the Name of the Lord becomes happy. Acquiring hundreds of thousands and millions, your desires shall not be contained. Chanting the Name of the Lord, you shall find release. By the countless pleasures of Maya, your thirst shall not be quenched. Chanting the Name of the Lord, you shall be satisfied. Upon that path where you must go all alone, there, only the Lord's Name shall go with you to sustain you. On such a Name, O my mind, meditate forever. O Nanak, as Gurmukh, you shall obtain the state of supreme dignity. ||2|| You shall not be saved by hundreds of thousands and millions of helping hands. Chanting the Naam, you shall be lifted up and carried across. Where countless misfortunes threaten to destroy you, the Name of the Lord shall rescue you in an instant. Through countless incarnations, people are born and die. Chanting the Name of the Lord, you shall come to rest in peace. The ego is polluted by a filth which can never be washed off. The Name of the Lord erases millions of sins. Chant such a Name with love, O my mind. O Nanak, it is obtained in the Company of the Holy. ||3|| On that path where the miles cannot be counted, there, the Name of the Lord shall be your sustenance. On that journey of total, pitch-black darkness, the Name of the Lord shall be the Light with you. On that journey where no one knows you, with the Name of the Lord, you shall be recognized. Where there is awesome and terrible heat and blazing sunshine, there, the Name of the Lord will give you shade. Where thirst, O my mind, torments you to cry out, there, O Nanak, the Ambrosial Name, Har, Har, shall rain down upon you. ||4|| Unto the devotee, the Naam is an article of daily use. The minds of the humble Saints are at peace. The Name of the Lord is the Support of His servants. By the Name of the Lord, millions have been saved. The Saints chant the Praises of the Lord, day and night. Har, Har - the Lord's Name - the Holy use it as their healing medicine. The Lord's Name is the treasure of the Lord's servant. The Supreme Lord God has blessed His humble servant with this gift. Mind and body are imbued with ecstasy in the Love of the One Lord. O Nanak, careful and discerning understanding is the way of the Lord's humble servant. ||5|| The Name of the Lord is the path of liberation for His humble servants. With the food of the Name of the Lord, His servants are satisfied. The Name of the Lord is the beauty and delight of His servants. Chanting the Lord's Name, one is never blocked by obstacles. The Name of the Lord is the glorious greatness of His servants. Through the Name of the Lord, His servants obtain honor. The Name of the Lord is the enjoyment and Yoga of His servants. Chanting the Lord's Name, there is no separation from Him. His servants are imbued with the service of the Lord's Name. O Nanak, worship the Lord, the Lord Divine, Har, Har. ||6|| The Lord's Name, Har, Har, is the treasure of wealth of His servants. The treasure of the Lord has been bestowed on His servants by God Himself. The Lord, Har, Har is the All-powerful Protection of His servants. His servants know no other than the Lord's Magnificence. Through and through, His servants are imbued with the Lord's Love. In deepest Samaadhi, they are intoxicated with the essence of the Naam. Twenty-four hours a day, His servants chant Har, Har. The devotees of the Lord are known and respected; they do not hide in secrecy. Through devotion to the Lord, many have been liberated. O Nanak, along with His servants, many others are saved. ||7|| This Elysian Tree of miraculous powers is the Name of the Lord. The Khaamadhayn, the cow of miraculous powers, is the singing of the Glory of the Lord's Name, Har, Har. Highest of all is the Lord's Speech. Hearing the Naam, pain and sorrow are removed. The Glory of the Naam abides in the hearts of His Saints. By the Saint's kind intervention, all guilt is dispelled. The Society of the Saints is obtained by great good fortune. Serving the Saint, one meditates on the Naam. There is nothing equal to the Naam. O Nanak, rare are those, who, as Gurmukh, obtain the Naam. ||8||2|| Salok: The many Shaastras and the many Simritees - I have seen and searched through them all. They are not equal to Har, Haray - O Nanak, the Lord's Invaluable Name. ||1||`,
        meaning_pa: `ਦੀਨਾਂ ਦੇ ਦਰਦ ਤੇ ਦੁੱਖ ਨਾਸ ਕਰਨ ਵਾਲੇ ਹੇ ਪ੍ਰਭੂ! ਹੇ ਹਰੇਕ ਸਰੀਰ ਵਿਚ ਵਿਆਪਕ ਹਰੀ! ਹੇ ਅਨਾਥਾਂ ਦੇ ਨਾਥ! ਹੇ ਪ੍ਰਭੂ! ਗੁਰੂ ਨਾਨਕ ਦਾ ਪੱਲਾ ਫੜ ਕੇ ਮੈਂ ਤੇਰੀ ਸਰਣ ਆਇਆ ਹਾਂ ॥੧॥ ਜਿਥੇ ਮਾਂ, ਪਿਉ, ਪੁੱਤਰ, ਮਿੱਤ੍ਰ, ਭਰਾ ਕੋਈ (ਸਾਥੀ) ਨਹੀਂ (ਬਣਦਾ), ਓਥੇ ਹੇ ਮਨ! (ਪ੍ਰਭੂ) ਦਾ ਨਾਮ ਤੇਰੇ ਨਾਲ ਸਹੈਤਾ ਕਰਨ ਵਾਲਾ (ਹੈ)। ਜਿਥੇ ਵੱਡੇ ਡਰਾਉਣੇ ਜਮਦੂਤਾਂ ਦਾ ਦਲ ਹੈ, ਓਥੇ ਤੇਰੇ ਨਾਲ ਸਿਰਫ਼ ਪ੍ਰਭੂ ਦਾ ਨਾਮ ਹੀ ਜਾਂਦਾ ਹੈ। ਜਿਥੇ ਬੜੀ ਭਾਰੀ ਮੁਸ਼ਕਲ ਹੁੰਦੀ ਹੈ, (ਓਥੇ) ਪ੍ਰਭੂ ਦਾ ਨਾਮ ਅੱਖ ਦੇ ਫੋਰ ਵਿਚ ਬਚਾ ਲੈਂਦਾ ਹੈ। ਅਨੇਕਾਂ ਧਾਰਮਿਕ ਰਸਮਾਂ ਕਰ ਕੇ ਭੀ (ਮਨੁੱਖ ਪਾਪਾਂ ਤੋਂ) ਨਹੀਂ ਬਚਦਾ, (ਪਰ) ਪ੍ਰਭੂ ਦਾ ਨਾਮ ਕਰੋੜਾਂ ਪਾਪਾਂ ਦਾ ਨਾਸ ਕਰ ਦੇਂਦਾ ਹੈ। (ਤਾਂ ਤੇ) ਹੇ ਮੇਰੇ ਮਨ! ਗੁਰੂ ਦੀ ਸਰਣ ਪੈ ਕੇ (ਪ੍ਰਭੂ ਦਾ) ਨਾਮ ਜਪ; ਹੇ ਨਾਨਕ! (ਨਾਮ ਦੀ ਬਰਕਤਿ ਨਾਲ) ਬੜੇ ਸੁਖ ਪਾਵਹਿਂਗਾ ॥੧॥ (ਮਨੁੱਖ) ਸਾਰੀ ਦੁਨੀਆ ਦਾ ਰਾਜਾ (ਹੋ ਕੇ ਭੀ) ਦੁਖੀ (ਰਹਿੰਦਾ ਹੈ), ਪਰ ਪ੍ਰਭੂ ਦਾ ਨਾਮ ਜਪਿਆਂ ਸੁਖੀ (ਹੋ ਜਾਂਦਾ ਹੈ); (ਕਿਉਂਕਿ) ਲੱਖਾਂ ਕਰੋੜਾਂ (ਰੁਪਏ) ਕਮਾ ਕੇ ਭੀ (ਮਾਇਆ ਦੀ ਤ੍ਰਿਹ ਵਿਚ) ਰੋਕ ਨਹੀਂ ਪੈਂਦੀ, (ਏਸ ਮਾਇਆ-ਕਾਂਗ ਤੋਂ) ਪ੍ਰਭੂ ਦਾ ਨਾਮ ਜਪ ਕੇ ਮਨੁੱਖ ਪਾਰ ਲੰਘ ਜਾਂਦਾ ਹੈ; ਮਾਇਆ ਦੀਆਂ ਬੇ-ਅੰਤ ਮੌਜਾਂ ਹੁੰਦਿਆਂ ਭੀ (ਮਾਇਆ ਦੀ) ਤ੍ਰਿਹ ਨਹੀਂ ਬੁੱਝਦੀ, (ਪਰ) ਪ੍ਰਭੂ ਦਾ ਨਾਮ ਜਪਿਆਂ (ਮਨੁੱਖ ਮਾਇਆ ਵਲੋਂ) ਰੱਜ ਜਾਂਦਾ ਹੈ। ਜਿਹਨੀਂ ਰਾਹੀਂ ਇਹ ਜੀਵ ਇਕੱਲਾ ਜਾਂਦਾ ਹੈ, (ਭਾਵ, ਜ਼ਿੰਦਗੀ ਦੇ ਜਿਨ੍ਹਾਂ ਝੰਬੇਲਿਆਂ ਵਿਚ ਇਸ ਚਿੰਤਾਤੁਰ ਜੀਵ ਦੀ ਕੋਈ ਸਹੈਤਾ ਨਹੀਂ ਕਰ ਸਕਦਾ) ਓਥੇ ਪ੍ਰਭੂ ਦਾ ਨਾਮ ਇਸ ਦੇ ਨਾਲ ਸੁਖ ਦੇਣ ਵਾਲਾ ਹੁੰਦਾ ਹੈ। (ਤਾਂ ਤੇ) ਹੇ ਮਨ! ਅਜੇਹਾ (ਸੁਹੇਲਾ) ਨਾਮ ਸਦਾ ਸਿਮਰੀਏ, ਹੇ ਨਾਨਕ! ਗੁਰੂ ਦੀ ਰਾਹੀਂ (ਨਾਮ ਜਪਿਆਂ) ਉੱਚਾ ਦਰਜਾ ਮਿਲਦਾ ਹੈ ॥੨॥ ਲੱਖਾਂ ਕਰੋੜਾਂ ਭਰਾਵਾਂ ਦੇ ਹੁੰਦਿਆਂ (ਮਨੁੱਖ ਜਿਸ ਦੀਨ ਅਵਸਥਾ ਤੋਂ) ਖ਼ਲਾਸੀ ਨਹੀਂ ਪਾ ਸਕਦਾ, ਓਥੋਂ (ਪ੍ਰਭੂ ਦਾ) ਨਾਮ ਜਪਿਆਂ (ਜੀਵ) ਪਾਰ ਲੰਘ ਜਾਂਦੇ ਹਨ। ਜਿਥੇ ਅਨੇਕਾਂ ਔਕੜਾਂ ਆ ਦਬਾਉਂਦੀਆਂ ਹਨ, (ਓਥੇ) ਪ੍ਰਭੂ ਦਾ ਨਾਮ ਤੁਰਤ ਬਚਾ ਲੈਂਦਾ ਹੈ। (ਜੀਵ) ਅਨੇਕਾਂ ਜੂਨਾਂ ਵਿਚ ਜੰਮਦਾ ਹੈ, ਮਰਦਾ ਹੈ (ਫਿਰ) ਜੰਮਦਾ ਹੈ (ਏਸੇ ਤਰ੍ਹਾਂ ਜਨਮ ਮਰਨ ਦੇ ਗੇੜ ਵਿਚ ਪਿਆ ਰਹਿੰਦਾ ਹੈ), ਨਾਮ ਜਪਿਆਂ (ਪ੍ਰਭੂ-ਚਰਨਾਂ ਵਿਚ) ਟਿਕ ਜਾਂਦਾ ਹੈ। ਹਉਮੈ ਨਾਲ ਗੰਦਾ ਹੋਇਆ (ਜੀਵ) ਕਦੇ ਇਹ ਮੈਲ ਧੋਂਦਾ ਨਹੀਂ, (ਪਰ) ਪ੍ਰਭੂ ਦਾ ਨਾਮ ਕਰੋੜਾਂ ਪਾਪ ਨਾਸ ਕਰ ਦੇਂਦਾ ਹੈ। ਹੇ ਮਨ! (ਪ੍ਰਭੂ ਦਾ) ਅਜੇਹਾ ਨਾਮ ਪਿਆਰ ਨਾਲ ਜਪ। ਹੇ ਨਾਨਕ! (ਪ੍ਰਭੂ ਦਾ ਨਾਮ) ਗੁਰਮੁਖਾਂ ਦੀ ਸੰਗਤਿ ਵਿਚ ਮਿਲਦਾ ਹੈ ॥੩॥ ਜਿਸ (ਜ਼ਿੰਦਗੀ ਰੂਪੀ) ਪੈਂਡੇ ਦੇ ਕੋਹ ਗਿਣੇ ਨਹੀਂ ਜਾ ਸਕਦੇ, ਉਥੇ (ਭਾਵ, ਉਸ ਲੰਮੇ ਸਫ਼ਰ ਵਿਚ) ਪ੍ਰਭੂ ਦਾ ਨਾਮ (ਜੀਵ ਦੇ) ਨਾਲ (ਰਾਹ ਦੀ) ਰਾਸ-ਪੂੰਜੀ ਹੈ। ਜਿਸ (ਜ਼ਿੰਦਗੀ ਰੂਪ) ਰਾਹ ਵਿਚ (ਵਿਕਾਰਾਂ ਦਾ) ਬੜਾ ਘੁੱਪ ਹਨੇਰਾ ਹੈ, (ਓਥੇ) ਪ੍ਰਭੂ ਦਾ ਨਾਮ (ਜੀਵ ਦੇ) ਨਾਲ ਚਾਨਣ ਹੈ। ਜਿਸ ਰਸਤੇ ਵਿਚ (ਹੇ ਜੀਵ!) ਤੇਰਾ ਕੋਈ (ਅਸਲੀ) ਮਰਹਮ ਨਹੀਂ ਹੈ, ਓਥੇ ਪ੍ਰਭੂ ਦਾ ਨਾਮ ਤੇਰੇ ਨਾਲ (ਸੱਚਾ) ਸਾਥੀ ਹੈ। ਜਿਥੇ (ਜ਼ਿੰਦਗੀ ਦੇ ਸਫ਼ਰ ਵਿਚ) (ਵਿਕਾਰਾਂ ਦੀ) ਬੜੀ ਭਿਆਨਕ ਤਪਸ਼ ਤੇ ਗਰਮੀ ਹੈ, ਓਥੇ ਪ੍ਰਭੂ ਦਾ ਨਾਮ (ਹੇ ਜੀਵ!) ਤੇਰੇ ਉਤੇ ਛਾਂ ਹੈ। (ਹੇ ਜੀਵ!) ਜਿਥੇ (ਮਾਇਆ ਦੀ) ਤ੍ਰਿਹ ਤੈਨੂੰ (ਸਦਾ) ਖਿੱਚ ਪਾਉਂਦੀ ਹੈ, ਓਥੇ, ਹੇ ਨਾਨਕ! ਪ੍ਰਭੂ ਦੇ ਨਾਮ ਦੀ ਬਰਖਾ ਹੁੰਦੀ ਹੈ (ਜੋ ਤਪਸ਼ ਨੂੰ ਬੁਝਾ ਦੇਂਦੀ ਹੈ) ॥੪॥ ਪ੍ਰਭੂ-ਨਾਮ ਭਗਤਾਂ ਦਾ ਹੱਥ-ਠੋਕਾ ਹੈ, ਭਗਤਾਂ ਦੇ ਹੀ ਮਨ ਵਿਚ ਇਹ ਟਿਕਿਆ ਰਹਿੰਦਾ ਹੈ। ਪ੍ਰਭੂ ਦਾ ਨਾਮ ਭਗਤਾਂ ਦਾ ਆਸਰਾ ਹੈ, ਪ੍ਰਭੂ-ਨਾਮ ਦੀ ਰਾਹੀਂ ਕਰੋੜਾਂ ਬੰਦੇ (ਵਿਕਾਰਾਂ ਤੋਂ) ਬਚ ਜਾਂਦੇ ਹਨ। ਭਗਤ ਜਨ ਦਿਨ ਰਾਤ ਪ੍ਰਭੂ ਦੀ ਵਡਿਆਈ ਕਰਦੇ ਹਨ, ਤੇ, ਪ੍ਰਭੂ-ਨਾਮ ਰੂਪੀ ਦਵਾਈ ਇਕੱਠੀ ਕਰਦੇ ਹਨ (ਜਿਸ ਨਾਲ ਹਉਮੈ ਰੋਗ ਦੂਰ ਹੁੰਦਾ ਹੈ)। ਭਗਤਾਂ ਦੇ ਪਾਸ ਪ੍ਰਭੂ ਦਾ ਨਾਮ ਹੀ ਖ਼ਜ਼ਾਨਾ ਹੈ, ਪ੍ਰਭੂ ਨੇ ਨਾਮ ਦੀ ਬਖ਼ਸ਼ਸ਼ ਆਪਣੇ ਸੇਵਕਾਂ ਤੇ ਆਪ ਕੀਤੀ ਹੈ। ਭਗਤ ਜਨ ਮਨੋਂ ਤਨੋਂ ਇਕ ਪ੍ਰਭੂ ਦੇ ਪਿਆਰ ਵਿਚ ਰੰਗੇ ਰਹਿੰਦੇ ਹਨ; ਹੇ ਨਾਨਕ! ਭਗਤਾਂ ਦੇ ਅੰਦਰ ਚੰਗੇ ਮੰਦੇ ਦੀ ਪਰਖ ਕਰਨ ਵਾਲਾ ਸੁਭਾਉ ਬਣ ਜਾਂਦਾ ਹੈ ॥੫॥ ਭਗਤ ਵਾਸਤੇ ਪ੍ਰਭੂ ਦਾ ਨਾਮ (ਹੀ) (ਮਾਇਆ ਦੇ ਬੰਧਨਾਂ ਤੋਂ) ਛੁਟਕਾਰੇ ਦਾ ਵਸੀਲਾ ਹੈ, (ਕਿਉਂਕਿ) ਪ੍ਰਭੂ ਦੇ ਨਾਮ ਦੀ ਰਾਹੀਂ ਭਗਤ (ਮਾਇਆ ਦੇ) ਭੋਗਾਂ ਵਲੋਂ ਰੱਜ ਜਾਂਦਾ ਹੈ। ਪ੍ਰਭੂ ਦਾ ਨਾਮ ਭਗਤ ਦਾ ਸੋਹਜ ਸੁਹਣੱਪ ਹੈ, ਪ੍ਰਭੂ ਦਾ ਨਾਮ ਜਪਦਿਆਂ (ਭਗਤ ਦੇ ਰਾਹ ਵਿਚ) ਕਦੇ (ਕੋਈ) ਅਟਕਾਉ ਨਹੀਂ ਪੈਂਦਾ। ਪ੍ਰਭੂ ਦਾ ਨਾਮ (ਹੀ) ਭਗਤ ਦੀ ਪਤ-ਇੱਜ਼ਤ ਹੈ, (ਕਿਉਂਕਿ) ਪ੍ਰਭੂ ਦੇ ਨਾਮ ਦੀ ਰਾਹੀਂ (ਹੀ) ਭਗਤਾਂ ਨੇ (ਜਗਤ ਵਿਚ) ਨਾਮਣਾ ਪਾਇਆ ਹੈ। (ਤਿਆਗੀ ਦਾ) ਜੋਗ (-ਸਾਧਨ) ਤੇ ਗ੍ਰਿਹਸਤੀ ਦਾ ਮਾਇਆ ਦਾ ਭੋਗ ਭਗਤ ਜਨ ਵਾਸਤੇ ਪ੍ਰਭੂ ਦਾ ਨਾਮ (ਹੀ) ਹੈ, ਪ੍ਰਭੂ ਦਾ ਨਾਮ ਜਪਦਿਆਂ (ਉਸ ਨੂੰ) ਕੋਈ ਦੁੱਖ ਕਲੇਸ਼ ਨਹੀਂ ਹੁੰਦਾ। (ਪ੍ਰਭੂ ਦਾ) ਭਗਤ (ਸਦਾ) ਪ੍ਰਭੂ ਦੇ ਨਾਮ ਦੀ ਸੇਵਾ (ਸਿਮਰਨ) ਵਿਚ ਮਸਤ ਰਹਿੰਦਾ ਹੈ; ਹੇ ਨਾਨਕ! (ਭਗਤ ਸਦਾ) ਪ੍ਰਭੂ-ਦੇਵ ਨੂੰ ਪੂਜਦਾ ਹੈ ॥੬॥ ਪ੍ਰਭੂ ਦਾ ਨਾਮ ਭਗਤ ਦੇ ਵਾਸਤੇ ਮਾਲ ਧਨ ਹੈ, ਇਹ ਨਾਮ-ਰੂਪੀ ਧਨ ਪ੍ਰਭੂ ਨੇ ਆਪ ਆਪਣੇ ਭਗਤ ਨੂੰ ਦਿੱਤਾ ਹੈ। ਭਗਤ ਵਾਸਤੇ ਪ੍ਰਭੂ ਦਾ ਨਾਮ (ਹੀ) ਤਕੜਾ ਆਸਰਾ ਹੈ, ਭਗਤਾਂ ਨੇ ਪ੍ਰਭੂ ਦੇ ਪ੍ਰਤਾਪ ਨਾਲ ਕਿਸੇ ਹੋਰ ਆਸਰੇ ਨੂੰ ਨਹੀਂ ਤੱਕਿਆ। ਭਗਤ ਜਨ ਪ੍ਰਭੂ-ਨਾਮ-ਰਸ ਵਿਚ ਪੂਰੇ ਤੌਰ ਤੇ ਭਿੱਜੇ ਰਹਿੰਦੇ ਹਨ, (ਅਤੇ) ਨਾਮ-ਰਸ ਦੇ ਮੱਤੇ ਹੋਏ (ਮਨ ਦਾ ਉਹ) ਟਿਕਾਉ (ਮਾਣਦੇ ਹਨ) ਜਿਥੇ ਕੋਈ ਫੁਰਨਾ ਨਹੀਂ ਹੁੰਦਾ। (ਪ੍ਰਭੂ ਦਾ) ਭਗਤ ਅੱਠੇ ਪਹਰ ਪ੍ਰਭੂ ਨੂੰ ਜਪਦਾ ਹੈ, (ਜਗਤ ਵਿਚ) ਭਗਤ ਉੱਘਾ (ਹੋ ਜਾਂਦਾ ਹੈ) ਲੁਕਿਆ ਨਹੀਂ ਰਹਿੰਦਾ। ਪ੍ਰਭੂ ਦੀ ਭਗਤੀ ਬੇਅੰਤ ਜੀਵਾਂ ਨੂੰ (ਵਿਕਾਰਾਂ ਤੋਂ) ਖ਼ਲਾਸੀ ਦਿਵਾਉਂਦੀ ਹੈ; ਹੇ ਨਾਨਕ! ਭਗਤ ਦੀ ਸੰਗਤਿ ਵਿਚ ਕਈ ਹੋਰ (ਭੀ) ਤਰ ਜਾਂਦੇ ਹਨ ॥੭॥ ਪ੍ਰਭੂ ਦਾ ਇਹ ਨਾਮ (ਹੀ) "ਪਾਰਜਾਤ" ਰੁੱਖ ਹੈ, ਪ੍ਰਭੂ ਦੇ ਗੁਣ ਗਾਉਣੇ (ਹੀ ਇੱਛਾ-ਪੂਰਕ) "ਕਾਮਧੇਨ" ਹੈ। ਪ੍ਰਭੂ ਦੀਆਂ (ਸਿਫ਼ਤ-ਸਾਲਾਹ ਦੀਆਂ) ਗੱਲਾਂ (ਹੋਰ) ਸਭ (ਗੱਲਾਂ) ਤੋਂ ਚੰਗੀਆਂ ਹਨ, (ਕਿਉਂਕਿ ਪ੍ਰਭੂ ਦਾ) ਨਾਮ ਸੁਣਿਆਂ ਸਾਰੇ ਦੁਖ ਦਰਦ ਲਹਿ ਜਾਂਦੇ ਹਨ। (ਪ੍ਰਭੂ ਦੇ) ਨਾਮ ਦੀ ਵਡਿਆਈ ਸੰਤਾਂ ਦੇ ਹਿਰਦੇ ਵਿਚ ਵੱਸਦੀ ਹੈ, (ਅਤੇ) ਸੰਤਾਂ ਦੇ ਪ੍ਰਤਾਪ ਨਾਲ ਸਾਰਾ ਪਾਪ ਦੂਰ ਹੋ ਜਾਂਦਾ ਹੈ। ਵੱਡੇ ਭਾਗਾਂ ਨਾਲ ਸੰਤਾਂ ਦੀ ਸੰਗਤਿ ਮਿਲਦੀ ਹੈ, (ਅਤੇ) ਸੰਤਾਂ ਦੀ ਸੇਵਾ (ਕੀਤਿਆਂ) (ਪ੍ਰਭੂ ਦਾ) ਨਾਮ ਸਿਮਰੀਦਾ ਹੈ। ਪ੍ਰਭੂ-ਨਾਮ ਦੇ ਬਰਾਬਰ ਹੋਰ ਕੋਈ (ਪਦਾਰਥ) ਨਹੀਂ, ਹੇ ਨਾਨਕ! ਗੁਰੂ ਦੇ ਸਨਮੁਖ ਹੋ ਕੇ ਕੋਈ ਵਿਰਲਾ ਮਨੁੱਖ ਨਾਮ (ਦੀ ਦਾਤਿ) ਲੱਭਦਾ ਹੈ ॥੮॥੨॥ ਬਹੁਤ ਸ਼ਾਸਤ੍ਰ ਤੇ ਬਹੁ ਸਿੰਮ੍ਰਿਤੀਆਂ, ਸਾਰੇ (ਅਸਾਂ) ਖੋਜ ਕੇ ਵੇਖੇ ਹਨ; (ਇਹ ਪੁਸਤਕ ਕਈ ਤਰ੍ਹਾਂ ਦੀ ਗਿਆਨ-ਚਰਚਾ ਤੇ ਕਈ ਧਾਰਮਿਕ ਤੇ ਭਾਈਚਾਰਕ ਰਸਮਾਂ ਸਿਖਾਉਂਦੇ ਹਨ) (ਪਰ ਇਹ) ਅਕਾਲ ਪੁਰਖ ਦੇ ਨਾਮ ਦੀ ਬਰਾਬਰੀ ਨਹੀਂ ਕਰ ਸਕਦੇ। ਹੇ ਨਾਨਕ! (ਪ੍ਰਭੂ ਦੇ) ਨਾਮ ਦਾ ਮੁੱਲ ਨਹੀਂ ਪਾਇਆ ਜਾ ਸਕਦਾ ॥੧॥`
      },
      {
        number: 3,
        sanskrit: `ਸਲੋਕੁ ॥
ਬਹੁ ਸਾਸਤ੍ਰ ਬਹੁ ਸਿਮ੍ਰਿਤੀ ਪੇਖੇ ਸਰਬ ਢਢੋਲਿ ॥
ਪੂਜਸਿ ਨਾਹੀ ਹਰਿ ਹਰੇ ਨਾਨਕ ਨਾਮ ਅਮੋਲ ॥੧॥
ਅਸਟਪਦੀ ॥
ਜਾਪ ਤਾਪ ਗਿਆਨ ਸਭਿ ਧਿਆਨ ॥
ਖਟ ਸਾਸਤ੍ਰ ਸਿਮ੍ਰਿਤਿ ਵਖਿਆਨ ॥
ਜੋਗ ਅਭਿਆਸ ਕਰਮ ਧ੍ਰਮ ਕਿਰਿਆ ॥
ਸਗਲ ਤਿਆਗਿ ਬਨ ਮਧੇ ਫਿਰਿਆ ॥
ਅਨਿਕ ਪ੍ਰਕਾਰ ਕੀਏ ਬਹੁ ਜਤਨਾ ॥
ਪੁੰਨ ਦਾਨ ਹੋਮੇ ਬਹੁ ਰਤਨਾ ॥
ਸਰੀਰੁ ਕਟਾਇ ਹੋਮੈ ਕਰਿ ਰਾਤੀ ॥
ਵਰਤ ਨੇਮ ਕਰੈ ਬਹੁ ਭਾਤੀ ॥
ਨਹੀ ਤੁਲਿ ਰਾਮ ਨਾਮ ਬੀਚਾਰ ॥
ਨਾਨਕ ਗੁਰਮੁਖਿ ਨਾਮੁ ਜਪੀਐ ਇਕ ਬਾਰ ॥੧॥
ਨਉ ਖੰਡ ਪ੍ਰਿਥਮੀ ਫਿਰੈ ਚਿਰੁ ਜੀਵੈ ॥
ਮਹਾ ਉਦਾਸੁ ਤਪੀਸਰੁ ਥੀਵੈ ॥
ਅਗਨਿ ਮਾਹਿ ਹੋਮਤ ਪਰਾਨ ॥
ਕਨਿਕ ਅਸ੍ਵ ਹੈਵਰ ਭੂਮਿ ਦਾਨ ॥
ਨਿਉਲੀ ਕਰਮ ਕਰੈ ਬਹੁ ਆਸਨ ॥
ਜੈਨ ਮਾਰਗ ਸੰਜਮ ਅਤਿ ਸਾਧਨ ॥
ਨਿਮਖ ਨਿਮਖ ਕਰਿ ਸਰੀਰੁ ਕਟਾਵੈ ॥
ਤਉ ਭੀ ਹਉਮੈ ਮੈਲੁ ਨ ਜਾਵੈ ॥
ਹਰਿ ਕੇ ਨਾਮ ਸਮਸਰਿ ਕਛੁ ਨਾਹਿ ॥
ਨਾਨਕ ਗੁਰਮੁਖਿ ਨਾਮੁ ਜਪਤ ਗਤਿ ਪਾਹਿ ॥੨॥
ਮਨ ਕਾਮਨਾ ਤੀਰਥ ਦੇਹ ਛੁਟੈ ॥
ਗਰਬੁ ਗੁਮਾਨੁ ਨ ਮਨ ਤੇ ਹੁਟੈ ॥
ਸੋਚ ਕਰੈ ਦਿਨਸੁ ਅਰੁ ਰਾਤਿ ॥
ਮਨ ਕੀ ਮੈਲੁ ਨ ਤਨ ਤੇ ਜਾਤਿ ॥
ਇਸੁ ਦੇਹੀ ਕਉ ਬਹੁ ਸਾਧਨਾ ਕਰੈ ॥
ਮਨ ਤੇ ਕਬਹੂ ਨ ਬਿਖਿਆ ਟਰੈ ॥
ਜਲਿ ਧੋਵੈ ਬਹੁ ਦੇਹ ਅਨੀਤਿ ॥
ਸੁਧ ਕਹਾ ਹੋਇ ਕਾਚੀ ਭੀਤਿ ॥
ਮਨ ਹਰਿ ਕੇ ਨਾਮ ਕੀ ਮਹਿਮਾ ਊਚ ॥
ਨਾਨਕ ਨਾਮਿ ਉਧਰੇ ਪਤਿਤ ਬਹੁ ਮੂਚ ॥੩॥
ਬਹੁਤੁ ਸਿਆਣਪ ਜਮ ਕਾ ਭਉ ਬਿਆਪੈ ॥
ਅਨਿਕ ਜਤਨ ਕਰਿ ਤ੍ਰਿਸਨ ਨਾ ਧ੍ਰਾਪੈ ॥
ਭੇਖ ਅਨੇਕ ਅਗਨਿ ਨਹੀ ਬੁਝੈ ॥
ਕੋਟਿ ਉਪਾਵ ਦਰਗਹ ਨਹੀ ਸਿਝੈ ॥
ਛੂਟਸਿ ਨਾਹੀ ਊਭ ਪਇਆਲਿ ॥
ਮੋਹਿ ਬਿਆਪਹਿ ਮਾਇਆ ਜਾਲਿ ॥
ਅਵਰ ਕਰਤੂਤਿ ਸਗਲੀ ਜਮੁ ਡਾਨੈ ॥
ਗੋਵਿੰਦ ਭਜਨ ਬਿਨੁ ਤਿਲੁ ਨਹੀ ਮਾਨੈ ॥
ਹਰਿ ਕਾ ਨਾਮੁ ਜਪਤ ਦੁਖੁ ਜਾਇ ॥
ਨਾਨਕ ਬੋਲੈ ਸਹਜਿ ਸੁਭਾਇ ॥੪॥
ਚਾਰਿ ਪਦਾਰਥ ਜੇ ਕੋ ਮਾਗੈ ॥
ਸਾਧ ਜਨਾ ਕੀ ਸੇਵਾ ਲਾਗੈ ॥
ਜੇ ਕੋ ਆਪੁਨਾ ਦੂਖੁ ਮਿਟਾਵੈ ॥
ਹਰਿ ਹਰਿ ਨਾਮੁ ਰਿਦੈ ਸਦ ਗਾਵੈ ॥
ਜੇ ਕੋ ਅਪੁਨੀ ਸੋਭਾ ਲੋਰੈ ॥
ਸਾਧਸੰਗਿ ਇਹ ਹਉਮੈ ਛੋਰੈ ॥
ਜੇ ਕੋ ਜਨਮ ਮਰਣ ਤੇ ਡਰੈ ॥
ਸਾਧ ਜਨਾ ਕੀ ਸਰਨੀ ਪਰੈ ॥
ਜਿਸੁ ਜਨ ਕਉ ਪ੍ਰਭ ਦਰਸ ਪਿਆਸਾ ॥
ਨਾਨਕ ਤਾ ਕੈ ਬਲਿ ਬਲਿ ਜਾਸਾ ॥੫॥
ਸਗਲ ਪੁਰਖ ਮਹਿ ਪੁਰਖੁ ਪ੍ਰਧਾਨੁ ॥
ਸਾਧਸੰਗਿ ਜਾ ਕਾ ਮਿਟੈ ਅਭਿਮਾਨੁ ॥
ਆਪਸ ਕਉ ਜੋ ਜਾਣੈ ਨੀਚਾ ॥
ਸੋਊ ਗਨੀਐ ਸਭ ਤੇ ਊਚਾ ॥
ਜਾ ਕਾ ਮਨੁ ਹੋਇ ਸਗਲ ਕੀ ਰੀਨਾ ॥
ਹਰਿ ਹਰਿ ਨਾਮੁ ਤਿਨਿ ਘਟਿ ਘਟਿ ਚੀਨਾ ॥
ਮਨ ਅਪੁਨੇ ਤੇ ਬੁਰਾ ਮਿਟਾਨਾ ॥
ਪੇਖੈ ਸਗਲ ਸ੍ਰਿਸਟਿ ਸਾਜਨਾ ॥
ਸੂਖ ਦੂਖ ਜਨ ਸਮ ਦ੍ਰਿਸਟੇਤਾ ॥
ਨਾਨਕ ਪਾਪ ਪੁੰਨ ਨਹੀ ਲੇਪਾ ॥੬॥
ਨਿਰਧਨ ਕਉ ਧਨੁ ਤੇਰੋ ਨਾਉ ॥
ਨਿਥਾਵੇ ਕਉ ਨਾਉ ਤੇਰਾ ਥਾਉ ॥
ਨਿਮਾਨੇ ਕਉ ਪ੍ਰਭ ਤੇਰੋ ਮਾਨੁ ॥
ਸਗਲ ਘਟਾ ਕਉ ਦੇਵਹੁ ਦਾਨੁ ॥
ਕਰਨ ਕਰਾਵਨਹਾਰ ਸੁਆਮੀ ॥
ਸਗਲ ਘਟਾ ਕੇ ਅੰਤਰਜਾਮੀ ॥
ਅਪਨੀ ਗਤਿ ਮਿਤਿ ਜਾਨਹੁ ਆਪੇ ॥
ਆਪਨ ਸੰਗਿ ਆਪਿ ਪ੍ਰਭ ਰਾਤੇ ॥
ਤੁਮੑਰੀ ਉਸਤਤਿ ਤੁਮ ਤੇ ਹੋਇ ॥
ਨਾਨਕ ਅਵਰੁ ਨ ਜਾਨਸਿ ਕੋਇ ॥੭॥
ਸਰਬ ਧਰਮ ਮਹਿ ਸ੍ਰੇਸਟ ਧਰਮੁ ॥
ਹਰਿ ਕੋ ਨਾਮੁ ਜਪਿ ਨਿਰਮਲ ਕਰਮੁ ॥
ਸਗਲ ਕ੍ਰਿਆ ਮਹਿ ਊਤਮ ਕਿਰਿਆ ॥
ਸਾਧਸੰਗਿ ਦੁਰਮਤਿ ਮਲੁ ਹਿਰਿਆ ॥
ਸਗਲ ਉਦਮ ਮਹਿ ਉਦਮੁ ਭਲਾ ॥
ਹਰਿ ਕਾ ਨਾਮੁ ਜਪਹੁ ਜੀਅ ਸਦਾ ॥
ਸਗਲ ਬਾਨੀ ਮਹਿ ਅੰਮ੍ਰਿਤ ਬਾਨੀ ॥
ਹਰਿ ਕੋ ਜਸੁ ਸੁਨਿ ਰਸਨ ਬਖਾਨੀ ॥
ਸਗਲ ਥਾਨ ਤੇ ਓਹੁ ਊਤਮ ਥਾਨੁ ॥
ਨਾਨਕ ਜਿਹ ਘਟਿ ਵਸੈ ਹਰਿ ਨਾਮੁ ॥੮॥੩॥
ਸਲੋਕੁ ॥
ਨਿਰਗੁਨੀਆਰ ਇਆਨਿਆ ਸੋ ਪ੍ਰਭੁ ਸਦਾ ਸਮਾਲਿ ॥
ਜਿਨਿ ਕੀਆ ਤਿਸੁ ਚੀਤਿ ਰਖੁ ਨਾਨਕ ਨਿਬਹੀ ਨਾਲਿ ॥੧॥`,
        transliteration: `salok |
bahu saasatr bahu simritee pekhe sarab dtadtol |
poojas naahee har hare naanak naam amol |1|
asattapadee |
jaap taap giaan sabh dhiaan |
khatt saasatr simrit vakhiaan |
jog abhiaas karam dhram kiriaa |
sagal tiaag ban madhe firiaa |
anik prakaar kee bahu jatanaa |
pun daan home bahu ratanaa |
sareer kattaae homai kar raatee |
varat nem karai bahu bhaatee |
nahee tul raam naam beechaar |
naanak guramukh naam japeeai ik baar |1|
nau khandd prithamee firai chir jeevai |
mahaa udaas tapeesar theevai |
agan maeh homat paraan |
kanik asv haivar bhoom daan |
niaulee karam karai bahu aasan |
jain maarag sanjam at saadhan |
nimakh nimakh kar sareer kattaavai |
tau bhee haumai mail na jaavai |
har ke naam samasar kachh naeh |
naanak guramukh naam japat gat paeh |2|
man kaamanaa teerath deh chhuttai |
garab gumaan na man te huttai |
soch karai dinas ar raat |
man kee mail na tan te jaat |
eis dehee kau bahu saadhanaa karai |
man te kabahoo na bikhiaa ttarai |
jal dhovai bahu deh aneet |
sudh kahaa hoe kaachee bheet |
man har ke naam kee mahimaa aooch |
naanak naam udhare patit bahu mooch |3|
bahut siaanap jam kaa bhau biaapai |
anik jatan kar trisan naa dhraapai |
bhekh anek agan nahee bujhai |
kott upaav daragah nahee sijhai |
chhoottas naahee aoobh peaal |
mohi biaapeh maaeaa jaal |
avar karatoot sagalee jam ddaanai |
govind bhajan bin til nahee maanai |
har kaa naam japat dukh jaae |
naanak bolai sehaj subhaae |4|
chaar padaarath je ko maagai |
saadh janaa kee sevaa laagai |
je ko aapunaa dookh mittaavai |
har har naam ridai sad gaavai |
je ko apunee sobhaa lorai |
saadhasang ih haumai chhorai |
je ko janam maran te ddarai |
saadh janaa kee saranee parai |
jis jan kau prabh daras piaasaa |
naanak taa kai bal bal jaasaa |5|
sagal purakh meh purakh pradhaan |
saadhasang jaa kaa mittai abhimaan |
aapas kau jo jaanai neechaa |
soaoo ganeeai sabh te aoochaa |
jaa kaa man hoe sagal kee reenaa |
har har naam tin ghatt ghatt cheenaa |
man apune te buraa mittaanaa |
pekhai sagal srisatt saajanaa |
sookh dookh jan sam drisattetaa |
naanak paap pun nahee lepaa |6|
niradhan kau dhan tero naau |
nithaave kau naau teraa thaau |
nimaane kau prabh tero maan |
sagal ghattaa kau devahu daan |
karan karaavanahaar suaamee |
sagal ghattaa ke antarajaamee |
apanee gat mit jaanahu aape |
aapan sang aap prabh raate |
tumaree usatat tum te hoe |
naanak avar na jaanas koe |7|
sarab dharam meh sresatt dharam |
har ko naam jap niramal karam |
sagal kriaa meh aootam kiriaa |
saadhasang duramat mal hiriaa |
sagal udam meh udam bhalaa |
har kaa naam japahu jeea sadaa |
sagal baanee meh amrit baanee |
har ko jas sun rasan bakhaanee |
sagal thaan te ohu aootam thaan |
naanak jih ghatt vasai har naam |8|3|
salok |
niraguneeaar eaaniaa so prabh sadaa samaal |
jin keea tis cheet rakh naanak nibahee naal |1|`,
        meaning: `Salok: The many Shaastras and the many Simritees - I have seen and searched through them all. They are not equal to Har, Haray - O Nanak, the Lord's Invaluable Name. ||1|| Ashtapadee: Chanting, intense meditation, spiritual wisdom and all meditations; the six schools of philosophy and sermons on the scriptures; the practice of Yoga and righteous conduct; the renunciation of everything and wandering around in the wilderness; the performance of all sorts of works; donations to charities and offerings of jewels to fire; cutting the body apart and making the pieces into ceremonial fire offerings; keeping fasts and making vows of all sorts - none of these are equal to the contemplation of the Name of the Lord, O Nanak, if, as Gurmukh, one chants the Naam, even once. ||1|| You may roam over the nine continents of the world and live a very long life; you may become a great ascetic and a master of disciplined meditation and burn yourself in fire; you may give away gold, horses, elephants and land; you may practice techniques of inner cleansing and all sorts of Yogic postures; you may adopt the self-mortifying ways of the Jains and great spiritual disciplines; piece by piece, you may cut your body apart; but even so, the filth of your ego shall not depart. There is nothing equal to the Name of the Lord. O Nanak, as Gurmukh, chant the Naam, and obtain salvation. ||2|| With your mind filled with desire, you may give up your body at a sacred shrine of pilgrimage; but even so, egotistical pride shall not be removed from your mind. You may practice cleansing day and night, but the filth of your mind shall not leave your body. You may subject your body to all sorts of disciplines, but your mind will never be rid of its corruption. You may wash this transitory body with loads of water, but how can a wall of mud be washed clean? O my mind, the Glorious Praise of the Name of the Lord is the highest; O Nanak, the Naam has saved so many of the worst sinners. ||3|| Even with great cleverness, the fear of death clings to you. You try all sorts of things, but your thirst is still not satisfied. Wearing various religious robes, the fire is not extinguished. Even making millions of efforts, you shall not be accepted in the Court of the Lord. You cannot escape to the heavens, or to the nether regions, if you are entangled in emotional attachment and the net of Maya. All other efforts are punished by the Messenger of Death, which accepts nothing at all, except meditation on the Lord of the Universe. Chanting the Name of the Lord, sorrow is dispelled. O Nanak, chant it with intuitive ease. ||4|| One who prays for the four cardinal blessings should commit himself to the service of the Saints. If you wish to erase your sorrows, sing the Name of the Lord, Har, Har, within your heart. If you long for honor for yourself, then renounce your ego in the Saadh Sangat, the Company of the Holy. If you fear the cycle of birth and death, then seek the Sanctuary of the Holy. Those who thirst for the Blessed Vision of God's Darshan - Nanak is a sacrifice, a sacrifice to them. ||5|| Among all persons, the supreme person is the one who gives up his egotistical pride in the Company of the Holy. One who sees himself as lowly, shall be accounted as the highest of all. One whose mind is the dust of all, recognizes the Name of the Lord, Har, Har, in each and every heart. One who eradicates cruelty from within his own mind, looks upon all the world as his friend. One who looks upon pleasure and pain as one and the same, O Nanak, is not affected by sin or virtue. ||6|| To the poor, Your Name is wealth. To the homeless, Your Name is home. To the dishonored, You, O God, are honor. To all, You are the Giver of gifts. O Creator Lord, Cause of causes, O Lord and Master, Inner-knower, Searcher of all hearts: You alone know Your own condition and state. You Yourself, God, are imbued with Yourself. You alone can celebrate Your Praises. O Nanak, no one else knows. ||7|| Of all religions, the best religion is to chant the Name of the Lord and maintain pure conduct. Of all religious rituals, the most sublime ritual is to erase the filth of the dirty mind in the Company of the Holy. Of all efforts, the best effort is to chant the Name of the Lord in the heart, forever. Of all speech, the most ambrosial speech is to hear the Lord's Praise and chant it with the tongue. Of all places, the most sublime place, O Nanak, is that heart in which the Name of the Lord abides. ||8||3|| Salok: You worthless, ignorant fool - dwell upon God forever. Cherish in your consciousness the One who created you; O Nanak, He alone shall go along with you. ||1||`,
        meaning_pa: `ਬਹੁਤ ਸ਼ਾਸਤ੍ਰ ਤੇ ਬਹੁ ਸਿੰਮ੍ਰਿਤੀਆਂ, ਸਾਰੇ (ਅਸਾਂ) ਖੋਜ ਕੇ ਵੇਖੇ ਹਨ; (ਇਹ ਪੁਸਤਕ ਕਈ ਤਰ੍ਹਾਂ ਦੀ ਗਿਆਨ-ਚਰਚਾ ਤੇ ਕਈ ਧਾਰਮਿਕ ਤੇ ਭਾਈਚਾਰਕ ਰਸਮਾਂ ਸਿਖਾਉਂਦੇ ਹਨ) (ਪਰ ਇਹ) ਅਕਾਲ ਪੁਰਖ ਦੇ ਨਾਮ ਦੀ ਬਰਾਬਰੀ ਨਹੀਂ ਕਰ ਸਕਦੇ। ਹੇ ਨਾਨਕ! (ਪ੍ਰਭੂ ਦੇ) ਨਾਮ ਦਾ ਮੁੱਲ ਨਹੀਂ ਪਾਇਆ ਜਾ ਸਕਦਾ ॥੧॥ (ਜੇ ਕੋਈ) (ਵੇਦ-ਮੰਤ੍ਰਾਂ ਦੇ) ਜਾਪ ਕਰੇ, (ਸਰੀਰ ਨੂੰ ਧੂਣੀਆਂ ਨਾਲ) ਤਪਾਏ, (ਹੋਰ) ਕਈ ਗਿਆਨ (ਦੀਆਂ ਗੱਲਾਂ ਕਰੇ) ਤੇ (ਦੇਵਤਿਆਂ ਦੇ) ਧਿਆਨ ਧਰੇ, ਛੇ ਸ਼ਾਸਤ੍ਰਾਂ ਤੇ ਸਿਮ੍ਰਿਤੀਆਂ ਦਾ ਉਪਦੇਸ਼ ਕਰੇ; ਜੋਗ ਦੇ ਸਾਧਨ ਕਰੇ, ਕਰਮ ਕਾਂਡੀ ਧਰਮ ਦੀ ਕ੍ਰਿਆ ਕਰੇ, (ਜਾਂ) ਸਾਰੇ (ਕੰਮ) ਛੱਡ ਕੇ ਜੰਗਲਾਂ ਵਿਚ ਭਉਂਦਾ ਫਿਰੇ; ਅਨੇਕਾਂ ਕਿਸਮਾਂ ਦੇ ਬੜੇ ਜਤਨ ਕਰੇ, ਪੁੰਨਦਾਨ ਕਰੇ ਤੇ ਬਹੁਤ ਸਾਰਾ ਘਿਉ ਹਵਨ ਕਰੇ, ਆਪਣੇ ਸਰੀਰ ਨੂੰ ਰਤੀ ਰਤੀ ਕਰ ਕੇ ਕਟਾਵੇ ਤੇ ਅੱਗ ਵਿਚ ਸਾੜ ਦੇਵੇ, ਕਈ ਕਿਸਮਾਂ ਦੇ ਵਰਤਾਂ ਦੇ ਬੰਧੇਜ ਕਰੇ; (ਪਰ ਇਹ ਸਾਰੇ ਹੀ) ਪ੍ਰਭੂ ਦੇ ਨਾਮ ਦੀ ਵਿਚਾਰ ਦੇ ਬਰਾਬਰ ਨਹੀਂ ਹਨ, (ਭਾਵੇਂ) ਹੇ ਨਾਨਕ! ਇਹ ਨਾਮ ਇਕ ਵਾਰੀ (ਭੀ) ਗੁਰੂ ਦੇ ਸਨਮੁਖ ਹੋ ਕੇ ਜਪਿਆ ਜਾਏ ॥੧॥ (ਜੇ ਕੋਈ ਮਨੁੱਖ) ਸਾਰੀ ਧਰਤੀ ਤੇ ਫਿਰੇ, ਲੰਮੀ ਉਮਰ ਤਕ ਜੀਊਂਦਾ ਰਹੇ, (ਜਗਤ ਵਲੋਂ) ਬਹੁਤ ਉਪਰਾਮ ਹੋ ਕੇ ਵੱਡਾ ਤਪੀ ਬਣ ਜਾਏ; ਅੱਗ ਵਿਚ (ਆਪਣੀ) ਜਿੰਦ ਹਵਨ ਕਰ ਦੇਵੇ; ਸੋਨਾ, ਘੋੜੇ, ਵਧੀਆ ਘੋੜੇ ਤੇ ਜ਼ਿਮੀਂ ਦਾਨ ਕਰੇ; ਨਿਉਲੀ ਕਰਮ ਤੇ ਹੋਰ ਬਹੁਤ ਸਾਰੇ (ਯੋਗ) ਆਸਨ ਕਰੇ, ਜੈਨੀਆਂ ਦੇ ਰਸਤੇ (ਚੱਲ ਕੇ) ਬੜੇ ਕਠਿਨ ਸਾਧਨ ਤੇ ਸੰਜਮ ਕਰੇ; ਸਰੀਰ ਨੂੰ ਰਤਾ ਰਤਾ ਕਰ ਕੇ ਕਟਾ ਦੇਵੇ, ਤਾਂ ਭੀ (ਮਨ ਦੀ) ਹਉਮੈ ਦੀ ਮੈਲ ਦੂਰ ਨਹੀਂ ਹੁੰਦੀ। (ਅਜੇਹਾ) ਕੋਈ (ਉੱਦਮ) ਪ੍ਰਭੂ ਦੇ ਨਾਮ ਦੇ ਬਰਾਬਰ ਨਹੀਂ ਹੈ; ਹੇ ਨਾਨਕ! ਜੋ ਮਨੁੱਖ ਗੁਰੂ ਦੇ ਸਨਮੁਖ ਹੋ ਕੇ ਨਾਮ ਜਪਦੇ ਹਨ ਉਹ ਉੱਚੀ ਆਤਮਕ ਅਵਸਥਾ ਹਾਸਲ ਕਰਦੇ ਹਨ ॥੨॥ (ਕਈ ਪ੍ਰਾਣੀਆਂ ਦੇ) ਮਨ ਦੀ ਇੱਛਾ (ਹੁੰਦੀ ਹੈ ਕਿ) ਤੀਰਥਾਂ ਤੇ (ਜਾ ਕੇ) ਸਰੀਰਕ ਚੋਲਾ ਛੱਡਿਆ ਜਾਏ, (ਪਰ ਇਸ ਤਰ੍ਹਾਂ ਭੀ) ਹਉਮੈ ਅਹੰਕਾਰ ਮਨ ਵਿਚੋਂ ਘਟਦਾ ਨਹੀਂ। (ਮਨੁੱਖ) ਦਿਨ ਤੇ ਰਾਤ (ਭਾਵ, ਸਦਾ) (ਤੀਰਥਾਂ ਤੇ) ਇਸ਼ਨਾਨ ਕਰੇ, (ਫੇਰ ਭੀ) ਮਨ ਦੀ ਮੈਲ ਸਰੀਰ ਧੋਤਿਆਂ ਨਹੀਂ ਜਾਂਦੀ। (ਜੇ) ਇਸ ਸਰੀਰ ਨੂੰ (ਸਾਧਨ ਦੀ ਖ਼ਾਤਰ) ਕਈ ਜਤਨ ਭੀ ਕਰੇ, (ਤਾਂ ਭੀ) ਕਦੇ ਮਨ ਤੋਂ ਮਾਇਆ (ਦਾ ਪ੍ਰਭਾਵ) ਨਹੀਂ ਟਲਦਾ। (ਜੇ) ਇਸ ਨਾਸਵੰਤ ਸਰੀਰ ਨੂੰ ਕਈ ਵਾਰ ਪਾਣੀ ਨਾਲ ਭੀ ਧੋਵੇ, (ਤਾਂ ਭੀ ਇਹ ਸਰੀਰ ਰੂਪੀ) ਕੱਚੀ ਕੰਧ ਕਿਥੇ ਪਵਿਤ੍ਰ ਹੋ ਸਕਦੀ ਹੈ? ਹੇ ਮਨ! ਪ੍ਰਭੂ ਦੇ ਨਾਮ ਦੀ ਵਡਿਆਈ ਬਹੁਤ ਵੱਡੀ ਹੈ। ਹੇ ਨਾਨਕ! ਨਾਮ ਦੀ ਬਰਕਤਿ ਨਾਲ ਅਣਗਿਣਤ ਮੰਦ-ਕਰਮੀ ਜੀਵ (ਵਿਕਾਰਾਂ ਤੋਂ) ਬਚ ਜਾਂਦੇ ਹਨ ॥੩॥ (ਜੀਵ ਦੀ) ਬਹੁਤੀ ਚਤੁਰਾਈ (ਦੇ ਕਾਰਣ) ਜਮਾਂ ਦਾ ਡਰ (ਜੀਵ ਨੂੰ) ਆ ਦਬਾਂਦਾ ਹੈ, (ਕਿਉਂਕਿ ਚਤੁਰਾਈ ਦੇ) ਅਨੇਕਾਂ ਜਤਨ ਕੀਤਿਆਂ (ਮਾਇਆ ਦੀ) ਤ੍ਰਿਹ ਨਹੀਂ ਮੁੱਕਦੀ। ਅਨੇਕਾਂ (ਧਾਰਮਿਕ) ਭੇਖ ਕੀਤਿਆਂ (ਤ੍ਰਿਸ਼ਨਾ ਦੀ) ਅੱਗ ਨਹੀਂ ਬੁੱਝਦੀ, (ਇਹੋ ਜਿਹੇ) ਕ੍ਰੋੜਾਂ ਤਰੀਕੇ (ਵਰਤਿਆਂ ਭੀ ਪ੍ਰਭੂ ਦੀ) ਦਰਗਾਹ ਵਿਚ ਸੁਰਖ਼ਰੂ ਨਹੀਂ ਹੋਈਦਾ। (ਇਹਨਾਂ ਜਤਨਾਂ ਨਾਲ) ਜੀਵ ਚਾਹੇ ਅਕਾਸ਼ ਤੇ ਚੜ੍ਹ ਜਾਏ, ਚਾਹੇ ਪਤਾਲ ਵਿਚ ਲੁਕ ਜਾਏ, (ਮਾਇਆ ਤੋਂ) ਬਚ ਨਹੀਂ ਸਕਦਾ, (ਸਗੋਂ) ਜੀਵ ਮਾਇਆ ਦੇ ਜਾਲ ਵਿਚ ਤੇ ਮੋਹ ਵਿਚ ਫਸਦੇ ਹਨ। (ਨਾਮ ਤੋਂ ਬਿਨਾ) ਹੋਰ ਸਾਰੀਆਂ ਕਰਤੂਤਾਂ ਨੂੰ ਜਮਰਾਜ ਡੰਨ ਲਾਂਦਾ ਹੈ, ਪ੍ਰਭੂ ਦੇ ਭਜਨ ਤੋਂ ਬਿਨਾਂ ਰਤਾ ਭੀ ਨਹੀਂ ਪਤੀਜਦਾ। (ਜੋ ਮਨੁੱਖ) ਹਰਿ-ਨਾਮ ਉਚਾਰਦਾ ਹੈ ਉਸ ਦਾ ਦੁੱਖ (ਪ੍ਰਭੂ ਦਾ ਨਾਮ ਜਪਦਿਆਂ) ਦੂਰ ਹੋ ਜਾਂਦਾ ਹੈ) ਹੇ ਨਾਨਕ! (ਜਦੋਂ ਉਹ) ਆਤਮਕ ਅਡੋਲਤਾ ਵਿਚ ਟਿਕ ਕੇ ਪ੍ਰੇਮ ਨਾਲ (ਹਰਿ-ਨਾਮ) ਉਚਾਰਦਾ ਹੈ ॥੪॥ ਜੇ ਕੋਈ ਮਨੁੱਖ (ਧਰਮ, ਅਰਥ, ਕਾਮ, ਮੋਖ) ਚਾਰ ਪਦਾਰਥਾਂ ਦਾ ਲੋੜਵੰਦ ਹੋਵੇ, (ਤਾਂ ਉਸ ਨੂੰ ਚਾਹੀਦਾ ਹੈ ਕਿ) ਗੁਰਮੁਖਾਂ ਦੀ ਸੇਵਾ ਵਿਚ ਲੱਗੇ। ਜੇ ਕੋਈ ਮਨੁੱਖ ਆਪਣਾ ਦੁੱਖ ਮਿਟਾਣਾ ਚਾਹੇ, ਤਾਂ ਪ੍ਰਭੂ ਦਾ ਨਾਮ ਸਦਾ ਹਿਰਦੇ ਵਿਚ ਸਿਮਰੇ। ਜੇ ਕੋਈ ਮਨੁੱਖ ਆਪਣੀ ਸੋਭਾ ਚਾਹੁੰਦਾ ਹੋਵੇ ਹੈ, ਤਾਂ ਸਤਸੰਗ ਵਿਚ (ਰਹਿ ਕੇ) ਇਸ ਹਉਮੈ ਦਾ ਤਿਆਗ ਕਰੇ। ਜੇ ਕੋਈ ਮਨੁੱਖ ਜਨਮ ਮਰਨ (ਦੇ ਗੇੜ) ਤੋਂ ਡਰਦਾ ਹੋਵੇ, ਤਾਂ ਉਹ ਸੰਤਾਂ ਦੀ ਚਰਨੀਂ ਲੱਗੇ। ਜਿਸ ਮਨੁੱਖ ਨੂੰ ਪ੍ਰਭੂ ਦੇ ਦੀਦਾਰ ਦੀ ਤਾਂਘ ਹੈ, ਹੇ ਨਾਨਕ! (ਆਖ ਕਿ) ਮੈਂ ਉਸ ਤੋਂ ਸਦਾ ਸਦਕੇ ਜਾਵਾਂ ॥੫॥ (ਉਹ) ਮਨੁੱਖ ਸਾਰੇ ਮਨੁੱਖਾਂ ਵਿਚੋਂ ਵੱਡਾ ਹੈ, ਸਤ ਸੰਗ ਵਿਚ (ਰਹਿ ਕੇ) ਜਿਸ ਮਨੁੱਖ ਦਾ ਅਹੰਕਾਰ ਮਿਟ ਜਾਂਦਾ ਹੈ। ਜੋ ਮਨੁੱਖ ਆਪਣੇ ਆਪ ਨੂੰ (ਸਾਰਿਆਂ ਨਾਲੋਂ) ਮੰਦ-ਕਰਮੀ ਖ਼ਿਆਲ ਕਰਦਾ ਹੈ, ਉਸ ਨੂੰ ਸਾਰਿਆਂ ਨਾਲੋਂ ਚੰਗਾ ਸਮਝਣਾ ਚਾਹੀਦਾ ਹੈ। ਜਿਸ ਮਨੁੱਖ ਦਾ ਮਨ ਸਭਨਾਂ ਦੇ ਚਰਨਾਂ ਦੀ ਧੂੜ ਹੁੰਦਾ ਹੈ (ਭਾਵ, ਜੋ ਸਭ ਨਾਲ ਗਰੀਬੀ-ਸੁਭਾਉ ਵਰਤਦਾ ਹੈ) ਉਸ ਮਨੁੱਖ ਨੇ ਹਰੇਕ ਸਰੀਰ ਵਿਚ ਪ੍ਰਭੂ ਦੀ ਸੱਤਾ ਪਛਾਣ ਲਈ ਹੈ। ਜਿਸ ਨੇ ਆਪਣੇ ਮਨ ਵਿਚੋਂ ਬੁਰਾਈ ਮਿਟਾ ਦਿੱਤੀ ਹੈ, ਉਹ ਸਾਰੀ ਸ੍ਰਿਸ਼ਟੀ (ਦੇ ਜੀਵਾਂ ਨੂੰ ਆਪਣਾ) ਮਿਤ੍ਰ ਵੇਖਦਾ ਹੈ। (ਇਹੋ ਜਿਹੇ) ਮਨੁੱਖ ਸੁਖਾਂ ਤੇ ਦੁਖਾਂ ਨੂੰ ਇਕੋ ਜਿਹਾ ਸਮਝਦੇ ਹਨ, ਹੇ ਨਾਨਕ! (ਤਾਹੀਏਂ) ਪਾਪ ਤੇ ਪੁੰਨ ਦਾ ਉਹਨਾਂ ਉਤੇ ਅਸਰ ਨਹੀਂ ਹੁੰਦਾ (ਭਾਵ, ਨਾਹ ਕੋਈ ਮੰਦਾ ਕਰਮ ਉਹਨਾਂ ਦੇ ਮਨ ਨੂੰ ਫਸਾ ਸਕਦਾ ਹੈ, ਤੇ ਨਾਹ ਹੀ ਸੁਰਗ ਆਦਿਕ ਦਾ ਲਾਲਚ ਕਰ ਕੇ ਜਾਂ ਦੁੱਖ ਕਲੇਸ਼ ਤੋਂ ਡਰ ਕੇ ਉਹ ਪੁੰਨ ਕਰਮ ਕਰਦੇ ਹਨ, ਉਹਨਾਂ ਦਾ ਸੁਭਾਵ ਹੀ ਨੇਕੀ ਕਰਨਾ ਬਣ ਜਾਂਦਾ ਹੈ) ॥੬॥ (ਹੇ ਪ੍ਰਭੂ) ਕੰਗਾਲ ਵਾਸਤੇ ਤੇਰਾ ਨਾਮ ਹੀ ਧਨ ਹੈ, ਨਿਆਸਰੇ ਨੂੰ ਤੇਰਾ ਆਸਰਾ ਹੈ। ਨਿਮਾਣੇ ਵਾਸਤੇ ਤੇਰਾ (ਨਾਮ), ਹੇ ਪ੍ਰਭੂ! ਆਦਰ ਮਾਣ ਹੈ, ਤੂੰ ਸਾਰੇ ਜੀਵਾਂ ਨੂੰ ਦਾਤਾਂ ਦੇਂਦਾ ਹੈਂ। ਤੂੰ ਆਪ ਹੀ ਸਭ ਕੁਝ ਕਰਦਾ ਹੈਂ, ਤੇ, ਆਪ ਹੀ ਕਰਾਉਂਦਾ ਹੈਂ। ਹੇ ਸੁਆਮੀ! ਹੇ ਸਾਰੇ ਪ੍ਰਾਣੀਆਂ ਦੇ ਦਿਲ ਦੀ ਜਾਣਨ ਵਾਲੇ! ਹੇ ਪ੍ਰਭੂ! ਤੂੰ ਆਪਣੀ ਹਾਲਤ ਤੇ ਆਪਣੀ (ਵਡਿਆਈ ਦੀ) ਮਰਯਾਦਾ ਆਪ ਹੀ ਜਾਣਦਾ ਹੈਂ; ਤੂੰ ਆਪਣੇ ਆਪ ਵਿਚ ਆਪ ਹੀ ਮਗਨ ਹੈਂ। (ਹੇ ਪ੍ਰਭੂ!) ਤੇਰੀ ਵਡਿਆਈ ਤੈਥੋਂ ਹੀ (ਬਿਆਨ) ਹੋ ਸਕਦੀ ਹੈ, ਹੇ ਨਾਨਕ! (ਆਖ, ਕਿ) ਕੋਈ ਹੋਰ ਤੇਰੀ ਵਡਿਆਈ ਨਹੀਂ ਜਾਣਦਾ ॥੭॥ (ਹੇ ਮਨ!) ਇਹ ਧਰਮ ਸਾਰੇ ਧਰਮਾਂ ਨਾਲੋਂ ਚੰਗਾ ਹੈ- ਪ੍ਰਭੂ ਦਾ ਨਾਮ ਜਪ (ਤੇ) ਪਵਿਤ੍ਰ ਆਚਰਣ (ਬਣਾ)। ਇਹ ਕੰਮ ਹੋਰ ਸਾਰੀਆਂ ਧਾਰਮਿਕ ਰਸਮਾਂ ਨਾਲੋਂ ਉੱਤਮ ਹੈ- ਸਤਸੰਗ ਵਿਚ (ਰਹਿ ਕੇ) ਭੈੜੀ ਮਤਿ (ਰੂਪ) ਮੈਲ ਦੂਰ ਕੀਤੀ ਜਾਏ। ਇਹ ਉੱਦਮ (ਹੋਰ) ਸਾਰੇ ਉੱਦਮਾਂ ਨਾਲੋਂ ਭਲਾ ਹੈ- ਹੇ ਮਨ! ਸਦਾ ਪ੍ਰਭੂ ਦਾ ਨਾਮ ਜਪ। (ਪ੍ਰਭੂ ਦੇ ਜਸ ਦੀ) ਆਤਮਕ ਜੀਵਨ ਦੇਣ ਵਾਲੀ ਬਾਣੀ ਹੋਰ ਸਭ ਬਾਣੀਆਂ ਨਾਲੋਂ ਸੁੰਦਰ ਹੈ- ਪ੍ਰਭੂ ਦਾ ਜਸ (ਕੰਨਾਂ ਨਾਲ) ਸੁਣ (ਤੇ) ਜੀਭ ਨਾਲ ਬੋਲ। ਉਹ (ਹਿਰਦਾ-ਰੂਪ) ਥਾਂ ਹੋਰ ਸਾਰੇ (ਤੀਰਥ) ਅਸਥਾਨਾਂ ਤੋਂ ਪਵਿਤ੍ਰ ਹੈ- ਹੇ ਨਾਨਕ! ਜਿਸ ਹਿਰਦੇ ਵਿਚ ਪ੍ਰਭੂ ਦਾ ਨਾਮ ਵੱਸਦਾ ਹੈ ॥੮॥੩॥ ਹੇ ਅੰਞਾਣ! ਹੇ ਗੁਣ-ਹੀਨ (ਮਨੁੱਖ)! ਉਸ ਮਾਲਕ ਨੂੰ ਸਦਾ ਯਾਦ ਕਰ। ਹੇ ਨਾਨਕ! ਜਿਸ ਨੇ ਤੈਨੂੰ ਪੈਦਾ ਕੀਤਾ ਹੈ, ਉਸ ਨੂੰ ਚਿੱਤ ਵਿਚ (ਪ੍ਰੋ) ਰੱਖ, ਉਹੀ (ਤੇਰੇ) ਨਾਲ ਸਾਥ ਨਿਬਾਹੇਗਾ ॥੧॥`
      },
      {
        number: 4,
        sanskrit: `ਸਲੋਕੁ ॥
ਨਿਰਗੁਨੀਆਰ ਇਆਨਿਆ ਸੋ ਪ੍ਰਭੁ ਸਦਾ ਸਮਾਲਿ ॥
ਜਿਨਿ ਕੀਆ ਤਿਸੁ ਚੀਤਿ ਰਖੁ ਨਾਨਕ ਨਿਬਹੀ ਨਾਲਿ ॥੧॥
ਅਸਟਪਦੀ ॥
ਰਮਈਆ ਕੇ ਗੁਨ ਚੇਤਿ ਪਰਾਨੀ ॥
ਕਵਨ ਮੂਲ ਤੇ ਕਵਨ ਦ੍ਰਿਸਟਾਨੀ ॥
ਜਿਨਿ ਤੂੰ ਸਾਜਿ ਸਵਾਰਿ ਸੀਗਾਰਿਆ ॥
ਗਰਭ ਅਗਨਿ ਮਹਿ ਜਿਨਹਿ ਉਬਾਰਿਆ ॥
ਬਾਰ ਬਿਵਸਥਾ ਤੁਝਹਿ ਪਿਆਰੈ ਦੂਧ ॥
ਭਰਿ ਜੋਬਨ ਭੋਜਨ ਸੁਖ ਸੂਧ ॥
ਬਿਰਧਿ ਭਇਆ ਊਪਰਿ ਸਾਕ ਸੈਨ ॥
ਮੁਖਿ ਅਪਿਆਉ ਬੈਠ ਕਉ ਦੈਨ ॥
ਇਹੁ ਨਿਰਗੁਨੁ ਗੁਨੁ ਕਛੂ ਨ ਬੂਝੈ ॥
ਬਖਸਿ ਲੇਹੁ ਤਉ ਨਾਨਕ ਸੀਝੈ ॥੧॥
ਜਿਹ ਪ੍ਰਸਾਦਿ ਧਰ ਊਪਰਿ ਸੁਖਿ ਬਸਹਿ ॥
ਸੁਤ ਭ੍ਰਾਤ ਮੀਤ ਬਨਿਤਾ ਸੰਗਿ ਹਸਹਿ ॥
ਜਿਹ ਪ੍ਰਸਾਦਿ ਪੀਵਹਿ ਸੀਤਲ ਜਲਾ ॥
ਸੁਖਦਾਈ ਪਵਨੁ ਪਾਵਕੁ ਅਮੁਲਾ ॥
ਜਿਹ ਪ੍ਰਸਾਦਿ ਭੋਗਹਿ ਸਭਿ ਰਸਾ ॥
ਸਗਲ ਸਮਗ੍ਰੀ ਸੰਗਿ ਸਾਥਿ ਬਸਾ ॥
ਦੀਨੇ ਹਸਤ ਪਾਵ ਕਰਨ ਨੇਤ੍ਰ ਰਸਨਾ ॥
ਤਿਸਹਿ ਤਿਆਗਿ ਅਵਰ ਸੰਗਿ ਰਚਨਾ ॥
ਐਸੇ ਦੋਖ ਮੂੜ ਅੰਧ ਬਿਆਪੇ ॥
ਨਾਨਕ ਕਾਢਿ ਲੇਹੁ ਪ੍ਰਭ ਆਪੇ ॥੨॥
ਆਦਿ ਅੰਤਿ ਜੋ ਰਾਖਨਹਾਰੁ ॥
ਤਿਸ ਸਿਉ ਪ੍ਰੀਤਿ ਨ ਕਰੈ ਗਵਾਰੁ ॥
ਜਾ ਕੀ ਸੇਵਾ ਨਵ ਨਿਧਿ ਪਾਵੈ ॥
ਤਾ ਸਿਉ ਮੂੜਾ ਮਨੁ ਨਹੀ ਲਾਵੈ ॥
ਜੋ ਠਾਕੁਰੁ ਸਦ ਸਦਾ ਹਜੂਰੇ ॥
ਤਾ ਕਉ ਅੰਧਾ ਜਾਨਤ ਦੂਰੇ ॥
ਜਾ ਕੀ ਟਹਲ ਪਾਵੈ ਦਰਗਹ ਮਾਨੁ ॥
ਤਿਸਹਿ ਬਿਸਾਰੈ ਮੁਗਧੁ ਅਜਾਨੁ ॥
ਸਦਾ ਸਦਾ ਇਹੁ ਭੂਲਨਹਾਰੁ ॥
ਨਾਨਕ ਰਾਖਨਹਾਰੁ ਅਪਾਰੁ ॥੩॥
ਰਤਨੁ ਤਿਆਗਿ ਕਉਡੀ ਸੰਗਿ ਰਚੈ ॥
ਸਾਚੁ ਛੋਡਿ ਝੂਠ ਸੰਗਿ ਮਚੈ ॥
ਜੋ ਛਡਨਾ ਸੁ ਅਸਥਿਰੁ ਕਰਿ ਮਾਨੈ ॥
ਜੋ ਹੋਵਨੁ ਸੋ ਦੂਰਿ ਪਰਾਨੈ ॥
ਛੋਡਿ ਜਾਇ ਤਿਸ ਕਾ ਸ੍ਰਮੁ ਕਰੈ ॥
ਸੰਗਿ ਸਹਾਈ ਤਿਸੁ ਪਰਹਰੈ ॥
ਚੰਦਨ ਲੇਪੁ ਉਤਾਰੈ ਧੋਇ ॥
ਗਰਧਬ ਪ੍ਰੀਤਿ ਭਸਮ ਸੰਗਿ ਹੋਇ ॥
ਅੰਧ ਕੂਪ ਮਹਿ ਪਤਿਤ ਬਿਕਰਾਲ ॥
ਨਾਨਕ ਕਾਢਿ ਲੇਹੁ ਪ੍ਰਭ ਦਇਆਲ ॥੪॥
ਕਰਤੂਤਿ ਪਸੂ ਕੀ ਮਾਨਸ ਜਾਤਿ ॥
ਲੋਕ ਪਚਾਰਾ ਕਰੈ ਦਿਨੁ ਰਾਤਿ ॥
ਬਾਹਰਿ ਭੇਖ ਅੰਤਰਿ ਮਲੁ ਮਾਇਆ ॥
ਛਪਸਿ ਨਾਹਿ ਕਛੁ ਕਰੈ ਛਪਾਇਆ ॥
ਬਾਹਰਿ ਗਿਆਨ ਧਿਆਨ ਇਸਨਾਨ ॥
ਅੰਤਰਿ ਬਿਆਪੈ ਲੋਭੁ ਸੁਆਨੁ ॥
ਅੰਤਰਿ ਅਗਨਿ ਬਾਹਰਿ ਤਨੁ ਸੁਆਹ ॥
ਗਲਿ ਪਾਥਰ ਕੈਸੇ ਤਰੈ ਅਥਾਹ ॥
ਜਾ ਕੈ ਅੰਤਰਿ ਬਸੈ ਪ੍ਰਭੁ ਆਪਿ ॥
ਨਾਨਕ ਤੇ ਜਨ ਸਹਜਿ ਸਮਾਤਿ ॥੫॥
ਸੁਨਿ ਅੰਧਾ ਕੈਸੇ ਮਾਰਗੁ ਪਾਵੈ ॥
ਕਰੁ ਗਹਿ ਲੇਹੁ ਓੜਿ ਨਿਬਹਾਵੈ ॥
ਕਹਾ ਬੁਝਾਰਤਿ ਬੂਝੈ ਡੋਰਾ ॥
ਨਿਸਿ ਕਹੀਐ ਤਉ ਸਮਝੈ ਭੋਰਾ ॥
ਕਹਾ ਬਿਸਨਪਦ ਗਾਵੈ ਗੁੰਗ ॥
ਜਤਨ ਕਰੈ ਤਉ ਭੀ ਸੁਰ ਭੰਗ ॥
ਕਹ ਪਿੰਗੁਲ ਪਰਬਤ ਪਰ ਭਵਨ ॥
ਨਹੀ ਹੋਤ ਊਹਾ ਉਸੁ ਗਵਨ ॥
ਕਰਤਾਰ ਕਰੁਣਾ ਮੈ ਦੀਨੁ ਬੇਨਤੀ ਕਰੈ ॥
ਨਾਨਕ ਤੁਮਰੀ ਕਿਰਪਾ ਤਰੈ ॥੬॥
ਸੰਗਿ ਸਹਾਈ ਸੁ ਆਵੈ ਨ ਚੀਤਿ ॥
ਜੋ ਬੈਰਾਈ ਤਾ ਸਿਉ ਪ੍ਰੀਤਿ ॥
ਬਲੂਆ ਕੇ ਗ੍ਰਿਹ ਭੀਤਰਿ ਬਸੈ ॥
ਅਨਦ ਕੇਲ ਮਾਇਆ ਰੰਗਿ ਰਸੈ ॥
ਦ੍ਰਿੜੁ ਕਰਿ ਮਾਨੈ ਮਨਹਿ ਪ੍ਰਤੀਤਿ ॥
ਕਾਲੁ ਨ ਆਵੈ ਮੂੜੇ ਚੀਤਿ ॥
ਬੈਰ ਬਿਰੋਧ ਕਾਮ ਕ੍ਰੋਧ ਮੋਹ ॥
ਝੂਠ ਬਿਕਾਰ ਮਹਾ ਲੋਭ ਧ੍ਰੋਹ ॥
ਇਆਹੂ ਜੁਗਤਿ ਬਿਹਾਨੇ ਕਈ ਜਨਮ ॥
ਨਾਨਕ ਰਾਖਿ ਲੇਹੁ ਆਪਨ ਕਰਿ ਕਰਮ ॥੭॥
ਤੂ ਠਾਕੁਰੁ ਤੁਮ ਪਹਿ ਅਰਦਾਸਿ ॥
ਜੀਉ ਪਿੰਡੁ ਸਭੁ ਤੇਰੀ ਰਾਸਿ ॥
ਤੁਮ ਮਾਤ ਪਿਤਾ ਹਮ ਬਾਰਿਕ ਤੇਰੇ ॥
ਤੁਮਰੀ ਕ੍ਰਿਪਾ ਮਹਿ ਸੂਖ ਘਨੇਰੇ ॥
ਕੋਇ ਨ ਜਾਨੈ ਤੁਮਰਾ ਅੰਤੁ ॥
ਊਚੇ ਤੇ ਊਚਾ ਭਗਵੰਤ ॥
ਸਗਲ ਸਮਗ੍ਰੀ ਤੁਮਰੈ ਸੂਤ੍ਰਿ ਧਾਰੀ ॥
ਤੁਮ ਤੇ ਹੋਇ ਸੁ ਆਗਿਆਕਾਰੀ ॥
ਤੁਮਰੀ ਗਤਿ ਮਿਤਿ ਤੁਮ ਹੀ ਜਾਨੀ ॥
ਨਾਨਕ ਦਾਸ ਸਦਾ ਕੁਰਬਾਨੀ ॥੮॥੪॥
ਸਲੋਕੁ ॥
ਦੇਨਹਾਰੁ ਪ੍ਰਭ ਛੋਡਿ ਕੈ ਲਾਗਹਿ ਆਨ ਸੁਆਇ ॥
ਨਾਨਕ ਕਹੂ ਨ ਸੀਝਈ ਬਿਨੁ ਨਾਵੈ ਪਤਿ ਜਾਇ ॥੧॥`,
        transliteration: `salok |
niraguneeaar eaaniaa so prabh sadaa samaal |
jin keea tis cheet rakh naanak nibahee naal |1|
asattapadee |
rameea ke gun chet paraanee |
kavan mool te kavan drisattaanee |
jin toon saaj savaar seegaariaa |
garabh agan meh jineh ubaariaa |
baar bivasathaa tujheh piaarai doodh |
bhar joban bhojan sukh soodh |
biradh bheaa aoopar saak sain |
mukh apiaau baitth kau dain |
eihu niragun gun kachhoo na boojhai |
bakhas lehu tau naanak seejhai |1|
jih prasaad dhar aoopar sukh baseh |
sut bhraat meet banitaa sang haseh |
jih prasaad peeveh seetal jalaa |
sukhadaaee pavan paavak amulaa |
jih prasaad bhogeh sabh rasaa |
sagal samagree sang saath basaa |
deene hasat paav karan netr rasanaa |
tiseh tiaag avar sang rachanaa |
aise dokh moorr andh biaape |
naanak kaadt lehu prabh aape |2|
aad ant jo raakhanahaar |
tis siau preet na karai gavaar |
jaa kee sevaa nav nidh paavai |
taa siau moorraa man nahee laavai |
jo tthaakur sad sadaa hajoore |
taa kau andhaa jaanat doore |
jaa kee ttehal paavai daragah maan |
tiseh bisaarai mugadh ajaan |
sadaa sadaa ihu bhoolanahaar |
naanak raakhanahaar apaar |3|
ratan tiaag kauddee sang rachai |
saach chhodd jhootth sang machai |
jo chhaddanaa su asathir kar maanai |
jo hovan so door paraanai |
chhodd jaae tis kaa sram karai |
sang sahaaee tis paraharai |
chandan lep utaarai dhoe |
garadhab preet bhasam sang hoe |
andh koop meh patit bikaraal |
naanak kaadt lehu prabh deaal |4|
karatoot pasoo kee maanas jaat |
lok pachaaraa karai din raat |
baahar bhekh antar mal maaeaa |
chhapas naeh kachh karai chhapaaeaa |
baahar giaan dhiaan isanaan |
antar biaapai lobh suaan |
antar agan baahar tan suaah |
gal paathar kaise tarai athaah |
jaa kai antar basai prabh aap |
naanak te jan sehaj samaat |5|
sun andhaa kaise maarag paavai |
kar geh lehu orr nibahaavai |
kahaa bujhaarat boojhai ddoraa |
nis kaheeai tau samajhai bhoraa |
kahaa bisanapad gaavai gung |
jatan karai tau bhee sur bhang |
keh pingul parabat par bhavan |
nahee hot aoohaa us gavan |
karataar karunaa mai deen benatee karai |
naanak tumaree kirapaa tarai |6|
sang sahaaee su aavai na cheet |
jo bairaaee taa siau preet |
balooaa ke grih bheetar basai |
anad kel maaeaa rang rasai |
drirr kar maanai maneh prateet |
kaal na aavai moorre cheet |
bair birodh kaam krodh moh |
jhootth bikaar mahaa lobh dhroh |
eaahoo jugat bihaane kee janam |
naanak raakh lehu aapan kar karam |7|
too tthaakur tum peh aradaas |
jeeo pindd sabh teree raas |
tum maat pitaa ham baarik tere |
tumaree kripaa meh sookh ghanere |
koe na jaanai tumaraa ant |
aooche te aoochaa bhagavant |
sagal samagree tumarai sootr dhaaree |
tum te hoe su aagiaakaaree |
tumaree gat mit tum hee jaanee |
naanak daas sadaa kurabaanee |8|4|
salok |
denahaar prabh chhodd kai laageh aan suaae |
naanak kahoo na seejhee bin naavai pat jaae |1|`,
        meaning: `Salok: You worthless, ignorant fool - dwell upon God forever. Cherish in your consciousness the One who created you; O Nanak, He alone shall go along with you. ||1|| Ashtapadee: Think of the Glory of the All-pervading Lord, O mortal; what is your origin, and what is your appearance? He who fashioned, adorned and decorated you in the fire of the womb, He preserved you. In your infancy, He gave you milk to drink. In the flower of your youth, He gave you food, pleasure and understanding. As you grow old, family and friends, Are there to feed you as you rest. This worthless person has not appreciated in the least, all the good deeds done for him. If you bless him with forgiveness, O Nanak, only then will he be saved. ||1|| By His Grace, you abide in comfort upon the earth. With your children, siblings, friends and spouse, you laugh. By His Grace, you drink in cool water. You have peaceful breezes and priceless fire. By His Grace, you enjoy all sorts of pleasures. You are provided with all the necessities of life. He gave you hands, feet, ears, eyes and tongue, and yet, you forsake Him and attach yourself to others. Such sinful mistakes cling to the blind fools; Nanak: uplift and save them, God! ||2|| From beginning to end, He is our Protector, and yet, the ignorant do not give their love to Him. Serving Him, the nine treasures are obtained, and yet, the foolish do not link their minds with Him. Our Lord and Master is Ever-present, forever and ever, and yet, the spiritually blind believe that He is far away. In His service, one obtains honor in the Court of the Lord, and yet, the ignorant fool forgets Him. Forever and ever, this person makes mistakes; O Nanak, the Infinite Lord is our Saving Grace. ||3|| Forsaking the jewel, they are engrossed with a shell. They renounce Truth and embrace falsehood. That which passes away, they believe to be permanent. That which is immanent, they believe to be far off. They struggle for what they must eventually leave. They turn away from the Lord, their Help and Support, who is always with them. They wash off the sandalwood paste; like donkeys, they are in love with the mud. They have fallen into the deep, dark pit. Nanak: lift them up and save them, O Merciful Lord God! ||4|| They belong to the human species, but they act like animals. They curse others day and night. Outwardly, they wear religious robes, but within is the filth of Maya. They cannot conceal this, no matter how hard they try. Outwardly, they display knowledge, meditation and purification, but within clings the dog of greed. The fire of desire rages within; outwardly they apply ashes to their bodies. There is a stone around their neck - how can they cross the unfathomable ocean? Those, within whom God Himself abides - O Nanak, those humble beings are intuitively absorbed in the Lord. ||5|| By listening, how can the blind find the path? Take hold of his hand, and then he can reach his destination. How can a riddle be understood by the deaf? Say 'night', and he thinks you said 'day'. How can the mute sing the Songs of the Lord? He may try, but his voice will fail him. How can the cripple climb up the mountain? He simply cannot go there. O Creator, Lord of Mercy - Your humble servant prays; Nanak: by Your Grace, please save me. ||6|| The Lord, our Help and Support, is always with us, but the mortal does not remember Him. He shows love to his enemies. He lives in a castle of sand. He enjoys the games of pleasure and the tastes of Maya. He believes them to be permanent - this is the belief of his mind. Death does not even come to mind for the fool. Hate, conflict, sexual desire, anger, emotional attachment, falsehood, corruption, immense greed and deceit: So many lifetimes are wasted in these ways. Nanak: uplift them, and redeem them, O Lord - show Your Mercy! ||7|| You are our Lord and Master; to You, I offer this prayer. This body and soul are all Your property. You are our mother and father; we are Your children. In Your Grace, there are so many joys! No one knows Your limits. O Highest of the High, Most Generous God, the whole creation is strung on Your thread. That which has come from You is under Your Command. You alone know Your state and extent. Nanak, Your slave, is forever a sacrifice. ||8||4|| Salok: One who renounces God the Giver, and attaches himself to other affairs - O Nanak, he shall never succeed. Without the Name, he shall lose his honor. ||1||`,
        meaning_pa: `ਹੇ ਅੰਞਾਣ! ਹੇ ਗੁਣ-ਹੀਨ (ਮਨੁੱਖ)! ਉਸ ਮਾਲਕ ਨੂੰ ਸਦਾ ਯਾਦ ਕਰ। ਹੇ ਨਾਨਕ! ਜਿਸ ਨੇ ਤੈਨੂੰ ਪੈਦਾ ਕੀਤਾ ਹੈ, ਉਸ ਨੂੰ ਚਿੱਤ ਵਿਚ (ਪ੍ਰੋ) ਰੱਖ, ਉਹੀ (ਤੇਰੇ) ਨਾਲ ਸਾਥ ਨਿਬਾਹੇਗਾ ॥੧॥ ਹੇ ਜੀਵ! ਸੋਹਣੇ ਰਾਮ ਦੇ ਗੁਣ ਯਾਦ ਕਰ, (ਵੇਖ) ਕਿਸ ਮੁੱਢ ਤੋਂ (ਤੈਨੂੰ) ਕੇਹਾ (ਸੋਹਣਾ ਬਣਾ ਕੇ ਉਸ ਨੇ) ਵਿਖਾਇਆ ਹੈ। ਜਿਸ ਪ੍ਰਭੂ ਨੇ ਤੈਨੂੰ ਬਣਾ ਸਵਾਰ ਕੇ ਸੋਹਣਾ ਕੀਤਾ ਹੈ, ਜਿਸ ਨੇ ਤੈਨੂੰ ਪੇਟ ਦੀ ਅੱਗ ਵਿਚ (ਭੀ) ਬਚਾਇਆ; ਜੋ ਬਾਲ ਉਮਰ ਵਿਚ ਤੈਨੂੰ ਦੁੱਧ ਪਿਆਲਦਾ ਹੈ, ਭਰ-ਜੁਆਨੀ ਵਿਚ ਭੋਜਨ ਤੇ ਸੁਖਾਂ ਦੀ ਸੂਝ (ਦੇਂਦਾ ਹੈ); (ਜਦੋਂ ਤੂੰ) ਬੁੱਢਾ ਹੋ ਜਾਂਦਾ ਹੈਂ (ਤਾਂ) ਸੇਵਾ ਕਰਨ ਨੂੰ ਸਾਕ-ਸੱਜਣ (ਤਿਆਰ ਕਰ ਦੇਂਦਾ ਹੈਂ) ਜੋ ਬੈਠੇ ਹੋਏ ਨੂੰ ਮੂੰਹ ਵਿਚ ਚੰਗੇ ਭੋਜਨ ਦੇਂਦੇ ਹਨ, (ਉਸ ਪ੍ਰਭੂ ਨੂੰ ਚੇਤੇ ਕਰ)। (ਪਰ) (ਹੇ ਪ੍ਰਭੂ!) ਇਹ ਗੁਣ-ਹੀਣ ਜੀਵ (ਤੇਰਾ) ਕੋਈ ਉਪਕਾਰ ਨਹੀਂ ਸਮਝਦਾ, ਹੇ ਨਾਨਕ! (ਆਖ) (ਜੇ) ਤੂੰ ਆਪਿ ਮੇਹਰ ਕਰੇਂ, ਤਾਂ (ਇਹ ਜਨਮ-ਮਨੋਰਥ ਵਿਚ) ਸਫਲ ਹੋਵੇ ॥੧॥ (ਹੇ ਜੀਵ!) ਜਿਸ (ਪ੍ਰਭੂ) ਦੀ ਕ੍ਰਿਪਾ ਨਾਲ ਤੂੰ ਧਰਤੀ ਉਤੇ ਸੁਖੀ ਵੱਸਦਾ ਹੈਂ, ਪੁਤ੍ਰ ਭਰਾ ਮਿਤ੍ਰ ਇਸਤ੍ਰੀ ਨਾਲ ਹੱਸਦਾ ਹੈਂ; ਜਿਸ ਦੀ ਮੇਹਰ ਨਾਲ ਤੂੰ ਠੰਢਾ ਪਾਣੀ ਪੀਂਦਾ ਹੈਂ, ਸੁਖ ਦੇਣ ਵਾਲੀ ਹਵਾ ਤੇ ਅਮੋਲਕ ਅੱਗ (ਵਰਤਦਾ ਹੈਂ); ਜਿਸ ਦੀ ਕਿਰਪਾ ਨਾਲ ਸਾਰੇ ਰਸ ਭੋਗਦਾ ਹੈਂ, ਸਾਰੇ ਪਦਾਰਥਾਂ ਦੇ ਨਾਲ ਤੂੰ ਰਹਿੰਦਾ ਹੈਂ (ਭਾਵ, ਸਾਰੇ ਪਦਾਰਥ ਵਰਤਣ ਲਈ ਤੈਨੂੰ ਮਿਲਦੇ ਹਨ); (ਜਿਸ ਨੇ) ਤੈਨੂੰ ਹੱਥ ਪੈਰ ਕੰਨ ਅੱਖਾਂ ਜੀਭ ਦਿੱਤੇ ਹਨ, ਉਸ (ਪ੍ਰਭੂ) ਨੂੰ ਵਿਸਾਰ ਕੇ (ਹੇ ਜੀਵ!) ਤੂੰ ਹੋਰਨਾਂ ਨਾਲ ਮਗਨ ਹੈਂ। (ਇਹ) ਮੂਰਖ ਅੰਨ੍ਹੇ ਜੀਵ (ਭਲਾਈ ਵਿਸਾਰਨ ਵਾਲੇ) ਇਹੋ ਜਿਹੇ ਔਗੁਣਾਂ ਵਿਚ ਫਸੇ ਹੋਏ ਹਨ। ਹੇ ਨਾਨਕ! (ਇਹਨਾਂ ਜੀਵਾਂ ਵਾਸਤੇ ਅਰਦਾਸ ਕਰ, ਤੇ ਆਖ)-ਹੇ ਪ੍ਰਭੂ! (ਇਹਨਾਂ ਨੂੰ) ਆਪ (ਇਹਨਾਂ ਔਗੁਣਾਂ ਵਿਚੋਂ) ਕੱਢ ਲੈ ॥੨॥ ਜੋ (ਇਸ ਦੇ) ਜਨਮ ਤੋਂ ਲੈ ਕੇ ਮਰਨ ਸਮੇਂ ਤਕ (ਇਸ ਦੀ) ਰਾਖੀ ਕਰਨ ਵਾਲਾ ਹੈ, ਮੂਰਖ ਮਨੁੱਖ ਉਸ ਪ੍ਰਭੂ ਨਾਲ ਪਿਆਰ ਨਹੀਂ ਕਰਦਾ। ਜਿਸ ਦੀ ਸੇਵਾ ਕੀਤਿਆਂ (ਇਸ ਨੂੰ ਸ੍ਰਿਸ਼ਟੀ ਦੇ) ਨੌ ਹੀ ਖ਼ਜ਼ਾਨੇ ਮਿਲ ਜਾਂਦੇ ਹਨ, ਮੂਰਖ ਜੀਵ ਉਸ ਪ੍ਰਭੂ ਨਾਲ ਚਿੱਤ ਨਹੀਂ ਜੋੜਦਾ। ਜੋ ਹਰ ਵੇਲੇ ਇਸ ਦੇ ਅੰਗ-ਸੰਗ ਹੈ, ਅੰਨ੍ਹਾ ਮਨੁੱਖ ਉਸ ਠਾਕੁਰ ਨੂੰ (ਕਿਤੇ) ਦੂਰ (ਬੈਠਾ) ਸਮਝਦਾ ਹੈ। ਜਿਸ ਦੀ ਟਹਲ ਕੀਤਿਆਂ ਇਸ ਨੂੰ (ਪ੍ਰਭੂ ਦੀ) ਦਰਗਾਹ ਵਿਚ ਆਦਰ ਮਿਲਦਾ ਹੈ, ਮੂਰਖ ਤੇ ਅੰਞਾਣ ਜੀਵ ਉਸ ਪ੍ਰਭੂ ਨੂੰ ਵਿਸਾਰ ਬੈਠਦਾ ਹੈ। (ਪਰ ਕੇਹੜਾ ਕੇਹੜਾ ਔਗੁਣ ਚਿਤਾਰੀਏ?) ਇਹ ਜੀਵ (ਤਾਂ) ਸਦਾ ਹੀ ਭੁੱਲਾਂ ਕਰਦਾ ਰਹਿੰਦਾ ਹੈ; ਹੇ ਨਾਨਕ! ਰੱਖਿਆ ਕਰਨ ਵਾਲਾ ਪ੍ਰਭੂ ਬੇਅੰਤ ਹੈ (ਉਹ ਇਸ ਜੀਵ ਦੇ ਔਗੁਣਾਂ ਵਲ ਨਹੀਂ ਤੱਕਦਾ) ॥੩॥ (ਮਾਇਆ-ਧਾਰੀ ਜੀਵ) (ਨਾਮ-) ਰਤਨ ਛੱਡ ਕੇ (ਮਾਇਆ-ਰੂਪ) ਕਉਡੀ ਨਾਲ ਖ਼ੁਸ਼ ਫਿਰਦਾ ਹੈ। ਸੱਚੇ (ਪ੍ਰਭੂ) ਨੂੰ ਛੱਡ ਕੇ ਨਾਸਵੰਤ (ਪਦਾਰਥਾਂ) ਨਾਲ ਭੂਹੇ ਹੁੰਦਾ ਹੈ। ਜੋ (ਮਾਇਆ) ਛੱਡ ਜਾਣੀ ਹੈ, ਉਸ ਨੂੰ ਸਦਾ ਅਟੱਲ ਸਮਝਦਾ ਹੈ; ਜੋ (ਮੌਤ) ਜ਼ਰੂਰ ਵਾਪਰਨੀ ਹੈ, ਉਸ ਨੂੰ (ਕਿਤੇ) ਦੂਰ (ਬੈਠੀ) ਖ਼ਿਆਲ ਕਰਦਾ ਹੈ। ਉਸ (ਧਨ ਪਦਾਰਥ) ਦੀ ਖ਼ਾਤਰ (ਨਿੱਤ) ਖੇਚਲ ਕਰਦਾ (ਫਿਰਦਾ) ਹੈ ਜੋ (ਅੰਤ) ਛੱਡ ਜਾਣੀ ਹੈ; ਜੋ (ਪ੍ਰਭੂ) (ਇਸ) ਨਾਲ ਰਾਖਾ ਹੈ ਉਸ ਨੂੰ ਵਿਸਾਰ ਬੈਠਾ ਹੈ। (ਜਿਵੇਂ ਖੋਤਾ) ਚੰਦਨ ਦਾ ਲੇਪ ਧੋ ਕੇ ਲਾਹ ਦੇਂਦਾ ਹੈ, (ਕਿਉਂਕਿ) ਖੋਤੇ ਦਾ ਪਿਆਰ (ਸਦਾ) ਸੁਆਹ ਨਾਲ (ਹੀ) ਹੁੰਦਾ ਹੈ। (ਜੀਵ ਮਾਇਆ ਦੇ ਪਿਆਰ ਕਰ ਕੇ) ਹਨੇਰੇ ਭਿਆਨਕ ਖੂਹ ਵਿਚ ਡਿੱਗੇ ਪਏ ਹਨ; ਹੇ ਨਾਨਕ! (ਅਰਦਾਸ ਕਰ ਤੇ ਆਖ) ਹੇ ਦਿਆਲ ਪ੍ਰਭੂ! (ਇਹਨਾਂ ਨੂੰ ਆਪ ਇਸ ਖੂਹ ਵਿਚੋਂ) ਕੱਢ ਲੈ ॥੪॥ ਜਾਤਿ ਮਨੁੱਖ ਦੀ ਹੈ (ਭਾਵ, ਮਨੁੱਖ-ਸ਼੍ਰੇਣੀ ਵਿਚੋਂ ਜੰਮਿਆ ਹੈ) ਪਰ ਕੰਮ ਪਸ਼ੂਆਂ ਵਾਲੇ ਹਨ, (ਉਂਞ) ਦਿਨ ਰਾਤ ਲੋਕਾਂ ਵਾਸਤੇ ਵਿਖਾਵਾ ਕਰ ਰਿਹਾ ਹੈ। ਬਾਹਰ (ਸਰੀਰ ਉਤੇ) ਧਾਰਮਿਕ ਪੁਸ਼ਾਕ ਹੈ ਪਰ ਮਨ ਵਿਚ ਮਾਇਆ ਦੀ ਮੈਲ ਹੈ, (ਬਾਹਰਲੇ ਭੇਖ ਨਾਲ) ਛਪਾਉਣ ਦਾ ਜਤਨ ਕੀਤਿਆਂ (ਮਨ ਦੀ ਮੈਲ) ਲੁਕਦੀ ਨਹੀਂ। ਬਾਹਰ (ਵਿਖਾਵੇ ਵਾਸਤੇ) (ਤੀਰਥ) ਇਸ਼ਨਾਨ ਤੇ ਗਿਆਨ ਦੀਆਂ ਗੱਲਾਂ ਕਰਦਾ ਹੈ, ਸਮਾਧੀਆਂ ਭੀ ਲਾਉਂਦਾ ਹੈ, ਪਰ ਮਨ ਵਿਚ ਲੋਭ (-ਰੂਪ) ਕੁੱਤਾ ਜ਼ੋਰ ਪਾ ਰਿਹਾ ਹੈ। ਮਨ ਵਿਚ (ਤ੍ਰਿਸ਼ਨਾ ਦੀ) ਅੱਗ ਹੈ, ਬਾਹਰ ਸਰੀਰ ਸੁਆਹ (ਨਾਲ ਲਿਬੇੜਿਆ ਹੋਇਆ ਹੈ); (ਜੇ) ਗਲ ਵਿਚ (ਵਿਕਾਰਾਂ ਦੇ) ਪੱਥਰ (ਹੋਣ ਤਾਂ) ਅਥਾਹ (ਸੰਸਾਰ-ਸਮੁੰਦਰ ਨੂੰ ਜੀਵ) ਕਿਵੇਂ ਤਰੇ? ਜਿਸ ਜਿਸ ਮਨੁੱਖ ਦੇ ਹਿਰਦੇ ਵਿਚ ਪ੍ਰਭੂ ਆ ਵੱਸਦਾ ਹੈ, ਹੇ ਨਾਨਕ! ਉਹੀ ਅਡੋਲ ਅਵਸਥਾ ਵਿਚ ਟਿਕੇ ਰਹਿੰਦੇ ਹਨ ॥੫॥ ਅੰਨ੍ਹਾ ਮਨੁੱਖ (ਨਿਰਾ) ਸੁਣ ਕੇ ਕਿਵੇਂ ਰਾਹ ਲੱਭ ਲਏ? (ਹੇ ਪ੍ਰਭੂ! ਆਪ ਇਸ ਦਾ) ਹੱਥ ਫੜ ਲਵੋ (ਤਾਕਿ ਇਹ) ਅਖ਼ੀਰ ਤਕ (ਪ੍ਰੀਤ) ਨਿਬਾਹ ਸਕੇ। ਬੋਲਾ ਮਨੁੱਖ (ਨਿਰੀ) ਸੈਨਤ ਨੂੰ ਕੀਹ ਸਮਝੇ? (ਸੈਨਤ ਨਾਲ ਜੇ) ਆਖੀਏ (ਇਹ) ਰਾਤ ਹੈ ਤਾਂ ਉਹ ਸਮਝ ਲੈਂਦਾ ਹੈ (ਇਹ) ਦਿਨ (ਹੈ)। ਗੂੰਗਾ ਕਿਵੇਂ ਬਿਸ਼ਨ-ਪਦੇ ਗਾ ਸਕੇ? (ਕਈ) ਜਤਨ (ਭੀ) ਕਰੇ ਤਾਂ ਭੀ ਉਸ ਦੀ ਸੁਰ ਟੁੱਟੀ ਰਹਿੰਦੀ ਹੈ। ਲੂਲ੍ਹਾ ਕਿਥੇ ਪਹਾੜਾਂ ਤੇ ਭਉਂ ਸਕਦਾ ਹੈ? ਓਥੇ ਉਸ ਦੀ ਪਹੁੰਚ ਨਹੀਂ ਹੋ ਸਕਦੀ। ਹੇ ਕਰਤਾਰ! ਹੇ ਦਇਆ ਦੇ ਸਾਗਰ! (ਇਹ) ਨਿਮਾਣਾ ਦਾਸ ਬੇਨਤੀ ਕਰਦਾ ਹੈ, ਹੇ ਨਾਨਕ! (ਇਸ ਹਾਲਤ ਵਿਚ ਕੇਵਲ ਅਰਦਾਸ ਕਰ ਤੇ ਆਖ) ਤੇਰੀ ਮੇਹਰ ਨਾਲ (ਹੀ) ਤਰ ਸਕਦਾ ਹੈ ॥੬॥ ਜੋ ਪ੍ਰਭੂ (ਇਸ ਮੂਰਖ ਦਾ) ਸੰਗੀ ਸਾਥੀ ਹੈ, ਉਸ ਨੂੰ (ਇਹ) ਚੇਤੇ ਨਹੀਂ ਕਰਦਾ, (ਪਰ) ਜੋ ਵੈਰੀ ਹੈ ਉਸ ਨਾਲ ਪਿਆਰ ਕਰ ਰਿਹਾ ਹੈ। ਰੇਤ ਦੇ ਘਰ ਵਿਚ ਵੱਸਦਾ ਹੈ (ਭਾਵ ਰੇਤ ਦੇ ਕਿਣਕਿਆਂ ਵਾਂਗ ਉਮਰ ਛਿਨ ਛਿਨ ਕਰ ਕੇ ਕਿਰ ਰਹੀ ਹੈ), (ਫਿਰ ਭੀ) ਮਾਇਆ ਦੀ ਮਸਤੀ ਵਿਚ ਆਨੰਦ ਮੌਜਾਂ ਮਾਣ ਰਿਹਾ ਹੈ। (ਆਪਣੇ ਆਪ ਨੂੰ) ਅਮਰ ਸਮਝੀ ਬੈਠਾ ਹੈ, ਮਨ ਵਿਚ (ਇਹੀ) ਯਕੀਨ ਬਣਿਆ ਹੋਇਆ ਹੈ; ਪਰ ਮੂਰਖ ਦੇ ਚਿਤ ਵਿਚ (ਕਦੇ) ਮੌਤ (ਦਾ ਖ਼ਿਆਲ ਭੀ) ਨਹੀਂ ਆਉਂਦਾ। ਵੈਰ ਵਿਰੋਧ, ਕਾਮ, ਗੁੱਸਾ, ਮੋਹ, ਝੂਠ, ਮੰਦੇ ਕਰਮ, ਭਾਰੀ ਲਾਲਚ ਤੇ ਦਗ਼ਾ- ਇਸੇ ਰਾਹੇ ਪੈ ਕੇ (ਇਸ ਦੇ) ਕਈ ਜਨਮ ਗੁਜ਼ਾਰ ਗਏ ਹਨ। ਹੇ ਨਾਨਕ! (ਇਸ ਵਿਚਾਰੇ ਜੀਵ ਵਾਸਤੇ ਪ੍ਰਭੂ-ਦਰ ਤੇ ਅਰਦਾਸ ਕਰ ਤੇ ਆਖ) ਆਪਣੀ ਮੇਹਰ ਕਰ ਕੇ (ਇਸ ਨੂੰ) ਬਚਾ ਲਵੋ ॥੭॥ (ਹੇ ਪ੍ਰਭੂ!) ਤੂੰ ਮਾਲਿਕ ਹੈਂ (ਸਾਡੀ ਜੀਵਾਂ ਦੀ) ਅਰਜ਼ ਤੇਰੇ ਅੱਗੇ ਹੀ ਹੈ, ਇਹ ਜਿੰਦ ਤੇ ਸਰੀਰ (ਜੋ ਤੂੰ ਸਾਨੂੰ ਦਿੱਤਾ ਹੈ) ਸਭ ਤੇਰੀ ਹੀ ਬਖ਼ਸ਼ੀਸ਼ ਹੈ। ਤੂੰ ਸਾਡਾ ਮਾਂ ਪਿਉ ਹੈਂ, ਅਸੀਂ ਤੇਰੇ ਬਾਲ ਹਾਂ, ਤੇਰੀ ਮੇਹਰ (ਦੀ ਨਜ਼ਰ) ਵਿਚ ਬੇਅੰਤ ਸੁਖ ਹਨ। ਕੋਈ ਤੇਰਾ ਅੰਤ ਨਹੀਂ ਪਾ ਸਕਦਾ, (ਕਿਉਂਕਿ) ਤੂੰ ਸਭ ਤੋਂ ਉੱਚਾ ਭਗਵਾਨ ਹੈਂ। (ਜਗਤ ਦੇ) ਸਾਰੇ ਪਦਾਰਥ ਤੇਰੇ ਹੀ ਹੁਕਮ ਵਿਚ ਟਿਕੇ ਹੋਏ ਹਨ; ਤੇਰੀ ਰਚੀ ਹੋਈ ਸ੍ਰਿਸ਼ਟੀ ਤੇਰੀ ਹੀ ਆਗਿਆ ਵਿਚ ਤੁਰ ਰਹੀ ਹੈ। ਤੂੰ ਕਿਹੋ ਜਿਹਾ ਹੈਂ ਤੇ ਕੇਡਾ ਵੱਡਾ ਹੈਂ-ਇਹ ਤੂੰ ਆਪ ਹੀ ਜਾਣਦਾ ਹੈਂ। ਹੇ ਨਾਨਕ! (ਆਖ, ਹੇ ਪ੍ਰਭੂ!) ਤੇਰੇ ਸੇਵਕ (ਤੈਥੋਂ) ਸਦਾ ਸਦਕੇ ਜਾਂਦੇ ਹਨ ॥੮॥੪॥ (ਸਾਰੀਆਂ ਦਾਤਾਂ) ਦੇਣ ਵਾਲੇ ਪ੍ਰਭੂ ਨੂੰ ਛੱਡ ਕੇ (ਜੀਵ) ਹੋਰ ਸੁਆਦ ਵਿਚ ਲੱਗਦੇ ਹਨ; (ਪਰ) ਹੇ ਨਾਨਕ! (ਇਹੋ ਜਿਹਾ) ਕਦੇ (ਕੋਈ ਮਨੁੱਖ ਜੀਵਨ-ਯਾਤ੍ਰਾ ਵਿਚ) ਕਾਮਯਾਬ ਨਹੀਂ ਹੁੰਦਾ (ਕਿਉਂਕਿ ਪ੍ਰਭੂ ਦੇ) ਨਾਮ ਤੋਂ ਬਿਨਾ ਇੱਜ਼ਤ ਨਹੀਂ ਰਹਿੰਦੀ ॥੧॥`
      },
      {
        number: 5,
        sanskrit: `ਸਲੋਕੁ ॥
ਦੇਨਹਾਰੁ ਪ੍ਰਭ ਛੋਡਿ ਕੈ ਲਾਗਹਿ ਆਨ ਸੁਆਇ ॥
ਨਾਨਕ ਕਹੂ ਨ ਸੀਝਈ ਬਿਨੁ ਨਾਵੈ ਪਤਿ ਜਾਇ ॥੧॥
ਅਸਟਪਦੀ ॥
ਦਸ ਬਸਤੂ ਲੇ ਪਾਛੈ ਪਾਵੈ ॥
ਏਕ ਬਸਤੁ ਕਾਰਨਿ ਬਿਖੋਟਿ ਗਵਾਵੈ ॥
ਏਕ ਭੀ ਨ ਦੇਇ ਦਸ ਭੀ ਹਿਰਿ ਲੇਇ ॥
ਤਉ ਮੂੜਾ ਕਹੁ ਕਹਾ ਕਰੇਇ ॥
ਜਿਸੁ ਠਾਕੁਰ ਸਿਉ ਨਾਹੀ ਚਾਰਾ ॥
ਤਾ ਕਉ ਕੀਜੈ ਸਦ ਨਮਸਕਾਰਾ ॥
ਜਾ ਕੈ ਮਨਿ ਲਾਗਾ ਪ੍ਰਭੁ ਮੀਠਾ ॥
ਸਰਬ ਸੂਖ ਤਾਹੂ ਮਨਿ ਵੂਠਾ ॥
ਜਿਸੁ ਜਨ ਅਪਨਾ ਹੁਕਮੁ ਮਨਾਇਆ ॥
ਸਰਬ ਥੋਕ ਨਾਨਕ ਤਿਨਿ ਪਾਇਆ ॥੧॥
ਅਗਨਤ ਸਾਹੁ ਅਪਨੀ ਦੇ ਰਾਸਿ ॥
ਖਾਤ ਪੀਤ ਬਰਤੈ ਅਨਦ ਉਲਾਸਿ ॥
ਅਪੁਨੀ ਅਮਾਨ ਕਛੁ ਬਹੁਰਿ ਸਾਹੁ ਲੇਇ ॥
ਅਗਿਆਨੀ ਮਨਿ ਰੋਸੁ ਕਰੇਇ ॥
ਅਪਨੀ ਪਰਤੀਤਿ ਆਪ ਹੀ ਖੋਵੈ ॥
ਬਹੁਰਿ ਉਸ ਕਾ ਬਿਸ੍ਵਾਸੁ ਨ ਹੋਵੈ ॥
ਜਿਸ ਕੀ ਬਸਤੁ ਤਿਸੁ ਆਗੈ ਰਾਖੈ ॥
ਪ੍ਰਭ ਕੀ ਆਗਿਆ ਮਾਨੈ ਮਾਥੈ ॥
ਉਸ ਤੇ ਚਉਗੁਨ ਕਰੈ ਨਿਹਾਲੁ ॥
ਨਾਨਕ ਸਾਹਿਬੁ ਸਦਾ ਦਇਆਲੁ ॥੨॥
ਅਨਿਕ ਭਾਤਿ ਮਾਇਆ ਕੇ ਹੇਤ ॥
ਸਰਪਰ ਹੋਵਤ ਜਾਨੁ ਅਨੇਤ ॥
ਬਿਰਖ ਕੀ ਛਾਇਆ ਸਿਉ ਰੰਗੁ ਲਾਵੈ ॥
ਓਹ ਬਿਨਸੈ ਉਹੁ ਮਨਿ ਪਛੁਤਾਵੈ ॥
ਜੋ ਦੀਸੈ ਸੋ ਚਾਲਨਹਾਰੁ ॥
ਲਪਟਿ ਰਹਿਓ ਤਹ ਅੰਧ ਅੰਧਾਰੁ ॥
ਬਟਾਊ ਸਿਉ ਜੋ ਲਾਵੈ ਨੇਹ ॥
ਤਾ ਕਉ ਹਾਥਿ ਨ ਆਵੈ ਕੇਹ ॥
ਮਨ ਹਰਿ ਕੇ ਨਾਮ ਕੀ ਪ੍ਰੀਤਿ ਸੁਖਦਾਈ ॥
ਕਰਿ ਕਿਰਪਾ ਨਾਨਕ ਆਪਿ ਲਏ ਲਾਈ ॥੩॥
ਮਿਥਿਆ ਤਨੁ ਧਨੁ ਕੁਟੰਬੁ ਸਬਾਇਆ ॥
ਮਿਥਿਆ ਹਉਮੈ ਮਮਤਾ ਮਾਇਆ ॥
ਮਿਥਿਆ ਰਾਜ ਜੋਬਨ ਧਨ ਮਾਲ ॥
ਮਿਥਿਆ ਕਾਮ ਕ੍ਰੋਧ ਬਿਕਰਾਲ ॥
ਮਿਥਿਆ ਰਥ ਹਸਤੀ ਅਸ੍ਵ ਬਸਤ੍ਰਾ ॥
ਮਿਥਿਆ ਰੰਗ ਸੰਗਿ ਮਾਇਆ ਪੇਖਿ ਹਸਤਾ ॥
ਮਿਥਿਆ ਧ੍ਰੋਹ ਮੋਹ ਅਭਿਮਾਨੁ ॥
ਮਿਥਿਆ ਆਪਸ ਊਪਰਿ ਕਰਤ ਗੁਮਾਨੁ ॥
ਅਸਥਿਰੁ ਭਗਤਿ ਸਾਧ ਕੀ ਸਰਨ ॥
ਨਾਨਕ ਜਪਿ ਜਪਿ ਜੀਵੈ ਹਰਿ ਕੇ ਚਰਨ ॥੪॥
ਮਿਥਿਆ ਸ੍ਰਵਨ ਪਰ ਨਿੰਦਾ ਸੁਨਹਿ ॥
ਮਿਥਿਆ ਹਸਤ ਪਰ ਦਰਬ ਕਉ ਹਿਰਹਿ ॥
ਮਿਥਿਆ ਨੇਤ੍ਰ ਪੇਖਤ ਪਰ ਤ੍ਰਿਅ ਰੂਪਾਦ ॥
ਮਿਥਿਆ ਰਸਨਾ ਭੋਜਨ ਅਨ ਸ੍ਵਾਦ ॥
ਮਿਥਿਆ ਚਰਨ ਪਰ ਬਿਕਾਰ ਕਉ ਧਾਵਹਿ ॥
ਮਿਥਿਆ ਮਨ ਪਰ ਲੋਭ ਲੁਭਾਵਹਿ ॥
ਮਿਥਿਆ ਤਨ ਨਹੀ ਪਰਉਪਕਾਰਾ ॥
ਮਿਥਿਆ ਬਾਸੁ ਲੇਤ ਬਿਕਾਰਾ ॥
ਬਿਨੁ ਬੂਝੇ ਮਿਥਿਆ ਸਭ ਭਏ ॥
ਸਫਲ ਦੇਹ ਨਾਨਕ ਹਰਿ ਹਰਿ ਨਾਮ ਲਏ ॥੫॥
ਬਿਰਥੀ ਸਾਕਤ ਕੀ ਆਰਜਾ ॥
ਸਾਚ ਬਿਨਾ ਕਹ ਹੋਵਤ ਸੂਚਾ ॥
ਬਿਰਥਾ ਨਾਮ ਬਿਨਾ ਤਨੁ ਅੰਧ ॥
ਮੁਖਿ ਆਵਤ ਤਾ ਕੈ ਦੁਰਗੰਧ ॥
ਬਿਨੁ ਸਿਮਰਨ ਦਿਨੁ ਰੈਨਿ ਬ੍ਰਿਥਾ ਬਿਹਾਇ ॥
ਮੇਘ ਬਿਨਾ ਜਿਉ ਖੇਤੀ ਜਾਇ ॥
ਗੋਬਿਦ ਭਜਨ ਬਿਨੁ ਬ੍ਰਿਥੇ ਸਭ ਕਾਮ ॥
ਜਿਉ ਕਿਰਪਨ ਕੇ ਨਿਰਾਰਥ ਦਾਮ ॥
ਧੰਨਿ ਧੰਨਿ ਤੇ ਜਨ ਜਿਹ ਘਟਿ ਬਸਿਓ ਹਰਿ ਨਾਉ ॥
ਨਾਨਕ ਤਾ ਕੈ ਬਲਿ ਬਲਿ ਜਾਉ ॥੬॥
ਰਹਤ ਅਵਰ ਕਛੁ ਅਵਰ ਕਮਾਵਤ ॥
ਮਨਿ ਨਹੀ ਪ੍ਰੀਤਿ ਮੁਖਹੁ ਗੰਢ ਲਾਵਤ ॥
ਜਾਨਨਹਾਰ ਪ੍ਰਭੂ ਪਰਬੀਨ ॥
ਬਾਹਰਿ ਭੇਖ ਨ ਕਾਹੂ ਭੀਨ ॥
ਅਵਰ ਉਪਦੇਸੈ ਆਪਿ ਨ ਕਰੈ ॥
ਆਵਤ ਜਾਵਤ ਜਨਮੈ ਮਰੈ ॥
ਜਿਸ ਕੈ ਅੰਤਰਿ ਬਸੈ ਨਿਰੰਕਾਰੁ ॥
ਤਿਸ ਕੀ ਸੀਖ ਤਰੈ ਸੰਸਾਰੁ ॥
ਜੋ ਤੁਮ ਭਾਨੇ ਤਿਨ ਪ੍ਰਭੁ ਜਾਤਾ ॥
ਨਾਨਕ ਉਨ ਜਨ ਚਰਨ ਪਰਾਤਾ ॥੭॥
ਕਰਉ ਬੇਨਤੀ ਪਾਰਬ੍ਰਹਮੁ ਸਭੁ ਜਾਨੈ ॥
ਅਪਨਾ ਕੀਆ ਆਪਹਿ ਮਾਨੈ ॥
ਆਪਹਿ ਆਪ ਆਪਿ ਕਰਤ ਨਿਬੇਰਾ ॥
ਕਿਸੈ ਦੂਰਿ ਜਨਾਵਤ ਕਿਸੈ ਬੁਝਾਵਤ ਨੇਰਾ ॥
ਉਪਾਵ ਸਿਆਨਪ ਸਗਲ ਤੇ ਰਹਤ ॥
ਸਭੁ ਕਛੁ ਜਾਨੈ ਆਤਮ ਕੀ ਰਹਤ ॥
ਜਿਸੁ ਭਾਵੈ ਤਿਸੁ ਲਏ ਲੜਿ ਲਾਇ ॥
ਥਾਨ ਥਨੰਤਰਿ ਰਹਿਆ ਸਮਾਇ ॥
ਸੋ ਸੇਵਕੁ ਜਿਸੁ ਕਿਰਪਾ ਕਰੀ ॥
ਨਿਮਖ ਨਿਮਖ ਜਪਿ ਨਾਨਕ ਹਰੀ ॥੮॥੫॥
ਸਲੋਕੁ ॥
ਕਾਮ ਕ੍ਰੋਧ ਅਰੁ ਲੋਭ ਮੋਹ ਬਿਨਸਿ ਜਾਇ ਅਹੰਮੇਵ ॥
ਨਾਨਕ ਪ੍ਰਭ ਸਰਣਾਗਤੀ ਕਰਿ ਪ੍ਰਸਾਦੁ ਗੁਰਦੇਵ ॥੧॥`,
        transliteration: `salok |
denahaar prabh chhodd kai laageh aan suaae |
naanak kahoo na seejhee bin naavai pat jaae |1|
asattapadee |
das basatoo le paachhai paavai |
ek basat kaaran bikhott gavaavai |
ek bhee na dee das bhee hir lee |
tau moorraa kahu kahaa karee |
jis tthaakur siau naahee chaaraa |
taa kau keejai sad namasakaaraa |
jaa kai man laagaa prabh meetthaa |
sarab sookh taahoo man vootthaa |
jis jan apanaa hukam manaaeaa |
sarab thok naanak tin paaeaa |1|
aganat saahu apanee de raas |
khaat peet baratai anad ulaas |
apunee amaan kachh bahur saahu lee |
agiaanee man ros karee |
apanee parateet aap hee khovai |
bahur us kaa bisvaas na hovai |
jis kee basat tis aagai raakhai |
prabh kee aagiaa maanai maathai |
aus te chaugun karai nihaal |
naanak saahib sadaa deaal |2|
anik bhaat maaeaa ke het |
sarapar hovat jaan anet |
birakh kee chhaaeaa siau rang laavai |
oeh binasai uhu man pachhutaavai |
jo deesai so chaalanahaar |
lapatt rahio teh andh andhaar |
battaaoo siau jo laavai neh |
taa kau haath na aavai keh |
man har ke naam kee preet sukhadaaee |
kar kirapaa naanak aap le laaee |3|
mithiaa tan dhan kuttanb sabaaeaa |
mithiaa haumai mamataa maaeaa |
mithiaa raaj joban dhan maal |
mithiaa kaam krodh bikaraal |
mithiaa rath hasatee asv basatraa |
mithiaa rang sang maaeaa pekh hasataa |
mithiaa dhroh moh abhimaan |
mithiaa aapas aoopar karat gumaan |
asathir bhagat saadh kee saran |
naanak jap jap jeevai har ke charan |4|
mithiaa sravan par nindaa suneh |
mithiaa hasat par darab kau hireh |
mithiaa netr pekhat par tria roopaad |
mithiaa rasanaa bhojan an svaad |
mithiaa charan par bikaar kau dhaaveh |
mithiaa man par lobh lubhaaveh |
mithiaa tan nahee praupakaaraa |
mithiaa baas let bikaaraa |
bin boojhe mithiaa sabh bhe |
safal deh naanak har har naam le |5|
birathee saakat kee aarajaa |
saach binaa keh hovat soochaa |
birathaa naam binaa tan andh |
mukh aavat taa kai duragandh |
bin simaran din rain brithaa bihaae |
megh binaa jiau khetee jaae |
gobid bhajan bin brithe sabh kaam |
jiau kirapan ke niraarath daam |
dhan dhan te jan jih ghatt basio har naau |
naanak taa kai bal bal jaau |6|
rehat avar kachh avar kamaavat |
man nahee preet mukhahu gandt laavat |
jaananahaar prabhoo parabeen |
baahar bhekh na kaahoo bheen |
avar upadesai aap na karai |
aavat jaavat janamai marai |
jis kai antar basai nirankaar |
tis kee seekh tarai sansaar |
jo tum bhaane tin prabh jaataa |
naanak un jan charan paraataa |7|
krau benatee paarabraham sabh jaanai |
apanaa keea aapeh maanai |
aapeh aap aap karat niberaa |
kisai door janaavat kisai bujhaavat neraa |
aupaav siaanap sagal te rehat |
sabh kachh jaanai aatam kee rehat |
jis bhaavai tis le larr laae |
thaan thanantar rahiaa samaae |
so sevak jis kirapaa karee |
nimakh nimakh jap naanak haree |8|5|
salok |
kaam krodh ar lobh moh binas jaae ahamev |
naanak prabh saranaagatee kar prasaad guradev |1|`,
        meaning: `Salok: One who renounces God the Giver, and attaches himself to other affairs - O Nanak, he shall never succeed. Without the Name, he shall lose his honor. ||1|| Ashtapadee: He obtains ten things, and puts them behind him; for the sake of one thing withheld, he forfeits his faith. But what if that one thing were not given, and the ten were taken away? Then, what could the fool say or do? Our Lord and Master cannot be moved by force. Unto Him, bow forever in adoration. That one, unto whose mind God seems sweet all pleasures come to abide in his mind. One who abides by the Lord's Will, O Nanak, obtains all things. ||1|| God the Banker gives endless capital to the mortal, who eats, drinks and expends it with pleasure and joy. If some of this capital is later taken back by the Banker, the ignorant person shows his anger. He himself destroys his own credibility, and he shall not again be trusted. When one offers to the Lord, that which belongs to the Lord, and willingly abides by the Will of God's Order, the Lord will make him happy four times over. O Nanak, our Lord and Master is merciful forever. ||2|| The many forms of attachment to Maya shall surely pass away - know that they are transitory. People fall in love with the shade of the tree, and when it passes away, they feel regret in their minds. Whatever is seen, shall pass away; and yet, the blindest of the blind cling to it. One who gives her love to a passing traveler nothing shall come into her hands in this way. O mind, the love of the Name of the Lord bestows peace. O Nanak, the Lord, in His Mercy, unites us with Himself. ||3|| False are body, wealth, and all relations. False are ego, possessiveness and Maya. False are power, youth, wealth and property. False are sexual desire and wild anger. False are chariots, elephants, horses and expensive clothes. False is the love of gathering wealth, and reveling in the sight of it. False are deception, emotional attachment and egotistical pride. False are pride and self-conceit. Only devotional worship is permanent, and the Sanctuary of the Holy. Nanak lives by meditating, meditating on the Lotus Feet of the Lord. ||4|| False are the ears which listen to the slander of others. False are the hands which steal the wealth of others. False are the eyes which gaze upon the beauty of another's wife. False is the tongue which enjoys delicacies and external tastes. False are the feet which run to do evil to others. False is the mind which covets the wealth of others. False is the body which does not do good to others. False is the nose which inhales corruption. Without understanding, everything is false. Fruitful is the body, O Nanak, which takes to the Lord's Name. ||5|| The life of the faithless cynic is totally useless. Without the Truth, how can anyone be pure? Useless is the body of the spiritually blind, without the Name of the Lord. From his mouth, a foul smell issues forth. Without the remembrance of the Lord, day and night pass in vain, like the crop which withers without rain. Without meditation on the Lord of the Universe, all works are in vain, like the wealth of a miser, which lies useless. Blessed, blessed are those, whose hearts are filled with the Name of the Lord. Nanak is a sacrifice, a sacrifice to them. ||6|| He says one thing, and does something else. There is no love in his heart, and yet with his mouth he talks tall. The Omniscient Lord God is the Knower of all. He is not impressed by outward display. One who does not practice what he preaches to others, shall come and go in reincarnation, through birth and death. One whose inner being is filled with the Formless Lord by his teachings, the world is saved. Those who are pleasing to You, God, know You. Nanak falls at their feet. ||7|| Offer your prayers to the Supreme Lord God, who knows everything. He Himself values His own creatures. He Himself, by Himself, makes the decisions. To some, He appears far away, while others perceive Him near at hand. He is beyond all efforts and clever tricks. He knows all the ways and means of the soul. Those with whom He is pleased are attached to the hem of His robe. He is pervading all places and interspaces. Those upon whom He bestows His favor, become His servants. Each and every moment, O Nanak, meditate on the Lord. ||8||5|| Salok: Sexual desire, anger, greed and emotional attachment - may these be gone, and egotism as well. Nanak seeks the Sanctuary of God; please bless me with Your Grace, O Divine Guru. ||1||`,
        meaning_pa: `(ਸਾਰੀਆਂ ਦਾਤਾਂ) ਦੇਣ ਵਾਲੇ ਪ੍ਰਭੂ ਨੂੰ ਛੱਡ ਕੇ (ਜੀਵ) ਹੋਰ ਸੁਆਦ ਵਿਚ ਲੱਗਦੇ ਹਨ; (ਪਰ) ਹੇ ਨਾਨਕ! (ਇਹੋ ਜਿਹਾ) ਕਦੇ (ਕੋਈ ਮਨੁੱਖ ਜੀਵਨ-ਯਾਤ੍ਰਾ ਵਿਚ) ਕਾਮਯਾਬ ਨਹੀਂ ਹੁੰਦਾ (ਕਿਉਂਕਿ ਪ੍ਰਭੂ ਦੇ) ਨਾਮ ਤੋਂ ਬਿਨਾ ਇੱਜ਼ਤ ਨਹੀਂ ਰਹਿੰਦੀ ॥੧॥ (ਮਨੁੱਖ ਪ੍ਰਭੂ ਤੋਂ) ਦਸ ਚੀਜ਼ਾਂ ਲੈ ਕੇ ਸਾਂਭ ਲੈਂਦਾ ਹੈ, (ਪਰ) ਇਕ ਚੀਜ਼ ਦੀ ਖ਼ਾਤਰ ਆਪਣਾ ਇਤਬਾਰ ਗਵਾ ਲੈਂਦਾ ਹੈ (ਕਿਉਂਕਿ ਮਿਲੀਆਂ ਚੀਜ਼ਾਂ ਬਦਲੇ ਸ਼ੁਕਰੀਆ ਤਾਂ ਨਹੀਂ ਕਰਦਾ, ਜੇਹੜੀ ਨਹੀਂ ਮਿਲੀ ਉਸ ਦਾ ਗਿਲਾ ਕਰਦਾ ਰਹਿੰਦਾ ਹੈ)। (ਜੇ ਪ੍ਰਭੂ) ਇਕ ਚੀਜ਼ ਭੀ ਨਾਹ ਦੇਵੇ, ਤੇ, ਦਸ (ਦਿੱਤੀਆਂ ਹੋਈਆਂ) ਭੀ ਖੋਹ ਲਏ, ਤਾਂ, ਦੱਸੋ, ਇਹ ਮੂਰਖ ਕੀਹ ਕਰ ਸਕਦਾ ਹੈ? ਜਿਸ ਮਾਲਕ ਦੇ ਨਾਲ ਪੇਸ਼ ਨਹੀਂ ਜਾ ਸਕਦੀ, ਉਸ ਦੇ ਅੱਗੇ ਸਦਾ ਸਿਰ ਨਿਵਾਉਣਾ ਹੀ ਚਾਹੀਦਾ ਹੈ, (ਕਿਉਂਕਿ) ਜਿਸ ਮਨੁੱਖ ਦੇ ਮਨ ਵਿਚ ਪ੍ਰਭੂ ਪਿਆਰਾ ਲੱਗਦਾ ਹੈ, ਸਾਰੇ ਸੁਖ ਉਸੇ ਦੇ ਹਿਰਦੇ ਵਿਚ ਆ ਵੱਸਦੇ ਹਨ। ਜਿਸ ਮਨੁੱਖ ਤੋਂ ਪ੍ਰਭੂ ਆਪਣਾ ਹੁਕਮ ਮਨਾਉਂਦਾ ਹੈ, ਹੇ ਨਾਨਕ! (ਦੁਨੀਆ ਦੇ) ਸਾਰੇ ਪਦਾਰਥ (ਮਾਨੋ) ਉਸ ਨੇ ਲੱਭ ਲਏ ਹਨ ॥੧॥ (ਪ੍ਰਭੂ) ਸ਼ਾਹ ਅਣਗਿਣਤ (ਪਦਾਰਥਾਂ ਦੀ) ਪੂੰਜੀ (ਜੀਵ ਵਣਜਾਰੇ ਨੂੰ) ਦੇਂਦਾ ਹੈ, (ਜੀਵ) ਖਾਂਦਾ ਪੀਂਦਾ ਚਾਉ ਤੇ ਖ਼ੁਸ਼ੀ ਨਾਲ (ਇਹਨਾਂ ਪਦਾਰਥਾਂ ਨੂੰ) ਵਰਤਦਾ ਹੈ। (ਜੇ) ਸ਼ਾਹ ਆਪਣੀ ਕੋਈ ਅਮਾਨਤ ਮੋੜ ਲਏ, ਤਾਂ (ਇਹ) ਅਗਿਆਨੀ ਮਨ ਵਿਚ ਰੋਸਾ ਕਰਦਾ ਹੈ; (ਇਸ ਤਰ੍ਹਾਂ) ਆਪਣਾ ਇਤਬਾਰ ਆਪ ਹੀ ਗਵਾ ਲੈਂਦਾ ਹੈ, ਤੇ ਮੁੜ ਇਸ ਦਾ ਵਿਸਾਹ ਨਹੀਂ ਕੀਤਾ ਜਾਂਦਾ। (ਜੇ) ਜਿਸ ਪ੍ਰਭੂ ਦੀ (ਬਖ਼ਸ਼ੀ ਹੋਈ) ਚੀਜ਼ ਹੈ ਉਸ ਦੇ ਅੱਗੇ (ਆਪ ਹੀ ਖ਼ੁਸ਼ੀ ਨਾਲ) ਰੱਖ ਦਏ, ਤੇ ਪ੍ਰਭੂ ਦਾ ਹੁਕਮ (ਕੋਈ ਚੀਜ਼ ਖੁੱਸਣ ਵੇਲੇ) ਸਿਰ ਮੱਥੇ ਤੇ ਮੰਨ ਲਏ, ਤਾਂ (ਪ੍ਰਭੂ ਉਸ ਨੂੰ) ਅੱਗੇ ਨਾਲੋਂ ਚਉਗੁਣਾ ਨਿਹਾਲ ਕਰਦਾ ਹੈ। ਹੇ ਨਾਨਕ! ਮਾਲਕ ਸਦਾ ਮੇਹਰ ਕਰਨ ਵਾਲਾ ਹੈ ॥੨॥ ਮਾਇਆ ਦੇ ਪਿਆਰ ਅਨੇਕਾਂ ਕਿਸਮਾਂ ਦੇ ਹਨ (ਭਾਵ, ਮਾਇਆ ਦੇ ਅਨੇਕਾਂ ਸੋਹਣੇ ਸਰੂਪ ਮਨੁੱਖ ਦੇ ਮਨ ਨੂੰ ਮੋਂਹਦੇ ਹਨ), (ਪਰ ਇਹ ਸਾਰੇ) ਅੰਤ ਨੂੰ ਨਾਸ ਹੋ ਜਾਣ ਵਾਲੇ ਸਮਝੋ। (ਜੇ ਕੋਈ ਮਨੁੱਖ) ਰੁੱਖ ਦੀ ਛਾਂ ਨਾਲ ਪਿਆਰ ਪਾ ਬੈਠੇ, (ਸਿੱਟਾ ਕੀਹ ਨਿਕਲੇਗਾ?) ਉਹ ਛਾਂ ਨਾਸ ਹੋ ਜਾਂਦੀ ਹੈ, ਤੇ, ਉਹ ਮਨੁੱਖ ਮਨ ਵਿਚ ਪਛੁਤਾਂਦਾ ਹੈ। (ਇਹ ਸਾਰਾ ਜਗਤ) ਜੋ ਦਿੱਸ ਰਿਹਾ ਹੈ ਨਾਸਵੰਤ ਹੈ, ਇਸ (ਜਗਤ) ਨਾਲ ਇਹ ਅੰਨ੍ਹਿਆਂ ਦਾ ਅੰਨ੍ਹਾ (ਜੀਵ) ਜੱਫਾ ਪਾਈ ਬੈਠਾ ਹੈ। ਜੋ (ਭੀ) ਮਨੁੱਖ (ਕਿਸੇ) ਰਾਹੀ ਨਾਲ ਪਿਆਰ ਪਾ ਲੈਂਦਾ ਹੈ, (ਅੰਤ ਨੂੰ) ਉਸ ਦੇ ਹੱਥ ਪੱਲੇ ਕੁਝ ਨਹੀਂ ਪੈਂਦਾ। ਹੇ ਮਨ! ਪ੍ਰਭੂ ਦੇ ਨਾਮ ਦਾ ਪਿਆਰ (ਹੀ) ਸੁਖ ਦੇਣ ਵਾਲਾ ਹੈ; (ਪਰ) ਹੇ ਨਾਨਕ! (ਇਹ ਪਿਆਰ ਉਸ ਮਨੁੱਖ ਨੂੰ ਨਸੀਬ ਹੁੰਦਾ ਹੈ, ਜਿਸ ਨੂੰ) ਪ੍ਰਭੂ ਮੇਹਰ ਕਰ ਕੇ ਆਪ ਲਾਉਂਦਾ ਹੈ ॥੩॥ (ਜਦ ਇਹ) ਸਰੀਰ, ਧਨ ਤੇ ਸਾਰਾ ਪਰਵਾਰ ਨਾਸਵੰਤ ਹੈ, (ਤਾਂ) ਮਾਇਆ ਦੀ ਮਾਲਕੀ ਤੇ ਹਉਮੈ (ਭਾਵ, ਧਨ ਤੇ ਪਰਵਾਰ ਦੇ ਕਾਰਣ ਵਡੱਪਣ)-ਇਹਨਾਂ ਉਤੇ ਮਾਣ ਭੀ ਝੂਠਾ। ਰਾਜ ਜੁਆਨੀ ਤੇ ਧਨ ਮਾਲ ਸਭ ਨਾਸਵੰਤ ਹਨ, (ਇਸ ਵਾਸਤੇ ਇਹਨਾਂ ਦੇ ਕਾਰਣ) ਕਾਮ (ਦੀ ਲਹਰ) ਤੇ ਭਿਆਨਕ ਕ੍ਰੋਧ ਇਹ ਭੀ ਵਿਅਰਥ ਹਨ। ਰਥ, ਹਾਥੀ, ਘੋੜੇ ਤੇ (ਸੁੰਦਰ) ਕੱਪੜੇ ਸਦਾ ਕਾਇਮ ਰਹਿਣ ਵਾਲੇ ਨਹੀਂ ਹਨ, (ਇਸ ਸਾਰੀ) ਮਾਇਆ ਨੂੰ ਪਿਆਰ ਨਾਲ ਵੇਖ ਕੇ (ਜੀਵ) ਹੱਸਦਾ ਹੈ, (ਪਰ ਇਹ ਹਾਸਾ ਤੇ ਮਾਣ ਭੀ) ਵਿਅਰਥ ਹੈ। ਦਗ਼ਾ, ਮੋਹ ਤੇ ਅਹੰਕਾਰ-(ਇਹ ਸਾਰੇ ਹੀ ਮਨ ਦੇ) ਵਿਅਰਥ (ਤਰੰਗ) ਹਨ; ਆਪਣੇ ਉਤੇ ਮਾਣ ਕਰਨਾ ਭੀ ਝੂਠਾ (ਨਸ਼ਾ) ਹੈ। ਸਦਾ ਕਾਇਮ ਰਹਿਣ ਵਾਲੀ (ਪ੍ਰਭੂ ਦੀ) ਭਗਤੀ (ਹੀ ਹੈ ਜੋ) ਗੁਰੂ ਦੀ ਸਰਣ ਪੈ ਕੇ (ਕੀਤੀ ਜਾਏ)। ਹੇ ਨਾਨਕ! ਪ੍ਰਭੂ ਦੇ ਚਰਣ (ਹੀ) ਸਦਾ ਜਪ ਕੇ (ਮਨੁੱਖ) ਅਸਲੀ ਜੀਵਨ ਜੀਊਂਦਾ ਹੈ ॥੪॥ (ਮਨੁੱਖ ਦੇ) ਕੰਨ ਵਿਅਰਥ ਹਨ (ਜੇ ਉਹ) ਪਰਾਈ ਬਖ਼ੀਲੀ ਸੁਣਦੇ ਹਨ, ਹੱਥ ਵਿਅਰਥ ਹਨ (ਜੇ ਇਹ) ਪਰਾਏ ਧਨ ਨੂੰ ਚੁਰਾਉਂਦੇ ਹਨ; ਅੱਖਾਂ ਵਿਅਰਥ ਹਨ (ਜੋ ਇਹ) ਪਰਾਈ ਜ਼ਨਾਨੀ ਦਾ ਰੂਪ ਤੱਕਦੀਆਂ ਹਨ, ਜੀਭ ਵਿਅਰਥ ਹੈ (ਜੇ ਇਹ) ਖਾਣੇ ਤੇ ਹੋਰ ਸੁਆਦਾਂ ਵਿਚ (ਲੱਗੀ ਹੋਈ ਹੈ); ਪੈਰ ਵਿਅਰਥ ਹਨ (ਜੇ ਇਹ) ਪਰਾਏ ਨੁਕਸਾਨ ਵਾਸਤੇ ਦੌੜ-ਭੱਜ ਰਹੇ ਹਨ। ਹੇ ਮਨ! ਤੂੰ ਭੀ ਵਿਅਰਥ ਹੈਂ (ਜੇ ਤੂੰ) ਪਰਾਏ ਧਨ ਦਾ ਲੋਭ ਕਰ ਰਿਹਾ ਹੈਂ। (ਉਹ) ਸਰੀਰ ਵਿਅਰਥ ਹਨ ਜੋ ਦੂਜਿਆਂ ਨਾਲ ਭਲਾਈ ਨਹੀਂ ਕਰਦੇ, (ਨੱਕ) ਵਿਅਰਥ ਹੈ (ਜੋ) ਵਿਕਾਰਾਂ ਦੀ ਵਾਸ਼ਨਾ ਲੈ ਰਿਹਾ ਹੈ। (ਆਪੋ ਆਪਣੀ ਹੋਂਦ ਦਾ ਮਨੋਰਥ) ਸਮਝਣ ਤੋਂ ਬਿਨਾ (ਇਹ) ਸਾਰੇ (ਅੰਗ) ਵਿਅਰਥ ਹਨ। ਹੇ ਨਾਨਕ! ਉਹ ਸਰੀਰ ਸਫਲ ਹੈ ਜੋ ਪ੍ਰਭੂ ਦਾ ਨਾਮ ਜਪਦਾ ਹੈ ॥੫॥ (ਰੱਬ ਨਾਲੋਂ) ਟੁੱਟੇ ਹੋਏ ਮਨੁੱਖ ਦੀ ਉਮਰ ਵਿਅਰਥ ਜਾਂਦੀ ਹੈ, (ਕਿਉਂਕਿ) ਸੱਚੇ ਪ੍ਰਭੂ (ਦੇ ਨਾਮ) ਤੋਂ ਬਿਨਾ ਉਹ ਕਿਵੇਂ ਸੁੱਚਾ ਹੋ ਸਕਦਾ ਹੈ? ਨਾਮ ਤੋਂ ਬਿਨਾ ਅੰਨ੍ਹੇ (ਸਾਕਤ) ਦਾ ਸਰੀਰ (ਹੀ) ਕਿਸੇ ਕੰਮ ਨਹੀਂ, (ਕਿਉਂਕਿ) ਉਸ ਦੇ ਮੂੰਹ ਵਿਚੋਂ (ਨਿੰਦਾ ਆਦਿਕ) ਬਦ-ਬੂ ਆਉਂਦੀ ਹੈ। ਜਿਵੇਂ ਵਰਖਾ ਤੋਂ ਬਿਨਾ ਪੈਲੀ ਨਿਸਫਲ ਜਾਂਦੀ ਹੈ, (ਤਿਵੇਂ) ਸਿਮਰਨ ਤੋਂ ਬਿਨਾ (ਸਾਕਤ ਦੇ) ਦਿਨ ਰਾਤ ਅੱਫਲ ਚਲੇ ਜਾਂਦੇ ਹਨ, ਪ੍ਰਭੂ ਦੇ ਭਜਨ ਤੋਂ ਸੱਖਣਾ ਰਹਿਣ ਕਰਕੇ (ਮਨੁੱਖ ਦੇ) ਸਾਰੇ ਹੀ ਕੰਮ ਕਿਸੇ ਅਰਥ ਨਹੀਂ, (ਕਿਉਂਕਿ ਇਹ ਕੰਮ ਇਸ ਦਾ ਆਪਣਾ ਕੁਝ ਨਹੀਂ ਸਵਾਰਦੇ) ਜਿਵੇਂ ਕੰਜੂਸ ਦਾ ਧਨ ਉਸ ਦੇ ਆਪਣੇ ਕਿਸੇ ਕੰਮ ਨਹੀਂ। ਉਹ ਮਨੁੱਖ ਮੁਬਾਰਿਕ ਹਨ, ਜਿਨ੍ਹਾਂ ਦੇ ਹਿਰਦੇ ਵਿਚ ਪ੍ਰਭੂ ਦਾ ਨਾਮ ਵੱਸਦਾ ਹੈ, ਹੇ ਨਾਨਕ! (ਆਖ ਕਿ) ਮੈਂ ਉਹਨਾਂ (ਗੁਰਮੁਖਾਂ) ਤੋਂ ਸਦਕੇ ਜਾਂਦਾ ਹਾਂ ॥੬॥ ਧਰਮ ਦੇ ਬਾਹਰਲੇ ਧਾਰੇ ਹੋਏ ਚਿੰਨ੍ਹ ਹੋਰ ਹਨ ਤੇ ਅਮਲੀ ਜ਼ਿੰਦਗੀ ਕੁਝ ਹੋਰ ਹੈ; ਮਨ ਵਿਚ (ਤਾਂ) ਪ੍ਰਭੂ ਨਾਲ ਪਿਆਰ ਨਹੀਂ, ਮੂੰਹ ਦੀਆਂ ਗੱਲਾਂ ਨਾਲ ਘਰ ਪੂਰਾ ਕਰਦਾ ਹੈ। (ਪਰ ਦਿਲ ਦੀਆਂ) ਜਾਣਨ ਵਾਲਾ ਪ੍ਰਭੂ ਸਿਆਣਾ ਹੈ, (ਉਹ ਕਦੇ) ਕਿਸੇ ਦੇ ਬਾਹਰਲੇ ਭੇਖ ਨਾਲ ਪ੍ਰਸੰਨ ਨਹੀਂ ਹੋਇਆ। (ਜੋ ਮਨੁੱਖ) ਹੋਰਨਾਂ ਨੂੰ ਮੱਤਾਂ ਦੇਂਦਾ ਹੈ (ਪਰ) ਆਪ ਨਹੀਂ ਕਮਾਉਂਦਾ, ਉਹ ਸਦਾ ਜਨਮ ਮਰਨ ਦੇ ਗੇੜ ਵਿਚ ਪਿਆ ਰਹਿੰਦਾ ਹੈ। ਜਿਸ ਮਨੁੱਖ ਦੇ ਹਿਰਦੇ ਵਿਚ ਨਿਰੰਕਾਰ ਵੱਸਦਾ ਹੈ, ਉਸ ਦੀ ਸਿੱਖਿਆ ਨਾਲ ਜਗਤ (ਵਿਕਾਰਾਂ ਤੋਂ) ਬਚਦਾ ਹੈ। (ਹੇ ਪ੍ਰਭੂ!) ਜੋ (ਭਗਤ) ਤੈਨੂੰ ਪਿਆਰੇ ਲੱਗਦੇ ਹਨ ਉਹਨਾਂ ਨੇ ਤੈਨੂੰ ਪਛਾਣਿਆ ਹੈ। ਹੇ ਨਾਨਕ! (ਆਖ)-ਮੈਂ ਉਹਨਾਂ (ਭਗਤਾਂ) ਦੇ ਚਰਨਾਂ ਤੇ ਪੈਂਦਾ ਹਾਂ ॥੭॥ (ਜੋ ਜੋ) ਬੇਨਤੀ ਮੈਂ ਕਰਦਾ ਹਾਂ, ਪ੍ਰਭੂ ਸਭ ਜਾਣਦਾ ਹੈ, ਆਪਣੇ ਪੈਦਾ ਕੀਤੇ ਜੀਵ ਨੂੰ ਉਹ ਆਪ ਹੀ ਮਾਣ ਬਖ਼ਸ਼ਦਾ ਹੈ। (ਜੀਵਾਂ ਦੇ ਕੀਤੇ ਕਰਮਾਂ ਅਨੁਸਾਰ) ਪ੍ਰਭੂ ਆਪ ਹੀ ਨਿਖੇੜਾ ਕਰਦਾ ਹੈ, (ਭਾਵ) ਕਿਸੇ ਨੂੰ ਇਹ ਬੁਧਿ ਬਖ਼ਸ਼ਦਾ ਹੈ ਕਿ ਪ੍ਰਭੂ ਸਾਡੇ ਨੇੜੇ ਹੈ ਤੇ ਕਿਸੇ ਨੂੰ ਜਣਾਉਂਦਾ ਹੈ ਕਿ ਪ੍ਰਭੂ ਕਿਤੇ ਦੂਰ ਹੈ। ਸਭ ਹੀਲਿਆਂ ਤੇ ਚਤੁਰਾਈਆਂ ਤੋਂ (ਪ੍ਰਭੂ) ਪਰੇ ਹੈ (ਭਾਵ, ਕਿਸੇ ਹੀਲੇ ਚਤੁਰਾਈ ਨਾਲ ਪ੍ਰਸੰਨ ਨਹੀਂ ਹੁੰਦਾ) (ਕਿਉਂਕਿ ਉਹ ਜੀਵ ਦੀ) ਆਤਮਕ ਰਹਿਣੀ ਦੀ ਹਰੇਕ ਗੱਲ ਜਾਣਦਾ ਹੈ। ਜੋ (ਜੀਵ) ਉਸ ਨੂੰ ਭਾਉਂਦਾ ਹੈ ਉਸ ਨੂੰ ਆਪਣੇ ਲੜ ਲਾਉਂਦਾ ਹੈ, ਪ੍ਰਭੂ ਹਰ ਥਾਂ ਮੌਜੂਦ ਹੈ। ਉਹੀ ਮਨੁੱਖ (ਅਸਲੀ) ਸੇਵਕ ਬਣਦਾ ਹੈ ਜਿਸ ਉਤੇ ਪ੍ਰਭੂ ਮੇਹਰ ਕਰਦਾ ਹੈ। ਹੇ ਨਾਨਕ! (ਐਸੇ) ਪ੍ਰਭੂ ਨੂੰ ਦਮ-ਬ-ਦਮ ਯਾਦ ਕਰ ॥੮॥੫॥ (ਮੇਰਾ) ਕਾਮ, ਕ੍ਰੋਧ, ਲੋਭ, ਮੋਹ ਅਤੇ ਅਹੰਕਾਰ ਦੂਰ ਹੋ ਜਾਏ- ਹੇ ਨਾਨਕ! (ਬੇਨਤੀ ਕਰ ਤੇ ਆਖ)-ਹੇ ਗੁਰਦੇਵ! ਹੇ ਪ੍ਰਭੂ! ਮੈਂ ਸਰਣ ਆਇਆ ਹਾਂ (ਮੇਰੇ ਉਤੇ) ਮੇਹਰ ਕਰ ॥੧॥`
      },
      {
        number: 6,
        sanskrit: `ਸਲੋਕੁ ॥
ਕਾਮ ਕ੍ਰੋਧ ਅਰੁ ਲੋਭ ਮੋਹ ਬਿਨਸਿ ਜਾਇ ਅਹੰਮੇਵ ॥
ਨਾਨਕ ਪ੍ਰਭ ਸਰਣਾਗਤੀ ਕਰਿ ਪ੍ਰਸਾਦੁ ਗੁਰਦੇਵ ॥੧॥
ਅਸਟਪਦੀ ॥
ਜਿਹ ਪ੍ਰਸਾਦਿ ਛਤੀਹ ਅੰਮ੍ਰਿਤ ਖਾਹਿ ॥
ਤਿਸੁ ਠਾਕੁਰ ਕਉ ਰਖੁ ਮਨ ਮਾਹਿ ॥
ਜਿਹ ਪ੍ਰਸਾਦਿ ਸੁਗੰਧਤ ਤਨਿ ਲਾਵਹਿ ॥
ਤਿਸ ਕਉ ਸਿਮਰਤ ਪਰਮ ਗਤਿ ਪਾਵਹਿ ॥
ਜਿਹ ਪ੍ਰਸਾਦਿ ਬਸਹਿ ਸੁਖ ਮੰਦਰਿ ॥
ਤਿਸਹਿ ਧਿਆਇ ਸਦਾ ਮਨ ਅੰਦਰਿ ॥
ਜਿਹ ਪ੍ਰਸਾਦਿ ਗ੍ਰਿਹ ਸੰਗਿ ਸੁਖ ਬਸਨਾ ॥
ਆਠ ਪਹਰ ਸਿਮਰਹੁ ਤਿਸੁ ਰਸਨਾ ॥
ਜਿਹ ਪ੍ਰਸਾਦਿ ਰੰਗ ਰਸ ਭੋਗ ॥
ਨਾਨਕ ਸਦਾ ਧਿਆਈਐ ਧਿਆਵਨ ਜੋਗ ॥੧॥
ਜਿਹ ਪ੍ਰਸਾਦਿ ਪਾਟ ਪਟੰਬਰ ਹਢਾਵਹਿ ॥
ਤਿਸਹਿ ਤਿਆਗਿ ਕਤ ਅਵਰ ਲੁਭਾਵਹਿ ॥
ਜਿਹ ਪ੍ਰਸਾਦਿ ਸੁਖਿ ਸੇਜ ਸੋਈਜੈ ॥
ਮਨ ਆਠ ਪਹਰ ਤਾ ਕਾ ਜਸੁ ਗਾਵੀਜੈ ॥
ਜਿਹ ਪ੍ਰਸਾਦਿ ਤੁਝੁ ਸਭੁ ਕੋਊ ਮਾਨੈ ॥
ਮੁਖਿ ਤਾ ਕੋ ਜਸੁ ਰਸਨ ਬਖਾਨੈ ॥
ਜਿਹ ਪ੍ਰਸਾਦਿ ਤੇਰੋ ਰਹਤਾ ਧਰਮੁ ॥
ਮਨ ਸਦਾ ਧਿਆਇ ਕੇਵਲ ਪਾਰਬ੍ਰਹਮੁ ॥
ਪ੍ਰਭ ਜੀ ਜਪਤ ਦਰਗਹ ਮਾਨੁ ਪਾਵਹਿ ॥
ਨਾਨਕ ਪਤਿ ਸੇਤੀ ਘਰਿ ਜਾਵਹਿ ॥੨॥
ਜਿਹ ਪ੍ਰਸਾਦਿ ਆਰੋਗ ਕੰਚਨ ਦੇਹੀ ॥
ਲਿਵ ਲਾਵਹੁ ਤਿਸੁ ਰਾਮ ਸਨੇਹੀ ॥
ਜਿਹ ਪ੍ਰਸਾਦਿ ਤੇਰਾ ਓਲਾ ਰਹਤ ॥
ਮਨ ਸੁਖੁ ਪਾਵਹਿ ਹਰਿ ਹਰਿ ਜਸੁ ਕਹਤ ॥
ਜਿਹ ਪ੍ਰਸਾਦਿ ਤੇਰੇ ਸਗਲ ਛਿਦ੍ਰ ਢਾਕੇ ॥
ਮਨ ਸਰਨੀ ਪਰੁ ਠਾਕੁਰ ਪ੍ਰਭ ਤਾ ਕੈ ॥
ਜਿਹ ਪ੍ਰਸਾਦਿ ਤੁਝੁ ਕੋ ਨ ਪਹੂਚੈ ॥
ਮਨ ਸਾਸਿ ਸਾਸਿ ਸਿਮਰਹੁ ਪ੍ਰਭ ਊਚੇ ॥
ਜਿਹ ਪ੍ਰਸਾਦਿ ਪਾਈ ਦ੍ਰੁਲਭ ਦੇਹ ॥
ਨਾਨਕ ਤਾ ਕੀ ਭਗਤਿ ਕਰੇਹ ॥੩॥
ਜਿਹ ਪ੍ਰਸਾਦਿ ਆਭੂਖਨ ਪਹਿਰੀਜੈ ॥
ਮਨ ਤਿਸੁ ਸਿਮਰਤ ਕਿਉ ਆਲਸੁ ਕੀਜੈ ॥
ਜਿਹ ਪ੍ਰਸਾਦਿ ਅਸ੍ਵ ਹਸਤਿ ਅਸਵਾਰੀ ॥
ਮਨ ਤਿਸੁ ਪ੍ਰਭ ਕਉ ਕਬਹੂ ਨ ਬਿਸਾਰੀ ॥
ਜਿਹ ਪ੍ਰਸਾਦਿ ਬਾਗ ਮਿਲਖ ਧਨਾ ॥
ਰਾਖੁ ਪਰੋਇ ਪ੍ਰਭੁ ਅਪੁਨੇ ਮਨਾ ॥
ਜਿਨਿ ਤੇਰੀ ਮਨ ਬਨਤ ਬਨਾਈ ॥
ਊਠਤ ਬੈਠਤ ਸਦ ਤਿਸਹਿ ਧਿਆਈ ॥
ਤਿਸਹਿ ਧਿਆਇ ਜੋ ਏਕ ਅਲਖੈ ॥
ਈਹਾ ਊਹਾ ਨਾਨਕ ਤੇਰੀ ਰਖੈ ॥੪॥
ਜਿਹ ਪ੍ਰਸਾਦਿ ਕਰਹਿ ਪੁੰਨ ਬਹੁ ਦਾਨ ॥
ਮਨ ਆਠ ਪਹਰ ਕਰਿ ਤਿਸ ਕਾ ਧਿਆਨ ॥
ਜਿਹ ਪ੍ਰਸਾਦਿ ਤੂ ਆਚਾਰ ਬਿਉਹਾਰੀ ॥
ਤਿਸੁ ਪ੍ਰਭ ਕਉ ਸਾਸਿ ਸਾਸਿ ਚਿਤਾਰੀ ॥
ਜਿਹ ਪ੍ਰਸਾਦਿ ਤੇਰਾ ਸੁੰਦਰ ਰੂਪੁ ॥
ਸੋ ਪ੍ਰਭੁ ਸਿਮਰਹੁ ਸਦਾ ਅਨੂਪੁ ॥
ਜਿਹ ਪ੍ਰਸਾਦਿ ਤੇਰੀ ਨੀਕੀ ਜਾਤਿ ॥
ਸੋ ਪ੍ਰਭੁ ਸਿਮਰਿ ਸਦਾ ਦਿਨ ਰਾਤਿ ॥
ਜਿਹ ਪ੍ਰਸਾਦਿ ਤੇਰੀ ਪਤਿ ਰਹੈ ॥
ਗੁਰ ਪ੍ਰਸਾਦਿ ਨਾਨਕ ਜਸੁ ਕਹੈ ॥੫॥
ਜਿਹ ਪ੍ਰਸਾਦਿ ਸੁਨਹਿ ਕਰਨ ਨਾਦ ॥
ਜਿਹ ਪ੍ਰਸਾਦਿ ਪੇਖਹਿ ਬਿਸਮਾਦ ॥
ਜਿਹ ਪ੍ਰਸਾਦਿ ਬੋਲਹਿ ਅੰਮ੍ਰਿਤ ਰਸਨਾ ॥
ਜਿਹ ਪ੍ਰਸਾਦਿ ਸੁਖਿ ਸਹਜੇ ਬਸਨਾ ॥
ਜਿਹ ਪ੍ਰਸਾਦਿ ਹਸਤ ਕਰ ਚਲਹਿ ॥
ਜਿਹ ਪ੍ਰਸਾਦਿ ਸੰਪੂਰਨ ਫਲਹਿ ॥
ਜਿਹ ਪ੍ਰਸਾਦਿ ਪਰਮ ਗਤਿ ਪਾਵਹਿ ॥
ਜਿਹ ਪ੍ਰਸਾਦਿ ਸੁਖਿ ਸਹਜਿ ਸਮਾਵਹਿ ॥
ਐਸਾ ਪ੍ਰਭੁ ਤਿਆਗਿ ਅਵਰ ਕਤ ਲਾਗਹੁ ॥
ਗੁਰ ਪ੍ਰਸਾਦਿ ਨਾਨਕ ਮਨਿ ਜਾਗਹੁ ॥੬॥
ਜਿਹ ਪ੍ਰਸਾਦਿ ਤੂੰ ਪ੍ਰਗਟੁ ਸੰਸਾਰਿ ॥
ਤਿਸੁ ਪ੍ਰਭ ਕਉ ਮੂਲਿ ਨ ਮਨਹੁ ਬਿਸਾਰਿ ॥
ਜਿਹ ਪ੍ਰਸਾਦਿ ਤੇਰਾ ਪਰਤਾਪੁ ॥
ਰੇ ਮਨ ਮੂੜ ਤੂ ਤਾ ਕਉ ਜਾਪੁ ॥
ਜਿਹ ਪ੍ਰਸਾਦਿ ਤੇਰੇ ਕਾਰਜ ਪੂਰੇ ॥
ਤਿਸਹਿ ਜਾਨੁ ਮਨ ਸਦਾ ਹਜੂਰੇ ॥
ਜਿਹ ਪ੍ਰਸਾਦਿ ਤੂੰ ਪਾਵਹਿ ਸਾਚੁ ॥
ਰੇ ਮਨ ਮੇਰੇ ਤੂੰ ਤਾ ਸਿਉ ਰਾਚੁ ॥
ਜਿਹ ਪ੍ਰਸਾਦਿ ਸਭ ਕੀ ਗਤਿ ਹੋਇ ॥
ਨਾਨਕ ਜਾਪੁ ਜਪੈ ਜਪੁ ਸੋਇ ॥੭॥
ਆਪਿ ਜਪਾਏ ਜਪੈ ਸੋ ਨਾਉ ॥
ਆਪਿ ਗਾਵਾਏ ਸੁ ਹਰਿ ਗੁਨ ਗਾਉ ॥
ਪ੍ਰਭ ਕਿਰਪਾ ਤੇ ਹੋਇ ਪ੍ਰਗਾਸੁ ॥
ਪ੍ਰਭੂ ਦਇਆ ਤੇ ਕਮਲ ਬਿਗਾਸੁ ॥
ਪ੍ਰਭ ਸੁਪ੍ਰਸੰਨ ਬਸੈ ਮਨਿ ਸੋਇ ॥
ਪ੍ਰਭ ਦਇਆ ਤੇ ਮਤਿ ਊਤਮ ਹੋਇ ॥
ਸਰਬ ਨਿਧਾਨ ਪ੍ਰਭ ਤੇਰੀ ਮਇਆ ॥
ਆਪਹੁ ਕਛੂ ਨ ਕਿਨਹੂ ਲਇਆ ॥
ਜਿਤੁ ਜਿਤੁ ਲਾਵਹੁ ਤਿਤੁ ਲਗਹਿ ਹਰਿ ਨਾਥ ॥
ਨਾਨਕ ਇਨ ਕੈ ਕਛੂ ਨ ਹਾਥ ॥੮॥੬॥
ਸਲੋਕੁ ॥
ਅਗਮ ਅਗਾਧਿ ਪਾਰਬ੍ਰਹਮੁ ਸੋਇ ॥
ਜੋ ਜੋ ਕਹੈ ਸੁ ਮੁਕਤਾ ਹੋਇ ॥
ਸੁਨਿ ਮੀਤਾ ਨਾਨਕੁ ਬਿਨਵੰਤਾ ॥
ਸਾਧ ਜਨਾ ਕੀ ਅਚਰਜ ਕਥਾ ॥੧॥`,
        transliteration: `salok |
kaam krodh ar lobh moh binas jaae ahamev |
naanak prabh saranaagatee kar prasaad guradev |1|
asattapadee |
jih prasaad chhateeh amrit khaeh |
tis tthaakur kau rakh man maeh |
jih prasaad sugandhat tan laaveh |
tis kau simarat param gat paaveh |
jih prasaad baseh sukh mandar |
tiseh dhiaae sadaa man andar |
jih prasaad grih sang sukh basanaa |
aatth pehar simarahu tis rasanaa |
jih prasaad rang ras bhog |
naanak sadaa dhiaaeeai dhiaavan jog |1|
jih prasaad paatt pattanbar hadtaaveh |
tiseh tiaag kat avar lubhaaveh |
jih prasaad sukh sej soeejai |
man aatth pehar taa kaa jas gaaveejai |
jih prasaad tujh sabh koaoo maanai |
mukh taa ko jas rasan bakhaanai |
jih prasaad tero rahataa dharam |
man sadaa dhiaae keval paarabraham |
prabh jee japat daragah maan paaveh |
naanak pat setee ghar jaaveh |2|
jih prasaad aarog kanchan dehee |
liv laavahu tis raam sanehee |
jih prasaad teraa olaa rehat |
man sukh paaveh har har jas kehat |
jih prasaad tere sagal chhidr dtaake |
man saranee par tthaakur prabh taa kai |
jih prasaad tujh ko na pahoochai |
man saas saas simarahu prabh aooche |
jih prasaad paaee drulabh deh |
naanak taa kee bhagat kareh |3|
jih prasaad aabhookhan pahireejai |
man tis simarat kiau aalas keejai |
jih prasaad asv hasat asavaaree |
man tis prabh kau kabahoo na bisaaree |
jih prasaad baag milakh dhanaa |
raakh paroe prabh apune manaa |
jin teree man banat banaaee |
aootthat baitthat sad tiseh dhiaaee |
tiseh dhiaae jo ek alakhai |
eehaa aoohaa naanak teree rakhai |4|
jih prasaad kareh pun bahu daan |
man aatth pehar kar tis kaa dhiaan |
jih prasaad too aachaar biauhaaree |
tis prabh kau saas saas chitaaree |
jih prasaad teraa sundar roop |
so prabh simarahu sadaa anoop |
jih prasaad teree neekee jaat |
so prabh simar sadaa din raat |
jih prasaad teree pat rahai |
gur prasaad naanak jas kahai |5|
jih prasaad suneh karan naad |
jih prasaad pekheh bisamaad |
jih prasaad boleh amrit rasanaa |
jih prasaad sukh sahaje basanaa |
jih prasaad hasat kar chaleh |
jih prasaad sanpooran faleh |
jih prasaad param gat paaveh |
jih prasaad sukh sehaj samaaveh |
aisaa prabh tiaag avar kat laagahu |
gur prasaad naanak man jaagahu |6|
jih prasaad toon pragatt sansaar |
tis prabh kau mool na manahu bisaar |
jih prasaad teraa parataap |
re man moorr too taa kau jaap |
jih prasaad tere kaaraj poore |
tiseh jaan man sadaa hajoore |
jih prasaad toon paaveh saach |
re man mere toon taa siau raach |
jih prasaad sabh kee gat hoe |
naanak jaap japai jap soe |7|
aap japaae japai so naau |
aap gaavaae su har gun gaau |
prabh kirapaa te hoe pragaas |
prabhoo deaa te kamal bigaas |
prabh suprasan basai man soe |
prabh deaa te mat aootam hoe |
sarab nidhaan prabh teree meaa |
aapahu kachhoo na kinahoo leaa |
jit jit laavahu tith lageh har naath |
naanak in kai kachhoo na haath |8|6|
salok |
agam agaadh paarabraham soe |
jo jo kahai su mukataa hoe |
sun meetaa naanak binavantaa |
saadh janaa kee acharaj kathaa |1|`,
        meaning: `Salok: Sexual desire, anger, greed and emotional attachment - may these be gone, and egotism as well. Nanak seeks the Sanctuary of God; please bless me with Your Grace, O Divine Guru. ||1|| Ashtapadee: By His Grace, you partake of the thirty-six delicacies; enshrine that Lord and Master within your mind. By His Grace, you apply scented oils to your body; remembering Him, the supreme status is obtained. By His Grace, you dwell in the palace of peace; meditate forever on Him within your mind. By His Grace, you abide with your family in peace; keep His remembrance upon your tongue, twenty-four hours a day. By His Grace, you enjoy tastes and pleasures; O Nanak, meditate forever on the One, who is worthy of meditation. ||1|| By His Grace, you wear silks and satins; why abandon Him, to attach yourself to another? By His Grace, you sleep in a cozy bed; O my mind, sing His Praises, twenty-four hours a day. By His Grace, you are honored by everyone; with your mouth and with your tongue, chant His Praises. By His Grace, you remain in the Dharma; O mind, meditate continually on the Supreme Lord God. Meditating on God, you shall be honored in His Court; O Nanak, you shall return to your true home with honor. ||2|| By His Grace, you have a healthy, golden body; attune yourself to that Loving Lord. By His Grace, your honor is preserved; O mind, chant the Praises of the Lord, Har, Har, and find peace. By His Grace, all your deficits are covered; O mind, seek the Sanctuary of God, our Lord and Master. By His Grace, no one can rival you; O mind, with each and every breath, remember God on High. By His Grace, you obtained this precious human body; O Nanak, worship Him with devotion. ||3|| By His Grace, you wear decorations; O mind, why are you so lazy? Why don't you remember Him in meditation? By His Grace, you have horses and elephants to ride; O mind, never forget that God. By His Grace, you have land, gardens and wealth; keep God enshrined in your heart. O mind, the One who formed your form standing up and sitting down, meditate always on Him. Meditate on Him - the One Invisible Lord; here and hereafter, O Nanak, He shall save you. ||4|| By His Grace, you give donations in abundance to charities; O mind, meditate on Him, twenty-four hours a day. By His Grace, you perform religious rituals and worldly duties; think of God with each and every breath. By His Grace, your form is so beautiful; constantly remember God, the Incomparably Beautiful One. By His Grace, you have such high social status; remember God always, day and night. By His Grace, your honor is preserved; by Guru's Grace, O Nanak, chant His Praises. ||5|| By His Grace, you listen to the sound current of the Naad. By His Grace, you behold amazing wonders. By His Grace, you speak ambrosial words with your tongue. By His Grace, you abide in peace and ease. By His Grace, your hands move and work. By His Grace, you are completely fulfilled. By His Grace, you obtain the supreme status. By His Grace, you are absorbed into celestial peace. Why forsake God, and attach yourself to another? By Guru's Grace, O Nanak, awaken your mind! ||6|| By His Grace, you are famous all over the world; never forget God from your mind. By His Grace, you have prestige; O foolish mind, meditate on Him! By His Grace, your works are completed; O mind, know Him to be close at hand. By His Grace, you find the Truth; O my mind, merge yourself into Him. By His Grace, everyone is saved; O Nanak, meditate, and chant His Chant. ||7|| Those, whom He inspires to chant, chant His Name. Those, whom He inspires to sing, sing the Glorious Praises of the Lord. By God's Grace, enlightenment comes. By God's Kind Mercy, the heart-lotus blossoms forth. When God is totally pleased, He comes to dwell in the mind. By God's Kind Mercy, the intellect is exalted. All treasures, O Lord, come by Your Kind Mercy. No one obtains anything by himself. As You have delegated, so do we apply ourselves, O Lord and Master. O Nanak, nothing is in our hands. ||8||6|| Salok: Unapproachable and Unfathomable is the Supreme Lord God; whoever speaks of Him shall be liberated. Listen, O friends, Nanak prays, To the wonderful story of the Holy. ||1||`,
        meaning_pa: `(ਮੇਰਾ) ਕਾਮ, ਕ੍ਰੋਧ, ਲੋਭ, ਮੋਹ ਅਤੇ ਅਹੰਕਾਰ ਦੂਰ ਹੋ ਜਾਏ- ਹੇ ਨਾਨਕ! (ਬੇਨਤੀ ਕਰ ਤੇ ਆਖ)-ਹੇ ਗੁਰਦੇਵ! ਹੇ ਪ੍ਰਭੂ! ਮੈਂ ਸਰਣ ਆਇਆ ਹਾਂ (ਮੇਰੇ ਉਤੇ) ਮੇਹਰ ਕਰ ॥੧॥ (ਹੇ ਭਾਈ!) ਜਿਸ (ਪ੍ਰਭੂ) ਦੀ ਕ੍ਰਿਪਾ ਨਾਲ ਤੂੰ ਕਈ ਕਿਸਮਾਂ ਦੇ ਸੁਆਦਲੇ ਖਾਣੇ ਖਾਂਦਾ ਹੈਂ, ਉਸ ਨੂੰ ਮਨ ਵਿਚ (ਚੇਤੇ) ਰੱਖ। ਜਿਸ ਦੀ ਮਿਹਰ ਨਾਲ ਆਪਣੇ ਸਰੀਰ ਉਤੇ ਤੂੰ ਸੁਗੰਧੀਆਂ ਲਾਉਂਦਾ ਹੈਂ, ਉਸ ਨੂੰ ਯਾਦ ਕੀਤਿਆਂ ਤੂੰ ਉੱਚਾ ਦਰਜਾ ਹਾਸਲ ਕਰ ਲਏਂਗਾ। ਜਿਸ ਦੀ ਦਇਆ ਨਾਲ ਤੂੰ ਸੁਖ-ਮਹਲਾਂ ਵਿਚ ਵੱਸਦਾ ਹੈਂ, ਉਸ ਨੂੰ ਸਦਾ ਮਨ ਵਿਚ ਸਿਮਰ। ਜਿਸ (ਪ੍ਰਭੂ) ਦੀ ਕ੍ਰਿਪਾ ਨਾਲ ਤੂੰ ਘਰ ਮੌਜਾਂ ਨਾਲ ਵੱਸ ਰਿਹਾ ਹੈਂ, ਉਸ ਨੂੰ ਜੀਭ ਨਾਲ ਅੱਠੇ ਪਹਰ ਯਾਦ ਕਰ। ਜਿਸ (ਪ੍ਰਭੂ) ਦੀ ਬਖ਼ਸ਼ਸ਼ ਕਰਕੇ ਚੋਜ-ਤਮਾਸ਼ੇ, ਸੁਆਦਲੇ ਖਾਣੇ ਤੇ ਪਦਾਰਥ (ਨਸੀਬ ਹੁੰਦੇ ਹਨ) ਹੇ ਨਾਨਕ! ਉਸ ਧਿਆਉਣ-ਜੋਗ ਨੂੰ ਸਦਾ ਹੀ ਧਿਆਉਣਾ ਚਾਹੀਦਾ ਹੈ ॥੧॥ (ਹੇ ਮਨ!) ਜਿਸ (ਪ੍ਰਭੂ) ਦੀ ਕ੍ਰਿਪਾ ਨਾਲ ਤੂੰ ਰੇਸ਼ਮੀ ਕੱਪੜੇ ਹੰਢਾਉਂਦਾ ਹੈਂ, ਉਸ ਨੂੰ ਵਿਸਾਰ ਕੇ ਹੋਰ ਕਿੱਥੇ ਲੋਭ ਕਰ ਰਿਹਾ ਹੈਂ? ਜਿਸ ਦੀ ਮਿਹਰ ਨਾਲ ਸੇਜ ਉੱਤੇ ਸੁਖੀ ਸਵੀਂਦਾ ਹੈ, ਹੇ ਮਨ! ਉਸ ਪ੍ਰਭੂ ਦਾ ਜਸ ਅੱਠੇ ਪਹਰ ਗਾਉਣਾ ਚਾਹੀਦਾ ਹੈ। ਜਿਸ ਦੀ ਮੇਹਰ ਨਾਲ ਹਰੇਕ ਮਨੁੱਖ ਤੇਰਾ ਆਦਰ ਕਰਦਾ ਹੈ, ਉਸ ਦੀ ਵਡਿਆਈ (ਆਪਣੇ) ਮੂੰਹੋਂ ਜੀਭ ਨਾਲ (ਸਦਾ) ਕਰ। ਜਿਸ (ਪ੍ਰਭੂ) ਦੀ ਕ੍ਰਿਪਾ ਨਾਲ ਤੇਰਾ ਧਰਮ (ਕਾਇਮ) ਰਹਿੰਦਾ ਹੈ, ਹੇ ਮਨ! ਤੂੰ ਸਦਾ ਉਸ ਪਰਮੇਸ਼ਰ ਨੂੰ ਸਿਮਰ। ਪਰਮਾਤਮਾ ਦਾ ਭਜਨ ਕੀਤਿਆਂ (ਉਸ ਦੀ) ਦਰਗਾਹ ਵਿਚ ਮਾਣ ਪਾਵਹਿਂਗਾ, ਤੇ, ਹੇ ਨਾਨਕ! (ਇਥੋਂ) ਇੱਜ਼ਤ ਨਾਲ ਆਪਣੇ (ਪਰਲੋਕ ਦੇ) ਘਰ ਵਿਚ ਜਾਵਹਿਂਗਾ ॥੨॥ ਜਿਸ (ਪ੍ਰਭੂ) ਦੀ ਕ੍ਰਿਪਾ ਨਾਲ ਸੋਨੇ ਵਰਗਾ ਤੇਰਾ ਨਰੋਆ ਜਿਸਮ ਹੈ, ਉਸ ਪਿਆਰੇ ਰਾਮ ਨਾਲ ਲਿਵ ਜੋੜ। ਜਿਸ ਦੀ ਮਿਹਰ ਨਾਲ ਤੇਰਾ ਪਰਦਾ ਬਣਿਆ ਰਹਿੰਦਾ ਹੈ, ਹੇ ਮਨ! ਉਸ ਹਰੀ ਦੀ ਸਿਫ਼ਤ-ਸਲਾਹ ਕਰ ਕੇ ਸੁਖ ਪ੍ਰਾਪਤ ਕਰ। ਹੇ ਮਨ! ਜਿਸ ਦੀ ਦਇਆ ਨਾਲ ਤੇਰੇ ਸਾਰੇ ਐਬ ਢੱਕੇ ਰਹਿੰਦੇ ਹਨ, ਹੇ ਮਨ! ਉਸ ਪ੍ਰਭੂ ਠਾਕੁਰ ਦੀ ਸਰਣ ਪਉ। ਜਿਸ ਦੀ ਕਿਰਪਾ ਨਾਲ ਕੋਈ ਤੇਰੀ ਬਰਾਬਰੀ ਨਹੀਂ ਕਰ ਸਕਦਾ, ਹੇ ਮਨ! ਉਸ ਉਚੇ ਪ੍ਰਭੂ ਨੂੰ ਸ੍ਵਾਸ ਸ੍ਵਾਸ ਯਾਦ ਕਰ। ਜਿਸ ਦੀ ਕਿਰਪਾ ਨਾਲ ਤੈਨੂੰ ਇਹ ਮਨੁੱਖਾ-ਸਰੀਰ ਲੱਭਾ ਹੈ ਜੋ ਬੜੀ ਮੁਸ਼ਕਿਲ ਨਾਲ ਮਿਲਦਾ ਹੈ, ਹੇ ਨਾਨਕ! ਉਸ ਪ੍ਰਭੂ ਦੀ ਭਗਤੀ ਕਰ ॥੩॥ ਜਿਸ (ਪ੍ਰਭੂ) ਦੀ ਕਿਰਪਾ ਨਾਲ ਗਹਣੇ ਪਹਿਨੀਦੇ ਹਨ, ਹੇ ਮਨ! ਉਸ ਨੂੰ ਸਿਮਰਦਿਆਂ ਕਿਉਂ ਆਲਸ ਕੀਤਾ ਜਾਏ? ਜਿਸ ਦੀ ਮੇਹਰ ਨਾਲ ਘੋੜੇ ਤੇ ਹਾਥੀਆਂ ਦੀ ਸਵਾਰੀ ਕਰਦਾ ਹੈਂ, ਹੇ ਮਨ! ਉਸ ਪ੍ਰਭੂ ਨੂੰ ਕਦੇ ਨਾਹ ਵਿਸਾਰੀਂ। ਜਿਸ ਦੀ ਦਇਆ ਨਾਲ ਬਾਗ ਜ਼ਮੀਨਾਂ ਤੇ ਧਨ (ਤੈਨੂੰ ਨਸੀਬ ਹਨ) ਉਸ ਪ੍ਰਭੂ ਨੂੰ ਆਪਣੇ ਮਨ ਵਿਚ ਪ੍ਰੋ ਰੱਖ। ਹੇ ਮਨ! ਜਿਸ (ਪ੍ਰਭੂ) ਨੇ ਤੈਨੂੰ ਸਾਜਿਆ ਹੈ, ਉਠਦੇ ਬੈਠਦੇ (ਭਾਵ, ਹਰ ਵੇਲੇ) ਉਸੇ ਨੂੰ ਸਦਾ ਸਿਮਰ। ਉਸ ਪ੍ਰਭੂ ਨੂੰ ਸਿਮਰ, ਜੋ ਇੱਕ ਹੈ, ਤੇ, ਬੇਅੰਤ ਹੈ। ਹੇ ਨਾਨਕ! ਲੋਕ ਤੇ ਪਰਲੋਕ ਵਿਚ (ਉਹੀ) ਤੇਰੀ ਲਾਜ ਰੱਖਣ ਵਾਲਾ ਹੈ ॥੪॥ ਜਿਸ (ਪ੍ਰਭੂ) ਦੀ ਕ੍ਰਿਪਾ ਨਾਲ ਤੂੰ ਬਹੁਤ ਦਾਨ ਪੁੰਨ ਕਰਦਾ ਹੈਂ, ਹੇ ਮਨ! ਅੱਠੇ ਪਹਿਰ ਉਸ ਦਾ ਚੇਤਾ ਕਰ। ਜਿਸ ਦੀ ਮਿਹਰ ਨਾਲ ਤੂੰ ਰੀਤਾਂ ਰਸਮਾਂ ਕਰਨ ਜੋਗਾ ਹੋਇਆ ਹੈਂ, ਉਸ ਪ੍ਰਭੂ ਨੂੰ ਸ੍ਵਾਸ ਸ੍ਵਾਸ ਯਾਦ ਕਰ। ਜਿਸ ਦੀ ਦਇਆ ਨਾਲ ਤੇਰੀ ਸੋਹਣੀ ਸ਼ਕਲ ਹੈ, ਉਸ ਸੋਹਣੇ ਮਾਲਕ ਨੂੰ ਸਦਾ ਸਿਮਰ। ਜਿਸ ਪ੍ਰਭੂ ਦੀ ਕਿਰਪਾ ਨਾਲ ਤੈਨੂੰ ਚੰਗੀ (ਮਨੁੱਖ) ਜਾਤੀ ਮਿਲੀ ਹੈ, ਉਸ ਨੂੰ ਸਦਾ ਦਿਨ ਰਾਤ ਯਾਦ ਕਰ। ਜਿਸ ਦੀ ਮੇਹਰ ਨਾਲ ਤੇਰੀ ਇੱਜ਼ਤ (ਜਗਤ ਵਿਚ) ਬਣੀ ਹੋਈ ਹੈ (ਉਸ ਦਾ ਨਾਮ ਸਿਮਰ)। ਹੇ ਨਾਨਕ! ਗੁਰੂ ਦੀ ਬਰਕਤਿ ਲੈ ਕੇ (ਵਡਭਾਗੀ ਮਨੁੱਖ) ਉਸ ਦੀ ਸਿਫ਼ਤ-ਸਾਲਾਹ ਕਰਦਾ ਹੈ ॥੫॥ ਜਿਸ ਦੀ ਕ੍ਰਿਪਾ ਨਾਲ ਤੂੰ (ਆਪਣੇ) ਕੰਨਾਂ ਨਾਲ ਆਵਾਜ਼ ਸੁਣਦਾ ਹੈਂ (ਭਾਵ, ਤੈਨੂੰ ਸੁਣਨ ਦੀ ਤਾਕਤ ਮਿਲੀ ਹੈ), ਜਿਸ ਦੀ ਮੇਹਰ ਨਾਲ ਅਚਰਜ ਨਜ਼ਾਰੇ ਵੇਖਦਾ ਹੈਂ; ਜਿਸ ਦੀ ਬਰਕਤਿ ਪਾ ਕੇ ਜੀਭ ਨਾਲ ਮਿੱਠੇ ਬੋਲ ਬੋਲਦਾ ਹੈਂ, ਜਿਸ ਦੀ ਕਿਰਪਾ ਨਾਲ ਸੁਭਾਵਕ ਹੀ ਸੁਖੀ ਵੱਸ ਰਿਹਾ ਹੈਂ; ਜਿਸ ਦੀ ਦਇਆ ਨਾਲ ਤੇਰੇ ਹੱਥ (ਆਦਿਕ ਸਾਰੇ ਅੰਗ) ਕੰਮ ਦੇ ਰਹੇ ਹਨ, ਜਿਸ ਦੀ ਮਿਹਰ ਨਾਲ ਤੂੰ ਹਰੇਕ ਕਾਰ-ਵਿਹਾਰ ਵਿਚ ਕਾਮਯਾਬ ਹੁੰਦਾ ਹੈਂ; ਜਿਸ ਦੀ ਬਖ਼ਸ਼ਸ਼ ਨਾਲ ਤੈਨੂੰ ਉੱਚਾ ਦਰਜਾ ਮਿਲਦਾ ਹੈ, ਅਤੇ ਤੂੰ ਸੁਖ ਤੇ ਬੇ-ਫ਼ਿਕਰੀ ਵਿਚ ਮਸਤ ਹੈਂ; ਅਜੇਹਾ ਪ੍ਰਭੂ ਵਿਸਾਰ ਕੇ ਤੂੰ ਹੋਰ ਕਿਸ ਪਾਸੇ ਲੱਗ ਰਿਹਾ ਹੈਂ? ਹੇ ਨਾਨਕ! ਗੁਰੂ ਦੀ ਬਰਕਤਿ ਲੈ ਕੇ ਮਨ ਵਿਚ ਹੁਸ਼ੀਆਰ ਹੋਹੁ ॥੬॥ ਜਿਸ ਪ੍ਰਭੂ ਦੀ ਕ੍ਰਿਪਾ ਨਾਲ ਤੂੰ ਜਗਤ ਵਿਚ ਸੋਭਾ ਵਾਲਾ ਹੈਂ, ਉਸ ਨੂੰ ਕਦੇ ਭੀ ਮਨੋਂ ਨ ਭੁਲਾ। ਜਿਸ ਦੀ ਮੇਹਰ ਨਾਲ ਤੈਨੂੰ ਵਡਿਆਈ ਮਿਲੀ ਹੋਈ ਹੈ, ਹੇ ਮੂਰਖ ਮਨ! ਤੂੰ ਉਸ ਪ੍ਰਭੂ ਨੂੰ ਜਪ। ਜਿਸ ਦੀ ਕ੍ਰਿਪਾ ਨਾਲ ਤੇਰੇ (ਸਾਰੇ) ਕੰਮ ਸਿਰੇ ਚੜ੍ਹਦੇ ਹਨ, ਹੇ ਮਨ! ਤੂੰ ਉਸ (ਪ੍ਰਭੂ) ਨੂੰ ਸਦਾ ਅੰਗ ਸੰਗ ਜਾਣ। ਜਿਸ ਦੀ ਬਰਕਤਿ ਨਾਲ ਤੈਨੂੰ ਸੱਚ ਪਰਾਪਤ ਹੁੰਦਾ ਹੈ, ਹੇ ਮੇਰੇ ਮਨ! ਤੂੰ ਉਸ (ਪ੍ਰਭੂ) ਨਾਲ ਜੁੜਿਆ ਰਹੁ। ਜਿਸ (ਪਰਾਮਤਮਾ) ਦੀ ਦਇਆ ਨਾਲ ਹਰੇਕ (ਜੀਵ) ਦੀ (ਉਸ ਤਕ) ਪਹੁੰਚ ਹੋ ਜਾਂਦੀ ਹੈ, (ਉਸ ਨੂੰ ਜਪ)। ਹੇ ਨਾਨਕ! (ਜਿਸ ਨੂੰ ਇਹ  ਦਾਤ ਮਿਲਦੀ ਹੈ) ਉਹ (ਹਰਿ-) ਜਾਪ ਹੀ ਜਪਦਾ ਹੈ ॥੭॥ ਉਹੀ ਮਨੁੱਖ ਪ੍ਰਭੂ ਦਾ ਨਾਮ ਜਪਦਾ ਹੈ ਜਿਸ ਪਾਸੋਂ ਆਪ ਜਪਾਉਂਦਾ ਹੈ, ਉਹੀ ਮਨੁੱਖ ਹਰੀ ਦੇ ਗੁਣ ਗਾਉਂਦਾ ਹੈ ਜਿਸ ਨੂੰ ਗਾਵਣ ਲਈ ਪ੍ਰੇਰਦਾ ਹੈ। ਪ੍ਰਭੂ ਦੀ ਮੇਹਰ ਨਾਲ (ਮਨ ਵਿਚ ਗਿਆਨ ਦਾ) ਪ੍ਰਕਾਸ਼ ਹੁੰਦਾ ਹੈ; ਉਸ ਦੀ ਦਇਆ ਨਾਲ ਹਿਰਦਾ-ਰੂਪ ਕਉਲ ਫੁੱਲ ਖਿੜਦਾ ਹੈ। ਉਹ ਪ੍ਰਭੂ (ਉਸ ਮਨੁੱਖ ਦੇ) ਮਨ ਵਿਚ ਵੱਸਦਾ ਹੈ ਜਿਸ ਉਤੇ ਉਹ ਤ੍ਰੁੱਠਦਾ ਹੈ, ਪ੍ਰਭੂ ਦੀ ਮੇਹਰ ਨਾਲ (ਮਨੁੱਖ ਦੀ) ਮੱਤ ਚੰਗੀ ਹੁੰਦੀ ਹੈ। ਹੇ ਪ੍ਰਭੂ! ਤੇਰੀ ਮੇਹਰ ਦੀ ਨਜ਼ਰ ਵਿਚ ਸਾਰੇ ਖ਼ਜ਼ਾਨੇ ਹਨ, ਆਪਣੇ ਜਤਨ ਨਾਲ ਕਿਸੇ ਨੇ ਭੀ ਕੁਝ ਨਹੀਂ ਲੱਭਾ (ਭਾਵ, ਜੀਵ ਦਾ ਉੱਦਮ ਤਦੋਂ ਹੀ ਸਫਲ ਹੁੰਦਾ ਹੈ ਜਦੋਂ ਤੂੰ ਸਵੱਲੀ ਨਜ਼ਰ ਕਰਦਾ ਹੈਂ)। ਹੇ ਹਰੀ! ਹੇ ਨਾਥ! ਜਿਧਰ ਤੂੰ ਲਾਉਂਦਾ ਹੈਂ ਉਧਰ ਇਹ ਜੀਵ ਲੱਗਦੇ ਹਨ। ਹੇ ਨਾਨਕ! ਇਹਨਾਂ ਜੀਵਾਂ ਦੇ ਵੱਸ ਕੁਝ ਨਹੀਂ ॥੮॥੬॥ ਉਹ ਬੇਅੰਤ ਪ੍ਰਭੂ (ਜੀਵ ਦੀ) ਪਹੁੰਚ ਤੋਂ ਪਰੇ ਹੈ ਤੇ ਅਥਾਹ ਹੈ। ਜੋ ਜੋ (ਮਨੁੱਖ ਉਸ ਨੂੰ) ਸਿਮਰਦਾ ਹੈ ਉਹ (ਵਿਕਾਰਾਂ ਦੇ ਜਾਲ ਤੋਂ) ਖ਼ਲਾਸੀ ਪਾ ਲੈਂਦਾ ਹੈ। ਹੇ ਮਿਤ੍ਰ! ਸੁਣ, ਨਾਨਕ ਬੇਨਤੀ ਕਰਦਾ ਹੈ: (ਸਿਮਰਨ ਕਰਨ ਵਾਲੇ) ਗੁਰਮੁਖਾਂ (ਦੇ ਗੁਣਾਂ) ਦਾ ਜ਼ਿਕਰ ਹੈਰਾਨ ਕਰਨ ਵਾਲਾ ਹੈ (ਭਾਵ, ਸਿਮਰਨ ਦੀ ਬਰਕਤਿ ਨਾਲ ਭਗਤ ਜਨਾਂ ਵਿਚ ਇਤਨੇ ਗੁਣ ਪੈਦਾ ਹੋ ਜਾਂਦੇ ਹਨ ਕਿ ਉਹਨਾਂ ਗੁਣਾਂ ਦੀ ਗੱਲ ਛੇੜਿਆਂ ਅਚਰਜ ਰਹਿ ਜਾਈਦਾ ਹੈ) ॥੧॥`
      },
      {
        number: 7,
        sanskrit: `ਸਲੋਕੁ ॥
ਅਗਮ ਅਗਾਧਿ ਪਾਰਬ੍ਰਹਮੁ ਸੋਇ ॥
ਜੋ ਜੋ ਕਹੈ ਸੁ ਮੁਕਤਾ ਹੋਇ ॥
ਸੁਨਿ ਮੀਤਾ ਨਾਨਕੁ ਬਿਨਵੰਤਾ ॥
ਸਾਧ ਜਨਾ ਕੀ ਅਚਰਜ ਕਥਾ ॥੧॥
ਅਸਟਪਦੀ ॥
ਸਾਧ ਕੈ ਸੰਗਿ ਮੁਖ ਊਜਲ ਹੋਤ ॥
ਸਾਧਸੰਗਿ ਮਲੁ ਸਗਲੀ ਖੋਤ ॥
ਸਾਧ ਕੈ ਸੰਗਿ ਮਿਟੈ ਅਭਿਮਾਨੁ ॥
ਸਾਧ ਕੈ ਸੰਗਿ ਪ੍ਰਗਟੈ ਸੁਗਿਆਨੁ ॥
ਸਾਧ ਕੈ ਸੰਗਿ ਬੁਝੈ ਪ੍ਰਭੁ ਨੇਰਾ ॥
ਸਾਧਸੰਗਿ ਸਭੁ ਹੋਤ ਨਿਬੇਰਾ ॥
ਸਾਧ ਕੈ ਸੰਗਿ ਪਾਏ ਨਾਮ ਰਤਨੁ ॥
ਸਾਧ ਕੈ ਸੰਗਿ ਏਕ ਊਪਰਿ ਜਤਨੁ ॥
ਸਾਧ ਕੀ ਮਹਿਮਾ ਬਰਨੈ ਕਉਨੁ ਪ੍ਰਾਨੀ ॥
ਨਾਨਕ ਸਾਧ ਕੀ ਸੋਭਾ ਪ੍ਰਭ ਮਾਹਿ ਸਮਾਨੀ ॥੧॥
ਸਾਧ ਕੈ ਸੰਗਿ ਅਗੋਚਰੁ ਮਿਲੈ ॥
ਸਾਧ ਕੈ ਸੰਗਿ ਸਦਾ ਪਰਫੁਲੈ ॥
ਸਾਧ ਕੈ ਸੰਗਿ ਆਵਹਿ ਬਸਿ ਪੰਚਾ ॥
ਸਾਧਸੰਗਿ ਅੰਮ੍ਰਿਤ ਰਸੁ ਭੁੰਚਾ ॥
ਸਾਧਸੰਗਿ ਹੋਇ ਸਭ ਕੀ ਰੇਨ ॥
ਸਾਧ ਕੈ ਸੰਗਿ ਮਨੋਹਰ ਬੈਨ ॥
ਸਾਧ ਕੈ ਸੰਗਿ ਨ ਕਤਹੂੰ ਧਾਵੈ ॥
ਸਾਧਸੰਗਿ ਅਸਥਿਤਿ ਮਨੁ ਪਾਵੈ ॥
ਸਾਧ ਕੈ ਸੰਗਿ ਮਾਇਆ ਤੇ ਭਿੰਨ ॥
ਸਾਧਸੰਗਿ ਨਾਨਕ ਪ੍ਰਭ ਸੁਪ੍ਰਸੰਨ ॥੨॥
ਸਾਧਸੰਗਿ ਦੁਸਮਨ ਸਭਿ ਮੀਤ ॥
ਸਾਧੂ ਕੈ ਸੰਗਿ ਮਹਾ ਪੁਨੀਤ ॥
ਸਾਧਸੰਗਿ ਕਿਸ ਸਿਉ ਨਹੀ ਬੈਰੁ ॥
ਸਾਧ ਕੈ ਸੰਗਿ ਨ ਬੀਗਾ ਪੈਰੁ ॥
ਸਾਧ ਕੈ ਸੰਗਿ ਨਾਹੀ ਕੋ ਮੰਦਾ ॥
ਸਾਧਸੰਗਿ ਜਾਨੇ ਪਰਮਾਨੰਦਾ ॥
ਸਾਧ ਕੈ ਸੰਗਿ ਨਾਹੀ ਹਉ ਤਾਪੁ ॥
ਸਾਧ ਕੈ ਸੰਗਿ ਤਜੈ ਸਭੁ ਆਪੁ ॥
ਆਪੇ ਜਾਨੈ ਸਾਧ ਬਡਾਈ ॥
ਨਾਨਕ ਸਾਧ ਪ੍ਰਭੂ ਬਨਿ ਆਈ ॥੩॥
ਸਾਧ ਕੈ ਸੰਗਿ ਨ ਕਬਹੂ ਧਾਵੈ ॥
ਸਾਧ ਕੈ ਸੰਗਿ ਸਦਾ ਸੁਖੁ ਪਾਵੈ ॥
ਸਾਧਸੰਗਿ ਬਸਤੁ ਅਗੋਚਰ ਲਹੈ ॥
ਸਾਧੂ ਕੈ ਸੰਗਿ ਅਜਰੁ ਸਹੈ ॥
ਸਾਧ ਕੈ ਸੰਗਿ ਬਸੈ ਥਾਨਿ ਊਚੈ ॥
ਸਾਧੂ ਕੈ ਸੰਗਿ ਮਹਲਿ ਪਹੂਚੈ ॥
ਸਾਧ ਕੈ ਸੰਗਿ ਦ੍ਰਿੜੈ ਸਭਿ ਧਰਮ ॥
ਸਾਧ ਕੈ ਸੰਗਿ ਕੇਵਲ ਪਾਰਬ੍ਰਹਮ ॥
ਸਾਧ ਕੈ ਸੰਗਿ ਪਾਏ ਨਾਮ ਨਿਧਾਨ ॥
ਨਾਨਕ ਸਾਧੂ ਕੈ ਕੁਰਬਾਨ ॥੪॥
ਸਾਧ ਕੈ ਸੰਗਿ ਸਭ ਕੁਲ ਉਧਾਰੈ ॥
ਸਾਧਸੰਗਿ ਸਾਜਨ ਮੀਤ ਕੁਟੰਬ ਨਿਸਤਾਰੈ ॥
ਸਾਧੂ ਕੈ ਸੰਗਿ ਸੋ ਧਨੁ ਪਾਵੈ ॥
ਜਿਸੁ ਧਨ ਤੇ ਸਭੁ ਕੋ ਵਰਸਾਵੈ ॥
ਸਾਧਸੰਗਿ ਧਰਮ ਰਾਇ ਕਰੇ ਸੇਵਾ ॥
ਸਾਧ ਕੈ ਸੰਗਿ ਸੋਭਾ ਸੁਰਦੇਵਾ ॥
ਸਾਧੂ ਕੈ ਸੰਗਿ ਪਾਪ ਪਲਾਇਨ ॥
ਸਾਧਸੰਗਿ ਅੰਮ੍ਰਿਤ ਗੁਨ ਗਾਇਨ ॥
ਸਾਧ ਕੈ ਸੰਗਿ ਸ੍ਰਬ ਥਾਨ ਗੰਮਿ ॥
ਨਾਨਕ ਸਾਧ ਕੈ ਸੰਗਿ ਸਫਲ ਜਨੰਮ ॥੫॥
ਸਾਧ ਕੈ ਸੰਗਿ ਨਹੀ ਕਛੁ ਘਾਲ ॥
ਦਰਸਨੁ ਭੇਟਤ ਹੋਤ ਨਿਹਾਲ ॥
ਸਾਧ ਕੈ ਸੰਗਿ ਕਲੂਖਤ ਹਰੈ ॥
ਸਾਧ ਕੈ ਸੰਗਿ ਨਰਕ ਪਰਹਰੈ ॥
ਸਾਧ ਕੈ ਸੰਗਿ ਈਹਾ ਊਹਾ ਸੁਹੇਲਾ ॥
ਸਾਧਸੰਗਿ ਬਿਛੁਰਤ ਹਰਿ ਮੇਲਾ ॥
ਜੋ ਇਛੈ ਸੋਈ ਫਲੁ ਪਾਵੈ ॥
ਸਾਧ ਕੈ ਸੰਗਿ ਨ ਬਿਰਥਾ ਜਾਵੈ ॥
ਪਾਰਬ੍ਰਹਮੁ ਸਾਧ ਰਿਦ ਬਸੈ ॥
ਨਾਨਕ ਉਧਰੈ ਸਾਧ ਸੁਨਿ ਰਸੈ ॥੬॥
ਸਾਧ ਕੈ ਸੰਗਿ ਸੁਨਉ ਹਰਿ ਨਾਉ ॥
ਸਾਧਸੰਗਿ ਹਰਿ ਕੇ ਗੁਨ ਗਾਉ ॥
ਸਾਧ ਕੈ ਸੰਗਿ ਨ ਮਨ ਤੇ ਬਿਸਰੈ ॥
ਸਾਧਸੰਗਿ ਸਰਪਰ ਨਿਸਤਰੈ ॥
ਸਾਧ ਕੈ ਸੰਗਿ ਲਗੈ ਪ੍ਰਭੁ ਮੀਠਾ ॥
ਸਾਧੂ ਕੈ ਸੰਗਿ ਘਟਿ ਘਟਿ ਡੀਠਾ ॥
ਸਾਧਸੰਗਿ ਭਏ ਆਗਿਆਕਾਰੀ ॥
ਸਾਧਸੰਗਿ ਗਤਿ ਭਈ ਹਮਾਰੀ ॥
ਸਾਧ ਕੈ ਸੰਗਿ ਮਿਟੇ ਸਭਿ ਰੋਗ ॥
ਨਾਨਕ ਸਾਧ ਭੇਟੇ ਸੰਜੋਗ ॥੭॥
ਸਾਧ ਕੀ ਮਹਿਮਾ ਬੇਦ ਨ ਜਾਨਹਿ ॥
ਜੇਤਾ ਸੁਨਹਿ ਤੇਤਾ ਬਖਿਆਨਹਿ ॥
ਸਾਧ ਕੀ ਉਪਮਾ ਤਿਹੁ ਗੁਣ ਤੇ ਦੂਰਿ ॥
ਸਾਧ ਕੀ ਉਪਮਾ ਰਹੀ ਭਰਪੂਰਿ ॥
ਸਾਧ ਕੀ ਸੋਭਾ ਕਾ ਨਾਹੀ ਅੰਤ ॥
ਸਾਧ ਕੀ ਸੋਭਾ ਸਦਾ ਬੇਅੰਤ ॥
ਸਾਧ ਕੀ ਸੋਭਾ ਊਚ ਤੇ ਊਚੀ ॥
ਸਾਧ ਕੀ ਸੋਭਾ ਮੂਚ ਤੇ ਮੂਚੀ ॥
ਸਾਧ ਕੀ ਸੋਭਾ ਸਾਧ ਬਨਿ ਆਈ ॥
ਨਾਨਕ ਸਾਧ ਪ੍ਰਭ ਭੇਦੁ ਨ ਭਾਈ ॥੮॥੭॥
ਸਲੋਕੁ ॥
ਮਨਿ ਸਾਚਾ ਮੁਖਿ ਸਾਚਾ ਸੋਇ ॥
ਅਵਰੁ ਨ ਪੇਖੈ ਏਕਸੁ ਬਿਨੁ ਕੋਇ ॥
ਨਾਨਕ ਇਹ ਲਛਣ ਬ੍ਰਹਮ ਗਿਆਨੀ ਹੋਇ ॥੧॥`,
        transliteration: `salok |
agam agaadh paarabraham soe |
jo jo kahai su mukataa hoe |
sun meetaa naanak binavantaa |
saadh janaa kee acharaj kathaa |1|
asattapadee |
saadh kai sang mukh aoojal hot |
saadhasang mal sagalee khot |
saadh kai sang mittai abhimaan |
saadh kai sang pragattai sugiaan |
saadh kai sang bujhai prabh neraa |
saadhasang sabh hot niberaa |
saadh kai sang paae naam ratan |
saadh kai sang ek aoopar jatan |
saadh kee mahimaa baranai kaun praanee |
naanak saadh kee sobhaa prabh maeh samaanee |1|
saadh kai sang agochar milai |
saadh kai sang sadaa parafulai |
saadh kai sang aaveh bas panchaa |
saadhasang amrit ras bhunchaa |
saadhasang hoe sabh kee ren |
saadh kai sang manohar bain |
saadh kai sang na katahoon dhaavai |
saadhasang asathit man paavai |
saadh kai sang maaeaa te bhin |
saadhasang naanak prabh suprasan |2|
saadhasang dusaman sabh meet |
saadhoo kai sang mahaa puneet |
saadhasang kis siau nahee bair |
saadh kai sang na beegaa pair |
saadh kai sang naahee ko mandaa |
saadhasang jaane paramaanandaa |
saadh kai sang naahee hau taap |
saadh kai sang tajai sabh aap |
aape jaanai saadh baddaaee |
naanak saadh prabhoo ban aaee |3|
saadh kai sang na kabahoo dhaavai |
saadh kai sang sadaa sukh paavai |
saadhasang basat agochar lahai |
saadhoo kai sang ajar sahai |
saadh kai sang basai thaan aoochai |
saadhoo kai sang mehal pahoochai |
saadh kai sang drirrai sabh dharam |
saadh kai sang keval paarabraham |
saadh kai sang paae naam nidhaan |
naanak saadhoo kai kurabaan |4|
saadh kai sang sabh kul udhaarai |
saadhasang saajan meet kuttanb nisataarai |
saadhoo kai sang so dhan paavai |
jis dhan te sabh ko varasaavai |
saadhasang dharam raae kare sevaa |
saadh kai sang sobhaa suradevaa |
saadhoo kai sang paap palaaein |
saadhasang amrit gun gaaein |
saadh kai sang srab thaan gam |
naanak saadh kai sang safal janam |5|
saadh kai sang nahee kachh ghaal |
darasan bhettat hot nihaal |
saadh kai sang kalookhat harai |
saadh kai sang narak paraharai |
saadh kai sang eehaa aoohaa suhelaa |
saadhasang bichhurat har melaa |
jo ichhai soee fal paavai |
saadh kai sang na birathaa jaavai |
paarabraham saadh rid basai |
naanak udharai saadh sun rasai |6|
saadh kai sang sunau har naau |
saadhasang har ke gun gaau |
saadh kai sang na man te bisarai |
saadhasang sarapar nisatarai |
saadh kai sang lagai prabh meetthaa |
saadhoo kai sang ghatt ghatt ddeetthaa |
saadhasang bhe aagiaakaaree |
saadhasang gat bhee hamaaree |
saadh kai sang mitte sabh rog |
naanak saadh bhette sanjog |7|
saadh kee mahimaa bed na jaaneh |
jetaa suneh tetaa bakhiaaneh |
saadh kee upamaa tihu gun te door |
saadh kee upamaa rahee bharapoor |
saadh kee sobhaa kaa naahee ant |
saadh kee sobhaa sadaa beant |
saadh kee sobhaa aooch te aoochee |
saadh kee sobhaa mooch te moochee |
saadh kee sobhaa saadh ban aaee |
naanak saadh prabh bhed na bhaaee |8|7|
salok |
man saachaa mukh saachaa soe |
avar na pekhai ekas bin koe |
naanak ih lachhan braham giaanee hoe |1|`,
        meaning: `Salok: Unapproachable and Unfathomable is the Supreme Lord God; whoever speaks of Him shall be liberated. Listen, O friends, Nanak prays, To the wonderful story of the Holy. ||1|| Ashtapadee: In the Company of the Holy, one's face becomes radiant. In the Company of the Holy, all filth is removed. In the Company of the Holy, egotism is eliminated. In the Company of the Holy, spiritual wisdom is revealed. In the Company of the Holy, God is understood to be near at hand. In the Company of the Holy, all conflicts are settled. In the Company of the Holy, one obtains the jewel of the Naam. In the Company of the Holy, one's efforts are directed toward the One Lord. What mortal can speak of the Glorious Praises of the Holy? O Nanak, the glory of the Holy people merges into God. ||1|| In the Company of the Holy, one meets the Incomprehensible Lord. In the Company of the Holy, one flourishes forever. In the Company of the Holy, the five passions are brought to rest. In the Company of the Holy, one enjoys the essence of ambrosia. In the Company of the Holy, one becomes the dust of all. In the Company of the Holy, one's speech is enticing. In the Company of the Holy, the mind does not wander. In the Company of the Holy, the mind becomes stable. In the Company of the Holy, one is rid of Maya. In the Company of the Holy, O Nanak, God is totally pleased. ||2|| In the Company of the Holy, all one's enemies become friends. In the Company of the Holy, there is great purity. In the Company of the Holy, no one is hated. In the Company of the Holy, one's feet do not wander. In the Company of the Holy, no one seems evil. In the Company of the Holy, supreme bliss is known. In the Company of the Holy, the fever of ego departs. In the Company of the Holy, one renounces all selfishness. He Himself knows the greatness of the Holy. O Nanak, the Holy are at one with God. ||3|| In the Company of the Holy, the mind never wanders. In the Company of the Holy, one obtains everlasting peace. In the Company of the Holy, one grasps the Incomprehensible. In the Company of the Holy, one can endure the unendurable. In the Company of the Holy, one abides in the loftiest place. In the Company of the Holy, one attains the Mansion of the Lord's Presence. In the Company of the Holy, one's Dharmic faith is firmly established. In the Company of the Holy, one dwells with the Supreme Lord God. In the Company of the Holy, one obtains the treasure of the Naam. O Nanak, I am a sacrifice to the Holy. ||4|| In the Company of the Holy, all one's family is saved. In the Company of the Holy, one's friends, acquaintances and relatives are redeemed. In the Company of the Holy, that wealth is obtained. Everyone benefits from that wealth. In the Company of the Holy, the Lord of Dharma serves. In the Company of the Holy, the divine, angelic beings sing God's Praises. In the Company of the Holy, one's sins fly away. In the Company of the Holy, one sings the Ambrosial Glories. In the Company of the Holy, all places are within reach. O Nanak, in the Company of the Holy, one's life becomes fruitful. ||5|| In the Company of the Holy, there is no suffering. The Blessed Vision of their Darshan brings a sublime, happy peace. In the Company of the Holy, blemishes are removed. In the Company of the Holy, hell is far away. In the Company of the Holy, one is happy here and hereafter. In the Company of the Holy, the separated ones are reunited with the Lord. The fruits of one's desires are obtained. In the Company of the Holy, no one goes empty-handed. The Supreme Lord God dwells in the hearts of the Holy. O Nanak, listening to the sweet words of the Holy, one is saved. ||6|| In the Company of the Holy, listen to the Name of the Lord. In the Company of the Holy, sing the Glorious Praises of the Lord. In the Company of the Holy, do not forget Him from your mind. In the Company of the Holy, you shall surely be saved. In the Company of the Holy, God seems very sweet. In the Company of the Holy, He is seen in each and every heart. In the Company of the Holy, we become obedient to the Lord. In the Company of the Holy, we obtain the state of salvation. In the Company of the Holy, all diseases are cured. O Nanak, one meets with the Holy, by highest destiny. ||7|| The glory of the Holy people is not known to the Vedas. They can describe only what they have heard. The greatness of the Holy people is beyond the three qualities. The greatness of the Holy people is all-pervading. The glory of the Holy people has no limit. The glory of the Holy people is infinite and eternal. The glory of the Holy people is the highest of the high. The glory of the Holy people is the greatest of the great. The glory of the Holy people is theirs alone; O Nanak, there is no difference between the Holy people and God. ||8||7|| Salok: The True One is on his mind, and the True One is upon his lips. He sees only the One. O Nanak, these are the qualities of the God-conscious being. ||1||`,
        meaning_pa: `ਉਹ ਬੇਅੰਤ ਪ੍ਰਭੂ (ਜੀਵ ਦੀ) ਪਹੁੰਚ ਤੋਂ ਪਰੇ ਹੈ ਤੇ ਅਥਾਹ ਹੈ। ਜੋ ਜੋ (ਮਨੁੱਖ ਉਸ ਨੂੰ) ਸਿਮਰਦਾ ਹੈ ਉਹ (ਵਿਕਾਰਾਂ ਦੇ ਜਾਲ ਤੋਂ) ਖ਼ਲਾਸੀ ਪਾ ਲੈਂਦਾ ਹੈ। ਹੇ ਮਿਤ੍ਰ! ਸੁਣ, ਨਾਨਕ ਬੇਨਤੀ ਕਰਦਾ ਹੈ: (ਸਿਮਰਨ ਕਰਨ ਵਾਲੇ) ਗੁਰਮੁਖਾਂ (ਦੇ ਗੁਣਾਂ) ਦਾ ਜ਼ਿਕਰ ਹੈਰਾਨ ਕਰਨ ਵਾਲਾ ਹੈ (ਭਾਵ, ਸਿਮਰਨ ਦੀ ਬਰਕਤਿ ਨਾਲ ਭਗਤ ਜਨਾਂ ਵਿਚ ਇਤਨੇ ਗੁਣ ਪੈਦਾ ਹੋ ਜਾਂਦੇ ਹਨ ਕਿ ਉਹਨਾਂ ਗੁਣਾਂ ਦੀ ਗੱਲ ਛੇੜਿਆਂ ਅਚਰਜ ਰਹਿ ਜਾਈਦਾ ਹੈ) ॥੧॥ ਗੁਰਮੁਖਾਂ ਦੀ ਸੰਗਤਿ ਵਿਚ ਰਿਹਾਂ ਮੂੰਹ ਉਜਲੇ ਹੁੰਦੇ ਹਨ (ਭਾਵ, ਇੱਜ਼ਤ ਬਣ ਆਉਂਦੀ ਹੈ) (ਕਿਉਂਕਿ) ਸਾਧੂ ਜਨਾਂ ਦੇ ਪਾਸ ਰਿਹਾਂ (ਵਿਕਾਰਾਂ ਦੀ) ਸਾਰੀ ਮੈਲ ਮਿਟ ਜਾਂਦੀ ਹੈ। ਸਾਧੂਆਂ ਦੀ ਸੰਗਤਿ ਵਿਚ ਅਹੰਕਾਰ ਦੂਰ ਹੁੰਦਾ ਹੈ, ਅਤੇ ਸ੍ਰੇਸ਼ਟ ਗਿਆਨ ਪਰਗਟ ਹੁੰਦਾ ਹੈ (ਭਾਵ, ਚੰਗੀ ਮਤਿ ਆਉਂਦੀ ਹੈ)। ਸੰਤਾਂ ਦੀ ਸੰਗਤ ਵਿਚ ਪ੍ਰਭੂ ਅੰਗ-ਸੰਗ ਵੱਸਦਾ ਜਾਪਦਾ ਹੈ, (ਇਸ ਵਾਸਤੇ ਮੰਦੇ ਸੰਸਕਾਰਾਂ ਜਾਂ ਵਾਸਨਾ ਦਾ) ਸਾਰਾ ਨਿਬੇੜਾ ਹੋ ਜਾਂਦਾ ਹੈ (ਭਾਵ, ਮੰਦੇ ਪਾਸੇ ਜੀਵ ਪੈਂਦਾ ਨਹੀਂ)। ਗੁਰਮੁਖਾਂ ਦੀ ਸੰਗਤਿ ਵਿਚ ਮਨੁੱਖ ਨਾਮ-ਰੂਪ ਰਤਨ ਲੱਭ ਲੈਂਦਾ ਹੈ, ਤੇ, ਇੱਕ ਪ੍ਰਭੂ ਨੂੰ ਮਿਲਣ ਦਾ ਜਤਨ ਕਰਦਾ ਹੈ। ਸਾਧੂਆਂ ਦੀ ਵਡਿਆਈ ਕਿਹੜਾ ਮਨੁੱਖ ਬਿਆਨ ਕਰ ਸਕਦਾ ਹੈ? (ਕਿਉਂਕਿ) ਹੇ ਨਾਨਕ! ਸਾਧ ਜਨਾਂ ਦੀ ਸੋਭਾ ਪ੍ਰਭੂ ਦੀ ਸੋਭਾ ਦੇ ਬਰਾਬਰ ਹੋ ਜਾਂਦੀ ਹੈ ॥੧॥ ਗੁਰਮੁਖਾਂ ਦੀ ਸੰਗਤਿ ਵਿਚ (ਮਨੁੱਖ ਨੂੰ) ਉਹ ਪ੍ਰਭੂ ਮਿਲ ਪੈਂਦਾ ਹੈ ਜੋ ਸਰੀਰਕ ਇੰਦ੍ਰਿਆਂ ਦੀ ਪਹੁੰਚ ਤੋਂ ਪਰੇ ਹੈ; ਅਤੇ ਮਨੁੱਖ ਸਦਾ ਖਿੜੇ ਮੱਥੇ ਰਹਿੰਦਾ ਹੈ। ਸਾਧ ਜਨਾਂ ਦੀ ਸੰਗਤਿ ਵਿਚ ਰਿਹਾਂ ਕਾਮਾਦਿਕ ਪੰਜ ਵਿਕਾਰ ਕਾਬੂ ਵਿਚ ਆ ਜਾਂਦੇ ਹਨ, (ਕਿਉਂਕਿ ਮਨੁੱਖ) ਨਾਮ ਰੂਪ ਅੰਮ੍ਰਿਤ ਦਾ ਰਸ ਚੱਖ ਲੈਂਦਾ ਹੈ। ਸਾਧ ਜਨਾਂ ਦੀ ਸੰਗਤਿ ਕੀਤਿਆਂ (ਮਨੁੱਖ) ਸਭ (ਪ੍ਰਾਣੀਆਂ) ਦੇ ਚਰਨਾਂ ਦੀ ਧੂੜ ਬਣ ਜਾਂਦਾ ਹੈ, ਅਤੇ (ਸਭ ਨਾਲ) ਮਿੱਠੇ ਬਚਨ ਬੋਲਦਾ ਹੈ। ਸੰਤ ਜਨਾਂ ਦੇ ਸੰਗ ਰਿਹਾਂ (ਮਨੁੱਖ ਦਾ) ਮਨ ਕਿਸੇ ਪਾਸੇ ਨਹੀਂ ਦੌੜਦਾ ਹੈ, ਅਤੇ (ਪ੍ਰਭੂ ਦੇ ਚਰਨਾਂ ਵਿਚ) ਟਿਕਾਉ ਹਾਸਲ ਕਰ ਲੈਂਦਾ ਹੈ। ਗੁਰਮੁਖਾਂ ਦੀ ਸੰਗਤਿ ਵਿਚ ਟਿਕਿਆਂ (ਮਨੁੱਖ) ਮਾਇਆ (ਦੇ ਅਸਰ) ਤੋਂ ਬੇ-ਦਾਗ਼ ਰਹਿੰਦਾ ਹੈ ਅਤੇ ਹੇ ਨਾਨਕ! ਅਕਾਲ ਪੁਰਖ ਇਸ ਉਤੇ ਦਇਆਵਾਨ ਹੁੰਦਾ ਹੈ ॥੨॥ ਗੁਰਮੁਖਾਂ ਦੀ ਸੰਗਤਿ ਵਿਚ ਰਿਹਾਂ ਸਾਰੇ ਵੈਰੀ (ਭੀ) ਮਿਤ੍ਰ (ਦਿੱਸਣ ਲੱਗ ਜਾਂਦੇ ਹਨ), (ਕਿਉਂਕਿ) ਸਾਧ ਜਨਾਂ ਦੀ ਸੰਗਤ ਵਿਚ (ਮਨੁੱਖ ਦਾ ਆਪਣਾ ਹਿਰਦਾ) ਬਹੁਤ ਸਾਫ਼ ਹੋ ਜਾਂਦਾ ਹੈ। ਸੰਤਾਂ ਦੀ ਸੰਗਤਿ ਵਿਚ ਬੈਠਿਆਂ ਕਿਸੇ ਨਾਲ ਵੈਰ ਨਹੀਂ ਰਹਿ ਜਾਂਦਾ, ਅਤੇ ਕਿਸੇ ਮੰਦੇ ਪਾਸੇ ਪੈਰ ਨਹੀਂ ਪੁੱਟੀਦਾ। ਭਲਿਆਂ ਦੀ ਸੰਗਤਿ ਵਿਚ ਕੋਈ ਮਨੁੱਖ ਭੈੜਾ ਨਹੀਂ ਦਿੱਸਦਾ, (ਕਿਉਂਕਿ ਹਰ ਥਾਂ ਮਨੁੱਖ) ਉੱਚੇ ਸੁਖ ਦੇ ਮਾਲਕ ਪ੍ਰਭੂ ਨੂੰ ਹੀ ਜਾਣਦਾ ਹੈ। ਸਾਧੂ ਦੀ ਸੰਗਤਿ ਵਿਚ ਮਨੁੱਖ ਸਾਰੀ ਅਪਣੱਤ ਛੱਡ ਦੇਂਦਾ ਹੈ। ਗੁਰਮੁਖ ਦੀ ਸੰਗਤਿ ਕੀਤਿਆਂ ਹਉਮੈ ਰੂਪ ਤਾਪ ਨਹੀਂ ਰਹਿ ਜਾਂਦਾ। ਸਾਧ ਦੀ ਵਡਿਆਈ ਪ੍ਰਭੂ ਆਪ ਹੀ ਜਾਣਦਾ ਹੈ, (ਕਿਉਂਕਿ) ਹੇ ਨਾਨਕ! ਸਾਧ ਤੇ ਪ੍ਰਭੂ ਦਾ ਪੱਕਾ ਪਿਆਰ ਪੈ ਜਾਂਦਾ ਹੈ ॥੩॥ ਗੁਰਮੁਖਾਂ ਦੀ ਸੰਗਤਿ ਵਿਚ ਰਿਹਾਂ ਮਨੁੱਖ ਦਾ ਮਨ ਕਦੇ ਭਟਕਦਾ ਨਹੀਂ, (ਕਿਉਂਕਿ) ਸਾਧ ਜਨਾਂ ਦੀ ਸੰਗਤਿ ਵਿਚ (ਮਨੁੱਖ) ਸਦਾ ਸੁਖ ਮਾਣਦਾ ਹੈ। ਸੰਤ ਜਨਾਂ ਦੀ ਸੰਗਤਿ ਵਿਚ (ਪ੍ਰਭੂ ਦਾ) ਨਾਮ ਰੂਪ ਅਗੋਚਰ ਵਸਤ ਮਿਲ ਜਾਂਦੀ ਹੈ, (ਅਤੇ ਮਨੁੱਖ) ਇਹ ਨਾਹ ਜਰਿਆ ਜਾਣ ਵਾਲਾ ਮਰਤਬਾ ਜਰ ਲੈਂਦਾ ਹੈ। ਗੁਰਮੁਖਾਂ ਦੀ ਸੰਗਤਿ ਵਿਚ ਰਹਿ ਕੇ ਮਨੁੱਖ ਉਚੇ (ਆਤਮਕ) ਟਿਕਾਣੇ ਤੇ ਵੱਸਦਾ ਹੈ, ਅਤੇ ਅਕਾਲ ਪੁਰਖ ਦੇ ਚਰਨਾਂ ਵਿਚ ਜੁੜਿਆ ਰਹਿੰਦਾ ਹੈ। ਸੰਤਾਂ ਦੀ ਸੰਗਤਿ ਵਿਚ ਰਹਿ ਕੇ (ਮਨੁੱਖ) ਸਾਰੇ ਧਰਮਾਂ (ਫ਼ਰਜ਼ਾਂ) ਨੂੰ ਚੰਗੀ ਤਰ੍ਹਾਂ ਸਮਝ ਲੈਂਦਾ ਹੈ, ਅਤੇ ਸਿਰਫ਼ ਅਕਾਲ ਪੁਰਖ ਨੂੰ (ਹਰ ਥਾਂ ਵੇਖਦਾ ਹੈ)। ਸਾਧ ਜਨਾਂ ਦੀ ਸੰਗਤਿ ਵਿਚ (ਮਨੁੱਖ) ਨਾਮ ਖ਼ਜ਼ਾਨਾ ਲੱਭ ਲੈਂਦਾ ਹੈ; (ਤਾਂ ਤੇ) ਹੇ ਨਾਨਕ! (ਆਖ-) ਮੈਂ ਸਾਧ ਜਨਾਂ ਤੋਂ ਸਦਕੇ ਹਾਂ ॥੪॥ ਗੁਰਮੁਖਾਂ ਦੀ ਸੰਗਤਿ ਵਿਚ ਰਹਿ ਕੇ (ਮਨੁੱਖ ਆਪਣੀਆਂ) ਸਾਰੀਆਂ ਕੁਲਾਂ (ਵਿਕਾਰਾਂ ਤੋਂ) ਬਚਾ ਲੈਂਦਾ ਹੈ, ਤੇ (ਆਪਣੇ) ਸੱਜਣਾਂ ਮਿੱਤ੍ਰਾਂ ਤੇ ਪਰਵਾਰ ਨੂੰ ਤਾਰ ਲੈਂਦਾ ਹੈ। ਸੰਤਾਂ ਦੀ ਸੰਗਤਿ ਵਿਚ ਮਨੁੱਖ ਨੂੰ ਉਹ ਧਨ ਲੱਭ ਪੈਂਦਾ ਹੈ, ਜਿਸ ਧਨ ਦੇ ਮਿਲਣ ਨਾਲ ਹਰੇਕ ਮਨੁੱਖ ਨਾਮਣੇ ਵਾਲਾ ਹੋ ਜਾਂਦਾ ਹੈ। ਸਾਧੂ ਜਨਾਂ ਦੀ ਸੰਗਤਿ ਵਿਚ ਰਿਹਾਂ ਧਰਮਰਾਜ (ਭੀ) ਸੇਵਾ ਕਰਦਾ ਹੈ, ਅਤੇ (ਦੇਵਤੇ ਭੀ) ਸੋਭਾ ਕਰਦੇ ਹਨ। ਗੁਰਮੁਖਾਂ ਦੀ ਸੰਗਤਿ ਵਿਚ ਪਾਪ ਦੂਰ ਹੋ ਜਾਂਦੇ ਹਨ, (ਕਿਉਂਕਿ ਓਥੇ) ਪ੍ਰਭੂ ਦੇ ਅਮਰ ਕਰਨ ਵਾਲੇ ਗੁਣ (ਮਨੁੱਖ) ਗਾਉਂਦੇ ਹਨ। ਸੰਤਾਂ ਦੀ ਸੰਗਤਿ ਵਿਚ ਰਹਿ ਕੇ ਸਭ ਥਾਈਂ ਪਹੁੰਚ ਹੋ ਜਾਂਦੀ ਹੈ (ਭਾਵ, ਉੱਚੀ ਆਤਮਕ ਸਮਰੱਥਾ ਆ ਜਾਂਦੀ ਹੈ); ਹੇ ਨਾਨਕ! ਸਾਧੂ ਦੀ ਸੰਗਤਿ ਵਿਚ ਮਨੁੱਖਾ ਜਨਮ ਦਾ ਫਲ ਮਿਲ ਜਾਂਦਾ ਹੈ ॥੫॥ ਸਾਧ ਜਨਾਂ ਦੀ ਸੰਗਤਿ ਵਿਚ ਰਿਹਾਂ ਤਪ ਆਦਿਕ ਤਪਨ ਦੀ ਲੋੜ ਨਹੀਂ ਰਹਿੰਦੀ, (ਕਿਉਂਕਿ ਉਹਨਾਂ) ਦਾ ਦਰਸ਼ਨ ਹੀ ਕਰ ਕੇ ਹਿਰਦਾ ਖਿੜ ਆਉਂਦਾ ਹੈ। ਗੁਰਮੁਖਾਂ ਦੀ ਸੰਗਤਿ ਵਿਚ (ਮਨੁੱਖ ਆਪਣੇ) ਪਾਪ ਨਾਸ ਕਰ ਲੈਂਦਾ ਹੈ, (ਤੇ ਇਸ ਤਰ੍ਹਾਂ) ਨਰਕਾਂ ਤੋਂ ਬਚ ਜਾਂਦਾ ਹੈ। ਸੰਤਾਂ ਦੀ ਸੰਗਤਿ ਵਿਚ ਰਹਿ ਕੇ (ਮਨੁੱਖ) ਇਸ ਲੋਕ ਤੇ ਪਰਲੋਕ ਵਿਚ ਸੌਖਾ ਹੋ ਜਾਂਦਾ ਹੈ, ਅਤੇ ਪ੍ਰਭੂ ਤੋਂ ਵਿਛੁੜਿਆ ਹੋਇਆ (ਮੁੜ) ਉਸ ਨੂੰ ਮਿਲ ਪੈਂਦਾ ਹੈ। ਗੁਰਮੁਖਾਂ ਦੀ ਸੰਗਤਿ ਵਿਚੋਂ (ਮਨੁੱਖ) ਜੋ ਇੱਛਾ ਕਰਦਾ ਹੈ, ਓਹੀ ਫਲ ਪਾਉਂਦਾ ਹੈ, ਬੇ-ਮੁਰਾਦ ਹੋ ਕੇ ਨਹੀਂ ਜਾਂਦਾ। ਅਕਾਲ ਪੁਰਖ ਸੰਤ ਜਨਾਂ ਦੇ ਹਿਰਦੇ ਵਿਚ ਵੱਸਦਾ ਹੈ; ਹੇ ਨਾਨਕ! (ਮਨੁੱਖ) ਸਾਧੂ ਜਨਾਂ ਦੀ ਰਸਨਾ ਤੋਂ (ਉਪਦੇਸ਼) ਸੁਣ ਕੇ (ਵਿਕਾਰਾਂ ਤੋਂ) ਬਚ ਜਾਂਦਾ ਹੈ ॥੬॥ ਮੈਂ ਗੁਰਮੁਖਾਂ ਦੀ ਸੰਗਤਿ ਵਿਚ ਰਹਿ ਕੇ ਪ੍ਰਭੂ ਦਾ ਨਾਮ ਸੁਣਾਂ, ਤੇ ਪ੍ਰਭੂ ਦੇ ਗੁਣ ਗਾਵਾਂ (ਇਹ ਮੇਰੀ ਕਾਮਨਾ ਹੈ)। ਸੰਤਾਂ ਦੀ ਸੰਗਤਿ ਵਿਚ ਰਿਹਾਂ ਪ੍ਰਭੂ ਮਨ ਤੋਂ ਭੁੱਲਦਾ ਨਹੀਂ, ਸਾਧ ਜਨਾਂ ਦੀ ਸੰਗਤਿ ਵਿਚ ਮਨੁੱਖ ਜ਼ਰੂਰ (ਵਿਕਾਰਾਂ ਤੋਂ) ਬਚ ਨਿਕਲਦਾ ਹੈ। ਭਲਿਆਂ ਦੀ ਸੰਗਤਿ ਵਿਚ ਰਿਹਾਂ ਪ੍ਰਭੂ ਪਿਆਰਾ ਲੱਗਣ ਲੱਗ ਜਾਂਦਾ ਹੈ, ਅਤੇ ਉਹ ਹਰੇਕ ਸਰੀਰ ਵਿਚ ਦਿਖਾਈ ਦੇਣ ਲੱਗ ਜਾਂਦਾ ਹੈ। ਸਾਧੂਆਂ ਦੀ ਸੰਗਤਿ ਕੀਤਿਆਂ (ਅਸੀ) ਪ੍ਰਭੂ ਦਾ ਹੁਕਮ ਮੰਨਣ ਵਾਲੇ ਹੋ ਜਾਂਦੇ ਹਾਂ, ਅਤੇ ਸਾਡੀ ਆਤਮਕ ਅਵਸਥਾ ਸੁਧਰ ਜਾਂਦੀ ਹੈ। ਸੰਤ ਜਨਾਂ ਦੀ ਸੁਹਬਤ ਵਿਚ (ਵਿਕਾਰ ਆਦਿਕ) ਸਾਰੇ ਰੋਗ ਮਿਟ ਜਾਂਦੇ ਹਨ; ਹੇ ਨਾਨਕ! (ਵੱਡੇ) ਭਾਗਾਂ ਨਾਲ ਸਾਧ ਜਨ ਮਿਲਦੇ ਹਨ ॥੭॥ ਸਾਧ ਦੀ ਵਡਿਆਈ ਵੇਦ (ਭੀ) ਨਹੀਂ ਜਾਣਦੇ, ਉਹ ਤਾਂ ਜਿਤਨਾ ਸੁਣਦੇ ਹਨ, ਉਤਨਾ ਹੀ ਬਿਆਨ ਕਰਦੇ ਹਨ (ਪਰ ਸਾਧ ਦੀ ਮਹਿਮਾ ਬਿਆਨ ਤੋਂ ਪਰੇ ਹੈ)। ਸਾਧ ਦੀ ਸਮਾਨਤਾ ਤਿੰਨਾਂ ਗੁਣਾਂ ਤੋਂ ਪਰੇ ਹੈ (ਭਾਵ, ਜਗਤ ਦੀ ਰਚਨਾ ਵਿਚ ਕੋਈ ਅਜੇਹੀ ਹਸਤੀ ਨਹੀਂ ਜਿਸ ਨੂੰ ਸਾਧ ਵਰਗਾ ਕਿਹਾ ਜਾ ਸਕੇ; ਹਾਂ) ਸਾਧ ਦੀ ਸਮਾਨਤਾ ਉਸ ਪ੍ਰਭੂ ਨਾਲ ਹੀ ਹੋ ਸਕਦੀ ਹੈ ਜੋ ਸਾਰੇ ਵਿਆਪਕ ਹੈ। ਸਾਧੂ ਦੀ ਸੋਭਾ ਦਾ ਅੰਦਾਜ਼ਾ ਨਹੀਂ ਲੱਗ ਸਕਦਾ, ਸਦਾ (ਇਸ ਨੂੰ) ਬੇਅੰਤ ਹੀ (ਕਿਹਾ ਜਾ ਸਕਦਾ) ਹੈ। ਸਾਧੂ ਦੀ ਸੋਭਾ ਹੋਰ ਸਭ ਦੀ ਸੋਭਾ ਤੋਂ ਬਹੁਤ ਉੱਚੀ ਹੈ, ਤੇ ਬਹੁਤ ਵੱਡੀ ਹੈ। ਸਾਧੂ ਦੀ ਸੋਭਾ ਸਾਧੂ ਨੂੰ ਹੀ ਫਬਦੀ ਹੈ, (ਕਿਉਂਕਿ) ਹੇ ਨਾਨਕ! (ਆਖ-) ਹੇ ਭਾਈ! ਸਾਧੂ ਤੇ ਪ੍ਰਭੂ ਵਿਚ (ਕੋਈ) ਫ਼ਰਕ ਨਹੀਂ ਹੈ ॥੮॥੭॥ (ਜਿਸ ਮਨੁੱਖ ਦੇ) ਮਨ ਵਿਚ ਸਦਾ-ਥਿਰ ਰਹਿਣ ਵਾਲਾ ਪ੍ਰਭੂ (ਵੱਸਦਾ ਹੈ), (ਜੋ) ਮੂੰਹੋਂ (ਭੀ) ਉਸੇ ਪ੍ਰਭੂ ਨੂੰ (ਜਪਦਾ ਹੈ), (ਜੋ ਮਨੁੱਖ) ਇਕ ਅਕਾਲ ਪੁਰਖ ਤੋਂ ਬਿਨਾ (ਕਿਤੇ ਭੀ) ਕਿਸੇ ਹੋਰ ਨੂੰ ਨਹੀਂ ਵੇਖਦਾ, ਹੇ ਨਾਨਕ! (ਉਹ ਮਨੁੱਖ) ਇਹਨਾਂ ਗੁਣਾਂ ਦੇ ਕਾਰਣ ਬ੍ਰਹਮਗਿਆਨੀ ਹੋ ਜਾਂਦਾ ਹੈ ॥੧॥`
      },
      {
        number: 8,
        sanskrit: `ਸਲੋਕੁ ॥
ਮਨਿ ਸਾਚਾ ਮੁਖਿ ਸਾਚਾ ਸੋਇ ॥
ਅਵਰੁ ਨ ਪੇਖੈ ਏਕਸੁ ਬਿਨੁ ਕੋਇ ॥
ਨਾਨਕ ਇਹ ਲਛਣ ਬ੍ਰਹਮ ਗਿਆਨੀ ਹੋਇ ॥੧॥
ਅਸਟਪਦੀ ॥
ਬ੍ਰਹਮ ਗਿਆਨੀ ਸਦਾ ਨਿਰਲੇਪ ॥
ਜੈਸੇ ਜਲ ਮਹਿ ਕਮਲ ਅਲੇਪ ॥
ਬ੍ਰਹਮ ਗਿਆਨੀ ਸਦਾ ਨਿਰਦੋਖ ॥
ਜੈਸੇ ਸੂਰੁ ਸਰਬ ਕਉ ਸੋਖ ॥
ਬ੍ਰਹਮ ਗਿਆਨੀ ਕੈ ਦ੍ਰਿਸਟਿ ਸਮਾਨਿ ॥
ਜੈਸੇ ਰਾਜ ਰੰਕ ਕਉ ਲਾਗੈ ਤੁਲਿ ਪਵਾਨ ॥
ਬ੍ਰਹਮ ਗਿਆਨੀ ਕੈ ਧੀਰਜੁ ਏਕ ॥
ਜਿਉ ਬਸੁਧਾ ਕੋਊ ਖੋਦੈ ਕੋਊ ਚੰਦਨ ਲੇਪ ॥
ਬ੍ਰਹਮ ਗਿਆਨੀ ਕਾ ਇਹੈ ਗੁਨਾਉ ॥
ਨਾਨਕ ਜਿਉ ਪਾਵਕ ਕਾ ਸਹਜ ਸੁਭਾਉ ॥੧॥
ਬ੍ਰਹਮ ਗਿਆਨੀ ਨਿਰਮਲ ਤੇ ਨਿਰਮਲਾ ॥
ਜੈਸੇ ਮੈਲੁ ਨ ਲਾਗੈ ਜਲਾ ॥
ਬ੍ਰਹਮ ਗਿਆਨੀ ਕੈ ਮਨਿ ਹੋਇ ਪ੍ਰਗਾਸੁ ॥
ਜੈਸੇ ਧਰ ਊਪਰਿ ਆਕਾਸੁ ॥
ਬ੍ਰਹਮ ਗਿਆਨੀ ਕੈ ਮਿਤ੍ਰ ਸਤ੍ਰੁ ਸਮਾਨਿ ॥
ਬ੍ਰਹਮ ਗਿਆਨੀ ਕੈ ਨਾਹੀ ਅਭਿਮਾਨ ॥
ਬ੍ਰਹਮ ਗਿਆਨੀ ਊਚ ਤੇ ਊਚਾ ॥
ਮਨਿ ਅਪਨੈ ਹੈ ਸਭ ਤੇ ਨੀਚਾ ॥
ਬ੍ਰਹਮ ਗਿਆਨੀ ਸੇ ਜਨ ਭਏ ॥
ਨਾਨਕ ਜਿਨ ਪ੍ਰਭੁ ਆਪਿ ਕਰੇਇ ॥੨॥
ਬ੍ਰਹਮ ਗਿਆਨੀ ਸਗਲ ਕੀ ਰੀਨਾ ॥
ਆਤਮ ਰਸੁ ਬ੍ਰਹਮ ਗਿਆਨੀ ਚੀਨਾ ॥
ਬ੍ਰਹਮ ਗਿਆਨੀ ਕੀ ਸਭ ਊਪਰਿ ਮਇਆ ॥
ਬ੍ਰਹਮ ਗਿਆਨੀ ਤੇ ਕਛੁ ਬੁਰਾ ਨ ਭਇਆ ॥
ਬ੍ਰਹਮ ਗਿਆਨੀ ਸਦਾ ਸਮਦਰਸੀ ॥
ਬ੍ਰਹਮ ਗਿਆਨੀ ਕੀ ਦ੍ਰਿਸਟਿ ਅੰਮ੍ਰਿਤੁ ਬਰਸੀ ॥
ਬ੍ਰਹਮ ਗਿਆਨੀ ਬੰਧਨ ਤੇ ਮੁਕਤਾ ॥
ਬ੍ਰਹਮ ਗਿਆਨੀ ਕੀ ਨਿਰਮਲ ਜੁਗਤਾ ॥
ਬ੍ਰਹਮ ਗਿਆਨੀ ਕਾ ਭੋਜਨੁ ਗਿਆਨ ॥
ਨਾਨਕ ਬ੍ਰਹਮ ਗਿਆਨੀ ਕਾ ਬ੍ਰਹਮ ਧਿਆਨੁ ॥੩॥
ਬ੍ਰਹਮ ਗਿਆਨੀ ਏਕ ਊਪਰਿ ਆਸ ॥
ਬ੍ਰਹਮ ਗਿਆਨੀ ਕਾ ਨਹੀ ਬਿਨਾਸ ॥
ਬ੍ਰਹਮ ਗਿਆਨੀ ਕੈ ਗਰੀਬੀ ਸਮਾਹਾ ॥
ਬ੍ਰਹਮ ਗਿਆਨੀ ਪਰਉਪਕਾਰ ਉਮਾਹਾ ॥
ਬ੍ਰਹਮ ਗਿਆਨੀ ਕੈ ਨਾਹੀ ਧੰਧਾ ॥
ਬ੍ਰਹਮ ਗਿਆਨੀ ਲੇ ਧਾਵਤੁ ਬੰਧਾ ॥
ਬ੍ਰਹਮ ਗਿਆਨੀ ਕੈ ਹੋਇ ਸੁ ਭਲਾ ॥
ਬ੍ਰਹਮ ਗਿਆਨੀ ਸੁਫਲ ਫਲਾ ॥
ਬ੍ਰਹਮ ਗਿਆਨੀ ਸੰਗਿ ਸਗਲ ਉਧਾਰੁ ॥
ਨਾਨਕ ਬ੍ਰਹਮ ਗਿਆਨੀ ਜਪੈ ਸਗਲ ਸੰਸਾਰੁ ॥੪॥
ਬ੍ਰਹਮ ਗਿਆਨੀ ਕੈ ਏਕੈ ਰੰਗ ॥
ਬ੍ਰਹਮ ਗਿਆਨੀ ਕੈ ਬਸੈ ਪ੍ਰਭੁ ਸੰਗ ॥
ਬ੍ਰਹਮ ਗਿਆਨੀ ਕੈ ਨਾਮੁ ਆਧਾਰੁ ॥
ਬ੍ਰਹਮ ਗਿਆਨੀ ਕੈ ਨਾਮੁ ਪਰਵਾਰੁ ॥
ਬ੍ਰਹਮ ਗਿਆਨੀ ਸਦਾ ਸਦ ਜਾਗਤ ॥
ਬ੍ਰਹਮ ਗਿਆਨੀ ਅਹੰਬੁਧਿ ਤਿਆਗਤ ॥
ਬ੍ਰਹਮ ਗਿਆਨੀ ਕੈ ਮਨਿ ਪਰਮਾਨੰਦ ॥
ਬ੍ਰਹਮ ਗਿਆਨੀ ਕੈ ਘਰਿ ਸਦਾ ਅਨੰਦ ॥
ਬ੍ਰਹਮ ਗਿਆਨੀ ਸੁਖ ਸਹਜ ਨਿਵਾਸ ॥
ਨਾਨਕ ਬ੍ਰਹਮ ਗਿਆਨੀ ਕਾ ਨਹੀ ਬਿਨਾਸ ॥੫॥
ਬ੍ਰਹਮ ਗਿਆਨੀ ਬ੍ਰਹਮ ਕਾ ਬੇਤਾ ॥
ਬ੍ਰਹਮ ਗਿਆਨੀ ਏਕ ਸੰਗਿ ਹੇਤਾ ॥
ਬ੍ਰਹਮ ਗਿਆਨੀ ਕੈ ਹੋਇ ਅਚਿੰਤ ॥
ਬ੍ਰਹਮ ਗਿਆਨੀ ਕਾ ਨਿਰਮਲ ਮੰਤ ॥
ਬ੍ਰਹਮ ਗਿਆਨੀ ਜਿਸੁ ਕਰੈ ਪ੍ਰਭੁ ਆਪਿ ॥
ਬ੍ਰਹਮ ਗਿਆਨੀ ਕਾ ਬਡ ਪਰਤਾਪ ॥
ਬ੍ਰਹਮ ਗਿਆਨੀ ਕਾ ਦਰਸੁ ਬਡਭਾਗੀ ਪਾਈਐ ॥
ਬ੍ਰਹਮ ਗਿਆਨੀ ਕਉ ਬਲਿ ਬਲਿ ਜਾਈਐ ॥
ਬ੍ਰਹਮ ਗਿਆਨੀ ਕਉ ਖੋਜਹਿ ਮਹੇਸੁਰ ॥
ਨਾਨਕ ਬ੍ਰਹਮ ਗਿਆਨੀ ਆਪਿ ਪਰਮੇਸੁਰ ॥੬॥
ਬ੍ਰਹਮ ਗਿਆਨੀ ਕੀ ਕੀਮਤਿ ਨਾਹਿ ॥
ਬ੍ਰਹਮ ਗਿਆਨੀ ਕੈ ਸਗਲ ਮਨ ਮਾਹਿ ॥
ਬ੍ਰਹਮ ਗਿਆਨੀ ਕਾ ਕਉਨ ਜਾਨੈ ਭੇਦੁ ॥
ਬ੍ਰਹਮ ਗਿਆਨੀ ਕਉ ਸਦਾ ਅਦੇਸੁ ॥
ਬ੍ਰਹਮ ਗਿਆਨੀ ਕਾ ਕਥਿਆ ਨ ਜਾਇ ਅਧਾਖੵਰੁ ॥
ਬ੍ਰਹਮ ਗਿਆਨੀ ਸਰਬ ਕਾ ਠਾਕੁਰੁ ॥
ਬ੍ਰਹਮ ਗਿਆਨੀ ਕੀ ਮਿਤਿ ਕਉਨੁ ਬਖਾਨੈ ॥
ਬ੍ਰਹਮ ਗਿਆਨੀ ਕੀ ਗਤਿ ਬ੍ਰਹਮ ਗਿਆਨੀ ਜਾਨੈ ॥
ਬ੍ਰਹਮ ਗਿਆਨੀ ਕਾ ਅੰਤੁ ਨ ਪਾਰੁ ॥
ਨਾਨਕ ਬ੍ਰਹਮ ਗਿਆਨੀ ਕਉ ਸਦਾ ਨਮਸਕਾਰੁ ॥੭॥
ਬ੍ਰਹਮ ਗਿਆਨੀ ਸਭ ਸ੍ਰਿਸਟਿ ਕਾ ਕਰਤਾ ॥
ਬ੍ਰਹਮ ਗਿਆਨੀ ਸਦ ਜੀਵੈ ਨਹੀ ਮਰਤਾ ॥
ਬ੍ਰਹਮ ਗਿਆਨੀ ਮੁਕਤਿ ਜੁਗਤਿ ਜੀਅ ਕਾ ਦਾਤਾ ॥
ਬ੍ਰਹਮ ਗਿਆਨੀ ਪੂਰਨ ਪੁਰਖੁ ਬਿਧਾਤਾ ॥
ਬ੍ਰਹਮ ਗਿਆਨੀ ਅਨਾਥ ਕਾ ਨਾਥੁ ॥
ਬ੍ਰਹਮ ਗਿਆਨੀ ਕਾ ਸਭ ਊਪਰਿ ਹਾਥੁ ॥
ਬ੍ਰਹਮ ਗਿਆਨੀ ਕਾ ਸਗਲ ਅਕਾਰੁ ॥
ਬ੍ਰਹਮ ਗਿਆਨੀ ਆਪਿ ਨਿਰੰਕਾਰੁ ॥
ਬ੍ਰਹਮ ਗਿਆਨੀ ਕੀ ਸੋਭਾ ਬ੍ਰਹਮ ਗਿਆਨੀ ਬਨੀ ॥
ਨਾਨਕ ਬ੍ਰਹਮ ਗਿਆਨੀ ਸਰਬ ਕਾ ਧਨੀ ॥੮॥੮॥
ਸਲੋਕੁ ॥
ਉਰਿ ਧਾਰੈ ਜੋ ਅੰਤਰਿ ਨਾਮੁ ॥
ਸਰਬ ਮੈ ਪੇਖੈ ਭਗਵਾਨੁ ॥
ਨਿਮਖ ਨਿਮਖ ਠਾਕੁਰ ਨਮਸਕਾਰੈ ॥
ਨਾਨਕ ਓਹੁ ਅਪਰਸੁ ਸਗਲ ਨਿਸਤਾਰੈ ॥੧॥`,
        transliteration: `salok |
man saachaa mukh saachaa soe |
avar na pekhai ekas bin koe |
naanak ih lachhan braham giaanee hoe |1|
asattapadee |
braham giaanee sadaa niralep |
jaise jal meh kamal alep |
braham giaanee sadaa niradokh |
jaise soor sarab kau sokh |
braham giaanee kai drisatt samaan |
jaise raaj rank kau laagai tul pavaan |
braham giaanee kai dheeraj ek |
jiau basudhaa koaoo khodai koaoo chandan lep |
braham giaanee kaa ihai gunaau |
naanak jiau paavak kaa sehaj subhaau |1|
braham giaanee niramal te niramalaa |
jaise mail na laagai jalaa |
braham giaanee kai man hoe pragaas |
jaise dhar aoopar aakaas |
braham giaanee kai mitr satru samaan |
braham giaanee kai naahee abhimaan |
braham giaanee aooch te aoochaa |
man apanai hai sabh te neechaa |
braham giaanee se jan bhe |
naanak jin prabh aap karee |2|
braham giaanee sagal kee reenaa |
aatam ras braham giaanee cheenaa |
braham giaanee kee sabh aoopar meaa |
braham giaanee te kachh buraa na bheaa |
braham giaanee sadaa samadarasee |
braham giaanee kee drisatt amrit barasee |
braham giaanee bandhan te mukataa |
braham giaanee kee niramal jugataa |
braham giaanee kaa bhojan giaan |
naanak braham giaanee kaa braham dhiaan |3|
braham giaanee ek aoopar aas |
braham giaanee kaa nahee binaas |
braham giaanee kai gareebee samaahaa |
braham giaanee praupakaar umaahaa |
braham giaanee kai naahee dhandhaa |
braham giaanee le dhaavat bandhaa |
braham giaanee kai hoe su bhalaa |
braham giaanee sufal falaa |
braham giaanee sang sagal udhaar |
naanak braham giaanee japai sagal sansaar |4|
braham giaanee kai ekai rang |
braham giaanee kai basai prabh sang |
braham giaanee kai naam aadhaar |
braham giaanee kai naam paravaar |
braham giaanee sadaa sad jaagat |
braham giaanee ahanbudh tiaagat |
braham giaanee kai man paramaanand |
braham giaanee kai ghar sadaa anand |
braham giaanee sukh sehaj nivaas |
naanak braham giaanee kaa nahee binaas |5|
braham giaanee braham kaa betaa |
braham giaanee ek sang hetaa |
braham giaanee kai hoe achint |
braham giaanee kaa niramal mant |
braham giaanee jis karai prabh aap |
braham giaanee kaa badd parataap |
braham giaanee kaa daras baddabhaagee paaeeai |
braham giaanee kau bal bal jaaeeai |
braham giaanee kau khojeh mahesur |
naanak braham giaanee aap paramesur |6|
braham giaanee kee keemat naeh |
braham giaanee kai sagal man maeh |
braham giaanee kaa kaun jaanai bhed |
braham giaanee kau sadaa ades |
braham giaanee kaa kathiaa na jaae adhaakhayar |
braham giaanee sarab kaa tthaakur |
braham giaanee kee mit kaun bakhaanai |
braham giaanee kee gat braham giaanee jaanai |
braham giaanee kaa ant na paar |
naanak braham giaanee kau sadaa namasakaar |7|
braham giaanee sabh srisatt kaa karataa |
braham giaanee sad jeevai nahee marataa |
braham giaanee mukat jugat jeea kaa daataa |
braham giaanee pooran purakh bidhaataa |
braham giaanee anaath kaa naath |
braham giaanee kaa sabh aoopar haath |
braham giaanee kaa sagal akaar |
braham giaanee aap nirankaar |
braham giaanee kee sobhaa braham giaanee banee |
naanak braham giaanee sarab kaa dhanee |8|8|
salok |
aur dhaarai jo antar naam |
sarab mai pekhai bhagavaan |
nimakh nimakh tthaakur namasakaarai |
naanak ohu aparas sagal nisataarai |1|`,
        meaning: `Salok: The True One is on his mind, and the True One is upon his lips. He sees only the One. O Nanak, these are the qualities of the God-conscious being. ||1|| Ashtapadee: The God-conscious being is always unattached, as the lotus in the water remains detached. The God-conscious being is always unstained, like the sun, which gives its comfort and warmth to all. The God-conscious being looks upon all alike, like the wind, which blows equally upon the king and the poor beggar. The God-conscious being has a steady patience, like the earth, which is dug up by one, and anointed with sandal paste by another. This is the quality of the God-conscious being: O Nanak, his inherent nature is like a warming fire. ||1|| The God-conscious being is the purest of the pure; filth does not stick to water. The God-conscious being's mind is enlightened, like the sky above the earth. To the God-conscious being, friend and foe are the same. The God-conscious being has no egotistical pride. The God-conscious being is the highest of the high. Within his own mind, he is the most humble of all. They alone become God-conscious beings, O Nanak, whom God Himself makes so. ||2|| The God-conscious being is the dust of all. The God-conscious being knows the nature of the soul. The God-conscious being shows kindness to all. No evil comes from the God-conscious being. The God-conscious being is always impartial. Nectar rains down from the glance of the God-conscious being. The God-conscious being is free from entanglements. The lifestyle of the God-conscious being is spotlessly pure. Spiritual wisdom is the food of the God-conscious being. O Nanak, the God-conscious being is absorbed in God's meditation. ||3|| The God-conscious being centers his hopes on the One alone. The God-conscious being shall never perish. The God-conscious being is steeped in humility. The God-conscious being delights in doing good to others. The God-conscious being has no worldly entanglements. The God-conscious being holds his wandering mind under control. The God-conscious being acts in the common good. The God-conscious being blossoms in fruitfulness. In the Company of the God-conscious being, all are saved. O Nanak, through the God-conscious being, the whole world meditates on God. ||4|| The God-conscious being loves the One Lord alone. The God-conscious being dwells with God. The God-conscious being takes the Naam as his Support. The God-conscious being has the Naam as his Family. The God-conscious being is awake and aware, forever and ever. The God-conscious being renounces his proud ego. In the mind of the God-conscious being, there is supreme bliss. In the home of the God-conscious being, there is everlasting bliss. The God-conscious being dwells in peaceful ease. O Nanak, the God-conscious being shall never perish. ||5|| The God-conscious being knows God. The God-conscious being is in love with the One alone. The God-conscious being is carefree. Pure are the Teachings of the God-conscious being. The God-conscious being is made so by God Himself. The God-conscious being is gloriously great. The Darshan, the Blessed Vision of the God-conscious being, is obtained by great good fortune. To the God-conscious being, I make my life a sacrifice. The God-conscious being is sought by the great god Shiva. O Nanak, the God-conscious being is Himself the Supreme Lord God. ||6|| The God-conscious being cannot be appraised. The God-conscious being has all within his mind. Who can know the mystery of the God-conscious being? Forever bow to the God-conscious being. The God-conscious being cannot be described in words. The God-conscious being is the Lord and Master of all. Who can describe the limits of the God-conscious being? Only the God-conscious being can know the state of the God-conscious being. The God-conscious being has no end or limitation. O Nanak, to the God-conscious being, bow forever in reverence. ||7|| The God-conscious being is the Creator of all the world. The God-conscious being lives forever, and does not die. The God-conscious being is the Giver of the way of liberation of the soul. The God-conscious being is the Perfect Supreme Being, who orchestrates all. The God-conscious being is the helper of the helpless. The God-conscious being extends his hand to all. The God-conscious being owns the entire creation. The God-conscious being is himself the Formless Lord. The glory of the God-conscious being belongs to the God-conscious being alone. O Nanak, the God-conscious being is the Lord of all. ||8||8|| Salok: One who enshrines the Naam within the heart, who sees the Lord God in all, who, each and every moment, bows in reverence to the Lord Master - O Nanak, such a one is the true 'touch-nothing Saint', who emancipates everyone. ||1||`,
        meaning_pa: `(ਜਿਸ ਮਨੁੱਖ ਦੇ) ਮਨ ਵਿਚ ਸਦਾ-ਥਿਰ ਰਹਿਣ ਵਾਲਾ ਪ੍ਰਭੂ (ਵੱਸਦਾ ਹੈ), (ਜੋ) ਮੂੰਹੋਂ (ਭੀ) ਉਸੇ ਪ੍ਰਭੂ ਨੂੰ (ਜਪਦਾ ਹੈ), (ਜੋ ਮਨੁੱਖ) ਇਕ ਅਕਾਲ ਪੁਰਖ ਤੋਂ ਬਿਨਾ (ਕਿਤੇ ਭੀ) ਕਿਸੇ ਹੋਰ ਨੂੰ ਨਹੀਂ ਵੇਖਦਾ, ਹੇ ਨਾਨਕ! (ਉਹ ਮਨੁੱਖ) ਇਹਨਾਂ ਗੁਣਾਂ ਦੇ ਕਾਰਣ ਬ੍ਰਹਮਗਿਆਨੀ ਹੋ ਜਾਂਦਾ ਹੈ ॥੧॥ ਬ੍ਰਹਮਗਿਆਨੀ (ਮਨੁੱਖ ਵਿਕਾਰਾਂ ਵਲੋਂ) ਸਦਾ-ਬੇਦਾਗ਼ (ਰਹਿੰਦੇ ਹਨ) ਜਿਵੇਂ ਪਾਣੀ ਵਿਚ (ਉੱਗੇ ਹੋਏ) ਕਉਲ ਫੁੱਲ (ਚਿੱਕੜ ਤੋਂ) ਸਾਫ਼ ਹੁੰਦੇ ਹਨ। ਬ੍ਰਹਮਗਿਆਨੀ (ਮਨੁੱਖ) (ਸਾਰੇ ਪਾਪਾਂ ਨੂੰ ਸਾੜ ਦੇਂਦੇ ਹਨ) ਪਾਪਾਂ ਤੋਂ ਬਚੇ ਰਹਿੰਦੇ ਹਨ, ਜਿਵੇਂ ਸੂਰਜ ਸਾਰੇ (ਰਸਾਂ) ਨੂੰ ਸੁਕਾ ਦੇਂਦਾ ਹੈ। ਬ੍ਰਹਮਗਿਆਨੀ ਦੇ ਅੰਦਰ (ਸਭ ਵਲ) ਇਕੋ ਜਿਹੀ ਨਜ਼ਰ (ਨਾਲ ਤੱਕਣ ਦਾ ਸੁਭਾਉ ਹੁੰਦਾ) ਹੈ, ਜਿਵੇਂ ਹਵਾ ਰਾਜੇ ਤੇ ਕੰਗਾਲ ਨੂੰ ਇਕੋ ਜਿਹੀ ਲੱਗਦੀ ਹੈ। (ਕੋਈ ਭਲਾ ਕਹੇ ਭਾਵੇਂ ਬੁਰਾ, ਪਰ) ਬ੍ਰਹਮਗਿਆਨੀ ਮਨੁੱਖਾਂ ਦੇ ਅੰਦਰ ਇਕ-ਤਾਰ ਹੌਸਲਾ (ਕਾਇਮ ਰਹਿੰਦਾ) ਹੈ, ਜਿਵੇਂ ਧਰਤੀ ਨੂੰ ਕੋਈ ਤਾਂ ਖੋਤਰਦਾ ਹੈ, ਤੇ ਕੋਈ ਚੰਦਨ ਦੇ ਲੇਪਣ ਕਰਦਾ ਹੈ (ਪਰ ਧਰਤੀ ਨੂੰ ਪਰਵਾਹ ਨਹੀਂ)। ਬ੍ਰਹਮਗਿਆਨੀ ਮਨੁੱਖਾਂ ਦਾ (ਭੀ) ਇਹੀ ਗੁਣ ਹੈ, ਹੇ ਨਾਨਕ! ਜਿਵੇਂ ਅੱਗ ਦਾ ਕੁਦਰਤੀ ਸੁਭਾਉ ਹੈ (ਹਰੇਕ ਚੀਜ਼ ਦੀ ਮੈਲ ਸਾੜ ਦੇਣੀ) ॥੧॥ ਬ੍ਰਹਮਗਿਆਨੀ ਮਨੁੱਖ (ਵਿਕਾਰਾਂ ਦੀ ਮੈਲ ਤੋਂ ਸਦਾ ਬਚਿਆ ਰਹਿ ਕੇ) ਮਹਾ ਨਿਰਮਲ ਹੈ, ਜਿਵੇਂ ਪਾਣੀ ਨੂੰ ਕਦੇ ਮੈਲ ਨਹੀਂ ਰਹਿ ਸਕਦੀ (ਬੁਖ਼ਾਰਾਤ ਆਦਿਕ ਬਣ ਕੇ ਮੁੜ ਸਾਫ਼ ਦਾ ਸਾਫ਼।) ਬ੍ਰਹਮਗਿਆਨੀ ਦੇ ਮਨ ਵਿਚ (ਇਹ) ਚਾਨਣ ਹੋ ਜਾਂਦਾ ਹੈ (ਕਿ ਪ੍ਰਭੂ ਹਰ ਥਾਂ ਮੌਜੂਦ ਹੈ) ਜਿਵੇਂ ਧਰਤੀ ਉਤੇ ਆਕਾਸ਼ (ਸਭ ਥਾਂ ਵਿਆਪਕ ਹੈ।) ਬ੍ਰਹਮਗਿਆਨੀ ਨੂੰ ਸੱਜਣ ਤੇ ਵੈਰੀ ਇਕੋ ਜਿਹਾ ਹੈ, (ਕਿਉਂਕ) ਉਸ ਦੇ ਅੰਦਰ ਅਹੰਕਾਰ ਨਹੀਂ ਹੈ (ਕਿਸੇ ਦੇ ਚੰਗੇ ਮੰਦੇ ਸਲੂਕ ਦਾ ਹਰਖ ਸੋਗ ਨਹੀਂ)। ਬ੍ਰਹਮਗਿਆਨੀ (ਆਤਮਕ ਅਵਸਥਾ ਵਿਚ) ਸਭ ਤੋਂ ਉੱਚਾ ਹੈ, (ਪਰ) ਆਪਣੇ ਮਨ ਵਿਚ (ਆਪਣੇ ਆਪ ਨੂੰ) ਸਭ ਤੋਂ ਨੀਵਾਂ (ਜਾਣਦਾ ਹੈ)। ਉਹੀ ਮਨੁੱਖ ਬ੍ਰਹਮਗਿਆਨੀ ਬਣਦੇ ਹਨ, ਹੇ ਨਾਨਕ! ਜਿਨ੍ਹਾਂ ਨੂੰ ਪ੍ਰਭੂ ਆਪ ਬਣਾਉਂਦਾ ਹੈ ॥੨॥ ਬ੍ਰਹਮਗਿਆਨੀ ਸਾਰੇ (ਬੰਦਿਆਂ) ਦੇ ਪੈਰਾਂ ਦੀ ਖ਼ਾਕ (ਹੋ ਕੇ ਰਹਿੰਦਾ) ਹੈ; ਬ੍ਰਹਮਗਿਆਨੀ ਨੇ ਆਤਮਕ ਆਨੰਦ ਨੂੰ ਪਛਾਣ ਲਿਆ ਹੈ। ਬ੍ਰਹਮਗਿਆਨੀ ਦੀ ਸਭ ਉਤੇ ਖ਼ੁਸ਼ੀ ਹੁੰਦੀ ਹੈ (ਭਾਵ, ਬ੍ਰਹਮ-ਗਿਆਨੀ ਸਭ ਨਾਲ ਹੱਸਦੇ-ਮੱਥੇ ਰਹਿੰਦਾ ਹੈ) ਅਤੇ ਉਹ ਕੋਈ ਮੰਦਾ ਕੰਮ ਨਹੀਂ ਕਰਦਾ। ਬ੍ਰਹਮਗਿਆਨੀ ਸਦਾ ਸਭ ਵਲ ਇਕੋ ਜਿਹੀ ਨਜ਼ਰ ਨਾਲ ਤੱਕਦਾ ਹੈ, ਉਸ ਦੀ ਨਜ਼ਰ ਤੋਂ (ਸਭ ਉਤੇ) ਅੰਮ੍ਰਿਤ ਦੀ ਵਰਖਾ ਹੁੰਦੀ ਹੈ। ਬ੍ਰਹਮਗਿਆਨੀ (ਮਾਇਆ ਦੇ) ਬੰਧਨਾਂ ਤੋਂ ਆਜ਼ਾਦ ਹੁੰਦਾ ਹੈ, ਅਤੇ ਉਸ ਦੀ ਜੀਵਨ-ਜੁਗਤੀ ਵਿਕਾਰਾਂ ਤੋਂ ਰਹਿਤ ਹੈ। (ਰੱਬੀ-) ਗਿਆਨ ਬ੍ਰਹਮਗਿਆਨੀ ਦੀ ਖ਼ੁਰਾਕ ਹੈ (ਭਾਵ, ਬ੍ਰਹਮਗਿਆਨੀ ਦੀ ਆਤਮਕ ਜ਼ਿੰਦਗੀ ਦਾ ਆਸਰਾ ਹੈ), ਹੇ ਨਾਨਕ! ਬ੍ਰਹਮਗਿਆਨੀ ਦੀ ਸੁਰਤ ਅਕਾਲ ਪੁਰਖ ਨਾਲ ਜੁੜੀ ਰਹਿੰਦੀ ਹੈ ॥੩॥ ਬ੍ਰਹਮਗਿਆਨੀ ਇਕ ਅਕਾਲ ਪੁਰਖ ਉਤੇ ਆਸ ਰੱਖਦਾ ਹੈ; ਬ੍ਰਹਮਗਿਆਨੀ (ਦੀ ਉੱਚੀ ਆਤਮਕ ਅਵਸਥਾ) ਦਾ ਕਦੇ ਨਾਸ ਨਹੀਂ ਹੁੰਦਾ। ਬ੍ਰਹਮਗਿਆਨੀ ਦੇ ਹਿਰਦੇ ਵਿਚ ਗਰੀਬੀ ਟਿਕੀ ਰਹਿੰਦੀ ਹੈ, ਅਤੇ ਉਸ ਨੂੰ ਦੂਜਿਆਂ ਦੀ ਭਲਾਈ ਕਰਨ ਦਾ (ਸਦਾ) ਚਾਉ (ਚੜ੍ਹਿਆ ਰਹਿੰਦਾ) ਹੈ। ਬ੍ਰਹਮਗਿਆਨੀ ਦੇ ਮਨ ਵਿਚ (ਮਾਇਆ ਦਾ) ਜੰਜਾਲ ਨਹੀਂ ਵਿਆਪਦਾ, (ਕਿਉਂਕਿ) ਉਹ ਭਟਕਦੇ ਮਨ ਨੂੰ ਕਾਬੂ ਕਰ ਕੇ (ਮਾਇਆ ਵਲੋਂ) ਰੋਕ ਸਕਦਾ ਹੈ। ਜੋ ਕੁਝ (ਪ੍ਰਭੂ ਵਲੋਂ) ਹੁੰਦਾ ਹੈ, ਬ੍ਰਹਮਗਿਆਨੀ ਨੂੰ ਆਪਣੇ ਮਨ ਵਿਚ ਭਲਾ ਪ੍ਰਤੀਤ ਹੁੰਦਾ ਹੈ, ਇਸ ਤਰ੍ਹਾਂ) ਉਸ ਦਾ ਮਨੁੱਖਾ ਜਨਮ ਚੰਗੀ ਤਰ੍ਹਾਂ ਕਾਮਯਾਬ ਹੁੰਦਾ ਹੈ। ਬ੍ਰਹਮਗਿਆਨੀ ਦੀ ਸੰਗਤਿ ਵਿਚ ਸਭ ਦਾ ਬੇੜਾ ਪਾਰ ਹੁੰਦਾ ਹੈ, (ਕਿਉਂਕਿ) ਹੇ ਨਾਨਕ! ਬ੍ਰਹਮਗਿਆਨੀ ਦੀ ਰਾਹੀਂ ਸਾਰਾ ਜਗਤ (ਹੀ) (ਪ੍ਰਭੂ ਦਾ ਨਾਮ) ਜਪਣ ਲੱਗ ਪੈਂਦਾ ਹੈ ॥੪॥ ਬ੍ਰਹਮਗਿਆਨੀ ਦੇ ਹਿਰਦੇ ਵਿਚ (ਸਦਾ) ਇਕ ਅਕਾਲ ਪੁਰਖ ਦਾ ਪਿਆਰ (ਵੱਸਦਾ ਹੈ), (ਤਾਹੀਏਂ) ਪ੍ਰਭੂ ਬ੍ਰਹਮਗਿਆਨੀ ਦੇ ਅੰਗ-ਸੰਗ ਰਹਿੰਦਾ ਹੈ। ਬ੍ਰਹਮਗਿਆਨੀ ਦੇ ਮਨ ਵਿਚ (ਪ੍ਰਭੂ ਦਾ) ਨਾਮ (ਹੀ) ਟੇਕ ਹੈ, ਅਤੇ ਨਾਮ ਹੀ ਉਸ ਦਾ ਪਰਵਾਰ ਹੈ। ਬ੍ਰਹਮਗਿਆਨੀ ਸਦਾ (ਵਿਕਾਰਾਂ ਦੇ ਹਮਲੇ ਵਲੋਂ) ਸੁਚੇਤ ਰਹਿੰਦਾ ਹੈ, ਅਤੇ 'ਮੈਂ ਮੈਂ' ਕਰਨ ਵਾਲੀ ਮੱਤ ਛੱਡ ਦੇਂਦਾ ਹੈ। ਬ੍ਰਹਮਗਿਆਨੀ ਦੇ ਮਨ ਵਿਚ ਉੱਚੇ ਸੁਖ ਦਾ ਮਾਲਕ ਅਕਾਲ ਪੁਰਖ ਵੱਸਦਾ ਹੈ, (ਤਾਹੀਏਂ) ਉਸ ਦੇ ਹਿਰਦੇ-ਰੂਪ ਘਰ ਵਿਚ ਸਦਾ ਖ਼ੁਸ਼ੀ ਖਿੜਾਓ ਹੈ। ਬ੍ਰਹਮਗਿਆਨੀ (ਮਨੁੱਖ) ਸੁਖ ਤੇ ਸ਼ਾਂਤੀ ਵਿਚ ਟਿਕਿਆ ਰਹਿੰਦਾ ਹੈ; (ਤੇ) ਹੇ ਨਾਨਕ! ਬ੍ਰਹਮਗਿਆਨੀ (ਦੀ ਇਸ ਉੱਚੀ ਆਤਮਕ ਅਵਸਥਾ) ਦਾ ਕਦੇ ਨਾਸ ਨਹੀਂ ਹੁੰਦਾ ॥੫॥ ਬ੍ਰਹਮਗਿਆਨੀ (ਮਨੁੱਖ) ਅਕਾਲ ਪੁਰਖ ਦਾ ਮਹਰਮ ਬਣ ਜਾਂਦਾ ਹੈ, ਅਤੇ ਉਹ ਇਕ ਪ੍ਰਭੂ ਨਾਲ ਹੀ ਪਿਆਰ ਕਰਦਾ ਹੈ। ਬ੍ਰਹਮਗਿਆਨੀ ਦੇ ਮਨ ਵਿਚ (ਸਦਾ) ਬੇਫ਼ਿਕਰੀ ਰਹਿੰਦੀ ਹੈ, ਉਸ ਦਾ ਉਪਦੇਸ਼ (ਭੀ ਹੋਰਨਾਂ ਨੂੰ) ਪਵਿਤ੍ਰ ਕਰਨ ਵਾਲਾ ਹੁੰਦਾ ਹੈ। (ਉਹੀ ਮਨੁੱਖ ਬ੍ਰਹਮਗਿਆਨੀ ਬਣਦਾ ਹੈ) ਜਿਸ ਨੂੰ ਪ੍ਰਭੂ ਆਪ ਬਣਾਉਂਦਾ ਹੈ, ਬ੍ਰਹਮਗਿਆਨੀ ਦਾ ਬੜਾ ਨਾਮਣਾ ਹੋ ਜਾਂਦਾ ਹੈ। ਬ੍ਰਹਮਗਿਆਨੀ ਦਾ ਦੀਦਾਰ ਵੱਡੇ ਭਾਗਾਂ ਨਾਲ ਪਾਈਦਾ ਹੈ; ਬ੍ਰਹਮਗਿਆਨੀ ਤੋਂ ਸਦਾ ਸਦਕੇ ਜਾਈਏ। ਸ਼ਿਵ (ਆਦਿਕ ਦੇਵਤੇ ਭੀ) ਬ੍ਰਹਮਗਿਆਨੀ ਨੂੰ ਭਾਲਦੇ ਫਿਰਦੇ ਹਨ; ਹੇ ਨਾਨਕ! ਅਕਾਲ ਪੁਰਖ ਆਪ ਬ੍ਰਹਮਗਿਆਨੀ (ਦਾ ਰੂਪ) ਹੈ ॥੬॥ ਬ੍ਰਹਮਗਿਆਨੀ (ਦੇ ਗੁਣਾਂ) ਦਾ ਮੁੱਲ ਨਹੀਂ ਪੈ ਸਕਦਾ, ਸਾਰੇ ਹੀ (ਗੁਣ) ਬ੍ਰਹਮਗਿਆਨੀ ਦੇ ਅੰਦਰ ਹਨ। ਕੇਹੜਾ ਮਨੁੱਖ ਬ੍ਰਹਮਗਿਆਨੀ (ਦੀ ਉੱਚੀ ਜ਼ਿੰਦਗੀ) ਦਾ ਭੇਤ ਪਾ ਸਕਦਾ ਹੈ? ਬ੍ਰਹਮਗਿਆਨੀ ਦੇ ਅੱਗੇ ਸਦਾ ਨਿਊਣਾ ਹੀ (ਫੱਬਦਾ) ਹੈ। ਬ੍ਰਹਮਗਿਆਨੀ (ਦੀ ਮਹਿਮਾ) ਦਾ ਅੱਧਾ ਅੱਖਰ ਭੀ ਨਹੀਂ ਕਿਹਾ ਜਾ ਸਕਦਾ; ਬ੍ਰਹਮਗਿਆਨੀ ਸਾਰੇ (ਜੀਵਾਂ) ਦਾ ਪੂਜ੍ਯ ਹੈ। ਬ੍ਰਹਮਗਿਆਨੀ (ਦੀ ਉੱਚੀ ਜ਼ਿੰਦਗੀ) ਦਾ ਅੰਦਾਜ਼ਾ ਕੌਣ ਲਾ ਸਕਦਾ ਹੈ? ਉਸ ਦੀ ਹਾਲਤ (ਉਸ ਵਰਗਾ) ਬ੍ਰਹਮਗਿਆਨੀ ਹੀ ਜਾਣਦਾ ਹੈ। ਬ੍ਰਹਮਗਿਆਨੀ (ਦੇ ਗੁਣਾਂ ਦੇ ਸਮੁੰਦਰ) ਦਾ ਕੋਈ ਹੱਦ ਬੰਨਾ ਨਹੀਂ; ਹੇ ਨਾਨਕ! ਸਦਾ ਬ੍ਰਹਮਗਿਆਨੀ ਦੇ ਚਰਨਾਂ ਤੇ ਪਿਆ ਰਹੁ ॥੭॥ ਬ੍ਰਹਮਗਿਆਨੀ ਸਾਰੇ ਜਗਤ ਦਾ ਬਣਾਉਣ ਵਾਲਾ ਹੈ, ਸਦਾ ਹੀ ਜਿਊਂਦਾ ਹੈ, ਕਦੇ (ਜਨਮ) ਮਰਨ ਦੇ ਗੇੜ ਵਿਚ ਨਹੀਂ ਆਉਂਦਾ। ਬ੍ਰਹਮਗਿਆਨੀ ਮੁਕਤੀ ਦਾ ਰਾਹ (ਦੱਸਣ ਵਾਲਾ ਤੇ ਉੱਚੀ ਆਤਮਕ) ਜ਼ਿੰਦਗੀ ਦਾ ਦੇਣ ਵਾਲਾ ਹੈ, ਉਹੀ ਪੂਰਨ ਪੁਰਖ ਤੇ ਕਾਦਰ ਹੈ। ਬ੍ਰਹਮਗਿਆਨੀ ਨਿਖ਼ਸਮਿਆਂ ਦਾ ਖ਼ਸਮ ਹੈ, ਸਭ ਦੀ ਸਹਾਇਤਾ ਕਰਦਾ ਹੈ। ਸਾਰਾ ਦਿੱਸਦਾ ਜਗਤ ਬ੍ਰਹਮਗਿਆਨੀ ਦਾ (ਆਪਣਾ) ਹੈ, ਉਹ (ਤਾਂ ਪ੍ਰਤੱਖ) ਆਪ ਹੀ ਰੱਬ ਹੈ। ਬ੍ਰਹਮਗਿਆਨੀ ਦੀ ਮਹਿਮਾ (ਕੋਈ) ਬ੍ਰਹਮਗਿਆਨੀ ਹੀ ਕਰ ਸਕਦਾ ਹੈ; ਹੇ ਨਾਨਕ! ਬ੍ਰਹਮਗਿਆਨੀ ਸਭ ਜੀਵਾਂ ਦਾ ਮਾਲਕ ਹੈ ॥੮॥੮॥ ਜੋ ਮਨੁੱਖ ਸਦਾ ਆਪਣੇ ਹਿਰਦੇ ਵਿਚ ਅਕਾਲ ਪੁਰਖ ਦਾ ਨਾਮ ਟਿਕਾ ਰੱਖਦਾ ਹੈ, ਅਤੇ ਭਗਵਾਨ ਨੂੰ ਸਭਨਾਂ ਵਿਚ ਵਿਆਪਕ ਵੇਖਦਾ ਹੈ, ਜੋ ਪਲ ਪਲ ਆਪਣੇ ਪ੍ਰਭੂ ਨੂੰ ਜੁਹਾਰਦਾ ਹੈ; ਹੇ ਨਾਨਕ! ਉਹ (ਅਸਲੀ) ਅਪਰਸ ਹੈ ਅਤੇ ਉਹ ਸਭ ਜੀਵਾਂ ਨੂੰ (ਸੰਸਾਰ-ਸਮੁੰਦਰ ਤੋਂ) ਤਾਰ ਲੈਂਦਾ ਹੈ ॥੧॥`
      },
      {
        number: 9,
        sanskrit: `ਸਲੋਕੁ ॥
ਉਰਿ ਧਾਰੈ ਜੋ ਅੰਤਰਿ ਨਾਮੁ ॥
ਸਰਬ ਮੈ ਪੇਖੈ ਭਗਵਾਨੁ ॥
ਨਿਮਖ ਨਿਮਖ ਠਾਕੁਰ ਨਮਸਕਾਰੈ ॥
ਨਾਨਕ ਓਹੁ ਅਪਰਸੁ ਸਗਲ ਨਿਸਤਾਰੈ ॥੧॥
ਅਸਟਪਦੀ ॥
ਮਿਥਿਆ ਨਾਹੀ ਰਸਨਾ ਪਰਸ ॥
ਮਨ ਮਹਿ ਪ੍ਰੀਤਿ ਨਿਰੰਜਨ ਦਰਸ ॥
ਪਰ ਤ੍ਰਿਅ ਰੂਪੁ ਨ ਪੇਖੈ ਨੇਤ੍ਰ ॥
ਸਾਧ ਕੀ ਟਹਲ ਸੰਤਸੰਗਿ ਹੇਤ ॥
ਕਰਨ ਨ ਸੁਨੈ ਕਾਹੂ ਕੀ ਨਿੰਦਾ ॥
ਸਭ ਤੇ ਜਾਨੈ ਆਪਸ ਕਉ ਮੰਦਾ ॥
ਗੁਰ ਪ੍ਰਸਾਦਿ ਬਿਖਿਆ ਪਰਹਰੈ ॥
ਮਨ ਕੀ ਬਾਸਨਾ ਮਨ ਤੇ ਟਰੈ ॥
ਇੰਦ੍ਰੀ ਜਿਤ ਪੰਚ ਦੋਖ ਤੇ ਰਹਤ ॥
ਨਾਨਕ ਕੋਟਿ ਮਧੇ ਕੋ ਐਸਾ ਅਪਰਸ ॥੧॥
ਬੈਸਨੋ ਸੋ ਜਿਸੁ ਊਪਰਿ ਸੁਪ੍ਰਸੰਨ ॥
ਬਿਸਨ ਕੀ ਮਾਇਆ ਤੇ ਹੋਇ ਭਿੰਨ ॥
ਕਰਮ ਕਰਤ ਹੋਵੈ ਨਿਹਕਰਮ ॥
ਤਿਸੁ ਬੈਸਨੋ ਕਾ ਨਿਰਮਲ ਧਰਮ ॥
ਕਾਹੂ ਫਲ ਕੀ ਇਛਾ ਨਹੀ ਬਾਛੈ ॥
ਕੇਵਲ ਭਗਤਿ ਕੀਰਤਨ ਸੰਗਿ ਰਾਚੈ ॥
ਮਨ ਤਨ ਅੰਤਰਿ ਸਿਮਰਨ ਗੋਪਾਲ ॥
ਸਭ ਊਪਰਿ ਹੋਵਤ ਕਿਰਪਾਲ ॥
ਆਪਿ ਦ੍ਰਿੜੈ ਅਵਰਹ ਨਾਮੁ ਜਪਾਵੈ ॥
ਨਾਨਕ ਓਹੁ ਬੈਸਨੋ ਪਰਮ ਗਤਿ ਪਾਵੈ ॥੨॥
ਭਗਉਤੀ ਭਗਵੰਤ ਭਗਤਿ ਕਾ ਰੰਗੁ ॥
ਸਗਲ ਤਿਆਗੈ ਦੁਸਟ ਕਾ ਸੰਗੁ ॥
ਮਨ ਤੇ ਬਿਨਸੈ ਸਗਲਾ ਭਰਮੁ ॥
ਕਰਿ ਪੂਜੈ ਸਗਲ ਪਾਰਬ੍ਰਹਮੁ ॥
ਸਾਧਸੰਗਿ ਪਾਪਾ ਮਲੁ ਖੋਵੈ ॥
ਤਿਸੁ ਭਗਉਤੀ ਕੀ ਮਤਿ ਊਤਮ ਹੋਵੈ ॥
ਭਗਵੰਤ ਕੀ ਟਹਲ ਕਰੈ ਨਿਤ ਨੀਤਿ ॥
ਮਨੁ ਤਨੁ ਅਰਪੈ ਬਿਸਨ ਪਰੀਤਿ ॥
ਹਰਿ ਕੇ ਚਰਨ ਹਿਰਦੈ ਬਸਾਵੈ ॥
ਨਾਨਕ ਐਸਾ ਭਗਉਤੀ ਭਗਵੰਤ ਕਉ ਪਾਵੈ ॥੩॥
ਸੋ ਪੰਡਿਤੁ ਜੋ ਮਨੁ ਪਰਬੋਧੈ ॥
ਰਾਮ ਨਾਮੁ ਆਤਮ ਮਹਿ ਸੋਧੈ ॥
ਰਾਮ ਨਾਮ ਸਾਰੁ ਰਸੁ ਪੀਵੈ ॥
ਉਸੁ ਪੰਡਿਤ ਕੈ ਉਪਦੇਸਿ ਜਗੁ ਜੀਵੈ ॥
ਹਰਿ ਕੀ ਕਥਾ ਹਿਰਦੈ ਬਸਾਵੈ ॥
ਸੋ ਪੰਡਿਤੁ ਫਿਰਿ ਜੋਨਿ ਨ ਆਵੈ ॥
ਬੇਦ ਪੁਰਾਨ ਸਿਮ੍ਰਿਤਿ ਬੂਝੈ ਮੂਲ ॥
ਸੂਖਮ ਮਹਿ ਜਾਨੈ ਅਸਥੂਲੁ ॥
ਚਹੁ ਵਰਨਾ ਕਉ ਦੇ ਉਪਦੇਸੁ ॥
ਨਾਨਕ ਉਸੁ ਪੰਡਿਤ ਕਉ ਸਦਾ ਅਦੇਸੁ ॥੪॥
ਬੀਜ ਮੰਤ੍ਰੁ ਸਰਬ ਕੋ ਗਿਆਨੁ ॥
ਚਹੁ ਵਰਨਾ ਮਹਿ ਜਪੈ ਕੋਊ ਨਾਮੁ ॥
ਜੋ ਜੋ ਜਪੈ ਤਿਸ ਕੀ ਗਤਿ ਹੋਇ ॥
ਸਾਧਸੰਗਿ ਪਾਵੈ ਜਨੁ ਕੋਇ ॥
ਕਰਿ ਕਿਰਪਾ ਅੰਤਰਿ ਉਰ ਧਾਰੈ ॥
ਪਸੁ ਪ੍ਰੇਤ ਮੁਘਦ ਪਾਥਰ ਕਉ ਤਾਰੈ ॥
ਸਰਬ ਰੋਗ ਕਾ ਅਉਖਦੁ ਨਾਮੁ ॥
ਕਲਿਆਣ ਰੂਪ ਮੰਗਲ ਗੁਣ ਗਾਮ ॥
ਕਾਹੂ ਜੁਗਤਿ ਕਿਤੈ ਨ ਪਾਈਐ ਧਰਮਿ ॥
ਨਾਨਕ ਤਿਸੁ ਮਿਲੈ ਜਿਸੁ ਲਿਖਿਆ ਧੁਰਿ ਕਰਮਿ ॥੫॥
ਜਿਸ ਕੈ ਮਨਿ ਪਾਰਬ੍ਰਹਮ ਕਾ ਨਿਵਾਸੁ ॥
ਤਿਸ ਕਾ ਨਾਮੁ ਸਤਿ ਰਾਮਦਾਸੁ ॥
ਆਤਮ ਰਾਮੁ ਤਿਸੁ ਨਦਰੀ ਆਇਆ ॥
ਦਾਸ ਦਸੰਤਣ ਭਾਇ ਤਿਨਿ ਪਾਇਆ ॥
ਸਦਾ ਨਿਕਟਿ ਨਿਕਟਿ ਹਰਿ ਜਾਨੁ ॥
ਸੋ ਦਾਸੁ ਦਰਗਹ ਪਰਵਾਨੁ ॥
ਅਪੁਨੇ ਦਾਸ ਕਉ ਆਪਿ ਕਿਰਪਾ ਕਰੈ ॥
ਤਿਸੁ ਦਾਸ ਕਉ ਸਭ ਸੋਝੀ ਪਰੈ ॥
ਸਗਲ ਸੰਗਿ ਆਤਮ ਉਦਾਸੁ ॥
ਐਸੀ ਜੁਗਤਿ ਨਾਨਕ ਰਾਮਦਾਸੁ ॥੬॥
ਪ੍ਰਭ ਕੀ ਆਗਿਆ ਆਤਮ ਹਿਤਾਵੈ ॥
ਜੀਵਨ ਮੁਕਤਿ ਸੋਊ ਕਹਾਵੈ ॥
ਤੈਸਾ ਹਰਖੁ ਤੈਸਾ ਉਸੁ ਸੋਗੁ ॥
ਸਦਾ ਅਨੰਦੁ ਤਹ ਨਹੀ ਬਿਓਗੁ ॥
ਤੈਸਾ ਸੁਵਰਨੁ ਤੈਸੀ ਉਸੁ ਮਾਟੀ ॥
ਤੈਸਾ ਅੰਮ੍ਰਿਤੁ ਤੈਸੀ ਬਿਖੁ ਖਾਟੀ ॥
ਤੈਸਾ ਮਾਨੁ ਤੈਸਾ ਅਭਿਮਾਨੁ ॥
ਤੈਸਾ ਰੰਕੁ ਤੈਸਾ ਰਾਜਾਨੁ ॥
ਜੋ ਵਰਤਾਏ ਸਾਈ ਜੁਗਤਿ ॥
ਨਾਨਕ ਓਹੁ ਪੁਰਖੁ ਕਹੀਐ ਜੀਵਨ ਮੁਕਤਿ ॥੭॥
ਪਾਰਬ੍ਰਹਮ ਕੇ ਸਗਲੇ ਠਾਉ ॥
ਜਿਤੁ ਜਿਤੁ ਘਰਿ ਰਾਖੈ ਤੈਸਾ ਤਿਨ ਨਾਉ ॥
ਆਪੇ ਕਰਨ ਕਰਾਵਨ ਜੋਗੁ ॥
ਪ੍ਰਭ ਭਾਵੈ ਸੋਈ ਫੁਨਿ ਹੋਗੁ ॥
ਪਸਰਿਓ ਆਪਿ ਹੋਇ ਅਨਤ ਤਰੰਗ ॥
ਲਖੇ ਨ ਜਾਹਿ ਪਾਰਬ੍ਰਹਮ ਕੇ ਰੰਗ ॥
ਜੈਸੀ ਮਤਿ ਦੇਇ ਤੈਸਾ ਪਰਗਾਸ ॥
ਪਾਰਬ੍ਰਹਮੁ ਕਰਤਾ ਅਬਿਨਾਸ ॥
ਸਦਾ ਸਦਾ ਸਦਾ ਦਇਆਲ ॥
ਸਿਮਰਿ ਸਿਮਰਿ ਨਾਨਕ ਭਏ ਨਿਹਾਲ ॥੮॥੯॥
ਸਲੋਕੁ ॥
ਉਸਤਤਿ ਕਰਹਿ ਅਨੇਕ ਜਨ ਅੰਤੁ ਨ ਪਾਰਾਵਾਰ ॥
ਨਾਨਕ ਰਚਨਾ ਪ੍ਰਭਿ ਰਚੀ ਬਹੁ ਬਿਧਿ ਅਨਿਕ ਪ੍ਰਕਾਰ ॥੧॥`,
        transliteration: `salok |
aur dhaarai jo antar naam |
sarab mai pekhai bhagavaan |
nimakh nimakh tthaakur namasakaarai |
naanak ohu aparas sagal nisataarai |1|
asattapadee |
mithiaa naahee rasanaa paras |
man meh preet niranjan daras |
par tria roop na pekhai netr |
saadh kee ttehal santasang het |
karan na sunai kaahoo kee nindaa |
sabh te jaanai aapas kau mandaa |
gur prasaad bikhiaa paraharai |
man kee baasanaa man te ttarai |
eindree jit panch dokh te rehat |
naanak kott madhe ko aisaa aparas |1|
baisano so jis aoopar suprasan |
bisan kee maaeaa te hoe bhin |
karam karat hovai nihakaram |
tis baisano kaa niramal dharam |
kaahoo fal kee ichhaa nahee baachhai |
keval bhagat keeratan sang raachai |
man tan antar simaran gopaal |
sabh aoopar hovat kirapaal |
aap drirrai avarah naam japaavai |
naanak ohu baisano param gat paavai |2|
bhgautee bhagavant bhagat kaa rang |
sagal tiaagai dusatt kaa sang |
man te binasai sagalaa bharam |
kar poojai sagal paarabraham |
saadhasang paapaa mal khovai |
tis bhgautee kee mat aootam hovai |
bhagavant kee ttehal karai nit neet |
man tan arapai bisan pareet |
har ke charan hiradai basaavai |
naanak aisaa bhgautee bhagavant kau paavai |3|
so panddit jo man parabodhai |
raam naam aatam meh sodhai |
raam naam saar ras peevai |
aus panddit kai upades jag jeevai |
har kee kathaa hiradai basaavai |
so panddit fir jon na aavai |
bed puraan simrit boojhai mool |
sookham meh jaanai asathool |
chahu varanaa kau de upades |
naanak us panddit kau sadaa ades |4|
beej mantru sarab ko giaan |
chahu varanaa meh japai koaoo naam |
jo jo japai tis kee gat hoe |
saadhasang paavai jan koe |
kar kirapaa antar ur dhaarai |
pas pret mughad paathar kau taarai |
sarab rog kaa aaukhad naam |
kaliaan roop mangal gun gaam |
kaahoo jugat kitai na paaeeai dharam |
naanak tis milai jis likhiaa dhur karam |5|
jis kai man paarabraham kaa nivaas |
tis kaa naam sat raamadaas |
aatam raam tis nadaree aaeaa |
daas dasantan bhaae tin paaeaa |
sadaa nikatt nikatt har jaan |
so daas daragah paravaan |
apune daas kau aap kirapaa karai |
tis daas kau sabh sojhee parai |
sagal sang aatam udaas |
aisee jugat naanak raamadaas |6|
prabh kee aagiaa aatam hitaavai |
jeevan mukat soaoo kahaavai |
taisaa harakh taisaa us sog |
sadaa anand teh nahee biog |
taisaa suvaran taisee us maattee |
taisaa amrit taisee bikh khaattee |
taisaa maan taisaa abhimaan |
taisaa rank taisaa raajaan |
jo varataae saaee jugat |
naanak ohu purakh kaheeai jeevan mukat |7|
paarabraham ke sagale tthaau |
jit jit ghar raakhai taisaa tin naau |
aape karan karaavan jog |
prabh bhaavai soee fun hog |
pasario aap hoe anat tarang |
lakhe na jaeh paarabraham ke rang |
jaisee mat dee taisaa paragaas |
paarabraham karataa abinaas |
sadaa sadaa sadaa deaal |
simar simar naanak bhe nihaal |8|9|
salok |
ausatat kareh anek jan ant na paaraavaar |
naanak rachanaa prabh rachee bahu bidh anik prakaar |1|`,
        meaning: `Salok: One who enshrines the Naam within the heart, who sees the Lord God in all, who, each and every moment, bows in reverence to the Lord Master - O Nanak, such a one is the true 'touch-nothing Saint', who emancipates everyone. ||1|| Ashtapadee: One whose tongue does not touch falsehood; whose mind is filled with love for the Blessed Vision of the Pure Lord, whose eyes do not gaze upon the beauty of others' wives, who serves the Holy and loves the Saints' Congregation, whose ears do not listen to slander against anyone, who deems himself to be the worst of all, who, by Guru's Grace, renounces corruption, who banishes the mind's evil desires from his mind, who conquers his sexual instincts and is free of the five sinful passions - O Nanak, among millions, there is scarcely one such 'touch-nothing Saint'. ||1|| The true Vaishnaav, the devotee of Vishnu, is the one with whom God is thoroughly pleased. He dwells apart from Maya. Performing good deeds, he does not seek rewards. Spotlessly pure is the religion of such a Vaishnaav; he has no desire for the fruits of his labors. He is absorbed in devotional worship and the singing of Kirtan, the songs of the Lord's Glory. Within his mind and body, he meditates in remembrance on the Lord of the Universe. He is kind to all creatures. He holds fast to the Naam, and inspires others to chant it. O Nanak, such a Vaishnaav obtains the supreme status. ||2|| The true Bhagaautee, the devotee of Adi Shakti, loves the devotional worship of God. He forsakes the company of all wicked people. All doubts are removed from his mind. He performs devotional service to the Supreme Lord God in all. In the Company of the Holy, the filth of sin is washed away. The wisdom of such a Bhagaautee becomes supreme. He constantly performs the service of the Supreme Lord God. He dedicates his mind and body to the Love of God. The Lotus Feet of the Lord abide in his heart. O Nanak, such a Bhagaautee attains the Lord God. ||3|| He is a true Pandit, a religious scholar, who instructs his own mind. He searches for the Lord's Name within his own soul. He drinks in the Exquisite Nectar of the Lord's Name. By that Pandit's teachings, the world lives. He implants the Sermon of the Lord in his heart. Such a Pandit is not cast into the womb of reincarnation again. He understands the fundamental essence of the Vedas, the Puraanas and the Simritees. In the unmanifest, he sees the manifest world to exist. He gives instruction to people of all castes and social classes. O Nanak, to such a Pandit, I bow in salutation forever. ||4|| The Beej Mantra, the Seed Mantra, is spiritual wisdom for everyone. Anyone, from any class, may chant the Naam. Whoever chants it, is emancipated. And yet, rare are those who attain it, in the Company of the Holy. By His Grace, He enshrines it within. Even beasts, ghosts and the stone-hearted are saved. The Naam is the panacea, the remedy to cure all ills. Singing the Glory of God is the embodiment of bliss and emancipation. It cannot be obtained by any religious rituals. O Nanak, he alone obtains it, whose karma is so pre-ordained. ||5|| One whose mind is a home for the Supreme Lord God - his name is truly Ram Das, the Lord's servant. He comes to have the Vision of the Lord, the Supreme Soul. Deeming himself to be the slave of the Lord's slaves, he obtains it. He knows the Lord to be Ever-present, close at hand. Such a servant is honored in the Court of the Lord. To His servant, He Himself shows His Mercy. Such a servant understands everything. Amidst all, his soul is unattached. Such is the way, O Nanak, of the Lord's servant. ||6|| One who, in his soul, loves the Will of God, is said to be Jivan Mukta - liberated while yet alive. As is joy, so is sorrow to him. He is in eternal bliss, and is not separated from God. As is gold, so is dust to him. As is ambrosial nectar, so is bitter poison to him. As is honor, so is dishonor. As is the beggar, so is the king. Whatever God ordains, that is his way. O Nanak, that being is known as Jivan Mukta. ||7|| All places belong to the Supreme Lord God. According to the homes in which they are placed, so are His creatures named. He Himself is the Doer, the Cause of causes. Whatever pleases God, ultimately comes to pass. He Himself is All-pervading, in endless waves. The playful sport of the Supreme Lord God cannot be known. As the understanding is given, so is one enlightened. The Supreme Lord God, the Creator, is eternal and everlasting. Forever, forever and ever, He is merciful. Remembering Him, remembering Him in meditation, O Nanak, one is blessed with ecstasy. ||8||9|| Salok: Many people praise the Lord. He has no end or limitation. O Nanak, God created the creation, with its many ways and various species. ||1||`,
        meaning_pa: `ਜੋ ਮਨੁੱਖ ਸਦਾ ਆਪਣੇ ਹਿਰਦੇ ਵਿਚ ਅਕਾਲ ਪੁਰਖ ਦਾ ਨਾਮ ਟਿਕਾ ਰੱਖਦਾ ਹੈ, ਅਤੇ ਭਗਵਾਨ ਨੂੰ ਸਭਨਾਂ ਵਿਚ ਵਿਆਪਕ ਵੇਖਦਾ ਹੈ, ਜੋ ਪਲ ਪਲ ਆਪਣੇ ਪ੍ਰਭੂ ਨੂੰ ਜੁਹਾਰਦਾ ਹੈ; ਹੇ ਨਾਨਕ! ਉਹ (ਅਸਲੀ) ਅਪਰਸ ਹੈ ਅਤੇ ਉਹ ਸਭ ਜੀਵਾਂ ਨੂੰ (ਸੰਸਾਰ-ਸਮੁੰਦਰ ਤੋਂ) ਤਾਰ ਲੈਂਦਾ ਹੈ ॥੧॥ ਜੋ ਮਨੁੱਖ ਜੀਭ ਨਾਲ ਝੂਠ ਨੂੰ ਛੋਹਣ ਨਹੀਂ ਦੇਂਦਾ, ਮਨ ਵਿਚ ਅਕਾਲ ਪੁਰਖ ਦੇ ਦੀਦਾਰ ਦੀ ਤਾਂਘ ਰੱਖਦਾ ਹੈ; ਜੋ ਪਰਾਈ ਇਸਤ੍ਰੀ ਦੇ ਹੁਸਨ ਨੂੰ ਆਪਣੀਆਂ ਅੱਖਾਂ ਨਾਲ ਨਹੀਂ ਤੱਕਦਾ, ਭਲੇ ਮਨੁੱਖਾਂ ਦੀ ਟਹਲ (ਕਰਦਾ ਹੈ) ਤੇ ਸੰਤ ਜਨਾਂ ਦੀ ਸੰਗਤਿ ਵਿਚ ਪ੍ਰੀਤ (ਰੱਖਦਾ ਹੈ); ਜੋ ਕੰਨਾਂ ਨਾਲ ਕਿਸੇ ਦੀ ਭੀ ਨਿੰਦਿਆ ਨਹੀਂ ਸੁਣਦਾ, (ਸਗੋਂ) ਸਾਰਿਆਂ ਨਾਲੋਂ ਆਪਣੇ ਆਪ ਨੂੰ ਮਾੜਾ ਸਮਝਦਾ ਹੈ; ਜੋ ਗੁਰੂ ਦੀ ਮੇਹਰ ਦਾ ਸਦਕਾ ਮਾਇਆ (ਦਾ ਪ੍ਰਭਾਵ) ਪਰੇ ਹਟਾ ਦੇਂਦਾ ਹੈ, ਤੇ ਜਿਸ ਦੇ ਮਨ ਦੀ ਵਾਸਨਾ ਮਨ ਤੋਂ ਟਲ ਜਾਂਦੀ ਹੈ; ਜੋ ਆਪਣੇ ਗਿਆਨ-ਇੰਦ੍ਰਿਆਂ ਨੂੰ ਵੱਸ ਵਿਚ ਰੱਖ ਕੇ ਕਾਮਾਦਿਕ ਪੰਜੇ ਹੀ ਵਿਕਾਰਾਂ ਤੋਂ ਬਚਿਆ ਰਹਿੰਦਾ ਹੈ, ਹੇ ਨਾਨਕ! ਕਰੋੜਾਂ ਵਿਚੋਂ ਕੋਈ ਇਹੋ ਜਿਹਾ ਵਿਰਲਾ ਬੰਦਾ "ਅਪਰਸ" (ਕਿਹਾ ਜਾ ਸਕਦਾ ਹੈ) ॥੧॥ ਜਿਸ ਉਤੇ ਪ੍ਰਭੂ ਆਪ ਤ੍ਰੁਠਦਾ ਹੈ, ਉਹ ਹੈ ਅਸਲੀ ਵੈਸ਼ਨੋ, ਜੋ ਮਨੁੱਖ ਪ੍ਰਭੂ ਦੀ ਮਾਇਆ ਦੇ ਅਸਰ ਤੋਂ ਬੇ-ਦਾਗ਼ ਹੈ। ਜੋ (ਧਰਮ ਦੇ) ਕੰਮ ਕਰਦਾ ਹੋਇਆ ਇਹਨਾਂ ਕੰਮਾਂ ਦੇ ਫਲ ਦੀ ਇੱਛਾ ਨਹੀਂ ਰੱਖਦਾ, ਉਸ ਵੈਸ਼ਨੋ ਦਾ ਧਰਮ (ਭੀ) ਪਵਿਤ੍ਰ ਹੈ । ਜੋ ਮਨੁੱਖ ਕਿਸੇ ਭੀ ਫਲ ਦੀ ਖ਼ਾਹਸ਼ ਨਹੀਂ ਕਰਦਾ; ਨਿਰਾ ਭਗਤੀ ਤੇ ਕੀਰਤਨ ਵਿਚ ਮਸਤ ਰਹਿੰਦਾ ਹੈ, ਜਿਸ ਦੇ ਮਨ ਤਨ ਵਿਚ ਪ੍ਰਭੂ ਦਾ ਸਿਮਰਨ ਵੱਸ ਰਿਹਾ ਹੈ, ਜੋ ਸਭ ਜੀਵਾਂ ਉਤੇ ਦਇਆ ਕਰਦਾ ਹੈ, ਜੋ ਆਪ (ਪ੍ਰਭੂ ਦੇ ਨਾਮ ਨੂੰ) ਆਪਣੇ ਮਨ ਵਿਚ ਟਿਕਾਉਂਦਾ ਹੈ ਤੇ ਹੋਰਨਾਂ ਨੂੰ ਨਾਮ ਜਪਾਉਂਦਾ ਹੈ, ਹੇ ਨਾਨਕ! ਉਹ ਵੈਸ਼ਨੋ ਉੱਚਾ ਦਰਜਾ ਹਾਸਲ ਕਰਦਾ ਹੈ ॥੨॥ ਭਗਵਾਨ ਦਾ (ਅਸਲੀ) ਉਪਾਸ਼ਕ (ਉਹ ਹੈ ਜਿਸ ਦੇ ਹਿਰਦੇ ਵਿਚ) ਭਗਵਾਨ ਦੀ ਭਗਤੀ ਦਾ ਪਿਆਰ ਹੈ, ਤੇ ਜੋ ਸਭ ਮੰਦ-ਕਰਮੀਆਂ ਦੀ ਸੁਹਬਤ ਛੱਡ ਦੇਂਦਾ ਹੈ; ਜਿਸ ਦੇ ਮਨ ਵਿਚੋਂ ਹਰ ਤਰ੍ਹਾਂ ਦਾ ਵਹਿਮ ਮਿਟ ਜਾਂਦਾ ਹੈ, ਜੋ ਅਕਾਲ ਪੁਰਖ ਨੂੰ ਹਰ ਥਾਂ ਮੌਜੂਦ ਜਾਣ ਕੇ ਪੂਜਦਾ ਹੈ, ਜੋ ਗੁਰਮੁਖਾਂ ਦੀ ਸੰਗਤਿ ਵਿਚ ਰਹਿ ਕੇ ਪਾਪਾਂ ਦੀ ਮੈਲ (ਮਨ ਤੋਂ) ਦੂਰ ਕਰਦਾ ਹੈ, ਉਸ ਭਗਉਤੀ ਦੀ ਮਤਿ ਉੱਚੀ ਹੁੰਦੀ ਹੈ। ਜੋ ਨਿੱਤ ਭਗਵਾਨ ਦਾ ਸਿਮਰਨ ਕਰਦਾ ਹੈ, ਜੋ ਪ੍ਰਭੂ-ਪਿਆਰ ਤੋਂ ਆਪਣਾ ਮਨ ਤੇ ਤਨ ਕੁਰਬਾਨ ਕਰ ਦੇਂਦਾ ਹੈ; ਜੋ ਪ੍ਰਭੂ ਦੇ ਚਰਨ (ਸਦਾ ਆਪਣੇ) ਹਿਰਦੇ ਵਿਚ ਵਸਾਉਂਦਾ ਹੈ। ਹੇ ਨਾਨਕ! ਅਜੇਹਾ ਭਗਉਤੀ ਭਗਵਾਨ ਨੂੰ ਲੱਭ ਲੈਂਦਾ ਹੈ ॥੩॥ (ਅਸਲੀ) ਪੰਡਿਤ ਉਹ ਹੈ ਜੋ ਆਪਣੇ ਮਨ ਨੂੰ ਸਿੱਖਿਆ ਦੇਂਦਾ ਹੈ, ਅਤੇ ਪ੍ਰਭੂ ਦੇ ਨਾਮ ਨੂੰ ਆਪਣੇ ਮਨ ਵਿਚ ਭਾਲਦਾ ਹੈ। ਜੋ ਪ੍ਰਭੂ-ਨਾਮ ਦਾ ਮਿੱਠਾ ਸੁਆਦ ਚੱਖਦਾ ਹੈ, ਉਸ ਪੰਡਿਤ ਦੇ ਉਪਦੇਸ਼ ਨਾਲ (ਸਾਰਾ) ਸੰਸਾਰ ਰੂਹਾਨੀ ਜ਼ਿੰਦਗੀ ਹਾਸਲ ਕਰਦਾ ਹੈ। ਜੋ ਅਕਾਲ ਪੁਰਖ (ਦੀ ਸਿਫ਼ਤ-ਸਾਲਾਹ) ਦੀਆਂ ਗੱਲਾਂ ਆਪਣੇ ਹਿਰਦੇ ਵਿਚ ਵਸਾਉਂਦਾ ਹੈ, ਉਹ ਪੰਡਿਤ ਮੁੜ ਜਨਮ (ਮਰਨ) ਵਿਚ ਨਹੀਂ ਆਉਂਦਾ। ਜੋ ਵੇਦ ਪੁਰਾਣ ਸਿਮ੍ਰਿਤੀਆਂ (ਆਦਿਕ ਸਭ ਧਰਮ-ਪੁਸਤਕਾਂ) ਦਾ ਮੁੱਢ (ਪ੍ਰਭੂ ਨੂੰ) ਸਮਝਦਾ ਹੈ, ਜੋ ਇਹ ਜਾਣਦਾ ਹੈ ਕਿ ਇਹ ਸਾਰਾ ਦਿੱਸਦਾ ਜਗਤ ਅਦ੍ਰਿਸ਼ਟ ਪ੍ਰਭੂ ਦੇ ਹੀ ਆਸਰੇ ਹੈ; ਜੋ (ਬ੍ਰਾਹਮਣ, ਖਤ੍ਰੀ, ਵੈਸ਼, ਸ਼ੂਦਰ) ਚਾਰੇ ਹੀ ਜਾਤੀਆਂ ਨੂੰ ਸਿੱਖਿਆ ਦੇਂਦਾ ਹੈ, ਹੇ ਨਾਨਕ! (ਆਖ) ਉਸ ਪੰਡਿਤ ਅੱਗੇ ਅਸੀਂ ਸਦਾ ਸਿਰ ਨਿਵਾਉਂਦੇ ਹਾਂ ॥੪॥ ਨਾਮ (ਹੋਰ ਸਭ ਮੰਤ੍ਰਾਂ ਦਾ) ਮੁੱਢ ਮੰਤ੍ਰ ਹੈ ਅਤੇ ਸਭ ਦਾ ਗਿਆਨ (ਦਾਤਾ) ਹੈ, (ਬ੍ਰਾਹਮਣ, ਖਤ੍ਰੀ, ਵੈਸ਼, ਸ਼ੂਦਰ) ਚਾਰੇ ਹੀ ਜਾਤੀਆਂ ਵਿਚੋਂ ਕੋਈ ਭੀ ਮਨੁੱਖ (ਪ੍ਰਭੂ ਦਾ) ਨਾਮ ਜਪ (ਕੇ ਵੇਖ ਲਏ) ਜੋ ਜੋ ਮਨੁੱਖ ਨਾਮ ਜਪਦਾ ਹੈ ਉਸ ਦੀ ਉੱਚੀ ਜ਼ਿੰਦਗੀ ਬਣ ਜਾਂਦੀ ਹੈ, (ਪਰ) ਕੋਈ ਵਿਰਲਾ ਮਨੁੱਖ ਸਾਧ ਸੰਗਤਿ ਵਿਚ (ਰਹਿ ਕੇ) (ਇਸ ਨੂੰ) ਹਾਸਲ ਕਰਦਾ ਹੈ। (ਜੇ ਪ੍ਰਭੂ) ਮੇਹਰ ਕਰ ਕੇ (ਉਸ ਦੇ) ਹਿਰਦੇ ਵਿਚ (ਨਾਮ) ਟਿਕਾ ਦੇਵੇ, ਪਸ਼ੂ, ਚੰਦਰੀ ਰੂਹ, ਮੂਰਖ, ਪੱਥਰ (-ਦਿਲ) (ਕੋਈ ਭੀ ਹੋਵੇ ਸਭ) ਨੂੰ (ਨਾਮ) ਤਾਰ ਦੇਂਦਾ ਹੈ। ਪ੍ਰਭੂ ਦਾ ਨਾਮ ਸਾਰੇ ਰੋਗਾਂ ਦੀ ਦਵਾਈ ਹੈ, ਪ੍ਰਭੂ ਦੇ ਗੁਣ ਗਾਉਣੇ ਚੰਗੇ ਭਾਗਾਂ ਤੇ ਸੁਖ ਦਾ ਰੂਪ ਹੈ। (ਪਰ ਇਹ ਨਾਮ ਹੋਰ) ਕਿਸੇ ਢੰਗ ਨਾਲ ਜਾਂ ਕਿਸੇ ਧਾਰਮਿਕ ਰਸਮ ਰਿਵਾਜ ਦੇ ਕਰਨ ਨਾਲ ਨਹੀਂ ਮਿਲਦਾ; ਹੇ ਨਾਨਕ! (ਇਹ ਨਾਮ) ਉਸ ਮਨੁੱਖ ਨੂੰ ਮਿਲਦਾ ਹੈ ਜਿਸ (ਦੇ ਮੱਥੇ ਤੇ) ਧੁਰੋਂ (ਪ੍ਰਭੂ ਦੀ) ਮੇਹਰ ਅਨੁਸਾਰ ਲਿਖਿਆ ਜਾਂਦਾ ਹੈ ॥੫॥ ਜਿਸ ਦੇ ਮਨ ਵਿਚ ਅਕਾਲ ਪੁਰਖ ਵੱਸਦਾ ਹੈ, ਉਸ ਮਨੁੱਖ ਦਾ ਨਾਮ ਅਸਲੀ (ਅਰਥਾਂ ਵਿਚ) 'ਰਾਮਦਾਸੁ' (ਪ੍ਰਭੂ ਦਾ ਸੇਵਕ) ਹੈ; ਉਸ ਨੂੰ ਸਰਬ-ਵਿਆਪੀ ਪ੍ਰਭੂ ਦਿੱਸ ਪੈਂਦਾ ਹੈ, ਦਾਸਾਂ ਦਾ ਦਾਸ ਹੋਣ ਦੇ ਸੁਭਾਉ ਨਾਲ ਉਸ ਨੇ ਪ੍ਰਭੂ ਨੂੰ ਲੱਭਾ ਹੈ। ਜੋ (ਮਨੁੱਖ) ਸਦਾ ਪ੍ਰਭੂ ਨੂੰ ਨੇੜੇ ਜਾਣਦਾ ਹੈ, ਉਹ ਸੇਵਕ ਦਰਗਾਹ ਵਿਚ ਕਬੂਲ ਹੁੰਦਾ ਹੈ। ਪ੍ਰਭੂ ਉਸ ਸੇਵਕ ਉਤੇ ਆਪ ਮੇਹਰ ਕਰਦਾ ਹੈ, ਤੇ ਉਸ ਸੇਵਕ ਨੂੰ ਸਾਰੀ ਸਮਝ ਆ ਜਾਂਦੀ ਹੈ। ਸਾਰੇ ਪਰਵਾਰ ਵਿਚ (ਰਹਿੰਦਾ ਹੋਇਆ ਭੀ) ਉਹ ਅੰਦਰੋਂ ਨਿਰਮੋਹ ਹੁੰਦਾ ਹੈ; ਹੇ ਨਾਨਕ! ਇਹੋ ਜਿਹੀ (ਜੀਵਨ-) ਜੁਗਤੀ ਨਾਲ ਉਹ (ਅਸਲੀ) "ਰਾਮਦਾਸ" (ਰਾਮ ਦਾ ਦਾਸ ਬਣ ਜਾਂਦਾ ਹੈ) ॥੬॥ ਜੋ ਮਨੁੱਖ ਪ੍ਰਭੂ ਦੀ ਰਜ਼ਾ ਨੂੰ ਮਨ ਵਿਚ ਮਿੱਠੀ ਕਰ ਕੇ ਮੰਨਦਾ ਹੈ, ਉਹੀ ਜੀਊਂਦਾ ਮੁਕਤ ਅਖਵਾਉਂਦਾ ਹੈ; ਉਸ ਨੂੰ ਖ਼ੁਸ਼ੀ ਤੇ ਗ਼ਮੀ ਇਕੋ ਜਿਹੀ ਹੈ, ਉਸ ਨੂੰ ਸਦਾ ਆਨੰਦ ਹੈ (ਕਿਉਂਕਿ) ਓਥੇ (ਭਾਵ, ਉਸ ਦੇ ਹਿਰਦੇ ਵਿਚ ਪ੍ਰਭੂ-ਚਰਨਾਂ ਤੋਂ) ਵਿਛੋੜਾ ਨਹੀਂ ਹੈ। ਸੋਨਾ ਤੇ ਮਿੱਟੀ (ਭੀ ਉਸ ਮਨੁੱਖ ਵਾਸਤੇ) ਬਰਾਬਰ ਹੈ (ਭਾਵ, ਸੋਨਾ ਵੇਖ ਕੇ ਉਹ ਲੋਭ ਵਿਚ ਨਹੀਂ ਫਸਦਾ), ਅੰਮ੍ਰਿਤ ਤੇ ਕਉੜੀ ਵਿਹੁ ਭੀ ਉਸ ਲਈ ਇਕ ਜੈਸੀ ਹੈ। (ਕਿਸੇ ਵਲੋਂ) ਆਦਰ (ਦਾ ਵਰਤਾਉ ਹੋਵੇ) ਜਾਂ ਅਹੰਕਾਰ (ਦਾ) (ਉਸ ਮਨੁੱਖ ਵਾਸਤੇ) ਇਕ ਸਮਾਨ ਹੈ, ਕੰਗਾਲ ਤੇ ਸ਼ਹਨਸ਼ਾਹ ਭੀ ਉਸ ਦੀ ਨਜ਼ਰ ਵਿਚ ਬਰਾਬਰ ਹੈ। ਜੋ (ਰਜ਼ਾ ਪ੍ਰਭੂ) ਵਰਤਾਉਂਦਾ ਹੈ, ਉਹੀ (ਉਸ ਵਾਸਤੇ) ਜ਼ਿੰਦਗੀ ਦਾ ਗਾਡੀ-ਰਾਹ ਹੈ; ਹੇ ਨਾਨਕ! ਉਹ ਮਨੁੱਖ ਜੀਊਂਦਾ ਮੁਕਤ ਕਿਹਾ ਜਾ ਸਕਦਾ ਹੈ ॥੭॥ ਸਾਰੇ ਥਾਂ (ਸਰੀਰ-ਰੂਪ ਘਰ) ਅਕਾਲ ਪੁਰਖ ਦੇ ਹੀ ਹਨ, ਜਿਸ ਜਿਸ ਥਾਂ ਜੀਵਾਂ ਨੂੰ ਰੱਖਦਾ ਹੈ, ਉਹੋ ਜਿਹਾ ਉਹਨਾਂ ਦਾ ਨਾਉਂ (ਪੈ ਜਾਂਦਾ ਹੈ)। ਪ੍ਰਭੂ ਆਪ ਹੀ (ਸਭ ਕੁਝ) ਕਰਨ ਦੀ (ਤੇ ਜੀਵਾਂ ਪਾਸੋਂ) ਕਰਾਉਣ ਦੀ ਤਾਕਤ ਰੱਖਦਾ ਹੈ, ਜੋ ਪ੍ਰਭੂ ਨੂੰ ਚੰਗਾ ਲੱਗਦਾ ਹੈ ਉਹੀ ਹੁੰਦਾ ਹੈ। (ਜ਼ਿੰਦਗੀ ਦੀਆਂ) ਬੇਅੰਤ ਲਹਿਰਾਂ ਬਣ ਕੇ (ਅਕਾਲ ਪੁਰਖ) ਆਪ ਸਭ ਥਾਈਂ ਮੌਜੂਦ ਹੈ, ਅਕਾਲ ਪੁਰਖ ਦੇ ਖੇਲ ਬਿਆਨ ਨਹੀਂ ਕੀਤੇ ਜਾ ਸਕਦੇ। ਜਿਹੋ ਜਿਹੀ ਅਕਲ ਦੇਂਦਾ ਹੈ, ਉਹੋ ਜਿਹਾ ਜ਼ਹੂਰ (ਜੀਵ ਦੇ ਅੰਦਰ) ਹੁੰਦਾ ਹੈ; ਅਕਾਲ ਪੁਰਖ (ਆਪ ਸਭ ਕੁਝ) ਕਰਨ ਵਾਲਾ ਹੈ ਤੇ ਕਦੇ ਮਰਦਾ ਨਹੀਂ। ਪ੍ਰਭੂ ਸਦਾ ਮੇਹਰ ਕਰਨ ਵਾਲਾ ਹੈ, ਹੇ ਨਾਨਕ! (ਜੀਵ ਉਸ ਨੂੰ) ਸਦਾ ਸਿਮਰ ਕੇ (ਫੁੱਲ ਵਾਂਗ) ਖਿੜੇ ਰਹਿੰਦੇ ਹਨ ॥੮॥੯॥ ਅਨੇਕਾਂ ਬੰਦੇ ਪ੍ਰਭੂ ਦੇ ਗੁਣਾਂ ਦਾ ਜ਼ਿਕਰ ਕਰਦੇ ਹਨ, ਪਰ ਉਹਨਾਂ ਗੁਣਾਂ ਦਾ ਹੱਦ-ਬੰਨਾ ਨਹੀਂ ਲੱਭਦਾ। ਹੇ ਨਾਨਕ! (ਇਹੀ ਸਾਰੀ) ਸ੍ਰਿਸ਼ਟੀ (ਉਸ) ਪ੍ਰਭੂ ਨੇ ਕਈ ਕਿਸਮਾਂ ਦੀ ਕਈ ਤਰੀਕਿਆਂ ਨਾਲ ਬਣਾਈ ਹੈ ॥੧॥`
      },
      {
        number: 10,
        sanskrit: `ਸਲੋਕੁ ॥
ਉਸਤਤਿ ਕਰਹਿ ਅਨੇਕ ਜਨ ਅੰਤੁ ਨ ਪਾਰਾਵਾਰ ॥
ਨਾਨਕ ਰਚਨਾ ਪ੍ਰਭਿ ਰਚੀ ਬਹੁ ਬਿਧਿ ਅਨਿਕ ਪ੍ਰਕਾਰ ॥੧॥
ਅਸਟਪਦੀ ॥
ਕਈ ਕੋਟਿ ਹੋਏ ਪੂਜਾਰੀ ॥
ਕਈ ਕੋਟਿ ਆਚਾਰ ਬਿਉਹਾਰੀ ॥
ਕਈ ਕੋਟਿ ਭਏ ਤੀਰਥ ਵਾਸੀ ॥
ਕਈ ਕੋਟਿ ਬਨ ਭ੍ਰਮਹਿ ਉਦਾਸੀ ॥
ਕਈ ਕੋਟਿ ਬੇਦ ਕੇ ਸ੍ਰੋਤੇ ॥
ਕਈ ਕੋਟਿ ਤਪੀਸੁਰ ਹੋਤੇ ॥
ਕਈ ਕੋਟਿ ਆਤਮ ਧਿਆਨੁ ਧਾਰਹਿ ॥
ਕਈ ਕੋਟਿ ਕਬਿ ਕਾਬਿ ਬੀਚਾਰਹਿ ॥
ਕਈ ਕੋਟਿ ਨਵਤਨ ਨਾਮ ਧਿਆਵਹਿ ॥
ਨਾਨਕ ਕਰਤੇ ਕਾ ਅੰਤੁ ਨ ਪਾਵਹਿ ॥੧॥
ਕਈ ਕੋਟਿ ਭਏ ਅਭਿਮਾਨੀ ॥
ਕਈ ਕੋਟਿ ਅੰਧ ਅਗਿਆਨੀ ॥
ਕਈ ਕੋਟਿ ਕਿਰਪਨ ਕਠੋਰ ॥
ਕਈ ਕੋਟਿ ਅਭਿਗ ਆਤਮ ਨਿਕੋਰ ॥
ਕਈ ਕੋਟਿ ਪਰ ਦਰਬ ਕਉ ਹਿਰਹਿ ॥
ਕਈ ਕੋਟਿ ਪਰ ਦੂਖਨਾ ਕਰਹਿ ॥
ਕਈ ਕੋਟਿ ਮਾਇਆ ਸ੍ਰਮ ਮਾਹਿ ॥
ਕਈ ਕੋਟਿ ਪਰਦੇਸ ਭ੍ਰਮਾਹਿ ॥
ਜਿਤੁ ਜਿਤੁ ਲਾਵਹੁ ਤਿਤੁ ਤਿਤੁ ਲਗਨਾ ॥
ਨਾਨਕ ਕਰਤੇ ਕੀ ਜਾਨੈ ਕਰਤਾ ਰਚਨਾ ॥੨॥
ਕਈ ਕੋਟਿ ਸਿਧ ਜਤੀ ਜੋਗੀ ॥
ਕਈ ਕੋਟਿ ਰਾਜੇ ਰਸ ਭੋਗੀ ॥
ਕਈ ਕੋਟਿ ਪੰਖੀ ਸਰਪ ਉਪਾਏ ॥
ਕਈ ਕੋਟਿ ਪਾਥਰ ਬਿਰਖ ਨਿਪਜਾਏ ॥
ਕਈ ਕੋਟਿ ਪਵਣ ਪਾਣੀ ਬੈਸੰਤਰ ॥
ਕਈ ਕੋਟਿ ਦੇਸ ਭੂ ਮੰਡਲ ॥
ਕਈ ਕੋਟਿ ਸਸੀਅਰ ਸੂਰ ਨਖੵਤ੍ਰ ॥
ਕਈ ਕੋਟਿ ਦੇਵ ਦਾਨਵ ਇੰਦ੍ਰ ਸਿਰਿ ਛਤ੍ਰ ॥
ਸਗਲ ਸਮਗ੍ਰੀ ਅਪਨੈ ਸੂਤਿ ਧਾਰੈ ॥
ਨਾਨਕ ਜਿਸੁ ਜਿਸੁ ਭਾਵੈ ਤਿਸੁ ਤਿਸੁ ਨਿਸਤਾਰੈ ॥੩॥
ਕਈ ਕੋਟਿ ਰਾਜਸ ਤਾਮਸ ਸਾਤਕ ॥
ਕਈ ਕੋਟਿ ਬੇਦ ਪੁਰਾਨ ਸਿਮ੍ਰਿਤਿ ਅਰੁ ਸਾਸਤ ॥
ਕਈ ਕੋਟਿ ਕੀਏ ਰਤਨ ਸਮੁਦ ॥
ਕਈ ਕੋਟਿ ਨਾਨਾ ਪ੍ਰਕਾਰ ਜੰਤ ॥
ਕਈ ਕੋਟਿ ਕੀਏ ਚਿਰ ਜੀਵੇ ॥
ਕਈ ਕੋਟਿ ਗਿਰੀ ਮੇਰ ਸੁਵਰਨ ਥੀਵੇ ॥
ਕਈ ਕੋਟਿ ਜਖੵ ਕਿੰਨਰ ਪਿਸਾਚ ॥
ਕਈ ਕੋਟਿ ਭੂਤ ਪ੍ਰੇਤ ਸੂਕਰ ਮ੍ਰਿਗਾਚ ॥
ਸਭ ਤੇ ਨੇਰੈ ਸਭਹੂ ਤੇ ਦੂਰਿ ॥
ਨਾਨਕ ਆਪਿ ਅਲਿਪਤੁ ਰਹਿਆ ਭਰਪੂਰਿ ॥੪॥
ਕਈ ਕੋਟਿ ਪਾਤਾਲ ਕੇ ਵਾਸੀ ॥
ਕਈ ਕੋਟਿ ਨਰਕ ਸੁਰਗ ਨਿਵਾਸੀ ॥
ਕਈ ਕੋਟਿ ਜਨਮਹਿ ਜੀਵਹਿ ਮਰਹਿ ॥
ਕਈ ਕੋਟਿ ਬਹੁ ਜੋਨੀ ਫਿਰਹਿ ॥
ਕਈ ਕੋਟਿ ਬੈਠਤ ਹੀ ਖਾਹਿ ॥
ਕਈ ਕੋਟਿ ਘਾਲਹਿ ਥਕਿ ਪਾਹਿ ॥
ਕਈ ਕੋਟਿ ਕੀਏ ਧਨਵੰਤ ॥
ਕਈ ਕੋਟਿ ਮਾਇਆ ਮਹਿ ਚਿੰਤ ॥
ਜਹ ਜਹ ਭਾਣਾ ਤਹ ਤਹ ਰਾਖੇ ॥
ਨਾਨਕ ਸਭੁ ਕਿਛੁ ਪ੍ਰਭ ਕੈ ਹਾਥੇ ॥੫॥
ਕਈ ਕੋਟਿ ਭਏ ਬੈਰਾਗੀ ॥
ਰਾਮ ਨਾਮ ਸੰਗਿ ਤਿਨਿ ਲਿਵ ਲਾਗੀ ॥
ਕਈ ਕੋਟਿ ਪ੍ਰਭ ਕਉ ਖੋਜੰਤੇ ॥
ਆਤਮ ਮਹਿ ਪਾਰਬ੍ਰਹਮੁ ਲਹੰਤੇ ॥
ਕਈ ਕੋਟਿ ਦਰਸਨ ਪ੍ਰਭ ਪਿਆਸ ॥
ਤਿਨ ਕਉ ਮਿਲਿਓ ਪ੍ਰਭੁ ਅਬਿਨਾਸ ॥
ਕਈ ਕੋਟਿ ਮਾਗਹਿ ਸਤਸੰਗੁ ॥
ਪਾਰਬ੍ਰਹਮ ਤਿਨ ਲਾਗਾ ਰੰਗੁ ॥
ਜਿਨ ਕਉ ਹੋਏ ਆਪਿ ਸੁਪ੍ਰਸੰਨ ॥
ਨਾਨਕ ਤੇ ਜਨ ਸਦਾ ਧਨਿ ਧੰਨਿ ॥੬॥
ਕਈ ਕੋਟਿ ਖਾਣੀ ਅਰੁ ਖੰਡ ॥
ਕਈ ਕੋਟਿ ਅਕਾਸ ਬ੍ਰਹਮੰਡ ॥
ਕਈ ਕੋਟਿ ਹੋਏ ਅਵਤਾਰ ॥
ਕਈ ਜੁਗਤਿ ਕੀਨੋ ਬਿਸਥਾਰ ॥
ਕਈ ਬਾਰ ਪਸਰਿਓ ਪਾਸਾਰ ॥
ਸਦਾ ਸਦਾ ਇਕੁ ਏਕੰਕਾਰ ॥
ਕਈ ਕੋਟਿ ਕੀਨੇ ਬਹੁ ਭਾਤਿ ॥
ਪ੍ਰਭ ਤੇ ਹੋਏ ਪ੍ਰਭ ਮਾਹਿ ਸਮਾਤਿ ॥
ਤਾ ਕਾ ਅੰਤੁ ਨ ਜਾਨੈ ਕੋਇ ॥
ਆਪੇ ਆਪਿ ਨਾਨਕ ਪ੍ਰਭੁ ਸੋਇ ॥੭॥
ਕਈ ਕੋਟਿ ਪਾਰਬ੍ਰਹਮ ਕੇ ਦਾਸ ॥
ਤਿਨ ਹੋਵਤ ਆਤਮ ਪਰਗਾਸ ॥
ਕਈ ਕੋਟਿ ਤਤ ਕੇ ਬੇਤੇ ॥
ਸਦਾ ਨਿਹਾਰਹਿ ਏਕੋ ਨੇਤ੍ਰੇ ॥
ਕਈ ਕੋਟਿ ਨਾਮ ਰਸੁ ਪੀਵਹਿ ॥
ਅਮਰ ਭਏ ਸਦ ਸਦ ਹੀ ਜੀਵਹਿ ॥
ਕਈ ਕੋਟਿ ਨਾਮ ਗੁਨ ਗਾਵਹਿ ॥
ਆਤਮ ਰਸਿ ਸੁਖਿ ਸਹਜਿ ਸਮਾਵਹਿ ॥
ਅਪੁਨੇ ਜਨ ਕਉ ਸਾਸਿ ਸਾਸਿ ਸਮਾਰੇ ॥
ਨਾਨਕ ਓਇ ਪਰਮੇਸੁਰ ਕੇ ਪਿਆਰੇ ॥੮॥੧੦॥
ਸਲੋਕੁ ॥
ਕਰਣ ਕਾਰਣ ਪ੍ਰਭੁ ਏਕੁ ਹੈ ਦੂਸਰ ਨਾਹੀ ਕੋਇ ॥
ਨਾਨਕ ਤਿਸੁ ਬਲਿਹਾਰਣੈ ਜਲਿ ਥਲਿ ਮਹੀਅਲਿ ਸੋਇ ॥੧॥`,
        transliteration: `salok |
ausatat kareh anek jan ant na paaraavaar |
naanak rachanaa prabh rachee bahu bidh anik prakaar |1|
asattapadee |
kee kott hoe poojaaree |
kee kott aachaar biauhaaree |
kee kott bhe teerath vaasee |
kee kott ban bhrameh udaasee |
kee kott bed ke srote |
kee kott tapeesur hote |
kee kott aatam dhiaan dhaareh |
kee kott kab kaab beechaareh |
kee kott navatan naam dhiaaveh |
naanak karate kaa ant na paaveh |1|
kee kott bhe abhimaanee |
kee kott andh agiaanee |
kee kott kirapan katthor |
kee kott abhig aatam nikor |
kee kott par darab kau hireh |
kee kott par dookhanaa kareh |
kee kott maaeaa sram maeh |
kee kott parades bhramaeh |
jit jit laavahu tith tit laganaa |
naanak karate kee jaanai karataa rachanaa |2|
kee kott sidh jatee jogee |
kee kott raaje ras bhogee |
kee kott pankhee sarap upaae |
kee kott paathar birakh nipajaae |
kee kott pavan paanee baisantar |
kee kott des bhoo manddal |
kee kott saseear soor nakhayatr |
kee kott dev daanav indr sir chhatr |
sagal samagree apanai soot dhaarai |
naanak jis jis bhaavai tis tis nisataarai |3|
kee kott raajas taamas saatak |
kee kott bed puraan simrit ar saasat |
kee kott kee ratan samud |
kee kott naanaa prakaar jant |
kee kott kee chir jeeve |
kee kott giree mer suvaran theeve |
kee kott jakhay kinar pisaach |
kee kott bhoot pret sookar mrigaach |
sabh te nerai sabhahoo te door |
naanak aap alipat rahiaa bharapoor |4|
kee kott paataal ke vaasee |
kee kott narak surag nivaasee |
kee kott janameh jeeveh mareh |
kee kott bahu jonee fireh |
kee kott baitthat hee khaeh |
kee kott ghaaleh thak paeh |
kee kott kee dhanavant |
kee kott maaeaa meh chint |
jeh jeh bhaanaa teh teh raakhe |
naanak sabh kichh prabh kai haathe |5|
kee kott bhe bairaagee |
raam naam sang tin liv laagee |
kee kott prabh kau khojante |
aatam meh paarabraham lahante |
kee kott darasan prabh piaas |
tin kau milio prabh abinaas |
kee kott maageh satasang |
paarabraham tin laagaa rang |
jin kau hoe aap suprasan |
naanak te jan sadaa dhan dhan |6|
kee kott khaanee ar khandd |
kee kott akaas brahamandd |
kee kott hoe avataar |
kee jugat keeno bisathaar |
kee baar pasario paasaar |
sadaa sadaa ik ekankaar |
kee kott keene bahu bhaat |
prabh te hoe prabh maeh samaat |
taa kaa ant na jaanai koe |
aape aap naanak prabh soe |7|
kee kott paarabraham ke daas |
tin hovat aatam paragaas |
kee kott tat ke bete |
sadaa nihaareh eko netre |
kee kott naam ras peeveh |
amar bhe sad sad hee jeeveh |
kee kott naam gun gaaveh |
aatam ras sukh sehaj samaaveh |
apune jan kau saas saas samaare |
naanak oe paramesur ke piaare |8|10|
salok |
karan kaaran prabh ek hai doosar naahee koe |
naanak tis balihaaranai jal thal maheeal soe |1|`,
        meaning: `Salok: Many people praise the Lord. He has no end or limitation. O Nanak, God created the creation, with its many ways and various species. ||1|| Ashtapadee: Many millions are His devotees. Many millions perform religious rituals and worldly duties. Many millions become dwellers at sacred shrines of pilgrimage. Many millions wander as renunciates in the wilderness. Many millions listen to the Vedas. Many millions become austere penitents. Many millions enshrine meditation within their souls. Many millions of poets contemplate Him through poetry. Many millions meditate on His eternally new Naam. O Nanak, none can find the limits of the Creator. ||1|| Many millions become self-centered. Many millions are blinded by ignorance. Many millions are stone-hearted misers. Many millions are heartless, with dry, withered souls. Many millions steal the wealth of others. Many millions slander others. Many millions struggle in Maya. Many millions wander in foreign lands. Whatever God attaches them to - with that they are engaged. O Nanak, the Creator alone knows the workings of His creation. ||2|| Many millions are Siddhas, celibates and Yogis. Many millions are kings, enjoying worldly pleasures. Many millions of birds and snakes have been created. Many millions of stones and trees have been produced. Many millions are the winds, waters and fires. Many millions are the countries and realms of the world. Many millions are the moons, suns and stars. Many millions are the demi-gods, demons and Indras, under their regal canopies. He has strung the entire creation upon His thread. O Nanak, He emancipates those with whom He is pleased. ||3|| Many millions abide in heated activity, slothful darkness and peaceful light. Many millions are the Vedas, Puraanas, Simritees and Shaastras. Many millions are the pearls of the oceans. Many millions are the beings of so many descriptions. Many millions are made long-lived. Many millions of hills and mountains have been made of gold. Many millions are the Yakhshas - the servants of the god of wealth, the Kinnars - the gods of celestial music, and the evil spirits of the Pisaach. Many millions are the evil nature-spirits, ghosts, pigs and tigers. He is near to all, and yet far from all; O Nanak, He Himself remains distinct, while yet pervading all. ||4|| Many millions inhabit the nether regions. Many millions dwell in heaven and hell. Many millions are born, live and die. Many millions are reincarnated, over and over again. Many millions eat while sitting at ease. Many millions are exhausted by their labors. Many millions are created wealthy. Many millions are anxiously involved in Maya. Wherever He wills, there He keeps us. O Nanak, everything is in the Hands of God. ||5|| Many millions become Bairaagees, who renounce the world. They have attached themselves to the Lord's Name. Many millions are searching for God. Within their souls, they find the Supreme Lord God. Many millions thirst for the Blessing of God's Darshan. They meet with God, the Eternal. Many millions pray for the Society of the Saints. They are imbued with the Love of the Supreme Lord God. Those with whom He Himself is pleased, O Nanak, are blessed, forever blessed. ||6|| Many millions are the fields of creation and the galaxies. Many millions are the etheric skies and the solar systems. Many millions are the divine incarnations. In so many ways, He has unfolded Himself. So many times, He has expanded His expansion. Forever and ever, He is the One, the One Universal Creator. Many millions are created in various forms. From God they emanate, and into God they merge once again. His limits are not known to anyone. Of Himself, and by Himself, O Nanak, God exists. ||7|| Many millions are the servants of the Supreme Lord God. Their souls are enlightened. Many millions know the essence of reality. Their eyes gaze forever on the One alone. Many millions drink in the essence of the Naam. They become immortal; they live forever and ever. Many millions sing the Glorious Praises of the Naam. They are absorbed in intuitive peace and pleasure. He remembers His servants with each and every breath. O Nanak, they are the beloveds of the Transcendent Lord God. ||8||10|| Salok: God alone is the Doer of deeds - there is no other at all. O Nanak, I am a sacrifice to the One, who pervades the waters, the lands, the sky and all space. ||1||`,
        meaning_pa: `ਅਨੇਕਾਂ ਬੰਦੇ ਪ੍ਰਭੂ ਦੇ ਗੁਣਾਂ ਦਾ ਜ਼ਿਕਰ ਕਰਦੇ ਹਨ, ਪਰ ਉਹਨਾਂ ਗੁਣਾਂ ਦਾ ਹੱਦ-ਬੰਨਾ ਨਹੀਂ ਲੱਭਦਾ। ਹੇ ਨਾਨਕ! (ਇਹੀ ਸਾਰੀ) ਸ੍ਰਿਸ਼ਟੀ (ਉਸ) ਪ੍ਰਭੂ ਨੇ ਕਈ ਕਿਸਮਾਂ ਦੀ ਕਈ ਤਰੀਕਿਆਂ ਨਾਲ ਬਣਾਈ ਹੈ ॥੧॥ (ਪ੍ਰਭੂ ਦੀ ਇਸ ਰਚੀ ਹੋਈ ਦੁਨੀਆ ਵਿਚ) ਕਈ ਕਰੋੜਾਂ ਪ੍ਰਾਣੀ ਪੁਜਾਰੀ ਹਨ, ਅਤੇ ਕਈ ਕਰੋੜਾਂ ਧਾਰਮਿਕ ਰੀਤਾਂ ਰਸਮਾਂ ਕਰਨ ਵਾਲੇ ਹਨ; ਕਈ ਕਰੋੜਾਂ (ਬੰਦੇ) ਤੀਰਥਾਂ ਦੇ ਵਸਨੀਕ ਹਨ, ਅਤੇ ਕਈ ਕਰੋੜਾਂ (ਜਗਤ ਵਲੋਂ) ਉਪਰਾਮ ਹੋ ਕੇ ਜੰਗਲਾਂ ਵਿਚ ਫਿਰਦੇ ਹਨ; ਕਈ ਕਰੋੜਾਂ ਜੀਵ ਵੇਦਾਂ ਦੇ ਸੁਣਨ ਵਾਲੇ ਹਨ, ਅਤੇ ਕਈ ਕਰੋੜਾਂ ਵੱਡੇ ਵੱਡੇ ਤਪੀਏ ਬਣੇ ਹੋਏ ਹਨ; ਕਈ ਕਰੋੜਾਂ (ਮਨੁੱਖ) ਆਪਣੇ ਅੰਦਰ ਸੁਰਤ ਜੋੜ ਰਹੇ ਹਨ, ਅਤੇ ਕਈ ਕਰੋੜਾਂ (ਮਨੁੱਖ) ਕਵੀਆਂ ਦੀਆਂ ਰਚੀਆਂ ਕਵਿਤਾ ਵਿਚਾਰਦੇ ਹਨ; ਕਈ ਕਰੋੜਾਂ ਬੰਦੇ (ਪ੍ਰਭੂ ਦਾ) ਨਿੱਤ ਨਵਾਂ ਨਾਮ ਸਿਮਰਦੇ ਹਨ, (ਪਰ) ਹੇ ਨਾਨਕ! ਉਸ ਕਰਤਾਰ ਦਾ ਕੋਈ ਭੀ ਅੰਤ ਨਹੀਂ ਪਾ ਸਕਦੇ ॥੧॥ (ਇਸ ਜਗਤ-ਰਚਨਾ ਵਿਚ) ਕਰੋੜਾਂ ਅਹੰਕਾਰੀ ਜੀਵ ਹਨ, ਅਤੇ ਕਰੋੜਾਂ ਹੀ ਬੰਦੇ ਪੁੱਜ ਕੇ ਜਾਹਿਲ ਹਨ; ਕਰੋੜਾਂ (ਮਨੁੱਖ) ਸ਼ੂਮ ਤੇ ਪੱਥਰ-ਦਿਲ ਹਨ, ਅਤੇ ਕਈ ਕਰੋੜ ਅੰਦਰੋਂ ਮਹਾ ਕੋਰੇ ਹਨ ਜੋ (ਕਿਸੇ ਦਾ ਦੁੱਖ ਤੱਕ ਕੇ ਭੀ ਕਦੇ) ਪਸੀਜਦੇ ਨਹੀਂ; ਕਰੋੜਾਂ ਬੰਦੇ ਦੂਜਿਆਂ ਦਾ ਧਨ ਚੁਰਾਉਂਦੇ ਹਨ, ਅਤੇ ਕਰੋੜਾਂ ਹੀ ਦੂਜਿਆਂ ਦੀ ਨਿੰਦਿਆ ਕਰਦੇ ਹਨ; ਕਰੋੜਾਂ (ਮਨੁੱਖ) ਧਨ ਪਦਾਰਥ ਦੀ (ਖ਼ਾਤਰ) ਮੇਹਨਤ ਵਿਚ ਜੁੱਟੇ ਹੋਏ ਹਨ, ਅਤੇ ਕਈ ਕਰੋੜ ਦੂਜੇ ਦੇਸ਼ਾਂ ਵਿਚ ਭਟਕ ਰਹੇ ਹਨ; (ਹੇ ਪ੍ਰਭੂ!) ਜਿਸ ਜਿਸ ਆਹਰੇ ਤੂੰ ਲਾਉਂਦਾ ਹੈਂ ਉਸ ਉਸ ਆਹਰ ਵਿਚ ਜੀਵ ਲੱਗੇ ਹੋਏ ਹਨ। ਹੇ ਨਾਨਕ! ਕਰਤਾਰ ਦੀ ਰਚਨਾ (ਦਾ ਭੇਤ) ਕਰਤਾਰ ਹੀ ਜਾਣਦਾ ਹੈ ॥੨॥ (ਇਸ ਸ੍ਰਿਸ਼ਟਿ-ਰਚਨਾ ਵਿਚ) ਕਰੋੜਾਂ ਪੁੱਗੇ ਹੋਏ, ਤੇ ਕਾਮ ਨੂੰ ਵੱਸ ਵਿਚ ਰੱਖਣ ਵਾਲੇ ਜੋਗੀ ਹਨ, ਅਤੇ ਕਰੋੜਾਂ ਹੀ ਮੌਜਾਂ ਮਾਣਨ ਵਾਲੇ ਰਾਜੇ ਹਨ; ਕਰੋੜਾਂ ਪੰਛੀ ਤੇ ਸੱਪ (ਪ੍ਰਭੂ ਨੇ) ਪੈਦਾ ਕੀਤੇ ਹਨ, ਅਤੇ ਕਰੋੜਾਂ ਹੀ ਪੱਥਰ ਤੇ ਰੁੱਖ ਉਗਾਏ ਹਨ; ਕਰੋੜਾਂ ਹਵਾ ਪਾਣੀ ਤੇ ਅੱਗਾਂ ਹਨ, ਕਰੋੜਾਂ ਦੇਸ ਤੇ ਧਰਤੀਆਂ ਦੇ ਚੱਕ੍ਰ ਹਨ; ਕਈ ਕਰੋੜਾਂ ਚੰਦ੍ਰਮਾਂ, ਸੂਰਜ ਤੇ ਤਾਰੇ ਹਨ, ਕਰੋੜਾਂ ਦੇਵਤੇ ਤੇ ਇੰਦ੍ਰ ਹਨ ਜਿਨ੍ਹਾਂ ਦੇ ਸਿਰ ਉਤੇ ਛਤ੍ਰ ਹਨ; (ਇਹਨਾਂ) ਸਾਰੇ (ਜੀਅ ਜੰਤਾਂ ਤੇ) ਪਦਾਰਥਾਂ ਨੂੰ (ਪ੍ਰਭੂ ਨੇ) ਆਪਣੇ (ਹੁਕਮ ਦੇ) ਧਾਗੇ ਵਿਚ ਪਰੋਇਆ ਹੋਇਆ ਹੈ। ਹੇ ਨਾਨਕ! ਜੋ ਜੋ ਉਸ ਨੂੰ ਭਾਉਂਦਾ ਹੈ, ਉਸ ਉਸ ਨੂੰ (ਪ੍ਰਭੂ) ਤਾਰ ਲੈਂਦਾ ਹੈ ॥੩॥ ਕਰੋੜਾਂ ਜੀਵ (ਮਾਇਆ ਦੇ ਤਿੰਨ ਗੁਣਾਂ) ਰਜੋ, ਤਮੋ ਤੇ ਸਤੋ ਵਿਚ ਹਨ, ਕਰੋੜਾਂ (ਬੰਦੇ) ਵੇਦ ਪੁਰਾਨ ਸਿਮ੍ਰਿਤੀਆਂ ਤੇ ਸ਼ਾਸਤ੍ਰਾਂ (ਦੇ ਪੜ੍ਹਨ ਵਾਲੇ) ਹਨ; ਸਮੁੰਦਰ ਵਿਚ ਕਰੋੜਾਂ ਰਤਨ ਪੈਦਾ ਕਰ ਦਿੱਤੇ ਹਨ, ਅਤੇ ਕਈ ਕਿਸਮਾਂ ਦੇ ਜੀਅ ਜੰਤ ਬਣਾ ਦਿੱਤੇ ਹਨ; ਕਰੋੜਾਂ ਜੀਵ ਲੰਮੀਆਂ ਉਮਰਾਂ ਵਾਲੇ ਪੈਦਾ ਕੀਤੇ ਹਨ, ਕਰੋੜਾਂ ਹੀ ਸੋਨੇ ਦੇ ਸੁਮੇਰ ਪਰਬਤ ਬਣ ਗਏ ਹਨ; ਕਰੋੜਾਂ ਹੀ ਜੱਖ ਕਿੰਨਰ ਤੇ ਪਿਸ਼ਾਚ ਹਨ, ਅਤੇ ਕਰੋੜਾਂ ਹੀ ਭੂਤ ਪ੍ਰੇਤ ਸੂਰ ਤੇ ਸ਼ੇਰ ਹਨ; (ਪ੍ਰਭੂ) ਇਹਨਾਂ ਸਭਨਾਂ ਦੇ ਨੇੜੇ ਭੀ ਹੈ ਤੇ ਦੂਰ ਭੀ। ਹੇ ਨਾਨਕ! ਪ੍ਰਭੂ ਸਭ ਥਾਈਂ ਵਿਆਪਕ ਭੀ ਹੈ ਤੇ ਹੈ ਭੀ ਨਿਰਲੇਪ ॥੪॥ ਕਰੋੜਾਂ ਜੀਵ ਪਾਤਾਲ ਵਿਚ ਵੱਸਣ ਵਾਲੇ ਹਨ, ਅਤੇ ਕਰੋੜਾਂ ਹੀ ਨਰਕਾਂ ਤੇ ਸੁਰਗਾਂ ਵਿਚ ਵੱਸਦੇ ਹਨ (ਭਾਵ, ਦੁਖੀ ਤੇ ਸੁਖੀ ਹਨ); ਕਰੋੜਾਂ ਜੀਵ ਜੰਮਦੇ ਹਨ, ਜਿਉਂਦੇ ਹਨ ਅਤੇ ਮਰਦੇ ਹਨ, ਅਤੇ ਕਰੋੜਾਂ ਜੀਵ ਕਈ ਜੂਨਾਂ ਵਿਚ ਭਟਕ ਰਹੇ ਹਨ; ਕਰੋੜਾਂ ਜੀਵ ਬੈਠੇ ਹੀ ਖਾਂਦੇ ਹਨ, ਅਤੇ ਕਰੋੜਾਂ (ਐਸੇ ਹਨ ਜੋ ਰੋਟੀ ਦੀ ਖ਼ਾਤਰ) ਮੇਹਨਤ ਕਰਦੇ ਹਨ ਤੇ ਥੱਕ ਟੁੱਟ ਜਾਂਦੇ ਹਨ; ਕਰੋੜਾਂ ਜੀਵ (ਪ੍ਰਭੂ ਨੇ) ਧਨ ਵਾਲੇ ਬਣਾਏ ਹਨ, ਅਤੇ ਕਰੋੜਾਂ (ਐਸੇ ਹਨ ਜਿਨ੍ਹਾਂ ਨੂੰ) ਮਾਇਆ ਦਾ ਫ਼ਿਕਰ ਲੱਗਾ ਹੋਇਆ ਹੈ। ਜਿਥੇ ਜਿਥੇ ਚਾਹੁੰਦਾ ਹੈ, ਜੀਵਾਂ ਨੂੰ ਓਥੇ ਓਥੇ ਹੀ ਰੱਖਦਾ ਹੈ। ਹੇ ਨਾਨਕ! ਹਰੇਕ ਗੱਲ ਪ੍ਰਭੂ ਦੇ ਆਪਣੇ ਹੱਥ ਵਿਚ ਹੈ ॥੫॥ (ਇਸ ਰਚਨਾ ਵਿਚ) ਕਰੋੜਾਂ ਜੀਵ ਵੈਰਾਗ ਵਾਲੇ ਹੋਏ ਹਨ, ਜਿਨ੍ਹਾਂ ਦੀ ਸੁਰਤ ਅਕਾਲ ਪੁਰਖ ਦੇ ਨਾਮ ਨਾਲ ਲੱਗੀ ਰਹਿੰਦੀ ਹੈ; ਕਰੋੜਾਂ ਬੰਦੇ ਪ੍ਰਭੂ ਨੂੰ ਖੋਜਦੇ ਹਨ, ਤੇ ਆਪਣੇ ਅੰਦਰ ਅਕਾਲ ਪੁਰਖ ਨੂੰ ਭਾਲਦੇ ਹਨ; ਕਰੋੜਾਂ ਜੀਵਾਂ ਨੂੰ ਪ੍ਰਭੂ ਦੇ ਦੀਦਾਰ ਦੀ ਤਾਂਘ ਲੱਗੀ ਰਹਿੰਦੀ ਹੈ, ਉਹਨਾਂ ਨੂੰ ਅਬਿਨਾਸੀ ਪ੍ਰਭੂ ਮਿਲ ਪੈਂਦਾ ਹੈ। ਕਰੋੜਾਂ ਮਨੁੱਖ ਸਤ-ਸੰਗ ਮੰਗਦੇ ਹਨ, ਉਹਨਾਂ ਨੂੰ ਅਕਾਲ ਪੁਰਖ ਦਾ ਇਸ਼ਕ ਰਹਿੰਦਾ ਹੈ। ਜਿਨ੍ਹਾਂ ਉਤੇ ਪ੍ਰਭੂ ਆਪ ਤ੍ਰੁੱਠਦਾ ਹੈ, ਹੇ ਨਾਨਕ! ਉਹ ਮਨੁੱਖ ਸਦਾ ਭਾਗਾਂ ਵਾਲੇ ਹਨ ॥੬॥ (ਧਰਤੀ ਦੇ ਨੌ) ਖੰਡਾਂ (ਚਹੁੰਆਂ) ਖਾਣੀਆਂ ਦੀ ਰਾਹੀਂ ਕਰੋੜਾਂ ਹੀ ਜੀਵ ਉਤਪੰਨ ਹੋਏ ਹਨ, ਸਾਰੇ ਆਕਾਸ਼ਾਂ ਬ੍ਰਹਮੰਡਾਂ ਵਿਚ ਕਰੋੜਾਂ ਹੀ ਜੀਵ ਹਨ; ਕਰੋੜਾਂ ਹੀ ਪ੍ਰਾਣੀ ਪੈਦਾ ਹੋ ਰਹੇ ਹਨ; ਕਈ ਤਰੀਕਿਆਂ ਨਾਲ ਪ੍ਰਭੂ ਨੇ ਜਗਤ ਦੀ ਰਚਨਾ ਕੀਤੀ ਹੈ; (ਪ੍ਰਭੂ ਨੇ) ਕਈ ਵਾਰੀ ਜਗਤ-ਰਚਨਾ ਕੀਤੀ ਹੈ, (ਮੁੜ ਇਸ ਨੂੰ ਸਮੇਟ ਕੇ) ਸਦਾ-ਇਕ ਆਪ ਹੀ ਹੋ ਜਾਂਦਾ ਹੈ; ਪ੍ਰਭੂ ਨੇ ਕਈ ਕਿਸਮਾਂ ਦੇ ਕਰੋੜਾਂ ਹੀ ਜੀਵ ਪੈਦਾ ਕੀਤੇ ਹੋਏ ਹਨ, ਜੋ ਪ੍ਰਭੂ ਤੋਂ ਪੈਦਾ ਹੋ ਕੇ ਫਿਰ ਪ੍ਰਭੂ ਵਿਚ ਲੀਨ ਹੋ ਜਾਂਦੇ ਹਨ। ਉਸ ਪ੍ਰਭੂ ਦਾ ਅੰਤ ਕੋਈ ਬੰਦਾ ਨਹੀਂ ਜਾਣਦਾ; (ਕਿਉਂਕਿ) ਹੇ ਨਾਨਕ! ਉਹ ਪ੍ਰਭੂ (ਆਪਣੇ ਵਰਗਾ) ਆਪ ਹੀ ਆਪ ਹੈ ॥੭॥ (ਇਸ ਜਗਤ-ਰਚਨਾ ਵਿਚ) ਕਰੋੜਾਂ ਜੀਵ ਪ੍ਰਭੂ ਦੇ ਸੇਵਕ (ਭਗਤ) ਹਨ, ਉਹਨਾਂ ਦੇ ਆਤਮ ਵਿਚ (ਪ੍ਰਭੂ ਦਾ) ਪਰਕਾਸ਼ ਹੋ ਜਾਂਦਾ ਹੈ; ਕਰੋੜਾਂ ਜੀਵ (ਜਗਤ ਦੇ) ਅਸਲੇ (ਅਕਾਲ ਪੁਰਖ) ਦੇ ਮਹਰਮ ਹਨ, ਜੋ ਸਦਾ ਇੱਕ ਪ੍ਰਭੂ ਨੂੰ ਅੱਖਾਂ ਨਾਲ (ਹਰ ਥਾਂ) ਵੇਖਦੇ ਹਨ; ਕਰੋੜਾਂ ਬੰਦੇ ਪ੍ਰਭੂ-ਨਾਮ ਦਾ ਆਨੰਦ ਮਾਣਦੇ ਹਨ, ਉਹ ਜਨਮ ਮਰਨ ਤੋਂ ਰਹਿਤ ਹੋ ਕੇ ਸਦਾ ਹੀ ਜੀਊਂਦੇ ਰਹਿੰਦੇ ਹਨ। ਕ੍ਰੋੜਾਂ ਮਨੁੱਖ ਪ੍ਰਭੂ-ਨਾਮ ਦੇ ਗੁਣ ਗਾਂਦੇ ਹਨ, ਉਹ ਆਤਮਕ ਆਨੰਦ ਵਿਚ ਸੁਖ ਵਿਚ ਤੇ ਅਡੋਲ ਅਵਸਥਾ ਵਿਚ ਟਿਕੇ ਰਹਿੰਦੇ ਹਨ। ਪ੍ਰਭੂ ਆਪਣੇ ਭਗਤਾਂ ਨੂੰ ਦਮ-ਬ-ਦਮ ਚੇਤੇ ਰੱਖਦਾ ਹੈ, (ਕਿਉਂਕਿ) ਹੇ ਨਾਨਕ! ਉਹ ਭਗਤ ਪ੍ਰਭੂ ਦੇ ਪਿਆਰੇ ਹੁੰਦੇ ਹਨ ॥੮॥੧੦॥ (ਇਸ ਸਾਰੇ) ਜਗਤ ਦਾ (ਮੂਲ-) ਕਾਰਣ (ਭਾਵ, ਬਣਾਉਣ ਵਾਲਾ) ਇਕ ਅਕਾਲ ਪੁਰਖ ਹੀ ਹੈ, ਕੋਈ ਦੂਜਾ ਨਹੀਂ ਹੈ। ਹੇ ਨਾਨਕ! (ਮੈਂ) ਉਸ ਪ੍ਰਭੂ ਤੋਂ ਸਦਕੇ (ਹਾਂ), ਜੋ ਜਲ ਵਿਚ ਥਲ ਵਿਚ ਤੇ ਧਰਤੀ ਦੇ ਤਲ ਉਤੇ (ਭਾਵ, ਆਕਾਸ਼ ਵਿਚ ਮੌਜੂਦ ਹੈ) ॥੧॥`
      },
      {
        number: 11,
        sanskrit: `ਸਲੋਕੁ ॥
ਕਰਣ ਕਾਰਣ ਪ੍ਰਭੁ ਏਕੁ ਹੈ ਦੂਸਰ ਨਾਹੀ ਕੋਇ ॥
ਨਾਨਕ ਤਿਸੁ ਬਲਿਹਾਰਣੈ ਜਲਿ ਥਲਿ ਮਹੀਅਲਿ ਸੋਇ ॥੧॥
ਅਸਟਪਦੀ ॥
ਕਰਨ ਕਰਾਵਨ ਕਰਨੈ ਜੋਗੁ ॥
ਜੋ ਤਿਸੁ ਭਾਵੈ ਸੋਈ ਹੋਗੁ ॥
ਖਿਨ ਮਹਿ ਥਾਪਿ ਉਥਾਪਨਹਾਰਾ ॥
ਅੰਤੁ ਨਹੀ ਕਿਛੁ ਪਾਰਾਵਾਰਾ ॥
ਹੁਕਮੇ ਧਾਰਿ ਅਧਰ ਰਹਾਵੈ ॥
ਹੁਕਮੇ ਉਪਜੈ ਹੁਕਮਿ ਸਮਾਵੈ ॥
ਹੁਕਮੇ ਊਚ ਨੀਚ ਬਿਉਹਾਰ ॥
ਹੁਕਮੇ ਅਨਿਕ ਰੰਗ ਪਰਕਾਰ ॥
ਕਰਿ ਕਰਿ ਦੇਖੈ ਅਪਨੀ ਵਡਿਆਈ ॥
ਨਾਨਕ ਸਭ ਮਹਿ ਰਹਿਆ ਸਮਾਈ ॥੧॥
ਪ੍ਰਭ ਭਾਵੈ ਮਾਨੁਖ ਗਤਿ ਪਾਵੈ ॥
ਪ੍ਰਭ ਭਾਵੈ ਤਾ ਪਾਥਰ ਤਰਾਵੈ ॥
ਪ੍ਰਭ ਭਾਵੈ ਬਿਨੁ ਸਾਸ ਤੇ ਰਾਖੈ ॥
ਪ੍ਰਭ ਭਾਵੈ ਤਾ ਹਰਿ ਗੁਣ ਭਾਖੈ ॥
ਪ੍ਰਭ ਭਾਵੈ ਤਾ ਪਤਿਤ ਉਧਾਰੈ ॥
ਆਪਿ ਕਰੈ ਆਪਨ ਬੀਚਾਰੈ ॥
ਦੁਹਾ ਸਿਰਿਆ ਕਾ ਆਪਿ ਸੁਆਮੀ ॥
ਖੇਲੈ ਬਿਗਸੈ ਅੰਤਰਜਾਮੀ ॥
ਜੋ ਭਾਵੈ ਸੋ ਕਾਰ ਕਰਾਵੈ ॥
ਨਾਨਕ ਦ੍ਰਿਸਟੀ ਅਵਰੁ ਨ ਆਵੈ ॥੨॥
ਕਹੁ ਮਾਨੁਖ ਤੇ ਕਿਆ ਹੋਇ ਆਵੈ ॥
ਜੋ ਤਿਸੁ ਭਾਵੈ ਸੋਈ ਕਰਾਵੈ ॥
ਇਸ ਕੈ ਹਾਥਿ ਹੋਇ ਤਾ ਸਭੁ ਕਿਛੁ ਲੇਇ ॥
ਜੋ ਤਿਸੁ ਭਾਵੈ ਸੋਈ ਕਰੇਇ ॥
ਅਨਜਾਨਤ ਬਿਖਿਆ ਮਹਿ ਰਚੈ ॥
ਜੇ ਜਾਨਤ ਆਪਨ ਆਪ ਬਚੈ ॥
ਭਰਮੇ ਭੂਲਾ ਦਹ ਦਿਸਿ ਧਾਵੈ ॥
ਨਿਮਖ ਮਾਹਿ ਚਾਰਿ ਕੁੰਟ ਫਿਰਿ ਆਵੈ ॥
ਕਰਿ ਕਿਰਪਾ ਜਿਸੁ ਅਪਨੀ ਭਗਤਿ ਦੇਇ ॥
ਨਾਨਕ ਤੇ ਜਨ ਨਾਮਿ ਮਿਲੇਇ ॥੩॥
ਖਿਨ ਮਹਿ ਨੀਚ ਕੀਟ ਕਉ ਰਾਜ ॥
ਪਾਰਬ੍ਰਹਮ ਗਰੀਬ ਨਿਵਾਜ ॥
ਜਾ ਕਾ ਦ੍ਰਿਸਟਿ ਕਛੂ ਨ ਆਵੈ ॥
ਤਿਸੁ ਤਤਕਾਲ ਦਹ ਦਿਸ ਪ੍ਰਗਟਾਵੈ ॥
ਜਾ ਕਉ ਅਪੁਨੀ ਕਰੈ ਬਖਸੀਸ ॥
ਤਾ ਕਾ ਲੇਖਾ ਨ ਗਨੈ ਜਗਦੀਸ ॥
ਜੀਉ ਪਿੰਡੁ ਸਭ ਤਿਸ ਕੀ ਰਾਸਿ ॥
ਘਟਿ ਘਟਿ ਪੂਰਨ ਬ੍ਰਹਮ ਪ੍ਰਗਾਸ ॥
ਅਪਨੀ ਬਣਤ ਆਪਿ ਬਨਾਈ ॥
ਨਾਨਕ ਜੀਵੈ ਦੇਖਿ ਬਡਾਈ ॥੪॥
ਇਸ ਕਾ ਬਲੁ ਨਾਹੀ ਇਸੁ ਹਾਥ ॥
ਕਰਨ ਕਰਾਵਨ ਸਰਬ ਕੋ ਨਾਥ ॥
ਆਗਿਆਕਾਰੀ ਬਪੁਰਾ ਜੀਉ ॥
ਜੋ ਤਿਸੁ ਭਾਵੈ ਸੋਈ ਫੁਨਿ ਥੀਉ ॥
ਕਬਹੂ ਊਚ ਨੀਚ ਮਹਿ ਬਸੈ ॥
ਕਬਹੂ ਸੋਗ ਹਰਖ ਰੰਗਿ ਹਸੈ ॥
ਕਬਹੂ ਨਿੰਦ ਚਿੰਦ ਬਿਉਹਾਰ ॥
ਕਬਹੂ ਊਭ ਅਕਾਸ ਪਇਆਲ ॥
ਕਬਹੂ ਬੇਤਾ ਬ੍ਰਹਮ ਬੀਚਾਰ ॥
ਨਾਨਕ ਆਪਿ ਮਿਲਾਵਣਹਾਰ ॥੫॥
ਕਬਹੂ ਨਿਰਤਿ ਕਰੈ ਬਹੁ ਭਾਤਿ ॥
ਕਬਹੂ ਸੋਇ ਰਹੈ ਦਿਨੁ ਰਾਤਿ ॥
ਕਬਹੂ ਮਹਾ ਕ੍ਰੋਧ ਬਿਕਰਾਲ ॥
ਕਬਹੂੰ ਸਰਬ ਕੀ ਹੋਤ ਰਵਾਲ ॥
ਕਬਹੂ ਹੋਇ ਬਹੈ ਬਡ ਰਾਜਾ ॥
ਕਬਹੁ ਭੇਖਾਰੀ ਨੀਚ ਕਾ ਸਾਜਾ ॥
ਕਬਹੂ ਅਪਕੀਰਤਿ ਮਹਿ ਆਵੈ ॥
ਕਬਹੂ ਭਲਾ ਭਲਾ ਕਹਾਵੈ ॥
ਜਿਉ ਪ੍ਰਭੁ ਰਾਖੈ ਤਿਵ ਹੀ ਰਹੈ ॥
ਗੁਰ ਪ੍ਰਸਾਦਿ ਨਾਨਕ ਸਚੁ ਕਹੈ ॥੬॥
ਕਬਹੂ ਹੋਇ ਪੰਡਿਤੁ ਕਰੇ ਬਖੵਾਨੁ ॥
ਕਬਹੂ ਮੋਨਿਧਾਰੀ ਲਾਵੈ ਧਿਆਨੁ ॥
ਕਬਹੂ ਤਟ ਤੀਰਥ ਇਸਨਾਨ ॥
ਕਬਹੂ ਸਿਧ ਸਾਧਿਕ ਮੁਖਿ ਗਿਆਨ ॥
ਕਬਹੂ ਕੀਟ ਹਸਤਿ ਪਤੰਗ ਹੋਇ ਜੀਆ ॥
ਅਨਿਕ ਜੋਨਿ ਭਰਮੈ ਭਰਮੀਆ ॥
ਨਾਨਾ ਰੂਪ ਜਿਉ ਸ੍ਵਾਗੀ ਦਿਖਾਵੈ ॥
ਜਿਉ ਪ੍ਰਭ ਭਾਵੈ ਤਿਵੈ ਨਚਾਵੈ ॥
ਜੋ ਤਿਸੁ ਭਾਵੈ ਸੋਈ ਹੋਇ ॥
ਨਾਨਕ ਦੂਜਾ ਅਵਰੁ ਨ ਕੋਇ ॥੭॥
ਕਬਹੂ ਸਾਧਸੰਗਤਿ ਇਹੁ ਪਾਵੈ ॥
ਉਸੁ ਅਸਥਾਨ ਤੇ ਬਹੁਰਿ ਨ ਆਵੈ ॥
ਅੰਤਰਿ ਹੋਇ ਗਿਆਨ ਪਰਗਾਸੁ ॥
ਉਸੁ ਅਸਥਾਨ ਕਾ ਨਹੀ ਬਿਨਾਸੁ ॥
ਮਨ ਤਨ ਨਾਮਿ ਰਤੇ ਇਕ ਰੰਗਿ ॥
ਸਦਾ ਬਸਹਿ ਪਾਰਬ੍ਰਹਮ ਕੈ ਸੰਗਿ ॥
ਜਿਉ ਜਲ ਮਹਿ ਜਲੁ ਆਇ ਖਟਾਨਾ ॥
ਤਿਉ ਜੋਤੀ ਸੰਗਿ ਜੋਤਿ ਸਮਾਨਾ ॥
ਮਿਟਿ ਗਏ ਗਵਨ ਪਾਏ ਬਿਸ੍ਰਾਮ ॥
ਨਾਨਕ ਪ੍ਰਭ ਕੈ ਸਦ ਕੁਰਬਾਨ ॥੮॥੧੧॥
ਸਲੋਕੁ ॥
ਸੁਖੀ ਬਸੈ ਮਸਕੀਨੀਆ ਆਪੁ ਨਿਵਾਰਿ ਤਲੇ ॥
ਬਡੇ ਬਡੇ ਅਹੰਕਾਰੀਆ ਨਾਨਕ ਗਰਬਿ ਗਲੇ ॥੧॥`,
        transliteration: `salok |
karan kaaran prabh ek hai doosar naahee koe |
naanak tis balihaaranai jal thal maheeal soe |1|
asattapadee |
karan karaavan karanai jog |
jo tis bhaavai soee hog |
khin meh thaap uthaapanahaaraa |
ant nahee kichh paaraavaaraa |
hukame dhaar adhar rahaavai |
hukame upajai hukam samaavai |
hukame aooch neech biauhaar |
hukame anik rang parakaar |
kar kar dekhai apanee vaddiaaee |
naanak sabh meh rahiaa samaaee |1|
prabh bhaavai maanukh gat paavai |
prabh bhaavai taa paathar taraavai |
prabh bhaavai bin saas te raakhai |
prabh bhaavai taa har gun bhaakhai |
prabh bhaavai taa patit udhaarai |
aap karai aapan beechaarai |
duhaa siriaa kaa aap suaamee |
khelai bigasai antarajaamee |
jo bhaavai so kaar karaavai |
naanak drisattee avar na aavai |2|
kahu maanukh te kiaa hoe aavai |
jo tis bhaavai soee karaavai |
eis kai haath hoe taa sabh kichh lee |
jo tis bhaavai soee karee |
anajaanat bikhiaa meh rachai |
je jaanat aapan aap bachai |
bharame bhoolaa deh dis dhaavai |
nimakh maeh chaar kuntt fir aavai |
kar kirapaa jis apanee bhagat dee |
naanak te jan naam milee |3|
khin meh neech keett kau raaj |
paarabraham gareeb nivaaj |
jaa kaa drisatt kachhoo na aavai |
tis tatakaal deh dis pragattaavai |
jaa kau apunee karai bakhasees |
taa kaa lekhaa na ganai jagadees |
jeeo pindd sabh tis kee raas |
ghatt ghatt pooran braham pragaas |
apanee banat aap banaaee |
naanak jeevai dekh baddaaee |4|
eis kaa bal naahee is haath |
karan karaavan sarab ko naath |
aagiaakaaree bapuraa jeeo |
jo tis bhaavai soee fun theeo |
kabahoo aooch neech meh basai |
kabahoo sog harakh rang hasai |
kabahoo nind chind biauhaar |
kabahoo aoobh akaas peaal |
kabahoo betaa braham beechaar |
naanak aap milaavanahaar |5|
kabahoo nirat karai bahu bhaat |
kabahoo soe rahai din raat |
kabahoo mahaa krodh bikaraal |
kabahoon sarab kee hot ravaal |
kabahoo hoe bahai badd raajaa |
kabahu bhekhaaree neech kaa saajaa |
kabahoo apakeerat meh aavai |
kabahoo bhalaa bhalaa kahaavai |
jiau prabh raakhai tiv hee rahai |
gur prasaad naanak sach kahai |6|
kabahoo hoe panddit kare bakhayaan |
kabahoo monidhaaree laavai dhiaan |
kabahoo tatt teerath isanaan |
kabahoo sidh saadhik mukh giaan |
kabahoo keett hasat patang hoe jeea |
anik jon bharamai bharameea |
naanaa roop jiau svaagee dikhaavai |
jiau prabh bhaavai tivai nachaavai |
jo tis bhaavai soee hoe |
naanak doojaa avar na koe |7|
kabahoo saadhasangat ihu paavai |
aus asathaan te bahur na aavai |
antar hoe giaan paragaas |
aus asathaan kaa nahee binaas |
man tan naam rate ik rang |
sadaa baseh paarabraham kai sang |
jiau jal meh jal aae khattaanaa |
tiau jotee sang jot samaanaa |
mitt ge gavan paae bisraam |
naanak prabh kai sad kurabaan |8|11|
salok |
sukhee basai masakeeneea aap nivaar tale |
badde badde ahankaareea naanak garab gale |1|`,
        meaning: `Salok: God alone is the Doer of deeds - there is no other at all. O Nanak, I am a sacrifice to the One, who pervades the waters, the lands, the sky and all space. ||1|| Ashtapadee: The Doer, the Cause of causes, is potent to do anything. That which pleases Him, comes to pass. In an instant, He creates and destroys. He has no end or limitation. By His Order, He established the earth, and He maintains it unsupported. By His Order, the world was created; by His Order, it shall merge again into Him. By His Order, one's occupation is high or low. By His Order, there are so many colors and forms. Having created the Creation, He beholds His own greatness. O Nanak, He is pervading in all. ||1|| If it pleases God, one attains salvation. If it pleases God, then even stones can swim. If it pleases God, the body is preserved, even without the breath of life. If it pleases God, then one chants the Lord's Glorious Praises. If it pleases God, then even sinners are saved. He Himself acts, and He Himself contemplates. He Himself is the Master of both worlds. He plays and He enjoys; He is the Inner-knower, the Searcher of hearts. As He wills, He causes actions to be done. Nanak sees no other than Him. ||2|| Tell me - what can a mere mortal do? Whatever pleases God is what He causes us to do. If it were in our hands, we would grab up everything. Whatever pleases God - that is what He does. Through ignorance, people are engrossed in corruption. If they knew better, they would save themselves. Deluded by doubt, they wander around in the ten directions. In an instant, their minds go around the four corners of the world and come back again. Those whom the Lord mercifully blesses with His devotional worship - O Nanak, they are absorbed into the Naam. ||3|| In an instant, the lowly worm is transformed into a king. The Supreme Lord God is the Protector of the humble. Even one who has never been seen at all, becomes instantly famous in the ten directions. And that one upon whom He bestows His blessings the Lord of the world does not hold him to his account. Soul and body are all His property. Each and every heart is illuminated by the Perfect Lord God. He Himself fashioned His own handiwork. Nanak lives by beholding His greatness. ||4|| There is no power in the hands of mortal beings; the Doer, the Cause of causes is the Lord of all. The helpless beings are subject to His Command. That which pleases Him, ultimately comes to pass. Sometimes, they abide in exaltation; sometimes, they are depressed. Sometimes, they are sad, and sometimes they laugh with joy and delight. Sometimes, they are occupied with slander and anxiety. Sometimes, they are high in the Akaashic Ethers, sometimes in the nether regions of the underworld. Sometimes, they know the contemplation of God. O Nanak, God Himself unites them with Himself. ||5|| Sometimes, they dance in various ways. Sometimes, they remain asleep day and night. Sometimes, they are awesome, in terrible rage. Sometimes, they are the dust of the feet of all. Sometimes, they sit as great kings. Sometimes, they wear the coat of a lowly beggar. Sometimes, they come to have evil reputations. Sometimes, they are known as very, very good. As God keeps them, so they remain. By Guru's Grace, O Nanak, the Truth is told. ||6|| Sometimes, as scholars, they deliver lectures. Sometimes, they hold to silence in deep meditation. Sometimes, they take cleansing baths at places of pilgrimage. Sometimes, as Siddhas or seekers, they impart spiritual wisdom. Sometimes, they becomes worms, elephants, or moths. They may wander and roam through countless incarnations. In various costumes, like actors, they appear. As it pleases God, they dance. Whatever pleases Him, comes to pass. O Nanak, there is no other at all. ||7|| Sometimes, this being attains the Company of the Holy. From that place, he does not have to come back again. The light of spiritual wisdom dawns within. That place does not perish. The mind and body are imbued with the Love of the Naam, the Name of the One Lord. He dwells forever with the Supreme Lord God. As water comes to blend with water, his light blends into the Light. Reincarnation is ended, and eternal peace is found. Nanak is forever a sacrifice to God. ||8||11|| Salok: The humble beings abide in peace; subduing egotism, they are meek. The very proud and arrogant persons, O Nanak, are consumed by their own pride. ||1||`,
        meaning_pa: `(ਇਸ ਸਾਰੇ) ਜਗਤ ਦਾ (ਮੂਲ-) ਕਾਰਣ (ਭਾਵ, ਬਣਾਉਣ ਵਾਲਾ) ਇਕ ਅਕਾਲ ਪੁਰਖ ਹੀ ਹੈ, ਕੋਈ ਦੂਜਾ ਨਹੀਂ ਹੈ। ਹੇ ਨਾਨਕ! (ਮੈਂ) ਉਸ ਪ੍ਰਭੂ ਤੋਂ ਸਦਕੇ (ਹਾਂ), ਜੋ ਜਲ ਵਿਚ ਥਲ ਵਿਚ ਤੇ ਧਰਤੀ ਦੇ ਤਲ ਉਤੇ (ਭਾਵ, ਆਕਾਸ਼ ਵਿਚ ਮੌਜੂਦ ਹੈ) ॥੧॥ ਪ੍ਰਭੂ (ਸਭ ਕੁਝ) ਕਰਨ ਦੀ ਸਮਰੱਥਾ ਰੱਖਦਾ ਹੈ, ਤੇ (ਜੀਆਂ ਨੂੰ) ਕੰਮ ਕਰਨ ਲਈ ਪ੍ਰੇਰਨ ਜੋਗਾ ਭੀ ਹੈ, ਓਹੀ ਕੁਝ ਹੁੰਦਾ ਹੈ ਜੋ ਉਸ ਨੂੰ ਚੰਗਾ ਲੱਗਦਾ ਹੈ। ਅੱਖ ਦੇ ਫੋਰ ਵਿਚ ਜਗਤ ਨੂੰ ਪੈਦਾ ਕਰ ਕੇ ਨਾਸ ਭੀ ਕਰਨ ਵਾਲਾ ਹੈ, (ਉਸ ਦੀ ਤਾਕਤ) ਦਾ ਕੋਈ ਹੱਦ-ਬੰਨਾ ਨਹੀਂ ਹੈ। (ਸ੍ਰਿਸ਼ਟੀ ਨੂੰ ਆਪਣੇ) ਹੁਕਮ ਵਿਚ ਪੈਦਾ ਕਰ ਕੇ ਬਿਨਾ ਕਿਸੇ ਆਸਰੇ ਟਿਕਾ ਰੱਖਦਾ ਹੈ, (ਜਗਤ ਉਸ ਦੇ) ਹੁਕਮ ਵਿਚ ਪੈਦਾ ਹੁੰਦਾ ਹੈ ਤੇ ਹੁਕਮ ਵਿਚ ਲੀਨ ਹੋ ਜਾਂਦਾ ਹੈ। ਉੱਚੇ ਤੇ ਨੀਵੇਂ ਬੰਦਿਆਂ ਦੀ ਵਰਤੋਂ ਭੀ ਉਸ ਦੇ ਹੁਕਮ ਵਿਚ ਹੀ ਹੈ, ਅਨੇਕਾਂ ਕਿਸਮਾਂ ਦੇ ਖੇਡ-ਤਮਾਸ਼ੇ ਉਸ ਦੇ ਹੁਕਮ ਵਿਚ ਹੋ ਰਹੇ ਹਨ। ਆਪਣੀ ਬਜ਼ੁਰਗੀ (ਦੇ ਕੰਮ) ਕਰ ਕਰ ਕੇ ਆਪ ਹੀ ਵੇਖ ਰਿਹਾ ਹੈ। ਹੇ ਨਾਨਕ! ਪ੍ਰਭੂ ਸਭ ਜੀਵਾਂ ਵਿਚ ਵਿਆਪਕ ਹੈ ॥੧॥ ਜੇ ਪ੍ਰਭੂ ਨੂੰ ਚੰਗੀ ਲੱਗੇ ਤਾਂ ਮਨੁੱਖ ਨੂੰ ਉੱਚੀ ਆਤਮਕ ਅਵਸਥਾ ਦੇਂਦਾ ਹੈ, ਅਤੇ ਪੱਥਰ (-ਦਿਲਾਂ) ਨੂੰ ਭੀ ਤਾਰ ਲੈਂਦਾ ਹੈ। ਜੇ ਪ੍ਰਭੂ ਚਾਹੇ ਤਾਂ ਸੁਆਸਾਂ ਤੋਂ ਬਿਨਾ ਭੀ ਪ੍ਰਾਣੀ ਨੂੰ (ਮੌਤ ਤੋਂ) ਬਚਾ ਰੱਖਦਾ ਹੈ, ਉਸ ਦੀ ਮੇਹਰ ਹੋਵੇ ਤਾਂ ਜੀਵ ਪ੍ਰਭੂ ਦੇ ਗੁਣ ਗਾਉਂਦਾ ਹੈ। ਜੇ ਅਕਾਲ ਪੁਰਖ ਦੀ ਰਜ਼ਾ ਹੋਵੇ ਤਾਂ ਗਿਰੇ ਹੋਏ ਚਲਨ ਵਾਲਿਆਂ ਨੂੰ (ਵਿਕਾਰਾਂ ਤੋਂ) ਬਚਾ ਲੈਂਦਾ ਹੈ; ਜੋ ਕੁਝ ਕਰਦਾ ਹੈ, ਆਪਣੀ ਸਲਾਹ ਅਨੁਸਾਰ ਕਰਦਾ ਹੈ। ਪ੍ਰਭੂ ਆਪ ਹੀ ਲੋਕ ਪਰਲੋਕ ਦਾ ਮਾਲਕ ਹੈ, ਉਹ ਸਭ ਦੇ ਦਿਲ ਦੀ ਜਾਣਨ ਵਾਲਾ ਆਪ ਜਗਤ-ਖੇਡ ਖੇਡਦਾ ਹੈ ਤੇ (ਇਸ ਨੂੰ ਵੇਖ ਕੇ) ਖ਼ੁਸ਼ ਹੁੰਦਾ ਹੈ। ਜੋ ਉਸ ਨੂੰ ਚੰਗਾ ਲੱਗਦਾ ਹੈ ਉਹੀ ਕੰਮ ਕਰਦਾ ਹੈ। ਹੇ ਨਾਨਕ! (ਉਸ ਵਰਗਾ) ਕੋਈ ਹੋਰ ਨਹੀਂ ਦਿੱਸਦਾ ॥੨॥ ਦੱਸੋ, ਮਨੁੱਖ ਪਾਸੋਂ (ਆਪਣੇ ਆਪ) ਕੇਹੜਾ ਕੰਮ ਹੋ ਸਕਦਾ ਹੈ? ਜੋ ਪ੍ਰਭੂ ਨੂੰ ਚੰਗਾ ਲੱਗਦਾ ਹੈ, ਉਹੀ (ਜੀਵ ਪਾਸੋਂ) ਕਰਾਉਂਦਾ ਹੈ। ਇਸ (ਮਨੁੱਖ) ਦੇ ਵੱਸ ਹੋਵੇ ਤਾਂ ਹਰੇਕ ਚੀਜ਼ ਸਾਂਭ ਲਏ, (ਪਰ) ਪ੍ਰਭੂ ਉਹੀ ਕੁਝ ਕਰਦਾ ਹੈ ਜੋ ਉਸ ਨੂੰ ਭਾਉਂਦਾ ਹੈ। ਮੂਰਖਤਾ ਦੇ ਕਾਰਣ ਮਨੁੱਖ ਮਾਇਆ ਵਿਚ ਰੁੱਝ ਜਾਂਦਾ ਹੈ, ਜੇ ਸਮਝ ਵਾਲਾ ਹੋਵੇ ਤਾਂ ਆਪਣੇ ਆਪ (ਇਸ ਤੋਂ) ਬਚਿਆ ਰਹੇ; (ਪਰ ਇਸ ਦਾ ਮਨ) ਭੁਲੇਖੇ ਵਿਚ ਭੁੱਲਾ ਹੋਇਆ (ਮਾਇਆ ਦੀ ਖ਼ਾਤਿਰ) ਦਸੀਂ ਪਾਸੀਂ ਦੌੜਦਾ ਹੈ, ਅੱਖ ਦੇ ਫੋਰ ਵਿਚ ਚਹੁੰ ਕੂਟਾਂ ਵਿਚ ਭੱਜ ਦੌੜ ਆਉਂਦਾ ਹੈ। (ਪ੍ਰਭੂ) ਮੇਹਰ ਕਰ ਕੇ ਜਿਸ ਜਿਸ ਮਨੁੱਖ ਨੂੰ ਆਪਣੀ ਭਗਤੀ ਬਖ਼ਸ਼ਦਾ ਹੈ, ਹੇ ਨਾਨਕ! ਉਹ ਮਨੁੱਖ ਨਾਮ ਵਿਚ ਟਿਕੇ ਰਹਿੰਦੇ ਹਨ ॥੩॥ ਖਿਣ ਵਿਚ ਪ੍ਰਭੂ ਕੀੜੇ (ਵਰਗੇ) ਨੀਵੇਂ (ਮਨੁੱਖ) ਨੂੰ ਰਾਜ ਦੇ ਦੇਂਦਾ ਹੈ, ਪ੍ਰਭੂ ਗ਼ਰੀਬਾਂ ਤੇ ਮੇਹਰ ਕਰਨ ਵਾਲਾ ਹੈ। ਜਿਸ ਮਨੁੱਖ ਦਾ ਕੋਈ ਗੁਣ ਨਹੀਂ ਦਿੱਸ ਆਉਂਦਾ, ਉਸ ਨੂੰ ਪਲਕ ਵਿਚ ਦਸੀਂ ਪਾਸੀਂ ਉੱਘਾ ਕਰ ਦੇਂਦਾ ਹੈ। ਜਿਸ ਮਨੁੱਖ ਤੇ ਜਗਤ ਦਾ ਮਾਲਕ ਪ੍ਰਭੂ ਆਪਣੀ ਬਖ਼ਸ਼ਸ਼ ਕਰਦਾ ਹੈ; ਉਸ ਦਾ (ਕਰਮਾਂ ਦਾ) ਲੇਖਾ ਨਹੀਂ ਗਿਣਦਾ। ਇਹ ਜਿੰਦ ਤੇ ਸਰੀਰ ਸਭ ਉਸ ਪ੍ਰਭੂ ਦੀ ਦਿੱਤੀ ਹੋਈ ਪੂੰਜੀ ਹੈ, ਹਰੇਕ ਸਰੀਰ ਵਿਚ ਵਿਆਪਕ ਪ੍ਰਭੂ ਦਾ ਹੀ ਜਲਵਾ ਹੈ। ਇਹ (ਜਗਤ-) ਰਚਨਾ ਉਸ ਨੇ ਆਪ ਰਚੀ ਹੈ। ਹੇ ਨਾਨਕ! ਆਪਣੀ (ਇਸ) ਬਜ਼ੁਰਗੀ ਨੂੰ ਆਪ ਵੇਖ ਕੇ ਖ਼ੁਸ਼ ਹੋ ਰਿਹਾ ਹੈ ॥੪॥ ਇਸ (ਜੀਵ) ਦੀ ਤਾਕਤ ਇਸ ਦੇ ਆਪਣੇ ਹੱਥ ਨਹੀਂ ਹੈ, ਸਭ ਜੀਵਾਂ ਦਾ ਮਾਲਕ ਪ੍ਰਭੂ ਆਪ ਸਭ ਕੁਝ ਕਰਨ ਕਰਾਉਣ ਦੇ ਸਮਰੱਥ ਹੈ। ਵਿਚਾਰਾ ਜੀਵ ਪ੍ਰਭੂ ਦੇ ਹੁਕਮ ਵਿਚ ਹੀ ਤੁਰਨ ਵਾਲਾ ਹੈ, (ਕਿਉਂਕਿ) ਹੁੰਦਾ ਓਹੀ ਹੈ ਜੋ ਉਸ ਪ੍ਰਭੂ ਨੂੰ ਭਾਉਂਦਾ ਹੈ। (ਪ੍ਰਭੂ ਆਪ) ਕਦੇ ਉੱਚਿਆਂ ਵਿਚ ਕਦੇ ਨੀਵਿਆਂ ਵਿਚ ਪ੍ਰਗਟ ਹੋ ਰਿਹਾ ਹੈ, ਕਦੇ ਚਿੰਤਾ ਵਿਚ ਹੈ ਤੇ ਕਦੇ ਖੁਸ਼ੀ ਦੀ ਮੌਜ ਵਿਚ ਹੱਸ ਰਿਹਾ ਹੈ; ਕਦੇ (ਦੂਜਿਆਂ ਦੀ) ਨਿੰਦਿਆ ਵਿਚਾਰਨ ਦਾ ਵਿਹਾਰ ਬਣਾਈ ਬੈਠਾ ਹੈ, ਕਦੇ (ਖ਼ੁਸ਼ੀ ਦੇ ਕਾਰਣ) ਅਕਾਸ਼ ਵਿਚ ਉੱਚਾ (ਚੜ੍ਹਦਾ ਹੈ) (ਕਦੇ ਚਿੰਤਾ ਦੇ ਕਾਰਣ) ਪਤਾਲ ਵਿਚ (ਡਿੱਗਾ ਪਿਆ ਹੈ); ਕਦੇ ਆਪ ਹੀ ਰੱਬੀ ਵਿਚਾਰ ਦਾ ਮਹਰਮ ਹੈ। ਹੇ ਨਾਨਕ! ਜੀਵਾਂ ਨੂੰ ਆਪਣੇ ਵਿਚ ਮੇਲਣ ਵਾਲਾ ਆਪ ਹੀ ਹੈ ॥੫॥ (ਪ੍ਰਭੂ ਜੀਵਾਂ ਵਿਚ ਵਿਆਪਕ ਹੋ ਕੇ) ਕਦੇ ਕਈ ਕਿਸਮਾਂ ਦੇ ਨਾਚ ਕਰ ਰਿਹਾ ਹੈ, ਕਦੇ ਦਿਨੇ ਰਾਤ ਸੁੱਤਾ ਰਹਿੰਦਾ ਹੈ। ਕਦੇ ਕ੍ਰੋਧ (ਵਿਚ ਆ ਕੇ) ਬੜਾ ਡਰਾਉਣਾ (ਲੱਗਦਾ ਹੈ), ਕਦੇ ਜੀਵਾਂ ਦੇ ਚਰਨਾਂ ਦੀ ਧੂੜ (ਬਣਿਆ ਰਹਿੰਦਾ ਹੈ); ਕਦੇ ਵੱਡਾ ਰਾਜਾ ਬਣ ਬੈਠਦਾ ਹੈ, ਕਦੇ ਇਕ ਨੀਵੀਂ ਜਾਤਿ ਦੇ ਮੰਗਤੇ ਦਾ ਸਾਂਗ (ਬਣਾ ਰੱਖਿਆ ਹੈ); ਕਦੇ ਆਪਣੀ ਬਦਨਾਮੀ ਕਰਾ ਰਿਹਾ ਹੈ, ਕਦੇ ਚੰਗਾ ਅਖਵਾ ਰਿਹਾ ਹੈ; ਜੀਵ ਉਸੇ ਤਰ੍ਹਾਂ ਜੀਵਨ ਬਿਤੀਤ ਕਰਦਾ ਹੈ ਜਿਵੇਂ ਪ੍ਰਭੂ ਕਰਾਉਂਦਾ ਹੈ। ਹੇ ਨਾਨਕ! (ਕੋਈ ਵਿਰਲਾ ਮਨੁੱਖ) ਗੁਰੂ ਦੀ ਕਿਰਪਾ ਨਾਲ ਪ੍ਰਭੂ ਨੂੰ ਸਿਮਰਦਾ ਹੈ ॥੬॥ (ਸਰਬ-ਵਿਆਪੀ ਪ੍ਰਭੂ) ਕਦੇ ਪੰਡਤ ਬਣ ਕੇ (ਦੂਜਿਆਂ ਨੂੰ) ਉਪਦੇਸ਼ ਕਰ ਰਿਹਾ ਹੈ, ਕਦੇ ਮੋਨੀ ਸਾਧੂ ਹੋ ਕੇ ਸਮਾਧੀ ਲਾਈ ਬੈਠਾ ਹੈ; ਕਦੇ ਤੀਰਥਾਂ ਦੇ ਕਿਨਾਰੇ ਇਸ਼ਨਾਨ ਕਰ ਰਿਹਾ ਹੈ, ਕਦੇ ਸਿੱਧ ਤੇ ਸਾਧਿਕ (ਦੇ ਰੂਪ ਵਿਚ) ਮੂੰਹੋਂ ਗਿਆਨ ਦੀਆਂ ਗੱਲਾਂ ਕਰਦਾ ਹੈ; ਕਦੇ ਕੀੜੇ ਹਾਥੀ ਭੰਬਟ (ਆਦਿਕ) ਜੀਵ ਬਣਿਆ ਹੋਇਆ ਹੈ, ਅਤੇ (ਆਪਣਾ ਹੀ) ਭਵਾਇਆ ਹੋਇਆ ਕਈ ਜੂਨਾਂ ਵਿਚ ਭਉਂ ਰਿਹਾ ਹੈ; ਬਹੁ-ਰੂਪੀਏ ਵਾਂਗ ਕਈ ਤਰ੍ਹਾਂ ਦੇ ਰੂਪ ਵਿਖਾ ਰਿਹਾ ਹੈ, ਜਿਉਂ ਪ੍ਰਭੂ ਨੂੰ ਭਾਉਂਦਾ ਹੈ ਤਿਵੇਂ (ਜੀਵਾਂ ਨੂੰ) ਨਚਾਉਂਦਾ ਹੈ। ਉਹੀ ਹੁੰਦਾ ਹੈ ਜੋ ਉਸ (ਮਾਲਕ) ਨੂੰ ਚੰਗਾ ਲੱਗਦਾ ਹੈ। ਹੇ ਨਾਨਕ! (ਉਸ ਵਰਗਾ) ਕੋਈ ਹੋਰ ਦੂਜਾ ਨਹੀਂ ਹੈ ॥੭॥ (ਜਦੋਂ) ਕਦੇ (ਪ੍ਰਭੂ ਦੀ ਅੰਸ਼) ਇਹ ਜੀਵ ਸਤਸੰਗਿ ਵਿਚ ਅੱਪੜਦਾ ਹੈ, ਤਾਂ ਉਸ ਥਾਂ ਤੋਂ ਮੁੜ ਵਾਪਸ ਨਹੀਂ ਆਉਂਦਾ; (ਕਿਉਂਕਿ) ਇਸ ਦੇ ਅੰਦਰ ਪ੍ਰਭੂ ਦੇ ਗਿਆਨ ਦਾ ਪਰਕਾਸ਼ ਹੋ ਜਾਂਦਾ ਹੈ, (ਤੇ) ਉਸ (ਗਿਆਨ ਦੇ ਪਰਕਾਸ਼ ਵਾਲੀ) ਹਾਲਤ ਦਾ ਨਾਸ ਨਹੀਂ ਹੁੰਦਾ; (ਜਿਨ੍ਹਾਂ ਮਨੁੱਖਾਂ ਦੇ) ਤਨ ਮਨ ਪ੍ਰਭੂ ਦੇ ਨਾਮ ਵਿਚ ਤੇ ਪਿਆਰ ਵਿਚ ਰੱਤੇ ਰਹਿੰਦੇ ਹਨ, ਉਹ ਸਦਾ ਪ੍ਰਭੂ ਦੀ ਹਜ਼ੂਰੀ ਵਿਚ ਵੱਸਦੇ ਹਨ। (ਸੋ) ਜਿਵੇਂ ਪਾਣੀ ਵਿਚ ਪਾਣੀ ਆ ਰਲਦਾ ਹੈ, ਤਿਵੇਂ (ਸਤਸੰਗ ਵਿਚ ਟਿਕੇ ਹੋਏ ਦੀ) ਆਤਮਾ ਪ੍ਰਭੂ ਦੀ ਜੋਤਿ ਵਿਚ ਲੀਨ ਹੋ ਜਾਂਦੀ ਹੈ; ਉਸ ਦੇ (ਜਨਮ ਮਰਨ ਦੇ) ਫੇਰੇ ਮੁੱਕ ਜਾਂਦੇ ਹਨ, (ਪ੍ਰਭੂ-ਚਰਨਾਂ ਵਿਚ) ਉਸ ਨੂੰ ਟਿਕਾਣਾ ਮਿਲ ਜਾਂਦਾ ਹੈ। ਹੇ ਨਾਨਕ! ਪ੍ਰਭੂ ਤੋਂ ਸਦਕੇ ਜਾਈਏ ॥੮॥੧੧॥ ਗਰੀਬੀ ਸੁਭਾਉ ਵਾਲਾ ਬੰਦਾ ਆਪਾ-ਭਾਵ ਦੂਰ ਕਰ ਕੇ, ਤੇ ਨੀਵਾਂ ਰਹਿ ਕੇ ਸੁਖੀ ਵੱਸਦਾ ਹੈ, (ਪਰ) ਵੱਡੇ ਵੱਡੇ ਅਹੰਕਾਰੀ ਮਨੁੱਖ, ਹੇ ਨਾਨਕ! ਅਹੰਕਾਰ ਵਿਚ ਹੀ ਗਲ ਜਾਂਦੇ ਹਨ ॥੧॥`
      },
      {
        number: 12,
        sanskrit: `ਸਲੋਕੁ ॥
ਸੁਖੀ ਬਸੈ ਮਸਕੀਨੀਆ ਆਪੁ ਨਿਵਾਰਿ ਤਲੇ ॥
ਬਡੇ ਬਡੇ ਅਹੰਕਾਰੀਆ ਨਾਨਕ ਗਰਬਿ ਗਲੇ ॥੧॥
ਅਸਟਪਦੀ ॥
ਜਿਸ ਕੈ ਅੰਤਰਿ ਰਾਜ ਅਭਿਮਾਨੁ ॥
ਸੋ ਨਰਕਪਾਤੀ ਹੋਵਤ ਸੁਆਨੁ ॥
ਜੋ ਜਾਨੈ ਮੈ ਜੋਬਨਵੰਤੁ ॥
ਸੋ ਹੋਵਤ ਬਿਸਟਾ ਕਾ ਜੰਤੁ ॥
ਆਪਸ ਕਉ ਕਰਮਵੰਤੁ ਕਹਾਵੈ ॥
ਜਨਮਿ ਮਰੈ ਬਹੁ ਜੋਨਿ ਭ੍ਰਮਾਵੈ ॥
ਧਨ ਭੂਮਿ ਕਾ ਜੋ ਕਰੈ ਗੁਮਾਨੁ ॥
ਸੋ ਮੂਰਖੁ ਅੰਧਾ ਅਗਿਆਨੁ ॥
ਕਰਿ ਕਿਰਪਾ ਜਿਸ ਕੈ ਹਿਰਦੈ ਗਰੀਬੀ ਬਸਾਵੈ ॥
ਨਾਨਕ ਈਹਾ ਮੁਕਤੁ ਆਗੈ ਸੁਖੁ ਪਾਵੈ ॥੧॥
ਧਨਵੰਤਾ ਹੋਇ ਕਰਿ ਗਰਬਾਵੈ ॥
ਤ੍ਰਿਣ ਸਮਾਨਿ ਕਛੁ ਸੰਗਿ ਨ ਜਾਵੈ ॥
ਬਹੁ ਲਸਕਰ ਮਾਨੁਖ ਊਪਰਿ ਕਰੇ ਆਸ ॥
ਪਲ ਭੀਤਰਿ ਤਾ ਕਾ ਹੋਇ ਬਿਨਾਸ ॥
ਸਭ ਤੇ ਆਪ ਜਾਨੈ ਬਲਵੰਤੁ ॥
ਖਿਨ ਮਹਿ ਹੋਇ ਜਾਇ ਭਸਮੰਤੁ ॥
ਕਿਸੈ ਨ ਬਦੈ ਆਪਿ ਅਹੰਕਾਰੀ ॥
ਧਰਮ ਰਾਇ ਤਿਸੁ ਕਰੇ ਖੁਆਰੀ ॥
ਗੁਰ ਪ੍ਰਸਾਦਿ ਜਾ ਕਾ ਮਿਟੈ ਅਭਿਮਾਨੁ ॥
ਸੋ ਜਨੁ ਨਾਨਕ ਦਰਗਹ ਪਰਵਾਨੁ ॥੨॥
ਕੋਟਿ ਕਰਮ ਕਰੈ ਹਉ ਧਾਰੇ ॥
ਸ੍ਰਮੁ ਪਾਵੈ ਸਗਲੇ ਬਿਰਥਾਰੇ ॥
ਅਨਿਕ ਤਪਸਿਆ ਕਰੇ ਅਹੰਕਾਰ ॥
ਨਰਕ ਸੁਰਗ ਫਿਰਿ ਫਿਰਿ ਅਵਤਾਰ ॥
ਅਨਿਕ ਜਤਨ ਕਰਿ ਆਤਮ ਨਹੀ ਦ੍ਰਵੈ ॥
ਹਰਿ ਦਰਗਹ ਕਹੁ ਕੈਸੇ ਗਵੈ ॥
ਆਪਸ ਕਉ ਜੋ ਭਲਾ ਕਹਾਵੈ ॥
ਤਿਸਹਿ ਭਲਾਈ ਨਿਕਟਿ ਨ ਆਵੈ ॥
ਸਰਬ ਕੀ ਰੇਨ ਜਾ ਕਾ ਮਨੁ ਹੋਇ ॥
ਕਹੁ ਨਾਨਕ ਤਾ ਕੀ ਨਿਰਮਲ ਸੋਇ ॥੩॥
ਜਬ ਲਗੁ ਜਾਨੈ ਮੁਝ ਤੇ ਕਛੁ ਹੋਇ ॥
ਤਬ ਇਸ ਕਉ ਸੁਖੁ ਨਾਹੀ ਕੋਇ ॥
ਜਬ ਇਹ ਜਾਨੈ ਮੈ ਕਿਛੁ ਕਰਤਾ ॥
ਤਬ ਲਗੁ ਗਰਭ ਜੋਨਿ ਮਹਿ ਫਿਰਤਾ ॥
ਜਬ ਧਾਰੈ ਕੋਊ ਬੈਰੀ ਮੀਤੁ ॥
ਤਬ ਲਗੁ ਨਿਹਚਲੁ ਨਾਹੀ ਚੀਤੁ ॥
ਜਬ ਲਗੁ ਮੋਹ ਮਗਨ ਸੰਗਿ ਮਾਇ ॥
ਤਬ ਲਗੁ ਧਰਮ ਰਾਇ ਦੇਇ ਸਜਾਇ ॥
ਪ੍ਰਭ ਕਿਰਪਾ ਤੇ ਬੰਧਨ ਤੂਟੈ ॥
ਗੁਰ ਪ੍ਰਸਾਦਿ ਨਾਨਕ ਹਉ ਛੂਟੈ ॥੪॥
ਸਹਸ ਖਟੇ ਲਖ ਕਉ ਉਠਿ ਧਾਵੈ ॥
ਤ੍ਰਿਪਤਿ ਨ ਆਵੈ ਮਾਇਆ ਪਾਛੈ ਪਾਵੈ ॥
ਅਨਿਕ ਭੋਗ ਬਿਖਿਆ ਕੇ ਕਰੈ ॥
ਨਹ ਤ੍ਰਿਪਤਾਵੈ ਖਪਿ ਖਪਿ ਮਰੈ ॥
ਬਿਨਾ ਸੰਤੋਖ ਨਹੀ ਕੋਊ ਰਾਜੈ ॥
ਸੁਪਨ ਮਨੋਰਥ ਬ੍ਰਿਥੇ ਸਭ ਕਾਜੈ ॥
ਨਾਮ ਰੰਗਿ ਸਰਬ ਸੁਖੁ ਹੋਇ ॥
ਬਡਭਾਗੀ ਕਿਸੈ ਪਰਾਪਤਿ ਹੋਇ ॥
ਕਰਨ ਕਰਾਵਨ ਆਪੇ ਆਪਿ ॥
ਸਦਾ ਸਦਾ ਨਾਨਕ ਹਰਿ ਜਾਪਿ ॥੫॥
ਕਰਨ ਕਰਾਵਨ ਕਰਨੈਹਾਰੁ ॥
ਇਸ ਕੈ ਹਾਥਿ ਕਹਾ ਬੀਚਾਰੁ ॥
ਜੈਸੀ ਦ੍ਰਿਸਟਿ ਕਰੇ ਤੈਸਾ ਹੋਇ ॥
ਆਪੇ ਆਪਿ ਆਪਿ ਪ੍ਰਭੁ ਸੋਇ ॥
ਜੋ ਕਿਛੁ ਕੀਨੋ ਸੁ ਅਪਨੈ ਰੰਗਿ ॥
ਸਭ ਤੇ ਦੂਰਿ ਸਭਹੂ ਕੈ ਸੰਗਿ ॥
ਬੂਝੈ ਦੇਖੈ ਕਰੈ ਬਿਬੇਕ ॥
ਆਪਹਿ ਏਕ ਆਪਹਿ ਅਨੇਕ ॥
ਮਰੈ ਨ ਬਿਨਸੈ ਆਵੈ ਨ ਜਾਇ ॥
ਨਾਨਕ ਸਦ ਹੀ ਰਹਿਆ ਸਮਾਇ ॥੬॥
ਆਪਿ ਉਪਦੇਸੈ ਸਮਝੈ ਆਪਿ ॥
ਆਪੇ ਰਚਿਆ ਸਭ ਕੈ ਸਾਥਿ ॥
ਆਪਿ ਕੀਨੋ ਆਪਨ ਬਿਸਥਾਰੁ ॥
ਸਭੁ ਕਛੁ ਉਸ ਕਾ ਓਹੁ ਕਰਨੈਹਾਰੁ ॥
ਉਸ ਤੇ ਭਿੰਨ ਕਹਹੁ ਕਿਛੁ ਹੋਇ ॥
ਥਾਨ ਥਨੰਤਰਿ ਏਕੈ ਸੋਇ ॥
ਅਪੁਨੇ ਚਲਿਤ ਆਪਿ ਕਰਣੈਹਾਰ ॥
ਕਉਤਕ ਕਰੈ ਰੰਗ ਆਪਾਰ ॥
ਮਨ ਮਹਿ ਆਪਿ ਮਨ ਅਪੁਨੇ ਮਾਹਿ ॥
ਨਾਨਕ ਕੀਮਤਿ ਕਹਨੁ ਨ ਜਾਇ ॥੭॥
ਸਤਿ ਸਤਿ ਸਤਿ ਪ੍ਰਭੁ ਸੁਆਮੀ ॥
ਗੁਰ ਪਰਸਾਦਿ ਕਿਨੈ ਵਖਿਆਨੀ ॥
ਸਚੁ ਸਚੁ ਸਚੁ ਸਭੁ ਕੀਨਾ ॥
ਕੋਟਿ ਮਧੇ ਕਿਨੈ ਬਿਰਲੈ ਚੀਨਾ ॥
ਭਲਾ ਭਲਾ ਭਲਾ ਤੇਰਾ ਰੂਪ ॥
ਅਤਿ ਸੁੰਦਰ ਅਪਾਰ ਅਨੂਪ ॥
ਨਿਰਮਲ ਨਿਰਮਲ ਨਿਰਮਲ ਤੇਰੀ ਬਾਣੀ ॥
ਘਟਿ ਘਟਿ ਸੁਨੀ ਸ੍ਰਵਨ ਬਖੵਾਣੀ ॥
ਪਵਿਤ੍ਰ ਪਵਿਤ੍ਰ ਪਵਿਤ੍ਰ ਪੁਨੀਤ ॥
ਨਾਮੁ ਜਪੈ ਨਾਨਕ ਮਨਿ ਪ੍ਰੀਤਿ ॥੮॥੧੨॥
ਸਲੋਕੁ ॥
ਸੰਤ ਸਰਨਿ ਜੋ ਜਨੁ ਪਰੈ ਸੋ ਜਨੁ ਉਧਰਨਹਾਰ ॥
ਸੰਤ ਕੀ ਨਿੰਦਾ ਨਾਨਕਾ ਬਹੁਰਿ ਬਹੁਰਿ ਅਵਤਾਰ ॥੧॥`,
        transliteration: `salok |
sukhee basai masakeeneea aap nivaar tale |
badde badde ahankaareea naanak garab gale |1|
asattapadee |
jis kai antar raaj abhimaan |
so narakapaatee hovat suaan |
jo jaanai mai jobanavant |
so hovat bisattaa kaa jant |
aapas kau karamavant kahaavai |
janam marai bahu jon bhramaavai |
dhan bhoom kaa jo karai gumaan |
so moorakh andhaa agiaan |
kar kirapaa jis kai hiradai gareebee basaavai |
naanak eehaa mukat aagai sukh paavai |1|
dhanavantaa hoe kar garabaavai |
trin samaan kachh sang na jaavai |
bahu lasakar maanukh aoopar kare aas |
pal bheetar taa kaa hoe binaas |
sabh te aap jaanai balavant |
khin meh hoe jaae bhasamant |
kisai na badai aap ahankaaree |
dharam raae tis kare khuaaree |
gur prasaad jaa kaa mittai abhimaan |
so jan naanak daragah paravaan |2|
kott karam karai hau dhaare |
sram paavai sagale birathaare |
anik tapasiaa kare ahankaar |
narak surag fir fir avataar |
anik jatan kar aatam nahee dravai |
har daragah kahu kaise gavai |
aapas kau jo bhalaa kahaavai |
tiseh bhalaaee nikatt na aavai |
sarab kee ren jaa kaa man hoe |
kahu naanak taa kee niramal soe |3|
jab lag jaanai mujh te kachh hoe |
tab is kau sukh naahee koe |
jab ih jaanai mai kichh karataa |
tab lag garabh jon meh firataa |
jab dhaarai koaoo bairee meet |
tab lag nihachal naahee cheet |
jab lag moh magan sang maae |
tab lag dharam raae dee sajaae |
prabh kirapaa te bandhan toottai |
gur prasaad naanak hau chhoottai |4|
sehas khatte lakh kau utth dhaavai |
tripat na aavai maaeaa paachhai paavai |
anik bhog bikhiaa ke karai |
neh tripataavai khap khap marai |
binaa santokh nahee koaoo raajai |
supan manorath brithe sabh kaajai |
naam rang sarab sukh hoe |
baddabhaagee kisai paraapat hoe |
karan karaavan aape aap |
sadaa sadaa naanak har jaap |5|
karan karaavan karanaihaar |
eis kai haath kahaa beechaar |
jaisee drisatt kare taisaa hoe |
aape aap aap prabh soe |
jo kichh keeno su apanai rang |
sabh te door sabhahoo kai sang |
boojhai dekhai karai bibek |
aapeh ek aapeh anek |
marai na binasai aavai na jaae |
naanak sad hee rahiaa samaae |6|
aap upadesai samajhai aap |
aape rachiaa sabh kai saath |
aap keeno aapan bisathaar |
sabh kachh us kaa ohu karanaihaar |
aus te bhin kahahu kichh hoe |
thaan thanantar ekai soe |
apune chalit aap karanaihaar |
kautak karai rang aapaar |
man meh aap man apune maeh |
naanak keemat kehan na jaae |7|
sat sat sat prabh suaamee |
gur parasaad kinai vakhiaanee |
sach sach sach sabh keenaa |
kott madhe kinai biralai cheenaa |
bhalaa bhalaa bhalaa teraa roop |
at sundar apaar anoop |
niramal niramal niramal teree baanee |
ghatt ghatt sunee sravan bakhayaanee |
pavitr pavitr pavitr puneet |
naam japai naanak man preet |8|12|
salok |
sant saran jo jan parai so jan udharanahaar |
sant kee nindaa naanakaa bahur bahur avataar |1|`,
        meaning: `Salok: The humble beings abide in peace; subduing egotism, they are meek. The very proud and arrogant persons, O Nanak, are consumed by their own pride. ||1|| Ashtapadee: One who has the pride of power within, shall dwell in hell, and become a dog. One who deems himself to have the beauty of youth, shall become a maggot in manure. One who claims to act virtuously, shall live and die, wandering through countless reincarnations. One who takes pride in wealth and lands is a fool, blind and ignorant. One whose heart is mercifully blessed with abiding humility, O Nanak, is liberated here, and obtains peace hereafter. ||1|| One who becomes wealthy and takes pride in it not even a piece of straw shall go along with him. He may place his hopes on a large army of men, but he shall vanish in an instant. One who deems himself to be the strongest of all, in an instant, shall be reduced to ashes. One who thinks of no one else except his own prideful self the Righteous Judge of Dharma shall expose his disgrace. One who, by Guru's Grace, eliminates his ego, O Nanak, becomes acceptable in the Court of the Lord. ||2|| If someone does millions of good deeds, while acting in ego, he shall incur only trouble; all this is in vain. If someone performs great penance, while acting in selfishness and conceit, he shall be reincarnated into heaven and hell, over and over again. He makes all sorts of efforts, but his soul is still not softened how can he go to the Court of the Lord? One who calls himself good goodness shall not draw near him. One whose mind is the dust of all - says Nanak, his reputation is spotlessly pure. ||3|| As long as someone thinks that he is the one who acts, he shall have no peace. As long as this mortal thinks that he is the one who does things, he shall wander in reincarnation through the womb. As long as he considers one an enemy, and another a friend, his mind shall not come to rest. As long as he is intoxicated with attachment to Maya, the Righteous Judge shall punish him. By God's Grace, his bonds are shattered; by Guru's Grace, O Nanak, his ego is eliminated. ||4|| Earning a thousand, he runs after a hundred thousand. Satisfaction is not obtained by chasing after Maya. He may enjoy all sorts of corrupt pleasures, but he is still not satisfied; he indulges again and again, wearing himself out, until he dies. Without contentment, no one is satisfied. Like the objects in a dream, all his efforts are in vain. Through the love of the Naam, all peace is obtained. Only a few obtain this, by great good fortune. He Himself is Himself the Cause of causes. Forever and ever, O Nanak, chant the Lord's Name. ||5|| The Doer, the Cause of causes, is the Creator Lord. What deliberations are in the hands of mortal beings? As God casts His Glance of Grace, they come to be. God Himself, of Himself, is unto Himself. Whatever He created, was by His Own Pleasure. He is far from all, and yet with all. He understands, He sees, and He passes judgment. He Himself is the One, and He Himself is the many. He does not die or perish; He does not come or go. O Nanak, He remains forever All-pervading. ||6|| He Himself instructs, and He Himself learns. He Himself mingles with all. He Himself created His own expanse. All things are His; He is the Creator. Without Him, what could be done? In the spaces and interspaces, He is the One. In His own play, He Himself is the Actor. He produces His plays with infinite variety. He Himself is in the mind, and the mind is in Him. O Nanak, His worth cannot be estimated. ||7|| True, True, True is God, our Lord and Master. By Guru's Grace, some speak of Him. True, True, True is the Creator of all. Out of millions, scarcely anyone knows Him. Beautiful, Beautiful, Beautiful is Your Sublime Form. You are Exquisitely Beautiful, Infinite and Incomparable. Pure, Pure, Pure is the Word of Your Bani, heard in each and every heart, spoken to the ears. Holy, Holy, Holy and Sublimely Pure - chant the Naam, O Nanak, with heart-felt love. ||8||12|| Salok: One who seeks the Sanctuary of the Saints shall be saved. One who slanders the Saints, O Nanak, shall be reincarnated over and over again. ||1||`,
        meaning_pa: `ਗਰੀਬੀ ਸੁਭਾਉ ਵਾਲਾ ਬੰਦਾ ਆਪਾ-ਭਾਵ ਦੂਰ ਕਰ ਕੇ, ਤੇ ਨੀਵਾਂ ਰਹਿ ਕੇ ਸੁਖੀ ਵੱਸਦਾ ਹੈ, (ਪਰ) ਵੱਡੇ ਵੱਡੇ ਅਹੰਕਾਰੀ ਮਨੁੱਖ, ਹੇ ਨਾਨਕ! ਅਹੰਕਾਰ ਵਿਚ ਹੀ ਗਲ ਜਾਂਦੇ ਹਨ ॥੧॥ ਜਿਸ ਮਨੁੱਖ ਦੇ ਮਨ ਵਿਚ ਰਾਜ ਦਾ ਮਾਣ ਹੈ, ਉਹ ਕੁੱਤਾ ਨਰਕ ਵਿਚ ਪੈਣ ਦਾ ਸਜ਼ਾਵਾਰ ਹੁੰਦਾ ਹੈ। ਜੋ ਮਨੁੱਖ ਆਪਣੇ ਆਪ ਨੂੰ ਬੜਾ ਸੋਹਣਾ ਸਮਝਦਾ ਹੈ, ਉਹ ਵਿਸ਼ਟਾ ਦਾ ਹੀ ਕੀੜਾ ਹੁੰਦਾ ਹੈ (ਕਿਉਂਕਿ ਸਦਾ ਵਿਸ਼ੇ-ਵਿਕਾਰਾਂ ਦੇ ਗੰਦ ਵਿਚ ਪਿਆ ਰਹਿੰਦਾ ਹੈ)। ਜੇਹੜਾ ਆਪਣੇ ਆਪ ਨੂੰ ਚੰਗੇ ਕੰਮ ਕਰਨ ਵਾਲਾ ਅਖਵਾਉਂਦਾ ਹੈ, ਉਹ ਸਦਾ ਜੰਮਦਾ ਮਰਦਾ ਹੈ, ਕਈ ਜੂਨਾਂ ਵਿਚ ਭਟਕਦਾ ਫਿਰਦਾ ਹੈ। ਜੋ ਮਨੁੱਖ ਧਨ ਤੇ ਧਰਤੀ (ਦੀ ਮਾਲਕੀ) ਦਾ ਅਹੰਕਾਰ ਕਰਦਾ ਹੈ, ਉਹ ਮੂਰਖ ਹੈ, ਅੰਨ੍ਹਾ ਹੈ, ਬੜਾ ਜਾਹਿਲ ਹੈ। ਮੇਹਰ ਕਰ ਕੇ ਜਿਸ ਮਨੁੱਖ ਦੇ ਦਿਲ ਵਿਚ ਗਰੀਬੀ (ਸੁਭਾਉ) ਪਾਂਦਾ ਹੈ, ਹੇ ਨਾਨਕ! (ਉਹ ਮਨੁੱਖ) ਇਸ ਜ਼ਿੰਦਗੀ ਵਿਚ ਵਿਕਾਰਾਂ ਤੋਂ ਬਚਿਆ ਰਹਿੰਦਾ ਹੈ ਤੇ ਪਰਲੋਕ ਵਿਚ ਸੁਖ ਪਾਂਦਾ ਹੈ ॥੧॥ ਮਨੁੱਖ ਧਨ ਵਾਲਾ ਹੋ ਕੇ ਮਾਣ ਕਰਦਾ ਹੈ, (ਪਰ ਉਸ ਦੇ) ਨਾਲ (ਅੰਤ ਵੇਲੇ) ਇਕ ਤੀਲੇ ਜਿਤਨੀ ਭੀ ਕੋਈ ਚੀਜ਼ ਨਹੀਂ ਜਾਂਦੀ। ਬਹੁਤੇ ਲਸ਼ਕਰ ਅਤੇ ਮਨੁੱਖਾਂ ਉਤੇ ਬੰਦਾ ਆਸਾਂ ਲਾਈ ਰੱਖਦਾ ਹੈ, (ਪਰ) ਪਲਕ ਵਿਚ ਉਸ ਦਾ ਨਾਸ ਹੋ ਜਾਂਦਾ ਹੈ (ਤੇ ਉਹਨਾਂ ਵਿਚੋਂ ਕੋਈ ਭੀ ਸਹਾਈ ਨਹੀਂ ਹੁੰਦਾ)। ਮਨੁੱਖ ਆਪਣੇ ਆਪ ਨੂੰ ਸਭ ਨਾਲੋਂ ਬਲੀ ਸਮਝਦਾ ਹੈ, (ਪਰ ਅੰਤ ਵੇਲੇ) ਇਕ ਖਿਣ ਵਿਚ (ਸੜ ਕੇ) ਸੁਆਹ ਹੋ ਜਾਂਦਾ ਹੈ। (ਜੋ ਬੰਦਾ) ਆਪ (ਇਤਨਾ) ਅਹੰਕਾਰੀ ਹੋ ਜਾਂਦਾ ਹੈ ਕਿ ਕਿਸੇ ਦੀ ਭੀ ਪਰਵਾਹ ਨਹੀਂ ਕਰਦਾ, ਧਰਮਰਾਜ (ਅੰਤ ਵੇਲੇ) ਉਸ ਦੀ ਮਿੱਟੀ ਪਲੀਤ ਕਰਦਾ ਹੈ। ਸਤਿਗੁਰੂ ਦੀ ਦਇਆ ਨਾਲ ਜਿਸ ਦਾ ਅਹੰਕਾਰ ਮਿਟਦਾ ਹੈ, ਉਹ ਮਨੁੱਖ, ਹੇ ਨਾਨਕ! ਪ੍ਰਭੂ ਦੀ ਦਰਗਾਹ ਵਿਚ ਕਬੂਲ ਹੁੰਦਾ ਹੈ ॥੨॥ (ਜੇ ਮਨੁੱਖ) ਕਰੋੜਾਂ (ਧਾਰਮਿਕ) ਕੰਮ ਕਰੇ (ਤੇ ਉਹਨਾਂ ਦਾ) ਅਹੰਕਾਰ (ਭੀ) ਕਰੇ, ਤਾਂ ਉਹ ਸਾਰੇ ਕੰਮ ਵਿਅਰਥ ਹਨ, (ਉਹਨਾਂ ਕੰਮਾਂ ਦਾ ਫਲ ਉਸ ਨੂੰ ਕੇਵਲ) ਥਕੇਵਾਂ (ਹੀ) ਮਿਲਦਾ ਹੈ। ਅਨੇਕਾਂ ਤਪ ਦੇ ਸਾਧਨ ਕਰ ਕੇ ਜੇ ਇਹਨਾਂ ਦਾ ਮਾਣ ਕਰੇ, (ਤਾਂ ਉਹ ਭੀ) ਨਰਕਾਂ ਸੁਰਗਾਂ ਵਿਚ ਹੀ ਮੁੜ ਮੁੜ ਜੰਮਦਾ ਹੈ (ਭਾਵ, ਕਦੇ ਸੁਖ ਤੇ ਕਦੇ ਦੁਖ ਭੋਗਦਾ ਹੈ)। ਅਨੇਕਾਂ ਜਤਨ ਕੀਤਿਆਂ ਜੇ ਹਿਰਦਾ ਨਰਮ ਨਹੀਂ ਹੁੰਦਾ ਤਾਂ ਦੱਸੋ, ਉਹ ਮਨੁੱਖ ਪ੍ਰਭੂ ਦੀ ਦਰਗਾਹ ਵਿਚ ਕਿਵੇਂ ਪਹੁੰਚ ਸਕਦਾ ਹੈ? ਜੋ ਮਨੁੱਖ ਆਪਣੇ ਆਪ ਨੂੰ ਨੇਕ ਅਖਵਾਉਂਦਾ ਹੈ, ਨੇਕੀ ਉਸ ਦੇ ਨੇੜੇ ਭੀ ਨਹੀਂ ਢੁੱਕਦੀ। ਜਿਸ ਮਨੁੱਖ ਦਾ ਮਨ ਸਭਨਾਂ ਦੇ ਚਰਨਾਂ ਦੀ ਧੂੜ ਹੋ ਜਾਂਦਾ ਹੈ, ਆਖ, ਹੇ ਨਾਨਕ! ਉਸ ਮਨੁੱਖ ਦੀ ਸੋਹਣੀ ਸੋਭਾ ਖਿਲਰਦੀ ਹੈ ॥੩॥ ਮਨੁੱਖ ਜਦ ਤਕ ਇਹ ਸਮਝਦਾ ਹੈ ਕਿ ਮੈਥੋਂ ਕੁਝ ਹੋ ਸਕਦਾ ਹੈ, ਤਦ ਤਾਈਂ ਇਸ ਨੂੰ ਕੋਈ ਸੁਖ ਨਹੀਂ ਹੁੰਦਾ। ਜਦ ਤਕ ਇਹ ਸਮਝਦਾ ਹੈ ਕਿ ਮੈਂ (ਆਪਣੇ ਬਲ ਨਾਲ) ਕੁਝ ਕਰਦਾ ਹਾਂ, ਤਦ ਤਕ (ਵੱਖਰਾ-ਪਨ ਦੇ ਕਾਰਣ) ਜੂਨਾਂ ਵਿਚ ਪਿਆ ਰਹਿੰਦਾ ਹੈ। ਜਦ ਤਕ ਮਨੁੱਖ ਕਿਸੇ ਨੂੰ ਵੈਰੀ ਤੇ ਕਿਸੇ ਨੂੰ ਮਿਤ੍ਰ ਸਮਝਦਾ ਹੈ, ਤਦ ਤਕ ਇਸ ਦਾ ਮਨ ਟਿਕਾਣੇ ਨਹੀਂ ਆਉਂਦਾ। ਜਦ ਤਕ ਬੰਦਾ ਮਾਇਆ ਦੇ ਮੋਹ ਵਿਚ ਗ਼ਰਕ ਰਹਿੰਦਾ ਹੈ, ਤਦ ਤਕ ਇਸ ਨੂੰ ਧਰਮ-ਰਾਜ ਡੰਡ ਦੇਂਦਾ ਹੈ। (ਮਾਇਆ ਦੇ) ਬੰਧਨ ਪ੍ਰਭੂ ਦੀ ਮੇਹਰ ਨਾਲ ਟੁੱਟਦੇ ਹਨ, ਹੇ ਨਾਨਕ! ਮਨੁੱਖ ਦੀ ਹਉਮੈ ਗੁਰੂ ਦੀ ਕਿਰਪਾ ਨਾਲ ਮੁੱਕਦੀ ਹੈ ॥੪॥ (ਮਨੁੱਖ) ਹਜ਼ਾਰਾਂ (ਰੁਪਏ) ਕਮਾਉਂਦਾ ਹੈ ਤੇ ਲੱਖਾਂ (ਰੁਪਇਆਂ) ਦੀ ਖ਼ਾਤਰ ਉੱਠ ਦੌੜਦਾ ਹੈ; ਮਾਇਆ ਜਮ੍ਹਾ ਕਰੀ ਜਾਂਦਾ ਹੈ, (ਪਰ) ਰੱਜਦਾ ਨਹੀਂ। ਮਾਇਆ ਦੀਆਂ ਅਨੇਕਾਂ ਮੌਜਾਂ ਮਾਣਦਾ ਹੈ, ਤਸੱਲੀ ਨਹੀਂ ਸੁ ਹੁੰਦੀ, (ਭੋਗਾਂ ਦੇ ਮਗਰ ਹੋਰ ਭੱਜਦਾ ਹੈ ਤੇ) ਬੜਾ ਦੁੱਖੀ ਹੁੰਦਾ ਹੈ। ਜੇ ਅੰਦਰ ਸੰਤੋਖ ਨਾਹ ਹੋਵੇ, ਤਾਂ ਕੋਈ (ਮਨੁੱਖ) ਰੱਜਦਾ ਨਹੀਂ, ਜਿਵੇਂ ਸੁਫ਼ਨਿਆਂ ਤੋਂ ਕੋਈ ਲਾਭ ਨਹੀਂ ਹੁੰਦਾ, ਤਿਵੇਂ (ਸੰਤੋਖ-ਹੀਣ ਮਨੁੱਖ ਦੇ) ਸਾਰੇ ਕੰਮ ਤੇ ਖ਼ਾਹਸ਼ਾਂ ਵਿਅਰਥ ਹਨ। ਪ੍ਰਭੂ ਦੇ ਨਾਮ ਦੀ ਮੌਜ ਵਿਚ (ਹੀ) ਸਾਰਾ ਸੁਖ ਹੈ, (ਅਤੇ ਇਹ ਸੁਖ) ਕਿਸੇ ਵੱਡੇ ਭਾਗਾਂ ਵਾਲੇ ਨੂੰ ਮਿਲਦਾ ਹੈ। (ਜੋ) ਪ੍ਰਭੂ ਆਪ ਹੀ ਸਭ ਕੁਝ ਕਰਨ ਦੇ ਤੇ (ਜੀਵਾਂ ਪਾਸੋਂ) ਕਰਾਉਣ ਦੇ ਸਮਰੱਥ ਹੈ, ਹੇ ਨਾਨਕ! ਉਸ ਪ੍ਰਭੂ ਨੂੰ ਸਦਾ ਸਿਮਰ ॥੫॥ ਪ੍ਰਭੂ ਆਪ ਹੀ ਸਭ ਕੁਝ ਕਰਨ ਜੋਗਾ ਹੈ ਤੇ (ਜੀਵਾਂ ਪਾਸੋਂ) ਕਰਾਉਣ ਜੋਗਾ ਹੈ। ਵਿਚਾਰ ਕੇ ਵੇਖ ਲੈ, ਇਸ ਜੀਵ ਦੇ ਹੱਥ ਕੁਝ ਭੀ ਨਹੀਂ ਹੈ। ਪ੍ਰਭੂ ਜਿਹੋ ਜਿਹੀ ਨਜ਼ਰ (ਬੰਦੇ ਵਲ) ਕਰਦਾ ਹੈ (ਬੰਦਾ) ਉਹੋ ਜਿਹਾ ਬਣ ਜਾਂਦਾ ਹੈ, ਉਹ ਪ੍ਰਭੂ ਆਪ ਹੀ ਆਪ ਹੈ। ਜੋ ਕੁਝ ਉਸ ਬਣਾਇਆ ਹੈ ਆਪਣੀ ਮੌਜ ਵਿਚ ਬਣਾਇਆ ਹੈ; ਸਭ ਜੀਵਾਂ ਦੇ ਅੰਗ-ਸੰਗ ਭੀ ਹੈ ਤੇ ਸਭ ਤੋਂ ਵੱਖਰਾ ਭੀ ਹੈ। ਪ੍ਰਭੂ ਸਭ ਕੁਝ ਸਮਝਦਾ ਹੈ, ਵੇਖਦਾ ਹੈ ਤੇ ਪਛਾਣਦਾ ਹੈ, ਉਹ ਆਪ ਹੀ ਇੱਕ ਹੈ ਤੇ ਆਪ ਹੀ ਅਨੇਕ (ਰੂਪ) ਧਾਰ ਰਿਹਾ ਹੈ। ਉਹ ਨਾਹ ਕਦੇ ਮਰਦਾ ਹੈ ਨ ਬਿਨਸਦਾ ਹੈ; ਨਾਹ ਜੰਮਦਾ ਹੈ ਨ ਮਰਦਾ ਹੈ; ਹੇ ਨਾਨਕ! ਪ੍ਰਭੂ ਸਦਾ ਹੀ ਆਪਣੇ ਆਪ ਵਿਚ ਟਿਕਿਆ ਰਹਿੰਦਾ ਹੈ ॥੬॥ ਆਪ ਹੀ ਸਿੱਖਿਆ ਦੇਂਦਾ ਹੈ ਤੇ ਆਪ ਹੀ (ਉਸ ਸਿੱਖਿਆ ਨੂੰ) ਸਮਝਦਾ ਹੈ, ਕਿਉਂਕਿ ਪ੍ਰਭੂ ਆਪ ਹੀ ਸਭ ਜੀਵਾਂ ਦੇ ਨਾਲ ਮਿਲਿਆ ਹੋਇਆ ਹੈ। ਆਪਣਾ ਖਿਲਾਰਾ ਉਸ ਨੇ ਆਪ ਹੀ ਬਣਾਇਆ ਹੈ, (ਜਗਤ ਦੀ) ਹਰੇਕ ਸ਼ੈ ਉਸ ਦੀ ਬਣਾਈ ਹੋਈ ਹੈ, ਉਹ ਬਨਾਉਣ ਜੋਗਾ ਹੈ। ਦੱਸੋ, ਉਸ ਤੋਂ ਵੱਖਰਾ ਕੁਝ ਹੋ ਸਕਦਾ ਹੈ? ਹਰ ਥਾਂ ਉਹ ਪ੍ਰਭੂ ਆਪ ਹੀ (ਮੌਜੂਦ) ਹੈ। ਆਪਣੇ ਖੇਲ ਆਪ ਹੀ ਕਰਨ ਜੋਗਾ ਹੈ, ਬੇਅੰਤ ਰੰਗਾਂ ਦੇ ਤਮਾਸ਼ੇ ਕਰਦਾ ਹੈ। (ਜੀਵਾਂ ਦੇ) ਮਨ ਵਿਚ ਆਪ ਵੱਸ ਰਿਹਾ ਹੈ, (ਜੀਵਾਂ ਨੂੰ) ਆਪਣੇ ਮਨ ਵਿਚ ਟਿਕਾਈ ਬੈਠਾ ਹੈ; ਹੇ ਨਾਨਕ! ਉਸ ਦਾ ਮੁੱਲ ਦੱਸਿਆ ਨਹੀਂ ਜਾ ਸਕਦਾ ॥੭॥ (ਸਭ ਦਾ) ਮਾਲਕ ਪ੍ਰਭੂ ਸਦਾ ਹੀ ਕਾਇਮ ਰਹਿਣ ਵਾਲਾ ਹੈ- ਗੁਰੂ ਦੀ ਮੇਹਰ ਨਾਲ ਕਿਸੇ ਵਿਰਲੇ ਨੇ (ਇਹ ਗੱਲ) ਦੱਸੀ ਹੈ। ਜੋ ਕੁਝ ਉਸ ਨੇ ਬਣਾਇਆ ਹੈ ਉਹ ਭੀ ਮੁਕੰਮਲ ਹੈ (ਭਾਵ, ਅਧੂਰਾ ਨਹੀਂ) ਇਹ ਗੱਲ ਕ੍ਰੋੜਾਂ ਵਿਚੋਂ ਕਿਸੇ ਵਿਰਲੇ ਨੇ ਪਛਾਣੀ ਹੈ। ਤੇਰਾ ਰੂਪ ਕਿਆ ਪਿਆਰਾ ਪਿਆਰਾ ਹੈ! ਹੇ ਅੱਤ ਸੋਹਣੇ, ਬੇਅੰਤ ਤੇ ਬੇ-ਮਿਸਾਲ ਪ੍ਰਭੂ! ਤੇਰੀ ਬੋਲੀ ਭੀ ਮਿੱਠੀ ਮਿੱਠੀ ਹੈ, ਹਰੇਕ ਸਰੀਰ ਵਿਚ ਕੰਨਾਂ ਦੀ ਰਾਹੀਂ ਸੁਣੀ ਜਾ ਰਹੀ ਹੈ, ਤੇ ਜੀਭ ਨਾਲ ਉੱਚਾਰੀ ਜਾ ਰਹੀ ਹੈ (ਭਾਵ, ਹਰੇਕ ਸਰੀਰ ਵਿਚ ਤੂੰ ਆਪ ਹੀ ਬੋਲ ਰਿਹਾ ਹੈਂ)। ਉਹ ਪਵਿਤ੍ਰ ਹੀ ਪਵਿਤ੍ਰ ਹੋ ਜਾਂਦਾ ਹੈ, ਹੇ ਨਾਨਕ! (ਜੋ ਅਜੇਹੇ ਪ੍ਰਭੂ ਦਾ) ਨਾਮ ਪ੍ਰੀਤ ਨਾਲ ਮਨ ਵਿਚ ਜਪਦਾ ਹੈ ॥੮॥੧੨॥ ਜੋ ਮਨੁੱਖ ਸੰਤਾਂ ਦੀ ਸਰਨ ਪੈਂਦਾ ਹੈ, ਉਹ ਮਾਇਆ ਦੇ ਬੰਧਨਾਂ ਤੋਂ ਬਚ ਜਾਂਦਾ ਹੈ; (ਪਰ) ਹੇ ਨਾਨਕ! ਸੰਤਾਂ ਦੀ ਨਿੰਦਿਆ ਕਰਨ ਨਾਲ ਮੁੜ ਮੁੜ ਜੰਮੀਦਾ ਹੈ (ਭਾਵ, ਜਨਮ ਮਰਨ ਦੇ ਚੱਕ੍ਰ ਵਿਚ ਪੈ ਜਾਈਦਾ ਹੈ) ॥੧॥`
      },
      {
        number: 13,
        sanskrit: `ਸਲੋਕੁ ॥
ਸੰਤ ਸਰਨਿ ਜੋ ਜਨੁ ਪਰੈ ਸੋ ਜਨੁ ਉਧਰਨਹਾਰ ॥
ਸੰਤ ਕੀ ਨਿੰਦਾ ਨਾਨਕਾ ਬਹੁਰਿ ਬਹੁਰਿ ਅਵਤਾਰ ॥੧॥
ਅਸਟਪਦੀ ॥
ਸੰਤ ਕੈ ਦੂਖਨਿ ਆਰਜਾ ਘਟੈ ॥
ਸੰਤ ਕੈ ਦੂਖਨਿ ਜਮ ਤੇ ਨਹੀ ਛੁਟੈ ॥
ਸੰਤ ਕੈ ਦੂਖਨਿ ਸੁਖੁ ਸਭੁ ਜਾਇ ॥
ਸੰਤ ਕੈ ਦੂਖਨਿ ਨਰਕ ਮਹਿ ਪਾਇ ॥
ਸੰਤ ਕੈ ਦੂਖਨਿ ਮਤਿ ਹੋਇ ਮਲੀਨ ॥
ਸੰਤ ਕੈ ਦੂਖਨਿ ਸੋਭਾ ਤੇ ਹੀਨ ॥
ਸੰਤ ਕੇ ਹਤੇ ਕਉ ਰਖੈ ਨ ਕੋਇ ॥
ਸੰਤ ਕੈ ਦੂਖਨਿ ਥਾਨ ਭ੍ਰਸਟੁ ਹੋਇ ॥
ਸੰਤ ਕ੍ਰਿਪਾਲ ਕ੍ਰਿਪਾ ਜੇ ਕਰੈ ॥
ਨਾਨਕ ਸੰਤਸੰਗਿ ਨਿੰਦਕੁ ਭੀ ਤਰੈ ॥੧॥
ਸੰਤ ਕੇ ਦੂਖਨ ਤੇ ਮੁਖੁ ਭਵੈ ॥
ਸੰਤਨ ਕੈ ਦੂਖਨਿ ਕਾਗ ਜਿਉ ਲਵੈ ॥
ਸੰਤਨ ਕੈ ਦੂਖਨਿ ਸਰਪ ਜੋਨਿ ਪਾਇ ॥
ਸੰਤ ਕੈ ਦੂਖਨਿ ਤ੍ਰਿਗਦ ਜੋਨਿ ਕਿਰਮਾਇ ॥
ਸੰਤਨ ਕੈ ਦੂਖਨਿ ਤ੍ਰਿਸਨਾ ਮਹਿ ਜਲੈ ॥
ਸੰਤ ਕੈ ਦੂਖਨਿ ਸਭੁ ਕੋ ਛਲੈ ॥
ਸੰਤ ਕੈ ਦੂਖਨਿ ਤੇਜੁ ਸਭੁ ਜਾਇ ॥
ਸੰਤ ਕੈ ਦੂਖਨਿ ਨੀਚੁ ਨੀਚਾਇ ॥
ਸੰਤ ਦੋਖੀ ਕਾ ਥਾਉ ਕੋ ਨਾਹਿ ॥
ਨਾਨਕ ਸੰਤ ਭਾਵੈ ਤਾ ਓਇ ਭੀ ਗਤਿ ਪਾਹਿ ॥੨॥
ਸੰਤ ਕਾ ਨਿੰਦਕੁ ਮਹਾ ਅਤਤਾਈ ॥
ਸੰਤ ਕਾ ਨਿੰਦਕੁ ਖਿਨੁ ਟਿਕਨੁ ਨ ਪਾਈ ॥
ਸੰਤ ਕਾ ਨਿੰਦਕੁ ਮਹਾ ਹਤਿਆਰਾ ॥
ਸੰਤ ਕਾ ਨਿੰਦਕੁ ਪਰਮੇਸੁਰਿ ਮਾਰਾ ॥
ਸੰਤ ਕਾ ਨਿੰਦਕੁ ਰਾਜ ਤੇ ਹੀਨੁ ॥
ਸੰਤ ਕਾ ਨਿੰਦਕੁ ਦੁਖੀਆ ਅਰੁ ਦੀਨੁ ॥
ਸੰਤ ਕੇ ਨਿੰਦਕ ਕਉ ਸਰਬ ਰੋਗ ॥
ਸੰਤ ਕੇ ਨਿੰਦਕ ਕਉ ਸਦਾ ਬਿਜੋਗ ॥
ਸੰਤ ਕੀ ਨਿੰਦਾ ਦੋਖ ਮਹਿ ਦੋਖੁ ॥
ਨਾਨਕ ਸੰਤ ਭਾਵੈ ਤਾ ਉਸ ਕਾ ਭੀ ਹੋਇ ਮੋਖੁ ॥੩॥
ਸੰਤ ਕਾ ਦੋਖੀ ਸਦਾ ਅਪਵਿਤੁ ॥
ਸੰਤ ਕਾ ਦੋਖੀ ਕਿਸੈ ਕਾ ਨਹੀ ਮਿਤੁ ॥
ਸੰਤ ਕੇ ਦੋਖੀ ਕਉ ਡਾਨੁ ਲਾਗੈ ॥
ਸੰਤ ਕੇ ਦੋਖੀ ਕਉ ਸਭ ਤਿਆਗੈ ॥
ਸੰਤ ਕਾ ਦੋਖੀ ਮਹਾ ਅਹੰਕਾਰੀ ॥
ਸੰਤ ਕਾ ਦੋਖੀ ਸਦਾ ਬਿਕਾਰੀ ॥
ਸੰਤ ਕਾ ਦੋਖੀ ਜਨਮੈ ਮਰੈ ॥
ਸੰਤ ਕੀ ਦੂਖਨਾ ਸੁਖ ਤੇ ਟਰੈ ॥
ਸੰਤ ਕੇ ਦੋਖੀ ਕਉ ਨਾਹੀ ਠਾਉ ॥
ਨਾਨਕ ਸੰਤ ਭਾਵੈ ਤਾ ਲਏ ਮਿਲਾਇ ॥੪॥
ਸੰਤ ਕਾ ਦੋਖੀ ਅਧ ਬੀਚ ਤੇ ਟੂਟੈ ॥
ਸੰਤ ਕਾ ਦੋਖੀ ਕਿਤੈ ਕਾਜਿ ਨ ਪਹੂਚੈ ॥
ਸੰਤ ਕੇ ਦੋਖੀ ਕਉ ਉਦਿਆਨ ਭ੍ਰਮਾਈਐ ॥
ਸੰਤ ਕਾ ਦੋਖੀ ਉਝੜਿ ਪਾਈਐ ॥
ਸੰਤ ਕਾ ਦੋਖੀ ਅੰਤਰ ਤੇ ਥੋਥਾ ॥
ਜਿਉ ਸਾਸ ਬਿਨਾ ਮਿਰਤਕ ਕੀ ਲੋਥਾ ॥
ਸੰਤ ਕੇ ਦੋਖੀ ਕੀ ਜੜ ਕਿਛੁ ਨਾਹਿ ॥
ਆਪਨ ਬੀਜਿ ਆਪੇ ਹੀ ਖਾਹਿ ॥
ਸੰਤ ਕੇ ਦੋਖੀ ਕਉ ਅਵਰੁ ਨ ਰਾਖਨਹਾਰੁ ॥
ਨਾਨਕ ਸੰਤ ਭਾਵੈ ਤਾ ਲਏ ਉਬਾਰਿ ॥੫॥
ਸੰਤ ਕਾ ਦੋਖੀ ਇਉ ਬਿਲਲਾਇ ॥
ਜਿਉ ਜਲ ਬਿਹੂਨ ਮਛੁਲੀ ਤੜਫੜਾਇ ॥
ਸੰਤ ਕਾ ਦੋਖੀ ਭੂਖਾ ਨਹੀ ਰਾਜੈ ॥
ਜਿਉ ਪਾਵਕੁ ਈਧਨਿ ਨਹੀ ਧ੍ਰਾਪੈ ॥
ਸੰਤ ਕਾ ਦੋਖੀ ਛੁਟੈ ਇਕੇਲਾ ॥
ਜਿਉ ਬੂਆੜੁ ਤਿਲੁ ਖੇਤ ਮਾਹਿ ਦੁਹੇਲਾ ॥
ਸੰਤ ਕਾ ਦੋਖੀ ਧਰਮ ਤੇ ਰਹਤ ॥
ਸੰਤ ਕਾ ਦੋਖੀ ਸਦ ਮਿਥਿਆ ਕਹਤ ॥
ਕਿਰਤੁ ਨਿੰਦਕ ਕਾ ਧੁਰਿ ਹੀ ਪਇਆ ॥
ਨਾਨਕ ਜੋ ਤਿਸੁ ਭਾਵੈ ਸੋਈ ਥਿਆ ॥੬॥
ਸੰਤ ਕਾ ਦੋਖੀ ਬਿਗੜ ਰੂਪੁ ਹੋਇ ਜਾਇ ॥
ਸੰਤ ਕੇ ਦੋਖੀ ਕਉ ਦਰਗਹ ਮਿਲੈ ਸਜਾਇ ॥
ਸੰਤ ਕਾ ਦੋਖੀ ਸਦਾ ਸਹਕਾਈਐ ॥
ਸੰਤ ਕਾ ਦੋਖੀ ਨ ਮਰੈ ਨ ਜੀਵਾਈਐ ॥
ਸੰਤ ਕੇ ਦੋਖੀ ਕੀ ਪੁਜੈ ਨ ਆਸਾ ॥
ਸੰਤ ਕਾ ਦੋਖੀ ਉਠਿ ਚਲੈ ਨਿਰਾਸਾ ॥
ਸੰਤ ਕੈ ਦੋਖਿ ਨ ਤ੍ਰਿਸਟੈ ਕੋਇ ॥
ਜੈਸਾ ਭਾਵੈ ਤੈਸਾ ਕੋਈ ਹੋਇ ॥
ਪਇਆ ਕਿਰਤੁ ਨ ਮੇਟੈ ਕੋਇ ॥
ਨਾਨਕ ਜਾਨੈ ਸਚਾ ਸੋਇ ॥੭॥
ਸਭ ਘਟ ਤਿਸ ਕੇ ਓਹੁ ਕਰਨੈਹਾਰੁ ॥
ਸਦਾ ਸਦਾ ਤਿਸ ਕਉ ਨਮਸਕਾਰੁ ॥
ਪ੍ਰਭ ਕੀ ਉਸਤਤਿ ਕਰਹੁ ਦਿਨੁ ਰਾਤਿ ॥
ਤਿਸਹਿ ਧਿਆਵਹੁ ਸਾਸਿ ਗਿਰਾਸਿ ॥
ਸਭੁ ਕਛੁ ਵਰਤੈ ਤਿਸ ਕਾ ਕੀਆ ॥
ਜੈਸਾ ਕਰੇ ਤੈਸਾ ਕੋ ਥੀਆ ॥
ਅਪਨਾ ਖੇਲੁ ਆਪਿ ਕਰਨੈਹਾਰੁ ॥
ਦੂਸਰ ਕਉਨੁ ਕਹੈ ਬੀਚਾਰੁ ॥
ਜਿਸ ਨੋ ਕ੍ਰਿਪਾ ਕਰੈ ਤਿਸੁ ਆਪਨ ਨਾਮੁ ਦੇਇ ॥
ਬਡਭਾਗੀ ਨਾਨਕ ਜਨ ਸੇਇ ॥੮॥੧੩॥
ਸਲੋਕੁ ॥
ਤਜਹੁ ਸਿਆਨਪ ਸੁਰਿ ਜਨਹੁ ਸਿਮਰਹੁ ਹਰਿ ਹਰਿ ਰਾਇ ॥
ਏਕ ਆਸ ਹਰਿ ਮਨਿ ਰਖਹੁ ਨਾਨਕ ਦੂਖੁ ਭਰਮੁ ਭਉ ਜਾਇ ॥੧॥`,
        transliteration: `salok |
sant saran jo jan parai so jan udharanahaar |
sant kee nindaa naanakaa bahur bahur avataar |1|
asattapadee |
sant kai dookhan aarajaa ghattai |
sant kai dookhan jam te nahee chhuttai |
sant kai dookhan sukh sabh jaae |
sant kai dookhan narak meh paae |
sant kai dookhan mat hoe maleen |
sant kai dookhan sobhaa te heen |
sant ke hate kau rakhai na koe |
sant kai dookhan thaan bhrasatt hoe |
sant kripaal kripaa je karai |
naanak santasang nindak bhee tarai |1|
sant ke dookhan te mukh bhavai |
santan kai dookhan kaag jiau lavai |
santan kai dookhan sarap jon paae |
sant kai dookhan trigad jon kiramaae |
santan kai dookhan trisanaa meh jalai |
sant kai dookhan sabh ko chhalai |
sant kai dookhan tej sabh jaae |
sant kai dookhan neech neechaae |
sant dokhee kaa thaau ko naeh |
naanak sant bhaavai taa oe bhee gat paeh |2|
sant kaa nindak mahaa atataaee |
sant kaa nindak khin ttikan na paaee |
sant kaa nindak mahaa hatiaaraa |
sant kaa nindak paramesur maaraa |
sant kaa nindak raaj te heen |
sant kaa nindak dukheea ar deen |
sant ke nindak kau sarab rog |
sant ke nindak kau sadaa bijog |
sant kee nindaa dokh meh dokh |
naanak sant bhaavai taa us kaa bhee hoe mokh |3|
sant kaa dokhee sadaa apavit |
sant kaa dokhee kisai kaa nahee mit |
sant ke dokhee kau ddaan laagai |
sant ke dokhee kau sabh tiaagai |
sant kaa dokhee mahaa ahankaaree |
sant kaa dokhee sadaa bikaaree |
sant kaa dokhee janamai marai |
sant kee dookhanaa sukh te ttarai |
sant ke dokhee kau naahee tthaau |
naanak sant bhaavai taa le milaae |4|
sant kaa dokhee adh beech te ttoottai |
sant kaa dokhee kitai kaaj na pahoochai |
sant ke dokhee kau udiaan bhramaaeeai |
sant kaa dokhee ujharr paaeeai |
sant kaa dokhee antar te thothaa |
jiau saas binaa miratak kee lothaa |
sant ke dokhee kee jarr kichh naeh |
aapan beej aape hee khaeh |
sant ke dokhee kau avar na raakhanahaar |
naanak sant bhaavai taa le ubaar |5|
sant kaa dokhee iau bilalaae |
jiau jal bihoon machhulee tarrafarraae |
sant kaa dokhee bhookhaa nahee raajai |
jiau paavak eedhan nahee dhraapai |
sant kaa dokhee chhuttai ikelaa |
jiau booaarr til khet maeh duhelaa |
sant kaa dokhee dharam te rehat |
sant kaa dokhee sad mithiaa kehat |
kirat nindak kaa dhur hee peaa |
naanak jo tis bhaavai soee thiaa |6|
sant kaa dokhee bigarr roop hoe jaae |
sant ke dokhee kau daragah milai sajaae |
sant kaa dokhee sadaa sahakaaeeai |
sant kaa dokhee na marai na jeevaaeeai |
sant ke dokhee kee pujai na aasaa |
sant kaa dokhee utth chalai niraasaa |
sant kai dokh na trisattai koe |
jaisaa bhaavai taisaa koee hoe |
peaa kirat na mettai koe |
naanak jaanai sachaa soe |7|
sabh ghatt tis ke ohu karanaihaar |
sadaa sadaa tis kau namasakaar |
prabh kee usatat karahu din raat |
tiseh dhiaavahu saas giraas |
sabh kachh varatai tis kaa keea |
jaisaa kare taisaa ko theea |
apanaa khel aap karanaihaar |
doosar kaun kahai beechaar |
jis no kripaa karai tis aapan naam dee |
baddabhaagee naanak jan see |8|13|
salok |
tajahu siaanap sur janahu simarahu har har raae |
ek aas har man rakhahu naanak dookh bharam bhau jaae |1|`,
        meaning: `Salok: One who seeks the Sanctuary of the Saints shall be saved. One who slanders the Saints, O Nanak, shall be reincarnated over and over again. ||1|| Ashtapadee: Slandering the Saints, one's life is cut short. Slandering the Saints, one shall not escape the Messenger of Death. Slandering the Saints, all happiness vanishes. Slandering the Saints, one falls into hell. Slandering the Saints, the intellect is polluted. Slandering the Saints, one's reputation is lost. One who is cursed by a Saint cannot be saved. Slandering the Saints, one's place is defiled. But if the Compassionate Saint shows His Kindness, O Nanak, in the Company of the Saints, the slanderer may still be saved. ||1|| Slandering the Saints, one becomes a wry-faced malcontent. Slandering the Saints, one croaks like a raven. Slandering the Saints, one is reincarnated as a snake. Slandering the Saints, one is reincarnated as a wiggling worm. Slandering the Saints, one burns in the fire of desire. Slandering the Saints, one tries to deceive everyone. Slandering the Saints, all one's influence vanishes. Slandering the Saints, one becomes the lowest of the low. For the slanderer of the Saint, there is no place of rest. O Nanak, if it pleases the Saint, even then, he may be saved. ||2|| The slanderer of the Saint is the worst evil-doer. The slanderer of the Saint has not even a moment's rest. The slanderer of the Saint is a brutal butcher. The slanderer of the Saint is cursed by the Transcendent Lord. The slanderer of the Saint has no kingdom. The slanderer of the Saint becomes miserable and poor. The slanderer of the Saint contracts all diseases. The slanderer of the Saint is forever separated. To slander a Saint is the worst sin of sins. O Nanak, if it pleases the Saint, then even this one may be liberated. ||3|| The slanderer of the Saint is forever impure. The slanderer of the Saint is nobody's friend. The slanderer of the Saint shall be punished. The slanderer of the Saint is abandoned by all. The slanderer of the Saint is totally egocentric. The slanderer of the Saint is forever corrupt. The slanderer of the Saint must endure birth and death. The slanderer of the Saint is devoid of peace. The slanderer of the Saint has no place of rest. O Nanak, if it pleases the Saint, then even such a one may merge in union. ||4|| The slanderer of the Saint breaks down mid-way. The slanderer of the Saint cannot accomplish his tasks. The slanderer of the Saint wanders in the wilderness. The slanderer of the Saint is misled into desolation. The slanderer of the Saint is empty inside, like the corpse of a dead man, without the breath of life. The slanderer of the Saint has no heritage at all. He himself must eat what he has planted. The slanderer of the Saint cannot be saved by anyone else. O Nanak, if it pleases the Saint, then even he may be saved. ||5|| The slanderer of the Saint bewails like this like a fish, out of water, writhing in agony. The slanderer of the Saint is hungry and is never satisfied, as fire is not satisfied by fuel. The slanderer of the Saint is left all alone, like the miserable barren sesame stalk abandoned in the field. The slanderer of the Saint is devoid of faith. The slanderer of the Saint constantly lies. The fate of the slanderer is pre-ordained from the very beginning of time. O Nanak, whatever pleases God's Will comes to pass. ||6|| The slanderer of the Saint becomes deformed. The slanderer of the Saint receives his punishment in the Court of the Lord. The slanderer of the Saint is eternally in limbo. He does not die, but he does not live either. The hopes of the slanderer of the Saint are not fulfilled. The slanderer of the Saint departs disappointed. Slandering the Saint, no one attains satisfaction. As it pleases the Lord, so do people become; no one can erase their past actions. O Nanak, the True Lord alone knows all. ||7|| All hearts are His; He is the Creator. Forever and ever, I bow to Him in reverence. Praise God, day and night. Meditate on Him with every breath and morsel of food. Everything happens as He wills. As He wills, so people become. He Himself is the play, and He Himself is the actor. Who else can speak or deliberate upon this? He Himself gives His Name to those, upon whom He bestows His Mercy. Very fortunate, O Nanak, are those people. ||8||13|| Salok: Give up your cleverness, good people - remember the Lord God, your King! Enshrine in your heart, your hopes in the One Lord. O Nanak, your pain, doubt and fear shall depart. ||1||`,
        meaning_pa: `ਜੋ ਮਨੁੱਖ ਸੰਤਾਂ ਦੀ ਸਰਨ ਪੈਂਦਾ ਹੈ, ਉਹ ਮਾਇਆ ਦੇ ਬੰਧਨਾਂ ਤੋਂ ਬਚ ਜਾਂਦਾ ਹੈ; (ਪਰ) ਹੇ ਨਾਨਕ! ਸੰਤਾਂ ਦੀ ਨਿੰਦਿਆ ਕਰਨ ਨਾਲ ਮੁੜ ਮੁੜ ਜੰਮੀਦਾ ਹੈ (ਭਾਵ, ਜਨਮ ਮਰਨ ਦੇ ਚੱਕ੍ਰ ਵਿਚ ਪੈ ਜਾਈਦਾ ਹੈ) ॥੧॥ ਸੰਤ ਦੀ ਨਿੰਦਿਆ ਕਰਨ ਨਾਲ (ਮਨੁੱਖ ਦੀ) ਉਮਰ (ਵਿਅਰਥ ਹੀ) ਗੁਜ਼ਰਦੀ ਜਾਂਦੀ ਹੈ, (ਕਿਉਂਕਿ) ਸੰਤ ਦੀ ਨਿੰਦਿਆ ਕੀਤਿਆਂ ਮਨੁੱਖ ਜਮਾਂ ਤੋਂ ਬਚ ਨਹੀਂ ਸਕਦਾ। ਸੰਤ ਦੀ ਨਿੰਦਿਆ ਕੀਤਿਆਂ ਸਾਰਾ (ਹੀ) ਸੁਖ (ਨਾਸ ਹੋ) ਜਾਂਦਾ ਹੈ, ਅਤੇ ਮਨੁੱਖ ਨਰਕ ਵਿਚ (ਭਾਵ, ਘੋਰ ਦੁਖਾਂ ਵਿਚ) ਪੈ ਜਾਂਦਾ ਹੈ। ਸੰਤ ਦੀ ਨਿੰਦਿਆ ਕਰਨ ਨਾਲ (ਮਨੁੱਖ ਦੀ) ਮਤਿ ਮੈਲੀ ਹੋ ਜਾਂਦੀ ਹੈ, ਤੇ (ਜਗਤ ਵਿਚ) ਮਨੁੱਖ ਸੋਭਾ ਤੋਂ ਸੱਖਣਾ ਰਹਿ ਜਾਂਦਾ ਹੈ। ਸੰਤ ਦੇ ਫਿਟਕਾਰੇ ਹੋਏ ਬੰਦੇ ਦੀ ਕੋਈ ਮਨੁੱਖ ਸਹੈਤਾ ਨਹੀਂ ਕਰ ਸਕਦਾ, (ਕਿਉਂਕਿ) ਸੰਤ ਦੀ ਨਿੰਦਾ ਕੀਤਿਆਂ (ਨਿੰਦਕ ਦਾ) ਹਿਰਦਾ ਗੰਦਾ ਹੋ ਜਾਂਦਾ ਹੈ। (ਪਰ) ਜੇ ਕ੍ਰਿਪਾਲ ਸੰਤ ਆਪ ਕਿਰਪਾ ਕਰੇ, ਤਾਂ ਹੇ ਨਾਨਕ! ਸੰਤ ਦੀ ਸੰਗਤਿ ਵਿਚ ਨਿੰਦਕ ਭੀ (ਪਾਪਾਂ ਤੋਂ) ਬਚ ਜਾਂਦਾ ਹੈ ॥੧॥ ਸੰਤ ਦੀ ਨਿੰਦਾ ਕਰਨ ਨਾਲ (ਨਿੰਦਕ ਦਾ) ਚੇਹਰਾ ਹੀ ਭ੍ਰਸ਼ਟਿਆ ਜਾਂਦਾ ਹੈ, (ਤੇ ਨਿੰਦਕ) (ਥਾਂ ਥਾਂ) ਕਾਂ ਵਾਂਗ ਲਉਂ ਲਉਂ ਕਰਦਾ ਹੈ (ਨਿੰਦਾ ਦੇ ਬਚਨ ਬੋਲਦਾ ਫਿਰਦਾ ਹੈ)। ਸੰਤ ਦੀ ਨਿੰਦਾ ਕੀਤਿਆਂ (ਖੋਟਾ ਸੁਭਾਉ ਬਣ ਜਾਣ ਤੇ) ਮਨੁੱਖ ਸੱਪ ਦੀ ਜੂਨੇ ਜਾ ਪੈਂਦਾ ਹੈ, ਤੇ, ਕਿਰਮ ਆਦਿਕ ਨਿੱਕੀਆਂ ਜੂਨਾਂ ਵਿਚ (ਭਟਕਦਾ ਹੈ)। ਸੰਤ ਦੀ ਨਿੰਦਿਆ ਦੇ ਕਾਰਨ (ਨਿੰਦਕ) ਤ੍ਰਿਸਨਾ (ਦੀ ਅੱਗ) ਵਿਚ ਸੜਦਾ ਭੁੱਜਦਾ ਹੈ, ਤੇ, ਹਰੇਕ ਮਨੁੱਖ ਨੂੰ ਧੋਖਾ ਦੇਂਦਾ ਫਿਰਦਾ ਹੈ। ਸੰਤ ਦੀ ਨਿੰਦਿਆ ਕੀਤਿਆਂ ਮਨੁੱਖ ਦਾ ਸਾਰਾ ਤੇਜ ਪ੍ਰਤਾਪ ਹੀ ਨਸ਼ਟ ਹੋ ਜਾਂਦਾ ਹੈ, ਅਤੇ (ਨਿੰਦਕ) ਮਹਾ ਨੀਚ ਬਣ ਜਾਂਦਾ ਹੈ। ਸੰਤਾਂ ਦੀ ਨਿੰਦਾ ਕਰਨ ਵਾਲਿਆਂ ਦਾ ਕੋਈ ਆਸਰਾ ਨਹੀਂ ਰਹਿੰਦਾ; (ਹਾਂ) ਹੇ ਨਾਨਕ! ਜੇ ਸੰਤਾਂ ਨੂੰ ਭਾਵੇ ਤਾਂ ਉਹ ਨਿੰਦਕ ਭੀ ਚੰਗੀ ਅਵਸਥਾ ਤੇ ਅੱਪੜ ਜਾਂਦੇ ਹਨ ॥੨॥ ਸੰਤ ਦੀ ਨਿੰਦਿਆ ਕਰਨ ਵਾਲਾ ਸਦਾ ਅੱਤ ਚੁੱਕੀ ਰੱਖਦਾ ਹੈ, ਤੇ ਇਕ ਪਲਕ ਭਰ ਭੀ (ਅੱਤ ਚੁੱਕਣ ਵਲੋਂ) ਆਰਾਮ ਨਹੀਂ ਲੈਂਦਾ। ਸੰਤ ਦਾ ਨਿੰਦਕ ਵੱਡਾ ਜ਼ਾਲਮ ਬਣ ਜਾਂਦਾ ਹੈ, ਤੇ ਰੱਬ ਵਲੋਂ ਫਿਟਕਾਰਿਆ ਜਾਂਦਾ ਹੈ। ਸੰਤ ਦਾ ਨਿੰਦਕ ਰਾਜ (ਭਾਵ, ਦੁਨੀਆ ਦੇ ਸੁਖਾਂ) ਤੋਂ ਵਾਂਜਿਆਂ ਰਹਿੰਦਾ ਹੈ, (ਸਦਾ) ਦੁਖੀ ਤੇ ਆਤੁਰ ਰਹਿੰਦਾ ਹੈ। ਸੰਤਾਂ ਦੀ ਨਿੰਦਿਆ ਕਰਨ ਵਾਲੇ ਨੂੰ ਸਾਰੇ ਰੋਗ ਵਿਆਪਦੇ ਹਨ, (ਕਿਉਂਕਿ) ਉਸ ਨੂੰ (ਸੁਖਾਂ ਦੇ ਸੋਮੇ ਪ੍ਰਭੂ ਤੋਂ) ਸਦਾ ਵਿਛੋੜਾ ਰਹਿੰਦਾ ਹੈ। ਸੰਤਾਂ ਦੀ ਨਿੰਦਿਆ ਕਰਨੀ ਬਹੁਤ ਹੀ ਮਾੜਾ ਕੰਮ ਹੈ। ਹੇ ਨਾਨਕ! ਜੇ ਸੰਤਾਂ ਨੂੰ ਭਾਵੇ ਤਾਂ ਉਸ (ਨਿੰਦਕ) ਦਾ ਭੀ (ਨਿੰਦਿਆ ਤੋਂ) ਛੁਟਕਾਰਾ ਹੋ ਜਾਂਦਾ ਹੈ ॥੩॥ ਸੰਤ ਦਾ ਨਿੰਦਕ ਸਦਾ ਮੈਲੇ ਮਨ ਵਾਲਾ ਹੈ, (ਤਾਹੀਏਂ) ਉਹ (ਕਦੇ) ਕਿਸੇ ਦਾ ਸੱਜਣ ਨਹੀਂ ਬਣਦਾ। (ਅੰਤ ਵੇਲੇ) ਸੰਤ ਦੇ ਨਿੰਦਕ ਨੂੰ (ਧਰਮਰਾਜ ਤੋਂ) ਸਜ਼ਾ ਮਿਲਦੀ ਹੈ, ਤੇ ਸਾਰੇ ਉਸ ਦਾ ਸਾਥ ਛੱਡ ਜਾਂਦੇ ਹਨ। ਸੰਤ ਦੀ ਨਿੰਦਿਆ ਕਰਨ ਵਾਲਾ ਬੜਾ ਆਕੜ-ਖਾਨ ਬਣ ਜਾਂਦਾ ਹੈ, ਤੇ ਸਦਾ ਮੰਦੇ ਕੰਮ ਕਰਦਾ ਹੈ। (ਇਹਨੀਂ ਔਗੁਣੀਂ) ਸੰਤ ਦਾ ਨਿੰਦਕ ਜੰਮਦਾ ਮਰਦਾ ਰਹਿੰਦਾ ਹੈ, ਤੇ ਸੰਤ ਦੀ ਨਿੰਦਿਆ ਦੇ ਕਾਰਨ ਸੁਖਾਂ ਤੋਂ ਵਾਂਜਿਆ ਜਾਂਦਾ ਹੈ। ਸੰਤ ਦੇ ਨਿੰਦਕ ਨੂੰ ਕੋਈ ਸਹਾਰਾ ਨਹੀਂ ਮਿਲਦਾ, (ਪਰ ਹਾਂ), ਹੇ ਨਾਨਕ! ਜੇ ਸੰਤ ਚਾਹੇ ਤਾਂ ਆਪਣੇ ਨਾਲ ਉਸ (ਨਿੰਦਕ) ਨੂੰ ਮਿਲਾ ਲੈਂਦਾ ਹੈ ॥੪॥ ਸੰਤ ਦੀ ਨਿੰਦਿਆ ਕਰਨ ਵਾਲਾ ਅੱਧ ਵਿਚੋਂ ਹੀ ਰਹਿ ਜਾਂਦਾ ਹੈ, ਕਿਸੇ ਕੰਮ ਵਿਚ ਨੇਪਰੇ ਨਹੀਂ ਚੜ੍ਹਦਾ। ਸੰਤ ਦੇ ਨਿੰਦਕ ਨੂੰ, (ਮਾਨੋ) ਜੰਗਲਾਂ ਵਿਚ ਖ਼ੁਆਰ ਕਰੀਦਾ ਹੈ, ਤੇ (ਰਾਹੋਂ ਖੁੰਝਾ ਕੇ) ਔੜਦੇ ਪਾ ਦੇਈਦਾ ਹੈ। ਸੰਤ ਦਾ ਨਿੰਦਕ ਅੰਦਰੋਂ (ਅਸਲੀ ਜ਼ਿੰਦਗੀ ਤੋਂ ਜੋ ਮਨੁੱਖ ਦਾ ਆਧਾਰ ਹੈ) ਖ਼ਾਲੀ ਹੁੰਦਾ ਹੈ, ਜਿਵੇਂ ਪ੍ਰਾਣਾਂ ਤੋਂ ਬਿਨਾ ਮੁਰਦਾ ਲੋਥ ਹੈ। ਸੰਤ ਦੇ ਨਿੰਦਕਾਂ ਦੀ (ਨੇਕ ਕਮਾਈ ਤੇ ਸਿਮਰਨ ਵਾਲੀ) ਕੋਈ ਪੱਕੀ ਨੀਂਹ ਨਹੀਂ ਹੁੰਦੀ, ਆਪ ਹੀ (ਨਿੰਦਿਆ ਦੀ) ਕਮਾਈ ਕਰ ਕੇ ਆਪ ਹੀ (ਉਸ ਦਾ ਮੰਦਾ ਫਲ) ਖਾਂਦੇ ਹਨ। ਸੰਤ ਦੀ ਨਿੰਦਿਆ ਕਰਨ ਵਾਲੇ ਨੂੰ ਕੋਈ ਹੋਰ ਮਨੁੱਖ (ਨਿੰਦਿਆ ਦੀ ਵਾਦੀ ਤੋਂ) ਬਚਾ ਨਹੀਂ ਸਕਦਾ, (ਪਰ) ਹੇ ਨਾਨਕ! ਜੇ ਸੰਤ ਚਾਹੇ ਤਾਂ (ਨਿੰਦਕ ਨੂੰ ਨਿੰਦਿਆ ਦੇ ਸੁਭਾਉ ਤੋਂ) ਬਚਾ ਸਕਦਾ ਹੈ ॥੫॥ ਸੰਤ ਦਾ ਨਿੰਦਕ ਇਉਂ ਵਿਲਕਦਾ ਹੈ, ਜਿਵੇਂ ਪਾਣੀ ਤੋਂ ਬਿਨਾ ਮੱਛੀ ਤੜਫ਼ਦੀ ਹੈ। ਸੰਤ ਦਾ ਨਿੰਦਕ ਤ੍ਰਿਸ਼ਨਾ ਦਾ ਮਾਰਿਆ ਹੋਇਆ ਕਦੇ ਰੱਜਦਾ ਨਹੀਂ, ਜਿਵੇਂ ਅੱਗ ਬਾਲਣ ਨਾਲ ਨਹੀਂ ਰੱਜਦੀ (ਭਾਵ, ਸੰਤ ਦੀ ਸੋਭਾ ਦਾ ਸੜਿਆ ਹੋਇਆ ਈਰਖਾ ਦੇ ਕਾਰਨ ਨਿੰਦਿਆ ਕਰਦਾ ਹੈ ਤੇ ਇਹ ਈਰਖਾ ਘਟਦੀ ਨਹੀਂ)। ਸੰਤ ਦਾ ਨਿੰਦਕ ਭੀ ਇਕੱਲਾ ਛੁੱਟੜ ਪਿਆ ਰਹਿੰਦਾ ਹੈ (ਕੋਈ ਉਸ ਦੇ ਨੇੜੇ ਨਹੀਂ ਆਉਂਦਾ), ਜਿਵੇਂ ਅੰਦਰੋਂ ਸੜਿਆ ਹੋਇਆ ਤਿਲ ਦਾ ਬੂਟਾ ਪੈਲੀ ਵਿਚ ਹੀ ਨਿਮਾਣਾ ਪਿਆ ਰਹਿੰਦਾ ਹੈ। ਸੰਤ ਦਾ ਨਿੰਦਕ ਧਰਮੋਂ ਹੀਣ ਹੁੰਦਾ ਹੈ, ਤੇ ਸਦਾ ਝੂਠ ਬੋਲਦਾ ਹੈ। (ਪਰ) ਪਹਿਲੀ ਕੀਤੀ ਹੋਈ ਨਿੰਦਿਆ ਦਾ ਇਹ ਫਲ (-ਰੂਪ ਸੁਭਾਉ) ਨਿੰਦਕ ਦਾ ਮੁੱਢ ਤੋਂ ਹੀ (ਜਦੋਂ ਉਸ ਨਿੰਦਿਆ ਦਾ ਕੰਮ ਫੜਿਆ) ਤੁਰਿਆ ਆ ਰਿਹਾ ਹੈ (ਸੋ, ਉਸ ਸੁਭਾਉ ਦੇ ਕਾਰਣ ਵਿਚਾਰਾ ਹੋਰ ਕਰੇ ਭੀ ਕੀਹ?) ਹੇ ਨਾਨਕ! (ਇਹ ਮਾਲਕ ਦੀ ਰਜ਼ਾ ਹੈ) ਜੋ ਉਸ ਨੂੰ ਚੰਗਾ ਲੱਗਦਾ ਹੈ ਉਹੀ ਹੁੰਦਾ ਹੈ ॥੬॥ ਸੰਤਾਂ ਦੀ ਨਿੰਦਿਆ ਕਰਨ ਵਾਲਾ ਭ੍ਰਿਸ਼ਟਿਆ ਜਾਂਦਾ ਹੈ, ਪ੍ਰਭੂ ਦੀ ਦਰਗਾਹ ਵਿਚ ਉਸ ਨੂੰ ਸਜ਼ਾ ਮਿਲਦੀ ਹੈ। ਸੰਤਾਂ ਦਾ ਨਿੰਦਕ ਸਦਾ ਆਤੁਰ ਰਹਿੰਦਾ ਹੈ, ਨਾਹ ਉਹ ਜੀਊਂਦਿਆਂ ਵਿਚ ਤੇ ਨਾਹ ਮੋਇਆਂ ਵਿਚ ਹੁੰਦਾ ਹੈ। ਸੰਤ ਦੇ ਨਿੰਦਕ ਦੀ ਆਸ ਕਦੇ ਸਿਰੇ ਨਹੀਂ ਚੜ੍ਹਦੀ, ਜਗਤ ਤੋਂ ਨਿਰਾਸ ਹੀ ਚੱਲ ਜਾਂਦਾ (ਭਲਾ, ਸੰਤਾਂ ਵਾਲੀ ਸੋਭਾ ਉਸ ਨੂੰ ਕਿਵੇਂ ਮਿਲੇ?)। ਸੰਤ ਦੀ ਨਿੰਦਿਆ ਕਰਨ ਨਾਲ ਕੋਈ ਮਨੁੱਖ (ਨਿੰਦਿਆ ਦੀ) ਇਸ ਤ੍ਰੇਹ ਤੋਂ ਬਚਦਾ ਨਹੀਂ। ਜਿਹੋ ਜਿਹੀ ਮਨੁੱਖ ਦੀ ਨੀਅਤ ਹੁੰਦੀ ਹੈ, ਤਿਹੋ ਜਿਹਾ ਉਸ ਦਾ ਸੁਭਾਉ ਬਣ ਜਾਂਦਾ ਹੈ। (ਬਚੇ ਭੀ ਕਿਵੇਂ?) ਪਿਛਲੀ ਕੀਤੀ (ਮੰਦ) ਕਮਾਈ ਦੇ ਇਕੱਠੇ ਹੋਏ (ਸੁਭਾਉ-ਰੂਪ) ਫਲ ਨੂੰ ਕੋਈ ਮਿਟਾ ਨਹੀਂ ਸਕਦਾ। ਹੇ ਨਾਨਕ! (ਇਸ ਭੇਤ ਨੂੰ) ਉਹ ਸੱਚਾ ਪ੍ਰਭੂ ਜਾਣਦਾ ਹੈ ॥੭॥ ਸਾਰੇ ਜੀਅ ਜੰਤ ਉਸ ਪ੍ਰਭੂ ਦੇ ਹਨ, ਉਹੀ ਸਭ ਕੁਝ ਕਰਨ ਦੇ ਸਮਰੱਥ ਹੈ, ਸਦਾ ਉਸ ਪ੍ਰਭੂ ਅੱਗੇ ਸਿਰ ਨਿਵਾਓ। ਦਿਨ ਰਾਤਿ ਪ੍ਰਭੂ ਦੇ ਗੁਣ ਗਾਓ, ਦਮ-ਬ-ਦਮ ਉਸੇ ਨੂੰ ਯਾਦ ਕਰੋ। (ਜਗਤ ਵਿਚ) ਹਰੇਕ ਖੇਡ ਉਸੇ ਦੀ ਵਰਤਾਈ ਵਰਤ ਰਹੀ ਹੈ, ਪ੍ਰਭੂ (ਜੀਵ ਨੂੰ) ਜਿਹੋ ਜਿਹਾ ਬਣਾਉਂਦਾ ਹੈ ਉਹੋ ਜਿਹਾ ਹਰੇਕ ਜੀਵ ਬਣ ਜਾਂਦਾ ਹੈ। (ਜਗਤ-ਰੂਪ) ਆਪਣੀ ਖੇਡ ਆਪ ਹੀ ਕਰਨ ਜੋਗਾ ਹੈ। ਕੌਣ ਕੋਈ ਦੂਜਾ ਸਲਾਹ ਦੱਸ ਸਕਦਾ ਹੈ? ਜਿਸ ਜਿਸ ਜੀਵ ਉਤੇ ਮੇਹਰ ਕਰਦਾ ਹੈ ਉਸ ਉਸ ਨੂੰ ਆਪਣਾ ਨਾਮ ਬਖ਼ਸ਼ਦਾ ਹੈ; (ਤੇ) ਹੇ ਨਾਨਕ! ਉਹ ਮਨੁੱਖ ਵੱਡੇ ਭਾਗਾਂ ਵਾਲੇ ਹੋ ਜਾਂਦੇ ਹਨ ॥੮॥੧੩॥ ਹੇ ਭਲੇ ਮਨੁੱਖੋ! ਚਤੁਰਾਈ ਛੱਡੋ ਤੇ ਅਕਾਲ ਪੁਰਖ ਨੂੰ ਸਿਮਰੋ; ਕੇਵਲ ਪ੍ਰਭੂ ਦੀ ਆਸ ਮਨ ਵਿਚ ਰੱਖੋ। ਹੇ ਨਾਨਕ! (ਇਸ ਤਰ੍ਹਾਂ) ਦੁੱਖ ਵਹਮ ਤੇ ਡਰ ਦੂਰ ਹੋ ਜਾਂਦਾ ਹੈ ॥੧॥`
      },
      {
        number: 14,
        sanskrit: `ਸਲੋਕੁ ॥
ਤਜਹੁ ਸਿਆਨਪ ਸੁਰਿ ਜਨਹੁ ਸਿਮਰਹੁ ਹਰਿ ਹਰਿ ਰਾਇ ॥
ਏਕ ਆਸ ਹਰਿ ਮਨਿ ਰਖਹੁ ਨਾਨਕ ਦੂਖੁ ਭਰਮੁ ਭਉ ਜਾਇ ॥੧॥
ਅਸਟਪਦੀ ॥
ਮਾਨੁਖ ਕੀ ਟੇਕ ਬ੍ਰਿਥੀ ਸਭ ਜਾਨੁ ॥
ਦੇਵਨ ਕਉ ਏਕੈ ਭਗਵਾਨੁ ॥
ਜਿਸ ਕੈ ਦੀਐ ਰਹੈ ਅਘਾਇ ॥
ਬਹੁਰਿ ਨ ਤ੍ਰਿਸਨਾ ਲਾਗੈ ਆਇ ॥
ਮਾਰੈ ਰਾਖੈ ਏਕੋ ਆਪਿ ॥
ਮਾਨੁਖ ਕੈ ਕਿਛੁ ਨਾਹੀ ਹਾਥਿ ॥
ਤਿਸ ਕਾ ਹੁਕਮੁ ਬੂਝਿ ਸੁਖੁ ਹੋਇ ॥
ਤਿਸ ਕਾ ਨਾਮੁ ਰਖੁ ਕੰਠਿ ਪਰੋਇ ॥
ਸਿਮਰਿ ਸਿਮਰਿ ਸਿਮਰਿ ਪ੍ਰਭੁ ਸੋਇ ॥
ਨਾਨਕ ਬਿਘਨੁ ਨ ਲਾਗੈ ਕੋਇ ॥੧॥
ਉਸਤਤਿ ਮਨ ਮਹਿ ਕਰਿ ਨਿਰੰਕਾਰ ॥
ਕਰਿ ਮਨ ਮੇਰੇ ਸਤਿ ਬਿਉਹਾਰ ॥
ਨਿਰਮਲ ਰਸਨਾ ਅੰਮ੍ਰਿਤੁ ਪੀਉ ॥
ਸਦਾ ਸੁਹੇਲਾ ਕਰਿ ਲੇਹਿ ਜੀਉ ॥
ਨੈਨਹੁ ਪੇਖੁ ਠਾਕੁਰ ਕਾ ਰੰਗੁ ॥
ਸਾਧਸੰਗਿ ਬਿਨਸੈ ਸਭ ਸੰਗੁ ॥
ਚਰਨ ਚਲਉ ਮਾਰਗਿ ਗੋਬਿੰਦ ॥
ਮਿਟਹਿ ਪਾਪ ਜਪੀਐ ਹਰਿ ਬਿੰਦ ॥
ਕਰ ਹਰਿ ਕਰਮ ਸ੍ਰਵਨਿ ਹਰਿ ਕਥਾ ॥
ਹਰਿ ਦਰਗਹ ਨਾਨਕ ਊਜਲ ਮਥਾ ॥੨॥
ਬਡਭਾਗੀ ਤੇ ਜਨ ਜਗ ਮਾਹਿ ॥
ਸਦਾ ਸਦਾ ਹਰਿ ਕੇ ਗੁਨ ਗਾਹਿ ॥
ਰਾਮ ਨਾਮ ਜੋ ਕਰਹਿ ਬੀਚਾਰ ॥
ਸੇ ਧਨਵੰਤ ਗਨੀ ਸੰਸਾਰ ॥
ਮਨਿ ਤਨਿ ਮੁਖਿ ਬੋਲਹਿ ਹਰਿ ਮੁਖੀ ॥
ਸਦਾ ਸਦਾ ਜਾਨਹੁ ਤੇ ਸੁਖੀ ॥
ਏਕੋ ਏਕੁ ਏਕੁ ਪਛਾਨੈ ॥
ਇਤ ਉਤ ਕੀ ਓਹੁ ਸੋਝੀ ਜਾਨੈ ॥
ਨਾਮ ਸੰਗਿ ਜਿਸ ਕਾ ਮਨੁ ਮਾਨਿਆ ॥
ਨਾਨਕ ਤਿਨਹਿ ਨਿਰੰਜਨੁ ਜਾਨਿਆ ॥੩॥
ਗੁਰ ਪ੍ਰਸਾਦਿ ਆਪਨ ਆਪੁ ਸੁਝੈ ॥
ਤਿਸ ਕੀ ਜਾਨਹੁ ਤ੍ਰਿਸਨਾ ਬੁਝੈ ॥
ਸਾਧਸੰਗਿ ਹਰਿ ਹਰਿ ਜਸੁ ਕਹਤ ॥
ਸਰਬ ਰੋਗ ਤੇ ਓਹੁ ਹਰਿ ਜਨੁ ਰਹਤ ॥
ਅਨਦਿਨੁ ਕੀਰਤਨੁ ਕੇਵਲ ਬਖੵਾਨੁ ॥
ਗ੍ਰਿਹਸਤ ਮਹਿ ਸੋਈ ਨਿਰਬਾਨੁ ॥
ਏਕ ਊਪਰਿ ਜਿਸੁ ਜਨ ਕੀ ਆਸਾ ॥
ਤਿਸ ਕੀ ਕਟੀਐ ਜਮ ਕੀ ਫਾਸਾ ॥
ਪਾਰਬ੍ਰਹਮ ਕੀ ਜਿਸੁ ਮਨਿ ਭੂਖ ॥
ਨਾਨਕ ਤਿਸਹਿ ਨ ਲਾਗਹਿ ਦੂਖ ॥੪॥
ਜਿਸ ਕਉ ਹਰਿ ਪ੍ਰਭੁ ਮਨਿ ਚਿਤਿ ਆਵੈ ॥
ਸੋ ਸੰਤੁ ਸੁਹੇਲਾ ਨਹੀ ਡੁਲਾਵੈ ॥
ਜਿਸੁ ਪ੍ਰਭੁ ਅਪੁਨਾ ਕਿਰਪਾ ਕਰੈ ॥
ਸੋ ਸੇਵਕੁ ਕਹੁ ਕਿਸ ਤੇ ਡਰੈ ॥
ਜੈਸਾ ਸਾ ਤੈਸਾ ਦ੍ਰਿਸਟਾਇਆ ॥
ਅਪੁਨੇ ਕਾਰਜ ਮਹਿ ਆਪਿ ਸਮਾਇਆ ॥
ਸੋਧਤ ਸੋਧਤ ਸੋਧਤ ਸੀਝਿਆ ॥
ਗੁਰ ਪ੍ਰਸਾਦਿ ਤਤੁ ਸਭੁ ਬੂਝਿਆ ॥
ਜਬ ਦੇਖਉ ਤਬ ਸਭੁ ਕਿਛੁ ਮੂਲੁ ॥
ਨਾਨਕ ਸੋ ਸੂਖਮੁ ਸੋਈ ਅਸਥੂਲੁ ॥੫॥
ਨਹ ਕਿਛੁ ਜਨਮੈ ਨਹ ਕਿਛੁ ਮਰੈ ॥
ਆਪਨ ਚਲਿਤੁ ਆਪ ਹੀ ਕਰੈ ॥
ਆਵਨੁ ਜਾਵਨੁ ਦ੍ਰਿਸਟਿ ਅਨਦ੍ਰਿਸਟਿ ॥
ਆਗਿਆਕਾਰੀ ਧਾਰੀ ਸਭ ਸ੍ਰਿਸਟਿ ॥
ਆਪੇ ਆਪਿ ਸਗਲ ਮਹਿ ਆਪਿ ॥
ਅਨਿਕ ਜੁਗਤਿ ਰਚਿ ਥਾਪਿ ਉਥਾਪਿ ॥
ਅਬਿਨਾਸੀ ਨਾਹੀ ਕਿਛੁ ਖੰਡ ॥
ਧਾਰਣ ਧਾਰਿ ਰਹਿਓ ਬ੍ਰਹਮੰਡ ॥
ਅਲਖ ਅਭੇਵ ਪੁਰਖ ਪਰਤਾਪ ॥
ਆਪਿ ਜਪਾਏ ਤ ਨਾਨਕ ਜਾਪ ॥੬॥
ਜਿਨ ਪ੍ਰਭੁ ਜਾਤਾ ਸੁ ਸੋਭਾਵੰਤ ॥
ਸਗਲ ਸੰਸਾਰੁ ਉਧਰੈ ਤਿਨ ਮੰਤ ॥
ਪ੍ਰਭ ਕੇ ਸੇਵਕ ਸਗਲ ਉਧਾਰਨ ॥
ਪ੍ਰਭ ਕੇ ਸੇਵਕ ਦੂਖ ਬਿਸਾਰਨ ॥
ਆਪੇ ਮੇਲਿ ਲਏ ਕਿਰਪਾਲ ॥
ਗੁਰ ਕਾ ਸਬਦੁ ਜਪਿ ਭਏ ਨਿਹਾਲ ॥
ਉਨ ਕੀ ਸੇਵਾ ਸੋਈ ਲਾਗੈ ॥
ਜਿਸ ਨੋ ਕ੍ਰਿਪਾ ਕਰਹਿ ਬਡਭਾਗੈ ॥
ਨਾਮੁ ਜਪਤ ਪਾਵਹਿ ਬਿਸ੍ਰਾਮੁ ॥
ਨਾਨਕ ਤਿਨ ਪੁਰਖ ਕਉ ਊਤਮ ਕਰਿ ਮਾਨੁ ॥੭॥
ਜੋ ਕਿਛੁ ਕਰੈ ਸੁ ਪ੍ਰਭ ਕੈ ਰੰਗਿ ॥
ਸਦਾ ਸਦਾ ਬਸੈ ਹਰਿ ਸੰਗਿ ॥
ਸਹਜ ਸੁਭਾਇ ਹੋਵੈ ਸੋ ਹੋਇ ॥
ਕਰਣੈਹਾਰੁ ਪਛਾਣੈ ਸੋਇ ॥
ਪ੍ਰਭ ਕਾ ਕੀਆ ਜਨ ਮੀਠ ਲਗਾਨਾ ॥
ਜੈਸਾ ਸਾ ਤੈਸਾ ਦ੍ਰਿਸਟਾਨਾ ॥
ਜਿਸ ਤੇ ਉਪਜੇ ਤਿਸੁ ਮਾਹਿ ਸਮਾਏ ॥
ਓਇ ਸੁਖ ਨਿਧਾਨ ਉਨਹੂ ਬਨਿ ਆਏ ॥
ਆਪਸ ਕਉ ਆਪਿ ਦੀਨੋ ਮਾਨੁ ॥
ਨਾਨਕ ਪ੍ਰਭ ਜਨੁ ਏਕੋ ਜਾਨੁ ॥੮॥੧੪॥
ਸਲੋਕੁ ॥
ਸਰਬ ਕਲਾ ਭਰਪੂਰ ਪ੍ਰਭ ਬਿਰਥਾ ਜਾਨਨਹਾਰ ॥
ਜਾ ਕੈ ਸਿਮਰਨਿ ਉਧਰੀਐ ਨਾਨਕ ਤਿਸੁ ਬਲਿਹਾਰ ॥੧॥`,
        transliteration: `salok |
tajahu siaanap sur janahu simarahu har har raae |
ek aas har man rakhahu naanak dookh bharam bhau jaae |1|
asattapadee |
maanukh kee ttek brithee sabh jaan |
devan kau ekai bhagavaan |
jis kai deeai rahai aghaae |
bahur na trisanaa laagai aae |
maarai raakhai eko aap |
maanukh kai kichh naahee haath |
tis kaa hukam boojh sukh hoe |
tis kaa naam rakh kantth paroe |
simar simar simar prabh soe |
naanak bighan na laagai koe |1|
ausatat man meh kar nirankaar |
kar man mere sat biauhaar |
niramal rasanaa amrit peeo |
sadaa suhelaa kar lehi jeeo |
nainahu pekh tthaakur kaa rang |
saadhasang binasai sabh sang |
charan chlau maarag gobind |
mitteh paap japeeai har bind |
kar har karam sravan har kathaa |
har daragah naanak aoojal mathaa |2|
baddabhaagee te jan jag maeh |
sadaa sadaa har ke gun gaeh |
raam naam jo kareh beechaar |
se dhanavant ganee sansaar |
man tan mukh boleh har mukhee |
sadaa sadaa jaanahu te sukhee |
eko ek ek pachhaanai |
eit ut kee ohu sojhee jaanai |
naam sang jis kaa man maaniaa |
naanak tineh niranjan jaaniaa |3|
gur prasaad aapan aap sujhai |
tis kee jaanahu trisanaa bujhai |
saadhasang har har jas kehat |
sarab rog te ohu har jan rehat |
anadin keeratan keval bakhayaan |
grihasat meh soee nirabaan |
ek aoopar jis jan kee aasaa |
tis kee katteeai jam kee faasaa |
paarabraham kee jis man bhookh |
naanak tiseh na laageh dookh |4|
jis kau har prabh man chit aavai |
so sant suhelaa nahee ddulaavai |
jis prabh apunaa kirapaa karai |
so sevak kahu kis te ddarai |
jaisaa saa taisaa drisattaaeaa |
apune kaaraj meh aap samaaeaa |
sodhat sodhat sodhat seejhiaa |
gur prasaad tat sabh boojhiaa |
jab dekhau tab sabh kichh mool |
naanak so sookham soee asathool |5|
neh kichh janamai neh kichh marai |
aapan chalit aap hee karai |
aavan jaavan drisatt anadrisatt |
aagiaakaaree dhaaree sabh srisatt |
aape aap sagal meh aap |
anik jugat rach thaap uthaap |
abinaasee naahee kichh khandd |
dhaaran dhaar rahio brahamandd |
alakh abhev purakh parataap |
aap japaae ta naanak jaap |6|
jin prabh jaataa su sobhaavant |
sagal sansaar udharai tin mant |
prabh ke sevak sagal udhaaran |
prabh ke sevak dookh bisaaran |
aape mel le kirapaal |
gur kaa sabad jap bhe nihaal |
aun kee sevaa soee laagai |
jis no kripaa kareh baddabhaagai |
naam japat paaveh bisraam |
naanak tin purakh kau aootam kar maan |7|
jo kichh karai su prabh kai rang |
sadaa sadaa basai har sang |
sehaj subhaae hovai so hoe |
karanaihaar pachhaanai soe |
prabh kaa keea jan meetth lagaanaa |
jaisaa saa taisaa drisattaanaa |
jis te upaje tis maeh samaae |
oe sukh nidhaan unahoo ban aae |
aapas kau aap deeno maan |
naanak prabh jan eko jaan |8|14|
salok |
sarab kalaa bharapoor prabh birathaa jaananahaar |
jaa kai simaran udhareeai naanak tis balihaar |1|`,
        meaning: `Salok: Give up your cleverness, good people - remember the Lord God, your King! Enshrine in your heart, your hopes in the One Lord. O Nanak, your pain, doubt and fear shall depart. ||1|| Ashtapadee: Reliance on mortals is in vain - know this well. The Great Giver is the One Lord God. By His gifts, we are satisfied, and we suffer from thirst no longer. The One Lord Himself destroys and also preserves. Nothing at all is in the hands of mortal beings. Understanding His Order, there is peace. So take His Name, and wear it as your necklace. Remember, remember, remember God in meditation. O Nanak, no obstacle shall stand in your way. ||1|| Praise the Formless Lord in your mind. O my mind, make this your true occupation. Let your tongue become pure, drinking in the Ambrosial Nectar. Your soul shall be forever peaceful. With your eyes, see the wondrous play of your Lord and Master. In the Company of the Holy, all other associations vanish. With your feet, walk in the Way of the Lord. Sins are washed away, chanting the Lord's Name, even for a moment. So do the Lord's Work, and listen to the Lord's Sermon. In the Lord's Court, O Nanak, your face shall be radiant. ||2|| Very fortunate are those humble beings in this world, who sing the Glorious Praises of the Lord, forever and ever. Those who dwell upon the Lord's Name, are the most wealthy and prosperous in the world. Those who speak of the Supreme Lord in thought, word and deed know that they are peaceful and happy, forever and ever. One who recognizes the One and only Lord as One, understands this world and the next. One whose mind accepts the Company of the Naam, the Name of the Lord, O Nanak, knows the Immaculate Lord. ||3|| By Guru's Grace, one understands himself; know that then, his thirst is quenched. In the Company of the Holy, one chants the Praises of the Lord, Har, Har. Such a devotee of the Lord is free of all disease. Night and day, sing the Kirtan, the Praises of the One Lord. In the midst of your household, remain balanced and unattached. One who places his hopes in the One Lord the noose of Death is cut away from his neck. One whose mind hungers for the Supreme Lord God, O Nanak, shall not suffer pain. ||4|| One who focuses his conscious mind on the Lord God - that Saint is at peace; he does not waver. Those unto whom God has granted His Grace who do those servants need to fear? As God is, so does He appear; in His Own creation, He Himself is pervading. Searching, searching, searching, and finally, success! By Guru's Grace, the essence of all reality is understood. Wherever I look, there I see Him, at the root of all things. O Nanak, He is the subtle, and He is also the manifest. ||5|| Nothing is born, and nothing dies. He Himself stages His own drama. Coming and going, seen and unseen, all the world is obedient to His Will. He Himself is All-in-Himself. In His many ways, He establishes and disestablishes. He is Imperishable; nothing can be broken. He lends His Support to maintain the Universe. Unfathomable and Inscrutable is the Glory of the Lord. As He inspires us to meditate, O Nanak, so do we meditate. ||6|| Those who know God are glorious. The whole world is redeemed by their teachings. God's servants redeem all. God's servants cause sorrows to be forgotten. The Merciful Lord unites them with Himself. Chanting the Word of the Guru's Shabad, they become ecstatic. He alone is committed to serve them, upon whom God bestows His Mercy, by great good fortune. Those who chant the Naam find their place of rest. O Nanak, respect those persons as the most noble. ||7|| Whatever you do, do it for the Love of God. Forever and ever, abide with the Lord. By its own natural course, whatever will be will be. Acknowledge that Creator Lord; God's doings are sweet to His humble servant. As He is, so does He appear. From Him we came, and into Him we shall merge again. He is the treasure of peace, and so does His servant become. Unto His own, He has given His honor. O Nanak, know that God and His humble servant are one and the same. ||8||14|| Salok: God is totally imbued with all powers; He is the Knower of our troubles. Meditating in remembrance on Him, we are saved; Nanak is a sacrifice to Him. ||1||`,
        meaning_pa: `ਹੇ ਭਲੇ ਮਨੁੱਖੋ! ਚਤੁਰਾਈ ਛੱਡੋ ਤੇ ਅਕਾਲ ਪੁਰਖ ਨੂੰ ਸਿਮਰੋ; ਕੇਵਲ ਪ੍ਰਭੂ ਦੀ ਆਸ ਮਨ ਵਿਚ ਰੱਖੋ। ਹੇ ਨਾਨਕ! (ਇਸ ਤਰ੍ਹਾਂ) ਦੁੱਖ ਵਹਮ ਤੇ ਡਰ ਦੂਰ ਹੋ ਜਾਂਦਾ ਹੈ ॥੧॥ (ਹੇ ਮਨ!) (ਕਿਸੇ) ਮਨੁੱਖ ਦਾ ਆਸਰਾ ਉੱਕਾ ਹੀ ਵਿਅਰਥ ਸਮਝ, ਇਕ ਅਕਾਲ ਪੁਰਖ ਹੀ (ਸਭ ਜੀਆਂ ਨੂੰ) ਦੇਣ ਜੋਗਾ ਹੈ; ਜਿਸ ਦੇ ਦਿੱਤਿਆਂ (ਮਨੁੱਖ) ਰੱਜਿਆ ਰਹਿੰਦਾ ਹੈ, ਤੇ ਮੁੜ ਉਸ ਨੂੰ ਲਾਲਚ ਆ ਕੇ ਦਬਾਉਂਦਾ ਨਹੀਂ। ਪ੍ਰਭੂ ਆਪ ਹੀ (ਜੀਵਾਂ ਨੂੰ) ਮਾਰਦਾ ਹੈ (ਜਾਂ) ਪਾਲਦਾ ਹੈ, ਮਨੁੱਖ ਦੇ ਵੱਸ ਕੁਝ ਨਹੀਂ ਹੈ। (ਤਾਂ ਤੇ) ਉਸ ਮਾਲਕ ਦਾ ਹੁਕਮ ਸਮਝ ਕੇ ਸੁਖ ਹੁੰਦਾ ਹੈ। (ਹੇ ਮਨ!) ਉਸ ਦਾ ਨਾਮ ਹਰ ਵੇਲੇ ਯਾਦ ਕਰ। ਉਸ ਪ੍ਰਭੂ ਨੂੰ ਸਦਾ ਸਿਮਰ। ਹੇ ਨਾਨਕ! (ਸਿਮਰਨ ਦੀ ਬਰਕਤਿ ਨਾਲ) (ਜ਼ਿੰਦਗੀ ਦੇ ਸਫ਼ਰ ਵਿਚ) ਕੋਈ ਰੁਕਾਵਟ ਨਹੀਂ ਪੈਂਦੀ ॥੧॥ ਆਪਣੇ ਅੰਦਰ ਅਕਾਲ ਪੁਰਖ ਦੀ ਵਡਿਆਈ ਕਰ। ਹੇ ਮੇਰੇ ਮਨ! ਇਹ ਸੱਚਾ ਵਿਹਾਰ ਕਰ। ਜੀਭ ਨਾਲ ਮਿੱਠਾ (ਨਾਮ-) ਅੰਮ੍ਰਿਤ ਪੀ, (ਇਸ ਤਰ੍ਹਾਂ) ਆਪਣੀ ਜਿੰਦ ਨੂੰ ਸਦਾ ਲਈ ਸੁਖੀ ਕਰ ਲੈ। ਅੱਖਾਂ ਨਾਲ ਅਕਾਲ ਪੁਰਖ ਦਾ (ਜਗਤ-) ਤਮਾਸ਼ਾ ਵੇਖ, ਭਲਿਆਂ ਦੀ ਸੰਗਤਿ ਵਿਚ (ਟਿਕਿਆਂ) ਹੋਰ (ਕੁਟੰਬ ਆਦਿਕ ਦਾ) ਮੋਹ ਮਿਟ ਜਾਂਦਾ ਹੈ। ਪੈਰਾਂ ਨਾਲ ਰੱਬ ਦੇ ਰਾਹ ਤੇ ਤੁਰ। ਪ੍ਰਭੂ ਨੂੰ ਰਤਾ ਭਰ ਭੀ ਜਪੀਏ ਤਾਂ ਪਾਪ ਦੂਰ ਹੋ ਜਾਂਦੇ ਹਨ। ਹੱਥਾਂ ਨਾਲ ਪ੍ਰਭੂ (ਦੇ ਰਾਹ) ਦੇ ਕੰਮ ਕਰ ਤੇ ਕੰਨ ਨਾਲ ਉਸ ਦੀ ਵਡਿਆਈ (ਸੁਣ); (ਇਸ ਤਰ੍ਹਾਂ) ਹੇ ਨਾਨਕ! ਪ੍ਰਭੂ ਦੀ ਦਰਗਾਹ ਵਿਚ ਸੁਰਖ਼-ਰੂ ਹੋ ਜਾਈਦਾ ਹੈ ॥੨॥ ਉਹ ਮਨੁੱਖ ਜਗਤ ਵਿਚ ਵੱਡੇ ਭਾਗਾਂ ਵਾਲੇ ਹਨ, (ਜੋ) ਸਦਾ ਹੀ ਪ੍ਰਭੂ ਦੇ ਗੁਣ ਗਾਉਂਦੇ ਹਨ। ਜੋ ਅਕਾਲ ਪੁਰਖ ਦੇ ਨਾਮ ਦਾ ਧਿਆਨ ਕਰਦੇ ਹਨ, ਉਹ ਮਨੁੱਖ ਜਗਤ ਵਿਚ ਧਨੀ ਹਨ ਤੇ ਰੱਜੇ ਹੋਏ ਹਨ। ਜੇਹੜੇ ਭਲੇ ਲੋਕ ਮਨ ਤਨ ਤੇ ਮੂੰਹ ਤੋਂ ਪ੍ਰਭੂ ਦਾ ਨਾਮ ਉਚਾਰਦੇ ਹਨ, ਉਹਨਾਂ ਨੂੰ ਸਦਾ ਸੁਖੀ ਜਾਣੋ। ਜੋ ਮਨੁੱਖ ਕੇਵਲ ਇਕ ਪ੍ਰਭੂ ਨੂੰ (ਹਰ ਥਾਂ) ਪਛਾਣਦਾ ਹੈ, ਉਸ ਨੂੰ ਲੋਕ ਪਰਲੋਕ ਦੀ (ਭਾਵ, ਜੀਵਨ ਦੇ ਸਾਰੇ ਸਫ਼ਰ ਦੀ) ਸਮਝ ਆ ਜਾਂਦੀ ਹੈ। ਜਿਸ ਮਨੁੱਖ ਦਾ ਮਨ ਪ੍ਰਭੂ ਦੇ ਨਾਮ ਨਾਲ ਰਚ ਮਿਚ ਜਾਂਦਾ ਹੈ, ਹੇ ਨਾਨਕ! ਉਸ ਨੇ ਪ੍ਰਭੂ ਨੂੰ ਪਛਾਣ ਲਿਆ ਹੈ ॥੩॥ ਜਿਸ ਮਨੁੱਖ ਨੂੰ ਗੁਰੂ ਦੀ ਕਿਰਪਾ ਨਾਲ ਆਪਣਾ ਆਪ ਸੁੱਝ ਪੈਂਦਾ ਹੈ, ਇਹ ਜਾਣ ਲਵੋ ਕਿ ਉਸ ਦੀ ਤ੍ਰਿਸ਼ਨਾ ਮਿਟ ਜਾਂਦੀ ਹੈ। ਜੋ ਰੱਬ ਦਾ ਪਿਆਰਾ ਸਤਸੰਗ ਵਿਚ ਅਕਾਲ ਪੁਰਖ ਦੀ ਸਿਫ਼ਤ-ਸਾਲਾਹ ਕਰਦਾ ਹੈ, ਉਹ ਸਾਰੇ ਰੋਗਾਂ ਤੋਂ ਬਚ ਜਾਂਦਾ ਹੈ। ਜੋ ਮਨੁੱਖ ਹਰ ਰੋਜ਼ ਪ੍ਰਭੂ ਦਾ ਕੀਰਤਨ ਹੀ ਉੱਚਾਰਦਾ ਹੈ, ਉਹ ਮਨੁੱਖ ਗ੍ਰਿਹਸਤ ਵਿਚ (ਰਹਿੰਦਾ ਹੋਇਆ) ਨਿਰਲੇਪ ਹੈ। ਜਿਸ ਮਨੁੱਖ ਦੀ ਆਸ ਇਕ ਅਕਾਲ ਪੁਰਖ ਉੱਤੇ ਹੈ, ਉਸ ਦੀ ਜਮਾਂ ਵਾਲੀ ਫਾਹੀ ਕੱਟੀ ਜਾਂਦੀ ਹੈ। ਜਿਸ ਮਨੁੱਖ ਦੇ ਮਨ ਵਿਚ ਪ੍ਰਭੂ (ਦੇ ਮਿਲਣ) ਦੀ ਤਾਂਘ ਹੈ, ਹੇ ਨਾਨਕ! ਉਸ ਮਨੁੱਖ ਨੂੰ ਕੋਈ ਦੁੱਖ ਨਹੀਂ ਪੋਂਹਦਾ ॥੪॥ ਜਿਸ ਮਨੁੱਖ ਨੂੰ ਹਰੀ ਪ੍ਰਭੂ ਮਨ ਵਿਚ ਸਦਾ ਯਾਦ ਰਹਿੰਦਾ ਹੈ, ਉਹ ਸੰਤ ਹੈ, ਸੁਖੀ ਹੈ (ਉਹ ਕਦੇ) ਘਾਬਰਦਾ ਨਹੀਂ। ਜਿਸ ਮਨੁੱਖ ਉਤੇ ਪ੍ਰਭੂ ਆਪਣੀ ਮੇਹਰ ਕਰਦਾ ਹੈ, ਦੱਸੋ (ਪ੍ਰਭੂ ਦਾ) ਉਹ ਸੇਵਕ (ਹੋਰ) ਕਿਸ ਤੋਂ ਡਰ ਸਕਦਾ ਹੈ? (ਕਿਉਂਕਿ) ਉਸ ਨੂੰ ਪ੍ਰਭੂ ਉਹੋ ਜਿਹਾ ਹੀ ਦਿੱਸ ਪੈਂਦਾ ਹੈ, ਜਿਹੋ ਜਿਹਾ ਉਹ (ਅਸਲ ਵਿਚ) ਹੈ, (ਭਾਵ ਇਹ ਦਿੱਸ ਪੈਂਦਾ ਹੈ ਕਿ) ਪ੍ਰਭੂ ਆਪਣੇ ਰਚੇ ਹੋਏ ਜਗਤ ਵਿਚ ਆਪ ਵਿਆਪਕ ਹੈ; ਨਿੱਤ ਵਿਚਾਰ ਕਰਦਿਆਂ (ਉਸ ਸੇਵਕ ਨੂੰ ਵਿਚਾਰ ਵਿਚ) ਸਫਲਤਾ ਹੋ ਜਾਂਦੀ ਹੈ, (ਭਾਵ) ਗੁਰੂ ਦੀ ਕਿਰਪਾ ਨਾਲ (ਉਸ ਨੂੰ) ਸਾਰੀ ਅਸਲੀਅਤ ਦੀ ਸਮਝ ਆ ਜਾਂਦੀ ਹੈ। (ਮੇਰੇ ਉਤੇ ਭੀ ਗੁਰੂ ਦੀ ਮੇਹਰ ਹੋਈ ਹੈ, ਹੁਣ) ਮੈਂ ਜਦੋਂ ਤੱਕਦਾ ਹਾਂ ਤਾਂ ਹਰੇਕ ਚੀਜ਼ ਉਸ ਸਭ ਦੇ ਮੁਢ (-ਪ੍ਰਭੂ ਦਾ ਰੂਪ ਦਿੱਸਦੀ ਹੈ), ਹੇ ਨਾਨਕ! ਇਹ ਦਿੱਸਦਾ ਸੰਸਾਰ ਭੀ ਉਹ ਆਪ ਹੈ ਤੇ ਸਭ ਵਿਚ ਵਿਆਪਕ ਜੋਤਿ ਭੀ ਆਪਿ ਹੀ ਹੈ ॥੫॥ ਨਾਹ ਕੁਝ ਜੰਮਦਾ ਹੈ ਨਾਹ ਕੁਝ ਮਰਦਾ ਹੈ; (ਇਹ ਜਨਮ ਮਰਣ ਦਾ ਤਾਂ) ਪ੍ਰਭੂ ਆਪ ਹੀ ਖੇਲ ਕਰ ਰਿਹਾ ਹੈ; ਜੰਮਣਾ, ਮਰਣਾ, ਦਿੱਸਦਾ ਤੇ ਅਣ-ਦਿੱਸਦਾ- ਇਹ ਸਾਰਾ ਸੰਸਾਰ ਪ੍ਰਭੂ ਨੇ ਆਪਣੇ ਹੁਕਮ ਵਿਚ ਤੁਰਨ ਵਾਲਾ ਬਣਾ ਦਿੱਤਾ ਹੈ। ਸਾਰੇ ਜੀਵਾਂ ਵਿਚ ਕੇਵਲ ਆਪ ਹੀ ਹੈ, ਅਨੇਕਾਂ ਤਰੀਕਿਆਂ ਨਾਲ (ਜਗਤ ਨੂੰ) ਬਣਾ ਬਣਾ ਕੇ ਨਾਸ ਭੀ ਕਰ ਦੇਂਦਾ ਹੈ। ਪ੍ਰਭੂ ਆਪ ਅਬਿਨਾਸ਼ੀ ਹੈ; ਉਸ ਦਾ ਕੁਝ ਨਾਸ ਨਹੀਂ ਹੁੰਦਾ, ਸਾਰੇ ਬ੍ਰਹਮੰਡ ਦੀ ਰਚਨਾ ਭੀ ਆਪ ਹੀ ਰਚ ਰਿਹਾ ਹੈ। ਉਸ ਵਿਆਪਕ ਪ੍ਰਭੂ ਦੇ ਪ੍ਰਤਾਪ ਦਾ ਭੇਤ ਨਹੀਂ ਪਾਇਆ ਜਾ ਸਕਦਾ, ਬਿਆਨ ਨਹੀਂ ਹੋ ਸਕਦਾ; ਹੇ ਨਾਨਕ! ਜੇ ਉਹ ਆਪ ਆਪਣਾ ਜਾਪ ਕਰਾਏ ਤਾਂ ਹੀ ਜੀਵ ਜਾਪ ਕਰਦੇ ਹਨ ॥੬॥ ਜਿਨ੍ਹਾਂ ਬੰਦਿਆਂ ਨੇ ਪ੍ਰਭੂ ਨੂੰ ਪਛਾਣ ਲਿਆ, ਉਹ ਸੋਭਾ ਵਾਲੇ ਹੋ ਗਏ; ਸਾਰਾ ਜਗਤ ਉਹਨਾਂ ਦੇ ਉਪਦੇਸ਼ਾਂ ਨਾਲ (ਵਿਕਾਰਾਂ ਤੋਂ) ਬਚਦਾ ਹੈ। ਹਰੀ ਦੇ ਭਗਤ ਸਭ (ਜੀਵਾਂ) ਨੂੰ ਬਚਾਉਣ ਜੋਗੇ ਹਨ, (ਸਭ ਦੇ) ਦੁੱਖ ਦੂਰ ਕਰਨ ਦੇ ਸਮਰੱਥ ਹੁੰਦੇ ਹਨ। (ਸੇਵਕਾਂ ਨੂੰ) ਕਿਰਪਾਲ ਪ੍ਰਭੂ ਆਪ (ਆਪਣੇ ਨਾਲ) ਮਿਲਾ ਲੈਂਦਾ ਹੈ, ਸਤਿਗੁਰੂ ਦਾ ਸ਼ਬਦ ਜਪ ਕੇ ਉਹ (ਫੁੱਲ ਵਾਂਗ) ਖਿੜ ਆਉਂਦੇ ਹਨ। ਉਹੀ ਮਨੁੱਖ ਉਹਨਾਂ (ਸੇਵਕਾਂ) ਦੀ ਸੇਵਾ ਵਿਚ ਰੁੱਝਦਾ ਹੈ, ਜਿਸ ਭਾਗਾਂ ਵਾਲੇ ਉਤੇ, (ਹੇ ਪ੍ਰਭੂ!) ਤੂੰ ਆਪ ਮੇਹਰ ਕਰਦਾ ਹੈਂ। (ਉਹ ਸੇਵਕ) ਨਾਮ ਜਪ ਕੇ ਅਡੋਲ ਅਵਸਥਾ ਹਾਸਲ ਕਰਦੇ ਹਨ; ਹੇ ਨਾਨਕ! ਉਹਨਾਂ ਮਨੁੱਖਾਂ ਨੂੰ ਬੜੇ ਉੱਚੇ ਬੰਦੇ ਸਮਝੋ ॥੭॥ (ਪ੍ਰਭੂ ਦਾ ਸੇਵਕ) ਜੋ ਕੁਝ ਕਰਦਾ ਹੈ, ਪ੍ਰਭੂ ਦੀ ਰਜ਼ਾ ਵਿਚ (ਰਹਿ ਕੇ) ਕਰਦਾ ਹੈ, ਤੇ ਸਦਾ ਹੀ ਪ੍ਰਭੂ ਦੀ ਹਜ਼ੂਰੀ ਵਿਚ ਵੱਸਦਾ ਹੈ। ਸੁਤੇ ਹੀ ਜੋ ਕੁਝ ਹੁੰਦਾ ਹੈ ਉਸ ਨੂੰ ਪ੍ਰਭੂ ਦਾ ਭਾਣਾ ਜਾਣਦਾ ਹੈ, ਤੇ ਸਭ ਕੁਝ ਕਰਨ ਵਾਲਾ ਪ੍ਰਭੂ ਨੂੰ ਹੀ ਸਮਝਦਾ ਹੈ। (ਪ੍ਰਭੂ ਦੇ) ਸੇਵਕਾਂ ਨੂੰ ਪ੍ਰਭੂ ਦਾ ਕੀਤਾ ਹੋਇਆ ਮਿੱਠਾ ਲੱਗਦਾ ਹੈ, (ਕਿਉਂਕਿ) ਪ੍ਰਭੂ ਜਿਹੋ ਜਿਹਾ (ਸਰਬ-ਵਿਆਪਕ) ਹੈ ਉਹੋ ਜਿਹਾ ਉਹਨਾਂ ਨੂੰ ਨਜ਼ਰੀਂ ਆਉਂਦਾ ਹੈ। ਜਿਸ ਪ੍ਰਭੂ ਤੋਂ ਉਹ ਸੇਵਕ ਪੈਦਾ ਹੋਏ ਹਨ, ਉਸੇ ਵਿਚ ਲੀਨ ਰਹਿੰਦੇ ਹਨ, ਉਹ ਸੁਖਾਂ ਦਾ ਖ਼ਜ਼ਾਨਾ ਹੋ ਜਾਂਦੇ ਹਨ ਤੇ ਇਹ ਦਰਜਾ ਫੱਬਦਾ ਭੀ ਉਹਨਾਂ ਨੂੰ ਹੀ ਹੈ। (ਸੇਵਕ ਨੂੰ ਮਾਣ ਦੇ ਕੇ) ਪ੍ਰਭੂ ਆਪਣੇ ਆਪ ਨੂੰ ਆਪ ਮਾਣ ਦੇਂਦਾ ਹੈ (ਕਿਉਂਕਿ ਸੇਵਕ ਦਾ ਮਾਣ ਪ੍ਰਭੂ ਦਾ ਹੀ ਮਾਣ ਹੈ) ਹੇ ਨਾਨਕ! ਪ੍ਰਭੂ ਤੇ ਪ੍ਰਭੂ ਦੇ ਸੇਵਕ ਨੂੰ ਇਕ ਰੂਪ ਸਮਝੋ ॥੮॥੧੪॥ ਪ੍ਰਭੂ ਸਾਰੀਆਂ ਸ਼ਕਤੀਆਂ ਨਾਲ ਪੂਰਨ ਹੈ, (ਸਭ ਜੀਵਾਂ ਦੇ) ਦੁੱਖ-ਦਰਦ ਜਾਣਦਾ ਹੈ। ਹੇ ਨਾਨਕ! ਜਿਸ (ਐਸੇ ਪ੍ਰਭੂ) ਦੇ ਸਿਮਰਨ ਨਾਲ (ਵਿਕਾਰਾਂ ਤੋਂ) ਬਚ ਸਕੀਦਾ ਹੈ, ਉਸ ਤੋਂ (ਸਦਾ) ਸਦਕੇ ਜਾਈਏ ॥੧॥`
      },
      {
        number: 15,
        sanskrit: `ਸਲੋਕੁ ॥
ਸਰਬ ਕਲਾ ਭਰਪੂਰ ਪ੍ਰਭ ਬਿਰਥਾ ਜਾਨਨਹਾਰ ॥
ਜਾ ਕੈ ਸਿਮਰਨਿ ਉਧਰੀਐ ਨਾਨਕ ਤਿਸੁ ਬਲਿਹਾਰ ॥੧॥
ਅਸਟਪਦੀ ॥
ਟੂਟੀ ਗਾਢਨਹਾਰ ਗੋੁਪਾਲ ॥
ਸਰਬ ਜੀਆ ਆਪੇ ਪ੍ਰਤਿਪਾਲ ॥
ਸਗਲ ਕੀ ਚਿੰਤਾ ਜਿਸੁ ਮਨ ਮਾਹਿ ॥
ਤਿਸ ਤੇ ਬਿਰਥਾ ਕੋਈ ਨਾਹਿ ॥
ਰੇ ਮਨ ਮੇਰੇ ਸਦਾ ਹਰਿ ਜਾਪਿ ॥
ਅਬਿਨਾਸੀ ਪ੍ਰਭੁ ਆਪੇ ਆਪਿ ॥
ਆਪਨ ਕੀਆ ਕਛੂ ਨ ਹੋਇ ॥
ਜੇ ਸਉ ਪ੍ਰਾਨੀ ਲੋਚੈ ਕੋਇ ॥
ਤਿਸੁ ਬਿਨੁ ਨਾਹੀ ਤੇਰੈ ਕਿਛੁ ਕਾਮ ॥
ਗਤਿ ਨਾਨਕ ਜਪਿ ਏਕ ਹਰਿ ਨਾਮ ॥੧॥
ਰੂਪਵੰਤੁ ਹੋਇ ਨਾਹੀ ਮੋਹੈ ॥
ਪ੍ਰਭ ਕੀ ਜੋਤਿ ਸਗਲ ਘਟ ਸੋਹੈ ॥
ਧਨਵੰਤਾ ਹੋਇ ਕਿਆ ਕੋ ਗਰਬੈ ॥
ਜਾ ਸਭੁ ਕਿਛੁ ਤਿਸ ਕਾ ਦੀਆ ਦਰਬੈ ॥
ਅਤਿ ਸੂਰਾ ਜੇ ਕੋਊ ਕਹਾਵੈ ॥
ਪ੍ਰਭ ਕੀ ਕਲਾ ਬਿਨਾ ਕਹ ਧਾਵੈ ॥
ਜੇ ਕੋ ਹੋਇ ਬਹੈ ਦਾਤਾਰੁ ॥
ਤਿਸੁ ਦੇਨਹਾਰੁ ਜਾਨੈ ਗਾਵਾਰੁ ॥
ਜਿਸੁ ਗੁਰ ਪ੍ਰਸਾਦਿ ਤੂਟੈ ਹਉ ਰੋਗੁ ॥
ਨਾਨਕ ਸੋ ਜਨੁ ਸਦਾ ਅਰੋਗੁ ॥੨॥
ਜਿਉ ਮੰਦਰ ਕਉ ਥਾਮੈ ਥੰਮਨੁ ॥
ਤਿਉ ਗੁਰ ਕਾ ਸਬਦੁ ਮਨਹਿ ਅਸਥੰਮਨੁ ॥
ਜਿਉ ਪਾਖਾਣੁ ਨਾਵ ਚੜਿ ਤਰੈ ॥
ਪ੍ਰਾਣੀ ਗੁਰ ਚਰਣ ਲਗਤੁ ਨਿਸਤਰੈ ॥
ਜਿਉ ਅੰਧਕਾਰ ਦੀਪਕ ਪਰਗਾਸੁ ॥
ਗੁਰ ਦਰਸਨੁ ਦੇਖਿ ਮਨਿ ਹੋਇ ਬਿਗਾਸੁ ॥
ਜਿਉ ਮਹਾ ਉਦਿਆਨ ਮਹਿ ਮਾਰਗੁ ਪਾਵੈ ॥
ਤਿਉ ਸਾਧੂ ਸੰਗਿ ਮਿਲਿ ਜੋਤਿ ਪ੍ਰਗਟਾਵੈ ॥
ਤਿਨ ਸੰਤਨ ਕੀ ਬਾਛਉ ਧੂਰਿ ॥
ਨਾਨਕ ਕੀ ਹਰਿ ਲੋਚਾ ਪੂਰਿ ॥੩॥
ਮਨ ਮੂਰਖ ਕਾਹੇ ਬਿਲਲਾਈਐ ॥
ਪੁਰਬ ਲਿਖੇ ਕਾ ਲਿਖਿਆ ਪਾਈਐ ॥
ਦੂਖ ਸੂਖ ਪ੍ਰਭ ਦੇਵਨਹਾਰੁ ॥
ਅਵਰ ਤਿਆਗਿ ਤੂ ਤਿਸਹਿ ਚਿਤਾਰੁ ॥
ਜੋ ਕਛੁ ਕਰੈ ਸੋਈ ਸੁਖੁ ਮਾਨੁ ॥
ਭੂਲਾ ਕਾਹੇ ਫਿਰਹਿ ਅਜਾਨ ॥
ਕਉਨ ਬਸਤੁ ਆਈ ਤੇਰੈ ਸੰਗ ॥
ਲਪਟਿ ਰਹਿਓ ਰਸਿ ਲੋਭੀ ਪਤੰਗ ॥
ਰਾਮ ਨਾਮ ਜਪਿ ਹਿਰਦੇ ਮਾਹਿ ॥
ਨਾਨਕ ਪਤਿ ਸੇਤੀ ਘਰਿ ਜਾਹਿ ॥੪॥
ਜਿਸੁ ਵਖਰ ਕਉ ਲੈਨਿ ਤੂ ਆਇਆ ॥
ਰਾਮ ਨਾਮੁ ਸੰਤਨ ਘਰਿ ਪਾਇਆ ॥
ਤਜਿ ਅਭਿਮਾਨੁ ਲੇਹੁ ਮਨ ਮੋਲਿ ॥
ਰਾਮ ਨਾਮੁ ਹਿਰਦੇ ਮਹਿ ਤੋਲਿ ॥
ਲਾਦਿ ਖੇਪ ਸੰਤਹ ਸੰਗਿ ਚਾਲੁ ॥
ਅਵਰ ਤਿਆਗਿ ਬਿਖਿਆ ਜੰਜਾਲ ॥
ਧੰਨਿ ਧੰਨਿ ਕਹੈ ਸਭੁ ਕੋਇ ॥
ਮੁਖ ਊਜਲ ਹਰਿ ਦਰਗਹ ਸੋਇ ॥
ਇਹੁ ਵਾਪਾਰੁ ਵਿਰਲਾ ਵਾਪਾਰੈ ॥
ਨਾਨਕ ਤਾ ਕੈ ਸਦ ਬਲਿਹਾਰੈ ॥੫॥
ਚਰਨ ਸਾਧ ਕੇ ਧੋਇ ਧੋਇ ਪੀਉ ॥
ਅਰਪਿ ਸਾਧ ਕਉ ਅਪਨਾ ਜੀਉ ॥
ਸਾਧ ਕੀ ਧੂਰਿ ਕਰਹੁ ਇਸਨਾਨੁ ॥
ਸਾਧ ਊਪਰਿ ਜਾਈਐ ਕੁਰਬਾਨੁ ॥
ਸਾਧ ਸੇਵਾ ਵਡਭਾਗੀ ਪਾਈਐ ॥
ਸਾਧਸੰਗਿ ਹਰਿ ਕੀਰਤਨੁ ਗਾਈਐ ॥
ਅਨਿਕ ਬਿਘਨ ਤੇ ਸਾਧੂ ਰਾਖੈ ॥
ਹਰਿ ਗੁਨ ਗਾਇ ਅੰਮ੍ਰਿਤ ਰਸੁ ਚਾਖੈ ॥
ਓਟ ਗਹੀ ਸੰਤਹ ਦਰਿ ਆਇਆ ॥
ਸਰਬ ਸੂਖ ਨਾਨਕ ਤਿਹ ਪਾਇਆ ॥੬॥
ਮਿਰਤਕ ਕਉ ਜੀਵਾਲਨਹਾਰ ॥
ਭੂਖੇ ਕਉ ਦੇਵਤ ਅਧਾਰ ॥
ਸਰਬ ਨਿਧਾਨ ਜਾ ਕੀ ਦ੍ਰਿਸਟੀ ਮਾਹਿ ॥
ਪੁਰਬ ਲਿਖੇ ਕਾ ਲਹਣਾ ਪਾਹਿ ॥
ਸਭੁ ਕਿਛੁ ਤਿਸ ਕਾ ਓਹੁ ਕਰਨੈ ਜੋਗੁ ॥
ਤਿਸੁ ਬਿਨੁ ਦੂਸਰ ਹੋਆ ਨ ਹੋਗੁ ॥
ਜਪਿ ਜਨ ਸਦਾ ਸਦਾ ਦਿਨੁ ਰੈਣੀ ॥
ਸਭ ਤੇ ਊਚ ਨਿਰਮਲ ਇਹ ਕਰਣੀ ॥
ਕਰਿ ਕਿਰਪਾ ਜਿਸ ਕਉ ਨਾਮੁ ਦੀਆ ॥
ਨਾਨਕ ਸੋ ਜਨੁ ਨਿਰਮਲੁ ਥੀਆ ॥੭॥
ਜਾ ਕੈ ਮਨਿ ਗੁਰ ਕੀ ਪਰਤੀਤਿ ॥
ਤਿਸੁ ਜਨ ਆਵੈ ਹਰਿ ਪ੍ਰਭੁ ਚੀਤਿ ॥
ਭਗਤੁ ਭਗਤੁ ਸੁਨੀਐ ਤਿਹੁ ਲੋਇ ॥
ਜਾ ਕੈ ਹਿਰਦੈ ਏਕੋ ਹੋਇ ॥
ਸਚੁ ਕਰਣੀ ਸਚੁ ਤਾ ਕੀ ਰਹਤ ॥
ਸਚੁ ਹਿਰਦੈ ਸਤਿ ਮੁਖਿ ਕਹਤ ॥
ਸਾਚੀ ਦ੍ਰਿਸਟਿ ਸਾਚਾ ਆਕਾਰੁ ॥
ਸਚੁ ਵਰਤੈ ਸਾਚਾ ਪਾਸਾਰੁ ॥
ਪਾਰਬ੍ਰਹਮੁ ਜਿਨਿ ਸਚੁ ਕਰਿ ਜਾਤਾ ॥
ਨਾਨਕ ਸੋ ਜਨੁ ਸਚਿ ਸਮਾਤਾ ॥੮॥੧੫॥
ਸਲੋਕੁ ॥
ਰੂਪੁ ਨ ਰੇਖ ਨ ਰੰਗੁ ਕਿਛੁ ਤ੍ਰਿਹੁ ਗੁਣ ਤੇ ਪ੍ਰਭ ਭਿੰਨ ॥
ਤਿਸਹਿ ਬੁਝਾਏ ਨਾਨਕਾ ਜਿਸੁ ਹੋਵੈ ਸੁਪ੍ਰਸੰਨ ॥੧॥`,
        transliteration: `salok |
sarab kalaa bharapoor prabh birathaa jaananahaar |
jaa kai simaran udhareeai naanak tis balihaar |1|
asattapadee |
ttoottee gaadtanahaar guopaal |
sarab jeea aape pratipaal |
sagal kee chintaa jis man maeh |
tis te birathaa koee naeh |
re man mere sadaa har jaap |
abinaasee prabh aape aap |
aapan keea kachhoo na hoe |
je sau praanee lochai koe |
tis bin naahee terai kichh kaam |
gat naanak jap ek har naam |1|
roopavant hoe naahee mohai |
prabh kee jot sagal ghatt sohai |
dhanavantaa hoe kiaa ko garabai |
jaa sabh kichh tis kaa deea darabai |
at sooraa je koaoo kahaavai |
prabh kee kalaa binaa keh dhaavai |
je ko hoe bahai daataar |
tis denahaar jaanai gaavaar |
jis gur prasaad toottai hau rog |
naanak so jan sadaa arog |2|
jiau mandar kau thaamai thaman |
tiau gur kaa sabad maneh asathaman |
jiau paakhaan naav charr tarai |
praanee gur charan lagat nisatarai |
jiau andhakaar deepak paragaas |
gur darasan dekh man hoe bigaas |
jiau mahaa udiaan meh maarag paavai |
tiau saadhoo sang mil jot pragattaavai |
tin santan kee baachhau dhoor |
naanak kee har lochaa poor |3|
man moorakh kaahe bilalaaeeai |
purab likhe kaa likhiaa paaeeai |
dookh sookh prabh devanahaar |
avar tiaag too tiseh chitaar |
jo kachh karai soee sukh maan |
bhoolaa kaahe fireh ajaan |
kaun basat aaee terai sang |
lapatt rahio ras lobhee patang |
raam naam jap hirade maeh |
naanak pat setee ghar jaeh |4|
jis vakhar kau lain too aaeaa |
raam naam santan ghar paaeaa |
taj abhimaan lehu man mol |
raam naam hirade meh tol |
laad khep santah sang chaal |
avar tiaag bikhiaa janjaal |
dhan dhan kahai sabh koe |
mukh aoojal har daragah soe |
eihu vaapaar viralaa vaapaarai |
naanak taa kai sad balihaarai |5|
charan saadh ke dhoe dhoe peeo |
arap saadh kau apanaa jeeo |
saadh kee dhoor karahu isanaan |
saadh aoopar jaaeeai kurabaan |
saadh sevaa vaddabhaagee paaeeai |
saadhasang har keeratan gaaeeai |
anik bighan te saadhoo raakhai |
har gun gaae amrit ras chaakhai |
ott gahee santah dar aaeaa |
sarab sookh naanak tih paaeaa |6|
miratak kau jeevaalanahaar |
bhookhe kau devat adhaar |
sarab nidhaan jaa kee drisattee maeh |
purab likhe kaa lahanaa paeh |
sabh kichh tis kaa ohu karanai jog |
tis bin doosar hoaa na hog |
jap jan sadaa sadaa din rainee |
sabh te aooch niramal ih karanee |
kar kirapaa jis kau naam deea |
naanak so jan niramal theea |7|
jaa kai man gur kee parateet |
tis jan aavai har prabh cheet |
bhagat bhagat suneeai tihu loe |
jaa kai hiradai eko hoe |
sach karanee sach taa kee rehat |
sach hiradai sat mukh kehat |
saachee drisatt saachaa aakaar |
sach varatai saachaa paasaar |
paarabraham jin sach kar jaataa |
naanak so jan sach samaataa |8|15|
salok |
roop na rekh na rang kichh trihu gun te prabh bhin |
tiseh bujhaae naanakaa jis hovai suprasan |1|`,
        meaning: `Salok: God is totally imbued with all powers; He is the Knower of our troubles. Meditating in remembrance on Him, we are saved; Nanak is a sacrifice to Him. ||1|| Ashtapadee: The Lord of the World is the Mender of the broken. He Himself cherishes all beings. The cares of all are on His Mind; no one is turned away from Him. O my mind, meditate forever on the Lord. The Imperishable Lord God is Himself All-in-all. By one's own actions, nothing is accomplished, even though the mortal may wish it so, hundreds of times. Without Him, nothing is of any use to you. Salvation, O Nanak, is attained by chanting the Name of the One Lord. ||1|| One who is good-looking should not be vain; the Light of God is in all hearts. Why should anyone be proud of being rich? All riches are His gifts. One may call himself a great hero, but without God's Power, what can anyone do? One who brags about giving to charities the Great Giver shall judge him to be a fool. One who, by Guru's Grace, is cured of the disease of ego - O Nanak, that person is forever healthy. ||2|| As a palace is supported by its pillars, so does the Guru's Word support the mind. As a stone placed in a boat can cross over the river, so is the mortal saved, grasping hold of the Guru's Feet. As the darkness is illuminated by the lamp, so does the mind blossom forth, beholding the Blessed Vision of the Guru's Darshan. The path is found through the great wilderness by joining the Saadh Sangat, The Company of the Holy, and one's light shines forth. I seek the dust of the feet of those Saints; O Lord, fulfill Nanak's longing! ||3|| O foolish mind, why do you cry and bewail? You shall obtain your pre-ordained destiny. God is the Giver of pain and pleasure. Abandon others, and think of Him alone. Whatever He does - take comfort in that. Why do you wander around, you ignorant fool? What things did you bring with you? You cling to worldly pleasures like a greedy moth. Dwell upon the Lord's Name in your heart. O Nanak, thus you shall return to your home with honor. ||4|| This merchandise, which you have come to obtain - the Lord's Name is obtained in the home of the Saints. Renounce your egotistical pride, and with your mind, Purchase the Lord's Name - measure it out within your heart. Load up this merchandise, and set out with the Saints. Give up other corrupt entanglements. "Blessed, blessed", everyone will call you, and your face shall be radiant in the Court of the Lord. In this trade, only a few are trading. Nanak is forever a sacrifice to them. ||5|| Wash the feet of the Holy, and drink in this water. Dedicate your soul to the Holy. Take your cleansing bath in the dust of the feet of the Holy. To the Holy, make your life a sacrifice. Service to the Holy is obtained by great good fortune. In the Saadh Sangat, the Company of the Holy, the Kirtan of the Lord's Praise is sung. From all sorts of dangers, the Saint saves us. Singing the Glorious Praises of the Lord, we taste the ambrosial essence. Seeking the Protection of the Saints, we have come to their door. All comforts, O Nanak, are so obtained. ||6|| He infuses life back into the dead. He gives food to the hungry. All treasures are within His Glance of Grace. People obtain that which they are pre-ordained to receive. All things are His; He is the Doer of all. Other than Him, there has never been any other, and there shall never be. Meditate on Him forever and ever, day and night. This way of life is exalted and immaculate. One whom the Lord, in His Grace, blesses with His Name - O Nanak, that person becomes immaculate and pure. ||7|| One who has faith in the Guru in his mind comes to dwell upon the Lord God. He is acclaimed as a devotee, a humble devotee throughout the three worlds. The One Lord is in his heart. True are his actions; true are his ways. True is his heart; Truth is what he speaks with his mouth. True is his vision; true is his form. He distributes Truth and he spreads Truth. One who recognizes the Supreme Lord God as True - O Nanak, that humble being is absorbed into the True One. ||8||15|| Salok: He has no form, no shape, no color; God is beyond the three qualities. They alone understand Him, O Nanak, with whom He is pleased. ||1||`,
        meaning_pa: `ਪ੍ਰਭੂ ਸਾਰੀਆਂ ਸ਼ਕਤੀਆਂ ਨਾਲ ਪੂਰਨ ਹੈ, (ਸਭ ਜੀਵਾਂ ਦੇ) ਦੁੱਖ-ਦਰਦ ਜਾਣਦਾ ਹੈ। ਹੇ ਨਾਨਕ! ਜਿਸ (ਐਸੇ ਪ੍ਰਭੂ) ਦੇ ਸਿਮਰਨ ਨਾਲ (ਵਿਕਾਰਾਂ ਤੋਂ) ਬਚ ਸਕੀਦਾ ਹੈ, ਉਸ ਤੋਂ (ਸਦਾ) ਸਦਕੇ ਜਾਈਏ ॥੧॥ (ਜੀਵਾਂ ਦੀ ਦਿਲ ਦੀ) ਟੁੱਟੀ ਹੋਈ (ਤਾਰ) ਨੂੰ (ਆਪਣੇ ਨਾਲ) ਗੰਢਣ ਵਾਲਾ ਗੋਪਾਲ ਪ੍ਰਭੂ ਆਪ ਹੈ। ਸਾਰੇ ਜੀਵਾਂ ਦੀ ਪਾਲਣਾ ਕਰਨ ਵਾਲਾ (ਭੀ ਆਪ) ਹੈ। ਜਿਸ ਪ੍ਰਭੂ ਨੂੰ ਆਪਣੇ ਮਨ ਵਿਚ ਸਾਰਿਆਂ (ਦੀ ਰੋਜ਼ੀ) ਦਾ ਫ਼ਿਕਰ ਹੈ, ਉਸ (ਦੇ ਦਰ) ਤੋਂ ਕੋਈ ਜੀਵ ਨਾ-ਉਮੈਦ ਨਹੀਂ (ਆਉਂਦਾ)। ਹੇ ਮੇਰੇ ਮਨ! ਸਦਾ ਪ੍ਰਭੂ ਨੂੰ ਜਪ, ਉਹ ਨਾਸ-ਰਹਿਤ ਹੈ ਤੇ ਆਪਣੇ ਜਿਹਾ ਆਪ ਹੀ ਹੈ। ਪ੍ਰਾਣੀ ਦਾ ਆਪਣੇ ਜਤਨ ਨਾਲ ਕੀਤਾ ਹੋਇਆ ਕੋਈ ਕੰਮ ਸਿਰੇ ਨਹੀਂ ਚੜ੍ਹਦਾ, ਜੇ ਕੋਈ ਪ੍ਰਾਣੀ ਸੌ ਵਾਰੀ ਤਾਂਘ ਕਰੇ। ਉਸ ਪ੍ਰਭੂ ਤੋਂ ਬਿਨਾ ਹੋਰ ਕੋਈ ਚੀਜ਼ ਤੇਰੇ (ਅਸਲੀ) ਕੰਮ ਦੀ ਨਹੀਂ ਹੈ, ਹੇ ਨਾਨਕ! ਇਕ ਪ੍ਰਭੂ ਦਾ ਨਾਮ ਜਪ ਤਾਂ ਗਤਿ ਹੋਵੇਗੀ ॥੧॥ ਰੂਪ ਵਾਲਾ ਹੋ ਕੇ ਕੋਈ ਪ੍ਰਾਣੀ (ਰੂਪ ਦਾ) ਮਾਣ ਨਾਹ ਕਰੇ, (ਕਿਉਂਕ) ਸਾਰੇ ਸਰੀਰਾਂ ਵਿਚ ਪ੍ਰਭੂ ਦੀ ਹੀ ਜੋਤਿ ਸੋਭਦੀ ਹੈ। ਧਨ ਵਾਲਾ ਹੋ ਕੇ ਕੀਹ ਕੋਈ ਮਨੁੱਖ ਅਹੰਕਾਰ ਕਰੇ, ਜਦੋਂ ਸਾਰਾ ਧਨ ਉਸ ਪ੍ਰਭੂ ਦਾ ਹੀ ਬਖ਼ਸ਼ਿਆ ਹੋਇਆ ਹੈ? ਜੇ ਕੋਈ ਮਨੁੱਖ (ਆਪਣੇ ਆਪ ਨੂੰ) ਬੜਾ ਸੂਰਮਾ ਅਖਵਾਏ, (ਤਾਂ ਰਤਾ ਇਹ ਤਾਂ ਸੋਚੇ ਕਿ) ਪ੍ਰਭੂ ਦੀ (ਦਿੱਤੀ ਹੋਈ) ਤਾਕਤ ਤੋਂ ਬਿਨਾ ਕਿਥੇ ਦੌੜ ਸਕਦਾ ਹੈ। ਜੇ ਕੋਈ ਬੰਦਾ (ਧਨਾਢ ਹੋ ਕੇ) ਦਾਤਾ ਬਣ ਬੈਠੇ, ਤਾਂ ਉਹ ਮੂਰਖ ਉਸ ਪ੍ਰਭੂ ਨੂੰ ਪਛਾਣੇ ਜੋ (ਸਭ ਜੀਵਾਂ ਨੂੰ) ਦੇਣ ਜੋਗਾ ਹੈ। ਜਿਸ ਦਾ ਅਹੰਕਾਰ ਰੂਪੀ ਰੋਗ ਗੁਰੂ ਦੀ ਕਿਰਪਾ ਨਾਲ ਦੂਰ ਹੁੰਦਾ ਹੈ, ਹੇ ਨਾਨਕ! ਉਹ ਮਨੁੱਖ ਸਦਾ ਨਿਰੋਆ ਹੈ ॥੨॥ ਜਿਵੇਂ ਘਰ (ਦੇ ਛੱਤ) ਨੂੰ ਥੰਮ੍ਹ ਸਹਾਰਾ ਦੇਂਦਾ ਹੈ, ਤਿਵੇਂ ਗੁਰੂ ਦਾ ਸ਼ਬਦ ਮਨ ਦਾ ਸਹਾਰਾ ਹੈ। ਜਿਵੇਂ ਪੱਥਰ ਬੇੜੀ ਵਿਚ ਚੜ੍ਹ ਕੇ (ਨਦੀ ਆਦਿਕ ਤੋਂ) ਪਾਰ ਲੰਘ ਜਾਂਦਾ ਹੈ, ਤਿਵੇਂ ਗੁਰੂ ਦੀ ਚਰਨੀਂ ਲੱਗਾ ਹੋਇਆ ਬੰਦਾ (ਸੰਸਾਰ-ਸਮੁੰਦਰ ਤੋਂ) ਤਰ ਜਾਂਦਾ ਹੈ। ਜਿਵੇਂ ਦੀਵਾ ਹਨੇਰਾ (ਦੂਰ ਕਰ ਕੇ) ਚਾਨਣ ਕਰ ਦੇਂਦਾ ਹੈ, ਤਿਵੇਂ ਗੁਰੂ ਦਾ ਦੀਦਾਰ ਕਰ ਕੇ ਮਨ ਵਿਚ ਖਿੜਾਉ (ਪੈਦਾ) ਹੋ ਜਾਂਦਾ ਹੈ। ਜਿਵੇਂ (ਕਿਸੇ) ਵੱਡੇ ਜੰਗਲ ਵਿਚ (ਖੁੰਝੇ ਹੋਏ ਨੂੰ) ਰਾਹ ਲੱਭ ਪਏ, ਤਿਵੇਂ ਸਾਧੂ ਦੀ ਸੰਗਤ ਵਿਚ ਬੈਠਿਆਂ (ਅਕਾਲ ਪੁਰਖ ਦੀ) ਜੋਤਿ (ਮਨੁੱਖ ਦੇ ਅੰਦਰ) ਪ੍ਰਗਟਦੀ ਹੈ। ਮੈਂ ਉਹਨਾਂ ਸੰਤਾਂ ਦੇ ਚਰਨਾਂ ਦੀ ਧੂੜ ਮੰਗਦਾ ਹਾਂ। ਹੇ ਪ੍ਰਭੂ! ਨਾਨਕ ਦੀ ਇਹ ਖ਼ਾਹਸ਼ ਪੂਰੀ ਕਰ ॥੩॥ ਹੇ ਮੂਰਖ ਮਨ! (ਦੁੱਖ ਮਿਲਣ ਤੇ) ਕਿਉਂ ਵਿਲਕਦਾ ਹੈਂ? ਪਿਛਲੇ ਬੀਜੇ ਦਾ ਫਲ ਹੀ ਖਾਣਾ ਪੈਂਦਾ ਹੈ। ਦੁੱਖ ਸੁਖ ਦੇਣ ਵਾਲਾ ਪ੍ਰਭੂ ਆਪ ਹੈ, (ਤਾਂ ਤੇ) ਹੋਰ (ਆਸਰੇ) ਛੱਡ ਕੇ ਤੂੰ ਉਸੇ ਨੂੰ ਯਾਦ ਕਰ। ਜੋ ਕੁਝ ਪ੍ਰਭੂ ਕਰਦਾ ਹੈ ਉਸੇ ਨੂੰ ਸੁਖ ਸਮਝ। ਹੇ ਅੰਞਾਣ! ਕਿਉ ਭੁੱਲਿਆਂ ਫਿਰਦਾ ਹੈਂ? (ਦੱਸ) ਕੇਹੜੀ ਚੀਜ਼ ਤੇਰੇ ਨਾਲ ਆਈ ਸੀ। ਹੇ ਲੋਭੀ ਭੰਬਟ! ਤੂੰ (ਮਾਇਆ ਦੇ) ਸੁਆਦ ਵਿਚ ਮਸਤ ਹੋ ਰਿਹਾ ਹੈਂ। ਹਿਰਦੇ ਵਿਚ ਪ੍ਰਭੂ ਦਾ ਨਾਮ ਜਪ, ਹੇ ਨਾਨਕ! (ਇਸੇ ਤਰ੍ਹਾਂ) ਇੱਜ਼ਤ ਨਾਲ (ਪਰਲੋਕ ਵਾਲੇ) ਘਰ ਵਿਚ ਜਾਵਹਿਂਗਾ ॥੪॥ (ਹੇ ਭਾਈ!) ਜੇਹੜਾ ਸੌਦਾ ਖ਼ਰੀਦਣ ਵਾਸਤੇ ਤੂੰ (ਜਗਤ ਵਿਚ) ਆਇਆ ਹੈਂ, ਉਹ ਰਾਮ ਨਾਮ (-ਰੂਪੀ ਸੌਦਾ) ਸੰਤਾਂ ਦੇ ਘਰ ਵਿਚ ਮਿਲਦਾ ਹੈ। (ਇਸ ਵਾਸਤੇ) ਅਹੰਕਾਰ ਛੱਡ ਦੇਹ, ਤੇ ਮਨ ਦੇ ਵੱਟੇ (ਇਹ ਵੱਖਰ) ਖ਼ਰੀਦ ਲੈ, ਅਤੇ ਪ੍ਰਭੂ ਦਾ ਨਾਮ ਹਿਰਦੇ ਵਿਚ ਪਰਖ। ਸੰਤਾਂ ਦੇ ਸੰਗ ਤੁਰ ਤੇ ਰਾਮ ਨਾਮ ਦਾ ਇਹ ਸੌਦਾ ਲੱਦ ਲੈ, ਮਾਇਆ ਦੇ ਹੋਰ ਧੰਧੇ ਛੱਡ ਦੇਹ। (ਜੇ ਇਹ ਉੱਦਮ ਕਰਹਿਂਗਾ ਤਾਂ) ਹਰੇਕ ਜੀਵ ਤੈਨੂੰ ਸ਼ਾਬਾਸ਼ੇ ਆਖੇਗਾ, ਤੇ ਪ੍ਰਭੂ ਦੀ ਦਰਗਾਹ ਵਿਚ ਭੀ ਤੇਰਾ ਮੂੰਹ ਉਜਲਾ ਹੋਵੇਗਾ। (ਪਰ) ਇਹ ਵਪਾਰ ਕੋਈ ਵਿਰਲਾ ਬੰਦਾ ਕਰਦਾ ਹੈ। ਹੇ ਨਾਨਕ! ਅਜੇਹੇ (ਵਪਾਰੀ) ਤੋਂ ਸਦਾ ਸਦਕੇ ਜਾਈਏ ॥੫॥ (ਹੇ ਭਾਈ!) ਸਾਧੂ ਜਨਾਂ ਦੇ ਪੈਰ ਧੋ ਧੋ ਕੇ (ਨਾਮ-ਜਲ) ਪੀ, ਸਾਧ-ਜਨ ਤੋਂ ਆਪਣੀ ਜਿੰਦ ਭੀ ਵਾਰ ਦੇਹ। ਗੁਰਮੁਖ ਮਨੁੱਖ ਦੇ ਪੈਰਾਂ ਦੀ ਖ਼ਾਕ ਵਿਚ ਇਸ਼ਨਾਨ ਕਰ, ਗੁਰਮੁਖ ਤੋਂ ਸਦਕੇ ਹੋਹੁ। ਸੰਤ ਦੀ ਸੇਵਾ ਵੱਡੇ ਭਾਗਾਂ ਨਾਲ ਮਿਲਦੀ ਹੈ, ਸੰਤ ਦੀ ਸੰਗਤਿ ਵਿਚ ਹੀ ਪ੍ਰਭੂ ਦੀ ਸਿਫ਼ਤ-ਸਾਲਾਹ ਕੀਤੀ ਜਾ ਸਕਦੀ ਹੈ। ਸੰਤ ਅਨੇਕਾਂ ਔਕੜਾਂ ਤੋਂ (ਜੋ ਆਤਮਕ ਜੀਵਨ ਦੇ ਰਾਹ ਵਿਚ ਆਉਂਦੀਆਂ ਹਨ) ਬਚਾ ਲੈਂਦਾ ਹੈ, ਸੰਤ ਪ੍ਰਭੂ ਦੇ ਗੁਣ ਗਾ ਕੇ ਨਾਮ-ਅੰਮ੍ਰਿਤ ਦਾ ਸੁਆਦ ਮਾਣਦਾ ਹੈ। (ਜਿਸ ਮਨੁੱਖ ਨੇ) ਸੰਤਾਂ ਦਾ ਆਸਰਾ ਫੜਿਆ ਹੈ ਜੋ ਸੰਤਾਂ ਦੇ ਦਰ ਤੇ ਆ ਡਿੱਗਾ ਹੈ, ਉਸ ਨੇ, ਹੇ ਨਾਨਕ! ਸਾਰੇ ਸੁਖ ਪਾ ਲਏ ਹਨ ॥੬॥ (ਪ੍ਰਭੂ) ਮੋਏ ਹੋਏ ਬੰਦੇ ਨੂੰ ਜਿਵਾਲਣ ਜੋਗਾ ਹੈ, ਭੁੱਖੇ ਨੂੰ ਭੀ ਆਸਰਾ ਦੇਂਦਾ ਹੈ। ਸਾਰੇ ਖ਼ਜ਼ਾਨੇ ਉਸ ਮਾਲਕ ਦੀ ਨਜ਼ਰ ਵਿਚ ਹਨ, (ਪਰ ਜੀਵ) ਆਪਣੇ ਪਿਛਲੇ ਕੀਤੇ ਕਰਮਾਂ ਦਾ ਫਲ ਭੋਗਦੇ ਹਨ। ਸਭ ਕੁਝ ਉਸ ਪ੍ਰਭੂ ਦਾ ਹੀ ਹੈ, ਤੇ ਉਹੀ ਸਭ ਕੁਝ ਕਰਨ ਦੇ ਸਮਰੱਥ ਹੈ; ਉਸ ਤੋਂ ਬਿਨਾ ਕੋਈ ਦੂਜਾ ਨਾਹ ਹੈ ਤੇ ਨਾਹ ਹੋਵੇਗਾ। ਹੇ ਜਨ! ਸਦਾ ਹੀ ਦਿਨ ਰਾਤ ਪ੍ਰਭੂ ਨੂੰ ਯਾਦ ਕਰ, ਹੋਰ ਸਾਰੀਆਂ ਕਰਣੀਆਂ ਨਾਲੋਂ ਇਹੀ ਕਰਣੀ ਉੱਚੀ ਤੇ ਸੁੱਚੀ ਹੈ। ਮੇਹਰ ਕਰ ਕੇ ਜਿਸ ਮਨੁੱਖ ਨੂੰ ਨਾਮ ਬਖ਼ਸ਼ਦਾ ਹੈ, ਹੇ ਨਾਨਕ! ਉਹ ਮਨੁੱਖ ਪਵਿਤ੍ਰ ਹੋ ਜਾਂਦਾ ਹੈ ॥੭॥ ਜਿਸ ਮਨੁੱਖ ਦੇ ਮਨ ਵਿਚ ਸਤਿਗੁਰੂ ਦੀ ਸਰਧਾ ਬਣ ਗਈ ਹੈ, ਉਸ ਦੇ ਚਿੱਤ ਵਿਚ ਪ੍ਰਭੂ ਟਿਕ ਜਾਂਦਾ ਹੈ। ਉਹ ਮਨੁੱਖ ਸਾਰੇ ਜਗਤ ਵਿਚ ਭਗਤ ਭਗਤ ਸੁਣੀਦਾ ਹੈ, ਜਿਸ ਦੇ ਹਿਰਦੇ ਵਿਚ ਇਕ ਪ੍ਰਭੂ ਵੱਸਦਾ ਹੈ; ਉਸ ਦੀ ਅਮਲੀ ਜ਼ਿੰਦਗੀ ਤੇ ਜ਼ਿੰਦਗੀ ਦੇ ਅਸੂਲ ਇਕ-ਰਸ ਹਨ, ਸੱਚਾ ਪ੍ਰਭੂ ਉਸ ਦੇ ਹਿਰਦੇ ਵਿਚ ਹੈ, ਤੇ ਪ੍ਰਭੂ ਦਾ ਨਾਮ ਹੀ ਉਹ ਮੂੰਹੋਂ ਉੱਚਾਰਦਾ ਹੈ; ਉਸ ਮਨੁੱਖ ਦੀ ਨਜ਼ਰ ਸੱਚੇ ਪ੍ਰਭੂ ਦੇ ਰੰਗ ਵਿਚ ਰੰਗੀ ਹੋਈ ਹੈ, (ਤਾਹੀਏਂ) ਸਾਰਾ ਦ੍ਰਿਸ਼ਟਮਾਨ ਜਗਤ (ਉਸ ਨੂੰ) ਪ੍ਰਭੂ ਦਾ ਰੂਪ ਦਿੱਸਦਾ ਹੈ, ਪ੍ਰਭੂ ਹੀ (ਸਭ ਥਾਈਂ) ਮੌਜੂਦ (ਦਿੱਸਦਾ ਹੈ, ਤੇ) ਪ੍ਰਭੂ ਦਾ ਹੀ (ਸਾਰਾ) ਖਿਲਾਰਾ ਦਿੱਸਦਾ ਹੈ। ਜਿਸ ਮਨੁੱਖ ਨੇ ਅਕਾਲ ਪੁਰਖ ਨੂੰ ਸਦਾ-ਥਿਰ ਰਹਿਣ ਵਾਲਾ ਸਮਝਿਆ ਹੈ, ਹੇ ਨਾਨਕ! ਉਹ ਮਨੁੱਖ ਸਦਾ ਉਸ ਥਿਰ ਰਹਿਣ ਵਾਲੇ ਵਿਚ ਲੀਨ ਹੋ ਜਾਂਦਾ ਹੈ ॥੮॥੧੫॥ ਪ੍ਰਭੂ ਦਾ ਨ ਕੋਈ ਰੂਪ ਹੈ, ਨ ਚਿਹਨ-ਚੱਕ੍ਰ ਅਤੇ ਨ ਕੋਈ ਰੰਗ। ਪ੍ਰਭੂ ਮਾਇਆ ਦੇ ਤਿੰਨ ਗੁਣਾਂ ਤੋਂ ਬੇ-ਦਾਗ਼ ਹੈ। ਹੇ ਨਾਨਕ! ਪ੍ਰਭੂ ਆਪਣਾ ਆਪ ਉਸ ਮਨੁੱਖ ਨੂੰ ਸਮਝਾਉਂਦਾ ਹੈ ਜਿਸ ਉਤੇ ਆਪ ਤ੍ਰੁੱਠਦਾ ਹੈ ॥੧॥`
      },
      {
        number: 16,
        sanskrit: `ਸਲੋਕੁ ॥
ਰੂਪੁ ਨ ਰੇਖ ਨ ਰੰਗੁ ਕਿਛੁ ਤ੍ਰਿਹੁ ਗੁਣ ਤੇ ਪ੍ਰਭ ਭਿੰਨ ॥
ਤਿਸਹਿ ਬੁਝਾਏ ਨਾਨਕਾ ਜਿਸੁ ਹੋਵੈ ਸੁਪ੍ਰਸੰਨ ॥੧॥
ਅਸਟਪਦੀ ॥
ਅਬਿਨਾਸੀ ਪ੍ਰਭੁ ਮਨ ਮਹਿ ਰਾਖੁ ॥
ਮਾਨੁਖ ਕੀ ਤੂ ਪ੍ਰੀਤਿ ਤਿਆਗੁ ॥
ਤਿਸ ਤੇ ਪਰੈ ਨਾਹੀ ਕਿਛੁ ਕੋਇ ॥
ਸਰਬ ਨਿਰੰਤਰਿ ਏਕੋ ਸੋਇ ॥
ਆਪੇ ਬੀਨਾ ਆਪੇ ਦਾਨਾ ॥
ਗਹਿਰ ਗੰਭੀਰੁ ਗਹੀਰੁ ਸੁਜਾਨਾ ॥
ਪਾਰਬ੍ਰਹਮ ਪਰਮੇਸੁਰ ਗੋਬਿੰਦ ॥
ਕ੍ਰਿਪਾ ਨਿਧਾਨ ਦਇਆਲ ਬਖਸੰਦ ॥
ਸਾਧ ਤੇਰੇ ਕੀ ਚਰਨੀ ਪਾਉ ॥
ਨਾਨਕ ਕੈ ਮਨਿ ਇਹੁ ਅਨਰਾਉ ॥੧॥
ਮਨਸਾ ਪੂਰਨ ਸਰਨਾ ਜੋਗ ॥
ਜੋ ਕਰਿ ਪਾਇਆ ਸੋਈ ਹੋਗੁ ॥
ਹਰਨ ਭਰਨ ਜਾ ਕਾ ਨੇਤ੍ਰ ਫੋਰੁ ॥
ਤਿਸ ਕਾ ਮੰਤ੍ਰੁ ਨ ਜਾਨੈ ਹੋਰੁ ॥
ਅਨਦ ਰੂਪ ਮੰਗਲ ਸਦ ਜਾ ਕੈ ॥
ਸਰਬ ਥੋਕ ਸੁਨੀਅਹਿ ਘਰਿ ਤਾ ਕੈ ॥
ਰਾਜ ਮਹਿ ਰਾਜੁ ਜੋਗ ਮਹਿ ਜੋਗੀ ॥
ਤਪ ਮਹਿ ਤਪੀਸਰੁ ਗ੍ਰਿਹਸਤ ਮਹਿ ਭੋਗੀ ॥
ਧਿਆਇ ਧਿਆਇ ਭਗਤਹ ਸੁਖੁ ਪਾਇਆ ॥
ਨਾਨਕ ਤਿਸੁ ਪੁਰਖ ਕਾ ਕਿਨੈ ਅੰਤੁ ਨ ਪਾਇਆ ॥੨॥
ਜਾ ਕੀ ਲੀਲਾ ਕੀ ਮਿਤਿ ਨਾਹਿ ॥
ਸਗਲ ਦੇਵ ਹਾਰੇ ਅਵਗਾਹਿ ॥
ਪਿਤਾ ਕਾ ਜਨਮੁ ਕਿ ਜਾਨੈ ਪੂਤੁ ॥
ਸਗਲ ਪਰੋਈ ਅਪੁਨੈ ਸੂਤਿ ॥
ਸੁਮਤਿ ਗਿਆਨੁ ਧਿਆਨੁ ਜਿਨ ਦੇਇ ॥
ਜਨ ਦਾਸ ਨਾਮੁ ਧਿਆਵਹਿ ਸੇਇ ॥
ਤਿਹੁ ਗੁਣ ਮਹਿ ਜਾ ਕਉ ਭਰਮਾਏ ॥
ਜਨਮਿ ਮਰੈ ਫਿਰਿ ਆਵੈ ਜਾਏ ॥
ਊਚ ਨੀਚ ਤਿਸ ਕੇ ਅਸਥਾਨ ॥
ਜੈਸਾ ਜਨਾਵੈ ਤੈਸਾ ਨਾਨਕ ਜਾਨ ॥੩॥
ਨਾਨਾ ਰੂਪ ਨਾਨਾ ਜਾ ਕੇ ਰੰਗ ॥
ਨਾਨਾ ਭੇਖ ਕਰਹਿ ਇਕ ਰੰਗ ॥
ਨਾਨਾ ਬਿਧਿ ਕੀਨੋ ਬਿਸਥਾਰੁ ॥
ਪ੍ਰਭੁ ਅਬਿਨਾਸੀ ਏਕੰਕਾਰੁ ॥
ਨਾਨਾ ਚਲਿਤ ਕਰੇ ਖਿਨ ਮਾਹਿ ॥
ਪੂਰਿ ਰਹਿਓ ਪੂਰਨੁ ਸਭ ਠਾਇ ॥
ਨਾਨਾ ਬਿਧਿ ਕਰਿ ਬਨਤ ਬਨਾਈ ॥
ਅਪਨੀ ਕੀਮਤਿ ਆਪੇ ਪਾਈ ॥
ਸਭ ਘਟ ਤਿਸ ਕੇ ਸਭ ਤਿਸ ਕੇ ਠਾਉ ॥
ਜਪਿ ਜਪਿ ਜੀਵੈ ਨਾਨਕ ਹਰਿ ਨਾਉ ॥੪॥
ਨਾਮ ਕੇ ਧਾਰੇ ਸਗਲੇ ਜੰਤ ॥
ਨਾਮ ਕੇ ਧਾਰੇ ਖੰਡ ਬ੍ਰਹਮੰਡ ॥
ਨਾਮ ਕੇ ਧਾਰੇ ਸਿਮ੍ਰਿਤਿ ਬੇਦ ਪੁਰਾਨ ॥
ਨਾਮ ਕੇ ਧਾਰੇ ਸੁਨਨ ਗਿਆਨ ਧਿਆਨ ॥
ਨਾਮ ਕੇ ਧਾਰੇ ਆਗਾਸ ਪਾਤਾਲ ॥
ਨਾਮ ਕੇ ਧਾਰੇ ਸਗਲ ਆਕਾਰ ॥
ਨਾਮ ਕੇ ਧਾਰੇ ਪੁਰੀਆ ਸਭ ਭਵਨ ॥
ਨਾਮ ਕੈ ਸੰਗਿ ਉਧਰੇ ਸੁਨਿ ਸ੍ਰਵਨ ॥
ਕਰਿ ਕਿਰਪਾ ਜਿਸੁ ਆਪਨੈ ਨਾਮਿ ਲਾਏ ॥
ਨਾਨਕ ਚਉਥੇ ਪਦ ਮਹਿ ਸੋ ਜਨੁ ਗਤਿ ਪਾਏ ॥੫॥
ਰੂਪੁ ਸਤਿ ਜਾ ਕਾ ਸਤਿ ਅਸਥਾਨੁ ॥
ਪੁਰਖੁ ਸਤਿ ਕੇਵਲ ਪਰਧਾਨੁ ॥
ਕਰਤੂਤਿ ਸਤਿ ਸਤਿ ਜਾ ਕੀ ਬਾਣੀ ॥
ਸਤਿ ਪੁਰਖ ਸਭ ਮਾਹਿ ਸਮਾਣੀ ॥
ਸਤਿ ਕਰਮੁ ਜਾ ਕੀ ਰਚਨਾ ਸਤਿ ॥
ਮੂਲੁ ਸਤਿ ਸਤਿ ਉਤਪਤਿ ॥
ਸਤਿ ਕਰਣੀ ਨਿਰਮਲ ਨਿਰਮਲੀ ॥
ਜਿਸਹਿ ਬੁਝਾਏ ਤਿਸਹਿ ਸਭ ਭਲੀ ॥
ਸਤਿ ਨਾਮੁ ਪ੍ਰਭ ਕਾ ਸੁਖਦਾਈ ॥
ਬਿਸ੍ਵਾਸੁ ਸਤਿ ਨਾਨਕ ਗੁਰ ਤੇ ਪਾਈ ॥੬॥
ਸਤਿ ਬਚਨ ਸਾਧੂ ਉਪਦੇਸ ॥
ਸਤਿ ਤੇ ਜਨ ਜਾ ਕੈ ਰਿਦੈ ਪ੍ਰਵੇਸ ॥
ਸਤਿ ਨਿਰਤਿ ਬੂਝੈ ਜੇ ਕੋਇ ॥
ਨਾਮੁ ਜਪਤ ਤਾ ਕੀ ਗਤਿ ਹੋਇ ॥
ਆਪਿ ਸਤਿ ਕੀਆ ਸਭੁ ਸਤਿ ॥
ਆਪੇ ਜਾਨੈ ਅਪਨੀ ਮਿਤਿ ਗਤਿ ॥
ਜਿਸ ਕੀ ਸ੍ਰਿਸਟਿ ਸੁ ਕਰਣੈਹਾਰੁ ॥
ਅਵਰ ਨ ਬੂਝਿ ਕਰਤ ਬੀਚਾਰੁ ॥
ਕਰਤੇ ਕੀ ਮਿਤਿ ਨ ਜਾਨੈ ਕੀਆ ॥
ਨਾਨਕ ਜੋ ਤਿਸੁ ਭਾਵੈ ਸੋ ਵਰਤੀਆ ॥੭॥
ਬਿਸਮਨ ਬਿਸਮ ਭਏ ਬਿਸਮਾਦ ॥
ਜਿਨਿ ਬੂਝਿਆ ਤਿਸੁ ਆਇਆ ਸ੍ਵਾਦ ॥
ਪ੍ਰਭ ਕੈ ਰੰਗਿ ਰਾਚਿ ਜਨ ਰਹੇ ॥
ਗੁਰ ਕੈ ਬਚਨਿ ਪਦਾਰਥ ਲਹੇ ॥
ਓਇ ਦਾਤੇ ਦੁਖ ਕਾਟਨਹਾਰ ॥
ਜਾ ਕੈ ਸੰਗਿ ਤਰੈ ਸੰਸਾਰ ॥
ਜਨ ਕਾ ਸੇਵਕੁ ਸੋ ਵਡਭਾਗੀ ॥
ਜਨ ਕੈ ਸੰਗਿ ਏਕ ਲਿਵ ਲਾਗੀ ॥
ਗੁਨ ਗੋਬਿਦ ਕੀਰਤਨੁ ਜਨੁ ਗਾਵੈ ॥
ਗੁਰ ਪ੍ਰਸਾਦਿ ਨਾਨਕ ਫਲੁ ਪਾਵੈ ॥੮॥੧੬॥
ਸਲੋਕੁ ॥
ਆਦਿ ਸਚੁ ਜੁਗਾਦਿ ਸਚੁ ॥
ਹੈ ਭਿ ਸਚੁ ਨਾਨਕ ਹੋਸੀ ਭਿ ਸਚੁ ॥੧॥`,
        transliteration: `salok |
roop na rekh na rang kichh trihu gun te prabh bhin |
tiseh bujhaae naanakaa jis hovai suprasan |1|
asattapadee |
abinaasee prabh man meh raakh |
maanukh kee too preet tiaag |
tis te parai naahee kichh koe |
sarab nirantar eko soe |
aape beenaa aape daanaa |
gahir ganbheer gaheer sujaanaa |
paarabraham paramesur gobind |
kripaa nidhaan deaal bakhasand |
saadh tere kee charanee paau |
naanak kai man ihu anaraau |1|
manasaa pooran saranaa jog |
jo kar paaeaa soee hog |
haran bharan jaa kaa netr for |
tis kaa mantru na jaanai hor |
anad roop mangal sad jaa kai |
sarab thok suneeeh ghar taa kai |
raaj meh raaj jog meh jogee |
tap meh tapeesar grihasat meh bhogee |
dhiaae dhiaae bhagatah sukh paaeaa |
naanak tis purakh kaa kinai ant na paaeaa |2|
jaa kee leelaa kee mit naeh |
sagal dev haare avagaeh |
pitaa kaa janam ki jaanai poot |
sagal paroee apunai soot |
sumat giaan dhiaan jin dee |
jan daas naam dhiaaveh see |
tihu gun meh jaa kau bharamaae |
janam marai fir aavai jaae |
aooch neech tis ke asathaan |
jaisaa janaavai taisaa naanak jaan |3|
naanaa roop naanaa jaa ke rang |
naanaa bhekh kareh ik rang |
naanaa bidh keeno bisathaar |
prabh abinaasee ekankaar |
naanaa chalit kare khin maeh |
poor rahio pooran sabh tthaae |
naanaa bidh kar banat banaaee |
apanee keemat aape paaee |
sabh ghatt tis ke sabh tis ke tthaau |
jap jap jeevai naanak har naau |4|
naam ke dhaare sagale jant |
naam ke dhaare khandd brahamandd |
naam ke dhaare simrit bed puraan |
naam ke dhaare sunan giaan dhiaan |
naam ke dhaare aagaas paataal |
naam ke dhaare sagal aakaar |
naam ke dhaare pureea sabh bhavan |
naam kai sang udhare sun sravan |
kar kirapaa jis aapanai naam laae |
naanak chauthe pad meh so jan gat paae |5|
roop sat jaa kaa sat asathaan |
purakh sat keval paradhaan |
karatoot sat sat jaa kee baanee |
sat purakh sabh maeh samaanee |
sat karam jaa kee rachanaa sat |
mool sat sat utapat |
sat karanee niramal niramalee |
jiseh bujhaae tiseh sabh bhalee |
sat naam prabh kaa sukhadaaee |
bisvaas sat naanak gur te paaee |6|
sat bachan saadhoo upades |
sat te jan jaa kai ridai praves |
sat nirat boojhai je koe |
naam japat taa kee gat hoe |
aap sat keea sabh sat |
aape jaanai apanee mit gat |
jis kee srisatt su karanaihaar |
avar na boojh karat beechaar |
karate kee mit na jaanai keea |
naanak jo tis bhaavai so varateea |7|
bisaman bisam bhe bisamaad |
jin boojhiaa tis aaeaa svaad |
prabh kai rang raach jan rahe |
gur kai bachan padaarath lahe |
oe daate dukh kaattanahaar |
jaa kai sang tarai sansaar |
jan kaa sevak so vaddabhaagee |
jan kai sang ek liv laagee |
gun gobid keeratan jan gaavai |
gur prasaad naanak fal paavai |8|16|
salok |
aad sach jugaad sach |
hai bhi sach naanak hosee bhi sach |1|`,
        meaning: `Salok: He has no form, no shape, no color; God is beyond the three qualities. They alone understand Him, O Nanak, with whom He is pleased. ||1|| Ashtapadee: Keep the Immortal Lord God enshrined within your mind. Renounce your love and attachment to people. Beyond Him, there is nothing at all. The One Lord is pervading among all. He Himself is All-seeing; He Himself is All-knowing, Unfathomable, Profound, Deep and All-knowing. He is the Supreme Lord God, the Transcendent Lord, the Lord of the Universe, the Treasure of mercy, compassion and forgiveness. To fall at the Feet of Your Holy Beings - this is the longing of Nanak's mind. ||1|| He is the Fulfiller of wishes, who can give us Sanctuary; That which He has written, comes to pass. He destroys and creates in the twinkling of an eye. No one else knows the mystery of His ways. He is the embodiment of ecstasy and everlasting joy. I have heard that all things are in His home. Among kings, He is the King; among yogis, He is the Yogi. Among ascetics, He is the Ascetic; among householders, He is the Enjoyer. By constant meditation, His devotee finds peace. O Nanak, no one has found the limits of that Supreme Being. ||2|| There is no limit to His play. All the demigods have grown weary of searching for it. What does the son know of his father's birth? All are strung upon His string. He bestows good sense, spiritual wisdom and meditation, On His humble servants and slaves who meditate on the Naam. He leads some astray in the three qualities; they are born and die, coming and going over and over again. The high and the low are His places. As He inspires us to know Him, O Nanak, so is He known. ||3|| Many are His forms; many are His colors. Many are the appearances which He assumes, and yet He is still the One. In so many ways, He has extended Himself. The Eternal Lord God is the One, the Creator. He performs His many plays in an instant. The Perfect Lord is pervading all places. In so many ways, He created the creation. He alone can estimate His worth. All hearts are His, and all places are His. Nanak lives by chanting, chanting the Name of the Lord. ||4|| The Naam is the Support of all creatures. The Naam is the Support of the earth and solar systems. The Naam is the Support of the Simritees, the Vedas and the Puraanas. The Naam is the Support by which we hear of spiritual wisdom and meditation. The Naam is the Support of the Akaashic ethers and the nether regions. The Naam is the Support of all bodies. The Naam is the Support of all worlds and realms. Associating with the Naam, listening to it with the ears, one is saved. Those whom the Lord mercifully attaches to His Naam - O Nanak, in the fourth state, those humble servants attain salvation. ||5|| His form is true, and true is His place. His personality is true - He alone is supreme. His acts are true, and true is His Word. The True Lord is permeating all. True are His actions; His creation is true. His root is true, and true is what originates from it. True is His lifestyle, the purest of the pure. All goes well for those who know Him. The True Name of God is the Giver of peace. Nanak has obtained true faith from the Guru. ||6|| True are the Teachings, and the Instructions of the Holy. True are those into whose hearts He enters. One who knows and loves the Truth chanting the Naam, he obtains salvation. He Himself is True, and all that He has made is true. He Himself knows His own state and condition. He is the Creator Lord of His world. No one else understands Him, although they may try. The created cannot know the extent of the Creator. O Nanak, whatever pleases Him comes to pass. ||7|| Gazing upon His wondrous wonder, I am wonder-struck and amazed! One who realizes this, comes to taste this state of joy. God's humble servants remain absorbed in His Love. Following the Guru's Teachings, they receive the four cardinal blessings. They are the givers, the dispellers of pain. In their company, the world is saved. The slave of the Lord's servant is so very blessed. In the company of His servant, one becomes attached to the Love of the One. His humble servant sings the Kirtan, the songs of the glory of God. By Guru's Grace, O Nanak, he receives the fruits of his rewards. ||8||16|| Salok: True in the beginning, True throughout the ages, True here and now. O Nanak, He shall forever be True. ||1||`,
        meaning_pa: `ਪ੍ਰਭੂ ਦਾ ਨ ਕੋਈ ਰੂਪ ਹੈ, ਨ ਚਿਹਨ-ਚੱਕ੍ਰ ਅਤੇ ਨ ਕੋਈ ਰੰਗ। ਪ੍ਰਭੂ ਮਾਇਆ ਦੇ ਤਿੰਨ ਗੁਣਾਂ ਤੋਂ ਬੇ-ਦਾਗ਼ ਹੈ। ਹੇ ਨਾਨਕ! ਪ੍ਰਭੂ ਆਪਣਾ ਆਪ ਉਸ ਮਨੁੱਖ ਨੂੰ ਸਮਝਾਉਂਦਾ ਹੈ ਜਿਸ ਉਤੇ ਆਪ ਤ੍ਰੁੱਠਦਾ ਹੈ ॥੧॥ (ਹੇ ਭਾਈ!) ਆਪਣੇ ਮਨ ਵਿਚ ਅਕਾਲ ਪੁਰਖ ਨੂੰ ਪ੍ਰੋ ਰੱਖ, ਅਤੇ ਮਨੁੱਖ ਦਾ ਪਿਆਰ (ਮੋਹ) ਛੱਡ ਦੇਹ। ਉਸ ਤੋਂ ਬਾਹਰਾ ਹੋਰ ਕੋਈ ਜੀਵ ਨਹੀਂ, ਕੋਈ ਚੀਜ਼ ਨਹੀਂ[ ਸਭ ਜੀਵਾਂ ਦੇ ਅੰਦਰ ਇਕ ਅਕਾਲ ਪੁਰਖ ਹੀ ਵਿਆਪਕ ਹੈ। ਉਹੀ ਆਪ ਹੀ (ਜੀਵਾਂ ਦੇ ਦਿਲ ਦੀ) ਪਛਾਣਨ ਵਾਲਾ ਤੇ ਜਾਣਨ ਵਾਲਾ ਹੈ, ਪ੍ਰਭੂ ਬੜਾ ਗੰਭੀਰ ਹੈ ਤੇ ਡੂੰਘਾ ਹੈ, ਸਿਆਣਾ ਹੈ, ਹੇ ਪਾਰਬ੍ਰਹਮ ਪ੍ਰਭੂ! ਸਭ ਦੇ ਵੱਡੇ ਮਾਲਕ! ਤੇ ਜੀਵਾਂ ਦੇ ਪਾਲਕ! ਦਇਆ ਦੇ ਖ਼ਜ਼ਾਨੇ! ਦਇਆ ਦੇ ਘਰ! ਤੇ ਬਖ਼ਸ਼ਣਹਾਰ! ਮੈਂ ਤੇਰੇ ਸਾਧਾਂ ਦੀ ਚਰਨੀਂ ਪਵਾਂ, ਨਾਨਕ ਦੇ ਮਨ ਵਿਚ ਇਹ ਤਾਂਘ ਹੈ ॥੧॥ ਪ੍ਰਭੂ (ਜੀਵਾਂ ਦੇ) ਮਨ ਦੇ ਫੁਰਨੇ ਪੂਰੇ ਕਰਨ ਤੇ ਸਰਨ ਆਇਆਂ ਦੀ ਸਹਾਇਤਾ ਕਰਨ ਦੇ ਸਮਰੱਥ ਹੈ। ਜੋ ਉਸ ਨੇ (ਜੀਵਾਂ ਦੇ) ਹੱਥ ਉਤੇ ਲਿਖ ਦਿੱਤਾ ਹੈ, ਉਹੀ ਹੁੰਦਾ ਹੈ। ਜਿਸ ਪ੍ਰਭੂ ਦਾ ਅੱਖ ਫਰਕਣ ਦਾ ਸਮਾ (ਜਗਤ ਦੇ) ਪਾਲਣ ਤੇ ਨਾਸ ਲਈ (ਕਾਫ਼ੀ) ਹੈ, ਉਸ ਦਾ ਗੁੱਝਾ ਭੇਤ ਕੋਈ ਹੋਰ ਜੀਵ ਨਹੀਂ ਜਾਣਦਾ। ਜਿਸ ਪ੍ਰਭੂ ਦੇ ਘਰ ਵਿਚ ਸਦਾ ਆਨੰਦ ਤੇ ਖ਼ੁਸ਼ੀਆਂ ਹਨ, (ਜਗਤ ਦੇ) ਸਾਰੇ ਪਦਾਰਥ ਉਸ ਦੇ ਘਰ ਵਿਚ (ਮੌਜੂਦ) ਸੁਣੀਦੇ ਹਨ। ਰਾਜਿਆਂ ਵਿਚ ਪ੍ਰਭੂ ਆਪ ਹੀ ਰਾਜਾ ਹੈ, ਜੋਗੀਆਂ ਵਿਚ ਜੋਗੀ ਹੈ, ਤਪੀਆਂ ਵਿਚ ਆਪ ਹੀ ਵੱਡਾ ਤਪੀ ਹੈ ਤੇ ਗ੍ਰਿਹਸਤੀਆਂ ਵਿਚ ਭੀ ਆਪ ਹੀ ਗ੍ਰਿਹਸਤੀ ਹੈ। ਭਗਤ ਜਨਾਂ ਨੇ (ਉਸ ਪ੍ਰਭੂ ਨੂੰ) ਸਿਮਰ ਸਿਮਰ ਕੇ ਸੁਖ ਪਾ ਲਿਆ ਹੈ। ਹੇ ਨਾਨਕ! ਕਿਸੇ ਜੀਵ ਨੇ ਉਸ ਅਕਾਲ ਪੁਰਖ ਦਾ ਅੰਤ ਨਹੀਂ ਪਾਇਆ ॥੨॥ ਜਿਸ ਪ੍ਰਭੂ ਦੀ (ਜਗਤ ਰੂਪ) ਖੇਡ ਦਾ ਲੇਖਾ ਕੋਈ ਨਹੀਂ ਲਾ ਸਕਦਾ, ਉਸ ਨੂੰ ਖੋਜ ਖੋਜ ਕੇ ਸਾਰੇ ਦੇਵਤੇ (ਭੀ) ਥੱਕ ਗਏ ਹਨ; (ਕਿਉਂਕਿ) ਪਿਉ ਦਾ ਜਨਮ ਪੁੱਤ੍ਰ ਕੀਹ ਜਾਣਦਾ ਹੈ? (ਜਿਵੇਂ ਮਾਲਾ ਦੇ ਮਣਕੇ) ਧਾਗੇ ਵਿਚ ਪਰੋਏ ਹੁੰਦੇ ਹਨ, (ਤਿਵੇਂ) ਸਾਰੀ ਰਚਨਾ ਪ੍ਰਭੂ ਨੇ ਆਪਣੇ (ਹੁਕਮ ਰੂਪ) ਧਾਗੇ ਵਿਚ ਪ੍ਰੋ ਰੱਖੀ ਹੈ। ਜਿਨ੍ਹਾਂ ਬੰਦਿਆਂ ਨੂੰ ਪ੍ਰਭੂ ਸੋਹਣੀ ਮਤਿ ਉੱਚੀ ਸਮਝ ਤੇ ਸੁਰਤ ਜੋੜਨ ਦੀ  ਦਾਤ ਦੇਂਦਾ ਹੈ, ਉਹੀ ਸੇਵਕ ਤੇ ਦਾਸ ਉਸ ਦਾ ਨਾਮ ਸਿਮਰਦੇ ਹਨ। (ਪਰ) ਜਿਨ੍ਹਾਂ ਨੂੰ (ਮਾਇਆ ਦੇ) ਤਿੰਨ ਗੁਣਾਂ ਵਿਚ ਭਵਾਉਂਦਾ ਹੈ, ਉਹ ਜੰਮਦੇ ਮਰਦੇ ਰਹਿੰਦੇ ਹਨ ਤੇ ਮੁੜ ਮੁੜ (ਜਗਤ ਵਿਚ) ਆਉਂਦੇ ਤੇ ਜਾਂਦੇ ਰਹਿੰਦੇ ਹਨ। ਸੋਹਣੀ ਮੱਤ ਵਾਲੇ ਉਚੇ ਬੰਦਿਆਂ ਦੇ ਹਿਰਦੇ ਤ੍ਰਿਗੁਣੀ ਨੀਚ ਬੰਦਿਆਂ ਦੇ ਮਨ-ਇਹ ਸਾਰੇ ਉਸ ਪ੍ਰਭੂ ਦੇ ਆਪਣੇ ਹੀ ਟਿਕਾਣੇ ਹਨ (ਭਾਵ, ਸਭ ਵਿਚ ਵੱਸਦਾ ਹੈ)। ਹੇ ਨਾਨਕ! ਜਿਹੋ ਜਿਹੀ ਬੁੱਧ-ਮੱਤ ਦੇਂਦਾ ਹੈ, ਤਿਹੋ ਜਿਹੀ ਸਮਝ ਵਾਲਾ ਜੀਵ ਬਣ ਜਾਂਦਾ ਹੈ ॥੩॥ ਹੇ ਪ੍ਰਭੂ! ਤੂੰ, ਜਿਸ ਦੇ ਕਈ ਰੂਪ ਤੇ ਰੰਗ ਹਨ, ਕਈ ਭੇਖ ਧਾਰਦਾ ਹੈਂ (ਤੇ ਫਿਰ ਭੀ) ਇਕੋ ਤਰ੍ਹਾਂ ਦਾ ਹੈਂ। ਉਸ ਨੇ ਜਗਤ ਦਾ ਪਸਾਰਾ ਕਈ ਤਰੀਕਿਆਂ ਨਾਲ ਕੀਤਾ ਹੈ, ਪ੍ਰਭੂ ਨਾਸ-ਰਹਿਤ ਹੈ, ਤੇ ਸਭ ਥਾਈਂ ਇਕ ਆਪ ਹੀ ਆਪ ਹੈ। ਕਈ ਤਮਾਸ਼ੇ ਪ੍ਰਭੂ ਪਲਕ ਵਿਚ ਕਰ ਦੇਂਦਾ ਹੈ, ਉਹ ਪੂਰਨ ਪੁਰਖ ਸਭ ਥਾਈਂ ਵਿਆਪਕ ਹੈ। ਜਗਤ ਦੀ ਰਚਨਾ ਪ੍ਰਭੂ ਨੇ ਕਈ ਤਰੀਕਿਆਂ ਨਾਲ ਰਚੀ ਹੈ, ਆਪਣੀ (ਵਡਿਆਈ ਦਾ) ਮੁੱਲ ਉਹ ਆਪ ਹੀ ਜਾਣਦਾ ਹੈ। ਸਾਰੇ ਸਰੀਰ ਉਸ ਪ੍ਰਭੂ ਦੇ ਹੀ ਹਨ, ਸਾਰੇ ਥਾਂ ਉਸੇ ਦੇ ਹਨ। ਹੇ ਨਾਨਕ! (ਉਸ ਦਾ ਦਾਸ) ਉਸ ਦਾ ਨਾਮ ਜਪ ਜਪ ਕੇ ਜੀਊਂਦਾ ਹੈ ॥੪॥ ਸਾਰੇ ਜੀਆ ਜੰਤ ਅਕਾਲ ਪੁਰਖ ਦੇ ਆਸਰੇ ਹਨ, ਜਗਤ ਦੇ ਸਾਰੇ ਭਾਗ (ਹਿੱਸੇ) ਭੀ ਪ੍ਰਭੂ ਦੇ ਟਿਕਾਏ ਹੋਏ ਹਨ। ਵੇਦ, ਪੁਰਾਣ ਸਿਮ੍ਰਿਤੀਆਂ ਪ੍ਰਭੂ ਦੇ ਅਧਾਰ ਤੇ ਹਨ, ਗਿਆਨ ਦੀਆਂ ਗੱਲਾਂ ਸੁਣਨਾ ਤੇ ਸੁਰਤ ਜੋੜਨੀ ਭੀ ਅਕਾਲ ਪੁਰਖ ਦੇ ਆਸਰੇ ਹੀ ਹੈ। ਸਾਰੇ ਅਕਾਸ਼ ਪਤਾਲ ਪ੍ਰਭੂ-ਆਸਰੇ ਹਨ, ਸਾਰੇ ਸਰੀਰ ਹੀ ਪ੍ਰਭੂ ਦੇ ਆਧਾਰ ਤੇ ਹਨ। ਤਿੰਨੇ ਭਵਨ ਤੇ ਚੌਦਹ ਲੋਕ ਅਕਾਲ ਪੁਰਖ ਦੇ ਟਿਕਾਏ ਹੋਏ ਹਨ, ਜੀਵ ਪ੍ਰਭੂ ਵਿਚ ਜੁੜ ਕੇ ਤੇ ਉਸ ਦਾ ਨਾਮ ਕੰਨੀਂ ਸੁਣ ਕੇ ਵਿਕਾਰਾਂ ਤੋਂ ਬਚਦੇ ਹਨ। ਜਿਸ ਨੂੰ ਮੇਹਰ ਕਰ ਕੇ ਆਪਣੇ ਨਾਮ ਵਿਚ ਜੋੜਦਾ ਹੈ, ਹੇ ਨਾਨਕ! ਉਹ ਮਨੁੱਖ (ਮਾਇਆ ਦੇ ਅਸਰ ਤੋਂ ਪਰਲੇ) ਚਉਥੇ ਦਰਜੇ ਵਿਚ ਅੱਪੜ ਕੇ ਉੱਚੀ ਅਵਸਥਾ ਪ੍ਰਾਪਤ ਕਰਦਾ ਹੈ ॥੫॥ ਜਿਸ ਪ੍ਰਭੂ ਦਾ ਰੂਪ ਤੇ ਟਿਕਾਣਾ ਸਦਾ-ਥਿਰ ਰਹਿਣ ਵਾਲੇ ਹਨ, ਕੇਵਲ ਉਹੀ ਸਰਬ-ਵਿਆਪਕ ਪ੍ਰਭੂ ਸਭ ਦੇ ਸਿਰ ਤੇ ਹੈ। ਜਿਸ ਸਦਾ-ਅਟੱਲ ਅਕਾਲ ਪੁਰਖ ਦੀ ਬਾਣੀ ਸਭ ਜੀਵਾਂ ਵਿਚ ਰਮੀ ਹੋਈ ਹੈ, (ਭਾਵ, ਜੋ ਪ੍ਰਭੂ ਸਭ ਜੀਵਾਂ ਵਿਚ ਬੋਲ ਰਿਹਾ ਹੈ) ਉਸ ਦੇ ਕੰਮ ਵੀ ਅਟੱਲ ਹਨ। ਜਿਸ ਪ੍ਰਭੂ ਦੀ ਰਚਨਾ ਮੁਕੰਮਲ ਹੈ (ਭਾਵ, ਅਧੂਰੀ ਨਹੀਂ), ਜੋ (ਸਭ ਦਾ) ਮੂਲ-(ਰੂਪ) ਸਦਾ ਅਸਥਿਰ ਹੈ, ਜਿਸ ਦੀ ਪੈਦਾਇਸ਼ ਭੀ ਮੁਕੰਮਲ ਹੈ, ਉਸ ਦੀ ਬਖ਼ਸ਼ਸ਼ ਸਦਾ ਕਾਇਮ ਹੈ। ਪ੍ਰਭੂ ਦੀ ਮਹਾ ਪਵ੍ਰਿਤ ਰਜ਼ਾ ਹੈ, ਜਿਸ ਜੀਵ ਨੂੰ (ਰਜ਼ਾ ਦੀ) ਸਮਝ ਦੇਂਦਾ ਹੈ, ਉਸ ਨੂੰ (ਉਹ ਰਜ਼ਾ) ਪੂਰਨ ਤੌਰ ਤੇ ਸੁਖਦਾਈ (ਲੱਗਦੀ ਹੈ)। ਪ੍ਰਭੂ ਦਾ ਸਦਾ-ਥਿਰ ਰਹਿਣ ਵਾਲਾ ਨਾਮ ਸੁਖ-ਦਾਤਾ ਹੈ। ਹੇ ਨਾਨਕ! (ਜੀਵ ਨੂੰ) ਇਹ ਅਟੱਲ ਸਿਦਕ ਸਤਿਗੁਰੂ ਤੋਂ ਮਿਲਦਾ ਹੈ ॥੬॥ ਗੁਰੂ ਦਾ ਉਪਦੇਸ਼ ਅਟੱਲ ਬਚਨ ਹਨ, ਜਿਨ੍ਹਾਂ ਦੇ ਹਿਰਦੇ ਵਿਚ (ਇਸ ਉਪਦੇਸ਼ ਦਾ) ਪ੍ਰਵੇਸ਼ ਹੁੰਦਾ ਹੈ, ਉਹ ਭੀ ਅਟੱਲ (ਭਾਵ, ਜਨਮ ਮਰਨ ਤੋਂ ਰਹਿਤ) ਹੋ ਜਾਂਦੇ ਹਨ। ਜੇ ਕਿਸੇ ਮਨੁੱਖ ਨੂੰ ਸਦਾ-ਥਿਰ ਰਹਿਣ ਵਾਲੇ ਪ੍ਰਭੂ ਦੇ ਪਿਆਰ ਦੀ ਸੂਝ ਆ ਜਾਏ, ਤਾਂ ਨਾਮ ਜਪ ਕੇ ਉਹ ਉੱਚੀ ਅਵਸਥਾ ਹਾਸਲ ਕਰ ਲੈਂਦਾ ਹੈ। ਪ੍ਰਭੂ ਆਪ ਸਦਾ ਕਾਇਮ ਰਹਿਣ ਵਾਲਾ ਹੈ, ਉਸ ਦਾ ਪੈਦਾ ਕੀਤਾ ਹੋਇਆ ਜਗਤ ਭੀ ਸੱਚ ਮੁੱਚ ਹੋਂਦ ਵਾਲਾ ਹੈ, (ਭਾਵ, ਮਿਥਿਆ ਨਹੀਂ) ਪ੍ਰਭੂ ਆਪਣੀ ਅਵਸਥਾ ਤੇ ਮਰਯਾਦਾ ਆਪ ਜਾਣਦਾ ਹੈ। ਜਿਸ ਪ੍ਰਭੂ ਦਾ ਇਹ ਜਗਤ ਹੈ ਉਹ ਆਪ ਇਸ ਨੂੰ ਬਨਾਉਣ ਵਾਲਾ ਹੈ, ਕਿਸੇ ਹੋਰ ਨੂੰ ਇਸ ਜਗਤ ਦਾ ਖ਼ਿਆਲ ਰੱਖਣ ਵਾਲਾ (ਭੀ) ਨਾਹ ਸਮਝੋ। ਕਰਤਾਰ (ਦੀ ਬਜ਼ੁਰਗੀ) ਦਾ ਅੰਦਾਜ਼ਾ ਉਸ ਦਾ ਪੈਦਾ ਕੀਤਾ ਬੰਦਾ ਨਹੀਂ ਲਾ ਸਕਦਾ। ਹੇ ਨਾਨਕ! ਉਹੀ ਕੁਝ ਵਰਤਦਾ ਹੈ ਜੋ ਉਸ ਪ੍ਰਭੂ ਨੂੰ ਭਾਉਂਦਾ ਹੈ ॥੭॥ ਜਿਸ ਜਿਸ ਮਨੁੱਖ ਨੇ (ਪ੍ਰਭੂ ਦੀ ਬਜ਼ੁਰਗੀ ਨੂੰ) ਸਮਝਿਆ ਹੈ, ਉਸ ਉਸ ਨੂੰ ਆਨੰਦ ਆਇਆ ਹੈ, (ਵਡਿਆਈ ਤੱਕ ਕੇ) ਉਹ ਬੜੇ ਹੈਰਾਨ ਤੇ ਅਸਚਰਜ ਹੁੰਦੇ ਹਨ। ਪ੍ਰਭੂ ਦੇ ਦਾਸ ਪ੍ਰਭੂ ਦੇ ਪਿਆਰ ਵਿਚ ਮਸਤ ਰਹਿੰਦੇ ਹਨ, ਤੇ ਸਤਿਗੁਰੂ ਦੇ ਉਪਦੇਸ਼ ਦੀ ਬਰਕਤਿ ਨਾਲ (ਨਾਮ-) ਪਦਾਰਥ ਹਾਸਲ ਕਰ ਲੈਂਦੇ ਹਨ। ਉਹ (ਸੇਵਕ ਖ਼ੁਦ) ਨਾਮ ਦੀ  ਦਾਤ ਵੰਡਦੇ ਹਨ, ਤੇ (ਜੀਵਾਂ ਦੇ) ਦੁੱਖ ਕੱਟਦੇ ਹਨ, ਉਹਨਾਂ ਦੀ ਸੰਗਤਿ ਨਾਲ ਜਗਤ ਦੇ ਜੀਵ (ਸੰਸਾਰ-ਸਮੁੰਦਰ ਤੋਂ) ਤਰ ਜਾਂਦੇ ਹਨ। ਇਹੋ ਜਿਹੇ ਸੇਵਕਾਂ ਦਾ ਜੋ ਸੇਵਕ ਬਣਦਾ ਹੈ ਉਹ ਵੱਡੇ ਭਾਗਾਂ ਵਾਲਾ ਹੁੰਦਾ ਹੈ, ਉਹਨਾਂ ਦੀ ਸੰਗਤਿ ਵਿਚ ਰਿਹਾਂ ਇਕ ਅਕਾਲ ਪੁਰਖ ਨਾਲ ਸੁਰਤ ਜੁੜਦੀ ਹੈ। (ਪ੍ਰਭੂ ਦਾ) ਸੇਵਕ ਪ੍ਰਭੂ ਦੇ ਗੁਣ ਗਾਉਂਦਾ ਹੈ, ਤੇ ਸਿਫ਼ਤ-ਸਾਲਾਹ ਕਰਦਾ ਹੈ। ਹੇ ਨਾਨਕ! ਸਤਿਗੁਰੂ ਦੀ ਕਿਰਪਾ ਨਾਲ ਉਹ (ਪ੍ਰਭੂ ਦਾ ਨਾਮ-ਰੂਪੀ) ਫਲ ਪਾ ਲੈਂਦਾ ਹੈ ॥੮॥੧੬॥ ਪ੍ਰਭੂ ਮੁੱਢ ਤੋਂ ਹੀ ਹੋਂਦ ਵਾਲਾ ਹੈ, ਜੁਗਾਂ ਦੇ ਸ਼ੁਰੂ ਤੋਂ ਮੌਜੂਦ ਹੈ। ਐਸ ਵੇਲੇ ਭੀ ਮੌਜੂਦ ਹੈ, ਹੇ ਨਾਨਕ! ਅਗਾਂਹ ਨੂੰ ਭੀ ਸਦਾ ਕਾਇਮ ਰਹੇਗਾ ॥੧॥`
      },
      {
        number: 17,
        sanskrit: `ਸਲੋਕੁ ॥
ਆਦਿ ਸਚੁ ਜੁਗਾਦਿ ਸਚੁ ॥
ਹੈ ਭਿ ਸਚੁ ਨਾਨਕ ਹੋਸੀ ਭਿ ਸਚੁ ॥੧॥
ਅਸਟਪਦੀ ॥
ਚਰਨ ਸਤਿ ਸਤਿ ਪਰਸਨਹਾਰ ॥
ਪੂਜਾ ਸਤਿ ਸਤਿ ਸੇਵਦਾਰ ॥
ਦਰਸਨੁ ਸਤਿ ਸਤਿ ਪੇਖਨਹਾਰ ॥
ਨਾਮੁ ਸਤਿ ਸਤਿ ਧਿਆਵਨਹਾਰ ॥
ਆਪਿ ਸਤਿ ਸਤਿ ਸਭ ਧਾਰੀ ॥
ਆਪੇ ਗੁਣ ਆਪੇ ਗੁਣਕਾਰੀ ॥
ਸਬਦੁ ਸਤਿ ਸਤਿ ਪ੍ਰਭੁ ਬਕਤਾ ॥
ਸੁਰਤਿ ਸਤਿ ਸਤਿ ਜਸੁ ਸੁਨਤਾ ॥
ਬੁਝਨਹਾਰ ਕਉ ਸਤਿ ਸਭ ਹੋਇ ॥
ਨਾਨਕ ਸਤਿ ਸਤਿ ਪ੍ਰਭੁ ਸੋਇ ॥੧॥
ਸਤਿ ਸਰੂਪੁ ਰਿਦੈ ਜਿਨਿ ਮਾਨਿਆ ॥
ਕਰਨ ਕਰਾਵਨ ਤਿਨਿ ਮੂਲੁ ਪਛਾਨਿਆ ॥
ਜਾ ਕੈ ਰਿਦੈ ਬਿਸ੍ਵਾਸੁ ਪ੍ਰਭ ਆਇਆ ॥
ਤਤੁ ਗਿਆਨੁ ਤਿਸੁ ਮਨਿ ਪ੍ਰਗਟਾਇਆ ॥
ਭੈ ਤੇ ਨਿਰਭਉ ਹੋਇ ਬਸਾਨਾ ॥
ਜਿਸ ਤੇ ਉਪਜਿਆ ਤਿਸੁ ਮਾਹਿ ਸਮਾਨਾ ॥
ਬਸਤੁ ਮਾਹਿ ਲੇ ਬਸਤੁ ਗਡਾਈ ॥
ਤਾ ਕਉ ਭਿੰਨ ਨ ਕਹਨਾ ਜਾਈ ॥
ਬੂਝੈ ਬੂਝਨਹਾਰੁ ਬਿਬੇਕ ॥
ਨਾਰਾਇਨ ਮਿਲੇ ਨਾਨਕ ਏਕ ॥੨॥
ਠਾਕੁਰ ਕਾ ਸੇਵਕੁ ਆਗਿਆਕਾਰੀ ॥
ਠਾਕੁਰ ਕਾ ਸੇਵਕੁ ਸਦਾ ਪੂਜਾਰੀ ॥
ਠਾਕੁਰ ਕੇ ਸੇਵਕ ਕੈ ਮਨਿ ਪਰਤੀਤਿ ॥
ਠਾਕੁਰ ਕੇ ਸੇਵਕ ਕੀ ਨਿਰਮਲ ਰੀਤਿ ॥
ਠਾਕੁਰ ਕਉ ਸੇਵਕੁ ਜਾਨੈ ਸੰਗਿ ॥
ਪ੍ਰਭ ਕਾ ਸੇਵਕੁ ਨਾਮ ਕੈ ਰੰਗਿ ॥
ਸੇਵਕ ਕਉ ਪ੍ਰਭ ਪਾਲਨਹਾਰਾ ॥
ਸੇਵਕ ਕੀ ਰਾਖੈ ਨਿਰੰਕਾਰਾ ॥
ਸੋ ਸੇਵਕੁ ਜਿਸੁ ਦਇਆ ਪ੍ਰਭੁ ਧਾਰੈ ॥
ਨਾਨਕ ਸੋ ਸੇਵਕੁ ਸਾਸਿ ਸਾਸਿ ਸਮਾਰੈ ॥੩॥
ਅਪੁਨੇ ਜਨ ਕਾ ਪਰਦਾ ਢਾਕੈ ॥
ਅਪਨੇ ਸੇਵਕ ਕੀ ਸਰਪਰ ਰਾਖੈ ॥
ਅਪਨੇ ਦਾਸ ਕਉ ਦੇਇ ਵਡਾਈ ॥
ਅਪਨੇ ਸੇਵਕ ਕਉ ਨਾਮੁ ਜਪਾਈ ॥
ਅਪਨੇ ਸੇਵਕ ਕੀ ਆਪਿ ਪਤਿ ਰਾਖੈ ॥
ਤਾ ਕੀ ਗਤਿ ਮਿਤਿ ਕੋਇ ਨ ਲਾਖੈ ॥
ਪ੍ਰਭ ਕੇ ਸੇਵਕ ਕਉ ਕੋ ਨ ਪਹੂਚੈ ॥
ਪ੍ਰਭ ਕੇ ਸੇਵਕ ਊਚ ਤੇ ਊਚੇ ॥
ਜੋ ਪ੍ਰਭਿ ਅਪਨੀ ਸੇਵਾ ਲਾਇਆ ॥
ਨਾਨਕ ਸੋ ਸੇਵਕੁ ਦਹ ਦਿਸਿ ਪ੍ਰਗਟਾਇਆ ॥੪॥
ਨੀਕੀ ਕੀਰੀ ਮਹਿ ਕਲ ਰਾਖੈ ॥
ਭਸਮ ਕਰੈ ਲਸਕਰ ਕੋਟਿ ਲਾਖੈ ॥
ਜਿਸ ਕਾ ਸਾਸੁ ਨ ਕਾਢਤ ਆਪਿ ॥
ਤਾ ਕਉ ਰਾਖਤ ਦੇ ਕਰਿ ਹਾਥ ॥
ਮਾਨਸ ਜਤਨ ਕਰਤ ਬਹੁ ਭਾਤਿ ॥
ਤਿਸ ਕੇ ਕਰਤਬ ਬਿਰਥੇ ਜਾਤਿ ॥
ਮਾਰੈ ਨ ਰਾਖੈ ਅਵਰੁ ਨ ਕੋਇ ॥
ਸਰਬ ਜੀਆ ਕਾ ਰਾਖਾ ਸੋਇ ॥
ਕਾਹੇ ਸੋਚ ਕਰਹਿ ਰੇ ਪ੍ਰਾਣੀ ॥
ਜਪਿ ਨਾਨਕ ਪ੍ਰਭ ਅਲਖ ਵਿਡਾਣੀ ॥੫॥
ਬਾਰੰ ਬਾਰ ਬਾਰ ਪ੍ਰਭੁ ਜਪੀਐ ॥
ਪੀ ਅੰਮ੍ਰਿਤੁ ਇਹੁ ਮਨੁ ਤਨੁ ਧ੍ਰਪੀਐ ॥
ਨਾਮ ਰਤਨੁ ਜਿਨਿ ਗੁਰਮੁਖਿ ਪਾਇਆ ॥
ਤਿਸੁ ਕਿਛੁ ਅਵਰੁ ਨਾਹੀ ਦ੍ਰਿਸਟਾਇਆ ॥
ਨਾਮੁ ਧਨੁ ਨਾਮੋ ਰੂਪੁ ਰੰਗੁ ॥
ਨਾਮੋ ਸੁਖੁ ਹਰਿ ਨਾਮ ਕਾ ਸੰਗੁ ॥
ਨਾਮ ਰਸਿ ਜੋ ਜਨ ਤ੍ਰਿਪਤਾਨੇ ॥
ਮਨ ਤਨ ਨਾਮਹਿ ਨਾਮਿ ਸਮਾਨੇ ॥
ਊਠਤ ਬੈਠਤ ਸੋਵਤ ਨਾਮ ॥
ਕਹੁ ਨਾਨਕ ਜਨ ਕੈ ਸਦ ਕਾਮ ॥੬॥
ਬੋਲਹੁ ਜਸੁ ਜਿਹਬਾ ਦਿਨੁ ਰਾਤਿ ॥
ਪ੍ਰਭਿ ਅਪਨੈ ਜਨ ਕੀਨੀ ਦਾਤਿ ॥
ਕਰਹਿ ਭਗਤਿ ਆਤਮ ਕੈ ਚਾਇ ॥
ਪ੍ਰਭ ਅਪਨੇ ਸਿਉ ਰਹਹਿ ਸਮਾਇ ॥
ਜੋ ਹੋਆ ਹੋਵਤ ਸੋ ਜਾਨੈ ॥
ਪ੍ਰਭ ਅਪਨੇ ਕਾ ਹੁਕਮੁ ਪਛਾਨੈ ॥
ਤਿਸ ਕੀ ਮਹਿਮਾ ਕਉਨ ਬਖਾਨਉ ॥
ਤਿਸ ਕਾ ਗੁਨੁ ਕਹਿ ਏਕ ਨ ਜਾਨਉ ॥
ਆਠ ਪਹਰ ਪ੍ਰਭ ਬਸਹਿ ਹਜੂਰੇ ॥
ਕਹੁ ਨਾਨਕ ਸੇਈ ਜਨ ਪੂਰੇ ॥੭॥
ਮਨ ਮੇਰੇ ਤਿਨ ਕੀ ਓਟ ਲੇਹਿ ॥
ਮਨੁ ਤਨੁ ਅਪਨਾ ਤਿਨ ਜਨ ਦੇਹਿ ॥
ਜਿਨਿ ਜਨਿ ਅਪਨਾ ਪ੍ਰਭੂ ਪਛਾਤਾ ॥
ਸੋ ਜਨੁ ਸਰਬ ਥੋਕ ਕਾ ਦਾਤਾ ॥
ਤਿਸ ਕੀ ਸਰਨਿ ਸਰਬ ਸੁਖ ਪਾਵਹਿ ॥
ਤਿਸ ਕੈ ਦਰਸਿ ਸਭ ਪਾਪ ਮਿਟਾਵਹਿ ॥
ਅਵਰ ਸਿਆਨਪ ਸਗਲੀ ਛਾਡੁ ॥
ਤਿਸੁ ਜਨ ਕੀ ਤੂ ਸੇਵਾ ਲਾਗੁ ॥
ਆਵਨੁ ਜਾਨੁ ਨ ਹੋਵੀ ਤੇਰਾ ॥
ਨਾਨਕ ਤਿਸੁ ਜਨ ਕੇ ਪੂਜਹੁ ਸਦ ਪੈਰਾ ॥੮॥੧੭॥
ਸਲੋਕੁ ॥
ਸਤਿ ਪੁਰਖੁ ਜਿਨਿ ਜਾਨਿਆ ਸਤਿਗੁਰੁ ਤਿਸ ਕਾ ਨਾਉ ॥
ਤਿਸ ਕੈ ਸੰਗਿ ਸਿਖੁ ਉਧਰੈ ਨਾਨਕ ਹਰਿ ਗੁਨ ਗਾਉ ॥੧॥`,
        transliteration: `salok |
aad sach jugaad sach |
hai bhi sach naanak hosee bhi sach |1|
asattapadee |
charan sat sat parasanahaar |
poojaa sat sat sevadaar |
darasan sat sat pekhanahaar |
naam sat sat dhiaavanahaar |
aap sat sat sabh dhaaree |
aape gun aape gunakaaree |
sabad sat sat prabh bakataa |
surat sat sat jas sunataa |
bujhanahaar kau sat sabh hoe |
naanak sat sat prabh soe |1|
sat saroop ridai jin maaniaa |
karan karaavan tin mool pachhaaniaa |
jaa kai ridai bisvaas prabh aaeaa |
tat giaan tis man pragattaaeaa |
bhai te nirbhau hoe basaanaa |
jis te upajiaa tis maeh samaanaa |
basat maeh le basat gaddaaee |
taa kau bhin na kahanaa jaaee |
boojhai boojhanahaar bibek |
naaraaein mile naanak ek |2|
tthaakur kaa sevak aagiaakaaree |
tthaakur kaa sevak sadaa poojaaree |
tthaakur ke sevak kai man parateet |
tthaakur ke sevak kee niramal reet |
tthaakur kau sevak jaanai sang |
prabh kaa sevak naam kai rang |
sevak kau prabh paalanahaaraa |
sevak kee raakhai nirankaaraa |
so sevak jis deaa prabh dhaarai |
naanak so sevak saas saas samaarai |3|
apune jan kaa paradaa dtaakai |
apane sevak kee sarapar raakhai |
apane daas kau dee vaddaaee |
apane sevak kau naam japaaee |
apane sevak kee aap pat raakhai |
taa kee gat mit koe na laakhai |
prabh ke sevak kau ko na pahoochai |
prabh ke sevak aooch te aooche |
jo prabh apanee sevaa laaeaa |
naanak so sevak deh dis pragattaaeaa |4|
neekee keeree meh kal raakhai |
bhasam karai lasakar kott laakhai |
jis kaa saas na kaadtat aap |
taa kau raakhat de kar haath |
maanas jatan karat bahu bhaat |
tis ke karatab birathe jaat |
maarai na raakhai avar na koe |
sarab jeea kaa raakhaa soe |
kaahe soch kareh re praanee |
jap naanak prabh alakh viddaanee |5|
baaran baar baar prabh japeeai |
pee amrit ihu man tan dhrapeeai |
naam ratan jin guramukh paaeaa |
tis kichh avar naahee drisattaaeaa |
naam dhan naamo roop rang |
naamo sukh har naam kaa sang |
naam ras jo jan tripataane |
man tan naameh naam samaane |
aootthat baitthat sovat naam |
kahu naanak jan kai sad kaam |6|
bolahu jas jihabaa din raat |
prabh apanai jan keenee daat |
kareh bhagat aatam kai chaae |
prabh apane siau raheh samaae |
jo hoaa hovat so jaanai |
prabh apane kaa hukam pachhaanai |
tis kee mahimaa kaun bakhaanau |
tis kaa gun keh ek na jaanau |
aatth pehar prabh baseh hajoore |
kahu naanak seee jan poore |7|
man mere tin kee ott lehi |
man tan apanaa tin jan dehi |
jin jan apanaa prabhoo pachhaataa |
so jan sarab thok kaa daataa |
tis kee saran sarab sukh paaveh |
tis kai daras sabh paap mittaaveh |
avar siaanap sagalee chhaadd |
tis jan kee too sevaa laag |
aavan jaan na hovee teraa |
naanak tis jan ke poojahu sad pairaa |8|17|
salok |
sat purakh jin jaaniaa satigur tis kaa naau |
tis kai sang sikh udharai naanak har gun gaau |1|`,
        meaning: `Salok: True in the beginning, True throughout the ages, True here and now. O Nanak, He shall forever be True. ||1|| Ashtapadee: His Lotus Feet are True, and True are those who touch Them. His devotional worship is True, and True are those who worship Him. The Blessing of His Vision is True, and True are those who behold it. His Naam is True, and True are those who meditate on it. He Himself is True, and True is all that He sustains. He Himself is virtuous goodness, and He Himself is the Bestower of virtue. The Word of His Shabad is True, and True are those who speak of God. Those ears are True, and True are those who listen to His Praises. All is True to one who understands. O Nanak, True, True is He, the Lord God. ||1|| One who believes in the Embodiment of Truth with all his heart recognizes the Cause of causes as the Root of all. One whose heart is filled with faith in God the essence of spiritual wisdom is revealed to his mind. Coming out of fear, he comes to live without fear. He is absorbed into the One, from whom he originated. When something blends with its own, it cannot be said to be separate from it. This is understood only by one of discerning understanding. Meeting with the Lord, O Nanak, he becomes one with Him. ||2|| The servant is obedient to his Lord and Master. The servant worships his Lord and Master forever. The servant of the Lord Master has faith in his mind. The servant of the Lord Master lives a pure lifestyle. The servant of the Lord Master knows that the Lord is with him. God's servant is attuned to the Naam, the Name of the Lord. God is the Cherisher of His servant. The Formless Lord preserves His servant. Unto His servant, God bestows His Mercy. O Nanak, that servant remembers Him with each and every breath. ||3|| He covers the faults of His servant. He surely preserves the honor of His servant. He blesses His slave with greatness. He inspires His servant to chant the Naam, the Name of the Lord. He Himself preserves the honor of His servant. No one knows His state and extent. No one is equal to the servant of God. The servant of God is the highest of the high. One whom God applies to His own service, O Nanak - that servant is famous in the ten directions. ||4|| He infuses His Power into the tiny ant; it can then reduce the armies of millions to ashes Those whose breath of life He Himself does not take away He preserves them, and holds out His Hands to protect them. You may make all sorts of efforts, but these attempts are in vain. No one else can kill or preserve He is the Protector of all beings. So why are you so anxious, O mortal? Meditate, O Nanak, on God, the invisible, the wonderful! ||5|| Time after time, again and again, meditate on God. Drinking in this Nectar, this mind and body are satisfied. The jewel of the Naam is obtained by the Gurmukhs; they see no other than God. Unto them, the Naam is wealth, the Naam is beauty and delight. The Naam is peace, the Lord's Name is their companion. Those who are satisfied by the essence of the Naam their minds and bodies are drenched with the Naam. While standing up, sitting down and sleeping, the Naam, says Nanak, is forever the occupation of God's humble servant. ||6|| Chant His Praises with your tongue, day and night. God Himself has given this gift to His servants. Performing devotional worship with heart-felt love, they remain absorbed in God Himself. They know the past and the present. They recognize God's Own Command. Who can describe His Glory? I cannot describe even one of His virtuous qualities. Those who dwell in God's Presence, twenty-four hours a day - says Nanak, they are the perfect persons. ||7|| O my mind, seek their protection; give your mind and body to those humble beings. Those humble beings who recognizes God are the givers of all things. In His Sanctuary, all comforts are obtained. By the Blessing of His Darshan, all sins are erased. So renounce all other clever devices, and enjoin yourself to the service of those servants. Your comings and goings shall be ended. O Nanak, worship the feet of God's humble servants forever. ||8||17|| Salok: The one who knows the True Lord God, is called the True Guru. In His Company, the Sikh is saved, O Nanak, singing the Glorious Praises of the Lord. ||1||`,
        meaning_pa: `ਪ੍ਰਭੂ ਮੁੱਢ ਤੋਂ ਹੀ ਹੋਂਦ ਵਾਲਾ ਹੈ, ਜੁਗਾਂ ਦੇ ਸ਼ੁਰੂ ਤੋਂ ਮੌਜੂਦ ਹੈ। ਐਸ ਵੇਲੇ ਭੀ ਮੌਜੂਦ ਹੈ, ਹੇ ਨਾਨਕ! ਅਗਾਂਹ ਨੂੰ ਭੀ ਸਦਾ ਕਾਇਮ ਰਹੇਗਾ ॥੧॥ ਪ੍ਰਭੂ ਦੇ ਚਰਨ ਸਦਾ-ਥਿਰ ਹਨ, ਚਰਨਾਂ ਨੂੰ ਛੋਹਣ ਵਾਲੇ ਸੇਵਕ ਭੀ ਅਟੱਲ ਹੋ ਜਾਂਦੇ ਹਨ; ਪ੍ਰਭੂ ਦੀ ਪੂਜਾ ਇਕ ਸਦਾ ਨਿਭਣ ਵਾਲਾ ਕੰਮ ਹੈ, (ਸੋ) ਪੂਜਾ ਕਰਨ ਵਾਲੇ ਸਦਾ ਲਈ ਅਟੱਲ ਹੋ ਜਾਂਦੇ ਹਨ। ਪ੍ਰਭੂ ਦਾ ਦੀਦਾਰ ਸਤਿ-(ਕਰਮ) ਹੈ, ਦੀਦਾਰ ਕਰਨ ਵਾਲੇ ਭੀ ਜਨਮ ਮਰਨ ਤੋਂ ਰਹਿਤ ਹੋ ਜਾਂਦੇ ਹਨ; ਪ੍ਰਭੂ ਦਾ ਨਾਮ ਸਦਾ ਅਟੱਲ ਹੈ, ਸਿਮਰਨ ਵਾਲੇ ਭੀ ਥਿਰ ਹਨ। ਪ੍ਰਭੂ ਆਪ ਸਦਾ ਹੋਂਦ ਵਾਲਾ ਹੈ, ਉਸ ਦੀ ਟਿਕਾਈ ਹੋਈ ਰਚਨਾ ਭੀ ਹੋਂਦ ਵਾਲੀ ਹੈ; ਪ੍ਰਭੂ ਆਪ ਗੁਣ (-ਰੂਪ) ਹੈ, ਆਪ ਹੀ ਗੁਣ ਪੈਦਾ ਕਰਨ ਵਾਲਾ ਹੈ। (ਪ੍ਰਭੂ ਦੀ ਸਿਫ਼ਤ-ਸਾਲਾਹ ਦਾ) ਸ਼ਬਦ ਸਦਾ ਕਾਇਮ ਹੈ, ਸ਼ਬਦ ਨੂੰ ਉੱਚਾਰਨ ਵਾਲਾ ਵੀ ਥਿਰ ਹੋ ਜਾਂਦਾ ਹੈ, ਪ੍ਰਭੂ ਵਿਚ ਸੁਰਤ ਜੋੜਨੀ ਸਤਿ (-ਕਰਮ ਹੈ) ਪ੍ਰਭੂ ਦਾ ਜਸ ਸੁਣਨ ਵਾਲਾ ਭੀ ਸਤਿ ਹੈ। (ਪ੍ਰਭੂ ਦੀ ਹੋਂਦ) ਸਮਝਣ ਵਾਲੇ ਨੂੰ ਉਸ ਦਾ ਰਚਿਆ ਜਗਤ ਭੀ ਹਸਤੀ ਵਾਲਾ ਦਿੱਸਦਾ ਹੈ (ਭਾਵ, ਮਿਥਿਆ ਨਹੀਂ ਭਾਸਦਾ); ਹੇ ਨਾਨਕ! ਪ੍ਰਭੂ ਆਪ ਸਦਾ ਹੀ ਥਿਰ ਰਹਿਣ ਵਾਲਾ ਹੈ ॥੧॥ ਜਿਸ ਮਨੁੱਖ ਨੇ ਅਟੱਲ ਪ੍ਰਭੂ ਦੀ ਮੂਰਤਿ ਨੂੰ ਸਦਾ ਮਨ ਵਿਚ ਟਿਕਾਇਆ ਹੈ, ਉਸ ਨੇ ਸਭ ਕੁਝ ਕਰਨ ਵਾਲੇ ਤੇ (ਜੀਵਾਂ ਪਾਸੋਂ) ਕਰਾਉਣ ਵਾਲੇ (ਜਗਤ ਦੇ) ਮੂਲ ਨੂੰ ਪਛਾਣ ਲਿਆ ਹੈ। ਜਿਸ ਮਨੁੱਖ ਦੇ ਹਿਰਦੇ ਵਿਚ ਪ੍ਰਭੂ (ਦੀ ਹਸਤੀ) ਦਾ ਯਕੀਨ ਬੱਝ ਗਿਆ ਹੈ, ਉਸ ਦੇ ਮਨ ਵਿਚ ਸੱਚਾ ਗਿਆਨ ਪਰਗਟ ਹੋ ਗਿਆ ਹੈ; (ਉਹ ਮਨੁੱਖ) (ਜਗਤ ਦੇ ਹਰੇਕ) ਡਰ ਤੋਂ (ਰਹਿਤ ਹੋ ਕੇ) ਨਿਡਰ ਹੋ ਕੇ ਵੱਸਦਾ ਹੈ, (ਕਿਉਂਕਿ) ਉਹ ਸਦਾ ਉਸ ਪ੍ਰਭੂ ਵਿਚ ਲੀਨ ਰਹਿੰਦਾ ਹੈ ਜਿਸ ਤੋਂ ਉਹ ਪੈਦਾ ਹੋਇਆ ਹੈ; (ਜਿਵੇਂ) ਇਕ ਚੀਜ਼ ਲੈ ਕੇ (ਉਸ ਕਿਸਮ ਦੀ) ਚੀਜ਼ ਵਿਚ ਰਲਾ ਦਿੱਤੀ ਜਾਏ (ਤੇ ਦੋਹਾਂ ਦਾ ਕੋਈ ਫ਼ਰਕ ਨਹੀਂ ਰਹਿ ਜਾਂਦਾ, ਤਿਵੇਂ ਜੋ ਮਨੁੱਖ ਪ੍ਰਭੂ-ਚਰਨਾਂ ਵਿਚ ਲੀਨ ਹੈ) ਉਸ ਨੂੰ ਪ੍ਰਭੂ ਤੋਂ ਵੱਖਰਾ ਨਹੀਂ ਕਿਹਾ ਜਾ ਸਕਦਾ। (ਪਰ) ਇਸ ਵਿਚਾਰ ਨੂੰ ਵਿਚਾਰਨ ਵਾਲਾ (ਕੋਈ ਵਿਰਲਾ) ਸਮਝਦਾ ਹੈ। ਹੇ ਨਾਨਕ! ਜੋ ਜੀਵ ਪ੍ਰਭੂ ਨੂੰ ਮਿਲ ਪਏ ਹਨ ਉਹ ਉਸ ਦੇ ਨਾਲ ਇਕ ਰੂਪ ਹੋ ਗਏ ਹਨ ॥੨॥ ਪ੍ਰਭੂ ਦਾ ਸੇਵਕ ਪ੍ਰਭੂ ਦੇ ਹੁਕਮ ਵਿਚ ਤੁਰਦਾ ਹੈ, ਤੇ ਸਦਾ ਉਸ ਦੀ ਪੂਜਾ ਕਰਦਾ ਹੈ। ਅਕਾਲ ਪੁਰਖ ਦੇ ਸੇਵਕ ਦੇ ਮਨ ਵਿਚ (ਉਸ ਦੀ ਹਸਤੀ ਦਾ) ਵਿਸ਼ਵਾਸ ਰਹਿੰਦਾ ਹੈ, (ਤਾਹੀਏਂ) ਉਸ ਦੀ ਜ਼ਿੰਦਗੀ ਦੀ ਸੁੱਚੀ ਮਰਯਾਦਾ ਹੁੰਦੀ ਹੈ। ਸੇਵਕ ਆਪਣੇ ਮਾਲਕ-ਪ੍ਰਭੂ ਨੂੰ (ਹਰ ਵੇਲੇ ਆਪਣੇ) ਨਾਲ ਜਾਣਦਾ ਹੈ, ਅਤੇ ਉਸ ਦੇ ਨਾਮ ਦੀ ਮੌਜ ਵਿਚ ਰਹਿੰਦਾ ਹੈ। ਪ੍ਰਭੂ ਆਪਣੇ ਸੇਵਕ ਨੂੰ ਸਦਾ ਪਾਲਣ ਦੇ ਸਮਰੱਥ ਹੈ, ਤੇ ਆਪਣੇ ਸੇਵਕ ਦੀ (ਸਦਾ) ਲਾਜ ਰੱਖਦਾ ਹੈ। (ਪਰ) ਸੇਵਕ ਉਹੀ ਮਨੁੱਖ (ਬਣ ਸਕਦਾ) ਹੈ ਜਿਸ ਤੇ ਪ੍ਰਭੂ ਆਪ ਮੇਹਰ ਕਰਦਾ ਹੈ; ਹੇ ਨਾਨਕ! ਅਜੇਹਾ ਸੇਵਕ ਪ੍ਰਭੂ ਨੂੰ ਦਮ-ਬ-ਦਮ ਯਾਦ ਰੱਖਦਾ ਹੈ ॥੩॥ ਪ੍ਰਭੂ ਆਪਣੇ ਸੇਵਕ ਦਾ ਪਰਦਾ ਢੱਕਦਾ ਹੈ, ਤੇ ਉਸ ਦੀ ਲਾਜ ਜ਼ਰੂਰ ਰੱਖਦਾ ਹੈ। ਪ੍ਰਭੂ ਆਪਣੇ ਸੇਵਕ ਨੂੰ ਮਾਣ ਬਖ਼ਸ਼ਦਾ ਹੈ, ਤੇ ਉਸ ਨੂੰ ਆਪਣਾ ਨਾਮ ਜਪਾਉਂਦਾ ਹੈ। ਪ੍ਰਭੂ ਆਪਣੇ ਸੇਵਕ ਦੀ ਇੱਜ਼ਤ ਆਪ ਰੱਖਦਾ ਹੈ, ਉਸ ਦੀ ਉੱਚ-ਅਵਸਥਾ ਤੇ ਉਸ ਦੇ ਵਡੱਪਣ ਦਾ ਅੰਦਾਜ਼ਾ ਕੋਈ ਨਹੀਂ ਲਗਾ ਸਕਦਾ। ਕੋਈ ਮਨੁੱਖ ਪ੍ਰਭੂ ਦੇ ਸੇਵਕ ਦੀ ਬਰਾਬਰੀ ਨਹੀਂ ਕਰ ਸਕਦਾ, (ਕਿਉਂਕਿ) ਪ੍ਰਭੂ ਦੇ ਸੇਵਕ ਉੱਚਿਆਂ ਤੋਂ ਉਚੇ ਹੁੰਦੇ ਹਨ। (ਪਰ) ਜਿਸ ਨੂੰ ਪ੍ਰਭੂ ਨੇ ਆਪ ਆਪਣੀ ਸੇਵਾ ਵਿਚ ਲਾਇਆ ਹੈ, ਹੇ ਨਾਨਕ! ਉਹ ਸੇਵਕ ਸਾਰੇ ਜਗਤ ਵਿਚ ਪਰਗਟ ਹੋਇਆ ਹੈ ॥੪॥ (ਜਿਸ) ਨਿੱਕੀ ਜਿਹੀ ਕੀੜੀ ਵਿਚ (ਪ੍ਰਭੂ) ਤਾਕਤ ਭਰਦਾ ਹੈ, (ਉਹ ਕੀੜੀ) ਲੱਖਾਂ ਕਰੋੜਾਂ ਲਸ਼ਕਰਾਂ ਨੂੰ ਸੁਆਹ ਕਰ ਦੇਂਦੀ ਹੈ। ਜਿਸ ਜੀਵ ਦਾ ਸ੍ਵਾਸ ਪ੍ਰਭੂ ਆਪ ਨਹੀਂ ਕੱਢਦਾ, ਉਸ ਨੂੰ ਹੱਥ ਦੇ ਕੇ ਰੱਖਦਾ ਹੈ। ਮਨੁੱਖ ਕਈ ਕਿਸਮਾਂ ਦੇ ਜਤਨ ਕਰਦਾ ਹੈ, (ਪਰ ਜੇ ਪ੍ਰਭੂ ਸਹਾਇਤਾ ਨਾਹ ਕਰੇ ਤਾਂ) ਉਸ ਦੇ ਕੰਮ ਵਿਅਰਥ ਜਾਂਦੇ ਹਨ। (ਪ੍ਰਭੂ ਤੋਂ ਬਿਨਾ ਜੀਵਾਂ ਨੂੰ) ਨਾਹ ਕੋਈ ਮਾਰ ਸਕਦਾ ਹੈ, ਨਾਹ ਰੱਖ ਸਕਦਾ ਹੈ, (ਪ੍ਰਭੂ ਜੇਡਾ) ਹੋਰ ਕੋਈ ਨਹੀਂ ਹੈ; ਸਾਰੇ ਜੀਵਾਂ ਦਾ ਰਾਖਾ ਪ੍ਰਭੂ ਆਪ ਹੈ। ਹੇ ਪ੍ਰਾਣੀ! ਤੂੰ ਕਿਉਂ ਫ਼ਿਕਰ ਕਰਦਾ ਹੈਂ? ਹੇ ਨਾਨਕ! ਅਲੱਖ ਤੇ ਅਚਰਜ ਪ੍ਰਭੂ ਨੂੰ ਸਿਮਰ ॥੫॥ (ਹੇ ਭਾਈ!) ਘੜੀ ਮੁੜੀ ਪ੍ਰਭੂ ਨੂੰ ਸਿਮਰੀਏ, ਤੇ (ਨਾਮ-) ਅੰਮ੍ਰਿਤ ਪੀ ਕੇ ਇਸ ਮਨ ਨੂੰ ਤੇ ਸਰੀਰਕ ਇੰਦ੍ਰਿਆਂ ਨੂੰ ਰਜਾ ਦੇਵੀਏ। ਜਿਸ ਗੁਰਮੁਖ ਨੇ ਨਾਮ-ਰੂਪੀ ਰਤਨ ਲੱਭ ਲਿਆ ਹੈ, ਉਸ ਨੂੰ ਪ੍ਰਭੂ ਤੋਂ ਬਿਨਾ ਕਿਤੇ ਹੋਰ ਕੁਝ ਨਹੀਂ ਦਿੱਸਦਾ; ਨਾਮ (ਉਸ ਗੁਰਮੁਖ ਦਾ) ਧਨ ਹੈ, ਤੇ ਪ੍ਰਭੂ ਦੇ ਨਾਮ ਦਾ ਉਹ ਸਦਾ ਸੰਗ ਕਰਦਾ ਹੈ। ਜੋ ਮਨੁੱਖ ਨਾਮ ਦੇ ਸੁਆਦ ਵਿਚ ਰੱਜ ਗਏ ਹਨ, ਉਹਨਾਂ ਦੇ ਮਨ ਤਨ ਕੇਵਲ ਪ੍ਰਭੂ-ਨਾਮ ਵਿਚ ਹੀ ਜੁੜੇ ਰਹਿੰਦੇ ਹਨ। ਉਠਦਿਆਂ ਬੈਠਦਿਆਂ, ਸੁੱਤਿਆਂ (ਹਰ ਵੇਲੇ) ਪ੍ਰਭੂ ਦਾ ਨਾਮ ਸਿਮਰਨਾ, ਨਾਨਕ ਆਖਦਾ ਹੈ, ਇਹੋ ਹੀ ਸੇਵਕਾਂ ਦਾ ਸਦਾ ਆਹਰ ਹੁੰਦਾ ਹੈ ॥੬॥ (ਹੇ ਭਾਈ!) ਦਿਨ ਰਾਤ ਆਪਣੀ ਜੀਭ ਨਾਲ ਪ੍ਰਭੂ ਦੇ ਗੁਣ ਗਾਵੋ, ਸਿਫ਼ਿਤ-ਸਾਲਾਹ ਦੀ ਇਹ ਬਖ਼ਸ਼ਸ਼ ਪ੍ਰਭੂ ਨੇ ਆਪਣੇ ਸੇਵਕਾਂ ਨੂੰ (ਹੀ) ਕੀਤੀ ਹੈ; (ਸੇਵਕ) ਅੰਦਰਲੇ ਉਤਸ਼ਾਹ ਨਾਲ ਭਗਤੀ ਕਰਦੇ ਹਨ, ਤੇ ਆਪਣੇ ਪ੍ਰਭੂ ਨਾਲ ਜੁੜੇ ਰਹਿੰਦੇ ਹਨ। (ਸੇਵਕ) ਆਪਣੇ ਪ੍ਰਭੂ ਦਾ ਹੁਕਮ ਪਛਾਣ ਲੈਂਦਾ ਹੈ, ਤੇ, ਜੋ ਕੁਝ ਹੋ ਰਿਹਾ ਹੈ, ਉਸ ਨੂੰ (ਰਜ਼ਾ ਵਿਚ) ਜਾਣਦਾ ਹੈ; ਇਹੋ ਜਿਹੇ ਸੇਵਕ ਦੀ ਕੇਹੜੀ ਵਡਿਆਈ ਮੈਂ ਦੱਸਾਂ? ਮੈਂ ਉਸ ਸੇਵਕ ਦਾ ਇਕ ਗੁਣ ਬਿਆਨ ਕਰਨਾ ਭੀ ਨਹੀਂ ਜਾਣਦਾ। ਜੋ ਅੱਠੇ ਪਹਰ ਪ੍ਰਭੂ ਦੀ ਹਜ਼ੂਰੀ ਵਿਚ ਵੱਸਦੇ ਹਨ, ਨਾਨਕ ਆਖਦਾ ਹੈ- ਉਹ ਮਨੁੱਖ ਪੂਰੇ ਭਾਂਡੇ ਹਨ ॥੭॥ ਹੇ ਮੇਰੇ ਮਨ! (ਜੋ ਮਨੁੱਖ਼ ਸਦਾ ਪ੍ਰਭੂ ਦੀ ਹਜ਼ੂਰੀ ਵਿਚ ਵੱਸਦੇ ਹਨ) ਉਹਨਾਂ ਦੀ ਸਰਣੀ ਪਉ, ਅਤੇ ਆਪਣਾ ਤਨ ਮਨ ਉਹਨਾਂ ਤੋਂ ਸਦਕੇ ਕਰ ਦੇਹ। ਜਿਸ ਮਨੁੱਖ ਨੇ ਅਪਣੇ ਪ੍ਰਭੂ ਨੂੰ ਪਛਾਣ ਲਿਆ ਹੈ, ਉਹ ਮਨੁੱਖ ਸਾਰੇ ਪਦਾਰਥ ਦੇਣ ਦੇ ਸਮਰੱਥ ਹੋ ਜਾਂਦਾ ਹੈ। (ਹੇ ਮਨ!) ਉਸ ਦੀ ਸਰਣੀ ਪਿਆਂ ਤੂੰ ਸਾਰੇ ਸੁਖ ਪਾਵਹਿਂਗਾ, ਉਸ ਦੇ ਦੀਦਾਰ ਨਾਲ ਤੂੰ ਸਾਰੇ ਪਾਪ ਦੂਰ ਕਰ ਲਵਹਿਂਗਾ। ਹੋਰ ਚੁਤਰਾਈ ਛੱਡ ਦੇਹ, ਤੇ ਉਸ ਸੇਵਕ ਦੀ ਸੇਵਾ ਵਿਚ ਜੁੱਟ ਪਉ। (ਇਸ ਤਰ੍ਹਾਂ ਮੁੜ ਮੁੜ ਜਗਤ ਵਿਚ) ਤੇਰਾ ਆਉਣ ਜਾਣ ਨਹੀਂ ਹੋਵੇਗਾ। ਹੇ ਨਾਨਕ! ਉਸ ਸੰਤ ਜਨ ਦੇ ਸਦਾ ਪੈਰ ਪੂਜ ॥੮॥੧੭॥ ਜਿਸ ਨੇ ਸਦਾ-ਥਿਰ ਤੇ ਵਿਆਪਕ ਪ੍ਰਭੂ ਨੂੰ ਜਾਣ ਲਿਆ ਹੈ, ਉਸ ਦਾ ਨਾਮ ਸਤਿਗੁਰੂ ਹੈ, ਉਸ ਦੀ ਸੰਗਤਿ ਵਿਚ (ਰਹਿ ਕੇ) ਸਿੱਖ (ਵਿਕਾਰਾਂ ਤੋਂ) ਬਚ ਜਾਂਦਾ ਹੈ; (ਤਾਂ ਤੇ) ਹੇ ਨਾਨਕ! (ਤੂੰ ਭੀ ਗੁਰੂ ਦੀ ਸੰਗਤਿ ਵਿਚ ਰਹਿ ਕੇ) ਅਕਾਲ ਪੁਰਖ ਦੇ ਗੁਣ ਗਾ ॥੧॥`
      },
      {
        number: 18,
        sanskrit: `ਸਲੋਕੁ ॥
ਸਤਿ ਪੁਰਖੁ ਜਿਨਿ ਜਾਨਿਆ ਸਤਿਗੁਰੁ ਤਿਸ ਕਾ ਨਾਉ ॥
ਤਿਸ ਕੈ ਸੰਗਿ ਸਿਖੁ ਉਧਰੈ ਨਾਨਕ ਹਰਿ ਗੁਨ ਗਾਉ ॥੧॥
ਅਸਟਪਦੀ ॥
ਸਤਿਗੁਰੁ ਸਿਖ ਕੀ ਕਰੈ ਪ੍ਰਤਿਪਾਲ ॥
ਸੇਵਕ ਕਉ ਗੁਰੁ ਸਦਾ ਦਇਆਲ ॥
ਸਿਖ ਕੀ ਗੁਰੁ ਦੁਰਮਤਿ ਮਲੁ ਹਿਰੈ ॥
ਗੁਰ ਬਚਨੀ ਹਰਿ ਨਾਮੁ ਉਚਰੈ ॥
ਸਤਿਗੁਰੁ ਸਿਖ ਕੇ ਬੰਧਨ ਕਾਟੈ ॥
ਗੁਰ ਕਾ ਸਿਖੁ ਬਿਕਾਰ ਤੇ ਹਾਟੈ ॥
ਸਤਿਗੁਰੁ ਸਿਖ ਕਉ ਨਾਮ ਧਨੁ ਦੇਇ ॥
ਗੁਰ ਕਾ ਸਿਖੁ ਵਡਭਾਗੀ ਹੇ ॥
ਸਤਿਗੁਰੁ ਸਿਖ ਕਾ ਹਲਤੁ ਪਲਤੁ ਸਵਾਰੈ ॥
ਨਾਨਕ ਸਤਿਗੁਰੁ ਸਿਖ ਕਉ ਜੀਅ ਨਾਲਿ ਸਮਾਰੈ ॥੧॥
ਗੁਰ ਕੈ ਗ੍ਰਿਹਿ ਸੇਵਕੁ ਜੋ ਰਹੈ ॥
ਗੁਰ ਕੀ ਆਗਿਆ ਮਨ ਮਹਿ ਸਹੈ ॥
ਆਪਸ ਕਉ ਕਰਿ ਕਛੁ ਨ ਜਨਾਵੈ ॥
ਹਰਿ ਹਰਿ ਨਾਮੁ ਰਿਦੈ ਸਦ ਧਿਆਵੈ ॥
ਮਨੁ ਬੇਚੈ ਸਤਿਗੁਰ ਕੈ ਪਾਸਿ ॥
ਤਿਸੁ ਸੇਵਕ ਕੇ ਕਾਰਜ ਰਾਸਿ ॥
ਸੇਵਾ ਕਰਤ ਹੋਇ ਨਿਹਕਾਮੀ ॥
ਤਿਸ ਕਉ ਹੋਤ ਪਰਾਪਤਿ ਸੁਆਮੀ ॥
ਅਪਨੀ ਕ੍ਰਿਪਾ ਜਿਸੁ ਆਪਿ ਕਰੇਇ ॥
ਨਾਨਕ ਸੋ ਸੇਵਕੁ ਗੁਰ ਕੀ ਮਤਿ ਲੇਇ ॥੨॥
ਬੀਸ ਬਿਸਵੇ ਗੁਰ ਕਾ ਮਨੁ ਮਾਨੈ ॥
ਸੋ ਸੇਵਕੁ ਪਰਮੇਸੁਰ ਕੀ ਗਤਿ ਜਾਨੈ ॥
ਸੋ ਸਤਿਗੁਰੁ ਜਿਸੁ ਰਿਦੈ ਹਰਿ ਨਾਉ ॥
ਅਨਿਕ ਬਾਰ ਗੁਰ ਕਉ ਬਲਿ ਜਾਉ ॥
ਸਰਬ ਨਿਧਾਨ ਜੀਅ ਕਾ ਦਾਤਾ ॥
ਆਠ ਪਹਰ ਪਾਰਬ੍ਰਹਮ ਰੰਗਿ ਰਾਤਾ ॥
ਬ੍ਰਹਮ ਮਹਿ ਜਨੁ ਜਨ ਮਹਿ ਪਾਰਬ੍ਰਹਮੁ ॥
ਏਕਹਿ ਆਪਿ ਨਹੀ ਕਛੁ ਭਰਮੁ ॥
ਸਹਸ ਸਿਆਨਪ ਲਇਆ ਨ ਜਾਈਐ ॥
ਨਾਨਕ ਐਸਾ ਗੁਰੁ ਬਡਭਾਗੀ ਪਾਈਐ ॥੩॥
ਸਫਲ ਦਰਸਨੁ ਪੇਖਤ ਪੁਨੀਤ ॥
ਪਰਸਤ ਚਰਨ ਗਤਿ ਨਿਰਮਲ ਰੀਤਿ ॥
ਭੇਟਤ ਸੰਗਿ ਰਾਮ ਗੁਨ ਰਵੇ ॥
ਪਾਰਬ੍ਰਹਮ ਕੀ ਦਰਗਹ ਗਵੇ ॥
ਸੁਨਿ ਕਰਿ ਬਚਨ ਕਰਨ ਆਘਾਨੇ ॥
ਮਨਿ ਸੰਤੋਖੁ ਆਤਮ ਪਤੀਆਨੇ ॥
ਪੂਰਾ ਗੁਰੁ ਅਖੵਓ ਜਾ ਕਾ ਮੰਤ੍ਰ ॥
ਅੰਮ੍ਰਿਤ ਦ੍ਰਿਸਟਿ ਪੇਖੈ ਹੋਇ ਸੰਤ ॥
ਗੁਣ ਬਿਅੰਤ ਕੀਮਤਿ ਨਹੀ ਪਾਇ ॥
ਨਾਨਕ ਜਿਸੁ ਭਾਵੈ ਤਿਸੁ ਲਏ ਮਿਲਾਇ ॥੪॥
ਜਿਹਬਾ ਏਕ ਉਸਤਤਿ ਅਨੇਕ ॥
ਸਤਿ ਪੁਰਖ ਪੂਰਨ ਬਿਬੇਕ ॥
ਕਾਹੂ ਬੋਲ ਨ ਪਹੁਚਤ ਪ੍ਰਾਨੀ ॥
ਅਗਮ ਅਗੋਚਰ ਪ੍ਰਭ ਨਿਰਬਾਨੀ ॥
ਨਿਰਾਹਾਰ ਨਿਰਵੈਰ ਸੁਖਦਾਈ ॥
ਤਾ ਕੀ ਕੀਮਤਿ ਕਿਨੈ ਨ ਪਾਈ ॥
ਅਨਿਕ ਭਗਤ ਬੰਦਨ ਨਿਤ ਕਰਹਿ ॥
ਚਰਨ ਕਮਲ ਹਿਰਦੈ ਸਿਮਰਹਿ ॥
ਸਦ ਬਲਿਹਾਰੀ ਸਤਿਗੁਰ ਅਪਨੇ ॥
ਨਾਨਕ ਜਿਸੁ ਪ੍ਰਸਾਦਿ ਐਸਾ ਪ੍ਰਭੁ ਜਪਨੇ ॥੫॥
ਇਹੁ ਹਰਿ ਰਸੁ ਪਾਵੈ ਜਨੁ ਕੋਇ ॥
ਅੰਮ੍ਰਿਤੁ ਪੀਵੈ ਅਮਰੁ ਸੋ ਹੋਇ ॥
ਉਸੁ ਪੁਰਖ ਕਾ ਨਾਹੀ ਕਦੇ ਬਿਨਾਸ ॥
ਜਾ ਕੈ ਮਨਿ ਪ੍ਰਗਟੇ ਗੁਨਤਾਸ ॥
ਆਠ ਪਹਰ ਹਰਿ ਕਾ ਨਾਮੁ ਲੇਇ ॥
ਸਚੁ ਉਪਦੇਸੁ ਸੇਵਕ ਕਉ ਦੇਇ ॥
ਮੋਹ ਮਾਇਆ ਕੈ ਸੰਗਿ ਨ ਲੇਪੁ ॥
ਮਨ ਮਹਿ ਰਾਖੈ ਹਰਿ ਹਰਿ ਏਕੁ ॥
ਅੰਧਕਾਰ ਦੀਪਕ ਪਰਗਾਸੇ ॥
ਨਾਨਕ ਭਰਮ ਮੋਹ ਦੁਖ ਤਹ ਤੇ ਨਾਸੇ ॥੬॥
ਤਪਤਿ ਮਾਹਿ ਠਾਢਿ ਵਰਤਾਈ ॥
ਅਨਦੁ ਭਇਆ ਦੁਖ ਨਾਠੇ ਭਾਈ ॥
ਜਨਮ ਮਰਨ ਕੇ ਮਿਟੇ ਅੰਦੇਸੇ ॥
ਸਾਧੂ ਕੇ ਪੂਰਨ ਉਪਦੇਸੇ ॥
ਭਉ ਚੂਕਾ ਨਿਰਭਉ ਹੋਇ ਬਸੇ ॥
ਸਗਲ ਬਿਆਧਿ ਮਨ ਤੇ ਖੈ ਨਸੇ ॥
ਜਿਸ ਕਾ ਸਾ ਤਿਨਿ ਕਿਰਪਾ ਧਾਰੀ ॥
ਸਾਧਸੰਗਿ ਜਪਿ ਨਾਮੁ ਮੁਰਾਰੀ ॥
ਥਿਤਿ ਪਾਈ ਚੂਕੇ ਭ੍ਰਮ ਗਵਨ ॥
ਸੁਨਿ ਨਾਨਕ ਹਰਿ ਹਰਿ ਜਸੁ ਸ੍ਰਵਨ ॥੭॥
ਨਿਰਗੁਨੁ ਆਪਿ ਸਰਗੁਨੁ ਭੀ ਓਹੀ ॥
ਕਲਾ ਧਾਰਿ ਜਿਨਿ ਸਗਲੀ ਮੋਹੀ ॥
ਅਪਨੇ ਚਰਿਤ ਪ੍ਰਭਿ ਆਪਿ ਬਨਾਏ ॥
ਅਪੁਨੀ ਕੀਮਤਿ ਆਪੇ ਪਾਏ ॥
ਹਰਿ ਬਿਨੁ ਦੂਜਾ ਨਾਹੀ ਕੋਇ ॥
ਸਰਬ ਨਿਰੰਤਰਿ ਏਕੋ ਸੋਇ ॥
ਓਤਿ ਪੋਤਿ ਰਵਿਆ ਰੂਪ ਰੰਗ ॥
ਭਏ ਪ੍ਰਗਾਸ ਸਾਧ ਕੈ ਸੰਗ ॥
ਰਚਿ ਰਚਨਾ ਅਪਨੀ ਕਲ ਧਾਰੀ ॥
ਅਨਿਕ ਬਾਰ ਨਾਨਕ ਬਲਿਹਾਰੀ ॥੮॥੧੮॥
ਸਲੋਕੁ ॥
ਸਾਥਿ ਨ ਚਾਲੈ ਬਿਨੁ ਭਜਨ ਬਿਖਿਆ ਸਗਲੀ ਛਾਰੁ ॥
ਹਰਿ ਹਰਿ ਨਾਮੁ ਕਮਾਵਨਾ ਨਾਨਕ ਇਹੁ ਧਨੁ ਸਾਰੁ ॥੧॥`,
        transliteration: `salok |
sat purakh jin jaaniaa satigur tis kaa naau |
tis kai sang sikh udharai naanak har gun gaau |1|
asattapadee |
satigur sikh kee karai pratipaal |
sevak kau gur sadaa deaal |
sikh kee gur duramat mal hirai |
gur bachanee har naam ucharai |
satigur sikh ke bandhan kaattai |
gur kaa sikh bikaar te haattai |
satigur sikh kau naam dhan dee |
gur kaa sikh vaddabhaagee he |
satigur sikh kaa halat palat savaarai |
naanak satigur sikh kau jeea naal samaarai |1|
gur kai grihi sevak jo rahai |
gur kee aagiaa man meh sahai |
aapas kau kar kachh na janaavai |
har har naam ridai sad dhiaavai |
man bechai satigur kai paas |
tis sevak ke kaaraj raas |
sevaa karat hoe nihakaamee |
tis kau hot paraapat suaamee |
apanee kripaa jis aap karee |
naanak so sevak gur kee mat lee |2|
bees bisave gur kaa man maanai |
so sevak paramesur kee gat jaanai |
so satigur jis ridai har naau |
anik baar gur kau bal jaau |
sarab nidhaan jeea kaa daataa |
aatth pehar paarabraham rang raataa |
braham meh jan jan meh paarabraham |
ekeh aap nahee kachh bharam |
sehas siaanap leaa na jaaeeai |
naanak aisaa gur baddabhaagee paaeeai |3|
safal darasan pekhat puneet |
parasat charan gat niramal reet |
bhettat sang raam gun rave |
paarabraham kee daragah gave |
sun kar bachan karan aaghaane |
man santokh aatam pateeaane |
pooraa gur akhayo jaa kaa mantr |
amrit drisatt pekhai hoe sant |
gun biant keemat nahee paae |
naanak jis bhaavai tis le milaae |4|
jihabaa ek usatat anek |
sat purakh pooran bibek |
kaahoo bol na pahuchat praanee |
agam agochar prabh nirabaanee |
niraahaar niravair sukhadaaee |
taa kee keemat kinai na paaee |
anik bhagat bandan nit kareh |
charan kamal hiradai simareh |
sad balihaaree satigur apane |
naanak jis prasaad aisaa prabh japane |5|
eihu har ras paavai jan koe |
amrit peevai amar so hoe |
aus purakh kaa naahee kade binaas |
jaa kai man pragatte gunataas |
aatth pehar har kaa naam lee |
sach upades sevak kau dee |
moh maaeaa kai sang na lep |
man meh raakhai har har ek |
andhakaar deepak paragaase |
naanak bharam moh dukh teh te naase |6|
tapat maeh tthaadt varataaee |
anad bheaa dukh naatthe bhaaee |
janam maran ke mitte andese |
saadhoo ke pooran upadese |
bhau chookaa nirbhau hoe base |
sagal biaadh man te khai nase |
jis kaa saa tin kirapaa dhaaree |
saadhasang jap naam muraaree |
thit paaee chooke bhram gavan |
sun naanak har har jas sravan |7|
niragun aap saragun bhee ohee |
kalaa dhaar jin sagalee mohee |
apane charit prabh aap banaae |
apunee keemat aape paae |
har bin doojaa naahee koe |
sarab nirantar eko soe |
ot pot raviaa roop rang |
bhe pragaas saadh kai sang |
rach rachanaa apanee kal dhaaree |
anik baar naanak balihaaree |8|18|
salok |
saath na chaalai bin bhajan bikhiaa sagalee chhaar |
har har naam kamaavanaa naanak ihu dhan saar |1|`,
        meaning: `Salok: The one who knows the True Lord God, is called the True Guru. In His Company, the Sikh is saved, O Nanak, singing the Glorious Praises of the Lord. ||1|| Ashtapadee: The True Guru cherishes His Sikh. The Guru is always merciful to His servant. The Guru washes away the filth of the evil intellect of His Sikh. Through the Guru's Teachings, he chants the Lord's Name. The True Guru cuts away the bonds of His Sikh. The Sikh of the Guru abstains from evil deeds. The True Guru gives His Sikh the wealth of the Naam. The Sikh of the Guru is very fortunate. The True Guru arranges this world and the next for His Sikh. O Nanak, with the fullness of His heart, the True Guru mends His Sikh. ||1|| That selfless servant, who lives in the Guru's household, is to obey the Guru's Commands with all his mind. He is not to call attention to himself in any way. He is to meditate constantly within his heart on the Name of the Lord. One who sells his mind to the True Guru - that humble servant's affairs are resolved. One who performs selfless service, without thought of reward, shall attain his Lord and Master. He Himself grants His Grace; O Nanak, that selfless servant lives the Guru's Teachings. ||2|| One who obeys the Guru's Teachings one hundred per cent that selfless servant comes to know the state of the Transcendent Lord. The True Guru's Heart is filled with the Name of the Lord. So many times, I am a sacrifice to the Guru. He is the treasure of everything, the Giver of life. Twenty-four hours a day, He is imbued with the Love of the Supreme Lord God. The servant is in God, and God is in the servant. He Himself is One - there is no doubt about this. By thousands of clever tricks, He is not found. O Nanak, such a Guru is obtained by the greatest good fortune. ||3|| Blessed is His Darshan; receiving it, one is purified. Touching His Feet, one's conduct and lifestyle become pure. Abiding in His Company, one chants the Lord's Praise, and reaches the Court of the Supreme Lord God. Listening to His Teachings, one's ears are satisfied. The mind is contented, and the soul is fulfilled. The Guru is perfect; His Teachings are everlasting. Beholding His Ambrosial Glance, one becomes saintly. Endless are His virtuous qualities; His worth cannot be appraised. O Nanak, one who pleases Him is united with Him. ||4|| The tongue is one, but His Praises are many. The True Lord, of perfect perfection - no speech can take the mortal to Him. God is Inaccessible, Incomprehensible, balanced in the state of Nirvaanaa. He is not sustained by food; He has no hatred or vengeance; He is the Giver of peace. No one can estimate His worth. Countless devotees continually bow in reverence to Him. In their hearts, they meditate on His Lotus Feet. Nanak is forever a sacrifice to the True Guru; by His Grace, he meditates on God. ||5|| Only a few obtain this ambrosial essence of the Lord's Name. Drinking in this Nectar, one becomes immortal. That person whose mind is illuminated By the treasure of excellence, never dies. Twenty-four hours a day, he takes the Name of the Lord. The Lord gives true instruction to His servant. He is not polluted by emotional attachment to Maya. In his mind, he cherishes the One Lord, Har, Har. In the pitch darkness, a lamp shines forth. O Nanak, doubt, emotional attachment and pain are erased. ||6|| In the burning heat, a soothing coolness prevails. Happiness ensues and pain departs, O Siblings of Destiny. The fear of birth and death is dispelled, by the perfect Teachings of the Holy Saint. Fear is lifted, and one abides in fearlessness. All evils are dispelled from the mind. He takes us into His favor as His own. In the Company of the Holy, chant the Naam, the Name of the Lord. Stability is attained; doubt and wandering cease, O Nanak, listening with one's ears to the Praises of the Lord, Har, Har. ||7|| He Himself is absolute and unrelated; He Himself is also involved and related. Manifesting His power, He fascinates the entire world. God Himself sets His play in motion. Only He Himself can estimate His worth. There is none, other than the Lord. Permeating all, He is the One. Through and through, He pervades in form and color. He is revealed in the Company of the Holy. Having created the creation, He infuses His own power into it. So many times, Nanak is a sacrifice to Him. ||8||18|| Salok: Nothing shall go along with you, except your devotion. All corruption is like ashes. Practice the Name of the Lord, Har, Har. O Nanak, this is the most excellent wealth. ||1||`,
        meaning_pa: `ਜਿਸ ਨੇ ਸਦਾ-ਥਿਰ ਤੇ ਵਿਆਪਕ ਪ੍ਰਭੂ ਨੂੰ ਜਾਣ ਲਿਆ ਹੈ, ਉਸ ਦਾ ਨਾਮ ਸਤਿਗੁਰੂ ਹੈ, ਉਸ ਦੀ ਸੰਗਤਿ ਵਿਚ (ਰਹਿ ਕੇ) ਸਿੱਖ (ਵਿਕਾਰਾਂ ਤੋਂ) ਬਚ ਜਾਂਦਾ ਹੈ; (ਤਾਂ ਤੇ) ਹੇ ਨਾਨਕ! (ਤੂੰ ਭੀ ਗੁਰੂ ਦੀ ਸੰਗਤਿ ਵਿਚ ਰਹਿ ਕੇ) ਅਕਾਲ ਪੁਰਖ ਦੇ ਗੁਣ ਗਾ ॥੧॥ ਸਤਿਗੁਰੂ ਸਿੱਖ ਦੀ ਰੱਖਿਆ ਕਰਦਾ ਹੈ, ਸਤਿਗੁਰੂ ਆਪਣੇ ਸੇਵਕ ਉਤੇ ਸਦਾ ਮੇਹਰ ਕਰਦਾ ਹੈ। ਸਤਿਗੁਰੂ ਆਪਣੇ ਸਿੱਖ ਦੀ ਭੈੜੀ ਮਤਿ-ਰੂਪੀ ਮੈਲ ਦੂਰ ਕਰ ਦੇਂਦਾ ਹੈ, ਕਿਉਂਕਿ ਸਿੱਖ ਆਪਣੇ ਸਤਿਗੁਰੂ ਦੇ ਉਪਦੇਸ਼ ਦੀ ਰਾਹੀਂ ਪ੍ਰਭੂ ਦਾ ਨਾਮ ਸਿਮਰਦਾ ਹੈ। ਸਤਿਗੁਰੂ ਆਪਣੇ ਸਿੱਖ ਦੇ (ਮਾਇਆ ਦੇ) ਬੰਧਨ ਕੱਟ ਦੇਂਦਾ ਹੈ, (ਅਤੇ) ਗੁਰੂ ਦਾ ਸਿੱਖ ਵਿਕਾਰਾਂ ਵਲੋਂ ਹਟ ਜਾਂਦਾ ਹੈ; (ਕਿਉਂਕਿ) ਸਤਿਗੁਰੂ ਆਪਣੇ ਸਿੱਖ ਨੂੰ ਪ੍ਰਭੂ ਦਾ ਨਾਮ-ਰੂਪੀ ਧਨ ਦੇਂਦਾ ਹੈ, (ਤੇ ਇਸ ਤਰ੍ਹਾਂ) ਸਤਿਗੁਰੂ ਦਾ ਸਿੱਖ ਵੱਡੇ ਭਾਗਾਂ ਵਾਲਾ ਬਣ ਜਾਂਦਾ ਹੈ। ਸਤਿਗੁਰੂ ਆਪਣੇ ਸਿੱਖ ਦਾ ਲੋਕ ਪਰਲੋਕ ਸਵਾਰ ਦੇਂਦਾ ਹੈ। ਹੇ ਨਾਨਕ! ਸਤਿਗੁਰੂ ਆਪਣੇ ਸਿੱਖ ਨੂੰ ਆਪਣੀ ਜਿੰਦ ਦੇ ਨਾਲ ਯਾਦ ਰੱਖਦਾ ਹੈ ॥੧॥ ਜੇਹੜਾ ਸੇਵਕ (ਸਿੱਖਿਆ ਦੀ ਖ਼ਾਤਰ) ਗੁਰੂ ਦੇ ਘਰ ਵਿਚ (ਭਾਵ ਗੁਰੂ ਦੇ ਦਰ ਤੇ) ਰਹਿੰਦਾ ਹੈ, ਤੇ ਗੁਰੂ ਦਾ ਹੁਕਮ ਮਨ ਵਿਚ ਮੰਨਦਾ ਹੈ; ਜੋ ਆਪਣੇ ਆਪ ਨੂੰ ਵੱਡਾ ਨਹੀਂ ਜਤਾਉਂਦਾ, ਪ੍ਰਭੂ ਦਾ ਨਾਮ ਸਦਾ ਹਿਰਦੇ ਵਿਚ ਧਿਆਉਂਦਾ ਹੈ; ਜੋ ਆਪਣਾ ਮਨ ਸਤਿਗੁਰੂ ਅੱਗੇ ਵੇਚ ਦੇਂਦਾ ਹੈ (ਭਾਵ ਗੁਰੂ ਦੇ ਹਵਾਲੇ ਕਰ ਦੇਂਦਾ ਹੈ) ਉਸ ਸੇਵਕ ਦੇ ਸਾਰੇ ਕੰਮ ਸਿਰੇ ਚੜ੍ਹ ਜਾਂਦੇ ਹਨ। ਜੋ ਸੇਵਕ (ਗੁਰੂ ਦੀ) ਸੇਵਾ ਕਰਦਾ ਹੋਇਆ ਕਿਸੇ ਫਲ ਦੀ ਖ਼ਾਹਸ਼ ਨਹੀਂ ਰੱਖਦਾ, ਉਸ ਨੂੰ ਮਾਲਿਕ ਪ੍ਰਭੂ ਮਿਲ ਪੈਂਦਾ ਹੈ। ਜਿਸ ਤੇ (ਪ੍ਰਭੂ ਆਪਣੀ ਮੇਹਰ ਕਰਦਾ ਹੈ, ਹੇ ਨਾਨਕ! ਉਹ ਸੇਵਕ ਸਤਿਗੁਰੂ ਦੀ ਸਿੱਖਿਆ ਲੈਂਦਾ ਹੈ ॥੨॥ ਜੋ ਸੇਵਕ ਆਪਣੇ ਸਤਿਗੁਰੂ ਨੂੰ ਆਪਣੀ ਸਰਧਾ ਦਾ ਪੂਰੇ ਤੌਰ ਤੇ ਯਕੀਨ ਦਿਵਾ ਲੈਂਦਾ ਹੈ, ਉਹ ਅਕਾਲ ਪੁਰਖ ਦੀ ਅਵਸਥਾ ਨੂੰ ਸਮਝ ਲੈਂਦਾ ਹੈ। ਸਤਿਗੁਰੂ (ਭੀ) ਉਹ ਹੈ ਜਿਸ ਦੇ ਹਿਰਦੇ ਵਿਚ ਪ੍ਰਭੂ ਦਾ ਨਾਮ ਵੱਸਦਾ ਹੈ, (ਮੈਂ ਐਸੇ) ਗੁਰੂ ਤੋਂ ਕਈ ਵਾਰੀ ਸਦਕੇ ਜਾਂਦਾ ਹਾਂ। (ਸਤਿਗੁਰੂ) ਸਾਰੇ ਖ਼ਜ਼ਾਨਿਆਂ ਦਾ ਤੇ ਆਤਮਕ ਜ਼ਿੰਦਗੀ ਦਾ ਦੇਣ ਵਾਲਾ ਹੈ, (ਕਿਉਂਕਿ) ਉਹ ਅੱਠੇ ਪਹਰ ਅਕਾਲ ਪੁਰਖ ਦੇ ਪਿਆਰ ਵਿਚ ਰੰਗਿਆ ਰਹਿੰਦਾ ਹੈ। (ਪ੍ਰਭੂ ਦਾ) ਸੇਵਕ-(ਸਤਿਗੁਰੂ) ਪ੍ਰਭੂ ਵਿਚ (ਜੁੜਿਆ ਰਹਿੰਦਾ ਹੈ) ਤੇ (ਪ੍ਰਭੂ ਦੇ) ਸੇਵਕ-ਸਤਿਗੁਰੂ ਵਿਚ ਪ੍ਰਭੂ (ਸਦਾ ਟਿਕਿਆ ਹੈ), ਗੁਰੂ ਤੇ ਪ੍ਰਭੂ ਇਕ-ਰੂਪ ਹਨ, ਇਸ ਵਿਚ ਭੁਲੇਖੇ ਵਾਲੀ ਗੱਲ ਨਹੀਂ। ਹਜ਼ਾਰਾਂ ਚਤੁਰਾਈਆਂ ਨਾਲ ਅਜੇਹਾ ਗੁਰੂ ਮਿਲਦਾ ਨਹੀਂ, ਹੇ ਨਾਨਕ! ਵੱਡੇ ਭਾਗਾਂ ਨਾਲ ਮਿਲਦਾ ਹੈ ॥੩॥ ਗੁਰੂ ਦਾ ਦੀਦਾਰ (ਸਾਰੇ) ਫਲ ਦੇਣ ਵਾਲਾ ਹੈ, ਦੀਦਾਰ ਕੀਤਿਆਂ ਪਵਿਤ੍ਰ ਹੋ ਜਾਈਦਾ ਹੈ, ਗੁਰੂ ਦੇ ਚਰਨ ਛੋਹਿਆਂ ਉਚੀ ਅਵਸਥਾ ਤੇ ਸੁੱਚੀ ਰਹੁ-ਰੀਤ ਹੋ ਜਾਂਦੀ ਹੈ। ਗੁਰੂ ਦੀ ਸੰਗਤਿ ਵਿਚ ਰਿਹਾਂ ਪ੍ਰਭੂ ਦੇ ਗੁਣ ਗਾ ਸਕੀਦੇ ਹਨ, ਤੇ ਅਕਾਲ ਪੁਰਖ ਦੀ ਦਰਗਾਹ ਵਿਚ ਪਹੁੰਚ ਹੋ ਜਾਂਦੀ ਹੈ। ਗੁਰੂ ਦੇ ਬਚਨ ਸੁਣ ਕੇ ਕੰਨ ਰੱਜ ਜਾਂਦੇ ਹਨ, ਮਨ ਵਿਚ ਸੰਤੋਖ ਆ ਜਾਂਦਾ ਹੈ ਤੇ ਆਤਮਾ ਪਤੀਜ ਜਾਂਦਾ ਹੈ। ਸਤਿਗੁਰੂ ਪੂਰਨ ਪੁਰਖ ਹੈ, ਉਸ ਦਾ ਉਪਦੇਸ਼ ਭੀ ਸਦਾ ਲਈ ਅਟੱਲ ਹੈ, (ਜਿਸ ਵਲ) ਅਮਰ ਕਰਨ ਵਾਲੀ ਨਜ਼ਰ ਨਾਲ ਤੱਕਦਾ ਹੈ ਓਹੀ ਸੰਤ ਹੋ ਜਾਂਦਾ ਹੈ। ਸਤਿਗੁਰੂ ਦੇ ਗੁਣ ਬੇਅੰਤ ਹਨ, ਮੁੱਲ ਨਹੀਂ ਪੈ ਸਕਦਾ। ਹੇ ਨਾਨਕ! ਜੋ ਜੀਵ (ਪ੍ਰਭੂ ਨੂੰ) ਚੰਗਾ ਲੱਗਦਾ ਹੈ, ਉਸ ਨੂੰ ਗੁਰੂ ਨਾਲ ਮਿਲਾਉਂਦਾ ਹੈ ॥੪॥ (ਮਨੁੱਖ ਦੀ) ਜੀਭ ਇੱਕ ਹੈ, ਪਰ ਉਸ ਪ੍ਰਭੂ ਦੇ ਅਨੇਕਾਂ ਗੁਣ ਹਨ, ਜੋ ਪੂਰਨ ਪੁਰਖ ਹੈ, ਸਦਾ-ਥਿਰ ਰਹਿਣ ਵਾਲਾ ਅਤੇ ਵਿਆਪਕ ਹੈ। ਮਨੁੱਖ ਕਿਸੇ ਬੋਲ ਦੁਆਰਾ (ਪ੍ਰਭੂ ਦੇ ਗੁਣਾਂ ਤਕ) ਪਹੁੰਚ ਨਹੀਂ ਸਕਦਾ, ਪ੍ਰਭੂ ਪਹੁੰਚ ਤੋਂ ਪਰੇ ਹੈ, ਵਾਸਨਾ-ਰਹਿਤ ਹੈ, ਤੇ ਮਨੁੱਖ ਦੇ ਸਰੀਰਕ ਇੰਦ੍ਰਿਆਂ ਦੀ ਉਸ ਤਕ ਪਹੁੰਚ ਨਹੀਂ। ਅਕਾਲ ਪੁਰਖ ਨੂੰ ਕਿਸੇ ਖ਼ੁਰਾਕ ਦੀ ਲੋੜ ਨਹੀਂ, ਪ੍ਰਭੂ ਵੈਰ-ਰਹਿਤ ਹੈ (ਸਗੋਂ ਸਭ ਨੂੰ) ਸੁਖ ਦੇਣ ਵਾਲਾ ਹੈ, ਕੋਈ ਜੀਵ ਉਸ (ਦੇ ਗੁਣਾਂ) ਦਾ ਮੁੱਲ ਨਹੀਂ ਪਾ ਸਕਿਆ। ਅਨੇਕਾਂ ਭਗਤ ਸਦਾ (ਪ੍ਰਭੂ ਨੂੰ) ਨਮਸਕਾਰ ਕਰਦੇ ਹਨ, ਅਤੇ ਉਸ ਦੇ ਕਮਲਾਂ ਵਰਗੇ (ਸੋਹਣੇ) ਚਰਨਾਂ ਨੂੰ ਆਪਣੇ ਹਿਰਦੇ ਵਿਚ ਸਿਮਰਦੇ ਹਨ। ਮੈਂ ਆਪਣੇ ਉਸ ਗੁਰੂ ਤੋਂ ਸਦਾ ਸਦਕੇ ਹਾਂ, ਹੇ ਨਾਨਕ! (ਆਖ-) ਜਿਸ ਗੁਰੂ ਦੀ ਮੇਹਰ ਨਾਲ ਐਸੇ ਪ੍ਰਭੂ ਨੂੰ ਜਪ ਸਕੀਦਾ ਹੈ ॥੫॥ ਕੋਈ ਵਿਰਲਾ ਮਨੁੱਖ ਪ੍ਰਭੂ ਦੇ ਨਾਮ ਦਾ ਸੁਆਦ ਮਾਣਦਾ ਹੈ, (ਤੇ ਜੋ ਮਾਣਦਾ ਹੈ) ਉਹ ਨਾਮ-ਅੰਮ੍ਰਿਤ ਪੀਂਦਾ ਹੈ, ਤੇ ਅਮਰ ਹੋ ਜਾਂਦਾ ਹੈ। ਉਸ ਦਾ ਕਦੇ ਨਾਸ ਨਹੀਂ ਹੁੰਦਾ (ਭਾਵ, ਉਹ ਮੁੜ ਮੁੜ ਮੌਤ ਦਾ ਸ਼ਿਕਾਰ ਨਹੀਂ ਹੁੰਦਾ) ਜਿਸ ਦੇ ਮਨ ਵਿਚ ਗੁਣਾਂ ਦੇ ਖ਼ਜ਼ਾਨੇ ਪ੍ਰਭੂ ਦਾ ਪ੍ਰਕਾਸ਼ ਹੁੰਦਾ ਹੈ। (ਸਤਿਗੁਰੂ) ਅੱਠੇ ਪਹਰ ਪ੍ਰਭੂ ਦਾ ਨਾਮ ਸਿਮਰਦਾ ਹੈ, ਤੇ ਆਪਣੇ ਸੇਵਕ ਨੂੰ ਭੀ ਇਹੀ ਸੱਚਾ ਉਪਦੇਸ ਦੇਂਦਾ ਹੈ। ਮਾਇਆ ਦੇ ਮੋਹ ਦੇ ਨਾਲ ਉਸ ਦਾ ਕਦੇ ਜੋੜ ਨਹੀਂ ਹੁੰਦਾ, ਉਹ ਸਦਾ ਆਪਣੇ ਮਨ ਵਿਚ ਇਕ ਪ੍ਰਭੂ ਨੂੰ ਟਿਕਾਉਂਦਾ ਹੈ। (ਜਿਸ ਦੇ ਅੰਦਰੋਂ) (ਨਾਮ-ਰੂਪ) ਦੀਵੇ ਦੇ ਨਾਲ (ਅਗਿਆਨਤਾ ਦਾ) ਹਨੇਰਾ (ਹਟ ਕੇ) ਚਾਨਣ ਹੋ ਜਾਂਦਾ ਹੈ, ਹੇ ਨਾਨਕ! ਉਸ ਦੇ ਭੁਲੇਖੇ ਤੇ ਮੋਹ ਦੇ (ਕਾਰਣ ਪੈਦਾ ਹੋਏ) ਦੁੱਖ ਦੂਰ ਹੋ ਜਾਂਦੇ ਹਨ ॥੬॥ ਹੇ ਭਾਈ! ਗੁਰੂ ਦੇ ਪੂਰੇ ਉਪਦੇਸ਼ ਦੁਆਰਾ (ਵਿਕਾਰਾਂ ਦੀ) ਤਪਸ਼ ਵਿਚ (ਵੱਸਦਿਆਂ ਭੀ, ਪ੍ਰਭੂ ਨੇ ਸਾਡੇ ਅੰਦਰ) ਠੰਢ ਵਰਤਾ ਦਿੱਤੀ ਹੈ, ਸੁਖ ਹੀ ਸੁਖ ਹੋ ਗਿਆ ਹੈ, ਦੁੱਖ ਨੱਸ ਗਏ ਹਨ, ਤੇ ਜਨਮ ਮਰਨ ਦੇ (ਗੇੜ ਵਿਚ ਪੈਣ ਦੇ) ਡਰ ਫ਼ਿਕਰ ਮਿਟ ਗਏ ਹਨ, ਇਹ ਗੁਰੂ ਦੇ ਉਪਦੇਸ਼ ਦਾ ਸਦਕਾ ਹੀ ਹੋਇਆ ਹੈ। (ਸਾਰਾ) ਡਰ ਮੁੱਕ ਗਿਆ ਹੈ, ਹੁਣ ਨਿਡਰ ਵੱਸਦੇ ਹਾਂ, ਸਾਰੇ ਰੋਗ ਨਾਸ ਹੋ ਕੇ ਮਨੋਂ ਵਿਸਰ ਗਏ ਹਨ। ਜਿਸ ਗੁਰੂ ਦੇ ਬਣੇ ਸਾਂ, ਉਸ ਨੇ (ਸਾਡੇ ਉਤੇ) ਕਿਰਪਾ ਕੀਤੀ ਹੈ; ਸਤਸੰਗ ਵਿਚ ਪ੍ਰਭੂ ਦਾ ਨਾਮ ਜਪ ਕੇ, ਤੇ (ਅਸਾਂ) ਸ਼ਾਂਤੀ ਹਾਸਲ ਕਰ ਲਈ ਹੈ ਤੇ (ਸਾਡੇ) ਭੁਲੇਖੇ ਤੇ ਭਟਕਣਾ ਮੁੱਕ ਗਏ ਹਨ। ਹੇ ਨਾਨਕ! ਪ੍ਰਭੂ ਦਾ ਜਸ ਕੰਨੀਂ ਸੁਣ ਕੇ (ਇਹ ਭਰਮੳ ਅਤੇ ਭਟਕਣਾ ਮੁੱਕੀ ਹੈ) ॥੭॥ ਉਹ ਆਪ ਮਾਇਆ ਦੇ ਤਿੰਨਾਂ ਗੁਣਾਂ ਤੋਂ ਵੱਖਰਾ ਹੈ, ਤ੍ਰਿਗੁਣੀ ਸੰਸਾਰ ਦਾ ਰੂਪ ਭੀ ਆਪ ਹੀ ਹੈ, ਜਿਸ ਪ੍ਰਭੂ ਨੇ ਆਪਣੀ ਤਾਕਤ ਕਾਇਮ ਕਰ ਕੇ ਸਾਰੇ ਜਗਤ ਨੂੰ ਮੋਹਿਆ ਹੈ। ਪ੍ਰਭੂ ਨੇ ਆਪਣੇ ਖੇਲ-ਤਮਾਸ਼ੇ ਆਪ ਹੀ ਬਣਾਏ ਹਨ, ਆਪਣੀ ਬਜ਼ੁਰਗੀ ਦਾ ਮੁੱਲ ਭੀ ਆਪ ਹੀ ਪਾਂਦਾ ਹੈ। ਪ੍ਰਭੂ ਤੋਂ ਬਿਨਾ (ਉਸ ਵਰਗਾ) ਹੋਰ ਕੋਈ ਨਹੀਂ ਹੈ, ਸਭ ਦੇ ਅੰਦਰ ਪ੍ਰਭੂ ਆਪ ਹੀ (ਮੌਜੂਦ) ਹੈ। ਤਾਣੇ ਪੇਟੇ ਵਾਂਗ ਸਾਰੇ ਰੂਪਾਂ ਤੇ ਰੰਗਾਂ ਵਿਚ ਵਿਆਪਕ ਹੈ; ਇਹ ਚਾਨਣ (ਭਾਵ, ਸਮਝ) ਸਤਿਗੁਰੂ ਦੀ ਸੰਗਤਿ ਵਿਚ ਪ੍ਰਕਾਸ਼ਦਾ ਹੈ। ਸ੍ਰਿਸ਼ਟੀ ਰਚ ਕੇ ਪ੍ਰਭੂ ਨੇ ਆਪਣੀ ਸੱਤਿਆ (ਇਸ ਸ੍ਰਿਸ਼ਟੀ ਵਿਚ) ਟਿਕਾਈ ਹੈ। ਹੇ ਨਾਨਕ! (ਆਖ) ਮੈਂ ਕਈ ਵਾਰ (ਐਸੇ ਪ੍ਰਭੂ ਤੋਂ) ਸਦਕੇ ਹਾਂ ॥੮॥੧੮॥ (ਪ੍ਰਭੂ ਦੇ) ਭਜਨ ਤੋਂ ਬਿਨਾ (ਹੋਰ ਕੋਈ ਸ਼ੈ ਮਨੁੱਖ ਦੇ) ਨਾਲ ਨਹੀਂ ਜਾਂਦੀ, ਸਾਰੀ ਮਾਇਆ (ਜੋ ਮਨੁੱਖ ਕਮਾਉਂਦਾ ਰਹਿੰਦਾ ਹੈ, ਜਗਤ ਤੋਂ ਤੁਰਨ ਵੇਲੇ ਇਸ ਦੇ ਵਾਸਤੇ) ਸੁਆਹ (ਸਮਾਨ) ਹੈ। ਹੇ ਨਾਨਕ! ਅਕਾਲ ਪੁਰਖ ਦਾ ਨਾਮ (ਸਿਮਰਨ) ਦੀ ਕਮਾਈ ਕਰਨਾ ਹੀ (ਸਭ ਤੋਂ) ਚੰਗਾ ਧਨ ਹੈ (ਇਹੀ ਮਨੁੱਖ ਦੇ ਨਾਲ ਨਿਭਦਾ ਹੈ) ॥੧॥`
      },
      {
        number: 19,
        sanskrit: `ਸਲੋਕੁ ॥
ਸਾਥਿ ਨ ਚਾਲੈ ਬਿਨੁ ਭਜਨ ਬਿਖਿਆ ਸਗਲੀ ਛਾਰੁ ॥
ਹਰਿ ਹਰਿ ਨਾਮੁ ਕਮਾਵਨਾ ਨਾਨਕ ਇਹੁ ਧਨੁ ਸਾਰੁ ॥੧॥
ਅਸਟਪਦੀ ॥
ਸੰਤ ਜਨਾ ਮਿਲਿ ਕਰਹੁ ਬੀਚਾਰੁ ॥
ਏਕੁ ਸਿਮਰਿ ਨਾਮ ਆਧਾਰੁ ॥
ਅਵਰਿ ਉਪਾਵ ਸਭਿ ਮੀਤ ਬਿਸਾਰਹੁ ॥
ਚਰਨ ਕਮਲ ਰਿਦ ਮਹਿ ਉਰਿ ਧਾਰਹੁ ॥
ਕਰਨ ਕਾਰਨ ਸੋ ਪ੍ਰਭੁ ਸਮਰਥੁ ॥
ਦ੍ਰਿੜੁ ਕਰਿ ਗਹਹੁ ਨਾਮੁ ਹਰਿ ਵਥੁ ॥
ਇਹੁ ਧਨੁ ਸੰਚਹੁ ਹੋਵਹੁ ਭਗਵੰਤ ॥
ਸੰਤ ਜਨਾ ਕਾ ਨਿਰਮਲ ਮੰਤ ॥
ਏਕ ਆਸ ਰਾਖਹੁ ਮਨ ਮਾਹਿ ॥
ਸਰਬ ਰੋਗ ਨਾਨਕ ਮਿਟਿ ਜਾਹਿ ॥੧॥
ਜਿਸੁ ਧਨ ਕਉ ਚਾਰਿ ਕੁੰਟ ਉਠਿ ਧਾਵਹਿ ॥
ਸੋ ਧਨੁ ਹਰਿ ਸੇਵਾ ਤੇ ਪਾਵਹਿ ॥
ਜਿਸੁ ਸੁਖ ਕਉ ਨਿਤ ਬਾਛਹਿ ਮੀਤ ॥
ਸੋ ਸੁਖੁ ਸਾਧੂ ਸੰਗਿ ਪਰੀਤਿ ॥
ਜਿਸੁ ਸੋਭਾ ਕਉ ਕਰਹਿ ਭਲੀ ਕਰਨੀ ॥
ਸਾ ਸੋਭਾ ਭਜੁ ਹਰਿ ਕੀ ਸਰਨੀ ॥
ਅਨਿਕ ਉਪਾਵੀ ਰੋਗੁ ਨ ਜਾਇ ॥
ਰੋਗੁ ਮਿਟੈ ਹਰਿ ਅਵਖਧੁ ਲਾਇ ॥
ਸਰਬ ਨਿਧਾਨ ਮਹਿ ਹਰਿ ਨਾਮੁ ਨਿਧਾਨੁ ॥
ਜਪਿ ਨਾਨਕ ਦਰਗਹਿ ਪਰਵਾਨੁ ॥੨॥
ਮਨੁ ਪਰਬੋਧਹੁ ਹਰਿ ਕੈ ਨਾਇ ॥
ਦਹ ਦਿਸਿ ਧਾਵਤ ਆਵੈ ਠਾਇ ॥
ਤਾ ਕਉ ਬਿਘਨੁ ਨ ਲਾਗੈ ਕੋਇ ॥
ਜਾ ਕੈ ਰਿਦੈ ਬਸੈ ਹਰਿ ਸੋਇ ॥
ਕਲਿ ਤਾਤੀ ਠਾਂਢਾ ਹਰਿ ਨਾਉ ॥
ਸਿਮਰਿ ਸਿਮਰਿ ਸਦਾ ਸੁਖ ਪਾਉ ॥
ਭਉ ਬਿਨਸੈ ਪੂਰਨ ਹੋਇ ਆਸ ॥
ਭਗਤਿ ਭਾਇ ਆਤਮ ਪਰਗਾਸ ॥
ਤਿਤੁ ਘਰਿ ਜਾਇ ਬਸੈ ਅਬਿਨਾਸੀ ॥
ਕਹੁ ਨਾਨਕ ਕਾਟੀ ਜਮ ਫਾਸੀ ॥੩॥
ਤਤੁ ਬੀਚਾਰੁ ਕਹੈ ਜਨੁ ਸਾਚਾ ॥
ਜਨਮਿ ਮਰੈ ਸੋ ਕਾਚੋ ਕਾਚਾ ॥
ਆਵਾ ਗਵਨੁ ਮਿਟੈ ਪ੍ਰਭ ਸੇਵ ॥
ਆਪੁ ਤਿਆਗਿ ਸਰਨਿ ਗੁਰਦੇਵ ॥
ਇਉ ਰਤਨ ਜਨਮ ਕਾ ਹੋਇ ਉਧਾਰੁ ॥
ਹਰਿ ਹਰਿ ਸਿਮਰਿ ਪ੍ਰਾਨ ਆਧਾਰੁ ॥
ਅਨਿਕ ਉਪਾਵ ਨ ਛੂਟਨਹਾਰੇ ॥
ਸਿੰਮ੍ਰਿਤਿ ਸਾਸਤ ਬੇਦ ਬੀਚਾਰੇ ॥
ਹਰਿ ਕੀ ਭਗਤਿ ਕਰਹੁ ਮਨੁ ਲਾਇ ॥
ਮਨਿ ਬੰਛਤ ਨਾਨਕ ਫਲ ਪਾਇ ॥੪॥
ਸੰਗਿ ਨ ਚਾਲਸਿ ਤੇਰੈ ਧਨਾ ॥
ਤੂੰ ਕਿਆ ਲਪਟਾਵਹਿ ਮੂਰਖ ਮਨਾ ॥
ਸੁਤ ਮੀਤ ਕੁਟੰਬ ਅਰੁ ਬਨਿਤਾ ॥
ਇਨ ਤੇ ਕਹਹੁ ਤੁਮ ਕਵਨ ਸਨਾਥਾ ॥
ਰਾਜ ਰੰਗ ਮਾਇਆ ਬਿਸਥਾਰ ॥
ਇਨ ਤੇ ਕਹਹੁ ਕਵਨ ਛੁਟਕਾਰ ॥
ਅਸੁ ਹਸਤੀ ਰਥ ਅਸਵਾਰੀ ॥
ਝੂਠਾ ਡੰਫੁ ਝੂਠੁ ਪਾਸਾਰੀ ॥
ਜਿਨਿ ਦੀਏ ਤਿਸੁ ਬੁਝੈ ਨ ਬਿਗਾਨਾ ॥
ਨਾਮੁ ਬਿਸਾਰਿ ਨਾਨਕ ਪਛੁਤਾਨਾ ॥੫॥
ਗੁਰ ਕੀ ਮਤਿ ਤੂੰ ਲੇਹਿ ਇਆਨੇ ॥
ਭਗਤਿ ਬਿਨਾ ਬਹੁ ਡੂਬੇ ਸਿਆਨੇ ॥
ਹਰਿ ਕੀ ਭਗਤਿ ਕਰਹੁ ਮਨ ਮੀਤ ॥
ਨਿਰਮਲ ਹੋਇ ਤੁਮੑਾਰੋ ਚੀਤ ॥
ਚਰਨ ਕਮਲ ਰਾਖਹੁ ਮਨ ਮਾਹਿ ॥
ਜਨਮ ਜਨਮ ਕੇ ਕਿਲਬਿਖ ਜਾਹਿ ॥
ਆਪਿ ਜਪਹੁ ਅਵਰਾ ਨਾਮੁ ਜਪਾਵਹੁ ॥
ਸੁਨਤ ਕਹਤ ਰਹਤ ਗਤਿ ਪਾਵਹੁ ॥
ਸਾਰ ਭੂਤ ਸਤਿ ਹਰਿ ਕੋ ਨਾਉ ॥
ਸਹਜਿ ਸੁਭਾਇ ਨਾਨਕ ਗੁਨ ਗਾਉ ॥੬॥
ਗੁਨ ਗਾਵਤ ਤੇਰੀ ਉਤਰਸਿ ਮੈਲੁ ॥
ਬਿਨਸਿ ਜਾਇ ਹਉਮੈ ਬਿਖੁ ਫੈਲੁ ॥
ਹੋਹਿ ਅਚਿੰਤੁ ਬਸੈ ਸੁਖ ਨਾਲਿ ॥
ਸਾਸਿ ਗ੍ਰਾਸਿ ਹਰਿ ਨਾਮੁ ਸਮਾਲਿ ॥
ਛਾਡਿ ਸਿਆਨਪ ਸਗਲੀ ਮਨਾ ॥
ਸਾਧਸੰਗਿ ਪਾਵਹਿ ਸਚੁ ਧਨਾ ॥
ਹਰਿ ਪੂੰਜੀ ਸੰਚਿ ਕਰਹੁ ਬਿਉਹਾਰੁ ॥
ਈਹਾ ਸੁਖੁ ਦਰਗਹ ਜੈਕਾਰੁ ॥
ਸਰਬ ਨਿਰੰਤਰਿ ਏਕੋ ਦੇਖੁ ॥
ਕਹੁ ਨਾਨਕ ਜਾ ਕੈ ਮਸਤਕਿ ਲੇਖੁ ॥੭॥
ਏਕੋ ਜਪਿ ਏਕੋ ਸਾਲਾਹਿ ॥
ਏਕੁ ਸਿਮਰਿ ਏਕੋ ਮਨ ਆਹਿ ॥
ਏਕਸ ਕੇ ਗੁਨ ਗਾਉ ਅਨੰਤ ॥
ਮਨਿ ਤਨਿ ਜਾਪਿ ਏਕ ਭਗਵੰਤ ॥
ਏਕੋ ਏਕੁ ਏਕੁ ਹਰਿ ਆਪਿ ॥
ਪੂਰਨ ਪੂਰਿ ਰਹਿਓ ਪ੍ਰਭੁ ਬਿਆਪਿ ॥
ਅਨਿਕ ਬਿਸਥਾਰ ਏਕ ਤੇ ਭਏ ॥
ਏਕੁ ਅਰਾਧਿ ਪਰਾਛਤ ਗਏ ॥
ਮਨ ਤਨ ਅੰਤਰਿ ਏਕੁ ਪ੍ਰਭੁ ਰਾਤਾ ॥
ਗੁਰ ਪ੍ਰਸਾਦਿ ਨਾਨਕ ਇਕੁ ਜਾਤਾ ॥੮॥੧੯॥
ਸਲੋਕੁ ॥
ਫਿਰਤ ਫਿਰਤ ਪ੍ਰਭ ਆਇਆ ਪਰਿਆ ਤਉ ਸਰਨਾਇ ॥
ਨਾਨਕ ਕੀ ਪ੍ਰਭ ਬੇਨਤੀ ਅਪਨੀ ਭਗਤੀ ਲਾਇ ॥੧॥`,
        transliteration: `salok |
saath na chaalai bin bhajan bikhiaa sagalee chhaar |
har har naam kamaavanaa naanak ihu dhan saar |1|
asattapadee |
sant janaa mil karahu beechaar |
ek simar naam aadhaar |
avar upaav sabh meet bisaarahu |
charan kamal rid meh ur dhaarahu |
karan kaaran so prabh samarath |
drirr kar gahahu naam har vath |
eihu dhan sanchahu hovahu bhagavant |
sant janaa kaa niramal mant |
ek aas raakhahu man maeh |
sarab rog naanak mitt jaeh |1|
jis dhan kau chaar kuntt utth dhaaveh |
so dhan har sevaa te paaveh |
jis sukh kau nit baachheh meet |
so sukh saadhoo sang pareet |
jis sobhaa kau kareh bhalee karanee |
saa sobhaa bhaj har kee saranee |
anik upaavee rog na jaae |
rog mittai har avakhadh laae |
sarab nidhaan meh har naam nidhaan |
jap naanak darageh paravaan |2|
man parabodhahu har kai naae |
deh dis dhaavat aavai tthaae |
taa kau bighan na laagai koe |
jaa kai ridai basai har soe |
kal taatee tthaandtaa har naau |
simar simar sadaa sukh paau |
bhau binasai pooran hoe aas |
bhagat bhaae aatam paragaas |
tit ghar jaae basai abinaasee |
kahu naanak kaattee jam faasee |3|
tat beechaar kahai jan saachaa |
janam marai so kaacho kaachaa |
aavaa gavan mittai prabh sev |
aap tiaag saran guradev |
eiau ratan janam kaa hoe udhaar |
har har simar praan aadhaar |
anik upaav na chhoottanahaare |
sinmrit saasat bed beechaare |
har kee bhagat karahu man laae |
man banchhat naanak fal paae |4|
sang na chaalas terai dhanaa |
toon kiaa lapattaaveh moorakh manaa |
sut meet kuttanb ar banitaa |
ein te kahahu tum kavan sanaathaa |
raaj rang maaeaa bisathaar |
ein te kahahu kavan chhuttakaar |
as hasatee rath asavaaree |
jhootthaa ddanf jhootth paasaaree |
jin dee tis bujhai na bigaanaa |
naam bisaar naanak pachhutaanaa |5|
gur kee mat toon lehi eaane |
bhagat binaa bahu ddoobe siaane |
har kee bhagat karahu man meet |
niramal hoe tumaaro cheet |
charan kamal raakhahu man maeh |
janam janam ke kilabikh jaeh |
aap japahu avaraa naam japaavahu |
sunat kehat rehat gat paavahu |
saar bhoot sat har ko naau |
sehaj subhaae naanak gun gaau |6|
gun gaavat teree utaras mail |
binas jaae haumai bikh fail |
hohi achint basai sukh naal |
saas graas har naam samaal |
chhaadd siaanap sagalee manaa |
saadhasang paaveh sach dhanaa |
har poonjee sanch karahu biauhaar |
eehaa sukh daragah jaikaar |
sarab nirantar eko dekh |
kahu naanak jaa kai masatak lekh |7|
eko jap eko saalaeh |
ek simar eko man aaeh |
ekas ke gun gaau anant |
man tan jaap ek bhagavant |
eko ek ek har aap |
pooran poor rahio prabh biaap |
anik bisathaar ek te bhe |
ek araadh paraachhat ge |
man tan antar ek prabh raataa |
gur prasaad naanak ik jaataa |8|19|
salok |
firat firat prabh aaeaa pariaa tau saranaae |
naanak kee prabh benatee apanee bhagatee laae |1|`,
        meaning: `Salok: Nothing shall go along with you, except your devotion. All corruption is like ashes. Practice the Name of the Lord, Har, Har. O Nanak, this is the most excellent wealth. ||1|| Ashtapadee: Joining the Company of the Saints, practice deep meditation. Remember the One, and take the Support of the Naam, the Name of the Lord. Forget all other efforts, O my friend - enshrine the Lord's Lotus Feet within your heart. God is All-powerful; He is the Cause of causes. Grasp firmly the object of the Lord's Name. Gather this wealth, and become very fortunate. Pure are the instructions of the humble Saints. Keep faith in the One Lord within your mind. All disease, O Nanak, shall then be dispelled. ||1|| The wealth which you chase after in the four directions you shall obtain that wealth by serving the Lord. The peace, which you always yearn for, O friend that peace comes by the love of the Company of the Holy. The glory, for which you perform good deeds - you shall obtain that glory by seeking the Lord's Sanctuary. All sorts of remedies have not cured the disease - the disease is cured only by giving the medicine of the Lord's Name. Of all treasures, the Lord's Name is the supreme treasure. Chant it, O Nanak, and be accepted in the Court of the Lord. ||2|| Enlighten your mind with the Name of the Lord. Having wandered around in the ten directions, it comes to its place of rest. No obstacle stands in the way of one whose heart is filled with the Lord. The Dark Age of Kali Yuga is so hot; the Lord's Name is soothing and cool. Remember, remember it in meditation, and obtain everlasting peace. Your fear shall be dispelled, and your hopes shall be fulfilled. By devotional worship and loving adoration, your soul shall be enlightened. You shall go to that home, and live forever. Says Nanak, the noose of death is cut away. ||3|| One who contemplates the essence of reality, is said to be the true person. Birth and death are the lot of the false and the insincere. Coming and going in reincarnation is ended by serving God. Give up your selfishness and conceit, and seek the Sanctuary of the Divine Guru. Thus the jewel of this human life is saved. Remember the Lord, Har, Har, the Support of the breath of life. By all sorts of efforts, people are not saved not by studying the Simritees, the Shaastras or the Vedas. Worship the Lord with whole-hearted devotion. O Nanak, you shall obtain the fruits of your mind's desire. ||4|| Your wealth shall not go with you; why do you cling to it, you fool? Children, friends, family and spouse who of these shall accompany you? Power, pleasure, and the vast expanse of Maya who has ever escaped from these? Horses, elephants, chariots and pageantry - false shows and false displays. The fool does not acknowledge the One who gave this; forgetting the Naam, O Nanak, he will repent in the end. ||5|| Take the Guru's advice, you ignorant fool; without devotion, even the clever have drowned. Worship the Lord with heart-felt devotion, my friend; your consciousness shall become pure. Enshrine the Lord's Lotus Feet in your mind; the sins of countless lifetimes shall depart. Chant the Naam yourself, and inspire others to chant it as well. Hearing, speaking and living it, emancipation is obtained. The essential reality is the True Name of the Lord. With intuitive ease, O Nanak, sing His Glorious Praises. ||6|| Chanting His Glories, your filth shall be washed off. The all-consuming poison of ego will be gone. You shall become carefree, and you shall dwell in peace. With every breath and every morsel of food, cherish the Lord's Name. Renounce all clever tricks, O mind. In the Company of the Holy, you shall obtain the true wealth. So gather the Lord's Name as your capital, and trade in it. In this world you shall be at peace, and in the Court of the Lord, you shall be acclaimed. See the One permeating all; says Nanak, your destiny is pre-ordained. ||7|| Meditate on the One, and worship the One. Remember the One, and yearn for the One in your mind. Sing the endless Glorious Praises of the One. With mind and body, meditate on the One Lord God. The One Lord Himself is the One and Only. The Pervading Lord God is totally permeating all. The many expanses of the creation have all come from the One. Adoring the One, past sins are removed. Mind and body within are imbued with the One God. By Guru's Grace, O Nanak, the One is known. ||8||19|| Salok: After wandering and wandering, O God, I have come, and entered Your Sanctuary. This is Nanak's prayer, O God: please, attach me to Your devotional service. ||1||`,
        meaning_pa: `(ਪ੍ਰਭੂ ਦੇ) ਭਜਨ ਤੋਂ ਬਿਨਾ (ਹੋਰ ਕੋਈ ਸ਼ੈ ਮਨੁੱਖ ਦੇ) ਨਾਲ ਨਹੀਂ ਜਾਂਦੀ, ਸਾਰੀ ਮਾਇਆ (ਜੋ ਮਨੁੱਖ ਕਮਾਉਂਦਾ ਰਹਿੰਦਾ ਹੈ, ਜਗਤ ਤੋਂ ਤੁਰਨ ਵੇਲੇ ਇਸ ਦੇ ਵਾਸਤੇ) ਸੁਆਹ (ਸਮਾਨ) ਹੈ। ਹੇ ਨਾਨਕ! ਅਕਾਲ ਪੁਰਖ ਦਾ ਨਾਮ (ਸਿਮਰਨ) ਦੀ ਕਮਾਈ ਕਰਨਾ ਹੀ (ਸਭ ਤੋਂ) ਚੰਗਾ ਧਨ ਹੈ (ਇਹੀ ਮਨੁੱਖ ਦੇ ਨਾਲ ਨਿਭਦਾ ਹੈ) ॥੧॥ ਸੰਤਾਂ ਨਾਲ ਮਿਲ ਕੇ (ਪ੍ਰਭੂ ਦੇ ਗੁਣਾਂ ਦਾ) ਵਿਚਾਰ ਕਰੋ, ਇੱਕ ਪ੍ਰਭੂ ਨੂੰ ਸਿਮਰੋ ਤੇ ਪ੍ਰਭੂ ਦੇ ਨਾਮ ਦਾ ਆਸਰਾ (ਲਵੋ)। ਹੇ ਮਿਤ੍ਰ! ਹੋਰ ਸਾਰੇ ਹੀਲੇ ਛੱਡ ਦਿਉ, ਤੇ ਪ੍ਰਭੂ ਦੇ ਕਮਲ (ਵਰਗੇ ਸੋਹਣੇ) ਚਰਨ ਹਿਰਦੇ ਵਿਚ ਟਿਕਾਉ। ਉਹ ਪ੍ਰਭੂ (ਸਭ ਕੁਝ ਆਪ) ਕਰਨ (ਤੇ ਜੀਵਾਂ ਪਾਸੋਂ) ਕਰਾਉਣ ਦੀ ਤਾਕਤ ਰੱਖਦਾ ਹੈ, ਉਸ ਪ੍ਰਭੂ ਦਾ ਨਾਮ-ਰੂਪੀ (ਸੋਹਣਾ) ਪਦਾਰਥ ਪੱਕਾ ਕਰ ਕੇ ਸਾਂਭ ਲਵੋ। (ਹੇ ਭਾਈ!) (ਨਾਮ-ਰੂਪ) ਇਹ ਧਨ ਇਕੱਠਾ ਕਰੋ ਤੇ ਭਾਗਾਂ ਵਾਲੇ ਬਣੋ, ਸੰਤਾਂ ਦਾ ਇਹੀ ਪਵਿਤ੍ਰ ਉਪਦੇਸ਼ ਹੈ। ਆਪਣੇ ਮਨ ਵਿਚ ਇਕ (ਪ੍ਰਭੂ ਦੀ) ਆਸ ਰੱਖੋ, ਹੇ ਨਾਨਕ! (ਇਸ ਤਰ੍ਹਾਂ) ਸਾਰੇ ਰੋਗ ਮਿਟ ਜਾਣਗੇ ॥੧॥ (ਹੇ ਮਿਤ੍ਰ!) ਜਿਸ ਧਨ ਦੀ ਖ਼ਾਤਰ (ਤੂੰ) ਚੌਹੀਂ ਪਾਸੀਂ ਉਠ ਦੌੜਦਾ ਹੈਂ, ਉਹ ਧਨ ਤੂੰ ਪ੍ਰਭੂ ਦੀ ਸੇਵਾ ਤੋਂ ਲਏਂਗਾ। ਹੇ ਮਿਤ੍ਰ! ਜਿਸ ਸੁਖ ਨੂੰ ਤੂੰ ਸਦਾ ਤਾਂਘਦਾ ਹੈਂ, ਉਹ ਸੁਖ ਸੰਤਾਂ ਦੀ ਸੰਗਤਿ ਵਿਚ ਪਿਆਰ ਕੀਤਿਆਂ (ਮਿਲਦਾ ਹੈ)। ਜਿਸ ਸੋਭਾ ਦੀ ਖ਼ਾਤਰ ਤੂੰ ਨੇਕ ਕਮਾਈ ਕਰਦਾ ਹੈਂ, ਉਹ ਸੋਭਾ (ਖੱਟਣ ਲਈ) ਤੂੰ ਅਕਾਲ ਪੁਰਖ ਦੀ ਸਰਣ ਪਉ। (ਜੇਹੜਾ ਹਉਮੈ ਦਾ) ਰੋਗ ਅਨੇਕਾਂ ਹੀਲਿਆਂ ਨਾਲ ਦੂਰ ਨਹੀਂ ਹੁੰਦਾ, ਉਹ ਰੋਗ ਪ੍ਰਭੂ ਦਾ ਨਾਮ-ਰੂਪੀ ਦਵਾਈ ਵਰਤਿਆਂ ਮਿਟ ਜਾਂਦਾ ਹੈ। ਸਾਰੇ (ਦੁਨੀਆਵੀ) ਖ਼ਜ਼ਾਨਿਆਂ ਵਿਚ ਪ੍ਰਭੂ ਦਾ ਨਾਮ (ਵਧੀਆ) ਖ਼ਜ਼ਾਨਾ ਹੈ। ਹੇ ਨਾਨਕ! (ਨਾਮ) ਜਪ, ਦਰਗਾਹ ਵਿਚ ਕਬੂਲ (ਹੋਵੇਂਗਾ) ॥੨॥ (ਹੇ ਭਾਈ! ਆਪਣੇ) ਮਨ ਨੂੰ ਪ੍ਰਭੂ ਦੇ ਨਾਮ ਨਾਲ ਜਗਾਉ, (ਨਾਮ ਦੀ ਬਰਕਤਿ ਨਾਲ) ਦਸੀਂ ਪਾਸੀਂ ਦੌੜਦਾ (ਇਹ ਮਨ) ਟਿਕਾਣੇ ਆ ਜਾਂਦਾ ਹੈ। ਉਸ ਮਨੁੱਖ ਨੂੰ ਕੋਈ ਔਕੜ ਨਹੀਂ ਪੋਂਹਦੀ, ਜਿਸ ਦੇ ਹਿਰਦੇ ਵਿਚ ਉਹ ਪ੍ਰਭੂ ਵੱਸਦਾ ਹੈ। ਕਲਿਜੁਗ ਤੱਤੀ (ਅੱਗ) ਹੈ (ਭਾਵ, ਵਿਕਾਰ ਜੀਆਂ ਨੂੰ ਸਾੜ ਰਹੇ ਹਨ) ਪ੍ਰਭੂ ਦਾ ਨਾਮ ਠੰਢਾ ਹੈ, ਉਸ ਨੂੰ ਸਦਾ ਸਿਮਰੋ ਤੇ ਸੁਖ ਪਾਉ। (ਨਾਮ ਸਿਮਰਿਆਂ) ਡਰ ਉੱਡ ਜਾਂਦਾ ਹੈ, ਤੇ, ਆਸ ਪੁੱਗ ਜਾਂਦੀ ਹੈ (ਭਾਵ, ਨਾਹ ਹੀ ਮਨੁੱਖ ਆਸਾਂ ਬੰਨ੍ਹਦਾ ਫਿਰਦਾ ਹੈ ਤੇ ਨਾਹ ਹੀ ਉਹਨਾਂ ਆਸਾਂ ਦੇ ਟੁੱਟਣ ਦਾ ਕੋਈ ਡਰ ਹੁੰਦਾ ਹੈ) (ਕਿਉਂਕਿ) ਪ੍ਰਭੂ ਦੀ ਭਗਤੀ ਨਾਲ ਪਿਆਰ ਕੀਤਿਆਂ ਆਤਮਾ ਚਮਕ ਪੈਂਦਾ ਹੈ। (ਜੋ ਸਿਮਰਦਾ ਹੈ) ਉਸ ਦੇ (ਹਿਰਦੇ) ਘਰ ਵਿਚ ਅਬਿਨਾਸੀ ਪ੍ਰਭੂ ਆ ਵੱਸਦਾ ਹੈ। ਨਾਨਕ ਆਖਦਾ ਹੈ (ਕਿ ਨਾਮ ਜਪਿਆਂ) ਜਮਾਂ ਦੀ ਫਾਹੀ ਕੱਟੀ ਜਾਂਦੀ ਹੈ ॥੩॥ ਜੋ ਮਨੁੱਖ ਪਾਰਬ੍ਰਹਮ ਦੀ ਸਿਫ਼ਤਿ-ਰੂਪ ਸੋਚ ਸੋਚਦਾ ਹੈ ਉਹ ਸਚ-ਮੁਚ ਮਨੁੱਖ ਹੈ, ਪਰ ਜੋ ਜੰਮ ਕੇ (ਨਿਰਾ) ਮਰ ਜਾਂਦਾ ਹੈ (ਤੇ ਬੰਦਗੀ ਨਹੀਂ ਕਰਦਾ) ਉਹ ਨਿਰੋਲ ਕੱਚਾ ਹੈ। ਪ੍ਰਭੂ ਦਾ ਸਿਮਰਨ ਕੀਤਿਆਂ ਜਨਮ ਮਰਨ ਦਾ ਗੇੜ ਮੁੱਕ ਜਾਂਦਾ ਹੈ; ਆਪਾ-ਭਾਵ ਛੱਡ ਕੇ, ਸਤਿਗੁਰੂ ਦੀ ਸਰਨੀ ਪੈ ਕੇ (ਜਨਮ ਮਰਨ ਦਾ ਗੇੜ ਮੁੱਕਦਾ ਹੈ) ਇਸ ਤਰ੍ਹਾਂ ਕੀਮਤੀ ਮਨੁੱਖਾ ਜਨਮ ਸਫਲਾ ਹੋ ਜਾਂਦਾ ਹੈ। (ਤਾਂ ਤੇ, ਹੇ ਭਾਈ!) ਪ੍ਰਭੂ ਨੂੰ ਸਿਮਰ, (ਇਹੀ) ਪ੍ਰਾਣਾਂ ਦਾ ਆਸਰਾ ਹੈ। ਅਨੇਕਾਂ ਹੀਲੇ ਕੀਤਿਆਂ (ਆਵਾਗਵਨ ਤੋਂ) ਬਚ ਨਹੀਂ ਸਕੀਦਾ; ਸਿੰਮ੍ਰਿਤੀਆਂ ਸ਼ਾਸਤ੍ਰ ਵੇਦ (ਆਦਿਕ) ਵਿਚਾਰਿਆਂ (ਆਵਾ ਗਵਨ ਤੋਂ ਛੁਟਕਾਰਾ ਨਹੀਂ ਹੁੰਦਾ।) ਮਨ ਲਾ ਕੇ ਕੇਵਲ ਪ੍ਰਭੂ ਦੀ ਹੀ ਭਗਤੀ ਕਰੋ। (ਜੋ ਭਗਤੀ ਕਰਦਾ ਹੈ) ਹੇ ਨਾਨਕ! ਉਸ ਨੂੰ ਮਨ-ਇੱਛਤ ਫਲ ਮਿਲ ਜਾਂਦੇ ਹਨ ॥੪॥ ਹੇ ਮੂਰਖ ਮਨ! ਧਨ ਤੇਰੇ ਨਾਲ ਨਹੀਂ ਜਾ ਸਕਦਾ, ਤੂੰ ਕਿਉਂ ਇਸ ਨੂੰ ਜੱਫਾ ਮਾਰੀ ਬੈਠਾ ਹੈਂ? ਪੁਤ੍ਰ, ਮਿੱਤ੍ਰ, ਪਰਵਾਰ ਤੇ ਇਸਤ੍ਰੀ; ਇਹਨਾਂ ਵਿਚੋਂ, ਦੱਸ, ਕੌਣ ਤੇਰਾ ਸਾਥ ਦੇਣ ਵਾਲਾ ਹੈ? ਮਾਇਆ ਦੇ ਅਡੰਬਰ, ਰਾਜ ਤੇ ਰੰਗ-ਰਲੀਆਂ- ਦੱਸੋ, ਇਹਨਾਂ ਵਿਚੋਂ ਕਿਸ ਦੇ ਨਾਲ (ਮੋਹ ਪਾਇਆਂ) ਸਦਾ ਲਈ (ਮਾਇਆ ਤੋਂ) ਖ਼ਲਾਸੀ ਮਿਲ ਸਕਦੀ ਹੈ? ਘੋੜੇ, ਹਾਥੀ, ਰਥਾਂ ਦੀ ਸਵਾਰੀ ਕਰਨੀ- ਇਹ ਸਭ ਝੂਠਾ ਦਿਖਾਵਾ ਹੈ, ਇਹ ਅਡੰਬਰ ਰਚਾਉਣ ਵਾਲਾ ਭੀ ਬਿਨਸਨਹਾਰ ਹੈ। ਮੂਰਖ ਮਨੁੱਖ ਉਸ ਪ੍ਰਭੂ ਨੂੰ ਨਹੀਂ ਪਛਾਣਦਾ ਜਿਸ ਨੇ ਇਹ ਸਾਰੇ ਪਦਾਰਥ ਦਿੱਤੇ ਹਨ, ਤੇ, ਨਾਮ ਨੂੰ ਭੁਲਾ ਕੇ, ਹੇ ਨਾਨਕ! (ਆਖ਼ਰ) ਪਛੁਤਾਉਂਦਾ ਹੈ ॥੫॥ ਹੇ ਅੰਞਾਣ! ਸਤਿਗੁਰੂ ਦੀ ਮਤਿ ਲੈ (ਭਾਵ, ਸਿੱਖਿਆ ਤੇ ਤੁਰ) ਬੜੇ ਸਿਆਣੇ ਸਿਆਣੇ ਬੰਦੇ ਭੀ ਭਗਤੀ ਤੋਂ ਬਿਨਾ (ਵਿਕਾਰਾਂ ਵਿਚ ਹੀ) ਡੁੱਬ ਜਾਂਦੇ ਹਨ। ਹੇ ਮਿਤ੍ਰ ਮਨ! ਪ੍ਰਭੂ ਦੀ ਭਗਤੀ ਕਰ, ਇਸ ਤਰ੍ਹਾਂ ਤੇਰੀ ਸੁਰਤ ਪਵਿਤ੍ਰ ਹੋਵੇਗੀ। (ਹੇ ਭਾਈ!) ਪ੍ਰਭੂ ਦੇ ਕਮਲ (ਵਰਗੇ ਸੋਹਣੇ) ਚਰਨ ਆਪਣੇ ਮਨ ਵਿਚ ਪ੍ਰੋ ਰੱਖ, ਇਸ ਤਰ੍ਹਾਂ ਕਈ ਜਨਮਾਂ ਦੇ ਪਾਪ ਨਾਸ ਹੋ ਜਾਣਗੇ। (ਪ੍ਰਭੂ ਦਾ ਨਾਮ) ਤੂੰ ਆਪ ਜਪ, ਤੇ, ਹੋਰਨਾਂ ਨੂੰ ਜਪਣ ਲਈ ਪ੍ਰੇਰ, (ਨਾਮ) ਸੁਣਦਿਆਂ, ਉੱਚਾਰਦਿਆਂ ਤੇ ਨਿਰਮਲ ਰਹਿਣੀ ਰਹਿੰਦਿਆਂ ਉੱਚੀ ਅਵਸਥਾ ਬਣ ਜਾਏਗੀ। ਪ੍ਰਭੂ ਦਾ ਨਾਮ ਹੀ ਸਭ ਪਦਾਰਥਾਂ ਤੋਂ ਉੱਤਮ ਪਦਾਰਥ ਹੈ; (ਤਾਂ ਤੇ) ਹੇ ਨਾਨਕ! ਆਤਮਕ ਅਡੋਲਤਾ ਵਿਚ ਟਿਕ ਕੇ ਪ੍ਰੇਮ ਨਾਲ ਪ੍ਰਭੂ ਦੇ ਗੁਣ ਗਾ ॥੬॥ (ਹੇ ਭਾਈ!) ਪ੍ਰਭੂ ਦੇ ਗੁਣ ਗਾਉਂਦਿਆਂ ਤੇਰੀ (ਵਿਕਾਰਾਂ ਦੀ) ਮੈਲ ਉਤਰ ਜਾਏਗੀ, ਤੇ ਹਉਮੈ ਰੂਪੀ ਵਿਹੁ ਦਾ ਖਿਲਾਰਾ ਭੀ ਮਿਟ ਜਾਏਗਾ। ਤੂੰ ਬੇਫ਼ਿਕਰ ਹੋ ਜਾਹਿਂਗਾ ਤੇ ਤੇਰਾ ਜੀਵਨ ਸੁਖ ਨਾਲ ਬਿਤੀਤ ਹੋਵੇਗਾ- ਦਮ-ਬ-ਦਮ ਪ੍ਰਭੂ ਦੇ ਨਾਮ ਨੂੰ ਯਾਦ ਕਰ। ਹੇ ਮਨ! ਸਾਰੀ ਚਤੁਰਾਈ ਛੱਡ ਦੇਹ, ਸਦਾ ਨਾਲ ਨਿਭਣ ਵਾਲਾ ਧਨ ਸਤਸੰਗ ਵਿਚ ਮਿਲੇਗਾ। ਪ੍ਰਭੂ ਦੇ ਨਾਮ ਦੀ ਰਾਸ ਇਕੱਠੀ ਕਰ, ਇਹੀ ਵਿਹਾਰ ਕਰ। ਇਸ ਜੀਵਨ ਵਿਚ ਸੁਖ ਮਿਲੇਗਾ, ਤੇ, ਪ੍ਰਭੂ ਦੀ ਦਰਗਾਹ ਵਿਚ ਆਦਰ ਹੋਵੇਗਾ। ਸਭ ਜੀਵਾਂ ਦੇ ਅੰਦਰ ਇਕ ਅਕਾਲ ਪੁਰਖ ਨੂੰ ਹੀ ਵੇਖ। (ਪਰ) ਨਾਨਕ ਆਖਦਾ ਹੈ- (ਇਹ ਕੰਮ ਓਹੀ ਮਨੁੱਖ ਕਰਦਾ ਹੈ) ਜਿਸ ਦੇ ਮੱਥੇ ਤੇ ਭਾਗ ਹਨ ॥੭॥ ਇਕ ਪ੍ਰਭੂ ਨੂੰ ਹੀ ਜਪ, ਤੇ ਇਕ ਪ੍ਰਭੂ ਦੀ ਹੀ ਸਿਫ਼ਤਿ ਕਰ, ਇਕ ਨੂੰ ਸਿਮਰ, ਤੇ, ਹੇ ਮਨ! ਇਕ ਪ੍ਰਭੂ ਦੇ ਮਿਲਣ ਦੀ ਤਾਂਘ ਰੱਖ। ਇਕ ਪ੍ਰਭੂ ਦੇ ਹੀ ਗੁਣ ਗਾ, ਮਨ ਵਿਚ ਤੇ ਸਰੀਰਕ ਇੰਦ੍ਰਿਆਂ ਦੀ ਰਾਹੀਂ ਇਕ ਭਗਵਾਨ ਨੂੰ ਹੀ ਜਪ। (ਸਭ ਥਾਈਂ) ਪ੍ਰਭੂ ਆਪ ਹੀ ਆਪ ਹੈ, ਸਭ ਜੀਵਾਂ ਵਿਚ ਪ੍ਰਭੂ ਹੀ ਵੱਸ ਰਿਹਾ ਹੈ। (ਜਗਤ ਦੇ) ਅਨੇਕਾਂ ਖਿਲਾਰੇ ਇਕ ਪ੍ਰਭੂ ਤੋਂ ਹੀ ਹੋਏ ਹਨ, ਇਕ ਪ੍ਰਭੂ ਨੂੰ ਸਿਮਰਿਆਂ ਪਾਪ ਨਾਸ ਹੋ ਜਾਂਦੇ ਹਨ। ਜਿਸ ਮਨੁੱਖ ਦੇ ਮਨ ਤੇ ਸਰੀਰ ਵਿਚ ਇਕ ਪ੍ਰਭੂ ਹੀ ਪਰੋਤਾ ਗਿਆ ਹੈ, ਹੇ ਨਾਨਕ! ਉਸ ਨੇ ਗੁਰੂ ਦੀ ਕਿਰਪਾ ਨਾਲ ਉਸ ਇਕ ਪ੍ਰਭੂ ਨੂੰ ਪਛਾਣ ਲਿਆ ਹੈ ॥੮॥੧੯॥ ਹੇ ਪ੍ਰਭੂ! ਭਟਕਦਾ ਭਟਕਦਾ ਮੈਂ ਤੇਰੀ ਸਰਣ ਆ ਪਿਆ ਹਾਂ। ਹੇ ਪ੍ਰਭੂ! ਨਾਨਕ ਦੀ ਇਹੀ ਬੇਨਤੀ ਹੈ ਕਿ ਮੈਨੂੰ ਆਪਣੀ ਭਗਤੀ ਵਿਚ ਜੋੜ ॥੧॥`
      },
      {
        number: 20,
        sanskrit: `ਸਲੋਕੁ ॥
ਫਿਰਤ ਫਿਰਤ ਪ੍ਰਭ ਆਇਆ ਪਰਿਆ ਤਉ ਸਰਨਾਇ ॥
ਨਾਨਕ ਕੀ ਪ੍ਰਭ ਬੇਨਤੀ ਅਪਨੀ ਭਗਤੀ ਲਾਇ ॥੧॥
ਅਸਟਪਦੀ ॥
ਜਾਚਕ ਜਨੁ ਜਾਚੈ ਪ੍ਰਭ ਦਾਨੁ ॥
ਕਰਿ ਕਿਰਪਾ ਦੇਵਹੁ ਹਰਿ ਨਾਮੁ ॥
ਸਾਧ ਜਨਾ ਕੀ ਮਾਗਉ ਧੂਰਿ ॥
ਪਾਰਬ੍ਰਹਮ ਮੇਰੀ ਸਰਧਾ ਪੂਰਿ ॥
ਸਦਾ ਸਦਾ ਪ੍ਰਭ ਕੇ ਗੁਨ ਗਾਵਉ ॥
ਸਾਸਿ ਸਾਸਿ ਪ੍ਰਭ ਤੁਮਹਿ ਧਿਆਵਉ ॥
ਚਰਨ ਕਮਲ ਸਿਉ ਲਾਗੈ ਪ੍ਰੀਤਿ ॥
ਭਗਤਿ ਕਰਉ ਪ੍ਰਭ ਕੀ ਨਿਤ ਨੀਤਿ ॥
ਏਕ ਓਟ ਏਕੋ ਆਧਾਰੁ ॥
ਨਾਨਕੁ ਮਾਗੈ ਨਾਮੁ ਪ੍ਰਭ ਸਾਰੁ ॥੧॥
ਪ੍ਰਭ ਕੀ ਦ੍ਰਿਸਟਿ ਮਹਾ ਸੁਖੁ ਹੋਇ ॥
ਹਰਿ ਰਸੁ ਪਾਵੈ ਬਿਰਲਾ ਕੋਇ ॥
ਜਿਨ ਚਾਖਿਆ ਸੇ ਜਨ ਤ੍ਰਿਪਤਾਨੇ ॥
ਪੂਰਨ ਪੁਰਖ ਨਹੀ ਡੋਲਾਨੇ ॥
ਸੁਭਰ ਭਰੇ ਪ੍ਰੇਮ ਰਸ ਰੰਗਿ ॥
ਉਪਜੈ ਚਾਉ ਸਾਧ ਕੈ ਸੰਗਿ ॥
ਪਰੇ ਸਰਨਿ ਆਨ ਸਭ ਤਿਆਗਿ ॥
ਅੰਤਰਿ ਪ੍ਰਗਾਸ ਅਨਦਿਨੁ ਲਿਵ ਲਾਗਿ ॥
ਬਡਭਾਗੀ ਜਪਿਆ ਪ੍ਰਭੁ ਸੋਇ ॥
ਨਾਨਕ ਨਾਮਿ ਰਤੇ ਸੁਖੁ ਹੋਇ ॥੨॥
ਸੇਵਕ ਕੀ ਮਨਸਾ ਪੂਰੀ ਭਈ ॥
ਸਤਿਗੁਰ ਤੇ ਨਿਰਮਲ ਮਤਿ ਲਈ ॥
ਜਨ ਕਉ ਪ੍ਰਭੁ ਹੋਇਓ ਦਇਆਲੁ ॥
ਸੇਵਕੁ ਕੀਨੋ ਸਦਾ ਨਿਹਾਲੁ ॥
ਬੰਧਨ ਕਾਟਿ ਮੁਕਤਿ ਜਨੁ ਭਇਆ ॥
ਜਨਮ ਮਰਨ ਦੂਖੁ ਭ੍ਰਮੁ ਗਇਆ ॥
ਇਛ ਪੁਨੀ ਸਰਧਾ ਸਭ ਪੂਰੀ ॥
ਰਵਿ ਰਹਿਆ ਸਦ ਸੰਗਿ ਹਜੂਰੀ ॥
ਜਿਸ ਕਾ ਸਾ ਤਿਨਿ ਲੀਆ ਮਿਲਾਇ ॥
ਨਾਨਕ ਭਗਤੀ ਨਾਮਿ ਸਮਾਇ ॥੩॥
ਸੋ ਕਿਉ ਬਿਸਰੈ ਜਿ ਘਾਲ ਨ ਭਾਨੈ ॥
ਸੋ ਕਿਉ ਬਿਸਰੈ ਜਿ ਕੀਆ ਜਾਨੈ ॥
ਸੋ ਕਿਉ ਬਿਸਰੈ ਜਿਨਿ ਸਭੁ ਕਿਛੁ ਦੀਆ ॥
ਸੋ ਕਿਉ ਬਿਸਰੈ ਜਿ ਜੀਵਨ ਜੀਆ ॥
ਸੋ ਕਿਉ ਬਿਸਰੈ ਜਿ ਅਗਨਿ ਮਹਿ ਰਾਖੈ ॥
ਗੁਰ ਪ੍ਰਸਾਦਿ ਕੋ ਬਿਰਲਾ ਲਾਖੈ ॥
ਸੋ ਕਿਉ ਬਿਸਰੈ ਜਿ ਬਿਖੁ ਤੇ ਕਾਢੈ ॥
ਜਨਮ ਜਨਮ ਕਾ ਟੂਟਾ ਗਾਢੈ ॥
ਗੁਰਿ ਪੂਰੈ ਤਤੁ ਇਹੈ ਬੁਝਾਇਆ ॥
ਪ੍ਰਭੁ ਅਪਨਾ ਨਾਨਕ ਜਨ ਧਿਆਇਆ ॥੪॥
ਸਾਜਨ ਸੰਤ ਕਰਹੁ ਇਹੁ ਕਾਮੁ ॥
ਆਨ ਤਿਆਗਿ ਜਪਹੁ ਹਰਿ ਨਾਮੁ ॥
ਸਿਮਰਿ ਸਿਮਰਿ ਸਿਮਰਿ ਸੁਖ ਪਾਵਹੁ ॥
ਆਪਿ ਜਪਹੁ ਅਵਰਹ ਨਾਮੁ ਜਪਾਵਹੁ ॥
ਭਗਤਿ ਭਾਇ ਤਰੀਐ ਸੰਸਾਰੁ ॥
ਬਿਨੁ ਭਗਤੀ ਤਨੁ ਹੋਸੀ ਛਾਰੁ ॥
ਸਰਬ ਕਲਿਆਣ ਸੂਖ ਨਿਧਿ ਨਾਮੁ ॥
ਬੂਡਤ ਜਾਤ ਪਾਏ ਬਿਸ੍ਰਾਮੁ ॥
ਸਗਲ ਦੂਖ ਕਾ ਹੋਵਤ ਨਾਸੁ ॥
ਨਾਨਕ ਨਾਮੁ ਜਪਹੁ ਗੁਨਤਾਸੁ ॥੫॥
ਉਪਜੀ ਪ੍ਰੀਤਿ ਪ੍ਰੇਮ ਰਸੁ ਚਾਉ ॥
ਮਨ ਤਨ ਅੰਤਰਿ ਇਹੀ ਸੁਆਉ ॥
ਨੇਤ੍ਰਹੁ ਪੇਖਿ ਦਰਸੁ ਸੁਖੁ ਹੋਇ ॥
ਮਨੁ ਬਿਗਸੈ ਸਾਧ ਚਰਨ ਧੋਇ ॥
ਭਗਤ ਜਨਾ ਕੈ ਮਨਿ ਤਨਿ ਰੰਗੁ ॥
ਬਿਰਲਾ ਕੋਊ ਪਾਵੈ ਸੰਗੁ ॥
ਏਕ ਬਸਤੁ ਦੀਜੈ ਕਰਿ ਮਇਆ ॥
ਗੁਰ ਪ੍ਰਸਾਦਿ ਨਾਮੁ ਜਪਿ ਲਇਆ ॥
ਤਾ ਕੀ ਉਪਮਾ ਕਹੀ ਨ ਜਾਇ ॥
ਨਾਨਕ ਰਹਿਆ ਸਰਬ ਸਮਾਇ ॥੬॥
ਪ੍ਰਭ ਬਖਸੰਦ ਦੀਨ ਦਇਆਲ ॥
ਭਗਤਿ ਵਛਲ ਸਦਾ ਕਿਰਪਾਲ ॥
ਅਨਾਥ ਨਾਥ ਗੋਬਿੰਦ ਗੁਪਾਲ ॥
ਸਰਬ ਘਟਾ ਕਰਤ ਪ੍ਰਤਿਪਾਲ ॥
ਆਦਿ ਪੁਰਖ ਕਾਰਣ ਕਰਤਾਰ ॥
ਭਗਤ ਜਨਾ ਕੇ ਪ੍ਰਾਨ ਅਧਾਰ ॥
ਜੋ ਜੋ ਜਪੈ ਸੁ ਹੋਇ ਪੁਨੀਤ ॥
ਭਗਤਿ ਭਾਇ ਲਾਵੈ ਮਨ ਹੀਤ ॥
ਹਮ ਨਿਰਗੁਨੀਆਰ ਨੀਚ ਅਜਾਨ ॥
ਨਾਨਕ ਤੁਮਰੀ ਸਰਨਿ ਪੁਰਖ ਭਗਵਾਨ ॥੭॥
ਸਰਬ ਬੈਕੁੰਠ ਮੁਕਤਿ ਮੋਖ ਪਾਏ ॥
ਏਕ ਨਿਮਖ ਹਰਿ ਕੇ ਗੁਨ ਗਾਏ ॥
ਅਨਿਕ ਰਾਜ ਭੋਗ ਬਡਿਆਈ ॥
ਹਰਿ ਕੇ ਨਾਮ ਕੀ ਕਥਾ ਮਨਿ ਭਾਈ ॥
ਬਹੁ ਭੋਜਨ ਕਾਪਰ ਸੰਗੀਤ ॥
ਰਸਨਾ ਜਪਤੀ ਹਰਿ ਹਰਿ ਨੀਤ ॥
ਭਲੀ ਸੁ ਕਰਨੀ ਸੋਭਾ ਧਨਵੰਤ ॥
ਹਿਰਦੈ ਬਸੇ ਪੂਰਨ ਗੁਰ ਮੰਤ ॥
ਸਾਧਸੰਗਿ ਪ੍ਰਭ ਦੇਹੁ ਨਿਵਾਸ ॥
ਸਰਬ ਸੂਖ ਨਾਨਕ ਪਰਗਾਸ ॥੮॥੨੦॥
ਸਲੋਕੁ ॥
ਸਰਗੁਨ ਨਿਰਗੁਨ ਨਿਰੰਕਾਰ ਸੁੰਨ ਸਮਾਧੀ ਆਪਿ ॥
ਆਪਨ ਕੀਆ ਨਾਨਕਾ ਆਪੇ ਹੀ ਫਿਰਿ ਜਾਪਿ ॥੧॥`,
        transliteration: `salok |
firat firat prabh aaeaa pariaa tau saranaae |
naanak kee prabh benatee apanee bhagatee laae |1|
asattapadee |
jaachak jan jaachai prabh daan |
kar kirapaa devahu har naam |
saadh janaa kee maagau dhoor |
paarabraham meree saradhaa poor |
sadaa sadaa prabh ke gun gaavau |
saas saas prabh tumeh dhiaavau |
charan kamal siau laagai preet |
bhagat krau prabh kee nit neet |
ek ott eko aadhaar |
naanak maagai naam prabh saar |1|
prabh kee drisatt mahaa sukh hoe |
har ras paavai biralaa koe |
jin chaakhiaa se jan tripataane |
pooran purakh nahee ddolaane |
subhar bhare prem ras rang |
aupajai chaau saadh kai sang |
pare saran aan sabh tiaag |
antar pragaas anadin liv laag |
baddabhaagee japiaa prabh soe |
naanak naam rate sukh hoe |2|
sevak kee manasaa pooree bhee |
satigur te niramal mat lee |
jan kau prabh hoeo deaal |
sevak keeno sadaa nihaal |
bandhan kaatt mukat jan bheaa |
janam maran dookh bhram geaa |
eichh punee saradhaa sabh pooree |
rav rahiaa sad sang hajooree |
jis kaa saa tin leea milaae |
naanak bhagatee naam samaae |3|
so kiau bisarai ji ghaal na bhaanai |
so kiau bisarai ji keea jaanai |
so kiau bisarai jin sabh kichh deea |
so kiau bisarai ji jeevan jeea |
so kiau bisarai ji agan meh raakhai |
gur prasaad ko biralaa laakhai |
so kiau bisarai ji bikh te kaadtai |
janam janam kaa ttoottaa gaadtai |
gur poorai tat ihai bujhaaeaa |
prabh apanaa naanak jan dhiaaeaa |4|
saajan sant karahu ihu kaam |
aan tiaag japahu har naam |
simar simar simar sukh paavahu |
aap japahu avarah naam japaavahu |
bhagat bhaae tareeai sansaar |
bin bhagatee tan hosee chhaar |
sarab kaliaan sookh nidh naam |
booddat jaat paae bisraam |
sagal dookh kaa hovat naas |
naanak naam japahu gunataas |5|
aupajee preet prem ras chaau |
man tan antar ihee suaau |
netrahu pekh daras sukh hoe |
man bigasai saadh charan dhoe |
bhagat janaa kai man tan rang |
biralaa koaoo paavai sang |
ek basat deejai kar meaa |
gur prasaad naam jap leaa |
taa kee upamaa kahee na jaae |
naanak rahiaa sarab samaae |6|
prabh bakhasand deen deaal |
bhagat vachhal sadaa kirapaal |
anaath naath gobind gupaal |
sarab ghattaa karat pratipaal |
aad purakh kaaran karataar |
bhagat janaa ke praan adhaar |
jo jo japai su hoe puneet |
bhagat bhaae laavai man heet |
ham niraguneeaar neech ajaan |
naanak tumaree saran purakh bhagavaan |7|
sarab baikuntth mukat mokh paae |
ek nimakh har ke gun gaae |
anik raaj bhog baddiaaee |
har ke naam kee kathaa man bhaaee |
bahu bhojan kaapar sangeet |
rasanaa japatee har har neet |
bhalee su karanee sobhaa dhanavant |
hiradai base pooran gur mant |
saadhasang prabh dehu nivaas |
sarab sookh naanak paragaas |8|20|
salok |
saragun niragun nirankaar sun samaadhee aap |
aapan keea naanakaa aape hee fir jaap |1|`,
        meaning: `Salok: After wandering and wandering, O God, I have come, and entered Your Sanctuary. This is Nanak's prayer, O God: please, attach me to Your devotional service. ||1|| Ashtapadee: I am a beggar; I beg for this gift from You: please, by Your Mercy, Lord, give me Your Name. I ask for the dust of the feet of the Holy. O Supreme Lord God, please fulfill my yearning; may I sing the Glorious Praises of God forever and ever. With each and every breath, may I meditate on You, O God. May I enshrine affection for Your Lotus Feet. May I perform devotional worship to God each and every day. You are my only Shelter, my only Support. Nanak asks for the most sublime, the Naam, the Name of God. ||1|| By God's Gracious Glance, there is great peace. Rare are those who obtain the juice of the Lord's essence. Those who taste it are satisfied. They are fulfilled and realized beings - they do not waver. They are totally filled to over-flowing with the sweet delight of His Love. Spiritual delight wells up within, in the Saadh Sangat, the Company of the Holy. Taking to His Sanctuary, they forsake all others. Deep within, they are enlightened, and they center themselves on Him, day and night. Most fortunate are those who meditate on God. O Nanak, attuned to the Naam, they are at peace. ||2|| The wishes of the Lord's servant are fulfilled. From the True Guru, the pure teachings are obtained. Unto His humble servant, God has shown His kindness. He has made His servant eternally happy. The bonds of His humble servant are cut away, and he is liberated. The pains of birth and death, and doubt are gone. Desires are satisfied, and faith is fully rewarded, imbued forever with His all-pervading peace. He is His - he merges in Union with Him. Nanak is absorbed in devotional worship of the Naam. ||3|| Why forget Him, who does not overlook our efforts? Why forget Him, who acknowledges what we do? Why forget Him, who has given us everything? Why forget Him, who is the Life of the living beings? Why forget Him, who preserves us in the fire of the womb? By Guru's Grace, rare is the one who realizes this. Why forget Him, who lifts us up out of corruption? Those separated from Him for countless lifetimes, are re-united with Him once again. Through the Perfect Guru, this essential reality is understood. O Nanak, God's humble servants meditate on Him. ||4|| O friends, O Saints, make this your work. Renounce everything else, and chant the Name of the Lord. Meditate, meditate, meditate in remembrance of Him, and find peace. Chant the Naam yourself, and inspire others to chant it. By loving devotional worship, you shall cross over the world-ocean. Without devotional meditation, the body will be just ashes. All joys and comforts are in the treasure of the Naam. Even the drowning can reach the place of rest and safety. All sorrows shall vanish. O Nanak, chant the Naam, the treasure of excellence. ||5|| Love and affection, and the taste of yearning, have welled up within; within my mind and body, this is my purpose: beholding with my eyes His Blessed Vision, I am at peace. My mind blossoms forth in ecstasy, washing the feet of the Holy. The minds and bodies of His devotees are infused with His Love. Rare is the one who obtains their company. Show Your mercy - please, grant me this one request: by Guru's Grace, may I chant the Naam. His Praises cannot be spoken; O Nanak, He is contained among all. ||6|| God, the Forgiving Lord, is kind to the poor. He loves His devotees, and He is always merciful to them. The Patron of the patronless, the Lord of the Universe, the Sustainer of the world, the Nourisher of all beings. The Primal Being, the Creator of the Creation. The Support of the breath of life of His devotees. Whoever meditates on Him is sanctified, focusing the mind in loving devotional worship. I am unworthy, lowly and ignorant. Nanak has entered Your Sanctuary, O Supreme Lord God. ||7|| Everything is obtained: the heavens, liberation and deliverance, if one sings the Lord's Glories, even for an instant. So many realms of power, pleasures and great glories, come to one whose mind is pleased with the Sermon of the Lord's Name. Abundant foods, clothes and music come to one whose tongue continually chants the Lord's Name, Har, Har. His actions are good, he is glorious and wealthy; the Mantra of the Perfect Guru dwells within his heart. O God, grant me a home in the Company of the Holy. All pleasures, O Nanak, are so revealed. ||8||20|| Salok: He possesses all qualities; He transcends all qualities; He is the Formless Lord. He Himself is in Primal Samaadhi. Through His Creation, O Nanak, He meditates on Himself. ||1||`,
        meaning_pa: `ਹੇ ਪ੍ਰਭੂ! ਭਟਕਦਾ ਭਟਕਦਾ ਮੈਂ ਤੇਰੀ ਸਰਣ ਆ ਪਿਆ ਹਾਂ। ਹੇ ਪ੍ਰਭੂ! ਨਾਨਕ ਦੀ ਇਹੀ ਬੇਨਤੀ ਹੈ ਕਿ ਮੈਨੂੰ ਆਪਣੀ ਭਗਤੀ ਵਿਚ ਜੋੜ ॥੧॥ ਹੇ ਪ੍ਰਭੂ! (ਇਹ) ਮੰਗਤਾ ਦਾਸ (ਤੇਰੇ ਨਾਮ ਦਾ) ਦਾਨ ਮੰਗਦਾ ਹੈ; ਹੇ ਹਰੀ! ਕਿਰਪਾ ਕਰ ਕੇ (ਆਪਣਾ) ਨਾਮ ਦਿਹੁ। ਮੈਂ ਸਾਧੂ ਜਨਾਂ ਦੇ ਪੈਰਾਂ ਦੀ ਖ਼ਾਕ ਮੰਗਦਾ ਹਾਂ, ਹੇ ਪਾਰਬ੍ਰਹਮ! ਮੇਰੀ ਇੱਛਾ ਪੂਰੀ ਕਰ। ਮੈਂ ਸਦਾ ਹੀ ਪ੍ਰਭੂ ਦੇ ਗੁਣ ਗਾਵਾਂ। ਹੇ ਪ੍ਰਭੂ! ਮੈਂ ਦਮ-ਬ-ਦਮ ਤੈਨੂੰ ਹੀ ਸਿਮਰਾਂ। ਪ੍ਰਭੂ ਦੇ ਕਮਲ (ਵਰਗੇ ਸੋਹਣੇ) ਚਰਨਾਂ ਨਾਲ ਮੇਰੀ ਪ੍ਰੀਤਿ ਲੱਗੀ ਰਹੇ, ਤੇ ਸਦਾ ਹੀ ਪ੍ਰਭੂ ਦੀ ਭਗਤੀ ਕਰਦਾ ਰਹਾਂ। (ਪ੍ਰਭੂ ਦਾ ਨਾਮ ਹੀ) ਇਕੋ ਮੇਰੀ ਓਟ ਹੈ ਤੇ ਇਕੋ ਆਸਰਾ ਹੈ, ਨਾਨਕ ਪ੍ਰਭੂ ਦਾ ਸ੍ਰੇਸ਼ਟ ਨਾਮ ਮੰਗਦਾ ਹੈ ॥੧॥ ਪ੍ਰਭੂ ਦੀ (ਮੇਹਰ ਦੀ) ਨਜ਼ਰ ਨਾਲ ਬੜਾ ਸੁਖ ਹੁੰਦਾ ਹੈ, (ਪਰ) ਕੋਈ ਵਿਰਲਾ ਮਨੁੱਖ ਪ੍ਰਭੂ ਦੇ ਨਾਮ ਦਾ ਸੁਆਦ ਚੱਖਦਾ ਹੈ। ਜਿਨ੍ਹਾਂ ਨੇ (ਨਾਮ-ਰਸ) ਚੱਖਿਆ ਹੈ, ਉਹ ਮਨੁੱਖ (ਮਾਇਆ ਵਲੋਂ) ਰੱਜ ਗਏ ਹਨ, ਉਹ ਪੂਰਨ ਮਨੁੱਖ ਬਣ ਗਏ ਹਨ, ਕਦੇ (ਮਾਇਆ ਦੇ ਲਾਹੇ ਘਾਟੇ ਵਿਚ) ਡੋਲਦੇ ਨਹੀਂ। ਪ੍ਰਭੂ ਦੇ ਪਿਆਰ ਦੇ ਸੁਆਦ ਦੀ ਮੌਜ ਵਿਚ ਉਹ ਨਕਾ-ਨਕ ਭਰੇ ਰਹਿੰਦੇ ਹਨ, ਸਾਧ ਜਨਾਂ ਦੀ ਸੰਗਤਿ ਵਿਚ ਰਹਿ ਕੇ (ਉਹਨਾਂ ਦੇ ਅੰਦਰ) (ਪ੍ਰਭੂ-ਮਿਲਾਪ ਦਾ) ਚਾਉ ਪੈਦਾ ਹੁੰਦਾ ਹੈ। ਹੋਰ ਸਾਰੇ (ਆਸਰੇ) ਛੱਡ ਕੇ ਉਹ ਪ੍ਰਭੂ ਦੀ ਸਰਨ ਪੈਂਦੇ ਹਨ, ਉਹਨਾਂ ਦੇ ਅੰਦਰ ਚਾਨਣ ਹੋ ਜਾਂਦਾ ਹੈ, ਤੇ ਹਰ ਵੇਲੇ ਉਹਨਾਂ ਦੀ ਲਿਵ (ਪ੍ਰਭੂ-ਚਰਨਾਂ ਵਿਚ) ਲੱਗੀ ਰਹਿੰਦੀ ਹੈ। ਵੱਡੇ ਭਾਗਾਂ ਵਾਲੇ ਬੰਦਿਆਂ ਨੇ ਪ੍ਰਭੂ ਨੂੰ ਸਿਮਰਿਆ ਹੈ। ਹੇ ਨਾਨਕ! ਪ੍ਰਭੂ ਦੇ ਨਾਮ ਵਿਚ ਰੱਤਿਆਂ ਸੁਖ ਹੁੰਦਾ ਹੈ ॥੨॥ (ਤਦੋਂ ਸੇਵਕ ਦੇ ਮਨ ਦੇ ਫੁਰਨੇ ਪੂਰਨ ਹੋ ਜਾਂਦੇ ਹਨ, ਭਾਵ, ਮਾਇਆ ਵਾਲੀ ਦੌੜ ਮੁੱਕ ਜਾਂਦੀ ਹੈ) (ਜਦੋਂ ਸੇਵਕ) ਆਪਣੇ ਗੁਰੂ ਤੋਂ ਉੱਤਮ ਸਿੱਖਿਆ ਲੈਂਦਾ ਹੈ। ਪ੍ਰਭੂ ਆਪਣੇ (ਅਜੇਹੇ) ਸੇਵਕ ਉਤੇ ਮੇਹਰ ਕਰਦਾ ਹੈ, ਤੇ, ਸੇਵਕ ਨੂੰ ਸਦਾ ਖਿੜੇ-ਮੱਥੇ ਰੱਖਦਾ ਹੈ। ਸੇਵਕ (ਮਾਇਆ ਵਾਲੇ) ਜ਼ੰਜੀਰ ਤੋੜ ਕੇ ਖਲਾਸਾ ਹੋ ਜਾਂਦਾ ਹੈ, ਉਸ ਦਾ ਜਨਮ ਮਰਨ (ਦੇ ਗੇੜ) ਦਾ ਦੁੱਖ ਤੇ ਸਹਸਾ ਮੁੱਕ ਜਾਂਦਾ ਹੈ। ਸੇਵਕ ਦੀ ਇੱਛਾ ਤੇ ਸਰਧਾ ਸਭ ਸਿਰੇ ਚੜ੍ਹ ਜਾਂਦੀ ਹੈ, ਉਸ ਨੂੰ ਪ੍ਰਭੂ ਸਭ ਥਾਈਂ ਵਿਆਪਕ ਆਪਣੇ ਨਾਲ ਅੰਗ-ਸੰਗ ਦਿੱਸਦਾ ਹੈ। ਜਿਸ ਮਾਲਕ ਦਾ ਉਹ ਸੇਵਕ ਬਣਦਾ ਹੈ, ਉਹ ਆਪਣੇ ਨਾਲ ਮਿਲਾ ਲੈਂਦਾ ਹੈ, ਹੇ ਨਾਨਕ! ਸੇਵਕ ਭਗਤੀ ਕਰ ਕੇ ਨਾਮ ਵਿਚ ਟਿਕਿਆ ਰਹਿੰਦਾ ਹੈ ॥੩॥ (ਮਨੁੱਖ ਨੂੰ) ਉਹ ਪ੍ਰਭੂ ਕਿਉਂ ਵਿਸਰ ਜਾਏ ਜੋ (ਮਨੁੱਖ ਦੀ ਕੀਤੀ) ਮੇਹਨਤ ਨੂੰ ਅਜਾਈਂ ਨਹੀਂ ਜਾਣ ਦੇਂਦਾ, ਜੋ ਕੀਤੀ ਕਮਾਈ ਨੂੰ ਚੇਤੇ ਰੱਖਦਾ ਹੈ? ਉਹ ਪ੍ਰਭੂ ਕਿਉਂ ਭੁੱਲ ਜਾਏ ਜਿਸ ਨੇ ਸਭ ਕੁਝ ਦਿੱਤਾ ਹੈ, ਜੋ ਜੀਵਾਂ ਦੀ ਜ਼ਿੰਦਗੀ ਦਾ ਆਸਰਾ ਹੈ? ਉਹ ਅਕਾਲ ਪੁਰਖ ਕਿਉਂ ਵਿਸਰ ਜਾਏ ਜੋ (ਮਾਂ ਦੇ ਪੇਟ ਦੀ) ਅੱਗ ਵਿਚ ਬਚਾ ਕੇ ਰੱਖਦਾ ਹੈ? (ਪਰ) ਕੋਈ ਵਿਰਲਾ ਮਨੁੱਖ ਗੁਰੂ ਦੀ ਕਿਰਪਾ ਨਾਲ (ਇਹ ਗੱਲ) ਸਮਝਦਾ ਹੈ। ਉਹ ਅਕਾਲ ਪੁਰਖ ਕਿਉਂ ਭੁੱਲ ਜਾਏ ਜੋ (ਮਾਇਆ-ਰੂਪ) ਜ਼ਹਰ ਤੋਂ ਬਚਾਉਂਦਾ ਹੈ, ਅਤੇ ਕਈ ਜਨਮ ਦੇ ਵਿਛੁੜੇ ਹੋਏ ਜੀਵ ਨੂੰ (ਆਪਣੇ ਨਾਲ) ਜੋੜ ਲੈਂਦਾ ਹੈ? (ਜਿਨ੍ਹਾਂ ਸੇਵਕਾਂ ਨੂੰ) ਪੂਰੇ ਗੁਰੂ ਨੇ ਇਹ ਗੱਲ ਸਮਝਾਈ ਹੈ, ਹੇ ਨਾਨਕ! ਉਹਨਾਂ ਨੇ ਆਪਣੇ ਪ੍ਰਭੂ ਨੂੰ ਸਿਮਰਿਆ ਹੈ ॥੪॥ ਹੇ ਸੱਜਣ ਜਨੋ! ਹੇ ਸੰਤ ਜਨੋ! ਇਹ ਕੰਮ ਕਰੋ, ਹੋਰ ਸਾਰੇ (ਆਹਰ) ਛੱਡ ਕੇ ਪ੍ਰਭੂ ਦਾ ਨਾਮ ਜਪਹੁ। ਸਦਾ ਸਿਮਰੋ ਤੇ ਸਿਮਰ ਕੇ ਸੁਖ ਹਾਸਲ ਕਰੋ; ਪ੍ਰਭੂ ਦਾ ਨਾਮ ਆਪ ਜਪਹੁ ਤੇ ਹੋਰਨਾਂ ਨੂੰ ਭੀ ਜਪਾਵਹੁ। ਪ੍ਰਭੂ ਦੀ ਭਗਤੀ ਵਿਚ ਨਿਹੁਂ ਲਾਇਆਂ ਇਹ ਸੰਸਾਰ (ਸਮੁੰਦਰ) ਤਰੀਦਾ ਹੈ, ਭਗਤੀ ਤੋਂ ਬਿਨਾ ਇਹ ਸਰੀਰ ਕਿਸੇ ਕੰਮ ਨਹੀਂ। ਪ੍ਰਭੂ ਦਾ ਨਾਮ ਭਲੇ ਭਾਗਾਂ ਤੇ ਸਾਰੇ ਸੁਖਾਂ ਦਾ ਖ਼ਜ਼ਾਨਾ ਹੈ, (ਨਾਮ ਜਪਿਆਂ ਵਿਕਾਰਾਂ ਵਿਚ) ਡੁੱਬਦੇ ਜਾਂਦੇ ਨੂੰ ਆਸਰਾ ਟਿਕਾਣਾ ਮਿਲਦਾ ਹੈ; (ਤੇ) ਸਾਰੇ ਦੁੱਖਾਂ ਦਾ ਨਾਸ ਹੋ ਜਾਂਦਾ ਹੈ। (ਤਾਂ ਤੇ) ਹੇ ਨਾਨਕ! ਨਾਮ ਜਪਹੁ, (ਨਾਮ ਹੀ) ਗੁਣਾਂ ਦਾ ਖ਼ਜ਼ਾਨਾ (ਹੈ) ॥੫॥ (ਜਿਸ ਦੇ ਅੰਦਰ ਪ੍ਰਭੂ ਦੀ) ਪ੍ਰੀਤ ਪੈਦਾ ਹੋਈ ਹੈ, ਪ੍ਰਭੂ ਦੇ ਪਿਆਰ ਦਾ ਸੁਆਦ ਤੇ ਚਾਉ ਪੈਦਾ ਹੋਇਆ ਹੈ, ਉਸ ਦੇ ਮਨ ਤੇ ਤਨ ਵਿਚ ਇਹੀ ਚਾਹ ਹੈ (ਕਿ ਨਾਮ ਦੀ  ਦਾਤ ਮਿਲੇ)। ਅੱਖਾਂ ਨਾਲ (ਗੁਰੂ ਦਾ) ਦੀਦਾਰ ਕਰ ਕੇ ਉਸ ਨੂੰ ਸੁਖ ਹੁੰਦਾ ਹੈ, ਗੁਰੂ ਦੇ ਚਰਨ ਧੋ ਕੇ ਉਸ ਦਾ ਮਨ ਖਿੜ ਆਉਂਦਾ ਹੈ। ਭਗਤਾਂ ਦੇ ਮਨ ਤੇ ਸਰੀਰ ਵਿਚ (ਪ੍ਰਭੂ ਦਾ) ਪਿਆਰ ਟਿਕਿਆ ਰਹਿੰਦਾ ਹੈ, (ਪਰ) ਕਿਸੇ ਵਿਰਲੇ ਭਾਗਾਂ ਵਾਲੇ ਨੂੰ ਉਹਨਾਂ ਦੀ ਸੰਗਤਿ ਨਸੀਬ ਹੁੰਦੀ ਹੈ। (ਹੇ ਪ੍ਰਭੂ!) ਇਕ ਨਾਮ-ਵਸਤੂ ਮੇਹਰ ਕਰ ਕੇ (ਸਾਨੂੰ) ਦੇਹ, (ਤਾਂ ਜੋ) ਗੁਰੂ ਦੀ ਕਿਰਪਾ ਨਾਲ ਤੇਰਾ ਨਾਮ ਜਪ ਸਕੀਏ। ਉਸ ਦੀ ਵਡਿਆਈ ਬਿਆਨ ਨਹੀਂ ਕੀਤੀ ਜਾ ਸਕਦੀ। ਹੇ ਨਾਨਕ! ਉਹ ਪ੍ਰਭੂ ਸਭ ਥਾਈਂ ਮੌਜੂਦ ਹੈ ॥੬॥ ਹੇ ਬਖ਼ਸ਼ਨਹਾਰ ਪ੍ਰਭੂ! ਹੇ ਗਰੀਬਾਂ ਤੇ ਤਰਸ ਕਰਨ ਵਾਲੇ! ਹੇ ਭਗਤੀ ਨਾਲ ਪਿਆਰ ਕਰਨ ਵਾਲੇ! ਹੇ ਸਦਾ ਦਇਆ ਦੇ ਘਰ! ਹੇ ਅਨਾਥਾਂ ਦੇ ਨਾਥ! ਹੇ ਗੋਬਿੰਦ! ਹੇ ਗੋਪਾਲ! ਹੇ ਸਾਰੇ ਸਰੀਰਾਂ ਦੀ ਪਾਲਣਾ ਕਰਨ ਵਾਲੇ! ਹੇ ਸਭ ਦੇ ਮੁੱਢ ਤੇ ਸਭ ਵਿੱਚ ਵਿਆਪਕ ਪ੍ਰਭੂ! ਹੇ (ਜਗਤ ਦੇ) ਮੂਲ! ਹੇ ਕਰਤਾਰ! ਹੇ ਭਗਤਾਂ ਦੀ ਜ਼ਿੰਦਗੀ ਦੇ ਆਸਰੇ! ਜੋ ਜੋ ਮਨੁੱਖ ਤੈਨੂੰ ਜਪਦਾ ਹੈ, ਉਹ ਪਵ੍ਰਿੱਤ ਹੋ ਜਾਂਦਾ ਹੈ, ਭਗਤੀ-ਭਾਵ ਨਾਲ ਆਪਣੇ ਮਨ ਵਿਚ ਤੇਰਾ ਪਿਆਰ ਟਿਕਾਉਂਦਾ ਹੈ (ਉਸ ਦਾ ਉਧਾਰ ਹੋ ਜਾਂਦਾ ਹੈ।) ਅਸੀਂ ਨੀਚ ਹਾਂ, ਅੰਞਾਣ ਹਾਂ ਤੇ ਗੁਣ-ਹੀਨ ਹਾਂ। ਹੇ ਨਾਨਕ! (ਬੇਨਤੀ ਕਰ ਤੇ ਆਖ-) ਹੇ ਅਕਾਲ ਪੁਰਖ! ਹੇ ਭਗਵਾਨ! ਅਸੀਂ ਤੇਰੀ ਸਰਨ ਆਏ ਹਾਂ ॥੭॥ ਉਸ ਮਨੁੱਖ ਨੇ (ਮਾਨੋ) ਸਾਰੇ ਸੁਰਗ ਤੇ ਮੋਖ ਮੁਕਤੀ ਹਾਸਲ ਕਰ ਲਏ ਹਨ, ਜਿਸ ਨੇ ਅੱਖ ਦਾ ਇਕ ਫੋਰ ਮਾਤ੍ਰ ਭੀ ਪ੍ਰਭੂ ਦੇ ਗੁਣ ਗਾਏ ਹਨ। ਉਸ ਮਨੁੱਖ ਨੂੰ (ਮਾਨੋ) ਅਨੇਕਾਂ ਰਾਜ-ਭੋਗ ਪਦਾਰਥ ਤੇ ਵਡਿਆਈਆਂ ਮਿਲ ਗਈਆਂ ਹਨ, ਜਿਸ ਦੇ ਮਨ ਵਿਚ ਪ੍ਰਭੂ ਦੇ ਨਾਮ ਦੀ ਗੱਲ-ਬਾਤ ਮਿੱਠੀ ਲੱਗੀ ਹੈ। ਉਸ ਮਨੁੱਖ ਨੂੰ (ਮਾਨੋ) ਕਈ ਕਿਸਮ ਦੇ ਖਾਣੇ ਕੱਪੜੇ ਤੇ ਰਾਗ-ਰੰਗ ਹਾਸਲ ਹੋ ਗਏ ਹਨ, ਜਿਸ ਦੀ ਜੀਭ ਸਦਾ ਪ੍ਰਭੂ ਦਾ ਨਾਮ ਜਪਦੀ ਹੈ। ਉਸੇ ਮਨੁੱਖ ਦਾ ਹੀ ਆਚਰਨ ਭਲਾ ਹੈ, ਉਸੇ ਨੂੰ ਹੀ ਸੋਭਾ ਮਿਲਦੀ ਹੈ, ਓਹੀ ਧਨਾਢ ਹੈ, ਜਿਸ ਦੇ ਹਿਰਦੇ ਵਿਚ ਪੂਰੇ ਗੁਰੂ ਦਾ ਉਪਦੇਸ਼ ਵੱਸਦਾ ਹੈ। ਹੇ ਪ੍ਰਭੂ! ਆਪਣੇ ਸੰਤਾਂ ਦੀ ਸੰਗਤ ਵਿਚ ਥਾਂ ਦੇਹ। ਹੇ ਨਾਨਕ! (ਸਤਸੰਗ ਵਿਚ ਰਿਹਾਂ) ਸਾਰੇ ਸੁਖਾਂ ਦਾ ਪ੍ਰਕਾਸ਼ ਹੋ ਜਾਂਦਾ ਹੈ ॥੮॥੨੦॥ ਨਿਰੰਕਾਰ (ਭਾਵ, ਆਕਾਰ-ਰਹਿਤ ਅਕਾਲ ਪੁਰਖ) ਤ੍ਰਿਗੁਣੀ ਮਾਇਆ ਦਾ ਰੂਪ (ਭਾਵ, ਜਗਤ ਰੂਪ) ਭੀ ਆਪ ਹੈ ਤੇ ਮਾਇਆ ਦੇ ਤਿੰਨਾਂ ਗੁਣਾਂ ਤੋਂ ਪਰੇ ਭੀ ਆਪ ਹੀ ਹੈ, ਅਫੁਰ ਅਵਸਥਾ ਵਿਚ ਟਿਕਿਆ ਹੋਇਆ ਭੀ ਆਪ ਹੀ ਹੈ। ਹੇ ਨਾਨਕ! (ਇਹ ਸਾਰਾ ਜਗਤ) ਪ੍ਰਭੂ ਨੇ ਆਪ ਹੀ ਰਚਿਆ ਹੈ (ਤੇ ਜਗਤ ਦੇ ਜੀਵਾਂ ਵਿਚ ਬੈਠ ਕੇ) ਆਪ ਹੀ (ਆਪਣੇ ਆਪ ਨੂੰ ਯਾਦ ਕਰ ਰਿਹਾ ਹੈ ॥੧॥`
      },
      {
        number: 21,
        sanskrit: `ਸਲੋਕੁ ॥
ਸਰਗੁਨ ਨਿਰਗੁਨ ਨਿਰੰਕਾਰ ਸੁੰਨ ਸਮਾਧੀ ਆਪਿ ॥
ਆਪਨ ਕੀਆ ਨਾਨਕਾ ਆਪੇ ਹੀ ਫਿਰਿ ਜਾਪਿ ॥੧॥
ਅਸਟਪਦੀ ॥
ਜਬ ਅਕਾਰੁ ਇਹੁ ਕਛੁ ਨ ਦ੍ਰਿਸਟੇਤਾ ॥
ਪਾਪ ਪੁੰਨ ਤਬ ਕਹ ਤੇ ਹੋਤਾ ॥
ਜਬ ਧਾਰੀ ਆਪਨ ਸੁੰਨ ਸਮਾਧਿ ॥
ਤਬ ਬੈਰ ਬਿਰੋਧ ਕਿਸੁ ਸੰਗਿ ਕਮਾਤਿ ॥
ਜਬ ਇਸ ਕਾ ਬਰਨੁ ਚਿਹਨੁ ਨ ਜਾਪਤ ॥
ਤਬ ਹਰਖ ਸੋਗ ਕਹੁ ਕਿਸਹਿ ਬਿਆਪਤ ॥
ਜਬ ਆਪਨ ਆਪ ਆਪਿ ਪਾਰਬ੍ਰਹਮ ॥
ਤਬ ਮੋਹ ਕਹਾ ਕਿਸੁ ਹੋਵਤ ਭਰਮ ॥
ਆਪਨ ਖੇਲੁ ਆਪਿ ਵਰਤੀਜਾ ॥
ਨਾਨਕ ਕਰਨੈਹਾਰੁ ਨ ਦੂਜਾ ॥੧॥
ਜਬ ਹੋਵਤ ਪ੍ਰਭ ਕੇਵਲ ਧਨੀ ॥
ਤਬ ਬੰਧ ਮੁਕਤਿ ਕਹੁ ਕਿਸ ਕਉ ਗਨੀ ॥
ਜਬ ਏਕਹਿ ਹਰਿ ਅਗਮ ਅਪਾਰ ॥
ਤਬ ਨਰਕ ਸੁਰਗ ਕਹੁ ਕਉਨ ਅਉਤਾਰ ॥
ਜਬ ਨਿਰਗੁਨ ਪ੍ਰਭ ਸਹਜ ਸੁਭਾਇ ॥
ਤਬ ਸਿਵ ਸਕਤਿ ਕਹਹੁ ਕਿਤੁ ਠਾਇ ॥
ਜਬ ਆਪਹਿ ਆਪਿ ਅਪਨੀ ਜੋਤਿ ਧਰੈ ॥
ਤਬ ਕਵਨ ਨਿਡਰੁ ਕਵਨ ਕਤ ਡਰੈ ॥
ਆਪਨ ਚਲਿਤ ਆਪਿ ਕਰਨੈਹਾਰ ॥
ਨਾਨਕ ਠਾਕੁਰ ਅਗਮ ਅਪਾਰ ॥੨॥
ਅਬਿਨਾਸੀ ਸੁਖ ਆਪਨ ਆਸਨ ॥
ਤਹ ਜਨਮ ਮਰਨ ਕਹੁ ਕਹਾ ਬਿਨਾਸਨ ॥
ਜਬ ਪੂਰਨ ਕਰਤਾ ਪ੍ਰਭੁ ਸੋਇ ॥
ਤਬ ਜਮ ਕੀ ਤ੍ਰਾਸ ਕਹਹੁ ਕਿਸੁ ਹੋਇ ॥
ਜਬ ਅਬਿਗਤ ਅਗੋਚਰ ਪ੍ਰਭ ਏਕਾ ॥
ਤਬ ਚਿਤ੍ਰ ਗੁਪਤ ਕਿਸੁ ਪੂਛਤ ਲੇਖਾ ॥
ਜਬ ਨਾਥ ਨਿਰੰਜਨ ਅਗੋਚਰ ਅਗਾਧੇ ॥
ਤਬ ਕਉਨ ਛੁਟੇ ਕਉਨ ਬੰਧਨ ਬਾਧੇ ॥
ਆਪਨ ਆਪ ਆਪ ਹੀ ਅਚਰਜਾ ॥
ਨਾਨਕ ਆਪਨ ਰੂਪ ਆਪ ਹੀ ਉਪਰਜਾ ॥੩॥
ਜਹ ਨਿਰਮਲ ਪੁਰਖੁ ਪੁਰਖ ਪਤਿ ਹੋਤਾ ॥
ਤਹ ਬਿਨੁ ਮੈਲੁ ਕਹਹੁ ਕਿਆ ਧੋਤਾ ॥
ਜਹ ਨਿਰੰਜਨ ਨਿਰੰਕਾਰ ਨਿਰਬਾਨ ॥
ਤਹ ਕਉਨ ਕਉ ਮਾਨ ਕਉਨ ਅਭਿਮਾਨ ॥
ਜਹ ਸਰੂਪ ਕੇਵਲ ਜਗਦੀਸ ॥
ਤਹ ਛਲ ਛਿਦ੍ਰ ਲਗਤ ਕਹੁ ਕੀਸ ॥
ਜਹ ਜੋਤਿ ਸਰੂਪੀ ਜੋਤਿ ਸੰਗਿ ਸਮਾਵੈ ॥
ਤਹ ਕਿਸਹਿ ਭੂਖ ਕਵਨੁ ਤ੍ਰਿਪਤਾਵੈ ॥
ਕਰਨ ਕਰਾਵਨ ਕਰਨੈਹਾਰੁ ॥
ਨਾਨਕ ਕਰਤੇ ਕਾ ਨਾਹਿ ਸੁਮਾਰੁ ॥੪॥
ਜਬ ਅਪਨੀ ਸੋਭਾ ਆਪਨ ਸੰਗਿ ਬਨਾਈ ॥
ਤਬ ਕਵਨ ਮਾਇ ਬਾਪ ਮਿਤ੍ਰ ਸੁਤ ਭਾਈ ॥
ਜਹ ਸਰਬ ਕਲਾ ਆਪਹਿ ਪਰਬੀਨ ॥
ਤਹ ਬੇਦ ਕਤੇਬ ਕਹਾ ਕੋਊ ਚੀਨ ॥
ਜਬ ਆਪਨ ਆਪੁ ਆਪਿ ਉਰਿ ਧਾਰੈ ॥
ਤਉ ਸਗਨ ਅਪਸਗਨ ਕਹਾ ਬੀਚਾਰੈ ॥
ਜਹ ਆਪਨ ਊਚ ਆਪਨ ਆਪਿ ਨੇਰਾ ॥
ਤਹ ਕਉਨ ਠਾਕੁਰੁ ਕਉਨੁ ਕਹੀਐ ਚੇਰਾ ॥
ਬਿਸਮਨ ਬਿਸਮ ਰਹੇ ਬਿਸਮਾਦ ॥
ਨਾਨਕ ਅਪਨੀ ਗਤਿ ਜਾਨਹੁ ਆਪਿ ॥੫॥
ਜਹ ਅਛਲ ਅਛੇਦ ਅਭੇਦ ਸਮਾਇਆ ॥
ਊਹਾ ਕਿਸਹਿ ਬਿਆਪਤ ਮਾਇਆ ॥
ਆਪਸ ਕਉ ਆਪਹਿ ਆਦੇਸੁ ॥
ਤਿਹੁ ਗੁਣ ਕਾ ਨਾਹੀ ਪਰਵੇਸੁ ॥
ਜਹ ਏਕਹਿ ਏਕ ਏਕ ਭਗਵੰਤਾ ॥
ਤਹ ਕਉਨੁ ਅਚਿੰਤੁ ਕਿਸੁ ਲਾਗੈ ਚਿੰਤਾ ॥
ਜਹ ਆਪਨ ਆਪੁ ਆਪਿ ਪਤੀਆਰਾ ॥
ਤਹ ਕਉਨੁ ਕਥੈ ਕਉਨੁ ਸੁਨਨੈਹਾਰਾ ॥
ਬਹੁ ਬੇਅੰਤ ਊਚ ਤੇ ਊਚਾ ॥
ਨਾਨਕ ਆਪਸ ਕਉ ਆਪਹਿ ਪਹੂਚਾ ॥੬॥
ਜਹ ਆਪਿ ਰਚਿਓ ਪਰਪੰਚੁ ਅਕਾਰੁ ॥
ਤਿਹੁ ਗੁਣ ਮਹਿ ਕੀਨੋ ਬਿਸਥਾਰੁ ॥
ਪਾਪੁ ਪੁੰਨੁ ਤਹ ਭਈ ਕਹਾਵਤ ॥
ਕੋਊ ਨਰਕ ਕੋਊ ਸੁਰਗ ਬੰਛਾਵਤ ॥
ਆਲ ਜਾਲ ਮਾਇਆ ਜੰਜਾਲ ॥
ਹਉਮੈ ਮੋਹ ਭਰਮ ਭੈ ਭਾਰ ॥
ਦੂਖ ਸੂਖ ਮਾਨ ਅਪਮਾਨ ॥
ਅਨਿਕ ਪ੍ਰਕਾਰ ਕੀਓ ਬਖੵਾਨ ॥
ਆਪਨ ਖੇਲੁ ਆਪਿ ਕਰਿ ਦੇਖੈ ॥
ਖੇਲੁ ਸੰਕੋਚੈ ਤਉ ਨਾਨਕ ਏਕੈ ॥੭॥
ਜਹ ਅਬਿਗਤੁ ਭਗਤੁ ਤਹ ਆਪਿ ॥
ਜਹ ਪਸਰੈ ਪਾਸਾਰੁ ਸੰਤ ਪਰਤਾਪਿ ॥
ਦੁਹੂ ਪਾਖ ਕਾ ਆਪਹਿ ਧਨੀ ॥
ਉਨ ਕੀ ਸੋਭਾ ਉਨਹੂ ਬਨੀ ॥
ਆਪਹਿ ਕਉਤਕ ਕਰੈ ਅਨਦ ਚੋਜ ॥
ਆਪਹਿ ਰਸ ਭੋਗਨ ਨਿਰਜੋਗ ॥
ਜਿਸੁ ਭਾਵੈ ਤਿਸੁ ਆਪਨ ਨਾਇ ਲਾਵੈ ॥
ਜਿਸੁ ਭਾਵੈ ਤਿਸੁ ਖੇਲ ਖਿਲਾਵੈ ॥
ਬੇਸੁਮਾਰ ਅਥਾਹ ਅਗਨਤ ਅਤੋਲੈ ॥
ਜਿਉ ਬੁਲਾਵਹੁ ਤਿਉ ਨਾਨਕ ਦਾਸ ਬੋਲੈ ॥੮॥੨੧॥
ਸਲੋਕੁ ॥
ਜੀਅ ਜੰਤ ਕੇ ਠਾਕੁਰਾ ਆਪੇ ਵਰਤਣਹਾਰ ॥
ਨਾਨਕ ਏਕੋ ਪਸਰਿਆ ਦੂਜਾ ਕਹ ਦ੍ਰਿਸਟਾਰ ॥੧॥`,
        transliteration: `salok |
saragun niragun nirankaar sun samaadhee aap |
aapan keea naanakaa aape hee fir jaap |1|
asattapadee |
jab akaar ihu kachh na drisattetaa |
paap pun tab keh te hotaa |
jab dhaaree aapan sun samaadh |
tab bair birodh kis sang kamaat |
jab is kaa baran chihan na jaapat |
tab harakh sog kahu kiseh biaapat |
jab aapan aap aap paarabraham |
tab moh kahaa kis hovat bharam |
aapan khel aap varateejaa |
naanak karanaihaar na doojaa |1|
jab hovat prabh keval dhanee |
tab bandh mukat kahu kis kau ganee |
jab ekeh har agam apaar |
tab narak surag kahu kaun aautaar |
jab niragun prabh sehaj subhaae |
tab siv sakat kahahu kit tthaae |
jab aapeh aap apanee jot dharai |
tab kavan niddar kavan kat ddarai |
aapan chalit aap karanaihaar |
naanak tthaakur agam apaar |2|
abinaasee sukh aapan aasan |
teh janam maran kahu kahaa binaasan |
jab pooran karataa prabh soe |
tab jam kee traas kahahu kis hoe |
jab abigat agochar prabh ekaa |
tab chitr gupat kis poochhat lekhaa |
jab naath niranjan agochar agaadhe |
tab kaun chhutte kaun bandhan baadhe |
aapan aap aap hee acharajaa |
naanak aapan roop aap hee uparajaa |3|
jeh niramal purakh purakh pat hotaa |
teh bin mail kahahu kiaa dhotaa |
jeh niranjan nirankaar nirabaan |
teh kaun kau maan kaun abhimaan |
jeh saroop keval jagadees |
teh chhal chhidr lagat kahu kees |
jeh jot saroopee jot sang samaavai |
teh kiseh bhookh kavan tripataavai |
karan karaavan karanaihaar |
naanak karate kaa naeh sumaar |4|
jab apanee sobhaa aapan sang banaaee |
tab kavan maae baap mitr sut bhaaee |
jeh sarab kalaa aapeh parabeen |
teh bed kateb kahaa koaoo cheen |
jab aapan aap aap ur dhaarai |
tau sagan apasagan kahaa beechaarai |
jeh aapan aooch aapan aap neraa |
teh kaun tthaakur kaun kaheeai cheraa |
bisaman bisam rahe bisamaad |
naanak apanee gat jaanahu aap |5|
jeh achhal achhed abhed samaaeaa |
aoohaa kiseh biaapat maaeaa |
aapas kau aapeh aades |
tihu gun kaa naahee paraves |
jeh ekeh ek ek bhagavantaa |
teh kaun achint kis laagai chintaa |
jeh aapan aap aap pateeaaraa |
teh kaun kathai kaun sunanaihaaraa |
bahu beant aooch te aoochaa |
naanak aapas kau aapeh pahoochaa |6|
jeh aap rachio parapanch akaar |
tihu gun meh keeno bisathaar |
paap pun teh bhee kahaavat |
koaoo narak koaoo surag banchhaavat |
aal jaal maaeaa janjaal |
haumai moh bharam bhai bhaar |
dookh sookh maan apamaan |
anik prakaar keeo bakhayaan |
aapan khel aap kar dekhai |
khel sankochai tau naanak ekai |7|
jeh abigat bhagat teh aap |
jeh pasarai paasaar sant parataap |
duhoo paakh kaa aapeh dhanee |
aun kee sobhaa unahoo banee |
aapeh kautak karai anad choj |
aapeh ras bhogan nirajog |
jis bhaavai tis aapan naae laavai |
jis bhaavai tis khel khilaavai |
besumaar athaah aganat atolai |
jiau bulaavahu tiau naanak daas bolai |8|21|
salok |
jeea jant ke tthaakuraa aape varatanahaar |
naanak eko pasariaa doojaa keh drisattaar |1|`,
        meaning: `Salok: He possesses all qualities; He transcends all qualities; He is the Formless Lord. He Himself is in Primal Samaadhi. Through His Creation, O Nanak, He meditates on Himself. ||1|| Ashtapadee: When this world had not yet appeared in any form, who then committed sins and performed good deeds? When the Lord Himself was in Profound Samaadhi, then against whom were hate and jealousy directed? When there was no color or shape to be seen, then who experienced joy and sorrow? When the Supreme Lord Himself was Himself All-in-all, then where was emotional attachment, and who had doubts? He Himself has staged His own drama; O Nanak, there is no other Creator. ||1|| When there was only God the Master, then who was called bound or liberated? When there was only the Lord, Unfathomable and Infinite, then who entered hell, and who entered heaven? When God was without attributes, in absolute poise, then where was mind and where was matter - where was Shiva and Shakti? When He held His Own Light unto Himself, then who was fearless, and who was afraid? He Himself is the Performer in His own plays; O Nanak, the Lord Master is Unfathomable and Infinite. ||2|| When the Immortal Lord was seated at ease, then where was birth, death and dissolution? When there was only God, the Perfect Creator, then who was afraid of death? When there was only the One Lord, unmanifest and incomprehensible, then who was called to account by the recording scribes of the conscious and the subconscious? When there was only the Immaculate, Incomprehensible, Unfathomable Master, then who was emancipated, and who was held in bondage? He Himself, in and of Himself, is the most wonderful. O Nanak, He Himself created His Own Form. ||3|| When there was only the Immaculate Being, the Lord of beings, there was no filth, so what was there to be washed clean? When there was only the Pure, Formless Lord in Nirvaanaa, then who was honored, and who was dishonored? When there was only the Form of the Lord of the Universe, then who was tainted by fraud and sin? When the Embodiment of Light was immersed in His Own Light, then who was hungry, and who was satisfied? He is the Cause of causes, the Creator Lord. O Nanak, the Creator is beyond calculation. ||4|| When His Glory was contained within Himself, then who was mother, father, friend, child or sibling? When all power and wisdom was latent within Him, then where were the Vedas and the scriptures, and who was there to read them? When He kept Himself, All-in-all, unto His Own Heart, then who considered omens to be good or bad? When He Himself was lofty, and He Himself was near at hand, then who was called master, and who was called disciple? We are wonder-struck at the wondrous wonder of the Lord. O Nanak, He alone knows His own state. ||5|| When the Undeceiveable, Impenetrable, Inscrutable One was self-absorbed, then who was swayed by Maya? When He paid homage to Himself, then the three qualities were not prevailing. When there was only the One, the One and Only Lord God, then who was not anxious, and who felt anxiety? When He Himself was satisfied with Himself, then who spoke and who listened? He is vast and infinite, the highest of the high. O Nanak, He alone can reach Himself. ||6|| When He Himself fashioned the visible world of the creation, he made the world subject to the three dispositions. Sin and virtue then began to be spoken of. Some have gone to hell, and some yearn for paradise. Worldly snares and entanglements of Maya, egotism, attachment, doubt and loads of fear; pain and pleasure, honor and dishonor these came to be described in various ways. He Himself creates and beholds His own drama. He winds up the drama, and then, O Nanak, He alone remains. ||7|| Wherever the Eternal Lord's devotee is, He Himself is there. He unfolds the expanse of His creation for the glory of His Saint. He Himself is the Master of both worlds. His Praise is to Himself alone. He Himself performs and plays His amusements and games. He Himself enjoys pleasures, and yet He is unaffected and untouched. He attaches whomever He pleases to His Name. He causes whomever He pleases to play in His play. He is beyond calculation, beyond measure, uncountable and unfathomable. As You inspire him to speak, O Lord, so does servant Nanak speak. ||8||21|| Salok: O Lord and Master of all beings and creatures, You Yourself are prevailing everywhere. O Nanak, The One is All-pervading; where is any other to be seen? ||1||`,
        meaning_pa: `ਨਿਰੰਕਾਰ (ਭਾਵ, ਆਕਾਰ-ਰਹਿਤ ਅਕਾਲ ਪੁਰਖ) ਤ੍ਰਿਗੁਣੀ ਮਾਇਆ ਦਾ ਰੂਪ (ਭਾਵ, ਜਗਤ ਰੂਪ) ਭੀ ਆਪ ਹੈ ਤੇ ਮਾਇਆ ਦੇ ਤਿੰਨਾਂ ਗੁਣਾਂ ਤੋਂ ਪਰੇ ਭੀ ਆਪ ਹੀ ਹੈ, ਅਫੁਰ ਅਵਸਥਾ ਵਿਚ ਟਿਕਿਆ ਹੋਇਆ ਭੀ ਆਪ ਹੀ ਹੈ। ਹੇ ਨਾਨਕ! (ਇਹ ਸਾਰਾ ਜਗਤ) ਪ੍ਰਭੂ ਨੇ ਆਪ ਹੀ ਰਚਿਆ ਹੈ (ਤੇ ਜਗਤ ਦੇ ਜੀਵਾਂ ਵਿਚ ਬੈਠ ਕੇ) ਆਪ ਹੀ (ਆਪਣੇ ਆਪ ਨੂੰ ਯਾਦ ਕਰ ਰਿਹਾ ਹੈ ॥੧॥ ਜਦੋਂ (ਜਗਤ ਦੇ ਜੀਆਂ ਦੀ ਅਜੇ) ਕੋਈ ਸ਼ਕਲ ਹੀ ਨਹੀਂ ਦਿੱਸਦੀ ਸੀ, ਤਦੋਂ ਪਾਪ ਜਾਂ ਪੁੰਨ ਕਿਸ (ਜੀਵ) ਤੋਂ ਹੋ ਸਕਦਾ ਸੀ? ਜਦੋਂ (ਪ੍ਰਭੂ ਨੇ) ਆਪ ਅਫੁਰ ਅਵਸਥਾ ਵਾਲੀ ਸਮਾਧੀ ਲਾਈ ਹੋਈ ਸੀ (ਭਾਵ ਜਦੋਂ ਆਪਣੇ ਆਪ ਵਿਚ ਹੀ ਮਸਤ ਸੀ), ਤਦੋਂ (ਕਿਸ ਨੇ) ਕਿਸੇ ਨਾਲ ਵੈਰ-ਵਿਰੋਧ ਕਮਾਉਣਾ ਸੀ? ਜਦੋਂ ਇਸ (ਜਗਤ) ਦਾ ਕੋਈ ਰੰਗ-ਰੂਪ ਹੀ ਨਹੀਂ ਸੀ ਦਿੱਸਦਾ, ਤਦੋਂ ਦੱਸੋ ਖ਼ੁਸ਼ੀ ਜਾਂ ਚਿੰਤਾ ਕਿਸ ਨੂੰ ਪੋਹ ਸਕਦੇ ਸਨ? ਜਦੋਂ ਅਕਾਲ ਪੁਰਖ ਕੇਵਲ ਆਪ ਹੀ ਆਪ ਸੀ, ਤਦੋਂ ਮੋਹ ਕਿਥੇ ਹੋ ਸਕਦਾ ਸੀ, ਤੇ ਭਰਮ-ਭੁਲੇਖੇ ਕਿਸ ਨੂੰ ਹੋ ਸਕਦੇ ਸਨ? (ਜਗਤ ਰੂਪ) ਅਪਾਣੀ ਖੇਡ ਪ੍ਰਭੂ ਨੇ ਆਪ ਬਣਾਈ ਹੈ, ਹੇ ਨਾਨਕ! (ਉਸ ਤੋਂ ਬਿਨਾ ਇਸ ਖੇਡ ਦਾ) ਬਨਾਉਣ ਵਾਲਾ ਕੋਈ ਹੋਰ ਨਹੀਂ ਹੈ ॥੧॥ ਜਦੋਂ ਮਾਲਕ ਪ੍ਰਭੂ ਸਿਰਫ਼ (ਆਪ ਹੀ) ਸੀ, ਤਦੋਂ ਦੱਸੋ, ਕਿਸ ਨੂੰ ਬੰਧਨਾਂ ਵਿਚ ਫਸਿਆ ਹੋਇਆ, ਤੇ ਕਿਸ ਨੂੰ ਮੁਕਤਿ ਸਮਝੀਏ? ਜਦੋਂ ਅਗਮ ਤੇ ਬੇਅੰਤ ਪ੍ਰਭੂ ਇਕ ਆਪ ਹੀ ਸੀ, ਤਦੋਂ ਦੱਸੋ, ਨਰਕਾਂ ਤੇ ਸੁਰਗਾਂ ਵਿਚ ਆਉਣ ਵਾਲੇ ਕੇਹੜੇ ਜੀਵ ਸਨ? ਜਦੋਂ ਸੁਤੇ ਹੀ ਪ੍ਰਭੂ ਤ੍ਰਿਗੁਣੀ ਮਾਇਆ ਤੋਂ ਪਰੇ ਸੀ, (ਭਾਵ, ਜਦੋਂ ਉਸ ਨੇ ਮਾਇਆ ਰਚੀ ਹੀ ਨਹੀਂ ਸੀ) ਤਦੋਂ ਦੱਸੋ, ਕਿਥੇ ਸਨ ਜੀਵ ਤੇ ਕਿਥੇ ਸੀ ਮਾਇਆ? ਜਦੋਂ ਪ੍ਰਭੂ ਆਪ ਹੀ ਆਪਣੀ ਜੋਤਿ ਜਗਾਈ ਬੈਠਾ ਸੀ, ਤਦੋਂ ਕੌਣ ਨਿਡਰ ਸੀ ਤੇ ਕੌਣ ਕਿਸੇ ਤੋਂ ਡਰਦੇ ਸਨ? ਆਪਣੇ ਤਮਾਸ਼ੇ ਆਪ ਹੀ ਕਰਨ ਵਾਲਾ ਹੈ, ਹੇ ਨਾਨਕ! ਅਕਾਲ ਪੁਰਖ ਅਗਮ ਤੇ ਬੇਅੰਤ ਹੈ ॥੨॥ ਜਦੋਂ ਅਕਾਲ ਪੁਰਖ ਆਪਣੀ ਮੌਜ ਵਿਚ ਆਪਣੇ ਹੀ ਸਰੂਪ ਵਿਚ ਟਿਕਿਆ ਬੈਠਾ ਸੀ, ਤਦੋਂ ਦੱਸੋ, ਜੰਮਣਾ ਮਰਨਾ ਤੇ ਮੌਤ ਕਿਥੇ ਸਨ? ਜਦੋਂ ਕਰਤਾਰ ਪੂਰਨ ਪ੍ਰਭੂ ਆਪ ਹੀ ਸੀ, ਤਦੋਂ ਦੱਸੋ, ਮੌਤ ਦਾ ਡਰ ਕਿਸ ਨੂੰ ਹੋ ਸਕਦਾ ਸੀ? ਜਦੋਂ ਅਦ੍ਰਿਸ਼ਟ ਤੇ ਅਗੋਚਰ ਪ੍ਰਭੂ ਇਕ ਆਪ ਹੀ ਸੀ, ਤਦੋਂ ਚਿਤ੍ਰ ਗੁਪਤ ਕਿਸ ਨੂੰ ਲੇਖਾ ਪੁੱਛ ਸਕਦੇ ਸਨ? ਜਦੋਂ ਮਾਲਕ ਮਾਇਆ-ਰਹਿਤ ਅਥਾਹ ਅਗੋਚਰ ਆਪ ਹੀ ਸੀ, ਤਦੋਂ ਕੌਣ ਮਾਇਆ ਦੇ ਬੰਧਨਾਂ ਤੋਂ ਮੁਕਤ ਸਨ ਤੇ ਕੌਣ ਬੰਧਨਾਂ ਵਿਚ ਬੱਝੇ ਹੋਏ ਹਨ? ਉਹ ਅਚਰਜ-ਰੂਪ ਪ੍ਰਭੂ ਆਪਣੇ ਵਰਗਾ ਆਪ ਹੀ ਹੈ। ਹੇ ਨਾਨਕ! ਆਪਣਾ ਆਕਾਰ ਉਸ ਨੇ ਆਪ ਹੀ ਪੈਦਾ ਕੀਤਾ ਹੈ ॥੩॥ ਜਿਸ ਅਵਸਥਾ ਵਿਚ ਜੀਵਾਂ ਦਾ ਮਾਲਕ ਨਿਰਮਲ ਪ੍ਰਭੂ ਆਪ ਹੀ ਸੀ, ਓਥੇ ਉਹ ਮੈਲ-ਰਹਿਤ ਸੀ, ਤਾਂ ਦੱਸੋ, ਉਸ ਨੇ ਕੇਹੜੀ ਮੈਲ ਧੋਣੀ ਸੀ? ਜਿਥੇ ਮਾਇਆ-ਰਹਿਤ, ਆਕਾਰ-ਰਹਿਤ ਤੇ ਵਾਸ਼ਨਾ-ਰਹਿਤ ਪ੍ਰਭੂ ਹੀ ਸੀ, ਉਥੇ ਮਾਣ ਅਹੰਕਾਰ ਕਿਸ ਨੂੰ ਹੋਣਾ ਸੀ? ਜਿਥੇ ਕੇਵਲ ਜਗਤ ਦੇ ਮਾਲਕ ਪ੍ਰਭੂ ਦੀ ਹੀ ਹਸਤੀ ਸੀ, ਓਥੇ ਦੱਸੋ, ਛਲ ਤੇ ਐਬ ਕਿਸ ਨੂੰ ਲੱਗ ਸਕਦੇ ਸਨ? ਜਦੋਂ ਜੋਤਿ-ਰੂਪ ਪ੍ਰਭੂ ਆਪਣੀ ਹੀ ਜੋਤਿ ਵਿਚ ਲੀਨ ਸੀ, ਤਦੋਂ ਕਿਸ ਨੂੰ (ਮਾਇਆ ਦੀ) ਭੁੱਖ ਹੋ ਸਕਦੀ ਸੀ ਤੇ ਕੌਣ ਰੱਜਿਆ ਹੋਇਆ ਸੀ? ਕਰਤਾਰ ਆਪ ਹੀ ਸਭ ਕੁਝ ਕਰਨ ਵਾਲਾ ਤੇ ਜੀਵਾਂ ਤੋਂ ਕਰਾਉਣ ਵਾਲਾ ਹੈ। ਹੇ ਨਾਨਕ! ਕਰਤਾਰ ਦਾ ਅੰਦਾਜ਼ਾ ਨਹੀਂ ਪਾਇਆ ਜਾ ਸਕਦਾ ॥੪॥ ਜਦੋਂ ਪ੍ਰਭੂ ਨੇ ਆਪਣੀ ਸੋਭਾ ਆਪਣੇ ਹੀ ਨਾਲ ਬਣਾਈ ਸੀ (ਭਾਵ, ਜਦੋਂ ਕੋਈ ਹੋਰ ਉਸ ਦੀ ਸੋਭਾ ਕਰਨ ਵਾਲਾ ਨਹੀਂ ਸੀ) ਤਦੋਂ ਕੌਣ ਮਾਂ, ਪਿਉ, ਮਿਤ੍ਰ, ਪੁਤ੍ਰ ਜਾਂ ਭਰਾ ਸੀ? ਜਦੋਂ ਅਕਾਲ ਪੁਰਖ ਆਪ ਹੀ ਸਾਰੀਆਂ ਤਾਕਤਾਂ ਵਿਚ ਸਿਆਣਾ ਸੀ, ਤਦੋਂ ਕਿਥੇ ਕੋਈ ਵੇਦ (ਹਿੰਦੂ ਧਰਮ ਪੁਸਤਕ) ਤੇ ਕਤੇਬਾਂ (ਮੁਸਲਮਾਨਾਂ ਦੇ ਧਰਮ ਪੁਸਤਕ) ਵਿਚਾਰਦਾ ਸੀ? ਜਦੋਂ ਪ੍ਰਭੂ ਆਪਣੇ ਆਪ ਨੂੰ ਆਪ ਹੀ ਆਪਣੇ ਆਪ ਵਿਚ ਟਿਕਾਈ ਬੈਠਾ ਸੀ, ਤਦੋਂ ਚੰਗੇ ਮੰਦੇ ਸਗਨ ਕੌਣ ਸੋਚਦਾ ਸੀ? ਜਦੋਂ ਉਹ ਆਪ ਹੀ ਉੱਚਾ ਅਤੇ ਆਪ ਅਤੇ ਆਪ ਹੀ ਨੀਵਾਂ ਸੀ, ਦੱਸੋ ਮਾਲਕ ਕੌਣ ਸੀ ਤੇ ਸੇਵਕ ਕੌਣ ਸੀ? ਜੀਵ ਤੇਰੀ ਗਤਿ ਭਾਲਦੇ ਹੈਰਾਨ ਤੇ ਅਚਰਜ ਹੋ ਰਹੇ ਹਨ। ਹੇ ਨਾਨਕ! (ਪ੍ਰਭੂ ਅੱਗੇ ਅਰਦਾਸ ਕਰ ਤੇ ਆਖ-ਹੇ ਪ੍ਰਭੂ!) ਤੂੰ ਆਪਣੀ ਗਤਿ ਆਪ ਹੀ ਜਾਣਦਾ ਹੈਂ ॥੫॥ ਜਿਸ ਅਵਸਥਾ ਵਿਚ ਅਛੱਲ ਅਬਿਨਾਸੀ ਤੇ ਅਭੇਦ ਪ੍ਰਭੂ (ਆਪਣੇ ਆਪ ਵਿਚ) ਟਿਕਿਆ ਹੋਇਆ ਹੈ, ਓਥੇ ਕਿਸ ਨੂੰ ਮਾਇਆ ਪੋਹ ਸਕਦੀ ਹੈ? (ਤਦੋਂ) ਪ੍ਰਭੂ ਆਪਣੇ ਆਪ ਨੂੰ ਆਪ ਹੀ ਨਮਸਕਾਰ ਕਰਦਾ ਹੈ, (ਮਾਇਆ ਦੇ) ਤਿੰਨ ਗੁਣਾਂ ਦਾ (ਉਸ ਉਤੇ) ਅਸਰ ਨਹੀਂ ਪੈਂਦਾ। ਜਦੋਂ ਭਗਵਾਨ ਕੇਵਲ ਇਕ ਆਪ ਹੀ ਸੀ, ਤਦੋਂ ਕੌਣ ਬੇ-ਫ਼ਿਕਰ ਸੀ ਤੇ ਕਿਸ ਨੂੰ ਕੋਈ ਚਿੰਤਾ ਲੱਗਦੀ ਸੀ। ਜਦੋਂ ਆਪਣੇ ਆਪ ਨੂੰ ਪਤਿਆਉਣ ਵਾਲਾ ਪ੍ਰਭੂ ਆਪ ਹੀ ਸੀ, ਤਦੋਂ ਕੌਣ ਬੋਲਦਾ ਸੀ, ਤੇ ਕੌਣ ਸੁਣਨ ਵਾਲਾ ਸੀ? ਪ੍ਰਭੂ ਬੜਾ ਬੇਅੰਤ ਹੈ, ਸਭ ਤੋਂ ਉੱਚਾ ਹੈ, ਹੇ ਨਾਨਕ! ਆਪਣੇ ਆਪ ਤਕ ਆਪ ਹੀ ਅੱਪੜਨ ਵਾਲਾ ਹੈ ॥੬॥ ਜਦੋਂ ਪ੍ਰਭੂ ਨੇ ਆਪ ਜਗਤ ਦੀ ਖੇਡ ਰਚ ਦਿੱਤੀ, ਤੇ ਮਾਇਆ ਦੇ ਤਿੰਨ ਗੁਣਾਂ ਦਾ ਖਿਲਾਰਾ ਖਲੇਰ ਦਿੱਤਾ। ਤਦੋਂ ਇਹ ਗੱਲ ਚੱਲ ਪਈ ਕਿ ਇਹ ਪਾਪ ਹੈ ਇਹ ਪੁੰਨ ਹੈ, ਤਦੋਂ ਕੋਈ ਜੀਵ ਨਰਕਾਂ ਦਾ ਭਾਗੀ ਤੇ ਕੋਈ ਸੁਰਗਾਂ ਦਾ ਚਾਹਵਾਨ ਬਣਿਆ। ਘਰਾਂ ਦੇ ਧੰਧੇ, ਮਾਇਆ ਦੇ ਬੰਧਨ, ਅਹੰਕਾਰ, ਮੋਹ, ਭੁਲੇਖੇ, ਡਰ, ਦੁੱਖ, ਸੁਖ, ਆਦਰ ਨਿਰਾਦਰੀ- ਇਹੋ ਜਿਹੀਆਂ ਕਈ ਕਿਸਮ ਦੀਆਂ ਗੱਲਾਂ ਚੱਲ ਪਈਆਂ। ਪ੍ਰਭੂ ਆਪਣਾ ਤਮਾਸ਼ਾ ਕਰ ਕੇ ਆਪ ਵੇਖ ਰਿਹਾ ਹੈ। ਹੇ ਨਾਨਕ! ਜਦੋਂ ਇਸ ਖੇਡ ਨੂੰ ਸਮੇਟਦਾ ਹੈ ਤਾਂ ਇਕ ਆਪ ਹੀ ਆਪ ਹੋ ਜਾਂਦਾ ਹੈ ॥੭॥ ਜਿਥੇ ਅਦ੍ਰਿਸ਼ਟ ਪ੍ਰਭੂ ਹੈ ਓਥੇ ਉਸ ਦਾ ਭਗਤ ਹੈ, ਜਿਥੇ ਭਗਤ ਹੈ ਓਥੇ ਉਹ ਪ੍ਰਭੂ ਆਪ ਹੈ। ਹਰ ਥਾਂ ਸੰਤਾਂ ਦੀ ਮਹਿਮਾ ਵਾਸਤੇ ਪ੍ਰਭੂ ਜਗਤ ਦਾ ਖਿਲਾਰਾ ਖਿਲਾਰ ਰਿਹਾ ਹੈ। (ਸੰਤਾਂ ਦਾ ਪ੍ਰਤਾਪ ਤੇ ਮਾਇਆ ਦਾ ਪ੍ਰਭਾਵ-ਇਨ੍ਹਾਂ) ਦੋਹਾਂ ਪੱਖਾਂ ਦਾ ਮਾਲਕ ਪ੍ਰਭੂ ਆਪ ਹੈ। ਪ੍ਰਭੂ ਜੀ ਆਪਣੀ ਸੋਭਾ ਆਪ ਹੀ ਜਾਣਦੇ ਹਨ। ਪ੍ਰਭੂ ਆਪ ਹੀ ਖੇਡਾਂ ਖੇਡ ਰਿਹਾ ਹੈ ਆਪ ਹੀ ਆਨੰਦ ਤਮਾਸ਼ੇ ਕਰ ਰਿਹਾ ਹੈ, ਆਪ ਹੀ ਰਸਾਂ ਨੂੰ ਭੋਗਣ ਵਾਲਾ ਹੈ ਤੇ ਆਪ ਹੀ ਨਿਰਲੇਪ ਹੈ। ਜੋ ਉਸ ਨੂੰ ਭਾਉਂਦਾ ਹੈ, ਉਸ ਨੂੰ ਆਪਣੇ ਨਾਮ ਵਿਚ ਜੋੜਦਾ ਹੈ, ਤੇ ਜਿਸ ਨੂੰ ਚਾਹੁੰਦਾ ਹੈ ਮਾਇਆ ਦੀਆਂ ਖੇਡਾਂ ਖਿਡਾਉਂਦਾ ਹੈ। ਹੇ ਬੇਅੰਤ! ਹੇ ਅਥਾਹ! ਹੇ ਅਗਣਤ! ਹੇ ਅਡੋਲ ਪ੍ਰਭੂ! ਹੇ ਨਾਨਕ (ਇਉਂ ਅਰਦਾਸ ਕਰ ਤੇ ਆਖ) ਜਿਵੇਂ ਤੂੰ ਬੁਲਾਉਂਦਾ ਹੈਂ ਤਿਵੇਂ ਤੇਰੇ ਦਾਸ ਬੋਲਦੇ ਹਨ ॥੮॥੨੧॥ ਹੇ ਜੀਆਂ ਜੰਤਾਂ ਦੇ ਪਾਲਣ ਵਾਲੇ ਪ੍ਰਭੂ! ਤੂੰ ਆਪ ਹੀ ਸਭ ਥਾਈਂ ਵਰਤ ਰਿਹਾ ਹੈਂ। ਹੇ ਨਾਨਕ! ਪ੍ਰਭੂ ਆਪ ਹੀ ਸਭ ਥਾਈਂ ਮੌਜੂਦ ਹੈ, (ਉਸ ਤੋਂ ਬਿਨਾ ਕੋਈ) ਦੂਜਾ ਕਿਥੇ ਵੇਖਣ ਵਿਚ ਆਇਆ ਹੈ? ॥੧॥`
      },
      {
        number: 22,
        sanskrit: `ਸਲੋਕੁ ॥
ਜੀਅ ਜੰਤ ਕੇ ਠਾਕੁਰਾ ਆਪੇ ਵਰਤਣਹਾਰ ॥
ਨਾਨਕ ਏਕੋ ਪਸਰਿਆ ਦੂਜਾ ਕਹ ਦ੍ਰਿਸਟਾਰ ॥੧॥
ਅਸਟਪਦੀ ॥
ਆਪਿ ਕਥੈ ਆਪਿ ਸੁਨਨੈਹਾਰੁ ॥
ਆਪਹਿ ਏਕੁ ਆਪਿ ਬਿਸਥਾਰੁ ॥
ਜਾ ਤਿਸੁ ਭਾਵੈ ਤਾ ਸ੍ਰਿਸਟਿ ਉਪਾਏ ॥
ਆਪਨੈ ਭਾਣੈ ਲਏ ਸਮਾਏ ॥
ਤੁਮ ਤੇ ਭਿੰਨ ਨਹੀ ਕਿਛੁ ਹੋਇ ॥
ਆਪਨ ਸੂਤਿ ਸਭੁ ਜਗਤੁ ਪਰੋਇ ॥
ਜਾ ਕਉ ਪ੍ਰਭ ਜੀਉ ਆਪਿ ਬੁਝਾਏ ॥
ਸਚੁ ਨਾਮੁ ਸੋਈ ਜਨੁ ਪਾਏ ॥
ਸੋ ਸਮਦਰਸੀ ਤਤ ਕਾ ਬੇਤਾ ॥
ਨਾਨਕ ਸਗਲ ਸ੍ਰਿਸਟਿ ਕਾ ਜੇਤਾ ॥੧॥
ਜੀਅ ਜੰਤ੍ਰ ਸਭ ਤਾ ਕੈ ਹਾਥ ॥
ਦੀਨ ਦਇਆਲ ਅਨਾਥ ਕੋ ਨਾਥੁ ॥
ਜਿਸੁ ਰਾਖੈ ਤਿਸੁ ਕੋਇ ਨ ਮਾਰੈ ॥
ਸੋ ਮੂਆ ਜਿਸੁ ਮਨਹੁ ਬਿਸਾਰੈ ॥
ਤਿਸੁ ਤਜਿ ਅਵਰ ਕਹਾ ਕੋ ਜਾਇ ॥
ਸਭ ਸਿਰਿ ਏਕੁ ਨਿਰੰਜਨ ਰਾਇ ॥
ਜੀਅ ਕੀ ਜੁਗਤਿ ਜਾ ਕੈ ਸਭ ਹਾਥਿ ॥
ਅੰਤਰਿ ਬਾਹਰਿ ਜਾਨਹੁ ਸਾਥਿ ॥
ਗੁਨ ਨਿਧਾਨ ਬੇਅੰਤ ਅਪਾਰ ॥
ਨਾਨਕ ਦਾਸ ਸਦਾ ਬਲਿਹਾਰ ॥੨॥
ਪੂਰਨ ਪੂਰਿ ਰਹੇ ਦਇਆਲ ॥
ਸਭ ਊਪਰਿ ਹੋਵਤ ਕਿਰਪਾਲ ॥
ਅਪਨੇ ਕਰਤਬ ਜਾਨੈ ਆਪਿ ॥
ਅੰਤਰਜਾਮੀ ਰਹਿਓ ਬਿਆਪਿ ॥
ਪ੍ਰਤਿਪਾਲੈ ਜੀਅਨ ਬਹੁ ਭਾਤਿ ॥
ਜੋ ਜੋ ਰਚਿਓ ਸੁ ਤਿਸਹਿ ਧਿਆਤਿ ॥
ਜਿਸੁ ਭਾਵੈ ਤਿਸੁ ਲਏ ਮਿਲਾਇ ॥
ਭਗਤਿ ਕਰਹਿ ਹਰਿ ਕੇ ਗੁਣ ਗਾਇ ॥
ਮਨ ਅੰਤਰਿ ਬਿਸ੍ਵਾਸੁ ਕਰਿ ਮਾਨਿਆ ॥
ਕਰਨਹਾਰੁ ਨਾਨਕ ਇਕੁ ਜਾਨਿਆ ॥੩॥
ਜਨੁ ਲਾਗਾ ਹਰਿ ਏਕੈ ਨਾਇ ॥
ਤਿਸ ਕੀ ਆਸ ਨ ਬਿਰਥੀ ਜਾਇ ॥
ਸੇਵਕ ਕਉ ਸੇਵਾ ਬਨਿ ਆਈ ॥
ਹੁਕਮੁ ਬੂਝਿ ਪਰਮ ਪਦੁ ਪਾਈ ॥
ਇਸ ਤੇ ਊਪਰਿ ਨਹੀ ਬੀਚਾਰੁ ॥
ਜਾ ਕੈ ਮਨਿ ਬਸਿਆ ਨਿਰੰਕਾਰੁ ॥
ਬੰਧਨ ਤੋਰਿ ਭਏ ਨਿਰਵੈਰ ॥
ਅਨਦਿਨੁ ਪੂਜਹਿ ਗੁਰ ਕੇ ਪੈਰ ॥
ਇਹ ਲੋਕ ਸੁਖੀਏ ਪਰਲੋਕ ਸੁਹੇਲੇ ॥
ਨਾਨਕ ਹਰਿ ਪ੍ਰਭਿ ਆਪਹਿ ਮੇਲੇ ॥੪॥
ਸਾਧਸੰਗਿ ਮਿਲਿ ਕਰਹੁ ਅਨੰਦ ॥
ਗੁਨ ਗਾਵਹੁ ਪ੍ਰਭ ਪਰਮਾਨੰਦ ॥
ਰਾਮ ਨਾਮ ਤਤੁ ਕਰਹੁ ਬੀਚਾਰੁ ॥
ਦ੍ਰੁਲਭ ਦੇਹ ਕਾ ਕਰਹੁ ਉਧਾਰੁ ॥
ਅੰਮ੍ਰਿਤ ਬਚਨ ਹਰਿ ਕੇ ਗੁਨ ਗਾਉ ॥
ਪ੍ਰਾਨ ਤਰਨ ਕਾ ਇਹੈ ਸੁਆਉ ॥
ਆਠ ਪਹਰ ਪ੍ਰਭ ਪੇਖਹੁ ਨੇਰਾ ॥
ਮਿਟੈ ਅਗਿਆਨੁ ਬਿਨਸੈ ਅੰਧੇਰਾ ॥
ਸੁਨਿ ਉਪਦੇਸੁ ਹਿਰਦੈ ਬਸਾਵਹੁ ॥
ਮਨ ਇਛੇ ਨਾਨਕ ਫਲ ਪਾਵਹੁ ॥੫॥
ਹਲਤੁ ਪਲਤੁ ਦੁਇ ਲੇਹੁ ਸਵਾਰਿ ॥
ਰਾਮ ਨਾਮੁ ਅੰਤਰਿ ਉਰਿ ਧਾਰਿ ॥
ਪੂਰੇ ਗੁਰ ਕੀ ਪੂਰੀ ਦੀਖਿਆ ॥
ਜਿਸੁ ਮਨਿ ਬਸੈ ਤਿਸੁ ਸਾਚੁ ਪਰੀਖਿਆ ॥
ਮਨਿ ਤਨਿ ਨਾਮੁ ਜਪਹੁ ਲਿਵ ਲਾਇ ॥
ਦੂਖੁ ਦਰਦੁ ਮਨ ਤੇ ਭਉ ਜਾਇ ॥
ਸਚੁ ਵਾਪਾਰੁ ਕਰਹੁ ਵਾਪਾਰੀ ॥
ਦਰਗਹ ਨਿਬਹੈ ਖੇਪ ਤੁਮਾਰੀ ॥
ਏਕਾ ਟੇਕ ਰਖਹੁ ਮਨ ਮਾਹਿ ॥
ਨਾਨਕ ਬਹੁਰਿ ਨ ਆਵਹਿ ਜਾਹਿ ॥੬॥
ਤਿਸ ਤੇ ਦੂਰਿ ਕਹਾ ਕੋ ਜਾਇ ॥
ਉਬਰੈ ਰਾਖਨਹਾਰੁ ਧਿਆਇ ॥
ਨਿਰਭਉ ਜਪੈ ਸਗਲ ਭਉ ਮਿਟੈ ॥
ਪ੍ਰਭ ਕਿਰਪਾ ਤੇ ਪ੍ਰਾਣੀ ਛੁਟੈ ॥
ਜਿਸੁ ਪ੍ਰਭੁ ਰਾਖੈ ਤਿਸੁ ਨਾਹੀ ਦੂਖ ॥
ਨਾਮੁ ਜਪਤ ਮਨਿ ਹੋਵਤ ਸੂਖ ॥
ਚਿੰਤਾ ਜਾਇ ਮਿਟੈ ਅਹੰਕਾਰੁ ॥
ਤਿਸੁ ਜਨ ਕਉ ਕੋਇ ਨ ਪਹੁਚਨਹਾਰੁ ॥
ਸਿਰ ਊਪਰਿ ਠਾਢਾ ਗੁਰੁ ਸੂਰਾ ॥
ਨਾਨਕ ਤਾ ਕੇ ਕਾਰਜ ਪੂਰਾ ॥੭॥
ਮਤਿ ਪੂਰੀ ਅੰਮ੍ਰਿਤੁ ਜਾ ਕੀ ਦ੍ਰਿਸਟਿ ॥
ਦਰਸਨੁ ਪੇਖਤ ਉਧਰਤ ਸ੍ਰਿਸਟਿ ॥
ਚਰਨ ਕਮਲ ਜਾ ਕੇ ਅਨੂਪ ॥
ਸਫਲ ਦਰਸਨੁ ਸੁੰਦਰ ਹਰਿ ਰੂਪ ॥
ਧੰਨੁ ਸੇਵਾ ਸੇਵਕੁ ਪਰਵਾਨੁ ॥
ਅੰਤਰਜਾਮੀ ਪੁਰਖੁ ਪ੍ਰਧਾਨੁ ॥
ਜਿਸੁ ਮਨਿ ਬਸੈ ਸੁ ਹੋਤ ਨਿਹਾਲੁ ॥
ਤਾ ਕੈ ਨਿਕਟਿ ਨ ਆਵਤ ਕਾਲੁ ॥
ਅਮਰ ਭਏ ਅਮਰਾ ਪਦੁ ਪਾਇਆ ॥
ਸਾਧਸੰਗਿ ਨਾਨਕ ਹਰਿ ਧਿਆਇਆ ॥੮॥੨੨॥
ਸਲੋਕੁ ॥
ਗਿਆਨ ਅੰਜਨੁ ਗੁਰਿ ਦੀਆ ਅਗਿਆਨ ਅੰਧੇਰ ਬਿਨਾਸੁ ॥
ਹਰਿ ਕਿਰਪਾ ਤੇ ਸੰਤ ਭੇਟਿਆ ਨਾਨਕ ਮਨਿ ਪਰਗਾਸੁ ॥੧॥`,
        transliteration: `salok |
jeea jant ke tthaakuraa aape varatanahaar |
naanak eko pasariaa doojaa keh drisattaar |1|
asattapadee |
aap kathai aap sunanaihaar |
aapeh ek aap bisathaar |
jaa tis bhaavai taa srisatt upaae |
aapanai bhaanai le samaae |
tum te bhin nahee kichh hoe |
aapan soot sabh jagat paroe |
jaa kau prabh jeeo aap bujhaae |
sach naam soee jan paae |
so samadarasee tat kaa betaa |
naanak sagal srisatt kaa jetaa |1|
jeea jantr sabh taa kai haath |
deen deaal anaath ko naath |
jis raakhai tis koe na maarai |
so mooaa jis manahu bisaarai |
tis taj avar kahaa ko jaae |
sabh sir ek niranjan raae |
jeea kee jugat jaa kai sabh haath |
antar baahar jaanahu saath |
gun nidhaan beant apaar |
naanak daas sadaa balihaar |2|
pooran poor rahe deaal |
sabh aoopar hovat kirapaal |
apane karatab jaanai aap |
antarajaamee rahio biaap |
pratipaalai jeean bahu bhaat |
jo jo rachio su tiseh dhiaat |
jis bhaavai tis le milaae |
bhagat kareh har ke gun gaae |
man antar bisvaas kar maaniaa |
karanahaar naanak ik jaaniaa |3|
jan laagaa har ekai naae |
tis kee aas na birathee jaae |
sevak kau sevaa ban aaee |
hukam boojh param pad paaee |
eis te aoopar nahee beechaar |
jaa kai man basiaa nirankaar |
bandhan tor bhe niravair |
anadin poojeh gur ke pair |
eih lok sukhee paralok suhele |
naanak har prabh aapeh mele |4|
saadhasang mil karahu anand |
gun gaavahu prabh paramaanand |
raam naam tat karahu beechaar |
drulabh deh kaa karahu udhaar |
amrit bachan har ke gun gaau |
praan taran kaa ihai suaau |
aatth pehar prabh pekhahu neraa |
mittai agiaan binasai andheraa |
sun upades hiradai basaavahu |
man ichhe naanak fal paavahu |5|
halat palat due lehu savaar |
raam naam antar ur dhaar |
poore gur kee pooree deekhiaa |
jis man basai tis saach pareekhiaa |
man tan naam japahu liv laae |
dookh darad man te bhau jaae |
sach vaapaar karahu vaapaaree |
daragah nibahai khep tumaaree |
ekaa ttek rakhahu man maeh |
naanak bahur na aaveh jaeh |6|
tis te door kahaa ko jaae |
aubarai raakhanahaar dhiaae |
nirbhau japai sagal bhau mittai |
prabh kirapaa te praanee chhuttai |
jis prabh raakhai tis naahee dookh |
naam japat man hovat sookh |
chintaa jaae mittai ahankaar |
tis jan kau koe na pahuchanahaar |
sir aoopar tthaadtaa gur sooraa |
naanak taa ke kaaraj pooraa |7|
mat pooree amrit jaa kee drisatt |
darasan pekhat udharat srisatt |
charan kamal jaa ke anoop |
safal darasan sundar har roop |
dhan sevaa sevak paravaan |
antarajaamee purakh pradhaan |
jis man basai su hot nihaal |
taa kai nikatt na aavat kaal |
amar bhe amaraa pad paaeaa |
saadhasang naanak har dhiaaeaa |8|22|
salok |
giaan anjan gur deea agiaan andher binaas |
har kirapaa te sant bhettiaa naanak man paragaas |1|`,
        meaning: `Salok: O Lord and Master of all beings and creatures, You Yourself are prevailing everywhere. O Nanak, The One is All-pervading; where is any other to be seen? ||1|| Ashtapadee: He Himself is the speaker, and He Himself is the listener. He Himself is the One, and He Himself is the many. When it pleases Him, He creates the world. As He pleases, He absorbs it back into Himself. Without You, nothing can be done. Upon Your thread, You have strung the whole world. One whom God Himself inspires to understand - that person obtains the True Name. He looks impartially upon all, and he knows the essential reality. O Nanak, he conquers the whole world. ||1|| All beings and creatures are in His Hands. He is Merciful to the meek, the Patron of the patronless. No one can kill those who are protected by Him. One who is forgotten by God, is already dead. Leaving Him, where else could anyone go? Over the heads of all is the One, the Immaculate King. The ways and means of all beings are in His Hands. Inwardly and outwardly, know that He is with you. He is the Ocean of excellence, infinite and endless. Slave Nanak is forever a sacrifice to Him. ||2|| The Perfect, Merciful Lord is pervading everywhere. His kindness extends to all. He Himself knows His own ways. The Inner-knower, the Searcher of hearts, is present everywhere. He cherishes His living beings in so many ways. That which He has created meditates on Him. Whoever pleases Him, He blends into Himself. They perform His devotional service and sing the Glorious Praises of the Lord. With heart-felt faith, they believe in Him. O Nanak, they realize the One, the Creator Lord. ||3|| The Lord's humble servant is committed to His Name. His hopes do not go in vain. The servant's purpose is to serve; obeying the Lord's Command, the supreme status is obtained. Beyond this, he has no other thought. Within his mind, the Formless Lord abides. His bonds are cut away, and he becomes free of hatred. Night and day, he worships the Feet of the Guru. He is at peace in this world, and happy in the next. O Nanak, the Lord God unites him with Himself. ||4|| Join the Company of the Holy, and be happy. Sing the Glories of God, the embodiment of supreme bliss. Contemplate the essence of the Lord's Name. Redeem this human body, so difficult to obtain. Sing the Ambrosial Words of the Lord's Glorious Praises; this is the way to save your mortal soul. Behold God near at hand, twenty-four hours a day. Ignorance shall depart, and darkness shall be dispelled. Listen to the Teachings, and enshrine them in your heart. O Nanak, you shall obtain the fruits of your mind's desires. ||5|| Embellish both this world and the next; enshrine the Lord's Name deep within your heart. Perfect are the Teachings of the Perfect Guru. That person, within whose mind it abides, realizes the Truth. With your mind and body, chant the Naam; lovingly attune yourself to it. Sorrow, pain and fear shall depart from your mind. Deal in the true trade, O trader, and your merchandise shall be safe in the Court of the Lord. Keep the Support of the One in your mind. O Nanak, you shall not have to come and go in reincarnation again. ||6|| Where can anyone go, to get away from Him? Meditating on the Protector Lord, you shall be saved. Meditating on the Fearless Lord, all fear departs. By God's Grace, mortals are released. One who is protected by God never suffers in pain. Chanting the Naam, the mind becomes peaceful. Anxiety departs, and ego is eliminated. No one can equal that humble servant. The Brave and Powerful Guru stands over his head. O Nanak, his efforts are fulfilled. ||7|| His wisdom is perfect, and His Glance is Ambrosial. Beholding His Vision, the universe is saved. His Lotus Feet are incomparably beautiful. The Blessed Vision of His Darshan is fruitful and rewarding; His Lordly Form is beautiful. Blessed is His service; His servant is famous. The Inner-knower, the Searcher of hearts, is the most exalted Supreme Being. That one, within whose mind He abides, is blissfully happy. Death does not draw near him. One becomes immortal, and obtains the immortal status, meditating on the Lord, O Nanak, in the Company of the Holy. ||8||22|| Salok: The Guru has given the healing ointment of spiritual wisdom, and dispelled the darkness of ignorance. By the Lord's Grace, I have met the Saint; O Nanak, my mind is enlightened. ||1||`,
        meaning_pa: `ਹੇ ਜੀਆਂ ਜੰਤਾਂ ਦੇ ਪਾਲਣ ਵਾਲੇ ਪ੍ਰਭੂ! ਤੂੰ ਆਪ ਹੀ ਸਭ ਥਾਈਂ ਵਰਤ ਰਿਹਾ ਹੈਂ। ਹੇ ਨਾਨਕ! ਪ੍ਰਭੂ ਆਪ ਹੀ ਸਭ ਥਾਈਂ ਮੌਜੂਦ ਹੈ, (ਉਸ ਤੋਂ ਬਿਨਾ ਕੋਈ) ਦੂਜਾ ਕਿਥੇ ਵੇਖਣ ਵਿਚ ਆਇਆ ਹੈ? ॥੧॥ (ਸਭ ਜੀਵਾਂ ਵਿਚ) ਪ੍ਰਭੂ ਆਪ ਬੋਲ ਰਿਹਾ ਹੈ ਆਪ ਹੀ ਸੁਣਨ ਵਾਲਾ ਹੈ, ਆਪ ਹੀ ਇੱਕ ਹੈ (ਸ੍ਰਿਸ਼ਟੀ ਰਚਣ ਤੋਂ ਪਹਿਲਾਂ), ਤੇ ਆਪ ਹੀ (ਜਗਤ ਨੂੰ ਆਪਣੇ ਵਿਚ) ਸਮੇਟ ਲੈਂਦਾ ਹੈ। ਜਦੋਂ ਉਸ ਨੂੰ ਚੰਗਾ ਲੱਗਦਾ ਹੈ ਤਾਂ ਸ੍ਰਿਸ਼ਟੀ ਰਚ ਲੈਂਦਾ ਹੈ, ਜਦੋਂ ਉਸ ਨੂੰ ਚੰਗਾ ਲੱਗਦਾ ਹੈ (ਜਗਤ ਨੂੰ ਆਪਣੇ ਵਿਚ) ਸਮੇਟ ਲੈਂਦਾ ਹੈ। (ਹੇ ਪ੍ਰਭੂ!) ਤੈਥੋਂ ਵੱਖਰਾ ਕੁਝ ਨਹੀਂ ਹੈ, ਤੂੰ (ਆਪਣੇ ਹੁਕਮ-ਰੂਪ) ਧਾਗੇ ਵਿਚ ਸਾਰੇ ਜਗਤ ਨੂੰ ਪ੍ਰੋ ਰੱਖਿਆ ਹੈ। ਜਿਸ ਮਨੁੱਖ ਨੂੰ ਪ੍ਰਭੂ ਜੀ ਆਪ ਸੂਝ ਬਖ਼ਸ਼ਦੇ ਹਨ, ਉਹ ਮਨੁੱਖ ਪ੍ਰਭੂ ਦਾ ਸਦਾ-ਥਿਰ ਰਹਿਣ ਵਾਲਾ ਨਾਮ ਹਾਸਲ ਕਰ ਲੈਂਦਾ ਹੈ। ਉਹ ਮਨੁੱਖ ਸਭ ਵਲ ਇਕ ਨਜ਼ਰ ਨਾਲ ਤੱਕਦਾ ਹੈ, ਅਕਾਲ ਪੁਰਖ ਦਾ ਮਹਰਮ ਹੋ ਜਾਂਦਾ ਹੈ। ਹੇ ਨਾਨਕ! ਉਹ ਸਾਰੇ ਜਗਤ ਦਾ ਜਿੱਤਣ ਵਾਲਾ ਹੈ ॥੧॥ ਸਾਰੇ ਜੀਵ ਜੰਤ ਉਸ ਪ੍ਰਭੂ ਦੇ ਵੱਸ ਵਿਚ ਹਨ, ਉਹ ਦੀਨਾਂ ਤੇ ਦਇਆ ਕਰਨ ਵਾਲਾ ਹੈ, ਤੇ, ਅਨਾਥਾਂ ਦਾ ਮਾਲਿਕ ਹੈ। ਜਿਸ ਜੀਵ ਨੂੰ ਪ੍ਰਭੂ ਆਪ ਰੱਖਦਾ ਹੈ ਉਸ ਨੂੰ ਕੋਈ ਮਾਰ ਨਹੀਂ ਸਕਦਾ। ਮੋਇਆ ਹੋਇਆ (ਤਾਂ) ਉਹ ਜੀਵ ਹੈ ਜਿਸ ਨੂੰ ਪ੍ਰਭੂ ਭੁਲਾ ਦੇਂਦਾ ਹੈ। ਉਸ ਪ੍ਰਭੂ ਨੂੰ ਛੱਡ ਕੇ ਹੋਰ ਕਿਥੇ ਕੋਈ ਜਾਏ? ਸਭ ਜੀਵਾਂ ਦੇ ਸਿਰ ਤੇ ਇਕ ਆਪ ਹੀ ਪ੍ਰਭੂ ਹੈ ਜੋ ਮਾਇਆ ਦੇ ਪ੍ਰਭਾਵ ਤੋਂ ਪਰੇ ਹੈ। ਜਿਸ ਦੇ ਵੱਸ ਵਿਚ ਸਭ ਜੀਵਾਂ ਦੀ ਜ਼ਿੰਦਗੀ ਦਾ ਭੇਤ ਹੈ, ਉਸ ਪ੍ਰਭੂ ਨੂੰ ਅੰਦਰ ਬਾਹਰ ਸਭ ਥਾਈਂ ਅੰਗ-ਸੰਗ ਜਾਣਹੁ। ਜੋ ਗੁਣਾਂ ਦਾ ਖ਼ਜ਼ਾਨਾ ਹੈ, ਬੇਅੰਤ ਹੈ ਤੇ ਅਪਾਰ ਹੈ, ਹੇ ਨਾਨਕ! (ਆਖ, ਪ੍ਰਭੂ ਦੇ) ਸੇਵਕ ਉਸ ਤੋਂ ਸਦਕੇ ਹਨ ॥੨॥ ਦਇਆ ਦੇ ਘਰ ਪ੍ਰਭੂ ਜੀ ਸਭ ਥਾਈਂ ਭਰਪੂਰ ਹਨ, ਤੇ ਸਭ ਜੀਵਾਂ ਤੇ ਮੇਹਰ ਕਰਦੇ ਹਨ। ਪ੍ਰਭੂ ਆਪਣੇ ਖੇਲ ਆਪ ਜਾਣਦਾ ਹੈ, ਸਭ ਦੇ ਦਿਲ ਦੀ ਜਾਣਨ ਵਾਲਾ ਪ੍ਰਭੂ ਸਭ ਥਾਈਂ ਮੌਜੂਦ ਹੈ। ਜੀਵਾਂ ਨੂੰ ਕਈ ਤਰੀਕੀਆਂ ਨਾਲ ਪਾਲਦਾ ਹੈ, ਜੋ ਜੋ ਜੀਵ ਉਸ ਨੇ ਪੈਦਾ ਕੀਤਾ ਹੈ, ਉਹ ਉਸੇ ਪ੍ਰਭੂ ਨੂੰ ਸਿਮਰਦਾ ਹੈ। ਜਿਸ ਉਤੇ ਤ੍ਰੁੱਠਦਾ ਹੈ ਉਸ ਨੂੰ ਨਾਲ ਜੋੜ ਲੈਂਦਾ ਹੈ, (ਜਿਨ੍ਹਾਂ ਤੇ ਤ੍ਰੁੱਠਦਾ ਹੈ) ਉਹ ਉਸ ਦੇ ਗੁਣ ਗਾ ਕੇ ਉਸ ਦੀ ਭਗਤੀ ਕਰਦੇ ਹਨ। ਜਿਸ ਮਨੁੱਖ ਨੇ ਮਨ ਵਿਚ ਸ਼ਰਧਾ ਧਾਰ ਕੇ ਪ੍ਰਭੂ ਨੂੰ (ਸੱਚਮੁਚ ਹੋਂਦ ਵਾਲਾ) ਮੰਨ ਲਿਆ ਹੈ, ਹੇ ਨਾਨਕ! ਉਸ ਨੇ ਉਸ ਇੱਕ ਕਰਤਾਰ ਨੂੰ ਹੀ ਪਛਾਣਿਆ ਹੈ ॥੩॥ (ਜੋ) ਸੇਵਕ ਇਕ ਪ੍ਰਭੂ ਦੇ ਨਾਮ ਵਿਚ ਟਿਕਿਆ ਹੋਇਆ ਹੈ, ਉਸ ਦੀ ਆਸ ਕਦੇ ਖ਼ਾਲੀ ਨਹੀਂ ਜਾਂਦੀ। ਸੇਵਕ ਨੂੰ ਇਹ ਫੱਬਦਾ ਹੈ ਕਿ ਸਭ ਦੀ ਸੇਵਾ ਕਰੇ। ਪ੍ਰਭੂ ਦੀ ਰਜ਼ਾ ਸਮਝ ਕੇ ਉਸ ਨੂੰ ਉੱਚਾ ਦਰਜਾ ਮਿਲ ਜਾਂਦਾ ਹੈ। ਉਹਨਾਂ ਨੂੰ ਇਸ (ਨਾਮ ਸਿਮਰਨ) ਤੋਂ ਵੱਡਾ ਹੋਰ ਕੋਈ ਵਿਚਾਰ ਨਹੀਂ ਸੁੱਝਦਾ; ਜਿਨ੍ਹਾਂ ਦੇ ਮਨ ਵਿਚ ਅਕਾਲ ਪੁਰਖ ਵੱਸਦਾ ਹੈ। (ਮਾਇਆ ਦੇ) ਬੰਧਨ ਤੋੜ ਕੇ ਉਹ ਨਿਰਵੈਰ ਹੋ ਜਾਂਦੇ ਹਨ, ਤੇ ਹਰ ਵੇਲੇ ਸਤਿਗੁਰੂ ਦੇ ਚਰਨ ਪੂਜਦੇ ਹਨ। ਉਹ ਮਨੁੱਖ ਇਸ ਜਨਮ ਵਿਚ ਸੁਖੀ ਹਨ, ਤੇ ਪਰਲੋਕ ਵਿਚ ਭੀ ਸੌਖੇ ਹੁੰਦੇ ਹਨ, (ਕਿਉਂਕਿ) ਹੇ ਨਾਨਕ! ਪ੍ਰਭੂ ਨੇ ਆਪ ਉਹਨਾਂ ਨੂੰ (ਆਪਣੇ ਨਾਲ) ਮਿਲਾ ਲਿਆ ਹੈ ॥੪॥ ਸਤਸੰਗ ਵਿਚ ਮਿਲ ਕੇ ਇਹ (ਆਤਮਕ) ਅਨੰਦ ਮਾਣਹੁ, ਪਰਮ ਖ਼ੁਸ਼ੀਆਂ ਵਾਲੇ ਪ੍ਰਭੂ ਦੀ ਸਿਫ਼ਤ-ਸਾਲਾਹ ਕਰੋ। ਪ੍ਰਭੂ ਦੇ ਨਾਮ ਦੇ ਭੇਤ ਨੂੰ ਵਿਚਾਰਹੁ, ਤੇ ਇਸ (ਮਨੁੱਖਾ-) ਸਰੀਰ ਦਾ ਬਚਾਉ ਕਰੋ ਜੋ ਬੜੀ ਮੁਸ਼ਕਿਲ ਨਾਲ ਮਿਲਦਾ ਹੈ। ਅਕਾਲ ਪੁਰਖ ਦੇ ਗੁਣ ਗਾਉ ਜੋ ਅਮਰ ਕਰਨ ਵਾਲੇ ਬਚਨ ਹਨ, ਜ਼ਿੰਦਗੀ ਨੂੰ (ਵਿਕਾਰਾਂ ਤੋਂ) ਬਚਾਉਣ ਦਾ ਇਹੀ ਵਸੀਲਾ ਹੈ। ਅੱਠੇ ਪਹਰ ਪ੍ਰਭੂ ਨੂੰ ਆਪਣੇ ਅੰਗ-ਸੰਗ ਵੇਖਹੁ, (ਇਸ ਤਰ੍ਹਾਂ) ਅਗਿਆਨਤਾ ਮਿਟ ਜਾਏਗੀ ਤੇ (ਮਾਇਆ ਵਾਲਾ) ਹਨੇਰਾ ਨਾਸ ਹੋ ਜਾਏਗਾ। (ਸਤਿਗੁਰੂ ਦਾ) ਉਪਦੇਸ਼ ਸੁਣ ਕੇ ਹਿਰਦੇ ਵਿਚ ਵਸਾਉ, ਹੇ ਨਾਨਕ! (ਇਸ ਤਰ੍ਹਾਂ) ਮਨ-ਮੰਗੀਆਂ ਮੁਰਾਦਾਂ ਮਿਲਣਗੀਆਂ ॥੫॥ ਲੋਕ ਤੇ ਪਰਲੋਕ ਦੋਵੇਂ ਸੁਧਾਰ ਲਵੋ, ਪ੍ਰਭੂ ਦਾ ਨਾਮ ਅੰਦਰ ਹਿਰਦੇ ਵਿਚ ਟਿਕਾਓ। ਪੂਰੇ ਸਤਿਗੁਰੂ ਦੀ ਸਿੱਖਿਆ ਭੀ ਪੂਰਨ (ਭਾਵ, ਮੁਕੰਮਲ) ਹੁੰਦੀ ਹੈ, ਜਿਸ ਮਨੁੱਖ ਦੇ ਮਨ ਵਿਚ (ਇਹ ਸਿੱਖਿਆ) ਵੱਸਦੀ ਹੈ ਉਸ ਨੂੰ ਸਦਾ-ਥਿਰ ਰਹਿਣ ਵਾਲਾ ਪ੍ਰਭੂ ਸਮਝ ਆ ਜਾਂਦਾ ਹੈ। ਮਨ ਤੇ ਸਰੀਰ ਦੀ ਰਾਹੀਂ ਲਿਵ ਜੋੜ ਕੇ ਨਾਮ ਜਪਹੁ, ਦੁਖ ਦਰਦ ਅਤੇ ਮਨ ਤੋਂ ਡਰ ਦੂਰ ਹੋ ਜਾਏਗਾ। ਹੇ ਵਣਜਾਰੇ ਜੀਵ! ਸੱਚਾ ਵਣਜ ਕਰਹੁ, (ਨਾਮ ਰੂਪ ਸੱਚੇ ਵਣਜ ਨਾਲ) ਤੁਹਾਡਾ ਸੌਦਾ ਪ੍ਰਭੂ ਦੀ ਦਰਗਾਹ ਵਿਚ ਮੁੱਲ ਪਾਏਗਾ। ਮਨ ਵਿਚ ਇਕ ਅਕਾਲ ਪੁਰਖ ਦਾ ਆਸਰਾ ਰੱਖੋ, ਹੇ ਨਾਨਕ! ਮੁੜ ਜੰਮਣ ਮਰਨ ਦਾ ਗੇੜ ਨਹੀਂ ਹੋਵੇਗਾ ॥੬॥ ਉਸ ਪ੍ਰਭੂ ਤੋਂ ਪਰੇ ਕਿੱਥੇ ਕੋਈ ਜੀਵ ਜਾ ਸਕਦਾ ਹੈ? ਜੀਵ ਬਚਦਾ ਹੀ ਰੱਖਣਹਾਰ ਪ੍ਰਭੂ ਨੂੰ ਸਿਮਰ ਕੇ ਹੈ। ਜੋ ਮੁਨੱਖ ਨਿਰਭਉ ਅਕਾਲ ਪੁਰਖ ਨੂੰ ਜਪਦਾ ਹੈ, ਉਸ ਦਾ ਸਾਰਾ ਡਰ ਮਿਟ ਜਾਂਦਾ ਹੈ, (ਕਿਉਂਕਿ) ਪ੍ਰਭੂ ਦੀ ਮੇਹਰ ਨਾਲ ਹੀ ਬੰਦਾ (ਡਰ ਤੋਂ) ਖ਼ਲਾਸੀ ਪਾਂਦਾ ਹੈ। ਜਿਸ ਬੰਦੇ ਨੂੰ ਪ੍ਰਭੂ ਰੱਖਦਾ ਹੈ ਉਸ ਨੂੰ ਕੋਈ ਦੁੱਖ ਨਹੀਂ ਪੋਂਹਦਾ, ਨਾਮ ਜਪਿਆਂ ਮਨ ਵਿਚ ਸੁਖ ਪੈਦਾ ਹੁੰਦਾ ਹੈ। (ਨਾਮ ਸਿਮਰਿਆਂ) ਚਿੰਤਾ ਦੂਰ ਹੋ ਜਾਂਦੀ ਹੈ, ਅਹੰਕਾਰ ਮਿਟ ਜਾਂਦਾ ਹੈ, ਉਸ ਮਨੁੱਖ ਦੀ ਕੋਈ ਬਰਾਬਰੀ ਹੀ ਨਹੀਂ ਕਰ ਸਕਦਾ। ਜਿਸ ਬੰਦੇ ਦੇ ਸਿਰ ਉਤੇ ਸੂਰਮਾ ਸਤਿਗੁਰੂ (ਰਾਖਾ) ਖਲੋਤਾ ਹੋਇਆ ਹੈ, ਹੇ ਨਾਨਕ! ਉਸ ਦੇ ਸਾਰੇ ਕੰਮ ਰਾਸ ਆ ਜਾਂਦੇ ਹਨ ॥੭॥ ਜਿਸ ਪ੍ਰਭੂ ਦੀ ਸਮਝ ਪੂਰਨ (infallible, ਅਭੁੱਲ) ਹੈ, ਜਿਸ ਦੀ ਨਜ਼ਰ ਵਿਚੋਂ ਅੰਮ੍ਰਿਤ ਵਰਸਦਾ ਹੈ, ਉਸ ਦਾ ਦੀਦਾਰ ਕੀਤਿਆਂ ਜਗਤ ਦਾ ਉੱਧਾਰ ਹੁੰਦਾ ਹੈ। ਜਿਸ ਪ੍ਰਭੂ ਦੇ ਕਮਲਾਂ (ਵਰਗੇ) ਅੱਤ ਸੋਹਣੇ ਚਰਨ ਹਨ, ਉਸ ਦਾ ਰੂਪ ਸੁੰਦਰ ਹੈ, ਤੇ, ਉਸ ਦਾ ਦੀਦਾਰ ਮੁਰਾਦਾਂ ਪੂਰੀਆਂ ਕਰਨ ਵਾਲਾ ਹੈ। ਉਸ ਦਾ ਸੇਵਕ (ਦਰਗਾਹ ਵਿਚ) ਕਬੂਲ ਹੋ ਜਾਂਦਾ ਹੈ (ਤਾਹੀਏਂ) ਉਸ ਦੀ ਸੇਵਾ ਮੁਬਾਰਿਕ ਹੈ, ਉਹ ਅਕਾਲ ਪੁਰਖ ਘਟ ਘਟ ਦੀ ਜਾਣਨ ਵਾਲਾ ਤੇ ਸਭ ਤੋਂ ਵੱਡਾ ਹੈ। ਜਿਸ ਮਨੁੱਖ ਦੇ ਹਿਰਦੇ ਵਿਚ (ਐਸਾ ਪ੍ਰਭੂ) ਵੱਸਦਾ ਹੈ ਉਹ (ਫੁੱਲ ਵਾਂਗ) ਖਿੜ ਆਉਂਦਾ ਹੈ, ਉਸ ਦੇ ਨੇੜੇ ਕਾਲ (ਭੀ) ਨਹੀਂ ਆਉਂਦਾ (ਭਾਵ, ਮੌਤ ਦਾ ਡਰ ਉਸ ਨੂੰ ਪੋਂਹਦਾ ਨਹੀਂ)। ਉਹ ਮਨੁੱਖ ਜਨਮ ਮਰਨ ਤੋਂ ਰਹਿਤ ਹੋ ਜਾਂਦੇ ਹਨ, ਤੇ ਸਦਾ ਕਾਇਮ ਰਹਿਣ ਵਾਲਾ ਦਰਜਾ ਹਾਸਲ ਕਰ ਲੈਂਦੇ ਹਨ, ਹੇ ਨਾਨਕ! ਜਿਨ੍ਹਾਂ ਨੇ ਸਤਸੰਗ ਵਿਚ ਪ੍ਰਭੂ ਨੂੰ ਸਿਮਰਿਆ ਹੈ ॥੮॥ (ਜਿਸ ਮਨੁੱਖ ਨੂੰ) ਸਤਿਗੁਰੂ ਨੇ ਗਿਆਨ ਦਾ ਸੁਰਮਾ ਬਖ਼ਸ਼ਿਆ ਹੈ, ਉਸ ਦੇ ਅਗਿਆਨ (ਰੂਪ) ਹਨੇਰੇ ਦਾ ਨਾਸ ਹੋ ਜਾਂਦਾ ਹੈ। ਹੇ ਨਾਨਕ! (ਜੋ ਮਨੁੱਖ) ਅਕਾਲ ਪੁਰਖ ਦੀ ਮੇਹਰ ਨਾਲ ਗੁਰੂ ਨੂੰ ਮਿਲਿਆ ਹੈ, ਉਸ ਦੇ ਮਨ ਵਿਚ (ਗਿਆਨ ਦਾ) ਚਾਨਣ ਹੋ ਜਾਂਦਾ ਹੈ ॥੧॥`
      },
      {
        number: 23,
        sanskrit: `ਸਲੋਕੁ ॥
ਗਿਆਨ ਅੰਜਨੁ ਗੁਰਿ ਦੀਆ ਅਗਿਆਨ ਅੰਧੇਰ ਬਿਨਾਸੁ ॥
ਹਰਿ ਕਿਰਪਾ ਤੇ ਸੰਤ ਭੇਟਿਆ ਨਾਨਕ ਮਨਿ ਪਰਗਾਸੁ ॥੧॥
ਅਸਟਪਦੀ ॥
ਸੰਤਸੰਗਿ ਅੰਤਰਿ ਪ੍ਰਭੁ ਡੀਠਾ ॥
ਨਾਮੁ ਪ੍ਰਭੂ ਕਾ ਲਾਗਾ ਮੀਠਾ ॥
ਸਗਲ ਸਮਿਗ੍ਰੀ ਏਕਸੁ ਘਟ ਮਾਹਿ ॥
ਅਨਿਕ ਰੰਗ ਨਾਨਾ ਦ੍ਰਿਸਟਾਹਿ ॥
ਨਉ ਨਿਧਿ ਅੰਮ੍ਰਿਤੁ ਪ੍ਰਭ ਕਾ ਨਾਮੁ ॥
ਦੇਹੀ ਮਹਿ ਇਸ ਕਾ ਬਿਸ੍ਰਾਮੁ ॥
ਸੁੰਨ ਸਮਾਧਿ ਅਨਹਤ ਤਹ ਨਾਦ ॥
ਕਹਨੁ ਨ ਜਾਈ ਅਚਰਜ ਬਿਸਮਾਦ ॥
ਤਿਨਿ ਦੇਖਿਆ ਜਿਸੁ ਆਪਿ ਦਿਖਾਏ ॥
ਨਾਨਕ ਤਿਸੁ ਜਨ ਸੋਝੀ ਪਾਏ ॥੧॥
ਸੋ ਅੰਤਰਿ ਸੋ ਬਾਹਰਿ ਅਨੰਤ ॥
ਘਟਿ ਘਟਿ ਬਿਆਪਿ ਰਹਿਆ ਭਗਵੰਤ ॥
ਧਰਨਿ ਮਾਹਿ ਆਕਾਸ ਪਇਆਲ ॥
ਸਰਬ ਲੋਕ ਪੂਰਨ ਪ੍ਰਤਿਪਾਲ ॥
ਬਨਿ ਤਿਨਿ ਪਰਬਤਿ ਹੈ ਪਾਰਬ੍ਰਹਮੁ ॥
ਜੈਸੀ ਆਗਿਆ ਤੈਸਾ ਕਰਮੁ ॥
ਪਉਣ ਪਾਣੀ ਬੈਸੰਤਰ ਮਾਹਿ ॥
ਚਾਰਿ ਕੁੰਟ ਦਹ ਦਿਸੇ ਸਮਾਹਿ ॥
ਤਿਸ ਤੇ ਭਿੰਨ ਨਹੀ ਕੋ ਠਾਉ ॥
ਗੁਰ ਪ੍ਰਸਾਦਿ ਨਾਨਕ ਸੁਖੁ ਪਾਉ ॥੨॥
ਬੇਦ ਪੁਰਾਨ ਸਿੰਮ੍ਰਿਤਿ ਮਹਿ ਦੇਖੁ ॥
ਸਸੀਅਰ ਸੂਰ ਨਖੵਤ੍ਰ ਮਹਿ ਏਕੁ ॥
ਬਾਣੀ ਪ੍ਰਭ ਕੀ ਸਭੁ ਕੋ ਬੋਲੈ ॥
ਆਪਿ ਅਡੋਲੁ ਨ ਕਬਹੂ ਡੋਲੈ ॥
ਸਰਬ ਕਲਾ ਕਰਿ ਖੇਲੈ ਖੇਲ ॥
ਮੋਲਿ ਨ ਪਾਈਐ ਗੁਣਹ ਅਮੋਲ ॥
ਸਰਬ ਜੋਤਿ ਮਹਿ ਜਾ ਕੀ ਜੋਤਿ ॥
ਧਾਰਿ ਰਹਿਓ ਸੁਆਮੀ ਓਤਿ ਪੋਤਿ ॥
ਗੁਰ ਪਰਸਾਦਿ ਭਰਮ ਕਾ ਨਾਸੁ ॥
ਨਾਨਕ ਤਿਨ ਮਹਿ ਏਹੁ ਬਿਸਾਸੁ ॥੩॥
ਸੰਤ ਜਨਾ ਕਾ ਪੇਖਨੁ ਸਭੁ ਬ੍ਰਹਮ ॥
ਸੰਤ ਜਨਾ ਕੈ ਹਿਰਦੈ ਸਭਿ ਧਰਮ ॥
ਸੰਤ ਜਨਾ ਸੁਨਹਿ ਸੁਭ ਬਚਨ ॥
ਸਰਬ ਬਿਆਪੀ ਰਾਮ ਸੰਗਿ ਰਚਨ ॥
ਜਿਨਿ ਜਾਤਾ ਤਿਸ ਕੀ ਇਹ ਰਹਤ ॥
ਸਤਿ ਬਚਨ ਸਾਧੂ ਸਭਿ ਕਹਤ ॥
ਜੋ ਜੋ ਹੋਇ ਸੋਈ ਸੁਖੁ ਮਾਨੈ ॥
ਕਰਨ ਕਰਾਵਨਹਾਰੁ ਪ੍ਰਭੁ ਜਾਨੈ ॥
ਅੰਤਰਿ ਬਸੇ ਬਾਹਰਿ ਭੀ ਓਹੀ ॥
ਨਾਨਕ ਦਰਸਨੁ ਦੇਖਿ ਸਭ ਮੋਹੀ ॥੪॥
ਆਪਿ ਸਤਿ ਕੀਆ ਸਭੁ ਸਤਿ ॥
ਤਿਸੁ ਪ੍ਰਭ ਤੇ ਸਗਲੀ ਉਤਪਤਿ ॥
ਤਿਸੁ ਭਾਵੈ ਤਾ ਕਰੇ ਬਿਸਥਾਰੁ ॥
ਤਿਸੁ ਭਾਵੈ ਤਾ ਏਕੰਕਾਰੁ ॥
ਅਨਿਕ ਕਲਾ ਲਖੀ ਨਹ ਜਾਇ ॥
ਜਿਸੁ ਭਾਵੈ ਤਿਸੁ ਲਏ ਮਿਲਾਇ ॥
ਕਵਨ ਨਿਕਟਿ ਕਵਨ ਕਹੀਐ ਦੂਰਿ ॥
ਆਪੇ ਆਪਿ ਆਪ ਭਰਪੂਰਿ ॥
ਅੰਤਰਗਤਿ ਜਿਸੁ ਆਪਿ ਜਨਾਏ ॥
ਨਾਨਕ ਤਿਸੁ ਜਨ ਆਪਿ ਬੁਝਾਏ ॥੫॥
ਸਰਬ ਭੂਤ ਆਪਿ ਵਰਤਾਰਾ ॥
ਸਰਬ ਨੈਨ ਆਪਿ ਪੇਖਨਹਾਰਾ ॥
ਸਗਲ ਸਮਗ੍ਰੀ ਜਾ ਕਾ ਤਨਾ ॥
ਆਪਨ ਜਸੁ ਆਪ ਹੀ ਸੁਨਾ ॥
ਆਵਨ ਜਾਨੁ ਇਕੁ ਖੇਲੁ ਬਨਾਇਆ ॥
ਆਗਿਆਕਾਰੀ ਕੀਨੀ ਮਾਇਆ ॥
ਸਭ ਕੈ ਮਧਿ ਅਲਿਪਤੋ ਰਹੈ ॥
ਜੋ ਕਿਛੁ ਕਹਣਾ ਸੁ ਆਪੇ ਕਹੈ ॥
ਆਗਿਆ ਆਵੈ ਆਗਿਆ ਜਾਇ ॥
ਨਾਨਕ ਜਾ ਭਾਵੈ ਤਾ ਲਏ ਸਮਾਇ ॥੬॥
ਇਸ ਤੇ ਹੋਇ ਸੁ ਨਾਹੀ ਬੁਰਾ ॥
ਓਰੈ ਕਹਹੁ ਕਿਨੈ ਕਛੁ ਕਰਾ ॥
ਆਪਿ ਭਲਾ ਕਰਤੂਤਿ ਅਤਿ ਨੀਕੀ ॥
ਆਪੇ ਜਾਨੈ ਅਪਨੇ ਜੀ ਕੀ ॥
ਆਪਿ ਸਾਚੁ ਧਾਰੀ ਸਭ ਸਾਚੁ ॥
ਓਤਿ ਪੋਤਿ ਆਪਨ ਸੰਗਿ ਰਾਚੁ ॥
ਤਾ ਕੀ ਗਤਿ ਮਿਤਿ ਕਹੀ ਨ ਜਾਇ ॥
ਦੂਸਰ ਹੋਇ ਤ ਸੋਝੀ ਪਾਇ ॥
ਤਿਸ ਕਾ ਕੀਆ ਸਭੁ ਪਰਵਾਨੁ ॥
ਗੁਰ ਪ੍ਰਸਾਦਿ ਨਾਨਕ ਇਹੁ ਜਾਨੁ ॥੭॥
ਜੋ ਜਾਨੈ ਤਿਸੁ ਸਦਾ ਸੁਖੁ ਹੋਇ ॥
ਆਪਿ ਮਿਲਾਇ ਲਏ ਪ੍ਰਭੁ ਸੋਇ ॥
ਓਹੁ ਧਨਵੰਤੁ ਕੁਲਵੰਤੁ ਪਤਿਵੰਤੁ ॥
ਜੀਵਨ ਮੁਕਤਿ ਜਿਸੁ ਰਿਦੈ ਭਗਵੰਤੁ ॥
ਧੰਨੁ ਧੰਨੁ ਧੰਨੁ ਜਨੁ ਆਇਆ ॥
ਜਿਸੁ ਪ੍ਰਸਾਦਿ ਸਭੁ ਜਗਤੁ ਤਰਾਇਆ ॥
ਜਨ ਆਵਨ ਕਾ ਇਹੈ ਸੁਆਉ ॥
ਜਨ ਕੈ ਸੰਗਿ ਚਿਤਿ ਆਵੈ ਨਾਉ ॥
ਆਪਿ ਮੁਕਤੁ ਮੁਕਤੁ ਕਰੈ ਸੰਸਾਰੁ ॥
ਨਾਨਕ ਤਿਸੁ ਜਨ ਕਉ ਸਦਾ ਨਮਸਕਾਰੁ ॥੮॥੨੩॥
ਸਲੋਕੁ ॥
ਪੂਰਾ ਪ੍ਰਭੁ ਆਰਾਧਿਆ ਪੂਰਾ ਜਾ ਕਾ ਨਾਉ ॥
ਨਾਨਕ ਪੂਰਾ ਪਾਇਆ ਪੂਰੇ ਕੇ ਗੁਨ ਗਾਉ ॥੧॥`,
        transliteration: `salok |
giaan anjan gur deea agiaan andher binaas |
har kirapaa te sant bhettiaa naanak man paragaas |1|
asattapadee |
santasang antar prabh ddeetthaa |
naam prabhoo kaa laagaa meetthaa |
sagal samigree ekas ghatt maeh |
anik rang naanaa drisattaeh |
nau nidh amrit prabh kaa naam |
dehee meh is kaa bisraam |
sun samaadh anahat teh naad |
kehan na jaaee acharaj bisamaad |
tin dekhiaa jis aap dikhaae |
naanak tis jan sojhee paae |1|
so antar so baahar anant |
ghatt ghatt biaap rahiaa bhagavant |
dharan maeh aakaas peaal |
sarab lok pooran pratipaal |
ban tin parabat hai paarabraham |
jaisee aagiaa taisaa karam |
paun paanee baisantar maeh |
chaar kuntt deh dise samaeh |
tis te bhin nahee ko tthaau |
gur prasaad naanak sukh paau |2|
bed puraan sinmrit meh dekh |
saseear soor nakhayatr meh ek |
baanee prabh kee sabh ko bolai |
aap addol na kabahoo ddolai |
sarab kalaa kar khelai khel |
mol na paaeeai gunah amol |
sarab jot meh jaa kee jot |
dhaar rahio suaamee ot pot |
gur parasaad bharam kaa naas |
naanak tin meh ehu bisaas |3|
sant janaa kaa pekhan sabh braham |
sant janaa kai hiradai sabh dharam |
sant janaa suneh subh bachan |
sarab biaapee raam sang rachan |
jin jaataa tis kee ih rehat |
sat bachan saadhoo sabh kehat |
jo jo hoe soee sukh maanai |
karan karaavanahaar prabh jaanai |
antar base baahar bhee ohee |
naanak darasan dekh sabh mohee |4|
aap sat keea sabh sat |
tis prabh te sagalee utapat |
tis bhaavai taa kare bisathaar |
tis bhaavai taa ekankaar |
anik kalaa lakhee neh jaae |
jis bhaavai tis le milaae |
kavan nikatt kavan kaheeai door |
aape aap aap bharapoor |
antaragat jis aap janaae |
naanak tis jan aap bujhaae |5|
sarab bhoot aap varataaraa |
sarab nain aap pekhanahaaraa |
sagal samagree jaa kaa tanaa |
aapan jas aap hee sunaa |
aavan jaan ik khel banaaeaa |
aagiaakaaree keenee maaeaa |
sabh kai madh alipato rahai |
jo kichh kahanaa su aape kahai |
aagiaa aavai aagiaa jaae |
naanak jaa bhaavai taa le samaae |6|
eis te hoe su naahee buraa |
orai kahahu kinai kachh karaa |
aap bhalaa karatoot at neekee |
aape jaanai apane jee kee |
aap saach dhaaree sabh saach |
ot pot aapan sang raach |
taa kee gat mit kahee na jaae |
doosar hoe ta sojhee paae |
tis kaa keea sabh paravaan |
gur prasaad naanak ihu jaan |7|
jo jaanai tis sadaa sukh hoe |
aap milaae le prabh soe |
ohu dhanavant kulavant pativant |
jeevan mukat jis ridai bhagavant |
dhan dhan dhan jan aaeaa |
jis prasaad sabh jagat taraaeaa |
jan aavan kaa ihai suaau |
jan kai sang chit aavai naau |
aap mukat mukat karai sansaar |
naanak tis jan kau sadaa namasakaar |8|23|
salok |
pooraa prabh aaraadhiaa pooraa jaa kaa naau |
naanak pooraa paaeaa poore ke gun gaau |1|`,
        meaning: `Salok: The Guru has given the healing ointment of spiritual wisdom, and dispelled the darkness of ignorance. By the Lord's Grace, I have met the Saint; O Nanak, my mind is enlightened. ||1|| Ashtapadee: In the Society of the Saints, I see God deep within my being. God's Name is sweet to me. All things are contained in the Heart of the One, although they appear in so many various colors. The nine treasures are in the Ambrosial Name of God. Within the human body is its place of rest. The Deepest Samaadhi, and the unstruck sound current of the Naad are there. The wonder and marvel of it cannot be described. He alone sees it, unto whom God Himself reveals it. O Nanak, that humble being understands. ||1|| The Infinite Lord is inside, and outside as well. Deep within each and every heart, the Lord God is pervading. In the earth, in the Akaashic ethers, and in the nether regions of the underworld in all worlds, He is the Perfect Cherisher. In the forests, fields and mountains, He is the Supreme Lord God. As He orders, so do His creatures act. He permeates the winds and the waters. He is pervading in the four corners and in the ten directions. Without Him, there is no place at all. By Guru's Grace, O Nanak, peace is obtained. ||2|| See Him in the Vedas, the Puraanas and the Simritees. In the moon, the sun and the stars, He is the One. The Bani of God's Word is spoken by everyone. He Himself is unwavering - He never wavers. With absolute power, He plays His play. His value cannot be estimated; His virtues are invaluable. In all light, is His Light. The Lord and Master supports the weave of the fabric of the universe. By Guru's Grace, doubt is dispelled. O Nanak, this faith is firmly implanted within. ||3|| In the eye of the Saint, everything is God. In the heart of the Saint, everything is Dharma. The Saint hears words of goodness. He is absorbed in the All-pervading Lord. This is the way of life of one who knows God. True are all the words spoken by the Holy. Whatever happens, he peacefully accepts. He knows God as the Doer, the Cause of causes. He dwells inside, and outside as well. O Nanak, beholding the Blessed Vision of His Darshan, all are fascinated. ||4|| He Himself is True, and all that He has made is True. The entire creation came from God. As it pleases Him, He creates the expanse. As it pleases Him, He becomes the One and Only again. His powers are so numerous, they cannot be known. As it pleases Him, He merges us into Himself again. Who is near, and who is far away? He Himself is Himself pervading everywhere. One whom God causes to know that He is within the heart - O Nanak, He causes that person to understand Him. ||5|| In all forms, He Himself is pervading. Through all eyes, He Himself is watching. All the creation is His Body. He Himself listens to His Own Praise. The One has created the drama of coming and going. He made Maya subservient to His Will. In the midst of all, He remains unattached. Whatever is said, He Himself says. By His Will we come, and by His Will we go. O Nanak, when it pleases Him, then He absorbs us into Himself. ||6|| If it comes from Him, it cannot be bad. Other than Him, who can do anything? He Himself is good; His actions are the very best. He Himself knows His Own Being. He Himself is True, and all that He has established is True. Through and through, He is blended with His creation. His state and extent cannot be described. If there were another like Him, then only he could understand Him. His actions are all approved and accepted. By Guru's Grace, O Nanak, this is known. ||7|| One who knows Him, obtains everlasting peace. God blends that one into Himself. He is wealth and prosperous, and of noble birth. He is Jivan Mukta - liberated while yet alive; the Lord God abides in his heart. Blessed, blessed, blessed is the coming of that humble being; by his grace, the whole world is saved. This is his purpose in life; in the Company of this humble servant, the Lord's Name comes to mind. He Himself is liberated, and He liberates the universe. O Nanak, to that humble servant, I bow in reverence forever. ||8||23|| Salok: I worship and adore the Perfect Lord God. Perfect is His Name. O Nanak, I have obtained the Perfect One; I sing the Glorious Praises of the Perfect Lord. ||1||`,
        meaning_pa: `(ਜਿਸ ਮਨੁੱਖ ਨੂੰ) ਸਤਿਗੁਰੂ ਨੇ ਗਿਆਨ ਦਾ ਸੁਰਮਾ ਬਖ਼ਸ਼ਿਆ ਹੈ, ਉਸ ਦੇ ਅਗਿਆਨ (ਰੂਪ) ਹਨੇਰੇ ਦਾ ਨਾਸ ਹੋ ਜਾਂਦਾ ਹੈ। ਹੇ ਨਾਨਕ! (ਜੋ ਮਨੁੱਖ) ਅਕਾਲ ਪੁਰਖ ਦੀ ਮੇਹਰ ਨਾਲ ਗੁਰੂ ਨੂੰ ਮਿਲਿਆ ਹੈ, ਉਸ ਦੇ ਮਨ ਵਿਚ (ਗਿਆਨ ਦਾ) ਚਾਨਣ ਹੋ ਜਾਂਦਾ ਹੈ ॥੧॥ (ਜਿਸ ਮਨੁੱਖ ਨੇ) ਗੁਰੂ ਦੀ ਸੰਗਤਿ ਵਿਚ (ਰਹਿ ਕੇ) ਆਪਣੇ ਅੰਦਰ ਅਕਾਲ ਪੁਰਖ ਨੂੰ ਵੇਖਿਆ ਹੈ, ਉਸ ਨੂੰ ਪ੍ਰਭੂ ਦਾ ਨਾਮ ਪਿਆਰਾ ਲੱਗਣ ਲੱਗ ਪੈਂਦਾ ਹੈ। (ਜਗਤ ਦੇ) ਸਾਰੇ ਪਦਾਰਥ (ਉਸ ਨੂੰ) ਇਕ ਪ੍ਰਭੂ ਵਿਚ ਹੀ (ਲੀਨ ਦਿੱਸਦੇ ਹਨ), (ਉਸ ਪ੍ਰਭੂ ਤੋਂ ਹੀ) ਅਨੇਕਾਂ ਕਿਸਮਾਂ ਦੇ ਰੰਗ ਤਮਾਸ਼ੇ (ਨਿਕਲੇ ਹੋਏ) ਦਿੱਸਦੇ ਹਨ। ਪ੍ਰਭੂ ਦਾ ਨਾਮ ਜੋ (ਮਾਨੋ, ਜਗਤ ਦੇ) ਨੌ ਹੀ ਖ਼ਜ਼ਾਨਿਆਂ (ਦੇ ਤੁੱਲ) ਹੈ ਤੇ ਅੰਮ੍ਰਿਤ ਹੈ; (ਉਸ ਮਨੁੱਖ ਦੇ) ਸਰੀਰ ਵਿਚ ਉਸ ਨਾਮ ਦਾ ਟਿਕਾਣਾ (ਹੋ ਜਾਂਦਾ ਹੈ।) ਉਸ ਮਨੁੱਖ ਦੇ ਅੰਦਰ ਅਫੁਰ ਸੁਰਤ ਜੁੜੀ ਰਹਿੰਦੀ ਹੈ, ਤੇ, ਅਜੇਹਾ ਅਚਰਜ ਇਕ-ਰਸ ਰਾਗ (-ਰੂਪ ਆਨੰਦ ਬਣਿਆ ਰਹਿੰਦਾ ਹੈ) ਜਿਸ ਦਾ ਬਿਆਨ ਨਹੀਂ ਹੋ ਸਕਦਾ। (ਪਰ) ਇਹ (ਆਨੰਦ) ਉਸ ਮਨੁੱਖ ਨੇ ਵੇਖਿਆ ਹੈ ਜਿਸ ਨੂੰ ਪ੍ਰਭੂ ਆਪ ਵਿਖਾਉਂਦਾ ਹੈ, (ਕਿਉਂਕਿ) ਹੇ ਨਾਨਕ! ਉਸ ਮਨੁੱਖ ਨੂੰ (ਉਸ ਆਨੰਦ ਦੀ) ਸਮਝ ਬਖ਼ਸ਼ਦਾ ਹੈ ॥੧॥ ਉਹ ਬੇਅੰਤ ਭਗਵਾਨ ਅੰਦਰ ਬਾਹਰ (ਸਭ ਥਾਈਂ) ਹਰੇਕ ਸਰੀਰ ਵਿਚ ਮੌਜੂਦ ਹੈ। ਧਰਤੀ ਅਕਾਸ਼ ਤੇ ਪਤਾਲ ਵਿਚ ਹੈ, ਸਾਰੇ ਭਵਨਾਂ ਵਿਚ ਮੌਜੂਦ ਹੈ ਤੇ ਸਭ ਦੀ ਪਾਲਨਾ ਕਰਦਾ ਹੈ; ਉਹ ਪਾਰਬ੍ਰਹਮ ਜੰਗਲ ਵਿਚ ਹੈ, ਘਾਹ (ਆਦਿਕ) ਵਿਚ ਹੈ ਤੇ ਪਰਬਤ ਵਿਚ ਹੈ; ਜਿਹੋ ਜਿਹਾ ਉਹ ਹੁਕਮ (ਕਰਦਾ ਹੈ), ਉਹੋ ਜਿਹਾ (ਜੀਵ) ਕੰਮ ਕਰਦਾ ਹੈ; ਪਉਣ ਵਿਚ, ਪਾਣੀ ਵਿਚ, ਅੱਗ ਵਿਚ, ਚਹੁੰ ਕੂਟਾਂ ਵਿਚ ਦਸੀਂ ਪਾਸੀਂ (ਸਭ ਥਾਈਂ) ਸਮਾਇਆ ਹੋਇਆ ਹੈ। ਕੋਈ (ਭੀ) ਥਾਂ ਉਸ ਪ੍ਰਭੂ ਤੋਂ ਵੱਖਰਾ ਨਹੀਂ ਹੈ; (ਪਰ) ਹੇ ਨਾਨਕ! (ਇਸ ਨਿਸਚੇ ਦਾ) ਆਨੰਦ ਗੁਰੂ ਦੀ ਕਿਰਪਾ ਨਾਲ ਮਿਲਦਾ ਹੈ ॥੨॥ ਵੇਦਾਂ ਵਿਚ, ਪੁਰਾਣਾਂ ਵਿਚ, ਸਿਮ੍ਰਿਤਿਆਂ ਵਿਚ (ਓਸੇ ਪ੍ਰਭੂ ਨੂੰ) ਤੱਕੋ; ਚੰਦ੍ਰਮਾ, ਸੂਰਜ, ਤਾਰਿਆਂ ਵਿਚ ਭੀ ਇਕ ਉਹੀ ਹੈ; ਹਰੇਕ ਜੀਵ ਅਕਾਲ ਪੁਰਖ ਦੀ ਹੀ ਬੋਲੀ ਬੋਲਦਾ ਹੈ; (ਪਰ ਸਭ ਵਿਚ ਹੁੰਦਿਆਂ ਭੀ) ਉਹ ਆਪ ਅਡੋਲ ਹੈ ਕਦੇ ਡੋਲਦਾ ਨਹੀਂ। ਸਾਰੀਆਂ ਤਾਕਤਾਂ ਰਚ ਕੇ (ਜਗਤ ਦੀਆਂ) ਖੇਡਾਂ ਖੇਡ ਰਿਹਾ ਹੈ, (ਪਰ ਉਹ) ਕਿਸੇ ਮੁੱਲ ਤੋਂ ਨਹੀਂ ਮਿਲਦਾ (ਕਿਉਂਕਿ) ਅਮੋਲਕ ਗੁਣਾਂ ਵਾਲਾ ਹੈ; ਜਿਸ ਪ੍ਰਭੂ ਦੀ ਜੋਤਿ ਸਾਰੀਆਂ ਜੋਤਾਂ ਵਿਚ (ਜਗ ਰਹੀ ਹੈ), ਉਹ ਮਾਲਕ ਤਾਣੇ ਪੇਟੇ ਵਾਂਗ (ਸਭ ਨੂੰ) ਆਸਰਾ ਦੇ ਰਿਹਾ ਹੈ; (ਪਰ) ਜਿਨ੍ਹਾਂ ਮਨੁੱਖਾਂ ਦਾ ਭਰਮ ਗੁਰੂ ਦੀ ਕਿਰਪਾ ਨਾਲ ਮਿਟ ਜਾਂਦਾ ਹੈ, ਹੇ ਨਾਨਕ! (ਅਕਾਲ ਪੁਰਖ ਦੀ ਇਸ ਸਰਬ-ਵਿਆਪਕ ਹਸਤੀ ਦਾ) ਇਹ ਯਕੀਨ ਉਹਨਾਂ ਦੇ ਅੰਦਰ ਬਣਦਾ ਹੈ ॥੩॥ ਸੰਤ ਜਨ ਹਰ ਥਾਂ ਅਕਾਲ ਪੁਰਖ ਨੂੰ ਹੀ ਵੇਖਦੇ ਹਨ, ਉਹਨਾਂ ਦੇ ਹਿਰਦੇ ਵਿਚ ਸਾਰੇ (ਖ਼ਿਆਲ) ਧਰਮ ਦੇ ਹੀ (ਉਠਦੇ ਹਨ)। ਸੰਤ ਜਨ ਭਲੇ ਬਚਨ ਹੀ ਸੁਣਦੇ ਹਨ, ਤੇ ਸਭ ਥਾਈਂ ਵਿਆਪਕ ਅਕਾਲ ਪੁਰਖ ਨਾਲ ਜੁੜੇ ਰਹਿੰਦੇ ਹਨ। ਜਿਸ ਜਿਸ ਸੰਤ ਜਨ ਨੇ (ਪ੍ਰਭੂ ਨੂੰ) ਜਾਣ ਲਿਆ ਹੈ ਉਸ ਦੀ ਰਹਿਣੀ ਹੀ ਇਹ ਹੋ ਜਾਂਦੀ ਹੈ, ਕਿ ਉਹ ਸਦਾ ਸੱਚੇ ਬਚਨ ਬੋਲਦਾ ਹੈ; (ਤੇ) ਜੋ ਕੁਝ (ਪ੍ਰਭੂ ਵਲੋਂ) ਹੁੰਦਾ ਹੈ ਉਸੇ ਨੂੰ ਸੁਖ ਮੰਨਦਾ ਹੈ, ਸਭ ਕੰਮ ਕਰਨ ਵਾਲਾ ਤੇ (ਜੀਆਂ ਪਾਸੋਂ) ਕਰਾਉਣ ਵਾਲਾ ਪ੍ਰਭੂ ਨੂੰ ਹੀ ਜਾਣਦਾ ਹੈ। (ਸਾਧੂ ਜਨਾਂ ਲਈ) ਅੰਦਰ ਬਾਹਰ (ਸਭ ਥਾਂ) ਉਹੀ ਪ੍ਰਭੂ ਵੱਸਦਾ ਹੈ। ਹੇ ਨਾਨਕ! (ਪ੍ਰਭੂ ਦਾ ਸਰਬ-ਵਿਆਪੀ) ਦਰਸਨ ਕਰ ਕੇ ਸਾਰੀ ਸ੍ਰਿਸ਼ਟੀ ਮਸਤ ਹੋ ਜਾਂਦੀ ਹੈ ॥੪॥ ਪ੍ਰਭੂ ਆਪ ਹਸਤੀ ਵਾਲਾ ਹੈ, ਜੋ ਕੁਝ ਉਸ ਨੇ ਪੈਦਾ ਕੀਤਾ ਹੈ ਉਹ ਸਭ ਹੋਂਦ ਵਾਲਾ ਹੈ (ਭਾਵ, ਭਰਮ ਭੁਲੇਖਾ ਨਹੀਂ।) ਸਾਰੀ ਸ੍ਰਿਸ਼ਟੀ ਉਸ ਪ੍ਰਭੂ ਤੋਂ ਹੋਈ ਹੈ। ਜੇ ਉਸ ਦੀ ਰਜ਼ਾ ਹੋਵੇ ਤਾਂ ਜਗਤ ਦਾ ਪਸਾਰਾ ਕਰ ਦੇਂਦਾ ਹੈ, ਜੇ ਭਾਵੇ ਸੁ, ਤਾਂ ਫਿਰ ਇਕ ਆਪ ਹੀ ਆਪ ਹੋ ਜਾਂਦਾ ਹੈ। ਉਸ ਦੀਆਂ ਅਨੇਕਾਂ ਤਾਕਤਾਂ ਹਨ, ਕਿਸੇ ਦਾ ਬਿਆਨ ਨਹੀਂ ਹੋ ਸਕਦਾ; ਜਿਸ ਉਤੇ ਤੁੱਠਦਾ ਹੈ ਉਸ ਨੂੰ ਆਪਣੇ ਨਾਲ ਮਿਲਾ ਲੈਂਦਾ ਹੈ। ਉਹ ਪ੍ਰਭੂ ਕਿਨ੍ਹਾਂ ਤੋਂ ਨੇੜੇ, ਤੇ ਕਿਨ੍ਹਾਂ ਤੋਂ ਦੂਰ ਕਿਹਾ ਜਾ ਸਕਦਾ ਹੈ? ਉਹ ਪ੍ਰਭੂ ਆਪ ਹੀ ਸਭ ਥਾਈਂ ਮੌਜੂਦ ਹੈ। ਜਿਸ ਮਨੁੱਖ ਨੂੰ ਪ੍ਰਭੂ ਆਪ ਅੰਦਰਲੀ ਉੱਚੀ ਅਵਸਥਾ ਸੁਝਾਉਂਦਾ ਹੈ, ਹੇ ਨਾਨਕ! ਉਸ ਮਨੁੱਖ ਨੂੰ (ਆਪਣੀ ਇਸ ਸਰਬ-ਵਿਆਪਕ ਦੀ) ਸਮਝ ਬਖ਼ਸ਼ਦਾ ਹੈ ॥੫॥ ਸਾਰੇ ਜੀਵਾਂ ਵਿਚ ਪ੍ਰਭੂ ਆਪ ਹੀ ਵਰਤ ਰਿਹਾ ਹੈ, (ਉਹਨਾਂ ਜੀਵਾਂ ਦੀਆਂ) ਸਾਰੀਆਂ ਅੱਖਾਂ ਵਿਚੋਂ ਦੀ ਪ੍ਰਭੂ ਆਪ ਹੀ ਵੇਖ ਰਿਹਾ ਹੈ। (ਜਗਤ ਦੇ) ਸਾਰੇ ਪਦਾਰਥ ਜਿਸ ਪ੍ਰਭੂ ਦਾ ਸਰੀਰ ਹਨ, (ਸਭ ਵਿਚ ਵਿਆਪਕ ਹੋ ਕੇ) ਉਹ ਆਪਣੀ ਸੋਭਾ ਆਪ ਹੀ ਸੁਣ ਰਿਹਾ ਹੈ। (ਜੀਵਾਂ ਦਾ) ਜੰਮਣਾ ਮਰਨਾ ਪ੍ਰਭੂ ਨੇ ਇਕ ਖੇਡ ਬਣਾਈ ਹੈ, ਤੇ ਆਪਣੇ ਹੁਕਮ ਵਿਚ ਤੁਰਨ ਵਾਲੀ ਮਾਇਆ ਬਣਾ ਦਿੱਤੀ ਹੈ। ਉਹ ਸਭਨਾਂ ਵਿਚ ਵਿਆਪਕ ਹੈ ਪਰ ਫਿਰ ਵੀ ਸਭਨਾਂ ਤੋਂ ਨਿਰਲੇਪ ਰਹਿੰਦਾ ਹੈ। ਉਸ ਨੇ ਜੋ ਕਹਿਣਾ ਹੁੰਦਾ ਹੈ, ਆਪ ਹੀ ਕਹਿ ਦਿੰਦਾ ਹੈ। (ਜੀਵ) ਅਕਾਲ ਪੁਰਖ ਦੇ ਹੁਕਮ ਵਿਚ ਜੰਮਦਾ ਹੈ ਤੇ ਹੁਕਮ ਵਿਚ ਮਰਦਾ ਹੈ, ਹੇ ਨਾਨਕ! ਜਦੋਂ ਉਸ ਦੀ ਰਜ਼ਾ ਹੁੰਦੀ ਹੈ ਤਾਂ ਉਹਨਾਂ ਨੂੰ ਆਪਣੇ ਵਿਚ ਲੀਨ ਕਰ ਲੈਂਦਾ ਹੈ ॥੬॥ ਜੋ ਕੁਝ ਪ੍ਰਭੂ ਵਲੋਂ ਹੁੰਦਾ ਹੈ (ਜੀਆਂ ਲਈ) ਮਾੜਾ ਨਹੀਂ ਹੁੰਦਾ; ਤੇ ਪ੍ਰਭੂ ਤੋਂ ਬਿਨਾ ਦੱਸੋ ਕਿਸੇ ਨੇ ਕੁਝ ਕਰ ਦਿਖਾਇਆ ਹੈ? ਪ੍ਰਭੂ ਆਪ ਚੰਗਾ ਹੈ, ਉਸ ਦਾ ਕੰਮ ਭੀ ਚੰਗਾ ਹੈ, ਆਪਣੇ ਦਿਲ ਦੀ ਗੱਲ ਉਹ ਆਪ ਹੀ ਜਾਣਦਾ ਹੈ। ਆਪ ਹਸਤੀ ਵਾਲਾ ਹੈ, ਸਾਰੀ ਰਚਨਾ ਜੋ ਉਸ ਦੇ ਆਸਰੇ ਹੈ, ਉਹ ਭੀ ਹੋਂਦ ਵਾਲੀ ਹੈ (ਭਰਮ ਨਹੀਂ), ਤਾਣੇ ਪੇਟੇ ਵਾਂਗ ਉਸ ਨੇ ਆਪਣੇ ਨਾਲ ਮਿਲਾਈ ਹੋਈ ਹੈ। ਉਹ ਪ੍ਰਭੂ ਕਿਹੋ ਜਿਹਾ ਹੈ ਤੇ ਕੇਡਾ ਵੱਡਾ ਹੈ-ਇਹ ਗੱਲ ਬਿਆਨ ਨਹੀਂ ਹੋ ਸਕਦੀ, ਕੋਈ ਦੂਜਾ (ਵੱਖਰਾ) ਹੋਵੇ ਤਾਂ ਸਮਝ ਸਕੇ। ਪ੍ਰਭੂ ਦਾ ਕੀਤਾ ਹੋਇਆ ਸਭ ਕੁਝ (ਜੀਵਾਂ ਨੂੰ) ਸਿਰ ਮੱਥੇ ਮੰਨਣਾ ਪੈਂਦਾ ਹੈ, (ਪਰ) ਹੇ ਨਾਨਕ! ਇਹ ਪਛਾਣ ਗੁਰੂ ਦੀ ਕਿਰਪਾ ਨਾਲ ਆਉਂਦੀ ਹੈ ॥੭॥ ਜੋ ਮਨੁੱਖ ਪ੍ਰਭੂ ਨਾਲ ਸਾਂਝ ਪਾ ਲੈਂਦਾ ਹੈ ਉਸ ਨੂੰ ਸਦਾ ਸੁਖ ਹੁੰਦਾ ਹੈ, ਪ੍ਰਭੂ ਉਸ ਨੂੰ ਆਪਣੇ ਨਾਲ ਆਪ ਮਿਲਾ ਲੈਂਦਾ ਹੈ। ਉਹ ਮਨੁੱਖ ਜੀਊਂਦਾ ਹੀ ਮੁਕਤ ਹੋ ਜਾਂਦਾ ਹੈ, ਉਹ ਧਨ ਵਾਲਾ, ਕੁਲ ਵਾਲਾ ਤੇ ਇੱਜ਼ਤ ਵਾਲਾ ਬਣ ਜਾਂਦਾ ਹੈ, ਜਿਸ ਮਨੁੱਖ ਦੇ ਹਿਰਦੇ ਵਿਚ ਭਗਵਾਨ ਵੱਸਦਾ ਹੈ। ਉਸ ਮਨੁੱਖ ਦਾ (ਜਗਤ ਵਿਚ) ਆਉਣਾ ਮੁਬਾਰਿਕ ਹੈ, ਜਿਸ ਦੀ ਮੇਹਰ ਨਾਲ ਸਾਰਾ ਜਗਤ ਹੀ ਤਰਦਾ ਹੈ। ਅਜਿਹੇ ਮਨੁੱਖ ਦੇ ਆਉਣ ਦਾ ਇਹੀ ਮਨੋਰਥ ਹੈ, ਕਿ ਉਸ ਦੀ ਸੰਗਤਿ ਵਿਚ (ਰਹਿ ਕੇ ਹੋਰ ਮਨੁੱਖਾਂ ਨੂੰ ਪ੍ਰਭੂ ਦਾ) ਨਾਮ ਚੇਤੇ ਆਉਂਦਾ ਹੈ। ਉਹ ਮਨੁੱਖ ਆਪ (ਮਾਇਆ ਤੋਂ) ਆਜ਼ਾਦ ਹੈ, ਜਗਤ ਨੂੰ ਭੀ ਮੁਕਤ ਕਰਦਾ ਹੈ; ਹੇ ਨਾਨਕ! ਐਸੇ (ਉੱਤਮ) ਮਨੁੱਖ ਨੂੰ ਸਾਡੀ ਸਦਾ ਪ੍ਰਣਾਮ ਹੈ ॥੮॥੨੩॥ (ਜਿਸ ਮਨੁੱਖ ਨੇ) ਅਟੱਲ ਨਾਮ ਵਾਲੇ ਪੂਰਨ ਪ੍ਰਭੂ ਨੂੰ ਸਿਮਰਿਆ ਹੈ, ਉਸ ਨੂੰ ਉਹ ਪੂਰਨ ਪ੍ਰਭੂ ਮਿਲ ਪਿਆ ਹੈ; (ਤਾਂ ਤੇ) ਹੇ ਨਾਨਕ! ਤੂੰ ਭੀ ਪੂਰਨ ਪ੍ਰਭੂ ਦੇ ਗੁਣ ਗਾ ॥੧॥`
      },
      {
        number: 24,
        sanskrit: `ਸਲੋਕੁ ॥
ਪੂਰਾ ਪ੍ਰਭੁ ਆਰਾਧਿਆ ਪੂਰਾ ਜਾ ਕਾ ਨਾਉ ॥
ਨਾਨਕ ਪੂਰਾ ਪਾਇਆ ਪੂਰੇ ਕੇ ਗੁਨ ਗਾਉ ॥੧॥
ਅਸਟਪਦੀ ॥
ਪੂਰੇ ਗੁਰ ਕਾ ਸੁਨਿ ਉਪਦੇਸੁ ॥
ਪਾਰਬ੍ਰਹਮੁ ਨਿਕਟਿ ਕਰਿ ਪੇਖੁ ॥
ਸਾਸਿ ਸਾਸਿ ਸਿਮਰਹੁ ਗੋਬਿੰਦ ॥
ਮਨ ਅੰਤਰ ਕੀ ਉਤਰੈ ਚਿੰਦ ॥
ਆਸ ਅਨਿਤ ਤਿਆਗਹੁ ਤਰੰਗ ॥
ਸੰਤ ਜਨਾ ਕੀ ਧੂਰਿ ਮਨ ਮੰਗ ॥
ਆਪੁ ਛੋਡਿ ਬੇਨਤੀ ਕਰਹੁ ॥
ਸਾਧਸੰਗਿ ਅਗਨਿ ਸਾਗਰੁ ਤਰਹੁ ॥
ਹਰਿ ਧਨ ਕੇ ਭਰਿ ਲੇਹੁ ਭੰਡਾਰ ॥
ਨਾਨਕ ਗੁਰ ਪੂਰੇ ਨਮਸਕਾਰ ॥੧॥
ਖੇਮ ਕੁਸਲ ਸਹਜ ਆਨੰਦ ॥
ਸਾਧਸੰਗਿ ਭਜੁ ਪਰਮਾਨੰਦ ॥
ਨਰਕ ਨਿਵਾਰਿ ਉਧਾਰਹੁ ਜੀਉ ॥
ਗੁਨ ਗੋਬਿੰਦ ਅੰਮ੍ਰਿਤ ਰਸੁ ਪੀਉ ॥
ਚਿਤਿ ਚਿਤਵਹੁ ਨਾਰਾਇਣ ਏਕ ॥
ਏਕ ਰੂਪ ਜਾ ਕੇ ਰੰਗ ਅਨੇਕ ॥
ਗੋਪਾਲ ਦਾਮੋਦਰ ਦੀਨ ਦਇਆਲ ॥
ਦੁਖ ਭੰਜਨ ਪੂਰਨ ਕਿਰਪਾਲ ॥
ਸਿਮਰਿ ਸਿਮਰਿ ਨਾਮੁ ਬਾਰੰ ਬਾਰ ॥
ਨਾਨਕ ਜੀਅ ਕਾ ਇਹੈ ਅਧਾਰ ॥੨॥
ਉਤਮ ਸਲੋਕ ਸਾਧ ਕੇ ਬਚਨ ॥
ਅਮੁਲੀਕ ਲਾਲ ਏਹਿ ਰਤਨ ॥
ਸੁਨਤ ਕਮਾਵਤ ਹੋਤ ਉਧਾਰ ॥
ਆਪਿ ਤਰੈ ਲੋਕਹ ਨਿਸਤਾਰ ॥
ਸਫਲ ਜੀਵਨੁ ਸਫਲੁ ਤਾ ਕਾ ਸੰਗੁ ॥
ਜਾ ਕੈ ਮਨਿ ਲਾਗਾ ਹਰਿ ਰੰਗੁ ॥
ਜੈ ਜੈ ਸਬਦੁ ਅਨਾਹਦੁ ਵਾਜੈ ॥
ਸੁਨਿ ਸੁਨਿ ਅਨਦ ਕਰੇ ਪ੍ਰਭੁ ਗਾਜੈ ॥
ਪ੍ਰਗਟੇ ਗੁਪਾਲ ਮਹਾਂਤ ਕੈ ਮਾਥੇ ॥
ਨਾਨਕ ਉਧਰੇ ਤਿਨ ਕੈ ਸਾਥੇ ॥੩॥
ਸਰਨਿ ਜੋਗੁ ਸੁਨਿ ਸਰਨੀ ਆਏ ॥
ਕਰਿ ਕਿਰਪਾ ਪ੍ਰਭ ਆਪ ਮਿਲਾਏ ॥
ਮਿਟਿ ਗਏ ਬੈਰ ਭਏ ਸਭ ਰੇਨ ॥
ਅੰਮ੍ਰਿਤ ਨਾਮੁ ਸਾਧਸੰਗਿ ਲੈਨ ॥
ਸੁਪ੍ਰਸੰਨ ਭਏ ਗੁਰਦੇਵ ॥
ਪੂਰਨ ਹੋਈ ਸੇਵਕ ਕੀ ਸੇਵ ॥
ਆਲ ਜੰਜਾਲ ਬਿਕਾਰ ਤੇ ਰਹਤੇ ॥
ਰਾਮ ਨਾਮ ਸੁਨਿ ਰਸਨਾ ਕਹਤੇ ॥
ਕਰਿ ਪ੍ਰਸਾਦੁ ਦਇਆ ਪ੍ਰਭਿ ਧਾਰੀ ॥
ਨਾਨਕ ਨਿਬਹੀ ਖੇਪ ਹਮਾਰੀ ॥੪॥
ਪ੍ਰਭ ਕੀ ਉਸਤਤਿ ਕਰਹੁ ਸੰਤ ਮੀਤ ॥
ਸਾਵਧਾਨ ਏਕਾਗਰ ਚੀਤ ॥
ਸੁਖਮਨੀ ਸਹਜ ਗੋਬਿੰਦ ਗੁਨ ਨਾਮ ॥
ਜਿਸੁ ਮਨਿ ਬਸੈ ਸੁ ਹੋਤ ਨਿਧਾਨ ॥
ਸਰਬ ਇਛਾ ਤਾ ਕੀ ਪੂਰਨ ਹੋਇ ॥
ਪ੍ਰਧਾਨ ਪੁਰਖੁ ਪ੍ਰਗਟੁ ਸਭ ਲੋਇ ॥
ਸਭ ਤੇ ਊਚ ਪਾਏ ਅਸਥਾਨੁ ॥
ਬਹੁਰਿ ਨ ਹੋਵੈ ਆਵਨ ਜਾਨੁ ॥
ਹਰਿ ਧਨੁ ਖਾਟਿ ਚਲੈ ਜਨੁ ਸੋਇ ॥
ਨਾਨਕ ਜਿਸਹਿ ਪਰਾਪਤਿ ਹੋਇ ॥੫॥
ਖੇਮ ਸਾਂਤਿ ਰਿਧਿ ਨਵ ਨਿਧਿ ॥
ਬੁਧਿ ਗਿਆਨੁ ਸਰਬ ਤਹ ਸਿਧਿ ॥
ਬਿਦਿਆ ਤਪੁ ਜੋਗੁ ਪ੍ਰਭ ਧਿਆਨੁ ॥
ਗਿਆਨੁ ਸ੍ਰੇਸਟ ਊਤਮ ਇਸਨਾਨੁ ॥
ਚਾਰਿ ਪਦਾਰਥ ਕਮਲ ਪ੍ਰਗਾਸ ॥
ਸਭ ਕੈ ਮਧਿ ਸਗਲ ਤੇ ਉਦਾਸ ॥
ਸੁੰਦਰੁ ਚਤੁਰੁ ਤਤ ਕਾ ਬੇਤਾ ॥
ਸਮਦਰਸੀ ਏਕ ਦ੍ਰਿਸਟੇਤਾ ॥
ਇਹ ਫਲ ਤਿਸੁ ਜਨ ਕੈ ਮੁਖਿ ਭਨੇ ॥
ਗੁਰ ਨਾਨਕ ਨਾਮ ਬਚਨ ਮਨਿ ਸੁਨੇ ॥੬॥
ਇਹੁ ਨਿਧਾਨੁ ਜਪੈ ਮਨਿ ਕੋਇ ॥
ਸਭ ਜੁਗ ਮਹਿ ਤਾ ਕੀ ਗਤਿ ਹੋਇ ॥
ਗੁਣ ਗੋਬਿੰਦ ਨਾਮ ਧੁਨਿ ਬਾਣੀ ॥
ਸਿਮ੍ਰਿਤਿ ਸਾਸਤ੍ਰ ਬੇਦ ਬਖਾਣੀ ॥
ਸਗਲ ਮਤਾਂਤ ਕੇਵਲ ਹਰਿ ਨਾਮ ॥
ਗੋਬਿੰਦ ਭਗਤ ਕੈ ਮਨਿ ਬਿਸ੍ਰਾਮ ॥
ਕੋਟਿ ਅਪ੍ਰਾਧ ਸਾਧਸੰਗਿ ਮਿਟੈ ॥
ਸੰਤ ਕ੍ਰਿਪਾ ਤੇ ਜਮ ਤੇ ਛੁਟੈ ॥
ਜਾ ਕੈ ਮਸਤਕਿ ਕਰਮ ਪ੍ਰਭਿ ਪਾਏ ॥
ਸਾਧ ਸਰਣਿ ਨਾਨਕ ਤੇ ਆਏ ॥੭॥
ਜਿਸੁ ਮਨਿ ਬਸੈ ਸੁਨੈ ਲਾਇ ਪ੍ਰੀਤਿ ॥
ਤਿਸੁ ਜਨ ਆਵੈ ਹਰਿ ਪ੍ਰਭੁ ਚੀਤਿ ॥
ਜਨਮ ਮਰਨ ਤਾ ਕਾ ਦੂਖੁ ਨਿਵਾਰੈ ॥
ਦੁਲਭ ਦੇਹ ਤਤਕਾਲ ਉਧਾਰੈ ॥
ਨਿਰਮਲ ਸੋਭਾ ਅੰਮ੍ਰਿਤ ਤਾ ਕੀ ਬਾਨੀ ॥
ਏਕੁ ਨਾਮੁ ਮਨ ਮਾਹਿ ਸਮਾਨੀ ॥
ਦੂਖ ਰੋਗ ਬਿਨਸੇ ਭੈ ਭਰਮ ॥
ਸਾਧ ਨਾਮ ਨਿਰਮਲ ਤਾ ਕੇ ਕਰਮ ॥
ਸਭ ਤੇ ਊਚ ਤਾ ਕੀ ਸੋਭਾ ਬਨੀ ॥
ਨਾਨਕ ਇਹ ਗੁਣਿ ਨਾਮੁ ਸੁਖਮਨੀ ॥੮॥੨੪॥`,
        transliteration: `salok |
pooraa prabh aaraadhiaa pooraa jaa kaa naau |
naanak pooraa paaeaa poore ke gun gaau |1|
asattapadee |
poore gur kaa sun upades |
paarabraham nikatt kar pekh |
saas saas simarahu gobind |
man antar kee utarai chind |
aas anit tiaagahu tarang |
sant janaa kee dhoor man mang |
aap chhodd benatee karahu |
saadhasang agan saagar tarahu |
har dhan ke bhar lehu bhanddaar |
naanak gur poore namasakaar |1|
khem kusal sehaj aanand |
saadhasang bhaj paramaanand |
narak nivaar udhaarahu jeeo |
gun gobind amrit ras peeo |
chit chitavahu naaraaein ek |
ek roop jaa ke rang anek |
gopaal daamodar deen deaal |
dukh bhanjan pooran kirapaal |
simar simar naam baaran baar |
naanak jeea kaa ihai adhaar |2|
autam salok saadh ke bachan |
amuleek laal ehi ratan |
sunat kamaavat hot udhaar |
aap tarai lokah nisataar |
safal jeevan safal taa kaa sang |
jaa kai man laagaa har rang |
jai jai sabad anaahad vaajai |
sun sun anad kare prabh gaajai |
pragatte gupaal mahaant kai maathe |
naanak udhare tin kai saathe |3|
saran jog sun saranee aae |
kar kirapaa prabh aap milaae |
mitt ge bair bhe sabh ren |
amrit naam saadhasang lain |
suprasan bhe guradev |
pooran hoee sevak kee sev |
aal janjaal bikaar te rahate |
raam naam sun rasanaa kahate |
kar prasaad deaa prabh dhaaree |
naanak nibahee khep hamaaree |4|
prabh kee usatat karahu sant meet |
saavadhaan ekaagar cheet |
sukhamanee sehaj gobind gun naam |
jis man basai su hot nidhaan |
sarab ichhaa taa kee pooran hoe |
pradhaan purakh pragatt sabh loe |
sabh te aooch paae asathaan |
bahur na hovai aavan jaan |
har dhan khaatt chalai jan soe |
naanak jiseh paraapat hoe |5|
khem saant ridh nav nidh |
budh giaan sarab teh sidh |
bidiaa tap jog prabh dhiaan |
giaan sresatt aootam isanaan |
chaar padaarath kamal pragaas |
sabh kai madh sagal te udaas |
sundar chatur tat kaa betaa |
samadarasee ek drisattetaa |
eih fal tis jan kai mukh bhane |
gur naanak naam bachan man sune |6|
eihu nidhaan japai man koe |
sabh jug meh taa kee gat hoe |
gun gobind naam dhun baanee |
simrit saasatr bed bakhaanee |
sagal mataant keval har naam |
gobind bhagat kai man bisraam |
kott apraadh saadhasang mittai |
sant kripaa te jam te chhuttai |
jaa kai masatak karam prabh paae |
saadh saran naanak te aae |7|
jis man basai sunai laae preet |
tis jan aavai har prabh cheet |
janam maran taa kaa dookh nivaarai |
dulabh deh tatakaal udhaarai |
niramal sobhaa amrit taa kee baanee |
ek naam man maeh samaanee |
dookh rog binase bhai bharam |
saadh naam niramal taa ke karam |
sabh te aooch taa kee sobhaa banee |
naanak ih gun naam sukhamanee |8|24|`,
        meaning: `Salok: I worship and adore the Perfect Lord God. Perfect is His Name. O Nanak, I have obtained the Perfect One; I sing the Glorious Praises of the Perfect Lord. ||1|| Ashtapadee: Listen to the Teachings of the Perfect Guru; see the Supreme Lord God near you. With each and every breath, meditate in remembrance on the Lord of the Universe, and the anxiety within your mind shall depart. Abandon the waves of fleeting desire, and pray for the dust of the feet of the Saints. Renounce your selfishness and conceit and offer your prayers. In the Saadh Sangat, the Company of the Holy, cross over the ocean of fire. Fill your stores with the wealth of the Lord. Nanak bows in humility and reverence to the Perfect Guru. ||1|| Happiness, intuitive peace, poise and bliss in the Company of the Holy, meditate on the Lord of supreme bliss. You shall be spared from hell - save your soul! Drink in the ambrosial essence of the Glorious Praises of the Lord of the Universe. Focus your consciousness on the One, the All-pervading Lord He has One Form, but He has many manifestations. Sustainer of the Universe, Lord of the world, Kind to the poor, Destroyer of sorrow, perfectly Merciful. Meditate, meditate in remembrance on the Naam, again and again. O Nanak, it is the Support of the soul. ||2|| The most sublime hymns are the Words of the Holy. These are priceless rubies and gems. One who listens and acts on them is saved. He himself swims across, and saves others as well. His life is prosperous, and his company is fruitful; his mind is imbued with the love of the Lord. Hail, hail to him, for whom the sound current of the Shabad vibrates. Hearing it again and again, he is in bliss, proclaiming God's Praises. The Lord radiates from the foreheads of the Holy. Nanak is saved in their company. ||3|| Hearing that He can give Sanctuary, I have come seeking His Sanctuary. Bestowing His Mercy, God has blended me with Himself. Hatred is gone, and I have become the dust of all. I have received the Ambrosial Naam in the Company of the Holy. The Divine Guru is perfectly pleased; the service of His servant has been rewarded. I have been released from worldly entanglements and corruption, hearing the Lord's Name and chanting it with my tongue. By His Grace, God has bestowed His Mercy. O Nanak, my merchandise has arrived save and sound. ||4|| Sing the Praises of God, O Saints, O friends, with total concentration and one-pointedness of mind. Sukhmani is the peaceful ease, the Glory of God, the Naam. When it abides in the mind, one becomes wealthy. All desires are fulfilled. One becomes the most respected person, famous all over the world. He obtains the highest place of all. He does not come and go in reincarnation any longer. One who departs, after earning the wealth of the Lord's Name, O Nanak, realizes it. ||5|| Comfort, peace and tranquility, wealth and the nine treasures; wisdom, knowledge, and all spiritual powers; learning, penance, Yoga and meditation on God; The most sublime wisdom and purifying baths; the four cardinal blessings, the opening of the heart-lotus; in the midst of all, and yet detached from all; beauty, intelligence, and the realization of reality; to look impartially upon all, and to see only the One - these blessings come to one who, through Guru Nanak, chants the Naam with his mouth, and hears the Word with his ears. ||6|| One who chants this treasure in his mind in every age, he attains salvation. In it is the Glory of God, the Naam, the chanting of Gurbani. The Simritees, the Shaastras and the Vedas speak of it. The essence of all religion is the Lord's Name alone. It abides in the minds of the devotees of God. Millions of sins are erased, in the Company of the Holy. By the Grace of the Saint, one escapes the Messenger of Death. Those, who have such pre-ordained destiny on their foreheads, O Nanak, enter the Sanctuary of the Saints. ||7|| One, within whose mind it abides, and who listens to it with love that humble person consciously remembers the Lord God. The pains of birth and death are removed. The human body, so difficult to obtain, is instantly redeemed. Spotlessly pure is his reputation, and ambrosial is his speech. The One Name permeates his mind. Sorrow, sickness, fear and doubt depart. He is called a Holy person; his actions are immaculate and pure. His glory becomes the highest of all. O Nanak, by these Glorious Virtues, this is named Sukhmani, Peace of mind. ||8||24||`,
        meaning_pa: `(ਜਿਸ ਮਨੁੱਖ ਨੇ) ਅਟੱਲ ਨਾਮ ਵਾਲੇ ਪੂਰਨ ਪ੍ਰਭੂ ਨੂੰ ਸਿਮਰਿਆ ਹੈ, ਉਸ ਨੂੰ ਉਹ ਪੂਰਨ ਪ੍ਰਭੂ ਮਿਲ ਪਿਆ ਹੈ; (ਤਾਂ ਤੇ) ਹੇ ਨਾਨਕ! ਤੂੰ ਭੀ ਪੂਰਨ ਪ੍ਰਭੂ ਦੇ ਗੁਣ ਗਾ ॥੧॥ (ਹੇ ਮਨ!) ਪੂਰੇ ਸਤਿਗੁਰੂ ਦੀ ਸਿੱਖਿਆ ਸੁਣ, ਤੇ, ਅਕਾਲ ਪੁਰਖ ਨੂੰ (ਹਰ ਥਾਂ) ਨੇੜੇ ਜਾਣ ਕੇ ਵੇਖ। (ਹੇ ਭਾਈ!) ਦੰਮ-ਬ-ਦੰਮ ਪ੍ਰਭੂ ਨੂੰ ਯਾਦ ਕਰ, (ਤਾਂ ਜੁ) ਤੇਰੇ ਮਨ ਦੇ ਅੰਦਰ ਦੀ ਚਿੰਤਾ ਮਿਟ ਜਾਏ। (ਹੇ ਮਨ!) ਨਿੱਤ ਨਾਹ ਰਹਿਣ ਵਾਲੀਆਂ (ਚੀਜ਼ਾਂ ਦੀਆਂ) ਆਸਾਂ ਦੀਆਂ ਲਹਰਾਂ ਛੱਡ ਦੇਹ, ਅਤੇ ਹੇ ਮਨ! ਸੰਤ ਜਨਾਂ ਦੇ ਪੈਰਾਂ ਦੀ ਖ਼ਾਕ ਮੰਗ। (ਹੇ ਭਾਈ!) ਆਪਾ-ਭਾਵ ਛੱਡ ਕੇ (ਪ੍ਰਭੂ ਦੇ ਅੱਗੇ) ਅਰਦਾਸ ਕਰ, (ਤੇ ਇਸ ਤਰ੍ਹਾਂ) ਸਾਧ ਸੰਗਤਿ ਵਿਚ (ਰਹਿ ਕੇ) (ਵਿਕਾਰਾਂ ਦੀ) ਅੱਗ ਦੇ ਸਮੁੰਦਰ ਤੋਂ ਪਾਰ ਲੰਘ। ਪ੍ਰਭੂ-ਨਾਮ-ਰੂਪੀ ਧਨ ਦੇ ਖ਼ਜ਼ਾਨੇ ਭਰ ਲੈ, ਹੇ ਨਾਨਕ! ਅਤੇ ਪੂਰੇ ਸਤਿਗੁਰੂ ਨੂੰ ਨਮਸਕਾਰ ਕਰ ॥੧॥ (ਹੇ ਭਾਈ!) ਤੈਨੂੰ ਅਟੱਲ ਸੁਖ, ਸੌਖਾ ਜੀਵਨ ਤੇ ਆਤਮਕ ਅਡੋਲਤਾ ਦਾ ਆਨੰਦ ਪ੍ਰਾਪਤ ਹੋਣਗੇ; ਤੂੰ ਸਾਧ ਸੰਗਤਿ ਵਿਚ ਪਰਮ-ਸੁਖ ਪ੍ਰਭੂ ਨੂੰ ਸਿਮਰ। ਨਰਕਾਂ ਨੂੰ ਦੂਰ ਕਰ ਕੇ ਜਿੰਦ ਬਚਾ ਲੈ- ਗੋਬਿੰਦ ਦੇ ਗੁਣ ਗਾ (ਨਾਮ-) ਅੰਮ੍ਰਿਤ ਦਾ ਰਸ ਪੀ। ਉਸ ਇੱਕ ਪੁਭੂ ਦਾ ਧਿਆਨ ਚਿੱਤ ਵਿਚ ਧਰਹੁ, ਜਿਸ ਇੱਕ ਅਕਾਲ ਪੁਰਖ ਦੇ ਅਨੇਕਾਂ ਰੰਗ ਹਨ। ਦੀਨਾਂ ਉਤੇ ਦਇਆ ਕਰਨ ਵਾਲਾ ਗੋਪਾਲ ਦਮੋਦਰ- ਦੁੱਖਾਂ ਦਾ ਨਾਸ ਕਰਨ ਵਾਲਾ ਸਭ ਵਿਚ ਵਿਆਪਕ ਤੇ ਮੇਹਰ ਦਾ ਜੋ ਘਰ ਹੈ; ਉਸ ਦਾ ਨਾਮ ਮੁੜ ਮੁੜ ਯਾਦ ਕਰ। ਹੇ ਨਾਨਕ! ਜਿੰਦ ਦਾ ਆਸਰਾ ਇਹ ਨਾਮ ਹੀ ਹੈ ॥੨॥ ਸਾਧ (ਗੁਰੂ) ਦੇ ਬਚਨ ਸਭ ਤੋਂ ਚੰਗੀ ਸਿਫ਼ਤ-ਸਾਲਾਹ ਦੀ ਬਾਣੀ ਹਨ, ਇਹ ਅਮੋਲਕ ਲਾਲ ਹਨ, ਅਮੋਲਕ ਰਤਨ ਹਨ। (ਇਹਨਾਂ ਬਚਨਾਂ ਨੂੰ) ਸੁਣਿਆਂ ਤੇ ਕਮਾਇਆਂ ਬੇੜਾ ਪਾਰ ਹੁੰਦਾ ਹੈ, (ਜੋ ਕਮਾਉਂਦਾ ਹੈ) ਉਹ ਆਪ ਤਰਦਾ ਹੈ ਤੇ ਲੋਕਾਂ ਦਾ ਭੀ ਨਿਸਤਾਰਾ ਕਰਦਾ ਹੈ। ਉਸ ਮਨੁੱਖ ਦੀ ਜ਼ਿੰਦਗੀ ਪੂਰੀਆਂ ਮੁਰਾਦਾਂ ਵਾਲੀ ਹੁੰਦੀ ਹੈ, ਉਸ ਦੀ ਸੰਗਤਿ ਹੋਰਨਾਂ ਦੀਆਂ ਮੁਰਾਦਾਂ ਪੂਰੀਆਂ ਕਰਦੀ ਹੈ; ਜਿਸ ਦੇ ਮਨ ਵਿਚ ਪ੍ਰਭੂ ਦਾ ਪਿਆਰ ਬਣ ਜਾਂਦਾ ਹੈ। (ਉਸ ਦੇ ਅੰਦਰ) ਚੜ੍ਹਦੀਆਂ ਕਲਾਂ ਦੀ ਰੌ ਸਦਾ ਚਲਦੀ ਹੈ, ਜਿਸ ਨੂੰ ਸੁਣ ਕੇ (ਭਾਵ ਮਹਿਸੂਸ ਕਰ ਕੇ) ਉਹ ਖ਼ੁਸ਼ ਹੁੰਦਾ ਹੈ (ਕਿਉਂਕਿ) ਪ੍ਰਭੂ (ਉਸ ਦੇ ਅੰਦਰ) ਆਪਣਾ ਨੂਰ ਰੋਸ਼ਨ ਕਰਦਾ ਹੈ। ਗੋਪਾਲ ਪ੍ਰਭੂ ਜੀ ਉਚੀ ਕਰਨੀ ਵਾਲੇ ਬੰਦੇ ਦੇ ਮੱਥੇ ਉਤੇ ਪਰਗਟ ਹੁੰਦੇ ਹਨ, ਹੇ ਨਾਨਕ! ਅਜੇਹੇ ਬੰਦੇ ਦੇ ਨਾਲ ਹੋਰ ਕਈ ਮਨੁੱਖਾਂ ਦਾ ਬੇੜਾ ਪਾਰ ਹੁੰਦਾ ਹੈ ॥੩॥ ਹੇ ਪ੍ਰਭੂ! ਇਹ ਸੁਣ ਕੇ ਕਿ ਤੂੰ ਦਰ-ਢੱਠਿਆਂ ਦੀ ਬਾਂਹ ਫੜਨ-ਜੋਗਾ ਹੈਂ, ਅਸੀਂ ਤੇਰੇ ਦਰ ਤੇ ਆਏ ਸਾਂ, ਤੂੰ ਮੇਹਰ ਕਰ ਕੇ (ਸਾਨੂੰ) ਆਪਣੇ ਨਾਲ ਮੇਲ ਲਿਆ ਹੈ। (ਹੁਣ ਸਾਡੇ) ਵੈਰ ਮਿਟ ਗਏ ਹਨ, ਅਸੀਂ ਸਭ ਦੇ ਪੈਰਾਂ ਦੀ ਖ਼ਾਕ ਹੋ ਗਏ ਹਾਂ, (ਹੁਣ) ਸਾਧ ਸੰਗਤਿ ਵਿਚ ਅਮਰ ਕਰਨ ਵਾਲਾ ਨਾਮ ਜਪ ਰਹੇ ਹਾਂ। ਗੁਰਦੇਵ ਜੀ (ਸਾਡੇ ਉਤੇ) ਤ੍ਰੁੱਠ ਪਏ ਹਨ, ਇਸ ਵਾਸਤੇ (ਸਾਡੀ) ਸੇਵਕਾਂ ਦੀ ਸੇਵਾ ਸਿਰੇ ਚੜ੍ਹ ਗਈ ਹੈ। (ਅਸੀਂ ਹੁਣ) ਘਰ ਦੇ ਧੰਧਿਆਂ ਤੇ ਵਿਕਾਰਾਂ ਤੋਂ ਬਚ ਗਏ ਹਾਂ, ਪ੍ਰਭੂ ਦਾ ਨਾਮ ਸੁਣ ਕੇ ਜੀਭ ਨਾਲ (ਭੀ) ਉਚਾਰਦੇ ਹਾਂ। ਪ੍ਰਭੂ ਨੇ ਮੇਹਰ ਕਰ ਕੇ (ਸਾਡੇ ਉਤੇ) ਦਇਆ ਕੀਤੀ ਹੈ, ਹੇ ਨਾਨਕ! ਤੇ ਸਾਡਾ ਕੀਤਾ ਹੋਇਆ ਵਣਜ ਦਰਗਾਹੇ ਕਬੂਲ ਹੋ ਗਿਆ ਹੈ ॥੪॥ ਹੇ ਸੰਤ ਮਿਤ੍ਰ! ਅਕਾਲ ਪੁਰਖ ਦੀ ਸਿਫ਼ਤ-ਸਾਲਾਹ ਕਰੋ- ਧਿਆਨ ਨਾਲ ਚਿੱਤ ਨੂੰ ਇਕ ਨਿਸ਼ਾਨੇ ਤੇ ਟਿਕਾ ਕੇ। ਪ੍ਰਭੂ ਦੀ ਸਿਫ਼ਤ-ਸਾਲਾਹ ਤੇ ਪ੍ਰਭੂ ਦਾ ਨਾਮ ਅਡੋਲ ਅਵਸਥਾ (ਦਾ ਕਾਰਣ ਹੈ ਤੇ) ਸੁਖਾਂ ਦੀ ਮਣੀ (ਰਤਨ) ਹੈ, ਜਿਸ ਦੇ ਮਨ ਵਿਚ (ਨਾਮ) ਵੱਸਦਾ ਹੈ ਉਹ (ਗੁਣਾਂ ਦਾ) ਖ਼ਜ਼ਾਨਾ ਹੋ ਜਾਂਦਾ ਹੈ। ਉਸ ਮਨੁੱਖ ਦੀ ਇੱਛਿਆ ਸਾਰੀ ਪੂਰੀ ਹੋ ਜਾਂਦੀ ਹੈ, ਉਹ ਬੰਦਾ ਤੁਰਨੇ-ਸਿਰ ਹੋ ਜਾਂਦਾ ਹੈ, ਤੇ ਸਾਰੇ ਜਗਤ ਵਿਚ ਉੱਘਾ ਹੋ ਜਾਂਦਾ ਹੈ। ਉਸ ਨੂੰ ਉੱਚੇ ਤੋਂ ਉੱਚਾ ਟਿਕਾਣਾ ਮਿਲ ਜਾਂਦਾ ਹੈ, ਮੁੜ ਉਸ ਨੂੰ ਜਨਮ ਮਰਨ (ਦਾ ਗੇੜ) ਨਹੀਂ ਵਿਆਪਦਾ। ਉਹ ਮਨੁੱਖ ਪ੍ਰਭੂ ਦਾ ਨਾਮ ਰੂਪ ਧਨ ਖੱਟ ਕੇ (ਜਗਤ ਤੋਂ) ਜਾਂਦਾ ਹੈ, ਹੇ ਨਾਨਕ! ਜਿਸ ਮਨੁੱਖ ਨੂੰ (ਧੁਰੋਂ) ਇਹ  ਦਾਤ ਮਿਲਦੀ ਹੈ ॥੫॥ ਅਟੱਲ ਸੁਖ ਮਨ ਦਾ ਟਿਕਾਉ, ਰਿਧੀਆਂ, ਨੌ ਖ਼ਜ਼ਾਨੇ, ਅਕਲ, ਗਿਆਨ ਤੇ ਸਾਰੀਆਂ ਕਰਾਮਾਤਾਂ ਉਸ ਮਨੁੱਖ ਵਿਚ (ਆ ਜਾਂਦੀਆਂ ਹਨ); ਵਿੱਦਿਆ, ਤਪ, ਜੋਗ, ਅਕਾਲ ਪੁਰਖ ਦਾ ਧਿਆਨ, ਸ੍ਰੇਸ਼ਟ ਗਿਆਨ, ਚੰਗੇ ਤੋਂ ਚੰਗਾ (ਭਾਵ, ਤੀਰਥਾਂ ਦਾ) ਇਸ਼ਨਾਨ; (ਧਰਮ, ਅਰਥ, ਕਾਮ, ਮੋਖ) ਚਾਰੇ ਪਦਾਰਥ, ਹਿਰਦੇ-ਕਮਲ ਦਾ ਖੇੜਾ; ਸਾਰਿਆਂ ਦੇ ਵਿਚ ਰਹਿੰਦਿਆਂ ਸਭ ਤੋਂ ਉਪਰਾਮ ਰਹਿਣਾ; ਸੋਹਣਾ, ਸਿਆਣਾ, (ਜਗਤ ਦੇ) ਮੂਲ ਪ੍ਰਭੂ ਦਾ ਮਹਰਮ, ਸਭ ਨੂੰ ਇਕੋ ਜਿਹਾ ਜਾਣਨਾ ਤੇ ਸਭ ਨੂੰ ਇਕੋ ਨਜ਼ਰ ਨਾਲ ਵੇਖਣਾ; ਇਹ ਸਾਰੇ ਫਲ; ਹੇ ਨਾਨਕ! ਉਸ ਮਨੁੱਖ ਦੇ ਅੰਦਰ ਆ ਵੱਸਦੇ ਹਨ; ਜੋ ਗੁਰੂ ਦੇ ਬਚਨ ਤੇ ਪ੍ਰਭੂ ਦਾ ਨਾਮ ਮੂੰਹੋਂ ਉਚਾਰਦਾ ਹੈ ਤੇ ਮਨ ਲਾ ਕੇ ਸੁਣਦਾ ਹੈ ॥੬॥ ਜੇਹੜਾ ਭੀ ਮਨੁੱਖ ਇਸ ਨਾਮ ਨੂੰ (ਜੋ ਗੁਣਾਂ ਦਾ) ਖ਼ਜ਼ਾਨਾ ਹੈ ਜਪਦਾ ਹੈ, ਸਾਰੀ ਉਮਰ ਉਸ ਦੀ ਉੱਚੀ ਆਤਮਕ ਅਵਸਥਾ ਬਣੀ ਰਹਿੰਦੀ ਹੈ। ਉਸ ਮਨੁੱਖ ਦੇ (ਸਾਧਾਰਨ) ਬਚਨ ਭੀ ਗੋਬਿੰਦ ਦੇ ਗੁਣ ਤੇ ਨਾਮ ਦੀ ਰੌ ਹੀ ਹੁੰਦੇ ਹਨ, ਸਿਮ੍ਰਿਤੀਆਂ ਸ਼ਾਸਤ੍ਰਾਂ ਤੇ ਵੇਦਾਂ ਨੇ ਭੀ ਇਹੀ ਗੱਲ ਆਖੀ ਹੈ। ਸਾਰੇ ਮਤਾਂ ਦਾ ਨਿਚੋੜ ਪ੍ਰਭੂ ਦਾ ਨਾਮ ਹੀ ਹੈ। ਇਸ ਨਾਮ ਦਾ ਨਿਵਾਸ ਪ੍ਰਭੂ ਦੇ ਭਗਤ ਦੇ ਮਨ ਵਿਚ ਹੁੰਦਾ ਹੈ। (ਜੋ ਮਨੁੱਖ ਨਾਮ ਜਪਦਾ ਹੈ ਉਸ ਦੇ) ਕ੍ਰੋੜਾਂ ਪਾਪ ਸਤਸੰਗ ਵਿਚ ਰਹਿ ਕੇ ਮਿਟ ਜਾਂਦੇ ਹਨ, ਗੁਰੂ ਦੀ ਕਿਰਪਾ ਨਾਲ ਉਹ ਮਨੁੱਖ ਜਮਾਂ ਤੋਂ ਬਚ ਜਾਂਦਾ ਹੈ। ਜਿਨ੍ਹਾਂ ਦੇ ਮੱਥੇ ਉਤੇ ਪ੍ਰਭੂ ਨੇ (ਨਾਮ ਦੀ) ਬਖ਼ਸ਼ਸ਼ ਦੇ ਲੇਖ ਲਿਖ ਧਰੇ ਹਨ, (ਪਰ) ਹੇ ਨਾਨਕ! ਉਹ ਮਨੁੱਖ ਗੁਰੂ ਦੀ ਸਰਣ ਆਉਂਦੇ ਹਨ ॥੭॥ ਜਿਸ ਮਨੁੱਖ ਦੇ ਮਨ ਵਿਚ (ਨਾਮ) ਵੱਸਦਾ ਹੈ ਜੋ ਪ੍ਰੀਤ ਲਾ ਕੇ (ਨਾਮ) ਸੁਣਦਾ ਹੈ, ਉਸ ਨੂੰ ਪ੍ਰਭੂ ਚੇਤੇ ਆਉਦਾ ਹੈ। ਉਸ ਮਨੁੱਖ ਦਾ ਜੰਮਣ ਮਰਨ ਦਾ ਕਸ਼ਟ ਕੱਟਿਆ ਜਾਂਦਾ ਹੈ, ਉਹ ਇਸ ਦੁਰਲੱਭ ਮਨੁੱਖਾ-ਸਰੀਰ ਨੂੰ ਉਸ ਵੇਲੇ (ਵਿਕਾਰਾਂ ਵਲੋਂ) ਬਚਾ ਲੈਂਦਾ ਹੈ। ਉਸ ਦੀ ਬੇ-ਦਾਗ਼ ਸੋਭਾ ਤੇ ਉਸ ਦੀ ਬਾਣੀ (ਨਾਮ-) ਅੰਮ੍ਰਿਤ ਨਾਲ ਭਰਪੂਰ ਹੁੰਦੀ ਹੈ, (ਕਿਉਂਕਿ) ਉਸ ਦੇ ਮਨ ਵਿਚ ਪ੍ਰਭੂ ਦਾ ਨਾਮ ਹੀ ਵੱਸਿਆ ਰਹਿੰਦਾ ਹੈ। ਦੁੱਖ, ਰੋਗ, ਡਰ ਤੇ ਵਹਮ ਉਸ ਦੇ ਨਾਸ ਹੋ ਜਾਂਦੇ ਹਨ। ਉਸ ਦਾ ਨਾਮ 'ਸਾਧ' ਪੈ ਜਾਂਦਾ ਹੈ ਤੇ ਉਸ ਦੇ ਕੰਮ (ਵਿਕਾਰਾਂ ਦੀ) ਮੈਲ ਤੋਂ ਸਾਫ਼ ਹੁੰਦੇ ਹਨ। ਸਭ ਤੋਂ ਉੱਚੀ ਸੋਭਾ ਉਸ ਨੂੰ ਮਿਲਦੀ ਹੈ। ਹੇ ਨਾਨਕ! ਇਸ ਗੁਣ ਦੇ ਕਾਰਣ (ਪ੍ਰਭੂ ਦਾ) ਨਾਮ ਸੁਖਾਂ ਦੀ ਮਣੀ ਹੈ (ਭਾਵ, ਸਰਬੋਤਮ ਸੁਖ ਹੈ) ॥੮॥੨੪॥`
      }
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

// ── Helper functions ──────────────────────────────────────────────────────────

export function getStotramById(id: string): Stotram | undefined {
  return STOTRAMS.find(s => s.id === id);
}

export function getStotramsByDeity(deity: string): Stotram[] {
  return STOTRAMS.filter(s => s.deity === deity || s.deity === 'universal');
}

export function getStotramsByTradition(tradition: string): Stotram[] {
  return STOTRAMS.filter(s => s.tradition === tradition || s.tradition === 'all');
}

export const DEITY_META: Record<string, { label: string; emoji: string; color: string }> = {
  ganesha:   { label: 'Ganesha',  emoji: '', color: '#e07b3a' },
  shiva:     { label: 'Shiva',    emoji: '', color: '#8b7de0' },
  vishnu:    { label: 'Vishnu',   emoji: '', color: '#3a8bcd' },
  devi:      { label: 'Devi',     emoji: '', color: '#c4789a' },
  hanuman:   { label: 'Hanuman',  emoji: '', color: '#d4643a' },
  surya:     { label: 'Surya',    emoji: '', color: '#f0a020' },
  universal: { label: 'Universal',emoji: '', color: '#8b9e6e' },
};

export const MOOD_META: Record<string, { label: string; emoji: string; desc: string }> = {
  morning:    { label: 'Morning Sadhana', emoji: '', desc: 'Dawn practice & Brahma Muhurta' },
  evening:    { label: 'Evening Aarti',   emoji: '', desc: 'Sandhya vandana & gratitude' },
  meditation: { label: 'Deep Meditation', emoji: '', desc: 'Stillness & inner journey' },
  festival:   { label: 'Festival',        emoji: '', desc: 'Celebration & sacred joy' },
  difficult:  { label: 'Difficult Times', emoji: '', desc: 'Strength, healing & protection' },
};
