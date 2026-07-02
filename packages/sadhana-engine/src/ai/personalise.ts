// ============================================================
// Personalise — Daily personalised content (Phase 2)
//
// Fetches or generates today's personalised content package
// for a user. Checks Supabase recommendations cache first;
// if stale or missing, calls the ai-personalise Edge Function.
//
// Usage:
//   const p = new PersonalisationEngine(supabase, config);
//   const content = await p.getTodayContent(userId);
// ============================================================

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  PersonalisedContent,
  SadhanaEngineConfig,
  Panchang,
  ScriptureVerse,
} from '../types';

export interface TodayContent {
  greeting: string;
  shloka: ScriptureVerse;
  shloka_context: string;
  practice_suggestion: string;
  nudge?: string;
  panchang: Panchang;
  generated_at: string;
  from_cache: boolean;
}

export interface PracticeStats {
  current_streak: number;
  longest_streak: number;
  consistency_score: number;
  preferred_time: string;
  last_active: string | null;
}

export class PersonalisationEngine {
  private supabase: SupabaseClient;
  private config: SadhanaEngineConfig;
  private memCache = new Map<string, TodayContent>();

  constructor(supabase: SupabaseClient, config: SadhanaEngineConfig) {
    this.supabase = supabase;
    this.config = config;
  }

  // ── Primary method: get today's personalised content ──
  // Returns cached content if already generated today,
  // otherwise calls the Gemini edge function.

  async getTodayContent(userId: string): Promise<TodayContent> {
    const today = new Date().toISOString().split('T')[0];
    const cacheKey = `${userId}:${today}`;

    // 1. In-memory cache (same session)
    if (this.memCache.has(cacheKey)) {
      return this.memCache.get(cacheKey)!;
    }

    // 2. Supabase recommendations table (survives sessions)
    const cached = await this.fetchCachedRecommendation(userId, today);
    if (cached) {
      this.memCache.set(cacheKey, { ...cached, from_cache: true });
      return this.memCache.get(cacheKey)!;
    }

    // 3. Generate fresh via Edge Function
    const fresh = await this.generateFresh(userId);
    await this.cacheRecommendation(userId, today, fresh);
    const result = { ...fresh, from_cache: false };
    this.memCache.set(cacheKey, result);
    return result;
  }

  // ── Force regenerate (e.g. user taps "refresh") ──

  async regenerate(userId: string): Promise<TodayContent> {
    const today = new Date().toISOString().split('T')[0];
    const cacheKey = `${userId}:${today}`;
    this.memCache.delete(cacheKey);

    const fresh = await this.generateFresh(userId);
    await this.cacheRecommendation(userId, today, fresh);
    const result = { ...fresh, from_cache: false };
    this.memCache.set(cacheKey, result);
    return result;
  }

  // ── Weekly practice plan ──

  async getWeeklyPlan(userId: string): Promise<string> {
    const { data, error } = await this.supabase.functions.invoke('ai-practice-plan', {
      body: { user_id: userId },
    });
    if (error) throw new Error(`Practice plan failed: ${error.message}`);
    return data.plan as string;
  }

  // ── Private: check Supabase cache ──

  private async fetchCachedRecommendation(
    userId: string,
    today: string
  ): Promise<TodayContent | null> {
    const { data, error } = await this.supabase
      .from('recommendations')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today)
      .eq('type', 'daily_content')
      .single();

    if (error || !data) return null;

    // If the stored content has all required fields, return it
    const content = data.content as Record<string, unknown>;
    if (content?.greeting && content?.shloka && content?.panchang) {
      return content as unknown as TodayContent;
    }
    return null;
  }

  // ── Private: call Edge Function ──

  private async generateFresh(userId: string): Promise<TodayContent> {
    const { data, error } = await this.supabase.functions.invoke('ai-personalise', {
      body: { user_id: userId },
    });

    if (error) throw new Error(`Personalisation failed: ${error.message}`);
    return data as TodayContent;
  }

  // ── Private: save to Supabase ──

  private async cacheRecommendation(
    userId: string,
    date: string,
    content: TodayContent
  ): Promise<void> {
    await this.supabase.from('recommendations').upsert(
      {
        user_id: userId,
        date,
        type: 'daily_content',
        content,
        generated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,date,type' }
    );
  }
}
