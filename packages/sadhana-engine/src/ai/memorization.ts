// ============================================================
// Memorization Engine — SM-2 Spaced Repetition (Phase 4)
//
// Implements the SuperMemo SM-2 algorithm for shloka memorisation.
// Uses the sm2_review() SQL function for atomic state updates.
// Generates quiz questions via the ai-shloka-quiz Edge Function.
//
// Usage:
//   const mem = new MemorizationEngine(supabase, config);
//   await mem.addToQueue(userId, chunkId);
//   const quiz = await mem.getNextQuiz(userId);
//   const result = await mem.submitReview(userId, chunkId, 4); // quality 0-5
//   const stats = await mem.getStats(userId);
// ============================================================

import type { SupabaseClient } from '@supabase/supabase-js';
import type { SadhanaEngineConfig } from '../types';

export type QuizMode = 'mcq' | 'fill' | 'meaning';

export interface MemorizationCard {
  id: string;
  user_id: string;
  chunk_id: string;
  text_id: string;
  chapter: number | null;
  verse: number | null;
  ease_factor: number;
  interval_days: number;
  repetitions: number;
  next_review_at: string;
  last_reviewed: string | null;
  last_quality: number | null;
  status: 'learning' | 'reviewing' | 'mastered';
  // Joined from scripture_chunks
  sanskrit?: string;
  transliteration?: string;
  translation?: string;
}

export interface QuizQuestion {
  question: string;
  options?: string[];    // MCQ only
  answer: string;
  explanation: string;
  chunk: Record<string, unknown>;
  mode: QuizMode;
  generated_at: string;
}

export interface ReviewResult {
  card: MemorizationCard;
  quality: number;
  new_interval: number;
  new_status: string;
}

export interface MemorizationStats {
  total: number;
  learning: number;
  reviewing: number;
  mastered: number;
  due_today: number;
  reviews_today: number;
  accuracy_pct: number;
}

// Quality scale for consumer display
export const QUALITY_LABELS: Record<number, string> = {
  0: 'Complete blackout',
  1: 'Wrong — remembered on seeing',
  2: 'Wrong — easy recall',
  3: 'Correct — difficult',
  4: 'Correct — some hesitation',
  5: 'Perfect recall',
};

export class MemorizationEngine {
  private supabase: SupabaseClient;
  private config: SadhanaEngineConfig;

  constructor(supabase: SupabaseClient, config: SadhanaEngineConfig) {
    this.supabase = supabase;
    this.config   = config;
  }

  // ── Add a verse to the memorisation queue ──
  // chunk_id references scripture_chunks.id

  async addToQueue(userId: string, chunkId: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('memorisation_queue')
      .upsert(
        { user_id: userId, chunk_id: chunkId, text_id: '' },
        { onConflict: 'user_id,chunk_id', ignoreDuplicates: true }
      );

    if (error) {
      if (this.config.debug) console.error('[MemorizationEngine] addToQueue failed:', error.message);
      return false;
    }
    return true;
  }

  // ── Remove a verse from the queue ──

  async removeFromQueue(userId: string, chunkId: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('memorisation_queue')
      .delete()
      .eq('user_id', userId)
      .eq('chunk_id', chunkId);

    return !error;
  }

  // ── Get all cards due for review today ──

  async getDueCards(userId: string): Promise<MemorizationCard[]> {
    const today = new Date().toISOString().split('T')[0];
    const { data } = await this.supabase
      .from('memorisation_due')    // uses the view from migration 009
      .select('*')
      .eq('user_id', userId)
      .lte('next_review_at', today);

    return (data ?? []) as MemorizationCard[];
  }

  // ── Get all cards in queue ──

  async getAllCards(
    userId: string,
    status?: 'learning' | 'reviewing' | 'mastered'
  ): Promise<MemorizationCard[]> {
    let query = this.supabase
      .from('memorisation_queue')
      .select('*')
      .eq('user_id', userId)
      .order('next_review_at');

    if (status) query = query.eq('status', status);

    const { data } = await query;
    return (data ?? []) as MemorizationCard[];
  }

  // ── Get next quiz question ──
  // Picks the oldest due card and generates a quiz question.

