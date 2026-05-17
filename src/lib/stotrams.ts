// ─── Stotrams data library ────────────────────────────────────────────────────
// Contains full verse text for stotrams with Sanskrit, transliteration & meaning.
// Audio is loaded separately via devotional-audio.ts / devotional_tracks DB table.

export interface StotramVerse {
  number: number;
  sanskrit: string;
  transliteration: string;
  meaning: string;
  startSecs?: number; // approximate audio start (for future sync)
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
