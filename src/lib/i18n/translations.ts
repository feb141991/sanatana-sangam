// ─── Shoonaya — UI Translation Dictionary ─────────────────────────────
// Covers English (en), Hindi (hi), and Punjabi (pa).
// Translations are provided for key spiritual terms and UI strings.
// Keys follow camelCase. Values are plain strings (no JSX).
// ─────────────────────────────────────────────────────────────────────────────

export type AppLang = 'en' | 'hi' | 'pa';

export type TranslationKey =
  // Nav
  | 'navHome' | 'navPathshala' | 'navKul' | 'navMandali' | 'navTirtha' | 'navAI'
  // Actions
  | 'save' | 'cancel' | 'continue' | 'back' | 'skip' | 'done' | 'share'
  // Greetings
  | 'greetingMorning' | 'greetingEvening' | 'greetingDefault'
  // Panchang terms
  | 'tithi' | 'nakshatra' | 'yoga' | 'vara' | 'sunrise' | 'sunset'
  | 'rahuKaal' | 'abhijitMuhurat' | 'paksha' | 'shukla' | 'krishna' | 'masa'
  // Practice
  | 'japa' | 'mala' | 'mantra' | 'shloka' | 'aarti' | 'puja' | 'vrat'
  // Home labels
  | 'todayPanchang' | 'dailyVerse' | 'morningRoutine' | 'upcomingFestivals'
  // Bhakti
  | 'bhakti' | 'pathOfDevotion' | 'sacredSounds'
  // Onboarding
  | 'welcomeTitle' | 'welcomeSub' | 'yourTradition' | 'yourLanguage'
  | 'yourLocation' | 'whatBringsYou' | 'enterApp'
  // Kul
  | 'kul' | 'family' | 'lineage' | 'sanskara'
  // Bhakti Revamp
  | 'sacredSanctuary' | 'auspiciousBeginnings' | 'dailyRituals' | 'soundSanctuary'
  | 'recommendedForYou' | 'explore' | 'divinePortals' | 'sacredReflection'
  | 'todayIs' | 'amritKaal' | 'brahmaMuhurta' | 'sadhanaTracker' | 'ritualProgress'
  // Home Features
  | 'liveDarshan' | 'sadhanaPulse' | 'mandali' | 'tirtha'
  | 'liveDarshanDesc' | 'panchangDesc' | 'sadhanaPulseDesc' | 'bhaktiDesc'
  | 'pathshalaDesc' | 'mandaliDesc' | 'kulDesc' | 'tirthaDesc'
  // Notifications & UI
  | 'notifications' | 'markAllRead' | 'allQuiet' | 'allCaughtUp' | 'unread'
  | 'join' | 'signIn' | 'joinFree' | 'welcome' | 'study' | 'circle' | 'mirror'
  | 'sevaHub' | 'quizMastery' | 'vichaar'
  | 'journeyLabel' | 'testOfDharma' | 'wisdom' | 'essence' | 'shareReflection'
  // General
  | 'today' | 'yesterday' | 'thisWeek' | 'loading' | 'errorTryAgain' | 'ritualComplete';

type TranslationMap = Record<TranslationKey, string>;

