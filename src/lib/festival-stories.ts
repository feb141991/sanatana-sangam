/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Shoonaya — Festival Stories
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Handcrafted rich content for the top ~20 festivals across all four traditions.
 * Each story surfaces in a tappable card on HomeDashboard when the festival
 * is ≤ 7 days away.
 *
 * Content per festival:
 *  - origin      : 2-3 sentences on the mythic/historic root
 *  - significance: core spiritual meaning in one paragraph
 *  - rituals     : 3-4 concrete practices observed
 *  - shloka      : a primary verse (Sanskrit / Punjabi / Pali) with translation
 *  - practice    : a "Today, do X…" call to action for the user
 * ─────────────────────────────────────────────────────────────────────────────
 */

export interface ShlokaEntry {
  text: string;            // Original script
  transliteration?: string;
  translation: string;
  source: string;          // e.g. "Bhagavad Gita 9.26"
}

export interface FestivalStory {
  /** Must match the `name` field in FESTIVALS_2026 exactly */
  slug: string;
  emoji: string;
  tradition: 'hindu' | 'sikh' | 'buddhist' | 'jain' | 'all';
  origin: string;
  significance: string;
  rituals: string[];
  shloka: ShlokaEntry;
  practice: string;
}

export const FESTIVAL_STORIES: FestivalStory[] = [

  // ── Makar Sankranti ────────────────────────────────────────────────────────
  {
    slug: 'Makar Sankranti',
    emoji: '🪁',
    tradition: 'hindu',
    origin:
      'Makar Sankranti marks the precise moment the Sun crosses into Capricorn (Makara rashi), signalling the end of the winter solstice period. The Vedas regard this northward journey of the Sun — Uttarayan — as the day of the gods, when the divine becomes more accessible. The festival is celebrated under different names across India: Pongal in Tamil Nadu, Lohri in Punjab, Bihu in Assam.',
    significance:
      'Sankranti is the festival of light returning. It teaches that just as the Sun turns north bringing warmth and harvest, the seeker too can turn inward — away from the tamas of winter — toward sattva and clarity. Bathing in sacred rivers on this day is said to dissolve accumulated karma, and charity (daan) given on Sankranti multiplies manifold.',
    rituals: [
      'Ritual dip (snan) in a river or sea at sunrise, ideally the Ganga, Godavari, or any flowing water near you',
      'Offering sesame-jaggery (til-gul) to family and elders with the words "Til-gul ghya, god god bola" (take sweetness, speak sweetly)',
      'Flying kites — the upward pull symbolises the soul\'s aspiration toward the divine light',
      'Donating sesame, blankets, and food to the needy — daan on Sankranti is considered ten times more meritorious',
    ],
    shloka: {
      text: 'सूर्य आत्मा जगतस्तस्थुषश्च',
      transliteration: 'Sūrya ātmā jagatas tasthuṣaś ca',
      translation: 'The Sun is the soul of all that moves and all that is still.',
      source: 'Rigveda 1.115.1',
    },
    practice:
      'Today, wake at sunrise and face east for five minutes. Let the first light touch your face and set one intention for the northward half of the year.',
  },

  // ── Vasant Panchami ────────────────────────────────────────────────────────
  {
    slug: 'Vasant Panchami',
    emoji: '🌼',
    tradition: 'hindu',
    origin:
      'Vasant Panchami falls on the fifth day (panchami) of the bright fortnight in Magha, when Brahma is said to have created Goddess Saraswati — the embodiment of knowledge, music, and the flowing river — to fill the world with sound, beauty, and wisdom. Spring (vasant) begins here, and yellow — the colour of ripening mustard fields — becomes the festival\'s signature.',
    significance:
      'Saraswati represents the power of discernment: the ability to distinguish truth from noise. Worshipping her on Vasant Panchami is a prayer to keep the mind sharp and the tongue truthful. Students place their books and instruments before her image, acknowledging that all learning ultimately flows from the divine source.',
    rituals: [
      'Wear yellow clothing to honour the arrival of spring and the golden radiance of Saraswati',
      'Place books, pens, musical instruments, or tools of your craft near a Saraswati image and offer yellow flowers (marigold, yellow rose)',
      'Begin a new book, course, or practice today — Vasant Panchami is the auspicious start for all learning endeavours',
      'Offer kheer (rice pudding) or yellow sweets as prasad and share with family',
    ],
    shloka: {
      text: 'या कुन्देन्दुतुषारहारधवला या शुभ्रवस्त्रावृता\nया वीणावरदण्डमण्डितकरा या श्वेतपद्मासना',
      transliteration:
        'Yā kundendutushārahāradhavalā yā shubhravstrāvṛtā\nyā vīṇāvaradaṇḍamaṇḍitakarā yā śvetapadmāsanā',
      translation:
        'She who is as white as the jasmine and the full moon, who is draped in pure white, whose hands are adorned with the graceful vina, who is seated on a white lotus…',
      source: 'Saraswati Vandana (traditional)',
    },
    practice:
      'Today, write one sentence about something you genuinely wish to learn this year. Place it in your journal or near your workspace — let Saraswati witness the intention.',
  },

  // ── Maha Shivaratri ────────────────────────────────────────────────────────
  {
    slug: 'Maha Shivaratri',
    emoji: '🕉️',
    tradition: 'hindu',
    origin:
      'Maha Shivaratri — "the great night of Shiva" — falls on the 14th night of the dark fortnight in Phalguna, the darkest night before the new moon. Multiple Puranic legends converge here: the night Shiva performed the Tandava cosmic dance, the night Shiva and Parvati were wed, and the night the Shivalinga first appeared as a pillar of infinite light (Jyotirlinga) before Brahma and Vishnu. It is the one night Shiva is said to be closest to the earth.',
    significance:
      'The festival inverts ordinary logic: the darkest night of the month is the most luminous for the seeker. Shiva is the lord of dissolution — he destroys what is false so truth can shine. Staying awake through the night is a metaphor for keeping consciousness alive even when the world sleeps, refusing to be swallowed by tamas. The four praharas (watches) of the night correspond to four stages of spiritual awakening.',
    rituals: [
      'Night-long jagran (vigil) — staying awake in meditation, chanting, or listening to the Shiva Purana',
      'Abhishek: bathe the Shivalinga with milk, honey, ghee, curd, and water in four successive praharas',
      'Chanting "Om Namah Shivaya" 108 times or more — the five-syllable mantra that encapsulates the five elements',
      'Fasting through the day and night, breaking fast only after morning puja on the following day',
    ],
    shloka: {
      text: 'ॐ नमः शिवाय',
      transliteration: 'Om Namaḥ Śivāya',
      translation:
        'I bow to Shiva — to that which is auspicious, the source and dissolution of all.',
      source: 'Krishna Yajurveda, Taittiriya Samhita 4.5.8',
    },
    practice:
      'Tonight, keep at least one prahara (3 hours) in stillness. Sit with a lamp or a single candle. Let the darkness outside be an invitation to find the light within.',
  },

  // ── Holi ──────────────────────────────────────────────────────────────────
  {
    slug: 'Holi',
    emoji: '🎨',
    tradition: 'hindu',
    origin:
      'Holi\'s roots lie in two stories: the devotion of Prahlada and the destruction of Holika. Prahlada, a child devotee of Vishnu, was protected by divine grace when his demoniac aunt Holika — granted immunity to fire — carried him into flames. The fire burned Holika instead, and Prahlada emerged unscathed. The bonfire of Holika Dahan the evening before Holi commemorates this victory. In Vrindavan, Holi evokes Krishna\'s playful colour battles with Radha and the gopis.',
    significance:
      'Holi is the festival of dissolution — of ego, of grudges, of social distinctions. Colour is applied to everyone equally: elder or young, rich or poor, the colour does not discriminate. Spiritually, the colours represent the vibrancy of divine play (Lila), the reminder that creation itself is a joyful game and not something to be taken with grim seriousness.',
    rituals: [
      'Holika Dahan the night before — lighting a bonfire to symbolise the burning of negativity and fear',
      'Playing with natural colours (gulal) made from flowers — avoid chemical colours that harm skin and environment',
      'Singing Holi songs (Faag) and dancing in community',
      'Sharing gujiya, thandai, and sweets with neighbours, especially those you may have been in conflict with',
    ],
    shloka: {
      text: 'फागुन के दिन चार होली खेल मना रे।\nबिन करताल पखावज बाजै, अनहद की धुन ना रे।।',
      transliteration:
        'Phāgun ke din cār holī khel manā re,\nBin karatāl pakhāvaj bājai, anahad kī dhun nā re.',
      translation:
        'In the four days of Phalgun, celebrate Holi. Without cymbals or drums, the unstruck sound plays — the divine melody reverberates.',
      source: 'Kabir Doha (traditional)',
    },
    practice:
      'Today, reach out to one person you have been distant from. A short message, a shared sweet, or simply a cheerful greeting — let the colour of reconciliation be your offering.',
  },

  // ── Ram Navami ────────────────────────────────────────────────────────────
  {
    slug: 'Ram Navami',
    emoji: '🏹',
    tradition: 'hindu',
    origin:
      'Ram Navami celebrates the birth of Lord Rama, seventh avatar of Vishnu, on the ninth day of Chaitra\'s bright fortnight. Born at noon (Madhyahna) to King Dasharatha and Queen Kaushalya in Ayodhya, Rama descended to restore dharma when the world had been overwhelmed by the demon king Ravana\'s adharma. The Ramayana, composed by Valmiki, narrates his 14-year exile, the rescue of Sita, and the defeat of Ravana.',
    significance:
      'Rama is the embodiment of Maryada Purushottam — the ideal person who upholds righteousness even when it demands personal sacrifice. Ram Navami is a day to reflect on how we ourselves hold dharma under pressure: do we tell the truth when lying is easier? Do we honour our commitments when circumstances make them inconvenient? Chanting Rama\'s name (Ram Naam) is considered a complete spiritual practice by many saints.',
    rituals: [
      'Reading or listening to Ramcharitmanas or Valmiki Ramayana — even a single chapter carries immense merit',
      'Reciting the Rama Ashtakam or Ram Raksha Stotra in the morning',
      'Fasting through the day, eating only fruits, breaking fast after sunset puja',
      'Visiting a Ram temple for darshan and participating in the noon abhishek that marks the birth moment',
    ],
    shloka: {
      text: 'रामाय रामभद्राय रामचन्द्राय वेधसे।\nरघुनाथाय नाथाय सीतायाः पतये नमः।।',
      transliteration:
        'Rāmāya Rāmabhadrāya Rāmachandrāya vedhase,\nRaghunāthāya nāthāya Sītāyāḥ pataye namaḥ.',
      translation:
        'I bow to Rama, to the auspicious Rama, to Ramachandra the creator; to the lord of the Raghu clan, to the master, to the husband of Sita.',
      source: 'Valmiki Ramayana',
    },
    practice:
      'Today, chose one act of integrity — something you have been postponing because it is uncomfortable. Do it as your personal offering to the spirit of Maryada.',
  },

  // ── Hanuman Jayanti ───────────────────────────────────────────────────────
  {
    slug: 'Hanuman Jayanti',
    emoji: '🙏',
    tradition: 'hindu',
    origin:
      'Hanuman Jayanti marks the birth of Lord Hanuman, son of Vayu (the wind god) and Anjana, on the full moon of Chaitra. Born with extraordinary strength and the ability to fly, Hanuman was cursed to forget his powers until reminded of them — a beautiful metaphor for the human condition. His entire life is one of seva (selfless service) and bhakti (devotion), crossing oceans, setting Lanka ablaze, and bringing Sanjeevani to revive Lakshmana.',
    significance:
      'Hanuman represents the devotee in his perfect form: immense capability placed entirely in service of the divine will, without ego. He is the bridge between the human and the divine, between Rama and the world. Worshipping Hanuman is said to remove fear, grant courage, and overcome obstacles — because the root of all obstacles is forgetting our own divine strength, just as Hanuman forgot his.',
    rituals: [
      'Recite the Hanuman Chalisa — all 40 verses ideally at sunrise',
      'Offer sindoor (vermilion) and oil to the Hanuman murti — red is Hanuman\'s colour, representing power and protection',
      'Fast through the day, eating only saatvik food',
      'Perform Sundarkand path — the chapter of Valmiki Ramayana narrating Hanuman\'s journey to Lanka',
    ],
    shloka: {
      text: 'मनोजवं मारुततुल्यवेगं जितेन्द्रियं बुद्धिमतां वरिष्ठम्।\nवातात्मजं वानरयूथमुख्यं श्रीरामदूतं शरणं प्रपद्ये।।',
      transliteration:
        'Manojavm mārutatulyavegaṃ jitendriyaṃ buddhimatāṃ variṣṭham,\nVātātmajaṃ vānarayūthamukkhyaṃ Śrīrāmadūtaṃ śaraṇaṃ prapadye.',
      translation:
        'Swift as the mind, equal in speed to the wind, master of the senses, foremost among the wise — son of the wind god, chief of the monkey hosts — I take refuge in Shri Rama\'s messenger.',
      source: 'Hanuman Vandana (traditional)',
    },
    practice:
      'Today, identify one fear that is limiting you. Write it down. Then write the one brave action you would take if that fear were gone — and do just that action, however small.',
  },

  // ── Guru Purnima ──────────────────────────────────────────────────────────
  {
    slug: 'Guru Purnima',
    emoji: '🙏',
    tradition: 'all',
    origin:
      'Guru Purnima falls on the full moon of Ashadha and is revered across Hindu, Buddhist, and Jain traditions. For Hindus, it is Vyasa Purnima — the birthday of Veda Vyasa, who compiled the Vedas, wrote the Mahabharata, and structured the Puranas, making timeless wisdom accessible to ordinary people. For Buddhists, it marks the day the Buddha gave his first discourse at Sarnath (Dhammacakkappavattana Sutta) to the five ascetics after his enlightenment.',
    significance:
      'The Guru is not merely a teacher of information but a transmitter of consciousness. The Sanskrit etymology: "Gu" = darkness, "Ru" = remover. The Guru removes the darkness of ignorance. On this full moon — the most luminous night of the month — the tradition says the Guru\'s grace flows most powerfully. It is a day to be grateful for everyone who has illuminated even one corner of your inner life.',
    rituals: [
      'Visit your guru or teacher and offer flowers, fruit, and pranaam — if distant, write or call',
      'Read a chapter from a scripture or book that most deeply shaped your worldview',
      'Meditate at moonrise, sitting in the full moonlight if possible',
      'Perform Vyasa Puja — a simple ritual of gratitude to the lineage of teachers',
    ],
    shloka: {
      text: 'गुरुर्ब्रह्मा गुरुर्विष्णुः गुरुर्देवो महेश्वरः।\nगुरुरेव परं ब्रह्म तस्मै श्रीगुरवे नमः।।',
      transliteration:
        'Gururbrahmā gururviṣṇuḥ gururdevo Maheśvaraḥ,\nGurureva paraṃ brahma tasmai śrīgurave namaḥ.',
      translation:
        'The Guru is Brahma (creator), the Guru is Vishnu (sustainer), the Guru is Shiva (dissolver). The Guru alone is the Supreme Absolute — I bow to that blessed Guru.',
      source: 'Guru Gita, Skanda Purana',
    },
    practice:
      'Today, write three sentences about the person — alive, departed, or a text — that most profoundly shifted how you see life. Thank them, inwardly or outwardly.',
  },

  // ── Raksha Bandhan ────────────────────────────────────────────────────────
  {
    slug: 'Raksha Bandhan',
    emoji: '🧿',
    tradition: 'hindu',
    origin:
      'Raksha Bandhan — "the bond of protection" — is celebrated on the full moon of Shravana. Multiple legends surround it: Indrani tying a protective thread on Indra\'s wrist before the gods\' battle against the asuras; Yama promising his sister Yamuna that those who bathe in the Yamuna will be free from fear of death; Draupadi tearing a strip from her sari to bind Krishna\'s wound, and Krishna vowing eternal protection in return.',
    significance:
      'The rakhi is not merely a thread — it is a covenant. The sister invokes divine protection for her brother; the brother pledges to stand by his sister. Spiritually, it represents the sacred reciprocity in relationships: care given freely, protection offered without conditions. In a broader sense, it teaches that every relationship can be "raksha" — a circle of safety that the divine weaves between souls.',
    rituals: [
      'Sisters perform aarti for their brothers and tie the rakhi on the right wrist',
      'Brothers offer a gift and a pledge of protection',
      'Prepare special sweets — particularly coconut-filled khoya mithai or peda',
      'In Maharashtra, Narali Purnima: offer coconuts to the sea in gratitude for the fishing season',
    ],
    shloka: {
      text: 'येन बद्धो बलिः राजा दानवेन्द्रो महाबलः।\nतेन त्वां प्रतिबध्नामि रक्षे मा चल मा चल।।',
      transliteration:
        'Yena baddho baliḥ rājā dānavendro mahābalaḥ,\ntena tvāṃ pratibadhnāmi rakṣe mā cala mā cala.',
      translation:
        'By the same thread by which the mighty demon-king Bali was bound, I bind you O Raksha — be firm, do not yield, do not yield.',
      source: 'Raksha Bandhan mantra (traditional)',
    },
    practice:
      'Today, call or message someone who has been a protector in your life — not just biological family, but anyone who held space for you in difficulty. Tell them.',
  },

  // ── Krishna Janmashtami ───────────────────────────────────────────────────
  {
    slug: 'Krishna Janmashtami',
    emoji: '🦚',
    tradition: 'hindu',
    origin:
      'Janmashtami celebrates the midnight birth of Krishna, eighth avatar of Vishnu, in the prison cell of King Kamsa in Mathura, to Devaki and Vasudeva. The divine child was whisked across the flooded Yamuna to the safety of Vrindavan, where he would grow up as the beloved butter-thief, flute-player, and eventually the statesman who delivered the Bhagavad Gita. His birth under a dark prison sky into the arms of devoted parents is the ultimate metaphor: divinity arrives even in captivity.',
    significance:
      'Krishna\'s leelas (divine plays) are a complete map of spiritual life: his childhood games teach us to see the sacred in play; his flute calls the soul home; the Gita is his direct teaching on action, devotion, and liberation. Janmashtami is a night to remember that the divine is always being "born" within us — even in our darkest moments, at the midnight of the soul.',
    rituals: [
      'Fast through the day; break fast only after midnight when Krishna\'s birth is celebrated',
      'Sing bhajans and kirtans continuously — especially "Hare Krishna" maha-mantra',
      'At midnight, bathe the Krishna murti (abhishek) and place him in a decorated cradle (jhula)',
      'Dahi Handi on the following day: earthen pot of curd broken by human pyramids, re-enacting Krishna\'s pranks',
    ],
    shloka: {
      text: 'कृष्णाय वासुदेवाय हरये परमात्मने।\nप्रणतक्लेशनाशाय गोविन्दाय नमो नमः।।',
      transliteration:
        'Kṛṣṇāya Vāsudevāya Haraye paramātmane,\nPraṇatakleshhanāśāya Govindāya namo namaḥ.',
      translation:
        'Salutations to Krishna, son of Vasudeva, the remover of obstacles; to the Supreme Soul who destroys the sorrow of those who bow to him — I bow again and again to Govinda.',
      source: 'Vishnu Purana',
    },
    practice:
      'Tonight at midnight, sit in silence for five minutes. Imagine the prison walls of whatever constrains you most right now — and then imagine a door opening, a light. Something divine is always being born.',
  },

  // ── Ganesh Chaturthi ──────────────────────────────────────────────────────
  {
    slug: 'Ganesh Chaturthi',
    emoji: '🐘',
    tradition: 'hindu',
    origin:
      'Ganesh Chaturthi marks the birthday of Ganesha — son of Shiva and Parvati — on the fourth day of Bhadrapada\'s bright fortnight. The most beloved legend tells of Parvati creating Ganesha from the earth of her own body to stand guard while she bathed; when Shiva returned and the child blocked his path, Shiva struck off his head. Moved by Parvati\'s grief, Shiva replaced it with that of an elephant, and granted the child the status of being worshipped first above all gods.',
    significance:
      'Ganesha — Vighnaharta, remover of obstacles — sits at the threshold of every beginning. His elephant head represents wisdom and memory; his large ears signify deep listening; his small mouth counsels speaking less. The mouse (vahana) he rides represents the ego — tamed and made a vehicle rather than a master. Beginning any task with Ganesh puja is an act of humility: acknowledging that obstacles exist and seeking the wisdom to navigate them.',
    rituals: [
      'Install a clay Ganesha murti at home or community pandal on Chaturthi',
      'Offer modak (sweet dumplings) — Ganesha\'s favourite food',
      'Recite the Ganapati Atharvashirsha daily for the 10-day festival period',
      'Visarjan (immersion) of the murti in water on day 1, 3, 5, 7, or 10 — the eco-conscious choice is clay murtis in a bucket of water',
    ],
    shloka: {
      text: 'वक्रतुण्ड महाकाय सूर्यकोटि समप्रभ।\nनिर्विघ्नं कुरु मे देव सर्वकार्येषु सर्वदा।।',
      transliteration:
        'Vakratuṇḍa mahākāya sūryakoṭi samaprabha,\nNirvighnaṃ kuru me deva sarvakāryeṣu sarvadā.',
      translation:
        'O Ganesha with the curved trunk and mighty form, whose radiance equals ten million suns — make all my endeavours free from obstacles, always.',
      source: 'Ganesh Stuti (traditional)',
    },
    practice:
      'Today, name one project or goal you have been delaying. Break it into its very first action — just one step. Offer that step to Ganesha\'s energy of beginnings.',
  },

  // ── Navratri ──────────────────────────────────────────────────────────────
  {
    slug: 'Navratri begins',
    emoji: '🪔',
    tradition: 'hindu',
    origin:
      'Navratri — nine nights — occurs four times a year, but the Sharad Navratri (autumn) beginning on Ashwin Shukla Pratipada is the grandest. It celebrates the nine forms of Goddess Durga (Navadurga), who battled and slew the buffalo demon Mahishasura over nine nights. Each day is associated with one form — Shailputri, Brahmacharini, Chandraghanta, Kushmanda, Skandamata, Katyayani, Kalaratri, Mahagauri, Siddhidatri — and a specific colour for the worshipper to wear.',
    significance:
      'The nine days represent nine stages of inner purification. Durga is Shakti — the primordial feminine energy that sustains and dissolves. The demon Mahishasura represents the ego\'s stubborn persistence, the buffalo nature that refuses to be moved by reason. The Devi Bhagavatam teaches that the goddess battles not outside us but within — slaying our pride, our sloth, our self-deception. Garba and Dandiya dances on these nights are a form of devotional ecstasy.',
    rituals: [
      'Set up a Navadurga altar with nine images or a single Devi murti',
      'Observe the colour-of-the-day tradition: wear the specific hue associated with each navratri day',
      'Recite Durga Saptashati (700 verses) — at least one chapter each day',
      'Kanya Puja on Ashtami or Navami: honour young girls as embodiments of the Devi, washing their feet and offering food',
    ],
    shloka: {
      text: 'या देवी सर्वभूतेषु शक्तिरूपेण संस्थिता।\nनमस्तस्यै नमस्तस्यै नमस्तस्यै नमो नमः।।',
      transliteration:
        'Yā devī sarvabhūteṣu śaktirūpeṇa samsthitā,\nNamastasyai namastasyai namastasyai namo namaḥ.',
      translation:
        'To the goddess who resides in all beings as Shakti — to her I bow, to her I bow, to her I bow again and again.',
      source: 'Devi Mahatmyam (Durga Saptashati) 5.12',
    },
    practice:
      'For this first day of Navratri, identify a single quality in yourself that you wish to strengthen — patience, courage, clarity. Dedicate these nine days to consciously cultivating it.',
  },

  // ── Dussehra ──────────────────────────────────────────────────────────────
  {
    slug: 'Dussehra',
    emoji: '🎇',
    tradition: 'hindu',
    origin:
      'Dussehra (Vijayadashami) falls on the tenth day after Navratri, celebrating two simultaneous victories: Rama\'s defeat of Ravana in Lanka after a 10-day battle, and Durga\'s slaying of Mahishasura on the same tithi. The name "Dussehra" itself may derive from "Dasha-hara" — destroyer of ten (Ravana\'s ten heads, symbolising ten bad qualities). Effigies of Ravana, his brother Kumbhakarna, and son Meghnada are burned across India with great fanfare.',
    significance:
      'Ravana was not merely an outsider villain — he was a scholar, a devotee of Shiva, a great king who made one catastrophic moral error: abducting another\'s wife. Dussehra asks us to identify our own Ravana within: the ten heads of ego, lust, anger, greed, attachment, pride, jealousy, injustice, cruelty, and delusion. Vijayadashami — Victory Tenth — is the day we symbolically burn those tendencies.',
    rituals: [
      'Watch or participate in Ramlila performances narrating Rama\'s battle and victory',
      'Burn effigies of Ravana at community celebrations after sunset',
      'Shami tree worship (Shamipooja) — the Pandavas retrieved their weapons from a Shami tree; touching it brings blessings',
      'Exchange Shami or Apta leaves as gold (Sone ki Patti) with friends and family — a tradition of prosperity-sharing',
    ],
    shloka: {
      text: 'श्रीरामचन्द्र कृपालु भजमन हरण भवभय दारुणम्।\nनव कञ्ज लोचन कञ्ज मुखकर कञ्जपद कञ्जारुणम्।।',
      transliteration:
        'Śrīrāmacandra kṛpālu bhajamana haraṇa bhavabhaya dāruṇam,\nnava kañja locana kañja mukhakara kañjapada kañjāruṇam.',
      translation:
        'Worship Ramachandra the merciful, destroyer of the dreadful fear of existence — whose eyes are like fresh lotuses, whose face and hands are lotuses, and whose lotus feet glow reddish-golden.',
      source: 'Ramchandra Kripalu Bhajaman by Tulsidas',
    },
    practice:
      'Write down one quality in yourself that has caused harm — to you or others — and that you genuinely wish to release. Tonight, burn the paper safely. Mean it.',
  },

  // ── Diwali ────────────────────────────────────────────────────────────────
  {
    slug: 'Diwali',
    emoji: '🎆',
    tradition: 'all',
    origin:
      'Diwali — from Sanskrit "Deepavali," row of lamps — is perhaps the most multi-layered of all Indian festivals. For Vaishnavas it marks Rama\'s triumphant return to Ayodhya after 14 years of exile; for Shaktas it celebrates Kali\'s victory over demons; for Jains it commemorates Mahavira\'s attainment of Nirvana on this night; for Sikhs it is Bandi Chhor Divas, when Guru Hargobind Ji returned from Mughal captivity freeing 52 kings. In 1619, he arrived at Amritsar on Diwali night and the Golden Temple was lit with lamps.',
    significance:
      'Light dispels darkness — but the deeper teaching is that the light of awareness dispels the darkness of ignorance. The lamp you light externally is a symbol of the lamp of consciousness you must keep burning within. Lakshmi — goddess of prosperity — is said to visit homes that are clean, luminous, and welcoming. The cleaning before Diwali is not housework; it is the spiritual act of making space for grace.',
    rituals: [
      'Light diyas (clay oil lamps) at dusk — begin from the eastern corner of the house',
      'Lakshmi Puja: invoke the goddess with chanting, flowers, kumkum, and prasad of sweets',
      'Rangoli at the entrance — geometric patterns in coloured powder to welcome Lakshmi',
      'Exchange mithai (sweets) and gifts — the practice of sharing abundance',
    ],
    shloka: {
      text: 'या श्रीः स्वयं सुकृतिनां भवनेष्वलक्ष्मीः\nपापात्मनां कृतधियां हृदयेषु बुद्धिः।\nश्रद्धा सतां कुलजनप्रभवस्य लज्जा\nतां त्वां नताः स्म परिपालय देवि विश्वम्।।',
      transliteration:
        'Yā śrīḥ svayaṃ sukṛtināṃ bhavaneṣvalakṣmīḥ\npāpātmanāṃ kṛtadhiyāṃ hṛdayeṣu buddhiḥ,\nśraddhā satāṃ kulajanaprabhavasya lajjā\ntāṃ tvāṃ natāḥ sma paripālaya devi viśvam.',
      translation:
        'She who is Shri (prosperity) in the homes of the virtuous, Alakshmi (misfortune) to the wicked, wisdom in the hearts of the learned, faith in the noble, and dignity in the well-born — to that Devi we bow; protect the world.',
      source: 'Shri Suktam (Rigvedic hymn)',
    },
    practice:
      'Tonight, light one diya in the darkest corner of your home — a closet, a forgotten room. Then light one in your mind: spend five minutes with a quality in yourself you have been neglecting.',
  },

  // ── Karva Chauth ──────────────────────────────────────────────────────────
  {
    slug: 'Karva Chauth',
    emoji: '🌙',
    tradition: 'hindu',
    origin:
      'Karva Chauth is observed on the fourth day after the full moon of Kartika by married Hindu women, who fast from sunrise to moonrise for the longevity and well-being of their husbands. The legend of Queen Veeravati narrates how she broke her fast prematurely, saw an inauspicious omen, and her husband died — only to be revived when she observed the fast correctly the following year. The story of Satyavan and Savitri echoes this devotion to life over death.',
    significance:
      'At its deepest level, Karva Chauth is about the courage of love — a love that says "I will sacrifice my comfort for your well-being." The fast is not about subservience; it is a voluntary, joyful act of devotion. The moon — which a wife first sees through a sieve and then sees her husband\'s face — represents the cooling, nourishing energy that sustains marriage. In modern practice, many couples observe the fast together as a mutual act of love.',
    rituals: [
      'Fast from sunrise; eat sargi (pre-dawn meal) prepared by mother-in-law before sunrise',
      'Dress in bridal finery — red or pink — wearing sindoor, bangles, and mehndi applied the night before',
      'Join community puja with other women in the evening, passing the karva (clay pot of water) in a circle',
      'At moonrise: see the moon through a sieve, then see husband\'s face through the same sieve, then break the fast with water offered by him',
    ],
    shloka: {
      text: 'करवाचौथ व्रत कथा सुनो, पति की आयु बढ़ाती हो।\nचाँद दर्शन से व्रत खुलता, सौभाग्य सदा पाती हो।।',
      transliteration:
        'Karvācauth vrata kathā suno, pati kī āyu baṛhātī ho,\ncānd darśan se vrata khulatā, saubhāgya sadā pātī ho.',
      translation:
        'Hear the Karva Chauth vrat story, which extends the husband\'s life; the fast breaks at the sight of the moon, may you always receive the blessing of a happy marriage.',
      source: 'Karva Chauth Vrat Katha (traditional)',
    },
    practice:
      'Today, whatever your relationship status, fast from one form of consumption you take for granted — social media, news, snacking. Let the small sacrifice be an act of gratitude for what you have.',
  },

  // ── Gita Jayanti ──────────────────────────────────────────────────────────
  {
    slug: 'Gita Jayanti',
    emoji: '📖',
    tradition: 'hindu',
    origin:
      'Gita Jayanti falls on Ekadashi (11th day) of Margashirsha\'s bright fortnight — the very day Krishna recited the 700 verses of the Bhagavad Gita to Arjuna on the battlefield of Kurukshetra. Vyasa, the compiler of the Mahabharata, had Sanjaya transmit the vision to the blind King Dhritarashtra in real time. The Gita took approximately 45 minutes to deliver — yet contains the complete philosophy of life, action, knowledge, and devotion.',
    significance:
      'The Gita does not begin in a temple but on a battlefield — a deliberate choice. Arjuna\'s breakdown on the chariot is every human\'s breakdown before a difficult duty. Krishna\'s response is not a platitude but a complete philosophical unpacking of why we should act with full engagement without grasping at results. Gita Jayanti is a day to go back to the source — even a single chapter, read slowly, can restructure a life.',
    rituals: [
      'Read the complete Bhagavad Gita, or at least one chapter of your choice',
      'Gita Akhand Path at temples — uninterrupted recitation of all 18 chapters',
      'Gift a copy of the Gita to someone who has never read it',
      'Reflect on one shloka that has most shaped your understanding of duty',
    ],
    shloka: {
      text: 'कर्मण्येवाधिकारस्ते मा फलेषु कदाचन।\nमा कर्मफलहेतुर्भूर्मा ते सङ्गोऽस्त्वकर्मणि।।',
      transliteration:
        'Karmaṇyevādhikāraste mā phaleṣu kadācana,\nmā karmaphalaheturbhūrmā te saṅgo\'stvakarmaṇi.',
      translation:
        'You have a right to perform your prescribed duties, but you are not entitled to the fruits of your actions. Never consider yourself the cause of the results of your activities, and never be attached to not doing your duty.',
      source: 'Bhagavad Gita 2.47',
    },
    practice:
      'Today, choose one task you have been doing with an eye on its outcome. Do it once — just this once — giving your full attention to the quality of the action itself, releasing the result.',
  },

  // ── Baisakhi ──────────────────────────────────────────────────────────────
  {
    slug: 'Baisakhi',
    emoji: '🌾',
    tradition: 'sikh',
    origin:
      'Baisakhi (Vaisakhi) on April 13 is one of the most significant dates in Sikh history. On this day in 1699, Guru Gobind Singh Ji founded the Khalsa Panth at Anandpur Sahib by calling for volunteers willing to sacrifice their heads for the faith. Five men — the Panj Pyare (Beloved Five) — stepped forward and were initiated in the first Amrit Sanchar ceremony. The Khalsa code of conduct (Rehit Maryada) was simultaneously established.',
    significance:
      'Baisakhi is the birthday of the Khalsa — the community of the pure. The Guru\'s act that day was a radical equaliser: he dissolved caste by having the five volunteers — from different castes and regions — drink Amrit from the same bowl. The Khalsa was to be "Sant-Sipahi" — saint-soldier — embodying both spiritual discipline and the courage to stand for justice. Baisakhi carries that dual charge: celebrate harvest, yes, but also recommit to your highest identity.',
    rituals: [
      'Attend Amrit Vela Nitnem and Ardas at the Gurdwara at dawn',
      'Nagar Kirtan procession through the city, singing shabads',
      'Langar — free community meal — served to all without distinction',
      'For those who have not yet taken Amrit: Baisakhi is the most auspicious day for initiation into the Khalsa',
    ],
    shloka: {
      text: 'ਵਾਹਿਗੁਰੂ ਜੀ ਕਾ ਖਾਲਸਾ ॥\nਵਾਹਿਗੁਰੂ ਜੀ ਕੀ ਫਤਹਿ ॥',
      transliteration: 'Vāhigurū jī kā Khālsā, Vāhigurū jī kī Fateh',
      translation:
        'The Khalsa belongs to the Wonderful Lord! Victory belongs to the Wonderful Lord!',
      source: 'Sikh greeting inaugurated by Guru Gobind Singh Ji',
    },
    practice:
      'Today, identify one value you hold most sacred — and one concrete way you could live it more fully this week. The Khalsa was built on values made visible in action.',
  },

  // ── Guru Nanak Gurpurab ───────────────────────────────────────────────────
  {
    slug: 'Guru Nanak Jayanti',
    emoji: '☬',
    tradition: 'sikh',
    origin:
      'Guru Nanak Dev Ji — the founder and first Guru of Sikhism — was born on the full moon of Kartika in 1469 CE in Nankana Sahib (in present-day Pakistan). Even as a child he confounded priests with his questions; at 30 he disappeared into the river Bein for three days and emerged with his divine mission: "There is no Hindu, there is no Mussalman." He then undertook four great journeys (udasis) — covering over 28,000 km — spreading the message of Ik Onkar (One God) and Sarbat da Bhala (the well-being of all).',
    significance:
      'Guru Nanak\'s teachings reject all hierarchies built on caste, religion, or gender. The three pillars he established — Naam Japo (remember God), Kirat Karo (earn honestly), Vand Chakko (share with others) — are a complete social and spiritual manifesto. Gurpurab is a day to measure one\'s own life against these three simple, radical standards.',
    rituals: [
      'Akhand Path: 48-hour uninterrupted reading of the Guru Granth Sahib Ji, completed by dawn on Gurpurab',
      'Prabhat Pheri: early morning procession through the neighbourhood singing hymns',
      'Nagar Kirtan: community procession with Panj Pyare leading, singing shabads',
      'Langar: serve free food to all — irrespective of religion, caste, or status',
    ],
    shloka: {
      text: 'ਇਕ ਓਅੰਕਾਰ ਸਤਿ ਨਾਮੁ ਕਰਤਾ ਪੁਰਖੁ ਨਿਰਭਉ ਨਿਰਵੈਰੁ\nਅਕਾਲ ਮੂਰਤਿ ਅਜੂਨੀ ਸੈਭੰ ਗੁਰ ਪ੍ਰਸਾਦਿ ॥',
      transliteration:
        'Ik Oaṃkār sati nāmu kartā purakhu nirbhau nirvair,\nAkāl mūrati ajūnī saibhaṃ gur prasādi.',
      translation:
        'One Universal Creator God. The Name Is Truth. Creative Being Personified. No Fear. No Hatred. Timeless in Form. Unborn. Self-Existent. By Guru\'s Grace.',
      source: 'Mool Mantar, Guru Granth Sahib Ji (opening verse)',
    },
    practice:
      'Today, perform one act of Vand Chakko — share something: a meal, your time, your knowledge. Let it be anonymous if possible.',
  },

  // ── Vesak / Buddha Purnima ────────────────────────────────────────────────
  {
    slug: 'Buddha Purnima',
    emoji: '☸️',
    tradition: 'buddhist',
    origin:
      'Vesak (Vaisakh Purnima) is the most sacred day in the Buddhist calendar, commemorating three events in the Buddha\'s life that all occurred on the same full moon: his birth in Lumbini (563 BCE), his enlightenment under the Bodhi tree in Bodh Gaya, and his Parinirvana in Kushinagar. The tradition holds that no other being has had all three major life events on the same lunar day — a sign of cosmic significance.',
    significance:
      'The Buddha\'s enlightenment is not a story about one extraordinary man — it is a map of what every human being can achieve. The Four Noble Truths (dukkha, samudaya, nirodha, magga) and the Eightfold Path are not religious dogma but a pragmatic framework for reducing suffering. Vesak is an invitation to take the lamp of awareness and look honestly at where suffering persists in your own life — and to see the path that leads out.',
    rituals: [
      'Visit a Buddhist temple; circumambulate with candles or flowers, perform three prostrations',
      'Dana: offer food, medicine, or material support to monks, nuns, or the poor',
      'Sila: reaffirm the five precepts — non-harm, non-stealing, sexual integrity, honest speech, sobriety',
      'Bhavana: sit in meditation for at least 30 minutes — begin with metta (loving-kindness) for yourself and all beings',
    ],
    shloka: {
      text: 'Buddhaṃ Saranaṃ Gacchāmi\nDhammaṃ Saranaṃ Gacchāmi\nSaṅghaṃ Saranaṃ Gacchāmi',
      translation:
        'I take refuge in the Buddha.\nI take refuge in the Dhamma (the teaching).\nI take refuge in the Sangha (the community).',
      source: 'Tisarana — The Three Refuges (Pali Canon)',
    },
    practice:
      'Today, sit for 10 minutes and simply watch your breath — not control it, just watch. Notice when the mind wanders and gently return. This is the whole practice, in miniature.',
  },

  // ── Mahavir Jayanti ───────────────────────────────────────────────────────
  {
    slug: 'Mahavir Jayanti',
    emoji: '🤲',
    tradition: 'jain',
    origin:
      'Mahavir Jayanti celebrates the birth of Vardhamana Mahavira — the 24th and final Tirthankara of the current cosmic cycle — on the 13th day of Chaitra\'s bright fortnight, 599 BCE in Vaishali (present-day Bihar). A prince who renounced his kingdom at 30, Mahavira spent 12 years in austere meditation, attaining Kevala Jnana (omniscience) at 42. He then taught for 30 years, establishing the four-fold Jain Sangha: monks, nuns, laymen, and laywomen.',
    significance:
      'Mahavira\'s core teaching is Ahimsa Paramo Dharma — non-violence is the highest dharma. This extends not just to not killing, but to not causing harm in thought, word, or deed, to any living being. In an age of industrial farming and ecological destruction, Mahavir Jayanti carries urgent relevance. Anekantavada — the doctrine of many perspectives — teaches that truth is multifaceted; no single viewpoint can claim the whole.',
    rituals: [
      'Attend the Mahavir Janma Abhishek (birth bath ceremony) at the Jain temple',
      'Pratikraman: ritual of self-reflection and repentance for harm caused knowingly or unknowingly',
      'Observe Ahimsa strictly: vegan diet, careful movement to avoid harming insects',
      'Dana: offer food, medicine, or sadhvi-upashray (monastery) support to Jain monks and nuns',
    ],
    shloka: {
      text: 'णमो अरिहंताणं\nणमो सिद्धाणं\nणमो आयरियाणं\nणमो उवज्झायाणं\nणमो लोए सव्वसाहूणं',
      transliteration:
        'Namo Arihantāṇaṃ\nNamo Siddhāṇaṃ\nNamo Āyariyāṇaṃ\nNamo Uvajjhāyāṇaṃ\nNamo Loe Savvasāhūṇaṃ',
      translation:
        'I bow to the Arihantas (enlightened souls)\nI bow to the Siddhas (liberated souls)\nI bow to the Acharyas (spiritual leaders)\nI bow to the Upadhyayas (teachers)\nI bow to all the Sadhus (monks and nuns) in the world',
      source: 'Namokar Mantra — the supreme Jain prayer',
    },
    practice:
      'Today, observe one hour of Ahimsa in speech — avoid criticism, complaint, and gossip entirely for one hour. Notice the quality of awareness that arises in that space.',
  },

  // ── Paryushana ────────────────────────────────────────────────────────────
  {
    slug: 'Paryushana',
    emoji: '🤲',
    tradition: 'jain',
    origin:
      'Paryushana — "abiding near the soul" — is the holiest festival in the Jain calendar, lasting 8 days for Shvetambara Jains (in Bhadrapada) and 10 days for Digambara Jains (Das Lakshana). During ancient times, Jain monks would stop their wandering and remain in one place during the monsoon season to avoid unintentionally harming the abundant insect life during rains. This period became an intensive time of spiritual practice.',
    significance:
      'Paryushana is the festival of the soul turning toward itself. The five great vows of Jainism — Ahimsa, Satya, Asteya, Brahmacharya, Aparigraha — are intensively renewed. The climax is Samvatsari: the day of universal forgiveness, when Jains seek and offer forgiveness from and to all beings — Micchami Dukkadam: "If I have hurt you in any way, I seek your forgiveness." This practice of asking forgiveness before the year ends is a profound communal act of healing.',
    rituals: [
      'Paryushana fasting — from partial abstinence to complete Aayambil (boiled, unsalted grain) or Upvas (full fast)',
      'Samayik: twice-daily 48-minute practice of equanimity meditation',
      'Pratikraman: daily ritual of confession and repentance',
      'Samvatsari Pratikraman on the final day: the grand annual forgiveness ceremony',
    ],
    shloka: {
      text: 'मिच्छामि दुक्कडं',
      transliteration: 'Micchāmi Dukkaḍaṃ',
      translation:
        'May all the evil that I have committed be dissolved — I ask your forgiveness.',
      source: 'Jain Pratikraman formula (Prakrit)',
    },
    practice:
      'Today, write the name of one person from whom you genuinely need forgiveness. Write also one person you have been withholding forgiveness from. Hold both in your mind with Micchami Dukkadam — even if the message never gets sent.',
  },

];

/**
 * Look up a festival story by its name (case-insensitive, partial match allowed).
 * Returns null if no story exists for that festival.
 */
export function getFestivalStory(festivalName: string): FestivalStory | null {
  const needle = festivalName.toLowerCase().trim();
  return (
    FESTIVAL_STORIES.find(
      (s) =>
        s.slug.toLowerCase() === needle ||
        needle.includes(s.slug.toLowerCase()) ||
        s.slug.toLowerCase().includes(needle),
    ) ?? null
  );
}
