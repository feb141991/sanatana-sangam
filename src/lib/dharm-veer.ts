/**
 * Shoonaya — Dharm Veer
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Handcrafted stories of forgotten and underappreciated heroes of Dharma.
 * Covers all four traditions — Hindu, Sikh, Buddhist, Jain — with genuine
 * depth: real trials, real sacrifice, real wisdom.
 *
 * A new hero surfaces on the home card every day via getDharmVeerOfTheDay().
 * ─────────────────────────────────────────────────────────────────────────────
 */

export interface DharmVeer {
  id: string;
  name: string;
  nameLocal?: string; 
  era: string;
  eraLocal?: string;
  tradition: 'hindu' | 'sikh' | 'buddhist' | 'jain';
  region: string;
  regionLocal?: string;
  emoji: string;
  tagline: string;
  taglineLocal?: string;
  /** 2–3 paragraph account of their life and mission */
  journey: string;
  journeyLocal?: string;
  /** The defining test, sacrifice, or trial they endured */
  trial: string;
  trialLocal?: string;
  /** Their core teaching in plain language */
  teaching: string;
  teachingLocal?: string;
  /** The moral for a modern seeker */
  moral: string;
  moralLocal?: string;
  quote?: {
    text: string;
    attribution: string;
  };
  quoteLocal?: {
    text: string;
    attribution: string;
  };
}

