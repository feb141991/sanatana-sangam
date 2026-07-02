// ============================================================
// Kul Intelligence — Community AI layer (Phase 3)
//
// Three Edge Functions surface community data as personalised
// spiritual experiences:
//
//   ai-kul-nudge   → accountability nudge using kul's live activity
//   ai-kul-summary → weekly AI digest for each kul
//   ai-kul-task    → guardian assigns AI-suggested practice task
//
// Usage:
//   const kul = new KulIntelligence(supabase, config);
//
//   // Nudge a member who hasn't practiced but kul mates have
//   await kul.sendKulNudge(userId, { sendPush: true });
//
//   // Generate weekly summary for a kul
//   const summary = await kul.getWeeklySummary(kulId);
//
//   // Guardian requests an AI task suggestion
//   const task = await kul.suggestTask(guardianId, memberId, kulId);
//
//   // Guardian creates the task directly
//   const created = await kul.createTask(guardianId, memberId, kulId, {
//     override: { task_type: 'vrata' },
//   });
//
//   // View live kul activity (no Edge Function — direct DB query)
//   const activity = await kul.getLiveActivity(kulId);
// ============================================================

import type { SupabaseClient } from '@supabase/supabase-js';
import type { SadhanaEngineConfig } from '../types';

// ── Kul domain types ──

export type KulRole = 'admin' | 'guardian' | 'member';
export type KulTaskType = 'japa' | 'shloka' | 'vrata' | 'seva' | 'custom';
export type KulTaskUrgency = 'overdue' | 'due_today' | 'upcoming';

export interface KulTaskSuggestion {
  title: string;
  description: string;
  task_type: KulTaskType;
  content_ref: string | null;
  due_days: number;
  score: number;
  guardian_note: string;
}

export interface KulTaskResult {
  suggestion: KulTaskSuggestion;
  guardian_role: KulRole;
  created: boolean;
  task_id?: string;
  member_snapshot: {
    tradition: string | null;
    path: string | null;
    depth: string | null;
    streak: number | null;
    consistency: number | null;
    sessions_7d: number;
    last_mantra: string | null;
  };
}

export interface KulNudgeResult {
  nudged: boolean;
  skipped?: boolean;
  skip_reason?: string;
  kul_name?: string;
  kul_id?: string;
  members_practiced?: number;
  total_japa?: number;
  message?: string;
  call_to_action?: string;
  push_sent?: boolean;
  push_error?: string | null;
  generated_at?: string;
}

export interface KulWeeklySummary {
  kul_id: string;
  kul_name: string;
  active_members: number;
  total_japa: number;
  top_streak: number;
  notified: number;
  skipped?: boolean;
  skip_reason?: string;
}

export interface KulMemberActivity {
  kul_id: string;
  user_id: string;
  role: KulRole;
  japa_count_today: number;
  sessions_today: number;
  practiced_today: boolean;
}

export interface KulWeeklyStats {
  kul_id: string;
  kul_name: string;
  avatar_emoji: string | null;
  total_members: number;
  active_members_7d: number;
  total_japa_7d: number;
  avg_session_duration_s: number;
  top_streak: number;
  top_consistency: number;
}

export interface KulPendingTask {
  id: string;
  kul_id: string;
  assigned_to: string;
  assigned_by: string;
  title: string;
  task_type: KulTaskType;
  content_ref: string | null;
  due_date: string | null;
  score: number | null;
  completed: boolean;
  guardian_note: string | null;
  created_at: string;
  urgency: KulTaskUrgency;
}

export interface KulMemberProfile {
  kul_id: string;
  user_id: string;
  role: KulRole;
  joined_at: string;
  tradition: string | null;
  preferred_deity: string | null;
  primary_path: string | null;
  content_depth: string | null;
  current_streak: number | null;
  consistency_score: number | null;
  preferred_time: string | null;
  avg_session_duration_s: number | null;
  favorite_texts: string[] | null;
  re_engagement_style: string | null;
  sessions_last_7d: number;
  japa_last_7d: number;
  last_mantra: string | null;
}

// ── Option bags ──

export interface SuggestTaskOptions {
  /** Optional guardian overrides forwarded to the Edge Function */
  override?: {
    task_type?: KulTaskType;
    content_ref?: string;
    due_days?: number;
  };
}