const en: TranslationMap = {
  // Nav
  navHome: 'Home', navPathshala: 'Pathshala', navKul: 'Kul',
  navMandali: 'Mandali', navTirtha: 'Tirtha', navAI: 'Ask AI',
  // Actions
  save: 'Save', cancel: 'Cancel', continue: 'Continue', back: 'Back',
  skip: 'Skip', done: 'Done', share: 'Share',
  // Greetings
  greetingMorning: 'Good morning', greetingEvening: 'Good evening', greetingDefault: 'Namaste',
  // Panchang
  tithi: 'Tithi', nakshatra: 'Nakshatra', yoga: 'Yoga', vara: 'Vara',
  sunrise: 'Sunrise', sunset: 'Sunset', rahuKaal: 'Rahu Kaal',
  abhijitMuhurat: 'Abhijit Muhurat', paksha: 'Paksha', shukla: 'Shukla',
  krishna: 'Krishna', masa: 'Masa',
  // Practice
  japa: 'Japa', mala: 'Mala', mantra: 'Mantra', shloka: 'Shloka',
  aarti: 'Aarti', puja: 'Puja', vrat: 'Vrat',
  // Home
  todayPanchang: "Today's Panchang", dailyVerse: 'Daily Verse',
  morningRoutine: 'Morning Routine', upcomingFestivals: 'Upcoming Festivals',
  // Bhakti
  bhakti: 'Bhakti', pathOfDevotion: 'The path of devotion', sacredSounds: 'Sacred Sounds',
  // Onboarding
  welcomeTitle: 'Shoonaya', welcomeSub: 'A home for Dharma',
  yourTradition: 'Your Tradition', yourLanguage: 'Your Language',
  yourLocation: 'Your Location', whatBringsYou: 'What brings you here?',
  enterApp: 'Enter Shoonaya',
  // Kul
  kul: 'Kul', family: 'Family', lineage: 'Lineage', sanskara: 'Sanskara',
  // Bhakti Revamp
  sacredSanctuary: 'Sacred Sanctuary', auspiciousBeginnings: 'Auspicious Beginnings',
  dailyRituals: 'Daily Rituals', soundSanctuary: 'Sound Sanctuary',
  recommendedForYou: 'Recommended for You', explore: 'Explore',
  divinePortals: 'Divine Portals', sacredReflection: 'Sacred Reflection',
  todayIs: 'Today is', amritKaal: 'Amrit Kaal', brahmaMuhurta: 'Brahma Muhurta',
  sadhanaTracker: 'Sadhana Tracker', ritualProgress: 'Progress',
  // Home Features
  liveDarshan: 'Live Darshan', sadhanaPulse: 'Sadhana Pulse',
  mandali: 'Mandali', tirtha: 'Tirtha',
  liveDarshanDesc: '24/7 Temple live streams',
  panchangDesc: 'Tithi, Nakshatra, Yoga & more',
  sadhanaPulseDesc: 'Track your sacred momentum and daily spiritual consistency',
  bhaktiDesc: 'Mala, zen, aarti and sacred practice',
  pathshalaDesc: 'Study, recite and reflect daily',
  mandaliDesc: 'Join satsang and community circles',
  kulDesc: 'Family, lineage and sacred sanskaras',
  tirthaDesc: 'Find temples near you',
  // Notifications & UI
  notifications: 'Notifications', markAllRead: 'Mark all read',
  allQuiet: 'All quiet for now', allCaughtUp: 'All caught up',
  unread: 'unread', join: 'Join', signIn: 'Sign in',
  joinFree: 'Join Free', welcome: 'Welcome', study: 'Study',
  circle: 'Circle', mirror: 'Mirror', sevaHub: 'Seva Hub',
  quizMastery: 'Quiz Mastery', vichaar: 'Vichaar',
  journeyLabel: 'The Journey', testOfDharma: 'The Test of Dharma',
  wisdom: 'Wisdom', essence: 'Essence', shareReflection: 'Share this Reflection',
  // General
  today: 'Today', yesterday: 'Yesterday', thisWeek: 'This Week',
  loading: 'Loading…', errorTryAgain: 'Something went wrong. Please try again.',
  ritualComplete: 'Ritual Complete',
};

