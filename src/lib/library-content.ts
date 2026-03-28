// ─── Parampara Library — Sanatan Scripture Content ────────────────────────────
// Covers Hindu, Sikh, Buddhist, Jain traditions
// Each entry: id, title, source, original, transliteration, meaning, tradition, category

export type LibraryTradition = 'hindu' | 'sikh' | 'buddhist' | 'jain';

export type LibraryCategory =
  | 'gita' | 'ramayana' | 'upanishad' | 'stotra' | 'mantra' | 'veda'
  | 'bhagavatam' | 'ramcharitmanas' | 'vishnu_sahasranama'
  | 'shiva_purana' | 'shakta'
  | 'yoga_sutra' | 'chanakya'
  | 'gurbani' | 'nitnem'
  | 'dhammapada' | 'sutra'
  | 'jain_scripture';

export interface LibraryEntry {
  id:               string;
  title:            string;
  source:           string;
  original:         string;
  transliteration:  string;
  meaning:          string;
  tradition:        LibraryTradition;
  category:         LibraryCategory;
  tags:             string[];
}

// ─── BHAGAVAD GITA ────────────────────────────────────────────────────────────
export const GITA_ENTRIES: LibraryEntry[] = [
  {
    id: 'gita-2-47',
    title: 'The Supreme Secret of Action',
    source: 'Bhagavad Gita 2.47',
    original: 'कर्मण्येवाधिकारस्ते मा फलेषु कदाचन ।\nमा कर्मफलहेतुर्भूर्मा ते सङ्गोऽस्त्वकर्मणि ॥',
    transliteration: 'karmaṇy evādhikāras te mā phaleṣu kadācana\nmā karma-phala-hetur bhūr mā te saṅgo \'stv akarmaṇi',
    meaning: 'You have a right to perform your prescribed duties, but you are not entitled to the fruits of your actions. Never consider yourself the cause of the results of your activities, and never be attached to not doing your duty.',
    tradition: 'hindu', category: 'gita',
    tags: ['karma', 'duty', 'detachment', 'action', 'krishna'],
  },
  {
    id: 'gita-4-7',
    title: 'The Promise of the Divine',
    source: 'Bhagavad Gita 4.7–4.8',
    original: 'यदा यदा हि धर्मस्य ग्लानिर्भवति भारत ।\nअभ्युत्थानमधर्मस्य तदात्मानं सृजाम्यहम् ॥\nपरित्राणाय साधूनां विनाशाय च दुष्कृताम् ।\nधर्मसंस्थापनार्थाय सम्भवामि युगे युगे ॥',
    transliteration: 'yadā yadā hi dharmasya glānir bhavati bhārata\nabhyutthānam adharmasya tadātmānaṁ sṛjāmy aham\nparitrāṇāya sādhūnāṁ vināśāya ca duṣkṛtām\ndharma-saṁsthāpanārthāya sambhavāmi yuge yuge',
    meaning: 'Whenever and wherever there is a decline in religious practice and a predominant rise of irreligion, at that time I descend Myself. To deliver the pious and to annihilate the miscreants, as well as to reestablish the principles of religion, I Myself appear, millennium after millennium.',
    tradition: 'hindu', category: 'gita',
    tags: ['avatar', 'dharma', 'krishna', 'divine'],
  },
  {
    id: 'gita-9-22',
    title: 'The Yoga of Devotion',
    source: 'Bhagavad Gita 9.22',
    original: 'अनन्याश्चिन्तयन्तो मां ये जनाः पर्युपासते ।\nतेषां नित्याभियुक्तानां योगक्षेमं वहाम्यहम् ॥',
    transliteration: 'ananyāś cintayanto māṁ ye janāḥ paryupāsate\nteṣāṁ nityābhiyuktānāṁ yoga-kṣemaṁ vahāmy aham',
    meaning: 'For those who worship Me with devotion, meditating on My transcendental form, I carry what they lack and preserve what they have.',
    tradition: 'hindu', category: 'gita',
    tags: ['bhakti', 'devotion', 'krishna', 'protection'],
  },
  {
    id: 'gita-18-66',
    title: 'The Final Teaching',
    source: 'Bhagavad Gita 18.66',
    original: 'सर्वधर्मान्परित्यज्य मामेकं शरणं व्रज ।\nअहं त्वा सर्वपापेभ्यो मोक्षयिष्यामि मा शुचः ॥',
    transliteration: 'sarva-dharmān parityajya mām ekaṁ śaraṇaṁ vraja\nahaṁ tvāṁ sarva-pāpebhyo mokṣayiṣyāmi mā śucaḥ',
    meaning: 'Abandon all varieties of dharma and simply surrender unto Me alone. I shall deliver you from all sinful reactions; do not fear.',
    tradition: 'hindu', category: 'gita',
    tags: ['surrender', 'moksha', 'krishna', 'liberation'],
  },
  {
    id: 'gita-2-20',
    title: 'Immortality of the Soul',
    source: 'Bhagavad Gita 2.20',
    original: 'न जायते म्रियते वा कदाचिन् नायं भूत्वा भविता वा न भूयः ।\nअजो नित्यः शाश्वतोऽयं पुराणो न हन्यते हन्यमाने शरीरे ॥',
    transliteration: 'na jāyate mriyate vā kadācin nāyaṁ bhūtvā bhavitā vā na bhūyaḥ\najo nityaḥ śāśvato \'yaṁ purāṇo na hanyate hanyamāne śarīre',
    meaning: 'The soul is never born nor dies at any time. It has not come into being, does not come into being, and will not come into being. It is unborn, eternal, ever-existing, and primeval. It is not slain when the body is slain.',
    tradition: 'hindu', category: 'gita',
    tags: ['atman', 'soul', 'immortality', 'death', 'krishna'],
  },
  {
    id: 'gita-6-5',
    title: 'Be Your Own Best Friend',
    source: 'Bhagavad Gita 6.5',
    original: 'उद्धरेदात्मनात्मानं नात्मानमवसादयेत् ।\nआत्मैव ह्यात्मनो बन्धुरात्मैव रिपुरात्मनः ॥',
    transliteration: 'uddhared ātmanātmānaṁ nātmānam avasādayet\nātmaiva hy ātmano bandhur ātmaiva ripur ātmanaḥ',
    meaning: 'One must elevate oneself by one\'s own mind, not degrade oneself. The mind is the friend of the conditioned soul, and its enemy as well.',
    tradition: 'hindu', category: 'gita',
    tags: ['mind', 'self-improvement', 'discipline', 'yoga'],
  },
];

// ─── RAMAYANA ─────────────────────────────────────────────────────────────────
export const RAMAYANA_ENTRIES: LibraryEntry[] = [
  {
    id: 'ram-bal-1',
    title: 'The Opening of the Ramayana',
    source: 'Valmiki Ramayana — Bal Kanda 1.1',
    original: 'तपः स्वाध्यायनिरतं तपस्वी वाग्विदां वरम् ।\nनारदं परिपप्रच्छ वाल्मीकिर्मुनिपुंगवम् ॥',
    transliteration: 'tapaḥ svādhyāyanirataṁ tapasvi vāgvidāṁ varam\nnāradaṁ paripapraccha vālmīkir munipuṅgavam',
    meaning: 'Valmiki, the best among sages, who was intent on austerity and self-study, asked the great sage Narada, who was devoted to penance and was the best among the learned.',
    tradition: 'hindu', category: 'ramayana',
    tags: ['valmiki', 'narada', 'ramayana', 'opening'],
  },
  {
    id: 'ram-sundara-1',
    title: 'Hanuman Crosses the Ocean',
    source: 'Valmiki Ramayana — Sundara Kanda 1.1',
    original: 'ततो रावणनीतायाः सीतायाः शत्रुकर्शनः ।\nइयेष पदमन्वेष्टुं चारणाचरिते पथि ॥',
    transliteration: 'tato rāvaṇanītāyāḥ sītāyāḥ śatrukarśanaḥ\niyeṣa padam anveṣṭuṁ cāraṇācarite pathi',
    meaning: 'Then Hanuman, the destroyer of enemies, desired to follow the path frequented by the celestial Charanas, in order to search for Sita who had been carried away by Ravana.',
    tradition: 'hindu', category: 'ramayana',
    tags: ['hanuman', 'sita', 'ravana', 'sundara-kanda'],
  },
  {
    id: 'ram-yuddha-1',
    title: 'Vibhishana Surrenders to Rama',
    source: 'Valmiki Ramayana — Yuddha Kanda 18.3',
    original: 'रामो विग्रहवान् धर्मः साधुः सत्यपराक्रमः ।\nराजा सर्वस्य लोकस्य देवानामपि वासवः ॥',
    transliteration: 'rāmo vigrahavān dharmaḥ sādhuḥ satya-parākramaḥ\nrājā sarvasya lokasya devānām api vāsavaḥ',
    meaning: 'Rama is dharma personified. He is noble, whose prowess is in truth. He is king of all worlds, even of the devas themselves.',
    tradition: 'hindu', category: 'ramayana',
    tags: ['rama', 'dharma', 'vibhishana', 'devotion'],
  },
  {
    id: 'ram-uttara-1',
    title: 'The Ideal King',
    source: 'Valmiki Ramayana — Uttara Kanda',
    original: 'न पर्जन्यो विकालेऽभूत् न दुर्भिक्षं बभूव ह ।\nनालयो वातजो रोगो नोपसर्गभयं तथा ॥',
    transliteration: 'na parjanyo vikāle \'bhūt na durbhikṣaṁ babhūva ha\nnālayo vātajo rogo nopasarga-bhayaṁ tathā',
    meaning: 'During Rama\'s reign, there was no untimely rain, no famine, no disease caused by wind, and no fear of epidemic. This is the description of Ram Rajya — the ideal kingdom.',
    tradition: 'hindu', category: 'ramayana',
    tags: ['ram-rajya', 'dharma', 'ideal', 'governance'],
  },
];

