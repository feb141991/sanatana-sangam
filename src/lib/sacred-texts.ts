/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Sanatana Sangam — Tradition-Aware Daily Sacred Texts
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Shabads for Sikh · Dhamma verses for Buddhist · Sutras for Jain
 * Hindu shlokas live in shlokas.ts and are handled separately.
 *
 * Usage:
 *   import { getDailySacredText } from '@/lib/sacred-texts';
 *   const text = getDailySacredText('sikh', dayOfYear);
 * ─────────────────────────────────────────────────────────────────────────────
 */

export interface SacredText {
  id:              number;
  tradition:       string;
  /** Script text — Gurmukhi / Devanagari (Pali) / Ardhamagadhi */
  original:        string;
  transliteration: string;
  meaning:         string;
  source:          string;
}

// ─── Sikh Shabads ─────────────────────────────────────────────────────────────

export const SHABADS: SacredText[] = [
  {
    id: 1,
    tradition: 'sikh',
    original: 'ਇਕ ਓਅੰਕਾਰ ਸਤਿ ਨਾਮੁ ਕਰਤਾ ਪੁਰਖੁ ਨਿਰਭਉ ਨਿਰਵੈਰੁ ਅਕਾਲ ਮੂਰਤਿ ਅਜੂਨੀ ਸੈਭੰ ਗੁਰ ਪ੍ਰਸਾਦਿ',
    transliteration: 'Ik Onkaar, Sat Naam, Kartaa Purakh, Nirbhau, Nirvair, Akaal Moorat, Ajooni Saibhang, Gur Prasaad.',
    meaning: 'One Universal Creator, the True Name, the Creative Being, without fear, without enmity, undying in form, beyond birth, self-existent — by Guru\'s grace.',
    source: 'Mool Mantar — Sri Guru Granth Sahib, Ang 1',
  },
  {
    id: 2,
    tradition: 'sikh',
    original: 'ਸਭੁ ਕੋ ਊਚਾ ਆਖੀਐ ਨੀਚੁ ਨ ਦੀਸੈ ਕੋਇ ॥',
    transliteration: 'Sabh ko ouchaa aakheeai, neech na deesai koe.',
    meaning: 'Call everyone exalted — none appears to be low. The one priceless jewel is within all; who then can be called low?',
    source: 'Sri Guru Granth Sahib, Ang 62',
  },
  {
    id: 3,
    tradition: 'sikh',
    original: 'ਨਾਨਕ ਨਾਮੁ ਚੜਦੀ ਕਲਾ ਤੇਰੇ ਭਾਣੇ ਸਰਬੱਤ ਦਾ ਭਲਾ ॥',
    transliteration: 'Nanak Naam chardi kalaa, tere bhaane sarbatt da bhalaa.',
    meaning: 'O Nanak, may the Name be ever in ascendance; by Your Will may all of humanity prosper.',
    source: 'Ardas — Sri Guru Granth Sahib',
  },
  {
    id: 4,
    tradition: 'sikh',
    original: 'ਹੁਕਮੈ ਅੰਦਰਿ ਸਭੁ ਕੋ ਬਾਹਰਿ ਹੁਕਮ ਨ ਕੋਇ ॥',
    transliteration: 'Hukmai andar sabh ko, baahar hukam na koe.',
    meaning: 'Everything is within the Hukam (Divine Will); nothing stands outside of His Command.',
    source: 'Sri Guru Granth Sahib, Japji Sahib — Ang 1',
  },
  {
    id: 5,
    tradition: 'sikh',
    original: 'ਸੇਵਾ ਕਰਤ ਹੋਇ ਨਿਹਕਾਮੀ ॥ ਤਿਸ ਕਉ ਹੋਤ ਪਰਾਪਤਿ ਸੁਆਮੀ ॥',
    transliteration: 'Sevaa karat hoe nihkaamee, tis kau hot praapat suaamee.',
    meaning: 'One who performs selfless service, without thought of reward, attains the Master.',
    source: 'Sri Guru Granth Sahib, Ang 286',
  },
  {
    id: 6,
    tradition: 'sikh',
    original: 'ਸਾਚਾ ਸਾਹਿਬੁ ਸਾਚੁ ਨਾਇ ਭਾਖਿਆ ਭਾਉ ਅਪਾਰੁ ॥',
    transliteration: 'Saachaa saahib saach naae, bhaakhiaa bhaau apaar.',
    meaning: 'The True Master has a True Name; speaking of Him, the love within is infinite.',
    source: 'Sri Guru Granth Sahib, Ang 2',
  },
  {
    id: 7,
    tradition: 'sikh',
    original: 'ਮਨ ਤੂੰ ਜੋਤਿ ਸਰੂਪੁ ਹੈ ਆਪਣਾ ਮੂਲੁ ਪਛਾਣੁ ॥',
    transliteration: 'Man toon jot saroop hai, aapnaa mool pachhaan.',
    meaning: 'O mind, you are the embodiment of Divine Light — recognise your own origin.',
    source: 'Sri Guru Granth Sahib, Ang 441',
  },
  {
    id: 8,
    tradition: 'sikh',
    original: 'ਨਾਨਕ ਦੁਖੀਆ ਸਭੁ ਸੰਸਾਰੁ ॥ ਸੁਖੀਆ ਸੋ ਜਿ ਨਾਮਿ ਲਗਾਰੁ ॥',
    transliteration: 'Nanak dukheea sabh sansaar, sukheea so jio naam lagaar.',
    meaning: 'Nanak says: the whole world is in pain; only those who are attached to the Name find peace.',
    source: 'Sri Guru Granth Sahib, Ang 954',
  },
];

