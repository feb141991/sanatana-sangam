// ============================================================
// Sankalpa — Sacred vow / spiritual commitment tracker
//
// A sankalpa is a solemn spiritual commitment: "I will chant
// the Mahamrityunjaya mantra 1.25 lakh times in 40 days."
// This module manages the full lifecycle: creation, daily
// check-ins, streak tracking, and completion/break handling.
//
// The sankalpa table is in migration 001 (Phase 1 schema).
// Common targets: 21 days, 40 days, 108 days (mandala).
// Common types: japa (with target_count), shloka, vrata, custom.
//
// Usage:
//   const s = new SankalpaManager(supabase, config);
//   const vow = await s.create(userId, {
//     type: 'japa', description: 'Mahamrityunjaya 1.25 lakh',
//     target_days: 40, target_count: 125000, mantra_id: 'mahamrityunjaya',
//   });
//   await s.checkin(userId, vow.id, { count: 3240 });
//   const active = await s.getActive(userId);
// ============================================================

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Sankalpa, SankalpaStatus, SadhanaEngineConfig } from '../types';

export type { Sankalpa, SankalpaStatus };

export interface CreateSankalpaInput {
  type: Sankalpa['type'];
  description: string;
  target_days: number;
  target_count?: number;   // total japa count (e.g. 125000 for 1.25 lakh)
  mantra_id?: string;
  text_id?: string;
}

export interface SankalpaCheckin {
  sankalpa_id: string;
  count?: number;       // japa count for today's session
  note?: string;
  checkin_date?: string; // defaults to today
}

export interface SankalpaProgress {
  sankalpa: Sankalpa;
  days_elapsed: number;
  days_remaining: number;
  pct_days: number;           // 0-100
  count_done: number | null;  // total japa done so far (if target_count set)
  pct_count: number | null;   // 0-100
  on_track: boolean;
  streak: number;
}

export interface SankalpaCheckinResult {
  sankalpa: Sankalpa;
  today_count: number;
  total_count: number;
  streak: number;
  completed: boolean;   // true if this checkin completed the sankalpa
  broken: boolean;      // true if streak was broken before this checkin
}

// Traditional sankalpa durations
export const SANKALPA_DURATIONS = [
  { days: 21,  label: '21 days — short mandala' },
  { days: 40,  label: '40 days — deep commitment' },
  { days: 108, label: '108 days — full mandala' },
  { days: 365, label: '1 year — lifetime vow' },
];

// Traditional japa targets (purashcharana)
export const PURASHCHARANA_TARGETS: Record<string, { count: number; label: string }> = {
  'gayatri':         { count: 2400000, label: 'Gayatri — 24 lakh' },
  'mahamrityunjaya': { count: 125000,  label: 'Mahamrityunjaya — 1.25 lakh' },
  'hare_krishna':    { count: 1000000, label: 'Hare Krishna — 10 lakh' },
  'om_namah_shivay': { count: 500000,  label: 'Om Namah Shivay — 5 lakh' },
  'hanuman_chalisa': { count: 100,     label: 'Hanuman Chalisa — 100 recitations' },
};

export class SankalpaManager {
  private supabase: SupabaseClient;
  private config: SadhanaEngineConfig;

  constructor(supabase: SupabaseClient, config: SadhanaEngineConfig) {
    this.supabase = supabase;
    this.config   = config;
  }

  // ── Create a new sankalpa ──

  async create(userId: string, input: CreateSankalpaInput): Promise<Sankalpa | null> {
    const { data, error } = await this.supabase
      .from('sankalpa')
      .insert({
        user_id:       userId,
        type:          input.type,
        description:   input.description,
        target_days:   input.target_days,
        target_count:  input.target_count ?? null,
        mantra_id:     input.mantra_id ?? null,
        text_id:       input.text_id ?? null,
        started_at:    new Date().toISOString(),
        current_streak:0,
        longest_streak:0,
        status:        'active' as SankalpaStatus,
      })
      .select()
      .single();

    if (error) {
      if (this.config.debug) console.error('[SankalpaManager] create failed:', error.message);
      return null;
    }
    return data as Sankalpa;
  }

  // ── Daily check-in ──
  // Records that the user performed their sankalpa today.
  // Updates streak and checks for completion.

