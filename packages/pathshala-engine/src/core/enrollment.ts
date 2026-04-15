// ============================================================
// Enrollment — manage user curriculum path subscriptions
// ============================================================

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  PathshalaPath, PathshalaEnrollment,
  EnrollResult, AdvanceResult, TodayLesson,
  PathshalaEngineConfig,
} from '../types';

export class Enrollment {
  private supabase: SupabaseClient;
  private config:   PathshalaEngineConfig;

  constructor(supabase: SupabaseClient, config: PathshalaEngineConfig) {
    this.supabase = supabase;
    this.config   = config;
  }

  // ── Paths ─────────────────────────────────────────────────────────────────

  /** All active curriculum paths */
  async getAllPaths(): Promise<PathshalaPath[]> {
    const { data } = await this.supabase
      .from('pathshala_paths')
      .select('*')
      .eq('is_active', true)
      .order('difficulty', { ascending: true });

    return (data ?? []) as PathshalaPath[];
  }

  async getPathBySlug(slug: string): Promise<PathshalaPath | null> {
    const { data } = await this.supabase
      .from('pathshala_paths')
      .select('*')
      .eq('slug', slug)
      .single();

    return (data ?? null) as PathshalaPath | null;
  }

  async getPathById(pathId: string): Promise<PathshalaPath | null> {
    const { data } = await this.supabase
      .from('pathshala_paths')
      .select('*')
      .eq('id', pathId)
      .single();

    return (data ?? null) as PathshalaPath | null;
  }

  // ── Enrollment ────────────────────────────────────────────────────────────

  /** Enroll user in a path (idempotent — resumes if already enrolled) */
  async enroll(
    userId: string,
    pathId: string,
    options: { languagePref?: string; dailyTargetChunks?: number } = {}
  ): Promise<EnrollResult> {
    const path = await this.getPathById(pathId);
    if (!path) throw new Error(`Path ${pathId} not found`);

    // Check existing enrollment
    const { data: existing } = await this.supabase
      .from('pathshala_enrollments')
      .select('*')
      .eq('user_id', userId)
      .eq('path_id', pathId)
      .maybeSingle();

    if (existing) {
      // Resume: un-pause if paused
      if (existing.paused) {
        await this.supabase
          .from('pathshala_enrollments')
          .update({ paused: false, last_activity_at: new Date().toISOString() })
          .eq('id', existing.id);
        existing.paused = false;
      }
      return { enrollment: existing as PathshalaEnrollment, isNew: false, path };
    }

    // New enrollment
    const { data, error } = await this.supabase
      .from('pathshala_enrollments')
      .insert({
        user_id:             userId,
        path_id:             pathId,
        current_position:    1,
        language_pref:       options.languagePref       ?? 'en',
        daily_target_chunks: options.dailyTargetChunks  ?? 1,
        last_activity_at:    new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      if (this.config.debug) console.error('[Enrollment] enroll:', error.message);
      throw error;
    }

    return { enrollment: data as PathshalaEnrollment, isNew: true, path };
  }

  /** Pause/resume an enrollment */
  async setPaused(userId: string, pathId: string, paused: boolean): Promise<void> {
    await this.supabase
      .from('pathshala_enrollments')
      .update({ paused })
      .eq('user_id', userId)
      .eq('path_id', pathId);
  }

  /** All active enrollments for a user */
  async getActive(userId: string): Promise<Array<PathshalaEnrollment & { path: PathshalaPath }>> {
    const { data } = await this.supabase
      .from('pathshala_enrollments')
      .select('*, pathshala_paths(*)')
      .eq('user_id', userId)
      .eq('paused', false)
      .is('completed_at', null)
      .order('last_activity_at', { ascending: false });

    return (data ?? []).map((r: Record<string, unknown>) => ({
      ...(r as unknown as PathshalaEnrollment),
      path: r['pathshala_paths'] as PathshalaPath,
    }));
  }

  /** All enrollments (active + completed + paused) */
  async getAll(userId: string): Promise<Array<PathshalaEnrollment & { path: PathshalaPath }>> {
    const { data } = await this.supabase
      .from('pathshala_enrollments')
      .select('*, pathshala_paths(*)')
      .eq('user_id', userId)
      .order('enrolled_at', { ascending: false });

    return (data ?? []).map((r: Record<string, unknown>) => ({
      ...(r as unknown as PathshalaEnrollment),
      path: r['pathshala_paths'] as PathshalaPath,
    }));
  }

  // ── Progress ──────────────────────────────────────────────────────────────

  /**
   * Advance enrollment to the next chunk.
   * Calls the advance_enrollment() Postgres RPC (handles locking + completion detection).
   */
  async advance(userId: string, pathId: string): Promise<AdvanceResult> {
    const { data, error } = await this.supabase
      .rpc('advance_enrollment', { p_user_id: userId, p_path_id: pathId });

    if (error) {
      if (this.config.debug) console.error('[Enrollment] advance:', error.message);
      throw error;
    }

    const result = data as { status: string; position: number; total_chunks: number; pct_complete?: number };

    if (result.status === 'enrollment_not_found') {
      throw new Error('Enrollment not found');
    }

    return {
      status:       result.status as AdvanceResult['status'],
      position:     result.position,
      total_chunks: result.total_chunks,
      pct_complete: result.pct_complete ?? Math.round(result.position / result.total_chunks * 100),
    };
  }

  /** Completion percentage for a user's enrollment */
  async getProgress(userId: string, pathId: string): Promise<{
    position:     number;
    total_chunks: number;
    pct_complete: number;
    completed:    boolean;
  } | null> {
    const { data } = await this.supabase
      .from('pathshala_enrollments')
      .select('current_position, completed_at, pathshala_paths(total_chunks)')
      .eq('user_id', userId)
      .eq('path_id', pathId)
      .maybeSingle();

    if (!data) return null;

    const total = (data['pathshala_paths'] as unknown as { total_chunks: number })?.total_chunks ?? 1;
    return {
      position:     data.current_position,
      total_chunks: total,
      pct_complete: Math.round(data.current_position / total * 100),
      completed:    !!data.completed_at,
    };
  }

  // ── Today's lesson ────────────────────────────────────────────────────────

  /** Get today's pending lessons across all active enrollments */
  async getTodayLessons(userId: string): Promise<TodayLesson[]> {
    const { data, error } = await this.supabase
      .from('pathshala_today_lessons')
      .select('*')
      .eq('user_id', userId);

    if (error && this.config.debug) console.error('[Enrollment] getTodayLessons:', error.message);
    return (data ?? []) as TodayLesson[];
  }

  /** Get the next chunk for a specific enrollment */
  async getNextChunk(userId: string, pathId: string): Promise<{
    chunk_id:  string;
    position:  number;
    week:      number;
    day:       number;
  } | null> {
    // Get current position
    const { data: enr } = await this.supabase
      .from('pathshala_enrollments')
      .select('current_position')
      .eq('user_id', userId)
      .eq('path_id', pathId)
      .single();

    if (!enr) return null;

    const { data: pc } = await this.supabase
      .from('pathshala_path_chunks')
      .select('chunk_id, position, week_number, day_number')
      .eq('path_id', pathId)
      .eq('position', enr.current_position)
      .single();

    if (!pc) return null;

    return {
      chunk_id: pc.chunk_id,
      position: pc.position,
      week:     pc.week_number,
      day:      pc.day_number,
    };
  }
}
