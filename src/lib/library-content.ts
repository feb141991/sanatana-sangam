// ─── Parampara Pathshala — Sanatan Scripture Content ──────────────────────────
// Covers Hindu, Sikh, Buddhist, Jain traditions
// Each entry: id, title, source, original, transliteration, meaning, tradition, category

import { GITA_FULL_DATA } from '@/lib/gita-full-data';
import { UPANISHADS_FULL_DATA } from '@/lib/upanishads-full-data';
import { UPANISHAD_STUDY_META } from '@/lib/upanishad-study';

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
  attribution?:     string;
  fullText?:        string;
  sourceUrl?:       string;
  companionSourceUrl?: string;
  companionSourceLabel?: string;
}

// ─── BHAGAVAD GITA ────────────────────────────────────────────────────────────
export const GITA_ENTRIES: LibraryEntry[] = GITA_FULL_DATA.map((entry) => ({
  ...entry,
  tags: [...entry.tags],
}));

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
    id: 'ram-bal-narada',
    title: 'Who Is Perfect? — Narada Describes Rama',
    source: 'Valmiki Ramayana — Bal Kanda 1.8–9',
    original: 'को न्वस्मिन् साम्प्रतं लोके गुणवान् कश्च वीर्यवान् ।\nधर्मज्ञश्च कृतज्ञश्च सत्यवाक्यो दृढव्रतः ॥',
    transliteration: 'ko nv asmin sāmprataṁ loke guṇavān kaśca vīryavān\ndharma-jñaś ca kṛta-jñaś ca satya-vākyo dṛḍha-vrataḥ',
    meaning: 'Who in this present world is endowed with all virtues, who is mighty, who knows righteousness, who is grateful, whose word is truth, who is firm in vow? — Valmiki\'s question to Narada, which becomes the seed of the entire Ramayana. The answer is Rama.',
    tradition: 'hindu', category: 'ramayana',
    tags: ['rama', 'virtue', 'narada', 'question', 'valmiki'],
  },
  {
    id: 'ram-ayodhya-dasaratha',
    title: 'Dasaratha\'s Grief at Exile',
    source: 'Valmiki Ramayana — Ayodhya Kanda 35.27',
    original: 'अहो धिक् मानुषं जन्म अहो धिक् कामकार्यताम् ।\nयत्र मोहात् प्रियं पुत्रं परित्यजति मे पिता ॥',
    transliteration: 'aho dhik mānuṣaṁ janma aho dhik kāma-kāryatām\nyatra mohāt priyaṁ putraṁ parityajati me pitā',
    meaning: 'Alas — what a human birth, alas — what an enslavement to desire! It is from delusion that my beloved father banishes me, his own dear son. — Rama, composed in exile, reflecting on how desire blinds even the noblest of fathers.',
    tradition: 'hindu', category: 'ramayana',
    tags: ['rama', 'dasaratha', 'exile', 'kaikeyi', 'ayodhya-kanda'],
  },
  {
    id: 'ram-aranya-sita-vow',
    title: 'Sita\'s Vow — I Follow You',
    source: 'Valmiki Ramayana — Ayodhya Kanda 27.4–5',
    original: 'पतिर्हि परमा नारी गतिः प्रोक्ता मनीषिभिः ।\nभर्तुः प्रियहिते युक्ता स्वर्गलोके महीयते ॥',
    transliteration: 'patir hi paramā nārī gatiḥ proktā manīṣibhiḥ\nbhartuḥ priya-hite yuktā svargaloke mahīyate',
    meaning: 'The wise have declared that the husband is the highest refuge for a woman. She who is devoted to her husband\'s welfare is honoured even in the celestial worlds. — Sita\'s declaration as she insists on accompanying Rama to the forest.',
    tradition: 'hindu', category: 'ramayana',
    tags: ['sita', 'dharma', 'devotion', 'forest', 'vow'],
  },
  {
    id: 'ram-aranya-jatayu',
    title: 'Jatayu Fights for Sita',
    source: 'Valmiki Ramayana — Aranya Kanda 51.22',
    original: 'यावत् प्राणाः शरीरे मे तावत् संयोत्स्ये त्वया ।\nन हि धर्मं परित्यज्य जीविष्यामि कथञ्चन ॥',
    transliteration: 'yāvat prāṇāḥ śarīre me tāvat saṁyotsye tvayā\nna hi dharmaṁ parityajya jīviṣyāmi kathañcana',
    meaning: 'As long as there is breath in my body, I shall fight you. I will not abandon dharma and live on. — The eagle Jatayu, mortally wounded, speaks before Ravana. His sacrifice is considered one of the highest acts of dharma in the Ramayana.',
    tradition: 'hindu', category: 'ramayana',
    tags: ['jatayu', 'dharma', 'sacrifice', 'sita', 'ravana'],
  },
  {
    id: 'ram-kishkindha-sugriva',
    title: 'Friendship with Sugriva',
    source: 'Valmiki Ramayana — Kishkindha Kanda 5.15',
    original: 'सखायं चैव मे कृत्वा नित्यं सुखमवाप्स्यसि ।\nसंशयस्थोऽस्मि सुग्रीव मित्रे सख्यं हि जायते ॥',
    transliteration: 'sakhāyaṁ caiva me kṛtvā nityaṁ sukham avāpsyasi\nsaṁśayastho\'smi sugrīva mitre sakhyaṁ hi jāyate',
    meaning: 'Having made me your friend, you shall attain permanent happiness. I stand in doubt, O Sugriva — but friendship is born between equals. — The moment when Rama and Sugriva form their alliance, one of history\'s most famous friendships built on mutual need and trust.',
    tradition: 'hindu', category: 'ramayana',
    tags: ['rama', 'sugriva', 'friendship', 'alliance', 'kishkindha-kanda'],
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
    id: 'ram-sundara-hanuman-meets-sita',
    title: 'Hanuman Reveals Himself to Sita',
    source: 'Valmiki Ramayana — Sundara Kanda 34.3',
    original: 'दूतोऽहं कोसलेन्द्रस्य रामस्य क्लिष्टकर्मणः ।\nभार्यां मार्गामि वैदेहीं मृगयन्नागतोऽत्र वै ॥',
    transliteration: 'dūto\'haṁ kosalendrasya rāmasya kliṣṭa-karmaṇaḥ\nbhāryāṁ mārgāmi vaidehīṁ mṛgayann āgato\'tra vai',
    meaning: 'I am the messenger of Rama, king of Kosala, who has undergone great suffering. I have come here searching for Vaidehi (Sita), his wife. — Hanuman\'s declaration to Sita in Ashoka Vatika. The moment of recognition after months of search.',
    tradition: 'hindu', category: 'ramayana',
    tags: ['hanuman', 'sita', 'rama', 'messenger', 'sundara-kanda'],
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
    id: 'ram-yuddha-aditya-hridayam',
    title: 'Aditya Hridayam — Hymn to the Sun Before Battle',
    source: 'Valmiki Ramayana — Yuddha Kanda 107.1–2',
    original: 'ततो युद्धपरिश्रान्तं समरे चिन्तया स्थितम् ।\nरावणं चाग्रतो दृष्ट्वा युद्धाय समुपस्थितम् ॥\nदैवतैश्च समागम्य द्रष्टुमभ्यागतो रणम् ।\nउपगम्याब्रवीद् रामं अगस्त्यो भगवान् ऋषिः ॥',
    transliteration: 'tato yuddha-pariśrāntaṁ samare cintayā sthitam\nrāvaṇaṁ cāgrato dṛṣṭvā yuddhāya samupasthitam\ndaivataiś ca samāgamya draṣṭum abhyāgato raṇam\nupagamyābravīd rāmaṁ agastyo bhagavān ṛṣiḥ',
    meaning: 'Then, seeing Rama exhausted in battle and Ravana standing ready before him, the divine sage Agastya arrived with the gods to witness the battle, approached Rama and spoke. — The prelude to the Aditya Hridayam, one of the most sacred solar hymns in the Ramayana, given to Rama for strength in his decisive battle.',
    tradition: 'hindu', category: 'ramayana',
    tags: ['aditya-hridayam', 'agastya', 'surya', 'yuddha-kanda', 'strength'],
  },
  {
    id: 'ram-yuddha-rama-ravana',
    title: 'The Death of Ravana',
    source: 'Valmiki Ramayana — Yuddha Kanda 108.24–25',
    original: 'एषा दिव्यास्त्रसम्पन्ना शरीयः परमाद्भुता ।\nब्रह्मदत्ता महाराज ब्रह्मणा परिनिर्मिता ॥',
    transliteration: 'eṣā divyāstra-sampannā śarīyaḥ paramādbhutā\nbrahma-dattā mahārāja brahmaṇā parinirmitā',
    meaning: 'This is the wondrous and most excellent arrow endowed with divine power — given by Brahma, O great king, created by Brahma himself. — Agastya describing the Brahmastra with which Rama finally slays Ravana. The arrow created by Brahma symbolises that it is cosmic order itself that restores dharma.',
    tradition: 'hindu', category: 'ramayana',
    tags: ['rama', 'ravana', 'brahmastra', 'victory', 'dharma'],
  },
  {
    id: 'ram-uttara-1',
    title: 'The Ideal Kingdom — Ram Rajya',
    source: 'Valmiki Ramayana — Uttara Kanda',
    original: 'न पर्जन्यो विकालेऽभूत् न दुर्भिक्षं बभूव ह ।\nनालयो वातजो रोगो नोपसर्गभयं तथा ॥',
    transliteration: 'na parjanyo vikāle \'bhūt na durbhikṣaṁ babhūva ha\nnālayo vātajo rogo nopasarga-bhayaṁ tathā',
    meaning: 'During Rama\'s reign, there was no untimely rain, no famine, no disease caused by wind, and no fear of epidemic. This is the description of Ram Rajya — the ideal kingdom.',
    tradition: 'hindu', category: 'ramayana',
    tags: ['ram-rajya', 'dharma', 'ideal', 'governance'],
  },
  {
    id: 'ramayana-truth',
    title: 'Truth is the Highest Reality',
    source: 'Valmiki Ramayana — Ayodhya Kanda 2.14.7',
    original: 'सत्यमेकपद्मं ब्रह्म सत्ये धर्मः प्रतिष्ठितः ।\nसत्यमेवाक्षया वेदाः सत्येनैवाप्यते परम् ॥',
    transliteration: 'satyamekapadaṃ brahma satye dharmaḥ pratiṣṭhitaḥ\nsatyamevākṣayā vedāḥ satyenaivāpyate param',
    meaning: 'Truth is the singular foundation of Brahman (Ultimate Reality), and Dharma is established in Truth. The Vedas are eternal because of Truth, and through Truth alone is the Highest State attained.',
    tradition: 'hindu', category: 'ramayana',
    tags: ['truth', 'satya', 'dharma', 'brahman', 'valmiki'],
  },
  {
    id: 'ramayana-motherland',
    title: 'Mother and Motherland',
    source: 'Valmiki Ramayana',
    original: 'अपि स्वर्णमयी लङ्का न मे लक्ष्मण रोचते ।\nजननी जन्मभूमिश्च स्वर्गादपि गरीयसी ॥',
    transliteration: 'api svarṇamayī laṅkā na me lakṣmaṇa rocate\njananī janmabhūmiśca svargādapi garīyasī',
    meaning: 'O Lakshmana, even this golden city of Lanka does not appeal to me. One\'s mother and one\'s motherland are greater even than heaven. (Shri Rama\'s famous declaration after the victory in Lanka).',
    tradition: 'hindu', category: 'ramayana',
    tags: ['patriotism', 'mother', 'motherland', 'heaven', 'rama'],
  },
];

