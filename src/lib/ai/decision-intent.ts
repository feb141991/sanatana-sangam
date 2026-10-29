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
 * language. The text points to the local calendar information available in Shoonaya and sends the decision to a
 * trusted, qualified person from the user's own tradition. It states no doctrine about any tradition, no date and no time.
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
    "I can't choose an auspicious date or time for a wedding, a home, a business or a similar decision. " +
    "The right guidance depends on your own tradition, the people involved and your location.\n\n" +
    "Shoonaya can show the local calendar information and upcoming observances available in the app.\n\n" +
    "For a decision, please consult a trusted, qualified teacher or elder who understands your tradition, and check the date against the calendar followed by your family or community.",
  hi:
    "मैं विवाह, घर, व्यापार या ऐसे किसी निर्णय के लिए शुभ दिन या समय तय नहीं कर सकता। " +
    "उचित मार्गदर्शन आपकी परंपरा, संबंधित लोगों और स्थान पर निर्भर करता है।\n\n" +
    "Shoonaya में उपलब्ध स्थानीय पंचांग की जानकारी और आने वाले पर्व देख सकते हैं।\n\n" +
    "ऐसे निर्णय के लिए कृपया अपनी परंपरा को समझने वाले किसी विश्वसनीय, योग्य मार्गदर्शक या बड़े से सलाह लें, और तिथि का मिलान अपने परिवार या समुदाय द्वारा माने जाने वाले पंचांग से करें।",
  pa:
    "ਮੈਂ ਵਿਆਹ, ਘਰ, ਕਾਰੋਬਾਰ ਜਾਂ ਅਜਿਹੇ ਕਿਸੇ ਫ਼ੈਸਲੇ ਲਈ ਸ਼ੁਭ ਦਿਨ ਜਾਂ ਸਮਾਂ ਤੈਅ ਨਹੀਂ ਕਰ ਸਕਦਾ। " +
    "ਉਚਿਤ ਸਲਾਹ ਤੁਹਾਡੀ ਪਰੰਪਰਾ, ਸਬੰਧਿਤ ਲੋਕਾਂ ਅਤੇ ਤੁਹਾਡੇ ਸਥਾਨ 'ਤੇ ਨਿਰਭਰ ਕਰਦੀ ਹੈ।\n\n" +
    "Shoonaya ਵਿੱਚ ਉਪਲਬਧ ਸਥਾਨਕ ਕੈਲੰਡਰ ਜਾਣਕਾਰੀ ਅਤੇ ਆਉਣ ਵਾਲੇ ਤਿਉਹਾਰ ਵੇਖੇ ਜਾ ਸਕਦੇ ਹਨ।\n\n" +
    "ਅਜਿਹੇ ਫ਼ੈਸਲੇ ਲਈ ਕਿਰਪਾ ਕਰਕੇ ਆਪਣੀ ਪਰੰਪਰਾ ਨੂੰ ਸਮਝਣ ਵਾਲੇ ਕਿਸੇ ਭਰੋਸੇਯੋਗ, ਯੋਗ ਮਾਰਗਦਰਸ਼ਕ ਜਾਂ ਵੱਡੇ ਨਾਲ ਸਲਾਹ ਕਰੋ, ਅਤੇ ਤਾਰੀਖ਼ ਦਾ ਮਿਲਾਨ ਆਪਣੇ ਪਰਿਵਾਰ ਜਾਂ ਭਾਈਚਾਰੇ ਵੱਲੋਂ ਮੰਨੇ ਜਾਂਦੇ ਕੈਲੰਡਰ ਨਾਲ ਕਰੋ।",
};

/**
 * The fixed reply. The topic does not change the text: one answer per language is what makes it repeatable and
 * reviewable. Hindi and Punjabi need a native reader's approval before release.
 */
export function getDecisionResponse(language: string | null): string {
  const lang: Lang = language === 'hi' || language === 'pa' ? language : 'en';
  return TEXT[lang];
}
