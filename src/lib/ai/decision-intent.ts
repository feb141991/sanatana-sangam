/**
 * Decision-grade questions get one fixed answer, never a generated one.
 *
 * "Which day is best for our wedding?", "give me a muhurta for the housewarming", "is Tuesday good to launch my
 * business?" are questions people act on with money, family and years behind them. The right date depends on the charts
 * of the people involved, the family's tradition and the place, and Shoonaya's calendar does not compute muhurtas. A
 * language model asked this will produce a confident date, a different one each time, and invented reasoning for it
 * (a breach of the "never fabricate a ritual rule or present a final date" rules).
 *
 * So these are recognised before the model is called and answered with the same text every time, in the person's
 * language. The text names what Shoonaya does show (the city-aware Panchang and Sacred Days) and sends the date
 * decision to a qualified person. It states no doctrine about any tradition, no date and no time.
 *
 * Detection is deliberately narrow: it needs a life event or the word muhurta AND words asking to choose or fix a date.
 * "What is a muhurta?" and "what is the meaning of the wedding ritual?" are ordinary questions and go to the model.
 */

export type DecisionTopic = 'marriage' | 'home' | 'business' | 'travel_or_start' | 'muhurta';

const EVENT: Array<[DecisionTopic, RegExp]> = [
  ['marriage', /\b(wedding|marriage|marry|engagement|betrothal|vivah|shaadi|shadi|roka|sagai|anand karaj|nikah)\b|विवाह|शादी|सगाई|रोका|ਵਿਆਹ|ਸ਼ਾਦੀ|ਮੰਗਣੀ|ਆਨੰਦ ਕਾਰਜ/iu],
  ['home', /\b(griha ?pravesh|grih ?pravesh|housewarming|house warming|new (?:house|home|flat)|buy(?:ing)? (?:a |the )?(?:house|home|flat|plot|land|property|apartment)|property|real estate)\b|गृह ?प्रवेश|मकान|घर खरीद|ज़मीन|जमीन|संपत्ति|ਗ੍ਰਿਹ ?ਪ੍ਰਵੇਸ਼|ਘਰ|ਜ਼ਮੀਨ|ਜਾਇਦਾਦ/iu],
  ['business', /\b(business|shop|store|company|startup|start-up|launch|inaugurat\w*|opening|invest\w*)\b|व्यापार|व्यवसाय|दुकान|कंपनी|उद्घाटन|ਕਾਰੋਬਾਰ|ਦੁਕਾਨ|ਕੰਪਨੀ|ਉਦਘਾਟਨ/iu],
  ['travel_or_start', /\b(surgery|operation|naming ceremony|namkaran|mundan|upanayana|janeu|sign(?:ing)? (?:the )?contract|new job|join(?:ing)? (?:a )?job|travel|journey|buy(?:ing)? (?:a )?(?:car|vehicle|gold))\b|नामकरण|मुंडन|उपनयन|यात्रा|नौकरी|ਨਾਮਕਰਨ|ਯਾਤਰਾ|ਨੌਕਰੀ/iu],
];
const MUHURTA = /\b(muhurta|muhurat|muhurtham|muhoorat|shubh muhurat|auspicious (?:date|day|time|moment))\b|मुहूर्त|शुभ (?:तिथि|दिन|समय|घड़ी)|ਮੁਹੂਰਤ|ਸ਼ੁਭ (?:ਤਾਰੀਖ਼|ਦਿਨ|ਸਮਾਂ)/iu;
/** Words that mean "pick or confirm a date/time for me". */
const DATE_WORD = /\b(date|day|time|slot|when|tithi|week|month)\b|तिथि|दिन|समय|कब|ਤਾਰੀਖ਼|ਦਿਨ|ਸਮਾਂ|ਕਦੋਂ/iu;
const CHOOSE_CUE = /\b(should (?:i|we)|can (?:i|we)|shall we|best|right|good|lucky|auspicious|shubh|suitable|ideal|recommend|suggest|choose|pick|fix|finali[sz]e|decide|which|find|tell me|give me|is it ok|is it okay|is it safe|inauspicious|avoid)\b|शुभ|अशुभ|सही|अच्छा|सुझाव|बताइए|बताओ|तय|चुन|निकाल|ਸ਼ੁਭ|ਅਸ਼ੁਭ|ਸਹੀ|ਚੰਗਾ|ਦੱਸੋ|ਦੱਸ|ਤੈਅ|ਚੁਣ/iu;

export function classifyDecisionIntent(message: string): DecisionTopic | null {
  const text = message.normalize('NFKC');
  if (!CHOOSE_CUE.test(text)) return null;
  if (MUHURTA.test(text)) {
    // "What is a muhurta?" has no cue and never gets here; "give me a muhurta for ..." does.
    const event = EVENT.find(([, pattern]) => pattern.test(text));
    return event ? event[0] : 'muhurta';
  }
  if (!DATE_WORD.test(text)) return null;
  const event = EVENT.find(([, pattern]) => pattern.test(text));
  return event ? event[0] : null;
}