// ─── Buddhist Dhamma Verses ───────────────────────────────────────────────────

export const DHAMMA_VERSES: SacredText[] = [
  {
    id: 1,
    tradition: 'buddhist',
    original: 'मनो-पुब्बङ्गमा धम्मा मनो-सेट्ठा मनो-मया।\nमनसा चे पदुट्ठेन भासति वा करोति वा।\nततो नं दुक्खमन्वेति चक्कं व वहतो पदं॥',
    transliteration: 'Mano-pubbaṅgamā dhammā, mano-seṭṭhā manomayā.\nManasā ce paduṭṭhena bhāsati vā karoti vā,\ntato naṃ dukkham anveti cakkaṃ va vahato padaṃ.',
    meaning: 'Mind is the forerunner of all actions. All deeds are led by mind, created by mind. If one speaks or acts with a corrupt mind, suffering follows as the wheel follows the hoof of an ox.',
    source: 'Dhammapada, Verse 1',
  },
  {
    id: 2,
    tradition: 'buddhist',
    original: 'मनो-पुब्बङ्गमा धम्मा मनो-सेट्ठा मनो-मया।\nमनसा चे पसन्नेन भासति वा करोति वा।\nततो नं सुखमन्वेति छाया व अनपायिनी॥',
    transliteration: 'Mano-pubbaṅgamā dhammā, mano-seṭṭhā manomayā.\nManasā ce pasannena bhāsati vā karoti vā,\ntato naṃ sukham anveti chāyā va anapāyinī.',
    meaning: 'Mind is the forerunner of all actions. If one speaks or acts with a serene mind, happiness follows as a shadow that never departs.',
    source: 'Dhammapada, Verse 2',
  },
  {
    id: 3,
    tradition: 'buddhist',
    original: 'सब्बे सत्ता सुखिता होन्तु।\nसब्बे सत्ता अव्वेरा होन्तु।\nसब्बे सत्ता अब्याबज्झा होन्तु।\nसब्बे सत्ता सुखी अत्तानं परिहरन्तु॥',
    transliteration: 'Sabbe sattā sukhitā hontu.\nSabbe sattā averā hontu.\nSabbe sattā abyāpajjhā hontu.\nSabbe sattā sukhī attānaṃ pariharantu.',
    meaning: 'May all beings be happy. May all beings be free from enmity. May all beings be free from suffering. May all beings keep themselves free from harm.',
    source: 'Metta Sutta — Sutta Nipāta',
  },
  {
    id: 4,
    tradition: 'buddhist',
    original: 'बुद्धं शरणं गच्छामि।\nधम्मं शरणं गच्छामि।\nसङ्घं शरणं गच्छामि॥',
    transliteration: 'Buddhaṃ saraṇaṃ gacchāmi.\nDhammaṃ saraṇaṃ gacchāmi.\nSaṅghaṃ saraṇaṃ gacchāmi.',
    meaning: 'I go to the Buddha for refuge. I go to the Dhamma for refuge. I go to the Sangha for refuge. — the foundation of Buddhist practice.',
    source: 'Tisaraṇa — The Three Refuges',
  },
  {
    id: 5,
    tradition: 'buddhist',
    original: 'अनिच्चा वत सङ्खारा उप्पादवयधम्मिनो।\nउप्पज्जित्वा निरुज्झन्ति तेसं वूपसमो सुखो॥',
    transliteration: 'Aniccā vata saṅkhārā, uppādavaya dhammino.\nUppajjitvā nirujjhanti, tesaṃ vūpasamo sukho.',
    meaning: 'Impermanent indeed are all conditioned things — arising and passing. When one sees this with wisdom, one turns away from suffering. This is bliss.',
    source: 'Dhammapada, Verse 277',
  },
  {
    id: 6,
    tradition: 'buddhist',
    original: 'अप्पमादो अमतपदं पमादो मच्चुनो पदं।\nअप्पमत्ता न मीयन्ति ये पमत्ता यथा मता॥',
    transliteration: 'Appamādo amatapadaṃ, pamādo maccuno padaṃ.\nAppamattā na mīyanti, ye pamattā yathā matā.',
    meaning: 'Heedfulness is the path to the deathless; heedlessness is the path to death. The heedful do not die; the heedless are as if already dead.',
    source: 'Dhammapada, Verse 21',
  },
  {
    id: 7,
    tradition: 'buddhist',
    original: 'करणीयमत्थकुसलेन यन्तं सन्तं पदं अभिसमेच्च।\nसक्को उजू च सुहुजू च सुवचो चस्स मुदु अनतिमानी॥',
    transliteration: 'Karaṇīyam atthakusalena yan taṃ santaṃ padaṃ abhisamecca.\nSakko ujū ca suhujū ca suvaco cassa mudu anatimānī.',
    meaning: 'This is what should be done by one skilled in goodness who knows the peaceful state: be capable, upright, straightforwardly upright, easy to speak to, gentle and not proud.',
    source: 'Karaṇīya Mettā Sutta',
  },
  {
    id: 8,
    tradition: 'buddhist',
    original: 'नत्थि सन्ति परं सुखं।',
    transliteration: 'Natthi santi paraṃ sukhaṃ.',
    meaning: 'There is no happiness greater than peace of mind.',
    source: 'Dhammapada, Verse 203',
  },
];