export interface CreateTaskOptions extends SuggestTaskOptions {
  // No extra fields — create: true is added automatically
}

export interface KulNudgeOptions {
  /** Send push via OneSignal in addition to writing in-app notification */
  sendPush?: boolean;
}

export interface WeeklySummaryOptions {
  /** Process every kul in the project (admin cron use) */
  all?: boolean;
  /** Send push via OneSignal to members */
  sendPush?: boolean;
}

// ── Fallback helpers ──

function buildFallbackNudge(reason: string): KulNudgeResult {
  return {
    nudged: false,
    skipped: true,
    skip_reason: reason,
  };
}

function buildFallbackSummary(kulId: string, reason: string): KulWeeklySummary {
  return {
    kul_id: kulId,
    kul_name: '',
    active_members: 0,
    total_japa: 0,
    top_streak: 0,
    notified: 0,
    skipped: true,
    skip_reason: reason,
  };
}

// ============================================================

export class KulIntelligence {
  private supabase: SupabaseClient;
  private config: SadhanaEngineConfig;

  constructor(supabase: SupabaseClient, config: SadhanaEngineConfig) {
    this.supabase = supabase;
    this.config = config;
  }

  // ──────────────────────────────────────────────────────────
  // NUDGE — community accountability
  // ──────────────────────────────────────────────────────────

  /**
   * Fire a community accountability nudge for a user who hasn't practiced today.
   *
   * The Edge Function:
   *   1. Checks if the user already practiced → skips if yes
   *   2. Finds their kuls → checks kul_practice_today view
   *   3. Picks the kul with the most active members
   *   4. Generates a Gemini-powered "your kul mates are practicing" message
   *   5. Writes to the notifications table (in-app bell)
   *   6. Optionally sends OneSignal push
   *
   * This is safe to call idempotently — the notification_key ensures
   * only one nudge per user per day is written.
   */
  async sendKulNudge(
    userId: string,
    options: KulNudgeOptions = {}
  ): Promise<KulNudgeResult> {
    try {
      const { data, error } = await this.supabase.functions.invoke('ai-kul-nudge', {
        body: {
          user_id: userId,
          send_push: options.sendPush ?? false,
        },
      });

      if (error) throw error;

      const result = data as KulNudgeResult & {
        skipped?: boolean;
        reason?: string;
      };

      // Edge Function returns { skipped: true, reason: '...' } when no nudge needed
      if (result.skipped) {
        return {
          nudged: false,
          skipped: true,
          skip_reason: result.reason,
        };
      }

      return result as KulNudgeResult;
    } catch (err) {
      if (this.config.debug) {
        console.error('[KulIntelligence] sendKulNudge failed:', err);
      }
      return buildFallbackNudge('edge_function_error');
    }
  }

  // ──────────────────────────────────────────────────────────
  // WEEKLY SUMMARY — kul digest
  // ──────────────────────────────────────────────────────────

  /**
   * Generate (or trigger) a weekly practice summary for a kul.
   *
   * The Edge Function:
   *   1. Reads kul_weekly_stats view (7-day aggregation)
   *   2. Reads pending tasks + upcoming events for context
   *   3. Generates Gemini digest: a kul_message (posted to feed) +
   *      a member_notification (short push body)
   *   4. Posts the message to kul_messages as a bot post
   *   5. Upserts a notification for every member (idempotent via notification_key)
   *
   * Typically called from a pg_cron job every Sunday:
   *   SELECT net.http_post('...ai-kul-summary', '{"all":true}')
   */
  async getWeeklySummary(
    kulId: string,
    options: WeeklySummaryOptions = {}
  ): Promise<KulWeeklySummary> {
    try {
      const { data, error } = await this.supabase.functions.invoke('ai-kul-summary', {
        body: {
          kul_id: kulId,
          send_push: options.sendPush ?? false,
        },
      });

      if (error) throw error;

      // Edge Function returns { processed, results: [...] }
      const result = data as { processed: number; results: Array<{
        kul_id: string;
        kul_name?: string;
        active_members?: number;
        total_japa?: number;
        top_streak?: number;
        notified?: number;
        skipped?: boolean;
        reason?: string;
        error?: string;
      }> };

      const row = result.results?.find(r => r.kul_id === kulId);
      if (!row) return buildFallbackSummary(kulId, 'no_result_for_kul');

      if (row.skipped) {
        return buildFallbackSummary(kulId, row.reason ?? 'skipped');
      }

      return {
        kul_id: row.kul_id,
        kul_name: row.kul_name ?? '',
        active_members: row.active_members ?? 0,
        total_japa: row.total_japa ?? 0,
        top_streak: row.top_streak ?? 0,
        notified: row.notified ?? 0,
      };
    } catch (err) {
      if (this.config.debug) {
        console.error('[KulIntelligence] getWeeklySummary failed:', err);
      }
      return buildFallbackSummary(kulId, 'edge_function_error');
    }
  }

