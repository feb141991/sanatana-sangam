// ============================================================
// ShlokaOfDay — Personalised daily verse
// ============================================================

import type { SupabaseClient } from '@supabase/supabase-js';
import type { ShlokaOfDay, PathshalaEngineConfig } from '../types';

export class ShlokaOfDayEngine {
  private supabase: SupabaseClient;
  private config:   PathshalaEngineConfig;

  constructor(supabase: SupabaseClient, config: PathshalaEngineConfig) {
    this.supabase = supabase;
    this.config   = config;
  }

  /**
   * Get today's personalised verse.
   * Calls ai-shloka-of-day Edge Function.
   * Result is cached in recommendations — repeat calls that day are instant.
   */
  async getToday(userId: string): Promise<ShlokaOfDay> {
    const { data, error } = await this.supabase.functions.invoke('ai-shloka-of-day', {
      body: { user_id: userId },
    });

    if (error) {
      if (this.config.debug) console.error('[ShlokaOfDay] getToday:', error.message);
      throw error;
    }

    return data as ShlokaOfDay;
  }

  /**
   * Check if today's shloka is already cached (avoids an Edge Function call).
   * Returns the cached result or null.
   */
  async getCached(userId: string): Promise<ShlokaOfDay | null> {
    const today = new Date().toISOString().split('T')[0];

    const { data } = await this.supabase
      .from('recommendations')
      .select('content')
      .eq('user_id', userId)
      .eq('date',    today)
      .eq('type',    'shloka_of_day')
      .maybeSingle();

    if (!data?.content) return null;
    return { ...data.content as ShlokaOfDay, cached: true };
  }

  /**
   * Cache-first: return cached result if available, otherwise call Edge Function.
   */
  async getOrFetch(userId: string): Promise<ShlokaOfDay> {
    const cached = await this.getCached(userId);
    if (cached) return cached;
    return this.getToday(userId);
  }
}