// ─── UPANISHADS ───────────────────────────────────────────────────────────────
const upanishadOriginalById = new Map(
  UPANISHAD_STUDY_META.map((entry) => [entry.id, entry]),
);

export const UPANISHAD_ENTRIES: LibraryEntry[] = UPANISHADS_FULL_DATA.map((entry) => {
  const originalLayer = upanishadOriginalById.get(entry.id);

  return {
    ...entry,
    original: originalLayer?.original || entry.original,
    companionSourceUrl: originalLayer?.companionSourceUrl,
    companionSourceLabel: originalLayer?.companionSourceLabel,
    tags: [...entry.tags],
  };
});

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
  {
    id: 'stotra-vishnu-ashtakam',
    title: 'Vishnu Ashtakam — The Eight-Verse Hymn',
    source: 'Vishnu Ashtakam — Traditional',
    original: 'नमामि नारायण पाद पङ्कजं\nकरोमि नारायण पूजनं सदा ।\nवदामि नारायण नाम निर्मलं\nस्मरामि नारायण तत्त्वमव्ययम् ॥',
    transliteration: 'namāmi nārāyaṇa pāda paṅkajaṁ\nkaromi nārāyaṇa pūjanaṁ sadā\nvadāmi nārāyaṇa nāma nirmalaṁ\nsmarāmi nārāyaṇa tattvam avyayam',
    meaning: 'I bow to the lotus feet of Narayana. I always perform worship of Narayana. I speak the spotless name of Narayana. I meditate on the imperishable truth of Narayana. — The fourfold sadhana of a Vaishnava: bowing, worshipping, chanting, and meditating.',
    tradition: 'hindu', category: 'stotra',
    tags: ['vishnu', 'narayana', 'stotra', 'devotion', 'daily'],
  },
  {
    id: 'stotra-saraswati-vandana',
    title: 'Saraswati Vandana',
    source: 'Traditional — recited at the start of study',
    original: 'या कुन्देन्दुतुषारहारधवला या शुभ्रवस्त्रावृता ।\nया वीणावरदण्डमण्डितकरा या श्वेतपद्मासना ॥\nया ब्रह्माच्युतशंकरप्रभृतिभिर्देवैः सदा वन्दिता ।\nसा मां पातु सरस्वती भगवती निःशेषजाड्यापहा ॥',
    transliteration: 'yā kundendur tuṣāra-hāra-dhavalā yā śubhra-vastrāvṛtā\nyā vīṇā-vara-daṇḍa-maṇḍita-karā yā śveta-padmāsanā\nyā brahmācyuta-śaṅkara-prabhṛtibhir devaiḥ sadā vanditā\nsā māṁ pātu sarasvatī bhagavatī niḥśeṣa-jāḍyāpahā',
    meaning: 'She who is as white as the kunda flower, the moon, and frost; who is clad in pure white; whose hands are adorned with the vina; who is seated on a white lotus; who is always worshipped by Brahma, Vishnu, Shiva and other gods — may that divine Saraswati protect me and remove all my dullness.',
    tradition: 'hindu', category: 'stotra',
    tags: ['saraswati', 'vandana', 'knowledge', 'learning', 'goddess'],
  },
  {
    id: 'stotra-ganesh-vakratunda',
    title: 'Vakratunda Mahakaya — Ganesha Invocation',
    source: 'Traditional Ganesha Shloka',
    original: 'वक्रतुण्ड महाकाय सूर्यकोटिसमप्रभ ।\nनिर्विघ्नं कुरु मे देव सर्वकार्येषु सर्वदा ॥',
    transliteration: 'vakratuṇḍa mahākāya sūrya-koṭi-sama-prabha\nnirvighnaṁ kuru me deva sarva-kāryeṣu sarvadā',
    meaning: 'O Ganesha, with a curved trunk, massive form, and the brilliance of a million suns — O Lord, always make all my endeavours free from obstacles. The most widely recited invocation to Ganesha, chanted before any undertaking, puja, or study session.',
    tradition: 'hindu', category: 'stotra',
    tags: ['ganesha', 'invocation', 'vakratunda', 'obstacles', 'beginning'],
  },
  {
    id: 'stotra-asato-ma',
    title: 'Asato Ma — Lead Me to Truth',
    source: 'Brihadaranyaka Upanishad 1.3.28',
    original: 'असतो मा सद्गमय ।\nतमसो मा ज्योतिर्गमय ।\nमृत्योर्माऽमृतं गमय ॥\nॐ शान्तिः शान्तिः शान्तिः ॥',
    transliteration: 'asato mā sad gamaya\ntamaso mā jyotir gamaya\nmṛtyor mā amṛtaṁ gamaya\noṁ śāntiḥ śāntiḥ śāntiḥ',
    meaning: 'Lead me from untruth to Truth. Lead me from darkness to Light. Lead me from death to Immortality. Om Peace, Peace, Peace. — One of the most beloved peace mantras in the Vedic tradition. A prayer that aligns the practitioner with the highest aspiration of human life.',
    tradition: 'hindu', category: 'mantra',
    tags: ['peace', 'mantra', 'truth', 'light', 'immortality', 'upanishad'],
  },
  {
    id: 'stotra-vishnu-sahasranama-short',
    title: 'Achyutam Keshavam — Universal Names',
    source: 'Traditional Vaishnava Kirtan',
    original: 'अच्युतं केशवं रामनारायणं कृष्णदामोदरं वासुदेवं हरिम् ।\nश्रीधरं माधवं गोपिकावल्लभं जानकीनायकं रामचन्द्रं भजे ॥',
    transliteration: 'acyutaṁ keśavaṁ rāma-nārāyaṇaṁ kṛṣṇa-dāmodaraṁ vāsudevaṁ harim\nśrīdharaṁ mādhavaṁ gopikā-vallabhaṁ jānakī-nāyakaṁ rāmacandraṁ bhaje',
    meaning: 'I worship Achyuta, Keshava, Rama, Narayana, Krishna, Damodara, Vasudeva, Hari, Shridhara, Madhava, the beloved of the Gopis, the lord of Janaki (Sita) — Ramachandra. A single verse capturing many of the most beloved names of Vishnu across traditions.',
    tradition: 'hindu', category: 'stotra',
    tags: ['vishnu', 'krishna', 'rama', 'names', 'kirtan', 'devotion'],
  },
  {
    id: 'stotra-durga-sarva-mangala',
    title: 'The Auspiciousness of All (Durga Mantra)',
    source: 'Devi Mahatmyam',
    original: 'सर्वमङ्गलमङ्गल्ये शिवे सर्वार्थसाधिके ।\nशरण्ये त्र्यम्बके गौरि नारायणि नमोऽस्तु ते ॥',
    transliteration: 'sarvamaṅgalamāṅgalye śive sarvārthasādhike\nśaraṇye tryambake gauri nārāyaṇi namo’stu te',
    meaning: 'O Auspiciousness of all Auspiciousness, the Consort of Shiva, the fulfiller of all aims, the refuge, the three-eyed Gauri, Narayani, we bow to you.',
    tradition: 'hindu', category: 'stotra',
    tags: ['durga', 'shakti', 'auspicious', 'divine-mother'],
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
  {
    id: 'sikh-chaupai-1',
    title: 'Chaupai Sahib — Protection Prayer',
    source: 'Sri Dasam Granth — Guru Gobind Singh',
    original: 'ਹਮਰੀ ਕਰੋ ਹਾਥ ਦੈ ਰੱਛਾ ॥ ਪੂਰਨ ਹੋਇ ਚਿੱਤ ਕੀ ਇੱਛਾ ॥\nਤਵ ਚਰਨਨ ਮਨ ਰਹੈ ਹਮਾਰਾ ॥ ਅਪਨਾ ਜਾਨ ਕਰੋ ਪ੍ਰਤਿਪਾਰਾ ॥',
    transliteration: 'Hamrī karo hāth dai racchā. Pūran hoi citt kī icchā.\nTav carnan man rahai hamārā. Apnā jān karo pratipārā.',
    meaning: 'O God, protect me with Your Hand. May the desires of my heart be fulfilled. May my mind remain attached to Your Feet. Consider me Your own and nourish me. — The opening of the Chaupai Sahib, a powerful prayer for protection and strength.',
    tradition: 'sikh', category: 'nitnem',
    tags: ['chaupai-sahib', 'protection', 'guru-gobind-singh', 'daily', 'strength'],
  },
  {
    id: 'sikh-deh-shiva',
    title: 'Deh Shiva Bar Mohe — The Warrior\'s Prayer',
    source: 'Sri Dasam Granth — Guru Gobind Singh',
    original: 'ਦੇਹਿ ਸਿਵਾ ਬਰੁ ਮੋਹਿ ਇਹੈ ਸੁਭ ਕਰਮਨ ਤੇ ਕਬਹੂੰ ਨ ਟਰੋਂ ॥\nਨ ਡਰੋਂ ਅਰਿ ਸੋਂ ਜਬ ਜਾਇ ਲਰੋਂ ਨਿਸਚੈ ਕਰਿ ਅਪੁਨੀ ਜੀਤ ਕਰੋਂ ॥',
    transliteration: 'Deh sivā baru mohi ihai subha karaman te kabahūṅ na ṭaroṅ.\nNa ḍaroṅ ari soṅ jaba jāi laroṅ nisacai kari apunī jīta karoṅ.',
    meaning: 'O Almighty, grant me this boon, that I may never turn away from performing righteous deeds. May I have no fear of the enemy when I go to battle, and with determination, may I secure my victory. A famous composition by the tenth Guru, instilling courage and commitment to dharma.',
    tradition: 'sikh', category: 'gurbani',
    tags: ['guru-gobind-singh', 'warrior', 'prayer', 'victory', 'dharma', 'courage'],
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
  {
    id: 'dham-5',
    title: 'Hatred is Appeased by Love',
    source: 'Dhammapada — Verse 5',
    original: 'Na hi verena verāni, sammantīdha kudācanaṃ\nAverena ca sammanti, esa dhammo sanantano',
    transliteration: 'na hi verena verāni sammantīdha kudācanaṃ\naverena ca sammanti esa dhammo sanantano',
    meaning: 'Hatred is never appeased by hatred in this world. By non-hatred (love) alone is hatred appeased. This is an eternal law. One of the most famous verses of the Buddha, teaching the power of compassion over retaliation.',
    tradition: 'buddhist', category: 'dhammapada',
    tags: ['love', 'compassion', 'law', 'hatred', 'peace'],
  },
  {
    id: 'dham-183',
    title: 'The Teaching of all Buddhas',
    source: 'Dhammapada — Verse 183',
    original: 'Sabbapāpassa akaraṇaṃ, kusalassa upasampadā\nSacittapariyodapanaṃ, etaṃ buddhāna sāsanaṃ',
    transliteration: 'sabbapāpassa akaraṇaṃ kusalassa upasampadā\nsacittapariyodapanaṃ etaṃ buddhāna sāsanaṃ',
    meaning: 'To avoid all evil, to cultivate good, and to cleanse one\'s own mind — this is the teaching of the Buddhas. A summary of the entire Buddhist path in a single verse.',
    tradition: 'buddhist', category: 'dhammapada',
    tags: ['summary', 'mind', 'ethics', 'goodness'],
  },
  {
    id: 'dham-273',
    title: 'The Best of Paths',
    source: 'Dhammapada — Verse 273',
    original: 'Maggānaṭṭhaṅgiko seṭṭho, saccānaṃ caturo padā\nVirāgo seṭṭho dhammānaṃ, dvipadānañca cakkhumā',
    transliteration: 'maggānaṭṭhaṅgiko seṭṭho saccānaṃ caturo padā\nvirāgo seṭṭho dhammānaṃ dvipadānañca cakkhumā',
    meaning: 'Of paths, the Eightfold Path is the best; of truths, the Four Noble Truths are the best; of states, the passionless state (Nirvana) is the best; and of humans, the Seeing One (the Buddha) is the best.',
    tradition: 'buddhist', category: 'dhammapada',
    tags: ['eightfold-path', 'truths', 'nirvana', 'buddha'],
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
  {
    id: 'jain-bhaktamar-1',
    title: 'Bhaktamar Stotra — Verse 1',
    source: 'Bhaktamar Stotra — Acharya Manatunga',
    original: 'भक्तामर-प्रणत-मौलि-मणि-प्रभाणा-मुद्योतकं दलित-पाप-तमो-वितानम् ।\nसम्यक्-प्रणम्य जिन-पाद-युगं युगादा-वालम्बनं भव-जले पततां जनानाम् ॥',
    transliteration: 'bhaktāmara-praṇata-mauli-maṇi-prabhāṇā-mudyotakaṃ dalita-pāpa-tamo-vitānam\nsamyak-praṇamya jina-pāda-yugaṃ yugādā-vālambanaṃ bhava-jale patatāṃ janānām',
    meaning: 'I bow to the feet of the Jina (Lord Adinath), which illuminate the jewels in the crowns of bowing devotees and destroy the darkness of sins. These feet are the only support for those drowning in the ocean of worldly existence. The most famous Jain hymn, often recited for health and protection.',
    tradition: 'jain', category: 'jain_scripture',
    tags: ['bhaktamar', 'stotra', 'adinath', 'protection', 'devotion'],
  },
  {
    id: 'jain-samaysara-1',
    title: 'Samaysara — The Essence of the Soul',
    source: 'Samaysara — Acharya Kundakunda, Verse 1',
    original: 'वंदित्तु सव्वसिद्धे धुवमचलमणोवमं गदिं पत्ते ।\nवोच्छामि समयपाहुडममिणमो सुदकेवलीभणिदं ॥',
    transliteration: 'vandittu savvasiddhe dhuvamacalamaṇovamaṃ gadiṃ patte\nvocchāmi samayapāhuḍamamiṇamo sudakevalībhaṇidaṃ',
    meaning: 'I bow to all the Siddhas (liberated souls) who have attained the permanent, immutable, and incomparable state of liberation. I shall now expound upon the Samayaprabhrita (The Nature of the Soul) as taught by the omniscient masters. The opening verse of the most important text in Jain philosophy.',
    tradition: 'jain', category: 'jain_scripture',
    tags: ['soul', 'siddha', 'liberation', 'kundakunda', 'philosophy'],
  },
];

// ─── SRIMAD BHAGAVATAM ────────────────────────────────────────────────────────
export const BHAGAVATAM_ENTRIES: LibraryEntry[] = [
  {
    id: 'bhag-1-1-1',
    title: 'Janmādy asya — The Absolute Truth',
    source: 'Srimad Bhagavatam 1.1.1',
    original: 'जन्माद्यस्य यतोऽन्वयादितरतश्चार्थेष्वभिज्ञः स्वराट् ।\nतेने ब्रह्म हृदा य आदिकवये मुह्यन्ति यत् सूरयः ॥',
    transliteration: 'janmādy asya yato\'nvayād itarataś cārtheṣv abhijñaḥ sva-rāṭ\ntene brahma hṛdā ya ādi-kavaye muhyanti yat sūrayaḥ',
    meaning: 'The Absolute Truth — from whom all emanates and into whom all enters, who is omniscient and independent — He it is who imparted the Vedic knowledge into the heart of Brahma, the first created being. Sages are bewildered by Him. The very first verse of the Bhagavatam, establishing the nature of the Supreme.',
    tradition: 'hindu', category: 'bhagavatam',
    tags: ['absolute-truth', 'brahma', 'creation', 'bhagavatam', 'krishna'],
  },
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
    id: 'bhag-1-5-17',
    title: 'Incomplete Charity of the Incomplete',
    source: 'Srimad Bhagavatam 1.5.17',
    original: 'त्यक्त्वा स्वधर्मं चरणाम्बुजं हरेर्भजन्नपक्वोऽथ पतेत् ततो यदि ।\nयत्र क्व वाभद्रमभूदमुष्य किं को वार्थ आप्तोऽभजतां स्वधर्मतः ॥',
    transliteration: 'tyaktvā sva-dharmaṁ caraṇāmbujaṁ harer bhajann apakvo \'tha patet tato yadi\nyatra kva vābhadram abhūd amuṣya kiṁ ko vārtha āpto \'bhajatāṁ sva-dharmataḥ',
    meaning: 'One who abandons his prescribed duties to take to the service of Vishnu — even if he falls on the way — suffers no real harm. But what does one gain by performing his worldly duties perfectly yet never worshipping the Lord? — Narada\'s clarion call on devotion over mere duty.',
    tradition: 'hindu', category: 'bhagavatam',
    tags: ['bhakti', 'dharma', 'narada', 'devotion', 'liberation'],
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
    id: 'bhag-prahlada-teaching',
    title: 'Prahlada\'s Nine Forms of Devotion',
    source: 'Srimad Bhagavatam 7.5.23',
    original: 'श्रवणं कीर्तनं विष्णोः स्मरणं पादसेवनम् ।\nअर्चनं वन्दनं दास्यं सख्यमात्मनिवेदनम् ॥',
    transliteration: 'śravaṇaṁ kīrtanaṁ viṣṇoḥ smaraṇaṁ pāda-sevanam\narcanaṁ vandanaṁ dāsyaṁ sakhyam ātma-nivedanam',
    meaning: 'Hearing, chanting, remembering Vishnu\'s names and pastimes; serving His lotus feet; worshipping; offering prayers; acting as His servant; treating Him as a friend; and surrendering oneself completely — these nine are the processes of devotion. Prahlada\'s teaching to his classmates, one of the most famous passages in all of the Bhagavatam.',
    tradition: 'hindu', category: 'bhagavatam',
    tags: ['prahlada', 'navavidha-bhakti', 'nine-devotions', 'vishnu', 'devotion'],
  },
  {
    id: 'bhag-10-8-21',
    title: 'The Cosmic Vision in Krishna\'s Mouth',
    source: 'Srimad Bhagavatam 10.8.21',
    original: 'सा तत्र ददृशे विश्वं जगत् स्थासनु चाचरम् ।\nखं रोदसी ज्योतिरनीकमाशाः सूर्येन्दुवह्न्यादि विभुं महान्तम् ॥',
    transliteration: 'sā tatra dadṛśe viśvaṁ jagat sthāsnu ca ācaram\nkhaṁ rodasī jyotir anīkam āśāḥ sūryendu-vahny-ādi vibhuṁ mahāntam',
    meaning: 'Yashodha then saw within Krishna\'s mouth the entire universe — all moving and non-moving things, the sky and the earth, the heavenly bodies, the sun, moon, fire — everything, vast and magnificent. — The great vision from the Damodara lila, when Yashodha opens Krishna\'s mouth to check if he ate dirt.',
    tradition: 'hindu', category: 'bhagavatam',
    tags: ['krishna', 'yashoda', 'cosmos', 'vision', 'lila'],
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
    id: 'bhag-12-13-18',
    title: 'The Essence of All the Puranas',
    source: 'Srimad Bhagavatam 12.13.18',
    original: 'श्रीमद्भागवतं पुराणममलं यद्वैष्णवानां प्रियं\nयस्मिन् पारमहंस्यमेकममलं ज्ञानं परं गीयते ।\nतत्र ज्ञान विरागभक्तिसहितं नैष्कर्म्यमाविष्कृतं\nतच्छृण्वन् सुपठन् विचारण पदे मुक्तिः स्याद् भक्तिमान् ॥',
    transliteration: 'śrīmad-bhāgavataṁ purāṇam amalaṁ yad vaiṣṇavānāṁ priyaṁ\nyasmin pāramahaṁsyam ekam amalaṁ jñānaṁ paraṁ gīyate\ntatra jñāna-virāga-bhakti-sahitaṁ naiṣkarmyam āviṣkṛtaṁ\ntac chṛṇvan su-paṭhan vicāraṇa pade muktiḥ syād bhakti-mān',
    meaning: 'The Srimad Bhagavatam is the spotless Purana — most dear to the Vaishnavas — in which is sung the supreme, pure knowledge of the path of the great souls. In it is revealed action free from fruitive motive together with knowledge, detachment, and devotion. One who listens to, reads, and reflects on it step by step becomes a devotee and attains liberation.',
    tradition: 'hindu', category: 'bhagavatam',
    tags: ['bhagavatam', 'purana', 'knowledge', 'liberation', 'vaishnavas'],
  },
  {
    id: 'bhag-chatushloki-1',
    title: 'Chatushloki Bhagavatam — The Primal Existence',
    source: 'Srimad Bhagavatam 2.9.33',
    original: 'अहमेवासमेवाग्रे नान्यद्यत्सदसत्परम् ।\nपश्चादहं यदेतच्च योऽवशिष्येत सोऽस्म्यहम् ॥',
    transliteration: 'aham evāsam evāgre nānyad yat sad-asat param\npaścād ahaṃ yad etac ca yo \'vaśiṣyeta so \'smy aham',
    meaning: 'Prior to this creation, I alone existed. There was nothing else—neither the cause nor the effect, nor the unmanifest. After creation, it is I who am all that exists, and what remains after the dissolution is also I. (The first of four verses summarizing the entire 18,000 verses of the Bhagavatam).',
    tradition: 'hindu', category: 'bhagavatam',
    tags: ['essence', 'brahman', 'creation', 'krishna', 'philosophy'],
  },
  {
    id: 'bhag-chatushloki-3',
    title: 'The Divine Presence',
    source: 'Srimad Bhagavatam 2.9.35',
    original: 'यथा महांति भूतानि भूतेषूच्चावचेष्वनु ।\nप्रविष्टान्यप्रविष्टानि तथा तेषु न तेष्वहम् ॥',
    transliteration: 'yathā mahānti bhūtāni bhūteṣūccāvaceṣv anu\npraviṣṭāny apraviṣṭāni tathā teṣu na teṣv aham',
    meaning: 'Just as the great elements (earth, water, fire, etc.) enter into all beings and yet remain distinct from them, so do I exist within everything created and yet I am simultaneously outside of everything.',
    tradition: 'hindu', category: 'bhagavatam',
    tags: ['presence', 'elements', 'omnipresence', 'krishna'],
  },
];

// ─── MAHAPURANAS ─────────────────────────────────────────────────────────────
export const PURANA_ENTRIES: LibraryEntry[] = [
  {
    id: 'shiva-purana-linga',
    title: 'The Great Pillar of Light (Jyotirlinga)',
    source: 'Shiva Purana — Vidyeshvara Samhita 9',
    original: 'आकाशं लिङ्गमित्याहुः पृथ्वी तस्य पीठिका ।\nआलयः सर्वदेवानां लयनाल्लिङ्गमुच्यते ॥',
    transliteration: 'ākāśaṃ liṅgamityāhuḥ pṛthvī tasya pīṭhikā\nālayaḥ sarvadevānāṃ layanālliṅgamucyate',
    meaning: 'The sky is the Linga and the earth is its pedestal. It is the abode of all gods; it is called Linga because all beings dissolve (laya) into it. A profound definition of the Shiva Linga as the cosmic origin and end.',
    tradition: 'hindu', category: 'purana',
    tags: ['shiva', 'linga', 'cosmology', 'creation', 'purana'],
  },
  {
    id: 'vishnu-purana-shakti',
    title: 'The Three-fold Power of Vishnu',
    source: 'Vishnu Purana 6.7.61',
    original: 'विष्णुशक्तिः परा प्रोक्ता क्षेत्रज्ञाख्या तथापरा ।\nअविद्या कर्मसंज्ञाान्या तृतीया शक्तिरिष्यते ॥',
    transliteration: 'viṣṇuśaktiḥ parā proktā kṣetrajñākhyā tathāparā\navidyā karmasaṃjñānyā tṛtīyā śaktiriṣyate',
    meaning: 'The energy of Vishnu is three-fold: the Superior (Para/Spiritual), the Marginal (Kshetrajna/Living beings), and the Inferior (Avidya/Material energy). A foundational verse for understanding the relationship between God, the soul, and matter.',
    tradition: 'hindu', category: 'purana',
    tags: ['vishnu', 'shakti', 'philosophy', 'soul', 'matter'],
  },
  {
    id: 'devi-mahatmyam-shakti',
    title: 'To the Devi as Shakti',
    source: 'Markandeya Purana — Devi Mahatmyam 5.34',
    original: 'या देवी सर्वभूतेषु शक्तिरूपेण संस्थिता ।\nनमस्तस्यै नमस्तस्यै नमस्तस्यै नमो नमः ॥',
    transliteration: 'yā devī sarvabhūteṣu śaktirūpeṇa saṃsthitā\nnamastasyai namastasyai namastasyai namo namaḥ',
    meaning: 'To that Devi who is present in all beings in the form of Power (Shakti), salutations to Her, salutations to Her, salutations to Her, salutations again and again. One of the most recited verses in worship of the Divine Mother.',
    tradition: 'hindu', category: 'purana',
    tags: ['durga', 'shakti', 'devi', 'divine-mother', 'power'],
  },
  {
    id: 'garuda-purana-liberation',
    title: 'The Rare Human Birth',
    source: 'Garuda Purana',
    original: 'दुर्लभो मानुषो देहो देहिनां क्षणभङ्गुरः ।\nतत्रापि दुर्लभं मन्ये वैकुण्ठप्रियदर्शनम् ॥',
    transliteration: 'durlabho mānuṣो deho dehināṃ kṣaṇabhaṅguraḥ\ntatrāpi durlabhaṃ manye vaikuṇṭhapriyadarśanam',
    meaning: 'A human body is very difficult to obtain and is extremely fragile. Even rarer is the vision of those who are dear to the Lord. A teaching emphasizing the preciousness of life and the value of saintly company.',
    tradition: 'hindu', category: 'purana',
    tags: ['garuda-purana', 'life', 'wisdom', 'devotion', 'birth'],
  },
];

// ─── VISHNU SAHASRANAMA ───────────────────────────────────────────────────────
export const VISHNU_SAHASRANAMA_ENTRIES: LibraryEntry[] = [
  {
    id: 'vish-saha-context',
    title: 'The Setting — Bhishma on the Arrow-Bed',
    source: 'Vishnu Sahasranama — Anushasana Parva 149.14–15',
    original: 'युधिष्ठिर उवाच —\nकिम् एकं दैवतं लोके किं वाप्येकं परायणम् ।\nस्तुवन्तः कं कमर्चन्तः प्राप्नुयुर्मानवाः शुभम् ॥',
    transliteration: 'yudhiṣṭhira uvāca\nkim ekaṁ daivataṁ loke kim vāpy ekaṁ parāyaṇam\nstuvantaḥ kaṁ kam arcantaḥ prāpnuyur mānavāḥ śubham',
    meaning: 'Yudhishthira asked: Who is the one God in this world? What is the one supreme refuge? By praising and worshipping whom do human beings attain good? — The question that births the Vishnu Sahasranama. Bhishma, lying on his death-bed of arrows, answers by reciting the thousand names of Vishnu.',
    tradition: 'hindu', category: 'vishnu_sahasranama',
    tags: ['vishnu', 'sahasranama', 'yudhishthira', 'bhishma', 'question'],
  },
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
    title: 'Vishnu Sahasranama — Names 1–8',
    source: 'Vishnu Sahasranama — Shloka 1',
    original: 'विश्वं विष्णुर्वषट्कारो भूतभव्यभवत्प्रभुः ।\nभूतकृद्भूतभृद्भावो भूतात्मा भूतभावनः ॥',
    transliteration: 'viśvaṁ viṣṇur vaṣaṭkāro bhūta-bhavya-bhavat-prabhuḥ\nbhūtakṛd bhūtabhṛd bhāvo bhūtātmā bhūtabhāvanaḥ',
    meaning: 'He is the universe itself (Vishvam). He is Vishnu — pervading all. He is Vashatkar — to whom oblations are offered. He is the Lord of all that was, is, and will be. He creates beings, sustains them, and is the spirit within them. He is the cause of all existence.',
    tradition: 'hindu', category: 'vishnu_sahasranama',
    tags: ['vishnu', 'sahasranama', 'universe', 'all-pervading'],
  },
  {
    id: 'vish-saha-names-9-16',
    title: 'Vishnu Sahasranama — Names 9–16: The Eternal Reality',
    source: 'Vishnu Sahasranama — Shloka 2',
    original: 'पूतात्मा परमात्मा च मुक्तानां परमा गतिः ।\nअव्ययः पुरुषः साक्षी क्षेत्रज्ञोऽक्षर एव च ॥',
    transliteration: 'pūtātmā paramātmā ca muktānāṁ paramā gatiḥ\navyayaḥ puruṣaḥ sākṣī kṣetra-jño \'kṣara eva ca',
    meaning: 'He is Pūtātmā — the pure Self. He is Paramātmā — the Supreme Self. He is the highest goal of the liberated. He is imperishable, the cosmic Person, the witness, the knower of the field, and the eternal. Eight names that capture the relationship between the individual soul, the Supreme, and liberation.',
    tradition: 'hindu', category: 'vishnu_sahasranama',
    tags: ['vishnu', 'sahasranama', 'self', 'liberation', 'paramatma'],
  },
  {
    id: 'vish-saha-names-54-61',
    title: 'Vishnu Sahasranama — The Destroyer of Fear',
    source: 'Vishnu Sahasranama — Shloka 7',
    original: 'अनिर्विण्णः स्थविष्ठोऽभूर्धर्मयूपो महामखः ।\nनक्षत्रनेमिर्नक्षत्री क्षमः क्षामः समीहनः ॥',
    transliteration: 'anirvviṇṇaḥ sthaviṣṭho \'bhūr dharma-yūpo mahā-makhaḥ\nnakṣatra-nemir nakṣatrī kṣamaḥ kṣāmaḥ samīhanaḥ',
    meaning: 'He is inexhaustible, the greatest in bulk, the unborn, the pillar of dharma, the lord of all sacrifices. He is the nave of the celestial wheel, the lord of the stars, patience itself, the reducer, the one who prompts all activity. Each name of the Sahasranama is a complete teaching in itself.',
    tradition: 'hindu', category: 'vishnu_sahasranama',
    tags: ['vishnu', 'sahasranama', 'dharma', 'cosmos', 'names'],
  },
  {
    id: 'vish-saha-uttara-pithika',
    title: 'Bhishma\'s Witness — The Power of the Name',
    source: 'Vishnu Sahasranama — Uttara Pithika',
    original: 'यस्य स्मरणमात्रेण जन्मसंसारबन्धनात् ।\nविमुच्यते नमस्तस्मै विष्णवे प्रभविष्णवे ॥',
    transliteration: 'yasya smaraṇa-mātreṇa janma-saṁsāra-bandhanāt\nvimucyate namas tasmai viṣṇave prabhaviṣṇave',
    meaning: 'By the mere remembrance of whom one is freed from the bondage of birth and the cycle of existence — salutation to that all-powerful Vishnu. — Bhishma\'s closing statement, emphasising that even one name remembered with devotion is enough for liberation.',
    tradition: 'hindu', category: 'vishnu_sahasranama',
    tags: ['vishnu', 'sahasranama', 'liberation', 'remembrance', 'bhishma'],
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
    title: 'Now, the Teaching of Yoga',
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
    id: 'yoga-1-12',
    title: 'Practice and Non-Attachment',
    source: 'Yoga Sutras of Patanjali — Sutra 1.12',
    original: 'अभ्यासवैराग्याभ्यां तन्निरोधः ॥',
    transliteration: 'abhyāsa-vairāgyābhyāṁ tan-nirodhaḥ',
    meaning: 'The cessation of mental fluctuations comes through sustained practice (abhyasa) and non-attachment (vairagya). These two — consistent effort and inner detachment — are the twin pillars of all yogic transformation.',
    tradition: 'hindu', category: 'yoga_sutra',
    tags: ['yoga', 'abhyasa', 'vairagya', 'practice', 'non-attachment'],
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
  {
    id: 'yoga-2-1',
    title: 'The Three-Fold Kriya Yoga',
    source: 'Yoga Sutras of Patanjali — Sutra 2.1',
    original: 'तपःस्वाध्यायेश्वरप्रणिधानानि क्रियायोगः ॥',
    transliteration: 'tapaḥ svādhyāyeśvara-praṇidhānāni kriyā-yogaḥ',
    meaning: 'Austerity, self-study (study of scripture and of one\'s own nature), and surrender to the Lord — these three constitute Kriya Yoga. This is the yoga of active purification, preparatory to the deeper practices of the eight limbs.',
    tradition: 'hindu', category: 'yoga_sutra',
    tags: ['yoga', 'tapas', 'svadhyaya', 'ishvara-pranidhana', 'kriya-yoga'],
  },
  {
    id: 'yoga-2-28',
    title: 'The Eight Limbs of Yoga',
    source: 'Yoga Sutras of Patanjali — Sutra 2.28–29',
    original: 'योगाङ्गानुष्ठानादशुद्धिक्षये ज्ञानदीप्तिराविवेकख्यातेः ॥\nयमनियमासनप्राणायामप्रत्याहारधारणाध्यानसमाधयोऽष्टावङ्गानि ॥',
    transliteration: 'yoga-aṅgānuṣṭhānād aśuddhi-kṣaye jñāna-dīptir ā-viveka-khyāteḥ\nyama-niyama-āsana-prāṇāyāma-pratyāhāra-dhāraṇā-dhyāna-samādhayo\'ṣṭāv aṅgāni',
    meaning: 'By the practice of the limbs of yoga, as impurities are destroyed, the light of knowledge shines — culminating in discriminative wisdom. The eight limbs are: yama (ethical restraints), niyama (observances), asana (posture), pranayama (breath control), pratyahara (withdrawal), dharana (concentration), dhyana (meditation), and samadhi (absorption).',
    tradition: 'hindu', category: 'yoga_sutra',
    tags: ['yoga', 'ashtanga', 'eight-limbs', 'patanjali', 'samadhi'],
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
    id: 'yoga-3-1',
    title: 'Dharana — Concentration',
    source: 'Yoga Sutras of Patanjali — Sutra 3.1',
    original: 'देशबन्धश्चित्तस्य धारणा ॥',
    transliteration: 'deśa-bandhaś cittasya dhāraṇā',
    meaning: 'Concentration (dharana) is the binding of the mind to one place. This is the sixth limb — where the mind is deliberately held at a single point (the breath, a mantra, a flame, or a divine form). It is the beginning of inward turning.',
    tradition: 'hindu', category: 'yoga_sutra',
    tags: ['yoga', 'dharana', 'concentration', 'meditation', 'patanjali'],
  },
  {
    id: 'yoga-4-34',
    title: 'Kaivalya — Liberation',
    source: 'Yoga Sutras of Patanjali — Sutra 4.34',
    original: 'पुरुषार्थशून्यानां गुणानां प्रतिप्रसवः कैवल्यं स्वरूपप्रतिष्ठा वा चितिशक्तिरिति ॥',
    transliteration: 'puruṣārtha-śūnyānāṁ guṇānāṁ pratiprasavaḥ kaivalyaṁ svarūpa-pratiṣṭhā vā citi-śaktir iti',
    meaning: 'Liberation (kaivalya) is when the gunas (qualities of nature) return to their source — having no more purpose to serve consciousness. The pure awareness (Purusha) rests in its own nature. This is the final sutra — the culmination of the entire system of Patanjali\'s yoga.',
    tradition: 'hindu', category: 'yoga_sutra',
    tags: ['yoga', 'kaivalya', 'liberation', 'purusha', 'gunas'],
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
    title: 'Protect the Self Above All',
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
  {
    id: 'chanakya-time',
    title: 'Time Destroys All',
    source: 'Chanakya Niti — Chapter 6',
    original: 'कालः पचति भूतानि कालः संहरते प्रजाः ।\nकालः सुप्तेषु जागर्ति कालो हि दुरतिक्रमः ॥',
    transliteration: 'kālaḥ pacati bhūtāni kālaḥ saṁharate prajāḥ\nkālaḥ supteṣu jāgarti kālo hi duratikramaḥ',
    meaning: 'Time ripens all beings; time destroys all beings. Time is awake even when all sleep. Time is impossible to overcome. — Chanakya\'s meditation on the nature of time, perhaps the most sobering of all his teachings. It is a call to act now.',
    tradition: 'hindu', category: 'chanakya',
    tags: ['chanakya', 'time', 'impermanence', 'action', 'urgency'],
  },
  {
    id: 'chanakya-enemy-within',
    title: 'The Six Enemies Within',
    source: 'Chanakya Niti — Chapter 8',
    original: 'षड् दोषाः पुरुषेणेह हातव्या भूतिमिच्छता ।\nनिद्रा तन्द्रा भयं क्रोधः आलस्यं दीर्घसूत्रता ॥',
    transliteration: 'ṣaḍ doṣāḥ puruṣeṇeha hātavyā bhūtim icchatā\nnidrā tandrā bhayaṁ krodhaḥ ālasyaṁ dīrgha-sūtratā',
    meaning: 'Six faults must be abandoned by the person who seeks prosperity: excessive sleep, drowsiness, fear, anger, laziness, and procrastination. — Chanakya\'s practical list of inner enemies that silently destroy potential.',
    tradition: 'hindu', category: 'chanakya',
    tags: ['chanakya', 'faults', 'self-improvement', 'inner-enemy', 'discipline'],
  },
  {
    id: 'chanakya-knowledge-virtue',
    title: 'The Lamp of Learning',
    source: 'Chanakya Niti — Chapter 12',
    original: 'दानं भोगो नाशस्तिस्रो गतयो भवन्ति वित्तस्य ।\nयो न ददाति न भुङ्क्ते तस्य तृतीया गतिर्भवेत् ॥',
    transliteration: 'dānaṁ bhogo nāśas tisro gatayo bhavanti vittasya\nyo na dadāti na bhuṅkte tasya tṛtīyā gatir bhavet',
    meaning: 'Wealth has only three paths: charity, enjoyment, or destruction. He who neither gives nor enjoys — the third path (destruction) awaits him. Chanakya\'s teaching that wealth hoarded without use or generosity destroys itself.',
    tradition: 'hindu', category: 'chanakya',
    tags: ['chanakya', 'wealth', 'charity', 'generosity', 'destruction'],
  },
  {
    id: 'chanakya-guru',
    title: 'The Guru is the Boat',
    source: 'Chanakya Niti — Chapter 13',
    original: 'गुरुरग्निर्द्विजातीनां वर्णानां ब्राह्मणो गुरुः ।\nपतिरेव गुरुः स्त्रीणां सर्वस्याभ्यागतो गुरुः ॥',
    transliteration: 'gurur agnir dvijātīnāṁ varṇānāṁ brāhmaṇo guruḥ\npatir eva guruḥ strīṇāṁ sarvasyābhyāgato guruḥ',
    meaning: 'Fire is the guru of the twice-born; the brahmin is the guru of the varnas; the husband is the guru for the wife; and the guest is the guru for all. — Chanakya articulates the living forms through which knowledge and grace flow to each person in their station.',
    tradition: 'hindu', category: 'chanakya',
    tags: ['chanakya', 'guru', 'teacher', 'fire', 'wisdom'],
  },
  {
    id: 'chanakya-living-present',
    title: 'Live in the Present',
    source: 'Chanakya Neeti',
    original: 'गते शोको न कर्तव्यो भविष्यं नैव चिन्तयेत् ।\nवर्तमानेन कालेन वर्तयन्ति विचक्षणाः ॥',
    transliteration: 'gate śoko na kartavyo bhaviṣyaṃ naiva cintayet\nvartamānena kālena वर्तयन्ति vicakṣaṇāḥ',
    meaning: 'One should not grieve for the past nor worry about the future; the wise spend their lives attending to the present moment.',
    tradition: 'hindu', category: 'chanakya',
    tags: ['chanakya', 'mindfulness', 'wisdom', 'present'],
  },
  {
    id: 'chanakya-secrecy',
    title: 'The Power of Secrecy',
    source: 'Chanakya Neeti',
    original: 'मनसा चिन्तितं कार्यं वाचा नैव प्रकाशयेत् ।\nमन्त्रेण रक्षयेद् गूढं कार्यं चापि नियोजयेत् ॥',
    transliteration: 'manasā cintitaṃ kāryaṃ vācā naiva prakāśayet\nmantreṇa rakṣayed gūḍhaṃ kāryaṃ cāpi niyojayet',
    meaning: 'A work thought of in the mind should not be revealed by speech. It should be kept secret like a mantra and put into action silently. Success comes to those who act without premature announcement.',
    tradition: 'hindu', category: 'chanakya',
    tags: ['chanakya', 'success', 'strategy', 'focus'],
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
  {
    id: 'sikh-japji-11',
    title: 'Japji Sahib — Pauri 11: Truth Beyond Truth',
    source: 'Sri Guru Granth Sahib — Japji Sahib, Pauri 11',
    original: 'ਸੁਣਿਐ ਸਿਧ ਪੀਰ ਸੁਰਿ ਨਾਥ ॥\nਸੁਣਿਐ ਧਰਤਿ ਧਵਲ ਆਕਾਸ ॥\nਸੁਣਿਐ ਦੀਪ ਲੋਅ ਪਾਤਾਲ ॥\nਸੁਣਿਐ ਪੋਹਿ ਨ ਸਕੈ ਕਾਲੁ ॥',
    transliteration: 'suṇiai sidh pīr sur nāth\nsuṇiai dharat dhaval ākās\nsuṇiai dīp lo-a pātāl\nsuṇiai pohi na sakai kāl',
    meaning: 'By listening — the Siddhas, spiritual masters, heroes and Nathas (yogis). By listening — the earth, its support and the sky. By listening — the continents, worlds and nether regions. By listening — death cannot touch you. One of several pauris in which Guru Nanak praises the transformative power of listening to the Nam with full attention.',
    tradition: 'sikh', category: 'nitnem',
    tags: ['japji', 'listening', 'naam', 'guru-nanak', 'liberation'],
  },
  {
    id: 'sikh-sukhmani-2',
    title: 'Sukhmani Sahib — The Name Sustains All',
    source: 'Sri Guru Granth Sahib — Sukhmani Sahib, Ashtapadee 1 (Guru Arjan Dev)',
    original: 'ਸੁਖਮਨੀ ਸੁਖ ਅੰਮ੍ਰਿਤ ਪ੍ਰਭ ਨਾਮੁ ॥\nਭਗਤ ਜਨਾ ਕੈ ਮਨਿ ਬਿਸ੍ਰਾਮੁ ॥ ਰਹਾਉ ॥',
    transliteration: 'sukhmanī sukh amrit prabh nāmu\nbhagat janā kai man bisrāmu. rahāu',
    meaning: 'Sukhmani — peace of mind — is the ambrosial Name of God. It is the resting place of the minds of God\'s devotees. Pause. — The refrain (rahāu) of Sukhmani Sahib, which Guru Arjan Dev calls the "jewel of peace" — the Name of God is itself the seat of rest for the devotee\'s restless mind.',
    tradition: 'sikh', category: 'gurbani',
    tags: ['sukhmani', 'naam', 'peace', 'guru-arjan-dev', 'devotion'],
  },
  {
    id: 'sikh-guru-nanak-teaching',
    title: 'Guru Nanak — Truth Is the Name',
    source: 'Sri Guru Granth Sahib — SGGS p. 1153 (Guru Nanak)',
    original: 'ਸਚੁ ਕਹੋ ਸਚੁ ਸੁਣਹੁ ਜਨਹੁ ਸਚ ਕੀ ਬੇਲਾ ॥\nਸੁਖੁ ਦੇਵੈ ਦੁਖੁ ਲੇ ਜਾਇ ਕਰੇ ਅਪਨੇ ਚੇਲਾ ॥',
    transliteration: 'sacu kaho sacu suṇahu janahu sac kī belā\nsukhu devai dukhu le jāi kare apane celā',
    meaning: 'Speak the Truth; listen to the Truth, O people — this is the time of Truth. He bestows peace and takes away pain — He makes us His own disciples. — Guru Nanak\'s direct exhortation: Truth is not merely a concept but the living name of God, and the hour to embody it is always now.',
    tradition: 'sikh', category: 'gurbani',
    tags: ['guru-nanak', 'truth', 'naam', 'sach', 'teaching'],
  },
  {
    id: 'sikh-guru-gobind-singh-teaching',
    title: 'Guru Gobind Singh — The Saint-Soldier',
    source: 'Dasam Granth — Zafarnama, Guru Gobind Singh',
    original: 'ਚੁ ਕਾਰ ਅਜ਼ ਹਮਹ ਹੀਲਤੇ ਦਰ ਗੁਜ਼ਸ਼ਤ ॥\nਹਲਾਲ ਅਸਤ ਬੁਰਦਨ ਬ ਸ਼ਮਸ਼ੀਰ ਦਸਤ ॥',
    transliteration: 'cu kār az hamah hīlate dar guzasht\nhalāl ast burdan ba śamśīr dast',
    meaning: 'When all other means have been exhausted and every avenue tried — then it is righteous to pick up the sword. — From the Zafarnama (Letter of Victory), Guru Gobind Singh\'s Persian letter to Emperor Aurangzeb. A teaching that establishes the principle of just resistance only after all peaceful means are exhausted.',
    tradition: 'sikh', category: 'gurbani',
    tags: ['guru-gobind-singh', 'justice', 'zafarnama', 'courage', 'righteousness'],
  },
  {
    id: 'sikh-guru-tegh-bahadur',
    title: 'Guru Tegh Bahadur — Beyond Fear and Craving',
    source: 'Sri Guru Granth Sahib — Salok Mahalla 9 (Guru Tegh Bahadur)',
    original: 'ਭੈ ਕਾਹੂ ਕਉ ਦੇਤ ਨਹਿ ਨਹਿ ਭੈ ਮਾਨਤ ਆਨ ॥\nਕਹੁ ਨਾਨਕ ਸੁਨਿ ਰੇ ਮਨਾ ਗਿਆਨੀ ਤਾਹਿ ਬਖਾਨਿ ॥',
    transliteration: 'bhai kāhū kau det nahi nahi bhai mānat ān\nkahu nānak sun re manā giānī tāhi bakhāni',
    meaning: 'One who does not cause fear in others and who does not fear anyone else — says Nanak, listen O mind, call such a one truly wise. — Guru Tegh Bahadur\'s definition of the jñāni (wise one): not the scholar, but the one who has transcended both the giving of fear and the reception of it. A verse that defined his own martyrdom.',
    tradition: 'sikh', category: 'gurbani',
    tags: ['guru-tegh-bahadur', 'fearlessness', 'wisdom', 'salok', 'courage'],
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
  {
    id: 'dham-103',
    title: 'Conquer Yourself',
    source: 'Dhammapada — Verse 103–104',
    original: 'Yo sahassaṁ sahassena saṅgāme mānuse jine\nEkañca jeyyamattānaṁ sa ve saṅgāmajuttamo',
    transliteration: 'yo sahassaṁ sahassena saṅgāme mānuse jine\nekañca jeyyam attānaṁ sa ve saṅgāma-juttamo',
    meaning: 'Though one should conquer a thousand thousand men in battle, the one who conquers himself is the greatest warrior of all. — One of the most quoted Dhammapada verses, placing inner conquest above all external achievement. The battle is always within.',
    tradition: 'buddhist', category: 'dhammapada',
    tags: ['self-conquest', 'discipline', 'inner-battle', 'dhammapada', 'wisdom'],
  },
  {
    id: 'sutta-nipata-ratana',
    title: 'Ratana Sutta — Jewel Discourse',
    source: 'Sutta Nipata 2.1 (Pali Canon)',
    original: 'Yañkiñci vittaṁ idha vā huraṁ vā\nSaggassa vā yaṁ ratanaṁ paṇītaṁ\nNa no samaṁ atthi tathāgatena\nIdampi buddhe ratanaṁ paṇītaṁ',
    transliteration: 'yañkiñci vittaṁ idha vā huraṁ vā\nsaggassa vā yaṁ ratanaṁ paṇītaṁ\nna no samaṁ atthi tathāgatena\nidampi buddhe ratanaṁ paṇītaṁ',
    meaning: 'Whatever precious jewels there may be here or in the beyond — or in the heavens — none is comparable to the Tathagata (the Buddha). This precious jewel is the Buddha. — From the Ratana Sutta, a protective chant of great antiquity, recited by the Buddha in Vesali. It affirms the incomparable worth of the Triple Gem.',
    tradition: 'buddhist', category: 'sutra',
    tags: ['ratana', 'triple-gem', 'buddha', 'protection', 'sutta'],
  },
  {
    id: 'majjhima-mindfulness-1',
    title: 'Satipatthana — Foundations of Mindfulness',
    source: 'Majjhima Nikaya 10 — Satipaṭṭhāna Sutta',
    original: 'Ekāyano ayaṁ bhikkhave maggo sattānaṁ visuddhiyā\nSokapariddavānaṁ samatikkamāya dukkhadomanassānaṁ atthaṅgamāya\nNyāyassa adhigamāya nibbānassa sacchikiriyāya\nYadidaṁ cattāro satipaṭṭhānā',
    transliteration: 'ekāyano ayaṁ bhikkhave maggo sattānaṁ visuddhiyā\nsoka-pariddavānaṁ samatikkamāya dukkha-domanassānaṁ atthaṅgamāya\nnāyassa adhigamāya nibbānassa sacchikiriyāya\nyad idaṁ cattāro satipaṭṭhānā',
    meaning: 'This is the direct path, monks, for the purification of beings, for overcoming sorrow and lamentation, for the disappearance of suffering and grief, for the attainment of the way, for the realisation of Nibbana — namely, the four foundations of mindfulness. The foundational teaching on mindfulness: awareness of body, feelings, mind-states, and mental objects.',
    tradition: 'buddhist', category: 'sutra',
    tags: ['mindfulness', 'satipatthana', 'meditation', 'majjhima-nikaya', 'nirvana'],
  },
  {
    id: 'buddha-anattalakkhana',
    title: 'Anattalakkhana Sutta — The Teaching on Non-Self',
    source: 'Samyutta Nikaya 22.59 — Second Discourse of the Buddha',
    original: 'Rūpaṁ bhikkhave anattā\nVedanā anattā\nSaññā anattā\nSaṅkhārā anattā\nViññāṇaṁ anattā',
    transliteration: 'rūpaṁ bhikkhave anattā\nvedanā anattā\nsaññā anattā\nsaṅkhārā anattā\nviññāṇaṁ anattā',
    meaning: 'Form is not-self, monks. Feeling is not-self. Perception is not-self. Mental formations are not-self. Consciousness is not-self. — The Buddha\'s second discourse, delivered to the five ascetics at Varanasi. Through systematic analysis of the five aggregates (khandhas), he teaches that there is no unchanging self to be found in any aspect of experience.',
    tradition: 'buddhist', category: 'sutra',
    tags: ['anatta', 'non-self', 'five-aggregates', 'khandha', 'liberation'],
  },
  {
    id: 'dham-183-walk',
    title: 'The Middle Way — Walking Between Extremes',
    source: 'Majjhima Nikaya 36 — Mahāsaccaka Sutta',
    original: 'Dveme bhikkhave antā pabbajitena na sevitabbā\nKatame dve? Yo cāyaṁ kāmesu kāmasukhallikānuyogo\nHīno gammo pothujjaniko anariyo anatthasaṁhito\nYo cāyaṁ attakilamathānuyogo dukkho anariyo anatthasaṁhito\nEte te bhikkhave ubho ante anupagamma\nmajjhimā paṭipadā tathāgatena abhisambuddhā',
    transliteration: 'dveme bhikkhave antā pabbajitena na sevitabbā\nkatame dve? yo cāyaṁ kāmesu kāmasukhallikānuyogo\nhīno gammo pothujjaniko anariyo anatthasaṁhito\nyo cāyaṁ attakilamathānuyogo dukkho anariyo anatthasaṁhito\nete te bhikkhave ubho ante anupagamma\nmajjhimā paṭipadā tathāgatena abhisambuddhā',
    meaning: 'There are these two extremes, monks, that should not be practiced: indulgence in sensual pleasure — which is low, worldly, ignoble and unbeneficial — and indulgence in self-mortification — which is painful, ignoble and unbeneficial. Without approaching these two extremes, the Middle Way has been awakened to by the Tathagata. — The Buddha\'s declaration of the Middle Way, setting the course for all Buddhist practice.',
    tradition: 'buddhist', category: 'sutra',
    tags: ['middle-way', 'eightfold-path', 'extremes', 'majjhima-nikaya', 'buddha'],
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
    title: 'Dasavaikalika Sutra — Dharma Is the Highest Blessing',
    source: 'Dasavaikalika Sutra — Shayyambhava, Verse 1.1',
    original: 'धम्मो मंगलमुक्किट्ठं अहिंसा संजमो तवो ।\nदेवा वि तं नमंसंति जस्स धम्मे सया मणो ॥',
    transliteration: 'dhammo maṅgalamukkiṭṭhaṁ ahiṁsā saṁjamo tavo\ndevā vi taṁ namaṁsaṁti jassa dhamme sayā maṇo',
    meaning: 'Dharma (righteousness) is the highest auspiciousness — non-violence, self-restraint, and austerity. Even the gods bow down to one whose mind is always absorbed in Dharma. This verse is one of the most sacred in Jain tradition, recited at the start of worship.',
    tradition: 'jain', category: 'jain_scripture',
    tags: ['ahimsa', 'dharma', 'jain', 'austerity', 'dasavaikalika'],
  },
  {
    id: 'jain-uttaradhyayana-1',
    title: 'Uttaradhyayana Sutra — How Rare Is Human Birth',
    source: 'Uttaradhyayana Sutra — Chapter 3.1',
    original: 'दुल्लहं खलु माणुसत्तं तस्स वि य आरिए देसे ।\nसद्धा सुई य धम्मस्स मेधावी अमुणिप्पिओ ॥',
    transliteration: 'dullhaṁ khalu māṇusattaṁ tassa vi ya ārie dese\nsaddhā suī ya dhammassa medhāvī amuṇippio',
    meaning: 'How rare is human birth — and rarer still to be born in a noble land. Rare too is faith, the hearing of the Dhamma, wisdom, and a life pleasing to the ascetics. — The Uttaradhyayana Sutra on the precious opportunity of human life, calling for urgency in spiritual practice. A teaching that parallels similar insights across all dharmic traditions.',
    tradition: 'jain', category: 'jain_scripture',
    tags: ['human-birth', 'opportunity', 'jain', 'dharma', 'urgency'],
  },
  {
    id: 'jain-mahavir-know-yourself',
    title: 'Mahavir — Know the Soul, Know All',
    source: 'Acharanga Sutra 1.3.4 — Mahavir',
    original: 'एगे आया, एगे आयाणं जाणइ, एगे आयाणं परिजाणइ ।\nजे आयाणं जाणइ स सव्वं जाणइ, जे आयाणं परिजाणइ स सव्वं परिजाणइ ॥',
    transliteration: 'ege āyā, ege āyāṇaṁ jāṇai, ege āyāṇaṁ parijāṇai\nje āyāṇaṁ jāṇai sa savvaṁ jāṇai, je āyāṇaṁ parijāṇai sa savvaṁ parijāṇai',
    meaning: 'The soul is one; know the soul; know the soul thoroughly. One who knows the soul knows everything; one who knows the soul thoroughly knows everything thoroughly. — Mahavir\'s central teaching: self-knowledge is the root of all knowledge. The journey inward is the journey to omniscience.',
    tradition: 'jain', category: 'jain_scripture',
    tags: ['mahavir', 'soul', 'self-knowledge', 'omniscience', 'acharanga'],
  },
  {
    id: 'jain-parshva-chaturyama',
    title: 'Parshvanatha — The Fourfold Restraint',
    source: 'Jain Tradition — Teachings of the 23rd Tirthankara',
    original: 'अहिंसा, सत्यं, अस्तेयं, अपरिग्रहः — इति चातुर्यामः ।',
    transliteration: 'ahiṁsā satyaṁ asteyaṁ aparigrahaḥ — iti cāturyāmaḥ',
    meaning: 'Non-violence, truth, non-stealing, non-possessiveness — these four vows constitute the Chaturyama (Fourfold Restraint). The code of Parshvanatha, the 23rd Tirthankara. Mahavir later expanded this into the five great vows (Panchavrata) by adding celibacy. Parshva\'s code is among the oldest recorded ethical frameworks in Indian thought.',
    tradition: 'jain', category: 'jain_scripture',
    tags: ['parshvanatha', 'fourfold-vow', 'ethics', 'ahimsa', 'jain'],
  },
  {
    id: 'jain-kundakunda-niyamasara',
    title: 'Niyamasara — The Pure Soul Knows, Sees, Stands',
    source: 'Niyamasara — Kundakunda, Verse 7',
    original: 'जो जाणदि सो णाणी, जो भासदि सो खलु भासओ होदि ।\nजो पस्सदि सो पस्सिदा, जो चिट्ठदि सो चेव णिच्छओ ॥',
    transliteration: 'jo jāṇadi so ṇāṇī, jo bhāsadi so khalu bhāsao hodi\njo passadi so passidā, jo ciṭṭhadi so ceva ṇiccho',
    meaning: 'One who knows is the knower; one who speaks is indeed the speaker. One who sees is the perceiver; one who stands (remains) is indeed the truth. — Kundakunda\'s Niyamasara ("Essence of Restraint") on the nature of the pure soul as an uncompounded knower — distinct from all it knows. A foundational text of Digambara Jain philosophy.',
    tradition: 'jain', category: 'jain_scripture',
    tags: ['kundakunda', 'soul', 'knowledge', 'niyamasara', 'digambara'],
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

// ─── Pathshala sections (for tracks / navigation) ─────────────────────────────
export interface LibrarySection {
  id:        string;
  title:     string;
  emoji:     string;
  tradition: LibraryTradition;
  category:  LibraryCategory;
  desc:      string;
  count:     number;
}

export interface PathshalaTraditionMeta {
  id: LibraryTradition;
  label: string;
  emoji: string;
  description: string;
  studyPrompt: string;
}

export interface PathshalaTrackGroup {
  id: string;
  tradition: LibraryTradition;
  title: string;
  desc: string;
  sectionIds: string[];
}

export interface PathshalaSectionDetail {
  sectionId: string;
  pathType: 'Canonical study' | 'Practice track' | 'Commentarial / teaching track';
  corpusState: 'Passage set live' | 'Catalog-first expansion' | 'Rights review required' | 'Complete local text live';
  liveScope: string;
  completeTextGoal: string;
  sourceTargets: string[];
  studyModes: string[];
}

export const LIBRARY_SECTIONS: LibrarySection[] = [
  // ── Vaishnava ────────────────────────────────────────────────────────────────
  { id: 'gita',               title: 'Bhagavad Gita',         emoji: '🦚', tradition: 'hindu',    category: 'gita',               desc: 'Krishna\'s eternal teachings to Arjuna on dharma, yoga & liberation',       count: GITA_ENTRIES.length },
  { id: 'bhagavatam',         title: 'Srimad Bhagavatam',     emoji: '🌸', tradition: 'hindu',    category: 'bhagavatam',         desc: 'The great Purana of devotion — Krishna, Vishnu & the nature of reality',   count: BHAGAVATAM_ENTRIES.length },
  { id: 'puranas',            title: 'Mahapuranas',           emoji: '🔱', tradition: 'hindu',    category: 'purana',             desc: 'Wisdom from Shiva, Vishnu, and Devi Puranas',   count: PURANA_ENTRIES.length },
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

export const PATHSHALA_TRADITIONS: PathshalaTraditionMeta[] = [
  {
    id: 'hindu',
    label: 'Hindu Pathshala',
    emoji: '🕉️',
    description: 'Gita, Upanishads, Vedas, epics, bhakti, yoga, and disciplined study tracks.',
    studyPrompt: 'Begin from the text-family that matches your current path: Shruti, Itihasa, Bhakti, or Sadhana.',
  },
  {
    id: 'sikh',
    label: 'Sikh Pathshala',
    emoji: '☬',
    description: 'Guru Granth Sahib study, Gurbani, and daily bani for grounded remembrance.',
    studyPrompt: 'Move from Gurbani and Nitnem toward steady recitation, reflection, and return.',
  },
  {
    id: 'buddhist',
    label: 'Buddhist Pathshala',
    emoji: '☸️',
    description: 'Foundational Dhamma, early teachings, compassion, mindfulness, and steady understanding.',
    studyPrompt: 'Start with foundational Dhamma, then deepen through suttas, reflection, and practical study.',
  },
  {
    id: 'jain',
    label: 'Jain Pathshala',
    emoji: '🤲',
    description: 'Agama-rooted study, ahimsa, discipline, doctrine, and foundational Jain wisdom.',
    studyPrompt: 'Use the Agama and doctrine tracks to build a quieter, clearer path of understanding.',
  },
];

export const PATHSHALA_TRACK_GROUPS: PathshalaTrackGroup[] = [
  {
    id: 'hindu-shruti',
    tradition: 'hindu',
    title: 'Shruti & Vedanta',
    desc: 'Core wisdom texts, Vedantic foundations, and the philosophical heart of Sanatana study.',
    sectionIds: ['gita', 'upanishad', 'veda'],
  },
  {
    id: 'hindu-itihasa',
    tradition: 'hindu',
    title: 'Itihasa & Epics',
    desc: 'Civilizational narratives, Rama katha, and the lived ideals of dharma in story form.',
    sectionIds: ['ramayana', 'ramcharitmanas'],
  },
  {
    id: 'hindu-bhakti',
    tradition: 'hindu',
    title: 'Bhakti & Devotional Practice',
    desc: 'Purana, sahasranama, stotra, and temple-facing recitation for heart-centered study.',
    sectionIds: ['bhagavatam', 'vishnu_sahasranama', 'stotra', 'shiva_purana', 'shakta'],
  },
  {
    id: 'hindu-sadhana',
    tradition: 'hindu',
    title: 'Sadhana & Living Wisdom',
    desc: 'Yoga, discipline, ethics, and practical guidance for steadier daily living.',
    sectionIds: ['yoga_sutra', 'chanakya'],
  },
  {
    id: 'sikh-gurbani',
    tradition: 'sikh',
    title: 'Gurbani & Nitnem',
    desc: 'Foundational bani, daily recitation, and Guru-centered remembrance.',
    sectionIds: ['gurbani'],
  },
  {
    id: 'buddhist-foundations',
    tradition: 'buddhist',
    title: 'Foundational Dhamma',
    desc: 'Early teachings, ethical clarity, mindfulness, and the path of practice.',
    sectionIds: ['dhammapada'],
  },
  {
    id: 'jain-foundations',
    tradition: 'jain',
    title: 'Agama & Doctrine',
    desc: 'Agamic study, doctrinal foundations, vows, and the disciplines of ahimsa.',
    sectionIds: ['jain'],
  },
];

export const PATHSHALA_SECTION_DETAILS: PathshalaSectionDetail[] = [
  {
    sectionId: 'gita',
    pathType: 'Canonical study',
    corpusState: 'Complete local text live',
    liveScope: 'The full chapter-and-verse Bhagavad Gita corpus is now live in-app using a public-domain translation with source attribution, bookmarks, chapter navigation, and return loops.',
    completeTextGoal: 'Deepen this into a fuller study system with script preferences, commentary layers, quizzes, and recitation support on top of the complete local text.',
    sourceTargets: ['Wikisource (Annie Besant public-domain edition)', 'Gita Supersite for official audio and companion study layers'],
    studyModes: ['Verse study', 'chapter summaries', 'bookmarks', 'AI study prompts', 'future quizzes'],
  },
  {
    sectionId: 'bhagavatam',
    pathType: 'Canonical study',
    corpusState: 'Rights review required',
    liveScope: 'Selected devotional passages are live now as a study-entry surface.',
    completeTextGoal: 'Grow into a Skandha-structured Bhagavata study path once text rights and editorial scope are clear.',
    sourceTargets: ['rights-cleared Bhagavata editions', 'publisher-approved corpora'],
    studyModes: ['Bhakti passages', 'narrative study', 'festival-linked reading'],
  },
  {
    sectionId: 'vishnu_sahasranama',
    pathType: 'Practice track',
    corpusState: 'Catalog-first expansion',
    liveScope: 'Representative names and study passages are live now.',
    completeTextGoal: 'Support full recitation structure, name-by-name study, and memory loops.',
    sourceTargets: ['Mahabharata critical references', 'rights-cleared recitation texts'],
    studyModes: ['Recitation', 'name study', 'flashcards'],
  },
  {
    sectionId: 'ramayana',
    pathType: 'Canonical study',
    corpusState: 'Rights review required',
    liveScope: 'A Kanda-first Valmiki Ramayana path is now live, with narrative structure, reading plans, and linked local passages inside the broader epic arc.',
    completeTextGoal: 'Expand from the Kanda path into full local canto-level Ramayana study with narrative continuity and character-path lessons.',
    sourceTargets: ['Wikisource (Griffith public-domain text)', 'ValmikiRamayan.net study index', 'rights-cleared Valmiki editions for deeper local ingestion'],
    studyModes: ['Narrative study', 'Kanda journey', 'character arcs', 'ethics prompts'],
  },
  {
    sectionId: 'ramcharitmanas',
    pathType: 'Commentarial / teaching track',
    corpusState: 'Rights review required',
    liveScope: 'Selected devotional passages are live now.',
    completeTextGoal: 'Grow into a bhakti-facing study path with kand and chaupai structure where rights allow.',
    sourceTargets: ['rights-cleared Ramcharitmanas editions', 'public devotional references'],
    studyModes: ['Bhakti reading', 'recitation', 'festival-linked study'],
  },
  {
    sectionId: 'upanishad',
    pathType: 'Canonical study',
    corpusState: 'Complete local text live',
    liveScope: 'The 13 principal Upanishads are live locally as full translated study texts, with text-by-text entry pages.',
    completeTextGoal: 'Add original-script, transliteration, commentary, and wider Upanishad expansion beyond the principal thirteen.',
    sourceTargets: ['Robert Ernest Hume public-domain translation via Internet Archive', 'Vedic Heritage Portal', 'rights-cleared Sanskrit sources for original-text layers'],
    studyModes: ['Text-by-text study', 'mahavakya study', 'concept cards', 'teacher-guided reading later'],
  },
  {
    sectionId: 'veda',
    pathType: 'Canonical study',
    corpusState: 'Catalog-first expansion',
    liveScope: 'Representative hymns and prayers are live now.',
    completeTextGoal: 'Move toward a curated Vedic study catalog rather than a false claim of full Veda coverage on day one.',
    sourceTargets: ['Vedic Heritage Portal', 'rights-cleared Vedic resources'],
    studyModes: ['Hymn study', 'chant context', 'ritual orientation'],
  },
  {
    sectionId: 'yoga_sutra',
    pathType: 'Canonical study',
    corpusState: 'Catalog-first expansion',
    liveScope: 'Foundational sutras are live now.',
    completeTextGoal: 'Support sutra-by-sutra study, concept chains, and practice-oriented revision loops.',
    sourceTargets: ['rights-cleared Yoga Sutra editions', 'scholarly translations'],
    studyModes: ['Sutra study', 'concept maps', 'future revision cards'],
  },
  {
    sectionId: 'chanakya',
    pathType: 'Commentarial / teaching track',
    corpusState: 'Catalog-first expansion',
    liveScope: 'Selected niti passages are live now.',
    completeTextGoal: 'Position as a practical wisdom lane alongside rather than above canonical scripture study.',
    sourceTargets: ['rights-cleared Chanakya Niti editions', 'scholarly Sanskrit references'],
    studyModes: ['Practical wisdom', 'scenario cards', 'discussion prompts'],
  },
  {
    sectionId: 'shiva_purana',
    pathType: 'Practice track',
    corpusState: 'Rights review required',
    liveScope: 'Shaiva hymns and devotional study passages are live now.',
    completeTextGoal: 'Expand into Shaiva text families and recitation paths once the corpus rights are clear.',
    sourceTargets: ['Muktabodha Digital Library', 'rights-cleared Shaiva editions'],
    studyModes: ['Devotional reading', 'stotra study', 'recitation support'],
  },
  {
    sectionId: 'shakta',
    pathType: 'Practice track',
    corpusState: 'Rights review required',
    liveScope: 'Selected Devi-oriented passages are live now.',
    completeTextGoal: 'Expand into a clearer Devi Mahatmyam and Shakta study path with source-aware structure.',
    sourceTargets: ['Muktabodha Digital Library', 'rights-cleared Shakta editions'],
    studyModes: ['Devi study', 'festival-linked reading', 'recitation support'],
  },
  {
    sectionId: 'stotra',
    pathType: 'Practice track',
    corpusState: 'Catalog-first expansion',
    liveScope: 'Daily-use mantras and stotras are live now.',
    completeTextGoal: 'Support recitation packs, memorization, and daily practice loops.',
    sourceTargets: ['rights-cleared recitation sources', 'tradition-reviewed liturgical texts'],
    studyModes: ['Daily recitation', 'memory cards', 'beginner practice'],
  },
  {
    sectionId: 'gurbani',
    pathType: 'Canonical study',
    corpusState: 'Catalog-first expansion',
    liveScope: 'Gurbani and Nitnem passages are live now under one Sikh study track.',
    completeTextGoal: 'Deepen toward fuller bani structure and source-linked Sikh Pathshala flows once usage terms are finalized.',
    sourceTargets: ['BaniDB', 'SriGranth', 'SGPC-aligned references'],
    studyModes: ['Bani study', 'Nitnem return loop', 'future recitation progress'],
  },
  {
    sectionId: 'dhammapada',
    pathType: 'Canonical study',
    corpusState: 'Catalog-first expansion',
    liveScope: 'Foundational Buddhist passages are live now for entry-level Dhamma study.',
    completeTextGoal: 'Expand toward a source-grounded early-Buddhist study path with sutta families and clearer canon structure.',
    sourceTargets: ['SuttaCentral', '84000 for later expansion'],
    studyModes: ['Dhamma reading', 'concept review', 'mindfulness-linked prompts'],
  },
  {
    sectionId: 'jain',
    pathType: 'Canonical study',
    corpusState: 'Rights review required',
    liveScope: 'Foundational Jain passages are live now as a first doctrinal surface.',
    completeTextGoal: 'Stay catalog-first until permissions are clarified for broader Agama ingestion.',
    sourceTargets: ['Jain eLibrary', 'permission-cleared Jain publishers or institutions'],
    studyModes: ['Doctrine study', 'ahimsa concepts', 'future quizzes'],
  },
];

export function getSectionsByTradition(tradition: LibraryTradition): LibrarySection[] {
  return LIBRARY_SECTIONS.filter((section) => section.tradition === tradition);
}

export function isLibraryTradition(value: string): value is LibraryTradition {
  return PATHSHALA_TRADITIONS.some((item) => item.id === value);
}

export function getPathshalaTraditionMeta(tradition: LibraryTradition): PathshalaTraditionMeta {
  return PATHSHALA_TRADITIONS.find((item) => item.id === tradition) ?? PATHSHALA_TRADITIONS[0];
}

export function getPathshalaTrackGroups(tradition: LibraryTradition): PathshalaTrackGroup[] {
  return PATHSHALA_TRACK_GROUPS.filter((group) => group.tradition === tradition);
}

export function getPathshalaTrackGroupById(groupId: string): PathshalaTrackGroup | undefined {
  return PATHSHALA_TRACK_GROUPS.find((group) => group.id === groupId);
}

export function getPathshalaTrackGroupForSection(sectionId: string): PathshalaTrackGroup | undefined {
  return PATHSHALA_TRACK_GROUPS.find((group) => group.sectionIds.includes(sectionId));
}

export function getDefaultSectionForTradition(tradition: LibraryTradition): string {
  return getSectionsByTradition(tradition)[0]?.id ?? 'gita';
}

export function getLibrarySectionById(sectionId: string): LibrarySection | undefined {
  return LIBRARY_SECTIONS.find((section) => section.id === sectionId);
}

export function getPathshalaSectionDetail(sectionId: string): PathshalaSectionDetail | undefined {
  return PATHSHALA_SECTION_DETAILS.find((detail) => detail.sectionId === sectionId);
}

export function getEntriesBySection(sectionId: string): LibraryEntry[] {
  // Multi-array sections need special handling
  if (sectionId === 'gurbani')    return [...GURBANI_ENTRIES, ...NITNEM_ENTRIES];
  if (sectionId === 'dhammapada') return [...BUDDHIST_ENTRIES, ...BUDDHIST_ADDITIONAL_ENTRIES];
  if (sectionId === 'jain')       return [...JAIN_ENTRIES, ...JAIN_ADDITIONAL_ENTRIES];

  const section = LIBRARY_SECTIONS.find((s) => s.id === sectionId);
  if (!section) return ALL_LIBRARY_ENTRIES;
  return ALL_LIBRARY_ENTRIES.filter((e) => e.category === section.category);
}

export function getEntriesByTradition(tradition: LibraryTradition): LibraryEntry[] {
  return ALL_LIBRARY_ENTRIES.filter((entry) => entry.tradition === tradition);
}

export function getLibraryEntryById(entryId: string): LibraryEntry | undefined {
  return ALL_LIBRARY_ENTRIES.find((entry) => entry.id === entryId);
}

export function getSectionForEntry(entry: LibraryEntry): LibrarySection | undefined {
  return LIBRARY_SECTIONS.find((section) => (
    (section.tradition === entry.tradition && section.category === entry.category) ||
    (section.id === 'gurbani' && entry.tradition === 'sikh' && (entry.category === 'gurbani' || entry.category === 'nitnem'))
  ));
}

export function getRelatedEntries(entry: LibraryEntry, limit = 4): LibraryEntry[] {
  const section = getSectionForEntry(entry);

  if (section) {
    return getEntriesBySection(section.id)
      .filter((candidate) => candidate.id !== entry.id)
      .slice(0, limit);
  }

  return getEntriesByTradition(entry.tradition)
    .filter((candidate) => candidate.id !== entry.id)
    .slice(0, limit);
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