export const DHARM_VEERS: DharmVeer[] = [

  // ── 1. Sri Krishna (Hindu) ────────────────────────────────────────────────
  {
    id: 'sri-krishna',
    name: 'Sri Krishna',
    nameLocal: 'श्री कृष्ण',
    era: 'Dwapar Yuga',
    eraLocal: 'द्वापर युग',
    tradition: 'hindu',
    region: 'Mathura/Dwarka',
    regionLocal: 'मथुरा / द्वारका',
    emoji: '🦚',
    tagline: 'The Master of Yoga who performed his duty without attachment, teaching the world the essence of Dharma.',
    taglineLocal: 'योगेश्वर जिन्होंने अनासक्त होकर अपना कर्तव्य निभाया और संसार को धर्म का सार सिखाया।',
    journey:
      `Krishna was born in a prison cell in Mathura, destined to end the tyranny of Kansa. His childhood in Gokul and Vrindavan was filled with divine play, but his life was a continuous series of duties. From protecting the people from Indra's wrath with the Govardhan hill to serving as the strategic heart of the Pandavas, Krishna embodied the 'Lila' — the divine play that masks a profound commitment to cosmic order.

He stood as the charioteer to Arjuna, not as a king, but as a guide. In the midst of the greatest battlefield of the era, Kurukshetra, he delivered the Bhagavad Gita, the ultimate manual for human existence. His life ended not in a palace, but in a quiet forest, accepting the curse of Gandhari and the end of his own Yadava lineage with the same equanimity he taught Arjuna.`,
    journeyLocal:
      `श्री कृष्ण का जन्म मथुरा के कारागार में हुआ था। उनका जीवन कर्तव्यों की एक अटूट श्रृंखला था। उन्होंने गोवर्धन पर्वत उठाकर गोकुलवासियों की रक्षा की और पांडवों के मार्गदर्शक बने। कुरुक्षेत्र के युद्ध के बीच उन्होंने भगवद्गीता का उपदेश दिया, जो मानव अस्तित्व का सबसे बड़ा ग्रंथ है। उन्होंने गांधारी के शाप और अपने ही यादव वंश के अंत को उसी समत्व भाव से स्वीकार किया जो उन्होंने अर्जुन को सिखाया था।`,
    trial:
      `His greatest trial was not the battlefield, but the silence between the words of the Gita. He had to convince a broken Arjuna to fight his own kin for the sake of a higher Dharma. He bore the weight of the war's destruction and the eventual ruin of his own family without ever losing his divine smile, proving that true power lies in detached action.`,
    trialLocal:
      `उनकी सबसे बड़ी परीक्षा कुरुक्षेत्र का मैदान नहीं, बल्कि गीता के शब्दों के बीच का मौन था। उन्हें एक टूटे हुए अर्जुन को धर्म की रक्षा के लिए अपनों के ही विरुद्ध युद्ध के लिए प्रेरित करना था। उन्होंने युद्ध के विनाश और अपने परिवार के अंत का बोझ बिना अपनी मुस्कान खोए उठाया।`,
    teaching:
      'Focus on your duty alone, never on the fruits of your actions. Be established in Yoga and perform your work with a balanced mind.',
    teachingLocal: 'केवल अपने कर्तव्य पर ध्यान केंद्रित करें, कर्म के फलों पर नहीं। योग में स्थित होकर संतुलित मन से कार्य करें।',
    moral:
      'Detachment is not the absence of love; it is the presence of a love so large it does not need to own the outcome.',
    moralLocal: 'अनासक्ति प्रेम की अनुपस्थिति नहीं है; यह एक ऐसे प्रेम की उपस्थिति है जो परिणाम पर अधिकार नहीं चाहता।',
    quote: {
      text: 'Karmanye vadhikaraste ma phaleshu kadachana.',
      attribution: 'You have a right to perform your prescribed duties, but you are not entitled to the fruits of your actions. — Bhagavad Gita',
    },
    quoteLocal: {
      text: 'कर्मण्येवाधिकारस्ते मा फलेषु कदाचन।',
      attribution: 'श्री कृष्ण (भगवद्गीता)',
    },
  },

  // ── 2. Sri Rama (Hindu) ───────────────────────────────────────────────────
  {
    id: 'sri-rama',
    name: 'Sri Rama',
    nameLocal: 'श्री राम',
    era: 'Treta Yuga',
    eraLocal: 'त्रेता युग',
    tradition: 'hindu',
    region: 'Ayodhya',
    regionLocal: 'अयोध्या',
    emoji: '🏹',
    tagline: 'The Maryada Purushottama who sacrificed his throne and his happiness to uphold the word of Dharma.',
    taglineLocal: 'मर्यादा पुरुषोत्तम जिन्होंने धर्म की रक्षा के लिए अपने सिंहासन और व्यक्तिगत सुख का त्याग किया।',
    journey:
      `Rama, the eldest son of King Dasharatha, was the ideal prince. On the eve of his coronation, he was exiled to the forest for fourteen years due to a promise his father made to his stepmother Kaikeyi. Without a single word of protest, he traded his royal robes for bark and left Ayodhya.

His journey through the forest was a test of character. When his wife Sita was abducted by Ravana, he did not call for the armies of Ayodhya, but built an alliance with the Vanaras. He defeated the most powerful king of the age, Ravana, not for territory, but to restore Sita and the order of Dharma. His reign, Ram Rajya, became the eternal benchmark for just governance.`,
    journeyLocal:
      `राजा दशरथ के ज्येष्ठ पुत्र राम एक आदर्श राजकुमार थे। अपने राज्याभिषेक की पूर्व संध्या पर, उन्हें चौदह वर्ष के वनवास पर जाना पड़ा। उन्होंने बिना किसी विरोध के अपने राजसी वस्त्र त्याग दिए। जब रावण ने माता सीता का अपहरण किया, तो उन्होंने अयोध्या की सेना नहीं बुलाई, बल्कि वानर सेना के साथ गठबंधन किया। उन्होंने धर्म की पुनः स्थापना के लिए रावण को पराजित किया। उनका शासन 'राम राज्य' सुशासन का शाश्वत मानक बन गया।`,
    trial:
      `Rama's trial was the constant conflict between personal love and public duty. From accepting exile to fulfill his father's word, to the agonizing decision to ask Sita to prove her purity for the sake of his subjects' faith, Rama lived a life of total self-correction. He proved that a leader must be the first to sacrifice for the principles they represent.`,
    trialLocal:
      `श्री राम की परीक्षा व्यक्तिगत प्रेम और सार्वजनिक कर्तव्य के बीच का निरंतर संघर्ष था। पिता के वचन के लिए वनवास स्वीकार करने से लेकर प्रजा के विश्वास के लिए सीता के त्याग तक, राम का जीवन पूर्ण आत्म-सुधार का जीवन था।`,
    teaching:
      'Dharma is not a set of rules; it is the alignment of one’s conduct with the truth, even at the cost of personal ruin.',
    teachingLocal: 'धर्म नियमों का समूह नहीं है; यह सत्य के साथ अपने आचरण का संरेखण है, चाहे इसकी कीमत व्यक्तिगत विनाश ही क्यों न हो।',
    moral:
      'Integrity is doing the right thing when everyone is looking, and also when no one is looking. Rama’s path was the path of the uncompromising vow.',
    moralLocal: 'अखंडता तब सही कार्य करना है जब सब देख रहे हों, और तब भी जब कोई न देख रहा हो।',
    quote: {
      text: 'Raghukul reet sada chali aayi, pran jaaye par vachan na jaayi.',
      attribution: 'The tradition of the Raghus has always been: let life be lost, but never a promise. — Ramcharitmanas',
    },
    quoteLocal: {
      text: 'रघुकुल रीत सदा चलि आई, प्राण जाइ पर वचन न जाई।',
      attribution: 'गोस्वामी तुलसीदास (रामचरितमानस)',
    },
  },

  // ── 3. Arjuna (Hindu) ─────────────────────────────────────────────────────
  {
    id: 'arjuna',
    name: 'Arjuna',
    nameLocal: 'अर्जुन',
    era: 'Dwapar Yuga',
    eraLocal: 'द्वापर युग',
    tradition: 'hindu',
    region: 'Indraprastha',
    regionLocal: 'इंद्रप्रस्थ',
    emoji: '🏹',
    tagline: 'The world\'s greatest archer who learned that the hardest battle is not against an enemy, but against one\'s own doubt.',
    taglineLocal: 'विश्व के महानतम धनुर्धर जिन्होंने सीखा कि सबसे कठिन युद्ध शत्रु के विरुद्ध नहीं, बल्कि अपने संदेह के विरुद्ध है।',
    journey:
      `Arjuna, the third Pandava, was the master of the Gandiva bow. He spent his life in rigorous training, seeking excellence in every breath. Yet, at the peak of his power, on the field of Kurukshetra, he collapsed. Seeing his teachers and kinsmen on the opposing side, his bow slipped from his hands and his mind whirled in grief.

Through the Gita, he was rebuilt. He learned that he was not the doer, but an instrument of the divine. He fought the Mahabharata war not out of hatred, but as a sacrifice to restore balance. His life is the ultimate template for the seeker: transitioning from the anxiety of personal ego to the clarity of divine purpose.`,
    journeyLocal:
      `पांडु पुत्र अर्जुन गांडीव के स्वामी थे। उन्होंने अपना जीवन कठिन प्रशिक्षण में बिताया। लेकिन कुरुक्षेत्र के मैदान में वे टूट गए। अपनों को सामने देख उनके हाथ से धनुष गिर गया। गीता के माध्यम से उनका पुनर्निर्माण हुआ। उन्होंने सीखा कि वे कर्ता नहीं, बल्कि ईश्वर के उपकरण हैं। उनका जीवन साधक के लिए एक उदाहरण है: व्यक्तिगत अहंकार से दैवीय उद्देश्य की स्पष्टता तक का सफर।`,
    trial:
      `The trial of Arjuna was 'Vishada' — the profound sorrow and confusion that strikes just before a great breakthrough. He had to face the moral complexity of war and the pain of loss before he could achieve the state of 'Sthitaprajna' (steady wisdom).`,
    trialLocal:
      `अर्जुन की परीक्षा 'विषाद' थी — वह गहरा दुख और भ्रम जो एक बड़ी सफलता से ठीक पहले आता है। उन्हें 'स्थितप्रज्ञ' बनने से पहले युद्ध की नैतिक जटिलता का सामना करना पड़ा।`,
    teaching:
      'Surrender the ego to the higher self. When you act as an instrument of Dharma, you are free from the stain of sin.',
    teachingLocal: 'अहंकार को उच्च स्व के प्रति समर्पित करें। जब आप धर्म के उपकरण के रूप में कार्य करते हैं, तो आप पाप के दाग से मुक्त होते हैं।',
    moral:
      'Skill is important, but focus and faith are what make skill effective. Arjuna’s single-mindedness was his greatest weapon.',
    moralLocal: 'कौशल महत्वपूर्ण है, लेकिन एकाग्रता और विश्वास ही कौशल को प्रभावी बनाते हैं।',
    quote: {
      text: 'Nasto mohah smritir labdha...',
      attribution: 'My delusion is gone; I have regained my memory through your grace. — Arjuna to Krishna, Bhagavad Gita',
    },
    quoteLocal: {
      text: 'नष्टो मोहः स्मृतिर्लब्धा त्वत्प्रसादान्मयाच्युत।',
      attribution: 'अर्जुन (भगवद्गीता)',
    },
  },

  // ── 4. Karna (Hindu) ──────────────────────────────────────────────────────
  {
    id: 'karna',
    name: 'Karna',
    nameLocal: 'कर्ण',
    era: 'Dwapar Yuga',
    eraLocal: 'द्वापर युग',
    tradition: 'hindu',
    region: 'Anga Desh',
    regionLocal: 'अंग देश',
    emoji: '☀️',
    tagline: 'The tragic hero of the Mahabharata who gave away his life-saving armor to uphold his vow of charity.',
    taglineLocal: 'महाभारत के वे नायक जिन्होंने अपनी दानवीरता के संकल्प को निभाने के लिए अपने जीवन रक्षक कवच का दान कर दिया।',
    journey:
      `Karna was born to Kunti and the Sun God, but abandoned at birth. Raised by a charioteer, he faced humiliation at every step due to his perceived low caste. Despite his genius in archery, he was denied entry into royal competitions. His life was a struggle for recognition, which led him to align with Duryodhana, who gave him the dignity he was denied.

Karna was the 'Danaveera' — the heroic giver. Even when he knew the war was lost, even when he knew his brothers were on the other side, he did not abandon his friend. His loyalty and his legendary charity defined him more than his prowess in battle.`,
    journeyLocal:
      `कर्ण का जन्म कुंती और सूर्य देव से हुआ था, लेकिन जन्म के समय ही उन्हें त्याग दिया गया था। एक सारथी द्वारा पाले जाने के कारण, उन्हें हर कदम पर अपमान का सामना करना पड़ा। महान धनुर्धर होने के बावजूद उन्हें शाही प्रतियोगिताओं से वंचित रखा गया। उनका जीवन पहचान के लिए एक संघर्ष था। वे 'दानवीर' थे। जब वे जानते थे कि युद्ध हार चुके हैं, तब भी उन्होंने अपने मित्र दुर्योधन का साथ नहीं छोड़ा।`,
    trial:
      `His trial was the ultimate sacrifice: giving away his Kavacha and Kundala (divine armor) to Indra, who came disguised as a beggar, knowing full well it meant his death on the battlefield. He chose his word and his character over his survival.`,
    trialLocal:
      `उनकी परीक्षा उनका सर्वोच्च बलिदान था: इंद्र को अपना कवच और कुंडल दान कर देना, यह जानते हुए भी कि इसका अर्थ युद्ध के मैदान में उनकी मृत्यु है। उन्होंने अपने जीवन से ऊपर अपने वचन को चुना।`,
    teaching:
      'Generosity is the greatest strength. A person is defined not by their birth, but by their conduct and their willingness to give.',
    teachingLocal: 'उदारता ही सबसे बड़ी शक्ति है। व्यक्ति अपने जन्म से नहीं, बल्कि अपने आचरण और देने की इच्छा से परिभाषित होता।',
    moral:
      'Karna’s life reminds us that loyalty and charity are virtues, but when aligned with the wrong cause, they lead to a tragic end. Yet, his dignity remains untarnished.',
    moralLocal: 'कर्ण का जीवन हमें याद दिलाता है कि दान और निष्ठा महान गुण हैं, लेकिन उनकी गरिमा कभी कम नहीं हुई।',
    quote: {
      text: 'I will give whatever is asked of me, for I am Karna.',
      attribution: 'Karna to Indra',
    },
    quoteLocal: {
      text: 'मुझसे जो माँगा जाएगा वह मैं दूँगा, क्योंकि मैं कर्ण हूँ।',
      attribution: 'दानवीर कर्ण',
    },
  },

  // ── 5. Guru Nanak Dev Ji (Sikh) ────────────────────────────────────────────
  {
    id: 'guru-nanak',
    name: 'Guru Nanak Dev Ji',
    nameLocal: 'ਗੁਰੂ ਨਾਨਕ ਦੇਵ ਜੀ',
    era: '1469–1539 CE',
    eraLocal: '1469–1539 ਈਸਵੀ',
    tradition: 'sikh',
    region: 'Talwandi (Nankana Sahib)',
    regionLocal: 'ਨਨਕਾਣਾ ਸਾਹਿਬ',
    emoji: '☬',
    tagline: 'The founder of Sikhi who walked thousands of miles to preach the oneness of humanity.',
    taglineLocal: 'ਸਿੱਖੀ ਦੇ ਸੰਸਥਾਪਕ ਜਿਨ੍ਹਾਂ ਨੇ ਮਨੁੱਖਤਾ ਦੀ ਏਕਤਾ ਦਾ ਪ੍ਰਚਾਰ ਕਰਨ ਲਈ ਹਜ਼ਾਰਾਂ ਮੀਲ ਦਾ ਸਫਰ ਤੈਅ ਕੀਤਾ।',
    journey:
      `Guru Nanak was born in a world divided by caste and creed. From childhood, he was a seeker of the one true light. After disappearing into the river Bein for three days, he emerged with the revolutionary message: "There is no Hindu, there is no Muslim." He spent his life in four great journeys (Udasis), travelling to Mecca, Tibet, and across India.

He established the practice of 'Langar' (community kitchen) where kings and paupers sat together on the floor to eat. He taught that one can find God while living a householder's life, through 'Kirat Karo' (honest work), 'Vand Chakko' (sharing), and 'Naam Japo' (meditating on the Name).`,
    journeyLocal:
      `ਗੁਰੂ ਨਾਨਕ ਦੇਵ ਜੀ ਦਾ ਜਨਮ ਜਾਤ-ਪਾਤ ਵਿੱਚ ਵੰਡੀ ਹੋਈ ਦੁਨੀਆ ਵਿੱਚ ਹੋਇਆ ਸੀ। ਵੇਈਂ ਨਦੀ ਵਿੱਚ ਤਿੰਨ ਦਿਨ ਅਲੋਪ ਰਹਿਣ ਤੋਂ ਬਾਅਦ, ਉਹ ਇਸ ਕ੍ਰਾਂਤੀਕਾਰੀ ਸੰਦੇਸ਼ ਨਾਲ ਬਾਹਰ ਆਏ: "ਨਾ ਕੋ ਹਿੰਦੂ ਨਾ ਕੋ ਮੁਸਲਮਾਨ।" ਉਨ੍ਹਾਂ ਨੇ ਮੱਕਾ, ਤਿਬੱਤ ਅਤੇ ਪੂਰੇ ਭਾਰਤ ਦੀਆਂ ਚਾਰ ਉਦਾਸੀਆਂ ਕੀਤੀਆਂ। ਉਨ੍ਹਾਂ ਨੇ ਲੰਗਰ ਦੀ ਪ੍ਰਥਾ ਸ਼ੁਰੂ ਕੀਤੀ ਜਿੱਥੇ ਰਾਜਾ ਅਤੇ ਰੰਕ ਇਕੱਠੇ ਬੈਠ ਕੇ ਭੋਜਨ ਕਰਦੇ ਸਨ।`,
    trial:
      `His trial was facing the arrogance of the religious establishment of his time. Whether it was pointing out the hypocrisy of rituals at Haridwar or challenging the tyrannical rule of Babur, Nanak spoke truth to power with a gentle but unshakable resolve.`,
    trialLocal:
      `ਉਨ੍ਹਾਂ ਦਾ ਇਮਤਿਹਾਨ ਉਸ ਸਮੇਂ ਦੇ ਧਾਰਮਿਕ ਅਦਾਰਿਆਂ ਦੇ ਹੰਕਾਰ ਦਾ ਸਾਹਮਣਾ ਕਰਨਾ ਸੀ। ਹਰਿਦੁਆਰ ਵਿਖੇ ਕਰਮਕਾਂਡਾਂ ਦੇ ਪਾਖੰਡ ਨੂੰ ਉਜਾਗਰ ਕਰਨਾ ਹੋਵੇ ਜਾਂ ਬਾਬਰ ਦੇ ਜ਼ੁਲਮ ਨੂੰ ਚੁਣੌਤੀ ਦੇਣੀ ਹੋਵੇ, ਨਾਨਕ ਨੇ ਨਿਮਰਤਾ ਪਰ ਦ੍ਰਿੜਤਾ ਨਾਲ ਸੱਚ ਬੋਲਿਆ।`,
    teaching:
      'Truth is higher than everything, but higher still is truthful living.',
    teachingLocal: 'ਸੱਚ ਸਭ ਤੋਂ ਉੱਚਾ ਹੈ, ਪਰ ਸੱਚਾ ਆਚਰਣ ਸਭ ਤੋਂ ਉੱਚਾ ਹੈ।',
    moral:
      'Nanak showed that spiritual greatness is found in the simple acts of service and the recognition of the divine light in every soul.',
    moralLocal: 'ਨਾਨਕ ਨੇ ਦਿਖਾਇਆ ਕਿ ਅਧਿਆਤਮਿਕ ਮਹਾਨਤਾ ਸੇਵਾ ਦੇ ਸਾਧਾਰਨ ਕੰਮਾਂ ਵਿੱਚ ਮਿਲਦੀ ਹੈ।',
    quote: {
      text: 'Ek Onkar Satnam...',
      attribution: 'There is only one God, Truth is His Name. — Guru Nanak, Mool Mantar',
    },
    quoteLocal: {
      text: 'ੴ ਸਤਿਨਾਮੁ ਕਰਤਾ ਪੁਰਖੁ ਨਿਰਭਉ ਨਿਰਵੈਰੁ ਅਕਾਲ ਮੂਰਤਿ ਅਜੂਨੀ ਸੈਭੰ ਗੁਰ ਪ੍ਰਸਾਦਿ ॥',
      attribution: 'ਗੁਰੂ ਨਾਨਕ ਦੇਵ ਜੀ',
    },
  },

  // ── 6. Adi Shankaracharya ─────────────────────────────────────────────────
  {
    id: 'adi-shankaracharya',
    name: 'Adi Shankaracharya',
    nameLocal: 'आदि शंकराचार्य',
    era: '788–820 CE',
    eraLocal: '७८८–८२० ईस्वी',
    tradition: 'hindu',
    region: 'Kalady, Kerala',
    regionLocal: 'कालड़ी, केरल',
    emoji: '🕉️',
    tagline: 'He walked the length of India at 16 and rebuilt an entire civilisation of thought.',
    taglineLocal: '१६ वर्ष की आयु में पूरे भारत की पदयात्रा कर उन्होंने भारतीय दर्शन को पुनर्जीवित किया।',
    journey:
      `Shankara was born in a small Kerala village, lost his father at three, and by eight had memorised the four Vedas. His mother refused to let him take sannyasa — renouncing the world — but a crocodile seized his leg while he bathed in the river. He called out to her: let me die a monk or die a householder's son. She relented. The crocodile released him.

At sixteen, Shankara walked barefoot from Kerala to Varanasi, then Badrinath, then Bengal, then Kashmir — the full spine of the subcontinent. Everywhere he went he challenged scholars in public debate. The tradition of Mimamsa, which held that ritual alone was religion, had dominated Indian thought for centuries. Shankara argued instead for Advaita Vedanta: that the deepest identity of every human being is not the body, not the mind, but Brahman itself — pure consciousness, undivided and immortal.

In thirty-two years of life he wrote 300 texts including commentaries on the Brahmasutras, the principal Upanishads, and the Bhagavad Gita. He founded four mathas — monasteries at the four cardinal points of India — that still stand today as centres of Vedantic learning. He died at thirty-two.`,
    journeyLocal:
      `शंकर का जन्म केरल के एक छोटे से गाँव में हुआ था। आठ वर्ष की आयु तक उन्होंने चारों वेदों को कंठस्थ कर लिया था। सोलह वर्ष की आयु में, शंकर केरल से वाराणसी, फिर बद्रीनाथ, बंगाल और कश्मीर तक — पूरे उपमहाद्वीप की नंगे पैर यात्रा की। उन्होंने अद्वैत वेदांत का प्रचार किया: कि हर मनुष्य की गहरी पहचान शरीर या मन नहीं, बल्कि ब्रह्म (शुद्ध चेतना) है। बत्तीस वर्ष के अल्पायु में उन्होंने भारत के चार कोनों में चार मठों की स्थापना की।`,
    trial:
      `His most famous debate was with Mandana Mishra, the greatest Mimamsa scholar of the age. Mishra's wife, Ubhaya Bharati, served as judge. After Shankara won, she challenged him to a second debate — this time on the subject of conjugal love, which he as a lifelong celibate could not know. Shankara paused for a month, temporarily entered the body of a deceased king to gain that knowledge, and returned to complete the debate. He won. But the real trial was never the debate — it was the willingness to remain unknown, to die at thirty-two having poured everything into a world that may not listen for centuries.`,
    trialLocal:
      `उनका सबसे प्रसिद्ध शास्त्रार्थ उस समय के महान विद्वान मंडन मिश्र के साथ हुआ था। लेकिन असली परीक्षा केवल शास्त्रार्थ नहीं थी — बल्कि बत्तीस वर्ष की आयु में अपना सब कुछ उस दुनिया के लिए न्यौछावर कर देना था जो शायद सदियों तक उनकी बात न सुने।`,
    teaching:
      'You are not the body that will die, not the mind that doubts, not the identity that seeks approval. You are Brahman. The one who knows this is liberated — not after death, but right now.',
    teachingLocal: 'आप वह शरीर नहीं हैं जो मर जाएगा, वह मन नहीं हैं जो संदेह करता है। आप ब्रह्म हैं। जो इसे जानता है वह अभी मुक्त है।',
    moral:
      'The most radical act is to live from your deepest identity rather than your anxious surface self. Shankara did not fight the darkness. He simply kept turning on the light.',
    moralLocal: 'सबसे क्रांतिकारी कार्य अपनी गहरी पहचान से जीना है। शंकराचार्य ने अंधेरे से लड़ाई नहीं की, उन्होंने बस प्रकाश जलाए रखा।',
    quote: {
      text: 'Brahma satyam jagan mithya, jivo brahmaiva naparah.',
      attribution: 'Brahman alone is real; the world is appearance; the individual soul is none other than Brahman. — Vivekachudamani',
    },
    quoteLocal: {
      text: 'ब्रह्म सत्यं जगन्मिथ्या, जीवो ब्रह्मैव नापरः।',
      attribution: 'आदि शंकराचार्य',
    },
  },

// ── 7. Guru Teg Bahadur (Sikh) ────────────────────────────────────────────
  {
    id: 'guru-teg-bahadur',
    name: 'Guru Teg Bahadur',
    nameLocal: 'ਗੁਰੂ ਤੇਗ ਬਹਾਦਰ',
    era: '1621–1675 CE',
    eraLocal: '1621–1675 ਈਸਵੀ',
    tradition: 'sikh',
    region: 'Amritsar, Punjab',
    regionLocal: 'ਅੰਮ੍ਰਿਤਸਰ, ਪੰਜਾਬ',
    emoji: '☬',
    tagline: 'He laid down his life not for his own faith, but to protect the religious freedom of Hindus.',
    taglineLocal: 'ਉਨ੍ਹਾਂ ਨੇ ਆਪਣੇ ਧਰਮ ਲਈ ਨਹੀਂ, ਸਗੋਂ ਹਿੰਦੂਆਂ ਦੀ ਧਾਰਮਿਕ ਆਜ਼ਾਦੀ ਦੀ ਰੱਖਿਆ ਲਈ ਆਪਣੀ ਜਾਨ ਕੁਰਬਾਨ ਕਰ ਦਿੱਤੀ।',
    journey:
      'Teg Bahadur was the ninth Sikh Guru, a man of deep contemplation who spent years in solitary meditation before accepting the Guruship. He was known as Teg Bahadur — brave of sword — but his courage was first inward. He wrote extraordinary banis filled with the teaching of equanimity: fear nothing, covet nothing, be still in both joy and sorrow.\n\nIn 1675, the Mughal Emperor Aurangzeb launched a systematic campaign to convert Kashmiri Pandits to Islam by force. Thousands of Brahmins sent a delegation to Anandpur Sahib, weeping before the Guru. His son, nine-year-old Gobind Rai — who would become Guru Gobind Singh — saw his father\'s face and asked: who is great enough to stop this? Teg Bahadur replied: only a great person can give this sacrifice. The boy said: then who is greater than you?\n\nTeg Bahadur went to Delhi and presented himself to Aurangzeb. He was arrested, imprisoned for months, and given three choices: perform a miracle, convert to Islam, or die. He refused all three. Before killing him, the Mughals beheaded his companions first, in front of him, trying to break his will. It did not break.',
    journeyLocal:
      'ਗੁਰੂ ਤੇਗ ਬਹਾਦਰ ਜੀ ਨੌਵੇਂ ਸਿੱਖ ਗੁਰੂ ਸਨ। 1675 ਵਿੱਚ, ਜਦੋਂ ਔਰੰਗਜ਼ੇਬ ਨੇ ਕਸ਼ਮੀਰੀ ਪੰਡਤਾਂ ਨੂੰ ਜ਼ਬਰਦਸਤੀ ਮੁਸਲਮਾਨ ਬਣਾਉਣਾ ਸ਼ੁਰੂ ਕੀਤਾ, ਤਾਂ ਪੰਡਤਾਂ ਨੇ ਗੁਰੂ ਜੀ ਤੋਂ ਮਦਦ ਮੰਗੀ। ਗੁਰੂ ਜੀ ਨੇ ਹਿੰਦੂ ਧਰਮ ਦੀ ਰੱਖਿਆ ਲਈ ਦਿੱਲੀ ਜਾ ਕੇ ਕੁਰਬਾਨੀ ਦਿੱਤੀ। ਉਨ੍ਹਾਂ ਨੂੰ ਤਿੰਨ ਵਿਕਲਪ ਦਿੱਤੇ ਗਏ: ਕਰਾਮਾਤ ਦਿਖਾਓ, ਇਸਲਾਮ ਕਬੂਲ ਕਰੋ ਜਾਂ ਮੌਤ। ਉਨ੍ਹਾਂ ਨੇ ਸ਼ਹਾਦਤ ਨੂੰ ਚੁਣਿਆ।',
    trial:
      'Before his execution, Aurangzeb had Bhai Mati Das sawed in half while still alive. Bhai Dyala Das was boiled in a cauldron. Bhai Sati Das was burned alive — all in front of Guru Teg Bahadur, to make him recant. He watched each of his beloved companions die and did not move. He was beheaded in Chandni Chowk, Delhi, on 11 November 1675. He gave his head; he did not give his mind.',
    trialLocal:
      'ਉਨ੍ਹਾਂ ਦੀ ਸ਼ਹਾਦਤ ਤੋਂ ਪਹਿਲਾਂ, ਉਨ੍ਹਾਂ ਦੇ ਸਾਥੀਆਂ ਭਾਈ ਮਤੀ ਦਾਸ, ਭਾਈ ਦਿਆਲਾ ਜੀ ਅਤੇ ਭਾਈ ਸਤੀ ਦਾਸ ਜੀ ਨੂੰ ਬਹੁਤ ਤਸੀਹੇ ਦੇ ਕੇ ਸ਼ਹੀਦ ਕੀਤਾ ਗਿਆ। ਗੁਰੂ ਜੀ ਨੇ ਇਹ ਸਭ ਕੁਝ ਆਪਣੀਆਂ ਅੱਖਾਂ ਸਾਹਮਣੇ ਵੇਖਿਆ ਪਰ ਡੋਲੇ ਨਹੀਂ। ਉਨ੍ਹਾਂ ਨੇ ਸੀਸ ਦਿੱਤਾ ਪਰ ਸਿਰੜ ਨਹੀਂ ਛੱਡਿਆ।',
    teaching:
      'The Guru\'s last act was not for Sikhism. It was for the right of every human being to walk their own spiritual path without coercion. He called it Hind di Chadar — the shield of India.',
    teachingLocal: 'ਗੁਰੂ ਜੀ ਨੇ ਹਰ ਇਨਸਾਨ ਦੀ ਧਾਰਮਿਕ ਆਜ਼ਾਦੀ ਦੇ ਹੱਕ ਲਈ ਆਪਣੀ ਜਾਨ ਦਿੱਤੀ। ਉਨ੍ਹਾਂ ਨੂੰ "ਹਿੰਦ ਦੀ ਚਾਦਰ" ਕਿਹਾ ਜਾਂਦਾ ਹੈ।',
    moral:
      'Real courage is not the absence of fear. It is remaining human — remaining soft and principled — in conditions designed to make you hard and compliant.',
    moralLocal: "ਅਸਲੀ ਦਲੇਰੀ ਡਰ ਦੀ ਅਣਹੋਂਦ ਨਹੀਂ ਹੈ, ਬਲਕਿ ਮੁਸ਼ਕਲ ਹਾਲਾਤਾਂ ਵਿੱਚ ਵੀ ਆਪਣੇ ਅਸੂਲਾਂ 'ਤੇ ਕਾਇਮ ਰਹਿਣਾ ਹੈ।",
    quote: {
      text: 'Bhau kahu ko det neh, neh bhau manat aan.',
      attribution: 'Fear no one and frighten no one. — Guru Teg Bahadur, Sri Guru Granth Sahib',
    },
    quoteLocal: {
      text: 'ਭੈ ਕਾਹੂ ਕਉ ਦੇਤ ਨਹਿ ਨਹਿ ਭੈ ਮਾਨਤ ਆਨ ॥',
      attribution: 'ਗੁਰੂ ਤੇਗ ਬਹਾਦਰ ਜੀ',
    },
  },

  // ── 8. Mahavira (Jain) ────────────────────────────────────────────────────
  {
    id: 'mahavira-trials',
    name: 'Mahavira',
    nameLocal: 'भगवान महावीर',
    era: '599–527 BCE',
    eraLocal: '५९९–५२७ ईसा पूर्व',
    tradition: 'jain',
    region: 'Vaishali, Bihar',
    regionLocal: 'वैशाली, बिहार',
    emoji: '🤲',
    tagline: 'A prince who walked naked for 12.5 years, enduring everything without a sound.',
    taglineLocal: 'एक राजकुमार जिन्होंने १२.५ वर्षों तक मौन रहकर कठिन तपस्या की।',
    journey:
      `Vardhamana was born a prince of Vaishali, the son of a Kshatriya chief. He renounced everything — his silk robes, his palace, his family — and walked out with a single cloth. After thirteen months even that cloth tore off. For the next eleven years he wandered naked, fasting for days or weeks, maintaining complete silence.

After 12.5 years of this, he attained Kevala Jnana — omniscience, complete liberation. He spent the next thirty years teaching the world about Ahimsa, Anekantvada, and Aparigraha.`,
    journeyLocal:
      `वर्धमान वैशाली के एक राजकुमार थे। ३० वर्ष की आयु में उन्होंने सब कुछ त्याग दिया। अगले साढ़े बारह वर्षों तक वे नग्न अवस्था में रहे, मौन धारण किया और बिना किसी आश्रय के यात्रा की। उन्होंने अहिंसा का कठोर पालन किया। ऋजुपालिका नदी के तट पर उन्हें केवल ज्ञान प्राप्त हुआ।`,
    trial:
      `The most documented trial came in the village of Chammari, where cowherds pushed wooden spikes through his ears. He did not react, did not speak, did not leave. This is a story about what absolute commitment to non-retaliation looks like.`,
    trialLocal:
      `उनकी सबसे बड़ी परीक्षा चामरी गाँव में हुई, जहाँ लोगों ने उनके कानों में खूँटियाँ ठोंक दीं। लेकिन महावीर मौन रहे, उन्होंने कोई प्रतिक्रिया नहीं दी। यह कहानी प्रतिशोध न लेने के अटूट संकल्प की है।`,
    teaching:
      'Ahimsa is not an attitude. It is a practice, maintained breath by breath, even when the world is hostile.',
    teachingLocal: 'अहिंसा केवल एक दृष्टिकोण नहीं है, यह एक अभ्यास है।',
    moral:
      'Violence poisons the one who commits it. Every living being has a soul deserving protection.',
    moralLocal: 'अहिंसा का सिद्धांत आधुनिक समय के लिए अत्यंत महत्वपूर्ण है।',
    quote: {
      text: 'All living beings desire to live. To them life is dear.',
      attribution: 'Mahavira, Acharanga Sutra',
    },
    quoteLocal: {
      text: 'सभी जीवित प्राणी जीना चाहते हैं। उन्हें जीवन प्रिय है।',
      attribution: 'भगवान महावीर',
    },
  },

  // ── 9. Siddhartha Gautama (Buddhist) ──────────────────────────────────────
  {
    id: 'buddha',
    name: 'Siddhartha Gautama',
    nameLocal: 'सिद्धार्थ गौतम (बुद्ध)',
    era: '563–483 BCE',
    eraLocal: '५६३–४८३ ईसा पूर्व',
    tradition: 'buddhist',
    region: 'Lumbini/Bodh Gaya',
    regionLocal: 'लुम्बिनी / बोधगया',
    emoji: '☸️',
    tagline: 'The Awakened One who found the Middle Path between indulgence and self-mortification.',
    taglineLocal: 'बुद्ध जिन्होंने भोग-विलास और कठोर तप के बीच मध्यम मार्ग की खोज की।',
    journey:
      `Prince Siddhartha had everything a human could desire. Yet, seeing old age, sickness, and death, he walked away from his palace in the middle of the night. He spent years in extreme asceticism until his body was a skeleton, realizing that starving the body does not feed the soul.

He sat under a Bodhi tree and vowed not to rise until he found the cause of suffering. He became the Buddha. He taught the Four Noble Truths and the Eightfold Path, emphasizing that peace is found not in rituals, but in the mastery of the mind.`,
    journeyLocal:
      `राजकुमार सिद्धार्थ के पास सब कुछ था, फिर भी बुढ़ापे, बीमारी और मृत्यु को देखकर उन्होंने आधी रात को महल त्याग दिया। वर्षों की कठोर तपस्या के बाद उन्होंने महसूस किया कि शरीर को भूखा रखने से आत्मा का पोषण नहीं होता। उन्होंने बोधगया में बोधि वृक्ष के नीचे तपस्या की और 'बुद्ध' बने। उन्होंने चार आर्य सत्य और अष्टांगिक मार्ग का उपदेश दिया।`,
    trial:
      `His trial was the 'Battle of Mara' — the inner demons of desire, doubt, and fear that tried to shake his focus as he sat for enlightenment. He touched the earth to witness his right to be there, defeating the ego completely.`,
    trialLocal:
      `उनकी परीक्षा 'मार' (आंतरिक राक्षसों) के साथ युद्ध था — वासना, संदेह और भय के उन विचारों से लड़ना जिन्होंने उन्हें विचलित करने की कोशिश की। उन्होंने अपनी एकाग्रता से अहंकार को पूरी तरह पराजित किया।`,
    teaching:
      'The root of all suffering is attachment. Walk the Middle Path and practice mindfulness in every breath.',
    teachingLocal: 'सभी दुखों की जड़ आसक्ति है। मध्यम मार्ग पर चलें और हर सांस में सचेत रहें।',
    moral:
      'Truth is not found in extremes. Balance and inner stillness are the keys to liberation.',
    moralLocal: 'सत्य अतियों में नहीं मिलता। संतुलन और आंतरिक स्थिरता ही मुक्ति की कुंजी है।',
    quote: {
      text: 'Appo Deepo Bhava.',
      attribution: 'Be a light unto yourself. — The Buddha',
    },
    quoteLocal: {
      text: 'अप्प दीपो भव।',
      attribution: 'गौतम बुद्ध',
    },
  },

  // ── 10. Swami Vivekananda (Hindu) ──────────────────────────────────────────
  {
    id: 'vivekananda',
    name: 'Swami Vivekananda',
    nameLocal: 'स्वामी विवेकानंद',
    era: '1863–1902 CE',
    eraLocal: '१८६३–१९०२ ईस्वी',
    tradition: 'hindu',
    region: 'Calcutta (Kolkata), Bengal',
    regionLocal: 'कोलकाता, बंगाल',
    emoji: '🔥',
    tagline: 'A 30-year-old monk who walked into the World\'s Parliament of Religions and changed the world.',
    taglineLocal: 'शिकागो के धर्म संसद में उनके एक भाषण ने पूरी दुनिया का भारत के प्रति नजरिया बदल दिया।',
    journey:
      `Narendra Nath Datta was a brilliant young man in Calcutta who asked one question: have you seen God? Ramakrishna Paramahamsa answered: Yes. 

Vivekananda walked the length of India alone, seeing the poverty and the spiritual genius of his country. In 1893, he spoke at Chicago. His opening "Sisters and brothers of America" gave him a two-minute standing ovation. He brought Vedanta to the modern West and died at thirty-nine, having compressed centuries of work into a few years.`,
    journeyLocal:
      `नरेंद्र नाथ दत्त कोलकाता के एक प्रतिभाशाली युवक थे। उन्होंने अकेले पूरे भारत की यात्रा की और १८९३ में शिकागो में भाषण दिया। उनके संबोधन "अमेरिका के भाइयों और बहनों" ने सबका दिल जीत लिया। उन्होंने केवल ३९ वर्ष के जीवन में युगों का कार्य किया।`,
    trial:
      `Before Chicago, he was stranded with no money, sleeping in a freight yard. He wondered if his mission was over. He knocked on one more door.`,
    trialLocal:
      `शिकागो जाने से पहले, विवेकानंद बोस्टन के माल गोदामों में सोए थे। उनके पास पैसे नहीं थे, लेकिन उन्होंने हार नहीं मानी।`,
    teaching:
      'Each soul is potentially divine. Manifest this divinity within.',
    teachingLocal: 'प्रत्येक आत्मा संभावित रूप से दिव्य है। इस दिव्यता को प्रकट करें।',
    moral:
      'Arise, awake, and stop not till the goal is reached.',
    moralLocal: 'उठो, जागो और तब तक मत रुको जब तक लक्ष्य प्राप्त न हो जाए।',
    quote: {
      text: 'Arise, awake, and stop not till the goal is reached.',
      attribution: 'Swami Vivekananda',
    },
    quoteLocal: {
      text: 'उठो, जागो और तब तक मत रुको जब तक लक्ष्य प्राप्त न हो जाए।',
      attribution: 'स्वामी विवेकानंद',
    },
  },

  // ── 11. Chanakya (Hindu) ──────────────────────────────────────────────────
  {
    id: 'chanakya',
    name: 'Chanakya',
    nameLocal: 'आचार्य चाणक्य',
    era: '350–283 BCE',
    eraLocal: '३५०–२८३ ईसा पूर्व',
    tradition: 'hindu',
    region: 'Takshashila',
    regionLocal: 'तक्षशिला',
    emoji: '🦅',
    tagline: 'He left his topknot untied until he destroyed an empire and built a new India.',
    taglineLocal: 'नंद साम्राज्य के विनाश तक उन्होंने अपनी शिखा नहीं बांधी और एक नए भारत का निर्माण किया।',
    journey:
      `Vishnugupta Chanakya was a professor at Takshashila. Insulted by King Dhanananda, he swore to destroy the Nanda dynasty. He trained an orphan boy, Chandragupta, and built the Maurya Empire, the first to unify India. He wrote the Arthashastra, a masterpiece on statecraft, and then walked away when his work was done.`,
    journeyLocal:
      `चाणक्य तक्षशिला के महान आचार्य थे। धनानंद द्वारा अपमानित होने पर उन्होंने अपनी शिखा खोल दी। उन्होंने चंद्रगुप्त मौर्य को प्रशिक्षित किया और अखंड भारत की नींव रखी। उन्होंने अर्थशास्त्र जैसा महान ग्रंथ लिखा।`,
    trial:
      `His trial was the question of power. He had absolute power and chose to leave it, living in a small hut outside the palace.`,
    trialLocal:
      `उनकी असली परीक्षा सत्ता का मोह छोड़ना था। उन्होंने सत्ता का उपयोग जनकल्याण के लिए किया, निजी लाभ के लिए नहीं।`,
    teaching:
      'Power used for flourishing, then relinquished, is the only kind that does not corrupt.',
    teachingLocal: 'सत्ता का उपयोग लोक कल्याण के लिए होना चाहिए।',
    moral:
      'Intentionality and a long-term vow are rarer than genius.',
    moralLocal: 'संकल्प के बिना किया गया कार्य व्यर्थ है।',
    quote: {
      text: 'Before you start work, ask: Why? Results? Success?',
      attribution: 'Chanakya, Arthashastra',
    },
    quoteLocal: {
      text: 'कार्य शुरू करने से पहले स्वयं से तीन प्रश्न पूछें: क्यों? परिणाम? सफलता?',
      attribution: 'आचार्य चाणक्य',
    },
  },

  // ── 12. Banda Singh Bahadur (Sikh) ────────────────────────────────────────
  {
    id: 'banda-singh-bahadur',
    name: 'Banda Singh Bahadur',
    nameLocal: 'ਬੰਦਾ ਸਿੰਘ ਬਹਾਦਰ',
    era: '1670–1716 CE',
    eraLocal: '1670–1716 ਈਸਵੀ',
    tradition: 'sikh',
    region: 'Rajouri, Kashmir',
    regionLocal: 'ਰਾਜੌਰੀ, ਕਸ਼ਮੀਰ',
    emoji: '⚔️',
    tagline: 'A hermit turned warrior who abolished feudal slavery in Punjab in 1710.',
    taglineLocal: 'ਇੱਕ ਤਪੱਸਵੀ ਤੋਂ ਯੋਧਾ ਬਣੇ, ਜਿਨ੍ਹਾਂ ਨੇ 1710 ਵਿੱਚ ਪੰਜਾਬ ਵਿੱਚ ਜਗੀਰਦਾਰੀ ਗੁਲਾਮੀ ਦਾ ਅੰਤ ਕੀਤਾ।',
    journey:
      'Madho Das was a hermit who became the "Banda" (slave) of Guru Gobind Singh. He dismantled the Mughal feudal structure and gave land ownership to the farmers for the first time in history.',
    journeyLocal:
      'ਮਾਧੋ ਦਾਸ ਇੱਕ ਤਪੱਸਵੀ ਸੀ ਜਿਸਨੂੰ ਗੁਰੂ ਗੋਬਿੰਦ ਸਿੰਘ ਜੀ ਨੇ "ਬੰਦਾ ਸਿੰਘ ਬਹਾਦਰ" ਬਣਾਇਆ। ਉਸਨੇ ਪੰਜਾਬ ਵਿੱਚ ਜਗੀਰਦਾਰੀ ਪ੍ਰਥਾ ਨੂੰ ਖਤਮ ਕੀਤਾ ਅਤੇ ਕਿਸਾਨਾਂ ਨੂੰ ਜ਼ਮੀਨ ਦੇ ਮਾਲਕ ਬਣਾਇਆ।',
    trial:
      'He was executed brutally in Delhi, refusing to convert even as his infant son was executed in his lap. He did not recant.',
    trialLocal:
      'ਦਿੱਲੀ ਵਿੱਚ ਉਨ੍ਹਾਂ ਦੇ ਸਾਹਮਣੇ ਉਨ੍ਹਾਂ ਦੇ ਬੇਟੇ ਦਾ ਕਤਲ ਕਰ ਦਿੱਤਾ ਗਿਆ, ਪਰ ਉਨ੍ਹਾਂ ਨੇ ਧਰਮ ਨਹੀਂ ਛੱਡਿਆ।',
    teaching:
      'Dharma is justice for the powerless.',
    teachingLocal: 'ਧਰਮ ਇਨਸਾਫ਼ ਹੈ — ਮਜ਼ਦੂਰ ਲਈ ਅਤੇ ਉਸ ਲਈ ਜਿਸ ਕੋਲ ਕੋਈ ਸ਼ਕਤੀ ਨਹੀਂ ਹੈ।',
    moral:
      'Turn spiritual power into service.',
    moralLocal: 'ਆਪਣੀ ਅਧਿਆਤਮਿਕ ਸ਼ਕਤੀ ਨੂੰ ਸੇਵਾ ਵਿੱਚ ਬਦਲੋ।',
    quote: {
      text: 'I have received the five arrows of the Guru.',
      attribution: 'Banda Singh Bahadur',
    },
    quoteLocal: {
      text: 'ਮੈਨੂੰ ਗੁਰੂ ਦੇ ਪੰਜ ਤੀਰ ਮਿਲੇ ਹਨ।',
      attribution: 'ਬੰਦਾ ਸਿੰਘ ਬਹਾਦਰ',
    },
  },

  // ... (additional heroes could continue here, but these are the prioritized ones)
];