  /**
   * Trigger weekly summaries for ALL kuls.
   * Admin / cron use only — returns a summary of what was processed.
   */
  async runWeeklySummaryForAll(sendPush = false): Promise<{
    processed: number;
    results: Array<KulWeeklySummary & { error?: string }>;
  }> {
    try {
      const { data, error } = await this.supabase.functions.invoke('ai-kul-summary', {
        body: { all: true, send_push: sendPush },
      });

      if (error) throw error;
      return data as { processed: number; results: KulWeeklySummary[] };
    } catch (err) {
      if (this.config.debug) {
        console.error('[KulIntelligence] runWeeklySummaryForAll failed:', err);
      }
      return { processed: 0, results: [] };
    }
  }

  // ──────────────────────────────────────────────────────────
  // TASK — guardian assigns AI-suggested practice
  // ──────────────────────────────────────────────────────────

  /**
   * Ask Gemini to suggest a spiritually appropriate task for a kul member,
   * WITHOUT creating it. Returns the suggestion for the guardian to review.
   *
   * Example (guardian reviews before assigning):
   *   const result = await kul.suggestTask(guardianId, memberId, kulId);
   *   console.log(result.suggestion.title);       // "Chant 11 rounds of Mahamrityunjaya for 7 days"
   *   console.log(result.member_snapshot.streak); // 14
   */
  async suggestTask(
    guardianId: string,
    memberId: string,
    kulId: string,
    options: SuggestTaskOptions = {}
  ): Promise<KulTaskResult> {
    return this._invokeTaskFunction(guardianId, memberId, kulId, false, options);
  }

  /**
   * Suggest AND immediately create the task in kul_tasks.
   * Also sends an in-app notification to the member.
   *
   * Example (guardian assigns in one step):
   *   const result = await kul.createTask(guardianId, memberId, kulId);
   *   if (result.created) {
   *     toast(`Task "${result.suggestion.title}" assigned!`);
   *   }
   */
  async createTask(
    guardianId: string,
    memberId: string,
    kulId: string,
    options: CreateTaskOptions = {}
  ): Promise<KulTaskResult> {
    return this._invokeTaskFunction(guardianId, memberId, kulId, true, options);
  }

  private async _invokeTaskFunction(
    guardianId: string,
    memberId: string,
    kulId: string,
    create: boolean,
    options: SuggestTaskOptions
  ): Promise<KulTaskResult> {
    try {
      const { data, error } = await this.supabase.functions.invoke('ai-kul-task', {
        body: {
          guardian_id: guardianId,
          member_id:   memberId,
          kul_id:      kulId,
          create,
          override:    options.override ?? {},
        },
      });

      if (error) throw error;
      return data as KulTaskResult;
    } catch (err) {
      if (this.config.debug) {
        console.error('[KulIntelligence] task function failed:', err);
      }
      // Return a structured fallback so callers don't need to null-check
      return {
        suggestion: {
          title:         'Daily japa practice',
          description:   'Establish a consistent daily japa practice for this week.',
          task_type:     'japa',
          content_ref:   null,
          due_days:      7,
          score:         10,
          guardian_note: 'Regular practice builds tremendous spiritual momentum.',
        },
        guardian_role: 'member',
        created:       false,
        member_snapshot: {
          tradition:   null,
          path:        null,
          depth:       null,
          streak:      null,
          consistency: null,
          sessions_7d: 0,
          last_mantra: null,
        },
      };
    }
  }

  // ──────────────────────────────────────────────────────────
  // DIRECT DB — no Edge Function, Supabase client queries
  // ──────────────────────────────────────────────────────────

