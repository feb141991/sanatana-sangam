// ============================================================
// Progress — per-chunk reading progress and annotations
// ============================================================

import type { SupabaseClient } from '@supabase/supabase-js';
import type { LearningProgress, VerseMastery, PathshalaEngineConfig } from '../types';

export class Progress {
  private supabase: SupabaseClient;
  private config:   PathshalaEngineConfig;

  constructor(supabase: SupabaseClient, config: PathshalaEngineConfig) {
    this.supabase = supabase;
    this.config   = config;
  }

  // ── Mark read ─────────────────────────────────────────────────────────────

  /**
   * Mark a chunk as read. Upserts so re-reads increment the count.
   * Also auto-advances the enrollment if advanceEnrollment = true.
   */
  async markRead(
    userId: string,
    chunkId: string,
    options: {
      pathId?:              string;
      enrollmentId?:        string;
      comprehensionScore?:  number;  // 1–5
      notes?:               string;
    } = {}
  ): Promise<LearningProgress> {
    const { data: existing } = await this.supabase
      .from('pathshala_progress')
      .select('id, read_count')
      .eq('user_id', userId)
      .eq('chunk_id', chunkId)
      .eq('path_id',  options.pathId ?? null)
      .maybeSingle();

    const payload: Record<string, unknown> = {
      user_id:      userId,
      chunk_id:     chunkId,
      path_id:      options.pathId      ?? null,
      enrollment_id: options.enrollmentId ?? null,
      read_at:      new Date().toISOString(),
      read_count:   existing ? (existing.read_count ?? 0) + 1 : 1,
    };

    if (options.comprehensionScore !== undefined) payload.comprehension_score = options.comprehensionScore;
    if (options.notes              !== undefined) payload.notes               = options.notes;

    const { data, error } = await this.supabase
      .from('pathshala_progress')
      .upsert(payload, { onConflict: 'user_id,chunk_id,path_id' })
      .select()
      .single();

    if (error) {
      if (this.config.debug) console.error('[Progress] markRead:', error.message);
      throw error;
    }

    return data as LearningProgress;
  }

  /** Update comprehension score or notes on an existing progress row */
  async update(
    userId: string,
    chunkId: string,
    pathId: string | null,
    updates: { comprehension_score?: number; notes?: string; memorization_level?: number }
  ): Promise<void> {
    let query = this.supabase
      .from('pathshala_progress')
      .update(updates)
      .eq('user_id', userId)
      .eq('chunk_id', chunkId);

    if (pathId) query = query.eq('path_id', pathId);

    const { error } = await query;
    if (error && this.config.debug) console.error('[Progress] update:', error.message);
  }

  // ── Fetch progress ────────────────────────────────────────────────────────

  async getForChunk(userId: string, chunkId: string): Promise<LearningProgress | null> {
    const { data } = await this.supabase
      .from('pathshala_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('chunk_id', chunkId)
      .maybeSingle();

    return (data ?? null) as LearningProgress | null;
  }

  async getForPath(userId: string, pathId: string): Promise<LearningProgress[]> {
    const { data } = await this.supabase
      .from('pathshala_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('path_id', pathId)
      .order('read_at', { ascending: false });

    return (data ?? []) as LearningProgress[];
  }

  /** Count of unique chunks read across all paths */
  async totalRead(userId: string): Promise<number> {
    const { count } = await this.supabase
      .from('pathshala_progress')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    return count ?? 0;
  }

  // ── Verse mastery ─────────────────────────────────────────────────────────

  async getMastery(userId: string, chunkId: string): Promise<VerseMastery | null> {
    const { data } = await this.supabase
      .from('pathshala_verse_mastery')
      .select('*')
      .eq('user_id', userId)
      .eq('chunk_id', chunkId)
      .maybeSingle();

    return (data ?? null) as VerseMastery | null;
  }

  async getCertifiedVerses(userId: string): Promise<VerseMastery[]> {
    const { data } = await this.supabase
      .from('pathshala_verse_mastery')
      .select('*')
      .eq('user_id', userId)
      .eq('certified', true)
      .order('certified_at', { ascending: false });

    return (data ?? []) as VerseMastery[];
  }

  async getFullyMastered(userId: string): Promise<VerseMastery[]> {
    const { data } = await this.supabase
      .from('pathshala_verse_mastery')
      .select('*')
      .eq('user_id', userId)
      .eq('is_fully_mastered', true);

    return (data ?? []) as VerseMastery[];
  }

  /** Mastery summary for a user — good for profile screen */
  async getSummary(userId: string): Promise<{
    total_read:       number;
    certified:        number;
    fully_mastered:   number;
    avg_ai_score:     number | null;
  }> {
    const [totalRead, masteryData] = await Promise.all([
      this.totalRead(userId),
      this.supabase
        .from('pathshala_verse_mastery')
        .select('certified, is_fully_mastered, best_ai_score')
        .eq('user_id', userId),
    ]);

    const rows      = masteryData.data ?? [];
    const certified = rows.filter(r => r.certified).length;
    const fullyMastered = rows.filter(r => r.is_fully_mastered).length;
    const scores    = rows.map(r => r.best_ai_score).filter(Boolean) as number[];
    const avgScore  = scores.length > 0
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 10) / 10
      : null;

    return {
      total_read:     totalRead,
      certified,
      fully_mastered: fullyMastered,
      avg_ai_score:   avgScore,
    };
  }
}
