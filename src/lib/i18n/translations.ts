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
  | 'today' | 'yesterday' | 'thisWeek' | 'loading' | 'errorTryAgain' | 'ritualComplete'
  | 'significance' | 'howToObserve' | 'sacredMantra' | 'shareObservance'
  // Reader / Bhakti / Pathshala
  | 'library' | 'timer' | 'mixer' | 'deepMeaning' | 'dailyApp' | 'listen'
  | 'copy' | 'askAI' | 'transliteration' | 'currentKanda' | 'featuredPassages'
  | 'continueLesson' | 'viewDetails' | 'syllabus' | 'enrolled' | 'complete' | 'beginReading' | 'exploreAll'
  // Brand
  | 'brandTagline'
  // Sacred Pulse
  | 'pulseEkadashi' | 'pulseEkadashiDesc'
  | 'pulsePurnima' | 'pulsePurnimaDesc'
  | 'pulseAmavasya' | 'pulseAmavasyaDesc'
  | 'pulsePradosh' | 'pulsePradoshDesc'
  | 'pulseShivaratri' | 'pulseShivaratriDesc'
  | 'pulseSangrand' | 'pulseSangrandDesc'
  | 'pulseUposatha' | 'pulseUposathaDesc'
  | 'pulseAshtamiChaturdashi' | 'pulseAshtamiChaturdashiDesc'
  // Kul Page & Vansh Form
  | 'kulTitle' | 'kulVanshTitle' | 'kulLivingLineage' | 'kulHeritageQuote'
  | 'kulVanshEmptyTitle' | 'kulVanshEmptyDesc' | 'kulCreateFirstBranch'
  | 'kulBackToHub' | 'kulInviteLabel' | 'kulTasksTitle' | 'kulMembersTitle'
  | 'kulSabhaTitle' | 'kulVanshTitleLong' | 'kulEventsTitle'
  | 'kulAddMember' | 'kulEditMember' | 'kulFullName' | 'kulRelationship'
  | 'kulGender' | 'kulBirthDate' | 'kulBirthYear' | 'kulBirthPlace'
  | 'kulBirthPlaceDesc' | 'kulIsAlive' | 'kulIsAliveDesc' | 'kulLinkParent'
  | 'kulLinkSpouse' | 'kulEnterIntoVansh' | 'kulUpdateVansh' | 'kulRefineLineage'
  | 'kulBuildingEternal' | 'kulAncestralLinks' | 'kulOriginLife' | 'kulBasicIdentity'
  | 'shivaM' | 'shaktiF' | 'kulChangeCover' | 'kulLineageOf' | 'kulFamilyAltar'
  | 'kulProtected' | 'kulOpenSection' | 'kulNextDateIn' | 'kulDays'
  | 'gen1' | 'gen2' | 'gen3' | 'gen4' | 'gen5' | 'gen6'
  | 'kulAge' | 'kulLived' | 'kulInEternalMemory' | 'kulYearsAbbrev'
  | 'kulNoKulTitle' | 'kulNoKulDesc' | 'kulCreateNew' | 'kulCreateNewDesc'
  | 'kulJoinExisting' | 'kulJoinExistingDesc' | 'kulFamilyName' | 'kulEstablishLineage'
  | 'kulEnterInviteCode' | 'kulPrivateTrust' | 'kulEnterTheKul'
  | 'kulCareCircle' | 'kulCareCircleDesc' | 'kulFamilyMemberDefault'
  | 'kulTasksDesc' | 'kulAddTask' | 'kulPending' | 'kulCompleted'
  | 'kulNoTasksFound' | 'kulAssignedToAll' | 'kulSabhaDesc' | 'kulSabhaPlaceholder'
  | 'kulMembersEyebrow' | 'kulTasksEyebrow' | 'kulSabhaEyebrow' | 'kulVanshEyebrow'
  | 'kulEventsEyebrow' | 'kulEventsLabel' | 'kulEventsDesc' | 'kulAddEvent'
  | 'kulNoEventsFound'  | 'kulInDays' | 'kulAnnual' | 'kulSanskaraSubtitle' | 'kulSanskaraTitle'
  | 'kulSanskaraQuote' | 'kulComingSoon'
  | 's1' | 's1d' | 's2' | 's2d' | 's3' | 's3d' | 's4' | 's4d' | 's5' | 's5d'
  | 's6' | 's6d' | 's7' | 's7d' | 's8' | 's8d' | 's9' | 's9d' | 's10' | 's10d'
  | 's11' | 's11d' | 's12' | 's12d' | 's13' | 's13d' | 's14' | 's14d' | 's15' | 's15d'
  | 's16' | 's16d' | 'kulNamePlaceholder';

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
  significance: 'Significance', howToObserve: 'How to Observe', sacredMantra: 'Sacred Mantra', shareObservance: 'Share Observance',
  // Reader / Bhakti / Pathshala
  library: 'Library', timer: 'Timer', mixer: 'Mixer', deepMeaning: 'Deep Meaning',
  dailyApp: 'Daily Application', listen: 'Listen', copy: 'Copy', askAI: 'Ask AI',
  transliteration: 'Transliteration', currentKanda: 'Current Kanda', featuredPassages: 'Featured Passages',
  continueLesson: 'Continue Lesson', viewDetails: 'View Details', syllabus: 'Syllabus',
  enrolled: 'Enrolled', complete: 'Complete', beginReading: 'Begin Reading', exploreAll: 'Explore All',
  // Brand
  brandTagline: 'Find your infinite',
  // Sacred Pulse
  pulseEkadashi: 'Ekadashi',
  pulseEkadashiDesc: 'Sacred day for fasting and deep bhajan.',
  pulsePurnima: 'Purnima',
  pulsePurnimaDesc: 'Full moon — clarity and community worship.',
  pulseAmavasya: 'Amavasya',
  pulseAmavasyaDesc: 'New moon — ancestor remembrance and stillness.',
  pulsePradosh: 'Pradosh',
  pulsePradoshDesc: 'Twilight worship of Lord Shiva.',
  pulseShivaratri: 'Masik Shivaratri',
  pulseShivaratriDesc: 'Night of Shiva — vigil and devotion.',
  pulseSangrand: 'Sangrand',
  pulseSangrandDesc: 'The 1st of the month — a day for new beginnings.',
  pulseUposatha: 'Uposatha',
  pulseUposathaDesc: 'Lunar observance — a day for deeper practice.',
  pulseAshtamiChaturdashi: 'Ashtami/Chaturdashi',
  pulseAshtamiChaturdashiDesc: 'Auspicious day for fasting and Tattvartha study.',
  // Kul
  kulTitle: 'Kul — The Living Lineage',
  kulVanshTitle: 'Kul Vriksha — कुल वृक्ष',
  kulLivingLineage: 'The Living Lineage',
  kulHeritageQuote: 'As the roots are deep, the tree stands firm. Your lineage is the sacred soil from which your spirit grows.',
  kulVanshEmptyTitle: 'A Vansh yet to be written',
  kulVanshEmptyDesc: 'Add your ancestors and family members to begin mapping your spiritual heritage.',
  kulCreateFirstBranch: 'Create First Branch',
  kulBackToHub: 'Back to Hub',
  kulInviteLabel: 'Invite Code',
  kulTasksTitle: 'Kul Tasks',
  kulMembersTitle: 'Kul Members',
  kulSabhaTitle: 'Kul Sabha',
  kulVanshTitleLong: 'Lineage Tree',
  kulEventsTitle: 'Kul Events',
  kulAddMember: 'Add to Vansh',
  kulEditMember: 'Refine Lineage',
  kulFullName: 'Full Name',
  kulRelationship: 'Relationship',
  kulGender: 'Gender',
  kulBirthDate: 'Birth Date',
  kulBirthYear: 'Birth Year',
  kulBirthPlace: 'Birth Place',
  kulBirthPlaceDesc: 'Helps in tracking roots across generations.',
  kulIsAlive: 'Currently Living',
  kulIsAliveDesc: 'Toggle status of this relative',
  kulLinkParent: 'Link to Parent',
  kulLinkSpouse: 'Link to Spouse',
  kulEnterIntoVansh: 'Enter into Vansh',
  kulUpdateVansh: 'Update Vansh',
  kulRefineLineage: 'Refine Lineage',
  kulBuildingEternal: 'Building the eternal family tree',
  kulAncestralLinks: 'Ancestral Links',
  kulOriginLife: 'Origin & Life',
  kulBasicIdentity: 'Basic Identity',
  shivaM: 'Shiva (M)',
  shaktiF: 'Shakti (F)',
  kulChangeCover: 'Change Cover',
  kulLineageOf: 'Lineage of',
  kulFamilyAltar: 'Family Altar',
  kulProtected: 'Protected',
  kulOpenSection: 'Open a section',
  kulNextDateIn: 'Next date in',
  kulDays: 'd',
  gen1: 'Prapitamah — Great Grandparents',
  gen2: 'Pitamah — Grandparents',
  gen3: 'Pitru — Parents',
  gen4: 'Vartaman — Current Generation',
  gen5: 'Santan — Children',
  gen6: 'Pautra — Grandchildren',
  kulAge: 'Age',
  kulLived: 'Lived',
  kulInEternalMemory: 'In Eternal Memory',
  kulYearsAbbrev: 'y',
  kulNoKulTitle: 'Begin your Lineage',
  kulNoKulDesc: 'A Kul is a sacred family circle where you preserve your traditions, track your vansh (tree), and practice together.',
  kulCreateNew: 'Create a new Kul',
  kulCreateNewDesc: 'Start your own family circle and invite others.',
  kulJoinExisting: 'Join an existing Kul',
  kulJoinExistingDesc: 'Ask a family guardian for their invite code.',
  kulFamilyName: 'Family Name',
  kulEstablishLineage: 'Establish Lineage',
  kulEnterInviteCode: 'Enter Invite Code',
  kulPrivateTrust: 'Lineages are private circles of trust.',
  kulEnterTheKul: 'Enter the Kul',
  kulCareCircle: 'Care Circle',
  kulCareCircleDesc: 'The hearts that sustain this lineage.',
  kulFamilyMemberDefault: 'Family member',
  kulTasksDesc: 'Shared practices and commitments.',
  kulAddTask: 'Add Task',
  kulPending: 'Pending',
  kulCompleted: 'Completed',
  kulNoTasksFound: 'No tasks found.',
  kulAssignedToAll: 'Assigned to all',
  kulSabhaDesc: 'Family Council Chat',
  kulSabhaPlaceholder: 'Write to the family council…',
  kulMembersEyebrow: 'Care circle',
  kulTasksEyebrow: 'Do together',
  kulSabhaEyebrow: 'Family conversation',
  kulVanshEyebrow: 'Lineage',
  kulEventsEyebrow: 'Puja & More',
  kulEventsLabel: 'Family Dates',
  kulEventsDesc: 'Important milestones and observances.',
  kulAddEvent: 'Add Event',
  kulNoEventsFound: 'No upcoming events found.',
  kulInDays: 'In {days} days',
  kulAnnual: 'Annual',
  kulSanskaraSubtitle: 'Shodasha Sanskaras',
  kulSanskaraTitle: 'The 16 Sacred Rites',
  kulSanskaraQuote: 'From conception to liberation, the Sanskaras are the sacred transitions that refine the human soul and align it with Dharma.',
  kulComingSoon: 'Tracking feature for family Sanskaras coming soon in the next update.',
  s1: 'Garbhadhana', s1d: 'Conception — The sacred rite of bringing life.',
  s2: 'Pumsavana', s2d: 'Quickening of the fetus — To ensure the health of the unborn.',
  s3: 'Simantonnayana', s3d: 'Parting the hair — Protecting the mother and child.',
  s4: 'Jatakarma', s4d: 'Birth rites — Welcoming the newcomer to the lineage.',
  s5: 'Namakarana', s5d: 'Naming ceremony — Assigning the sacred identity.',
  s6: 'Nishkramana', s6d: 'First outing — The child meets the sun and world.',
  s7: 'Annaprashana', s7d: 'First solid food — Feeding the divine fire within.',
  s8: 'Chudakarana', s8d: 'Tonsure — The first hair cut, a sign of purity.',
  s9: 'Karnavedha', s9d: 'Ear piercing — Opening the gates of wisdom.',
  s10: 'Vidyarambha', s10d: 'Beginning of knowledge — The first lesson.',
  s11: 'Upanayana', s11d: 'Sacred thread — Entry into the world of study.',
  s12: 'Vedarambha', s12d: 'Beginning of Vedas — The deeper dive into dharma.',
  s13: 'Keshanta', s13d: 'First shave — Transition into youth.',
  s14: 'Samavartana', s14d: 'Graduation — Returning from the guru after study.',
  s15: 'Vivaha', s15d: 'Marriage — Entry into the householder stage.',
  s16: 'Antyesti', s16d: 'Funeral rites — The final sacrifice to the fire.',
  kulNamePlaceholder: 'Enter Lineage Name…',
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
  welcomeTitle: 'Shoonaya', welcomeSub: 'धर्म का घर',
  yourTradition: 'आपकी परम्परा', yourLanguage: 'आपकी भाषा',
  yourLocation: 'आपका स्थान', whatBringsYou: 'आप यहाँ क्यों आए?',
  enterApp: 'Shoonaya में प्रवेश करें',
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
  significance: 'महत्व', howToObserve: 'अनुष्ठान की विधि', sacredMantra: 'पवित्र मंत्र', shareObservance: 'इस व्रत को साझा करें',
  library: 'पुस्तकालय', timer: 'टाइमर', mixer: 'मिक्सर', deepMeaning: 'गहन अर्थ',
  dailyApp: 'दैनिक उपयोग', listen: 'सुनें', copy: 'कॉपी करें', askAI: 'AI से पूछें',
  transliteration: 'लिप्यांतरण', currentKanda: 'वर्तमान काण्ड', featuredPassages: 'प्रमुख श्लोक',
  continueLesson: 'पाठ जारी रखें', viewDetails: 'विवरण देखें', syllabus: 'पाठ्यक्रम',
  enrolled: 'नामांकित', complete: 'पूर्ण', beginReading: 'पढ़ना शुरू करें', exploreAll: 'सभी देखें',
  // Brand
  brandTagline: 'शून्य में अनंत',
  // Sacred Pulse
  pulseEkadashi: 'एकादशी',
  pulseEkadashiDesc: 'उपवास और गहन भजन के लिए पवित्र दिन।',
  pulsePurnima: 'पूर्णिमा',
  pulsePurnimaDesc: 'पूर्ण चंद्रमा — स्पष्टता और सामुदायिक पूजा।',
  pulseAmavasya: 'अमावस्या',
  pulseAmavasyaDesc: 'नया चंद्रमा — पूर्वज स्मरण और शांति।',
  pulsePradosh: 'प्रदोष',
  pulsePradoshDesc: 'भगवान शिव की संध्या उपासना।',
  pulseShivaratri: 'मासिक शिवरात्रि',
  pulseShivaratriDesc: 'शिव की रात्रि — जागरण और भक्ति।',
  pulseSangrand: 'संग्रांद',
  pulseSangrandDesc: 'महीने का पहला दिन — नई शुरुआत का दिन।',
  pulseUposatha: 'उपोसथ',
  pulseUposathaDesc: 'चंद्र अवलोकन — गहन अभ्यास का दिन।',
  pulseAshtamiChaturdashi: 'अष्टमी/चतुर्दशी',
  pulseAshtamiChaturdashiDesc: 'उपवास और तत्त्वार्थ अध्ययन के लिए शुभ दिन।',
  // Kul
  kulTitle: 'कुल — जीवित वंशावली',
  kulVanshTitle: 'कुल वृक्ष',
  kulLivingLineage: 'जीवित वंशावली',
  kulHeritageQuote: 'जैसे जड़ें गहरी होती हैं, वैसे ही पेड़ मजबूती से खड़ा रहता है। आपका वंश वह पवित्र मिट्टी है जिससे आपकी आत्मा विकसित होती है।',
  kulVanshEmptyTitle: 'अभी कोई वंश नहीं लिखा गया है',
  kulVanshEmptyDesc: 'अपनी आध्यात्मिक विरासत का मानचित्रण शुरू करने के लिए अपने पूर्वजों और परिवार के सदस्यों को जोड़ें।',
  kulCreateFirstBranch: 'पहली शाखा बनाएँ',
  kulBackToHub: 'हब पर वापस जाएँ',
  kulInviteLabel: 'आमंत्रण कोड',
  kulTasksTitle: 'कुल कार्य',
  kulMembersTitle: 'कुल सदस्य',
  kulSabhaTitle: 'कुल सभा',
  kulVanshTitleLong: 'वंश वृक्ष',
  kulEventsTitle: 'कुल कार्यक्रम',
  kulAddMember: 'वंश में जोड़ें',
  kulEditMember: 'वंश परिष्कृत करें',
  kulFullName: 'पूरा नाम',
  kulRelationship: 'रिश्ता',
  kulGender: 'लिंग',
  kulBirthDate: 'जन्म तिथि',
  kulBirthYear: 'जन्म वर्ष',
  kulBirthPlace: 'जन्म स्थान',
  kulBirthPlaceDesc: 'पीढ़ियों तक जड़ों का पता लगाने में मदद करता है।',
  kulIsAlive: 'अभी जीवित हैं',
  kulIsAliveDesc: 'रिश्तेदार की स्थिति बदलें',
  kulLinkParent: 'माता-पिता से जोड़ें',
  kulLinkSpouse: 'जीवनसाथी से जोड़ें',
  kulEnterIntoVansh: 'वंश में प्रवेश करें',
  kulUpdateVansh: 'वंश अपडेट करें',
  kulRefineLineage: 'वंश परिष्कृत करें',
  kulBuildingEternal: 'शाश्वत परिवार वृक्ष का निर्माण',
  kulAncestralLinks: 'पैतृक संबंध',
  kulOriginLife: 'उत्पत्ति और जीवन',
  kulBasicIdentity: 'मूल पहचान',
  shivaM: 'शिव (पु)',
  shaktiF: 'शक्ति (स्त्री)',
  kulChangeCover: 'कवर बदलें',
  kulLineageOf: 'वंश:',
  kulFamilyAltar: 'पारिवारिक वेदी',
  kulProtected: 'सुरक्षित',
  kulOpenSection: 'एक अनुभाग खोलें',
  kulNextDateIn: 'अगली तिथि:',
  kulDays: 'दिन',
  gen1: 'प्रपितामह — परदादा-परदादी',
  gen2: 'पितामह — दादा-दादी',
  gen3: 'पितृ — माता-पिता',
  gen4: 'वर्तमान — वर्तमान पीढ़ी',
  gen5: 'संतान — बच्चे',
  gen6: 'पौत्र — पोता-पोती',
  kulAge: 'आयु',
  kulLived: 'जीवन काल',
  kulInEternalMemory: 'अमर स्मृति में',
  kulYearsAbbrev: 'वर्ष',
  kulNoKulTitle: 'अपनी वंशावली शुरू करें',
  kulNoKulDesc: 'एक कुल एक पवित्र पारिवारिक घेरा है जहाँ आप अपनी परंपराओं को सुरक्षित रखते हैं, अपने वंश (पेड़) को ट्रैक करते हैं, और एक साथ अभ्यास करते हैं।',
  kulCreateNew: 'एक नया कुल बनाएँ',
  kulCreateNewDesc: 'अपना खुद का पारिवारिक घेरा शुरू करें और दूसरों को आमंत्रित करें।',
  kulJoinExisting: 'मौजूदा कुल में शामिल हों',
  kulJoinExistingDesc: 'परिवार के अभिभावक से उनका आमंत्रण कोड माँगें।',
  kulFamilyName: 'परिवार का नाम',
  kulEstablishLineage: 'वंश की स्थापना करें',
  kulEnterInviteCode: 'आमंत्रण कोड दर्ज करें',
  kulPrivateTrust: 'वंश विश्वास के निजी दायरे होते हैं।',
  kulEnterTheKul: 'कुल में प्रवेश करें',
  kulCareCircle: 'सेवा घेरा',
  kulCareCircleDesc: 'वे हृदय जो इस वंश को बनाए रखते हैं।',
  kulFamilyMemberDefault: 'परिवार का सदस्य',
  kulTasksDesc: 'साझा अभ्यास और प्रतिबद्धताएँ।',
  kulAddTask: 'कार्य जोड़ें',
  kulPending: 'लंबित',
  kulCompleted: 'पूर्ण',
  kulNoTasksFound: 'कोई कार्य नहीं मिला।',
  kulAssignedToAll: 'सभी को सौंपा गया',
  kulSabhaDesc: 'पारिवारिक परिषद चैट',
  kulSabhaPlaceholder: 'पारिवारिक परिषद को लिखें…',
  kulMembersEyebrow: 'सेवा घेरा',
  kulTasksEyebrow: 'साथ करें',
  kulSabhaEyebrow: 'पारिवारिक बातचीत',
  kulVanshEyebrow: 'वंशावली',
  kulEventsEyebrow: 'पूजा और अधिक',
  kulEventsLabel: 'पारिवारिक तिथियाँ',
  kulEventsDesc: 'महत्वपूर्ण मील के पत्थर और अनुपालन।',
  kulAddEvent: 'ईवेंट जोड़ें',
  kulNoEventsFound: 'कोई आगामी ईवेंट नहीं मिला।',
  kulInDays: '{days} दिनों में',
  kulAnnual: 'वार्षिक',
  kulSanskaraSubtitle: 'षोडश संस्कार',
  kulSanskaraTitle: '१६ पवित्र संस्कार',
  kulSanskaraQuote: 'गर्भाधान से मुक्ति तक, संस्कार वे पवित्र परिवर्तन हैं जो मानव आत्मा को परिष्कृत करते हैं और इसे धर्म के साथ संरेखित करते हैं।',
  kulComingSoon: 'पारिवारिक संस्कारों के लिए ट्रैकिंग सुविधा अगले अपडेट में जल्द ही आ रही है।',
  s1: 'गर्भाधान', s1d: 'गर्भाधान — जीवन लाने का पवित्र संस्कार।',
  s2: 'पुंसवन', s2d: 'भ्रूण की रक्षा — अजन्मे बच्चे के स्वास्थ्य को सुनिश्चित करने के लिए।',
  s3: 'सीमन्तोन्नयन', s3d: 'सीमन्तोन्नयन — माँ और बच्चे की सुरक्षा।',
  s4: 'जातकर्म', s4d: 'जन्म संस्कार — नए सदस्य का वंश में स्वागत।',
  s5: 'नामकरण', s5d: 'नामकरण संस्कार — पवित्र पहचान प्रदान करना।',
  s6: 'निष्क्रमण', s6d: 'पहली सैर — बच्चा सूरज और दुनिया से मिलता है।',
  s7: 'अन्नप्राशन', s7d: 'पहला ठोस भोजन — भीतर की दिव्य अग्नि को तृप्त करना।',
  s8: 'चूड़ाकर्म', s8d: 'मुंडन — शुद्धता का प्रतीक।',
  s9: 'कर्णवेध', s9d: 'कान छिदवाना — ज्ञान के द्वार खोलना।',
  s10: 'विद्यारंभ', s10d: 'ज्ञान की शुरुआत — पहला पाठ।',
  s11: 'उपनयन', s11d: 'जनेऊ संस्कार — अध्ययन की दुनिया में प्रवेश।',
  s12: 'वेदारंभ', s12d: 'वेदों की शुरुआत — धर्म में गहरा प्रवेश।',
  s13: 'केशांत', s13d: 'पहली दाढ़ी — युवावस्था में संक्रमण।',
  s14: 'समावर्तन', s14d: 'स्नातक — अध्ययन के बाद गुरु से वापसी।',
  s15: 'विवाह', s15d: 'विवाह — गृहस्थ जीवन में प्रवेश।',
  s16: 'अंत्येष्टि', s16d: 'अंतिम संस्कार — अग्नि को अंतिम आहुति।',
  kulNamePlaceholder: 'कुल का नाम दर्ज करें…',
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
  welcomeTitle: 'Shoonaya', welcomeSub: 'ਧਰਮ ਦਾ ਘਰ',
  yourTradition: 'ਤੁਹਾਡੀ ਪਰੰਪਰਾ', yourLanguage: 'ਤੁਹਾਡੀ ਭਾਸ਼ਾ',
  yourLocation: 'ਤੁਹਾਡੀ ਜਗ੍ਹਾ', whatBringsYou: 'ਤੁਸੀਂ ਇੱਥੇ ਕਿਉਂ ਆਏ?',
  enterApp: 'Shoonaya ਵਿੱਚ ਦਾਖਲ ਹੋਵੋ',
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
  significance: 'ਮਹੱਤਵ', howToObserve: 'ਅਨੁਸ਼ਠਾਨ ਦੀ ਵਿਧੀ', sacredMantra: 'ਪਵਿੱਤਰ ਮੰਤਰ', shareObservance: 'ਇਸ ਵਰਤ ਨੂੰ ਸਾਂਝਾ ਕਰੋ',
  library: 'ਪੁਸਤਕਾਲਾ', timer: 'ਟਾਈਮਰ', mixer: 'ਮਿਕਸਰ', deepMeaning: 'ਡੂੰਘਾ ਅਰਥ',
  dailyApp: 'ਰੋਜ਼ਾਨਾ ਅਭਿਆਸ', listen: 'ਸੁਣੋ', copy: 'ਕਾਪੀ ਕਰੋ', askAI: 'AI ਨੂੰ ਪੁੱਛੋ',
  transliteration: 'ਲਿਪੀਅੰਤਰਨ', currentKanda: 'ਵਰਤਮਾਨ ਕਾਂਡ', featuredPassages: 'ਪ੍ਰਮੁੱਖ ਸ਼ਲੋਕ',
  continueLesson: 'ਪਾਠ ਜਾਰੀ ਰੱਖੋ', viewDetails: 'ਵੇਰਵੇ ਵੇਖੋ', syllabus: 'ਸਿਲੇਬਸ',
  enrolled: 'ਦਾਖਲ ਹੋਏ', complete: 'ਪੂਰਾ ਹੋਇਆ', beginReading: 'ਪੜ੍ਹਨਾ ਸ਼ੁਰੂ ਕਰੋ', exploreAll: 'ਸਭ ਵੇਖੋ',
  // Brand
  brandTagline: 'ਸੁੰਨ ਵਿੱਚ ਅਨੰਤ',
  // Sacred Pulse
  pulseEkadashi: 'ਇਕਾਦਸ਼ੀ',
  pulseEkadashiDesc: 'ਵਰਤ ਅਤੇ ਡੂੰਘੇ ਭਜਨ ਲਈ ਪਵਿੱਤਰ ਦਿਨ।',
  pulsePurnima: 'ਪੂਰਨਮਾਸ਼ੀ',
  pulsePurnimaDesc: 'ਪੂਰਾ ਚੰਦਰਮਾ — ਸਪੱਸ਼ਟਤਾ ਅਤੇ ਭਾਈਚਾਰਕ ਪੂਜਾ।',
  pulseAmavasya: 'ਮੱਸਿਆ',
  pulseAmavasyaDesc: 'ਨਵਾਂ ਚੰਦਰਮਾ — ਪੁਰਖਿਆਂ ਦੀ ਯਾਦ ਅਤੇ ਸ਼ਾਂਤੀ।',
  pulsePradosh: 'ਪ੍ਰਦੋਸ਼',
  pulsePradoshDesc: 'ਭਗਵਾਨ ਸ਼ਿਵ ਦੀ ਸੰਧਿਆ ਉਪਾਸਨਾ।',
  pulseShivaratri: 'ਮਾਸਿਕ ਸ਼ਿਵਰਾਤਰੀ',
  pulseShivaratriDesc: 'ਸ਼ਿਵ ਦੀ ਰਾਤ — ਜਾਗਰਣ ਅਤੇ ਭਗਤੀ।',
  pulseSangrand: 'ਸੰਗਰਾਂਦ',
  pulseSangrandDesc: 'ਮਹੀਨੇ ਦਾ ਪਹਿਲਾ ਦਿਨ — ਨਵੀਂ ਸ਼ੁਰੂਆਤ ਦਾ ਦਿਨ।',
  pulseUposatha: 'ਉਪੋਸਥ',
  pulseUposathaDesc: 'ਚੰਦਰ ਅਵਲੋਕਨ — ਡੂੰਘੇ ਅਭਿਆਸ ਦਾ ਦਿਨ।',
  pulseAshtamiChaturdashi: 'ਅਸ਼ਟਮੀ/ਚਤੁਰਦਸ਼ੀ',
  pulseAshtamiChaturdashiDesc: 'ਵਰਤ ਅਤੇ ਤੱਤਵਾਰਥ ਅਧਿਐਨ ਲਈ ਸ਼ੁਭ ਦਿਨ।',
  // Kul
  kulTitle: 'ਕੁਲ — ਜੀਵਤ ਵੰਸ਼ਾਵਲੀ',
  kulVanshTitle: 'ਕੁਲ ਬ੍ਰਿਛ',
  kulLivingLineage: 'ਜੀਵਤ ਵੰਸ਼ਾਵਲੀ',
  kulHeritageQuote: 'ਜਿਵੇਂ ਜੜ੍ਹਾਂ ਡੂੰਘੀਆਂ ਹੁੰਦੀਆਂ ਹਨ, ਤਿਵੇਂ ਰੁੱਖ ਮਜ਼ਬੂਤੀ ਨਾਲ ਖੜ੍ਹਾ ਰਹਿੰਦਾ ਹੈ। ਤੁਹਾਡਾ ਵੰਸ਼ ਉਹ ਪਵਿੱਤਰ ਮਿੱਟੀ ਹੈ ਜਿਸ ਤੋਂ ਤੁਹਾਡੀ ਆਤਮਾ ਵਿਕਸਤ ਹੁੰਦੀ ਹੈ।',
  kulVanshEmptyTitle: 'ਅਜੇ ਕੋਈ ਵੰਸ਼ ਨਹੀਂ ਲਿਖਿਆ ਗਿਆ',
  kulVanshEmptyDesc: 'ਆਪਣੀ ਅਧਿਆਤਮਿਕ ਵਿਰਾਸਤ ਦਾ ਨਕਸ਼ਾ ਬਣਾਉਣਾ ਸ਼ੁਰੂ ਕਰਨ ਲਈ ਆਪਣੇ ਪੁਰਖਿਆਂ ਅਤੇ ਪਰਿਵਾਰਕ ਮੈਂਬਰਾਂ ਨੂੰ ਸ਼ਾਮਲ ਕਰੋ।',
  kulCreateFirstBranch: 'ਪਹਿਲੀ ਸ਼ਾਖਾ ਬਣਾਓ',
  kulBackToHub: 'ਹੱਬ ਤੇ ਵਾਪਸ ਜਾਓ',
  kulInviteLabel: 'ਸੱਦਾ ਕੋਡ',
  kulTasksTitle: 'ਕੁਲ ਕਾਰਜ',
  kulMembersTitle: 'ਕੁਲ ਮੈਂਬਰ',
  kulSabhaTitle: 'ਕੁਲ ਸਭਾ',
  kulVanshTitleLong: 'ਵੰਸ਼ਾਵਲੀ ਰੁੱਖ',
  kulEventsTitle: 'ਕੁਲ ਸਮਾਗਮ',
  kulAddMember: 'ਵੰਸ਼ ਵਿੱਚ ਸ਼ਾਮਲ ਕਰੋ',
  kulEditMember: 'ਵੰਸ਼ ਸੁਧਾਰੋ',
  kulFullName: 'ਪੂਰਾ ਨਾਮ',
  kulRelationship: 'ਰਿਸ਼ਤਾ',
  kulGender: 'ਲਿੰਗ',
  kulBirthDate: 'ਜਨਮ ਮਿਤੀ',
  kulBirthYear: 'ਜਨਮ ਸਾਲ',
  kulBirthPlace: 'ਜਨਮ ਸਥਾਨ',
  kulBirthPlaceDesc: 'ਪੀੜ੍ਹੀਆਂ ਤੱਕ ਜੜ੍ਹਾਂ ਦਾ ਪਤਾ ਲਗਾਉਣ ਵਿੱਚ ਮਦਦ ਕਰਦਾ ਹੈ।',
  kulIsAlive: 'ਜੀਵਤ ਹਨ',
  kulIsAliveDesc: 'ਰਿਸ਼ਤੇਦਾਰ ਦੀ ਸਥਿਤੀ ਬਦਲੋ',
  kulLinkParent: 'ਮਾਤਾ-ਪਿਤਾ ਨਾਲ ਜੋੜੋ',
  kulLinkSpouse: 'ਜੀਵਨ ਸਾਥੀ ਨਾਲ ਜੋੜੋ',
  kulEnterIntoVansh: 'ਵੰਸ਼ ਵਿੱਚ ਦਾਖਲ ਹੋਵੋ',
  kulUpdateVansh: 'ਵੰਸ਼ ਅਪਡੇਟ ਕਰੋ',
  kulRefineLineage: 'ਵੰਸ਼ ਸੁਧਾਰੋ',
  kulBuildingEternal: 'ਸਦੀਵੀ ਪਰਿਵਾਰਕ ਰੁੱਖ ਦਾ ਨਿਰਮਾਣ',
  kulAncestralLinks: 'ਪੁਰਖਿਆਂ ਦੇ ਲਿੰਕ',
  kulOriginLife: 'ਮੂਲ ਅਤੇ ਜੀਵਨ',
  kulBasicIdentity: 'ਮੂਲ ਪਛਾਣ',
  shivaM: 'ਸ਼ਿਵ (ਪੁਰਖ)',
  shaktiF: 'ਸ਼ਕਤੀ (ਇਸਤਰੀ)',
  kulChangeCover: 'ਕਵਰ ਬਦਲੋ',
  kulLineageOf: 'ਵੰਸ਼:',
  kulFamilyAltar: 'ਪਰਿਵਾਰਕ ਵੇਦੀ',
  kulProtected: 'ਸੁਰੱਖਿਅਤ',
  kulOpenSection: 'ਇੱਕ ਭਾਗ ਖੋਲ੍ਹੋ',
  kulNextDateIn: 'ਅਗਲੀ ਮਿਤੀ:',
  kulDays: 'ਦਿਨ',
  gen1: 'ਪੜਦਾਦਾ-ਪੜਦਾਦੀ',
  gen2: 'ਦਾਦਾ-ਦਾਦੀ',
  gen3: 'ਮਾਤਾ-ਪਿਤਾ',
  gen4: 'ਵਰਤਮਾਨ ਪੀੜ੍ਹੀ',
  gen5: 'ਬੱਚੇ',
  gen6: 'ਪੋਤੇ-ਪੋਤੀਆਂ',
  kulAge: 'ਉਮਰ',
  kulLived: 'ਜੀਵਨ ਕਾਲ',
  kulInEternalMemory: 'ਅਮਰ ਯਾਦ ਵਿਚ',
  kulYearsAbbrev: 'ਸਾਲ',
  kulNoKulTitle: 'ਆਪਣੀ ਵੰਸ਼ਾਵਲੀ ਸ਼ੁਰੂ ਕਰੋ',
  kulNoKulDesc: 'ਇੱਕ ਕੁਲ ਇੱਕ ਪਵਿੱਤਰ ਪਰਿਵਾਰਕ ਘੇਰਾ ਹੈ ਜਿੱਥੇ ਤੁਸੀਂ ਆਪਣੀਆਂ ਪਰੰਪਰਾਵਾਂ ਨੂੰ ਸੰਭਾਲਦੇ ਹੋ, ਆਪਣੇ ਵੰਸ਼ (ਰੁੱਖ) ਨੂੰ ਟ੍ਰੈਕ ਕਰਦੇ ਹੋ, ਅਤੇ ਇਕੱਠੇ ਅਭਿਆਸ ਕਰਦੇ ਹੋ।',
  kulCreateNew: 'ਇੱਕ ਨਵਾਂ ਕੁਲ ਬਣਾਓ',
  kulCreateNewDesc: 'ਆਪਣਾ ਪਰਿਵਾਰਕ ਘੇਰਾ ਸ਼ੁਰੂ ਕਰੋ ਅਤੇ ਹੋਰਨਾਂ ਨੂੰ ਸੱਦਾ ਦਿਓ।',
  kulJoinExisting: 'ਮੌਜੂਦਾ ਕੁਲ ਵਿੱਚ ਸ਼ਾਮਲ ਹੋਵੋ',
  kulJoinExistingDesc: 'ਪਰਿਵਾਰਕ ਸਰਪ੍ਰਸਤ ਤੋਂ ਉਨ੍ਹਾਂ ਦਾ ਸੱਦਾ ਕੋਡ ਮੰਗੋ।',
  kulFamilyName: 'ਪਰਿਵਾਰ ਦਾ ਨਾਮ',
  kulEstablishLineage: 'ਵੰਸ਼ ਦੀ ਸਥਾਪਨਾ ਕਰੋ',
  kulEnterInviteCode: 'ਸੱਦਾ ਕੋਡ ਦਰਜ ਕਰੋ',
  kulPrivateTrust: 'ਵੰਸ਼ਾਵਲੀ ਵਿਸ਼ਵਾਸ ਦੇ ਨਿੱਜੀ ਘੇਰੇ ਹੁੰਦੇ ਹਨ।',
  kulEnterTheKul: 'ਕੁਲ ਵਿੱਚ ਦਾਖਲ ਹੋਵੋ',
  kulCareCircle: 'ਸੇਵਾ ਘੇਰਾ',
  kulCareCircleDesc: 'ਉਹ ਦਿਲ ਜੋ ਇਸ ਵੰਸ਼ ਨੂੰ ਬਣਾਈ ਰੱਖਦੇ ਹਨ।',
  kulFamilyMemberDefault: 'ਪਰਿਵਾਰਕ ਮੈਂਬਰ',
  kulTasksDesc: 'ਸਾਂਝੇ ਅਭਿਆਸ ਅਤੇ ਵਚਨਬੱਧਤਾਵਾਂ।',
  kulAddTask: 'ਕੰਮ ਸ਼ਾਮਲ ਕਰੋ',
  kulPending: 'ਬਾਕੀ',
  kulCompleted: 'ਪੂਰਾ ਹੋਇਆ',
  kulNoTasksFound: 'ਕੋਈ ਕੰਮ ਨਹੀਂ ਮਿਲਿਆ।',
  kulAssignedToAll: 'ਸਾਰਿਆਂ ਨੂੰ ਸੌਂਪਿਆ ਗਿਆ',
  kulSabhaDesc: 'ਪਰਿਵਾਰਕ ਕੌਂਸਲ ਚੈਟ',
  kulSabhaPlaceholder: 'ਪਰਿਵਾਰਕ ਕੌਂਸਲ ਨੂੰ ਲਿਖੋ…',
  kulMembersEyebrow: 'ਸੇਵਾ ਘੇਰਾ',
  kulTasksEyebrow: 'ਮਿਲ ਕੇ ਕਰੋ',
  kulSabhaEyebrow: 'ਪਰਿਵਾਰਕ ਗੱਲਬਾਤ',
  kulVanshEyebrow: 'ਵੰਸ਼ਾਵਲੀ',
  kulEventsEyebrow: 'ਪੂਜਾ ਅਤੇ ਹੋਰ',
  kulEventsLabel: 'ਪਰਿਵਾਰਕ ਤਾਰੀਖਾਂ',
  kulEventsDesc: 'ਮਹੱਤਵਪੂਰਨ ਮੀਲ ਪੱਥਰ ਅਤੇ ਪਾਲਣਾ।',
  kulAddEvent: 'ਈਵੈਂਟ ਸ਼ਾਮਲ ਕਰੋ',
  kulNoEventsFound: 'ਕੋਈ ਆਉਣ ਵਾਲਾ ਈਵੈਂਟ ਨਹੀਂ ਮਿਲਿਆ।',
  kulInDays: '{days} ਦਿਨਾਂ ਵਿੱਚ',
  kulAnnual: 'ਸਾਲਾਨਾ',
  kulSanskaraSubtitle: 'ਸ਼ੋਡਸ਼ ਸੰਸਕਾਰ',
  kulSanskaraTitle: '16 ਪਵਿੱਤਰ ਰੀਤੀ-ਰਿਵਾਜ',
  kulSanskaraQuote: 'ਗਰਭ ਤੋਂ ਮੁਕਤੀ ਤੱਕ, ਸੰਸਕਾਰ ਉਹ ਪਵਿੱਤਰ ਤਬਦੀਲੀਆਂ ਹਨ ਜੋ ਮਨੁੱਖੀ ਆਤਮਾ ਨੂੰ ਸ਼ੁੱਧ ਕਰਦੀਆਂ ਹਨ ਅਤੇ ਇਸਨੂੰ ਧਰਮ ਦੇ ਅਨੁਕੂਲ ਬਣਾਉਂਦੀਆਂ ਹਨ।',
  kulComingSoon: 'ਪਰਿਵਾਰਕ ਸੰਸਕਾਰਾਂ ਲਈ ਟ੍ਰੈਕਿੰਗ ਵਿਸ਼ੇਸ਼ਤਾ ਅਗਲੇ ਅਪਡੇਟ ਵਿੱਚ ਜਲਦੀ ਆ ਰਹੀ ਹੈ।',
  s1: 'ਗਰਭਾਧਾਨ', s1d: 'ਗਰਭਾਧਾਨ — ਜੀਵਨ ਲਿਆਉਣ ਦਾ ਪਵਿੱਤਰ ਰੀਤੀ-ਰਿਵਾਜ।',
  s2: 'ਪੁੰਸਵਨ', s2d: 'ਗਰਭ ਦੀ ਰੱਖਿਆ — ਅਣਜੰਮੇ ਬੱਚੇ ਦੀ ਸਿਹਤ ਨੂੰ ਯਕੀਨੀ ਬਣਾਉਣ ਲਈ।',
  s3: 'ਸੀਮੰਤੋਨਯਨ', s3d: 'ਸੀਮੰਤੋਨਯਨ — ਮਾਂ ਅਤੇ ਬੱਚੇ ਦੀ ਸੁਰੱਖਿਆ।',
  s4: 'ਜਾਤਕਰਮ', s4d: 'ਜਨਮ ਦੇ ਰੀਤੀ-ਰਿਵਾਜ — ਨਵੇਂ ਮੈਂਬਰ ਦਾ ਵੰਸ਼ ਵਿੱਚ ਸਵਾਗਤ।',
  s5: 'ਨਾਮਕਰਨ', s5d: 'ਨਾਮਕਰਨ — ਪਵਿੱਤਰ ਪਛਾਣ ਪ੍ਰਦਾਨ ਕਰਨਾ।',
  s6: 'ਨਿਸ਼ਕ੍ਰਮਣ', s6d: 'ਪਹਿਲੀ ਸੈਰ — ਬੱਚਾ ਸੂਰਜ ਅਤੇ ਦੁਨੀਆ ਨਾਲ ਮਿਲਦਾ ਹੈ।',
  s7: 'ਅੰਨਪ੍ਰਾਸ਼ਨ', s7d: 'ਪਹਿਲਾ ਠੋਸ ਭੋਜਨ — ਅੰਦਰੂਨੀ ਬ੍ਰਹਮ ਅਗਨੀ ਨੂੰ ਤ੍ਰਿਪਤ ਕਰਨਾ।',
  s8: 'ਚੂੜਾਕਰਮ', s8d: 'ਮੁੰਡਨ — ਸ਼ੁੱਧਤਾ ਦੀ ਨਿਸ਼ਾਨੀ।',
  s9: 'ਕਰਣਵੇਧ', s9d: 'ਕੰਨ ਵਿੰਨ੍ਹਣਾ — ਗਿਆਨ ਦੇ ਦਰਵਾਜ਼ੇ ਖੋਲ੍ਹਣਾ।',
  s10: 'ਵਿਦਿਆਰੰਭ', s10d: 'ਗਿਆਨ ਦੀ ਸ਼ੁਰੂਆਤ — ਪਹਿਲਾ ਪਾਠ।',
  s11: 'ਉਪਨਯਨ', s11d: 'ਜਨੇਊ ਸੰਸਕਾਰ — ਅਧਿਐਨ ਦੀ ਦੁਨੀਆ ਵਿੱਚ ਪ੍ਰਵੇਸ਼।',
  s12: 'ਵੇਦਾਰੰਭ', s12d: 'ਵੇਦਾਂ ਦੀ ਸ਼ੁਰੂਆਤ — ਧਰਮ ਵਿੱਚ ਡੂੰਘੀ ਡੁਬਕੀ।',
  s13: 'ਕੇਸ਼ਾਂਤ', s13d: 'ਪਹਿਲੀ ਸ਼ੇਵ — ਜਵਾਨੀ ਵਿੱਚ ਤਬਦੀਲੀ।',
  s14: 'ਸਮਾਵਰਤਨ', s14d: 'ਗ੍ਰੈਜੂਏਸ਼ਨ — ਅਧਿਐਨ ਤੋਂ ਬਾਅਦ ਗੁਰੂ ਤੋਂ ਵਾਪਸੀ।',
  s15: 'ਵਿਵਾਹ', s15d: 'ਵਿਆਹ — ਗ੍ਰਹਿਸਥ ਜੀਵਨ ਵਿੱਚ ਪ੍ਰਵੇਸ਼।',
  s16: 'ਅੰਤਿਮ ਸੰਸਕਾਰ', s16d: 'ਅੰਤਿਮ ਸੰਸਕਾਰ — ਅਗਨੀ ਨੂੰ ਅੰਤਿਮ ਭੇਟ।',
  kulNamePlaceholder: 'ਕੁਲ ਦਾ ਨਾਮ ਦਰਜ ਕਰੋ…',
};

export const TRANSLATIONS: Record<AppLang, TranslationMap> = { en, hi, pa };

/** Resolve a translation key for the given language, falling back to English. */
export function t(lang: AppLang, key: TranslationKey): string {
  return TRANSLATIONS[lang]?.[key] ?? TRANSLATIONS.en[key] ?? key;
}
