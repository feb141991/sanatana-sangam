// ─── Stotrams data library ────────────────────────────────────────────────────
// Contains full verse text for stotrams with Sanskrit, transliteration & meaning.
// Audio is loaded separately via devotional-audio.ts / devotional_tracks DB table.

export interface StotramVerse {
  number: number;
  sanskrit: string;
  transliteration: string;
  meaning: string;
  startSecs?: number; // approximate audio start (for future sync)
  sync_metadata?: { start: number; end: number; word: string }[];
}

export interface Stotram {
  id: string;
  title: string;
  titleDevanagari: string;
  deity: string;
  deityEmoji: string;
  tradition: 'hindu' | 'sikh' | 'buddhist' | 'jain' | 'all';
  type: 'mantra' | 'stotram' | 'bhajan' | 'kirtan' | 'dhyana' | 'simran';
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
    deityEmoji: '',
    tradition: 'hindu',
    type: 'stotram',
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
      },
      {
        number: 2,
        sanskrit: 'नतेतरातिभीकरं नवोदितार्क भास्वरम्\nनमत्सुरारिनिर्जरं नताधिकापदुद्धरम्\nसुरेश्वरं निधीश्वरं गजेश्वरं गणेश्वरम्\nमहेश्वरं समाश्रये पराम्बरं भजाम्यहम्॥',
        transliteration: 'Natetarāti bhīkaraṃ navoditārka bhāsvaram\nNamatsurārinirjaraṃ natādhikāpadudddharam\nSureśvaraṃ nidhīśvaraṃ gajeśvaraṃ gaṇeśvaram\nMaheśvaraṃ samāśraye parāmbaraṃ bhajāmyaham',
        meaning: 'I take refuge in and worship Maheshvara (Ganesha), who is terrifying to those who do not bow to Him, who shines like the newly risen sun, before whom the enemies of the gods bow, who lifts those who bow from terrible difficulties, who is the lord of gods, lord of treasures, lord of elephants, and lord of the Ganas.',
        startSecs: 35,
      },
      {
        number: 3,
        sanskrit: 'समस्त लोक शंकरं निरस्त दैत्य कुञ्जरम्\nदरेतरोदरं वरं वरेभवक्त्रमक्षरम्\nकृपाकरं क्षमाकरं मुदाकरं यशस्करम्\nमनस्करं नमस्कृतां नमस्करोमि भास्वरम्॥',
        transliteration: 'Samasta loka śaṃkaraṃ nirasta daitya kuñjaram\nDaretarodaraṃ varaṃ varebhavaktramakṣaram\nKṛpākaraṃ kṣamākaraṃ mudākaraṃ yaśaskaram\nManaskaraṃ namaskṛtāṃ namaskaromi bhāsvaram',
        meaning: 'I bow to the radiant one who brings auspiciousness to all worlds, who demolished the elephant-demon, whose large belly is a blessing, whose face resembles a noble elephant, who is the imperishable, who is the source of compassion, forgiveness, joy, and fame — the one who grants boons to those who bow to Him with their minds.',
        startSecs: 70,
      },
      {
        number: 4,
        sanskrit: 'अकिञ्चनार्तिमार्जनं चिरन्तनोक्ति भाजनम्\nपुरारिपूर्व नन्दनं सुरारि गर्व चर्वणम्\nप्रपञ्च नाश भीषणं धनञ्जयादि भूषणम्\nकपोलदान वारणं भजे पुराणवारणम्॥',
        transliteration: 'Akiñcanārti mārjanaṃ cirantanokti bhājanam\nPurāripūrva nandanaṃ surāri garva carvaṇam\nPrapañca nāśa bhīṣaṇaṃ dhanañjayādi bhūṣaṇam\nKapoladāna vāraṇaṃ bhaje purāṇavāraṇam',
        meaning: 'I worship the ancient elephant (Ganesha), who removes the suffering of those who have nothing, who is the vessel of eternal declarations, the eldest son of the enemy of Tripura (Shiva), who devours the pride of the enemies of the gods, who is terrifying to the destruction of the universe, adorned with Dhananjaya (Arjuna\'s bow), and whose cheeks drip with ichor.',
        startSecs: 105,
      },
      {
        number: 5,
        sanskrit: 'नितान्तकान्त दन्तकान्तिमन्त कान्तिमत्\nकृतान्तदन्त पाशबन्ध चित्रदन्तधारिणम्\nरसान्त भूरिवन्तमन्तरान्त धन्तिरं\nसुमन्तमन्त भूतमेमं विनतमन्तरम् ॥',
        transliteration: 'Nitānta kānta dantakānti manta kāntimad\nKṛtānta danta pāśabandha citra dantadhāriṇam\nRasānta bhūrivantam antarānta dhantiraṃ\nSumantam anta bhūtamemaṃ vinatamantatam',
        meaning: 'I bow to this supreme being whose tusk shines with magnificent, pure radiance, who bears a wonderful tusk that has been fashioned like the noose of Yama (death), who is full of nectar within, whose inner self is deeply joyful, who is the essence of all wisdom, who encompasses all beings, and who is ultimately beyond all limit.',
        startSecs: 140,
      },
    ],
  },

  // ── Gayatri Mantra ─────────────────────────────────────────────────────────
  {
    id: 'gayatri-mantra',
    title: 'Gayatri Mantra',
    titleDevanagari: 'गायत्री मंत्र',
    deity: 'surya',
    deityEmoji: '',
    tradition: 'hindu',
    type: 'mantra',
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
    deityEmoji: '',
    tradition: 'hindu',
    type: 'mantra',
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
    deityEmoji: '',
    tradition: 'hindu',
    type: 'stotram',
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
      },
      {
        number: 2,
        sanskrit: 'मन्दाकिनीसलिलचन्दनचर्चिताय\nनन्दीश्वरप्रमथनाथमहेश्वराय ।\nमन्दारपुष्पबहुपुष्पसुपूजिताय\nतस्मै मकाराय नमः शिवाय ॥',
        transliteration: 'Mandākinī salila candana carcitāya\nnandīśvara pramatha nātha maheśvarāya\nmandāra puṣpa bahu puṣpa supūjitāya\ntasmai makārāya namaḥ śivāya',
        meaning: 'Salutations to Shiva, represented by the syllable "Ma" — who is anointed with the waters of the Mandakini (Ganges) and sandalwood paste, who is the great lord of Nandishvara and the Pramathas (attendants), and who is worshipped with mandara flowers and many other blooms.',
        startSecs: 40,
      },
      {
        number: 3,
        sanskrit: 'शिवाय गौरीवदनाब्जवृन्द\nसूर्याय दक्षाध्वरनाशकाय ।\nश्रीनीलकण्ठाय वृषध्वजाय\nतस्मै शिकाराय नमः शिवाय ॥',
        transliteration: 'Śivāya gaurī vadana abja vṛnda\nsūryāya dakṣādhvara nāśakāya\nśrī nīlakaṇṭhāya vṛṣadhvajāya\ntasmai śikārāya namaḥ śivāya',
        meaning: 'Salutations to Shiva, represented by the syllable "Śi" — who is the auspicious one, who is the sun to the lotus face of Gauri (Parvati), who destroyed the sacrifice of Daksha, who has a blue throat (Neelakantha), and whose flag bears the bull (Nandi).',
        startSecs: 80,
      },
      {
        number: 4,
        sanskrit: 'वसिष्ठकुम्भोद्भवगौतमार्य\nमुनीन्द्रदेवार्चितशेखराय ।\nचन्द्रार्कवैश्वानरलोचनाय\nतस्मै वकाराय नमः शिवाय ॥',
        transliteration: 'Vasiṣṭha kumbhodbhava gautama ārya\nmunīndra devārcita śekharāya\ncandrārka vaiśvānara locanāya\ntasmai vakārāya namaḥ śivāya',
        meaning: 'Salutations to Shiva, represented by the syllable "Va" — who is worshipped by the great sages Vasishtha, Agastya, and Gautama, and by the gods, whose crown is adorned by all, and whose three eyes are the moon, the sun, and fire.',
        startSecs: 120,
      },
      {
        number: 5,
        sanskrit: 'यक्षस्वरूपाय जटाधराय\nपिनाकहस्ताय सनातनाय ।\nदिव्याय देवाय दिगम्बराय\nतस्मै यकाराय नमः शिवाय ॥',
        transliteration: 'Yakṣa svarūpāya jaṭādharāya\npināka hastāya sanātanāya\ndivyāya devāya digambarāya\ntasmai yakārāya namaḥ śivāya',
        meaning: 'Salutations to Shiva, represented by the syllable "Ya" — who manifested as a Yaksha (spirit) before Brahma and Vishnu, who has matted locks of hair, who holds the Pinaka bow, who is the eternal Sanatana, who is divine, luminous, and clothed by the sky (directions).',
        startSecs: 160,
      },
    ],
  },

  // ── Guru Stotram ──────────────────────────────────────────────────────────
  {
    id: 'guru-stotram',
    title: 'Guru Stotram',
    titleDevanagari: 'गुरु स्तोत्रम्',
    deity: 'universal',
    deityEmoji: '',
    tradition: 'hindu',
    type: 'stotram',
    language: 'Sanskrit',
    source: 'Traditional — Guru Gita and Tantra scripture',
    description: 'A sacred hymn in praise of the Guru (spiritual teacher). Chanted to invoke the grace of one\'s teacher and to recognise the divine light that flows through the lineage of masters. Traditionally recited before any study or practice.',
    audioTrackId: 'guru-stotram',
    verses: [
      {
        number: 1,
        sanskrit: 'गुरुर्ब्रह्मा गुरुर्विष्णुः\nगुरुर्देवो महेश्वरः ।\nगुरुः साक्षात् परब्रह्म\nतस्मै श्री गुरवे नमः ॥',
        transliteration: 'Gururbrahmā gururviṣṇuḥ\ngururdevō maheśvaraḥ\nguruh sākṣāt parabrahma\ntasmai śrī gurave namaḥ',
        meaning: 'The Guru is Brahma (the creator), the Guru is Vishnu (the preserver), the Guru is Maheshvara (the destroyer). The Guru is verily the Supreme Brahman (the absolute) itself. Salutations to that revered Guru.',
        startSecs: 0,
      },
      {
        number: 2,
        sanskrit: 'अज्ञानतिमिरान्धस्य\nज्ञानाञ्जनशलाकया ।\nचक्षुरुन्मीलितं येन\nतस्मै श्री गुरवे नमः ॥',
        transliteration: 'Ajñānatimirāndhasya\njñānāñjana śalākayā\ncakṣurunmīlitaṃ yena\ntasmai śrī gurave namaḥ',
        meaning: 'Salutations to that revered Guru who opened the eyes of one who was blind in the darkness of ignorance, using the eye ointment (collyrium) of knowledge.',
        startSecs: 30,
      },
    ],
  },

  // ── Om Namah Shivaya ──────────────────────────────────────────────────────
  {
    id: 'om-namah-shivaya',
    title: 'Om Namah Shivaya',
    titleDevanagari: 'ॐ नमः शिवाय',
    deity: 'shiva',
    deityEmoji: '',
    tradition: 'hindu',
    type: 'mantra',
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
    deityEmoji: '',
    tradition: 'hindu',
    type: 'mantra',
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
    deityEmoji: '',
    tradition: 'hindu',
    type: 'mantra',
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
    deityEmoji: '',
    tradition: 'hindu',
    type: 'mantra',
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
    deityEmoji: '',
    tradition: 'hindu',
    type: 'mantra',
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
    deityEmoji: '',
    tradition: 'sikh',
    type: 'simran',
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
    deityEmoji: '',
    tradition: 'jain',
    type: 'mantra',
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
    deityEmoji: '',
    tradition: 'buddhist',
    type: 'mantra',
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
    language: 'Sanskrit',
    source: 'Composed by Sri Vallabhacharya (15th century)',
    description: 'An exquisitely sweet stotram describing the sweetness (madhura) of Lord Krishna. Every single aspect of the Lord of Sweetness is sweet.',
    verses: [
      {
        number: 1,
        sanskrit: 'अधरं मधुरं वदनं मधुरं\nनयनं मधुरं हसितं मधुरम् ।\nहृदयं मधुरं गमनं मधुरं\nमधुराधिपतेरखिलं मधुरम् ॥',
        transliteration: 'Adharaṃ madhuraṃ vadanaṃ madhuraṃ\nnayanaṃ madhuraṃ hasitaṃ madhuraṃ\nhṛdayaṃ madhuraṃ gamanaṃ madhuraṃ\nmadhurādhipater akhilaṃ madhuraṃ',
        meaning: 'His lips are sweet, His face is sweet, His eyes are sweet, His smile is sweet. His heart is sweet, His gait is sweet — everything is sweet about the Lord of Sweetness.',
        startSecs: 0,
        sync_metadata: [
          { start: 0, end: 1200, word: 'अधरं' },
          { start: 1200, end: 2400, word: 'मधुरं' },
          { start: 2400, end: 3600, word: 'वदनं' },
          { start: 3600, end: 4800, word: 'मधुरं' },
          { start: 4800, end: 6000, word: 'नयनं' },
          { start: 6000, end: 7200, word: 'मधुरं' },
          { start: 7200, end: 8400, word: 'हसितं' },
          { start: 8400, end: 9600, word: 'मधुरम्' },
          { start: 9600, end: 10000, word: '।' },
          { start: 10000, end: 11200, word: 'हृदयं' },
          { start: 11200, end: 12400, word: 'मधुरं' },
          { start: 12400, end: 13600, word: 'गमनं' },
          { start: 13600, end: 14800, word: 'मधुरं' },
          { start: 14800, end: 16500, word: 'मधुराधिपतेरखिलं' },
          { start: 16500, end: 18000, word: 'मधुरम्' },
          { start: 18000, end: 19000, word: '।।' }
        ]
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
    language: 'Sanskrit',
    source: 'Composed by Adi Shankaracharya (8th century CE)',
    description: 'Six verses representing the absolute essence of Advaita Vedanta philosophy, composed by Adi Shankaracharya to declare the nature of the true Self as pure consciousness and bliss.',
    verses: [
      {
        number: 1,
        sanskrit: 'मनोबुद्ध्यहङ्कारचित्तानि नाहं\nन च श्रोत्रजिह्वे न च घ्राणनेत्रे ।\nन च व्योम भूमिर्न तेजो न वायुः\nचिदानन्दरूपः शिवोऽहं शिवोऽहम् ॥',
        transliteration: 'Manobuddhyahaṅkāra cittāni nāhaṃ\nna ca śrotrajihve na ca ghrāṇanetre\nna ca vyoma bhūmirna tejo na vāyuḥ\ncidānandarūpaḥ śivo\'haṃ śivo\'ham',
        meaning: 'I am not the mind, nor the intellect, nor the ego, nor the memory. I am not the ears, nor the tongue, nor the nose, nor the eyes. I am not the sky, nor the earth, nor the fire, nor the air. I am of the form of consciousness and bliss — I am Shiva, I am Shiva.',
        startSecs: 0
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
    language: 'Sanskrit',
    source: 'Composed by Adi Shankaracharya',
    description: 'An eight-verse hymn praising the infinite glory of the Shiva Lingam, expressing surrender, worship, and the purification of karmas.',
    verses: [
      {
        number: 1,
        sanskrit: 'ब्रह्ममुरारिसुरार्चितलिङ्गं\nनिर्मलभासितशोभितलिङ्गम् ।\nजन्मजदुःखविनाशकलिङ्गं\nतत्प्रणमामि सदाशिवलिङ्गम् ॥',
        transliteration: 'Brahmamurāri surārcita liṅgaṃ\nnirmalabhāsita śobhita liṅgam\njanmajaduḥkha vināśakaliṅgaṃ\ntat praṇamāmi sadāśivaliṅgam',
        meaning: 'I bow to that Sadashiva Lingam, which is worshipped by Brahma, Vishnu, and all the gods, which is pure, brilliant, and beautiful, and which destroys the sorrows of rebirth.',
        startSecs: 0
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
    language: 'Sanskrit',
    source: 'Shiva Purana',
    description: 'A beautiful prayer detailing the spiritual merits of offering Bilva leaves to Lord Shiva during worship.',
    verses: [
      {
        number: 1,
        sanskrit: 'त्रिदलं त्रिगुणाकारं त्रिनेत्रं च त्रियायुधम् ।\nत्रिजन्मपापसंहारं एकबिल्वं शिवार्पणम् ॥',
        transliteration: 'Tridalaṃ triguṇākāraṃ trinetraṃ ca triyāyudham\ntrijanma pāpa saṃhāraṃ eka bilvaṃ śivārpaṇam',
        meaning: 'I offer to Lord Shiva a single Bilva leaf, which has three leaflets, represents the three gunas, is like His three eyes and three weapons, and destroys the sins committed in three lifetimes.',
        startSecs: 0
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
    language: 'Hindi',
    source: 'Traditional Devotional Stuti',
    description: 'Forty verses of prayer dedicated to Mother Durga, chanted to seek her divine protection, strength, and grace.',
    verses: [
      {
        number: 1,
        sanskrit: 'नमो नमो दुर्गे सुख करनी ।\nनमो नमो अम्बे दुःख हरनी ॥\nनिरंकार है ज्योति तुम्हारी ।\nतिहूँ लोक फैली उजियारी ॥',
        transliteration: 'Namo namo durge sukha karanī\nnamo namo ambe duḥkha haranī\nniraṅkāra hai jyoti tumhārī\ntihūṅ loka phailī ujiyārī',
        meaning: 'Salutations to Mother Durga, the dispenser of happiness. Salutations to Mother Amba, who removes all sorrows. Your light is formless and supreme, and its brilliance is spread across all three worlds.',
        startSecs: 0
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
    language: 'Awadhi / Hindi',
    source: 'Composed by Goswami Tulsidas',
    description: 'The most beloved forty-verse prayer dedicated to Lord Hanuman, sung worldwide for courage, health, protection, and devotion.',
    verses: [
      {
        number: 1,
        sanskrit: 'श्रीगुरु चरन सरोज रज निज मनु मुकुरु सुधारि ।\nबरनऊँ रघुबर बिमल जसु जो दायकु फल चारि ॥\nबुद्धिहीन तनु जानिके सुमिरौ पवन-कुमार ।\nबल बुधि बिद्या देहु मोहि हरहु कलेस बिकार ॥',
        transliteration: 'Śrīguru carana saroja raja nija manu mukuru sudhāri\nbaranaūṅ raghubara bimala jasu jo dāyaku phala cāri\nbuddhihīna tanu jānike sumirau pavana-kumāra\nbala budhi bidyā dehu mohi harahu kalesa bkāra',
        meaning: 'Cleansing the mirror of my mind with the dust of my Guru\'s lotus feet, I sing the pure glory of Sri Ram, which bestows the four fruits of life. Knowing myself to be ignorant, I meditate on Hanuman, the son of the wind. Grant me strength, wisdom, and knowledge, and remove all my sufferings and impurities.',
        startSecs: 0
      }
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
    language: 'Hindi',
    source: 'Composed by Goswami Tulsidas',
    description: 'Eight verses praising the child deeds and infinite power of Hanuman, sung to remove any crisis or sorrow.',
    verses: [
      {
        number: 1,
        sanskrit: 'बाल समय रवि भक्षि लियो तब तीनहुँ लोक भयो अँधियारो ।\nताहि सो त्रास भयो जग को यह संकट काहु सो जात न टारो ॥',
        transliteration: 'Bāla samaya ravi bhakṣi liyo taba tīnahuṅ loka bhayo aṅdhiyāro\ntāhi so trāsa bhayo jaga ko yaha saṅkata kāhu so jāta na ṭāro',
        meaning: 'During your childhood, you swallowed the sun, plunging all three worlds into darkness. The universe was terrified, and this crisis could not be averted by anyone else but you, O Hanuman.',
        startSecs: 0
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
    language: 'Sanskrit',
    source: 'Composed by Adi Shankaracharya',
    description: 'A beautiful eight-verse devotional song listing the sacred names and sweet forms of Lord Krishna and Ramachandra.',
    verses: [
      {
        number: 1,
        sanskrit: 'अच्युतं केशवं रामनारायणं\nकृष्णदामोदरं वासुदेवं हरिम् ।\nश्रीधरं माधवं गोपिकावल्लभं\nजानकीनायकं रामचन्द्रं भजे ॥',
        transliteration: 'Acyutaṃ keśavaṃ rāmanārāyaṇaṃ\nkṛṣṇadāmodaraṃ vāsudevaṃ harim\nśrīdharaṃ mādhavaṃ gopikāvallabhaṃ\njānakīnāyakaṃ rāmacandraṃ bhaje',
        meaning: 'I worship Achyuta, Keshava, Rama-Narayana, Krishna-Damodara, Vasudeva, Hari, Shridhara, Madhava, the beloved of the Gopis, the husband of Janaki, Ramachandra.',
        startSecs: 0
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
    language: 'Sanskrit',
    source: 'Composed by Adi Shankaracharya',
    description: 'A wake-up call to the soul, encouraging surrender and memory of the divine rather than wasting life on dry intellect and material acquisitions.',
    verses: [
      {
        number: 1,
        sanskrit: 'भज गोविन्दं भज गोविन्दं\nगोविन्दं भज मूढमते ।\nसम्प्राप्ते सन्निहिते काले\nनहि नहि रक्षति डुकृञ्करणे ॥',
        transliteration: 'Bhaja govindaṃ bhaja govindaṃ\ngovindaṃ bhaja mūḍhamate\nsamprāpte sannihite kāle\nnahi nahi rakṣati ḍukṛñkaraṇe',
        meaning: 'Worship Govinda, worship Govinda, worship Govinda, O foolish mind! When the appointed time of death arrives, your rules of grammar and worldly knowledge will not save you.',
        startSecs: 0
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
    language: 'Sanskrit',
    source: 'Ramayana — Yuddha Kanda',
    description: 'A powerful solar stotram imparted by Sage Agastya to Lord Rama on the battlefield, enabling the victory over Ravana.',
    verses: [
      {
        number: 1,
        sanskrit: 'ततो युद्धपरिश्रान्तं समरे चिन्तया स्थितम् ।\nरावणञ्चाग्रतो दृष्ट्वा युद्धाय समुपस्थितम् ॥',
        transliteration: 'Tato yuddhapariśrāntaṃ samare cintayā sthitam\nrāvaṇañcāgrato dṛṣṭvā yuddhāya samupasthitam',
        meaning: 'Seeing Lord Rama exhausted from battle and standing in deep thought in the middle of the war, as Ravana stood before Him ready for battle, Sage Agastya approached Rama to impart the sun stotram.',
        startSecs: 0
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