// ─── UPANISHADS ───────────────────────────────────────────────────────────────
export const UPANISHAD_ENTRIES: LibraryEntry[] = [
  {
    id: 'upa-briha-1',
    title: 'From the Unreal to the Real',
    source: 'Brihadaranyaka Upanishad 1.3.28',
    original: 'असतो मा सद्गमय । तमसो मा ज्योतिर्गमय ।\nमृत्योर्मा अमृतं गमय ॥',
    transliteration: 'asato mā sadgamaya\ntamaso mā jyotir gamaya\nmṛtyor māmṛtaṁ gamaya',
    meaning: 'Lead me from the unreal to the real. Lead me from darkness to light. Lead me from death to immortality.',
    tradition: 'hindu', category: 'upanishad',
    tags: ['prayer', 'truth', 'light', 'immortality'],
  },
  {
    id: 'upa-mandu-1',
    title: 'OM — The Eternal Sound',
    source: 'Mandukya Upanishad 1',
    original: 'ओमित्येतदक्षरमिदं सर्वं तस्योपव्याख्यानं भूतं भवद्भविष्यदिति सर्वमोंकार एव ।',
    transliteration: 'om ity etad akṣaram idaṁ sarvaṁ tasyopavyākhyānaṁ bhūtaṁ bhavad bhaviṣyaditi sarvam oṁkāra eva',
    meaning: 'OM — this syllable is all this. A further explanation of it: All that is past, present, and future is indeed OM. And whatever transcends these three divisions of time, that too is OM.',
    tradition: 'hindu', category: 'upanishad',
    tags: ['om', 'brahman', 'consciousness', 'mandukya'],
  },
  {
    id: 'upa-chanda-1',
    title: 'Tat Tvam Asi — That Thou Art',
    source: 'Chandogya Upanishad 6.8.7',
    original: 'तत् त्वम् असि श्वेतकेतो ।',
    transliteration: 'tat tvam asi śvetaketo',
    meaning: '"That thou art, O Shvetaketu." — The individual self (Atman) is identical with the universal Self (Brahman). One of the four Mahavakyas of the Upanishads.',
    tradition: 'hindu', category: 'upanishad',
    tags: ['mahavakya', 'atman', 'brahman', 'advaita'],
  },
];

// ─── STOTRAS ──────────────────────────────────────────────────────────────────
export const STOTRA_ENTRIES: LibraryEntry[] = [
  {
    id: 'stotra-gayatri',
    title: 'Gayatri Mantra',
    source: 'Rigveda 3.62.10',
    original: 'ॐ भूर्भुवः स्वः ।\nतत्सवितुर्वरेण्यं\nभर्गो देवस्य धीमहि ।\nधियो यो नः प्रचोदयात् ॥',
    transliteration: 'oṁ bhūr bhuvaḥ svaḥ\ntat savitur vareṇyaṁ\nbhargo devasya dhīmahi\ndhiyo yo naḥ pracodayāt',
    meaning: 'We meditate on the glory of the Creator who has created the Universe, who is fit to be worshipped as the source of all knowledge. May that divine light illuminate our intellect.',
    tradition: 'hindu', category: 'mantra',
    tags: ['gayatri', 'savitri', 'mantra', 'daily', 'surya'],
  },
  {
    id: 'stotra-maha-mrityu',
    title: 'Mahamrityunjaya Mantra',
    source: 'Rigveda 7.59.12 / Yajurveda 3.60',
    original: 'ॐ त्र्यम्बकं यजामहे सुगन्धिं पुष्टिवर्धनम् ।\nउर्वारुकमिव बन्धनान् मृत्योर्मुक्षीय मामृतात् ॥',
    transliteration: 'oṁ tryambakaṁ yajāmahe sugandhiṁ puṣṭi-vardhanam\nurvārukam iva bandhanān mṛtyor mukṣīya māmṛtāt',
    meaning: 'We worship the three-eyed One (Shiva) who is fragrant and who nourishes all beings. May He liberate us from death, as a ripe cucumber is severed from the vine, and may He not withhold immortality.',
    tradition: 'hindu', category: 'mantra',
    tags: ['shiva', 'mrityunjaya', 'healing', 'liberation', 'mantra'],
  },
  {
    id: 'stotra-hanuman-chalisa-1',
    title: 'Hanuman Chalisa — Opening Dohas',
    source: 'Hanuman Chalisa — Tulsidas',
    original: 'श्रीगुरु चरण सरोज रज, निज मनु मुकुरु सुधारि ।\nबरनउँ रघुबर बिमल जसु, जो दायकु फल चारि ॥\nबुद्धिहीन तनु जानिके, सुमिरउँ पवन-कुमार ।\nबल बुद्धि विद्या देहु मोहि, हरहु कलेश विकार ॥',
    transliteration: 'śrī guru caraṇa saroja raja, nija manu mukuru sudhāri\nbaranauṁ raghubara bimala jasu, jo dāyaku phala cāri\nbuddhihīna tanu jānike, sumirauṁ pavana-kumāra\nbala buddhi vidyā dehu mohi, harahu kleśa vikāra',
    meaning: 'With the dust from the lotus feet of my Guru, I clean the mirror of my mind and narrate the pure fame of Sri Raghuvir, which bestows the four fruits of life. Considering myself to be without intelligence and knowing the weakness of my body, I remember Hanuman, the son of the wind — Grant me strength, wisdom, and knowledge; remove all my miseries and impurities.',
    tradition: 'hindu', category: 'stotra',
    tags: ['hanuman', 'chalisa', 'tulsidas', 'devotion', 'strength'],
  },
  {
    id: 'stotra-shiv-panchakshara',
    title: 'Shiv Panchakshara Stotra',
    source: 'Adi Shankaracharya',
    original: 'नागेन्द्रहाराय त्रिलोचनाय भस्माङ्गरागाय महेश्वराय ।\nनित्याय शुद्धाय दिगम्बराय तस्मै नकाराय नमः शिवाय ॥',
    transliteration: 'nāgendra-hārāya trilocanāya bhasmāṅga-rāgāya maheśvarāya\nnityāya śuddhāya digambarāya tasmai na-kārāya namaḥ śivāya',
    meaning: 'Salutations to Shiva, who wears a garland of serpents, who has three eyes, whose body is smeared with ash, who is the great lord, eternal, pure, sky-clad — salutations to the syllable "Na" of the panchakshara mantra Om Namah Shivaya.',
    tradition: 'hindu', category: 'stotra',
    tags: ['shiva', 'panchakshara', 'shankaracharya', 'namah-shivaya'],
  },
];

// ─── SIKH GURBANI ─────────────────────────────────────────────────────────────
export const GURBANI_ENTRIES: LibraryEntry[] = [
  {
    id: 'sikh-mool-mantar',
    title: 'Mool Mantar — The Root Mantra',
    source: 'Sri Guru Granth Sahib — Japji Sahib (Opening)',
    original: 'ੴ ਸਤਿ ਨਾਮੁ ਕਰਤਾ ਪੁਰਖੁ ਨਿਰਭਉ ਨਿਰਵੈਰੁ ਅਕਾਲ ਮੂਰਤਿ ਅਜੂਨੀ ਸੈਭੰ ਗੁਰ ਪ੍ਰਸਾਦਿ ॥',
    transliteration: 'Ik Oankār Sat Nāmu Kartā Purakhu Nirbhau Nirvair Akāl Mūrat Ajūnī Saibhaṁ Gur Prasādi',
    meaning: 'One Universal Creator God. The Name Is Truth. Creative Being Personified. No Fear. No Hatred. Image of the Undying. Beyond Birth. Self-Existent. By Guru\'s Grace.',
    tradition: 'sikh', category: 'nitnem',
    tags: ['mool-mantar', 'waheguru', 'japji', 'foundation', 'daily'],
  },
  {
    id: 'sikh-japji-1',
    title: 'Japji Sahib — Pauri 1',
    source: 'Sri Guru Granth Sahib — Japji Sahib, Pauri 1',
    original: 'ਸੋਚੈ ਸੋਚਿ ਨ ਹੋਵਈ ਜੇ ਸੋਚੀ ਲਖ ਵਾਰ ॥\nਚੁਪੈ ਚੁਪ ਨ ਹੋਵਈ ਜੇ ਲਾਇ ਰਹਾ ਲਿਵ ਤਾਰ ॥',
    transliteration: 'sochai soci na hova-ī je socī lakh vār\ncupai cup na hova-ī je lāi rahā liv tār',
    meaning: 'By thinking, He cannot be reduced to thought, even by thinking hundreds of thousands of times. By remaining silent, inner silence is not obtained, even by remaining lovingly absorbed within.',
    tradition: 'sikh', category: 'nitnem',
    tags: ['japji', 'guru-nanak', 'meditation', 'silence', 'waheguru'],
  },
  {
    id: 'sikh-ardas-1',
    title: 'Ardas — The Sikh Prayer',
    source: 'Sikh Rehat Maryada — Ardas',
    original: 'ਵਾਹਿਗੁਰੂ ਜੀ ਕੀ ਫਤਹ ॥\nਸ੍ਰੀ ਭਗਉਤੀ ਜੀ ਸਹਾਇ ॥\nਵਾਰ ਸ੍ਰੀ ਭਗਉਤੀ ਜੀ ਕੀ ਪਾਤਸ਼ਾਹੀ ੧੦ ॥',
    transliteration: 'Vāhigurū jī kī Fateh\nSrī Bhagautī jī sahāi\nVār Srī Bhagautī jī kī Pātsāhī 10',
    meaning: 'Victory of God! May the divine sword assist us! Ode of the Divine Sword, by the Tenth King (Guru Gobind Singh). — The opening of the Ardas, the daily Sikh prayer offered before and after every religious ceremony.',
    tradition: 'sikh', category: 'nitnem',
    tags: ['ardas', 'prayer', 'guru-gobind-singh', 'daily', 'waheguru'],
  },
  {
    id: 'sikh-anand-sahib-1',
    title: 'Anand Sahib — Song of Bliss',
    source: 'Sri Guru Granth Sahib — Anand Sahib (Guru Amar Das)',
    original: 'ਆਨੰਦੁ ਭਇਆ ਮੇਰੀ ਮਾਏ ਸਤਿਗੁਰੂ ਮੈ ਪਾਇਆ ॥\nਸਤਿਗੁਰੁ ਤ ਪਾਇਆ ਸਹਜ ਸੇਤੀ ਮਨਿ ਵਜੀਆ ਵਾਧਾਈਆ ॥',
    transliteration: 'ānand bha-i-ā merī māe satigurū mai pā-i-ā\nsatiguru ta pā-i-ā sahaj setī man vajī-ā vādhā-ī-ā',
    meaning: 'I am in bliss, O my mother, for I have found my True Guru. I have found the True Guru with intuitive ease, and my mind vibrates with the music of bliss.',
    tradition: 'sikh', category: 'gurbani',
    tags: ['anand-sahib', 'bliss', 'guru-amar-das', 'joy'],
  },
  {
    id: 'sikh-sukhmani-1',
    title: 'Sukhmani Sahib — Pearl of Peace',
    source: 'Sri Guru Granth Sahib — Sukhmani Sahib (Guru Arjan Dev)',
    original: 'ਸਿਮਰਉ ਸਿਮਰਿ ਸਿਮਰਿ ਸੁਖੁ ਪਾਵਉ ॥\nਕਲਿ ਕਲੇਸ ਤਨ ਮਾਹਿ ਮਿਟਾਵਉ ॥',
    transliteration: 'simrau simar simar sukh pāvau\nkal kles tan māhi miṭāvau',
    meaning: 'Meditate, meditate, meditate in remembrance of God and find peace. Worry and anguish shall be dispelled from your body.',
    tradition: 'sikh', category: 'gurbani',
    tags: ['sukhmani', 'peace', 'simran', 'guru-arjan-dev', 'meditation'],
  },
];

