export type ChatIntent = 'acknowledgement' | 'greeting' | 'farewell' | 'confirmation' | 'question';

const ACK = /^(?:thanks?|thank\s+you|धन्यवाद|आभार|शुक्रिया|ਧੰਨਵਾਦ|ਆਭਾਰ|jai\s+jinendra|जय जिनेन्द्र|sat\s+sri\s+akal|ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ|namo\s+buddhaya|नमो बुद्धाय)[!.,\s🙏🤲☬🕉️☸️]*$/iu;
const GREETING = /^(?:hi|hello|hey|namaste|नमस्ते|नमस्कार|sat\s+sri\s+akal|ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ|jai\s+jinendra|जय जिनेन्द्र|namo\s+buddhaya|नमो बुद्धाय)[!.,\s🙏🤲☬🕉️]*$/iu;
const FAREWELL = /^(?:bye|goodbye|good\s+night|see\s+you|फिर मिलेंगे|शुभ रात्रि|ਅਲਵਿਦਾ)[!.,\s🙏🤲☬🕉️]*$/iu;
const CONFIRMATION = /^(?:ok|okay|yes|sure|alright|ठीक है|ठीक|हाँ|जी हाँ|ਠੀਕ ਹੈ|ਹਾਂ)[!.,\s🙏🤲☬🕉️]*$/iu;

export function classifyChatIntent(message: string): ChatIntent {
  const text = message.trim();
  if (ACK.test(text)) return 'acknowledgement';
  if (GREETING.test(text)) return 'greeting';
  if (FAREWELL.test(text)) return 'farewell';
  if (CONFIRMATION.test(text)) return 'confirmation';
  return 'question';
}

const COMMON: Record<string, Record<string, string>> = {
  hindu: { en: 'You are most welcome. May your day be filled with peace and steadiness. 🙏', hi: 'आपका स्वागत है। आपका दिन शांति और स्थिरता से भरा रहे। 🙏', pa: 'ਤੁਹਾਡਾ ਜੀ ਆਇਆਂ ਨੂੰ। ਤੁਹਾਡਾ ਦਿਨ ਸ਼ਾਂਤੀ ਅਤੇ ਸਥਿਰਤਾ ਨਾਲ ਭਰਿਆ ਰਹੇ। 🙏' },
  sikh: { en: 'You are most welcome. May your path be guided by seva and remembrance. Sat Sri Akal. ☬', hi: 'आपका स्वागत है। सेवा और सिमरन आपका मार्गदर्शन करें। सत श्री अकाल। ☬', pa: 'ਤੁਹਾਡਾ ਜੀ ਆਇਆਂ ਨੂੰ। ਸੇਵਾ ਅਤੇ ਸਿਮਰਨ ਤੁਹਾਡਾ ਰਾਹ ਰੌਸ਼ਨ ਕਰਨ। ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ। ☬' },
  buddhist: { en: 'You are most welcome. May your practice bring clarity and compassion. Namo Buddhaya. ☸️', hi: 'आपका स्वागत है। आपका अभ्यास स्पष्टता और करुणा लाए। नमो बुद्धाय। ☸️', pa: 'ਤੁਹਾਡਾ ਜੀ ਆਇਆਂ ਨੂੰ। ਤੁਹਾਡਾ ਅਭਿਆਸ ਸਪਸ਼ਟਤਾ ਅਤੇ ਕਰੁਣਾ ਲਿਆਵੇ। ਨਮੋ ਬੁੱਧਾਯ। ☸️' },
  jain: { en: 'You are most welcome. May your practice continue with gentleness and awareness. Jai Jinendra. 🤲', hi: 'आपका स्वागत है। आपका अभ्यास विनम्रता और जागरूकता के साथ आगे बढ़े। जय जिनेन्द्र। 🤲', pa: 'ਤੁਹਾਡਾ ਜੀ ਆਇਆਂ ਨੂੰ। ਤੁਹਾਡਾ ਅਭਿਆਸ ਨਿਮਰਤਾ ਅਤੇ ਜਾਗਰੂਕਤਾ ਨਾਲ ਅੱਗੇ ਵਧੇ। ਜੈ ਜਿਨੇਂਦਰ। 🤲' },
};

export function getConversationalResponse(intent: Exclude<ChatIntent, 'question'>, tradition: string | null, language: string | null): string {
  const base = COMMON[tradition ?? 'hindu'] ?? COMMON.hindu;
  const lang = base[language ?? 'en'] ?? base.en;
  if (intent === 'acknowledgement') return lang;
  if (intent === 'greeting') return lang.replace(/^You are most welcome\.|^आपका स्वागत है।|^ਤੁਹਾਡਾ ਜੀ ਆਇਆਂ ਨੂੰ।/, tradition === 'sikh' ? 'Sat Sri Akal.' : tradition === 'jain' ? 'Jai Jinendra.' : tradition === 'buddhist' ? 'Namo Buddhaya.' : 'Namaste.');
  if (intent === 'farewell') return language === 'hi' ? 'फिर मिलेंगे। आपका अभ्यास स्थिर बना रहे। 🙏' : language === 'pa' ? 'ਫਿਰ ਮਿਲਾਂਗੇ। ਤੁਹਾਡਾ ਅਭਿਆਸ ਸਥਿਰ ਰਹੇ। 🙏' : 'Until next time. May your practice remain steady. 🙏';
  return language === 'hi' ? 'अवश्य। जब भी आप तैयार हों, मैं यहाँ हूँ। 🙏' : language === 'pa' ? 'ਜ਼ਰੂਰ। ਜਦੋਂ ਵੀ ਤੁਸੀਂ ਤਿਆਰ ਹੋਵੋ, ਮੈਂ ਇੱਥੇ ਹਾਂ। 🙏' : 'Of course. I am here whenever you are ready. 🙏';
}
