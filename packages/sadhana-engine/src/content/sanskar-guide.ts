// ============================================================
// Sanskar Guide — 16 Lifecycle Ritual Guides (Phase 4)
//
// Browse all 16 sanskaras, get AI-personalised vidhi guides,
// and track family sanskar milestones.
//
// Usage:
//   const sg = new SanskarGuide(supabase, config);
//   const all = await sg.getAll();
//   const guide = await sg.getGuide(userId, 'namakarana', {
//     beneficiaryName: 'Arjun',
//     beneficiaryDob: '2026-03-15',
//   });
//   await sg.recordSanskar(userId, sanskar.id, { scheduledDate: '2026-04-20' });
//   const upcoming = await sg.getUpcoming(userId);
// ============================================================

import type { SupabaseClient } from '@supabase/supabase-js';
import type { SadhanaEngineConfig } from '../types';

export type SanskarLifeStage =
  | 'prenatal'
  | 'birth'
  | 'infancy'
  | 'childhood'
  | 'education'
  | 'adulthood'
  | 'marriage'
  | 'elder'
  | 'death';

export interface Sanskar {
  id: string;
  slug: string;
  sequence_number: number;
  name: string;
  name_sanskrit: string | null;
  name_meaning: string | null;
  life_stage: SanskarLifeStage;
  typical_age: string | null;
  significance: string;
  presiding_deity: string | null;
  key_mantras: string[] | null;
  samagri: string[] | null;
  vidhi_steps: Array<{ step: number; title: string; description: string }>;
  duration_hours: number | null;
  priest_required: boolean;
  can_self_perform: boolean;
  notes: string | null;
}

export interface SanskarMantra {
  mantra: string;
  meaning: string;
  when_to_chant: string;
}

export interface SanskarGuideResult {
  guide: string;
  preparation: string | null;
  vidhi_steps: Array<{ step: number; title: string; description: string; duration_min?: number }>;
  samagri: string[];
  mantras: SanskarMantra[];
  muhurta_tips: string;
  priest_guidance: string;
  diaspora_note: string | null;
  sanskar: Sanskar;
  today_tithi: string;
  generated_at: string;
}

export interface UserSanskar {
  id: string;
  user_id: string;
  sanskar_id: string;
  beneficiary_name: string | null;
  beneficiary_dob: string | null;
  status: 'planned' | 'in_progress' | 'completed';
  scheduled_date: string | null;
  completed_date: string | null;
  priest_name: string | null;
  location: string | null;
  notes: string | null;
  family_members: string[] | null;
  created_at: string;
}

export interface GetGuideOptions {
  beneficiaryName?: string;
  beneficiaryDob?: string;
  familyTradition?: string;
  languagePref?: 'english' | 'hindi' | 'sanskrit';
}

export interface RecordSanskarOptions {
  beneficiaryName?: string;
  beneficiaryDob?: string;
  scheduledDate?: string;
  priestName?: string;
  location?: string;
  notes?: string;
  familyMembers?: string[];
}

// Life stage ordering for display
const LIFE_STAGE_ORDER: SanskarLifeStage[] = [
  'prenatal', 'birth', 'infancy', 'childhood',
  'education', 'adulthood', 'marriage', 'elder', 'death',
];

export class SanskarGuide {
  private supabase: SupabaseClient;
  private config: SadhanaEngineConfig;

  constructor(supabase: SupabaseClient, config: SadhanaEngineConfig) {
    this.supabase = supabase;
    this.config   = config;
  }

  // ── Browse all 16 sanskaras ──

  async getAll(): Promise<Sanskar[]> {
    const { data } = await this.supabase
      .from('sanskars')
      .select('*')
      .order('sequence_number');

    return (data ?? []) as Sanskar[];
  }

  // ── Get by life stage ──

  async getByLifeStage(stage: SanskarLifeStage): Promise<Sanskar[]> {
    const { data } = await this.supabase
      .from('sanskars')
      .select('*')
      .eq('life_stage', stage)
      .order('sequence_number');

    return (data ?? []) as Sanskar[];
  }

  // ── Get a single sanskar ──

  async getBySlug(slug: string): Promise<Sanskar | null> {
    const { data } = await this.supabase
      .from('sanskars')
      .select('*')
      .eq('slug', slug)
      .single();
    return data as Sanskar | null;
  }

  async getById(id: string): Promise<Sanskar | null> {
    const { data } = await this.supabase
      .from('sanskars')
      .select('*')
      .eq('id', id)
      .single();
    return data as Sanskar | null;
  }

  // ── All 16 grouped by life stage ──
  // Useful for the "lifecycle timeline" UI.

  async getGroupedByStage(): Promise<Record<SanskarLifeStage, Sanskar[]>> {
    const all = await this.getAll();
    const grouped = {} as Record<SanskarLifeStage, Sanskar[]>;

    for (const stage of LIFE_STAGE_ORDER) {
      grouped[stage] = all.filter(s => s.life_stage === stage);
    }
    return grouped;
  }

  // ── AI-personalised vidhi guide ──
  // Calls ai-sanskar-guide Edge Function with Gemini.