// ─── BUDDHIST SCRIPTURES ──────────────────────────────────────────────────────
export const BUDDHIST_ENTRIES: LibraryEntry[] = [
  {
    id: 'dham-1-1',
    title: 'The Mind is the Source',
    source: 'Dhammapada — Verse 1',
    original: 'Manopubbaṅgamā dhammā manoseṭṭhā manomayā\nManasā ce paduṭṭhena bhāsati vā karoti vā\nTato naṁ dukkham anveti cakkaṁ va vahato padaṁ',
    transliteration: 'mano-pubbaṅgamā dhammā manoseṭṭhā manomayā\nmanasā ce paduṭṭhena bhāsati vā karoti vā\ntato naṁ dukkham anveti cakkaṁ va vahato padaṁ',
    meaning: 'Mind is the forerunner of all actions. All deeds are led by mind, created by mind. If one speaks or acts with a corrupt mind, suffering follows, as the wheel follows the hoof of an ox.',
    tradition: 'buddhist', category: 'dhammapada',
    tags: ['mind', 'suffering', 'karma', 'dhammapada', 'buddha'],
  },
  {
    id: 'dham-1-2',
    title: 'The Mind Brings Joy',
    source: 'Dhammapada — Verse 2',
    original: 'Manopubbaṅgamā dhammā manoseṭṭhā manomayā\nManasā ce pasannena bhāsati vā karoti vā\nTato naṁ sukham anveti chāyā va anapāyinī',
    transliteration: 'mano-pubbaṅgamā dhammā manoseṭṭhā manomayā\nmanasā ce pasannena bhāsati vā karoti vā\ntato naṁ sukham anveti chāyā va anapāyinī',
    meaning: 'Mind is the forerunner of all actions. If one speaks or acts with a peaceful mind, happiness follows like a never-departing shadow.',
    tradition: 'buddhist', category: 'dhammapada',
    tags: ['mind', 'happiness', 'peace', 'dhammapada'],
  },
  {
    id: 'dham-21',
    title: 'Heedfulness is the Path',
    source: 'Dhammapada — Verse 21',
    original: 'Appamādo amatapadaṁ, pamādo maccuno padaṁ\nAppamattā na mīyanti, ye pamattā yathā matā',
    transliteration: 'appamādo amatapadaṁ pamādo maccuno padaṁ\nappamattā na mīyanti ye pamattā yathā matā',
    meaning: 'Heedfulness is the path to the Deathless. Heedlessness is the path to death. The heedful do not die; the heedless are as if already dead.',
    tradition: 'buddhist', category: 'dhammapada',
    tags: ['mindfulness', 'heedfulness', 'deathless', 'nirvana'],
  },
  {
    id: 'heart-sutra-1',
    title: 'Heart Sutra — The Essence',
    source: 'Prajnaparamita Hridaya Sutra',
    original: 'Gate gate pāragate pārasaṁgate bodhi svāhā',
    transliteration: 'gate gate pāragate pārasaṁgate bodhi svāhā',
    meaning: 'Gone, gone, gone beyond, gone completely beyond — Awakening! So be it. The mantra of the Heart Sutra, expressing the movement from ordinary consciousness to enlightenment. Each "gone" represents a stage of the bodhisattva path.',
    tradition: 'buddhist', category: 'sutra',
    tags: ['heart-sutra', 'prajnaparamita', 'mantra', 'enlightenment', 'bodhisattva'],
  },
  {
    id: 'metta-1',
    title: 'Metta Sutta — Loving Kindness',
    source: 'Sutta Nipata 1.8 (Pali Canon)',
    original: 'Sabbe sattā sukhitā hontu\nSabbe sattā averā hontu\nSabbe sattā abyāpajjhā hontu\nSabbe sattā anīghā hontu\nSukhī attānaṁ pariharantu',
    transliteration: 'sabbe sattā sukhitā hontu\nsabbe sattā averā hontu\nsabbe sattā abyāpajjhā hontu\nsabbe sattā anīghā hontu\nsukhī attānaṁ pariharantu',
    meaning: 'May all beings be happy. May all beings be free from enmity. May all beings be free from ill will. May all beings be free from suffering. May all beings carry themselves in happiness.',
    tradition: 'buddhist', category: 'sutra',
    tags: ['metta', 'loving-kindness', 'compassion', 'all-beings', 'meditation'],
  },
  {
    id: 'buddha-teaching-1',
    title: 'The Four Noble Truths',
    source: 'Dhammacakkappavattana Sutta — First Sermon of the Buddha',
    original: 'Idaṁ kho pana bhikkhave dukkhaṁ ariya-saccaṁ\nIdaṁ kho pana bhikkhave dukkha-samudayo ariya-saccaṁ\nIdaṁ kho pana bhikkhave dukkha-nirodho ariya-saccaṁ\nIdaṁ kho pana bhikkhave dukkha-nirodha-gāminī paṭipadā ariya-saccaṁ',
    transliteration: 'idam kho pana bhikkhave dukkham ariya-saccam\nidam kho pana bhikkhave dukkha-samudayo ariya-saccam\nidam kho pana bhikkhave dukkha-nirodho ariya-saccam\nidam kho pana bhikkhave dukkha-nirodha-gamini patipadā ariya-saccam',
    meaning: 'The Four Noble Truths: (1) There is suffering (Dukkha). (2) There is a cause of suffering — craving and attachment (Samudaya). (3) There is cessation of suffering (Nirodha). (4) There is a path leading to the cessation of suffering — the Noble Eightfold Path (Magga).',
    tradition: 'buddhist', category: 'dhammapada',
    tags: ['four-noble-truths', 'dukkha', 'nirvana', 'eightfold-path', 'first-sermon'],
  },
];

// ─── JAIN SCRIPTURES ──────────────────────────────────────────────────────────
export const JAIN_ENTRIES: LibraryEntry[] = [
  {
    id: 'jain-navkar',
    title: 'Navkar Mantra — The Supreme Prayer',
    source: 'Jain Agamas — Most Sacred Prayer',
    original: 'णमो अरिहंताणं\nणमो सिद्धाणं\nणमो आयरियाणं\nणमो उवज्झायाणं\nणमो लोए सव्वसाहूणं',
    transliteration: 'Namo Arihantāṇaṁ\nNamo Siddhāṇaṁ\nNamo Āyariyāṇaṁ\nNamo Uvajjhāyāṇaṁ\nNamo Loe Savvasāhūṇaṁ',
    meaning: 'I bow to the Arihantas (perfected souls still in the world). I bow to the Siddhas (liberated souls). I bow to the Acharyas (spiritual leaders). I bow to the Upadhyayas (teachers). I bow to all Sadhus (monks) in the universe. The Navkar Mantra does not worship a specific deity — it is a salutation to the qualities of enlightenment itself.',
    tradition: 'jain', category: 'jain_scripture',
    tags: ['navkar', 'mantra', 'daily', 'arihantas', 'siddhas', 'prayer'],
  },
  {
    id: 'jain-mahavir-1',
    title: 'Ahimsa — Non-Violence',
    source: 'Acharanga Sutra — Teachings of Mahavir',
    original: 'सव्वे जीवा वि इच्छंति जीविउं न मरिज्जिउं ।\nतम्हा पाणाइवायं पच्चक्खामि ॥',
    transliteration: 'savve jīvā vi icchanti jīvium na marijjium\ntamhā pāṇāivāyaṁ paccakkhāmi',
    meaning: 'All living beings wish to live, not to die. Therefore, I renounce killing living beings. — A core teaching of Mahavir establishing Ahimsa (non-violence) as the supreme ethical principle.',
    tradition: 'jain', category: 'jain_scripture',
    tags: ['ahimsa', 'mahavir', 'non-violence', 'acharanga'],
  },
  {
    id: 'jain-tattvartha-1',
    title: 'The Path to Liberation',
    source: 'Tattvartha Sutra 1.1 — Umasvati',
    original: 'सम्यग्दर्शनज्ञानचारित्राणि मोक्षमार्गः ।',
    transliteration: 'samyag-darśana-jñāna-cāritrāṇi mokṣamārgaḥ',
    meaning: 'Right faith, right knowledge, and right conduct together constitute the path to liberation. — The foundational sutra of Jain philosophy, known as the "Ratnatraya" or Triple Gem.',
    tradition: 'jain', category: 'jain_scripture',
    tags: ['moksha', 'ratnatraya', 'liberation', 'knowledge', 'conduct'],
  },
  {
    id: 'jain-anekanta-1',
    title: 'Anekantavada — Many-Sidedness',
    source: 'Jain Philosophy — Syadvada Doctrine',
    original: 'स्यादस्ति, स्यान्नास्ति, स्यादस्तिनास्ति, स्यादवक्तव्यम् ।',
    transliteration: 'syādasti, syānnāsti, syādastināsti, syādavaktavyam',
    meaning: 'Maybe it is; maybe it is not; maybe it both is and is not; maybe it is indescribable. — The Syadvada doctrine of Jainism teaches that truth is multi-faceted. No single viewpoint captures absolute truth. Intellectual humility and openness to multiple perspectives is the Jain approach to knowledge.',
    tradition: 'jain', category: 'jain_scripture',
    tags: ['anekantavada', 'syadvada', 'philosophy', 'truth', 'humility'],
  },
];

