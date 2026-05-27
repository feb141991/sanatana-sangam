export const DAILY_FALLBACK_QUIZ: Record<string, Record<string, {
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
  fact: string;
  source: string;
}[]>> = {
  en: {
    hindu: [
      {
        question: 'Which Upanishad contains the mahavakya "Tat Tvam Asi"?',
        options: ['Chandogya Upanishad', 'Kena Upanishad', 'Mundaka Upanishad', 'Isha Upanishad'],
        answerIndex: 0,
        explanation: 'The mahavakya "Tat Tvam Asi" appears in the Chandogya Upanishad as part of the teaching of Uddalaka to Shvetaketu.',
        fact: 'Different Vedanta schools interpret this mahavakya differently.',
        source: 'Chandogya Upanishad 6.8.7',
      },
      {
        question: 'Which avatar of Vishnu is associated with rescuing the Earth goddess Bhudevi from the cosmic ocean?',
        options: ['Varaha', 'Kurma', 'Matsya', 'Narasimha'],
        answerIndex: 0,
        explanation: 'The boar avatar, Varaha, rescued Earth (Bhudevi) from the demon Hiranyaksha who had dragged her to the bottom of the cosmic ocean.',
        fact: 'A famous monolithic sculpture of Varaha resides in the Udayagiri Caves in Madhya Pradesh.',
        source: 'Bhagavata Purana',
      },
      {
        question: 'In the Bhagavad Gita, which of the following is described as the Yoga of Devotion?',
        options: ['Bhakti Yoga', 'Jnana Yoga', 'Karma Yoga', 'Raja Yoga'],
        answerIndex: 0,
        explanation: 'Chapter 12 of the Bhagavad Gita is titled Bhakti Yoga and is dedicated entirely to the path of devotion to the divine.',
        fact: 'The Gita consists of 18 chapters and 700 verses in total.',
        source: 'Bhagavad Gita, Chapter 12',
      },
      {
        question: 'Which festival celebrates the descent of the sacred river Ganga from heaven to Earth?',
        options: ['Ganga Dussehra', 'Makar Sankranti', 'Chhath Puja', 'Karthigai Deepam'],
        answerIndex: 0,
        explanation: 'Ganga Dussehra marks the day the river Ganga descended to Earth through the locks of Lord Shiva\'s hair.',
        fact: 'King Bhagiratha performed intense penance for thousands of years to bring Ganga down to purify his ancestors\' souls.',
        source: 'Shiva Purana',
      },
      {
        question: 'In which Indian state is the ancient shore temple of Mahabalipuram located?',
        options: ['Tamil Nadu', 'Kerala', 'Karnataka', 'Andhra Pradesh'],
        answerIndex: 0,
        explanation: 'The Shore Temple of Mahabalipuram was built in the 8th century CE under the Pallava dynasty and is located in Tamil Nadu.',
        fact: 'It is recognized as a UNESCO World Heritage Site and represents early stone temple architecture.',
        source: 'Indian Temple Architecture',
      }
    ],
    sikh: [
      {
        question: 'Who compiled the Adi Granth, which later became Guru Granth Sahib Ji?',
        options: ['Guru Arjan Dev Ji', 'Guru Gobind Singh Ji', 'Guru Ram Das Ji', 'Guru Tegh Bahadur Ji'],
        answerIndex: 0,
        explanation: 'Guru Arjan Dev Ji compiled the Adi Granth in 1604 and installed it at Harmandir Sahib.',
        fact: 'The scripture includes compositions of Bhagats from diverse backgrounds.',
        source: 'Sikh tradition',
      },
      {
        question: 'Which morning prayer, composed by Guru Nanak Dev Ji, constitutes the opening section of the Guru Granth Sahib?',
        options: ['Japji Sahib', 'Jaap Sahib', 'Sukhmani Sahib', 'Rehras Sahib'],
        answerIndex: 0,
        explanation: 'Japji Sahib is the primordial morning prayer composed by Guru Nanak Dev Ji that stands at the very beginning of the Sikh holy scripture.',
        fact: 'It begins with the Mool Mantar, which defines the core theological tenets of Sikhism.',
        source: 'Sikh Scripture',
      },
      {
        question: 'Which historical Gurdwara marks the place where Guru Gobind Singh Ji compiled the final full version of the Guru Granth Sahib?',
        options: ['Gurdwara Damdama Sahib', 'Gurdwara Patna Sahib', 'Gurdwara Bangla Sahib', 'Gurdwara Hemkund Sahib'],
        answerIndex: 0,
        explanation: 'Guru Gobind Singh Ji spent several months at Damdama Sahib compiling the final, complete version of the Adi Granth in 1705-1706.',
        fact: 'Damdama Sahib is recognized as one of the five spiritual seats (Takhts) of authority in Sikhism.',
        source: 'Sikh History',
      },
      {
        question: 'Which Sikh festival commemorates the creation of the Khalsa panth in 1699 by Guru Gobind Singh Ji?',
        options: ['Vaisakhi', 'Hola Mohalla', 'Gurpurab', 'Bandi Chhor Divas'],
        answerIndex: 0,
        explanation: 'Vaisakhi in 1699 was the day Guru Gobind Singh Ji initiated the Panj Pyare and established the Khalsa order at Anandpur Sahib.',
        fact: 'The Khalsa was established to uphold justice, equality, and protection for the oppressed.',
        source: 'Sikh Tradition',
      },
      {
        question: 'What is the literal meaning of the foundational Sikh concept of "Vand Chhako"?',
        options: ['Share what you earn with others', 'Meditate on the divine name', 'Earn an honest living', 'Sing hymns in congregation'],
        answerIndex: 0,
        explanation: '"Vand Chhako" is one of the three pillars of Sikhism taught by Guru Nanak, instructing devotees to share their earnings and food with the community.',
        fact: 'The other two pillars are Naam Japna (meditating on God) and Kirat Karni (honest labor).',
        source: 'Sikh Ethics',
      }
    ],
    buddhist: [
      {
        question: 'Which teaching is grouped as the first sermon traditionally delivered by the Buddha at Sarnath?',
        options: ['The Four Noble Truths', 'The Five Precepts', 'The Brahmaviharas', 'The Ten Paramitas'],
        answerIndex: 0,
        explanation: 'The Buddha’s first sermon at Sarnath is traditionally associated with the Four Noble Truths and the Middle Way.',
        fact: 'This discourse is commonly referred to as the Dhammacakkappavattana Sutta.',
        source: 'Buddhist tradition',
      },
      {
        question: 'Which Buddhist concept refers to the foundational doctrine of "dependent origination" or interconnectedness?',
        options: ['Pratityasamutpada', 'Anicca', 'Sunyata', 'Dukkha'],
        answerIndex: 0,
        explanation: 'Pratityasamutpada states that all phenomena arise in dependence upon multiple causes and conditions.',
        fact: 'It is visually represented in the outer ring of the Bhavachakra (Wheel of Life).',
        source: 'Buddhist Philosophy',
      },
      {
        question: 'In which section of the Tripitaka are the philosophical and psychological teachings of early Buddhism compiled?',
        options: ['Abhidharma Pitaka', 'Sutta Pitaka', 'Vinaya Pitaka', 'Jataka Pitaka'],
        answerIndex: 0,
        explanation: 'The Abhidharma Pitaka contains systematic and philosophical treatises analyzing the nature of mind, matter, and reality.',
        fact: 'Tripitaka literally translates to "Three Baskets" in Pali and Sanskrit.',
        source: 'Tripitaka',
      },
      {
        question: 'Near which ancient river bank did Siddhartha Gautama attain supreme enlightenment under the Bodhi tree?',
        options: ['Niranjana River', 'Ganga River', 'Yamuna River', 'Sarasvati River'],
        answerIndex: 0,
        explanation: 'Siddhartha Gautama attained enlightenment near the banks of the Niranjana River (now Lilajan River) in Bodh Gaya, Bihar.',
        fact: 'Bodh Gaya is the most sacred pilgrimage site for Buddhists worldwide.',
        source: 'Buddhist Lore',
      },
      {
        question: 'Which Bodhisattva is celebrated as the embodiment of infinite compassion in Mahayana Buddhism?',
        options: ['Avalokiteshvara', 'Manjushri', 'Vajrapani', 'Maitreya'],
        answerIndex: 0,
        explanation: 'Avalokiteshvara represents the compassion of all Buddhas and is known in China as Guanyin and Japan as Kannon.',
        fact: 'The Dalai Lama is traditionally considered by Tibetan Buddhists to be an incarnation of Avalokiteshvara.',
        source: 'Mahayana Sutras',
      }
    ],
    jain: [
      {
        question: 'Which principle is most centrally associated with Jain ethical life?',
        options: ['Ahimsa', 'Yajna', 'Bhakti', 'Rajadharma'],
        answerIndex: 0,
        explanation: 'Ahimsa, or non-violence, is the central ethical principle in Jain dharma.',
        fact: 'Jain practice extends non-violence with unusual rigor.',
        source: 'Jain tradition',
      },
      {
        question: 'Which Jain doctrine states that truth and reality are complex and have multiple viewpoints?',
        options: ['Anekantavada', 'Syadvada', 'Aparigraha', 'Asteya'],
        answerIndex: 0,
        explanation: 'Anekantavada is the core Jain doctrine of non-absolutism, asserting that no single viewpoint contains the complete, absolute truth.',
        fact: 'It is famously illustrated by the parable of the blind men and the elephant.',
        source: 'Jain Philosophy',
      },
      {
        question: 'Who was the 23rd Tirthankara of Jainism, who lived a few centuries before Mahavira?',
        options: ['Parshvanatha', 'Rishabhanatha', 'Neminatha', 'Shantinatha'],
        answerIndex: 0,
        explanation: 'Parshvanatha is widely recognized by historians as an actual historical figure and the 23rd spiritual teacher (Tirthankara) of Jainism.',
        fact: 'His symbol is the serpent, and he is highly revered for his teachings on non-violence and truth.',
        source: 'Jain Historical Records',
      },
      {
        question: 'What is the name of the most important annual holy festival celebrated by Jains for reflection, fasting, and seeking forgiveness?',
        options: ['Paryushana', 'Mahavir Janma Kalyanak', 'Diwali', 'Gyana Panchami'],
        answerIndex: 0,
        explanation: 'Paryushana (or Das Lakshana) is the premier festival where Jains practice intensive self-purification, fasting, and ask for forgiveness using the phrase "Micchami Dukkadam".',
        fact: 'The festival lasts for eight days for Shvetambaras and ten days for Digambaras.',
        source: 'Jain Rituals',
      },
      {
        question: 'On which sacred hill did the 24th Tirthankara, Mahavira, deliver his first sermon after attaining omniscience?',
        options: ['Vipulachala Hill', 'Shatrunjaya Hill', 'Girnar Hill', 'Sammed Shikharji'],
        answerIndex: 0,
        explanation: 'According to Jain tradition, Mahavira delivered his first sermon (Divya Dhwani) on Vipulachala Hill in Rajgir, Bihar.',
        fact: 'Rajgir remains a prominent Jain pilgrimage destination.',
        source: 'Jain Scripture',
      }
    ],
    all: [
      {
        question: 'Which river is widely revered across multiple Indian traditions as sacred?',
        options: ['Ganga', 'Thames', 'Volga', 'Danube'],
        answerIndex: 0,
        explanation: 'The Ganga holds sacred status across Hindu traditions and is culturally significant in India.',
        fact: 'Cities like Varanasi, Haridwar, and Prayagraj are deeply tied to the Ganga.',
        source: 'Indian sacred geography',
      },
      {
        question: 'Which Sanskrit word refers to the universal moral order and ethical duty shared by Hinduism, Buddhism, and Jainism?',
        options: ['Dharma', 'Karma', 'Samsara', 'Moksha'],
        answerIndex: 0,
        explanation: 'Dharma (or Dhamma in Pali) represents the cosmic law, moral order, and righteous duty that forms the foundation of all Dharmic religions.',
        fact: 'The Dharmachakra (Wheel of Dharma) is a shared symbol of these traditions, representing the flow of moral law.',
        source: 'Dharmic Traditions',
      },
      {
        question: 'Which ancient city, serving as a prominent spiritual center for Hinduism, Buddhism, and Jainism, is located near the confluence of the Ganga and Varuna rivers?',
        options: ['Varanasi', 'Ayodhya', 'Mathura', 'Ujjain'],
        answerIndex: 0,
        explanation: 'Varanasi is sacred to Hindus (as Shiva\'s city), Buddhists (where Buddha first preached at nearby Sarnath), and Jains (birthplace of several Tirthankaras).',
        fact: 'Varanasi is widely considered one of the oldest continuously inhabited cities in the world.',
        source: 'Indian Sacred Sites',
      },
      {
        question: 'Which celestial event is celebrated across various traditions with bathing rituals at Prayagraj, Haridwar, Nashik, and Ujjain?',
        options: ['Kumbh Mela', 'Maha Shivaratri', 'Buddha Purnima', 'Guru Nanak Gurpurab'],
        answerIndex: 0,
        explanation: 'The Kumbh Mela is the largest peaceful gathering of pilgrims in the world, cycling through four sacred locations over a twelve-year period.',
        fact: 'It was inscribed on the UNESCO Representative List of the Intangible Cultural Heritage of Humanity.',
        source: 'Sacred Festivals',
      },
      {
        question: 'The symbol "Om" or "Aum" is a sacred monosyllable shared across many traditions. In which ancient texts was its spiritual essence first elaborated?',
        options: ['Upanishads', 'Agamas', 'Tipitaka', 'Guru Granth Sahib'],
        answerIndex: 0,
        explanation: 'The philosophical meaning of Om was first deeply analyzed in the Upanishads, particularly the Mandukya Upanishad.',
        fact: 'Om represents the ultimate reality (Brahman) and the universe\'s primordial sound.',
        source: 'Upanishads',
      }
    ],
  },
  hi: {
    hindu: [
      {
        question: 'किस उपनिषद में महावाक्य "तत् त्वम असि" (Tat Tvam Asi) मिलता है?',
        options: ['छान्दोग्य उपनिषद', 'केन उपनिषद', 'मुण्डक उपनिषद', 'ईश उपनिषद'],
        answerIndex: 0,
        explanation: '"तत् त्वम असि" महावाक्य छान्दोग्य उपनिषद में उद्दालक द्वारा श्वेतकेतु को दिए गए उपदेश का हिस्सा है।',
        fact: 'वेदांत के विभिन्न संप्रदाय इस महावाक्य की अलग-अलग व्याख्या करते हैं।',
        source: 'छान्दोग्य उपनिषद 6.8.7',
      },
      {
        question: 'विष्णु के किस अवतार को पृथ्वी देवी (भूदेवी) को ब्रह्मांडीय महासागर से बचाने के लिए जाना जाता है?',
        options: ['वराह', 'कूर्म', 'मत्स्य', 'नृसिंह'],
        answerIndex: 0,
        explanation: 'वराह अवतार ने पृथ्वी देवी को हिरण्याक्ष राक्षस से बचाकर ब्रह्मांडीय सागर से बाहर निकाला था।',
        fact: 'उदयगिरि की गुफाओं में वराह का एक प्रसिद्ध विशाल शैलचित्र स्थित है।',
        source: 'भागवत पुराण',
      },
      {
        question: 'भगवद्गीता में किस अध्याय को "भक्ति योग" के रूप में जाना जाता है?',
        options: ['अध्याय 12', 'अध्याय 10', 'अध्याय 18', 'अध्याय 15'],
        answerIndex: 0,
        explanation: 'भगवद्गीता का 12वां अध्याय पूरी तरह से भक्ति योग और ईश्वर के प्रति समर्पण को समर्पित है।',
        fact: 'गीता में कुल 18 अध्याय और 700 श्लोक हैं।',
        source: 'भगवद्गीता',
      },
      {
        question: 'कौन सा त्योहार स्वर्ग से पृथ्वी पर पवित्र नदी गंगा के अवतरण की याद में मनाया जाता है?',
        options: ['गंगा दशहरा', 'मकर संक्रांति', 'छठ पूजा', 'कार्तिकेय दीपम'],
        answerIndex: 0,
        explanation: 'गंगा दशहरा उस दिन को चिह्नित करता है जब गंगा शिव की जटाओं के माध्यम से पृथ्वी पर अवतरित हुई थीं।',
        fact: 'राजा भगीरथ ने अपने पूर्वजों की मुक्ति के लिए गंगा को पृथ्वी पर लाने हेतु हजारों वर्ष तपस्या की थी।',
        source: 'शिव पुराण',
      },
      {
        question: 'महाबलीपुरम का प्रसिद्ध तटीय मंदिर (Shore Temple) भारत के किस राज्य में स्थित है?',
        options: ['तमिलनाडु', 'केरल', 'कर्नाटक', 'आंध्र प्रदेश'],
        answerIndex: 0,
        explanation: 'महाबलीपुरम का तटीय मंदिर 8वीं शताब्दी में पल्लव शासकों द्वारा बनवाया गया था और यह तमिलनाडु में है।',
        fact: 'यह एक यूनेस्को विश्व धरोहर स्थल है और पत्थर की शुरुआती नक्काशीदार वास्तुकला को दर्शाता है।',
        source: 'भारतीय मंदिर वास्तुकला',
      }
    ],
    all: [
      {
        question: 'किस नदी को भारत की अनेक परंपराओं में पवित्र माना जाता है?',
        options: ['गंगा', 'टेम्स', 'वोल्गा', 'डेन्यूब'],
        answerIndex: 0,
        explanation: 'गंगा हिंदू परंपराओं में पवित्र स्थान रखती है और भारत में सांस्कृतिक रूप से बहुत महत्वपूर्ण है।',
        fact: 'वाराणसी, हरिद्वार और प्रयागराज जैसे शहर गंगा से गहराई से जुड़े हैं।',
        source: 'भारतीय पवित्र भूगोल',
      },
      {
        question: 'कौन सा संस्कृत शब्द हिंदू, बौद्ध और जैन धर्मों में साझा सार्वभौमिक नैतिक व्यवस्था और नैतिक कर्तव्य को संदर्भित करता है?',
        options: ['धर्म', 'कर्म', 'संसार', 'मोक्ष'],
        answerIndex: 0,
        explanation: 'धर्म (या पाली में धम्म) ब्रह्मांडीय नियम, नैतिक व्यवस्था और सदाचार का प्रतीक है जो सभी भारतीय दर्शनों का आधार है।',
        fact: 'धर्मचक्र इन सभी परंपराओं का एक साझा प्रतीक है, जो नैतिक व्यवस्था के चक्र को दर्शाता है।',
        source: 'भारतीय परंपराएं',
      },
      {
        question: 'गंगा और वरुणा नदियों के संगम पर बसा कौन सा प्राचीन शहर हिंदू, बौद्ध और जैन तीनों परंपराओं के लिए एक प्रमुख आध्यात्मिक केंद्र है?',
        options: ['वाराणसी', 'अयोध्या', 'मथुरा', 'उज्जैन'],
        answerIndex: 0,
        explanation: 'वाराणसी हिंदुओं (शिव की नगरी), बौद्धों (सारनाथ में बुद्ध का प्रथम उपदेश) और जैनों (तीर्थंकरों की जन्मभूमि) के लिए समान रूप से पवित्र है।',
        fact: 'वाराणसी को विश्व के सबसे प्राचीन और निरंतर जीवित शहरों में से एक माना जाता है।',
        source: 'भारतीय आध्यात्मिक स्थल',
      },
      {
        question: 'प्रयागराज, हरिद्वार, नासिक और उज्जैन में स्नान अनुष्ठानों के साथ मनाया जाने वाला विश्व का सबसे बड़ा शांतिपूर्ण आध्यात्मिक मेला कौन सा है?',
        options: ['कुंभ मेला', 'महा शिवरात्रि', 'बुद्ध पूर्णिमा', 'गुरु नानक गुरपुरब'],
        answerIndex: 0,
        explanation: 'कुंभ मेला दुनिया का सबसे बड़ा शांतिपूर्ण धार्मिक मेला है, जो बारह वर्ष की अवधि में चार स्थानों पर आयोजित होता है।',
        fact: 'इसे यूनेस्को द्वारा मानवता की अमूर्त सांस्कृतिक विरासत के रूप में मान्यता दी गई है।',
        source: 'भारतीय त्योहार',
      },
      {
        question: '"ॐ" (ओम्) या "एउम" एक पवित्र ध्वनि है। इसके आध्यात्मिक रहस्य की विस्तृत व्याख्या सबसे पहले किन ग्रंथों में की गई थी?',
        options: ['उपनिषद', 'आगम ग्रंथ', 'त्रिपिटक', 'गुरु ग्रंथ साहिब'],
        answerIndex: 0,
        explanation: 'ओम् का दार्शनिक और आध्यात्मिक अर्थ सबसे पहले उपनिषदों, विशेष रूप से मांडूक्य उपनिषद में विस्तार से समझाया गया था।',
        fact: 'ओम् परम सत्य (ब्रह्म) और ब्रह्मांड की आदि ध्वनि का प्रतीक है।',
        source: 'उपनिषद',
      }
    ]
  },
  pa: {
    sikh: [{
      question: 'ਆਦਿ ਗ੍ਰੰਥ ਸਾਹਿਬ, ਜੋ ਬਾਅਦ ਵਿੱਚ ਗੁਰੂ ਗ੍ਰੰਥ ਸਾਹਿਬ ਜੀ ਬਣੇ, ਕਿਸ ਨੇ ਸੰਕਲਿਤ ਕੀਤਾ ਸੀ?',
      options: ['ਗੁਰੂ ਅਰਜਨ ਦੇਵ ਜੀ', 'ਗੁਰੂ ਗੋਬਿੰਦ ਸਿੰਘ ਜੀ', 'ਗੁਰੂ ਰਾਮ ਦਾਸ ਜੀ', 'ਗੁਰੂ ਤੇਗ ਬਹਾਦਰ ਜੀ'],
      answerIndex: 0,
      explanation: 'ਗੁਰੂ ਅਰਜਨ ਦੇਵ ਜੀ ਨੇ 1604 ਵਿੱਚ ਆਦਿ ਗ੍ਰੰਥ ਦਾ ਸੰਕਲਨ ਕੀਤਾ ਅਤੇ ਇਸਨੂੰ ਹਰਿਮੰਦਰ ਸਾਹਿਬ ਵਿਖੇ ਸਥਾਪਿਤ ਕੀਤਾ।',
      fact: 'ਇਸ ਗ੍ਰੰਥ ਵਿੱਚ ਵੱਖ-ਵੱਖ ਪਿਛੋਕੜਾਂ ਵਾਲੇ ਭਗਤਾਂ ਦੀਆਂ ਰਚਨਾਵਾਂ ਸ਼ਾਮਲ ਹਨ।',
      source: 'ਸਿੱਖ ਪਰੰਪਰਾ',
    }],
    all: [{
      question: 'ਕਿਸ ਨਦੀ ਨੂੰ ਭਾਰਤ ਦੀਆਂ ਕਈ ਪਰੰਪਰਾਵਾਂ ਵਿੱਚ ਪਵਿੱਤਰ ਮੰਨਿਆ ਜਾਂਦਾ ਹੈ?',
      options: ['ਗੰਗਾ', 'ਥੇਮਜ਼', 'ਵੋਲਗਾ', 'ਡੈਨਿਊਬ'],
      answerIndex: 0,
      explanation: 'ਗੰਗਾ ਹਿੰਦੂ ਪਰੰਪਰਾਵਾਂ ਵਿੱਚ ਪਵਿੱਤਰ ਸਥਾਨ ਰੱਖਦੀ ਹੈ ਅਤੇ ਭਾਰਤ ਵਿੱਚ ਸੱਭਿਆਚਾਰਕ ਤੌਰ ਤੇ ਬਹੁਤ ਮਹੱਤਵਪੂਰਨ ਹੈ।',
      fact: 'ਵਾਰਾਣਸੀ, ਹਰਿਦੁਆਰ ਅਤੇ ਪ੍ਰਯਾਗਰਾਜ ਵਰਗੇ ਸਹਿਰ ਗੰਗਾ ਨਾਲ ਡੂੰਘਾਈ ਨਾਲ ਜੁੜੇ ਹੋਏ ਹਨ।',
      source: 'ਭਾਰਤੀ ਪਵਿੱਤਰ ਭੂਗੋਲ',
    }]
  }
};
