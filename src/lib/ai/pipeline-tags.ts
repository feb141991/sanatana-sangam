/**
 * Normalized tag schema for AI Pipeline routing.
 * This type is used to explicitly route requests to the appropriate AI provider
 * (e.g., Sarvam for recitation, Sarvam for Chat) rather than relying on regex heuristics.
 */
export type PramanaPipelineTags = {
  /** 
   * The nature of the content being processed. 
   * Maps to Reasoning pipeline logic (e.g. strict translation vs storytelling).
   */
  content_type?:
    | 'scripture'
    | 'commentary'
    | 'chat'
    | 'ui_text'
    | 'sacred_verse'
    | 'katha'
    | 'instruction'
    | 'stotram'
    | 'mantra'
    | 'prayer';
  
  /** 
   * How the response should be structured. 
   * Maps to model generation temperature and format (JSON vs Markdown).
   */
  response_mode?: 'deterministic' | 'conversational' | 'extractive';
  
  /** 
   * TTS voice profile and pacing preference. 
   * Maps directly to the TTS pipeline pacing and voice selection (e.g. Sarvam).
   */
  audio_mode?:
    | 'pandit'
    | 'akash'
    | 'standard'
    | 'story'
    | 'meditative'
    | 'recitation'
    | 'prerecorded'
    | 'none';
  
  /** The religious or cultural tradition context. */
  tradition?: 'hindu' | 'buddhist' | 'jain' | 'sikh' | 'generic';
  
  /** The linguistic script being used (prevents regex fallback failures on IAST). */
  script?: 'devanagari' | 'gurmukhi' | 'iast' | 'latin';
  
  /** 
   * Indicates if this is a live user request or a background precomputation job. 
   * Maps to priority and caching rules.
   */
  delivery_intent?: 'live_user' | 'background_precompute' | 'recitation';
};
