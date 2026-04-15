// ============================================================
// Explain — AI Teacher: tradition-aware verse explanation
// ============================================================

import type { SupabaseClient } from '@supabase/supabase-js';
import type { ExplanationResult, CommentaryResult, PathshalaEngineConfig } from '../types';

export class ExplainEngine {
  private supabase: SupabaseClient;
  private config:   PathshalaEngineConfig;

  constructor(supabase: SupabaseClient, config: PathshalaEngineConfig) {
    this.supabase = supabase;
    this.config   = config;
  }

  /**
   * Get a tradition-aware explanation of a verse.
   * The Edge Function uses the user's profile to pick the right acharya lens.
   *
   * @param chunkId   Scripture chunk to explain
   * @param userId    Determines tradition, depth, sankalpa context
   * @param language  Response language (default 'en')
   */
  async explain(
    chunkId:  string,
    userId:   string,
    language: string = 'en'
  ): Promise<ExplanationResult> {
    const { data, error } = await this.supabase.functions.invoke('ai-pathshala-explain', {
      body: { chunk_id: chunkId, user_id: userId, commentary_mode: false, language },
    });

    if (error) {
      if (this.config.debug) console.error('[Explain] explain:', error.message);
      throw error;
    }

    return data as ExplanationResult;
  }

  /**
   * Get three-commentary comparison: Advaita, Vishishtadvaita, Dvaita.
   * Best for Vedantic texts (Upanishads, Bhagavad Gita, Brahma Sutras).
   */
  async compare(
    chunkId:  string,
    userId:   string,
    language: string = 'en'
  ): Promise<CommentaryResult> {
    const { data, error } = await this.supabase.functions.invoke('ai-pathshala-explain', {
      body: { chunk_id: chunkId, user_id: userId, commentary_mode: true, language },
    });

    if (error) {
      if (this.config.debug) console.error('[Explain] compare:', error.message);
      throw error;
    }

    return data as CommentaryResult;
  }
}
