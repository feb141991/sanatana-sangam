// ============================================================
// Practice Plan — Personalised weekly sadhana planner (Phase 2)
//
// Generates a structured 7-day sadhana plan using the user's
// profile, active sankalpas, current streak, and weekly panchang.
// Powered by the ai-practice-plan Edge Function + Gemini Flash.
//
// Usage:
//   const planner = new PracticePlan(supabase, config);
//   const plan = await planner.getWeeklyPlan(userId);
//   const today = planner.getTodayFromPlan(plan);
// ============================================================

import type { SupabaseClient } from '@supabase/supabase-js';
import type { SadhanaEngineConfig } from '../types';

export type PracticeFocus = 'japa' | 'shloka' | 'vrata' | 'seva' | 'dhyana';

export interface DayPlan {
  date: string;             // YYYY-MM-DD
  vaara: string;            // Somvar, Mangalvar, ...
  tithi: string;            // Shukla Ekadashi, etc.
  vrata: string | null;     // Ekadashi, Pradosh, etc.
  vaara_vrata: string | null;
  intention: string;        // personalised daily guidance
  focus: PracticeFocus;
  japa_rounds: number;
  suggested_text: string;   // gita, hanuman_chalisa, etc.
  special_practice: string | null;
}

export interface WeeklyPlan {
  plan: DayPlan[];
  week_intention: string;
  milestone: string | null;
  current_streak: number;
  active_sankalpas: number;
  generated_at: string;
}

export interface GetPlanOptions {
  weekStartDate?: Date;
  availableMinutesPerDay?: number;
}

// Local J2000 panchang — always available even without Edge Function
const J2000_NEW_MOON_MS = 947182440000;
const LUNAR_MONTH_MS    = 29.53058867 * 86400000;
const TITHI_NAMES = ['Pratipada','Dwitiya','Tritiya','Chaturthi','Panchami','Shashthi',
  'Saptami','Ashtami','Navami','Dashami','Ekadashi','Dwadashi','Trayodashi','Chaturdashi','Purnima/Amavasya'];
const VAARA_NAMES = ['Ravivar','Somvar','Mangalvar','Budhvar','Guruvar','Shukravar','Shanivar'];

function localPanchang(date: Date): Pick<DayPlan, 'vaara' | 'tithi' | 'vrata' | 'vaara_vrata'> {
  const elapsed  = date.getTime() - J2000_NEW_MOON_MS;
  const lunar    = ((elapsed % LUNAR_MONTH_MS) + LUNAR_MONTH_MS) % LUNAR_MONTH_MS;
  const lunarDay = Math.floor(lunar / (LUNAR_MONTH_MS / 30)) + 1;
  const paksha   = lunarDay <= 15 ? 'Shukla' : 'Krishna';
  const tithi_n  = lunarDay <= 15 ? lunarDay : lunarDay - 15;
  const vaara    = VAARA_NAMES[date.getDay()];
  const VAARA_VRATA: Record<string, string> = {
    'Somvar':'Somvar vrat (Shiva)', 'Mangalvar':'Mangalvar vrat (Hanuman/Devi)',
    'Guruvar':'Guruvar vrat (Vishnu)', 'Shukravar':'Shukravar vrat (Lakshmi)',
    'Shanivar':'Shanivar vrat (Shani)',
  };
  let vrata: string | null = null;
  if (tithi_n === 11) vrata = 'Ekadashi';
  else if (tithi_n === 13 || lunarDay === 28) vrata = 'Pradosh';
  else if (tithi_n === 4 && paksha === 'Shukla') vrata = 'Vinayaka Chaturthi';
  else if (lunarDay === 15) vrata = 'Purnima';
  else if (lunarDay === 30) vrata = 'Amavasya';
  else if (tithi_n === 8 && paksha === 'Krishna') vrata = 'Kalashtami';
  return {
    vaara,
    tithi: `${paksha} ${TITHI_NAMES[Math.min(tithi_n - 1, 14)]}`,
    vrata,
    vaara_vrata: VAARA_VRATA[vaara] ?? null,
  };
}

