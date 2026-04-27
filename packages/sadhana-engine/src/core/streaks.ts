// ============================================================
// Streak Tracker — daily practice completion and streak logic
// ============================================================

import type { SupabaseClient } from '@supabase/supabase-js';
import type { DailySadhana } from '../types';

export class StreakTracker {
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  // Get today's spiritual date (before 4 AM = still yesterday).
  // Falls back to UTC if Intl is unavailable.
  private today(timeZone?: string): string {
    try {
      const tz  = timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
      const now  = new Date();
      const fmt  = new Intl.DateTimeFormat('en-GB', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hour12: false });
      const parts = Object.fromEntries(fmt.formatToParts(now).map(p => [p.type, p.value]));
      const hour = Number(parts['hour'] ?? 12);
      const y = Number(parts['year']), m = Number(parts['month']), d = Number(parts['day']);
      if (hour < 4) {
        const prev = new Date(Date.UTC(y, m - 1, d - 1));
        return prev.toISOString().slice(0, 10);
      }
      return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    } catch {
      return new Date().toISOString().slice(0, 10);
    }
  }

  private yesterday(timeZone?: string): string {
    const todayIso = this.today(timeZone);
    const d = new Date(`${todayIso}T12:00:00Z`);
    d.setUTCDate(d.getUTCDate() - 1);
    return d.toISOString().slice(0, 10);
  }

  // Get or create today's sadhana record
  async getTodayRecord(userId: string): Promise<DailySadhana> {
    const date = this.today();

    const { data } = await this.supabase
      .from('daily_sadhana')
      .select('*')
      .eq('user_id', userId)
      .eq('date', date)
      .single();

    if (data) return data;

    // Create today's record — calculate streak from yesterday
    const yesterdayRecord = await this.getRecord(userId, this.yesterday());
    const streakCount = yesterdayRecord?.any_practice ? (yesterdayRecord.streak_count + 1) : 1;

    const newRecord: DailySadhana = {
      user_id: userId,
      date,
      japa_done: false,
      shloka_done: false,
      panchang_viewed: false,
      any_practice: false,
      streak_count: streakCount,
    };

    const { data: created, error } = await this.supabase
      .from('daily_sadhana')
      .upsert(newRecord, { onConflict: 'user_id,date' })
      .select()
      .single();

    if (error) throw error;
    return created;
  }

  // Mark a practice as done for today
  async markDone(userId: string, practice: 'japa' | 'shloka' | 'panchang'): Promise<DailySadhana> {
    const record = await this.getTodayRecord(userId);

    const updates: Partial<DailySadhana> = {};
    if (practice === 'japa') updates.japa_done = true;
    if (practice === 'shloka') updates.shloka_done = true;
    if (practice === 'panchang') updates.panchang_viewed = true;
    updates.any_practice = true;

    const { data, error } = await this.supabase
      .from('daily_sadhana')
      .update(updates)
      .eq('user_id', userId)
      .eq('date', this.today())
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Get current streak count
  async getCurrentStreak(userId: string): Promise<number> {
    const { data } = await this.supabase
      .from('daily_sadhana')
      .select('date, any_practice, streak_count')
      .eq('user_id', userId)
      .eq('any_practice', true)
      .order('date', { ascending: false })
      .limit(1);

    if (!data?.length) return 0;

    const lastActive = data[0];
    const lastDate = new Date(lastActive.date);
    const now = new Date(this.today());
    const daysDiff = Math.floor((now.getTime() - lastDate.getTime()) / 86400000);

    // If last active was today or yesterday, streak is alive
    if (daysDiff <= 1) return lastActive.streak_count;

    // Streak is broken
    return 0;
  }

  // Get longest streak ever
  async getLongestStreak(userId: string): Promise<number> {
    const { data } = await this.supabase
      .from('daily_sadhana')
      .select('streak_count')
      .eq('user_id', userId)
      .order('streak_count', { ascending: false })
      .limit(1);

    return data?.[0]?.streak_count || 0;
  }

  // Get streak history for display (last N days)
  async getStreakHistory(userId: string, days = 14): Promise<DailySadhana[]> {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const { data } = await this.supabase
      .from('daily_sadhana')
      .select('*')
      .eq('user_id', userId)
      .gte('date', since.toISOString().slice(0, 10))
      .order('date', { ascending: true });

    return data || [];
  }

  // Check if streak is at risk (practiced yesterday but not today)
  async isStreakAtRisk(userId: string): Promise<boolean> {
    const yesterdayRecord = await this.getRecord(userId, this.yesterday());
    const todayRecord = await this.getRecord(userId, this.today());

    return !!yesterdayRecord?.any_practice && !todayRecord?.any_practice;
  }

  // Get days since last practice (for nudge timing)
  async daysSinceLastPractice(userId: string): Promise<number> {
    const { data } = await this.supabase
      .from('daily_sadhana')
      .select('date')
      .eq('user_id', userId)
      .eq('any_practice', true)
      .order('date', { ascending: false })
      .limit(1);

    if (!data?.length) return -1; // never practiced

    const last = new Date(data[0].date);
    const now = new Date(this.today());
    return Math.floor((now.getTime() - last.getTime()) / 86400000);
  }

  // Private helper
  private async getRecord(userId: string, date: string): Promise<DailySadhana | null> {
    const { data } = await this.supabase
      .from('daily_sadhana')
      .select('*')
      .eq('user_id', userId)
      .eq('date', date)
      .single();

    return data;
  }
}