const hi: TranslationMap = {
  // Nav
  navHome: 'होम', navPathshala: 'पाठशाला', navKul: 'कुल',
  navMandali: 'मंडली', navTirtha: 'तीर्थ', navAI: 'AI से पूछें',
  // Actions
  save: 'सहेजें', cancel: 'रद्द करें', continue: 'आगे बढ़ें', back: 'वापस',
  skip: 'छोड़ें', done: 'हो गया', share: 'साझा करें',
  // Greetings
  greetingMorning: 'सुप्रभात', greetingEvening: 'शुभ संध्या', greetingDefault: 'नमस्ते',
  // Panchang
  tithi: 'तिथि', nakshatra: 'नक्षत्र', yoga: 'योग', vara: 'वार',
  sunrise: 'सूर्योदय', sunset: 'सूर्यास्त', rahuKaal: 'राहु काल',
  abhijitMuhurat: 'अभिजित मुहूर्त', paksha: 'पक्ष', shukla: 'शुक्ल',
  krishna: 'कृष्ण', masa: 'मास',
  // Practice
  japa: 'जप', mala: 'माला', mantra: 'मंत्र', shloka: 'श्लोक',
  aarti: 'आरती', puja: 'पूजा', vrat: 'व्रत',
  // Home
  todayPanchang: 'आज का पंचांग', dailyVerse: 'आज का श्लोक',
  morningRoutine: 'प्रातः क्रिया', upcomingFestivals: 'आने वाले पर्व',
  // Bhakti
  bhakti: 'भक्ति', pathOfDevotion: 'भक्ति का मार्ग', sacredSounds: 'भजन व कीर्तन',
  // Onboarding
  welcomeTitle: 'सनातन संगम', welcomeSub: 'धर्म का घर',
  yourTradition: 'आपकी परम्परा', yourLanguage: 'आपकी भाषा',
  yourLocation: 'आपका स्थान', whatBringsYou: 'आप यहाँ क्यों आए?',
  enterApp: 'सनातन संगम में प्रवेश करें',
  // Kul
  kul: 'कुल', family: 'परिवार', lineage: 'वंश', sanskara: 'संस्कार',
  // Bhakti Revamp
  sacredSanctuary: 'पावन स्थल', auspiciousBeginnings: 'शुभ शुरुआत',
  dailyRituals: 'दैनिक अनुष्ठान', soundSanctuary: 'ध्वनि केंद्र',
  recommendedForYou: 'आपके लिए', explore: 'खोजें',
  divinePortals: 'दिव्य द्वार', sacredReflection: 'पावन विचार',
  todayIs: 'आज है', amritKaal: 'अमृत काल', brahmaMuhurta: 'ब्रह्म मुहूर्त',
  sadhanaTracker: 'साधना ट्रैकर', ritualProgress: 'प्रगति',
  // Home Features
  liveDarshan: 'लाइव दर्शन', sadhanaPulse: 'साधना पल्स',
  mandali: 'मंडली', tirtha: 'तीर्थ',
  liveDarshanDesc: '24/7 मंदिर लाइव स्ट्रीम',
  panchangDesc: 'तिथि, नक्षत्र, योग और बहुत कुछ',
  sadhanaPulseDesc: 'अपनी आध्यात्मिक प्रगति को ट्रैक करें',
  bhaktiDesc: 'माला, ध्यान, आरती और पवित्र अभ्यास',
  pathshalaDesc: 'प्रतिदिन अध्ययन और चिंतन करें',
  mandaliDesc: 'सत्संग और सामुदायिक मंडलियों में शामिल हों',
  kulDesc: 'परिवार, वंश और संस्कार',
  tirthaDesc: 'अपने आस-पास के मंदिर खोजें',
  // Notifications & UI
  notifications: 'सूचनाएं', markAllRead: 'सब पढ़ लिया गया',
  allQuiet: 'अभी कोई सूचना नहीं है', allCaughtUp: 'सब अपडेट है',
  unread: 'बिना पढ़े', join: 'जुड़ें', signIn: 'साइन इन',
  joinFree: 'मुफ्त जुड़ें', welcome: 'स्वागत है', study: 'अध्ययन',
  circle: 'मंडली', mirror: 'दर्पण', sevaHub: 'सेवा केंद्र',
  quizMastery: 'प्रश्नोत्तरी', vichaar: 'विचार',
  journeyLabel: 'जीवन यात्रा', testOfDharma: 'धर्म की परीक्षा',
  wisdom: 'ज्ञान', essence: 'सार', shareReflection: 'इस विचार को साझा करें',
  // General
  today: 'आज', yesterday: 'कल', thisWeek: 'इस सप्ताह',
  loading: 'लोड हो रहा है…', errorTryAgain: 'कुछ गड़बड़ हुई। कृपया फिर प्रयास करें।',
  ritualComplete: 'अनुष्ठान पूर्ण',
};