function buildFallbackPlan(startDate: Date): WeeklyPlan {
  const plan: DayPlan[] = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    const p = localPanchang(d);
    return {
      date:             d.toISOString().split('T')[0],
      ...p,
      intention:        p.vrata
        ? `${p.vrata} — observe the fast, chant 3 malas, and read the associated katha.`
        : `Regular sadhana — complete your japa, read a Gita chapter, and light a diya.`,
      focus:            p.vrata ? 'vrata' : 'japa' as PracticeFocus,
      japa_rounds:      p.vrata ? 3 : 1,
      suggested_text:   'gita',
      special_practice: p.vaara_vrata ?? null,
    };
  });
  return {
    plan,
    week_intention:  'Steady practice, day by day. Each day of sadhana is a step toward the Divine.',
    milestone:       null,
    current_streak:  0,
    active_sankalpas:0,
    generated_at:    new Date().toISOString(),
  };
}

export class PracticePlan {
  private supabase: SupabaseClient;
  private config: SadhanaEngineConfig;

  constructor(supabase: SupabaseClient, config: SadhanaEngineConfig) {
    this.supabase = supabase;
    this.config   = config;
  }

  // ── Generate a personalised 7-day plan ──

  async getWeeklyPlan(
    userId: string,
    options: GetPlanOptions = {}
  ): Promise<WeeklyPlan> {
    const startDate = options.weekStartDate ?? (() => {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      return d;
    })();

    try {
      const { data, error } = await this.supabase.functions.invoke('ai-practice-plan', {
        body: {
          user_id:                    userId,
          week_start_date:            startDate.toISOString().split('T')[0],
          available_minutes_per_day:  options.availableMinutesPerDay ?? 45,
        },
      });
      if (error) throw error;
      return data as WeeklyPlan;
    } catch (err) {
      if (this.config.debug) console.error('[PracticePlan] getWeeklyPlan failed:', err);
      return buildFallbackPlan(startDate);
    }
  }

  // ── Extract today's plan from a weekly plan ──

  getTodayFromPlan(plan: WeeklyPlan): DayPlan | null {
    const today = new Date().toISOString().split('T')[0];
    return plan.plan.find(d => d.date === today) ?? null;
  }

  // ── Get today's plan directly (calls Edge Function for today only) ──

  async getTodayPlan(userId: string, availableMinutes = 45): Promise<DayPlan | null> {
    const plan = await this.getWeeklyPlan(userId, { availableMinutesPerDay: availableMinutes });
    return this.getTodayFromPlan(plan);
  }

  // ── Get vrata days in the next N days ──
  // Local computation — no Edge Function needed.

  getUpcomingVratas(days = 14): Array<{ date: string; vaara: string; vrata: string }> {
    const result = [];
    const today  = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < days; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      const p = localPanchang(d);
      if (p.vrata) {
        result.push({
          date:  d.toISOString().split('T')[0],
          vaara: p.vaara,
          vrata: p.vrata,
        });
      }
    }
    return result;
  }

  // ── Save a plan to recommendations table for caching ──

  async cachePlan(userId: string, plan: WeeklyPlan): Promise<void> {
    await this.supabase.from('recommendations').upsert({
      user_id:        userId,
      type:           'weekly_plan',
      content:        plan,
      generated_at:   plan.generated_at,
      valid_until:    (() => {
        const d = new Date();
        d.setDate(d.getDate() + 7);
        return d.toISOString();
      })(),
    }, { onConflict: 'user_id,type' });
  }

  // ── Load cached plan (avoid re-generating mid-week) ──

  async getCachedPlan(userId: string): Promise<WeeklyPlan | null> {
    const { data } = await this.supabase
      .from('recommendations')
      .select('content, valid_until')
      .eq('user_id', userId)
      .eq('type', 'weekly_plan')
      .single();

    if (!data) return null;

    // Return null if stale
    if (data.valid_until && new Date(data.valid_until) < new Date()) return null;

    return data.content as WeeklyPlan;
  }

  // ── Get or generate — checks cache first ──

  async getOrGeneratePlan(userId: string, options: GetPlanOptions = {}): Promise<WeeklyPlan> {
    const cached = await this.getCachedPlan(userId);
    if (cached) return cached;

    const plan = await this.getWeeklyPlan(userId, options);
    await this.cachePlan(userId, plan);
    return plan;
  }
}
