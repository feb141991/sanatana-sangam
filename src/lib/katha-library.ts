export type KathaTradition = 'hindu' | 'sikh' | 'buddhist' | 'jain';
export type KathaOccasion =
  | 'ekadashi' | 'purnima' | 'amavasya' | 'pradosh' | 'chaturthi'
  | 'shivaratri' | 'navratri' | 'diwali' | 'holi' | 'janmashtami'
  | 'ramnavami' | 'ganesh-chaturthi' | 'karva-chauth' | 'teej'
  | 'gurpurab' | 'baisakhi' | 'vesak' | 'paryushana' | 'uposatha' | 'general';

export interface Katha {
  id: string;
  tradition: KathaTradition;
  occasion: KathaOccasion;
  /** Month number (1–12) for Ekadashi kathas; null for non-month-specific */
  ekadashiMonth?: number;
  deity?: string;
  title: string;
  titleHi?: string;
  titlePa?: string;
  preview: string; // 5–6 lines shown in card
  previewHi?: string;
  body: string[];  // paragraphs — full katha
  bodyHi?: string[];
  phal: string;    // fruit/moral of the katha
  phalHi?: string;
  durationMin: number; // estimated reading time in minutes
  tags: string[];
  relatedJapaMantra?: string;
  relatedPathshalaId?: string;
}

// ─── Hindu Kathas ────────────────────────────────────────────────────────────