// ─── SRIMAD BHAGAVATAM ────────────────────────────────────────────────────────
export const BHAGAVATAM_ENTRIES: LibraryEntry[] = [
  {
    id: 'bhag-1-2-6',
    title: 'The Purpose of All Religion',
    source: 'Srimad Bhagavatam 1.2.6',
    original: 'स वै पुंसां परो धर्मो यतो भक्तिरधोक्षजे ।\nअहैतुक्यप्रतिहता ययात्मा सम्प्रसीदति ॥',
    transliteration: 'sa vai puṁsāṁ paro dharmo yato bhaktir adhokṣaje\nahaitukī apratihatā yayātmā samprasīdati',
    meaning: 'The supreme occupation for all humanity is that by which one can attain loving devotional service to the transcendent Lord. Such devotional service must be unmotivated and uninterrupted to completely satisfy the self.',
    tradition: 'hindu', category: 'bhagavatam',
    tags: ['bhakti', 'dharma', 'devotion', 'vishnu', 'krishna'],
  },
  {
    id: 'bhag-2-1-6',
    title: 'Always Think of Krishna',
    source: 'Srimad Bhagavatam 2.1.6',
    original: 'एतावान् साङ्ख्ययोगाभ्यां स्वधर्मपरिनिष्ठया ।\nजन्मलाभः परः पुंसामन्ते नारायणस्मृतिः ॥',
    transliteration: 'etāvān sāṅkhya-yogābhyāṁ sva-dharma-pariniṣṭhayā\njanma-lābhaḥ paraḥ puṁsām ante nārāyaṇa-smṛtiḥ',
    meaning: 'The highest perfection of human life achieved either by complete knowledge or by the practice of devotional service, or by a combination of both — is to remember the Personality of Godhead at the end of life.',
    tradition: 'hindu', category: 'bhagavatam',
    tags: ['narayana', 'remembrance', 'death', 'liberation', 'bhagavatam'],
  },
  {
    id: 'bhag-11-2-37',
    title: 'Symptoms of a Pure Devotee',
    source: 'Srimad Bhagavatam 11.2.37',
    original: 'भवद्विधा भागवतास्तीर्थभूताः स्वयं विभो ।\nतीर्थीकुर्वन्ति तीर्थानि स्वान्तःस्थेन गदाभृता ॥',
    transliteration: 'bhavad-vidhā bhāgavatās tīrtha-bhūtāḥ svayaṁ vibho\ntīrthī-kurvanti tīrthāni svāntaḥsthena gadābhṛtā',
    meaning: 'My Lord, devotees like your good self are verily holy places personified. Because you carry the Personality of Godhead within your heart, you turn all places into places of pilgrimage.',
    tradition: 'hindu', category: 'bhagavatam',
    tags: ['devotee', 'pilgrimage', 'holy', 'bhagavatam', 'vishnu'],
  },
  {
    id: 'bhag-10-14-8',
    title: 'Prayer of Brahma to Krishna',
    source: 'Srimad Bhagavatam 10.14.8',
    original: 'तत्तेऽनुकम्पां सुसमीक्षमाणो भुञ्जान एवात्मकृतं विपाकम् ।\nहृद्वाग्वपुर्भिर्विदधन्नमस्ते जीवेत यो मुक्तिपदे स दायभाक् ॥',
    transliteration: 'tat te \'nukampāṁ su-samīkṣamāṇo bhuñjāna evātma-kṛtaṁ vipākam\nhṛd-vāg-vapurbhir vidadhan namas te jīveta yo mukti-pade sa dāya-bhāk',
    meaning: 'My dear Lord, one who earnestly waits for You to bestow Your causeless mercy upon him, all the while patiently suffering the reactions of his past misdeeds — offering You respectful obeisances with his heart, words and body — is surely eligible for liberation.',
    tradition: 'hindu', category: 'bhagavatam',
    tags: ['mercy', 'brahma', 'krishna', 'liberation', 'patience'],
  },
];

// ─── VISHNU SAHASRANAMA ───────────────────────────────────────────────────────
export const VISHNU_SAHASRANAMA_ENTRIES: LibraryEntry[] = [
  {
    id: 'vish-saha-dhyana',
    title: 'Vishnu Sahasranama — Dhyana Shloka',
    source: 'Vishnu Sahasranama — Mahabharata, Anushasana Parva 149',
    original: 'शान्ताकारं भुजगशयनं पद्मनाभं सुरेशम् ।\nविश्वाधारं गगनसदृशं मेघवर्णं शुभाङ्गम् ।\nलक्ष्मीकान्तं कमलनयनं योगिभिर्ध्यानगम्यम् ।\nवन्दे विष्णुं भवभयहरं सर्वलोकैकनाथम् ॥',
    transliteration: 'śāntākāraṁ bhujagaśayanaṁ padmanābhaṁ sureśam\nviśvādhāraṁ gagana-sadṛśaṁ megha-varṇaṁ śubhāṅgam\nlakṣmī-kāntaṁ kamala-nayanaṁ yogibhir dhyāna-gamyam\nvande viṣṇuṁ bhava-bhaya-haraṁ sarva-lokaiganātham',
    meaning: 'I bow to Vishnu — serene in form, reclining on the serpent, with a lotus in His navel, Lord of the gods. He is the foundation of the universe, sky-like, cloud-coloured, auspicious. Beloved of Lakshmi, lotus-eyed, attainable through yoga by sages — the remover of the fear of worldly existence, the one master of all worlds.',
    tradition: 'hindu', category: 'vishnu_sahasranama',
    tags: ['vishnu', 'dhyana', 'sahasranama', 'meditation', 'lotus'],
  },
  {
    id: 'vish-saha-phala',
    title: 'Vishnu Sahasranama — Phala Shruti',
    source: 'Vishnu Sahasranama — Phala Shruti',
    original: 'वेदान्तगो ब्राह्मणः स्यात् क्षत्रियो विजयी भवेत् ।\nवैश्यो धनसमृद्धः स्यात् शूद्रः सुखमवाप्नुयात् ॥',
    transliteration: 'vedānta-go brāhmaṇaḥ syāt kṣatriyo vijayī bhavet\nvaiśyo dhana-samṛddhaḥ syāt śūdraḥ sukham avāpnuyāt',
    meaning: 'One who recites the Sahasranama daily: a seeker of knowledge attains wisdom, a warrior becomes victorious, a merchant attains prosperity, and all attain happiness. The Phala Shruti of the Vishnu Sahasranama, describing the universal benefits of its daily recitation.',
    tradition: 'hindu', category: 'vishnu_sahasranama',
    tags: ['vishnu', 'sahasranama', 'benefit', 'daily', 'prosperity'],
  },
  {
    id: 'vish-saha-opening',
    title: 'Vishnu Sahasranama — Opening Shloka',
    source: 'Vishnu Sahasranama — Shloka 1',
    original: 'विश्वं विष्णुर्वषट्कारो भूतभव्यभवत्प्रभुः ।\nभूतकृद्भूतभृद्भावो भूतात्मा भूतभावनः ॥',
    transliteration: 'viśvaṁ viṣṇur vaṣaṭkāro bhūta-bhavya-bhavat-prabhuḥ\nbhūtakṛd bhūtabhṛd bhāvo bhūtātmā bhūtabhāvanaḥ',
    meaning: 'He is the universe itself (Vishvam). He is Vishnu — pervading all. He is Vashatkar — to whom oblations are offered. He is the Lord of all that was, is, and will be. He creates beings, sustains them, and is the spirit within them. He is the cause of all existence.',
    tradition: 'hindu', category: 'vishnu_sahasranama',
    tags: ['vishnu', 'sahasranama', 'universe', 'all-pervading'],
  },
];

// ─── RAMCHARITMANAS ───────────────────────────────────────────────────────────
export const RAMCHARITMANAS_ENTRIES: LibraryEntry[] = [
  {
    id: 'rcm-mangal-1',
    title: 'Ramcharitmanas — Mangalacharana',
    source: 'Ramcharitmanas — Balkand Doha 1 (Tulsidas)',
    original: 'जय राम रमा रमण समन भव ताप भयानि भजे ।\nअब राम कृपा करि हरहु दुख दारिद्र्य अज्ञान ॥',
    transliteration: 'jay rāma ramā ramaṇa samana bhava tāpa bhyāni bhaje\naba rāma kṛpā kari harahu dukha dāridya ajñāna',
    meaning: 'Victory to Rama, the beloved of Ramaa (Sita), who dispels the three-fold afflictions of worldly existence. Now, O Rama, by Your grace, please remove suffering, poverty, and ignorance.',
    tradition: 'hindu', category: 'ramcharitmanas',
    tags: ['rama', 'tulsidas', 'mangal', 'ramcharitmanas', 'prayer'],
  },
  {
    id: 'rcm-hanuman-1',
    title: 'Hanuman Chalisa — Chaupai 1',
    source: 'Hanuman Chalisa — Chaupais (Tulsidas)',
    original: 'जय हनुमान ज्ञान गुन सागर ।\nजय कपीस तिहुँ लोक उजागर ॥\nराम दूत अतुलित बल धामा ।\nअञ्जनि पुत्र पवनसुत नामा ॥',
    transliteration: 'jaya hanumāna jñāna guna sāgara\njaya kapīsa tihuṁ loka ujāgara\nrāma dūta atulita bala dhāmā\nañjani-putra pavana-suta nāmā',
    meaning: 'Victory to Hanuman, the ocean of wisdom and virtue! Victory to the king of monkeys who illuminates the three worlds! He is the messenger of Rama, the abode of incomparable strength — son of Anjani, known as the Son of the Wind.',
    tradition: 'hindu', category: 'ramcharitmanas',
    tags: ['hanuman', 'chalisa', 'tulsidas', 'strength', 'devotion'],
  },
  {
    id: 'rcm-hanuman-2',
    title: 'Hanuman Chalisa — Chaupai 7–8',
    source: 'Hanuman Chalisa — Chaupais 7–8 (Tulsidas)',
    original: 'सूक्ष्म रूप धरि सियहिं दिखावा ।\nविकट रूप धरि लंक जरावा ॥\nभीम रूप धरि असुर सँहारे ।\nरामचन्द्र के काज सँवारे ॥',
    transliteration: 'sūkṣma rūpa dhari siyahiṁ dikhāvā\nvikaṭa rūpa dhari laṅka jarāvā\nbhīma rūpa dhari asura saṁhāre\nrāmacandra ke kāja saṁvāre',
    meaning: 'You took a subtle form to appear before Sita, then a formidable form to burn Lanka. In your fierce form you destroyed the demons — and accomplished all the works of Lord Rama.',
    tradition: 'hindu', category: 'ramcharitmanas',
    tags: ['hanuman', 'chalisa', 'sita', 'lanka', 'rama'],
  },
  {
    id: 'rcm-sundara-1',
    title: 'Tulsidas on Devotion',
    source: 'Ramcharitmanas — Uttarkand (Tulsidas)',
    original: 'भगत हेतु भगवान प्रभु राम धरेउ तनु भूप ।\nकिए चरित पावन परम प्राकृत नर अनुरूप ॥',
    transliteration: 'bhagata hetu bhagavāna prabhu rāma dhaeu tanu bhūpa\nkīe carita pāvana parama prākṛta nara anurūpa',
    meaning: 'For the sake of His devotees, the divine Lord Rama assumed the form of a king, and performed supremely purifying deeds in the manner of an ordinary human being.',
    tradition: 'hindu', category: 'ramcharitmanas',
    tags: ['rama', 'devotion', 'incarnation', 'tulsidas', 'bhakti'],
  },
];

