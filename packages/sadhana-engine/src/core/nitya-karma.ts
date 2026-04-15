// ============================================================
// Nitya Karma — Daily Ritual Tracker (Phase 4)
//
// Tracks morning sequence completion step by step.
// Each of the 7 steps can be marked individually.
// Streak tracked separately from japa streak.
//
// Usage:
//   const nk = new NityaKarma(supabase, config);
//   const seq = await nk.getMorningSequence(userId, { availableMinutes: 45 });
//   await nk.markStep(userId, 'japa_done');
//   const log = await nk.getTodayLog(userId);
//   const streak = await nk.getStreak(userId);
// ============================================================

import type { SupabaseClient } from '@supabase/supabase-js';
import type { SadhanaEngineConfig } from '../types';

export type NityaStep =
  | 'woke_brahma_muhurta'
  | 'snana_done'
  | 'tilak_done'
  | 'sandhya_done'
  | 'japa_done'
  | 'shloka_done'
  | 'aarti_done';

export interface NityaSequenceStep {
  id: NityaStep;
  label: string;
  minutes: number;
  icon: string;
  description: string;
  completed: boolean;
}

export interface NityaMorningSequence {
  sequence: NityaSequenceStep[];
  greeting: string;
  panchang_context: {
    tithi: string;
    paksha: string;
    vrata: string | null;
    vaara: string;
    vaara_vrata: string | null;
    tradition_guidance: string;
  };
  log: NityaKarmaLog | null;
  generated_at: string;
}

export interface NityaKarmaLog {
  id: string;
  user_id: string;
  date: string;
  woke_brahma_muhurta: boolean;
  snana_done: boolean;
  tilak_done: boolean;
  sandhya_done: boolean;
  japa_done: boolean;
  shloka_done: boolean;
  aarti_done: boolean;
  steps_completed: number;
  full_sequence: boolean;
  completed_at: string | null;
}

export interface NityaKarmaStreak {
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_full_date: string | null;
}

export interface GetSequenceOptions {
  availableMinutes?: number;
  date?: string;
}

// ── Static fallback sequence (matches DB step names) ──
const DEFAULT_SEQUENCE: Omit<NityaSequenceStep, 'completed'>[] = [
  { id: 'woke_brahma_muhurta', label: 'Wake at Brahma Muhurta',  minutes: 5,  icon: '🌅', description: 'Rise before sunrise — the most sattvic hour.' },
  { id: 'snana_done',          label: 'Snana — ritual bath',     minutes: 10, icon: '🪣', description: 'Cool bath with mantra: Om Apavitrah Pavitro Va...' },
  { id: 'tilak_done',          label: 'Apply tilak',             minutes: 3,  icon: '🔴', description: 'Gopi-chandana (Vaishnav), vibhuti (Shaiv), or kumkum (Shakta).' },
  { id: 'sandhya_done',        label: 'Sandhya Vandana',         minutes: 15, icon: '🙏', description: 'Achamana, pranayama, arghya, and Gayatri japa.' },
  { id: 'japa_done',           label: 'Morning Japa',            minutes: 20, icon: '📿', description: 'Minimum 1 mala of your ishta mantra. Face east or north.' },
  { id: 'shloka_done',         label: 'Shloka Svadhyaya',        minutes: 10, icon: '📖', description: 'A chapter or few verses from your chosen shastra.' },
  { id: 'aarti_done',          label: 'Aarti & Diya',            minutes: 5,  icon: '🪔', description: 'Light a diya at the home shrine. Offer flowers.' },
];

export class NityaKarma {
  private supabase: SupabaseClient;
  private config: SadhanaEngineConfig;

  constructor(supabase: SupabaseClient, config: SadhanaEngineConfig) {
    this.supabase = supabase;
    this.config   = config;
  }

  // ── Get personalised morning sequence ──
  // Calls ai-nitya-sequence Edge Function.
  // Falls back to static sequence if unavailable.

  async getMorningSequence(
    userId: string,
    options: GetSequenceOptions = {}
  ): Promise<NityaMorningSequence> {
    try {
      const { data, error } = await this.supabase.functions.invoke('ai-nitya-sequence', {
        body: {
          user_id:           userId,
          date:              options.date,
          available_minutes: options.availableMinutes ?? 60,
        },
      });
      if (error) throw error;
      return data as NityaMorningSequence;
    } catch (err) {
      if (this.config.debug) console.error('[NityaKarma] getMorningSequence failed:', err);
      // Return static fallback with today's log
      const log = await this.getTodayLog(userId);
      return {
        sequence: DEFAULT_SEQUENCE.map(s => ({
          ...s,
          completed: log ? (log as unknown as Record<string, unknown>)[s.id] === true : false,
        })),
        greeting:         'Hari Om. Begin your sadhana with devotion.',
        panchang_context: { tithi: '', paksha: '', vrata: null, vaara: '', vaara_vrata: null, tradition_guidance: '' },
        log,
        generated_at:     new Date().toISOString(),
      };
    }
  }