export const HINDU_KATHAS: Katha[] = [
  // ── Ekadashi Kathas (month-aware) ──
  {
    id: 'katha-ekadashi-margashirsha-shukla',
    tradition: 'hindu',
    occasion: 'ekadashi',
    ekadashiMonth: 11, // Margashirsha (Nov–Dec)
    deity: 'vishnu',
    title: 'Mokshada Ekadashi Katha',
    titleHi: 'मोक्षदा एकादशी कथा',
    preview: 'In the golden age of Dwapara Yuga, there lived a righteous king named Vaikhanasa in the city of Champakavati. One night, the king had a disturbing dream in which he saw his father suffering in a hellish realm, his arms raised in anguish, crying out for release. The king awoke in great distress and immediately consulted the sage Parvata Muni, who revealed that the father had committed a great sin in his past life.',
    previewHi: 'द्वापर युग में चंपकावती नगरी में वैखानस नाम के एक धर्मात्मा राजा रहते थे। एक रात राजा को एक विचलित करने वाला स्वप्न आया जिसमें उन्होंने देखा कि उनके पिता नरक लोक में पीड़ा भोग रहे हैं।',
    body: [
      'In the golden age of Dwapara Yuga, there lived a righteous king named Vaikhanasa in the city of Champakavati. He was devoted to dharma and governed his kingdom with great care and wisdom.',
      'One night, the king had a disturbing dream in which he saw his father suffering in a hellish realm — his arms raised in anguish, crying out for release. The king awoke in great distress and immediately called upon his ministers and family priests, but none could offer solace.',
      'He traveled to the hermitage of the great sage Parvata Muni and prostrated before him, describing the dream in detail. The sage entered meditation and after some time revealed: "O King, your father committed a great sin in his past life by deceiving his devoted wife. Because of this, he fell into Yamaloka after death."',
      'The king, stricken with grief, asked: "O sage, what can I do to free my father from this suffering?" The sage replied: "Observe the Mokshada Ekadashi that falls in the Shukla Paksha of the Margashirsha month. Fast with full devotion, worship Lord Vishnu with Tulsi, and transfer the merit of this observance to your father."',
      'The king returned and observed the Ekadashi with complete devotion — fasting, keeping vigil through the night, and chanting the names of Lord Vishnu. On the Dwadashi, he performed the parana (breaking of fast) and with folded hands dedicated the entire merit of his observance to his father.',
      'Immediately, flowers rained from the heavens. The king\'s father was seen ascending in a celestial chariot, freed from the hellish realm, radiating divine light. He blessed his son and rose to the higher realms. Thus, the Mokshada Ekadashi grants liberation even to departed souls when observed with sincerity.',
    ],
    bodyHi: [
      'द्वापर युग में चंपकावती नगरी में वैखानस नाम के एक धर्मात्मा राजा राज करते थे। वे धर्म के प्रति समर्पित थे और अपने राज्य का कुशलतापूर्वक संचालन करते थे।',
      'एक रात राजा को एक विचलित करने वाला स्वप्न आया। उन्होंने देखा कि उनके पिता यमलोक में कष्ट भोग रहे हैं। राजा बड़े व्याकुल हो उठे और पर्वत मुनि के आश्रम में पहुंचे।',
      'मुनि ने ध्यान में देखकर बताया — "राजन, तुम्हारे पिता ने पूर्व जन्म में अपनी पतिव्रता पत्नी के साथ छल किया था, इसी कारण वे यमलोक में हैं।"',
      'राजा ने पूछा कि उनकी मुक्ति का उपाय क्या है। मुनि ने कहा — "मार्गशीर्ष शुक्ल एकादशी — मोक्षदा एकादशी — का व्रत करो और उसका पुण्य अपने पिता को समर्पित करो।"',
      'राजा ने पूर्ण श्रद्धा से व्रत किया, रातभर जागरण किया और भगवान विष्णु का ध्यान किया। द्वादशी को पारणा करके उन्होंने व्रत का सम्पूर्ण पुण्य अपने पिता को अर्पित किया।',
      'तत्काल आकाश से पुष्पवर्षा हुई। राजा के पिता दिव्य विमान में बैठकर ऊर्ध्वलोकों की ओर जाते दिखे। उन्होंने पुत्र को आशीर्वाद दिया। इस प्रकार मोक्षदा एकादशी से मृत पूर्वजों को भी मुक्ति मिलती है।',
    ],
    phal: 'Observing Mokshada Ekadashi with full devotion and transferring its merit to departed ancestors liberates them from suffering and grants them higher realms. The devotee is also freed from the cycle of birth and death.',
    phalHi: 'मोक्षदा एकादशी का व्रत करने से न केवल व्रती को मोक्ष की प्राप्ति होती है, बल्कि पितरों को भी यमलोक से मुक्ति मिलती है।',
    durationMin: 7,
    tags: ['ekadashi', 'vishnu', 'ancestor', 'liberation', 'margashirsha'],
    relatedJapaMantra: 'Om Namo Bhagavate Vasudevaya',
  },
  {
    id: 'katha-ekadashi-kartik-shukla',
    tradition: 'hindu',
    occasion: 'ekadashi',
    ekadashiMonth: 10, // Kartik (Oct–Nov)
    deity: 'vishnu',
    title: 'Prabodhini Ekadashi Katha (Dev Uthani)',
    titleHi: 'प्रबोधिनी एकादशी कथा',
    preview: 'Once, a virtuous king named Mandhata ruled with great dharma. He was troubled seeing his kingdom afflicted by drought and famine and approached the sage Angira for guidance. The sage revealed that the Lord had gone into His cosmic sleep (Yoganidra) during Chaturmas and that only by observing Prabodhini Ekadashi — the day the Lord awakens — could prosperity return to the land.',
    body: [
      'King Mandhata once ruled a prosperous kingdom. But over time, a terrible drought befell the land — rivers ran dry, crops withered, and his people suffered. Despite his personal righteousness, the calamity persisted.',
      'In despair, the king visited the hermitage of the great sage Angira Rishi and described his kingdom\'s plight. The sage meditated for a moment and said: "O King, this suffering has descended because the Lord has entered His cosmic sleep — Yoganidra — during the sacred Chaturmas. The land cannot fully flourish when the sustainer sleeps."',
      '"However," said the sage, "there is a way. On the Shukla Ekadashi of the Kartik month — Prabodhini Ekadashi — Lord Vishnu awakens from His sleep. If you and your people observe this Ekadashi with devotion, worship the Lord with Tulsi, lamps, and flowers, and keep vigil through the night, the Lord will be pleased."',
      'The king returned and announced the observance throughout the kingdom. On the auspicious day, all citizens — young and old — fasted, gathered at the Vishnu temple, and spent the night in prayer, kirtan, and the chanting of Vishnu Sahasranama.',
      'At dawn on Dwadashi, as the king offered the final prayers, the skies opened and gentle rains fell. The rivers swelled, the land turned green, and joy returned to the kingdom. The Lord had awakened and blessed His devoted children.',
      'Prabodhini Ekadashi marks the end of Chaturmas and the resumption of all auspicious ceremonies — weddings, thread ceremonies, and new beginnings. It is the most joyful of all Ekadashis.',
    ],
    phal: 'Observing Prabodhini Ekadashi brings the same merit as performing a great Ashwamedha Yajna. All inauspiciousness is dispelled, and the devotee is blessed with prosperity, health, and liberation.',
    phalHi: 'प्रबोधिनी एकादशी का व्रत अश्वमेध यज्ञ के समान पुण्यदायी है। इस दिन भगवान विष्णु जागते हैं और भक्तों को सुख-समृद्धि का आशीर्वाद देते हैं।',
    durationMin: 6,
    tags: ['ekadashi', 'vishnu', 'kartik', 'dev-uthani', 'prosperity'],
    relatedJapaMantra: 'Om Namo Bhagavate Vasudevaya',
  },
  {
    id: 'katha-ekadashi-ashada-shukla',
    tradition: 'hindu',
    occasion: 'ekadashi',
    ekadashiMonth: 6, // Ashadha (Jun–Jul)
    deity: 'vishnu',
    title: 'Devshayani Ekadashi Katha',
    titleHi: 'देवशयनी एकादशी कथा',
    preview: 'On the Shukla Ekadashi of Ashadha, Lord Vishnu retires to His cosmic sleep in the ocean of milk for four months — the sacred Chaturmas begins. King Mandhata once asked Lord Brahma why prosperity seemed to diminish during this time, and Lord Brahma explained the significance of the Lord\'s rest and the importance of observing this Ekadashi.',
    body: [
      'Long ago, King Mandhata approached Lord Brahma and asked: "O Creator, why does the earth seem to enter a period of reduced vitality during the monsoon months? The people become lethargic, crops grow but with difficulty, and the usual auspiciousness seems muted."',
      'Lord Brahma smiled and said: "O King, you have asked a most profound question. Know that on the Shukla Ekadashi of the month of Ashadha, Lord Vishnu — the Sustainer of all universes — enters His cosmic sleep, Yoganidra, resting on the great serpent Shesha in the Kshira Sagara, the ocean of milk. This period lasts for four months and is called Chaturmas."',
      '"During these four months," Brahma continued, "all auspicious rites are suspended — marriages, thread ceremonies, and new beginnings are avoided. But this is also a time of great spiritual opportunity. Sages intensify their practices, devotees increase their japa and fasting, and the earth herself undergoes a renewal."',
      '"The Ekadashi on which the Lord retires is called Devshayani. One who fasts on this day, worships Lord Vishnu with Tulsi, yellow flowers, and sandalwood, and spends the night in His praise, will receive His special grace for the entire Chaturmas."',
      'King Mandhata observed this Ekadashi with great devotion. Throughout the four months that followed, he maintained a sattvic diet, increased his charitable acts, and spent more time in scripture study and prayer.',
      'When Prabodhini Ekadashi arrived and the Lord awakened, the king found his kingdom more prosperous than ever before. His treasury was full, his subjects were healthy, and the rains had been abundant. The Lord\'s rest had been a period of cosmic renewal for all.',
    ],
    phal: 'Devshayani Ekadashi marks the commencement of Chaturmas. Fasting on this day earns immense merit. The devotee who observes it with sincerity is granted health, wealth, and ultimately liberation from the cycle of rebirth.',
    durationMin: 6,
    tags: ['ekadashi', 'vishnu', 'chaturmas', 'ashadha', 'devshayani'],
    relatedJapaMantra: 'Om Namo Bhagavate Vasudevaya',
  },
  {
    id: 'katha-ekadashi-shravan-krishna',
    tradition: 'hindu',
    occasion: 'ekadashi',
    ekadashiMonth: 7, // Shravan (Jul–Aug)
    deity: 'vishnu',
    title: 'Kamika Ekadashi Katha',
    titleHi: 'कामिका एकादशी कथा',
    preview: 'Lord Krishna narrated this katha to King Yudhishthira. Once a devotee named Hema accidentally struck and killed a Brahmin during a dispute over land. Overwhelmed by the sin of Brahmin-slaying, he wandered in anguish until a sage told him the only redemption lay in observing Kamika Ekadashi — the Krishna Paksha Ekadashi of Shravan.',
    body: [
      'Lord Krishna once narrated the story of Kamika Ekadashi to the righteous Yudhishthira, who had asked how one could be freed from terrible sins.',
      'Long ago, a devoted householder named Hema lived in a prosperous village. One day, a heated dispute over land broke out between him and a Brahmin neighbor. In the terrible confusion that followed, Hema accidentally struck the Brahmin, who fell and died. Hema was devastated. The sin of Brahminicide — brahmahatya — was considered the gravest of all sins.',
      'He could not eat, sleep, or find peace. His family and friends shunned him. He wandered from sage to sage, seeking redemption, but most turned him away. Finally, he reached the hermitage of the sage Angira, who had great compassion upon seeing his suffering.',
      '"There is only one remedy," said the sage. "Observe the Kamika Ekadashi — the Krishna Paksha Ekadashi of the Shravan month — with complete devotion. Fast throughout, worship Lord Vishnu with Tulsi leaves, light lamps before His image, and chant His names through the night."',
      '"Know that offering even a single Tulsi leaf to Lord Vishnu on this day is equivalent to performing the Ashwamedha Yajna. The merit of this day burns away even the gravest sins."',
      'Hema observed the Ekadashi as instructed. As he placed Tulsi at the feet of Lord Vishnu and spent the entire night in prayer, he felt the heavy burden of his sin gradually lift. At dawn, a divine voice from the heavens declared him freed from the sin. His grief dissolved and he returned home, later leading a life of great devotion.',
    ],
    phal: 'Kamika Ekadashi removes even the gravest sins, including Brahmin-slaying. The worship of Lord Vishnu with Tulsi on this day grants liberation. Even hearing this katha destroys sins accumulated over many lifetimes.',
    durationMin: 7,
    tags: ['ekadashi', 'vishnu', 'shravan', 'kamika', 'sin-removal', 'tulsi'],
    relatedJapaMantra: 'Om Namo Bhagavate Vasudevaya',
  },
  {
    id: 'katha-ekadashi-vaisakha-shukla',
    tradition: 'hindu',
    occasion: 'ekadashi',
    ekadashiMonth: 4, // Vaisakha (Apr–May)
    deity: 'vishnu',
    title: 'Mohini Ekadashi Katha',
    titleHi: 'मोहिनी एकादशी कथा',
    preview: 'King Yudhishthira once asked Lord Sri Krishna about the Vaisakha Shukla Ekadashi. Krishna narrated how a merchant named Dhanpala in the city of Bhadravati was prosperous but had a wayward son named Dhrishtabuddhi who squandered wealth on vices. Disowned and destitute, Dhrishtabuddhi wandered and ultimately found redemption through the grace of the Mohini Ekadashi fast.',
    body: [
      'In the prosperous city of Bhadravati, there lived a wealthy merchant named Dhanpala. He had five sons, four of whom were devoted and virtuous. But the fifth, Dhrishtabuddhi, was addicted to gambling, illicit company, and wasting money on vice.',
      'When the merchant could bear the disgrace no more, he disowned his wayward son. Dhrishtabuddhi, now penniless and scorned, wandered through forests and villages. He stole and begged to survive, sinking deeper into misery.',
      'One day, exhausted and starving, he stumbled upon the hermitage of the sage Kaundinya. The sage was performing his morning rituals by the riverbank. Dhrishtabuddhi fell at his feet and wept, describing his wretched condition.',
      'The compassionate sage said: "You have suffered greatly because of the sins of this life. But there is a path to redemption. Observe the Mohini Ekadashi — the Shukla Ekadashi of Vaisakha — with full devotion. Fast, worship Lord Vishnu, listen to His glories, and spend the night in His remembrance."',
      'Dhrishtabuddhi was transformed by the sage\'s words. He observed the Mohini Ekadashi faithfully, staying awake all night, weeping in repentance before the image of Lord Vishnu. As dawn broke and he completed his fast on Dwadashi, a profound peace descended upon him.',
      'By the merit of this single Ekadashi, all the sins of his past were destroyed. He was granted a divine body, reunited with his family, and in time became a great devotee of the Lord. Mohini Ekadashi has the power to purify even the most sinful soul.',
    ],
    phal: 'Mohini Ekadashi destroys all sins and removes the cycle of rebirth. Even those who have fallen to the lowest depths of moral degradation are purified by observing this fast with sincere heart.',
    durationMin: 7,
    tags: ['ekadashi', 'vishnu', 'vaisakha', 'mohini', 'redemption'],
    relatedJapaMantra: 'Om Namo Bhagavate Vasudevaya',
  },
  {
    id: 'katha-ekadashi-phalguna-krishna',
    tradition: 'hindu',
    occasion: 'ekadashi',
    ekadashiMonth: 2, // Phalguna (Feb–Mar)
    deity: 'vishnu',
    title: 'Vijaya Ekadashi Katha',
    titleHi: 'विजया एकादशी कथा',
    preview: 'When Rama and His army stood at the shores of the ocean before the great battle, unable to cross to Lanka, the sage Bakadalbhya appeared and told Rama to observe Vijaya Ekadashi — the Krishna Paksha Ekadashi of Phalguna. By fasting with devotion, Rama secured divine victory over Ravana. Whoever observes this Ekadashi is assured of victory in all endeavors.',
    body: [
      'When Lord Rama arrived at the seashore with His mighty vanara army, He was in anguish. The ocean stretched endlessly before them, and Lanka — where Sita was held captive — seemed unreachable. No bridge had yet been conceived.',
      'At this critical moment, the great sage Bakadalbhya, residing in a hermitage near the shore, came to Rama and said: "O Lord, I know of a way that will ensure your victory. Observe the Vijaya Ekadashi — the Krishna Paksha Ekadashi of the month of Phalguna — with complete devotion."',
      'The sage instructed Rama to fill a golden pot with water from the ocean, place it on sacred kusha grass, worship Lord Vishnu with Panchamrit and Tulsi, fast through Ekadashi, and spend the night awake in the Lord\'s praise. Naivedya of ripe fruits and pure food was to be offered.',
      'Rama — though an avatar of Vishnu Himself — observed the fast as an ideal devotee, showing the world the power of dharma and devotion. The entire army joined in prayer and vigil through the night.',
      'On Dwadashi, as the parana was completed and the merit offered to the Supreme, Lord Varuna — the ocean god — appeared before Rama and revealed the science of building the floating bridge. The vanaras under Nala began construction, and within days the bridge was complete.',
      'Rama crossed to Lanka, defeated Ravana, and rescued Sita. Thus, the Vijaya Ekadashi — the Ekadashi of Victory — gave Lord Rama the decisive divine support for His mission. Whoever observes this Ekadashi is assured of victory over their struggles.',
    ],
    phal: 'Vijaya Ekadashi grants victory in all undertakings — in battles of life, in overcoming addictions, in resolving disputes. It is as meritorious as performing a thousand Ashwamedha Yajnas and a hundred Rajasuya Yajnas.',
    durationMin: 8,
    tags: ['ekadashi', 'vishnu', 'rama', 'phalguna', 'vijaya', 'victory'],
    relatedJapaMantra: 'Om Sri Ramaya Namah',
  },

  // ── Purnima Kathas ──
  {
    id: 'katha-satyanarayan',
    tradition: 'hindu',
    occasion: 'purnima',
    deity: 'vishnu',
    title: 'Satyanarayan Katha',
    titleHi: 'सत्यनारायण कथा',
    preview: 'The Satyanarayan Katha is the most widely observed vrat katha in Hindu households, performed on Purnima and special occasions. Lord Vishnu, in the form of Satyanarayan, narrated this katha to Narada Muni, who then carried it to the suffering world. It tells of how a poor Brahmin, a wood-cutter, a merchant, and a king each found their lives transformed by observing this simple yet powerful puja.',
    body: [
      'Once, the great sage Narada Muni wandered through the mortal realm and was moved by the suffering of humanity — poverty, sickness, conflict, and grief. He ascended to Vaikuntha and asked Lord Vishnu: "O Lord, what simple practice can the people of earth follow to overcome suffering?"',
      'Lord Vishnu smiled and revealed: "O Narada, there is a beautiful observance called the Satyanarayan Puja. One who performs it with faith on Purnima, Ekadashi, Sankranti, or any auspicious occasion will find all their wishes fulfilled and all difficulties resolved."',
      'Narada descended and first told the story to a poor Brahmin in Kashi. The Brahmin, though learned, was destitute and often went hungry. With great faith he performed the Satyanarayan Puja with whatever he had — simple offerings of milk, banana, ghee, and jaggery. That very night, his circumstances began to change. Donations came, his health improved, and within a year he was established in prosperity.',
      'A poor wood-cutter heard the Brahmin\'s story and performed the puja. His daily earnings multiplied. A merchant performed the puja before a sea voyage and returned with tremendous profit — though he nearly lost it when he forgot to perform the puja on return. Only after completing the puja did his locked treasury open.',
      'A king who had lost his kingdom and was wandering as a laborer heard the wood-cutter\'s story and performed the puja in the forest. He found his kingdom restored and his family reunited. But his son-in-law, in his greed, did not accept the prasad properly — and suffered the loss of his ships until he repented and offered proper respect.',
      'The Lord appeared in the form of an old sadhu to each of these devotees, testing their faith and rewarding their sincerity. The Satyanarayan Katha teaches that devotion, truthfulness, and gratitude are the keys to a blessed life.',
    ],
    phal: 'One who listens to the Satyanarayan Katha with faith and receives the prasad with respect will find all desires fulfilled, obstacles removed, and prosperity established. The puja should always be shared with family and neighbors.',
    phalHi: 'सत्यनारायण कथा श्रवण करने और प्रसाद ग्रहण करने से सभी मनोकामनाएं पूर्ण होती हैं, संकटों का नाश होता है और घर में सुख-समृद्धि आती है।',
    durationMin: 12,
    tags: ['purnima', 'vishnu', 'satyanarayan', 'prosperity', 'puja'],
    relatedJapaMantra: 'Om Namo Bhagavate Vasudevaya',
  },

  // ── Pradosh Kathas ──
  {
    id: 'katha-pradosh-vrat',
    tradition: 'hindu',
    occasion: 'pradosh',
    deity: 'shiva',
    title: 'Pradosh Vrat Katha',
    titleHi: 'प्रदोष व्रत कथा',
    preview: 'Once there was a widow with a virtuous young son who lived in poverty. Each Pradosh, she would fast and worship Lord Shiva with whatever flowers she could gather. One Pradosh evening, her son befriended a prince whose kingdom was under siege. That very night, Lord Shiva appeared in the boy\'s dream and guided him to find a hidden treasure, restoring the royal family — all as a reward for the widow\'s unwavering devotion.',
    body: [
      'In a small village near the forest, there lived a poor widow with her young son, Sumati. Despite their poverty, the widow observed every Pradosh — the Trayodashi of both lunar fortnights — with complete devotion, fasting through the day and offering Bilva leaves and wild flowers to a Shivalinga at dusk.',
      'One Pradosh evening, Sumati met a young boy wandering in the forest, clearly of noble birth but in distress. He introduced himself as the son of a king whose kingdom had been seized by an enemy. The prince had been separated from his parents and was alone and afraid.',
      'Sumati brought the boy home. His mother, though poor, shared their meager Pradosh prasad with the prince. That night, Lord Shiva — pleased by the widow\'s sincere devotion over so many years — appeared in both Sumati\'s and the prince\'s dreams. He revealed the location of a buried treasure near a dried riverbed at the edge of the forest.',
      'The next morning, guided by the dream, the two boys dug at the indicated spot and unearthed a treasury of gold, jewels, and ancient coins. With this wealth, the prince was able to rally loyal supporters, reclaim his father\'s kingdom, and restore his family to the throne.',
      'The prince\'s grateful father visited the widow and honoured her with gifts and land. Sumati grew up in comfort and became a great devotee of Lord Shiva, establishing a Shiva temple in the village.',
      'Lord Shiva rewards those who observe Pradosh with patience and love, even when they have very little to offer. The sincerity of the heart matters infinitely more than the grandeur of the offering.',
    ],
    phal: 'Observing Pradosh Vrat removes all planetary afflictions, neutralises the effects of past karma, and grants prosperity, good health, and ultimately liberation. Lord Shiva dances at the twilight hour and is most easily pleased on this day.',
    phalHi: 'प्रदोष व्रत करने से ग्रह-दोष दूर होते हैं, पापों का नाश होता है और भगवान शिव की कृपा से सुख-सम्पत्ति की प्राप्ति होती है।',
    durationMin: 8,
    tags: ['pradosh', 'shiva', 'devotion', 'poverty', 'treasure', 'twilight'],
    relatedJapaMantra: 'Om Namah Shivaya',
  },

  // ── Chaturthi Kathas ──
  {
    id: 'katha-sankashti-chaturthi',
    tradition: 'hindu',
    occasion: 'chaturthi',
    deity: 'ganesha',
    title: 'Sankashti Chaturthi Katha',
    titleHi: 'संकष्टी चतुर्थी कथा',
    preview: 'Narada Muni once asked Lord Brahma: "Who should be worshipped first among all the gods?" Brahma told the story of a great competition between Kartikeya and Ganesha — whoever circled the universe first would receive the right of first worship. While Kartikeya set off on his peacock, the wise Ganesha simply circled his parents Shiva and Parvati — representing the entire universe. Ganesha won, and the Chaturthi became His sacred day.',
    body: [
      'Once, the great sage Narada came to Mount Kailash and posed a question to Lord Shiva and Goddess Parvati: "O Lord, which of your sons — Kartikeya or Ganesha — is greater?" Rather than answer directly, Shiva smiled and decided to settle the matter through a divine contest.',
      '"Whoever among you circumambulates the entire universe first shall be declared the greatest and shall receive the right of first worship in all ceremonies," declared Shiva. Immediately, the mighty Kartikeya mounted his peacock and sped away, circling the galaxies and worlds at lightning speed.',
      'Ganesha looked at his rotund form and his small mouse vehicle. Rather than feel dismayed, he smiled with great wisdom. He walked slowly to where his parents Shiva and Parvati sat, joined his palms, and circumambulated them three times with deep reverence.',
      '"O Father and Mother, you are the entire universe. The Vedas declare: \'Matru devo bhava, Pitru devo bhava\' — father and mother are god. By honouring you, I have circumambulated the entire creation,"said Ganesha.',
      'Shiva and Parvati were deeply moved. Before Kartikeya even returned from his cosmic journey, Shiva declared Ganesha the victor. From that day, Ganesha received the boon of being worshipped first in all rituals and ceremonies. The Chaturthi — the fourth day — became His sacred tithi.',
      'On Sankashti Chaturthi, devotees fast until moonrise, worship Ganesha with Durva grass and modaks, and break the fast only after sighting the moon. Ganesha removes all sankasht — all difficulties — from the lives of His devoted.',
    ],
    phal: 'Observing Sankashti Chaturthi removes all obstacles from one\'s path. Ganesha, the Vighnaharta, clears the way for success in all endeavors — from small daily challenges to life\'s greatest trials.',
    phalHi: 'संकष्टी चतुर्थी का व्रत करने से भगवान गणेश सभी संकट और बाधाएं दूर करते हैं। मनोकामनाएं पूर्ण होती हैं और जीवन में सफलता आती है।',
    durationMin: 8,
    tags: ['chaturthi', 'ganesha', 'obstacles', 'first-worship', 'moon'],
    relatedJapaMantra: 'Om Gam Ganapataye Namah',
  },

  // ── Shivaratri Katha ──
  {
    id: 'katha-shivaratri',
    tradition: 'hindu',
    occasion: 'shivaratri',
    deity: 'shiva',
    title: 'Masik Shivaratri Katha — The Hunter\'s Redemption',
    titleHi: 'शिवरात्रि कथा — शिकारी का उद्धार',
    preview: 'In ancient times, a hunter named Suswara lived by killing animals in the forest. One night — unknowingly on Shivaratri — he climbed a Bilva tree to escape a tiger. Through the night, he kept dropping Bilva leaves below — which happened to fall on a Shivalinga at the tree\'s base. His accidental all-night vigil and the Bilva offering, though unintentional, pleased Lord Shiva so greatly that at death, Shiva\'s messengers came for him instead of Yama\'s.',
    body: [
      'In the forests of ancient India there lived a hunter named Suswara, a fierce and cruel man who killed animals mercilessly for a living, caring nothing for dharma or spiritual life.',
      'One day, deep in the forest, he found himself being stalked by a tiger as night fell. Desperate, he climbed a tall Bilva tree for safety. The tiger settled at the base of the tree, watching and waiting. Suswara dared not descend.',
      'That night happened to be Shivaratri — the 14th night of the Krishna Paksha of Phalguna. As Suswara crouched fearfully in the Bilva tree through the long cold night, he kept shaking the branches to stay awake and alert. Bilva leaves fell from the branches continuously.',
      'Unknown to Suswara, directly below the tree was an ancient Shivalinga, partially covered by leaves and invisible in the darkness. Every Bilva leaf that fell landed on the Shivalinga. By staying awake all night in the tree, Suswara had accidentally performed the Shivaratri Jagaran — the all-night vigil — and by the Bilva leaves, he had unknowingly offered Bilva Archana to Lord Shiva.',
      'When Suswara finally descended at dawn and the tiger had gone, he felt inexplicably lighter, as if a great weight had lifted from him. He lived out his days and eventually died.',
      'When Yama\'s messengers came for his soul, Lord Shiva\'s messengers — the Ganas — arrived simultaneously and declared: "This man is claimed by Lord Shiva. He fasted through Shivaratri and offered Bilva to the Lord, even if unknowingly. His sins are erased." And so Suswara, despite his sinful life, attained Shivaloka — solely by the grace of an accidental but complete Shivaratri observance.',
    ],
    phal: 'Even accidental observance of Shivaratri — fasting, staying awake, and offering Bilva — earns Lord Shiva\'s boundless grace. Intentional, devotional observance grants liberation itself. All sins accumulated over many lifetimes are destroyed.',
    phalHi: 'शिवरात्रि का व्रत अनजाने में भी हो जाए तो भगवान शिव की कृपा मिलती है। जानबूझकर भक्तिपूर्वक व्रत करने से मोक्ष की प्राप्ति होती है।',
    durationMin: 9,
    tags: ['shivaratri', 'shiva', 'bilva', 'hunter', 'grace', 'liberation'],
    relatedJapaMantra: 'Om Namah Shivaya',
  },

  // ── Navratri Katha ──
  {
    id: 'katha-navratri-durga',
    tradition: 'hindu',
    occasion: 'navratri',
    deity: 'devi',
    title: 'Durga Saptashati — Mahishasura Mardini Katha',
    titleHi: 'महिषासुर मर्दिनी कथा',
    preview: 'The demon Mahishasura, after severe tapas, received a boon that no man or god could kill him. With this power, he conquered the three worlds and drove the gods from heaven. The gods, led by Brahma, Vishnu, and Shiva, concentrated their divine energies and from this combined light emerged Devi — the Goddess Durga. For nine days and nights she battled Mahishasura and his armies, and on the tenth day, Vijaya Dashami, she slew him.',
    body: [
      'In the ancient age, the demon Mahishasura performed severe austerities for thousands of years. Pleased by his tapas, Lord Brahma appeared and granted him a boon. Mahishasura asked: "Let no man or god be able to slay me." The boon was granted.',
      'Armed with this invincibility, Mahishasura gathered a vast demonic army and launched a war against the gods. The devas fought valiantly but were overwhelmed. Heaven fell, the gods were driven to the earth, and Mahishasura seated himself on Indra\'s throne and ruled the three worlds with terror.',
      'The defeated gods approached Lord Brahma, who led them to Lord Vishnu and Lord Shiva. The three greatest gods were filled with divine anger at the demons\' cruelty. From the concentrated energy (tej) of all the gods, a blinding divine light emerged, taking the form of a magnificent Goddess — Durga, the Divine Mother.',
      'The gods offered her their weapons — Shiva his trident, Vishnu his Sudarshana Chakra, Indra his thunderbolt, Agni his spear, Vayu his bow, Varuna his conch. Seated on a lion, Devi descended to the battlefield. Her roar shook the heavens and the demons trembled.',
      'For nine days and nights, the battle raged. Mahishasura sent his greatest generals — Chikshura, Chamara, Karala — all were slain. He himself changed into many forms: a buffalo, a lion, a man, an elephant. Each form was destroyed by the Goddess.',
      'On the tenth day, Mahishasura emerged from his buffalo form in the shape of a great warrior. Devi leapt upon him, pinned him with her foot, and drove her trident through his heart. He fell dead, and the gods rained flowers from heaven, singing her praises. This tenth day is celebrated as Vijaya Dashami — Dussehra — the day of divine victory over evil.',
    ],
    phal: 'Reciting or hearing the Durga Saptashati during Navratri destroys all enemies, removes fear, grants protection, and bestows abundance and liberation. The Goddess Durga is the supreme protector of all who call upon Her with sincere devotion.',
    phalHi: 'नवरात्रि में दुर्गा सप्तशती का पाठ करने से सभी शत्रुओं का नाश होता है, भय दूर होता है, और माँ दुर्गा की असीम कृपा प्राप्त होती है।',
    durationMin: 10,
    tags: ['navratri', 'devi', 'durga', 'mahishasura', 'victory', 'protection'],
    relatedJapaMantra: 'Om Dum Durgayai Namah',
  },

  // ── Janmashtami Katha ──
  {
    id: 'katha-janmashtami',
    tradition: 'hindu',
    occasion: 'janmashtami',
    deity: 'krishna',
    title: 'Janmashtami Katha — Krishna\'s Divine Birth',
    titleHi: 'जन्माष्टमी कथा — कृष्ण जन्म',
    preview: 'In the prison cell of Mathura, the wicked king Kamsa had imprisoned his own sister Devaki and her husband Vasudeva after a divine prophecy declared that Devaki\'s eighth child would slay Kamsa. Six children had been killed at birth. On the eighth night of the dark fortnight of Shravan, in the darkest hour, Lord Vishnu Himself descended as the eighth son — Lord Krishna — and the world was flooded with divine light.',
    body: [
      'The demon-king Kamsa of Mathura was proud and powerful. On the day of his sister Devaki\'s wedding to the noble Vasudeva, a divine voice from the sky declared: "O Kamsa, the eighth son of this woman you celebrate shall be your end."',
      'Kamsa, gripped by terror and selfishness, immediately imprisoned both Devaki and Vasudeva in a stone cell. He killed each of their children as they were born — six sons were murdered at Kamsa\'s hands. The seventh — Balarama — was secretly transferred to Rohini\'s womb by divine arrangement and survived.',
      'On the eighth night of the Krishna Paksha of Shravan, the most auspicious moment arrived. The midnight hour. The world was dark and stormy. Inside the prison, Devaki\'s labor began. Vasudeva prayed with tears streaming down his face.',
      'In that sacred moment, Lord Vishnu — the Supreme Being — descended from Vaikuntha and was born as the eighth son. The prison cell was flooded with divine light. The Lord appeared in His four-armed form, holding conch, chakra, lotus, and mace, wearing a crown of brilliant jewels. Devaki and Vasudeva fell prostrate in awe.',
      'The Lord then transformed into an infant and instructed Vasudeva: "Take me across the Yamuna to Gokula. Place me with Nanda and Yashoda\'s daughter who was born at this same moment. Bring her back. The guards will sleep, the prison doors will open, and the Yamuna will make way."',
      'Vasudeva lifted the infant in a basket on his head and crossed the stormy Yamuna. The river parted for the Lord. He reached Gokula, exchanged the children, and returned. The newborn girl cried, waking the guards. When Kamsa seized her to kill her, she slipped from his hands, rose into the sky, and declared: "Your destroyer has already been born, O Kamsa!" The world rejoiced, for the Lord had come.',
    ],
    phal: 'Fasting on Janmashtami and hearing the story of the Lord\'s birth grants one freedom from sin, fulfillment of desires, and ultimately liberation. The Lord declares in the Gita: "One who knows My divine birth and activities, after leaving the body, comes to Me — he is never born again."',
    phalHi: 'जन्माष्टमी का व्रत करने और भगवान कृष्ण के जन्म की कथा सुनने से पापों का नाश होता है, इच्छाएं पूर्ण होती हैं और अंत में मोक्ष की प्राप्ति होती है।',
    durationMin: 10,
    tags: ['janmashtami', 'krishna', 'birth', 'vishnu', 'kamsa', 'liberation'],
    relatedJapaMantra: 'Om Namo Bhagavate Vasudevaya',
  },

  // ── Ram Navami Katha ──
  {
    id: 'katha-ram-navami',
    tradition: 'hindu',
    occasion: 'ramnavami',
    deity: 'rama',
    title: 'Ram Navami Katha — Sri Rama\'s Advent',
    titleHi: 'राम नवमी कथा — श्रीराम का प्राकट्य',
    preview: 'In the Treta Yuga, the demon Ravana\'s terror had grown so great that the gods themselves were threatened. The earth goddess, Bhumi Devi, disguised as a cow, approached Lord Brahma weeping. Brahma led all the gods to Vaikuntha to pray to Lord Vishnu. Moved by their plea, Lord Vishnu promised to descend in the kingdom of Kosala as the son of King Dasharatha — as Sri Rama — on the Navami tithi of Chaitra Shukla Paksha.',
    body: [
      'In the Treta Yuga, the ten-headed demon Ravana had performed intense tapas and received boons of near-invincibility from Lord Brahma. He terrorised the three worlds, attacked the gods, disrupted sacred yajnas, and reduced the Rishis to despair. Even Indra, the king of gods, was defeated.',
      'The Earth, Bhumi Devi, could bear her suffering no more. She took the form of a cow and, accompanied by sages and gods, approached Lord Brahma. With tears flowing, she described the atrocities being committed by Ravana and his demons.',
      'Lord Brahma led the entire assembly of gods to the divine ocean of milk — Kshira Sagara — where Lord Vishnu rested on the great serpent Ananta. They prayed with great devotion: "O Lord, the earth is crushed under Ravana\'s tyranny. Only You can restore dharma."',
      'Lord Vishnu opened His lotus eyes and said: "I hear your prayer. I shall be born as the son of King Dasharatha in the beautiful city of Ayodhya, in the noble Ikshvaku lineage. I shall take birth as four sons through the Putrakameshti Yajna that the sage Rishyashringa will perform."',
      'In Ayodhya, King Dasharatha — who had long grieved his childlessness — performed the Putrakameshti Yajna under the sage\'s guidance. From the sacred fire emerged a divine being carrying a golden vessel of kheer. The three queens consumed the prasad.',
      'On the Navami tithi of Chaitra Shukla Paksha — Ram Navami — as the Pushya Nakshatra rose and five planets aligned in their most auspicious positions, Queen Kaushalya gave birth to a son of incomparable radiance. The child smiled with four arms holding conch, chakra, lotus, and mace — then transformed into a beautiful infant boy. The entire kingdom of Ayodhya erupted in celebration. The Lord had come.',
    ],
    phal: 'Fasting on Ram Navami and hearing the story of Lord Rama\'s divine birth is equal to performing hundreds of Ashwamedha Yajnas. Rama\'s name is the greatest mantra — even its inadvertent utterance destroys sins accumulated over many lifetimes.',
    phalHi: 'राम नवमी का व्रत करने और श्रीराम के जन्म की कथा सुनने से सैकड़ों अश्वमेध यज्ञों का पुण्य मिलता है। श्रीराम के नाम जप से जन्म-जन्मांतर के पाप नष्ट होते हैं।',
    durationMin: 9,
    tags: ['ramnavami', 'rama', 'birth', 'vishnu', 'chaitra', 'dharma'],
    relatedJapaMantra: 'Om Sri Ramaya Namah',
  },

  // ── Ganesh Chaturthi ──
  {
    id: 'katha-ganesh-chaturthi',
    tradition: 'hindu',
    occasion: 'ganesh-chaturthi',
    deity: 'ganesha',
    title: 'Ganesh Chaturthi Katha — Ganesha\'s Creation',
    titleHi: 'गणेश चतुर्थी कथा — गणेश जन्म',
    preview: 'While Lord Shiva was away, Goddess Parvati fashioned a beautiful boy from the turmeric paste on her body and asked him to guard her door. When Shiva returned, the boy — not knowing Shiva — prevented His entry. An enraged Shiva beheaded the boy. Parvati was devastated. To console her, Shiva ordered His ganas to bring the head of the first living being they found facing north — an elephant. Shiva placed the head on the boy\'s body and restored him to life as Ganesha.',
    body: [
      'One day, Goddess Parvati wished to bathe without disturbance on Mount Kailash. Lord Shiva was away on one of His long cosmic wanderings, and there was no one to guard Her door.',
      'Parvati took some turmeric paste — which She used for bathing — and shaped it into the form of a beautiful, strong boy. She breathed life into him and said: "You are my son. Guard this door. Do not let anyone enter, no matter who they are."',
      'The boy stood faithfully at the door. When Lord Shiva returned from His wanderings, He was surprised to find a boy blocking His own home. The boy, loyal to his mother\'s command and not knowing Shiva, refused to let Him pass.',
      'Shiva tried to reason with the boy, but the boy stood firm. Shiva\'s attendants — the Ganas — tried to remove the boy by force, but the boy defeated them all with great valor. A great battle erupted. Finally, in anger, Lord Shiva raised His trident and severed the boy\'s head.',
      'When Parvati emerged and saw Her son lying headless, Her grief turned to rage. She threatened to destroy the entire creation. The gods were terrified. Brahma and Vishnu approached Her with folded hands and asked what would pacify Her. "Restore my son to life," She commanded.',
      'Shiva, moved by love for Parvati and recognising the justice of the boy\'s loyalty, instructed His Ganas: "Go north and bring the head of the first living creature you find facing that direction." They returned with the head of an elephant. Shiva placed it on the boy\'s body, breathed divine life into him, and declared: "Henceforth, this child shall be worshipped first in all ceremonies. He shall be called Ganesha — the Lord of all my Ganas." Thus Ganesha received his elephant head and his supreme boon of first worship.',
    ],
    phal: 'Worshipping Lord Ganesha on Ganesh Chaturthi removes all obstacles from one\'s path. The devotee who observes the fast, performs the puja, and hears the katha will find their endeavors blessed with success and their life free from unnecessary hardship.',
    phalHi: 'गणेश चतुर्थी पर भगवान गणेश की पूजा करने से जीवन की सभी बाधाएं दूर होती हैं और कार्यों में सफलता मिलती है।',
    durationMin: 8,
    tags: ['ganesh-chaturthi', 'ganesha', 'shiva', 'parvati', 'creation', 'first-worship'],
    relatedJapaMantra: 'Om Gam Ganapataye Namah',
  },

  // ── Karva Chauth ──
  {
    id: 'katha-karva-chauth',
    tradition: 'hindu',
    occasion: 'karva-chauth',
    deity: 'shiva',
    title: 'Karva Chauth Katha — Veervati\'s Devotion',
    titleHi: 'करवा चौथ कथा — वीरवती की भक्ति',
    preview: 'Queen Veervati, having fasted all day for Karva Chauth, broke her fast when her brothers — unable to bear her hunger — tricked her with a lamp behind a sieve resembling the moon. That same night, her husband the king died. Inconsolable, she observed the fast with absolute purity the following year, and Yama was compelled to restore her husband\'s life. Her steadfast love became the symbol of this great vrat.',
    body: [
      'Long ago, there lived a beautiful queen named Veervati who had seven devoted brothers. On the occasion of Karva Chauth, she fasted from sunrise, following tradition, with prayers for her husband\'s long life and prosperity.',
      'By evening, the fast had been long and Veervati was weak with hunger. Her brothers could not bear to see their beloved sister suffer. As she waited for the moon to rise to break her fast, the brothers devised a plan. They held a lamp behind a sieve and created a glow that resembled the moon rising.',
      'Veervati, deceived, broke her fast without the real moon\'s appearance. But almost immediately, a terrible message arrived from the palace: her husband the king had suddenly died. Veervati was devastated. She understood that breaking the Karva Chauth fast improperly — before the actual moon — had had a terrible consequence.',
      'She refused to be consoled. She sat in vigil by her husband\'s body for the entire year, neither eating lavishly nor living carelessly, maintaining her faith. The following Karva Chauth, she observed the fast with absolute purity — from sunrise to the actual moonrise, with no deception and complete devotion.',
      'Her prayers and fast were so powerful that Yama — the god of death — was compelled to return her husband\'s soul. The king revived. The couple were reunited, and their life together was long, joyful, and prosperous.',
      'From that day, Karva Chauth became established as the great vrat for married women — a day of fasting, devotion, and the deep bond of love and prayer for one\'s husband\'s wellbeing. The fast must always be broken only upon seeing the actual moon.',
    ],
    phal: 'A wife who observes Karva Chauth with complete faith and devotion — fasting from sunrise to moonrise — is blessed with her husband\'s long life, health, and prosperity. The love of a devoted wife is said to even move the gods.',
    phalHi: 'जो पत्नी करवा चौथ का व्रत पूर्ण श्रद्धा से करती है, उसके पति को दीर्घायु, स्वास्थ्य और सुख की प्राप्ति होती है।',
    durationMin: 9,
    tags: ['karva-chauth', 'women', 'devotion', 'husband', 'moon', 'marriage'],
  },

  // ── Amavasya Katha ──
  {
    id: 'katha-amavasya-tarpan',
    tradition: 'hindu',
    occasion: 'amavasya',
    title: 'Amavasya Katha — The King\'s Dream',
    titleHi: 'अमावस्या कथा — राजा का स्वप्न',
    preview: 'A prosperous king had a recurring dream in which his ancestors appeared, emaciated and pleading for water. Despite the kingdom\'s wealth, the king felt powerless. He consulted the sage Vishwamitra who explained that the ancestors were bound in the intermediate realm, thirsty for Tarpan. By performing Pitru Tarpan on every Amavasya at a riverbank, the king freed his ancestors and his own life was blessed with unforeseen grace.',
    body: [
      'A prosperous king ruled his kingdom wisely and was generous in charity. Yet he suffered from recurring, disturbing dreams. In these dreams, a group of emaciated figures appeared — his deceased parents and grandparents — with parched lips and hollow eyes, their hands outstretched, pleading for water.',
      'The king awoke each time in a cold sweat. Despite his wealth, he felt helpless. He consulted his court Brahmin priests, who performed various rituals, but the dreams continued. Finally, he journeyed to the hermitage of the sage Vishwamitra.',
      'Vishwamitra listened with compassion and said: "O King, your ancestors are in the Pitru Loka — the intermediate realm. They are sustained by the Tarpan and Shraddha that their descendants perform for them. When these are neglected, the ancestors grow hungry and thirsty and reach out to their living kin through dreams."',
      '"On every Amavasya — the new moon day — go to a sacred river or tirtha and perform Tarpan. Offer water mixed with sesame seeds and flowers in the name of your departed ancestors for three generations. Recite their names and pray for their peace. Donate food and clothes to the needy in their memory."',
      'The king began observing this practice on every Amavasya. He would rise before dawn, bathe, and go to the riverside with sesame and Kusha grass. With great devotion, he would cup his palms and offer water three times for each ancestor, calling their names.',
      'Gradually the dreams changed. His ancestors appeared well-fed, radiant, and at peace. One night, they appeared smiling, declared their liberation, and blessed the king with abundance, health, and long life. From that day, the king made Amavasya observance a royal tradition, and his kingdom prospered beyond measure.',
    ],
    phal: 'Performing Pitru Tarpan on Amavasya frees departed souls from suffering, earns their blessings, and brings peace and prosperity to the family. Neglecting this duty can lead to Pitru Dosha, which affects health, relationships, and progeny.',
    durationMin: 7,
    tags: ['amavasya', 'ancestors', 'tarpan', 'pitru', 'liberation', 'family'],
  },

  // ── Teej Katha ──
  {
    id: 'katha-hariyali-teej',
    tradition: 'hindu',
    occasion: 'teej',
    deity: 'shiva',
    title: 'Hariyali Teej Katha — Parvati\'s Tapas for Shiva',
    titleHi: 'हरियाली तीज कथा — पार्वती का तप',
    preview: 'Goddess Parvati had loved Lord Shiva from her childhood as Sati. After Sati\'s self-immolation, she was reborn as Parvati, daughter of the Himalayas. But Shiva had retreated into deep meditation, indifferent to the world. Parvati performed extreme tapas in the forests for years — standing on one foot, meditating in fire in summer, sitting in snow in winter — to win Shiva\'s love. Her devotion became the eternal model for Teej.',
    body: [
      'The Goddess had loved Lord Shiva through lifetimes. As Sati, she had given up her life when her father Daksha insulted Shiva. She was reborn as Parvati, daughter of Himalaya, the mountain king. From childhood, she felt an inexplicable pull toward Shiva — she knew He was her eternal beloved.',
      'But Shiva, grief-stricken by Sati\'s death, had entered into deep samadhi in the Himalayas. He was absorbed in infinite stillness, indifferent to the world, to time, to love. Even the gods could not rouse Him. The sage Narada advised Parvati that only her pure love and tapas could reach through Shiva\'s meditation.',
      'Parvati left her palace and retreated into the deep forest. She began a tapas of extraordinary intensity. In summer, she meditated surrounded by five fires — the four directions and the sun above. In winter, she sat in snow and ice. During the rains, she stood in the open, enduring the downpour. She ate only dry leaves, then only water, then nothing at all.',
      'Years passed. Her body grew thin, but her devotion grew stronger. The gods watched in amazement. Even Lord Brahma and Vishnu were moved. They approached Shiva and spoke of Parvati\'s extraordinary love and sacrifice.',
      'Slowly, inexorably, Shiva\'s meditation began to yield to Her call. He opened His eyes and, moved by the depth of Her tapas, went Himself to Parvati in the forest. He asked: "Why have you done this?" She replied simply: "Because You are my everything. I have been Yours through every life and I shall be Yours through every death."',
      'Shiva was deeply moved and accepted Parvati as His consort. Their union was the union of Shakti and Shiva — the divine feminine and divine masculine, the eternal dance of the universe. Teej celebrates this sacred love — the love that conquers even divine indifference through sheer devotion and perseverance.',
    ],
    phal: 'Women who observe Teej — fasting and praying for their husband\'s wellbeing — receive the blessings of Goddess Parvati, the ideal devoted consort. Unmarried women who fast for Teej are blessed with a devoted, virtuous husband.',
    phalHi: 'तीज का व्रत करने वाली स्त्रियों को माँ पार्वती का आशीर्वाद मिलता है। सुहागिन स्त्रियों के पतियों की आयु लम्बी होती है और कन्याओं को योग्य वर की प्राप्ति होती है।',
    durationMin: 9,
    tags: ['teej', 'parvati', 'shiva', 'tapas', 'devotion', 'women', 'marriage'],
    relatedJapaMantra: 'Om Namah Shivaya',
  },

  // ── Diwali Katha ──
  {
    id: 'katha-diwali-lakshmi',
    tradition: 'hindu',
    occasion: 'diwali',
    deity: 'lakshmi',
    title: 'Diwali Katha — Lakshmi Puja and the Return of Rama',
    titleHi: 'दिवाली कथा — लक्ष्मी पूजा और राम का आगमन',
    preview: 'Diwali marks Lord Rama\'s return to Ayodhya after 14 years of exile and His victory over Ravana. The people of Ayodhya lit thousands of lamps to guide their beloved prince home through the dark Amavasya night. On this same night, the goddess Lakshmi — born from the churning of the cosmic ocean — traverses the earth and enters only those homes that are clean, well-lit, and filled with devotion.',
    body: [
      'On the Amavasya of the Kartik month, two of the most auspicious events in sacred history coincided: the return of Lord Rama to Ayodhya after 14 years of exile, and the emergence of Goddess Lakshmi from the churning of the cosmic ocean, Samudra Manthan.',
      'When Lord Rama defeated Ravana and rescued Sita on Vijaya Dashami — Dussehra — He began the journey home. But the route back to Ayodhya was long, and His arrival was on the darkest night of the month — the new moon of Kartik.',
      'The people of Ayodhya, who had waited fourteen long years for their beloved prince, were not going to let darkness stop their celebration. Every household lit diyas — earthen lamps — in rows along pathways, on rooftops, on windowsills, on rivers. The entire city blazed with light, transforming the dark Amavasya into a night brighter than the full moon.',
      'Lord Rama, Sita, and Lakshmana descended from the Pushpaka Vimana and were overwhelmed by the sight of Ayodhya ablaze with love. The people received their king with flowers, incense, and the singing of his praises. This is why Diwali lamps are lit — to re-enact that homecoming every year.',
      'On this same Amavasya, Goddess Lakshmi — who was born from the Samudra Manthan and chose Lord Vishnu as Her consort — is believed to roam the earth in the night. She pauses at each home and enters only where there is cleanliness, light, order, and heartfelt devotion.',
      'Families clean their homes, draw rangoli at the doorstep, light diyas, and perform Lakshmi Puja at midnight. Offerings of sweets, incense, and flowers are made. Business account books are blessed. The Goddess bestows Her grace of prosperity, wealth, and abundance for the year ahead.',
    ],
    phal: 'Worshipping Goddess Lakshmi on Diwali Amavasya with a pure heart, clean home, and lit lamps invites Her enduring presence. Prosperity, abundance, and auspiciousness dwell in homes where Lakshmi is honoured with sincere devotion.',
    phalHi: 'दिवाली की रात श्रद्धापूर्वक लक्ष्मी पूजा करने से माँ लक्ष्मी का घर में वास होता है और वर्षभर सुख-समृद्धि बनी रहती है।',
    durationMin: 8,
    tags: ['diwali', 'lakshmi', 'rama', 'kartik', 'prosperity', 'light'],
    relatedJapaMantra: 'Om Shreem Mahalakshmiyei Namah',
  },
];