// ─── SHAIVA SCRIPTURES ────────────────────────────────────────────────────────
export const SHAIVA_ENTRIES: LibraryEntry[] = [
  {
    id: 'shiva-rudrashtakam-1',
    title: 'Rudrashtakam — Verse 1',
    source: 'Rudrashtakam — Tulsidas',
    original: 'नमामीशमीशान निर्वाणरूपं विभुं व्यापकं ब्रह्मवेदस्वरूपम् ।\nनिजं निर्गुणं निर्विकल्पं निरीहं चिदाकाशमाकाशवासं भजेऽहम् ॥',
    transliteration: 'namāmīśam īśāna nirvāṇa-rūpaṁ vibhuṁ vyāpakaṁ brahma-veda-svarūpam\nnijam nirguṇaṁ nirvikalpaṁ nirīhaṁ cidākāśam ākāśa-vāsaṁ bhaje \'ham',
    meaning: 'I bow to the Lord, the controller — who is the embodiment of liberation, all-pervading, the essence of the Vedas and Brahman. I worship the self-luminous one, beyond attributes, beyond thought, desireless — infinite consciousness, dwelling in the sky of awareness.',
    tradition: 'hindu', category: 'shiva_purana',
    tags: ['shiva', 'rudra', 'tulsidas', 'stotra', 'liberation'],
  },
  {
    id: 'shiva-mahimna-1',
    title: 'Shiva Mahimna Stotram — Verse 1',
    source: 'Shiva Mahimna Stotram — Pushpadanta',
    original: 'महिम्नः पारं ते परमविदुषो यद्यसदृशी स्तुतिर्ब्रह्मादीनामपि तदवसन्नास्त्वयि गिरः ।\nअथाऽवाच्यः सर्वः स्वमतिपरिणामावधि गृणन् ममाप्येष स्तोत्रे हर निरपवादः परिकरः ॥',
    transliteration: 'mahimnaḥ pāraṁ te parama-viduṣo yady asadṛśī stutir brahmādīnām api tad avasannāstvayi giraḥ\nathāvācyaḥ sarvaḥ svamati-pariṇāmāvadhi gṛṇan mamāpy eṣa stotre hara nirapavādaḥ parikaraḥ',
    meaning: 'O Lord, if even Brahma and the greatest knowers cannot adequately praise Your greatness, and their words fall short — then all speech that attempts to praise You according to one\'s own understanding stands blameless. Even my humble offering of praise to You, O Hara, is therefore without fault.',
    tradition: 'hindu', category: 'shiva_purana',
    tags: ['shiva', 'mahimna', 'stotra', 'pushpadanta', 'praise'],
  },
  {
    id: 'shiva-lingashtakam-1',
    title: 'Lingashtakam — Verse 1',
    source: 'Lingashtakam — Adi Shankaracharya',
    original: 'ब्रह्ममुरारिसुरार्चितलिङ्गं निर्मलभासितशोभितलिङ्गम् ।\nजन्मजदुःखविनाशकलिङ्गं तत्प्रणमामि सदाशिवलिङ्गम् ॥',
    transliteration: 'brahma-murāri-surārcita-liṅgaṁ nirmala-bhāsita-śobhita-liṅgaṁ\njanmaja-duḥkha-vināśaka-liṅgaṁ tat praṇamāmi sadāśiva-liṅgaṁ',
    meaning: 'I bow to that Linga of Sadashiva, which is worshipped by Brahma, Vishnu, and all the gods — which shines with immaculate brilliance — which destroys the sorrows born from birth and death.',
    tradition: 'hindu', category: 'shiva_purana',
    tags: ['shiva', 'linga', 'shankaracharya', 'stotra', 'liberation'],
  },
  {
    id: 'shiva-panchakshara-full',
    title: 'Om Namah Shivaya — The Panchakshara',
    source: 'Krishna Yajurveda — Shri Rudram 8.6',
    original: 'ॐ नमः शिवाय ।\nनमस्ते रुद्र मन्यव उतो त इषवे नमः ।\nनमस्ते अस्तु धन्वने बाहुभ्यामुत ते नमः ॥',
    transliteration: 'oṁ namaḥ śivāya\nnamas te rudra manyava uto ta iṣave namaḥ\nnamas te astu dhanvane bāhubhyām uta te namaḥ',
    meaning: 'OM, salutation to Shiva. Salutations to Your wrath, O Rudra, and to Your arrow. Salutations to Your bow, and salutations to Your two arms. The Panchakshara "Na-Ma-Shi-Va-Ya" represents the five elements: earth, water, fire, air, ether — and Shiva as their master.',
    tradition: 'hindu', category: 'shiva_purana',
    tags: ['shiva', 'panchakshara', 'rudra', 'shri-rudram', 'namah-shivaya'],
  },
  {
    id: 'shiva-nataraja-1',
    title: 'Ananda Tandava — The Dance of Shiva',
    source: 'Chidambaram Temple Tradition — Nataraja Hymn',
    original: 'नटराजं नटेशानं नटनप्रियमव्ययम् ।\nनमस्ते नाट्यराजाय नमो नाट्यैकतत्पराय ॥',
    transliteration: 'naṭarājaṁ naṭeśānaṁ naṭana-priyam avyayam\nnamas te nāṭya-rājāya namo nāṭyaika-tatparāya',
    meaning: 'Salutations to Nataraja, the Lord of Dance — who loves the cosmic dance and is imperishable. Salutations to the King of the art of dance, to the one wholly devoted to the cosmic dance. Shiva\'s Tandava represents the five acts of creation, sustenance, dissolution, concealment, and grace.',
    tradition: 'hindu', category: 'shiva_purana',
    tags: ['shiva', 'nataraja', 'dance', 'chidambaram', 'cosmic'],
  },
];

// ─── SHAKTA SCRIPTURES ────────────────────────────────────────────────────────
export const SHAKTA_ENTRIES: LibraryEntry[] = [
  {
    id: 'devi-mahatmyam-1',
    title: 'Devi Mahatmyam — Ya Devi Sarvabhuteshu',
    source: 'Devi Mahatmyam (Durga Saptashati) — Chapter 5',
    original: 'या देवी सर्वभूतेषु शक्तिरूपेण संस्थिता ।\nनमस्तस्यै नमस्तस्यै नमस्तस्यै नमो नमः ॥\nया देवी सर्वभूतेषु बुद्धिरूपेण संस्थिता ।\nनमस्तस्यै नमस्तस्यै नमस्तस्यै नमो नमः ॥',
    transliteration: 'yā devī sarva-bhūteṣu śakti-rūpeṇa saṁsthitā\nnamas tasyai namas tasyai namas tasyai namo namaḥ\nyā devī sarva-bhūteṣu buddhi-rūpeṇa saṁsthitā\nnamas tasyai namas tasyai namas tasyai namo namaḥ',
    meaning: 'To that Goddess who abides in all beings as Power — salutation, salutation, salutation again and again. To that Goddess who abides in all beings as Intelligence — salutation, salutation, salutation again and again. One of the most chanted passages from the Devi Mahatmyam, repeated for each manifestation of the Divine Mother.',
    tradition: 'hindu', category: 'shakta',
    tags: ['devi', 'shakti', 'durga', 'navratri', 'mahatmyam'],
  },
  {
    id: 'lalita-sahasranama-1',
    title: 'Lalita Sahasranama — Opening Dhyana',
    source: 'Brahmananda Lahari — Lalita Sahasranama',
    original: 'सिन्दूरारुण विग्रहां त्रिनयनां माणिक्यमौलिस्फुरत् ।\nतारानायक शेखरां स्मितमुखीमापीनवक्षोरुहाम् ॥\nपाणिभ्यामलिपूर्णरत्नचषकं रक्तोत्पलं बिभ्रतीं ।\nसौम्यां रत्नघटस्थरक्त चरणां ध्यायेत् परामम्बिकाम् ॥',
    transliteration: 'sindūrāruṇa vigrahāṁ trinayanāṁ māṇikya-mauli-sphurat\ntārānāyaka śekharāṁ smita-mukhīm āpīna-vakṣoruhām\npāṇibhyām alipūrṇa-ratna-caṣakaṁ raktotpalaṁ bibhratīṁ\nsaumyāṁ ratna-ghaṭastha-rakta caraṇāṁ dhyāyet parāmbikām',
    meaning: 'Meditate on the Supreme Mother — Her body vermilion-red, three-eyed, crowned with rubies adorned with the crescent moon; smiling face, full-bosomed; holding in Her hands a jewelled cup filled with wine and a red lotus; gentle and serene, Her lotus feet placed on a jewelled seat.',
    tradition: 'hindu', category: 'shakta',
    tags: ['lalita', 'devi', 'sahasranama', 'shakti', 'mother'],
  },
  {
    id: 'devi-aparajita-1',
    title: 'Aparajita Stuti — Undefeated Goddess',
    source: 'Devi Mahatmyam — Chapter 4',
    original: 'सर्वमङ्गलमाङ्गल्ये शिवे सर्वार्थसाधिके ।\nशरण्ये त्र्यम्बके गौरि नारायणि नमोऽस्तु ते ॥',
    transliteration: 'sarva-maṅgala-māṅgalye śive sarvārtha-sādhike\nśaraṇye tryambake gauri nārāyaṇi namo \'stu te',
    meaning: 'O Narayani, who is the auspiciousness of all that is auspicious, who is Shiva, who fulfils all desires, who is the refuge, the three-eyed, the fair-complexioned — salutations to You. This is one of the most widely chanted verses honouring the Divine Mother, recited at the end of Navratri puja.',
    tradition: 'hindu', category: 'shakta',
    tags: ['devi', 'narayani', 'gauri', 'mangal', 'navratri'],
  },
  {
    id: 'shakta-mahishasura-1',
    title: 'Victory Over Mahishasura',
    source: 'Devi Mahatmyam — Chapter 3',
    original: 'जयन्ती मङ्गला काली भद्रकाली कपालिनी ।\nदुर्गा शिवा क्षमा धात्री स्वाहा स्वधा नमोऽस्तु ते ॥',
    transliteration: 'jayantī maṅgalā kālī bhadrakālī kapālinī\ndurgā śivā kṣamā dhātrī svāhā svadhā namo \'stu te',
    meaning: 'Salutation to Thee who art Jayanti (the Victorious), Mangala (the Auspicious), Kali (the Dark One), Bhadrakali (the Blessed Dark One), Kapalini (the skull-bearer), Durga (the Fortress), Shiva (the Peaceful), Ksama (Forbearance), Dhatri (the Sustainer), Swaha (offering to fire), and Swadha (offering to ancestors).',
    tradition: 'hindu', category: 'shakta',
    tags: ['kali', 'durga', 'devi', 'names', 'mahatmyam'],
  },
];