  // ── Mark a single step complete ──
  // Uses the mark_nitya_step SQL function for atomic update.

  async markStep(
    userId: string,
    step: NityaStep,
    done = true,
    date?: string
  ): Promise<NityaKarmaLog | null> {
    const { data, error } = await this.supabase.rpc('mark_nitya_step', {
      p_user_id: userId,
      p_date:    date ?? new Date().toISOString().split('T')[0],
      p_step:    step,
      p_done:    done,
    });

    if (error) {
      if (this.config.debug) console.error('[NityaKarma] markStep failed:', error.message);
      return null;
    }

    // After marking, check if full sequence just completed → update streak
    const log = data as NityaKarmaLog;
    if (log?.full_sequence && done) {
      await this.refreshStreak(userId);
    }

    return log;
  }

  // ── Mark all steps at once ──
  // Convenience for syncing from the app (e.g. offline catch-up).

  async markAllSteps(
    userId: string,
    steps: Partial<Record<NityaStep, boolean>>,
    date?: string
  ): Promise<NityaKarmaLog | null> {
    let log: NityaKarmaLog | null = null;
    for (const [step, done] of Object.entries(steps)) {
      log = await this.markStep(userId, step as NityaStep, done ?? true, date);
    }
    return log;
  }

  // ── Get today's log ──

  async getTodayLog(userId: string, date?: string): Promise<NityaKarmaLog | null> {
    const dateKey = date ?? new Date().toISOString().split('T')[0];
    const { data, error } = await this.supabase
      .from('nitya_karma_log')
      .select('*')
      .eq('user_id', userId)
      .eq('date', dateKey)
      .single();

    if (error && error.code !== 'PGRST116') {
      if (this.config.debug) console.error('[NityaKarma] getTodayLog failed:', error.message);
    }

    return data as NityaKarmaLog | null;
  }

  // ── Get log for a date range ──

  async getHistory(
    userId: string,
    days = 30
  ): Promise<NityaKarmaLog[]> {
    const from = new Date();
    from.setDate(from.getDate() - days);

    const { data } = await this.supabase
      .from('nitya_karma_log')
      .select('*')
      .eq('user_id', userId)
      .gte('date', from.toISOString().split('T')[0])
      .order('date', { ascending: false });

    return (data ?? []) as NityaKarmaLog[];
  }

  // ── Get current streak ──

  async getStreak(userId: string): Promise<NityaKarmaStreak> {
    const { data } = await this.supabase
      .from('nitya_karma_streaks')
      .select('*')
      .eq('user_id', userId)
      .single();

    return (data ?? { user_id: userId, current_streak: 0, longest_streak: 0, last_full_date: null }) as NityaKarmaStreak;
  }

  // ── Refresh streak after marking full sequence ──
  // Recalculates current streak from the log table.

  async refreshStreak(userId: string): Promise<void> {
    // Count consecutive days with full_sequence = true going back from today
    const { data: logs } = await this.supabase
      .from('nitya_karma_log')
      .select('date, full_sequence')
      .eq('user_id', userId)
      .eq('full_sequence', true)
      .order('date', { ascending: false })
      .limit(365);

    if (!logs || logs.length === 0) {
      await this.supabase.from('nitya_karma_streaks').upsert({
        user_id: userId, current_streak: 0, longest_streak: 0, last_full_date: null,
      }, { onConflict: 'user_id' });
      return;
    }

    let streak = 1;
    let longest = 1;
    let prev = new Date(logs[0].date);

    for (let i = 1; i < logs.length; i++) {
      const curr = new Date(logs[i].date);
      const diff = (prev.getTime() - curr.getTime()) / 86400000;
      if (diff === 1) {
        streak++;
        longest = Math.max(longest, streak);
      } else {
        break;
      }
      prev = curr;
    }

    await this.supabase.from('nitya_karma_streaks').upsert({
      user_id:        userId,
      current_streak: streak,
      longest_streak: longest,
      last_full_date: logs[0].date,
      updated_at:     new Date().toISOString(),
    }, { onConflict: 'user_id' });
  }

  // ── Completion percentage for today ──

  completionPercent(log: NityaKarmaLog | null): number {
    if (!log) return 0;
    return Math.round((log.steps_completed / 7) * 100);
  }
}