const pa: TranslationMap = {
  // Nav
  navHome: 'ਹੋਮ', navPathshala: 'ਪਾਠਸ਼ਾਲਾ', navKul: 'ਕੁਲ',
  navMandali: 'ਮੰਡਲੀ', navTirtha: 'ਤੀਰਥ', navAI: 'AI ਨੂੰ ਪੁੱਛੋ',
  // Actions
  save: 'ਸੁਰੱਖਿਅਤ ਕਰੋ', cancel: 'ਰੱਦ ਕਰੋ', continue: 'ਅੱਗੇ ਵਧੋ', back: 'ਵਾਪਸ',
  skip: 'ਛੱਡੋ', done: 'ਹੋ ਗਿਆ', share: 'ਸਾਂਝਾ ਕਰੋ',
  // Greetings
  greetingMorning: 'ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ', greetingEvening: 'ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ', greetingDefault: 'ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ',
  // Panchang
  tithi: 'ਤਿਥਿ', nakshatra: 'ਨਕਸ਼ਤਰ', yoga: 'ਯੋਗ', vara: 'ਵਾਰ',
  sunrise: 'ਸੂਰਜ ਚੜ੍ਹਨਾ', sunset: 'ਸੂਰਜ ਡੁੱਬਣਾ', rahuKaal: 'ਰਾਹੂ ਕਾਲ',
  abhijitMuhurat: 'ਅਭਿਜੀਤ ਮੁਹੂਰਤ', paksha: 'ਪੱਖ', shukla: 'ਸ਼ੁਕਲ',
  krishna: 'ਕ੍ਰਿਸ਼ਣ', masa: 'ਮਾਸ',
  // Practice
  japa: 'ਜਪ', mala: 'ਮਾਲਾ', mantra: 'ਮੰਤਰ', shloka: 'ਸ਼ਲੋਕ',
  aarti: 'ਆਰਤੀ', puja: 'ਪੂਜਾ', vrat: 'ਵਰਤ',
  // Home
  todayPanchang: 'ਅੱਜ ਦਾ ਪੰਚਾਂਗ', dailyVerse: 'ਅੱਜ ਦਾ ਸ਼ਲੋਕ',
  morningRoutine: 'ਸਵੇਰ ਦੀ ਵਿਧੀ', upcomingFestivals: 'ਆਉਣ ਵਾਲੇ ਤਿਉਹਾਰ',
  // Bhakti
  bhakti: 'ਭਗਤੀ', pathOfDevotion: 'ਭਗਤੀ ਦਾ ਰਾਹ', sacredSounds: 'ਸ਼ਬਦ ਕੀਰਤਨ',
  // Onboarding
  welcomeTitle: 'ਸਨਾਤਨ ਸੰਗਮ', welcomeSub: 'ਧਰਮ ਦਾ ਘਰ',
  yourTradition: 'ਤੁਹਾਡੀ ਪਰੰਪਰਾ', yourLanguage: 'ਤੁਹਾਡੀ ਭਾਸ਼ਾ',
  yourLocation: 'ਤੁਹਾਡੀ ਜਗ੍ਹਾ', whatBringsYou: 'ਤੁਸੀਂ ਇੱਥੇ ਕਿਉਂ ਆਏ?',
  enterApp: 'ਸਨਾਤਨ ਸੰਗਮ ਵਿੱਚ ਦਾਖਲ ਹੋਵੋ',
  // Kul
  kul: 'ਕੁਲ', family: 'ਪਰਿਵਾਰ', lineage: 'ਵੰਸ਼', sanskara: 'ਸੰਸਕਾਰ',
  // Bhakti Revamp
  sacredSanctuary: 'ਪਾਵਨ ਅਸਥਾਨ', auspiciousBeginnings: 'ਸ਼ੁਭ ਸ਼ੁਰੂਆਤ',
  dailyRituals: 'ਰੋਜ਼ਾਨਾ ਅਨੁਸ਼ਠਾਨ', soundSanctuary: 'ਸ਼ਬਦ ਕੇਂਦਰ',
  recommendedForYou: 'ਤੁਹਾਡੇ ਲਈ', explore: 'ਖੋਜੋ',
  divinePortals: 'ਦਿਵਯ ਦੁਆਰ', sacredReflection: 'ਪਾਵਨ ਵਿਚਾਰ',
  todayIs: 'ਅੱਜ ਹੈ', amritKaal: 'ਅੰਮ੍ਰਿਤ ਕਾਲ', brahmaMuhurta: 'ਬ੍ਰਹਮ ਮੁਹੂਰਤ',
  sadhanaTracker: 'ਸਾਧਨਾ ਟ੍ਰੈਕਰ', ritualProgress: 'ਪ੍ਰਗਤੀ',
  // Home Features
  liveDarshan: 'ਲਾਈਵ ਦਰਸ਼ਨ', sadhanaPulse: 'ਸਾਧਨਾ ਪਲਸ',
  mandali: 'ਮੰਡਲੀ', tirtha: 'ਤੀਰਥ',
  liveDarshanDesc: '24/7 ਮੰਦਿਰ ਲਾਈਵ ਸਟ੍ਰੀਮ',
  panchangDesc: 'ਤਿਥਿ, ਨਕਸ਼ਤਰ, ਯੋਗ ਅਤੇ ਹੋਰ',
  sadhanaPulseDesc: 'ਆਪਣੀ ਅਧਿਆਤਮਿਕ ਗਤੀ ਨੂੰ ਟ੍ਰੈਕ ਕਰੋ',
  bhaktiDesc: 'ਮਾਲਾ, ਧਿਆਨ, ਆਰਤੀ ਅਤੇ ਪਵਿੱਤਰ ਅਭਿਆਸ',
  pathshalaDesc: 'ਰੋਜ਼ਾਨਾ ਅਧਿਐਨ ਅਤੇ ਵਿਚਾਰ ਕਰੋ',
  mandaliDesc: 'ਸਤਿਸੰਗ ਅਤੇ ਭਾਈਚਾਰਕ ਮੰਡਲੀਆਂ ਵਿਚ ਸ਼ਾਮਲ ਹੋਵੋ',
  kulDesc: 'ਪਰਿਵਾਰ, ਵੰਸ਼ ਅਤੇ ਸੰਸਕਾਰ',
  tirthaDesc: 'ਆਪਣੇ ਆਲੇ ਦੁਆਲੇ ਦੇ ਮੰਦਰ ਲੱਭੋ',
  // Notifications & UI
  notifications: 'ਸੂਚਨਾਵਾਂ', markAllRead: 'ਸਾਰੇ ਪੜ੍ਹੋ',
  allQuiet: 'ਕੋਈ ਸੂਚਨਾ ਨਹੀਂ ਹੈ', allCaughtUp: 'ਸਭ ਅਪਡੇਟ ਹੈ',
  unread: 'ਅਣਪੜ੍ਹੇ', join: 'ਸ਼ਾਮਲ ਹੋਵੋ', signIn: 'ਸਾਈਨ ਇਨ',
  joinFree: 'ਮੁਫ਼ਤ ਸ਼ਾਮਲ ਹੋਵੋ', welcome: 'ਜੀ ਆਇਆਂ ਨੂੰ', study: 'ਅਧਿਐਨ',
  circle: 'ਮੰਡਲੀ', mirror: 'ਦਰਪਣ', sevaHub: 'ਸੇਵਾ ਕੇਂਦਰ',
  quizMastery: 'ਕੁਇਜ਼', vichaar: 'ਵਿਚਾਰ',
  journeyLabel: 'ਜੀਵਨ ਯਾਤਰਾ', testOfDharma: 'ਧਰਮ ਦੀ ਪ੍ਰੀਖਿਆ',
  wisdom: 'ਗਿਆਨ', essence: 'ਸਾਰ', shareReflection: 'ਇਸ ਵਿਚਾਰ ਨੂੰ ਸਾਂਝਾ ਕਰੋ',
  // General
  today: 'ਅੱਜ', yesterday: 'ਕੱਲ੍ਹ', thisWeek: 'ਇਸ ਹਫ਼ਤੇ',
  loading: 'ਲੋਡ ਹੋ ਰਿਹਾ ਹੈ…', errorTryAgain: 'ਕੁਝ ਗਲਤ ਹੋਇਆ। ਕਿਰਪਾ ਕਰਕੇ ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰੋ।',
  ritualComplete: 'ਅਨੁਸ਼ਠਾਨ ਪੂਰਾ',
};

export const TRANSLATIONS: Record<AppLang, TranslationMap> = { en, hi, pa };

/** Resolve a translation key for the given language, falling back to English. */
export function t(lang: AppLang, key: TranslationKey): string {
  return TRANSLATIONS[lang]?.[key] ?? TRANSLATIONS.en[key] ?? key;
}