// ─── VEDIC HYMNS ──────────────────────────────────────────────────────────────
export const VEDA_ENTRIES: LibraryEntry[] = [
  {
    id: 'veda-purusha-sukta-1',
    title: 'Purusha Sukta — The Cosmic Person',
    source: 'Rigveda 10.90.1–2',
    original: 'सहस्रशीर्षा पुरुषः सहस्राक्षः सहस्रपात् ।\nस भूमिं विश्वतो वृत्वा अत्यतिष्ठद्दशाङ्गुलम् ॥\nपुरुष एवेदं सर्वं यद्भूतं यच्च भव्यम् ।\nउतामृतत्वस्येशानो यदन्नेनातिरोहति ॥',
    transliteration: 'sahasra-śīrṣā puruṣaḥ sahasrākṣaḥ sahasra-pāt\nsa bhūmiṁ viśvato vṛtvā atyatiṣṭhad daśāṅgulam\npuruṣa evedaṁ sarvaṁ yad bhūtaṁ yac ca bhavyam\nutāmṛtatvasyeśāno yad annenāti rohati',
    meaning: 'The Cosmic Person has a thousand heads, a thousand eyes, a thousand feet. Encompassing the earth on all sides, He extends beyond it by ten fingers\' breadth. The Cosmic Person is all this — all that was and all that will be. And He is the Lord of immortality, who grows beyond food.',
    tradition: 'hindu', category: 'veda',
    tags: ['purusha', 'rigveda', 'cosmic', 'creation', 'vedic'],
  },
  {
    id: 'veda-nasadiya-1',
    title: 'Nasadiya Sukta — Creation Hymn',
    source: 'Rigveda 10.129.1–2',
    original: 'नासदासीन्नो सदासीत्तदानीं नासीद्रजो नो व्योमा परो यत् ।\nकिमावरीवः कुह कस्य शर्मन्नम्भः किमासीद्गहनं गभीरम् ॥',
    transliteration: 'nāsad āsīn no sad āsīt tadānīṁ nāsīd rajo no vyomā paro yat\nkim āvarīvaḥ kuha kasya śarmann ambhaḥ kim āsīd ghahanaṁ gabhīram',
    meaning: 'Neither non-existence nor existence was there at that time; there was neither the realm of space nor the sky beyond. What covered it? Where? Under whose protection? Was there water, unfathomably deep? — The Nasadiya Sukta, one of the earliest philosophical meditations on the origin of existence, remarkable for its intellectual humility.',
    tradition: 'hindu', category: 'veda',
    tags: ['creation', 'nasadiya', 'rigveda', 'cosmology', 'philosophy'],
  },
  {
    id: 'veda-shanti-mantra-1',
    title: 'Shanti Mantra — Universal Peace',
    source: 'Yajurveda 36.17',
    original: 'ॐ द्यौः शान्तिरन्तरिक्षं शान्तिः पृथिवी शान्तिरापः शान्तिरोषधयः शान्तिः ।\nवनस्पतयः शान्तिर्विश्वेदेवाः शान्तिर्ब्रह्म शान्तिः सर्वं शान्तिः शान्तिरेव शान्तिः सा मा शान्तिरेधि ॥',
    transliteration: 'oṁ dyauḥ śāntirantarikṣaṁ śāntiḥ pṛthivī śāntirāpaḥ śāntiṣ oṣadhayaḥ śāntiḥ\nvanaspatayaḥ śāntir viśvedevāḥ śāntir brahma śāntiḥ sarvaṁ śāntiḥ śāntireva śāntiḥ sā mā śāntiredhi',
    meaning: 'May there be peace in the heavens, peace in the atmosphere, peace on the earth. May the waters be peaceful, may the plants be at peace, may the cosmic forces be at peace. May the Lord of all creation be peaceful, may all be peaceful — may that peace come to me.',
    tradition: 'hindu', category: 'veda',
    tags: ['shanti', 'peace', 'yajurveda', 'prayer', 'universe'],
  },
  {
    id: 'veda-indra-1',
    title: 'Indra Sukta — Invocation of Power',
    source: 'Rigveda 8.89.1',
    original: 'असृग्रमिन्द्र तेजसे असृग्रम् वृत्रहत्याय शवसे ।\nसहस्रणीथ भूतव् अश्व्याय त्वम् रथेभ्यः ॥',
    transliteration: 'asṛgram indra tejase asṛgram vṛtra-hatyāya śavase\nsahasraṇītha bhūtav aśvyāya tvam rathebhyaḥ',
    meaning: 'The rivers flowed for your brilliance, O Indra, they flowed for your power to slay Vritra. O master of thousands, the streams of horses and chariots are yours. A hymn to Indra, king of the gods, celebrating divine strength and the victory of light over darkness.',
    tradition: 'hindu', category: 'veda',
    tags: ['indra', 'rigveda', 'vedic', 'power', 'strength'],
  },
  {
    id: 'veda-prajapati-1',
    title: 'Prayer to Prajapati',
    source: 'Atharvaveda 19.55.3',
    original: 'विश्वानि देव सवितर्दुरितानि परासुव ।\nयद्भद्रं तन्न आसुव ॥',
    transliteration: 'viśvāni deva savitar duritāni parāsuva\nyad bhadraṁ tan na āsuva',
    meaning: 'O Lord Savita (the Sun), please remove all our misfortunes, and bestow upon us all that is auspicious. — A foundational Vedic prayer to the solar deity Savita, closely related to the Gayatri Mantra.',
    tradition: 'hindu', category: 'veda',
    tags: ['savita', 'surya', 'atharvaveda', 'prayer', 'auspicious'],
  },
];

// ─── YOGA SUTRAS ──────────────────────────────────────────────────────────────
export const YOGA_SUTRA_ENTRIES: LibraryEntry[] = [
  {
    id: 'yoga-1-1',
    title: 'Yoga Sutras — Now, the Teaching of Yoga',
    source: 'Yoga Sutras of Patanjali — Sutra 1.1',
    original: 'अथ योगानुशासनम् ॥',
    transliteration: 'atha yogānuśāsanam',
    meaning: 'Now, the teaching of Yoga. The word "atha" (now) indicates this is the appropriate moment — you have come, after much seeking, to the direct teaching. It signals both readiness and presence.',
    tradition: 'hindu', category: 'yoga_sutra',
    tags: ['yoga', 'patanjali', 'sutra', 'beginning', 'teaching'],
  },
  {
    id: 'yoga-1-2',
    title: 'Definition of Yoga',
    source: 'Yoga Sutras of Patanjali — Sutra 1.2',
    original: 'योगश्चित्तवृत्तिनिरोधः ॥',
    transliteration: 'yogaś citta-vṛtti-nirodhaḥ',
    meaning: 'Yoga is the cessation of the movements (vrittis) of the mind (chitta). When all the fluctuations of thought, feeling, and perception come to rest, pure awareness shines in its own nature. This is the seed definition of yoga according to Patanjali.',
    tradition: 'hindu', category: 'yoga_sutra',
    tags: ['yoga', 'mind', 'meditation', 'patanjali', 'consciousness'],
  },
  {
    id: 'yoga-1-3',
    title: 'The Seer Abides in Its Nature',
    source: 'Yoga Sutras of Patanjali — Sutra 1.3',
    original: 'तदा द्रष्टुः स्वरूपेऽवस्थानम् ॥',
    transliteration: 'tadā draṣṭuḥ svarūpe \'vasthānam',
    meaning: 'Then the Seer abides in its own nature. When the mind is stilled, pure consciousness — the true Self — rests in itself. This is the state of Self-realisation.',
    tradition: 'hindu', category: 'yoga_sutra',
    tags: ['yoga', 'self', 'consciousness', 'samadhi', 'patanjali'],
  },
  {
    id: 'yoga-2-46',
    title: 'Sthira Sukham Asanam',
    source: 'Yoga Sutras of Patanjali — Sutra 2.46',
    original: 'स्थिरसुखमासनम् ॥',
    transliteration: 'sthira-sukham āsanam',
    meaning: 'Asana (posture) should be steady and comfortable. The physical practice of yoga is not about strain or discomfort — it is the cultivation of both stability and ease simultaneously. This is the entire definition of asana in the Yoga Sutras.',
    tradition: 'hindu', category: 'yoga_sutra',
    tags: ['yoga', 'asana', 'stability', 'comfort', 'patanjali'],
  },
  {
    id: 'yoga-1-33',
    title: 'The Four Attitudes',
    source: 'Yoga Sutras of Patanjali — Sutra 1.33',
    original: 'मैत्रीकरुणामुदितोपेक्षाणां सुखदुःखपुण्यापुण्यविषयाणां भावनातश्चित्तप्रसादनम् ॥',
    transliteration: 'maitrī karuṇā mudita upekṣāṇāṁ sukha-duḥkha-puṇya-apuṇya-viṣayāṇāṁ bhāvanātaś citta-prasādanam',
    meaning: 'The mind becomes serene by cultivating: friendliness towards the happy, compassion for the suffering, joy for the virtuous, and equanimity towards the non-virtuous. The four Brahmaviharas of yoga — a teaching shared with Buddhism.',
    tradition: 'hindu', category: 'yoga_sutra',
    tags: ['yoga', 'compassion', 'friendliness', 'equanimity', 'mind'],
  },
];