// ─── Sikh Sakhis ─────────────────────────────────────────────────────────────

export const SIKH_SAKHIS: Katha[] = [
  {
    id: 'sakhi-guru-nanak-sacha-sauda',
    tradition: 'sikh',
    occasion: 'gurpurab',
    title: 'Sacha Sauda — The True Bargain',
    titlePa: 'ਸੱਚਾ ਸੌਦਾ',
    preview: 'Guru Nanak Dev Ji\'s father gave young Nanak twenty rupees and asked him to buy goods to trade for profit — his first business venture. On the way to the market, Nanak encountered a group of starving sadhus. Without hesitation, he spent all twenty rupees feeding them, then returned home saying he had made the best bargain possible — a sacha sauda, a true deal.',
    body: [
      'When Guru Nanak Dev Ji was a young man, his father Mehta Kalu Ji decided it was time his son learned about commerce and trade. He gave Nanak twenty rupees and instructed him to go to the market town, buy goods, trade them for a profit, and return home. This was to be Nanak\'s initiation into the world of business.',
      'Nanak set off with his childhood friend Bala. On the road to the market, they came upon a grove of trees where a group of sadhus — wandering holy men — were resting. They were clearly in a state of severe hunger, some too weak to sit upright. Nanak learned they had been fasting for many days and had no food.',
      'Nanak\'s heart filled with compassion. Without a moment\'s hesitation, he took the twenty rupees his father had given him and purchased food for the entire group — vegetables, lentils, flour, and fruits. He cooked for them and served them with his own hands. The sadhus ate, offered their blessings, and continued on their journey.',
      'Nanak returned home with no goods and no money — only a heart full of joy. His father was furious. "Where are the goods? Where is the money?" Nanak smiled and said, "Baba Ji, I made a sacha sauda — a true bargain. I invested your twenty rupees in feeding starving souls. No better return exists in this world or the next."',
      'His father, though angry, was silenced by the profound logic. This story became one of the most beloved in Sikh tradition — a perfect illustration of Guru Nanak\'s teaching that seva (selfless service) to humanity is the highest form of worship. Feeding the hungry is feeding God.',
      '"Ghaal khaae kichhu hathho dae. Nanak raahu pachhaanahi sae." — One who eats from their own labour and gives from their hands — O Nanak, this is the true path. The Sacha Sauda episode set the tone for Guru Nanak\'s entire mission: that genuine spirituality is inseparable from service to fellow human beings.',
    ],
    phal: 'The Sacha Sauda teaches that selfless service — particularly feeding the hungry — is the highest trade one can make. Whatever is offered to the needy in the spirit of seva reaches the Divine directly. True wealth is measured in hearts served, not coins accumulated.',
    durationMin: 8,
    tags: ['guru-nanak', 'seva', 'langar', 'compassion', 'sacha-sauda'],
  },
  {
    id: 'sakhi-guru-nanak-baba-sheikh-farid',
    tradition: 'sikh',
    occasion: 'general',
    title: 'Guru Nanak and the Bent Needle',
    preview: 'When Guru Nanak Dev Ji visited the dargah of the great Sufi saint Baba Sheikh Farid, He was offered the saint\'s needle as a gift — but with a profound condition: return it to Farid in the next world. Guru Nanak\'s response revealed the entire philosophy of detachment from material things and the universality of the Divine.',
    body: [
      'Guru Nanak Dev Ji, on His many travels across the Indian subcontinent and beyond, visited the dargah of the revered Sufi saint Baba Sheikh Farid in Pakpattan. The two great spiritual figures met with deep mutual respect.',
      'As Guru Nanak was about to depart, Farid\'s followers brought a needle as a parting gift — a symbol of the saint\'s affection and blessing. "Please take this needle as our gift," they said. "And when you reach the next world — the hereafter — please return it to our Baba Sheikh Farid."',
      'Guru Nanak smiled, held the needle in His fingers, and said gently: "Tell me — which needle can pass through to the next world? Nothing made of iron or gold or any material substance follows us beyond death. We carry only what we have woven into our souls — our deeds, our love, our devotion."',
      '"How then can I carry this needle to Farid? And how then can Farid receive it? The only thing that truly travels with us is the naam — the Name of the Divine — and the merit of our selfless actions. That is the only baggage that crosses the threshold of death."',
      'The followers were moved. Guru Nanak returned the needle respectfully. The incident became a teaching on detachment — that we must live fully and lovingly in this world, but without clinging to any material thing as permanent. Only the Divine Name accompanies us into eternity.',
    ],
    phal: 'This Sakhi teaches the profound truth of impermanence — that only Naam, selfless love, and pure deeds accompany us beyond death. Live generously, serve freely, and anchor yourself in the Divine Name above all else.',
    durationMin: 6,
    tags: ['guru-nanak', 'detachment', 'naam', 'sufi', 'farid', 'afterlife'],
  },
  {
    id: 'sakhi-guru-angad-lohri',
    tradition: 'sikh',
    occasion: 'baisakhi',
    title: 'Guru Angad Dev Ji — The Radish Field',
    preview: 'When Guru Nanak chose the devoted Bhai Lehna as His successor — Guru Angad Dev Ji — over His own sons, it was not because of birth or status but because of selfless service. This Sakhi of how Guru Nanak tested all his disciples, and how Lehna served without ego or expectation, reveals the very essence of seva in Sikh teaching.',
    body: [
      'Guru Nanak Dev Ji knew that His physical life was drawing to a close. He had two sons — Sri Chand and Lakhmi Das — who were capable men. But he also had a devoted disciple named Bhai Lehna, who had come to Kartarpur to serve the Guru and had stayed for years, performing every task with complete humility and love.',
      'To test His disciples, Guru Nanak devised several trials. Once, the Guru asked who among His followers would carry a bundle of wet, muddy grass on their heads. Sri Chand and Lakhmi Das refused, saying it was beneath their dignity. But Lehna immediately lifted the bundle on his head and carried it wherever the Guru directed, mud dripping onto his fine clothes.',
      'Another time, the Guru asked who would retrieve a garland of flowers that had fallen into a muddy pit. Again, Lehna descended without hesitation, retrieved the garland, and presented it to the Guru with his hands covered in mud and a serene smile on his face.',
      'On another occasion, the Guru pointed to what appeared to be a dead body covered in a white sheet and asked his disciples to consume the prasad of this body. His sons were horrified and refused. Lehna approached and, trusting the Guru completely, lifted the sheet — and found instead a platter of sacred food.',
      'Guru Nanak looked at Lehna with deep love and said: "You are not Lehna — the one who takes. You are Angad — a part of my own limb. You shall carry forward this light." He anointed Lehna as Guru Angad Dev Ji, the second Guru of the Sikhs.',
      'This Sakhi teaches that true discipleship is not about birth or intellect but about ego-less seva — selfless service done without any consideration of status, reward, or personal comfort. Guru Angad\'s humility became the very criterion for spiritual succession.',
    ],
    phal: 'True seva — selfless service done with love and without ego — is the highest spiritual qualification. Guru Nanak taught that God is served through the service of His creation. The one who serves without expectation becomes one with the Guru.',
    durationMin: 9,
    tags: ['guru-angad', 'seva', 'successor', 'humility', 'guru-nanak', 'test'],
  },
  {
    id: 'sakhi-guru-tegh-bahadur-martyrdom',
    tradition: 'sikh',
    occasion: 'gurpurab',
    title: 'Guru Tegh Bahadur Ji — Hind Di Chadar',
    preview: 'When Kashmiri Pandits came to Guru Tegh Bahadur Ji weeping that the Mughal emperor Aurangzeb was forcing them to convert to Islam under threat of death, the Guru — knowing it would cost him his life — stood up for their freedom of faith. He was arrested in Delhi, tortured for days, and ultimately beheaded at Chandni Chowk rather than renounce his faith or allow another\'s religious persecution.',
    body: [
      'It was the year 1675. Aurangzeb, the Mughal emperor, had issued a decree that the Kashmiri Pandits — Hindus living in the Kashmir valley — must convert to Islam or face death. Thousands of Pandits were terrified, their temples destroyed, their sacred texts burned.',
      'A delegation of Kashmiri Pandits, led by Pandit Kirpa Ram, walked hundreds of miles to Anandpur Sahib to seek the help of Guru Tegh Bahadur Ji, the ninth Sikh Guru. They wept before him, describing their helpless situation.',
      'Guru Tegh Bahadur Ji listened with deep compassion. He knew that standing up for the Pandits would certainly lead to his own arrest and execution. His young son Gobind (who would become Guru Gobind Singh Ji) was present. The boy, sensing the gravity of the moment, said: "Father, who else is more worthy than you to make this sacrifice?"',
      'The Guru smiled and accepted the mission. He sent word to Aurangzeb: "If you can convert Guru Tegh Bahadur to Islam, then all Hindus will follow. Come — convert me first." He was immediately summoned to Delhi.',
      'In Delhi, the Guru and three of his devoted Sikhs were subjected to terrible torture for days, designed to break their will. One companion was sawn alive. Another was boiled in hot water. Another was burned alive. None renounced their faith. The Guru watched this with steadfast calm, praying and chanting Waheguru.',
      'On 24 November 1675, at Chandni Chowk in Delhi, Guru Tegh Bahadur Ji was publicly beheaded. He died protecting the religious freedom of those not even of his own faith — he was called "Hind Di Chadar" — the Shield of India. The place of his martyrdom is now the sacred Gurudwara Sis Ganj Sahib in Delhi.',
    ],
    phal: 'Guru Tegh Bahadur Ji\'s martyrdom teaches that religious freedom is a universal human right worth dying for. Remembering his sacrifice strengthens one\'s own resolve to live with integrity and courage. His Bani teaches: "Bhai kaahu ko det nahi, nahi bhai manat aan" — Fear no one, intimidate no one.',
    durationMin: 10,
    tags: ['guru-tegh-bahadur', 'martyrdom', 'courage', 'religious-freedom', 'hind-di-chadar'],
  },
  {
    id: 'sakhi-bhai-kanhaiya',
    tradition: 'sikh',
    occasion: 'general',
    title: 'Bhai Kanhaiya — Serving the Wounded Without Distinction',
    preview: 'During a fierce battle, Bhai Kanhaiya was observed moving across the battlefield giving water not only to wounded Sikh soldiers but also to wounded enemy soldiers. Sikh soldiers complained to Guru Gobind Singh Ji. When the Guru questioned Bhai Kanhaiya, his answer became one of the most profound declarations of human equality in Sikh history.',
    body: [
      'During the time of Guru Gobind Singh Ji, there were several fierce battles against Mughal and hill-king forces. In one such battle, Bhai Kanhaiya — a devoted Sikh who had taken a vow of service — moved across the battlefield with a water-skin, offering water and first aid to the wounded.',
      'Sikh soldiers watching him grew frustrated. They saw him offering water equally to their own wounded brothers and to the enemy soldiers who had just been fighting against them. Some soldiers complained to Guru Gobind Singh Ji: "Guru Ji, Bhai Kanhaiya is helping our enemies! He gives them water and relief — they may recover and fight us again!"',
      'Guru Gobind Singh Ji summoned Bhai Kanhaiya. In front of all the soldiers, He asked: "Bhai Kanhaiya, the Singhs say you are giving water to our enemies. Is this true?"',
      'Bhai Kanhaiya folded his hands and replied with complete calmness: "Yes, Guru Ji, it is true. But I did not see any enemies on the battlefield. I saw only the Guru\'s face in every wounded body. Where you are present, how can there be enemies? I saw only your form in everyone — friend and foe alike."',
      'Guru Gobind Singh Ji was deeply moved. He embraced Bhai Kanhaiya and said to the watching Sikhs: "Bhai Kanhaiya has truly understood my teachings. He has truly understood the Gurbani." The Guru then gave Bhai Kanhaiya ointments and medications and asked him to extend his service to full medical care of all wounded.',
      'Bhai Kanhaiya is considered the founder of the spirit of humanitarian aid in the Sikh tradition, and his service is seen as the precursor to the modern Red Cross philosophy — no distinction in the care of the wounded based on which side they fought on.',
    ],
    phal: 'True spirituality sees the Divine in every being without distinction of friend, foe, caste, or creed. The greatest form of worship is to serve the suffering selflessly. One who truly walks the Guru\'s path sees only the Guru\'s face everywhere.',
    durationMin: 8,
    tags: ['bhai-kanhaiya', 'seva', 'equality', 'humanitarian', 'guru-gobind-singh', 'battlefield'],
  },
];

