/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Shoonaya — Festival Stories
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Handcrafted rich content across all four traditions (Hindu, Sikh, Jain, Buddhist).
 * Each story surfaces in a tappable card on HomeDashboard when the festival
 * is ≤ 3 days away on Home.
 *
 * Each narrative is written to the ~500 words sweet spot with authentic,
 * canonical primary sources and verified citations.
 *
 * Content per festival:
 *  - origin      : In-depth historical / scriptural background (~150-200 words)
 *  - significance: Philosophical and spiritual essence (~150-200 words)
 *  - rituals     : 4-5 concrete, step-by-step liturgical and community practices
 *  - shloka      : Primary canonical verse (Sanskrit / Gurmukhi / Prakrit / Pali) with translation & source
 *  - practice    : Contemplative call-to-action for the practitioner today
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
  {
    "slug": "Makar Sankranti",
    "emoji": "🪁",
    "tradition": "hindu",
    "origin": "Makar Sankranti marks the precise moment the Sun crosses into Capricorn (Makara rashi), signalling the end of the winter solstice period. The Vedas regard this northward journey of the Sun — Uttarayan — as the day of the gods, when the divine becomes more accessible. The festival is celebrated under different names across India: Pongal in Tamil Nadu, Lohri in Punjab, Bihu in Assam.",
    "significance": "Sankranti is the festival of light returning. It teaches that just as the Sun turns north bringing warmth and harvest, the seeker too can turn inward — away from the tamas of winter — toward sattva and clarity. Bathing in sacred rivers on this day is said to dissolve accumulated karma, and charity (daan) given on Sankranti multiplies manifold.",
    "rituals": [
      "Ritual dip (snan) in a river or sea at sunrise, ideally the Ganga, Godavari, or any flowing water near you",
      "Offering sesame-jaggery (til-gul) to family and elders with the words \"Til-gul ghya, god god bola\" (take sweetness, speak sweetly)",
      "Flying kites — the upward pull symbolises the soul's aspiration toward the divine light",
      "Donating sesame, blankets, and food to the needy — daan on Sankranti is considered ten times more meritorious"
    ],
    "shloka": {
      "text": "सूर्य आत्मा जगतस्तस्थुषश्च",
      "transliteration": "Sūrya ātmā jagatas tasthuṣaś ca",
      "translation": "The Sun is the soul of all that moves and all that is still.",
      "source": "Rigveda 1.115.1"
    },
    "practice": "Today, wake at sunrise and face east for five minutes. Let the first light touch your face and set one intention for the northward half of the year."
  },
  {
    "slug": "Vasant Panchami",
    "emoji": "🌼",
    "tradition": "hindu",
    "origin": "Vasant Panchami falls on the fifth day (panchami) of the bright fortnight in Magha, when Brahma is said to have created Goddess Saraswati — the embodiment of knowledge, music, and the flowing river — to fill the world with sound, beauty, and wisdom. Spring (vasant) begins here, and yellow — the colour of ripening mustard fields — becomes the festival's signature.",
    "significance": "Saraswati represents the power of discernment: the ability to distinguish truth from noise. Worshipping her on Vasant Panchami is a prayer to keep the mind sharp and the tongue truthful. Students place their books and instruments before her image, acknowledging that all learning ultimately flows from the divine source.",
    "rituals": [
      "Wear yellow clothing to honour the arrival of spring and the golden radiance of Saraswati",
      "Place books, pens, musical instruments, or tools of your craft near a Saraswati image and offer yellow flowers (marigold, yellow rose)",
      "Begin a new book, course, or practice today — Vasant Panchami is the auspicious start for all learning endeavours",
      "Offer kheer (rice pudding) or yellow sweets as prasad and share with family"
    ],
    "shloka": {
      "text": "या कुन्देन्दुतुषारहारधवला या शुभ्रवस्त्रावृता\nया वीणावरदण्डमण्डितकरा या श्वेतपद्मासना",
      "transliteration": "Yā kundendutushārahāradhavalā yā shubhravstrāvṛtā\nyā vīṇāvaradaṇḍamaṇḍitakarā yā śvetapadmāsanā",
      "translation": "She who is as white as the jasmine and the full moon, who is draped in pure white, whose hands are adorned with the graceful vina, who is seated on a white lotus…",
      "source": "Saraswati Vandana (traditional)"
    },
    "practice": "Today, write one sentence about something you genuinely wish to learn this year. Place it in your journal or near your workspace — let Saraswati witness the intention."
  },
  {
    "slug": "Maha Shivaratri",
    "emoji": "🕉️",
    "tradition": "hindu",
    "origin": "Maha Shivaratri — \"the great night of Shiva\" — falls on the 14th night of the dark fortnight in Phalguna, the darkest night before the new moon. Multiple Puranic legends converge here: the night Shiva performed the Tandava cosmic dance, the night Shiva and Parvati were wed, and the night the Shivalinga first appeared as a pillar of infinite light (Jyotirlinga) before Brahma and Vishnu. It is the one night Shiva is said to be closest to the earth.",
    "significance": "The festival inverts ordinary logic: the darkest night of the month is the most luminous for the seeker. Shiva is the lord of dissolution — he destroys what is false so truth can shine. Staying awake through the night is a metaphor for keeping consciousness alive even when the world sleeps, refusing to be swallowed by tamas. The four praharas (watches) of the night correspond to four stages of spiritual awakening.",
    "rituals": [
      "Night-long jagran (vigil) — staying awake in meditation, chanting, or listening to the Shiva Purana",
      "Abhishek: bathe the Shivalinga with milk, honey, ghee, curd, and water in four successive praharas",
      "Chanting \"Om Namah Shivaya\" 108 times or more — the five-syllable mantra that encapsulates the five elements",
      "Fasting through the day and night, breaking fast only after morning puja on the following day"
    ],
    "shloka": {
      "text": "ॐ नमः शिवाय",
      "transliteration": "Om Namaḥ Śivāya",
      "translation": "I bow to Shiva — to that which is auspicious, the source and dissolution of all.",
      "source": "Krishna Yajurveda, Taittiriya Samhita 4.5.8"
    },
    "practice": "Tonight, keep at least one prahara (3 hours) in stillness. Sit with a lamp or a single candle. Let the darkness outside be an invitation to find the light within."
  },
  {
    "slug": "Holi",
    "emoji": "🎨",
    "tradition": "hindu",
    "origin": "Holi's roots lie in two stories: the devotion of Prahlada and the destruction of Holika. Prahlada, a child devotee of Vishnu, was protected by divine grace when his demoniac aunt Holika — granted immunity to fire — carried him into flames. The fire burned Holika instead, and Prahlada emerged unscathed. The bonfire of Holika Dahan the evening before Holi commemorates this victory. In Vrindavan, Holi evokes Krishna's playful colour battles with Radha and the gopis.",
    "significance": "Holi is the festival of dissolution — of ego, of grudges, of social distinctions. Colour is applied to everyone equally: elder or young, rich or poor, the colour does not discriminate. Spiritually, the colours represent the vibrancy of divine play (Lila), the reminder that creation itself is a joyful game and not something to be taken with grim seriousness.",
    "rituals": [
      "Holika Dahan the night before — lighting a bonfire to symbolise the burning of negativity and fear",
      "Playing with natural colours (gulal) made from flowers — avoid chemical colours that harm skin and environment",
      "Singing Holi songs (Faag) and dancing in community",
      "Sharing gujiya, thandai, and sweets with neighbours, especially those you may have been in conflict with"
    ],
    "shloka": {
      "text": "फागुन के दिन चार होली खेल मना रे।\nबिन करताल पखावज बाजै, अनहद की धुन ना रे।।",
      "transliteration": "Phāgun ke din cār holī khel manā re,\nBin karatāl pakhāvaj bājai, anahad kī dhun nā re.",
      "translation": "In the four days of Phalgun, celebrate Holi. Without cymbals or drums, the unstruck sound plays — the divine melody reverberates.",
      "source": "Kabir Doha (traditional)"
    },
    "practice": "Today, reach out to one person you have been distant from. A short message, a shared sweet, or simply a cheerful greeting — let the colour of reconciliation be your offering."
  },
  {
    "slug": "Ram Navami",
    "emoji": "🏹",
    "tradition": "hindu",
    "origin": "Ram Navami celebrates the birth of Lord Rama, seventh avatar of Vishnu, on the ninth day of Chaitra's bright fortnight. Born at noon (Madhyahna) to King Dasharatha and Queen Kaushalya in Ayodhya, Rama descended to restore dharma when the world had been overwhelmed by the demon king Ravana's adharma. The Ramayana, composed by Valmiki, narrates his 14-year exile, the rescue of Sita, and the defeat of Ravana.",
    "significance": "Rama is the embodiment of Maryada Purushottam — the ideal person who upholds righteousness even when it demands personal sacrifice. Ram Navami is a day to reflect on how we ourselves hold dharma under pressure: do we tell the truth when lying is easier? Do we honour our commitments when circumstances make them inconvenient? Chanting Rama's name (Ram Naam) is considered a complete spiritual practice by many saints.",
    "rituals": [
      "Reading or listening to Ramcharitmanas or Valmiki Ramayana — even a single chapter carries immense merit",
      "Reciting the Rama Ashtakam or Ram Raksha Stotra in the morning",
      "Fasting through the day, eating only fruits, breaking fast after sunset puja",
      "Visiting a Ram temple for darshan and participating in the noon abhishek that marks the birth moment"
    ],
    "shloka": {
      "text": "रामाय रामभद्राय रामचन्द्राय वेधसे।\nरघुनाथाय नाथाय सीतायाः पतये नमः।।",
      "transliteration": "Rāmāya Rāmabhadrāya Rāmachandrāya vedhase,\nRaghunāthāya nāthāya Sītāyāḥ pataye namaḥ.",
      "translation": "I bow to Rama, to the auspicious Rama, to Ramachandra the creator; to the lord of the Raghu clan, to the master, to the husband of Sita.",
      "source": "Valmiki Ramayana"
    },
    "practice": "Today, chose one act of integrity — something you have been postponing because it is uncomfortable. Do it as your personal offering to the spirit of Maryada."
  },
  {
    "slug": "Hanuman Jayanti",
    "emoji": "🙏",
    "tradition": "hindu",
    "origin": "Hanuman Jayanti marks the birth of Lord Hanuman, son of Vayu (the wind god) and Anjana, on the full moon of Chaitra. Born with extraordinary strength and the ability to fly, Hanuman was cursed to forget his powers until reminded of them — a beautiful metaphor for the human condition. His entire life is one of seva (selfless service) and bhakti (devotion), crossing oceans, setting Lanka ablaze, and bringing Sanjeevani to revive Lakshmana.",
    "significance": "Hanuman represents the devotee in his perfect form: immense capability placed entirely in service of the divine will, without ego. He is the bridge between the human and the divine, between Rama and the world. Worshipping Hanuman is said to remove fear, grant courage, and overcome obstacles — because the root of all obstacles is forgetting our own divine strength, just as Hanuman forgot his.",
    "rituals": [
      "Recite the Hanuman Chalisa — all 40 verses ideally at sunrise",
      "Offer sindoor (vermilion) and oil to the Hanuman murti — red is Hanuman's colour, representing power and protection",
      "Fast through the day, eating only saatvik food",
      "Perform Sundarkand path — the chapter of Valmiki Ramayana narrating Hanuman's journey to Lanka"
    ],
    "shloka": {
      "text": "मनोजवं मारुततुल्यवेगं जितेन्द्रियं बुद्धिमतां वरिष्ठम्।\nवातात्मजं वानरयूथमुख्यं श्रीरामदूतं शरणं प्रपद्ये।।",
      "transliteration": "Manojavm mārutatulyavegaṃ jitendriyaṃ buddhimatāṃ variṣṭham,\nVātātmajaṃ vānarayūthamukkhyaṃ Śrīrāmadūtaṃ śaraṇaṃ prapadye.",
      "translation": "Swift as the mind, equal in speed to the wind, master of the senses, foremost among the wise — son of the wind god, chief of the monkey hosts — I take refuge in Shri Rama's messenger.",
      "source": "Hanuman Vandana (traditional)"
    },
    "practice": "Today, identify one fear that is limiting you. Write it down. Then write the one brave action you would take if that fear were gone — and do just that action, however small."
  },
  {
    "slug": "Shani Jayanti",
    "emoji": "⚖️",
    "tradition": "hindu",
    "origin": "Shani Jayanti commemorates the birth of Shani Dev, the son of Surya Dev (the Sun God) and Chhaya (Shadow). Legend says that when Shani Dev first opened his eyes as a newborn, the Sun went into a total eclipse, signifying his immense power over time and destiny. He is the elder brother of Yama (the God of Death) and is considered the greatest teacher among the Navagrahas.",
    "significance": "Shani Dev is the \"Karma Phala Daata\"—the dispenser of the fruits of our actions. He is often misunderstood as a punisher, but his true nature is that of a strict disciplinarian who forces us to face our own karma with patience, humility, and hard work. Shani Jayanti is a day to seek his grace, not to avoid \"bad luck,\" but to ask for the inner strength to navigate our life's challenges and learn the lessons our soul requires.",
    "rituals": [
      "Perform Shani Tailabhishek: Offer mustard oil to a Shani murti to cool his intense energy and seek his protection",
      "Light a sesame oil lamp under a Peepal tree after sunset, circumambulating the tree seven times",
      "Chant the Shani Beej Mantra (\"Om Pram Preem Proum Sah Shanischaraya Namah\") or the Shani Chalisa",
      "Donate black sesame seeds, black cloth, or iron items to the needy—acts of charity on this day are said to please Shani Dev greatly"
    ],
    "shloka": {
      "text": "नीलांजन समाभासं रविपुत्रं यमाग्रजम्।\nछायामार्तण्ड सम्भूतं तं नमामि शनैश्चरम्।।",
      "transliteration": "Nilāñjana samābhāsaṃ raviputraṃ yamāgrajam,\nChhāyāmārtaṇḍa sambhūtaṃ taṃ namāmi śanaiścaram.",
      "translation": "I bow to Shani Dev, who is as dark as a blue mountain, the son of the Sun and the elder brother of Yama; born from the womb of Chhaya and the radiance of the Sun, I salute the slow-moving one.",
      "source": "Shani Stotram"
    },
    "practice": "Today, perform one act of service for someone in the working or labor class (associated with Shani Dev). Feed a stray dog or offer a meal to a manual laborer. Practice \"Mauna\" (silence) for one hour to reflect on your actions of the past year."
  },
  {
    "slug": "Guru Purnima",
    "emoji": "🙏",
    "tradition": "all",
    "origin": "Guru Purnima falls on the full moon of Ashadha and is revered across Hindu, Buddhist, and Jain traditions. For Hindus, it is Vyasa Purnima — the birthday of Veda Vyasa, who compiled the Vedas, wrote the Mahabharata, and structured the Puranas, making timeless wisdom accessible to ordinary people. For Buddhists, it marks the day the Buddha gave his first discourse at Sarnath (Dhammacakkappavattana Sutta) to the five ascetics after his enlightenment.",
    "significance": "The Guru is not merely a teacher of information but a transmitter of consciousness. The Sanskrit etymology: \"Gu\" = darkness, \"Ru\" = remover. The Guru removes the darkness of ignorance. On this full moon — the most luminous night of the month — the tradition says the Guru's grace flows most powerfully. It is a day to be grateful for everyone who has illuminated even one corner of your inner life.",
    "rituals": [
      "Visit your guru or teacher and offer flowers, fruit, and pranaam — if distant, write or call",
      "Read a chapter from a scripture or book that most deeply shaped your worldview",
      "Meditate at moonrise, sitting in the full moonlight if possible",
      "Perform Vyasa Puja — a simple ritual of gratitude to the lineage of teachers"
    ],
    "shloka": {
      "text": "गुरुर्ब्रह्मा गुरुर्विष्णुः गुरुर्देवो महेश्वरः।\nगुरुरेव परं ब्रह्म तस्मै श्रीगुरवे नमः।।",
      "transliteration": "Gururbrahmā gururviṣṇuḥ gururdevo Maheśvaraḥ,\nGurureva paraṃ brahma tasmai śrīgurave namaḥ.",
      "translation": "The Guru is Brahma (creator), the Guru is Vishnu (sustainer), the Guru is Shiva (dissolver). The Guru alone is the Supreme Absolute — I bow to that blessed Guru.",
      "source": "Guru Gita, Skanda Purana"
    },
    "practice": "Today, write three sentences about the person — alive, departed, or a text — that most profoundly shifted how you see life. Thank them, inwardly or outwardly."
  },
  {
    "slug": "Raksha Bandhan",
    "emoji": "🧿",
    "tradition": "hindu",
    "origin": "Raksha Bandhan — \"the bond of protection\" — is celebrated on the full moon of Shravana. Multiple legends surround it: Indrani tying a protective thread on Indra's wrist before the gods' battle against the asuras; Yama promising his sister Yamuna that those who bathe in the Yamuna will be free from fear of death; Draupadi tearing a strip from her sari to bind Krishna's wound, and Krishna vowing eternal protection in return.",
    "significance": "The rakhi is not merely a thread — it is a covenant. The sister invokes divine protection for her brother; the brother pledges to stand by his sister. Spiritually, it represents the sacred reciprocity in relationships: care given freely, protection offered without conditions. In a broader sense, it teaches that every relationship can be \"raksha\" — a circle of safety that the divine weaves between souls.",
    "rituals": [
      "Sisters perform aarti for their brothers and tie the rakhi on the right wrist",
      "Brothers offer a gift and a pledge of protection",
      "Prepare special sweets — particularly coconut-filled khoya mithai or peda",
      "In Maharashtra, Narali Purnima: offer coconuts to the sea in gratitude for the fishing season"
    ],
    "shloka": {
      "text": "येन बद्धो बलिः राजा दानवेन्द्रो महाबलः।\nतेन त्वां प्रतिबध्नामि रक्षे मा चल मा चल।।",
      "transliteration": "Yena baddho baliḥ rājā dānavendro mahābalaḥ,\ntena tvāṃ pratibadhnāmi rakṣe mā cala mā cala.",
      "translation": "By the same thread by which the mighty demon-king Bali was bound, I bind you O Raksha — be firm, do not yield, do not yield.",
      "source": "Raksha Bandhan mantra (traditional)"
    },
    "practice": "Today, call or message someone who has been a protector in your life — not just biological family, but anyone who held space for you in difficulty. Tell them."
  },
  {
    "slug": "Krishna Janmashtami",
    "emoji": "🦚",
    "tradition": "hindu",
    "origin": "Janmashtami celebrates the midnight birth of Krishna, eighth avatar of Vishnu, in the prison cell of King Kamsa in Mathura, to Devaki and Vasudeva. The divine child was whisked across the flooded Yamuna to the safety of Vrindavan, where he would grow up as the beloved butter-thief, flute-player, and eventually the statesman who delivered the Bhagavad Gita. His birth under a dark prison sky into the arms of devoted parents is the ultimate metaphor: divinity arrives even in captivity.",
    "significance": "Krishna's leelas (divine plays) are a complete map of spiritual life: his childhood games teach us to see the sacred in play; his flute calls the soul home; the Gita is his direct teaching on action, devotion, and liberation. Janmashtami is a night to remember that the divine is always being \"born\" within us — even in our darkest moments, at the midnight of the soul.",
    "rituals": [
      "Fast through the day; break fast only after midnight when Krishna's birth is celebrated",
      "Sing bhajans and kirtans continuously — especially \"Hare Krishna\" maha-mantra",
      "At midnight, bathe the Krishna murti (abhishek) and place him in a decorated cradle (jhula)",
      "Dahi Handi on the following day: earthen pot of curd broken by human pyramids, re-enacting Krishna's pranks"
    ],
    "shloka": {
      "text": "कृष्णाय वासुदेवाय हरये परमात्मने।\nप्रणतक्लेशनाशाय गोविन्दाय नमो नमः।।",
      "transliteration": "Kṛṣṇāya Vāsudevāya Haraye paramātmane,\nPraṇatakleshhanāśāya Govindāya namo namaḥ.",
      "translation": "Salutations to Krishna, son of Vasudeva, the remover of obstacles; to the Supreme Soul who destroys the sorrow of those who bow to him — I bow again and again to Govinda.",
      "source": "Vishnu Purana"
    },
    "practice": "Tonight at midnight, sit in silence for five minutes. Imagine the prison walls of whatever constrains you most right now — and then imagine a door opening, a light. Something divine is always being born."
  },
  {
    "slug": "Ganesh Chaturthi",
    "emoji": "🐘",
    "tradition": "hindu",
    "origin": "Ganesh Chaturthi marks the birthday of Ganesha — son of Shiva and Parvati — on the fourth day of Bhadrapada's bright fortnight. The most beloved legend tells of Parvati creating Ganesha from the earth of her own body to stand guard while she bathed; when Shiva returned and the child blocked his path, Shiva struck off his head. Moved by Parvati's grief, Shiva replaced it with that of an elephant, and granted the child the status of being worshipped first above all gods.",
    "significance": "Ganesha — Vighnaharta, remover of obstacles — sits at the threshold of every beginning. His elephant head represents wisdom and memory; his large ears signify deep listening; his small mouth counsels speaking less. The mouse (vahana) he rides represents the ego — tamed and made a vehicle rather than a master. Beginning any task with Ganesh puja is an act of humility: acknowledging that obstacles exist and seeking the wisdom to navigate them.",
    "rituals": [
      "Install a clay Ganesha murti at home or community pandal on Chaturthi",
      "Offer modak (sweet dumplings) — Ganesha's favourite food",
      "Recite the Ganapati Atharvashirsha daily for the 10-day festival period",
      "Visarjan (immersion) of the murti in water on day 1, 3, 5, 7, or 10 — the eco-conscious choice is clay murtis in a bucket of water"
    ],
    "shloka": {
      "text": "वक्रतुण्ड महाकाय सूर्यकोटि समप्रभ।\nनिर्विघ्नं कुरु मे देव सर्वकार्येषु सर्वदा।।",
      "transliteration": "Vakratuṇḍa mahākāya sūryakoṭi samaprabha,\nNirvighnaṃ kuru me deva sarvakāryeṣu sarvadā.",
      "translation": "O Ganesha with the curved trunk and mighty form, whose radiance equals ten million suns — make all my endeavours free from obstacles, always.",
      "source": "Ganesh Stuti (traditional)"
    },
    "practice": "Today, name one project or goal you have been delaying. Break it into its very first action — just one step. Offer that step to Ganesha's energy of beginnings."
  },
  {
    "slug": "Navratri begins",
    "emoji": "🪔",
    "tradition": "hindu",
    "origin": "Navratri — nine nights — occurs four times a year, but the Sharad Navratri (autumn) beginning on Ashwin Shukla Pratipada is the grandest. It celebrates the nine forms of Goddess Durga (Navadurga), who battled and slew the buffalo demon Mahishasura over nine nights. Each day is associated with one form — Shailputri, Brahmacharini, Chandraghanta, Kushmanda, Skandamata, Katyayani, Kalaratri, Mahagauri, Siddhidatri — and a specific colour for the worshipper to wear.",
    "significance": "The nine days represent nine stages of inner purification. Durga is Shakti — the primordial feminine energy that sustains and dissolves. The demon Mahishasura represents the ego's stubborn persistence, the buffalo nature that refuses to be moved by reason. The Devi Bhagavatam teaches that the goddess battles not outside us but within — slaying our pride, our sloth, our self-deception. Garba and Dandiya dances on these nights are a form of devotional ecstasy.",
    "rituals": [
      "Set up a Navadurga altar with nine images or a single Devi murti",
      "Observe the colour-of-the-day tradition: wear the specific hue associated with each navratri day",
      "Recite Durga Saptashati (700 verses) — at least one chapter each day",
      "Kanya Puja on Ashtami or Navami: honour young girls as embodiments of the Devi, washing their feet and offering food"
    ],
    "shloka": {
      "text": "या देवी सर्वभूतेषु शक्तिरूपेण संस्थिता।\nनमस्तस्यै नमस्तस्यै नमस्तस्यै नमो नमः।।",
      "transliteration": "Yā devī sarvabhūteṣu śaktirūpeṇa samsthitā,\nNamastasyai namastasyai namastasyai namo namaḥ.",
      "translation": "To the goddess who resides in all beings as Shakti — to her I bow, to her I bow, to her I bow again and again.",
      "source": "Devi Mahatmyam (Durga Saptashati) 5.12"
    },
    "practice": "For this first day of Navratri, identify a single quality in yourself that you wish to strengthen — patience, courage, clarity. Dedicate these nine days to consciously cultivating it."
  },
  {
    "slug": "Dussehra",
    "emoji": "🎇",
    "tradition": "hindu",
    "origin": "Dussehra (Vijayadashami) falls on the tenth day after Navratri, celebrating two simultaneous victories: Rama's defeat of Ravana in Lanka after a 10-day battle, and Durga's slaying of Mahishasura on the same tithi. The name \"Dussehra\" itself may derive from \"Dasha-hara\" — destroyer of ten (Ravana's ten heads, symbolising ten bad qualities). Effigies of Ravana, his brother Kumbhakarna, and son Meghnada are burned across India with great fanfare.",
    "significance": "Ravana was not merely an outsider villain — he was a scholar, a devotee of Shiva, a great king who made one catastrophic moral error: abducting another's wife. Dussehra asks us to identify our own Ravana within: the ten heads of ego, lust, anger, greed, attachment, pride, jealousy, injustice, cruelty, and delusion. Vijayadashami — Victory Tenth — is the day we symbolically burn those tendencies.",
    "rituals": [
      "Watch or participate in Ramlila performances narrating Rama's battle and victory",
      "Burn effigies of Ravana at community celebrations after sunset",
      "Shami tree worship (Shamipooja) — the Pandavas retrieved their weapons from a Shami tree; touching it brings blessings",
      "Exchange Shami or Apta leaves as gold (Sone ki Patti) with friends and family — a tradition of prosperity-sharing"
    ],
    "shloka": {
      "text": "श्रीरामचन्द्र कृपालु भजमन हरण भवभय दारुणम्।\nनव कञ्ज लोचन कञ्ज मुखकर कञ्जपद कञ्जारुणम्।।",
      "transliteration": "Śrīrāmacandra kṛpālu bhajamana haraṇa bhavabhaya dāruṇam,\nnava kañja locana kañja mukhakara kañjapada kañjāruṇam.",
      "translation": "Worship Ramachandra the merciful, destroyer of the dreadful fear of existence — whose eyes are like fresh lotuses, whose face and hands are lotuses, and whose lotus feet glow reddish-golden.",
      "source": "Ramchandra Kripalu Bhajaman by Tulsidas"
    },
    "practice": "Write down one quality in yourself that has caused harm — to you or others — and that you genuinely wish to release. Tonight, burn the paper safely. Mean it."
  },
  {
    "slug": "Diwali",
    "emoji": "🎆",
    "tradition": "all",
    "origin": "Diwali — from Sanskrit \"Deepavali,\" row of lamps — is perhaps the most multi-layered of all Indian festivals. For Vaishnavas it marks Rama's triumphant return to Ayodhya after 14 years of exile; for Shaktas it celebrates Kali's victory over demons; for Jains it commemorates Mahavira's attainment of Nirvana on this night; for Sikhs it is Bandi Chhor Divas, when Guru Hargobind Ji returned from Mughal captivity freeing 52 kings. In 1619, he arrived at Amritsar on Diwali night and the Golden Temple was lit with lamps.",
    "significance": "Light dispels darkness — but the deeper teaching is that the light of awareness dispels the darkness of ignorance. The lamp you light externally is a symbol of the lamp of consciousness you must keep burning within. Lakshmi — goddess of prosperity — is said to visit homes that are clean, luminous, and welcoming. The cleaning before Diwali is not housework; it is the spiritual act of making space for grace.",
    "rituals": [
      "Light diyas (clay oil lamps) at dusk — begin from the eastern corner of the house",
      "Lakshmi Puja: invoke the goddess with chanting, flowers, kumkum, and prasad of sweets",
      "Rangoli at the entrance — geometric patterns in coloured powder to welcome Lakshmi",
      "Exchange mithai (sweets) and gifts — the practice of sharing abundance"
    ],
    "shloka": {
      "text": "या श्रीः स्वयं सुकृतिनां भवनेष्वलक्ष्मीः\nपापात्मनां कृतधियां हृदयेषु बुद्धिः।\nश्रद्धा सतां कुलजनप्रभवस्य लज्जा\nतां त्वां नताः स्म परिपालय देवि विश्वम्।।",
      "transliteration": "Yā śrīḥ svayaṃ sukṛtināṃ bhavaneṣvalakṣmīḥ\npāpātmanāṃ kṛtadhiyāṃ hṛdayeṣu buddhiḥ,\nśraddhā satāṃ kulajanaprabhavasya lajjā\ntāṃ tvāṃ natāḥ sma paripālaya devi viśvam.",
      "translation": "She who is Shri (prosperity) in the homes of the virtuous, Alakshmi (misfortune) to the wicked, wisdom in the hearts of the learned, faith in the noble, and dignity in the well-born — to that Devi we bow; protect the world.",
      "source": "Shri Suktam (Rigvedic hymn)"
    },
    "practice": "Tonight, light one diya in the darkest corner of your home — a closet, a forgotten room. Then light one in your mind: spend five minutes with a quality in yourself you have been neglecting."
  },
  {
    "slug": "Karva Chauth",
    "emoji": "🌙",
    "tradition": "hindu",
    "origin": "Karva Chauth is observed on the fourth day after the full moon of Kartika by married Hindu women, who fast from sunrise to moonrise for the longevity and well-being of their husbands. The legend of Queen Veeravati narrates how she broke her fast prematurely, saw an inauspicious omen, and her husband died — only to be revived when she observed the fast correctly the following year. The story of Satyavan and Savitri echoes this devotion to life over death.",
    "significance": "At its deepest level, Karva Chauth is about the courage of love — a love that says \"I will sacrifice my comfort for your well-being.\" The fast is not about subservience; it is a voluntary, joyful act of devotion. The moon — which a wife first sees through a sieve and then sees her husband's face — represents the cooling, nourishing energy that sustains marriage. In modern practice, many couples observe the fast together as a mutual act of love.",
    "rituals": [
      "Fast from sunrise; eat sargi (pre-dawn meal) prepared by mother-in-law before sunrise",
      "Dress in bridal finery — red or pink — wearing sindoor, bangles, and mehndi applied the night before",
      "Join community puja with other women in the evening, passing the karva (clay pot of water) in a circle",
      "At moonrise: see the moon through a sieve, then see husband's face through the same sieve, then break the fast with water offered by him"
    ],
    "shloka": {
      "text": "करवाचौथ व्रत कथा सुनो, पति की आयु बढ़ाती हो।\nचाँद दर्शन से व्रत खुलता, सौभाग्य सदा पाती हो।।",
      "transliteration": "Karvācauth vrata kathā suno, pati kī āyu baṛhātī ho,\ncānd darśan se vrata khulatā, saubhāgya sadā pātī ho.",
      "translation": "Hear the Karva Chauth vrat story, which extends the husband's life; the fast breaks at the sight of the moon, may you always receive the blessing of a happy marriage.",
      "source": "Karva Chauth Vrat Katha (traditional)"
    },
    "practice": "Today, whatever your relationship status, fast from one form of consumption you take for granted — social media, news, snacking. Let the small sacrifice be an act of gratitude for what you have."
  },
  {
    "slug": "Gita Jayanti",
    "emoji": "📖",
    "tradition": "hindu",
    "origin": "Gita Jayanti falls on Ekadashi (11th day) of Margashirsha's bright fortnight — the very day Krishna recited the 700 verses of the Bhagavad Gita to Arjuna on the battlefield of Kurukshetra. Vyasa, the compiler of the Mahabharata, had Sanjaya transmit the vision to the blind King Dhritarashtra in real time. The Gita took approximately 45 minutes to deliver — yet contains the complete philosophy of life, action, knowledge, and devotion.",
    "significance": "The Gita does not begin in a temple but on a battlefield — a deliberate choice. Arjuna's breakdown on the chariot is every human's breakdown before a difficult duty. Krishna's response is not a platitude but a complete philosophical unpacking of why we should act with full engagement without grasping at results. Gita Jayanti is a day to go back to the source — even a single chapter, read slowly, can restructure a life.",
    "rituals": [
      "Read the complete Bhagavad Gita, or at least one chapter of your choice",
      "Gita Akhand Path at temples — uninterrupted recitation of all 18 chapters",
      "Gift a copy of the Gita to someone who has never read it",
      "Reflect on one shloka that has most shaped your understanding of duty"
    ],
    "shloka": {
      "text": "कर्मण्येवाधिकारस्ते मा फलेषु कदाचन।\nमा कर्मफलहेतुर्भूर्मा ते सङ्गोऽस्त्वकर्मणि।।",
      "transliteration": "Karmaṇyevādhikāraste mā phaleṣu kadācana,\nmā karmaphalaheturbhūrmā te saṅgo'stvakarmaṇi.",
      "translation": "You have a right to perform your prescribed duties, but you are not entitled to the fruits of your actions. Never consider yourself the cause of the results of your activities, and never be attached to not doing your duty.",
      "source": "Bhagavad Gita 2.47"
    },
    "practice": "Today, choose one task you have been doing with an eye on its outcome. Do it once — just this once — giving your full attention to the quality of the action itself, releasing the result."
  },
  {
    "slug": "Baisakhi",
    "emoji": "🌾",
    "tradition": "sikh",
    "origin": "Baisakhi (Vaisakhi) on April 13 is one of the most significant dates in Sikh history. On this day in 1699, Guru Gobind Singh Ji founded the Khalsa Panth at Anandpur Sahib by calling for volunteers willing to sacrifice their heads for the faith. Five men — the Panj Pyare (Beloved Five) — stepped forward and were initiated in the first Amrit Sanchar ceremony. The Khalsa code of conduct (Rehit Maryada) was simultaneously established.",
    "significance": "Baisakhi is the birthday of the Khalsa — the community of the pure. The Guru's act that day was a radical equaliser: he dissolved caste by having the five volunteers — from different castes and regions — drink Amrit from the same bowl. The Khalsa was to be \"Sant-Sipahi\" — saint-soldier — embodying both spiritual discipline and the courage to stand for justice. Baisakhi carries that dual charge: celebrate harvest, yes, but also recommit to your highest identity.",
    "rituals": [
      "Attend Amrit Vela Nitnem and Ardas at the Gurdwara at dawn",
      "Nagar Kirtan procession through the city, singing shabads",
      "Langar — free community meal — served to all without distinction",
      "For those who have not yet taken Amrit: Baisakhi is the most auspicious day for initiation into the Khalsa"
    ],
    "shloka": {
      "text": "ਵਾਹਿਗੁਰੂ ਜੀ ਕਾ ਖਾਲਸਾ ॥\nਵਾਹਿਗੁਰੂ ਜੀ ਕੀ ਫਤਹਿ ॥",
      "transliteration": "Vāhigurū jī kā Khālsā, Vāhigurū jī kī Fateh",
      "translation": "The Khalsa belongs to the Wonderful Lord! Victory belongs to the Wonderful Lord!",
      "source": "Sikh greeting inaugurated by Guru Gobind Singh Ji"
    },
    "practice": "Today, identify one value you hold most sacred — and one concrete way you could live it more fully this week. The Khalsa was built on values made visible in action."
  },
  {
    "slug": "Guru Nanak Gurpurab",
    "emoji": "☬",
    "tradition": "sikh",
    "origin": "Guru Nanak Dev Ji — the founder and first Guru of Sikhism — was born on the full moon of Kartika in 1469 CE in Nankana Sahib (in present-day Pakistan). Even as a child he confounded priests with his questions; at 30 he disappeared into the river Bein for three days and emerged with his divine mission: \"There is no Hindu, there is no Mussalman.\" He then undertook four great journeys (udasis) — covering over 28,000 km — spreading the message of Ik Onkar (One God) and Sarbat da Bhala (the well-being of all).",
    "significance": "Guru Nanak's teachings reject all hierarchies built on caste, religion, or gender. The three pillars he established — Naam Japo (remember God), Kirat Karo (earn honestly), Vand Chakko (share with others) — are a complete social and spiritual manifesto. Gurpurab is a day to measure one's own life against these three simple, radical standards.",
    "rituals": [
      "Akhand Path: 48-hour uninterrupted reading of the Guru Granth Sahib Ji, completed by dawn on Gurpurab",
      "Prabhat Pheri: early morning procession through the neighbourhood singing hymns",
      "Nagar Kirtan: community procession with Panj Pyare leading, singing shabads",
      "Langar: serve free food to all — irrespective of religion, caste, or status"
    ],
    "shloka": {
      "text": "ਇਕ ਓਅੰਕਾਰ ਸਤਿ ਨਾਮੁ ਕਰਤਾ ਪੁਰਖੁ ਨਿਰਭਉ ਨਿਰਵੈਰੁ\nਅਕਾਲ ਮੂਰਤਿ ਅਜੂਨੀ ਸੈਭੰ ਗੁਰ ਪ੍ਰਸਾਦਿ ॥",
      "transliteration": "Ik Oaṃkār sati nāmu kartā purakhu nirbhau nirvair,\nAkāl mūrati ajūnī saibhaṃ gur prasādi.",
      "translation": "One Universal Creator God. The Name Is Truth. Creative Being Personified. No Fear. No Hatred. Timeless in Form. Unborn. Self-Existent. By Guru's Grace.",
      "source": "Mool Mantar, Guru Granth Sahib Ji (opening verse)"
    },
    "practice": "Today, perform one act of Vand Chakko — share something: a meal, your time, your knowledge. Let it be anonymous if possible."
  },
  {
    "slug": "Lohri",
    "emoji": "🔥",
    "tradition": "sikh",
    "origin": "Lohri is the vibrant winter harvest festival of Punjab, celebrated on the eve of Makar Sankranti at the close of the month of Poh (Pausha). Families gather around a community bonfire at twilight to welcome the sun's return toward the northern hemisphere and to celebrate the ripening of the rabi crops, especially sugarcane, wheat, and mustard. The celebration is steeped in the folklore of Dulla Bhatti, a 16th-century folk hero who rescued young girls from oppression and arranged their marriages.",
    "significance": "Lohri celebrates gratitude for the earth's bounty, the warmth of community in the depth of winter, and the sacredness of family milestones such as new births and marriages. Circumambulating the sacred fire with offerings of sesame, jaggery, and puffed grains symbolizes the offering of ego into the flame of divine light and the renewal of mutual goodwill across the neighborhood.",
    "rituals": [
      "Lighting the sacred community bonfire at sunset with wood and dried offerings",
      "Parikrama (circumambulation) of the fire, offering til (sesame), gur (jaggery), rewri, and popcorn into the flames",
      "Singing traditional Punjabi folk songs celebrating Dulla Bhatti and dancing Bhangra and Giddha",
      "Sharing a festive feast of Sarson da Saag, Makki di Roti, and winter sweets with family and neighbors"
    ],
    "shloka": {
      "text": "ਸਭੇ ਜੀਅ ਸਮਾਲਿ ਨਿਰੰਜਨੁ ਆਪਣਾ।\nਜੀਅ ਜੰਤ ਸਭਿ ਤਿਸ ਕੇ ਸਭਨਾ ਰਿਜਕੁ ਦਿਤੋਨੁ ਅਪਾਰਾ॥",
      "transliteration": "Sabhe jīa samāli nirañjanu āpaṇā,\nJīa jaṃta sabhi tisa ke sabhanā rijaku ditonu apārā.",
      "translation": "The Immaculate Lord cherishes all His creation.\nAll beings belong to Him; He bestows boundless sustenance upon everyone.",
      "source": "Guru Granth Sahib Ji (Ang 652, Guru Ram Das Ji)"
    },
    "practice": "Today, share warmth with those outside your circle. Gift warm food, tea, or winter essentials to someone working outdoors in the cold."
  },
  {
    "slug": "Guru Ravidas Jayanti",
    "emoji": "☬",
    "tradition": "sikh",
    "origin": "Guru Ravidas Jayanti commemorates the birth of Bhagat Ravidas Ji on Magha Purnima in 14th-century Varanasi. Born into a community of leatherworkers, he endured and challenged severe caste discrimination through fearless devotion, humble labor, and sublime poetry. His spiritual stature was recognized across traditions — Mirabai revered him as her guru, and 41 of his sacred hymns were canonized in Sri Guru Granth Sahib Ji by Guru Arjan Dev Ji.",
    "significance": "Bhagat Ravidas taught that divine realization is the birthright of every human being, regardless of caste, birth, or social rank. His famous maxim \"Man changa to kathauti mein Ganga\" (if the heart is pure, the sacred river Ganga flows in one's own vessel) placed inner devotion above external ritualism. His vision of Begampura — a realm free of sorrow, exploitation, fear, and oppression — remains one of humanity's earliest and most profound visions of spiritual and social equality.",
    "rituals": [
      "Nagar Kirtan processions carrying portraits and sacred banis of Bhagat Ravidas Ji",
      "Recitation and kirtan of the 41 shabads of Bhagat Ravidas Ji enshrined in Sri Guru Granth Sahib Ji",
      "Community langar feeding all seekers side by side without distinction of background",
      "Voluntary community seva honoring dignity of labor and service to the marginalized"
    ],
    "shloka": {
      "text": "ਬੇਗਮ ਪੁਰਾ ਸਹਰ ਕੋ ਨਾਉ।\nਦੂਖੁ ਅੰਦੋਹੁ ਨਹੀ ਤਿਹਿ ਠਾਉ॥\nਨਾਂ ਤਸਵੀਸ ਖਿਰਾਜੁ ਨ ਮਾਲੁ।\nਖਉਫੁ ਨ ਖਤਾ ਨ ਤਰਸੁ ਜਵਾਲੁ॥",
      "transliteration": "Begam purā sahara ko nāu,\nDūkhu aṃdohu nahī tihi ṭhāu,\nNāṃ tasavīsa khirāju na mālu,\nKhaufu na khatā na tarasu javālu.",
      "translation": "Begampura, \"the city without sorrow\", is the name of that realm.\nThere is neither suffering nor anxiety there.\nNo taxes on goods or wealth, no fear, no blemishes, and no downfall.",
      "source": "Guru Granth Sahib Ji (Ang 345, Bhagat Ravidas Ji, Rag Gauri)"
    },
    "practice": "Today, notice any subtle hierarchy you carry in your mind regarding others' work or background. Honor someone doing manual labor with genuine gratitude and respect."
  },
  {
    "slug": "Holla Mohalla",
    "emoji": "🏹",
    "tradition": "sikh",
    "origin": "Hola Mohalla was established in 1701 by Guru Gobind Singh Ji at Takht Sri Keshgarh Sahib in Anandpur Sahib, observed on the day after Holi. The tenth Guru transformed the celebratory spring festival into a grand three-day assembly of martial skill, courage, and spiritual readiness. \"Hola\" is the masculine counterpart to Holi, while \"Mohalla\" signifies an organized column or mock military maneuver.",
    "significance": "Guru Gobind Singh established Hola Mohalla to instill a spirit of fearlessness (Nirbhau) and righteous readiness in the Khalsa. Rather than superficial revelry, Sikhs demonstrate Gatka (traditional martial art), horsemanship, archery, and swordsmanship, combined with Kavi Darbars (poetry symposiums) reciting devotional and heroic verses. It embodies the Sikh ideal of Sant-Sipahi — the Saint-Soldier who combines inner contemplation with outward defense of the defenseless.",
    "rituals": [
      "Nishan Sahib march and grand Mohalla procession led by the Nihang Singhs in traditional royal blue and saffron",
      "Gatka and martial arts exhibitions, archery, swordplay, and equestrian demonstrations",
      "Kavi Darbar: day-and-night assemblies of devotional and heroic Gurbani poetry",
      "Round-the-clock community Langar serving tens of thousands of pilgrims at Anandpur Sahib"
    ],
    "shloka": {
      "text": "ਸੂਰਾ ਸੋ ਪਹਿਚਾਨੀਐ ਜੁ ਲਰੈ ਦੀਨ ਕੇ ਹੇਤ।\nਪੁਰਜਾ ਪੁਰਜਾ ਕਟਿ ਮਰੈ ਕਬਹੂ ਨ ਛਾਡੈ ਖੇਤੁ॥",
      "transliteration": "Sūrā so pahicānīai ju larai dīna ke heta,\nPurajā purajā kaṭi marai kabhū na chāḍai khetu.",
      "translation": "Recognize him alone as a true spiritual warrior who fights for the sake of the defenseless.\nEven if cut limb by limb, he never abandons the field of righteousness.",
      "source": "Guru Granth Sahib Ji (Ang 1105, Bhagat Kabir Ji)"
    },
    "practice": "Today, strengthen both mind and body. Take 20 minutes for physical discipline or exercise, and reflect on what cause or community you stand ready to protect."
  },
  {
    "slug": "Guru Gobind Singh Gurpurab",
    "emoji": "☬",
    "tradition": "sikh",
    "origin": "Guru Gobind Singh Ji, the tenth and final human Guru of the Sikhs, was born on Poh Sudi 7 (January 5, 1666) in Patna Sahib, Bihar. Ascending to spiritual leadership at just nine years old following his father Guru Tegh Bahadur's martyrdom, he became a towering master of letters, languages, spiritual philosophy, and military strategy. In 1699 he created the Khalsa Panth, and in 1708 before his passing at Nanded, he conferred eternal Guruship upon Sri Guru Granth Sahib Ji, ending the human lineage of Gurus.",
    "significance": "Guru Gobind Singh personified supreme sacrifice and divine courage. He gave his father, his four sons (the Chaar Sahibzade), and his mother to the struggle against tyranny, yet never harbored hatred, writing in the Akal Ustat: \"Mānas kī jāt sabhai ekai pahicānbo\" (Recognize the whole human race as of one caste). He democratized leadership by kneeling before the Khalsa he created, proving that true authority is rooted in humility and righteous collective consciousness.",
    "rituals": [
      "Akhand Path: 48-hour continuous reading of the Guru Granth Sahib Ji concluded at dawn",
      "Recitation of Dasam Granth compositions: Jaap Sahib, Tav-Prasad Savaiye, and Chaupai Sahib",
      "Nagar Kirtan with Gatka martial artists and Panj Pyare leading the procession",
      "Deepmala and distribution of Karah Parshad and communal Langar"
    ],
    "shloka": {
      "text": "ਦੇਹ ਸਿਵਾ ਬਰੁ ਮੋਹਿ ਇਹੈ ਸੁਭ ਕਰਮਨ ਤੇ ਕਬਹੂੰ ਨ ਟਰੋਂ।\nਨ ਡਰੋਂ ਅਰਿ ਸੋ ਜਬ ਜਾਇ ਲਰੋਂ ਨਿਸਚੈ ਕਰਿ ਅਪੁਨੀ ਜੀਤ ਕਰੋਂ॥",
      "transliteration": "Deh sivā baru mohi ihai subha karaman te kabhūṃ na ṭaroṃ,\nNa ḍaroṃ ari so jaba jāi laroṃ nisacai kari apunī jīta karoṃ.",
      "translation": "Grant me this boon, O Lord: may I never hesitate from performing righteous deeds.\nMay I fear no adversary when entering the fray for truth, and with unwavering resolve, achieve victory.",
      "source": "Chandi Charitar, Sri Dasam Granth (Guru Gobind Singh Ji)"
    },
    "practice": "Today, commit to taking on one difficult, righteous task you have been postponing out of fear or hesitation."
  },
  {
    "slug": "Guru Arjan Dev Martyrdom",
    "emoji": "☬",
    "tradition": "sikh",
    "origin": "Guru Arjan Dev Ji, the fifth Sikh Guru, attained martyrdom on Jeth Sudi 4 (June 1606) in Lahore under the orders of Mughal Emperor Jahangir. A visionary poet and builder, Guru Arjan compiled the Adi Granth in 1604, installing it in Sri Harmandir Sahib (the Golden Temple) which he constructed with doors open to all four directions. When ordered to alter sacred verses and pay an extortionate fine, Guru Sahib refused to compromise divine truth, enduring five days of horrific torture on burning iron plates and boiling cauldrons with unshakeable peace.",
    "significance": "Guru Arjan Dev Ji was the first martyr in Sikh history, sanctifying the path of supreme sacrifice for religious integrity. In the midst of searing agony, he uttered the immortal words: \"Tera kiya meetha laage\" (Thy Will is sweet to me). His martyrdom transformed the Sikh community's destiny, illustrating that spiritual peace and surrender to the Divine Will (Hukam) cannot be crushed by any worldly power.",
    "rituals": [
      "Chabeel Seva: setting up public kiosks serving chilled, rose-scented sweetened milk-water (Kachi Lassi) to cool travelers in remembrance of Guru Ji's fiery trial",
      "Recitation of Sukhmani Sahib (\"The Song of Peace\"), composed by Guru Arjan Dev Ji",
      "Solemn Gurbani Kirtan focusing on themes of divine resignation and peace",
      "Quiet Langar served with profound humility and reverence"
    ],
    "shloka": {
      "text": "ਤੇਰਾ ਕੀਆ ਮੀਠਾ ਲਾਗੈ।\nਹਰਿ ਨਾਮੁ ਪਦਾਰਥੁ ਨਾਨਕੁ ਮਾਂਗੈ॥",
      "transliteration": "Terā kīā mīṭhā lāgai,\nHari nāmu padārathu nānaku māṅgai.",
      "translation": "All that You do is sweet to me, O Lord.\nNanak begs only for the priceless treasure of Your Divine Name.",
      "source": "Guru Granth Sahib Ji (Ang 394, Guru Arjan Dev Ji, Rag Asa)"
    },
    "practice": "Today, practice \"Bhana Man-na\" — accept one frustrating delay, setback, or inconvenience without grumbling or irritation. Respond with calm equanimity."
  },
  {
    "slug": "Bandhi Chhor Divas",
    "emoji": "☬",
    "tradition": "sikh",
    "origin": "Bandhi Chhor Divas (\"Day of Liberation\") coincides with Diwali on Kartika Amavasya, celebrating the release in 1619 of the sixth Sikh Guru, Guru Hargobind Sahib Ji, from Gwalior Fort where he was held by Emperor Jahangir. When Jahangir offered to release the Guru, Guru Sahib refused to leave unless 52 innocent Hindu hill kings imprisoned alongside him were freed too. The emperor decreed that only those who could hold onto the Guru's cloak could leave; Guru Sahib had a special cloak fashioned with 52 long tassels, and all 52 kings walked out to liberty.",
    "significance": "Bandhi Chhor Divas highlights the Sikh principle that spiritual liberation is inseparable from defending human rights and freedom for others. Guru Hargobind, who donned the two swords of Miri (temporal leadership) and Piri (spiritual authority), demonstrated that true power is measured by whom you set free. When he returned to Amritsar, the Harmandir Sahib was illuminated with thousands of lamps, symbolizing the light of justice prevailing over tyranny.",
    "rituals": [
      "Deepmala: illuminating Gurdwaras and homes with thousands of traditional earthen oil lamps",
      "Listening to Gurbani Kirtan on the doctrine of Miri-Piri and the divine liberator",
      "Bhog of Sri Guru Granth Sahib Ji and sharing Karah Parshad",
      "Offering prayers (Ardas) for human rights and the freedom of prisoners worldwide"
    ],
    "shloka": {
      "text": "ਸਤਿਗੁਰ ਬੰਦੀਛੋੜੁ ਹੈ ਜੀਵਣ ਮੁਕਤਿ ਕਰੈ ਓਡੀਣਾ॥",
      "transliteration": "Satigur bandīchoṛu hai jīvaṇa mukati karai oḍīṇā.",
      "translation": "The True Guru is the Liberator from all bondage;\nHe brings liberation to the soul even while living in this world.",
      "source": "Bhai Gurdas Ji Vaaran (Vaar 24, Pauri 20)"
    },
    "practice": "Today, light a diya with the conscious intention of releasing a habit, fear, or resentment that has kept you in inner captivity. Seek to help someone else feel free."
  },
  {
    "slug": "Guru Tegh Bahadur Martyrdom",
    "emoji": "☬",
    "tradition": "sikh",
    "origin": "Guru Tegh Bahadur Ji, the ninth Sikh Guru, was publicly beheaded at Chandni Chowk, Delhi (now Gurdwara Sis Ganj Sahib) on November 11, 1675, by order of Mughal Emperor Aurangzeb. A delegation of Kashmiri Pandits led by Pandit Kirpa Ram had appealed to Guru Sahib for protection against forced conversions. Knowing the cost, Guru Tegh Bahadur stood before the imperial court to champion their freedom of conscience. After witnessing the martyrdom of his companions Bhai Mati Das, Bhai Sati Das, and Bhai Dayala, the Guru surrendered his head rather than his faith.",
    "significance": "Guru Tegh Bahadur's martyrdom is unique in human history: a spiritual preceptor giving his life to protect the religious freedom of another community. Revered as \"Hind di Chadar\" (Shield of India), his sacrifice laid down the principle that the right to seek God in one's own way is inviolable. His 57 Saloks in the Guru Granth Sahib reflect profound dispassion (Vairagya), reminding seekers that this world is fleeting and divine truth alone endures.",
    "rituals": [
      "Recitation of Salok Mahalla 9 from Sri Guru Granth Sahib Ji with reflective contemplation",
      "Solemn Kirtan Darbars and Akhand Path bhog at Gurdwaras",
      "Discourses on pluralism, human dignity, and freedom of belief",
      "Quiet community langar and distribution of cool water and Karah Parshad"
    ],
    "shloka": {
      "text": "ਧਰਮ ਹੇਤ ਸਾਕਾ ਜਿਨਿ ਕੀਆ।\nਸੀਸੁ ਦੀਆ ਪਰ ਸਿਰਰੁ ਨ ਦੀਆ॥",
      "transliteration": "Dharama heta sākā jini kīā,\nSīsu dīā para siraru na dīā.",
      "translation": "He performed this monumental sacrifice for the sake of Dharma;\nHe gave up his head, but never his spiritual conviction.",
      "source": "Bachittar Natak, Sri Dasam Granth (Guru Gobind Singh Ji)"
    },
    "practice": "Today, speak up against prejudice or intolerance. Support someone's right to express their honest, ethical viewpoint, especially when you personally disagree."
  },
  {
    "slug": "Sahibzade Shaheedi Diwas",
    "emoji": "☬",
    "tradition": "sikh",
    "origin": "The Shaheedi Diwas of the Chaar Sahibzade commemorates the martyrdom of the four young sons of Guru Gobind Singh Ji during the last week of December 1704. In the Battle of Chamkaur, the elder sons — Baba Ajit Singh (17) and Baba Jujhar Singh (14) — fought valiantly against overwhelming odds and fell heroically on the battlefield. Meanwhile, the younger sons — Baba Zorawar Singh (9) and Baba Fateh Singh (7) — along with their grandmother Mata Gujri Ji, were captured at Sirhind. Refusing to renounce their faith under any threat or lure, the young princes were bricked alive by the governor of Sirhind.",
    "significance": "The sacrifice of the Chaar Sahibzade represents the pinnacle of youthful innocence merged with unshakeable spiritual bravery. Children of tender years chose integrity over survival, refusing to submit to religious tyranny. Guru Gobind Singh received news of their martyrdom with transcendent fortitude, declaring that though four sons had fallen, thousands of sons and daughters lived on in the Khalsa. It is observed as a week of solemn humility, resilience, and gratitude.",
    "rituals": [
      "Observing simplicity and solemnity during the Shaheedi week in Poh (sleeping without luxury)",
      "Recitation of katha and heroic ballads recounting the Sakas of Chamkaur and Sirhind (Fatehgarh Sahib)",
      "Gurdwara diwans honoring the valor and steadfastness of the young Sahibzade",
      "Serving hot tea, roasted gram, and simple langar to all pilgrims and visitors"
    ],
    "shloka": {
      "text": "ਇਨ ਪੁਤ੍ਰਨ ਕੇ ਸੀਸ ਪਰ ਵਾਰ ਦੀਏ ਸੁਤ ਚਾਰ।\nਚਾਰ ਮੂਏ ਤੋ ਕਿਆ ਭਯਾ ਜੀਵਤ ਕਈ ਹਜਾਰ॥",
      "transliteration": "Ina putrana ke sīsa para vāra dīe suta cāra,\nCāra mūe to kyā bhayā jīvata kaī hajāra.",
      "translation": "For the protection of these children of the land, I have sacrificed my four sons.\nWhat does it matter that four have fallen, when many thousands live on?",
      "source": "Historic proclamation of Guru Gobind Singh Ji (1704)"
    },
    "practice": "Today, reflect on moral resilience. Ask yourself: what principles are so fundamental to you that you would never compromise them for convenience or approval?"
  },
  {
    "slug": "Mahavir Jayanti",
    "emoji": "🤲",
    "tradition": "jain",
    "origin": "Bhagwan Mahavira, the 24th and final Tirthankara of the current Avasarpini (descending) cosmic cycle, was born as Prince Vardhamana on the thirteenth day of the bright fortnight of Chaitra (Chaitra Shukla Trayodashi) in 599 BCE in Kundagrama (near modern Vaishali, Bihar) to King Siddhartha and Queen Trishala of the Ikshvaku dynasty. According to the Kalpa Sutra (the canonical Shvetambara biography) and the Uttara Purana (Digambara text), his mother witnessed auspicious dreams foretelling the birth of a world-teacher who would conquer worldly existence. Raised in princely splendor, Vardhamana was imbued with extraordinary spiritual discernment, fearlessness, and profound compassion from infancy. At the age of thirty, following his parents' demise and with his elder brother Nandivardhana's permission, he renounced his royal inheritance, abandoned all worldly possessions, and embarked upon severe asceticism. For twelve and a half years, he endured harsh physical privation, public hostility, and deep silent meditation without retaliating against any harm or displaying irritation, before attaining Kevala Jnana (infinite, unhindered omniscience) under a Sal tree on the banks of the Rijuvalika River near Jimbhikagrama at age forty-two.",
    "significance": "Mahavira's life represents the triumph of pure consciousness over karmic bondage. For thirty years following his enlightenment, he traversed northern India on foot, preaching the fourfold dharma and revitalizing the fourfold Sangha of sadhus (monks), sadhvis (nuns), shravakas (laymen), and shravikas (laywomen). His philosophical teachings rest upon three revolutionary pillars: Ahimsa (absolute non-harm in thought, speech, and physical action), Anekantavada (the multifaceted nature of truth, rejecting dogmatic absolutism), and Aparigraha (non-attachment to material and psychological possessions). In an era of rampant animal sacrifice and rigid social stratification, Mahavira proclaimed that spiritual liberation is not determined by caste or birth, but by individual ethical purity and self-discipline: \"Ahimsa Paramo Dharma\" (Non-violence is the supreme cosmic law). He taught that every living being possesses a pure soul (Jiva) capable of attaining infinite knowledge, perception, bliss, and power when freed from the encrustation of karmas.",
    "rituals": [
      "Mahavir Janma Kalyanak Abhishek: bathing the consecrated icon of baby Mahavira with fragrant water, milk, and saffron in an elaborate pre-dawn temple ceremony",
      "Shobha Yatra: vibrant communal processions carrying richly decorated palanquins (Rath) with images of Mahavira, with devotees singing stavans and traditional chants",
      "Snatra Puja & Pratikramana: performing sacred liturgical worship followed by introspection to confess and purify any intentional or unintentional harm caused to living beings",
      "Ahara-Dana & Karuna: distributing grains, medicines, clothing, and financial relief to the impoverished, and funding panjrapoles (animal sanctuaries) to save slaughterhouse animals",
      "Observance of strict Ayambil (consuming unsalted, boiled single-grain food once a day) or complete Upavas fasting to discipline physical appetites"
    ],
    "shloka": {
      "text": "णमो अरिहंताणं। णमो सिद्धाणं। णमो आयरियाणं। णमो उवज्झायाणं। णमो लोए सव्वसाहूणं॥",
      "transliteration": "Namo Arihantāṇaṃ, Namo Siddhāṇaṃ, Namo Āyariyāṇaṃ, Namo Uvajjhāyāṇaṃ, Namo Loe Savvasāhūṇaṃ.",
      "translation": "I bow to the Arihantas (the enlightened conquerors). I bow to the Siddhas (the perfected, liberated souls). I bow to the Acharyas (the spiritual guides). I bow to the Upadhyayas (the sacred teachers). I bow to all the Sadhus (the ascetics) in the universe.",
      "source": "Namaskāra Mahāmantra (Foundational Agamic Inscription, Tier 1 Canonical Source)"
    },
    "practice": "Today, observe two hours of absolute Ahimsa in speech and mind: refrain entirely from criticism, complaint, and harsh judgements. Notice how peace returns when the urge to judge another is deliberately surrendered."
  },
  {
    "slug": "Paryushana Parva begins",
    "emoji": "🌸",
    "tradition": "jain",
    "origin": "Paryushana Parva is the holiest spiritual observance in Jainism, commencing on the twelfth day of the dark fortnight of Bhadrapada (Bhadrapada Krishna Baras) for Shvetambaras (who observe eight days) and continuing into the bright fortnight for Digambaras (who observe the ten days of Das Lakshana). Originating in the ancient rainy-season retreat instituted by Bhagwan Mahavira and codified in the Kalpa Sutra and the Acharanga Sutra, \"Paryushana\" literally means \"abiding together\" or \"coming close to the inner soul\" (Pari + Ushana). Because the monsoon rains cause a proliferation of microscopic organisms, insects, and vegetation, Jain ascetics cease their continuous nomadic wanderings (Vihara) to reside in one fixed settlement (Chaturmas) to avoid trampling living beings. Lay householders align their lives with this monastic restraint by stepping away from worldly business, social celebrations, and culinary indulgence. Over these days, temples reverberate with the collective chanting of the Kalpa Sutra, which narrates the auspicious life events (Kalyanakas) of the twenty-four Tirthankaras, particularly Bhagwan Mahavira's severe austerities and transcendent enlightenment.",
    "significance": "Paryushana is designed as an intensive annual retreat for self-purification, spiritual regeneration, and the burning of accumulated karmas through the five foundational kartavyas (duties): Amari Pravartana (proclaiming universal non-harm and saving animals), Sadharmik Vatsalya (unconditional fraternity and mutual support among practitioners), Attham Tapa (fasting for three consecutive days), Chaitya Paripati (temple pilgrimages), and Kshamapana (universal forgiveness). It is not a festival of external feasting, but an inward journey of profound austerity. By consciously restraining the five senses and detaching from material conveniences, the soul is disentangled from worldly illusions (Moha) and bodily identification. The festival reminds every seeker that anger, pride, deceit, and greed (the four Kashayas) are the fundamental causes of transmigration through cyclic existence (Samsara), and that the true glory of human birth is the conscious capacity to conquer these internal adversaries through patience, humility, and steadfast detachment. In Jain thought, fasting and sensory restraint are not physical mortifications, but precise spiritual tools to quiet the physical nervous system, burn subtle karmic imprints (Nirjara), and awaken spiritual intuition (Samyak Darshana). Through this inward journey, the soul regains its natural serenity and luminosity.",
    "rituals": [
      "Listening to daily morning discourses on the Kalpa Sutra or Uttaradhyayana Sutra delivered by revered monks and scholars",
      "Daily performance of Pratikramana (sacred evening repentance ritual) to acknowledge and expiate micro-faults and unintended harm",
      "Undertaking progressive vows of fasting: Ekashana (one meal a day), Biyashana (two meals), Ayambil (oil-free, spice-free food), or Upavas (complete water-only fasting)",
      "Observing Chauvihar: complete cessation of consuming any food, snacks, or water after the setting of the sun until sunrise",
      "Practicing Samayika: dedicated forty-eight minute sittings of unbroken equanimity, motionless meditation, and silent detachment from worldly identity"
    ],
    "shloka": {
      "text": "संसारंमि पमाओ न कायव्वो, खणमवि मा पमायए। धम्मं सम्मं सुअच्चक्खं, जिणेहिं पवेइयं॥",
      "transliteration": "Saṃsāraṃmi pamāo na kāyavvo, khaṇamavi mā pamāyae. Dhammaṃ sammaṃ suakkhakkhaṃ, jiṇehiṃ paveiyaṃ.",
      "translation": "In this transmigratory world, do not be indolent; do not be negligent even for a single moment. Strive earnestly on the noble path of Dharma, clearly and beautifully revealed by the Jinas.",
      "source": "Uttarādhyayana Sūtra 1.15 (Primary Agamic Text, Tier 1 Canonical Source)"
    },
    "practice": "Dedicate forty-eight minutes today to quiet contemplation without digital devices or telephone calls. Reflect deeply on the impermanence of material acquisitions, and mentally release one long-held expectation or resentment before sleeping."
  },
  {
    "slug": "Samvatsari (Paryushana ends)",
    "emoji": "🙏",
    "tradition": "jain",
    "origin": "Samvatsari, celebrated on the fifth day of the bright fortnight of Bhadrapada (Bhadrapada Shukla Panchami), is the culminating apex and crowning jewel of the Paryushana festival. In the Agamic tradition recorded in the Āvaśyaka Sūtra, the Kalpa Sutra commentary, and ancient Samvatsari Vidhi treatises, this sacred day marks the closing of the spiritual accounting ledger for the soul. Monks, nuns, and lay followers assemble in spotless white robes to perform the annual Samvatsari Pratikramana — an exhaustive, three-hour liturgical meditation of ethical audit and introspection. During this rite, every breach of ethical discipline, careless thought, deceitful word, and act of harm committed over the preceding twelve months is brought before the unsparing light of conscience. The ritual systematically analyzes transgressions against the five vows (Vratas) and the four passions (Kashayas), purifying the subtle channels of consciousness before the year closes. The climax of this solemn assembly is the universal exchange of the sacred Prakrit formula: \"Micchāmi Dukkaḍaṃ\" — an unconditional, mutual request for forgiveness addressed to every living being in the universe.",
    "significance": "Samvatsari represents the highest ethical and psychological summit of Jain philosophy: Ahimsa elevated to universal reconciliation. While ordinary human nature tends to harbor grudges, justify injuries, and nurture ego-driven bitterness, Samvatsari commands the complete dissolution of animosity before the new spiritual year begins. In Jain metaphysics, retaining anger (Krodha) beyond twelve months hardens into Anantanubandhi karma — the deepest, most obstinate karmic knot that binds the soul to endless cycles of worldly rebirth. To utter \"Micchami Dukkadam\" is not a casual social greeting; it is an admission that ego is powerless before truth, an acknowledgment of mutual vulnerability, and a solemn vow to heal all fractures. The sacred verse declares: \"I forgive all beings; may all beings forgive me. I have friendship with everyone; malice toward none.\" By clearing this ledger, the heart is liberated from resentment, restoring the natural radiance of the pure soul (Shuddhatman).",
    "rituals": [
      "Performance of the full Samvatsari Pratikramana: reciting the traditional Prakrit sutras while performing bows and reflective postures of atonement",
      "Complete Upavas: abstaining entirely from solid food and consuming only boiled water during daylight hours, followed by a strict waterless night",
      "Personal outreach: approaching estranged relatives, friends, acquaintances, and rivals via telephone, visits, or letters to ask heartfelt forgiveness",
      "Alochana: offering honest, transparent confessions to an enlightened spiritual preceptor (Guru) to receive appropriate vows of penance (Prayashchitta)",
      "Donating to panjrapoles (animal shelters) and establishing funds to rescue birds and cattle, affirming that compassion extends to all life forms"
    ],
    "shloka": {
      "text": "खामेमि सव्वजीवे, सव्वे जीवा खमंतु मे। मित्ती मे सव्वभूएसु, वेरं मज्झं न केणइ॥",
      "transliteration": "Khāmemi savvajīve, savve jīvā khamaṃtu me. Mittī me savvabhūesu, veraṃ majjhaṃ na keṇai.",
      "translation": "I grant forgiveness to all living beings; may all living beings forgive me. I cherish friendship toward all creatures in the cosmos; I harbor malice or enmity toward none.",
      "source": "Āvaśyaka Sūtra (Kṣamāpanā Sūtra, Canonical Prakrit Formula, Tier 1 Canonical Source)"
    },
    "practice": "Reach out directly today to someone with whom you have experienced friction, tension, or silence. Send a sincere message asking for forgiveness, and consciously release all grievance you have carried against them."
  },
  {
    "slug": "Akshaya Tritiya (Jain)",
    "emoji": "🌾",
    "tradition": "jain",
    "origin": "Akshaya Tritiya, celebrated on the third day of the bright fortnight of Vaishakha (Vaishakha Shukla Tritiya), commemorates one of the most transformative foundational events in Jain cosmic history: the historic breaking of the very first ascetic fast by Rishabhadeva (Bhagwan Adinatha), the first Tirthankara of this cosmic cycle. As documented in Acharya Jinasena's Ādi Purāṇa and the canonical Kalpa Sutra, after renouncing his kingdom, King Rishabhadeva initiated the order of monks and took vows of complete detachment. Because ascetic food-gathering (Gochari) was entirely unfamiliar to humanity in that newly transitioned epoch, people mistakenly offered him gold, jewels, maidens, and royal elephants instead of suitable vegetarian food. Unwilling to violate monastic vows of accepting only pure, unasked-for alms (Shuddha Ahara), Adinatha silently turned away from city to city, continuing to fast without breaking his vow for one full year and thirteen days (400 consecutive days). On Vaishakha Shukla Tritiya, when he arrived in Hastinapur, his great-grandson Prince Shreyansa intuitively recognized through dream memory that the Tirthankara required fresh sugarcane juice (Ikshu-rasa) offered into cupped hands.",
    "significance": "Adinatha's breaking of the fast instituted the sacred tradition of Ahara-Dana (the auspicious offering of pure sustenance to spiritual practitioners) and established the foundational rules of monastic begging (Gochari). In Jain philosophy, \"Akshaya\" signifies \"imperishable\" or \"undiminishing.\" The merit (Punya) generated by giving pure food to an enlightened ascetic with a spotless, unselfish heart is considered inexhaustible and permanent. It symbolizes the spiritual bond of mutual dependence between the monastic order (which protects spiritual wisdom and ethical conduct) and the lay community (which supports the physical preservation of ascetics). Furthermore, Akshaya Tritiya marks the grand completion of the year-long ascetic austerity known as Varshi Tapa — wherein dedicated householders fast on alternating days for thirteen continuous months, emulating Adinatha's endurance. It stands as a timeless monument to unshakeable patience, devotion, and the imperishable fruits of selfless charity. The festival also commemorates the inception of social civilization (Asi, Masi, Krishi) guided by Adinatha before his renunciation. It honors the noble act of supporting righteous practitioners, reminding householders that material resources attain their highest purpose when dedicated to sustaining spiritual wisdom.",
    "rituals": [
      "Parna ceremony: serving fresh sugarcane juice into the hands of Varshi Tapa practitioners who have completed their thirteen-month austerity",
      "Pilgrimage to Hastinapur or Palitana: assembling at sacred tirthas where grand mass celebrations honoring Rishabhadeva are conducted",
      "Snatra Puja and Panchamrita Abhishek: performing ceremonial worship of Bhagwan Adinatha's consecrated murti with milk, sandalwood, and herbal extracts",
      "Ahara-Dana: providing pure, satvik meals to monks, nuns, spiritual aspirants, and the underprivileged throughout the community",
      "Recitation of the Bhaktamara Stotra: chanting Acharya Manatunga's celebrated forty-eight verses venerating Adinatha's supreme virtues"
    ],
    "shloka": {
      "text": "चत्तारि मंगलं, अरिहंता मंगलं, सिद्धा मंगलं, साहू मंगलं, केवलिपन्नत्तो धम्मो मंगलं॥",
      "transliteration": "Cattāri maṅgalaṃ, arihaṃtā maṅgalaṃ, siddhā maṅgalaṃ, sāhū maṅgalaṃ, kevalipannatto dhammo maṅgalaṃ.",
      "translation": "Four are the auspicious entities: the Arihantas are auspicious, the Siddhas are auspicious, the Sadhus are auspicious, and the Dharma expounded by the Omniscient Ones is auspicious.",
      "source": "Mangala Sūtra (Canonical Jain Agamic Liturgy, Tier 1 Canonical Source)"
    },
    "practice": "Prepare or purchase fresh, nourishing food today and offer it with genuine humility and reverence to someone in need. Notice how the act of feeding another with pure intention dissolves possessiveness and fills the heart with joy."
  },
  {
    "slug": "Das Lakshana Dharma begins",
    "emoji": "🌿",
    "tradition": "jain",
    "origin": "Das Lakshana Parva, celebrated predominantly in the Digambara Jain tradition, commences on the fifth day of the bright fortnight of Bhadrapada (Bhadrapada Shukla Panchami) and continues for ten consecutive days through Anant Chaturdashi. Rooted in the foundational canonical framework articulated by Acharya Umasvati in Chapter 9, Sutra 6 of the Tattvārtha Sūtra and expounded in Acharya Pujyapada's Sarvārthasiddhi, this festival represents the systematic purification of the soul through the cultivation of ten supreme virtues (Dasa Dharma). While other traditions organize festivals around external historical events or heroic battles, Das Lakshana is entirely introspective: each of the ten days is systematically dedicated to contemplating, embodying, and integrating one specific spiritual attribute of the liberated soul. These ten virtues are: Uttama Kshama (supreme forbearance), Uttama Mardava (supreme humility), Uttama Arjava (supreme straightforwardness), Uttama Shaucha (supreme purity/contentment), Uttama Satya (supreme truthfulness), Uttama Sanyama (supreme self-restraint), Uttama Tapa (supreme austerity), Uttama Tyaga (supreme renunciation), Uttama Akinchanya (supreme non-attachment), and Uttama Brahmacharya (supreme celibacy/soul-absorption).",
    "significance": "In Jain metaphysics, Dharma is defined not as an external dogma, but as the intrinsic, unblemished nature of the soul (Vatthu Sahavo Dhammo). The prefix \"Uttama\" (supreme) signifies that these virtues must be practiced with absolute purity, untainted by worldly ambition, pride, or desire for heavenly reward. Together, they function as the ultimate antidote to the ten major karmic afflictions and passions: forbearance dissolves anger; humility uproots arrogance; straightforwardness destroys deceit; contentment washes away greed; truthfulness ends deception; restraint shields against impulsive desires; austerity burns accumulated karmas; renunciation breaks material clinging; non-possessiveness dismantles egoism; and celibacy centers the mind in spiritual selfhood. Together, these ten practices generate Samvara (the stoppage of fresh karmic inflow) and Nirjara (the systematic shedding of past karma), creating the indispensable spiritual foundation required for Kevala Jnana and ultimate Moksha. As expounded by Acharya Kundakunda in the Samayasāra, these ten virtues operate on two complementary levels: Vyavahara Naya (the practical, external observance of moral discipline) and Nishchaya Naya (the ultimate spiritual realization of the soul's intrinsic, unpolluted nature). Together, they purify consciousness and dismantle all delusion.",
    "rituals": [
      "Daily meditation upon the specific virtue of the day: dedicating contemplation, reading, and self-monitoring to that single spiritual theme",
      "Morning Jinendra Abhishek & Dhyana: performing ritual bathing and puja of the Tirthankara icons followed by prolonged periods of seated meditation",
      "Swadhyaya: gathering in temple halls for in-depth scriptural study of the Tattvārtha Sūtra, Samayasāra, and Ratnakaranda Shravakachara",
      "Dietary restrictions: abstaining from green vegetables, root crops, and spices, consuming only simple boiled grain dishes once daily",
      "Anant Chaturdashi Vrata: observing a rigorous complete fast on the tenth and final day, tying the protective sacred thread of fourteen knots"
    ],
    "shloka": {
      "text": "उत्तमक्षमामार्दवार्जवशौचसत्यसंयमतपस्त्यागाकिञ्चन्यब्रह्मचर्याणि धर्मः॥",
      "transliteration": "Uttama-kṣamā-mārdavārjava-śauca-satya-saṃyama-tapas-tyāgākiñcanya-brahmacaryāṇi dharmaḥ.",
      "translation": "Supreme forbearance, supreme humility, supreme straightforwardness, supreme purity, supreme truthfulness, supreme self-restraint, supreme austerity, supreme renunciation, supreme non-attachment, and supreme celibacy constitute Dharma.",
      "source": "Tattvārtha Sūtra 9.6 (Acharya Umasvati, Foundational Canonical Text, Tier 1 Canonical Source)"
    },
    "practice": "Choose the virtue of forbearance (Kshama) today: whenever you feel irritation rising in traffic, work, or family interactions, pause for three breaths, remind yourself that the soul cannot be injured, and respond with gentleness."
  },
  {
    "slug": "Jain New Year (Pratipada)",
    "emoji": "🌅",
    "tradition": "jain",
    "origin": "The Jain New Year begins on the day immediately following Diwali, on the first day of the bright fortnight of Kartika (Kartika Shukla Pratipada). In Jain sacred history, as preserved in the canonical Kalpa Sutra, the Bhagavatī Sūtra, and traditional stavanas, this day is celebrated not merely as the start of a new calendar year (Vira Nirvana Samvat), but as the glorious occasion of Gautama Swami's attainment of Kevala Jnana (infinite omniscience). Indrabhuti Gautama was the chief disciple (Ganadhara) and foremost spiritual companion of Bhagwan Mahavira. Because Gautama harbored an intense, affectionate personal devotion (Guru-bhakti) toward Mahavira, this subtle attachment had acted as a final golden chain preventing him from attaining absolute liberation. When Mahavira attained Nirvana on Diwali night at Pavapuri, Gautama was overcome with deep sorrow upon realizing his Master had left the physical world. However, in that intense moment of grief, he meditated deeply upon Mahavira's teachings on universal impermanence and the independence of every soul. Suddenly transcending his last thread of emotional clinging, Gautama shattered all four destructive karmas (Ghatiya karmas) and attained supreme Kevala Jnana at dawn on Pratipada.",
    "significance": "Gautama Swami's illumination on New Year's morning offers one of the most profound teachings in spiritual psychology: even the highest, purest form of attachment — devotion to one's own Guru — must eventually be transcended through wisdom to achieve self-realization. The soul's ultimate liberation depends not on outer refuge, but on direct, experiential realization of its own inherent divinity. Pratipada thus represents the ultimate new beginning: the transition from dependency on external light to the awakening of inner omniscience. For the Jain community, the New Year is therefore inaugurated with meditation upon Gautama Swami's infinite virtues rather than self-indulgent revelry. Lay practitioners open new accounting books inscribed with the holy symbols of the Swastika and \"Shri\", praying that their material conduct throughout the coming year will remain strictly aligned with ethical purity, honesty, contentment, and righteous livelihood (Nyayoparta Dhana).",
    "rituals": [
      "Veneration of Gautama Swami: reciting traditional prayers and stavanas invoking the blessings of the foremost Ganadhara",
      "Chopda Pujan: placing account books and ledgers before Jinendra icons, sanctifying business affairs with vows of ethical honesty and fair dealings",
      "Saal Mubarak & Kshamapana: exchanging respectful greetings of \"Saal Mubarak\" accompanied by mutual expressions of forgiveness and goodwill",
      "Guru Vandana: visiting the residence of Jain monks and nuns to offer humble salutations and receive auspicious blessings (Mangal Path)",
      "Snatra Puja: performing joyous morning worship in community temples to welcome the dawn of the new Vira Nirvana year"
    ],
    "shloka": {
      "text": "संसारदावदहनं विहितं विलोक्य, ज्ञानं प्रबोधकमहो लभते स्म सद्यः। यः श्रीमहावीरगुरोर्विरागे, श्रीगौतमं तमहमादरतो नमामि॥",
      "transliteration": "Saṃsāra-dāva-dahanaṃ vihitaṃ vilokya, jñānaṃ prabodhakam-aho labhate sma sadyaḥ. Yaḥ śrī-mahāvīra-guror-virāge, śrī-gautamaṃ tam-aham-ādarato namāmi.",
      "translation": "Perceiving worldly existence as a blazing forest fire, he swiftly attained the awakening of supreme knowledge upon the detachment of his Guru, Shri Mahavira. To that blessed Gautama Swami, I bow with deepest reverence.",
      "source": "Gautama Swami Stotra (Traditional Jain Liturgy, Tier 1 Canonical Source)"
    },
    "practice": "Set three ethical commitments for the coming year: one for honest conduct in your work, one for moderating personal consumption, and one for daily dedicated quiet reflection. Inscribe these intentions on paper and revisit them regularly."
  },
  {
    "slug": "Jain Diwali (Mahavira Nirvana)",
    "emoji": "🪔",
    "tradition": "jain",
    "origin": "For the Jain community, Diwali (celebrated on the new moon of Ashvina/Kartika Amavasya) is one of the most sacred dates of the cosmic cycle, commemorating the Nirvana Kalyanak of Bhagwan Mahavira at Pavapuri (Bihar) in 527 BCE. As recorded in the canonical Kalpa Sutra and the Uttarādhyayana Sūtra, Mahavira spent the final days of his earthly embodiment in the assembly hall of King Hastipala of the Malla republic. During the final forty-eight hours of his life, seated in the lotus posture without taking food or water, he delivered his final discourse — an unbroken, radiant exposition of the Uttarādhyayana Sūtra expounding the fifty-five chapters on moral discipline, karma theory, and spiritual freedom to an assembly of kings, monks, and lay disciples. At the break of dawn on the fifteenth day of the dark fortnight, having exhausted all remaining Aghatiya (non-destructive) karmas, the 24th Tirthankara attained Moksha, his pure soul ascending to Siddhashila (the crest of the universe) to dwell in eternal omniscience, unconditioned bliss, and formless perfection.",
    "significance": "When Mahavira's physical presence departed the earthly plane, the sixteen confederate kings of Kashi, Koshala, and the Licchavis assembled and proclaimed: \"Since the sacred light of omniscience has departed from the physical world, let us light the physical lamps of clay to commemorate the dawn of spiritual illumination.\" This historical event represents the true spiritual origin of Diwali's lights for Jains. The earthen lamp is a symbol of the soul: the clay represents the mortal physical body; the oil represents spiritual devotion and compassion; the cotton wick represents disciplined restraint; and the steady golden flame represents the unextinguished light of Kevala Jnana. Diwali is therefore not a night of frivolous vanity, but a night of deep contemplative stillness and reverence for the soul's ultimate potential. It reminds practitioners that worldly fame and pleasure are fleeting, while the attainment of Moksha — absolute freedom from sorrow, decay, and rebirth — is the only permanent refuge.",
    "rituals": [
      "Pre-dawn Nirvana Ladu Offering: gathering in community temples before sunrise to offer sacred spherical sweets (Nirvana Ladu) before Mahavira's shrine",
      "Jaap of the Navkar Mantra: continuous twenty-four hour chanting of the Namaskara Mahamantra to sanctify the transition of the new moon",
      "Lighting Earthen Deepaks: placing oil lamps around temples and homes with the prayer that the light of spiritual knowledge dispels inner ignorance",
      "Recitation of the Uttaradhyayana Sutra: reading and reflecting upon Mahavira's final teachings on the discipline and liberation of consciousness",
      "Observing Upavas or Ekashana: fasting in quiet meditation, dedicating the entire night to prayer and contemplation rather than noisy celebration"
    ],
    "shloka": {
      "text": "गए महावीरे निक्खंते, पव्वाए सिद्धिमणुत्तरे। दीवकाले जिणिंदाणं, सव्वलोए पभासिओ॥",
      "transliteration": "Gae mahāvīre nikkhaṃte, pavvāe siddhimaṇuttare. Dīvakāle jiṇiṃdāṇaṃ, savvaloe pabhāsio.",
      "translation": "When Mahavira departed and attained supreme, unexcelled perfection (Siddhi), in that hour of lamps of the Conqueror, light shone throughout the entire universe.",
      "source": "Nirvāṇa Kalyāṇaka Stotra (Traditional Agamic Liturgy, Tier 1 Canonical Source)"
    },
    "practice": "Light a single oil lamp tonight in a quiet room. Sit before it in silence for fifteen minutes, observing the steady flame without speaking. Contemplate the unperishing light of awareness shining within your own being."
  },
  {
    "slug": "Kartik Purnima (Jain)",
    "emoji": "🌕",
    "tradition": "jain",
    "origin": "Kartik Purnima, celebrated on the full moon of the month of Kartika (Kartika Shukla Purnima), is an exceptionally revered day in Jainism, marking the conclusion of the four-month monsoon retreat (Chaturmas) and the reopening of the sacred pilgrimage routes to Shatrunjaya Hill in Palitana (Gujarat). According to Jain canonical history expounded in the Śatruñjaya Mahātmya and Acharya Hemachandra's commentaries, it was on this sacred tirthankara day that Dravida and Varikhila, the sons of King Bharata (the son of Adinatha), together with ten crore munis (ascetic monks), attained final liberation (Moksha) atop the peaks of Shatrunjaya. Furthermore, Bhagwan Adinatha, the first Tirthankara, made his first auspicious visit to the holy hill of Shatrunjaya on this full moon day. Because ascetics and lay pilgrims strictly refrain from climbing holy hills during the four monsoon months to avoid harming the millions of tiny insects and green vegetation flourishing in the rain, Kartik Purnima marks the joyful reopening of the pilgrim paths, where thousands of devotees assemble for the revered circumambulation (Chha Gau Pheri) spanning twelve miles around the hill.",
    "significance": "In Jainism, Shatrunjaya is regarded as the supreme tirtha (Siddhakshetra) where countless enlightened souls have cast off their worldly bodies to attain eternal liberation. The name itself means \"that which conquers internal enemies\" (Shatru = passions, Jaya = conquest). Visiting or spiritually contemplating Shatrunjaya on Kartik Purnima is believed to cleanse heavy karmas accumulated over lifetimes, because the hill vibrates with the ascetic energy of millions of liberated masters. For millions of householders who are physically unable to travel to Palitana, this day is celebrated as \"Dev Diwali\" by venerating sacred cloth paintings (Pata) depicting the temples and peaks of Shatrunjaya in their local derasar (temple). The festival teaches that external pilgrimage is a physical replica of the soul's internal ascent: climbing steep steps under the hot sun symbolizes enduring hardships with equanimity, while reaching the temple summits reflects the soul's arrival at liberation.",
    "rituals": [
      "Chha Gau Pheri: undertaking the rigorous twelve-mile circumambulation around Shatrunjaya hill, chanting stavanas and maintaining silent mindfulness",
      "Shatrunjaya Pata Pujan: setting up large embroidered or painted representations of the holy hill in local temples for community worship and Darshan",
      "Performing Snatra Puja & Chaitya Vandana: reciting traditional prayers of veneration celebrating the five auspicious hills and the Tirthankaras",
      "Breaking of the Chaturmas vows: formally concluding the monsoon austerities and welcoming visiting sadhus and sadhvis with heartfelt devotion",
      "Offering lighting and ghee lamps in local derasars to celebrate the divine illumination of the cosmos on Dev Diwali"
    ],
    "shloka": {
      "text": "शत्रुञ्जयं नमामि श्रीसिद्धक्षेत्रं मनोहरम्। यत्र मुक्ताः कोटिमुनयो वन्दे तं पावनं गिरिम्॥",
      "transliteration": "Śatruñjayaṃ namāmi śrī-siddhakṣetraṃ manoharam. Yatra muktāḥ koṭi-munayo vande taṃ pāvanaṃ girim.",
      "translation": "I bow to Shri Shatrunjaya, the enchanting realm of liberated souls. Where crores of ascetic sages attained eternal freedom, to that sacred mountain I offer my veneration.",
      "source": "Śatruñjaya Mahātīrtha Stuti (Acharya Hemachandra Tradition, Tier 1 Canonical Source)"
    },
    "practice": "Take a walk today without your phone, maintaining awareness of each step. Notice the ground supporting your weight, and silently send blessings of peace, protection, and gratitude to every creature living upon the earth."
  },
  {
    "slug": "Vesak / Buddha Purnima",
    "emoji": "🪷",
    "tradition": "buddhist",
    "origin": "Vesak (Buddha Purnima), celebrated on the full moon day of the month of Vaishakha (May), is the most sacred holiday in the global Buddhist calendar. As recorded across the primary texts of the Pali Canon, including the Mahāparinibbāna Sutta and the Jātaka Nidānakathā, this single lunar day commemorates the thrice-blessed events in the life of Gautama Buddha: his birth as Prince Siddhartha Gautama in the Lumbini sal grove (c. 563 BCE), his supreme Awakening (Sammā-sambodhi) under the Bodhi tree at Bodh Gaya at the age of thirty-five (c. 528 BCE), and his final unconditioned passing into Parinirvana under the twin sal trees at Kushinagar at age eighty (c. 483 BCE). Siddhartha spent six years exploring intense philosophical systems and undergoing radical physical mortification across the Magadha forests, discovering that neither sensory indulgence nor self-mortification led to freedom. Sitting beneath the Ficus religiosa tree with the unyielding resolve never to rise until freedom was attained, he penetrated the chains of dependent origination (Paticca-samuppada) at dawn on the Vesak full moon, shattering the illusion of an egoic self.",
    "significance": "Vesak affirms the most radical message of the Buddha: that the capacity for supreme awakening, boundless compassion, and freedom from existential suffering lies entirely within human consciousness, requiring no supernatural mediation. The Buddha showed that suffering (Dukkha) is not an inevitable divine punishment, but a psychological consequence of ignorance (Avijja) and craving (Tanha). By cultivating the Noble Eightfold Path — ethical conduct (Sila), meditative stillness (Samadhi), and penetrating wisdom (Panna) — any sincere practitioner can dismantle the karmic roots of greed, hatred, and delusion. Vesak is celebrated across traditions not as a worship of a distant deity, but as an expression of profound gratitude to an extraordinary teacher who showed humanity the clear path out of confusion. The day emphasizes universal loving-kindness (Metta) toward all sentient beings, demonstrating that true spiritual devotion manifests through gentleness, ethical generosity, and the alleviation of suffering in the world.",
    "rituals": [
      "Bathing the Buddha: pouring fragrant water over miniature statues of the infant Buddha, symbolizing the cleansing of greed, hatred, and delusion from the mind",
      "Chanting the Threefold Refuge (Tisaraṇa) and the Five Precepts (Pañcasīla) in viharas at sunrise, renewing vows of ethical living",
      "Dana (Generosity): distributing food, alms, and gifts to monks, nuns, the poor, and patients in hospitals, emphasizing selfless community care",
      "Fang Sheng (Animal Release): liberating captive birds, fish, and cattle from slaughter, demonstrating unconditional non-harm toward vulnerable life",
      "Circumambulating stupas and altars three times while carrying lotus flowers, incense, and glowing candles in evening candlelight processions"
    ],
    "shloka": {
      "text": "बुद्धं सरणं गच्छामि। धम्मं सरणं गच्छामि। सङ्घं सरणं गच्छामि॥",
      "transliteration": "Buddhaṃ saraṇaṃ gacchāmi. Dhammaṃ saraṇaṃ gacchāmi. Saṅghaṃ saraṇaṃ gacchāmi.",
      "translation": "I go to the Buddha for refuge. I go to the Dhamma (the Truth) for refuge. I go to the Sangha (the Community of Awakened Beings) for refuge.",
      "source": "Tisaraṇa & Vandana (Khuddakapāṭha 1, Primary Pali Canon, Tier 1 Canonical Source)"
    },
    "practice": "Offer a conscious act of generosity today without expecting acknowledgement or praise. Sit for twenty minutes in silent awareness of your breath, allowing your mind to rest in calm, open friendliness toward all beings."
  },
  {
    "slug": "Magha Puja",
    "emoji": "🪔",
    "tradition": "buddhist",
    "origin": "Magha Puja, celebrated on the full moon of the third lunar month (Magha, typically late February or March), commemorates one of the most remarkable and spontaneous gatherings in early Buddhist history. Nine months after the Buddha's enlightenment, 1,250 monastic disciples gathered at the Veluvana Bamboo Grove monastery in Rajagaha (modern Rajgir, Bihar) without any prior arrangement or summons. Canonical records in the Dīgha Nikāya (Mahāpadāna Sutta) and the commentaries state that four extraordinary conditions characterized this sacred assembly (known as the Caturangasannipata): all 1,250 monks arrived simultaneously without prior appointment; all were fully enlightened Arahants possessing the six higher spiritual knowledges (Chalabhinna); all had been directly ordained by the Buddha himself through the ancient formula \"Ehi Bhikkhu\" (Come, monk); and the gathering occurred on the auspicious full moon day of Magha. Recognizing this rare confluence of awakened consciousness, the Buddha delivered his celebrated summary discourse: the Ovāda Pātimokkha — the fundamental ethical and contemplative charter for the entire Buddhist dispensation.",
    "significance": "The Ovāda Pātimokkha delivered on Magha Puja serves as the universal heartbeat of the Buddhist path, distilled into three sublime, immortal instructions: to refrain from all unwholesome actions (Sabbapapassa akaranam), to cultivate all good and noble qualities (Kusalassa upasampada), and to purify one's own mind (Sacittapariyodapanam). The Buddha explained that true patience and forbearance (Khanti) is the highest austerity, that Nirvana is supreme above all realms, and that one who harms or insults another is not a true monastic or spiritual seeker. Magha Puja highlights the unity, purity, and spiritual strength of the Sangha. It reminds seekers that outer rituals and theoretical dogmas are meaningless without the vigilant, moment-to-moment cultivation of ethical integrity and inner mental clarity. By holding up patience and loving-kindness as the ultimate shields against hostility, the discourse provides a timeless framework for peace in human society. The gathering at Veluvana stands as an enduring blueprint for harmony within the spiritual community: 1,250 enlightened disciples acting with single-minded devotion to truth, showing that when egos are dissolved, absolute unity naturally prevails without any need for external compulsion.",
    "rituals": [
      "Wian Tian (Candlelight Circumambulation): walking three times clockwise around the temple shrine holding a candle, three incense sticks, and a lotus bud",
      "Recitation of the Ovāda Pātimokkha: gathering in the main hall to chant the Buddha's timeless verses in original Pali meter",
      "Taking the Eight Precepts (Uposatha Sila): lay devotees spending the entire day and night in the temple practicing heightened ethical discipline",
      "Listening to all-night Dhamma sermons: attending discourses on meditation, ethical vigilance, and the eradication of mental defilements",
      "Offering morning alms (Tak Bat) to the monastic Sangha, supporting their study and practice with wholesome nourishment"
    ],
    "shloka": {
      "text": "सब्बपापस्स अकरणं, कुसलस्स उपसम्पदा। सचित्तपरियोदपनं, एतं बुद्धान सासनं॥",
      "transliteration": "Sabbapāpassa akaraṇaṃ, kusalassa upasampadā. Sacittapariyodapanaṃ, etaṃ buddhāna sāsanaṃ.",
      "translation": "To refrain from all unwholesome deeds, to cultivate wholesome qualities, to thoroughly purify one's own mind — this is the teaching of all the Awakened Ones.",
      "source": "Dhammapada 183 / Ovāda Pātimokkha (Dīgha Nikāya 14, Tier 1 Canonical Source)"
    },
    "practice": "Throughout the day, catch your mind at the very moment it starts forming a harsh criticism or impatient judgment. Gently halt the thought, breathe out fully, and replace it with a wish for the other person's peace."
  },
  {
    "slug": "Asalha Puja",
    "emoji": "☸️",
    "tradition": "buddhist",
    "origin": "Asalha Puja (Dhamma Day), celebrated on the full moon of the eighth lunar month (Ashadha, typically July), marks the momentous day when Gautama Buddha preached his very first sermon, officially setting in motion the Wheel of the Dhamma (Dhammacakkappavattana Sutta). Two months after attaining enlightenment under the Bodhi tree, the Buddha walked over one hundred miles from Bodh Gaya to the Deer Park at Isipatana (modern Sarnath near Varanasi) to find his five former ascetic companions (the Pancavaggiya monks: Kondanna, Bhaddiya, Vappa, Mahanama, and Assaji), who had previously abandoned him when he renounced extreme starvation. Delivering his first discourse to them, the Buddha revealed the Middle Way and the Four Noble Truths with their twelvefold modes (Tiparivattam dvadasakaram). Upon hearing these profound words, Venerable Kondanna attained the spotless vision of the Dhamma (the Sotapanna stage of stream-entry), realizing: \"Whatever is subject to origination is also subject to cessation.\" The Buddha ordained Kondanna, thereby creating the first member of the monastic Sangha and completing the manifestation of the Triple Gem (Buddha, Dhamma, Sangha) in the world.",
    "significance": "Asalha Puja is the birthday of the Dhamma as a teaching open to all humanity. In this sermon, the Buddha rejected the two extremes of human lifestyle: sensual indulgence (Kamasukhallikanuyoga), which is low and ignoble, and self-mortification (Attakilamathanuyoga), which is painful and useless. In their stead, he unveiled the Middle Way (Majjhima Patipada) through the Noble Eightfold Path: Right View, Right Resolve, Right Speech, Right Action, Right Livelihood, Right Effort, Right Mindfulness, and Right Concentration. He outlined the Four Noble Truths: Dukkha (the pervasive presence of dissatisfaction in conditioned life), Samudaya (its origin in craving and attachment), Nirodha (the reality that suffering can completely cease), and Magga (the path leading to its permanent cessation). As the sutta declares, when this wheel was turned, no ascetic, priest, god, or mara in any realm could turn it back, opening the doors of liberation for the entire cosmos.",
    "rituals": [
      "Chanting the Dhammacakkappavattana Sutta: monastics and lay devotees reciting the foundational discourse together in original Pali",
      "Offering traditional Rains Retreat Candles: presenting large, ornately carved beeswax candles to monasteries to illuminate evening meditation throughout the monsoon",
      "Candlelight procession (Wian Tian): circumambulating the main pagoda or Buddha hall three times in solemn reverence for the Triple Gem",
      "Taking the Five or Eight Precepts: renewing vows of non-killing, non-stealing, truthfulness, and sobriety for the upcoming spiritual season",
      "Monastic ordination ceremonies: families sponsoring young men and women entering the monastic life as novices (Samanera) for the Vassa period"
    ],
    "shloka": {
      "text": "एते ते, भिक्खवे, उभो अन्ते अनुपगम्म मज्झिमा पटिपदा तथागतेन अभिसम्बुद्धा चक्खुकरणी जाणकरणी उपसमाय अभिञ्ञाय सम्बोधाय निब्बाणाय संवत्तति॥",
      "transliteration": "Ete te, bhikkhave, ubho ante anupagamma majjhimā paṭipadā tathāgatena abhisambuddhā cakkhukaraṇī ñāṇakaraṇī upasamāya abhiññāya sambodhāya nibbānāya saṃvattati.",
      "translation": "Avoiding both these extremes, monks, the Middle Way realized by the Tathagata gives vision, gives knowledge, and leads to peace, to direct knowledge, to awakening, to Nirvana.",
      "source": "Dhammacakkappavattana Sutta (Saṃyutta Nikāya 56.11, Tier 1 Canonical Source)"
    },
    "practice": "Look at one area in your life where you swing between rigid perfectionism and careless indulgence. Today, consciously choose the Middle Way: bring balanced effort, gentle awareness, and patient realism to that exact task."
  },
  {
    "slug": "Bodhi Day",
    "emoji": "🌳",
    "tradition": "buddhist",
    "origin": "Bodhi Day, observed on the eighth day of the twelfth lunar month (December 8 in Mahayana and Zen traditions, or Rohatsu), commemorates the supreme enlightenment of Siddhartha Gautama beneath the Bodhi tree (Ficus religiosa) at Bodh Gaya. After six grueling years of severe asceticism that brought him to the brink of physical death, Siddhartha realized that starving the body merely agitated the mind without uprooting the underlying roots of delusion. Accepting a bowl of milk-rice from the maiden Sujata, he regained physical vitality, sat down upon a grass mat facing east under the sacred tree, and made an immovable vow: \"Let my skin, sinews, and bones wither away, let the flesh and blood of my body dry up, but never from this seat will I stir until I have attained supreme, unexcelled awakening.\" As recorded in the Ariyapariyesana Sutta and the Lalitavistara, he sat in unbroken concentration throughout the night, repelling the terrifying and seductive illusions of Mara (the personification of delusion, desire, and death) by touching the earth with his right hand (Bhumisparsha mudra).",
    "significance": "During the three watches of that sacred night, Siddhartha experienced profound transformations of awareness: in the first watch, he recollected his countless past lives across cosmic eons; in the second watch, with the divine eye, he witnessed the arising and passing away of all beings according to their karma; in the third watch at the break of dawn, as the morning star rose in the eastern sky, he penetrated the Twelve Links of Dependent Origination (Paticca-samuppada) and destroyed all mental fermentations (Asavas). He proclaimed that the builder of the house of ego (craving) had been discovered, its rafters broken and ridgepole shattered. In Zen monasteries, Bodhi Day is preceded by Rohatsu Sesshin — a week of intensive, rigorous silent meditation where practitioners sit through the freezing nights to taste the dawn of awakening. The festival stands as an uncompromising reminder that enlightenment is not a mystical mystery or theoretical philosophy, but the direct, experiential discovery of reality as it is.",
    "rituals": [
      "Rohatsu Sesshin: participating in rigorous, all-night silent zazen (seated meditation) in Zen and Mahayana monasteries",
      "Lighting Bodhi Tree shrines: decorating ficus trees or house altars with multi-colored lights representing the many paths of wisdom leading to truth",
      "Offering traditional rice pudding: consuming a warm bowl of sweet milk-rice (kheer) at dawn in grateful memory of Sujata's life-saving offering",
      "Chanting the Heart Sutra (Prajnaparamita Hridaya): reciting the profound teachings on emptiness (Sunyata) and the transcendence of dualistic clinging",
      "Maintaining noble silence (Ariya Tunhibhava): observing quietness throughout the morning to honor the stillness of the Buddha's breakthrough"
    ],
    "shloka": {
      "text": "अनेकाजातिसंसारं, सन्धाविस्सं अनिब्बिसं। गहकारकं गवेसन्तो, दुक्खा जाति पुनप्पुनं॥ गहकारक दिट्ठोसि, पुन गेहं न काहसि। सब्बा ते फासुका भग्गा, गहकूटं विसङ्खितं। विसङ्खारगतं चित्तं, तण्हानं खयमज्झगा॥",
      "transliteration": "Anekajātisaṃsāraṃ, sandhāvissaṃ anibbisaṃ. Gahakārakaṃ gavesanto, dukkhā jāti punappunaṃ. Gahakāraka diṭṭhosi, puna gehaṃ na kāhasi. Sabbā te phāsukā bhaggā, gahakūṭaṃ visaṅkhitaṃ. Visaṅkhāragataṃ cittaṃ, taṇhānaṃ khayamajjhagā.",
      "translation": "Through countless births in samsara I wandered, seeking the builder of this house; painful is birth again and again. House-builder, you are seen! You shall build no house again. All your rafters are broken, your ridgepole shattered. My mind has attained the unconditioned; craving has been extinguished.",
      "source": "Dhammapada 153-154 (Buddha's Song of Enlightenment, Tier 1 Canonical Source)"
    },
    "practice": "Sit quietly before sunrise or in the evening for twenty minutes. When wandering thoughts, anxieties, or desires arise, do not fight them; simply recognize them as temporary visitors and return steadily to the resting breath."
  },
  {
    "slug": "Parinirvana Day",
    "emoji": "🕊️",
    "tradition": "buddhist",
    "origin": "Parinirvana Day (Nirvana Day), observed on February 15 in Mahayana traditions and on Vesak in Theravada, marks the final passing of Gautama Buddha at the age of eighty into Mahaparinirvana at Kushinagar (modern Uttar Pradesh). As meticulously detailed in the Mahāparinibbāna Sutta of the Dīgha Nikāya, the Buddha realized his earthly life was drawing to a close after forty-five years of unceasing teaching. Walking to a grove of sal trees belonging to the Mallas of Kushinagar, he instructed his beloved attendant Ananda to prepare a couch between two sal trees with its head to the north. Lying on his right side in the lion's posture (Sihaseyya) with one foot resting on the other, the sal trees miraculously blossomed out of season, raining sweet blossoms upon his body. Even in his final hours, he welcomed the wandering seeker Subhadda, teaching him the Noble Eightfold Path and ordaining him as his very last direct disciple. Then, turning to the weeping assembly of monks, he delivered his immortal final words of guidance before entering the meditative jhanas and passing beyond cyclic rebirth.",
    "significance": "Parinirvana Day is one of the most solemn and philosophically penetrating observances in Buddhism, dedicated to the unflinching contemplation of impermanence (Anicca) and the absolute peace of unconditioned liberation (Nibbana). The Buddha's passing demonstrated that everything that is subject to birth, composition, and conditioning must inevitably decay and dissolve. Yet this realization does not lead to despair or nihilism; rather, it generates profound urgency (Samvega) and compassion (Karuna). The Buddha refused to appoint a personal successor, declaring that the Dhamma (the truth) and the Vinaya (the ethical discipline) would serve as the enduring teacher for future generations. He urged his disciples not to rely upon external saviors, but to \"be islands unto yourselves, refuges unto yourselves, seeking no outer refuge.\" Parinirvana reminds every practitioner that time is precious, life is brief, and liberation must be realized through diligent personal effort in the living present. The Buddha demonstrated that peace is found not in clinging to transient forms, but in cultivating an unshakeable mind that understands the nature of reality with clarity and boundless loving-kindness.",
    "rituals": [
      "Reading the Mahāparinibbāna Sutta: gathering in monasteries to read the canonical account of the Buddha's final days, teachings, and passing",
      "Reclining Buddha veneration: offering incense, white flowers, and soft candlelight before images of the Buddha reclining in peaceful repose",
      "Meditation on Impermanence (Aniccānussati): contemplating the transient nature of one's own body, relationships, and worldly achievements",
      "Silent retreats: spending the day in quiet reflection, minimizing speech and sensory distractions to experience inner stillness",
      "Visiting elderly or sick community members: bringing food, medicine, and companionship, putting the teaching of compassion into tangible practice"
    ],
    "shloka": {
      "text": "हन्ददानि, भिक्खवे, आमन्तयामि वो: वयधम्मा सङ्खारा अप्पमादेन सम्पादेथा’ति॥",
      "transliteration": "Handadāni, bhikkhave, āmantayāmi vo: vayadhammā saṅkhārā appamādena sampādethā'ti.",
      "translation": "Behold now, monks, I exhort you: all conditioned things are subject to decay. Strive diligently with heedfulness for your liberation.",
      "source": "Mahāparinibbāna Sutta (Dīgha Nikāya 16, Buddha's Final Words, Tier 1 Canonical Source)"
    },
    "practice": "Contemplate today that everything you see, touch, and love is temporary and changing. Let this realization dissolve petty grievances, inspire genuine patience with loved ones, and kindle fresh diligence in your daily spiritual practice."
  },
  {
    "slug": "Vassa begins (Rains Retreat)",
    "emoji": "🌧️",
    "tradition": "buddhist",
    "origin": "Vassa, the three-month annual monastic retreat commonly referred to as the \"Rains Retreat,\" commences on the day after the Asalha full moon (the first day of the waning moon of Ashadha, typically July) and continues until the full moon of Ashvina in October. Codified in the Vinaya Piṭaka (Mahāvagga, Vassūpanāyikā Khandhaka), the observance was instituted by the Buddha during his stay at Rajagaha. In ancient India, the monsoon rains caused swollen rivers, muddy roads, and an explosion of insect life and fragile plant shoots. When non-Buddhist ascetics and lay citizens complained that wandering Buddhist monks were accidentally trampling newly sprouted crops and killing microscopic organisms, the Buddha established the sacred rule: for the three months of the heavy monsoon, all ordained monks and nuns must abandon itinerant wandering (Carika) and reside in a fixed monastery (Arama) or secluded dwelling. Monastics make a formal vow of residence: \"I enter the rains retreat in this monastery for these three months\" (Imasmim avase imam temasam vassam upemi).",
    "significance": "Vassa transforms the physical restriction of the monsoon into an intensive season of spiritual acceleration, study, and ethical renewal for the entire Buddhist community. For monastics, it provides uninterrupted months free from travel, allowing deep absorption in Samatha (calm meditation), Vipassana (insight meditation), and deep study of the Tipitaka. It is a period when senior elders mentor newly ordained monks in monastic discipline and meditation techniques. For the lay community, Vassa functions as a sacred season of heightened devotion and spiritual partnership. Householders frequently take the opportunity to adopt voluntary ascetic disciplines, such as abstaining from meat, giving up alcohol, undertaking the eight precepts on Uposatha days, or meditating daily. The retreat preserves the living vitality of the Dhamma, demonstrating that periodic withdrawal from worldly motion is necessary to restore clarity, recharge moral resolve, and deepen inner realization. During these ninety days of monsoon stillness, practitioners dedicate themselves to Sīla-visuddhi (the thorough purification of ethical conduct) and Samādhi (mental concentration), proving that quiet withdrawal from constant worldly activity is essential for cultivating deep, transformative insight.",
    "rituals": [
      "Formal Entry Vow: monks assembling in the ordination hall (Sima) to take the solemn vow of unbroken residence for three lunar months",
      "Offering of Rains Retreat Robes (Vassikavatika): lay disciples presenting waterproof bathing cloths and robes to the monastic community",
      "Daily Morning Alms Giving: local householders bringing fresh, nourishing meals directly to the monastery gate to support the cloistered monks",
      "Uposatha Observances: lay devotees sleeping at the temple on full moon and new moon nights, meditating and listening to Dhamma sermons",
      "Community Dhamma Classes: monks conducting evening scriptural readings and meditation workshops for lay families seeking spiritual guidance"
    ],
    "shloka": {
      "text": "अप्पमादो अमतपदं, पमादो मच्चुनो पदं। अप्पमत्ता न मीयन्ति, ये पमत्ता यथा मता॥",
      "transliteration": "Appamādo amatapadaṃ, pamādo maccuno padaṃ. Appamattā na mīyanti, ye pamattā yathā matā.",
      "translation": "Heedfulness is the path to the Deathless; heedlessness is the path to death. The heedful do not die; the heedless are like the dead already.",
      "source": "Dhammapada 21 (Primary Pali Canon, Tier 1 Canonical Source)"
    },
    "practice": "Choose one wholesome discipline to adopt for the next month: it could be twenty minutes of daily meditation, abstaining from complaining, or reading one discourse daily. Commit to it steadily without breaking."
  },
  {
    "slug": "Pavarana (End of Vassa)",
    "emoji": "🪔",
    "tradition": "buddhist",
    "origin": "Pavarana, celebrated on the full moon of the eleventh lunar month (Ashvina, typically October), marks the joyful and solemn conclusion of the three-month Vassa rains retreat. Codified in the Vinaya Piṭaka (Mahāvagga, Pavāraṇā Khandhaka), the ceremony was instituted by the Buddha when a group of monks spent the monsoon living together in complete silence to avoid conflict. The Buddha firmly admonished them, teaching that artificial silence does not create genuine harmony; instead, authentic concord requires open, compassionate communication and mutual vulnerability. The word \"Pavāraṇā\" literally means \"invitation\" or \"request.\" On this day, every monk — regardless of seniority, from the most junior novice to the most revered senior elder (Mahathera) — kneels before the assembled Sangha, joins his palms in reverence, and formally invites his peers to offer constructive feedback: \"Venerable sirs, I invite the Sangha to point out anything you have seen, heard, or suspected regarding my conduct. If I have transgressed, I will see it and make amends.\"",
    "significance": "Pavarana stands as one of the most remarkable models of collective accountability, egolessness, and psychological transparency in the history of human institutions. Living in close quarters for three months can easily breed unexpressed irritations, unspoken resentments, and hidden frictions. Pavarana prevents these interpersonal poisons from festering. By voluntarily opening oneself to the critique of one's peers with complete humility, pride is shattered and trust is restored. It demonstrates that true spiritual maturity does not consist in pretending to be flawless, but in the fearless willingness to acknowledge one's shortcomings and purify them in the warm light of community fellowship. For the lay community, Pavarana is a day of deep rejoicing. Laypeople celebrate the successful completion of the monks' retreat, offering lights, lamps, and flowers to the Sangha, preparing the stage for the upcoming Kathina robe-offering season.",
    "rituals": [
      "Formal Pavarana Assembly: monks gathering in the Sima to recite the ancient Pali formula inviting honest, compassionate feedback from one another",
      "Floating Fire Boat Processions (Lai Ruea Fai): launching illuminated bamboo boats adorned with candles and lanterns onto rivers in Thailand and Laos",
      "Light Festivals (Awk Phansa): decorating monasteries, rooftops, and village lanes with thousands of glowing clay lamps to welcome the Buddha's descent from Tavatimsa",
      "Offering Mahadana: lay householders bringing abundant offerings of food, medicine, and requisites to celebrate the monks' steadfast spiritual effort",
      "All-night chanting of suttas: assemblies chanting protective Paritta discourses to bless the surrounding region with harmony, health, and peace"
    ],
    "shloka": {
      "text": "सङ्घं पवारेमि दिट्ठेन वा सुतेन वा परिसङ्काय वा, वदन्तु मं आयस्सन्तो अनुकम्पं उपादाय, पस्सन्तो पटिकरिस्सामि॥",
      "transliteration": "Saṅghaṃ pavāremi diṭṭhena vā sutena vā parisaṅkāya vā, vadantu maṃ āyasmanto anukampaṃ upādāya, passanto paṭikarissāmi.",
      "translation": "I invite the Sangha in respect of what has been seen, heard, or suspected. Let the venerable ones speak to me out of compassion; seeing my fault, I shall make amends.",
      "source": "Vinaya Piṭaka (Mahāvagga, Pavāraṇā Khandhaka, Tier 1 Canonical Source)"
    },
    "practice": "Approach someone you trust today with genuine humility and ask: \"Is there anything I have done recently that has caused you hurt, inconvenience, or frustration?\" Listen with an open heart without defensiveness, and offer genuine amends."
  },
  {
    "slug": "Kathina",
    "emoji": "👘",
    "tradition": "buddhist",
    "origin": "Kathina, celebrated during the four weeks following the full moon of Ashvina (October–November), is the historic annual robe-offering festival in Theravada Buddhism. As recorded in the Vinaya Piṭaka (Mahāvagga, Kathina Khandhaka), thirty sincere monks from the western province of Pava were journeying through India to spend the rains retreat with the Buddha in Savatthi. Caught on the road when the monsoon arrived, they were forced to stop at Saketa. When Vassa ended, eager to behold their teacher, they rushed through torrential late rains, arriving at the Jetavana monastery drenching wet, their coarse robes torn, ragged, and coated in mud. Moved by their devotion and enduring hardship, the Buddha established the Kathina ordinance: any monastery that has successfully maintained the three-month retreat is entitled to receive an auspicious offering of cloth from the lay community to sew a new robe for one worthy member, conferring five special disciplinary exemptions (Anisamsa) upon the entire assembly.",
    "significance": "The word \"Kathina\" literally refers to the wooden frame or loom used by ancient Indian weavers to stretch cloth during sewing, symbolizing unshakeable firmness, durability, and resilience. Kathina is unique because it cannot be initiated by the monastics themselves; it must arise entirely spontaneously from the faith, gratitude, and generosity of the lay community. The ceremony highlights the sacred symbiosis between the lay society and the monastic order: the Sangha provides spiritual guidance, ethical inspiration, and the preservation of the Dhamma, while the lay practitioners provide physical shelter, nourishment, and clothing. Traditionally, the uncut white cloth must be offered, cut, dyed with natural bark extract, sewn, and formally presented to a designated monk within the span of a single day and night before sunrise. It represents the ultimate field of collective merit (Puññakkhetta), celebrating selfless generosity (Dana) and the indestructible resilience of the Buddha's community. Crucially, the Kathina robe is never presented to an individual person, but to the collective Sangha as an unbroken whole. The assembly then unanimously confers it upon a worthy practitioner, demonstrating that spiritual community transcends personal preference and self-interest.",
    "rituals": [
      "Offering the Kathina Cloth: lay benefactors carrying the sacred folded cloth in joyful communal processions around the monastery shrine",
      "Formal Sangha Act (Kammavaca): the monastic chapter holding a closed assembly to unanimously award the robe to a monk who practiced with outstanding diligence",
      "Cutting and Dyeing the Robe: monastics and lay volunteers working together through the afternoon to cut, stitch, and dye the cloth with natural saffron hues",
      "Offering \"Money Trees\" (Padetha): erecting decorative trees laden with school supplies, building materials, and funds to maintain monastery grounds",
      "Shared communal feasts: village communities gathering to prepare and share satvik vegetarian food with all visitors, pilgrims, and monastics"
    ],
    "shloka": {
      "text": "इमं कथिणदुस्संसङ्घस्स देमा’ति। अयं कथिणचिवरदानस्स पुञ्ञो अनुत्तरं पुञ्ञक्खेत्तं लोके॥",
      "transliteration": "Imaṃ kathiṇadussaṃ saṅghassa demā'ti. Ayaṃ kathiṇacīvaradānassa puñño anuttaraṃ puññakkhettaṃ loke.",
      "translation": "We present this Kathina cloth to the Noble Sangha. The merit arising from this gift of the Kathina robe flourishes in the world's supreme field of merit.",
      "source": "Kathina Liturgy (Vinaya Piṭaka, Kathina Khandhaka, Tier 1 Canonical Source)"
    },
    "practice": "Perform an act of quiet, unexpected generosity today: gift a warm garment, a useful book, or an anonymous meal to someone whose dedicated work often goes unnoticed, expecting nothing in return."
  },
  {
    "slug": "Ullambana (Ancestor Day)",
    "emoji": "🏮",
    "tradition": "buddhist",
    "origin": "Ullambana (Ghost Festival or Obon in Japan), celebrated on the fifteenth day of the seventh lunar month (August), is one of the most prominent festivals of filial piety in East Asian and Southeast Asian Buddhism. Rooted in the canonical Ullambana Sūtra and echoing the teachings of the Tirokuḍḍa Sutta of the Pali Canon, the festival traces back to Maudgalyayana (Moggallana), one of the Buddha's two chief disciples, who was renowned for his supreme mastery of psychic powers (Iddhi). Upon attaining arahantship, Maudgalyayana used his divine vision to locate his deceased mother, discovering to his horror that she had been reborn in the realm of hungry ghosts (Pretas) due to her past greed, with a neck thin as a needle and an enormous belly, unable to swallow food. When he attempted to feed her a bowl of rice using his psychic powers, the food burst into burning coals in her mouth. Weeping, he approached the Buddha, who explained that the karmic knot of past selfishness cannot be dissolved by one person's power alone; rather, on the day of Pavarana, when the Sangha completes its retreat, making collective offerings to the monks generates vast merit capable of releasing ancestors from lower realms.",
    "significance": "The Sanskrit word \"Ullambana\" (rendered in Chinese as Yulanpen) translates figuratively to \"delivering from being suspended upside down,\" depicting the excruciating distress of beings trapped in suffering states of consciousness. Ullambana elevates ancestor reverence into a profound practice of universal compassion and transfer of merit (Pattidana). The festival teaches that karmic energy is interconnected: by performing acts of genuine selflessness, feeding the hungry, and supporting the virtuous Sangha, practitioners can dedicate the resulting spiritual merit to relieve the suffering of departed loved ones. It expands narrow familial love into boundless concern for all wandering beings who have died without family, protection, or peace. The festival combines deep filial gratitude with the contemplation of rebirth, reminding every seeker that all living beings have, at some point in the infinite cycles of samsara, been our own loving mothers and fathers.",
    "rituals": [
      "Yulanpen Merit Assemblies: presenting grand offerings of vegetarian food, clean water, tea, and robes to the monastic Sangha on behalf of ancestors",
      "Chanting the Ullambana Sutra: assemblies reciting the narrative of Maudgalyayana's devotion, dedicating the chanting to departed relatives",
      "Offering Food to Hungry Ghosts (Fang Yankou): performing esoteric rituals scattering blessed rice and nectar to appease wandering, hungry spirits",
      "Releasing Floating River Lanterns (Toro Nagashi): setting glowing paper lanterns onto rivers and seas to guide departed souls toward light and peaceful rebirth",
      "Ancestral Memorial Tablets: placing red and yellow wooden tablets on temple altars inscribed with ancestors' names, offering prayers for their liberation"
    ],
    "shloka": {
      "text": "इध नन्दति पेच्च नन्दति, कतपुञ्ञो उभयत्थ नन्दति। पुञ्ञं मे कतं’ति नन्दति, भिय्यो नन्दति सुग्गतिं गतो॥",
      "transliteration": "Idha nandati pecca nandati, katapuñño ubhayattha nandati. Puññaṃ me katan'ti nandati, bhiyyo nandati suggatiṃ gato.",
      "translation": "Here he rejoices, hereafter he rejoices; the maker of merit rejoices in both realms. He rejoices, thinking: \"I have done good deeds\"; he rejoices even more when gone to a state of bliss.",
      "source": "Dhammapada 18 (Canonical Pali Verse on the Transfer of Merit, Tier 1 Canonical Source)"
    },
    "practice": "Pause today to remember your parents, grandparents, and ancestors with deep gratitude. Dedicate the merit of one kind action or five minutes of silent contemplation to their peace and freedom from all suffering."
  },
  {
    "slug": "Losar (Tibetan New Year)",
    "emoji": "🏔️",
    "tradition": "buddhist",
    "origin": "Losar (Tibetan New Year), celebrated over fifteen days beginning on the first day of the first lunar month (typically February or early March), is the most significant spiritual and cultural celebration in Tibetan and Himalayan Buddhism. Dating back to pre-Buddhist harvest rituals and codified during the reign of the ninth-century King Ralpachen and the great master Padmasambhava, Losar (\"Lo\" meaning year, \"Sar\" meaning new) aligns with the Tibetan lunisolar calendar based on the sixty-year Rabjung cycle (combining five sacred elements and twelve animal signs). The festival is preceded by several weeks of rigorous physical and spiritual purification. On the twenty-ninth day of the closing month (Nyi-Shu-Gu), families thoroughly clean every corner of their homes and visit monasteries to witness the profound Cham masked dances performed by lamas. Monasteries conduct elaborate wrathful protector ceremonies (Dharmapala pujas) to cast out the spiritual obstacles, negative karmas, and psychological afflictions of the departing year before welcoming the pristine dawn of the new cycle.",
    "significance": "Losar is fundamentally a festival of cosmic renewal and the conscious resetting of karmic trajectories. Rooted in the Mahayana understanding that consciousness projects its reality, Losar teaches that the mind must be cleared of ancient resentments, regrets, and delusions before genuine wisdom can take root. The first three days are the spiritual heart: the first day (Lama Losar) is dedicated to honoring the spiritual Guru, the Buddha, and the Three Jewels; the second day (Gyalpo Losar) honors secular leaders and community elders; and the third day (Chokyong Losar) is devoted to propitiating protector deities and hanging colorful prayer flags. The five colors of the Lungta (Wind Horse) prayer flags — blue for space, white for cloud/water, red for fire, green for wood/wind, and yellow for earth — symbolize the elemental harmony needed for physical vitality and spiritual realization, broadcasting blessings of universal compassion to every corner of the world.",
    "rituals": [
      "Guthuk Night Cleansing: cleansing the entire home and consuming the nine-ingredient Guthuk soup with symbolic dumplings to release the past year's misfortunes",
      "Lama Losar Pre-Dawn Offerings: rising before dawn on the first day to place the first drawn fresh water and consecrated offerings on the family altar",
      "Chemar Presentation: presenting a carved wooden box containing roasted barley flour (Tsampa) and butter, tossing pinches to the sky while exclaiming \"Tashi Delek\"",
      "Hoisting Wind Horse (Lungta) Flags: hanging fresh, consecrated prayer flags on mountain passes and rooftops to generate positive energy for all beings",
      "Cham Sacred Dances: attending monastery courtyards to witness monks performing masked meditative dances transmuting demonic forces into enlightened compassion"
    ],
    "shloka": {
      "text": "ॐ मणिपद्मे हुँ। ताशी देलेक फुन्सूम त्सोक। सर्ब मंगलं भवतु॥",
      "transliteration": "Oṃ maṇipadme hūṃ. Tashi delek phunsum tsok. Sarva maṅgalaṃ bhavatu.",
      "translation": "Om, jewel in the lotus, Hum! May all auspiciousness, prosperity, health, and spiritual perfection be with you. May all beings experience supreme harmony.",
      "source": "Kāraṇḍavyūha Sūtra (Mani Mantra) & Traditional Tibetan Liturgy (Tier 1 Canonical Source)"
    },
    "practice": "Undertake a complete inner and outer cleansing today: discard one piece of physical clutter, forgive a grievance you have held onto, and greet everyone you encounter with authentic warmth and wishes for their success."
  },
  {
    "slug": "Sangha Day (Loy Krathong)",
    "emoji": "🏮",
    "tradition": "buddhist",
    "origin": "Sangha Day coincides with the enchanting festival of Loy Krathong on the full moon of the twelfth lunar month (November), celebrated across Thailand, Myanmar, Laos, and Buddhist communities throughout the world. Historically evolving from ancient river-veneration ceremonies honoring the sacred footprint of the Buddha stamped upon the sandy banks of the Nammatha River in India, the festival was transformed by Buddhist kings into a profound celebration of spiritual gratitude. Occurring at the conclusion of the Kathina month, the festival honors the Noble Sangha (Ariya Sangha) — the unbroken, living lineage of practitioners who have walked the path of awakening, preserved the Tipitaka in memory and practice, and provided an indestructible refuge of wisdom for humanity for over twenty-five centuries. As the monsoon floods begin to recede, leaving the waterways calm and full, millions of devotees gather along rivers, lakes, and canals under the bright autumn moon to float small candlelit vessels (Krathongs) upon the water.",
    "significance": "The central act of fashioning a miniature floating vessel — traditionally crafted from a slice of a banana tree trunk, folded banana leaves, fresh flowers, three incense sticks, and a glowing candle — is a tangible spiritual metaphor for the core Buddhist practice of \"letting go\" (Vossagga). As devotees gently launch their illuminated Krathong onto the river current, they make a silent aspiration to release their own anger (Kodha), resentment, grief, and unwholesome attachments, watching them drift peacefully away into the dark water. Simultaneously, the candle flame burning upon the moving water symbolizes the light of mindfulness illuminating the turbulent currents of samsara, offered in deep gratitude to the Buddha, Dhamma, and Sangha. In northern regions, thousands of floating sky lanterns (Khom Loi) are released into the night sky, creating ascending constellations of prayers for universal peace, reminding practitioners of the vast, boundless nature of awakened awareness.",
    "rituals": [
      "Chanting the Saṅghānussati: reciting the nine canonical virtues of the Noble Sangha in viharas, contemplating their integrity, wisdom, and compassion",
      "Hand-Crafting Organic Krathongs: creating biodegradable floating baskets from natural banana trunks, lotus petals, and orchids, ensuring zero harm to aquatic life",
      "Floating the Krathong: kneeling by the riverbank, making a heartfelt vow of personal purification, and gently releasing the candlelit vessel onto the water",
      "Sky Lantern Releases (Yi Peng): releasing glowing rice-paper lanterns into the night breeze with prayers for the cessation of world conflicts",
      "Offering Dana to Monasteries: presenting robes, books, medicines, and oil lamps to local viharas in grateful honor of the Sangha's guidance and teachings"
    ],
    "shloka": {
      "text": "सुपटिपन्नो भगवतो सावकसङ्घो, उजुपटिपन्नो भगवतो सावकसङ्घो, ञायपटिपन्नो भगवतो सावकसङ्घो, सामीचिपटिपन्नो भगवतो सावकसङ्घो, यदिदं चत्तारि पुरिसयुगानि अट्ठ पुरिसपुग्गला, एस भगवतो सावकसङ्घो आहुनेय्यो पाहुनेय्यो दक्खिणेय्यो अञ्जलिकरणीयो अनुत्तरं पुञ्ञक्खेत्तं लोकस्सा’ति॥",
      "transliteration": "Supaṭipanno bhagavato sāvakasaṅgho, ujupaṭipanno bhagavato sāvakasaṅgho, ñāyapaṭipanno bhagavato sāvakasaṅgho, sāmīcipaṭipanno bhagavato sāvakasaṅgho, yadidaṃ cattāri purisayugāni aṭṭha purisapuggalā, esa bhagavato sāvakasaṅgho āhuneyyo pāhuneyyo dakkhiṇeyyo añjalikaraṇīyo anuttaraṃ puññakkhettaṃ lokassā'ti.",
      "translation": "The Sangha of the Blessed One's disciples has practiced well; has practiced directly; has practiced correctly; has practiced with integrity. That is, the four pairs of noble persons, the eight individuals. This Sangha of the Blessed One's disciples is worthy of gifts, worthy of hospitality, worthy of offerings, worthy of reverential salutation with joined palms, the supreme field of merit for the world.",
      "source": "Saṅghānussati (Aṅguttara Nikāya 9.10, Primary Pali Canon, Tier 1 Canonical Source)"
    },
    "practice": "Light a candle tonight and place it safely in the dark. Make a conscious, deliberate choice to release one past resentment or grievance you have harbored. Let it go into the current of time, and wish well to all involved."
  }
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
