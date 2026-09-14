/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Shoonaya — Festival Stories
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Handcrafted rich content for the top ~20 festivals across all four traditions.
 * Each story surfaces in a tappable card on HomeDashboard when the festival
 * is ≤ 3 days away on Home.
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

  // ── Shani Jayanti ─────────────────────────────────────────────────────────
  {
    slug: 'Shani Jayanti',
    emoji: '⚖️',
    tradition: 'hindu',
    origin:
      'Shani Jayanti commemorates the birth of Shani Dev, the son of Surya Dev (the Sun God) and Chhaya (Shadow). Legend says that when Shani Dev first opened his eyes as a newborn, the Sun went into a total eclipse, signifying his immense power over time and destiny. He is the elder brother of Yama (the God of Death) and is considered the greatest teacher among the Navagrahas.',
    significance:
      'Shani Dev is the "Karma Phala Daata"—the dispenser of the fruits of our actions. He is often misunderstood as a punisher, but his true nature is that of a strict disciplinarian who forces us to face our own karma with patience, humility, and hard work. Shani Jayanti is a day to seek his grace, not to avoid "bad luck," but to ask for the inner strength to navigate our life\'s challenges and learn the lessons our soul requires.',
    rituals: [
      'Perform Shani Tailabhishek: Offer mustard oil to a Shani murti to cool his intense energy and seek his protection',
      'Light a sesame oil lamp under a Peepal tree after sunset, circumambulating the tree seven times',
      'Chant the Shani Beej Mantra ("Om Pram Preem Proum Sah Shanischaraya Namah") or the Shani Chalisa',
      'Donate black sesame seeds, black cloth, or iron items to the needy—acts of charity on this day are said to please Shani Dev greatly',
    ],
    shloka: {
      text: 'नीलांजन समाभासं रविपुत्रं यमाग्रजम्।\nछायामार्तण्ड सम्भूतं तं नमामि शनैश्चरम्।।',
      transliteration:
        'Nilāñjana samābhāsaṃ raviputraṃ yamāgrajam,\nChhāyāmārtaṇḍa sambhūtaṃ taṃ namāmi śanaiścaram.',
      translation:
        'I bow to Shani Dev, who is as dark as a blue mountain, the son of the Sun and the elder brother of Yama; born from the womb of Chhaya and the radiance of the Sun, I salute the slow-moving one.',
      source: 'Shani Stotram',
    },
    practice:
      'Today, perform one act of service for someone in the working or labor class (associated with Shani Dev). Feed a stray dog or offer a meal to a manual laborer. Practice "Mauna" (silence) for one hour to reflect on your actions of the past year.',
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
    slug: 'Guru Nanak Gurpurab',
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
    slug: 'Vesak / Buddha Purnima',
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
    slug: 'Paryushana Parva begins',
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

  // ── Samvatsari (Paryushana ends) ──────────────────────────────────────────
  {
    slug: 'Samvatsari (Paryushana ends)',
    emoji: '🕊️',
    tradition: 'jain',
    origin:
      'Samvatsari marks the supreme culmination of Paryushana Parva on the fifth day of the bright fortnight of Bhadrapada (Bhadrapada Shukla Panchami). On this day, Jains conclude their eight-day period of fasting, meditation, and inner purification. The ancient Agamic rite of Samvatsari Pratikramana is performed — an intensive three-hour spiritual inventory where one reflects on every action of thought, speech, and body from the entire past year to atone for transgressions against all living entities.',
    significance:
      'Samvatsari is universally recognized as the Jain Day of Universal Forgiveness. Its crowning jewel is the greeting "Micchami Dukkadam" (May all the harm I have caused be dissolved). Rather than celebrating external triumphs, Jains make peace with everyone: friends, relatives, strangers, and adversaries alike. To seek forgiveness requires humbling the ego; to grant forgiveness requires releasing resentment. Samvatsari demonstrates that Ahimsa (non-violence) in its highest form is boundless compassion and reconciliation.',
    rituals: [
      'Observing complete waterless or water-only fasting (Upavas / Chauvihar) throughout the day',
      'Participation in the annual Samvatsari Pratikramana, reviewing the year\'s deeds with deep remorse',
      'Exchanging heartfelt "Micchami Dukkadam" greetings in person, by voice, or in writing with all acquaintances',
      'Reciting the sacred Kshamapana Sutra extending unconditional friendship to every being in existence',
    ],
    shloka: {
      text: 'खामेमि सव्वजीवे सव्वे जीवा खमंतु मे।\nमित्ती मे सव्वभूएसु वेरं मज्झं न केणइ॥',
      transliteration:
        'Khāmemi savvajīve savve jīvā khamantu me,\nMittī me savvabhūesu veraṃ majjhaṃ na keṇai.',
      translation:
        'I ask forgiveness from all living beings; may all living beings forgive me.\nI cherish friendship with all beings; I harbor enmity towards none.',
      source: 'Āvaśyaka Sūtra (Kṣamāpanā Sūtra, Prakrit)',
    },
    practice:
      'Today, actively reach out to at least one person with whom your relationship has been strained or distant. Offer an unconditional apology or release a lingering grudge.',
  },

  // ── Lohri ─────────────────────────────────────────────────────────────────
  {
    slug: 'Lohri',
    emoji: '🔥',
    tradition: 'sikh',
    origin:
      'Lohri is the vibrant winter harvest festival of Punjab, celebrated on the eve of Makar Sankranti at the close of the month of Poh (Pausha). Families gather around a community bonfire at twilight to welcome the sun\'s return toward the northern hemisphere and to celebrate the ripening of the rabi crops, especially sugarcane, wheat, and mustard. The celebration is steeped in the folklore of Dulla Bhatti, a 16th-century folk hero who rescued young girls from oppression and arranged their marriages.',
    significance:
      'Lohri celebrates gratitude for the earth\'s bounty, the warmth of community in the depth of winter, and the sacredness of family milestones such as new births and marriages. Circumambulating the sacred fire with offerings of sesame, jaggery, and puffed grains symbolizes the offering of ego into the flame of divine light and the renewal of mutual goodwill across the neighborhood.',
    rituals: [
      'Lighting the sacred community bonfire at sunset with wood and dried offerings',
      'Parikrama (circumambulation) of the fire, offering til (sesame), gur (jaggery), rewri, and popcorn into the flames',
      'Singing traditional Punjabi folk songs celebrating Dulla Bhatti and dancing Bhangra and Giddha',
      'Sharing a festive feast of Sarson da Saag, Makki di Roti, and winter sweets with family and neighbors',
    ],
    shloka: {
      text: 'ਸਭੇ ਜੀਅ ਸਮਾਲਿ ਨਿਰੰਜਨੁ ਆਪਣਾ।\nਜੀਅ ਜੰਤ ਸਭਿ ਤਿਸ ਕੇ ਸਭਨਾ ਰਿਜਕੁ ਦਿਤੋਨੁ ਅਪਾਰਾ॥',
      transliteration:
        'Sabhe jīa samāli nirañjanu āpaṇā,\nJīa jaṃta sabhi tisa ke sabhanā rijaku ditonu apārā.',
      translation:
        'The Immaculate Lord cherishes all His creation.\nAll beings belong to Him; He bestows boundless sustenance upon everyone.',
      source: 'Guru Granth Sahib Ji (Ang 652, Guru Ram Das Ji)',
    },
    practice:
      'Today, share warmth with those outside your circle. Gift warm food, tea, or winter essentials to someone working outdoors in the cold.',
  },

  // ── Guru Ravidas Jayanti ───────────────────────────────────────────────────
  {
    slug: 'Guru Ravidas Jayanti',
    emoji: '☬',
    tradition: 'sikh',
    origin:
      'Guru Ravidas Jayanti commemorates the birth of Bhagat Ravidas Ji on Magha Purnima in 14th-century Varanasi. Born into a community of leatherworkers, he endured and challenged severe caste discrimination through fearless devotion, humble labor, and sublime poetry. His spiritual stature was recognized across traditions — Mirabai revered him as her guru, and 41 of his sacred hymns were canonized in Sri Guru Granth Sahib Ji by Guru Arjan Dev Ji.',
    significance:
      'Bhagat Ravidas taught that divine realization is the birthright of every human being, regardless of caste, birth, or social rank. His famous maxim "Man changa to kathauti mein Ganga" (if the heart is pure, the sacred river Ganga flows in one\'s own vessel) placed inner devotion above external ritualism. His vision of Begampura — a realm free of sorrow, exploitation, fear, and oppression — remains one of humanity\'s earliest and most profound visions of spiritual and social equality.',
    rituals: [
      'Nagar Kirtan processions carrying portraits and sacred banis of Bhagat Ravidas Ji',
      'Recitation and kirtan of the 41 shabads of Bhagat Ravidas Ji enshrined in Sri Guru Granth Sahib Ji',
      'Community langar feeding all seekers side by side without distinction of background',
      'Voluntary community seva honoring dignity of labor and service to the marginalized',
    ],
    shloka: {
      text: 'ਬੇਗਮ ਪੁਰਾ ਸਹਰ ਕੋ ਨਾਉ।\nਦੂਖੁ ਅੰਦੋਹੁ ਨਹੀ ਤਿਹਿ ਠਾਉ॥\nਨਾਂ ਤਸਵੀਸ ਖਿਰਾਜੁ ਨ ਮਾਲੁ।\nਖਉਫੁ ਨ ਖਤਾ ਨ ਤਰਸੁ ਜਵਾਲੁ॥',
      transliteration:
        'Begam purā sahara ko nāu,\nDūkhu aṃdohu nahī tihi ṭhāu,\nNāṃ tasavīsa khirāju na mālu,\nKhaufu na khatā na tarasu javālu.',
      translation:
        'Begampura, "the city without sorrow", is the name of that realm.\nThere is neither suffering nor anxiety there.\nNo taxes on goods or wealth, no fear, no blemishes, and no downfall.',
      source: 'Guru Granth Sahib Ji (Ang 345, Bhagat Ravidas Ji, Rag Gauri)',
    },
    practice:
      'Today, notice any subtle hierarchy you carry in your mind regarding others\' work or background. Honor someone doing manual labor with genuine gratitude and respect.',
  },

  // ── Holla Mohalla ──────────────────────────────────────────────────────────
  {
    slug: 'Holla Mohalla',
    emoji: '🏹',
    tradition: 'sikh',
    origin:
      'Hola Mohalla was established in 1701 by Guru Gobind Singh Ji at Takht Sri Keshgarh Sahib in Anandpur Sahib, observed on the day after Holi. The tenth Guru transformed the celebratory spring festival into a grand three-day assembly of martial skill, courage, and spiritual readiness. "Hola" is the masculine counterpart to Holi, while "Mohalla" signifies an organized column or mock military maneuver.',
    significance:
      'Guru Gobind Singh established Hola Mohalla to instill a spirit of fearlessness (Nirbhau) and righteous readiness in the Khalsa. Rather than superficial revelry, Sikhs demonstrate Gatka (traditional martial art), horsemanship, archery, and swordsmanship, combined with Kavi Darbars (poetry symposiums) reciting devotional and heroic verses. It embodies the Sikh ideal of Sant-Sipahi — the Saint-Soldier who combines inner contemplation with outward defense of the defenseless.',
    rituals: [
      'Nishan Sahib march and grand Mohalla procession led by the Nihang Singhs in traditional royal blue and saffron',
      'Gatka and martial arts exhibitions, archery, swordplay, and equestrian demonstrations',
      'Kavi Darbar: day-and-night assemblies of devotional and heroic Gurbani poetry',
      'Round-the-clock community Langar serving tens of thousands of pilgrims at Anandpur Sahib',
    ],
    shloka: {
      text: 'ਸੂਰਾ ਸੋ ਪਹਿਚਾਨੀਐ ਜੁ ਲਰੈ ਦੀਨ ਕੇ ਹੇਤ।\nਪੁਰਜਾ ਪੁਰਜਾ ਕਟਿ ਮਰੈ ਕਬਹੂ ਨ ਛਾਡੈ ਖੇਤੁ॥',
      transliteration:
        'Sūrā so pahicānīai ju larai dīna ke heta,\nPurajā purajā kaṭi marai kabhū na chāḍai khetu.',
      translation:
        'Recognize him alone as a true spiritual warrior who fights for the sake of the defenseless.\nEven if cut limb by limb, he never abandons the field of righteousness.',
      source: 'Guru Granth Sahib Ji (Ang 1105, Bhagat Kabir Ji)',
    },
    practice:
      'Today, strengthen both mind and body. Take 20 minutes for physical discipline or exercise, and reflect on what cause or community you stand ready to protect.',
  },

  // ── Guru Gobind Singh Gurpurab ─────────────────────────────────────────────
  {
    slug: 'Guru Gobind Singh Gurpurab',
    emoji: '☬',
    tradition: 'sikh',
    origin:
      'Guru Gobind Singh Ji, the tenth and final human Guru of the Sikhs, was born on Poh Sudi 7 (January 5, 1666) in Patna Sahib, Bihar. Ascending to spiritual leadership at just nine years old following his father Guru Tegh Bahadur\'s martyrdom, he became a towering master of letters, languages, spiritual philosophy, and military strategy. In 1699 he created the Khalsa Panth, and in 1708 before his passing at Nanded, he conferred eternal Guruship upon Sri Guru Granth Sahib Ji, ending the human lineage of Gurus.',
    significance:
      'Guru Gobind Singh personified supreme sacrifice and divine courage. He gave his father, his four sons (the Chaar Sahibzade), and his mother to the struggle against tyranny, yet never harbored hatred, writing in the Akal Ustat: "Mānas kī jāt sabhai ekai pahicānbo" (Recognize the whole human race as of one caste). He democratized leadership by kneeling before the Khalsa he created, proving that true authority is rooted in humility and righteous collective consciousness.',
    rituals: [
      'Akhand Path: 48-hour continuous reading of the Guru Granth Sahib Ji concluded at dawn',
      'Recitation of Dasam Granth compositions: Jaap Sahib, Tav-Prasad Savaiye, and Chaupai Sahib',
      'Nagar Kirtan with Gatka martial artists and Panj Pyare leading the procession',
      'Deepmala and distribution of Karah Parshad and communal Langar',
    ],
    shloka: {
      text: 'ਦੇਹ ਸਿਵਾ ਬਰੁ ਮੋਹਿ ਇਹੈ ਸੁਭ ਕਰਮਨ ਤੇ ਕਬਹੂੰ ਨ ਟਰੋਂ।\nਨ ਡਰੋਂ ਅਰਿ ਸੋ ਜਬ ਜਾਇ ਲਰੋਂ ਨਿਸਚੈ ਕਰਿ ਅਪੁਨੀ ਜੀਤ ਕਰੋਂ॥',
      transliteration:
        'Deh sivā baru mohi ihai subha karaman te kabhūṃ na ṭaroṃ,\nNa ḍaroṃ ari so jaba jāi laroṃ nisacai kari apunī jīta karoṃ.',
      translation:
        'Grant me this boon, O Lord: may I never hesitate from performing righteous deeds.\nMay I fear no adversary when entering the fray for truth, and with unwavering resolve, achieve victory.',
      source: 'Chandi Charitar, Sri Dasam Granth (Guru Gobind Singh Ji)',
    },
    practice:
      'Today, commit to taking on one difficult, righteous task you have been postponing out of fear or hesitation.',
  },

  // ── Guru Arjan Dev Martyrdom ───────────────────────────────────────────────
  {
    slug: 'Guru Arjan Dev Martyrdom',
    emoji: '☬',
    tradition: 'sikh',
    origin:
      'Guru Arjan Dev Ji, the fifth Sikh Guru, attained martyrdom on Jeth Sudi 4 (June 1606) in Lahore under the orders of Mughal Emperor Jahangir. A visionary poet and builder, Guru Arjan compiled the Adi Granth in 1604, installing it in Sri Harmandir Sahib (the Golden Temple) which he constructed with doors open to all four directions. When ordered to alter sacred verses and pay an extortionate fine, Guru Sahib refused to compromise divine truth, enduring five days of horrific torture on burning iron plates and boiling cauldrons with unshakeable peace.',
    significance:
      'Guru Arjan Dev Ji was the first martyr in Sikh history, sanctifying the path of supreme sacrifice for religious integrity. In the midst of searing agony, he uttered the immortal words: "Tera kiya meetha laage" (Thy Will is sweet to me). His martyrdom transformed the Sikh community\'s destiny, illustrating that spiritual peace and surrender to the Divine Will (Hukam) cannot be crushed by any worldly power.',
    rituals: [
      'Chabeel Seva: setting up public kiosks serving chilled, rose-scented sweetened milk-water (Kachi Lassi) to cool travelers in remembrance of Guru Ji\'s fiery trial',
      'Recitation of Sukhmani Sahib ("The Song of Peace"), composed by Guru Arjan Dev Ji',
      'Solemn Gurbani Kirtan focusing on themes of divine resignation and peace',
      'Quiet Langar served with profound humility and reverence',
    ],
    shloka: {
      text: 'ਤੇਰਾ ਕੀਆ ਮੀਠਾ ਲਾਗੈ।\nਹਰਿ ਨਾਮੁ ਪਦਾਰਥੁ ਨਾਨਕੁ ਮਾਂਗੈ॥',
      transliteration:
        'Terā kīā mīṭhā lāgai,\nHari nāmu padārathu nānaku māṅgai.',
      translation:
        'All that You do is sweet to me, O Lord.\nNanak begs only for the priceless treasure of Your Divine Name.',
      source: 'Guru Granth Sahib Ji (Ang 394, Guru Arjan Dev Ji, Rag Asa)',
    },
    practice:
      'Today, practice "Bhana Man-na" — accept one frustrating delay, setback, or inconvenience without grumbling or irritation. Respond with calm equanimity.',
  },

  // ── Bandhi Chhor Divas ─────────────────────────────────────────────────────
  {
    slug: 'Bandhi Chhor Divas',
    emoji: '☬',
    tradition: 'sikh',
    origin:
      'Bandhi Chhor Divas ("Day of Liberation") coincides with Diwali on Kartika Amavasya, celebrating the release in 1619 of the sixth Sikh Guru, Guru Hargobind Sahib Ji, from Gwalior Fort where he was held by Emperor Jahangir. When Jahangir offered to release the Guru, Guru Sahib refused to leave unless 52 innocent Hindu hill kings imprisoned alongside him were freed too. The emperor decreed that only those who could hold onto the Guru\'s cloak could leave; Guru Sahib had a special cloak fashioned with 52 long tassels, and all 52 kings walked out to liberty.',
    significance:
      'Bandhi Chhor Divas highlights the Sikh principle that spiritual liberation is inseparable from defending human rights and freedom for others. Guru Hargobind, who donned the two swords of Miri (temporal leadership) and Piri (spiritual authority), demonstrated that true power is measured by whom you set free. When he returned to Amritsar, the Harmandir Sahib was illuminated with thousands of lamps, symbolizing the light of justice prevailing over tyranny.',
    rituals: [
      'Deepmala: illuminating Gurdwaras and homes with thousands of traditional earthen oil lamps',
      'Listening to Gurbani Kirtan on the doctrine of Miri-Piri and the divine liberator',
      'Bhog of Sri Guru Granth Sahib Ji and sharing Karah Parshad',
      'Offering prayers (Ardas) for human rights and the freedom of prisoners worldwide',
    ],
    shloka: {
      text: 'ਸਤਿਗੁਰ ਬੰਦੀਛੋੜੁ ਹੈ ਜੀਵਣ ਮੁਕਤਿ ਕਰੈ ਓਡੀਣਾ॥',
      transliteration:
        'Satigur bandīchoṛu hai jīvaṇa mukati karai oḍīṇā.',
      translation:
        'The True Guru is the Liberator from all bondage;\nHe brings liberation to the soul even while living in this world.',
      source: 'Bhai Gurdas Ji Vaaran (Vaar 24, Pauri 20)',
    },
    practice:
      'Today, light a diya with the conscious intention of releasing a habit, fear, or resentment that has kept you in inner captivity. Seek to help someone else feel free.',
  },

  // ── Guru Tegh Bahadur Martyrdom ────────────────────────────────────────────
  {
    slug: 'Guru Tegh Bahadur Martyrdom',
    emoji: '☬',
    tradition: 'sikh',
    origin:
      'Guru Tegh Bahadur Ji, the ninth Sikh Guru, was publicly beheaded at Chandni Chowk, Delhi (now Gurdwara Sis Ganj Sahib) on November 11, 1675, by order of Mughal Emperor Aurangzeb. A delegation of Kashmiri Pandits led by Pandit Kirpa Ram had appealed to Guru Sahib for protection against forced conversions. Knowing the cost, Guru Tegh Bahadur stood before the imperial court to champion their freedom of conscience. After witnessing the martyrdom of his companions Bhai Mati Das, Bhai Sati Das, and Bhai Dayala, the Guru surrendered his head rather than his faith.',
    significance:
      'Guru Tegh Bahadur\'s martyrdom is unique in human history: a spiritual preceptor giving his life to protect the religious freedom of another community. Revered as "Hind di Chadar" (Shield of India), his sacrifice laid down the principle that the right to seek God in one\'s own way is inviolable. His 57 Saloks in the Guru Granth Sahib reflect profound dispassion (Vairagya), reminding seekers that this world is fleeting and divine truth alone endures.',
    rituals: [
      'Recitation of Salok Mahalla 9 from Sri Guru Granth Sahib Ji with reflective contemplation',
      'Solemn Kirtan Darbars and Akhand Path bhog at Gurdwaras',
      'Discourses on pluralism, human dignity, and freedom of belief',
      'Quiet community langar and distribution of cool water and Karah Parshad',
    ],
    shloka: {
      text: 'ਧਰਮ ਹੇਤ ਸਾਕਾ ਜਿਨਿ ਕੀਆ।\nਸੀਸੁ ਦੀਆ ਪਰ ਸਿਰਰੁ ਨ ਦੀਆ॥',
      transliteration:
        'Dharama heta sākā jini kīā,\nSīsu dīā para siraru na dīā.',
      translation:
        'He performed this monumental sacrifice for the sake of Dharma;\nHe gave up his head, but never his spiritual conviction.',
      source: 'Bachittar Natak, Sri Dasam Granth (Guru Gobind Singh Ji)',
    },
    practice:
      'Today, speak up against prejudice or intolerance. Support someone\'s right to express their honest, ethical viewpoint, especially when you personally disagree.',
  },

  // ── Sahibzade Shaheedi Diwas ───────────────────────────────────────────────
  {
    slug: 'Sahibzade Shaheedi Diwas',
    emoji: '☬',
    tradition: 'sikh',
    origin:
      'The Shaheedi Diwas of the Chaar Sahibzade commemorates the martyrdom of the four young sons of Guru Gobind Singh Ji during the last week of December 1704. In the Battle of Chamkaur, the elder sons — Baba Ajit Singh (17) and Baba Jujhar Singh (14) — fought valiantly against overwhelming odds and fell heroically on the battlefield. Meanwhile, the younger sons — Baba Zorawar Singh (9) and Baba Fateh Singh (7) — along with their grandmother Mata Gujri Ji, were captured at Sirhind. Refusing to renounce their faith under any threat or lure, the young princes were bricked alive by the governor of Sirhind.',
    significance:
      'The sacrifice of the Chaar Sahibzade represents the pinnacle of youthful innocence merged with unshakeable spiritual bravery. Children of tender years chose integrity over survival, refusing to submit to religious tyranny. Guru Gobind Singh received news of their martyrdom with transcendent fortitude, declaring that though four sons had fallen, thousands of sons and daughters lived on in the Khalsa. It is observed as a week of solemn humility, resilience, and gratitude.',
    rituals: [
      'Observing simplicity and solemnity during the Shaheedi week in Poh (sleeping without luxury)',
      'Recitation of katha and heroic ballads recounting the Sakas of Chamkaur and Sirhind (Fatehgarh Sahib)',
      'Gurdwara diwans honoring the valor and steadfastness of the young Sahibzade',
      'Serving hot tea, roasted gram, and simple langar to all pilgrims and visitors',
    ],
    shloka: {
      text: 'ਇਨ ਪੁਤ੍ਰਨ ਕੇ ਸੀਸ ਪਰ ਵਾਰ ਦੀਏ ਸੁਤ ਚਾਰ।\nਚਾਰ ਮੂਏ ਤੋ ਕਿਆ ਭਯਾ ਜੀਵਤ ਕਈ ਹਜਾਰ॥',
      transliteration:
        'Ina putrana ke sīsa para vāra dīe suta cāra,\nCāra mūe to kyā bhayā jīvata kaī hajāra.',
      translation:
        'For the protection of these children of the land, I have sacrificed my four sons.\nWhat does it matter that four have fallen, when many thousands live on?',
      source: 'Historic proclamation of Guru Gobind Singh Ji (1704)',
    },
    practice:
      'Today, reflect on moral resilience. Ask yourself: what principles are so fundamental to you that you would never compromise them for convenience or approval?',
  },

  // ── Bodhi Day ─────────────────────────────────────────────────────────────
  {
    slug: 'Bodhi Day',
    emoji: '🌳',
    tradition: 'buddhist',
    origin:
      'Bodhi Day commemorates the dawn when Siddhartha Gautama, having seated himself in resolute meditation beneath the Bodhi tree at Bodh Gaya, overcame the illusions and temptations of Mara and attained complete, unexcelled Enlightenment (Anuttara Samyak Sambodhi). At the sight of the morning star, he realized the Twelve Links of Dependent Origination (Pratityasamutpada) and emerged as the Buddha — the Awakened One.',
    significance:
      'Bodhi Day celebrates the victory of wisdom (Prajna) over ignorance (Avidya), and compassion (Karuna) over craving (Tanha). The Buddha\'s enlightenment proved that freedom from suffering is not an external gift from deities, but the inherent potential of an awakened human mind. It inspires practitioners to nurture their own Buddha nature through steady mindfulness and ethical discipline.',
    rituals: [
      'Silent Vipassana or Zazen meditation sittings reflecting on the morning of awakening',
      'Decorating ficus or evergreen trees with lights symbolizing wisdom illuminating darkness',
      'Chanting the Heart Sutra (Prajnaparamita Hridaya) and the Buddha\'s victory verses from the Dhammapada',
      'Partaking of simple rice-and-milk porridge (Kheer) in memory of Sujata\'s offering to Siddhartha',
    ],
    shloka: {
      text: 'गते गते पारगते पारसंगते बोधि स्वाहा॥',
      transliteration: 'Gate gate pāragate pārasaṃgate bodhi svāhā.',
      translation:
        'Gone, gone, gone beyond, gone altogether beyond to Awakening. Hail!',
      source: 'Prajñāpāramitā Hṛdaya Sūtra (The Heart Sutra, Sanskrit)',
    },
    practice:
      'Today, sit quietly for 15 minutes before dawn or at sunset. Watch your thoughts arise and dissolve without clinging or reacting to any of them.',
  },

  // ── Asalha Puja (Dhamma Day) ───────────────────────────────────────────────
  {
    slug: 'Asalha Puja',
    emoji: '☸️',
    tradition: 'buddhist',
    origin:
      'Asalha Puja (Dhamma Day), celebrated on the full moon of the eighth lunar month (Ashadha), commemorates Gautama Buddha\'s very first sermon delivered at the Deer Park in Sarnath near Varanasi. Addressing the five ascetics who had been his former companions, the Buddha set in motion the Wheel of the Dhamma (Dhammacakkappavattana Sutta). Upon hearing this teaching, Kondañña attained the first fruit of liberation, founding the Buddhist monastic order (Sangha) and establishing the Triple Gem (Buddha, Dhamma, Sangha) on earth.',
    significance:
      'Dhamma Day marks the revelation of the Buddha\'s central diagnostic and therapeutic teachings: the Four Noble Truths (suffering, its origin, its cessation, and the path) and the Noble Eightfold Path. It also inaugurates the "Middle Way" (Majjhima Patipada) — avoiding the twin traps of sensual indulgence and extreme mortification. The following day begins Vassa, the three-month Rains Retreat.',
    rituals: [
      'Chanting the Dhammacakkappavattana Sutta in Pali or vernacular translation',
      'Evening candlelit circumambulation (Wian Tian) around the temple stupa or Buddha image',
      'Listening to discourses expounding the Four Noble Truths and the Eightfold Path',
      'Offering robes (Civara), candles, and requisites to monks and nuns entering the Rains Retreat',
    ],
    shloka: {
      text: 'इदं खो पन भिक्खवे दुक्खं अरियसच्चं... इदं खो पन भिक्खवे दुक्खनिरोधगामिनी पटिपदा अरियसच्चं॥',
      transliteration:
        'Idaṃ kho pana bhikkhave dukkhaṃ ariyasaccaṃ... idaṃ kho pana bhikkhave dukkhanirodhagāminī paṭipadā ariyasaccaṃ.',
      translation:
        'Now this, monastics, is the Noble Truth of Suffering... and this is the Noble Truth of the Way leading to the Cessation of Suffering.',
      source: 'Dhammacakkappavattana Sutta (Samyutta Nikaya 56.11, Pali)',
    },
    practice:
      'Today, examine one area where you experience frustration or discontent. Apply the Four Noble Truths: What is the tension? What attachment causes it? Can you let go of that expectation?',
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
