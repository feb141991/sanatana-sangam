// ============================================================
// Scripture Search — Ask Scripture feature (Phase 2)
//
// Client-side module. Sends the user's question to the
// ai-ask-scripture Edge Function, which does:
//   1. pgvector similarity search across scripture_chunks
//   2. Gemini Flash explanation contextualised to user profile
//
// Usage:
//   const search = new ScriptureSearch(supabase, config);
//   const results = await search.ask("What does Krishna say about fear?", userId);
// ============================================================

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  ScriptureSearchResult,
  ScriptureVerse,
  UserPracticeProfile,
  SadhanaEngineConfig,
} from '../types';

export interface AskScriptureOptions {
  matchCount?: number;       // how many verses to retrieve (default 5)
  matchThreshold?: number;   // similarity threshold 0-1 (default 0.3)
  textIds?: string[];        // limit to specific texts e.g. ['gita']
  withExplanation?: boolean; // call Gemini for explanation (default true)
}

export interface AskScriptureResponse {
  question: string;
  answer: string;            // Gemini-generated explanation
  verses: ScriptureSearchResult[];
  source_texts: string[];
  generated_at: string;
}

export class ScriptureSearch {
  private supabase: SupabaseClient;
  private config: SadhanaEngineConfig;
  private cache = new Map<string, AskScriptureResponse>();

  constructor(supabase: SupabaseClient, config: SadhanaEngineConfig) {
    this.supabase = supabase;
    this.config = config;
  }

  // ── Main method: ask a question, get verses + explanation ──

  async ask(
    question: string,
    userId: string,
    options: AskScriptureOptions = {}
  ): Promise<AskScriptureResponse> {
    const cacheKey = `${userId}:${question}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    const { data, error } = await this.supabase.functions.invoke('ai-ask-scripture', {
      body: {
        question,
        user_id: userId,
        match_count: options.matchCount ?? 5,
        match_threshold: options.matchThreshold ?? 0.3,
        text_ids: options.textIds ?? null,
        with_explanation: options.withExplanation ?? true,
      },
    });

    if (error) throw new Error(`Scripture search failed: ${error.message}`);

    const result = data as AskScriptureResponse;
    this.cache.set(cacheKey, result);

    // Auto-expire cache after 30 min
    setTimeout(() => this.cache.delete(cacheKey), 30 * 60 * 1000);

    return result;
  }

  // ── Local similarity search (no Gemini) — for autocomplete / suggestions ──
  // Calls the match_scriptures postgres function directly

  async similarVerses(
    question: string,
    options: AskScriptureOptions = {}
  ): Promise<ScriptureVerse[]> {
    // We can't generate an embedding client-side without the model,
    // so we call the edge function in no-explanation mode
    const { data, error } = await this.supabase.functions.invoke('ai-ask-scripture', {
      body: {
        question,
        user_id: null,
        match_count: options.matchCount ?? 5,
        match_threshold: options.matchThreshold ?? 0.3,
        text_ids: options.textIds ?? null,
        with_explanation: false,
      },
    });

    if (error) throw new Error(`Verse search failed: ${error.message}`);
    return (data as AskScriptureResponse).verses.map(r => r.verse);
  }

  // ── Get a specific verse ──

  async getVerse(textId: string, chapter: number, verse: number): Promise<ScriptureVerse | null> {
    const { data, error } = await this.supabase
      .from('scripture_chunks')
      .select('*')
      .eq('text_id', textId)
      .eq('chapter', chapter)
      .eq('verse', verse)
      .single();

    if (error || !data) return null;
    return data as ScriptureVerse;
  }

  // ── Get all verses for a chapter ──

  async getChapter(textId: string, chapter: number): Promise<ScriptureVerse[]> {
    const { data, error } = await this.supabase
      .from('scripture_chunks')
      .select('*')
      .eq('text_id', textId)
      .eq('chapter', chapter)
      .order('verse', { ascending: true });

    if (error) throw new Error(`Failed to fetch chapter: ${error.message}`);
    return (data ?? []) as ScriptureVerse[];
  }

  clearCache() {
    this.cache.clear();
  }
}
