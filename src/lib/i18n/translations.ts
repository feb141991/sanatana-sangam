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
  // General
  | 'today' | 'yesterday' | 'thisWeek' | 'loading' | 'errorTryAgain';

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
  // General
  today: 'Today', yesterday: 'Yesterday', thisWeek: 'This Week',
  loading: 'Loading…', errorTryAgain: 'Something went wrong. Please try again.',
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
  // General
  today: 'आज', yesterday: 'कल', thisWeek: 'इस सप्ताह',
  loading: 'लोड हो रहा है…', errorTryAgain: 'कुछ गड़बड़ हुई। कृपया फिर प्रयास करें।',
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
  // General
  today: 'ਅੱਜ', yesterday: 'ਕੱਲ੍ਹ', thisWeek: 'ਇਸ ਹਫ਼ਤੇ',
  loading: 'ਲੋਡ ਹੋ ਰਿਹਾ ਹੈ…', errorTryAgain: 'ਕੁਝ ਗਲਤ ਹੋਇਆ। ਕਿਰਪਾ ਕਰਕੇ ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰੋ।',
};

export const TRANSLATIONS: Record<AppLang, TranslationMap> = { en, hi, pa };

/** Resolve a translation key for the given language, falling back to English. */
export function t(lang: AppLang, key: TranslationKey): string {
  return TRANSLATIONS[lang]?.[key] ?? TRANSLATIONS.en[key] ?? key;
}