// ─── Buddhist Dhamma Stories ──────────────────────────────────────────────────

export const BUDDHIST_STORIES: Katha[] = [
  {
    id: 'dhamma-angulimala',
    tradition: 'buddhist',
    occasion: 'vesak',
    title: 'Angulimala — From Murderer to Monk',
    preview: 'Angulimala was a fearsome bandit who had killed 999 people and wore their fingers as a garland around his neck — hence his name. The entire kingdom lived in terror of him. When the Buddha walked alone into the forest where Angulimala lurked, the king\'s army refused to follow. What happened next transformed one of history\'s most feared killers into one of the Buddha\'s most beloved disciples.',
    body: [
      'In the time of the Buddha, there lived in the forests of Kosala a terrifying bandit named Ahimsaka, who had been corrupted by a wicked teacher\'s advice into believing that he could attain spiritual power by killing one thousand people and collecting their fingers. He had already killed 999 people. The people called him Angulimala — "garland of fingers" — and lived in dread of him.',
      'King Pasenadi of Kosala was preparing to send his army to hunt down Angulimala. On that very morning, Angulimala\'s own mother set out to find her son in the forest. The Buddha, seeing with divine sight what was about to unfold, chose to enter the forest himself, without guards, without weapons.',
      'The countryside was deserted — no one dared walk those roads. When Angulimala spotted a lone monk walking calmly in his domain, he thought his thousandth victim had arrived. He ran toward the monk. But no matter how fast Angulimala ran, he could not catch up. The monk seemed to walk at a normal pace, yet remained ahead.',
      'Panting and bewildered, Angulimala shouted: "Stop, monk!" The Buddha replied with perfect peace: "I have stopped, Angulimala. You stop too." Angulimala was confused: "You are walking, yet you say you have stopped. What do you mean?"',
      'The Buddha said: "I have stopped causing harm to all beings. I have stopped with compassion for all beings. You — who harm others ceaselessly — you are the one who has not stopped." These words struck Angulimala like lightning. He was shaken to his core. The monk\'s fearlessness, compassion, and truth penetrated the armour of violence he had built around himself.',
      'Angulimala threw his weapons into a gorge and fell at the Buddha\'s feet, weeping. He was ordained as a monk. Though the people initially feared him, through years of meditation, compassionate service, and deep practice, Angulimala attained Nirvana. He became a symbol of the most profound Dhamma truth: no being is beyond redemption. Even the gravest sin can be transformed by the power of awakening.',
    ],
    phal: 'The story of Angulimala teaches that no one is beyond redemption and that violent impulses can be transformed through wisdom, compassion, and the power of a true spiritual encounter. The Buddha\'s fearlessness in the face of danger reveals the power of non-violence and love.',
    durationMin: 10,
    tags: ['angulimala', 'buddha', 'redemption', 'compassion', 'transformation', 'nirvana'],
  },
  {
    id: 'dhamma-kisa-gotami',
    tradition: 'buddhist',
    occasion: 'vesak',
    title: 'Kisa Gotami and the Mustard Seed',
    preview: 'Kisa Gotami\'s infant son died, and in her grief she refused to accept his death, carrying the dead child through the village asking for medicine to revive him. The Buddha told her to bring a handful of mustard seeds — but only from a house where no one had died. Her search through every household revealed the universal truth of impermanence, and her grief transformed into wisdom.',
    body: [
      'Kisa Gotami was a young woman in Savatthi who had been looked down upon in her husband\'s family for being thin and poor. The birth of her first son changed everything — she was finally accepted and loved. But when the child was about a year old, he suddenly fell ill and died.',
      'Kisa Gotami was inconsolable. In her state of grief-induced disbelief, she refused to accept her son was dead. She carried his little body through the village, going from door to door, asking: "Please give me medicine for my son." People who saw her whispered: "She has lost her mind."',
      'One wise elder directed her to the Buddha, who was staying nearby. She approached him, still carrying the dead child, and begged: "O Lord, give me medicine that will cure my son." The Buddha looked at her with infinite compassion and said: "Yes, I can help you. But first I need you to bring me a handful of mustard seeds — from a house where no one has ever died."',
      'Kisa Gotami\'s heart leapt with hope. Mustard seeds were common in every household. She went to the first house and asked: "Can you give me a handful of mustard seeds? I need them for medicine for my child." The family immediately offered the seeds. But then she remembered: "Has anyone died in this house?" The family answered sadly: "Yes, last year we lost our grandfather."',
      'She put the seeds down and went to the next house. And the next. And the next. In every single home — the rich and poor, the young and old — she found the same story. Someone had died. A child, a parent, a grandparent, a neighbor. No house was untouched by death.',
      'As the day wore on and she visited home after home, a great understanding began to dawn. By evening, Kisa Gotami had not found a single home free from death — and she understood. Death is not an aberration that visited her alone. It is the nature of all conditioned existence. She placed her son\'s body in the forest, returned to the Buddha, and asked to be taught the Dhamma. She became ordained and eventually attained Nirvana.',
    ],
    phal: 'The story of Kisa Gotami teaches the first and most important insight of the Dhamma — impermanence. All conditioned things end. Suffering is not a personal punishment but the universal condition of existence. Understanding this with wisdom — not just intellectually — is the beginning of liberation.',
    durationMin: 9,
    tags: ['kisa-gotami', 'buddha', 'impermanence', 'grief', 'wisdom', 'nirvana'],
  },
  {
    id: 'dhamma-uposatha-story',
    tradition: 'buddhist',
    occasion: 'uposatha',
    title: 'The Uposatha — The Day the King and the Monk Changed Places',
    preview: 'A powerful king who had lived in great luxury heard the Buddha teach on the power of Uposatha observance. He decided to spend one Uposatha day living as simply as a monk — sleeping on the floor, eating once, speaking only truthfully, and refraining from all entertainment. By midnight, he understood what his monks lived every day, and his entire relationship with his kingdom and his people was transformed.',
    body: [
      'King Pasenadi of Kosala was a great devotee of the Buddha. He would attend teachings regularly but always returned to his palace of silk cushions, abundant food, and royal pleasures. He heard the Buddha praise the value of Uposatha days — the new moon, full moon, and quarter moon days when monks intensified their practice and laypeople observed the Eight Precepts.',
      'One day, King Pasenadi approached the Buddha and said: "Lord, you speak of the Uposatha as transformative. But I am a king. Can a king truly benefit from this?" The Buddha replied: "The Uposatha is not only for monks. Its benefits depend on sincerity, not on robes. Even one day of genuine observance plants deep seeds of liberation."',
      'The king resolved to truly observe the Uposatha for one full day — from sunrise to the following dawn. He put on simple white garments, ate only once before noon, refused all entertainment, slept on a simple mat on the floor of a chamber, and observed complete silence except for truthful words. His ministers were bewildered.',
      'As the day progressed, the king felt increasingly uncomfortable — the hard floor, the single meal, the lack of distraction. But as he sat in meditation that evening, something unexpected happened. His mind, freed from its usual avalanche of sensory inputs and royal decisions, grew very still.',
      'In that stillness, he began to see his kingdom differently. He thought of the farmers who slept on mats not for one day but every day. He thought of the monks who lived this simply year-round, not as punishment but as freedom. He thought of the poor who never had even what he was voluntarily giving up for one day.',
      'By dawn, King Pasenadi emerged from his chamber with tears in his eyes. He told his queen: "I have learned more in this one day than in years of learning from others. Today I will begin a treasury for the poor that cannot be touched for any other purpose." The Uposatha had not just refined him — it had redirected his royal generosity.',
    ],
    phal: 'The Uposatha teaches that simplicity, restraint, and stillness — even for one day — open the mind to insights that the comfort and distraction of daily life obscure. The Eight Precepts, observed with sincerity, plant seeds of liberation that blossom slowly but surely.',
    durationMin: 8,
    tags: ['uposatha', 'buddha', 'precepts', 'king', 'simplicity', 'meditation'],
  },
];

