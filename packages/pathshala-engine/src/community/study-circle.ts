// ============================================================
// StudyCircle — Kul group reading circles
// ============================================================

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  StudyCircle, CircleMember, CircleLeaderboardEntry,
  PathshalaEngineConfig,
} from '../types';

export class StudyCircleManager {
  private supabase: SupabaseClient;
  private config:   PathshalaEngineConfig;

  constructor(supabase: SupabaseClient, config: PathshalaEngineConfig) {
    this.supabase = supabase;
    this.config   = config;
  }

  // ── Create & manage circles ───────────────────────────────────────────────

  /**
   * Guardian creates a group reading circle for a kul.
   * Only one active circle per kul per path (enforced by DB unique constraint).
   */
  async create(
    guardianId: string,
    kulId:      string,
    pathId:     string,
    options: {
      title?:                 string;
      description?:           string;
      targetCompletionDate?:  string;   // ISO date string
      chunksPerWeek?:         number;
    } = {}
  ): Promise<StudyCircle> {
    const { data, error } = await this.supabase
      .from('pathshala_study_circles')
      .insert({
        kul_id:                 kulId,
        path_id:                pathId,
        created_by:             guardianId,
        title:                  options.title                ?? null,
        description:            options.description          ?? null,
        target_completion_date: options.targetCompletionDate ?? null,
        chunks_per_week:        options.chunksPerWeek        ?? 7,
        is_active:              true,
      })
      .select()
      .single();

    if (error) {
      if (this.config.debug) console.error('[StudyCircle] create:', error.message);
      throw error;
    }

    // Auto-enroll the guardian
    await this.join(guardianId, data.id);

    return data as StudyCircle;
  }

  /** Join an existing study circle */
  async join(userId: string, circleId: string): Promise<CircleMember> {
    const { data, error } = await this.supabase
      .from('pathshala_circle_members')
      .upsert({
        circle_id:        circleId,
        user_id:          userId,
        current_position: 1,
        last_activity_at: new Date().toISOString(),
      }, { onConflict: 'circle_id,user_id' })
      .select()
      .single();

    if (error) {
      if (this.config.debug) console.error('[StudyCircle] join:', error.message);
      throw error;
    }

    return data as CircleMember;
  }

  /** Leave a circle */
  async leave(userId: string, circleId: string): Promise<void> {
    await this.supabase
      .from('pathshala_circle_members')
      .delete()
      .eq('circle_id', circleId)
      .eq('user_id',   userId);
  }

  /** Close a circle (guardian only) */
  async close(circleId: string, guardianId: string): Promise<void> {
    await this.supabase
      .from('pathshala_study_circles')
      .update({ is_active: false })
      .eq('id',         circleId)
      .eq('created_by', guardianId);
  }

  // ── Fetch circles ─────────────────────────────────────────────────────────

  /** Active circles for a kul */
  async getForKul(kulId: string): Promise<Array<StudyCircle & { member_count: number }>> {
    const { data } = await this.supabase
      .from('pathshala_study_circles')
      .select('*, pathshala_circle_members(count)')
      .eq('kul_id',    kulId)
      .eq('is_active', true);

    return (data ?? []).map((r: Record<string, unknown>) => ({
      ...(r as unknown as StudyCircle),
      member_count: (r['pathshala_circle_members'] as Array<{ count: number }>)?.[0]?.count ?? 0,
    }));
  }

  /** Circles a user belongs to */
  async getForUser(userId: string): Promise<Array<StudyCircle & { my_position: number }>> {
    const { data } = await this.supabase
      .from('pathshala_circle_members')
      .select('current_position, pathshala_study_circles(*)')
      .eq('user_id', userId);

    return (data ?? [])
      .filter((r: Record<string, unknown>) => r['pathshala_study_circles'])
      .map((r: Record<string, unknown>) => ({
        ...(r['pathshala_study_circles'] as StudyCircle),
        my_position: r['current_position'] as number,
      }));
  }

  /** Members of a circle */
  async getMembers(circleId: string): Promise<CircleMember[]> {
    const { data } = await this.supabase
      .from('pathshala_circle_members')
      .select('*')
      .eq('circle_id', circleId)
      .order('current_position', { ascending: false });

    return (data ?? []) as CircleMember[];
  }

  // ── Progress ──────────────────────────────────────────────────────────────

  /** Update this member's position in a circle (called after marking a chunk read) */
  async updatePosition(userId: string, circleId: string, position: number): Promise<void> {
    await this.supabase
      .from('pathshala_circle_members')
      .update({ current_position: position, last_activity_at: new Date().toISOString() })
      .eq('circle_id', circleId)
      .eq('user_id',   userId);
  }

  /** Leaderboard for a circle — members ranked by progress */
  async getLeaderboard(circleId: string): Promise<CircleLeaderboardEntry[]> {
    const { data } = await this.supabase
      .from('pathshala_circle_leaderboard')
      .select('*')
      .eq('circle_id', circleId)
      .order('rank', { ascending: true });

    return (data ?? []) as CircleLeaderboardEntry[];
  }

  /** This week's expected chunk range for a circle (based on chunks_per_week) */
  async getWeeklyTarget(circleId: string): Promise<{
    week_number:    number;
    start_position: number;
    end_position:   number;
  }> {
    const { data: circle } = await this.supabase
      .from('pathshala_study_circles')
      .select('started_at, chunks_per_week')
      .eq('id', circleId)
      .single();

    if (!circle) return { week_number: 1, start_position: 1, end_position: 7 };

    const startDate  = new Date(circle.started_at);
    const now        = new Date();
    const weeksElapsed = Math.floor((now.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
    const weekNumber   = weeksElapsed + 1;
    const cpw          = circle.chunks_per_week ?? 7;

    return {
      week_number:    weekNumber,
      start_position: (weeksElapsed * cpw) + 1,
      end_position:   (weekNumber  * cpw),
    };
  }
}