  /**
   * Fetch live practice activity for a kul today.
   * Reads the kul_practice_today view directly (created in migration 006).
   *
   * Useful for building a "who's practicing now" UI component.
   */
  async getLiveActivity(kulId: string): Promise<KulMemberActivity[]> {
    const { data, error } = await this.supabase
      .from('kul_practice_today')
      .select('kul_id, user_id, role, japa_count_today, sessions_today, practiced_today')
      .eq('kul_id', kulId);

    if (error) {
      if (this.config.debug) {
        console.error('[KulIntelligence] getLiveActivity failed:', error.message);
      }
      return [];
    }

    return (data ?? []) as KulMemberActivity[];
  }

  /**
   * Fetch weekly practice stats for a kul.
   * Reads the kul_weekly_stats view (7-day aggregation).
   */
  async getWeeklyStats(kulId: string): Promise<KulWeeklyStats | null> {
    const { data, error } = await this.supabase
      .from('kul_weekly_stats')
      .select('*')
      .eq('kul_id', kulId)
      .single();

    if (error) {
      if (this.config.debug) {
        console.error('[KulIntelligence] getWeeklyStats failed:', error.message);
      }
      return null;
    }

    return data as KulWeeklyStats;
  }

  /**
   * Fetch the combined practice profile of a member within their kul context.
   * Reads the kul_member_profiles view.
   *
   * Useful for guardians viewing a member's profile before suggesting a task.
   */
  async getMemberProfile(
    kulId: string,
    memberId: string
  ): Promise<KulMemberProfile | null> {
    const { data, error } = await this.supabase
      .from('kul_member_profiles')
      .select('*')
      .eq('kul_id', kulId)
      .eq('user_id', memberId)
      .single();

    if (error) {
      if (this.config.debug) {
        console.error('[KulIntelligence] getMemberProfile failed:', error.message);
      }
      return null;
    }

    return data as KulMemberProfile;
  }

  /**
   * Fetch all pending tasks for a kul, optionally filtered to a specific member.
   * Reads the kul_pending_tasks view (completed=false, ordered by due_date).
   *
   * @param kulId  The kul to fetch tasks for
   * @param memberId  Optional — filter to tasks assigned to this member only
   */
  async getPendingTasks(
    kulId: string,
    memberId?: string
  ): Promise<KulPendingTask[]> {
    let query = this.supabase
      .from('kul_pending_tasks')
      .select('*')
      .eq('kul_id', kulId);

    if (memberId) {
      query = query.eq('assigned_to', memberId);
    }

    const { data, error } = await query;

    if (error) {
      if (this.config.debug) {
        console.error('[KulIntelligence] getPendingTasks failed:', error.message);
      }
      return [];
    }

    return (data ?? []) as KulPendingTask[];
  }

  /**
   * Mark a kul task as completed.
   * Called by the member when they finish their assigned practice.
   *
   * @returns true if updated successfully
   */
  async completeTask(taskId: string, memberId: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('kul_tasks')
      .update({
        completed:    true,
        completed_at: new Date().toISOString(),
      })
      .eq('id', taskId)
      .eq('assigned_to', memberId); // safety: only the assignee can complete

    if (error) {
      if (this.config.debug) {
        console.error('[KulIntelligence] completeTask failed:', error.message);
      }
      return false;
    }

    return true;
  }

  /**
   * Convenience: fetch how many kul mates have practiced today
   * and what the combined japa count is. Good for "X members practiced
   * today · N japa" display in the kul header.
   */
  async getDailyKulPulse(kulId: string, excludeUserId?: string): Promise<{
    members_practiced: number;
    total_members: number;
    total_japa_today: number;
  }> {
    let query = this.supabase
      .from('kul_practice_today')
      .select('user_id, japa_count_today, practiced_today')
      .eq('kul_id', kulId);

    if (excludeUserId) {
      query = query.neq('user_id', excludeUserId);
    }

    const { data } = await query;
    const rows = data ?? [];

    return {
      members_practiced: rows.filter(r => r.practiced_today).length,
      total_members:     rows.length,
      total_japa_today:  rows.reduce((sum, r) => sum + (r.japa_count_today ?? 0), 0),
    };
  }
}