// ─── Jain Kathas ─────────────────────────────────────────────────────────────

export const JAIN_KATHAS: Katha[] = [
  {
    id: 'jain-mahavira-birth',
    tradition: 'jain',
    occasion: 'paryushana',
    title: 'Mahavira Janma Kalyanak — The Birth of the Last Tirthankara',
    preview: 'Before the birth of Vardhamana — who would become Lord Mahavira, the 24th Tirthankara — his mother Queen Trishala had fourteen auspicious dreams in one night. The interpretation of these dreams revealed that she would give birth to either a great emperor or a great spiritual liberator. Vardhamana chose the path of renunciation and achieved Nirvana at age 72, establishing the foundations of Jain dharma.',
    body: [
      'In the city of Vaishali, in the royal household of King Siddhartha and Queen Trishala, a remarkable series of events preceded a remarkable birth. Queen Trishala had fourteen auspicious dreams in a single night — a white elephant, a white lion, the goddess Lakshmi, a garland of flowers, the full moon, the blazing sun, a golden flag, a golden vessel, a lake of lotuses, an ocean of milk, a celestial abode, a great gem-set throne, and the god Indra.',
      'The royal astrologers and interpreters of dreams were summoned. They studied the dreams carefully and declared with certainty: "O Queen, the soul who has entered your womb is no ordinary being. These fourteen dreams indicate either a Chakravarti — the most powerful emperor of all continents — or a Tirthankara — a ford-maker, one who builds a bridge across the ocean of suffering for all souls."',
      'Vardhamana was born on the 13th day of the bright half of Chaitra. The gods and divine beings celebrated his birth throughout the three worlds. Even in childhood, Vardhamana displayed extraordinary equanimity, fearlessness, and compassion. He would not allow even an ant to be harmed near him.',
      'At the age of thirty, Vardhamana renounced his royal life — his palace, his wife Yashoda, his daughter Priyadarshana — and took the path of complete renunciation. He gave away all his possessions, pulled out his hair by the roots (rather than using a razor), and took the vow of ahimsa (non-violence) in its most absolute form.',
      'For twelve years and six months, Mahavira wandered without shelter, without cooking his own food, maintaining complete silence for long periods, enduring heat, cold, insects, and the ridicule of villagers — all with complete equanimity. He achieved Keval-jnana — omniscience — under a Sala tree by the banks of the river Rijupalika.',
      'For thirty years after his enlightenment, Mahavira taught the Jain dharma to all who would listen — king and servant, monk and householder, man and woman. His five great vows — ahimsa, satya, asteya, brahmacharya, aparigraha — became the foundation of Jain practice. He attained Nirvana at Pavapuri at the age of 72.',
    ],
    phal: 'Contemplating the life of Mahavira — his renunciation, his supreme non-violence, and his achievement of omniscience — inspires the soul to reduce its own attachments, practice ahimsa in thought, word, and deed, and progress on the path of liberation.',
    durationMin: 10,
    tags: ['mahavira', 'tirthankara', 'ahimsa', 'birth', 'paryushana', 'liberation'],
  },
  {
    id: 'jain-sthulibhadra',
    tradition: 'jain',
    occasion: 'paryushana',
    title: 'Sthulibhadra — The Courtesan\'s Disciple',
    preview: 'Sthulibhadra was the son of a minister of King Nanda\'s court and a man of considerable ability and worldly pleasures. He was deeply attached to the beautiful courtesan Kosha. When he suddenly renounced his worldly life and became a Jain monk, Kosha was devastated. What followed — her tests of his detachment and his perfect equanimity — became one of the most celebrated stories of spiritual steadfastness in the Jain tradition.',
    body: [
      'Sthulibhadra was the brilliant son of Shakdala, the chief minister of King Nanda of Pataliputra. He was wealthy, charming, and deeply attached to a beautiful courtesan named Kosha. He spent months at a time in her company, and their bond was one of genuine mutual affection.',
      'One day, Sthulibhadra witnessed a religious discourse by a Jain acharya. Something in the teaching pierced him deeply — perhaps the teaching on the fleeting nature of attachment and the permanence of the soul\'s liberation. In a single transformative moment, he resolved to renounce the world and become a Jain monk.',
      'He did not return to Kosha\'s house. He took diksha — monastic initiation — and began the rigorous life of a Jain muni. Kosha, when she heard, was shattered. She could not believe the transformation. She tried every way to see him.',
      'Some time later, Sthulibhadra\'s guru sent him to spend the Paryushana — the monsoon retreat — at Kosha\'s home, as a test of his equanimity. Kosha arranged everything beautifully, wearing her finest jewels and garments, filling the room with fragrance, and trying every art of attraction she possessed.',
      'Sthulibhadra sat in meditation, completely undisturbed. Kosha\'s beauty, which had once made him abandon sleep and food, now passed before his eyes like clouds across an empty sky. He maintained his practice, his equanimity, and his vows perfectly throughout the four months.',
      'On the final day, Kosha, in genuine wonder and growing reverence, asked: "How? How are you not moved? How did you achieve this?" Sthulibhadra said: "I did not destroy my capacity to see beauty — I transformed it. I see your beauty as the beauty of the soul striving for liberation. It does not disturb me; it inspires me." Kosha ultimately became his disciple and took her own path of renunciation.',
    ],
    phal: 'The story of Sthulibhadra teaches that genuine renunciation is not suppression of feeling but transformation of attachment. The monk who passed every test of detachment while in the midst of the world\'s greatest temptations is the model for how practice — not avoidance — builds true equanimity.',
    durationMin: 9,
    tags: ['sthulibhadra', 'renunciation', 'detachment', 'paryushana', 'equanimity', 'jain'],
  },
];

