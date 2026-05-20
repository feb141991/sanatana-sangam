/**
 * Normalized tag schema for AI Pipeline routing.
 * This type is used to explicitly route requests to the appropriate AI provider
 * (e.g., Sarvam for recitation, Gemini for Chat) rather than relying on regex heuristics.
 */
export type PramanaPipelineTags = {
  /** The nature of the content being processed. */
  content_type?: 'scripture' | 'commentary' | 'chat' | 'ui_text';
  
  /** How the response should be structured. */
  response_mode?: 'deterministic' | 'conversational' | 'extractive';
  
  /** TTS voice profile preference. */
  audio_mode?: 'pandit' | 'akash' | 'standard' | 'none';
  
  /** The religious or cultural tradition context. */
  tradition?: 'sanatana_dharma' | 'buddhism' | 'jainism' | 'sikhism' | 'generic';
  
  /** The linguistic script being used (prevents regex fallback failures on IAST). */
  script?: 'devanagari' | 'gurmukhi' | 'iast' | 'latin';
  
  /** Indicates if this is a live user request or a background precomputation job. */
  delivery_intent?: 'live_user' | 'background_precompute';
};
