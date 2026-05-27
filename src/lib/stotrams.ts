// ─── Stotrams data library ────────────────────────────────────────────────────
// Contains full verse text for stotrams with Sanskrit, transliteration & meaning.
// Audio is loaded separately via devotional-audio.ts / devotional_tracks DB table.

export interface StotramVerse {
  number: number;
  sanskrit: string;
  transliteration: string;
  meaning: string;
  meaning_hi?: string;
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
      },
      {
        number: 2,
        sanskrit: 'वचनं मधुरं चरितं मधुरं\nवसनं मधुरं वलितं मधुरम् ।\nचलितं मधुरं भ्रमितं मधुरं\nमधुराधिपतेरखिलं मधुरम् ॥',
        transliteration: 'Vacanaṃ madhuraṃ caritaṃ madhuraṃ\nvasanaṃ madhuraṃ valitaṃ madhuram\ncalitaṃ madhuraṃ bhramitaṃ madhuraṃ\nmadhurādhipaterakhilaṃ madhuram',
        meaning: 'His speech is sweet, His deeds are sweet, His garments are sweet, and His graceful bearing is sweet. His movements and wanderings are sweet; everything about the Lord of Sweetness is sweet.',
      },
      {
        number: 3,
        sanskrit: 'वेणुर्मधुरो रेणुर्मधुरः\nपाणिर्मधुरः पादौ मधुरौ ।\nनृत्यं मधुरं सख्यं मधुरं\nमधुराधिपतेरखिलं मधुरम् ॥',
        transliteration: 'Veṇurmadhuro reṇurmadhuraḥ\npāṇirmadhuraḥ pādau madhurau\nnṛtyaṃ madhuraṃ sakhyaṃ madhuraṃ\nmadhurādhipaterakhilaṃ madhuram',
        meaning: 'His flute is sweet, the dust around Him is sweet, His hands are sweet, and His feet are sweet. His dance and friendship are sweet; everything about the Lord of Sweetness is sweet.',
      },
      {
        number: 4,
        sanskrit: 'गीतं मधुरं पीतं मधुरं\nभुक्तं मधुरं सुप्तं मधुरम् ।\nरूपं मधुरं तिलकं मधुरं\nमधुराधिपतेरखिलं मधुरम् ॥',
        transliteration: 'Gītaṃ madhuraṃ pītaṃ madhuraṃ\nbhuktaṃ madhuraṃ suptaṃ madhuram\nrūpaṃ madhuraṃ tilakaṃ madhuraṃ\nmadhurādhipaterakhilaṃ madhuram',
        meaning: 'His song is sweet, what He drinks is sweet, what He eats is sweet, and even His sleep is sweet. His form and the tilaka upon Him are sweet; everything about the Lord of Sweetness is sweet.',
      },
      {
        number: 5,
        sanskrit: 'करणं मधुरं तरणं मधुरं\nहरणं मधुरं रमणं मधुरम् ।\nवमितं मधुरं शमितं मधुरं\nमधुराधिपतेरखिलं मधुरम् ॥',
        transliteration: 'Karaṇaṃ madhuraṃ taraṇaṃ madhuraṃ\nharaṇaṃ madhuraṃ ramaṇaṃ madhuram\nvamitaṃ madhuraṃ śamitaṃ madhuraṃ\nmadhurādhipaterakhilaṃ madhuram',
        meaning: 'His acts are sweet, His deliverance is sweet, His stealing is sweet, and His loving play is sweet. What He offers and what He quiets are sweet; everything about the Lord of Sweetness is sweet.',
      },
      {
        number: 6,
        sanskrit: 'गुञ्जा मधुरा माला मधुरा\nयमुना मधुरा वीची मधुरा ।\nसलिलं मधुरं कमलं मधुरं\nमधुराधिपतेरखिलं मधुरम् ॥',
        transliteration: 'Guñjā madhurā mālā madhurā\nyamunā madhurā vīcī madhurā\nsalilaṃ madhuraṃ kamalaṃ madhuraṃ\nmadhurādhipaterakhilaṃ madhuram',
        meaning: 'His guñjā necklace is sweet, His garland is sweet, the Yamunā is sweet, and her waves are sweet. Her waters and lotuses are sweet; everything about the Lord of Sweetness is sweet.',
      },
      {
        number: 7,
        sanskrit: 'गोपी मधुरा लीला मधुरा\nयुक्तं मधुरं मुक्तं मधुरम् ।\nदृष्टं मधुरं शिष्टं मधुरं\nमधुराधिपतेरखिलं मधुरम् ॥',
        transliteration: 'Gopī madhurā līlā madhurā\nyuktaṃ madhuraṃ muktaṃ madhuram\ndṛṣṭaṃ madhuraṃ śiṣṭaṃ madhuraṃ\nmadhurādhipaterakhilaṃ madhuram',
        meaning: 'His gopīs are sweet, His līlā is sweet, His union is sweet, and His liberation is sweet. His glance and His refined conduct are sweet; everything about the Lord of Sweetness is sweet.',
      },
      {
        number: 8,
        sanskrit: 'गोपा मधुरा गावो मधुरा\nयष्टिर्मधुरा सृष्टिर्मधुरा ।\nदलितं मधुरं फलितं मधुरं\nमधुराधिपतेरखिलं मधुरम् ॥',
        transliteration: 'Gopā madhurā gāvo madhurā\nyaṣṭirmadhurā sṛṣṭirmadhurā\ndalitaṃ madhuraṃ phalitaṃ madhuraṃ\nmadhurādhipaterakhilaṃ madhuram',
        meaning: 'His cowherd friends are sweet, His cows are sweet, His herding staff is sweet, and His creation is sweet. What He breaks and what He brings to fruition are sweet; everything about the Lord of Sweetness is sweet.',
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
        startSecs: 0
      },
      {
        number: 2,
        sanskrit: 'देवमुनिप्रवरार्चितलिङ्गं\nकामदहनकरुणाकरलिङ्गम् ।\nरावणदर्पविनाशनलिङ्गं\nतत्प्रणमामि सदाशिवलिङ्गम् ॥',
        transliteration: 'Devamunipravarārcitaliṅgaṃ\nkāmadahanakaruṇākaraliṅgam\nrāvaṇadarpavināśanaliṅgaṃ\ntatpraṇamāmi sadāśivaliṅgam',
        meaning: 'I bow to that Sadāśiva Liṅga, adored by the foremost gods and sages, source of compassion, destroyer of desire, and crusher of Rāvaṇa’s pride.',
      },
      {
        number: 3,
        sanskrit: 'सर्वसुगन्धसुलेपितलिङ्गं\nबुद्धिविवर्धनकारणलिङ्गम् ।\nसिद्धसुरासुरवन्दितलिङ्गं\nतत्प्रणमामि सदाशिवलिङ्गम् ॥',
        transliteration: 'Sarvasugandhasulepitaliṅgaṃ\nbuddhivivardhanakāraṇaliṅgam\nsiddhasurāsuravanditaliṅgaṃ\ntatpraṇamāmi sadāśivaliṅgam',
        meaning: 'I bow to that Sadāśiva Liṅga, anointed with every fragrance, cause of the growth of wisdom, and revered by siddhas, devas, and asuras alike.',
      },
      {
        number: 4,
        sanskrit: 'कनकमहामणिभूषितलिङ्गं\nफणिपतिवेष्टितशोभितलिङ्गम् ।\nदक्षसुयज्ञविनाशनलिङ्गं\nतत्प्रणमामि सदाशिवलिङ्गम् ॥',
        transliteration: 'Kanakamahāmaṇibhūṣitaliṅgaṃ\nphaṇipativeṣṭitaśobhitaliṅgam\ndakṣasuyajñavināśanaliṅgaṃ\ntatpraṇamāmi sadāśivaliṅgam',
        meaning: 'I bow to that Sadāśiva Liṅga, adorned with gold and great jewels, beautified by the encircling serpent, and destroyer of Dakṣa’s arrogant sacrifice.',
      },
      {
        number: 5,
        sanskrit: 'कुङ्कुमचन्दनलेपितलिङ्गं\nपङ्कजहारसुशोभितलिङ्गम् ।\nसञ्चितपापविनाशनलिङ्गं\nतत्प्रणमामि सदाशिवलिङ्गम् ॥',
        transliteration: 'Kuṅkumacandanalepitaliṅgaṃ\npaṅkajahārasuśobhitaliṅgam\nsañcitapāpavināśanaliṅgaṃ\ntatpraṇamāmi sadāśivaliṅgam',
        meaning: 'I bow to that Sadāśiva Liṅga, adorned with sandal and saffron, graced by lotus garlands, and capable of destroying the heap of accumulated karmic sin.',
      },
      {
        number: 6,
        sanskrit: 'देवगणार्चितसेवितलिङ्गं\nभावैर्भक्तिभिरेव च लिङ्गम् ।\nदिनकरकोटिप्रभाकरलिङ्गं\nतत्प्रणमामि सदाशिवलिङ्गम् ॥',
        transliteration: 'Devagaṇārcitasevitaliṅgaṃ\nbhāvairbhaktibhireva ca liṅgam\ndinakarakoṭiprabhākaraliṅgaṃ\ntatpraṇamāmi sadāśivaliṅgam',
        meaning: 'I bow to that Sadāśiva Liṅga, worshipped and served by divine hosts, reached by feeling and devotion, and shining with the brilliance of millions of suns.',
      },
      {
        number: 7,
        sanskrit: 'अष्टदलोपरिवेष्टितलिङ्गं\nसर्वसमुद्भवकारणलिङ्गम् ।\nअष्टदरिद्रविनाशनलिङ्गं\nतत्प्रणमामि सदाशिवलिङ्गम् ॥',
        transliteration: 'Aṣṭadalopariveṣṭitaliṅgaṃ\nsarvasamudbhavakāraṇaliṅgam\naṣṭadaridravināśanaliṅgaṃ\ntatpraṇamāmi sadāśivaliṅgam',
        meaning: 'I bow to that Sadāśiva Liṅga, encircled by the eight petals, cause of all manifestation, and destroyer of the eight forms of poverty in life and spirit.',
      },
      {
        number: 8,
        sanskrit: 'सुरगुरुसुरवरपूजितलिङ्गं\nसुरवनपुष्पसदार्चितलिङ्गम् ।\nपरात्परं परमात्मकलिङ्गं\nतत्प्रणमामि सदाशिवलिङ्गम् ॥',
        transliteration: 'Suragurusuravarapūjitāliṅgaṃ\nsuravanapuṣpasadārcitaliṅgam\nparātparaṃ paramātmakaliṅgaṃ\ntatpraṇamāmi sadāśivaliṅgam',
        meaning: 'I bow to that Sadāśiva Liṅga, worshipped by the teacher of the gods and the best among the gods, ever adored with flowers of the celestial groves, and established as the supreme Self beyond all beyond.',
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
        startSecs: 0
      },
      {
        number: 2,
        sanskrit: 'त्रिशाखैर्बिल्वपत्रैश्च ह्यच्छिद्रैः कोमलैः शुभैः ।\nशिवपूजां करिष्यामि एकबिल्वं शिवार्पणम् ॥',
        transliteration: 'Triśākhairbilvapatraiśca hyacchidraiḥ komalaiḥ śubhaiḥ\nśivapūjāṃ kariṣyāmi ekabilvaṃ śivārpaṇam',
        meaning: 'I worship Shiva with bilva leaves that are whole, tender, auspicious, and perfectly formed in their threefold cluster. This single bilva offering is placed at Shiva’s feet.',
      },
      {
        number: 3,
        sanskrit: 'अखण्डबिल्वपत्रेण पूजिते नन्दिकेश्वरे ।\nशुद्ध्यन्ति सर्वपापेभ्यः एकबिल्वं शिवार्पणम् ॥',
        transliteration: 'Akhaṇḍabilvapatreṇa pūjite nandikeśvare\nśuddhyanti sarvapāpebhyaḥ ekabilvaṃ śivārpaṇam',
        meaning: 'When Nandikeśvara, Lord Shiva, is worshipped with an unbroken bilva leaf, one is purified from all sins. Such a simple offering is treated as an act of deep sanctification.',
      },
      {
        number: 4,
        sanskrit: 'शालिग्रामशिलामेकां विप्राणां जातु चार्पयेत् ।\nसोमयज्ञमहापुण्यं एकबिल्वं शिवार्पणम् ॥',
        transliteration: 'Śāligrāmaśilāmekāṃ viprāṇāṃ jātu cārpayet\nsomayajñamahāpuṇyaṃ ekabilvaṃ śivārpaṇam',
        meaning: 'To offer a single bilva leaf to Shiva is praised as yielding merit equal to gifting a sacred śāligrāma to a worthy knower. The hymn treats the leaf-offering as comparable to a great Vedic sacrifice.',
      },
      {
        number: 5,
        sanskrit: 'दन्तिकोटिसहस्राणि वाजपेयशतानि च ।\nकोटिकन्यामहादानं एकबिल्वं शिवार्पणम् ॥',
        transliteration: 'Dantikoṭisahasrāṇi vājapeyaśatāni ca\nkoṭikanyāmahādānaṃ ekabilvaṃ śivārpaṇam',
        meaning: 'The merit of gifting countless elephants, performing hundreds of grand sacrifices, or making vast acts of charity is said to stand beside the offering of one bilva leaf to Shiva. The verse elevates devotion over display.',
      },
      {
        number: 6,
        sanskrit: 'लक्ष्म्याः स्तनुत उत्पन्नं महादेवस्य च प्रियम् ।\nबिल्ववृक्षं प्रयच्छामि एकबिल्वं शिवार्पणम् ॥',
        transliteration: 'Lakṣmyāḥ stanuta utpannaṃ mahādevasya ca priyam\nbilvavṛkṣaṃ prayacchāmi ekabilvaṃ śivārpaṇam',
        meaning: 'Born of Lakshmi’s own body and beloved of Mahādeva, the bilva tree is itself sacred. In offering its leaf, the devotee offers something already cherished by Shiva.',
      },
      {
        number: 7,
        sanskrit: 'दर्शनं बिल्ववृक्षस्य स्पर्शनं पापनाशनम् ।\nअघोरपापसंहारं एकबिल्वं शिवार्पणम् ॥',
        transliteration: 'Darśanaṃ bilvavṛkṣasya sparśanaṃ pāpanāśanam\naghorapāpasaṃhāraṃ ekabilvaṃ śivārpaṇam',
        meaning: 'Even seeing or touching the bilva tree is said to destroy sin. The hymn honors the tree itself as a purifier and the leaf as a sacred extension of that grace.',
      },
      {
        number: 8,
        sanskrit: 'काशीक्षेत्रनिवासं च कालभैरवदर्शनम् ।\nप्रयागमाधवं दृष्ट्वा एकबिल्वं शिवार्पणम् ॥',
        transliteration: 'Kāśīkṣetranivāsaṃ ca kālabhairavadarśanam\nprayāgamādhavaṃ dṛṣṭvā ekabilvaṃ śivārpaṇam',
        meaning: 'Residence in Kāśī, vision of Kālabhairava, and darśana of Mādhava at Prayāga are all counted as holy attainments. The hymn places one bilva offering within that same sacred current of pilgrimage and grace.',
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
        startSecs: 0
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
        startSecs: 0
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
        startSecs: 0
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
        startSecs: 0
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
        startSecs: 0
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
        startSecs: 0
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
        startSecs: 0
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
        startSecs: 0
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
        startSecs: 0
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
        startSecs: 0
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
        startSecs: 0
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
        startSecs: 0
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
        startSecs: 0
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
        startSecs: 0
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
        startSecs: 0
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
        startSecs: 0
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
        startSecs: 0
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
        startSecs: 0
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
        startSecs: 0
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
        startSecs: 0
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
        startSecs: 0
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
        startSecs: 0
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
        startSecs: 0
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