  async getNextQuiz(
    userId: string,
    mode: QuizMode = 'mcq',
    chunkId?: string
  ): Promise<QuizQuestion | null> {
    try {
      const { data, error } = await this.supabase.functions.invoke('ai-shloka-quiz', {
        body: {
          user_id:  userId,
          chunk_id: chunkId,
          mode,
        },
      });
      if (error) throw error;
      return data as QuizQuestion;
    } catch (err) {
      if (this.config.debug) console.error('[MemorizationEngine] getNextQuiz failed:', err);
      return null;
    }
  }

  // ── Get quiz for a specific verse ──

  async getQuizForVerse(
    userId: string,
    textId: string,
    chapter: number,
    verse: number,
    mode: QuizMode = 'mcq'
  ): Promise<QuizQuestion | null> {
    try {
      const { data, error } = await this.supabase.functions.invoke('ai-shloka-quiz', {
        body: { user_id: userId, text_id: textId, chapter, verse, mode },
      });
      if (error) throw error;
      return data as QuizQuestion;
    } catch (err) {
      if (this.config.debug) console.error('[MemorizationEngine] getQuizForVerse failed:', err);
      return null;
    }
  }

  // ── Submit a review ──
  // quality: 0 (blackout) to 5 (perfect)
  // Uses the sm2_review() SQL function.

  async submitReview(
    userId: string,
    chunkId: string,
    quality: number,        // 0-5
    timeTakenSeconds?: number
  ): Promise<ReviewResult | null> {
    if (quality < 0 || quality > 5) {
      console.error('[MemorizationEngine] quality must be 0-5');
      return null;
    }

    const { data, error } = await this.supabase.rpc('sm2_review', {
      p_user_id:  userId,
      p_chunk_id: chunkId,
      p_quality:  quality,
      p_time_s:   timeTakenSeconds ?? null,
    });

    if (error) {
      if (this.config.debug) console.error('[MemorizationEngine] submitReview failed:', error.message);
      return null;
    }

    const card = data as MemorizationCard;
    return {
      card,
      quality,
      new_interval: card.interval_days,
      new_status:   card.status,
    };
  }

  // ── Get memorisation statistics ──

  async getStats(userId: string): Promise<MemorizationStats> {
    const today = new Date().toISOString().split('T')[0];

    // Total + by status
    const { data: cards } = await this.supabase
      .from('memorisation_queue')
      .select('status, next_review_at')
      .eq('user_id', userId);

    // Reviews today
    const { data: history } = await this.supabase
      .from('memorisation_history')
      .select('quality')
      .eq('user_id', userId)
      .gte('reviewed_at', `${today}T00:00:00Z`);

    const total     = cards?.length ?? 0;
    const learning  = cards?.filter(c => c.status === 'learning').length ?? 0;
    const reviewing = cards?.filter(c => c.status === 'reviewing').length ?? 0;
    const mastered  = cards?.filter(c => c.status === 'mastered').length ?? 0;
    const dueToday  = cards?.filter(c => c.next_review_at <= today && c.status !== 'mastered').length ?? 0;

    const reviewsToday = history?.length ?? 0;
    const goodReviews  = history?.filter(h => h.quality >= 3).length ?? 0;
    const accuracyPct  = reviewsToday > 0 ? Math.round((goodReviews / reviewsToday) * 100) : 0;

    return { total, learning, reviewing, mastered, due_today: dueToday, reviews_today: reviewsToday, accuracy_pct: accuracyPct };
  }

  // ── Get review history ──

  async getHistory(userId: string, limit = 50): Promise<Array<{
    chunk_id: string;
    quality: number;
    time_taken_s: number | null;
    reviewed_at: string;
  }>> {
    const { data } = await this.supabase
      .from('memorisation_history')
      .select('chunk_id, quality, time_taken_s, reviewed_at')
      .eq('user_id', userId)
      .order('reviewed_at', { ascending: false })
      .limit(limit);

    return data ?? [];
  }

  // ── Lookup a verse from scripture_chunks ──
  // Convenience to find chunk_id by text/chapter/verse

  async findChunk(
    textId: string,
    chapter: number,
    verse: number
  ): Promise<{ id: string; sanskrit: string; translation: string } | null> {
    const { data } = await this.supabase
      .from('scripture_chunks')
      .select('id, sanskrit, translation')
      .eq('text_id', textId)
      .eq('chapter', chapter)
      .eq('verse', verse)
      .single();

    return data ?? null;
  }
}