// ─── CHANAKYA NITI ────────────────────────────────────────────────────────────
export const CHANAKYA_ENTRIES: LibraryEntry[] = [
  {
    id: 'chanakya-1-1',
    title: 'The Root of Knowledge',
    source: 'Chanakya Niti — Chapter 1, Verse 1',
    original: 'प्रणम्य शिरसा विष्णुं त्रैलोक्याधिपतिं प्रभुम् ।\nनानाशास्त्रोद्धृतं वक्ष्ये राजनीतिसमुच्चयम् ॥',
    transliteration: 'praṇamya śirasā viṣṇuṁ trailokya-adhipatiṁ prabhum\nnānā-śāstroddṛtaṁ vakṣye rājanīti-samuccayam',
    meaning: 'Bowing my head to Lord Vishnu, the master of the three worlds, I shall speak the collected essence of political wisdom drawn from various scriptures. — Chanakya begins his treatise with humility and invocation, reminding us that all wisdom flows from the Divine.',
    tradition: 'hindu', category: 'chanakya',
    tags: ['chanakya', 'niti', 'wisdom', 'politics', 'governance'],
  },
  {
    id: 'chanakya-education',
    title: 'Education is the Best Wealth',
    source: 'Chanakya Niti — Chapter 2',
    original: 'माता शत्रुः पिता वैरी येन बालो न पाठितः ।\nन शोभते सभामध्ये हंसमध्ये बको यथा ॥',
    transliteration: 'mātā śatruḥ pitā vairī yena bālo na pāṭhitaḥ\nna śobhate sabhā-madhye haṁsa-madhye bako yathā',
    meaning: 'A mother who does not educate her child is an enemy, a father a foe — for the uneducated child does not shine in an assembly, just as a crane does not shine among swans. Chanakya\'s emphasis on education as the most essential gift parents give their children.',
    tradition: 'hindu', category: 'chanakya',
    tags: ['chanakya', 'education', 'parents', 'wisdom', 'knowledge'],
  },
  {
    id: 'chanakya-character',
    title: 'The True Test of Character',
    source: 'Chanakya Niti — Chapter 4',
    original: 'आपदर्थे धनं रक्षेद् दारान् रक्षेद् धनैरपि ।\nआत्मानं सततं रक्षेद् दारैरपि धनैरपि ॥',
    transliteration: 'āpad-arthe dhanaṁ rakṣed dārān rakṣed dhanair api\nātmānaṁ satataṁ rakṣed dārair api dhanair api',
    meaning: 'Preserve wealth for adversity. Protect the family even at the cost of wealth. And always protect the Self (Atman) — even at the cost of family and wealth. A hierarchy of values: material, relational, and ultimately spiritual.',
    tradition: 'hindu', category: 'chanakya',
    tags: ['chanakya', 'wealth', 'self', 'protection', 'values'],
  },
  {
    id: 'chanakya-friendship',
    title: 'Test Before You Trust',
    source: 'Chanakya Niti — Chapter 3',
    original: 'परीक्ष्य कारयेत् कर्म किञ्चिच्चिन्त्य च कारयेत् ।\nपश्चात्तापो नेच्छेत् या सा चाभ्याससाधनी ॥',
    transliteration: 'parīkṣya kārayet karma kiñcic cintya ca kārayet\npaścāttāpo necchet yā sā cābhyāsa-sādhanī',
    meaning: 'Before undertaking any work, test it; and before executing it, think carefully. For whoever does not wish for remorse afterward — that is the way of systematic practice. Chanakya\'s call for deliberation, testing, and foresight in all undertakings.',
    tradition: 'hindu', category: 'chanakya',
    tags: ['chanakya', 'wisdom', 'deliberation', 'action', 'foresight'],
  },
];

// ─── ADDITIONAL GURBANI / NITNEM ───────────────────────────────────────────────
export const NITNEM_ENTRIES: LibraryEntry[] = [
  {
    id: 'sikh-rehras-1',
    title: 'Rehras Sahib — Evening Prayer Opening',
    source: 'Sri Guru Granth Sahib — Rehras Sahib (Guru Nanak Dev Ji)',
    original: 'ਸੋ ਦਰੁ ਤੇਰਾ ਕੇਹਾ ਸੋ ਘਰੁ ਕੇਹਾ ਜਿਤੁ ਬਹਿ ਸਰਬ ਸਮਾਲੇ ॥\nਵਾਜੇ ਤੇਰੇ ਨਾਦ ਅਨੇਕ ਅਸੰਖਾ ਕੇਤੇ ਤੇਰੇ ਵਾਵਣਹਾਰੇ ॥',
    transliteration: 'so daru terā kehā so ghar kehā jitu bahi sarab samāle\nvāje tere nād anek asaṅkhā kete tere vāvaṇhāre',
    meaning: 'How beautiful is Your Gate, O Lord, and how glorious is Your Abode, where You sit and care for all! The sound of Your musical instruments is unstruck — countless are those who play for You. — The opening verses of Rehras Sahib, recited at dusk as the evening prayer.',
    tradition: 'sikh', category: 'nitnem',
    tags: ['rehras', 'guru-nanak', 'evening-prayer', 'nitnem', 'waheguru'],
  },
  {
    id: 'sikh-kirtan-sohila-1',
    title: 'Kirtan Sohila — Night Prayer',
    source: 'Sri Guru Granth Sahib — Kirtan Sohila (Guru Nanak Dev Ji)',
    original: 'ਜੈ ਘਰਿ ਕੀਰਤਿ ਆਖੀਐ ਕਰਤੇ ਕਾ ਹੋਇ ਬੀਚਾਰੋ ॥\nਤਿਤੁ ਘਰਿ ਗਾਵਹੁ ਸੋਹਲਾ ਸਿਵਰਿਹੁ ਸਿਰਜਣਹਾਰੋ ॥',
    transliteration: 'jai ghar kīrati ākhī-ai karte kā hoi bīcāro\ntitu ghar gāvahu sohalā sivarihu sirajaṇhāro',
    meaning: 'In that house where the praises of the Creator are sung and contemplated — in that house, sing the songs of joy and remember the Creator. — The opening of Kirtan Sohila, the bedtime prayer of Sikhs, celebrating that every home becomes sacred through the singing of God\'s praises.',
    tradition: 'sikh', category: 'nitnem',
    tags: ['kirtan-sohila', 'night-prayer', 'guru-nanak', 'waheguru', 'nitnem'],
  },
  {
    id: 'sikh-japji-32',
    title: 'Japji Sahib — Pauri 32: The One Name',
    source: 'Sri Guru Granth Sahib — Japji Sahib, Pauri 32',
    original: 'ਇਕ ਦੂ ਜੀਭੌ ਲਖ ਹੋਹਿ ਲਖ ਹੋਵਹਿ ਲਖ ਵੀਸ ॥\nਲਖੁ ਲਖੁ ਗੇੜਾ ਆਖੀਅਹਿ ਏਕੁ ਨਾਮੁ ਜਗਦੀਸ ॥',
    transliteration: 'ik dū jībhau lakh hohi lakh hovahi lakh vīs\nlakhu lakhu geṛā ākhī-ahi eku nāmu jagadīs',
    meaning: 'If I had a hundred thousand tongues, and then multiplied them twenty times more — with each tongue, I would repeat, hundreds of thousands of times, the One Name of the Lord of the Universe. — Guru Nanak\'s ecstatic expression of the infinite glory of God\'s name that surpasses all human capacity to praise.',
    tradition: 'sikh', category: 'nitnem',
    tags: ['japji', 'naam', 'waheguru', 'guru-nanak', 'praise'],
  },
  {
    id: 'sikh-chaupai-1',
    title: 'Chaupai Sahib — Protection Prayer',
    source: 'Dasam Granth — Chaupai Sahib (Guru Gobind Singh)',
    original: 'ਹਮਰੀ ਕਰੋ ਹਾਥ ਦੇ ਰੱਛਾ ॥\nਪੂਰਨ ਹੋਇ ਚਿੱਤ ਕੀ ਇੱਛਾ ॥\nਤਵ ਚਰਨਨ ਮਨ ਰਹੇ ਹਮਾਰਾ ॥\nਅਪਨਾ ਜਾਨ ਕਰੋ ਪ੍ਰਤਿਪਾਰਾ ॥',
    transliteration: 'hamarī karo hāth de racchā\npūran hoi citt kī icchā\ntav caranan man rahe hamārā\napanā jān karo pratipārā',
    meaning: 'Extend Your hand and protect us. May the desires of our minds be fulfilled. May our minds remain at Your feet. Consider us as Your own and protect us. — From Chaupai Sahib, composed by Guru Gobind Singh Ji, a prayer for divine protection and grace, recited daily by Sikhs.',
    tradition: 'sikh', category: 'nitnem',
    tags: ['chaupai', 'protection', 'guru-gobind-singh', 'daily', 'nitnem'],
  },
];

// ─── ADDITIONAL BUDDHIST ──────────────────────────────────────────────────────
export const BUDDHIST_ADDITIONAL_ENTRIES: LibraryEntry[] = [
  {
    id: 'buddha-mangala-1',
    title: 'Mangala Sutta — The Highest Blessings',
    source: 'Sutta Nipata 2.4 (Pali Canon)',
    original: 'Asevanā ca bālānaṁ, paṇḍitānañca sevanā\nPūjā ca pūjanīyānaṁ, etaṁ maṅgalam uttamaṁ',
    transliteration: 'asevanā ca bālānaṁ paṇḍitānañca sevanā\npūjā ca pūjanīyānaṁ etaṁ maṅgalam uttamaṁ',
    meaning: 'Not to associate with fools, to associate with the wise, to honor those worthy of honor — this is the highest blessing. From the Mangala Sutta, in which the Buddha enumerates thirty-eight blessings, beginning with the company we keep.',
    tradition: 'buddhist', category: 'sutra',
    tags: ['mangala', 'blessing', 'wisdom', 'company', 'sutta'],
  },
  {
    id: 'buddha-triple-gem',
    title: 'Taking Refuge in the Triple Gem',
    source: 'Dhammacakkappavattana Sutta (Pali Canon)',
    original: 'Buddhaṁ saranaṁ gacchāmi\nDhammaṁ saranaṁ gacchāmi\nSaṅghaṁ saranaṁ gacchāmi',
    transliteration: 'buddhaṁ saranaṁ gacchāmi\ndhammaṁ saranaṁ gacchāmi\nsaṅghaṁ saranaṁ gacchāmi',
    meaning: 'I take refuge in the Buddha. I take refuge in the Dhamma (the Teaching). I take refuge in the Sangha (the Community). The Three Jewels or Triple Gem — the foundational vow of every Buddhist, repeated three times as an affirmation of commitment to the path of awakening.',
    tradition: 'buddhist', category: 'sutra',
    tags: ['triple-gem', 'refuge', 'buddha', 'dhamma', 'sangha'],
  },
  {
    id: 'dham-183',
    title: 'Dhammapada — Do No Evil',
    source: 'Dhammapada — Verse 183',
    original: 'Sabbapāpassa akaraṇaṁ kusalassa upasampadā\nSacittapariyodapanaṁ etaṁ buddhānasāsanaṁ',
    transliteration: 'sabba-pāpassa akaraṇaṁ kusalassa upasampadā\nsacitta-pariyodapanaṁ etaṁ buddhāna-sāsanaṁ',
    meaning: 'To abstain from all evil, to cultivate good, to purify one\'s mind — this is the teaching of all the Buddhas. The entire teaching of Buddhism distilled into three lines: ethical conduct, virtuous action, and purification of mind.',
    tradition: 'buddhist', category: 'dhammapada',
    tags: ['ethics', 'mind', 'teaching', 'dhammapada', 'purity'],
  },
  {
    id: 'dham-277',
    title: 'All Conditioned Things Are Impermanent',
    source: 'Dhammapada — Verses 277–279',
    original: 'Sabbe saṅkhārā aniccā\'ti yadā paññāya passati\nAtha nibbindati dukkhe esa maggo visuddhiyā\nSabbe saṅkhārā dukkhā\'ti... sabbe dhammā anattā\'ti',
    transliteration: 'sabbe saṅkhārā aniccā\'ti yadā paññāyā passati\natha nibbindati dukkhe esa maggo visuddhiyā\nsabbe saṅkhārā dukkhā\'ti sabbe dhammā anattā\'ti',
    meaning: 'When one sees with wisdom that all conditioned things are impermanent — one turns away from suffering. This is the path to purification. All conditioned things are suffering. All phenomena are without a permanent self. These are the Three Marks of Existence: anicca (impermanence), dukkha (unsatisfactoriness), anatta (non-self).',
    tradition: 'buddhist', category: 'dhammapada',
    tags: ['impermanence', 'three-marks', 'anicca', 'dukkha', 'anatta'],
  },
];