// ── Tradition Metadata ─────────────────────────────────────────────────────

export const TRADITION_META: Record<string, { label: string; labelLocal: string; dharmVeerLocal: string; emoji: string; color: string }> = {
  hindu:    { label: 'Sanatan Dharma', labelLocal: 'सनातन धर्म', dharmVeerLocal: 'धर्म वीर', emoji: '🕉️', color: 'rgba(255, 120, 0, 0.12)' },
  sikh:     { label: 'Sikhi',          labelLocal: 'ਸਿੱਖੀ',     dharmVeerLocal: 'ਧਰਮ ਵੀਰ', emoji: '☬', color: 'rgba(0, 100, 255, 0.12)' },
  buddhist: { label: 'Buddha Dhamma',  labelLocal: 'बुद्ध धम्म', dharmVeerLocal: 'धर्म वीर', emoji: '☸️', color: 'rgba(255, 200, 0, 0.12)' },
  jain:     { label: 'Jain Dharma',    labelLocal: 'जैन धर्म',   dharmVeerLocal: 'धर्म वीर', emoji: '🤲', color: 'rgba(0, 200, 50, 0.12)' },
};

// ── Rotation logic ─────────────────────────────────────────────────────────

/**
 * Returns the Dharm Veer for today. Changes every calendar day.
 * Tradition-aware: shuffles same-tradition heroes higher in the rotation.
 */
export function getDharmVeerOfTheDay(userTradition?: string | null): DharmVeer {
  const epoch = new Date('2024-01-01').getTime();
  const now   = new Date();
  // Use spiritual date (midnight IST offset) so it changes consistently
  const ist   = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
  const dayN  = Math.floor((ist.getTime() - epoch) / (1000 * 60 * 60 * 24));
  const slot  = dayN; // one hero per day

  if (!userTradition) {
    return DHARM_VEERS[slot % DHARM_VEERS.length];
  }

  // Build a weighted pool: same-tradition heroes appear twice
  const same  = DHARM_VEERS.filter(h => h.tradition === userTradition);
  
  // If user has a tradition, strictly cycle through their own heroes
  if (same.length > 0) {
    return same[slot % same.length];
  }

  return DHARM_VEERS[slot % DHARM_VEERS.length];
}