// ─── Jain Sutras ──────────────────────────────────────────────────────────────

export const JAIN_SUTRAS: SacredText[] = [
  {
    id: 1,
    tradition: 'jain',
    original: 'णमो अरिहंताणं। णमो सिद्धाणं। णमो आयरियाणं।\nणमो उवज्झायाणं। णमो लोए सव्व साहूणं॥',
    transliteration: 'Namo Arihantāṇaṃ. Namo Siddhāṇaṃ. Namo Āyariyāṇaṃ.\nNamo Uvajjhāyāṇaṃ. Namo loe savva sāhūṇaṃ.',
    meaning: 'I bow to the Arihantas (perfected souls). I bow to the Siddhas (liberated souls). I bow to the Acharyas (masters). I bow to the Upadhyayas (teachers). I bow to all the monks in the world.',
    source: 'Namokar Mantra — the most sacred Jain prayer',
  },
  {
    id: 2,
    tradition: 'jain',
    original: 'अहिंसा परमो धर्मः।',
    transliteration: 'Ahiṃsā paramo dharmaḥ.',
    meaning: 'Non-violence is the supreme dharma — the highest principle of Jain ethics and the foundation of all moral life.',
    source: 'Jain Teaching — Mahavira, Ācarāṅga Sūtra',
  },
  {
    id: 3,
    tradition: 'jain',
    original: 'सव्वे जीवा वि इच्छंति जीविउं न मरिज्जिउं।\nतम्हा पाणाइवायं पज्जुवासह॥',
    transliteration: 'Savve jīvā vi icchanti jīvium na marijjium.\nTamhā pāṇāivāyaṃ pajjuvāsaha.',
    meaning: 'All living beings wish to live, not to die. Recognising this truth, do not harm any living being.',
    source: 'Ācarāṅga Sūtra — Mahavira\'s teaching',
  },
  {
    id: 4,
    tradition: 'jain',
    original: 'अप्पाणमेव जाणाहि। एवं णाणस्स णाणं॥',
    transliteration: 'Appāṇam eva jāṇāhi. Evaṃ ṇāṇassa ṇāṇaṃ.',
    meaning: 'Know thyself — this is the highest knowledge. The path to liberation begins with self-knowledge and inner purification.',
    source: 'Uttarādhyayana Sūtra',
  },
  {
    id: 5,
    tradition: 'jain',
    original: 'मिच्छामि दुक्कडं।',
    transliteration: 'Miccāmi dukkaḍaṃ.',
    meaning: 'May all the evil I have done be in vain — the Jain prayer of forgiveness offered to all beings, seeking to dissolve past hurts and begin anew.',
    source: 'Jain Samvatsari Prayer — day of universal forgiveness',
  },
  {
    id: 6,
    tradition: 'jain',
    original: 'परस्परोपग्रहो जीवानाम्।',
    transliteration: 'Parasparopagṛaho jīvānām.',
    meaning: 'Souls render service to one another — the principle of interdependence and mutual support among all living beings.',
    source: 'Tattvartha Sūtra 5.21 — Umasvati',
  },
  {
    id: 7,
    tradition: 'jain',
    original: 'जीव! तुमेव तुमं मित्तं किं बाहिरं इच्छसि?\nजीव! तुमेव तुमं सत्तू किं बाहिरं पज्जुवासि?',
    transliteration: 'Jīva! Tumeva tumaṃ mittaṃ, kiṃ bāhiraṃ icchasi?\nJīva! Tumeva tumaṃ sattū, kiṃ bāhiraṃ pajjuvāsi?',
    meaning: 'O soul! You yourself are your own friend — why do you seek friendship outside? O soul! You yourself are your own enemy — why do you search for enemies outside?',
    source: 'Uttarādhyayana Sūtra',
  },
];