// ─── ADDITIONAL JAIN ──────────────────────────────────────────────────────────
export const JAIN_ADDITIONAL_ENTRIES: LibraryEntry[] = [
  {
    id: 'jain-samayasara-1',
    title: 'Samayasara — The Soul Itself',
    source: 'Samayasara — Kundakunda, Verse 1',
    original: 'सव्वे जीवा सिद्धसमा सव्वे जीवा हवंति मुक्खजोग्गा ।\nणाणेण तहा चरणेण ये जाणंति ते मुक्खं पावंति ॥',
    transliteration: 'savve jīvā siddha-samā savve jīvā havaṁti mukkha-joggā\nṇāṇeṇa tahā caraṇeṇa ye jāṇaṁti te mukkhaṁ pāvaṁti',
    meaning: 'All souls are equal to the Siddhas (liberated souls); all souls are worthy of liberation. Those who know this through right knowledge and right conduct — they attain liberation. The fundamental Jain teaching that every soul has the same inherent capacity for liberation.',
    tradition: 'jain', category: 'jain_scripture',
    tags: ['samayasara', 'kundakunda', 'liberation', 'soul', 'equality'],
  },
  {
    id: 'jain-dasavaikalika-1',
    title: 'Dasavaikalika Sutra — The Fourfold Path',
    source: 'Dasavaikalika Sutra — Shayyambhava, Verse 1.1',
    original: 'धम्मो मंगलमुक्किट्ठं अहिंसा संजमो तवो ।\nदेवा वि तं नमंसंति जस्स धम्मे सया मणो ॥',
    transliteration: 'dhammo maṅgalamukkiṭṭhaṁ ahiṁsā saṁjamo tavo\ndevā vi taṁ namaṁsaṁti jassa dhamme sayā maṇo',
    meaning: 'Dharma (righteousness) is the highest auspiciousness — non-violence, self-restraint, and austerity. Even the gods bow down to one whose mind is always absorbed in Dharma. This verse is one of the most sacred in Jain tradition, recited at the start of worship.',
    tradition: 'jain', category: 'jain_scripture',
    tags: ['ahimsa', 'dharma', 'jain', 'austerity', 'dasavaikalika'],
  },
];

// ─── All entries combined ──────────────────────────────────────────────────────
export const ALL_LIBRARY_ENTRIES: LibraryEntry[] = [
  // Vaishnava
  ...GITA_ENTRIES,
  ...BHAGAVATAM_ENTRIES,
  ...VISHNU_SAHASRANAMA_ENTRIES,
  // Epic / Devotional
  ...RAMAYANA_ENTRIES,
  ...RAMCHARITMANAS_ENTRIES,
  // Upanishads & Vedas
  ...UPANISHAD_ENTRIES,
  ...VEDA_ENTRIES,
  // Shaiva
  ...SHAIVA_ENTRIES,
  // Shakta
  ...SHAKTA_ENTRIES,
  // Stotras & Mantras (mixed)
  ...STOTRA_ENTRIES,
  // Yoga
  ...YOGA_SUTRA_ENTRIES,
  // Niti
  ...CHANAKYA_ENTRIES,
  // Sikh
  ...GURBANI_ENTRIES,
  ...NITNEM_ENTRIES,
  // Buddhist
  ...BUDDHIST_ENTRIES,
  ...BUDDHIST_ADDITIONAL_ENTRIES,
  // Jain
  ...JAIN_ENTRIES,
  ...JAIN_ADDITIONAL_ENTRIES,
];

// ─── Library sections (for tabs / navigation) ─────────────────────────────────
export interface LibrarySection {
  id:        string;
  title:     string;
  emoji:     string;
  tradition: LibraryTradition;
  category:  LibraryCategory;
  desc:      string;
  count:     number;
}

export const LIBRARY_SECTIONS: LibrarySection[] = [
  // ── Vaishnava ────────────────────────────────────────────────────────────────
  { id: 'gita',               title: 'Bhagavad Gita',         emoji: '🦚', tradition: 'hindu',    category: 'gita',               desc: 'Krishna\'s eternal teachings to Arjuna on dharma, yoga & liberation',       count: GITA_ENTRIES.length },
  { id: 'bhagavatam',         title: 'Srimad Bhagavatam',     emoji: '🌸', tradition: 'hindu',    category: 'bhagavatam',         desc: 'The great Purana of devotion — Krishna, Vishnu & the nature of reality',   count: BHAGAVATAM_ENTRIES.length },
  { id: 'vishnu_sahasranama', title: 'Vishnu Sahasranama',    emoji: '🔱', tradition: 'hindu',    category: 'vishnu_sahasranama', desc: 'The thousand names of Vishnu — from the Mahabharata',                      count: VISHNU_SAHASRANAMA_ENTRIES.length },
  // ── Epic ─────────────────────────────────────────────────────────────────────
  { id: 'ramayana',           title: 'Valmiki Ramayana',      emoji: '🏹', tradition: 'hindu',    category: 'ramayana',           desc: 'Valmiki\'s epic — the ideal life of Shri Rama',                            count: RAMAYANA_ENTRIES.length },
  { id: 'ramcharitmanas',     title: 'Ramcharitmanas',        emoji: '🪔', tradition: 'hindu',    category: 'ramcharitmanas',     desc: 'Tulsidas\' devotional retelling — Hanuman Chalisa, dohas & chaupais',       count: RAMCHARITMANAS_ENTRIES.length },
  // ── Vedic & Upanishadic ───────────────────────────────────────────────────────
  { id: 'upanishad',          title: 'Upanishads',            emoji: '📿', tradition: 'hindu',    category: 'upanishad',          desc: 'The wisdom texts — Brahman, Atman & the Mahavakyas',                       count: UPANISHAD_ENTRIES.length },
  { id: 'veda',               title: 'Vedic Hymns',           emoji: '🔥', tradition: 'hindu',    category: 'veda',               desc: 'Purusha Sukta, Nasadiya, Shanti mantras & Vedic prayers',                  count: VEDA_ENTRIES.length },
  // ── Yoga & Niti ───────────────────────────────────────────────────────────────
  { id: 'yoga_sutra',         title: 'Yoga Sutras',           emoji: '🧘', tradition: 'hindu',    category: 'yoga_sutra',         desc: 'Patanjali\'s 196 sutras — the science of the mind and liberation',         count: YOGA_SUTRA_ENTRIES.length },
  { id: 'chanakya',           title: 'Chanakya Niti',         emoji: '⚖️', tradition: 'hindu',    category: 'chanakya',           desc: 'Ancient wisdom on governance, ethics & practical living',                   count: CHANAKYA_ENTRIES.length },
  // ── Shaiva ───────────────────────────────────────────────────────────────────
  { id: 'shiva_purana',       title: 'Shaiva Scriptures',     emoji: '🌙', tradition: 'hindu',    category: 'shiva_purana',       desc: 'Rudrashtakam, Lingashtakam, Mahimna Stotram & Panchakshara',               count: SHAIVA_ENTRIES.length },
  // ── Shakta ───────────────────────────────────────────────────────────────────
  { id: 'shakta',             title: 'Shakta Scriptures',     emoji: '🌺', tradition: 'hindu',    category: 'shakta',             desc: 'Devi Mahatmyam, Lalita Sahasranama & hymns to the Divine Mother',          count: SHAKTA_ENTRIES.length },
  // ── Mixed Stotras ─────────────────────────────────────────────────────────────
  { id: 'stotra',             title: 'Stotras & Mantras',     emoji: '🕉️', tradition: 'hindu',    category: 'stotra',             desc: 'Gayatri, Mahamrityunjaya, Hanuman Chalisa & universal mantras',            count: STOTRA_ENTRIES.length },
  // ── Sikh ─────────────────────────────────────────────────────────────────────
  { id: 'gurbani',            title: 'Gurbani',               emoji: '☬',  tradition: 'sikh',     category: 'gurbani',            desc: 'Sri Guru Granth Sahib — Japji, Anand Sahib, Sukhmani & Rehras',            count: GURBANI_ENTRIES.length + NITNEM_ENTRIES.length },
  // ── Buddhist ─────────────────────────────────────────────────────────────────
  { id: 'dhammapada',         title: 'Buddhist Suttas',       emoji: '☸️', tradition: 'buddhist', category: 'dhammapada',         desc: 'Dhammapada, Heart Sutra, Metta Sutta & the Four Noble Truths',             count: BUDDHIST_ENTRIES.length + BUDDHIST_ADDITIONAL_ENTRIES.length },
  // ── Jain ─────────────────────────────────────────────────────────────────────
  { id: 'jain',               title: 'Jain Agamas',           emoji: '🤲', tradition: 'jain',     category: 'jain_scripture',     desc: 'Navkar Mantra, Tattvartha Sutra, Samayasara & Mahavir\'s teachings',       count: JAIN_ENTRIES.length + JAIN_ADDITIONAL_ENTRIES.length },
];

export function getEntriesBySection(sectionId: string): LibraryEntry[] {
  // Multi-array sections need special handling
  if (sectionId === 'gurbani')    return [...GURBANI_ENTRIES, ...NITNEM_ENTRIES];
  if (sectionId === 'dhammapada') return [...BUDDHIST_ENTRIES, ...BUDDHIST_ADDITIONAL_ENTRIES];
  if (sectionId === 'jain')       return [...JAIN_ENTRIES, ...JAIN_ADDITIONAL_ENTRIES];

  const section = LIBRARY_SECTIONS.find((s) => s.id === sectionId);
  if (!section) return ALL_LIBRARY_ENTRIES;
  return ALL_LIBRARY_ENTRIES.filter((e) => e.category === section.category);
}

export function searchEntries(query: string): LibraryEntry[] {
  const q = query.toLowerCase().trim();
  if (!q) return ALL_LIBRARY_ENTRIES;
  return ALL_LIBRARY_ENTRIES.filter((e) =>
    e.title.toLowerCase().includes(q) ||
    e.meaning.toLowerCase().includes(q) ||
    e.source.toLowerCase().includes(q) ||
    e.tags.some((t) => t.includes(q))
  );
}
