/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Shoonaya — Script Transliteration Utility
 * ─────────────────────────────────────────────────────────────────────────────
 */

/** Simple mapping for Gurmukhi to Devanagari */
const GURMUKHI_TO_DEVANAGARI: Record<string, string> = {
  'ੳ': 'उ', 'ਅ': 'अ', 'ੲ': 'इ', 'ਸ': 'स', 'ਹ': 'ह',
  'ਕ': 'क', 'ਖ': 'ख', 'ਗ': 'ग', 'ਘ': 'घ', 'ਙ': 'ङ',
  'ਚ': 'च', 'ਛ': 'छ', 'ਜ': 'ज', 'ਝ': 'झ', 'ਞ': 'ञ',
  'ਟ': 'ट', 'ਠ': 'ठ', 'ਡ': 'ड', 'ਢ': 'ढ', 'ਣ': 'ण',
  'ਤ': 'त', 'ਥ': 'थ', 'ਦ': 'द', 'ਧ': 'ध', 'ਨ': 'न',
  'ਪ': 'प', 'ਫ': 'फ', 'ਬ': 'ब', 'ਭ': 'भ', 'ਮ': 'म',
  'ਯ': 'य', 'ਰ': 'र', 'ਲ': 'ल', 'ਲ਼': 'ळ', 'ਵ': 'व', 'ਸ਼': 'श',
  'ਖ਼': 'ख़', 'ਗ਼': 'ग़', 'ਜ਼': 'ज़', 'ੜ': 'ड़', 'ਫ਼': 'फ़',
  'ਾ': 'ा', 'ਿ': 'ि', 'ੀ': 'ी', 'ੁ': 'ु', 'ੂ': 'ू', 'ੇ': 'े', 'ੈ': 'ै', 'ੋ': 'ो', 'ੌ': 'ौ',
  'ੰ': 'ं', 'ਂ': 'ं', 'ੱ': '', // Adhak (doubles next consonant) - simplified to nothing for now
  '੍': '्',
  '।': '।', '॥': '॥',
  '੦': '०', '੧': '१', '੨': '२', '੩': '३', '੪': '४', '੫': '५', '੬': '६', '੭': '७', '੮': '८', '੯': '९',
};

/**
 * Basic transliteration from Gurmukhi to Devanagari.
 * (Simplified - does not handle all complex conjuncts perfectly but good for reading)
 */
export function gurmukhiToDevanagari(text: string): string {
  return text.split('').map(char => GURMUKHI_TO_DEVANAGARI[char] ?? char).join('');
}

/** Check if text contains Gurmukhi characters */
export function isGurmukhi(text: string): boolean {
  return /[਀-੿]/.test(text);
}

/** Check if text contains Devanagari characters */
export function isDevanagari(text: string): boolean {
  return /[ऀ-ॿ]/.test(text);
}

/**
 * Returns the appropriate transliterated text based on user preference.
 */
export function getTransliteration(
  original: string,
  romanTransliteration: string,
  targetLang: 'en' | 'hi' | string
): string {
  if (targetLang === 'hi') {
    if (isDevanagari(original)) return original; // Already in Devanagari
    if (isGurmukhi(original)) return gurmukhiToDevanagari(original);
    // Add other script conversions here if needed (e.g. Tamil to Devanagari)
    return original; 
  }
  
  // Default to Roman transliteration
  return romanTransliteration;
}