// ─── Master library ───────────────────────────────────────────────────────────

export const ALL_KATHAS: Katha[] = [
  ...HINDU_KATHAS,
  ...SIKH_SAKHIS,
  ...BUDDHIST_STORIES,
  ...JAIN_KATHAS,
];

/** Get kathas for a specific tradition */
export function getKathasByTradition(tradition: KathaTradition): Katha[] {
  return ALL_KATHAS.filter(k => k.tradition === tradition);
}

/** Get kathas for a specific occasion */
export function getKathasByOccasion(occasion: KathaOccasion): Katha[] {
  return ALL_KATHAS.filter(k => k.occasion === occasion);
}

/** Get the month-aware Ekadashi katha (1-indexed month) */
export function getEkadashiKatha(monthNumber: number): Katha | null {
  // Check for exact month match first
  const exact = HINDU_KATHAS.find(
    k => k.occasion === 'ekadashi' && k.ekadashiMonth === monthNumber
  );
  if (exact) return exact;
  // Fallback to general Ekadashi katha
  return HINDU_KATHAS.find(k => k.occasion === 'ekadashi') ?? null;
}

/** Get a katha by ID */
export function getKathaById(id: string): Katha | null {
  return ALL_KATHAS.find(k => k.id === id) ?? null;
}

/** Get kathas related to a vrat */
export function getKathasForVrat(vratId: string): Katha[] {
  const occasionMap: Record<string, KathaOccasion> = {
    ekadashi: 'ekadashi',
    purnima: 'purnima',
    amavasya: 'amavasya',
    pradosh: 'pradosh',
    chaturthi: 'chaturthi',
    shivaratri: 'shivaratri',
    puranmashi: 'gurpurab',
    uposatha: 'uposatha',
  };
  const occasion = occasionMap[vratId];
  if (!occasion) return [];
  return getKathasByOccasion(occasion);
}