  async checkin(
    userId: string,
    sankalpaId: string,
    options: { count?: number; note?: string; date?: string } = {}
  ): Promise<SankalpaCheckinResult | null> {
    const today = options.date ?? new Date().toISOString().split('T')[0];

    // Fetch current sankalpa
    const { data: s, error } = await this.supabase
      .from('sankalpa')
      .select('*')
      .eq('id', sankalpaId)
      .eq('user_id', userId)
      .single();

    if (error || !s) {
      if (this.config.debug) console.error('[SankalpaManager] checkin — sankalpa not found');
      return null;
    }

    const sankalpa = s as Sankalpa;
    if (sankalpa.status !== 'active') {
      if (this.config.debug) console.warn('[SankalpaManager] checkin — sankalpa not active');
      return null;
    }

    // Check if already checked in today (via sadhana_events)
    const { count: existingCount } = await this.supabase
      .from('sadhana_events')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('event_type', 'sankalpa_created')
      .filter('event_data->>sankalpa_id', 'eq', sankalpaId)
      .gte('created_at', `${today}T00:00:00Z`);

    const alreadyCheckedIn = (existingCount ?? 0) > 0;

    // Compute new streak
    const newStreak  = sankalpa.current_streak + (alreadyCheckedIn ? 0 : 1);
    const newLongest = Math.max(sankalpa.longest_streak, newStreak);

    // Check if sankalpa is complete
    const daysElapsed = Math.floor(
      (Date.now() - new Date(sankalpa.started_at).getTime()) / 86400000
    );
    const completed = newStreak >= sankalpa.target_days;

    // Calculate running japa total (rough: sum from mala_sessions if mantra linked)
    let totalCount = 0;
    if (sankalpa.mantra_id && options.count) {
      const { data: sessions } = await this.supabase
        .from('mala_sessions')
        .select('count')
        .eq('user_id', userId)
        .gte('completed_at', sankalpa.started_at);
      totalCount = (sessions ?? []).reduce((sum, r) => sum + (r.count ?? 0), 0);
    }

    const countCompleted = sankalpa.target_count && totalCount >= sankalpa.target_count;

    // Update sankalpa
    await this.supabase
      .from('sankalpa')
      .update({
        current_streak: newStreak,
        longest_streak: newLongest,
        status:         (completed || countCompleted) ? 'completed' : 'active',
        completed_at:   (completed || countCompleted) ? new Date().toISOString() : null,
      })
      .eq('id', sankalpaId);

    // Log the checkin as a sadhana event
    if (!alreadyCheckedIn) {
      await this.supabase.from('sadhana_events').insert({
        user_id:    userId,
        event_type: 'sankalpa_created',
        event_data: {
          sankalpa_id:  sankalpaId,
          day:          newStreak,
          japa_count:   options.count ?? null,
          note:         options.note ?? null,
        },
      });
    }

    return {
      sankalpa: { ...sankalpa, current_streak: newStreak, longest_streak: newLongest },
      today_count: options.count ?? 0,
      total_count: totalCount,
      streak:      newStreak,
      completed:   !!(completed || countCompleted),
      broken:      false,
    };
  }

  // ── Mark sankalpa as broken ──
  // Called if the user missed a day and wants to acknowledge it.

  async markBroken(userId: string, sankalpaId: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('sankalpa')
      .update({ status: 'broken' as SankalpaStatus })
      .eq('id', sankalpaId)
      .eq('user_id', userId);

    if (!error) {
      await this.supabase.from('sadhana_events').insert({
        user_id:    userId,
        event_type: 'streak_break',
        event_data: { sankalpa_id: sankalpaId },
      });
    }

    return !error;
  }

  // ── Pause / resume ──

  async updateStatus(
    userId: string,
    sankalpaId: string,
    status: 'paused' | 'active'
  ): Promise<boolean> {
    const { error } = await this.supabase
      .from('sankalpa')
      .update({ status: status as SankalpaStatus })
      .eq('id', sankalpaId)
      .eq('user_id', userId);
    return !error;
  }

  // ── Fetch active sankalpas ──

  async getActive(userId: string): Promise<Sankalpa[]> {
    const { data } = await this.supabase
      .from('sankalpa')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('started_at');
    return (data ?? []) as Sankalpa[];
  }

  // ── Fetch all sankalpas ──

  async getAll(userId: string): Promise<Sankalpa[]> {
    const { data } = await this.supabase
      .from('sankalpa')
      .select('*')
      .eq('user_id', userId)
      .order('started_at', { ascending: false });
    return (data ?? []) as Sankalpa[];
  }

  // ── Get rich progress for a sankalpa ──

  async getProgress(userId: string, sankalpaId: string): Promise<SankalpaProgress | null> {
    const { data: s } = await this.supabase
      .from('sankalpa')
      .select('*')
      .eq('id', sankalpaId)
      .eq('user_id', userId)
      .single();

    if (!s) return null;
    const sankalpa = s as Sankalpa;

    const daysElapsed   = Math.floor(
      (Date.now() - new Date(sankalpa.started_at).getTime()) / 86400000
    );
    const daysRemaining = Math.max(0, sankalpa.target_days - daysElapsed);
    const pctDays       = Math.min(100, Math.round((sankalpa.current_streak / sankalpa.target_days) * 100));

    // Japa count from mala_sessions if linked
    let countDone: number | null = null;
    let pctCount:  number | null = null;

    if (sankalpa.mantra_id && sankalpa.target_count) {
      const { data: sessions } = await this.supabase
        .from('mala_sessions')
        .select('count')
        .eq('user_id', userId)
        .gte('completed_at', sankalpa.started_at);
      countDone = (sessions ?? []).reduce((sum, r) => sum + (r.count ?? 0), 0);
      pctCount  = Math.min(100, Math.round((countDone / sankalpa.target_count) * 100));
    }

    // On track: streak >= expected days at this point
    const on_track = sankalpa.current_streak >= Math.min(daysElapsed, sankalpa.target_days);

    return {
      sankalpa,
      days_elapsed:  daysElapsed,
      days_remaining:daysRemaining,
      pct_days:      pctDays,
      count_done:    countDone,
      pct_count:     pctCount,
      on_track,
      streak:        sankalpa.current_streak,
    };
  }

  // ── Delete a sankalpa ──

  async delete(userId: string, sankalpaId: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('sankalpa')
      .delete()
      .eq('id', sankalpaId)
      .eq('user_id', userId);
    return !error;
  }
}