  async getGuide(
    userId: string,
    sanskarSlug: string,
    options: GetGuideOptions = {}
  ): Promise<SanskarGuideResult | null> {
    try {
      const { data, error } = await this.supabase.functions.invoke('ai-sanskar-guide', {
        body: {
          user_id:          userId,
          sanskar_slug:     sanskarSlug,
          beneficiary_name: options.beneficiaryName,
          beneficiary_dob:  options.beneficiaryDob,
          family_tradition: options.familyTradition,
          language_pref:    options.languagePref ?? 'english',
        },
      });
      if (error) throw error;
      return data as SanskarGuideResult;
    } catch (err) {
      if (this.config.debug) console.error('[SanskarGuide] getGuide failed:', err);

      // Fallback: return static content from DB
      const sanskar = await this.getBySlug(sanskarSlug);
      if (!sanskar) return null;

      return {
        guide:           `${sanskar.name} (${sanskar.name_sanskrit ?? ''}) — ${sanskar.significance}`,
        preparation:     null,
        vidhi_steps:     sanskar.vidhi_steps,
        samagri:         sanskar.samagri ?? [],
        mantras:         (sanskar.key_mantras ?? []).map(m => ({ mantra: m, meaning: '', when_to_chant: 'Throughout the ceremony' })),
        muhurta_tips:    'Consult a Vedic astrologer or panchang for the most auspicious muhurta.',
        priest_guidance: sanskar.priest_required
          ? 'A qualified Vedic priest is required. Contact your local temple.'
          : 'This can be performed by the family.',
        diaspora_note:   null,
        sanskar,
        today_tithi:     '',
        generated_at:    new Date().toISOString(),
      };
    }
  }

  // ── Record a sanskar for a user / family member ──

  async recordSanskar(
    userId: string,
    sanskarId: string,
    options: RecordSanskarOptions = {}
  ): Promise<UserSanskar | null> {
    const { data, error } = await this.supabase
      .from('user_sanskars')
      .insert({
        user_id:          userId,
        sanskar_id:       sanskarId,
        beneficiary_name: options.beneficiaryName ?? null,
        beneficiary_dob:  options.beneficiaryDob ?? null,
        scheduled_date:   options.scheduledDate ?? null,
        priest_name:      options.priestName ?? null,
        location:         options.location ?? null,
        notes:            options.notes ?? null,
        family_members:   options.familyMembers ?? null,
        status:           options.scheduledDate ? 'planned' : 'completed',
        completed_date:   options.scheduledDate ? null : new Date().toISOString().split('T')[0],
      })
      .select()
      .single();

    if (error) {
      if (this.config.debug) console.error('[SanskarGuide] recordSanskar failed:', error.message);
      return null;
    }
    return data as UserSanskar;
  }

  // ── Mark a planned sanskar as completed ──

  async markCompleted(
    userSanskarId: string,
    userId: string,
    options?: { priestName?: string; location?: string; notes?: string }
  ): Promise<boolean> {
    const { error } = await this.supabase
      .from('user_sanskars')
      .update({
        status:         'completed',
        completed_date: new Date().toISOString().split('T')[0],
        priest_name:    options?.priestName,
        location:       options?.location,
        notes:          options?.notes,
      })
      .eq('id', userSanskarId)
      .eq('user_id', userId);

    return !error;
  }

  // ── Get user's sanskar history ──

  async getHistory(userId: string): Promise<(UserSanskar & { sanskar: Sanskar })[]> {
    const { data } = await this.supabase
      .from('user_sanskars')
      .select('*, sanskar:sanskars(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    return (data ?? []) as (UserSanskar & { sanskar: Sanskar })[];
  }

  // ── Get upcoming planned sanskars ──

  async getUpcoming(userId: string): Promise<(UserSanskar & { sanskar: Sanskar })[]> {
    const { data } = await this.supabase
      .from('user_sanskars')
      .select('*, sanskar:sanskars(*)')
      .eq('user_id', userId)
      .eq('status', 'planned')
      .order('scheduled_date');

    return (data ?? []) as (UserSanskar & { sanskar: Sanskar })[];
  }

  // ── Get completed sanskars ──

  async getCompleted(userId: string): Promise<(UserSanskar & { sanskar: Sanskar })[]> {
    const { data } = await this.supabase
      .from('user_sanskars')
      .select('*, sanskar:sanskars(*)')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .order('completed_date', { ascending: false });

    return (data ?? []) as (UserSanskar & { sanskar: Sanskar })[];
  }

  // ── Get next recommended sanskar ──
  // Based on user age or date of birth. Simple heuristic.

  async getRecommended(userId: string, userDob?: string): Promise<Sanskar[]> {
    const completed = await this.getCompleted(userId);
    const completedIds = new Set(completed.map(c => c.sanskar_id));
    const all = await this.getAll();

    // Filter out already completed
    const remaining = all.filter(s => !completedIds.has(s.id));

    // If DOB provided, filter by age-appropriate sanskaras
    if (userDob) {
      const ageYears = Math.floor(
        (Date.now() - new Date(userDob).getTime()) / (365.25 * 24 * 3600 * 1000)
      );
      const stageForAge = (age: number): SanskarLifeStage[] => {
        if (age < 0.25) return ['birth', 'infancy'];
        if (age < 1)    return ['infancy'];
        if (age < 5)    return ['infancy', 'childhood'];
        if (age < 12)   return ['childhood', 'education'];
        if (age < 25)   return ['education', 'adulthood'];
        if (age < 50)   return ['adulthood', 'marriage'];
        return ['elder'];
      };
      const stages = stageForAge(ageYears);
      return remaining.filter(s => stages.includes(s.life_stage)).slice(0, 3);
    }

    return remaining.slice(0, 5);
  }
}