// ─── Exploring / neutral daily wisdom ─────────────────────────────────────────

export const DAILY_WISDOM_TEXTS: SacredText[] = [
  {
    id: 1,
    tradition: 'other',
    original: 'वसुधैव कुटुम्बकम्।',
    transliteration: 'Vasudhaiva kuṭumbakam.',
    meaning: 'The whole world is one family — a simple dharmic reminder to act with kinship and dignity toward all beings.',
    source: 'Mahopaniṣad 6.72',
  },
  {
    id: 2,
    tradition: 'other',
    original: 'अहिंसा परमो धर्मः।',
    transliteration: 'Ahiṃsā paramo dharmaḥ.',
    meaning: 'Non-violence is the highest dharma — a shared ethical foundation across dharmic traditions.',
    source: 'Dharmic teaching',
  },
  {
    id: 3,
    tradition: 'other',
    original: 'सर्वे भवन्तु सुखिनः। सर्वे सन्तु निरामयाः।',
    transliteration: 'Sarve bhavantu sukhinaḥ. Sarve santu nirāmayāḥ.',
    meaning: 'May all be happy. May all be free from illness. A universal prayer for collective wellbeing.',
    source: 'Shanti mantra',
  },
];

// ─── Unified daily text picker ────────────────────────────────────────────────

export interface DailySacredText {
  original:        string;
  transliteration: string;
  meaning:         string;
  source:          string;
}

/**
 * Pick the daily sacred text for non-Hindu and exploring paths.
 * Uses dayIndex (0-based day of year) for daily rotation.
 * Returns null only for explicit Hindu (uses SHLOKAS from shlokas.ts instead).
 */
export function getDailySacredText(
  tradition: string | null,
  dayIndex: number,
): DailySacredText | null {
  switch (tradition) {
    case 'sikh': {
      const e = SHABADS[dayIndex % SHABADS.length];
      return { original: e.original, transliteration: e.transliteration, meaning: e.meaning, source: e.source };
    }
    case 'buddhist': {
      const e = DHAMMA_VERSES[dayIndex % DHAMMA_VERSES.length];
      return { original: e.original, transliteration: e.transliteration, meaning: e.meaning, source: e.source };
    }
    case 'jain': {
      const e = JAIN_SUTRAS[dayIndex % JAIN_SUTRAS.length];
      return { original: e.original, transliteration: e.transliteration, meaning: e.meaning, source: e.source };
    }
    case 'other':
    case null: {
      const e = DAILY_WISDOM_TEXTS[dayIndex % DAILY_WISDOM_TEXTS.length];
      return { original: e.original, transliteration: e.transliteration, meaning: e.meaning, source: e.source };
    }
    default:
      return null; // Explicit Hindu uses shlokas.ts
  }
}

/** Get 0-based day-of-year for daily rotation */
export function getDayOfYear(date: Date = new Date()): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff  = date.getTime() - start.getTime();
  return Math.floor(diff / 86_400_000);
}
