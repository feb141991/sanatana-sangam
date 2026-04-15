// ============================================================
// Badges — achievement system for Pathshala
// ============================================================

import type { SupabaseClient } from '@supabase/supabase-js';
import type { PathshalaBadge, UserBadge, BadgeCategory, PathshalaEngineConfig } from '../types';

export class BadgeManager {
  private supabase: SupabaseClient;
  private config:   PathshalaEngineConfig;

  constructor(supabase: SupabaseClient, config: PathshalaEngineConfig) {
    this.supabase = supabase;
    this.config   = config;
  }

  // ── Browse badges ─────────────────────────────────────────────────────────

  async getAll(): Promise<PathshalaBadge[]> {
    const { data } = await this.supabase
      .from('pathshala_badges')
      .select('*')
      .eq('is_active', true)
      .order('category');

    return (data ?? []) as PathshalaBadge[];
  }

  async getByCategory(category: BadgeCategory): Promise<PathshalaBadge[]> {
    const { data } = await this.supabase
      .from('pathshala_badges')
      .select('*')
      .eq('is_active', true)
      .eq('category', category);

    return (data ?? []) as PathshalaBadge[];
  }

  // ── User badges ───────────────────────────────────────────────────────────

  /** All badges earned by a user */
  async getEarned(userId: string): Promise<UserBadge[]> {
    const { data } = await this.supabase
      .from('pathshala_user_badges')
      .select('*, pathshala_badges(*)')
      .eq('user_id', userId)
      .order('earned_at', { ascending: false });

    return (data ?? []).map((r: Record<string, unknown>) => ({
      ...(r as unknown as UserBadge),
      badge: r['pathshala_badges'] as PathshalaBadge,
    }));
  }

  /** Check if user has earned a specific badge */
  async hasEarned(userId: string, badgeSlug: string): Promise<boolean> {
    const { data } = await this.supabase
      .from('pathshala_user_badges')
      .select('id')
      .eq('user_id', userId)
      .eq('pathshala_badges.slug', badgeSlug)
      .limit(1);

    return (data?.length ?? 0) > 0;
  }

  /**
   * Check and award all badges a user is eligible for.
   * Call this after: path completion, recitation score, certification, circle completion.
   */
  async checkAndAward(userId: string): Promise<UserBadge[]> {
    const newlyEarned: UserBadge[] = [];

    // Fetch all badge definitions
    const allBadges = await this.getAll();
    const earned    = await this.getEarned(userId);
    const earnedIds = new Set(earned.map(b => b.badge_id));

    for (const badge of allBadges) {
      if (earnedIds.has(badge.id)) continue; // already earned

      const eligible = await this._checkCriteria(userId, badge);
      if (eligible) {
        const awarded = await this._award(userId, badge.id, {});
        if (awarded) newlyEarned.push(awarded);
      }
    }

    return newlyEarned;
  }

  /** Manually award a badge (admin / Edge Function use) */
  async award(
    userId:   string,
    badgeSlug: string,
    context:  Record<string, unknown> = {}
  ): Promise<UserBadge | null> {
    const { data: badge } = await this.supabase
      .from('pathshala_badges')
      .select('id')
      .eq('slug', badgeSlug)
      .single();

    if (!badge) return null;
    return this._award(userId, badge.id, context);
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private async _award(
    userId:  string,
    badgeId: string,
    context: Record<string, unknown>
  ): Promise<UserBadge | null> {
    const { data, error } = await this.supabase
      .from('pathshala_user_badges')
      .upsert({ user_id: userId, badge_id: badgeId, context }, { onConflict: 'user_id,badge_id' })
      .select('*, pathshala_badges(*)')
      .single();

    if (error) {
      if (this.config.debug) console.error('[Badges] award:', error.message);
      return null;
    }

    const d = data as unknown as Record<string, unknown>;
    return { ...(d as unknown as UserBadge), badge: d['pathshala_badges'] as PathshalaBadge };
  }

  private async _checkCriteria(userId: string, badge: PathshalaBadge): Promise<boolean> {
    const c = badge.criteria as Record<string, unknown>;
    const type = c['type'] as string;

    try {
      switch (type) {

        case 'path_complete': {
          const slug = c['path_slug'] as string;
          const { data } = await this.supabase
            .from('pathshala_enrollments')
            .select('completed_at, pathshala_paths!inner(slug)')
            .eq('user_id', userId)
            .eq('pathshala_paths.slug', slug)
            .not('completed_at', 'is', null)
            .limit(1);
          return (data?.length ?? 0) > 0;
        }

        case 'path_progress': {
          const slug     = c['path_slug'] as string;
          const minPos   = c['min_position'] as number;
          const { data } = await this.supabase
            .from('pathshala_enrollments')
            .select('current_position, pathshala_paths!inner(slug)')
            .eq('user_id', userId)
            .eq('pathshala_paths.slug', slug)
            .gte('current_position', minPos)
            .limit(1);
          return (data?.length ?? 0) > 0;
        }

        case 'recitation_count': {
          const minCount = c['min_count'] as number;
          const { count } = await this.supabase
            .from('pathshala_recordings')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId);
          return (count ?? 0) >= minCount;
        }

        case 'recitation_score': {
          const minScore = c['min_score'] as number;
          const reqCount = c['count'] as number;
          const { count } = await this.supabase
            .from('pathshala_recitation_reviews')
            .select('*, pathshala_recordings!inner(user_id)', { count: 'exact', head: true })
            .eq('pathshala_recordings.user_id', userId)
            .gte('overall_score', minScore);
          return (count ?? 0) >= reqCount;
        }

        case 'verses_certified': {
          const reqCount = c['count'] as number;
          const { count } = await this.supabase
            .from('pathshala_verse_mastery')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('certified', true);
          return (count ?? 0) >= reqCount;
        }

        case 'full_mastery_count': {
          const minCount = c['min_count'] as number;
          const { count } = await this.supabase
            .from('pathshala_verse_mastery')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('is_fully_mastered', true);
          return (count ?? 0) >= minCount;
        }

        case 'study_circle_complete': {
          // User's position >= path total_chunks in at least one circle
          const { data } = await this.supabase
            .from('pathshala_circle_members')
            .select('current_position, pathshala_study_circles!inner(path_id, pathshala_paths!inner(total_chunks))')
            .eq('user_id', userId);
          return (data ?? []).some((r: Record<string, unknown>) => {
            const circle = r['pathshala_study_circles'] as Record<string, unknown>;
            const path   = circle?.['pathshala_paths'] as Record<string, unknown>;
            return (r['current_position'] as number) >= (path?.['total_chunks'] as number ?? 9999);
          });
        }

        default:
          return false;
      }
    } catch {
      return false;
    }
  }
}