type Lang = 'en' | 'hi' | 'pa';

const TEXT: Record<Lang, string> = {
  en:
    "I can't choose a muhurta or tell you the right date for a wedding, a home, a business or any decision like it. " +
    "That depends on the charts of the people involved, your family's tradition and your place, and a wrong answer here can cost a great deal.\n\n" +
    "What I can do: Shoonaya's Panchang shows the tithi, nakshatra and sunrise-based timings for the city you set, and Sacred Days lists upcoming festivals and vrats.\n\n" +
    "For the date itself, please ask a qualified pandit, or the elders and teachers who follow your family's tradition, and check it against your local panchang.",
  hi:
    "मैं विवाह, घर, व्यापार या ऐसे किसी निर्णय के लिए मुहूर्त या सही तिथि नहीं बता सकता। " +
    "यह संबंधित लोगों की कुंडली, आपके परिवार की परंपरा और आपके स्थान पर निर्भर करता है, और यहाँ गलत उत्तर बहुत भारी पड़ सकता है।\n\n" +
    "मैं यह कर सकता हूँ: Shoonaya का पंचांग आपके चुने हुए शहर के लिए तिथि, नक्षत्र और सूर्योदय-आधारित समय दिखाता है, और Sacred Days में आने वाले पर्व और व्रत सूचीबद्ध हैं।\n\n" +
    "तिथि तय करने के लिए कृपया किसी योग्य पंडित से, या अपने परिवार की परंपरा के जानकार बड़ों और गुरुजनों से पूछें, और अपने स्थानीय पंचांग से मिलान करें।",
  pa:
    "ਮੈਂ ਵਿਆਹ, ਘਰ, ਕਾਰੋਬਾਰ ਜਾਂ ਅਜਿਹੇ ਕਿਸੇ ਫ਼ੈਸਲੇ ਲਈ ਮੁਹੂਰਤ ਜਾਂ ਸਹੀ ਤਾਰੀਖ਼ ਨਹੀਂ ਦੱਸ ਸਕਦਾ। " +
    "ਇਹ ਸਬੰਧਿਤ ਲੋਕਾਂ ਦੀ ਕੁੰਡਲੀ, ਤੁਹਾਡੇ ਪਰਿਵਾਰ ਦੀ ਪਰੰਪਰਾ ਅਤੇ ਤੁਹਾਡੇ ਸਥਾਨ 'ਤੇ ਨਿਰਭਰ ਕਰਦਾ ਹੈ, ਅਤੇ ਇੱਥੇ ਗਲਤ ਜਵਾਬ ਬਹੁਤ ਭਾਰੀ ਪੈ ਸਕਦਾ ਹੈ।\n\n" +
    "ਮੈਂ ਇਹ ਕਰ ਸਕਦਾ ਹਾਂ: Shoonaya ਦਾ ਪੰਚਾਂਗ ਤੁਹਾਡੇ ਚੁਣੇ ਸ਼ਹਿਰ ਲਈ ਤਿਥੀ, ਨਛੱਤਰ ਅਤੇ ਸੂਰਜ ਚੜ੍ਹਨ ਅਨੁਸਾਰ ਸਮੇਂ ਦਿਖਾਉਂਦਾ ਹੈ, ਅਤੇ Sacred Days ਵਿੱਚ ਆਉਣ ਵਾਲੇ ਤਿਉਹਾਰ ਅਤੇ ਵਰਤ ਦਰਜ ਹਨ।\n\n" +
    "ਤਾਰੀਖ਼ ਤੈਅ ਕਰਨ ਲਈ ਕਿਰਪਾ ਕਰਕੇ ਕਿਸੇ ਯੋਗ ਪੰਡਿਤ ਤੋਂ, ਜਾਂ ਆਪਣੇ ਪਰਿਵਾਰ ਦੀ ਪਰੰਪਰਾ ਦੇ ਜਾਣਕਾਰ ਬਜ਼ੁਰਗਾਂ ਅਤੇ ਗੁਰੂਆਂ ਤੋਂ ਪੁੱਛੋ, ਅਤੇ ਆਪਣੇ ਸਥਾਨਕ ਪੰਚਾਂਗ ਨਾਲ ਮਿਲਾਓ।",
};

/**
 * The fixed reply. The topic does not change the text: one answer per language is what makes it repeatable and
 * reviewable. Hindi and Punjabi need a native reader's approval before release.
 */
export function getDecisionResponse(language: string | null): string {
  const lang: Lang = language === 'hi' || language === 'pa' ? language : 'en';
  return TEXT[lang];
}
