export const DAILY_FALLBACK_QUIZ: Record<string, Record<string, {
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
  fact: string;
  source: string;
}>> = {
  en: {
    hindu: {
      question: 'Which Upanishad contains the mahavakya "Tat Tvam Asi"?',
      options: ['Chandogya Upanishad', 'Kena Upanishad', 'Mundaka Upanishad', 'Isha Upanishad'],
      answerIndex: 0,
      explanation: 'The mahavakya "Tat Tvam Asi" appears in the Chandogya Upanishad as part of the teaching of Uddalaka to Shvetaketu.',
      fact: 'Different Vedanta schools interpret this mahavakya differently.',
      source: 'Chandogya Upanishad 6.8.7',
    },
    sikh: {
      question: 'Who compiled the Adi Granth, which later became Guru Granth Sahib Ji?',
      options: ['Guru Arjan Dev Ji', 'Guru Gobind Singh Ji', 'Guru Ram Das Ji', 'Guru Tegh Bahadur Ji'],
      answerIndex: 0,
      explanation: 'Guru Arjan Dev Ji compiled the Adi Granth in 1604 and installed it at Harmandir Sahib.',
      fact: 'The scripture includes compositions of Bhagats from diverse backgrounds.',
      source: 'Sikh tradition',
    },
    buddhist: {
      question: 'Which teaching is grouped as the first sermon traditionally delivered by the Buddha at Sarnath?',
      options: ['The Four Noble Truths', 'The Five Precepts', 'The Brahmaviharas', 'The Ten Paramitas'],
      answerIndex: 0,
      explanation: 'The Buddha’s first sermon at Sarnath is traditionally associated with the Four Noble Truths and the Middle Way.',
      fact: 'This discourse is commonly referred to as the Dhammacakkappavattana Sutta.',
      source: 'Buddhist tradition',
    },
    jain: {
      question: 'Which principle is most centrally associated with Jain ethical life?',
      options: ['Ahimsa', 'Yajna', 'Bhakti', 'Rajadharma'],
      answerIndex: 0,
      explanation: 'Ahimsa, or non-violence, is the central ethical principle in Jain dharma.',
      fact: 'Jain practice extends non-violence with unusual rigor.',
      source: 'Jain tradition',
    },
    all: {
      question: 'Which river is widely revered across multiple Indian traditions as sacred?',
      options: ['Ganga', 'Thames', 'Volga', 'Danube'],
      answerIndex: 0,
      explanation: 'The Ganga holds sacred status across Hindu traditions and is culturally significant in India.',
      fact: 'Cities like Varanasi, Haridwar, and Prayagraj are deeply tied to the Ganga.',
      source: 'Indian sacred geography',
    },
  },
  hi: {
    hindu: {
      question: 'किस उपनिषद में महावाक्य "तत् त्वम असि" (Tat Tvam Asi) मिलता है?',
      options: ['छान्दोग्य उपनिषद', 'केन उपनिषद', 'मुण्डक उपनिषद', 'ईश उपनिषद'],
      answerIndex: 0,
      explanation: '"तत् त्वम असि" महावाक्य छान्दोग्य उपनिषद में उद्दालक द्वारा श्वेतकेतु को दिए गए उपदेश का हिस्सा है।',
      fact: 'वेदांत के विभिन्न संप्रदाय इस महावाक्य की अलग-अलग व्याख्या करते हैं।',
      source: 'छान्दोग्य उपनिषद 6.8.7',
    },
    all: {
      question: 'किस नदी को भारत की अनेक परंपराओं में पवित्र माना जाता है?',
      options: ['गंगा', 'टेम्स', 'वोल्गा', 'डेन्यूब'],
      answerIndex: 0,
      explanation: 'गंगा हिंदू परंपराओं में पवित्र स्थान रखती है और भारत में सांस्कृतिक रूप से बहुत महत्वपूर्ण है।',
      fact: 'वाराणसी, हरिद्वार और प्रयागराज जैसे शहर गंगा से गहराई से जुड़े हैं।',
      source: 'भारतीय पवित्र भूगोल',
    }
  },
  pa: {
    sikh: {
      question: 'ਆਦਿ ਗ੍ਰੰਥ ਸਾਹਿਬ, ਜੋ ਬਾਅਦ ਵਿੱਚ ਗੁਰੂ ਗ੍ਰੰਥ ਸਾਹਿਬ ਜੀ ਬਣੇ, ਕਿਸ ਨੇ ਸੰਕਲਿਤ ਕੀਤਾ ਸੀ?',
      options: ['ਗੁਰੂ ਅਰਜਨ ਦੇਵ ਜੀ', 'ਗੁਰੂ ਗੋਬਿੰਦ ਸਿੰਘ ਜੀ', 'ਗੁਰੂ ਰਾਮ ਦਾਸ ਜੀ', 'ਗੁਰੂ ਤੇਗ ਬਹਾਦਰ ਜੀ'],
      answerIndex: 0,
      explanation: 'ਗੁਰੂ ਅਰਜਨ ਦੇਵ ਜੀ ਨੇ 1604 ਵਿੱਚ ਆਦਿ ਗ੍ਰੰਥ ਦਾ ਸੰਕਲਨ ਕੀਤਾ ਅਤੇ ਇਸਨੂੰ ਹਰਿਮੰਦਰ ਸਾਹਿਬ ਵਿਖੇ ਸਥਾਪਿਤ ਕੀਤਾ।',
      fact: 'ਇਸ ਗ੍ਰੰਥ ਵਿੱਚ ਵੱਖ-ਵੱਖ ਪਿਛੋਕੜਾਂ ਵਾਲੇ ਭਗਤਾਂ ਦੀਆਂ ਰਚਨਾਵਾਂ ਸ਼ਾਮਲ ਹਨ।',
      source: 'ਸਿੱਖ ਪਰੰਪਰਾ',
    },
    all: {
      question: 'ਕਿਸ ਨਦੀ ਨੂੰ ਭਾਰਤ ਦੀਆਂ ਕਈ ਪਰੰਪਰਾਵਾਂ ਵਿੱਚ ਪਵਿੱਤਰ ਮੰਨਿਆ ਜਾਂਦਾ ਹੈ?',
      options: ['ਗੰਗਾ', 'ਥੇਮਜ਼', 'ਵੋਲਗਾ', 'ਡੈਨਿਊਬ'],
      answerIndex: 0,
      explanation: 'ਗੰਗਾ ਹਿੰਦੂ ਪਰੰਪਰਾਵਾਂ ਵਿੱਚ ਪਵਿੱਤਰ ਸਥਾਨ ਰੱਖਦੀ ਹੈ ਅਤੇ ਭਾਰਤ ਵਿੱਚ ਸੱਭਿਆਚਾਰਕ ਤੌਰ ਤੇ ਬਹੁਤ ਮਹੱਤਵਪੂਰਨ ਹੈ।',
      fact: 'ਵਾਰਾਣਸੀ, ਹਰਿਦੁਆਰ ਅਤੇ ਪ੍ਰਯਾਗਰਾਜ ਵਰਗੇ ਸ਼ਹਿਰ ਗੰਗਾ ਨਾਲ ਡੂੰਘਾਈ ਨਾਲ ਜੁੜੇ ਹੋਏ ਹਨ।',
      source: 'ਭਾਰਤੀ ਪਵਿੱਤਰ ਭੂਗੋਲ',
    }
  }
};
