/**
 * Preprocesses text for TTS engines (Sarvam/Google) to improve speech quality,
 * particularly for Indic scripts like Devanagari and Gurmukhi.
 */

export function preprocessTTS(text: string, quality: 'standard' | 'pandit' | 'akash'): { cleanedText: string; usesSSML: boolean } {
  let cleanedText = text.trim();
  let usesSSML = false;

  // 1. Punctuation-aware pausing for Pandit (Recitation) Quality
  if (quality === 'pandit') {
    // Sanskrit verses (Shlokas) usually have a break at the half-verse (।) and full verse (॥)
    // We convert these to SSML break tags.
    // Note: Sarvam's Bulbul generally handles natural pauses, but explicit SSML helps Google TTS.
    // If using Sarvam, we might just keep commas if SSML is not fully supported, but for now we format for SSML.
    
    if (cleanedText.includes('।') || cleanedText.includes('॥')) {
      cleanedText = cleanedText
        .replace(/।/g, '। <break time="800ms"/>')
        .replace(/॥/g, '॥ <break time="1500ms"/>');
      
      cleanedText = `<speak>${cleanedText}</speak>`;
      usesSSML = true;
    }
  }

  // 2. Akash (Narration) specific smoothing
  if (quality === 'akash') {
    // Smooth out excessive hyphens or weird formatting for narrative English/Hindi
    cleanedText = cleanedText.replace(/---/g, ', ').replace(/--/g, ', ');
  }

  // 3. General normalization (removes excessive whitespace)
  if (!usesSSML) {
    cleanedText = cleanedText.replace(/\s+/g, ' ');
  }

  return { cleanedText, usesSSML };
}

/**
 * Converts SSML-enhanced text back into plain text for providers that do not
 * support SSML input reliably.
 */
export function stripSSMLForPlainTTS(text: string): string {
  return text
    .replace(/<break\b[^>]*\/>/gi, ' ')
    .replace(/<\/?speak>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
